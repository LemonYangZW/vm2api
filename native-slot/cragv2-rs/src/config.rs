//! `kernel.json` 与命令行配置。
//!
//! 契约与控制面 `rust-kernel-supervisor.mjs` 一致：
//! `crag-v2 --gateway-worker --config /run/kin/kernel.json`，socket 默认
//! `<run_dir>/kernel.sock`，token 默认 `<run_dir>/internal.token`。

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde::Deserialize;

/// 内核配置（未知字段一律忽略，向上游兼容）。
#[derive(Debug, Clone, Deserialize, Default)]
pub struct KernelConfig {
    #[serde(default)]
    pub dataplane: Option<String>,
    #[serde(default)]
    pub crag_kernel_version: Option<String>,
    #[serde(default)]
    pub slots_per_worker: Option<u32>,
    /// 槽位 CLI 可执行文件；缺省取 `$CRAG_CLI_BIN` 或 `claude`。
    #[serde(default)]
    pub cli_bin: Option<String>,
    /// CLI 额外参数（在内建 crag 参数之前）。
    #[serde(default)]
    pub cli_args: Option<Vec<String>>,
    /// Unix socket 路径（覆盖默认）。
    #[serde(default)]
    pub socket_path: Option<String>,
    /// 内部 token 文件（覆盖默认）。
    #[serde(default)]
    pub token_path: Option<String>,
    /// 上游基址（默认官方 api.anthropic.com）。
    #[serde(default)]
    pub upstream_base: Option<String>,
    /// hop 模式：`direct`（自控 h2/TLS，crag v2 原生形态）或 `slot`（交给槽位 CLI）。
    #[serde(default)]
    pub upstream_mode: Option<String>,
    /// 自定义根证书（企业代理 / 私有网关）；缺省用系统根证书。
    #[serde(default)]
    pub upstream_ca: Option<String>,
    /// 出站代理：`socks5://` / `socks5h://` / `http://`（现网口径见 worker/internal/config）。
    #[serde(default)]
    pub proxy_url: Option<String>,
    /// 代理必需：为真且 `proxy_url` 为空时拒绝启动（不静默直连）。
    #[serde(default)]
    pub proxy_required: Option<bool>,
    /// 凭据文件路径（缺省 `/home/kincli/.claude/credentials.json`）。
    #[serde(default)]
    pub credential_path: Option<String>,
    /// OAuth token 端点（缺省 `https://platform.claude.com/v1/oauth/token`）。
    #[serde(default)]
    pub oauth_token_url: Option<String>,
    /// 提前刷新阈值（秒，缺省 300）。
    #[serde(default)]
    pub refresh_skew_seconds: Option<i64>,
    /// 任意扩展字段，原样保留便于诊断。
    #[serde(flatten)]
    pub extra: BTreeMap<String, serde_json::Value>,
}

/// 每个常驻会话的官方 CLI 内存预算。
///
/// 基准来自上游确认：**一个槽位跑满 CRAG（20 会话）大约要 5 GiB**
/// （20 × 256 MiB = 5 GiB）。上游 issue #1092 实测单会话约 280 MB，
/// 我们取 256 MiB 并**不再额外预留**：内核自身空闲只有 1.7 MB（实测），
/// 余量应当留在每会话预算里，否则 5 GiB 会推导出 17 个会话，与上游结论对不上。
pub const SESSION_MEMORY_BUDGET: u64 = 256 * 1024 * 1024;
/// 内核自身 + 运行时杂项固定预留（实测空闲 1.7 MB，取 0 让基准与 5 GiB 对齐）。
pub const KERNEL_RESERVE: u64 = 0;

