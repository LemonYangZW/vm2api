// Package worker 实现 kin-kernel --gateway-worker：宿主生命周期、槽位调度、
// 看门狗与 Unix socket 上的内部接口（05 5.4–5.9）。
package worker

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"vm2api/native-slot/internal/config"
	"vm2api/native-slot/internal/frame"
)

// Options 是可由环境变量调整的运行参数。
type Options struct {
	JobIdle        time.Duration // JOB_IDLE_SECS
	CancelAck      time.Duration // CANCEL_ACK_SECS
	ClientStall    time.Duration // CLIENT_STALL_SECS
	PingInterval   time.Duration
	HostReady      time.Duration // 等待 host_ready 的上限
	RestartBudget  int
	RestartWindow  time.Duration
	StickyTTL      time.Duration
	MaxPending     int
	SubmitWait     time.Duration // 无空闲槽位时最多等待多久
	MemSoft        int64
	MemDrain       int64
	MaxInflight    int64
	MaxToolResult  int64
	HostArgs       []string
	Stderr         io.Writer
	WatchdogPeriod time.Duration
}

// DefaultOptions 读取环境变量并给出缺省值。
func DefaultOptions(c *config.Resolved) Options {
	idle := c.IdleTimeout
	if v := os.Getenv("JOB_IDLE_SECS"); v != "" {
		idle = config.EnvSeconds("JOB_IDLE_SECS", idle)
	}
	model := os.Getenv("CLI_MODEL")
	if model == "" {
		model = "claude-sonnet-5-5"
	}
	return Options{
		JobIdle:       idle,
		CancelAck:     config.EnvSeconds("CANCEL_ACK_SECS", 30*time.Second),
		ClientStall:   config.EnvSeconds("CLIENT_STALL_SECS", 30*time.Second),
		PingInterval:  10 * time.Second,
		HostReady:     config.EnvSeconds("KIN_HOST_READY_SECS", 90*time.Second),
		RestartBudget: int(config.EnvInt("KIN_CLI_RESTART_BUDGET", 5)),
		RestartWindow: config.EnvSeconds("KIN_CLI_RESTART_WINDOW_SECS", 10*time.Minute),
		StickyTTL:     config.EnvSeconds("KIN_STICKY_TTL_SECS", 86400*time.Second),
		MaxPending:    int(config.EnvInt("MAX_PENDING", 100)),
		SubmitWait:    submitWait(submitWaitEnv()),
		MemSoft:       config.EnvInt("MEM_SOFT_BYTES", 3<<30),
		MemDrain:      config.EnvInt("MEM_DRAIN_BYTES", 3<<30),
		MaxInflight:   config.EnvInt("MAX_INFLIGHT_PAYLOAD", 256<<20),
		MaxToolResult: config.EnvInt("MAX_TOOL_RESULT_BYTES", 4<<20),
		HostArgs: []string{"-p", "--output-format", "stream-json", "--verbose", "--include-partial-messages",
			"--no-session-persistence", "--permission-mode", "acceptEdits", "--strict-mcp-config", "--model", model},
		Stderr:         os.Stderr,
		WatchdogPeriod: time.Second,
	}
}

// submitWaitEnv 优先取控制面下发的 KIN_SUBMIT_WAIT_MS（rust-kernel-supervisor 的
// docker exec 路径、KVM guest 服务），其次是现网 kernel 自己读的 SUBMIT_WAIT_MS。
// 现网 amd64 kernel 不认 KIN_ 前缀，原生槽按控制面的意图生效。
func submitWaitEnv() string {
	if v, ok := os.LookupEnv("KIN_SUBMIT_WAIT_MS"); ok {
		return v
	}
	return os.Getenv("SUBMIT_WAIT_MS")
}

// submitWait 对应现网 from_env 对 SUBMIT_WAIT_MS 的解析：按 u64 解析（允许一个
// 前导 +），未设置、非法或溢出时取 2000ms，0 表示不等待。
func submitWait(v string) time.Duration {
	const def = 2000 * time.Millisecond
	if v == "" {
		return def
	}
	digits := strings.TrimPrefix(v, "+")
	if digits == "" || strings.HasPrefix(digits, "+") {
		return def
	}
	n, err := strconv.ParseUint(digits, 10, 64)
	if err != nil {
		return def
	}
	if n > uint64(math.MaxInt64/int64(time.Millisecond)) {
		return time.Duration(math.MaxInt64)
	}
	return time.Duration(n) * time.Millisecond
}

