import test from 'node:test'
import assert from 'node:assert/strict'
import { SessionLimitRegistry } from '../../src/lib/pool/session-limit.mjs'

test('max_sessions 0 is unlimited', () => {
  const r = new SessionLimitRegistry()
  assert.equal(r.canAccept('a', 's1', { max: 0 }).ok, true)
  r.touch('a', 's1')
  r.touch('a', 's2')
  assert.equal(r.canAccept('a', 's3', { max: 0 }).ok, true)
})

test('new key is refused at cap; existing key renews', () => {
  const r = new SessionLimitRegistry()
  r.touch('a', 'one')
  r.touch('a', 'two')
  assert.equal(r.canAccept('a', 'three', { max: 2 }).ok, false)
  assert.equal(r.canAccept('a', 'one', { max: 2 }).ok, true)
  r.touch('a', 'one')
  assert.equal(r.snapshot('a', { max: 2 }).active, 2)
})

test('idle timeout drops a stale key', () => {
  const r = new SessionLimitRegistry()
  const now = Date.now()
  r.touch('a', 'old', now - 10 * 60_000)
  r.touch('a', 'fresh', now)
  const snap = r.snapshot('a', { max: 8, idleMin: 5, now })
  assert.equal(snap.active, 1)
  assert.equal(r.canAccept('a', 'new', { max: 1, idleMin: 5, now }).ok, false)
  assert.equal(r.canAccept('a', 'new', { max: 1, idleMin: 5, now: now + 6 * 60_000 }).ok, true)
})

test('release drops a key; extra release is a no-op', () => {
  const r = new SessionLimitRegistry()
  r.touch('a', 's1')
  r.touch('a', 's2')
  assert.equal(r.release('a', 's1'), 1)
  assert.equal(r.snapshot('a', { max: 4 }).active, 1)
  assert.equal(r.release('a', 's1'), 1)
  assert.equal(r.snapshot('a', { max: 4 }).active, 1)
  assert.equal(r.release('a', 's2'), 0)
  assert.equal(r.snapshot('a', { max: 4 }).active, 0)
})

test('shared key stays until the last reservation releases', () => {
  const r = new SessionLimitRegistry()
  r.touch('a', 'shared')
  r.touch('a', 'shared')
  assert.equal(r.snapshot('a', { max: 4 }).active, 1)
  r.release('a', 'shared')
  assert.equal(r.snapshot('a', { max: 4 }).active, 1)
  assert.equal(r.canAccept('a', 'new', { max: 1 }).ok, false)
  r.release('a', 'shared')
  assert.equal(r.snapshot('a', { max: 4 }).active, 0)
  assert.equal(r.canAccept('a', 'new', { max: 1 }).ok, true)
})
