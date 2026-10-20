package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"vm2api/native-slot/internal/sse"
)

// FinishReason 是 Anthropic stop_reason 到 OpenAI finish_reason 的三值映射。
func FinishReason(stop string) string {
	switch stop {
	case "max_tokens":
		return "length"
	case "tool_use":
		return "tool_calls"
	}
	return "stop"
}

func textOf(v any) string {
	switch x := v.(type) {
	case string:
		return x
	case []any:
		var parts []string
		for _, p := range x {
			pm, _ := p.(map[string]any)
			if t, _ := pm["text"].(string); t != "" {
				parts = append(parts, t)
			}
		}
		return strings.Join(parts, "\n")
	}
	return ""
}

func convertParts(v any) any {
	arr, ok := v.([]any)
	if !ok {
		return textOf(v)
	}
	var out []any
	for _, p := range arr {
		pm, _ := p.(map[string]any)
		switch pm["type"] {
		case "text":
			out = append(out, map[string]any{"type": "text", "text": pm["text"]})
		case "image_url":
			iu, _ := pm["image_url"].(map[string]any)
			u, _ := iu["url"].(string)
			if rest, ok := strings.CutPrefix(u, "data:"); ok {
				media, data, _ := strings.Cut(rest, ";base64,")
				out = append(out, map[string]any{"type": "image", "source": map[string]any{"type": "base64", "media_type": media, "data": data}})
			} else if u != "" {
				out = append(out, map[string]any{"type": "image", "source": map[string]any{"type": "url", "url": u}})
			}
		}
	}
	return out
}

// chatToMessages 把 OpenAI chat 请求转换成 Anthropic Messages 请求。
func chatToMessages(in map[string]any) (map[string]any, error) {
	msgs, _ := in["messages"].([]any)
	if len(msgs) == 0 {
		return nil, errors.New("messages must not be empty")
	}
	var system []string
	var out []any
	appendMsg := func(role string, blocks []any) {
		if n := len(out); n > 0 {
			if last, _ := out[n-1].(map[string]any); last["role"] == role {
				prev, _ := last["content"].([]any)
				last["content"] = append(prev, blocks...)
				return
			}
		}
		out = append(out, map[string]any{"role": role, "content": blocks})
	}
	toBlocks := func(v any) []any {
		switch c := convertParts(v).(type) {
		case string:
			if c == "" {
				return nil
			}
			return []any{map[string]any{"type": "text", "text": c}}
		case []any:
			return c
		}
		return nil
	}
	for _, m := range msgs {
		mm, _ := m.(map[string]any)
		role, _ := mm["role"].(string)
		switch role {
		case "system", "developer":
			if t := textOf(mm["content"]); t != "" {
				system = append(system, t)
			}
		case "user":
			appendMsg("user", toBlocks(mm["content"]))
		case "assistant":
			blocks := toBlocks(mm["content"])
			calls, _ := mm["tool_calls"].([]any)
			for _, c := range calls {
				cm, _ := c.(map[string]any)
				fn, _ := cm["function"].(map[string]any)
				var input any = map[string]any{}
				if args, _ := fn["arguments"].(string); strings.TrimSpace(args) != "" {
					if json.Unmarshal([]byte(args), &input) != nil {
						input = map[string]any{}
					}
				}
				blocks = append(blocks, map[string]any{"type": "tool_use", "id": cm["id"], "name": fn["name"], "input": input})
			}
			if len(blocks) > 0 {
				appendMsg("assistant", blocks)
			}
		case "tool":
			appendMsg("user", []any{map[string]any{"type": "tool_result", "tool_use_id": mm["tool_call_id"], "content": textOf(mm["content"])}})
		}
	}
	body := map[string]any{"model": in["model"], "messages": out}
	if len(system) > 0 {
		body["system"] = strings.Join(system, "\n\n")
	}
	maxTokens := in["max_tokens"]
	if maxTokens == nil {
		maxTokens = in["max_completion_tokens"]
	}
	if maxTokens == nil {
		maxTokens = float64(4096)
	}
	body["max_tokens"] = maxTokens
	for _, k := range []string{"temperature", "top_p"} {
		if v, ok := in[k]; ok {
			body[k] = v
		}
	}
	switch st := in["stop"].(type) {
	case string:
		body["stop_sequences"] = []any{st}
	case []any:
		body["stop_sequences"] = st
	}
	if s, ok := in["stream"].(bool); ok {
		body["stream"] = s
	}
	if tools, ok := in["tools"].([]any); ok && len(tools) > 0 {
		var conv []any
		for _, t := range tools {
			tm, _ := t.(map[string]any)
			fn, _ := tm["function"].(map[string]any)
			params := fn["parameters"]
			if params == nil {
				params = map[string]any{"type": "object", "properties": map[string]any{}}
			}
			tool := map[string]any{"name": fn["name"], "input_schema": params}
			if d, ok := fn["description"]; ok {
				tool["description"] = d
			}
			conv = append(conv, tool)
		}
		body["tools"] = conv
	}
	switch tc := in["tool_choice"].(type) {
	case string:
		switch tc {
		case "auto":
			body["tool_choice"] = map[string]any{"type": "auto"}
		case "none":
			body["tool_choice"] = map[string]any{"type": "none"}
		case "required":
			body["tool_choice"] = map[string]any{"type": "any"}
		}
	case map[string]any:
		fn, _ := tc["function"].(map[string]any)
		if name, _ := fn["name"].(string); name != "" {
			body["tool_choice"] = map[string]any{"type": "tool", "name": name}
		}
	}
	if md, ok := in["metadata"].(map[string]any); ok {
		body["metadata"] = md
	}
	return body, nil
}

