/**
 * Request-level inference hop router.
 * engine = rust|go from VM override > routing.inference.engine > go.
 * rust = cli-hop（kin-kernel → patched CLI），不是 kernel HTTP hop。
 * Missing binary / unhealthy rust + fallback_to_go → go HTTP worker.
 * Credential import/ensure stay on Go in M1.
 */
import { resolveInferenceEngine } from '../vm/slot-engine.mjs'
import { streamGoWorker, callGoWorker, ensureWorkerCredential } from './go-worker-client.mjs'
import {
  streamRustKernel,
  callRustKernel,
  rustKernelHealth,
  rustKernelReachable,
  isNeedsRefreshResult,
} from './rust-kernel-client.mjs'
import {
  ensureRustKernel,
  kernelBinPath,
  scheduleWrapRecycle,
  awaitWrapRecycle,
  noteWrapHop,
} from './rust-kernel-supervisor.mjs'

const rustHealthCache = new Map()

export function rustHealthTtlMs(routing = {}) {
  const raw = routing?.inference?.health_ttl_ms
  if (raw == null || raw === '') return 2000
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 2000
  return n
}

export function clearRustHealthCache(vmId = null) {
  if (vmId) rustHealthCache.delete(String(vmId))
  else rustHealthCache.clear()
}

function cacheKey(exec) {
  return String(exec?.vmId || exec?.vm?.id || '')
}

export function rememberRustHealth(exec, ready) {
  const key = cacheKey(exec)
  if (!key || !ready?.ok) return
  rustHealthCache.set(key, { at: Date.now(), health: ready.health || null })
}

export function peekRustHealth(exec, ttlMs, now = Date.now()) {
  if (ttlMs <= 0) return null
  const key = cacheKey(exec)
  if (!key) return null
  const hit = rustHealthCache.get(key)
  if (!hit) return null
  if (now - hit.at > ttlMs) return null
  return hit
}

export function resolveHopEngine(vm, routing = {}, { rustReady = null, binPath = null, noGoFallback = false } = {}) {
  const wanted = resolveInferenceEngine(vm, routing)
  const fallback =
    routing?.inference?.fallback_to_go === true && routing?.inference?.strict !== true && noGoFallback !== true
  if (wanted !== 'rust') {
    return { engine: 'go', wanted, reason: 'configured_go', fallback }
  }
  const bin = binPath != null ? String(binPath).trim() : kernelBinPath()
  if (rustReady === true) {
    return { engine: 'rust', wanted, reason: 'configured_rust', fallback }
  }
  if (rustReady === false || !bin) {
    if (fallback) {
      return { engine: 'go', wanted, reason: rustReady === false ? 'rust_unhealthy' : 'bin_missing', fallback }
    }
    return {
      engine: 'rust',
      wanted,
      reason: rustReady === false ? 'rust_unhealthy' : 'bin_missing',
      fallback,
      blocked: true,
    }
  }
  return { engine: 'rust', wanted, reason: 'configured_rust', fallback }
}

function rustUnavailableResult(ready) {
  return {
    ok: false,
    status: 0,
    via: 'rust-kernel',
    engine: 'rust',
    body: {
      type: 'error',
      error: {
        type: 'worker_error',
        code: ready?.reason || 'rust_unavailable',
        message: ready?.error || 'rust kernel is not available',
      },
    },
    headers: {},
    terminalState: 'transport_error',
    transportError: true,
  }
}

function credentialEnsureFailure(result, ensured) {
  const rawError = ensured?.error
  const error = rawError && typeof rawError === 'object' ? rawError : {}
  const blob = `${error.code || ''} ${error.message || ''} ${typeof rawError === 'string' ? rawError : ''}`
  const fatal = /invalid_grant|oauth_revoked|token has been revoked|refresh_token_missing/i.test(blob)
  const revoked = /token has been revoked|oauth_revoked/i.test(blob)
  return {
    ...result,
    ok: false,
    status: fatal ? 401 : Number(ensured?.status) || result.status,
    committed: fatal ? false : result.committed,
    terminalState: fatal ? 'rejected' : result.terminalState,
    body: {
      type: 'error',
      error: {
        type: fatal ? 'authentication_error' : error.type || 'worker_error',
        code: fatal
          ? revoked
            ? 'oauth_revoked'
            : error.code || 'invalid_grant'
          : error.code || 'credential_refresh_failed',
        message: fatal
          ? revoked
            ? 'OAuth access token has been revoked'
            : 'OAuth credential was rejected'
          : String(error.message || rawError || 'credential ensure failed').slice(0, 300),
      },
    },
    credential_ensure_failed: true,
  }
}

