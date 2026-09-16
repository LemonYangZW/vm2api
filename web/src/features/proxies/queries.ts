import { queryOptions } from '@tanstack/react-query'
import type { ProxyPoolPayload } from '@/types/panel-proxy'
import { api } from '@/lib/api'

export function proxiesQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'proxies'] as const,
    queryFn: () => api<ProxyPoolPayload>('/api/panel/proxies'),
  })
}
