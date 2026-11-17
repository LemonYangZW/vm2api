// 验证会话守卫：伪造一个属于别的会话的 tool_use_id，续跳必须回 409（而不是笼统 410 或空跑）。
import net from 'node:net'
const SOCK = process.argv[2] || '/run/crag.sock'
const SID = 'aa11bb22-3333-4444-8888-999999999999'

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? Buffer.from(JSON.stringify(payload)) : null
    const head = `${payload ? 'POST' : 'GET'} ${path} HTTP/1.1\r\nHost: x\r\n` +
      (body ? `Content-Type: application/json\r\nContent-Length: ${body.length}\r\n` : '') +
      'Connection: close\r\n\r\n'
    const s = net.connect(SOCK)
    let raw = ''
    s.on('connect', () => { s.write(head); if (body) s.write(body) })
    s.on('data', (c) => (raw += c.toString('utf8')))
    s.on('close', () => resolve(raw))
    s.on('error', reject)
  })
}
const head = (raw) => raw.split('\r\n')[0]
const env = (body) => ({ request_id: `g${Date.now()}`, stream: true, headers: { 'x-claude-code-session-id': SID }, body: { model: 'claude-haiku-5-5', stream: true, ...body } })

// 1) 建会话（唯一一次真实请求）
const warm = await post('/internal/v1/messages', env({
  max_tokens: 32,
  messages: [{ role: 'user', content: [{ type: 'text', text: 'reply with the single word PING' }] }],
}))
console.log('warm hop      :', head(warm))

// 2) 伪造外来 tool id 的续跳（不发上游）
const forged = await post('/internal/v1/messages', env({
  max_tokens: 32,
  messages: [
    { role: 'user', content: [{ type: 'text', text: 'reply with the single word PING' }] },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'crag_tool_deadbeef_other', name: 'x', input: {} }] },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'crag_tool_deadbeef_other', content: 'y' }] },
  ],
}))
const status = head(forged)
console.log('foreign id    :', status, status.includes('409') ? '✅ 409 session mismatch' : '❌ 期望 409')

// 3) 完全未知的 id（本会话标签但不存在的 uuid）→ 期望 410
const unknown = await post('/internal/v1/messages', env({
  max_tokens: 32,
  messages: [
    { role: 'user', content: [{ type: 'text', text: 'reply with the single word PING' }] },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'crag_tool_xxxxxxxx_dead', name: 'x', input: {} }] },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'crag_tool_xxxxxxxx_dead', content: 'y' }] },
  ],
}))
const s2 = head(unknown)
console.log('foreign tag2  :', s2, s2.includes('409') ? '✅ 409' : '(非 409)')
