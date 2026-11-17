//! 协议数据表 —— **自动生成，请勿手改**。
//!
//! 生成器：`tools/gen-protocol-tables.mjs`
//! 数据源：`origin/fix/sqlite-off-event-loop:share/crag-v2/runtime/protocol303.mjs`
//! 源 sha256：`722b534dab5711e87994f45ba1a569204cf291af8de819fcbaf0c7e618a3d403`
//!
//! 换上游版本时：`node tools/gen-protocol-tables.mjs`，然后跑 `cargo test`
//! （`tables_match_source` 会在源与常量不一致时失败）。

/// 一个可出站的模型条目。
#[derive(Debug, Clone, Copy)]
pub struct ModelEntry {
    pub id: &'static str,
    pub display_name: &'static str,
    pub default_effort: Option<&'static str>,
    pub capabilities: &'static [&'static str],
    pub max_output_default: u32,
    pub max_output_upper: u32,
    pub fallback_3p: Option<&'static str>,
    pub knowledge_cutoff: &'static str,
}

impl ModelEntry {
    pub fn has(&self, capability: &str) -> bool {
        self.capabilities.iter().any(|c| *c == capability)
    }
}

/// `origin/fix/sqlite-off-event-loop:share/crag-v2/runtime/protocol303.mjs` 的 MODELS 表（顺序即目录顺序）。
pub const MODELS: &[ModelEntry] = &[
    ModelEntry {
        id: "claude-3-5-haiku",
        display_name: "Haiku 3.5",
        default_effort: Some("medium"),
        capabilities: &[],
        max_output_default: 8192,
        max_output_upper: 8192,
        fallback_3p: Some("claude-haiku-4-5"),
        knowledge_cutoff: "February 2025",
    },
    ModelEntry {
        id: "claude-haiku-4-5",
        display_name: "Haiku 4.5",
        default_effort: Some("medium"),
        capabilities: &[
        "context_management",
    ],
        max_output_default: 32000,
        max_output_upper: 64000,
        fallback_3p: Some("claude-haiku-4-5"),
        knowledge_cutoff: "February 2025",
    },
    ModelEntry {
        id: "claude-haiku-5-5",
        display_name: "Haiku 5.5",
        default_effort: Some("medium"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "mid_conv_tool_change",
        "context_management",
        "rejects_disabled_thinking",
        "per_turn_effort",
        "lean_prompt",
        "org_locked_thinking",
        "haiku_5_5_early_stopping_guidance",
    ],
        max_output_default: 128000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-haiku-4-5"),
        knowledge_cutoff: "June 2026",
    },
    ModelEntry {
        id: "claude-3-5-sonnet",
        display_name: "Sonnet 3.5",
        default_effort: None,
        capabilities: &[],
        max_output_default: 8192,
        max_output_upper: 8192,
        fallback_3p: Some("claude-sonnet-4-0"),
        knowledge_cutoff: "January 2025",
    },
    ModelEntry {
        id: "claude-3-7-sonnet",
        display_name: "Sonnet 3.7",
        default_effort: None,
        capabilities: &[],
        max_output_default: 32000,
        max_output_upper: 64000,
        fallback_3p: Some("claude-sonnet-4-0"),
        knowledge_cutoff: "January 2025",
    },
    ModelEntry {
        id: "claude-sonnet-4-0",
        display_name: "Sonnet 4",
        default_effort: None,
        capabilities: &[
        "context_management",
    ],
        max_output_default: 32000,
        max_output_upper: 64000,
        fallback_3p: Some("claude-sonnet-4-0"),
        knowledge_cutoff: "January 2025",
    },
    ModelEntry {
        id: "claude-sonnet-4-5",
        display_name: "Sonnet 4.5",
        default_effort: Some("high"),
        capabilities: &[
        "context_management",
    ],
        max_output_default: 32000,
        max_output_upper: 64000,
        fallback_3p: Some("claude-sonnet-4-0"),
        knowledge_cutoff: "January 2025",
    },
    ModelEntry {
        id: "claude-sonnet-4-6",
        display_name: "Sonnet 4.6",
        default_effort: Some("high"),
        capabilities: &[
        "effort",
        "max_effort",
        "adaptive_thinking",
        "context_management",
    ],
        max_output_default: 32000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-sonnet-4-5"),
        knowledge_cutoff: "August 2025",
    },
    ModelEntry {
        id: "claude-sonnet-5",
        display_name: "Sonnet 5",
        default_effort: Some("high"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "context_management",
    ],
        max_output_default: 64000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-sonnet-4-6"),
        knowledge_cutoff: "January 2026",
    },
    ModelEntry {
        id: "claude-sonnet-5-5",
        display_name: "Sonnet 5.5",
        default_effort: Some("medium"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "mid_conv_tool_change",
        "context_management",
        "rejects_disabled_thinking",
        "per_turn_effort",
        "per_turn_timing",
        "lean_prompt",
        "refusal_fallback",
        "silent_turn_reminder",
        "org_locked_thinking",
    ],
        max_output_default: 128000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-sonnet-5"),
        knowledge_cutoff: "June 2026",
    },
    ModelEntry {
        id: "claude-opus-4-0",
        display_name: "Opus 4",
        default_effort: None,
        capabilities: &[
        "context_management",
    ],
        max_output_default: 32000,
        max_output_upper: 32000,
        fallback_3p: Some("claude-opus-4-1"),
        knowledge_cutoff: "January 2025",
    },
    ModelEntry {
        id: "claude-opus-4-1",
        display_name: "Opus 4.1",
        default_effort: None,
        capabilities: &[
        "context_management",
    ],
        max_output_default: 32000,
        max_output_upper: 32000,
        fallback_3p: Some("claude-opus-4-1"),
        knowledge_cutoff: "January 2025",
    },
    ModelEntry {
        id: "claude-opus-4-5",
        display_name: "Opus 4.5",
        default_effort: Some("xhigh"),
        capabilities: &[
        "context_management",
    ],
        max_output_default: 32000,
        max_output_upper: 64000,
        fallback_3p: Some("claude-opus-4-1"),
        knowledge_cutoff: "May 2025",
    },
    ModelEntry {
        id: "claude-opus-4-6",
        display_name: "Opus 4.6",
        default_effort: Some("xhigh"),
        capabilities: &[
        "effort",
        "max_effort",
        "adaptive_thinking",
        "context_management",
    ],
        max_output_default: 64000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-opus-4-5"),
        knowledge_cutoff: "May 2025",
    },
    ModelEntry {
        id: "claude-opus-4-7",
        display_name: "Opus 4.7",
        default_effort: Some("xhigh"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "context_management",
    ],
        max_output_default: 64000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-opus-4-6"),
        knowledge_cutoff: "January 2026",
    },
    ModelEntry {
        id: "claude-opus-4-8",
        display_name: "Opus 4.8",
        default_effort: Some("high"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "mid_conv_tool_change",
        "context_management",
        "fast_mode",
        "lean_prompt",
    ],
        max_output_default: 64000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-opus-4-7"),
        knowledge_cutoff: "January 2026",
    },
    ModelEntry {
        id: "claude-opus-5",
        display_name: "Opus 5",
        default_effort: Some("high"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "mid_conv_tool_change",
        "context_management",
        "thinking_disabled_effort_cap",
        "fast_mode",
        "lean_prompt",
        "refusal_fallback",
        "opus_5_prompt_bundle",
    ],
        max_output_default: 64000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-opus-4-8"),
        knowledge_cutoff: "May 2026",
    },
    ModelEntry {
        id: "claude-opus-5-5",
        display_name: "Opus 5.5",
        default_effort: Some("medium"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "rejects_disabled_thinking",
        "mid_conv_tool_change",
        "per_turn_effort",
        "per_turn_timing",
        "context_management",
        "fast_mode",
        "lean_prompt",
        "refusal_fallback",
        "opus_5_5_prompt_bundle",
    ],
        max_output_default: 128000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-opus-5"),
        knowledge_cutoff: "June 2026",
    },
    ModelEntry {
        id: "claude-fable-5",
        display_name: "Fable 5",
        default_effort: Some("high"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "rejects_disabled_thinking",
        "mid_conv_tool_change",
        "context_management",
        "lean_prompt",
        "fable_5_mitigations",
        "refusal_fallback",
    ],
        max_output_default: 64000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-opus-5-5"),
        knowledge_cutoff: "January 2026",
    },
    ModelEntry {
        id: "claude-fable-5-1",
        display_name: "Fable 5.1",
        default_effort: Some("high"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "rejects_disabled_thinking",
        "mid_conv_tool_change",
        "per_turn_effort",
        "per_turn_timing",
        "context_management",
        "lean_prompt",
        "fable_5_mitigations",
        "refusal_fallback",
        "fable_5_1_prompt_bundle",
    ],
        max_output_default: 64000,
        max_output_upper: 128000,
        fallback_3p: Some("claude-fable-5"),
        knowledge_cutoff: "June 2026",
    },
    ModelEntry {
        id: "claude-mythos-5",
        display_name: "Mythos 5",
        default_effort: Some("high"),
        capabilities: &[],
        max_output_default: 64000,
        max_output_upper: 128000,
        fallback_3p: None,
        knowledge_cutoff: "January 2026",
    },
    ModelEntry {
        id: "claude-mythos-5-1",
        display_name: "Mythos 5.1",
        default_effort: Some("high"),
        capabilities: &[
        "effort",
        "max_effort",
        "xhigh_effort",
        "adaptive_thinking",
        "rejects_disabled_thinking",
        "mid_conv_tool_change",
        "per_turn_timing",
        "context_management",
        "lean_prompt",
        "fable_5_mitigations",
        "fable_5_1_prompt_bundle",
    ],
        max_output_default: 64000,
        max_output_upper: 128000,
        fallback_3p: None,
        knowledge_cutoff: "June 2026",
    },
];

