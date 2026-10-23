package upstream

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"regexp"
	"strings"
	"sync"
	"unicode/utf16"

	"vm2api/native-slot/internal/ojson"
)

// IdentitySentence 是 Agent SDK 的身份句。
const IdentitySentence = "You are a Claude agent, built on Anthropic's Claude Agent SDK."

const (
	defaultPrefix      = "You are Claude Code, Anthropic's official CLI for Claude."
	sdkPresetPrefix    = "You are Claude Code, Anthropic's official CLI for Claude, running within the Claude Agent SDK."
	fingerprintSalt    = "59cf53e54c78"
	fingerprintVersion = "2.1.296"
)

var cliPrefixes = map[string]bool{defaultPrefix: true, sdkPresetPrefix: true, IdentitySentence: true}

// Layout 读取 CLAUDE_CODE_SYSTEM_LAYOUT / SYSTEM_MODE。
func Layout() string {
	raw := os.Getenv("CLAUDE_CODE_SYSTEM_LAYOUT")
	if raw == "" {
		raw = os.Getenv("SYSTEM_MODE")
	}
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "zero":
		return "zero"
	case "identity", "id", "block":
		return "identity"
	}
	return "stock"
}

// Timezone：CLAUDE_CODE_TIMEZONE → SLOT_TZ → TZ → America/New_York。
func Timezone() string {
	for _, k := range []string{"CLAUDE_CODE_TIMEZONE", "SLOT_TZ", "TZ"} {
		if v := os.Getenv(k); v != "" {
			if v = strings.TrimSpace(v); v != "" {
				return v
			}
			return "America/New_York"
		}
	}
	return "America/New_York"
}

func environmentBlock() string { return "# Environment\n - Timezone: " + Timezone() }

var (
	promptIDOnce sync.Once
	promptID     string
)

func stablePromptID() string {
	promptIDOnce.Do(func() { promptID = NewUUID() })
	return promptID
}

// NewUUID 生成 v4 UUID。
func NewUUID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	b[6] = b[6]&0x0f | 0x40
	b[8] = b[8]&0x3f | 0x80
	h := hex.EncodeToString(b[:])
	return h[0:8] + "-" + h[8:12] + "-" + h[12:16] + "-" + h[16:20] + "-" + h[20:]
}

var (
	billingPrefixRe   = regexp.MustCompile(`(?i)^x-anthropic-billing-header:`)
	billingLeadRe     = regexp.MustCompile(`(?i)^\s*x-anthropic-billing-header:`)
	promptVersionBrRe = regexp.MustCompile(`\s*prompt_version=<[^>]*>;?`)
	promptVersionRe   = regexp.MustCompile(`\s*prompt_version=[^;]*;?`)
	cchFieldRe        = regexp.MustCompile(`(?i)\s*\bcch=[^;]*;?`)
	trailingSpaceRe   = regexp.MustCompile(`\s+$`)
	promptIDFieldRe   = regexp.MustCompile(`\bcc_prompt_id=`)
	uuidRe            = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
	turnOriginRe      = regexp.MustCompile(`^[a-z][a-z_]{0,31}$`)
	prevReqRe         = regexp.MustCompile(`^req_[A-Za-z0-9_-]{1,36}$`)
)

// finalizeZeroBilling 实现 zero 布局计费头的六步重写。
func finalizeZeroBilling(attribution string) string {
	header := strings.TrimSpace(attribution)
	if header == "" {
		header = "x-anthropic-billing-header:"
	}
	if !billingPrefixRe.MatchString(header) {
		header = "x-anthropic-billing-header: " + header
	}
	header = promptVersionBrRe.ReplaceAllString(header, "")
	header = promptVersionRe.ReplaceAllString(header, "")
	header = cchFieldRe.ReplaceAllString(header, "")
	header = trailingSpaceRe.ReplaceAllString(header, "")
	if !strings.HasSuffix(header, ";") {
		header += ";"
	}
	if !promptIDFieldRe.MatchString(header) {
		header += " cc_prompt_id=" + stablePromptID() + ";"
	}
	return header + " cch=00000; prompt_version=<" + IdentitySentence + ">"
}

