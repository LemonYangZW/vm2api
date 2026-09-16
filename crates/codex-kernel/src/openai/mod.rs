use futures_util::{SinkExt, StreamExt};
use reqwest::{Client, Proxy};
use serde_json::{json, Value};
use tokio::sync::mpsc;
use tokio_socks::tcp::Socks5Stream;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::http::header::{
    HeaderName, HeaderValue, AUTHORIZATION, USER_AGENT,
};
use tokio_tungstenite::tungstenite::Message;
use uuid::Uuid;

use crate::config::Config;
use crate::credentials::Account;
use crate::error::KernelError;
use crate::protocol::{is_terminal_frame, split_sse, take_sse_frames, ws_create_payload};

pub struct OutboundRequest {
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Value,
}

pub struct HopLive {
    pub status: u16,
    pub rx: mpsc::Receiver<Result<String, KernelError>>,
}

struct SocksProxy {
    host: String,
    port: u16,
    user: Option<String>,
    pass: Option<String>,
}

pub fn prepare_request(
    cfg: &Config,
    account: &Account,
    body: Value,
    session_id: Option<&str>,
) -> OutboundRequest {
    let turn_id = Uuid::new_v4().to_string();
    let session = session_id
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    let mut headers = vec![
        (
            "authorization".into(),
            format!("Bearer {}", account.access_token),
        ),
        ("user-agent".into(), cfg.user_agent.clone()),
        (
            "openai-beta".into(),
            "responses_websockets=2026-02-06".into(),
        ),
        ("session-id".into(), session),
        ("x-codex-installation-id".into(), cfg.device_id.clone()),
        ("x-codex-turn-id".into(), turn_id),
    ];
    if !account.chatgpt_account_id.trim().is_empty() {
        headers.push((
            "chatgpt-account-id".into(),
            account.chatgpt_account_id.clone(),
        ));
    }
    OutboundRequest {
        url: cfg.responses_http_url(),
        headers,
        body,
    }
}

pub async fn hop(cfg: &Config, request: &OutboundRequest) -> Result<HopLive, KernelError> {
    if cfg.proxy_required && cfg.proxy_url.trim().is_empty() {
        return Err(KernelError::ProxyRequired);
    }
    match hop_ws(cfg, request).await {
        Ok(live) => Ok(live),
        Err(err) => {
            if should_fallback_http(&err) {
                hop_http(cfg, request).await
            } else {
                Err(err)
            }
        }
    }
}

pub fn should_fallback_http(err: &KernelError) -> bool {
    if err.sent() {
        return false;
    }
    let msg = err.to_string().to_ascii_lowercase();
    msg.contains("426") || msg.contains("upgrade required")
}
fn parse_socks(proxy_url: &str) -> Option<SocksProxy> {
    let rest = proxy_url
        .strip_prefix("socks5://")
        .or_else(|| proxy_url.strip_prefix("socks5h://"))?;
    let (auth, hostport) = match rest.rsplit_once('@') {
        Some((auth, hostport)) => (Some(auth), hostport),
        None => (None, rest),
    };
    let (host, port) = hostport.rsplit_once(':')?;
    let port: u16 = port.parse().ok()?;
    let (user, pass) = match auth {
        Some(auth) => {
            let (u, p) = auth.split_once(':')?;
            (Some(u.to_string()), Some(p.to_string()))
        }
        None => (None, None),
    };
    Some(SocksProxy {
        host: host.to_string(),
        port,
        user,
        pass,
    })
}

fn dump_outbound(cfg: &Config, request: &OutboundRequest, zstd_bytes: usize, extra: Value) {
    if std::env::var("KIN_CODEX_DUMP_SAMPLE").ok().as_deref() != Some("1") {
        return;
    }
    let path = cfg.socket_path.with_file_name("last-outbound.json");
    let headers: Vec<Value> = request
        .headers
        .iter()
        .map(|(k, v)| {
            let value = if k.eq_ignore_ascii_case("authorization") {
                if v.len() > 14 {
                    format!("{}…{}", &v[..12], &v[v.len() - 4..])
                } else {
                    "<redacted>".into()
                }
            } else {
                v.clone()
            };
            json!({ "name": k, "value": value })
        })
        .collect();
    let rec = json!({
        "url": request.url,
        "transport": extra.get("transport").cloned().unwrap_or(json!("http")),
        "proxy_required": cfg.proxy_required,
        "zstd_bytes": zstd_bytes,
        "headers": headers,
        "body": request.body,
        "extra": extra,
    });
    if let Ok(text) = serde_json::to_string_pretty(&rec) {
        let _ = std::fs::write(path, text);
    }
}

