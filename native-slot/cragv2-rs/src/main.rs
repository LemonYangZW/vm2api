//! `crag-v2` 入口：参数、装配、信号。
//!
//! 与控制面 `rust-kernel-supervisor.mjs` 的拉起方式一致：
//!
//! ```text
//! crag-v2 --gateway-worker --config /run/kin/kernel.json
//! ```
//!
//! 也可独立跑：`crag-v2 --config testdata/kernel.json --socket /tmp/crag.sock`。

use std::process::ExitCode;
use std::sync::Arc;
use std::time::Duration;

use cragv2::config::{KernelConfig, RuntimePaths};
use cragv2::gateway::{serve, GatewayState};
use cragv2::http::client::UpstreamClient;
use cragv2::http::proxy::Proxy;
use cragv2::credential::Store;
use cragv2::mcp::{serve_stdio, Bridge, BridgeConfig};
use cragv2::oauth::Refresher;
use cragv2::slot::CragHost;
use cragv2::VERSION;

struct Args {
    config: Option<String>,
    socket: Option<String>,
    /// 内建假 CLI（离线演示/联调用）。
    fake_cli: bool,
    /// 打印能力声明后退出（面板用它探测宿主订阅支持，见 vm-runtime.mjs）。
    license_capabilities: bool,
    version: bool,
    help: bool,
    /// 无法识别的参数：必须报错退出，不能默默起网关（会被探测方当成挂住的子进程）。
    unknown: Vec<String>,
}

fn parse_args() -> Args {
    let mut args = Args {
        config: None,
        socket: None,
        fake_cli: false,
        license_capabilities: false,
        version: false,
        help: false,
        unknown: Vec::new(),
    };
    let mut iter = std::env::args().skip(1);
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--config" | "-c" => args.config = iter.next(),
            "--socket" | "-s" => args.socket = iter.next(),
            "--fake-cli" => args.fake_cli = true,
            "--license-capabilities" => args.license_capabilities = true,
            "--version" | "-V" => args.version = true,
            "--help" | "-h" => args.help = true,
            // 控制面固定传入，语义由配置文件承载。
            "--gateway-worker" => {}
            other if other.starts_with("--config=") => {
                args.config = Some(other.trim_start_matches("--config=").to_string())
            }
            other if other.starts_with("--socket=") => {
                args.socket = Some(other.trim_start_matches("--socket=").to_string())
            }
            other => args.unknown.push(other.to_string()),
        }
    }
    args
}

const HELP: &str = "\
crag-v2 — CRAG v2 native kernel (Rust)

USAGE:
    crag-v2 --gateway-worker --config <kernel.json> [--socket <path>]
    crag-v2 --config <kernel.json> --fake-cli

OPTIONS:
    -c, --config <path>   kernel.json 路径（dataplane/slots_per_worker/cli_bin）
    -s, --socket <path>   Unix socket 覆盖；默认 <run_dir>/kernel.sock
        --fake-cli        用内建假 CLI 起槽位（离线联调）
    -V, --version         打印版本
    -h, --help            打印帮助
        --license-capabilities  打印能力声明（JSON）后退出

SUBCOMMANDS:
    mcp-bridge --config <mcp.json>   stdio JSON-RPC 工具桥（crag_tools）
    probe --config <kernel.json>     真机前自检（凭据 / 代理 / TLS-h2 / 非推理端点）

ENDPOINTS (unix socket):
    GET  /internal/health
    POST /internal/v1/messages   {body,headers,stream,...}
    POST /internal/v1/cancel     {request_id}
    GET  /v1/models
";

fn fake_cli_command() -> Vec<String> {
    let script = r#"
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  let f; try { f = JSON.parse(line) } catch { return }
  if (f.type !== 'user') return;
  const send = (o) => process.stdout.write(JSON.stringify(o) + '\n');
  send({ type: 'stream_event', session_id: f.session_id, event: { type: 'message_start',
    message: { id: 'msg_fake', type: 'message', role: 'assistant', model: f.model || 'claude-opus-5-5', content: [] } } });
  send({ type: 'stream_event', session_id: f.session_id, event: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } } });
  send({ type: 'stream_event', session_id: f.session_id, event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'pong' } } });
  send({ type: 'stream_event', session_id: f.session_id, event: { type: 'content_block_stop', index: 0 } });
  send({ type: 'stream_event', session_id: f.session_id, event: { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { input_tokens: 3, output_tokens: 1 } } });
  send({ type: 'result', subtype: 'success', is_error: false, session_id: f.session_id, stop_reason: 'end_turn', result: 'pong', usage: { input_tokens: 3, output_tokens: 1 } });
});
"#;
    vec!["node".to_string(), "-e".to_string(), script.to_string()]
}

