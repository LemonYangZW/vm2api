package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"vm2api/native-slot/internal/classifier"
	"vm2api/native-slot/internal/config"
	"vm2api/native-slot/internal/messages"
	"vm2api/native-slot/internal/ojson"
	"vm2api/native-slot/internal/sse"
)

const trailerNames = "X-Terminal-State, X-Error-Code, X-Event-Count, X-Usage, X-Model, X-Stop-Reason"

// Server 是主 API 的 HTTP 处理器。
type Server struct {
	cfg           *config.Resolved
	provider      Provider
	tenant        string
	exposeSlot    bool
	maxToolResult int64
	envelopePath  string
	conts         *continuations

	envMu    sync.Mutex
	envelope map[string]any
}

// New 按 provider 构造服务；anthropic_api 缺少密钥时返回错误。
func New(cfg *config.Resolved) (*Server, error) {
	var p Provider
	switch cfg.Provider {
	case "anthropic_api":
		ap, err := newAnthropicProvider(cfg)
		if err != nil {
			return nil, err
		}
		p = ap
	case "local_cli":
		p = newLocalProvider(cfg)
	case "mock":
		p = mockProvider{}
	default:
		return nil, errors.New("unsupported PROVIDER: " + cfg.Provider)
	}
	expose := true
	if v := strings.ToLower(strings.TrimSpace(os.Getenv("EXPOSE_SLOT_HEADER"))); v == "0" || v == "false" || v == "no" {
		expose = false
	}
	path := os.Getenv("ENVELOPE_PATH")
	if path == "" {
		path = "/tmp/cli/envelope.json"
	}
	s := &Server{cfg: cfg, provider: p, tenant: os.Getenv("DEFAULT_TENANT"), exposeSlot: expose,
		maxToolResult: config.EnvInt("MAX_TOOL_RESULT_BYTES", 4<<20), envelopePath: path,
		conts: newContinuations(cfg.SessionIdleTTL)}
	s.envelope = s.loadEnvelope()
	return s, nil
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == http.MethodGet && (r.URL.Path == "/healthz" || r.URL.Path == "/status"):
		writeJSON(w, 200, map[string]any{"ok": true, "provider": s.provider.Name(), "vm_id": s.cfg.VMID})
	case r.Method == http.MethodGet && r.URL.Path == "/readyz":
		if s.provider.Ready(r.Context()) {
			writeJSON(w, 200, map[string]any{"ready": true})
		} else {
			writeJSON(w, 503, map[string]any{"ready": false})
		}
	case r.Method == http.MethodPost && r.URL.Path == "/v1/messages":
		s.handleMessages(w, r)
	case r.Method == http.MethodPost && r.URL.Path == "/v1/chat/completions":
		s.handleChat(w, r)
	case r.Method == http.MethodGet && r.URL.Path == "/internal/v1/slots":
		s.handleSlots(w, r)
	case r.URL.Path == "/internal/v1/envelope" && (r.Method == http.MethodGet || r.Method == http.MethodPut):
		s.handleEnvelope(w, r)
	default:
		writeAPIError(w, newErr(404, "not_found", "not_found_error", "route not found"))
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	b, _ := json.Marshal(v)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(append(b, '\n'))
}

func errorType(e *Error) string {
	if e.Type != "" {
		return e.Type
	}
	switch e.Code {
	case "invalid_request", "invalid_request_context":
		return "invalid_request_error"
	case "no_capacity":
		return "overloaded_error"
	case "upstream_auth_error", "needs_refresh":
		return "authentication_error"
	}
	return "api_error"
}

func writeAPIError(w http.ResponseWriter, e *Error) {
	if e.RetryAfter != "" {
		w.Header().Set("retry-after", e.RetryAfter)
	}
	status := e.Status
	if status < 400 || status > 599 {
		status = 502
	}
	inner := map[string]any{"type": errorType(e), "message": e.Message, "code": e.Code}
	if e.RequestID != "" {
		inner["request_id"] = e.RequestID
	}
	writeJSON(w, status, map[string]any{"type": "error", "error": inner})
}

