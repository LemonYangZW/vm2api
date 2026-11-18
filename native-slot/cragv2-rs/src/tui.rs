//! TUI 通路（vendor 的 `transport: "tui"`）。
//!
//! 与 `native`（print/stream-json）的区别只有"怎么驱动"：
//! TUI 走 PTY，官方 CLI 以为自己在跟真人交互，因此出站请求带的是
//! `cc_entrypoint=cli` 与完整的 `safeguards` 块 —— 与真实安装**同形**。
//!
//! 内核侧只做三件事：喂一个 prompt（bracketed paste + `\r`）、读屏幕判就绪、
//! 从 tap 文件里把**上游真实 SSE**按序回投。请求体仍然一个字节都不碰。
//!
//! 真值：`docs/GAP_IMPL_SPEC.md` §4（契约）与 §4.7（实测）。

use std::sync::{Mutex, OnceLock};
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde_json::Value;

/// `transport` 取值。
pub const TRANSPORT: &str = "tui";

/// 屏幕上限（vendor 同值）。
pub const MAX_SCREEN_BYTES: usize = 32 * 1024;
/// 就绪判定的静默窗口：出现 `❯` 后再等这么久没有新拒绝信号才确认。
pub const READY_DEBOUNCE: Duration = Duration::from_millis(500);
/// tap / transcript 轮询间隔。
pub const POLL: Duration = Duration::from_millis(40);
/// Gap between bracketed paste and the submit key.
/// Measured: 40ms makes the CLI swallow the CR (text stays in the composer);
/// 300ms is stable because Bun renders one frame for the paste.
pub const PASTE_GAP: Duration = Duration::from_millis(1000);

/// 极简 tap：把主对话的 SSE 原样 tee 到 `CRAG_TUI_TAP`（JSONL）。
///
/// 我们自己写而不是内嵌 vendor 的版本：只保留"tee + 三旋钮改写"两件事，
/// 行为可控，也避免把整份第三方脚本塞进二进制。
pub const TAP_JS: &str = r#"import fs from "node:fs";
(() => {
  const file = process.env.CRAG_TUI_TAP || "";
  if (!file) return;
  const MAX = Number(process.env.CRAG_TUI_MAX_TOKENS || 0) || 0;
  const EFFORT = process.env.CRAG_TUI_EFFORT || "";
  const TTL = process.env.CRAG_TUI_CACHE_TTL || "";
  let fd = null;
  try { fd = fs.openSync(file, "a", 0o600); } catch (e) {}
  const put = (v) => { if (fd == null) return; try { fs.writeSync(fd, JSON.stringify(v) + "\n"); } catch (e) {} };

  const rewrite = (raw) => {
    if (typeof raw !== "string") return raw;
    let next = raw;
    if (MAX > 0) next = next.replace(/"max_tokens"\s*:\s*\d+/, '"max_tokens":' + MAX);
    if (EFFORT) {
      if (/"effort"\s*:\s*"[^"]*"/.test(next)) next = next.replace(/"effort"\s*:\s*"[^"]*"/, '"effort":"' + EFFORT + '"');
      else if (/"output_config"\s*:\s*\{/.test(next)) next = next.replace(/"output_config"\s*:\s*\{/, '"output_config":{"effort":"' + EFFORT + '",');
      else next = next.replace(/\{/, '{"output_config":{"effort":"' + EFFORT + '"},');
    }
    if (TTL) next = next.replace(/"ttl"\s*:\s*"1h"/g, '"ttl":"' + TTL + '"');
    return next;
  };
  let currentBody = null;
  const prepare = (input, init) => {
    if (init && typeof init.body === "string") {
      const body = rewrite(init.body);
      lastMeta = meta(body);
      // 没有覆盖时原样放行：把 init/Request 摊平成普通对象会让底层发出畸形请求
      // （实测中转直接回 429），因此只在真的改写时才替换。
      if (body === init.body) return [input, init];
      return [input, { ...init, body }];
    }
    if (!init && input && typeof input === "object" && typeof input.body === "string") {
      const body = rewrite(input.body);
      lastMeta = meta(body);
      if (body === input.body) return [input, init];
      return [{ ...input, body }, init];
    }
    return [input, init];
  };

  const parsePacket = (id, packet) => {
    const data = packet.split("\n").filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, "")).join("\n");
    if (!data) return;
    let event;
    try { event = JSON.parse(data); } catch (e) { return; }
    if (event && event.type !== "ping") put({ s: id, e: event });
  };
  const drain = async (id, body) => {
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      for await (const chunk of body) {
        buffer = (buffer + decoder.decode(chunk, { stream: true })).replace(/\r\n?/g, "\n");
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          parsePacket(id, buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
        }
      }
      if (buffer.trim()) parsePacket(id, buffer);
      put({ s: id, end: "done" });
    } catch (e) { put({ s: id, end: "cut" }); }
  };

  let seq = 0;
  let lastMeta = { max_tokens: 0, tools: 0, msgs: 0 };
  const maybeCapture = (response) => {
    try {
      if (!response || !response.body) return response;
      const ct = (response.headers && response.headers.get("content-type")) || "";
      if (!/text\/event-stream/.test(ct)) return response;
      const id = ++seq;
      put({ s: id, open: true, meta: lastMeta });
      // 直通观察：单读一遍、原样下发。tee() 会分流响应体，实测会让 CC 侧
      // 看到不完整的流（重试/最终 "Unable to connect"）。
      const decoding = new TextDecoder();
      let buffer = "";
      const feed = (text, flush) => {
        buffer = (buffer + text).replace(/\r\n?/g, "\n");
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          parsePacket(id, buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
        }
        if (flush && buffer.trim()) parsePacket(id, buffer);
      };
      const tap = new TransformStream({
        transform(chunk, controller) {
          try { feed(decoding.decode(chunk, { stream: true }), false); } catch (e) {}
          controller.enqueue(chunk);
        },
        flush() {
          try { feed(decoding.decode(), true); } catch (e) {}
          put({ s: id, end: "done" });
        },
      });
      Object.defineProperty(response, "body", {
        value: response.body.pipeThrough(tap),
        configurable: true,
      });
    } catch (e) {}
    return response;
  };

  const FetchSession = globalThis.Bun && Bun.FetchSession;
  if (typeof FetchSession === "function") {
    class CragFetchSession extends FetchSession {
      async fetch(input, init) {
        const [i2, n2] = prepare(input, init);
        return maybeCapture(await super.fetch(i2, n2));
      }
    }
    try {
      Bun.FetchSession = CragFetchSession;
      put({ tap: Bun.FetchSession === CragFetchSession ? "on" : "none", mode: "fetch_session" });
    } catch (e) { put({ tap: "none" }); }
    return;
  }
  const real = globalThis.fetch;
  if (typeof real !== "function") { put({ tap: "none" }); return; }
  globalThis.fetch = async (input, init) => {
    const [i2, n2] = prepare(input, init);
    return maybeCapture(await real(i2, n2));
  };
  put({ tap: "on", mode: "global_fetch" });
})();
"#;

