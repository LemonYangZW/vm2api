package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"vm2api/native-slot/slot"
)

func main() {
	config := flag.String("config", os.Getenv("KIN_NATIVE_HOST_CONFIG"), "内核配置路径")
	version := flag.Bool("version", false, "显示原生宿主版本")
	flag.Parse()
	if *version {
		fmt.Println(slot.Version + " (protocol=2, cli-baseline=2.1.296)")
		return
	}
	n, err := strconv.Atoi(os.Getenv("CLAUDE_CODE_NATIVE_SLOTS"))
	if err != nil || n < 1 || n > 20 {
		fatal(fmt.Errorf("CLAUDE_CODE_NATIVE_SLOTS must be 1..20; interactive CLI is unsupported"))
	}
	if *config == "" {
		*config = os.Getenv("KERNEL_CONFIG")
	}
	if *config == "" {
		*config = "/run/kin/kernel.json"
	}
	c, err := slot.LoadConfig(*config)
	if err != nil {
		fatal(err)
	}
	c.Slots = n
	c.Timezone = os.Getenv("CLAUDE_CODE_TIMEZONE")
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	// 关闭输入使阻塞的 NDJSON 读取能响应进程终止。
	go func() { <-ctx.Done(); _ = os.Stdin.Close() }()
	if err := slot.RunHost(ctx, os.Stdin, os.Stdout, c); err != nil && ctx.Err() == nil {
		fatal(err)
	}
}

func fatal(err error) { fmt.Fprintln(os.Stderr, "cli-host:", err); os.Exit(1) }
