package upstream

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"vm2api/native-slot/internal/credential"
	"vm2api/native-slot/internal/ojson"
)

// writeKernelConfig 写一份 kernel.json 并把 KERNEL_CONFIG 指向它。
func writeKernelConfig(t *testing.T, doc map[string]any) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "kernel.json")
	b, err := json.Marshal(doc)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, b, 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("KERNEL_CONFIG", path)
}

func testCredential(t *testing.T, bearer bool, scopes ...string) *credential.Credential {
	t.Helper()
	typ := "apikey"
	if bearer {
		typ = "oauth"
	}
	// 凭据文件里 scope 在 claudeAiOauth 块内，与生产写出格式一致。
	b, _ := json.Marshal(map[string]any{"type": typ, "claudeAiOauth": map[string]any{
		"accessToken": "test-token", "refreshToken": "never-sent", "expiresAt": 4102444800000, "scopes": scopes}})
	cred, err := credential.Parse(b)
	if err != nil {
		t.Fatal(err)
	}
	return cred
}

func buildRaw(t *testing.T, cred *credential.Credential, body string) (*Built, error) {
	t.Helper()
	req, err := ojson.ParseObject([]byte(body))
	if err != nil {
		t.Fatalf("parse request: %v", err)
	}
	return Build(BuildInput{Request: req, SessionID: "sess", Credential: cred, Identity: NewIdentity()})
}

// 面板打开 cached_microcompact_enabled 时，官方 CLI 构建没有 cache-editing
// 实现，每条请求都必须以 cached_microcompact_unavailable / 400 结束。
func TestBuildCachedMicrocompactGate(t *testing.T) {
	body := `{"model":"claude-sonnet-5-5","messages":[{"role":"user","content":"hi"}],"max_tokens":16}`
	cred := testCredential(t, true, "user:inference")

	writeKernelConfig(t, map[string]any{"cached_microcompact_enabled": true})
	_, err := buildRaw(t, cred, body)
	var fe *FailureError
	if !errors.As(err, &fe) {
		t.Fatalf("want FailureError, got %v", err)
	}
	if fe.Failure.Code != "cached_microcompact_unavailable" {
		t.Errorf("code = %q", fe.Failure.Code)
	}
	if fe.Failure.Status != 400 {
		t.Errorf("status = %d, want 400", fe.Failure.Status)
	}
	if fe.Failure.ErrorType != "invalid_request_error" {
		t.Errorf("error_type = %q", fe.Failure.ErrorType)
	}
	if !strings.HasPrefix(fe.Failure.Error, "cached_microcompact_unavailable: enabled in kernel.json") {
		t.Errorf("message = %q", fe.Failure.Error)
	}

	// 关掉开关后恢复正常构建。
	writeKernelConfig(t, map[string]any{"cached_microcompact_enabled": false})
	built, err := buildRaw(t, cred, body)
	if err != nil {
		t.Fatalf("gate must be off: %v", err)
	}
	if !strings.Contains(string(built.Body), `"max_tokens":16`) {
		t.Errorf("unexpected body %s", built.Body)
	}

	// 键缺失同样视为关闭。
	writeKernelConfig(t, map[string]any{"cch_enabled": true})
	if _, err := buildRaw(t, cred, body); err != nil {
		t.Fatalf("missing key must be off: %v", err)
	}
}

// 读取器语义与 readPanelCachedMicrocompactEnabled 一致：键缺失回到 false，
// 非布尔值沿用上次结果。
func TestReadPanelCachedMicrocompact(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "kernel.json")
	write := func(s string) {
		t.Helper()
		if err := os.WriteFile(path, []byte(s), 0o600); err != nil {
			t.Fatal(err)
		}
	}

	write(`{"cached_microcompact_enabled": true}`)
	if !readPanelCachedMicrocompactEnabled(path) {
		t.Fatal("true must be read as true")
	}
	// 键缺失 → 回到 false
	write(`{"other": 1}`)
	if readPanelCachedMicrocompactEnabled(path) {
		t.Fatal("missing key must reset to false")
	}
	// 非布尔字符串：沿用上次（false）
	write(`{"cached_microcompact_enabled": "yes"}`)
	if readPanelCachedMicrocompactEnabled(path) {
		t.Fatal("non-boolean must keep the previous value")
	}
	// 读文件失败：沿用上次
	if readPanelCachedMicrocompactEnabled(filepath.Join(dir, "absent.json")) {
		t.Fatal("read failure must keep the previous value")
	}
	write(`{"cached_microcompact_enabled": false}`)
	if readPanelCachedMicrocompactEnabled(path) {
		t.Fatal("false must stay false")
	}
}

