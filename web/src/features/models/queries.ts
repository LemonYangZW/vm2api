import { queryOptions } from '@tanstack/react-query'
import type { ModelsPayload } from '@/types/panel-models'
import { api } from '@/lib/api'
import type { PolicyPayload } from '@/features/models/policy'

export function modelPolicyQueryOptions(
  platform: 'anthropic' | 'openai' = 'anthropic'
) {
  const q = platform === 'openai' ? '?platform=openai' : '?platform=anthropic'
  return queryOptions({
    queryKey: ['panel', 'model-policy', platform] as const,
    queryFn: () => api<PolicyPayload>(`/api/panel/model-policy${q}`),
  })
}

export function modelsQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'models'] as const,
    queryFn: () => api<ModelsPayload>('/api/panel/models'),
  })
}
