import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  captureWrapSample,
  inspectWrapCliDir,
  makeWrapSample,
  materializeWrapCli,
  syncWrapSample,
  wrapCliHomeDir,
  wrapCliTemplateDir,
} from '../../src/lib/vm/wrap-cli-runtime.mjs'

function seedTemplate(root) {
  const src = path.join(root, 'share', 'wrap-cli')
  fs.mkdirSync(path.join(src, 'cli-dist'), { recursive: true })
  for (const name of ['bun', 'cli-node', 'kin-kernel']) {
    fs.writeFileSync(path.join(src, name), name)
    fs.chmodSync(path.join(src, name), 0o644)
  }
  fs.writeFileSync(path.join(src, 'cli-dist', 'cli.js'), 'export {}\n')
  return src
}

test('materializeWrapCli copies patched dist into slot home', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-'))
  try {
    seedTemplate(project)
    const vm = { id: 'vm-13' }
    const result = materializeWrapCli(project, vm)
    assert.equal(result.ok, true)
    const dest = wrapCliHomeDir(project, 'vm-13')
    assert.equal(result.dest, dest)
    assert.equal(fs.existsSync(path.join(dest, 'cli-node')), true)
    assert.equal(fs.existsSync(path.join(dest, 'cli-dist', 'cli.js')), true)
    assert.equal(fs.existsSync(path.join(dest, 'kin-kernel')), true)
    const mode = fs.statSync(path.join(dest, 'cli-node')).mode & 0o111
    assert.ok(mode !== 0)
  } finally {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

test('materializeWrapCli does not recopy identical wrap files', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-skip-'))
  try {
    seedTemplate(project)
    materializeWrapCli(project, { id: 'vm-13' })
    const bun = path.join(wrapCliHomeDir(project, 'vm-13'), 'bun')
    const wrapper = path.join(wrapCliHomeDir(project, 'vm-13'), 'kin-kernel')
    const bunM = fs.statSync(bun).mtimeMs
    const wrapM = fs.statSync(wrapper).mtimeMs
    materializeWrapCli(project, { id: 'vm-13' })
    assert.equal(fs.statSync(bun).mtimeMs, bunM)
    assert.equal(fs.statSync(wrapper).mtimeMs, wrapM)
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
    fs.writeFileSync(path.join(wrapCliHomeDir(project, 'vm-05'), 'cli-node'), 'proven-cli\n')
    const captured = captureWrapSample(project, { id: 'vm-05' })
    assert.equal(captured.ok, true)
    const sample = fs.readFileSync(path.join(wrapCliTemplateDir(project), 'cli-node'), 'utf8')
    assert.equal(sample, 'proven-cli\n')
    const meta = JSON.parse(fs.readFileSync(path.join(wrapCliTemplateDir(project), 'SAMPLE.json'), 'utf8'))
    assert.equal(meta.source_vm, 'vm-05')
    const synced = syncWrapSample(project, [{ id: 'vm-10' }])
    assert.equal(synced.ok, true)
    assert.equal(synced.ok_count, 1)
    assert.equal(fs.readFileSync(path.join(wrapCliHomeDir(project, 'vm-10'), 'cli-node'), 'utf8'), 'proven-cli\n')
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
    const bun = path.join(dest, 'bun')
    fs.writeFileSync(bun, 'old-bun')
    fs.chmodSync(bun, 0o755)
    const fd = fs.openSync(bun, 'r')
    try {
      const result = materializeWrapCli(project, { id: 'vm-13' })
      assert.equal(result.ok, true, result.error)
      assert.equal(fs.readFileSync(path.join(dest, 'bun'), 'utf8'), 'bun')
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

test('inspectWrapCliDir requires cli-dist entry', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-wrap-cli-bad-'))
  try {
    fs.writeFileSync(path.join(dir, 'bun'), 'x')
    fs.writeFileSync(path.join(dir, 'cli-node'), 'x')
    const missing = inspectWrapCliDir(dir)
    assert.equal(missing.ok, false)
    fs.mkdirSync(path.join(dir, 'cli-dist'))
    const still = inspectWrapCliDir(dir)
    assert.equal(still.ok, false)
    assert.equal(still.code, 'wrap_cli_incomplete')
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
