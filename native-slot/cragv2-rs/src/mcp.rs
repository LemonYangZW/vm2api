//! MCP 工具桥：stdio JSON-RPC ↔ 控制面回调。
//!
//! 真值：现网 `runtime/mcp-bridge.mjs`（`crag-v2-mcp --config <json>`）+ worker 侧
//! `MCP_SERVER = "crag_tools"`（`11_CRAG_V2_SPEC.md` §5.4）。
//!
//! 行为：
//! - `initialize` → 回显 `protocolVersion`（缺省 `2024-11-05`），serverInfo `crag-v2`
//! - `tools/list` → 原样返回配置里的工具定义
//! - `tools/call` → POST `crag.callbackUrl`，把响应转成 MCP `content` 块
//! - `ping` → `{}`；`notifications/*` → 不回包；未知方法 → `-32601`
//! - 任何异常 → `-32603`（且仅在请求带 `id` 时回包）

use std::io;

use serde_json::{json, Value};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

/// MCP server 名（与现网一致）。
pub const MCP_SERVER_NAME: &str = "crag_tools";
/// serverInfo.version（现网 `2.1.88-v2`）。
pub const SERVER_INFO_VERSION: &str = "2.1.88-v2";
/// 缺省协议版本。
pub const DEFAULT_PROTOCOL_VERSION: &str = "2024-11-05";

/// 桥配置。
#[derive(Debug, Clone)]
pub struct BridgeConfig {
    pub callback_url: String,
    pub tools: Vec<Value>,
    /// `--restricted` 语义：文件类工具的路径必须落在 cwd / add-dir 内。
    pub restricted: bool,
    /// restricted 模式的 cwd（缺省取进程当前目录）。
    pub cwd: Option<String>,
    /// restricted 模式的额外白名单目录。
    pub add_dirs: Vec<String>,
}

impl BridgeConfig {
    /// 解析 `{"crag": {"callbackUrl": "...", "tools": [...]}}`。
    pub fn parse(text: &str) -> io::Result<Self> {
        let value: Value = serde_json::from_str(text)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, format!("mcp config: {e}")))?;
        let crag = value
            .get("crag")
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "invalid CRAG MCP config"))?;
        let callback_url = crag
            .get("callbackUrl")
            .and_then(|v| v.as_str())
            .filter(|v| !v.is_empty())
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "callbackUrl is required"))?
            .to_string();
        let tools = crag
            .get("tools")
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default();
        let restricted = crag
            .get("restricted")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        let cwd = crag.get("cwd").and_then(|v| v.as_str()).map(str::to_string);
        let add_dirs = crag
            .get("addDirs")
            .and_then(|v| v.as_array())
            .map(|items| {
                items
                    .iter()
                    .filter_map(|v| v.as_str().map(str::to_string))
                    .collect()
            })
            .unwrap_or_default();
        Ok(Self {
            callback_url,
            tools,
            restricted,
            cwd,
            add_dirs,
        })
    }
}

/// 一条 JSON-RPC 应答；`None` 表示不需要回包（通知）。
pub struct Bridge {
    config: BridgeConfig,
    confine: Option<crate::restricted::Confine>,
}

impl Bridge {
    pub fn new(config: BridgeConfig) -> Self {
        let confine = if config.restricted {
            let cwd = config
                .cwd
                .clone()
                .map(std::path::PathBuf::from)
                .or_else(|| std::env::current_dir().ok());
            match cwd {
                Some(cwd) => match crate::restricted::Confine::new(&cwd, &config.add_dirs) {
                    Ok(confine) => Some(confine),
                    Err(error) => {
                        eprintln!("[crag-mcp] restricted 模式初始化失败（拒绝放行）: {error}");
                        None
                    }
                },
                None => {
                    eprintln!("[crag-mcp] restricted 模式缺少 cwd，拒绝放行");
                    None
                }
            }
        } else {
            None
        };
        Self { config, confine }
    }

    /// restricted 且初始化失败时必须拒绝，而不是退化成不校验。
    fn confine_required(&self) -> bool {
        self.config.restricted
    }

    pub fn tools(&self) -> &[Value] {
        &self.config.tools
    }

    /// 处理一条请求。
    pub async fn handle(&self, request: &Value) -> Option<Value> {
        let mut response = self.handle_inner(request).await?;
        // 请求没有 id（通知式请求）时，响应里也不要出现 id 字段。
        if request.get("id").is_none() {
            if let Some(object) = response.as_object_mut() {
                object.remove("id");
            }
        }
        Some(response)
    }

