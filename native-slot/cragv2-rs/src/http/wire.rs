//! 出站请求的精确字节序列化 —— CCH 的唯一天然打戳点。
//!
//! 真值：`11_CRAG_V2_SPEC.md` §6.2 / §6.3。CCH 的对象是**投影后紧凑 JSON 文本
//! 的 UTF-8 字节**，因此出站 body 必须由本层一次成型（header 顺序固定，
//! 不复用调用方原始排版），之后不允许再经过任何双向序列化。

use serde_json::Value;

use crate::protocol::{beta::beta_header, cch, identity};

/// `x-stainless-*` 固定序列（顺序即 wire 顺序）。
pub fn stainless_pairs() -> Vec<(&'static str, String)> {
    vec![
        ("x-stainless-lang", "js".to_string()),
        ("x-stainless-os", "Linux".to_string()),
        ("x-stainless-arch", "x64".to_string()),
        ("x-stainless-runtime", "node".to_string()),
        ("x-stainless-runtime-version", "v26.12.1".to_string()),
        ("x-stainless-package-version", identity::sdk_package_version()),
    ]
}

/// 直连形态的请求类别（现网 `RequestClass("sdk")` → `main`）。
pub const REQUEST_CLASS_MAIN: &str = "main";

/// 官方 CLI 每个请求都带 `metadata.user_id`（`{device_id,account_uuid,session_id}` 的紧凑 JSON 字符串）。
/// 缺它会被客户端口校验直接拒（实测第三方中转：400 "use the correct Claude Code client"）；
/// 值只要结构对，随机 device_id 也过，所以无需与真实账号关联。
pub fn stamp_metadata(body: &mut Value, user_id: &str) {
    let Some(obj) = body.as_object_mut() else { return };
    if obj.get("metadata").and_then(|m| m.get("user_id")).is_some() {
        return;
    }
    obj.insert("metadata".into(), serde_json::json!({ "user_id": user_id }));
}

/// 出站头部集合（顺序稳定，便于逐字节断言）。
pub struct OutboundHeaders {
    pub pairs: Vec<(String, String)>,
}

impl OutboundHeaders {
    /// 组装完整头部：调用方头 → 官方向量覆盖 → beta 重排。
    pub fn build(
        caller: &[(String, String)],
        betas: &[String],
        background: bool,
        oauth: bool,
    ) -> Self {
        let mut pairs: Vec<(String, String)> = Vec::with_capacity(caller.len() + 16);
        for (key, value) in caller {
            let lower = key.to_ascii_lowercase();
            if lower == "host" || lower == "content-length" || lower == "connection" {
                continue;
            }
            pairs.push((lower, value.clone()));
        }
        let has = |pairs: &Vec<(String, String)>, key: &str| pairs.iter().any(|(k, _)| k == key);
        if !has(&pairs, "anthropic-version") {
            pairs.push(("anthropic-version".into(), "2023-06-01".into()));
        }
        let beta_value = beta_header(betas);
        if !beta_value.is_empty() {
            pairs.retain(|(k, _)| k != "anthropic-beta");
            pairs.push(("anthropic-beta".into(), beta_value));
        }
        let ua = pairs
            .iter()
            .find(|(k, _)| k == "user-agent")
            .map(|(_, v)| v.clone())
            .unwrap_or_default();
        let ua_replace = ua.is_empty() || ua.contains("Bun/") || ua.to_ascii_lowercase().contains("axios/");
        if ua_replace {
            pairs.retain(|(k, _)| k != "user-agent");
            pairs.push(("user-agent".into(), identity::user_agent()));
        }
        if !has(&pairs, "x-app") {
            pairs.push(("x-app".into(), identity::x_app(background).into()));
        }
        // 实测：官方 CLI 2.1.321 不发 x-client-request-id，不要凭空补。
        if oauth {
            pairs.retain(|(k, _)| k != "x-api-key");
        }
        for (key, value) in stainless_pairs() {
            pairs.retain(|(k, _)| k != key);
            pairs.push((key.to_string(), value));
        }
        if !has(&pairs, "x-stainless-retry-count") {
            pairs.push(("x-stainless-retry-count".into(), "0".into()));
        }
        if !has(&pairs, "x-stainless-timeout") {
            pairs.push(("x-stainless-timeout".into(), "600".into()));
        }
        Self { pairs }
    }

    /// 官方 CC 形态的补充头（真值来自现网 Go 内核 `ApplyOfficialHeaders` 与
    /// 真实出站快照）：
    /// - `anthropic-dangerous-direct-browser-access: true`（内核显式设置）
    /// - `x-claude-code-session-id`（内核显式设置）
    /// - `accept: application/json`（流式与否都一样，实测官方 CLI 2.1.321）
    /// 刻意**不补**：`accept-encoding`（我们不解压）、`x-claude-code-prompt-id`
    /// （仅 gateway hint 开关下才发）。
    /// 实测**不发**：`x-client-request-id`、`x-claude-code-request-class`（官方 CLI 都不带）。
    pub fn apply_claude_code_headers(&mut self, session_id: &str, stream: bool, request_class: Option<&str>) {
        self.set_if_absent("anthropic-dangerous-direct-browser-access", "true");
        self.set_if_absent("x-claude-code-session-id", session_id);
        if let Some(class) = request_class.filter(|v| !v.is_empty()) {
            self.set_if_absent("x-claude-code-request-class", class);
        }
        self.pairs.retain(|(k, _)| k != "accept");
        self.pairs.push((
            "accept".into(),
            // 实测（官方 CLI 2.1.321，请求体 stream=true）：accept 仍是纯
            // application/json，SSE 靠 body 的 stream 标志，不靠 Accept。
            "application/json".to_string(),
        ));
        let _ = stream;
    }

