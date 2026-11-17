//! 离线签发：不跑服务，直接拿 machine_code 出一张 CRAGL1 许可证。
//!
//! 用法：
//!   node mint-license.mjs --keys <keys.json> --machine-code CRAGM1.xxx [--term 1y]
//!
//! machine_code 从槽位取（面板“导出机器码”同一套算法）：
//!   `CRAGM1.base64url({"version":1,"product":"crag-v2","vm_id":…,
//!                      "machine_id_hash":sha256(machine-id),"device_public_key":…})`

import fs from 'node:fs'
import { loadAuthority, mintRegistration, TERMS } from './license-authority.mjs'

const flag = (name, fallback = '') => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback
}
const keysFile = flag('keys', process.env.CRAG_AUTHORITY_KEYS || '')
const machineCode = flag('machine-code')
const term = flag('term', '1y')
if (!keysFile || !machineCode || !TERMS[term]) {
  console.error('用法: mint-license.mjs --keys <keys.json> --machine-code CRAGM1.xxx [--term 1m|3m|6m|1y]')
  process.exit(2)
}

const authority = loadAuthority(keysFile)
const { code, license } = mintRegistration(authority, { machineCode, term })
if (flag('out')) {
  fs.writeFileSync(flag('out'), `${code}\n`, { mode: 0o600 })
  console.error(`[mint] 已写入 ${flag('out')}`)
} else {
  console.log(code)
}
console.error(
  `[mint] vm=${license.vm_id} term=${license.term} 到期=${new Date(license.expires_at * 1000).toISOString().slice(0, 10)}`,
)
