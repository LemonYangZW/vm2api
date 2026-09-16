import { isFableUnavailablePro } from '../oauth/crs-usage-probe.mjs'

/**
 * Claude-only: Fable 套餐拒绝/429 无窗=Pro，落盘 max 或 Fable 探测成功或真实 7d_oi=Max。
 * Shared by the panel and the pool picker so they cannot drift.
 */
export function inferClaudeTier(vm = {}, quota = {}) {
  const hasToken = !!(vm.has_token || vm.has_access)
  if (!hasToken) return { key: 'none', label: null }
  const fb = quota.fable || vm.fable || {}
  const q = {
    utilization_7d_oi: quota.utilization_7d_oi ?? vm.utilization_7d_oi,
    reset_7d_oi: quota.reset_7d_oi || vm.reset_7d_oi,
    status_7d_oi: quota.status_7d_oi || vm.status_7d_oi,
    '7d_oi': quota['7d_oi'],
  }
  const stored = String(vm.account_tier || quota.account_tier || '').toLowerCase()
  // Stored Max wins leftover Fable 429 / revoke noise. Real Pro is stored pro or a
  // fresh plan_denied without a Max stamp.
  if (stored === 'pro' || (isFableUnavailablePro(fb, q) && stored !== 'max')) {
    return { key: 'pro', label: 'Pro' }
  }
  if (stored === 'max' || fb.ok || q.utilization_7d_oi != null || q.reset_7d_oi || q.status_7d_oi) {
    return { key: 'max', label: 'Max' }
  }
  return { key: 'unknown', label: null }
}
