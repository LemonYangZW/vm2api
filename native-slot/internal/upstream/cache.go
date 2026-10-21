package upstream

import (
	"encoding/json"
	"os"
	"strings"
	"sync"

	"vm2api/native-slot/internal/ojson"
)

const maxCacheMarkers = 4

func normalizeTTL(v any) string {
	s := strings.ToLower(strings.TrimSpace(jsAnyString(v)))
	if s == "5m" || s == "1h" {
		return s
	}
	return ""
}

func jsAnyString(v any) string {
	switch x := v.(type) {
	case nil:
		return ""
	case string:
		return x
	case bool:
		if x {
			return "true"
		}
		return "false"
	default:
		if f, ok := ojson.Num(v); ok {
			return ojson.FormatNumber(f)
		}
		return ""
	}
}

func noteExplicitTTL(v any, five, hour *bool) {
	switch x := v.(type) {
	case []any:
		for _, e := range x {
			noteExplicitTTL(e, five, hour)
		}
	case *ojson.Object:
		switch normalizeTTL(ojson.Obj(x.Get("cache_control")).Get("ttl")) {
		case "5m":
			*five = true
		case "1h":
			*hour = true
		}
		if c, ok := x.Get("content").([]any); ok {
			noteExplicitTTL(c, five, hour)
		}
	}
}

// explicitCacheTTL：任一处显式 5m 优先，其次 1h。
func explicitCacheTTL(parts ...any) string {
	var five, hour bool
	for _, p := range parts {
		noteExplicitTTL(p, &five, &hour)
	}
	if five {
		return "5m"
	}
	if hour {
		return "1h"
	}
	return ""
}

// kernelConfigPath 是宿主读取面板配置的路径。
func kernelConfigPath() string {
	if v := os.Getenv("KERNEL_CONFIG"); v != "" {
		return v
	}
	return "/run/kin/kernel.json"
}

var (
	cchMu       sync.Mutex
	lastCchFlag = true
)

// panelSettings 每次请求重读 kernel.json，读失败时沿用上次的 cch 开关。
func panelSettings() (ttl string, cch bool) {
	b, err := os.ReadFile(kernelConfigPath())
	cchMu.Lock()
	defer cchMu.Unlock()
	if err != nil {
		return "", lastCchFlag
	}
	var raw map[string]json.RawMessage
	if json.Unmarshal(b, &raw) != nil {
		return "", lastCchFlag
	}
	if v, ok := raw["default_cache_ttl"]; ok {
		var s any
		_ = json.Unmarshal(v, &s)
		ttl = normalizeTTL(s)
	}
	if v, ok := raw["cch_enabled"]; !ok {
		lastCchFlag = true
	} else {
		var flag bool
		if json.Unmarshal(v, &flag) == nil && (string(v) == "true" || string(v) == "false") {
			lastCchFlag = flag
		}
	}
	return ttl, lastCchFlag
}

func rewriteBlock(block *ojson.Object, ttl string) {
	cc := ojson.Obj(block.Get("cache_control"))
	if cc == nil {
		return
	}
	if t := cc.Get("type"); t != nil && ojson.Str(t) != "ephemeral" {
		return
	}
	next := ojson.NewObject()
	next.Set("type", "ephemeral")
	next.Set("ttl", ttl)
	if s := ojson.Str(cc.Get("scope")); s == "global" || s == "org" {
		next.Set("scope", s)
	}
	block.Set("cache_control", next)
}

func stampBlock(v any, ttl string) {
	block := ojson.Obj(v)
	if block == nil {
		return
	}
	cc := ojson.Obj(block.Get("cache_control"))
	if cc == nil {
		return
	}
	if t := cc.Get("type"); t != nil && ojson.Str(t) != "ephemeral" {
		return
	}
	if normalizeTTL(cc.Get("ttl")) != "" {
		return
	}
	rewriteBlock(block, ttl)
}

type cacheSections struct {
	system   any // nil 表示该段由调用方保留
	tools    any
	messages any
	hasSys   bool
	hasTools bool
	hasMsgs  bool
}

type marker struct {
	section string
	block   *ojson.Object
}

