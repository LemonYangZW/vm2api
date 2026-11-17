//! 缓存 marker 规则（内核自有段）。
//!
//! 真值：现网 `src/kin/cacheTtl.ts`（经 `testdata/jsref/modules.cjs` 的
//! `applyKinOwnedCacheMarkers` / `fillMissingCacheTtl` / `capCacheMarkers` /
//! `keepSingleMessageCacheMarker` / `explicitCacheTtl`）。
//!
//! 三条硬规则（与现网一致）：
//! 1. marker 总数上限 4（`MAX_CACHE_MARKERS`），超了按 tools→system→messages 的
//!    **逆序**先删；
//! 2. `thinking` / `redacted_thinking` 块永不带 `cache_control`；
//! 3. 已经显式写了 `ttl` 的 marker 不改写；只给「有 marker 但缺 ttl」的补默认值。

use serde_json::{json, Value};

/// 缓存 marker 总数上限。
pub const MAX_CACHE_MARKERS: usize = 4;

/// 归一化 TTL：只认 `5m` / `1h`。
pub fn normalize_ttl(value: Option<&Value>) -> Option<&'static str> {
    let raw = match value {
        Some(Value::String(text)) => text.trim().to_ascii_lowercase(),
        Some(other) if other.is_number() || other.is_boolean() => other.to_string(),
        _ => return None,
    };
    match raw.as_str() {
        "5m" => Some("5m"),
        "1h" => Some("1h"),
        _ => None,
    }
}

fn cache_control_ttl(node: &Value) -> Option<&Value> {
    node.get("cache_control").and_then(|control| control.get("ttl"))
}

fn note_explicit_ttl(node: &Value, five: &mut bool, hour: &mut bool) {
    if let Some(items) = node.as_array() {
        for item in items {
            note_explicit_ttl(item, five, hour);
        }
        return;
    }
    if !node.is_object() {
        return;
    }
    match normalize_ttl(cache_control_ttl(node)) {
        Some("5m") => *five = true,
        Some("1h") => *hour = true,
        _ => {}
    }
    if let Some(content) = node.get("content").and_then(|v| v.as_array()) {
        for item in content {
            note_explicit_ttl(item, five, hour);
        }
    }
}

/// 调用方显式声明的 TTL（`5m` 优先于 `1h`）。
pub fn explicit_cache_ttl(parts: &[&Value]) -> Option<&'static str> {
    let (mut five, mut hour) = (false, false);
    for part in parts {
        note_explicit_ttl(part, &mut five, &mut hour);
    }
    if five {
        Some("5m")
    } else if hour {
        Some("1h")
    } else {
        None
    }
}

/// `resolveKinCacheTtl`：显式 TTL 优先，其次面板配置，最后 `1h`。
pub fn resolve_kin_cache_ttl(
    system: Option<&Value>,
    tools: Option<&Value>,
    messages: Option<&Value>,
    panel_ttl: Option<&Value>,
) -> String {
    let parts: Vec<&Value> = [system, tools, messages].into_iter().flatten().collect();
    if let Some(ttl) = explicit_cache_ttl(&parts) {
        return ttl.to_string();
    }
    if let Some(ttl) = normalize_ttl(panel_ttl) {
        return ttl.to_string();
    }
    "1h".to_string()
}

/// marker 所在位置（用于跨段裁剪）。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Section {
    System,
    Tools,
    Messages,
}

/// 一个 marker 的位置：`index` 是段内位置，`block` 是 messages 内的块位置。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MarkerLoc {
    pub section: Section,
    pub index: usize,
    pub block: Option<usize>,
}

fn has_marker(node: &Value) -> bool {
    node.get("cache_control").is_some_and(|control| !control.is_null())
}

/// 收集所有带 marker 的位置（system / tools / messages[*].content[*]）。
pub fn collect_markers(params: &Value) -> Vec<MarkerLoc> {
    let mut hits = Vec::new();
    let system_blocks: Vec<&Value> = match params.get("system") {
        Some(Value::Array(items)) => items.iter().collect(),
        Some(single) if !single.is_null() => vec![single],
        _ => Vec::new(),
    };
    for (index, block) in system_blocks.iter().enumerate() {
        if has_marker(block) {
            hits.push(MarkerLoc { section: Section::System, index, block: None });
        }
    }
    if let Some(tools) = params.get("tools").and_then(|v| v.as_array()) {
        for (index, tool) in tools.iter().enumerate() {
            if has_marker(tool) {
                hits.push(MarkerLoc { section: Section::Tools, index, block: None });
            }
        }
    }
    if let Some(messages) = params.get("messages").and_then(|v| v.as_array()) {
        for (index, message) in messages.iter().enumerate() {
            let Some(content) = message.get("content").and_then(|v| v.as_array()) else { continue };
            for (block, item) in content.iter().enumerate() {
                if has_marker(item) {
                    hits.push(MarkerLoc {
                        section: Section::Messages,
                        index,
                        block: Some(block),
                    });
                }
            }
        }
    }
    hits
}

