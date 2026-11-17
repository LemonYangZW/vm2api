//! 凭据存储：`credentials.json` 的读取、判定与原子落盘。
//!
//! 真值：现网 `worker/internal/credential/store.go`。
//! - 路径：`kernel.json` 的 `credential_path`（缺省 `/home/kincli/.claude/credentials.json`）
//! - 结构：`{type, authScheme, kinGeneration, claudeAiOauth:{accessToken,refreshToken,expiresAt,…}, anthropicApiKey:{apiKey}}`
//! - `expiresAt` 是**毫秒**；`generation` 落 `claudeAiOauth.kinGeneration` 与顶层 `kinGeneration`
//! - 保存：generation 必须大于磁盘值（否则 +1，且不小于毫秒时间戳），原子写 `0600`

use std::io;
use std::path::{Path, PathBuf};

use serde_json::{json, Value};

/// 凭据类型。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    OAuth,
    SetupToken,
    OfficialSetupToken,
    ApiKey,
}

impl Kind {
    pub fn parse(raw: &str) -> Self {
        let normalized = raw.trim().to_ascii_lowercase().replace('_', "-");
        match normalized.as_str() {
            "official-setup-token" | "office-setup-token" | "claude-setup-token" | "inference" => {
                Kind::OfficialSetupToken
            }
            "setup-token" => Kind::SetupToken,
            "apikey" | "api-key" | "console" => Kind::ApiKey,
            _ => Kind::OAuth,
        }
    }

    pub fn as_str(self) -> &'static str {
        match self {
            Kind::OAuth => "oauth",
            Kind::SetupToken => "setup-token",
            Kind::OfficialSetupToken => "official-setup-token",
            Kind::ApiKey => "apikey",
        }
    }
}

/// 出站认证方案。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Scheme {
    XApiKey,
    Bearer,
}

impl Scheme {
    pub fn parse(raw: &str, kind: Kind) -> Self {
        let normalized = raw.trim().to_ascii_lowercase().replace('-', "_");
        match normalized.as_str() {
            "authorization_bearer" | "bearer" | "authorization" | "oauth" => Scheme::Bearer,
            "x_api_key" | "apikey" | "api_key" => Scheme::XApiKey,
            _ if kind == Kind::ApiKey => Scheme::XApiKey,
            _ => Scheme::Bearer,
        }
    }

    pub fn as_str(self) -> &'static str {
        match self {
            Scheme::XApiKey => "x_api_key",
            Scheme::Bearer => "authorization_bearer",
        }
    }

    pub fn header_name(self) -> &'static str {
        match self {
            Scheme::XApiKey => "x-api-key",
            Scheme::Bearer => "authorization",
        }
    }
}

/// 一份凭据。
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Credential {
    pub kind: Kind,
    pub access_token: String,
    pub refresh_token: String,
    /// 毫秒时间戳；`0` 表示未知。
    pub expires_at: i64,
    pub generation: i64,
    pub api_key: String,
    pub base_url: String,
    pub scheme: Scheme,
    pub email: String,
    pub account_uuid: String,
    pub org_uuid: String,
    pub scopes: Vec<String>,
}

impl Default for Kind {
    fn default() -> Self {
        Kind::OAuth
    }
}

impl Default for Scheme {
    fn default() -> Self {
        Scheme::Bearer
    }
}

impl Credential {
    pub fn is_api_key(&self) -> bool {
        self.kind == Kind::ApiKey
    }

    /// 实际使用的 token。
    pub fn token(&self) -> &str {
        if self.is_api_key() && !self.api_key.trim().is_empty() {
            return self.api_key.trim();
        }
        self.access_token.trim()
    }

    pub fn valid(&self) -> bool {
        !self.token().is_empty()
    }

    pub fn resolved_scheme(&self) -> Scheme {
        Scheme::parse(self.scheme.as_str(), self.kind)
    }

