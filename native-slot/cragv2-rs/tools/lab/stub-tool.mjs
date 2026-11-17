// 离线驱动工具链路：首次请求回 tool_use，看到该 tool_use 的结果后再回文本。
// 用一次性 id，避免 CC 把历史一起重发时误判（TUI 每轮都带整段上下文）。
import http from 'node:http'
const TOOL_ID = 'toolu_stub_' + Date.now().toString(36)
const ev = (t, d) => `event: ${t}\ndata: ${JSON.stringify(d)}\n\n`
http.createServer((req, res) => {
  const chunks = []
  req.on('data', (d) => chunks.push(d))
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8')
    if (!String(req.url).startsWith('/v1/messages')) {
      res.writeHead(404, { 'content-type': 'application/json' }); res.end('{"data":[]}'); return
    }
    let body = {}
    try { body = JSON.parse(raw || '{}') } catch {}
    const done = JSON.stringify(body.messages || []).includes('TIME=')
    const model = body.model || 'claude-sonnet-5-5'
    const msg = { id: 'msg_stub', type: 'message', role: 'assistant', model, content: [], stop_reason: null, usage: { input_tokens: 3, output_tokens: 2 } }
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
    let out = ev('message_start', { type: 'message_start', message: msg })
    if (!done) {
      out += ev('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: TOOL_ID, name: 'get_time', input: {} } })
      out += ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{}' } })
      out += ev('content_block_stop', { type: 'content_block_stop', index: 0 })
      out += ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'tool_use' }, usage: { output_tokens: 2 } })
    } else {
      const all = JSON.stringify(body.messages)
      const found = all.split('TIME=')[1] ? 'TIME=' + all.split('TIME=')[1].split('"')[0] : 'TIME=missing'
      const text = '工具返回: ' + found[0]
      out += ev('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })
      out += ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } })
      out += ev('content_block_stop', { type: 'content_block_stop', index: 0 })
      out += ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 2 } })
    }
    out += ev('message_stop', { type: 'message_stop' })
    res.end(out)
  })
}).listen(18083, '0.0.0.0', () => console.log('stub-tool on 18083 id=' + TOOL_ID))
