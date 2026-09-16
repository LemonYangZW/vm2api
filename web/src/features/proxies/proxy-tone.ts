import type { Vm, VmProxySnap } from '@/types/panel-vm'
import { proxyIsInvalid } from '@/features/proxies/proxy-sort'

/** 高延迟阈值。超过就用警告黄，即使探测状态仍是 ok。 */
export const PROXY_LATENCY_WARN_MS = 300

export type ProxyFieldTone = 'ok' | 'caution' | 'danger' | 'none'

export function proxyLatencyTone(proxy: VmProxySnap): ProxyFieldTone {
  if (proxyIsInvalid(proxy)) return 'danger'
  if (proxy.latency_ms != null && proxy.latency_ms > PROXY_LATENCY_WARN_MS) {
    return 'caution'
  }
  if (proxy.status === 'ok') return 'ok'
  return 'none'
}

/** 槽位上的代理底色：有票无代理是 fail closed，不是「直连」。 */
export function vmProxyTone(
  vm: Pick<Vm, 'has_token' | 'proxy' | 'proxy_id'>
): ProxyFieldTone {
  if (!vm.proxy?.host && !vm.proxy_id) {
    return vm.has_token ? 'danger' : 'none'
  }
  return proxyLatencyTone(vm.proxy ?? {})
}

export function proxyFieldClass(tone: ProxyFieldTone): string {
  switch (tone) {
    case 'ok':
      return 'text-ok-3'
    case 'caution':
      return 'text-caution-3'
    case 'danger':
      return 'text-red-3'
    default:
      return 'text-muted-foreground'
  }
}

export function proxySurfaceClass(tone: ProxyFieldTone): string {
  switch (tone) {
    case 'ok':
      return 'bg-ok-1 text-ok-5'
    case 'caution':
      return 'bg-caution-1 text-caution-5'
    case 'danger':
      return 'bg-red-1 text-red-5'
    default:
      return 'text-muted-foreground'
  }
}