fn block_mut<'a>(params: &'a mut Value, loc: MarkerLoc) -> Option<&'a mut Value> {
    match loc.section {
        Section::System => match params.get_mut("system")? {
            Value::Array(items) => items.get_mut(loc.index),
            single => (loc.index == 0).then_some(single),
        },
        Section::Tools => params.get_mut("tools")?.as_array_mut()?.get_mut(loc.index),
        Section::Messages => params
            .get_mut("messages")?
            .as_array_mut()?
            .get_mut(loc.index)?
            .get_mut("content")?
            .as_array_mut()?
            .get_mut(loc.block?),
    }
}

fn drop_marker(params: &mut Value, loc: MarkerLoc) {
    if let Some(block) = block_mut(params, loc) {
        if let Some(object) = block.as_object_mut() {
            object.remove("cache_control");
        }
    }
}

fn rewrite_block(block: &mut Value, ttl: &str) {
    let Some(object) = block.as_object_mut() else { return };
    let Some(control) = object.get("cache_control").and_then(|v| v.as_object()) else {
        return;
    };
    if let Some(kind) = control.get("type") {
        if !kind.is_null() && kind.as_str() != Some("ephemeral") {
            return;
        }
    }
    let mut next = serde_json::Map::new();
    next.insert("type".into(), json!("ephemeral"));
    next.insert("ttl".into(), json!(ttl));
    if let Some(scope) = control.get("scope").and_then(|v| v.as_str()) {
        if scope == "global" || scope == "org" {
            next.insert("scope".into(), json!(scope));
        }
    }
    object.insert("cache_control".into(), Value::Object(next));
}

fn stamp_block(block: &mut Value, ttl: &str) {
    let Some(object) = block.as_object() else { return };
    let Some(control) = object.get("cache_control") else { return };
    if !control.is_object() {
        return;
    }
    if let Some(kind) = control.get("type") {
        if !kind.is_null() && kind.as_str() != Some("ephemeral") {
            return;
        }
    }
    if normalize_ttl(control.get("ttl")).is_some() {
        return;
    }
    rewrite_block(block, ttl);
}

fn stamp_owned(params: &mut Value, ttl: &str) {
    if let Some(system) = params.get_mut("system") {
        match system {
            Value::Array(items) => items.iter_mut().for_each(|block| stamp_block(block, ttl)),
            single if !single.is_null() => stamp_block(single, ttl),
            _ => {}
        }
    }
    if let Some(tools) = params.get_mut("tools").and_then(|v| v.as_array_mut()) {
        tools.iter_mut().for_each(|tool| stamp_block(tool, ttl));
    }
    if let Some(messages) = params.get_mut("messages").and_then(|v| v.as_array_mut()) {
        for message in messages.iter_mut() {
            let Some(content) = message.get_mut("content").and_then(|v| v.as_array_mut()) else {
                continue;
            };
            content.iter_mut().for_each(|block| stamp_block(block, ttl));
        }
    }
}

/// 给「有 marker 但缺 ttl」的块补默认 TTL；调用方没显式声明过 TTL 时不动。
pub fn fill_missing_cache_ttl(params: &mut Value, ttl: &str) {
    let parts = [
        params.get("system").cloned(),
        params.get("tools").cloned(),
        params.get("messages").cloned(),
    ];
    let refs: Vec<&Value> = parts.iter().flatten().collect();
    if explicit_cache_ttl(&refs).is_none() {
        return;
    }
    stamp_owned(params, ttl);
}

/// 清掉 `thinking` / `redacted_thinking` 上的 marker。
pub fn drop_thinking_markers(params: &mut Value) {
    let Some(messages) = params.get_mut("messages").and_then(|v| v.as_array_mut()) else {
        return;
    };
    for message in messages.iter_mut() {
        let Some(content) = message.get_mut("content").and_then(|v| v.as_array_mut()) else {
            continue;
        };
        for block in content.iter_mut() {
            let Some(object) = block.as_object_mut() else { continue };
            let kind = object.get("type").and_then(|v| v.as_str()).unwrap_or_default();
            if kind == "thinking" || kind == "redacted_thinking" {
                object.remove("cache_control");
            }
        }
    }
}

