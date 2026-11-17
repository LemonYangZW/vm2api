//! 自控 h2 上游客户端：连接、请求、SSE 解码。
//!
//! 为什么不用现成 HTTP 库（§6.3）：官方在 Bun native HTTP 层覆写 CCH，
//! JS 层打戳只是等价重算；只有**自己持有 TLS/h2 栈**才能保证
//! 「投影 → 打戳 → wire 字节」三步之间没有任何框架插入的改写。
//!
//! 本模块只做传输：请求体已由 `wire::build_messages_request` 一次成型。

use std::io;
use std::path::PathBuf;
use std::sync::Arc;

use bytes::Bytes;
use h2::RecvStream;
use http::Request;
use tokio::io::{AsyncRead, AsyncWrite};

use crate::http::proxy::Proxy;
use crate::oauth::Refresher;
use crate::http::tls;
use crate::http::wire::WireRequest;

/// 上游协议方案。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Scheme {
    Http,
    Https,
}

/// 上游基址。
#[derive(Debug, Clone)]
pub struct Origin {
    pub scheme: Scheme,
    pub host: String,
    pub port: u16,
}

impl Origin {
    /// 解析 `https://api.anthropic.com` / `http://127.0.0.1:8080` 形态。
    pub fn parse(base: &str) -> io::Result<Self> {
        let (scheme, rest) = match base.split_once("://") {
            Some(("https", rest)) => (Scheme::Https, rest),
            Some(("http", rest)) => (Scheme::Http, rest),
            _ => (Scheme::Https, base),
        };
        let default_port = if scheme == Scheme::Https { 443 } else { 80 };
        let (host, port) = match rest.rsplit_once(':') {
            Some((host, port)) if port.chars().all(|c| c.is_ascii_digit()) => (
                host.to_string(),
                port.parse::<u16>()
                    .map_err(|e| io::Error::other(format!("port: {e}")))?,
            ),
            _ => (rest.to_string(), default_port),
        };
        let host = host.trim_end_matches('/').to_string();
        if host.is_empty() {
            return Err(io::Error::other("empty upstream host"));
        }
        Ok(Self { scheme, host, port })
    }

    fn authority(&self) -> String {
        let default_port = if self.scheme == Scheme::Https { 443 } else { 80 };
        if self.port == default_port {
            self.host.clone()
        } else {
            format!("{}:{}", self.host, self.port)
        }
    }
}

/// 凭据：API key 走 `x-api-key`，OAuth 走 `authorization: Bearer`。
#[derive(Debug, Clone)]
pub enum Credential {
    ApiKey(String),
    OAuth(String),
}

impl Credential {
    /// 环境变量注入（OAuth 刷新由控制面负责，这里只消费现成 token）。
    pub fn from_env() -> Option<Self> {
        for key in ["ANTHROPIC_API_KEY"] {
            if let Ok(value) = std::env::var(key) {
                if !value.trim().is_empty() {
                    return Some(Credential::ApiKey(value.trim().to_string()));
                }
            }
        }
        for key in ["CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_AUTH_TOKEN"] {
            if let Ok(value) = std::env::var(key) {
                if !value.trim().is_empty() {
                    return Some(Credential::OAuth(value.trim().to_string()));
                }
            }
        }
        None
    }

    /// 出站认证头。
    pub fn header(&self) -> (&'static str, String) {
        match self {
            Credential::ApiKey(key) => ("x-api-key", key.clone()),
            Credential::OAuth(token) => ("authorization", format!("Bearer {token}")),
        }
    }

    pub fn is_oauth(&self) -> bool {
        matches!(self, Credential::OAuth(_))
    }
}

/// 可被 h2 驱动的双向流。
pub trait Io: AsyncRead + AsyncWrite + Unpin + Send {}
impl<T: AsyncRead + AsyncWrite + Unpin + Send> Io for T {}

/// 响应头。
#[derive(Debug, Clone)]
pub struct ResponseHead {
    pub status: u16,
    pub headers: Vec<(String, String)>,
}

