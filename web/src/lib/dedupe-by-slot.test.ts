import type { Vm } from '@/types/panel-vm'
import { describe, expect, it } from 'vitest'
import { dedupeBySlot } from './vm-usage'

describe('dedupeBySlot', () => {
  it('keeps one row per reused slot id, preferring the bound account', () => {
    const byId = new Map<string, Vm>([
      ['vm-02', { id: 'vm-02', account_uuid: 'new' } as Vm],
    ])
    const rows = [
      { account_id: 'old', vm_id: 'vm-02', total_cost: 9 },
      { account_id: 'a1', vm_id: 'vm-01', total_cost: 5 },
      { account_id: 'new', vm_id: 'vm-02', total_cost: 1 },
      { account_id: 'x', total_cost: 1 },
    ]
    expect(dedupeBySlot(rows, byId).map((r) => r.account_id)).toEqual([
      'new',
      'a1',
      'x',
    ])
  })

  it('keeps the first row when no row matches the bound account', () => {
    const rows = [
      { account_id: 'a', vm_id: 'vm-09', total_cost: 2 },
      { account_id: 'b', vm_id: 'vm-09', total_cost: 1 },
    ]
    expect(dedupeBySlot(rows, new Map()).map((r) => r.account_id)).toEqual([
      'a',
    ])
  })
})