func (s *Server) readBody(w http.ResponseWriter, r *http.Request) ([]byte, *Error) {
	b, err := io.ReadAll(http.MaxBytesReader(w, r.Body, s.cfg.MaxRequest))
	if err != nil {
		return nil, newErr(413, "invalid_request", "invalid_request_error", "request body exceeds max_request_bytes")
	}
	return b, nil
}

// prepared 是加工后的请求。
type prepared struct {
	call      *Call
	stream    bool
	model     string
	session   string
	requestID string
	cont      string
}

func (s *Server) prepare(r *http.Request, body map[string]any) (*prepared, *Error) {
	if err := messages.Validate(body, s.maxToolResult); err != nil {
		if strings.Contains(err.Error(), "MAX_TOOL_RESULT_BYTES") {
			return nil, newErr(400, "invalid_request", "invalid_request_error", err.Error())
		}
		return nil, newErr(400, "invalid_request", "invalid_request_error", err.Error())
	}
	session := messages.SessionID(body, r.Header)
	if session == "" {
		session = messages.NewUUID()
	}
	cont := strings.TrimSpace(r.Header.Get("x-continuation"))
	if cont != "" {
		if e := s.conts.check(session, cont, body, s.cfg.MaxRequest); e != nil {
			return nil, e
		}
	}
	var rc map[string]any
	if raw, ok := body["request_context"]; ok {
		delete(body, "request_context")
		rc, _ = raw.(map[string]any)
	}
	if env := s.envelopeSnapshot(); rc == nil {
		if v, ok := env["request_context"].(map[string]any); ok {
			rc = v
		}
	}
	if rc != nil {
		ctxObj, _ := ojson.ParseObject(mustJSON(rc))
		reqObj, _ := ojson.ParseObject(mustJSON(body))
		if !classifier.Valid(ctxObj, reqObj) {
			return nil, newErr(400, "invalid_request_context", "invalid_request_error", "Classifier context does not match the request format")
		}
	}
	body["metadata"] = map[string]any{"user_id": messages.UserIDJSON(session)}
	stream, _ := body["stream"].(bool)
	model, _ := body["model"].(string)
	reqID := strings.TrimSpace(r.Header.Get("x-request-id"))
	if reqID == "" {
		reqID = messages.NewUUID()
	}
	return &prepared{call: &Call{Body: body, RequestContext: rc, RequestID: reqID, Session: session,
		Slot: strings.TrimSpace(r.Header.Get("x-slot")), Header: r.Header}, stream: stream, model: model,
		session: session, requestID: reqID, cont: cont}, nil
}

func mustJSON(v any) []byte { b, _ := json.Marshal(v); return b }

func (s *Server) commonHeaders(w http.ResponseWriter, p *prepared, res *Result, contOut string) {
	h := w.Header()
	h.Set("x-request-id", p.requestID)
	h.Set("x-tenant-id", or(p.call.Header.Get("x-tenant-id"), s.tenant))
	h.Set("x-session-id", p.session)
	if contOut != "" {
		h.Set("x-continuation", contOut)
	}
	if s.exposeSlot && p.call.Slot != "" {
		h.Set("x-slot", p.call.Slot)
	}
	if res != nil && res.PID > 0 {
		h.Set("x-pid", strconv.FormatInt(res.PID, 10))
	}
	if res != nil && res.NativeSlot != "" {
		h.Set("x-native-slot", res.NativeSlot)
	}
	gen := int64(0)
	if res != nil {
		gen = res.Generation
	}
	h.Set("x-generation", strconv.FormatInt(gen, 10))
}

func (s *Server) handleMessages(w http.ResponseWriter, r *http.Request) {
	raw, e := s.readBody(w, r)
	if e != nil {
		writeAPIError(w, e)
		return
	}
	var body map[string]any
	if json.Unmarshal(raw, &body) != nil || body == nil {
		writeAPIError(w, newErr(400, "invalid_request", "invalid_request_error", "request body must be a JSON object"))
		return
	}
	if _, ok := body["messages"]; !ok {
		writeAPIError(w, newErr(400, "invalid_request", "invalid_request_error", "messages must not be empty"))
		return
	}
	p, e := s.prepare(r, body)
	if e != nil {
		writeAPIError(w, e)
		return
	}
	if p.stream {
		s.streamAnthropic(w, r, p)
		return
	}
	asm, res, e := s.collect(r.Context(), p)
	if e != nil {
		writeAPIError(w, e)
		return
	}
	msg, err := asm.Finish()
	if err != nil {
		writeAPIError(w, newErr(502, "stream ended without a result", "api_error", "stream ended without a result"))
		return
	}
	token := s.conts.issue()
	s.conts.record(p.session, token, msg)
	if msg["stop_reason"] != "tool_use" {
		token = ""
	}
	s.commonHeaders(w, p, res, token)
	out, _ := asm.FinishJSON()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	_, _ = w.Write(out)
}

