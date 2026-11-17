//! 直连模式的网关端到端：`/internal/v1/messages` → protocol → h2 上游 → SSE 回投。
//!
//! 验收点：
//! 1. 入站没有 billing 头时**自动注入**，并被 wire 层打上真实 cch；
//! 2. 上游收到的 cch 与服务端独立重算一致（wire 没有被二次序列化污染）；
//! 3. SSE 事件名与 data 原样透传，`message_stop` 收尾；
//! 4. 非流式回传上游 JSON 原文并带 `x-terminal-state: verified`；
//! 5. 直连模式不起 CLI：health 里 `hop_mode=direct` 且 `cli_pid=null`。

use std::sync::Arc;

use bytes::Bytes;
use cragv2::gateway::{serve, GatewayState};
use cragv2::http::client::{Credential, UpstreamClient};
use cragv2::protocol::cch;
use serde_json::Value;
use tokio::net::TcpListener;

const SSE: &str = concat!(
    "event: message_start\ndata: {\"type\":\"message_start\",\"message\":{\"id\":\"msg_9\",\"role\":\"assistant\",\"content\":[]}}\n\n",
    "event: content_block_delta\ndata: {\"type\":\"content_block_delta\",\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"pong\"}}\n\n",
    "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n"
);

const JSON_BODY: &str = r#"{"id":"msg_json","type":"message","role":"assistant","model":"claude-opus-5-5","content":[{"type":"text","text":"pong"}],"stop_reason":"end_turn","usage":{"input_tokens":4,"output_tokens":1}}"#;

/// mock 上游：把收到的 body 回吐给测试做独立重算。
async fn mock_upstream(sse: bool) -> (String, tokio::sync::oneshot::Receiver<String>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let (tx, rx) = tokio::sync::oneshot::channel();
    let mut tx = Some(tx);
    tokio::spawn(async move {
        let (tcp, _) = listener.accept().await.unwrap();
        let mut connection = h2::server::handshake(tcp).await.unwrap();
        while let Some(result) = connection.accept().await {
            let (request, mut respond) = result.unwrap();
            let mut body = request.into_body();
            let mut buf = Vec::new();
            while let Some(chunk) = body.data().await {
                let chunk = chunk.unwrap();
                body.flow_control().release_capacity(chunk.len()).unwrap();
                buf.extend_from_slice(&chunk);
            }
            if let Some(sender) = tx.take() {
                let _ = sender.send(String::from_utf8_lossy(&buf).into_owned());
            }
            let response = http::Response::builder()
                .status(200)
                .header(
                    "content-type",
                    if sse { "text/event-stream" } else { "application/json" },
                )
                .body(())
                .unwrap();
            let mut send = respond.send_response(response, false).unwrap();
            let payload = if sse { SSE } else { JSON_BODY };
            send.send_data(Bytes::from_static(payload.as_bytes()), true).unwrap();
        }
    });
    (addr, rx)
}

async fn roundtrip(addr: &str, path: &str, body: &str) -> String {
    let request = format!(
        "POST {path} HTTP/1.1\r\nhost: crag\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}",
        body.len()
    );
    #[cfg(unix)]
    {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut stream = tokio::net::UnixStream::connect(addr).await.unwrap();
        stream.write_all(request.as_bytes()).await.unwrap();
        stream.flush().await.unwrap();
        let mut out = Vec::new();
        stream.read_to_end(&mut out).await.unwrap();
        String::from_utf8_lossy(&out).into_owned()
    }
    #[cfg(not(unix))]
    {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut stream = tokio::net::TcpStream::connect(addr).await.unwrap();
        stream.write_all(request.as_bytes()).await.unwrap();
        stream.flush().await.unwrap();
        let mut out = Vec::new();
        stream.read_to_end(&mut out).await.unwrap();
        String::from_utf8_lossy(&out).into_owned()
    }
}

async fn boot(tag: &str, upstream_addr: &str) -> (Arc<GatewayState>, String) {
    let client = UpstreamClient::new(&format!("http://{upstream_addr}"), None)
        .unwrap()
        .with_credential(Some(Credential::OAuth("tok".into())));
    let state = Arc::new(GatewayState::direct(Arc::new(client), None, "crag", 4));
    let dir = std::env::temp_dir().join(format!("cragv2-direct-{tag}-{}", std::process::id()));
    let bound = serve(dir.join("kernel.sock"), Arc::clone(&state)).await.unwrap();
    (state, bound.display().to_string())
}

fn envelope(streaming: bool) -> String {
    serde_json::json!({
        "request_id": "req-direct",
        "stream": streaming,
        "headers": {"anthropic-beta": "effort-2025-11-24,claude-code-20250219"},
        "body": {
            "model": "claude-opus-5-5",
            "max_tokens": 32,
            "messages": [{"role": "user", "content": "ping"}]
        }
    })
    .to_string()
}

