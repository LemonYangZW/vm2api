//! OAuth 刷新：按现网 `worker/internal/oauth/refresher.go` 的协议刷新 access token。
//!
//! 请求真值：
//! ```text
//! POST <TokenURL>
//! accept: application/json, text/plain, */*
//! content-type: application/json
//! user-agent: axios/1.13.6
//! {"grant_type":"refresh_token","refresh_token":"…","client_id":"9d1c250a-…"}
//! ```
//!
//! 错误分类（决定要不要重试）：
//! - `invalid_grant` / `invalid_refresh_token` / HTTP 400 → **致命**（重试无用）
//! - HTTP 429 / 5xx / 传输层失败 → **可重试**

use std::io;
use std::path::PathBuf;

use std::sync::Arc;

use serde_json::Value;

use crate::credential::{self, Credential, Store};

/// 官方 client id（现网常量）。
pub const DEFAULT_CLIENT_ID: &str = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
/// 官方 token 端点。
pub const DEFAULT_TOKEN_URL: &str = "https://console.anthropic.com/v1/oauth/token";

/// 刷新失败。
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RefreshError {
    /// 重试无用：refresh token 失效 / 请求非法。
    Fatal { code: String, message: String },
    /// 可重试：限流或上游 5xx。
    Retryable { status: u16, message: String },
    /// 传输层失败（DNS/TLS/网络）。
    Transport(String),
}

impl RefreshError {
    pub fn retryable(&self) -> bool {
        !matches!(self, RefreshError::Fatal { .. })
    }
}

impl std::fmt::Display for RefreshError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RefreshError::Fatal { code, message } => write!(f, "oauth fatal {code}: {message}"),
            RefreshError::Retryable { status, message } => {
                write!(f, "oauth retryable {status}: {message}")
            }
            RefreshError::Transport(message) => write!(f, "oauth transport: {message}"),
        }
    }
}

/// 刷新器：凭据的唯一刷新管理者（现网注释明确「不要再加并行 ticker」）。
#[derive(Debug)]
pub struct Refresher {
    pub token_url: String,
    pub client_id: String,
    pub ca_pem: Option<PathBuf>,
    /// 凭据存储；为 `None` 时只能用 `refresh()` 这一层。
    pub store: Option<Arc<Store>>,
    /// 提前刷新的阈值（毫秒，现网缺省 5 分钟）。
    pub skew_ms: i64,
    /// 刷新重试次数（现网缺省 3）。
    pub max_tries: u32,
    /// 进程内单飞：并发 hop 只刷一次。
    gate: tokio::sync::Mutex<()>,
}

impl Refresher {
    pub fn new(token_url: impl Into<String>) -> Self {
        Self {
            token_url: token_url.into(),
            client_id: DEFAULT_CLIENT_ID.to_string(),
            ca_pem: None,
            store: None,
            skew_ms: 300_000,
            max_tries: 3,
            gate: tokio::sync::Mutex::new(()),
        }
    }

    /// 挂上凭据存储（接线 `UpstreamClient` 时必须）。
    pub fn with_store(mut self, store: Arc<Store>) -> Self {
        self.store = Some(store);
        self
    }

    pub fn with_ca(mut self, ca: Option<PathBuf>) -> Self {
        self.ca_pem = ca;
        self
    }

