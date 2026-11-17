//! 保证 `src/protocol/tables.rs` 与现网数据表**没有漂移**。
//!
//! 数据表是生成物（`tools/gen-protocol-tables.mjs`），这里在 CI 里重跑生成器
//! 的 `--check` 模式：只要有人手改了 tables.rs 或忘了跟随上游，测试立刻失败。
//!
//! 环境不具备条件时（没有 node / 没有源分支）跳过，不让本地开发卡住。

use std::process::Command;

fn have(cmd: &str, args: &[&str]) -> bool {
    Command::new(cmd)
        .args(args)
        .output()
        .map(|out| out.status.success())
        .unwrap_or(false)
}

#[test]
fn tables_match_upstream_source() {
    if !have("node", &["--version"]) {
        eprintln!("skip: node 不可用");
        return;
    }
    if !have("git", &["rev-parse", "--verify", "origin/fix/sqlite-off-event-loop"]) {
        eprintln!("skip: 缺少源分支 origin/fix/sqlite-off-event-loop");
        return;
    }
    let out = Command::new("node")
        .args(["tools/gen-protocol-tables.mjs", "--check"])
        .output()
        .expect("run generator");
    let stdout = String::from_utf8_lossy(&out.stdout);
    let stderr = String::from_utf8_lossy(&out.stderr);
    assert!(
        out.status.success(),
        "tables.rs 与现网数据表不一致\nstdout: {stdout}\nstderr: {stderr}"
    );
}

#[test]
fn generated_tables_are_self_consistent() {
    use cragv2::protocol::tables;
    assert!(tables::MODELS.len() >= 20, "models: {}", tables::MODELS.len());
    assert!(tables::BETA_REGISTRY.len() >= 30);
    // 每个 alias 与 latest 都必须指向真实存在的模型。
    for (alias, id) in tables::ALIASES {
        assert!(
            tables::MODELS.iter().any(|m| m.id == *id),
            "alias {alias} -> {id} 不在 MODELS 里"
        );
    }
    for (name, mapping) in tables::ALIASES_PER_PROVIDER {
        for (provider, id) in mapping.iter() {
            assert!(
                tables::MODELS.iter().any(|m| m.id == *id),
                "alias {name}/{provider} -> {id} 不在 MODELS 里"
            );
        }
    }
    for (family, id) in tables::LATEST_PER_FAMILY {
        assert!(
            tables::MODELS.iter().any(|m| m.id == *id),
            "latest {family} -> {id} 不在 MODELS 里"
        );
    }
    assert!(tables::SOURCE_SHA256.len() == 64);
}
