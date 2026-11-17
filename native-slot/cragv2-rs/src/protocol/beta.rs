//! 官方 beta 注册表、排序与请求级分流。
//!
//! 真值：`11_CRAG_V2_SPEC.md` §7.2（`BETA_REGISTRY` / `ENV_BETA_SKIP`），
//! 以及现网 `src/lib/protocol/claude-code-betas.mjs`（经
//! `native-slot/testdata/jsref/modules.cjs` 的 `withRequestProtocolBetas` /
//! `mergeOfficialExtraBetas` / `setupTokenBetaHeader`）。
//!
//! 顺序即出站 `anthropic-beta` 的排序键：主表在前，其余按首次出现追加。

/// 主表 beta（顺序敏感，勿随意调整）。
pub const OFFICIAL_MESSAGE_BETAS: &[&str] = &[
    "claude-code-20250219",
    "oauth-2025-04-20",
    "interleaved-thinking-2025-05-14",
    "thinking-token-count-2026-05-13",
    "context-management-2025-06-27",
    "prompt-caching-scope-2026-01-05",
    "per-turn-control-2026-07-01",
    "mid-conversation-tool-changes-2026-07-01",
    "advanced-tool-use-2025-11-20",
    "mid-conversation-system-clear-at-2026-08-21",
    "effort-2025-11-24",
    "thinking-binding-controls-2026-08-01",
    "extended-cache-ttl-2025-04-11",
    "cache-diagnosis-2026-04-07",
];

/// EXTRA beta：`mergeOfficialExtraBetas` 会无条件注入这两条（现网口径）。
pub const EXTRA_BETAS: &[&str] = &[
    "thinking-token-count-2026-05-13",
    "mid-conversation-system-2026-04-07",
];

// ---- 请求级 beta 分流（`withRequestProtocolBetas`）----

const BETA_OAUTH: &str = "oauth-2025-04-20";
const BETA_INTERLEAVED: &str = "interleaved-thinking-2025-05-14";
const BETA_CONTEXT_MANAGEMENT: &str = "context-management-2025-06-27";
const BETA_MID_CONVERSATION_SYSTEM: &str = "mid-conversation-system-2026-04-07";
const BETA_MID_CONVERSATION_SYSTEM_CLEAR_AT: &str = "mid-conversation-system-clear-at-2026-08-21";
const BETA_MID_CONVERSATION_TOOL_CHANGES: &str = "mid-conversation-tool-changes-2026-07-01";
const BETA_MID_CONVERSATION_OUTPUT_CONFIG: &str = "mid-conversation-output-config-2026-07-01";
const BETA_ADVANCED_TOOL_USE: &str = "advanced-tool-use-2025-11-20";
const BETA_THINKING_BINDING_CONTROLS: &str = "thinking-binding-controls-2026-08-01";
const BETA_EFFORT: &str = "effort-2025-11-24";
const BETA_EXTENDED_CACHE_TTL: &str = "extended-cache-ttl-2025-04-11";
const BETA_CACHE_DIAGNOSIS: &str = "cache-diagnosis-2026-04-07";
const BETA_FALLBACK_CREDIT: &str = "fallback-credit-2026-06-01";
const BETA_THINKING_DISPLAY_UPDATES: &str = "thinking-display-updates-2026-08-18";
const BETA_DANGEROUS_TOOL_USE: &str = "dangerous-tool-use-2026-09-03";

const PER_TURN_MODELS: &[&str] = &[
    "claude-haiku-5-5",
    "claude-sonnet-5-5",
    "claude-opus-5-5",
    "claude-fable-5-1",
];
const MID_TOOL_CHANGE_MODELS: &[&str] = &[
    "claude-haiku-5-5",
    "claude-sonnet-5-5",
    "claude-opus-4-8",
    "claude-opus-5",
    "claude-opus-5-5",
    "claude-fable-5",
    "claude-fable-5-1",
    "claude-mythos-5-1",
];
const FAST_MODE_MODELS: &[&str] = &["claude-opus-4-8", "claude-opus-5", "claude-opus-5-5"];
const MID_OUTPUT_CONFIG_MODELS: &[&str] = &[
    "claude-haiku-5-5",
    "claude-sonnet-5-5",
    "claude-opus-5",
    "claude-opus-5-5",
    "claude-fable-5-1",
    "claude-mythos-5-1",
];

/// `ENV_BETA_SKIP` 的默认值：现网 `LU()` 剔掉的通常可用 header + 环境变量追加。
pub fn env_beta_skip() -> Vec<String> {
    let mut out: Vec<String> = crate::protocol::tables::ENV_BETA_SKIP
        .iter()
        .map(|s| s.to_string())
        .collect();
    out.extend(
        std::env::var("KIN_ENV_BETA_SKIP")
            .unwrap_or_default()
            .split([',', ' '])
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_string),
    );
    out
}

