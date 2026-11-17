#!/usr/bin/env node
/**
 * 生成 oracle 差分向量：用现网 JS 实现算期望值，存成
 * `testdata/oracle-vectors.json`，由 Rust 侧 `tests/oracle_diff.rs` 逐条比对。
 *
 * 两种取期望值的方式，oracle 是同一份 `testdata/jsref/modules.cjs`：
 * 1. 批量 op（cch / wire / cache / betas …）走 `ref.cjs` 的一次性批处理；
 * 2. 新 op（layout / resolveTtl / boundedIndex / apiGates）直接调 `modules.cjs`
 *    导出的函数（`ref.cjs` 没有对应分支，且不应为了跑测试去改它）。
 *
 * 用例是**确定性**的（固定种子 LCG），重复生成结果一致。
 *
 * 用法：node tools/gen-oracle-vectors.mjs [--out <path>]
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const jsrefDir = path.resolve(root, '../testdata/jsref')
const outFlag = process.argv.indexOf('--out')
const outPath = outFlag >= 0 ? process.argv[outFlag + 1] : path.join(root, 'testdata/oracle-vectors.json')

const oracle = createRequire(import.meta.url)(path.join(jsrefDir, 'modules.cjs'))

// 固定种子 LCG：保证向量可复现
let seed = 0x1f2e3d4c
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}
const pick = (items) => items[Math.floor(rand() * items.length) % items.length]
const int = (min, max) => min + Math.floor(rand() * (max - min + 1))

const BILLING = (cch = 'abcde', extra = '') =>
  `x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli; cch=${cch};${extra}`

const MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1', 'claude-opus-5', 'mystery-model']

/** 在给定 env 下求值（null 表示删除该变量）。 */
function withEnv(env, fn) {
  const saved = new Map()
  for (const [key, value] of Object.entries(env || {})) {
    saved.set(key, process.env[key])
    if (value === null || value === undefined) delete process.env[key]
    else process.env[key] = String(value)
  }
  try {
    return fn()
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

const refCases = []
const direct = [] // { case, expected }

function randomBody(forceBilling = false) {
  const billingSystems = [
    BILLING(),
    BILLING('00000'),
    [BILLING()],
    [{ type: 'text', text: BILLING() }, { type: 'text', text: 'keep', cache_control: { type: 'ephemeral' } }],
    [BILLING('abcde', ' cc_prev_req=req_1;')],
  ]
  const system = forceBilling
    ? pick(billingSystems)
    : pick([
        BILLING(),
        BILLING('00000'),
        [BILLING(), 'plain block', 'another'],
        [{ type: 'text', text: BILLING() }, { type: 'text', text: 'keep', cache_control: { type: 'ephemeral' } }],
        [{ type: 'text', text: 'no billing here' }],
        [],
        '',
        123,
        null,
      ])
  const body = {
    model: pick(MODELS),
    system,
    messages: pick([
      [{ role: 'user', content: 'hi' }],
      [{ role: 'user', content: [{ type: 'text', text: 'a' }] }],
      [],
    ]),
  }
  if (rand() > 0.3) body.max_tokens = pick([1, 8, 4096, 64000, 128000, 2147483647])
  if (rand() > 0.7) body.fallbacks = pick([[{ model: 'x' }], [], [{ nested: [']', '['] }]])
  if (rand() > 0.7) body.fallback_credit_token = pick(['tok', 'to"ken', 'a'.repeat(64)])
  if (rand() > 0.8) body.metadata = { user_id: pick(['u1', 'u"2', 'ünïcode']) }
  if (rand() > 0.85) body['weird key'] = pick(['v', { deep: { deeper: [1, 2, 3] } }])
  return JSON.stringify(body)
}

function randomSystem() {
  return pick([
    [{ type: 'text', text: BILLING() }],
    [{ type: 'text', text: BILLING() }, { type: 'text', text: 'second', cache_control: { type: 'ephemeral' } }],
    [{ type: 'text', text: 'no billing' }, { type: 'text', text: 'x' }],
    [{ type: 'text' }],
    [{ text: 'no type field' }],
    ['plain string block'],
    'a string system',
    [],
    null,
  ])
}

function randomHeader() {
  return pick([
    BILLING(),
    BILLING('00000'),
    'x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli;',
    'x-anthropic-billing-header:',
    'x-anthropic-billing-header: cc_version=2.1.303; cch=12345; cch=abcde;',
    'x-anthropic-billing-header: cc_version=2.1.303; prompt_version=<abc>; cch=abcde;',
    'X-ANTHROPIC-BILLING-HEADER: CC_VERSION=2.1.303; CCH=ABCDE;',
    '  x-anthropic-billing-header:   spaced out;  cch=zzzzz;',
    'not a billing header at all',
    '',
  ])
}

function randomMarkerParams() {
  const block = (text) => {
    const node = { type: 'text', text }
    if (rand() > 0.45)
      node.cache_control = pick([
        { type: 'ephemeral' },
        { type: 'ephemeral', ttl: '5m' },
        { type: 'ephemeral', ttl: '1h' },
        { type: 'ephemeral', scope: 'global' },
        { type: 'ephemeral', scope: 'org', ttl: '1h' },
        { type: 'persistent' },
      ])
    return node
  }
  const messages = []
  const messageCount = int(0, 3)
  for (let i = 0; i < messageCount; i += 1) {
    const content = []
    for (let j = 0; j < int(0, 3); j += 1) {
      content.push(
        rand() > 0.85
          ? { type: pick(['thinking', 'redacted_thinking']), thinking: 'x', cache_control: { type: 'ephemeral' } }
          : block(`m${i}${j}`),
      )
    }
    messages.push({ role: pick(['user', 'assistant']), content: rand() > 0.9 ? `text ${i}` : content })
  }
  return {
    system: rand() > 0.3 ? [block('s0'), block('s1')] : 'string system',
    tools: rand() > 0.4 ? [block('t0'), block('t1')] : undefined,
    messages,
  }
}

// ---- 批量 op：走 ref.cjs ----
for (let i = 0; i < 60; i += 1) refCases.push({ op: 'cch', body: randomBody(i < 45) })
for (let i = 0; i < 20; i += 1) {
  const text = randomHeader()
  refCases.push({ op: 'cchPlaceholder', text })
  refCases.push({ op: 'cchPlaceholderInPlace', text })
}
for (let i = 0; i < 30; i += 1) refCases.push({ op: 'wire', system: randomSystem(), profile: rand() > 0.5 })
for (let i = 0; i < 20; i += 1) {
  const system = []
  const size = int(0, 5)
  for (let j = 0; j < size; j += 1) {
    system.push(
      pick([
        BILLING(),
        "You are a Claude agent, built on Anthropic's Claude Agent SDK.",
        '# Environment\n - Timezone: UTC',
        'persistent Crag tools',
        'mcp__runtime__x',
        'keep me',
        '',
        '   ',
      ]),
    )
  }
  refCases.push({ op: 'leftover', system })
}
for (let i = 0; i < 10; i += 1) refCases.push({ op: 'zero', text: randomHeader() })
for (let i = 0; i < 15; i += 1) {
  const parts = []
  const size = int(0, 3)
  for (let j = 0; j < size; j += 1) {
    parts.push(
      pick([
        { cache_control: { type: 'ephemeral', ttl: '5m' } },
        { cache_control: { type: 'ephemeral', ttl: '1h' } },
        { cache_control: { type: 'ephemeral' } },
        { content: [{ cache_control: { type: 'ephemeral', ttl: '1h' } }] },
        { nothing: true },
      ]),
    )
  }
  refCases.push({ op: 'explicitTtl', parts })
}
for (let i = 0; i < 40; i += 1) {
  refCases.push({
    op: 'cache',
    params: randomMarkerParams(),
    ttl: pick(['5m', '1h', 'bogus', '']),
    preserve: {
      preserveSystem: rand() > 0.6,
      preserveMessages: rand() > 0.6,
      preserveTools: rand() > 0.6,
    },
  })
}
for (let i = 0; i < 50; i += 1) {
  const body = {}
  if (rand() > 0.1) body.model = pick([...MODELS, 'claude-opus-5-5-20260101', 'us.anthropic.claude-opus-5-5[1m]', ''])
  if (rand() > 0.6) body.thread = pick(['t1', {}])
  if (rand() > 0.6) body.output_config = pick([{ effort: 'high' }, { format: { type: 'json' } }, { task_budget: 5 }, {}])
  if (rand() > 0.7) body.thinking = pick([{ display: 'updates' }, { block_binding: true }, {}])
  if (rand() > 0.85) body.safeguards = [{ type: 'dangerous_tool_use' }]
  if (rand() > 0.6) body.context_management = {}
  if (rand() > 0.85) body.speed = 'fast'
  if (rand() > 0.6) body.tools = pick([[{ strict: true }], [{ defer_loading: true }], [{ type: 'tool_search_tool_x' }], []])
  if (rand() > 0.7) body.diagnostics = {}
  if (rand() > 0.7) body.fallbacks = pick(['default', [{ x: 1 }], []])
  if (rand() > 0.7) body.fallback_credit_token = pick(['tok', '', 'a'.repeat(3000)])
  if (rand() > 0.75) body.cache_control = { evict_on_complete: true }
  if (rand() > 0.6)
    body.messages = pick([
      [{ role: 'system', content: 'x' }],
      [{ role: 'user', clear_at: 5, content: 'x' }],
      [{ role: 'user', output_config: { effort: 'low' }, content: 'x' }],
      [{ role: 'user', content: [{ type: 'text', text: 'x', cache_control: { type: 'ephemeral', ttl: '1h' } }] }],
      [],
    ])
  const tokens = []
  for (let j = 0; j < int(0, 4); j += 1) tokens.push(pick(['claude-code-20250219', 'effort-2025-11-24', 'custom-2026', '']))
  refCases.push({ op: 'betas', tokens, body, merge: rand() > 0.7 })
}
for (let i = 0; i < 12; i += 1) {
  const tokens = []
  for (let j = 0; j < int(0, 4); j += 1) {
    tokens.push(pick(['claude-code-20250219', 'oauth-2025-04-20', 'effort-2025-11-24', 'thinking-token-count-2026-05-13', 'custom-2026']))
  }
  refCases.push({ op: 'merge', tokens })
}
for (let i = 0; i < 10; i += 1) {
  refCases.push({ op: 'setupBetas', model: pick([...MODELS, 'claude-3-5-haiku', 'claude-3-haiku', '']) })
}

// ---- 新 op：直接调 modules.cjs ----
for (let i = 0; i < 24; i += 1) {
  const layout = pick(['stock', 'identity', 'zero'])
  const timezone = pick(['UTC', 'America/New_York', 'Asia/Shanghai'])
  const attribution = pick([BILLING(), BILLING('00000'), '', '   '])
  const leftover = pick([null, 'keep me', 'a' + String.fromCharCode(10, 10) + 'b'])
  const expected = withEnv(
    { CLAUDE_CODE_SYSTEM_LAYOUT: layout, CLAUDE_CODE_TIMEZONE: timezone, SYSTEM_MODE: null },
    () => oracle.layoutSystemBlocks({ attribution, leftover: leftover ?? undefined }),
  )
  direct.push({ case: { op: 'layout', layout, timezone, attribution, leftover }, expected })
}
for (let i = 0; i < 15; i += 1) {
  const opt = {}
  if (rand() > 0.4) opt.system = pick([{ cache_control: { type: 'ephemeral', ttl: '1h' } }, { x: 1 }])
  if (rand() > 0.4) opt.tools = pick([{ cache_control: { type: 'ephemeral', ttl: '5m' } }, []])
  if (rand() > 0.4) opt.messages = pick([{ content: [{ cache_control: { type: 'ephemeral', ttl: '1h' } }] }, []])
  if (rand() > 0.4) opt.panelTtl = pick(['5m', '1h', '', 'bogus', null])
  direct.push({ case: { op: 'resolveTtl', opt }, expected: oracle.resolveKinCacheTtl(opt) })
}
for (let i = 0; i < 20; i += 1) {
  const value = pick([0, 1, 5, -1, 3.5, 10000000, 10000001, null])
  const min = pick([0, 1])
  const expected = oracle.boundedBillingIndex(value, min)
  direct.push({ case: { op: 'boundedIndex', value, min }, expected: expected === undefined ? null : expected })
}
for (const provider of ['firstParty', 'bedrock', 'vertex', 'foundry']) {
  for (const subscriber of [true, false]) {
    const expected = withEnv(
      {
        CLAUDE_CODE_USE_BEDROCK: provider === 'bedrock' ? '1' : null,
        CLAUDE_CODE_USE_VERTEX: provider === 'vertex' ? '1' : null,
        CLAUDE_CODE_USE_FOUNDRY: provider === 'foundry' ? '1' : null,
      },
      () => oracle.attributionGates(subscriber),
    )
    direct.push({ case: { op: 'apiGates', provider, subscriber }, expected })
  }
}

for (let i = 0; i < 30; i += 1) {
  const enabled = rand() > 0.2
  const versionEnv = pick(['2.1.303', '2.1.88', 'v2.1.303-extra', ''])
  const opts = {
    includeCch: rand() > 0.5,
    includeSubscriberFields: rand() > 0.4,
    isSubagent: rand() > 0.5,
    prevReqId: pick([undefined, 'req_abc', 'req_-', 'bad id', 'req_' + 'x'.repeat(40)]),
    promptId: pick([undefined, '11111111-2222-3333-4444-555555555555', 'not-a-uuid', '']),
    turnOrigin: pick([undefined, 'main', 'side_reply', 'Bad', 'x'.repeat(40)]),
    promptIndex: pick([undefined, 0, 5, -1, 3.7, 10000001]),
    turnIndex: pick([undefined, 1, 7, -2, 10000000]),
  }
  const expected = withEnv(
    { CLAUDE_CODE_ATTRIBUTION_HEADER: enabled ? null : '0', CLAUDE_CODE_VERSION: versionEnv },
    () => oracle.getAttributionHeader('fp123', opts),
  )
  const version = withEnv({ CLAUDE_CODE_VERSION: versionEnv }, () => oracle.officialCliVersion())
  direct.push({
    case: { op: 'attribution', enabled, version, fingerprint: 'fp123', opts },
    expected,
  })
}

for (let i = 0; i < 20; i += 1) {
  const system = pick([
    'plain system',
    [{ type: 'text', text: BILLING() }, { type: 'text', text: 'keep' }],
    [{ type: 'text', text: '  ' + BILLING() }],
    [{ type: 'text', text: 'no billing' }],
    [],
  ])
  const attribution2 = pick([null, BILLING(), 'attr text'])
  direct.push({
    case: { op: 'classifierSystem', system, attribution: attribution2 },
    expected: oracle.classifierSystemBlocks(system, attribution2 ?? undefined),
  })
}
for (let i = 0; i < 24; i += 1) {
  const ctx = pick([
    undefined,
    null,
    'not an object',
    { purpose: 'auto_mode_classifier', format: pick(['tool', 'xml', 'other']) },
    { purpose: 'other', format: 'xml' },
    { purpose: 'auto_mode_classifier', format: 'tool', stage: pick(['xml_s1', 'fast']) },
    { purpose: 'auto_mode_classifier', format: 'tool', extra: 1 },
    { purpose: 'auto_mode_classifier', format: 'xml', stage: pick(['xml_s1', 'xml_s2', 'fast', 'nope']) },
    { purpose: 'auto_mode_classifier', format: 'xml', stage: pick([undefined, null]) },
  ])
  const request = pick([
    {},
    { tool_choice: { type: 'tool', name: 'classify_result' }, tools: [{ name: 'classify_result' }] },
    { tool_choice: { type: 'tool', name: 'other' }, tools: [{ name: 'other' }] },
    { tools: [{ name: 'classify_result' }] },
    { tool_choice: null, messages: [{ role: 'user', content: '<transcript>x' }] },
    { messages: [{ role: 'user', content: '<transcript>x' }] },
    { messages: [{ role: 'user', content: 'plain' }] },
  ])
  const expected = withEnv({}, () => oracle.validClassifierContext(ctx, request))
  direct.push({ case: { op: 'classifierValid', ctx, request }, expected })
}

for (const flags of [
  [true, false, false],
  [false, true, false],
  [false, false, true],
  [false, false, false],
  [true, true, true],
  [false, true, true],
]) {
  const [bedrock, vertex, foundry] = flags
  const expected = withEnv(
    {
      CLAUDE_CODE_USE_BEDROCK: bedrock ? '1' : null,
      CLAUDE_CODE_USE_VERTEX: vertex ? 'TRUE' : null,
      CLAUDE_CODE_USE_FOUNDRY: foundry ? 'yes' : null,
    },
    () => oracle.getAPIProvider(),
  )
  direct.push({ case: { op: 'apiProvider', bedrock, vertex, foundry }, expected })
}
for (const raw of ['', '2.1.303', 'v2.1.88-extra', 'nonsense', '  2.1.5  ', '2.1', '1.2.3.4']) {
  const expected = withEnv({ CLAUDE_CODE_VERSION: raw }, () => oracle.officialCliVersion())
  direct.push({ case: { op: 'cliVersion', raw, default: '2.1.303' }, expected })
}

// ---- 批量求值 + 合并 ----
const raw = execFileSync('node', [path.join(jsrefDir, 'ref.cjs')], {
  input: JSON.stringify(refCases),
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
const refExpected = JSON.parse(raw).map((text) => JSON.parse(text))
if (refExpected.length !== refCases.length) throw new Error('oracle 输出长度不一致')

const vectors = [
  ...refCases.map((item, index) => ({ ...item, expected: refExpected[index] })),
  ...direct.map(({ case: item, expected }) => ({ ...item, expected })),
]
fs.writeFileSync(outPath, `${JSON.stringify(vectors, null, 1)}\n`)
console.log(`wrote ${path.relative(root, outPath)}: ${vectors.length} vectors`)
