package slot

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

// 子进程走真实 stdin/stdout 管道和 HTTP 上游，不使用真实账号。
func TestHostProcess(t *testing.T) {
	if os.Getenv("NATIVE_SLOT_TEST_HELPER") != "1" {
		return
	}
	c, err := LoadConfig(os.Getenv("KIN_NATIVE_HOST_CONFIG"))
	if err != nil {
		os.Exit(21)
	}
	if err = RunHost(context.Background(), os.Stdin, os.Stdout, c); err != nil {
		os.Exit(22)
	}
	os.Exit(0)
}

type fixture struct {
	kernel      *Kernel
	server      *httptest.Server
	credentials string
}

func newFixture(t *testing.T, upstream http.HandlerFunc, modify func(*Config)) fixture {
	t.Helper()
	t.Setenv("NATIVE_SLOT_TEST_HELPER", "1")
	up := httptest.NewServer(upstream)
	t.Cleanup(up.Close)
	dir := t.TempDir()
	cred := filepath.Join(dir, "credentials.json")
	if err := os.WriteFile(cred, []byte(`{"claudeAiOauth":{"accessToken":"test-token","refreshToken":"never-send-this"}}`), 0600); err != nil {
		t.Fatal(err)
	}
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	c := Config{InternalToken: "local-test-only", ClaudeBin: exe, CredentialPath: cred, TestEndpoints: true, AnthropicBaseURL: up.URL, Timezone: "America/Chicago"}
	if modify != nil {
		modify(&c)
	}
	if err = c.Defaults(); err != nil {
		t.Fatal(err)
	}
	b, _ := json.Marshal(c)
	config := filepath.Join(dir, "kernel.json")
	if err = os.WriteFile(config, b, 0600); err != nil {
		t.Fatal(err)
	}
	k, err := NewKernel(context.Background(), c, KernelOptions{ConfigPath: config, HostArgs: []string{"-test.run=^TestHostProcess$"}, Stderr: io.Discard, HandshakeTimeout: 3 * time.Second, CancelTimeout: time.Second, RestartDelay: 10 * time.Millisecond})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(k.Close)
	server := httptest.NewServer(k)
	t.Cleanup(server.Close)
	return fixture{k, server, cred}
}

func (f fixture) post(path string, body any) (*http.Response, error) {
	b, _ := json.Marshal(body)
	r, _ := http.NewRequest("POST", f.server.URL+path, bytes.NewReader(b))
	r.Header.Set("x-kin-internal-token", "local-test-only")
	return (&http.Client{Timeout: 8 * time.Second}).Do(r)
}

func request(id string, stream bool) map[string]any {
	return map[string]any{"request_id": id, "stream": stream, "body": map[string]any{"model": id, "max_tokens": 10, "messages": []any{map[string]any{"role": "user", "content": id}}}}
}

func emitSSE(w http.ResponseWriter, events ...string) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("anthropic-ratelimit-requests-remaining", "99")
	w.Header().Set("request-id", "req-test")
	w.Header().Set("Set-Cookie", "private-value")
	for _, event := range events {
		fmt.Fprintf(w, "data: %s\r\n\r\n", event)
		w.(http.Flusher).Flush()
	}
}

func normalSSE(w http.ResponseWriter) {
	emitSSE(w,
		`{"type":"message_start","message":{"id":"msg_test","type":"message","role":"assistant","model":"test-model","content":[],"usage":{"input_tokens":4,"cache_read_input_tokens":2}}}`,
		`{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}`,
		`{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"你好"},"extra":"preserved"}`,
		`{"type":"content_block_stop","index":0}`,
		`{"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":2}}`,
		`{"type":"message_stop"}`)
}

func readResponse(t *testing.T, resp *http.Response, err error) []byte {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	b, e := io.ReadAll(resp.Body)
	if e != nil {
		t.Fatal(e)
	}
	return b
}

