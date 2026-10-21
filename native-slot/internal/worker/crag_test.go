package worker

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"vm2api/native-slot/internal/config"
)

// TestCragDataplaneE2E 验证原生内核复原的 crag 模式全链路：
// 测试指定：claude-haiku-5-5，max_tokens 8192。
func TestCragDataplaneE2E(t *testing.T) {
	if os.Getenv("FAKE_CRAG_CLI") == "1" {
		runFakeCragCLI()
		return
	}

	dir := t.TempDir()
	self, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}

	credPath := filepath.Join(dir, "credentials.json")
	if err := os.WriteFile(credPath, []byte(`{"access_token":"test-token"}`), 0o600); err != nil {
		t.Fatal(err)
	}

	cfg := &config.Resolved{
		Config: config.Config{
			VMID:           "vm-crag-test",
			SocketPath:     filepath.Join(dir, "worker.sock"),
			CredentialPath: credPath,
			InternalToken:  "test-internal-token",
			Provider:       "local_cli",
			Dataplane:      "crag",
			ClaudeBin:      self,
		},
		Slots:          2,
		MaxRequest:     64 << 20,
		MaxResponse:    64 << 20,
		MaxEvent:       32 << 20,
		IdleTimeout:    180 * time.Second,
		TZ:             "UTC",
		SessionIdleTTL: 600 * time.Second,
	}

	opts := DefaultOptions(cfg)
	opts.HostArgs = []string{"-test.run=TestCragDataplaneE2E"}
	opts.Stderr = os.Stderr

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 注入环境变量指示子进程作为 fake CLI 运行
	t.Setenv("FAKE_CRAG_CLI", "1")

	rt := New(ctx, cfg, opts)
	if err := rt.Start(); err != nil {
		t.Fatalf("rt.Start failed: %v", err)
	}

	targetModel := "claude-haiku-5-5"
	targetMaxTokens := 8192

	// 1. 测试流式请求：claude-haiku-5-5, max_tokens 8192
	t.Run("StreamRequest", func(t *testing.T) {
		reqBody := map[string]any{
			"model":      targetModel,
			"max_tokens": targetMaxTokens,
			"messages": []any{
				map[string]any{"role": "user", "content": "ping crag stream haiku 8192"},
			},
		}
		env := map[string]any{
			"body":       reqBody,
			"stream":     true,
			"request_id": "req-crag-stream-1",
		}
		envBytes, _ := json.Marshal(env)

		req := httptest.NewRequest("POST", "/internal/v1/messages", bytes.NewReader(envBytes))
		req.Header.Set("X-Internal-Token", "test-internal-token")
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		rt.ServeHTTP(w, req)
		res := w.Result()
		body, _ := io.ReadAll(res.Body)
		if res.StatusCode != 200 {
			t.Fatalf("expected 200, got %d, body: %s", res.StatusCode, string(body))
		}
		text := string(body)
		if !strings.Contains(text, "event: content_block_delta") || !strings.Contains(text, "Hello from Crag!") {
			t.Fatalf("stream body mismatch: %s", text)
		}
		if res.Trailer.Get("x-terminal-state") != "verified" {
			t.Fatalf("expected trailer x-terminal-state: verified, got %s", res.Trailer.Get("x-terminal-state"))
		}
	})

	// 2. 测试非流式请求：claude-haiku-5-5, max_tokens 8192
	t.Run("JSONRequest", func(t *testing.T) {
		reqBody := map[string]any{
			"model":      targetModel,
			"max_tokens": targetMaxTokens,
			"messages": []any{
				map[string]any{"role": "user", "content": "ping crag json haiku 8192"},
			},
		}
		env := map[string]any{
			"body":       reqBody,
			"stream":     false,
			"request_id": "req-crag-json-1",
		}
		envBytes, _ := json.Marshal(env)

		req := httptest.NewRequest("POST", "/internal/v1/messages", bytes.NewReader(envBytes))
		req.Header.Set("X-Internal-Token", "test-internal-token")
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		rt.ServeHTTP(w, req)
		res := w.Result()
		body, _ := io.ReadAll(res.Body)
		if res.StatusCode != 200 {
			t.Fatalf("expected 200, got %d, body: %s", res.StatusCode, string(body))
		}
		var respObj map[string]any
		if err := json.Unmarshal(body, &respObj); err != nil {
			t.Fatalf("invalid json response: %v, body: %s", err, string(body))
		}
		if respObj["type"] != "message" {
			t.Fatalf("expected type message, got %v", respObj["type"])
		}
		if respObj["stop_reason"] != "end_turn" {
			t.Fatalf("expected stop_reason end_turn, got %v", respObj["stop_reason"])
		}
		if respObj["model"] != targetModel {
			t.Fatalf("expected model %s, got %v", targetModel, respObj["model"])
		}
	})
}