async fn client(cfg: &Config) -> Result<Client, KernelError> {
    let mut builder = Client::builder().use_rustls_tls();
    if !cfg.proxy_url.trim().is_empty() {
        let proxy =
            Proxy::all(&cfg.proxy_url).map_err(|e| KernelError::upstream(e.to_string(), false))?;
        builder = builder.proxy(proxy);
    }
    builder
        .build()
        .map_err(|e| KernelError::upstream(e.to_string(), false))
}

async fn hop_http(cfg: &Config, request: &OutboundRequest) -> Result<HopLive, KernelError> {
    let json_bytes = serde_json::to_vec(&request.body)?;
    let compressed = zstd::bulk::compress(&json_bytes, 3)
        .map_err(|e| KernelError::upstream(e.to_string(), false))?;
    let zstd_len = compressed.len();
    dump_outbound(
        cfg,
        request,
        zstd_len,
        json!({ "phase": "request", "transport": "http" }),
    );
    let http = client(cfg).await?;
    let mut req = http
        .post(request.url.clone())
        .header("content-type", "application/json")
        .header("content-encoding", "zstd")
        .header("accept", "text/event-stream")
        .body(compressed);
    for (k, v) in &request.headers {
        req = req.header(k.as_str(), v.as_str());
    }
    let resp = req
        .send()
        .await
        .map_err(|e| KernelError::upstream(e.to_string(), e.status().is_some()))?;
    let status = resp.status().as_u16();
    if status >= 400 {
        let text = resp
            .text()
            .await
            .map_err(|e| KernelError::upstream(e.to_string(), true))?;
        let snippet: String = text.chars().take(400).collect();
        return Err(KernelError::upstream(
            format!("upstream status {status}: {snippet}"),
            true,
        ));
    }
    let (tx, rx) = mpsc::channel(32);
    tokio::spawn(async move {
        let mut stream = resp.bytes_stream();
        let mut buf = String::new();
        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    buf.push_str(&String::from_utf8_lossy(&bytes));
                    for frame in take_sse_frames(&mut buf) {
                        if tx.send(Ok(frame)).await.is_err() {
                            return;
                        }
                    }
                }
                Err(err) => {
                    let _ = tx
                        .send(Err(KernelError::upstream(err.to_string(), true)))
                        .await;
                    return;
                }
            }
        }
        if !buf.trim().is_empty() {
            for frame in split_sse(&buf) {
                if tx.send(Ok(frame)).await.is_err() {
                    return;
                }
            }
        }
    });
    Ok(HopLive { status, rx })
}

