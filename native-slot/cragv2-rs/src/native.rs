//! 原生 CLI 数据面 —— 内核**不拼请求**。
//!
//! 官方 `claude` 自己与上游对话
//! （`--print --input-format stream-json --output-format stream-json`），
//! 内核只做「stdin 帧下发」与「stdout 帧 → SSE」的转接。这是 vendor 的非 tui
//! transport；与之相对的是 `direct`（内核自拼 wire，只留作离线差分对照）。
//!
//! 真值：`docs/GAP_IMPL_SPEC.md` §1 结论 9/11/12（采集于 2.1.321）。

use std::path::PathBuf;

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use serde_json::{json, Value};

use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

use crate::ndjson::StdoutFrame;

/// 会话标签（FNV-1a 32 位）：让续跳能判断"这个 tool_use 是不是本会话发出的"。
/// 上游 issue #1114 就是续跳被派到别的槽、新槽不认识这个 id。
/// 毫秒时间戳（诊断日志用）。
pub fn now_ms() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

pub fn session_tag(session: &str) -> String {
    let mut hash: u32 = 0x811c_9dc5;
    for byte in session.as_bytes() {
        hash ^= *byte as u32;
        hash = hash.wrapping_mul(0x0100_0193);
    }
    format!("{hash:08x}")
}

/// 续跳指纹：只哈希**形状**（role 序列 + 块类型序列 + tool_use id），不哈希正文。
///
/// 上游 `continuationFingerprint` 用全文哈希，会因客户端等价改写而误拒；
/// 形状指纹能精确抓到「历史结构被改/续跳派错槽」，又不会因文案差异翻车。
/// 末尾 user 的 `tool_result` 块是本次续跳的输入，不参与哈希。
pub fn history_fingerprint(messages: &[Value]) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    let mut feed = |text: &str| {
        for byte in text.as_bytes() {
            hash ^= *byte as u64;
            hash = hash.wrapping_mul(0x100_0000_01b3);
        }
    };
    let last = messages.len().saturating_sub(1);
    for (index, message) in messages.iter().enumerate() {
        let blocks = message.get("content").and_then(|v| v.as_array());
        // 末条 user 若整条都是 tool_result，它就是本次续跳的输入，整条不参与历史形状。
        let only_results = index == last
            && blocks
                .map(|list| {
                    !list.is_empty()
                        && list.iter().all(|block| {
                            block.get("type").and_then(|v| v.as_str()) == Some("tool_result")
                        })
                })
                .unwrap_or(false);
        if only_results {
            continue;
        }
        feed(message.get("role").and_then(|v| v.as_str()).unwrap_or(""));
        feed("|");
        let Some(blocks) = blocks else {
            feed("text");
            continue;
        };
        for block in blocks {
            let kind = block.get("type").and_then(|v| v.as_str()).unwrap_or("");
            if index == last && kind == "tool_result" {
                continue;
            }
            feed(kind);
            if kind == "tool_use" {
                feed(block.get("id").and_then(|v| v.as_str()).unwrap_or(""));
                feed(block.get("name").and_then(|v| v.as_str()).unwrap_or(""));
            }
            feed(",");
        }
    }
    hash
}

/// 把「上一跳的 messages + 内核合成的 assistant(tool_use)」一起算指纹，
/// 用于在 park 时锁定历史形状，续跳时比对。
pub fn fingerprint_with_synthetic(body: &Value, calls: &[(String, String, Value)]) -> u64 {
    let mut messages: Vec<Value> = body
        .get("messages")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    messages.push(json!({
        "role": "assistant",
        "content": calls
            .iter()
            .map(|(id, name, input)| json!({"type": "tool_use", "id": id, "name": name, "input": input}))
            .collect::<Vec<_>>(),
    }));
    history_fingerprint(&messages)
}

/// 该 `tool_use` id 是否属于本会话（标签一致）。
pub fn tool_id_matches_session(id: &str, session: &str) -> bool {
    id.strip_prefix(TOOL_ID_PREFIX)
        .and_then(|rest| rest.split('_').next())
        .map(|tag| tag == session_tag(session))
        .unwrap_or(false)
}

/// 合成 `tool_use` 消息用的调用 id 前缀（与 vendor 同形）。
pub const TOOL_ID_PREFIX: &str = "crag_tool_";
/// CC 侧 MCP 工具的命名前缀：`mcp__<server>__<tool>`，我们固定用 server 名 `crag`。
pub const MCP_TOOL_PREFIX: &str = "mcp__crag__";
/// 内核 → 调用方的「有工具被 park」通知帧类型。
pub const PARKED_KIND: &str = "crag_parked";
const PARKED_KIND_FIELD: &str = "type";

/// `kernel.json` 的 `transport` 取值。
pub const NATIVE: &str = "native";
pub const DIRECT: &str = "direct";

/// 原生 CLI 宿主：内核只负责拉起它、喂帧、回收帧。
pub struct Host {
    pub cli_bin: String,
    pub cwd: PathBuf,
    /// 追加给子进程的环境（代理、上游 BASE_URL 等），基座仍是本进程环境。
    pub env: Vec<(String, String)>,
    /// 是否给 TUI 子进程注入 tap 预加载。默认关：预加载会替换 Bun.FetchSession，
    /// 实测让 TUI 拿不到响应流；关掉后走 transcript 通道（对 CLI 零干扰）。
    pub tap_enabled: bool,
}

/// 把整段对话渲染成**一条自包含 prompt**，对齐 vendor `renderInitialPrompt`。
///
/// 为什么必须这么做：native 通路用 `--no-session-persistence` 起 CLI（每次都是
/// 全新进程、不读也不写会话），CLI 自己不会保存历史。上游的做法是把
/// `messages` 里除最后一条 user 以外的全部内容渲染进 `<conversation_history>`，
/// 再把最后一条包进 `<current_turn>`，于是每轮都是一条完整、可独立理解的 prompt。
///
/// 我们早期只把最后一条 user 交给 CLI，等于把历史整段丢弃——多轮对话因此失忆。
pub fn render_initial_prompt(body: &Value) -> Option<String> {
    let messages = body.get("messages")?.as_array()?;
    let last = messages
        .iter()
        .rposition(|message| message.get("role").and_then(|role| role.as_str()) == Some("user"))?;
    let current = render_content(messages[last].get("content").unwrap_or(&Value::Null));
    if current.trim().is_empty() {
        return None;
    }
    let history = &messages[..last];
    let mut prompt = String::new();
    if !history.is_empty() {
        prompt.push_str("<conversation_history>\n");
        let rendered: Vec<String> = history.iter().map(render_message).collect();
        prompt.push_str(&rendered.join("\n\n"));
        prompt.push_str("\n</conversation_history>\n\n");
    }
    prompt.push_str("<current_turn>\n");
    prompt.push_str(&current);
    prompt.push_str("\n</current_turn>");
    Some(prompt)
}

fn render_message(message: &Value) -> String {
    let role = message
        .get("role")
        .and_then(|role| role.as_str())
        .unwrap_or("message");
    format!(
        "[{role}]\n{}",
        render_content(message.get("content").unwrap_or(&Value::Null))
    )
}