// collect 消费完整事件流（非流式路径）。
func (s *Server) collect(ctx context.Context, p *prepared) (*sse.Assembler, *Result, *Error) {
	asm := sse.NewAssembler()
	var total int64
	res, e := s.provider.Stream(ctx, p.call, func(raw json.RawMessage) error {
		total += int64(len(raw))
		if total > s.cfg.MaxResponse {
			return errors.New("verified stream exceeds response limit")
		}
		var ev map[string]any
		if json.Unmarshal(raw, &ev) == nil && ev["type"] != "response_headers" {
			asm.Add(ev)
		}
		return nil
	})
	if e != nil && total > s.cfg.MaxResponse {
		return nil, res, newErr(502, "verified stream exceeds response limit", "api_error", "verified stream exceeds response limit")
	}
	return asm, res, e
}

func (s *Server) streamAnthropic(w http.ResponseWriter, r *http.Request, p *prepared) {
	rc := http.NewResponseController(w)
	asm := sse.NewAssembler()
	started, count := false, 0
	stall := config.EnvSeconds("CLIENT_STALL_SECS", 30*time.Second)
	meta := s.meta(r.Context())
	token := s.conts.issue()
	res, e := s.provider.Stream(r.Context(), p.call, func(raw json.RawMessage) error {
		var ev map[string]any
		if json.Unmarshal(raw, &ev) != nil {
			return errors.New("upstream_response_invalid")
		}
		typ, _ := ev["type"].(string)
		if typ != "response_headers" {
			asm.Add(ev)
		}
		count++
		if !started {
			s.commonHeaders(w, p, meta, token)
			h := w.Header()
			h.Set("Content-Type", "text/event-stream")
			h.Set("Cache-Control", "no-cache, no-transform")
			h.Set("X-Accel-Buffering", "no")
			h.Set("Connection", "keep-alive")
			h.Set("Trailer", trailerNames)
			w.WriteHeader(200)
			started = true
		}
		_ = rc.SetWriteDeadline(time.Now().Add(stall))
		var buf bytes.Buffer
		buf.WriteString("event: " + typ + "\ndata: ")
		buf.Write(raw)
		buf.WriteString("\n\n")
		if _, err := w.Write(buf.Bytes()); err != nil {
			return errors.New("client read timed out")
		}
		if err := rc.Flush(); err != nil {
			return errors.New("client disconnected")
		}
		return nil
	})
	_ = res
	setTrailers := func(state, code string) {
		h := w.Header()
		h.Set("X-Terminal-State", state)
		h.Set("X-Error-Code", code)
		h.Set("X-Event-Count", strconv.Itoa(count))
		h.Set("X-Usage", asm.UsageJSON())
		h.Set("X-Model", asm.Model)
		h.Set("X-Stop-Reason", asm.StopReason)
	}
	if e != nil {
		if !started {
			writeAPIError(w, e)
			return
		}
		b, _ := json.Marshal(map[string]any{"type": "error", "error": map[string]any{"type": errorType(e), "message": e.Message, "code": e.Code}})
		_, _ = w.Write([]byte("event: error\ndata: " + string(b) + "\n\n"))
		setTrailers("error", e.Code)
		return
	}
	if !asm.Stopped {
		if !started {
			writeAPIError(w, newErr(502, "upstream_stream_incomplete", "api_error", "Anthropic message response is incomplete"))
			return
		}
		b, _ := json.Marshal(map[string]any{"type": "error", "error": map[string]any{"type": "api_error",
			"message": "Anthropic message response is incomplete", "code": "upstream_stream_incomplete"}})
		_, _ = w.Write([]byte("event: error\ndata: " + string(b) + "\n\n"))
		setTrailers("incomplete", "upstream_stream_incomplete")
		return
	}
	if msg, err := asm.Finish(); err == nil {
		s.conts.record(p.session, token, msg)
	}
	setTrailers("complete", "")
}

