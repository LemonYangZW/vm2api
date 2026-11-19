#!/usr/bin/env node
// CRAG V2 载荷解封：用**你自己槽上的合法许可**解出 crag-v2.payload.enc 的明文内核。
//
// 不做、也不打算做的事：不伪造注册码、不自签发行包、不改 `license_payload_key_mismatch`
// 的判定。K 只能由「真注册码 + 本槽 device.json 私钥」按上游公式还原，签名先验一遍
// （`CRAG-LICENSE-V1\0` + Ed25519），验不过就直接退出。
//
// 公式来源：reverse/kin-kernel/docs/11_CRAG_V2_SPEC.md §3.2/§3.1，与面板
// src/lib/vm/crag-license.mjs:354-378 逐行一致（那边算完会把 K 清零，这里留着用来解密）。
//
//   node unseal.mjs --package .tmp/crag-3.1.7 --license-dir /run/kin/crag-license --out kernel.bin
//   node unseal.mjs --package .tmp/crag-3.1.7 --check          # 只校验包完整性与头结构
//
// 退出码：0 成功 / 2 缺许可材料 / 3 许可与载荷不匹配 / 4 解密失败 / 5 哈希不符

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const b64u = (value, length) => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw coded('license_invalid', 'base64url 字段非法')
  const bytes = Buffer.from(value, 'base64url')
  if ((length != null && bytes.length !== length) || bytes.toString('base64url') !== value)
    throw coded('license_invalid', 'base64url 字段长度不符')
  return bytes
}
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest()
const hex = (bytes) => Buffer.from(bytes).toString('hex')
function coded(code, message) {
  return Object.assign(new Error(message), { code })
}
const xPrivate = (raw) =>
  crypto.createPrivateKey({
    key: Buffer.concat([Buffer.from('302e020100300506032b656e04220420', 'hex'), raw]),
    format: 'der',
    type: 'pkcs8',
  })
const xPublic = (raw) =>
  crypto.createPublicKey({
    key: Buffer.concat([Buffer.from('302a300506032b656e032100', 'hex'), raw]),
    format: 'der',
    type: 'spki',
  })

function parseArgs(argv) {
  const out = { package: null, licenseDir: null, out: null, check: false, aad: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--package') out.package = argv[++i]
    else if (arg === '--license-dir') out.licenseDir = argv[++i]
    else if (arg === '--out') out.out = argv[++i]
    else if (arg === '--check') out.check = true
    else if (arg === '--aad') out.aad.push(argv[++i])
    else if (arg === '--help' || arg === '-h') out.help = true
    else throw coded('argv', `未知参数 ${arg}（--help 看用法）`)
  }
  return out
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw coded('unreadable', `读不到 ${file}: ${error.message}`)
  }
}

/** 包完整性：manifest 自己声明的每一个文件的 sha256。 */
function verifyPackage(dir, manifest) {
  const missing = []
  const bad = []
  for (const [rel, want] of Object.entries(manifest.sha256 || {})) {
    const file = path.join(dir, rel)
    if (!fs.existsSync(file)) {
      missing.push(rel)
      continue
    }
    const got = hex(sha256(fs.readFileSync(file)))
    if (got !== want) bad.push(`${rel}: ${got} != ${want}`)
  }
  return { missing, bad, count: Object.keys(manifest.sha256 || {}).length }
}

/** CRAGL1 `<prefix>.<claims>.<sig>`：先验 Ed25519，再回读到期的绝对秒。 */
function readRegistration(code, pemPath) {
  const parts = String(code || '').trim().split('.')
  if (parts.length !== 3 || parts[0] !== 'CRAGL1') throw coded('license_invalid', '注册码不是 CRAGL1.<claims>.<sig>')
  const raw = b64u(parts[1])
  const sig = b64u(parts[2], 64)
  const pem = fs.readFileSync(pemPath)
  if (!crypto.verify(null, Buffer.concat([Buffer.from('CRAG-LICENSE-V1\0'), raw]), crypto.createPublicKey(pem), sig))
    throw coded('license_invalid', '注册码签名验不过（发行公钥不匹配）')
  const claims = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw))
  if (claims.version !== 1 || claims.product !== 'crag-v2') throw coded('license_invalid', '注册码 product/version 不符')
  return claims
}

