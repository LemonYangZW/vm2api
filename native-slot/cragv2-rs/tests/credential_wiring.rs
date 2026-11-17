//! 凭据接线端到端：`UpstreamClient` 每次 hop 从凭据文件取 token，过期先刷新。
//!
//! 验收：
//! 1. 未过期凭据 → 直接用文件里的 access token（`authorization: Bearer …`）；
//! 2. 过期凭据 → 先打 token 端点刷新，再用**新** token 打上游，且落盘 generation 递增；
//! 3. API key 凭据 → 走 `x-api-key`，不碰 token 端点。

use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use bytes::Bytes;
use cragv2::credential::{now_ms, Store};
use cragv2::http::client::UpstreamClient;
use cragv2::http::wire::build_messages_request;
use cragv2::oauth::Refresher;
use serde_json::{json, Value};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

struct Captured {
    headers: Vec<(String, String)>,
}

async fn mock_upstream(sse: &'static str) -> (String, tokio::sync::mpsc::UnboundedReceiver<Captured>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
    tokio::spawn(async move {
        let (tcp, _) = listener.accept().await.unwrap();
        let mut connection = h2::server::handshake(tcp).await.unwrap();
        while let Some(result) = connection.accept().await {
            let (request, mut respond) = result.unwrap();
            let headers = request
                .headers()
                .iter()
                .map(|(k, v)| (k.as_str().to_string(), v.to_str().unwrap_or_default().to_string()))
                .collect();
            let mut body = request.into_body();
            while let Some(chunk) = body.data().await {
                let chunk = chunk.unwrap();
                body.flow_control().release_capacity(chunk.len()).unwrap();
            }
            let _ = tx.send(Captured { headers });
            let response = http::Response::builder()
                .status(200)
                .header("content-type", "text/event-stream")
                .body(())
                .unwrap();
            let mut send = respond.send_response(response, false).unwrap();
            send.send_data(Bytes::from_static(sse.as_bytes()), true).unwrap();
        }
    });
    (addr, rx)
}

/// mock OAuth token 端点，返回给定 access token。
async fn mock_token_endpoint(
    access: &'static str,
    hits: Arc<AtomicUsize>,
) -> String {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    tokio::spawn(async move {
        loop {
            let Ok((mut socket, _)) = listener.accept().await else { return };
            hits.fetch_add(1, Ordering::SeqCst);
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
            let payload = format!(
                r#"{{"access_token":"{access}","refresh_token":"fresh-refresh","expires_in":28800,"scope":"user:inference"}}"#
            );
            let response = format!(
                "HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{payload}",
                payload.len()
            );
            let _ = socket.write_all(response.as_bytes()).await;
        }
    });
    addr
}

fn temp_store(tag: &str) -> (Arc<Store>, std::path::PathBuf) {
    let dir = std::env::temp_dir().join(format!(
        "cragv2-wiring-{tag}-{}-{}",
        std::process::id(),
        now_ms()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    let store = Arc::new(Store::new(dir.join("credentials.json")));
    (store, dir)
}

fn write_credential(store: &Store, json: Value) {
    std::fs::write(&store.path, serde_json::to_string_pretty(&json).unwrap()).unwrap();
}

fn request_body() -> Value {
    json!({
        "model": "claude-opus-5-5",
        "max_tokens": 8,
        "messages": [{"role": "user", "content": "ping"}]
    })
}

const SSE: &str = "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n";

fn header<'a>(captured: &'a Captured, name: &str) -> Option<&'a str> {
    captured
        .headers
        .iter()
        .find(|(k, _)| k == name)
        .map(|(_, v)| v.as_str())
}

