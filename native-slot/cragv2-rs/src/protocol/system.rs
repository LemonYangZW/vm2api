//! system 布局与 billing 头格式化。
//!
//! 真值：现网 `src/kin/systemLayout.ts`（经 `native-slot/testdata/jsref/modules.cjs`
//! 的 `wireSystemBlocks` / `finalizeZeroBilling` / `withCchPlaceholder*` 与
//! `leftoverFromSystemPrompt`）。crag v2 直连同样需要这一层，否则 system 布局
//! 一漂移，缓存前缀与 billing 分段就全变。

use regex::Regex;
use serde_json::{json, Value};

/// 官方身份块（`layoutSystemBlocks` 的 stock/identity 布局都插它）。
pub const IDENTITY: &str = "You are Claude Code, Anthropic's official CLI for Claude.";

/// system 布局模式。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SystemLayout {
    /// 官方默认：attribution + IDENTITY + environment + leftover。
    Stock,
    /// 只有身份块（`identity|id|block`）。
    Identity,
    /// 只保留 billing 头（`zero`）。
    Zero,
}

/// `CLAUDE_CODE_SYSTEM_LAYOUT` / `SYSTEM_MODE`。
pub fn system_layout() -> SystemLayout {
    let raw = std::env::var("CLAUDE_CODE_SYSTEM_LAYOUT")
        .or_else(|_| std::env::var("SYSTEM_MODE"))
        .unwrap_or_default();
    match raw.trim().to_ascii_lowercase().as_str() {
        "zero" => SystemLayout::Zero,
        "identity" | "id" | "block" => SystemLayout::Identity,
        _ => SystemLayout::Stock,
    }
}

/// `CLAUDE_CODE_TIMEZONE` / `SLOT_TZ` / `TZ`，默认 `America/New_York`。
pub fn kin_timezone() -> String {
    for key in ["CLAUDE_CODE_TIMEZONE", "SLOT_TZ", "TZ"] {
        if let Ok(value) = std::env::var(key) {
            let value = value.trim();
            if !value.is_empty() {
                return value.to_string();
            }
        }
    }
    "America/New_York".to_string()
}

/// environment 块文本。
pub fn environment_block(timezone: &str) -> String {
    format!("# Environment\n - Timezone: {timezone}")
}

fn re_prompt_version_angle() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"\s*prompt_version=<[^>]*>;?").unwrap())
}

fn re_prompt_version_plain() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"\s*prompt_version=[^;]*;?").unwrap())
}

fn re_cch() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?i)\s*\bcch=[^;]*;?").unwrap())
}

fn re_prompt_id() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"\bcc_prompt_id=").unwrap())
}

/// 不带前导空白的 cch 匹配：`withCchPlaceholderInPlace` 要保留原空格。
fn re_cch_bare() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new("(?i)\\bcch=[^;]*;?").unwrap())
}

fn re_entrypoint() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"\bcc_entrypoint=[^;]*;").unwrap())
}

fn re_billing_prefix() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?i)^\s*x-anthropic-billing-header:").unwrap())
}

fn trim_end_whitespace(text: &str) -> String {
    text.trim_end().to_string()
}

/// `finalizeZeroBilling`：把 attribution 归一成 zero 布局的 billing 头。
pub fn finalize_zero_billing(attribution: &str, prompt_id: &str) -> String {
    let mut header = attribution.trim().to_string();
    if header.is_empty() {
        header = "x-anthropic-billing-header:".to_string();
    }
    if !re_billing_prefix().is_match(&header) {
        header = format!("x-anthropic-billing-header: {header}");
    }
    header = re_prompt_version_angle().replace_all(&header, "").to_string();
    header = re_prompt_version_plain().replace_all(&header, "").to_string();
    header = re_cch().replace_all(&header, "").to_string();
    header = trim_end_whitespace(&header);
    if !header.ends_with(';') {
        header.push(';');
    }
    if !re_prompt_id().is_match(&header) {
        header.push_str(&format!(" cc_prompt_id={prompt_id};"));
    }
    format!("{header} cch=00000; prompt_version=<{IDENTITY}>")
}

/// `withCchPlaceholder`：清空所有 cch 值，末尾补 `cch=00000;`。
pub fn with_cch_placeholder(header: &str) -> String {
    let reset = re_cch().replace_all(header, "").to_string();
    let base = if reset.ends_with(';') {
        reset
    } else {
        format!("{reset};")
    };
    format!("{base} cch=00000;")
}

