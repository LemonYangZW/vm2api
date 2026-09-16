import { AlertCircle, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type LogKindFilter = 'all' | 'error'
export type LogModeFilter = 'normal' | 'debug'

export function QuickFiltersBar({
  kind,
  onKindChange,
  mode,
  onModeChange,
}: {
  kind: LogKindFilter
  onKindChange: (kind: LogKindFilter) => void
  mode: LogModeFilter
  onModeChange: (mode: LogModeFilter) => void
}) {
  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      <Button
        size='sm'
        variant={kind === 'error' ? 'default' : 'outline'}
        onClick={() => onKindChange(kind === 'error' ? 'all' : 'error')}
        aria-pressed={kind === 'error'}
      >
        <AlertCircle className='mr-1.5 size-4' />
        仅错误
      </Button>
      <Button
        size='sm'
        variant={mode === 'debug' ? 'default' : 'outline'}
        onClick={() => onModeChange(mode === 'debug' ? 'normal' : 'debug')}
        aria-pressed={mode === 'debug'}
      >
        <Bug className='mr-1.5 size-4' />
        Debug
      </Button>
    </div>
  )
}
