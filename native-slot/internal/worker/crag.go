package worker

import (
	"encoding/json"
	"strconv"
	"time"

	"vm2api/native-slot/internal/frame"
)

// CragHostArgs 返回驱动 crag 数据面（官方 Claude Code / cc-node）所需的命令行参数。
// 对应原二进制 kin_kernel::cli::crag_cli_args。
func CragHostArgs(slots int) []string {
	if slots <= 0 {
		slots = 1
	}
	return []string{
		"--single-process-subagents",
		"--max-procs", strconv.Itoa(slots),
		"--continuous-tool-loop",
	}
}

// CragStdinFrame 对应发往 crag CLI stdin 的用户请求帧（singleProcessSlots 协议）。
type CragStdinFrame struct {
	Type      string      `json:"type"` // 固定为 "user"
	SessionID string      `json:"session_id"`
	Model     string      `json:"model,omitempty"`
	Message   CragMessage `json:"message"`
	Tools     []any       `json:"tools,omitempty"`
	System    any         `json:"system,omitempty"`
}

type CragMessage struct {
	Role    string `json:"role"`
	Content any    `json:"content"`
}

// CragStdoutFrame 对应从 crag CLI stdout 接收到的单行 JSON 帧。
type CragStdoutFrame struct {
	Type       string          `json:"type"`              // "stream_event" 或 "result"
	SessionID  string          `json:"session_id"`        // 关联请求的会话 ID
	Event      json.RawMessage `json:"event,omitempty"`   // stream_event 载荷
	Subtype    string          `json:"subtype,omitempty"` // result: "success" | "error_during_execution"
	IsError    bool            `json:"is_error,omitempty"`
	StopReason string          `json:"stop_reason,omitempty"`
	Result     string          `json:"result,omitempty"`
	Usage      json.RawMessage `json:"usage,omitempty"`
}

// buildCragStdinFrame 将收到的入站 messages 请求转换为 crag stdin 帧。
func buildCragStdinFrame(jobID string, reqBytes []byte) (*CragStdinFrame, error) {
	var body map[string]any
	if err := json.Unmarshal(reqBytes, &body); err != nil {
		return nil, err
	}
	model, _ := body["model"].(string)
	tools, _ := body["tools"].([]any)
	system := body["system"]

	var msgContent any = ""
	if msgs, ok := body["messages"].([]any); ok && len(msgs) > 0 {
		// 优先查找最后一条 user 消息
		var lastUser any
		for i := len(msgs) - 1; i >= 0; i-- {
			if m, ok := msgs[i].(map[string]any); ok {
				if r, _ := m["role"].(string); r == "user" {
					lastUser = m["content"]
					break
				}
			}
		}
		if lastUser != nil {
			msgContent = lastUser
		} else if m, ok := msgs[len(msgs)-1].(map[string]any); ok {
			msgContent = m["content"]
		}
	}

	return &CragStdinFrame{
		Type:      "user",
		SessionID: jobID,
		Model:     model,
		Message: CragMessage{
			Role:    "user",
			Content: msgContent,
		},
		Tools:  tools,
		System: system,
	}, nil
}

// registerCragReady 在 crag 模式下初始化所有虚拟槽位为就绪状态。
func (r *Runtime) registerCragReady(g *generation) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.gen != g {
		return
	}
	now := time.Now()
	for _, s := range r.slots {
		s.ready = true
		s.idleFrom = now
		r.sched.enqueueReady(s.id)
	}
	r.recovering = false
	r.healthy = true
	r.reason = ""
	if !r.started {
		r.started = true
		close(r.readyOnce)
	}
	r.wakeWaiters()
	r.logf("crag host ready with %d slots (continuous=1)", len(r.slots))
}

// handleCragLine 解析从 crag CLI stdout 输出的一行 JSON。
func (r *Runtime) handleCragLine(g *generation, line []byte) {
	var f CragStdoutFrame
	if err := json.Unmarshal(line, &f); err != nil {
		// 忽略非 JSON 行（调试日志或 stderr 渗透）
		return
	}
	if f.SessionID == "" {
		return
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if r.gen != g {
		return
	}
	now := time.Now()
	j := r.jobs[f.SessionID]
	if j == nil {
		j = r.requests[f.SessionID]
	}
	if j == nil || j.gen != g.n {
		return
	}
	j.lastTouch = now

	switch f.Type {
	case "stream_event":
		if j.terminal {
			return
		}
		r.deliver(j, jobMsg{kind: msgEvent, raw: f.Event, bytes: int64(len(f.Event))})

	case "result":
		if j.terminal {
			return
		}
		if f.IsError || f.Subtype == "error_during_execution" {
			errText := f.Result
			if errText == "" {
				errText = "error during execution"
			}
			r.deliver(j, jobMsg{kind: msgError, err: &APIError{
				Status:    500,
				Type:      "api_error",
				Code:      "cli_error",
				Message:   errText,
				Retryable: false,
			}})
		} else {
			done := &frame.JobDone{
				StopReason: f.StopReason,
				Usage:      f.Usage,
			}
			r.deliver(j, jobMsg{kind: msgDone, done: done})
		}
		r.finishSent(j)
	}
}

// sendCragJob 编码并向 crag CLI stdin 投递用户请求帧。
func (r *Runtime) sendCragJob(j *job, reqBytes []byte) bool {
	f, err := buildCragStdinFrame(j.id, reqBytes)
	if err != nil {
		return false
	}
	return r.gen.send(f)
}
