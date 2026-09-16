import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extraToCodexSnapshot, normalizeCodexLimits, buildCodexUsageView } from '../../src/lib/protocol/codex-usage.mjs'

test('extra maps 5h/7d used percent without inversion', () => {
  const snap = extraToCodexSnapshot({
    codex_5h_used_percent: 6,
    codex_7d_used_percent: 34,
    codex_5h_reset_at: '2026-09-07T22:07:49+08:00',
    codex_7d_reset_at: '2026-09-13T21:13:10+08:00',
    codex_5h_window_minutes: 300,
    codex_7d_window_minutes: 10080,
    codex_usage_updated_at: '2026-09-07T19:02:42+08:00',
  })
  assert.equal(snap.secondary_used_percent, 6)
  assert.equal(snap.primary_used_percent, 34)
  const limits = normalizeCodexLimits(snap)
  assert.equal(limits.used_5h_percent, 6)
  assert.equal(limits.used_7d_percent, 34)
  const view = buildCodexUsageView(snap)
  assert.equal(view.unit, 'percent_used')
  assert.equal(view.quota.utilization_5h, 0.06)
  assert.equal(view.quota.utilization_7d, 0.34)
})

test('smaller primary window is 5h', () => {
  const limits = normalizeCodexLimits({
    primary_used_percent: 10,
    primary_window_minutes: 300,
    secondary_used_percent: 80,
    secondary_window_minutes: 10080,
  })
  assert.equal(limits.used_5h_percent, 10)
  assert.equal(limits.used_7d_percent, 80)
})
