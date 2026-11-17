//! API provider 与 attribution 门控。
//!
//! 真值：现网 `getAPIProvider` / `attributionGates`（经 `testdata/jsref/modules.cjs`）。
//!
//! 门控决定 attribution 头里是否带 `cch` 与订阅者字段：
//! - `includeCch = firstPartySub || provider == "vertex"`
//! - `includeSubscriberFields = firstPartySub`

/// 上游 provider。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Provider {
    FirstParty,
    Bedrock,
    Vertex,
    Foundry,
}

impl Provider {
    pub fn as_str(self) -> &'static str {
        match self {
            Provider::FirstParty => "firstParty",
            Provider::Bedrock => "bedrock",
            Provider::Vertex => "vertex",
            Provider::Foundry => "foundry",
        }
    }

    /// 由三个环境开关推导（优先级 bedrock → vertex → foundry）。
    pub fn from_flags(bedrock: bool, vertex: bool, foundry: bool) -> Self {
        if bedrock {
            Provider::Bedrock
        } else if vertex {
            Provider::Vertex
        } else if foundry {
            Provider::Foundry
        } else {
            Provider::FirstParty
        }
    }

    pub fn from_env() -> Self {
        Self::from_flags(
            env_truthy("CLAUDE_CODE_USE_BEDROCK"),
            env_truthy("CLAUDE_CODE_USE_VERTEX"),
            env_truthy("CLAUDE_CODE_USE_FOUNDRY"),
        )
    }
}

/// `isEnvTruthy`：`1` / `true` / `yes`（大小写不敏感）。
pub fn env_truthy(key: &str) -> bool {
    std::env::var(key)
        .map(|value| {
            matches!(
                value.trim().to_ascii_lowercase().as_str(),
                "1" | "true" | "yes" | "on"
            )
        })
        .unwrap_or(false)
}

/// attribution 门控。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AttributionGates {
    pub include_cch: bool,
    pub include_subscriber_fields: bool,
}

/// 由 provider 与订阅者身份推导门控。
pub fn attribution_gates(provider: Provider, subscriber: bool) -> AttributionGates {
    let first_party_sub = provider == Provider::FirstParty && subscriber;
    AttributionGates {
        include_cch: first_party_sub || provider == Provider::Vertex,
        include_subscriber_fields: first_party_sub,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn provider_precedence_matches_upstream() {
        assert_eq!(Provider::from_flags(true, true, true), Provider::Bedrock);
        assert_eq!(Provider::from_flags(false, true, true), Provider::Vertex);
        assert_eq!(Provider::from_flags(false, false, true), Provider::Foundry);
        assert_eq!(Provider::from_flags(false, false, false), Provider::FirstParty);
    }

    #[test]
    fn gates_follow_provider_and_subscriber() {
        let gates = attribution_gates(Provider::FirstParty, true);
        assert!(gates.include_cch && gates.include_subscriber_fields);
        let gates = attribution_gates(Provider::FirstParty, false);
        assert!(!gates.include_cch && !gates.include_subscriber_fields);
        let gates = attribution_gates(Provider::Vertex, false);
        assert!(gates.include_cch && !gates.include_subscriber_fields);
        let gates = attribution_gates(Provider::Bedrock, true);
        assert!(!gates.include_cch && !gates.include_subscriber_fields);
    }
}
