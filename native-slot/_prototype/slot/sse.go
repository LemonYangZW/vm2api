package slot

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
)

// readSSE 支持 CRLF、多行 data 和注释，限制单个事件的累计大小。
func readSSE(r io.Reader, limit int, emit func(map[string]any) error) error {
	s := bufio.NewScanner(r)
	s.Buffer(make([]byte, 4096), limit+1)
	var data []byte
	flush := func() error {
		if len(data) == 0 {
			return nil
		}
		var e map[string]any
		if err := json.Unmarshal(bytes.TrimSpace(data), &e); err != nil {
			return fmt.Errorf("invalid SSE JSON")
		}
		data = data[:0]
		if e == nil {
			return fmt.Errorf("invalid SSE event")
		}
		return emit(e)
	}
	for s.Scan() {
		line := s.Bytes()
		if len(line) == 0 {
			if err := flush(); err != nil {
				return err
			}
			continue
		}
		if bytes.HasPrefix(line, []byte("data:")) {
			v := line[5:]
			if len(v) > 0 && v[0] == ' ' {
				v = v[1:]
			}
			if len(data)+len(v)+1 > limit {
				return fmt.Errorf("SSE event exceeds limit")
			}
			data = append(data, v...)
			data = append(data, '\n')
		}
	}
	if err := s.Err(); err != nil {
		return err
	}
	return flush()
}

type accumulation struct {
	Message    map[string]any
	Blocks     map[int]map[string]any
	Partial    map[int]string
	Usage      map[string]any
	StopReason string
	Model      string
	Stopped    bool
	Events     int
}

func newAccumulation() *accumulation {
	return &accumulation{Blocks: map[int]map[string]any{}, Partial: map[int]string{}, Usage: map[string]any{}}
}

func (a *accumulation) add(e map[string]any) {
	a.Events++
	idx := int(number(e["index"]))
	switch e["type"] {
	case "message_start":
		a.Message = object(e["message"])
		a.Model = stringValue(a.Message["model"])
		merge(a.Usage, object(a.Message["usage"]))
	case "content_block_start":
		a.Blocks[idx] = object(e["content_block"])
	case "content_block_delta":
		b := a.Blocks[idx]
		if b == nil {
			return
		}
		d := object(e["delta"])
		switch d["type"] {
		case "text_delta":
			b["text"] = stringValue(b["text"]) + stringValue(d["text"])
		case "thinking_delta":
			b["thinking"] = stringValue(b["thinking"]) + stringValue(d["thinking"])
		case "signature_delta":
			b["signature"] = stringValue(b["signature"]) + stringValue(d["signature"])
		case "input_json_delta":
			a.Partial[idx] += stringValue(d["partial_json"])
		}
	case "message_delta":
		if s := stringValue(object(e["delta"])["stop_reason"]); s != "" {
			a.StopReason = s
		}
		if a.Message != nil {
			merge(a.Message, object(e["delta"]))
		}
		merge(a.Usage, object(e["usage"]))
	case "message_stop":
		a.Stopped = true
	}
}

func number(v any) float64 { f, _ := v.(float64); return f }

func (a *accumulation) result() (map[string]any, error) {
	if a.Message == nil || !a.Stopped {
		return nil, fmt.Errorf("incomplete upstream message")
	}
	content := make([]any, 0, len(a.Blocks))
	for i := 0; i < len(a.Blocks); i++ {
		b := a.Blocks[i]
		if b == nil {
			return nil, fmt.Errorf("noncontiguous content blocks")
		}
		if s := a.Partial[i]; s != "" {
			var input any
			if err := json.Unmarshal([]byte(s), &input); err != nil {
				return nil, fmt.Errorf("invalid tool input")
			}
			b["input"] = input
		}
		content = append(content, b)
	}
	a.Message["content"] = content
	a.Message["usage"] = a.Usage
	a.Message["stop_reason"] = a.StopReason
	return a.Message, nil
}
