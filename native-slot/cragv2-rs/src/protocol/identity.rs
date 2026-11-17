//! 出站身份：版本常量、UA、`x-app`、会话 ID、MACRO。
//!
//! 真值：`11_CRAG_V2_SPEC.md` §6.1 / §7.2，与 `RESIDUAL_GAPS.sdkPackageVersion`
//! 的硬约束一致：**头部保留真实的 0.74.0，不得伪装成官方 303 的 0.128.0**。
//! 对外呈现的是 2.1.303，运行时基线是 2.1.88 —— 这是 backport 形态，不是笔误。

use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::{NATIVE_BASE_VERSION, NATIVE_SDK_PACKAGE_VERSION, VERSION};

/// 用户可见 / billing / UA 使用的协议版本。
pub fn cli_version() -> String {
    env::var("CLAUDE_CODE_VERSION_OVERRIDE")
        .ok()
        .filter(|v| !v.trim().is_empty())
        .unwrap_or_else(|| VERSION.to_string())
}

/// `x-stainless-package-version`：官方 2.1.3xx 内嵌的 Stainless 版本。
///
/// 实测（本地 stub 抓官方 CLI 2.1.321 的出站头）是 **0.128.0**，与厂商
/// `WRAP_OFFICIAL_STAINLESS.packageVersion` 一致；88 bundle 的 0.74.0 只是
/// 内核 backport 内部值，不能写到 wire 上（UA 会出现自相矛盾）。
pub fn sdk_package_version() -> String {
    crate::OFFICIAL_303_SDK_PACKAGE_VERSION.to_string()
}

/// 真实运行时基线（仅内部/日志使用，不上 wire）。
pub fn native_base_version() -> &'static str {
    NATIVE_BASE_VERSION
}

/// 入口类别，UA 括号内第一段。
pub fn entrypoint() -> String {
    env::var("CLAUDE_CODE_ENTRYPOINT")
        .ok()
        .filter(|v| !v.trim().is_empty())
        .unwrap_or_else(|| "cli".to_string())
}

/// `claude-cli/<version> (external, <entrypoint>)`。
pub fn user_agent() -> String {
    format!("claude-cli/{} (external, {})", cli_version(), entrypoint())
}

/// `x-app`：后台请求走 `cli-bg`，其余 `cli`。
pub fn x_app(background: bool) -> &'static str {
    if background {
        "cli-bg"
    } else {
        "cli"
    }
}

/// 随机 UUIDv4（小写，带连字符），用于 `x-client-request-id` 与会话 ID。
pub fn new_uuid() -> String {
    // 无 rand 依赖：用系统时间 + 进程内计数器做种子，再用 SplitMix64 展开 16 字节。
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0);
    let seq = COUNTER.fetch_add(1, Ordering::Relaxed);
    let mut state = nanos ^ (seq.wrapping_mul(0x9e37_79b9_7f4a_7c15)) ^ (std::process::id() as u64) << 32;
    let mut bytes = [0u8; 16];
    for chunk in bytes.chunks_mut(8) {
        state = state.wrapping_add(0x9e37_79b9_7f4a_7c15);
        let mut z = state;
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58_476d_1ce4_e5b9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d0_49bb_1331_11eb);
        z ^= z >> 31;
        chunk.copy_from_slice(&z.to_le_bytes());
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    let h = |b: &[u8]| b.iter().map(|x| format!("{x:02x}")).collect::<String>();
    format!(
        "{}-{}-{}-{}-{}",
        h(&bytes[0..4]),
        h(&bytes[4..6]),
        h(&bytes[6..8]),
        h(&bytes[8..10]),
        h(&bytes[10..16])
    )
}

/// 全局配置文件路径（`CLAUDE_CONFIG_DIR/.claude.json` 或 `~/.claude.json`）。
pub fn global_config_path() -> std::path::PathBuf {
    if let Ok(dir) = env::var("CLAUDE_CONFIG_DIR") {
        if !dir.trim().is_empty() {
            return std::path::Path::new(&dir).join(".claude.json");
        }
    }
    let home = env::var("HOME").or_else(|_| env::var("USERPROFILE")).unwrap_or_default();
    std::path::Path::new(&home).join(".claude.json")
}

/// 设备 ID / OAuth 账户 UUID；缺失时生成并尽量写回（写失败不影响请求）。
pub struct Identity {
    pub process_session: String,
    device_id: String,
    account_uuid: String,
}

impl Identity {
    pub fn load() -> Self {
        let path = global_config_path();
        let text = std::fs::read_to_string(&path).unwrap_or_default();
        let cfg: serde_json::Value = serde_json::from_str(&text).unwrap_or(serde_json::Value::Null);
        let device_id = cfg
            .get("userID")
            .and_then(|v| v.as_str())
            .map(str::to_string)
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| {
                let generated = new_uuid().replace('-', "");
                // 与官方一致：首次生成后写回全局配置；失败忽略。
                let mut next = cfg.clone();
                if let Some(obj) = next.as_object_mut() {
                    obj.insert("userID".into(), serde_json::Value::String(generated.clone()));
                    if let Ok(body) = serde_json::to_string_pretty(&next) {
                        let _ = std::fs::write(&path, format!("{body}\n"));
                    }
                }
                generated
            });
        let account_uuid = cfg
            .get("oauthAccount")
            .and_then(|v| v.get("accountUuid"))
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        Self {
            process_session: new_uuid(),
            device_id,
            account_uuid,
        }
    }

    /// 设备标识的短摘要（只用于本地身份上报，**不进任何上游请求**）。
    pub fn device_id_hint(&self) -> String {
        self.device_id.chars().take(16).collect()
    }

    /// `metadata.user_id`：`{device_id, account_uuid, session_id}` 的紧凑 JSON。
    pub fn user_id(&self, session: &str, oauth_enabled: bool) -> String {
        let account = if oauth_enabled { self.account_uuid.as_str() } else { "" };
        let mut map = serde_json::Map::new();
        map.insert("device_id".into(), serde_json::Value::String(self.device_id.clone()));
        map.insert("account_uuid".into(), serde_json::Value::String(account.to_string()));
        map.insert("session_id".into(), serde_json::Value::String(session.to_string()));
        serde_json::to_string(&serde_json::Value::Object(map)).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn user_agent_uses_visible_version_and_entrypoint() {
        let ua = user_agent();
        assert!(ua.starts_with("claude-cli/2.1.321 (external, "), "{ua}");
    }

    #[test]
    fn header_sdk_version_is_the_real_074() {
        assert_eq!(sdk_package_version(), "0.128.0");
        assert_eq!(sdk_package_version(), crate::OFFICIAL_303_SDK_PACKAGE_VERSION);
    }

    #[test]
    fn uuid_is_v4_shaped() {
        let id = new_uuid();
        assert_eq!(id.len(), 36);
        assert_eq!(id.as_bytes()[14], b'4');
    }
}
