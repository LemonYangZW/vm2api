#!/usr/bin/env node
/**
 * 用**上游校验器**验证自签包与注册码（在 Linux 上跑；Windows NTFS 没有可执行位）。
 *
 * 用法：
 *   node tools/verify-selfsigned.mjs --pkg <包目录> --upstream <1.4.048 导出目录>
 *
 * 校验项：
 *   1. `verifyCragV2Tree(pkg)` —— 结构 / sha256 / ELF / 签名
 *   2. `verifyCragRegistration(registration.code, {device, 发行公钥, keyId})`
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const flag = (name, fallback = null) => {
  const at = args.indexOf(name)
  return at >= 0 ? args[at + 1] ?? fallback : fallback
}

const pkg = path.resolve(flag('--pkg', '.tmp/crag-v2-pkg'))
const upstream = path.resolve(flag('--upstream', '.tmp/up048'))
const licenseDir = path.resolve(flag('--license', `${pkg}-license`))

function fail(message) {
  console.error(`FAIL ${message}`)
  process.exitCode = 1
}

async function main() {
  // 包内两个可执行位补上（Windows 生成时会丢）
  for (const rel of ['crag-v2', 'claude-code-2.1.317/claude']) {
    const file = path.join(pkg, rel)
    if (fs.existsSync(file)) fs.chmodSync(file, 0o755)
  }

  const runtime = await import(pathToFileURL(path.join(upstream, 'src/lib/vm/wrap-cli-runtime.mjs')).href)
  const license = await import(pathToFileURL(path.join(upstream, 'src/lib/vm/crag-license.mjs')).href)

  const tree = runtime.verifyCragV2Tree(pkg)
  if (!tree.ok) {
    fail(`verifyCragV2Tree -> ${JSON.stringify(tree)}`)
  } else {
    console.log(
      `OK   verifyCragV2Tree: arch=${tree.manifest.arch} key_id=${tree.manifest.payload.key_id.slice(0, 12)}… caps=${tree.manifest.capabilities.length}`,
    )
  }

  const device = JSON.parse(fs.readFileSync(path.join(licenseDir, 'device.json'), 'utf8'))
  const code = fs.readFileSync(path.join(licenseDir, 'registration.code'), 'utf8').trim()
  const manifest = JSON.parse(fs.readFileSync(path.join(pkg, 'manifest.json'), 'utf8'))
  const issuerPublic = crypto.createPublicKey(fs.readFileSync(path.join(pkg, 'crag-license-public.pem')))
  const devicePrivate = crypto.createPrivateKey({
    key: Buffer.concat([
      Buffer.from('302e020100300506032b656e04220420', 'hex'),
      Buffer.from(device.private_key, 'base64url'),
    ]),
    format: 'der',
    type: 'pkcs8',
  })

  try {
    const result = license.verifyCragRegistration(code, {
      device,
      privateKey: devicePrivate,
      publicKey: issuerPublic,
      keyId: manifest.payload.key_id,
    })
    if (!result.valid) {
      fail(`verifyCragRegistration -> ${JSON.stringify(result)}`)
    } else {
      console.log(
        `OK   verifyCragRegistration: status=${result.status} term=${result.term} expires_at=${result.expires_at}`,
      )
    }
  } catch (error) {
    fail(`verifyCragRegistration threw ${error.code || error.message}`)
  }

  // 负向验证：篡改一个字节必须被拒（证明校验器不是橡皮章）
  const tampered = path.join(pkg, '..', `${path.basename(pkg)}-tampered`)
  fs.rmSync(tampered, { recursive: true, force: true })
  fs.cpSync(pkg, tampered, { recursive: true })
  const victim = path.join(tampered, 'crag-v2.payload.enc')
  const bytes = fs.readFileSync(victim)
  bytes[bytes.length - 1] ^= 0xff
  fs.writeFileSync(victim, bytes)
  const bad = runtime.verifyCragV2Tree(tampered)
  if (bad.ok) fail('篡改后的包竟然通过了校验')
  else console.log(`OK   负向：篡改 payload 被拒（${bad.code}）`)
  fs.rmSync(tampered, { recursive: true, force: true })

  // 负向验证：换一个设备公钥必须 binding 失败
  const other = crypto.generateKeyPairSync('x25519')
  try {
    license.verifyCragRegistration(code, {
      device: { ...device, public_key: Buffer.from(other.publicKey.export({ format: 'jwk' }).x, 'base64url') },
      privateKey: devicePrivate,
      publicKey: issuerPublic,
      keyId: manifest.payload.key_id,
    })
    fail('换设备后注册码竟然仍有效')
  } catch (error) {
    if (error.code === 'license_binding_mismatch') console.log('OK   负向：换设备 → license_binding_mismatch')
    else if (error.code === 'license_invalid') console.log('OK   负向：换设备 → 解包失败被拒')
    else fail(`换设备的错误码异常: ${error.code || error.message}`)
  }

  if (process.exitCode) console.error('\nSELF-SIGNED VERIFY: FAIL')
  else console.log('\nSELF-SIGNED VERIFY: ALL GREEN')
}

main().catch((error) => {
  console.error(error?.stack || String(error))
  process.exitCode = 1
})