/// alias → 默认 provider 下的模型 id。
pub const ALIASES: &[(&str, &str)] = &[
    ("opus", "claude-opus-5-5"),
    ("sonnet", "claude-sonnet-5-5"),
    ("haiku", "claude-haiku-5-5"),
    ("fable", "claude-fable-5-1"),
];

/// alias → 各 provider 下的模型 id（未列出的 provider 走 `ALIASES`）。
pub const ALIASES_PER_PROVIDER: &[(&str, &[(&str, &str)])] = &[
    (
        "opus",
        &[
            ("firstParty", "claude-opus-5-5"),
            ("bedrock", "claude-opus-5-5"),
            ("vertex", "claude-opus-5-5"),
            ("foundry", "claude-opus-4-6"),
            ("mantle", "claude-opus-5-5"),
            ("anthropic_aws", "claude-opus-5-5"),
            ("gateway", "claude-opus-4-7"),
        ],
    ),
    (
        "sonnet",
        &[
            ("firstParty", "claude-sonnet-5-5"),
            ("bedrock", "claude-sonnet-4-5"),
            ("vertex", "claude-sonnet-4-5"),
            ("foundry", "claude-sonnet-4-5"),
            ("mantle", "claude-sonnet-4-5"),
            ("anthropic_aws", "claude-sonnet-4-6"),
            ("gateway", "claude-sonnet-4-6"),
        ],
    ),
    (
        "haiku",
        &[
            ("firstParty", "claude-haiku-5-5"),
            ("bedrock", "claude-haiku-4-5"),
            ("vertex", "claude-haiku-4-5"),
            ("foundry", "claude-haiku-4-5"),
            ("mantle", "claude-haiku-4-5"),
            ("anthropic_aws", "claude-haiku-4-5"),
            ("anthropic_google_cloud", "claude-haiku-4-5"),
            ("gateway", "claude-haiku-4-5"),
        ],
    ),
    (
        "fable",
        &[
            ("gateway", "claude-fable-5"),
        ],
    ),
];