fn render_content(content: &Value) -> String {
    match content {
        Value::String(text) => text.clone(),
        Value::Array(blocks) => blocks
            .iter()
            .map(render_block)
            .collect::<Vec<_>>()
            .join("\n"),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

fn render_block(block: &Value) -> String {
    let kind = block.get("type").and_then(|value| value.as_str());
    match kind {
        Some("text") => block
            .get("text")
            .and_then(|text| text.as_str())
            .unwrap_or_default()
            .to_string(),
        Some("tool_use") => format!(
            "[tool call {}]\n{}",
            block.get("name").and_then(|name| name.as_str()).unwrap_or("tool"),
            block
                .get("input")
                .map(|input| input.to_string())
                .unwrap_or_else(|| "{}".to_string())
        ),
        Some("tool_result") => format!(
            "[tool result {}{}]\n{}",
            block
                .get("tool_use_id")
                .and_then(|id| id.as_str())
                .unwrap_or(""),
            // 上游同样在标签里标 error（`[tool result <id> (error)]`）。
            if block.get("is_error").and_then(|v| v.as_bool()).unwrap_or(false) {
                " (error)"
            } else {
                ""
            },
            render_content(block.get("content").unwrap_or(&Value::Null))
        ),
        // ToolSearch 的引用块是「仅结果」块，native 历史不接受，上游也是转成文本
        // `[tool_reference <tool_name>]`（crag-print-prompt.mjs::readOnlyResultBlock）。
        Some("tool_reference") => format!(
            "[tool_reference {}]",
            block
                .get("tool_name")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
        ),
        other => format!(
            "[unsupported content block: {}]",
            other.unwrap_or("unknown")
        ),
    }
}

/// 只把**最后一轮 user 消息**交给 CLI：会话由 CLI 自己维护。
pub fn last_user_content(body: &Value) -> Option<Value> {
    body.get("messages")
        .and_then(|v| v.as_array())?
        .iter()
        .rev()
        .find(|m| m.get("role").and_then(|r| r.as_str()) == Some("user"))
        .and_then(|m| m.get("content").cloned())
}

/// 控制面的 `system`（字符串或 text 块数组）→ `--append-system-prompt` 文本。
pub fn system_text(body: &Value) -> Option<String> {
    let system = body.get("system")?;
    let text = match system {
        Value::String(text) => text.clone(),
        Value::Array(blocks) => blocks
            .iter()
            .filter_map(|b| b.get("text").and_then(|t| t.as_str()))
            .collect::<Vec<_>>()
            .join("\n"),
        _ => return None,
    };
    (!text.trim().is_empty()).then_some(text)
}

/// 原生通路的启动参数。除 `--include-partial-messages` 外逐项对齐 vendor
/// `gateway/v2-runtime.mjs` 的非 tui 分支；实测 2.1.321 支持该开关，并把真实
/// SSE 事件原样吐成 `stream_event`。
pub struct Args<'a> {
    pub session_id: &'a str,
    pub mcp_config: Option<&'a str>,
    pub model: Option<&'a str>,
    /// (文本, 是否替换默认 system prompt)
    pub system_prompt: Option<(&'a str, bool)>,
    pub bare: bool,
    /// 要禁用（或收窄）的内建工具名，对应 `--disallowedTools`。
    ///
    /// 不用 `--tools ""`：2.1.321 会把它当成**工具规格**解析（实测产出乱码名
    /// `mcp__g__3615150`，且连带 MCP 服务器不加载）。只能按名字逐个禁用。
    pub disallowed_tools: Vec<String>,
    /// `--allowedTools` 的前缀条目。print 模式下 MCP 工具默认**未授权**，
    /// 调用会返回权限错误（模型表现为"先把结果告诉你"），必须显式放行。
    pub allowed_tools: Vec<String>,
}

impl Args<'_> {
    pub fn to_vec(&self) -> Vec<String> {
        let mut v: Vec<String> = [
            "--print",
            "--input-format",
            "stream-json",
            "--output-format",
            "stream-json",
            "--include-partial-messages",
            "--replay-user-messages",
            "--verbose",
            "--no-session-persistence",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();
        if self.bare {
            v.push("--bare".into());
        }
        if !self.allowed_tools.is_empty() {
            v.push("--allowedTools".into());
            for name in &self.allowed_tools {
                v.push(name.clone());
            }
        }
        if !self.disallowed_tools.is_empty() {
            v.push("--disallowedTools".into());
            for name in &self.disallowed_tools {
                v.push(name.clone());
            }
        }
        v.push("--strict-mcp-config".into());
        if let Some(path) = self.mcp_config {
            v.push("--mcp-config".into());
            v.push(path.into());
        }
        v.push("--session-id".into());
        v.push(self.session_id.into());
        if let Some(model) = self.model {
            v.push("--model".into());
            v.push(model.into());
        }
        if let Some((text, replace)) = self.system_prompt {
            v.push(if replace { "--system-prompt" } else { "--append-system-prompt" }.into());
            v.push(text.into());
        }
        v
    }
}

/// 一行 stdout 帧 → 要回给控制面的 SSE（`None` 表示内部帧，不外发）。
///
/// 只有 `stream_event` 外发，且 `event` 原样透传 —— 它就是上游的真实 SSE
/// 事件（`message_start` / `content_block_*` / `message_delta` / `message_stop`），
/// 由官方 CLI 保证顺序，内核不改写。
pub fn to_sse(frame: &StdoutFrame) -> Option<(String, String)> {
    if frame.kind != "stream_event" {
        return None;
    }
    let event = frame.event.as_ref()?;
    let name = event.get("type")?.as_str()?.to_string();
    Some((name, event.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn args_are_native_print_mode() {
        let args = Args {
            session_id: "s1",
            mcp_config: Some("/tmp/mcp.json"),
            model: Some("claude-haiku-5-5"),
            system_prompt: Some(("be terse", false)),
            bare: false,
            disallowed_tools: Vec::new(),
        allowed_tools: Vec::new(),
        }
        .to_vec();
        let joined = args.join(" ");
        assert!(joined.starts_with("--print --input-format stream-json"), "{joined}");
        assert!(joined.contains("--include-partial-messages"), "{joined}");
        assert!(joined.contains("--strict-mcp-config --mcp-config /tmp/mcp.json"), "{joined}");
        assert!(joined.contains("--session-id s1"), "{joined}");
        assert!(joined.contains("--append-system-prompt be terse"), "{joined}");
        assert!(!args.iter().any(|a| a == "--tools"), "tools 由控制面决定，内核不覆盖");
    }

    #[test]
    fn replace_system_prompt_uses_the_replacing_flag() {
        let args = Args {
            session_id: "s",
            mcp_config: None,
            model: None,
            system_prompt: Some(("x", true)),
            bare: true,
            disallowed_tools: Vec::new(),
        allowed_tools: Vec::new(),
        }
        .to_vec();
        assert!(args.windows(2).any(|w| w[0] == "--system-prompt" && w[1] == "x"));
        assert!(args.iter().any(|a| a == "--bare"));
    }

    #[test]
    fn only_stream_events_are_forwarded() {
        let internal = StdoutFrame {
            kind: "system".into(),
            session_id: "s".into(),
            event: None,
            subtype: Some("init".into()),
            is_error: None,
            stop_reason: None,
            result: None,
            usage: None,
        };
        assert!(to_sse(&internal).is_none());

        let delta: StdoutFrame = serde_json::from_str(
            r#"{"type":"stream_event","event":{"delta":{"text":"PONG","type":"text_delta"},"index":0,"type":"content_block_delta"},"session_id":"s"}"#,
        )
        .unwrap();
        let (name, data) = to_sse(&delta).unwrap();
        assert_eq!(name, "content_block_delta");
        assert!(data.contains("text_delta"));
    }

    #[test]
    fn mcp_tool_use_from_cc_is_suppressed_with_its_deltas() {
        let mut dropped = std::collections::HashSet::new();
        let start = json!({"type": "content_block_start", "index": 1, "content_block": {"type": "tool_use", "id": "toolu_1", "name": "mcp__crag__get_time"}});
        assert!(suppress_mcp_tool_use(&start, &mut dropped));
        let delta = json!({"type": "content_block_delta", "index": 1, "delta": {"type": "input_json_delta", "partial_json": "{}"}});
        assert!(suppress_mcp_tool_use(&delta, &mut dropped));
        assert!(suppress_mcp_tool_use(&json!({"type": "content_block_stop", "index": 1}), &mut dropped));
        // 其它块与消息级事件照常外发。
        assert!(!suppress_mcp_tool_use(&json!({"type": "content_block_stop", "index": 0}), &mut dropped));
        assert!(!suppress_mcp_tool_use(&json!({"type": "message_delta", "delta": {"stop_reason": "tool_use"}}), &mut dropped));
    }

    #[test]
    fn tool_results_are_read_from_the_last_user_message() {
        let body = json!({"messages": [
            {"role": "user", "content": [{"type": "text", "text": "hi"}]},
            {"role": "assistant", "content": [{"type": "tool_use", "id": "t1", "name": "get_time", "input": {}}]},
            {"role": "user", "content": [
                {"type": "tool_result", "tool_use_id": "t1", "content": "12:00"},
                {"type": "tool_result", "tool_use_id": "t2", "content": [{"type": "text", "text": "x"}], "is_error": true},
            ]},
        ]});
        let results = tool_results(&body);
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].0, "t1");
        assert_eq!(results[0].1[0]["text"], "12:00");
        assert!(results[1].2);
        // 普通首页不是续跳。
        let plain = json!({"messages": [{"role": "user", "content": [{"type": "text", "text": "hi"}]}]});
        assert!(tool_results(&plain).is_empty());
    }

    #[test]
    fn server_tools_are_not_exposed_through_mcp() {
        let tools = json!([
            {"name": "get_time", "description": "d", "input_schema": {"type": "object", "properties": {}}},
            {"type": "web_search_20250305", "name": "web_search", "max_uses": 5},
            {"type": "custom", "name": "bash", "description": "b", "input_schema": {"type": "object"}},
        ]);
        let mapped = mcp_tools(&tools);
        let names: Vec<&str> = mapped.iter().filter_map(|t| t["name"].as_str()).collect();
        assert_eq!(names, vec!["get_time", "bash"]);
        assert_eq!(skipped_server_tools(&tools), vec!["web_search".to_string()]);
    }

    #[test]
    fn shape_fingerprint_ignores_wording_but_catches_structure() {
        let base = json!({"messages": [
            {"role": "user", "content": [{"type": "text", "text": "hello"}]},
        ]});
        let reworded = json!({"messages": [
            {"role": "user", "content": [{"type": "text", "text": "hello there"}]},
        ]});
        let calls = vec![("crag_tool_x_1".to_string(), "get_time".to_string(), json!({}))];
        let locked = fingerprint_with_synthetic(&base, &calls);
        // 续跳：上一跳 + 合成的 assistant(tool_use) + 本条 tool_result
        let mut cont = base["messages"].as_array().unwrap().clone();
        cont.push(json!({"role": "assistant", "content": [{"type": "tool_use", "id": "crag_tool_x_1", "name": "get_time", "input": {}}]}));
        cont.push(json!({"role": "user", "content": [{"type": "tool_result", "tool_use_id": "crag_tool_x_1", "content": "12:00"}]}));
        assert_eq!(locked, history_fingerprint(&cont), "等价续跳必须同指纹");
        // 文案改写不影响形状
        let mut reworded_cont = reworded["messages"].as_array().unwrap().clone();
        reworded_cont.push(cont[1].clone());
        reworded_cont.push(cont[2].clone());
        assert_eq!(locked, history_fingerprint(&reworded_cont), "正文改写不该翻车");
        // 结构被改（换了 tool_use id）必须抓到
        let mut tampered = cont.clone();
        tampered[1] = json!({"role": "assistant", "content": [{"type": "tool_use", "id": "crag_tool_other", "name": "get_time", "input": {}}]});
        assert_ne!(locked, history_fingerprint(&tampered), "换 id 必须被抓到");
    }

    #[test]
    fn tool_ids_are_scoped_to_their_session() {
        let id = format!("{TOOL_ID_PREFIX}{}_abc123", session_tag("sess-a"));
        assert!(tool_id_matches_session(&id, "sess-a"));
        assert!(!tool_id_matches_session(&id, "sess-b"));
        assert!(!tool_id_matches_session("toolu_01xyz", "sess-a"));
        assert_eq!(session_tag("sess-a"), session_tag("sess-a"));
    }

    #[test]
    fn observation_is_local_only_and_content_free() {
        let marker = "crag-obs-test-session";
        observe(marker, &json!({"hop": 1, "events": 7, "parked": true}));
        let path = std::env::temp_dir()
            .join("crag-obs")
            .join(format!("{}.jsonl", session_tag(marker)));
        let text = std::fs::read_to_string(&path).expect("观测文件应已写出");
        assert!(text.contains("\"events\":7"));
        assert!(!text.contains("prompt"), "观测文件不得含请求正文");
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn mcp_tools_map_input_schema_to_camel_case() {
        let tools = json!([{"name": "get_time", "description": "d", "input_schema": {"type": "object", "properties": {}}}]);
        let mapped = mcp_tools(&tools);
        assert_eq!(mapped.len(), 1);
        assert_eq!(mapped[0]["name"], "get_time");
        assert_eq!(mapped[0]["inputSchema"]["type"], "object");
        assert!(mapped[0].get("input_schema").is_none());
    }

    #[test]
    fn tool_use_sse_emits_a_complete_sequence() {
        let events = tool_use_sse("m", &[("crag_tool_x".to_string(), "get_time".to_string(), json!({"a": 1}))]);
        let names: Vec<&str> = events.iter().map(|(name, _)| name.as_str()).collect();
        assert_eq!(
            names,
            vec![
                "message_start",
                "content_block_start",
                "content_block_delta",
                "content_block_stop",
                "message_delta",
                "message_stop"
            ]
        );
        assert!(events[1].1.contains("crag_tool_x"));
        assert!(events[2].1.contains("input_json_delta"));
        assert!(events[4].1.contains("tool_use"));
    }

    #[test]
    fn pool_starts_empty() {
        let pool = Pool::new(
            Arc::new(Host {
                cli_bin: "/bin/false".into(),
                cwd: PathBuf::from("."),
                env: Vec::new(),
                tap_enabled: false,
            }),
            Duration::from_secs(1),
            4,
            Duration::from_secs(5),
        );
        assert!(pool.pids_now().is_empty());
    }

    #[test]
    fn renders_tool_reference_and_error_label() {
        // 与上游 readOnlyResultBlock 对齐：tool_reference 转文本，不落「unsupported」。
        assert_eq!(
            render_block(&json!({"type": "tool_reference", "tool_name": "mcp__crag__Bash"})),
            "[tool_reference mcp__crag__Bash]"
        );
        let err = render_block(&json!({
            "type": "tool_result",
            "tool_use_id": "t1",
            "is_error": true,
            "content": "boom"
        }));
        assert!(err.starts_with("[tool result t1 (error)]"), "{err}");
    }

    #[test]
    fn mcp_config_declares_stdio_type() {
        let (for_cli, _) = mcp_configs(
            std::path::Path::new("/bin/crag"),
            std::path::Path::new("/tmp/b.json"),
            "http://127.0.0.1:1/x",
            vec![json!({"name": "Bash"})],
        );
        assert_eq!(for_cli["mcpServers"]["crag"]["type"], json!("stdio"),
            "缺 type 时 CC 会静默忽略整个服务器");
    }

    #[test]
    fn last_user_content_skips_tool_results_and_assistant() {
        let body = serde_json::json!({
            "messages": [
                {"role": "user", "content": "first"},
                {"role": "assistant", "content": [{"type": "text", "text": "a"}]},
                {"role": "user", "content": [{"type": "text", "text": "second"}]},
            ]
        });
        assert_eq!(
            last_user_content(&body),
            Some(serde_json::json!([{"type": "text", "text": "second"}]))
        );
        assert!(last_user_content(&serde_json::json!({"messages": []})).is_none());
    }

    #[test]
    fn system_text_flattens_blocks_and_ignores_blanks() {
        assert_eq!(
            system_text(&serde_json::json!({"system": [{"type":"text","text":"a"},{"type":"text","text":"b"}]})),
            Some("a\nb".to_string())
        );
        assert_eq!(system_text(&serde_json::json!({"system": "  "})), None);
        assert_eq!(system_text(&serde_json::json!({})), None);
    }
}


/// 工具续跳：body 里最后一条 user 消息是 `tool_result` 集即视为续跳。
pub fn tool_results(body: &Value) -> Vec<(String, Vec<Value>, bool)> {
    let mut out = Vec::new();
    let Some(messages) = body.get("messages").and_then(|v| v.as_array()) else {
        return out;
    };
    let Some(last) = messages.last() else { return out };
    if last.get("role").and_then(|v| v.as_str()) != Some("user") {
        return out;
    }
    let Some(blocks) = last.get("content").and_then(|v| v.as_array()) else {
        return out;
    };
    for block in blocks {
        if block.get("type").and_then(|v| v.as_str()) != Some("tool_result") {
            continue;
        }
        let id = block
            .get("tool_use_id")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        if id.is_empty() {
            continue;
        }
        let content = match block.get("content") {
            Some(Value::Array(items)) => items.clone(),
            Some(Value::String(text)) => vec![json!({"type": "text", "text": text})],
            _ => vec![json!({"type": "text", "text": ""})],
        };
        let is_error = block.get("is_error").and_then(|v| v.as_bool()).unwrap_or(false);
        out.push((id, content, is_error));
    }
    out
}

/// Anthropic 工具定义 → MCP 工具定义（`input_schema` → `inputSchema`）。
///
/// **只映射客户端工具**（带 `input_schema` 的 custom tool）。服务器工具
/// （`web_search_*` / `advisor_*` / `code_execution_*` 等）由上游自己执行，
/// 透给 MCP 会让 CLI 发起内核无法满足的调用（上游 issue #1088 的同类故障）。
/// 客户端工具名列表（用于 `--disallowedTools`：客户端工具以 MCP 形式提供，
/// 同名内建必须禁掉，否则模型会选内建那个在容器里执行）。
/// 进程形态指纹：工具集 + model。为空（无工具）时返回 0，表示不需要区分。
/// 用途见 gateway：会话键带上它，形态一变就换新进程（CLI 参数只在 spawn 生效）。
pub fn spawn_variant(body: &Value) -> u64 {
    let tools = body.get("tools").and_then(|v| v.as_array());
    let Some(tools) = tools.filter(|t| !t.is_empty()) else {
        return 0;
    };
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    let mut feed = |bytes: &[u8]| {
        for byte in bytes {
            hash ^= *byte as u64;
            hash = hash.wrapping_mul(0x0100_0000_01b3);
        }
    };
    for tool in tools {
        if let Some(name) = tool.get("name").and_then(|v| v.as_str()) {
            feed(name.as_bytes());
        }
        if let Some(schema) = tool.get("input_schema") {
            feed(schema.to_string().as_bytes());
        }
    }
    if let Some(model) = body.get("model").and_then(|v| v.as_str()) {
        feed(model.as_bytes());
    }
    hash
}

pub fn client_tool_names(body: &Value) -> Vec<String> {
    body.get("tools")
        .and_then(|v| v.as_array())
        .map(|items| {
            items
                .iter()
                .filter_map(|t| t.get("name").and_then(|v| v.as_str()))
                .filter(|n| !n.is_empty())
                .map(|n| n.to_string())
                .collect()
        })
        .unwrap_or_default()
}

pub fn mcp_tools(tools: &Value) -> Vec<Value> {
    tools
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter(|tool| tool.get("input_schema").is_some())
                .filter_map(|tool| {
                    let name = tool.get("name").and_then(|v| v.as_str())?;
                    Some(json!({
                        "name": name,
                        "description": tool.get("description").and_then(|v| v.as_str()).unwrap_or(""),
                        "inputSchema": tool
                            .get("input_schema")
                            .cloned()
                            .unwrap_or_else(|| json!({"type": "object", "properties": {}})),
                    }))
                })
                .collect()
        })
        .unwrap_or_default()
}

/// 被跳过的非客户端工具名（仅本地诊断，绝不外发）。
pub fn skipped_server_tools(tools: &Value) -> Vec<String> {
    tools
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter(|tool| tool.get("input_schema").is_none())
                .filter_map(|tool| tool.get("name").and_then(|v| v.as_str()).map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}

/// CC 自己发起的 MCP 工具调用（`mcp__crag__*`）不外发：它是内核与 CLI 之间的内部
/// 协议，控制面只需要看到内核合成的 `crag_tool_*` 调用。返回 true 表示该事件要丢掉。
pub fn suppress_mcp_tool_use(event: &Value, dropped: &mut std::collections::HashSet<u64>) -> bool {
    let index = event.get("index").and_then(|v| v.as_u64());
    match event.get("type").and_then(|v| v.as_str()) {
        Some("content_block_start") => {
            let name = event
                .pointer("/content_block/name")
                .and_then(|v| v.as_str())
                .unwrap_or_default();
            let is_mcp = name.starts_with(MCP_TOOL_PREFIX);
            if is_mcp {
                if let Some(index) = index {
                    dropped.insert(index);
                }
            }
            is_mcp
        }
        Some("content_block_delta") | Some("content_block_stop") => index
            .map(|index| dropped.contains(&index))
            .unwrap_or(false),
        _ => false,
    }
}

/// 写两份配置：给 CC 的（只含 `mcpServers`）和给 bridge 的（只含 `crag`）。
///
/// 实测：把顶层 `crag` 键塞进 CC 的那份，CC 会直接 `Invalid MCP configuration` 退出；
/// 而 bridge 只认 `{"crag":{callbackUrl,tools}}`。因此必须拆成两个文件。
pub fn mcp_configs(
    exe: &std::path::Path,
    bridge_config: &std::path::Path,
    callback_url: &str,
    tools: Vec<Value>,
) -> (Value, Value) {
    let command = exe.to_string_lossy().to_string();
    let mut args = vec!["mcp-bridge".to_string()];
    args.push("--config".to_string());
    args.push(bridge_config.to_string_lossy().to_string());
    let for_cli = json!({
        "mcpServers": {
            // `type` 必填：Claude Code 2.1.321 会**静默丢弃**没有 type 的服务器，
            // 表现为客户端工具全部消失、模型只能用容器内建 bash（实测踩过）。
            "crag": {"type": "stdio", "command": command, "args": args}
        }
    });
    let for_bridge = json!({ "crag": { "callbackUrl": callback_url, "tools": tools } });
    (for_cli, for_bridge)
}

/// 合成一条只含 `tool_use` 的 assistant 消息（标准 Anthropic SSE 序列）。
/// 控制面据此执行工具，再用同一端点带 `tool_result` 续跳。
pub fn tool_use_sse(model: &str, calls: &[(String, String, Value)]) -> Vec<(String, String)> {
    let message = json!({
        "id": format!("msg_{}", crate::protocol::identity::new_uuid().replace('-', "")),
        "type": "message",
        "role": "assistant",
        "model": model,
        "content": [],
        "stop_reason": Value::Null,
        "stop_sequence": Value::Null,
        "usage": {"input_tokens": 0, "output_tokens": 0},
    });
    let mut events = vec![(
        "message_start".to_string(),
        json!({"type": "message_start", "message": message}).to_string(),
    )];
    for (index, (id, name, input)) in calls.iter().enumerate() {
        events.push((
            "content_block_start".to_string(),
            json!({
                "type": "content_block_start",
                "index": index,
                "content_block": {"type": "tool_use", "id": id, "name": name, "input": {}},
            })
            .to_string(),
        ));
        events.push((
            "content_block_delta".to_string(),
            json!({
                "type": "content_block_delta",
                "index": index,
                "delta": {
                    "type": "input_json_delta",
                    "partial_json": serde_json::to_string(input).unwrap_or_else(|_| "{}".into()),
                },
            })
            .to_string(),
        ));
        events.push((
            "content_block_stop".to_string(),
            json!({"type": "content_block_stop", "index": index}).to_string(),
        ));
    }
    events.push((
        "message_delta".to_string(),
        json!({"type": "message_delta", "delta": {"stop_reason": "tool_use"}, "usage": {"output_tokens": 0}}).to_string(),
    ));
    events.push(("message_stop".to_string(), json!({"type": "message_stop"}).to_string()));
    events
}

/// 本地观测：一跳一行，**只写本机、只记元数据**（不含 prompt/回复正文）。
/// 上游 issue #1119/#1114 能定位故障全靠同类产物；它从不进入上游请求。
pub fn observe(session: &str, hop: &Value) {
    let dir = std::env::temp_dir().join("crag-obs");
    if std::fs::create_dir_all(&dir).is_err() {
        return;
    }
    let path = dir.join(format!("{}.jsonl", session_tag(session)));
    let mut line = serde_json::to_string(hop).unwrap_or_default();
    line.push('\n');
    use std::io::Write;
    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(&path) {
        let _ = file.write_all(line.as_bytes());
    }
}

/// 会话池：同一会话复用同一个 CLI 进程。
///
/// 官方 CLI 的 `--print --input-format stream-json` 支持**一进程多轮**（每写一帧
/// 用户消息就产出一轮 `result`，实测 2.1.321），因此工具回环与多轮对话都靠它：
/// 内核只需按会话把帧写进同一个 stdin，再把该轮的 stdout 帧回投。
static INST_SEQ: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(1);

pub struct Pool {
    /// 实例标识（诊断用）：TUI 模式下可能同时存在多个 Pool，靠它分辨。
    inst: usize,
    host: Arc<Host>,
    idle: Duration,
    /// 并发会话上限（面板 `session_slots`），超出时按 LRU 摘除最久未用者。
    max_sessions: usize,
    /// 面板下发的空闲上限（None 表示用构造时的默认值）。
    idle_override: tokio::sync::Mutex<Option<std::time::Duration>>,
    /// MCP 工具等待上限。
    tool_timeout: Duration,
    /// 回调基址（`http://127.0.0.1:<port>/_crag-v2/mcp/<token>` 的前半段）。
    callback_base: std::sync::Mutex<Option<String>>,
    sessions: tokio::sync::Mutex<HashMap<String, Live>>,
    /// 游离 park：TUI 模式没有 native 会话，工具调用只能挂在这里（键 = 工具 id）。
    detached: tokio::sync::Mutex<HashMap<String, Pending>>,
}

struct Pending {
    name: String,
    input: Value,
    /// 入表时间：游离表靠它做 TTL 清理。
    at: std::time::Instant,
    tx: tokio::sync::oneshot::Sender<Value>,
}

struct Live {
    child: tokio::process::Child,
    stdin: tokio::process::ChildStdin,
    /// 当前在跑的那一轮的接收端；无轮次时空闲（帧丢弃）。
    turn: Arc<tokio::sync::Mutex<Option<tokio::sync::mpsc::UnboundedSender<Value>>>>,
    stderr: Arc<std::sync::Mutex<String>>,
    /// 被 park 的 MCP 工具调用：`crag_tool_<uuid>` → (工具名, 入参, 结果回灌)。
    pending: HashMap<String, Pending>,
    /// park 时刻的历史形状指纹；续跳必须与之一致。
    fingerprint: Option<u64>,
    last_used: std::time::Instant,
}

impl Pool {
    pub fn new(host: Arc<Host>, idle: Duration, max_sessions: usize, tool_timeout: Duration) -> Self {
        Self {
            inst: INST_SEQ.fetch_add(1, std::sync::atomic::Ordering::Relaxed),
            host,
            idle,
            max_sessions: max_sessions.clamp(1, 128),
            idle_override: tokio::sync::Mutex::new(None),
            tool_timeout,
            callback_base: std::sync::Mutex::new(None),
            sessions: tokio::sync::Mutex::new(HashMap::new()),
            detached: tokio::sync::Mutex::new(HashMap::new()),
        }
    }

    pub fn set_callback_base(&self, base: String) {
        if let Ok(mut slot) = self.callback_base.lock() {
            *slot = Some(base);
        }
    }

    pub fn callback_base(&self) -> Option<String> {
        self.callback_base.lock().ok().and_then(|slot| slot.clone())
    }

    pub fn exe() -> std::path::PathBuf {
        std::env::current_exe().unwrap_or_else(|_| std::path::PathBuf::from("crag-v2"))
    }

    /// 发起一轮：复用live会话，或在需要时拉起新进程。返回该轮的事件流。
    pub async fn turn(
        &self,
        key: &str,
        args: Vec<String>,
        frame: Value,
    ) -> Result<tokio::sync::mpsc::UnboundedReceiver<Value>, String> {
        let idle = self.idle_override.lock().await.unwrap_or(self.idle);
        let mut sessions = self.sessions.lock().await;
        let stale: Vec<String> = sessions
            .iter_mut()
            .filter_map(|(id, live)| {
                let dead = !matches!(live.child.try_wait(), Ok(None));
                (dead || live.last_used.elapsed() > idle).then(|| id.clone())
            })
            .collect();
        for id in stale {
            // 摘除时必须**杀进程**：只 remove 会留下 `claude --print` 孤儿
            // （实测一次工具调用后残留 191MB 进程，占着会话名额不放）。
            if let Some(mut live) = sessions.remove(&id) {
                let _ = live.child.start_kill();
                tokio::spawn(async move {
                    let _ = live.child.wait().await;
                });
            }
        }
        // 容量上限：摘掉最久未用且不在当前轮的会话（上游 `session_slots` 语义）。
        while sessions.len() >= self.max_sessions && !sessions.contains_key(key) {
            let victim = sessions
                .iter()
                .min_by_key(|(_, live)| live.last_used)
                .map(|(id, _)| id.clone());
            match victim {
                Some(id) => {
                    if let Some(mut live) = sessions.remove(&id) {
                        let _ = live.child.start_kill();
                        tokio::spawn(async move {
                            let _ = live.child.wait().await;
                        });
                    }
                }
                None => break,
            }
        }

        // 上一轮没收尾就来了新的一轮（CC 按 ESC 打断、客户端断连、park 被遗弃）：
        // CLI 进程仍在跑旧轮，若复用同一个进程，旧轮的输出会串进新请求，
        // 表现为"打断后后面的消息发不出去"。这里直接换新进程——
        // 我们每一跳都渲染完整历史，换进程不影响语义。
        let stuck = match sessions.get(key) {
            Some(live) => live.turn.lock().await.is_some(),
            None => false,
        };
        if stuck {
            if let Some(mut live) = sessions.remove(key) {
                let _ = live.child.start_kill();
                tokio::spawn(async move {
                    let _ = live.child.wait().await;
                });
            }
        }

        if !sessions.contains_key(key) {
            let live = spawn(&self.host, &args).await?;
            sessions.insert(key.to_string(), live);
        }
        let live = sessions.get_mut(key).expect("just inserted");

        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        *live.turn.lock().await = Some(tx);
        live.last_used = std::time::Instant::now();

        let mut line = serde_json::to_vec(&frame).unwrap_or_default();
        line.push(b'\n');
        if let Err(error) = live.stdin.write_all(&line).await {
            sessions.remove(key);
            return Err(format!("cli stdin closed: {error}"));
        }
        if let Err(error) = live.stdin.flush().await {
            sessions.remove(key);
            return Err(format!("cli stdin flush: {error}"));
        }
        Ok(rx)
    }

    /// 接一条新的续跳流（不写 stdin）：CC 正在等 MCP 结果，续跳只负责读后续事件。
    pub async fn attach(&self, key: &str) -> Option<tokio::sync::mpsc::UnboundedReceiver<Value>> {
        let mut sessions = self.sessions.lock().await;
        let live = sessions.get_mut(key)?;
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        *live.turn.lock().await = Some(tx);
        live.last_used = std::time::Instant::now();
        Some(rx)
    }

    /// park 一个 MCP 工具调用：返回调用 id 与结果接收端；同时把
    /// `crag_parked` 通知塞进当前跳的流，让调用方据此收尾。
    pub async fn park(
        &self,
        key: &str,
        name: &str,
        arguments: Value,
    ) -> Option<(String, tokio::sync::oneshot::Receiver<Value>)> {
        let id = format!(
            "{TOOL_ID_PREFIX}{}_{}",
            session_tag(key),
            crate::protocol::identity::new_uuid().replace('-', "")
        );
        let (tx, rx) = tokio::sync::oneshot::channel();
        let pending = Pending {
            name: name.to_string(),
            input: arguments.clone(),
            at: std::time::Instant::now(),
            tx,
        };
        let mut sessions = self.sessions.lock().await;
        if let Some(live) = sessions.get_mut(key) {
            live.pending.insert(id.clone(), pending);
            let notice = json!({
                PARKED_KIND_FIELD: PARKED_KIND,
                "calls": [{"id": id, "name": name, "input": arguments}],
            });
            if let Some(sink) = live.turn.lock().await.as_ref() {
                let _ = sink.send(notice);
            }
            return Some((id, rx));
        }
        drop(sessions);
        // TUI 模式没有 native 会话：挂到游离表，由 TUI 的流循环查出来合成 tool_use。
        let mut detached = self.detached.lock().await;
        let ttl = self.tool_timeout;
        detached.retain(|_, p| p.at.elapsed() < ttl);
        if detached.len() >= 256 {
            detached.clear();
        }
        detached.insert(id.clone(), pending);
        Some((id, rx))
    }

    /// 续跳里带回工具结果：解开 park 的调用。返回 `(解开数, 外来 id 数)`。
    /// 「外来 id」= id 的会话标签与本会话不一致（上半游 issue #1114：续跳被派到别的槽）。
    pub async fn resolve(
        &self,
        key: &str,
        results: &[(String, Vec<Value>, bool)],
    ) -> (usize, usize) {
        let tag = session_tag(key);
        let mut detached = self.detached.lock().await;
        let mut sessions = self.sessions.lock().await;
        let Some(live) = sessions.get_mut(key) else {
            // TUI 模式：工具挂在游离表里，直接在那里结算。
            let mut done = 0;
            let mut foreign = 0;
            let raw = format!("{TOOL_ID_PREFIX}{key}_");
            for (id, content, is_error) in results {
                if !id.starts_with(&format!("{TOOL_ID_PREFIX}{tag}_")) && !id.starts_with(&raw) {
                    foreign += 1;
                    continue;
                }
                if let Some(pending) = detached.remove(id) {
                    let payload = json!({"content": content, "isError": is_error});
                    if pending.tx.send(payload).is_ok() {
                        done += 1;
                    }
                }
            }
            return (done, foreign);
        };
        let mut done = 0;
        let mut foreign = 0;
        for (id, content, is_error) in results {
            if !id.starts_with(&format!("{TOOL_ID_PREFIX}{tag}_")) {
                foreign += 1;
                continue;
            }
            if let Some(pending) = live.pending.remove(id) {
                let payload = json!({"content": content, "isError": is_error});
                if pending.tx.send(payload).is_ok() {
                    done += 1;
                }
            }
        }
        (done, foreign)
    }

    /// 并发会话上限（面板 `session_slots`）。
    pub fn slots(&self) -> usize {
        self.max_sessions
    }

    /// 当前被 park 的调用清单（TUI 用它合成 `tool_use` 消息）。
    pub async fn pending_calls(&self, key: &str) -> Vec<(String, String, Value)> {
        // key 可能是会话键，也可能是桥 URL 里的 token（本身就已经是标签），两都认。
        let tag_prefix = format!("{TOOL_ID_PREFIX}{}_", session_tag(key));
        let raw_prefix = format!("{TOOL_ID_PREFIX}{key}_");
        let prefix = &tag_prefix;
        let mut out: Vec<(String, String, Value)> = {
            let sessions = self.sessions.lock().await;
            sessions
                .get(key)
                .map(|live| {
                    live.pending
                        .iter()
                        .map(|(id, pending)| {
                            (id.clone(), pending.name.clone(), pending.input.clone())
                        })
                        .collect()
                })
                .unwrap_or_default()
        };
        {
            let detached = self.detached.lock().await;
            out.extend(
                detached
                    .iter()
                    .filter(|(id, _)| id.starts_with(tag_prefix.as_str()) || id.starts_with(raw_prefix.as_str()))
                    .map(|(id, pending)| (id.clone(), pending.name.clone(), pending.input.clone())),
            );
        }
        out
    }

    /// 锁定本会话的历史形状（park 时调用）。
    pub async fn remember_fingerprint(&self, key: &str, fingerprint: u64) {
        let mut sessions = self.sessions.lock().await;
        if let Some(live) = sessions.get_mut(key) {
            live.fingerprint = Some(fingerprint);
        }
    }

    /// 续跳校验：形状不符返回 false（调用方回 400）。未锁定过则放行。
    pub async fn check_fingerprint(&self, key: &str, fingerprint: u64) -> bool {
        let mut sessions = self.sessions.lock().await;
        let Some(live) = sessions.get_mut(key) else {
            return true;
        };
        match live.fingerprint {
            None => true,
            Some(expected) => {
                if expected == fingerprint {
                    live.fingerprint = None;
                    true
                } else {
                    false
                }
            }
        }
    }

    /// 面板通过 `gateway_policy.session_idle_ttl_seconds` 下发会话空闲上限，
    /// 内核应该照办（我们不自己拍一个 600s）。
    pub async fn set_idle(&self, idle: std::time::Duration) {
        let mut guard = self.idle_override.lock().await;
        *guard = Some(idle);
    }

    /// park 超时后摘除条目：避免泄漏与「后到的续跳解开一个没人等的调用」。
    pub async fn forget(&self, key: &str, id: &str) {
        let mut sessions = self.sessions.lock().await;
        if let Some(live) = sessions.get_mut(key) {
            live.pending.remove(id);
        }
    }

    /// 打断某会话（`/internal/v1/cancel`）：杀进程并从池里摘除。
    pub async fn cancel(&self, key: &str) {
        let mut sessions = self.sessions.lock().await;
        if let Some(mut live) = sessions.remove(key) {
            let _ = live.child.start_kill();
            let _ = live.child.wait().await;
        }
    }

    /// 健康视图：live 进程 pid 与该会话最近的 stderr（诊断用）。
    pub async fn pids(&self) -> Vec<u32> {
        let mut sessions = self.sessions.lock().await;
        let mut pids = Vec::new();
        for live in sessions.values_mut() {
            if matches!(live.child.try_wait(), Ok(None)) {
                if let Some(pid) = live.child.id() {
                    pids.push(pid);
                }
            }
        }
        pids
    }

    pub fn tool_timeout(&self) -> Duration {
        self.tool_timeout
    }

    /// 健康视图：`(live 会话数, 已 park 的工具调用数)`。
    pub fn stats_now(&self) -> (usize, usize) {
        let Ok(sessions) = self.sessions.try_lock() else {
            return (0, 0);
        };
        let live = sessions.len();
        let parked = sessions.values().map(|live| live.pending.len()).sum();
        (live, parked)
    }

    /// 同步版 pid 视图（健康体是同步构建的）。
    pub fn pids_now(&self) -> Vec<u32> {
        let Ok(mut sessions) = self.sessions.try_lock() else {
            return Vec::new();
        };
        let mut pids = Vec::new();
        for live in sessions.values_mut() {
            if matches!(live.child.try_wait(), Ok(None)) {
                if let Some(pid) = live.child.id() {
                    pids.push(pid);
                }
            }
        }
        pids
    }

    /// 该会话最近的 stderr（脱敏后仅供诊断）。
    pub async fn diagnostics(&self, key: &str) -> String {
        let sessions = self.sessions.lock().await;
        sessions
            .get(key)
            .map(|live| live.stderr.lock().map(|t| t.clone()).unwrap_or_default())
            .unwrap_or_default()
    }

    pub async fn close(&self) {
        let mut sessions = self.sessions.lock().await;
        for (_, mut live) in sessions.drain() {
            let _ = live.child.start_kill();
            let _ = live.child.wait().await;
        }
    }
}

async fn spawn(host: &Host, args: &[String]) -> Result<Live, String> {
    let mut command = tokio::process::Command::new(&host.cli_bin);
    command
        .args(args)
        .current_dir(&host.cwd)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .kill_on_drop(true);
    for (key, value) in &host.env {
        command.env(key, value);
    }
    // 刻意**不**设置 DISABLE_TELEMETRY / DISABLE_ERROR_REPORTING：
    // 官方安装默认会上报遥测，把它关掉本身才是"不合官方要求"的特征。
    // 前提是槽的出口在合规地区（此时这些事件对官方是正常的）。
    let mut child = command
        .spawn()
        .map_err(|error| format!("cli spawn failed: {error}"))?;
    let stdin = child.stdin.take().ok_or("cli stdin unavailable")?;
    let stdout = child.stdout.take().ok_or("cli stdout unavailable")?;
    let stderr = Arc::new(std::sync::Mutex::new(String::new()));
    if let Some(pipe) = child.stderr.take() {
        let sink = Arc::clone(&stderr);
        tokio::spawn(async move {
            let mut reader = BufReader::new(pipe);
            let mut line = String::new();
            while reader.read_line(&mut line).await.unwrap_or(0) > 0 {
                let mut text = sink.lock().expect("stderr lock");
                if text.len() < 8192 {
                    text.push_str(&crate::ndjson::redact(&line));
                }
                line.clear();
            }
        });
    }
    let turn: Arc<tokio::sync::Mutex<Option<tokio::sync::mpsc::UnboundedSender<Value>>>> =
        Arc::new(tokio::sync::Mutex::new(None));
    {
        let slot = Arc::clone(&turn);
        tokio::spawn(async move {
            let mut lines = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                if line.trim().is_empty() {
                    continue;
                }
                let Ok(value) = serde_json::from_str::<Value>(line.trim()) else {
                    continue;
                };
                let terminal = value.get("type").and_then(|t| t.as_str()) == Some("result");
                {
                    let guard = slot.lock().await;
                    if let Some(tx) = guard.as_ref() {
                        let _ = tx.send(value);
                    }
                }
                if terminal {
                    *slot.lock().await = None;
                }
            }
            // 进程结束：清空轮次，让调用方看到流结束。
            *slot.lock().await = None;
        });
    }
    Ok(Live {
        child,
        stdin,
        turn,
        stderr,
        pending: HashMap::new(),
        fingerprint: None,
        last_used: std::time::Instant::now(),
    })
}

/// 内核自己的 MCP 回调服务（`127.0.0.1:<port>/_crag-v2/mcp/<token>`）。
///
/// bridge 子进程把 `tools/call` POST 上来后，这里 park 住等待续跳里的
/// `tool_result`；超时（300 s）则回错误，避免桥永久挂住。
pub async fn serve_callback(pool: Arc<Pool>) -> std::io::Result<std::net::SocketAddr> {
    let listener = tokio::net::TcpListener::bind(("127.0.0.1", 0)).await?;
    let addr = listener.local_addr()?;
    tokio::spawn(async move {
        loop {
            let Ok((socket, _)) = listener.accept().await else {
                continue;
            };
            let pool = Arc::clone(&pool);
            tokio::spawn(async move {
                let _ = handle_callback(socket, pool).await;
            });
        }
    });
    Ok(addr)
}

async fn handle_callback(mut socket: tokio::net::TcpStream, pool: Arc<Pool>) -> std::io::Result<()> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    let mut buf = Vec::new();
    let mut chunk = vec![0u8; 8192];
    let (head_end, path, want) = loop {
        let read = socket.read(&mut chunk).await?;
        if read == 0 {
            return Ok(());
        }
        buf.extend_from_slice(&chunk[..read]);
        if let Some(pos) = buf.windows(4).position(|w| w == b"\r\n\r\n") {
            let head = String::from_utf8_lossy(&buf[..pos]).to_string();
            let mut path = String::new();
            let mut want = 0usize;
            for (index, line) in head.lines().enumerate() {
                if index == 0 {
                    path = line.split(' ').nth(1).unwrap_or_default().to_string();
                } else if let Some(value) = line.to_ascii_lowercase().strip_prefix("content-length:") {
                    want = value.trim().parse().unwrap_or(0);
                }
            }
            break (pos + 4, path, want);
        }
    };

    let token = path
        .trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or_default()
        .to_string();

    let mut body = buf[head_end..].to_vec();
    while body.len() < want {
        let read = socket.read(&mut chunk).await?;
        if read == 0 {
            break;
        }
        body.extend_from_slice(&chunk[..read]);
    }

    async fn respond(socket: &mut tokio::net::TcpStream, status: &str, payload: Value) {
        let text = payload.to_string();
        let reply = format!(
            "HTTP/1.1 {status}\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{text}",
            text.len()
        );
        let _ = socket.write_all(reply.as_bytes()).await;
        let _ = socket.shutdown().await;
    }

    let parsed: Value = match serde_json::from_slice(&body) {
        Ok(value) => value,
        Err(_) => {
            respond(&mut socket, "400 Bad Request", json!({"error": {"message": "invalid JSON"}})).await;
            return Ok(());
        }
    };
    let name = parsed.get("name").and_then(|v| v.as_str()).unwrap_or_default().to_string();
    let arguments = parsed.get("arguments").cloned().unwrap_or_else(|| json!({}));
    if token.is_empty() || name.is_empty() {
        respond(&mut socket, "400 Bad Request", json!({"error": {"message": "missing token or tool name"}})).await;
        return Ok(());
    }

    let tuid = parsed
        .get("_meta")
        .and_then(|m| m.get("claudecode/toolUseId"))
        .and_then(|v| v.as_str())
        .unwrap_or("-")
        .to_string();
    let Some((id, rx)) = pool.park(&token, &name, arguments).await else {
        respond(&mut socket, "404 Not Found", json!({"error": {"message": "unknown MCP callback"}})).await;
        return Ok(());
    };
    match tokio::time::timeout(pool.tool_timeout(), rx).await {
        Ok(Ok(payload)) => {
            respond(&mut socket, "200 OK", payload).await;
        }
        _ => {
            pool.forget(&token, &id).await;
            respond(
                &mut socket,
                "504 Gateway Timeout",
                json!({"error": {"message": "MCP tool wait expired"}}),
            )
            .await;
        }
    }
    Ok(())
}

    #[test]
    fn render_initial_prompt_carries_history() {
        let body = serde_json::json!({
            "messages": [
                {"role": "user", "content": "暗号 ORANGE"},
                {"role": "assistant", "content": [{"type": "text", "text": "记住了"}]},
                {"role": "user", "content": [{"type": "text", "text": "暗号是什么"}]},
            ]
        });
        let prompt = render_initial_prompt(&body).expect("应渲染出 prompt");
        assert!(prompt.contains("<conversation_history>"), "{prompt}");
        assert!(prompt.contains("[user]
暗号 ORANGE"), "历史必须带上：{prompt}");
        assert!(prompt.contains("[assistant]
记住了"), "{prompt}");
        assert!(prompt.contains("<current_turn>
暗号是什么"), "{prompt}");
        // 历史只到倒数第二条，不能把本轮重复一次。
        assert_eq!(prompt.matches("暗号是什么").count(), 1);
    }

    #[test]
    fn render_initial_prompt_without_history_is_just_current_turn() {
        let body = serde_json::json!({"messages": [{"role": "user", "content": "hello"}]});
        let prompt = render_initial_prompt(&body).unwrap();
        assert!(!prompt.contains("<conversation_history>"));
        assert_eq!(prompt, "<current_turn>
hello
</current_turn>");
    }

    #[test]
    fn render_initial_prompt_renders_tool_blocks() {
        let body = serde_json::json!({
            "messages": [
                {"role": "assistant", "content": [
                    {"type": "tool_use", "id": "t1", "name": "Read", "input": {"path": "/a"}}
                ]},
                {"role": "user", "content": [
                    {"type": "tool_result", "tool_use_id": "t1", "content": "file body"}
                ]},
                {"role": "user", "content": "continue"},
            ]
        });
        let prompt = render_initial_prompt(&body).unwrap();
        assert!(prompt.contains("[tool call Read]"), "{prompt}");
        assert!(prompt.contains("[tool result t1]"), "{prompt}");
        assert!(prompt.contains("file body"), "{prompt}");
    }
