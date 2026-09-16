import test from 'node:test'
import assert from 'node:assert/strict'
import { applySseSocketTuning, createRespond } from '../../src/lib/http/respond.mjs'

test('applySseSocketTuning flushes headers and enables TCP_NODELAY', () => {
  let flushed = false
  let nodelay = null
  const res = {
    flushHeaders() {
      flushed = true
    },
    socket: {
      setNoDelay(v) {
        nodelay = v
      },
    },
  }
  applySseSocketTuning(res, { tcpNodelay: true })
  assert.equal(flushed, true)
  assert.equal(nodelay, true)
})

test('writeSSEHeaders uses optional tcpNodelay getter', () => {
  let nodelay = null
  const { writeSSEHeaders } = createRespond({ rewrite: { enabled: false } }, { tcpNodelay: () => false })
  const res = {
    writeHead() {},
    flushHeaders() {},
    socket: {
      setNoDelay(v) {
        nodelay = v
      },
    },
  }
  writeSSEHeaders(res)
  assert.equal(nodelay, null)
})
