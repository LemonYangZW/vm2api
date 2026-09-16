import { queryOptions } from '@tanstack/react-query'
import type { ApiKeysPayload } from '@/types/panel-keys'
import { api } from '@/lib/api'

export function apiKeysQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'api-keys'] as const,
    queryFn: () => api<ApiKeysPayload>('/api/panel/api-keys'),
  })
}
