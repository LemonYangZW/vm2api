use serde::Deserialize;
use std::fs;
use std::path::{Path, PathBuf};

use crate::error::KernelError;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub vm_id: String,
    #[serde(default)]
    pub device_id: String,
    pub socket_path: PathBuf,
    pub credential_path: PathBuf,
    #[serde(default)]
    pub proxy_url: String,
    #[serde(default = "default_true")]
    pub proxy_required: bool,
    #[serde(default)]
    pub internal_token: String,
    #[serde(default = "default_chatgpt_base")]
    pub chatgpt_base_url: String,
    #[serde(default = "default_oauth_token")]
    pub oauth_token_url: String,
    #[serde(default = "default_ua")]
    pub user_agent: String,
    #[serde(default)]
    pub test_endpoints: bool,
}

fn default_true() -> bool {
    true
}

fn default_chatgpt_base() -> String {
    "https://chatgpt.com/backend-api/codex".to_string()
}

fn default_oauth_token() -> String {
    "https://auth.openai.com/oauth/token".to_string()
}

fn default_ua() -> String {
    "codex_cli_rs/0.153.4 (linux x86_64)".to_string()
}

impl Config {
    pub fn load(path: impl AsRef<Path>) -> Result<Self, KernelError> {
        let raw = fs::read_to_string(path)?;
        let mut cfg: Config = serde_json::from_str(&raw)?;
        if cfg.device_id.trim().is_empty() {
            cfg.device_id = cfg.vm_id.clone();
        }
        cfg.validate()?;
        Ok(cfg)
    }

    pub fn validate(&self) -> Result<(), KernelError> {
        if self.vm_id.trim().is_empty() {
            return Err(KernelError::InvalidRequest("vm_id required".into()));
        }
        if self.socket_path.as_os_str().is_empty() {
            return Err(KernelError::InvalidRequest("socket_path required".into()));
        }
        if self.proxy_required && self.proxy_url.trim().is_empty() {
            return Err(KernelError::ProxyRequired);
        }
        Ok(())
    }

    pub fn responses_http_url(&self) -> String {
        format!("{}/responses", self.chatgpt_base_url.trim_end_matches('/'))
    }

    pub fn responses_ws_url(&self) -> String {
        let https = self.responses_http_url();
        if let Some(rest) = https.strip_prefix("https://") {
            format!("wss://{rest}")
        } else if let Some(rest) = https.strip_prefix("http://") {
            format!("ws://{rest}")
        } else {
            https
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn proxy_required_fails_closed() {
        let mut cfg = Config {
            vm_id: "vm-1".into(),
            device_id: String::new(),
            socket_path: "/tmp/codex.sock".into(),
            credential_path: "/tmp/creds.json".into(),
            proxy_url: String::new(),
            proxy_required: true,
            internal_token: "t".into(),
            chatgpt_base_url: default_chatgpt_base(),
            oauth_token_url: default_oauth_token(),
            user_agent: default_ua(),
            test_endpoints: true,
        };
        assert!(matches!(cfg.validate(), Err(KernelError::ProxyRequired)));
        cfg.proxy_required = false;
        assert!(cfg.validate().is_ok());
    }

    #[test]
    fn load_fills_device_id() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("kin-codex-cfg-{}.json", uuid::Uuid::new_v4()));
        let mut f = fs::File::create(&path).unwrap();
        write!(
            f,
            r#"{{"vm_id":"vm-9","socket_path":"/tmp/a.sock","credential_path":"/tmp/c.json","proxy_url":"socks5://127.0.0.1:1","proxy_required":true}}"#
        )
        .unwrap();
        let cfg = Config::load(&path).unwrap();
        assert_eq!(cfg.device_id, "vm-9");
        let _ = fs::remove_file(path);
    }
}
