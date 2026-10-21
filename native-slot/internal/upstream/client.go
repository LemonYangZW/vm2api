package upstream

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
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"vm2api/native-slot/internal/frame"
	"vm2api/native-slot/internal/sse"
)

// EmptyStreamMessage 与官方 CLI 的文案一致。
const EmptyStreamMessage = "Stream ended without receiving any events"

// Client 持有进程内共享的上游连接池。
type Client struct {
	mu        sync.Mutex
	transport *http.Transport
	http      *http.Client
}

func proxyConfigured() bool {
	for _, k := range []string{"HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "ANTHROPIC_UNIX_SOCKET"} {
		if os.Getenv(k) != "" {
			return true
		}
	}
	return false
}

func apiTimeout() time.Duration {
	if v, err := strconv.Atoi(os.Getenv("API_TIMEOUT_MS")); err == nil && v > 0 {
		return time.Duration(v) * time.Millisecond
	}
	return 600 * time.Second
}

func newTransport() *http.Transport {
	t := &http.Transport{
		Proxy:                 http.ProxyFromEnvironment,
		DialContext:           (&net.Dialer{Timeout: 30 * time.Second, KeepAlive: 30 * time.Second}).DialContext,
		MaxIdleConns:          64,
		MaxIdleConnsPerHost:   32,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   15 * time.Second,
		ResponseHeaderTimeout: apiTimeout(),
		ExpectContinueTimeout: time.Second,
	}
	if sock := os.Getenv("ANTHROPIC_UNIX_SOCKET"); sock != "" {
		t.Proxy = nil
		t.DialContext = func(ctx context.Context, _, _ string) (net.Conn, error) {
			var d net.Dialer
			return d.DialContext(ctx, "unix", sock)
		}
	}
	// 无代理时走 HTTP/2；有代理或 Unix socket 时与官方一致退回 HTTP/1.1。
	t.ForceAttemptHTTP2 = !proxyConfigured()
	return t
}

func NewClient() *Client {
	c := &Client{}
	c.reset()
	return c
}

func (c *Client) reset() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.transport != nil {
		c.transport.CloseIdleConnections()
	}
	c.transport = newTransport()
	c.http = &http.Client{Transport: c.transport, CheckRedirect: func(*http.Request, []*http.Request) error {
		return http.ErrUseLastResponse
	}}
}

func (c *Client) client() *http.Client {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.http
}

// Failure 是上报给内核的错误字段。
type Failure struct {
	Error        string
	Code         string
	Status       int
	ErrorType    string
	RetryAfter   string
	UpstreamCode string
	RequestID    string
}

func (f *Failure) Frame(jobID, slotID string) frame.JobError {
	return frame.JobError{Type: "job_error", JobID: jobID, SlotID: slotID, Error: f.Error, Code: f.Code,
		Status: f.Status, ErrorType: f.ErrorType, RetryAfter: f.RetryAfter, UpstreamCode: f.UpstreamCode,
		RequestID: f.RequestID}
}

func clip(s string, n int) string {
	r := []rune(s)
	if len(r) > n {
		return string(r[:n])
	}
	return s
}

func field(v any, k string) any {
	m, _ := v.(map[string]any)
	if m == nil {
		return nil
	}
	return m[k]
}

func text(v any) string { s, _ := v.(string); return strings.TrimSpace(s) }

