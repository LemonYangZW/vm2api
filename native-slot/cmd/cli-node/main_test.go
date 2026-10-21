package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"
)

var bin string

func TestMain(m *testing.M) {
	for _, kv := range os.Environ() {
		k, _, _ := strings.Cut(kv, "=")
		if strings.HasPrefix(k, "CLAUDE_") || strings.HasPrefix(k, "ANTHROPIC_") || k == "KERNEL_CONFIG" {
			os.Unsetenv(k)
		}
	}
	dir, _ := os.MkdirTemp("", "cli-node-test")
	bin = filepath.Join(dir, "cli-node")
	if runtime.GOOS == "windows" {
		bin += ".exe"
	}
	b := exec.Command("go", "build", "-o", bin, ".")
	b.Stderr = os.Stderr
	if err := b.Run(); err != nil {
		panic(err)
	}
	code := m.Run()
	_ = os.RemoveAll(dir)
	os.Exit(code)
}

type oauthMock struct {
	*httptest.Server
	mu     sync.Mutex
	bodies []map[string]any
}

func newOAuthMock(t *testing.T) *oauthMock {
	m := &oauthMock{}
	m.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1/oauth/token":
			var body map[string]any
			_ = json.NewDecoder(r.Body).Decode(&body)
			m.mu.Lock()
			m.bodies = append(m.bodies, body)
			m.mu.Unlock()
			if body["code"] == "bad" {
				w.WriteHeader(401)
				return
			}
			w.Header().Set("content-type", "application/json")
			if body["expires_in"] != nil {
				_, _ = w.Write([]byte(`{"access_token":"sk-ant-oat01-` + strings.Repeat("A", 90) + `","expires_in":31536000,"scope":"user:inference"}`))
				return
			}
			_, _ = w.Write([]byte(`{"access_token":"sk-ant-oat01-acc","refresh_token":"sk-ant-ort01-ref","expires_in":3600,
			"scope":"user:profile user:inference user:sessions:claude_code","account":{"uuid":"acc-1","email_address":"a@b.c"},"organization":{"uuid":"org-1"}}`))
		case "/api/oauth/profile":
			_, _ = w.Write([]byte(`{"account":{"uuid":"acc-1","email_address":"a@b.c"},"organization":{"uuid":"org-1","organization_type":"claude_max","rate_limit_tier":"default_claude_max_20x"}}`))
		case "/api/oauth/usage":
			if r.Header.Get("Authorization") == "" || r.Header.Get("anthropic-beta") != "oauth-2025-04-20" {
				w.WriteHeader(401)
				return
			}
			_, _ = w.Write([]byte(`{"five_hour":{"utilization":21.0,"resets_at":"2026-10-20T12:00:00Z"},"seven_day":{"utilization":43.0,"resets_at":null}}`))
		case "/v1/messages":
			w.Header().Set("content-type", "text/event-stream")
			for _, ev := range []string{
				`{"type":"message_start","message":{"id":"m","type":"message","role":"assistant","model":"claude-sonnet-5-5","content":[],"usage":{"input_tokens":3,"output_tokens":0}}}`,
				`{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}`,
				`{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello!"}}`,
				`{"type":"content_block_stop","index":0}`,
				`{"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":2}}`,
				`{"type":"message_stop"}`,
			} {
				fmt.Fprintf(w, "data: %s\n\n", ev)
			}
		default:
			w.WriteHeader(404)
		}
	}))
	t.Cleanup(m.Close)
	return m
}

func baseEnv(t *testing.T, m *oauthMock) (map[string]string, string) {
	dir := t.TempDir()
	env := map[string]string{"CLAUDE_CONFIG_DIR": dir, "HOME": dir, "USERPROFILE": dir}
	if m != nil {
		env["ANTHROPIC_BASE_URL"] = m.URL
		env["CLAUDE_CODE_OAUTH_TOKEN_URL"] = m.URL + "/v1/oauth/token"
	}
	return env, dir
}

func command(env map[string]string, args ...string) *exec.Cmd {
	cmd := exec.Command(bin, args...)
	cmd.Env = os.Environ()
	for k, v := range env {
		cmd.Env = append(cmd.Env, k+"="+v)
	}
	return cmd
}

func TestVersion(t *testing.T) {
	out, err := command(nil, "--version").Output()
	if err != nil || string(out) != "2.1.296 (Claude Code)\n" {
		t.Fatalf("%q %v", out, err)
	}
}