// readPanelAutoCompactWindow：键缺失/null 重置，合法整数记住，非法值沿用上次。
func TestReadPanelAutoCompactWindow(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "kernel.json")
	write := func(s string) {
		t.Helper()
		if err := os.WriteFile(path, []byte(s), 0o600); err != nil {
			t.Fatal(err)
		}
	}

	write(`{"auto_compact_window": 200000}`)
	if v, ok := readPanelAutoCompactWindow(path); !ok || v != 200000 {
		t.Fatalf("200000 must be accepted, got %d %v", v, ok)
	}
	// 越界：沿用上一次
	write(`{"auto_compact_window": 99999}`)
	if v, ok := readPanelAutoCompactWindow(path); !ok || v != 200000 {
		t.Fatalf("out-of-range must keep the previous value, got %d %v", v, ok)
	}
	// 键缺失：重置
	write(`{"other": 1}`)
	if _, ok := readPanelAutoCompactWindow(path); ok {
		t.Fatal("missing key must reset to unset")
	}
	// null：重置
	write(`{"auto_compact_window": null}`)
	if _, ok := readPanelAutoCompactWindow(path); ok {
		t.Fatal("null must reset to unset")
	}
	// 字符串数字：按 Number() 语义接受
	write(`{"auto_compact_window": " 400000 "}`)
	if v, ok := readPanelAutoCompactWindow(path); !ok || v != 400000 {
		t.Fatalf("numeric string must be accepted, got %d %v", v, ok)
	}
	// 上界包含
	write(`{"auto_compact_window": 1000000}`)
	if v, ok := readPanelAutoCompactWindow(path); !ok || v != 1000000 {
		t.Fatalf("upper bound must be inclusive, got %d %v", v, ok)
	}
}

// attributionGates：只有第一方订阅者带订阅者字段；vertex 只带 cch；其余 provider
// 两者都不带。identity/zero 布局的 cch 占位由布局无条件写入，与门控无关。
func TestBuildAttributionGates(t *testing.T) {
	body := `{"model":"claude-sonnet-5-5","messages":[{"role":"user","content":"hi"}],"max_tokens":16}`
	subscriber := testCredential(t, true, "user:inference", "user:profile")
	tokenOnly := testCredential(t, true, "user:inference")
	apiKey := testCredential(t, false)

	writeKernelConfig(t, map[string]any{"cch_enabled": true})
	for _, k := range []string{"CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_FOUNDRY"} {
		t.Setenv(k, "")
		_ = os.Unsetenv(k)
	}
	// 生产槽位用 identity 布局；stock 下宿主不生成计费头，测不到门控。
	// 入口类型由内核在启动 CLI 时写成 sdk-cli，origin 才能回退成 sdk。
	t.Setenv("CLAUDE_CODE_SYSTEM_LAYOUT", "identity")
	t.Setenv("CLAUDE_CODE_ENTRYPOINT", "sdk-cli")

	subscriberFields := []string{"cc_is_subagent=true;", "cc_prompt_id=", "cc_turn_origin="}

	// 第一方订阅者：订阅者字段齐全（"agent:kin" 会回退成入口类型作为 origin）。
	built, err := buildRaw(t, subscriber, body)
	if err != nil {
		t.Fatal(err)
	}
	billing := billingFromBody(t, built.Body)
	if !strings.Contains(billing, "cch=") {
		t.Errorf("identity layout must always carry a cch field, got %q", billing)
	}
	for _, want := range append(subscriberFields, "cc_prompt_index=0; cc_turn_index=1;") {
		if !strings.Contains(billing, want) {
			t.Errorf("subscriber billing missing %q", want)
		}
	}

	// vertex：布局仍写 cch，但订阅者字段一律不带。
	t.Setenv("CLAUDE_CODE_USE_VERTEX", "1")
	built, err = buildRaw(t, subscriber, body)
	if err != nil {
		t.Fatal(err)
	}
	billing = billingFromBody(t, built.Body)
	if !strings.Contains(billing, "cch=") {
		t.Errorf("vertex billing must keep the layout cch, got %q", billing)
	}
	for _, bad := range append(subscriberFields, "cc_prompt_index=", "cc_turn_index=") {
		if strings.Contains(billing, bad) {
			t.Errorf("vertex billing must not carry %q", bad)
		}
	}

	// 无 user:profile 的 setup-token 仍算订阅者（isClaudeAISubscriber 只看
	// user:inference）；API key 不是订阅者，第一方也不带订阅者字段。
	t.Setenv("CLAUDE_CODE_USE_VERTEX", "")
	_ = os.Unsetenv("CLAUDE_CODE_USE_VERTEX")
	built, err = buildRaw(t, tokenOnly, body)
	if err != nil {
		t.Fatal(err)
	}
	if billing = billingFromBody(t, built.Body); !strings.Contains(billing, "cc_prompt_id=") {
		t.Errorf("setup-token scope holder must keep subscriber fields: %q", billing)
	}
	for _, cred := range []*credential.Credential{apiKey} {
		built, err = buildRaw(t, cred, body)
		if err != nil {
			t.Fatal(err)
		}
		billing = billingFromBody(t, built.Body)
		for _, bad := range append(subscriberFields, "cc_prompt_index=", "cc_turn_index=") {
			if strings.Contains(billing, bad) {
				t.Errorf("non-subscriber billing must not carry %q", bad)
			}
		}
	}
}

