// Package clihost 实现 CLI 宿主的槽位模式（02、03、07 7.2）。
package clihost

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"vm2api/native-slot/internal/classifier"
	"vm2api/native-slot/internal/credential"
	"vm2api/native-slot/internal/frame"
	"vm2api/native-slot/internal/ojson"
	"vm2api/native-slot/internal/upstream"
)

// SlotCount 解析 CLAUDE_CODE_NATIVE_SLOTS；未激活返回 0。
func SlotCount() int {
	raw := os.Getenv("CLAUDE_CODE_NATIVE_SLOTS")
	if raw == "" {
		raw = os.Getenv("CLAUDE_CODE_KIN_NATIVE_SLOTS")
	}
	f, err := strconv.ParseFloat(strings.TrimSpace(raw), 64)
	if err != nil || f <= 0 {
		return 0
	}
	n := int(f)
	if n < 1 {
		n = 1
	}
	if n > 20 {
		n = 20
	}
	return n
}

type slot struct {
	id     string
	phase  string // idle / running / cancelling
	jobID  string
	cancel context.CancelFunc
	done   chan struct{}
}

// Host 是槽位模式的运行时。
type Host struct {
	out      *frame.Writer
	client   *upstream.Client
	identity *upstream.Identity
	maxEvent int

	mu    sync.Mutex
	slots map[string]*slot
	order []string
	wg    sync.WaitGroup
}

// Run 输出握手后循环处理 stdin 帧，直到 stdin 关闭。
func Run(ctx context.Context, in io.Reader, out io.Writer, n int) error {
	os.Setenv("CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK", "1")
	os.Setenv("CLAUDE_CODE_ENTRYPOINT", "sdk-cli")
	if os.Getenv("USER_TYPE") == "" {
		os.Setenv("USER_TYPE", "external")
	}
	if os.Getenv("CLAUDE_CODE_VERSION") == "" {
		os.Setenv("CLAUDE_CODE_VERSION", "2.1.296")
	}
	fmt.Fprintf(os.Stderr, "[kin] native_messages loop n=%d protocol=%d\n", n, frame.ProtocolVersion)
	h := &Host{
		out:      frame.NewWriter(out),
		client:   upstream.NewClient(),
		identity: upstream.NewIdentity(),
		maxEvent: 64 << 20,
		slots:    map[string]*slot{},
	}
	ready := frame.HostReady{Type: "host_ready", ProtocolVersion: frame.ProtocolVersion, Slots: n,
		SystemLayout: upstream.Layout(), Timezone: upstream.Timezone(), Capabilities: frame.Capabilities,
		ConfigHash: os.Getenv("CLAUDE_CODE_CONFIG_HASH")}
	if err := h.out.Send(ready); err != nil {
		return err
	}
	for i := 0; i < n; i++ {
		id := frame.SlotID(i)
		h.slots[id] = &slot{id: id, phase: "idle"}
		h.order = append(h.order, id)
		if err := h.out.Send(frame.SlotReady{Type: "slot_ready", SlotID: id}); err != nil {
			return err
		}
	}
	ctx, stop := context.WithCancel(ctx)
	defer func() { stop(); h.wg.Wait() }()
	lines := frame.NewLineReader(in, 0)
	for {
		line, err := lines.Next()
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
		h.dispatch(ctx, line)
	}
}

type inbound struct {
	Type           string          `json:"type"`
	JobID          string          `json:"job_id"`
	SlotID         *string         `json:"slot_id"`
	Nonce          json.RawMessage `json:"nonce"`
	Request        json.RawMessage `json:"request"`
	RequestContext json.RawMessage `json:"request_context"`
}

func (h *Host) dispatch(ctx context.Context, line []byte) {
	line = []byte(strings.TrimSpace(string(line)))
	if len(line) == 0 {
		return
	}
	var msg inbound
	if json.Unmarshal(line, &msg) != nil {
		return
	}
	slotID := ""
	if msg.SlotID != nil {
		slotID = *msg.SlotID
	}
	switch msg.Type {
	case "ping":
		var nonce any
		_ = json.Unmarshal(msg.Nonce, &nonce)
		_ = h.out.Send(map[string]any{"type": "pong", "nonce": nonce})
	case "cancel":
		h.cancel(slotID, msg.SlotID != nil, msg.JobID)
	case "job_start":
		h.start(ctx, slotID, msg)
	}
}

func (h *Host) fail(jobID, slotID, message, code string, status int, kind string) {
	_ = h.out.Send(frame.JobError{Type: "job_error", JobID: jobID, SlotID: slotID, Error: message,
		Code: code, Status: status, ErrorType: kind})
}