type msgKind int

const (
	msgEvent msgKind = iota
	msgDone
	msgError
)

type jobMsg struct {
	kind  msgKind
	raw   json.RawMessage
	done  *frame.JobDone
	err   *APIError
	bytes int64
}

type job struct {
	id        string
	requestID string
	slot      string
	gen       int
	msgs      chan jobMsg
	closeOnce sync.Once

	lastTouch    time.Time
	cancelling   bool
	cancelSource string
	cancelAt     time.Time
	lastPing     time.Time
	pingNonce    string
	pongSeen     bool
	terminal     bool // 已向 HTTP 侧交付终态
	recycling    bool // 已收到终态帧，等待 cancel_ack 归还槽位
	charged      int64
}

func (j *job) close() { j.closeOnce.Do(func() { close(j.msgs) }) }

type slotState struct {
	id       string
	ready    bool
	job      *job
	idleFrom time.Time
}

type generation struct {
	n      int
	cmd    *exec.Cmd
	writes chan []byte
	done   chan struct{}
	once   sync.Once
}

func (g *generation) kill() {
	g.once.Do(func() {
		close(g.done)
		if g.cmd.Process != nil {
			_ = g.cmd.Process.Kill()
		}
	})
}

// send 非阻塞投递一帧；写队列满视为宿主失联。
func (g *generation) send(v any) bool {
	b, err := json.Marshal(v)
	if err != nil {
		return false
	}
	select {
	case <-g.done:
		return false
	default:
	}
	select {
	case g.writes <- append(b, '\n'):
		return true
	default:
		return false
	}
}

// Runtime 是 gateway-worker 的核心状态。
type Runtime struct {
	cfg  *config.Resolved
	opts Options
	ctx  context.Context

	mu         sync.Mutex
	gen        *generation
	genN       int
	slots      []*slotState
	byID       map[string]*slotState
	sched      *slotScheduler
	jobs       map[string]*job
	requests   map[string]*job
	recovering bool
	healthy    bool
	reason     string
	restarts   int
	restartLog []time.Time
	accounted  int64
	lastError  string
	readyOnce  chan struct{}
	freed      chan struct{} // 有槽位回到就绪队列时关闭并换新
	waiters    int
	readyErr   error
	started    bool
}

// New 构造运行时（尚未启动宿主）。
func New(ctx context.Context, cfg *config.Resolved, opts Options) *Runtime {
	r := &Runtime{cfg: cfg, opts: opts, ctx: ctx, byID: map[string]*slotState{}, jobs: map[string]*job{},
		requests: map[string]*job{}, healthy: true, readyOnce: make(chan struct{}), freed: make(chan struct{})}
	for i := 0; i < cfg.Slots; i++ {
		s := &slotState{id: frame.SlotID(i)}
		r.slots = append(r.slots, s)
		r.byID[s.id] = s
	}
	r.sched = newSlotScheduler(opts.StickyTTL, func(id string) bool {
		s := r.byID[id]
		return s != nil && s.ready && s.job == nil
	})
	return r
}

func newHex() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

func (r *Runtime) logf(format string, args ...any) { log.Printf(format, args...) }

// Start 拉起首个宿主并等待握手；握手失败返回错误（调用方不应监听 socket）。
func (r *Runtime) Start() error {
	if r.cfg.ClaudeBin == "" {
		return errors.New("claude_bin is required for provider=local_cli")
	}
	if err := r.spawn(); err != nil {
		return err
	}
	go r.watchdog()
	select {
	case <-r.readyOnce:
		return r.readyErr
	case <-r.ctx.Done():
		return r.ctx.Err()
	}
}

