//! 发往上游前的最后一道闸：只拦 Anthropic **必定拒绝**的形状。
//!
//! 真值：现网 Go 内核 `internal/upstream/preflight.go`（已与上游报错文案对齐，
//! 控制面据 `tool_pair` 走修复重试）。命中时请求不出网，直接返回同类 400；
//! 拿不准会不会被拒的一律放行。

use serde_json::Value;

/// 预检失败。
#[derive(Debug, Clone)]
pub struct Failure {
    pub error: String,
    pub code: &'static str,
    pub status: u16,
    pub error_type: &'static str,
    pub upstream_code: Option<&'static str>,
}

fn text(value: Option<&Value>) -> &str {
    value.and_then(|v| v.as_str()).unwrap_or("")
}

fn list(value: Option<&Value>) -> Vec<Value> {
    value
        .and_then(|v| v.as_array())
        .map(|items| items.to_vec())
        .unwrap_or_default()
}

/// 缓存标记规则（与控制面 `validateCacheBreakpoints` 一致）。
fn check_cache_markers(req: &Value) -> Option<(&'static str, &'static str)> {
    let mut count = 0usize;
    let mut short = false;
    let mut inspect = |node: &Value| -> Option<(&'static str, &'static str)> {
        let Some(object) = node.as_object() else { return None };
        let Some(raw) = object.get("cache_control") else { return None };
        if raw.is_null() {
            return None;
        }
        let kind = text(object.get("type"));
        if kind == "thinking" || kind == "redacted_thinking" {
            return Some((
                "Cache breakpoints are not allowed on thinking blocks.",
                "invalid_cache_control",
            ));
        }
        let control = raw.as_object();
        let mut ttl = control.and_then(|c| c.get("ttl"));
        if ttl.is_some_and(|v| v.is_null()) {
            ttl = None;
        }
        let control_type = control.and_then(|c| c.get("type"));
        let ttl_value = ttl.and_then(|v| v.as_str());
        let bad_ttl = ttl.is_some() && ttl_value != Some("5m") && ttl_value != Some("1h");
        if control.is_none() || control_type.and_then(|v| v.as_str()) != Some("ephemeral") || bad_ttl {
            return Some((
                "Cache control must be ephemeral with an optional 5m or 1h TTL.",
                "invalid_cache_control",
            ));
        }
        if short && ttl_value == Some("1h") {
            return Some((
                "Cache TTL must place 1h before 5m (including missing TTL).",
                "invalid_cache_control",
            ));
        }
        if ttl_value != Some("1h") {
            short = true;
        }
        count += 1;
        if count > 4 {
            return Some(("Cache control exceeds four breakpoints.", "invalid_cache_control"));
        }
        None
    };

    let mut nodes: Vec<Value> = Vec::new();
    nodes.extend(list(req.get("tools")));
    nodes.extend(list(req.get("system")));
    for message in list(req.get("messages")) {
        nodes.extend(list(message.get("content")));
    }
    // 自动缓存落在消息尾部，排在显式标记之后。
    nodes.push(req.clone());
    for node in &nodes {
        if let Some(failure) = inspect(node) {
            return Some(failure);
        }
    }
    None
}

/// 消息形状与工具配对。
fn check_messages(req: &Value) -> Option<String> {
    let messages = match req.get("messages").and_then(|v| v.as_array()) {
        Some(items) if !items.is_empty() => items,
        _ => return Some("messages: at least one message is required".to_string()),
    };

    struct Turn {
        role: String,
        first: usize,
        blocks: Vec<Value>,
    }
    let mut turns: Vec<Turn> = Vec::new();
    for (index, raw) in messages.iter().enumerate() {
        let Some(message) = raw.as_object() else {
            return Some(format!("messages.{index}: Input should be a valid object"));
        };
        let role = text(message.get("role")).to_string();
        if role != "user" && role != "assistant" && role != "system" {
            return Some(format!(
                "messages.{index}.role: Input should be 'user' or 'assistant'"
            ));
        }
        let content = message.get("content");
        if !content.is_some_and(|v| v.is_string() || v.is_array()) {
            return Some(format!("messages.{index}.content: Input should be a valid list"));
        }
        let blocks = list(content);
        if let Some(last) = turns.last_mut() {
            if last.role == role {
                last.blocks.extend(blocks);
                continue;
            }
        }
        turns.push(Turn { role, first: index, blocks });
    }

    let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut pending: Vec<String> = Vec::new();
    for turn in &turns {
        // system 消息不参与工具配对，视作透明。
        if turn.role == "system" {
            continue;
        }
        if turn.role == "assistant" {
            for block in &turn.blocks {
                let Some(object) = block.as_object() else { continue };
                if text(object.get("type")) != "tool_use" {
                    continue;
                }
                let id = text(object.get("id")).to_string();
                if !seen.insert(id.clone()) {
                    return Some(format!(
                        "messages.{}: `tool_use` ids must be unique: {id}",
                        turn.first
                    ));
                }
                pending.push(id);
            }
            continue;
        }

        let mut open: std::collections::HashSet<String> = pending.iter().cloned().collect();
        for block in &turn.blocks {
            let Some(object) = block.as_object() else { continue };
            if text(object.get("type")) != "tool_result" {
                continue;
            }
            let id = text(object.get("tool_use_id")).to_string();
            if !open.remove(&id) {
                return Some(format!(
                    "messages.{}: unexpected `tool_use_id` found in `tool_result` blocks: {id}. \
                     Each `tool_result` block must have a corresponding `tool_use` block in the previous message.",
                    turn.first
                ));
            }
        }
        let missing: Vec<String> = pending
            .iter()
            .filter(|id| open.contains(*id))
            .cloned()
            .collect();
        if !missing.is_empty() {
            return Some(format!(
                "messages: `tool_use` ids were found without `tool_result` blocks immediately after: {}. \
                 Each `tool_use` block must have a corresponding `tool_result` block in the next message.",
                missing.join(", ")
            ));
        }
        pending.clear();
    }
    // 末尾 assistant turn 的 tool_use 不判：是否允许以它收尾交给上游。
    None
}

