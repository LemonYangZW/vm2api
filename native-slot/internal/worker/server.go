package worker

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"vm2api/native-slot/internal/classifier"
	"vm2api/native-slot/internal/credential"
	"vm2api/native-slot/internal/messages"
	"vm2api/native-slot/internal/ojson"
	"vm2api/native-slot/internal/sse"
)

const trailerNames = "X-Terminal-State, X-Error-Code, X-Event-Count, X-Usage, X-Model, X-Stop-Reason"

type envelope struct {
	RequestContext           json.RawMessage `json:"request_context"`
	Body                     json.RawMessage `json:"body"`
	Headers                  map[string]any  `json:"headers"`
	Stream                   *bool           `json:"stream"`
	DeliveryMode             *string         `json:"delivery_mode"`
	CacheTTL                 *string         `json:"cache_ttl"`
	PreserveCacheBreakpoints *bool           `json:"preserve_cache_breakpoints"`
	RequestID                *string         `json:"request_id"`
}

// ServeHTTP 实现 Unix socket 上的内部接口。
func (r *Runtime) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Path
	switch {
	case path == "/internal/health" && req.Method == http.MethodGet:
		writeJSON(w, 200, r.healthWithCredential())
		return
	case strings.HasPrefix(path, "/internal/v1/"):
		if !r.authorized(req) {
			writeError(w, workerError(401, "internal_auth_failed", "internal token mismatch"))
			return
		}
	}
	switch {
	case path == "/internal/v1/messages" && req.Method == http.MethodPost:
		r.handleMessages(w, req)
	case path == "/internal/v1/cancel" && req.Method == http.MethodPost:
		r.handleCancel(w, req)
	case path == "/internal/v1/slots" && req.Method == http.MethodGet:
		writeJSON(w, 200, map[string]any{"ok": true, "slots": r.Slots()})
	default:
		writeError(w, workerError(404, "not_found", "route not found"))
	}
}

func (r *Runtime) authorized(req *http.Request) bool {
	tok := strings.TrimSpace(req.Header.Get("X-Internal-Token"))
	if tok == "" {
		tok = strings.TrimSpace(req.Header.Get("X-Kin-Internal-Token"))
	}
	return tok != "" && tok == strings.TrimSpace(r.cfg.InternalToken)
}

func (r *Runtime) handleCancel(w http.ResponseWriter, req *http.Request) {
	b, err := io.ReadAll(io.LimitReader(req.Body, 1<<20))
	var body map[string]json.RawMessage
	if err != nil || json.Unmarshal(b, &body) != nil {
		writeError(w, workerError(400, "invalid_request", "invalid cancel request"))
		return
	}
	var id string
	if raw, ok := body["request_id"]; !ok || json.Unmarshal(raw, &id) != nil {
		writeError(w, workerError(400, "invalid_request", "request_id must be a string"))
		return
	}
	cancelled := r.Cancel(id, "explicit cancel from control plane")
	writeJSON(w, 200, map[string]any{"cancelled": cancelled, "ok": true})
}

func headerFromAny(m map[string]any) http.Header {
	h := http.Header{}
	for k, v := range m {
		if s, ok := v.(string); ok {
			h.Set(k, s)
		}
	}
	return h
}