/// `withCchPlaceholderInPlace`：原位重置首个 cch，没有则在 entrypoint 后插入。
pub fn with_cch_placeholder_in_place(header: &str) -> String {
    let mut found = false;
    let reset = re_cch_bare()
        .replace_all(header, |_: &regex::Captures<'_>| {
            if found {
                String::new()
            } else {
                found = true;
                "cch=00000;".to_string()
            }
        })
        .to_string();
    if found {
        return reset;
    }
    if let Some(caps) = re_entrypoint().captures(&reset) {
        let matched = caps.get(0).map(|m| m.as_str().to_string()).unwrap_or_default();
        return re_entrypoint()
            .replace(&reset, format!("{matched} cch=00000;"))
            .to_string();
    }
    let base = if reset.ends_with(';') {
        reset
    } else {
        format!("{reset};")
    };
    format!("{base} cch=00000;")
}

fn is_billing_line(text: &str) -> bool {
    re_billing_prefix().is_match(text)
}

/// `wireSystemBlocks`：把「标准 persona system」重写成 wire 形状。
/// 非标准输入（不是 `[{text}]`）返回 `None`（调用方保留原始 system）。
pub fn wire_system_blocks(system: &Value, profile: bool) -> Option<Vec<Value>> {
    let blocks = system.as_array()?;
    if blocks.is_empty() {
        return None;
    }
    let mut out = Vec::with_capacity(blocks.len());
    for block in blocks {
        let object = block.as_object()?;
        let text = object.get("text").and_then(|v| v.as_str())?;
        let next_text = if is_billing_line(text) {
            if profile {
                with_cch_placeholder_in_place(text)
            } else {
                with_cch_placeholder(text)
            }
        } else {
            text.to_string()
        };
        let mut next = serde_json::Map::new();
        next.insert("type".into(), json!("text"));
        next.insert("text".into(), json!(next_text));
        if let Some(cache_control) = object.get("cache_control").filter(|v| v.is_object()) {
            next.insert("cache_control".into(), cache_control.clone());
        }
        out.push(Value::Object(next));
    }
    (!out.is_empty()).then_some(out)
}

/// 默认 agent 字段（我们自己的内核注入的文本，需要从 leftover 里剔除）。
fn is_default_agent_field(text: &str) -> bool {
    text.contains("persistent Crag") || text.contains("persistent Kin") || text.contains("mcp__runtime__")
}

/// `billingFromSystemPrompt`：取第一条 billing 头文本。
pub fn billing_from_system_prompt(system: &[String]) -> Option<String> {
    system
        .iter()
        .map(|line| line.trim())
        .find(|line| line.starts_with("x-anthropic-billing-header"))
        .map(str::to_string)
}

/// `leftoverFromSystemPrompt`：剔除 billing / IDENTITY / environment / 默�� agent 字段。
pub fn leftover_from_system_prompt(system: &[String]) -> Option<String> {
    let parts: Vec<&str> = system
        .iter()
        .filter(|line| {
            let text = line.trim();
            !text.is_empty()
                && !text.starts_with("x-anthropic-billing-header")
                && text != IDENTITY
                && !text.starts_with("# Environment")
                && !is_default_agent_field(text)
        })
        .map(|line| line.as_str())
        .collect();
    (!parts.is_empty()).then(|| parts.join("\n\n"))
}

/// `layoutSystemBlocks`：按布局拼出 system 块列表（env 驱动）。
pub fn layout_system_blocks(layout: SystemLayout, attribution: &str, leftover: Option<&str>) -> Vec<String> {
    layout_system_blocks_with(layout, &kin_timezone(), attribution, leftover, &crate::protocol::identity::new_uuid())
}

/// 参数化版本（便于差分测试与显式指定）。
pub fn layout_system_blocks_with(
    layout: SystemLayout,
    timezone: &str,
    attribution: &str,
    leftover: Option<&str>,
    prompt_id: &str,
) -> Vec<String> {
    let mut blocks = Vec::new();
    let attribution = attribution.trim();
    match layout {
        SystemLayout::Zero => blocks.push(finalize_zero_billing(attribution, prompt_id)),
        _ => {
            if !attribution.is_empty() {
                blocks.push(with_cch_placeholder(attribution));
            }
            blocks.push(IDENTITY.to_string());
        }
    }
    blocks.push(environment_block(timezone));
    if let Some(leftover) = leftover.filter(|v| !v.is_empty()) {
        blocks.push(leftover.to_string());
    }
    blocks
}

