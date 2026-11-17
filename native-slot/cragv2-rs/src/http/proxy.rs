//! 出站代理拨号：SOCKS5 / SOCKS5H（项目现网口径）+ HTTP CONNECT 隧道。
//!
//! 真值：控制面 `worker/internal/config/config.go` —— `kernel.json` 只认
//! `proxy_url` 与 `proxy_required`，且 scheme 白名单是 `socks5` / `socks5h`
//! （`socks5h` 表示**由代理解析域名**，`socks5` 本地解析后发 IP）。
//! 环境变量：`KIN_PROXY_URL` / `KIN_PROXY_REQUIRED`（默认 true）。
//!
//! 规则（与现网一致）：`proxy_required && proxy_url 为空` → 直接失败，不静默直连；
//! 出口 IP 必须是控制面配的那个，宁可起不来也不能绕过。

use std::io;

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;

/// URL 脱敏：去掉 userinfo（`user:pass@`），只保留 scheme://host:port。
/// 任何日志/诊断输出都必须过这个函数 —— 代理密码不能进日志。
pub fn redact_url(url: &str) -> String {
    let (scheme, rest) = match url.split_once("://") {
        Some((scheme, rest)) => (scheme, rest),
        None => return url.to_string(),
    };
    match rest.rsplit_once('@') {
        Some((_, host)) => format!("{scheme}://{host}"),
        None => url.to_string(),
    }
}

/// 代理配置（来自 kernel.json / 环境变量）。
#[derive(Debug, Clone, Default)]
pub struct ProxySettings {
    pub url: Option<String>,
    pub required: bool,
}

impl ProxySettings {
    pub fn from_env() -> Self {
        let url = std::env::var("KIN_PROXY_URL").ok().filter(|v| !v.trim().is_empty());
        let required = match std::env::var("KIN_PROXY_REQUIRED") {
            Ok(value) => !matches!(value.trim(), "0" | "false" | "no" | ""),
            // 现网默认 `proxy_required = true`；但本机调试（无 URL）要能起，
            // 所以只有显式给了 URL 才默认必需。
            Err(_) => url.is_some(),
        };
        Self { url, required }
    }
}

/// 已解析的代理。
#[derive(Debug, Clone)]
pub enum Proxy {
    /// SOCKS5 隧道；`remote_dns` 对应 `socks5h`。
    Socks5 {
        host: String,
        port: u16,
        username: String,
        password: String,
        remote_dns: bool,
    },
    /// HTTP CONNECT 隧道（企业代理），`auth` 为预生成的 Basic 值。
    Http {
        host: String,
        port: u16,
        auth: Option<String>,
        tls: bool,
    },
}

impl Proxy {
    /// 解析 `socks5h://user:pass@host:1080` / `http://host:8080`。
    pub fn parse(raw: &str) -> io::Result<Self> {
        let raw = raw.trim();
        let (scheme, rest) = raw
            .split_once("://")
            .ok_or_else(|| io::Error::other(format!("proxy_url 缺少 scheme: {raw}")))?;
        let (userinfo, hostport) = match rest.rsplit_once('@') {
            Some((userinfo, hostport)) => (Some(userinfo), hostport),
            None => (None, rest),
        };
        let (username, password) = match userinfo {
            Some(info) => {
                let (user, pass) = info.split_once(':').unwrap_or((info, ""));
                (percent_decode(user), percent_decode(pass))
            }
            None => (String::new(), String::new()),
        };
        let (host, port) = split_host_port(hostport, scheme)?;
        match scheme.to_ascii_lowercase().as_str() {
            "socks5" => Ok(Proxy::Socks5 {
                host,
                port,
                username,
                password,
                remote_dns: false,
            }),
            "socks5h" => Ok(Proxy::Socks5 {
                host,
                port,
                username,
                password,
                remote_dns: true,
            }),
            "http" | "https" => {
                let auth = if username.is_empty() && password.is_empty() {
                    None
                } else {
                    Some(basic_auth(&username, &password))
                };
                Ok(Proxy::Http {
                    host,
                    port,
                    auth,
                    tls: scheme.eq_ignore_ascii_case("https"),
                })
            }
            other => Err(io::Error::other(format!(
                "不支持的代理 scheme {other}（只接受 socks5 / socks5h / http）"
            ))),
        }
    }