/// 把 marker 总数压到 `maximum` 以内（tools→system→messages 的逆序先删）。
pub fn cap_cache_markers(params: &mut Value, maximum: usize) {
    drop_thinking_markers(params);
    let live = collect_markers(params);
    if live.len() <= maximum {
        return;
    }
    let mut tools: Vec<MarkerLoc> = live.iter().copied().filter(|l| l.section == Section::Tools).collect();
    let mut system: Vec<MarkerLoc> = live.iter().copied().filter(|l| l.section == Section::System).collect();
    let messages: Vec<MarkerLoc> = live.iter().copied().filter(|l| l.section == Section::Messages).collect();
    tools.reverse();
    system.reverse();
    let order: Vec<MarkerLoc> = tools.into_iter().chain(system).chain(messages).collect();
    for loc in order.iter().take(live.len() - maximum) {
        drop_marker(params, *loc);
    }
}

/// 只保留最后一条 message 的 marker；`ensure_tail` 时给尾块补 `ephemeral`。
pub fn keep_single_message_cache_marker(messages: &mut Value, ensure_tail: bool) {
    let Some(items) = messages.as_array_mut() else { return };
    let mut marked: Vec<(usize, usize)> = Vec::new();
    let mut tail: Option<(usize, usize)> = None;
    for (message_index, message) in items.iter_mut().enumerate() {
        let Some(object) = message.as_object_mut() else { continue };
        // 字符串 content 提升成块数组。
        if let Some(Value::String(text)) = object.get("content").cloned().as_ref() {
            if text.is_empty() {
                continue;
            }
            object.insert("content".into(), json!([{"type": "text", "text": text}]));
        }
        let Some(content) = object.get_mut("content").and_then(|v| v.as_array_mut()) else {
            continue;
        };
        if content.is_empty() {
            continue;
        }
        let mut kept: Vec<Value> = Vec::with_capacity(content.len());
        for block in content.iter() {
            let kind = block.get("type").and_then(|v| v.as_str()).unwrap_or_default();
            if kind == "thinking" || kind == "redacted_thinking" {
                continue;
            }
            kept.push(block.clone());
            if has_marker(block) {
                marked.push((message_index, kept.len() - 1));
            }
        }
        if !kept.is_empty() {
            tail = Some((message_index, kept.len() - 1));
        }
        *content = kept;
    }
    let anchor = tail;
    let mut drop_list = Vec::new();
    for loc in &marked {
        if Some(*loc) != anchor {
            drop_list.push(*loc);
        }
    }
    for (message_index, block_index) in drop_list {
        if let Some(block) = items
            .get_mut(message_index)
            .and_then(|m| m.get_mut("content"))
            .and_then(|c| c.as_array_mut())
            .and_then(|c| c.get_mut(block_index))
            .and_then(|b| b.as_object_mut())
        {
            block.remove("cache_control");
        }
    }
    if let (true, Some((message_index, block_index))) = (ensure_tail, anchor) {
        if let Some(block) = items
            .get_mut(message_index)
            .and_then(|m| m.get_mut("content"))
            .and_then(|c| c.as_array_mut())
            .and_then(|c| c.get_mut(block_index))
            .and_then(|b| b.as_object_mut())
        {
            if !has_marker(&Value::Object(block.clone())) {
                block.insert("cache_control".into(), json!({"type": "ephemeral"}));
            }
        }
    }
}

