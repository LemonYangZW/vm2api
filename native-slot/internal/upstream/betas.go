package upstream

import (
	"os"
	"regexp"
	"strings"

	"vm2api/native-slot/internal/ojson"
)

const (
	betaClaudeCode            = "claude-code-20250219"
	betaOAuth                 = "oauth-2025-04-20"
	betaContext1M             = "context-1m-2025-08-07"
	betaInterleaved           = "interleaved-thinking-2025-05-14"
	betaThinkingTokenCount    = "thinking-token-count-2026-05-13"
	betaContextManagement     = "context-management-2025-06-27"
	betaPromptCachingScope    = "prompt-caching-scope-2026-01-05"
	betaMidConvSystem         = "mid-conversation-system-2026-04-07"
	betaMidConvSystemClearAt  = "mid-conversation-system-clear-at-2026-08-21"
	betaMidConvToolChanges    = "mid-conversation-tool-changes-2026-07-01"
	betaMidConvOutputConfig   = "mid-conversation-output-config-2026-07-01"
	betaPerTurnControl        = "per-turn-control-2026-07-01"
	betaEffort                = "effort-2025-11-24"
	betaThinkingDisplayUpdate = "thinking-display-updates-2026-08-18"
	betaDangerousToolUse      = "dangerous-tool-use-2026-09-03"
	betaStructuredOutputs     = "structured-outputs-2025-12-15"
	betaTaskBudgets           = "task-budgets-2026-03-13"
	betaFastMode              = "fast-mode-2026-02-01"
	betaAdvancedToolUse       = "advanced-tool-use-2025-11-20"
	betaThinkingBinding       = "thinking-binding-controls-2026-08-01"
	betaMessageThreads        = "message-threads-2026-08-12"
	betaCacheDiagnosis        = "cache-diagnosis-2026-04-07"
	betaFallbackDefault       = "server-side-fallback-2026-07-01"
	betaFallbackList          = "server-side-fallback-2026-06-01"
	betaFallbackCredit        = "fallback-credit-2026-06-01"
	betaCacheEvict            = "prompt-caching-evict-2026-05-12"
	betaExtendedCacheTTL      = "extended-cache-ttl-2025-04-11"
)

// officialMessageBetas 的顺序就是 kin 重排的排序键。
var officialMessageBetas = []string{
	betaClaudeCode, betaOAuth, betaInterleaved, betaThinkingTokenCount, betaContextManagement,
	betaPromptCachingScope, betaMidConvSystem, betaPerTurnControl, betaMidConvToolChanges, betaEffort,
}

var officialExtraBetas = []string{betaThinkingTokenCount, betaMidConvSystem}

var (
	perTurnModels = set("claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1")
	midToolModels = set("claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-4-8", "claude-opus-5",
		"claude-opus-5-5", "claude-fable-5", "claude-fable-5-1", "claude-mythos-5-1")
	fastModeModels = set("claude-opus-4-8", "claude-opus-5", "claude-opus-5-5")
	// midOutputModels：只有这些模型带 thread 时才需要 mid-conversation-output-config。
	midOutputModels = set("claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5", "claude-opus-5-5",
		"claude-fable-5-1", "claude-mythos-5-1")
)

func set(items ...string) map[string]bool {
	m := make(map[string]bool, len(items))
	for _, s := range items {
		m[s] = true
	}
	return m
}

func contains(list []string, s string) bool {
	for _, v := range list {
		if v == s {
			return true
		}
	}
	return false
}

func appendUnique(list []string, s string) []string {
	if s == "" || contains(list, s) {
		return list
	}
	return append(list, s)
}

// MergeOfficialExtraBetas 补齐 OFFICIAL_EXTRA_BETAS 后按官方顺序前置。
func MergeOfficialExtraBetas(betas []string) []string {
	have := append([]string(nil), betas...)
	for _, b := range officialExtraBetas {
		if !contains(have, b) {
			have = append(have, b)
		}
	}
	out := make([]string, 0, len(have))
	for _, b := range officialMessageBetas {
		if contains(have, b) {
			out = append(out, b)
		}
	}
	for _, b := range have {
		if !contains(out, b) {
			out = append(out, b)
		}
	}
	return out
}