#[tokio::test]
async fn direct_hop_injects_billing_stamps_wire_and_streams() {
    let (upstream_addr, captured) = mock_upstream(true).await;
    let (_state, addr) = boot("stream", &upstream_addr).await;
    let response = roundtrip(&addr, "/internal/v1/messages", &envelope(true)).await;

    assert!(response.starts_with("HTTP/1.1 200 OK"), "{response}");
    assert!(response.contains("event: message_start"), "{response}");
    assert!(response.contains("event: content_block_delta"), "{response}");
    assert!(response.contains("event: message_stop"), "{response}");
    assert!(response.contains("{\"type\":\"text_delta\",\"text\":\"pong\"}"), "{response}");

    let sent = captured.await.unwrap();
    let sent: Value = serde_json::from_str(&sent).unwrap();
    // 上游只在 body.stream=true 时回 SSE：这个字段必须显式带上
    assert_eq!(sent["stream"], true, "流式请求必须带 stream=true: {sent}");
    let system = sent["system"].as_array().expect("billing 头应被注入 system");
    let text = system[0]["text"].as_str().unwrap();
    assert!(text.contains("x-anthropic-billing-header:"), "{text}");
    assert!(text.contains("cc_version=2.1.303;"), "{text}");
    let stamped = text.split("cch=").nth(1).and_then(|r| r.get(..5)).unwrap().to_string();
    assert_ne!(stamped, "00000", "wire body must be stamped");
    let raw = serde_json::to_string(&sent).unwrap();
    assert_eq!(cch::compute_cch(&raw), stamped);
}

#[tokio::test]
async fn direct_hop_returns_upstream_json_for_non_streaming() {
    let (upstream_addr, captured) = mock_upstream(false).await;
    let (_state, addr) = boot("json", &upstream_addr).await;
    let response = roundtrip(&addr, "/internal/v1/messages", &envelope(false)).await;
    assert!(response.contains("x-terminal-state: verified"), "{response}");
    let body = response.split("\r\n\r\n").nth(1).unwrap_or_default();
    let value: Value = serde_json::from_str(body).unwrap();
    assert_eq!(value["id"], "msg_json");
    assert_eq!(value["content"][0]["text"], "pong");
    // 非流式请求不应带 stream 字段
    let sent: Value = serde_json::from_str(&captured.await.unwrap()).unwrap();
    assert!(sent.get("stream").is_none(), "非流式不应带 stream 字段: {sent}");
}

#[tokio::test]
async fn direct_hop_caps_cache_markers_when_not_preserved() {
    let (upstream_addr, captured) = mock_upstream(false).await;
    let (_state, addr) = boot("cache", &upstream_addr).await;
    let envelope = serde_json::json!({
        "request_id": "req-cache",
        "stream": false,
        "preserve_cache_breakpoints": false,
        "cache_ttl": "1h",
        "body": {
            "model": "claude-opus-5-5",
            "max_tokens": 8,
            "system": [
                {"type": "text", "text": "x-anthropic-billing-header: cc_version=2.1.303; cch=00000;",
                 "cache_control": {"type": "ephemeral"}},
                {"type": "text", "text": "s2", "cache_control": {"type": "ephemeral"}}
            ],
            "tools": [
                {"name": "t1", "cache_control": {"type": "ephemeral"}},
                {"name": "t2", "cache_control": {"type": "ephemeral"}}
            ],
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": "m1", "cache_control": {"type": "ephemeral"}},
                {"type": "text", "text": "m2", "cache_control": {"type": "ephemeral"}}
            ]}]
        }
    })
    .to_string();
    let response = roundtrip(&addr, "/internal/v1/messages", &envelope).await;
    assert!(response.contains("200 OK"), "{response}");

    let sent: Value = serde_json::from_str(&captured.await.unwrap()).unwrap();
    fn count(node: &Value, out: &mut usize) {
        match node {
            Value::Object(map) => {
                if map.get("cache_control").is_some_and(|v| !v.is_null()) {
                    *out += 1;
                }
                for value in map.values() {
                    count(value, out);
                }
            }
            Value::Array(items) => items.iter().for_each(|item| count(item, out)),
            _ => {}
        }
    }
    let mut markers = 0;
    count(&sent, &mut markers);
    assert_eq!(markers, 4, "marker 应被裁到 4: {sent}");
    // 调用方没显式声明 TTL 时不补（与现网 `fillMissingCacheTtl` 一致）。
    assert!(sent["system"][0]["cache_control"].get("ttl").is_none(), "{sent}");
}

