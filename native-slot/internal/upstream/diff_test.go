package upstream

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"vm2api/native-slot/internal/classifier"
	"vm2api/native-slot/internal/ojson"
)

// 差分测试：同一批用例分别交给现网 cli-node 的 JS 模块与本实现，输出必须逐字节一致。
// 本机没有 node 时跳过。

type diffCase struct {
	Op string `json:"op"`
	// 原始 JSON 字段，按 op 解释。
	Body        json.RawMessage `json:"body,omitempty"`
	Tokens      []string        `json:"tokens"`
	Merge       bool            `json:"merge,omitempty"`
	Text        string          `json:"text,omitempty"`
	System      json.RawMessage `json:"system,omitempty"`
	Attribution string          `json:"attribution,omitempty"`
	Ctx         json.RawMessage `json:"ctx,omitempty"`
	Request     json.RawMessage `json:"request,omitempty"`
	Params      json.RawMessage `json:"params,omitempty"`
	TTL         string          `json:"ttl,omitempty"`
	Preserve    map[string]bool `json:"preserve,omitempty"`
	Parts       json.RawMessage `json:"parts,omitempty"`
	Model       string          `json:"model,omitempty"`
	Fingerprint string          `json:"fingerprint,omitempty"`
	Subscriber  bool            `json:"subscriber,omitempty"`
	Opts        json.RawMessage `json:"opts,omitempty"`
	// Env 为每个用例单独设置的进程环境；测试前后自动恢复。
	Env map[string]*string `json:"env,omitempty"`
}

func runReference(t *testing.T, cases []diffCase) []string {
	t.Helper()
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("node not found; skipping differential test")
	}
	// 参考实现由现网 cli-node 模块拼接，不入库；本地有 testdata/jsref 时才跑差分。
	ref := filepath.Join("..", "..", "testdata", "jsref", "ref.cjs")
	if _, err := os.Stat(filepath.Join("..", "..", "testdata", "jsref", "modules.cjs")); err != nil {
		t.Skip("testdata/jsref not present; skipping differential test")
	}
	in, _ := json.Marshal(cases)
	cmd := exec.Command(node, ref)
	cmd.Stdin = bytes.NewReader(in)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		t.Fatalf("reference failed: %v\n%s", err, stderr.String())
	}
	var res []string
	if err := json.Unmarshal(out, &res); err != nil {
		t.Fatalf("decode reference: %v", err)
	}
	return res
}

func mustParse(t *testing.T, raw json.RawMessage) any {
	t.Helper()
	if len(raw) == 0 {
		return nil
	}
	v, err := ojson.Parse(raw)
	if err != nil {
		t.Fatalf("parse %s: %v", raw, err)
	}
	return v
}

