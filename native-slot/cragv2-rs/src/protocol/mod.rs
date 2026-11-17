//! 请求改写管线。
//!
//! 真值：`reverse/kin-kernel/docs/11_CRAG_V2_SPEC.md` §6。
//! 指纹逻辑全部在本层，不进入槽位/传输层。

pub mod attribution;
pub mod beta;
pub mod cache;
pub mod classifier;
pub mod billing;
pub mod cch;
pub mod identity;
pub mod models;
pub mod preflight;
pub mod provider;
pub mod system;
pub mod tables;
