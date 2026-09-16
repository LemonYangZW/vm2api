use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;

use axum::body::Body;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use bytes::Bytes;
use futures_util::stream::unfold;
use serde_json::{json, Value};
use tokio::net::UnixListener;
use tokio::sync::Mutex;
use tokio::time::sleep;

use crate::config::Config;
use crate::credentials::CredentialFile;
use crate::engine::{Attempt, Scheduler};
use crate::error::KernelError;
use crate::openai::{hop, prepare_request, HopLive};
use crate::protocol::{is_business_frame, json_from_events, strip_identity, Envelope};

#[derive(Clone)]
struct AppState {
    cfg: Config,
    scheduler: Arc<Mutex<Scheduler>>,
}

pub async fn serve(cfg: Config) -> Result<(), KernelError> {
    if cfg.proxy_required && cfg.proxy_url.trim().is_empty() {
        return Err(KernelError::ProxyRequired);
    }
    if cfg.socket_path.exists() {
        let _ = std::fs::remove_file(&cfg.socket_path);
    }
    if let Some(parent) = cfg.socket_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let listener = UnixListener::bind(&cfg.socket_path)?;
    eprintln!(
        "kin-codex-kernel listening on {}",
        cfg.socket_path.display()
    );
    let state = AppState {
        cfg,
        scheduler: Arc::new(Mutex::new(Scheduler::new())),
    };
    let app = Router::new()
        .route("/internal/health", get(health))
        .route("/internal/v1/codex/responses", post(responses))
        .with_state(state);
    axum::serve(listener, app)
        .await
        .map_err(|e| KernelError::Io(std::io::Error::other(e)))?;
    Ok(())
}

