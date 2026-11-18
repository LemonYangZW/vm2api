//! Unix socket 内部网关。
//!
//! 契约与控制面 `go-worker-client.mjs` / `rust-kernel-client.mjs` 一致：
//!
//! | 路径 | 方法 | 说明 |
//! | --- | --- | --- |
//! | `/internal/health` | GET | 健康（`ready_slots` / `cli_pid` / `healthy`） |
//! | `/internal/v1/messages` | POST | 信封 `{body,headers,stream,...}` → 槽位 hop |
//! | `/internal/v1/cancel` | POST | `{request_id}` → 释放该会话槽位 |
//! | `/internal/v1/telemetry/events` | POST | 遥测落点（M1 仅应答） |
//! | `/v1/models` | GET | 模型目录 |
//! | `/healthz` `/health` | GET | 容器/LB 探针 |
//!
//! 认证：`x-kin-internal-token`（兼容旧名 `x-internal-token`），与 token 文件比对；
//! 未配置 token 文件时不校验（本机调试）。

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use serde_json::{json, Value};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

/// 传输流：Unix 平台走 unix socket，其余平台走本机 TCP（离线联调）。
#[cfg(unix)]
pub type Stream = tokio::net::UnixStream;
#[cfg(not(unix))]
pub type Stream = tokio::net::TcpStream;

use crate::ndjson::{Message, StdinFrame, StdoutFrame};
#[cfg(unix)]
use tokio::net::UnixListener;
use crate::http::client::{read_sse_into, UpstreamClient};
use crate::http::wire;
use crate::protocol::{billing, cache, identity, preflight, system};
use crate::slot::CragHost;
use crate::VERSION;

const MAX_HEADER_BYTES: usize = 64 * 1024;
const MAX_BODY_BYTES: usize = 16 * 1024 * 1024;
/// 单 hop 最长等待（现网 180s）。
pub(crate) const HOP_TIMEOUT: Duration = Duration::from_secs(180);
/// SSE 保活间隔。
const KEEPALIVE_INTERVAL: Duration = Duration::from_secs(15);

/// 额度探测配置。
#[derive(Clone)]
pub struct UsageConfig {
    pub base: String,
    pub credential_path: String,
    pub ca: Option<PathBuf>,
}

/// 网关共享状态。
pub struct GatewayState {
    /// 槽位 CLI 宿主；直连上游时可为 `None`（不起 CLI）。
    pub host: Option<Arc<CragHost>>,
    pub token: Option<String>,
    pub dataplane: String,
    /// 有值即走自控 wire（crag v2 原生形态），None 则交给槽位 CLI。
    pub upstream: Option<Arc<UpstreamClient>>,
    /// 有值即走原生 CLI 通路（内核不拼请求，官方 CLI 自己发上游）。
    pub native: Option<Arc<crate::native::Pool>>,
    /// 声明的槽位数（直连模式下作为 `ready_slots` 上报）。
    pub slots: u32,
    /// 在途 hop 数（两种通路通用；健康里的 `active`）。
    pub inflight: Arc<std::sync::atomic::AtomicUsize>,
    /// TUI 通路（PTY 驱动官方 CLI）；`None` = 不走 TUI。
    pub tui: Option<Arc<crate::tui::TuiPool>>,
    /// 额度探测配置（`None` = 不支持，端点回 501）。
    pub usage: Option<Arc<UsageConfig>>,
    /// 额度结果缓存（60 s），避免面板轮询把探测打成高频出站。
    pub usage_cache: Arc<tokio::sync::Mutex<Option<(std::time::Instant, u16, Value)>>>,
}

impl GatewayState {
    /// 槽位模式（无自控 wire）。
    pub fn slot_only(host: Arc<CragHost>, token: Option<String>, dataplane: &str) -> Self {
        let slots = host.slots();
        Self {
            host: Some(host),
            token,
            dataplane: dataplane.to_string(),
            upstream: None,
            native: None,
            slots,
            inflight: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
            tui: None,
            usage: None,
            usage_cache: Arc::new(tokio::sync::Mutex::new(None)),
        }
    }

    /// 直连模式（自控 h2/TLS，不起 CLI）。
    pub fn direct(upstream: Arc<UpstreamClient>, token: Option<String>, dataplane: &str, slots: u32) -> Self {
        Self {
            host: None,
            token,
            dataplane: dataplane.to_string(),
            upstream: Some(upstream),
            native: None,
            slots: slots.clamp(1, 20),
            inflight: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
            tui: None,
            usage: None,
            usage_cache: Arc::new(tokio::sync::Mutex::new(None)),
        }
    }

    /// 原生 CLI 模式：请求交给官方 `claude` 自己发。
    pub fn native(pool: Arc<crate::native::Pool>, token: Option<String>, dataplane: &str, slots: u32) -> Self {
        Self {
            host: None,
            token,
            dataplane: dataplane.to_string(),
            upstream: None,
            native: Some(pool),
            slots: slots.clamp(1, 20),
            inflight: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
            tui: None,
            usage: None,
            usage_cache: Arc::new(tokio::sync::Mutex::new(None)),
        }
    }

    /// TUI 通路：不起槽位 CLI，只有 PTY 会话池。
    pub fn tui(pool: Arc<crate::tui::TuiPool>, token: Option<String>, dataplane: &str, slots: u32) -> Self {
        Self {
            host: None,
            token,
            dataplane: dataplane.to_string(),
            upstream: None,
            native: None,
            tui: Some(pool),
            slots: slots.clamp(1, 20),
            inflight: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
            usage: None,
            usage_cache: Arc::new(tokio::sync::Mutex::new(None)),
        }
    }

    /// 构造额度探测配置（native/tui 通路用）。
    pub fn usage_config(base: String, credential_path: String, ca: Option<PathBuf>) -> UsageConfig {
        UsageConfig { base, credential_path, ca }
    }

    /// 挂上 native 池（TUI 模式下只用作工具回调/park 的载体，不 spawn 进程）。
    pub fn with_native(mut self, pool: Arc<crate::native::Pool>) -> Self {
        self.native = Some(pool);
        self
    }

    /// 挂上 TUI 池（PTY 通路）。
    pub fn with_tui(mut self, pool: Arc<crate::tui::TuiPool>) -> Self {
        self.tui = Some(pool);
        self
    }

    /// 挂上额度探测配置。
    pub fn with_usage(mut self, usage: UsageConfig) -> Self {
        self.usage = Some(Arc::new(usage));
        self
    }

    /// 关闭内部资源。
    pub async fn close(&self) {
        if let Some(host) = &self.host {
            host.close().await;
        }
    }
}

impl GatewayState {
    /// 健康体；字段名与控制面 `workerHealth` 读取的一致。
    pub fn health(&self) -> Value {
        let (alive, ready, closed, slots, pid) = match &self.host {
            Some(host) => {
                let alive = host.alive();
                (
                    alive,
                    host.ready_slots(),
                    if alive { 0 } else { host.slots() },
                    host.slots(),
                    host.pid(),
                )
            }
            None => (true, self.slots, 0, self.slots, None),
        };
        // native 通路：会话池里的 live 进程即「cli_pid」。
        let (pid, sessions, pids) = match (&self.native, pid) {
            (Some(pool), _) => {
                let pids = pool.pids_now();
                (pids.first().copied(), pool.stats_now(), pids)
            }
            (None, pid) => (pid, (0usize, 0usize), Vec::new()),
        };
        json!({
            "ok": alive,
            "engine": "rust",
            // 面板（CRAG 3.1.4）会把 session_slots 写进配置并核对健康回报。
            "session_slots": self
                .tui
                .as_ref()
                .map(|pool| pool.slots())
                .or_else(|| self.native.as_ref().map(|pool| pool.slots()))
                .unwrap_or(self.slots as usize),
            "dataplane": self.dataplane,
            "runtime_variant": "crag-v2",
            // TUI 模式也会建 native 池（MCP 桥要用），所以必须优先报 tui，
            // 否则面板会看到 hop_mode=native 而实际走的是 PTY。
            "hop_mode": if self.tui.is_some() {
                "tui"
            } else if self.native.is_some() {
                "native"
            } else if self.upstream.is_some() {
                "direct"
            } else {
                "slot"
            },
            "worker_version": VERSION,
            // 1.4.139 起面板认这个字段：进程池按需 spawn，空闲时 cli_pid=0 也算健康
            // （rust-kernel-supervisor.mjs: cli_pid > 0 || execution_mode === 'v2_process_pool'）。
            // 不报的话面板会认为内核"没起来"，反复重启槽位。
            "execution_mode": if self.native.is_some() { "v2_process_pool" } else { "single_process" },
            "healthy": alive,
            "ready_slots": ready,
            "closed_slots": closed,
            "slots_per_worker": slots,
            "cli_pid": pid,
            "recovering": false,
            "provider": if self.tui.is_some() || self.native.is_some() { "local_cli" } else { "http" },
            "active": self.inflight.load(std::sync::atomic::Ordering::Relaxed),
            "waiting": sessions
                .0
                .saturating_sub(self.inflight.load(std::sync::atomic::Ordering::Relaxed)),
            "queued": sessions.1,
            "pids": pids,
            "cli_restarts": 0,
            "telemetry_ready": false,
            "telemetry": Value::Null,
            "vm_telemetry": Value::Null,
        })
    }
}