    /// 是否需要刷新（`now_ms` 与 `skew_ms` 都是毫秒）。
    pub fn needs_refresh(&self, now_ms: i64, skew_ms: i64) -> bool {
        if self.is_api_key() {
            return false;
        }
        if !self.valid() {
            return true;
        }
        // `claude setup-token` 是一年期 oat，没有 refresh。
        let no_refresh = matches!(self.kind, Kind::OfficialSetupToken)
            || (self.kind == Kind::SetupToken && self.refresh_token.trim().is_empty());
        if no_refresh && self.expires_at <= 0 {
            return false;
        }
        if self.expires_at <= 0 {
            return true;
        }
        self.expires_at.saturating_sub(now_ms) <= skew_ms
    }
}

fn first_string(node: &Value, keys: &[&str]) -> String {
    for key in keys {
        if let Some(text) = node.get(*key).and_then(|v| v.as_str()) {
            let text = text.trim();
            if !text.is_empty() {
                return text.to_string();
            }
        }
    }
    String::new()
}

fn first_i64(node: &Value, keys: &[&str]) -> i64 {
    for key in keys {
        let Some(value) = node.get(*key) else { continue };
        if let Some(n) = value.as_i64() {
            return n;
        }
        if let Some(f) = value.as_f64() {
            return f as i64;
        }
        if let Some(text) = value.as_str() {
            if let Ok(parsed) = text.trim().parse::<i64>() {
                return parsed;
            }
        }
    }
    0
}

fn first_string_array(node: &Value, keys: &[&str]) -> Vec<String> {
    for key in keys {
        if let Some(items) = node.get(*key).and_then(|v| v.as_array()) {
            return items
                .iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect();
        }
        if let Some(text) = node.get(*key).and_then(|v| v.as_str()) {
            return text
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
        }
    }
    Vec::new()
}

/// 毫秒时间戳（秒级输入会被提升到毫秒，与现网 `normalizeExpiry` 一致）。
fn normalize_expiry(node: &Value, keys: &[&str]) -> i64 {
    let raw = first_i64(node, keys);
    if raw <= 0 {
        return 0;
    }
    if raw < 100_000_000_000 {
        raw.saturating_mul(1000)
    } else {
        raw
    }
}

/// 凭据文件。
#[derive(Debug, Clone)]
pub struct Store {
    pub path: PathBuf,
    pub lock_path: PathBuf,
}

impl Store {
    pub fn new(path: impl Into<PathBuf>) -> Self {
        let path = path.into();
        let lock_path = PathBuf::from(format!("{}.lock", path.display()));
        Self { path, lock_path }
    }

    pub fn from_config(path: Option<&str>) -> Self {
        let default = "/home/kincli/.claude/credentials.json";
        Self::new(path.unwrap_or(default))
    }