async fn health(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, KernelError> {
    check_token(&state.cfg, &headers)?;
    let accounts = CredentialFile::load(&state.cfg.credential_path)
        .map(|file| file.accounts.len())
        .unwrap_or(0);
    let proxy_ok = !state.cfg.proxy_required || !state.cfg.proxy_url.trim().is_empty();
    Ok(Json(json!({
        "ok": true,
        "reachable": true,
        "engine": "codex",
        "vm_id": state.cfg.vm_id,
        "device_id": state.cfg.device_id,
        "worker_version": env!("CARGO_PKG_VERSION"),
        "proxy_ok": proxy_ok,
        "accounts": accounts,
    })))
}

async fn responses(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(envelope): Json<Envelope>,
) -> Result<Response, KernelError> {
    check_token(&state.cfg, &headers)?;
    if state.cfg.proxy_required && state.cfg.proxy_url.trim().is_empty() {
        return Err(KernelError::ProxyRequired);
    }
    let file = CredentialFile::load(&state.cfg.credential_path)?;
    let prev = envelope.session.previous_response_id.as_deref();
    let sid = envelope.session.session_id.as_deref();
    let inbound = strip_identity(envelope.body);
    let stream_wanted = envelope.stream.unwrap_or(true);
    let model = inbound
        .get("model")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();

    let mut excluded = HashSet::new();
    let mut last_hop_err: Option<KernelError> = None;
    let mut busy_waits = 0u32;
    let (account_id, live) = loop {
        let mut scheduler = state.scheduler.lock().await;
        let decision = match scheduler.select(&file, prev, sid, &excluded) {
            Ok(decision) => decision,
            Err(KernelError::Busy) if busy_waits < 80 => {
                drop(scheduler);
                busy_waits += 1;
                sleep(Duration::from_millis(25)).await;
                continue;
            }
            Err(err) => return Err(last_hop_err.unwrap_or(err)),
        };
        let account = match file.get(&decision.account_id).cloned() {
            Some(account) => account,
            None => return Err(last_hop_err.unwrap_or(KernelError::NoCredential)),
        };
        drop(scheduler);
        let mut attempt = Attempt::new(decision.account_id.clone(), decision.sticky);
        let request = prepare_request(&state.cfg, &account, inbound.clone(), sid);
        match hop(&state.cfg, &request).await {
            Ok(live) => {
                attempt.mark_sent();
                break (attempt.account_id, live);
            }
            Err(err) => {
                let mut scheduler = state.scheduler.lock().await;
                scheduler.abort(&attempt.account_id);
                if err.sent() {
                    attempt.mark_sent();
                }
                let retry = attempt.can_retry_other() && !err.sent();
                eprintln!(
                    "kin-codex-kernel hop_err sent={} retry={} {err}",
                    err.sent(),
                    retry
                );
                if retry {
                    excluded.insert(attempt.account_id);
                    last_hop_err = Some(err);
                    continue;
                }
                return Err(err);
            }
        }
    };

    if stream_wanted {
        stream_response(&state, live, account_id, prev, sid, &model).await
    } else {
        collect_response(&state, live, account_id, prev, sid).await
    }
}

async fn stream_response(
    state: &AppState,
    mut live: HopLive,
    account_id: String,
    prev: Option<&str>,
    sid: Option<&str>,
    model: &str,
) -> Result<Response, KernelError> {
    let first = match live.rx.recv().await {
        Some(Ok(frame)) => frame,
        Some(Err(err)) => {
            state.scheduler.lock().await.abort(&account_id);
            return Err(err);
        }
        None => {
            state.scheduler.lock().await.abort(&account_id);
            return Err(KernelError::upstream("empty upstream stream", true));
        }
    };
    let mut scheduler = state.scheduler.lock().await;
    scheduler.commit_success(&account_id, prev, sid);
    drop(scheduler);

    let (tx, rx) = tokio::sync::mpsc::channel::<Result<Bytes, std::io::Error>>(32);
    let first_bytes = Bytes::from(first);
    tokio::spawn(async move {
        if tx.send(Ok(first_bytes)).await.is_err() {
            return;
        }
        while let Some(item) = live.rx.recv().await {
            let out = match item {
                Ok(frame) => Ok(Bytes::from(frame)),
                Err(err) => Err(std::io::Error::other(err.to_string())),
            };
            if tx.send(out).await.is_err() {
                return;
            }
        }
    });
    let stream = unfold(rx, |mut rx| async move {
        rx.recv().await.map(|item| (item, rx))
    });
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("content-type", "text/event-stream")
        .header("x-kin-model", model)
        .header("x-kin-terminal-state", "verified")
        .body(Body::from_stream(stream))
        .unwrap())
}

async fn collect_response(
    state: &AppState,
    mut live: HopLive,
    account_id: String,
    prev: Option<&str>,
    sid: Option<&str>,
) -> Result<Response, KernelError> {
    let mut events = Vec::new();
    let mut committed = false;
    while let Some(item) = live.rx.recv().await {
        let frame = match item {
            Ok(frame) => frame,
            Err(err) => {
                if !committed {
                    state.scheduler.lock().await.abort(&account_id);
                    return Err(err);
                }
                break;
            }
        };
        if !committed && is_business_frame(&frame) {
            committed = true;
            state
                .scheduler
                .lock()
                .await
                .commit_success(&account_id, prev, sid);
        }
        events.push(frame);
    }
    if !committed {
        state.scheduler.lock().await.abort(&account_id);
        if events.is_empty() {
            return Err(KernelError::upstream("empty upstream stream", true));
        }
    }
    Ok(Json(json_from_events(&events)).into_response())
}

fn check_token(cfg: &Config, headers: &HeaderMap) -> Result<(), KernelError> {
    if cfg.internal_token.trim().is_empty() {
        return Ok(());
    }
    let got = headers
        .get("x-kin-internal-token")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if got != cfg.internal_token {
        return Err(KernelError::InternalAuth);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::protocol::events_to_sse;

    #[test]
    fn empty_events_sse_has_completed() {
        assert!(events_to_sse(&[]).contains("response.completed"));
    }
}
