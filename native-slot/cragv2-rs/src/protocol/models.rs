//! 模型目录与 alias 解析。
//!
//! 数据表本身是**生成**的（`protocol/tables.rs`，源为现网 `protocol303.mjs`），
//! 本模块只负责查询语义：alias、家族推断、thinking 配置、输出上限。

use crate::protocol::tables::{self, ModelEntry, MODELS};

pub use crate::protocol::tables::ModelEntry as Entry;

/// 模型家族。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Family {
    Opus,
    Sonnet,
    Haiku,
    Fable,
    Mythos,
    Other,
}

/// 按 id 查条目。
pub fn by_id(id: &str) -> Option<&'static ModelEntry> {
    MODELS.iter().find(|m| m.id == id)
}

/// 解析 alias（默认 provider）或原样 id。
pub fn resolve(model: &str) -> Option<&'static ModelEntry> {
    let id = tables::ALIASES
        .iter()
        .find(|(alias, _)| *alias == model)
        .map(|(_, id)| *id)
        .unwrap_or(model);
    by_id(id)
}

/// 解析 alias 到指定 provider 下的模型 id。
pub fn resolve_for_provider(model: &str, provider: &str) -> Option<&'static ModelEntry> {
    if let Some((_, mapping)) = tables::ALIASES_PER_PROVIDER
        .iter()
        .find(|(alias, _)| *alias == model)
    {
        if let Some((_, id)) = mapping.iter().find(|(name, _)| *name == provider) {
            return by_id(id);
        }
    }
    resolve(model)
}

/// 家族 latest 代表。
pub fn latest(family: &str) -> Option<&'static ModelEntry> {
    tables::LATEST_PER_FAMILY
        .iter()
        .find(|(name, _)| *name == family)
        .and_then(|(_, id)| by_id(id))
}

/// 家族推断（优先表内 id，回退到名字里的关键词）。
pub fn family_of(model: &str) -> Family {
    let id = resolve(model).map(|entry| entry.id).unwrap_or(model);
    let lower = id.to_ascii_lowercase();
    for (needle, family) in [
        ("haiku", Family::Haiku),
        ("sonnet", Family::Sonnet),
        ("opus", Family::Opus),
        ("fable", Family::Fable),
        ("mythos", Family::Mythos),
    ] {
        if lower.contains(needle) {
            return family;
        }
    }
    Family::Other
}

/// `thinking` 配置：官方槽位对 haiku 关闭、其余自适应（`singleProcessSlots.thinkingFor`）。
pub fn thinking_for(model: &str) -> serde_json::Value {
    let entry = resolve(model);
    let adaptive = entry.map(|m| m.has("adaptive_thinking")).unwrap_or(false);
    if family_of(model) == Family::Haiku && !adaptive {
        serde_json::json!({"type": "disabled"})
    } else if family_of(model) == Family::Haiku {
        // haiku-5-5 明确带 `rejects_disabled_thinking`：给自适应而不是关闭。
        if entry
            .map(|m| m.has("rejects_disabled_thinking"))
            .unwrap_or(false)
        {
            serde_json::json!({"type": "adaptive"})
        } else {
            serde_json::json!({"type": "disabled"})
        }
    } else {
        serde_json::json!({"type": "adaptive"})
    }
}

/// 默认 effort 档（未声明则为 `None`）。
pub fn default_effort(model: &str) -> Option<&'static str> {
    resolve(model).and_then(|m| m.default_effort)
}

/// 输出 token 上限；`upper=true` 取上限位。
pub fn max_output_tokens(model: &str, upper: bool) -> Option<u32> {
    resolve(model).map(|m| {
        let value = if upper {
            m.max_output_upper
        } else {
            m.max_output_default
        };
        if value > 0 {
            value
        } else if upper {
            m.max_output_default
        } else {
            m.max_output_upper
        }
    })
}

/// `/v1/models` 的条目列表（id 升序）。
pub fn catalog() -> Vec<&'static str> {
    let mut ids: Vec<&'static str> = MODELS.iter().map(|m| m.id).collect();
    ids.sort_unstable();
    ids
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn alias_resolves_to_latest() {
        assert_eq!(resolve("opus").map(|m| m.id), Some("claude-opus-5-5"));
        assert_eq!(resolve("sonnet").map(|m| m.id), Some("claude-sonnet-5-5"));
        assert_eq!(resolve("haiku").map(|m| m.id), Some("claude-haiku-5-5"));
        assert_eq!(latest("opus").map(|m| m.id), Some("claude-opus-5-5"));
    }

    #[test]
    fn unknown_model_is_not_fabricated() {
        assert!(resolve("claude-does-not-exist").is_none());
        assert_eq!(family_of("claude-opus-9-9"), Family::Opus);
        assert_eq!(family_of("gpt-5"), Family::Other);
    }

    #[test]
    fn provider_mapping_falls_back_to_default() {
        // sonnet 在 bedrock 上是 4-5，在 firstParty 是 5-5。
        assert_eq!(
            resolve_for_provider("sonnet", "bedrock").map(|m| m.id),
            Some("claude-sonnet-4-5")
        );
        assert_eq!(
            resolve_for_provider("sonnet", "firstParty").map(|m| m.id),
            Some("claude-sonnet-5-5")
        );
        assert_eq!(
            resolve_for_provider("sonnet", "unknown-provider").map(|m| m.id),
            Some("claude-sonnet-5-5")
        );
    }

    #[test]
    fn thinking_follows_slot_semantics() {
        // haiku 5.5 带 rejects_disabled_thinking → adaptive。
        assert_eq!(thinking_for("claude-haiku-5-5")["type"], "adaptive");
        assert_eq!(thinking_for("claude-opus-5-5")["type"], "adaptive");
    }

    #[test]
    fn max_output_tokens_come_from_table() {
        // 5-5 家族是 128k/128k；opus-5 是 64k/128k（表里就是这两个值）。
        assert_eq!(max_output_tokens("claude-opus-5-5", false), Some(128000));
        assert_eq!(max_output_tokens("claude-opus-5", false), Some(64000));
        assert_eq!(max_output_tokens("claude-opus-5", true), Some(128000));
        assert_eq!(max_output_tokens("claude-3-5-haiku", false), Some(8192));
        assert!(max_output_tokens("nope", false).is_none());
    }

    #[test]
    fn catalog_is_sorted_and_unique() {
        let ids = catalog();
        assert!(ids.len() >= 20, "{ids:?}");
        let mut sorted = ids.clone();
        sorted.sort_unstable();
        sorted.dedup();
        assert_eq!(ids, sorted);
    }
}
