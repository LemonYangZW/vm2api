//! Gateway-worker `provider=local_cli` arm.
//!
//! Envelope `body` becomes `kin_job_start.request`. CLI stdout events are
//! encoded as Anthropic SSE and pumped with the same `sse::pump` the HTTP hop
//! uses. Rust does not originate Anthropic TLS.

use std::env;
use std::fs;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::Duration;

use axum::body::Body;
use axum::http::{HeaderMap, HeaderName, HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use bytes::Bytes as RawBytes;

use futures_util::Stream;
use http_body::Frame;
use http_body_util::StreamBody;
use serde_json::{Value, json};
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

use super::config::WorkerConfig;
use super::error::WorkerError;
use super::server::{TRAILER_NAMES, apply_stream_meta, incomplete_event, pump_options};
use super::sse::{PumpError, PumpOptions, pump};
use crate::error::KernelError;
use crate::model::MessageRequest;
use crate::provider::multiplex_cli::{MultiplexCliProvider, MultiplexConfig};
use crate::provider::{ExecutionContext, Provider, StreamRx, collect_stream};
use crate::stream::StreamItem;

/// Frozen container paths (parent design I0). Node writes these into kernel.json.
pub const CONTAINER_CLAUDE_BIN: &str = "/opt/kin/cli-node";
pub const CONTAINER_HTTP_TO_SOCKS: &str = "/opt/kin/http_to_socks.py";
pub const DEFAULT_CONNECT_BRIDGE: &str = "http://127.0.0.1:18080";
pub const DEFAULT_CONNECT_BRIDGE_ADDR: &str = "127.0.0.1:18080";

pub fn connect_bridge_addr(https_proxy: &str) -> Option<String> {
    let parsed = url::Url::parse(https_proxy.trim()).ok()?;
    let host = parsed.host_str()?.to_string();
    match parsed.port() {
        Some(port) => Some(format!("{host}:{port}")),
        None if parsed.scheme() == "http" => Some(format!("{host}:80")),
        None if parsed.scheme() == "https" => Some(format!("{host}:443")),
        None => Some(host),
    }
}

pub fn multiplex_config(config: &WorkerConfig) -> MultiplexConfig {
    let slots = usize::try_from(config.slots_per_worker.max(1)).unwrap_or(1);
    let lifetime_secs = env::var("KIN_SLOT_MAX_LIFETIME_SECS")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(u64::MAX / 2);
    let session_dir = std::path::Path::new(&config.credential_path)
        .parent()
        .map(std::path::PathBuf::from);
    MultiplexConfig {
        slot_count: slots.min(20),
        simulate: false,
        bin: config.claude_bin_path(),
        mock_bin: config.claude_bin.contains("mock-claude"),
        model: "claude-sonnet-5".into(),
        max_jobs_per_slot: 50,
        slot_max_lifetime: Duration::from_secs(lifetime_secs),
        session_idle_ttl: Duration::from_secs(600),
        simulate_latency: Duration::from_millis(40),
        continuation_ttl_secs: 600,
        client_stall_timeout: Duration::from_secs(crate::config::DEFAULT_CLIENT_STALL_SECS),
        submit_wait: Duration::from_millis(2000),
        desired_config_hash: if config.config_hash.trim().is_empty() {
            None
        } else {
            Some(config.config_hash.clone())
        },
        session_dir,
    }
}

/// Boot-time only: multiplex supervisor reads proxy/envelope from process env.
pub fn apply_cli_env(config: &WorkerConfig) {
    // SAFETY: called once from `run()` before the Unix listener accepts.
    unsafe {
        // Leave KIN_HTTPS_PROXY unset so multiplex `ensure_socks_http_bridge`
        // owns the CONNECT listener, then exports HTTPS_PROXY to the CLI.
        env::remove_var("KIN_HTTPS_PROXY");
        if config.https_proxy.trim().is_empty() {
            env::remove_var("KIN_HTTP_TO_SOCKS");
            env::remove_var("KIN_HTTP_BRIDGE_ADDR");
            env::remove_var("KIN_SOCKS5");
        } else if env::var("KIN_HTTP_TO_SOCKS")
            .ok()
            .filter(|value| !value.trim().is_empty())
            .is_none()
        {
            env::set_var("KIN_HTTP_TO_SOCKS", CONTAINER_HTTP_TO_SOCKS);
            if let Some(addr) = connect_bridge_addr(&config.https_proxy) {
                env::set_var("KIN_HTTP_BRIDGE_ADDR", addr);
            } else {
                env::set_var("KIN_HTTP_BRIDGE_ADDR", DEFAULT_CONNECT_BRIDGE_ADDR);
            }
        }
        env::set_var("KIN_SYSTEM_MODE", &config.system_layout);
        env::set_var("CLAUDE_CODE_SYSTEM_LAYOUT", &config.system_layout);
        env::set_var(
            "CLAUDE_CODE_ENTRYPOINT",
            crate::provider::multiplex_cli::supervisor::spawn_cli_entrypoint(),
        );
        env::set_var("USER_TYPE", "external");
        env::set_var("CLAUDE_CODE_VERSION", config.cli_version.trim());
        env::set_var("KIN_SLOTS_PER_WORKER", config.slots_per_worker.to_string());
        env::set_var("KIN_CLAUDE_BIN", &config.claude_bin);
        if !config.timezone.trim().is_empty() {
            env::set_var("KIN_SLOT_TZ", &config.timezone);
            env::set_var("TZ", &config.timezone);
            env::set_var("CLAUDE_CODE_TIMEZONE", &config.timezone);
        }
        if !config.config_hash.trim().is_empty() {
            env::set_var("KIN_DESIRED_CONFIG_HASH", &config.config_hash);
        }
        if !config.https_proxy.trim().is_empty() && !config.proxy_url.trim().is_empty() {
            env::set_var("KIN_SOCKS5", &config.proxy_url);
        }
        if let Ok(blob) = fs::read_to_string(&config.credential_path) {
            if !blob.trim().is_empty() {
                env::set_var("KIN_CLAUDE_AI_OAUTH_JSON", blob);
            }
        }
    }
}

pub async fn handle(
    provider: &MultiplexCliProvider,
    config: &WorkerConfig,
    shutdown: CancellationToken,
    body: &Value,
    stream: bool,
    delivery_mode: &str,
) -> Result<Response, WorkerError> {
    let request = parse_request(body)?;
    let context = ExecutionContext {
        tenant_id: config.vm_id.clone(),
        session_id: session_id(body),
        worker_id: config.vm_id.clone(),
        worker_generation: 1,
        resumed: false,
    };
    let rx = provider
        .execute_stream(&request, &context)
        .await
        .map_err(map_kernel)?;
    if !stream {
        return buffer_json(rx).await;
    }
    let sse = sse_byte_stream(rx);
    if delivery_mode == "verified" {
        verified_stream(sse, config, shutdown).await
    } else {
        Ok(realtime_stream(sse, config, shutdown))
    }
}

fn parse_request(body: &Value) -> Result<MessageRequest, WorkerError> {
    let mut object = match body {
        Value::Object(map) => map.clone(),
        _ => {
            return Err(WorkerError::new(
                StatusCode::BAD_REQUEST,
                "invalid_request",
                "body must be an object",
            ));
        }
    };
    if !object.contains_key("max_tokens") {
        object.insert("max_tokens".into(), json!(1024));
    }
    let mut request: MessageRequest =
        serde_json::from_value(Value::Object(object)).map_err(|err| {
            WorkerError::new(StatusCode::BAD_REQUEST, "invalid_request", err.to_string())
        })?;
    request.strip_server_tool_extras();
    Ok(request)
}

fn session_id(body: &Value) -> String {
    body.get("metadata")
        .and_then(|metadata| metadata.get("user_id"))
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .unwrap_or("default")
        .to_string()
}

fn event_to_sse(event: &Value) -> Vec<u8> {
    let name = event
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or("message");
    format!("event: {name}\ndata: {event}\n\n").into_bytes()
}

struct SseByteStream {
    rx: StreamRx,
    saw_stop: bool,
}

impl Stream for SseByteStream {
    type Item = Result<RawBytes, KernelError>;

    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        let this = self.get_mut();
        loop {
            match this.rx.poll_recv(cx) {
                Poll::Ready(Some(Ok(StreamItem::Event(event)))) => {
                    if event.get("type").and_then(Value::as_str) == Some("message_stop") {
                        this.saw_stop = true;
                    }
                    return Poll::Ready(Some(Ok(RawBytes::from(event_to_sse(&event)))));
                }
                Poll::Ready(Some(Ok(StreamItem::Finished(_)))) => {
                    if !this.saw_stop {
                        this.saw_stop = true;
                        return Poll::Ready(Some(Ok(RawBytes::from(event_to_sse(&json!({
                            "type": "message_stop"
                        }))))));
                    }
                    continue;
                }
                Poll::Ready(Some(Err(err))) => return Poll::Ready(Some(Err(err))),
                Poll::Ready(None) => return Poll::Ready(None),
                Poll::Pending => return Poll::Pending,
            }
        }
    }
}

