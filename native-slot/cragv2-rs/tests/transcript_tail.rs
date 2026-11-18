//! transcript 增量扫描的回归测试。
//!
//! 背景：`answer_after` 每 150 ms 轮询一次，原实现每次整读文件并全量 `serde` 解析；
//! 1M token 的 transcript 有几十 MB，等于每秒几百 MB 的分配抖动。改成增量尾读后，
//! 必须保证「追加可见、残行不误判、截断可重置」这三条语义不变。

use std::io::Write;
use std::path::PathBuf;

use cragv2::tui::count_text_answers;
use std::io::Write as _;

fn temp_file(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("crag-tail-{}-{}", std::process::id(), name));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir.join("session.jsonl")
}

fn append(path: &PathBuf, text: &str) {
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .unwrap();
    file.write_all(text.as_bytes()).unwrap();
    file.flush().unwrap();
}

/// 一行「已收尾且带文本」的 assistant 记录。
fn finished_answer(text: &str) -> String {
    format!(
        "{{\"type\":\"assistant\",\"message\":{{\"stop_reason\":\"end_turn\",\"content\":[{{\"type\":\"text\",\"text\":\"{text}\"}}]}}}}\n"
    )
}

/// 一行工具调用（stop_reason=tool_use，不应计入文本回答）。
fn tool_use_line() -> String {
    "{\"type\":\"assistant\",\"message\":{\"stop_reason\":\"tool_use\",\"content\":[{\"type\":\"tool_use\",\"id\":\"t1\"}]}}\n".to_string()
}

#[test]
fn counts_only_new_lines_as_file_grows() {
    let path = temp_file("grow");
    append(&path, &finished_answer("first"));
    assert_eq!(count_text_answers(&path), 1, "首行应被计入");

    append(&path, &tool_use_line());
    assert_eq!(count_text_answers(&path), 1, "tool_use 不计入");

    append(&path, &finished_answer("second"));
    assert_eq!(count_text_answers(&path), 2, "追加后应累计");
}

#[test]
fn half_written_line_waits_for_newline() {
    let path = temp_file("partial");
    append(&path, &finished_answer("first"));
    assert_eq!(count_text_answers(&path), 1);

    // 只写半行：还没有换行结尾，不应被计为一条完整记录。
    let line = finished_answer("second");
    let split = line.len() / 2;
    append(&path, &line[..split]);
    assert_eq!(count_text_answers(&path), 1, "残行不能计入");

    append(&path, &line[split..]);
    assert_eq!(count_text_answers(&path), 2, "补齐后应计入");
}

#[test]
fn truncated_file_resets_counters() {
    let path = temp_file("truncate");
    append(&path, &finished_answer("a"));
    append(&path, &finished_answer("b"));
    assert_eq!(count_text_answers(&path), 2);

    // CLI 换会话会重写文件：长度回退，缓存必须重置，否则计数永远偏高。
    std::fs::write(&path, finished_answer("c")).unwrap();
    assert_eq!(count_text_answers(&path), 1, "截断后应重新从 0 计数");
}

#[test]
fn repeated_polls_are_stable() {
    let path = temp_file("stable");
    append(&path, &finished_answer("x"));
    for _ in 0..20 {
        assert_eq!(count_text_answers(&path), 1, "重复轮询结果必须稳定");
    }
}

/// 手动基准（默认不跑）：对比「整读+全量解析」与「增量尾读」的轮询开销。
#[test]
#[ignore = "手动基准：cargo test --test transcript_tail -- --ignored --nocapture"]
fn bench_incremental_scan() {
    let path = temp_file("bench");
    let line = finished_answer("payload-payload-payload");
    let target = 30 * 1024 * 1024_usize;
    let mut written = 0_usize;
    let mut file = std::fs::File::create(&path).unwrap();
    while written < target {
        file.write_all(line.as_bytes()).unwrap();
        written += line.len();
    }
    file.flush().unwrap();
    drop(file);
    let rows = written / line.len();

    // 旧实现等价物：每轮整读 + 逐行全量解析。
    let t0 = std::time::Instant::now();
    for _ in 0..5 {
        let text = std::fs::read_to_string(&path).unwrap();
        let parsed = text
            .lines()
            .filter(|row| serde_json::from_str::<serde_json::Value>(row).is_ok())
            .count();
        assert_eq!(parsed, rows);
    }
    let legacy_us = t0.elapsed().as_micros() / 5;

    // 新实现：首次全扫一次。
    let t1 = std::time::Instant::now();
    let first = count_text_answers(&path);
    let first_us = t1.elapsed().as_micros();
    assert_eq!(first, rows);

    // 后续轮询：无新增字节。
    let t2 = std::time::Instant::now();
    for _ in 0..20 {
        assert_eq!(count_text_answers(&path), first);
    }
    let tail_us = t2.elapsed().as_micros() / 20;

    println!(
        "transcript {:.1} MB / {} 行：旧实现 {legacy_us} µs/轮，首次扫描 {first_us} µs，之后 {tail_us} µs/轮",
        written as f64 / (1024.0 * 1024.0),
        rows
    );
}

/// 关键回归：合格回答离文件尾很远时也必须取到。
///
/// 这条用例专门堵"从尾部反向读固定窗口"的思路——JSONL 里一行就是一条消息，
/// 尾部可能是几百条工具轮次 + 一条巨大的 tool_result，窗口里连一条完整候选都没有。
#[tokio::test]
async fn answer_far_from_tail_is_still_found() {
    let path = temp_file("far");
    let answer = finished_answer("THE-FINAL-ANSWER");

    // 先写回答，然后在它后面堆 200 轮工具调用和一条 ~1 MB 的 tool_result。
    append(&path, &answer);
    for index in 0..200 {
        append(
            &path,
            &format!(
                "{{\"type\":\"assistant\",\"message\":{{\"stop_reason\":\"tool_use\",\"content\":[{{\"type\":\"tool_use\",\"id\":\"t{index}\"}}]}}}}\n"
            ),
        );
    }
    let blob = "x".repeat(1024 * 1024);
    append(
        &path,
        &format!("{{\"type\":\"user\",\"message\":{{\"content\":\"{blob}\"}}}}\n"),
    );

    let tail_gap = std::fs::metadata(&path).unwrap().len();
    assert!(
        tail_gap > 1024 * 1024,
        "回答到文件尾应超过 1 MB，才能证伪固定窗口反读"
    );

    let got = cragv2::tui::transcript_answer_file(&path, std::time::Duration::ZERO)
        .await
        .expect("应能取到远处的合格回答");
    let text = serde_json::to_string(&got).unwrap();
    assert!(text.contains("THE-FINAL-ANSWER"), "取到的必须是那条回答");
}

/// 尾部只有工具轮次、根本没有合格回答时，不能凭空返回一个。
#[tokio::test]
async fn no_answer_in_file_returns_none() {
    let path = temp_file("none");
    append(&path, &tool_use_line());
    append(&path, &tool_use_line());
    assert!(
        cragv2::tui::transcript_answer_file(&path, std::time::Duration::ZERO)
            .await
            .is_none()
    );
}
