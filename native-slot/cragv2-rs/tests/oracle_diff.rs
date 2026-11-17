//! 批量 oracle 差分：Rust ↔ 现网 JS（`testdata/oracle-vectors.json`，237 条）。
//!
//! 向量由 `tools/gen-oracle-vectors.mjs` 用现网模块（`testdata/jsref`）生成，
//! 覆盖 cch / cchPlaceholder(InPlace) / wire / leftover / zero / explicitTtl /
//! cache / merge / setupBetas。未覆盖的 op 会在测试输出里列出来，避免「以为覆盖了」。

use std::collections::BTreeSet;

use cragv2::protocol::{attribution, beta, billing, cache, cch, classifier, provider, system};
use regex::Regex;
use serde_json::Value;

fn normalize_prompt_id(text: &str) -> String {
    let re = Regex::new(r"cc_prompt_id=[^;]*;").unwrap();
    re.replace_all(text, "cc_prompt_id=X;").to_string()
}

/// 递归把 `cc_prompt_id=<uuid>;` 归一成固定值（对应 JS 侧随机 UUID）。
fn normalize_prompt_ids(value: &Value) -> Value {
    match value {
        Value::String(text) => Value::String(normalize_prompt_id(text)),
        Value::Array(items) => Value::Array(items.iter().map(normalize_prompt_ids).collect()),
        other => other.clone(),
    }
}

fn text_of(value: &Value) -> String {
    value.as_str().unwrap_or_default().to_string()
}

fn got_for(case: &Value) -> Option<Value> {
    let op = case.get("op").and_then(|v| v.as_str())?;
    Some(match op {
        "cch" => Value::String(cch::stamp_cch_body(&text_of(&case["body"]))),
        "cchPlaceholder" => Value::String(system::with_cch_placeholder(&text_of(&case["text"]))),
        "cchPlaceholderInPlace" => {
            Value::String(system::with_cch_placeholder_in_place(&text_of(&case["text"])))
        }
        "wire" => {
            let profile = case.get("profile").and_then(|v| v.as_bool()).unwrap_or(false);
            match system::wire_system_blocks(&case["system"], profile) {
                Some(blocks) => Value::Array(blocks),
                None => Value::Null,
            }
        }
        "leftover" => {
            let lines: Vec<String> = case["system"]
                .as_array()
                .map(|items| items.iter().map(text_of).collect())
                .unwrap_or_default();
            match system::leftover_from_system_prompt(&lines) {
                Some(text) => Value::String(text),
                None => Value::Null,
            }
        }
        "zero" => Value::String(system::finalize_zero_billing(
            &text_of(&case["text"]),
            "PROMPT-ID",
        )),
        "explicitTtl" => {
            let parts: Vec<Value> = case["parts"].as_array().cloned().unwrap_or_default();
            let refs: Vec<&Value> = parts.iter().collect();
            match cache::explicit_cache_ttl(&refs) {
                Some(ttl) => Value::String(ttl.to_string()),
                None => Value::Null,
            }
        }
        "cache" => {
            let mut params = case["params"].clone();
            let ttl = case.get("ttl").and_then(|v| v.as_str()).unwrap_or("1h");
            let preserve = case.get("preserve").cloned().unwrap_or(Value::Null);
            let flag = |key: &str| {
                preserve
                    .get(key)
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false)
            };
            cache::apply_kin_owned_cache_markers(
                &mut params,
                ttl,
                flag("preserveSystem"),
                flag("preserveMessages"),
                flag("preserveTools"),
            );
            params
        }
        "betas" => {
            let tokens: Vec<String> = case["tokens"]
                .as_array()
                .map(|items| items.iter().map(text_of).collect())
                .unwrap_or_default();
            let mut betas = beta::with_request_protocol_betas(&tokens, &case["body"]);
            if case.get("merge").and_then(|v| v.as_bool()).unwrap_or(false) {
                betas = beta::merge_official_extra_betas(&betas);
            }
            Value::Array(betas.into_iter().map(Value::String).collect())
        }
        "merge" => {
            let tokens: Vec<String> = case["tokens"]
                .as_array()
                .map(|items| items.iter().map(text_of).collect())
                .unwrap_or_default();
            Value::Array(
                beta::merge_official_extra_betas(&tokens)
                    .into_iter()
                    .map(Value::String)
                    .collect(),
            )
        }
        "setupBetas" => Value::String(beta::setup_token_beta_header(&text_of(&case["model"]))),
        "layout" => Value::Array(
            system::layout_system_blocks_with(
                system::layout_from_str(&text_of(&case["layout"])),
                &text_of(&case["timezone"]),
                &text_of(&case["attribution"]),
                case["leftover"].as_str(),
                "PROMPT-ID",
            )
            .into_iter()
            .map(Value::String)
            .collect(),
        ),
        "resolveTtl" => {
            let opt = &case["opt"];
            Value::String(cache::resolve_kin_cache_ttl(
                opt.get("system"),
                opt.get("tools"),
                opt.get("messages"),
                opt.get("panelTtl"),
            ))
        }
        "boundedIndex" => match billing::bounded_billing_index(
            case["value"].as_i64(),
            case["min"].as_i64().unwrap_or(0),
        ) {
            Some(index) => Value::Number(index.into()),
            None => Value::Null,
        },
        "attribution" => {
            if !case["enabled"].as_bool().unwrap_or(true) {
                return Some(Value::String(String::new()));
            }
            let opts = &case["opts"];
            let options = attribution::AttributionOptions {
                include_cch: opts["includeCch"].as_bool().unwrap_or(false),
                include_subscriber_fields: opts["includeSubscriberFields"].as_bool().unwrap_or(false),
                is_subagent: opts["isSubagent"].as_bool().unwrap_or(false),
                prev_req_id: opts["prevReqId"].as_str().map(str::to_string),
                prompt_id: opts["promptId"].as_str().map(str::to_string),
                turn_origin: opts["turnOrigin"].as_str().map(str::to_string),
                prompt_index: opts["promptIndex"].as_i64(),
                turn_index: opts["turnIndex"].as_i64(),
            };
            Value::String(attribution::attribution_header(
                &text_of(&case["version"]),
                &text_of(&case["fingerprint"]),
                &options,
            ))
        }
        "classifierSystem" => Value::Array(classifier::classifier_system_blocks(
            &case["system"],
            case["attribution"].as_str(),
        )),
        "classifierValid" => Value::Bool(classifier::valid_classifier_context(
            &case["ctx"],
            &case["request"],
        )),
        "apiProvider" => Value::String(
            provider::Provider::from_flags(
                case["bedrock"].as_bool().unwrap_or(false),
                case["vertex"].as_bool().unwrap_or(false),
                case["foundry"].as_bool().unwrap_or(false),
            )
            .as_str()
            .to_string(),
        ),
        "cliVersion" => Value::String(attribution::resolve_cli_version(
            &text_of(&case["raw"]),
            &text_of(&case["default"]),
        )),
        "apiGates" => {
            let provider = match text_of(&case["provider"]).as_str() {
                "bedrock" => provider::Provider::Bedrock,
                "vertex" => provider::Provider::Vertex,
                "foundry" => provider::Provider::Foundry,
                _ => provider::Provider::FirstParty,
            };
            let gates = provider::attribution_gates(
                provider,
                case["subscriber"].as_bool().unwrap_or(false),
            );
            serde_json::json!({
                "includeCch": gates.include_cch,
                "includeSubscriberFields": gates.include_subscriber_fields,
            })
        }
        _ => return None,
    })
}