// FromAPIError 复刻 jobError.fromApiError。status 为 0 表示未知。
func FromAPIError(body any, status int, raw string, headers http.Header) *Failure {
	inner := field(body, "error")
	if inner == nil {
		inner = body
	}
	typ := text(field(inner, "type"))
	if status == 0 {
		if s, ok := field(inner, "status").(float64); ok && s >= 400 && s < 600 {
			status = int(s)
		}
	}
	if status == 0 {
		switch typ {
		case "rate_limit_error":
			status = 429
		case "authentication_error":
			status = 401
		case "permission_error":
			status = 403
		case "invalid_request_error":
			status = 400
		case "timeout_error":
			status = 504
		default:
			status = 502
		}
	}
	msg := text(field(inner, "message"))
	if msg == "" {
		msg = raw
	}
	if msg == "" {
		msg = fmt.Sprintf("upstream HTTP %d", status)
	}
	f := &Failure{Error: clip(msg, 300), Status: status}
	if headers != nil {
		f.RetryAfter = strings.TrimSpace(headers.Get("retry-after"))
		f.RequestID = strings.TrimSpace(headers.Get("request-id"))
	}
	if f.RetryAfter == "" {
		f.RetryAfter = text(field(inner, "retry_after"))
	}
	f.UpstreamCode = clip(text(field(inner, "code")), 100)
	if f.RequestID == "" {
		f.RequestID = text(field(inner, "request_id"))
	}
	if f.RequestID == "" {
		f.RequestID = text(field(body, "request_id"))
	}
	f.RequestID = clip(f.RequestID, 200)
	switch {
	case status == 529 || typ == "overloaded_error":
		f.Status, f.Code, f.ErrorType = 529, "upstream_overloaded", "overloaded_error"
	case status == 429:
		f.Code, f.ErrorType = "upstream_rate_limit", "rate_limit_error"
	case status == 401:
		f.Code, f.ErrorType = "upstream_auth_error", "authentication_error"
	case status == 403:
		f.Code, f.ErrorType = "upstream_auth_error", or(typ, "permission_error")
	case status == 408 || status == 504:
		f.Status, f.Code, f.ErrorType = 504, "upstream_timeout", "timeout_error"
	case status < 500:
		f.Code, f.ErrorType = "upstream_invalid_request", or(typ, "invalid_request_error")
	default:
		f.Code, f.ErrorType = "upstream_error", or(typ, "api_error")
	}
	return f
}

