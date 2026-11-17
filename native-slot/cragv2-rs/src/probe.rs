//! 真机前自检（`crag-v2 probe`）：**不发明智请求**。
//!
//! 依次验证：配置可解析 → 凭据可读且未过期 → 代理隧道可建立 → TLS(ALPN h2) 握手 →
//! 非推理端点 `GET /v1/models`（best effort，仅信息项）。
//!
//! 退出码：`0` 全通过；`1` 凭据；`2` 代理；`3` TLS/h2；`4` 端点（仅在
//! `PROBE_REQUIRE_ENDPOINT=1` 时强制）。

use std::sync::Arc;

use serde_json::json;

use crate::config::KernelConfig;
use crate::credential::{now_ms, Store};
use crate::http::client::{Origin, UpstreamClient};
use crate::http::proxy::Proxy;
use crate::oauth::Refresher;

/// 单项检查结果。
#[derive(Debug, Clone)]
pub struct Check {
    pub name: &'static str,
    pub ok: bool,
    pub required: bool,
    pub detail: String,
}

/// 自检报告。
#[derive(Debug, Clone, Default)]
pub struct Report {
    pub checks: Vec<Check>,
}

impl Report {
    fn push(&mut self, name: &'static str, ok: bool, required: bool, detail: impl Into<String>) {
        self.checks.push(Check {
            name,
            ok,
            required,
            detail: detail.into(),
        });
    }

    /// 第一条必要项的失败（退出码）。
    pub fn exit_code(&self) -> i32 {
        for check in &self.checks {
            if check.ok || !check.required {
                continue;
            }
            return match check.name {
                "credential" => 1,
                "proxy" => 2,
                "tls_h2" => 3,
                "endpoint" => 4,
                _ => 1,
            };
        }
        0
    }

    /// 人类可读输出（每行一项）。
    pub fn render(&self) -> String {
        let mut out = String::new();
        for check in &self.checks {
            let mark = if check.ok {
                "OK  "
            } else if check.required {
                "FAIL"
            } else {
                "WARN"
            };
            out.push_str(&format!("[{mark}] {:<11} {}\n", check.name, check.detail));
        }
        let payload = json!({
            "checks": self.checks.iter().map(|check| json!({
                "name": check.name,
                "ok": check.ok,
                "required": check.required,
                "detail": check.detail,
            })).collect::<Vec<_>>(),
            "exit_code": self.exit_code(),
        });
        out.push_str(&format!("PROBE_JSON {payload}\n"));
        out
    }
}

/// 脱敏：只暴露前缀与长度，绝不打印 token 本体。
fn mask(secret: &str) -> String {
    let len = secret.chars().count();
    if len <= 8 {
        return format!("***({len})");
    }
    let head: String = secret.chars().take(6).collect();
    format!("{head}…({len})")
}

fn require_endpoint() -> bool {
    std::env::var("PROBE_REQUIRE_ENDPOINT")
        .map(|value| matches!(value.trim(), "1" | "true" | "yes"))
        .unwrap_or(false)
}

