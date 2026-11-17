//! CRAG v2 原生内核（Rust）。
//!
//! 目标形态对齐 `reverse/kin-kernel/docs/11_CRAG_V2_SPEC.md` §9.3：
//! 自控 HTTP/TLS wire 的 native 数据面内核，对外复用 `kin-kernel` 的
//! `--gateway-worker --config` + Unix socket 契约。
//!
//! ```text
//! cragv2/
//! ├── main.rs        启动、参数、信号
//! ├── config.rs      kernel.json
//! ├── gateway.rs     /internal/health、/internal/v1/messages、/internal/v1/cancel
//! ├── ndjson.rs      stdin/stdout 帧 + 背压
//! ├── slot.rs        槽位状态机 / 并发 / resume
//! ├── protocol/      请求改写管线：models / beta / billing / cch / identity
//! └── http/          自控 client / tls / wire（CCH 打戳点）
//! ```

pub mod config;
pub mod credential;
pub mod gateway;
pub mod http;
pub mod mcp;
pub mod native;
pub mod oauth;
pub mod ndjson;
pub mod probe;
pub mod protocol;
pub mod restricted;
pub mod slot;
pub mod testing;
pub mod tui;
pub mod usage;

/// 用户可见协议版本（billing / UA / MACRO）。与打包的官方 CLI 版本保持一致。
pub const VERSION: &str = "2.1.321";
/// 真实运行时基线版本。
pub const NATIVE_BASE_VERSION: &str = "2.1.88";
/// 88 bundle 内嵌的 Stainless SDK 版本；头部必须保留真实值。
pub const NATIVE_SDK_PACKAGE_VERSION: &str = "0.74.0";
/// 官方 303 内嵌的 SDK 版本（仅用于对照，不写入头部）。
pub const OFFICIAL_303_SDK_PACKAGE_VERSION: &str = "0.128.0";