func chatMessage(msg map[string]any) (map[string]any, string) {
	var text, thinking strings.Builder
	var calls []any
	blocks, _ := msg["content"].([]any)
	for _, b := range blocks {
		bm, _ := b.(map[string]any)
		switch bm["type"] {
		case "text":
			s, _ := bm["text"].(string)
			text.WriteString(s)
		case "thinking":
			s, _ := bm["thinking"].(string)
			thinking.WriteString(s)
		case "tool_use":
			args, _ := json.Marshal(bm["input"])
			calls = append(calls, map[string]any{"id": bm["id"], "type": "function",
				"function": map[string]any{"name": bm["name"], "arguments": string(args)}})
		}
	}
	out := map[string]any{"role": "assistant", "content": text.String()}
	if thinking.Len() > 0 {
		out["reasoning_content"] = thinking.String()
	}
	if len(calls) > 0 {
		out["tool_calls"] = calls
	}
	stop, _ := msg["stop_reason"].(string)
	return out, FinishReason(stop)
}

func usageCounts(u map[string]any) map[string]any {
	num := func(k string) int64 {
		f, _ := u[k].(float64)
		return int64(f)
	}
	in, out := num("input_tokens"), num("output_tokens")
	return map[string]any{"prompt_tokens": in, "completion_tokens": out, "total_tokens": in + out}
}

func (s *Server) handleChat(w http.ResponseWriter, r *http.Request) {
	raw, e := s.readBody(w, r)
	if e != nil {
		writeAPIError(w, e)
		return
	}
	var in map[string]any
	if json.Unmarshal(raw, &in) != nil || in == nil {
		writeAPIError(w, newErr(400, "invalid_request", "invalid_request_error", "request body must be a JSON object"))
		return
	}
	body, err := chatToMessages(in)
	if err != nil {
		writeAPIError(w, newErr(400, "invalid_request", "invalid_request_error", err.Error()))
		return
	}
	p, e := s.prepare(r, body)
	if e != nil {
		writeAPIError(w, e)
		return
	}
	model := p.model
	created := time.Now().Unix()
	if !p.stream {
		asm, res, e := s.collect(r.Context(), p)
		if e != nil {
			writeAPIError(w, e)
			return
		}
		msg, err := asm.Finish()
		if err != nil {
			writeAPIError(w, newErr(502, "stream ended without a result", "api_error", "stream ended without a result"))
			return
		}
		cm, finish := chatMessage(msg)
		s.commonHeaders(w, p, res, "")
		writeJSON(w, 200, map[string]any{"id": p.requestID, "object": "chat.completion", "created": created,
			"model": model, "choices": []any{map[string]any{"index": 0, "message": cm, "finish_reason": finish}},
			"usage": usageCounts(asm.Usage)})
		return
	}
	rc := http.NewResponseController(w)
	started := false
	asm := sse.NewAssembler()
	chunk := func(delta map[string]any, finish any) []byte {
		b, _ := json.Marshal(map[string]any{"id": p.requestID, "object": "chat.completion.chunk", "created": created,
			"model": model, "choices": []any{map[string]any{"index": 0, "delta": delta, "finish_reason": finish}}})
		return b
	}
	send := func(b []byte) error {
		if !started {
			s.commonHeaders(w, p, s.meta(r.Context()), "")
			w.Header().Set("Content-Type", "text/event-stream")
			w.Header().Set("Cache-Control", "no-cache, no-transform")
			w.Header().Set("X-Accel-Buffering", "no")
			w.WriteHeader(200)
			started = true
		}
		if _, err := w.Write(append(append([]byte("data: "), b...), '\n', '\n')); err != nil {
			return err
		}
		return rc.Flush()
	}
	_, e = s.provider.Stream(r.Context(), p.call, func(raw json.RawMessage) error {
		var ev map[string]any
		if json.Unmarshal(raw, &ev) != nil {
			return errors.New("upstream_response_invalid")
		}
		asm.Add(ev)
		switch ev["type"] {
		case "message_start":
			return send(chunk(map[string]any{"role": "assistant"}, nil))
		case "content_block_delta":
			d, _ := ev["delta"].(map[string]any)
			switch d["type"] {
			case "text_delta":
				return send(chunk(map[string]any{"content": d["text"]}, nil))
			case "thinking_delta":
				return send(chunk(map[string]any{"reasoning_content": d["thinking"]}, nil))
			}
		case "message_delta":
			d, _ := ev["delta"].(map[string]any)
			stop, _ := d["stop_reason"].(string)
			return send(chunk(map[string]any{}, FinishReason(stop)))
		}
		return nil
	})
	if e != nil {
		if !started {
			writeAPIError(w, e)
			return
		}
		b, _ := json.Marshal(map[string]any{"error": map[string]any{"type": errorType(e), "message": e.Message, "code": e.Code}})
		_ = send(b)
		return
	}
	if started {
		_, _ = w.Write([]byte("data: [DONE]\n\n"))
		_ = rc.Flush()
	}
}