async function prepareRust(exec, { ensure, routing } = {}) {
  await awaitWrapRecycle(exec)
  if (typeof ensure === 'function') return ensure(exec)
  const ttl = rustHealthTtlMs(routing)
  const cached = peekRustHealth(exec, ttl)
  if (cached) {
    return { ok: true, reason: 'health_cache', health: cached.health }
  }
  const health = await rustKernelHealth(exec, { timeoutMs: 800 })
  if (rustKernelReachable(health)) {
    const ready = { ok: true, reason: 'already_up', health }
    rememberRustHealth(exec, ready)
    return ready
  }
  const started = await ensureRustKernel(exec)
  if (started?.ok) rememberRustHealth(exec, started)
  else clearRustHealthCache(cacheKey(exec))
  return started
}

async function runHop({ mode, opts }) {
  const routing = opts.routing || {}
  const decision = resolveHopEngine(opts.exec?.vm, routing, { noGoFallback: opts.noGoFallback === true })
  let engine = decision.engine
  let reason = decision.reason
  if (decision.wanted === 'rust' && !decision.blocked) {
    const ready = await prepareRust(opts.exec, { ensure: opts.ensureRust, routing })
    if (ready?.ok) {
      engine = 'rust'
      reason = ready.reason || 'configured_rust'
    } else if (decision.fallback) {
      engine = 'go'
      reason = ready?.reason || 'rust_unavailable'
    } else {
      return {
        ...rustUnavailableResult(ready),
        wanted_engine: 'rust',
        engine_reason: ready?.reason || 'rust_unavailable',
      }
    }
  }
  if (decision.blocked) {
    return {
      ...rustUnavailableResult({ reason: decision.reason }),
      wanted_engine: 'rust',
      engine_reason: decision.reason,
    }
  }
  const send =
    engine === 'rust'
      ? mode === 'stream'
        ? streamRustKernel
        : callRustKernel
      : mode === 'stream'
        ? streamGoWorker
        : callGoWorker
  let result = await send(opts)
  if (engine === 'rust') noteWrapHop(opts.exec)
  if (engine === 'rust' && result.transportError === true && result.committed !== true) {
    result = await send(opts)
    result = { ...result, rust_transport_retried: true }
    noteWrapHop(opts.exec)
  }
  if (engine === 'rust' && isNeedsRefreshResult(result)) {
    const ensure = opts.ensureCredential || ensureWorkerCredential
    const ensured = await ensure(opts.exec, { force: true })
    if (ensured?.ok !== true) result = credentialEnsureFailure(result, ensured)
    else {
      const recycle = opts.recycleWrap || scheduleWrapRecycle
      recycle(opts.exec)
      await awaitWrapRecycle(opts.exec)
      result = await send(opts)
      result = { ...result, credential_retried: true }
      noteWrapHop(opts.exec)
    }
  }
  if (engine === 'rust' && result.transportError === true && result.committed !== true && decision.fallback) {
    const fallbackSend = mode === 'stream' ? streamGoWorker : callGoWorker
    result = await fallbackSend(opts)
    engine = 'go'
    reason = 'rust_transport_error'
    clearRustHealthCache(cacheKey(opts.exec))
  }
  if (engine === 'rust' && (result.terminalState === 'incomplete' || (result.committed && result.transportError))) {
    clearRustHealthCache(cacheKey(opts.exec))
  }
  return {
    ...result,
    engine,
    wanted_engine: decision.wanted,
    engine_reason: reason,
  }
}

export function dispatchStreamInference(opts = {}) {
  return runHop({ mode: 'stream', opts })
}

export function dispatchCallInference(opts = {}) {
  return runHop({ mode: 'call', opts })
}
