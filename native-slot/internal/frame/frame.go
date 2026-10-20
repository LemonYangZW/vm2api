// Package frame 定义内核与 CLI 宿主之间的 NDJSON 帧（02_CLI_INTERFACE_SPEC）。
package frame

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"sync"
)

const ProtocolVersion = 2

// RequiredCapabilities 是握手必须具备的能力。
var RequiredCapabilities = []string{"multi_slot", "native_sse", "stateless"}

// Capabilities 是 CLI 宿主声明的全部能力。
var Capabilities = []string{"multi_slot", "native_sse", "stateless", "ping", "classifier_request_context"}

// SlotID 生成 s00…s19。
func SlotID(i int) string { return fmt.Sprintf("s%02d", i) }

// 内核 → CLI。

type JobStart struct {
	Type           string          `json:"type"`
	JobID          string          `json:"job_id"`
	SlotID         string          `json:"slot_id"`
	Request        json.RawMessage `json:"request"`
	RequestContext json.RawMessage `json:"request_context,omitempty"`
}

type Cancel struct {
	Type   string `json:"type"`
	JobID  string `json:"job_id"`
	SlotID string `json:"slot_id"`
}

type Ping struct {
	Type  string `json:"type"`
	Nonce string `json:"nonce"`
}

// CLI → 内核。

type HostReady struct {
	Type            string   `json:"type"`
	ProtocolVersion int      `json:"protocol_version"`
	Slots           int      `json:"slots"`
	SystemLayout    string   `json:"system_layout"`
	Timezone        string   `json:"timezone"`
	Capabilities    []string `json:"capabilities"`
	ConfigHash      string   `json:"config_hash,omitempty"`
}

type SlotReady struct {
	Type   string `json:"type"`
	SlotID string `json:"slot_id"`
}

type StreamEvent struct {
	Type   string          `json:"type"`
	JobID  string          `json:"job_id"`
	SlotID string          `json:"slot_id"`
	Event  json.RawMessage `json:"event"`
}

type JobDone struct {
	Type       string            `json:"type"`
	JobID      string            `json:"job_id"`
	SlotID     string            `json:"slot_id"`
	StopReason string            `json:"stop_reason"`
	Usage      json.RawMessage   `json:"usage,omitempty"`
	Headers    map[string]string `json:"headers,omitempty"`
}

type JobError struct {
	Type         string `json:"type"`
	JobID        string `json:"job_id"`
	SlotID       string `json:"slot_id"`
	Error        string `json:"error"`
	Code         string `json:"code,omitempty"`
	Status       int    `json:"status,omitempty"`
	ErrorType    string `json:"error_type,omitempty"`
	RetryAfter   string `json:"retry_after,omitempty"`
	UpstreamCode string `json:"upstream_code,omitempty"`
	RequestID    string `json:"request_id,omitempty"`
}

type CancelAck struct {
	Type   string `json:"type"`
	JobID  string `json:"job_id"`
	SlotID string `json:"slot_id"`
}

type Pong struct {
	Type  string `json:"type"`
	Nonce string `json:"nonce"`
}

// Inbound 是内核解析 CLI 帧后的统一视图。Valid 为假表示帧被丢弃。
type Inbound struct {
	Type   string
	JobID  string
	SlotID string
	Nonce  string

	Ready *HostReady
	Event json.RawMessage
	Done  *JobDone
	Err   *JobError
}

type rawInbound struct {
	Type            string          `json:"type"`
	JobID           string          `json:"job_id"`
	SlotID          string          `json:"slot_id"`
	Nonce           json.RawMessage `json:"nonce"`
	Event           json.RawMessage `json:"event"`
	StopReason      json.RawMessage `json:"stop_reason"`
	Usage           json.RawMessage `json:"usage"`
	Error           json.RawMessage `json:"error"`
	Code            json.RawMessage `json:"code"`
	Status          json.RawMessage `json:"status"`
	ErrorType       json.RawMessage `json:"error_type"`
	RetryAfter      json.RawMessage `json:"retry_after"`
	UpstreamCode    json.RawMessage `json:"upstream_code"`
	RequestID       json.RawMessage `json:"request_id"`
	ProtocolVersion json.RawMessage `json:"protocol_version"`
	Slots           json.RawMessage `json:"slots"`
	SystemLayout    json.RawMessage `json:"system_layout"`
	Timezone        json.RawMessage `json:"timezone"`
	Capabilities    json.RawMessage `json:"capabilities"`
	ConfigHash      json.RawMessage `json:"config_hash"`
}

func rawString(r json.RawMessage) (string, bool) {
	var s string
	// null 解码进 string 不会报错，必须单独拒绝。
	if len(r) == 0 || r[0] != '"' || json.Unmarshal(r, &s) != nil {
		return "", false
	}
	return s, true
}

// looseString 接受字符串或数字（retry_after 可能以数字出现）。
func looseString(r json.RawMessage) string {
	if s, ok := rawString(r); ok {
		return s
	}
	var n json.Number
	if len(r) > 0 && json.Unmarshal(r, &n) == nil {
		return n.String()
	}
	return ""
}