    /// 读凭据，同时返回原文档（保存时要在原文档上改）。
    pub fn load(&self) -> io::Result<(Credential, Value)> {
        let text = std::fs::read_to_string(&self.path)?;
        let document: Value = serde_json::from_str(&text)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, format!("decode credentials: {e}")))?;
        let oauth = document
            .get("claudeAiOauth")
            .filter(|v| v.is_object())
            .unwrap_or(&document);
        let scopes = first_string_array(oauth, &["scopes", "scope"]);
        let mut credential = Credential {
            kind: Kind::parse(&first_string(&document, &["type"])),
            access_token: first_string(oauth, &["accessToken", "access_token"]),
            refresh_token: first_string(oauth, &["refreshToken", "refresh_token"]),
            expires_at: normalize_expiry(oauth, &["expiresAt", "expires_at"]),
            generation: first_i64(oauth, &["kinGeneration", "kin_generation", "_token_version"]),
            api_key: String::new(),
            base_url: String::new(),
            scheme: Scheme::Bearer,
            email: first_string(oauth, &["email", "emailAddress", "email_address"]),
            account_uuid: first_string(oauth, &["accountUuid", "account_uuid"]),
            org_uuid: first_string(oauth, &["orgUuid", "org_uuid", "organization_uuid"]),
            scopes,
        };
        let typed = first_string(oauth, &["type"]);
        if !typed.is_empty() && credential.kind == Kind::OAuth {
            credential.kind = Kind::parse(&typed);
        }
        if let Some(api) = document.get("anthropicApiKey").filter(|v| v.is_object()) {
            let key = first_string(api, &["apiKey", "api_key"]);
            if !key.is_empty() {
                credential.kind = Kind::ApiKey;
                credential.api_key = key.clone();
                credential.access_token = key;
                credential.base_url = first_string(api, &["baseUrl", "base_url"]);
                if credential.email.is_empty() {
                    credential.email = first_string(api, &["email"]);
                }
                let scheme = first_string(api, &["authScheme", "auth_scheme"]);
                credential.scheme = if scheme.is_empty() {
                    Scheme::XApiKey
                } else {
                    Scheme::parse(&scheme, credential.kind)
                };
            }
        }
        let scheme = first_string(&document, &["authScheme", "auth_scheme"]);
        if !scheme.is_empty() && credential.scheme == Scheme::Bearer {
            credential.scheme = Scheme::parse(&scheme, credential.kind);
        }
        if credential.scheme != Scheme::XApiKey {
            let oauth_scheme = first_string(oauth, &["authScheme", "auth_scheme"]);
            if !oauth_scheme.is_empty() {
                credential.scheme = Scheme::parse(&oauth_scheme, credential.kind);
            }
        }
        if credential.kind == Kind::ApiKey {
            credential.scheme = Scheme::XApiKey;
        }
        if credential.generation == 0 {
            credential.generation = first_i64(&document, &["kinGeneration", "kin_generation", "_token_version"]);
        }
        Ok((credential, document))
    }

    /// 落盘：generation 单调递增（且不小于毫秒时间戳），原子写 `0600`。
    pub fn save(&self, credential: &Credential, document: &mut Value) -> io::Result<Credential> {
        if !credential.valid() {
            return Err(io::Error::other("access token is required"));
        }
        let mut next = credential.clone();
        next.kind = credential.kind;
        next.scheme = Scheme::parse(credential.scheme.as_str(), next.kind);
        if !document.is_object() {
            *document = json!({});
        }
        let top_generation = first_i64(document, &["kinGeneration", "kin_generation", "_token_version"]);
        let root = document.as_object_mut().expect("object");
        root.insert("type".into(), json!(next.kind.as_str()));
        root.insert("authScheme".into(), json!(next.scheme.as_str()));

        let now_ms = now_ms();
        if next.is_api_key() {
            let api = root
                .entry("anthropicApiKey")
                .or_insert_with(|| json!({}))
                .as_object_mut()
                .expect("anthropicApiKey object");
            api.insert("apiKey".into(), json!(next.token()));
            if !next.base_url.is_empty() {
                api.insert("baseUrl".into(), json!(next.base_url));
            }
            root.remove("claudeAiOauth");
            bump_generation(&mut next, top_generation, now_ms);
            root.insert("kinGeneration".into(), json!(next.generation));
            write_document(&self.path, document)?;
            return Ok(next);
        }

        let oauth = root
            .entry("claudeAiOauth")
            .or_insert_with(|| json!({}))
            .as_object_mut()
            .expect("claudeAiOauth object");
        let current_oauth = oauth
            .get("kinGeneration")
            .and_then(|v| v.as_i64())
            .unwrap_or(0);
        bump_generation(&mut next, top_generation.max(current_oauth), now_ms);
        oauth.insert("accessToken".into(), json!(next.access_token));
        match next.kind {
            Kind::OfficialSetupToken => {
                oauth.remove("refreshToken");
                next.refresh_token.clear();
            }
            _ if !next.refresh_token.is_empty() => {
                oauth.insert("refreshToken".into(), json!(next.refresh_token));
            }
            Kind::SetupToken => {
                oauth.remove("refreshToken");
            }
            _ => {}
        }
        if next.expires_at > 0 {
            oauth.insert("expiresAt".into(), json!(next.expires_at));
        }
        oauth.insert("kinGeneration".into(), json!(next.generation));
        if !next.email.is_empty() {
            oauth.insert("email".into(), json!(next.email));
        }
        if !next.account_uuid.is_empty() {
            oauth.insert("accountUuid".into(), json!(next.account_uuid));
        }
        if !next.org_uuid.is_empty() {
            oauth.insert("orgUuid".into(), json!(next.org_uuid));
        }
        if !next.scopes.is_empty() {
            oauth.insert("scopes".into(), json!(next.scopes));
        }
        if matches!(next.kind, Kind::SetupToken | Kind::OfficialSetupToken) {
            oauth.insert("type".into(), json!(next.kind.as_str()));
        }
        root.insert("kinGeneration".into(), json!(next.generation));
        write_document(&self.path, document)?;
        Ok(next)
    }

    /// 跨进程互斥（unix 用 `flock`；其它平台退化为进程内串行）。
    pub fn with_lock<T>(&self, f: impl FnOnce() -> io::Result<T>) -> io::Result<T> {
        if let Some(parent) = self.lock_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let file = std::fs::OpenOptions::new()
            .create(true)
            .truncate(false)
            .write(true)
            .open(&self.lock_path)?;
        flock_exclusive(&file)?;
        let result = f();
        let _ = flock_unlock(&file);
        result
    }
}

