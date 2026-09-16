import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Vm } from '@/types/panel-vm'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dashboardQueryOptions } from '@/features/overview/queries'
import { vmQueryOptions } from '@/features/vm/queries'

export const CONC_STEPS: [number, string][] = [
  [0, '不限'],
  [1, '1'],
  [2, '2'],
  [4, '4'],
  [8, '8'],
  [16, '16'],
  [20, '20'],
  [32, '32'],
  [64, '64'],
]

export const RPM_STEPS: [number, string][] = [
  [0, '不限制'],
  [10, '10'],
  [15, '15'],
  [20, '20'],
  [30, '30'],
  [60, '60'],
  [120, '120'],
]

/** Keeps an off-step server value selectable instead of snapping it away. */
function withCurrent(steps: [number, string][], cur: number) {
  if (steps.some(([v]) => v === cur)) return steps
  return [...steps, [cur, String(cur)] as [number, string]].sort(
    (a, b) => a[0] - b[0]
  )
}

/** Mirrors index.html's defaultConc: an unset slot inherits its tier's ceiling. */
function tierConc(tiers: unknown, tier?: string): number {
  const map = (tiers || {}) as Record<string, { max_concurrency?: number }>
  const key = tier === 'pro' || tier === 'max' ? tier : 'default'
  const n = Number(map[key]?.max_concurrency ?? map.default?.max_concurrency)
  return Number.isFinite(n) && n >= 0 ? n : 2
}

export function ConcRpmEditor({ vm }: { vm: Vm }) {
  const qc = useQueryClient()
  const dash = useQuery(dashboardQueryOptions())
  const [open, setOpen] = useState(false)
  const tiers = dash.data?.routing?.tiers
  // never default to 0 — that is "unlimited", not "unset"
  const curConc = Number(
    vm.max_concurrency ?? tierConc(tiers, String(vm.account_tier || ''))
  )
  const curRpm = Number(vm.max_rpm ?? 0)
  const [conc, setConc] = useState(String(curConc))
  const [rpm, setRpm] = useState(String(curRpm))

  const save = useMutation({
    mutationFn: () =>
      api(`/api/panel/vms/${encodeURIComponent(vm.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          max_concurrency: Number(conc),
          max_rpm: Number(rpm),
        }),
      }),
    onSuccess: () => {
      toast.success('并发 / RPM 已热更新')
      qc.invalidateQueries({ queryKey: vmQueryOptions(vm.id).queryKey })
      qc.invalidateQueries({ queryKey: dashboardQueryOptions().queryKey })
      setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message || '更新失败'),
  })

  return (
    <>
      <Button
        size='sm'
        variant='ghost'
        className='h-6 px-2 text-xs'
        onClick={() => {
          setConc(String(curConc))
          setRpm(String(curRpm))
          setOpen(true)
        }}
      >
        编辑
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!save.isPending) setOpen(v)
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>并发 / RPM</DialogTitle>
            <DialogDescription>
              热更新，不进容器。RPM 打满时排队，不会切号。
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='vm-conc'>并发上限</Label>
              <Select
                value={conc}
                onValueChange={setConc}
                disabled={save.isPending}
              >
                <SelectTrigger id='vm-conc'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {withCurrent(CONC_STEPS, curConc).map(([v, l]) => (
                    <SelectItem key={v} value={String(v)}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='vm-rpm'>RPM 上限</Label>
              <Select
                value={rpm}
                onValueChange={setRpm}
                disabled={save.isPending}
              >
                <SelectTrigger id='vm-rpm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {withCurrent(RPM_STEPS, curRpm).map(([v, l]) => (
                    <SelectItem key={v} value={String(v)}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              size='sm'
              variant='outline'
              disabled={save.isPending}
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button
              size='sm'
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