func (r *Runtime) hostEnv() []string {
	env := os.Environ()
	set := map[string]string{
		"CLAUDE_CODE_DISABLE_TELEMETRY":    "1",
		"CLAUDE_CODE_ENTRYPOINT":           "sdk-cli",
		"CLAUDE_CODE_ENVELOPE":             "zero",
		"CLAUDE_CODE_GATEWAY_HINT_HEADERS": "1",
		"CLAUDE_CODE_HOST_REFRESH":         "1",
		"CLAUDE_CODE_NATIVE_SLOTS":         strconv.Itoa(r.cfg.Slots),
		"CLAUDE_CODE_SYSTEM_LAYOUT":        "zero",
		"CLAUDE_CODE_TIMEZONE":             r.cfg.TZ,
		"CLAUDE_CODE_VERSION":              r.cfg.CLIVersion,
		"JOB_IDLE_SECS":                    strconv.Itoa(int(r.opts.JobIdle / time.Second)),
		"KERNEL_CONFIG":                    r.cfg.Path,
		"SLOT_TZ":                          r.cfg.TZ,
		"SYSTEM_MODE":                      "zero",
	}
	// 与现网一致：以下变量只在容器环境未给出时补默认值。CLAUDE_CONFIG_DIR 决定
	// .claude.json（device id）的位置，现网继承容器的 /home/kincli/.claude，
	// 不能改成 kernel.json 所在的 /run/kin。
	for k, v := range map[string]string{
		"CLAUDE_CONFIG_DIR": filepath.Dir(r.cfg.CredentialPath),
		"ENVELOPE_PATH":     "/tmp/cli/envelope.json",
		"USER_TYPE":         "external",
	} {
		if os.Getenv(k) == "" && v != "" && v != "." {
			set[k] = v
		}
	}
	if h := os.Getenv("DESIRED_CONFIG_HASH"); h != "" {
		set["CLAUDE_CODE_CONFIG_HASH"] = h
	}
	if r.cfg.HTTPSProxy != "" {
		set["HTTPS_PROXY"] = r.cfg.HTTPSProxy
	} else if b := os.Getenv("BRIDGE_HTTPS_PROXY"); b != "" && r.cfg.ProxyURL != "" {
		set["HTTPS_PROXY"] = b
	}
	if _, ok := set["HTTPS_PROXY"]; ok && os.Getenv("NO_PROXY") == "" {
		set["NO_PROXY"] = "127.0.0.1,localhost"
	}
	out := make([]string, 0, len(env)+len(set))
	for _, kv := range env {
		k, _, _ := cut(kv, '=')
		if _, ok := set[k]; !ok {
			out = append(out, kv)
		}
	}
	for k, v := range set {
		out = append(out, k+"="+v)
	}
	return out
}

func cut(s string, sep byte) (string, string, bool) {
	for i := 0; i < len(s); i++ {
		if s[i] == sep {
			return s[:i], s[i+1:], true
		}
	}
	return s, "", false
}

// spawn 拉起新一代宿主并启动读写协程。调用方不持锁。
func (r *Runtime) spawn() error {
	cmd := exec.Command(r.cfg.ClaudeBin, r.opts.HostArgs...)
	cmd.Env = r.hostEnv()
	cmd.Stderr = r.opts.Stderr
	cmd.Dir = filepath.Dir(r.cfg.ClaudeBin)
	if home := os.Getenv("HOME"); home != "" {
		cmd.Dir = home
	}
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("spawn native cli host: %w", err)
	}
	r.mu.Lock()
	r.genN++
	g := &generation{n: r.genN, cmd: cmd, writes: make(chan []byte, 1024), done: make(chan struct{})}
	r.gen = g
	r.recovering = true
	r.mu.Unlock()
	go func() {
		for {
			select {
			case <-g.done:
				_ = stdin.Close()
				return
			case b := <-g.writes:
				if _, err := stdin.Write(b); err != nil {
					g.kill()
				}
			}
		}
	}()
	go r.readLoop(g, stdout)
	go func() {
		t := time.NewTimer(r.opts.HostReady)
		defer t.Stop()
		select {
		case <-t.C:
			r.mu.Lock()
			pending := r.gen == g && r.recovering
			r.mu.Unlock()
			if pending {
				r.handshakeFailed(g, errors.New("host_ready timeout"))
			}
		case <-g.done:
		}
	}()
	return nil
}

func (r *Runtime) handshakeFailed(g *generation, err error) {
	r.logf("native host ready validation failed, refusing to register slots: %v", err)
	r.mu.Lock()
	first := !r.started
	if first {
		r.readyErr = fmt.Errorf("native host ready validation failed, refusing to register slots: %w", err)
		r.started = true
		close(r.readyOnce)
	}
	r.mu.Unlock()
	g.kill()
}

