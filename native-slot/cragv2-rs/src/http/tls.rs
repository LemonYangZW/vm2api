//! TLS 客户端配置：ALPN `h2` + 系统根证书（可选自定义 CA，便于企业代理/私有网关）。
//!
//! 上游 rs 形态要求自控 TLS，`CCH` 的 wire 一致性才可验证（§6.3），
//! 因此这里**不做**任何 HTTP 库的隐式重写：连接与帧都由我们自己的 h2 栈驱动。

use std::io;
use std::path::Path;
use std::sync::Arc;

use rustls::{ClientConfig, RootCertStore};
use tokio::net::TcpStream;
use tokio_rustls::TlsConnector;

/// 安装 ring 作为默认 crypto provider（进程内只允许一次）。
pub fn install_crypto_provider() {
    use std::sync::Once;
    static ONCE: Once = Once::new();
    ONCE.call_once(|| {
        let _ = rustls::crypto::ring::default_provider().install_default();
    });
}

/// 构建 h2-only 的客户端配置。
pub fn client_config(ca_pem: Option<&Path>) -> io::Result<Arc<ClientConfig>> {
    client_config_alpn(ca_pem, &[b"h2".to_vec()])
}

/// 构建指定 ALPN 的客户端配置（HTTP/1.1 端点用 `http/1.1`）。
pub fn client_config_alpn(ca_pem: Option<&Path>, alpn: &[Vec<u8>]) -> io::Result<Arc<ClientConfig>> {
    install_crypto_provider();
    let mut roots = RootCertStore::empty();
    match ca_pem {
        Some(path) => {
            let pem = std::fs::read(path)?;
            let mut cursor = io::Cursor::new(pem);
            for cert in rustls_pemfile_certs(&mut cursor)? {
                roots
                    .add(cert)
                    .map_err(|e| io::Error::other(format!("root cert: {e}")))?;
            }
        }
        None => {
            roots.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());
        }
    }
    let mut config = ClientConfig::builder()
        .with_root_certificates(roots)
        .with_no_client_auth();
    config.alpn_protocols = alpn.to_vec();
    Ok(Arc::new(config))
}

/// 最小 PEM 证书解析（只处理 `CERTIFICATE` 块，避免额外依赖）。
fn rustls_pemfile_certs(reader: &mut io::Cursor<Vec<u8>>) -> io::Result<Vec<rustls::pki_types::CertificateDer<'static>>> {
    use std::io::BufRead;
    const BEGIN: &str = "-----BEGIN CERTIFICATE-----";
    const END: &str = "-----END CERTIFICATE-----";
    let mut out = Vec::new();
    let mut collecting = false;
    let mut body = String::new();
    for line in reader.lines() {
        let line = line?;
        let trimmed = line.trim();
        if trimmed == BEGIN {
            collecting = true;
            body.clear();
            continue;
        }
        if trimmed == END {
            if collecting {
                let der = base64_decode(&body)
                    .ok_or_else(|| io::Error::other("invalid base64 in CA pem"))?;
                out.push(rustls::pki_types::CertificateDer::from(der));
            }
            collecting = false;
            continue;
        }
        if collecting {
            body.push_str(trimmed);
        }
    }
    if out.is_empty() {
        return Err(io::Error::other("no CERTIFICATE block in CA pem"));
    }
    Ok(out)
}

fn base64_decode(text: &str) -> Option<Vec<u8>> {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = Vec::with_capacity(text.len() * 3 / 4);
    let mut acc = 0u32;
    let mut bits = 0u32;
    for c in text.bytes() {
        if c == b'=' || c.is_ascii_whitespace() {
            continue;
        }
        let value = TABLE.iter().position(|t| *t == c)? as u32;
        acc = (acc << 6) | value;
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((acc >> bits) as u8);
        }
    }
    Some(out)
}

/// 建 TLS 流（ALPN 协商 `h2`）。
pub async fn connect_tls(
    config: Arc<ClientConfig>,
    host: &str,
    port: u16,
    server_name: &str,
) -> io::Result<tokio_rustls::client::TlsStream<TcpStream>> {
    let tcp = TcpStream::connect((host, port)).await?;
    tcp.set_nodelay(true)?;
    connect_tls_stream(config, tcp, server_name).await
}

/// 在已建立（可能经过代理隧道）的流上做 TLS 握手。
///
/// 需要 `h2` 的调用方（上游 hop）自行断言 ALPN，因为 HTTP/1.1 端点
/// （OAuth token、回调）不协商 h2。
pub async fn connect_tls_stream<S>(
    config: Arc<ClientConfig>,
    stream: S,
    server_name: &str,
) -> io::Result<tokio_rustls::client::TlsStream<S>>
where
    S: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let name = rustls::pki_types::ServerName::try_from(server_name.to_string())
        .map_err(|e| io::Error::other(format!("server name: {e}")))?;
    let connector = TlsConnector::from(config);
    Ok(connector.connect(name, stream).await?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_negotiates_h2() {
        let config = client_config(None).unwrap();
        assert_eq!(config.alpn_protocols, vec![b"h2".to_vec()]);
    }

    #[test]
    fn base64_roundtrip_known_vector() {
        assert_eq!(base64_decode("aGVsbG8=").unwrap(), b"hello");
        assert_eq!(base64_decode("").unwrap(), Vec::<u8>::new());
    }

    #[test]
    fn rejects_pem_without_certificate() {
        let mut cursor = io::Cursor::new(b"not a pem".to_vec());
        assert!(rustls_pemfile_certs(&mut cursor).is_err());
    }
}
