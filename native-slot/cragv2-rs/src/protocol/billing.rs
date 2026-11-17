//! billing 段：`x-anthropic-billing-header` 的生成与索引重算。
//!
//! 真值：`11_CRAG_V2_SPEC.md` §6.2 ②，字段顺序照现网
//! `billingIndexesFromMessages()` / billing header 模板：
//!
//! ```text
//! x-anthropic-billing-header: cc_version=<v>; cc_entrypoint=<e>;[ cch=<5hex>;]
//!   [ cc_prev_req=<uuid>;][ cc_prompt_id=<uuid>;][ cc_turn_origin=<tag>;]
//!   [ cc_prompt_index=<n>; cc_turn_index=<n>;]
//!   [ cc_gateway=<id>;][ cc_project=<id>; cc_project_src=<src>;]
//! ```
//!
//! 收紧项：`cc_gateway` / `cc_project` 只从可信上下文发出，**绝不造值**。

use serde_json::Value;

/// 单条消息的角色（兼容 `{message:{role}}` 包装）。
fn message_role(message: &Value) -> &str {
    if let Some(role) = message.get("role").and_then(|v| v.as_str()) {
        return role;
    }
    message
        .get("message")
        .and_then(|m| m.get("role"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
}

fn message_content(message: &Value) -> Option<&Value> {
    message
        .get("content")
        .or_else(|| message.get("message").and_then(|m| m.get("content")))
}

/// 只含 `tool_result` 块的消息不算一次 prompt。
fn tool_result_only(message: &Value) -> bool {
    let Some(Value::Array(blocks)) = message_content(message) else {
        return false;
    };
    !blocks.is_empty()
        && blocks
            .iter()
            .all(|b| b.get("type").and_then(|v| v.as_str()) == Some("tool_result"))
}

/// `(promptIndex, turnIndex)`；无有效 prompt 时返回 `None`。
pub fn billing_indexes_from_messages(messages: &[Value]) -> Option<(i64, i64)> {
    let mut prompts = 0i64;
    let mut assistants = 0i64;
    for message in messages {
        match message_role(message) {
            "assistant" => assistants += 1,
            "user" if !tool_result_only(message) => prompts += 1,
            _ => {}
        }
    }
    if prompts < 1 {
        return None;
    }
    Some((prompts - 1, assistants + 1))
}

/// `boundedBillingIndex`：只接受 `[min, 1e7]` 区间内的整数，其余返回 `None`。
pub fn bounded_billing_index(value: Option<i64>, min: i64) -> Option<i64> {
    match value {
        Some(v) if v >= min && v <= 10_000_000 => Some(v),
        _ => None,
    }
}

/// 索引上界钳制（现网 `boundedBillingIndex`）。
fn bounded(index: Option<i64>, fallback: i64) -> Option<i64> {
    match index {
        Some(v) if v >= 0 => Some(v.min(9999)),
        _ => Some(fallback),
    }
}

/// billing 段的可选上下文。缺省字段一律不输出（不造值）。
#[derive(Default, Clone, Debug)]
pub struct BillingContext {
    pub prev_req_id: Option<String>,
    pub prompt_id: Option<String>,
    pub turn_origin: Option<String>,
    pub prompt_index: Option<i64>,
    pub turn_index: Option<i64>,
    pub gateway: Option<String>,
    pub project: Option<String>,
    pub project_source: Option<String>,
    /// 是否输出 `cc_*` 子字段（对应现网 `includeSub`）。
    pub include_sub: bool,
}

fn is_uuid(value: &str) -> bool {
    let b = value.as_bytes();
    b.len() == 36
        && b.iter().enumerate().all(|(i, c)| match i {
            8 | 13 | 18 | 23 => *c == b'-',
            _ => c.is_ascii_hexdigit(),
        })
}

fn is_turn_origin(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 32
        && value
            .bytes()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'_' || c == b'-')
}

/// 生成 billing 头文本（不含换行）。
pub fn billing_header(version: &str, entrypoint: &str, cch: Option<&str>, ctx: &BillingContext) -> String {
    let mut out = format!("x-anthropic-billing-header: cc_version={version}; cc_entrypoint={entrypoint};");
    if let Some(value) = cch.filter(|v| v.len() == 5) {
        out.push_str(&format!(" cch={value};"));
    }
    if ctx.include_sub {
        if let Some(prev) = ctx.prev_req_id.as_deref().filter(|v| is_uuid(v)) {
            out.push_str(&format!(" cc_prev_req={prev};"));
        }
        if let Some(prompt) = ctx.prompt_id.as_deref().filter(|v| is_uuid(v)) {
            out.push_str(&format!(" cc_prompt_id={prompt};"));
        }
        if let Some(origin) = ctx.turn_origin.as_deref().filter(|v| is_turn_origin(v)) {
            out.push_str(&format!(" cc_turn_origin={origin};"));
        }
        if let (Some(p), Some(t)) = (bounded(ctx.prompt_index, 0), bounded(ctx.turn_index, 1)) {
            out.push_str(&format!(" cc_prompt_index={p}; cc_turn_index={t};"));
        }
    }
    if let Some(gateway) = ctx.gateway.as_deref().filter(|v| !v.is_empty()) {
        out.push_str(&format!(" cc_gateway={gateway};"));
    }
    if let (Some(project), Some(source)) = (
        ctx.project.as_deref().filter(|v| !v.is_empty()),
        ctx.project_source.as_deref().filter(|v| !v.is_empty()),
    ) {
        out.push_str(&format!(" cc_project={project}; cc_project_src={source};"));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn counts_prompts_and_turns_skipping_tool_results() {
        let messages = vec![
            json!({"role":"user","content":"hi"}),
            json!({"role":"assistant","content":[{"type":"text","text":"yo"}]}),
            json!({"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":"ok"}]}),
        ];
        assert_eq!(billing_indexes_from_messages(&messages), Some((0, 2)));
    }

    #[test]
    fn no_prompt_means_no_indexes() {
        let messages = vec![json!({"role":"assistant","content":[]})];
        assert_eq!(billing_indexes_from_messages(&messages), None);
    }

    #[test]
    fn header_omits_untrusted_gateway_and_project() {
        let header = billing_header("2.1.303", "cli", Some("abcde"), &BillingContext::default());
        assert_eq!(
            header,
            "x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli; cch=abcde;"
        );
    }

    #[test]
    fn header_never_invents_project() {
        let ctx = BillingContext {
            include_sub: true,
            project_source: Some("cwd".into()),
            ..Default::default()
        };
        let header = billing_header("2.1.303", "cli", None, &ctx);
        assert!(!header.contains("cc_project="), "{header}");
    }
}