    /// 刷新一份凭据；成功后返回新的 access/refresh。
    pub async fn refresh(&self, current: &Credential) -> Result<Credential, RefreshError> {
        let payload = serde_json::json!({
            "grant_type": "refresh_token",
            "refresh_token": current.refresh_token,
            "client_id": self.client_id,
        });
        let body = serde_json::to_vec(&payload).unwrap_or_default();
        let response = crate::http::one::post(
            &self.token_url,
            &[
                ("accept", "application/json, text/plain, */*".to_string()),
                ("content-type", "application/json".to_string()),
                ("user-agent", "axios/1.13.6".to_string()),
            ],
            &body,
            self.ca_pem.as_deref(),
        )
        .await
        .map_err(|error| RefreshError::Transport(error.to_string()))?;

        let decoded: Value = serde_json::from_slice(&response.body).unwrap_or(Value::Null);
        let text = |key: &str| {
            decoded
                .get(key)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string()
        };
        if !(200..300).contains(&response.status) {
            let code = text("error");
            let message = {
                let description = text("error_description");
                if description.is_empty() {
                    format!("HTTP {}", response.status)
                } else {
                    description
                }
            };
            let fatal = response.status == 400
                || code == "invalid_grant"
                || code == "invalid_refresh_token";
            return Err(if fatal {
                RefreshError::Fatal {
                    code: if code.is_empty() {
                        "invalid_grant".to_string()
                    } else {
                        code
                    },
                    message,
                }
            } else {
                RefreshError::Retryable {
                    status: response.status,
                    message,
                }
            });
        }
        let access_token = text("access_token");
        if access_token.is_empty() {
            return Err(RefreshError::Transport("响应缺少 access_token".to_string()));
        }
        let refresh_token = {
            let next = text("refresh_token");
            if next.is_empty() {
                current.refresh_token.clone()
            } else {
                next
            }
        };
        let expires_in = decoded
            .get("expires_in")
            .and_then(|v| v.as_i64())
            .unwrap_or(0);
        let scopes = {
            let scope = text("scope");
            if scope.is_empty() {
                Vec::new()
            } else {
                scope
                    .split_whitespace()
                    .map(str::to_string)
                    .collect::<Vec<_>>()
            }
        };
        Ok(Credential {
            access_token,
            refresh_token,
            expires_at: if expires_in > 0 {
                credential::now_ms() + expires_in * 1000
            } else {
                0
            },
            scopes,
            kind: current.kind,
            scheme: current.scheme,
            email: current.email.clone(),
            account_uuid: current.account_uuid.clone(),
            org_uuid: current.org_uuid.clone(),
            base_url: current.base_url.clone(),
            ..Credential::default()
        })
    }
}

impl Refresher {
    fn skew(&self) -> i64 {
        if self.skew_ms <= 0 {
            300_000
        } else {
            self.skew_ms
        }
    }

    fn tries(&self) -> u32 {
        if self.max_tries == 0 {
            3
        } else {
            self.max_tries
        }
    }

    /// 取一份可用凭据：过期则刷新，`force` 只给运维显式重试用。
    ///
    /// 并发安全：进程内单飞 + 存储文件锁；失败后若磁盘上的 generation 已被
    /// 别的进程刷新，则直接采用磁盘值（现网同款兜底）。
    pub async fn ensure(&self, force: bool) -> Result<Credential, RefreshError> {
        let Some(store) = self.store.clone() else {
            return Err(RefreshError::Fatal {
                code: "store_missing".into(),
                message: "credential store is not configured".into(),
            });
        };
        let _guard = self.gate.lock().await;
        let (current, mut document) = store
            .load()
            .map_err(|error| RefreshError::Transport(error.to_string()))?;

        if current.is_api_key() {
            return if current.valid() {
                Ok(current)
            } else {
                Err(RefreshError::Fatal {
                    code: "api_key_missing".into(),
                    message: "console API key is missing".into(),
                })
            };
        }
        if !force && !current.needs_refresh(credential::now_ms(), self.skew()) {
            return Ok(current);
        }
        if current.refresh_token.trim().is_empty() {
            return Err(RefreshError::Fatal {
                code: "refresh_token_missing".into(),
                message: "credential has no refresh token".into(),
            });
        }

        let mut last: Option<RefreshError> = None;
        for attempt in 0..self.tries() {
            if attempt > 0 {
                let backoff = 300u64 << (attempt - 1);
                tokio::time::sleep(std::time::Duration::from_millis(backoff)).await;
            }
            match self.refresh(&current).await {
                Ok(next) => {
                    let mut next = next;
                    next.generation = current.generation;
                    let saved = store
                        .save(&next, &mut document)
                        .map_err(|error| RefreshError::Transport(error.to_string()))?;
                    return Ok(saved);
                }
                Err(error) => {
                    let retryable = error.retryable();
                    last = Some(error);
                    if !retryable {
                        break;
                    }
                }
            }
        }

        // 竞态兜底：别的进程/实例已经刷过了。
        if let Ok((latest, _)) = store.load() {
            if latest.generation != current.generation
                && !latest.needs_refresh(credential::now_ms(), self.skew())
            {
                return Ok(latest);
            }
        }
        Err(last.unwrap_or_else(|| RefreshError::Transport("refresh failed".into())))
    }