func liveMarker(v any) *ojson.Object {
	o := ojson.Obj(v)
	if o == nil || !ojson.Truthy(o.Get("cache_control")) {
		return nil
	}
	return o
}

func collectMarkers(s cacheSections) []marker {
	var hits []marker
	if s.hasSys {
		var sys []any
		if arr, ok := s.system.([]any); ok {
			sys = arr
		} else if s.system != nil {
			sys = []any{s.system}
		}
		for _, b := range sys {
			if o := liveMarker(b); o != nil {
				hits = append(hits, marker{"system", o})
			}
		}
	}
	if s.hasTools {
		for _, t := range ojson.Arr(s.tools) {
			if o := liveMarker(t); o != nil {
				hits = append(hits, marker{"tools", o})
			}
		}
	}
	if s.hasMsgs {
		for _, m := range ojson.Arr(s.messages) {
			for _, b := range ojson.Arr(ojson.Obj(m).Get("content")) {
				if o := liveMarker(b); o != nil {
					hits = append(hits, marker{"messages", o})
				}
			}
		}
	}
	return hits
}

func dropThinkingMarkers(messages any) {
	for _, m := range ojson.Arr(messages) {
		for _, b := range ojson.Arr(ojson.Obj(m).Get("content")) {
			o := ojson.Obj(b)
			if o == nil {
				continue
			}
			if t := ojson.Str(o.Get("type")); t == "thinking" || t == "redacted_thinking" {
				o.Delete("cache_control")
			}
		}
	}
}

func capCacheMarkers(s cacheSections, maximum int) {
	if s.hasMsgs {
		dropThinkingMarkers(s.messages)
	}
	live := collectMarkers(s)
	if len(live) <= maximum {
		return
	}
	var tools, system, messages []marker
	for _, m := range live {
		switch m.section {
		case "tools":
			tools = append(tools, m)
		case "system":
			system = append(system, m)
		default:
			messages = append(messages, m)
		}
	}
	var order []marker
	for i := len(tools) - 1; i >= 0; i-- {
		order = append(order, tools[i])
	}
	for i := len(system) - 1; i >= 0; i-- {
		order = append(order, system[i])
	}
	order = append(order, messages...)
	for _, m := range order[:len(live)-maximum] {
		m.block.Delete("cache_control")
	}
}

func eachCacheBlock(s cacheSections, fn func(any)) {
	if s.hasSys {
		if arr, ok := s.system.([]any); ok {
			for _, b := range arr {
				fn(b)
			}
		} else {
			fn(s.system)
		}
	}
	if s.hasTools {
		for _, t := range ojson.Arr(s.tools) {
			fn(t)
		}
	}
	if s.hasMsgs {
		for _, m := range ojson.Arr(s.messages) {
			for _, b := range ojson.Arr(ojson.Obj(m).Get("content")) {
				fn(b)
			}
		}
	}
}

func fillMissingCacheTTL(s cacheSections, ttl string) {
	var system, tools, messages any
	if s.hasSys {
		system = s.system
	}
	if s.hasTools {
		tools = s.tools
	}
	if s.hasMsgs {
		messages = s.messages
	}
	// 新版 CLI 在整段请求未显式指定合法 TTL 时保持省略。
	if explicitCacheTTL(system, tools, messages) == "" {
		return
	}
	eachCacheBlock(s, func(b any) { stampBlock(b, ttl) })
}

// applyOwnedCacheMarkers 只改宿主自己生成的段；调用方原样给出的段计入上限但不改写。
func applyOwnedCacheMarkers(system, tools, messages any, ttl string, preserveSystem, preserveTools, preserveMessages bool) {
	owned := cacheSections{system: system, tools: tools, messages: messages,
		hasSys: !preserveSystem, hasTools: !preserveTools, hasMsgs: !preserveMessages}
	kept := cacheSections{system: system, tools: tools, messages: messages,
		hasSys: preserveSystem, hasTools: preserveTools, hasMsgs: preserveMessages}
	preserved := len(collectMarkers(kept))
	fillMissingCacheTTL(owned, ttl)
	max := maxCacheMarkers - preserved
	if max < 0 {
		max = 0
	}
	capCacheMarkers(owned, max)
}
