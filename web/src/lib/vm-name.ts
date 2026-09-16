import type { Vm } from '@/types/panel-vm'

/** 从 `vm-07` / `07` / `7` 里解析出序号，解析不出返回 null。对齐 index.html `parseVmNum`。 */
export function parseVmNum(s: string | null | undefined): number | null {
  const x = String(s || '')
  const m = x.match(/^vm-(\d+)$/i) || x.match(/^0*(\d+)$/)
  return m ? Number(m[1]) : null
}

/** 序号转两位名称：7 → "07"。对齐 index.html `vmNameOf`。 */
export function vmNameOf(n: number): string {
  return String(n).padStart(2, '0')
}

/** 下一个未被占用的槽位序号。对齐 index.html `nextVmSeq`。 */
export function nextVmSeq(vms: Vm[]): number {
  const used = new Set<number>()
  for (const v of vms) {
    const n = parseVmNum(v.name) ?? parseVmNum(v.id)
    if (n) used.add(n)
  }
  let i = 1
  while (used.has(i)) i += 1
  return i
}

/**
 * 由名称派生槽位 id：纯数字名走 `vm-NN`，否则清洗掉非法字符。
 * 对齐 index.html `vmIdOf`。
 */
export function vmIdOf(name: string): string {
  const n = parseVmNum(name)
  if (n) return 'vm-' + String(n).padStart(2, '0')
  return String(name || '').replace(/[^a-zA-Z0-9_-]/g, '')
}
