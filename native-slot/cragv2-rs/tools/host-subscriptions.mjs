//! 宿主席位（订阅）接口：面板 `createCragSubscription` 会打
//! `POST {origin}/v1/host-subscriptions/<action>`，带 `authorization: Bearer <credential>`。
//!
//! 我们只实现真正用到的那些动作，其余返回 501：
//! - `status`：返回当前宿主席位授权与已用名额 → 面板算出 `available_seats`
//! - `redeem`：把兑换码绑成宿主授权（可选，一般用离线写入）
//!
//! 账单/购买类动作（create/quote/...）不在自建范围内。

import fs from 'node:fs'
import { loadAuthority } from './license-authority.mjs'

const ACTIONS = new Set(['status', 'redeem', 'refresh', 'release'])

/** 从磁盘读一张已写入的宿主授权（public/entitlement.code）。 */
export function readHostEntitlement(file) {
  const code = fs.readFileSync(file, 'utf8').trim()
  if (!code.startsWith('CRAGH1.') && !code.startsWith('CRAGH2.')) throw new Error('不是宿主授权码')
  const claims = JSON.parse(Buffer.from(code.split('.')[1], 'base64url').toString('utf8'))
  return { code, claims }
}

/**
 * 处理一个 host-subscriptions 请求。
 * `usedSlots` 由调用方决定（我们是自建授权，默认 0；可传函数按需统计）。
 */
export function handleHostSubscription({ action, body, entitlementFile, usedSlots = () => 0, log = console.log }) {
  if (!ACTIONS.has(action)) return { status: 404, body: { ok: false, error: { code: 'not_found', message: 'not_found' } } }
  const { code, claims } = readHostEntitlement(entitlementFile)
  const hostId = String(body?.host_id || '')
  if (hostId && hostId !== claims.host_id)
    return { status: 409, body: { ok: false, error: { code: 'host_binding_conflict', message: 'host_binding_conflict' } } }

  if (action === 'status' || action === 'refresh') {
    const used = Math.max(0, Math.min(Number(usedSlots()) || 0, claims.slot_limit))
    log(`[host] ${action} host=${hostId.slice(0, 12)}… used=${used}/${claims.slot_limit}`)
    return {
      status: 200,
      body: {
        ok: true,
        data: {
          entitlement: code,
          revision: claims.revision,
          expires_at: claims.expires_at,
          issued_at: claims.issued_at,
          used_slots: used,
          available_slots: claims.slot_limit - used,
          reclaim_supported: claims.version === 2,
        },
      },
    }
  }
  // redeem/release：自建模式下不通过接口改授权，统一提示用离线方式。
  return { status: 404, body: { ok: false, error: { code: 'redeem_unavailable', message: 'redeem_unavailable' } } }
}

export { loadAuthority }