func (r *Runtime) validateReady(h *frame.HostReady) error {
	if h.ProtocolVersion != frame.ProtocolVersion {
		return fmt.Errorf("protocol_version %d != %d", h.ProtocolVersion, frame.ProtocolVersion)
	}
	if h.SystemLayout != "zero" {
		return fmt.Errorf("system_layout %s != expected zero", h.SystemLayout)
	}
	if missing, ok := frame.HasAll(h.Capabilities, frame.RequiredCapabilities); !ok {
		return fmt.Errorf("missing required capability %s", missing)
	}
	if h.Timezone != r.cfg.TZ {
		return fmt.Errorf("timezone %s != expected %s", h.Timezone, r.cfg.TZ)
	}
	return nil
}

func (r *Runtime) readLoop(g *generation, stdout io.Reader) {
	lines := frame.NewLineReader(stdout, int(r.cfg.MaxEvent)+(1<<20))
	handshaken := false
	for {
		line, err := lines.Next()
		if err == frame.ErrLineTooLong {
			r.logf("native cli frame exceeds max_event_bytes; dropped")
			continue
		}
		if err != nil {
			break
		}
		in := frame.ParseInbound(line)
		if !handshaken {
			if in == nil || in.Type != "host_ready" || in.Ready == nil {
				if in != nil {
					r.handshakeFailed(g, fmt.Errorf("first frame is %s, not host_ready", in.Type))
					break
				}
				continue
			}
			if err := r.validateReady(in.Ready); err != nil {
				r.handshakeFailed(g, err)
				break
			}
			handshaken = true
			r.logf("native host ready protocol_version=%d slots=%d system_layout=%s", in.Ready.ProtocolVersion, in.Ready.Slots, in.Ready.SystemLayout)
			r.registerReady(g)
			continue
		}
		if in == nil {
			r.logf("unrecognised cli frame")
			continue
		}
		r.handleFrame(g, in)
	}
	g.kill()
	_ = g.cmd.Wait()
	r.hostLost(g)
}

func (r *Runtime) registerReady(g *generation) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.gen != g {
		return
	}
	r.recovering = false
	r.healthy = true
	r.reason = ""
	if !r.started {
		r.started = true
		close(r.readyOnce)
	}
}

func (r *Runtime) handleFrame(g *generation, in *frame.Inbound) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.gen != g {
		return
	}
	now := time.Now()
	switch in.Type {
	case "slot_ready":
		if s := r.byID[in.SlotID]; s != nil && s.job == nil {
			s.ready = true
			s.idleFrom = now
			r.sched.enqueueReady(s.id)
			r.wakeWaiters()
		}
		return
	case "pong":
		for _, j := range r.jobs {
			if j.pingNonce == in.Nonce {
				j.pongSeen = true
			}
		}
		return
	}
	j := r.jobs[in.JobID]
	if j == nil || j.gen != g.n {
		return // 迟到事件：job 已移出表
	}
	j.lastTouch = now
	switch in.Type {
	case "stream_event":
		if j.terminal {
			return
		}
		r.deliver(j, jobMsg{kind: msgEvent, raw: in.Event, bytes: int64(len(in.Event))})
	case "job_done":
		if j.terminal {
			return
		}
		r.deliver(j, jobMsg{kind: msgDone, done: in.Done})
		r.finishSent(j)
	case "job_error":
		if j.terminal {
			return
		}
		r.deliver(j, jobMsg{kind: msgError, err: mapJobError(in.Err)})
		r.finishSent(j)
	case "cancel_ack":
		if !j.terminal {
			src := j.cancelSource
			if src == "" {
				src = "explicit cancel from control plane"
			}
			r.deliver(j, jobMsg{kind: msgError, err: &APIError{Status: 499, Type: "api_error", Code: "client_cancelled", Message: src}})
		}
		r.release(j)
	}
}

func mapJobError(e *frame.JobError) *APIError {
	status := e.Status
	if status < 400 || status > 599 {
		status = 502
	}
	code := e.Code
	if !passCodes[code] {
		code = "cli_error"
	}
	typ := e.ErrorType
	if typ == "" {
		typ = "api_error"
	}
	retryable := code == "upstream_overloaded" || code == "upstream_rate_limit" || code == "upstream_network_error" ||
		code == "upstream_stream_interrupted" || code == "upstream_empty_stream" || code == "upstream_timeout"
	return &APIError{Status: status, Type: typ, Code: code, Message: e.Error, RetryAfter: e.RetryAfter,
		UpstreamCode: clip(e.UpstreamCode, 100), RequestID: clip(e.RequestID, 200), Retryable: retryable}
}

