//! 自建 CRAG 授权：兑换码（CRAGR1）+ 设备许可证（CRAGL1）的签发实现。
//!
//! 真值来自面板 `src/lib/vm/crag-license.mjs`：
//! - 兑换码：`CRAGR1.<32 字节 base64url>`（43 字符）
//! - 许可证：`CRAGL1.<base64url(JSON)>.<base64url(ed25519 签名)>`
//!   签名对象是 `"CRAG-LICENSE-V1\0" || JSON 原始字节`
//! - 载荷密钥用 X25519 + HKDF-SHA256 + AES-256-GCM 包在 `wrapped_key` 里，
//!   HKDF 的 salt 是 payload_key_id，info 是 `"CRAG-LICENSE-KEYWRAP-V1\0"`，
//!   GCM 的 AAD 是 `${vm_id}\0${machine_id_hash}\0${device_public_key}\0${payload_key_id}`
//! - `expires_at` 必须等于 `calendarExpiry(issued_at, term)`（按自然月进位）

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const TERMS = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }

const b64 = (buf) => Buffer.from(buf).toString('base64url')
const sha256hex = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

/** 与面板 calendarExpiry 逐字节等价：先落到月末再取 min(原日, 当月天数)。 */
export function calendarExpiry(issued, term) {
  const date = new Date(issued * 1000)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + TERMS[term])
  const end = new Date(date.getTime())
  end.setUTCMonth(end.getUTCMonth() + 1, 0)
  date.setUTCDate(Math.min(day, end.getUTCDate()))
  return date.getTime() / 1000
}

/** 读取 selfsign-package.mjs 的 --keys 产物。 */
export function loadAuthority(keysFile) {
  const stored = JSON.parse(fs.readFileSync(keysFile, 'utf8'))
  const privateKey = crypto.createPrivateKey(stored.authority_private_key)
  const publicRaw = crypto.createPublicKey(privateKey).export({ format: 'der', type: 'spki' }).subarray(-32)
  const payloadKey = Buffer.from(stored.payload_key, 'hex')
  if (payloadKey.length !== 32) throw new Error('payload_key 必须是 32 字节')
  return {
    privateKey,
    // 面板验证时传的是 crypto.createPublicKey(pem) 建出来的 KeyObject，
    // 这里同样提供一份，避免调用方误传裸 32 字节。
    publicKeyObject: crypto.createPublicKey({
      key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), publicRaw]),
      format: 'der',
      type: 'spki',
    }),
    publicRaw,
    publicB64: b64(publicRaw),
    issuerId: sha256hex(publicRaw),
    payloadKey,
    payloadKeyId: sha256hex(payloadKey),
  }
}

/** 新兑换码：32 字节随机数。绑定关系由服务端记录，码本身不携带信息。 */
export function mintVoucher(term = '1y') {
  if (!TERMS[term]) throw new Error(`term 只能是 ${Object.keys(TERMS).join('/')}`)
  return { code: `CRAGR1.${b64(crypto.randomBytes(32))}`, term }
}

export function isVoucher(code) {
  return typeof code === 'string' && /^CRAGR1\.[A-Za-z0-9_-]{43}$/.test(code)
}

/** machine_code = `CRAGM1.<base64url(JSON)>`，由面板从槽位 machine-id + 设备公钥算出。 */
export function parseMachineCode(machineCode) {
  if (typeof machineCode !== 'string' || !machineCode.startsWith('CRAGM1.')) throw new Error('machine_code 格式不对')
  const claims = JSON.parse(Buffer.from(machineCode.slice(7), 'base64url').toString('utf8'))
  if (claims.product !== 'crag-v2' || claims.version !== 1) throw new Error('machine_code 产品/版本不符')
  if (typeof claims.vm_id !== 'string' || !claims.vm_id) throw new Error('machine_code 缺 vm_id')
  if (!/^[a-f0-9]{64}$/.test(claims.machine_id_hash || '')) throw new Error('machine_code 的 machine_id_hash 不合法')
  if (Buffer.from(claims.device_public_key || '', 'base64url').length !== 32) throw new Error('machine_code 缺设备公钥')
  return claims
}

function x25519Public(raw) {
  return crypto.createPublicKey({
    key: Buffer.concat([Buffer.from('302a300506032b656e032100', 'hex'), raw]),
    format: 'der',
    type: 'spki',
  })
}

/** 把载荷密钥包给设备：与面板 unwrapDeviceKey 对称。 */
function wrapPayloadKey(authority, claims, keyId) {
  const ephemeral = crypto.generateKeyPairSync('x25519')
  const ephemeralRaw = ephemeral.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)
  const shared = crypto.diffieHellman({
    privateKey: ephemeral.privateKey,
    publicKey: x25519Public(Buffer.from(claims.device_public_key, 'base64url')),
  })
  const key = Buffer.from(
    crypto.hkdfSync('sha256', shared, Buffer.from(keyId, 'hex'), Buffer.from('CRAG-LICENSE-KEYWRAP-V1\0'), 32),
  )
  const nonce = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce)
  cipher.setAAD(Buffer.from(`${claims.vm_id}\0${claims.machine_id_hash}\0${claims.device_public_key}\0${keyId}`))
  const ciphertext = Buffer.concat([cipher.update(authority.payloadKey), cipher.final()])
  const wrapped = {
    ephemeral_public_key: b64(ephemeralRaw),
    nonce: b64(nonce),
    ciphertext: b64(ciphertext),
    tag: b64(cipher.getAuthTag()),
  }
  shared.fill(0)
  key.fill(0)
  return wrapped
}

/**
 * 签一张设备许可证。
 * `machineCode` 决定绑定（vm_id / machine_id_hash / 设备公钥），`term` 决定有效期。
 */
export function mintRegistration(authority, { machineCode, term = '1y', now = Math.floor(Date.now() / 1000), licenseId }) {
  if (!TERMS[term]) throw new Error(`term 只能是 ${Object.keys(TERMS).join('/')}`)
  const claims = parseMachineCode(machineCode)
  const license = {
    version: 1,
    product: 'crag-v2',
    license_id: licenseId || crypto.randomUUID(),
    vm_id: claims.vm_id,
    machine_id_hash: claims.machine_id_hash,
    payload_key_id: authority.payloadKeyId,
    term,
    issued_at: now,
    not_before: now,
    expires_at: calendarExpiry(now, term),
    device_public_key: claims.device_public_key,
    wrapped_key: wrapPayloadKey(authority, claims, authority.payloadKeyId),
  }
  const raw = Buffer.from(JSON.stringify(license))
  const signature = crypto.sign(null, Buffer.concat([Buffer.from('CRAG-LICENSE-V1\0'), raw]), authority.privateKey)
  return { code: `CRAGL1.${b64(raw)}.${b64(signature)}`, license }
}

/** 兑换码库：一个 JSON 文件，600 权限，原子写。 */
export function openStore(file) {
  const read = () => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      return { vouchers: {} }
    }
  }
  const write = (data) => {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true })
    const tmp = `${file}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(data, null, 1), { mode: 0o600 })
    fs.renameSync(tmp, file)
  }
  return { read, write }
}
