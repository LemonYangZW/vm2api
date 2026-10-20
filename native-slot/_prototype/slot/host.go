package slot

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

const betaBaseline = "claude-code-20250219,oauth-2025-04-20,interleaved-thinking-2025-05-14,thinking-token-count-2026-05-13,context-management-2025-06-27,prompt-caching-scope-2026-01-05,mid-conversation-system-2026-04-07,per-turn-control-2026-07-01,mid-conversation-tool-changes-2026-07-01,effort-2025-11-24"

type frameWriter struct {
	mu  sync.Mutex
	enc *json.Encoder
}

func (w *frameWriter) send(f Frame) error { w.mu.Lock(); defer w.mu.Unlock(); return w.enc.Encode(f) }

type hostJob struct {
	id     string
	cancel context.CancelFunc
	done   chan struct{}
}

// RunHost 只处理协议 v2，刷新令牌仍由控制面的唯一写入者负责。
func RunHost(ctx context.Context, in io.Reader, out io.Writer, c Config) error {
	if err := c.Defaults(); err != nil {
		return err
	}
	ctx, shutdown := context.WithCancel(ctx)
	defer shutdown()
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxIdleConns = 40
	transport.MaxIdleConnsPerHost = 20
	transport.MaxConnsPerHost = 20
	transport.ResponseHeaderTimeout = time.Duration(c.FirstByteTimeoutSeconds) * time.Second
	transport.ForceAttemptHTTP2 = true
	if c.ProxyURL != "" {
		p, err := url.Parse(c.ProxyURL)
		if err != nil || p.Host == "" || (p.Scheme != "http" && p.Scheme != "https" && p.Scheme != "socks5" && p.Scheme != "socks5h") {
			return errors.New("invalid proxy_url")
		}
		transport.Proxy = http.ProxyURL(p)
	}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	w := &frameWriter{enc: json.NewEncoder(out)}
	if err := w.send(Frame{Type: "host_ready", ProtocolVersion: 2, Slots: c.Slots, SystemLayout: "zero", Timezone: c.Timezone, Capabilities: []string{"multi_slot", "native_sse", "stateless", "ping", "classifier_request_context"}}); err != nil {
		return err
	}
	jobs := map[string]*hostJob{}
	var mu sync.Mutex
	var wg sync.WaitGroup
	defer func() { shutdown(); wg.Wait() }()
	for i := 0; i < c.Slots; i++ {
		jobs[slotID(i)] = nil
		if err := w.send(Frame{Type: "slot_ready", SlotID: slotID(i)}); err != nil {
			return err
		}
	}
	s := bufio.NewScanner(in)
	s.Buffer(make([]byte, 4096), int(c.MaxRequestBytes)+(1<<20))
	for s.Scan() {
		var f Frame
		if json.Unmarshal(s.Bytes(), &f) != nil {
			continue
		}
		switch f.Type {
		case "ping":
			if err := w.send(Frame{Type: "pong", Nonce: f.Nonce}); err != nil {
				return err
			}
		case "cancel":
			mu.Lock()
			var pending *hostJob
			for _, job := range jobs {
				if job != nil && job.id == f.JobID {
					pending = job
					job.cancel()
					break
				}
			}
			mu.Unlock()
			wg.Add(1)
			go func(f Frame, pending *hostJob) {
				defer wg.Done()
				if pending != nil {
					<-pending.done
				}
				_ = w.send(Frame{Type: "cancel_ack", JobID: f.JobID, SlotID: f.SlotID})
			}(f, pending)
		case "job_start":
			mu.Lock()
			current, exists := jobs[f.SlotID]
			duplicate := false
			for _, job := range jobs {
				if job != nil && job.id == f.JobID {
					duplicate = true
				}
			}
			if !exists || current != nil || duplicate || f.JobID == "" || f.Request == nil {
				mu.Unlock()
				_ = w.send(failure(f, 502, "cli_error", "api_error", "invalid or busy slot"))
				continue
			}
			if err := validateContext(f.RequestContext, f.Request); err != nil {
				mu.Unlock()
				_ = w.send(failure(f, 400, "invalid_request_context", "invalid_request_error", err.Error()))
				continue
			}
			jobCtx, cancel := context.WithCancel(ctx)
			job := &hostJob{id: f.JobID, cancel: cancel, done: make(chan struct{})}
			jobs[f.SlotID] = job
			mu.Unlock()
			wg.Add(1)
			go func(f Frame, job *hostJob) {
				defer wg.Done()
				defer job.cancel()
				terminal := runUpstream(jobCtx, client, transport, c, f, w)
				mu.Lock()
				if jobs[f.SlotID] == job {
					jobs[f.SlotID] = nil
				}
				mu.Unlock()
				// 终止帧发出前释放槽位，避免紧接着到达的新 job 被误判为 busy。
				if terminal.Type != "" {
					_ = w.send(terminal)
				}
				close(job.done)
			}(f, job)
		}
	}
	return s.Err()
}

