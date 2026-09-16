import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { createHandleProtocol } from '../../src/lib/protocol/handle-protocol.mjs'
import { CRS_OFFICIAL_AGENT_PROMPT } from '../../src/lib/identity/crs-persona.mjs'
import { resolveInferenceBackend, messagesUrl } from '../../src/lib/pool/api-protocol.mjs'

function messageStart() {
  return `data: ${JSON.stringify({
    type: 'message_start',
    message: { type: 'message', role: 'assistant', content: [], model: 'upstream-model' },
  })}\n\n`
}

test('managed key category selects backend', () => {
  assert.equal(resolveInferenceBackend({ apiKeyKind: 'managed', apiKeyRecord: { category: 'api' } }), 'api')
  assert.equal(resolveInferenceBackend({ apiKeyKind: 'managed', apiKeyRecord: { category: 'oauth' } }), 'oauth')
  assert.equal(resolveInferenceBackend({ apiKeyKind: 'managed', apiKeyRecord: {} }), 'oauth')
})

test('master key defaults oauth unless x-kin-backend=api', () => {
  assert.equal(resolveInferenceBackend({ apiKeyKind: 'master', headers: {} }), 'oauth')
  assert.equal(resolveInferenceBackend({ apiKeyKind: 'master', headers: { 'x-kin-backend': 'api' } }), 'api')
})

test('messagesUrl appends /v1/messages?beta=true', () => {
  assert.equal(messagesUrl('https://api.example.com'), 'https://api.example.com/v1/messages?beta=true')
  assert.equal(messagesUrl('https://api.example.com/'), 'https://api.example.com/v1/messages?beta=true')
})

test('API backend applies the global official_full persona setting', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-api-persona-'))
  const routingFile = path.join(root, 'routing.json')
  const socketPath = path.join(root, 'run', 'api-kernel.sock')
  fs.mkdirSync(path.dirname(socketPath), { recursive: true })
  fs.writeFileSync(
    routingFile,
    JSON.stringify({ compatibility: { persona_preset: 'official_full', overlay_preset: 'off' } }),
  )
  let received = null
  const kernel = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      received = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      res.end(messageStart())
    })
  })
  await new Promise((resolve, reject) => {
    kernel.once('error', reject)
    kernel.listen(socketPath, resolve)
  })
  const response = { headersSent: false, on() {}, write() {}, end() {} }
  const stats = { errors: 0, requests: 0, by_route: {}, passthrough: 0, rewrite: 0, convert: 0 }
  const handler = createHandleProtocol({
    json: (_res, status, body) => {
      response.status = status
      response.body = body
      return body
    },
    writeSSEHeaders() {},
    readBody: async () => ({ model: 'claude-haiku-4-5', messages: [{ role: 'user', content: 'hello' }] }),
    requireAuth: () => true,
    cfg: {
      rewrite: { enabled: false },
      intercept: { rules: [] },
      distill: { enabled: false },
      limits: { max_body_bytes: 1024 * 1024, upstream_timeout_ms: 2000 },
      paths: { data: root },
    },
    requestLog: { start: () => ({ request_id: 'api-persona-test' }), finish() {} },
    stickyRouter: {},
    accountQuota: {},
    apiKeyStore: {},
    apiScheduler: {
      pick: () => ({
        ok: true,
        endpoint: { id: 'ep-test', kind: 'claude', protocol: 'anthropic', base_url: 'https://upstream.invalid' },
        upstream_model: 'claude-haiku-4-5',
        key: { id: 'key-test', api_key: 'secret' },
      }),
    },
    apiEndpointStore: {},
    stats,
    routingConfigPath: routingFile,
    routingConfig: {
      compatibility: { persona_preset: 'official_full', overlay_preset: 'off' },
      failover: {},
    },
    groupsRepo: { rateMultiplier: () => 1 },
  })
  const req = {
    method: 'POST',
    url: '/v1/messages',
    headers: { authorization: 'Bearer master', 'x-kin-backend': 'api', 'user-agent': 'test-client' },
    apiKeyKind: 'master',
    once() {},
    off() {},
  }
  try {
    await handler.handleProtocol(req, response, 'anthropic.messages', '/v1/messages')
    assert.equal(response.status, 200)
    assert.ok(received)
    const outbound = JSON.parse(received.body)
    assert.equal(outbound.system.length, 4)
    assert.equal(outbound.system[2].text, CRS_OFFICIAL_AGENT_PROMPT)
  } finally {
    await new Promise((resolve) => kernel.close(resolve))
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('OAuth backend prepares an unofficial slot persona override without leaking the request', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kin-slot-persona-'))
  const routingFile = path.join(root, 'routing.json')
  fs.writeFileSync(routingFile, JSON.stringify({ compatibility: { persona_preset: 'official' } }))
  const vm = { id: 'vm-01', persona_preset: 'zero', claude: { mode: 'oauth' } }
  const selected = {
    vmId: vm.id,
    accountId: 'account-1',
    vm,
    exec: {
      vmId: vm.id,
      vm,
      homeDir: path.join(root, 'home'),
      oauth: { account_uuid: 'account-1' },
      timezone: 'UTC',
      locale: 'en_US.UTF-8',
    },
  }
  let prepared = null
  const response = { headersSent: false, on() {}, write() {}, end() {} }
  const stats = { errors: 0, requests: 0, by_route: {}, passthrough: 0, rewrite: 0, convert: 0 }
  const handler = createHandleProtocol({
    json: (_res, status, body) => {
      response.status = status
      response.body = body
      return body
    },
    writeSSEHeaders() {},
    readBody: async () => ({ model: 'claude-haiku-4-5', messages: [{ role: 'user', content: 'hello' }] }),
    requireAuth: () => true,
    cfg: {
      rewrite: { enabled: false },
      intercept: { rules: [] },
      distill: { enabled: false },
      limits: { max_body_bytes: 1024 * 1024, upstream_timeout_ms: 2000, stream_idle_timeout_ms: 2000 },
      paths: { data: root, project: root },
    },
    requestLog: { start: () => ({ request_id: 'slot-persona-test' }), finish() {} },
    stickyRouter: { extractPoolKey: () => null, collectPoolKeys: () => [] },
    accountQuota: {},
    apiKeyStore: {},
    apiScheduler: {},
    apiEndpointStore: {},
    stats,
    routingConfigPath: routingFile,
    routingConfig: { compatibility: { persona_preset: 'official' }, failover: {} },
    failoverRunner: {
      async run(opts) {
        prepared = await opts.applyAttempt(opts.canonicalBody, selected)
        return {
          ok: false,
          status: 503,
          body: { error: { type: 'server_error', code: 'upstream_error', message: 'test stop' } },
          headers: {},
        }
      },
    },
    groupsRepo: { rateMultiplier: () => 1 },
  })
  const req = {
    method: 'POST',
    url: '/v1/messages',
    headers: { authorization: 'Bearer master', 'user-agent': 'Go-http-client/2.0' },
    apiKeyKind: 'master',
    once() {},
    off() {},
  }

  try {
    await handler.handleProtocol(req, response, 'anthropic.messages', '/v1/messages')
    assert.equal(response.status, 503)
    assert.ok(prepared?.body)
    assert.equal(prepared.body.system, undefined)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
