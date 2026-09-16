/**
 * Official OpenAI API list prices (USD / 1M tokens), standard tier.
 * Source: https://developers.openai.com/api/docs/pricing
 * Verified 2026-09-09 in codex-proxy-rs (no Sol promo / Flex / Fast / long-context).
 * cache_write is 1.25× input when the official table publishes a cache-write column.
 */
export const OPENAI_PRICING_SOURCE = 'openai-official-2026-09'

/** USD per million tokens. cache_write 0 = not billed. */
export const OPENAI_OFFICIAL_RATES = {
  'gpt-6-astra': { input: 10, output: 50, cache_read: 1, cache_write: 12.5 },
  'gpt-5.6-sol': { input: 5, output: 30, cache_read: 0.5, cache_write: 6.25 },
  'gpt-5.6-terra': { input: 2, output: 12, cache_read: 0.2, cache_write: 2.5 },
  'gpt-5.6-luna': { input: 0.2, output: 1.2, cache_read: 0.02, cache_write: 0.25 },
  'gpt-5.6': { input: 5, output: 30, cache_read: 0.5, cache_write: 6.25 },
  'gpt-5.5-pro': { input: 30, output: 180, cache_read: 0, cache_write: 0 },
  'gpt-5.5': { input: 5, output: 30, cache_read: 0.5, cache_write: 0 },
  'gpt-5.4-mini': { input: 0.75, output: 4.5, cache_read: 0.075, cache_write: 0 },
  'gpt-5.4-nano': { input: 0.2, output: 1.25, cache_read: 0.02, cache_write: 0 },
  'gpt-5.4-pro': { input: 30, output: 180, cache_read: 0, cache_write: 0 },
  'gpt-5.4': { input: 2.5, output: 15, cache_read: 0.25, cache_write: 0 },
  'gpt-5.3-codex': { input: 1.75, output: 14, cache_read: 0.175, cache_write: 0 },
  'gpt-5.2-pro': { input: 21, output: 168, cache_read: 0, cache_write: 0 },
  'gpt-5.2': { input: 1.75, output: 14, cache_read: 0.175, cache_write: 0 },
  'gpt-5.1': { input: 1.25, output: 10, cache_read: 0.125, cache_write: 0 },
  'gpt-5-mini': { input: 0.25, output: 2, cache_read: 0.025, cache_write: 0 },
  'gpt-5-nano': { input: 0.05, output: 0.4, cache_read: 0.005, cache_write: 0 },
  'gpt-5-pro': { input: 15, output: 120, cache_read: 0, cache_write: 0 },
  'gpt-5': { input: 1.25, output: 10, cache_read: 0.125, cache_write: 0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6, cache_read: 0.1, cache_write: 0 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4, cache_read: 0.025, cache_write: 0 },
  'gpt-4.1': { input: 2, output: 8, cache_read: 0.5, cache_write: 0 },
  'gpt-4o-2024-05-13': { input: 5, output: 15, cache_read: 0, cache_write: 0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6, cache_read: 0.075, cache_write: 0 },
  'gpt-4o': { input: 2.5, output: 10, cache_read: 1.25, cache_write: 0 },
  'o1-pro': { input: 150, output: 600, cache_read: 0, cache_write: 0 },
  o1: { input: 15, output: 60, cache_read: 7.5, cache_write: 0 },
  'o3-pro': { input: 20, output: 80, cache_read: 0, cache_write: 0 },
  'o3-mini': { input: 1.1, output: 4.4, cache_read: 0.55, cache_write: 0 },
  o3: { input: 2, output: 8, cache_read: 0.5, cache_write: 0 },
  'o4-mini': { input: 1.1, output: 4.4, cache_read: 0.275, cache_write: 0 },
  'gpt-4-turbo': { input: 10, output: 30, cache_read: 0, cache_write: 0 },
  'gpt-4': { input: 30, output: 60, cache_read: 0, cache_write: 0 },
  'gpt-3.5-turbo-instruct': { input: 1.5, output: 2, cache_read: 0, cache_write: 0 },
  'gpt-3.5-turbo-1106': { input: 1, output: 2, cache_read: 0, cache_write: 0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5, cache_read: 0, cache_write: 0 },
  'gpt-5.1-codex-mini': { input: 0.25, output: 2, cache_read: 0.025, cache_write: 0 },
  'gpt-5.3-chat-latest': { input: 1.75, output: 14, cache_read: 0.175, cache_write: 0 },
  'gpt-5.6-cyber': { input: 12.5, output: 75, cache_read: 1.25, cache_write: 15.625 },
  'gpt-5.5-cyber': { input: 12.5, output: 75, cache_read: 1.25, cache_write: 0 },
  'chat-latest': { input: 5, output: 30, cache_read: 0.5, cache_write: 0 },
  'gpt-5-codex': { input: 1.25, output: 10, cache_read: 0.125, cache_write: 0 },
  'gpt-5.1-codex': { input: 1.25, output: 10, cache_read: 0.125, cache_write: 0 },
  'gpt-5.1-codex-max': { input: 1.25, output: 10, cache_read: 0.125, cache_write: 0 },
  'gpt-5-chat-latest': { input: 1.25, output: 10, cache_read: 0.125, cache_write: 0 },
  'gpt-5.1-chat-latest': { input: 1.25, output: 10, cache_read: 0.125, cache_write: 0 },
  'gpt-5.2-codex': { input: 1.75, output: 14, cache_read: 0.175, cache_write: 0 },
  'gpt-5.2-chat-latest': { input: 1.75, output: 14, cache_read: 0.175, cache_write: 0 },
}

