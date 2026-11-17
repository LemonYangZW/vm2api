#!/usr/bin/env node
/**
 * crag v2 **自签打包器**：按 `11_CRAG_V2_SPEC.md` §2/§3 生成一个能被上游
 * `verifyCragV2Tree()` / `verifyCragRegistration()` 接受的包与注册码。
 *
 * 这是「授权链」的离线工具，不参与内核运行；生产内核只负责验证。
 *
 * 用法：
 *   node tools/selfsign-package.mjs --bin target/release/crag-v2 --arch arm64 \
 *        --out .tmp/crag-v2-pkg --self-test --upstream ../vm2api/.tmp/up048
 *
 * 产物（包目录）：
 *   manifest.json / crag-v2 / claude-code-2.1.317/claude
 *   crag-license-public.pem / crag-v2.payload.enc
 * 附加产物（与包同级）：
 *   device.json（模拟设备身份）/ machine.code（CRAGM1…）/ registration.code（CRAGL1…）
 *
 * 注意：`verifyCragV2Tree` 要求 `manifest.arch === 本机 arch`，所以在 x86 上只能
 * 自验 amd64 包；arm64 包请在 arm64 机器（如 oracle）上跑 `--self-test`。
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

const args = process.argv.slice(2)
const flag = (name, fallback = null) => {
  const at = args.indexOf(name)
  return at >= 0 ? args[at + 1] ?? fallback : fallback
}
const has = (name) => args.includes(name)

const arch = flag('--arch', process.arch === 'arm64' ? 'arm64' : 'amd64')
const outDir = path.resolve(root, flag('--out', '.tmp/crag-v2-pkg'))
// 附属文件（设备身份/机器码/注册码）必须放在**包外**：包目录里任何未列入 sha256 的文件都会被拒
const licenseDir = `${outDir}-license`
const binPath = path.resolve(root, flag('--bin', 'target/release/crag-v2'))
const vmId = flag('--vm-id', 'vm-crag-01')
const term = flag('--term', '1m')
const machineId = (flag('--machine-id') || crypto.randomBytes(16).toString('hex')).replace(/[^a-fA-F0-9]/g, '')
// 必须与目标上游 `CRAG_V2_CLAUDE` 常量一致，否则 verifyCragV2Tree 直接拒包
const claudeDir = flag('--claude-dir', 'claude-code-2.1.317')
// 真要能执行工具，槽里的 `claude` 必须是**真实官方 CLI**；缺省仍写占位 ELF（只够过结构校验）
const claudeBinPath = flag('--claude-bin', '')
if (machineId.length !== 32) throw new Error('machine-id 必须是 32 位十六进制')
const upstream = flag('--upstream', path.resolve(root, '../../.tmp/up048'))
const selfTest = has('--self-test')
// 面板自己生成 device.json 时，只把它的 CRAGM1 机器码交给本工具签发；
// 发行密钥/内核密钥用 --keys 持久化，重复签发必须用同一对，否则包内 pem 对不上。
const keysFile = flag('--keys', '')
const externalMachineCode = flag('--machine-code', '')

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const b64url = (bytes) => Buffer.from(bytes).toString('base64url')

/** 与现网 calendarExpiry 一致：按 UTC 月末夹取。 */
function calendarExpiry(issued, termName) {
  const date = new Date(issued * 1000)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + ({ '1m': 1, '6m': 6, '1y': 12 }[termName] ?? 1))
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, last))
  return Math.floor(date.getTime() / 1000)
}

/** 最小合规 ELF（96 字节），仅用于通过结构校验的第二个可执行位。 */
function minimalElf(archName, marker) {
  const elf = Buffer.alloc(96 + Buffer.byteLength(marker))
  elf.set([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1])
  elf.writeUInt16LE(3, 16) // ET_DYN
  elf.writeUInt16LE(archName === 'amd64' ? 62 : 183, 18)
  elf.writeUInt32LE(1, 20)
  elf.write(marker, 96)
  return elf
}

