// Package api 实现主 API 模式（05 5.2、5.3）。
package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"vm2api/native-slot/internal/config"
	"vm2api/native-slot/internal/credential"
	"vm2api/native-slot/internal/netx"
	"vm2api/native-slot/internal/sse"
)

// Error 是主 API 内部错误。
type Error struct {
	Status     int
	Code       string
	Type       string
	Message    string
	RetryAfter string
	RequestID  string
}

func (e *Error) Error() string { return e.Message }

func newErr(status int, code, typ, msg string) *Error {
	return &Error{Status: status, Code: code, Type: typ, Message: msg}
}

// Call 是一次 Provider 调用的输入。
type Call struct {
	Body           map[string]any
	RequestContext map[string]any
	RequestID      string
	Session        string
	Slot           string
	Header         http.Header
}

// Result 汇总调用元数据。
type Result struct {
	RateHeaders map[string]string
	Generation  int64
	PID         int64
	NativeSlot  string
}

// Provider 逐条回调事件；onEvent 返回错误即中止。
type Provider interface {
	Name() string
	Ready(ctx context.Context) bool
	Stream(ctx context.Context, c *Call, onEvent func(json.RawMessage) error) (*Result, *Error)
}

// ---- anthropic_api ----

const anthropicMessagesURL = "https://api.anthropic.com/v1/messages"

type anthropicProvider struct {
	cfg    *config.Resolved
	apiKey string
	client *http.Client
	url    string
}

func newAnthropicProvider(cfg *config.Resolved) (*anthropicProvider, error) {
	key := strings.TrimSpace(os.Getenv("ANTHROPIC_API_KEY"))
	if key == "" {
		return nil, errors.New("ANTHROPIC_API_KEY is required for PROVIDER=anthropic_api")
	}
	target := anthropicMessagesURL
	if cfg.TestEndpoints && cfg.AnthropicBaseURL != "https://api.anthropic.com" {
		base, err := url.Parse(cfg.AnthropicBaseURL)
		if err != nil || base.Host == "" {
			return nil, errors.New("invalid Anthropic base URL")
		}
		u := base.JoinPath("v1", "messages")
		if u.Host != base.Host {
			return nil, errors.New("upstream path escaped Anthropic origin")
		}
		target = u.String()
	}
	tr := &http.Transport{
		Proxy:                 http.ProxyFromEnvironment,
		DialContext:           netx.DialContext,
		ForceAttemptHTTP2:     true,
		MaxIdleConnsPerHost:   32,
		IdleConnTimeout:       90 * time.Second,
		ResponseHeaderTimeout: cfg.FirstByteTimeout,
	}
	if cfg.ProxyURL != "" {
		if p, err := url.Parse(cfg.ProxyURL); err == nil {
			tr.Proxy = http.ProxyURL(p)
		}
	}
	return &anthropicProvider{cfg: cfg, apiKey: key, url: target, client: &http.Client{Transport: tr,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}}, nil
}

func (p *anthropicProvider) Name() string               { return "anthropic_api" }
func (p *anthropicProvider) Ready(context.Context) bool { return true }

func (p *anthropicProvider) auth(h http.Header) *Error {
	cred, err := credential.Load(p.cfg.CredentialPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			h.Set("x-api-key", p.apiKey)
			return nil
		}
		return newErr(401, "needs_refresh", "authentication_error", "credential needs refresh")
	}
	if cred.NeedsRefresh(p.cfg.RefreshSkew, time.Now()) || cred.Token == "" {
		return newErr(401, "needs_refresh", "authentication_error", "credential needs refresh")
	}
	if cred.Bearer() {
		h.Set("Authorization", "Bearer "+cred.Token)
	} else {
		h.Set("x-api-key", cred.Token)
	}
	return nil
}