    /// 便捷入口：判「需要刷新就刷」并返回可用凭据（`io::Result` 形态）。
    pub async fn ensure_io(&self, force: bool) -> io::Result<Credential> {
        self.ensure(force)
            .await
            .map_err(|error| io::Error::other(error.to_string()))
    }
}

/// 便捷入口：`io::Result` 形态（调用方只需要成功/失败）。
pub async fn ensure_fresh(
    refresher: &Refresher,
    current: &Credential,
) -> io::Result<Credential> {
    refresher
        .refresh(current)
        .await
        .map_err(|error| io::Error::other(error.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    /// 起一个一次性 HTTP/1.1 服务，返回 (addr, 收到的请求体)。
    async fn mock_endpoint(
        status: u16,
        body: &'static str,
    ) -> (String, tokio::sync::oneshot::Receiver<(String, String)>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap().to_string();
        let (tx, rx) = tokio::sync::oneshot::channel();
        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut buf = Vec::new();
            let mut chunk = [0u8; 4096];
            loop {
                let n = socket.read(&mut chunk).await.unwrap_or(0);
                if n == 0 {
                    break;
                }
                buf.extend_from_slice(&chunk[..n]);
                if let Some(pos) = buf.windows(4).position(|w| w == b"\r\n\r\n") {
                    let head = String::from_utf8_lossy(&buf[..pos]).to_string();
                    let length = head
                        .lines()
                        .find_map(|line| {
                            line.to_ascii_lowercase()
                                .strip_prefix("content-length:")
                                .map(|v| v.trim().parse::<usize>().unwrap_or(0))
                        })
                        .unwrap_or(0);
                    if buf.len() >= pos + 4 + length {
                        break;
                    }
                }
            }
            let split = buf.windows(4).position(|w| w == b"\r\n\r\n").unwrap();
            let head = String::from_utf8_lossy(&buf[..split]).to_string();
            let body_text = String::from_utf8_lossy(&buf[split + 4..]).to_string();
            let _ = tx.send((head, body_text));
            let response = format!(
                "HTTP/1.1 {status} X\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}",
                body.len()
            );
            let _ = socket.write_all(response.as_bytes()).await;
        });
        (addr, rx)
    }

    fn credential() -> Credential {
        Credential {
            access_token: "old-access".into(),
            refresh_token: "old-refresh".into(),
            expires_at: credential::now_ms() + 3_600_000,
            ..Credential::default()
        }
    }

    #[tokio::test]
    async fn refresh_posts_official_payload_and_returns_new_tokens() {
        let (addr, captured) = mock_endpoint(
            200,
            r#"{"access_token":"new-access","refresh_token":"new-refresh","expires_in":28800,"scope":"user:inference"}"#,
        )
        .await;
        let refresher = Refresher::new(format!("http://{addr}/v1/oauth/token"));
        let next = refresher.refresh(&credential()).await.unwrap();
        assert_eq!(next.access_token, "new-access");
        assert_eq!(next.refresh_token, "new-refresh");
        assert!(next.expires_at > credential::now_ms() + 28_000_000);
        assert_eq!(next.scopes, vec!["user:inference".to_string()]);

        let (head, body) = captured.await.unwrap();
        assert!(head.starts_with("POST /v1/oauth/token HTTP/1.1"), "{head}");
        assert!(
            head.to_ascii_lowercase().contains("user-agent: axios/1.13.6"),
            "{head}"
        );
        assert!(
            head.to_ascii_lowercase().contains("content-type: application/json"),
            "{head}"
        );
        let sent: Value = serde_json::from_str(&body).unwrap();
        assert_eq!(sent["grant_type"], "refresh_token");
        assert_eq!(sent["refresh_token"], "old-refresh");
        assert_eq!(sent["client_id"], DEFAULT_CLIENT_ID);
    }

    #[tokio::test]
    async fn keeps_old_refresh_token_when_response_omits_it() {
        let (addr, _captured) =
            mock_endpoint(200, r#"{"access_token":"a2","expires_in":60}"#).await;
        let refresher = Refresher::new(format!("http://{addr}/token"));
        let next = refresher.refresh(&credential()).await.unwrap();
        assert_eq!(next.refresh_token, "old-refresh");
    }

    #[tokio::test]
    async fn invalid_grant_is_fatal() {
        let (addr, _captured) = mock_endpoint(
            400,
            r#"{"error":"invalid_grant","error_description":"refresh token revoked"}"#,
        )
        .await;
        let refresher = Refresher::new(format!("http://{addr}/token"));
        let error = refresher.refresh(&credential()).await.unwrap_err();
        assert!(!error.retryable(), "{error:?}");
        match error {
            RefreshError::Fatal { code, message } => {
                assert_eq!(code, "invalid_grant");
                assert!(message.contains("revoked"));
            }
            other => panic!("expected fatal, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn rate_limit_is_retryable() {
        let (addr, _captured) = mock_endpoint(429, r#"{"error":"rate_limited"}"#).await;
        let refresher = Refresher::new(format!("http://{addr}/token"));
        let error = refresher.refresh(&credential()).await.unwrap_err();
        assert!(error.retryable(), "{error:?}");
        assert!(matches!(error, RefreshError::Retryable { status: 429, .. }));
    }

    #[tokio::test]
    async fn transport_failure_is_retryable() {
        // 127.0.0.1:1 上没人监听。
        let refresher = Refresher::new("http://127.0.0.1:1/token");
        let error = refresher.refresh(&credential()).await.unwrap_err();
        assert!(matches!(error, RefreshError::Transport(_)), "{error:?}");
    }

    // ---- Ensure（接线层）----

    use crate::credential::Store;
    use std::sync::{Arc, Mutex};

    fn temp_store(tag: &str) -> Arc<Store> {
        let dir = std::env::temp_dir().join(format!(
            "cragv2-oauth-{tag}-{}-{}",
            std::process::id(),
            credential::now_ms()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        Arc::new(Store::new(dir.join("credentials.json")))
    }

    fn write_credential(store: &Store, expires_at: i64, refresh: &str) {
        let document = serde_json::json!({
            "type": "oauth",
            "claudeAiOauth": {
                "accessToken": "old-access",
                "refreshToken": refresh,
                "expiresAt": expires_at,
                "kinGeneration": 5
            }
        });
        std::fs::write(&store.path, serde_json::to_string_pretty(&document).unwrap()).unwrap();
    }

    /// 计数型 mock token 端点。
    async fn counting_endpoint(
        hits: Arc<Mutex<usize>>,
    ) -> (String, tokio::sync::mpsc::UnboundedSender<()>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap().to_string();
        let (stop_tx, mut stop_rx) = tokio::sync::mpsc::unbounded_channel::<()>();
        tokio::spawn(async move {
            loop {
                tokio::select! {
                    _ = stop_rx.recv() => return,
                    accepted = listener.accept() => {
                        let Ok((mut socket, _)) = accepted else { return };
                        let hits = Arc::clone(&hits);
                        tokio::spawn(async move {
                            let mut buf = Vec::new();
                            let mut chunk = [0u8; 4096];
                            loop {
                                let n = socket.read(&mut chunk).await.unwrap_or(0);
                                if n == 0 { break; }
                                buf.extend_from_slice(&chunk[..n]);
                                if let Some(pos) = buf.windows(4).position(|w| w == b"\r\n\r\n") {
                                    let head = String::from_utf8_lossy(&buf[..pos]).to_string();
                                    let length = head.lines().find_map(|line| {
                                        line.to_ascii_lowercase()
                                            .strip_prefix("content-length:")
                                            .map(|v| v.trim().parse::<usize>().unwrap_or(0))
                                    }).unwrap_or(0);
                                    if buf.len() >= pos + 4 + length { break; }
                                }
                            }
                            *hits.lock().unwrap() += 1;
                            let payload = r#"{"access_token":"fresh-access","refresh_token":"fresh-refresh","expires_in":28800,"scope":"user:inference"}"#;
                            let response = format!(
                                "HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{payload}",
                                payload.len()
                            );
                            let _ = socket.write_all(response.as_bytes()).await;
                        });
                    }
                }
            }
        });
        (addr, stop_tx)
    }

    #[tokio::test]
    async fn ensure_skips_refresh_when_credential_is_fresh() {
        let store = temp_store("fresh");
        write_credential(&store, credential::now_ms() + 3_600_000, "r");
        let refresher = Refresher::new("http://127.0.0.1:1/token").with_store(Arc::clone(&store));
        let credential = refresher.ensure(false).await.unwrap();
        assert_eq!(credential.access_token, "old-access");
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }

    #[tokio::test]
    async fn ensure_refreshes_expired_and_persists_generation() {
        let store = temp_store("expired");
        write_credential(&store, credential::now_ms() - 1000, "old-refresh");
        let hits = Arc::new(Mutex::new(0usize));
        let (addr, stop) = counting_endpoint(Arc::clone(&hits)).await;
        let refresher = Refresher::new(format!("http://{addr}/token")).with_store(Arc::clone(&store));
        let credential = refresher.ensure(false).await.unwrap();
        assert_eq!(credential.access_token, "fresh-access");
        assert_eq!(credential.refresh_token, "fresh-refresh");
        assert_eq!(*hits.lock().unwrap(), 1);
        let text = std::fs::read_to_string(&store.path).unwrap();
        let parsed: Value = serde_json::from_str(&text).unwrap();
        assert_eq!(parsed["claudeAiOauth"]["accessToken"], "fresh-access");
        assert_eq!(parsed["claudeAiOauth"]["refreshToken"], "fresh-refresh");
        assert!(parsed["kinGeneration"].as_i64().unwrap() > 5);
        assert_eq!(
            parsed["kinGeneration"].as_i64().unwrap(),
            parsed["claudeAiOauth"]["kinGeneration"].as_i64().unwrap()
        );
        let _ = stop.send(());
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }

    #[tokio::test]
    async fn ensure_is_single_flight_under_concurrency() {
        let store = temp_store("single");
        write_credential(&store, credential::now_ms() - 1000, "old-refresh");
        let hits = Arc::new(Mutex::new(0usize));
        let (addr, stop) = counting_endpoint(Arc::clone(&hits)).await;
        let refresher = Arc::new(
            Refresher::new(format!("http://{addr}/token")).with_store(Arc::clone(&store)),
        );
        let mut handles = Vec::new();
        for _ in 0..5 {
            let refresher = Arc::clone(&refresher);
            handles.push(tokio::spawn(async move {
                refresher.ensure(false).await.map(|c| c.access_token)
            }));
        }
        for handle in handles {
            assert_eq!(handle.await.unwrap().unwrap(), "fresh-access");
        }
        assert_eq!(*hits.lock().unwrap(), 1, "并发 ensure 只允许刷新一次");
        let _ = stop.send(());
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }

    #[tokio::test]
    async fn ensure_reports_missing_refresh_token() {
        let store = temp_store("no-refresh");
        write_credential(&store, credential::now_ms() - 1000, "");
        let refresher = Refresher::new("http://127.0.0.1:1/token").with_store(Arc::clone(&store));
        let error = refresher.ensure(false).await.unwrap_err();
        match error {
            RefreshError::Fatal { code, .. } => assert_eq!(code, "refresh_token_missing"),
            other => panic!("expected fatal, got {other:?}"),
        }
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }

    #[tokio::test]
    async fn ensure_returns_api_key_without_network() {
        let store = temp_store("apikey");
        std::fs::write(&store.path, r#"{"anthropicApiKey":{"apiKey":"sk-ant-key"}}"#).unwrap();
        let refresher = Refresher::new("http://127.0.0.1:1/token").with_store(Arc::clone(&store));
        let credential = refresher.ensure(false).await.unwrap();
        assert_eq!(credential.token(), "sk-ant-key");
        assert_eq!(credential.resolved_scheme(), crate::credential::Scheme::XApiKey);
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }

    #[tokio::test]
    async fn ensure_without_store_is_fatal() {
        let refresher = Refresher::new("http://127.0.0.1:1/token");
        let error = refresher.ensure(false).await.unwrap_err();
        assert!(
            matches!(error, RefreshError::Fatal { ref code, .. } if code == "store_missing"),
            "{error:?}"
        );
    }
}
