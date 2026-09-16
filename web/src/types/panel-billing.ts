export type BillingItem = {
  vm_id?: string | null
  api_key_id?: string | null
  requests: number
  ok: number
  fail: number
  tokens_in: number
  tokens_out: number
  cost_usd: number
}

export type BillingPayload = {
  group_by?: 'vm' | 'key'
  since?: string | null
  until?: string | null
  totals?: BillingItem
  items?: BillingItem[]
}