/// 容器内存上限（cgroup v2 `memory.max`，回落 v1 `memory/memory.limit_in_bytes`）。
/// 返回 `None` 表示无限制/读不到。
pub fn cgroup_memory_limit() -> Option<u64> {
    const CANDIDATES: [&str; 2] = [
        "/sys/fs/cgroup/memory.max",
        "/sys/fs/cgroup/memory/memory.limit_in_bytes",
    ];
    for path in CANDIDATES {
        let Ok(text) = std::fs::read_to_string(path) else {
            continue;
        };
        let text = text.trim();
        if text == "max" || text.is_empty() {
            return None;
        }
        if let Ok(bytes) = text.parse::<u64>() {
            // v1 无限制时是一个巨大的哨兵值，视同无限。
            if bytes >= 1 << 60 {
                return None;
            }
            return Some(bytes);
        }
    }
    None
}

/// 由内存上限推导容量：`(limit - 预留) / 每会话预算`，至少 1。
pub fn capacity_from_limit(limit: u64) -> usize {
    let usable = limit.saturating_sub(KERNEL_RESERVE);
    (usable / SESSION_MEMORY_BUDGET).max(1) as usize
}

impl KernelConfig {
    pub fn load(path: &Path) -> std::io::Result<Self> {
        let text = std::fs::read_to_string(path)?;
        // 上游写的是带注释风格的人类可读 JSON；解析失败时退回空配置并报错给调用方。
        serde_json::from_str(&text).map_err(|e| {
            std::io::Error::new(std::io::ErrorKind::InvalidData, format!("kernel.json: {e}"))
        })
    }

    pub fn slots(&self) -> u32 {
        self.slots_per_worker.unwrap_or(20).clamp(1, 20)
    }

    pub fn cli_bin(&self) -> String {
        self.cli_bin
            .clone()
            .or_else(|| std::env::var("CRAG_CLI_BIN").ok().filter(|v| !v.trim().is_empty()))
            .unwrap_or_else(|| "claude".to_string())
    }

    pub fn credential_path(&self) -> String {
        self.credential_path
            .clone()
            .or_else(|| std::env::var("KIN_CREDENTIAL_PATH").ok())
            .filter(|v| !v.trim().is_empty())
            .unwrap_or_else(|| "/home/kincli/.claude/credentials.json".to_string())
    }

    pub fn oauth_token_url(&self) -> String {
        self.oauth_token_url
            .clone()
            .or_else(|| std::env::var("KIN_OAUTH_TOKEN_URL").ok())
            .filter(|v| !v.trim().is_empty())
            .unwrap_or_else(|| "https://platform.claude.com/v1/oauth/token".to_string())
    }

    pub fn refresh_skew_seconds(&self) -> i64 {
        self.refresh_skew_seconds
            .filter(|v| *v > 0)
            .unwrap_or(300)
    }

    /// 代理设置：配置优先，其次环境变量 `KIN_PROXY_URL` / `KIN_PROXY_REQUIRED`。
    pub fn proxy_settings(&self) -> crate::http::proxy::ProxySettings {
        let env = crate::http::proxy::ProxySettings::from_env();
        let url = self
            .proxy_url
            .clone()
            .or(env.url)
            .filter(|v| !v.trim().is_empty());
        let required = self.proxy_required.unwrap_or(env.required);
        crate::http::proxy::ProxySettings { url, required }
    }

    /// 是否直连上游（自控 wire）。
    pub fn direct(&self) -> bool {
        self.upstream_mode
            .as_deref()
            .map(|mode| mode.eq_ignore_ascii_case("direct"))
            .unwrap_or(true)
    }

    /// `transport`：`direct`（内核自拼 wire，默认）| `native`（官方 CLI 发包）。
    pub fn transport(&self) -> String {
        self.upstream_mode
            .as_deref()
            .map(|mode| mode.to_ascii_lowercase())
            .unwrap_or_else(|| "direct".to_string())
    }

    pub fn is_native(&self) -> bool {
        self.transport() == "native"
    }

    /// `transport: "tui"`：PTY 驱动官方 CLI（出站请求与真实安装同形）。
    pub fn is_tui(&self) -> bool {
        self.transport() == "tui"
    }

    pub fn upstream_base(&self) -> String {
        self.upstream_base
            .clone()
            .or_else(|| std::env::var("KIN_UPSTREAM_BASE").ok())
            .filter(|v| !v.trim().is_empty())
            .unwrap_or_else(|| "https://api.anthropic.com".to_string())
    }

