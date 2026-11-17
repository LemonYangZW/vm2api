// 扮演控制面：跳 1 让 CC 调工具（内核回投合成 tool_use），跳 2 带 tool_result 续跳。
import net from 'node:net'
const SOCK = process.argv[2] || '/run/crag.sock'
const SID = '9a1e0000-0000-4000-8000-000000000001'
const TOOLS = [{ name: 'get_time', description: 'Return the current server time string.', input_schema: { type: 'object', properties: {} } }]

function post(payload) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify(payload))
    const head =
      `POST /internal/v1/messages HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\n` +
      `Content-Length: ${body.length}\r\nConnection: close\r\n\r\n`
    const sock = net.connect(SOCK)
    let raw = ''
    sock.on('connect', () => { sock.write(head); sock.write(body) })
    sock.on('data', (c) => (raw += c.toString('utf8')))
    sock.on('close', () => resolve(raw))
    sock.on('error', reject)
  })
}

function parseSse(raw) {
  const [, body = ''] = raw.split('\r\n\r\n')
  const events = []
  for (const block of body.split('\n\n')) {
    const name = (block.match(/^event: (.+)$/m) || [])[1]
    const data = (block.match(/^data: (.+)$/m) || [])[1]
    if (name && data) { try { events.push({ name, data: JSON.parse(data) }) } catch {} }
  }
  return events
}

const head = (raw) => raw.split('\r\n')[0]
const textOf = (events) => events.filter((e) => e.name === 'content_block_delta' && e.data.delta?.type === 'text_delta').map((e) => e.data.delta.text).join('')
const toolUses = (events) => {
  const out = []
  for (const e of events) {
    if (e.name === 'content_block_start' && e.data.content_block?.type === 'tool_use') out.push({ id: e.data.content_block.id, name: e.data.content_block.name, json: '' })
    if (e.name === 'content_block_delta' && e.data.delta?.type === 'input_json_delta' && out.length) out[out.length - 1].json += e.data.delta.partial_json
  }
  return out
}

const envelope = (body) => ({ request_id: `r${Date.now()}`, stream: true, headers: { 'x-claude-code-session-id': SID }, body: { model: 'claude-haiku-5-5', stream: true, ...body } })

const hop1 = await post(envelope({
  max_tokens: 256,
  tools: TOOLS,
  messages: [{ role: 'user', content: [{ type: 'text', text: 'You MUST call the get_time tool before answering. Then tell me exactly what time string it returned.' }] }],
}))
const ev1 = parseSse(hop1)
const calls = toolUses(ev1)
console.log('hop1          :', head(hop1), '| events:', ev1.length, '| text:', JSON.stringify(textOf(ev1)))
console.log('hop1 tool_use :', JSON.stringify(calls))

if (!calls.length) { console.log('❌ 没有回投 tool_use（工具链路未生效）'); process.exit(1) }

const result = 'TIME=2026-11-16T09:00:00Z'
const hop2 = await post(envelope({
  max_tokens: 256,
  tools: TOOLS,
  messages: [
    { role: 'user', content: [{ type: 'text', text: 'You MUST call the get_time tool before answering. Then tell me exactly what time string it returned.' }] },
    { role: 'assistant', content: calls.map((c) => ({ type: 'tool_use', id: c.id, name: c.name, input: (() => { try { return c.json ? JSON.parse(c.json) : {} } catch { return {} } })() })) },
    { role: 'user', content: calls.map((c) => ({ type: 'tool_result', tool_use_id: c.id, content: result })) },
  ],
}))
const ev2 = parseSse(hop2)
console.log('hop2          :', head(hop2), '| events:', ev2.length)
console.log('hop2 text     :', JSON.stringify(textOf(ev2)))
console.log('hop2 含结果   :', textOf(ev2).includes('2026-11-16T09:00:00Z') ? '✅ 是' : '❌ 否')