// IsLegacyHaiku 判定含 haiku 但不含 haiku-5 的模型。
func IsLegacyHaiku(model string) bool {
	m := strings.ToLower(model)
	return strings.Contains(m, "haiku") && !strings.Contains(m, "haiku-5")
}

// SetupTokenBetas 用于凭据缺少 user:profile scope 的情形。
func SetupTokenBetas(model string) []string {
	if IsLegacyHaiku(model) {
		return []string{betaOAuth, betaInterleaved}
	}
	return []string{betaOAuth, betaInterleaved, betaContextManagement}
}

func envTruthy(name string) bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv(name))) {
	case "1", "true", "yes", "on":
		return true
	}
	return false
}

func canonicalModel(model string) string {
	return strings.ToLower(strings.TrimSpace(model))
}

var oneMRe = regexp.MustCompile(`(?i)\[1m\]`)

// ModelBetas 复刻 getAllModelBetas 在第一方、非交互会话下的结果。
func ModelBetas(model string, subscriber bool) []string {
	canonical := canonicalModel(model)
	isHaiku := IsLegacyHaiku(canonical)
	firstPartyOnly := !envTruthy("CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS")
	supportsISP := !strings.Contains(canonical, "claude-3-")
	var out []string
	if !isHaiku {
		out = append(out, betaClaudeCode)
	}
	if subscriber {
		out = append(out, betaOAuth)
	}
	if oneMRe.MatchString(model) && !envTruthy("CLAUDE_CODE_DISABLE_1M_CONTEXT") {
		out = append(out, betaContext1M)
	}
	if !envTruthy("DISABLE_INTERLEAVED_THINKING") && supportsISP {
		out = append(out, betaInterleaved)
	}
	if firstPartyOnly && !isHaiku {
		out = append(out, betaThinkingTokenCount)
	}
	if firstPartyOnly && supportsISP {
		out = append(out, betaContextManagement)
	}
	if firstPartyOnly {
		out = append(out, betaPromptCachingScope, betaMidConvSystem)
	}
	if extra := os.Getenv("ANTHROPIC_BETAS"); extra != "" {
		for _, b := range strings.Split(extra, ",") {
			if b = strings.TrimSpace(b); b != "" {
				out = append(out, b)
			}
		}
	}
	return out
}

var dateSuffixRe = regexp.MustCompile(`-\d{8}$`)

func protocolModel(model string) string {
	if i := strings.LastIndex(model, "/"); i >= 0 {
		model = model[i+1:]
	}
	model = oneMRe.ReplaceAllString(model, "")
	return dateSuffixRe.ReplaceAllString(model, "")
}

func hasHourCache(v any) bool {
	switch x := v.(type) {
	case []any:
		for _, e := range x {
			if hasHourCache(e) {
				return true
			}
		}
	case *ojson.Object:
		if ojson.Str(ojson.Obj(x.Get("cache_control")).Get("ttl")) == "1h" {
			return true
		}
		return hasHourCache(x.Get("content"))
	}
	return false
}

