import { Skeleton } from '@/components/ui/skeleton'
import { CardGridSkeleton } from '@/components/page-skeletons'

/** 对应：4 张 StatCard → 视图/排序筹码 → 状态筹码 → 卡片网格。 */
export function VmListSkeleton() {
  return (
    <div>
      <CardGridSkeleton
        cards={4}
        className='mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
      />
      <div className='mb-3 flex flex-wrap gap-2'>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={`view-${i}`} className='h-8 w-16 rounded-md' />
        ))}
      </div>
      <div className='mb-4 flex flex-wrap gap-2'>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`filter-${i}`} className='h-8 w-16 rounded-md' />
        ))}
      </div>
      <CardGridSkeleton cards={6} />
    </div>
  )
}
