//! 槽位状态机与 CLI 宿主。
//!
//! 真值：`09_CRAG_KERNEL_SPEC.md` §2/§3 与 `11_CRAG_V2_SPEC.md` §5.4。
//! crag 模式下 CLI 是**单进程多槽**：一个 CLI 进程内 `--max-procs N` 个槽位，
//! 内核只按 `session_id` 帧路由，不做进程池。
//!
//! 状态：
//! `starting`（进程刚拉起）→ `ready`（slot 可用）→ `running`（有在飞 hop）
//! → `waiting`（continuous tool loop 停了 `tool_use`，等下一轮 tool_result）
//! → `closed`（CLI 退出，等待重启）。

use std::collections::HashMap;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};

use tokio::io::AsyncWriteExt;
use tokio::process::{Child, Command};
use tokio::sync::{mpsc, Mutex as AsyncMutex};

use crate::ndjson::{write_frame, FrameReader, StdinFrame, StdoutFrame};

/// 槽位宿主：一个 CLI 进程 + 帧路由表。
pub struct CragHost {
    command: Vec<String>,
    stdin_tx: mpsc::UnboundedSender<StdinFrame>,
    routes: Arc<Mutex<HashMap<String, mpsc::UnboundedSender<StdoutFrame>>>>,
    slots: u32,
    inflight: Arc<AtomicUsize>,
    pid: Arc<Mutex<Option<u32>>>,
    running: Arc<AtomicBool>,
    child: AsyncMutex<Option<Child>>,
}

impl CragHost {
    /// 拉起 CLI 并装配 stdin/stdout 帧通道。
    ///
    /// `env` 由调用方传入（出口代理等）：官方 Claude bundle 自己发上游请求，
    /// 内核必须把 `proxy_url` 转成 `HTTPS_PROXY`/`ALL_PROXY` 交给它，否则直连会失败。
    pub async fn spawn(command: Vec<String>, slots: u32, env: &[(String, String)]) -> std::io::Result<Arc<Self>> {
        let (program, args) = command
            .split_first()
            .ok_or_else(|| std::io::Error::other("empty cli command"))?;
        let mut builder = Command::new(program);
        builder
            .args(args)
            .env("CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK", "1")
            .env("CLAUDE_CODE_ENTRYPOINT", "sdk-cli")
            .env("USER_TYPE", "external");
        for (key, value) in env {
            builder.env(key, value);
        }
        let mut child = builder
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .kill_on_drop(true)
            .spawn()?;
        let pid = child.id();
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| std::io::Error::other("cli stdin missing"))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| std::io::Error::other("cli stdout missing"))?;

        let (stdin_tx, mut stdin_rx) = mpsc::unbounded_channel::<StdinFrame>();
        let routes: Arc<Mutex<HashMap<String, mpsc::UnboundedSender<StdoutFrame>>>> =
            Arc::new(Mutex::new(HashMap::new()));
        let running = Arc::new(AtomicBool::new(true));

        // writer
        tokio::spawn(async move {
            let mut stdin = stdin;
            while let Some(frame) = stdin_rx.recv().await {
                if write_frame(&mut stdin, &frame).await.is_err() {
                    break;
                }
            }
            let _ = stdin.shutdown().await;
        });

        // reader：按 session_id 分发；无主的帧丢弃（旧 hop 残留）。
        let reader_routes = Arc::clone(&routes);
        let reader_running = Arc::clone(&running);
        tokio::spawn(async move {
            let mut reader = FrameReader::new(stdout);
            loop {
                match reader.next_frame().await {
                    Ok(Some(frame)) => {
                        let target = {
                            let routes = reader_routes.lock().unwrap();
                            routes.get(&frame.session_id).cloned()
                        };
                        if let Some(tx) = target {
                            let _ = tx.send(frame);
                        }
                    }
                    Ok(None) => break,
                    Err(error) => {
                        eprintln!("[crag] cli frame error: {error}");
                        break;
                    }
                }
            }
            reader_running.store(false, Ordering::SeqCst);
            // 断开所有等待者，避免 hop 悬挂。
            let mut routes = reader_routes.lock().unwrap();
            routes.clear();
        });

        Ok(Arc::new(Self {
            command,
            stdin_tx,
            routes,
            slots: slots.clamp(1, 20),
            inflight: Arc::new(AtomicUsize::new(0)),
            pid: Arc::new(Mutex::new(pid)),
            running,
            child: AsyncMutex::new(Some(child)),
        }))
    }

    pub fn command(&self) -> &[String] {
        &self.command
    }

    pub fn slots(&self) -> u32 {
        self.slots
    }

    pub fn pid(&self) -> Option<u32> {
        *self.pid.lock().unwrap()
    }

    pub fn alive(&self) -> bool {
        self.running.load(Ordering::SeqCst)
    }

    /// 空闲槽位数。
    pub fn ready_slots(&self) -> u32 {
        if !self.alive() {
            return 0;
        }
        self.slots.saturating_sub(self.inflight.load(Ordering::SeqCst) as u32)
    }

    /// 发起一轮 hop：注册路由、写帧，返回事件流。
    pub fn ask(
        &self,
        session_id: String,
        frame: StdinFrame,
    ) -> Result<mpsc::UnboundedReceiver<StdoutFrame>, SlotError> {
        if !self.alive() {
            return Err(SlotError::Closed);
        }
        if self.ready_slots() == 0 {
            return Err(SlotError::NoFreeSlot);
        }
        let (tx, rx) = mpsc::unbounded_channel();
        {
            let mut routes = self.routes.lock().unwrap();
            routes.insert(session_id.clone(), tx);
        }
        self.inflight.fetch_add(1, Ordering::SeqCst);
        if self.stdin_tx.send(frame).is_err() {
            self.release(&session_id);
            return Err(SlotError::Closed);
        }
        Ok(rx)
    }

    /// 释放某个会话占用的槽位（hop 结束或取消）。
    pub fn release(&self, session_id: &str) {
        let removed = {
            let mut routes = self.routes.lock().unwrap();
            routes.remove(session_id).is_some()
        };
        if removed {
            self.inflight.fetch_sub(1, Ordering::SeqCst);
        }
    }

    /// 关闭 CLI 进程。
    pub async fn close(&self) {
        self.running.store(false, Ordering::SeqCst);
        // stdin 通道关闭会让 writer 退出，CLI 收到 EOF 后自然收敛。
        if let Some(mut child) = self.child.lock().await.take() {
            let _ = child.start_kill();
            let _ = child.wait().await;
        }
        self.routes.lock().unwrap().clear();
        self.inflight.store(0, Ordering::SeqCst);
    }
}

