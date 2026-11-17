//! system 布局与 cch 占位符的**逐字节**差分：Rust 实现 vs 现网 JS 实现。
//!
//! 现网参考实现：`native-slot/testdata/jsref/ref.cjs`（由现网 cli-node 模块拼接，
//! 只在本地保留）。任何一处语义漂移都会在这里被抓住。

use std::io::Write;
use std::process::{Command, Stdio};

use cragv2::protocol::system;
use serde_json::{json, Value};

/// ref.cjs 的每个结果是「JSON.stringify 形态的字符串」，这里还原成 JSON 值。
fn unstring(value: &Value) -> Value {
    match value {
        Value::String(text) => serde_json::from_str(text).unwrap_or_else(|_| value.clone()),
        other => other.clone(),
    }
}

fn jsref(cases: &Value) -> Option<Value> {
    let script = "../testdata/jsref/ref.cjs";
    if !std::path::Path::new(script).exists() {
        eprintln!("skip: 缺少 {script}");
        return None;
    }
    let mut child = Command::new("node")
        .arg(script)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .ok()?;
    child
        .stdin
        .as_mut()?
        .write_all(cases.to_string().as_bytes())
        .ok()?;
    let out = child.wait_with_output().ok()?;
    if !out.status.success() {
        eprintln!("skip: node 执行失败: {}", String::from_utf8_lossy(&out.stderr));
        return None;
    }
    serde_json::from_slice(&out.stdout).ok()
}

#[test]
fn wire_and_placeholder_match_js_reference() {
    let header = "x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli; cch=abcde;";
    let header_no_cch = "x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli;";
    let header_no_entry = "x-anthropic-billing-header: cc_version=2.1.303;";
    let system = json!([
        {"type": "text", "text": header},
        {"type": "text", "text": "hello", "cache_control": {"type": "ephemeral"}}
    ]);

    let cases = json!([
        {"op": "wire", "system": system},
        {"op": "cchPlaceholder", "text": header},
        {"op": "cchPlaceholder", "text": header_no_cch},
        {"op": "cchPlaceholder", "text": header_no_entry},
        {"op": "cchPlaceholderInPlace", "text": header},
        {"op": "cchPlaceholderInPlace", "text": header_no_cch},
        {"op": "leftover", "system": [header, system::IDENTITY, "# Environment\n - Timezone: UTC", "keep me", "also me"]},
    ]);
    let Some(expected) = jsref(&cases) else { return };
    let raw = expected.as_array().unwrap();
    let expected: Vec<Value> = raw.iter().map(unstring).collect();

    // 1) wire
    let got = system::wire_system_blocks(&system, false).unwrap();
    assert_eq!(Value::Array(got), expected[0], "wireSystemBlocks 漂移");

    // 2/3/4) cchPlaceholder
    for (index, text) in [header, header_no_cch, header_no_entry].iter().enumerate() {
        assert_eq!(
            Value::String(system::with_cch_placeholder(text)),
            expected[index + 1],
            "withCchPlaceholder 漂移: {text}"
        );
    }

    // 5/6) cchPlaceholderInPlace
    for (index, text) in [header, header_no_cch].iter().enumerate() {
        assert_eq!(
            Value::String(system::with_cch_placeholder_in_place(text)),
            expected[index + 4],
            "withCchPlaceholderInPlace 漂移: {text}"
        );
    }

    // 7) leftover
    let lines: Vec<String> = [header, system::IDENTITY, "# Environment\n - Timezone: UTC", "keep me", "also me"]
        .iter()
        .map(|s| s.to_string())
        .collect();
    match (system::leftover_from_system_prompt(&lines), &expected[6]) {
        (Some(got), Value::String(want)) => assert_eq!(&got, want, "leftoverFromSystemPrompt 漂移"),
        (None, Value::Null) => {}
        (got, want) => panic!("leftover 形状不一致: got={got:?} want={want:?}"),
    }
}

#[test]
fn zero_billing_shape_matches_js_reference() {
    // prompt_id 是随机值，只比对「归一化后除了 prompt_id 之外完全一致」。
    let source = "x-anthropic-billing-header: cc_version=2.1.303; prompt_version=<abc123>; cch=abcde;";
    let cases = json!([{"op": "zero", "text": source}]);
    let Some(expected) = jsref(&cases) else { return };
    let want = unstring(&expected[0]).as_str().unwrap().to_string();

    let got = system::finalize_zero_billing(source, "PROMPT_ID");
    let normalize = |text: &str| {
        // 去掉随机 prompt id，再比较其余每个字节。
        let mut out = String::new();
        for part in text.split(" cc_prompt_id=") {
            if out.is_empty() {
                out.push_str(part);
            } else if let Some(rest) = part.split_once(';') {
                out.push_str(&format!(" cc_prompt_id=X;{}", rest.1));
            }
        }
        out
    };
    assert_eq!(normalize(&got), normalize(&want), "finalizeZeroBilling 漂移");
}
