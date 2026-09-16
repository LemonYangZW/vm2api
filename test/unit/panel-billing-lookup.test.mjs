import test from 'node:test'
import assert from 'node:assert/strict'
import { indexBillingAccounts, lookupBilling } from '../../src/lib/admin/panel-api.mjs'

test('billing index keeps UUID row when leftover vm-id account is empty', () => {
  const leftover = {
    account_id: 'vm-50',
    vm_id: 'vm-50',
    today_requests: 0,
    today_cache_read_tokens: 0,
    requests: 0,
    today_cost: 0,
  }
  const real = {
    account_id: '7667b68b-3351-4bc9-b06e-39d6795b3019',
    vm_id: 'vm-50',
    today_requests: 243,
    today_cache_read_tokens: 24757802,
    requests: 245,
    today_cost: 24.45,
  }
  const index = indexBillingAccounts({ accounts: [real, leftover] })
  const vm = { id: 'vm-50', account_uuid: real.account_id }
  const leftoverAcc = { account_id: 'vm-50', vm_id: 'vm-50' }
  assert.equal(lookupBilling(index, vm), real)
  assert.equal(lookupBilling(index, leftoverAcc), real)
  assert.equal(lookupBilling(index, { id: 'vm-50' }), real)
})