    fn set_if_absent(&mut self, key: &str, value: &str) {
        if !self.pairs.iter().any(|(k, _)| k == key) {
            self.pairs.push((key.to_string(), value.to_string()));
        }
    }

    pub fn get(&self, key: &str) -> Option<&str> {
        self.pairs
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.as_str())
    }
}

/// 出站 body：紧凑文本 + CCH 打戳。返回 (字节, 计算出的 cch)。
pub fn outbound_body(body: &Value) -> (Vec<u8>, String) {
    let text = serde_json::to_string(body).unwrap_or_default();
    if !text.contains("x-anthropic-billing-header:") {
        return (text.into_bytes(), String::new());
    }
    let stamped = cch::stamp_cch_body(&text);
    let computed = cch::compute_cch(&stamped);
    (stamped.into_bytes(), computed)
}

/// 一次 hop 的完整 wire 请求（header 列表 + body 字节）。
#[derive(Debug)]
pub struct WireRequest {
    pub method: &'static str,
    pub path: &'static str,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
    pub cch: String,
}

/// 组装 `POST /v1/messages` 的 wire 请求。
pub fn build_messages_request(
    caller_headers: &[(String, String)],
    betas: &[String],
    body: &Value,
    background: bool,
    oauth: bool,
    stream: bool,
    session_id: &str,
) -> WireRequest {
    let mut headers = OutboundHeaders::build(caller_headers, betas, background, oauth);
    let (bytes, cch) = outbound_body(body);
    headers.pairs.retain(|(k, _)| k != "content-type" && k != "content-length");
    headers.pairs.push(("content-type".into(), "application/json".into()));
    headers
        .apply_claude_code_headers(session_id, stream, Some(REQUEST_CLASS_MAIN));
    headers.pairs.push(("content-length".into(), bytes.len().to_string()));
    WireRequest {
        method: "POST",
        path: "/v1/messages",
        headers: headers.pairs,
        body: bytes,
        cch,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn body_with_billing() -> Value {
        json!({
            "model": "claude-opus-5-5",
            "max_tokens": 64,
            "system": [{"type":"text","text":"x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli; cch=00000;"}],
            "messages": [{"role":"user","content":"hi"}]
        })
    }

    #[test]
    fn sdk_header_matches_official_cli() {
        // 实测官方 CLI 2.1.321：0.128.0 / runtime v26.12.1
        let headers = OutboundHeaders::build(&[], &[], false, true);
        assert_eq!(headers.get("x-stainless-package-version"), Some("0.128.0"));
        assert_eq!(headers.get("x-stainless-runtime-version"), Some("v26.12.1"));
        assert!(headers.get("x-client-request-id").is_none(), "官方 CLI 不发这个头");
    }

    #[test]
    fn beta_header_is_reordered_and_kept_single() {
        let betas = vec!["effort-2025-11-24".to_string(), "claude-code-20250219".to_string()];
        let headers = OutboundHeaders::build(&[("anthropic-beta".into(), "stale".into())], &betas, false, true);
        assert_eq!(
            headers.get("anthropic-beta"),
            Some("claude-code-20250219,effort-2025-11-24")
        );
    }

    #[test]
    fn metadata_user_id_is_stamped_once() {
        let user_id = r#"{"device_id":"a","account_uuid":"","session_id":"s"}"#;
        let mut body = json!({"model": "m", "messages": []});
        stamp_metadata(&mut body, user_id);
        assert_eq!(body["metadata"]["user_id"], user_id);
        // 已存在就不覆盖（调用方自己带的时候以调用方为准）。
        stamp_metadata(&mut body, "other");
        assert_eq!(body["metadata"]["user_id"], user_id);
    }

    #[test]
    fn body_is_stamped_once_and_verifiable() {
        let request = build_messages_request(&[], &[], &body_with_billing(), false, true, false, "s1");
        let text = String::from_utf8(request.body.clone()).unwrap();
        assert_eq!(request.cch.len(), 5);
        assert!(text.contains(&format!("cch={};", request.cch)), "{text}");
        // 打戳后重新计算应保持稳定。
        assert_eq!(crate::protocol::cch::compute_cch(&text), request.cch);
    }

    #[test]
    fn includes_official_claude_code_headers() {
        let stream = build_messages_request(&[], &[], &body_with_billing(), false, true, true, "sess-1");
        let get = |name: &str| {
            stream
                .headers
                .iter()
                .find(|(k, _)| k == name)
                .map(|(_, v)| v.as_str())
        };
        assert_eq!(get("anthropic-dangerous-direct-browser-access"), Some("true"));
        assert_eq!(get("x-claude-code-session-id"), Some("sess-1"));
        assert_eq!(get("x-claude-code-request-class"), Some("main"));
        assert_eq!(get("accept"), Some("application/json"));

        // 非流式：accept 退回纯 JSON
        let plain = build_messages_request(&[], &[], &body_with_billing(), false, true, false, "sess-1");
        let accept = plain
            .headers
            .iter()
            .find(|(k, _)| k == "accept")
            .map(|(_, v)| v.as_str());
        assert_eq!(accept, Some("application/json"));
        // 实测官方 CLI 带 x-stainless-timeout: 600
        assert_eq!(
            plain.headers.iter().find(|(k, _)| k == "x-stainless-timeout").map(|(_, v)| v.as_str()),
            Some("600")
        );
    }

    #[test]
    fn content_length_matches_body() {
        let request = build_messages_request(&[], &[], &body_with_billing(), false, true, false, "s1");
        let len = request
            .headers
            .iter()
            .find(|(k, _)| k == "content-length")
            .map(|(_, v)| v.clone())
            .unwrap();
        assert_eq!(len, request.body.len().to_string());
    }
}
