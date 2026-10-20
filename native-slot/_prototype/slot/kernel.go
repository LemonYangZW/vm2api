package slot

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strconv"
	"sync"
	"time"
)

type KernelOptions struct {
	ConfigPath       string
	HostArgs         []string
	Stderr           io.Writer
	HandshakeTimeout time.Duration
	CancelTimeout    time.Duration
	RestartDelay     time.Duration
	RestartLimit     int
}

type generation struct {
	cmd      *exec.Cmd
	input    io.WriteCloser
	output   io.ReadCloser
	writes   chan Frame
	done     chan struct{}
	stopOnce sync.Once
}

func (g *generation) stop() {
	g.stopOnce.Do(func() { close(g.done); _ = g.input.Close(); _ = g.cmd.Process.Kill(); _ = g.output.Close() })
}

func (g *generation) send(f Frame) bool {
	select {
	case <-g.done:
		return false
	default:
	}
	select {
	case g.writes <- f:
		return true
	case <-g.done:
		return false
	default:
		g.stop()
		return false
	}
}

type kernelJob struct {
	id         string
	requestID  string
	slot       string
	gen        *generation
	frames     chan Frame
	last       time.Time
	cancelling bool
	cancelAt   time.Time
	lastPing   time.Time
}

type Kernel struct {
	c          Config
	opts       KernelOptions
	ctx        context.Context
	cancel     context.CancelFunc
	wg         sync.WaitGroup
	mu         sync.Mutex
	gen        *generation
	available  map[string]bool
	jobs       map[string]*kernelJob
	requests   map[string]*kernelJob
	restarts   int
	healthy    bool
	recovering bool
	reason     string
}

func NewKernel(ctx context.Context, c Config, opts KernelOptions) (*Kernel, error) {
	if err := c.Defaults(); err != nil {
		return nil, err
	}
	if c.InternalToken == "" {
		return nil, errors.New("internal_token must not be empty")
	}
	if c.ClaudeBin == "" {
		return nil, errors.New("claude_bin must name the native cli-host executable")
	}
	if opts.Stderr == nil {
		opts.Stderr = os.Stderr
	}
	if opts.HandshakeTimeout == 0 {
		opts.HandshakeTimeout = 10 * time.Second
	}
	if opts.CancelTimeout == 0 {
		opts.CancelTimeout = 30 * time.Second
	}
	if opts.RestartDelay == 0 {
		opts.RestartDelay = time.Second
	}
	if opts.RestartLimit == 0 {
		opts.RestartLimit = 3
	}
	ctx, cancel := context.WithCancel(ctx)
	k := &Kernel{c: c, opts: opts, ctx: ctx, cancel: cancel, available: map[string]bool{}, jobs: map[string]*kernelJob{}, requests: map[string]*kernelJob{}, healthy: true}
	g, s, err := k.startGeneration()
	if err != nil {
		cancel()
		return nil, err
	}
	k.gen = g
	for i := 0; i < c.Slots; i++ {
		k.available[slotID(i)] = true
	}
	k.wg.Add(2)
	go k.supervise(g, s)
	go k.watchdog()
	return k, nil
}

func (k *Kernel) Close() {
	k.cancel()
	k.mu.Lock()
	if k.gen != nil {
		k.gen.stop()
	}
	k.mu.Unlock()
	k.wg.Wait()
}