/// 家族 → 该家族 latest 代表。
pub const LATEST_PER_FAMILY: &[(&str, &str)] = &[
    ("fable", "claude-fable-5-1"),
    ("opus", "claude-opus-5-5"),
    ("sonnet", "claude-sonnet-5-5"),
    ("haiku", "claude-haiku-5-5"),
];

/// 命名 beta 注册表（name → 出站 header 值）。
pub const BETA_REGISTRY: &[(&str, &str)] = &[
    ("claude_code", "claude-code-20250219"),
    ("oauth_auth", "oauth-2025-04-20"),
    ("interleaved_thinking", "interleaved-thinking-2025-05-14"),
    ("long_context", "context-1m-2025-08-07"),
    ("context_management", "context-management-2025-06-27"),
    ("structured_outputs", "structured-outputs-2025-12-15"),
    ("web_search", "web-search-2025-03-05"),
    ("tool_search_1p", "advanced-tool-use-2025-11-20"),
    ("tool_search_3p", "tool-search-tool-2025-10-19"),
    ("effort", "effort-2025-11-24"),
    ("task_budgets", "task-budgets-2026-03-13"),
    ("prompt_caching_scope", "prompt-caching-scope-2026-01-05"),
    ("prompt_caching_evict", "prompt-caching-evict-2026-05-12"),
    ("cache_keepalive", "cache-keepalive-2026-09-03"),
    ("extended_cache_ttl", "extended-cache-ttl-2025-04-11"),
    ("speed", "fast-mode-2026-02-01"),
    ("redact_thinking", "redact-thinking-2026-02-12"),
    ("thinking_resumption", "thinking-resumption-2026-07-17"),
    ("thinking_token_count", "thinking-token-count-2026-05-13"),
    ("afk_mode", "afk-mode-2026-01-31"),
    ("advisor_tool", "advisor-tool-2026-03-01"),
    ("cache_diagnosis", "cache-diagnosis-2026-04-07"),
    ("context_hint", "context-hint-2026-04-09"),
    ("mcp_servers", "mcp-servers-2025-12-04"),
    ("files_api", "files-api-2025-04-14"),
    ("environments", "environments-2025-11-01"),
    ("ccr_byoc", "ccr-byoc-2025-07-29"),
    ("per_message_effort", "per-turn-control-2026-07-01"),
    ("per_turn_timing", "timing-2026-09-09"),
    ("mid_conv_tool_change", "mid-conversation-tool-changes-2026-07-01"),
    ("inline_tools", "inline-tools-2026-09-15"),
    ("server_side_fallback", "server-side-fallback-2026-06-01"),
    ("server_side_fallback_category", "server-side-fallback-2026-07-01"),
    ("fallback_credit", "fallback-credit-2026-06-01"),
    ("auto_mode_classifier", "auto-mode-classifier-2026-07-16"),
    ("dangerous_tool_use", "dangerous-tool-use-2026-09-03"),
    ("thinking_display_updates", "thinking-display-updates-2026-08-18"),
    ("thinking_binding_controls", "thinking-binding-controls-2026-08-01"),
    ("message_threads", "message-threads-2026-08-12"),
];

