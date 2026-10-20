package upstream

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Preflight 是发往上游前的最后一道闸：只拦 Anthropic 必定拒绝的形状，命中时
// 返回与上游同类的 400，请求不出网。缓存标记规则与控制面
// validateCacheBreakpoints 一致；工具配对的文案沿用上游原文，控制面据此走
// tool_pair 修复重试。拿不准会被拒的形状一律放行。
func Preflight(body []byte) *Failure {
	var req map[string]any
	if err := json.Unmarshal(body, &req); err != nil || req == nil {
		return &Failure{Error: "request body is not a JSON object", Code: "cli_error", Status: 502, ErrorType: "api_error"}
	}
	if msg := checkCacheMarkers(req); msg != "" {
		return &Failure{Error: msg, Code: "upstream_invalid_request", Status: 400,
			ErrorType: "invalid_request_error", UpstreamCode: "invalid_cache_control"}
	}
	if msg := checkMessages(req); msg != "" {
		return &Failure{Error: msg, Code: "upstream_invalid_request", Status: 400, ErrorType: "invalid_request_error"}
	}
	return nil
}

func checkCacheMarkers(req map[string]any) string {
	count, short := 0, false
	check := func(node any) string {
		m, _ := node.(map[string]any)
		raw, has := m["cache_control"]
		if !has || raw == nil {
			return ""
		}
		if t := asText(m["type"]); t == "thinking" || t == "redacted_thinking" {
			return "Cache breakpoints are not allowed on thinking blocks."
		}
		ctl, _ := raw.(map[string]any)
		ttl, hasTTL := ctl["ttl"]
		if hasTTL && ttl == nil {
			hasTTL = false
		}
		if ctl == nil || ctl["type"] != "ephemeral" || (hasTTL && ttl != "5m" && ttl != "1h") {
			return "Cache control must be ephemeral with an optional 5m or 1h TTL."
		}
		if short && ttl == "1h" {
			return "Cache TTL must place 1h before 5m (including missing TTL)."
		}
		if ttl != "1h" {
			short = true
		}
		if count++; count > 4 {
			return "Cache control exceeds four breakpoints."
		}
		return ""
	}
	var nodes []any
	nodes = append(nodes, asList(req["tools"])...)
	nodes = append(nodes, asList(req["system"])...)
	for _, m := range asList(req["messages"]) {
		msg, _ := m.(map[string]any)
		nodes = append(nodes, asList(msg["content"])...)
	}
	// 自动缓存落在消息尾部，排在显式标记之后。
	nodes = append(nodes, any(req))
	for _, n := range nodes {
		if msg := check(n); msg != "" {
			return msg
		}
	}
	return ""
}

func checkMessages(req map[string]any) string {
	msgs, ok := req["messages"].([]any)
	if !ok || len(msgs) == 0 {
		return "messages: at least one message is required"
	}
	// 上游把连续同角色消息并成一个 turn，配对按 turn 判。
	type turn struct {
		role   string
		first  int // turn 首条消息下标，用于报错定位
		blocks []any
	}
	var turns []turn
	for i, raw := range msgs {
		m, _ := raw.(map[string]any)
		// role=system 是 mid-conversation-system beta 的合法用法（控制面会插入）。
		role := asText(m["role"])
		if role != "user" && role != "assistant" && role != "system" {
			return fmt.Sprintf("messages.%d.role: Input should be 'user' or 'assistant'", i)
		}
		content := m["content"]
		if _, isText := content.(string); !isText {
			if _, isList := content.([]any); !isList {
				return fmt.Sprintf("messages.%d.content: Input should be a valid list", i)
			}
		}
		if n := len(turns); n > 0 && turns[n-1].role == role {
			turns[n-1].blocks = append(turns[n-1].blocks, asList(content)...)
			continue
		}
		turns = append(turns, turn{role: role, first: i, blocks: asList(content)})
	}
	seen := map[string]bool{}
	var pending []string // 上一个 assistant turn 中的 tool_use id
	for _, t := range turns {
		// system 消息不参与工具配对，视作透明。
		if t.role == "system" {
			continue
		}
		if t.role == "assistant" {
			for _, b := range t.blocks {
				bm, _ := b.(map[string]any)
				if asText(bm["type"]) != "tool_use" {
					continue
				}
				id := asText(bm["id"])
				if seen[id] {
					return fmt.Sprintf("messages.%d: `tool_use` ids must be unique: %s", t.first, id)
				}
				seen[id] = true
				pending = append(pending, id)
			}
			continue
		}
		open := map[string]bool{}
		for _, id := range pending {
			open[id] = true
		}
		for _, b := range t.blocks {
			bm, _ := b.(map[string]any)
			if asText(bm["type"]) != "tool_result" {
				continue
			}
			if id := asText(bm["tool_use_id"]); open[id] {
				delete(open, id)
			} else {
				return fmt.Sprintf("messages.%d: unexpected `tool_use_id` found in `tool_result` blocks: %s. "+
					"Each `tool_result` block must have a corresponding `tool_use` block in the previous message.", t.first, id)
			}
		}
		var missing []string
		for _, id := range pending {
			if open[id] {
				missing = append(missing, id)
			}
		}
		if len(missing) > 0 {
			return fmt.Sprintf("messages: `tool_use` ids were found without `tool_result` blocks immediately after: %s. "+
				"Each `tool_use` block must have a corresponding `tool_result` block in the next message.", strings.Join(missing, ", "))
		}
		pending = nil
	}
	// 末尾 assistant turn 的 tool_use 不判：是否允许以它收尾拿不准，交给上游。
	return ""
}

func asList(v any) []any { l, _ := v.([]any); return l }

func asText(v any) string { s, _ := v.(string); return s }
