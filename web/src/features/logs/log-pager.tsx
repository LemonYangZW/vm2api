import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { getPageNumbers } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const LOG_PAGE_SIZES = [20, 50, 100, 200]

export function LogPager({
  page,
  pageSize,
  total,
  shown,
  approximate,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  shown: number
  /** 屏蔽了 SQL 层排除不掉的类时，后端 total 偏大 —— 标注计数为近似值。 */
  approximate?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const current = Math.min(page, totalPages)
  const pageNumbers = getPageNumbers(current, totalPages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = total === 0 ? 0 : from + shown - 1

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 px-2 py-2 text-sm'>
      <div className='text-xs text-muted-foreground'>
        {from}–{to} / 共 {total} 条{approximate ? '（近似）' : ''}
      </div>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>每页</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className='h-8 w-[72px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOG_PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => onPageChange(1)}
            disabled={current <= 1}
            aria-label='第一页'
          >
            <DoubleArrowLeftIcon className='size-3.5' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            aria-label='上一页'
          >
            <ChevronLeftIcon className='size-3.5' />
          </Button>
          {pageNumbers.map((n, i) =>
            typeof n === 'string' ? (
              <span
                key={`gap-${i}`}
                className='px-1 text-xs text-muted-foreground'
              >
                …
              </span>
            ) : (
              <Button
                key={n}
                variant={n === current ? 'default' : 'outline'}
                size='icon'
                className='size-8 text-xs'
                onClick={() => onPageChange(n)}
              >
                {n}
              </Button>
            )
          )}
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => onPageChange(current + 1)}
            disabled={current >= totalPages}
            aria-label='下一页'
          >
            <ChevronRightIcon className='size-3.5' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => onPageChange(totalPages)}
            disabled={current >= totalPages}
            aria-label='最后一页'
          >
            <DoubleArrowRightIcon className='size-3.5' />
          </Button>
        </div>
      </div>
    </div>
  )
}