async fn hop_ws(cfg: &Config, request: &OutboundRequest) -> Result<HopLive, KernelError> {
    let ws_url = cfg.responses_ws_url();
    let mut ws_request = ws_url
        .as_str()
        .into_client_request()
        .map_err(|e| KernelError::upstream(e.to_string(), false))?;
    for (k, v) in &request.headers {
        if k.eq_ignore_ascii_case("authorization") {
            ws_request.headers_mut().insert(
                AUTHORIZATION,
                HeaderValue::from_str(v).unwrap_or(HeaderValue::from_static("")),
            );
        } else if k.eq_ignore_ascii_case("user-agent") {
            ws_request.headers_mut().insert(
                USER_AGENT,
                HeaderValue::from_str(v).unwrap_or(HeaderValue::from_static("")),
            );
        } else if let (Ok(name), Ok(val)) = (k.parse::<HeaderName>(), HeaderValue::from_str(v)) {
            ws_request.headers_mut().append(name, val);
        }
    }
    let (mut ws, resp) = connect_ws(cfg, ws_request).await?;
    let status = resp.status().as_u16();
    let payload = ws_create_payload(&request.body);
    ws.send(Message::Text(payload.to_string().into()))
        .await
        .map_err(|e| KernelError::upstream(e.to_string(), true))?;
    let (tx, rx) = mpsc::channel(32);
    tokio::spawn(async move {
        while let Some(msg) = ws.next().await {
            let msg = match msg {
                Ok(msg) => msg,
                Err(err) => {
                    let _ = tx
                        .send(Err(KernelError::upstream(err.to_string(), true)))
                        .await;
                    return;
                }
            };
            match msg {
                Message::Text(text) => {
                    let frame = format!("event: response\ndata: {text}\n\n");
                    let terminal = is_terminal_frame(&frame);
                    if tx.send(Ok(frame)).await.is_err() {
                        return;
                    }
                    if terminal {
                        break;
                    }
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });
    Ok(HopLive { status, rx })
}

async fn connect_ws(
    cfg: &Config,
    request: tokio_tungstenite::tungstenite::http::Request<()>,
) -> Result<
    (
        tokio_tungstenite::WebSocketStream<
            tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
        >,
        tokio_tungstenite::tungstenite::http::Response<Option<Vec<u8>>>,
    ),
    KernelError,
> {
    if let Some(proxy) = parse_socks(&cfg.proxy_url) {
        let host = request
            .uri()
            .host()
            .ok_or_else(|| KernelError::upstream("websocket host missing", false))?
            .to_string();
        let port = request.uri().port_u16().unwrap_or(443);
        let socks = match (&proxy.user, &proxy.pass) {
            (Some(user), Some(pass)) => {
                Socks5Stream::connect_with_password(
                    (proxy.host.as_str(), proxy.port),
                    (host.as_str(), port),
                    user,
                    pass,
                )
                .await
            }
            _ => {
                Socks5Stream::connect((proxy.host.as_str(), proxy.port), (host.as_str(), port))
                    .await
            }
        }
        .map_err(|e| KernelError::upstream(format!("websocket socks: {e}"), false))?;
        let stream = socks.into_inner();
        tokio_tungstenite::client_async_tls(request, stream)
            .await
            .map_err(|e| KernelError::upstream(e.to_string(), false))
    } else {
        tokio_tungstenite::connect_async(request)
            .await
            .map_err(|e| KernelError::upstream(e.to_string(), false))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_socks_without_auth() {
        let p = parse_socks("socks5://127.0.0.1:1080").unwrap();
        assert_eq!(p.host, "127.0.0.1");
        assert_eq!(p.port, 1080);
        assert!(p.user.is_none());
    }

    #[test]
    fn proxy_does_not_skip_websocket() {
        let sent = KernelError::upstream("upstream status 500", true);
        assert!(!should_fallback_http(&sent));
        let upgrade = KernelError::upstream("426 upgrade required", false);
        assert!(should_fallback_http(&upgrade));
        let socks_fail = KernelError::upstream("websocket socks: timed out", false);
        assert!(!should_fallback_http(&socks_fail));
    }

    #[test]
    fn prepare_request_puts_identity_in_headers_not_body() {
        let cfg = Config {
            vm_id: "vm-codex".into(),
            device_id: "device-vm".into(),
            socket_path: "/tmp/x.sock".into(),
            credential_path: "/tmp/c.json".into(),
            proxy_url: "socks5://127.0.0.1:1080".into(),
            proxy_required: true,
            internal_token: "tok".into(),
            chatgpt_base_url: "https://chatgpt.com/backend-api/codex".into(),
            oauth_token_url: "https://auth.openai.com/oauth/token".into(),
            user_agent: "codex_cli_rs/0.153.4".into(),
            test_endpoints: true,
        };
        let account = Account {
            id: "a1".into(),
            access_token: "at".into(),
            refresh_token: "rt".into(),
            id_token: String::new(),
            expires_at: 0,
            chatgpt_account_id: "org-1".into(),
            rpm: 0,
            max_concurrency: 1,
        };
        let body = json!({"model":"gpt-5.4","stream":false,"store":true});
        let req = prepare_request(&cfg, &account, body.clone(), Some("sess-1"));
        assert_eq!(req.body["stream"], false);
        assert_eq!(req.body["store"], true);
        assert!(req.body.get("client_metadata").is_none());
        assert!(req
            .headers
            .iter()
            .any(|(k, v)| k == "chatgpt-account-id" && v == "org-1"));
        assert!(req
            .headers
            .iter()
            .any(|(k, v)| k == "x-codex-installation-id" && v == "device-vm"));
    }
}
