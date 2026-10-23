// bun-cli-host：把现网 cli-node 解包出来的 JS bundle 当作 CLI 宿主进程运行。
//
// 用途：CLI 层离线差分的「上游/真实」一侧不必非要 amd64 ELF。cli-node 的
// bundle 里有 TS `using` 声明，Node 22 跑不了，bun 可以直接跑：

//	go build -ldflags="-X main.bundlePath=/abs/path/cli-node.js" -o bun-cli-host .
//	./bun-cli-host --version        # 2.1.296 (Claude Code)
//
// 之后把它当作 `cli_diff.py --upstream-cli` 的路径即可；它把 stdin/stdout/stderr
// 与退出码原样透传，宿主协议（NDJSON 帧）不受影响。
//
// bundle 抽取见 reverse/kin-kernel/work/cli-node-moddiff.py 的同目录脚本说明：
// UPX 解包 → 取 `/$bunfs/root/cli.js` 之后到最后一个 `main2();` 之间的明文。
package main

import (
	"os"
	"os/exec"
)

// bundlePath 由 -ldflags -X main.bundlePath=<abs path> 注入。
var bundlePath string

func main() {
	bun, err := exec.LookPath("bun")
	if err != nil {
		os.Stderr.WriteString("bun-cli-host: bun not found in PATH (https://bun.sh)\n")
		os.Exit(127)
	}
	if bundlePath == "" {
		os.Stderr.WriteString("bun-cli-host: bundlePath 未注入；用 -ldflags -X main.bundlePath=<cli-node.js> 构建\n")
		os.Exit(2)
	}
	args := append([]string{bundlePath}, os.Args[1:]...)
	cmd := exec.Command(bun, args...)
	cmd.Stdin, cmd.Stdout, cmd.Stderr = os.Stdin, os.Stdout, os.Stderr
	cmd.Env = os.Environ()
	if err := cmd.Run(); err != nil {
		if exit, ok := err.(*exec.ExitError); ok {
			os.Exit(exit.ExitCode())
		}
		os.Exit(1)
	}
}
