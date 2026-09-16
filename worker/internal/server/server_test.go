package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/dofastted/kin-gateway/worker/internal/config"
	"github.com/dofastted/kin-gateway/worker/internal/credential"
	"github.com/dofastted/kin-gateway/worker/internal/upstream"
)

func TestMessagesNonStreamRequiresCompleteMessage(t *testing.T) {
	anthropic := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("Authorization") != "Bearer access" {
			t.Fatalf("authorization = %q", request.Header.Get("Authorization"))
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"type":"message","id":"msg_1","role":"assistant","content":[{"type":"text","text":"ok"}],"usage":{"input_tokens":1,"output_tokens":1}}`))
	}))
	defer anthropic.Close()
	worker := testServer(t, anthropic.URL)
	payload := messageEnvelope(false, "realtime")
	request := httptest.NewRequest(http.MethodPost, "/internal/v1/messages", bytes.NewReader(payload))
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	if recorder.Header().Get("X-Kin-Terminal-State") != "verified" {
		t.Fatalf("terminal state = %q", recorder.Header().Get("X-Kin-Terminal-State"))
	}
}

func TestVerifiedStreamRejectsMissingTerminalBeforeCommit(t *testing.T) {
	anthropic := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/event-stream")
		_, _ = writer.Write([]byte("data: {\"type\":\"message_start\",\"message\":{}}\n\n"))
	}))
	defer anthropic.Close()
	worker := testServer(t, anthropic.URL)
	request := httptest.NewRequest(http.MethodPost, "/internal/v1/messages", bytes.NewReader(messageEnvelope(true, "verified")))
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusBadGateway {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "message_stop") {
		t.Fatalf("body=%s, want terminal error", recorder.Body.String())
	}
}

func TestRealtimeStreamInjectsBodyStreamFlag(t *testing.T) {
	var sawBody map[string]any
	anthropic := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		defer request.Body.Close()
		if err := json.NewDecoder(request.Body).Decode(&sawBody); err != nil {
			t.Fatalf("decode upstream body: %v", err)
		}
		writer.Header().Set("Content-Type", "text/event-stream")
		_, _ = writer.Write([]byte(
			"data: {\"type\":\"message_start\",\"message\":{}}\n\n" +
				"data: {\"type\":\"message_stop\"}\n\n",
		))
	}))
	defer anthropic.Close()
	worker := testServer(t, anthropic.URL)
	payload := map[string]any{
		"body": map[string]any{
			"model":      "claude-test",
			"max_tokens": 8,
			"messages":   []map[string]any{{"role": "user", "content": "hi"}},
		},
		"headers":       map[string]string{"user-agent": "claude-cli/test"},
		"stream":        true,
		"delivery_mode": "realtime",
	}
	data, _ := json.Marshal(payload)
	request := httptest.NewRequest(http.MethodPost, "/internal/v1/messages", bytes.NewReader(data))
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	if sawBody["stream"] != true {
		t.Fatalf("upstream body stream=%v body=%v, want true", sawBody["stream"], sawBody)
	}
}

func TestRealtimeStreamReportsVerifiedTrailer(t *testing.T) {
	anthropic := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/event-stream")
		_, _ = writer.Write([]byte(
			"data: {\"type\":\"message_start\",\"message\":{\"model\":\"claude-haiku-4-5-20251001\",\"usage\":{\"input_tokens\":12,\"cache_read_input_tokens\":3,\"cache_creation_input_tokens\":7,\"cache_creation\":{\"ephemeral_5m_input_tokens\":5,\"ephemeral_1h_input_tokens\":2}}}}\n\n" +
				"data: {\"type\":\"message_delta\",\"delta\":{\"stop_reason\":\"end_turn\"},\"usage\":{\"output_tokens\":4}}\n\n" +
				"data: {\"type\":\"message_stop\"}\n\n",
		))
	}))
	defer anthropic.Close()
	worker := testServer(t, anthropic.URL)
	request := httptest.NewRequest(http.MethodPost, "/internal/v1/messages", bytes.NewReader(messageEnvelope(true, "realtime")))
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "message_stop") {
		t.Fatalf("stream body=%s", recorder.Body.String())
	}
	result := recorder.Result()
	if result.Trailer.Get("X-Kin-Terminal-State") != "verified" {
		t.Fatalf("terminal trailer=%q headers=%v", result.Trailer.Get("X-Kin-Terminal-State"), result.Header)
	}
	if result.Trailer.Get("X-Kin-Model") != "claude-haiku-4-5-20251001" {
		t.Fatalf("model trailer=%q", result.Trailer.Get("X-Kin-Model"))
	}
	if result.Trailer.Get("X-Kin-Stop-Reason") != "end_turn" {
		t.Fatalf("stop-reason trailer=%q", result.Trailer.Get("X-Kin-Stop-Reason"))
	}
	var usage map[string]any
	if err := json.Unmarshal([]byte(result.Trailer.Get("X-Kin-Usage")), &usage); err != nil {
		t.Fatalf("usage trailer: %v", err)
	}
	if usage["input_tokens"] != float64(12) || usage["output_tokens"] != float64(4) {
		t.Fatalf("usage=%v", usage)
	}
	if usage["cache_read_input_tokens"] != float64(3) || usage["cache_creation_input_tokens"] != float64(7) {
		t.Fatalf("cache usage=%v", usage)
	}
	cacheCreation, ok := usage["cache_creation"].(map[string]any)
	if !ok || cacheCreation["ephemeral_5m_input_tokens"] != float64(5) || cacheCreation["ephemeral_1h_input_tokens"] != float64(2) {
		t.Fatalf("cache creation=%v", usage["cache_creation"])
	}
}

func TestRealtimeStreamWritesHeadersBeforeFirstEvent(t *testing.T) {
	hold := make(chan struct{})
	anthropic := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/event-stream")
		writer.WriteHeader(http.StatusOK)
		if flusher, ok := writer.(http.Flusher); ok {
			flusher.Flush()
		}
		<-hold
		_, _ = writer.Write([]byte(
			"data: {\"type\":\"message_start\",\"message\":{}}\n\n" +
				"data: {\"type\":\"message_stop\"}\n\n",
		))
	}))
	defer anthropic.Close()
	worker := testServer(t, anthropic.URL)
	recorder := httptest.NewRecorder()
	wrote := make(chan struct{})
	probe := &headerProbe{ResponseWriter: recorder, wrote: wrote}
	done := make(chan struct{})
	go func() {
		defer close(done)
		request := httptest.NewRequest(http.MethodPost, "/internal/v1/messages", bytes.NewReader(messageEnvelope(true, "realtime")))
		worker.Handler().ServeHTTP(probe, request)
	}()
	select {
	case <-wrote:
	case <-time.After(2 * time.Second):
		close(hold)
		<-done
		t.Fatal("worker did not write headers before first SSE event")
	}
	if recorder.Code != http.StatusOK {
		close(hold)
		<-done
		t.Fatalf("status=%d", recorder.Code)
	}
	close(hold)
	<-done
}

func TestRealtimeStreamIncompleteIncludesCause(t *testing.T) {
	anthropic := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/event-stream")
		_, _ = writer.Write([]byte("data: {\"type\":\"message_start\",\"message\":{}}\n\n"))
	}))
	defer anthropic.Close()
	worker := testServer(t, anthropic.URL)
	request := httptest.NewRequest(http.MethodPost, "/internal/v1/messages", bytes.NewReader(messageEnvelope(true, "realtime")))
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	body := recorder.Body.String()
	if !strings.Contains(body, "stream closed before message_stop") {
		t.Fatalf("body=%s, want incomplete cause", body)
	}
	if !strings.Contains(body, "upstream_stream_incomplete") {
		t.Fatalf("body=%s, want incomplete code", body)
	}
}

func TestRealtimeStreamEnforcesTotalResponseLimit(t *testing.T) {
	anthropic := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/event-stream")
		_, _ = writer.Write([]byte(
			strings.Repeat(" ", 200) +
				"data: {\"type\":\"message_start\",\"message\":{}}\n\n" +
				"data: {\"type\":\"message_stop\"}\n\n",
		))
	}))
	defer anthropic.Close()
	worker := testServer(t, anthropic.URL)
	worker.Config.MaxResponseBytes = 100
	request := httptest.NewRequest(http.MethodPost, "/internal/v1/messages", bytes.NewReader(messageEnvelope(true, "realtime")))
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "stream response exceeds 100 bytes") {
		t.Fatalf("body=%s, want response limit error", recorder.Body.String())
	}
	if recorder.Result().Trailer.Get("X-Kin-Terminal-State") != "incomplete" {
		t.Fatalf("terminal trailer=%q", recorder.Result().Trailer.Get("X-Kin-Terminal-State"))
	}
}

func TestRealtimeStreamRedactsUpstreamErrorEvent(t *testing.T) {
	anthropic := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/event-stream")
		_, _ = writer.Write([]byte(
			"data: {\"type\":\"message_start\",\"message\":{}}\n\n" +
				"data: {\"type\":\"error\",\"error\":{\"message\":\"secret-token\"}}\n\n",
		))
	}))
	defer anthropic.Close()
	worker := testServer(t, anthropic.URL)
	request := httptest.NewRequest(http.MethodPost, "/internal/v1/messages", bytes.NewReader(messageEnvelope(true, "realtime")))
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	body := recorder.Body.String()
	if strings.Contains(body, "secret-token") {
		t.Fatalf("body leaked upstream error: %s", body)
	}
	if !strings.Contains(body, "upstream SSE error event") {
		t.Fatalf("body=%s, want redacted upstream error", body)
	}
}

type headerProbe struct {
	http.ResponseWriter
	wrote chan struct{}
	once  sync.Once
}

func (h *headerProbe) WriteHeader(code int) {
	h.ResponseWriter.WriteHeader(code)
	h.once.Do(func() { close(h.wrote) })
}

func (h *headerProbe) Flush() {
	if flusher, ok := h.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

func TestProxyRequiredFailsWithoutProxy(t *testing.T) {
	if _, err := upstream.NewHTTPClient("", true, time.Second); err == nil {
		t.Fatal("proxy-required client accepted empty proxy")
	}
}

func testServer(t *testing.T, base string) *Server {
	t.Helper()
	path := filepath.Join(t.TempDir(), "credentials.json")
	store := credential.NewStore(path)
	if _, err := store.Save(credential.Credential{
		AccessToken:  "access",
		RefreshToken: "refresh",
		ExpiresAt:    time.Now().Add(time.Hour).UnixMilli(),
	}, nil); err != nil {
		t.Fatal(err)
	}
	// Loopback httptest only. Production NewHTTPClient refuses any dial
	// without slot SOCKS5 even when proxy_required=false.
	httpClient := &http.Client{Timeout: 5 * time.Second}
	baseURL, _ := url.Parse(base)
	client := &upstream.Client{HTTP: httpClient, Store: store, AnthropicBase: baseURL}
	return &Server{
		Config: config.Config{
			VMID:             "vm-test",
			InternalToken:    "",
			MaxRequestBytes:  1 << 20,
			MaxResponseBytes: 1 << 20,
			MaxEventBytes:    1 << 20,
			FirstByteTimeout: time.Second,
			IdleTimeout:      time.Second,
			DeliveryMode:     "realtime",
		},
		Store:    store,
		Upstream: client,
	}
}

func messageEnvelope(stream bool, delivery string) []byte {
	payload := map[string]any{
		"body": map[string]any{
			"model":      "claude-test",
			"max_tokens": 8,
			"stream":     stream,
			"messages":   []map[string]any{{"role": "user", "content": "hi"}},
		},
		"headers":       map[string]string{"user-agent": "claude-cli/test"},
		"stream":        stream,
		"delivery_mode": delivery,
	}
	data, _ := json.Marshal(payload)
	return data
}

func TestIdentityReportsGuestFacts(t *testing.T) {
	worker := testServer(t, "https://api.anthropic.com")
	worker.Config.RuntimeKind = "docker"
	request := httptest.NewRequest(http.MethodGet, "/internal/identity", nil)
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	ident, _ := body["identity"].(map[string]any)
	if ident["runtime_kind"] != "docker" {
		t.Fatalf("identity=%v", ident)
	}
	if ident["schema_version"] != "1" {
		t.Fatalf("schema=%v", ident["schema_version"])
	}
}

func TestCredentialImportIsGoneOnSlot(t *testing.T) {
	worker := testServer(t, "https://api.anthropic.com")
	body := `{"access_token":"new-access","refresh_token":"new-refresh","expires_in":3600}`
	request := httptest.NewRequest(http.MethodPost, "/internal/credential/import", strings.NewReader(body))
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusGone {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
}

func TestHealthStripsLeftoverFatalWhenTicketIsLive(t *testing.T) {
	worker := testServer(t, "https://api.anthropic.com")
	worker.setLastError(fmt.Errorf("OAuth refresh failed (invalid_grant): leftover"))
	request := httptest.NewRequest(http.MethodGet, "/internal/health", nil)
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["last_error"] != nil && body["last_error"] != "" {
		t.Fatalf("health last_error=%v", body["last_error"])
	}
	if got := worker.getLastError(); got != "" {
		t.Fatalf("last_error after health = %q", got)
	}
}

func TestCountTokensPostsAnthropicPath(t *testing.T) {
	gotPath := ""
	anthropic := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		gotPath = request.URL.Path
		if request.Header.Get("Authorization") != "Bearer access" {
			t.Errorf("authorization = %q", request.Header.Get("Authorization"))
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"input_tokens":8}`))
	}))
	defer anthropic.Close()
	worker := testServer(t, anthropic.URL)
	payload := map[string]any{
		"body": map[string]any{
			"model":    "claude-haiku-4-5-20251001",
			"messages": []map[string]any{{"role": "user", "content": "hello"}},
		},
		"headers": map[string]string{"anthropic-beta": "oauth-2025-04-20"},
	}
	data, _ := json.Marshal(payload)
	request := httptest.NewRequest(http.MethodPost, "/internal/v1/messages/count_tokens", bytes.NewReader(data))
	recorder := httptest.NewRecorder()
	worker.Handler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
	if gotPath != "/v1/messages/count_tokens" {
		t.Fatalf("upstream path = %q", gotPath)
	}
	if recorder.Body.String() != `{"input_tokens":8}` {
		t.Fatalf("body=%s", recorder.Body.String())
	}
}