/// 槽位分配失败原因。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SlotError {
    NoFreeSlot,
    Closed,
}

impl SlotError {
    /// 对应现网 `result.subtype=error_during_execution` 的 result 文本。
    pub fn message(self) -> &'static str {
        match self {
            SlotError::NoFreeSlot => "no free slot",
            SlotError::Closed => "cli is closed",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fake_cli() -> Vec<String> {
        crate::testing::fake_cli_command()
    }

    #[tokio::test]
    async fn routes_events_back_by_session() {
        let host = CragHost::spawn(fake_cli(), 2, &[]).await.unwrap();
        let frame = StdinFrame::user(
            "s-1",
            crate::ndjson::Message {
                role: "user".into(),
                content: serde_json::json!("hi"),
            },
        );
        let mut rx = host.ask("s-1".to_string(), frame).unwrap();
        // 一路读到 result 帧为止：流式事件数量随假 CLI 而异，形态才是契约。
        let mut kinds = Vec::new();
        loop {
            let frame = tokio::time::timeout(std::time::Duration::from_secs(10), rx.recv())
                .await
                .expect("帧应在超时内到达")
                .expect("通道不应提前关闭");
            kinds.push(frame.kind.clone());
            if frame.is_result() {
                break;
            }
        }
        assert_eq!(kinds.first().map(String::as_str), Some("stream_event"));
        assert_eq!(kinds.last().map(String::as_str), Some("result"));
        host.release("s-1");
        assert_eq!(host.ready_slots(), 2);
        host.close().await;
    }

    #[cfg(unix)]
    #[tokio::test]
    async fn passes_proxy_env_to_cli() {
        let dir = std::env::temp_dir().join(format!("cragv2-env-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let out = dir.join("proxy.txt");
        let script = format!("printf '%s' \"$HTTPS_PROXY\" > {}", out.display());
        let host = CragHost::spawn(
            vec!["sh".to_string(), "-c".to_string(), script],
            1,
            &[("HTTPS_PROXY".to_string(), "http://proxy:1".to_string())],
        )
        .await
        .unwrap();
        tokio::time::sleep(std::time::Duration::from_millis(400)).await;
        assert_eq!(std::fs::read_to_string(&out).unwrap(), "http://proxy:1");
        host.close().await;
        std::fs::remove_dir_all(&dir).ok();
    }

    #[tokio::test]
    async fn no_free_slot_when_all_reserved() {
        let host = CragHost::spawn(fake_cli(), 1, &[]).await.unwrap();
        let frame = || {
            StdinFrame::user(
                "s",
                crate::ndjson::Message { role: "user".into(), content: serde_json::json!("x") },
            )
        };
        assert!(host.ask("a".into(), frame()).is_ok());
        assert_eq!(host.ready_slots(), 0);
        assert!(matches!(host.ask("b".into(), frame()), Err(SlotError::NoFreeSlot)));
        host.release("a");
        assert!(host.ask("b".into(), frame()).is_ok());
        host.close().await;
    }
}
