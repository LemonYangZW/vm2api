// Package printmode 实现精简的非交互 print 模式（07 7.5）：只支持 hello 类
// 提示词与 /usage 两种输入，输出 json 或 stream-json。
package printmode

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"vm2api/native-slot/internal/clihost"
	"vm2api/native-slot/internal/credential"
	"vm2api/native-slot/internal/ojson"
	"vm2api/native-slot/internal/sse"
	"vm2api/native-slot/internal/upstream"
)

// Options 是 print 模式参数。
type Options struct {
	Prompt       string
	OutputFormat string // text / json / stream-json
	Verbose      bool
	Model        string
}

type emitter struct {
	out     io.Writer
	format  string
	session string
}

func (e *emitter) line(v any) {
	b, _ := json.Marshal(v)
	fmt.Fprintln(e.out, string(b))
}

func (e *emitter) init(model string) {
	if e.format == "stream-json" {
		e.line(map[string]any{"type": "system", "subtype": "init", "session_id": e.session, "model": model,
			"cwd": cwd(), "tools": []any{}, "mcp_servers": []any{}, "permissionMode": "bypassPermissions",
			"apiKeySource": "none", "claude_code_version": upstream.CLIVersion(), "uuid": upstream.NewUUID()})
	}
}

func cwd() string { d, _ := os.Getwd(); return d }

// result 输出最终结果；isErr 时退出码为 1。
func (e *emitter) result(text string, isErr bool, start time.Time, usage map[string]any, stop string) int {
	subtype := "success"
	if isErr {
		subtype = "error_during_execution"
	}
	if usage == nil {
		usage = map[string]any{"input_tokens": 0, "output_tokens": 0}
	}
	doc := map[string]any{"type": "result", "subtype": subtype, "is_error": isErr,
		"duration_ms": time.Since(start).Milliseconds(), "duration_api_ms": time.Since(start).Milliseconds(),
		"num_turns": 1, "result": text, "stop_reason": nullable(stop), "session_id": e.session,
		"total_cost_usd": 0, "usage": usage, "modelUsage": map[string]any{}, "permission_denials": []any{},
		"uuid": upstream.NewUUID()}
	switch e.format {
	case "json", "stream-json":
		e.line(doc)
	default:
		fmt.Fprintln(e.out, text)
	}
	if isErr {
		return 1
	}
	return 0
}

func nullable(s string) any {
	if s == "" {
		return nil
	}
	return s
}

func loadCredential() (*credential.Credential, error) {
	if tok := strings.TrimSpace(os.Getenv("CLAUDE_CODE_OAUTH_TOKEN")); tok != "" {
		return &credential.Credential{Type: "oauth", Token: tok, Scopes: []string{"user:inference"}, HasScopes: true}, nil
	}
	if key := strings.TrimSpace(os.Getenv("ANTHROPIC_API_KEY")); key != "" {
		return &credential.Credential{Type: "apikey", Token: key}, nil
	}
	return credential.Load(clihost.CredentialPath())
}

// Run 执行一次 print 调用并返回退出码。
func Run(ctx context.Context, o Options, out io.Writer) int {
	e := &emitter{out: out, format: o.OutputFormat, session: upstream.NewUUID()}
	start := time.Now()
	if strings.HasPrefix(strings.TrimSpace(o.Prompt), "/") {
		return runSlash(ctx, e, strings.TrimSpace(o.Prompt), start)
	}
	model := o.Model
	if model == "" {
		model = os.Getenv("ANTHROPIC_MODEL")
	}
	if model == "" {
		model = "claude-sonnet-5-5"
	}
	e.init(model)
	cred, err := loadCredential()
	if err != nil {
		return e.result("Not logged in · Please run /login", true, start, nil, "")
	}
	text, usage, stop, err := ask(ctx, cred, model, o.Prompt, e.session)
	if err != nil {
		return e.result(err.Error(), true, start, usage, stop)
	}
	if e.format == "stream-json" {
		e.line(map[string]any{"type": "assistant", "session_id": e.session, "uuid": upstream.NewUUID(),
			"message": map[string]any{"role": "assistant", "model": model,
				"content": []any{map[string]any{"type": "text", "text": text}}}})
	}
	return e.result(text, false, start, usage, stop)
}

