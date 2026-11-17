//! 代理隧道端到端：SOCKS5H 与 HTTP CONNECT 两种出口，真实握手 + 真实转发。
//!
//! 验收点：
//! 1. `socks5h://` 把**域名**下发给代理（ATYP=0x03），不是本地解析后的 IP；
//! 2. `http://` 发出标准 `CONNECT host:port` 并按 200 放行；
//! 3. 隧道内 h2 明文请求正常返回 SSE（说明隧道是裸字节通道，没被代理改写）；
//! 4. `proxy_required` 但缺 URL 时拒绝启动（不静默直连）。

use std::sync::Arc;

use bytes::Bytes;
use cragv2::http::client::{read_sse_into, Credential, UpstreamClient};
use cragv2::http::proxy::{Proxy, ProxySettings};
use cragv2::http::wire::build_messages_request;
use serde_json::json;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

const SSE: &str = "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n";

/// mock 上游：一次性 h2 响应。
async fn mock_upstream() -> String {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    tokio::spawn(async move {
        let (tcp, _) = listener.accept().await.unwrap();
        let mut connection = h2::server::handshake(tcp).await.unwrap();
        while let Some(result) = connection.accept().await {
            let (_request, mut respond) = result.unwrap();
            let response = http::Response::builder()
                .status(200)
                .header("content-type", "text/event-stream")
                .body(())
                .unwrap();
            let mut send = respond.send_response(response, false).unwrap();
            send.send_data(Bytes::from_static(SSE.as_bytes()), true).unwrap();
        }
    });
    addr
}

/// mock SOCKS5 代理：握手 → 记录目标 → 转发到 mock 上游。
async fn mock_socks5(upstream: String) -> (String, tokio::sync::oneshot::Receiver<(String, u16)>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let (tx, rx) = tokio::sync::oneshot::channel();
    let tx = Arc::new(std::sync::Mutex::new(Some(tx)));
    tokio::spawn(async move {
        let (mut client, _) = listener.accept().await.unwrap();
        let mut head = [0u8; 2];
        client.read_exact(&mut head).await.unwrap();
        let mut methods = vec![0u8; head[1] as usize];
        client.read_exact(&mut methods).await.unwrap();
        client.write_all(&[0x05, 0x00]).await.unwrap();

        let mut request = [0u8; 4];
        client.read_exact(&mut request).await.unwrap();
        assert_eq!(request[0], 0x05, "socks version");
        assert_eq!(request[1], 0x01, "CONNECT command");
        let host = match request[3] {
            0x01 => {
                let mut ip = [0u8; 4];
                client.read_exact(&mut ip).await.unwrap();
                std::net::Ipv4Addr::from(ip).to_string()
            }
            0x03 => {
                let mut len = [0u8; 1];
                client.read_exact(&mut len).await.unwrap();
                let mut name = vec![0u8; len[0] as usize];
                client.read_exact(&mut name).await.unwrap();
                String::from_utf8(name).unwrap()
            }
            0x04 => {
                let mut ip = [0u8; 16];
                client.read_exact(&mut ip).await.unwrap();
                std::net::Ipv6Addr::from(ip).to_string()
            }
            other => panic!("unexpected ATYP {other:#04x}"),
        };
        let mut port = [0u8; 2];
        client.read_exact(&mut port).await.unwrap();
        let port = u16::from_be_bytes(port);
        if let Some(sender) = tx.lock().unwrap().take() {
            let _ = sender.send((host, port));
        }
        // success + BND.ADDR=0.0.0.0:0
        client
            .write_all(&[0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0])
            .await
            .unwrap();

        let upstream = TcpStream::connect(upstream).await.unwrap();
        let mut client = client;
        let mut upstream = upstream;
        tokio::io::copy_bidirectional(&mut client, &mut upstream).await.unwrap();
    });
    (addr, rx)
}

/// mock HTTP CONNECT 代理。
async fn mock_http_proxy(upstream: String) -> (String, tokio::sync::oneshot::Receiver<String>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let (tx, rx) = tokio::sync::oneshot::channel();
    let tx = Arc::new(std::sync::Mutex::new(Some(tx)));
    tokio::spawn(async move {
        let (mut client, _) = listener.accept().await.unwrap();
        let mut head = Vec::new();
        let mut byte = [0u8; 1];
        while !head.ends_with(b"\r\n\r\n") {
            let n = client.read(&mut byte).await.unwrap();
            if n == 0 {
                return;
            }
            head.push(byte[0]);
        }
        let text = String::from_utf8_lossy(&head).to_string();
        let target = text
            .lines()
            .next()
            .and_then(|line| line.split_whitespace().nth(1))
            .unwrap_or_default()
            .to_string();
        if let Some(sender) = tx.lock().unwrap().take() {
            let _ = sender.send(target);
        }
        client
            .write_all(b"HTTP/1.1 200 Connection Established\r\n\r\n")
            .await
            .unwrap();
        let upstream = TcpStream::connect(upstream).await.unwrap();
        let mut upstream = upstream;
        tokio::io::copy_bidirectional(&mut client, &mut upstream).await.unwrap();
    });
    (addr, rx)
}

fn frames() -> cragv2::http::wire::WireRequest {
    build_messages_request(
        &[],
        &[],
        &json!({
            "model": "claude-opus-5-5",
            "max_tokens": 8,
            "messages": [{"role": "user", "content": "ping"}]
        }),
        false,
        true,
        false,
        "test-session",
    )
}

async fn drain(client: &UpstreamClient) -> usize {
    let response = client.post_messages(&frames()).await.unwrap();
    assert_eq!(response.head.status, 200);
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
    let reader = tokio::spawn(async move { read_sse_into(response.body, tx).await });
    let mut count = 0;
    while rx.recv().await.is_some() {
        count += 1;
    }
    reader.await.unwrap().unwrap();
    count
}

#[tokio::test]
async fn socks5h_tunnel_sends_domain_and_forwards_h2() {
    let upstream = mock_upstream().await;
    let (proxy_addr, target) = mock_socks5(upstream.clone()).await;
    let client = UpstreamClient::new("http://upstream.test:9", None)
        .unwrap()
        .with_credential(Some(Credential::OAuth("t".into())))
        .with_proxy(Some(Proxy::parse(&format!("socks5h://{proxy_addr}")).unwrap()));
    assert_eq!(drain(&client).await, 1);
    let (host, port) = target.await.unwrap();
    // socks5h：域名原样下发，不做本地解析。
    assert_eq!(host, "upstream.test");
    assert_eq!(port, 9);
}

#[tokio::test]
async fn http_connect_tunnel_forwards_h2() {
    let upstream = mock_upstream().await;
    let (proxy_addr, target) = mock_http_proxy(upstream.clone()).await;
    let client = UpstreamClient::new("http://upstream.test:9", None)
        .unwrap()
        .with_credential(Some(Credential::OAuth("t".into())))
        .with_proxy(Some(Proxy::parse(&format!("http://{proxy_addr}")).unwrap()));
    assert_eq!(drain(&client).await, 1);
    assert_eq!(target.await.unwrap(), "upstream.test:9");
}

#[tokio::test]
async fn required_proxy_without_url_refuses_to_start() {
    let settings = ProxySettings { url: None, required: true };
    let error = Proxy::from_settings(&settings).unwrap_err();
    assert!(error.to_string().contains("proxy_required"), "{error}");
}