    /// 面板写入但我们不消费的键也做类型化读取，便于按需接线与自检。
    fn extra_str(&self, key: &str) -> Option<String> {
        self.extra
            .get(key)
            .and_then(|v| v.as_str())
            .map(str::to_string)
            .filter(|v| !v.trim().is_empty())
    }

    fn extra_u64(&self, key: &str) -> Option<u64> {
        self.extra.get(key).and_then(|v| v.as_u64())
    }

    /// 面板写 `cch_enabled`（direct 通路下决定是否由内核打 CCH 戳）；native 通路下不适用。
    pub fn cch_enabled(&self) -> Option<bool> {
        self.extra.get("cch_enabled").and_then(|v| v.as_bool())
    }

    /// 槽内 CLI 声明的版本（面板写 `cli_version`），native 通路下仅用于日志/健康。
    pub fn cli_version(&self) -> Option<String> {
        self.extra_str("cli_version")
    }

    /// 面板声明的槽内 CLI 路径（`claude_bin`），优先于通用的 `cli_bin`。
    pub fn claude_bin(&self) -> Option<String> {
        self.extra_str("claude_bin")
    }

    /// 会话并发上限（面板写 `session_slots` 或 `slots_per_worker`），默认 20。
    ///
    /// 同时受两道限制：本文件声明的范围（1–20，与 `slots()` 一致）和**容器 cgroup 内存
    /// 上限**。上游内核遇到超容配置直接以 `session_slots exceeds physical capacity` 退出
    /// （issue #1179 因此槽位反复重启），我们改为**截断并告警**，保持可启动。
    pub fn session_slots(&self) -> usize {
        let requested = self
            .extra_u64("session_slots")
            .or_else(|| self.extra_u64("slots_per_worker"))
            .map(|v| v.clamp(1, 20) as usize)
            .unwrap_or(20);
        requested.min(Self::capacity_slots())
    }

    /// 按 cgroup 内存上限推导的会话容量（每会话预算 [`SESSION_MEMORY_BUDGET`]）。
    /// 读不到 cgroup 时返回 `usize::MAX`（不限制），避免在非容器环境误伤。
    fn capacity_slots() -> usize {
        let Some(limit) = cgroup_memory_limit() else {
            return usize::MAX;
        };
        capacity_from_limit(limit)
    }

    /// MCP 工具等待上限（面板写 `tool_timeout_seconds`），默认 300 s。
    pub fn tool_timeout_seconds(&self) -> u64 {
        self.extra_u64("tool_timeout_seconds")
            .map(|v| v.clamp(5, 3600))
            .unwrap_or(300)
    }

    /// 会话空闲 TTL（面板写 `session_idle_ttl_seconds`），默认 600 s。
    pub fn session_idle_ttl_seconds(&self) -> u64 {
        self.extra_u64("session_idle_ttl_seconds")
            .map(|v| v.clamp(60, 7200))
            .unwrap_or(600)
    }

    /// 额度探测的基址：优先 `KIN_USAGE_BASE`，其次指向官方 API 的 `upstream_base`，
    /// 否则固定 `https://api.anthropic.com`（该端点只存在于官方域名）。
    pub fn usage_base(&self) -> String {
        if let Ok(explicit) = std::env::var("KIN_USAGE_BASE") {
            if !explicit.trim().is_empty() {
                return explicit;
            }
        }
        let base = self.upstream_base();
        if base.contains("anthropic.com") {
            base
        } else {
            "https://api.anthropic.com".to_string()
        }
    }

    /// 额度探测开关（`KIN_USAGE_PROBE=0` 可整体关闭）。
    pub fn usage_probe_enabled(&self) -> bool {
        std::env::var("KIN_USAGE_PROBE")
            .map(|v| v != "0")
            .unwrap_or(true)
    }

    /// 面板写 `provider`（`local_cli` 表示"让槽内 CLI 发 hop"）。
    pub fn provider(&self) -> Option<String> {
        self.extra_str("provider")
    }

