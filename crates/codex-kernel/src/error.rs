use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum KernelError {
    #[error("{0}")]
    InvalidRequest(String),
    #[error("proxy required")]
    ProxyRequired,
    #[error("no schedulable credential")]
    NoCredential,
    #[error("credential busy")]
    Busy,
    #[error("sticky credential unavailable")]
    StickyUnavailable,
    #[error("internal auth failed")]
    InternalAuth,
    #[error("{message}")]
    Upstream { message: String, sent: bool },
    #[error("{0}")]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Json(#[from] serde_json::Error),
}

impl KernelError {
    pub fn upstream(message: impl Into<String>, sent: bool) -> Self {
        Self::Upstream {
            message: message.into(),
            sent,
        }
    }

    pub fn sent(&self) -> bool {
        matches!(self, Self::Upstream { sent: true, .. })
    }

    pub fn status(&self) -> StatusCode {
        match self {
            KernelError::InvalidRequest(_) => StatusCode::BAD_REQUEST,
            KernelError::InternalAuth => StatusCode::UNAUTHORIZED,
            KernelError::ProxyRequired
            | KernelError::NoCredential
            | KernelError::Busy
            | KernelError::StickyUnavailable => StatusCode::SERVICE_UNAVAILABLE,
            KernelError::Upstream { .. } | KernelError::Io(_) | KernelError::Json(_) => {
                StatusCode::BAD_GATEWAY
            }
        }
    }

    pub fn code(&self) -> &'static str {
        match self {
            KernelError::InvalidRequest(_) => "invalid_request",
            KernelError::ProxyRequired => "proxy_required",
            KernelError::NoCredential => "no_credential",
            KernelError::Busy => "no_capacity",
            KernelError::StickyUnavailable => "sticky_unavailable",
            KernelError::InternalAuth => "internal_auth_failed",
            KernelError::Upstream { .. } => "upstream_transport",
            KernelError::Io(_) => "io_error",
            KernelError::Json(_) => "invalid_json",
        }
    }
}

impl IntoResponse for KernelError {
    fn into_response(self) -> Response {
        let body = json!({
            "error": {
                "type": "api_error",
                "code": self.code(),
                "message": self.to_string(),
            }
        });
        (self.status(), Json(body)).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn connect_failure_is_not_sent() {
        let err = KernelError::upstream("connect failed", false);
        assert!(!err.sent());
    }

    #[test]
    fn http_status_failure_is_sent() {
        let err = KernelError::upstream("upstream status 500", true);
        assert!(err.sent());
    }
}
