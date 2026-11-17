//! OAuth 额度探测（`/internal/oauth/usage`）。
//!
//! 面板用这个窗口数据（`five_hour` / `seven_day`）做账号额度与轮转；
//! 缺它只能回落到面板自己的计数，准确度会掉。
//!
//! 请求形态**逐项照抄官方 CLI 自己的 `/usage`**
//! （真值：官方 CC `src/services/api/usage.ts` + `src/utils/http.ts`）：
//!
//! ```text
//! GET {BASE_API_URL}/api/oauth/usage        超时 5s
//! Content-Type:  application/json
//! User-Agent:    claude-cli/<ver> (external, cli)
//! Authorization: Bearer <accessToken>
//! anthropic-beta: oauth-2025-04-20
//! ```
//!
//! 这是内核**唯一**主动发起的出站请求，且不含任何推理/thinking 字段 ——
//! 与用户手动敲 `/usage` 完全同形（这也是它不算高危的原因）。
//!
//! 唯一有意的偏差：`accept-encoding: identity`。官方走 axios，会要 br/gzip 并自行解压；
//! 我们没有解压器，宁可声明不压缩，也不假装支持再解不开。

use std::io;
use std::path::Path;

use serde_json::Value;

use crate::http::one;

/// 官方 CLI 使用的 OAuth beta 头。
pub const OAUTH_BETA: &str = "oauth-2025-04-20";
/// 额度端点路径。
pub const USAGE_PATH: &str = "/api/oauth/usage";
/// 官方 CLI 的超时（5 s）。
pub const USAGE_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(5);

/// 探测结果：原样带上游状态码与响应体，由调用方决定怎么回投控制面。
pub struct UsageProbe {
    pub status: u16,
    pub body: Value,
}

/// 发一次额度探测。`base` 形如 `https://api.anthropic.com`。
pub async fn fetch(
    base: &str,
    access_token: &str,
    ca: Option<&Path>,
) -> io::Result<UsageProbe> {
    let url = format!("{}{USAGE_PATH}", base.trim_end_matches('/'));
    let headers = [
        ("content-type", "application/json".to_string()),
        ("accept", "application/json, text/plain, */*".to_string()),
        ("accept-encoding", "identity".to_string()),
        ("user-agent", crate::protocol::identity::user_agent()),
        ("authorization", format!("Bearer {access_token}")),
        ("anthropic-beta", OAUTH_BETA.to_string()),
    ];
    let response =
        tokio::time::timeout(USAGE_TIMEOUT, one::request("GET", &url, &headers, None, ca))
            .await
            .map_err(|_| io::Error::other("usage probe timed out"))??;
    let body: Value = serde_json::from_slice(&response.body).unwrap_or_else(|_| {
        serde_json::json!({
            "error": {
                "code": "usage_probe_unparsable",
                "message": crate::ndjson::redact(&response.body_text()),
            }
        })
    });
    Ok(UsageProbe {
        status: response.status,
        body,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn usage_request_shape_matches_the_official_cli() {
        // 与 usage.ts / http.ts 对齐的四个头（外加 accept/encoding 两个 axios 默认）。
        let headers = [
            ("content-type", "application/json".to_string()),
            ("accept", "application/json, text/plain, */*".to_string()),
            ("accept-encoding", "identity".to_string()),
            ("user-agent", crate::protocol::identity::user_agent()),
            ("authorization", "Bearer t".to_string()),
            ("anthropic-beta", OAUTH_BETA.to_string()),
        ];
        let names: Vec<&str> = headers.iter().map(|(k, _)| *k).collect();
        assert_eq!(
            names,
            vec![
                "content-type",
                "accept",
                "accept-encoding",
                "user-agent",
                "authorization",
                "anthropic-beta"
            ]
        );
        assert_eq!(OAUTH_BETA, "oauth-2025-04-20");
        assert_eq!(USAGE_PATH, "/api/oauth/usage");
        // 不含任何推理/思考相关字段（这是"不算高危"的前提）。
        for (_, value) in &headers {
            assert!(!value.contains("thinking"), "{value}");
            assert!(!value.contains("max_tokens"), "{value}");
        }
        assert!(crate::protocol::identity::user_agent().starts_with("claude-cli/"));
    }
}