#[tokio::test]
async fn direct_mode_health_has_no_cli() {
    let (upstream_addr, _captured) = mock_upstream(false).await;
    let (_state, addr) = boot("health", &upstream_addr).await;
    let request = "GET /internal/health HTTP/1.1\r\nhost: crag\r\nconnection: close\r\n\r\n";
    #[cfg(unix)]
    let raw = {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut stream = tokio::net::UnixStream::connect(&addr).await.unwrap();
        stream.write_all(request.as_bytes()).await.unwrap();
        let mut out = Vec::new();
        stream.read_to_end(&mut out).await.unwrap();
        String::from_utf8_lossy(&out).into_owned()
    };
    #[cfg(not(unix))]
    let raw = {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut stream = tokio::net::TcpStream::connect(&addr).await.unwrap();
        stream.write_all(request.as_bytes()).await.unwrap();
        let mut out = Vec::new();
        stream.read_to_end(&mut out).await.unwrap();
        String::from_utf8_lossy(&out).into_owned()
    };
    assert!(raw.contains("\"hop_mode\":\"direct\""), "{raw}");
    assert!(raw.contains("\"cli_pid\":null"), "{raw}");
    assert!(raw.contains("\"ready_slots\":4"), "{raw}");
}

#[tokio::test]
async fn preflight_rejects_without_touching_upstream() {
    let (upstream_addr, captured) = mock_upstream(false).await;
    let (_state, addr) = boot("preflight", &upstream_addr).await;
    let envelope = serde_json::json!({
        "request_id": "req-bad",
        "stream": false,
        "body": {"model": "claude-opus-5-5", "max_tokens": 8, "messages": []}
    })
    .to_string();
    let response = roundtrip(&addr, "/internal/v1/messages", &envelope).await;
    assert!(response.contains("400 Bad Request"), "{response}");
    assert!(response.contains("at least one message"), "{response}");

    // 关键：预检失败时上游一个字节都不该收到。
    let touched = tokio::time::timeout(std::time::Duration::from_millis(300), captured).await;
    assert!(touched.is_err(), "预检失败却打到了上游");
}

/// mock 上游：200 + text/event-stream，但正文为空。
async fn mock_upstream_empty_sse() -> (String, tokio::sync::oneshot::Receiver<String>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let (tx, rx) = tokio::sync::oneshot::channel();
    let mut tx = Some(tx);
    tokio::spawn(async move {
        let (tcp, _) = listener.accept().await.unwrap();
        let mut connection = h2::server::handshake(tcp).await.unwrap();
        while let Some(result) = connection.accept().await {
            let (request, mut respond) = result.unwrap();
            let mut body = request.into_body();
            let mut buf = Vec::new();
            while let Some(chunk) = body.data().await {
                let chunk = chunk.unwrap();
                body.flow_control().release_capacity(chunk.len()).unwrap();
                buf.extend_from_slice(&chunk);
            }
            if let Some(sender) = tx.take() {
                let _ = sender.send(String::from_utf8_lossy(&buf).into_owned());
            }
            let response = http::Response::builder()
                .status(200)
                .header("content-type", "text/event-stream")
                .body(())
                .unwrap();
            let mut send = respond.send_response(response, false).unwrap();
            send.send_data(Bytes::from_static(b""), true).unwrap();
        }
    });
    (addr, rx)
}

/// 上游 200 但返回 JSON（非 SSE）：不能开 SSE 流，否则客户端拿到 200 + 空 body。
#[tokio::test]
async fn upstream_non_sse_response_passes_through_as_json() {
    let (upstream_addr, _captured) = mock_upstream(false).await;
    let (_state, addr) = boot("non-sse", &upstream_addr).await;
    let response = roundtrip(&addr, "/internal/v1/messages", &envelope(true)).await;
    assert!(response.starts_with("HTTP/1.1 200 OK"), "{response}");
    assert!(response.contains("x-upstream-content-type: non-sse"), "{response}");
    assert!(!response.contains("text/event-stream"), "{response}");
    let body = response.split("\r\n\r\n").nth(1).unwrap_or_default();
    let value: Value = serde_json::from_str(body).expect("should pass upstream JSON through");
    assert_eq!(value["id"], "msg_json");
}

/// 上游 SSE 但一个事件都没有：必须仍补 message_stop，不能返回空 body。
#[tokio::test]
async fn empty_upstream_sse_still_emits_message_stop() {
    let (upstream_addr, _captured) = mock_upstream_empty_sse().await;
    let (_state, addr) = boot("empty-sse", &upstream_addr).await;
    let response = roundtrip(&addr, "/internal/v1/messages", &envelope(true)).await;
    assert!(response.contains("text/event-stream"), "{response}");
    assert!(response.contains("event: message_stop"), "{response}");
}
