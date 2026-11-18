//! 面板补丁：给上游 `src/lib/vm/` 的两处硬编码地址加 env 覆盖。
//!
//! 我们部署的是上游镜像 + 我们自己的内核与授权服务，因此需要：
//! - `CRAG_ACTIVATION_URL`      → 设备兑换码打到我们自己的授权服务
//! - `CRAG_SUBSCRIPTION_ORIGIN` → 宿主席位（剩余可激活槽位）也打我们自己
//!
//! 用法（root 下需有 `src/lib/vm/crag-license.mjs` 与 `crag-subscription.mjs`）：
//!
//!   node panel-patches.mjs --root <解包目录或仓库根>            # 打补丁（幂等）
//!   node panel-patches.mjs --root <解包目录> --write-patches <目录>  # 同时导出 .patch
//!
//! 为什么不用全文件副本：上游改动这两个文件时，整份副本会把上游更新悄悄回退。
//! 这里只做**单行替换 + 锚点断言**，锚点缺失直接失败退出，绝不留半成品。

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const flag = (name, fallback = '') => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback
}

const root = flag('root')
const writePatches = flag('write-patches')
if (!root) {
  console.error('用法: panel-patches.mjs --root <目录> [--write-patches <目录>]')
  process.exit(2)
}

const EDITS = [
  {
    id: '0001-panel-activation-url',
    file: 'src/lib/vm/crag-license.mjs',
    marker: 'CRAG_ACTIVATION_URL',
    from: "const DEVICE_ACTIVATION_URL = 'https://crag.fkcodex.com/v1/device-activation'",
    to:
      "// 自建授权服务时用 CRAG_ACTIVATION_URL 覆盖（默认仍为厂商服务）。\n" +
      "const DEVICE_ACTIVATION_URL =\n" +
      "  (process.env.CRAG_ACTIVATION_URL || '').trim().replace(/[/]+$/, '') ||\n" +
      "  'https://crag.fkcodex.com/v1/device-activation'",
  },
  {
    id: '0002-panel-subscription-origin',
    file: 'src/lib/vm/crag-subscription.mjs',
    marker: 'CRAG_SUBSCRIPTION_ORIGIN',
    from: "const AUTHORITY = 'https://crag.fkcodex.com'",
    to:
      "// 自建授权服务时可指向本地（默认仍为厂商服务）。\n" +
      "const AUTHORITY =\n" +
      "  (process.env.CRAG_SUBSCRIPTION_ORIGIN || '').trim().replace(/[/]+$/, '') ||\n" +
      "  'https://crag.fkcodex.com'",
  },
  {
    id: '0003-panel-swap-unsupported',
    file: 'src/lib/vm/docker-slot-memory.mjs',
    marker: '宿主不支持 swap 限额时 Docker 只报 swapBytes=-1',
    from: '  if (observed.bytes !== requestedBytes || observed.swapBytes !== requestedBytes) {',
    to:
      '  // 宿主不支持 swap 限额时 Docker 只报 swapBytes=-1（视为无上限）；该宿主本身没有
' +
      '  // swap，等价于"禁用 swap"，因此不再判为分歧，否则内存永远改不动。
' +
      '  if (
' +
      '    observed.bytes !== requestedBytes ||
' +
      '    (observed.swapBytes !== requestedBytes && observed.swapBytes !== -1)
' +
      '  ) {',
  },
]

/** 生成只含一处改动的 unified diff（行号按当前文件算，保证可直接 git apply）。 */
function unifiedDiff(relPath, text, from, to) {
  const lines = text.split('\n')
  const at = lines.indexOf(from)
  if (at < 0) return null
  const context = 3
  const start = Math.max(0, at - context)
  const end = Math.min(lines.length, at + 1 + context)
  const oldBlock = lines.slice(start, end)
  const newBlock = [...lines.slice(start, at), ...to.split('\n'), ...lines.slice(at + 1, end)]
  const header = [
    `--- a/${relPath}`,
    `+++ b/${relPath}`,
    `@@ -${start + 1},${oldBlock.length} +${start + 1},${newBlock.length} @@`,
  ]
  const body = [
    ...lines.slice(start, at).map((l) => ` ${l}`),
    `-${from}`,
    ...to.split('\n').map((l) => `+${l}`),
    ...lines.slice(at + 1, end).map((l) => ` ${l}`),
  ]
  return `${[...header, ...body].join('\n')}\n`
}

let failed = 0
for (const edit of EDITS) {
  const target = path.join(root, edit.file)
  if (!fs.existsSync(target)) {
    console.error(`✗ 缺文件 ${edit.file}（--root 指错了？）`)
    failed += 1
    continue
  }
  const text = fs.readFileSync(target, 'utf8')
  if (writePatches) {
    const pristine =
      text.includes(edit.marker) && text.includes(edit.to)
        ? // 已经被我们打过：先还原成上游原始行再产 diff
          text.replace(edit.to, edit.from)
        : text
    const diff = unifiedDiff(edit.file, pristine, edit.from, edit.to)
    if (!diff) {
      console.error(`✗ 锚点缺失，无法生成补丁 ${edit.id}`)
      failed += 1
      continue
    }
    fs.mkdirSync(writePatches, { recursive: true })
    fs.writeFileSync(path.join(writePatches, `${edit.id}.patch`), diff)
    console.log(`✓ 生成 ${edit.id}.patch`)
  }
  if (text.includes(edit.marker)) {
    console.log(`· 跳过 ${edit.file}（已有 ${edit.marker}）`)
    continue
  }
  if (!text.includes(edit.from)) {
    console.error(`✗ 锚点缺失 ${edit.file}：上游可能改写了这一行，需人工核对后更新锚点`)
    failed += 1
    continue
  }
  fs.writeFileSync(target, text.replace(edit.from, edit.to))
  console.log(`✓ 已打补丁 ${edit.file}`)
}

// 打完必须语法自检：上游升级时这是唯一能挡住 crash loop 的关口。
for (const edit of EDITS) {
  const target = path.join(root, edit.file)
  if (!fs.existsSync(target)) continue
  const check = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' })
  if (check.status !== 0) {
    console.error(`✗ 语法检查失败 ${edit.file}\n${check.stderr}`)
    failed += 1
  }
}

process.exit(failed === 0 ? 0 : 1)