func failure(f Frame, status int, code, kind, message string) Frame {
	return Frame{Type: "job_error", JobID: f.JobID, SlotID: f.SlotID, Status: status, Code: code, ErrorType: kind, Error: strptr(message)}
}

func readCredential(path string) (string, bool, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", false, errors.New("credential file unavailable")
	}
	defer f.Close()
	b, err := io.ReadAll(io.LimitReader(f, (1<<20)+1))
	if err != nil || len(b) > 1<<20 {
		return "", false, errors.New("invalid credential file")
	}
	var credentials map[string]any
	if json.Unmarshal(b, &credentials) != nil {
		return "", false, errors.New("invalid credential JSON")
	}
	if token := stringValue(object(credentials["claudeAiOauth"])["accessToken"]); token != "" {
		return token, true, nil
	}
	if key := stringValue(object(credentials["anthropicApiKey"])["apiKey"]); key != "" {
		return key, false, nil
	}
	return "", false, errors.New("credential contains no access token or API key")
}

func limitedHeaders(h http.Header) map[string]any {
	filtered := map[string]any{}
	for k := range h {
		lower := strings.ToLower(k)
		if strings.HasPrefix(lower, "anthropic-ratelimit-") || lower == "retry-after" || lower == "request-id" {
			filtered[lower] = h.Get(k)
		}
	}
	return filtered
}

