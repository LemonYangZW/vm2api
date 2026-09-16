import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/empty-state'
import { LoadtestTextDialog } from '@/features/loadtest/loadtest-text-dialog'
import {
  loadtestReportQueryOptions,
  loadtestReportsQueryOptions,
} from '@/features/loadtest/queries'

/**
 * 按日归档浏览器，镜像 index.html `renderLoadtestArchive()`：
 * 日期下拉切换 + 当日报告文件列表 + 点开查看正文。
 */
export function LoadtestArchiveBrowser() {
  const [day, setDay] = useState('')
  const [openReport, setOpenReport] = useState<{
    day: string
    name: string
  } | null>(null)

  const reports = useQuery(loadtestReportsQueryOptions(day))
  const detail = useQuery(loadtestReportQueryOptions(openReport))

  const refresh = useMutation({
    mutationFn: () => reports.refetch(),
    onError: (error: Error) => toast.error(error.message),
  })

  const days = reports.data?.days || []
  const currentDay = day || reports.data?.day || ''
  const items = reports.data?.items || []

  return (
    <Card>
      <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-2 space-y-0'>
        <div>
          <CardTitle>已保存正文</CardTitle>
          <p className='text-xs text-muted-foreground'>
            {currentDay
              ? `${currentDay} · ${items.length} 篇`
              : '按日期查看落地的研报'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {days.length ? (
            <Select value={currentDay} onValueChange={setDay}>
              <SelectTrigger className='h-8 w-[140px]' aria-label='选择日期'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            size='sm'
            variant='outline'
            onClick={() => refresh.mutate()}
            disabled={reports.isFetching}
            loading={reports.isFetching}
          >
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reports.error ? (
          <p className='text-sm text-destructive'>
            读取存档失败:{' '}
            {reports.error instanceof Error
              ? reports.error.message
              : '未知错误'}
          </p>
        ) : items.length ? (
          <div className='flex flex-wrap gap-2'>
            {items.map((f) => (
              <button
                key={f.name}
                type='button'
                className='flex min-w-[160px] flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-xs hover:bg-accent'
                onClick={() => setOpenReport({ day: f.day, name: f.name })}
              >
                <span className='font-medium'>{f.name}</span>
                <span className='text-muted-foreground'>{f.bytes ?? 0} B</span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState reason='这一天还没有正文。' />
        )}
      </CardContent>
      <LoadtestTextDialog
        open={!!openReport}
        onOpenChange={(open) => !open && setOpenReport(null)}
        title={openReport?.name || ''}
        subtitle={
          detail.data?.path ||
          (openReport ? `${openReport.day}/${openReport.name}` : '')
        }
        text={detail.data?.text || (detail.isLoading ? '加载中…' : '')}
      />
    </Card>
  )
}
