// Package messages 实现 Messages 请求的结构校验与会话解析（05 5.2.2、5.2.3）。
package messages

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"unicode/utf8"
)

// Validate 按 5.2.3 校验请求体，maxToolResult<=0 时不检查 tool_result 大小。
func Validate(body map[string]any, maxToolResult int64) error {
	msgs, ok := body["messages"].([]any)
	if !ok || len(msgs) == 0 {
		return errors.New("messages must not be empty")
	}
	if len(msgs) > 1024 {
		return errors.New("messages must contain at most 1024 entries")
	}
	mt, ok := body["max_tokens"]
	if !ok || !positive(mt) {
		return errors.New("max_tokens must be positive")
	}
	if tools, present := body["tools"]; present && tools != nil {
		arr, ok := tools.([]any)
		if !ok {
			return errors.New("tools must contain at most 128 entries")
		}
		if len(arr) > 128 {
			return errors.New("tools must contain at most 128 entries")
		}
		seen := map[string]bool{}
		for _, t := range arr {
			m, _ := t.(map[string]any)
			name, _ := m["name"].(string)
			if strings.TrimSpace(name) == "" || seen[name] {
				return errors.New("tool names must be non-empty and unique")
			}
			seen[name] = true
		}
	}
	model, _ := body["model"].(string)
	if n := utf8.RuneCountInString(model); n < 1 || n > 128 {
		return errors.New("model must contain 1 to 128 characters")
	}
	if maxToolResult > 0 {
		for _, m := range msgs {
			mm, _ := m.(map[string]any)
			blocks, _ := mm["content"].([]any)
			for _, b := range blocks {
				bm, _ := b.(map[string]any)
				if bm["type"] != "tool_result" {
					continue
				}
				raw, _ := json.Marshal(bm["content"])
				if int64(len(raw)) > maxToolResult {
					return errors.New("tool_result exceeds MAX_TOOL_RESULT_BYTES")
				}
			}
		}
	}
	return nil
}

func positive(v any) bool {
	switch x := v.(type) {
	case float64:
		return x > 0 && x == float64(int64(x))
	case json.Number:
		n, err := x.Int64()
		return err == nil && n > 0
	}
	return false
}

// SessionID 按 metadata > x-claude-code-session-id > x-session-id > x-conversation-id 解析。
func SessionID(body map[string]any, headers ...http.Header) string {
	if md, ok := body["metadata"].(map[string]any); ok {
		switch uid := md["user_id"].(type) {
		case string:
			var inner map[string]any
			if json.Unmarshal([]byte(uid), &inner) == nil && inner != nil {
				if s, ok := inner["session_id"].(string); ok && strings.TrimSpace(s) != "" {
					return strings.TrimSpace(s)
				}
			} else if s := strings.TrimSpace(uid); s != "" {
				return s
			}
		case map[string]any:
			if s, ok := uid["session_id"].(string); ok && strings.TrimSpace(s) != "" {
				return strings.TrimSpace(s)
			}
		}
	}
	for _, name := range []string{"x-claude-code-session-id", "x-session-id", "x-conversation-id"} {
		for _, h := range headers {
			if h == nil {
				continue
			}
			if v := strings.TrimSpace(h.Get(name)); v != "" {
				return v
			}
		}
	}
	return ""
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

// UserIDJSON 构造内核侧 metadata.user_id（serde 字段序）。
func UserIDJSON(session string) string {
	b, _ := json.Marshal(struct {
		AccountUUID string `json:"account_uuid"`
		DeviceID    string `json:"device_id"`
		SessionID   string `json:"session_id"`
	}{SessionID: session})
	return string(b)
}

// Marshal 以排序键、不转义 HTML 的形式序列化（与内核 serde_json 输出一致）。
func Marshal(v any) []byte {
	var sb strings.Builder
	enc := json.NewEncoder(&sb)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
	return []byte(strings.TrimRight(sb.String(), "\n"))
}

// Decode 以 UseNumber 解码，保持数字字面量。
func Decode(b []byte) (any, error) {
	dec := json.NewDecoder(strings.NewReader(string(b)))
	dec.UseNumber()
	var v any
	if err := dec.Decode(&v); err != nil {
		return nil, err
	}
	if dec.More() {
		return nil, errors.New("trailing data")
	}
	return v, nil
}
