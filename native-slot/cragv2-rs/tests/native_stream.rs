//! 用真实采集的 CLI 输出（2.1.321 + `--include-partial-messages`）回放，
//! 断言内核的转接只做「按序透传 `stream_event`」这一件事。
//!
//! 夹具来源：`docs/GAP_IMPL_SPEC.md` §4.7 同批实测，模型 haiku 5.5。

use cragv2::native::to_sse;
use cragv2::ndjson::StdoutFrame;

fn frames() -> Vec<StdoutFrame> {
    let text = include_str!("fixtures/native-stream.ndjson");
    text.lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| serde_json::from_str(line).expect("每行都应是合法帧"))
        .collect()
}

#[test]
fn replay_matches_a_complete_sse_turn() {
    let names: Vec<String> = frames()
        .iter()
        .filter_map(|f| to_sse(f).map(|(name, _)| name))
        .collect();
    assert_eq!(
        names,
        vec![
            "message_start",
            "content_block_start",
            "content_block_delta",
            "content_block_delta",
            "content_block_stop",
            "message_delta",
            "message_stop",
        ]
    );
}

#[test]
fn result_frame_terminates_a_successful_turn() {
    let all = frames();
    let result = all.last().expect("夹具应以 result 结尾");
    assert!(result.is_result());
    assert!(!result.failed());
    assert_eq!(result.stop_reason.as_deref(), Some("end_turn"));
    // 内部帧不外发：system/init、system/status、user 回显、assistant 整包，
    // 以及终止用的 result（由调用方按 `is_result()` 处理，不进 SSE）。
    let internal: Vec<&str> = all
        .iter()
        .filter(|f| to_sse(f).is_none())
        .map(|f| f.kind.as_str())
        .collect();
    assert_eq!(internal, vec!["system", "system", "user", "assistant", "result"]);
}

#[test]
fn forwarded_events_parse_as_upstream_payloads() {
    for frame in frames() {
        if let Some((name, data)) = to_sse(&frame) {
            let value: serde_json::Value = serde_json::from_str(&data).expect("event 应是原样 JSON");
            assert_eq!(value["type"], name.as_str());
        }
    }
}