/// 把 `"autoUpdates": false` 合并进 `~/.claude/settings.json`（官方设置键，不是伪造特征）。
pub fn ensure_auto_updates_off() {
    let home = match std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE")) {
        Ok(home) => home,
        Err(_) => return,
    };
    let dir = std::path::Path::new(&home).join(".claude");
    let path = dir.join("settings.json");
    let mut config: Value = std::fs::read_to_string(&path)
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_else(|| serde_json::json!({}));
    if config.get("autoUpdates").and_then(|v| v.as_bool()) == Some(false) {
        return;
    }
    if let Some(object) = config.as_object_mut() {
        object.insert("autoUpdates".into(), Value::Bool(false));
        // 官方支持的环境变量阀门；实测 2.1.321 之后单靠 autoUpdates 拦不住自更新，
        // 会真的把 versions/ 换成新版本并挂 "Restart to update" 横幅。
        let env = object
            .entry("env")
            .or_insert_with(|| Value::Object(Default::default()));
        if let Some(env) = env.as_object_mut() {
            env.insert("DISABLE_AUTOUPDATER".into(), Value::String("1".into()));
        }
    } else {
        return;
    }
    let _ = std::fs::create_dir_all(&dir);
    if let Ok(text) = serde_json::to_vec_pretty(&config) {
        let _ = std::fs::write(&path, text);
    }
}


/// 由 CLI 参数里的 `--session-id` 推出 transcript 路径。
fn transcript_of_args(host: &crate::native::Host, args: &[String]) -> Option<PathBuf> {
    let home = std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE")).ok()?;
    let session = args
        .iter()
        .position(|a| a == "--session-id")
        .and_then(|i| args.get(i + 1))?;
    Some(transcript_path(
        &Path::new(&home).join(".claude"),
        &host.cwd,
        session,
    ))
}


/// 若某行是「最终回答」，返回它的 `message`。
///
/// 判定口径（计数与取答案共用一份，避免两套口径不一致导致
/// "计数增加了但取不到新答案"）：`stop_reason` 已定、不是 `tool_use`、
/// `content` 里没有 `tool_use` 块、且至少有一个 `text` 块。
fn answer_message(row: &Value) -> Option<&Value> {
    if row.get("type").and_then(|v| v.as_str()) != Some("assistant") {
        return None;
    }
    let message = row.get("message")?;
    if message.get("stop_reason").map(|v| v.is_null()).unwrap_or(true) {
        return None;
    }
    if message.get("stop_reason").and_then(|v| v.as_str()) == Some("tool_use") {
        return None;
    }
    let blocks = message.get("content")?.as_array()?;
    let mut has_text = false;
    for block in blocks {
        match block.get("type").and_then(|v| v.as_str()) {
            Some("tool_use") => return None,
            Some("text") => has_text = true,
            _ => {}
        }
    }
    has_text.then_some(message)
}

/// transcript 增量扫描状态：JSONL 只追加，因此每次只需读新增字节。
struct TailScan {
    offset: u64,
    /// 上次读到的、尚未以换行结尾的残行。
    carry: String,
    /// 合格回答数（口径见 [`answer_message`]）。
    answers: usize,
    /// 已收尾的 assistant 行数（`stop_reason` 已定且非 `tool_use`）。
    finished: usize,
    /// 扫描过程中见到的**最后一条**合格回答。
    ///
    /// 这样 `transcript_answer_file` 不需要再读文件，也就不会出现
    /// "从尾部读固定窗口 → 窗口里没有完整候选行 / 回答离尾部很远 → 漏信息"。
    last_answer: Option<Value>,
    touched: std::time::Instant,
}

impl Default for TailScan {
    fn default() -> Self {
        Self {
            offset: 0,
            carry: String::new(),
            answers: 0,
            finished: 0,
            last_answer: None,
            touched: std::time::Instant::now(),
        }
    }
}

fn tails() -> &'static Mutex<HashMap<std::path::PathBuf, TailScan>> {
    static TAILS: OnceLock<Mutex<HashMap<std::path::PathBuf, TailScan>>> = OnceLock::new();
    TAILS.get_or_init(|| Mutex::new(HashMap::new()))
}

/// 缓存条目上限：每个 transcript 只留一条回答，但会话可能很多，仍需上限。
const TAIL_CACHE_MAX: usize = 64;
/// 超过这个时间没被轮询的条目视为会话已结束，直接丢弃。
const TAIL_CACHE_IDLE: Duration = Duration::from_secs(3600);

/// 丢弃某个 transcript 的增量缓存（会话被摘除/文件轮转时调用）。
pub fn forget_transcript(file: &Path) {
    tails()
        .lock()
        .unwrap_or_else(|poison| poison.into_inner())
        .remove(file);
}