func (p *anthropicProvider) Stream(ctx context.Context, c *Call, onEvent func(json.RawMessage) error) (*Result, *Error) {
	body := map[string]any{}
	for k, v := range c.Body {
		body[k] = v
	}
	body["stream"] = true
	raw, err := json.Marshal(body)
	if err != nil {
		return nil, newErr(500, "kernel_error", "api_error", "encode request")
	}
	if p.cfg.RequestTimeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, p.cfg.RequestTimeout)
		defer cancel()
	}
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, p.url, bytes.NewReader(raw))
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")
	req.Header.Set("user-agent", "kernel/0.1.0")
	req.Header.Set("accept", "text/event-stream")
	if b := c.Header.Get("anthropic-beta"); b != "" {
		req.Header.Set("anthropic-beta", b)
	}
	if e := p.auth(req.Header); e != nil {
		return nil, e
	}
	resp, err := p.client.Do(req)
	if err != nil {
		if ctx.Err() != nil && errors.Is(ctx.Err(), context.Canceled) {
			return nil, newErr(499, "client disconnected", "api_error", "client disconnected")
		}
		var ne net.Error
		if errors.As(err, &ne) && ne.Timeout() {
			return nil, newErr(504, "stream first-byte timeout", "timeout_error", "stream first-byte timeout")
		}
		return nil, newErr(502, "upstream_transport", "api_error", "upstream transport failed: "+clip(err.Error(), 200))
	}
	defer resp.Body.Close()
	res := &Result{RateHeaders: rateHeaders(resp.Header)}
	reqID := resp.Header.Get("request-id")
	if reqID == "" {
		reqID = resp.Header.Get("x-request-id")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		data, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		var eb struct {
			Error struct {
				Type    string `json:"type"`
				Message string `json:"message"`
			} `json:"error"`
		}
		if json.Unmarshal(data, &eb) != nil {
			return res, &Error{Status: 502, Code: "upstream_response_invalid", Type: "api_error",
				Message: "upstream_response_invalid", RequestID: reqID}
		}
		code := "api_error"
		if resp.StatusCode == 401 || resp.StatusCode == 403 {
			code = "upstream_auth_error"
		}
		return res, &Error{Status: resp.StatusCode, Code: code, Type: or(eb.Error.Type, "api_error"),
			Message: or(eb.Error.Message, resp.Status), RetryAfter: resp.Header.Get("retry-after"), RequestID: reqID}
	}
	return res, pumpSSE(ctx, resp.Body, p.cfg, onEvent, reqID)
}

// pumpSSE 解析 data 行并做首字节 / 空闲超时与单事件上限检查。
func pumpSSE(ctx context.Context, body io.ReadCloser, cfg *config.Resolved, onEvent func(json.RawMessage) error, reqID string) *Error {
	type item struct {
		ev  *sse.Event
		err error
	}
	ch := make(chan item, 64)
	rd := sse.NewReader(body, int(cfg.MaxEvent))
	go func() {
		defer close(ch)
		for {
			ev, err := rd.Next()
			select {
			case ch <- item{ev, err}:
			case <-ctx.Done():
				return
			}
			if err != nil {
				return
			}
		}
	}()
	first := true
	timer := time.NewTimer(cfg.FirstByteTimeout)
	defer timer.Stop()
	sawStop := false
	for {
		select {
		case <-ctx.Done():
			_ = body.Close()
			return newErr(499, "client disconnected", "api_error", "client disconnected")
		case <-timer.C:
			_ = body.Close()
			if first {
				return newErr(504, "stream first-byte timeout", "timeout_error", "stream first-byte timeout")
			}
			return newErr(504, "stream idle timeout", "timeout_error", "stream idle timeout")
		case it, ok := <-ch:
			if !ok {
				return newErr(502, "stream ended without a result", "api_error", "stream ended without a result")
			}
			if it.err != nil {
				if it.err == io.EOF {
					if sawStop {
						return nil
					}
					return newErr(502, "upstream_stream_incomplete", "api_error", "Anthropic message response is incomplete")
				}
				if errors.Is(it.err, sse.ErrEventTooLarge) {
					return newErr(502, "SSE event exceeds limit", "api_error", "SSE event exceeds limit")
				}
				return newErr(502, "upstream_stream_incomplete", "api_error", "Anthropic message response is incomplete")
			}
			first = false
			timer.Reset(cfg.IdleTimeout)
			data := bytes.TrimSpace(it.ev.Data)
			if len(data) == 0 || string(data) == "[DONE]" {
				continue
			}
			var probe map[string]any
			if json.Unmarshal(data, &probe) != nil {
				return &Error{Status: 502, Code: "upstream_response_invalid", Type: "api_error",
					Message: "upstream_response_invalid", RequestID: reqID}
			}
			typ, _ := probe["type"].(string)
			if typ == "ping" {
				continue
			}
			if typ == "error" {
				inner, _ := probe["error"].(map[string]any)
				t, _ := inner["type"].(string)
				m, _ := inner["message"].(string)
				status := 502
				if t == "overloaded_error" {
					status = 529
				}
				return &Error{Status: status, Code: "api_error", Type: or(t, "api_error"), Message: or(m, "upstream error"), RequestID: reqID}
			}
			if typ == "message_stop" {
				sawStop = true
			}
			if err := onEvent(json.RawMessage(data)); err != nil {
				return newErr(499, "client disconnected", "api_error", err.Error())
			}
			if sawStop {
				return nil
			}
		}
	}
}