// withCchPlaceholder 只把 cch 重置为 00000。
func withCchPlaceholder(header string) string {
	reset := cchFieldRe.ReplaceAllString(header, "")
	if !strings.HasSuffix(reset, ";") {
		reset += ";"
	}
	return reset + " cch=00000;"
}

func layoutSystemBlocks(attribution, leftover string) []string {
	attribution = strings.TrimSpace(attribution)
	var blocks []string
	if Layout() == "zero" {
		blocks = append(blocks, finalizeZeroBilling(attribution))
	} else {
		if attribution != "" {
			blocks = append(blocks, withCchPlaceholder(attribution))
		}
		blocks = append(blocks, IdentitySentence)
	}
	blocks = append(blocks, environmentBlock())
	if leftover != "" {
		blocks = append(blocks, leftover)
	}
	return blocks
}

func billingFromSystem(system []string) string {
	for _, b := range system {
		if t := strings.TrimSpace(b); strings.HasPrefix(t, "x-anthropic-billing-header") {
			return t
		}
	}
	return ""
}

func isDefaultAgentField(text string) bool {
	return strings.Contains(text, "persistent Crag") || strings.Contains(text, "persistent Kin") ||
		strings.Contains(text, "mcp__runtime__")
}

func leftoverFromSystem(system []string) string {
	var parts []string
	for _, b := range system {
		t := strings.TrimSpace(b)
		if t == "" || strings.HasPrefix(t, "x-anthropic-billing-header") || t == IdentitySentence ||
			strings.HasPrefix(t, "# Environment") || isDefaultAgentField(t) {
			continue
		}
		parts = append(parts, b)
	}
	return strings.Join(parts, "\n\n")
}

// systemStrings 对应 systemFromRequest：字符串或块数组转成文本列表。
func systemStrings(system any) []string {
	switch s := system.(type) {
	case string:
		return []string{s}
	case []any:
		out := make([]string, 0, len(s))
		for _, b := range s {
			switch x := b.(type) {
			case string:
				out = append(out, x)
			case *ojson.Object:
				if x.Has("text") {
					out = append(out, jsString(x.Get("text")))
				} else {
					out = append(out, "")
				}
			default:
				out = append(out, "")
			}
		}
		return out
	}
	return nil
}

// jsString 复刻 String(x || "")。
func jsString(v any) string {
	if !ojson.Truthy(v) {
		return ""
	}
	switch x := v.(type) {
	case string:
		return x
	case bool:
		return "true"
	default:
		if f, ok := ojson.Num(v); ok {
			return ojson.FormatNumber(f)
		}
		return "[object Object]"
	}
}

func blockText(b *ojson.Object) string { return ojson.Str(b.Get("text")) }

