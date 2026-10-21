package upstream

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"vm2api/native-slot/internal/credential"
	"vm2api/native-slot/internal/ojson"
)

// QuerySource 是槽位任务的来源标签。
const QuerySource = "agent:kin"

const defaultMaxTokens = 32000

// nativeOwnedFields 由宿主构造，不从调用方请求体直接复制。
var nativeOwnedFields = map[string]bool{
	"model": true, "messages": true, "system": true, "tools": true, "tool_choice": true,
	"thinking": true, "metadata": true, "max_tokens": true, "stream": true, "temperature": true,
	"top_p": true, "top_k": true, "stop_sequences": true, "betas": true, "wireMessages": true,
	"request_context": true, "output_config": true, "context_management": true, "safeguards": true,
	// 规格要求移除的内核内部字段。
	"wireBody": true, "auto_compact_window": true,
}

var callerOptionalFields = []string{"tools", "tool_choice", "thinking", "temperature", "top_p",
	"top_k", "stop_sequences", "context_management", "output_config", "safeguards"}

// Built 是组装完成的上游请求。
type Built struct {
	Body    []byte
	Header  http.Header
	Model   string
	Betas   []string
	Session string
}

// BuildInput 汇总组装所需的上下文。
type BuildInput struct {
	Request        *ojson.Object
	RequestContext *ojson.Object
	SessionID      string // 已解析的会话 ID，空则使用进程会话
	Credential     *credential.Credential
	Identity       *Identity
}

var bracket1mRe = regexp.MustCompile(`(?i)\[(1|2)m\]`)

func thinkingEnabled(v any) bool {
	t := ojson.Str(ojson.Obj(v).Get("type"))
	return t == "enabled" || t == "adaptive"
}