func or(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

var (
	staleHayRe    = regexp.MustCompile(`(?i)socket hang up|connection reset|other side closed|ECONNRESET|EPIPE|UND_ERR_SOCKET|ERR_STREAM_DESTROYED|ECONNREFUSED|broken pipe|use of closed network connection|unexpected EOF`)
	networkTextRe = regexp.MustCompile(`(?i)fetch failed|network|socket|terminated|other side closed|connection[ _](?:reset|refused|closed)|proxy|tunnel|ECONN\w+|ENOTFOUND|EAI_AGAIN|no such host|broken pipe|EOF|dial|tls`)
)

// IsStale 判定需要重建连接池的错误。
func IsStale(err error) bool { return err != nil && staleHayRe.MatchString(err.Error()) }

// classifyTransport 对应 classifyKinJobError 的网络与超时分支。
func classifyTransport(err error, sawEvent bool) *Failure {
	msg := clip(strings.TrimSpace(err.Error()), 300)
	var ne net.Error
	if errors.Is(err, context.DeadlineExceeded) || (errors.As(err, &ne) && ne.Timeout()) || strings.Contains(strings.ToLower(msg), "timeout") {
		return &Failure{Error: or(msg, "upstream timeout"), Code: "upstream_timeout", Status: 504, ErrorType: "timeout_error"}
	}
	if IsStale(err) || networkTextRe.MatchString(msg) || errors.As(err, &ne) {
		code := "upstream_network_error"
		if sawEvent {
			code = "upstream_stream_interrupted"
		}
		return &Failure{Error: or(msg, "upstream connection failed"), Code: code, Status: 502, ErrorType: "api_error"}
	}
	return &Failure{Error: or(msg, "cli error"), Code: "cli_error", Status: 502, ErrorType: "api_error"}
}

// PickRateLimitHeaders 只保留 anthropic-ratelimit-*、retry-after、request-id。
func PickRateLimitHeaders(h http.Header) map[string]string {
	out := map[string]string{}
	for k, v := range h {
		lower := strings.ToLower(k)
		if len(v) == 0 || v[0] == "" {
			continue
		}
		if strings.HasPrefix(lower, "anthropic-ratelimit-") || lower == "retry-after" || lower == "request-id" {
			out[lower] = v[0]
		}
	}
	return out
}

var forwardEvents = map[string]bool{
	"message_start": true, "message_delta": true, "message_stop": true,
	"content_block_start": true, "content_block_delta": true, "content_block_stop": true,
}

// StreamResult 是一次上游调用的结局。
type StreamResult struct {
	Headers  map[string]string
	Failure  *Failure // nil 表示成功
	SawEvent bool
	Stopped  bool
}

// Stream 发送请求并逐条回调上游事件。onEvent 返回错误会中止流。
func (c *Client) Stream(ctx context.Context, b *Built, maxEvent int, onEvent func(json.RawMessage) error) StreamResult {
	var res StreamResult
	if f := Preflight(b.Body); f != nil {
		res.Failure = f
		return res
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, BaseURL()+"/v1/messages?beta=true", bytes.NewReader(b.Body))
	if err != nil {
		res.Failure = &Failure{Error: "invalid upstream URL", Code: "cli_error", Status: 502, ErrorType: "api_error"}
		return res
	}
	req.Header = b.Header.Clone()
	resp, err := c.client().Do(req)
	if err != nil {
		if ctx.Err() != nil {
			return res
		}
		if IsStale(err) {
			c.reset()
		}
		res.Failure = classifyTransport(unwrapURL(err), false)
		return res
	}
	defer resp.Body.Close()
	res.Headers = PickRateLimitHeaders(resp.Header)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		data, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		var body any
		raw := ""
		if json.Unmarshal(data, &body) != nil {
			body = nil
			if t := strings.TrimSpace(string(data)); t != "" {
				raw = fmt.Sprintf("%d %s", resp.StatusCode, t)
			}
		} else {
			raw = fmt.Sprintf("%d %s", resp.StatusCode, strings.TrimSpace(string(data)))
		}
		res.Failure = FromAPIError(body, resp.StatusCode, raw, resp.Header)
		return res
	}
	r := sse.NewReader(resp.Body, maxEvent)
	for {
		ev, err := r.Next()
		if err != nil {
			if ctx.Err() != nil {
				return res
			}
			if err == io.EOF {
				if !res.SawEvent {
					res.Failure = &Failure{Error: EmptyStreamMessage, Code: "upstream_empty_stream", Status: 502, ErrorType: "api_error"}
				} else if !res.Stopped {
					res.Failure = &Failure{Error: "stream ended before message_stop", Code: "upstream_stream_interrupted", Status: 502, ErrorType: "api_error"}
				}
				return res
			}
			if IsStale(err) {
				c.reset()
			}
			if errors.Is(err, sse.ErrEventTooLarge) {
				res.Failure = &Failure{Error: err.Error(), Code: "cli_error", Status: 502, ErrorType: "api_error"}
				return res
			}
			res.Failure = classifyTransport(err, res.SawEvent)
			return res
		}
		data := bytes.TrimSpace(ev.Data)
		if len(data) == 0 || string(data) == "[DONE]" {
			continue
		}
		name := ev.Name
		if name == "" {
			var probe struct {
				Type string `json:"type"`
			}
			_ = json.Unmarshal(data, &probe)
			name = probe.Type
		}
		switch {
		case name == "ping":
			continue
		case name == "error":
			var body any
			if json.Unmarshal(data, &body) != nil {
				body = string(data)
			}
			res.Failure = FromAPIError(body, 0, "", resp.Header)
			return res
		case !forwardEvents[name]:
			continue
		}
		if !json.Valid(data) || data[0] != '{' {
			message := "Could not parse upstream SSE event"
			// Bun JSON.parse 在对象键未加引号时先期待对象结束；保留官方原始错误。
			if len(data) > 1 && data[0] == '{' {
				rest := bytes.TrimSpace(data[1:])
				if len(rest) > 0 && rest[0] != '"' && rest[0] != '}' {
					message = "JSON Parse error: Expected '}'"
				}
			}
			res.Failure = &Failure{Error: message, Code: "cli_error", Status: 502, ErrorType: "api_error"}
			return res
		}
		if name == "message_stop" {
			res.Stopped = true
		}
		if err := onEvent(json.RawMessage(data)); err != nil {
			if ctx.Err() == nil {
				res.Failure = &Failure{Error: clip(err.Error(), 300), Code: "cli_error", Status: 502, ErrorType: "api_error"}
			}
			return res
		}
		res.SawEvent = true
		if name == "message_stop" {
			return res
		}
	}
}

func unwrapURL(err error) error {
	var ue *url.Error
	if errors.As(err, &ue) && ue.Err != nil {
		return ue.Err
	}
	return err
}