fn bump_generation(credential: &mut Credential, current: i64, now_ms: i64) {
    if credential.generation <= current {
        credential.generation = current.saturating_add(1);
    }
    if credential.generation < now_ms {
        credential.generation = now_ms;
    }
}

fn write_document(path: &Path, document: &Value) -> io::Result<()> {
    let body = serde_json::to_string_pretty(document)?;
    atomic_write(path, format!("{body}\n").as_bytes())
}

/// 临时文件 + rename，权限 `0600`。
pub fn atomic_write(path: &Path, bytes: &[u8]) -> io::Result<()> {
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    std::fs::create_dir_all(parent)?;
    let tmp = parent.join(format!(
        ".{}.{}.tmp",
        path.file_name().and_then(|n| n.to_str()).unwrap_or("credentials"),
        std::process::id()
    ));
    {
        use std::io::Write;
        let mut options = std::fs::OpenOptions::new();
        options.write(true).create(true).truncate(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let mut file = options.open(&tmp)?;
        file.write_all(bytes)?;
        file.sync_all()?;
    }
    std::fs::rename(&tmp, path)?;
    Ok(())
}

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

#[cfg(unix)]
fn flock_exclusive(file: &std::fs::File) -> io::Result<()> {
    use std::os::unix::io::AsRawFd;
    let rc = unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX) };
    if rc != 0 {
        return Err(io::Error::last_os_error());
    }
    Ok(())
}

#[cfg(unix)]
fn flock_unlock(file: &std::fs::File) -> io::Result<()> {
    use std::os::unix::io::AsRawFd;
    let rc = unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_UN) };
    if rc != 0 {
        return Err(io::Error::last_os_error());
    }
    Ok(())
}

#[cfg(not(unix))]
fn flock_exclusive(_file: &std::fs::File) -> io::Result<()> {
    Ok(())
}

