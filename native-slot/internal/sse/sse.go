// Package sse 解析上游 SSE 并汇总 Anthropic Messages 事件。
package sse

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"

	"vm2api/native-slot/internal/ojson"
)

// ErrEventTooLarge 表示单条事件超过上限。
var ErrEventTooLarge = errors.New("SSE event exceeds limit")

// Event 是一条 SSE 事件。
type Event struct {
	Name string // event: 行，可能为空
	Data []byte // 多行 data 以 \n 连接
}

// Reader 逐条读取 SSE 事件。
type Reader struct {
	r     *bufio.Reader
	limit int
}

func NewReader(r io.Reader, limit int) *Reader {
	if limit <= 0 {
		limit = 32 << 20
	}
	return &Reader{r: bufio.NewReaderSize(r, 64<<10), limit: limit}
}

func (s *Reader) readLine() ([]byte, error) {
	var buf []byte
	for {
		chunk, err := s.r.ReadSlice('\n')
		if len(buf)+len(chunk) > s.limit+2 {
			return nil, ErrEventTooLarge
		}
		buf = append(buf, chunk...)
		if err == bufio.ErrBufferFull {
			continue
		}
		if err != nil {
			if err == io.EOF && len(buf) > 0 {
				return bytes.TrimRight(buf, "\r\n"), nil
			}
			return nil, err
		}
		return bytes.TrimRight(buf, "\r\n"), nil
	}
}

// Next 返回下一条有 data 的事件；流结束返回 io.EOF。
// 只完整结束的事件会被返回：没有空行收尾的残块在 EOF 时也会交出。
func (s *Reader) Next() (*Event, error) {
	ev := &Event{}
	has := false
	for {
		line, err := s.readLine()
		if err != nil {
			if err == io.EOF && has {
				return ev, nil
			}
			return nil, err
		}
		if len(line) == 0 {
			if has {
				return ev, nil
			}
			ev = &Event{}
			continue
		}
		if line[0] == ':' {
			continue
		}
		field, value, _ := bytes.Cut(line, []byte(":"))
		if len(value) > 0 && value[0] == ' ' {
			value = value[1:]
		}
		switch string(field) {
		case "event":
			ev.Name = string(value)
		case "data":
			if has {
				ev.Data = append(ev.Data, '\n')
			}
			if len(ev.Data)+len(value) > s.limit {
				return nil, ErrEventTooLarge
			}
			ev.Data = append(ev.Data, value...)
			has = true
		}
	}
}

// Usage 逐项合并 input/output/cache 计数，其余字段原样保留。
type Usage map[string]any

func (u Usage) Merge(v map[string]any) {
	for k, x := range v {
		if x == nil {
			continue
		}
		u[k] = x
	}
}

// StopReasons 是可识别的停止原因。
var StopReasons = map[string]bool{
	"end_turn": true, "max_tokens": true, "stop_sequence": true,
	"tool_use": true, "pause_turn": true, "refusal": true,
}

// Assembler 累积事件并在结束时组装完整 message。
type Assembler struct {
	Message    map[string]any
	Blocks     []map[string]any
	partial    map[int]*strings.Builder
	Usage      Usage
	StopReason string
	StopSeq    any
	Model      string
	Started    bool
	Stopped    bool
	Events     int
	Bytes      int64
}

func NewAssembler() *Assembler {
	return &Assembler{partial: map[int]*strings.Builder{}, Usage: Usage{}}
}

func asMap(v any) map[string]any { m, _ := v.(map[string]any); return m }

func asString(v any) string { s, _ := v.(string); return s }

func asIndex(v any) (int, bool) {
	f, ok := v.(float64)
	if !ok || f < 0 || f != float64(int(f)) {
		return 0, false
	}
	return int(f), true
}

