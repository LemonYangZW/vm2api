import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { dashboardQueryOptions } from '@/features/overview/queries'
import { vmQueryOptions } from '@/features/vm/queries'

export function SchedulableSwitch({
  vmId,
  schedulable,
  className,
}: {
  vmId: string
  schedulable: boolean
  className?: string
}) {
  const qc = useQueryClient()
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const checked = optimistic ?? schedulable
  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      api(`/api/panel/vms/${encodeURIComponent(vmId)}/schedulable`, {
        method: 'POST',
        body: JSON.stringify({ schedulable: next }),
      }),
    onMutate: (next) => setOptimistic(next),
    onSuccess: async (_data, next) => {
      toast.success(next ? '已开启调度' : '已关闭调度')
      await qc.invalidateQueries({ queryKey: dashboardQueryOptions().queryKey })
      await qc.invalidateQueries({ queryKey: vmQueryOptions(vmId).queryKey })
    },
    onError: (error: Error) => {
      setOptimistic(null)
      toast.error(error.message)
    },
    onSettled: () => setOptimistic(null),
  })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={className}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Switch
            checked={checked}
            disabled={mutation.isPending}
            onCheckedChange={(next) => mutation.mutate(next)}
            aria-label={checked ? '点击关闭调度' : '点击开启调度'}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {checked ? '点击关闭调度' : '点击开启调度'}
      </TooltipContent>
    </Tooltip>
  )
}