/// 启动 unix socket 服务；返回实际绑定的路径。
#[cfg(unix)]
pub async fn serve(path: impl AsRef<Path>, state: Arc<GatewayState>) -> std::io::Result<PathBuf> {
    let path = path.as_ref().to_path_buf();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    // 旧 socket 文件（含上次崩溃残留）必须先移除。
    match std::fs::remove_file(&path) {
        Ok(()) => {}
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => return Err(error),
    }
    let listener = UnixListener::bind(&path)?;
    let bound = path.clone();
    tokio::spawn(async move {
        loop {
            match listener.accept().await {
                Ok((stream, _)) => {
                    let state = Arc::clone(&state);
                    tokio::spawn(async move {
                        if let Err(error) = handle_conn(stream, state).await {
                            eprintln!("[crag] connection error: {error}");
                        }
                    });
                }
                Err(error) => {
                    eprintln!("[crag] accept error: {error}");
                    tokio::time::sleep(Duration::from_millis(50)).await;
                }
            }
        }
    });
    Ok(bound)
}

/// 额外监听一个 TCP 端口，把连接**字节级桥接**到内核自己的 UDS。
///
/// 为什么这样而不是复用 handler：`Stream` 在 Unix 下是 `UnixStream`，
/// handler 的整条签名都按它写死了。桥接只做 `copy_bidirectional`，
/// 不用改动任何请求处理逻辑，也不引入平台条件编译。
pub async fn serve_tcp(
    addr: &str,
    socket: std::path::PathBuf,
) -> std::io::Result<std::net::SocketAddr> {
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let bound = listener.local_addr()?;
    tokio::spawn(async move {
        loop {
            let Ok((mut tcp, _)) = listener.accept().await else {
                tokio::time::sleep(Duration::from_millis(50)).await;
                continue;
            };
            let socket = socket.clone();
            tokio::spawn(async move {
                match tokio::net::UnixStream::connect(&socket).await {
                    Ok(mut unix) => {
                        let _ = tokio::io::copy_bidirectional(&mut tcp, &mut unix).await;
                    }
                    Err(error) => eprintln!("[crag] tcp bridge: {error}"),
                }
            });
        }
    });
    Ok(bound)
}

/// 非 Unix 平台：同名接口走本机 TCP（`KIN_KERNEL_TCP`，默认 `127.0.0.1:0`），
/// 返回实际监听地址，便于离线联调。
#[cfg(not(unix))]
pub async fn serve(_path: impl AsRef<Path>, state: Arc<GatewayState>) -> std::io::Result<PathBuf> {
    let addr = std::env::var("KIN_KERNEL_TCP").unwrap_or_else(|_| "127.0.0.1:0".to_string());
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    let bound = listener.local_addr()?;
    tokio::spawn(async move {
        loop {
            match listener.accept().await {
                Ok((stream, _)) => {
                    let state = Arc::clone(&state);
                    tokio::spawn(async move {
                        if let Err(error) = handle_conn(stream, state).await {
                            eprintln!("[crag] connection error: {error}");
                        }
                    });
                }
                Err(error) => {
                    eprintln!("[crag] accept error: {error}");
                    tokio::time::sleep(Duration::from_millis(50)).await;
                }
            }
        }
    });
    Ok(PathBuf::from(bound.to_string()))
}

struct Request {
    method: String,
    path: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
}

async fn read_request(stream: &mut Stream) -> std::io::Result<Option<Request>> {
    let mut buf = Vec::with_capacity(8 * 1024);
    let mut chunk = [0u8; 8192];
    let header_end = loop {
        if let Some(pos) = find_subsequence(&buf, b"\r\n\r\n") {
            break pos + 4;
        }
        if buf.len() > MAX_HEADER_BYTES {
            return Err(std::io::Error::other("header too large"));
        }
        let n = stream.read(&mut chunk).await?;
        if n == 0 {
            return Ok(None);
        }
        buf.extend_from_slice(&chunk[..n]);
    };

    let head = String::from_utf8_lossy(&buf[..header_end]).to_string();
    let mut lines = head.split("\r\n");
    let request_line = lines.next().unwrap_or_default();
    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or_default().to_string();
    let path = parts.next().unwrap_or("/").to_string();
    let mut headers = HashMap::new();
    for line in lines {
        if line.is_empty() {
            continue;
        }
        if let Some((key, value)) = line.split_once(':') {
            headers.insert(key.trim().to_ascii_lowercase(), value.trim().to_string());
        }
    }

    let length: usize = headers
        .get("content-length")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);
    if length > MAX_BODY_BYTES {
        return Err(std::io::Error::other("body too large"));
    }
    let mut body = buf[header_end..].to_vec();
    while body.len() < length {
        let n = stream.read(&mut chunk).await?;
        if n == 0 {
            break;
        }
        body.extend_from_slice(&chunk[..n]);
    }
    body.truncate(length);
    Ok(Some(Request {
        method,
        path,
        headers,
        body,
    }))
}

fn find_subsequence(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}

async fn respond(
    stream: &mut Stream,
    status: u16,
    content_type: &str,
    body: &[u8],
    extra: &[(&str, &str)],
) -> std::io::Result<()> {
    let mut head = format!(
        "HTTP/1.1 {status} {}\r\ncontent-type: {content_type}\r\ncontent-length: {}\r\n",
        reason(status),
        body.len()
    );
    for (key, value) in extra {
        head.push_str(&format!("{key}: {value}\r\n"));
    }
    head.push_str("connection: close\r\n\r\n");
    stream.write_all(head.as_bytes()).await?;
    stream.write_all(body).await?;
    stream.flush().await?;
    Ok(())
}

fn reason(status: u16) -> &'static str {
    match status {
        200 => "OK",
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        413 => "Payload Too Large",
        500 => "Internal Server Error",
        502 => "Bad Gateway",
        _ => "Unknown",
    }
}

