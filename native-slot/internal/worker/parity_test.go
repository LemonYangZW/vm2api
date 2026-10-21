package worker

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"vm2api/native-slot/internal/config"
	"vm2api/native-slot/internal/frame"
)

func parityRuntime() (*Runtime, *generation, *job) {
	r := New(context.Background(), &config.Resolved{Slots: 1}, Options{})
	g := &generation{n: 1, writes: make(chan []byte, 4), done: make(chan struct{})}
	r.gen = g
	j := &job{id: "job_parity", requestID: "request-parity", slot: "s00", gen: 1,
		msgs: make(chan jobMsg, 4), lastTouch: time.Now()}
	r.jobs[j.id], r.requests[j.requestID] = j, j
	r.byID[j.slot].job, r.byID[j.slot].ready = j, true
	return r, g, j
}

// 正常终结不发送 cancel；槽位直到 HTTP 响应结束才可复用。
func TestParityNormalCompletionWaitsForHTTP(t *testing.T) {
	r, g, j := parityRuntime()
	r.handleFrame(g, &frame.Inbound{Type: "job_done", JobID: j.id, SlotID: j.slot})
	if len(g.writes) != 0 || r.byID[j.slot].job != j || !j.recycling {
		t.Fatal("正常完成提前取消或提前归还槽位")
	}
	r.abandon(j, "client disconnected")
	if len(g.writes) != 0 || len(r.jobs) != 0 || r.byID[j.slot].job != nil || r.sched.pick("", "", time.Now()) != j.slot {
		t.Fatal("响应写完后未直接归还槽位")
	}
}

// 显式取消在确认前不终结响应，确认后输出现网稀疏的提供者错误。
func TestParityCancelWaitsForAck(t *testing.T) {
	r, g, j := parityRuntime()
	if !r.Cancel(j.requestID, "explicit cancel from control plane") || j.terminal || len(j.msgs) != 0 {
		t.Fatal("取消未匹配任务或提前终结响应")
	}
	var cancel map[string]any
	_ = json.Unmarshal(<-g.writes, &cancel)
	if cancel["type"] != "cancel" || cancel["job_id"] != j.id {
		t.Fatalf("取消帧不符: %v", cancel)
	}
	r.handleFrame(g, &frame.Inbound{Type: "cancel_ack", JobID: j.id, SlotID: j.slot})
	message := <-j.msgs
	want := `{"error":{"code":"kernel_error","message":"provider error: client disconnected","status":502,"type":"api_error"},"type":"error"}`
	if message.kind != msgError || string(message.err.SSE()) != want || r.byID[j.slot].job != nil {
		t.Fatalf("取消确认终态不符: %+v", message)
	}
	if r.Cancel(j.requestID, "duplicate cancel") {
		t.Fatal("已释放任务的重复取消应返回 false")
	}
}

// v1.3.205 local_cli 的终态字段优先级与 signature_delta 汇总边界。
func TestParityCollectorTerminalFields(t *testing.T) {
	for _, tc := range []struct {
		usage string
		stop  string
		want  string
	}{
		{`{}`, "", `"stop_reason":"tool_use","stop_sequence":null,"usage":{"input_tokens":3,"output_tokens":2,"cache_read_input_tokens":9}`},
		{`{"output_tokens":7}`, "end_turn", `"stop_reason":"end_turn","stop_sequence":null,"usage":{"input_tokens":0,"output_tokens":7}`},
		{`{"cache_read_input_tokens":4}`, "", `"stop_reason":"tool_use","stop_sequence":null,"usage":{"input_tokens":0,"output_tokens":0}`},
	} {
		c := newCollector(1 << 20)
		for _, raw := range []string{
			`{"type":"message_start","message":{"id":"msg_test","model":"probe","usage":{"input_tokens":3,"cache_read_input_tokens":9}}}`,
			`{"type":"content_block_start","index":0,"content_block":{"type":"thinking","thinking":"hm","signature":"initial"}}`,
			`{"type":"content_block_delta","index":0,"delta":{"type":"signature_delta","signature":"new-signature"}}`,
			`{"type":"message_delta","delta":{"stop_reason":"tool_use"},"usage":{"output_tokens":2}}`,
		} {
			if _, data, err := c.add(json.RawMessage(raw)); err != nil || len(data) == 0 {
				t.Fatalf("add: data=%s err=%v", data, err)
			}
		}
		c.completeJSON(&frame.JobDone{Usage: json.RawMessage(tc.usage), StopReason: tc.stop}, "probe")
		body, err := c.asm.FinishJSON()
		want := `{"id":"msg_test","type":"message","role":"assistant","model":"probe","content":[{"type":"thinking","thinking":"hm","signature":"initial"}],` + tc.want + `}`
		if err != nil || string(body) != want {
			t.Fatalf("usage=%s stop=%s got=%s err=%v want=%s", tc.usage, tc.stop, body, err, want)
		}
	}
}
