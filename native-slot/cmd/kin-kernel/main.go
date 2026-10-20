// kin-kernel 是槽位服务内核的原生实现：
//
//	kin-kernel [--config <path>]                    主 API 模式（TCP）
//	kin-kernel --gateway-worker [--config <path>]   内部 worker 模式（Unix socket）
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"vm2api/native-slot/internal/api"
	"vm2api/native-slot/internal/config"
	"vm2api/native-slot/internal/worker"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.SetOutput(os.Stderr)
	var cfgFlag string
	gateway := false
	args := os.Args[1:]
	for i := 0; i < len(args); i++ {
		switch a := args[i]; a {
		case "--gateway-worker":
			gateway = true
		case "--config", "--assertion":
			if i+1 >= len(args) {
				fatal(fmt.Errorf("missing value for %s", a))
			}
			if a == "--config" {
				cfgFlag = args[i+1]
			}
			i++
		case "--version", "-V":
			fmt.Println("kin-kernel " + worker.Version)
			return
		default:
			if v, ok := cutPrefix(a, "--config="); ok {
				cfgFlag = v
				continue
			}
			fmt.Fprintf(os.Stderr, "unknown argument: %s\n", a)
			os.Exit(2)
		}
	}
	cfg, err := config.Load(config.PathFromArgs(cfgFlag))
	if err != nil {
		fatal(err)
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if gateway {
		runWorker(ctx, cfg)
		return
	}
	runAPI(ctx, cfg)
}

func cutPrefix(s, p string) (string, bool) {
	if len(s) >= len(p) && s[:len(p)] == p {
		return s[len(p):], true
	}
	return "", false
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "kin-kernel:", err)
	os.Exit(1)
}

func serve(ctx context.Context, ln net.Listener, h http.Handler) {
	srv := &http.Server{Handler: h, ReadHeaderTimeout: 15 * time.Second, IdleTimeout: 120 * time.Second,
		MaxHeaderBytes: 1 << 20}
	go func() {
		<-ctx.Done()
		shut, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(shut)
	}()
	if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
		fatal(err)
	}
}

// listenUnix 清理陈旧 socket 后监听；已被占用时拒绝启动。
func listenUnix(path string) (net.Listener, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	if st, err := os.Lstat(path); err == nil {
		if st.Mode()&os.ModeSocket == 0 {
			return nil, fmt.Errorf("socket_path %s exists and is not a socket", path)
		}
		if c, err := net.DialTimeout("unix", path, time.Second); err == nil {
			_ = c.Close()
			return nil, fmt.Errorf("socket_path %s is already in use", path)
		}
		if err := os.Remove(path); err != nil {
			return nil, err
		}
	}
	ln, err := net.Listen("unix", path)
	if err != nil {
		return nil, err
	}
	_ = os.Chmod(path, 0o660)
	return ln, nil
}

func runWorker(ctx context.Context, cfg *config.Resolved) {
	rt := worker.New(ctx, cfg, worker.DefaultOptions(cfg))
	if err := rt.Start(); err != nil {
		fatal(err)
	}
	ln, err := listenUnix(cfg.SocketPath)
	if err != nil {
		fatal(err)
	}
	defer os.Remove(cfg.SocketPath)
	log.Printf("kernel gateway-worker listening vm_id=%s provider=%s socket=%s", cfg.VMID, cfg.Provider, cfg.SocketPath)
	serve(ctx, ln, rt)
}

func runAPI(ctx context.Context, cfg *config.Resolved) {
	srv, err := api.New(cfg)
	if err != nil {
		fatal(err)
	}
	addr := os.Getenv("KERNEL_LISTEN_ADDR")
	if addr == "" {
		addr = "0.0.0.0:8080"
	}
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		fatal(err)
	}
	log.Printf("kernel listening addr=%s provider=%s", addr, cfg.Provider)
	serve(ctx, ln, srv)
}
