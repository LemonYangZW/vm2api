function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}

export function LatencyBreakdownBar({
  ttftMs,
  durationMs,
  className,
}: {
  ttftMs: number | null
  durationMs: number | null
  className?: string
}) {
  if (
    ttftMs == null ||
    durationMs == null ||
    ttftMs < 0 ||
    durationMs <= 0 ||
    ttftMs > durationMs
  ) {
    return null
  }
  const generationMs = durationMs - ttftMs
  const percent = (ms: number) => (ms / durationMs) * 100
  const minWidth = 3
  const width = (ms: number) => Math.max(percent(ms), ms > 0 ? minWidth : 0)
  const segments = [
    {
      key: 'ttft',
      ms: ttftMs,
      label: '首字',
      barClass: 'bg-violet-500',
      dotClass: 'bg-violet-500',
    },
    {
      key: 'gen',
      ms: generationMs,
      label: '生成',
      barClass: 'bg-emerald-500',
      dotClass: 'bg-emerald-500',
    },
  ]

  return (
    <div className={className}>
      <div className='flex h-6 w-full overflow-hidden rounded-lg bg-muted/50'>
        {segments.map((s) =>
          s.ms > 0 ? (
            <div
              key={s.key}
              className={`flex items-center justify-center text-[10px] font-medium text-white transition-all duration-200 ${s.barClass}`}
              style={{ width: `${width(s.ms)}%` }}
              title={`${s.label}: ${formatMs(s.ms)} (${percent(s.ms).toFixed(1)}%)`}
            >
              {percent(s.ms) >= 15 ? <span>{s.label}</span> : null}
            </div>
          ) : null
        )}
      </div>
      <div className='mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs'>
        {segments.map((s) =>
          s.ms > 0 ? (
            <div key={s.key} className='flex items-center gap-1.5'>
              <div className={`h-2.5 w-2.5 rounded-sm ${s.dotClass}`} />
              <span className='text-muted-foreground'>{s.label}:</span>
              <span className='font-mono font-medium'>{formatMs(s.ms)}</span>
            </div>
          ) : null
        )}
        <div className='text-muted-foreground'>
          总耗时:{' '}
          <span className='font-mono font-medium'>{formatMs(durationMs)}</span>
        </div>
      </div>
    </div>
  )
}
