import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { VIEW_TITLES } from '@/config/nav'
import type { LoadtestRun, ProbeRun } from '@/types/panel-loadtest'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/page-header'
import { errorMessage } from '@/components/query-gate'
import { LoadtestArchiveBrowser } from '@/features/loadtest/archive-browser'
import { LoadtestResultsCard } from '@/features/loadtest/loadtest-results-card'
import { LOADTEST_TABS, loadtestTabId } from '@/features/loadtest/options'
import { ProbePane } from '@/features/loadtest/probe-pane'
import { ProbeResultsCard } from '@/features/loadtest/probe-results-card'
import {
  isLoadtestRunning,
  loadtestRunQueryOptions,
  probeRunQueryOptions,
} from '@/features/loadtest/queries'
import { LoadtestReportsPane } from '@/features/loadtest/reports-pane'
import { useLoadtestSetup } from '@/features/loadtest/use-loadtest-setup'
import { useProbeSetup } from '@/features/loadtest/use-probe-setup'

export function LoadtestPage() {
  const { tab: rawTab } = useParams({ from: '/_authenticated/loadtest/$tab' })
  const tab = loadtestTabId(rawTab)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const setup = useLoadtestSetup()
  const probeCapSetup = useProbeSetup()
  const probeFormsSetup = useProbeSetup()
  const suite: 'capability' | 'forms' = tab === 'forms' ? 'forms' : 'capability'
  const probeSetup = suite === 'forms' ? probeFormsSetup : probeCapSetup

  const current = useQuery(loadtestRunQueryOptions())
  const probe = useQuery(
    probeRunQueryOptions(tab === 'probe' || tab === 'forms')
  )
  const queryError = current.error || probe.error

  const start = useMutation({
    mutationFn: () =>
      api<LoadtestRun>('/api/panel/concurrent-test', {
        method: 'POST',
        body: JSON.stringify({
          concurrency: setup.concurrency,
          turns: setup.turns,
          models: setup.models,
          stocks: setup.stocks,
          max_tokens: setup.maxTokens,
          stream: true,
        }),
      }),
    onSuccess: async () => {
      toast.success('研报已启动')
      await qc.invalidateQueries({
        queryKey: loadtestRunQueryOptions().queryKey,
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const cancel = useMutation({
    mutationFn: (id: string) =>
      api(`/api/panel/concurrent-test/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
        body: '{}',
      }),
    onSuccess: async () => {
      toast.success('已请求取消')
      await qc.invalidateQueries({
        queryKey: loadtestRunQueryOptions().queryKey,
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const startProbe = useMutation({
    mutationFn: () =>
      api<ProbeRun>('/api/panel/probe-test', {
        method: 'POST',
        body: JSON.stringify(
          suite === 'forms'
            ? {
                suite,
                models: probeSetup.submitModels,
                forms: probeSetup.displayForms,
                sample: probeSetup.sample,
                random: probeSetup.random,
                max_tokens: probeSetup.maxTokens,
                concurrency: probeSetup.concurrency,
              }
            : {
                suite,
                models: probeSetup.submitModels,
                cases: probeSetup.displayCases,
                sample: probeSetup.capSample,
                random: probeSetup.random,
                max_tokens: probeSetup.maxTokens,
                concurrency: probeSetup.concurrency,
              }
        ),
      }),
    onSuccess: async (r) => {
      toast.success(
        `${suite === 'forms' ? '答题' : '能力'}探针已启动 · ${r.items?.length || 0} 条`
      )
      await qc.invalidateQueries({
        queryKey: probeRunQueryOptions(true).queryKey,
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const cancelProbe = useMutation({
    mutationFn: () =>
      api(
        `/api/panel/probe-test/${encodeURIComponent(probe.data!.id)}/cancel`,
        {
          method: 'POST',
          body: '{}',
        }
      ),
    onSuccess: async () => {
      toast.success('已请求取消')
      await qc.invalidateQueries({
        queryKey: probeRunQueryOptions(true).queryKey,
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <PageHeader title={VIEW_TITLES.loadtest}>
      <Tabs
        value={tab}
        onValueChange={(next) =>
          navigate({ to: '/loadtest/$tab', params: { tab: next } })
        }
      >
        <TabsList>
          {LOADTEST_TABS.map(([id, label]) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {/*
        压测页的表单必须始终可操作，所以不用 QueryGate 整体包裹 ——
        那会在查询失败时连「开跑」按钮一起挡掉。这里只把查询错误显式
        提示出来，避免此前「接口挂了但页面看起来正常」的静默失败。
      */}
      {queryError ? (
        <Alert variant='destructive' className='mt-4'>
          <AlertTitle>状态加载失败</AlertTitle>
          <AlertDescription>
            {errorMessage(queryError)} ——
            表单仍可提交，但下方的运行状态与历史报告可能不是最新。
          </AlertDescription>
        </Alert>
      ) : null}
      {tab === 'reports' ? (
        <div className='mt-4 space-y-4'>
          <LoadtestReportsPane
            setup={setup}
            current={current.data}
            onStart={() => start.mutate()}
            onCancel={(id) => cancel.mutate(id)}
            starting={start.isPending}
            cancelling={cancel.isPending}
          />
          {current.data ? <LoadtestResultsCard run={current.data} /> : null}
          <LoadtestArchiveBrowser />
        </div>
      ) : (
        <div className='mt-4 space-y-4'>
          <ProbePane
            suite={suite}
            setup={probeSetup}
            running={isLoadtestRunning(probe.data?.status)}
            onStart={() => startProbe.mutate()}
            onCancel={() => cancelProbe.mutate()}
          />
          <ProbeResultsCard suite={suite} run={probe.data} />
        </div>
      )}
    </PageHeader>
  )
}