func (k *Kernel) startGeneration() (*generation, *bufio.Scanner, error) {
	args := k.opts.HostArgs
	if args == nil {
		args = []string{"--config", k.opts.ConfigPath}
	}
	cmd := exec.CommandContext(k.ctx, k.c.ClaudeBin, args...)
	cmd.Stderr = k.opts.Stderr
	cmd.Env = append(os.Environ(),
		"CLAUDE_CODE_NATIVE_SLOTS="+strconv.Itoa(k.c.Slots),
		"CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK=1", "CLAUDE_CODE_ENTRYPOINT=sdk-cli",
		"CLAUDE_CODE_HOST_REFRESH=1", "CLAUDE_CODE_TIMEZONE="+k.c.Timezone,
		"KIN_NATIVE_HOST_CONFIG="+k.opts.ConfigPath)
	if os.Getenv("USER_TYPE") == "" {
		cmd.Env = append(cmd.Env, "USER_TYPE=external")
	}
	if os.Getenv("CLAUDE_CODE_VERSION") == "" {
		cmd.Env = append(cmd.Env, "CLAUDE_CODE_VERSION="+k.c.CLIVersion)
	}
	in, err := cmd.StdinPipe()
	if err != nil {
		return nil, nil, err
	}
	out, err := cmd.StdoutPipe()
	if err != nil {
		_ = in.Close()
		return nil, nil, err
	}
	if err = cmd.Start(); err != nil {
		_ = in.Close()
		_ = out.Close()
		return nil, nil, err
	}
	g := &generation{cmd: cmd, input: in, output: out, writes: make(chan Frame, 64), done: make(chan struct{})}
	s := bufio.NewScanner(out)
	s.Buffer(make([]byte, 4096), k.c.MaxEventBytes+(1<<20))
	ready := make(chan error, 1)
	go func() { ready <- validateReady(s, k.c) }()
	timer := time.NewTimer(k.opts.HandshakeTimeout)
	defer timer.Stop()
	select {
	case err = <-ready:
	case <-timer.C:
		err = errors.New("host_ready timeout")
		g.stop()
		<-ready
	case <-k.ctx.Done():
		err = k.ctx.Err()
		g.stop()
		<-ready
	}
	if err != nil {
		g.stop()
		_ = cmd.Wait()
		return nil, nil, fmt.Errorf("native host ready validation failed, refusing to register slots: %w", err)
	}
	go func() {
		enc := json.NewEncoder(in)
		for {
			select {
			case <-g.done:
				return
			case f := <-g.writes:
				if enc.Encode(f) != nil {
					g.stop()
					return
				}
			}
		}
	}()
	return g, s, nil
}

func validateReady(s *bufio.Scanner, c Config) error {
	if !s.Scan() {
		return errors.New("missing host_ready")
	}
	var f Frame
	if json.Unmarshal(s.Bytes(), &f) != nil || f.Type != "host_ready" || f.ProtocolVersion != 2 || f.SystemLayout != "zero" || f.Timezone != c.Timezone || f.Slots != c.Slots {
		return errors.New("host_ready mismatch")
	}
	caps := map[string]bool{}
	for _, v := range f.Capabilities {
		caps[v] = true
	}
	for _, v := range []string{"multi_slot", "native_sse", "stateless"} {
		if !caps[v] {
			return fmt.Errorf("missing capability %s", v)
		}
	}
	seen := map[string]bool{}
	for len(seen) < c.Slots {
		if !s.Scan() {
			return errors.New("missing slot_ready")
		}
		if json.Unmarshal(s.Bytes(), &f) != nil || f.Type != "slot_ready" {
			return errors.New("invalid slot_ready")
		}
		valid := false
		for i := 0; i < c.Slots; i++ {
			if f.SlotID == slotID(i) {
				valid = true
			}
		}
		if !valid || seen[f.SlotID] {
			return errors.New("invalid or duplicate slot_ready")
		}
		seen[f.SlotID] = true
	}
	return nil
}

func (k *Kernel) supervise(g *generation, s *bufio.Scanner) {
	defer k.wg.Done()
	for {
		for s.Scan() {
			var f Frame
			if json.Unmarshal(s.Bytes(), &f) != nil {
				continue
			}
			k.dispatch(g, f)
		}
		g.stop()
		_ = g.cmd.Wait()
		k.mu.Lock()
		k.recovering = true
		k.available = map[string]bool{}
		for _, job := range k.jobs {
			if job.gen == g {
				k.finishLocked(job, failure(Frame{JobID: job.id, SlotID: job.slot}, 502, "cli_error", "api_error", "native host exited"), false)
			}
		}
		k.mu.Unlock()
		if k.ctx.Err() != nil {
			return
		}
		for {
			k.mu.Lock()
			if k.restarts >= k.opts.RestartLimit {
				k.healthy = false
				k.reason = "native host restart budget exhausted"
				k.recovering = false
				k.mu.Unlock()
				return
			}
			k.restarts++
			k.mu.Unlock()
			select {
			case <-k.ctx.Done():
				return
			case <-time.After(k.opts.RestartDelay):
			}
			var err error
			g, s, err = k.startGeneration()
			if err != nil {
				fmt.Fprintln(k.opts.Stderr, "native slot: host restart handshake failed")
				continue
			}
			k.mu.Lock()
			k.gen = g
			k.available = map[string]bool{}
			for i := 0; i < k.c.Slots; i++ {
				k.available[slotID(i)] = true
			}
			k.recovering = false
			k.mu.Unlock()
			break
		}
	}
}

