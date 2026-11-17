//! 测试辅助（非生产路径）。
//!
//! 生产镜像里没有 Node（crag v2 是纯 native），因此假 CLI 优先用
//! `testdata/fake-cli.sh`，只有在没有 `sh` 的平台（Windows 本机）才回退到 node。

/// 返回一个可以驱动槽位帧协议的假 CLI 命令。
pub fn fake_cli_command() -> Vec<String> {
    let script = std::path::Path::new("testdata/fake-cli.sh");
    if script.exists() && std::path::Path::new("/bin/sh").exists() {
        return vec!["/bin/sh".to_string(), script.display().to_string()];
    }
    vec![
        "node".to_string(),
        "-e".to_string(),
        NODE_SCRIPT.to_string(),
    ]
}

const NODE_SCRIPT: &str = r#"
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  let f; try { f = JSON.parse(line) } catch { return }
  if (f.type !== 'user') return;
  const send = (o) => process.stdout.write(JSON.stringify(o) + '\n');
  send({ type: 'stream_event', session_id: f.session_id, event: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } } });
  send({ type: 'stream_event', session_id: f.session_id, event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'pong' } } });
  send({ type: 'stream_event', session_id: f.session_id, event: { type: 'content_block_stop', index: 0 } });
  send({ type: 'stream_event', session_id: f.session_id, event: { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { input_tokens: 3, output_tokens: 1 } } });
  send({ type: 'result', subtype: 'success', is_error: false, session_id: f.session_id, stop_reason: 'end_turn', result: 'pong', usage: { input_tokens: 3, output_tokens: 1 } });
});
"#;
