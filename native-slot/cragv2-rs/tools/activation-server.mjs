//! 自建 CRAG 授权服务：实现面板要的 `POST /v1/device-activation`。
//!
//! 面板（`src/lib/vm/crag-license.mjs`）只用两个动作：
//! - `resolve`：判断兑换码是本机码还是宿主码 → `{ok:true,data:{kind:'device'}}`
//! - `redeem`：带 machine_code 换许可证 → `{ok:true,data:{registration_code,replayed}}`
//!
//! 错误码沿用面板已识别的约定：404 redeem_unavailable / 409 redeem_conflict /
//! 409 issuer_mismatch / 400 payload_key_unknown / 429 服务繁忙。

import http from 'node:http'
import { loadAuthority, mintRegistration, openStore, isVoucher } from './license-authority.mjs'

const flag = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback
}

const keysFile = flag('keys', process.env.CRAG_AUTHORITY_KEYS || '')
const storeFile = flag('store', process.env.CRAG_VOUCHER_STORE || '')
const port = Number(flag('port', process.env.PORT || 8099))
const host = flag('host', process.env.HOST || '0.0.0.0')
if (!keysFile || !storeFile) {
  console.error('用法: activation-server.mjs --keys <keys.json> --store <vouchers.json> [--port 8099]')
  process.exit(2)
}

const authority = loadAuthority(keysFile)
const store = openStore(storeFile)
console.log(`[authority] store=${storeFile}`)
console.log(`[authority] issuer=${authority.issuerId.slice(0, 16)}… payload=${authority.payloadKeyId.slice(0, 16)}…`)

const send = (res, status, body) => {
  const text = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(text) })
  res.end(text)
}
const deny = (res, status, code) => send(res, status, { ok: false, error: { code, message: code } })

const server = http.createServer((req, res) => {
  // 面板调用的是 `${base}/${action}`，即 /v1/device-activation/{resolve,redeem}。
  const path = String(req.url || '').split('?')[0]
  if (req.method !== 'POST' || !path.startsWith('/v1/device-activation')) return deny(res, 404, 'not_found')
  const routed = path.slice('/v1/device-activation'.length).replace(/^\//, '')
  const chunks = []
  let bytes = 0
  req.on('data', (chunk) => {
    bytes += chunk.byteLength
    if (bytes > 16384) req.destroy()
    else chunks.push(chunk)
  })
  req.on('end', () => {
    let body
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      return deny(res, 400, 'bad_request')
    }
    const action = String(body.action || routed || '')
    const code = String(body.redemption_code || '')
    if (String(body.issuer_public_key_id || '') !== authority.issuerId) {
      console.log(`[authority] issuer_mismatch got=${String(body.issuer_public_key_id || '').slice(0, 16)}… want=${authority.issuerId.slice(0, 16)}…`)
      return deny(res, 409, 'issuer_mismatch')
    }
    if (!isVoucher(code)) return deny(res, 404, 'redeem_unavailable')

    const data = store.read()
    const record = data.vouchers[code]
    if (!record || record.revoked) return deny(res, 404, 'redeem_unavailable')
    if (record.expires_at && record.expires_at < Math.floor(Date.now() / 1000))
      return deny(res, 404, 'redeem_unavailable')

    if (action === 'resolve') return send(res, 200, { ok: true, data: { kind: 'device' } })
    if (action !== 'redeem') return deny(res, 400, 'bad_request')

    if (String(body.payload_key_id || '') !== authority.payloadKeyId) return deny(res, 400, 'payload_key_unknown')

    // 一码一机：首次绑定后**永久复用同一张证**（重放必须逐字节相同，
    // 面板会拿它和磁盘上的 registration.code 比对，重新签名会被判为目标漂移）。
    let claims
    try {
      claims = JSON.parse(Buffer.from(String(body.machine_code).slice(7), 'base64url').toString('utf8'))
    } catch {
      return deny(res, 400, 'bad_request')
    }
    const replayed = Boolean(record.registration_code)
    if (replayed) {
      if (record.machine_id_hash !== claims.machine_id_hash) return deny(res, 409, 'redeem_conflict')
      return send(res, 200, { ok: true, data: { registration_code: record.registration_code, replayed: true } })
    }

    const registration = mintRegistration(authority, {
      machineCode: String(body.machine_code || ''),
      term: record.term,
      licenseId: record.license_id,
    })
    record.machine_id_hash = claims.machine_id_hash
    record.vm_id = claims.vm_id
    record.license_id = registration.license.license_id
    record.registration_code = registration.code
    record.bound_at = Math.floor(Date.now() / 1000)
    data.vouchers[code] = record
    store.write(data)
    console.log(`[authority] redeem ${code.slice(0, 12)}… vm=${claims.vm_id} term=${record.term}`)
    return send(res, 200, { ok: true, data: { registration_code: registration.code, replayed: false } })
  })
})

server.listen(port, host, () => console.log(`[authority] listening on ${host}:${port}`))