func runUpstream(ctx context.Context, client *http.Client, transport *http.Transport, c Config, f Frame, w *frameWriter) (terminal Frame) {
	if c.RequestTimeoutSeconds > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, time.Duration(c.RequestTimeoutSeconds)*time.Second)
		defer cancel()
	}
	sendError := func(frame Frame) {
		if !errors.Is(ctx.Err(), context.Canceled) {
			terminal = frame
		}
	}
	token, oauth, err := readCredential(c.CredentialPath)
	if err != nil {
		sendError(failure(f, 401, "upstream_auth_error", "authentication_error", err.Error()))
		return
	}
	body, betas := prepareRequest(f.Request, c.DefaultCacheTTL)
	b, err := json.Marshal(body)
	if err != nil || int64(len(b)) > c.MaxRequestBytes {
		sendError(failure(f, 413, "upstream_invalid_request", "invalid_request_error", "request exceeds limit"))
		return
	}
	req, err := http.NewRequestWithContext(ctx, "POST", strings.TrimRight(c.AnthropicBaseURL, "/")+"/v1/messages", bytes.NewReader(b))
	if err != nil {
		sendError(failure(f, 502, "cli_error", "api_error", "invalid upstream URL"))
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")
	req.Header.Set("User-Agent", "claude-cli/"+c.CLIVersion+" (external, sdk-cli)")
	req.Header.Set("x-app", "cli")
	req.Header.Set("anthropic-version", "2023-06-01")
	if oauth {
		req.Header.Set("Authorization", "Bearer "+token)
	} else {
		req.Header.Set("x-api-key", token)
	}
	for k, v := range map[string]string{"lang": "js", "os": "Linux", "arch": "x64", "runtime": "node", "runtime-version": "v26.3.0", "package-version": "0.128.0", "retry-count": "0", "timeout": "600"} {
		req.Header.Set("x-stainless-"+k, v)
	}
	seen := map[string]bool{}
	all := []string{}
	for _, beta := range append(strings.Split(betaBaseline, ","), betas...) {
		if beta != "" && !seen[beta] {
			seen[beta] = true
			all = append(all, beta)
		}
	}
	req.Header.Set("anthropic-beta", strings.Join(all, ","))
	resp, err := client.Do(req)
	if err != nil {
		transport.CloseIdleConnections()
		status, code, kind := 502, "upstream_network_error", "api_error"
		if e, ok := err.(interface{ Timeout() bool }); ok && e.Timeout() {
			status, code, kind = 504, "upstream_timeout", "timeout_error"
		}
		sendError(failure(f, status, code, kind, "upstream request failed"))
		return
	}
	defer resp.Body.Close()
	headers := limitedHeaders(resp.Header)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		frame := mapUpstreamError(f, resp.StatusCode, resp.Body)
		frame.RetryAfter = stringValue(headers["retry-after"])
		frame.RequestID = truncate(stringValue(headers["request-id"]), 200)
		sendError(frame)
		return
	}
	if !strings.HasPrefix(strings.ToLower(resp.Header.Get("Content-Type")), "text/event-stream") {
		sendError(failure(f, 502, "upstream_error", "api_error", "upstream did not return SSE"))
		return
	}
	if err := w.send(Frame{Type: "stream_event", JobID: f.JobID, SlotID: f.SlotID, Event: map[string]any{"type": "response_headers", "headers": headers}}); err != nil {
		return
	}
	a := newAccumulation()
	var total int64
	streamErr := readSSE(resp.Body, c.MaxEventBytes, func(event map[string]any) error {
		if a.Stopped {
			return errors.New("event after message_stop")
		}
		data, _ := json.Marshal(event)
		total += int64(len(data))
		if total > c.MaxResponseBytes {
			return errors.New("response exceeds limit")
		}
		if event["type"] == "error" {
			errBody, _ := json.Marshal(event)
			frame := mapUpstreamError(f, 502, bytes.NewReader(errBody))
			sendError(frame)
			return errUpstreamEvent
		}
		a.add(event)
		if err := w.send(Frame{Type: "stream_event", JobID: f.JobID, SlotID: f.SlotID, Event: event}); err != nil {
			return err
		}
		if a.Stopped {
			return errSSEComplete
		}
		return nil
	})
	if errors.Is(ctx.Err(), context.Canceled) || errors.Is(streamErr, errUpstreamEvent) {
		return
	}
	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		sendError(failure(f, 504, "upstream_timeout", "timeout_error", "upstream request timed out"))
		return
	}
	if (streamErr != nil && !errors.Is(streamErr, errSSEComplete)) || !a.Stopped {
		transport.CloseIdleConnections()
		code := "upstream_stream_interrupted"
		if a.Events == 0 {
			code = "upstream_empty_stream"
		}
		sendError(failure(f, 502, code, "api_error", "upstream stream ended before completion"))
		return
	}
	terminal = Frame{Type: "job_done", JobID: f.JobID, SlotID: f.SlotID, StopReason: strptr(a.StopReason), Usage: a.Usage}
	return
}

var errUpstreamEvent = errors.New("upstream error event")
var errSSEComplete = errors.New("SSE message complete")

func truncate(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}

func mapUpstreamError(f Frame, status int, body io.Reader) Frame {
	var raw map[string]any
	b, _ := io.ReadAll(io.LimitReader(body, 64<<10))
	_ = json.Unmarshal(b, &raw)
	e := object(raw["error"])
	kind := stringValue(e["type"])
	code, outKind := "upstream_error", "api_error"
	switch {
	case status == 529 || kind == "overloaded_error":
		code, outKind = "upstream_overloaded", "overloaded_error"
		status = 529
	case status == 429:
		code, outKind = "upstream_rate_limit", "rate_limit_error"
	case status == 401:
		code, outKind = "upstream_auth_error", "authentication_error"
	case status == 403:
		code, outKind = "upstream_auth_error", kind
		if outKind == "" {
			outKind = "permission_error"
		}
	case status == 408 || status == 504:
		code, outKind = "upstream_timeout", "timeout_error"
	case status >= 400 && status < 500:
		code, outKind = "upstream_invalid_request", "invalid_request_error"
	}
	frame := failure(f, status, code, outKind, fmt.Sprintf("upstream returned %d (%s)", status, outKind))
	// 上游错误正文可能包含提示词或认证值，协议只带类型及诊断 ID。
	frame.UpstreamCode = truncate(stringValue(e["code"]), 100)
	return frame
}
