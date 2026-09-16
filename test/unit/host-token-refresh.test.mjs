import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { writeWorkerCredentialFile, readWorkerCredentialFile } from '../../src/lib/oauth/oauth-credentials.mjs'
import { refreshSlotCredentialIfNeeded } from '../../src/lib/oauth/host-token-refresh.mjs'

function tempHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-host-refresh-'))
  return home
}

test('host refresh skips setup-token without refresh and apikey', async () => {
  const home = tempHome()
  writeWorkerCredentialFile(home, {
    type: 'setup-token',
    access_token: 'sk-ant-oat01-live',
    refresh_token: '',
    expires_at: Date.now() + 3600_000,
  })
  const skip = await refreshSlotCredentialIfNeeded({ homeDir: home, force: true })
  assert.equal(skip.ok, true)
  assert.equal(skip.refreshed, false)
  const keyHome = tempHome()
  writeWorkerCredentialFile(keyHome, { type: 'apikey', api_key: 'sk-ant-api03-x' })
  const key = await refreshSlotCredentialIfNeeded({ homeDir: keyHome, force: true })
  assert.equal(key.ok, true)
  assert.equal(key.refreshed, false)
  fs.rmSync(home, { recursive: true, force: true })
  fs.rmSync(keyHome, { recursive: true, force: true })
})

test('host refresh refuses missing SOCKS', async () => {
  const home = tempHome()
  writeWorkerCredentialFile(home, {
    type: 'setup-token',
    access_token: 'sk-ant-oat01-old',
    refresh_token: 'sk-ant-ort01-old',
    expires_at: Date.now() + 60_000,
    scopes: ['user:inference'],
  })
  const out = await refreshSlotCredentialIfNeeded({ homeDir: home, force: true, vm: { id: 'vm-05' } })
  assert.equal(out.ok, false)
  assert.equal(out.error.code, 'proxy_required')
  fs.rmSync(home, { recursive: true, force: true })
})

test('host refresh merges new access over setup-token via SOCKS mock', async () => {
  const home = tempHome()
  writeWorkerCredentialFile(home, {
    type: 'setup-token',
    access_token: 'sk-ant-oat01-old',
    refresh_token: 'sk-ant-ort01-old',
    expires_at: Date.now() + 60_000,
    scopes: ['user:inference'],
  })
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      access_token: 'sk-ant-oat01-new',
      refresh_token: 'sk-ant-ort01-new',
      expires_in: 28800,
    }),
  })
  const out = await refreshSlotCredentialIfNeeded({
    homeDir: home,
    force: true,
    proxyUrl: 'socks5h://127.0.0.1:1080',
    fetchImpl,
  })
  assert.equal(out.ok, true)
  assert.equal(out.refreshed, true)
  const cred = readWorkerCredentialFile(home)
  assert.equal(cred.type, 'setup-token')
  assert.equal(cred.access_token, 'sk-ant-oat01-new')
  assert.equal(cred.refresh_token, 'sk-ant-ort01-new')
  fs.rmSync(home, { recursive: true, force: true })
})

test('fresh token is not rotated without force', async () => {
  const home = tempHome()
  writeWorkerCredentialFile(home, {
    type: 'setup-token',
    access_token: 'sk-ant-oat01-fresh',
    refresh_token: 'sk-ant-ort01-fresh',
    expires_at: Date.now() + 8 * 3600_000,
  })
  const out = await refreshSlotCredentialIfNeeded({
    homeDir: home,
    proxyUrl: 'socks5h://127.0.0.1:1080',
    fetchImpl: async () => {
      throw new Error('must not refresh')
    },
  })
  assert.equal(out.ok, true)
  assert.equal(out.refreshed, false)
  fs.rmSync(home, { recursive: true, force: true })
})