fn sse_byte_stream(rx: StreamRx) -> SseByteStream {
    SseByteStream {
        rx,
        saw_stop: false,
    }
}

async fn buffer_json(rx: StreamRx) -> Result<Response, WorkerError> {
    let response = collect_stream(rx).await.map_err(map_kernel)?;
    let data = serde_json::to_vec(&response).map_err(|err| {
        WorkerError::new(StatusCode::BAD_GATEWAY, "provider_error", err.to_string())
    })?;
    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/json"),
    );
    headers.insert(
        HeaderName::from_static("x-kin-terminal-state"),
        HeaderValue::from_static("verified"),
    );
    Ok((StatusCode::OK, headers, data).into_response())
}

async fn verified_stream<S>(
    body: S,
    config: &WorkerConfig,
    shutdown: CancellationToken,
) -> Result<Response, WorkerError>
where
    S: futures_util::Stream<Item = Result<RawBytes, KernelError>> + Unpin,
{
    let max = usize::try_from(config.max_response_bytes.max(1)).unwrap_or(usize::MAX);
    let outcome = pump(body, pump_options(config, shutdown), |_event| async {
        Ok(())
    })
    .await;
    if let Some(error) = outcome.error {
        return Err(WorkerError::new(
            StatusCode::BAD_GATEWAY,
            "upstream_terminal_invalid",
            error,
        ));
    }
    if outcome.result.body.len() > max {
        return Err(WorkerError::new(
            StatusCode::BAD_GATEWAY,
            "upstream_terminal_invalid",
            "verified stream exceeds response limit",
        ));
    }
    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("text/event-stream"),
    );
    headers.insert(
        HeaderName::from_static("x-kin-terminal-state"),
        HeaderValue::from_static("verified"),
    );
    apply_stream_meta(&mut headers, &outcome.result);
    Ok((StatusCode::OK, headers, outcome.result.body).into_response())
}