#[cfg(not(unix))]
fn flock_unlock(_file: &std::fs::File) -> io::Result<()> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_store(tag: &str) -> Store {
        let dir = std::env::temp_dir().join(format!(
            "cragv2-cred-{tag}-{}-{}",
            std::process::id(),
            now_ms()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        Store::new(dir.join("credentials.json"))
    }

    #[test]
    fn loads_camel_case_document() {
        let store = temp_store("camel");
        std::fs::write(
            &store.path,
            r#"{"type":"oauth","authScheme":"authorization_bearer",
                "claudeAiOauth":{"accessToken":"a","refreshToken":"r","expiresAt":4102444800000,
                                 "scopes":["user:inference"],"kinGeneration":7}}"#,
        )
        .unwrap();
        let (credential, _) = store.load().unwrap();
        assert_eq!(credential.kind, Kind::OAuth);
        assert_eq!(credential.access_token, "a");
        assert_eq!(credential.refresh_token, "r");
        assert_eq!(credential.expires_at, 4102444800000);
        assert_eq!(credential.generation, 7);
        assert_eq!(credential.scopes, vec!["user:inference".to_string()]);
        assert_eq!(credential.resolved_scheme(), Scheme::Bearer);
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }

    #[test]
    fn loads_snake_case_and_promotes_seconds() {
        let store = temp_store("snake");
        std::fs::write(
            &store.path,
            r#"{"claudeAiOauth":{"access_token":"a2","refresh_token":"r2","expires_at":1770000000}}"#,
        )
        .unwrap();
        let (credential, _) = store.load().unwrap();
        assert_eq!(credential.access_token, "a2");
        assert_eq!(credential.expires_at, 1_770_000_000_000);
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }

    #[test]
    fn api_key_credential_uses_x_api_key() {
        let store = temp_store("apikey");
        std::fs::write(
            &store.path,
            r#"{"anthropicApiKey":{"apiKey":"sk-ant-x","baseUrl":"https://example.test"}}"#,
        )
        .unwrap();
        let (credential, _) = store.load().unwrap();
        assert!(credential.is_api_key());
        assert_eq!(credential.token(), "sk-ant-x");
        assert_eq!(credential.resolved_scheme(), Scheme::XApiKey);
        assert_eq!(credential.base_url, "https://example.test");
        assert!(!credential.needs_refresh(now_ms(), 300_000));
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }

    #[test]
    fn needs_refresh_rules() {
        let now = 1_000_000_000_000i64;
        let mut credential = Credential {
            kind: Kind::OAuth,
            access_token: "a".into(),
            refresh_token: "r".into(),
            expires_at: now + 600_000,
            ..Default::default()
        };
        assert!(!credential.needs_refresh(now, 300_000));
        credential.expires_at = now + 100_000;
        assert!(credential.needs_refresh(now, 300_000));
        credential.expires_at = 0;
        assert!(credential.needs_refresh(now, 300_000));
        credential.access_token.clear();
        assert!(credential.needs_refresh(now, 300_000));
        // setup-token 无 refresh 且无过期时间 → 不刷
        let setup = Credential {
            kind: Kind::OfficialSetupToken,
            access_token: "a".into(),
            expires_at: 0,
            ..Default::default()
        };
        assert!(!setup.needs_refresh(now, 300_000));
    }

    #[test]
    fn save_bumps_generation_and_writes_millis() {
        let store = temp_store("save");
        std::fs::write(
            &store.path,
            r#"{"claudeAiOauth":{"accessToken":"old","kinGeneration":5}}"#,
        )
        .unwrap();
        let (mut credential, mut document) = store.load().unwrap();
        credential.access_token = "new".into();
        credential.refresh_token = "r".into();
        credential.expires_at = 4_102_444_800_000;
        let saved = store.save(&credential, &mut document).unwrap();
        assert!(saved.generation > 5, "{}", saved.generation);
        let text = std::fs::read_to_string(&store.path).unwrap();
        let parsed: Value = serde_json::from_str(&text).unwrap();
        assert_eq!(parsed["claudeAiOauth"]["accessToken"], "new");
        assert_eq!(parsed["claudeAiOauth"]["expiresAt"], 4_102_444_800_000i64);
        assert_eq!(parsed["kinGeneration"], parsed["claudeAiOauth"]["kinGeneration"]);
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }

    #[test]
    fn save_rejects_empty_token() {
        let store = temp_store("empty");
        std::fs::write(&store.path, "{}").unwrap();
        let mut document = json!({});
        let credential = Credential::default();
        assert!(store.save(&credential, &mut document).is_err());
        std::fs::remove_dir_all(store.path.parent().unwrap()).ok();
    }
}
