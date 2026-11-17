//! CCH（Claude Code Hash）投影与打戳。
//!
//! 语义真值：`reverse/kin-kernel/docs/11_CRAG_V2_SPEC.md` §6.2。
//! 与兄台实现 `native-slot/internal/upstream/cch.go` 逐字节同构：
//!
//! ```text
//! project_for_cch(body):
//!   ① compact_json_text       JSON.parse + JSON.stringify（失败保留原文）
//!   ② reset_root_billing      首个 canonical `x-anthropic-billing-header:` 里的
//!                             cch=xxxxx 重置为 cch=00000，再 stringify
//!   ③ blank_string_models     每个 `"model":"…"` 的值清空（保留键名与引号，尊重转义）
//!   ④ cut_spans               删除 `"fallbacks":[…]` / `"fallback_credit_token":"…"`
//!                             / `"max_tokens":<digits>`，并吞掉相邻逗号
//! compute_cch(body) = (xxh64(project_for_cch(body), CCH_SEED) & 0xfffff) → 5 位小写 hex
//! stamp_cch_body(body) = cch=00000 → cch=<compute_cch>，再 stringify
//! ```
//!
//! 参与哈希的是**投影后紧凑 JSON 文本的 UTF-8 字节**；`model`、`max_tokens`、
//! `fallbacks`、`fallback_credit_token` 全部不参与。

use serde_json::Value;

/// 现网 2.1.303 的 CCH 种子。
pub const CCH_SEED: u64 = 0x4d659218e32a3268;
/// 打戳占位值（5 位十六进制）。
pub const CCH_PLACEHOLDER: &str = "00000";

const PRIME64_1: u64 = 0x9e37_79b1_85eb_ca87;
const PRIME64_2: u64 = 0xc2b2_ae3d_27d4_eb4f;
const PRIME64_3: u64 = 0x1656_67b1_9e37_79f9;
const PRIME64_4: u64 = 0x85eb_ca77_c2b2_ae63;
const PRIME64_5: u64 = 0x27d4_eb2f_1656_67c5;

fn round(acc: u64, input: u64) -> u64 {
    acc.wrapping_add(input.wrapping_mul(PRIME64_2))
        .rotate_left(31)
        .wrapping_mul(PRIME64_1)
}

fn merge_round(acc: u64, val: u64) -> u64 {
    (acc ^ round(0, val)).wrapping_mul(PRIME64_1).wrapping_add(PRIME64_4)
}

/// 标准 XXH64（与现网 JS / Go 实现逐位一致）。
pub fn xxh64(data: &[u8], seed: u64) -> u64 {
    let n = data.len();
    let mut i = 0usize;
    let mut h: u64;
    if n >= 32 {
        let mut v1 = seed.wrapping_add(PRIME64_1).wrapping_add(PRIME64_2);
        let mut v2 = seed.wrapping_add(PRIME64_2);
        let mut v3 = seed;
        let mut v4 = seed.wrapping_sub(PRIME64_1);
        while i <= n - 32 {
            v1 = round(v1, u64::from_le_bytes(data[i..i + 8].try_into().unwrap()));
            v2 = round(v2, u64::from_le_bytes(data[i + 8..i + 16].try_into().unwrap()));
            v3 = round(v3, u64::from_le_bytes(data[i + 16..i + 24].try_into().unwrap()));
            v4 = round(v4, u64::from_le_bytes(data[i + 24..i + 32].try_into().unwrap()));
            i += 32;
        }
        h = v1
            .rotate_left(1)
            .wrapping_add(v2.rotate_left(7))
            .wrapping_add(v3.rotate_left(12))
            .wrapping_add(v4.rotate_left(18));
        h = merge_round(h, v1);
        h = merge_round(h, v2);
        h = merge_round(h, v3);
        h = merge_round(h, v4);
    } else {
        h = seed.wrapping_add(PRIME64_5);
    }
    h = h.wrapping_add(n as u64);
    while i + 8 <= n {
        let k = round(0, u64::from_le_bytes(data[i..i + 8].try_into().unwrap()));
        h = (h ^ k).rotate_left(27).wrapping_mul(PRIME64_1).wrapping_add(PRIME64_4);
        i += 8;
    }
    if i + 4 <= n {
        let k = (u64::from(u32::from_le_bytes(data[i..i + 4].try_into().unwrap())))
            .wrapping_mul(PRIME64_1);
        h = (h ^ k).rotate_left(23).wrapping_mul(PRIME64_2).wrapping_add(PRIME64_3);
        i += 4;
    }
    while i < n {
        let k = (data[i] as u64).wrapping_mul(PRIME64_5);
        h = (h ^ k).rotate_left(11).wrapping_mul(PRIME64_1);
        i += 1;
    }
    h ^= h >> 33;
    h = h.wrapping_mul(PRIME64_2);
    h ^= h >> 29;
    h = h.wrapping_mul(PRIME64_3);
    h ^= h >> 32;
    h
}

