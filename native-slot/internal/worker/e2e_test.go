package worker

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"

	"vm2api/native-slot/internal/config"
)

// 端到端：真实 kernel worker + 真实 cli-node 子进程 + 本地 mock 上游，不访问外网。

var cliNodeBin string

func TestMain(m *testing.M) {
	if os.Getenv("FAKE_CRAG_CLI") == "1" {
		runFakeCragCLI()
		os.Exit(0)
	}
	if os.Getenv("FAKE_HOST_MODE") != "" {
		os.Exit(fakeHost())
	}
	// 隔离开发机上 Claude Code 自身的环境变量。
	for _, kv := range os.Environ() {
		k, _, _ := strings.Cut(kv, "=")
		if strings.HasPrefix(k, "CLAUDE_") || strings.HasPrefix(k, "ANTHROPIC_") || k == "HTTPS_PROXY" || k == "HTTP_PROXY" {
			os.Unsetenv(k)
		}
	}
	dir, err := os.MkdirTemp("", "native-slot-e2e")
	if err != nil {
		panic(err)
	}
	cliNodeBin = filepath.Join(dir, "cli-node")
	if runtime.GOOS == "windows" {
		cliNodeBin += ".exe"
	}
	build := exec.Command("go", "build", "-o", cliNodeBin, "../../cmd/cli-node")
	build.Stderr = os.Stderr
	if err := build.Run(); err != nil {
		panic(err)
	}
	code := m.Run()
	_ = os.RemoveAll(dir)
	os.Exit(code)
}

type captured struct {
	header http.Header
	body   map[string]any
	raw    string
}

type upstreamMock struct {
	*httptest.Server
	mu   sync.Mutex
	reqs []captured
	hang chan struct{}
}

func sseWrite(w http.ResponseWriter, f http.Flusher, typ, data string) {
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", typ, data)
	f.Flush()
}

func newUpstream(t *testing.T) *upstreamMock {
	u := &upstreamMock{hang: make(chan struct{})}
	u.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		var body map[string]any
		_ = json.Unmarshal(b, &body)
		u.mu.Lock()
		u.reqs = append(u.reqs, captured{header: r.Header.Clone(), body: body, raw: string(b)})
		u.mu.Unlock()
		model, _ := body["model"].(string)
		f := w.(http.Flusher)
		switch model {
		case "mock-429":
			w.Header().Set("retry-after", "7")
			w.Header().Set("request-id", "req_limit")
			w.Header().Set("content-type", "application/json")
			w.WriteHeader(429)
			_, _ = w.Write([]byte(`{"type":"error","error":{"type":"rate_limit_error","message":"slow down"}}`))
			return
		}
		w.Header().Set("content-type", "text/event-stream")
		w.Header().Set("anthropic-ratelimit-requests-remaining", "99")
		w.Header().Set("request-id", "req_ok")
		w.WriteHeader(200)
		sseWrite(w, f, "message_start", `{"type":"message_start","message":{"id":"msg_1","type":"message","role":"assistant","model":"`+model+`","content":[],"stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":10,"output_tokens":1}}}`)
		sseWrite(w, f, "ping", `{"type":"ping"}`)
		switch model {
		case "mock-hang":
			select {
			case <-u.hang:
			case <-r.Context().Done():
			}
			return
		case "mock-interrupt":
			hj, ok := w.(http.Hijacker)
			if ok {
				c, _, _ := hj.Hijack()
				_ = c.Close()
			}
			return
		case "mock-tool":
			sseWrite(w, f, "content_block_start", `{"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_1","name":"get","input":{}}}`)
			sseWrite(w, f, "content_block_delta", `{"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\"a\":"}}`)
			sseWrite(w, f, "content_block_delta", `{"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"1}"}}`)
			sseWrite(w, f, "content_block_stop", `{"type":"content_block_stop","index":0}`)
			sseWrite(w, f, "message_delta", `{"type":"message_delta","delta":{"stop_reason":"tool_use","stop_sequence":null},"usage":{"output_tokens":5}}`)
		default:
			sseWrite(w, f, "content_block_start", `{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}`)
			sseWrite(w, f, "content_block_delta", `{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"hello"}}`)
			sseWrite(w, f, "content_block_stop", `{"type":"content_block_stop","index":0}`)
			sseWrite(w, f, "message_delta", `{"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":3}}`)
		}
		sseWrite(w, f, "message_stop", `{"type":"message_stop"}`)
	}))
	t.Cleanup(func() {
		select {
		case <-u.hang:
		default:
			close(u.hang)
		}
		u.Close()
	})
	return u
}