// deliver 投递到 HTTP 侧；缓冲满即按流溢出处理。持锁调用。
func (r *Runtime) deliver(j *job, m jobMsg) {
	if j.terminal {
		return
	}
	if m.kind != msgEvent {
		j.terminal = true
	}
	select {
	case j.msgs <- m:
		if m.bytes > 0 {
			j.charged += m.bytes
			r.accounted += m.bytes
		}
		if j.terminal {
			j.close()
		}
	default:
		j.terminal = true
		// 留出终态位置：丢弃一条旧消息后写入溢出错误。
		select {
		case <-j.msgs:
		default:
		}
		select {
		case j.msgs <- jobMsg{kind: msgError, err: workerError(502, "kernel_error", "job stream overflow")}:
		default:
		}
		j.close()
		r.sendCancel(j, "job stream overflow")
	}
}

// finishSent：终态帧已到，发送 cancel 回收并等待 cancel_ack 归还槽位。持锁调用。
func (r *Runtime) finishSent(j *job) {
	j.recycling = true
	j.cancelAt = time.Now()
	if r.gen != nil {
		r.gen.send(frame.Cancel{Type: "cancel", JobID: j.id, SlotID: j.slot})
	}
}

func (r *Runtime) sendCancel(j *job, source string) {
	if j.cancelling || j.recycling {
		return
	}
	j.cancelling = true
	j.cancelSource = source
	j.cancelAt = time.Now()
	if r.gen != nil {
		r.gen.send(frame.Cancel{Type: "cancel", JobID: j.id, SlotID: j.slot})
	}
}

// release 把槽位还回就绪队列并移出 job 表。持锁调用。
func (r *Runtime) release(j *job) {
	delete(r.jobs, j.id)
	if r.requests[j.requestID] == j {
		delete(r.requests, j.requestID)
	}
	r.accounted -= j.charged
	j.charged = 0
	if !j.terminal {
		j.terminal = true
		j.close()
	}
	if s := r.byID[j.slot]; s != nil && s.job == j {
		s.job = nil
		if r.gen != nil && r.gen.n == j.gen && s.ready {
			s.idleFrom = time.Now()
			r.sched.enqueueReady(s.id)
			r.wakeWaiters()
		}
	}
}

// wakeWaiters 唤醒所有在 Submit 中等槽位的请求。持锁调用。
func (r *Runtime) wakeWaiters() {
	if r.waiters > 0 {
		close(r.freed)
		r.freed = make(chan struct{})
	}
}

// requestRestart 结束当前宿主；读协程会走 hostLost 并按预算重启。
func (r *Runtime) requestRestart(reason string) {
	r.logf("native cli host failed; restarting it (%s)", reason)
	if r.gen != nil {
		go r.gen.kill()
	}
}

func (r *Runtime) hostLost(g *generation) {
	r.mu.Lock()
	if r.gen != g {
		r.mu.Unlock()
		return
	}
	r.logf("native cli stdout closed")
	r.recovering = true
	for _, s := range r.slots {
		s.ready = false
	}
	r.sched.reset()
	for _, j := range r.jobs {
		if j.gen == g.n {
			r.deliver(j, jobMsg{kind: msgError, err: &APIError{Status: 503, Type: "api_error", Code: "kernel_unavailable",
				Message: "native cli host unavailable", Retryable: true}})
			r.release(j)
		}
	}
	if !r.started {
		r.started = true
		r.readyErr = errors.New("native cli host exited before host_ready")
		close(r.readyOnce)
		r.mu.Unlock()
		return
	}
	now := time.Now()
	var recent []time.Time
	for _, t := range r.restartLog {
		if now.Sub(t) < r.opts.RestartWindow {
			recent = append(recent, t)
		}
	}
	r.restartLog = recent
	if r.ctx.Err() != nil {
		r.mu.Unlock()
		return
	}
	if len(recent) >= r.opts.RestartBudget {
		r.healthy = false
		r.recovering = false
		r.reason = "native cli restart budget spent; reporting unhealthy"
		r.logf("%s", r.reason)
		r.mu.Unlock()
		return
	}
	r.restartLog = append(r.restartLog, now)
	r.restarts++
	r.mu.Unlock()
	if err := r.spawn(); err != nil {
		r.mu.Lock()
		r.healthy = false
		r.recovering = false
		r.reason = "native cli host unavailable"
		r.lastError = err.Error()
		r.mu.Unlock()
		r.logf("native cli host unavailable: %v", err)
	}
}