/// 命名 beta → 出站 header 值（查不到时原样返回，便于自定义 beta 透传）。
pub fn header_for(name: &str) -> &str {
    crate::protocol::tables::BETA_REGISTRY
        .iter()
        .find(|(key, _)| *key == name)
        .map(|(_, header)| *header)
        .unwrap_or(name)
}

/// 全部已知 beta header（诊断/测试用）。
pub fn known_headers() -> Vec<&'static str> {
    crate::protocol::tables::BETA_REGISTRY
        .iter()
        .map(|(_, header)| *header)
        .collect()
}

/// 按主表顺序重排调用方给出的 beta 列表，并把未知项追加到末尾（去重、保序）。
pub fn order_betas(tokens: &[String]) -> Vec<String> {
    let skip = env_beta_skip();
    let is_skipped = |tok: &str| skip.iter().any(|s| s == tok);
    let mut out: Vec<String> = Vec::with_capacity(tokens.len());
    for tok in OFFICIAL_MESSAGE_BETAS {
        if is_skipped(tok) {
            continue;
        }
        if tokens.iter().any(|t| t == tok) {
            out.push((*tok).to_string());
        }
    }
    for tok in tokens {
        if tok.trim().is_empty() || is_skipped(tok) {
            continue;
        }
        if !out.iter().any(|t| t == tok) {
            out.push(tok.clone());
        }
    }
    out
}

/// 出站 `anthropic-beta` 头值。
pub fn beta_header(tokens: &[String]) -> String {
    order_betas(tokens).join(",")
}

/// `mergeOfficialExtraBetas`：先注入 EXTRA，再按主表顺序排，其余追加。
pub fn merge_official_extra_betas(tokens: &[String]) -> Vec<String> {
    let mut have: Vec<String> = tokens.to_vec();
    for beta in EXTRA_BETAS {
        if !have.iter().any(|t| t == beta) {
            have.push((*beta).to_string());
        }
    }
    let mut out: Vec<String> = Vec::with_capacity(have.len());
    for beta in OFFICIAL_MESSAGE_BETAS {
        if have.iter().any(|t| t == beta) {
            out.push((*beta).to_string());
        }
    }
    for token in &have {
        if !out.iter().any(|t| t == token) {
            out.push(token.clone());
        }
    }
    out
}

/// `body.model` 归一：取最后一段、去掉 `[1m]` 与尾部 `-\d{8}`。
fn normalize_model(model: &str) -> String {
    let last = model.rsplit('/').next().unwrap_or(model);
    let cleaned = last.replace("[1m]", "").replace("[1M]", "");
    let bytes = cleaned.as_bytes();
    if bytes.len() > 9 {
        let tail = &cleaned[bytes.len() - 9..];
        if tail.starts_with('-') && tail[1..].bytes().all(|b| b.is_ascii_digit()) {
            return cleaned[..bytes.len() - 9].to_string();
        }
    }
    cleaned
}

fn has_hour_cache(node: &serde_json::Value) -> bool {
    match node {
        serde_json::Value::Array(items) => items.iter().any(has_hour_cache),
        serde_json::Value::Object(map) => {
            let hour = map
                .get("cache_control")
                .and_then(|control| control.get("ttl"))
                .and_then(|ttl| ttl.as_str())
                == Some("1h");
            hour || map.get("content").is_some_and(has_hour_cache)
        }
        _ => false,
    }
}

fn not_null(value: Option<&serde_json::Value>) -> bool {
    value.is_some_and(|v| !v.is_null())
}

fn truthy(value: Option<&serde_json::Value>) -> bool {
    value.is_some_and(|v| {
        !v.is_null() && *v != serde_json::Value::Bool(false) && v.as_str() != Some("")
    })
}

