import { useState } from 'react'
import type { ProbeRun } from '@/types/panel-loadtest'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'
import { StatCard } from '@/components/stat-card'
import { StatusMark } from '@/components/status-mark'
import { loadtestStatusTone } from '@/features/loadtest/loadtest-status'
import { PROBE_ANOMALY, PROBE_FORMS } from '@/features/loadtest/options'
import { ProbeBar } from '@/features/loadtest/probe-bar'
import { ProbeItemDialog } from '@/features/loadtest/probe-item-dialog'

function formLabel(id: string | null | undefined) {
  return PROBE_FORMS.find((f) => f.id === id)?.label || id || '—'
}

/**
 * 探针「本次结果」卡片，镜像 index.html `renderProbeResults(suite)`：
 * 顶部状态/抽到的用例/seed，整体进度条，6 张统计卡，逐条明细表 + 详情弹窗。
 */
export function ProbeResultsCard({
  suite,
  run,
}: {
  suite: 'capability' | 'forms'
  run: ProbeRun | undefined
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  if (!run || (run.suite && run.suite !== suite && run.suite !== 'all')) {
    return null
  }

  const sum = run.summary || {}
  const tone = loadtestStatusTone(run.status)
  const items = run.items || []
  const drawn = [...new Set(items.map((it) => it.label).filter(Boolean))]

  const total = sum.total || items.length || 0
  const finished =
    sum.finished != null
      ? sum.finished
      : items.filter(
          (x) =>
            x.status !== 'pending' &&
            x.status !== 'running' &&
            x.status !== 'cancelling'
        ).length
  const overall = total ? Math.round((finished / total) * 100) : 0
  const overallTone =
    run.status === 'running' || run.status === 'cancelling'
      ? 'bg-[color:var(--status-warn)] animate-pulse'
      : run.status === 'error'
        ? 'bg-[color:var(--status-bad)]'
        : 'bg-[color:var(--status-ok)]'

  return (
    <Card>
      <CardHeader>
        <CardTitle>本次结果</CardTitle>
        <p className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
          <StatusMark tone={tone} />
          <span className='font-mono'>{run.id}</span>
          {drawn.length ? <span>· 抽到 {drawn.join(' / ')}</span> : null}
          {run.seed != null ? <span>· seed {run.seed}</span> : null}
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-1.5'>
          <Progress
            value={overall}
            className='h-2'
            indicatorClassName={overallTone}
          />
          <p className='text-xs text-muted-foreground'>
            流式进度 {finished}/{total}
            {sum.running ? ` · 进行中 ${sum.running}` : ''}
            {sum.pending ? ` · 排队 ${sum.pending}` : ''}
          </p>
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6'>
          <StatCard
            label='准确'
            value={
              sum.exact != null && sum.total ? `${sum.exact}/${sum.total}` : '—'
            }
          />
          <StatCard
            label='准确率'
            value={
              sum.accuracy != null
                ? `${Math.round((sum.accuracy || 0) * 100)}%`
                : '—'
            }
          />
          <StatCard label='空正文' value={String(sum.empty ?? '—')} />
          <StatCard label='截断' value={String(sum.truncated ?? '—')} />
          <StatCard label='只思考' value={String(sum.thinking_only ?? '—')} />
          <StatCard label='拒答' value={String(sum.refusal ?? '—')} />
        </div>

        {items.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模型</TableHead>
                <TableHead>用例</TableHead>
                <TableHead>准确</TableHead>
                <TableHead>异常</TableHead>
                <TableHead>流式</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, i) => (
                <TableRow key={it.id || i}>
                  <TableCell className='text-xs'>
                    {String(it.model || '').replace(/^claude-/, '')}
                  </TableCell>
                  <TableCell>
                    {it.label || it.case_id || ''}
                    {it.form ? (
                      <div className='text-xs text-muted-foreground'>
                        {formLabel(it.form)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {it.status === 'pending' || it.status === 'running' ? (
                      <span className='text-xs text-muted-foreground'>…</span>
                    ) : it.exact ? (
                      <Badge>准确</Badge>
                    ) : (
                      <Badge variant='destructive'>不准</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {it.anomalies?.length ? (
                        it.anomalies.map((a) => (
                          <Badge
                            key={a}
                            variant={
                              a === 'mismatch' || a === 'empty' || a === 'http'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {PROBE_ANOMALY[a] || a}
                          </Badge>
                        ))
                      ) : (
                        <span className='text-xs text-muted-foreground'>—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProbeBar item={it} />
                  </TableCell>
                  <TableCell className='text-xs'>
                    {it.http || '—'}
                    {it.stop_reason ? (
                      <div className='text-muted-foreground'>
                        {it.stop_reason}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <button
                      type='button'
                      className='text-xs text-primary hover:underline'
                      onClick={() => setOpenIdx(i)}
                    >
                      详情
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState reason='等待…' />
        )}
      </CardContent>
      <ProbeItemDialog
        run={run}
        index={openIdx}
        onOpenChange={(open) => !open && setOpenIdx(null)}
      />
    </Card>
  )
}