// Build 复刻 queryKinMessagesWithStreaming → queryModel → paramsFromContext 的
// 槽位路径：消息与工具原样透传，只加工 system、缓存标记、metadata 与 beta。
func Build(in BuildInput) (*Built, error) {
	wire := in.Request.Clone()
	model := ojson.Str(wire.Get("model"))
	if model == "" {
		model = os.Getenv("CLI_MODEL")
	}
	messages := wire.Get("messages")
	wireMessages, preserveMessages := messages.([]any)
	if !preserveMessages {
		messages = []any{}
	}
	toolsArr, preserveTools := wire.Get("tools").([]any)
	allTools := toolsArr
	if allTools == nil {
		allTools = []any{}
	}
	session := in.SessionID
	if session == "" {
		session = in.Identity.ProcessSession
	}

	// system
	var system []any
	rc := in.RequestContext
	fp := Fingerprint(firstUserText(wireMessages))
	subscriber := in.Credential.Subscriber()
	promptID := NewUUID()
	attr := func() string {
		opts := AttributionOptions{Fingerprint: fp}
		if subscriber {
			opts.Indexes, opts.Subagent = hasPrompt(wireMessages), true
			opts.PromptID, opts.TurnOrigin = promptID, TurnOrigin(QuerySource)
		}
		return Attribution(opts)
	}
	var kinWire []any
	if rc == nil {
		kinWire = wireSystemBlocks(wire.Get("system"))
	}
	switch {
	case kinWire != nil:
		system = kinWire
	case rc != nil:
		system = classifierSystemBlocks(wire.Get("system"), attr())
	default:
		strs := systemStrings(wire.Get("system"))
		if Layout() != "stock" {
			billing := billingFromSystem(strs)
			if billing == "" {
				billing = attr()
			}
			strs = layoutSystemBlocks(billing, leftoverFromSystem(strs))
		}
		system = buildSystemPromptBlocks(strs, promptCachingEnabled())
	}

	// beta
	betas := ModelBetas(model, subscriber)
	if rc == nil && !contains(betas, betaClaudeCode) {
		// isAgenticQuery：agent:* 来源且无分类器上下文。
		betas = append(betas, betaClaudeCode)
	}
	betas = MergeOfficialExtraBetas(betas)
	if !envTruthy("CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS") {
		betas = appendUnique(betas, betaPromptCachingScope)
	}
	var callerBetas []string
	for _, b := range ojson.Arr(wire.Get("betas")) {
		if s, ok := b.(string); ok {
			callerBetas = append(callerBetas, s)
		}
	}
	inferenceOnly := in.Credential.Bearer() && !in.Credential.HasScope("user:profile")
	requestBetas := betas
	if inferenceOnly {
		requestBetas = SetupTokenBetas(model)
	}
	requestBetas = append(append([]string(nil), requestBetas...), callerBetas...)

	// 缓存标记
	if rc == nil {
		requestTTL := explicitCacheTTL(system, allTools, messages)
		panelTTL, _ := panelSettings()
		ttl := requestTTL
		if ttl == "" {
			ttl = panelTTL
		}
		if ttl == "" {
			ttl = "1h"
		}
		// 新版 CLI 对全部段统一补 TTL、移除 thinking 标记并限制到四个断点。
		applyOwnedCacheMarkers(system, allTools, messages, ttl, false, false, false)
	}

	// metadata
	metadata := ojson.NewObject()
	if wm := ojson.Obj(wire.Get("metadata")); wm != nil {
		for _, k := range wm.Keys() {
			metadata.Set(k, wm.Get(k))
		}
	}
	metadata.Set("user_id", in.Identity.UserID(session, in.Credential.Bearer()))

	maxTokens := wire.Get("max_tokens")
	if _, ok := ojson.Num(maxTokens); !ok {
		maxTokens = json.Number("32000")
	}
	hasThinking := thinkingEnabled(wire.Get("thinking"))

	// assembleMessageRequest：先按宿主顺序放置，再按调用方字段补齐或删除。
	body := ojson.NewObject()
	body.Set("model", bracket1mRe.ReplaceAllString(model, ""))
	body.Set("messages", messages)
	body.Set("system", system)
	body.Set("tools", allTools)
	body.Set("tool_choice", wire.Get("tool_choice"))
	body.Set("metadata", metadata)
	body.Set("max_tokens", maxTokens)
	body.Set("thinking", wire.Get("thinking"))
	if _, ok := ojson.Num(wire.Get("temperature")); ok && !hasThinking {
		body.Set("temperature", wire.Get("temperature"))
	}
	for _, k := range []string{"top_p", "top_k"} {
		if _, ok := ojson.Num(wire.Get(k)); ok {
			body.Set(k, wire.Get(k))
		}
	}
	if _, ok := wire.Get("stop_sequences").([]any); ok {
		body.Set("stop_sequences", wire.Get("stop_sequences"))
	}
	if wire.Has("context_management") {
		body.Set("context_management", wire.Get("context_management"))
	}
	for _, k := range wire.Keys() {
		if !nativeOwnedFields[k] {
			body.Set(k, wire.Get(k))
		}
	}
	for _, k := range callerOptionalFields {
		if !wire.Has(k) {
			body.Delete(k)
		} else if k != "tools" || !preserveTools {
			body.Set(k, wire.Get(k))
		}
	}
	if wire.Get("safeguards") != nil {
		body.Set("safeguards", wire.Get("safeguards"))
	}
	if oc := ojson.Obj(wire.Get("output_config")); oc != nil && oc.Len() > 0 {
		body.Set("output_config", oc)
	}
	gated := WithRequestProtocolBetas(requestBetas, body)
	final := gated
	if !inferenceOnly {
		final = MergeOfficialExtraBetas(gated)
	}
	body.Set("stream", true)

	_, cchOn := panelSettings()
	raw := StampCch(string(ojson.Marshal(body)), cchOn)

	h := http.Header{}
	// SDK 默认 Accept 为 application/json；SSE 由请求体的 stream 控制。
	h.Set("Accept", "application/json")
	h.Set("Content-Type", "application/json")
	h.Set("anthropic-version", "2023-06-01")
	h.Set("anthropic-dangerous-direct-browser-access", "true")
	if len(final) > 0 {
		h.Set("anthropic-beta", strings.Join(final, ","))
	}
	in.Credential.Apply(h.Set)
	h.Set("X-Claude-Code-Session-Id", session)
	// SDK 在指纹覆盖前已写入毫秒 timeout；指纹函数的 600 仅用于缺省兜底。
	h.Set("x-stainless-timeout", strconv.FormatInt(apiTimeout().Milliseconds(), 10))
	ApplyOfficialHeaders(h, QuerySource)
	if FirstPartyBaseURL() {
		h.Set("x-client-request-id", NewUUID())
	}
	if envTruthy("CLAUDE_CODE_GATEWAY_HINT_HEADERS") {
		if m := hintPromptRe.FindStringSubmatch(raw); m != nil {
			h.Set("x-claude-code-prompt-id", m[1])
		}
	}
	for k, v := range customHeaders() {
		h.Set(k, v)
	}
	return &Built{Body: []byte(raw), Header: h, Model: model, Betas: final, Session: session}, nil
}