/// 删除 `[start,end)` 并吞掉一侧的逗号（与现网实现一致）。
fn cut(s: &[u8], start: usize, end: usize) -> Vec<u8> {
    let (mut start, mut end) = (start, end);
    if end < s.len() && s[end] == b',' {
        end += 1;
    } else if start > 0 && s[start - 1] == b',' {
        start -= 1;
    }
    let mut out = Vec::with_capacity(s.len() - (end - start));
    out.extend_from_slice(&s[..start]);
    out.extend_from_slice(&s[end..]);
    out
}

fn find(hay: &[u8], needle: &[u8], from: usize) -> Option<usize> {
    if from > hay.len() || needle.is_empty() {
        return None;
    }
    hay[from..]
        .windows(needle.len())
        .position(|w| w == needle)
        .map(|p| p + from)
}

/// ③ 把每个 `"model":"…"` 的值清空，保留键名与引号，尊重反斜杠转义。
fn blank_string_models(s: &[u8]) -> Vec<u8> {
    const NEEDLE: &[u8] = b"\"model\":\"";
    let mut out = Vec::with_capacity(s.len());
    let mut i = 0usize;
    while let Some(j) = find(s, NEEDLE, i) {
        // 若该 model 的值不是字符串（如 "model":1），NEEDLE 不会命中。
        let mut k = j + NEEDLE.len();
        while k < s.len() {
            if s[k] == b'\\' && k + 1 < s.len() {
                k += 2;
                continue;
            }
            if s[k] == b'"' {
                break;
            }
            k += 1;
        }
        out.extend_from_slice(&s[i..j + NEEDLE.len()]);
        i = k.min(s.len());
    }
    out.extend_from_slice(&s[i..]);
    out
}

/// ④a 删除 `"fallbacks":[…]`（括号深度扫描，跳过字符串内部）。
fn skip_fallbacks(s: Vec<u8>) -> Vec<u8> {
    const NEEDLE: &[u8] = b"\"fallbacks\":[";
    let Some(j) = find(&s, NEEDLE, 0) else { return s };
    let mut depth = 0i32;
    let (mut in_str, mut esc) = (false, false);
    let mut i = j + NEEDLE.len() - 1;
    while i < s.len() {
        let c = s[i];
        if in_str {
            if esc {
                esc = false;
            } else if c == b'\\' {
                esc = true;
            } else if c == b'"' {
                in_str = false;
            }
        } else if c == b'"' {
            in_str = true;
        } else if c == b'[' {
            depth += 1;
        } else if c == b']' {
            depth -= 1;
            if depth == 0 {
                return cut(&s, j, i + 1);
            }
        }
        i += 1;
    }
    s
}

