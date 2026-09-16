/**
 * Persist upstream AUP / content-filter refusals and short-circuit repeats.
 * Fingerprint is model + normalized system/user/tool names (not stream/max_tokens).
 */
import { createHash } from 'node:crypto'
import { ErrorType, ErrorCode, makeError } from './errors.mjs'
import { extractPrompt, normalizeText } from './distill-detect.mjs'

export const REFUSAL_GUARD_MESSAGE =
  "Request blocked by the refusal guard. Anthropic's API previously refused this pattern."

export const REFUSAL_GUARD_SETTING = 'refusal_guard_enabled'

export function isRefusalGuardEnabled(readSetting) {
  if (process.env.KIN_REFUSAL_GUARD === '0' || process.env.KIN_REFUSAL_GUARD === 'false') return false
  if (typeof readSetting === 'function') {
    try {
      const v = readSetting(REFUSAL_GUARD_SETTING, true)
      if (v === false || v === 0 || v === '0' || v === 'false') return false
    } catch {
      /* sqlite missing → default on */
    }
  }
  return true
}

const REFUSAL_HAY =
  /usage policy|legal\/aup|unable to respond to this request|violate our usage|content_filter_refusal|stop_reason[=:]?\s*refusal/i

export function toolNamesOf(body) {
  if (!Array.isArray(body?.tools)) return []
  return body.tools
    .map((t) => String(t?.name || '').trim())
    .filter(Boolean)
    .sort()
}

export function refusalFingerprint(body = {}, inbound = body) {
  const prompt = extractPrompt(inbound, body)
  const model = String(body?.model || inbound?.model || '')
    .trim()
    .toLowerCase()
  const payload = {
    model,
    prompt: normalizeText(prompt.joined),
    tools: toolNamesOf(body).length ? toolNamesOf(body) : toolNamesOf(inbound),
  }
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

export function refusalPreview(body = {}, inbound = body) {
  const prompt = extractPrompt(inbound, body)
  return String(prompt.user || prompt.joined || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240)
}

export function isUpstreamRefusal(result = {}, extra = {}) {
  if (result?.finalState === 'content_filter') return true
  const stop = String(result?.stopReason || result?.body?.stop_reason || extra.stop_reason || '')
  if (stop === 'refusal') return true
  const hay = [
    extra.error_message,
    extra.error_code,
    result?.body?.error?.message,
    result?.body?.error?.code,
    typeof result?.error === 'string' ? result.error : result?.error?.message,
    result?.finalState,
  ]
    .filter(Boolean)
    .join('\n')
  return REFUSAL_HAY.test(hay)
}

export function refusalGuardError(requestId) {
  return makeError({
    type: ErrorType.PERMISSION,
    code: ErrorCode.REFUSAL_GUARD,
    message: REFUSAL_GUARD_MESSAGE,
    status: 403,
    request_id: requestId,
  })
}
