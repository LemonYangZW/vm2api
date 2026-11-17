//! 自控 h2 上游 hop 的离线端到端：本地明文 h2 mock 上游。
//!
//! 验收三件事（对应上游 rs v2 的关键点）：
//! 1. wire 头集合正确（UA / `x-app` / `anthropic-beta` / `x-stainless-package-version=0.74.0`）；
//! 2. 出站 body 已打戳，且服务端**独立重算 CCH 与服务端收到的值一致**；
//! 3. SSE 逐事件解码回投，`message_stop` 收尾。

use bytes::Bytes;
use cragv2::http::client::{read_sse, Credential, UpstreamClient};
use cragv2::http::wire::build_messages_request;
use cragv2::protocol::cch;
use serde_json::{json, Value};
use tokio::net::TcpListener;

struct Captured {
    headers: Vec<(String, String)>,
    body: String,
}

/// 起一个明文 h2 mock 上游，返回 (addr, 捕获通道)。
async fn mock_upstream(sse: &'static str) -> (String, tokio::sync::oneshot::Receiver<Captured>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let (tx, rx) = tokio::sync::oneshot::channel();
    let mut tx = Some(tx);
    tokio::spawn(async move {
        let (tcp, _) = listener.accept().await.unwrap();
        let mut connection = h2::server::handshake(tcp).await.unwrap();
        while let Some(result) = connection.accept().await {
            let (request, mut respond) = result.unwrap();
            let headers: Vec<(String, String)> = request
                .headers()
                .iter()
                .map(|(k, v)| (k.as_str().to_string(), v.to_str().unwrap_or_default().to_string()))
                .collect();
            let mut body = request.into_body();
            let mut buf = Vec::new();
            while let Some(chunk) = body.data().await {
                let chunk = chunk.unwrap();
                body.flow_control().release_capacity(chunk.len()).unwrap();
                buf.extend_from_slice(&chunk);
            }
            if let Some(sender) = tx.take() {
            let _ = sender.send(Captured {
                headers,
                body: String::from_utf8_lossy(&buf).into_owned(),
            });
            }
            let response = http::Response::builder()
                .status(200)
                .header("content-type", "text/event-stream")
                .header("x-request-id", "req_mock")
                .body(())
                .unwrap();
            let mut send = respond.send_response(response, false).unwrap();
            send.send_data(Bytes::from_static(sse.as_bytes()), true).unwrap();
        }
    });
    (addr, rx)
}

fn request_body() -> Value {
    json!({
        "model": "claude-opus-5-5",
        "max_tokens": 64,
        "system": [{"type": "text", "text": "x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli; cch=00000;"}],
        "messages": [{"role": "user", "content": "ping"}]
    })
}

const SSE: &str = concat!(
    "event: message_start\ndata: {\"type\":\"message_start\",\"message\":{\"id\":\"msg_1\",\"role\":\"assistant\",\"content\":[]}}\n\n",
    "event: content_block_delta\ndata: {\"type\":\"content_block_delta\",\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"pong\"}}\n\n",
    "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n"
);

#[tokio::test]
async fn h2_hop_sends_stamped_wire_and_streams_sse() {
    let (addr, captured) = mock_upstream(SSE).await;
    let client = UpstreamClient::new(&format!("http://{addr}"), None)
        .unwrap()
        .with_credential(Some(Credential::OAuth("token-abc".into())));
    let wire = build_messages_request(&[], &["effort-2025-11-24".to_string(), "claude-code-20250219".to_string()], &request_body(), false, true, false, "test-session");
    let response = client.post_messages(&wire).await.unwrap();
    assert_eq!(response.head.status, 200);
    assert!(response.head.is_sse());

    let mut events = Vec::new();
    read_sse(response.body, |event| {
        events.push(event);
        true
    })
    .await
    .unwrap();
    assert_eq!(events.len(), 3);
    assert_eq!(events[0].event.as_deref(), Some("message_start"));
    assert_eq!(events[2].event.as_deref(), Some("message_stop"));

    let captured = captured.await.unwrap();
    let header = |name: &str| {
        captured
            .headers
            .iter()
            .find(|(k, _)| k == name)
            .map(|(_, v)| v.clone())
    };
    assert!(header("user-agent").unwrap().starts_with("claude-cli/2.1.303 (external, "));
    assert_eq!(header("x-app").as_deref(), Some("cli"));
    assert_eq!(header("x-stainless-package-version").as_deref(), Some("0.74.0"));
    assert_eq!(header("authorization").as_deref(), Some("Bearer token-abc"));
    assert_eq!(
        header("anthropic-beta").as_deref(),
        Some("claude-code-20250219,effort-2025-11-24")
    );

    // 服务端独立重算：收到的 body 已打戳，且重算值一致（wire 未被二次改写）。
    let received: Value = serde_json::from_str(&captured.body).unwrap();
    let text = received["system"][0]["text"].as_str().unwrap();
    let stamped = text
        .split("cch=")
        .nth(1)
        .and_then(|rest| rest.get(..5))
        .unwrap()
        .to_string();
    assert_ne!(stamped, "00000", "body must be stamped before wire");
    assert_eq!(cch::compute_cch(&captured.body), stamped);
}

