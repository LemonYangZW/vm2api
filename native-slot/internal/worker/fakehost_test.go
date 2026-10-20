package worker

import (
	"bufio"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"
)

// fakeHost 是参数化的假 CLI 宿主（复刻探针 handshake-cli.py / done-cli.py）。
func fakeHost() int {
	out := bufio.NewWriter(os.Stdout)
	emit := func(v any) {
		b, _ := json.Marshal(v)
		out.Write(append(b, '\n'))
		out.Flush()
	}
	env := func(k, def string) string {
		if v, ok := os.LookupEnv(k); ok {
			return v
		}
		return def
	}
	if os.Getenv("FAKE_NO_READY") == "1" {
		_, _ = io.Copy(io.Discard, os.Stdin)
		return 0
	}
	proto, _ := strconv.Atoi(env("FAKE_PROTO", "2"))
	caps := strings.Split(env("FAKE_CAPS", "multi_slot,native_sse,stateless,ping,classifier_request_context"), ",")
	ready := map[string]any{"type": "host_ready", "protocol_version": proto, "slots": 1,
		"system_layout": env("FAKE_LAYOUT", "zero"), "timezone": env("FAKE_TZ", os.Getenv("CLAUDE_CODE_TIMEZONE")),
		"capabilities": caps}
	if h, ok := os.LookupEnv("FAKE_HASH"); ok {
		ready["config_hash"] = h
	}
	emit(ready)
	emit(map[string]any{"type": "slot_ready", "slot_id": "s00"})
	mode := os.Getenv("FAKE_HOST_MODE")
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 64<<20)
	for sc.Scan() {
		var msg map[string]any
		if json.Unmarshal(sc.Bytes(), &msg) != nil {
			continue
		}
		job, slot := msg["job_id"], msg["slot_id"]
		switch msg["type"] {
		case "ping":
			if mode != "mute" {
				emit(map[string]any{"type": "pong", "nonce": msg["nonce"]})
			}
		case "cancel":
			if mode != "noack" && mode != "mute" {
				emit(map[string]any{"type": "cancel_ack", "job_id": job, "slot_id": slot})
			}
		case "job_start":
			start := map[string]any{"type": "stream_event", "job_id": job, "slot_id": slot, "event": map[string]any{
				"type": "message_start", "message": map[string]any{"id": "m", "type": "message", "role": "assistant",
					"model": "claude-haiku-5-5", "content": []any{}, "usage": map[string]any{"input_tokens": 1}}}}
			switch mode {
			case "silent", "noack", "mute":
				continue
			case "err_string":
				emit(map[string]any{"type": "job_error", "job_id": job, "slot_id": slot, "error": "boom",
					"code": "probe_code", "status": 400, "error_type": "invalid_request_error"})
			case "err_object":
				emit(map[string]any{"type": "job_error", "job_id": job, "slot_id": slot, "error": map[string]any{"message": "boom"}, "status": 400})
			case "done_null_stop":
				emit(start)
				emit(map[string]any{"type": "job_done", "job_id": job, "slot_id": slot, "usage": map[string]any{}, "stop_reason": nil})
			default:
				emit(map[string]any{"type": "bogus_variant", "x": 1})
				emit(start)
				for _, ev := range []map[string]any{
					{"type": "content_block_start", "index": 0, "content_block": map[string]any{"type": "text", "text": ""}},
					{"type": "content_block_delta", "index": 0, "delta": map[string]any{"type": "text_delta", "text": "ok"}},
					{"type": "content_block_stop", "index": 0},
					{"type": "message_delta", "delta": map[string]any{"stop_reason": "end_turn"}, "usage": map[string]any{"output_tokens": 1}},
					{"type": "message_stop"},
				} {
					emit(map[string]any{"type": "stream_event", "job_id": job, "slot_id": slot, "event": ev})
				}
				done := map[string]any{"type": "job_done", "job_id": job, "slot_id": slot, "stop_reason": ""}
				switch mode {
				case "done_null_usage":
					done["usage"] = nil
					done["stop_reason"] = "end_turn"
				case "done_missing_usage":
				default:
					done["usage"] = map[string]any{}
				}
				emit(done)
			}
		}
	}
	return 0
}

var hostReadyOverride time.Duration

func fakeArgs() []string { return []string{"-test.run=^$"} }

func selfBin(t *testing.T) string {
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	return exe
}

// A 组：握手校验矩阵。
func TestHandshakeMatrix(t *testing.T) {
	cases := []struct {
		name   string
		env    map[string]string
		accept bool
	}{
		{"baseline", nil, true},
		{"identity layout", map[string]string{"FAKE_LAYOUT": "identity"}, false},
		{"stock layout", map[string]string{"FAKE_LAYOUT": "stock"}, false},
		{"protocol 1", map[string]string{"FAKE_PROTO": "1"}, false},
		{"protocol 3", map[string]string{"FAKE_PROTO": "3"}, false},
		{"missing stateless", map[string]string{"FAKE_CAPS": "multi_slot,native_sse,ping"}, false},
		{"missing multi_slot", map[string]string{"FAKE_CAPS": "native_sse,stateless"}, false},
		{"missing ping ok", map[string]string{"FAKE_CAPS": "stateless,native_sse,multi_slot"}, true},
		{"timezone mismatch", map[string]string{"FAKE_TZ": "UTC"}, false},
		{"config hash ignored", map[string]string{"FAKE_HASH": "abc"}, true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			env := map[string]string{"FAKE_HOST_MODE": "normal"}
			for k, v := range c.env {
				env[k] = v
			}
			_, err := startKernel(t, nil, 1, selfBin(t), fakeArgs(), env)
			if c.accept && err != nil {
				t.Fatalf("expected accept, got %v", err)
			}
			if !c.accept && (err == nil || !strings.Contains(err.Error(), "refusing to register slots")) {
				t.Fatalf("expected rejection, got %v", err)
			}
		})
	}
	t.Run("no host_ready", func(t *testing.T) {
		env := map[string]string{"FAKE_HOST_MODE": "normal", "FAKE_NO_READY": "1"}
		start := time.Now()
		_, err := startKernelWithReady(t, env, 1*time.Second)
		if err == nil || time.Since(start) > 10*time.Second {
			t.Fatalf("expected handshake timeout, got %v", err)
		}
	})
}