/// `LU()` 从 `ANTHROPIC_BETAS` 里剔除的通常可用 header。
pub const ENV_BETA_SKIP: &[&str] = &[
    "afk-mode-2026-01-31",
    "mid-conversation-system-2026-04-07",
];

/// 2.1.303 CLI 的 effort 档位。
pub const EFFORT_LEVELS: &[&str] = &[
    "low",
    "medium",
    "high",
    "xhigh",
    "max",
];

/// thinking 模式。
pub const THINKING_MODES: &[&str] = &[
    "enabled",
    "adaptive",
    "disabled",
];

/// thinking 展示形态。
pub const THINKING_DISPLAYS: &[&str] = &[
    "summarized",
    "omitted",
    "highlights",
];

/// 2.1.303 的 permission mode（`manual` 在 88 引擎里叫 `default`）。
pub const PERMISSION_MODES_303: &[&str] = &[
    "acceptEdits",
    "auto",
    "bypassPermissions",
    "manual",
    "dontAsk",
    "plan",
];

/// permission mode 到 88 引擎名的映射。
pub const PERMISSION_MODE_ENGINE: &[(&str, &str)] = &[
    ("manual", "default"),
    ("default", "default"),
];

/// 请求类别（`x-claude-code-request-class`）。
pub const REQUEST_CLASSES: &[&str] = &[
    "main",
    "subagent",
    "workflow",
    "compaction",
    "auxiliary",
    "side_reply",
];

/// 工程来源（`cc_project_src`）。
pub const PROJECT_SOURCES: &[&str] = &[
    "harness",
    "user",
    "project",
    "local",
    "flag",
    "managed",
    "admin_default",
];

/// thinking budget 下限。
pub const MIN_THINKING_BUDGET: u32 = 1024;

/// 数据源标识（诊断用）。
pub const SOURCE: &str = "origin/fix/sqlite-off-event-loop:share/crag-v2/runtime/protocol303.mjs";
/// 数据源 sha256（诊断用）。
pub const SOURCE_SHA256: &str = "722b534dab5711e87994f45ba1a569204cf291af8de819fcbaf0c7e618a3d403";
