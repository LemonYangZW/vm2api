package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"vm2api/native-slot/slot"
)

func main() {
	config := flag.String("config", "/run/kin/kernel.json", "内核配置路径")
	_ = flag.Bool("gateway-worker", false, "兼容控制面启动参数")
	version := flag.Bool("version", false, "显示原生内核版本")
	flag.Parse()
	if *version {
		fmt.Println(slot.Version)
		return
	}
	c, err := slot.LoadConfig(*config)
	if err != nil {
		fatal(err)
	}
	if c.SocketPath == "" {
		fatal(errors.New("socket_path required"))
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	k, err := slot.NewKernel(ctx, c, slot.KernelOptions{ConfigPath: *config})
	if err != nil {
		fatal(err)
	}
	defer k.Close()
	if err = os.MkdirAll(filepath.Dir(c.SocketPath), 0700); err != nil {
		fatal(err)
	}
	if st, e := os.Lstat(c.SocketPath); e == nil {
		if st.Mode()&os.ModeSocket == 0 {
			fatal(errors.New("socket_path exists and is not a Unix socket"))
		}
		conn, e := net.DialTimeout("unix", c.SocketPath, time.Second)
		if e == nil {
			_ = conn.Close()
			fatal(errors.New("socket already in use"))
		}
		if !errors.Is(e, syscall.ECONNREFUSED) {
			fatal(errors.New("cannot verify stale socket"))
		}
		if err = os.Remove(c.SocketPath); err != nil {
			fatal(err)
		}
	}
	listener, err := net.Listen("unix", c.SocketPath)
	if err != nil {
		fatal(err)
	}
	defer listener.Close()
	if err = os.Chmod(c.SocketPath, 0600); err != nil {
		fatal(err)
	}
	server := &http.Server{Handler: k, ReadHeaderTimeout: 10 * time.Second, IdleTimeout: 120 * time.Second, MaxHeaderBytes: 1 << 20}
	go func() { <-ctx.Done(); _ = server.Close() }()
	fmt.Fprintln(os.Stderr, "native slot:", slot.Version, "ready on Unix socket")
	if err = server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
		fatal(err)
	}
}

func fatal(err error) { fmt.Fprintln(os.Stderr, "kin-kernel:", err); os.Exit(1) }