/// 能力声明：面板用 `crag-v2 --license-capabilities` 探测，期望一行 JSON 后退出。
///
/// 只声明**真实**能力：宿主订阅读（CRAGH1）与席位由面板 + 自建授权服务承载，
/// 内核不参与席位回收，所以 `host_subscription_reclaim` 报 0。
/// 报 `host_subscription: 0` 与当前面板行为一致（探测失败即不支持），
/// 避免修一个进程泄漏的同时改变槽位准入逻辑。
fn license_capabilities_json() -> &'static str {
    r#"{"host_subscription":0,"host_subscription_reclaim":0}"#
}

/// 桥启动落盘标记：Claude Code 会吞掉子进程 stderr，
/// 想知道"CLI 到底有没有加载我们的 MCP 服务器"只能自己写文件。
fn bridge_mark(what: &str) {
    use std::io::Write;
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open("/tmp/crag-bridge.log")
    {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0);
        let _ = writeln!(file, "{stamp} {what}");
    }
}

#[tokio::main]
async fn main() -> ExitCode {
    // 子命令：`crag-v2 mcp-bridge --config <path>`（MCP stdio 工具桥）。
    let argv: Vec<String> = std::env::args().skip(1).collect();
    if argv.first().map(String::as_str) == Some("mcp-bridge") {
        let config = argv
            .iter()
            .position(|arg| arg == "--config" || arg == "-c")
            .and_then(|index| argv.get(index + 1))
            .cloned();
        let Some(path) = config else {
            bridge_mark("argv-missing-config");
        eprintln!("[crag-mcp] --config is required");
            return ExitCode::FAILURE;
        };
        let text = match std::fs::read_to_string(&path) {
            Ok(text) => text,
            Err(error) => {
                eprintln!("[crag-mcp] {path}: {error}");
                return ExitCode::FAILURE;
            }
        };
        bridge_mark("started");
        let config = match BridgeConfig::parse(&text) {
            Ok(config) => config,
            Err(error) => {
                eprintln!("[crag-mcp] {error}");
                return ExitCode::FAILURE;
            }
        };
        eprintln!(
            "[crag-mcp] {} tools -> {}",
            config.tools.len(),
            config.callback_url
        );
        return match serve_stdio(Bridge::new(config)).await {
            Ok(()) => ExitCode::SUCCESS,
            Err(error) => {
                eprintln!("[crag-mcp] {error}");
                ExitCode::FAILURE
            }
        };
    }

    // 子命令：`crag-v2 probe --config <path>`（真机前自检，不发推理请求）。
    if argv.first().map(String::as_str) == Some("probe") {
        let config = argv
            .iter()
            .position(|arg| arg == "--config" || arg == "-c")
            .and_then(|index| argv.get(index + 1))
            .cloned();
        let Some(path) = config else {
            eprintln!("[crag] probe: --config is required");
            return ExitCode::FAILURE;
        };
        let config = match KernelConfig::load(std::path::Path::new(&path)) {
            Ok(config) => config,
            Err(error) => {
                eprintln!("[crag] probe: {error}");
                return ExitCode::FAILURE;
            }
        };
        let report = cragv2::probe::run(&config).await;
        print!("{}", report.render());
        let code = report.exit_code();
        return if code == 0 {
            ExitCode::SUCCESS
        } else {
            ExitCode::from(code as u8)
        };
    }

    let args = parse_args();
    if args.help {
        print!("{HELP}");
        return ExitCode::SUCCESS;
    }
    if args.version {
        println!("{VERSION} (CRAG v2 native kernel; rust)");
        return ExitCode::SUCCESS;
    }
    if args.license_capabilities {
        // 面板用 `docker exec ... crag-v2 --license-capabilities` 探测能力，
        // 期望 stdout 是一行 JSON 后立即退出（vm-runtime.mjs 里 assertCragSubscriptionTarget）。
        // 我们只声明真正具备的能力：宿主订阅（CRAGH1 / 席位）由面板侧与自建授权服务承载，
        // 内核不参与席位回收，因此 reclaim 报 0。
        println!("{}", license_capabilities_json());
        return ExitCode::SUCCESS;
    }
    if !args.unknown.is_empty() {
        eprintln!("[crag] unknown argument(s): {}", args.unknown.join(" "));
        eprint!("{HELP}");
        return ExitCode::from(2);
    }

    let config = match args.config.as_deref() {
        Some(path) => match KernelConfig::load(std::path::Path::new(path)) {
            Ok(config) => config,
            Err(error) => {
                eprintln!("[crag] config: {error}");
                return ExitCode::FAILURE;
            }
        },
        None => KernelConfig::default(),
    };
    if let Err(error) = config.validate() {
        eprintln!("[crag] config: {error}");
        return ExitCode::FAILURE;
    }
    eprintln!("[crag] hop mode = {}", config.mode_label());
    let paths = RuntimePaths::resolve(&config);
    let socket = args
        .socket
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| paths.socket_path.clone());

    let slots = config.slots();

    // 直连模式不需要槽位 CLI：先定 hop 模式，再决定要不要拉起 CLI。
    let upstream = if config.is_native() {
        eprintln!("[crag] hop mode: native cli -> {}", config.cli_bin());
        None
    } else if config.direct() {
        let base = config.upstream_base();
        let proxy = match Proxy::from_settings(&config.proxy_settings()) {
            Ok(proxy) => proxy,
            Err(error) => {
                eprintln!("[crag] proxy: {error}");
                return ExitCode::FAILURE;
            }
        };
        let credential_path = config.credential_path();
        let store = Arc::new(Store::new(credential_path.clone()));
        let mut refresher = Refresher::new(config.oauth_token_url())
            .with_store(Arc::clone(&store));
        refresher.skew_ms = config.refresh_skew_seconds() * 1000;
        refresher.ca_pem = config.upstream_ca.clone().map(std::path::PathBuf::from);
        let refresher = Arc::new(refresher);
        match UpstreamClient::new(&base, config.upstream_ca.clone().map(std::path::PathBuf::from)) {
            Ok(client) => {
                let egress = match &proxy {
                    Some(Proxy::Socks5 { host, port, remote_dns, .. }) => format!(
                        "socks5{}://{host}:{port}",
                        if *remote_dns { "h" } else { "" }
                    ),
                    Some(Proxy::Http { host, port, .. }) => format!("http://{host}:{port}"),
                    None => "direct".to_string(),
                };
                let has_credential = store.load().map(|(credential, _)| credential.valid()).unwrap_or(false);
                eprintln!(
                    "[crag] hop mode: direct h2/tls -> {base} (egress={egress}, credential={credential_path} present={has_credential})"
                );
                Some(Arc::new(
                    client.with_proxy(proxy).with_refresher(Arc::clone(&refresher)),
                ))
            }
            Err(error) => {
                eprintln!("[crag] upstream {base}: {error}");
                return ExitCode::FAILURE;
            }
        }
    } else {
        eprintln!("[crag] hop mode: slot cli");
        None
    };

    // 官方 bundle 自己发上游请求：把出口配置转成代理环境变量交给槽位 CLI。
    let proxy_env: Vec<(String, String)> = match config.proxy_settings().url {
        Some(url) if !url.trim().is_empty() => vec![
            ("HTTPS_PROXY".to_string(), url.clone()),
            ("HTTP_PROXY".to_string(), url.clone()),
            ("ALL_PROXY".to_string(), url),
            ("NO_PROXY".to_string(), "127.0.0.1,localhost".to_string()),
        ],
        _ => Vec::new(),
    };
    if !proxy_env.is_empty() {
        // 绝不打印含密码的 URL
        eprintln!(
            "[crag] slot egress proxy: {}",
            cragv2::http::proxy::redact_url(&proxy_env[0].1)
        );
    }

    // TUI 通路：PTY 驱动官方 CLI（出站请求与真实安装同形）。
    let tui_pool = if config.is_tui() {
        cragv2::tui::ensure_auto_updates_off();
        let upstream_base = config.upstream_base();
        let mut env = proxy_env.clone();
        if upstream_base.trim_end_matches('/') != "https://api.anthropic.com" {
            env.push(("ANTHROPIC_BASE_URL".to_string(), upstream_base));
        }
        let host = cragv2::native::Host {
            cli_bin: config.claude_bin().unwrap_or_else(|| config.cli_bin()),
            cwd: std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")),
            env,
            tap_enabled: false,
        };
        eprintln!("[crag] hop mode: tui (pty) -> {}", host.cli_bin);
        Some(std::sync::Arc::new(cragv2::tui::TuiPool::new(
            std::sync::Arc::new(host),
            std::time::Duration::from_secs(config.session_idle_ttl_seconds()),
            config.session_slots(),
        )))
    } else {
        None
    };

    // 原生通路：内核只拉起官方 CLI，不在自己手里拼请求。
    let native_host = if config.is_native() {
        let upstream_base = config.upstream_base();
        let mut env = proxy_env.clone();
        // vendor 不覆盖 base_url；只有配置显式指了非官方上游才转给 CLI。
        if upstream_base.trim_end_matches('/') != "https://api.anthropic.com" {
            env.push(("ANTHROPIC_BASE_URL".to_string(), upstream_base));
        }
        let host = cragv2::native::Host {
            cli_bin: config.cli_bin(),
            cwd: std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")),
            env,
            tap_enabled: false,
        };
        // 空闲回收跟面板的会话 TTL 对齐（见 config::session_idle_ttl_seconds）。
        let max_sessions = config.session_slots();
        let tool_timeout = std::time::Duration::from_secs(config.tool_timeout_seconds());
        eprintln!(
            "[crag] native pool: idle={}s max_sessions={} tool_timeout={}s",
            config.session_idle_ttl_seconds(),
            max_sessions,
            tool_timeout.as_secs()
        );
        let pool = std::sync::Arc::new(cragv2::native::Pool::new(
            std::sync::Arc::new(host),
            std::time::Duration::from_secs(config.session_idle_ttl_seconds()),
            max_sessions,
            tool_timeout,
        ));
        // MCP 回调服务：bridge 子进程把 tools/call POST 回来，内核 park 等续跳。
        match cragv2::native::serve_callback(std::sync::Arc::clone(&pool)).await {
            Ok(addr) => {
                eprintln!("[crag] mcp callback: http://127.0.0.1:{}/_crag-v2/mcp/<session>", addr.port());
                pool.set_callback_base(format!("http://127.0.0.1:{}/_crag-v2/mcp", addr.port()));
            }
            Err(error) => eprintln!("[crag] mcp callback disabled: {error}"),
        }
        Some(pool)
    } else {
        None
    };

    let host = if upstream.is_some() || native_host.is_some() || tui_pool.is_some() {
        None
    } else {
        let command = if args.fake_cli {
            fake_cli_command()
        } else {
            let mut command = vec![config.cli_bin()];
            if let Some(extra) = &config.cli_args {
                command.extend(extra.iter().cloned());
            }
            command.extend(config.crag_cli_args());
            command
        };
        match CragHost::spawn(command, slots, &proxy_env).await {
            Ok(host) => Some(host),
            Err(error) => {
                eprintln!("[crag] spawn cli failed: {error}");
                return ExitCode::FAILURE;
            }
        }
    };

    // TUI 模式下的回调载体（不 spawn，仅持有 pending 表与回调基址）。
    let callback_pool = if tui_pool.is_some() {
        let base = config.claude_bin().unwrap_or_else(|| config.cli_bin());
        let host = cragv2::native::Host {
            cli_bin: base,
            cwd: std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")),
            env: Vec::new(),
            tap_enabled: false,
        };
        let pool = std::sync::Arc::new(cragv2::native::Pool::new(
            std::sync::Arc::new(host),
            std::time::Duration::from_secs(config.session_idle_ttl_seconds()),
            config.session_slots(),
            std::time::Duration::from_secs(config.tool_timeout_seconds()),
        ));
        match cragv2::native::serve_callback(std::sync::Arc::clone(&pool)).await {
            Ok(addr) => {
                eprintln!(
                    "[crag] tui mcp callback: http://127.0.0.1:{}/_crag-v2/mcp/<session>",
                    addr.port()
                );
                pool.set_callback_base(format!("http://127.0.0.1:{}/_crag-v2/mcp", addr.port()));
            }
            Err(error) => eprintln!("[crag] tui mcp callback disabled: {error}"),
        }
        Some(pool)
    } else {
        None
    };

    let usage_config = if config.usage_probe_enabled() {
        Some(GatewayState::usage_config(
            config.usage_base(),
            config.credential_path(),
            config.upstream_ca.clone().map(std::path::PathBuf::from),
        ))
    } else {
        None
    };

    let dataplane = config.dataplane.clone().unwrap_or_else(|| "crag".to_string());
    let state = Arc::new(match (upstream, native_host) {
        (_, Some(pool)) => {
            let mut state = GatewayState::native(pool, paths.internal_token(), &dataplane, slots);
            if let Some(usage) = usage_config.clone() {
                state = state.with_usage(usage);
            }
            state
        }
        (Some(upstream), None) => GatewayState::direct(upstream, paths.internal_token(), &dataplane, slots),
        (None, None) if tui_pool.is_some() => {
            let pool = tui_pool.clone().expect("checked above");
            let mut state = GatewayState::tui(pool, paths.internal_token(), &dataplane, slots);
            // 工具回调/park 的载体：同一个 Host，但 TUI 模式下不会 spawn 它。
            if let Some(native) = callback_pool.clone() {
                state = state.with_native(native);
            }
            if let Some(usage) = usage_config.clone() {
                state = state.with_usage(usage);
            }
            state
        }
        (None, None) => {
            let host = host.as_ref().expect("slot mode requires cli host");
            GatewayState::slot_only(
                Arc::clone(host),
                paths.internal_token(),
                &dataplane,
            )
        }
    });
    let bound = match serve(&socket, Arc::clone(&state)).await {
        Ok(bound) => bound,
        Err(error) => {
            eprintln!("[crag] bind {}: {error}", socket.display());
            if let Some(host) = &host {
                host.close().await;
            }
            return ExitCode::FAILURE;
        }
    };
    if let Some(addr) = config.tcp_listen.as_deref() {
        match cragv2::gateway::serve_tcp(addr, bound.clone()).await {
            Ok(bound) => eprintln!("[crag] tcp listen: {bound}"),
            Err(error) => eprintln!("[crag] tcp listen {addr}: {error}"),
        }
    }
    eprintln!(
        "[crag] {VERSION} listening on {} (slots={slots}, cli_pid={:?}, dataplane={})",
        bound.display(),
        host.as_ref().and_then(|h| h.pid()),
        state.dataplane
    );

    // 信号：SIGINT/SIGTERM 收尾。
    wait_for_signal().await;
    eprintln!("[crag] shutting down");
    state.close().await;
    let _ = std::fs::remove_file(&bound);
    tokio::time::sleep(Duration::from_millis(10)).await;
    ExitCode::SUCCESS
}

async fn wait_for_signal() {
    #[cfg(unix)]
    {
        use tokio::signal::unix::{signal, SignalKind};
        let mut term = match signal(SignalKind::terminate()) {
            Ok(s) => s,
            Err(_) => {
                let _ = tokio::signal::ctrl_c().await;
                return;
            }
        };
        tokio::select! {
            _ = tokio::signal::ctrl_c() => {}
            _ = term.recv() => {}
        }
    }
    #[cfg(not(unix))]
    {
        let _ = tokio::signal::ctrl_c().await;
    }
}

#[cfg(test)]
mod tests {
    use super::license_capabilities_json;

    #[test]
    fn license_capabilities_is_one_line_json() {
        let raw = license_capabilities_json();
        let parsed: serde_json::Value = serde_json::from_str(raw).expect("valid json");
        assert!(parsed.get("host_subscription").and_then(|v| v.as_u64()).is_some());
        assert!(parsed
            .get("host_subscription_reclaim")
            .and_then(|v| v.as_u64())
            .is_some());
        assert!(!raw.contains("\n"), "panel parses a single line");
    }
}
