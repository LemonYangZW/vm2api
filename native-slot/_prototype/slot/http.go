package slot

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type envelope struct {
	Body           map[string]any `json:"body"`
	Stream         bool           `json:"stream"`
	RequestID      string         `json:"request_id"`
	RequestContext map[string]any `json:"request_context"`
	CacheTTL       string         `json:"cache_ttl"`
}

func (k *Kernel) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("x-kin-internal-token")
	if token == "" {
		token = r.Header.Get("x-internal-token")
	}
	if subtle.ConstantTimeCompare([]byte(token), []byte(k.c.InternalToken)) != 1 {
		writeError(w, failure(Frame{}, 401, "unauthorized", "authentication_error", "invalid internal token"))
		return
	}
	switch {
	case r.Method == "GET" && r.URL.Path == "/internal/health":
		k.mu.Lock()
		pid := 0
		if k.gen != nil && !k.recovering && k.healthy {
			pid = k.gen.cmd.Process.Pid
		}
		body := map[string]any{"ok": true, "engine": "native", "provider": "local_cli", "worker_version": Version, "ready_slots": len(k.available), "closed_slots": k.c.Slots - len(k.available) - len(k.jobs), "cli_restarts": k.restarts, "recovering": k.recovering, "healthy": k.healthy, "unhealthy_reason": k.reason, "cli_pid": pid}
		k.mu.Unlock()
		writeJSON(w, 200, body)
	case r.Method == "POST" && r.URL.Path == "/internal/v1/cancel":
		var body struct {
			RequestID string `json:"request_id"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&body) != nil || body.RequestID == "" {
			writeError(w, failure(Frame{}, 400, "invalid_request", "invalid_request_error", "request_id required"))
			return
		}
		k.cancelRequest(body.RequestID)
		writeJSON(w, 200, map[string]any{"ok": true})
	case r.Method == "POST" && r.URL.Path == "/internal/v1/messages":
		k.messages(w, r)
	default:
		writeError(w, failure(Frame{}, 404, "not_found", "invalid_request_error", "unknown internal endpoint"))
	}
}

func (k *Kernel) messages(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var e envelope
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, k.c.MaxRequestBytes))
	if dec.Decode(&e) != nil || e.Body == nil {
		writeError(w, failure(Frame{}, 400, "invalid_request", "invalid_request_error", "invalid message envelope"))
		return
	}
	if e.CacheTTL != "" && e.CacheTTL != "1h" && e.CacheTTL != "5m" {
		writeError(w, failure(Frame{}, 400, "invalid_request", "invalid_request_error", "cache_ttl must be 5m or 1h"))
		return
	}
	if e.RequestID == "" {
		var b [16]byte
		if _, err := rand.Read(b[:]); err != nil {
			writeError(w, failure(Frame{}, 500, "cli_error", "api_error", "cannot allocate request ID"))
			return
		}
		e.RequestID = hex.EncodeToString(b[:])
	}
	if len(e.RequestID) > 200 {
		writeError(w, failure(Frame{}, 400, "invalid_request", "invalid_request_error", "request_id exceeds limit"))
		return
	}
	if err := validateContext(e.RequestContext, e.Body); err != nil {
		writeError(w, failure(Frame{}, 400, "invalid_request_context", "invalid_request_error", err.Error()))
		return
	}
	if e.CacheTTL != "" {
		// 显式请求 TTL 优先于宿主默认值；保留 beta 通道给宿主生成 HTTP 头。
		betas := e.Body["betas"]
		e.Body, _ = prepareRequest(e.Body, e.CacheTTL)
		if betas != nil {
			e.Body["betas"] = betas
		}
	}
	job, err := k.acquire(e.RequestID, e.Body, e.RequestContext)
	if err != nil {
		status, code := 503, "no_capacity"
		if errors.Is(err, errDuplicateRequest) {
			status, code = 409, "duplicate_request"
		}
		writeError(w, failure(Frame{}, status, code, "api_error", err.Error()))
		return
	}
	defer k.cancelRequest(e.RequestID)
	a := newAccumulation()
	headers := map[string]any{}
	started := false
	var received int64
	controller := http.NewResponseController(w)
	sendEvent := func(event map[string]any) bool {
		_ = controller.SetWriteDeadline(time.Now().Add(30 * time.Second))
		b, err := json.Marshal(event)
		if err != nil {
			return false
		}
		if _, err = fmt.Fprintf(w, "event: %s\ndata: %s\n\n", stringValue(event["type"]), b); err != nil {
			return false
		}
		return controller.Flush() == nil
	}
	for {
		select {
		case <-r.Context().Done():
			return
		case <-k.ctx.Done():
			if !started {
				writeError(w, failure(Frame{}, 503, "cli_error", "api_error", "kernel shutting down"))
			}
			return
		case f, ok := <-job.frames:
			if !ok {
				return
			}
			switch f.Type {
			case "stream_event":
				b, _ := json.Marshal(f.Event)
				received += int64(len(b))
				if received > k.c.MaxResponseBytes {
					f = failure(Frame{}, 502, "upstream_stream_interrupted", "api_error", "response exceeds limit")
					if !started {
						writeError(w, f)
					} else {
						_ = sendEvent(errorBody(f))
						w.Header().Set("x-terminal-state", "error")
					}
					return
				}
				if f.Event["type"] == "response_headers" {
					merge(headers, object(f.Event["headers"]))
				} else {
					a.add(f.Event)
				}
				if e.Stream {
					if !started {
						w.Header().Set("Content-Type", "text/event-stream")
						w.Header().Set("Cache-Control", "no-cache")
						w.Header().Set("Trailer", "x-terminal-state, x-usage, x-model, x-stop-reason, x-rate-limit-headers")
						started = true
					}
					if !sendEvent(f.Event) {
						return
					}
				}
			case "job_done":
				if !a.Stopped || a.Message == nil {
					err := failure(Frame{}, 502, "upstream_stream_interrupted", "api_error", "job_done without complete SSE message")
					if started {
						_ = sendEvent(errorBody(err))
						w.Header().Set("x-terminal-state", "incomplete")
					} else {
						writeError(w, err)
					}
					return
				}
				setMetadata(w.Header(), a, headers, "verified")
				if !e.Stream {
					body, err := a.result()
					if err != nil {
						writeError(w, failure(Frame{}, 502, "upstream_stream_interrupted", "api_error", err.Error()))
						return
					}
					writeJSON(w, 200, body)
				}
				return
			case "job_error":
				if started {
					_ = sendEvent(errorBody(f))
					setMetadata(w.Header(), a, headers, "error")
				} else {
					writeError(w, f)
				}
				return
			}
		}
	}
}

func setMetadata(h http.Header, a *accumulation, headers map[string]any, state string) {
	h.Set("x-terminal-state", state)
	u, _ := json.Marshal(a.Usage)
	h.Set("x-usage", string(u))
	h.Set("x-model", a.Model)
	h.Set("x-stop-reason", a.StopReason)
	// 只允许规格中的上游头，拒绝任意 CLI 扩展注入到 HTTP 响应。
	filtered := map[string]any{}
	for key, value := range headers {
		key = strings.ToLower(key)
		if strings.HasPrefix(key, "anthropic-ratelimit-") || key == "request-id" || key == "retry-after" {
			filtered[key] = value
		}
	}
	b, _ := json.Marshal(filtered)
	h.Set("x-rate-limit-headers", string(b))
}

func errorBody(f Frame) map[string]any {
	message := "native slot error"
	if f.Error != nil {
		message = *f.Error
	}
	status := f.Status
	if status < 400 || status > 599 {
		status = 502
	}
	err := map[string]any{"type": f.ErrorType, "code": f.Code, "message": message, "status": status, "upstream_status": status}
	if f.RetryAfter != "" {
		err["retry_after"] = f.RetryAfter
	}
	if f.UpstreamCode != "" {
		err["upstream_code"] = f.UpstreamCode
	}
	if f.RequestID != "" {
		err["request_id"] = f.RequestID
	}
	return map[string]any{"type": "error", "error": err}
}

func writeError(w http.ResponseWriter, f Frame) {
	status := f.Status
	if status < 400 || status > 599 {
		status = 502
	}
	w.Header().Set("x-terminal-state", "error")
	if f.RetryAfter != "" {
		w.Header().Set("Retry-After", f.RetryAfter)
	}
	writeJSON(w, status, errorBody(f))
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