/// 单行记账：一次解析同时更新两个计数与最后一条合格回答。
fn tally_line(line: &str, state: &mut TailScan) {
    // 便宜的前置过滤：绝大多数行与 assistant 无关。
    if !line.contains("assistant") {
        return;
    }
    let Ok(row) = serde_json::from_str::<Value>(line) else {
        return;
    };
    if row.get("type").and_then(|v| v.as_str()) != Some("assistant") {
        return;
    }
    let Some(message) = row.get("message") else {
        return;
    };
    let stop = message
        .get("stop_reason")
        .and_then(|v| v.as_str())
        .unwrap_or_default();
    if stop.is_empty() || stop == "tool_use" {
        return;
    }
    state.finished += 1;
    if let Some(answer) = answer_message(&row) {
        state.answers += 1;
        state.last_answer = Some(answer.clone());
    }
}

/// 增量扫描 transcript，返回 `(合格回答数, 已收尾 assistant 数)`。
///
/// 1M token 的 transcript 有几十 MB，而 `answer_after` 每 150 ms 轮询一次；
/// 整读 + 全量 `serde` 解析会造成每秒数百 MB 的分配抖动，并在单 worker 运行时上
/// 饿住其它任务。这里只读追加字节，O(新增字节) 而非 O(文件大小)。
fn scan_transcript(file: &Path) -> (usize, usize) {
    let Ok(len) = std::fs::metadata(file).map(|meta| meta.len()) else {
        return (0, 0);
    };
    let mut guard = tails().lock().unwrap_or_else(|poison| poison.into_inner());
    let now = std::time::Instant::now();
    // 顺手清理已结束的会话，避免缓存无界增长。
    if guard.len() >= TAIL_CACHE_MAX {
        guard.retain(|_, state| now.duration_since(state.touched) < TAIL_CACHE_IDLE);
        if guard.len() >= TAIL_CACHE_MAX {
            let stale = guard
                .iter()
                .min_by_key(|(_, state)| state.touched)
                .map(|(path, _)| path.clone());
            if let Some(path) = stale {
                guard.remove(&path);
            }
        }
    }
    let state = guard.entry(file.to_path_buf()).or_default();
    state.touched = now;
    if len < state.offset {
        // 文件被截断或轮转（CLI 换会话），从头重来。
        *state = TailScan {
            touched: now,
            ..TailScan::default()
        };
    }
    if len > state.offset {
        if let Ok(mut handle) = std::fs::File::open(file) {
            if handle.seek(SeekFrom::Start(state.offset)).is_ok() {
                let mut buf = Vec::with_capacity((len - state.offset) as usize);
                if handle.read_to_end(&mut buf).is_ok() {
                    state.offset += buf.len() as u64;
                    let mut combined = std::mem::take(&mut state.carry);
                    combined.push_str(&String::from_utf8_lossy(&buf));
                    // 只有以换行结尾的部分才是完整行，其余留作下次的残行。
                    let complete = match combined.rfind('\n') {
                        Some(at) => at + 1,
                        None => 0,
                    };
                    for line in combined[..complete].split('\n') {
                        tally_line(line, state);
                    }
                    state.carry = combined[complete..].to_string();
                }
            }
        }
    }
    (state.answers, state.finished)
}

/// 统计 transcript 里「已收尾且带文本」的 assistant 行数（续跳判新回答用）。
pub fn count_text_answers(file: &Path) -> usize {
    scan_transcript(file).0
}

/// 数「已定 stop_reason」的 assistant 行，用来判定一轮 TUI 回合结束。
fn count_finished_assistant(file: &Path) -> usize {
    scan_transcript(file).1
}

/// 等到出现「比 baseline 更新」的带文本回答；最多等 wait。
pub async fn answer_after(file: &Path, baseline: usize, wait: std::time::Duration) -> Option<Value> {
    let deadline = std::time::Instant::now() + wait;
    loop {
        if count_text_answers(file) > baseline {
            if let Some(message) =
                transcript_answer_file(file, std::time::Duration::from_millis(0)).await
            {
                return Some(message);
            }
        }
        if std::time::Instant::now() >= deadline {
            return None;
        }
        // 必须异步休眠：单 worker 运行时上用 std::thread::sleep 会把 executor
        // 整个卡住，MCP 工具回包要等 120 s 超时窗口结束才被处理。
        tokio::time::sleep(std::time::Duration::from_millis(150)).await;
    }
}


/// 测试用：清空增量缓存，避免用例之间互相污染。
#[cfg(test)]
fn reset_transcript_cache() {
    tails().lock().unwrap_or_else(|poison| poison.into_inner()).clear();
}

/// `sanitizePath`：非字母数字一律换成 `-`（官方 CLI 的项目目录规则）。
pub fn sanitize_path(value: &str) -> String {
    let mapped: String = value
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '-' })
        .collect();
    if mapped.chars().count() <= 200 {
        return mapped;
    }
    let hash = fnv_hex(value);
    let head: String = mapped.chars().take(200).collect();
    format!("{head}-{hash}")
}

fn fnv_hex(value: &str) -> String {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in value.as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100_0000_01b3);
    }
    format!("{hash:012x}")
}

/// transcript 路径：`<config>/projects/<sanitizePath(cwd)>/<session>.jsonl`。
pub fn transcript_path(config_dir: &Path, cwd: &Path, session: &str) -> PathBuf {
    config_dir
        .join("projects")
        .join(sanitize_path(&cwd.to_string_lossy()))
        .join(format!("{session}.jsonl"))
}

/// 屏幕里是否已出现提示符（`❯` 或 `›` 起头的一行）。
pub fn is_ready_screen(screen: &str) -> bool {
    if screen.contains("CRAG_READY") {
        return true;
    }
    screen
        .rsplit('\n')
        .take(8)
        .any(|line| {
            let trimmed = line.trim_start();
            trimmed.starts_with('❯') || trimmed.starts_with('›')
        })
}

/// 致命屏幕：CLI 已经报错退出，继续粘贴毫无意义。
pub fn fatal_screen(screen: &str) -> Option<&'static str> {
    const MARKS: [(&str, &str); 4] = [
        ("is already in use", "session id already in use"),
        ("session is already in use", "session id already in use"),
        ("no such file or directory", "missing binary"),
        ("command not found", "missing binary"),
    ];
    let lower = screen.to_ascii_lowercase();
    MARKS
        .iter()
        .find(|(needle, _)| lower.contains(needle))
        .map(|(_, reason)| *reason)
}

