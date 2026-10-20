package api

import (
	"bufio"
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

	"vm2api/native-slot/internal/config"
)

type upstream struct {
	*httptest.Server
	mu      sync.Mutex
	headers []http.Header
	bodies  []map[string]any
}

func newUpstream(t *testing.T) *upstream {
	u := &upstream{}
	u.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		u.mu.Lock()
		u.headers = append(u.headers, r.Header.Clone())
		u.bodies = append(u.bodies, body)
		u.mu.Unlock()
		model, _ := body["model"].(string)
		f := w.(http.Flusher)
		w.Header().Set("content-type", "text/event-stream")
		w.WriteHeader(200)
		send := func(s string) { fmt.Fprintf(w, "data: %s\n\n", s); f.Flush() }
		if model == "bad-json" {
			send(`{not json`)
			return
		}
		if model == "slow" {
			time.Sleep(1500 * time.Millisecond)
		}
		send(`{"type":"message_start","message":{"id":"m","type":"message","role":"assistant","model":"` + model + `","content":[],"usage":{"input_tokens":10,"output_tokens":0}}}`)
		send(`{"type":"content_block_start","index":0,"content_block":{"type":"thinking","thinking":""}}`)
		send(`{"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"hmm"}}`)
		send(`{"type":"content_block_stop","index":0}`)
		send(`{"type":"content_block_start","index":1,"content_block":{"type":"text","text":""}}`)
		send(`{"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"hi"}}`)
		send(`{"type":"content_block_stop","index":1}`)
		send(`{"type":"message_delta","delta":{"stop_reason":"max_tokens"},"usage":{"output_tokens":20}}`)
		send(`{"type":"message_stop"}`)
	}))
	t.Cleanup(u.Close)
	return u
}

func (u *upstream) last() (http.Header, map[string]any) {
	u.mu.Lock()
	defer u.mu.Unlock()
	return u.headers[len(u.headers)-1], u.bodies[len(u.bodies)-1]
}