// pty 模拟宿主机的 PTY 驱动：等待提示后以括号粘贴写入授权码。
type pty struct {
	t   *testing.T
	cmd *exec.Cmd
	in  io.WriteCloser
	mu  sync.Mutex
	buf strings.Builder
}

func startPTY(t *testing.T, env map[string]string, args ...string) *pty {
	cmd := command(env, args...)
	in, _ := cmd.StdinPipe()
	out, _ := cmd.StdoutPipe()
	cmd.Stderr = cmd.Stdout
	p := &pty{t: t, cmd: cmd, in: in}
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	go func() {
		r := bufio.NewReader(out)
		for {
			b := make([]byte, 4096)
			n, err := r.Read(b)
			p.mu.Lock()
			p.buf.Write(b[:n])
			p.mu.Unlock()
			if err != nil {
				return
			}
		}
	}()
	return p
}

func (p *pty) waitFor(s string) string {
	deadline := time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
		p.mu.Lock()
		out := p.buf.String()
		p.mu.Unlock()
		if strings.Count(out, s) > 0 {
			return out
		}
		time.Sleep(20 * time.Millisecond)
	}
	p.t.Fatalf("timeout waiting for %q; output:\n%s", s, p.buf.String())
	return ""
}

func (p *pty) countOf(s string) int {
	p.mu.Lock()
	defer p.mu.Unlock()
	return strings.Count(p.buf.String(), s)
}

func (p *pty) paste(code string) {
	_, _ = io.WriteString(p.in, "\x1b[200~"+code+"\x1b[201~\r\n")
}

func authorizeParams(t *testing.T, out string) url.Values {
	i := strings.Index(out, "https://claude.com/cai/oauth/authorize?")
	if i < 0 {
		t.Fatalf("no authorize URL in %q", out)
	}
	link := strings.Fields(out[i:])[0]
	u, err := url.Parse(link)
	if err != nil {
		t.Fatal(err)
	}
	keys := []string{}
	for _, kv := range strings.Split(u.RawQuery, "&") {
		k, _, _ := strings.Cut(kv, "=")
		keys = append(keys, k)
	}
	if strings.Join(keys, ",") != "code,client_id,response_type,redirect_uri,scope,code_challenge,code_challenge_method,state" {
		t.Errorf("param order %v", keys)
	}
	if strings.Contains(u.RawQuery, "+") {
		t.Errorf("scope spaces must be %%20: %s", u.RawQuery)
	}
	return u.Query()
}