// wireSystemBlocks 透传非空文本块数组；计费头只重置 cch。
func wireSystemBlocks(system any) []any {
	arr, ok := system.([]any)
	if !ok || len(arr) == 0 {
		return nil
	}
	for _, b := range arr {
		if o := ojson.Obj(b); o == nil {
			return nil
		} else if _, ok := o.Get("text").(string); !ok {
			return nil
		}
	}
	out := make([]any, 0, len(arr))
	for _, b := range arr {
		o := ojson.Obj(b)
		if o == nil {
			return nil
		}
		text := blockText(o)
		if text == "" && !o.Has("text") {
			return nil
		}
		next := ojson.NewObject()
		next.Set("type", "text")
		if billingLeadRe.MatchString(text) {
			next.Set("text", withCchPlaceholder(text))
		} else {
			next.Set("text", text)
		}
		if cc := ojson.Obj(o.Get("cache_control")); cc != nil {
			next.Set("cache_control", cc.Clone())
		}
		out = append(out, next)
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

// classifierSystemBlocks：去掉调用方计费头后在前面放 CLI 计费头。
func classifierSystemBlocks(system any, attribution string) []any {
	var blocks []any
	switch s := system.(type) {
	case string:
		o := ojson.NewObject()
		o.Set("type", "text")
		o.Set("text", s)
		blocks = []any{o}
	case []any:
		for _, b := range s {
			blocks = append(blocks, ojson.CloneValue(b))
		}
	}
	kept := make([]any, 0, len(blocks))
	for _, b := range blocks {
		if o := ojson.Obj(b); o != nil && billingPrefixRe.MatchString(strings.TrimLeft(blockText(o), " \t\r\n")) {
			continue
		}
		kept = append(kept, b)
	}
	if attribution == "" {
		return kept
	}
	head := ojson.NewObject()
	head.Set("type", "text")
	head.Set("text", attribution)
	return append([]any{head}, kept...)
}

// buildSystemPromptBlocks 复刻 splitSysPromptPrefix 的无边界分支并挂缓存标记。
func buildSystemPromptBlocks(system []string, caching bool) []any {
	type part struct {
		text   string
		cached bool
	}
	var attribution, prefix string
	var rest []string
	for _, b := range system {
		if b == "" {
			continue
		}
		switch {
		case strings.HasPrefix(b, "x-anthropic-billing-header"):
			attribution = b
		case cliPrefixes[b]:
			prefix = b
		default:
			rest = append(rest, b)
		}
	}
	var parts []part
	if attribution != "" {
		parts = append(parts, part{attribution, false})
	}
	if prefix != "" {
		parts = append(parts, part{prefix, true})
	}
	if joined := strings.Join(rest, "\n\n"); joined != "" {
		parts = append(parts, part{joined, true})
	}
	out := make([]any, 0, len(parts))
	for _, p := range parts {
		o := ojson.NewObject()
		o.Set("type", "text")
		o.Set("text", p.text)
		if caching && p.cached {
			cc := ojson.NewObject()
			cc.Set("type", "ephemeral")
			o.Set("cache_control", cc)
		}
		out = append(out, o)
	}
	return out
}

// firstUserText 是指纹输入：第一条 user 消息的字符串内容或首个 text 块。
func firstUserText(messages []any) string {
	for _, m := range messages {
		msg := ojson.Obj(m)
		if msg == nil {
			continue
		}
		role := ojson.Str(msg.Get("role"))
		if role != "user" && role != "tool" {
			continue
		}
		switch c := msg.Get("content").(type) {
		case string:
			return c
		case []any:
			for _, b := range c {
				if o := ojson.Obj(b); o != nil && ojson.Str(o.Get("type")) == "text" {
					return ojson.Str(o.Get("text"))
				}
			}
		}
		return ""
	}
	return ""
}

// Fingerprint 取 UTF-16 下标 4、7、20 的字符参与摘要。
func Fingerprint(text string) string {
	units := utf16.Encode([]rune(text))
	var chars []uint16
	for _, i := range []int{4, 7, 20} {
		if i < len(units) {
			chars = append(chars, units[i])
		} else {
			chars = append(chars, '0')
		}
	}
	sum := sha256.Sum256([]byte(fingerprintSalt + string(utf16.Decode(chars)) + fingerprintVersion))
	return hex.EncodeToString(sum[:])[:3]
}

func toolResultOnly(content any) bool {
	arr, ok := content.([]any)
	if !ok || len(arr) == 0 {
		return false
	}
	for _, b := range arr {
		if ojson.Str(ojson.Obj(b).Get("type")) != "tool_result" {
			return false
		}
	}
	return true
}

func hasPrompt(messages []any) bool {
	for _, m := range messages {
		msg := ojson.Obj(m)
		role := ojson.Str(msg.Get("role"))
		if (role == "user" || role == "tool") && !toolResultOnly(msg.Get("content")) {
			return true
		}
	}
	return false
}

// billingIndexMax 对应 BILLING_INDEX_MAX。
const billingIndexMax = 1e7

// boundedBillingIndex 对应 boundedBillingIndex(value, min)：越界即视为未提供。
func boundedBillingIndex(value, min int) bool {
	return value >= min && value <= billingIndexMax
}

// AttributionOptions 对应 getAttributionHeader 的可选项。
type AttributionOptions struct {
	Fingerprint string
	// Indexes 为真时按 boundedBillingIndex 校验后写入 prompt/turn 下标。
	Indexes     bool
	PromptIndex int
	TurnIndex   int
	Subagent    bool
	PromptID    string
	TurnOrigin  string
	PrevReqID   string
	// IncludeCch / IncludeSubscriberFields 来自 APIGates，对应 attributionGates。
	IncludeCch              bool
	IncludeSubscriberFields bool
}

// APIGates 对应 src/constants/system.ts 的 attributionGates：只有第一方订阅者
// 才带 cch 与订阅者字段，vertex 只带 cch，其余 provider 两者都不带。
func APIGates(subscriber bool) (includeCch, includeSubscriberFields bool) {
	switch apiProvider() {
	case "vertex":
		return true, false
	case "firstParty":
		return subscriber, subscriber
	}
	return false, false
}

func apiProvider() string {
	switch {
	case envTruthy("CLAUDE_CODE_USE_BEDROCK"):
		return "bedrock"
	case envTruthy("CLAUDE_CODE_USE_VERTEX"):
		return "vertex"
	case envTruthy("CLAUDE_CODE_USE_FOUNDRY"):
		return "foundry"
	}
	return "firstParty"
}

func attributionEnabled() bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("CLAUDE_CODE_ATTRIBUTION_HEADER"))) {
	case "0", "false", "no", "off":
		return false
	}
	return true
}

