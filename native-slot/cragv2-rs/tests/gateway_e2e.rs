//! 端到端：网关 + 假 CLI 槽位，走真实 socket 往返。
//!
//! 覆盖两个验收点：
//! 1. 流式 hop 产出 `content_block_delta` 并以 `message_stop` 收尾；
//! 2. 非流式 hop 聚合出完整 message（`content[0].text`）。
//!
//! Unix 平台走 unix socket，其余平台走本机 TCP（`serve` 的 fallback）。

use std::sync::Arc;

use cragv2::gateway::{serve, GatewayState};
use cragv2::slot::CragHost;

fn fake_cli() -> Vec<String> {
    cragv2::testing::fake_cli_command()
}

fn envelope(streaming: bool, request_id: &str) -> String {
    serde_json::json!({
        "request_id": request_id,
        "body": {
            "model": "claude-opus-5-5",
            "max_tokens": 8,
            "messages": [{"role": "user", "content": "ping"}]
        },
        "headers": [],
        "stream": streaming,
        "delivery_mode": "realtime"
    })
    .to_string()
}

/// 发一次请求并读完整响应（`connection: close`，读到 EOF 为止）。
async fn roundtrip(addr: &str, path: &str, body: &str) -> String {
    roundtrip_method("POST", addr, path, body).await
}

async fn roundtrip_method(method: &str, addr: &str, path: &str, body: &str) -> String {
    let request = format!(
        "{method} {path} HTTP/1.1\r\nhost: crag\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}",
        body.len()
    );
    #[cfg(unix)]
    {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut stream = tokio::net::UnixStream::connect(addr).await.expect("connect unix");
        stream.write_all(request.as_bytes()).await.unwrap();
        stream.flush().await.unwrap();
        let mut out = Vec::new();
        stream.read_to_end(&mut out).await.unwrap();
        String::from_utf8_lossy(&out).into_owned()
    }
    #[cfg(not(unix))]
    {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut stream = tokio::net::TcpStream::connect(addr).await.expect("connect tcp");
        stream.write_all(request.as_bytes()).await.unwrap();
        stream.flush().await.unwrap();
        let mut out = Vec::new();
        stream.read_to_end(&mut out).await.unwrap();
        String::from_utf8_lossy(&out).into_owned()
    }
}

async fn boot(tag: &str) -> (Arc<CragHost>, String) {
    let host = CragHost::spawn(fake_cli(), 2, &[]).await.expect("spawn cli");
    let state = Arc::new(GatewayState::slot_only(Arc::clone(&host), None, "crag"));
    let dir = std::env::temp_dir().join(format!("cragv2-e2e-{tag}-{}", std::process::id()));
    let path = dir.join("kernel.sock");
    let bound = serve(&path, state).await.expect("serve");
    (host, bound.display().to_string())
}

#[tokio::test]
async fn streaming_hop_emits_sse_and_terminal_stop() {
    let (host, addr) = boot("stream").await;
    let response = roundtrip(&addr, "/internal/v1/messages", &envelope(true, "req-stream")).await;
    assert!(response.starts_with("HTTP/1.1 200 OK"), "{response}");
    assert!(response.contains("text/event-stream"), "{response}");
    assert!(response.contains("event: content_block_delta"), "{response}");
    assert!(response.contains("\"text\":\"pong\""), "{response}");
    assert!(response.contains("event: message_stop"), "{response}");
    host.close().await;
}

#[tokio::test]
async fn non_streaming_hop_aggregates_message_body() {
    let (host, addr) = boot("nonstream").await;
    let response = roundtrip(&addr, "/internal/v1/messages", &envelope(false, "req-non")).await;
    assert!(response.starts_with("HTTP/1.1 200 OK"), "{response}");
    assert!(response.contains("x-terminal-state: verified"), "{response}");
    let body = response.split("\r\n\r\n").nth(1).unwrap_or_default();
    let value: serde_json::Value = serde_json::from_str(body).expect("json body");
    assert_eq!(value["role"], "assistant");
    assert_eq!(value["content"][0]["text"], "pong");
    assert_eq!(value["stop_reason"], "end_turn");
    host.close().await;
}

#[tokio::test]
async fn health_reports_ready_slots_after_boot() {
    let (host, addr) = boot("health").await;
    let response = roundtrip_method("GET", &addr, "/internal/health", "").await;
    assert!(response.contains("\"engine\":\"rust\""), "{response}");
    assert!(response.contains("\"ready_slots\":2"), "{response}");
    host.close().await;
}

#[tokio::test]
async fn cancel_releases_the_slot() {
    let (host, addr) = boot("cancel").await;
    let body = serde_json::json!({"request_id": "req-cancel"}).to_string();
    let response = roundtrip(&addr, "/internal/v1/cancel", &body).await;
    assert!(response.contains("200 OK"), "{response}");
    assert_eq!(host.ready_slots(), 2);
    host.close().await;
}
