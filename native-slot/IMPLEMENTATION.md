# ARM64 原生实现说明

按 `docs/` 规格实现的纯 Go 版 `kin-kernel` 与 `cli-node`，无 cgo、无 glibc 依赖。

## 构建

```sh
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o dist/linux-arm64/ ./cmd/...
```

产物：`dist/linux-arm64/kin-kernel`、`dist/linux-arm64/cli-node`（静态 ELF aarch64）。

## 测试

```sh
go test ./...
```

- `internal/upstream/diff_test.go`：与 `testdata/jsref/`（取自现网 cli-node 的 JS 模块）
  逐字节差分 cch、beta、system 布局、缓存 marker、分类器校验；本机无 `node` 时跳过；
- `internal/worker/*_test.go`：真实 worker + 真实 cli-node 子进程 + 本地 mock 上游，
  以及参数化假宿主（握手矩阵、帧可选性、看门狗与重启）；
- `internal/api/api_test.go`：主 API、三种凭据形态、OpenAI 兼容层；
- `cmd/cli-node/main_test.go`：`--version`、`auth login`、`setup-token`、`-p hello`、`/usage`、槽位握手。

全部测试只连 `127.0.0.1` 上的 mock，不访问外网。

## 包结构

| 包 | 职责 |
| --- | --- |
| `cmd/kin-kernel` | 主 API 模式 / `--gateway-worker` 模式入口 |
| `cmd/cli-node` | 槽位模式、登录命令、print 模式入口 |
| `internal/worker` | 宿主生命周期、调度、看门狗、Unix socket 内部接口 |
| `internal/api` | `/v1/messages`、`/v1/chat/completions`、Provider、续接、信封 |
| `internal/clihost` | CLI 侧槽位帧循环 |
| `internal/upstream` | 上游请求组装（头、beta、system、缓存、cch）与 SSE 客户端 |
| `internal/login` / `internal/printmode` | 07 章的登录与非交互命令 |
| `internal/config` / `credential` / `frame` / `sse` / `ojson` / `messages` / `classifier` | 公共部分 |

## 控制面接入

- `deploy/Dockerfile.arm64-control` 在 Go builder 阶段编译本目录，产物放进镜像的
  `/opt/vm2api/image-wrap-cli/linux-arm64/{kin-kernel.bin,cli-node}`；
- `scripts/docker-entrypoint.sh` 每次启动刷新到 `share/wrap-cli/linux-arm64/`；
- `src/lib/vm/wrap-cli-runtime.mjs` 在 ARM64 宿主上为本机 Docker 槽物化这一对文件，
  并写不经 x86 glibc loader 的 `kin-kernel` 包装脚本；KVM 槽、集群节点槽保持 amd64；
- `KIN_NATIVE_SLOTS=0` 回退到 amd64 + QEMU；详见 `docs/ARM64.md`。

## 以现网实现为准、补充规格的点

规格未写全或与现网代码不一致时，以现网 cli-node / kin-kernel 的实际行为为准：

- cch 在发送前按 xxh64 摘要回填（`kernel.json` 的 `cch_enabled=false` 时保持 `00000`）；
- zero 布局下环境块与调用方剩余文本合并为一块并带 `cache_control`；
- beta 基础集合含 `prompt-caching-scope`、`mid-conversation-system`，模型集合取自现网常量；
- system 的非空文本块数组直接透传，不再要求包含计费头；数组中计费头只重置 cch；
- 缓存 marker 对 system/tools/messages 统一处理，去掉 thinking 标记并限制最多四个；
  只有请求中出现显式合法 TTL 时才补全缺失值，整次请求均省略 TTL 时保持省略；
- `auto_compact_window` 作为 CLI 内部参数消耗，不发给上游；默认配置路径为 `/run/kin/kernel.json`；
- 面板登录以 `KIN_PANEL_LOGIN` 无参数启动时进入授权流程，继续复用宿主凭据文件；
- 发往上游前 `upstream.Preflight` 最后把关：缓存标记规则同控制面 `validateCacheBreakpoints`，
  外加 messages 非空、role/content 形状、按合并后 turn 判 tool_use/tool_result 配对与 id 唯一；
  命中即本地返回 400 `upstream_invalid_request`，不出网；
- 内核向宿主下发的 `request` 键按字母序（与 serde_json 一致），`metadata.user_id` 字段序为
  `account_uuid, device_id, session_id`；
- 槽位满时等待（缺省 / 非法 / 溢出为 2000ms，`0` 不等），期间有槽位空出就接着执行，等满返回
  503 `no_capacity`；等待时长优先取控制面下发的 `KIN_SUBMIT_WAIT_MS`，其次 `SUBMIT_WAIT_MS`
  （现网 amd64 kernel 只认后者，kin-03 离线实测）；
- 响应形状按 kin-03 现网 kernel 离线逐字节对照（18 种情形，仅 header 排列顺序不同）：
  - realtime：拿到槽位即提交 200（只有 `Content-Type`、`Trailer`），此后错误一律以 SSE `error`
    事件结束；trailer 成功只有 `x-terminal-state: verified`，失败为 `incomplete` + `x-error-code`；
  - 转发的事件按键名排序重新序列化（数字字面量原样，不转义 HTML / U+2028）；
  - job_done 前缺 `message_stop` 时补发该事件并算成功；非流式缺 message 时合成
    `msg_<pid>`、`stop_reason` 缺省 `end_turn`；usage 只有上游给了才带 `cache_creation`；
  - 非流式 / verified 出错为 `{"ok":false,"error":{type,code,message,status[,retry_after][,upstream_code][,request_id]}}`，
    只带 `retry-after` / `request-id` 头；非流式成功只带 `x-terminal-state`；
- 未知 CLI 错误码归为 `cli_error`；
- `/internal/health` 额外带 `ok`、`engine`、`worker_version`、`cli_pid`、`classifier_request_context`、`credential`。

`_prototype/` 是此前的雏形代码，已不参与构建，仅留作参考。
