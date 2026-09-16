import assert from 'node:assert/strict'
import test from 'node:test'
import { createKernelWatchdog, isKernelWatchdogTarget } from '../../src/lib/transport/kernel-watchdog.mjs'

test('watchdog skips stopped and go slots', () => {
  assert.equal(isKernelWatchdogTarget({ id: 'vm-01' }), false)
  assert.equal(isKernelWatchdogTarget({ id: 'vm-01', inference_engine: 'rust' }), true)
  assert.equal(isKernelWatchdogTarget({ id: 'vm-01', runtime: { engine: 'rust' } }), true)
  assert.equal(isKernelWatchdogTarget({ id: 'vm-01', inference_engine: 'go' }), false)
  assert.equal(isKernelWatchdogTarget({ id: 'vm-01', status: 'stopped' }), false)
})

test('watchdog ensure is called only when rust is unreachable', async () => {
  const ensured = []
  const wd = createKernelWatchdog({
    listTargets: () => [
      { id: 'vm-up', inference_engine: 'rust' },
      { id: 'vm-down', inference_engine: 'rust' },
      { id: 'vm-go', inference_engine: 'go' },
    ],
    homeDirFor: (vm) => `/tmp/${vm.id}`,
    health: async (exec) => ({ ok: exec.vmId === 'vm-up', ready_slots: exec.vmId === 'vm-up' ? 1 : 0 }),
    ensure: async (exec) => {
      ensured.push(exec.vmId)
      return { ok: true }
    },
  })
  await wd.tick()
  assert.deepEqual(ensured, ['vm-down'])
})
