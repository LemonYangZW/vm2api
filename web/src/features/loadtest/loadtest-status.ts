import type { StatusTone } from '@/types/status'

/**
 * 会话/研报/探针共用的运行状态色，镜像 index.html `ltStatus()`。
 * `StatusMark` 只认 ok/caution/warn/bad/none/off 六个 cls，
 * 这里把 index.html 的 run/wait 归并进去（running/cancelling→warn，其余排队态→none）。
 */
export function loadtestStatusTone(status: unknown): StatusTone {
  const s = String(status || '')
  if (s === 'ok') return { key: 'ok', text: '成功', cls: 'ok' }
  if (s === 'error') return { key: 'error', text: '失败', cls: 'bad' }
  if (s === 'running') return { key: 'running', text: '进行中', cls: 'warn' }
  if (s === 'cancelling')
    return { key: 'cancelling', text: '取消中', cls: 'warn' }
  if (s === 'cancelled')
    return { key: 'cancelled', text: '已取消', cls: 'none' }
  return { key: 'pending', text: '排队', cls: 'none' }
}