impl ResponseHead {
    pub fn get(&self, key: &str) -> Option<&str> {
        let key = key.to_ascii_lowercase();
        self.headers
            .iter()
            .find(|(k, _)| *k == key)
            .map(|(_, v)| v.as_str())
    }

    pub fn is_sse(&self) -> bool {
        self.get("content-type")
            .map(|v| v.to_ascii_lowercase().contains("text/event-stream"))
            .unwrap_or(false)
    }
}

/// 一次上游响应。
pub struct UpstreamResponse {
    pub head: ResponseHead,
    pub body: RecvStream,
}

impl UpstreamResponse {
    /// 读完整个 body（非流式），带上限保护。
    pub async fn collect(mut self, limit: usize) -> io::Result<Vec<u8>> {
        let mut out = Vec::new();
        while let Some(chunk) = self.body.data().await {
            let chunk = chunk.map_err(io::Error::other)?;
            self.body
                .flow_control()
                .release_capacity(chunk.len())
                .map_err(io::Error::other)?;
            out.extend_from_slice(&chunk);
            if out.len() > limit {
                return Err(io::Error::other("upstream response exceeds limit"));
            }
        }
        Ok(out)
    }
}

/// 一个 SSE 事件。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SseEvent {
    pub event: Option<String>,
    pub data: String,
}

/// 增量 SSE 解码器：跨 chunk 的半行与半事件都能正确处理。
#[derive(Default)]
pub struct SseDecoder {
    pending: Vec<u8>,
    event: Option<String>,
    data: String,
}

impl SseDecoder {
    pub fn new() -> Self {
        Self::default()
    }

    /// 喂入一段字节，返回本次凑齐的完整事件。
    pub fn push(&mut self, chunk: &[u8]) -> Vec<SseEvent> {
        self.pending.extend_from_slice(chunk);
        let mut events = Vec::new();
        loop {
            let Some(pos) = self.pending.iter().position(|b| *b == b'\n') else {
                break;
            };
            let line: Vec<u8> = self.pending.drain(..=pos).collect();
            let line = String::from_utf8_lossy(&line[..line.len() - 1]);
            let line = line.strip_suffix('\r').unwrap_or(&line);
            if line.is_empty() {
                if let Some(event) = self.take_event() {
                    events.push(event);
                }
                continue;
            }
            if line.starts_with(':') {
                continue;
            }
            let (field, value) = match line.split_once(':') {
                Some((field, value)) => (field, value.strip_prefix(' ').unwrap_or(value)),
                None => (line, ""),
            };
            match field {
                "event" => self.event = Some(value.to_string()),
                "data" => {
                    if !self.data.is_empty() {
                        self.data.push('\n');
                    }
                    self.data.push_str(value);
                }
                _ => {}
            }
        }
        events
    }

    /// 流结束时冲掉最后一个未闭合事件。
    pub fn finish(&mut self) -> Option<SseEvent> {
        if self.pending.is_empty() && self.event.is_none() && self.data.is_empty() {
            return None;
        }
        self.pending.clear();
        self.take_event()
    }

    fn take_event(&mut self) -> Option<SseEvent> {
        let event = self.event.take();
        let data = std::mem::take(&mut self.data);
        if event.is_none() && data.is_empty() {
            return None;
        }
        Some(SseEvent { event, data })
    }
}

/// 上游客户端。
pub struct UpstreamClient {
    origin: Origin,
    config: Arc<rustls::ClientConfig>,
    credential: Option<Credential>,
    proxy: Option<Proxy>,
    /// 复用的 h2 连接；`None` 表示需要重建。
    conn: tokio::sync::Mutex<Option<h2::client::SendRequest<Bytes>>>,
    /// 凭据刷新器：每次 hop 前取其可用凭据。
    refresher: Option<Arc<Refresher>>,
}