function main() {
  if (!fs.existsSync(binPath)) throw new Error(`找不到内核二进制: ${binPath}`)
  const binary = fs.readFileSync(binPath)
  if (binary.readUInt32BE(0) !== 0x7f454c46) throw new Error(`不是 ELF: ${binPath}`)
  const machine = binary.readUInt16LE(18)
  const expectedMachine = arch === 'amd64' ? 62 : 183
  if (machine !== expectedMachine) {
    throw new Error(`二进制 machine=${machine} 与 --arch=${arch}（期望 ${expectedMachine}）不一致`)
  }

  // 发行密钥 + 内核密钥（--keys 时复用磁盘上的那一对）
  const stored = keysFile && fs.existsSync(keysFile) ? JSON.parse(fs.readFileSync(keysFile, 'utf8')) : null
  const privateKey = stored ? crypto.createPrivateKey(stored.authority_private_key) : crypto.generateKeyPairSync('ed25519').privateKey
  const authority = { privateKey, publicKey: crypto.createPublicKey(privateKey) }
  const publicRaw = authority.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)
  const payloadKey = stored ? Buffer.from(stored.payload_key, 'hex') : crypto.randomBytes(32)
  const keyId = sha256(payloadKey)
  if (keysFile && !stored) {
    fs.mkdirSync(path.dirname(path.resolve(keysFile)), { recursive: true })
    fs.writeFileSync(
      keysFile,
      JSON.stringify(
        { authority_private_key: privateKey.export({ format: 'pem', type: 'pkcs8' }), payload_key: payloadKey.toString('hex') },
        null,
        1,
      ),
      { mode: 0o600 },
    )
  }

  // payload = "CRAGV2E1" || nonce(12) || tag(16) || AES-256-GCM(二进制, K, AAD)
  const nonce = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', payloadKey, nonce)
  cipher.setAAD(Buffer.from('CRAG-V2-PAYLOAD-V1\0'))
  const sealed = Buffer.concat([cipher.update(binary), cipher.final()])
  const payloadBytes = Buffer.concat([Buffer.from('CRAGV2E1'), nonce, cipher.getAuthTag(), sealed])

  const signed = {
    product: 'crag-v2',
    format: 'CRAGV2E1',
    algorithm: 'aes-256-gcm',
    key_id: keyId,
    plaintext_sha256: sha256(binary),
    ciphertext_sha256: sha256(payloadBytes),
  }
  const payloadSignature = crypto.sign(
    null,
    Buffer.concat([Buffer.from('CRAG-PAYLOAD-V1\0'), Buffer.from(JSON.stringify(signed))]),
    authority.privateKey,
  )

  const claude = claudeBinPath ? fs.readFileSync(path.resolve(claudeBinPath)) : minimalElf(arch, `crag-v2 official claude placeholder (${arch})`)
  if (claudeBinPath && claude.readUInt32BE(0) !== 0x7f454c46) throw new Error(`不是 ELF: ${claudeBinPath}`)
  if (claudeBinPath && claude.readUInt16LE(18) !== expectedMachine)
    throw new Error(`--claude-bin machine=${claude.readUInt16LE(18)} 与 --arch=${arch} 不一致`)
  const pem = authority.publicKey.export({ format: 'pem', type: 'spki' })
  const files = {
    'crag-v2': binary,
    [`${claudeDir}/claude`]: claude,
    'crag-license-public.pem': Buffer.from(pem),
    'crag-v2.payload.enc': payloadBytes,
  }

  fs.rmSync(outDir, { recursive: true, force: true })
  fs.rmSync(licenseDir, { recursive: true, force: true })
  fs.mkdirSync(licenseDir, { recursive: true })
  for (const [rel, body] of Object.entries(files)) {
    const target = path.join(outDir, rel)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    const executable = rel === 'crag-v2' || rel.endsWith('/claude')
    fs.writeFileSync(target, body, { mode: executable ? 0o755 : 0o644 })
  }
  const manifest = {
    family: 'crag',
    version: 'v2',
    arch,
    encrypted: true,
    runtime: 'native',
    entrypoint: 'crag-v2',
    capabilities: ['official_full', 'zero', 'cancel', 'telemetry', 'unix_socket_envelope'],
    authorization: {
      scheme: 'ed25519-x25519-v1',
      product: 'crag-v2',
      public_key: b64url(publicRaw),
      public_key_id: sha256(publicRaw),
    },
    payload: {
      path: 'crag-v2.payload.enc',
      ...signed,
      signature: b64url(payloadSignature),
    },
    sha256: Object.fromEntries(Object.entries(files).map(([rel, body]) => [rel, sha256(body)])),
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest))

  // 设备身份：--machine-code 时用外部（面板）的，不接管它的 device.json
  const machineIdHash = sha256(Buffer.from(machineId))
  let device = null
  let challenge
  if (externalMachineCode) {
    if (!/^CRAGM1\.[A-Za-z0-9_-]+$/.test(externalMachineCode))
      throw new Error('--machine-code 必须是 CRAGM1.<base64url>')
    challenge = JSON.parse(Buffer.from(externalMachineCode.split('.')[1], 'base64url'))
    for (const key of ['vm_id', 'machine_id_hash', 'device_public_key'])
      if (typeof challenge[key] !== 'string') throw new Error(`机器码缺少 ${key}`)
  } else {
    const devicePair = crypto.generateKeyPairSync('x25519')
    const devicePublic = Buffer.from(devicePair.publicKey.export({ format: 'jwk' }).x, 'base64url')
    const devicePrivateJwk = devicePair.privateKey.export({ format: 'jwk' }).d
    device = {
      version: 1,
      product: 'crag-v2',
      vm_id: vmId,
      machine_id_hash: machineIdHash,
      private_key: devicePrivateJwk,
      public_key: b64url(devicePublic),
    }
    fs.writeFileSync(path.join(licenseDir, 'device.json'), `${JSON.stringify(device, null, 1)}\n`, { mode: 0o600 })
    challenge = {
      version: 1,
      product: 'crag-v2',
      vm_id: vmId,
      machine_id_hash: machineIdHash,
      device_public_key: device.public_key,
    }
  }
  const machineCode = `CRAGM1.${Buffer.from(JSON.stringify(challenge)).toString('base64url')}`
  if (!externalMachineCode) fs.writeFileSync(path.join(licenseDir, 'machine.code'), `${machineCode}\n`)

  // 注册码：把 K 包裹给设备
  const issuedAt = Math.floor(Date.now() / 1000) - 60
  const ephemeral = crypto.generateKeyPairSync('x25519')
  const shared = crypto.diffieHellman({
    privateKey: ephemeral.privateKey,
    publicKey: crypto.createPublicKey({
      key: { kty: 'OKP', crv: 'X25519', x: challenge.device_public_key },
      format: 'jwk',
    }),
  })
  const wrapKey = Buffer.from(
    crypto.hkdfSync('sha256', shared, Buffer.from(keyId, 'hex'), Buffer.from('CRAG-LICENSE-KEYWRAP-V1\0'), 32),
  )
  const wrapNonce = crypto.randomBytes(12)
  const wrapCipher = crypto.createCipheriv('aes-256-gcm', wrapKey, wrapNonce)
  wrapCipher.setAAD(
    Buffer.from(`${challenge.vm_id}\0${challenge.machine_id_hash}\0${challenge.device_public_key}\0${keyId}`),
  )
  const wrappedCiphertext = Buffer.concat([wrapCipher.update(payloadKey), wrapCipher.final()])
  const claims = {
    version: 1,
    product: 'crag-v2',
    license_id: crypto.randomUUID(),
    vm_id: challenge.vm_id,
    machine_id_hash: challenge.machine_id_hash,
    device_public_key: challenge.device_public_key,
    payload_key_id: keyId,
    term,
    issued_at: issuedAt,
    not_before: issuedAt,
    expires_at: calendarExpiry(issuedAt, term),
    wrapped_key: {
      ephemeral_public_key: b64url(Buffer.from(ephemeral.publicKey.export({ format: 'jwk' }).x, 'base64url')),
      nonce: b64url(wrapNonce),
      ciphertext: b64url(wrappedCiphertext),
      tag: b64url(wrapCipher.getAuthTag()),
    },
  }
  const claimsRaw = Buffer.from(JSON.stringify(claims))
  const licenseSig = crypto.sign(
    null,
    Buffer.concat([Buffer.from('CRAG-LICENSE-V1\0'), claimsRaw]),
    authority.privateKey,
  )
  const registrationCode = `CRAGL1.${claimsRaw.toString('base64url')}.${licenseSig.toString('base64url')}`
  fs.writeFileSync(path.join(licenseDir, 'registration.code'), `${registrationCode}\n`)

  console.log(`package:     ${outDir}`)
  console.log(`license dir: ${licenseDir}`)
  console.log(`arch:        ${arch} (ELF machine=${machine})`)
  console.log(`key_id:      ${keyId}`)
  console.log(`public_key:  ${manifest.authorization.public_key_id}`)
  console.log(`machine:     ${machineCode.slice(0, 40)}…`)
  console.log(`license:     ${registrationCode.slice(0, 32)}… (term=${term})`)
  console.log(`expires_at:  ${claims.expires_at} (${new Date(claims.expires_at * 1000).toISOString()})`)

  if (selfTest) {
    if (!device) console.log('\n[self-test] --machine-code 模式：跳过 verifyCragRegistration（缺少该设备私钥）')
    else verifyWithUpstream({ manifest, device, registrationCode, keyId, licenseDir })
  }
}