fn realtime_stream<S>(body: S, config: &WorkerConfig, shutdown: CancellationToken) -> Response
where
    S: futures_util::Stream<Item = Result<RawBytes, KernelError>> + Unpin + Send + 'static,
{
    let (tx, rx) = mpsc::channel::<Result<Frame<RawBytes>, std::io::Error>>(16);
    let options = pump_options(config, shutdown);
    tokio::spawn(async move {
        pump_realtime(body, options, tx).await;
    });
    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("text/event-stream"),
    );
    headers.insert(
        HeaderName::from_static("trailer"),
        HeaderValue::from_static(TRAILER_NAMES),
    );
    let stream = futures_util::stream::unfold(rx, |mut rx| async move {
        rx.recv().await.map(|item| (item, rx))
    });
    let body = Body::new(StreamBody::new(stream));
    (StatusCode::OK, headers, body).into_response()
}

async fn pump_realtime<S>(
    body: S,
    options: PumpOptions,
    tx: mpsc::Sender<Result<Frame<RawBytes>, std::io::Error>>,
) where
    S: futures_util::Stream<Item = Result<RawBytes, KernelError>> + Unpin,
{
    let emit_tx = tx.clone();
    let emit_shutdown = options.shutdown.clone();
    let outcome = pump(body, options, |event| {
        let tx = emit_tx.clone();
        let shutdown = emit_shutdown.clone();
        async move {
            tokio::select! {
                _ = shutdown.cancelled() => Err(PumpError::Shutdown),
                result = tx.send(Ok(Frame::data(RawBytes::from(event.raw)))) => {
                    result.map_err(|_| PumpError::Emit("client gone".into()))
                }
            }
        }
    })
    .await;
    if let Some(error) = &outcome.error
        && error != "client gone"
    {
        let _ = tx
            .send(Ok(Frame::data(RawBytes::from(incomplete_event(error)))))
            .await;
    }
    let mut trailers = HeaderMap::new();
    let state = if outcome.error.is_some() {
        "incomplete"
    } else {
        "verified"
    };
    let _ = trailers.insert(
        HeaderName::from_static("x-kin-terminal-state"),
        HeaderValue::from_str(state).unwrap_or(HeaderValue::from_static("incomplete")),
    );
    apply_stream_meta(&mut trailers, &outcome.result);
    let _ = tx.send(Ok(Frame::trailers(trailers))).await;
}