    async fn handle_inner(&self, request: &Value) -> Option<Value> {
        if request.get("jsonrpc").and_then(|v| v.as_str()) != Some("2.0") {
            return None;
        }
        // 官方 CLI 的 initialize 不带 id；厂商桥用 JS 的 undefined 语义把 id 字段整个省掉，
        // 我们原来补成 null，会让客户端把它当成非法响应。
        let id = request.get("id").cloned().unwrap_or(Value::Null);
        let method = request.get("method").and_then(|v| v.as_str()).unwrap_or("");
        // 通知：没有 id 也不需要回包。
        if method.starts_with("notifications/") {
            return None;
        }
        match method {
            "initialize" => Some(json!({
                "jsonrpc": "2.0",
                "id": id,
                "result": {
                    "protocolVersion": request
                        .get("params")
                        .and_then(|p| p.get("protocolVersion"))
                        .and_then(|v| v.as_str())
                        .unwrap_or(DEFAULT_PROTOCOL_VERSION),
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "crag-v2", "version": SERVER_INFO_VERSION},
                }
            })),
            "tools/list" => Some(json!({
                "jsonrpc": "2.0",
                "id": id,
                "result": {"tools": self.config.tools},
            })),
            "ping" => Some(json!({"jsonrpc": "2.0", "id": id, "result": {}})),
            "tools/call" => Some(self.call_tool(id, request).await),
            other => Some(json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": {"code": -32601, "message": format!("method not found: {other}")},
            })),
        }
    }

    async fn call_tool(&self, id: Value, request: &Value) -> Value {
        let params = request.get("params").cloned().unwrap_or(Value::Null);
        let name = params.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let known = self
            .config
            .tools
            .iter()
            .any(|tool| tool.get("name").and_then(|v| v.as_str()) == Some(name));
        if !known {
            return json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": {"code": -32603, "message": format!("unknown tool: {name}")},
            });
        }
        let arguments = params
            .get("arguments")
            .filter(|v| v.is_object())
            .cloned()
            .unwrap_or_else(|| json!({}));

        // `--restricted`：路径参数必须在白名单内，否则不回调、直接报工具错误。
        if self.confine_required() {
            let Some(confine) = self.confine.as_ref() else {
                return json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "error": {"code": -32603, "message": "restricted 模式未就绪，拒绝执行"},
                });
            };
            for (field, raw) in crate::restricted::path_arguments(&arguments) {
                if let Err(error) = confine.check(&raw) {
                    return json!({
                        "jsonrpc": "2.0",
                        "id": id,
                        "result": {
                            "content": [{"type": "text", "text": format!("{field}: {error}")}],
                            "isError": true
                        }
                    });
                }
            }
        }
        let payload = json!({"name": name, "arguments": arguments});
        let bytes = serde_json::to_vec(&payload).unwrap_or_default();
        match crate::http::one::post(
            &self.config.callback_url,
            &[
                ("content-type", "application/json".to_string()),
                ("accept", "application/json".to_string()),
            ],
            &bytes,
            None,
        )
        .await
        {
            Ok(response) => {
                let status = response.status;
                let parsed: Value = serde_json::from_slice(&response.body).unwrap_or(Value::Null);
                if !(200..300).contains(&status) {
                    let message = parsed
                        .get("error")
                        .and_then(|e| e.get("message"))
                        .and_then(|v| v.as_str())
                        .map(str::to_string)
                        .unwrap_or_else(|| format!("callback HTTP {status}"));
                    return json!({
                        "jsonrpc": "2.0",
                        "id": id,
                        "error": {"code": -32603, "message": message},
                    });
                }
                let content = match parsed.get("content") {
                    Some(Value::Array(items)) => Value::Array(items.clone()),
                    other => json!([{
                        "type": "text",
                        "text": other.and_then(|v| v.as_str()).unwrap_or("").to_string()
                    }]),
                };
                json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "result": {
                        "content": content,
                        "isError": parsed.get("isError").and_then(|v| v.as_bool()).unwrap_or(false),
                    }
                })
            }
            Err(error) => json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": {"code": -32603, "message": error.to_string()},
            }),
        }
    }
}

