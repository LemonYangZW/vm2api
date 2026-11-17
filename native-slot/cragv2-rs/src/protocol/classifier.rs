//! 分类器请求（auto mode classifier）的 system 组装与上下文校验。
//!
//! 真值：现网 `src/kin/classifierRequest.ts`（经 `testdata/jsref/modules.cjs` 的
//! `classifierSystemBlocks` / `validClassifierContext`）。

use serde_json::{json, Value};

/// 分类器上下文允许的键。
pub const CONTEXT_KEYS: &[&str] = &["purpose", "format", "stage"];
/// purpose 固定值。
pub const PURPOSE: &str = "auto_mode_classifier";
/// 工具分类器的结果工具名。
pub const TOOL_NAME: &str = "classify_result";
/// XML 分类器允许的 stage。
pub const XML_STAGES: &[&str] = &["xml_s1", "xml_s2", "fast"];

fn is_billing_block(text: &str) -> bool {
    let trimmed = text.trim_start();
    let lower = trimmed.to_ascii_lowercase();
    lower.starts_with("x-anthropic-billing-header:")
}

/// `classifierSystemBlocks`：归一成块数组、剔除 billing 块、可选前置 attribution。
pub fn classifier_system_blocks(system: &Value, attribution: Option<&str>) -> Vec<Value> {
    let blocks: Vec<Value> = match system {
        Value::String(text) => vec![json!({"type": "text", "text": text})],
        Value::Array(items) => items.clone(),
        _ => Vec::new(),
    };
    let mut kept: Vec<Value> = Vec::with_capacity(blocks.len());
    for block in blocks {
        let text = block.get("text").and_then(|v| v.as_str()).unwrap_or_default();
        if is_billing_block(text) {
            continue;
        }
        kept.push(block);
    }
    match attribution {
        Some(text) => {
            let mut out = Vec::with_capacity(kept.len() + 1);
            out.push(json!({"type": "text", "text": text}));
            out.extend(kept);
            out
        }
        None => kept,
    }
}

/// `validClassifierContext`：判断 `context` 是否是合法的分类器请求上下文。
pub fn valid_classifier_context(context: &Value, request: &Value) -> bool {
    let Some(map) = context.as_object() else {
        return false;
    };
    if map.keys().any(|key| !CONTEXT_KEYS.contains(&key.as_str())) {
        return false;
    }
    if map.get("purpose").and_then(|v| v.as_str()) != Some(PURPOSE) {
        return false;
    }
    // `stage === undefined` 对应「键不存在」；显式 null 不算。
    let stage_missing = map.get("stage").is_none();

    match map.get("format").and_then(|v| v.as_str()) {
        Some("tool") => {
            let choice = request.get("tool_choice");
            let choice_ok = choice
                .and_then(|c| c.get("type"))
                .and_then(|v| v.as_str())
                == Some("tool")
                && choice
                    .and_then(|c| c.get("name"))
                    .and_then(|v| v.as_str())
                    == Some(TOOL_NAME);
            let has_tool = request
                .get("tools")
                .and_then(|v| v.as_array())
                .is_some_and(|tools| {
                    tools
                        .iter()
                        .any(|tool| tool.get("name").and_then(|v| v.as_str()) == Some(TOOL_NAME))
                });
            stage_missing && choice_ok && has_tool
        }
        Some("xml") => {
            let stage_ok = match map.get("stage") {
                None => true,
                Some(value) => {
                    let text = match value {
                        Value::String(text) => text.clone(),
                        other => other.to_string(),
                    };
                    XML_STAGES.contains(&text.as_str())
                }
            };
            // `request.tool_choice === undefined`：键必须不存在。
            let no_choice = request.get("tool_choice").is_none();
            let has_transcript = serde_json::to_string(&request.get("messages").cloned().unwrap_or(Value::Null))
                .unwrap_or_default()
                .contains("<transcript>");
            stage_ok && no_choice && has_transcript
        }
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn drops_billing_blocks_and_prepends_attribution() {
        let system = json!([
            {"type": "text", "text": "x-anthropic-billing-header: cc_version=2.1.303;"},
            {"type": "text", "text": "keep"},
        ]);
        let blocks = classifier_system_blocks(&system, Some("attr"));
        assert_eq!(blocks.len(), 2);
        assert_eq!(blocks[0]["text"], "attr");
        assert_eq!(blocks[1]["text"], "keep");

        // 字符串 system 会被包成块
        let blocks = classifier_system_blocks(&json!("hello"), None);
        assert_eq!(blocks, vec![json!({"type": "text", "text": "hello"})]);
        // 非字符串非数组 → 空
        assert!(classifier_system_blocks(&json!(123), None).is_empty());
    }

    #[test]
    fn validates_tool_classifier_context() {
        let request = json!({
            "tool_choice": {"type": "tool", "name": "classify_result"},
            "tools": [{"name": "classify_result"}]
        });
        assert!(valid_classifier_context(
            &json!({"purpose": PURPOSE, "format": "tool"}),
            &request
        ));
        // 带 stage 不合法
        assert!(!valid_classifier_context(
            &json!({"purpose": PURPOSE, "format": "tool", "stage": "xml_s1"}),
            &request
        ));
        // 多余键不合法
        assert!(!valid_classifier_context(
            &json!({"purpose": PURPOSE, "format": "tool", "extra": 1}),
            &request
        ));
        // 缺工具不合法
        assert!(!valid_classifier_context(
            &json!({"purpose": PURPOSE, "format": "tool"}),
            &json!({"tool_choice": {"type": "tool", "name": "classify_result"}})
        ));
    }

    #[test]
    fn validates_xml_classifier_context() {
        let request = json!({"messages": [{"role": "user", "content": "<transcript>...</transcript>"}]});
        assert!(valid_classifier_context(
            &json!({"purpose": PURPOSE, "format": "xml"}),
            &request
        ));
        assert!(valid_classifier_context(
            &json!({"purpose": PURPOSE, "format": "xml", "stage": "fast"}),
            &request
        ));
        // 非法 stage
        assert!(!valid_classifier_context(
            &json!({"purpose": PURPOSE, "format": "xml", "stage": "html"}),
            &request
        ));
        // 带 tool_choice 不合法
        assert!(!valid_classifier_context(
            &json!({"purpose": PURPOSE, "format": "xml"}),
            &json!({"messages": [{"content": "<transcript>"}], "tool_choice": null})
        ));
        // 缺 transcript
        assert!(!valid_classifier_context(
            &json!({"purpose": PURPOSE, "format": "xml"}),
            &json!({"messages": [{"content": "plain"}]})
        ));
    }
}