fn map_kernel(err: KernelError) -> WorkerError {
    match err {
        KernelError::InvalidRequest(message) => {
            WorkerError::new(StatusCode::BAD_REQUEST, "invalid_request", message)
        }
        KernelError::UnsupportedFeature(message) => {
            WorkerError::new(StatusCode::NOT_IMPLEMENTED, "unsupported_feature", message)
        }
        KernelError::NoCapacity => WorkerError::new(
            StatusCode::SERVICE_UNAVAILABLE,
            "no_capacity",
            KernelError::NoCapacity.to_string(),
        ),
        KernelError::Overloaded { .. } => WorkerError::new(
            StatusCode::SERVICE_UNAVAILABLE,
            "overloaded",
            "runtime overloaded",
        ),
        KernelError::ContinuationMismatch(message) => {
            WorkerError::new(StatusCode::CONFLICT, "continuation_mismatch", message)
        }
        KernelError::ContinuationLost => WorkerError::new(
            StatusCode::CONFLICT,
            "continuation_lost",
            KernelError::ContinuationLost.to_string(),
        ),
        KernelError::Provider(message) => {
            WorkerError::new(StatusCode::BAD_GATEWAY, "provider_error", message)
        }
        KernelError::ProviderRateLimited { .. } => WorkerError::new(
            StatusCode::TOO_MANY_REQUESTS,
            "provider_rate_limited",
            "provider rate limit reached",
        ),
        KernelError::Internal => WorkerError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "internal_error",
            "internal error",
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::gateway_worker::hop::HopClient;
    use crate::gateway_worker::server::{WorkerState, router};
    use axum::body::Bytes;
    use axum::http::Request as HttpRequest;
    use http_body_util::BodyExt;
    use std::sync::Arc;
    use std::time::Instant;
    use tempfile::TempDir;
    use tower::ServiceExt;

    const TOKEN: &str = "internal-secret";

    struct CliEnv {
        _dir: TempDir,
        state: WorkerState,
    }

    async fn build_cli_env(slots: usize) -> CliEnv {
        let dir = TempDir::new().unwrap();
        let cred_path = dir.path().join("credentials.json");
        std::fs::write(
            &cred_path,
            r#"{"claudeAiOauth":{"accessToken":"access","refreshToken":"refresh","expiresAt":4102444800000}}"#,
        )
        .unwrap();
        let socket = dir.path().join("worker.sock");
        let config_path = dir.path().join("worker.json");
        std::fs::write(
            &config_path,
            format!(
                r#"{{
                    "vm_id": "vm-cli",
                    "socket_path": "{}",
                    "credential_path": "{}",
                    "internal_token": "{TOKEN}",
                    "test_endpoints": true,
                    "provider": "local_cli",
                    "claude_bin": "/opt/kin/cli-node",
                    "https_proxy": "http://127.0.0.1:18080",
                    "slots_per_worker": {slots},
                    "delivery_mode": "realtime",
                    "first_byte_timeout_seconds": 5,
                    "idle_timeout_seconds": 5
                }}"#,
                socket.display(),
                cred_path.display()
            ),
        )
        .unwrap();
        let config = WorkerConfig::load(&config_path).unwrap();
        let hop = HopClient::new(&config).unwrap();
        let cli = MultiplexCliProvider::simulated(slots);
        cli.boot().await.expect("simulated cli boot");
        CliEnv {
            _dir: dir,
            state: WorkerState {
                config: Arc::new(config),
                hop: Arc::new(hop),
                cli: Some(Arc::new(cli)),
                started: Instant::now(),
                shutdown: CancellationToken::new(),
            },
        }
    }

    fn envelope(text: &str, stream: bool, delivery: &str, extra_messages: Vec<Value>) -> Value {
        let mut messages = vec![json!({"role":"user","content": text})];
        messages.extend(extra_messages);
        json!({
            "body": {
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 128,
                "messages": messages,
                "tools": [{
                    "name": "get_weather",
                    "description": "weather",
                    "input_schema": {"type":"object","properties":{"city":{"type":"string"}}}
                }],
                "stream": stream
            },
            "headers": { "anthropic-version": "2023-06-01" },
            "stream": stream,
            "delivery_mode": delivery
        })
    }

    async fn call(
        state: WorkerState,
        body: Value,
    ) -> (StatusCode, HeaderMap, Bytes, Option<HeaderMap>) {
        let request = HttpRequest::builder()
            .method("POST")
            .uri("/internal/v1/messages")
            .header("X-Kin-Internal-Token", TOKEN)
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();
        let response = router(state).oneshot(request).await.unwrap();
        let status = response.status();
        let headers = response.headers().clone();
        let collected = response.into_body().collect().await.unwrap();
        let trailers = collected.trailers().cloned();
        (status, headers, collected.to_bytes(), trailers)
    }

    fn sse_types(body: &[u8]) -> Vec<String> {
        String::from_utf8_lossy(body)
            .split("\n\n")
            .filter_map(|frame| {
                frame.lines().find_map(|line| {
                    line.strip_prefix("event:")
                        .map(|name| name.trim().to_string())
                })
            })
            .filter(|name| !name.is_empty())
            .collect()
    }

    fn sse_payloads(body: &[u8]) -> Vec<Value> {
        String::from_utf8_lossy(body)
            .split("\n\n")
            .filter_map(|frame| {
                let data: String = frame
                    .lines()
                    .filter_map(|line| line.strip_prefix("data:"))
                    .map(str::trim)
                    .collect::<Vec<_>>()
                    .join("\n");
                if data.is_empty() {
                    None
                } else {
                    serde_json::from_str(&data).ok()
                }
            })
            .collect()
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn simulated_hello_emits_message_start_to_stop() {
        let env = build_cli_env(1).await;
        let (status, headers, body, _) = call(
            env.state,
            envelope("hello stream", true, "verified", Vec::new()),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(
            headers
                .get("x-kin-terminal-state")
                .and_then(|value| value.to_str().ok()),
            Some("verified")
        );
        let types = sse_types(&body);
        assert_eq!(types.first().map(String::as_str), Some("message_start"));
        assert_eq!(types.last().map(String::as_str), Some("message_stop"));
        let text = String::from_utf8_lossy(&body);
        assert!(text.contains("hello stream"), "{text}");
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn simulated_tool_use_then_tool_result_continues() {
        let env = build_cli_env(1).await;
        let (status, headers, body, _) = call(
            env.state.clone(),
            envelope("[use_tool:get_weather]", true, "verified", Vec::new()),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(
            headers
                .get("x-kin-stop-reason")
                .and_then(|value| value.to_str().ok()),
            Some("tool_use")
        );
        let tool = sse_payloads(&body).into_iter().find_map(|event| {
            let block = event.get("content_block")?;
            if block.get("type").and_then(Value::as_str) == Some("tool_use") {
                Some((
                    block.get("id")?.as_str()?.to_string(),
                    block.get("name")?.as_str()?.to_string(),
                ))
            } else {
                None
            }
        });
        let (tool_id, name) = tool.expect("tool_use block");
        assert_eq!(name, "get_weather");

        let (status, headers, body, _) = call(
            env.state,
            envelope(
                "continue",
                true,
                "verified",
                vec![json!({
                    "role": "user",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": tool_id,
                        "content": "ok"
                    }]
                })],
            ),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{}", String::from_utf8_lossy(&body));
        assert_eq!(
            headers
                .get("x-kin-stop-reason")
                .and_then(|value| value.to_str().ok()),
            Some("end_turn")
        );
        let types = sse_types(&body);
        assert_eq!(types.first().map(String::as_str), Some("message_start"));
        assert_eq!(types.last().map(String::as_str), Some("message_stop"));
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn simulated_job_error_recycles_the_slot() {
        let env = build_cli_env(1).await;
        let (status, _, body, _) = call(
            env.state.clone(),
            envelope("[job_error]", true, "verified", Vec::new()),
        )
        .await;
        assert_eq!(
            status,
            StatusCode::BAD_GATEWAY,
            "{}",
            String::from_utf8_lossy(&body)
        );
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"]["code"], "upstream_terminal_invalid");

        let (status, headers, body, _) = call(
            env.state,
            envelope("hello after error", true, "verified", Vec::new()),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{}", String::from_utf8_lossy(&body));
        assert_eq!(
            headers
                .get("x-kin-terminal-state")
                .and_then(|value| value.to_str().ok()),
            Some("verified")
        );
        let types = sse_types(&body);
        assert_eq!(types.first().map(String::as_str), Some("message_start"));
        assert_eq!(types.last().map(String::as_str), Some("message_stop"));
        assert!(
            String::from_utf8_lossy(&body).contains("hello after error"),
            "{}",
            String::from_utf8_lossy(&body)
        );
    }

    #[tokio::test]
    async fn sse_byte_stream_injects_message_stop_when_job_done_skips_it() {
        let (tx, rx) = crate::provider::job_event_channel();
        let mut stream = sse_byte_stream(rx);
        tx.send(Ok(StreamItem::Event(json!({ "type": "message_start" }))))
            .await
            .unwrap();
        tx.send(Ok(StreamItem::Finished(crate::model::MessageResponse {
            id: "msg_test".into(),
            r#type: "message",
            role: "assistant",
            model: "claude-haiku-4-5-20251001".into(),
            content: vec![],
            stop_reason: crate::model::StopReason::EndTurn,
            usage: crate::model::Usage::default(),
        })))
        .await
        .unwrap();
        drop(tx);

        use futures_util::StreamExt;
        let first = stream.next().await.unwrap().unwrap();
        let second = stream.next().await.unwrap().unwrap();
        let end = stream.next().await;
        let first = String::from_utf8_lossy(&first);
        let second = String::from_utf8_lossy(&second);
        assert!(first.contains("message_start"), "{first}");
        assert!(second.contains("message_stop"), "{second}");
        assert!(end.is_none());
    }


    #[test]
    fn frozen_container_paths_are_loopback_cli_and_python_bridge() {
        assert_eq!(CONTAINER_CLAUDE_BIN, "/opt/kin/cli-node");
        assert_eq!(CONTAINER_HTTP_TO_SOCKS, "/opt/kin/http_to_socks.py");
        assert_eq!(DEFAULT_CONNECT_BRIDGE, "http://127.0.0.1:18080");
        assert_eq!(
            connect_bridge_addr(DEFAULT_CONNECT_BRIDGE).as_deref(),
            Some(DEFAULT_CONNECT_BRIDGE_ADDR)
        );
        assert_eq!(
            connect_bridge_addr("socks5h://127.0.0.1:10808"),
            Some("127.0.0.1:10808".into())
        );
        let manifest = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let script = [
            manifest.join("../../scripts/http_to_socks.py"),
            manifest.join("../scripts/http_to_socks.py"),
        ]
        .into_iter()
        .find(|path| path.exists());
        assert!(
            script.is_some(),
            "missing http_to_socks.py next to the crate"
        );
    }
}
