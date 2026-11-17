//! 签发宿主授权（CRAGH1），决定面板里“剩余可激活槽位”。
//!
//!   node mint-host-entitlement.mjs --keys keys.json --host-id <64hex> --slots 10 [--days 365]
//!   node mint-host-entitlement.mjs --keys keys.json --machine-id <machine-id> --slots 10
//!
//! 落盘（面板默认读取位置）：
//!   <data>/crag-subscription/public/host_id
//!   <data>/crag-subscription/public/entitlement.code
//! 其中 <data> = KIN_DATA_DIR（容器内 /opt/vm2api/data）。

import fs from 'node:fs'
import path from 'node:path'
import { loadAuthority, mintHostEntitlement, hostIdFromMachineId } from './license-authority.mjs'

const flag = (name, fallback = '') => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback
}
const keysFile = flag('keys', process.env.CRAG_AUTHORITY_KEYS || '')
const slots = Number(flag('slots', '10'))
const days = Number(flag('days', '365'))
const revision = Number(flag('revision', '1'))
let hostId = flag('host-id')
if (!hostId && flag('machine-id')) hostId = hostIdFromMachineId(flag('machine-id'))
if (!keysFile || !hostId) {
  console.error('用法: mint-host-entitlement.mjs --keys <keys.json> (--host-id <64hex>|--machine-id <id>) [--slots 10] [--days 365] [--out-dir <dir>]')
  process.exit(2)
}

const authority = loadAuthority(keysFile)
const { code, claims } = mintHostEntitlement(authority, { hostId, slotLimit: slots, revision, days })

const outDir = flag('out-dir')
if (outDir) {
  fs.mkdirSync(outDir, { recursive: true })
  // 面板 load(hostFile, 0o644, 64) 上限就是 64 字节，带换行会被判存储不可用。
  fs.writeFileSync(path.join(outDir, 'host_id'), hostId, { mode: 0o644 })
  fs.writeFileSync(path.join(outDir, 'entitlement.code'), code, { mode: 0o644 })
  console.error(`[host] 已写入 ${outDir}/{host_id,entitlement.code}`)
} else {
  console.log(code)
}
console.error(
  `[host] host=${hostId.slice(0, 16)}… slot_limit=${claims.slot_limit} 到期=${new Date(claims.expires_at * 1000).toISOString().slice(0, 10)}`,
)