/// 跑完整自检。
pub async fn run(config: &KernelConfig) -> Report {
    let mut report = Report::default();
    let base = config.upstream_base();
    let origin = match Origin::parse(&base) {
        Ok(origin) => {
            report.push(
                "config",
                true,
                true,
                format!(
                    "upstream_mode={} base={base}",
                    if config.direct() { "direct" } else { "slot" }
                ),
            );
            origin
        }
        Err(error) => {
            report.push("config", false, true, format!("upstream_base 非法: {error}"));
            return report;
        }
    };

    // 1) 凭据
    let credential_path = config.credential_path();
    let store = Arc::new(Store::new(credential_path.clone()));
    let credential = match store.load() {
        Ok((credential, _)) => {
            let remaining_ms = if credential.expires_at > 0 {
                credential.expires_at - now_ms()
            } else {
                0
            };
            if !credential.valid() {
                report.push("credential", false, true, format!("{credential_path} 没有可用 token"));
            } else if !credential.is_api_key() && credential.expires_at > 0 && remaining_ms <= 0 {
                report.push(
                    "credential",
                    false,
                    true,
                    format!(
                        "{credential_path} 已过期（kind={} token={}）",
                        credential.kind.as_str(),
                        mask(credential.token())
                    ),
                );
            } else {
                let expiry = if credential.expires_at > 0 {
                    format!("剩余 {:.1}h", remaining_ms as f64 / 3_600_000.0)
                } else {
                    "无过期时间".to_string()
                };
                report.push(
                    "credential",
                    true,
                    true,
                    format!(
                        "{credential_path} kind={} scheme={} token={} {expiry}",
                        credential.kind.as_str(),
                        credential.resolved_scheme().as_str(),
                        mask(credential.token())
                    ),
                );
            }
            Some(credential)
        }
        Err(error) => {
            report.push(
                "credential",
                false,
                true,
                format!("{credential_path} 不可读: {error}"),
            );
            None
        }
    };

    // 凭据不可用就不要建链（fail closed，与 hop 路径一致）。
    let credential_failed = report
        .checks
        .iter()
        .any(|check| check.name == "credential" && !check.ok);
    if credential_failed {
        return report;
    }

    // 2) 代理隧道（只建连，不发请求）
    let proxy = match Proxy::from_settings(&config.proxy_settings()) {
        Ok(proxy) => {
            match &proxy {
                Some(_) => {
                    let proxy = proxy.as_ref().expect("proxy");
                    match proxy.dial(&origin.host, origin.port).await {
                        Ok(_) => report.push(
                            "proxy",
                            true,
                            true,
                            format!("隧道建立成功 → {}:{}", origin.host, origin.port),
                        ),
                        Err(error) => report.push(
                            "proxy",
                            false,
                            true,
                            format!("隧道失败 → {}:{}: {error}", origin.host, origin.port),
                        ),
                    }
                }
                None => report.push("proxy", true, true, "未配置（直连出口）".to_string()),
            }
            proxy
        }
        Err(error) => {
            report.push("proxy", false, true, error.to_string());
            None
        }
    };
    let proxy_failed = report
        .checks
        .iter()
        .any(|check| check.name == "proxy" && !check.ok);
    if proxy_failed {
        return report;
    }

    // 3) TLS + h2
    let mut refresher = Refresher::new(config.oauth_token_url()).with_store(Arc::clone(&store));
    refresher.skew_ms = config.refresh_skew_seconds() * 1000;
    let client = match UpstreamClient::new(&base, config.upstream_ca.clone().map(std::path::PathBuf::from)) {
        Ok(client) => client.with_proxy(proxy).with_refresher(Arc::new(refresher)),
        Err(error) => {
            report.push("tls_h2", false, true, format!("客户端构造失败: {error}"));
            return report;
        }
    };
    match client.handshake().await {
        Ok(()) => report.push(
            "tls_h2",
            true,
            true,
            format!("{} TLS(ALPN h2) 握手成功", origin.host),
        ),
        Err(error) => {
            report.push("tls_h2", false, true, format!("握手失败: {error}"));
            return report;
        }
    }

    // 4) 非推理端点（信息项）
    let required = require_endpoint();
    match client.get("/v1/models").await {
        Ok(response) => {
            let status = response.head.status;
            if status == 200 {
                let body = response.collect(256 * 1024).await.unwrap_or_default();
                let count = serde_json::from_slice::<serde_json::Value>(&body)
                    .ok()
                    .and_then(|value| value.get("data").and_then(|data| data.as_array().map(Vec::len)))
                    .unwrap_or(0);
                report.push("endpoint", true, required, format!("GET /v1/models → 200（{count} 个模型）"));
            } else if status == 401 || status == 403 {
                report.push(
                    "endpoint",
                    true,
                    required,
                    format!("GET /v1/models → {status}（该凭据不覆盖 models，不影响 messages）"),
                );
            } else {
                report.push("endpoint", false, required, format!("GET /v1/models → {status}"));
            }
        }
        Err(error) => report.push("endpoint", false, required, format!("GET /v1/models 失败: {error}")),
    }

    let _ = credential;
    report
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn masks_secrets() {
        assert_eq!(mask("short"), "***(5)");
        assert_eq!(mask("sk-ant-abcdefghij"), "sk-ant…(17)");
    }

    #[test]
    fn exit_code_follows_first_required_failure() {
        let mut report = Report::default();
        report.push("credential", false, true, "x");
        report.push("proxy", false, true, "y");
        assert_eq!(report.exit_code(), 1);
        let mut report = Report::default();
        report.push("credential", true, true, "ok");
        report.push("proxy", false, true, "y");
        assert_eq!(report.exit_code(), 2);
        let mut report = Report::default();
        report.push("config", true, true, "ok");
        report.push("endpoint", false, false, "info only");
        assert_eq!(report.exit_code(), 0);
    }
}
