// 验证 health.active 跟随在途 hop（1 次真实请求）
import net from 'node:net'
const SOCK = process.argv[2] || '/run/crag.sock'
const SID = 'cc33dd44-5555-6666-9999-bbbbbbbbbbbb'
function call(path, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? Buffer.from(JSON.stringify(payload)) : null
    const head = `${payload ? 'POST' : 'GET'} ${path} HTTP/1.1\r\nHost: x\r\n` +
      (body ? `Content-Type: application/json\r\nContent-Length: ${body.length}\r\n` : '') + 'Connection: close\r\n\r\n'
    const s = net.connect(SOCK); let raw = ''
    s.on('connect', () => { s.write(head); if (body) s.write(body) })
    s.on('data', (c) => (raw += c.toString('utf8')))
    s.on('close', () => resolve(raw)); s.on('error', reject)
  })
}
const health = async () => { const r = await call('/internal/health'); return JSON.parse(r.split('\r\n\r\n')[1]) }
const hop = call('/internal/v1/messages', {
  request_id: 'inflight1', stream: true, headers: { 'x-claude-code-session-id': SID },
  body: { model: 'claude-haiku-5-5', stream: true, max_tokens: 64,
    messages: [{ role: 'user', content: [{ type: 'text', text: 'Write the numbers 1 to 15 separated by commas.' }] }] },
})
const before = await health()
await new Promise((r) => setTimeout(r, 700))
const during = await health()
await hop
await new Promise((r) => setTimeout(r, 300))
const after = await health()
console.log('before :', JSON.stringify({ active: before.active, waiting: before.waiting, queued: before.queued }))
console.log('during :', JSON.stringify({ active: during.active, waiting: during.waiting, queued: during.queued }))
console.log('after  :', JSON.stringify({ active: after.active, waiting: after.waiting, queued: after.queued }))
console.log(during.active > 0 ? '✅ active 随在途 hop 变化' : '❌ active 未反映在途')