/// 读 stdin、写 stdout。同时兼容两种分帧：
/// - NDJSON（每行一个 JSON，MCP stdio 规范）
/// - `Content-Length: N\r\n\r\n<json>`（LSP 风格；官方 CLI 实测用这种，
///   原来只认行分隔会导致每行解析失败被静默跳过，CC 卡在等工具结果）
pub async fn serve_stdio(bridge: Bridge) -> io::Result<()> {
    use tokio::io::AsyncBufReadExt;
    let mut stdin = BufReader::new(tokio::io::stdin());
    let mut stdout = tokio::io::stdout();
    loop {
        let mut line = String::new();
        if stdin.read_line(&mut line).await? == 0 {
            break;
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let request = if trimmed.starts_with('{') {
            match serde_json::from_str::<Value>(trimmed) {
                Ok(value) => value,
                Err(_) => continue,
            }
        } else {
            // 头部行：找 Content-Length，吃掉空行后按长度读正文。
            let mut length: Option<usize> = None;
            let mut header = trimmed.to_string();
            loop {
                if let Some(rest) = header.to_ascii_lowercase().strip_prefix("content-length:") {
                    length = rest.trim().parse::<usize>().ok();
                }
                header.clear();
                if stdin.read_line(&mut header).await? == 0 {
                    break;
                }
                if header.trim().is_empty() {
                    break;
                }
            }
            let Some(length) = length else { continue };
            let mut body = vec![0u8; length];
            if tokio::io::AsyncReadExt::read_exact(&mut stdin, &mut body)
                .await
                .is_err()
            {
                break;
            }
            match serde_json::from_slice::<Value>(&body) {
                Ok(value) => value,
                Err(_) => continue,
            }
        };
        if let Some(response) = bridge.handle(&request).await {
            // 客户端带 progressToken 时回一条 100% 进度（MCP 规范允许，CC 会记进 debug 日志）。
            if let Some(token) = request
                .get("params")
                .and_then(|p| p.get("_meta"))
                .and_then(|m| m.get("progressToken"))
            {
                let notice = json!({
                    "jsonrpc": "2.0",
                    "method": "notifications/progress",
                    "params": {"progressToken": token, "progress": 1, "total": 1},
                });
                let mut line = serde_json::to_string(&notice).unwrap_or_default();
                line.push('\n');
                stdout.write_all(line.as_bytes()).await?;
                stdout.flush().await?;
            }
            // 客户端带了 progressToken 就先回一条 100% 进度：CC 的 TUI 派发在收到
            // 首条 progress 前不会把结果并入回合，缺了它会一直等到 120 s 后台兜底。
            if let Some(token) = request
                .get("params")
                .and_then(|p| p.get("_meta"))
                .and_then(|m| m.get("progressToken"))
            {
                if request.get("method").and_then(|v| v.as_str()) == Some("tools/call") {
                    let notice = json!({
                        "jsonrpc": "2.0",
                        "method": "notifications/progress",
                        "params": {"progressToken": token, "progress": 1, "total": 1},
                    });
                    let mut line = serde_json::to_string(&notice).unwrap_or_default();
                    line.push('\n');
                    stdout.write_all(line.as_bytes()).await?;
                    stdout.flush().await?;
                }
            }
            let mut text = serde_json::to_string(&response).unwrap_or_default();
            text.push('\n');
            stdout.write_all(text.as_bytes()).await?;
            stdout.flush().await?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::io::AsyncReadExt;
    use std::sync::Arc;
    use tokio::sync::oneshot;

    fn bridge() -> Bridge {
        Bridge::new(BridgeConfig {
            callback_url: "http://127.0.0.1:1/callback".into(),
            tools: vec![json!({"name": "read_file", "description": "d", "inputSchema": {"type": "object"}})],
            restricted: false,
            cwd: None,
            add_dirs: Vec::new(),
        })
    }

    #[tokio::test]
    async fn initialize_echoes_protocol_and_identity() {
        let response = bridge()
            .handle(&json!({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18"}}))
            .await
            .unwrap();
        assert_eq!(response["result"]["protocolVersion"], "2025-06-18");
        assert_eq!(response["result"]["serverInfo"]["name"], "crag-v2");
        assert_eq!(response["result"]["serverInfo"]["version"], "2.1.88-v2");
        assert_eq!(response["result"]["capabilities"]["tools"], json!({}));
    }

    #[tokio::test]
    async fn initialize_defaults_protocol_version() {
        let response = bridge()
            .handle(&json!({"jsonrpc": "2.0", "id": 1, "method": "initialize"}))
            .await
            .unwrap();
        assert_eq!(response["result"]["protocolVersion"], DEFAULT_PROTOCOL_VERSION);
    }

    #[tokio::test]
    async fn tools_list_returns_configured_tools() {
        let response = bridge()
            .handle(&json!({"jsonrpc": "2.0", "id": 2, "method": "tools/list"}))
            .await
            .unwrap();
        assert_eq!(response["result"]["tools"].as_array().unwrap().len(), 1);
        assert_eq!(response["result"]["tools"][0]["name"], "read_file");
    }

    #[tokio::test]
    async fn notifications_are_not_answered() {
        assert!(bridge()
            .handle(&json!({"jsonrpc": "2.0", "method": "notifications/initialized"}))
            .await
            .is_none());
        assert!(bridge()
            .handle(&json!({"jsonrpc": "2.0", "method": "notifications/cancelled", "params": {}}))
            .await
            .is_none());
    }

    #[tokio::test]
    async fn unknown_method_and_unknown_tool_are_errors() {
        let response = bridge()
            .handle(&json!({"jsonrpc": "2.0", "id": 3, "method": "resources/list"}))
            .await
            .unwrap();
        assert_eq!(response["error"]["code"], -32601);

        let response = bridge()
            .handle(&json!({"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "nope"}}))
            .await
            .unwrap();
        assert_eq!(response["error"]["code"], -32603);
        assert!(response["error"]["message"].as_str().unwrap().contains("unknown tool"));
    }

    /// 真起一个 HTTP callback，验证 tools/call 的请求体与响应映射。
    
    /// restricted 模式：越界路径不回调，白名单内正常回调。
    #[tokio::test]
    async fn restricted_mode_blocks_outside_paths_without_callback() {
        let dir = std::env::temp_dir().join(format!("cragv2-mcp-confine-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();

        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();
        tokio::spawn(async move {
            loop {
                let Ok((mut socket, _)) = listener.accept().await else { return };
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
                let split = buf.windows(4).position(|w| w == b"\r\n\r\n").unwrap();
                let _ = tx.send(String::from_utf8_lossy(&buf[split + 4..]).to_string());
                let payload = r#"{"content":[{"type":"text","text":"ok"}],"isError":false}"#;
                let response = format!(
                    "HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{payload}",
                    payload.len()
                );
                let _ = socket.write_all(response.as_bytes()).await;
            }
        });

        let bridge = Bridge::new(BridgeConfig {
            callback_url: format!("http://{addr}/callback"),
            tools: vec![json!({"name": "read_file"})],
            restricted: true,
            cwd: Some(dir.to_string_lossy().to_string()),
            add_dirs: Vec::new(),
        });

        // 越界：isError，且回调一次都不该发生。
        let response = bridge
            .handle(&json!({
                "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                "params": {"name": "read_file", "arguments": {"path": "../escape.txt"}}
            }))
            .await
            .unwrap();
        assert_eq!(response["result"]["isError"], true);
        assert!(response["result"]["content"][0]["text"]
            .as_str()
            .unwrap()
            .starts_with("path:"));
        let hit = tokio::time::timeout(std::time::Duration::from_millis(200), rx.recv()).await;
        assert!(hit.is_err(), "越界路径竟然回调了");

        // 白名单内：正常回调。
        let response = bridge
            .handle(&json!({
                "jsonrpc": "2.0", "id": 2, "method": "tools/call",
                "params": {"name": "read_file", "arguments": {"path": "inside.txt"}}
            }))
            .await
            .unwrap();
        assert_eq!(response["result"]["isError"], false);
        assert_eq!(response["result"]["content"][0]["text"], "ok");
        let sent = tokio::time::timeout(std::time::Duration::from_secs(5), rx.recv())
            .await
            .expect("回调应到达")
            .unwrap();
        let sent: Value = serde_json::from_str(&sent).unwrap();
        assert_eq!(sent["arguments"]["path"], "inside.txt");

        std::fs::remove_dir_all(&dir).ok();
    }

    #[tokio::test]
    async fn tools_call_posts_to_callback_and_maps_content() {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let (tx, rx) = oneshot::channel::<String>();
        let tx = Arc::new(std::sync::Mutex::new(Some(tx)));
        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut buf = Vec::new();
            let mut chunk = [0u8; 4096];
            loop {
                let n = socket.read(&mut chunk).await.unwrap();
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
            let split = buf.windows(4).position(|w| w == b"\r\n\r\n").unwrap();
            let body = String::from_utf8_lossy(&buf[split + 4..]).to_string();
            if let Some(sender) = tx.lock().unwrap().take() {
                let _ = sender.send(body);
            }
            let payload = r#"{"content":[{"type":"text","text":"file body"}],"isError":false}"#;
            let response = format!(
                "HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{payload}",
                payload.len()
            );
            socket.write_all(response.as_bytes()).await.unwrap();
        });

        let bridge = Bridge::new(BridgeConfig {
            callback_url: format!("http://{addr}/callback"),
            tools: vec![json!({"name": "read_file"})],
            restricted: false,
            cwd: None,
            add_dirs: Vec::new(),
        });
        let response = bridge
            .handle(&json!({
                "jsonrpc": "2.0",
                "id": 9,
                "method": "tools/call",
                "params": {"name": "read_file", "arguments": {"path": "/tmp/x"}}
            }))
            .await
            .unwrap();
        assert_eq!(response["result"]["content"][0]["text"], "file body");
        assert_eq!(response["result"]["isError"], false);

        let sent: Value = serde_json::from_str(&rx.await.unwrap()).unwrap();
        assert_eq!(sent["name"], "read_file");
        assert_eq!(sent["arguments"]["path"], "/tmp/x");
    }
}
