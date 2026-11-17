//! stdin/stdout NDJSON 帧与背压。
//!
//! 真值：`11_CRAG_V2_SPEC.md` §5.4（帧上限 16 MiB、stdout 背压阈值 16 MiB）
//! 与 `09_CRAG_KERNEL_SPEC.md` §3（StdinFrame / StdoutFrame 形状）。
//! 出站脱敏正则也在本层，覆盖凭据与宿主路径。

use serde::{Deserialize, Serialize};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

/// 单帧上限：16 MiB。
pub const MAX_FRAME_BYTES: usize = 16 * 1024 * 1024;

/// 内核 → CLI 的请求帧。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StdinFrame {
    /// 固定 `user`。
    #[serde(rename = "type")]
    pub kind: String,
    pub session_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    pub message: Message,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: serde_json::Value,
}

impl StdinFrame {
    pub fn user(session_id: impl Into<String>, message: Message) -> Self {
        Self {
            kind: "user".into(),
            session_id: session_id.into(),
            model: None,
            message,
            tools: None,
            system: None,
        }
    }
}

/// CLI → 内核的应答帧（`stream_event` 或 `result`）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StdoutFrame {
    #[serde(rename = "type")]
    pub kind: String,
    #[serde(default)]
    pub session_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub event: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub subtype: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub is_error: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stop_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub usage: Option<serde_json::Value>,
}

impl StdoutFrame {
    pub fn is_result(&self) -> bool {
        self.kind == "result"
    }

    /// `result.is_error` 或 `subtype == error_during_execution` 即失败终止。
    pub fn failed(&self) -> bool {
        self.is_error.unwrap_or(false) || self.subtype.as_deref() == Some("error_during_execution")
    }
}

/// 帧读写错误。
#[derive(Debug)]
pub enum FrameError {
    /// 单帧超过上限。
    TooLarge(usize),
    Io(std::io::Error),
    Json(serde_json::Error),
}

impl std::fmt::Display for FrameError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FrameError::TooLarge(n) => write!(f, "frame exceeds {MAX_FRAME_BYTES} bytes: {n}"),
            FrameError::Io(e) => write!(f, "frame io: {e}"),
            FrameError::Json(e) => write!(f, "frame json: {e}"),
        }
    }
}

impl std::error::Error for FrameError {}

impl From<std::io::Error> for FrameError {
    fn from(value: std::io::Error) -> Self {
        FrameError::Io(value)
    }
}

impl From<serde_json::Error> for FrameError {
    fn from(value: serde_json::Error) -> Self {
        FrameError::Json(value)
    }
}

/// 逐行读帧；空行与超限行按协议丢弃/报错。
pub struct FrameReader<R> {
    inner: BufReader<R>,
    buf: String,
}

impl<R: tokio::io::AsyncRead + Unpin> FrameReader<R> {
    pub fn new(reader: R) -> Self {
        Self {
            inner: BufReader::new(reader),
            buf: String::new(),
        }
    }

    /// 读下一帧；`Ok(None)` 表示流结束。
    pub async fn next_frame(&mut self) -> Result<Option<StdoutFrame>, FrameError> {
        loop {
            self.buf.clear();
            let n = self.inner.read_line(&mut self.buf).await?;
            if n == 0 {
                return Ok(None);
            }
            if self.buf.len() > MAX_FRAME_BYTES {
                return Err(FrameError::TooLarge(self.buf.len()));
            }
            let line = self.buf.trim();
            if line.is_empty() {
                continue;
            }
            return Ok(Some(serde_json::from_str(line)?));
        }
    }
}

/// 写一帧（单行 JSON + `\n`），带 16 MiB 上限保护。
pub async fn write_frame<W: tokio::io::AsyncWrite + Unpin>(
    writer: &mut W,
    frame: &StdinFrame,
) -> Result<(), FrameError> {
    let mut line = serde_json::to_string(frame)?;
    if line.len() > MAX_FRAME_BYTES {
        return Err(FrameError::TooLarge(line.len()));
    }
    line.push('\n');
    writer.write_all(line.as_bytes()).await?;
    writer.flush().await?;
    Ok(())
}

/// 出站脱敏：凭据与宿主路径一律打码（§5.4）。
pub fn redact(text: &str) -> String {
    let mut out = text.to_string();
    for pattern in [
        "sk-ant-",
        "sk-",
        "AIza",
        "Bearer ",
    ] {
        out = mask_prefix(&out, pattern);
    }
    for key in ["api_key", "authorization", "x-api-key", "secret", "token", "password", "credential"] {
        out = mask_key(&out, key);
    }
    out
}

fn mask_prefix(text: &str, prefix: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(at) = rest.find(prefix) {
        out.push_str(&rest[..at]);
        out.push_str(prefix);
        out.push_str("***");
        let tail = &rest[at + prefix.len()..];
        let end = tail
            .find(|c: char| c.is_whitespace() || c == '"' || c == '\'' || c == ',' || c == ';')
            .unwrap_or(tail.len());
        rest = &tail[end..];
    }
    out.push_str(rest);
    out
}

fn mask_key(text: &str, key: &str) -> String {
    text.replace(key, &format!("{key}=***"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_credentials_and_bearer() {
        let text = r#"{"api_key":"abc","authorization":"Bearer xyz","k":"sk-ant-12345"}"#;
        let out = redact(text);
        assert!(!out.contains("sk-ant-12345"), "{out}");
        assert!(out.contains("api_key=***"), "{out}");
        assert!(out.contains("Bearer ***"), "{out}");
    }

    #[test]
    fn parses_result_frame_failure() {
        let frame: StdoutFrame = serde_json::from_str(
            r#"{"type":"result","subtype":"error_during_execution","session_id":"s","is_error":true}"#,
        )
        .unwrap();
        assert!(frame.is_result() && frame.failed());
    }

    #[tokio::test]
    async fn reads_frames_and_skips_blank_lines() {
        let data = b"\n{\"type\":\"stream_event\",\"session_id\":\"s\",\"event\":{\"type\":\"message_start\"}}\n";
        let mut reader = FrameReader::new(&data[..]);
        let frame = reader.next_frame().await.unwrap().unwrap();
        assert_eq!(frame.kind, "stream_event");
        assert!(reader.next_frame().await.unwrap().is_none());
    }
}