var hintPromptRe = regexp.MustCompile(`(?i)cc_prompt_id=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})`)

func promptCachingEnabled() bool { return !envTruthy("DISABLE_PROMPT_CACHING") }

// UserAgent 是槽位模式的官方 UA。
func UserAgent() string {
	return "claude-cli/" + CLIVersion() + " (external, " + envOr("CLAUDE_CODE_ENTRYPOINT", "cli") + ")"
}

// RequestClass 复刻 deriveClaudeCodeRequestClass。
func RequestClass(source string) string {
	switch {
	case source == "":
		return ""
	case source == "compact":
		return "compaction"
	case source == "side_reply":
		return "side_reply"
	case strings.HasPrefix(source, "repl_main_thread") || source == "sdk":
		return "main"
	case strings.HasPrefix(source, "agent:") || source == "hook_agent":
		return "subagent"
	}
	return "auxiliary"
}

var stainless = [][2]string{
	{"x-stainless-lang", "js"},
	{"x-stainless-os", "Linux"},
	{"x-stainless-arch", "x64"},
	{"x-stainless-runtime", "node"},
	{"x-stainless-runtime-version", "v26.3.0"},
	{"x-stainless-package-version", "0.128.0"},
}

// ApplyOfficialHeaders 应用 UA / x-app / 请求类别 / Stainless 覆盖规则。
func ApplyOfficialHeaders(h http.Header, source string) {
	if ua := h.Get("User-Agent"); ua == "" || strings.Contains(ua, "Bun/") || strings.Contains(strings.ToLower(ua), "axios/") {
		h.Set("User-Agent", UserAgent())
	}
	if h.Get("x-app") == "" {
		if os.Getenv("CLAUDE_CODE_SESSION_KIND") == "bg" {
			h.Set("x-app", "cli-bg")
		} else {
			h.Set("x-app", "cli")
		}
	}
	if rc := RequestClass(source); rc != "" && h.Get("x-claude-code-request-class") == "" {
		h.Set("x-claude-code-request-class", rc)
	}
	for _, kv := range stainless {
		h.Set(kv[0], kv[1])
	}
	if h.Get("x-stainless-retry-count") == "" {
		h.Set("x-stainless-retry-count", "0")
	}
	if h.Get("x-stainless-timeout") == "" {
		h.Set("x-stainless-timeout", "600")
	}
}

func customHeaders() map[string]string {
	out := map[string]string{}
	for _, line := range regexp.MustCompile(`\r?\n`).Split(os.Getenv("ANTHROPIC_CUSTOM_HEADERS"), -1) {
		if strings.TrimSpace(line) == "" {
			continue
		}
		name, value, ok := strings.Cut(line, ":")
		if !ok {
			continue
		}
		if name = strings.TrimSpace(name); name != "" {
			out[name] = strings.TrimSpace(value)
		}
	}
	return out
}

// BaseURL 是上游基址：ANTHROPIC_BASE_URL 或官方地址。
func BaseURL() string {
	if v := strings.TrimSpace(os.Getenv("ANTHROPIC_BASE_URL")); v != "" {
		return strings.TrimRight(v, "/")
	}
	return "https://api.anthropic.com"
}

// FirstPartyBaseURL 判断是否为官方基址。
func FirstPartyBaseURL() bool {
	return BaseURL() == "https://api.anthropic.com"
}

// ConfigDir 是 CLI 配置目录：CLAUDE_CONFIG_DIR 或 ~/.claude。
func ConfigDir() string {
	if v := os.Getenv("CLAUDE_CONFIG_DIR"); v != "" {
		return v
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".claude")
}