// Add 消费一条事件（已解析为 map）。
func (a *Assembler) Add(e map[string]any) {
	a.Events++
	switch asString(e["type"]) {
	case "message_start":
		a.Started = true
		a.Message = asMap(e["message"])
		if a.Message == nil {
			a.Message = map[string]any{}
		}
		a.Model = asString(a.Message["model"])
		a.Usage.Merge(asMap(a.Message["usage"]))
	case "content_block_start":
		idx, ok := asIndex(e["index"])
		if !ok {
			return
		}
		for len(a.Blocks) <= idx {
			a.Blocks = append(a.Blocks, nil)
		}
		block := asMap(e["content_block"])
		if block == nil {
			block = map[string]any{}
		}
		a.Blocks[idx] = block
	case "content_block_delta":
		idx, ok := asIndex(e["index"])
		if !ok || idx >= len(a.Blocks) || a.Blocks[idx] == nil {
			return
		}
		b := a.Blocks[idx]
		d := asMap(e["delta"])
		switch asString(d["type"]) {
		case "text_delta":
			b["text"] = asString(b["text"]) + asString(d["text"])
		case "thinking_delta":
			b["thinking"] = asString(b["thinking"]) + asString(d["thinking"])
		case "signature_delta":
			b["signature"] = asString(b["signature"]) + asString(d["signature"])
		case "citations_delta":
			list, _ := b["citations"].([]any)
			b["citations"] = append(list, d["citation"])
		case "input_json_delta":
			sb := a.partial[idx]
			if sb == nil {
				sb = &strings.Builder{}
				a.partial[idx] = sb
			}
			sb.WriteString(asString(d["partial_json"]))
		}
	case "content_block_stop":
		idx, ok := asIndex(e["index"])
		if !ok || idx >= len(a.Blocks) || a.Blocks[idx] == nil {
			return
		}
		if sb := a.partial[idx]; sb != nil {
			var input any
			// 有序解析：保留模型输出的参数顺序。
			if s := sb.String(); s != "" {
				if v, err := ojson.Parse([]byte(s)); err == nil {
					input = v
					a.Blocks[idx]["input"] = input
				}
			}
			delete(a.partial, idx)
		}
	case "message_delta":
		d := asMap(e["delta"])
		if s := asString(d["stop_reason"]); s != "" {
			a.StopReason = s
		}
		if v, ok := d["stop_sequence"]; ok {
			a.StopSeq = v
		}
		a.Usage.Merge(asMap(e["usage"]))
	case "message_stop":
		a.Stopped = true
	}
}

// Finish 组装最终 message；未收到 message_stop 时返回错误。
func (a *Assembler) Finish() (map[string]any, error) {
	if !a.Started || !a.Stopped {
		return nil, errors.New("stream ended without a result")
	}
	for idx, sb := range a.partial {
		if idx < len(a.Blocks) && a.Blocks[idx] != nil {
			if v, err := ojson.Parse([]byte(sb.String())); err == nil {
				a.Blocks[idx]["input"] = v
			}
		}
	}
	content := make([]any, 0, len(a.Blocks))
	for _, b := range a.Blocks {
		if b != nil {
			content = append(content, b)
		}
	}
	m := map[string]any{"id": a.Message["id"], "type": "message", "role": "assistant",
		"model": a.Message["model"], "content": content, "stop_reason": a.Message["stop_reason"],
		"stop_sequence": a.Message["stop_sequence"], "usage": a.Usage.Ordered()}
	if a.Model != "" {
		m["model"] = a.Model
	}
	if a.StopReason != "" {
		m["stop_reason"] = a.StopReason
	}
	if a.StopSeq != nil {
		m["stop_sequence"] = a.StopSeq
	}
	return m, nil
}

// Complete 在 job_done 时补齐现网会合成的部分：没有 message_start 时合成
// id=msg_<pid>、model 取请求值的空 message；缺 stop_reason 时取 end_turn；
// 缺 message_stop 视为已结束。返回是否需要补发 message_stop 事件。
func (a *Assembler) Complete(model string) bool {
	if !a.Started {
		a.Started = true
		a.Message = map[string]any{"id": fmt.Sprintf("msg_%d", os.Getpid()), "model": model}
		a.Model = model
	}
	if a.StopReason == "" && asString(a.Message["stop_reason"]) == "" {
		a.StopReason = "end_turn"
	}
	synth := !a.Stopped
	a.Stopped = true
	return synth
}

