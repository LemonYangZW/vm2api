import test from 'node:test'
import assert from 'node:assert/strict'
import { claudeToOpenAIChatRequest, openaiChatToClaudeMessage } from '../../src/lib/pool/api-openai.mjs'

test('claude request becomes openai chat', () => {
  const out = claudeToOpenAIChatRequest({
    model: 'gpt-4o',
    system: 'hi',
    max_tokens: 16,
    messages: [{ role: 'user', content: 'hello' }],
  })
  assert.equal(out.model, 'gpt-4o')
  assert.equal(out.messages[0].role, 'system')
  assert.equal(out.messages[1].content, 'hello')
  assert.equal(out.stream, true)
})

test('openai chat becomes claude message', () => {
  const msg = openaiChatToClaudeMessage({
    id: 'chatcmpl-1',
    model: 'gpt-4o',
    choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 2, completion_tokens: 1 },
  })
  assert.equal(msg.content[0].text, 'ok')
  assert.equal(msg.stop_reason, 'end_turn')
  assert.equal(msg.usage.input_tokens, 2)
})
