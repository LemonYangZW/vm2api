/**
 * Slot identity rewrite for the Go worker HTTP data plane.
 *
 *   device_id     → slot (VM) device
 *   account_uuid  → real OAuth account of the slot
 *   session_id    → official Claude Code keeps the caller's session;
 *                   unofficial mints a UUID (stable hash of the caller token,
 *                   or randomUUID if the caller sent none). Outbound always
 *                   has a session. Email never goes in metadata.user_id
 *                   (Anthropic 400 has_at).
 *
 * Client settings/env/identity fields are always dropped.
 * Pool sticky prefers metadata.user_id.device_id (parent + sub-agent family),
 * then session headers. Outbound session_id is still rewritten here and is
 * not the pool key.
 */
import crypto from 'node:crypto'
import { formatMetadataUserId } from './vm-identity.mjs'

export const IDENTITY_REPLACE = Object.freeze([
  'device_id',
  'account_uuid',
  'session_id',
  'authorization',
  'fingerprint',
  'settings',
])

export const CALLER_SESSION_HEADER_KEYS = Object.freeze([
  'x-session-id',
  'x-conversation-id',
  'x-claude-code-session-id',
  'session-id',
  'thread-id',
])

export const CALLER_SESSION_BODY_KEYS = Object.freeze([
  'conversation_id',
  'session_id',
  'thread_id',
  'prompt_cache_key',
])

export const UNOFFICIAL_SESSION_SEED = 'kin-unofficial-session:'

/** Deterministic v4-shaped UUID. Used for unofficial outbound session_id. */
export function uuidFromSeed(seed) {
  const hex = crypto
    .createHash('sha256')
    .update(String(seed || ''))
    .digest('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join('-')
}

export function parseUserId(raw) {
  if (!raw) return null
  if (typeof raw === 'object') {
    return {
      device_id: raw.device_id || raw.deviceId || '',
      account_uuid: raw.account_uuid || raw.accountUuid || '',
      session_id: raw.session_id || raw.sessionId || '',
    }
  }
  const s = String(raw)
  try {
    const p = JSON.parse(s)
    if (p && typeof p === 'object') {
      return {
        device_id: p.device_id || p.deviceId || '',
        account_uuid: p.account_uuid || p.accountUuid || '',
        session_id: p.session_id || p.sessionId || '',
      }
    }
  } catch {}
  const m = /^user_(.*?)_account_(.*?)_session_(.*)$/.exec(s)
  if (m) return { device_id: m[1], account_uuid: m[2], session_id: m[3] }
  return null
}

function headerValue(headers, key) {
  if (!headers || typeof headers !== 'object') return ''
  const want = String(key).toLowerCase()
  for (const [k, v] of Object.entries(headers)) {
    if (String(k).toLowerCase() !== want) continue
    if (v == null || v === '') continue
    return String(Array.isArray(v) ? v[0] : v)
  }
  return ''
}

/**
 * Caller session, in official order: metadata.user_id → sticky headers → body keys.
 */
export function extractCallerSession({ inbound = {}, body = {}, headers = {} } = {}) {
  const raw = inbound?.metadata?.user_id || body?.metadata?.user_id
  const parsed = parseUserId(raw) || {}
  if (parsed.session_id) return String(parsed.session_id)
  for (const key of CALLER_SESSION_HEADER_KEYS) {
    const v = headerValue(headers, key)
    if (v) return v
  }
  const src = inbound && typeof inbound === 'object' && Object.keys(inbound).length ? inbound : body
  for (const key of CALLER_SESSION_BODY_KEYS) {
    if (src?.[key]) return String(src[key])
  }
  return ''
}

export function sessionIdFromOutboundBody(body = {}) {
  return parseUserId(body?.metadata?.user_id)?.session_id || ''
}

/**
 * Official Claude Code: keep the caller's session (mint only if missing).
 * Unofficial: never send the caller's raw token upstream; hash it to a UUID
 * so the same inbound conversation stays stable. Always returns a session.
 */
export function resolveOutboundSessionId(callerSession, { officialClient = false } = {}) {
  const caller = String(callerSession || '').trim()
  if (officialClient) return caller || crypto.randomUUID()
  if (caller) return uuidFromSeed(UNOFFICIAL_SESSION_SEED + caller)
  return crypto.randomUUID()
}

/**
 * Slot device + credential account + resolved outbound session.
 */
export function applyCrsIdentityReplace(body, identity, inbound = {}, reqHeaders = {}, opts = {}) {
  const out = { ...(body || {}) }
  delete out.settings
  delete out.claude_settings
  delete out.env
  delete out.user
  delete out.user_id

  const raw = inbound?.metadata?.user_id || body?.metadata?.user_id
  const parsed = parseUserId(raw) || {}
  const deviceId = identity.deviceId || identity.machineId || ''
  const accountUuid = identity.accountUuid || parsed.account_uuid || ''
  const officialClient = opts.officialClient === true
  const sessionId =
    String(opts.sessionId || '').trim() ||
    resolveOutboundSessionId(extractCallerSession({ inbound, body, headers: reqHeaders }), { officialClient })

  const md = {}
  if (out.metadata && typeof out.metadata === 'object') {
    for (const [k, v] of Object.entries(out.metadata)) {
      if (/user|machine|device|host|tz|timezone|locale|setting|session_source|email/i.test(k)) continue
      md[k] = v
    }
  }
  md.user_id = formatMetadataUserId({
    deviceId,
    accountUuid,
    sessionId,
  })
  out.metadata = md
  return out
}
