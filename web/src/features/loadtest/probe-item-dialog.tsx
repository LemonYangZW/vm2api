import { useState } from 'react'
import type { ProbeItem, ProbeRun } from '@/types/panel-loadtest'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PROBE_ANOMALY } from '@/features/loadtest/options'

type Pane = 'text' | 'think' | 'raw'

/**
 * 单条探针结果详情，镜像 index.html `openProbeItem()`：正文/思考/Raw 三个
 * 切换 tab，异常 pill 列表，模型/HTTP/stop_reason 头部信息。
 */
export function ProbeItemDialog({
  run,
  index,
  onOpenChange,
}: {
  run: ProbeRun | undefined
  index: number | null
  onOpenChange: (open: boolean) => void
}) {
  const [pane, setPane] = useState<Pane>('text')
  const item: ProbeItem | undefined =
    index != null ? run?.items?.[index] : undefined

  const hasText = !!(item?.text && item.text.trim())
  const rawObj =
    item?.raw ??
    (item?.raw_summary
      ? { summary: item.raw_summary, error: item.error || null }
      : null)
  const fallbackText =
    [
      item?.error ? `错误: ${item.error}` : '',
      rawObj ? JSON.stringify(rawObj, null, 2) : '',
    ]
      .filter(Boolean)
      .join('\n\n') || '尚无正文'
  const body =
    pane === 'think'
      ? item?.thinking || '无思考块'
      : pane === 'raw'
        ? JSON.stringify(
            rawObj || { note: '尚无 raw', error: item?.error || null },
            null,
            2
          )
        : hasText
          ? item!.text!
          : fallbackText

  return (
    <Dialog
      open={index != null}
      onOpenChange={(v) => {
        if (!v) setPane('text')
        onOpenChange(v)
      }}
    >
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {item?.label || item?.case_id || ''} · {item?.form || '能力'}
          </DialogTitle>
          <p className='font-mono text-xs text-muted-foreground'>
            {item?.model}
            {item?.http ? ` · HTTP ${item.http}` : ''}
            {item?.stop_reason ? ` · ${item.stop_reason}` : ''}
          </p>
        </DialogHeader>
        <div className='flex flex-wrap gap-1'>
          {item?.error ? (
            <Badge variant='destructive'>{item.error}</Badge>
          ) : null}
          {item?.anomalies?.length ? (
            item.anomalies.map((a) => (
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
          ) : item?.error ? null : (
            <Badge variant='outline'>无异常</Badge>
          )}
        </div>
        <div className='flex gap-1'>
          {(['text', 'think', 'raw'] as Pane[]).map((p) => (
            <Button
              key={p}
              type='button'
              size='sm'
              variant={pane === p ? 'default' : 'outline'}
              onClick={() => setPane(p)}
            >
              {p === 'text' ? '正文' : p === 'think' ? '思考' : 'Raw'}
            </Button>
          ))}
        </div>
        <pre className='max-h-[58vh] overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap'>
          {body}
        </pre>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
