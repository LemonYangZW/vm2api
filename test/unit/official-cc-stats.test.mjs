import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseOfficialCcStats, inferTierFromOfficialStats } from '../../src/lib/oauth/official-cc-stats.mjs'

test('parses official /stats text for Pro + 5h/7d', () => {
  const stats = parseOfficialCcStats('Plan: Claude Pro\n5-hour limit: 12% used\n7-day limit: 34% used')
  assert.equal(stats.account_tier, 'pro')
  assert.equal(stats.five_hour.utilization, 0.12)
  assert.equal(stats.seven_day.utilization, 0.34)
})

test('parses Max and extra usage from text', () => {
  assert.equal(inferTierFromOfficialStats('Current plan: Claude Max'), 'max')
  const stats = parseOfficialCcStats('Claude Max\nExtra usage: enabled\nWeekly 8%')
  assert.equal(stats.account_tier, 'max')
  assert.equal(stats.extra_usage.is_enabled, true)
  assert.equal(stats.seven_day.utilization, 0.08)
})

test('local cost /stats without quota is not a successful ingest', () => {
  const stats = parseOfficialCcStats(
    JSON.stringify({
      type: 'result',
      is_error: false,
      result: 'Total cost:            $0.0000\nTotal duration (API):  0s',
    }),
  )
  assert.equal(stats.ok, false)
  assert.equal(stats.account_tier, null)
})

test('parses JSON envelope result text', () => {
  const stats = parseOfficialCcStats(
    JSON.stringify({
      type: 'result',
      result: 'Plan: Claude Pro\n5-hour 4%',
    }),
  )
  assert.equal(stats.account_tier, 'pro')
  assert.equal(stats.five_hour.utilization_pct, 4)
  assert.equal(stats.ok, true)
})