// meta 在写响应头前取得宿主进程号与代次。
func (s *Server) meta(ctx context.Context) *Result {
	res := &Result{Generation: 1}
	if lp, ok := s.provider.(*localProvider); ok {
		res.Generation = 0
		if h := lp.workerHealth(ctx); h != nil {
			if g, ok := h["generation"].(float64); ok {
				res.Generation = int64(g)
			}
			if pid, ok := h["cli_pid"].(float64); ok {
				res.PID = int64(pid)
			}
		}
	}
	return res
}

func (s *Server) handleSlots(w http.ResponseWriter, r *http.Request) {
	lp, ok := s.provider.(*localProvider)
	if !ok {
		writeJSON(w, 200, map[string]any{"slots": []any{}})
		return
	}
	req, _ := http.NewRequestWithContext(r.Context(), http.MethodGet, "http://worker/internal/v1/slots", nil)
	req.Header.Set("X-Internal-Token", s.cfg.InternalToken)
	resp, err := lp.client.Do(req)
	if err != nil {
		writeAPIError(w, newErr(503, "kernel_unavailable", "api_error", "gateway worker unavailable"))
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

// ---- 信封 ----

func (s *Server) loadEnvelope() map[string]any {
	env := map[string]any{"system_layout": "zero", "timezone": config.ExpectedTimezone("")}
	b, err := os.ReadFile(s.envelopePath)
	if err != nil {
		return env
	}
	var raw map[string]any
	if json.Unmarshal(b, &raw) != nil {
		return env
	}
	if v, _ := raw["system_layout"].(string); v == "zero" || v == "identity" {
		env["system_layout"] = v
	}
	if v, _ := raw["timezone"].(string); strings.TrimSpace(v) != "" {
		if _, err := time.LoadLocation(v); err == nil {
			env["timezone"] = v
		}
	}
	for _, k := range []string{"default_cache_ttl", "preserve_cache_breakpoints", "request_context", "headers"} {
		if v, ok := raw[k]; ok {
			env[k] = v
		}
	}
	return env
}

func (s *Server) envelopeSnapshot() map[string]any {
	s.envMu.Lock()
	defer s.envMu.Unlock()
	out := map[string]any{}
	for k, v := range s.envelope {
		out[k] = v
	}
	return out
}

func (s *Server) handleEnvelope(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		writeJSON(w, 200, s.envelopeSnapshot())
		return
	}
	raw, e := s.readBody(w, r)
	if e != nil {
		writeAPIError(w, e)
		return
	}
	var in map[string]any
	if json.Unmarshal(raw, &in) != nil {
		writeAPIError(w, newErr(400, "invalid_request", "invalid_request_error", "envelope must be a JSON object"))
		return
	}
	if v, ok := in["system_layout"]; ok {
		if sv, _ := v.(string); sv != "zero" && sv != "identity" {
			writeAPIError(w, newErr(400, "invalid_request", "invalid_request_error", "system_layout must be zero or identity"))
			return
		}
	}
	if v, ok := in["default_cache_ttl"]; ok {
		if sv, _ := v.(string); sv != "5m" && sv != "1h" {
			writeAPIError(w, newErr(400, "invalid_request", "invalid_request_error", "default_cache_ttl must be 5m or 1h"))
			return
		}
	}
	s.envMu.Lock()
	for k, v := range in {
		s.envelope[k] = v
	}
	snapshot := map[string]any{}
	for k, v := range s.envelope {
		snapshot[k] = v
	}
	s.envMu.Unlock()
	if err := os.MkdirAll(filepath.Dir(s.envelopePath), 0o700); err == nil {
		b, _ := json.MarshalIndent(snapshot, "", "  ")
		_ = os.WriteFile(s.envelopePath, append(b, '\n'), 0o600)
	}
	writeJSON(w, 200, snapshot)
}
