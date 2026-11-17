//! `crag-v2 probe` 端到端：真起 mock h2 上游与真实凭据文件，验证退出码语义。
//!
//! 验收：
//! 1. 凭据有效 + 上游可达 → 0，且 `/v1/models` 走的是非推理 GET；
//! 2. 凭据缺失 → 1（并且**不发起任何连接**）；
//! 3. 代理不可达 → 2（在 TLS 之前就失败，报文不出网）。

use std::sync::Arc;

use bytes::Bytes;
use cragv2::config::KernelConfig;
use cragv2::credential::{now_ms, Store};
use serde_json::{json, Value};
use tokio::net::TcpListener;

fn temp_store(tag: &str) -> (Arc<Store>, std::path::PathBuf) {
    let dir = std::env::temp_dir().join(format!(
        "cragv2-probe-{tag}-{}-{}",
        std::process::id(),
        now_ms()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    let store = Arc::new(Store::new(dir.join("credentials.json")));
    (store, dir)
}

fn config(upstream: &str, credential_path: &str, extra: Value) -> KernelConfig {
    let mut base = json!({
        "dataplane": "crag",
        "slots_per_worker": 2,
        "upstream_mode": "direct",
        "upstream_base": upstream,
        "credential_path": credential_path,
        "oauth_token_url": "http://127.0.0.1:1/token",
    });
    for (key, value) in extra.as_object().into_iter().flatten() {
        base[key] = value.clone();
    }
    serde_json::from_value(base).unwrap()
}

/// mock 上游：只应答 `GET /v1/models`。
async fn mock_models_upstream(seen: tokio::sync::mpsc::UnboundedSender<String>) -> String {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    tokio::spawn(async move {
        let (tcp, _) = listener.accept().await.unwrap();
        let mut connection = h2::server::handshake(tcp).await.unwrap();
        while let Some(result) = connection.accept().await {
            let (request, mut respond) = result.unwrap();
            let path = request.uri().path().to_string();
            let auth = request
                .headers()
                .get("authorization")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("-")
                .to_string();
            let _ = seen.send(format!("{path} {auth}"));
            let payload = r#"{"data":[{"id":"claude-opus-5-5"},{"id":"claude-haiku-5-5"}],"has_more":false}"#;
            let response = http::Response::builder()
                .status(200)
                .header("content-type", "application/json")
                .body(())
                .unwrap();
            let mut send = respond.send_response(response, false).unwrap();
            send.send_data(Bytes::from_static(payload.as_bytes()), true).unwrap();
        }
    });
    addr
}

fn write_credential(store: &Store, expires_at: i64) {
    std::fs::write(
        &store.path,
        serde_json::to_string_pretty(&json!({
            "type": "oauth",
            "claudeAiOauth": {
                "accessToken": "probe-access",
                "refreshToken": "probe-refresh",
                "expiresAt": expires_at,
                "kinGeneration": 3
            }
        }))
        .unwrap(),
    )
    .unwrap();
}

#[tokio::test]
async fn probe_passes_with_valid_credential_and_reachable_upstream() {
    let (store, dir) = temp_store("ok");
    write_credential(&store, now_ms() + 3_600_000);
    let (tx, mut seen) = tokio::sync::mpsc::unbounded_channel();
    let addr = mock_models_upstream(tx).await;
    let config = config(&format!("http://{addr}"), &store.path.display().to_string(), json!({}));

    let report = cragv2::probe::run(&config).await;
    let rendered = report.render();
    assert_eq!(report.exit_code(), 0, "{rendered}");
    assert!(rendered.contains("[OK  ] credential"), "{rendered}");
    assert!(rendered.contains("kind=oauth"), "{rendered}");
    assert!(rendered.contains("[OK  ] tls_h2"), "{rendered}");
    assert!(rendered.contains("[OK  ] endpoint"), "{rendered}");
    assert!(rendered.contains("2 个模型"), "{rendered}");
    // 凭据脱敏：不得打印完整 token
    assert!(!rendered.contains("probe-access"), "{rendered}");

    let line = seen.recv().await.unwrap();
    assert_eq!(line, "/v1/models Bearer probe-access");
    std::fs::remove_dir_all(dir).ok();
}

#[tokio::test]
async fn probe_fails_on_missing_credential_without_network() {
    let (store, dir) = temp_store("missing");
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let config = config(&format!("http://{addr}"), &store.path.display().to_string(), json!({}));

    let report = cragv2::probe::run(&config).await;
    let rendered = report.render();
    assert_eq!(report.exit_code(), 1, "{rendered}");
    assert!(rendered.contains("[FAIL] credential"), "{rendered}");
    // 关键：凭据不可读时不应该去连上游。
    let touched = tokio::time::timeout(std::time::Duration::from_millis(300), listener.accept()).await;
    assert!(touched.is_err(), "凭据失败却连了上游");
    std::fs::remove_dir_all(dir).ok();
}

#[tokio::test]
async fn probe_fails_on_unreachable_proxy_before_tls() {
    let (store, dir) = temp_store("proxy");
    write_credential(&store, now_ms() + 3_600_000);
    let config = config(
        "https://api.anthropic.com",
        &store.path.display().to_string(),
        json!({"proxy_url": "socks5h://127.0.0.1:1", "proxy_required": true}),
    );

    let report = cragv2::probe::run(&config).await;
    let rendered = report.render();
    assert_eq!(report.exit_code(), 2, "{rendered}");
    assert!(rendered.contains("[FAIL] proxy"), "{rendered}");
    // 代理失败后不应继续尝试 TLS
    assert!(!rendered.contains("tls_h2"), "{rendered}");
    std::fs::remove_dir_all(dir).ok();
}

#[tokio::test]
async fn probe_reports_expired_credential() {
    let (store, dir) = temp_store("expired");
    write_credential(&store, now_ms() - 60_000);
    let (tx, _seen) = tokio::sync::mpsc::unbounded_channel();
    let addr = mock_models_upstream(tx).await;
    let config = config(&format!("http://{addr}"), &store.path.display().to_string(), json!({}));

    let report = cragv2::probe::run(&config).await;
    let rendered = report.render();
    assert_eq!(report.exit_code(), 1, "{rendered}");
    assert!(rendered.contains("已过期"), "{rendered}");
    std::fs::remove_dir_all(dir).ok();
}