/// 布局名 → 枚举（`stock` / `identity` / `zero`，差分测试用）。
pub fn layout_from_str(raw: &str) -> SystemLayout {
    match raw.trim().to_ascii_lowercase().as_str() {
        "zero" => SystemLayout::Zero,
        "identity" | "id" | "block" => SystemLayout::Identity,
        _ => SystemLayout::Stock,
    }
}

/// 布局名（与现网 `getSystemLayout` 输出一致）。
pub fn layout_name(layout: SystemLayout) -> &'static str {
    match layout {
        SystemLayout::Zero => "zero",
        SystemLayout::Identity => "identity",
        SystemLayout::Stock => "stock",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn placeholder_appends_and_resets() {
        assert_eq!(
            with_cch_placeholder("x-anthropic-billing-header: cc_version=2.1.303; cch=abcde;"),
            "x-anthropic-billing-header: cc_version=2.1.303; cch=00000;"
        );
        assert_eq!(
            with_cch_placeholder("x-anthropic-billing-header: cc_version=2.1.303;"),
            "x-anthropic-billing-header: cc_version=2.1.303; cch=00000;"
        );
    }

    #[test]
    fn placeholder_in_place_keeps_position() {
        assert_eq!(
            with_cch_placeholder_in_place("x-anthropic-billing-header: cc_entrypoint=cli; cch=abcde; cc_version=2;"),
            "x-anthropic-billing-header: cc_entrypoint=cli; cch=00000; cc_version=2;"
        );
        assert_eq!(
            with_cch_placeholder_in_place("x-anthropic-billing-header: cc_entrypoint=cli;"),
            "x-anthropic-billing-header: cc_entrypoint=cli; cch=00000;"
        );
    }

    #[test]
    fn zero_billing_strips_prompt_version_and_stamps() {
        let header = finalize_zero_billing(
            "x-anthropic-billing-header: cc_version=2.1.303; prompt_version=<abc>; cch=abcde;",
            "11111111-2222-3333-4444-555555555555",
        );
        assert!(!header.contains("prompt_version=<abc>"), "{header}");
        assert!(header.contains("cc_prompt_id=11111111-2222-3333-4444-555555555555;"), "{header}");
        assert!(header.ends_with(&format!("cch=00000; prompt_version=<{IDENTITY}>")), "{header}");
    }

    #[test]
    fn wire_rewrites_billing_and_keeps_cache_control() {
        let system = json!([
            {"type": "text", "text": "x-anthropic-billing-header: cc_version=2.1.303; cch=abcde;"},
            {"type": "text", "text": "hello", "cache_control": {"type": "ephemeral"}}
        ]);
        let out = wire_system_blocks(&system, false).unwrap();
        assert_eq!(out[0]["text"], "x-anthropic-billing-header: cc_version=2.1.303; cch=00000;");
        assert_eq!(out[1]["cache_control"]["type"], "ephemeral");
        assert_eq!(out[1]["type"], "text");
    }

    #[test]
    fn wire_rejects_non_standard_system() {
        assert!(wire_system_blocks(&json!("plain string"), false).is_none());
        assert!(wire_system_blocks(&json!([{"type": "text"}]), false).is_none());
        assert!(wire_system_blocks(&json!([]), false).is_none());
    }

    #[test]
    fn leftover_drops_billing_identity_env_and_agent_fields() {
        let system = vec![
            "x-anthropic-billing-header: cc_version=2.1.303;".to_string(),
            IDENTITY.to_string(),
            "# Environment\n - Timezone: UTC".to_string(),
            "persistent Crag tools".to_string(),
            "keep me".to_string(),
            "also me".to_string(),
        ];
        assert_eq!(
            leftover_from_system_prompt(&system).as_deref(),
            Some("keep me\n\nalso me")
        );
    }

    #[test]
    fn zero_layout_emits_single_billing_block() {
        let blocks = layout_system_blocks(SystemLayout::Zero, "x-anthropic-billing-header: cc_version=2.1.303;", None);
        assert_eq!(blocks.len(), 2, "{blocks:?}");
        assert!(blocks[0].starts_with("x-anthropic-billing-header:"), "{blocks:?}");
        assert!(blocks[1].starts_with("# Environment"), "{blocks:?}");
    }
}
