import type { ApiKeyItem } from '@/types/panel-keys'
import type { StatusTone } from '@/types/status'
import { fmtNum } from '@/lib/format'

export function maskApiKeyItem(k: ApiKeyItem): string {
  const raw = String(k.key || '')
  if (raw.includes('…') || raw.includes('...')) return raw
  const prefix = k.key_prefix || k.prefix || ''
  const suffix = k.key_suffix || ''
  if (raw.startsWith('hmac:')) {
    return suffix ? `${prefix || raw.slice(0, 10)}…${suffix}` : prefix || '—'
  }
  if (raw.length > 16) return `${raw.slice(0, 8)}…${raw.slice(-4)}`
  if (prefix && suffix) return `${prefix}…${suffix}`
  return prefix || raw || 'sk-kin-…'
}

export function keyIsExpired(k: ApiKeyItem): boolean {
  if (!k.expires_at) return false
  const t = Date.parse(k.expires_at)
  return Number.isFinite(t) && t <= Date.now()
}

export function keyIsDead(k: ApiKeyItem): boolean {
  return k.status === 'disabled' || keyIsExpired(k)
}

export function keyStatusTone(k: ApiKeyItem): StatusTone {
  if (k.status === 'disabled') {
    return { key: 'off', text: '停用', cls: 'off', label: '停用' }
  }
  if (keyIsExpired(k)) {
    return { key: 'bad', text: '已过期', cls: 'bad', label: '已过期' }
  }
  return { key: 'ok', text: '启用', cls: 'ok', label: '启用' }
}

function relMs(ms: number): string {
  const s = Math.round(Math.abs(ms) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.round(s / 60)}m`
  if (s < 86400) return `${Math.round(s / 3600)}h`
  return `${Math.round(s / 86400)}d`
}

export function keyExpiryText(k: ApiKeyItem): {
  text: string
  expired: boolean
} {
  if (!k.expires_at) return { text: '永久', expired: false }
  const t = Date.parse(k.expires_at)
  if (!Number.isFinite(t)) return { text: String(k.expires_at), expired: false }
  const d = t - Date.now()
  if (d <= 0) return { text: '已过期', expired: true }
  return { text: `${relMs(d)} 后`, expired: false }
}

export function keyQuotaLabel(k: ApiKeyItem): string {
  const q = Number(k.quota_requests || 0)
  const u = Number(k.quota_used || 0)
  if (!q) return `不限 · 已用 ${fmtNum(u)}`
  return `${fmtNum(u)} / ${fmtNum(q)}`
}

export function keyQuotaPct(k: ApiKeyItem): number | null {
  const q = Number(k.quota_requests || 0)
  const u = Number(k.quota_used || 0)
  if (!q) return null
  return Math.min(100, (u / q) * 100)
}

export function plaintextFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const rec = payload as Record<string, unknown>
  const direct = rec.key
  if (isPlainKey(direct)) return direct
  const item = rec.item
  if (item && typeof item === 'object') {
    const nested = (item as Record<string, unknown>).key
    if (isPlainKey(nested)) return nested
  }
  return ''
}

function isPlainKey(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false
  if (value.includes('…') || value.includes('...')) return false
  if (value.startsWith('hmac:')) return false
  return value.length > 12
}