#[tokio::test]
async fn api_key_credential_uses_x_api_key() {
    let (addr, captured) = mock_upstream("event: message_stop\ndata: {}\n\n").await;
    let client = UpstreamClient::new(&format!("http://{addr}"), None)
        .unwrap()
        .with_credential(Some(Credential::ApiKey("sk-test".into())));
    let wire = build_messages_request(&[], &[], &request_body(), false, false, false, "test-session");
    let response = client.post_messages(&wire).await.unwrap();
    let _ = read_sse(response.body, |_| true).await.unwrap();
    let captured = captured.await.unwrap();
    let api_key = captured
        .headers
        .iter()
        .find(|(k, _)| k == "x-api-key")
        .map(|(_, v)| v.clone());
    assert_eq!(api_key.as_deref(), Some("sk-test"));
    assert!(captured.headers.iter().all(|(k, _)| k != "authorization"));
}

/// GET（非推理端点）必须自带 `anthropic-version`，否则上游 400。
#[tokio::test]
async fn get_sends_anthropic_version_header() {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<Vec<(String, String)>>();
    tokio::spawn(async move {
        let (tcp, _) = listener.accept().await.unwrap();
        let mut connection = h2::server::handshake(tcp).await.unwrap();
        while let Some(result) = connection.accept().await {
            let (request, mut respond) = result.unwrap();
            let headers = request
                .headers()
                .iter()
                .map(|(k, v)| (k.as_str().to_string(), v.to_str().unwrap_or_default().to_string()))
                .collect::<Vec<_>>();
            let _ = tx.send(headers);
            let payload = r#"{"data":[]}"#;
            let response = http::Response::builder()
                .status(200)
                .header("content-type", "application/json")
                .body(())
                .unwrap();
            let mut send = respond.send_response(response, false).unwrap();
            send.send_data(Bytes::from_static(payload.as_bytes()), true).unwrap();
        }
    });
    let client = UpstreamClient::new(&format!("http://{addr}"), None)
        .unwrap()
        .with_credential(Some(Credential::OAuth("t".into())));
    let response = client.get("/v1/models").await.unwrap();
    assert_eq!(response.head.status, 200);
    let headers = rx.recv().await.unwrap();
    let get = |name: &str| headers.iter().find(|(k, _)| k == name).map(|(_, v)| v.as_str());
    assert_eq!(get("anthropic-version"), Some("2023-06-01"));
    assert_eq!(get("authorization"), Some("Bearer t"));
}

/// 连接复用：mock 只 accept 一次；第二次请求必须走同一条连接。
#[tokio::test]
async fn reuses_one_h2_connection_for_multiple_hops() {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<usize>();
    tokio::spawn(async move {
        // 只 accept 一次：若客户端第二次新建连接，请求会挂住直到超时。
        let (tcp, _) = listener.accept().await.unwrap();
        let mut connection = h2::server::handshake(tcp).await.unwrap();
        let mut streams = 0usize;
        while let Some(result) = connection.accept().await {
            let (_request, mut respond) = result.unwrap();
            streams += 1;
            let _ = tx.send(streams);
            let response = http::Response::builder()
                .status(200)
                .header("content-type", "text/event-stream")
                .body(())
                .unwrap();
            let mut send = respond.send_response(response, false).unwrap();
            send.send_data(Bytes::from_static(b"event: message_stop\ndata: {}\n\n"), true)
                .unwrap();
        }
    });

    let client = UpstreamClient::new(&format!("http://{addr}"), None)
        .unwrap()
        .with_credential(Some(Credential::OAuth("t".into())));
    for _ in 0..3 {
        let wire = build_messages_request(&[], &[], &request_body(), false, true, false, "test-session");
        let response = client.post_messages(&wire).await.unwrap();
        let _ = read_sse(response.body, |_| true).await.unwrap();
    }
    let mut seen = Vec::new();
    for _ in 0..3 {
        let next = tokio::time::timeout(std::time::Duration::from_secs(5), rx.recv())
            .await
            .expect("stream should arrive on the reused connection")
            .expect("server channel open");
        seen.push(next);
    }
    assert_eq!(seen, vec![1, 2, 3], "all hops must share one connection");
}