    /// 由配置构造；`required` 且空 URL 视为致命错误。
    pub fn from_settings(settings: &ProxySettings) -> io::Result<Option<Self>> {
        match settings.url.as_deref().filter(|v| !v.trim().is_empty()) {
            Some(url) => Ok(Some(Proxy::parse(url)?)),
            None if settings.required => Err(io::Error::other(
                "proxy_required 为 true 但 proxy_url 为空（拒绝直连出口）",
            )),
            None => Ok(None),
        }
    }

    /// 拨到目标（含隧道建立）。
    pub async fn dial(&self, host: &str, port: u16) -> io::Result<TcpStream> {
        match self {
            Proxy::Socks5 {
                host: proxy_host,
                port: proxy_port,
                username,
                password,
                remote_dns,
            } => {
                let mut stream = TcpStream::connect((proxy_host.as_str(), *proxy_port)).await?;
                stream.set_nodelay(true)?;
                socks5_handshake(
                    &mut stream,
                    host,
                    port,
                    username,
                    password,
                    *remote_dns,
                )
                .await?;
                Ok(stream)
            }
            Proxy::Http {
                host: proxy_host,
                port: proxy_port,
                auth,
                tls,
            } => {
                if *tls {
                    return Err(io::Error::other(
                        "https:// 代理需要 TLS 到代理本身，当前未实现（请用 http:// 或 socks5h://）",
                    ));
                }
                let mut stream = TcpStream::connect((proxy_host.as_str(), *proxy_port)).await?;
                stream.set_nodelay(true)?;
                http_connect(&mut stream, host, port, auth.as_deref()).await?;
                Ok(stream)
            }
        }
    }
}

fn split_host_port(hostport: &str, scheme: &str) -> io::Result<(String, u16)> {
    let default_port = match scheme.to_ascii_lowercase().as_str() {
        "https" => 443,
        _ => 1080,
    };
    // IPv6 字面量：[::1]:1080
    let (host, port) = if let Some(rest) = hostport.strip_prefix('[') {
        let (inner, tail) = rest
            .split_once(']')
            .ok_or_else(|| io::Error::other("代理地址 IPv6 括号不匹配"))?;
        let port = tail
            .strip_prefix(':')
            .and_then(|p| p.parse().ok())
            .unwrap_or(default_port);
        (inner.to_string(), port)
    } else {
        match hostport.rsplit_once(':') {
            Some((host, port)) if port.chars().all(|c| c.is_ascii_digit()) && !port.is_empty() => (
                host.to_string(),
                port.parse::<u16>()
                    .map_err(|e| io::Error::other(format!("代理端口: {e}")))?,
            ),
            _ => (hostport.to_string(), default_port),
        }
    };
    if host.is_empty() {
        return Err(io::Error::other("代理地址缺少 host"));
    }
    Ok((host, port))
}

