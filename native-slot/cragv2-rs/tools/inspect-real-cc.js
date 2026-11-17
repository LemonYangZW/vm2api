// 只读探针：从现网 kin.db 的 request_log_debug 里提取**真实 cli-node 出站请求**的结构特征。
// 只打印：字段名、system 块的 billing/身份行、betas、tools 名、max_tokens、thinking、
// header 键与关键值（凭据类一律脱敏）。绝不打印 messages 对话内容。
const { DatabaseSync } = require('node:sqlite')

const db = new DatabaseSync('/opt/vm2api/data/kin.db', { readOnly: true })
const rows = db.prepare('SELECT record_json FROM request_log_debug ORDER BY rowid DESC LIMIT 40').all()

let picked = null
for (const r of rows) {
  let rec
  try {
    rec = JSON.parse(r.record_json)
  } catch {
    continue
  }
  if (rec.outbound_body && rec.stream === true) {
    picked = rec
    break
  }
}
if (!picked) {
  console.log('(no record with outbound_body + stream=true in last 40)')
  process.exit(0)
}

const mask = (key, value) => (/authorization|api-key|token|cookie|secret/i.test(key) ? '***' : String(value).slice(0, 120))

console.log('== 记录元信息 ==')
console.log(
  JSON.stringify({
    ts: picked.ts,
    via: picked.via,
    dataplane: picked.hop_meta && picked.hop_meta.dataplane,
    model: picked.model,
    upstream_model: picked.upstream_model,
    stream: picked.stream,
    status: picked.status,
    protocol: picked.protocol,
    user_agent: picked.user_agent,
    has_tools: picked.has_tools,
  }),
)

console.log('\n== outbound_headers（键 + 脱敏值）==')
const headers = picked.outbound_headers || {}
for (const [k, v] of Object.entries(headers)) console.log(`  ${k}: ${mask(k, v)}`)

let body = picked.outbound_body
if (typeof body === 'string') {
  try {
    body = JSON.parse(body)
  } catch {}
}
if (body && typeof body === 'object') {
  console.log('\n== outbound_body 顶层键 ==')
  console.log('  ' + Object.keys(body).join(', '))
  console.log('\n== 关键字段 ==')
  console.log(
    '  model=' + body.model,
    'max_tokens=' + body.max_tokens,
    'stream=' + body.stream,
    'thinking=' + JSON.stringify(body.thinking || null),
  )
  if (Array.isArray(body.tools)) {
    console.log('  tools(' + body.tools.length + '): ' + body.tools.map((t) => t && t.name).join(', '))
  }
  if (body.metadata) console.log('  metadata keys: ' + Object.keys(body.metadata).join(', '))
  if (Array.isArray(body.system)) {
    console.log('\n== system 块（每块前 160 字符，billing 行原样）==')
    body.system.forEach((b, i) => {
      const text = typeof b === 'string' ? b : b && b.text
      console.log(`  [${i}] ${String(text || '').slice(0, 160).replace(/\n/g, '\\n')}`)
    })
  }
  if (Array.isArray(body.messages)) {
    console.log('\n  messages: ' + body.messages.length + ' 条（内容不打印）')
  }
}