/// ④b 删除 `"fallback_credit_token":"…"`（字符串扫描）。
fn skip_credit(s: Vec<u8>) -> Vec<u8> {
    const NEEDLE: &[u8] = b"\"fallback_credit_token\":\"";
    let Some(j) = find(&s, NEEDLE, 0) else { return s };
    let mut k = j + NEEDLE.len();
    while k < s.len() {
        if s[k] == b'\\' && k + 1 < s.len() {
            k += 2;
            continue;
        }
        if s[k] == b'"' {
            return cut(&s, j, k + 1);
        }
        k += 1;
    }
    s
}

/// ④c 删除 `"max_tokens":<digits>`（数字扫描）。
fn skip_max_tokens(s: Vec<u8>) -> Vec<u8> {
    const NEEDLE: &[u8] = b"\"max_tokens\":";
    let Some(j) = find(&s, NEEDLE, 0) else { return s };
    let mut k = j + NEEDLE.len();
    if k >= s.len() || !s[k].is_ascii_digit() {
        return s;
    }
    while k < s.len() && s[k].is_ascii_digit() {
        k += 1;
    }
    cut(&s, j, k)
}

/// canonical 计费头：锚定块起始、限制同一行、5 位十六进制后紧跟分号。
fn canonical_cch_re() -> &'static regex::Regex {
    use std::sync::OnceLock;
    static RE: OnceLock<regex::Regex> = OnceLock::new();
    RE.get_or_init(|| {
        regex::Regex::new(r"(?i)^\s*x-anthropic-billing-header:[^\r\n]*?\bcch=[0-9a-f]{5};").unwrap()
    })
}

/// 就地把首个 canonical 计费头里的 cch 值替换成 `value`，返回是否命中。
fn replace_canonical_cch(text: &str, value: &str) -> Option<String> {
    let caps = canonical_cch_re().find(text)?;
    let head = &text[..caps.end()];
    // 在头部里定位最后一个 `cch=`，其后的 5 位就是待替换值。
    let at = head.to_ascii_lowercase().rfind("cch=")?;
    let start = at + 4;
    let end = start + 5;
    if end > head.len() {
        return None;
    }
    let old = &head[start..end];
    if old.len() != 5 || !old.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    let mut out = String::with_capacity(text.len());
    out.push_str(&text[..start]);
    out.push_str(value);
    out.push_str(&text[end..]);
    Some(out)
}

/// ② 在 body.system（字符串或 `[{text}]`）里重置首个 canonical 计费头 cch。
/// 返回是否命中。
pub fn set_system_cch(body: &mut Value, value: &str) -> bool {
    let Some(obj) = body.as_object_mut() else { return false };
    match obj.get_mut("system") {
        Some(Value::String(text)) => match replace_canonical_cch(text, value) {
            Some(out) => {
                *text = out;
                true
            }
            None => false,
        },
        Some(Value::Array(blocks)) => {
            for block in blocks.iter_mut() {
                let Some(map) = block.as_object_mut() else { continue };
                let Some(Value::String(text)) = map.get("text") else { continue };
                if let Some(out) = replace_canonical_cch(text, value) {
                    if let Some(Value::String(slot)) = map.get_mut("text") {
                        *slot = out;
                    }
                    return true;
                }
            }
            false
        }
        _ => false,
    }
}

/// ① JSON.parse + JSON.stringify 的紧凑化；失败时保留原文。
///
/// 与 JavaScript 的差异仅在数字字面量（`1.0` → `1`）与 Unicode 转义；
/// 现网调用方送来的 body 已是紧凑文本，投影依赖结构而非数字形态。
fn compact_json_text(body: &str) -> String {
    match serde_json::from_str::<Value>(body) {
        Ok(v) => serde_json::to_string(&v).unwrap_or_else(|_| body.to_string()),
        Err(_) => body.to_string(),
    }
}