// messageKeys 是现网 kernel 组装非流式 message 的字段与顺序；上游 message_start
// 里的其余字段（container、diagnostics 等）不输出。
var messageKeys = []string{"id", "type", "role", "model", "content", "stop_reason", "stop_sequence", "usage"}

// blockKeys 是已知内容块的字段与顺序，未列出的字段丢弃（现网不输出 tool_use 的
// caller）；未知类型的块保留全部字段，type 在前、其余按字母序。
var blockKeys = map[string][]string{
	"text":              {"type", "text", "citations"},
	"thinking":          {"type", "thinking", "signature"},
	"redacted_thinking": {"type", "data"},
	"tool_use":          {"type", "id", "name", "input"},
	"server_tool_use":   {"type", "id", "name", "input"},
}

func orderedBlock(b map[string]any) *ojson.Object {
	o := ojson.NewObject()
	o.Set("type", b["type"])
	if keys, known := blockKeys[asString(b["type"])]; known {
		for _, k := range keys {
			if v, ok := b[k]; ok {
				o.Set(k, v)
			}
		}
		return o
	}
	rest := make([]string, 0, len(b))
	for k := range b {
		if !o.Has(k) {
			rest = append(rest, k)
		}
	}
	sort.Strings(rest)
	for _, k := range rest {
		o.Set(k, b[k])
	}
	return o
}

// FinishJSON 按现网字段顺序输出 Finish 的结果。
func (a *Assembler) FinishJSON() ([]byte, error) {
	m, err := a.Finish()
	if err != nil {
		return nil, err
	}
	o := ojson.NewObject()
	for _, k := range messageKeys {
		v := m[k]
		if k == "content" {
			blocks := []any{}
			for _, b := range m["content"].([]any) {
				blocks = append(blocks, orderedBlock(b.(map[string]any)))
			}
			v = blocks
		}
		o.Set(k, v)
	}
	return ojson.Marshal(o), nil
}

func usageCount(v any) (float64, bool) {
	switch x := v.(type) {
	case float64:
		return x, true
	case json.Number:
		f, err := x.Float64()
		return f, err == nil
	}
	return 0, false
}

// Ordered 返回现网形状的 usage：input/output 必有；cache_*_input_tokens 只在
// 非零时出现；上游给了 cache_creation 才输出，且只保留非零项（全零为 {}）；
// 其余上游字段不输出。
func (u Usage) Ordered() *ojson.Object {
	o := ojson.NewObject()
	for _, k := range []string{"input_tokens", "output_tokens"} {
		n, _ := usageCount(u[k])
		o.Set(k, n)
	}
	for _, k := range []string{"cache_read_input_tokens", "cache_creation_input_tokens"} {
		if n, ok := usageCount(u[k]); ok && n != 0 {
			o.Set(k, n)
		}
	}
	src, has := u["cache_creation"].(map[string]any)
	if !has {
		return o
	}
	cc := ojson.NewObject()
	keys := []string{"ephemeral_5m_input_tokens", "ephemeral_1h_input_tokens"}
	var extra []string
	for k := range src {
		if k != keys[0] && k != keys[1] {
			extra = append(extra, k)
		}
	}
	sort.Strings(extra)
	for _, k := range append(keys, extra...) {
		if n, ok := usageCount(src[k]); ok && n != 0 {
			cc.Set(k, n)
		}
	}
	o.Set("cache_creation", cc)
	return o
}

// UsageJSON 返回 usage 的 JSON（与非流式 body 中的 usage 一致）。
func (a *Assembler) UsageJSON() string {
	return string(ojson.Marshal(a.Usage.Ordered()))
}