func (k *Kernel) dispatch(g *generation, f Frame) {
	k.mu.Lock()
	defer k.mu.Unlock()
	job := k.jobs[f.JobID]
	if job == nil || job.gen != g || (f.SlotID != "" && f.SlotID != job.slot) {
		return
	}
	switch f.Type {
	case "stream_event":
		if f.Event == nil || job.cancelling {
			return
		}
		job.last = time.Now()
		select {
		case job.frames <- f:
		default:
			k.cancelLocked(job)
		}
	case "job_done":
		if f.StopReason == nil {
			return
		}
		k.finishLocked(job, f, true)
	case "job_error":
		if f.Error == nil {
			return
		}
		k.finishLocked(job, f, true)
	case "cancel_ack":
		if job.cancelling {
			k.finishLocked(job, failure(f, 504, "upstream_timeout", "timeout_error", "job cancelled"), true)
		}
	}
}

func (k *Kernel) finishLocked(job *kernelJob, f Frame, reuse bool) {
	delete(k.jobs, job.id)
	delete(k.requests, job.requestID)
	if reuse && job.gen == k.gen {
		k.available[job.slot] = true
	}
	// 给终止帧保留空间，即使客户端已停止读取也不能阻塞 stdout 解复用。
	select {
	case job.frames <- f:
	default:
		select {
		case <-job.frames:
		default:
		}
		job.frames <- f
	}
	close(job.frames)
}

func (k *Kernel) cancelLocked(job *kernelJob) {
	if job.cancelling {
		return
	}
	job.cancelling = true
	job.cancelAt = time.Now()
	job.lastPing = job.cancelAt
	job.gen.send(Frame{Type: "ping", Nonce: json.RawMessage(strconv.Quote(job.id))})
	job.gen.send(Frame{Type: "cancel", JobID: job.id, SlotID: job.slot})
}

func (k *Kernel) cancelRequest(requestID string) {
	k.mu.Lock()
	defer k.mu.Unlock()
	if job := k.requests[requestID]; job != nil {
		k.cancelLocked(job)
	}
}

func (k *Kernel) watchdog() {
	defer k.wg.Done()
	t := time.NewTicker(100 * time.Millisecond)
	defer t.Stop()
	for {
		select {
		case <-k.ctx.Done():
			return
		case now := <-t.C:
			k.mu.Lock()
			for _, job := range k.jobs {
				if !job.cancelling && now.Sub(job.last) > k.c.idleTimeout() {
					k.cancelLocked(job)
				}
				if job.cancelling {
					if now.Sub(job.cancelAt) > k.opts.CancelTimeout {
						job.gen.stop()
					}
					if now.Sub(job.lastPing) > 10*time.Second {
						job.lastPing = now
						job.gen.send(Frame{Type: "ping", Nonce: json.RawMessage(strconv.Quote(job.id))})
					}
				}
			}
			k.mu.Unlock()
		}
	}
}

var errNoCapacity = errors.New("no_capacity")
var errDuplicateRequest = errors.New("duplicate request_id")

func (k *Kernel) acquire(requestID string, body, requestContext map[string]any) (*kernelJob, error) {
	k.mu.Lock()
	defer k.mu.Unlock()
	if k.requests[requestID] != nil {
		return nil, errDuplicateRequest
	}
	if !k.healthy || k.recovering {
		return nil, errNoCapacity
	}
	var id string
	for i := 0; i < k.c.Slots; i++ {
		if k.available[slotID(i)] {
			id = slotID(i)
			break
		}
	}
	if id == "" {
		return nil, errNoCapacity
	}
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return nil, err
	}
	job := &kernelJob{id: "job_" + hex.EncodeToString(b[:]), requestID: requestID, slot: id, gen: k.gen, frames: make(chan Frame, 64), last: time.Now()}
	delete(k.available, id)
	k.jobs[job.id] = job
	k.requests[requestID] = job
	if !k.gen.send(Frame{Type: "job_start", JobID: job.id, SlotID: id, Request: body, RequestContext: requestContext}) {
		k.finishLocked(job, failure(Frame{JobID: job.id, SlotID: id}, 502, "cli_error", "api_error", "host input unavailable"), false)
	}
	return job, nil
}