func TestJSONAndStreamContract(t *testing.T) {
	f := newFixture(t, func(w http.ResponseWriter, r *http.Request) { normalSSE(w) }, nil)
	resp, err := f.post("/internal/v1/messages", request("json", false))
	b := readResponse(t, resp, err)
	var body map[string]any
	if json.Unmarshal(b, &body) != nil || resp.StatusCode != 200 {
		t.Fatalf("bad response: %s", b)
	}
	if stringValue(object(array(body["content"])[0])["text"]) != "你好" || body["stop_reason"] != "end_turn" {
		t.Fatalf("bad message: %s", b)
	}
	if object(body["usage"])["input_tokens"] != float64(4) || object(body["usage"])["output_tokens"] != float64(2) {
		t.Fatalf("bad usage: %s", b)
	}
	if resp.Header.Get("x-terminal-state") != "verified" || strings.Contains(resp.Header.Get("x-rate-limit-headers"), "private-value") {
		t.Fatal("invalid metadata")
	}
	resp, err = f.post("/internal/v1/messages", request("stream", true))
	b = readResponse(t, resp, err)
	if resp.StatusCode != 200 || !bytes.Contains(b, []byte(`"extra":"preserved"`)) || bytes.Count(b, []byte(`"type":"message_stop"`)) != 1 {
		t.Fatalf("bad stream: %s", b)
	}
	if resp.Trailer.Get("x-terminal-state") != "verified" || !strings.Contains(resp.Trailer.Get("x-usage"), "cache_read_input_tokens") {
		t.Fatalf("bad trailers: %v", resp.Trailer)
	}
}

