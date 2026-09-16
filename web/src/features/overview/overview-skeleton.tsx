import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionSkeleton } from '@/components/page-skeletons'

/**
 * 总览页首屏骨架。与实际结构对应：hero（gauge + 健康条/图例 + 主机列）→
 * 趋势图 + KPI 侧栏 → 计费面板 → 服务质量面板 → 错误集合，避免灰条跳内容。
 */
export function OverviewSkeleton() {
  return (
    <div className='space-y-3'>
      <Card className='shadow-none'>
        <CardContent className='flex flex-wrap items-center gap-6 pt-6'>
          <Skeleton className='size-[92px] shrink-0 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-2.5 w-full max-w-md rounded-full' />
            <Skeleton className='h-4 w-56' />
          </div>
          <div className='flex w-full flex-col gap-2 sm:w-[220px]'>
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-full' />
          </div>
        </CardContent>
      </Card>
      <div className='grid gap-3 xl:grid-cols-3'>
        <Skeleton className='h-[300px] rounded-xl xl:col-span-2' />
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-1'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-[68px] rounded-xl' />
          ))}
        </div>
      </div>
      <Skeleton className='h-[140px] rounded-xl' />
      <Skeleton className='h-[210px] rounded-xl' />
      <SectionSkeleton titleWidth='w-24' showDescription={false} rows={2} />
    </div>
  )
}