func goResult(t *testing.T, c diffCase) string {
	switch c.Op {
	case "apiGates", "attribution":
		// 先清掉会影响 attribution 的变量，再按用例设置，避免宿主环境污染。
		for _, k := range []string{"CLAUDE_CODE_VERSION", "CLAUDE_CODE_ENTRYPOINT", "CLAUDE_CODE_ATTRIBUTION_HEADER",
			"CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_FOUNDRY"} {
			prev, had := os.LookupEnv(k)
			_ = os.Unsetenv(k)
			defer func(k, prev string, had bool) {
				if had {
					_ = os.Setenv(k, prev)
				} else {
					_ = os.Unsetenv(k)
				}
			}(k, prev, had)
		}
		for k, v := range c.Env {
			if v == nil {
				_ = os.Unsetenv(k)
				continue
			}
			_ = os.Setenv(k, *v)
		}
		if c.Op == "apiGates" {
			cch, sub := APIGates(c.Subscriber)
			return string(ojson.Marshal(map[string]bool{"includeCch": cch, "includeSubscriberFields": sub}))
		}
		return string(ojson.Marshal(Attribution(attributionOptions(t, c))))
	}
	switch c.Op {
	case "cch":
		var s string
		_ = json.Unmarshal(c.Body, &s)
		return string(ojson.Marshal(StampCch(s, true)))
	case "betas":
		body := ojson.Obj(mustParse(t, c.Body))
		g := WithRequestProtocolBetas(c.Tokens, body)
		if c.Merge {
			g = MergeOfficialExtraBetas(g)
		}
		return string(ojson.Marshal(g))
	case "merge":
		return string(ojson.Marshal(MergeOfficialExtraBetas(c.Tokens)))
	case "zero":
		return string(ojson.Marshal(finalizeZeroBilling(c.Text)))
	case "cchPlaceholder":
		return string(ojson.Marshal(withCchPlaceholder(c.Text)))
	case "wire":
		w := wireSystemBlocks(mustParse(t, c.System))
		if w == nil {
			return "null"
		}
		return string(ojson.Marshal(w))
	case "classifierSystem":
		return string(ojson.Marshal(classifierSystemBlocks(mustParse(t, c.System), c.Attribution)))
	case "classifierValid":
		return fmt.Sprint(classifier.Valid(ojson.Obj(mustParse(t, c.Ctx)), ojson.Obj(mustParse(t, c.Request))))
	case "cache":
		p := ojson.Obj(mustParse(t, c.Params))
		applyOwnedCacheMarkers(p.Get("system"), p.Get("tools"), p.Get("messages"), c.TTL,
			c.Preserve["preserveSystem"], c.Preserve["preserveTools"], c.Preserve["preserveMessages"])
		return string(ojson.Marshal(p))
	case "explicitTtl":
		parts := ojson.Arr(mustParse(t, c.Parts))
		ttl := explicitCacheTTL(parts...)
		if ttl == "" {
			return "null"
		}
		return string(ojson.Marshal(ttl))
	case "leftover":
		strs := []string{}
		for _, v := range ojson.Arr(mustParse(t, c.System)) {
			strs = append(strs, ojson.Str(v))
		}
		l := leftoverFromSystem(strs)
		if l == "" {
			return "null"
		}
		return string(ojson.Marshal(l))
	case "setupBetas":
		return string(ojson.Marshal(strings.Join(SetupTokenBetas(c.Model), ",")))
	}
	t.Fatalf("unknown op %s", c.Op)
	return ""
}

// attributionOpts 对应 getAttributionHeader 的 opts（prompt/turn 下标为可选）。
type attributionOpts struct {
	IncludeCch              bool   `json:"includeCch"`
	IncludeSubscriberFields bool   `json:"includeSubscriberFields"`
	IsSubagent              bool   `json:"isSubagent"`
	PromptId                string `json:"promptId"`
	PrevReqId               string `json:"prevReqId"`
	TurnOrigin              string `json:"turnOrigin"`
	PromptIndex             *int   `json:"promptIndex"`
	TurnIndex               *int   `json:"turnIndex"`
}

func attributionOptions(t *testing.T, c diffCase) AttributionOptions {
	t.Helper()
	var o attributionOpts
	if len(c.Opts) > 0 {
		if err := json.Unmarshal(c.Opts, &o); err != nil {
			t.Fatalf("parse opts %s: %v", c.Opts, err)
		}
	}
	opts := AttributionOptions{
		Fingerprint: c.Fingerprint, Subagent: o.IsSubagent, PromptID: o.PromptId,
		TurnOrigin: o.TurnOrigin, PrevReqID: o.PrevReqId,
		IncludeCch: o.IncludeCch, IncludeSubscriberFields: o.IncludeSubscriberFields,
	}
	if o.PromptIndex != nil && o.TurnIndex != nil {
		opts.Indexes, opts.PromptIndex, opts.TurnIndex = true, *o.PromptIndex, *o.TurnIndex
	}
	return opts
}

func strp(s string) *string { return &s }

func raw(s string) json.RawMessage { return json.RawMessage(s) }

func jsonString(s string) json.RawMessage { b, _ := json.Marshal(s); return b }