/** 第 2 层：从 wrapped_key 还原 32 字节载荷密钥 K，并自检 sha256(K) == key_id。 */
function unwrapPayloadKey(claims, device) {
  const keyId = String(claims.payload_key_id || '')
  const wrapped = claims.wrapped_key || {}
  const devicePublic = String(device.public_key || '')
  const shared = crypto.diffieHellman({
    privateKey: xPrivate(b64u(device.private_key, 32)),
    publicKey: xPublic(b64u(wrapped.ephemeral_public_key, 32)),
  })
  if (shared.every((byte) => byte === 0)) throw coded('license_invalid', 'X25519 共享密钥全零')
  const key = Buffer.from(
    crypto.hkdfSync('sha256', shared, Buffer.from(keyId, 'hex'), Buffer.from('CRAG-LICENSE-KEYWRAP-V1\0'), 32),
  )
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, b64u(wrapped.nonce, 12))
  decipher.setAAD(Buffer.from(`${device.vm_id}\0${device.machine_id_hash}\0${devicePublic}\0${keyId}`))
  decipher.setAuthTag(b64u(wrapped.tag, 16))
  let payload
  try {
    payload = Buffer.concat([decipher.update(b64u(wrapped.ciphertext, 32)), decipher.final()])
  } finally {
    shared.fill(0)
    key.fill(0)
  }
  if (hex(sha256(payload)) !== keyId) throw coded('license_invalid', 'K 的 sha256 与 key_id 不符')
  return payload
}