async function verifyWithUpstream({ manifest, device, registrationCode, keyId, licenseDir }) {
  if (manifest.arch !== (process.arch === 'arm64' ? 'arm64' : 'amd64')) {
    console.log(`\n[self-test] 跳过：包是 ${manifest.arch}，本机是 ${process.arch}（请到目标架构上验证）`)
    return
  }
  const runtime = await import(pathToFileURL(path.join(upstream, 'src/lib/vm/wrap-cli-runtime.mjs')).href)
  const license = await import(pathToFileURL(path.join(upstream, 'src/lib/vm/crag-license.mjs')).href)
  const tree = runtime.verifyCragV2Tree(outDir)
  console.log(`\n[self-test] verifyCragV2Tree: ${tree.ok ? 'OK' : 'FAIL ' + JSON.stringify(tree)}`)
  if (!tree.ok) process.exitCode = 1

  const privateKey = crypto.createPrivateKey({
    key: Buffer.concat([Buffer.from('302e020100300506032b656e04220420', 'hex'), Buffer.from(device.private_key, 'base64url')]),
    format: 'der',
    type: 'pkcs8',
  })
  // 注意：签名是**发行方**签的，验证必须用包内 pem 的发行公钥；
  // device 公钥只参与 wrapped_key 的解封。
  const publicKey = crypto.createPublicKey(fs.readFileSync(path.join(outDir, 'crag-license-public.pem')))
  try {
    const result = license.verifyCragRegistration(registrationCode, {
      device,
      privateKey,
      publicKey,
      keyId,
    })
    console.log(
      `[self-test] verifyCragRegistration: ${result.status} valid=${result.valid} term=${result.term} expires_at=${result.expires_at}`,
    )
    if (!result.valid) process.exitCode = 1
  } catch (error) {
    console.log(`[self-test] verifyCragRegistration: FAIL ${error.code || error.message}`)
    process.exitCode = 1
  }
}

main()