// billingFromBody 取出请求体建出的第一段 system 文本。
func billingFromBody(t *testing.T, body []byte) string {
	t.Helper()
	v, err := ojson.ParseObject(body)
	if err != nil {
		t.Fatalf("parse built body: %v", err)
	}
	blocks := ojson.Arr(v.Get("system"))
	if len(blocks) == 0 {
		t.Fatalf("built body has no system blocks: %s", body)
	}
	return ojson.Str(ojson.Obj(blocks[0]).Get("text"))
}

// readPanelCliVersion：面板 cli_version 优先；键缺失重置（回落 env），非法值沿用。
func TestReadPanelCliVersion(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "kernel.json")
	write := func(s string) {
		t.Helper()
		if err := os.WriteFile(path, []byte(s), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	write(`{"cli_version": "2.1.303"}`)
	if v := readPanelCliVersion(path); v != "2.1.303" {
		t.Fatalf("panel version = %q", v)
	}
	// 带空白也能识别
	write(`{"cli_version": " 2.1.296 "}`)
	if v := readPanelCliVersion(path); v != "2.1.296" {
		t.Fatalf("trimmed panel version = %q", v)
	}
	// 非法值：沿用上次
	write(`{"cli_version": "2.1"}`)
	if v := readPanelCliVersion(path); v != "2.1.296" {
		t.Fatalf("invalid must keep previous, got %q", v)
	}
	// 键缺失：重置
	write(`{"other": 1}`)
	if v := readPanelCliVersion(path); v != "" {
		t.Fatalf("missing key must reset, got %q", v)
	}
}

// CLIVersion：面板 cli_version > CLAUDE_CODE_VERSION > 编译期默认。
func TestCLIVersionPrecedence(t *testing.T) {
	writeKernelConfig(t, map[string]any{"cli_version": "2.1.303"})
	t.Setenv("CLAUDE_CODE_VERSION", "2.1.400 (Claude Code)")
	if v := CLIVersion(); v != "2.1.303" {
		t.Fatalf("panel must win, got %q", v)
	}
	writeKernelConfig(t, map[string]any{})
	if v := CLIVersion(); v != "2.1.400" {
		t.Fatalf("env fallback, got %q", v)
	}
	t.Setenv("CLAUDE_CODE_VERSION", "")
	if v := CLIVersion(); v != fingerprintVersion {
		t.Fatalf("compiled default, got %q", v)
	}
}

// lean(kin_outbound_shape=lean)：宿主不碰缓存标记（上限裁剪也交给控制面），
// 并把该字段从出站请求里删掉。
func TestBuildLeanShapeSkipsCacheMarkers(t *testing.T) {
	writeKernelConfig(t, map[string]any{"default_cache_ttl": "1h"})
	cred := testCredential(t, true, "user:inference", "user:profile")
	t.Setenv("CLAUDE_CODE_SYSTEM_LAYOUT", "identity")
	// 五个带显式 TTL 的块：非 lean 会被裁剪到 4 个，lean 原样保留。
	blocks := ""
	for i := 0; i < 5; i++ {
		if i > 0 {
			blocks += ","
		}
		blocks += `{"type":"text","text":"b` + string(rune('0'+i)) + `","cache_control":{"type":"ephemeral","ttl":"1h"}}`
	}
	body := `{"model":"claude-sonnet-5-5","messages":[{"role":"user","content":[` + blocks + `]}],` +
		`"system":[{"type":"text","text":"` + "x-anth" + `ropic-billing-header: cch=abcde;"}],"max_tokens":16}`
	lean := strings.Replace(body, `"max_tokens":16`, `"max_tokens":16,"kin_outbound_shape":"lean"`, 1)

	built, err := buildRaw(t, cred, lean)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(built.Body), "kin_outbound_shape") {
		t.Fatalf("kin_outbound_shape leaked upstream")
	}
	if n := strings.Count(string(built.Body), "cache_control"); n != 5 {
		t.Fatalf("lean must keep caller markers untouched, got %d (body len %d)", n, len(built.Body))
	}

	built, err = buildRaw(t, cred, body)
	if err != nil {
		t.Fatal(err)
	}
	if n := strings.Count(string(built.Body), "cache_control"); n > 4 {
		t.Fatalf("non-lean must cap markers at 4, got %d", n)
	}
}