/** 第 1 层：`CRAGV2E1 || nonce(12) || tag(16) || AES-256-GCM(明文)`，AAD 按候选试到明文哈希对上。 */
function openPayload(file, K, manifest, extraAad) {
  const blob = fs.readFileSync(file)
  const magic = blob.subarray(0, 8).toString('latin1')
  if (magic !== 'CRAGV2E1') throw coded('payload_invalid', `载荷头不是 CRAGV2E1，是 ${JSON.stringify(magic)}`)
  const nonce = blob.subarray(8, 20)
  const tag = blob.subarray(20, 36)
  const body = blob.subarray(36)
  const want = String(manifest.payload?.plaintext_sha256 || '')
  // 上游规格里的 AAD 是 fixture 用法（11_CRAG_V2_SPEC.md:586 明确标为未证实），
  // 内层真实 AAD 只有 bootstrap 知道 → 用明文哈希当判据逐个试，试不出来就报错，不猜。
  // 候选取自 bootstrap（crag-v2 是 stripped 但字符串明文）：它同时带
  // `CRAG-V2-PAYLOAD-V1` 与 `CRAG-PAYLOAD-V1`，NUL 结尾与否都试。
  const candidates = [
    ...extraAad,
    'CRAG-V2-PAYLOAD-V1\0',
    'CRAG-V2-PAYLOAD-V1',
    'CRAG-PAYLOAD-V1\0',
    'CRAG-PAYLOAD-V1',
    '',
    'CRAGV2E1\0',
    'CRAGV2E1',
  ]
  const tried = []
  for (const aad of candidates) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', K, nonce)
    if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'))
    decipher.setAuthTag(tag)
    try {
      const plain = Buffer.concat([decipher.update(body), decipher.final()])
      const got = hex(sha256(plain))
      tried.push(`aad=${JSON.stringify(aad)} → ${got.slice(0, 16)}…`)
      if (got === want) return { plain, aad }
    } catch (error) {
      tried.push(`aad=${JSON.stringify(aad)} → ${error.message}`)
    }
  }
  const detail = tried.map((line) => `  ${line}`).join('\n')
  throw coded('payload_invalid', `所有 AAD 候选都解不开（用 --aad 追加候选）:\n${detail}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.package) {
    console.log(
      [
        'node unseal.mjs --package <解压后的 crag-v2 目录> [--license-dir <dir>] [--out <file>] [--check]',
        '',
        '  --check        只校验包完整性、manifest 与载荷头，不需要许可',
        '  --license-dir  含 device.json 与 registration.code 的目录（槽内 /run/kin/crag-license）',
        '  --aad          追加一个载荷 AAD 候选（可重复）',
      ].join('\n'),
    )
    return 0
  }
  const dir = path.resolve(args.package)
  const manifest = readJson(path.join(dir, 'manifest.json'))
  const keyId = String(manifest.payload?.key_id || '')
  console.log(`package   : ${dir}`)
  console.log(`version   : ${manifest.family}/${manifest.version}/${manifest.arch}  entrypoint=${manifest.entrypoint}`)
  console.log(`payload   : ${manifest.payload?.format} ${manifest.payload?.algorithm} key_id=${keyId}`)
  console.log(`plaintext : sha256 ${manifest.payload?.plaintext_sha256}`)

  const integrity = verifyPackage(dir, manifest)
  if (integrity.missing.length) throw coded('package_incomplete', `缺文件: ${integrity.missing.join(', ')}`)
  if (integrity.bad.length) throw coded('package_hash', `哈希不符:\n  ${integrity.bad.join('\n  ')}`)
  console.log(`integrity : ${integrity.count}/${integrity.count} 文件 sha256 通过`)

  const payloadFile = path.join(dir, manifest.payload?.path || 'crag-v2.payload.enc')
  const blob = fs.readFileSync(payloadFile)
  console.log(
    `blob      : ${blob.length} 字节, magic=${JSON.stringify(blob.subarray(0, 8).toString('latin1'))}, ` +
      `sha256=${hex(sha256(blob)).slice(0, 16)}…`,
  )
  if (args.check) return 0

  if (!args.licenseDir) throw coded('license_required', '需要 --license-dir（含 device.json 与 registration.code）')
  const licenseDir = path.resolve(args.licenseDir)
  const device = readJson(path.join(licenseDir, 'device.json'))
  const codeFile = path.join(licenseDir, 'registration.code')
  const code = fs.existsSync(codeFile) ? fs.readFileSync(codeFile, 'utf8') : ''
  const claims = readRegistration(code, path.join(dir, 'crag-license-public.pem'))
  if (claims.payload_key_id !== keyId)
    throw coded(
      'license_payload_key_mismatch',
      `许可绑的是 key_id=${claims.payload_key_id}，这个载荷是 ${keyId}（换版要换许可，不能用旧许可解新载荷）`,
    )
  if (claims.vm_id !== device.vm_id || claims.machine_id_hash !== device.machine_id_hash)
    throw coded('license_binding_mismatch', '注册码与 device.json 不属于同一槽')
  const now = Math.floor(Date.now() / 1000)
  console.log(
    `license   : ${claims.license_id} term=${claims.term} 有效 ${new Date(claims.not_before * 1000).toISOString()} → ` +
      `${new Date(claims.expires_at * 1000).toISOString()}${now >= claims.expires_at ? '（已过期，但密钥仍可用）' : ''}`,
  )

  const K = unwrapPayloadKey(claims, device)
  console.log(`payload K : 已还原（sha256 == key_id）`)
  const { plain, aad } = openPayload(payloadFile, K, manifest, args.aad)
  K.fill(0)
  console.log(`aad       : ${JSON.stringify(aad)}`)
  console.log(`plaintext : ${plain.length} 字节 sha256=${hex(sha256(plain))}`)
  const out = args.out ? path.resolve(args.out) : path.join(dir, 'crag-v2.payload.bin')
  fs.writeFileSync(out, plain, { mode: 0o600 })
  console.log(`written   : ${out}`)
  return 0
}

const CODES = {
  argv: 1,
  unreadable: 1,
  package_incomplete: 1,
  package_hash: 5,
  license_required: 2,
  license_invalid: 3,
  license_binding_mismatch: 3,
  license_payload_key_mismatch: 3,
  payload_invalid: 4,
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`error[${error.code || 'unexpected'}]: ${error.message}`)
    process.exit(CODES[error.code] ?? 1)
  },
)
