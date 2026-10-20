package upstream

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestPreflight(t *testing.T) {
	user := func(content any) map[string]any { return map[string]any{"role": "user", "content": content} }
	asst := func(content any) map[string]any { return map[string]any{"role": "assistant", "content": content} }
	text := func(s string) map[string]any { return map[string]any{"type": "text", "text": s} }
	marked := func(ttl any) map[string]any {
		cc := map[string]any{"type": "ephemeral"}
		if ttl != nil {
			cc["ttl"] = ttl
		}
		return map[string]any{"type": "text", "text": "x", "cache_control": cc}
	}
	use := func(id string) map[string]any {
		return map[string]any{"type": "tool_use", "id": id, "name": "get", "input": map[string]any{}}
	}
	result := func(id string) map[string]any {
		return map[string]any{"type": "tool_result", "tool_use_id": id, "content": "ok"}
	}
	for _, c := range []struct {
		name string
		body map[string]any
		want string // 空表示放行
	}{
		{"plain", map[string]any{"messages": []any{user("hi")}}, ""},
		{"no messages", map[string]any{"messages": []any{}}, "at least one message"},
		{"bad role", map[string]any{"messages": []any{map[string]any{"role": "system", "content": "x"}}}, "role"},
		{"bad content", map[string]any{"messages": []any{user(5)}}, "valid list"},
		{"tool round trip", map[string]any{"messages": []any{user("hi"), asst([]any{use("a"), use("b")}),
			user([]any{result("b"), result("a"), text("go on")})}}, ""},
		{"merged user turn", map[string]any{"messages": []any{user("hi"), asst([]any{use("a")}),
			user([]any{text("note")}), user([]any{result("a")})}}, ""},
		{"merged assistant turn", map[string]any{"messages": []any{user("hi"), asst([]any{use("a")}),
			asst([]any{text("more")}), user([]any{result("a")})}}, ""},
		{"trailing tool_use", map[string]any{"messages": []any{user("hi"), asst([]any{use("a")})}}, ""},
		{"orphan result", map[string]any{"messages": []any{user([]any{result("z")})}}, "tool_use_id"},
		{"missing result", map[string]any{"messages": []any{user("hi"), asst([]any{use("a"), use("b")}),
			user([]any{result("a")})}}, "without `tool_result`"},
		{"string reply to tool_use", map[string]any{"messages": []any{user("hi"), asst([]any{use("a")}), user("ok")}},
			"without `tool_result`"},
		{"duplicate id", map[string]any{"messages": []any{user("hi"), asst([]any{use("a")}), user([]any{result("a")}),
			asst([]any{use("a")}), user([]any{result("a")})}}, "unique"},
		{"four markers", map[string]any{"system": []any{marked("1h")},
			"messages": []any{user([]any{marked("1h"), marked(nil), marked("5m")})}}, ""},
		{"five markers", map[string]any{"system": []any{marked("1h"), marked("1h")},
			"messages": []any{user([]any{marked("1h"), marked(nil), marked("5m")})}}, "four breakpoints"},
		{"1h after 5m", map[string]any{"system": []any{marked(nil)}, "messages": []any{user([]any{marked("1h")})}}, "1h before 5m"},
		{"bad ttl", map[string]any{"messages": []any{user([]any{marked("10m")})}}, "ephemeral"},
		{"thinking marker", map[string]any{"messages": []any{user("hi"), asst([]any{map[string]any{"type": "thinking",
			"thinking": "t", "signature": "s", "cache_control": map[string]any{"type": "ephemeral"}}})}}, "thinking blocks"},
		{"top-level marker counts last", map[string]any{"cache_control": map[string]any{"type": "ephemeral", "ttl": "1h"},
			"messages": []any{user([]any{marked("5m")})}}, "1h before 5m"},
	} {
		t.Run(c.name, func(t *testing.T) {
			raw, _ := json.Marshal(c.body)
			f := Preflight(raw)
			if c.want == "" {
				if f != nil {
					t.Fatalf("rejected: %+v", f)
				}
				return
			}
			if f == nil || !strings.Contains(f.Error, c.want) {
				t.Fatalf("got %+v, want error containing %q", f, c.want)
			}
			if f.Status != 400 || f.Code != "upstream_invalid_request" || f.ErrorType != "invalid_request_error" {
				t.Errorf("failure shape %+v", f)
			}
		})
	}
	if f := Preflight([]byte("[1]")); f == nil || f.Code != "cli_error" {
		t.Errorf("non-object body: %+v", f)
	}
}