func setup(t *testing.T, provider string, cred string, mut func(*config.Config)) (*httptest.Server, *upstream, string) {
	t.Helper()
	for _, kv := range os.Environ() {
		k, _, _ := strings.Cut(kv, "=")
		if strings.HasPrefix(k, "CLAUDE_") || strings.HasPrefix(k, "ANTHROPIC_") || k == "PROVIDER" {
			t.Setenv(k, "")
			os.Unsetenv(k)
		}
	}
	up := newUpstream(t)
	dir := t.TempDir()
	credPath := filepath.Join(dir, "credentials.json")
	if cred != "" {
		if err := os.WriteFile(credPath, []byte(cred), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	t.Setenv("ENVELOPE_PATH", filepath.Join(dir, "envelope.json"))
	t.Setenv("ANTHROPIC_API_KEY", "env-key")
	c := config.Config{VMID: "vm", InternalToken: "tok", Provider: provider, CredentialPath: credPath,
		AnthropicBaseURL: up.URL, TestEndpoints: true}
	if mut != nil {
		mut(&c)
	}
	r, err := config.Resolve(c)
	if err != nil {
		t.Fatal(err)
	}
	s, err := New(r)
	if err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewServer(s)
	t.Cleanup(srv.Close)
	return srv, up, credPath
}

func post(t *testing.T, url string, body string, hdr map[string]string) (*http.Response, map[string]any) {
	t.Helper()
	req, _ := http.NewRequest(http.MethodPost, url, strings.NewReader(body))
	for k, v := range hdr {
		req.Header.Set(k, v)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	if strings.HasPrefix(resp.Header.Get("content-type"), "text/event-stream") {
		return resp, nil
	}
	defer resp.Body.Close()
	var out map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&out)
	return resp, out
}

const okBody = `{"model":"claude-sonnet-5-5","max_tokens":32,"messages":[{"role":"user","content":"hi"}]}`

func TestRoutesAndValidation(t *testing.T) {
	srv, _, _ := setup(t, "mock", "", nil)
	for _, p := range []string{"/healthz", "/readyz", "/status"} {
		resp, err := http.Get(srv.URL + p)
		if err != nil || resp.StatusCode != 200 {
			t.Errorf("%s: %v %v", p, err, resp)
		}
	}
	if resp, _ := http.Get(srv.URL + "/nope"); resp.StatusCode != 404 {
		t.Errorf("unknown route %d", resp.StatusCode)
	}
	many := make([]string, 1025)
	for i := range many {
		many[i] = `{"role":"user","content":"x"}`
	}
	tools := make([]string, 129)
	for i := range tools {
		tools[i] = fmt.Sprintf(`{"name":"t%d","input_schema":{}}`, i)
	}
	cases := map[string]string{
		"missing messages": `{"model":"m","max_tokens":1}`,
		"too many":         `{"model":"m","max_tokens":1,"messages":[` + strings.Join(many, ",") + `]}`,
		"too many tools":   `{"model":"m","max_tokens":1,"messages":[{"role":"user","content":"x"}],"tools":[` + strings.Join(tools, ",") + `]}`,
		"dup tools":        `{"model":"m","max_tokens":1,"messages":[{"role":"user","content":"x"}],"tools":[{"name":"a"},{"name":"a"}]}`,
		"empty tool":       `{"model":"m","max_tokens":1,"messages":[{"role":"user","content":"x"}],"tools":[{"name":""}]}`,
		"max_tokens 0":     `{"model":"m","max_tokens":0,"messages":[{"role":"user","content":"x"}]}`,
		"long model":       `{"model":"` + strings.Repeat("m", 129) + `","max_tokens":1,"messages":[{"role":"user","content":"x"}]}`,
	}
	for name, body := range cases {
		resp, out := post(t, srv.URL+"/v1/messages", body, nil)
		if resp.StatusCode != 400 || out["type"] != "error" || out["error"].(map[string]any)["code"] != "invalid_request" {
			t.Errorf("%s: %d %v", name, resp.StatusCode, out)
		}
	}
	// G11 / 会话与代次头。
	resp, out := post(t, srv.URL+"/v1/messages", okBody, map[string]string{"x-slot": "s03", "x-session-id": "sess-h", "x-claude-code-session-id": "sess-cc"})
	if resp.StatusCode != 200 || out["type"] != "message" {
		t.Fatalf("mock message %d %v", resp.StatusCode, out)
	}
	if resp.Header.Get("x-slot") != "s03" || resp.Header.Get("x-session-id") != "sess-cc" || resp.Header.Get("x-generation") == "" {
		t.Errorf("headers %v", resp.Header)
	}
	// A11：metadata 优先于请求头。
	body := `{"model":"m","max_tokens":1,"messages":[{"role":"user","content":"x"}],"metadata":{"user_id":"{\"session_id\":\"from-meta\"}"}}`
	resp, _ = post(t, srv.URL+"/v1/messages", body, map[string]string{"x-claude-code-session-id": "h1", "x-session-id": "h2", "x-conversation-id": "h3"})
	if resp.Header.Get("x-session-id") != "from-meta" {
		t.Errorf("metadata session precedence: %q", resp.Header.Get("x-session-id"))
	}
	// G21：续接但会话不在等待工具结果。
	resp, out = post(t, srv.URL+"/v1/messages", okBody, map[string]string{"x-continuation": "cont_x", "x-session-id": "nobody"})
	if resp.StatusCode != 400 || out["error"].(map[string]any)["message"] != "session is not waiting for a tool result" {
		t.Errorf("continuation: %d %v", resp.StatusCode, out)
	}
	// 流式响应：trailer 六项。
	resp, _ = post(t, srv.URL+"/v1/messages", `{"model":"m","max_tokens":1,"stream":true,"messages":[{"role":"user","content":"x"}]}`, nil)
	_, _ = io.ReadAll(resp.Body)
	resp.Body.Close()
	for _, k := range []string{"X-Terminal-State", "X-Error-Code", "X-Event-Count", "X-Usage", "X-Model", "X-Stop-Reason"} {
		if _, ok := resp.Trailer[http.CanonicalHeaderKey(k)]; !ok {
			t.Errorf("missing trailer %s (%v)", k, resp.Trailer)
		}
	}
	if resp.Trailer.Get("X-Terminal-State") != "complete" || resp.Trailer.Get("X-Event-Count") != "6" {
		t.Errorf("trailer values %v", resp.Trailer)
	}
}

func TestAnthropicProvider(t *testing.T) {
	t.Run("G30 missing key", func(t *testing.T) {
		t.Setenv("ANTHROPIC_API_KEY", "")
		r, _ := config.Resolve(config.Config{VMID: "v", InternalToken: "t", Provider: "anthropic_api"})
		if _, err := New(r); err == nil || !strings.Contains(err.Error(), "ANTHROPIC_API_KEY is required") {
			t.Fatalf("err = %v", err)
		}
	})
	t.Run("G32 oauth bearer and G36 no system", func(t *testing.T) {
		srv, up, _ := setup(t, "anthropic_api", `{"claudeAiOauth":{"accessToken":"oat","expiresAt":4102444800000}}`, nil)
		resp, out := post(t, srv.URL+"/v1/messages", okBody, nil)
		if resp.StatusCode != 200 || out["stop_reason"] != "max_tokens" {
			t.Fatalf("%d %v", resp.StatusCode, out)
		}
		h, b := up.last()
		if h.Get("Authorization") != "Bearer oat" || h.Get("x-api-key") != "" || h.Get("anthropic-version") != "2023-06-01" {
			t.Errorf("auth headers %v", h)
		}
		if _, ok := b["system"]; ok || b["stream"] != true {
			t.Errorf("body %v", b)
		}
		content := out["content"].([]any)
		if len(content) != 2 || out["usage"].(map[string]any)["output_tokens"] != float64(20) {
			t.Errorf("G35 message %v", out)
		}
	})
	t.Run("G24 apikey and G27 reload", func(t *testing.T) {
		srv, up, path := setup(t, "anthropic_api", `{"type":"apikey","anthropicApiKey":{"apiKey":"k1"}}`, nil)
		post(t, srv.URL+"/v1/messages", okBody, nil)
		if h, _ := up.last(); h.Get("x-api-key") != "k1" || h.Get("Authorization") != "" {
			t.Errorf("apikey headers %v", h)
		}
		_ = os.WriteFile(path, []byte(`{"type":"apikey","anthropicApiKey":{"apiKey":"k2"}}`), 0o600)
		post(t, srv.URL+"/v1/messages", okBody, nil)
		if h, _ := up.last(); h.Get("x-api-key") != "k2" {
			t.Errorf("credential not reloaded: %v", h.Get("x-api-key"))
		}
	})
	t.Run("G23 expired", func(t *testing.T) {
		srv, _, _ := setup(t, "anthropic_api", `{"claudeAiOauth":{"accessToken":"old","expiresAt":1000}}`, nil)
		resp, out := post(t, srv.URL+"/v1/messages", okBody, nil)
		if resp.StatusCode != 401 || out["error"].(map[string]any)["code"] != "needs_refresh" {
			t.Errorf("%d %v", resp.StatusCode, out)
		}
	})
	t.Run("G33 invalid event and G34 first byte", func(t *testing.T) {
		one := int64(1)
		srv, _, _ := setup(t, "anthropic_api", "", func(c *config.Config) { c.FirstByteTimeoutSeconds = &one })
		resp, out := post(t, srv.URL+"/v1/messages", strings.Replace(okBody, "claude-sonnet-5-5", "bad-json", 1), nil)
		if resp.StatusCode != 502 || out["error"].(map[string]any)["code"] != "upstream_response_invalid" {
			t.Errorf("bad json: %d %v", resp.StatusCode, out)
		}
		resp, out = post(t, srv.URL+"/v1/messages", strings.Replace(okBody, "claude-sonnet-5-5", "slow", 1), nil)
		if resp.StatusCode != 504 || !strings.Contains(out["error"].(map[string]any)["message"].(string), "stream first-byte timeout") {
			t.Errorf("first byte: %d %v", resp.StatusCode, out)
		}
	})
}

func TestChatCompletions(t *testing.T) {
	srv, up, _ := setup(t, "anthropic_api", "", nil)
	body := `{"model":"claude-sonnet-5-5","messages":[{"role":"system","content":"be nice"},{"role":"user","content":"hi"},
	{"role":"assistant","content":null,"tool_calls":[{"id":"c1","type":"function","function":{"name":"get","arguments":"{\"q\":1}"}}]},
	{"role":"tool","tool_call_id":"c1","content":"result"}],"tools":[{"type":"function","function":{"name":"get"}}]}`
	resp, out := post(t, srv.URL+"/v1/chat/completions", body, nil)
	if resp.StatusCode != 200 || out["object"] != "chat.completion" {
		t.Fatalf("%d %v", resp.StatusCode, out)
	}
	u := out["usage"].(map[string]any)
	if u["prompt_tokens"] != float64(10) || u["completion_tokens"] != float64(20) || u["total_tokens"] != float64(30) {
		t.Errorf("usage %v", u)
	}
	ch := out["choices"].([]any)[0].(map[string]any)
	if ch["finish_reason"] != "length" || ch["message"].(map[string]any)["content"] != "hi" {
		t.Errorf("choice %v", ch)
	}
	_, b := up.last()
	tools := b["tools"].([]any)
	if tools[0].(map[string]any)["input_schema"].(map[string]any)["type"] != "object" || b["system"] != "be nice" {
		t.Errorf("converted request %v", b)
	}
	msgs := b["messages"].([]any)
	if len(msgs) != 3 || msgs[2].(map[string]any)["content"].([]any)[0].(map[string]any)["tool_use_id"] != "c1" {
		t.Errorf("converted messages %v", msgs)
	}
	// G26：流式 thinking_delta 产生 chunk。
	resp, _ = post(t, srv.URL+"/v1/chat/completions", `{"model":"m","stream":true,"messages":[{"role":"user","content":"x"}]}`, nil)
	sc := bufio.NewScanner(resp.Body)
	var reasoning, finish bool
	for sc.Scan() {
		line := strings.TrimPrefix(sc.Text(), "data: ")
		if strings.Contains(line, `"reasoning_content":"hmm"`) {
			reasoning = true
		}
		if strings.Contains(line, `"finish_reason":"length"`) {
			finish = true
		}
	}
	resp.Body.Close()
	if !reasoning || !finish {
		t.Errorf("stream chunks reasoning=%v finish=%v", reasoning, finish)
	}
}

func TestConfigValidation(t *testing.T) {
	n := int64(21)
	if _, err := config.Resolve(config.Config{VMID: "v", InternalToken: "t", SlotsPerWorker: &n}); err == nil || err.Error() != "slots_per_worker must be 1..=20" {
		t.Errorf("G18: %v", err)
	}
	if _, err := config.Resolve(config.Config{InternalToken: "t"}); err == nil || err.Error() != "vm_id is required" {
		t.Errorf("vm_id: %v", err)
	}
	if _, err := config.Resolve(config.Config{VMID: "v", InternalToken: "t", HTTPSProxy: "http://10.0.0.1:8080"}); err == nil || err.Error() != "https_proxy host must be loopback" {
		t.Errorf("proxy: %v", err)
	}
	if _, err := config.Resolve(config.Config{VMID: "v", InternalToken: "t", ProxyURL: "http://x"}); err == nil || !strings.HasPrefix(err.Error(), "proxy_url scheme must be socks5 or socks5h") {
		t.Errorf("proxy_url: %v", err)
	}
	r, err := config.Resolve(config.Config{VMID: "v", InternalToken: "t"})
	if err != nil || r.Slots != 20 || r.SessionIdleTTL != 600*time.Second || r.IdleTimeout != 180*time.Second || r.FirstByteTimeout != 600*time.Second {
		t.Errorf("defaults %v %+v", err, r)
	}
}