func (r *Runtime) watchdog() {
	t := time.NewTicker(r.opts.WatchdogPeriod)
	defer t.Stop()
	for {
		select {
		case <-r.ctx.Done():
			r.mu.Lock()
			if r.gen != nil {
				r.gen.kill()
			}
			r.mu.Unlock()
			return
		case now := <-t.C:
			r.sweep(now)
		}
	}
}

func (r *Runtime) sweep(now time.Time) {
	r.mu.Lock()
	defer r.mu.Unlock()
	restart := ""
	for _, j := range r.jobs {
		switch {
		case j.recycling || j.cancelling:
			if j.cancelling && !j.pongSeen && j.pingNonce != "" && now.Sub(j.lastPing) >= r.opts.PingInterval {
				j.lastPing = now
				r.gen.send(frame.Ping{Type: "ping", Nonce: j.pingNonce})
			}
			if now.Sub(j.cancelAt) >= r.opts.CancelAck {
				r.gen.send(frame.Cancel{Type: "cancel", JobID: j.id, SlotID: j.slot})
				restart = "cancel_ack timeout"
			}
		case now.Sub(j.lastTouch) >= r.opts.JobIdle:
			j.pingNonce = "ping_" + newHex()
			j.lastPing = now
			r.gen.send(frame.Ping{Type: "ping", Nonce: j.pingNonce})
			r.deliver(j, jobMsg{kind: msgError, err: &APIError{Status: 504, Type: "timeout_error",
				Code: "upstream_timeout", Message: "stream idle timeout", Retryable: true}})
			r.sendCancel(j, "job idle timeout")
		}
	}
	for _, s := range r.slots {
		if s.ready && s.job == nil && !s.idleFrom.IsZero() && now.Sub(s.idleFrom) >= r.cfg.SessionIdleTTL {
			r.sched.forgetSlot(s.id) // retire_idle：空闲槽位释放会话粘滞
			s.idleFrom = now
		}
	}
	if restart != "" && r.gen != nil {
		r.requestRestart(restart)
	}
}

// ErrNoCapacity 表示无可用槽位。
var ErrNoCapacity = &APIError{Status: 503, Type: "overloaded_error", Code: "no_capacity",
	Message: "no compatible capacity is currently available", Retryable: true}

// Submit 选槽并下发 job_start。没有空闲槽位时最多等 SubmitWait（现网实测：期间
// 有槽位空出就接着执行，超时 503 no_capacity）；ctx 结束（客户端断开）即放弃。
func (r *Runtime) Submit(ctx context.Context, requestID, preferredSlot, sessionKey string, request, requestContext json.RawMessage) (*job, *APIError) {
	r.mu.Lock()
	defer r.mu.Unlock()
	var deadline <-chan time.Time
	var id string
	for {
		if r.gen == nil || r.recovering || !r.healthy {
			return nil, ErrNoCapacity
		}
		if len(r.jobs)+r.waiters >= r.opts.MaxPending {
			return nil, ErrNoCapacity
		}
		if !r.admit(int64(len(request))) {
			return nil, &APIError{Status: 503, Type: "overloaded_error", Code: "no_capacity",
				Message: "memory pressure: no compatible capacity is currently available", Retryable: true}
		}
		if id = r.sched.pick(preferredSlot, sessionKey, time.Now()); id != "" {
			break
		}
		if deadline == nil {
			if r.opts.SubmitWait <= 0 {
				return nil, ErrNoCapacity
			}
			t := time.NewTimer(r.opts.SubmitWait)
			defer t.Stop()
			deadline = t.C
		}
		freed := r.freed
		r.waiters++
		r.mu.Unlock()
		var expired bool
		select {
		case <-freed:
		case <-deadline:
			expired = true
		case <-ctx.Done():
			expired = true
		case <-r.ctx.Done():
			expired = true
		}
		r.mu.Lock()
		r.waiters--
		if expired {
			return nil, ErrNoCapacity
		}
	}
	j := &job{id: "job_" + newHex(), requestID: requestID, slot: id, gen: r.gen.n,
		msgs: make(chan jobMsg, 1<<16), lastTouch: time.Now()}
	r.byID[id].job = j
	r.jobs[j.id] = j
	if requestID != "" {
		r.requests[requestID] = j
	}
	ok := r.gen.send(frame.JobStart{Type: "job_start", JobID: j.id, SlotID: id, Request: request, RequestContext: requestContext})
	if !ok {
		r.release(j)
		r.requestRestart("stdin unavailable")
		return nil, &APIError{Status: 503, Type: "api_error", Code: "kernel_unavailable", Message: "native cli host unavailable", Retryable: true}
	}
	return j, nil
}

