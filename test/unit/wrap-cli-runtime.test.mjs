import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  WRAP_CLI_BIN,
  WRAP_CLI_FILES,
  CC_NODE_BIN,
  captureWrapSample,
  describeWrapSample,
  inspectLinuxAmd64Elf,
  inspectLinuxElf,
  inspectWrapCliDir,
  makeWrapSample,
  materializeSlotDataplane,
  materializeWrapCli,
  replaceCcNodeBinary,
  replaceCliNodeBinary,
  replaceKernelBinary,
  inspectKernelChanges,
  syncWrapSample,
  wrapCliHomeDir,
  wrapCliTemplateDir,
  wrapKernelWrapperScript,
} from '../../src/lib/vm/wrap-cli-runtime.mjs'
import { listVms } from '../../src/lib/vm/vm-registry.mjs'

const prevKernelBin = process.env.KIN_KERNEL_BIN

before(() => {
  delete process.env.KIN_KERNEL_BIN
})

after(() => {
  if (prevKernelBin == null) delete process.env.KIN_KERNEL_BIN
  else process.env.KIN_KERNEL_BIN = prevKernelBin
})

function seedTemplate(root) {
  const src = path.join(root, 'share', 'wrap-cli')
  fs.mkdirSync(src, { recursive: true })
  for (const name of [...WRAP_CLI_FILES, 'kin-kernel']) {
    fs.writeFileSync(path.join(src, name), name)
    fs.chmodSync(path.join(src, name), 0o644)
  }
  return src
}

function fakeElf64(machine, payload) {
  const extra = Buffer.from(String(payload))
  const buf = Buffer.alloc(64 + extra.length)
  buf[0] = 0x7f
  buf[1] = 0x45
  buf[2] = 0x4c
  buf[3] = 0x46
  buf[4] = 2
  buf[5] = 1
  buf.writeUInt16LE(3, 16)
  buf.writeUInt16LE(machine, 18)
  extra.copy(buf, 64)
  return buf
}

function fakeElf64Amd64(payload = 'host-kernel') {
  return fakeElf64(62, payload)
}

function fakeElf64Arm64(payload = 'native') {
  return fakeElf64(183, payload)
}

function seedNative(root) {
  const dir = path.join(root, 'share', 'wrap-cli', 'linux-arm64')
  fs.mkdirSync(dir, { recursive: true })
  const kernel = fakeElf64Arm64('native-kernel')
  const cli = fakeElf64Arm64('native-cli')
  fs.writeFileSync(path.join(dir, 'kin-kernel.bin'), kernel)
  fs.writeFileSync(path.join(dir, WRAP_CLI_BIN), cli)
  return { kernel, cli }
}

function withEnv(vars, fn) {
  const prev = {}
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k]
    if (v == null) delete process.env[k]
    else process.env[k] = v
  }
  try {
    return fn()
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v == null) delete process.env[k]
      else process.env[k] = v
    }
  }
}

