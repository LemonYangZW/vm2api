//! 最小 HTTP/1.1 客户端：MCP 回调（回环明文）与 OAuth token 端点（https）共用。
//!
//! 只实现 `< 1 MiB`、单请求单连接、`content-length` 或 `chunked` 响应；
//! 够我们的两个控制面交互用，不做连接池/重定向/压缩。

use std::io;
use std::path::Path;

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;

use crate::http::tls;

/// 上限：1 MiB。
pub const MAX_BODY: usize = 1024 * 1024;

/// 响应。
#[derive(Debug, Clone)]
pub struct Response {
    pub status: u16,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl Response {
    pub fn body_text(&self) -> String {
        String::from_utf8_lossy(&self.body).to_string()
    }

    pub fn header(&self, name: &str) -> Option<&str> {
        let name = name.to_ascii_lowercase();
        self.headers
            .iter()
            .find(|(key, _)| *key == name)
            .map(|(_, value)| value.as_str())
    }
}

/// 解 `Transfer-Encoding: chunked`（Node 对未知长度响应用它）。
pub fn decode_chunked(raw: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    let mut index = 0usize;
    while index < raw.len() {
        let Some(line_end) = raw[index..].windows(2).position(|w| w == b"\r\n") else {
            break;
        };
        let size_text = String::from_utf8_lossy(&raw[index..index + line_end]).to_string();
        let size_text = size_text.split(';').next().unwrap_or("").trim().to_string();
        let Ok(size) = usize::from_str_radix(&size_text, 16) else { break };
        index += line_end + 2;
        if size == 0 {
            break;
        }
        let end = (index + size).min(raw.len());
        out.extend_from_slice(&raw[index..end]);
        index = end + 2;
    }
    out
}

/// POST 便捷封装。
pub async fn post(
    url: &str,
    headers: &[(&str, String)],
    body: &[u8],
    ca: Option<&Path>,
) -> io::Result<Response> {
    request("POST", url, headers, Some(body), ca).await
}

/// 发一次 HTTP/1.1 请求（`body=None` 时按 GET 形态，不带 body）。
pub async fn request(
    method: &str,
    url: &str,
    headers: &[(&str, String)],
    body: Option<&[u8]>,
    ca: Option<&Path>,
) -> io::Result<Response> {
    let (scheme, rest) = url
        .split_once("://")
        .ok_or_else(|| io::Error::other(format!("url 缺少 scheme: {url}")))?;
    let https = scheme.eq_ignore_ascii_case("https");
    if !https && !scheme.eq_ignore_ascii_case("http") {
        return Err(io::Error::other(format!("不支持的 scheme: {scheme}")));
    }
    let (authority, path) = match rest.find('/') {
        Some(at) => (&rest[..at], &rest[at..]),
        None => (rest, "/"),
    };
    let (host, port) = match authority.rsplit_once(':') {
        Some((host, port)) => (
            host.to_string(),
            port.parse::<u16>()
                .map_err(|e| io::Error::other(format!("端口: {e}")))?,
        ),
        None => (authority.to_string(), if https { 443 } else { 80 }),
    };

    let tcp = TcpStream::connect((host.as_str(), port)).await?;
    tcp.set_nodelay(true)?;
    let mut writer: Box<dyn crate::http::client::Io> = if https {
        let config = tls::client_config_alpn(ca, &[b"http/1.1".to_vec()])?;
        Box::new(tls::connect_tls_stream(config, tcp, &host).await?)
    } else {
        Box::new(tcp)
    };

    let mut head = format!("{method} {path} HTTP/1.1\r\nhost: {authority}\r\n");
    for (key, value) in headers {
        head.push_str(&format!("{key}: {value}\r\n"));
    }
    if let Some(bytes) = body {
        head.push_str(&format!("content-length: {}\r\n", bytes.len()));
    }
    head.push_str("connection: close\r\n\r\n");
    writer.write_all(head.as_bytes()).await?;
    if let Some(bytes) = body {
        writer.write_all(bytes).await?;
    }
    writer.flush().await?;

    let mut raw = Vec::new();
    writer.read_to_end(&mut raw).await?;
    if raw.len() > MAX_BODY {
        raw.truncate(MAX_BODY);
    }
    let split = raw
        .windows(4)
        .position(|w| w == b"\r\n\r\n")
        .ok_or_else(|| io::Error::other("响应头不完整"))?;
    let head = String::from_utf8_lossy(&raw[..split]).to_string();
    let mut lines = head.split("\r\n");
    let status = lines
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|code| code.parse::<u16>().ok())
        .unwrap_or(0);
    let mut parsed_headers = Vec::new();
    for line in lines {
        if let Some((key, value)) = line.split_once(':') {
            parsed_headers.push((key.trim().to_ascii_lowercase(), value.trim().to_string()));
        }
    }
    let chunked = parsed_headers.iter().any(|(key, value)| {
        key == "transfer-encoding" && value.to_ascii_lowercase().contains("chunked")
    });
    let payload = &raw[split + 4..];
    let body = if chunked {
        decode_chunked(payload)
    } else {
        potential_body(payload, &parsed_headers)
    };
    Ok(Response {
        status,
        headers: parsed_headers,
        body,
    })
}

fn potential_body(raw: &[u8], headers: &[(String, String)]) -> Vec<u8> {
    let length = headers
        .iter()
        .find(|(key, _)| key == "content-length")
        .and_then(|(_, value)| value.parse::<usize>().ok());
    match length {
        Some(length) if length <= raw.len() => raw[..length].to_vec(),
        _ => raw.to_vec(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_chunked_bodies() {
        assert_eq!(
            decode_chunked(b"b\r\nhello world\r\n0\r\n\r\n"),
            b"hello world"
        );
        assert_eq!(
            decode_chunked(b"5\r\nhello\r\n6\r\n world\r\n0\r\n\r\n"),
            b"hello world"
        );
        assert_eq!(decode_chunked(b"plain"), Vec::<u8>::new());
    }

    #[test]
    fn trims_body_to_content_length() {
        let headers = vec![("content-length".to_string(), "5".to_string())];
        assert_eq!(potential_body(b"helloEXTRA", &headers), b"hello");
        let headers = vec![("content-length".to_string(), "999".to_string())];
        assert_eq!(potential_body(b"hello", &headers), b"hello");
    }
}
