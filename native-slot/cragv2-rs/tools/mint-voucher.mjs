//! 签发兑换码（CRAGR1）。
//!
//! 用法：
//!   node mint-voucher.mjs --keys <keys.json> --store <vouchers.json> [--count 5] [--term 1y]
//!   node mint-voucher.mjs ... --revoke <兑换码>
//!   node mint-voucher.mjs ... --list
//!
//! 码本身不携带信息（32 字节随机数），有效期与绑定关系都在 store 里，
//! 因此可以随时吊销、查看绑定到哪台机器。

import { mintVoucher, openStore, TERMS } from './license-authority.mjs'

const flag = (name, fallback = '') => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback
}
const storeFile = flag('store', process.env.CRAG_VOUCHER_STORE || '')
if (!storeFile) {
  console.error('用法: mint-voucher.mjs --store <vouchers.json> [--count N] [--term 1y] [--list] [--revoke CODE]')
  process.exit(2)
}
const store = openStore(storeFile)
const data = store.read()
const now = Math.floor(Date.now() / 1000)

if (process.argv.includes('--list')) {
  const rows = Object.entries(data.vouchers)
  console.log(`共 ${rows.length} 个兑换码`)
  for (const [code, v] of rows) {
    const state = v.revoked ? '已吊销' : v.machine_id_hash ? `已绑定 ${v.vm_id}` : '未使用'
    console.log(`  ${code.slice(0, 20)}…  ${v.term}  ${state}  签发于 ${new Date(v.created_at * 1000).toISOString().slice(0, 10)}`)
  }
  process.exit(0)
}

const revoke = flag('revoke')
if (revoke) {
  if (!data.vouchers[revoke]) {
    console.error('没有这个兑换码')
    process.exit(1)
  }
  data.vouchers[revoke].revoked = now
  store.write(data)
  console.log('已吊销')
  process.exit(0)
}

const term = flag('term', '1y')
if (!TERMS[term]) {
  console.error(`term 只能是 ${Object.keys(TERMS).join('/')}`)
  process.exit(2)
}
const count = Math.max(1, Math.min(100, Number(flag('count', '1')) || 1))
for (let i = 0; i < count; i += 1) {
  const { code } = mintVoucher(term)
  data.vouchers[code] = { term, created_at: now, revoked: 0 }
  console.log(code)
}
store.write(data)
console.error(`[mint] 已写入 ${count} 个（term=${term}）到 ${storeFile}`)