/// TUI 下上游限流时 CLI 不产生任何流，只在屏幕上倒计时重试；据此把空跳归类成限流。
pub(crate) fn screen_rate_limited(screen: &str) -> bool {
    // 屏幕里混着 ANSI 序列，倒计时文本本身是连续的，直接按子串扫即可。
    // 只认 CLI 自己的倒计时文本；裸 "429" 会撞上屏幕里的统计数字/ANSI 序列。
    screen.contains("Retrying in") || screen.contains("rate limit")
}

/// 首启向导/权限弹窗：出现即说明这个 HOME 不能无人值守，应判失败而不是硬敲。
fn interactive_refusal(screen: &str) -> Option<&'static str> {
    const MARKS: [(&str, &str); 6] = [
        ("choose the text style", "theme wizard"),
        ("trust this folder", "trust dialog"),
        ("select login", "login prompt"),
        ("login method", "login prompt"),
        ("sign in", "sign in prompt"),
        ("permission required", "permission prompt"),
    ];
    let lower = screen.to_ascii_lowercase();
    MARKS
        .iter()
        .find(|(needle, _)| lower.contains(needle))
        .map(|(_, reason)| *reason)
}

/// bracketed paste 的清洗规则：去掉 `\r` 与控制字符；以命令前缀开头时补一个换行，
/// 否则 CLI 会把它当斜杠命令/提及解析。
/// tap 拿不到事件时的兜底：直接读 CLI 自己写的 transcript。
///
/// 厂商 helper 也是双通道（transcript 尾行 + tap），这里只做最小实现：
/// 等到出现 stop_reason 已定的 assistant 行就返回它的 message 对象。
/// 限制：只处理纯文本回合；带 tool_use 的回合仍需要 tap（见 §12.11.2）。
/// tap 拿不到事件时的兜底：直接读 CLI 自己写的 transcript。
///
/// 厂商 helper 也是双通道（transcript 尾行 + tap），这里只做最小实现：
/// 等到出现 stop_reason 已定、且不含 tool_use 的 assistant 行就返回它的 message。
/// 取最近一条合格回答（见 [`answer_message`]）。
///
/// 实现上**不再读文件**：`scan_transcript` 在增量解析时已经记住了最后一条合格
/// 回答。反向读固定窗口的做法在 JSONL 上不安全——单行可能几十 KB 到 MB 级、
/// 合格回答离文件尾可能隔着很多轮工具调用，窗口内可能连一条完整记录都没有。
pub async fn transcript_answer_file(file: &Path, wait: std::time::Duration) -> Option<Value> {
    let deadline = std::time::Instant::now() + wait;
    loop {
        // 首次调用会把已有内容整体解析一遍（一次性代价），之后只读新增字节。
        let _ = scan_transcript(file);
        let cached = tails()
            .lock()
            .unwrap_or_else(|poison| poison.into_inner())
            .get(file)
            .and_then(|state| state.last_answer.clone());
        if cached.is_some() {
            return cached;
        }
        if std::time::Instant::now() >= deadline {
            return None;
        }
        tokio::time::sleep(std::time::Duration::from_millis(120)).await;
    }
}

pub fn pasteable(value: &str) -> String {
    let mut text = String::with_capacity(value.len());
    for ch in value.chars() {
        match ch {
            '\r' => {}
            '\u{0000}'..='\u{0008}' | '\u{000B}' | '\u{000C}' | '\u{000E}'..='\u{001F}' | '\u{007F}' => {}
            other => text.push(other),
        }
    }
    if text.starts_with(['/', '*', '!', '#', '&']) {
        text.insert(0, '\n');
    }
    if text.trim().is_empty() {
        ".".to_string()
    } else {
        text
    }
}

/// 一帧粘贴字节（`\x1b[200~…\x1b[201~`）。
pub fn paste_frame(text: &str) -> Vec<u8> {
    format!("\u{1b}[200~{}\u{1b}[201~", pasteable(text)).into_bytes()
}

/// 流的请求元信息（tap 在 `open` 行携带）。
#[derive(Debug, Clone, Default, PartialEq)]
pub struct OpenMeta {
    pub max_tokens: u64,
    pub tools: usize,
    pub msgs: usize,
}

/// tap 一行解析。
#[derive(Debug, Clone, PartialEq)]
pub enum TapRow {
    /// `{"tap":"on"}` / `{"tap":"none"}`：注入结果，仅供诊断。
    Armed(String),
    /// `{"s":1,"open":true,"meta":{...}}`：某条流开始（带请求元信息，用于挑主流）。
    Open(u64, OpenMeta),
    /// `{"s":1,"e":{...}}`：上游真实 SSE 事件。
    Event(u64, Value),
    /// `{"s":1,"end":"done"|"cut"}`。
    End(u64, String),
    /// 其它/无法识别。
    Other,
}

pub fn parse_tap_line(line: &str) -> TapRow {
    let Ok(value) = serde_json::from_str::<Value>(line.trim()) else {
        return TapRow::Other;
    };
    if let Some(armed) = value.get("tap").and_then(|v| v.as_str()) {
        return TapRow::Armed(armed.to_string());
    }
    let Some(stream) = value.get("s").and_then(|v| v.as_u64()) else {
        return TapRow::Other;
    };
    if value.get("open").and_then(|v| v.as_bool()).unwrap_or(false) {
        let meta = value.get("meta").cloned().unwrap_or(Value::Null);
        return TapRow::Open(
            stream,
            OpenMeta {
                max_tokens: meta.get("max_tokens").and_then(|v| v.as_u64()).unwrap_or(0),
                tools: meta.get("tools").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
                msgs: meta.get("msgs").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
            },
        );
    }
    if let Some(end) = value.get("end").and_then(|v| v.as_str()) {
        return TapRow::End(stream, end.to_string());
    }
    if let Some(event) = value.get("e") {
        return TapRow::Event(stream, event.clone());
    }
    TapRow::Other
}

