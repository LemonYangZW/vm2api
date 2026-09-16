/** GPT chat ids. No I/O. */

export const SKIP_GPT =
  /^(whisper|tts-|dall-e|chatgpt-image|gpt-image|text-embedding|text-moderation|omni-moderation|davinci|babbage|curie)/i

export const GPT_ID_PREFIX = /^gpt/i

export function isGptSeriesId(id) {
  const s = String(id || '').trim()
  return GPT_ID_PREFIX.test(s) && !SKIP_GPT.test(s)
}