func rateHeaders(h http.Header) map[string]string {
	out := map[string]string{}
	for k, v := range h {
		l := strings.ToLower(k)
		if len(v) > 0 && v[0] != "" && (strings.HasPrefix(l, "anthropic-ratelimit-") || l == "retry-after" || l == "request-id") {
			out[l] = v[0]
		}
	}
	return out
}

func or(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

func clip(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}

// ---- local_cli ----

type localProvider struct {
	cfg    *config.Resolved
	client *http.Client

	mu       sync.Mutex
	health   map[string]any
	healthAt time.Time
}

func newLocalProvider(cfg *config.Resolved) *localProvider {
	tr := &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		var d net.Dialer
		return d.DialContext(ctx, "unix", cfg.SocketPath)
	}, MaxIdleConnsPerHost: 32, IdleConnTimeout: 60 * time.Second}
	return &localProvider{cfg: cfg, client: &http.Client{Transport: tr}}
}

func (p *localProvider) Name() string { return "local_cli" }

func (p *localProvider) workerHealth(ctx context.Context) map[string]any {
	p.mu.Lock()
	if p.health != nil && time.Since(p.healthAt) < 2*time.Second {
		h := p.health
		p.mu.Unlock()
		return h
	}
	p.mu.Unlock()
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, "http://worker/internal/health", nil)
	req.Header.Set("X-Internal-Token", p.cfg.InternalToken)
	resp, err := p.client.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	var h map[string]any
	if json.NewDecoder(resp.Body).Decode(&h) != nil {
		return nil
	}
	p.mu.Lock()
	p.health, p.healthAt = h, time.Now()
	p.mu.Unlock()
	return h
}

func (p *localProvider) Ready(ctx context.Context) bool {
	h := p.workerHealth(ctx)
	if h == nil || h["healthy"] == false {
		return false
	}
	n, _ := h["ready_slots"].(float64)
	return n > 0
}

