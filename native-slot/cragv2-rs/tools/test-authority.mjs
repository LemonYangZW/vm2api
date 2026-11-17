//! 闭环自检：我们签出来的许可证，能不能被**面板自己的**验证函数接受。
//!
//!   node test-authority.mjs --keys <keys.json>
//!
//! 覆盖：正常签发、载荷密钥 id 不匹配、许可证被篡改、过期判定。

import crypto from 'node:crypto'
import { verifyCragRegistration } from '../../../src/lib/vm/crag-license.mjs'
import { loadAuthority, mintRegistration, calendarExpiry } from './license-authority.mjs'

const flag = (name, fallback = '') => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback
}
const keysFile = flag('keys', process.env.CRAG_AUTHORITY_KEYS || '')
if (!keysFile) {
  console.error('用法: test-authority.mjs --keys <keys.json>')
  process.exit(2)
}

const authority = loadAuthority(keysFile)
const b64 = (b) => Buffer.from(b).toString('base64url')

// 造一台“设备”：面板在槽位里存的 device.json 就是这四件套。
const devicePair = crypto.generateKeyPairSync('x25519')
const device = {
  version: 1,
  product: 'crag-v2',
  vm_id: 'vm-selftest',
  machine_id_hash: crypto.createHash('sha256').update('0123456789abcdef0123456789abcdef').digest('hex'),
  public_key: b64(devicePair.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)),
  private_key: b64(devicePair.privateKey.export({ format: 'der', type: 'pkcs8' }).subarray(-32)),
}
const machineCode = `CRAGM1.${b64(Buffer.from(JSON.stringify({
  version: 1,
  product: 'crag-v2',
  vm_id: device.vm_id,
  machine_id_hash: device.machine_id_hash,
  device_public_key: device.public_key,
})) )}`

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

const now = Math.floor(Date.now() / 1000)
const { code, license } = mintRegistration(authority, { machineCode, term: '1y', now })
// 面板的验证函数在结构性问题上是**抛错**，只有绑定不匹配才返回 {valid:false}。
const attempt = (fn) => {
  try {
    return fn()
  } catch (error) {
    return { valid: false, code: error?.code || error?.message || 'error' }
  }
}
const verify = (extra = {}) =>
  attempt(() =>
    verifyCragRegistration(code, { device, publicKey: authority.publicKeyObject, keyId: authority.payloadKeyId, now, ...extra }),
  )

const good = verify()
check('面板验证通过', good.valid === true, good.code || good.status)
check('到期时间 = calendarExpiry(1y)', license.expires_at === calendarExpiry(now, '1y'), new Date(license.expires_at * 1000).toISOString().slice(0, 10))

const wrongKey = verify({ keyId: crypto.createHash('sha256').update('x').digest('hex') })
check('载荷密钥 id 不匹配被拒', wrongKey.valid === false && wrongKey.code === 'license_payload_key_mismatch', wrongKey.code)

const otherDevice = { ...device, machine_id_hash: crypto.createHash('sha256').update('ffff').digest('hex') }
const mismatch = attempt(() => verifyCragRegistration(code, { device: otherDevice, publicKey: authority.publicKeyObject, keyId: authority.payloadKeyId, now }))
check('换机器被拒', mismatch.valid === false, mismatch.code)

const parts = code.split('.')
const tampered = `CRAGL1.${b64(Buffer.from(JSON.stringify({ ...license, expires_at: license.expires_at + 86400 })))}.${parts[2]}`
const forged = attempt(() => verifyCragRegistration(tampered, { device, publicKey: authority.publicKeyObject, keyId: authority.payloadKeyId, now }))
check('篡改到期时间被拒', forged.valid === false, forged.code)

const expired = attempt(() =>
  verifyCragRegistration(code, { device, publicKey: authority.publicKeyObject, keyId: authority.payloadKeyId, now: license.expires_at + 1 }),
)
check('过期后失效', expired.valid === false, expired.code)

console.log(failures === 0 ? '\n全部通过：自建兑换码 → 面板可验证' : `\n失败 ${failures} 项`)
process.exit(failures === 0 ? 0 : 1)
