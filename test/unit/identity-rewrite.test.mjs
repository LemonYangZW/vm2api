import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyCrsIdentityReplace,
  extractCallerSession,
  resolveOutboundSessionId,
  uuidFromSeed,
  UNOFFICIAL_SESSION_SEED,
  parseUserId,
} from '../../src/lib/identity/identity-rewrite.mjs'

const SLOT = {
  vmId: 'vm-01',
  deviceId: 'vm-dev',
  accountUuid: 'vm-acc',
  sessionId: 'vm-sess',
  email: 'slot@example.com',
  metadataUserId: JSON.stringify({ device_id: 'vm-dev', account_uuid: 'vm-acc', session_id: 'vm-sess' }),
}

test('unofficial identity: device/account are slot, session is minted not caller raw', () => {
  const body = {
    settings: { theme: 'light' },
    metadata: {
      user_id: JSON.stringify({ device_id: 'win-dev', account_uuid: 'win-acc', session_id: 'win-sess' }),
      machine_id: 'pc',
    },
  }
  const out = applyCrsIdentityReplace(body, SLOT, body)
  const uid = JSON.parse(out.metadata.user_id)
  const minted = uuidFromSeed(UNOFFICIAL_SESSION_SEED + 'win-sess')
  assert.equal(uid.device_id, 'vm-dev')
  assert.equal(uid.account_uuid, 'vm-acc')
  assert.equal(uid.session_id, minted)
  assert.notEqual(uid.session_id, 'win-sess')
  assert.notEqual(uid.session_id, 'vm-sess')
  assert.equal(uid.email, undefined)
  assert.equal(String(out.metadata.user_id).includes('@'), false)
  assert.equal(out.settings, undefined)
  assert.equal(out.metadata.machine_id, undefined)
})

test('official Claude Code identity keeps the caller session', () => {
  const body = {
    metadata: {
      user_id: JSON.stringify({ device_id: 'win-dev', account_uuid: 'win-acc', session_id: 'win-sess' }),
    },
  }
  const out = applyCrsIdentityReplace(body, SLOT, body, {}, { officialClient: true })
  const uid = JSON.parse(out.metadata.user_id)
  assert.equal(uid.session_id, 'win-sess')
  assert.equal(uid.device_id, 'vm-dev')
  assert.equal(uid.account_uuid, 'vm-acc')
})

test('resolveOutboundSessionId always returns a session', () => {
  const minted = resolveOutboundSessionId('caller-raw')
  assert.equal(minted, uuidFromSeed(UNOFFICIAL_SESSION_SEED + 'caller-raw'))
  assert.notEqual(minted, 'caller-raw')
  assert.equal(resolveOutboundSessionId('keep-me', { officialClient: true }), 'keep-me')
  assert.match(resolveOutboundSessionId('', { officialClient: true }), /^[0-9a-f-]{36}$/)
  assert.match(resolveOutboundSessionId(''), /^[0-9a-f-]{36}$/)
})

test('identity replace is stable for the same inbound session', () => {
  const inbound = { metadata: { user_id: JSON.stringify({ device_id: 'd1', session_id: 's1' }) } }
  const id = { accountUuid: 'acc', deviceId: 'vm', vmId: 'vm-01' }
  const a = applyCrsIdentityReplace({ model: 'x' }, id, inbound)
  const b = applyCrsIdentityReplace({ model: 'x' }, id, inbound)
  assert.deepEqual(JSON.parse(a.metadata.user_id), JSON.parse(b.metadata.user_id))
})

test('parseUserId accepts JSON, object, and legacy underscore formats', () => {
  const json = parseUserId(JSON.stringify({ device_id: 'd', account_uuid: 'a', session_id: 's' }))
  assert.deepEqual(json, { device_id: 'd', account_uuid: 'a', session_id: 's' })
  const obj = parseUserId({ deviceId: 'd2', accountUuid: 'a2', sessionId: 's2' })
  assert.deepEqual(obj, { device_id: 'd2', account_uuid: 'a2', session_id: 's2' })
  const legacy = parseUserId('user_dev1_account_acc1_session_sess1')
  assert.deepEqual(legacy, { device_id: 'dev1', account_uuid: 'acc1', session_id: 'sess1' })
  assert.equal(parseUserId(''), null)
})

test('extractCallerSession prefers metadata, then sticky headers, then body keys', () => {
  assert.equal(
    extractCallerSession({
      inbound: { metadata: { user_id: { session_id: 'from-meta' } } },
      headers: { 'x-session-id': 'from-header' },
    }),
    'from-meta',
  )
  assert.equal(
    extractCallerSession({
      inbound: { model: 'x' },
      headers: { 'x-claude-code-session-id': 'from-header' },
    }),
    'from-header',
  )
  assert.equal(
    extractCallerSession({
      inbound: { conversation_id: 'from-body' },
      headers: {},
    }),
    'from-body',
  )
})

test('uuidFromSeed is a deterministic v4-shaped uuid', () => {
  const a = uuidFromSeed('seed')
  const b = uuidFromSeed('seed')
  assert.equal(a, b)
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})
