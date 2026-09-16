use serde::Deserialize;
use serde_json::{json, Map, Value};

const SENSITIVE_KEYS: &[&str] = &[
    "base_url",
    "custom_base_url",
    "endpoint",
    "hostname",
    "api_key",
    "authorization",
    "client_metadata",
];

#[derive(Debug, Deserialize)]
pub struct Envelope {
    #[serde(default)]
    pub body: Value,
    #[serde(default)]
    pub session: Session,
    #[serde(default)]
    pub stream: Option<bool>,
}

#[derive(Debug, Default, Deserialize)]
pub struct Session {
    pub previous_response_id: Option<String>,
    pub session_id: Option<String>,
}

pub fn strip_identity(mut body: Value) -> Value {
    if let Some(obj) = body.as_object_mut() {
        for key in SENSITIVE_KEYS {
            obj.remove(*key);
        }
        if let Some(Value::Object(meta)) = obj.get_mut("metadata") {
            meta.remove("user_id");
        }
    } else {
        body = json!({});
    }
    body
}

pub fn ws_create_payload(body: &Value) -> Value {
    let mut payload = Map::new();
    payload.insert("type".into(), json!("response.create"));
    if let Some(obj) = body.as_object() {
        for (k, v) in obj {
            payload.insert(k.clone(), v.clone());
        }
    }
    Value::Object(payload)
}

pub fn split_sse(body: &str) -> Vec<String> {
    if body.trim().is_empty() {
        return Vec::new();
    }
    body.split("\n\n")
        .filter(|chunk| !chunk.trim().is_empty())
        .map(|chunk| format!("{chunk}\n\n"))
        .collect()
}

pub fn take_sse_frames(buf: &mut String) -> Vec<String> {
    let mut frames = Vec::new();
    while let Some(idx) = buf.find("\n\n") {
        let frame = buf[..idx + 2].to_string();
        buf.replace_range(..idx + 2, "");
        if !frame.trim().is_empty() {
            frames.push(frame);
        }
    }
    frames
}

pub fn events_to_sse(events: &[String]) -> String {
    if events.is_empty() {
        return "event: response.completed\ndata: {\"type\":\"response.completed\"}\n\n"
            .to_string();
    }
    events.join("")
}

pub fn json_from_events(events: &[String]) -> Value {
    for event in events.iter().rev() {
        if let Some(data) = event.lines().find_map(|l| l.strip_prefix("data: ")) {
            if let Ok(v) = serde_json::from_str::<Value>(data) {
                return v;
            }
        }
    }
    json!({"object":"response","status":"completed"})
}

pub fn is_terminal_frame(frame: &str) -> bool {
    frame.contains("response.completed")
        || frame.contains("response.failed")
        || frame.contains("\"status_code\":429")
}

pub fn is_business_frame(frame: &str) -> bool {
    frame.lines().any(|line| line.starts_with("data:"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_proxy_identity_and_keeps_unknown_fields() {
        let inbound = json!({
            "model": "gpt-5.4",
            "stream": false,
            "store": true,
            "custom_tooling": {"keep": true},
            "base_url": "http://evil.example",
            "client_metadata": {"device_id": "client-device"},
            "include": ["file_search_call.results"]
        });
        let body = strip_identity(inbound);
        assert_eq!(body["model"], "gpt-5.4");
        assert_eq!(body["stream"], false);
        assert_eq!(body["store"], true);
        assert_eq!(body["custom_tooling"]["keep"], true);
        assert_eq!(body["include"][0], "file_search_call.results");
        assert!(body.get("base_url").is_none());
        assert!(body.get("client_metadata").is_none());
    }

    #[test]
    fn ws_payload_does_not_inject_body_fields() {
        let body = json!({"model": "gpt-5.6", "stream": true});
        let ws = ws_create_payload(&body);
        assert_eq!(ws["type"], "response.create");
        assert_eq!(ws["model"], "gpt-5.6");
        assert!(ws.get("client_metadata").is_none());
        assert!(ws.get("store").is_none());
    }

    #[test]
    fn take_sse_frames_leaves_partial() {
        let mut buf =
            "event: response.created\ndata: {\"type\":\"response.created\"}\n\nevent: response.in"
                .to_string();
        let frames = take_sse_frames(&mut buf);
        assert_eq!(frames.len(), 1);
        assert!(frames[0].contains("response.created"));
        assert!(buf.starts_with("event: response.in"));
    }
}