/// `withRequestProtocolBetas`：按请求内容补齐协议 beta（顺序 = 首次出现顺序）。
pub fn with_request_protocol_betas(tokens: &[String], body: &serde_json::Value) -> Vec<String> {
    let mut betas: Vec<String> = Vec::new();
    for token in tokens {
        if !token.trim().is_empty() && !betas.iter().any(|t| t == token) {
            betas.push(token.clone());
        }
    }
    let mut add = |token: &str| {
        if !betas.iter().any(|t| t == token) {
            betas.push(token.to_string());
        }
    };

    let empty = serde_json::Map::new();
    let map = body.as_object().unwrap_or(&empty);
    let model = normalize_model(map.get("model").and_then(|v| v.as_str()).unwrap_or_default());

    if PER_TURN_MODELS.contains(&model.as_str()) {
        add("per-turn-control-2026-07-01");
    }
    if MID_TOOL_CHANGE_MODELS.contains(&model.as_str()) {
        add(BETA_MID_CONVERSATION_TOOL_CHANGES);
    }
    if not_null(map.get("thread")) && MID_OUTPUT_CONFIG_MODELS.contains(&model.as_str()) {
        add(BETA_MID_CONVERSATION_OUTPUT_CONFIG);
    }
    let output_config = map.get("output_config").and_then(|v| v.as_object());
    if output_config.is_some_and(|config| not_null(config.get("effort"))) {
        add(BETA_EFFORT);
    }
    if map
        .get("thinking")
        .and_then(|v| v.get("display"))
        .and_then(|v| v.as_str())
        == Some("updates")
    {
        add(BETA_THINKING_DISPLAY_UPDATES);
    }
    if map.get("safeguards").and_then(|v| v.as_array()).is_some_and(|items| {
        items
            .iter()
            .any(|item| item.get("type").and_then(|v| v.as_str()) == Some("dangerous_tool_use"))
    }) {
        add(BETA_DANGEROUS_TOOL_USE);
    }
    if output_config.is_some_and(|config| truthy(config.get("format"))) {
        add("structured-outputs-2025-12-15");
    }
    if output_config.is_some_and(|config| not_null(config.get("task_budget"))) {
        add("task-budgets-2026-03-13");
    }
    if not_null(map.get("context_management")) {
        add(BETA_CONTEXT_MANAGEMENT);
    }
    if map.get("speed").and_then(|v| v.as_str()) == Some("fast")
        && FAST_MODE_MODELS.contains(&model.as_str())
    {
        add("fast-mode-2026-02-01");
    }
    if let Some(tools) = map.get("tools").and_then(|v| v.as_array()) {
        for tool in tools {
            if tool.get("strict").and_then(|v| v.as_bool()) == Some(true) {
                add("structured-outputs-2025-12-15");
            }
            let deferred = tool.get("defer_loading").and_then(|v| v.as_bool()) == Some(true);
            let search = tool
                .get("type")
                .and_then(|v| v.as_str())
                .is_some_and(|kind| kind.starts_with("tool_search_tool_"));
            if deferred || search {
                add(BETA_ADVANCED_TOOL_USE);
            }
        }
    }
    if map
        .get("thinking")
        .and_then(|v| v.get("block_binding"))
        .is_some_and(|value| truthy(Some(value)))
    {
        add(BETA_THINKING_BINDING_CONTROLS);
    }
    if not_null(map.get("thread")) {
        add("message-threads-2026-08-12");
    }
    if not_null(map.get("diagnostics")) {
        add(BETA_CACHE_DIAGNOSIS);
    }
    match map.get("fallbacks") {
        Some(serde_json::Value::String(value)) if value == "default" => {
            add("server-side-fallback-2026-07-01")
        }
        Some(serde_json::Value::Array(items)) if !items.is_empty() => {
            add("server-side-fallback-2026-06-01")
        }
        _ => {}
    }
    if let Some(token) = map.get("fallback_credit_token").and_then(|v| v.as_str()) {
        let len = token.chars().count();
        if len > 0 && len <= 2048 {
            add(BETA_FALLBACK_CREDIT);
        }
    }
    if map
        .get("cache_control")
        .and_then(|v| v.get("evict_on_complete"))
        .and_then(|v| v.as_bool())
        == Some(true)
    {
        add("prompt-caching-evict-2026-05-12");
    }
    if has_hour_cache(body)
        || map.get("system").is_some_and(has_hour_cache)
        || map.get("tools").is_some_and(has_hour_cache)
        || map.get("messages").is_some_and(has_hour_cache)
    {
        add(BETA_EXTENDED_CACHE_TTL);
    }
    if let Some(messages) = map.get("messages").and_then(|v| v.as_array()) {
        let (mut has_system, mut has_clear_at) = (false, false);
        let (mut has_output_config, mut has_effort, mut has_format, mut has_budget) =
            (false, false, false, false);
        for message in messages {
            let Some(message) = message.as_object() else { continue };
            if message.get("role").and_then(|v| v.as_str()) == Some("system") {
                has_system = true;
            }
            if not_null(message.get("clear_at")) {
                has_clear_at = true;
            }
            let Some(config) = message.get("output_config").and_then(|v| v.as_object()) else {
                continue;
            };
            has_output_config = true;
            if not_null(config.get("effort")) {
                has_effort = true;
            }
            if truthy(config.get("format")) {
                has_format = true;
            }
            if not_null(config.get("task_budget")) {
                has_budget = true;
            }
        }
        if has_system {
            add(BETA_MID_CONVERSATION_SYSTEM);
        }
        if has_clear_at {
            add(BETA_MID_CONVERSATION_SYSTEM_CLEAR_AT);
        }
        if has_output_config {
            add(BETA_MID_CONVERSATION_OUTPUT_CONFIG);
        }
        if has_effort {
            add(BETA_EFFORT);
        }
        if has_format {
            add("structured-outputs-2025-12-15");
        }
        if has_budget {
            add("task-budgets-2026-03-13");
        }
    }
    betas
}

