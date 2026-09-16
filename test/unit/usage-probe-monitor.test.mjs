import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isUsageProbeDue,
  isUsageProbeTarget,
  normalizeUsageProbeConfig,
  createUsageProbeMonitor,
} from '../../src/lib/oauth/usage-probe-monitor.mjs'

const live = {
  id: 'vm-13',
  status: 'running',
  has_refresh: true,
  proxy: { host: '127.0.0.1', port: 1080, url: 'socks5h://127.0.0.1:1080' },
}

test('normalize fills usage-probe defaults', () => {
  const n = normalizeUsageProbeConfig({ interval_sec: 3, concurrency: 99, stale_sec: 10 })
  assert.equal(n.enabled, true)
  assert.equal(n.interval_sec, 30)
  assert.equal(n.stale_sec, 60)
  assert.equal(n.concurrency, 8)
  assert.equal(n.run_on_start, true)
})

test('only live credential + proxy slots are usage-probe targets', () => {
  assert.equal(isUsageProbeTarget(live), true)
  assert.equal(isUsageProbeTarget({ ...live, has_refresh: false, has_token: false }), false)
  assert.equal(isUsageProbeTarget({ ...live, status: 'stopped' }), false)
  assert.equal(isUsageProbeTarget({ ...live, proxy: null }), false)
})

test('interval ticks never hop /usage', () => {
  assert.deepEqual(isUsageProbeDue({ unified: { '5h': { utilization: 0, status: 'active' } } }), {
    due: false,
    reason: 'list_passive_only',
  })
  assert.deepEqual(
    isUsageProbeDue({
      last_probe: { at: '2026-08-24T11:58:00.000Z', ok: true, source: 'vm-oauth-usage' },
      unified: {
        source: 'vm-oauth-usage',
        '5h': { utilization: 1, status: 'rejected', reset: '2026-08-24T11:59:00.000Z' },
      },
    }),
    { due: false, reason: 'list_passive_only' },
  )
})

test('invalid_grant slots are not usage-probe targets', () => {
  assert.equal(
    isUsageProbeTarget({
      ...live,
      refresh_error: 'invalid_grant',
      claude: { refresh_error: 'invalid_grant', has_refresh: true },
    }),
    false,
  )
})

test('monitor reconciles Extra and does not call probeAccount', async () => {
  const probed = []
  const reconciled = []
  const monitor = createUsageProbeMonitor({
    config: { interval_sec: 60, stale_sec: 300, run_on_start: false },
    listTargets: () => [live, { ...live, id: 'vm-05' }],
    accountForVm: (vm) => ({ account_id: vm.id }),
    reconcile: (vm) => reconciled.push(vm.id),
    probeOne: async (vm) => {
      probed.push(vm.id)
      return { ok: true, source: 'vm-oauth-usage' }
    },
  })
  const run = await monitor.runOnce()
  assert.deepEqual(reconciled, ['vm-13', 'vm-05'])
  assert.equal(run.due, 0)
  assert.equal(probed.length, 0)
  assert.equal(
    run.items.every((item) => item.reason === 'reconcile_extra'),
    true,
  )
})
