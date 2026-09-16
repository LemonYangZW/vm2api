import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mapUpstreamError,
  rewritePoolErrorForClient,
  isPoolCapacityError,
  isAssistantMessageBody,
  CLIENT_POOL_BUSY_MESSAGE,
} from '../../src/lib/core/errors.mjs'

test('pool-empty codes rewrite to a generic overload for the client', () => {
  const mapped = mapUpstreamError(503, {
    error: { type: 'api_error', code: 'account_pool_exhausted', message: 'No eligible Claude accounts remain' },
  })
  assert.equal(mapped.status, 503)
  assert.equal(mapped.body.error.type, 'overloaded_error')
  assert.equal(mapped.body.error.code, 'server_overloaded')
  assert.equal(mapped.body.error.message, CLIENT_POOL_BUSY_MESSAGE)
  assert.equal(mapped.body.error.details, undefined)
})

test('api pool empty message is not leaked to the client', () => {
  const mapped = mapUpstreamError(503, {
    error: { type: 'api_error', code: 'api_pool_exhausted', message: 'no ready api key for this model' },
  })
  assert.equal(mapped.body.error.code, 'server_overloaded')
  assert.doesNotMatch(mapped.body.error.message, /no ready api|eligible/i)
})

test('rewritePoolErrorForClient strips leftover pool details', () => {
  const rewritten = rewritePoolErrorForClient({
    status: 503,
    body: {
      error: {
        type: 'api_error',
        code: 'account_pool_exhausted',
        message: 'No eligible Claude accounts remain',
        details: { excluded_accounts: ['acc-1'], reason: 'no_eligible_accounts' },
      },
    },
  })
  assert.equal(rewritten.body.error.code, 'server_overloaded')
  assert.equal(rewritten.body.error.message, CLIENT_POOL_BUSY_MESSAGE)
  assert.equal(rewritten.body.error.details, undefined)
})

test('incomplete upstream stream maps to 502, not api_error 500', () => {
  const mapped = mapUpstreamError(200, {
    type: 'error',
    error: {
      type: 'api_error',
      message: 'Upstream stream ended before a valid terminal event',
    },
  })
  assert.equal(mapped.status, 502)
  assert.equal(mapped.body.error.type, 'upstream_error')
  assert.match(mapped.body.error.message, /valid terminal event/)
})

test('successful Messages payload is not classified as Upstream error: message', () => {
  const body = { type: 'message', role: 'assistant', content: [] }
  assert.equal(isAssistantMessageBody(body), true)
  const mapped = mapUpstreamError(200, body)
  assert.doesNotMatch(String(mapped.body.error.message), /Upstream error: message/)
  assert.notEqual(mapped.body.error.details?.upstream_type, 'message')
})

test('isPoolCapacityError covers internal empty-pool codes', () => {
  assert.equal(isPoolCapacityError('account_pool_exhausted'), true)
  assert.equal(isPoolCapacityError('api_pool_exhausted'), true)
  assert.equal(isPoolCapacityError('upstream_error', 'No eligible Claude accounts remain'), true)
  assert.equal(isPoolCapacityError('upstream_rate_limit', 'Rate limit exceeded'), false)
})