async fn handle_conn(mut stream: Stream, state: Arc<GatewayState>) -> std::io::Result<()> {
    let Some(request) = read_request(&mut stream).await? else {
        return Ok(());
    };
    let path = request.path.split('?').next().unwrap_or("/").to_string();

    if !authorized(&state, &request.headers) {
        return respond(
            &mut stream,
            401,
            "application/json",
            br#"{"ok":false,"error":"unauthorized"}"#,
            &[],
        )
        .await;
    }

    match (request.method.as_str(), path.as_str()) {
        ("GET", "/internal/health") | ("GET", "/healthz") | ("GET", "/health") => {
            let body = serde_json::to_vec(&state.health()).unwrap_or_default();
            respond(&mut stream, 200, "application/json", &body, &[]).await
        }
        ("GET", "/v1/models") => {
            let data: Vec<Value> = crate::protocol::models::catalog()
                .into_iter()
                .map(|id| {
                    let display = crate::protocol::models::by_id(id)
                        .map(|entry| entry.display_name)
                        .unwrap_or(id);
                    json!({"type": "model", "id": id, "display_name": display})
                })
                .collect();
            let body = serde_json::to_vec(&json!({"data": data, "has_more": false})).unwrap_or_default();
            respond(&mut stream, 200, "application/json", &body, &[]).await
        }
        ("POST", "/internal/v1/messages") | ("POST", "/v1/messages") => {
            // 诊断开关：CRAG_DUMP=1 时把客户端原始请求（头 + 体）落盘一份。
            // 用来比对"为什么客户端被中转判为蒸馏、而我们同样的模型同样的链路却通过"。
            if std::path::Path::new("/tmp/crag-dump-on").exists()
                || std::env::var("CRAG_DUMP").map(|v| v == "1").unwrap_or(false)
            {
                let stamp = crate::native::now_ms();
                let _ = std::fs::write(format!("/tmp/crag-req-{stamp}.json"), &request.body);
                let heads = serde_json::to_string(&request.headers).unwrap_or_default();
                let _ = std::fs::write(format!("/tmp/crag-hdr-{stamp}.json"), heads);
            }
            hop(stream, state, request.body).await
        }
        ("POST", "/internal/v1/cancel") => {
            let value: Value = serde_json::from_slice(&request.body).unwrap_or(Value::Null);
            let id = value
                .get("request_id")
                .or_else(|| value.get("session_id"))
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string();
            if let Some(host) = state.host.as_ref() {
                host.release(&id);
            }
            if let Some(pool) = state.native.as_ref() {
                pool.cancel(&id).await;
            }
            respond(&mut stream, 200, "application/json", br#"{"ok":true}"#, &[]).await
        }
        ("GET", "/internal/identity") => {
            // 只回本地身份：没有任何字段会被转发给上游。
            let payload = json!({
                "ok": true,
                "identity": {
                    "runtime_kind": "docker",
                    "dataplane": state.dataplane,
                    "worker_version": VERSION,
                    "hop_mode": if state.tui.is_some() { "tui" } else if state.native.is_some() { "native" } else if state.upstream.is_some() { "direct" } else { "slot" },
                    "device_id": identity::Identity::load().device_id_hint(),
                    "sessions": state.native.as_ref().map(|p| p.stats_now()).unwrap_or((0, 0)),
                }
            });
            respond(
                &mut stream,
                200,
                "application/json",
                &serde_json::to_vec(&payload).unwrap_or_default(),
                &[],
            )
            .await
        }
        ("GET", "/internal/oauth/usage") => {
            // 与官方 CLI 的 `/usage` 同形的一次探测（不含任何推理字段）；
            // 结果缓存 60 s，避免面板轮询变成高频出站。
            let Some(usage) = state.usage.clone() else {
                let payload = json!({
                    "error": {
                        "code": "usage_unsupported",
                        "message": "usage probing is disabled on this transport",
                    }
                });
                return respond(
                    &mut stream,
                    501,
                    "application/json",
                    &serde_json::to_vec(&payload).unwrap_or_default(),
                    &[],
                )
                .await;
            };
            {
                let cache = state.usage_cache.lock().await;
                if let Some((at, status, body)) = cache.as_ref() {
                    if at.elapsed() < Duration::from_secs(60) {
                        return respond(
                            &mut stream,
                            *status,
                            "application/json",
                            &serde_json::to_vec(body).unwrap_or_default(),
                            &[],
                        )
                        .await;
                    }
                }
            }
            let store = crate::credential::Store::new(usage.credential_path.clone());
            let credential = store.load().map(|(value, _)| value).ok();
            let Some(credential) = credential.filter(|c| !c.access_token.trim().is_empty()) else {
                let payload = json!({
                    "error": {"code": "usage_no_credential", "message": "no OAuth credential in this slot"}
                });
                return respond(
                    &mut stream,
                    404,
                    "application/json",
                    &serde_json::to_vec(&payload).unwrap_or_default(),
                    &[],
                )
                .await;
            };
            let result = crate::usage::fetch(&usage.base, &credential.access_token, usage.ca.as_deref()).await;
            let (status, body) = match result {
                Ok(probe) => (probe.status, probe.body),
                Err(error) => (
                    502,
                    json!({"error": {"code": "usage_probe_failed", "message": error.to_string()}}),
                ),
            };
            *state.usage_cache.lock().await = Some((std::time::Instant::now(), status, body.clone()));
            respond(
                &mut stream,
                status,
                "application/json",
                &serde_json::to_vec(&body).unwrap_or_default(),
                &[],
            )
            .await
        }
        ("POST", "/internal/forward") => {
            let payload = json!({"error": {"code": "forward_unsupported", "message": "generic forwarding is not implemented by this kernel"}});
            respond(
                &mut stream,
                501,
                "application/json",
                &serde_json::to_vec(&payload).unwrap_or_default(),
                &[],
            )
            .await
        }
        ("POST", path) if path.starts_with("/internal/v1/codex") => {
            let payload = json!({"error": {"code": "codex_unsupported", "message": "this kernel serves the anthropic dataplane only"}});
            respond(
                &mut stream,
                404,
                "application/json",
                &serde_json::to_vec(&payload).unwrap_or_default(),
                &[],
            )
            .await
        }
        ("POST", "/internal/v1/telemetry/events") => {
            respond(&mut stream, 200, "application/json", br#"{"ok":true}"#, &[]).await
        }
        ("POST", "/internal/v1/telemetry/apply") => {
            let wanted = serde_json::from_slice::<Value>(&request.body)
                .ok()
                .and_then(|v| v.get("enabled").and_then(|e| e.as_bool()))
                .unwrap_or(true);
            let (status, payload) = telemetry_apply_response(wanted);
            let body = serde_json::to_vec(&payload).unwrap_or_default();
            respond(&mut stream, status, "application/json", &body, &[]).await
        }
        (method, _) if method != "GET" && method != "POST" => {
            respond(&mut stream, 405, "application/json", br#"{"ok":false}"#, &[]).await
        }
        _ => respond(&mut stream, 404, "application/json", br#"{"ok":false,"error":"not_found"}"#, &[]).await,
    }
}

/// 上游 1.4.133 起的遥测契约：确认原生遥测启动策略。
///
/// 我们**不干预官方行为**——要求开启就如实回报"已生效"（动作在官方 CLI 自己那边）；
/// 要求关闭则明确拒绝，因为"关掉官方遥测"本身才是可识别异常。
fn telemetry_apply_response(enabled: bool) -> (u16, Value) {
    if enabled {
        (
            200,
            json!({
                "ok": true,
                "applied": true,
                "enabled": true,
                "scope": "native_claude_launch",
                "upload_confirmed": false,
            }),
        )
    } else {
        (
            409,
            json!({"ok": false, "error": {"type": "telemetry_native_settings_blocked"}}),
        )
    }
}

fn authorized(state: &GatewayState, headers: &HashMap<String, String>) -> bool {
    // 内部调用用 x-kin-internal-token；标准 Anthropic 客户端只会带 x-api-key 或
    // Authorization: Bearer，故把它们当作同一凭据的别名，直连时也有可用形式。
    let Some(expected) = state.token.as_deref() else {
        return true;
    };
    let bearer = headers
        .get("authorization")
        .and_then(|value| value.strip_prefix("Bearer ").or_else(|| value.strip_prefix("bearer ")));
    headers
        .get("x-kin-internal-token")
        .map(String::as_str)
        .or_else(|| headers.get("x-internal-token").map(String::as_str))
        .or_else(|| headers.get("x-api-key").map(String::as_str))
        .or(bearer)
        .is_some_and(|value| value == expected)
}

/// 信封 → 槽位 hop。
async fn hop(mut stream: Stream, state: Arc<GatewayState>, raw: Vec<u8>) -> std::io::Result<()> {
    let envelope: Value = match serde_json::from_slice(&raw) {
        Ok(value) => value,
        Err(error) => {
            return respond(
                &mut stream,
                400,
                "application/json",
                serde_json::to_string(&error_body("invalid_request_error", &format!("bad envelope: {error}")))
                    .unwrap_or_default()
                    .as_bytes(),
                &[],
            )
            .await
        }
    };
    if let Some(inner) = envelope.get("body").filter(|v| v.is_object()) {
        return forward(stream, state, &envelope, inner).await;
    }
    // 兼容旧调用方直接 POST /v1/messages 的裸请求体。
    forward(stream, state, &Value::Null, &envelope).await
}

/// 在途计数守卫：任何提前 return 都会递减。
struct Inflight(Arc<std::sync::atomic::AtomicUsize>);

impl Inflight {
    fn new(counter: Arc<std::sync::atomic::AtomicUsize>) -> Self {
        counter.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        Self(counter)
    }
}

impl Drop for Inflight {
    fn drop(&mut self) {
        self.0.fetch_sub(1, std::sync::atomic::Ordering::Relaxed);
    }
}

async fn forward(
    stream: Stream,
    state: Arc<GatewayState>,
    envelope: &Value,
    body: &Value,
) -> std::io::Result<()> {
    let _inflight = Inflight::new(Arc::clone(&state.inflight));
    if let Some(pool) = state.tui.clone() {
        return forward_tui(stream, pool, state.native.clone(), envelope, body).await;
    }
    if let Some(pool) = state.native.clone() {
        return forward_native(stream, pool, envelope, body).await;
    }
    if let Some(upstream) = state.upstream.clone() {
        return forward_upstream(stream, state, upstream, envelope, body).await;
    }
    forward_slot(stream, state, envelope, body).await
}

/// TUI 通路：PTY 驱动官方 CLI，出站请求与真实安装同形
/// （`cc_entrypoint=cli` + 完整 `safeguards`）。内核只负责喂 prompt 与回投事件。
async fn forward_tui(
    mut stream: Stream,
    pool: Arc<crate::tui::TuiPool>,
    parker: Option<Arc<crate::native::Pool>>,
    envelope: &Value,
    body: &Value,
) -> std::io::Result<()> {
    let streaming = envelope
        .get("stream")
        .and_then(|v| v.as_bool())
        .or_else(|| body.get("stream").and_then(|v| v.as_bool()))
        .unwrap_or(false);
    let key = session_key(envelope, body);
    let model = body.get("model").and_then(|v| v.as_str());
    // 工具回调与 park 由「只做回调的 native 池」承载（TUI 不 spawn 它，仅用其 pending 表）。
    let results = crate::native::tool_results(body);

    // 续跳：解开 park 的调用，接着读同一个 tap 流。
    if !results.is_empty() {
        let Some(parker) = parker.clone() else {
            return respond(
                &mut stream,
                501,
                "application/json",
                serde_json::to_string(&error_body("api_error", "tool continuation needs the callback hub"))
                    .unwrap_or_default()
                    .as_bytes(),
                &[("x-terminal-state", "error")],
            )
            .await;
        };
        // 必须在 resolve 之前记录，否则 CC 很快写出答案时基线已包含它。
        let answer_baseline = match pool.transcript_for(&key).await {
            Some(file) => crate::tui::count_text_answers(&file),
            None => 0,
        };
        eprintln!("[crag-mcp] resolve start at {}", crate::native::now_ms());
        let (resolved, foreign) = parker.resolve(&key, &results).await;
        eprintln!("[crag-mcp] resolve done at {} resolved={resolved}", crate::native::now_ms());
        if resolved == 0 && foreign > 0 {
            return respond(
                &mut stream,
                409,
                "application/json",
                serde_json::to_string(&error_body(
                    "invalid_request_error",
                    "tool_result belongs to another session (continuation dispatched to the wrong slot)",
                ))
                .unwrap_or_default()
                .as_bytes(),
                &[("x-terminal-state", "error")],
            )
            .await;
        }
        if resolved == 0 {
            return respond(
                &mut stream,
                410,
                "application/json",
                serde_json::to_string(&error_body("invalid_request_error", "unknown tool_result"))
                    .unwrap_or_default()
                    .as_bytes(),
                &[("x-terminal-state", "error")],
            )
            .await;
        }
        // 续跳后 CC 自己会跑完（工具结果已通过桥回给它），文本只能从 transcript 取。
        // 这里不能走 resume：那一轮还没结束，会话仍处于 busy。
        let transcript = pool.transcript_for(&key).await;
        let answer = match transcript.as_ref() {
            Some(file) => {
                crate::tui::answer_after(file, answer_baseline, crate::gateway::HOP_TIMEOUT).await
            }
            None => None,
        };
        if let Some(message) = answer {
            // 这条分支是独立响应路径，必须先写 SSE 头再发事件。
            begin_sse(&mut stream).await?;
            emit_transcript_message(&mut stream, &message).await;
            return Ok(());
        }
        let payload = json!({"type": "error", "error": {"type": "api_error", "code": "tui_resume_timeout", "message": "tool continuation produced no text"}});
        return respond(
            &mut stream,
            502,
            "application/json",
            &serde_json::to_vec(&payload).unwrap_or_default(),
            &[("x-terminal-state", "error")],
        )
        .await;
    }

    // TUI 也走同一条渲染：CLI 每轮看到的是自包含的完整 prompt（含历史）。
    let Some(prompt) = crate::native::render_initial_prompt(body) else {
        return respond(
            &mut stream,
            400,
            "application/json",
            serde_json::to_string(&error_body("invalid_request_error", "messages 里没有可投递的 user 内容"))
                .unwrap_or_default()
                .as_bytes(),
            &[],
        )
        .await;
    };

    let system = crate::native::system_text(body);
    let mut extra: Vec<String> = Vec::new();
    let tools = crate::native::mcp_tools(body.get("tools").unwrap_or(&Value::Null));
    if !tools.is_empty() {
        let Some(base) = parker.as_ref().and_then(|pool| pool.callback_base()) else {
            return respond(
                &mut stream,
                503,
                "application/json",
                serde_json::to_string(&error_body("api_error", "MCP callback server unavailable"))
                    .unwrap_or_default()
                    .as_bytes(),
                &[("x-terminal-state", "error")],
            )
            .await;
        };
        let config_path = std::env::temp_dir().join(format!("crag-tui-mcp-{key}.json"));
        let bridge_path = std::env::temp_dir().join(format!("crag-tui-mcp-{key}-bridge.json"));
        let (for_cli, for_bridge) = crate::native::mcp_configs(
            &crate::native::Pool::exe(),
            &bridge_path,
            &format!("{base}/{key}"),
            tools,
        );
        let wrote = std::fs::write(&config_path, serde_json::to_vec(&for_cli).unwrap_or_default())
            .and_then(|_| {
                std::fs::write(&bridge_path, serde_json::to_vec(&for_bridge).unwrap_or_default())
            });
        if wrote.is_err() {
            return respond(
                &mut stream,
                500,
                "application/json",
                serde_json::to_string(&error_body("api_error", "mcp.json write failed"))
                    .unwrap_or_default()
                    .as_bytes(),
                &[("x-terminal-state", "error")],
            )
            .await;
        }
        extra = vec![
            "--strict-mcp-config".into(),
            "--mcp-config".into(),
            config_path.to_string_lossy().to_string(),
        ];
    }

    // 每个 CLI 进程用全新会话 id：`--session-id` 是 CLI 自己的持久化键，
    // 复用旧 id 会直接 `Session ID ... is already in use` 退出（实测）。
    let cli_session = identity::new_uuid();
    let mut args = crate::tui::tui_args(&cli_session, model, system.as_deref(), false);
    args.extend(extra);
    let mut rx = match pool.hop(&key, args, &prompt).await {
        Ok(rx) => rx,
        Err(error) => {
            let payload = json!({"type": "error", "error": {"type": "api_error", "code": "tui_hop_failed", "message": error}});
            return respond(
                &mut stream,
                502,
                "application/json",
                &serde_json::to_vec(&payload).unwrap_or_default(),
                &[("x-terminal-state", "error")],
            )
            .await;
        }
    };

    stream_tui(stream, rx, parker, key, body, model, streaming, Some(Arc::clone(&pool))).await
}

/// TUI 的事件泵：读 tap 事件 → SSE；结束时若有被 park 的工具调用，
/// 就合成一条只含 `tool_use` 的消息结束本跳（与 native 通路同一套语义）。

/// 把一条 transcript 里的 assistant message 合成为完整 SSE 序列。
async fn emit_transcript_message(stream: &mut Stream, message: &Value) {
    let _ = write_sse_raw(stream, "message_start", &json!({"type": "message_start", "message": {
        "id": message.get("id").cloned().unwrap_or(json!("msg_tui")),
        "type": "message", "role": "assistant",
        "model": message.get("model").cloned().unwrap_or(json!("")),
        "content": [], "stop_reason": Value::Null,
        "usage": message.get("usage").cloned().unwrap_or(json!({}))}}).to_string()).await;
    let blocks = message.get("content").and_then(|v| v.as_array()).cloned().unwrap_or_default();
    for (index, block) in blocks.iter().enumerate() {
        let _ = write_sse_raw(stream, "content_block_start", &json!({"type": "content_block_start", "index": index, "content_block": {"type": "text", "text": ""}}).to_string()).await;
        if let Some(text) = block.get("text").and_then(|v| v.as_str()) {
            let _ = write_sse_raw(stream, "content_block_delta", &json!({"type": "content_block_delta", "index": index, "delta": {"type": "text_delta", "text": text}}).to_string()).await;
        }
        let _ = write_sse_raw(stream, "content_block_stop", &json!({"type": "content_block_stop", "index": index}).to_string()).await;
    }
    let _ = write_sse_raw(stream, "message_delta", &json!({"type": "message_delta",
        "delta": {"stop_reason": message.get("stop_reason").cloned().unwrap_or(json!("end_turn"))},
        "usage": message.get("usage").cloned().unwrap_or(json!({}))}).to_string()).await;
    let _ = write_sse_raw(stream, "message_stop", &json!({"type": "message_stop"}).to_string()).await;
}

async fn stream_tui(
    mut stream: Stream,
    mut rx: tokio::sync::mpsc::UnboundedReceiver<crate::tui::TapRow>,
    parker: Option<Arc<crate::native::Pool>>,
    key: String,
    body: &Value,
    model: Option<&str>,
    streaming: bool,
    pool: Option<Arc<crate::tui::TuiPool>>,
) -> std::io::Result<()> {
    if streaming {
        begin_sse(&mut stream).await?;
    }
    let mut last = String::new();
    let mut text = String::new();
    let mut stop_reason = String::new();
    let mut failure: Option<String> = None;
    // 一轮里会有多条流（会话标题、建议、主对话…）。全部收集后按
    // `max_tokens`（主对话最大）挑出主流，避免把标题/建议当成回答。
    let mut streams: std::collections::HashMap<u64, (crate::tui::OpenMeta, Vec<Value>, Option<String>)> =
        std::collections::HashMap::new();
    let mut parked_sent = false;
    loop {
        // 等这一刻：要么来了一条 tap 事件，要么 200ms 到点去查一次被 park 的工具调用。
        let row = match tokio::time::timeout(std::time::Duration::from_millis(200), rx.recv()).await
        {
            Ok(Some(row)) => row,
            Ok(None) => break,
            Err(_) => {
                // TUI 下 CC 调 MCP 工具时不会产生任何 tap 行，只有桥那边的 park。
                // 这里把它合成为一条 tool_use 回投，控制面送 tool_result 后 CC 会继续。
                if !parked_sent && streaming {
                    if let Some(parker) = parker.as_ref() {
                        let calls = parker.pending_calls(&key).await;
                        if !calls.is_empty() {
                            parked_sent = true;
                            eprintln!("[crag-mcp] emit tool_use at {}", crate::native::now_ms());
                            for (name, data) in crate::native::tool_use_sse(
                                model.unwrap_or(""),
                                &calls,
                            ) {
                                write_sse_raw(&mut stream, &name, &data).await?;
                            }
                            return Ok(());
                        }
                    }
                }
                continue;
            }
        };
        match row {
            crate::tui::TapRow::Open(id, meta) => {
                streams.entry(id).or_insert_with(|| (meta, Vec::new(), None));
            }
            crate::tui::TapRow::Event(id, event) => {
                streams
                    .entry(id)
                    .or_insert_with(|| (Default::default(), Vec::new(), None))
                    .1
                    .push(event);
            }
            crate::tui::TapRow::End(id, reason) => {
                if let Some(entry) = streams.get_mut(&id) {
                    entry.2 = Some(reason);
                }
            }
            _ => {}
        }
    }
    let primary = streams
        .iter()
        .filter(|(_, (_, events, _))| !events.is_empty())
        .max_by_key(|(_, (meta, events, _))| (meta.max_tokens, events.len()))
        .map(|(id, _)| *id);
    // 一条流都没有 = 这一跳实际没有输出（上游限流/重试/CLI 早退）。
    // 必须报错，不能回一个空 200（上游 issue #1119 同族的坑）。
    if primary.is_none() && failure.is_none() {
        // tap 一条流都没有时，退一步读 CLI 自己写的 transcript（厂商也是双通道）。
        let file = match pool.as_ref() {
            Some(pool) => pool.transcript_for(&key).await,
            None => None,
        };
        if let Some(file) = file {
            if let Some(message) =
                crate::tui::transcript_answer_file(&file, std::time::Duration::from_secs(30)).await
            {
                emit_transcript_message(&mut stream, &message).await;
                return Ok(());
            }
        }
        let dir = std::env::temp_dir()
            .join(format!("crag-tui-{}", crate::native::session_tag(&key)));
        let screen = std::fs::read_to_string(dir.join("screen.log")).unwrap_or_default();
        failure = Some(if crate::tui::screen_rate_limited(&screen) {
            "tui hop rate-limited by upstream".to_string()
        } else {
            "tui hop produced no output".to_string()
        });
    }
    if let Some(id) = primary {
        if let Some((_, events, end)) = streams.get(&id) {
            if let Some(reason) = end {
                if reason != "done" {
                    failure = Some(format!("tui stream ended early: {reason}"));
                }
            }
            for event in events {
                if let Some(reason) = event.pointer("/delta/stop_reason").and_then(|v| v.as_str()) {
                    stop_reason = reason.to_string();
                }
                if let Some((name, data)) = crate::tui::sse_of(event) {
                    if name == "content_block_delta" {
                        if let Some(chunk) = event.pointer("/delta/text").and_then(|v| v.as_str()) {
                            text.push_str(chunk);
                        }
                    }
                    if streaming {
                        write_sse_raw(&mut stream, &name, &data).await?;
                    }
                    last = name;
                }
            }
        }
    }

    // 工具：CLI 停下等 MCP 结果时，本跳以合成 tool_use 收尾。
    if failure.is_none() && stop_reason == "tool_use" {
        if let Some(parker) = parker.as_ref() {
            let calls = parker.pending_calls(&key).await;
            if !calls.is_empty() {
                if streaming {
                    for (name, data) in crate::native::tool_use_sse(model.unwrap_or_default(), &calls) {
                        write_sse_raw(&mut stream, &name, &data).await?;
                    }
                    return stream.flush().await;
                }
                let payload = json!({
                    "type": "message",
                    "role": "assistant",
                    "model": model.unwrap_or_default(),
                    "content": calls
                        .iter()
                        .map(|(id, name, input)| json!({"type": "tool_use", "id": id, "name": name, "input": input}))
                        .collect::<Vec<_>>(),
                    "stop_reason": "tool_use",
                    "stop_sequence": Value::Null,
                    "usage": {"input_tokens": 0, "output_tokens": 0},
                });
                return respond(
                    &mut stream,
                    200,
                    "application/json",
                    &serde_json::to_vec(&payload).unwrap_or_default(),
                    &[("x-terminal-state", "verified")],
                )
                .await;
            }
        }
    }

    if let Some(message) = failure {
        if streaming {
            let code = if message.contains("rate-limited") {
                "rate_limited"
            } else if message.contains("no output") {
                "tui_no_output"
            } else {
                "tui_stream_cut"
            };
            let payload = json!({"type": "error", "error": {"type": "api_error", "code": code, "message": message}});
            write_sse_raw(&mut stream, "error", &payload.to_string()).await?;
            if last != "message_stop" {
                write_sse_raw(&mut stream, "message_stop", "{\"type\":\"message_stop\"}").await?;
            }
            return stream.flush().await;
        }
        let payload = json!({"type": "error", "error": {"type": "api_error", "code": "tui_stream_cut", "message": message}});
        return respond(
            &mut stream,
            502,
            "application/json",
            &serde_json::to_vec(&payload).unwrap_or_default(),
            &[("x-terminal-state", "error")],
        )
        .await;
    }

    if streaming {
        if last != "message_stop" {
            write_sse_raw(&mut stream, "message_stop", "{\"type\":\"message_stop\"}").await?;
        }
        return stream.flush().await;
    }
    let payload = json!({
        "type": "message",
        "role": "assistant",
        "model": model.unwrap_or_default(),
        "content": if text.is_empty() { json!([]) } else { json!([{"type": "text", "text": text}]) },
        "stop_reason": if stop_reason.is_empty() { "end_turn".to_string() } else { stop_reason },
        "stop_sequence": Value::Null,
        "usage": {"input_tokens": 0, "output_tokens": 0},
    });
    respond(
        &mut stream,
        200,
        "application/json",
        &serde_json::to_vec(&payload).unwrap_or_default(),
        &[("x-terminal-state", "verified")],
    )
    .await
}

/// 原生 CLI 通路：内核不拼请求，把本轮 user 消息交给官方 `claude`，
/// 再把它的 `stream_event` 原样转成 SSE 回投控制面。
///
/// 两种跳：
/// - 普通跳：写一帧 user；若 CLI 发起 MCP 工具调用，bridge 会回调内核，
///   内核 park 住并回投一条只含 `tool_use` 的合成 assistant 消息，本跳结束。
/// - 续跳：body 末尾是 `tool_result` 集 → 解开 park 的调用，接着读 CLI 的后续事件。
async fn forward_native(
    mut stream: Stream,
    pool: Arc<crate::native::Pool>,
    envelope: &Value,
    body: &Value,
) -> std::io::Result<()> {
    let streaming = envelope
        .get("stream")
        .and_then(|v| v.as_bool())
        .or_else(|| body.get("stream").and_then(|v| v.as_bool()))
        .unwrap_or(false);
    let key = session_key(envelope, body);
    let model = body
        .get("model")
        .and_then(|v| v.as_str())
        .unwrap_or_default()
        .to_string();

    let results = crate::native::tool_results(body);
    // 续跳优先复用 park 中的 CLI 会话；但 print 模式的 CLI 在工具调用挂起期间常常已退出，
    // 复不上就**带完整历史重开一跳**——我们每跳都渲染全量历史，效果等价。
    // 早期直接 409/410，实测会把整条工具链走死（客户端拿不到答案）。
    let mut reuse = None;
    if !results.is_empty() {
        // 形状指纹：续跳的历史结构必须与 park 时刻一致（上游 continuationFingerprint 的等价物）。
        let shape = crate::native::history_fingerprint(
            body.get("messages").and_then(|v| v.as_array()).map(|v| v.as_slice()).unwrap_or(&[]),
        );
        if pool.check_fingerprint(&key, shape).await {
            let (resolved, _foreign) = pool.resolve(&key, &results).await;
            if resolved > 0 {
                reuse = pool.attach(&key).await;
            }
        }
    }
    let mut rx = match reuse {
        Some(rx) => rx,
        None => {
        let Some(prompt_text) = crate::native::render_initial_prompt(body) else {
            return respond(
                &mut stream,
                400,
                "application/json",
                serde_json::to_string(&error_body("invalid_request_error", "messages 里没有 user 消息"))
                    .unwrap_or_default()
                    .as_bytes(),
                &[],
            )
            .await;
        };
        let tools = crate::native::mcp_tools(body.get("tools").unwrap_or(&Value::Null));
        let has_client_tools = !tools.is_empty();
        let mut extra: Vec<String> = Vec::new();
        if !tools.is_empty() {
            let Some(base) = pool.callback_base() else {
                return respond(
                    &mut stream,
                    503,
                    "application/json",
                    serde_json::to_string(&error_body("api_error", "MCP callback server unavailable"))
                        .unwrap_or_default()
                        .as_bytes(),
                    &[("x-terminal-state", "error")],
                )
                .await;
            };
            let config_path = std::env::temp_dir().join(format!("crag-mcp-{key}.json"));
            let bridge_path = std::env::temp_dir().join(format!("crag-mcp-{key}-bridge.json"));
            let (for_cli, for_bridge) = crate::native::mcp_configs(
                &crate::native::Pool::exe(),
                &bridge_path,
                &format!("{base}/{key}"),
                tools,
            );
            let write_all = std::fs::write(
                &config_path,
                serde_json::to_vec(&for_cli).unwrap_or_default(),
            )
            .and_then(|_| {
                std::fs::write(&bridge_path, serde_json::to_vec(&for_bridge).unwrap_or_default())
            });
            if let Err(error) = write_all {
                let payload = error_body("api_error", &format!("mcp.json write failed: {error}"));
                return respond(
                    &mut stream,
                    500,
                    "application/json",
                    &serde_json::to_vec(&payload).unwrap_or_default(),
                    &[("x-terminal-state", "error")],
                )
                .await;
            }
            // 注意：**不要**加 `--tools ""`。实测（第三方中转）空工具表会立刻触发
            // 403 "客户端存在异常" —— 真实 Claude Code 永远带着内建工具，空表是最明显的异常特征。
            extra = vec![
                "--strict-mcp-config".into(),
                "--mcp-config".into(),
                config_path.to_string_lossy().to_string(),
            ];
        }
        let client_system = crate::native::system_text(body);
        let mut system = client_system.clone();
        let mut replace_system = false;
        if has_client_tools {
            // 注意：**不能替换** system prompt。实测（§16.24）把 system 换成自家 persona 后，
            // 中转会把带工具的请求一律判成"程序自动化/蒸馏"并 403；保留客户端原始 system、
            // 只在末尾追加一小段工具路由说明，就恢复正常。
            let note = "

# Tool routing
Every tool is exposed to you as an MCP tool named                         `mcp__crag__<Name>` (for example `mcp__crag__Bash`). When the instructions                         above mention a tool such as `Bash` or `Read`, call the corresponding                         `mcp__crag__*` tool; bare names are not available in this environment.";
            system = Some(match client_system {
                Some(text) => format!("{text}{note}"),
                None => note.trim_start().to_string(),
            });
        }
        let mut args = crate::native::Args {
            session_id: &key,
            mcp_config: None,
            model: Some(model.as_str()).filter(|m| !m.is_empty()),
            system_prompt: system.as_deref().map(|text| (text, replace_system)),
            bare: false,
            disallowed_tools: if has_client_tools { crate::native::client_tool_names(body) } else { Vec::new() },
            allowed_tools: if has_client_tools { vec!["mcp__crag".to_string()] } else { Vec::new() },
        }
        .to_vec();
        args.extend(extra);

        let frame = match serde_json::to_value(StdinFrame::user(
            &key,
            Message {
                role: "user".into(),
                content: Value::String(prompt_text),
            },
        )) {
            Ok(frame) => frame,
            Err(error) => {
                return respond(
                    &mut stream,
                    400,
                    "application/json",
                    serde_json::to_string(&error_body("invalid_request_error", &error.to_string()))
                        .unwrap_or_default()
                        .as_bytes(),
                    &[],
                )
                .await
            }
        };
        match pool.turn(&key, args, frame).await {
            Ok(rx) => rx,
            Err(error) => {
                let payload = json!({"type": "error", "error": {"type": "api_error", "code": "cli_spawn_failed", "message": error}});
                return respond(
                    &mut stream,
                    502,
                    "application/json",
                    &serde_json::to_vec(&payload).unwrap_or_default(),
                    &[("x-terminal-state", "error")],
                )
                .await;
            }
        }
        }
    };

    if streaming {
        begin_sse(&mut stream).await?;
    }
    let mut last = String::new();
    let mut assistant: Option<Value> = None;
    let mut failure: Option<String> = None;
    let mut parked = false;
    let mut dropped: std::collections::HashSet<u64> = std::collections::HashSet::new();
    let mut failure_code = "api_error";
    let deadline = tokio::time::Instant::now() + HOP_TIMEOUT;
    // SSE 保活：长 thinking 期间也要有字节下行，避免被客户端/中间层判死（对应上游 #997）。
    let mut ping_at = tokio::time::Instant::now() + KEEPALIVE_INTERVAL;
    loop {
        let next = tokio::time::timeout_at(ping_at.min(deadline), rx.recv()).await;
        let Ok(Some(value)) = next else {
            if next.is_ok() {
                break;
            }
            let now = tokio::time::Instant::now();
            if now >= deadline {
                failure = Some("cli hop timeout".to_string());
                failure_code = "cli_hop_timeout";
                break;
            }
            if streaming {
                write_sse_raw(&mut stream, "ping", "{\"type\":\"ping\"}").await?;
            }
            ping_at = now + KEEPALIVE_INTERVAL;
            continue;
        };
        ping_at = tokio::time::Instant::now() + KEEPALIVE_INTERVAL;
        // 工具调用被 park：回投合成 tool_use 消息，本跳到此结束。
        if value.get("type").and_then(|v| v.as_str()) == Some(crate::native::PARKED_KIND) {
            let calls: Vec<(String, String, Value)> = value
                .get("calls")
                .and_then(|v| v.as_array())
                .map(|items| {
                    items
                        .iter()
                        .map(|call| {
                            (
                                call.get("id")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or_default()
                                    .to_string(),
                                call.get("name")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or_default()
                                    .to_string(),
                                call.get("input").cloned().unwrap_or_else(|| json!({})),
                            )
                        })
                        .collect()
                })
                .unwrap_or_default();
            if !calls.is_empty() {
                parked = true;
                pool.remember_fingerprint(&key, crate::native::fingerprint_with_synthetic(body, &calls))
                    .await;
                if streaming {
                    for (name, data) in crate::native::tool_use_sse(&model, &calls) {
                        write_sse_raw(&mut stream, &name, &data).await?;
                    }
                } else {
                    assistant = Some(json!({
                        "type": "message",
                        "role": "assistant",
                        "model": model,
                        "content": calls
                            .iter()
                            .map(|(id, name, input)| json!({
                                "type": "tool_use", "id": id, "name": name, "input": input,
                            }))
                            .collect::<Vec<_>>(),
                        "stop_reason": "tool_use",
                        "stop_sequence": Value::Null,
                        "usage": {"input_tokens": 0, "output_tokens": 0},
                    }));
                }
            }
            break;
        }
        // CC 把上游错误重试过程也发成帧（system/api_retry），据此区分 429 与普通失败。
        if value.get("subtype").and_then(|v| v.as_str()) == Some("api_retry")
            && value.get("error_status").and_then(|v| v.as_u64()) == Some(429)
        {
            failure_code = "rate_limited";
        }
        let Ok(parsed) = serde_json::from_value::<StdoutFrame>(value.clone()) else {
            continue;
        };
        if parsed.kind == "assistant" {
            assistant = value.get("message").cloned();
        }
        if let Some((name, data)) = crate::native::to_sse(&parsed) {
            // CC 自己的 MCP 工具调用不外发（控制面只看内核合成的 crag_tool_*）。
            let skip = serde_json::from_str::<Value>(&data)
                .map(|event| crate::native::suppress_mcp_tool_use(&event, &mut dropped))
                .unwrap_or(false);
            if !skip {
                write_sse_raw(&mut stream, &name, &data).await?;
                last = name;
            }
        }
        if parsed.is_result() {
            if parsed.failed() {
                failure_code = "upstream_error";
                failure = Some(crate::ndjson::redact(
                    &parsed
                        .result
                        .or(parsed.subtype)
                        .unwrap_or_else(|| "cli reported failure".into()),
                ));
            }
            break;
        }
    }
    crate::native::observe(
        &key,
        &json!({
            "at": std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0),
            "continuation": !results.is_empty(),
            "streaming": streaming,
            "events_last": last,
            "parked": parked,
            "failure": failure,
        }),
    );
    if failure.is_none() && last.is_empty() && !parked {
        let diagnostics = pool.diagnostics(&key).await;
        if !diagnostics.trim().is_empty() {
            failure_code = "cli_unavailable";
            failure = Some(diagnostics);
        }
    }

    // CLI 的 stream 结束时，MCP 桥可能刚好把调用 park 住，但 park 通知走的是另一条通道，
    // 我们这边只看到通道关闭。这里补一次检查：还有挂起调用就合成 tool_use 回投，
    // 否则客户端会收到 stop_reason=tool_use 却没有任何可执行的块（实测就是这种"工具消失"）。
    if !parked {
        let calls = pool.pending_calls(&key).await;
        if !calls.is_empty() {
            parked = true;
            pool.remember_fingerprint(&key, crate::native::fingerprint_with_synthetic(body, &calls))
                .await;
            if streaming {
                for (name, data) in crate::native::tool_use_sse(&model, &calls) {
                    write_sse_raw(&mut stream, &name, &data).await?;
                }
            } else {
                assistant = Some(json!({
                    "type": "message",
                    "role": "assistant",
                    "model": model,
                    "content": calls
                        .iter()
                        .map(|(id, name, input)| json!({
                            "type": "tool_use", "id": id, "name": name, "input": input,
                        }))
                        .collect::<Vec<_>>(),
                    "stop_reason": "tool_use",
                    "stop_sequence": Value::Null,
                    "usage": {"input_tokens": 0, "output_tokens": 0},
                }));
            }
        }
    }

    if let Some(message) = failure {
        if streaming {
            let payload = json!({"type": "error", "error": {"type": "api_error", "code": failure_code, "message": message}});
            write_sse_raw(&mut stream, "error", &payload.to_string()).await?;
            if last != "message_stop" {
                write_sse_raw(&mut stream, "message_stop", "{\"type\":\"message_stop\"}").await?;
            }
            return stream.flush().await;
        }
        let payload = json!({"type": "error", "error": {"type": "api_error", "code": failure_code, "message": message}});
        return respond(
            &mut stream,
            502,
            "application/json",
            &serde_json::to_vec(&payload).unwrap_or_default(),
            &[("x-terminal-state", "error")],
        )
        .await;
    }

    if streaming {
        if !parked && last != "message_stop" {
            write_sse_raw(&mut stream, "message_stop", "{\"type\":\"message_stop\"}").await?;
        }
        return stream.flush().await;
    }
    let payload = assistant.unwrap_or_else(|| json!({}));
    respond(
        &mut stream,
        200,
        "application/json",
        &serde_json::to_vec(&payload).unwrap_or_default(),
        &[("x-terminal-state", "verified")],
    )
    .await
}

/// 会话键：优先 `x-claude-code-session-id`，其次 `metadata.user_id.session_id`，
/// 最后退回本次 hop 的 `request_id`（退化成不跨 hop 复用）。
fn session_key(envelope: &Value, body: &Value) -> String {
    let header = envelope
        .pointer("/headers/x-claude-code-session-id")
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty());
    if let Some(id) = header {
        return id.to_string();
    }
    let embedded = body
        .pointer("/metadata/user_id")
        .and_then(|v| v.as_str())
        .and_then(|raw| serde_json::from_str::<Value>(raw).ok())
        .and_then(|parsed| parsed.get("session_id")?.as_str().map(str::to_string));
    if let Some(id) = embedded {
        return id;
    }
    envelope
        .get("request_id")
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty())
        .map(str::to_string)
        .unwrap_or_else(identity::new_uuid)
}

/// 自控 wire：入站 envelopes → protocol 层 → h2 上游 → SSE/JSON 回投。
async fn forward_upstream(
    mut stream: Stream,
    _state: Arc<GatewayState>,
    upstream: Arc<UpstreamClient>,
    envelope: &Value,
    body: &Value,
) -> std::io::Result<()> {
    let streaming = envelope
        .get("stream")
        .and_then(|v| v.as_bool())
        .or_else(|| body.get("stream").and_then(|v| v.as_bool()))
        .unwrap_or(false);

    // 出站 body：system 走与现网内核一致的布局（补 billing 头 → wire 规范化），
    // 其余字段原样透传；cch 由 wire 层统一打戳。
    // 本次 hop 的会话 ID（用于 x-claude-code-session-id / metadata）
    let session_id = envelope
        .get("request_id")
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty())
        .map(str::to_string)
        .unwrap_or_else(identity::new_uuid);

    let mut outbound = body.clone();
    if let Some(obj) = outbound.as_object_mut() {
        let header = billing::billing_header(
            &identity::cli_version(),
            &identity::entrypoint(),
            Some(crate::protocol::cch::CCH_PLACEHOLDER),
            &billing::BillingContext::default(),
        );
        let current = obj.get("system").cloned();
        let has_billing = serde_json::to_string(&current)
            .unwrap_or_default()
            .contains("x-anthropic-billing-header:");
        let with_billing = if has_billing {
            current
        } else {
            match current {
                Some(Value::String(text)) => Some(Value::String(format!("{text}
{header}"))),
                Some(Value::Array(mut blocks)) => {
                    blocks.push(json!({"type": "text", "text": header}));
                    Some(Value::Array(blocks))
                }
                _ => Some(json!([{"type": "text", "text": header}])),
            }
        };
        let prepared = with_billing
            .as_ref()
            .and_then(|system| system::wire_system_blocks(system, false))
            .map(Value::Array)
            .or(with_billing);
        if let Some(prepared) = prepared {
            obj.insert("system".into(), prepared);
        }
    }
    // 缓存 marker：信封里的 preserve_cache_breakpoints / cache_ttl 决定是否由内核接管。
    let preserve = envelope
        .get("preserve_cache_breakpoints")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    let ttl = envelope
        .get("cache_ttl")
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty())
        .unwrap_or("1h");
    cache::apply_kin_owned_cache_markers(&mut outbound, ttl, preserve, preserve, preserve);

    // 上游的 `stream` 标志必须与信封一致：删掉它会让上游返回**非流式 JSON**，
    // 而我们按 SSE 解析 → 200 + 空 body（真机踩过两次，不要再删）。
    if let Some(object) = outbound.as_object_mut() {
        if streaming {
            object.insert("stream".into(), json!(true));
        } else {
            object.remove("stream");
        }
    }

    let caller_headers: Vec<(String, String)> = envelope
        .get("headers")
        .and_then(|v| v.as_object())
        .map(|map| {
            map.iter()
                .filter_map(|(k, v)| v.as_str().map(|v| (k.clone(), v.to_string())))
                .collect()
        })
        .unwrap_or_default();
    let caller_betas: Vec<String> = caller_headers
        .iter()
        .filter(|(k, _)| k.eq_ignore_ascii_case("anthropic-beta"))
        .flat_map(|(_, v)| v.split(',').map(|t| t.trim().to_string()))
        .filter(|t| !t.is_empty())
        .collect();
    let oauth = upstream
        .credential()
        .map(|c| c.is_oauth())
        .unwrap_or(false);
    // direct 回退路径专用：官方 CLI 每个请求都带 `metadata.user_id`，缺了会被客户端口校验拒。
    // （`tui` 通路下由原生 CC 自己带，内核不掺手。）
    wire::stamp_metadata(
        &mut outbound,
        &identity::Identity::load().user_id(&session_id, oauth),
    );
    // 预检：只拦上游必定拒绝的形状，命中时请求不出网。
    if let Some(failure) = preflight::preflight(serde_json::to_string(&outbound).unwrap_or_default().as_bytes()) {
        let payload = json!({
            "type": "error",
            "error": {
                "type": failure.error_type,
                "message": failure.error,
                "code": failure.code,
            }
        });
        return respond(
            &mut stream,
            failure.status,
            "application/json",
            &serde_json::to_vec(&payload).unwrap_or_default(),
            &[("x-terminal-state", "error")],
        )
        .await;
    }

    let request = wire::build_messages_request(&caller_headers, &caller_betas, &outbound, false, oauth, streaming, &session_id);

    let response = match upstream.post_messages(&request).await {
        Ok(response) => response,
        Err(error) => {
            let payload = error_body("api_error", &format!("upstream unreachable: {error}"));
            return respond(
                &mut stream,
                502,
                "application/json",
                &serde_json::to_vec(&payload).unwrap_or_default(),
                &[],
            )
            .await;
        }
    };
    let status = response.head.status;
    if status != 200 {
        let body = response.collect(MAX_BODY_BYTES).await.unwrap_or_default();
        let text = String::from_utf8_lossy(&body).to_string();
        let payload = if serde_json::from_str::<Value>(&text).is_ok() {
            text
        } else {
            serde_json::to_string(&error_body("api_error", &crate::ndjson::redact(&text)))
                .unwrap_or_default()
        };
        return respond(
            &mut stream,
            status,
            "application/json",
            payload.as_bytes(),
            &[("x-terminal-state", "error")],
        )
        .await;
    }

    if streaming {
        // 上游返回非 SSE（例如 200 + JSON）时不能开 SSE 流：按非流式原样回传，
        // 否则客户端会收到 200 + 空 body（线上实测踩到过）。
        if !response.head.is_sse() {
            let bytes = response.collect(MAX_BODY_BYTES).await?;
            return respond(
                &mut stream,
                200,
                "application/json",
                &bytes,
                &[("x-terminal-state", "verified"), ("x-upstream-content-type", "non-sse")],
            )
            .await;
        }
        begin_sse(&mut stream).await?;
        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
        let reader = tokio::spawn(async move { read_sse_into(response.body, tx).await });
        // 初值必须是空：一个事件都没收到时也要补兜底 `message_stop`。
        let mut last = String::new();
        while let Some(event) = rx.recv().await {
            let name = event.event.clone().unwrap_or_else(|| "message".to_string());
            write_sse_raw(&mut stream, &name, &event.data).await?;
            last = name;
        }
        let _ = reader.await;
        if last != "message_stop" {
            write_sse_raw(&mut stream, "message_stop", "{\"type\":\"message_stop\"}").await?;
        }
        return stream.flush().await;
    }

    let bytes = response.collect(MAX_BODY_BYTES).await?;
    respond(
        &mut stream,
        200,
        "application/json",
        &bytes,
        &[("x-terminal-state", "verified")],
    )
    .await
}

/// 槽位模式：把信封转成 CLI 帧，回收事件流。
async fn forward_slot(
    mut stream: Stream,
    state: Arc<GatewayState>,
    envelope: &Value,
    body: &Value,
) -> std::io::Result<()> {
    let Some(host) = state.host.clone() else {
        return respond(
            &mut stream,
            502,
            "application/json",
            br#"{"type":"error","error":{"type":"api_error","message":"no slot host configured"}}"#,
            &[],
        )
        .await;
    };
    let streaming = envelope
        .get("stream")
        .and_then(|v| v.as_bool())
        .or_else(|| body.get("stream").and_then(|v| v.as_bool()))
        .unwrap_or(false);
    let request_id = envelope
        .get("request_id")
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty())
        .map(str::to_string)
        .unwrap_or_else(identity::new_uuid);
    let model = body
        .get("model")
        .and_then(|v| v.as_str())
        .unwrap_or("claude-opus-5-5")
        .to_string();
    let frame = build_frame(&request_id, &model, body);

    let mut rx = match host.ask(request_id.clone(), frame) {
        Ok(rx) => rx,
        Err(error) => {
            let payload = json!({
                "type": "error",
                "error": {"type": "permission_error", "code": "no_free_slot", "message": error.message()}
            });
            return respond(
                &mut stream,
                502,
                "application/json",
                &serde_json::to_vec(&payload).unwrap_or_default(),
                &[],
            )
            .await;
        }
    };

    if streaming {
        begin_sse(&mut stream).await?;
        let mut assembler = Assembler::new(&model);
        let mut terminal = Terminal::Failed;
        loop {
            let next = tokio::time::timeout(HOP_TIMEOUT, rx.recv()).await;
            let frame = match next {
                Ok(Some(frame)) => frame,
                Ok(None) => break,
                Err(_) => {
                    terminal = Terminal::Timeout;
                    break;
                }
            };
            if frame.kind == "stream_event" {
                if let Some(event) = frame.event.as_ref() {
                    assembler.apply(event);
                    write_sse(&mut stream, event).await?;
                }
                continue;
            }
            if frame.is_result() {
                terminal = if frame.failed() { Terminal::Failed } else { Terminal::Verified };
                if frame.failed() {
                    let message = frame.result.clone().unwrap_or_else(|| "error_during_execution".into());
                    let payload = error_body("api_error", &message);
                    write_sse(&mut stream, &json!({"type": "error", "error": payload["error"]})).await?;
                }
                break;
            }
        }
        host.release(&request_id);
        // 终结标记以 Trailer 形式落地（现网 `x-terminal-state: verified`）。
        let tail = match terminal {
            Terminal::Verified => "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n".to_string(),
            _ => String::new(),
        };
        stream.write_all(tail.as_bytes()).await?;
        stream.flush().await?;
        return Ok(());
    }

    // 非流式：聚合到 result 帧再输出完整 message。
    let mut assembler = Assembler::new(&model);
    let mut usage = Value::Null;
    let mut stop_reason = String::new();
    loop {
        let next = tokio::time::timeout(HOP_TIMEOUT, rx.recv()).await;
        let frame = match next {
            Ok(Some(frame)) => frame,
            Ok(None) => break,
            Err(_) => {
                host.release(&request_id);
                return respond(
                    &mut stream,
                    504,
                    "application/json",
                    br#"{"type":"error","error":{"type":"api_error","message":"hop timeout"}}"#,
                    &[],
                )
                .await;
            }
        };
        if frame.kind == "stream_event" {
            if let Some(event) = frame.event.as_ref() {
                assembler.apply(event);
            }
            continue;
        }
        if frame.is_result() {
            usage = frame.usage.clone().unwrap_or(Value::Null);
            stop_reason = frame.stop_reason.clone().unwrap_or_default();
            if frame.failed() {
                let message = frame.result.clone().unwrap_or_else(|| "error_during_execution".into());
                host.release(&request_id);
                let payload = error_body("api_error", &message);
                return respond(
                    &mut stream,
                    502,
                    "application/json",
                    &serde_json::to_vec(&payload).unwrap_or_default(),
                    &[("x-terminal-state", "error")],
                )
                .await;
            }
            break;
        }
    }
    host.release(&request_id);
    let message = assembler.finish(&stop_reason, &usage);
    let bytes = serde_json::to_vec(&message).unwrap_or_default();
    respond(&mut stream, 200, "application/json", &bytes, &[("x-terminal-state", "verified")]).await
}

fn build_frame(session_id: &str, model: &str, body: &Value) -> StdinFrame {
    // crag 槽位自己维护 transcript，内核只送本轮最新 user 消息。
    let last_user = body
        .get("messages")
        .and_then(|v| v.as_array())
        .and_then(|messages| {
            messages
                .iter()
                .rev()
                .find(|m| m.get("role").and_then(|v| v.as_str()) == Some("user"))
                .cloned()
        })
        .and_then(|m| m.get("content").cloned())
        .unwrap_or_else(|| Value::String(String::new()));
    StdinFrame {
        kind: "user".into(),
        session_id: session_id.to_string(),
        model: Some(model.to_string()),
        message: Message { role: "user".into(), content: last_user },
        tools: body.get("tools").cloned(),
        system: body.get("system").cloned(),
    }
}

#[derive(PartialEq, Eq)]
enum Terminal {
    Verified,
    Failed,
    Timeout,
}

async fn begin_sse(stream: &mut Stream) -> std::io::Result<()> {
    let head = "HTTP/1.1 200 OK\r\ncontent-type: text/event-stream; charset=utf-8\r\ncache-control: no-cache, no-transform\r\nconnection: close\r\n\r\n";
    stream.write_all(head.as_bytes()).await?;
    stream.flush().await
}

async fn write_sse_raw(stream: &mut Stream, name: &str, data: &str) -> std::io::Result<()> {
    stream
        .write_all(format!("event: {name}
data: {data}

").as_bytes())
        .await?;
    stream.flush().await
}

async fn write_sse(stream: &mut Stream, event: &Value) -> std::io::Result<()> {
    let name = event.get("type").and_then(|v| v.as_str()).unwrap_or("message");
    let data = serde_json::to_string(event).unwrap_or_default();
    stream
        .write_all(format!("event: {name}\ndata: {data}\n\n").as_bytes())
        .await?;
    stream.flush().await
}

fn error_body(kind: &str, message: &str) -> Value {
    json!({"type":"error","error":{"type":kind,"message":message}})
}

/// 把 `stream_event` 载荷聚合回一条完整 message。
struct Assembler {
    model: String,
    blocks: Vec<Value>,
    usage: Value,
}

impl Assembler {
    fn new(model: &str) -> Self {
        Self {
            model: model.to_string(),
            blocks: Vec::new(),
            usage: Value::Null,
        }
    }

    fn apply(&mut self, event: &Value) {
        let index = event.get("index").and_then(|v| v.as_i64()).unwrap_or(-1);
        match event.get("type").and_then(|v| v.as_str()).unwrap_or_default() {
            "content_block_start" => {
                if index >= 0 {
                    let block = event.get("content_block").cloned().unwrap_or(Value::Null);
                    let slot = index as usize;
                    while self.blocks.len() <= slot {
                        self.blocks.push(Value::Null);
                    }
                    self.blocks[slot] = block;
                }
            }
            "content_block_delta" => {
                let Some(delta) = event.get("delta") else { return };
                let slot = index.max(0) as usize;
                while self.blocks.len() <= slot {
                    self.blocks.push(Value::Null);
                }
                let block = &mut self.blocks[slot];
                match delta.get("type").and_then(|v| v.as_str()).unwrap_or_default() {
                    "text_delta" => {
                        let text = delta
                            .get("text")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default()
                            .to_string();
                        if block.is_null() {
                            *block = json!({"type": "text", "text": text});
                        } else if let Some(obj) = block.as_object_mut() {
                            let previous = obj
                                .get("text")
                                .and_then(|v| v.as_str())
                                .unwrap_or_default()
                                .to_string();
                            obj.insert("text".into(), Value::String(format!("{previous}{text}")));
                        }
                    }
                    "thinking_delta" => {
                        let thinking = delta
                            .get("thinking")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default()
                            .to_string();
                        if block.is_null() {
                            *block = json!({"type": "thinking", "thinking": thinking});
                        } else if let Some(obj) = block.as_object_mut() {
                            let previous = obj
                                .get("thinking")
                                .and_then(|v| v.as_str())
                                .unwrap_or_default()
                                .to_string();
                            obj.insert("thinking".into(), Value::String(format!("{previous}{thinking}")));
                        }
                    }
                    "input_json_delta" => {
                        let partial = delta
                            .get("partial_json")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default();
                        let previous = block
                            .get("__partial")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default()
                            .to_string();
                        if let Some(obj) = block.as_object_mut() {
                            obj.insert("__partial".into(), Value::String(format!("{previous}{partial}")));
                        }
                    }
                    _ => {}
                }
            }
            "content_block_stop" => {
                let slot = index.max(0) as usize;
                if let Some(block) = self.blocks.get_mut(slot).and_then(|b| b.as_object_mut()) {
                    if let Some(partial) = block.remove("__partial") {
                        let text = partial.as_str().unwrap_or_default();
                        block.insert(
                            "input".into(),
                            serde_json::from_str(text).unwrap_or_else(|_| json!({})),
                        );
                    }
                }
            }
            "message_delta" => {
                if let Some(usage) = event.get("usage") {
                    self.usage = usage.clone();
                }
            }
            _ => {}
        }
    }

    fn finish(&self, stop_reason: &str, usage: &Value) -> Value {
        let content: Vec<Value> = self
            .blocks
            .iter()
            .filter(|b| !b.is_null())
            .cloned()
            .collect();
        let usage = if usage.is_null() { self.usage.clone() } else { usage.clone() };
        json!({
            "id": format!("msg_{}", identity::new_uuid().replace('-', "")),
            "type": "message",
            "role": "assistant",
            "model": self.model,
            "content": content,
            "stop_reason": if stop_reason.is_empty() { Value::Null } else { Value::String(stop_reason.to_string()) },
            "stop_sequence": Value::Null,
            "usage": if usage.is_null() { json!({"input_tokens":0,"output_tokens":0}) } else { usage },
        })
    }
}

#[cfg(test)]
mod tests {

    #[test]
    fn telemetry_apply_matches_upstream_contract() {
        let (status, body) = telemetry_apply_response(true);
        assert_eq!(status, 200);
        assert_eq!(body["applied"], true);
        assert_eq!(body["enabled"], true);
        assert_eq!(body["scope"], "native_claude_launch");
        assert_eq!(body["upload_confirmed"], false);

        // 要求关闭官方遥测：明确拒绝，不伪装成已应用。
        let (status, body) = telemetry_apply_response(false);
        assert_eq!(status, 409);
        assert_eq!(body["error"]["type"], "telemetry_native_settings_blocked");
    }
    use super::*;

    #[test]
    fn session_key_prefers_header_then_embedded_then_request_id() {
        let with_header = json!({"headers": {"x-claude-code-session-id": "h1"}, "request_id": "r1"});
        assert_eq!(session_key(&with_header, &json!({})), "h1");

        let embedded = json!({"metadata": {"user_id": r#"{"device_id":"d","account_uuid":"","session_id":"s1"}"#}});
        assert_eq!(session_key(&json!({"request_id": "r1"}), &embedded), "s1");

        assert_eq!(session_key(&json!({"request_id": "r1"}), &json!({})), "r1");
    }

    #[test]
    fn assembles_text_block_from_deltas() {
        let mut a = Assembler::new("m");
        a.apply(&json!({"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}));
        a.apply(&json!({"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"he"}}));
        a.apply(&json!({"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"llo"}}));
        a.apply(&json!({"type":"content_block_stop","index":0}));
        let message = a.finish("end_turn", &json!({"input_tokens":1,"output_tokens":2}));
        assert_eq!(message["content"][0]["text"], "hello");
        assert_eq!(message["stop_reason"], "end_turn");
    }

    #[test]
    fn assembles_tool_use_input_from_partial_json() {
        let mut a = Assembler::new("m");
        a.apply(&json!({"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"t1","name":"x","input":{}}}));
        a.apply(&json!({"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\"a\":"}}));
        a.apply(&json!({"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"1}"}}));
        a.apply(&json!({"type":"content_block_stop","index":0}));
        let message = a.finish("tool_use", &Value::Null);
        assert_eq!(message["content"][0]["input"]["a"], 1);
    }

    #[tokio::test]
    async fn health_reports_rust_engine_and_slots() {
        let command = crate::testing::fake_cli_command();
        let host = CragHost::spawn(command, 3, &[]).await.unwrap();
        let state = GatewayState::slot_only(Arc::clone(&host), None, "crag");
        let health = state.health();
        assert_eq!(health["engine"], "rust");
        assert_eq!(health["ready_slots"], 3);
        assert_eq!(health["runtime_variant"], "crag-v2");
        host.close().await;
    }
}

    /// 认证只看凭据本身，抽成纯函数便于不构造整个网关状态。
    fn token_matches(token: Option<&str>, headers: &HashMap<String, String>) -> bool {
        let Some(expected) = token else { return true };
        let bearer = headers
            .get("authorization")
            .and_then(|value| value.strip_prefix("Bearer ").or_else(|| value.strip_prefix("bearer ")));
        headers
            .get("x-kin-internal-token")
            .map(String::as_str)
            .or_else(|| headers.get("x-internal-token").map(String::as_str))
            .or_else(|| headers.get("x-api-key").map(String::as_str))
            .or(bearer)
            .is_some_and(|value| value == expected)
    }

    #[test]
    fn accepts_standard_anthropic_auth_headers() {
        let mut headers = HashMap::new();
        headers.insert("x-api-key".to_string(), "tok".to_string());
        assert!(token_matches(Some("tok"), &headers), "x-api-key 应可作为凭据");
        headers.clear();
        headers.insert("authorization".to_string(), "Bearer tok".to_string());
        assert!(token_matches(Some("tok"), &headers), "Bearer 应可作为凭据");
        headers.clear();
        headers.insert("x-api-key".to_string(), "wrong".to_string());
        assert!(!token_matches(Some("tok"), &headers), "错误凭据必须拒绝");
        assert!(token_matches(None, &headers), "未配置 token 时不校验");
    }