test('materializeWrapCli copies both CLIs into slot home', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-'))
  try {
    seedTemplate(project)
    const vm = { id: 'vm-13' }
    const result = materializeWrapCli(project, vm)
    assert.equal(result.ok, true)
    const dest = wrapCliHomeDir(project, 'vm-13')
    assert.equal(result.dest, dest)
    assert.equal(fs.existsSync(path.join(dest, WRAP_CLI_BIN)), true)
    assert.equal(fs.readFileSync(path.join(dest, CC_NODE_BIN), 'utf8'), 'cc-node')
    assert.equal(fs.existsSync(path.join(dest, 'kin-kernel')), true)
    const mode = fs.statSync(path.join(dest, WRAP_CLI_BIN)).mode & 0o111
    assert.ok(mode !== 0)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('crag materialize copies the crag kernel and cc-node', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-crag-cc-'))
  try {
    seedTemplate(project)
    fs.mkdirSync(path.join(project, 'share', 'crag'), { recursive: true })
    fs.writeFileSync(path.join(project, 'share', 'crag', 'kin-kernel'), 'crag-kernel')
    const result = materializeSlotDataplane(project, { id: 'vm-13' }, 'crag')
    assert.equal(result.ok, true)
    const dest = wrapCliHomeDir(project, 'vm-13')
    assert.equal(fs.readFileSync(path.join(dest, 'kin-kernel.bin'), 'utf8'), 'crag-kernel')
    assert.equal(fs.readFileSync(path.join(dest, CC_NODE_BIN), 'utf8'), 'cc-node')
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})
test('crag inspection reports a change and sync marks the kernel for restart', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-crag-change-'))
  try {
    seedTemplate(project)
    const crag = path.join(project, 'share', 'crag', 'kin-kernel')
    fs.mkdirSync(path.dirname(crag), { recursive: true })
    fs.writeFileSync(crag, 'crag-kernel')
    const vm = { id: 'vm-13', dataplane: 'crag' }
    assert.equal(syncWrapSample(project, [vm]).items[0].kernel_changed, true)
    const dest = path.join(wrapCliHomeDir(project, 'vm-13'), 'kin-kernel.bin')
    const before = fs.readFileSync(dest)
    fs.writeFileSync(crag, 'crag-kernel-next')
    const checked = inspectKernelChanges(project, [vm])
    assert.equal(checked.changed_count, 1)
    assert.deepEqual(fs.readFileSync(dest), before)
    const synced = syncWrapSample(project, [vm])
    assert.equal(synced.items[0].kernel_changed, true)
    assert.equal(fs.readFileSync(dest, 'utf8'), 'crag-kernel-next')
    assert.equal(syncWrapSample(project, [vm]).items[0].kernel_changed, false)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('materializeWrapCli does not recopy identical wrap files', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-skip-'))
  try {
    seedTemplate(project)
    materializeWrapCli(project, { id: 'vm-13' })
    const cli = path.join(wrapCliHomeDir(project, 'vm-13'), WRAP_CLI_BIN)
    const wrapper = path.join(wrapCliHomeDir(project, 'vm-13'), 'kin-kernel')
    const cliM = fs.statSync(cli).mtimeMs
    const wrapM = fs.statSync(wrapper).mtimeMs
    materializeWrapCli(project, { id: 'vm-13' })
    assert.equal(fs.statSync(cli).mtimeMs, cliM)
    assert.equal(fs.statSync(wrapper).mtimeMs, wrapM)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('materializeWrapCli replaces same-size stale kernel payload', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-kernel-update-'))
  try {
    const template = seedTemplate(project)
    assert.equal(materializeWrapCli(project, { id: 'vm-13' }).ok, true)
    const source = path.join(template, 'kin-kernel')
    const dest = path.join(wrapCliHomeDir(project, 'vm-13'), 'kin-kernel.bin')
    fs.writeFileSync(source, 'new-kernel')
    fs.writeFileSync(dest, 'old-kernel')
    const timestamp = new Date(Date.now() + 60_000)
    fs.utimesSync(dest, timestamp, timestamp)

    const updated = materializeWrapCli(project, { id: 'vm-13' })
    assert.equal(updated.ok, true)
    assert.equal(updated.kernel_changed, true)
    assert.equal(fs.readFileSync(dest, 'utf8'), 'new-kernel')
    assert.equal(materializeWrapCli(project, { id: 'vm-13' }).kernel_changed, false)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('kernel inspection reports a change without writing the slot', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-inspect-'))
  try {
    const template = seedTemplate(project)
    const vm = { id: 'vm-13' }
    assert.equal(materializeWrapCli(project, vm).ok, true)
    const dest = path.join(wrapCliHomeDir(project, 'vm-13'), 'kin-kernel.bin')
    const before = fs.readFileSync(dest)
    fs.writeFileSync(path.join(template, 'kin-kernel'), 'replacement-kernel')
    const checked = inspectKernelChanges(project, [vm])
    assert.equal(checked.changed_count, 1)
    assert.deepEqual(fs.readFileSync(dest), before)
    const synced = syncWrapSample(project, [vm])
    assert.equal(synced.items[0].kernel_changed, true)
    assert.equal(fs.readFileSync(dest, 'utf8'), 'replacement-kernel')
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})
test('a failed kernel restart stays pending until the next sync', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-pending-'))
  try {
    seedTemplate(project)
    const vm = { id: 'vm-13', kernel_restart_pending: 'kernel_restart_failed' }
    assert.equal(materializeWrapCli(project, vm).ok, true)
    const checked = inspectKernelChanges(project, [vm])
    assert.equal(checked.changed_count, 1)
    const synced = syncWrapSample(project, [vm])
    assert.equal(synced.items[0].kernel_changed, true)
    delete vm.kernel_restart_pending
    assert.equal(inspectKernelChanges(project, [vm]).changed_count, 0)
    assert.equal(syncWrapSample(project, [vm]).items[0].kernel_changed, false)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('materializeWrapCli installs glibc wrapper over kernel.bin', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-wrap-'))
  try {
    seedTemplate(project)
    const dest = wrapCliHomeDir(project, 'vm-10')
    const result = materializeWrapCli(project, { id: 'vm-10' })
    assert.equal(result.ok, true)
    const wrapper = fs.readFileSync(path.join(dest, 'kin-kernel'), 'utf8')
    assert.match(wrapper, /glibc239/)
    // Job watchdog follows kernel.json idle_timeout_seconds unless env already set it.
    // The kernel reads the unprefixed JOB_IDLE_SECS.
    assert.match(wrapper, /if \[ -z "\$JOB_IDLE_SECS" \]/)
    assert.match(wrapper, /"idle_timeout_seconds"/)
    assert.match(wrapper, /export JOB_IDLE_SECS=/)
    assert.doesNotMatch(wrapper, /KIN_JOB_IDLE_SECS/)
    assert.equal(fs.existsSync(path.join(dest, 'kin-kernel.bin')), true)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('captureWrapSample promotes a proven slot into share/wrap-cli', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-promote-'))
  try {
    seedTemplate(project)
    assert.equal(materializeWrapCli(project, { id: 'vm-05' }).ok, true)
    fs.writeFileSync(path.join(wrapCliHomeDir(project, 'vm-05'), WRAP_CLI_BIN), 'proven-cli\n')
    const captured = captureWrapSample(project, { id: 'vm-05' })
    assert.equal(captured.ok, true)
    const sample = fs.readFileSync(path.join(wrapCliTemplateDir(project), WRAP_CLI_BIN), 'utf8')
    assert.equal(sample, 'proven-cli\n')
    const meta = JSON.parse(fs.readFileSync(path.join(wrapCliTemplateDir(project), 'SAMPLE.json'), 'utf8'))
    assert.equal(meta.source_vm, 'vm-05')
    const synced = syncWrapSample(project, [{ id: 'vm-10' }])
    assert.equal(synced.ok, true)
    assert.equal(synced.ok_count, 1)
    assert.equal(fs.readFileSync(path.join(wrapCliHomeDir(project, 'vm-10'), WRAP_CLI_BIN), 'utf8'), 'proven-cli\n')
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('legacy VM ids are included in fleet wrap synchronization', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-legacy-vm-'))
  try {
    seedTemplate(project)
    const vmDir = path.join(project, 'vms')
    fs.mkdirSync(vmDir, { recursive: true })
    fs.writeFileSync(path.join(vmDir, 'active.json'), JSON.stringify({ active_vm: 'legacy-slot' }))
    fs.writeFileSync(path.join(vmDir, 'legacy-slot.json'), JSON.stringify({ id: 'legacy-slot', name: 'legacy-slot' }))
    fs.writeFileSync(path.join(vmDir, 'vm-01.json'), JSON.stringify({ id: 'vm-01', name: 'vm-01' }))
    const synced = syncWrapSample(project, listVms(project))
    assert.equal(synced.ok, true)
    assert.deepEqual(synced.items.map((item) => item.id).sort(), ['legacy-slot', 'vm-01'])
    assert.equal(
      fs.readFileSync(path.join(wrapCliHomeDir(project, 'legacy-slot'), 'kin-kernel.bin'), 'utf8'),
      'kin-kernel',
    )
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('materializeWrapCli replaces a busy dest via unlink', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-busy-'))
  try {
    seedTemplate(project)
    const dest = wrapCliHomeDir(project, 'vm-13')
    fs.mkdirSync(dest, { recursive: true })
    const cli = path.join(dest, WRAP_CLI_BIN)
    fs.writeFileSync(cli, 'old-cli')
    fs.chmodSync(cli, 0o755)
    const fd = fs.openSync(cli, 'r')
    try {
      const result = materializeWrapCli(project, { id: 'vm-13' })
      assert.equal(result.ok, true, result.error)
      assert.equal(fs.readFileSync(path.join(dest, WRAP_CLI_BIN), 'utf8'), WRAP_CLI_BIN)
    } finally {
      fs.closeSync(fd)
    }
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('makeWrapSample builds share/wrap-cli without a VM', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-make-'))
  try {
    seedTemplate(project)
    const made = makeWrapSample(project)
    assert.equal(made.ok, true, made.error)
    const meta = JSON.parse(fs.readFileSync(path.join(wrapCliTemplateDir(project), 'SAMPLE.json'), 'utf8'))
    assert.equal(meta.source, 'manual')
    assert.match(fs.readFileSync(path.join(wrapCliTemplateDir(project), 'kin-kernel'), 'utf8'), /glibc239/)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('materializeWrapCli fails when the template is missing', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-missing-'))
  try {
    const result = materializeWrapCli(project, { id: 'vm-01' })
    assert.equal(result.ok, false)
    assert.equal(result.code, 'wrap_cli_template_missing')
    assert.equal(fs.existsSync(wrapCliHomeDir(project, 'vm-01')), false)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('inspectWrapCliDir requires kernel payload', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-bad-'))
  try {
    fs.writeFileSync(path.join(dir, WRAP_CLI_BIN), 'x')
    const missing = inspectWrapCliDir(dir)
    assert.equal(missing.ok, false)
    assert.equal(missing.code, 'wrap_cli_incomplete')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('wrapCliTemplateDir prefers KIN_WRAP_CLI_ROOT', () => {
  const prev = process.env.KIN_WRAP_CLI_ROOT
  process.env.KIN_WRAP_CLI_ROOT = '/opt/kin-gateway/share/wrap-cli'
  try {
    assert.equal(wrapCliTemplateDir('/tmp/project'), '/opt/kin-gateway/share/wrap-cli')
  } finally {
    if (prev == null) delete process.env.KIN_WRAP_CLI_ROOT
    else process.env.KIN_WRAP_CLI_ROOT = prev
  }
})

test('materializeWrapCli prefers KIN_KERNEL_BIN over sample kernel', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-configured-'))
  const prev = process.env.KIN_KERNEL_BIN
  try {
    seedTemplate(project)
    const host = path.join(project, 'host-kernel')
    fs.writeFileSync(host, 'host-kernel')
    process.env.KIN_KERNEL_BIN = host
    assert.equal(materializeWrapCli(project, { id: 'vm-13' }).ok, true)
    assert.equal(fs.readFileSync(path.join(wrapCliHomeDir(project, 'vm-13'), 'kin-kernel.bin'), 'utf8'), 'host-kernel')
  } finally {
    if (prev == null) delete process.env.KIN_KERNEL_BIN
    else process.env.KIN_KERNEL_BIN = prev
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('materializeWrapCli falls back to project bin/kin-kernel', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-bundled-'))
  try {
    seedTemplate(project)
    fs.mkdirSync(path.join(project, 'bin'), { recursive: true })
    fs.writeFileSync(path.join(project, 'bin', 'kin-kernel'), 'bundled-kernel')
    assert.equal(materializeWrapCli(project, { id: 'vm-13' }).ok, true)
    assert.equal(
      fs.readFileSync(path.join(wrapCliHomeDir(project, 'vm-13'), 'kin-kernel.bin'), 'utf8'),
      'bundled-kernel',
    )
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('makeWrapSample overlays configured kernel onto the sample', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-make-host-'))
  const prev = process.env.KIN_KERNEL_BIN
  try {
    seedTemplate(project)
    const host = path.join(project, 'host-kernel')
    fs.writeFileSync(host, 'host-kernel')
    process.env.KIN_KERNEL_BIN = host
    const made = makeWrapSample(project)
    assert.equal(made.ok, true, made.error)
    assert.equal(fs.readFileSync(path.join(wrapCliTemplateDir(project), 'kin-kernel.bin'), 'utf8'), 'host-kernel')
  } finally {
    if (prev == null) delete process.env.KIN_KERNEL_BIN
    else process.env.KIN_KERNEL_BIN = prev
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('inspectLinuxAmd64Elf accepts linux amd64 ELF64', () => {
  assert.equal(inspectLinuxAmd64Elf(fakeElf64Amd64()).ok, true)
  assert.equal(inspectLinuxAmd64Elf(Buffer.from('not-elf')).ok, false)
  const wrongMachine = fakeElf64Amd64()
  wrongMachine.writeUInt16LE(3, 18)
  assert.equal(inspectLinuxAmd64Elf(wrongMachine).code, 'kernel_not_amd64')
})

test('replaceKernelBinary writes sample and project bin kernel', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-upload-'))
  try {
    seedTemplate(project)
    const elf = fakeElf64Amd64('uploaded-kernel')
    const replaced = replaceKernelBinary(project, elf)
    assert.equal(replaced.ok, true, replaced.error)
    assert.equal(replaced.kernel.source, 'configured')
    assert.ok(fs.readFileSync(path.join(project, 'share', 'wrap-cli', 'kin-kernel.bin')).equals(elf))
    assert.ok(fs.readFileSync(path.join(project, 'bin', 'kin-kernel')).equals(elf))
    const meta = JSON.parse(fs.readFileSync(path.join(wrapCliTemplateDir(project), 'SAMPLE.json'), 'utf8'))
    assert.equal(meta.source, 'upload')
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('replaceKernelBinary rejects non-ELF payloads', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-bad-elf-'))
  try {
    seedTemplate(project)
    const replaced = replaceKernelBinary(project, Buffer.alloc(64, 0x41))
    assert.equal(replaced.ok, false)
    assert.equal(replaced.code, 'kernel_not_elf')
    assert.equal(fs.existsSync(path.join(project, 'bin', 'kin-kernel')), false)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('ARM64 host materializes the native kernel and cli-node into Docker slots', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-native-'))
  try {
    seedTemplate(project)
    const native = seedNative(project)
    withEnv({ KIN_SLOT_HOST_ARCH: 'arm64', KIN_NATIVE_SLOTS: null }, () => {
      assert.equal(describeWrapSample(project).native_arm64.enabled, true)
      const result = materializeWrapCli(project, { id: 'vm-20' })
      assert.equal(result.ok, true, result.error)
      assert.equal(result.arch, 'arm64')
      const dest = wrapCliHomeDir(project, 'vm-20')
      assert.ok(fs.readFileSync(path.join(dest, 'kin-kernel.bin')).equals(native.kernel))
      assert.ok(fs.readFileSync(path.join(dest, WRAP_CLI_BIN)).equals(native.cli))
      // cc-node has no native build and stays the amd64 template copy.
      assert.equal(fs.readFileSync(path.join(dest, CC_NODE_BIN), 'utf8'), 'cc-node')
      const wrapper = fs.readFileSync(path.join(dest, 'kin-kernel'), 'utf8')
      assert.doesNotMatch(wrapper, /ld-linux/)
      assert.match(wrapper, /export JOB_IDLE_SECS=/)
      assert.equal(inspectKernelChanges(project, [{ id: 'vm-20' }]).changed_count, 0)
    })
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('native pair is skipped for KVM, node slots, amd64 hosts and KIN_NATIVE_SLOTS=0', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-native-skip-'))
  try {
    seedTemplate(project)
    seedNative(project)
    const cases = [
      [{ KIN_SLOT_HOST_ARCH: 'arm64' }, { id: 'vm-k', runtime: { type: 'kvm' } }],
      [{ KIN_SLOT_HOST_ARCH: 'arm64' }, { id: 'vm-n', node_id: 'node-1' }],
      [{ KIN_SLOT_HOST_ARCH: 'x64' }, { id: 'vm-x' }],
      [{ KIN_SLOT_HOST_ARCH: 'arm64', KIN_NATIVE_SLOTS: '0' }, { id: 'vm-o' }],
    ]
    for (const [env, vm] of cases) {
      withEnv({ KIN_NATIVE_SLOTS: null, ...env }, () => {
        const result = materializeWrapCli(project, vm)
        assert.equal(result.ok, true, result.error)
        assert.equal(result.arch, 'amd64', vm.id)
        const dest = wrapCliHomeDir(project, vm.id)
        assert.equal(fs.readFileSync(path.join(dest, WRAP_CLI_BIN), 'utf8'), WRAP_CLI_BIN)
        assert.match(fs.readFileSync(path.join(dest, 'kin-kernel'), 'utf8'), /ld-linux-x86-64/)
      })
    }
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('switching a slot between amd64 and native counts as a kernel change', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-native-switch-'))
  try {
    seedTemplate(project)
    seedNative(project)
    const vm = { id: 'vm-21' }
    withEnv({ KIN_SLOT_HOST_ARCH: 'arm64', KIN_NATIVE_SLOTS: '0' }, () => materializeWrapCli(project, vm))
    withEnv({ KIN_SLOT_HOST_ARCH: 'arm64', KIN_NATIVE_SLOTS: null }, () => {
      assert.equal(inspectKernelChanges(project, [vm]).changed_count, 1)
      assert.equal(syncWrapSample(project, [vm]).items[0].kernel_changed, true)
      assert.equal(inspectKernelChanges(project, [vm]).changed_count, 0)
    })
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('incomplete or non-arm64 native payload falls back to amd64', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-native-bad-'))
  try {
    seedTemplate(project)
    seedNative(project)
    const dir = path.join(project, 'share', 'wrap-cli', 'linux-arm64')
    fs.writeFileSync(path.join(dir, WRAP_CLI_BIN), fakeElf64Amd64('wrong-arch'))
    withEnv({ KIN_SLOT_HOST_ARCH: 'arm64', KIN_NATIVE_SLOTS: null }, () => {
      const described = describeWrapSample(project).native_arm64
      assert.equal(described.ok, false)
      assert.equal(described.code, 'native_arm64_invalid')
      assert.equal(materializeWrapCli(project, { id: 'vm-22' }).arch, 'amd64')
      fs.rmSync(path.join(dir, 'kin-kernel.bin'))
      assert.equal(describeWrapSample(project).native_arm64.code, 'native_arm64_missing')
    })
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('captureWrapSample refuses a native slot home', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-native-capture-'))
  try {
    seedTemplate(project)
    seedNative(project)
    withEnv({ KIN_SLOT_HOST_ARCH: 'arm64', KIN_NATIVE_SLOTS: null }, () => {
      assert.equal(materializeWrapCli(project, { id: 'vm-23' }).arch, 'arm64')
      const captured = captureWrapSample(project, { id: 'vm-23' })
      assert.equal(captured.ok, false)
      assert.equal(captured.code, 'wrap_sample_native')
      assert.equal(fs.readFileSync(path.join(wrapCliTemplateDir(project), WRAP_CLI_BIN), 'utf8'), WRAP_CLI_BIN)
    })
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('uploading an arm64 kernel or cli-node writes the native pair only', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-native-upload-'))
  try {
    seedTemplate(project)
    const kernel = fakeElf64Arm64('uploaded-native-kernel')
    const cli = fakeElf64Arm64('uploaded-native-cli')
    const k = replaceKernelBinary(project, kernel)
    assert.equal(k.ok, true, k.error)
    assert.equal(k.arch, 'arm64')
    const c = replaceCliNodeBinary(project, cli)
    assert.equal(c.ok, true, c.error)
    assert.equal(c.native_arm64.ok, true)
    const dir = path.join(project, 'share', 'wrap-cli', 'linux-arm64')
    assert.ok(fs.readFileSync(path.join(dir, 'kin-kernel.bin')).equals(kernel))
    assert.ok(fs.readFileSync(path.join(dir, WRAP_CLI_BIN)).equals(cli))
    assert.equal(fs.existsSync(path.join(project, 'bin', 'kin-kernel')), false)
    assert.equal(fs.readFileSync(path.join(wrapCliTemplateDir(project), WRAP_CLI_BIN), 'utf8'), WRAP_CLI_BIN)
    assert.equal(replaceCcNodeBinary(project, fakeElf64Arm64('cc')).ok, false)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('inspectLinuxElf checks the requested architecture', () => {
  assert.equal(inspectLinuxElf(fakeElf64Arm64(), 'arm64').ok, true)
  assert.equal(inspectLinuxElf(fakeElf64Arm64(), 'amd64').code, 'kernel_not_amd64')
  assert.equal(inspectLinuxElf(fakeElf64Amd64(), 'arm64').code, 'kernel_not_arm64')
})

test('the amd64 wrapper keeps the glibc loader and the native one drops it', () => {
  assert.match(wrapKernelWrapperScript(), /exec "\$LOADER" --library-path/)
  const native = wrapKernelWrapperScript({ native: true })
  assert.doesNotMatch(native, /LOADER/)
  assert.match(native, /exec "\$BIN" "\$@"/)
})