// ask 以官方非交互会话的形态发一次 Messages 请求。
func ask(ctx context.Context, cred *credential.Credential, model, prompt, session string) (string, map[string]any, string, error) {
	id := upstream.NewIdentity()
	messages := []any{map[string]any{"role": "user", "content": []any{map[string]any{"type": "text", "text": prompt}}}}
	attribution := upstream.Attribution(upstream.AttributionOptions{
		Fingerprint: upstream.Fingerprint(prompt), Indexes: true, PromptID: session,
		TurnOrigin: upstream.TurnOrigin("sdk")})
	system := []any{map[string]any{"type": "text", "text": attribution}}
	system = append(system, map[string]any{"type": "text",
		"text":          "You are Claude Code, Anthropic's official CLI for Claude.",
		"cache_control": map[string]any{"type": "ephemeral"}})
	body := ojson.NewObject()
	body.Set("model", model)
	body.Set("messages", messages)
	body.Set("system", system)
	body.Set("tools", []any{})
	body.Set("metadata", map[string]any{"user_id": id.UserID(session)})
	body.Set("max_tokens", 32000)
	body.Set("stream", true)
	betas := upstream.MergeOfficialExtraBetas(upstream.ModelBetas(model, cred.Subscriber()))
	if cred.Bearer() && !cred.HasScope("user:profile") {
		betas = upstream.SetupTokenBetas(model)
	}
	raw := upstream.StampCch(string(ojson.Marshal(body)), true)
	h := http.Header{}
	h.Set("Accept", "application/json")
	h.Set("Content-Type", "application/json")
	h.Set("anthropic-version", "2023-06-01")
	h.Set("anthropic-beta", strings.Join(betas, ","))
	h.Set("anthropic-dangerous-direct-browser-access", "true")
	h.Set("X-Claude-Code-Session-Id", session)
	cred.Apply(h.Set)
	upstream.ApplyOfficialHeaders(h, "sdk")
	built := &upstream.Built{Body: []byte(raw), Header: h, Model: model, Session: session}
	asm := sse.NewAssembler()
	res := upstream.NewClient().Stream(ctx, built, 32<<20, func(ev json.RawMessage) error {
		var m map[string]any
		if json.Unmarshal(ev, &m) == nil {
			asm.Add(m)
		}
		return nil
	})
	if res.Failure != nil {
		return "", asm.Usage, "", fmt.Errorf("API Error: %d %s", res.Failure.Status, res.Failure.Error)
	}
	msg, err := asm.Finish()
	if err != nil {
		return "", asm.Usage, "", err
	}
	var text strings.Builder
	for _, b := range msg["content"].([]any) {
		bm, _ := b.(map[string]any)
		if bm["type"] == "text" {
			s, _ := bm["text"].(string)
			text.WriteString(s)
		}
	}
	return text.String(), asm.Usage, asm.StopReason, nil
}

// runSlash 只支持 /usage：读取 OAuth 用量并以 result 文本返回。
func runSlash(ctx context.Context, e *emitter, cmd string, start time.Time) int {
	name := strings.Fields(cmd)[0]
	e.init("")
	if name != "/usage" {
		return e.result(fmt.Sprintf("Unknown command: %s", name), true, start, nil, "")
	}
	cred, err := loadCredential()
	if err != nil || !cred.Bearer() {
		return e.result("/usage is only available for subscription plans.", true, start, nil, "")
	}
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, upstream.BaseURL()+"/api/oauth/usage", nil)
	req.Header.Set("Authorization", "Bearer "+cred.Token)
	req.Header.Set("anthropic-beta", "oauth-2025-04-20")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", upstream.UserAgent())
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return e.result("Failed to load usage data: "+err.Error(), true, start, nil, "")
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode != 200 {
		return e.result(fmt.Sprintf("Failed to load usage data: HTTP %d", resp.StatusCode), true, start, nil, "")
	}
	var doc map[string]any
	if json.Unmarshal(data, &doc) != nil {
		return e.result("Failed to load usage data: invalid response", true, start, nil, "")
	}
	var compact bytes.Buffer
	_ = json.Compact(&compact, data)
	if e.format == "json" || e.format == "stream-json" {
		return e.result(compact.String(), false, start, nil, "")
	}
	return e.result(usageText(doc), false, start, nil, "")
}

// usageText 生成宿主可解析的文本兜底格式。
func usageText(doc map[string]any) string {
	var b strings.Builder
	row := func(label string, v any) {
		m, _ := v.(map[string]any)
		if m == nil {
			return
		}
		u, ok := m["utilization"].(float64)
		if !ok {
			return
		}
		fmt.Fprintf(&b, "%s: %s%% used\n", label, ojson.FormatNumber(u))
	}
	row("Current session", doc["five_hour"])
	row("Current week (all models)", doc["seven_day"])
	row("Current week (Sonnet only)", doc["seven_day_sonnet"])
	row("Current week (Opus)", doc["seven_day_opus"])
	return strings.TrimRight(b.String(), "\n")
}