impl UpstreamClient {
    /// `base`：`https://api.anthropic.com` 或离线 mock 的 `http://127.0.0.1:PORT`。
    pub fn new(base: &str, ca_pem: Option<PathBuf>) -> io::Result<Self> {
        let origin = Origin::parse(base)?;
        let config = tls::client_config(ca_pem.as_deref())?;
        Ok(Self {
            origin,
            config,
            credential: Credential::from_env(),
            proxy: Proxy::from_settings(&crate::http::proxy::ProxySettings::from_env())?,
            conn: tokio::sync::Mutex::new(None),
            refresher: None,
        })
    }

    /// 挂上凭据刷新器（每 hop 先 `ensure(false)`，过期才刷新）。
    pub fn with_refresher(mut self, refresher: Arc<Refresher>) -> Self {
        self.refresher = Some(refresher);
        self
    }

    /// 出站认证头：刷新器优先，其次环境变量直给。
    async fn auth_header(&self) -> io::Result<Option<(&'static str, String)>> {
        if let Some(refresher) = &self.refresher {
            let credential = refresher.ensure_io(false).await?;
            let name = credential.resolved_scheme().header_name();
            let token = credential.token().to_string();
            if token.is_empty() {
                return Err(io::Error::other("credential has no access token"));
            }
            let value = if name == "authorization" {
                format!("Bearer {token}")
            } else {
                token
            };
            return Ok(Some((name, value)));
        }
        Ok(self.credential.as_ref().map(|credential| {
            let (name, value) = credential.header();
            (name, value)
        }))
    }

    /// 显式指定代理（`None` 表示直连）。
    pub fn with_proxy(mut self, proxy: Option<Proxy>) -> Self {
        self.proxy = proxy;
        self
    }

    pub fn proxy(&self) -> Option<&Proxy> {
        self.proxy.as_ref()
    }

    pub fn with_credential(mut self, credential: Option<Credential>) -> Self {
        self.credential = credential;
        self
    }

    pub fn origin(&self) -> &Origin {
        &self.origin
    }

    pub fn credential(&self) -> Option<&Credential> {
        self.credential.as_ref()
    }

    async fn connect(&self) -> io::Result<Box<dyn Io>> {
        let tcp = match &self.proxy {
            Some(proxy) => proxy.dial(&self.origin.host, self.origin.port).await?,
            None => {
                let tcp = tokio::net::TcpStream::connect((self.origin.host.as_str(), self.origin.port)).await?;
                tcp.set_nodelay(true)?;
                tcp
            }
        };
        match self.origin.scheme {
            Scheme::Https => {
                let stream = tls::connect_tls_stream(
                    Arc::clone(&self.config),
                    tcp,
                    &self.origin.host,
                )
                .await?;
                if stream.get_ref().1.alpn_protocol() != Some(b"h2".as_slice()) {
                    return Err(io::Error::other("upstream did not negotiate h2"));
                }
                Ok(Box::new(stream))
            }
            Scheme::Http => Ok(Box::new(tcp)),
        }
    }

    fn build_authority(&self) -> String {
        self.origin.authority()
    }

    /// 取一条可用的 h2 连接（复用或新建）；`bool` 表示是否复用。
    async fn sender(&self) -> io::Result<(h2::client::SendRequest<Bytes>, bool)> {
        {
            let guard = self.conn.lock().await;
            if let Some(send) = guard.as_ref() {
                return Ok((send.clone(), true));
            }
        }
        let io = self.connect().await?;
        let (send, connection) = h2::client::handshake(io).await.map_err(io::Error::other)?;
        tokio::spawn(async move {
            if let Err(error) = connection.await {
                eprintln!("[crag] h2 connection closed: {error}");
            }
        });
        let mut guard = self.conn.lock().await;
        *guard = Some(send.clone());
        Ok((send, false))
    }

    /// 丢掉当前连接（下次请求重建）。
    pub async fn drop_connection(&self) {
        *self.conn.lock().await = None;
    }