/// SSE 事件的 `(name, data)`：`name` 取 `event.type`，`data` 原样。
pub fn sse_of(event: &Value) -> Option<(String, String)> {
    let name = event.get("type").and_then(|v| v.as_str())?.to_string();
    Some((name, event.to_string()))
}

/// 官方 CLI 在 TUI 下的启动参数。
pub fn tui_args(session: &str, model: Option<&str>, system: Option<&str>, system_replace: bool) -> Vec<String> {
    let mut args: Vec<String> = vec![
        "--session-id".into(),
        session.into(),
        // 厂商用 bypassPermissions，但那需要非 root 且要先接受安全对话框；
        // 托管槽更适合走「默认模式 + 显式放行自己的 MCP 工具」：
        // 不放行时 CC 会停在交互授权提示，永远不发 tools/call（实测）。
        "--permission-mode".into(),
        "default".into(),
        "--allowedTools".into(),
        // 必须用通配符：CC 的 allowedTools 按完整工具名匹配（mcp__crag__get_time），
        // 只写 "mcp__crag" 匹配不上，调用会被权限门挂住，直到 120 s 守护进程兜底。
        "mcp__crag__*".into(),
        "--no-chrome".into(),
    ];
    if let Some(model) = model.filter(|m| !m.trim().is_empty()) {
        args.push("--model".into());
        args.push(model.into());
    }
    if let Some(system) = system.filter(|s| !s.trim().is_empty()) {
        args.push(if system_replace { "--system-prompt" } else { "--append-system-prompt" }.into());
        args.push(system.into());
    }
    args
}

