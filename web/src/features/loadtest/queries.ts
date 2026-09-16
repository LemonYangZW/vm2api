import { queryOptions } from '@tanstack/react-query'
import type {
  LoadtestReportText,
  LoadtestReportsPayload,
  LoadtestRun,
  ProbeRun,
} from '@/types/panel-loadtest'
import { api } from '@/lib/api'

export function isLoadtestRunning(status: string | undefined) {
  return status === 'running' || status === 'cancelling'
}

export function loadtestRunQueryOptions() {
  return queryOptions({
    queryKey: ['panel', 'concurrent-test'] as const,
    queryFn: () => api<LoadtestRun>('/api/panel/concurrent-test'),
    refetchInterval: (query) =>
      isLoadtestRunning(query.state.data?.status) ? 1200 : false,
  })
}

export function probeRunQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: ['panel', 'probe-test'] as const,
    queryFn: () => api<ProbeRun>('/api/panel/probe-test'),
    enabled,
    refetchInterval: (query) =>
      isLoadtestRunning(query.state.data?.status) ? 700 : false,
  })
}

export function loadtestReportsQueryOptions(day: string) {
  return queryOptions({
    queryKey: ['panel', 'concurrent-test-reports', day] as const,
    queryFn: () =>
      api<LoadtestReportsPayload>(
        `/api/panel/concurrent-test-reports${day ? `?day=${encodeURIComponent(day)}` : ''}`
      ),
  })
}

export function loadtestReportQueryOptions(
  report: { day: string; name: string } | null
) {
  return queryOptions({
    queryKey: [
      'panel',
      'concurrent-test-report',
      report?.day,
      report?.name,
    ] as const,
    queryFn: () =>
      api<LoadtestReportText>(
        `/api/panel/concurrent-test-reports/${encodeURIComponent(report!.day)}/${encodeURIComponent(report!.name)}`
      ),
    enabled: !!report,
  })
}

export function loadtestTurnQueryOptions(
  runId: string,
  turn: { sessionIndex: number; turnN: number } | null
) {
  return queryOptions({
    queryKey: [
      'panel',
      'concurrent-test-turn',
      runId,
      turn?.sessionIndex,
      turn?.turnN,
    ] as const,
    queryFn: () =>
      api<LoadtestRun>(
        `/api/panel/concurrent-test/${encodeURIComponent(runId)}?text=1`
      ),
    enabled: !!turn,
  })
}
