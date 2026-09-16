use std::env;
use std::process::ExitCode;

use kin_codex_kernel::config::Config;
use kin_codex_kernel::server::serve;

#[tokio::main]
async fn main() -> ExitCode {
    let path = env::args()
        .nth(1)
        .or_else(|| env::var("KIN_CODEX_KERNEL_CONFIG").ok())
        .unwrap_or_else(|| "/run/kin/codex-kernel.json".into());
    let cfg = match Config::load(&path) {
        Ok(cfg) => cfg,
        Err(err) => {
            eprintln!("kin-codex-kernel config: {err}");
            return ExitCode::from(1);
        }
    };
    if let Err(err) = serve(cfg).await {
        eprintln!("kin-codex-kernel: {err}");
        return ExitCode::from(1);
    }
    ExitCode::SUCCESS
}