/// `script -qefc` 的命令行（PTY 包装）。
pub fn pty_command(cli_bin: &str, args: &[String]) -> (String, Vec<String>) {
    let quoted = std::iter::once(cli_bin.to_string())
        .chain(args.iter().cloned())
        .map(|part| format!("'{}'", part.replace('\'', r"'\''")))
        .collect::<Vec<_>>()
        .join(" ");
    // 内核没有 tty，`script` 会退回极小尺寸（实测 19x80），CLI 的重绘/事件循环
    // 会被拖住（工具回包要等到 120 s 守护进程才被处理）。这里显式给一个正常尺寸。
    let sized = format!("stty rows 50 cols 200 2>/dev/null; exec {quoted}");
    (
        "script".to_string(),
        vec!["-qefc".to_string(), sized, "/dev/null".to_string()],
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_finished_text_answers_from_real_transcript() {
        let path = std::path::Path::new(".real.jsonl");
        if !path.exists() {
            return;
        }
        assert!(count_text_answers(path) >= 1);
    }

    #[test]
    fn rate_limited_screen() {
        assert!(screen_rate_limited("\u{1b}[2m· Retrying in 42\u{1b}[0m"));
        assert!(!screen_rate_limited("\u{1b}[32m● Done\u{1b}[0m"));
    }

    #[test]
    fn sanitize_path_matches_official_rule() {
        assert_eq!(sanitize_path("/lab"), "-lab");
        assert_eq!(sanitize_path("/home/kincli"), "-home-kincli");
        let long = "a".repeat(240);
        let mapped = sanitize_path(&long);
        assert!(mapped.len() > 200 && mapped.contains('-'), "{mapped}");
    }

    #[test]
    fn transcript_path_follows_the_cli_layout() {
        let path = transcript_path(Path::new("/home/kincli/.claude"), Path::new("/lab"), "s1");
        assert_eq!(
            path.iter().rev().take(3).map(|p| p.to_string_lossy().to_string()).collect::<Vec<_>>().join("/"),
            "s1.jsonl/-lab/projects",
        );
    }

    #[test]
    fn ready_and_refusal_detection() {
        assert!(is_ready_screen("...\n❯ \n───"));
        assert!(is_ready_screen("report\n  › hello"));
        assert!(!is_ready_screen("Welcome to Claude Code"));
        assert_eq!(
            interactive_refusal("Choose the text style that looks best"),
            Some("theme wizard")
        );
        assert_eq!(interactive_refusal("❯ Yes, I trust this folder"), Some("trust dialog"));
        assert_eq!(interactive_refusal("❯ "), None);
    }

    #[test]
    fn pasteable_strips_controls_and_protects_command_prefixes() {
        assert_eq!(pasteable("hi\r\nthere"), "hi\nthere");
        let stray = String::from(char::from(27u8)) + "/slash";
        assert_eq!(pasteable(&stray), "
/slash");
        assert_eq!(pasteable("/commit"), "\n/commit");
        assert_eq!(pasteable("   "), ".");
        let frame = paste_frame("hi");
        assert_eq!(frame, b"\x1b[200~hi\x1b[201~".to_vec());
    }

    #[test]
    fn tap_rows_parse() {
        assert_eq!(parse_tap_line(r#"{"tap":"on"}"#), TapRow::Armed("on".into()));
        assert_eq!(
            parse_tap_line(r#"{"s":1,"open":true}"#),
            TapRow::Open(1, OpenMeta::default())
        );
        assert_eq!(
            parse_tap_line(r#"{"s":2,"open":true,"meta":{"max_tokens":128000,"tools":13,"msgs":1}}"#),
            TapRow::Open(2, OpenMeta { max_tokens: 128000, tools: 13, msgs: 1 })
        );
        assert_eq!(
            parse_tap_line(r#"{"s":1,"end":"done"}"#),
            TapRow::End(1, "done".into())
        );
        match parse_tap_line(r#"{"s":1,"e":{"type":"message_stop"}}"#) {
            TapRow::Event(1, event) => assert_eq!(event["type"], "message_stop"),
            other => panic!("{other:?}"),
        }
        assert_eq!(parse_tap_line("not json"), TapRow::Other);
    }

    #[test]
    fn tui_args_include_session_and_optional_knobs() {
        let args = tui_args("s1", Some("claude-haiku-5-5"), Some("be terse"), false);
        let joined = args.join(" ");
        assert!(joined.starts_with("--session-id s1 --permission-mode default --allowedTools mcp__crag__* --no-chrome"));
        assert!(joined.contains("--model claude-haiku-5-5"));
        assert!(joined.contains("--append-system-prompt be terse"));
        // TUI 模式下内核不写 stdin 帧，也不碰 tools（工具走 MCP 或不给）。
        assert!(!joined.contains("--input-format"));
    }

    #[test]
    fn pty_command_quotes_arguments() {
        let (bin, args) = pty_command("/bin/claude", &["--model".into(), "a b".into()]);
        assert_eq!(bin, "script");
        assert_eq!(args[0], "-qefc");
    assert!(args[1].contains("stty rows 50 cols 200"), "PTY 必须显式定尺寸");
        assert!(args[1].contains("exec '/bin/claude' '--model' 'a b'"), "{}", args[1]);
        assert_eq!(args[2], "/dev/null");
    }
}

// ---------------------------------------------------------------------------
// 运行时：一个会话一个 PTY 进程，prompt 走 bracketed paste，事件走 tap 文件。
// ---------------------------------------------------------------------------

use std::collections::HashMap;
use std::sync::Arc;

use tokio::io::{AsyncReadExt, AsyncWriteExt};

/// TUI 会话池（键与 native 通路一致：`x-claude-code-session-id` 优先级最高）。
pub struct TuiPool {
    host: Arc<crate::native::Host>,
    idle: Duration,
    /// 并发 CLI 进程上限（面板 `session_slots`）；超出时按最久未用摘除。
    max: usize,
    sessions: tokio::sync::Mutex<HashMap<String, Live>>,
}

struct Live {
    child: tokio::process::Child,
    stdin: tokio::process::ChildStdin,
    screen: Arc<std::sync::Mutex<String>>,
    tap_path: PathBuf,
    /// tap 读取位置（后台轮询任务推进）。
    offset: Arc<std::sync::atomic::AtomicU64>,
    /// 该会话是否正在服务一轮。
    busy: Arc<std::sync::atomic::AtomicBool>,
    /// 该进程自己那条 transcript（进程复用时会话 id 不变，必须随进程记录）。
    transcript: Option<PathBuf>,
    last_used: std::time::Instant,
}

impl TuiPool {
    pub fn new(host: Arc<crate::native::Host>, idle: Duration, max_sessions: usize) -> Self {
        Self {
            host,
            idle,
            max: max_sessions.clamp(1, 128),
            sessions: tokio::sync::Mutex::new(HashMap::new()),
        }
    }

    /// 并发会话上限（面板 `session_slots`，CRAG 3.1.4 起由面板下发并夹到物理槽位数）。
    pub fn slots(&self) -> usize {
        self.max
    }

    /// 续跳：不写 stdin，只从当前 tap 偏移继续读（CLI 正在等 MCP 结果）。
    pub async fn resume(
        &self,
        key: &str,
    ) -> Result<tokio::sync::mpsc::UnboundedReceiver<TapRow>, String> {
        let mut sessions = self.sessions.lock().await;
        let live = sessions
            .get_mut(key)
            .ok_or_else(|| "tui session gone".to_string())?;
        if live.busy.swap(true, std::sync::atomic::Ordering::SeqCst) {
            return Err("session is already serving another turn".to_string());
        }
        let tap_path = live.tap_path.clone();
        let offset = Arc::clone(&live.offset);
        let busy = Arc::clone(&live.busy);
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        tokio::spawn(async move {
            let deadline = tokio::time::Instant::now() + crate::gateway::HOP_TIMEOUT;
            let mut quiet_since: Option<tokio::time::Instant> = None;
            loop {
                if tokio::time::Instant::now() >= deadline {
                    let _ = tx.send(TapRow::End(0, "timeout".to_string()));
                    break;
                }
                let at = offset.load(std::sync::atomic::Ordering::Relaxed);
                if let Ok((next, rows)) = read_from(&tap_path, at).await {
                    offset.store(next, std::sync::atomic::Ordering::Relaxed);
                    let mut seen_end = false;
                    for row in rows {
                        if matches!(row, TapRow::End(_, _)) {
                            seen_end = true;
                        }
                        if tx.send(row).is_err() {
                            seen_end = true;
                            break;
                        }
                    }
                    if seen_end {
                        quiet_since.get_or_insert_with(tokio::time::Instant::now);
                    } else {
                        quiet_since = None;
                    }
                    if let Some(since) = quiet_since {
                        if since.elapsed() >= Duration::from_millis(1500) {
                            break;
                        }
                    }
                }
                if tx.is_closed() {
                    break;
                }
                tokio::time::sleep(POLL).await;
            }
            busy.store(false, std::sync::atomic::Ordering::SeqCst);
        });
        Ok(rx)
    }

    /// 拉起一个 TUI 会话并等到提示符出现。
    async fn spawn(&self, key: &str, args: &[String]) -> Result<Live, String> {
        let tag = crate::native::session_tag(key);
        let dir = std::env::temp_dir().join(format!("crag-tui-{tag}"));
        tokio::fs::create_dir_all(&dir)
            .await
            .map_err(|error| format!("tui temp dir: {error}"))?;
        let tap_js = dir.join("tap.js");
        tokio::fs::write(&tap_js, TAP_JS)
            .await
            .map_err(|error| format!("tap.js write: {error}"))?;
        let tap_path = dir.join("tap.jsonl");
        tokio::fs::write(&tap_path, b"")
            .await
            .map_err(|error| format!("tap.jsonl: {error}"))?;

        // 托管槽不应该自我改二进制：用官方设置键关掉自更新。
        // （实测不关时 CLI 会在会话中途装 2.1.325 并倒计时重启，直接打断进行中的一轮。）
        // 诊断开关：CRAG_TUI_DEBUG=1 时给 CLI 加 --debug，其 stderr 会落到
        // /tmp/crag-tui-<tag>/stderr.log（含 MCP 客户端握手与工具调用日志）。
        let mut args = args.to_vec();
        if std::env::var("CRAG_TUI_DEBUG").is_ok() {
            args.push("--debug".to_string());
        }
        let (program, pty_args) = pty_command(&self.host.cli_bin, &args);
        let mut command = tokio::process::Command::new(program);
        command
            .args(&pty_args)
            .current_dir(&self.host.cwd)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .kill_on_drop(true);
        for (key, value) in &self.host.env {
            command.env(key, value);
        }
        // 官方安装默认上报遥测，这里刻意不关。
        command
            // 托管槽必须锁版本：CLI 自更新会把二进制换掉并打断进行中的回合。
            .env("DISABLE_AUTOUPDATER", "1");
        // tap 只在显式开启时注入：预加载会替换 Bun.FetchSession，实测在 TUI 下
        // 会让 CLI 拿不到响应流（表现为 Retrying / Unable to connect）。
        // 默认走 transcript 通道（CLI 自己写，零干扰）。
        if self.host.tap_enabled {
            let existing = self
                .host
                .env
                .iter()
                .find(|(k, _)| k == "BUN_OPTIONS")
                .map(|(_, v)| v.clone())
                .unwrap_or_default();
            let preload = format!("--preload={}", tap_js.to_string_lossy());
            let merged = if existing.trim().is_empty() {
                preload
            } else {
                format!("{} {}", existing.trim(), preload)
            };
            command.env("BUN_OPTIONS", merged);
            command.env("CRAG_TUI_TAP", tap_path.to_string_lossy().to_string());
        }
        command
            .env("TERM", "xterm-256color");
        let mut child = command
            .spawn()
            .map_err(|error| format!("tui spawn failed: {error}"))?;
        let stdin = child.stdin.take().ok_or("tui stdin unavailable")?;
        let mut stdout = child.stdout.take().ok_or("tui stdout unavailable")?;
        let screen = Arc::new(std::sync::Mutex::new(String::new()));
        let debug_dir = dir.clone();
        {
            let screen = Arc::clone(&screen);
            tokio::spawn(async move {
                let mut chunk = [0u8; 8192];
                loop {
                    match stdout.read(&mut chunk).await {
                        Ok(0) | Err(_) => break,
                        Ok(read) => {
                            let text = String::from_utf8_lossy(&chunk[..read]).to_string();
                            if let Ok(mut buffer) = screen.lock() {
                                buffer.push_str(&text);
                                // 按字节切 String 会 panic（cut 可能落在多字节字符中间）；
                                // 屏幕超过 32KiB 时才触发，长回合/工具输出必然撞上。
                                let mut cut = buffer.len().saturating_sub(MAX_SCREEN_BYTES);
                                while cut < buffer.len() && !buffer.is_char_boundary(cut) {
                                    cut += 1;
                                }
                                if cut > 0 {
                                    buffer.drain(..cut);
                                }
                                let _ = std::fs::write(debug_dir.join("screen.log"), buffer.as_bytes());
                            }
                        }
                    }
                }
            });
        }
        if let Some(mut stderr) = child.stderr.take() {
            let path = dir.join("stderr.log");
            tokio::spawn(async move {
                // 流式落盘：CLI 不退出也要能读到（诊断工具链路时必须）。
                use tokio::io::AsyncWriteExt;
                let mut chunk = [0u8; 4096];
                loop {
                    match stderr.read(&mut chunk).await {
                        Ok(0) | Err(_) => break,
                        Ok(n) => {
                            if let Ok(mut file) = tokio::fs::OpenOptions::new()
                                .create(true)
                                .append(true)
                                .open(&path)
                                .await
                            {
                                let _ = file.write_all(&chunk[..n]).await;
                                let _ = file.flush().await;
                            }
                        }
                    }
                }
            });
        }

        // 等提示符：30 s 上限；出现向导/信任弹窗直接失败（不猜着敲）。
        let deadline = tokio::time::Instant::now() + Duration::from_secs(30);
        let mut ready_since: Option<tokio::time::Instant> = None;
        loop {
            if tokio::time::Instant::now() >= deadline {
                let snapshot = screen.lock().map(|b| b.clone()).unwrap_or_default();
                let _ = std::fs::write(dir.join("ready-timeout.log"), snapshot.as_bytes());
                return Err("tui ready timeout".to_string());
            }
            let snapshot = screen.lock().map(|b| b.clone()).unwrap_or_default();
            if let Some(reason) = fatal_screen(&snapshot) {
                let _ = std::fs::write(dir.join("fatal.log"), snapshot.as_bytes());
                return Err(format!("tui fatal: {reason}"));
            }
            if let Some(reason) = interactive_refusal(&snapshot) {
                return Err(format!("tui refused startup: {reason}"));
            }
            let tail = &snapshot[snapshot.len().saturating_sub(2_000)..];
            let broken = tail.contains("Error:") || tail.contains("error: ") || tail.contains("panic");
            if !broken && is_ready_screen(&snapshot) {
                let since = ready_since.get_or_insert_with(tokio::time::Instant::now);
                if since.elapsed() >= READY_DEBOUNCE {
                    break;
                }
            } else {
                ready_since = None;
            }
            tokio::time::sleep(Duration::from_millis(50)).await;
        }

        Ok(Live {
            child,
            stdin,
            screen,
            tap_path,
            offset: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            busy: Arc::new(std::sync::atomic::AtomicBool::new(false)),
            transcript: transcript_of_args(&self.host, &args),
            last_used: std::time::Instant::now(),
        })
    }

    /// 该会话进程自己的 transcript 路径（网关兜底要用同一份，不能用本轮新 uuid）。
    pub async fn transcript_for(&self, key: &str) -> Option<PathBuf> {
        let sessions = self.sessions.lock().await;
        sessions.get(key).and_then(|live| live.transcript.clone())
    }

    /// 一轮：确保会话就绪 → 粘贴 prompt → 后台把 tap 事件按序转出。
    ///
    /// 立刻返回接收端，调用方可以边收边回投；轮询任务在 `end` 或超时后自行收尾。
    /// 粘贴前等回空闲：只看一次 `❯` 不够，上一轮可能还在渲染。
    /// CLI 跑回合时屏幕上一定有 `esc to interrupt`，据此判定忙。
    async fn wait_idle(&self, live: &Live, limit: Duration) -> bool {
        let deadline = std::time::Instant::now() + limit;
        let mut stable = 0;
        while std::time::Instant::now() < deadline {
            let text = live.screen.lock().map(|s| s.clone()).unwrap_or_default();
            let tail: String = {
                let chars: Vec<char> = text.chars().collect();
                chars[chars.len().saturating_sub(2000)..].iter().collect()
            };
            if !tail.contains("esc to interrupt") && is_ready_screen(&tail) {
                stable += 1;
                if stable >= 2 { return true; }
            } else {
                stable = 0;
            }
            tokio::time::sleep(Duration::from_millis(150)).await;
        }
        false
    }

    pub async fn hop(
        &self,
        key: &str,
        args: Vec<String>,
        prompt: &str,
    ) -> Result<tokio::sync::mpsc::UnboundedReceiver<TapRow>, String> {
        let mut sessions = self.sessions.lock().await;
        let stale: Vec<String> = sessions
            .iter_mut()
            .filter_map(|(id, live)| {
                let dead = !matches!(live.child.try_wait(), Ok(None));
                (dead || live.last_used.elapsed() > self.idle).then(|| id.clone())
            })
            .collect();
        for id in stale {
            sessions.remove(&id);
        }
        // 超并发上限：摘掉最久未用者（连带杀掉它的 CLI 进程）。
        while sessions.len() >= self.max {
            let victim = sessions
                .iter()
                .min_by_key(|(_, live)| live.last_used)
                .map(|(id, _)| id.clone());
            match victim {
                Some(id) => {
                    sessions.remove(&id);
                }
                None => break,
            }
        }
        if !sessions.contains_key(key) {
            let live = self.spawn(key, &args).await?;
            sessions.insert(key.to_string(), live);
        }
        let live = sessions.get_mut(key).expect("just inserted");
        if live.busy.swap(true, std::sync::atomic::Ordering::SeqCst) {
            return Err("session is already serving another turn".to_string());
        }

        // 上一轮可能还在渲染：先等回空闲再粘，否则新回合会被吞进忙屏。
        self.wait_idle(&live, Duration::from_secs(8)).await;
        let frame = paste_frame(prompt);
        if let Err(error) = live.stdin.write_all(&frame).await {
            live.busy.store(false, std::sync::atomic::Ordering::SeqCst);
            return Err(format!("paste failed: {error}"));
        }
        tokio::time::sleep(PASTE_GAP).await;
        if let Err(error) = live.stdin.write_all(&[0x0d]).await {
            live.busy.store(false, std::sync::atomic::Ordering::SeqCst);
            return Err(format!("submit failed: {error}"));
        }
        // 兜底：Bun 偶尔把第一次回车当换行，再补一次（空提交会被 CLI 忽略）。
        tokio::time::sleep(Duration::from_millis(250)).await;
        let _ = live.stdin.write_all(&[0x0d]).await;
        live.last_used = std::time::Instant::now();

        let tap_path = live.tap_path.clone();
        let offset = Arc::clone(&live.offset);
        let busy = Arc::clone(&live.busy);
        // tap 关掉时没有任何行可读，回合结束只能靠 transcript 判定。
        // 路径必须用**进程自己的**会话 id（复用进程时本轮 args 里是新 uuid）。
        let transcript = if self.host.tap_enabled {
            None
        } else {
            live.transcript.clone()
        };
        let baseline = transcript.as_deref().map(count_finished_assistant).unwrap_or(0);
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        tokio::spawn(async move {
            let deadline = tokio::time::Instant::now() + crate::gateway::HOP_TIMEOUT;
            let mut quiet_since: Option<tokio::time::Instant> = None;
            loop {
                if tokio::time::Instant::now() >= deadline {
                    let _ = tx.send(TapRow::End(0, "timeout".to_string()));
                    break;
                }
                if let Some(file) = transcript.as_deref() {
                    if count_finished_assistant(file) > baseline {
                        let _ = tx.send(TapRow::End(0, "done".to_string()));
                        break;
                    }
                }
                if let Some(file) = transcript.as_deref() {
                    if count_finished_assistant(file) > baseline {
                        let _ = tx.send(TapRow::End(0, "done".to_string()));
                        break;
                    }
                }
                let at = offset.load(std::sync::atomic::Ordering::Relaxed);
                if let Ok((next, rows)) = read_from(&tap_path, at).await {
                    offset.store(next, std::sync::atomic::Ordering::Relaxed);
                    let mut seen_end = false;
                    for row in rows {
                        if matches!(row, TapRow::End(_, _)) {
                            seen_end = true;
                        }
                        if tx.send(row).is_err() {
                            seen_end = true;
                            break;
                        }
                    }
                    if seen_end {
                        quiet_since.get_or_insert_with(tokio::time::Instant::now);
                    } else {
                        quiet_since = None;
                    }
                    if let Some(since) = quiet_since {
                        if since.elapsed() >= Duration::from_millis(1500) {
                            break;
                        }
                    }
                }
                if tx.is_closed() {
                    break;
                }
                tokio::time::sleep(POLL).await;
            }
            busy.store(false, std::sync::atomic::Ordering::SeqCst);
        });
        Ok(rx)
    }
}

async fn read_from(path: &Path, offset: u64) -> std::io::Result<(u64, Vec<TapRow>)> {
    let mut file = tokio::fs::File::open(path).await?;
    let len = file.metadata().await?.len();
    if len < offset {
        return Ok((len, Vec::new()));
    }
    if len == offset {
        return Ok((offset, Vec::new()));
    }
    use tokio::io::AsyncSeekExt;
    file.seek(std::io::SeekFrom::Start(offset)).await?;
    let mut buffer = vec![0u8; (len - offset) as usize];
    file.read_exact(&mut buffer).await?;
    let text = String::from_utf8_lossy(&buffer);
    let rows = text
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(parse_tap_line)
        .collect();
    Ok((len, rows))
}