func (r *Runtime) handleMessages(w http.ResponseWriter, req *http.Request) {
	raw, err := io.ReadAll(io.LimitReader(req.Body, r.cfg.MaxRequest+1))
	if err != nil {
		writeError(w, workerError(400, "invalid_request", "failed to read request body"))
		return
	}
	if int64(len(raw)) > r.cfg.MaxRequest {
		writeError(w, workerError(413, "invalid_request", "request body exceeds max_request_bytes"))
		return
	}
	var env envelope
	if err := json.Unmarshal(raw, &env); err != nil {
		writeError(w, workerError(400, "invalid_request", "invalid envelope: "+err.Error()))
		return
	}
	decoded, err := messages.Decode(env.Body)
	body, _ := decoded.(map[string]any)
	if err != nil || body == nil {
		writeError(w, workerError(400, "invalid_request", "body must be a Messages request object"))
		return
	}
	if err := messages.Validate(body, r.opts.MaxToolResult); err != nil {
		writeError(w, workerError(400, "invalid_request", err.Error()))
		return
	}
	var rc json.RawMessage
	if len(env.RequestContext) > 0 && string(env.RequestContext) != "null" {
		ctxObj, err1 := ojson.ParseObject(env.RequestContext)
		reqObj, err2 := ojson.ParseObject(env.Body)
		if err1 != nil || err2 != nil {
			writeError(w, &APIError{Status: 400, Type: "invalid_request_error", Code: "invalid_request_context", Message: "Invalid classifier request context"})
			return
		}
		if !classifier.Valid(ctxObj, reqObj) {
			writeError(w, &APIError{Status: 400, Type: "invalid_request_error", Code: "invalid_request_context",
				Message: "Classifier context does not match the request format"})
			return
		}
		rc = json.RawMessage(messages.Marshal(mustDecode(env.RequestContext)))
	}
	stream := env.Stream != nil && *env.Stream
	if env.Stream == nil {
		stream, _ = body["stream"].(bool)
	}
	session := messages.SessionID(body, req.Header, headerFromAny(env.Headers))
	if session == "" {
		session = messages.NewUUID()
	}
	body["metadata"] = map[string]any{"user_id": messages.UserIDJSON(session)}
	body["stream"] = true
	body["wireMessages"] = true
	jobReq := messages.Marshal(body)
	model, _ := body["model"].(string)

	requestID := req.Header.Get("x-request-id")
	if env.RequestID != nil && *env.RequestID != "" {
		requestID = *env.RequestID
	}
	mode := r.cfg.DeliveryMode
	if env.DeliveryMode != nil && (*env.DeliveryMode == "realtime" || *env.DeliveryMode == "verified") {
		mode = *env.DeliveryMode
	}
	j, apiErr := r.Submit(req.Context(), requestID, strings.TrimSpace(req.Header.Get("x-slot")), r.cfg.VMID+session, jobReq, rc)
	if apiErr != nil {
		writeError(w, apiErr)
		return
	}
	defer r.abandon(j, "client disconnected")
	switch {
	case !stream:
		r.respondJSON(w, req, j, model)
	case mode == "verified":
		r.respondVerified(w, req, j, model)
	default:
		r.respondRealtime(w, req, j, model)
	}
}

func mustDecode(b []byte) any {
	v, _ := messages.Decode(b)
	return v
}

type collector struct {
	asm       *sse.Assembler
	rate      map[string]any
	events    int
	bytes     int64
	limit     int64
	completed bool
}

func newCollector(limit int64) *collector {
	return &collector{asm: sse.NewAssembler(), rate: map[string]any{}, limit: limit}
}

// add 解析事件，返回事件类型与按现网形状（键名排序）重新序列化的 data。
func (c *collector) add(raw json.RawMessage) (string, []byte, error) {
	c.bytes += int64(len(raw))
	if c.bytes > c.limit {
		return "", nil, errors.New("response exceeds max_response_bytes")
	}
	var ev map[string]any
	if json.Unmarshal(raw, &ev) != nil {
		return "", nil, errors.New("upstream_response_invalid")
	}
	tree, err := ojson.Parse(raw)
	if err != nil {
		return "", nil, errors.New("upstream_response_invalid")
	}
	c.events++
	typ, _ := ev["type"].(string)
	if typ != "response_headers" {
		c.asm.Add(ev)
	}
	return typ, ojson.MarshalSorted(tree), nil
}

// messageStop 是 job_done 时缺 message_stop 由现网补发的事件。
var messageStop = []byte(`{"type":"message_stop"}`)

func overflow() *APIError {
	return &APIError{Status: 502, Type: "api_error", Code: "upstream_response_invalid",
		Message: "verified stream exceeds response limit"}
}

// next 等待下一条消息，同时监听客户端断开。
func (r *Runtime) next(req *http.Request, j *job) (jobMsg, bool, bool) {
	select {
	case m, ok := <-j.msgs:
		if ok {
			r.consumed(j, m.bytes)
		}
		return m, ok, false
	case <-req.Context().Done():
		return jobMsg{}, false, true
	}
}

// respondRealtime 与现网一致：拿到槽位即提交 200 与 SSE 头，此后的任何错误都以
// error 事件结束；trailer 成功时只有 x-terminal-state: verified，失败时为
// incomplete 加 x-error-code。
func (r *Runtime) respondRealtime(w http.ResponseWriter, req *http.Request, j *job, model string) {
	rc := http.NewResponseController(w)
	c := newCollector(r.cfg.MaxResponse)
	h := w.Header()
	h.Set("Content-Type", "text/event-stream")
	h.Set("Trailer", trailerNames)
	w.WriteHeader(200)
	if rc.Flush() != nil {
		r.Cancel(j.id, "client disconnected")
		return
	}
	write := func(name string, data []byte) bool {
		_ = rc.SetWriteDeadline(time.Now().Add(r.opts.ClientStall))
		var buf bytes.Buffer
		buf.WriteString("event: ")
		buf.WriteString(name)
		buf.WriteString("\ndata: ")
		buf.Write(data)
		buf.WriteString("\n\n")
		if _, err := w.Write(buf.Bytes()); err != nil {
			r.Cancel(j.id, "client read timed out")
			return false
		}
		if err := rc.Flush(); err != nil {
			r.Cancel(j.id, "client disconnected")
			return false
		}
		return true
	}
	fail := func(e *APIError) {
		if write("error", e.SSE()) {
			h.Set("X-Terminal-State", "incomplete")
			h.Set("X-Error-Code", e.Code)
		}
	}
	for {
		m, ok, gone := r.next(req, j)
		if gone {
			r.Cancel(j.id, "client disconnected")
			return
		}
		if !ok {
			fail(workerError(502, "kernel_error", "job stream closed"))
			return
		}
		switch m.kind {
		case msgEvent:
			typ, data, err := c.add(m.raw)
			if err != nil {
				r.Cancel(j.id, "job stream overflow")
				fail(&APIError{Status: 502, Type: "api_error", Code: "upstream_response_invalid", Message: err.Error()})
				return
			}
			if !write(typ, data) {
				return
			}
		case msgError:
			fail(m.err)
			return
		case msgDone:
			if c.asm.Complete(model) && !write("message_stop", messageStop) {
				return
			}
			h.Set("X-Terminal-State", "verified")
			return
		}
	}
}