/// 内核自有段的 marker 处理：保留调用方标记，只处理自己不保留的部分。
pub fn apply_kin_owned_cache_markers(
    params: &mut Value,
    ttl: &str,
    preserve_system: bool,
    preserve_messages: bool,
    preserve_tools: bool,
) {
    let mut owned = serde_json::Map::new();
    if !preserve_system {
        if let Some(system) = params.get("system") {
            owned.insert("system".into(), system.clone());
        }
    }
    if !preserve_tools {
        if let Some(tools) = params.get("tools") {
            owned.insert("tools".into(), tools.clone());
        }
    }
    if !preserve_messages {
        if let Some(messages) = params.get("messages") {
            owned.insert("messages".into(), messages.clone());
        }
    }
    // preserved 统计的是「**保留段**」的 marker 数（不是自有段），与现网一致。
    let mut preserved_map = serde_json::Map::new();
    for (keep, key) in [
        (preserve_system, "system"),
        (preserve_tools, "tools"),
        (preserve_messages, "messages"),
    ] {
        if keep {
            if let Some(value) = params.get(key) {
                preserved_map.insert(key.to_string(), value.clone());
            }
        }
    }
    let preserved = collect_markers(&Value::Object(preserved_map)).len();
    let owned_value = Value::Object(owned);

    // 只在「自有部分」上补齐 TTL 与裁剪，保留段原样留下。
    let mut owned_mutable = owned_value;
    fill_missing_cache_ttl(&mut owned_mutable, ttl);
    cap_cache_markers(&mut owned_mutable, MAX_CACHE_MARKERS.saturating_sub(preserved));
    if let Some(object) = owned_mutable.as_object() {
        for key in ["system", "tools", "messages"] {
            if let Some(value) = object.get(key) {
                if let Some(target) = params.get_mut(key) {
                    *target = value.clone();
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn explicit_ttl_prefers_5m() {
        let five = json!({"cache_control": {"type": "ephemeral", "ttl": "5m"}});
        let hour = json!({"cache_control": {"type": "ephemeral", "ttl": "1h"}});
        assert_eq!(explicit_cache_ttl(&[&hour, &five]), Some("5m"));
        assert_eq!(explicit_cache_ttl(&[&hour]), Some("1h"));
        assert_eq!(explicit_cache_ttl(&[&json!({"a": 1})]), None);
    }

    #[test]
    fn stamps_missing_ttl_only_when_caller_declared_one() {
        let mut params = json!({
            "system": [{"type": "text", "text": "s", "cache_control": {"type": "ephemeral"}}],
            "messages": []
        });
        // 没有显式 TTL → 不动。
        fill_missing_cache_ttl(&mut params, "1h");
        assert!(params["system"][0]["cache_control"].get("ttl").is_none());

        let mut params = json!({
            "system": [
                {"type": "text", "text": "a", "cache_control": {"type": "ephemeral", "ttl": "1h"}},
                {"type": "text", "text": "b", "cache_control": {"type": "ephemeral"}}
            ]
        });
        fill_missing_cache_ttl(&mut params, "1h");
        assert_eq!(params["system"][1]["cache_control"]["ttl"], "1h");
        assert_eq!(params["system"][1]["cache_control"]["type"], "ephemeral");
    }

    #[test]
    fn keeps_scope_when_rewriting() {
        let mut params = json!({
            "system": [
                {"type": "text", "text": "a", "cache_control": {"type": "ephemeral", "ttl": "1h"}},
                {"type": "text", "text": "b", "cache_control": {"type": "ephemeral", "scope": "global"}}
            ]
        });
        fill_missing_cache_ttl(&mut params, "5m");
        assert_eq!(params["system"][1]["cache_control"]["scope"], "global");
        assert_eq!(params["system"][1]["cache_control"]["ttl"], "5m");
    }

    #[test]
    fn caps_markers_dropping_tools_then_system_first() {
        let mut params = json!({
            "system": [{"type": "text", "text": "s", "cache_control": {"type": "ephemeral"}}],
            "tools": [
                {"name": "t1", "cache_control": {"type": "ephemeral"}},
                {"name": "t2", "cache_control": {"type": "ephemeral"}}
            ],
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": "m1", "cache_control": {"type": "ephemeral"}},
                {"type": "text", "text": "m2", "cache_control": {"type": "ephemeral"}}
            ]}]
        });
        cap_cache_markers(&mut params, 4);
        // 5 个 marker → 删 1 个，最先删 tools 逆序的最后一个（t2）。
        assert!(params["tools"][1].get("cache_control").is_none());
        assert!(params["tools"][0].get("cache_control").is_some());
        assert!(params["system"][0].get("cache_control").is_some());
        assert_eq!(collect_markers(&params).len(), 4);
    }

    #[test]
    fn thinking_blocks_never_keep_markers() {
        let mut params = json!({
            "messages": [{"role": "assistant", "content": [
                {"type": "thinking", "thinking": "x", "cache_control": {"type": "ephemeral"}},
                {"type": "text", "text": "y", "cache_control": {"type": "ephemeral"}}
            ]}]
        });
        cap_cache_markers(&mut params, 4);
        assert!(params["messages"][0]["content"][0].get("cache_control").is_none());
        assert!(params["messages"][0]["content"][1].get("cache_control").is_some());
    }

    #[test]
    fn single_message_marker_moves_to_tail() {
        let mut messages = json!([
            {"role": "user", "content": [
                {"type": "text", "text": "a", "cache_control": {"type": "ephemeral"}}
            ]},
            {"role": "assistant", "content": [{"type": "text", "text": "b"}]}
        ]);
        keep_single_message_cache_marker(&mut messages, true);
        assert!(messages[0]["content"][0].get("cache_control").is_none());
        assert_eq!(messages[1]["content"][0]["cache_control"]["type"], "ephemeral");
    }
}
