import type { StatsBucket } from '@/types/panel-overview'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtNum, fmtUsd } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { PanelCard } from '@/features/overview/panel-card'

type TrendPoint = {
  key: string
  label: string
  requests: number
  errors: number
  tokensIn: number
  tokensOut: number
  cost: number
}

const HOUR_MS = 3600_000

/**
 * 把稀疏的小时桶铺满最近 24 格。SQL 端没有请求的小时不出行，
 * 直接喂给图表会让柱间距随空洞伸缩，视觉上撒谎。
 * 桶 key 是 UTC 小时（`2026-08-30T14:00`），标签换回本地钟点。
 */
function hourlyPoints(buckets: StatsBucket[]): TrendPoint[] {
  const map = new Map(buckets.map((b) => [b.bucket, b]))
  const base = Math.floor(Date.now() / HOUR_MS) * HOUR_MS
  const points: TrendPoint[] = []
  for (let i = 23; i >= 0; i--) {
    const t = new Date(base - i * HOUR_MS)
    const key = `${t.toISOString().slice(0, 13)}:00`
    const row = map.get(key)
    points.push({
      key,
      label: `${String(t.getHours()).padStart(2, '0')}:00`,
      requests: Number(row?.requests || 0),
      errors: Number(row?.errors || 0),
      tokensIn: Number(row?.input_tokens || 0),
      tokensOut: Number(row?.output_tokens || 0),
      cost: Number(row?.total_cost || 0),
    })
  }
  return points
}

/** 只在有错误的小时点一个红点；无错误的小时不画，红色只留给异常。 */
function ErrorDot({
  cx,
  cy,
  payload,
}: {
  cx?: number
  cy?: number
  payload?: TrendPoint
}) {
  if (!payload?.errors || cx == null || cy == null) return null
  return <circle cx={cx} cy={cy} r={2.5} fill='var(--status-bad-solid)' />
}

function TrendTip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: TrendPoint }[]
}) {
  const p = active ? payload?.[0]?.payload : undefined
  if (!p) return null
  return (
    <div className='rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md'>
      <div className='font-medium'>{p.label}</div>
      <dl className='mt-1.5 space-y-0.5 tabular-nums'>
        <div className='flex justify-between gap-4'>
          <dt className='text-muted-foreground'>请求</dt>
          <dd className='font-medium'>{fmtNum(p.requests)}</dd>
        </div>
        <div className='flex justify-between gap-4'>
          <dt className='text-muted-foreground'>错误</dt>
          <dd
            className='font-medium'
            style={p.errors ? { color: 'var(--status-bad)' } : undefined}
          >
            {fmtNum(p.errors)}
          </dd>
        </div>
        <div className='flex justify-between gap-4'>
          <dt className='text-muted-foreground'>Tokens</dt>
          <dd>
            {fmtNum(p.tokensIn)} / {fmtNum(p.tokensOut)}
          </dd>
        </div>
        <div className='flex justify-between gap-4'>
          <dt className='text-muted-foreground'>费用</dt>
          <dd>{fmtUsd(p.cost)}</dd>
        </div>
      </dl>
    </div>
  )
}

/** 近 24 小时请求/错误趋势。数据来自 `/request-logs/stats?bucket=hour` 的 `buckets`。 */
export function TrendChart({
  buckets,
  loading,
  error,
  className,
}: {
  buckets: StatsBucket[]
  loading?: boolean
  error?: string
  className?: string
}) {
  const points = hourlyPoints(buckets)
  const totalReqs = points.reduce((n, p) => n + p.requests, 0)
  const totalErrs = points.reduce((n, p) => n + p.errors, 0)
  const totalCost = points.reduce((n, p) => n + p.cost, 0)

  return (
    <PanelCard
      title='请求趋势'
      meta='近 24 小时 · 按小时'
      className={className}
      action={
        totalReqs > 0 ? (
          <span className='text-[11px] text-muted-foreground tabular-nums'>
            {fmtNum(totalReqs)} 请求
            {totalErrs > 0 ? (
              <>
                {' · '}
                <span style={{ color: 'var(--status-bad)' }}>
                  {fmtNum(totalErrs)} 错
                </span>
              </>
            ) : null}
            {' · '}
            {fmtUsd(totalCost)}
          </span>
        ) : null
      }
    >
      <div className='min-h-[240px] flex-1 px-2 pt-4 pb-2'>
        {loading ? (
          <div className='flex h-full min-h-[224px] items-end gap-1.5 px-4 pb-6'>
            {[35, 55, 40, 70, 50, 80, 60, 45, 65, 52, 74, 58].map((h, i) => (
              <Skeleton
                key={i}
                className='flex-1 rounded-sm'
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className='grid h-full min-h-[224px] place-items-center text-sm text-muted-foreground'>
            统计加载失败：{error}
          </div>
        ) : totalReqs === 0 ? (
          <div className='grid h-full min-h-[224px] place-items-center'>
            <EmptyState reason='近 24 小时无请求' />
          </div>
        ) : (
          <ResponsiveContainer width='100%' height='100%' minHeight={224}>
            <ComposedChart
              data={points}
              margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
            >
              <CartesianGrid
                vertical={false}
                stroke='var(--border)'
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                interval='preserveStartEnd'
                minTickGap={28}
                tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v: number) => fmtNum(v)}
                tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip
                content={<TrendTip />}
                cursor={{ fill: 'var(--muted)', fillOpacity: 0.5 }}
                isAnimationActive={false}
              />
              <Bar
                dataKey='requests'
                fill='var(--chart-1)'
                fillOpacity={0.85}
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
                isAnimationActive={false}
              />
              {totalErrs > 0 ? (
                <Line
                  dataKey='errors'
                  stroke='var(--status-bad-solid)'
                  strokeWidth={1.5}
                  dot={ErrorDot}
                  isAnimationActive={false}
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </PanelCard>
  )
}