func (u *upstreamMock) last(t *testing.T) captured {
	u.mu.Lock()
	defer u.mu.Unlock()
	if len(u.reqs) == 0 {
		t.Fatal("upstream received no request")
	}
	return u.reqs[len(u.reqs)-1]
}

type kernelFixture struct {
	rt     *Runtime
	srv    *httptest.Server
	cancel context.CancelFunc
	token  string
}

func i64(v int64) *int64 { return &v }

func startKernel(t *testing.T, up *upstreamMock, slots int64, bin string, args []string, env map[string]string) (*kernelFixture, error) {
	t.Helper()
	dir := t.TempDir()
	cred := filepath.Join(dir, "credentials.json")
	if err := os.WriteFile(cred, []byte(`{"type":"oauth","claudeAiOauth":{"accessToken":"test-token","refreshToken":"never-sent","expiresAt":4102444800000,"scopes":["user:inference","user:profile"]}}`), 0o600); err != nil {
		t.Fatal(err)
	}
	cfgPath := filepath.Join(dir, "kernel.json")
	cfgDoc := map[string]any{"vm_id": "vm-test", "socket_path": "/run/kin/kernel.sock", "internal_token": "tok",
		"credential_path": cred, "claude_bin": bin, "slots_per_worker": slots, "timezone": "Asia/Taipei",
		"default_cache_ttl": "1h", "provider": "local_cli", "dataplane": "wrap", "persona_preset": "zero", "cch_enabled": true}
	b, _ := json.Marshal(cfgDoc)
	if err := os.WriteFile(cfgPath, b, 0o600); err != nil {
		t.Fatal(err)
	}
	if up != nil {
		t.Setenv("ANTHROPIC_BASE_URL", up.URL)
	}
	for k, v := range env {
		t.Setenv(k, v)
	}
	cfg, err := config.Load(cfgPath)
	if err != nil {
		t.Fatal(err)
	}
	opts := DefaultOptions(cfg)
	opts.HostReady = 15 * time.Second
	if hostReadyOverride > 0 {
		opts.HostReady = hostReadyOverride
	}
	opts.WatchdogPeriod = 100 * time.Millisecond
	opts.Stderr = io.Discard
	if args != nil {
		opts.HostArgs = args
	}
	if v, ok := env["TEST_JOB_IDLE"]; ok {
		d, _ := time.ParseDuration(v)
		opts.JobIdle = d
	}
	if v, ok := env["TEST_CANCEL_ACK"]; ok {
		d, _ := time.ParseDuration(v)
		opts.CancelAck = d
	}
	ctx, cancel := context.WithCancel(context.Background())
	rt := New(ctx, cfg, opts)
	if err := rt.Start(); err != nil {
		cancel()
		return nil, err
	}
	srv := httptest.NewServer(rt)
	f := &kernelFixture{rt: rt, srv: srv, cancel: cancel, token: "tok"}
	t.Cleanup(func() { srv.Close(); cancel(); time.Sleep(50 * time.Millisecond) })
	return f, nil
}

func (k *kernelFixture) post(t *testing.T, path string, body any, hdr map[string]string) *http.Response {
	t.Helper()
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPost, k.srv.URL+path, strings.NewReader(string(b)))
	req.Header.Set("content-type", "application/json")
	req.Header.Set("x-kin-internal-token", k.token)
	for kk, v := range hdr {
		req.Header.Set(kk, v)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	return resp
}