    /// 在指定连接上发一次 `POST /v1/messages`。
    async fn send_via(
        &self,
        mut send: h2::client::SendRequest<Bytes>,
        wire: &WireRequest,
    ) -> io::Result<UpstreamResponse> {
        let authority = self.build_authority();
        let scheme = if self.origin.scheme == Scheme::Https { "https" } else { "http" };
        let uri = format!("{scheme}://{authority}{}", wire.path);
        let mut builder = Request::builder()
            .method(wire.method)
            .uri(uri)
            .version(http::Version::HTTP_2);
        for (key, value) in &wire.headers {
            builder = builder.header(key.as_str(), value.as_str());
        }
        if let Some((key, value)) = self.auth_header().await? {
            builder = builder.header(key, value);
        }
        let request = builder.body(()).map_err(io::Error::other)?;

        let (response, mut stream) = send
            .send_request(request, false)
            .map_err(io::Error::other)?;
        stream
            .send_data(Bytes::from(wire.body.clone()), true)
            .map_err(io::Error::other)?;

        let response = response.await.map_err(io::Error::other)?;
        let (parts, body) = response.into_parts();
        let headers = parts
            .headers
            .iter()
            .map(|(k, v)| (k.as_str().to_string(), v.to_str().unwrap_or_default().to_string()))
            .collect();
        Ok(UpstreamResponse {
            head: ResponseHead {
                status: parts.status.as_u16(),
                headers,
            },
            body,
        })
    }

    /// 只建链：连通 → 代理隧道（如有）→ TLS（ALPN h2）→ h2 握手。
    /// 用于真机前的 preflight，不发任何业务请求。
    pub async fn handshake(&self) -> io::Result<()> {
        let _sender = self.sender().await?;
        Ok(())
    }

    /// 发一次 GET（非推理端点自检用，如 `/v1/models`）。
    pub async fn get(&self, path: &str) -> io::Result<UpstreamResponse> {
        let mut attempt = 0u8;
        loop {
            let (send, reused) = self.sender().await?;
            match self.send_once(send, "GET", path, None).await {
                Ok(response) => return Ok(response),
                Err(error) if reused && attempt == 0 => {
                    eprintln!("[crag] h2 reuse failed ({error}), reconnecting");
                    self.drop_connection().await;
                    attempt += 1;
                }
                Err(error) => return Err(error),
            }
        }
    }

    /// 在指定连接上发一次请求（`body=None` 即无 body 的 GET）。
    async fn send_once(
        &self,
        mut send: h2::client::SendRequest<Bytes>,
        method: &str,
        path: &str,
        body: Option<&[u8]>,
    ) -> io::Result<UpstreamResponse> {
        let authority = self.build_authority();
        let scheme = if self.origin.scheme == Scheme::Https { "https" } else { "http" };
        let uri = format!("{scheme}://{authority}{path}");
        let mut builder = Request::builder()
            .method(method)
            .uri(uri)
            .version(http::Version::HTTP_2);
        if let Some((key, value)) = self.auth_header().await? {
            builder = builder.header(key, value);
        }
        // 上游要求 `anthropic-version`；GET（如 `/v1/models`）不走 wire 层，必须在这里补。
        builder = builder.header("anthropic-version", "2023-06-01");
        builder = builder.header("accept", "application/json");
        if body.is_some() {
            builder = builder.header("content-type", "application/json");
        }
        if let Some(credential) = &self.credential {
            if !self.refresher.is_some() {
                let (key, value) = credential.header();
                builder = builder.header(key, value);
            }
        }
        let request = builder.body(()).map_err(io::Error::other)?;

        let (response, mut stream) = send
            .send_request(request, body.is_none())
            .map_err(io::Error::other)?;
        if let Some(bytes) = body {
            stream
                .send_data(Bytes::from(bytes.to_vec()), true)
                .map_err(io::Error::other)?;
        }
        let response = response.await.map_err(io::Error::other)?;
        let (parts, body_stream) = response.into_parts();
        let headers = parts
            .headers
            .iter()
            .map(|(k, v)| (k.as_str().to_string(), v.to_str().unwrap_or_default().to_string()))
            .collect();
        Ok(UpstreamResponse {
            head: ResponseHead {
                status: parts.status.as_u16(),
                headers,
            },
            body: body_stream,
        })
    }

