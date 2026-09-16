/**
 * Anthropic prompt-cache hit rate.
 * input_tokens is the uncached slice; prompt = input + cache_read + cache_write.
 */
export function cacheHitStats({ input_tokens = 0, cache_read_tokens = 0, cache_creation_tokens = 0 } = {}) {
  const input = Number(input_tokens) || 0
  const read = Number(cache_read_tokens) || 0
  const write = Number(cache_creation_tokens) || 0
  const prompt = input + read + write
  return {
    input_tokens: input,
    cache_read_tokens: read,
    cache_creation_tokens: write,
    prompt_tokens: prompt,
    cache_hit_rate: prompt > 0 ? read / prompt : null,
  }
}
