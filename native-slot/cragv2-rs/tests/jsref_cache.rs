//! 缓存 marker 规则的逐字节差分：Rust vs 现网 JS（`testdata/jsref/ref.cjs` 的 `cache`/`explicitTtl`）。

use std::io::Write;
use std::process::{Command, Stdio};

use cragv2::protocol::cache;
use serde_json::{json, Value};

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
    child.stdin.as_mut()?.write_all(cases.to_string().as_bytes()).ok()?;
    let out = child.wait_with_output().ok()?;
    if !out.status.success() {
        eprintln!("skip: node 失败: {}", String::from_utf8_lossy(&out.stderr));
        return None;
    }
    serde_json::from_slice(&out.stdout).ok()
}

fn unstring(value: &Value) -> Value {
    match value {
        Value::String(text) => serde_json::from_str(text).unwrap_or_else(|_| value.clone()),
        other => other.clone(),
    }
}

fn cases() -> Vec<Value> {
    vec![
        // 1) 五个 marker：tools 逆序先删
        json!({
            "op": "cache",
            "ttl": "1h",
            "params": {
                "system": [{"type": "text", "text": "s", "cache_control": {"type": "ephemeral"}}],
                "tools": [
                    {"name": "t1", "cache_control": {"type": "ephemeral"}},
                    {"name": "t2", "cache_control": {"type": "ephemeral"}}
                ],
                "messages": [{"role": "user", "content": [
                    {"type": "text", "text": "m1", "cache_control": {"type": "ephemeral"}},
                    {"type": "text", "text": "m2", "cache_control": {"type": "ephemeral"}}
                ]}]
            }
        }),
        // 2) thinking 块带 marker 必须被清掉
        json!({
            "op": "cache",
            "ttl": "1h",
            "params": {
                "messages": [{"role": "assistant", "content": [
                    {"type": "thinking", "thinking": "x", "cache_control": {"type": "ephemeral"}},
                    {"type": "text", "text": "y", "cache_control": {"type": "ephemeral"}}
                ]}]
            }
        }),
        // 3) 已有显式 ttl 的不改；缺的补；scope 保留
        json!({
            "op": "cache",
            "ttl": "5m",
            "params": {
                "system": [
                    {"type": "text", "text": "a", "cache_control": {"type": "ephemeral", "ttl": "1h"}},
                    {"type": "text", "text": "b", "cache_control": {"type": "ephemeral", "scope": "global"}}
                ]
            }
        }),
        // 4) 非 ephemeral 的 cache_control 不动
        json!({
            "op": "cache",
            "ttl": "1h",
            "params": {
                "system": [
                    {"type": "text", "text": "a", "cache_control": {"type": "ephemeral", "ttl": "1h"}},
                    {"type": "text", "text": "b", "cache_control": {"type": "persistent"}}
                ]
            }
        }),
        // 5) preserve 段不受影响
        json!({
            "op": "cache",
            "ttl": "1h",
            "preserve": {"preserveSystem": true},
            "params": {
                "system": [{"type": "text", "text": "a", "cache_control": {"type": "ephemeral", "ttl": "1h"}},
                           {"type": "text", "text": "b", "cache_control": {"type": "ephemeral"}}],
                "messages": [{"role": "user", "content": [
                    {"type": "text", "text": "m", "cache_control": {"type": "ephemeral"}}
                ]}]
            }
        }),
        // 6) explicitTtl
        json!({"op": "explicitTtl", "parts": [
            {"cache_control": {"type": "ephemeral", "ttl": "1h"}},
            {"cache_control": {"type": "ephemeral", "ttl": "5m"}}
        ]}),
    ]
}

fn rust_apply(case: &Value) -> Value {
    let mut params = case["params"].clone();
    let ttl = case["ttl"].as_str().unwrap_or("1h");
    let preserve = case.get("preserve").cloned().unwrap_or(json!({}));
    let flag = |key: &str| preserve.get(key).and_then(|v| v.as_bool()).unwrap_or(false);
    cache::apply_kin_owned_cache_markers(
        &mut params,
        ttl,
        flag("preserveSystem"),
        flag("preserveMessages"),
        flag("preserveTools"),
    );
    params
}

#[test]
fn cache_markers_match_js_reference() {
    let cases = Value::Array(cases());
    let Some(expected) = jsref(&cases) else { return };
    let expected = expected.as_array().unwrap();
    let list = cases.as_array().unwrap();

    for (index, case) in list.iter().enumerate() {
        let want = unstring(&expected[index]);
        let got = match case["op"].as_str() {
            Some("cache") => rust_apply(case),
            Some("explicitTtl") => {
                let parts: Vec<Value> = case["parts"].as_array().cloned().unwrap_or_default();
                let refs: Vec<&Value> = parts.iter().collect();
                match cache::explicit_cache_ttl(&refs) {
                    Some(ttl) => Value::String(ttl.to_string()),
                    None => Value::Null,
                }
            }
            other => panic!("未知 op: {other:?}"),
        };
        assert_eq!(got, want, "case {index} 漂移（{:?}）", case["op"]);
    }
}
