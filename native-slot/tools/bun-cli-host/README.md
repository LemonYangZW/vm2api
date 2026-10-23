# bun-cli-host

把现网 `cli-node` 解包出来的 JS bundle 当作 CLI 宿主进程跑起来，用于 CLI 层
离线差分里的「真实实现」一侧。`cli-node` 的 bundle 带 TS `using` 声明，Node 22
无法直接执行；bun 可以。

```sh
# bundle 抽取：UPX 解包 → 取 /$bunfs/root/cli.js 之后到最后一个 main2(); 之间
upx -d -o cli-node.unpacked <cli-node>
python3 ../../../reverse/kin-kernel/work/cli-node-moddiff.py cli-node.unpacked cli-node.unpacked  # 仅示意定位

go build -ldflags="-X main.bundlePath=/abs/path/cli-node.js" -o bun-cli-host .
./bun-cli-host --version     # 2.1.296 (Claude Code)
```

之后把它当成 `tools/upstream-probe/cli_diff.py --upstream-cli` 的路径即可：
stdin/stdout/stderr 与退出码原样透传，宿主 NDJSON 帧协议不受影响。

注意：这是本机逆向工作流的一部分，bundle 属于闭源产物，不要入库。
