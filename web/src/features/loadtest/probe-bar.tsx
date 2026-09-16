import type { ProbeItem } from '@/types/panel-loadtest'
import { Progress } from '@/components/ui/progress'

const TONE_CLASS: Record<'run' | 'ok' | 'bad' | 'wait', string> = {
  run: 'bg-[color:var(--status-warn)] animate-pulse',
  ok: 'bg-[color:var(--status-ok)]',
  bad: 'bg-[color:var(--status-bad)]',
  wait: 'bg-[color:var(--status-none)]',
}

/**
 * 单条探针结果的流式进度条，镜像 index.html `probeBar(it)`：
 * 排队/进行中（含 phase 文案）/失败/完成 四态，进行中态用脉冲色。
 */
export function ProbeBar({ item }: { item: ProbeItem | undefined }) {
  const st = item?.stream
  const max = Number(st?.max_tokens) || 0
  const out = Number(st?.tokens_out) || 0
  const chars = Number(st?.chars) || 0
  const think = Number(st?.thinking_chars) || 0

  let pct = 0
  let label = ''
  let tone: keyof typeof TONE_CLASS = 'run'

  if (!item || item.status === 'pending') {
    label = '排队'
    tone = 'wait'
  } else if (item.status === 'running' || item.status === 'cancelling') {
    if (max && out) pct = Math.min(95, Math.round((out / max) * 100))
    else if (think || chars)
      pct = Math.min(88, 10 + Math.round(Math.min(think + chars, 8000) / 80))
    else pct = 8
    const phase =
      st?.phase === 'thinking'
        ? `思考 ${think} 字`
        : st?.phase === 'text'
          ? `正文 ${chars} 字`
          : '流式接收'
    label = st?.turn ? `第${st.turn}轮 · ${phase}` : phase
    tone = 'run'
  } else if (item.status === 'error' || item.status === 'cancelled') {
    pct = 100
    tone = 'bad'
    label = item.status === 'cancelled' ? '已取消' : '失败'
  } else {
    pct = 100
    tone = 'ok'
    label = [
      out ? `${out} tok` : '',
      item.duration_ms ? `${item.duration_ms}ms` : '完成',
    ]
      .filter(Boolean)
      .join(' · ')
  }

  return (
    <div className='min-w-[110px] space-y-1'>
      <Progress
        value={pct}
        className='h-1.5'
        indicatorClassName={TONE_CLASS[tone]}
      />
      <div className='text-xs text-muted-foreground'>{label}</div>
    </div>
  )
}
