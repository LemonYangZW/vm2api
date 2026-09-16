import { queryOptions } from '@tanstack/react-query'
import type { BackupsPayload, NotifyStatus } from '@/types/panel-routing'
import { api } from '@/lib/api'

export function routingQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'routing'] as const,
    queryFn: () => api<Record<string, unknown>>('/api/panel/routing'),
  })
}

export function notifyQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'notify'] as const,
    queryFn: () => api<NotifyStatus>('/api/panel/notify'),
  })
}

export function backupsQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'backups'] as const,
    queryFn: () => api<BackupsPayload>('/api/panel/backups'),
  })
}

export function backupConfigQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'backups-config'] as const,
    queryFn: () => api<Record<string, unknown>>('/api/panel/backups/config'),
  })
}