func (p *localProvider) Stream(ctx context.Context, c *Call, onEvent func(json.RawMessage) error) (*Result, *Error) {
	env := map[string]any{"body": c.Body, "stream": true, "request_id": c.RequestID, "delivery_mode": "realtime"}
	if c.RequestContext != nil {
		env["request_context"] = c.RequestContext
	}
	raw, _ := json.Marshal(env)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, "http://worker/internal/v1/messages", bytes.NewReader(raw))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Token", p.cfg.InternalToken)
	req.Header.Set("TE", "trailers")
	if c.Slot != "" {
		req.Header.Set("x-slot", c.Slot)
	}
	if c.Session != "" {
		req.Header.Set("x-claude-code-session-id", c.Session)
	}
	res := &Result{RateHeaders: map[string]string{}}
	if h := p.workerHealth(ctx); h != nil {
		if g, ok := h["generation"].(float64); ok {
			res.Generation = int64(g)
		}
		if pid, ok := h["cli_pid"].(float64); ok {
			res.PID = int64(pid)
		}
	}
	resp, err := p.client.Do(req)
	if err != nil {
		if ctx.Err() != nil {
			return res, newErr(499, "client disconnected", "api_error", "client disconnected")
		}
		return res, newErr(503, "kernel_unavailable", "api_error", "gateway worker unavailable: "+clip(err.Error(), 200))
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		data, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		var eb struct {
			Error struct {
				Type, Code, Message string
				RetryAfter          string `json:"retry_after"`
			} `json:"error"`
		}
		_ = json.Unmarshal(data, &eb)
		return res, &Error{Status: resp.StatusCode, Code: or(eb.Error.Code, "kernel_error"), Type: or(eb.Error.Type, "api_error"),
			Message: or(eb.Error.Message, resp.Status), RetryAfter: eb.Error.RetryAfter}
	}
	rd := sse.NewReader(resp.Body, int(p.cfg.MaxEvent))
	sawStop := false
	for {
		ev, err := rd.Next()
		if err != nil {
			if ctx.Err() != nil {
				return res, newErr(499, "client disconnected", "api_error", "client disconnected")
			}
			if sawStop {
				return res, nil
			}
			return res, newErr(502, "upstream_stream_incomplete", "api_error", "Anthropic message response is incomplete")
		}
		var probe map[string]any
		if json.Unmarshal(ev.Data, &probe) != nil {
			return res, newErr(502, "upstream_response_invalid", "api_error", "upstream_response_invalid")
		}
		switch probe["type"] {
		case "error":
			inner, _ := probe["error"].(map[string]any)
			e := &Error{Status: 502, Code: "api_error", Type: "api_error", Message: "upstream error"}
			if s, ok := inner["status"].(float64); ok && s >= 400 {
				e.Status = int(s)
			}
			if v, _ := inner["code"].(string); v != "" {
				e.Code = v
			}
			if v, _ := inner["type"].(string); v != "" {
				e.Type = v
			}
			if v, _ := inner["message"].(string); v != "" {
				e.Message = v
			}
			return res, e
		case "response_headers":
			if hm, ok := probe["headers"].(map[string]any); ok {
				for k, v := range hm {
					if s, ok := v.(string); ok {
						res.RateHeaders[strings.ToLower(k)] = s
					}
				}
			}
		case "message_stop":
			sawStop = true
		}
		if err := onEvent(json.RawMessage(ev.Data)); err != nil {
			return res, newErr(499, "client disconnected", "api_error", err.Error())
		}
	}
}

// ---- mock ----

type mockProvider struct{}

func (mockProvider) Name() string               { return "mock" }
func (mockProvider) Ready(context.Context) bool { return true }

func (mockProvider) Stream(ctx context.Context, c *Call, onEvent func(json.RawMessage) error) (*Result, *Error) {
	model, _ := c.Body["model"].(string)
	events := []string{
		fmt.Sprintf(`{"type":"message_start","message":{"id":"msg_mock","type":"message","role":"assistant","model":%q,"content":[],"stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":1,"output_tokens":0}}}`, model),
		`{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}`,
		`{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"mock response"}}`,
		`{"type":"content_block_stop","index":0}`,
		`{"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":2}}`,
		`{"type":"message_stop"}`,
	}
	if ms := config.EnvInt("SIMULATE_LATENCY_MS", 0); ms > 0 {
		select {
		case <-time.After(time.Duration(ms) * time.Millisecond):
		case <-ctx.Done():
			return nil, newErr(499, "client disconnected", "api_error", "client disconnected")
		}
	}
	for _, e := range events {
		if err := onEvent(json.RawMessage(e)); err != nil {
			return nil, newErr(499, "client disconnected", "api_error", err.Error())
		}
	}
	return &Result{RateHeaders: map[string]string{}, Generation: 1}, nil
}