    /// 面板期望的数据面语义：`provider=local_cli` 或显式 `upstream_mode=native`。
    pub fn prefers_local_cli(&self) -> bool {
        self.is_native() || self.provider().as_deref() == Some("local_cli")
    }

    /// crag 模式固定参数：`--single-process-subagents --max-procs <n> --continuous-tool-loop`。
    pub fn crag_cli_args(&self) -> Vec<String> {
        vec![
            "--single-process-subagents".to_string(),
            "--max-procs".to_string(),
            self.slots().to_string(),
            "--continuous-tool-loop".to_string(),
        ]
    }
}

/// 运行时装配结果。
#[derive(Debug, Clone)]
pub struct RuntimePaths {
    pub run_dir: Option<PathBuf>,
    pub socket_path: PathBuf,
    pub token_path: Option<PathBuf>,
}

impl RuntimePaths {
    /// 由配置/环境解析：显式 > `KIN_SLOT_RUN_ROOT`/`KIN_RUN_DIR` > 默认 `/run/kin`。
    pub fn resolve(config: &KernelConfig) -> Self {
        let run_dir = std::env::var("KIN_SLOT_RUN_ROOT")
            .ok()
            .or_else(|| std::env::var("KIN_RUN_DIR").ok())
            .filter(|v| !v.trim().is_empty())
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("/run/kin"));
        let socket_path = config
            .socket_path
            .clone()
            .map(PathBuf::from)
            .or_else(|| std::env::var("KIN_KERNEL_SOCKET").ok().map(PathBuf::from))
            .unwrap_or_else(|| run_dir.join("kernel.sock"));
        let token_path = config
            .token_path
            .clone()
            .map(PathBuf::from)
            .or_else(|| std::env::var("KIN_KERNEL_TOKEN").ok().map(PathBuf::from))
            .unwrap_or_else(|| run_dir.join("internal.token"));
        let token_path = if token_path.exists() { Some(token_path) } else { None };
        Self {
            run_dir: Some(run_dir),
            socket_path,
            token_path,
        }
    }

    /// 读内部 token（缺失视为不校验，便于本机调试）。
    pub fn internal_token(&self) -> Option<String> {
        let path = self.token_path.as_ref()?;
        std::fs::read_to_string(path)
            .ok()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn crag_args_match_kernel_spec() {
        let mut config = KernelConfig::default();
        config.slots_per_worker = Some(3);
        assert_eq!(
            config.crag_cli_args(),
            vec![
                "--single-process-subagents",
                "--max-procs",
                "3",
                "--continuous-tool-loop"
            ]
        );
    }

    #[test]
    fn slots_are_clamped_to_spec_range() {
        let mut config = KernelConfig::default();
        config.slots_per_worker = Some(99);
        assert_eq!(config.slots(), 20);
        config.slots_per_worker = Some(0);
        assert_eq!(config.slots(), 1);
    }

    #[test]
    fn session_slots_never_exceed_cgroup_capacity() {
        // 校准基准：5 GiB 容器刚好放满 20 个会话（上游确认的一槽 5G）。
        assert_eq!(capacity_from_limit(5 * 1024 * 1024 * 1024), 20);
        // 2 GiB 容器 -> 8 个会话；512 MiB -> 2 个。
        assert_eq!(capacity_from_limit(2 * 1024 * 1024 * 1024), 8);
        assert_eq!(capacity_from_limit(512 * 1024 * 1024), 2);
        // 上限与本文件 slots() 的 20 对齐。
        let mut config = KernelConfig::default();
        config.extra.insert("session_slots".into(), serde_json::json!(128));
        assert!(config.session_slots() <= 20);
    }

    #[test]
    fn unknown_fields_are_preserved() {
        let config: KernelConfig =
            serde_json::from_str(r#"{"dataplane":"crag","future_field":{"a":1}}"#).unwrap();
        assert_eq!(config.dataplane.as_deref(), Some("crag"));
        assert!(config.extra.contains_key("future_field"));
    }
}