// ParseInbound 解析一行 CLI 输出。未知类型或字段类型不合法时返回 nil。
func ParseInbound(line []byte) *Inbound {
	line = bytes.TrimSpace(line)
	if len(line) == 0 {
		return nil
	}
	var r rawInbound
	if json.Unmarshal(line, &r) != nil {
		return nil
	}
	in := &Inbound{Type: r.Type, JobID: r.JobID, SlotID: r.SlotID}
	switch r.Type {
	case "host_ready":
		h := &HostReady{Type: r.Type}
		if json.Unmarshal(r.ProtocolVersion, &h.ProtocolVersion) != nil ||
			json.Unmarshal(r.Slots, &h.Slots) != nil ||
			json.Unmarshal(r.Capabilities, &h.Capabilities) != nil {
			return nil
		}
		var ok bool
		if h.SystemLayout, ok = rawString(r.SystemLayout); !ok {
			return nil
		}
		if h.Timezone, ok = rawString(r.Timezone); !ok {
			return nil
		}
		h.ConfigHash, _ = rawString(r.ConfigHash)
		in.Ready = h
	case "slot_ready", "cancel_ack":
	case "pong":
		s, ok := rawString(r.Nonce)
		if !ok {
			return nil
		}
		in.Nonce = s
	case "stream_event":
		if len(r.Event) == 0 || r.Event[0] != '{' {
			return nil
		}
		in.Event = r.Event
	case "job_done":
		stop, ok := rawString(r.StopReason)
		if !ok {
			return nil
		}
		d := &JobDone{Type: r.Type, JobID: r.JobID, SlotID: r.SlotID, StopReason: stop}
		if len(r.Usage) > 0 && string(r.Usage) != "null" {
			d.Usage = r.Usage
		}
		in.Done = d
	case "job_error":
		msg, ok := rawString(r.Error)
		if !ok {
			return nil
		}
		e := &JobError{Type: r.Type, JobID: r.JobID, SlotID: r.SlotID, Error: msg}
		e.Code, _ = rawString(r.Code)
		_ = json.Unmarshal(r.Status, &e.Status)
		e.ErrorType, _ = rawString(r.ErrorType)
		e.RetryAfter = looseString(r.RetryAfter)
		e.UpstreamCode, _ = rawString(r.UpstreamCode)
		e.RequestID = looseString(r.RequestID)
		in.Err = e
	default:
		return nil
	}
	return in
}

// Writer 串行写出 NDJSON，保证多槽位并发时不交错。
type Writer struct {
	mu sync.Mutex
	w  *bufio.Writer
}

func NewWriter(w io.Writer) *Writer { return &Writer{w: bufio.NewWriterSize(w, 64<<10)} }

func (w *Writer) Send(v any) error {
	b, err := marshal(v)
	if err != nil {
		return err
	}
	w.mu.Lock()
	defer w.mu.Unlock()
	if _, err = w.w.Write(b); err != nil {
		return err
	}
	return w.w.Flush()
}

func marshal(v any) ([]byte, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		return nil, err
	}
	b := buf.Bytes()
	if bytes.IndexByte(b[:len(b)-1], '\n') >= 0 {
		return nil, fmt.Errorf("frame contains raw newline")
	}
	return b, nil
}

// NewLineReader 返回支持超长行的逐行读取器。
func NewLineReader(r io.Reader, max int) *LineReader {
	return &LineReader{r: bufio.NewReaderSize(r, 256<<10), max: max}
}

type LineReader struct {
	r   *bufio.Reader
	max int
}

// ErrLineTooLong 表示单行超过上限；该行被丢弃。
var ErrLineTooLong = fmt.Errorf("frame line exceeds limit")

// Next 返回下一行（不含换行符）。
func (l *LineReader) Next() ([]byte, error) {
	var buf []byte
	tooLong := false
	for {
		chunk, err := l.r.ReadSlice('\n')
		if !tooLong {
			if l.max > 0 && len(buf)+len(chunk) > l.max+1 {
				tooLong = true
				buf = nil
			} else {
				buf = append(buf, chunk...)
			}
		}
		if err == bufio.ErrBufferFull {
			continue
		}
		if err != nil {
			if err == io.EOF && len(buf) > 0 && !tooLong {
				return bytes.TrimRight(buf, "\r\n"), nil
			}
			return nil, err
		}
		if tooLong {
			return nil, ErrLineTooLong
		}
		return bytes.TrimRight(buf, "\r\n"), nil
	}
}

// HasAll 判断 caps 是否包含 required 中的全部项（顺序无关）。
func HasAll(caps, required []string) (string, bool) {
	have := map[string]bool{}
	for _, c := range caps {
		have[strings.TrimSpace(c)] = true
	}
	for _, r := range required {
		if !have[r] {
			return r, false
		}
	}
	return "", true
}
