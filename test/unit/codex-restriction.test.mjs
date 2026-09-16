import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyCodexClient, restrictCodexClient } from '../../src/lib/protocol/codex-restriction.mjs'
import { normalizeCodexRouting } from '../../src/lib/protocol/codex-route.mjs'

const routing = { codex: normalizeCodexRouting() }

test('official Codex CLI is allowed', () => {
  const headers = { 'user-agent': 'codex_cli_rs/0.153.4 (linux x86_64)', 'x-codex-installation-id': 'dev-1' }
  assert.equal(classifyCodexClient(headers, {}), 'official_codex')
  assert.equal(restrictCodexClient(headers, {}, routing).ok, true)
})

test('Claude Code is rejected on Codex hop', () => {
  const headers = { 'user-agent': 'claude-cli/2.1.234' }
  const result = restrictCodexClient(headers, {}, routing)
  assert.equal(result.ok, false)
  assert.equal(result.kind, 'claude_code')
  assert.equal(result.code, 'client_not_allowed')
})

test('third-party OpenAI clients are allowed', () => {
  const curl = restrictCodexClient(
    { 'user-agent': 'curl/8.0' },
    { messages: [{ role: 'user', content: 'hi' }] },
    routing,
    'openai.chat',
  )
  assert.equal(curl.ok, true)
  assert.equal(curl.kind, 'openai_compatible')
  const unknown = restrictCodexClient({ 'user-agent': 'curl/8.0' }, {}, routing)
  assert.equal(unknown.ok, true)
})