#[test]
fn matches_oracle_vectors() {
    let raw = std::fs::read_to_string("testdata/oracle-vectors.json")
        .expect("缺少 testdata/oracle-vectors.json（先跑 node tools/gen-oracle-vectors.mjs）");
    let vectors: Vec<Value> = serde_json::from_str(&raw).expect("vectors 解析失败");
    assert!(vectors.len() >= 200, "向量过少: {}", vectors.len());

    // ---- 鉴别力自检：向量必须含真实值，否则「全过」没有意义 ----
    let non_null = vectors.iter().filter(|c| !c["expected"].is_null()).count();
    assert!(
        non_null * 100 / vectors.len() >= 70,
        "非 null 期望值比例过低: {non_null}/{}",
        vectors.len()
    );
    let cch_cases: Vec<&Value> = vectors.iter().filter(|c| c["op"] == "cch").collect();
    assert!(cch_cases.len() >= 50, "cch 用例不足: {}", cch_cases.len());
    // 没有 billing 头的 body 按约定原样返回；带头的必须被打上真实 cch。
    let stamped: Vec<&&Value> = cch_cases
        .iter()
        .filter(|c| c["expected"] != c["body"])
        .collect();
    assert!(stamped.len() >= 30, "真正被打戳的 cch 用例不足: {}", stamped.len());
    assert!(
        stamped.iter().all(|c| c["expected"]
            .as_str()
            .map(|text| text.contains("cch=") && !text.contains("cch=00000;"))
            .unwrap_or(false)),
        "打戳用例必须含真实 cch 值（不能是占位 00000）"
    );
    let wire_cases: Vec<&Value> = vectors.iter().filter(|c| c["op"] == "wire").collect();
    assert!(wire_cases.iter().any(|c| c["expected"].is_null()), "wire 应含非标准 system 的 null");
    assert!(wire_cases.iter().any(|c| c["expected"].is_array()), "wire 应含标准 system 的数组");
    let betas_nonempty = vectors
        .iter()
        .filter(|c| c["op"] == "betas")
        .filter(|c| c["expected"].as_array().map(|a| !a.is_empty()).unwrap_or(false))
        .count();
    assert!(betas_nonempty >= 20, "betas 非空用例不足: {betas_nonempty}");

    // layout：既有 zero（单 billing 块）也有 stock/identity 的多块输出
    let layout_cases: Vec<&Value> = vectors.iter().filter(|c| c["op"] == "layout").collect();
    assert!(layout_cases.len() >= 20, "layout 用例不足");
    assert!(
        layout_cases
            .iter()
            .all(|c| c["expected"].as_array().map(|a| a.len() >= 2).unwrap_or(false)),
        "layout 期望值应至少含 billing/IDENTITY + environment 两块"
    );
    // apiGates：includeCch 必须两种取值都有
    let gates: Vec<&Value> = vectors.iter().filter(|c| c["op"] == "apiGates").collect();
    assert!(
        gates.iter().any(|c| c["expected"]["includeCch"] == true)
            && gates.iter().any(|c| c["expected"]["includeCch"] == false),
        "apiGates 应覆盖 includeCch 的真/假两侧"
    );
    // boundedIndex：null 与非 null 都要有
    let bounded: Vec<&Value> = vectors.iter().filter(|c| c["op"] == "boundedIndex").collect();
    assert!(
        bounded.iter().any(|c| c["expected"].is_null())
            && bounded.iter().any(|c| !c["expected"].is_null()),
        "boundedIndex 应覆盖越界与合法两侧"
    );

    // classifier：true / false 两侧都要有
    let classifier_valid: Vec<&Value> = vectors.iter().filter(|c| c["op"] == "classifierValid").collect();
    assert!(
        classifier_valid.iter().any(|c| c["expected"] == true)
            && classifier_valid.iter().any(|c| c["expected"] == false),
        "classifierValid 应覆盖 true/false 两侧"
    );

    // attribution：既要有被关掉的空串，也要有带订阅者字段的完整头
    let attribution_cases: Vec<&Value> = vectors.iter().filter(|c| c["op"] == "attribution").collect();
    assert!(attribution_cases.len() >= 25, "attribution 用例不足");
    assert!(
        attribution_cases
            .iter()
            .any(|c| c["expected"].as_str() == Some("")),
        "attribution 应覆盖「开关关闭 → 空串」"
    );
    assert!(
        attribution_cases
            .iter()
            .any(|c| c["expected"].as_str().map(|t| t.contains("cc_entrypoint=sdk-cli")).unwrap_or(false)),
        "attribution 应覆盖正常头"
    );
    assert!(
        attribution_cases
            .iter()
            .any(|c| c["expected"].as_str().map(|t| t.contains("cc_prev_req=")).unwrap_or(false)),
        "attribution 应覆盖合法 prev_req"
    );

    let mut failures: Vec<String> = Vec::new();
    let mut unsupported = BTreeSet::new();
    let mut compared = 0usize;

    for (index, case) in vectors.iter().enumerate() {
        let op = case.get("op").and_then(|v| v.as_str()).unwrap_or("<none>");
        let Some(mut got) = got_for(case) else {
            unsupported.insert(op.to_string());
            continue;
        };
        let mut want = case["expected"].clone();
        if op == "zero" || op == "layout" {
            // prompt_id 是随机 UUID：两边都归一化后再比。
            got = normalize_prompt_ids(&got);
            want = normalize_prompt_ids(&want);
        }
        compared += 1;
        if got != want {
            failures.push(format!(
                "#{index} {op}\n  case: {}\n  want: {want}\n  got:  {got}",
                case
            ));
        }
    }

    if !unsupported.is_empty() {
        println!("未纳入比对的 op（依赖门控/环境，未实现）: {unsupported:?}");
    }
    println!("比对 {compared} / {} 条，失败 {} 条", vectors.len(), failures.len());
    assert!(
        failures.is_empty(),
        "与上游 oracle 不一致 {} 条：\n{}",
        failures.len(),
        failures
            .iter()
            .take(8)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}