func startKernelWithReady(t *testing.T, env map[string]string, d time.Duration) (*kernelFixture, error) {
	old := hostReadyOverride
	hostReadyOverride = d
	defer func() { hostReadyOverride = old }()
	return startKernel(t, nil, 1, selfBin(t), fakeArgs(), env)
}

// B 组：帧字段可选性。
func TestFrameShapes(t *testing.T) {
	type expect struct {
		mode   string
		status int
		hang   bool
	}
	for _, c := range []expect{
		{"done_empty", 200, false},
		{"done_null_usage", 200, false},
		{"done_missing_usage", 200, false},
		{"done_null_stop", 0, true},
		{"err_string", 400, false},
		{"err_object", 0, true},
	} {
		t.Run(c.mode, func(t *testing.T) {
			k, err := startKernel(t, nil, 1, selfBin(t), fakeArgs(), map[string]string{"FAKE_HOST_MODE": c.mode})
			if err != nil {
				t.Fatal(err)
			}
			env := msgEnvelope("claude-haiku-5-5", false)
			b, _ := json.Marshal(env)
			req, _ := http.NewRequest(http.MethodPost, k.srv.URL+"/internal/v1/messages", strings.NewReader(string(b)))
			req.Header.Set("x-internal-token", "tok")
			client := &http.Client{Timeout: 1500 * time.Millisecond}
			resp, err := client.Do(req)
			if c.hang {
				if err == nil {
					resp.Body.Close()
					t.Fatalf("frame should have been dropped, got status %d", resp.StatusCode)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			defer resp.Body.Close()
			var body map[string]any
			_ = json.NewDecoder(resp.Body).Decode(&body)
			if resp.StatusCode != c.status {
				t.Fatalf("status %d body %v", resp.StatusCode, body)
			}
			if c.mode == "err_string" {
				inner := body["error"].(map[string]any)
				if inner["message"] != "boom" || inner["code"] != "cli_error" || inner["type"] != "invalid_request_error" || inner["status"] != float64(400) {
					t.Errorf("job_error mapping %v", body)
				}
			}
		})
	}
}

// D 组：空闲看门狗 ping + cancel；不回 cancel_ack 时重启宿主。
func TestWatchdog(t *testing.T) {
	t.Run("idle job gets ping and cancel", func(t *testing.T) {
		k, err := startKernel(t, nil, 1, selfBin(t), fakeArgs(), map[string]string{"FAKE_HOST_MODE": "silent",
			"TEST_JOB_IDLE": "300ms", "TEST_CANCEL_ACK": "5s"})
		if err != nil {
			t.Fatal(err)
		}
		resp := k.post(t, "/internal/v1/messages", msgEnvelope("x", false), nil)
		var body map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&body)
		resp.Body.Close()
		if resp.StatusCode != 504 {
			t.Fatalf("idle job: %d %v", resp.StatusCode, body)
		}
		time.Sleep(300 * time.Millisecond)
		if h := k.rt.Health(); h["ready_slots"] != 1 || h["cli_restarts"] != 0 {
			t.Errorf("after ack: %v", h)
		}
	})
	t.Run("missing cancel_ack restarts host", func(t *testing.T) {
		k, err := startKernel(t, nil, 1, selfBin(t), fakeArgs(), map[string]string{"FAKE_HOST_MODE": "noack",
			"TEST_JOB_IDLE": "200ms", "TEST_CANCEL_ACK": "400ms"})
		if err != nil {
			t.Fatal(err)
		}
		resp := k.post(t, "/internal/v1/messages", msgEnvelope("x", false), nil)
		resp.Body.Close()
		deadline := time.Now().Add(5 * time.Second)
		var restarts any
		for time.Now().Before(deadline) {
			restarts = k.rt.Health()["cli_restarts"]
			if restarts == 1 && k.rt.Health()["ready_slots"] == 1 {
				return
			}
			time.Sleep(50 * time.Millisecond)
		}
		t.Fatalf("host not restarted: %v", k.rt.Health())
	})
	t.Run("pure idle sends no ping", func(t *testing.T) {
		k, err := startKernel(t, nil, 1, selfBin(t), fakeArgs(), map[string]string{"FAKE_HOST_MODE": "normal", "TEST_JOB_IDLE": "100ms"})
		if err != nil {
			t.Fatal(err)
		}
		time.Sleep(500 * time.Millisecond)
		k.rt.mu.Lock()
		n := len(k.rt.jobs)
		k.rt.mu.Unlock()
		if n != 0 {
			t.Fatalf("unexpected jobs: %d", n)
		}
	})
}
