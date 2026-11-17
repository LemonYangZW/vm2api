import net from 'node:net'
const SOCK = process.argv[2] || '/run/crag.sock'
const SID = 'ab12cd34-' + Date.now()
const TOOLS = [{ name: 'get_time', description: 'Return the current server time string.', input_schema: { type: 'object', properties: {} } }]
function post(payload) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify(payload))
    const head = `POST /internal/v1/messages HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\nConnection: close\r\n\r\n`
    const s = net.connect(SOCK); let raw = ''
    s.on('connect', () => { s.write(head); s.write(body) })
    s.on('data', (c) => (raw += c.toString('utf8')))
    s.on('close', () => resolve(raw)); s.on('error', reject)
  })
}
const parse = (raw) => {
  const [, body = ''] = raw.split('\r\n\r\n'); const out = []
  for (const block of body.split('\n\n')) {
    const n = (block.match(/^event: (.+)$/m) || [])[1]
    const d = (block.match(/^data: (.+)$/m) || [])[1]
    if (n && d) { try { out.push({ n, d: JSON.parse(d) }) } catch {} }
  }
  return out
}
const texts = (ev) => ev.filter((e) => e.n === 'content_block_delta' && e.d.type === 'tool_use').map((e) => e.d).length
const textOf = (ev) => ev.filter((e) => e.n === 'content_block_delta' && e.d.delta?.type === 'text_delta').map((e) => e.d.delta.text).join('')
const toolUses = (ev) => { const r = []; for (const e of ev) { if (e.n === 'content_block_start' && e.d.content_block?.type === 'tool_use') r.push({ id: e.d.content_block.id, name: e.d.content_block.name }) } return r }
const env = (b) => ({ request_id: `s${Date.now()}`, stream: true, headers: { 'x-claude-code-session-id': SID }, body: { model: 'claude-sonnet-5-5', stream: true, ...b } })

const PROMPT = 'Please look up the available tool that reports the server time (use ToolSearch), call it once, then reply with one sentence quoting the exact string it returned.'
const h1 = await post(env({ max_tokens: 512, tools: TOOLS, messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }] }] }))
const e1 = parse(h1)
console.log('hop1:', h1.split('\r\n')[0], '| tool_use:', JSON.stringify(toolUses(e1)).slice(0, 160))
console.log('hop1 text:', JSON.stringify(textOf(e1)).slice(0, 200))
