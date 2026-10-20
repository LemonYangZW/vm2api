package slot

import (
	"errors"
	"strings"
)

func validateContext(ctx, request map[string]any) error {
	if len(ctx) == 0 {
		return nil
	}
	if ctx["purpose"] != "auto_mode_classifier" {
		return errors.New("unsupported request_context purpose")
	}
	switch ctx["format"] {
	case "tool":
		if object(request["tool_choice"])["name"] != "classify_result" {
			return errors.New("classifier requires classify_result tool_choice")
		}
		for _, t := range array(request["tools"]) {
			if object(t)["name"] == "classify_result" {
				return nil
			}
		}
		return errors.New("classifier requires classify_result tool")
	case "xml":
		stage := ctx["stage"]
		if stage != nil && stage != "" && stage != "xml_s1" && stage != "xml_s2" && stage != "fast" {
			return errors.New("unsupported classifier stage")
		}
		if request["tool_choice"] != nil {
			return errors.New("xml classifier must omit tool_choice")
		}
		for _, m := range array(request["messages"]) {
			content := object(m)["content"]
			if strings.Contains(stringValue(content), "<transcript>") {
				return nil
			}
			for _, b := range array(content) {
				if strings.Contains(stringValue(object(b)["text"]), "<transcript>") {
					return nil
				}
			}
		}
		return errors.New("xml classifier requires transcript")
	default:
		return errors.New("unsupported classifier format")
	}
}

func array(v any) []any { a, _ := v.([]any); return a }

// 仅清理传输专用字段和缓存标记；消息、工具和签名不做改写。
func prepareRequest(request map[string]any, ttl string) (map[string]any, []string) {
	b := make(map[string]any, len(request))
	merge(b, request)
	b["stream"] = true
	delete(b, "wireMessages")
	delete(b, "wireBody")
	var betas []string
	for _, v := range array(b["betas"]) {
		if s := stringValue(v); s != "" {
			betas = append(betas, s)
		}
	}
	delete(b, "betas")
	var markers []map[string]any
	visit := func(block any) {
		m := object(block)
		if m == nil {
			return
		}
		if m["type"] == "thinking" || m["type"] == "redacted_thinking" {
			delete(m, "cache_control")
			return
		}
		cc := object(m["cache_control"])
		if cc == nil {
			return
		}
		if cc["ttl"] != "5m" && cc["ttl"] != "1h" {
			cc["ttl"] = ttl
		}
		markers = append(markers, m)
	}
	for _, t := range array(b["tools"]) {
		visit(t)
	}
	for _, s := range array(b["system"]) {
		visit(s)
	}
	for _, m := range array(b["messages"]) {
		for _, x := range array(object(m)["content"]) {
			visit(x)
		}
	}
	// 超额时从工具、system、较早消息开始移除，保留最后四个缓存位置。
	for i := 0; i < len(markers)-4; i++ {
		delete(markers[i], "cache_control")
	}
	return b, betas
}
