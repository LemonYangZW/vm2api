import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  chatToCodexResponses,
  normalizeCodexResponsesInput,
  responsesSseToChatChunk,
  stripCodexIdentity,
  toCodexResponses,
} from '../../src/lib/protocol/codex-convert.mjs'

test('strips client identity fields', () => {
  const out = stripCodexIdentity({
    model: 'gpt-5.4',
    client_metadata: { device_id: 'client' },
    base_url: 'http://evil',
    metadata: { user_id: 'u1', topic: 'keep' },
    input: [],
  })
  assert.equal(out.model, 'gpt-5.4')
  assert.equal(out.client_metadata, undefined)
  assert.equal(out.base_url, undefined)
  assert.equal(out.metadata.user_id, undefined)
  assert.equal(out.metadata.topic, 'keep')
})

test('chat converts to responses input', () => {
  const body = chatToCodexResponses({
    model: 'gpt-5.4',
    messages: [{ role: 'user', content: 'hi' }],
    tools: [{ type: 'function', function: { name: 'lookup', parameters: { type: 'object' } } }],
  })
  assert.equal(body.model, 'gpt-5.4')
  assert.equal(body.store, false)
  assert.equal(body.input[0].role, 'user')
  assert.equal(body.input[0].content[0].text, 'hi')
  assert.equal(body.tools[0].name, 'lookup')
})

test('native responses string input becomes Codex list', () => {
  const converted = toCodexResponses('openai.responses', {
    model: 'gpt-5.5',
    input: 'hello',
    stream: true,
  })
  assert.equal(converted.ok, true)
  assert.equal(Array.isArray(converted.body.input), true)
  assert.equal(converted.body.input[0].content[0].text, 'hello')
  const already = normalizeCodexResponsesInput({
    input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'keep' }] }],
  })
  assert.equal(already.input[0].content[0].text, 'keep')
})

test('Codex hop drops max_output_tokens and keeps reasoning effort', () => {
  const converted = toCodexResponses('openai.responses', {
    model: 'gpt-5.5',
    input: 'hello',
    max_output_tokens: 8192,
    temperature: 1,
    reasoning_effort: 'high',
  })
  assert.equal(converted.body.max_output_tokens, undefined)
  assert.equal(converted.body.temperature, undefined)
  assert.equal(converted.body.reasoning.effort, 'high')
})

test('anthropic convert stays off by default', () => {
  const rejected = toCodexResponses(
    'anthropic.messages',
    { model: 'gpt-5.4', messages: [{ role: 'user', content: 'x' }] },
    {},
  )
  assert.equal(rejected.ok, false)
  const allowed = toCodexResponses(
    'anthropic.messages',
    { model: 'gpt-5.4', messages: [{ role: 'user', content: 'x' }] },
    { anthropic_to_codex: true },
  )
  assert.equal(allowed.ok, true)
})

test('responses SSE maps to chat chunks', () => {
  const delta = responsesSseToChatChunk('data: {"type":"response.output_text.delta","delta":"Hi"}')
  assert.match(delta, /chat.completion.chunk/)
  assert.match(delta, /Hi/)
  const done = responsesSseToChatChunk(
    'data: {"type":"response.completed","response":{"usage":{"input_tokens":41,"output_tokens":12}}}',
  )
  assert.match(done, /\[DONE\]/)
  assert.match(done, /"prompt_tokens":41/)
  assert.match(done, /"completion_tokens":12/)
})