func TestTwentySlotsRejectOverflowAndCancelIsolation(t *testing.T) {
	started := make(chan string, 30)
	cancelled := make(chan string, 30)
	gate := make(chan struct{})
	f := newFixture(t, func(w http.ResponseWriter, r *http.Request) {
		var b map[string]any
		_ = json.NewDecoder(r.Body).Decode(&b)
		id := stringValue(b["model"])
		started <- id
		select {
		case <-gate:
			normalSSE(w)
		case <-r.Context().Done():
			cancelled <- id
		}
	}, nil)
	var once sync.Once
	t.Cleanup(func() { once.Do(func() { close(gate) }) })
	type result struct {
		id     string
		status int
		err    error
	}
	results := make(chan result, 20)
	for i := 0; i < 20; i++ {
		go func(i int) {
			id := fmt.Sprintf("r%d", i)
			resp, err := f.post("/internal/v1/messages", request(id, false))
			status := 0
			if err == nil {
				status = resp.StatusCode
				_, _ = io.Copy(io.Discard, resp.Body)
				_ = resp.Body.Close()
			}
			results <- result{id, status, err}
		}(i)
	}
	for i := 0; i < 20; i++ {
		select {
		case <-started:
		case <-time.After(4 * time.Second):
			t.Fatal("20 slots did not start")
		}
	}
	resp, err := f.post("/internal/v1/messages", request("overflow", false))
	b := readResponse(t, resp, err)
	if resp.StatusCode != 503 || !bytes.Contains(b, []byte("no_capacity")) {
		t.Fatalf("overflow: %d %s", resp.StatusCode, b)
	}
	resp, err = f.post("/internal/v1/cancel", map[string]any{"request_id": "r0"})
	readResponse(t, resp, err)
	select {
	case id := <-cancelled:
		if id != "r0" {
			t.Fatal("wrong job cancelled")
		}
	case <-time.After(3 * time.Second):
		t.Fatal("cancel did not close upstream")
	}
	select {
	case result := <-results:
		if result.id != "r0" || result.status != 504 || result.err != nil {
			t.Fatalf("cancel result: %+v", result)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("missing cancel acknowledgement")
	}
	select {
	case result := <-results:
		t.Fatalf("other slot interrupted: %+v", result)
	case <-time.After(50 * time.Millisecond):
	}
	once.Do(func() { close(gate) })
	for i := 0; i < 19; i++ {
		select {
		case r := <-results:
			if r.status != 200 || r.err != nil {
				t.Fatalf("other job: %+v", r)
			}
		case <-time.After(4 * time.Second):
			t.Fatal("remaining jobs stalled")
		}
	}
	resp, err = f.post("/internal/v1/messages", request("reuse", false))
	readResponse(t, resp, err)
	if resp.StatusCode != 200 {
		t.Fatal("slot not reusable after cancellation")
	}
}

func TestCredentialsReloadAndRequestPreservation(t *testing.T) {
	tokens := make(chan string, 3)
	bodies := make(chan map[string]any, 3)
	f := newFixture(t, func(w http.ResponseWriter, r *http.Request) {
		tokens <- r.Header.Get("Authorization")
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		bodies <- body
		if strings.Contains(r.Header.Get("Authorization"), "never-send") {
			t.Error("refresh token leaked")
		}
		if !strings.Contains(r.Header.Get("anthropic-beta"), "test-beta") {
			t.Error("missing request beta")
		}
		normalSSE(w)
	}, nil)
	for i := 0; i < 2; i++ {
		if i == 1 {
			if err := os.WriteFile(f.credentials, []byte(`{"claudeAiOauth":{"accessToken":"new-token"},"unknown":"preserved"}`), 0600); err != nil {
				t.Fatal(err)
			}
		}
		req := request(fmt.Sprintf("reload%d", i), false)
		body := object(req["body"])
		body["system"] = []any{"first", "second"}
		body["betas"] = []any{"test-beta"}
		body["wireBody"] = "remove"
		body["metadata"] = map[string]any{"user_id": "not-json-but-valid-metadata"}
		resp, err := f.post("/internal/v1/messages", req)
		readResponse(t, resp, err)
		if resp.StatusCode != 200 {
			t.Fatalf("request failed: %d", resp.StatusCode)
		}
		actual := <-bodies
		if actual["wireBody"] != nil || actual["betas"] != nil || fmt.Sprint(actual["system"]) != "[first second]" || len(array(actual["messages"])) != 1 {
			t.Fatalf("request altered: %v", actual)
		}
	}
	if <-tokens != "Bearer test-token" || <-tokens != "Bearer new-token" {
		t.Fatal("credentials were not reloaded")
	}
}

func TestUpstreamErrorsAndTruncation(t *testing.T) {
	for _, status := range []int{400, 401, 403, 408, 429, 500, 504, 529} {
		t.Run(fmt.Sprint(status), func(t *testing.T) {
			f := newFixture(t, func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Retry-After", "7")
				w.Header().Set("Request-Id", "req-error")
				w.WriteHeader(status)
				fmt.Fprint(w, `{"error":{"type":"test_error","code":"specific","message":"private-prompt"}}`)
			}, nil)
			resp, err := f.post("/internal/v1/messages", request("error", false))
			b := readResponse(t, resp, err)
			if resp.StatusCode != status || bytes.Contains(b, []byte("private-prompt")) || !bytes.Contains(b, []byte("req-error")) || resp.Header.Get("Retry-After") != "7" {
				t.Fatalf("wrong error: %d %s", resp.StatusCode, b)
			}
		})
	}
	f := newFixture(t, func(w http.ResponseWriter, r *http.Request) {
		emitSSE(w, `{"type":"message_start","message":{"id":"m","model":"m","usage":{}}}`)
	}, nil)
	resp, err := f.post("/internal/v1/messages", request("truncated", true))
	b := readResponse(t, resp, err)
	if bytes.Contains(b, []byte("message_stop")) || !bytes.Contains(b, []byte("upstream_stream_interrupted")) || resp.Trailer.Get("x-terminal-state") != "error" {
		t.Fatalf("truncated stream accepted: %s", b)
	}
}

func TestIdleCancellationAndHostRestart(t *testing.T) {
	f := newFixture(t, func(w http.ResponseWriter, r *http.Request) {
		var b map[string]any
		_ = json.NewDecoder(r.Body).Decode(&b)
		if b["model"] == "hang" {
			<-r.Context().Done()
			return
		}
		normalSSE(w)
	}, func(c *Config) { c.IdleTimeoutSeconds = 1 })
	resp, err := f.post("/internal/v1/messages", request("hang", false))
	b := readResponse(t, resp, err)
	if resp.StatusCode != 504 || !bytes.Contains(b, []byte("upstream_timeout")) {
		t.Fatalf("idle cancellation: %d %s", resp.StatusCode, b)
	}
	f.kernel.mu.Lock()
	g := f.kernel.gen
	f.kernel.mu.Unlock()
	_ = g.cmd.Process.Kill()
	deadline := time.Now().Add(4 * time.Second)
	for {
		f.kernel.mu.Lock()
		ready := f.kernel.gen != g && len(f.kernel.available) == 20
		f.kernel.mu.Unlock()
		if ready {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("host did not recover")
		}
		time.Sleep(10 * time.Millisecond)
	}
	resp, err = f.post("/internal/v1/messages", request("after-restart", false))
	readResponse(t, resp, err)
	if resp.StatusCode != 200 {
		t.Fatal("recovered host cannot serve")
	}
}

