// cli-node 是 CLI 宿主的原生实现（07 7.8 的最小范围）：
// 槽位帧循环 + auth login / setup-token + 精简 print 模式（hello、/usage）。
package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"vm2api/native-slot/internal/clihost"
	"vm2api/native-slot/internal/login"
	"vm2api/native-slot/internal/printmode"
	"vm2api/native-slot/internal/upstream"
)

func main() {
	os.Exit(run(os.Args[1:]))
}

func run(args []string) int {
	if len(args) == 1 && (args[0] == "--version" || args[0] == "-v" || args[0] == "-V") {
		fmt.Printf("%s (Claude Code)\n", upstream.CLIVersion())
		return 0
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if n := clihost.SlotCount(); n > 0 {
		// 槽位模式：不读终端、不处理斜杠命令；stdin 关闭即退出。
		if err := clihost.Run(ctx, os.Stdin, os.Stdout, n); err != nil {
			fmt.Fprintln(os.Stderr, "[kin] native loop failed:", err)
			return 1
		}
		return 0
	}
	term := &login.Terminal{In: bufio.NewReader(os.Stdin), Out: os.Stdout, Err: os.Stderr, Prompt: 30 * time.Minute}
	if len(args) >= 2 && args[0] == "auth" {
		switch args[1] {
		case "login":
			return login.AuthLogin(ctx, args[2:], term)
		case "status":
			return login.Status(args[2:], os.Stdout)
		case "logout":
			return login.Logout(os.Stdout, os.Stderr)
		}
		fmt.Fprintf(os.Stderr, "error: unknown command 'auth %s'\n", args[1])
		return 1
	}
	if len(args) >= 1 && args[0] == "setup-token" {
		return login.SetupToken(ctx, term)
	}
	opts := printmode.Options{OutputFormat: "text"}
	print := false
	var positional []string
	for i := 0; i < len(args); i++ {
		a := args[i]
		next := func() string {
			if i+1 < len(args) {
				i++
				return args[i]
			}
			return ""
		}
		switch {
		case a == "-p" || a == "--print":
			print = true
			if a == "-p" && i+1 < len(args) && !strings.HasPrefix(args[i+1], "-") {
				opts.Prompt = next()
			}
		case a == "--output-format":
			opts.OutputFormat = next()
		case strings.HasPrefix(a, "--output-format="):
			opts.OutputFormat = strings.TrimPrefix(a, "--output-format=")
		case a == "--model":
			opts.Model = next()
		case a == "--verbose":
			opts.Verbose = true
		case a == "--permission-mode" || a == "--settings" || a == "--debug-file" || a == "--max-turns":
			next()
		case a == "--bare":
			os.Setenv("CLAUDE_CODE_SIMPLE", "1")
		case a == "--safe-mode":
			os.Setenv("CLAUDE_CODE_SAFE_MODE", "1")
			os.Setenv("CLAUDE_CODE_DISABLE_CLAUDE_MDS", "1")
		case a == "--restricted":
			os.Setenv("CLAUDE_CODE_RESTRICTED", "1")
		case strings.HasPrefix(a, "-"):
		default:
			positional = append(positional, a)
		}
	}
	if opts.Prompt == "" && len(positional) > 0 {
		opts.Prompt = strings.Join(positional, " ")
	}
	if opts.Prompt == "" && print {
		if st, err := os.Stdin.Stat(); err == nil && st.Mode()&os.ModeCharDevice == 0 {
			b, _ := bufio.NewReader(os.Stdin).ReadString(0)
			opts.Prompt = strings.TrimSpace(b)
		}
	}
	if print || strings.HasPrefix(opts.Prompt, "/") {
		if opts.Prompt == "" {
			fmt.Fprintln(os.Stderr, "Error: Input must be provided either through stdin or as a prompt argument when using --print")
			return 1
		}
		return printmode.Run(ctx, opts, os.Stdout)
	}
	fmt.Fprintln(os.Stderr, "This native cli-node build supports slot mode, auth login, setup-token and --print only.")
	return 1
}