func msgEnvelope(model string, stream bool) map[string]any {
	return map[string]any{"body": map[string]any{"model": model, "max_tokens": 64, "stream": stream,
		"messages": []any{map[string]any{"role": "user", "content": "hi there friend"}},
		"metadata": map[string]any{"user_id": `{"device_id":"","account_uuid":"","session_id":"6f1c2d3e-0000-4000-8000-000000000001"}`}},
		"stream": stream, "request_id": fmt.Sprintf("req-%d", time.Now().UnixNano())}
}

func readSSE(t *testing.T, resp *http.Response) []map[string]any {
	t.Helper()
	var events []map[string]any
	sc := bufio.NewScanner(resp.Body)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	for sc.Scan() {
		line := sc.Text()
		if d, ok := strings.CutPrefix(line, "data: "); ok {
			var ev map[string]any
			if err := json.Unmarshal([]byte(d), &ev); err != nil {
				t.Fatalf("bad SSE data %q", d)
			}
			events = append(events, ev)
		}
	}
	return events
}

func TestEndToEndStreamAndUpstreamShape(t *testing.T) {
	up := newUpstream(t)
	k, err := startKernel(t, up, 2, cliNodeBin, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	resp := k.post(t, "/internal/v1/messages", msgEnvelope("claude-sonnet-5-5", true), nil)
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(resp.Body)
		t.Fatalf("status %d: %s", resp.StatusCode, b)
	}
	events := readSSE(t, resp)
	var types []string
	for _, e := range events {
		types = append(types, e["type"].(string))
	}
	want := "message_start,content_block_start,content_block_delta,content_block_stop,message_delta,message_stop,response_headers"
	if strings.Join(types, ",") != want {
		t.Fatalf("event order = %v", types)
	}
	// 现网 realtime：成功时 trailer 只有 x-terminal-state: verified。
	if got := resp.Trailer.Get("X-Terminal-State"); got != "verified" {
		t.Errorf("X-Terminal-State trailer = %q", got)
	}
	for _, k := range []string{"X-Error-Code", "X-Event-Count", "X-Usage", "X-Model", "X-Stop-Reason"} {
		if resp.Trailer.Get(k) != "" {
			t.Errorf("unexpected trailer %s = %q", k, resp.Trailer.Get(k))
		}
	}
	if resp.Header.Get("Content-Type") != "text/event-stream" || resp.Header.Get("Cache-Control") != "" {
		t.Errorf("stream headers %v", resp.Header)
	}
	rh, _ := events[6]["headers"].(map[string]any)
	if rh["anthropic-ratelimit-requests-remaining"] != "99" || rh["request-id"] != "req_ok" {
		t.Errorf("response_headers = %v", rh)
	}

	c := up.last(t)
	h := c.header
	checks := map[string]string{
		"User-Agent": "claude-cli/2.1.296 (external, sdk-cli)", "x-app": "cli", "anthropic-version": "2023-06-01",
		"x-stainless-arch": "x64", "x-stainless-os": "Linux", "x-stainless-runtime-version": "v26.3.0",
		"x-stainless-package-version": "0.128.0", "x-stainless-retry-count": "0", "x-stainless-timeout": "600000",
		"Accept":        "application/json",
		"Authorization": "Bearer test-token", "x-claude-code-request-class": "subagent",
		"X-Claude-Code-Session-Id": "6f1c2d3e-0000-4000-8000-000000000001",
	}
	promptID := h.Get("x-claude-code-prompt-id")
	if !regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`).MatchString(promptID) || promptID == h.Get("X-Claude-Code-Session-Id") {
		t.Errorf("prompt ID 必须是请求 UUID，不能复用调用方 session: %q", promptID)
	}
	for k, v := range checks {
		if h.Get(k) != v {
			t.Errorf("header %s = %q, want %q", k, h.Get(k), v)
		}
	}
	if h.Get("x-api-key") != "" {
		t.Error("x-api-key must not be sent for OAuth credentials")
	}
	beta := h.Get("anthropic-beta")
	if !strings.HasPrefix(beta, "claude-code-20250219,oauth-2025-04-20,interleaved-thinking-2025-05-14,thinking-token-count-2026-05-13,context-management-2025-06-27,prompt-caching-scope-2026-01-05,mid-conversation-system-2026-04-07,per-turn-control-2026-07-01,mid-conversation-tool-changes-2026-07-01") ||
		strings.Contains(beta, "extended-cache-ttl-2025-04-11") {
		t.Errorf("anthropic-beta = %s", beta)
	}
	body := c.body
	if _, ok := body["wireMessages"]; ok {
		t.Error("wireMessages leaked upstream")
	}
	if body["stream"] != true || body["max_tokens"] != float64(64) {
		t.Errorf("stream/max_tokens = %v/%v", body["stream"], body["max_tokens"])
	}
	sys, _ := body["system"].([]any)
	if len(sys) != 2 {
		t.Fatalf("system = %v", body["system"])
	}
	billing := sys[0].(map[string]any)["text"].(string)
	if !strings.HasPrefix(billing, "x-anthropic-billing-header: cc_version=2.1.296.") || strings.Contains(billing, "cch=00000") ||
		!strings.Contains(billing, "cc_entrypoint=cli;") || !strings.Contains(billing, "cc_prompt_id="+promptID+";") ||
		!strings.HasSuffix(billing, "prompt_version=<You are a Claude agent, built on Anthropic's Claude Agent SDK.>") {
		t.Errorf("billing block = %q", billing)
	}
	env := sys[1].(map[string]any)
	if env["text"] != "# Environment\n - Timezone: Asia/Taipei" {
		t.Errorf("environment block = %v", env["text"])
	}
	if cc, _ := env["cache_control"].(map[string]any); cc["ttl"] != nil || cc["type"] != "ephemeral" {
		t.Errorf("environment cache_control = %v", env["cache_control"])
	}
	md, _ := body["metadata"].(map[string]any)
	var uid map[string]any
	_ = json.Unmarshal([]byte(md["user_id"].(string)), &uid)
	if uid["session_id"] != "6f1c2d3e-0000-4000-8000-000000000001" || len(uid["device_id"].(string)) != 64 {
		t.Errorf("metadata.user_id = %v", md["user_id"])
	}
	if !strings.HasPrefix(c.raw, `{"model":"claude-sonnet-5-5","messages":[{"content":"hi there friend","role":"user"}],"system":`) {
		t.Errorf("body key order: %.120s", c.raw)
	}
	// 新版本 queryModel 为每个请求生成独立的 prompt ID。
	second := k.post(t, "/internal/v1/messages", msgEnvelope("claude-sonnet-5-5", true), nil)
	_ = readSSE(t, second)
	if next := up.last(t).header.Get("x-claude-code-prompt-id"); next == promptID || next == "" {
		t.Errorf("不同请求复用了 prompt ID: %q -> %q", promptID, next)
	}
}

// 控制面传入的官方两段 system 没有计费头；宿主不得重写身份、时区或断点。
func TestEndToEndOfficialSystemPassthrough(t *testing.T) {
	up := newUpstream(t)
	k, err := startKernel(t, up, 1, cliNodeBin, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	env := msgEnvelope("claude-sonnet-5-5", false)
	body := env["body"].(map[string]any)
	system := []any{
		map[string]any{"type": "text", "text": "You are Claude Code, Anthropic's official CLI for Claude.", "cache_control": map[string]any{"type": "ephemeral", "ttl": "5m"}},
		map[string]any{"type": "text", "text": "调用方提示\n# Environment\n - Timezone: Pacific/Auckland", "cache_control": map[string]any{"type": "ephemeral", "ttl": "5m"}},
	}
	body["system"] = system
	body["auto_compact_window"] = 200000
	body["messages"] = []any{
		map[string]any{"role": "user", "content": []any{map[string]any{"type": "text", "text": "hi", "cache_control": map[string]any{"type": "ephemeral", "ttl": "5m"}}}},
		map[string]any{"role": "system", "content": "保留会话内提醒"},
	}
	resp := k.post(t, "/internal/v1/messages", env, nil)
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)
	if resp.StatusCode != 200 {
		t.Fatalf("status %d", resp.StatusCode)
	}
	got := up.last(t).body
	wantSystem, _ := json.Marshal(system)
	gotSystem, _ := json.Marshal(got["system"])
	if string(gotSystem) != string(wantSystem) {
		t.Errorf("system = %s, want %s", gotSystem, wantSystem)
	}
	if _, ok := got["auto_compact_window"]; ok {
		t.Error("auto_compact_window leaked upstream")
	}
	msgs := got["messages"].([]any)
	if msgs[1].(map[string]any)["content"] != "保留会话内提醒" {
		t.Errorf("system message = %v", msgs[1])
	}
}

func TestEndToEndNonStreamToolAssembly(t *testing.T) {
	up := newUpstream(t)
	k, err := startKernel(t, up, 2, cliNodeBin, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	resp := k.post(t, "/internal/v1/messages", msgEnvelope("mock-tool", false), nil)
	defer resp.Body.Close()
	var msg map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&msg)
	if resp.StatusCode != 200 || resp.Header.Get("x-terminal-state") != "verified" {
		t.Fatalf("status %d state %q body %v", resp.StatusCode, resp.Header.Get("x-terminal-state"), msg)
	}
	content := msg["content"].([]any)
	tool := content[0].(map[string]any)
	if tool["type"] != "tool_use" || tool["input"].(map[string]any)["a"] != float64(1) || msg["stop_reason"] != "tool_use" {
		t.Errorf("assembled = %v", msg)
	}
	// 现网非流式成功只带 content-type、x-terminal-state、content-length。
	for k := range resp.Header {
		if k != "Content-Type" && k != "X-Terminal-State" && k != "Content-Length" && k != "Date" {
			t.Errorf("unexpected header %s: %v", k, resp.Header[k])
		}
	}
}

func TestEndToEndErrorsAndCapacity(t *testing.T) {
	up := newUpstream(t)
	k, err := startKernel(t, up, 1, cliNodeBin, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	// G14：缺令牌。
	req, _ := http.NewRequest(http.MethodPost, k.srv.URL+"/internal/v1/messages", strings.NewReader("{}"))
	resp, _ := http.DefaultClient.Do(req)
	var eb map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&eb)
	resp.Body.Close()
	if resp.StatusCode != 401 || eb["error"].(map[string]any)["code"] != "internal_auth_failed" {
		t.Errorf("auth: %d %v", resp.StatusCode, eb)
	}
	// G15：request_id 为数字。
	resp = k.post(t, "/internal/v1/cancel", map[string]any{"request_id": 5}, nil)
	resp.Body.Close()
	if resp.StatusCode != 400 {
		t.Errorf("cancel numeric request_id status %d", resp.StatusCode)
	}
	// G16：未注册路径。
	resp = k.post(t, "/internal/v1/nope", map[string]any{}, nil)
	resp.Body.Close()
	if resp.StatusCode != 404 {
		t.Errorf("unknown route status %d", resp.StatusCode)
	}
	// G4/G8：校验失败。
	bad := msgEnvelope("claude-sonnet-5-5", true)
	bad["body"].(map[string]any)["max_tokens"] = 0
	resp = k.post(t, "/internal/v1/messages", bad, nil)
	resp.Body.Close()
	if resp.StatusCode != 400 {
		t.Errorf("max_tokens=0 status %d", resp.StatusCode)
	}
	// 上游 429，非流式 → 原样状态码的 JSON 错误，带 retry_after / request_id。
	resp = k.post(t, "/internal/v1/messages", msgEnvelope("mock-429", false), nil)
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	wantJSON := `{"ok":false,"error":{"type":"rate_limit_error","code":"upstream_rate_limit","message":"slow down","status":429,"retry_after":"7","request_id":"req_limit"}}`
	if resp.StatusCode != 429 || string(raw) != wantJSON || resp.Header.Get("Retry-After") != "7" ||
		resp.Header.Get("Request-Id") != "req_limit" || resp.Header.Get("X-Error-Code") != "" {
		t.Errorf("429 json: %d %s %v", resp.StatusCode, raw, resp.Header)
	}
	// 流式 → 现网先提交 200，错误以 error 事件结束（键名排序，缺省字段为 null）。
	resp = k.post(t, "/internal/v1/messages", msgEnvelope("mock-429", true), nil)
	raw, _ = io.ReadAll(resp.Body)
	resp.Body.Close()
	wantSSE := "event: error\ndata: " + `{"error":{"code":"upstream_rate_limit","message":"slow down","request_id":"req_limit","retry_after":"7","status":429,"type":"rate_limit_error","upstream_code":null},"type":"error"}` + "\n\n"
	if resp.StatusCode != 200 || !strings.HasSuffix(string(raw), wantSSE) ||
		resp.Trailer.Get("X-Terminal-State") != "incomplete" || resp.Trailer.Get("X-Error-Code") != "upstream_rate_limit" {
		t.Errorf("429 stream: %d %q %v", resp.StatusCode, raw, resp.Trailer)
	}
	// 流中断：已收到事件后断开 → upstream_stream_interrupted（以 SSE error 事件结束）。
	resp = k.post(t, "/internal/v1/messages", msgEnvelope("mock-interrupt", true), nil)
	events := readSSE(t, resp)
	resp.Body.Close()
	lastEv := events[len(events)-1]
	if lastEv["type"] != "error" || lastEv["error"].(map[string]any)["code"] != "upstream_stream_interrupted" {
		t.Errorf("interrupt: %v", events)
	}
	if resp.Trailer.Get("X-Terminal-State") != "incomplete" || resp.Trailer.Get("X-Error-Code") != "upstream_stream_interrupted" {
		t.Errorf("interrupt trailers %v", resp.Trailer)
	}
	// E2：唯一槽位被挂起的请求占用时返回 503 no_capacity；取消后槽位恢复。
	hang := msgEnvelope("mock-hang", true)
	hangID := hang["request_id"].(string)
	hresp := k.post(t, "/internal/v1/messages", hang, nil)
	done := make(chan []map[string]any, 1)
	go func() { done <- readSSE(t, hresp) }()
	time.Sleep(300 * time.Millisecond)
	resp = k.post(t, "/internal/v1/messages", msgEnvelope("claude-sonnet-5-5", true), nil)
	eb = nil
	_ = json.NewDecoder(resp.Body).Decode(&eb)
	resp.Body.Close()
	if resp.StatusCode != 503 || eb["error"].(map[string]any)["code"] != "no_capacity" {
		t.Errorf("capacity: %d %v", resp.StatusCode, eb)
	}
	h := k.rt.Health()
	if h["ready_slots"] != 0 || h["closed_slots"] != 0 {
		t.Errorf("health while busy: %v", h)
	}
	resp = k.post(t, "/internal/v1/cancel", map[string]any{"request_id": hangID}, nil)
	var cr map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&cr)
	resp.Body.Close()
	if cr["ok"] != true {
		t.Errorf("cancel response %v", cr)
	}
	select {
	case <-done:
	case <-time.After(10 * time.Second):
		t.Fatal("cancelled stream did not end")
	}
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		if k.rt.Health()["ready_slots"] == 1 {
			break
		}
		time.Sleep(50 * time.Millisecond)
	}
	resp = k.post(t, "/internal/v1/messages", msgEnvelope("claude-sonnet-5-5", false), nil)
	resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Errorf("slot not recovered after cancel: %d", resp.StatusCode)
	}
}

func TestEndToEndConcurrentSlots(t *testing.T) {
	up := newUpstream(t)
	k, err := startKernel(t, up, 4, cliNodeBin, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	var wg sync.WaitGroup
	errs := make(chan error, 20)
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for attempt := 0; attempt < 50; attempt++ {
				resp := k.post(t, "/internal/v1/messages", msgEnvelope("claude-sonnet-5-5", true), nil)
				if resp.StatusCode == 503 {
					resp.Body.Close()
					time.Sleep(20 * time.Millisecond)
					continue
				}
				events := readSSE(t, resp)
				resp.Body.Close()
				if resp.StatusCode != 200 || len(events) != 7 {
					errs <- fmt.Errorf("status %d events %d", resp.StatusCode, len(events))
				}
				return
			}
			errs <- fmt.Errorf("never got capacity")
		}()
	}
	wg.Wait()
	close(errs)
	for e := range errs {
		t.Error(e)
	}
	// 最后几个 job 的槽位在 cancel_ack 往返后才归还，稍等再判泄漏。
	deadline := time.Now().Add(3 * time.Second)
	for k.rt.Health()["ready_slots"] != 4 && time.Now().Before(deadline) {
		time.Sleep(20 * time.Millisecond)
	}
	if h := k.rt.Health(); h["ready_slots"] != 4 {
		t.Errorf("slot leak: %v", h)
	}
}

// 新版 CLI 保留整次请求均省略 TTL 的形状；出现显式 TTL 时才补全缺失值。
func TestCallerCacheMarkersFollowExplicitTTL(t *testing.T) {
	up := newUpstream(t)
	k, err := startKernel(t, up, 1, cliNodeBin, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, c := range []struct {
		name     string
		explicit any
		want     []string
	}{
		{"missing ttl stays omitted", nil, []string{"", ""}},
		{"explicit 5m wins", "5m", []string{"5m", "5m"}},
	} {
		t.Run(c.name, func(t *testing.T) {
			second := map[string]any{"type": "ephemeral"}
			if c.explicit != nil {
				second["ttl"] = c.explicit
			}
			env := msgEnvelope("claude-sonnet-5-5", false)
			env["body"].(map[string]any)["messages"] = []any{map[string]any{"role": "user", "content": []any{
				map[string]any{"type": "text", "text": "doc one", "cache_control": map[string]any{"type": "ephemeral"}},
				map[string]any{"type": "text", "text": "doc two", "cache_control": second},
				map[string]any{"type": "text", "text": "question"},
			}}}
			// 单槽在 cancel_ack 回收前返回 503，稍等重试。
			var resp *http.Response
			for i := 0; i < 50; i++ {
				resp = k.post(t, "/internal/v1/messages", env, nil)
				io.Copy(io.Discard, resp.Body)
				resp.Body.Close()
				if resp.StatusCode != 503 {
					break
				}
				time.Sleep(40 * time.Millisecond)
			}
			if resp.StatusCode != 200 {
				t.Fatalf("status %d", resp.StatusCode)
			}
			msgs, _ := up.last(t).body["messages"].([]any)
			blocks := msgs[0].(map[string]any)["content"].([]any)
			for i, want := range c.want {
				cc, _ := blocks[i].(map[string]any)["cache_control"].(map[string]any)
				if (want == "" && cc["ttl"] != nil) || (want != "" && cc["ttl"] != want) {
					t.Errorf("block %d cache_control = %v, want ttl %s", i, cc, want)
				}
			}
		})
	}
}

// 非法请求在本地 400，上游一次都不调用；同一槽位随后的合法请求照常放行。
func TestPreflightKeepsInvalidRequestsOffUpstream(t *testing.T) {
	up := newUpstream(t)
	k, err := startKernel(t, up, 1, cliNodeBin, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	post := func(env map[string]any) (int, map[string]any) {
		var resp *http.Response
		for i := 0; i < 50; i++ {
			resp = k.post(t, "/internal/v1/messages", env, nil)
			if resp.StatusCode != 503 {
				break
			}
			resp.Body.Close()
			time.Sleep(40 * time.Millisecond)
		}
		defer resp.Body.Close()
		var eb map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&eb)
		return resp.StatusCode, eb
	}
	count := func() int { up.mu.Lock(); defer up.mu.Unlock(); return len(up.reqs) }
	for _, c := range []struct {
		name     string
		messages []any
	}{
		{"orphan tool_result", []any{map[string]any{"role": "user", "content": []any{
			map[string]any{"type": "tool_result", "tool_use_id": "toolu_x", "content": "ok"}}}}},
		{"bad cache ttl", []any{map[string]any{"role": "user", "content": []any{
			map[string]any{"type": "text", "text": "x", "cache_control": map[string]any{"type": "ephemeral", "ttl": "10m"}}}}}},
	} {
		t.Run(c.name, func(t *testing.T) {
			before := count()
			env := msgEnvelope("claude-sonnet-5-5", false)
			env["body"].(map[string]any)["messages"] = c.messages
			status, eb := post(env)
			inner, _ := eb["error"].(map[string]any)
			if status != 400 || inner["code"] != "upstream_invalid_request" || inner["type"] != "invalid_request_error" {
				t.Errorf("status %d body %v", status, eb)
			}
			if n := count() - before; n != 0 {
				t.Fatalf("invalid request reached upstream %d time(s)", n)
			}
		})
	}
	before := count()
	if status, eb := post(msgEnvelope("claude-sonnet-5-5", false)); status != 200 {
		t.Fatalf("valid request after reject: %d %v", status, eb)
	}
	if count()-before != 1 {
		t.Errorf("valid request upstream calls = %d", count()-before)
	}
}

// 现网实测（oracle kin-03，2026-10-20）：槽位满时等待 SUBMIT_WAIT_MS，期间有槽位
// 空出就接着执行；等满仍无槽位返回 503 no_capacity；0 表示不等。
func TestSubmitWaitQueuesUntilSlotFrees(t *testing.T) {
	up := newUpstream(t)
	for _, c := range []struct {
		name    string
		wait    string
		release bool
		status  int
		min     time.Duration
		max     time.Duration
	}{
		{"slot frees within wait", "5000", true, 200, 500 * time.Millisecond, 4 * time.Second},
		{"wait expires", "800", false, 503, 700 * time.Millisecond, 3 * time.Second},
		{"zero means no wait", "0", false, 503, 0, 300 * time.Millisecond},
	} {
		t.Run(c.name, func(t *testing.T) {
			k, err := startKernel(t, up, 1, cliNodeBin, nil, map[string]string{"SUBMIT_WAIT_MS": c.wait})
			if err != nil {
				t.Fatal(err)
			}
			hang := msgEnvelope("mock-hang", true)
			hresp := k.post(t, "/internal/v1/messages", hang, nil)
			go func() { io.Copy(io.Discard, hresp.Body); hresp.Body.Close() }()
			time.Sleep(200 * time.Millisecond)
			if c.release {
				time.AfterFunc(700*time.Millisecond, func() {
					r := k.post(t, "/internal/v1/cancel", map[string]any{"request_id": hang["request_id"]}, nil)
					r.Body.Close()
				})
			}
			start := time.Now()
			resp := k.post(t, "/internal/v1/messages", msgEnvelope("claude-sonnet-5-5", false), nil)
			var eb map[string]any
			_ = json.NewDecoder(resp.Body).Decode(&eb)
			resp.Body.Close()
			took := time.Since(start)
			if resp.StatusCode != c.status || took < c.min || took > c.max {
				t.Fatalf("status %d after %v (want %d in [%v,%v]) body %v", resp.StatusCode, took, c.status, c.min, c.max, eb)
			}
			if c.status == 503 && eb["error"].(map[string]any)["code"] != "no_capacity" {
				t.Errorf("body %v", eb)
			}
			if !c.release {
				r := k.post(t, "/internal/v1/cancel", map[string]any{"request_id": hang["request_id"]}, nil)
				r.Body.Close()
			}
		})
	}
}
