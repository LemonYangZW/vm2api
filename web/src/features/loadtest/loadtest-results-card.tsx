import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LoadtestRun } from '@/types/panel-loadtest'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { LoadtestTextDialog } from '@/features/loadtest/loadtest-text-dialog'
import { loadtestTurnQueryOptions } from '@/features/loadtest/queries'

/**
 * 研报「本次结果」卡片，镜像 index.html `renderLoadtest()` 里的会话级表格
 * 区块：状态徽标、5 张统计卡、会话/单轮明细表、`report_markdown` 折叠展开。
 */
export function LoadtestResultsCard({ run }: { run: LoadtestRun }) {
  const [openTurn, setOpenTurn] = useState<{
    sessionIndex: number
    turnN: number
  } | null>(null)

  const tone = loadtestStatusTone(run.status)
  const sum = run.summary

  const turnDetail = useQuery(loadtestTurnQueryOptions(run.id, openTurn))

  const session = openTurn
    ? turnDetail.data?.sessions?.find((s) => s.index === openTurn.sessionIndex)
    : undefined
  const turn = openTurn
    ? session?.turns?.find((t) => t.n === openTurn.turnN)
    : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>本次结果</CardTitle>
        <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <StatusMark tone={tone} />
          <span className='font-mono'>{run.id}</span>
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5'>
          <StatCard
            label='成功'
            value={sum ? `${sum.ok ?? 0}/${sum.total ?? 0}` : '—'}
          />
          <StatCard label='失败' value={String(sum?.error ?? '—')} />
          <StatCard
            label='成功率'
            value={sum ? `${Math.round((sum.success_rate || 0) * 100)}%` : '—'}
          />
          <StatCard
            label='p50'
            value={
              sum?.duration_ms?.p50 != null ? `${sum.duration_ms.p50}ms` : '—'
            }
          />
          <StatCard label='tokens' value={String(sum?.tokens?.output ?? '—')} />
        </div>

        {run.sessions?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标的</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>正文</TableHead>
                <TableHead>耗时</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.sessions.map((s) => {
                const st = loadtestStatusTone(s.status)
                const finishedTurns = (s.turns || []).filter((t) => t.finished)
                return (
                  <TableRow key={s.index}>
                    <TableCell>
                      <div className='font-medium'>{s.ticker}</div>
                      <div className='text-xs text-muted-foreground'>
                        {s.name}
                      </div>
                    </TableCell>
                    <TableCell className='text-xs'>
                      {String(s.model || '').replace(/^claude-/, '')}
                    </TableCell>
                    <TableCell>
                      <StatusMark tone={st} />
                    </TableCell>
                    <TableCell>
                      {finishedTurns.length ? (
                        <div className='flex flex-wrap gap-1'>
                          {finishedTurns.map((t) => (
                            <button
                              key={t.n}
                              type='button'
                              className='text-xs text-primary hover:underline'
                              onClick={() =>
                                setOpenTurn({
                                  sessionIndex: s.index,
                                  turnN: t.n,
                                })
                              }
                            >
                              第{t.n}轮{t.ok ? '' : ' · 失败'}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className='text-xs text-muted-foreground'>
                          {s.turn || 0} / {s.turns_planned || run.turns}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {s.duration_ms ? `${s.duration_ms}ms` : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState reason='等待会话…' />
        )}

        {run.report_markdown ? (
          <Collapsible>
            <CollapsibleTrigger className='text-sm text-primary hover:underline'>
              运行汇总
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className='mt-2 max-h-[50vh] overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap'>
                {run.report_markdown}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </CardContent>
      <LoadtestTextDialog
        open={!!openTurn}
        onOpenChange={(open) => !open && setOpenTurn(null)}
        title={session ? `${session.ticker} · T${openTurn?.turnN}` : ''}
        subtitle={session?.model}
        text={
          turn?.text ||
          turn?.error ||
          (turnDetail.isLoading ? '加载中…' : '尚无正文')
        }
      />
    </Card>
  )
}
