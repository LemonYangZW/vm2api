import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ProxySummaryProps = {
  total: number
  totals: Record<string, unknown>
  slotsUsed: number
  slotsCap: number
}

export function ProxySummary(props: ProxySummaryProps) {
  const { total, totals: tot, slotsUsed, slotsCap } = props
  return (
    <div className='mb-4 grid gap-3 sm:grid-cols-4'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>总数</CardTitle>
        </CardHeader>
        <CardContent className='field-count'>{String(total)}</CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>健康</CardTitle>
        </CardHeader>
        <CardContent className='field-count text-ok-3'>
          {String(tot.ok ?? 0)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>已绑 / 容量</CardTitle>
        </CardHeader>
        <CardContent className='field-count'>
          {String(slotsUsed)} / {String(slotsCap || '—')}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>失效</CardTitle>
        </CardHeader>
        <CardContent className='field-count text-red-3'>
          {String(tot.dead ?? 0)}
        </CardContent>
      </Card>
    </div>
  )
}