// runFakeCragCLI 模拟实现了 singleProcessSlots 协议的假 CLI。
func runFakeCragCLI() {
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := scanner.Bytes()
		var in CragStdinFrame
		if err := json.Unmarshal(line, &in); err != nil {
			continue
		}
		if in.Type != "user" {
			continue
		}

		sessionID := in.SessionID
		respModel := in.Model
		if respModel == "" {
			respModel = "claude-haiku-5-5"
		}

		// 发送 message_start 事件
		msgStartEv := map[string]any{
			"type": "message_start",
			"message": map[string]any{
				"id":           "msg_" + sessionID,
				"type":         "message",
				"role":         "assistant",
				"model":        respModel,
				"content":      []any{},
				"stop_reason":  nil,
				"stop_sequence": nil,
				"usage": map[string]any{
					"input_tokens":  25,
					"output_tokens": 1,
				},
			},
		}
		sendCragFrame(CragStdoutFrame{
			Type:      "stream_event",
			SessionID: sessionID,
			Event:     mustJSON(msgStartEv),
		})

		// 发送 content_block_start
		startEv := map[string]any{
			"type":  "content_block_start",
			"index": 0,
			"content_block": map[string]any{
				"type": "text",
				"text": "",
			},
		}
		sendCragFrame(CragStdoutFrame{
			Type:      "stream_event",
			SessionID: sessionID,
			Event:     mustJSON(startEv),
		})

		// 发送 content_block_delta
		deltaEv := map[string]any{
			"type":  "content_block_delta",
			"index": 0,
			"delta": map[string]any{
				"type": "text_delta",
				"text": "Hello from Crag!",
			},
		}
		sendCragFrame(CragStdoutFrame{
			Type:      "stream_event",
			SessionID: sessionID,
			Event:     mustJSON(deltaEv),
		})

		// 发送 content_block_stop
		stopEv := map[string]any{
			"type":  "content_block_stop",
			"index": 0,
		}
		sendCragFrame(CragStdoutFrame{
			Type:      "stream_event",
			SessionID: sessionID,
			Event:     mustJSON(stopEv),
		})

		// 发送 message_delta
		msgDeltaEv := map[string]any{
			"type": "message_delta",
			"delta": map[string]any{
				"stop_reason": "end_turn",
			},
			"usage": map[string]any{
				"output_tokens": 18,
			},
		}
		sendCragFrame(CragStdoutFrame{
			Type:      "stream_event",
			SessionID: sessionID,
			Event:     mustJSON(msgDeltaEv),
		})

		// 发送 result 终结帧
		usageBytes := mustJSON(map[string]any{
			"input_tokens":  25,
			"output_tokens": 18,
		})
		sendCragFrame(CragStdoutFrame{
			Type:       "result",
			Subtype:    "success",
			SessionID:  sessionID,
			StopReason: "end_turn",
			Result:     "Hello from Crag!",
			Usage:      usageBytes,
		})
	}
}

func sendCragFrame(f CragStdoutFrame) {
	b, _ := json.Marshal(f)
	fmt.Fprintf(os.Stdout, "%s\n", string(b))
}

func mustJSON(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}
