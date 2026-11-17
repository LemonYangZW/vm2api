#!/usr/bin/env node
/**
 * 生成 `src/protocol/tables.rs` —— 协议数据表的唯一来源是现网 `protocol303.mjs`。
 *
 * 为什么生成而不是手抄：这些表每个上游版本都会变（§7.3「协议数据表」是低成本
 * 可迭代层），手抄必然漂移；生成 + `--check` 能让漂移在 CI 里立刻炸掉。
 *
 * 用法：
 *   node tools/gen-protocol-tables.mjs            # 写 src/protocol/tables.rs
 *   node tools/gen-protocol-tables.mjs --check    # 只比对，漂移则退出码 1
 *   node tools/gen-protocol-tables.mjs --source <path/to/protocol303.mjs>
 *
 * 默认源：`git show origin/fix/sqlite-off-event-loop:share/crag-v2/runtime/protocol303.mjs`
 * （该分支是上游最后一次随分支发布的明文形态；换基线时用 --source 指定新文件）。
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const target = path.join(root, 'src/protocol/tables.rs')

const args = process.argv.slice(2)
const check = args.includes('--check')
const sourceFlag = args.indexOf('--source')
const DEFAULT_SOURCE = 'origin/fix/sqlite-off-event-loop:share/crag-v2/runtime/protocol303.mjs'

function readSource() {
  if (sourceFlag >= 0) {
    const file = args[sourceFlag + 1]
    if (!file) throw new Error('--source 需要文件路径')
    return { text: fs.readFileSync(file, 'utf8'), origin: file }
  }
  const text = execFileSync('git', ['show', DEFAULT_SOURCE], {
    cwd: root,
    maxBuffer: 32 * 1024 * 1024,
    encoding: 'utf8',
  })
  return { text, origin: DEFAULT_SOURCE }
}

function rustStr(value) {
  return JSON.stringify(value).replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    JSON.stringify(String.fromCharCode(parseInt(hex, 16))).slice(1, -1),
  )
}

function optStr(value) {
  return value == null ? 'None' : `Some(${rustStr(String(value))})`
}

function parseMaxOutput(raw) {
  const out = { default: 0, upper: 0 }
  for (const part of String(raw ?? '').split(',')) {
    const [key, value] = part.split(':')
    if (key && value && key in out) out[key] = Number(value) || 0
  }
  return out
}

function slice(items, indent = '    ') {
  if (items.length === 0) return '&[]'
  return `&[\n${items.map((item) => `${indent}    ${rustStr(item)},`).join('\n')}\n${indent}]`
}

function main() {
  const { text, origin } = readSource()
  const digest = crypto.createHash('sha256').update(text).digest('hex')

  // 源是 ESM，写入临时目录后动态 import（它只依赖 node 内置模块）。
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cragv2-tables-'))
  const tmpFile = path.join(tmpDir, 'protocol303.mjs')
  fs.writeFileSync(tmpFile, text)
  return import(pathToFileURL(tmpFile).href).then((m) => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    const rust = render(m, { origin, digest })
    if (check) {
      const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : ''
      if (current !== rust) {
        console.error('tables.rs 与现网数据表不一致，请重新生成：node tools/gen-protocol-tables.mjs')
        process.exit(1)
      }
      console.log('tables.rs 与现网数据表一致')
      return
    }
    fs.writeFileSync(target, rust)
    console.log(`wrote ${path.relative(root, target)} (${m.MODELS.length} models, ${Object.keys(m.BETA_REGISTRY).length} betas)`)
  })
}

function render(m, { origin, digest }) {
  const models = m.MODELS.map((model) => {
    const max = parseMaxOutput(
      [`default:${model.maxOutputTokens?.default ?? 0}`, `upper:${model.maxOutputTokens?.upper ?? 0}`].join(','),
    )
    return `    ModelEntry {
        id: ${rustStr(model.id)},
        display_name: ${rustStr(model.displayName ?? model.id)},
        default_effort: ${optStr(model.defaultEffort)},
        capabilities: ${slice(model.capabilities ?? [])},
        max_output_default: ${max.default},
        max_output_upper: ${max.upper},
        fallback_3p: ${optStr(model.fallback3p)},
        knowledge_cutoff: ${rustStr(model.knowledgeCutoff ?? '')},
    },`
  })

  const aliases = Object.entries(m.ALIASES).map(
    ([name, value]) => `    (${rustStr(name)}, ${rustStr(value.default)}),`,
  )
  const perProvider = Object.entries(m.ALIASES).map(([name, value]) => {
    const rows = Object.entries(value.per_provider ?? {}).map(
      ([provider, id]) => `            (${rustStr(provider)}, ${rustStr(id)}),`,
    )
    return `    (
        ${rustStr(name)},
        &[
${rows.join('\n')}
        ],
    ),`
  })
  const latest = Object.entries(m.LATEST_PER_FAMILY).map(
    ([family, id]) => `    (${rustStr(family)}, ${rustStr(id)}),`,
  )
  const betas = Object.entries(m.BETA_REGISTRY).map(
    ([name, header]) => `    (${rustStr(name)}, ${rustStr(header)}),`,
  )
  const permissionEngine = Object.entries(m.PERMISSION_MODE_ENGINE ?? {}).map(
    ([from, to]) => `    (${rustStr(from)}, ${rustStr(to)}),`,
  )
  const skip = [...(m.ENV_BETA_SKIP ?? [])].map((item) => `    ${rustStr(item)},`)

  return `//! 协议数据表 —— **自动生成，请勿手改**。
//!
//! 生成器：\`tools/gen-protocol-tables.mjs\`
//! 数据源：\`${origin}\`
//! 源 sha256：\`${digest}\`
//!
//! 换上游版本时：\`node tools/gen-protocol-tables.mjs\`，然后跑 \`cargo test\`
//! （\`tables_match_source\` 会在源与常量不一致时失败）。

/// 一个可出站的模型条目。
#[derive(Debug, Clone, Copy)]
pub struct ModelEntry {
    pub id: &'static str,
    pub display_name: &'static str,
    pub default_effort: Option<&'static str>,
    pub capabilities: &'static [&'static str],
    pub max_output_default: u32,
    pub max_output_upper: u32,
    pub fallback_3p: Option<&'static str>,
    pub knowledge_cutoff: &'static str,
}

impl ModelEntry {
    pub fn has(&self, capability: &str) -> bool {
        self.capabilities.iter().any(|c| *c == capability)
    }
}

/// \`${origin}\` 的 MODELS 表（顺序即目录顺序）。
pub const MODELS: &[ModelEntry] = &[
${models.join('\n')}
];

/// alias → 默认 provider 下的模型 id。
pub const ALIASES: &[(&str, &str)] = &[
${aliases.join('\n')}
];

/// alias → 各 provider 下的模型 id（未列出的 provider 走 \`ALIASES\`）。
pub const ALIASES_PER_PROVIDER: &[(&str, &[(&str, &str)])] = &[
${perProvider.join('\n')}
];

/// 家族 → 该家族 latest 代表。
pub const LATEST_PER_FAMILY: &[(&str, &str)] = &[
${latest.join('\n')}
];

/// 命名 beta 注册表（name → 出站 header 值）。
pub const BETA_REGISTRY: &[(&str, &str)] = &[
${betas.join('\n')}
];

/// \`LU()\` 从 \`ANTHROPIC_BETAS\` 里剔除的通常可用 header。
pub const ENV_BETA_SKIP: &[&str] = &[
${skip.join('\n')}
];

/// 2.1.303 CLI 的 effort 档位。
pub const EFFORT_LEVELS: &[&str] = ${slice(m.EFFORT_LEVELS ?? [], '')};

/// thinking 模式。
pub const THINKING_MODES: &[&str] = ${slice(m.THINKING_MODES ?? [], '')};

/// thinking 展示形态。
pub const THINKING_DISPLAYS: &[&str] = ${slice(m.THINKING_DISPLAYS ?? [], '')};

/// 2.1.303 的 permission mode（\`manual\` 在 88 引擎里叫 \`default\`）。
pub const PERMISSION_MODES_303: &[&str] = ${slice(m.PERMISSION_MODES_303 ?? [], '')};

/// permission mode 到 88 引擎名的映射。
pub const PERMISSION_MODE_ENGINE: &[(&str, &str)] = &[
${permissionEngine.join('\n')}
];

/// 请求类别（\`x-claude-code-request-class\`）。
pub const REQUEST_CLASSES: &[&str] = ${slice(m.REQUEST_CLASSES ?? [], '')};

/// 工程来源（\`cc_project_src\`）。
pub const PROJECT_SOURCES: &[&str] = ${slice(m.PROJECT_SOURCES ?? [], '')};

/// thinking budget 下限。
pub const MIN_THINKING_BUDGET: u32 = ${Number(m.MIN_THINKING_BUDGET ?? 1024)};

/// 数据源标识（诊断用）。
pub const SOURCE: &str = ${rustStr(origin)};
/// 数据源 sha256（诊断用）。
pub const SOURCE_SHA256: &str = ${rustStr(digest)};
`
}

main().catch((error) => {
  console.error(error?.stack || String(error))
  process.exit(1)
})