// withCchPlaceholderInPlace 的四个分支（期望值取自现网 1.3.221 输出）。
func TestWithCchPlaceholderInPlace(t *testing.T) {
	head := "x-anth" + "ropic-billing-header: "
	cases := []struct{ name, in, want string }{
		{"existing cch", head + "cch=abcde;", head + "cch=00000;"},
		{"two cch leaves trailing space", head + "cch=abcde; cch=fedcb;", head + "cch=00000; "},
		{"no cch appends", "nothing", "nothing; cch=00000;"},
		{"empty", "", "; cch=00000;"},
	}
	for _, c := range cases {
		if got := withCchPlaceholderInPlace(c.in); got != c.want {
			t.Errorf("%s: got %q want %q", c.name, got, c.want)
		}
	}
	// 有 cc_entrypoint 但没有 cch：插在 entrypoint 之后。
	entry := head + ""
	got := withCchPlaceholderInPlace(entry)
	if !strings.Contains(got, "cch=00000;") || !strings.HasPrefix(got, head) {
		t.Errorf("entrypoint branch: %q", got)
	}
}

// 面板 cli_version 必须进入出站计费头（cc_version）与 User-Agent。
func TestBuildUsesPanelCLIVersion(t *testing.T) {
	cred := testCredential(t, true, "user:inference", "user:profile")
	t.Setenv("CLAUDE_CODE_SYSTEM_LAYOUT", "identity")
	writeKernelConfig(t, map[string]any{"cch_enabled": true, "cli_version": "2.1.303"})
	built, err := buildRaw(t, cred, `{"model":"claude-sonnet-5-5","messages":[{"role":"user","content":"hi"}],"max_tokens":16}`)
	if err != nil {
		t.Fatal(err)
	}
	billing := billingFromBody(t, built.Body)
	if !strings.Contains(billing, "2.1.303") {
		t.Errorf("billing must carry the panel cli version: %q", billing)
	}
	if ua := built.Header.Get("User-Agent"); !strings.Contains(ua, "/2.1.303") {
		t.Errorf("user-agent must follow the panel cli version: %q", ua)
	}
}