fn percent_decode(value: &str) -> String {
    let bytes = value.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(&value[i + 1..i + 3], 16) {
                out.push(byte);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn basic_auth(user: &str, password: &str) -> String {
    format!("Basic {}", base64_encode(format!("{user}:{password}").as_bytes()))
}

fn base64_encode(input: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(input.len().div_ceil(3) * 4);
    for chunk in input.chunks(3) {
        let b = [
            chunk[0],
            *chunk.get(1).unwrap_or(&0),
            *chunk.get(2).unwrap_or(&0),
        ];
        out.push(TABLE[(b[0] >> 2) as usize] as char);
        out.push(TABLE[(((b[0] & 0x03) << 4) | (b[1] >> 4)) as usize] as char);
        out.push(if chunk.len() > 1 {
            TABLE[(((b[1] & 0x0f) << 2) | (b[2] >> 6)) as usize] as char
        } else {
            '='
        });
        out.push(if chunk.len() > 2 {
            TABLE[(b[2] & 0x3f) as usize] as char
        } else {
            '='
        });
    }
    out
}

/// SOCKS5 握手 + CONNECT（RFC 1928 / 1929）。
async fn socks5_handshake(
    stream: &mut TcpStream,
    host: &str,
    port: u16,
    username: &str,
    password: &str,
    remote_dns: bool,
) -> io::Result<()> {
    let with_auth = !username.is_empty() || !password.is_empty();
    let methods: &[u8] = if with_auth { &[0x00, 0x02] } else { &[0x00] };
    let mut greeting = vec![0x05, methods.len() as u8];
    greeting.extend_from_slice(methods);
    stream.write_all(&greeting).await?;
    stream.flush().await?;

    let mut reply = [0u8; 2];
    stream.read_exact(&mut reply).await?;
    if reply[0] != 0x05 {
        return Err(io::Error::other(format!("SOCKS5 版本不符: {:#04x}", reply[0])));
    }
    match reply[1] {
        0x00 => {}
        0x02 => {
            if !with_auth {
                return Err(io::Error::other("代理要求认证但未配置用户名密码"));
            }
            let mut auth = vec![0x01, username.len() as u8];
            auth.extend_from_slice(username.as_bytes());
            auth.push(password.len() as u8);
            auth.extend_from_slice(password.as_bytes());
            stream.write_all(&auth).await?;
            stream.flush().await?;
            let mut status = [0u8; 2];
            stream.read_exact(&mut status).await?;
            if status[1] != 0x00 {
                return Err(io::Error::other("SOCKS5 认证失败"));
            }
        }
        method => {
            return Err(io::Error::other(format!(
                "SOCKS5 代理不接受任何认证方式（method={method:#04x}）"
            )))
        }
    }

    // CONNECT
    let mut request = vec![0x05, 0x01, 0x00];
    if remote_dns || host.parse::<std::net::IpAddr>().is_err() {
        if host.len() > 255 {
            return Err(io::Error::other("SOCKS5 域名过长"));
        }
        request.push(0x03);
        request.push(host.len() as u8);
        request.extend_from_slice(host.as_bytes());
    } else {
        match host.parse::<std::net::IpAddr>().map_err(io::Error::other)? {
            std::net::IpAddr::V4(v4) => {
                request.push(0x01);
                request.extend_from_slice(&v4.octets());
            }
            std::net::IpAddr::V6(v6) => {
                request.push(0x04);
                request.extend_from_slice(&v6.octets());
            }
        }
    }
    request.extend_from_slice(&port.to_be_bytes());
    stream.write_all(&request).await?;
    stream.flush().await?;

    let mut head = [0u8; 4];
    stream.read_exact(&mut head).await?;
    if head[1] != 0x00 {
        return Err(io::Error::other(format!(
            "SOCKS5 CONNECT 被拒绝（rep={:#04x} {}）",
            head[1],
            socks5_reason(head[1])
        )));
    }
    // 丢弃 BND.ADDR / BND.PORT
    let addr_len = match head[3] {
        0x01 => 4,
        0x04 => 16,
        0x03 => {
            let mut len = [0u8; 1];
            stream.read_exact(&mut len).await?;
            len[0] as usize
        }
        other => return Err(io::Error::other(format!("SOCKS5 ATYP 非法: {other:#04x}"))),
    };
    let mut discard = vec![0u8; addr_len + 2];
    stream.read_exact(&mut discard).await?;
    Ok(())
}

fn socks5_reason(rep: u8) -> &'static str {
    match rep {
        0x01 => "general failure",
        0x02 => "connection not allowed",
        0x03 => "network unreachable",
        0x04 => "host unreachable",
        0x05 => "connection refused",
        0x06 => "TTL expired",
        0x07 => "command not supported",
        0x08 => "address type not supported",
        _ => "unknown",
    }
}

/// HTTP CONNECT 隧道。
async fn http_connect(
    stream: &mut TcpStream,
    host: &str,
    port: u16,
    auth: Option<&str>,
) -> io::Result<()> {
    let target = if host.contains(':') {
        format!("[{host}]:{port}")
    } else {
        format!("{host}:{port}")
    };
    let mut request = format!("CONNECT {target} HTTP/1.1\r\nHost: {target}\r\n");
    if let Some(auth) = auth {
        request.push_str(&format!("Proxy-Authorization: {auth}\r\n"));
    }
    request.push_str("\r\n");
    stream.write_all(request.as_bytes()).await?;
    stream.flush().await?;

    let mut head = Vec::with_capacity(256);
    let mut byte = [0u8; 1];
    while head.len() < 8192 {
        let n = stream.read(&mut byte).await?;
        if n == 0 {
            return Err(io::Error::other("代理在 CONNECT 应答前关闭连接"));
        }
        head.push(byte[0]);
        if head.ends_with(b"\r\n\r\n") {
            break;
        }
    }
    let text = String::from_utf8_lossy(&head).to_string();
    let status = text
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|code| code.parse::<u16>().ok())
        .unwrap_or(0);
    if status != 200 {
        return Err(io::Error::other(format!(
            "HTTP 代理 CONNECT 失败: {}",
            text.lines().next().unwrap_or("")
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_socks5h_with_credentials() {
        let proxy = Proxy::parse("socks5h://user:p%40ss@10.0.0.2:1080").unwrap();
        match proxy {
            Proxy::Socks5 { host, port, username, password, remote_dns } => {
                assert_eq!((host.as_str(), port, username.as_str(), password.as_str()), ("10.0.0.2", 1080, "user", "p@ss"));
                assert!(remote_dns);
            }
            _ => panic!("expected socks5"),
        }
    }

    #[test]
    fn socks5_without_h_resolves_locally() {
        let proxy = Proxy::parse("socks5://127.0.0.1:1080").unwrap();
        match proxy {
            Proxy::Socks5 { remote_dns, .. } => assert!(!remote_dns),
            _ => panic!("expected socks5"),
        }
    }

    #[test]
    fn parses_http_proxy_with_basic_auth() {
        let proxy = Proxy::parse("http://u:p@proxy.local:8080").unwrap();
        match proxy {
            Proxy::Http { host, port, auth, tls } => {
                assert_eq!((host.as_str(), port, tls), ("proxy.local", 8080, false));
                assert_eq!(auth.as_deref(), Some("Basic dTpw"));
            }
            _ => panic!("expected http"),
        }
    }

    #[test]
    fn rejects_unknown_scheme() {
        assert!(Proxy::parse("ftp://x:1").is_err());
        assert!(Proxy::parse("no-scheme").is_err());
    }

    #[test]
    fn required_without_url_is_fatal() {
        let settings = ProxySettings { url: None, required: true };
        assert!(Proxy::from_settings(&settings).is_err());
        let settings = ProxySettings { url: None, required: false };
        assert!(Proxy::from_settings(&settings).unwrap().is_none());
    }

    #[test]
    fn redacts_proxy_userinfo() {
        assert_eq!(
            redact_url("http://admin:secret@127.0.0.1:20884"),
            "http://127.0.0.1:20884"
        );
        assert_eq!(
            redact_url("socks5h://u:p@10.0.0.2:1080"),
            "socks5h://10.0.0.2:1080"
        );
        assert_eq!(redact_url("http://127.0.0.1:20884"), "http://127.0.0.1:20884");
    }

    #[test]
    fn base64_matches_reference() {
        assert_eq!(base64_encode(b"user:pass"), "dXNlcjpwYXNz");
        assert_eq!(base64_encode(b"a"), "YQ==");
        assert_eq!(base64_encode(b"ab"), "YWI=");
    }

    #[test]
    fn ipv6_proxy_address_is_split() {
        let proxy = Proxy::parse("socks5://[::1]:1080").unwrap();
        match proxy {
            Proxy::Socks5 { host, port, .. } => assert_eq!((host.as_str(), port), ("::1", 1080)),
            _ => panic!("expected socks5"),
        }
    }
}