func (h *Host) start(ctx context.Context, slotID string, msg inbound) {
	request, err := ojson.ParseObject(msg.Request)
	if err != nil {
		request = ojson.NewObject()
	}
	var rc *ojson.Object
	if len(msg.RequestContext) > 0 {
		rc, _ = ojson.ParseObject(msg.RequestContext)
		if !classifier.Valid(rc, request) {
			h.fail(msg.JobID, slotID, "Invalid classifier request context", "invalid_request_context", 400, "invalid_request_error")
			return
		}
	}
	h.mu.Lock()
	s := h.slots[slotID]
	if s == nil {
		h.mu.Unlock()
		h.fail(msg.JobID, slotID, "unknown slot "+slotID, "cli_error", 502, "api_error")
		return
	}
	if s.phase != "idle" {
		phase := s.phase
		h.mu.Unlock()
		h.fail(msg.JobID, s.id, fmt.Sprintf("slot %s busy phase=%s", s.id, phase), "cli_error", 502, "api_error")
		return
	}
	jobCtx, cancel := context.WithCancel(ctx)
	s.phase, s.jobID, s.cancel, s.done = "running", msg.JobID, cancel, make(chan struct{})
	done := s.done
	h.mu.Unlock()
	h.wg.Add(1)
	go func() {
		defer h.wg.Done()
		defer close(done)
		defer cancel()
		h.runJob(jobCtx, s.id, msg.JobID, request, rc)
		h.mu.Lock()
		if s.jobID == msg.JobID {
			s.phase, s.jobID, s.cancel, s.done = "idle", "", nil, nil
		}
		h.mu.Unlock()
	}()
}

func (h *Host) cancel(slotID string, hasSlot bool, jobID string) {
	h.mu.Lock()
	var wait chan struct{}
	if s := h.slots[slotID]; hasSlot && s != nil && s.jobID == jobID && s.done != nil {
		if s.phase == "running" {
			s.phase = "cancelling"
			s.cancel()
		}
		wait = s.done
	}
	h.mu.Unlock()
	go func() {
		if wait != nil {
			<-wait
		}
		if err := h.out.Send(frame.CancelAck{Type: "cancel_ack", JobID: jobID, SlotID: slotID}); err != nil {
			fmt.Fprintf(os.Stderr, "[kin] cancel ack write failed: %v\n", err)
		}
	}()
}

// SessionIDFromRequest 从 metadata.user_id（JSON 字符串或对象）取 session_id。
func SessionIDFromRequest(request *ojson.Object) string {
	md := ojson.Obj(request.Get("metadata"))
	if md == nil || !md.Has("user_id") {
		return ""
	}
	var parsed *ojson.Object
	switch v := md.Get("user_id").(type) {
	case string:
		o, err := ojson.ParseObject([]byte(v))
		if err != nil {
			return ""
		}
		parsed = o
	case *ojson.Object:
		parsed = v
	}
	id, ok := parsed.Get("session_id").(string)
	if !ok {
		return ""
	}
	return strings.TrimSpace(id)
}

// CredentialPath 按宿主环境定位凭据文件，取第一个存在的候选。
func CredentialPath() string {
	var candidates []string
	if v := os.Getenv("KIN_CREDENTIAL_FILE"); v != "" {
		candidates = append(candidates, v)
	}
	if b, err := os.ReadFile(upstream.KernelConfigPath()); err == nil {
		var cfg struct {
			CredentialPath string `json:"credential_path"`
		}
		if json.Unmarshal(b, &cfg) == nil && cfg.CredentialPath != "" {
			candidates = append(candidates, cfg.CredentialPath)
		}
	}
	dir := upstream.ConfigDir()
	candidates = append(candidates, filepath.Join(dir, ".credentials.json"), filepath.Join(dir, "credentials.json"))
	if home, err := os.UserHomeDir(); err == nil {
		candidates = append(candidates, filepath.Join(home, ".claude", ".credentials.json"),
			filepath.Join(home, ".claude", "credentials.json"))
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return candidates[0]
}

func (h *Host) runJob(ctx context.Context, slotID, jobID string, request, rc *ojson.Object) {
	session := SessionIDFromRequest(request)
	var rateHeaders map[string]string
	emitHeaders := func() {
		if len(rateHeaders) == 0 {
			return
		}
		_ = h.out.Send(map[string]any{"type": "stream_event", "job_id": jobID, "slot_id": slotID,
			"event": map[string]any{"type": "response_headers", "headers": rateHeaders}})
	}
	failJob := func(f *upstream.Failure) {
		if ctx.Err() != nil {
			return
		}
		emitHeaders()
		if f.RetryAfter == "" {
			f.RetryAfter = rateHeaders["retry-after"]
		}
		if f.RequestID == "" {
			f.RequestID = rateHeaders["request-id"]
		}
		_ = h.out.Send(f.Frame(jobID, slotID))
	}
	cred, err := credential.Load(CredentialPath())
	if err != nil {
		failJob(&upstream.Failure{Error: "Not logged in · Please run /login", Code: "upstream_auth_error",
			Status: 401, ErrorType: "authentication_error"})
		return
	}
	built, err := upstream.Build(upstream.BuildInput{Request: request, RequestContext: rc, SessionID: session,
		Credential: cred, Identity: h.identity})
	if err != nil {
		var fe *upstream.FailureError
		if errors.As(err, &fe) {
			failJob(fe.Failure)
			return
		}
		failJob(&upstream.Failure{Error: err.Error(), Code: "cli_error", Status: 502, ErrorType: "api_error"})
		return
	}
	res := h.client.Stream(ctx, built, h.maxEvent, func(ev json.RawMessage) error {
		return h.out.Send(frame.StreamEvent{Type: "stream_event", JobID: jobID, SlotID: slotID, Event: ev})
	})
	rateHeaders = res.Headers
	if ctx.Err() != nil {
		return
	}
	if res.Failure != nil {
		failJob(res.Failure)
		return
	}
	emitHeaders()
	done := map[string]any{"type": "job_done", "job_id": jobID, "slot_id": slotID, "stop_reason": "", "usage": map[string]any{}}
	if len(rateHeaders) > 0 {
		done["headers"] = rateHeaders
	}
	_ = h.out.Send(done)
}