func TestReadyValidationAndRequiredTerminalTypes(t *testing.T) {
	c := Config{Slots: 1, Timezone: "test", SystemLayout: "zero"}
	good := `{"type":"host_ready","protocol_version":2,"slots":1,"system_layout":"zero","timezone":"test","capabilities":["multi_slot","native_sse","stateless"]}` + "\n" + `{"type":"slot_ready","slot_id":"s00"}` + "\n"
	for _, bad := range []string{strings.Replace(good, `"protocol_version":2`, `"protocol_version":1`, 1), strings.Replace(good, `"timezone":"test"`, `"timezone":"wrong"`, 1), strings.Replace(good, `"native_sse"`, `"wrong"`, 1), strings.Replace(good, `"slot_id":"s00"`, `"slot_id":"s20"`, 1)} {
		if validateReady(bufio.NewScanner(strings.NewReader(bad)), c) == nil {
			t.Fatal("bad handshake accepted")
		}
	}
	if err := validateReady(bufio.NewScanner(strings.NewReader(good)), c); err != nil {
		t.Fatal(err)
	}
	for _, line := range []string{`{"type":"job_done","stop_reason":123}`, `{"type":"job_error","error":{}}`} {
		var f Frame
		if json.Unmarshal([]byte(line), &f) == nil {
			t.Fatalf("invalid terminal type accepted: %s", line)
		}
	}
}

func TestClassifierCacheAndSSELimits(t *testing.T) {
	if validateContext(map[string]any{"purpose": "auto_mode_classifier", "format": "tool"}, map[string]any{}) == nil {
		t.Fatal("invalid classifier accepted")
	}
	if err := validateContext(map[string]any{"purpose": "auto_mode_classifier", "format": "xml", "stage": "fast"}, map[string]any{"messages": []any{map[string]any{"content": "<transcript>ok</transcript>"}}}); err != nil {
		t.Fatal(err)
	}
	var req map[string]any
	_ = json.Unmarshal([]byte(`{"system":[{"type":"text","text":"s","cache_control":{"type":"ephemeral"}}],"messages":[{"role":"assistant","content":[{"type":"thinking","thinking":"secret","signature":"unchanged","cache_control":{"type":"ephemeral"}}]}]}`), &req)
	prepared, _ := prepareRequest(req, "5m")
	if object(object(array(prepared["system"])[0])["cache_control"])["ttl"] != "5m" {
		t.Fatal("TTL default not applied")
	}
	thinking := object(array(object(array(prepared["messages"])[0])["content"])[0])
	if thinking["cache_control"] != nil || thinking["signature"] != "unchanged" {
		t.Fatal("thinking altered")
	}
	if readSSE(strings.NewReader("data: "+strings.Repeat("x", 100)+"\n\n"), 10, func(map[string]any) error { return nil }) == nil {
		t.Fatal("oversized SSE accepted")
	}
	var got map[string]any
	err := readSSE(strings.NewReader(": comment\r\ndata: {\r\ndata: \"type\":\"ping\"}\r\n\r\n"), 1024, func(e map[string]any) error { got = e; return nil })
	if err != nil || got["type"] != "ping" {
		t.Fatalf("multi-line SSE: %v %v", got, err)
	}
}

func TestInternalAuthenticationAndUnsupportedConfig(t *testing.T) {
	f := newFixture(t, func(w http.ResponseWriter, r *http.Request) { normalSSE(w) }, nil)
	resp, err := http.Get(f.server.URL + "/internal/health")
	readResponse(t, resp, err)
	if resp.StatusCode != 401 {
		t.Fatal("missing token accepted")
	}
	for _, c := range []Config{{Slots: 21}, {SystemLayout: "identity"}, {Dataplane: "cc"}, {AnthropicBaseURL: "http://example.invalid"}, {DefaultCacheTTL: "invalid"}, {ProxyRequired: true}} {
		if c.Defaults() == nil {
			t.Fatalf("unsupported config accepted: %+v", c)
		}
	}
}
