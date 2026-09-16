import test from 'node:test'
import assert from 'node:assert/strict'
import { toPublicKernelHealth } from '../../src/lib/transport/rust-kernel-client.mjs'

test('toPublicKernelHealth keeps wrap cli-hop slot fields', () => {
  const out = toPublicKernelHealth(
    {
      ok: true,
      status: 200,
      engine: 'rust',
      provider: 'local_cli',
      worker_version: 'wrap-1',
      ready_slots: 20,
      cli_pid: 4412,
    },
    'rust',
  )
  assert.equal(out.reachable, true)
  assert.equal(out.process_up, true)
  assert.equal(out.provider, 'local_cli')
  assert.equal(out.ready_slots, 20)
  assert.equal(out.cli_pid, 4412)
  assert.equal(out.worker_version, 'wrap-1')
  assert.equal(out.error_code, null)
})

test('toPublicKernelHealth treats kernel-up/zero-slots as not reachable', () => {
  const out = toPublicKernelHealth(
    {
      ok: true,
      status: 200,
      engine: 'rust',
      provider: 'local_cli',
      ready_slots: 0,
      cli_pid: 12,
    },
    'rust',
  )
  assert.equal(out.process_up, true)
  assert.equal(out.reachable, false)
  assert.equal(out.ready_slots, 0)
  assert.equal(out.error_code, 'rust_worker_unavailable')
})

test('toPublicKernelHealth leaves Go hop slot fields null', () => {
  const out = toPublicKernelHealth({ ok: true, status: 200, engine: 'go', worker_version: 'go-1' }, 'go')
  assert.equal(out.reachable, true)
  assert.equal(out.provider, null)
  assert.equal(out.ready_slots, null)
  assert.equal(out.cli_pid, null)
  assert.equal(out.worker_version, 'go-1')
})
