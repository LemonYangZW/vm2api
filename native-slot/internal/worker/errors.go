package worker

import (
	"encoding/json"
	"net/http"
	"strings"

	"vm2api/native-slot/internal/ojson"
)

// APIError 是 worker 对外的错误。
type APIError struct {
	Status       int
	Type         string
	Code         string
	Message      string
	RetryAfter   string
	UpstreamCode string
	RequestID    string
	Retryable    bool
	SparseSSE    bool
}

func (e *APIError) Error() string { return e.Code + ": " + e.Message }

// passCodes 是可以原样透传给调用方的 CLI 错误码，其余归为 cli_error。
var passCodes = map[string]bool{
	"upstream_rate_limit": true, "upstream_auth_error": true, "upstream_invalid_request": true,
	"upstream_overloaded": true, "upstream_error": true, "upstream_network_error": true,
	"upstream_stream_interrupted": true, "upstream_empty_stream": true, "upstream_timeout": true,
	"cli_error": true, "invalid_request_context": true,
}

func workerError(status int, code, message string) *APIError {
	return &APIError{Status: status, Type: "worker_error", Code: code, Message: message}
}

// 控制面取消当前提供者后，现网以通用提供者错误结束仍连接的响应流。
func cancelledProviderError() *APIError {
	return &APIError{Status: 502, Type: "api_error", Code: "kernel_error",
		Message: "provider error: client disconnected", SparseSSE: true}
}

func clip(s string, n int) string {
	r := []rune(s)
	if len(r) > n {
		return string(r[:n])
	}
	return s
}

func (e *APIError) message() string {
	msg := strings.TrimSpace(e.Message)
	if msg == "" {
		msg = "native slot error"
	}
	return clip(msg, 300)
}

func optional(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// JSON 是非流式错误响应体。现网字段顺序：ok、error{type,code,message,status}，
// retry_after / upstream_code / request_id 有值才出现；不输出 retryable。
func (e *APIError) JSON() *ojson.Object {
	inner := ojson.NewObject()
	inner.Set("type", e.Type)
	inner.Set("code", e.Code)
	inner.Set("message", e.message())
	inner.Set("status", e.Status)
	for _, kv := range [][2]string{{"retry_after", e.RetryAfter}, {"upstream_code", e.UpstreamCode}, {"request_id", e.RequestID}} {
		if kv[1] != "" {
			inner.Set(kv[0], kv[1])
		}
	}
	o := ojson.NewObject()
	o.Set("ok", false)
	o.Set("error", inner)
	return o
}

// SSE 是流内错误事件：与其余事件一样键名排序，可选字段缺失时为 null。
func (e *APIError) SSE() []byte {
	inner := ojson.NewObject()
	inner.Set("code", e.Code)
	inner.Set("message", e.message())
	if !e.SparseSSE {
		inner.Set("request_id", optional(e.RequestID))
		inner.Set("retry_after", optional(e.RetryAfter))
	}
	inner.Set("status", e.Status)
	inner.Set("type", e.Type)
	if !e.SparseSSE {
		inner.Set("upstream_code", optional(e.UpstreamCode))
	}
	o := ojson.NewObject()
	o.Set("error", inner)
	o.Set("type", "error")
	return ojson.MarshalSorted(o)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	b, _ := json.Marshal(v)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(append(b, '\n'))
}

// writeRawJSON 写出已序列化的 body（不追加换行，不做 HTML 转义，与现网一致）。
func writeRawJSON(w http.ResponseWriter, status int, body []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(body)
}

// writeError 按现网输出 JSON 错误：只带 retry-after / request-id 头，结尾无换行。
func writeError(w http.ResponseWriter, e *APIError) {
	if e.RetryAfter != "" {
		w.Header().Set("Retry-After", e.RetryAfter)
	}
	if e.RequestID != "" {
		w.Header().Set("Request-Id", e.RequestID)
	}
	writeRawJSON(w, e.Status, ojson.Marshal(e.JSON()))
}
