import { createFileRoute } from '@tanstack/react-router'
import { LogsPage } from '@/features/logs'

export type LogsSearch = {
  error_class?: string
  kind?: 'error'
}

export const Route = createFileRoute('/_authenticated/logs')({
  validateSearch: (search: Record<string, unknown>): LogsSearch => ({
    error_class:
      typeof search.error_class === 'string' && search.error_class
        ? search.error_class
        : undefined,
    kind: search.kind === 'error' ? 'error' : undefined,
  }),
  component: LogsPage,
})