/// `isLegacyHaiku`：名字含 haiku 但不是 haiku-5 系列。
fn is_legacy_haiku(model: &str) -> bool {
    let lower = model.to_ascii_lowercase();
    lower.contains("haiku") && !lower.contains("haiku-5")
}

/// `setupTokenBetaHeader`：旧 haiku 只带 oauth + interleaved。
pub fn setup_token_beta_header(model: &str) -> String {
    if is_legacy_haiku(model) {
        return format!("{BETA_OAUTH},{BETA_INTERLEAVED}");
    }
    format!("{BETA_OAUTH},{BETA_INTERLEAVED},{BETA_CONTEXT_MANAGEMENT}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn main_table_order_wins_over_caller_order() {
        let tokens = vec![
            "effort-2025-11-24".to_string(),
            "claude-code-20250219".to_string(),
            "vendor-custom-2026".to_string(),
        ];
        assert_eq!(
            order_betas(&tokens),
            vec![
                "claude-code-20250219".to_string(),
                "effort-2025-11-24".to_string(),
                "vendor-custom-2026".to_string()
            ]
        );
    }

    #[test]
    fn registry_maps_names_to_headers() {
        assert_eq!(header_for("claude_code"), "claude-code-20250219");
        assert_eq!(header_for("custom-beta-2026"), "custom-beta-2026");
        assert!(known_headers().len() >= 30);
    }

    #[test]
    fn merge_injects_extra_betas() {
        let merged = merge_official_extra_betas(&["effort-2025-11-24".to_string()]);
        assert_eq!(merged[0], "thinking-token-count-2026-05-13");
        assert!(merged.contains(&"mid-conversation-system-2026-04-07".to_string()));
        assert!(merged.contains(&"effort-2025-11-24".to_string()));
    }

    #[test]
    fn duplicate_tokens_collapse() {
        let tokens = vec![
            "oauth-2025-04-20".to_string(),
            "oauth-2025-04-20".to_string(),
        ];
        assert_eq!(order_betas(&tokens).len(), 1);
    }

    #[test]
    fn request_betas_follow_model_capabilities() {
        let betas = with_request_protocol_betas(
            &[],
            &json!({"model": "claude-opus-5-5", "max_tokens": 8}),
        );
        assert!(betas.contains(&"per-turn-control-2026-07-01".to_string()), "{betas:?}");
        assert!(
            betas.contains(&"mid-conversation-tool-changes-2026-07-01".to_string()),
            "{betas:?}"
        );
        // 未知模型不注入模型相关 beta
        let betas = with_request_protocol_betas(&[], &json!({"model": "unknown-model"}));
        assert!(betas.is_empty(), "{betas:?}");
    }

    #[test]
    fn request_betas_pick_up_body_features() {
        let betas = with_request_protocol_betas(
            &[],
            &json!({
                "model": "unknown",
                "context_management": {"edits": []},
                "diagnostics": {"enabled": true},
                "fallbacks": [{"model": "x"}],
                "fallback_credit_token": "tok",
                "cache_control": {"evict_on_complete": true},
                "tools": [{"name": "t", "strict": true}],
                "messages": [{"role": "user", "content": [
                    {"type": "text", "text": "x", "cache_control": {"type": "ephemeral", "ttl": "1h"}}
                ]}]
            }),
        );
        for expected in [
            "context-management-2025-06-27",
            "cache-diagnosis-2026-04-07",
            "server-side-fallback-2026-06-01",
            "fallback-credit-2026-06-01",
            "prompt-caching-evict-2026-05-12",
            "structured-outputs-2025-12-15",
            "extended-cache-ttl-2025-04-11",
        ] {
            assert!(betas.iter().any(|b| b == expected), "缺少 {expected}: {betas:?}");
        }
    }

    #[test]
    fn setup_token_betas_follow_model_family() {
        assert_eq!(
            setup_token_beta_header("claude-3-5-haiku"),
            "oauth-2025-04-20,interleaved-thinking-2025-05-14"
        );
        assert_eq!(
            setup_token_beta_header("claude-haiku-5-5"),
            "oauth-2025-04-20,interleaved-thinking-2025-05-14,context-management-2025-06-27"
        );
    }
}