func TestPanelLoginWithoutArguments(t *testing.T) {
	m := newOAuthMock(t)
	env, dir := baseEnv(t, m)
	env["KIN_PANEL_LOGIN"] = "1"
	env["CLAUDE_CODE_HOST_REFRESH"] = "1"
	path := filepath.Join(dir, "credentials.json")
	if err := os.WriteFile(path, []byte("{}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	p := startPTY(t, env)
	q := authorizeParams(t, p.waitFor("Paste code here"))
	p.paste("good#" + q.Get("state"))
	p.waitFor("Login successful")
	if err := p.cmd.Wait(); err != nil {
		t.Fatalf("exit: %v", err)
	}
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var doc map[string]any
	if err := json.Unmarshal(b, &doc); err != nil {
		t.Fatal(err)
	}
	grant, _ := doc["claudeAiOauth"].(map[string]any)
	if grant["refreshToken"] != "sk-ant-ort01-ref" {
		t.Error("面板登录未写入宿主凭据文件")
	}
	if out, err := command(env, "auth", "logout").CombinedOutput(); err != nil {
		t.Fatalf("logout: %v %s", err, out)
	}
	after, err := os.ReadFile(path)
	if err != nil || string(after) != string(b) {
		t.Error("logout 修改了宿主维护的凭据")
	}
}

func TestAuthLogin(t *testing.T) {
	m := newOAuthMock(t)
	env, dir := baseEnv(t, m)
	p := startPTY(t, env, "auth", "login")
	out := p.waitFor("Paste code here")
	q := authorizeParams(t, out)
	if q.Get("code") != "true" || q.Get("client_id") != "9d1c250a-e61b-44d9-88ed-5944d1962f5e" || q.Get("code_challenge_method") != "S256" ||
		q.Get("redirect_uri") != "https://platform.claude.com/oauth/code/callback" || len(q.Get("state")) != 43 ||
		q.Get("scope") != "org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload" {
		t.Errorf("authorize params %v", q)
	}
	// H3：无效授权码 → OAuth error + Press Enter to retry，回车后重新提示。
	p.paste("bad#" + q.Get("state"))
	p.waitFor("Press Enter to retry")
	_, _ = io.WriteString(p.in, "\r\n")
	deadline := time.Now().Add(5 * time.Second)
	for p.countOf("Paste code here") < 2 && time.Now().Before(deadline) {
		time.Sleep(20 * time.Millisecond)
	}
	p.paste("good#" + q.Get("state"))
	p.waitFor("Login successful")
	if err := p.cmd.Wait(); err != nil {
		t.Fatalf("exit: %v\n%s", err, p.buf.String())
	}
	if !strings.Contains(p.buf.String(), "OAuth error: Invalid code") {
		t.Errorf("missing invalid code output: %s", p.buf.String())
	}
	m.mu.Lock()
	last := m.bodies[len(m.bodies)-1]
	m.mu.Unlock()
	if last["grant_type"] != "authorization_code" || last["code"] != "good" || last["state"] != q.Get("state") ||
		len(last["code_verifier"].(string)) != 43 || last["expires_in"] != nil {
		t.Errorf("exchange body %v", last)
	}
	path := filepath.Join(dir, ".credentials.json")
	st, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if runtime.GOOS != "windows" && st.Mode().Perm() != 0o600 {
		t.Errorf("credential mode %v", st.Mode())
	}
	var cred struct {
		O struct {
			AccessToken, RefreshToken, SubscriptionType, RateLimitTier string
			ExpiresAt                                                  int64
			Scopes                                                     []string
			TokenAccount                                               map[string]string
		} `json:"claudeAiOauth"`
	}
	b, _ := os.ReadFile(path)
	_ = json.Unmarshal(b, &cred)
	if cred.O.AccessToken != "sk-ant-oat01-acc" || cred.O.RefreshToken != "sk-ant-ort01-ref" || cred.O.SubscriptionType != "max" ||
		len(cred.O.Scopes) != 3 || cred.O.TokenAccount["uuid"] != "acc-1" || cred.O.ExpiresAt < time.Now().UnixMilli() {
		t.Errorf("credentials %s", b)
	}
	out2, _ := command(env, "auth", "status").Output()
	if !strings.Contains(string(out2), `"loggedIn": true`) {
		t.Errorf("auth status %s", out2)
	}
}

func TestAuthLoginFlags(t *testing.T) {
	env, _ := baseEnv(t, nil)
	cmd := command(env, "auth", "login", "--console", "--claudeai")
	out, err := cmd.CombinedOutput()
	if err == nil || !strings.Contains(string(out), "Error: --console and --claudeai cannot be used together.") {
		t.Errorf("%v %s", err, out)
	}
}

func TestSetupToken(t *testing.T) {
	m := newOAuthMock(t)
	env, dir := baseEnv(t, m)
	p := startPTY(t, env, "setup-token")
	out := p.waitFor("Paste code here")
	q := authorizeParams(t, out)
	if q.Get("scope") != "user:inference" {
		t.Errorf("scope %q", q.Get("scope"))
	}
	p.paste("good#" + q.Get("state"))
	p.waitFor("Long-lived authentication token created successfully")
	_ = p.cmd.Wait()
	if !strings.Contains(p.buf.String(), "sk-ant-oat01-"+strings.Repeat("A", 90)) {
		t.Errorf("token not printed: %s", p.buf.String())
	}
	m.mu.Lock()
	last := m.bodies[len(m.bodies)-1]
	m.mu.Unlock()
	if last["expires_in"] != float64(31536000) {
		t.Errorf("setup exchange %v", last)
	}
	b, _ := os.ReadFile(filepath.Join(dir, ".credentials.json"))
	if strings.Contains(string(b), "refreshToken") || !strings.Contains(string(b), "sk-ant-oat01-") {
		t.Errorf("setup credentials %s", b)
	}
}

func writeCred(t *testing.T, dir string) {
	_ = os.WriteFile(filepath.Join(dir, ".credentials.json"), []byte(`{"claudeAiOauth":{"accessToken":"tok","scopes":["user:profile","user:inference"]}}`), 0o600)
}

func TestPrintHelloAndUsage(t *testing.T) {
	m := newOAuthMock(t)
	env, dir := baseEnv(t, m)
	writeCred(t, dir)
	out, err := command(env, "-p", "hello", "--permission-mode", "bypassPermissions", "--output-format", "json").Output()
	if err != nil {
		t.Fatalf("%v %s", err, out)
	}
	var doc map[string]any
	if json.Unmarshal(out, &doc) != nil || doc["is_error"] != false || doc["result"] != "Hello!" || doc["error"] != nil {
		t.Fatalf("hello output %s", out)
	}
	out, err = command(env, "/usage", "--print", "--permission-mode", "bypassPermissions", "--output-format", "stream-json", "--verbose").Output()
	if err != nil {
		t.Fatalf("%v %s", err, out)
	}
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	var last map[string]any
	for _, l := range lines {
		if json.Unmarshal([]byte(l), &last) != nil {
			t.Fatalf("not NDJSON: %q", l)
		}
	}
	if len(lines) < 2 || last["type"] != "result" || !strings.Contains(last["result"].(string), `"five_hour"`) {
		t.Errorf("usage output %s", out)
	}
}

func TestSlotModeHandshake(t *testing.T) {
	for _, n := range []int{1, 20} {
		env, _ := baseEnv(t, nil)
		env["CLAUDE_CODE_NATIVE_SLOTS"] = fmt.Sprint(n)
		env["CLAUDE_CODE_TIMEZONE"] = "Asia/Taipei"
		env["CLAUDE_CODE_SYSTEM_LAYOUT"] = "zero"
		cmd := command(env)
		in, _ := cmd.StdinPipe()
		outPipe, _ := cmd.StdoutPipe()
		_ = cmd.Start()
		r := bufio.NewScanner(outPipe)
		r.Scan()
		var ready map[string]any
		_ = json.Unmarshal(r.Bytes(), &ready)
		if ready["type"] != "host_ready" || ready["protocol_version"] != float64(2) || ready["slots"] != float64(n) ||
			ready["system_layout"] != "zero" || ready["timezone"] != "Asia/Taipei" || len(ready["capabilities"].([]any)) != 5 {
			t.Fatalf("host_ready %s", r.Bytes())
		}
		for i := 0; i < n; i++ {
			r.Scan()
			if !strings.Contains(r.Text(), fmt.Sprintf(`"slot_id":"s%02d"`, i)) {
				t.Fatalf("slot_ready %d: %s", i, r.Text())
			}
		}
		// 快速自检：ping→pong、cancel→cancel_ack、未知槽位、未识别帧。
		fmt.Fprintln(in, `{"type":"bogus"}`)
		fmt.Fprintln(in, `{"type":"ping","nonce":"ping_abc"}`)
		r.Scan()
		if r.Text() != `{"nonce":"ping_abc","type":"pong"}` && r.Text() != `{"type":"pong","nonce":"ping_abc"}` {
			t.Errorf("pong %s", r.Text())
		}
		fmt.Fprintln(in, `{"type":"cancel","job_id":"job_x","slot_id":"s00"}`)
		r.Scan()
		if !strings.Contains(r.Text(), `"type":"cancel_ack"`) || !strings.Contains(r.Text(), `"job_id":"job_x"`) {
			t.Errorf("cancel_ack %s", r.Text())
		}
		fmt.Fprintln(in, `{"type":"job_start","job_id":"job_y","slot_id":"s99","request":{}}`)
		r.Scan()
		if !strings.Contains(r.Text(), `"error":"unknown slot s99"`) || !strings.Contains(r.Text(), `"status":502`) {
			t.Errorf("unknown slot %s", r.Text())
		}
		fmt.Fprintln(in, `{"type":"job_start","job_id":"job_z","slot_id":"s00","request":{"messages":[]},"request_context":{"purpose":"x"}}`)
		r.Scan()
		if !strings.Contains(r.Text(), `"code":"invalid_request_context"`) {
			t.Errorf("invalid context %s", r.Text())
		}
		_ = in.Close()
		if err := cmd.Wait(); err != nil {
			t.Errorf("exit after stdin EOF: %v", err)
		}
	}
	env, _ := baseEnv(t, nil)
	env["CLAUDE_CODE_NATIVE_SLOTS"] = "0"
	out, err := command(env).CombinedOutput()
	if err == nil || strings.Contains(string(out), "host_ready") {
		t.Errorf("NATIVE_SLOTS=0 must not enter slot mode: %s", out)
	}
}