/// 投影：得到参与 CCH 哈希的紧凑 JSON 文本。
pub fn project_for_cch(body: &str) -> String {
    let mut text = compact_json_text(body);
    // ② 重置计费头 cch 占位（需要在结构化 JSON 上做，再回到紧凑文本）。
    if let Ok(mut v) = serde_json::from_str::<Value>(&text) {
        if set_system_cch(&mut v, CCH_PLACEHOLDER) {
            if let Ok(re) = serde_json::to_string(&v) {
                text = re;
            }
        }
    }
    let bytes = blank_string_models(text.as_bytes());
    let bytes = skip_max_tokens(skip_credit(skip_fallbacks(bytes)));
    String::from_utf8_lossy(&bytes).into_owned()
}

/// `(xxh64(project) & 0xfffff)` 的 5 位小写十六进制。
pub fn compute_cch(body: &str) -> String {
    let projected = project_for_cch(body);
    format!("{:05x}", xxh64(projected.as_bytes(), CCH_SEED) & 0xfffff)
}

/// 打戳：`cch=00000` → `cch=<compute_cch>`，再输出紧凑文本。
/// 没有 canonical 计费头时原样返回（与现网 `stampCchBody` 一致）。
pub fn stamp_cch_body(body: &str) -> String {
    let Ok(mut v) = serde_json::from_str::<Value>(body) else {
        return body.to_string();
    };
    if !set_system_cch(&mut v, CCH_PLACEHOLDER) {
        return body.to_string();
    }
    let placeholder = serde_json::to_string(&v).unwrap_or_else(|_| body.to_string());
    let computed = compute_cch(&placeholder);
    if !set_system_cch(&mut v, &computed) {
        return body.to_string();
    }
    serde_json::to_string(&v).unwrap_or_else(|_| body.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn xxh64_matches_reference_vectors() {
        // 真值取自现网 JS 实现（`native-slot/testdata/jsref/modules.cjs` 的
        // `xxh64(bytes, 0n)`），与标准 XXH64 一致。
        assert_eq!(xxh64(b"", 0), 0xef46_db37_51d8_e999);
        assert_eq!(xxh64(b"a", 0), 0xd24e_c4f1_a98c_6e5b);
        assert_eq!(xxh64(b"abc", 0), 0x44bc_2cf5_ad77_0999);
        assert_eq!(
            xxh64(b"Nobody inspects the spammish repetition", 0),
            0xfbce_a83c_8a37_8bf1
        );
    }

    #[test]
    fn cch_matches_live_js_vectors() {
        // 现网 JS `stampCchBody` 的输出（真值），锁死投影管线。
        let body = r#"{"model":"claude-opus-5-5","max_tokens":64,"system":[{"type":"text","text":"x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli; cch=00000;"}],"messages":[{"role":"user","content":"hi"}]}"#;
        assert_eq!(compute_cch(body), "fb9f5");
        let body = r#"{"system":"x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli; cch=00000;","model":"m","max_tokens":8}"#;
        assert_eq!(compute_cch(body), "4ff07");
    }

    #[test]
    fn projects_out_model_fallbacks_and_max_tokens() {
        let body = r#"{"model":"claude-x","max_tokens":4096,"fallbacks":[{"a":1}],"messages":[]}"#;
        assert_eq!(project_for_cch(body), r#"{"model":"","messages":[]}"#);
    }

    #[test]
    fn resets_billing_header_then_blanks_model() {
        let body = r#"{"system":[{"type":"text","text":"x-anthropic-billing-header: cc_version=2.1.303; cch=abcde;"}],"model":"m"}"#;
        let projected = project_for_cch(body);
        assert!(projected.contains("cch=00000"), "{projected}");
        assert!(projected.contains(r#""model":"""#), "{projected}");
    }

    #[test]
    fn stamp_is_stable_and_matches_compute() {
        let body = r#"{"system":"x-anthropic-billing-header: cc_version=2.1.303; cch=00000;","model":"m","max_tokens":8}"#;
        let stamped = stamp_cch_body(body);
        let expected = compute_cch(&stamped);
        assert!(stamped.contains(&format!("cch={expected};")), "{stamped}");
    }
}