    /// 发一次 `POST /v1/messages`；复用连接失败时丢弃并重建一次。
    pub async fn post_messages(&self, wire: &WireRequest) -> io::Result<UpstreamResponse> {
        let mut attempt = 0u8;
        loop {
            let (send, reused) = self.sender().await?;
            match self.send_via(send, wire).await {
                Ok(response) => return Ok(response),
                Err(error) if reused && attempt == 0 => {
                    // 复用连接大概率已被上游空闲回收：丢连接，重试一次。
                    eprintln!("[crag] h2 reuse failed ({error}), reconnecting");
                    self.drop_connection().await;
                    attempt += 1;
                }
                Err(error) => return Err(error),
            }
        }
    }
}

/// 逐事件推入 channel（调用方在自己的任务里写 socket，避免读写互锁）。
pub async fn read_sse_into(
    mut body: RecvStream,
    tx: tokio::sync::mpsc::UnboundedSender<SseEvent>,
) -> io::Result<()> {
    let mut decoder = SseDecoder::new();
    while let Some(chunk) = body.data().await {
        let chunk = chunk.map_err(io::Error::other)?;
        body.flow_control()
            .release_capacity(chunk.len())
            .map_err(io::Error::other)?;
        for event in decoder.push(&chunk) {
            if tx.send(event).is_err() {
                return Ok(());
            }
        }
    }
    if let Some(event) = decoder.finish() {
        let _ = tx.send(event);
    }
    Ok(())
}

/// 逐事件消费 SSE 响应；`on_event` 返回 `false` 立即停止。
pub async fn read_sse(
    mut body: RecvStream,
    mut on_event: impl FnMut(SseEvent) -> bool,
) -> io::Result<()> {
    let mut decoder = SseDecoder::new();
    while let Some(chunk) = body.data().await {
        let chunk = chunk.map_err(io::Error::other)?;
        body.flow_control()
            .release_capacity(chunk.len())
            .map_err(io::Error::other)?;
        for event in decoder.push(&chunk) {
            if !on_event(event) {
                return Ok(());
            }
        }
    }
    if let Some(event) = decoder.finish() {
        on_event(event);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_origin_variants() {
        let origin = Origin::parse("https://api.anthropic.com").unwrap();
        assert_eq!((origin.scheme, origin.host.as_str(), origin.port), (Scheme::Https, "api.anthropic.com", 443));
        let origin = Origin::parse("http://127.0.0.1:8123").unwrap();
        assert_eq!((origin.scheme, origin.host.as_str(), origin.port), (Scheme::Http, "127.0.0.1", 8123));
        assert!(Origin::parse("https://").is_err());
    }

    #[test]
    fn decodes_events_split_across_chunks() {
        let mut decoder = SseDecoder::new();
        assert!(decoder.push(b"event: message_start\nda").is_empty());
        let events = decoder.push(b"ta: {\"type\":\"message_start\"}\n\n");
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].event.as_deref(), Some("message_start"));
        assert_eq!(events[0].data, "{\"type\":\"message_start\"}");
    }

    #[test]
    fn joins_multiline_data_and_ignores_comments() {
        let mut decoder = SseDecoder::new();
        let events = decoder.push(b": keepalive\ndata: a\ndata: b\n\n");
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].data, "a\nb");
        assert!(events[0].event.is_none());
    }

    #[test]
    fn flushes_trailing_event_without_blank_line() {
        let mut decoder = SseDecoder::new();
        assert!(decoder.push(b"event: message_stop\ndata: {}").is_empty());
        let event = decoder.finish().unwrap();
        assert_eq!(event.event.as_deref(), Some("message_stop"));
    }

    #[test]
    fn credential_headers_follow_scheme() {
        assert_eq!(Credential::ApiKey("k".into()).header(), ("x-api-key", "k".into()));
        assert_eq!(
            Credential::OAuth("t".into()).header(),
            ("authorization", "Bearer t".into())
        );
    }
}
