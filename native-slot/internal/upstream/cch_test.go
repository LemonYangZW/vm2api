package upstream

import (
	"strings"
	"testing"
)

// 期望值来自现网 cli-node（payload 2026.10.22/10.23 钉住的
// cli-node-cch-system-only-b5054cb8，5d6b33b6…）解包后的 src/utils/cch.ts
// 在同样的 body 上的输出，逐字节固定下来，避免测试再依赖本机 node。
func TestStampCchCanonicalSystemOnly(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{
			// 回归 #692：messages 在 system 之前，工具结果里的计费示例不得被改写。
			name: "message literal first",
			in:   `{"model":"m","messages":[{"role":"user","content":[{"type":"tool_result","content":"docs: x-anthropic-billing-header: cc_version=1; cch=00000;"}]}],"system":[{"type":"text","text":"x-anthropic-billing-header: cc_version=2.1.296.x; cch=00000;"}],"max_tokens":9}`,
			want: `{"model":"m","messages":[{"role":"user","content":[{"type":"tool_result","content":"docs: x-anthropic-billing-header: cc_version=1; cch=00000;"}]}],"system":[{"type":"text","text":"x-anthropic-billing-header: cc_version=2.1.296.x; cch=21fbe;"}],"max_tokens":9}`,
		},
		{
			name: "system string form",
			in:   `{"model":"m","messages":[],"system":"  x-anthropic-billing-header: cc_version=1; cch=00000;","max_tokens":9}`,
			want: `{"model":"m","messages":[],"system":"  x-anthropic-billing-header: cc_version=1; cch=51cb2;","max_tokens":9}`,
		},
		{
			// 只认第一个 canonical 头，后面的 system 示例保持原样。
			name: "two system blocks",
			in:   `{"model":"m","messages":[],"system":[{"text":"x-anthropic-billing-header: a; cch=00000;"},{"text":"x-anthropic-billing-header: b; cch=00000;"}],"max_tokens":9}`,
			want: `{"model":"m","messages":[],"system":[{"text":"x-anthropic-billing-header: a; cch=619b7;"},{"text":"x-anthropic-billing-header: b; cch=00000;"}],"max_tokens":9}`,
		},
		{
			name: "only message literal",
			in:   `{"model":"m","messages":[{"content":"x-anthropic-billing-header: cch=00000;"}]}`,
			want: `{"model":"m","messages":[{"content":"x-anthropic-billing-header: cch=00000;"}]}`,
		},
		{
			// 调用方已经带了非占位值时同样归一化后重算，与 cch.mjs 的注释一致。
			name: "caller supplied value",
			in:   `{"model":"m","messages":[],"system":[{"text":"x-anthropic-billing-header: cc_version=1; cch=abcde;"}],"max_tokens":9}`,
			want: `{"model":"m","messages":[],"system":[{"text":"x-anthropic-billing-header: cc_version=1; cch=6c74b;"}],"max_tokens":9}`,
		},
		{
			// 计费头不在块首行 → 不是 canonical，整体不动。
			name: "billing on second line",
			in:   `{"model":"m","messages":[],"system":[{"text":"line1\nx-anthropic-billing-header: cc_version=1; cch=00000;"}],"max_tokens":9}`,
			want: `{"model":"m","messages":[],"system":[{"text":"line1\nx-anthropic-billing-header: cc_version=1; cch=00000;"}],"max_tokens":9}`,
		},
		{
			// 五位十六进制后没有分号 → 不匹配。
			name: "no semicolon",
			in:   `{"model":"m","messages":[],"system":[{"text":"x-anthropic-billing-header: cc_version=1; cch=00000"}],"max_tokens":9}`,
			want: `{"model":"m","messages":[],"system":[{"text":"x-anthropic-billing-header: cc_version=1; cch=00000"}],"max_tokens":9}`,
		},
		{
			name: "no system at all",
			in:   `{"model":"m","messages":[]}`,
			want: `{"model":"m","messages":[]}`,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := StampCch(tc.in, true); got != tc.want {
				t.Fatalf("StampCch mismatch\n got: %s\nwant: %s", got, tc.want)
			}
		})
	}
}

func TestStampCchDisabledAndInvalid(t *testing.T) {
	body := `{"model":"m","messages":[],"system":[{"text":"x-anthropic-billing-header: cc_version=1; cch=00000;"}],"max_tokens":9}`
	if got := StampCch(body, false); got != body {
		t.Fatalf("disabled must return body untouched, got %s", got)
	}
	broken := `{"system":[{"text":"x-anthropic-billing-header: cch=00000;"}`
	if got := StampCch(broken, true); got != broken {
		t.Fatalf("invalid JSON must return body untouched, got %s", got)
	}
	// 顶层不是对象时同样不动。
	scalar := `[1,2,3]`
	if got := StampCch(scalar, true); got != scalar {
		t.Fatalf("non-object body must return body untouched, got %s", got)
	}
}

// 摘要材料不含 max_tokens / fallbacks / fallback_credit_token / model 值，
// 因此只在这几处不同的请求得到同一个 cch。
func TestStampCchIgnoresProjectedFields(t *testing.T) {
	a := `{"model":"m","messages":[],"system":[{"text":"x-anthropic-billing-header: cch=00000;"}],"max_tokens":9}`
	b := `{"model":"other","messages":[],"system":[{"text":"x-anthropic-billing-header: cch=00000;"}],"max_tokens":8192,"fallbacks":["x"]}`
	gotA, gotB := StampCch(a, true), StampCch(b, true)
	valA := cchValue(t, gotA)
	valB := cchValue(t, gotB)
	if valA != valB {
		t.Fatalf("cch must ignore projected fields: %s vs %s", valA, valB)
	}
}

// 重复 stamp 必须幂等：第二次把已有的 5 位十六进制归零后重算，结果不变。
func TestStampCchIdempotent(t *testing.T) {
	body := `{"model":"m","messages":[{"content":"x-anthropic-billing-header: cch=00000;"}],"system":[{"text":"x-anthropic-billing-header: cch=00000;"}],"max_tokens":9}`
	once := StampCch(body, true)
	twice := StampCch(once, true)
	if once != twice {
		t.Fatalf("not idempotent\n once: %s\ntwice: %s", once, twice)
	}
	if !strings.Contains(once, `"messages":[{"content":"x-anthropic-billing-header: cch=00000;"}]`) {
		t.Fatalf("message literal must stay untouched: %s", once)
	}
}

func cchValue(t *testing.T, body string) string {
	t.Helper()
	i := strings.Index(body, "cch=")
	if i < 0 {
		t.Fatalf("no cch in %s", body)
	}
	return body[i+len("cch=") : i+len("cch=")+5]
}
