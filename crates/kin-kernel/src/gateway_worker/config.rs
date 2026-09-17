use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::Deserialize;
use url::Url;

const DEFAULT_ANTHROPIC_BASE: &str = "https://api.anthropic.com";
const DEFAULT_OAUTH_TOKEN_URL: &str = "https://platform.claude.com/v1/oauth/token";
const DEFAULT_SOCKET: &str = "/run/kin/worker.sock";
const DEFAULT_CREDENTIAL: &str = "/home/kincli/.claude/credentials.json";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum WorkerProvider {
    #[default]
    AnthropicApi,
    LocalCli,
}

impl WorkerProvider {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::AnthropicApi => "anthropic_api",
            Self::LocalCli => "local_cli",
        }
    }

    pub fn is_local_cli(self) -> bool {
        matches!(self, Self::LocalCli)
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct WorkerConfig {
    pub vm_id: String,
    #[serde(default)]
    pub socket_path: String,
    #[serde(default)]
    pub credential_path: String,
    #[serde(default)]
    pub proxy_url: String,
    #[serde(default)]
    pub proxy_required: bool,
    #[serde(default)]
    pub anthropic_base_url: String,
    #[serde(default)]
    pub oauth_token_url: String,
    #[serde(default)]
    pub internal_token: String,
    #[serde(default)]
    pub refresh_skew_seconds: i64,
    #[serde(default)]
    pub request_timeout_seconds: i64,
    #[serde(default)]
    pub first_byte_timeout_seconds: i64,
    #[serde(default)]
    pub idle_timeout_seconds: i64,
    #[serde(default)]
    pub max_request_bytes: i64,
    #[serde(default)]
    pub max_response_bytes: i64,
    #[serde(default)]
    pub max_event_bytes: i64,
    #[serde(default)]
    pub delivery_mode: String,
    #[serde(default)]
    pub test_endpoints: bool,
    #[serde(default)]
    pub runtime_kind: String,
    #[serde(default)]
    pub provider: WorkerProvider,
    #[serde(default)]
    pub claude_bin: String,
    #[serde(default)]
    pub slots_per_worker: i64,
    #[serde(default)]
    pub https_proxy: String,
    #[serde(default)]
    pub system_layout: String,
    #[serde(default)]
    pub timezone: String,
    #[serde(default)]
    pub cli_version: String,
    #[serde(default)]
    pub config_hash: String,
}

impl WorkerConfig {
    pub fn load(path: &Path) -> Result<Self, String> {
        let data = std::fs::read(path).map_err(|err| format!("read worker config: {err}"))?;
        let mut config: Self =
            serde_json::from_slice(&data).map_err(|err| format!("decode worker config: {err}"))?;
        config.apply_defaults();
        config.validate()?;
        Ok(config)
    }

    fn apply_defaults(&mut self) {
        if self.socket_path.is_empty() {
            self.socket_path = DEFAULT_SOCKET.to_string();
        }
        if self.credential_path.is_empty() {
            self.credential_path = DEFAULT_CREDENTIAL.to_string();
        }
        if self.anthropic_base_url.is_empty() {
            self.anthropic_base_url = DEFAULT_ANTHROPIC_BASE.to_string();
        }
        if self.oauth_token_url.is_empty() {
            self.oauth_token_url = DEFAULT_OAUTH_TOKEN_URL.to_string();
        }
        if self.refresh_skew_seconds <= 0 {
            self.refresh_skew_seconds = 300;
        }
        if self.request_timeout_seconds < 0 {
            self.request_timeout_seconds = 0;
        }
        if self.first_byte_timeout_seconds <= 0 {
            self.first_byte_timeout_seconds = 600;
        }
        if self.idle_timeout_seconds <= 0 {
            self.idle_timeout_seconds = 180;
        }
        if self.max_request_bytes <= 0 {
            self.max_request_bytes = 32 << 20;
        }
        if self.max_response_bytes <= 0 {
            self.max_response_bytes = 64 << 20;
        }
        if self.max_event_bytes <= 0 {
            self.max_event_bytes = 32 << 20;
        }
        if self.delivery_mode.is_empty() {
            self.delivery_mode = "realtime".to_string();
        }
        if self.runtime_kind.trim().is_empty() {
            self.runtime_kind = "docker".to_string();
        }
        if self.slots_per_worker <= 0 {
            self.slots_per_worker = 1;
        }
        if self.system_layout.trim().is_empty() {
            self.system_layout = "zero".to_string();
        }
        if self.cli_version.trim().is_empty() {
            self.cli_version = "2.1.263".to_string();
        }
    }

    fn validate(&self) -> Result<(), String> {
        if self.vm_id.trim().is_empty() {
            return Err("vm_id is required".into());
        }
        if self.internal_token.trim().is_empty() {
            return Err("internal_token is required".into());
        }
        require_absolute("socket_path", &self.socket_path)?;
        require_absolute("credential_path", &self.credential_path)?;
        if self.proxy_required && self.proxy_url.trim().is_empty() {
            return Err("proxy_required but proxy_url is empty".into());
        }
        validate_proxy(&self.proxy_url)?;
        validate_endpoint(
            &self.anthropic_base_url,
            "api.anthropic.com",
            self.test_endpoints,
        )
        .map_err(|err| format!("anthropic_base_url: {err}"))?;
        validate_endpoint(
            &self.oauth_token_url,
            "platform.claude.com",
            self.test_endpoints,
        )
        .map_err(|err| format!("oauth_token_url: {err}"))?;
        if self.delivery_mode != "realtime" && self.delivery_mode != "verified" {
            return Err(format!(
                "delivery_mode must be realtime or verified, got \"{}\"",
                self.delivery_mode
            ));
        }
        if self.provider.is_local_cli() {
            self.validate_local_cli()?;
        }
        Ok(())
    }

    pub fn refresh_skew_ms(&self) -> i64 {
        self.refresh_skew_seconds.saturating_mul(1000)
    }

    pub fn first_byte(&self) -> Duration {
        Duration::from_secs(self.first_byte_timeout_seconds.max(1) as u64)
    }

    pub fn idle(&self) -> Duration {
        Duration::from_secs(self.idle_timeout_seconds.max(1) as u64)
    }

    pub fn request_timeout(&self) -> Option<Duration> {
        if self.request_timeout_seconds <= 0 {
            None
        } else {
            Some(Duration::from_secs(self.request_timeout_seconds as u64))
        }
    }

    pub fn max_event_bytes(&self) -> usize {
        usize::try_from(self.max_event_bytes.max(1)).unwrap_or(usize::MAX)
    }

    pub fn max_request_usize(&self) -> usize {
        usize::try_from(self.max_request_bytes.max(1)).unwrap_or(usize::MAX)
    }

    pub fn socket_path(&self) -> PathBuf {
        PathBuf::from(&self.socket_path)
    }

    fn validate_local_cli(&self) -> Result<(), String> {
        if self.claude_bin.trim().is_empty() {
            return Err("local_cli requires claude_bin".into());
        }
        require_absolute("claude_bin", &self.claude_bin)?;
        if self.slots_per_worker < 1 || self.slots_per_worker > 20 {
            return Err(format!(
                "slots_per_worker must be 1-20, got {}",
                self.slots_per_worker
            ));
        }
        validate_https_proxy(&self.https_proxy)?;
        let layout = self.system_layout.trim();
        if layout != "zero" && layout != "identity" {
            return Err(format!(
                "system_layout must be zero or identity, got \"{}\"",
                self.system_layout
            ));
        }
        Ok(())
    }

    pub fn is_local_cli(&self) -> bool {
        self.provider.is_local_cli()
    }

    pub fn claude_bin_path(&self) -> PathBuf {
        PathBuf::from(&self.claude_bin)
    }
}

fn require_absolute(name: &str, path: &str) -> Result<(), String> {
    if Path::new(path).is_absolute() {
        Ok(())
    } else {
        Err(format!("{name} must be absolute"))
    }
}

fn validate_proxy(raw: &str) -> Result<(), String> {
    if raw.trim().is_empty() {
        return Ok(());
    }
    let parsed = Url::parse(raw).map_err(|err| format!("invalid proxy_url: {err}"))?;
    if parsed.scheme() != "socks5" && parsed.scheme() != "socks5h" {
        return Err(format!(
            "proxy_url scheme must be socks5 or socks5h, got \"{}\"",
            parsed.scheme()
        ));
    }
    if parsed.host_str().unwrap_or("").is_empty() || parsed.port().is_none() {
        return Err("proxy_url requires host and port".into());
    }
    Ok(())
}

fn validate_https_proxy(raw: &str) -> Result<(), String> {
    if raw.trim().is_empty() {
        return Ok(());
    }
    let parsed = Url::parse(raw).map_err(|err| format!("invalid https_proxy: {err}"))?;
    let scheme = parsed.scheme();
    if scheme == "socks5" || scheme == "socks5h" {
        return Err(format!("https_proxy must be http CONNECT, not {scheme}"));
    }
    if scheme != "http" && scheme != "https" {
        return Err(format!(
            "https_proxy scheme must be http or https, got \"{scheme}\""
        ));
    }
    let host = parsed.host_str().unwrap_or("");
    if host.is_empty() {
        return Err("https_proxy requires host".into());
    }
    if !is_loopback_host(host) {
        return Err("https_proxy host must be loopback".into());
    }
    Ok(())
}

fn is_loopback_host(host: &str) -> bool {
    if host.eq_ignore_ascii_case("localhost") || host.starts_with('@') {
        return true;
    }
    host.parse::<std::net::IpAddr>()
        .map(|ip| ip.is_loopback())
        .unwrap_or(false)
}

fn validate_endpoint(raw: &str, production_host: &str, allow_test: bool) -> Result<(), String> {
    let parsed = Url::parse(raw).map_err(|err| err.to_string())?;
    let https = parsed.scheme() == "https";
    let http_ok = allow_test && parsed.scheme() == "http";
    if !https && !http_ok {
        return Err("endpoint must use https".into());
    }
    let host = parsed.host_str().unwrap_or("");
    if !allow_test && !host.eq_ignore_ascii_case(production_host) {
        return Err(format!("endpoint host must be {production_host}"));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn write_config(body: &str) -> (tempfile::TempDir, PathBuf) {
        let dir = tempdir().unwrap();
        let path = dir.path().join("worker.json");
        std::fs::write(&path, body).unwrap();
        (dir, path)
    }

    #[test]
    fn ignores_unknown_fields_and_applies_defaults() {
        let dir = tempdir().unwrap();
        let socket = dir.path().join("w.sock");
        let cred = dir.path().join("c.json");
        let body = format!(
            r#"{{
                "vm_id": "vm1",
                "socket_path": "{}",
                "credential_path": "{}",
                "internal_token": "tok",
                "test_endpoints": true,
                "future_field": {{"nested": true}},
                "telemetry": {{"enabled": true, "identity": {{"device_id": "x"}}}}
            }}"#,
            socket.display(),
            cred.display()
        );
        let (_dir, path) = write_config(&body);
        let config = WorkerConfig::load(&path).unwrap();
        assert_eq!(config.vm_id, "vm1");
        assert_eq!(config.refresh_skew_seconds, 300);
        assert_eq!(config.first_byte_timeout_seconds, 600);
        assert_eq!(config.idle_timeout_seconds, 180);
        assert_eq!(config.max_request_bytes, 32 << 20);
        assert_eq!(config.max_response_bytes, 64 << 20);
        assert_eq!(config.max_event_bytes, 32 << 20);
        assert_eq!(config.delivery_mode, "realtime");
        assert_eq!(config.runtime_kind, "docker");
        assert_eq!(config.provider, WorkerProvider::AnthropicApi);
        assert_eq!(config.slots_per_worker, 1);
        assert_eq!(config.system_layout, "zero");
        assert_eq!(config.cli_version, "2.1.263");
    }

    #[test]
    fn proxy_required_without_url_refuses_start() {
        let dir = tempdir().unwrap();
        let socket = dir.path().join("w.sock");
        let cred = dir.path().join("c.json");
        let body = format!(
            r#"{{
                "vm_id": "vm1",
                "socket_path": "{}",
                "credential_path": "{}",
                "internal_token": "tok",
                "proxy_required": true,
                "test_endpoints": true
            }}"#,
            socket.display(),
            cred.display()
        );
        let (_dir, path) = write_config(&body);
        let err = WorkerConfig::load(&path).unwrap_err();
        assert!(err.contains("proxy_required"), "{err}");
    }

    #[test]
    fn production_host_is_pinned_without_test_endpoints() {
        let dir = tempdir().unwrap();
        let socket = dir.path().join("w.sock");
        let cred = dir.path().join("c.json");
        let body = format!(
            r#"{{
                "vm_id": "vm1",
                "socket_path": "{}",
                "credential_path": "{}",
                "internal_token": "tok",
                "anthropic_base_url": "https://example.com"
            }}"#,
            socket.display(),
            cred.display()
        );
        let (_dir, path) = write_config(&body);
        let err = WorkerConfig::load(&path).unwrap_err();
        assert!(err.contains("api.anthropic.com"), "{err}");
    }

    fn local_cli_body(socket: &Path, cred: &Path, extra: &str) -> String {
        format!(
            r#"{{
                "vm_id": "vm1",
                "socket_path": "{}",
                "credential_path": "{}",
                "internal_token": "tok",
                "test_endpoints": true,
                "provider": "local_cli",
                "claude_bin": "/opt/kin/cli-node",
                "https_proxy": "http://127.0.0.1:18080"
                {extra}
            }}"#,
            socket.display(),
            cred.display()
        )
    }

    #[test]
    fn illegal_provider_refuses_start() {
        let dir = tempdir().unwrap();
        let socket = dir.path().join("w.sock");
        let cred = dir.path().join("c.json");
        let body = format!(
            r#"{{
                "vm_id": "vm1",
                "socket_path": "{}",
                "credential_path": "{}",
                "internal_token": "tok",
                "test_endpoints": true,
                "provider": "relay"
            }}"#,
            socket.display(),
            cred.display()
        );
        let (_dir, path) = write_config(&body);
        let err = WorkerConfig::load(&path).unwrap_err();
        assert!(
            err.contains("local_cli") || err.contains("anthropic_api"),
            "{err}"
        );
    }

    #[test]
    fn local_cli_accepts_loopback_http_connect() {
        let dir = tempdir().unwrap();
        let socket = dir.path().join("w.sock");
        let cred = dir.path().join("c.json");
        let (_dir, path) = write_config(&local_cli_body(&socket, &cred, ""));
        let config = WorkerConfig::load(&path).unwrap();
        assert_eq!(config.provider, WorkerProvider::LocalCli);
        assert_eq!(config.slots_per_worker, 1);
        assert_eq!(config.claude_bin, "/opt/kin/cli-node");
        assert_eq!(config.https_proxy, "http://127.0.0.1:18080");
    }

    #[test]
    fn local_cli_rejects_slots_over_20() {
        let dir = tempdir().unwrap();
        let socket = dir.path().join("w.sock");
        let cred = dir.path().join("c.json");
        let (_dir, path) = write_config(&local_cli_body(
            &socket,
            &cred,
            r#", "slots_per_worker": 21"#,
        ));
        let err = WorkerConfig::load(&path).unwrap_err();
        assert!(err.contains("slots_per_worker"), "{err}");
    }

    #[test]
    fn local_cli_rejects_socks_https_proxy() {
        let dir = tempdir().unwrap();
        let socket = dir.path().join("w.sock");
        let cred = dir.path().join("c.json");
        let body = format!(
            r#"{{
                "vm_id": "vm1",
                "socket_path": "{}",
                "credential_path": "{}",
                "internal_token": "tok",
                "test_endpoints": true,
                "provider": "local_cli",
                "claude_bin": "/opt/kin/cli-node",
                "https_proxy": "socks5h://127.0.0.1:10808"
            }}"#,
            socket.display(),
            cred.display()
        );
        let (_dir, path) = write_config(&body);
        let err = WorkerConfig::load(&path).unwrap_err();
        assert!(err.contains("https_proxy"), "{err}");
        assert!(err.contains("CONNECT") || err.contains("socks5h"), "{err}");
    }

    #[test]
    fn local_cli_rejects_public_https_proxy() {
        let dir = tempdir().unwrap();
        let socket = dir.path().join("w.sock");
        let cred = dir.path().join("c.json");
        let body = format!(
            r#"{{
                "vm_id": "vm1",
                "socket_path": "{}",
                "credential_path": "{}",
                "internal_token": "tok",
                "test_endpoints": true,
                "provider": "local_cli",
                "claude_bin": "/opt/kin/cli-node",
                "https_proxy": "http://8.8.8.8:8080"
            }}"#,
            socket.display(),
            cred.display()
        );
        let (_dir, path) = write_config(&body);
        let err = WorkerConfig::load(&path).unwrap_err();
        assert!(err.contains("loopback"), "{err}");
    }

    #[test]
    fn local_cli_requires_claude_bin() {
        let dir = tempdir().unwrap();
        let socket = dir.path().join("w.sock");
        let cred = dir.path().join("c.json");
        let body = format!(
            r#"{{
                "vm_id": "vm1",
                "socket_path": "{}",
                "credential_path": "{}",
                "internal_token": "tok",
                "test_endpoints": true,
                "provider": "local_cli",
                "https_proxy": "http://127.0.0.1:18080"
            }}"#,
            socket.display(),
            cred.display()
        );
        let (_dir, path) = write_config(&body);
        let err = WorkerConfig::load(&path).unwrap_err();
        assert!(err.contains("claude_bin"), "{err}");
    }
}
