//! attribution 计费头（`getAttributionHeader`）。
//!
//! 真值：现网 `src/kin/attribution.ts`（经 `testdata/jsref/modules.cjs` 的
//! `getAttributionHeader` / `isAttributionHeaderEnabled` / `officialCliVersion`）。
//!
//! 形态：
//!
//! ```text
//! x-anthropic-billing-header: cc_version=<cli>.<fingerprint>; cc_entrypoint=sdk-cli;
//!   [ cch=00000;][ cc_is_subagent=true;][ cc_prev_req=<req_*>;][ cc_prompt_id=<uuid>;]
//!   [ cc_turn_origin=<tag>;][ cc_prompt_index=<n>; cc_turn_index=<n>;]
//! ```
//!
//! `cc_workload` 上游恒为空（`getWorkload()` 返回 undefined），故本实现不输出。

use regex::Regex;

use crate::protocol::billing::bounded_billing_index;

/// entrypoint 固定值。
pub const ENTRYPOINT: &str = "sdk-cli";

/// 头开关的环境变量名。
pub const HEADER_ENV: &str = "CLAUDE_CODE_ATTRIBUTION_HEADER";
/// CLI 版本覆盖的环境变量名。
pub const VERSION_ENV: &str = "CLAUDE_CODE_VERSION";

/// `getAttributionHeader` 的可选字段。
#[derive(Debug, Clone, Default)]
pub struct AttributionOptions {
    pub include_cch: bool,
    pub include_subscriber_fields: bool,
    pub is_subagent: bool,
    pub prev_req_id: Option<String>,
    pub prompt_id: Option<String>,
    pub turn_origin: Option<String>,
    pub prompt_index: Option<i64>,
    pub turn_index: Option<i64>,
}

/// `isEnvDefinedFalsy`：`undefined` 与空串都**不算** falsy；`0/false/no/off` 算。
pub fn env_defined_falsy(value: Option<&str>) -> bool {
    match value {
        None => false,
        Some(text) => {
            if text.is_empty() {
                return false;
            }
            matches!(
                text.trim().to_ascii_lowercase().as_str(),
                "0" | "false" | "no" | "off"
            )
        }
    }
}

/// 头是否启用（env 未定义或非 falsy 即启用；特性开关现网默认为 true）。
pub fn header_enabled(env_value: Option<&str>) -> bool {
    !env_defined_falsy(env_value)
}

/// 从进程环境读开关。
pub fn header_enabled_from_env() -> bool {
    let value = std::env::var(HEADER_ENV).ok();
    header_enabled(value.as_deref())
}

/// `officialCliVersion`：env 里的 `X.Y.Z` 优先，否则用提供方给的默认值。
pub fn official_cli_version(default: &str) -> String {
    let raw = std::env::var(VERSION_ENV).unwrap_or_default();
    resolve_cli_version(&raw, default)
}

/// 纯函数版（测试/差分用）。
pub fn resolve_cli_version(raw: &str, default: &str) -> String {
    let re = version_regex();
    if let Some(caps) = re.captures(raw.trim()) {
        return caps.get(1).map(|m| m.as_str()).unwrap_or(default).to_string();
    }
    default.to_string()
}

fn version_regex() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(\d+\.\d+\.\d+)").unwrap())
}

fn req_re() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"^req_[A-Za-z0-9_-]{1,36}$").unwrap())
}

fn uuid_re() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
            .unwrap()
    })
}

fn turn_origin_re() -> &'static Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"^[a-z][a-z_]{0,31}$").unwrap())
}

/// 生成 attribution 头（不含换行）。
pub fn attribution_header(cli_version: &str, fingerprint: &str, opts: &AttributionOptions) -> String {
    let subscriber = opts.include_subscriber_fields;
    let mut head = format!(
        "x-anthropic-billing-header: cc_version={cli_version}.{fingerprint}; cc_entrypoint={ENTRYPOINT};"
    );
    if opts.include_cch {
        head.push_str(" cch=00000;");
    }
    if opts.is_subagent && subscriber {
        head.push_str(" cc_is_subagent=true;");
    }
    if subscriber {
        if let Some(prev) = opts.prev_req_id.as_deref().filter(|v| req_re().is_match(v)) {
            head.push_str(&format!(" cc_prev_req={prev};"));
        }
        if let Some(prompt) = opts.prompt_id.as_deref().filter(|v| uuid_re().is_match(v)) {
            head.push_str(&format!(" cc_prompt_id={prompt};"));
        }
        if let Some(origin) = opts
            .turn_origin
            .as_deref()
            .filter(|v| turn_origin_re().is_match(v))
        {
            head.push_str(&format!(" cc_turn_origin={origin};"));
        }
        if let (Some(prompt_index), Some(turn_index)) = (
            bounded_billing_index(opts.prompt_index, 0),
            bounded_billing_index(opts.turn_index, 1),
        ) {
            head.push_str(&format!(
                " cc_prompt_index={prompt_index}; cc_turn_index={turn_index};"
            ));
        }
    }
    head
}

#[cfg(test)]
mod tests {
    use super::*;

    fn opts() -> AttributionOptions {
        AttributionOptions {
            include_cch: true,
            include_subscriber_fields: true,
            is_subagent: false,
            prev_req_id: Some("req_abc".into()),
            prompt_id: Some("11111111-2222-3333-4444-555555555555".into()),
            turn_origin: Some("main".into()),
            prompt_index: Some(3),
            turn_index: Some(4),
        }
    }

    #[test]
    fn builds_full_header() {
        let head = attribution_header("2.1.303", "fp", &opts());
        assert_eq!(
            head,
            "x-anthropic-billing-header: cc_version=2.1.303.fp; cc_entrypoint=sdk-cli; cch=00000; \
             cc_prev_req=req_abc; cc_prompt_id=11111111-2222-3333-4444-555555555555; \
             cc_turn_origin=main; cc_prompt_index=3; cc_turn_index=4;"
        );
    }

    #[test]
    fn subscriber_fields_are_gated() {
        let mut options = opts();
        options.include_subscriber_fields = false;
        let head = attribution_header("2.1.303", "fp", &options);
        assert_eq!(
            head,
            "x-anthropic-billing-header: cc_version=2.1.303.fp; cc_entrypoint=sdk-cli; cch=00000;"
        );
    }

    #[test]
    fn invalid_shapes_are_dropped() {
        let mut options = opts();
        options.prev_req_id = Some("bad id".into());
        options.prompt_id = Some("not-a-uuid".into());
        options.turn_origin = Some("Bad".into());
        options.prompt_index = Some(-1);
        let head = attribution_header("2.1.303", "fp", &options);
        assert!(!head.contains("cc_prev_req"), "{head}");
        assert!(!head.contains("cc_prompt_id"), "{head}");
        assert!(!head.contains("cc_turn_origin"), "{head}");
        assert!(!head.contains("cc_prompt_index"), "{head}");
    }

    #[test]
    fn env_gate_and_version_parsing() {
        assert!(header_enabled(None));
        assert!(header_enabled(Some("")));
        assert!(!header_enabled(Some("0")));
        assert!(!header_enabled(Some("OFF")));
        assert_eq!(resolve_cli_version("", "2.1.303"), "2.1.303");
        assert_eq!(resolve_cli_version("v2.1.88-extra", "2.1.303"), "2.1.88");
        assert_eq!(resolve_cli_version("nonsense", "2.1.303"), "2.1.303");
    }
}
