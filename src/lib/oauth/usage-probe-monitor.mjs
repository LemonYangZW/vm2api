/**
 * Periodic Extra reconcile for live credential slots.
 *
 * Aligns with sub2api: list/gate read Messages headers. Official
 * GET /api/oauth/usage is never interval-polled (that API 429s).
 * The 60s tick only wipes elapsed Extra windows.
 */
import { hasRefreshPresence } from './oauth-credentials.mjs'
import { vmHasProxyPath } from './credential-refresh-monitor.mjs'

export const DEFAULT_USAGE_PROBE = Object.freeze({
  enabled: true,
  interval_sec: 60,
  stale_sec: 300,
  run_on_start: true,
  concurrency: 2,
  timeout_ms: 60_000,
})

const HARD_DOWN = new Set(['stopped', 'dead', 'error', 'disabled'])

function clampInt(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function asBool(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'boolean') return value
  const s = String(value).trim().toLowerCase()
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true
  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false
  return fallback
}

export function normalizeUsageProbeConfig(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {}
  return {
    enabled: asBool(src.enabled, DEFAULT_USAGE_PROBE.enabled),
    interval_sec: clampInt(src.interval_sec, 30, 3600, DEFAULT_USAGE_PROBE.interval_sec),
    stale_sec: clampInt(src.stale_sec, 60, 86_400, DEFAULT_USAGE_PROBE.stale_sec),
    run_on_start: asBool(src.run_on_start, DEFAULT_USAGE_PROBE.run_on_start),
    concurrency: clampInt(src.concurrency, 1, 8, DEFAULT_USAGE_PROBE.concurrency),
    timeout_ms: clampInt(src.timeout_ms, 10_000, 180_000, DEFAULT_USAGE_PROBE.timeout_ms),
  }
}

export function isUsageProbeTarget(vm) {
  if (!vm?.id) return false
  if (!hasRefreshPresence(vm.claude) && !vm.has_refresh && !vm.has_token) return false
  const grantErr = String(vm.claude?.refresh_error || vm.refresh_error || '')
  if (/invalid_grant|refresh token not found/i.test(grantErr)) return false
  const status = String(vm.status || '').toLowerCase()
  if (HARD_DOWN.has(status)) return false
  if (!vmHasProxyPath(vm)) return false
  return true
}

/**
 * Interval ticks never hop /usage. Kept so settings + tests can inspect.
 * @returns {{ due: boolean, reason?: string }}
 */
export function isUsageProbeDue(_account = {}, _opts = {}) {
  return { due: false, reason: 'list_passive_only' }
}

export function createUsageProbeMonitor(opts = {}) {
  let config = normalizeUsageProbeConfig(opts.config)
  let timer = null
  let inflight = null
  let lastRun = null
  const nowFn = opts.now || (() => Date.now())

  const listTargets = () => {
    const vms = typeof opts.listTargets === 'function' ? opts.listTargets() || [] : []
    return vms.filter((vm) => isUsageProbeTarget(vm))
  }

  const runOnce = async () => {
    if (inflight) return inflight
    inflight = (async () => {
      const started = nowFn()
      const targets = listTargets()
      const items = []
      for (const vm of targets) {
        const account = typeof opts.accountForVm === 'function' ? opts.accountForVm(vm) : null
        if (typeof opts.reconcile === 'function') {
          try {
            opts.reconcile(vm, account)
          } catch {}
        }
        items.push({
          vm_id: vm.id,
          ok: true,
          reason: 'reconcile_extra',
          source: null,
        })
      }
      lastRun = {
        at: new Date(nowFn()).toISOString(),
        duration_ms: nowFn() - started,
        due: 0,
        items,
      }
      return lastRun
    })().finally(() => {
      inflight = null
    })
    return inflight
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const start = ({ immediate = false } = {}) => {
    stop()
    if (!config.enabled) return { started: false, reason: 'disabled' }
    timer = setInterval(() => {
      runOnce().catch(() => {})
    }, config.interval_sec * 1000)
    if (typeof timer.unref === 'function') timer.unref()
    if (immediate && config.run_on_start) {
      queueMicrotask(() => {
        runOnce().catch(() => {})
      })
    }
    return { started: true, interval_sec: config.interval_sec, run_on_start: config.run_on_start }
  }

  const setConfig = (next, { restart = true } = {}) => {
    config = normalizeUsageProbeConfig(next)
    if (restart) start({ immediate: false })
    return config
  }

  return {
    getConfig: () => config,
    setConfig,
    getSnapshot: () => lastRun,
    runOnce,
    start,
    stop,
  }
}