// admit 实现 MemoryGuard::admit：RSS 超阈值或记账超上限即拒绝。持锁调用。
func (r *Runtime) admit(n int64) bool {
	if n > r.opts.MaxInflight {
		return false
	}
	if rss := rssBytes(); rss > 0 && rss >= r.opts.MemDrain {
		return false
	}
	sum := r.accounted + n
	if sum < r.accounted {
		return false
	}
	return sum <= r.opts.MemSoft
}

// Consumed 在 HTTP 侧消费一条消息后释放记账。
func (r *Runtime) consumed(j *job, n int64) {
	if n <= 0 {
		return
	}
	r.mu.Lock()
	if j.charged >= n {
		j.charged -= n
		r.accounted -= n
	}
	r.mu.Unlock()
}

// Cancel 由控制面或客户端断开触发。返回是否匹配到 job。
func (r *Runtime) Cancel(requestID, source string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	j := r.requests[requestID]
	if j == nil {
		j = r.jobs[requestID]
	}
	if j == nil {
		if r.gen != nil {
			r.gen.send(frame.Cancel{Type: "cancel", JobID: requestID, SlotID: ""})
		}
		return false
	}
	if !j.terminal {
		r.deliver(j, jobMsg{kind: msgError, err: &APIError{Status: 499, Type: "api_error", Code: "client_cancelled", Message: source}})
	}
	r.sendCancel(j, source)
	return true
}

// abandon 是 HTTP 侧结束后对未归还 job 的收尾：仍在运行则取消。
func (r *Runtime) abandon(j *job, source string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.jobs[j.id]; !ok {
		return
	}
	if !j.recycling {
		r.sendCancel(j, source)
	}
}

// Health 返回 /internal/health 视图。
func (r *Runtime) Health() map[string]any {
	r.mu.Lock()
	defer r.mu.Unlock()
	ready, closed := 0, 0
	for _, s := range r.slots {
		switch {
		case s.ready && s.job == nil:
			ready++
		case s.job == nil:
			closed++
		}
	}
	pid := 0
	if r.gen != nil && r.gen.cmd.Process != nil && !r.recovering {
		pid = r.gen.cmd.Process.Pid
	}
	var reason any
	if !r.healthy {
		reason = r.reason
	}
	return map[string]any{
		"ok": true, "engine": "rust", "implementation": "native-go", "worker_version": Version,
		"vm_id": r.cfg.VMID, "provider": r.cfg.Provider, "slots_per_worker": r.cfg.Slots,
		"ready_slots": ready, "closed_slots": closed, "cli_restarts": r.restarts, "cli_pid": pid,
		"generation": r.genN, "recovering": r.recovering, "healthy": r.healthy, "unhealthy_reason": reason,
		"classifier_request_context": true, "last_error": nullable(r.lastError),
	}
}

func nullable(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// Slots 返回 /internal/v1/slots 视图。
func (r *Runtime) Slots() []map[string]any {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]map[string]any, 0, len(r.slots))
	active := 0
	for _, s := range r.slots {
		if s.job != nil {
			active++
		}
	}
	for i, s := range r.slots {
		score := int64(active) * 1_000_000 / int64(len(r.slots)) * 35
		out = append(out, map[string]any{"index": i, "id": s.id, "generation": r.genN, "active": s.job != nil,
			"waiting_tool": false, "healthy": s.ready && r.healthy, "score": score})
	}
	return out
}

// Version 是本实现的版本标识。
var Version = "native-arm64-2026.10.20"