// Attribution 生成 CLI 计费头（cch=00000 占位）。字段与顺序对齐
// getAttributionHeader：cch 与订阅者字段都要先过 attributionGates。
func Attribution(o AttributionOptions) string {
	if !attributionEnabled() {
		return ""
	}
	var b strings.Builder
	fmt.Fprintf(&b, "x-anthropic-billing-header: cc_version=%s.%s; cc_entrypoint=%s;",
		CLIVersion(), o.Fingerprint, envOr("CLAUDE_CODE_ENTRYPOINT", "unknown"))
	if o.IncludeCch {
		b.WriteString(" cch=00000;")
	}
	subscriber := o.IncludeSubscriberFields
	if o.Subagent && subscriber {
		b.WriteString(" cc_is_subagent=true;")
	}
	if subscriber && prevReqRe.MatchString(o.PrevReqID) {
		fmt.Fprintf(&b, " cc_prev_req=%s;", o.PrevReqID)
	}
	if subscriber && uuidRe.MatchString(o.PromptID) {
		fmt.Fprintf(&b, " cc_prompt_id=%s;", o.PromptID)
	}
	if subscriber && turnOriginRe.MatchString(o.TurnOrigin) {
		fmt.Fprintf(&b, " cc_turn_origin=%s;", o.TurnOrigin)
	}
	if subscriber && o.Indexes && boundedBillingIndex(o.PromptIndex, 0) && boundedBillingIndex(o.TurnIndex, 1) {
		fmt.Fprintf(&b, " cc_prompt_index=%d; cc_turn_index=%d;", o.PromptIndex, o.TurnIndex)
	}
	return b.String()
}

// TurnOrigin 对 agent:kin 来源回退到入口类型。
func TurnOrigin(source string) string {
	if turnOriginRe.MatchString(source) {
		return source
	}
	switch os.Getenv("CLAUDE_CODE_ENTRYPOINT") {
	case "sdk-cli", "sdk-ts", "sdk-py":
		return "sdk"
	case "cli":
		return "cli"
	}
	return ""
}

func envOr(k, def string) string {
	if v, ok := os.LookupEnv(k); ok {
		return v
	}
	return def
}

var versionRe = regexp.MustCompile(`(\d+\.\d+\.\d+)`)

// CLIVersion 从 CLAUDE_CODE_VERSION 提取 x.y.z，缺省 2.1.296。
func CLIVersion() string {
	if m := versionRe.FindString(strings.TrimSpace(os.Getenv("CLAUDE_CODE_VERSION"))); m != "" {
		return m
	}
	return fingerprintVersion
}