func cchBodies() []diffCase {
	r := rand.New(rand.NewSource(7))
	texts := []string{"hi", "中文内容 🐱", "line\nbreak\t\"quoted\"", " sep ", "<script>&amp;</script>", strings.Repeat("x", 300)}
	nums := []string{"1", "1.0", "1.50", "1e3", "-0", "0.000001", "1e-7", "123456789012345678901", "3.14159"}
	var cases []diffCase
	for i := 0; i < 60; i++ {
		text := texts[r.Intn(len(texts))]
		num := nums[r.Intn(len(nums))]
		model := []string{"claude-sonnet-5-5", "claude-opus-5-5[1m]", `we\"ird`}[r.Intn(3)]
		extra := ""
		switch r.Intn(4) {
		case 0:
			extra = `, "fallbacks": [{"model": "claude-haiku-5-5", "x": ["]", "[" ]}], "fallback_credit_token": "tok\"en"`
		case 1:
			extra = `, "fallbacks": "default"`
		case 2:
			extra = `, "temperature": ` + num
		}
		body := fmt.Sprintf(`{ "model": %q, "messages": [ {"role": "user", "content": %s} ],
  "system": [ {"type": "text", "text": "x-anthropic-billing-header: cc_version=2.1.296.abc; cc_entrypoint=sdk-cli; cch=00000; cc_is_subagent=true;"},
  {"type": "text", "text": "# Environment\n - Timezone: Asia/Taipei", "cache_control": {"type": "ephemeral", "ttl": "1h"}} ],
  "metadata": {"user_id": "{\"device_id\":\"d\",\"session_id\":\"s\"}"}, "max_tokens": %d, "n": %s%s, "stream": true }`,
			model, jsonString(text), 1000+r.Intn(64000), num, extra)
		cases = append(cases, diffCase{Op: "cch", Body: jsonString(body)})
	}
	// 已经填过的 cch、没有计费头、计费头不在 system 中。
	cases = append(cases,
		diffCase{Op: "cch", Body: jsonString(`{"system":[{"text":"x-anthropic-billing-header: cc_version=1; cch=abcde;"}],"max_tokens":5}`)},
		diffCase{Op: "cch", Body: jsonString(`{"a":"no billing","max_tokens":9}`)},
		diffCase{Op: "cch", Body: jsonString(`{"messages":[{"content":"x-anthropic-billing-header: cch=00000;"}],"model":"m"}`)},
	)
	return cases
}

// attributionCases：attributionGates 的 provider × 订阅者矩阵，以及
// getAttributionHeader 的字段门控与 env 分支。
func attributionCases() []diffCase {
	full := raw(`{"includeCch":true,"includeSubscriberFields":true,"isSubagent":true,
		"promptId":"6f1c0000-0000-4000-8000-000000000000","turnOrigin":"sdk_cli","promptIndex":0,"turnIndex":1}`)
	keyOnly := raw(`{"isSubagent":true,"promptId":"6f1c0000-0000-4000-8000-000000000000","turnOrigin":"sdk_cli"}`)
	cases := []diffCase{
		{Op: "apiGates", Subscriber: true},
		{Op: "apiGates", Subscriber: false},
		{Op: "apiGates", Subscriber: true, Env: map[string]*string{"CLAUDE_CODE_USE_VERTEX": strp("1")}},
		{Op: "apiGates", Subscriber: false, Env: map[string]*string{"CLAUDE_CODE_USE_VERTEX": strp("true")}},
		{Op: "apiGates", Subscriber: true, Env: map[string]*string{"CLAUDE_CODE_USE_BEDROCK": strp("yes")}},
		{Op: "apiGates", Subscriber: true, Env: map[string]*string{"CLAUDE_CODE_USE_FOUNDRY": strp("on")}},
		{Op: "apiGates", Subscriber: true, Env: map[string]*string{
			"CLAUDE_CODE_USE_VERTEX": strp("1"), "CLAUDE_CODE_USE_BEDROCK": strp("1")}},
		{Op: "attribution", Fingerprint: "abc123", Opts: full},
		{Op: "attribution", Fingerprint: "abc123", Opts: keyOnly},
		{Op: "attribution", Fingerprint: "abc123", Opts: full,
			Env: map[string]*string{"CLAUDE_CODE_ENTRYPOINT": strp("sdk-cli"),
				"CLAUDE_CODE_VERSION": strp("2.1.303 (Claude Code)")}},
		{Op: "attribution", Fingerprint: "abc123", Opts: full,
			Env: map[string]*string{"CLAUDE_CODE_ENTRYPOINT": nil}},
		{Op: "attribution", Fingerprint: "abc123", Opts: full,
			Env: map[string]*string{"CLAUDE_CODE_ATTRIBUTION_HEADER": strp("0")}},
		{Op: "attribution", Fingerprint: "abc123", Opts: full,
			Env: map[string]*string{"CLAUDE_CODE_ATTRIBUTION_HEADER": strp(" off ")}},
		{Op: "attribution", Fingerprint: "abc123", Opts: raw(`{"includeCch":true,"includeSubscriberFields":true,
			"promptId":"not-a-uuid","turnOrigin":"sdk-cli"}`)},
		{Op: "attribution", Fingerprint: "abc123", Opts: raw(`{"includeCch":true,"includeSubscriberFields":true,
			"promptId":"6f1c0000-0000-4000-8000-000000000000","prevReqId":"req_abc-1","promptIndex":0,"turnIndex":1}`)},
		{Op: "attribution", Fingerprint: "abc123", Opts: raw(`{"includeCch":true,"includeSubscriberFields":true,
			"prevReqId":"bad id","promptIndex":20000000,"turnIndex":1}`)},
		{Op: "attribution", Fingerprint: "abc123", Opts: raw(`{"includeCch":true,"includeSubscriberFields":true,
			"promptIndex":0,"turnIndex":0}`)},
	}
	return cases
}