/// 预检入口：`None` 表示放行。
pub fn preflight(body: &[u8]) -> Option<Failure> {
    let Ok(req) = serde_json::from_slice::<Value>(body) else {
        return Some(Failure {
            error: "request body is not a JSON object".into(),
            code: "cli_error",
            status: 502,
            error_type: "api_error",
            upstream_code: None,
        });
    };
    if !req.is_object() {
        return Some(Failure {
            error: "request body is not a JSON object".into(),
            code: "cli_error",
            status: 502,
            error_type: "api_error",
            upstream_code: None,
        });
    }
    if let Some((error, upstream_code)) = check_cache_markers(&req) {
        return Some(Failure {
            error: error.into(),
            code: "upstream_invalid_request",
            status: 400,
            error_type: "invalid_request_error",
            upstream_code: Some(upstream_code),
        });
    }
    if let Some(error) = check_messages(&req) {
        return Some(Failure {
            error,
            code: "upstream_invalid_request",
            status: 400,
            error_type: "invalid_request_error",
            upstream_code: None,
        });
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn check(value: Value) -> Option<Failure> {
        preflight(serde_json::to_string(&value).unwrap().as_bytes())
    }

    #[test]
    fn accepts_a_normal_request() {
        assert!(check(json!({
            "model": "claude-opus-5-5",
            "messages": [{"role": "user", "content": "hi"}]
        }))
        .is_none());
    }

    #[test]
    fn rejects_non_object_body() {
        let failure = preflight(b"[1,2,3]").unwrap();
        assert_eq!((failure.status, failure.code), (502, "cli_error"));
    }

    #[test]
    fn rejects_thinking_cache_markers() {
        let failure = check(json!({
            "messages": [{"role": "assistant", "content": [
                {"type": "thinking", "thinking": "x", "cache_control": {"type": "ephemeral"}}
            ]}]
        }))
        .unwrap();
        assert_eq!(failure.status, 400);
        assert!(failure.error.contains("thinking blocks"), "{}", failure.error);
    }

    #[test]
    fn rejects_1h_after_5m() {
        let failure = check(json!({
            "system": [
                {"type": "text", "text": "a", "cache_control": {"type": "ephemeral", "ttl": "5m"}},
                {"type": "text", "text": "b", "cache_control": {"type": "ephemeral", "ttl": "1h"}}
            ],
            "messages": [{"role": "user", "content": "hi"}]
        }))
        .unwrap();
        assert!(failure.error.contains("1h before 5m"), "{}", failure.error);
    }

    #[test]
    fn rejects_more_than_four_breakpoints() {
        let blocks: Vec<Value> = (0..5)
            .map(|i| json!({"type": "text", "text": format!("s{i}"), "cache_control": {"type": "ephemeral"}}))
            .collect();
        let failure = check(json!({
            "system": blocks,
            "messages": [{"role": "user", "content": "hi"}]
        }))
        .unwrap();
        assert!(failure.error.contains("four breakpoints"), "{}", failure.error);
    }

    #[test]
    fn rejects_empty_messages() {
        let failure = check(json!({"messages": []})).unwrap();
        assert!(failure.error.contains("at least one message"));
    }

    #[test]
    fn rejects_bad_role() {
        let failure = check(json!({"messages": [{"role": "tool", "content": "x"}]})).unwrap();
        assert!(failure.error.contains("Input should be 'user' or 'assistant'"));
    }

    #[test]
    fn rejects_orphan_tool_result() {
        let failure = check(json!({
            "messages": [
                {"role": "user", "content": [
                    {"type": "tool_result", "tool_use_id": "t9", "content": "x"}
                ]}
            ]
        }))
        .unwrap();
        assert!(failure.error.contains("unexpected `tool_use_id`"), "{}", failure.error);
    }

    #[test]
    fn rejects_missing_tool_result() {
        let failure = check(json!({
            "messages": [
                {"role": "assistant", "content": [
                    {"type": "tool_use", "id": "t1", "name": "x", "input": {}}
                ]},
                {"role": "user", "content": [{"type": "text", "text": "next"}]}
            ]
        }))
        .unwrap();
        assert!(failure.error.contains("without `tool_result`"), "{}", failure.error);
    }

    #[test]
    fn accepts_paired_tool_use_and_result() {
        assert!(check(json!({
            "messages": [
                {"role": "assistant", "content": [
                    {"type": "tool_use", "id": "t1", "name": "x", "input": {}}
                ]},
                {"role": "user", "content": [
                    {"type": "tool_result", "tool_use_id": "t1", "content": "ok"}
                ]}
            ]
        }))
        .is_none());
    }

    #[test]
    fn trailing_assistant_tool_use_is_allowed() {
        assert!(check(json!({
            "messages": [
                {"role": "user", "content": "hi"},
                {"role": "assistant", "content": [
                    {"type": "tool_use", "id": "t1", "name": "x", "input": {}}
                ]}
            ]
        }))
        .is_none());
    }
}
