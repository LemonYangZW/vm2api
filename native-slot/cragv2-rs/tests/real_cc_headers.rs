//! 用**现网真实出站快照**（`kin.db` 的 request_log_debug）做可回归对照。
//!
//! 不再靠「看起来对」：这个测试断言我们生成的出站头覆盖真实快照里的必需项，
//! 且**刻意不出现**某些头（如 `x-stainless-timeout`，Go 注释明确 2026-10-24 起不再写）。

use cragv2::http::wire::build_messages_request;
use serde_json::{json, Value};

fn fixture() -> Value {
    let text = std::fs::read_to_string("testdata/real-cc-headers.json").expect("缺少真实头快照 fixture");
    serde_json::from_str(&text).expect("fixture 解析失败")
}

fn headers(stream: bool) -> Vec<(String, String)> {
    let body = json!({
        "model": "claude-opus-5-5",
        "max_tokens": 32000,
        "system": [{"type": "text", "text": "x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli; cch=00000;"}],
        "messages": [{"role": "user", "content": "hi"}]
    });
    build_messages_request(
        &[],
        &["claude-code-20250219".to_string()],
        &body,
        false,
        true,
        stream,
        "sess-fixture",
    )
    .headers
}

#[test]
fn outbound_headers_cover_real_snapshot() {
    let fixture = fixture();
    let names: Vec<String> = headers(true).into_iter().map(|(k, _)| k).collect();
    let absent = fixture["deliberately_absent"].as_array().cloned().unwrap_or_default();

    let mut missing = Vec::new();
    for key in fixture["required"].as_array().expect("required 列表") {
        let key = key.as_str().unwrap_or_default();
        if !names.iter().any(|n| n == key) {
            missing.push(key.to_string());
        }
    }
    assert!(missing.is_empty(), "缺少现网真实快照里的头: {missing:?}（实际: {names:?}）");

    for key in &absent {
        let key = key.as_str().unwrap_or_default();
        assert!(
            !names.iter().any(|n| n == key),
            "不应出现刻意省略的头: {key}"
        );
    }
}

#[test]
fn product_line_header_stays_074() {
    let fixture = fixture();
    let expected = fixture["product_line"]["x-stainless-package-version"]["ours"]
        .as_str()
        .expect("fixture 缺少 ours");
    let headers = headers(true);
    let value = headers
        .iter()
        .find(|(k, _)| k == "x-stainless-package-version")
        .map(|(_, v)| v.as_str());
    assert_eq!(value, Some(expected), "crag v2 的 SDK 头必须是 2.1.88 基线值");
}

#[test]
fn stream_flag_changes_accept_header() {
    let stream = headers(true);
    let plain = headers(false);
    let pick = |list: &[(String, String)]| {
        list.iter()
            .find(|(k, _)| k == "accept")
            .map(|(_, v)| v.clone())
            .unwrap_or_default()
    };
    assert_eq!(pick(&stream), "application/json, text/event-stream");
    assert_eq!(pick(&plain), "application/json");
}
