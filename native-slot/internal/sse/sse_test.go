package sse

import (
	"encoding/json"
	"testing"

	"vm2api/native-slot/internal/ojson"
)

func orderedJSON(u Usage) []byte { return ojson.Marshal(u.Ordered()) }

func feed(t *testing.T, a *Assembler, events ...string) {
	t.Helper()
	for _, e := range events {
		var m map[string]any
		if err := json.Unmarshal([]byte(e), &m); err != nil {
			t.Fatal(err)
		}
		a.Add(m)
	}
}

// 期望值取自 oracle kin-03 上现网 amd64 kernel 的非流式响应（2026-10-20）。
func TestFinishJSONMatchesProductionShape(t *testing.T) {
	a := NewAssembler()
	feed(t, a,
		`{"type":"message_start","message":{"model":"claude-haiku-5-5","id":"msg_1","type":"message","role":"assistant","content":[],"stop_reason":null,"stop_sequence":null,"stop_details":null,"container":null,"diagnostics":null,"context_management":null,"usage":{"input_tokens":18,"cache_creation_input_tokens":12565,"cache_read_input_tokens":0,"cache_creation":{"ephemeral_5m_input_tokens":0,"ephemeral_1h_input_tokens":12565},"output_tokens":1,"service_tier":"standard","inference_geo":"global"}}}`,
		`{"type":"content_block_start","index":0,"content_block":{"type":"thinking","thinking":"","signature":""}}`,
		`{"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"hm"}}`,
		`{"type":"content_block_delta","index":0,"delta":{"type":"signature_delta","signature":"sig"}}`,
		`{"type":"content_block_stop","index":0}`,
		`{"type":"content_block_start","index":1,"content_block":{"type":"text","text":""}}`,
		`{"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"a<b>&c"}}`,
		`{"type":"content_block_stop","index":1}`,
		`{"type":"content_block_start","index":2,"content_block":{"type":"tool_use","id":"toolu_1","name":"run","input":{},"caller":{"type":"direct"}}}`,
		`{"type":"content_block_delta","index":2,"delta":{"type":"input_json_delta","partial_json":"{\"zeta\":1,\"alpha\":{\"y\":2,\"b\":3}}"}}`,
		`{"type":"content_block_stop","index":2}`,
		`{"type":"message_delta","delta":{"stop_reason":"tool_use","stop_sequence":null},"usage":{"input_tokens":18,"cache_creation_input_tokens":12565,"cache_read_input_tokens":0,"output_tokens":86,"output_tokens_details":{"thinking_tokens":40}}}`,
		`{"type":"message_stop"}`,
	)
	got, err := a.FinishJSON()
	if err != nil {
		t.Fatal(err)
	}
	want := `{"id":"msg_1","type":"message","role":"assistant","model":"claude-haiku-5-5","content":[` +
		`{"type":"thinking","thinking":"hm","signature":"sig"},{"type":"text","text":"a<b>&c"},` +
		`{"type":"tool_use","id":"toolu_1","name":"run","input":{"zeta":1,"alpha":{"y":2,"b":3}}}],` +
		`"stop_reason":"tool_use","stop_sequence":null,` +
		`"usage":{"input_tokens":18,"output_tokens":86,"cache_creation_input_tokens":12565,"cache_creation":{"ephemeral_1h_input_tokens":12565}}}`
	if string(got) != want {
		t.Fatalf("got\n%s\nwant\n%s", got, want)
	}
	if a.UsageJSON() != `{"input_tokens":18,"output_tokens":86,"cache_creation_input_tokens":12565,"cache_creation":{"ephemeral_1h_input_tokens":12565}}` {
		t.Errorf("usage header %s", a.UsageJSON())
	}
}

func TestOrderedUsageAllZeroCache(t *testing.T) {
	u := Usage{"input_tokens": float64(44), "output_tokens": float64(9), "cache_creation_input_tokens": float64(0),
		"cache_read_input_tokens": float64(0), "speed": "standard",
		"cache_creation": map[string]any{"ephemeral_1h_input_tokens": float64(0), "ephemeral_5m_input_tokens": float64(0)}}
	if got := string(orderedJSON(u)); got != `{"input_tokens":44,"output_tokens":9,"cache_creation":{}}` {
		t.Fatalf("got %s", got)
	}
}