// respondVerified 收齐事件后一次性返回；出错时返回 JSON 错误。
func (r *Runtime) respondVerified(w http.ResponseWriter, req *http.Request, j *job, model string) {
	c := newCollector(r.cfg.MaxResponse)
	var buf bytes.Buffer
	for {
		m, ok, gone := r.next(req, j)
		if gone {
			r.Cancel(j.id, "client disconnected")
			return
		}
		if !ok {
			writeError(w, workerError(502, "kernel_error", "job stream closed"))
			return
		}
		switch m.kind {
		case msgEvent:
			typ, data, err := c.add(m.raw)
			if err != nil {
				r.Cancel(j.id, "job stream overflow")
				writeError(w, overflow())
				return
			}
			fmt.Fprintf(&buf, "event: %s\ndata: %s\n\n", typ, data)
		case msgError:
			writeError(w, m.err)
			return
		case msgDone:
			seen := c.asm.Model // x-model 只取事件里的 model，不用合成值
			if c.asm.Complete(model) {
				c.events++
				fmt.Fprintf(&buf, "event: message_stop\ndata: %s\n\n", messageStop)
			}
			h := w.Header()
			h.Set("Content-Type", "text/event-stream")
			h.Set("x-terminal-state", "verified")
			h.Set("x-event-count", strconv.Itoa(c.events))
			if seen != "" {
				h.Set("x-model", seen)
			}
			h.Set("Content-Length", strconv.Itoa(buf.Len()))
			w.WriteHeader(200)
			_, _ = w.Write(buf.Bytes())
			return
		}
	}
}

// respondJSON 组装完整 message 返回；响应头与现网一致只有 x-terminal-state。
func (r *Runtime) respondJSON(w http.ResponseWriter, req *http.Request, j *job, model string) {
	c := newCollector(r.cfg.MaxResponse)
	for {
		m, ok, gone := r.next(req, j)
		if gone {
			r.Cancel(j.id, "client disconnected")
			return
		}
		if !ok {
			writeError(w, workerError(502, "kernel_error", "job stream closed"))
			return
		}
		switch m.kind {
		case msgEvent:
			if _, _, err := c.add(m.raw); err != nil {
				r.Cancel(j.id, "job stream overflow")
				writeError(w, overflow())
				return
			}
		case msgError:
			writeError(w, m.err)
			return
		case msgDone:
			c.asm.Complete(model)
			body, err := c.asm.FinishJSON()
			if err != nil {
				writeError(w, workerError(502, "kernel_error", err.Error()))
				return
			}
			w.Header().Set("x-terminal-state", "verified")
			writeRawJSON(w, 200, body)
			return
		}
	}
}

// healthWithCredential 在健康视图上附加凭据状态（每次重读凭据文件）。
func (r *Runtime) healthWithCredential() map[string]any {
	h := r.Health()
	info := map[string]any{"has_access": false, "has_refresh": false, "expires_at": nil, "ttl_seconds": nil,
		"needs_refresh": false, "generation": nil}
	cred, err := credential.Load(r.cfg.CredentialPath)
	if err != nil {
		h["credential_error"] = err.Error()
	} else {
		info["has_access"] = cred.Token != ""
		info["has_refresh"] = cred.RefreshToken != ""
		info["needs_refresh"] = cred.NeedsRefresh(r.cfg.RefreshSkew, time.Now())
		if cred.ExpiresAt > 0 {
			info["expires_at"] = cred.ExpiresAt
			info["ttl_seconds"] = (cred.ExpiresAt - time.Now().UnixMilli()) / 1000
		}
		if cred.Generation != 0 {
			info["generation"] = cred.Generation
		}
	}
	h["credential"] = info
	return h
}
