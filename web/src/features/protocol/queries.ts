import { queryOptions } from '@tanstack/react-query'
import type { DistillRules, RefusalGuardConfig } from '@/types/panel-routing'
import { api } from '@/lib/api'

export function distillQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'distill'] as const,
    queryFn: () => api<DistillRules>('/api/panel/distill'),
  })
}

export function refusalGuardsQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'refusal-guards'] as const,
    queryFn: () => api<RefusalGuardConfig>('/api/panel/refusal-guards'),
  })
}