/** Only verified snapshot aliases. Unknown suffixes do not inherit a parent price. */
const OPENAI_ALIASES = {
  'gpt-3.5-turbo-0125': 'gpt-3.5-turbo',
  'gpt-4-0314': 'gpt-4',
  'gpt-4-0613': 'gpt-4',
  'gpt-4-turbo-2024-04-09': 'gpt-4-turbo',
  'gpt-4.1-2025-04-14': 'gpt-4.1',
  'gpt-4.1-mini-2025-04-14': 'gpt-4.1-mini',
  'gpt-4.1-nano-2025-04-14': 'gpt-4.1-nano',
  'gpt-4o-2024-08-06': 'gpt-4o',
  'gpt-4o-2024-11-20': 'gpt-4o',
  'gpt-4o-mini-2024-07-18': 'gpt-4o-mini',
  'gpt-5-2025-08-07': 'gpt-5',
  'gpt-5-mini-2025-08-07': 'gpt-5-mini',
  'gpt-5-nano-2025-08-07': 'gpt-5-nano',
  'gpt-5-pro-2025-10-06': 'gpt-5-pro',
  'gpt-5.1-2025-11-13': 'gpt-5.1',
  'gpt-5.2-2025-12-11': 'gpt-5.2',
  'gpt-5.2-pro-2025-12-11': 'gpt-5.2-pro',
  'gpt-5.4-2026-03-05': 'gpt-5.4',
  'gpt-5.4-mini-2026-03-17': 'gpt-5.4-mini',
  'gpt-5.4-nano-2026-03-17': 'gpt-5.4-nano',
  'gpt-5.4-pro-2026-03-05': 'gpt-5.4-pro',
  'gpt-5.5-2026-04-23': 'gpt-5.5',
  'gpt-5.5-pro-2026-04-23': 'gpt-5.5-pro',
  'gpt-daybreak-blue-latest': 'gpt-5.6-sol',
  'gpt-daybreak-red-latest': 'gpt-5.6-cyber',
  'o1-2024-12-17': 'o1',
  'o1-pro-2025-03-19': 'o1-pro',
  'o3-2025-04-16': 'o3',
  'o3-mini-2025-01-31': 'o3-mini',
  'o3-pro-2025-06-10': 'o3-pro',
  'o4-mini-2025-04-16': 'o4-mini',
}

export function resolveOpenaiPricingKey(raw) {
  const m = (
    String(raw || '')
      .split('/')
      .filter(Boolean)
      .pop() || ''
  )
    .replace(/\[[^\]]+\]$/g, '')
    .replace(/-fast$/i, '')
    .trim()
    .toLowerCase()
  if (!m) return null
  if (OPENAI_ALIASES[m]) return OPENAI_ALIASES[m]
  if (OPENAI_OFFICIAL_RATES[m]) return m
  return null
}

export function resolveOpenaiOfficialRates(raw) {
  const key = resolveOpenaiPricingKey(raw)
  const rates = key ? OPENAI_OFFICIAL_RATES[key] : null
  return {
    key,
    rates: rates ? { ...rates } : null,
    source: OPENAI_PRICING_SOURCE,
    known: !!rates,
    family: 'openai',
  }
}
