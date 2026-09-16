use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::error::KernelError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: String,
    #[serde(default)]
    pub access_token: String,
    #[serde(default)]
    pub refresh_token: String,
    #[serde(default)]
    pub id_token: String,
    #[serde(default)]
    pub expires_at: i64,
    #[serde(default)]
    pub chatgpt_account_id: String,
    #[serde(default = "default_rpm")]
    pub rpm: u32,
    #[serde(default = "default_conc")]
    pub max_concurrency: u32,
}

fn default_rpm() -> u32 {
    0
}

fn default_conc() -> u32 {
    0
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CredentialFile {
    #[serde(default)]
    pub accounts: Vec<Account>,
}

impl CredentialFile {
    pub fn load(path: impl AsRef<Path>) -> Result<Self, KernelError> {
        let raw = fs::read_to_string(path)?;
        let file: CredentialFile = serde_json::from_str(&raw)?;
        Ok(file)
    }

    pub fn get(&self, id: &str) -> Option<&Account> {
        self.accounts.iter().find(|a| a.id == id)
    }

    pub fn needs_refresh(account: &Account, skew_secs: i64) -> bool {
        if account.access_token.trim().is_empty() {
            return true;
        }
        if account.expires_at <= 0 {
            return false;
        }
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);
        account.expires_at <= now + skew_secs
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_token_needs_refresh() {
        let a = Account {
            id: "a".into(),
            access_token: String::new(),
            refresh_token: "r".into(),
            id_token: String::new(),
            expires_at: 0,
            chatgpt_account_id: String::new(),
            rpm: 0,
            max_concurrency: 1,
        };
        assert!(CredentialFile::needs_refresh(&a, 300));
    }
}
