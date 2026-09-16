import type { InferenceEngine } from '@/types/panel-vm'

export const DEFAULT_RESOLVED_ENGINE: InferenceEngine = 'rust'

export const INFERENCE_ENGINE_OPTIONS: {
  value: InferenceEngine
  label: string
}[] = [
  { value: 'auto', label: '自动（继承 rust）' },
  { value: 'go', label: 'Go HTTP（已废弃，不启动 hop）' },
  { value: 'rust', label: 'Rust · wrap cli-hop' },
]

export function normalizeInferenceEngine(
  value: unknown,
  fallback: InferenceEngine
): InferenceEngine {
  return value === 'go' || value === 'rust' || value === 'auto'
    ? value
    : fallback
}

export function inferenceEnginePatchValue(value: InferenceEngine) {
  return value === 'auto' ? '' : value
}

/** Gateway `normalizeInferenceEngine('')` → rust. Only an explicit `'go'` stays go. */
export function normalizeGlobalClaudeEngine(value: unknown): 'go' | 'rust' {
  return value === 'go' ? 'go' : 'rust'
}

/** Gateway `fallback_to_go` omit = false. */
export function isFallbackToGo(value: unknown): boolean {
  return value === true
}

export function inferenceEngineLabel(
  value: InferenceEngine | null | undefined
) {
  return (
    INFERENCE_ENGINE_OPTIONS.find((option) => option.value === value)?.label ||
    '未知'
  )
}