func TestDifferentialAgainstOfficialModules(t *testing.T) {
	cases := cchBodies()
	cases = append(cases, attributionCases()...)
	cases = append(cases,
		diffCase{Op: "merge", Tokens: []string{"x-1", "effort-2025-11-24", "claude-code-20250219"}},
		diffCase{Op: "merge", Tokens: []string{}},
		diffCase{Op: "betas", Merge: true, Tokens: []string{"oauth-2025-04-20", "claude-code-20250219", "oauth-2025-04-20"},
			Body: raw(`{"model":"anthropic/claude-sonnet-5-5-20260101[1m]","output_config":{"effort":"high","format":{"type":"json"}},
			"thinking":{"display":"updates","block_binding":{}},"safeguards":[{"type":"dangerous_tool_use"}],"context_management":{},
			"speed":"fast","tools":[{"name":"a","strict":true},{"name":"b","defer_loading":true},{"type":"tool_search_tool_regex"}],
			"thread":{},"diagnostics":0,"fallbacks":["x"],"fallback_credit_token":"t","cache_control":{"evict_on_complete":true},
			"messages":[{"role":"system","clear_at":1,"output_config":{"effort":"low","format":"x","task_budget":{}}},
			{"role":"user","content":[{"type":"text","cache_control":{"ttl":"1h"}}]}]}`)},
		diffCase{Op: "betas", Merge: false, Tokens: []string{"oauth-2025-04-20"}, Body: raw(`{"model":"claude-opus-5-5","speed":"fast","fallbacks":[]}`)},
		diffCase{Op: "betas", Merge: true, Tokens: []string{"z"}, Body: raw(`{"model":"claude-haiku-4-5","system":[{"cache_control":{"ttl":"1h"}}]}`)},
		diffCase{Op: "zero", Text: "  x-anthropic-billing-header: cc_version=2.1.296.abc; cc_entrypoint=sdk-cli; cch=00000; cc_prompt_id=6f1c0000-0000-4000-8000-000000000000; prompt_version=<old>;  "},
		diffCase{Op: "zero", Text: "cc_version=1; cc_prompt_id=x; CCH=12345"},
		diffCase{Op: "cchPlaceholder", Text: "x-anthropic-billing-header: cc_version=9.9.9; cch=abcde;"},
		diffCase{Op: "cchPlaceholder", Text: "x-anthropic-billing-header: cc_version=9.9.9"},
		diffCase{Op: "wire", System: raw(`[{"type":"text","text":"x-anthropic-billing-header: cc_version=9.9.9; cch=abcde;"},{"type":"text","text":"自定义","cache_control":{"type":"ephemeral"},"citations":[]}]`)},
		diffCase{Op: "wire", System: raw(`[{"type":"text","text":"plain"}]`)},
		diffCase{Op: "wire", System: raw(`[{"type":"text","text":"You are Claude Code, Anthropic's official CLI for Claude.","cache_control":{"type":"ephemeral","ttl":"5m"}},{"type":"text","text":"调用方提示","cache_control":{"type":"ephemeral","ttl":"5m"}}]`)},
		diffCase{Op: "wire", System: raw(`[{"text":""}]`)},
		diffCase{Op: "wire", System: raw(`[{"text":123}]`)},
		diffCase{Op: "wire", System: raw(`[{"text":"plain"},{}]`)},
		diffCase{Op: "wire", System: raw(`[]`)},
		diffCase{Op: "wire", System: raw(`"x-anthropic-billing-header: string form"`)},
		diffCase{Op: "classifierSystem", System: raw(`[{"type":"text","text":"  x-anthropic-billing-header: a"},{"type":"text","text":"keep"}]`), Attribution: "x-anthropic-billing-header: cli;"},
		diffCase{Op: "classifierSystem", System: raw(`"just text"`), Attribution: ""},
		diffCase{Op: "classifierValid", Ctx: raw(`{"purpose":"auto_mode_classifier","format":"xml","stage":"xml_s2"}`), Request: raw(`{"messages":[{"role":"user","content":"<transcript>x"}]}`)},
		diffCase{Op: "classifierValid", Ctx: raw(`{"purpose":"auto_mode_classifier","format":"xml"}`), Request: raw(`{"messages":[{"role":"user","content":"none"}]}`)},
		diffCase{Op: "classifierValid", Ctx: raw(`{"purpose":"auto_mode_classifier","format":"tool"}`), Request: raw(`{"tool_choice":{"type":"tool","name":"classify_result"},"tools":[{"name":"classify_result"}]}`)},
		diffCase{Op: "classifierValid", Ctx: raw(`{"purpose":"auto_mode_classifier","format":"tool","stage":"fast"}`), Request: raw(`{"tool_choice":{"type":"tool","name":"classify_result"},"tools":[{"name":"classify_result"}]}`)},
		diffCase{Op: "classifierValid", Ctx: raw(`{"purpose":"auto_mode_classifier","format":"xml","extra":1}`), Request: raw(`{"messages":"<transcript>"}`)},
		diffCase{Op: "explicitTtl", Parts: raw(`[[{"cache_control":{"ttl":"1h"}}],[],[{"content":[{"cache_control":{"ttl":" 5M "}}]}]]`)},
		diffCase{Op: "explicitTtl", Parts: raw(`[[{"cache_control":{"type":"ephemeral"}}],null,[]]`)},
		diffCase{Op: "leftover", System: raw(`["x-anthropic-billing-header: a","You are a Claude agent, built on Anthropic's Claude Agent SDK.","# Environment\n - Timezone: X","  keep me  ","persistent Kin agent","","second"]`)},
		diffCase{Op: "leftover", System: raw(`["# Environment"]`)},
		diffCase{Op: "setupBetas", Model: "claude-haiku-4-5"},
		diffCase{Op: "setupBetas", Model: "claude-haiku-5-5"},
	)
	// 缓存 marker：保留段计入上限、只改宿主自有段。
	cases = append(cases, diffCase{Op: "cache", TTL: "1h", Params: raw(`{"system":[{"type":"text","text":"plain","cache_control":{"type":"ephemeral"}}],"messages":[{"role":"user","content":[{"type":"text","text":"hi","cache_control":{"type":"ephemeral"}}]}]}`)})
	cacheParams := `{"system":[{"type":"text","text":"b"},{"type":"text","text":"e","cache_control":{"type":"ephemeral","scope":"org"}}],
	 "tools":[{"name":"t1","cache_control":{"type":"ephemeral"}},{"name":"t2","cache_control":{"type":"ephemeral","ttl":"5m"}},{"name":"t3","cache_control":{"type":"other"}}],
	 "messages":[{"role":"assistant","content":[{"type":"thinking","thinking":"x","cache_control":{"type":"ephemeral"}},{"type":"text","text":"a","cache_control":{}}]},
	 {"role":"user","content":[{"type":"text","text":"u1","cache_control":{"type":"ephemeral","ttl":"bad","scope":"global"}},{"type":"text","text":"u2","cache_control":{"type":"ephemeral"}}]},
	 {"role":"user","content":"plain"}]}`
	for _, pv := range []map[string]bool{
		{},
		{"preserveMessages": true},
		{"preserveMessages": true, "preserveTools": true},
		{"preserveSystem": true, "preserveTools": true, "preserveMessages": true},
		{"preserveTools": true},
	} {
		for _, ttl := range []string{"1h", "5m"} {
			cases = append(cases, diffCase{Op: "cache", Params: raw(cacheParams), TTL: ttl, Preserve: pv})
		}
	}
	want := runReference(t, cases)
	t.Logf("对照已提取的 CLI 参考模块验证 %d 个用例", len(cases))
	if len(want) != len(cases) {
		t.Fatalf("reference returned %d results for %d cases", len(want), len(cases))
	}
	for i, c := range cases {
		got := goResult(t, c)
		if got != want[i] {
			t.Errorf("case %d (%s) mismatch\n go: %s\n js: %s", i, c.Op, got, want[i])
		}
	}
}
