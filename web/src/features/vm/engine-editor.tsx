import { useMemo, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { Vm, VmKernelSnapshot } from '@/types/panel-vm'
import { toast } from 'sonner'
import { patchVm } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { dashboardQueryOptions } from '@/features/overview/queries'
import {
  DEFAULT_RESOLVED_ENGINE,
  inferenceEngineLabel,
  inferenceEnginePatchValue,
  normalizeInferenceEngine,
} from '@/features/vm/engine-contract'
import { vmQueryOptions } from '@/features/vm/queries'

export function VmEngineEditor({
  id,
  vm,
  kernel,
}: {
  id: string
  vm: Vm
  kernel?: VmKernelSnapshot | null
}) {
  const qc = useQueryClient()
  const configured = normalizeInferenceEngine(
    kernel?.configured_engine ?? vm.inference_engine,
    'auto'
  )
  const resolved = normalizeInferenceEngine(
    kernel?.resolved_engine ?? vm.resolved_inference_engine,
    DEFAULT_RESOLVED_ENGINE
  )
  const active = normalizeInferenceEngine(
    kernel?.active_engine ?? vm.runtime?.engine,
    resolved
  )
  const inherits = configured === 'auto'
  const status = useMemo(
    () => ({
      configured: inferenceEngineLabel(configured),
      resolved: inferenceEngineLabel(resolved),
      active: inferenceEngineLabel(active),
    }),
    [active, configured, resolved]
  )
  const inherit = useMutation({
    mutationFn: () =>
      patchVm(id, { inference_engine: inferenceEnginePatchValue('auto') }),
    onSuccess: async () => {
      toast.success('推理内核已改为跟随设置 → 协议')
      await Promise.all([
        qc.invalidateQueries({ queryKey: vmQueryOptions(id).queryKey }),
        qc.invalidateQueries({ queryKey: dashboardQueryOptions().queryKey }),
      ])
    },
    onError: (error: Error) =>
      toast.error(`恢复跟随全局失败：${error.message}`),
  })

  return (
    <CardSection title='推理内核'>
      <div className='grid gap-2 text-sm sm:grid-cols-3'>
        <EngineValue label='已配置' value={status.configured} />
        <EngineValue label='解析后' value={status.resolved} />
        <EngineValue label='当前运行' value={status.active} />
      </div>
      <p className='mt-3 text-xs leading-relaxed text-muted-foreground'>
        未显式配置时解析为 rust（wrap cli-hop），跟随{' '}
        <Link
          to='/settings/$tab'
          params={{ tab: 'protocol' }}
          className='underline underline-offset-4'
        >
          设置 → 协议
        </Link>
        。不要把槽切到会启动 Go worker hop 的路径。
      </p>
      {inherits ? null : (
        <Button
          className='mt-3'
          variant='outline'
          disabled={inherit.isPending}
          onClick={() => inherit.mutate()}
        >
          {inherit.isPending ? '恢复中…' : '恢复跟随全局'}
        </Button>
      )}
    </CardSection>
  )
}

function CardSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className='rounded-md border p-4'>
      <h3 className='mb-3 text-sm font-medium'>{title}</h3>
      {children}
    </section>
  )
}

function EngineValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='mt-1 font-medium'>{value}</div>
    </div>
  )
}