// WithRequestProtocolBetas 按请求体字段追加协议 beta（先去重）。
func WithRequestProtocolBetas(tokens []string, body *ojson.Object) []string {
	var betas []string
	for _, t := range tokens {
		betas = appendUnique(betas, t)
	}
	add := func(t string) { betas = appendUnique(betas, t) }
	model := protocolModel(ojson.Str(body.Get("model")))
	if perTurnModels[model] {
		add(betaPerTurnControl)
	}
	if midToolModels[model] {
		add(betaMidConvToolChanges)
	}
	// 官方 claude-code-betas.mjs：thread 只在特定模型上拉 mid-conversation-output-config。
	if body.Get("thread") != nil && midOutputModels[model] {
		add(betaMidConvOutputConfig)
	}
	oc := ojson.Obj(body.Get("output_config"))
	if oc != nil && oc.Get("effort") != nil {
		add(betaEffort)
	}
	thinking := ojson.Obj(body.Get("thinking"))
	if ojson.Str(thinking.Get("display")) == "updates" {
		add(betaThinkingDisplayUpdate)
	}
	for _, item := range ojson.Arr(body.Get("safeguards")) {
		if ojson.Str(ojson.Obj(item).Get("type")) == "dangerous_tool_use" {
			add(betaDangerousToolUse)
			break
		}
	}
	if oc != nil && ojson.Truthy(oc.Get("format")) {
		add(betaStructuredOutputs)
	}
	if oc != nil && ojson.Truthy(oc.Get("task_budget")) {
		add(betaTaskBudgets)
	}
	if ojson.Truthy(body.Get("context_management")) {
		add(betaContextManagement)
	}
	if ojson.Str(body.Get("speed")) == "fast" && fastModeModels[model] {
		add(betaFastMode)
	}
	for _, t := range ojson.Arr(body.Get("tools")) {
		tool := ojson.Obj(t)
		if tool == nil {
			continue
		}
		if b, ok := tool.Get("strict").(bool); ok && b {
			add(betaStructuredOutputs)
		}
		if ojson.Truthy(tool.Get("defer_loading")) || strings.HasPrefix(ojson.Str(tool.Get("type")), "tool_search_tool_") {
			add(betaAdvancedToolUse)
		}
	}
	if ojson.Truthy(thinking.Get("block_binding")) {
		add(betaThinkingBinding)
	}
	if body.Get("thread") != nil {
		add(betaMessageThreads)
	}
	if body.Get("diagnostics") != nil {
		add(betaCacheDiagnosis)
	}
	if fb := body.Get("fallbacks"); ojson.Str(fb) == "default" {
		add(betaFallbackDefault)
	} else if len(ojson.Arr(fb)) > 0 {
		add(betaFallbackList)
	}
	if tok, ok := body.Get("fallback_credit_token").(string); ok && len(utf16Len(tok)) > 0 && len(utf16Len(tok)) <= 2048 {
		add(betaFallbackCredit)
	}
	if ojson.Truthy(ojson.Obj(body.Get("cache_control")).Get("evict_on_complete")) {
		add(betaCacheEvict)
	}
	if hasHourCache(body) || hasHourCache(body.Get("system")) || hasHourCache(body.Get("tools")) || hasHourCache(body.Get("messages")) {
		add(betaExtendedCacheTTL)
	}
	var hasSystem, hasClearAt, hasOC, hasEffort, hasFormat, hasBudget bool
	for _, m := range ojson.Arr(body.Get("messages")) {
		msg := ojson.Obj(m)
		if msg == nil {
			continue
		}
		if ojson.Str(msg.Get("role")) == "system" {
			hasSystem = true
		}
		if msg.Get("clear_at") != nil {
			hasClearAt = true
		}
		cfg := ojson.Obj(msg.Get("output_config"))
		if cfg == nil {
			continue
		}
		hasOC = true
		if cfg.Get("effort") != nil {
			hasEffort = true
		}
		if ojson.Truthy(cfg.Get("format")) {
			hasFormat = true
		}
		if ojson.Truthy(cfg.Get("task_budget")) {
			hasBudget = true
		}
	}
	if hasSystem {
		add(betaMidConvSystem)
	}
	if hasClearAt {
		add(betaMidConvSystemClearAt)
	}
	if hasOC {
		add(betaMidConvOutputConfig)
	}
	if hasEffort {
		add(betaEffort)
	}
	if hasFormat {
		add(betaStructuredOutputs)
	}
	if hasBudget {
		add(betaTaskBudgets)
	}
	return betas
}

// utf16Len 返回 JS 字符串长度语义下的码元切片（只用于计长）。
func utf16Len(s string) []struct{} {
	n := 0
	for _, r := range s {
		if r >= 0x10000 {
			n += 2
		} else {
			n++
		}
	}
	return make([]struct{}, n)
}