#[tokio::test]
async fn fresh_credential_is_used_directly() {
    let (store, dir) = temp_store("fresh");
    write_credential(
        &store,
        json!({"type": "oauth", "claudeAiOauth": {
            "accessToken": "file-access",
            "refreshToken": "file-refresh",
            "expiresAt": now_ms() + 3_600_000
        }}),
    );
    let (upstream, mut captured) = mock_upstream(SSE).await;
    let hits = Arc::new(AtomicUsize::new(0));
    let token_addr = mock_token_endpoint("should-not-be-used", Arc::clone(&hits)).await;
    let refresher = Arc::new(
        Refresher::new(format!("http://{token_addr}/token")).with_store(Arc::clone(&store)),
    );
    let client = UpstreamClient::new(&format!("http://{upstream}"), None)
        .unwrap()
        .with_refresher(refresher);
    let wire = build_messages_request(&[], &[], &request_body(), false, true, false, "test-session");
    let response = client.post_messages(&wire).await.unwrap();
    assert_eq!(response.head.status, 200);

    let captured = captured.recv().await.unwrap();
    assert_eq!(
        header(&captured, "authorization"),
        Some("Bearer file-access"),
        "应直接使用凭据文件里的 token"
    );
    assert_eq!(hits.load(Ordering::SeqCst), 0, "未过期不应刷新");
    std::fs::remove_dir_all(dir).ok();
}

#[tokio::test]
async fn expired_credential_is_refreshed_before_hop() {
    let (store, dir) = temp_store("expired");
    write_credential(
        &store,
        json!({"type": "oauth", "claudeAiOauth": {
            "accessToken": "stale-access",
            "refreshToken": "good-refresh",
            "expiresAt": now_ms() - 60_000,
            "kinGeneration": 11
        }}),
    );
    let (upstream, mut captured) = mock_upstream(SSE).await;
    let hits = Arc::new(AtomicUsize::new(0));
    let token_addr = mock_token_endpoint("refreshed-access", Arc::clone(&hits)).await;
    let refresher = Arc::new(
        Refresher::new(format!("http://{token_addr}/token")).with_store(Arc::clone(&store)),
    );
    let client = UpstreamClient::new(&format!("http://{upstream}"), None)
        .unwrap()
        .with_refresher(refresher);
    let wire = build_messages_request(&[], &[], &request_body(), false, true, false, "test-session");
    let response = client.post_messages(&wire).await.unwrap();
    assert_eq!(response.head.status, 200);

    let captured = captured.recv().await.unwrap();
    assert_eq!(
        header(&captured, "authorization"),
        Some("Bearer refreshed-access"),
        "应先刷新再用新 token"
    );
    assert_eq!(hits.load(Ordering::SeqCst), 1);

    // 落盘：新 token + generation 递增
    let text = std::fs::read_to_string(&store.path).unwrap();
    let parsed: Value = serde_json::from_str(&text).unwrap();
    assert_eq!(parsed["claudeAiOauth"]["accessToken"], "refreshed-access");
    assert!(parsed["kinGeneration"].as_i64().unwrap() > 11);
    std::fs::remove_dir_all(dir).ok();
}

#[tokio::test]
async fn api_key_credential_uses_x_api_key() {
    let (store, dir) = temp_store("apikey");
    write_credential(&store, json!({"anthropicApiKey": {"apiKey": "sk-ant-file"}}));
    let (upstream, mut captured) = mock_upstream(SSE).await;
    let hits = Arc::new(AtomicUsize::new(0));
    let token_addr = mock_token_endpoint("unused", Arc::clone(&hits)).await;
    let refresher = Arc::new(
        Refresher::new(format!("http://{token_addr}/token")).with_store(Arc::clone(&store)),
    );
    let client = UpstreamClient::new(&format!("http://{upstream}"), None)
        .unwrap()
        .with_refresher(refresher);
    let wire = build_messages_request(&[], &[], &request_body(), false, false, false, "test-session");
    let response = client.post_messages(&wire).await.unwrap();
    assert_eq!(response.head.status, 200);

    let captured = captured.recv().await.unwrap();
    assert_eq!(header(&captured, "x-api-key"), Some("sk-ant-file"));
    assert!(header(&captured, "authorization").is_none());
    assert_eq!(hits.load(Ordering::SeqCst), 0, "API key 不刷新");
    std::fs::remove_dir_all(dir).ok();
}
