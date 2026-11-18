# CRAG v2 功能对齐实现规格（GAP_IMPL_SPEC）

> 目的：把 `native-slot/cragv2-rs` 与官方 CRAG v2 原生内核的**功能差异**收敛成可验收的实现条目。
> 范围只谈功能等价，**不谈** TLS/h2 字节级一致（那条需要官方内核的 golden 流量，见 §9）。

---

## 0. 基线与证据来源

| 类别 | 来源 | 用途 |
| :--- | :--- | :--- |
| 控制面契约（权威） | `dofastted/vm2api` **v1.4.117**（`87ddea0b`）`src/lib/transport/*`、`src/lib/vm/*` | 内核必须满足的接口/字段 |
| 官方内核配置（权威） | 出厂包内 `kernel.json.example`（1208 B，明文） | 27 个配置键的真实默认值 |
| JS 时代参考实现 | `share/crag-v2` @ `8423bb81`（归档 ref `archive/crag-plaintext-8423bb81`） | `linux-tui-helper.mjs`、`linux-tui-tap.js`、`tui-request-options.mjs`、`gateway/v2-runtime.mjs` |
| 实测 | 沙盒 192.168.1.x（详见本文件 §1） | 判定架构真伪 |

---

## 1. 实测结论（决定实现方向，勿再猜测）

| # | 结论 | 证据 |
| :--- | :--- | :--- |
| 1 | 官方 2.1.321 **不认** `--single-process-subagents` / `--continuous-tool-loop` | `error: unknown option`（真二进制 341,910,032 B，sha256 与包内 manifest 一致） |
| 2 | 官方二进制里 **无** `assertNative` / `native adapter` 串 | `grep -a` 各 0 命中 |
| 3 | 因此 spec §5.2 的「native adapter 12 API」是**旧形态**（`2.1.88-v2` / Rust core 内嵌期），现行产品不用 | 上述 1+2，且归档明文 `runtime/worker.mjs` 才用 `native.ask()` / `assertNative()` |
| 4 | 现行架构 = **TUI 驱动 + Bun preload tap** | `kernel.json.example` 的 `"transport": "tui"` + 归档 helper/tap |
| 5 | tap 可注入成功：`{"tap":"on","mode":"fetch_session"}` | 沙盒实测（`--print` 与 TUI 两模式均出现） |
| 6 | tap 只拷**主对话**流：条件为请求头 `x-claude-code-request-class: main` | `linux-tui-tap.js` 的 `maybeCapture()` |
| 7 | 出站改写生效：`max_tokens` / `output_config.effort` / `cache_control.ttl` | 沙盒实测 stub 收到 `max_tokens=777`、`effort=high`、`ttl=5m`×3 |
| 8 | kin-os 镜像**无** `bun`/`node`，只有 `script`；官方 CLI 是动态 glibc ELF | `command -v` + `ldd` |
| 9 | vendor **不覆盖** base_url，且 `DISABLE_TELEMETRY=1` / `DISABLE_ERROR_REPORTING=1` | `gateway/v2-runtime.mjs:74-79` |
| 10 | 就绪判定实际靠提示符字形 `❯`（`CRAG_READY` 在官方二进制与归档 bundle 中均为 0 命中） | `isReadyScreen()` + grep |
| 11 | **`ANTHROPIC_BASE_URL` 在 TUI 模式被采纳**（本地 stub 收到请求并回投，TUI 显示 `PONG-STUB`） | 本机实测（§4.7） |
| 12 | **真实 UA 是 `claude-cli/2.1.321 (external, cli)`**，不是 2.1.303 | 抓包（§4.7） |
| 13 | **`x-claude-code-request-class` 在普通 TUI 主对话里不发**（抓包为 `null`，加 `--session-id`/`--mcp-config` 也不发）；其枚举为 `main/subagent/workflow/compaction/auxiliary/side_reply`，另有配套 `x-claude-code-agent-type` | 抓包 + 二进制字符串上下文 |
| 14 | 因此**归档 tap 的 `main` 判据不可用**；放宽为「URL 命中 + `text/event-stream`」后成功抓到 9 行（open + 6 事件 + end:done） | 本机实测（§4.7） |

---

## 2. 架构对照

```
官方：控制面 NDJSON → crag-v2 native（TUI 驱动）
                        ├─ spawn 官方 CLI（PTY via `script -qefc`）
                        ├─ preload tap 改写三旋钮 + 拷 SSE → JSONL
                        ├─ tail CC transcript → 判 user turn 入档
                        └─ MCP 回调（--mcp-config 注入 crag server）

我们：控制面 NDJSON → cragv2-rs
                        ├─ direct：自控 h2/TLS + CCH 打戳（旧架构，441 向量已验证）
                        └─ slot：NDJSON 驱动 CLI（旧 cli-node 风格）
```

**保留 direct 作为可选模式**（它是唯一可离线差分验证的形态）；新增 `transport: "tui"` 与之并存。

---

## 3. G-A：`kernel.json` 27 键对齐

来源：出厂包 `kernel.json.example`。我们当前 `config.rs::KernelConfig` 只认 13 键。

| 键 | 官方默认 | 我们 | 动作 |
| :--- | :--- | :--- | :--- |
| `vm_id` | `"crag-native"` | 未读 | 读入（诊断/日志） |
| `socket_path` | `/run/kin/kernel.sock` | ✅ | — |
| `internal_token` | `""` | 仅读 `token_path` 文件 | 增加：config 内直接给 token（文件优先） |
| `claude_bin` | `""` | ❌ 读的是 `cli_bin` | **改读 `claude_bin`**（保留 `cli_bin` 兼容） |
| `work_dir` | `/home/kincli` | 未读 | 读入（TUI cwd） |
| `config_dir` | `/home/kincli/.claude` | 未读 | 读入（transcript 根） |
| `credential_path` | `/home/kincli/.claude/credentials.json` | ✅ | — |
| `asset_dir` | `/home/kincli/.claude/crag-native-assets` | 未读 | 读入 |
| `license_dir` | `/run/kin/crag-license` | 未读 | 读入（纵深校验，见 §7） |
| `transport` | `"tui"` | 未读 | **新增**：`tui` \| 我们的 `direct`/`slot` |
| `delivery_mode` | `"realtime"` | 未读 | 读入（`realtime` \| `verified`） |
| `slots_per_worker` | `20` | ✅ | — |
| `session_slots` | `20` | 未读 | 读入（并发会话上限） |
| `prewarm_enabled` | `false` | 未读 | 读入（预热一个 TUI 进程） |
| `max_queue` | `40` | 未读 | 读入（排队上限） |
| `request_timeout_seconds` | `0` | 未读 | 读入（0=不限） |
| `first_byte_timeout_seconds` | `600` | 未读 | 读入 |
| `idle_timeout_seconds` | `300` | 未读 | 读入 |
| `session_idle_ttl_seconds` | `600` | 未读 | 读入 |
| `tool_timeout_seconds` | `300` | 未读 | 读入（MCP 回调超时） |
| `queue_timeout_seconds` | `30` | 未读 | 读入 |
| `max_request_bytes` | `33554432` | 固定 16 MiB | 读入 |
| `max_response_bytes` | `67108864` | 固定 64 MiB | 读入 |
| `max_event_bytes` | `65536` | 读入（现为常量） | 读入 |
| `default_model` | `""` | 未读 | 读入 |
| `default_cache_ttl` | `"1h"` | 未读 | 读入（喂 tap 的 `CRAG_TUI_CACHE_TTL`） |
| `thinking_display` | `"summarized"` | 未读 | 读入 |
| `model_effort` | `{}` | 未读 | 读入（喂 `CRAG_TUI_EFFORT`） |
| `persona_preset` | `"official_full"` | 未读 | 读入（决定 `cli_version`，见下） |
| `system_layout` | `"identity"` | 只读 env | **改为 config 优先、env 兜底** |
| `cch_enabled` | `true` | 未读（恒打 CCH） | 读入：false 时不打戳 |
| `cc_entrypoint` | `"cli"` | 未读 | **no-op**（官方注明 `_compatibility_only`） |
| `auto_compact_window` | `null` | 未读 | **no-op**（同上） |
| `proxy_url` / `proxy_required` | `""` / false | ✅ | — |
| `telemetry` | `null` | 未读 | 见 §7 |

`cli_version` 虽不在 example 里，但控制面 `rust-kernel-supervisor.mjs` 恒下发（`profileForPreset(...).cliVersion`，当前 `OFFICIAL_PROFILES` 只有 `2.1.303`/`2.1.296`）→ **必须读入**，用于 UA 与 `cc_version`。

---

## 4. G-B1：TUI 传输（`transport: "tui"`）

### 4.1 spawn

```
script -qefc "exec <claude_bin> --mcp-config <tempDir>/mcp.json --session-id <uuid>
             [--model <model>] [--system-prompt|--append-system-prompt <text>]" /dev/null
```

- 不需要 PTY 库：`script` 自建 PTY；Rust 侧 `std::process::Command` 即可。
- `stdio = pipe/pipe/pipe`，`detached = true`，`cwd = work_dir`。

### 4.2 子进程环境（相对 `process.env`）

| 变量 | 值 |
| :--- | :--- |
| `CRAG_TUI_TAP` | 每次运行新建的空文件，`0600`，位于 `tempDir` |
| `BUN_OPTIONS` | 追加 `--preload=<tap.js 落地路径>`（幂等：已有的同名 preload 先剔除） |
| `CRAG_TUI_MAX_TOKENS` / `CRAG_TUI_EFFORT` / `CRAG_TUI_CACHE_TTL` | 来自本次请求；**缺省不设** |
| `CRAG_V2_RUN_ID` | 运行标识 |
| `DISABLE_TELEMETRY` / `DISABLE_ERROR_REPORTING` | `1` / `1`（禁官方 CLI 自己外联上报） |
| `CLAUDE_CONFIG_DIR` | = `config_dir`（transcript 根据此计算） |

### 4.3 双 tail

| 源 | 路径 | 轮询 | 数据 |
| :--- | :--- | ---: | :--- |
| transcript | `<config_dir>/projects/<sanitizePath(cwd)>/<sessionId>.jsonl` | 40 ms | 判 `row.type === "user"` 且 `sequence > 提交前序号` → 提交成功 |
| tap | `<tempDir>/tap.jsonl` | 40 ms | `{s,open:true}` / `{s,e:<anthropic event>}` / `{s,end:"done"\|"cut"}` |

`sanitizePath(v)` = 非 `[A-Za-z0-9]` 全替换为 `-`；长度 >200 时追加 `-<sha256[:12]>`。实测 `cwd=/lab` → 目录名 `-lab`。

> **tap 的触发条件（实测修正）**：不要用 `x-claude-code-request-class === "main"`（官方 2.1.321 在 TUI 主对话根本不发这个头）。
> 正确判据：`/\/v1\/messages(?:\?|$)/.test(url)` **且** 响应 `content-type` 以 `text/event-stream` 开头，然后 `response.body.tee()`。
> 每个 TUI 进程只服务一轮主对话，取**首个**匹配请求即主对话，无需额外分类。

### 4.4 提交（`send`）

1. `materializePieces(content, tempDir)`：超长正文/附件落临时文件（`{path}`），短文本走 `{text}`；
2. 每片：`writeRaw("\x1b[200~" + pasteable(片) + "\x1b[201~")`（**bracketed paste**），随后 `sleep(40ms)`；
3. `writeRaw("\r")`；
4. 等 transcript 出现新的 `type === "user"` 行（超时=就绪超时）→ 视为已提交；
5. 结束后删除临时片。

`pasteable(v)`：`\r\n?`→`\n`，剥离控制字符（保留 `\n\t`），若以 `/ * ! # &` 开头则前置一个 `\n`，空串回 `.`。

### 4.5 就绪 / 拒绝判定

- 就绪：屏幕含 `CRAG_READY`（官方无此串，留作兼容）**或** 匹配 `/(?:^|\n)\s*[❯›][ \t]?[^\n]*$/m`；就绪后再等一个候选窗口（避免输入框未就绪）。
- 交互式拒绝：屏幕匹配
  `/(?:sign\s*in|log\s*in|login\s*method|select\s*login|onboarding|trust\s*this\s*folder|permission\s*required|choose\s*the\s*text\s*style)/i`
  → 立即以 `tui_interactive_required` 失败，不继续喂输入。

### 4.6 常量
`readyTimeout=30_000 ms`、`TRANSCRIPT_POLL_MS=40`、`TAP_POLL_MS=40`、`MAX_SCREEN_BYTES=32 KiB`、屏幕按 chunk 追加并截断。

### 4.7 实测记录（本机 Docker Desktop，2026-11-16）

环境：`ghcr.io/dofastted/kin-os-ubuntu:24.04` + 官方 `claude` 2.1.321（341,910,032 B，sha256 与包内 manifest 一致）+ 本地假上游（回定值 SSE）。

| 步骤 | 结果 |
| :--- | :--- |
| `script -qefc "exec claude"` + bracketed paste + `\r` | TUI 正常拿到 prompt 并回复（屏幕出现 `●PONG-STUB` / `✻done`） |
| 就绪判定 | 屏幕出现 `❯` 提示符，`isReadyScreen` 可命中 |
| `ANTHROPIC_BASE_URL` 指向本地 stub | stub 收到 `POST /v1/messages?beta=true`，UA `claude-cli/2.1.321 (external, cli)` |
| `CRAG_TUI_MAX_TOKENS=256` / `CRAG_TUI_EFFORT=low` | stub 收到 `max_tokens:256`、`output_config:{effort:"low"}` |
| tap（原始 `main` 判据） | 只有 `{"tap":"on"}`，**不触发** |
| tap（放宽为 URL+SSE） | **9 行**：`open` + `message_start` + `content_block_start` + `content_block_delta` + `content_block_stop` + `message_delta` + `message_stop` + `end:done` |
| transcript | `<config>/.claude/projects/-lab/<uuid>.jsonl` 内含 `{"type":"user","message":{"role":"user","content":"…"}}` |

必填环境（否则卡在向导）：`.claude.json` 预置 `theme` / `hasCompletedOnboarding` / `projects[cwd].hasTrustDialogAccepted` / `hasCompletedProjectOnboarding`，且容器 `-w` 必须与 trust 的 cwd 一致；首次启动仍可能弹一次主题/安全须知，需要补两次 `\r`。

---

## 5. G-B2：MCP 回调通道（工具执行）

### 5.1 注入

`<tempDir>/mcp.json`：

```json
{ "mcpServers": { "crag": { "command": "<kernel 自身路径>",
                            "args": ["mcp-bridge", "--config", "<tempDir>/mcp.json"] } },
  "crag": { "callbackUrl": "http://<host>:<port>/_crag-v2/mcp/<token>" } }
```

启动参数追加 `--mcp-config <tempDir>/mcp.json`。

### 5.2 回调端点

`POST /_crag-v2/mcp/<token>`（token 每次运行全新 UUID）：
- 请求：`{ id, tool, arguments }`（形状以 `mcp-bridge`/`mcp.rs` 现有的 `tools/call` 为准）；
- kernel：`pendingCalls.set(id, record)` → 上层产生 `tool_use` → 客户端在 `/internal/v1/messages` 下一轮带 `tool_result` → kernel 用 `id` 配对并**响应回该 HTTP 请求**；
- 超时：`tool_timeout_seconds`（默认 300 s）；超时回 MCP 错误而不挂死；
- 槽释放/取消：清空 `pendingCalls`，未完成的调用全部以错误结束。

### 5.3 现状

我们有 `mcp-bridge` 子命令（stdio JSON-RPC：initialize/tools/list/tools/call/ping），**缺**：回调 HTTP 服务、token 校验、`pendingCalls` 配对、超时。

---

## 6. G-C：自签包

| 项 | 要求 | 现状 |
| :--- | :--- | :--- |
| `claude-code-2.1.321/claude` | **真实官方 CLI**（341,910,032 B，sha256 `426c3381…`） | 我们的是 139 B 占位 |
| tap 脚本 | 包内**禁止** `.js`（`verifyCragV2Tree` 有正则拦截）→ 必须**编进内核**，运行时写到 `tempDir`（0700/0600） | 未做 |
| 打包工具 | `selfsign-package.mjs --claude-bin <path>` | ✅ 已加 |

⚠️ `LICENSES.txt` 明确：官方 Claude 2.1.321 是独立可执行文件，"Packaging does not establish redistribution permission" → **仅在自有机器打包，随仓库/镜像分发不可**。

---

## 7. G-D：health / telemetry / identity（功能缺口，非架构缺口）

| 项 | 控制面期望 | 现状 |
| :--- | :--- | :--- |
| `active` / `waiting` / `queued` / `pids` | `rustKernelBusy()` 判定"忙" | 未上报 → 看门狗可能误重启在飞请求 |
| `gateway_policy_v1` | true 才允许"槽满也接受 continuation/排队" | 未上报 → 走保守分支 |
| `/internal/v1/telemetry/apply` | 返回 `{ok, applied, enabled, scope:"native_claude_launch"}` | 404 |
| `vm_telemetry` / `telemetry_ready` / `telemetry{}` | 三者齐备才解锁槽内 native OAuth 路径 | false/false/null |
| `/internal/identity` | `{ok, identity:{schema_version, runtime_kind, hostname, os_pretty, arch, goos, worker_version, collected_at, hardware}}` | 404 → `worker_identity_unsupported` |
| CLI 重启计数 `cli_restarts` / `unhealthy_reason` | 看门狗依据 | null |
| `license_dir` 纵深校验 | 官方内核自验授权 | 我们只靠控制面准入 |

---

## 8. 验收矩阵

| ID | 条目 | 单测 | 沙盒验证 | 期望 |
| :--- | :--- | :--- | :--- | :--- |
| A1 | 27 键解析 | `config_parses_vendor_example`（用 example JSON 原样喂） | 面板重启后 `kernel.json` 落盘 | 所有键回读一致，两个 no-op 不产生行为 |
| A2 | `cli_version` 生效 | `cli_version_from_config` | 抓出站头 | `cc_version=<config>.<fp>` |
| A3 | `cch_enabled=false` | `no_cch_when_disabled` | 抓出站头 | 无 `cch=` 字段 |
| A4 | `system_layout` config 优先 | `layout_config_beats_env` | 面板设 identity | system 布局切换 |
| B1 | PTY 拉起 + 就绪 | `tui_ready_on_prompt_glyph` | `run-tui.sh` | 屏幕出现 `❯` 后 ready（**已实测**） |
| B2 | bracketed paste 提交 | `paste_frames` | 同上 | transcript 出现 user 行（**已实测**） |
| B3 | tap 改写三旋钮 | `tui_request_overrides` | `stub-headers.mjs` 抓包 | `max_tokens/effort/ttl` 生效（**已实测**） |
| B4 | tap 拷主对话流 | `tap_captures_first_sse` | `run-tui-any.sh` | 9 行事件流（**已实测**；条件为 URL+SSE，非 request-class） |
| B5 | refusal 检测 | `interactive_refusal` | 用未登录 HOME 启动 | `tui_interactive_required` |
| C1 | MCP 回调配对 | `mcp_callback_roundtrip` | 客户端发 tools + tool_result | 一次工具调用闭环 |
| C2 | 工具超时 | `tool_timeout_errors` | 故意不回 tool_result | 300 s 后 MCP 错误 |
| D1 | busy 字段 | `health_busy_fields` | 长请求中查面板 | `active>0`、看门狗不重启 |
| D2 | telemetry apply | `telemetry_apply_shape` | `POST /internal/v1/telemetry/apply` | 五个字段齐全 |
| D3 | identity | `identity_shape` | `POST /vms/:id/collect-identity` | 200 + fingerprint 增长 |

---

## 9. 未知项与风险

| 项 | 状态 |
| :--- | :--- |
| `x-claude-code-request-class` 何时出现 | 已定性：枚举 `main/subagent/workflow/compaction/auxiliary/side_reply` + `x-claude-code-agent-type`；**普通 TUI 主对话不发**，故实现不依赖它 |
| 官方内核如何把 tap 的 `e` 行拼成 Anthropic 事件流 | 可从 `gateway/v2-runtime.mjs` 的 `onTuiTap` 反推（待做） |
| `prewarm_enabled` / `session_slots` 的真实语义 | example 有键，行为未知 |
| `official_full` persona 的具体差异 | 仅在 `OFFICIAL_PROFILES` 中体现为 profile 名 |
| TLS/h2 字节级一致 | **不可验证**：需官方内核 golden 流量；但 TUI 方案下由官方 CLI 自己发，天然一致 |
| 工具执行的真实 deltas | 需真实会话 + 真实工具 |

---

## 12. 实现决策：走原生 CLI，不自拼请求

### 12.1 vendor 只有两种 transport，都不是自拼

`gateway/v2-runtime.mjs:312` 的 `transport === "tui" ? [...] : [...]` 是二选一：

| transport | 形态 | 谁发上游请求 |
| :--- | :--- | :--- |
| `tui` | PTY 拉起 CC，tap tee SSE | 官方 CLI |
| 非 tui | `--print --input-format stream-json --output-format stream-json` | 官方 CLI |

**没有第三种。** 我们原有的 `direct`（自控 HTTP/TLS + CCH 打戳 + persona）是 vendor 不存在的形态，
只保留为**离线差分对照**（441 向量 oracle 验证协议表），不作为产品通路。

### 12.2 非 tui transport 实测（推荐先做）

2.1.321 + relay 实测通过，且比 TUI 少掉 PTY / tap / transcript / bracket paste 四套机制：

```
claude --print --input-format stream-json --output-format stream-json \
       --include-partial-messages --replay-user-messages --verbose \
       --no-session-persistence --strict-mcp-config --mcp-config <json> \
       --session-id <uuid> [--model <m>] [--append-system-prompt <text>]
```

`--include-partial-messages` 让 CLI 把**真实上游 SSE 事件**原样吐成 `{"type":"stream_event","event":{…}}`，
内核只需按序透传，不解读、不改写。一次完整对话的 12 行序列（夹具 `tests/fixtures/native-stream.ndjson`）：

```
system/init → system/status → user 回显
→ stream_event×6 (message_start, content_block_start, content_block_delta×2,
                   content_block_stop, message_delta, message_stop)
→ assistant (整包) → result/success (stop_reason, total_cost_usd, usage)
```

已落地：`src/native.rs`（`Args::to_vec` 参数集 / `to_sse` 转接）+ `tests/native_stream.rs`（回放夹具）。

### 12.3 TUI 参数集在 2.1.321 全部可用（后续要做时不必重查）

`--session-id` `--strict-mcp-config` `--mcp-config` `--permission-mode` `--bare`
`--tools ""`（禁全部内建工具，工具全走 MCP）`--no-chrome` `--append-system-prompt`
`--system-prompt` `--no-session-persistence` `--replay-user-messages` 均存在。

### 12.4 第三方中转的客户端门禁实测（用于判定指纹质量）

对 `packyapi` 的「仅允许 Claude Code」分组做了消融（每次 1 个 haiku 请求）：

| 变体 | 结果 |
| :--- | :--- |
| 裸 curl（无 CC 特征） | **403** `only accessible via the official Claude CLI` |
| 只补 UA `claude-cli/2.1.321 (external, cli)` | 过层 1 |
| `metadata.user_id` 缺失 | **400** `please use the correct Claude Code client` |
| `metadata.user_id = "x"`（结构非法） | **400** |
| `metadata.user_id` 结构合规（device_id 32 hex 或 64 hex、随机） | **200** |
| 删全部 `x-stainless-*` | **200** |
| 删 `x-app` / 删 `anthropic-beta` / 删 `tools` | **200** |
| UA 改 `2.1.303` | **200** |

结论：门只验「UA 形如 `claude-cli/*`」+「`metadata.user_id` 是 `{device_id,account_uuid,session_id}`
的 JSON 字符串」；**不验真实身份、不校验版本号、不要求 stainless 头**。
这也反向证明：走原生 CLI 时这些都天然满足，自拼才有风险。

direct 回退路径已补 `wire::stamp_metadata`（原 `Identity::user_id()` 是死代码）。

---

## 附：沙盒复现脚本（192.168.1.x）

```sh
# 沙盒（192.168.1.x，无出网到 packyapi，仅能对本地 stub 验证）
/root/lab-crag/extract-vendor-cc.sh      # 取官方 CC 2.1.321 + 对 manifest 校 sha256
/root/lab-crag/probe-native-adapter.sh   # 证明 12-API/--single-process-* 不属于现行 CLI
/root/lab-crag/verify-tap.sh             # tap 注入 + 三旋钮改写（--print 模式）

# 本机（Docker Desktop，可出网到真实上游）
D:/vm2api-lab/run-tui.sh                 # TUI + 真实上游（packyapi）跑通一轮对话
D:/vm2api-lab/run-tui-args.sh            # 加 --session-id/--mcp-config 抓真实请求头
D:/vm2api-lab/run-tui-any.sh             # tap 放宽判据 → 抓到主对话 9 行事件流
D:/vm2api-lab/stub-headers.mjs           # 记录请求头与出站 body（验证 overrides）
```

### 12.5 已实现：进程层 + 端到端验证

`kernel.json` 的 `transport` 复用 `upstream_mode` 键：`direct`（默认，内核自拼，仅离线差分）/ `native`（官方 CLI 发包）。

```json
{ "cli_bin": "/path/to/claude", "upstream_mode": "native", "upstream_base": "https://api.anthropic.com" }
```

内核行为（`src/native.rs` + `gateway::forward_native`）：

1. 取 `messages` 里**最后一轮 user content**（会话由 CLI 自己维护，内核不重放历史）；
2. `body.system` 拍平成 `--append-system-prompt`，`body.model` → `--model`；
3. spawn `cli_bin`，写一帧 `{"type":"user","session_id":…,"message":{…}}` 后关 stdin；
4. 逐行读 stdout：`stream_event` → 原样写成 SSE；`result` → 终止；`system`/`user`/`assistant` 不外发；
5. 流式收尾补 `message_stop`；非流式回整包 `assistant.message`；失败回 `error` 事件或 502；
6. `HOP_TIMEOUT`（180 s）兜底，`kill_on_drop` 保证子进程不泄漏，stderr 脱敏后仅用于诊断。

端到端实测（容器内 `ghcr.io/dofastted/kin-os-ubuntu:24.04` + 官方 CC 2.1.321 + 第三方中转 + haiku 5.5）：

```
POST /internal/v1/messages → 200 text/event-stream
event: message_start
event: content_block_start
event: content_block_delta   data: {"delta":{"text":"PONG","type":"text_delta"},…}
event: content_block_stop
event: message_delta
event: message_stop
```

非流式（`stream:false`）→ `200 application/json` + `x-terminal-state: verified`；
`/internal/health` → `hop_mode:"native"`。

### 12.6 会话池（一进程多轮）

实测地基：`--print --input-format stream-json` 下**连写两帧、同一 stdin，CLI 各产出一轮
`result`**（每轮还会重发一次 `system/init`）。因此跨 hop 不需要重放历史 —— CLI 自己持有会话。

| 机制 | 实现 |
| :--- | :--- |
| 池键 | `headers["x-claude-code-session-id"]` → `body.metadata.user_id.session_id` → `envelope.request_id`（依次降级；末级等于不复用） |
| 复用 | 同键复用 live 进程，只写本轮那一帧 user 消息 |
| 轮次隔离 | 每 hop 一个 `mpsc`；reader 任务按 `result` 收尾并清空当前轮次，之后的帧无人认领 |
| 空闲回收 | 每次取会话时惰性清理：进程已死或 `last_used > 300 s` 即摘除 |
| 打断 | `/internal/v1/cancel` → 按同一键杀进程并摘除 |
| 健康 | `cli_pid` 取池内首个 live pid；`hop_mode:"native"` |

失败诊断：本轮一个事件都没收到时，回投该会话的 stderr（脱敏、8 KiB 上限）。

### 12.7 工具回环（已实现并实测）

链路：CC 发起 MCP 调用 → 本进程的 `mcp-bridge` 子命令 → 内核自建回调 HTTP
（`127.0.0.1:<port>/_crag-v2/mcp/<session>`）→ park → 合成 `tool_use` 回投控制面 →
控制面执行后用**同一端点**带 `tool_result` 续跳 → 内核解开 park → CLI 继续。

| 环节 | 实现要点 |
| :--- | :--- |
| 工具暴露 | 请求体 `tools` → MCP 定义（`input_schema`→`inputSchema`），写进每会话的 `mcp.json` |
| CLI 参数 | `--strict-mcp-config --mcp-config <json> --tools "" --allowedTools mcp__crag --no-chrome` |
| 权限坑 | 不加 `--allowedTools` 会得到 `system/permission_denied`，回调根本不发（实测） |
| park | 调用 id 用 `crag_tool_<uuid>`（与 vendor 同形），300 s 超时回 504 |
| 合成事件 | 标准 Anthropic SSE：`message_start` → `content_block_start(tool_use)` → `input_json_delta` → `content_block_stop` → `message_delta(stop_reason=tool_use)` → `message_stop` |
| 续跳判定 | body 最后一条 user 消息里全是 `tool_result` 块；解不开则回 410 `unknown tool_result` |
| 去重 | CC 自己的 `mcp__crag__*` 工具块连同其 delta/stop 一律不外发，控制面只见 `crag_tool_*` |

端到端实测（容器内 + 官方 CC 2.1.321 + 真实上游 haiku）：

```text
hop1  200 | 12 events | tool_use: crag_tool_d1b10b68… name=get_time
hop2  200 | 13 events | text: "The get_time tool returned exactly: TIME=2026-11-16T09:00:00Z"
```

面板侧**不需要改动**：vm2api 是纯转发（`src/lib/transport/*` 不构造任何 `tool_result`），
工具由终端用户自己的 Claude Code 执行，`crag_tool_<uuid>` 对它只是不透明 id
（`crs-persona.mjs` 里的 `toolResultOnlyMessage` 只用于计费索引，与路由无关）。

仍未做：`is_error` 的端到端验证；续跳历史指纹校验（vendor 有 `continuationFingerprint`，
我们只按 id 精确匹配）；面板 → 槽位 → 真实推理的整链回归。

### 12.8 沙盒整链回归（1.109，新内核换入）

把带 `native` 通路与工具回环的内核重新打进自签包，换到沙盒槽位 `vm-crag-01`：

```sh
# 1) 重打包（复用同一对权威密钥 → pem/key_id/public_key 不变，许可无需重签）
node cragv2/tools/selfsign-package.mjs --bin /root/lab-crag/bin/crag-v2.next \
  --arch amd64 --out /opt/docker/lab/pkg-next --keys /root/lab-crag/keys.json \
  --claude-dir claude-code-2.1.321 --claude-bin /opt/docker/lab/vendor-cc/claude \
  --vm-id vm-crag-01 --term 1m
# 2) 覆盖 share 与槽位副本（4 个内核文件 + claude 目录）
# 3) docker restart kin-crag-01
```

结果（面板 API 实测）：

| 检查 | 结果 |
| :--- | :--- |
| share 包 `verifyCragV2Tree` | `ok:true`；`public_key_id 4997f00f…`、pem `e1668885…`（与换包前一致） |
| 槽位 license | `status:"valid"`、`license_id 0bc9ef70…`、到期 2026-12-16 |
| 槽位健康 | `engine:"rust"`、`resolved:"rust"`、`reachable:true`、`version:"2.1.303"`、`healthy:true` |
| 面板请求 | 认证通过后停在 `503 pool_unavailable`（号池无账号），未触达槽位 |

**换包两个必踩的坑**（都会让面板把许可判成 `license_unconfigured`）：

1. `manifest.sha256` 覆盖 **全部** 文件，包括 `claude-code-<ver>/claude`。只覆盖 4 个内核文件会得到
   `crag_v2_hash_mismatch: claude-code-2.1.321/claude`（槽位里那枚旧的还是占位 ELF `f88f22ee…`，
   而 manifest 期望真实 CC `426c3381…`）。
2. 包内可执行文件必须 `chmod 755`，否则 `verifyCragV2Tree` 报 `crag_v2_elf_invalid:
   CRAG v2 executable permission is missing`。

**真实推理整链未能跑通的原因**（环境限制，非实现缺陷）：

- 面板号池为空 → `pool_unavailable`，请求在面板层就被挡回；
- 1.109 出网分裂：`baidu 200` 但 `cloudflare/packyapi 000`（DNS 被污染成 `2a03:2880:…face:b00c…`，
  用 DoH 拿到真实 A 记录 `104.18.24.163` 后 `--resolve` 依然不通），CF 前置的中转无法抵达。

因此"面板 → 槽位 → native → 真实上游"这一段只能在有干净出网的机器上补；
内核侧的等价链路（socket → 内核 → 官方 CLI → 真实上游 → SSE 回投，含工具回环）已在开发机容器内实测通过。

### 12.9 追平上游 + 隐匿性约束（对齐上游 issue 的四个补丁）

上游 issue 里与原生内核直接相关的故障，按「我们是否中招」判定后补了四项。
**所有改动只有两种归宿：本机文件、或对控制面（本地 socket）可见。没有一项让出站请求多带一个字节。**

| 补丁 | 对应上游 issue | 做法 | 出站影响 |
| :--- | :--- | :--- | :--- |
| 服务器工具不映射进 MCP | #1088（web_search 被 400 拒） | `mcp_tools()` 只保留带 `input_schema` 的客户端工具；`skipped_server_tools()` 供本地诊断 | 无（`--tools ""` 与 `--allowedTools` 都是本地 CLI 参数） |
| park 超时摘除 | #1031（超时后 409 死锁） | 回调 504 前 `pool.forget(id)`，杜绝泄漏与「后到续跳解开无人等的调用」 | 无 |
| tool id 带会话标签 | #1114 / #1035（续跳派到别的槽） | id 形如 `crag_tool_<会话FNV32>_<uuid>`；续跳标签不符回 **409 session mismatch**（而非笼统 410） | 无（id 只在我们与控制面之间流转） |
| 本地观测产物 | #1119（上游靠 `provider-result.json` 定位） | 每跳一行 `/tmp/crag-obs/<会话标签>.jsonl`，仅 `at/continuation/streaming/events_last/parked/failure` | 无（只写本机；单测断言不含请求正文） |

另外两项**性能**对齐：

- 会话空闲回收从硬编码 300 s 改为跟随 `kernel.json` 的 `session_idle_ttl_seconds`（面板默认 600）。
  原来比面板短，会在面板仍认为会话活着时杀掉 CLI，续跳直接 410。
- `DISABLE_TELEMETRY=1` / `DISABLE_ERROR_REPORTING=1` 注入子进程环境（vendor 同样设置）。
  这两项只有 0/1 两种取值，不构成新指纹，但少发两类出站请求。

#### 隐匿性不变量（代码里必须一直成立）

1. **native 通路不构造请求体**：`metadata`、`anthropic-beta`、`CCH`、UA 全由官方 CLI 自己产生；
   内核侧唯一碰过的字段是 `system`（拍平成 `--append-system-prompt`）与 `model`（`--model`）。
2. **不新增任何上游可见字段/头**：`suppress_mcp_tool_use` 只做**减少**（丢掉 CC 自己的 `mcp__crag__*` 块）。
3. **观测产物不外出**：`crag-obs/*.jsonl` 与 stderr 诊断都只落本机。
4. **不落会话文件**：`--no-session-persistence` 保持开启，槽内不留 transcript。
5. 服务器工具不代执行、不伪造结果（宁可让客户端看到工具不可用，也不替上游编答案）。

#### 仍然存在的上游问题（我们只能缓解、无法根治）

- **#1114 / #1035 的根因在面板路由**：`pending` 表在进程内，面板若把续跳派到另一个槽，
  那个槽只能回 409。要根治必须面板侧做会话粘槽，或把 pending 落到共享存储。
- **#1080 资源**：我们每会话一个真实 CC 子进程（341 MB 二进制），比上游的进程内多会话更吃内存与 pid；
  槽的 `mem_limit`/`pids_limit` 必须相应放大，否则先被杀的就是它。

#### 12.9.1 补丁后的实测（容器内官方 CC 2.1.321 + 真实上游 haiku）

```text
启动      : native session idle ttl: 600s   ← 跟面板 session_idle_ttl_seconds 对齐
warm hop  : 200 OK
外来 tool id : 409 Unknown   ← 会话标签不符（上游 #1114 的可检测形态）
工具回环 hop1: 9 events, tool_use = crag_tool_0e2506ea_0523…（带会话标签）
工具回环 hop2: 11 events, text 含注入的 TIME=2026-11-16T09:00:00Z
观测产物   : /tmp/crag-obs/0e2506ea.jsonl
             {"at":…,"continuation":false,"streaming":true,"events_last":"message_stop","parked":true,"failure":null}
             {"at":…,"continuation":true,…}          ← 两跳两行，无正文
```

### 12.10 能力对齐批次（按面板契约补齐）

面板控制面实际会调的端点（`grep /internal/ src/lib`）：`health` `messages` `cancel` `identity` `oauth/usage` `models` `forward` `v1/codex/responses`。

| 能力 | 补法 | 上游可见影响 |
| :--- | :--- | :--- |
| `/internal/identity` | 回本地身份（`runtime_kind/dataplane/worker_version/hop_mode/device_id 前 16 位/sessions`） | 无（只回控制面） |
| `/internal/oauth/usage` | **501 `usage_unsupported_native`**：native 下凭据属于槽内 CLI，内核不额外查询额度 | 无（刻意不产生出站请求） |
| `/internal/forward` | **501 `forward_unsupported`** | 无 |
| `/internal/v1/codex/*` | **404 `codex_unsupported`** | 无 |
| `/internal/v1/telemetry/{events,apply}` | 接收、只回 `{ok:true}`，**不转发** | 无 |
| health 字段 | 补 `provider/cli_pid/pids/active/waiting/queued/cli_restarts/telemetry_ready/telemetry/vm_telemetry` | 无 |
| SSE 保活 | 每 15 s 无事件即写 `event: ping`（对应上游 #997） | 无 |
| 错误码细分 | `cli_spawn_failed` / `cli_hop_timeout` / `cli_unavailable` / `upstream_error`（上游 #1041 的本地版） | 无 |
| 续跳形状指纹 | `history_fingerprint`：只哈希 role + 块类型 + `tool_use` id，**不哈希正文**；不符回 400 `tool_result history mismatch` | 无（摘要只在本机内存） |
| 池容量 | `session_slots`（默认 20）触发 LRU 摘除；`tool_timeout_seconds`（默认 300）用于 park 上限 | 无 |
| 配置键 | 补读 `claude_bin/cli_version/session_slots/session_idle_ttl_seconds/tool_timeout_seconds/provider/system_layout/cch_enabled/license_dir` 等 | 无 |

比上游更保守的一处：上游 `continuationFingerprint` 用**全文**哈希，客户端等价改写就会误拒；
我们只比形状，既能抓到"续跳派错槽/历史被改"，又不会因文案差异翻车。

#### 12.10.1 实测（容器内 + 真实上游 haiku）

```text
启动          : native pool: idle=600s max_sessions=20 tool_timeout=300s
health        : hop_mode=native provider=local_cli active=0 waiting=0 pids=[] cli_restarts=0 telemetry_ready=false
health(有会话): active=1 pids=[27] cli_pid=27
identity      : 200 {"runtime_kind":"docker","dataplane":"crag","hop_mode":"native","device_id":"8174481b…"}
oauth/usage   : 501 usage_unsupported_native
forward       : 501 forward_unsupported
codex         : 404 codex_unsupported
工具跳        : 200 callId=crag_tool_12a18df9_36c2…
篡改历史形状  : 400 history mismatch   ← 指纹生效
正确续跳      : 200 "The current time is 10:00:00 UTC on November 16, 2026."
```

### 12.11 策略修订：以"与官方同形"为准，而不是"少发特征"

**结论修正**：此前把 `DISABLE_TELEMETRY`、拒绝 TUI 当作隐匿收益，方向错了。
判据换成一句话 —— **只发官方本来就会发的特征，不发官方不会发的特征**。
在合规地区，官方特征本身是"正常用户"，缺失它们才是异常。

据此三处改动：

| 项 | 旧做法 | 新做法 | 理由 |
| :--- | :--- | :--- | :--- |
| 子进程遥测 | `DISABLE_TELEMETRY=1` / `DISABLE_ERROR_REPORTING=1` | **不设置** | 官方安装默认上报；关掉才是异常（vendor 关了，属于它的选择） |
| TUI 通路 | 判定为"负收益"，不做 | **实现** | `cc_entrypoint=cli` + 完整 `safeguards` 才是真实交互式会话的形态 |
| 额度探测 | 501 不支持 | **实现**（见 §12.12） | 官方 CLI 自己就会调 `/api/oauth/usage`，同形调用不构成新特征 |

#### TUI 通路实现要点

| 环节 | 做法 |
| :--- | :--- |
| 启动 | `script -qefc "exec '<cli>' <args>" /dev/null`（PTY），`stdin` 可写 |
| 参数 | `--session-id <会话键> --permission-mode default --no-chrome [--model] [--append-system-prompt]` |
| tap 注入 | `BUN_OPTIONS=--preload=<temp>/tap.js` + `CRAG_TUI_TAP=<temp>/tap.jsonl` |
| tap 钩子 | **必须替换 `Bun.FetchSession` 类**（官方 CLI 用 FetchSession，不走全局 `fetch`）；用 `Object.defineProperty(response,"body")` 换成本身的 tee 分支，**不能新建 Response** |
| 就绪 | 屏幕出现 `❯`/`›` 再静默 500 ms；出现主题向导/信任弹窗直接失败（不猜着敲） |
| 提交 | bracketed paste `\x1b[200~…\x1b[201~` + 40 ms + `\r` |
| 回投 | 只转 `{s,e}` 行（上游真实 SSE），`{s,end:"done"}` 收尾；`ping` 丢弃 |

实测（内核级，对本地 stub 零成本）：注入后 tap 报 `{"tap":"on","mode":"fetch_session"}`，
CLI 侧 `Bun.FetchSession` 被成功替换。此前的失败版本用全局 `fetch` 钩子 —— tap 已 armed
但抓不到任何事件，正是"官方走 FetchSession"的直接证据。

#### 12.11.1 TUI 通路实测（内核级，对本地 stub 零成本）

```text
一跳  : 200 OK
events: message_start → content_block_start → content_block_delta →
        content_block_stop → message_delta → message_stop
text  : "PONG-STUB"
二跳(同会话复用 PTY 进程): 200 OK，事件序列相同
出站请求: /v1/messages?beta=true   cc_entrypoint=cli     ← 与真实安装同形
tap    : {"tap":"on","mode":"fetch_session"} → {"s":1,"open":true} → 事件…
```

实现中踩到并固化的四条硬约束：

1. **tap 必须替换 `Bun.FetchSession` 类**。只钩 `globalThis.fetch` 时 tap 会 armed 但零事件
   —— 官方 CLI 不经过全局 fetch。改 body 也只能用 `Object.defineProperty(response,"body")`，
   新建 `Response` 会改变语义。
2. **每 CLI 进程一个全新 `--session-id`**。复用旧 id 会 `Error: Session ID … is already in use`
   直接退出；而就绪检测可能已在 splash 里匹配到 `❯`，于是把 prompt 粘进一个将死的进程。
   现在额外加了致命屏幕识别（`already in use` / `command not found`）与"尾部出现 Error 就不认提示符"。
3. **粘贴与回车之间需要 1000 ms**，并在 250 ms 后补一次回车。40 ms 时文本能进输入框但回车被吞。
4. **TUI 模式不再起槽位 CLI**（旧参数 `--single-process-subagents` 在 2.1.321 不存在）。

已知副作用：官方 CLI 会**自动升级**（实测把 2.1.325 装进 `$HOME/.local/share/claude/versions/`）。
这是真实安装的正常行为，但它会让"基线版本"漂移；需要固定版本时应显式指定 `cli_bin`。

#### 12.11.2 工具暴露方式：现代 CC 用「延迟工具 + ToolSearch」

`--tools ""` 既不必要也不安全，实测结论如下（本地 stub，零上游成本）：

| 配置 | MCP bridge 是否启动 | 请求里的 `tools` |
| :--- | :--- | :--- |
| `--tools ""`（+`--allowedTools`） | ✅ | **只剩 MCP 工具** → 中转判 403「客户端异常」 |
| 无 `--tools ""`（任意 `--strict-mcp-config`/`--allowedTools`/显式 `type:stdio`/项目级 `.mcp.json` 组合） | print 模式 **❌ 不启动**；TUI 模式 **✅ 启动** | 12 个内建 + `DeferredToolPlaceholder` |

2.1.321 起，MCP 工具**不再预先声明**，而是通过内建 `ToolSearch` 工具按需检索
（`tools` 里能看到 `ToolSearch` 和 `DeferredToolPlaceholder`）。
因此正确做法是：

- **保留内建工具表**（官方形状，不会被风控判异常）；
- 照常挂 `--mcp-config`，让 bridge 起来；
- 由模型在需要时用 `ToolSearch` 找到 `mcp__crag__*` 再调用 —— 之后仍走我们的 park/续跳。

`--tools ""` 只在"强制 MCP-only"的旧语义下有意义，代价是空工具表这个显眼的异常特征。

### 12.11.3 tap 必须放过未改写的请求

实测（2.1.321 + Bun 编译版 CLI）：tap 里即使没有任何覆盖（`CRAG_TUI_MAX_TOKENS=0` /
`EFFORT=""` / `TTL=""`），只要把 `init` 或 `Request` 摊平成普通对象
（`{...init, body}`）传给 `super.fetch`，底层就会发出畸形请求，中转直接回 **429**
（CC 侧表现为 `Retrying in N` 倒计时，最终 `Unable to connect to API`）。

规则：**改写前后字节相同就原样放行**（`if (body === init.body) return [input, init]`）。
`tee()` + `defineProperty(response,"body")` 本身没有问题（厂商 tap 同样做法），
出问题的只有请求侧的对象替换。

### 12.11.4 musl 产物必须用独立 target 目录

Windows 宿主跑 `cargo build --release`（glibc）与容器内 musl 构建**共用 `target/`** 时，
两套对象文件会混进同一次链接：产物能生成，但一启动就 **SIGSEGV**
（实测 `--version` 即崩，`cargo test` 却是全绿）。

构建脚本：`tools/build-musl.sh`（强制 `CARGO_TARGET_DIR=/src/target-musl`）。
验证：新二进制必须能跑 `--version` 输出 `2.1.321 (CRAG v2 native kernel; rust)`。

### 12.11.5 tap 用 TransformStream 直通，不用 tee

`response.body.tee()` 会把响应体分流：CC 侧读到的是分流后的分支，实测在网络抖动
时会看到不完整的流并重试。改为 `body.pipeThrough(new TransformStream(...))` ——
单读一遍、原样下发，观察在 `transform` 里做（零改动、零复制）。

`prepare()` 同样只在真的改写时才替换请求对象：字节没变就 `return [input, init]`。

## 12.12 构建产物形态（实测）

- **glibc** 产物在 `ghcr.io/dofastted/kin-os-ubuntu:24.04` 里正常，作为槽位内核直接可用。
- **musl 静态**产物当前会启动即 SIGSEGV（`--version` 也崩），与 `target/` 混用无关
  （独立 `CARGO_TARGET_DIR` 重建后依旧）。要在 alpine 用 musl，需先单独复查这条链路。

### 12.11.6 构建陷阱：宿主 `cargo build --release` 产出的是 .exe

Windows 宿主上 `cargo build --release` 生成 `target/release/crag-v2.exe`（PE），
而仓库里那个没有后缀的 `target/release/crag-v2` 是**上次容器构建留下的旧 Linux 文件**，
`cargo` 不会覆盖它。把旧文件拷进容器 → 改的代码根本没生效（本次排查因此空转一小时）。

规则：
- 要跑容器，只能用 `tools/build-musl.sh`（或等价 Docker 构建），产物是
  `target-lin/release/crag-v2`；
- 部署前用 `--version` 自证：必须打印 `2.1.321 (CRAG v2 native kernel; rust)`；
- 判断"改没生效"先看 `ls -la target/release/crag-v2{,.exe}` 的 mtime 与后缀。

### 12.11.7 TUI 通路可用（transcript 观察，零干扰）

关掉 tap 预加载、改由 transcript 观察后，端到端跑通：

```
本地 stub：200 OK  message_start→…→message_stop  text="PONG-STUB"
真实中转（cf.api.fan + claude-sonnet-5-5）：
  200 OK  完整 SSE  text="HTTP cache headers (like Cache-Control, ETag, and Vary) …"
```

同会话多跳（2026-11-17 最终验证，真实中转 cf.api.fan + claude-sonnet-5-5）：

```
hop1 「My secret word is ORANGE. Remember it.」  200 OK  5.4s   "That's already saved…"
hop2 「What was my secret word? Reply with one word.」 200 OK 10.7s  "ORANGE"
```

第二跳曾长期失败，根因是三个同源 bug（都已修）：
1. tap 关掉后 pump 读不到行，每轮等满 `HOP_TIMEOUT`(180s) 才释放 `busy` → 第二跳 502；
   改为按 transcript「stop_reason 已定的 assistant 行数增加」判定回合结束。
2. 回合结束判定用**本轮新 uuid** 拼 transcript 路径，而复用进程时会话 id 不变 → 永远等不到；
   改为 spawn 时算好存进 `Live`。
3. 兜底读取同样用了新 uuid → 第二跳必然 30s 后 `tui_no_output`；
   改为由 `TuiPool::transcript_for(key)` 暴露进程自己的路径。
另外：兜底遇到 `stop_reason=tool_use` 的行必须**跳过**（工具轮次不是最终回答），
早先直接 `return None` 会让整轮误报成无输出。

结论：`--preload` tap 完全不是必需的；transcript 通道对 CC 零改动，
更符合"只发官方会发的东西"的隐匿性要求。工具回合仍待实现（见 §12.11.2）。

### 12.11.8 musl 产物不稳定 → 用 glibc 产物（已验证可跑）

同一份源码用 `rust:1-alpine`（musl 静态）构建，产物时好时坏：
`4797632` 能跑、`4805824` 启动即 SIGSEGV，且与 target 目录隔离无关。
槽位镜像本身就是 Ubuntu，直接用 `rust:1`（glibc）构建的产物，行为稳定：

    docker run --rm -v $PWD:/src -w /src -e CARGO_TARGET_DIR=/src/target-gnu \
      rust:1 sh -c 'cargo build --release && cp target-gnu/release/crag-v2 target/crag-v2-linux'

部署前必须 `--version` 自证能启动。

实测结论（2026-11-17）：
- `rust:1`（Debian）产物是**动态链接** glibc，在 `kin-os-ubuntu:24.04` 里正常
  （`--version` → `2.1.321 (CRAG v2 native kernel; rust)`）；
- `rust:1-alpine` musl 静态产物在同一镜像里**启动即 SIGSEGV**，且同一份源码时而能跑时而不能，
  不可用于交付；
- `file` 一眼分辨：`static-pie linked` = musl（不要），`dynamically linked` = 可交付。

### 12.11.9 TUI 工具回合：桥能调到，但 park 不成立

真实中转实测（`tools/lab/tool-loop.mjs`）结论：CC **确实**走了桥——

```
assistant stop=tool_use  types: tool_use:ToolSearch
assistant stop=tool_use  types: tool_use:mcp__crag__get_time
```

但 transcript 里**没有对应的 tool_result**，说明桥的响应没有回来。原因：
`Pool::park(key, …)` 走的是 `sessions.get_mut(key)`，而 TUI 模式从不创建 native 会话，
键（这里是 FNV32 会话标签）查不到 → `park` 返回 `None` → 桥回 404 → CC 该轮悬空。

修法（未实现）：给 Pool 加一个「游离 park」表（按会话标签索引），
`park` 在 sessions 里找不到时落到这张表；`resolve`/`pending_calls` 同时查两处。
改动约 30 行，验证仍需一次真实模型调用（stub 无法驱动模型决定调工具）。

## 13. CRAG 3.1.4 适配（上游 2026-11-17）

上游把签名 payload 从 3.1.3 提到 **3.1.4**（kernel 894,472 B，sha256 `bf987f22…`），
并在 #1162「preserve CRAG 3.1.4 behavior」里改了三类东西。按「内核 / 面板」分清：

### 13.1 面板侧（我们的 Rust 内核不需要跟）

- `crs-persona.mjs`：system 注入改为 `insertSystemAfterUser()` —— 插在「最后一个相关 user」
  之后、assistant 之前；若前面已是 system 则**合并内容**而不是再插一条。
  zero-billing 分支走同一函数。
- `pool-scheduler.mjs`：仅"配额窗口耗尽"的排队返回 `pool_rate_limited`，其它一律透传原因。
- `upstream-error-policy.mjs`：**请求作用域**的 429 不再触发 `/usage` 探测。

### 13.2 内核侧（必须跟）

`rust-kernel-supervisor.mjs` 现在会给 `runtime_variant: "crag-v2"` 的配置写
`session_slots = min(请求值, slots_per_worker)`，并按此核对健康回报。我们已对齐：

- `TuiPool` 增加并发上限（之前**完全没有**，TUI 模式会无限起 CLI 进程），
  超限时按 `last_used` 摘除最久未用者并连带杀掉其 CLI；
- `NativePool::slots()` / `TuiPool::slots()` 暴露该值；
- `/internal/health` 回报 `session_slots`，供面板收敛判断。

### 13.3 工具回环 120 秒假死的真因：异步上下文里的阻塞休眠

现象：TUI 模式下 MCP 工具调用永远要等 **120 秒**才被 CC 接受，模型最终拿到的是
「工具超时已转入后台任务」。内核侧 park→resolve 只要 30 ms，桥也确实把回包写了出去。

排查过程中被排除的假设（都实测过，别再重复）：

| 假设 | 实测结果 |
| :--- | :--- |
| `initialize` 回包 id 需省略/回显 | 无影响 |
| 回包分帧要用 `Content-Length` | 无影响（两种都能被 CC 解析） |
| 缺 `notifications/progress` | 无影响（且厂商桥也不发，已移除） |
| PTY 尺寸过小（CC 日志报 19x80） | 无影响（仍显式设为 50x200） |
| `--allowedTools mcp__crag` 匹配不到完整工具名 | 无影响（已改为 `mcp__crag__*`） |
| 厂商自己的 JS 桥 `runtime_mcp-bridge.mjs` | **同样卡 120 秒**，与桥实现无关 |
| CLI 版本 2.1.321 的 `mcp runtime arm: v2` | v2 本身正常（假回包时 14 秒就能走完回环） |

真因：`tui.rs` 里 `answer_after()` / `transcript_answer_file()` 在 **async 函数里用
`std::thread::sleep` 轮询 transcript**。容器里运行时实际只有一个可用 worker，
这种阻塞休眠会把 executor 整个卡死到轮询截止时间，于是：

```
detached send at t+31ms      （oneshot 已把工具结果发给回调任务）
callback woke after 122.18s  （直到 #timeout 定时器到期，任务才被重新调度）
```

改成 `tokio::time::sleep(...).await` 后：

```
POST-START → POST-DONE = 163~177ms
hop2: "The tool returned exactly: `TIME=2026-11-16T09:00:00Z`"
```

清理诊断代码后又连跑两轮，均通过（`hop2 含结果: ✅`）。

> **踩过的流程坑**：验证脚本必须先把新构建拷进 runner（`target/crag-linux` →
> 实验目录的 `crag-linux`），否则测的是上一轮的产物。中间有几轮「同一份代码时通时不通」
> 就是这个原因，白排查了很久。凡是「改完没变化/结果跳变」，先查二进制时间戳。

**纪律**：内核里任何轮询/等待都不得用 `std::thread::sleep`；需要同步等待就丢进
`spawn_blocking`，否则会把整个 worker 占死，表现为「毫秒级的通道唤醒延迟到超时窗口」。

### 13.4 沙盒部署记录（192.168.1.x）

`vm-crag-01` 的运行时二进制是 `cli-home/.kin/crag-v2/crag-v2`（`kin-kernel` 只是个
`exec` 包装脚本，`kin-kernel.bin` 是厂商内核备份，都不参与运行）。热更新即替换该文件：

```sh
# 本机
cat target/crag-linux | ssh root@192.168.1.x 'cat > /tmp/crag-v2-new'
# 沙盒（宿主机是 busybox，没有 install/scp-server）
D=/opt/docker/vm2api/vms/vm-crag-01/cli-home/.kin/crag-v2
cp -a "$D/crag-v2" "$D/crag-v2.bak-20261117"
cp /tmp/crag-v2-new "$D/crag-v2"; chmod 755 "$D/crag-v2"; chown 10001:987 "$D/crag-v2"
docker exec kin-crag-01 "$D/crag-v2" --version   # 自检通过再重启
docker restart kin-crag-01
```

2026-11-17 部署 `sha256 9139d87f…`（4,700,920 B）。验证结果：

- `--version` → `2.1.321 (CRAG v2 native kernel; rust)`
- `/internal/health` → `ok/healthy true`、`engine rust`、`session_slots` 字段在
- `/run/kin/kernel.json` 已带 **`session_slots: 20`**（面板 3.1.4 下发），内核按此限流
- 面板 `/api/panel/vms` → `running`、`resolved_inference_engine: rust`、`crag_kernel_version: v2`
- `ready_slots` 45 秒内稳定为 1，容器 0 重启；`/v1/models` 200（非推理端点，不耗额度）

> 注意：`crag-v2/manifest.json` 里的 `sha256.crag-v2` 仍指向旧二进制。当前面板与内核都
> 不校验该字段（只有备份模块读 manifest），所以热替换可用；但若要重新走"包安装"流程，
> 必须用 `tools/selfsign-package.mjs` 重新签包，否则会被判为脏目录。

## 14. 出站身份按上游核对（2026-11-17，官方 CLI 2.1.321 实测）

抓法：让内核 TUI 跑官方 CLI，`ANTHROPIC_BASE_URL` 指向本地 stub（同网络命名空间，
`http://127.0.0.1:18082`），stub 落盘 `{url, headers, bodyRaw}`。

### 14.1 实测头（真实 CLI 发出的）

```
user-agent:                     claude-cli/2.1.321 (external, cli)
x-app:                          cli
x-stainless-lang/os/arch/runtime: js / Linux / x64 / node
x-stainless-runtime-version:    v26.12.1
x-stainless-package-version:    0.128.0
x-stainless-retry-count:        0
x-stainless-timeout:            600
anthropic-version:              2023-06-01
accept:                         application/json        ← 即使 body.stream=true
accept-encoding:                gzip, deflate, br, zstd
x-claude-code-session-id:       <uuid>
anthropic-dangerous-direct-browser-access: true
（**没有** x-client-request-id，**没有** x-claude-code-request-class）
```

system[0]：`x-anthropic-billing-header: cc_version=2.1.321.483; cc_entrypoint=cli;`
（四段版本 + 构建号；这条请求**没有** `cch=`）
system[1]：`You are Claude Code, Anthropic's official CLI for Claude.`
metadata.user_id：`{"device_id":"<64 hex>","account_uuid":"","session_id":"<uuid>"}`

### 14.2 我们改了什么

| 项 | 改前 | 改后 | 依据 |
| :--- | :--- | :--- | :--- |
| `VERSION`（`--version`/日志/health） | 2.1.303 | **2.1.321** | 包内 CLI 目录 `claude-code-2.1.321` |
| `x-stainless-package-version` | 0.74.0 | **0.128.0** | 实测 + 厂商 `WRAP_OFFICIAL_STAINLESS` |
| `x-stainless-runtime-version` | v26.3.0 | **v26.12.1** | 实测 |
| `x-stainless-timeout` | 不发 | **600** | 实测 |
| `accept` | 流式时 `application/json, text/event-stream` | **`application/json`** | 实测（SSE 由 body 决定） |
| `x-client-request-id` | 补 UUID | **删掉** | 实测官方 CLI 不发 |
| `IDENTITY` 系统串 | `You are a Claude agent, … Agent SDK.` | **`You are Claude Code, Anthropic's official CLI for Claude.`** | 实测 system[1] |

### 14.3 仍未对齐（不猜、只记录）

- **`cc_version` 第四段**：实测是 `2.1.321.483`（构建号）。我们只发三段，
  因为构建号无法从版本号推导；面板下发的 `cli_version` 也只有三段。
- **`accept-encoding`**：官方发 `gzip, deflate, br, zstd`，我们不发（内核不解压）。
  补上就必须实现解压，否则响应体是压缩的会解析失败。
- **`cch`**：厂商 JS 侧是占位 `00000`，官方真实值由 Bun 原生 HTTP 层按请求重写。
  我们沿用占位（与厂商一致）。
- **`x-claude-code-request-class`**：厂商 *wrap-cli* 会注入（`main`/`subagent`/…），
  但**官方 CLI 自己不发**。我们的 crag 路线不注入——若面板仍下发 `request_class`，
  那就是多出来的头，属于可识别的偏差，应置空。

## 15. 跟随上游 1.4.13x 的分支与部署纪律

上游已把整个 `native-slot/` 删除，我们的 Rust 内核因此是**纯新增**，不再需要跟着
老分支（落后 1100+ 提交、11 处冲突）走。

| 分支 | 用途 |
| :--- | :--- |
| `main` | 上游代码，只做 `git merge --ff-only origin/main` |
| `feat/cragv2-rs-main` | 从 `origin/main` 起，只包含 `native-slot/cragv2-rs/**` |

上游对内核的契约（1.4.131 核对）：

- 启动形态仍是 `<bin> --gateway-worker --config <json>`，配置仍带 `slots_per_worker`
  与 CRAG 3.1.4 新增的 `session_slots`；
- health 读的是 `health.capacity`（我们没有该字段时回退配置文件），`worker_version`
  仅作展示；`rust-kernel-client.mjs` 在本轮 128 个提交里没有改动；
- 槽位杀进程按 `*--gateway-worker*` 命令行匹配，我们被正确覆盖。

### 15.1 载荷树必须自洽（否则新版面板会拒绝重建槽位）

`verifyCragV2Tree()`（`src/lib/vm/wrap-cli-runtime.mjs`）校验的是**树内自洽**：
`manifest.sha256` 里每个文件的哈希必须与磁盘一致，且不允许有未列出的文件。
它不比对 `deploy/payload.json` 的官方 pin。

**而且必须改源树**：面板启动/重建槽位时会用
`share/crag/kernels/v2/amd64/` 重新解包覆盖 `vms/<slot>/cli-home/.kin/crag-v2/`
（实测：只改槽位目录，重启面板后内核被还原成旧包）。两处都要改：

```sh
SRC=/opt/docker/vm2api/share/crag/kernels/v2/amd64
SLOT=/opt/docker/vm2api/vms/vm-crag-01/cli-home/.kin/crag-v2
cp 新内核 "$SRC/crag-v2"; cp 新内核 "$SLOT/crag-v2"
# 两个 manifest.json 的 sha256.crag-v2 都要改成新哈希
```

所以热替换内核后，如果面板要重建/重装槽位，必须同步更新 manifest：

```sh
D=/opt/docker/vm2api/vms/vm-crag-01/cli-home/.kin/crag-v2
H=$(sha256sum "$D/crag-v2" | cut -d' ' -f1)
# 沙盒宿主机是 busybox，没有 python3：借面板容器里的 node 改 JSON
docker exec vm2api node -e 'const fs=require("fs");const p=process.argv[1];
const m=JSON.parse(fs.readFileSync(p,"utf8"));m.sha256["crag-v2"]=process.argv[2];
fs.writeFileSync(p,JSON.stringify(m));' "$D/manifest.json" "$H"
```

`crag-license.mjs` 只校验 issuer（`authorization.public_key_id`）与树完整性，
不读 `payload.plaintext_sha256`，因此改这一项不会破坏许可证判定。

### 15.2 面板升级实战（1.4.130 → 1.4.132）

两条踩坑记录：

1. **GHCR 的多架构标签可能缺失**。v1.4.132 的 release 工作流里
   `image-arm64` 任务失败，导致多架构 manifest 没生成——`v1.4.132` 标签 404，
   但 `v1.4.132-amd64` 存在。x86_64 机器直接用它：
   `VM2API_IMAGE_TAG=v1.4.132-amd64`。
   （另外 `latest` 标签滞后，实测停在 1.4.117，**不要用 latest 判断是否升级成功**。）

2. **升级后面板要调槽位内存，可能失败并杀掉槽位**。日志：

   ```
   [slot-capacity] memory_raise_failed vm-crag-01 {"want":"2g","code":"memory_diverged"}
   → kin-crag-01 Exited (137)
   ```

   已有容器带着旧的内存上限，原地 update 核验不过。恢复方式：删掉容器让面板按新配置重建。

   ```sh
   docker rm -f kin-crag-01
   # 用面板自己的入口重建（会重新解包源树、写入正确内存）
   curl -X POST -H "Authorization: Bearer $T" http://127.0.0.1:8787/api/panel/vms/vm-crag-01/start
   ```

   重建后 `docker inspect --format '{{.HostConfig.Memory}}'` 应变成目标值（实测 2147483648）。

## 16. 自建兑换码闭环（不依赖厂商授权服务）

我们用自己签的包，因此**授权链本身就在我们手里**：包内 `crag-license-public.pem`
是我们的 ed25519 公钥，`manifest.payload.key_id` 是我们的载荷密钥哈希。
只要用对应私钥签许可证，面板与槽位就会认。缺的只是"发行兑换码"这一环。

### 16.1 协议真值（读面板 `src/lib/vm/crag-license.mjs` 得到）

| 项 | 内容 |
| :--- | :--- |
| 兑换码 | `CRAGR1.<32 字节 base64url>`（43 字符），本身不携带信息 |
| 许可证 | `CRAGL1.<base64url(JSON)>.<base64url(ed25519 签名)>` |
| 签名对象 | `"CRAG-LICENSE-V1\0" \|\| JSON 原始字节` |
| 有效期 | `term ∈ {1m,3m,6m,1y}`，`expires_at` 必须等于 `calendarExpiry(issued_at,term)`（自然月进位） |
| 载荷密钥封装 | X25519 临时密钥 + HKDF-SHA256（salt=`payload_key_id` hex，info=`"CRAG-LICENSE-KEYWRAP-V1\0"`）+ AES-256-GCM（AAD=`${vm_id}\0${machine_id_hash}\0${device_public_key}\0${payload_key_id}`） |
| 机器码 | `CRAGM1.<base64url({version,product,vm_id,machine_id_hash,device_public_key})>` |
| 接口 | `POST {base}/resolve`、`POST {base}/redeem`；`base` 默认 `https://crag.fkcodex.com/v1/device-activation` |

### 16.2 我们的实现（`native-slot/cragv2-rs/tools/`）

| 文件 | 作用 |
| :--- | :--- |
| `license-authority.mjs` | 核心：读 keys、签 `CRAGL1`、封装载荷密钥、`calendarExpiry` |
| `activation-server.mjs` | 本地授权服务：`resolve`/`redeem`，一码一机、重放幂等、可吊销 |
| `mint-voucher.mjs` | 发码 / `--list` 查绑定 / `--revoke` 吊销 |
| `mint-license.mjs` | 离线兜底：拿 machine_code 直接出证，无需服务 |
| `test-authority.mjs` | 闭环自检：**用面板自己的 `verifyCragRegistration`** 验证我们签的证 |

面板侧只加了一处环境变量覆盖（零行为变更）：

```js
const DEVICE_ACTIVATION_URL =
  (process.env.CRAG_ACTIVATION_URL || '').trim().replace(/\/+$/, '') || 'https://crag.fkcodex.com/v1/device-activation'
```

### 16.3 自检与实测

```
✓ 面板验证通过 — valid          （到期 2027-11-17，1y）
✓ 载荷密钥 id 不匹配被拒 — license_payload_key_mismatch
✓ 换机器被拒 — license_binding_mismatch
✓ 篡改到期时间被拒 — license_invalid
✓ 过期后失效 — license_expired

服务端：resolve 200 device / redeem 200 replayed=false
        重放 200 replayed=true（同一张证）
        换机器 409 redeem_conflict / 错密钥 400 payload_key_unknown
```

要点：
- **重放必须返回逐字节相同的证**（面板会拿它和磁盘上的 `registration.code` 比对，
  重新签名会被判成 `license_redeem_target_changed`），所以服务端把首次签发的证存库复用。
- 离线路径与在线路径用的是同一个 `mintRegistration`，因此两边出的证完全等价。

### 16.4 沙盒部署配方（192.168.1.x，已于 2026-11-17 验证）

```sh
# 1) 工具与密钥（keys.json 就是 selfsign-package.mjs 的 --keys 产物）
D=/opt/docker/vm2api/data/crag-authority
mkdir -p $D/tools && tar xzf - -C $D/tools < tools.tar.gz
cp /root/lab-crag/keys.json $D/keys.json && chmod 600 $D/keys.json
printf '{"vouchers":{}}' > $D/vouchers.json && chmod 600 $D/vouchers.json

# 2) 常驻授权服务（host 网络，面板 127.0.0.1:8099 可达）
docker run -d --name crag-authority --restart unless-stopped --network host \
  -w /app -v $D:/data -v $D/tools:/app node:22-alpine \
  node /app/activation-server.mjs --keys /data/keys.json --store /data/vouchers.json --port 8099

# 3) 面板指向本地服务（.env）
CRAG_ACTIVATION_URL=http://127.0.0.1:8099/v1/device-activation

# 4) 面板代码里那 3 行补丁——镜像是上游构建的，必须挂进去：
#    /opt/docker/vm2api/docker-compose.override.yml
services:
  vm2api:
    volumes:
      - ./patches/crag-license.mjs:/opt/vm2api/src/lib/vm/crag-license.mjs:ro
```

发码 / 查绑定 / 吊销，以及离线出证：

```sh
docker exec crag-authority node /app/mint-voucher.mjs --store /data/vouchers.json --term 1y
docker exec crag-authority node /app/mint-voucher.mjs --store /data/vouchers.json --list
docker exec crag-authority node /app/mint-voucher.mjs --store /data/vouchers.json --revoke CRAGR1.…
node tools/mint-license.mjs --keys keys.json --machine-code CRAGM1.… --term 1y
```

面板兑换（脚本调用必须带 `Origin`，否则 `sameOriginPost` 直接 403）：

```sh
curl -X POST http://127.0.0.1:8787/api/panel/vms/vm-crag-01/crag-license \
  -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -H "Origin: http://127.0.0.1:8787" -H "Host: 127.0.0.1:8787" \
  -d '{"registration_code":"CRAGR1.…"}'
```

实测结果：`{"ok":true, license.status:"valid", term:"1y", expires_at:1826433861}`（2027-11-17），
许可证落到 `vms/vm-crag-01/run/crag-license/registration.code`（`CRAGL1.…`），
重启槽位后仍为 `valid`、内核 `healthy:true`。

### 16.5 宿主席位额度（面板里的“剩余可激活槽位”）

面板 `/api/panel/crag-subscription` 返回的 `available_seats` 就是它：

```
available_seats = slot_limit - used_slots
```

`slot_limit` 来自宿主授权 `CRAGH1`（签名域 `"CRAGH1\0"`，**同一个 ed25519 授权私钥**），
`used_slots` 来自授权服务的 `status` 响应。两者我们都能自建。

授权服务的 `POST /v1/host-subscriptions/{status,refresh}` 返回：

```json
{ "ok": true, "data": { "entitlement": "CRAGH1.…", "revision": 1, "expires_at": …, 
                        "used_slots": 0, "available_slots": 10, "reclaim_supported": false } }
```

面板侧需要 `CRAG_SUBSCRIPTION_ORIGIN` 指向我们（默认仍是厂商），同样用 override 挂补丁文件。

签发命令：

```sh
docker exec crag-authority node /app/mint-host-entitlement.mjs \
  --keys /data/keys.json --machine-id "$(tr -d '\n' < /etc/machine-id)" --slots 10 --days 365 \
  --out-dir /data/subscription
# 落盘：<data>/crag-subscription/public/{host_id,entitlement.code}
```

**三个必须同时满足，否则面板直接 `state: unavailable`**：

| 条件 | 踩坑 |
| :--- | :--- |
| `host_id` **恰好 64 字节** | 多一个换行就 `crag_subscription_storage_unavailable`（用 `tr -d '\n'` 或工具新版本） |
| `private/credential` 存在且 43 字节、600 权限 | 只有 `host_id` 没有 credential 会 `fail()` |
| `public`/`private` 目录权限 755/700、属主为面板进程用户 | `storage()` 逐项精确校验（`(mode & 0o777) !== mode` 直接失败） |

实测结果：

```json
{"state":"active","slot_limit":10,"used_slots":0,"available_slots":10,"available_seats":10,
 "activated_slots":[{"vm_id":"vm-crag-01","scope":"device","expires_at":1826433861}]}
```

槽位自己的设备许可（`scope: device`）不受影响，仍是 `valid`；内核 `healthy`。

### 16.6 跟进 1.4.133（2026-11-17）

上游 1.4.133 改了两处与我们相关的东西：

**① 内核遥测契约（必须跟）** — `rust-kernel-client.mjs` 新增
`verifyCragTelemetryPolicy()`，要求 `/internal/v1/telemetry/apply` 回：

```json
{"ok":true,"applied":true,"enabled":<请求值>,"scope":"native_claude_launch","upload_confirmed":false}
```

否则回 `409` 且 `error.type ∈ {telemetry_policy_not_published,
telemetry_native_settings_blocked, telemetry_restart_required}`；回 `telemetry_restart_required`
面板会排空并重启内核后再验一次。

我们的实现（`gateway.rs::telemetry_apply_response`）：

- `enabled:true` → 200 `applied:true`（我们本来就不干预官方遥测，动作在官方 CLI 自己那边）
- `enabled:false` → 409 `telemetry_native_settings_blocked`
  （**不伪造已应用**：关掉官方遥测本身才是可识别异常特征）

**② 面板补丁要按新版本重打** — 1.4.133 给 `crag-subscription.mjs` 加了 205 行，
我们挂载的是**整份文件**副本，直接用旧补丁会把上游改动回退掉。流程：

```sh
docker run --rm --entrypoint cat $IMG /opt/vm2api/src/lib/vm/{crag-license,crag-subscription}.mjs > /tmp/pw/
docker run --rm -v /tmp/pw:/w node:22-alpine node /w/patch.mjs   # 幂等，锚点缺失会报错
node --check 两个文件；再放 /opt/docker/vm2api/patches/ 并 compose up -d
```

> 踩坑：补丁里的 `.replace(/\/+$/, '')` 经 shell/heredoc 传递会丢反斜杠，变成 `//+$/`
> 的非法正则，面板直接 crash loop。改用字符类 `.replace(/[/]+$/, '')`，并**在容器里
> 跑 `node --check` 再上线**。

**③ `memory_raise_failed … memory_diverged` 是宿主限制** — 面板要求容器 swap 上限等于
requested memory，但该宿主 `docker info` 报 `WARNING: No swap limit support`，
Docker 只能把 `MemorySwap` 报成 `-1`，这个检查在这台机器上永远不满足。内存本身已按
2g 生效（`HostConfig.Memory=2147483648`），仅日志噪音。

实测（1.4.133 + 内核 `30d62ca7`）：

```
面板 VERSION 1.4.133（v1.4.133-amd64，注意多架构标签因 arm64 任务失败仍缺失）
available_seats: 10（自建宿主席位仍生效）
telemetry apply enabled=true  → 200 {"applied":true,"scope":"native_claude_launch",…}
telemetry apply enabled=false → 409
内核 health: worker_version 2.1.321, session_slots 1, healthy true
```

### 16.7 fork 工作流：上游合并 + 补丁文件化

部署形态固定为：**上游镜像 + 我们自己的内核与授权服务**。所以每次上游发版都要做三件事，
不能只 `docker pull`：

```sh
# 1) 跟上上游（main 只允许快进）
git checkout main && git merge --ff-only origin/main && cat VERSION

# 2) 内核分支 rebase（native-slot/ 在上游已删除，纯新增，永远零冲突）
git checkout feat/cragv2-rs-main && git rebase origin/main

# 3) 面板补丁按新版本重打（关键步骤）
IMG=ghcr.io/dofastted/vm2api:v<新版本>-amd64
mkdir -p /tmp/pw/src/lib/vm
docker run --rm --entrypoint cat $IMG /opt/vm2api/src/lib/vm/crag-license.mjs \
  > /tmp/pw/src/lib/vm/crag-license.mjs
docker run --rm --entrypoint cat $IMG /opt/vm2api/src/lib/vm/crag-subscription.mjs \
  > /tmp/pw/src/lib/vm/crag-subscription.mjs
docker run --rm -v /tmp/pw:/w -v $PWD/tools:/t node:22-alpine \
  node /t/panel-patches.mjs --root /w --write-patches /w/patches
cp /tmp/pw/src/lib/vm/*.mjs /opt/docker/vm2api/patches/   # 沙盒侧
```

`tools/panel-patches.mjs` 的设计要点：

| 点 | 原因 |
| :--- | :--- |
| 只做**单行替换 + 锚点断言** | 不整份覆盖，避免把上游新代码悄悄回退 |
| 幂等（有 marker 就跳过） | 重复执行不会叠加 |
| 锚点缺失即失败退出 | 上游改写该行时立刻暴露，而不是留下半成品 |
| 打完跑 `node --check` | 唯一能挡住面板 crash loop 的关口（正则转义丢反斜杠那次的教训） |
| `--write-patches` 从**当前文件**反推 diff | 补丁文件由实现生成，永不漂移；提交到 `patches/*.patch` 供审阅与 `git apply` |

`patches/0001-panel-activation-url.patch` / `0002-panel-subscription-origin.patch`
是这条流程的产物，已在原始上游文件上验证 `git apply` 干净通过。

### 16.8 跟进 1.4.136（2026-11-17）

上游 1.4.136 只有一个修复：`fix(crag): 在确定 thinking 后清洗采样参数`
（`go-worker-client.mjs` 在 `print` 路径调 `alignSamplingWithThinking(body)`，
`anthropic-policy.mjs` 的该函数 1.4.135 已存在）。

**对我们无影响**：改的是 Go worker 的请求组装，我们走 Rust 内核（TUI/native 模式），
内核不构建请求；`payload.json` 与 `rust-kernel-client/supervisor` 均未变 → **不重建二进制**。

面板补丁锚点在 1.4.136 文件上仍成立，`patches/*.patch` 内容未变（行号也没动）。

实测：

```
面板 1.4.136（v1.4.136-amd64）
订阅 active / available_seats 10
槽位 running；env 覆盖指向 127.0.0.1:8099
内核 30d62ca76eef791a（源树与槽位一致），--version 2.1.321
```

### 16.9 内核查漏补缺：能力探测泄漏、容量上限、配置精简（2026-11-17）

按上游 issue 与提交历史做了一轮对照审计，发现两处真实缺陷并修复。

#### ① `--license-capabilities` 未实现 → 子进程泄漏（已修）

面板 `vm-runtime.mjs:403` 用
`docker exec <slot> /home/kincli/.kin/crag-v2/crag-v2 --license-capabilities`
探测宿主订阅能力，期望**一行 JSON 后立即退出**。我们的 `parse_args` 把未知参数
静默忽略，于是这个探测变成"启动一个完整网关并永久阻塞"：

| 指标 | 修复前 | 修复后 |
| :--- | :--- | :--- |
| `crag-v2` 进程数 | **79** | 1 |
| `pids.current` / `pids.max` | **398 / 448（89%）** | 8 / 448 |
| 容器 `memory.current` | 61 MB | 1.7 MB |

进程状态全是 `S`（活着、阻塞），不是僵尸；父进程是执行 `docker exec` 的面板进程，
`sh()` 的 5 s 超时只杀了 exec 客户端，容器内进程留在原地。继续累积就会撞
`pids.max`，之后所有 fork 失败 → 502，与上游 issue #1080 的表现一致。

修法：
- 实现 `--license-capabilities` → 打印
  `{"host_subscription":0,"host_subscription_reclaim":0}` 并退出 0；
  报 0 与修复前面板行为**完全一致**（探测失败即不支持），不会顺手改变槽位准入逻辑。
  内核确实不参与席位回收，声明 1 属于伪造能力。
  **决策（2026-11-17）**：席位/`slot_limit` 属于厂商的商业配额（用户收费限制），
  本项目功能优先，不靠它放行——槽位用 device 许可 + 自建授权服务即可跑通全部功能。
  因此该值**永久保持 0**，不要视为待办；只有真要给多槽共享配额时才需要改。
- **未知参数一律报错退出（码 2）**，不再"带病启动"。这是根治：任何未来探测
  都不会再变成挂住的网关进程。

#### ② 缺物理容量校验 → 可能照配置开满会话（已修）

上游 issue #1179 / #1123：`session_slots` 超过物理容量时，厂商内核以
`crag-v2: session_slots exceeds physical capacity` **拒绝启动**，导致槽位反复重启、
阻断在线扩容。我们这边相反——只 `clamp(1,128)` 就照开，且与 `slots()` 的 20 上限
不一致，等于保留了 #1080 的 OOM 路径。

改成：`session_slots = min(配置值.clamp(1,20), cgroup 容量)`，
容量 = `memory.max / 256 MB`（读 cgroup v2 `memory.max`，回落 v1；读不到则不限制）。
**截断 + 单测**而不是拒绝启动：可启动性优先，配置超容属于控制面问题，不该让槽位瘫痪。

**基准点（上游确认）**：一个槽位跑满 CRAG（20 会话）约需 **5 GiB**，即每会话 ~256 MiB。
公式据此校准，不再额外留固定预留（内核空闲实测仅 1.7 MB，余量应留在每会话预算里，
否则 5 GiB 只推出 17 个会话，与上游结论对不上）：

| 容器内存上限 | 推导容量 |
| :--- | :--- |
| 512 MiB | 2（保底 1） |
| 2 GiB | 8 |
| **5 GiB** | **20（满配）** |
| 8 GiB | 20（受 `slots_per_worker` 上限约束） |

沙盒实测：把槽位 `--memory` 从 2 GiB 提到 **5 GiB**（`docker update --memory 5g`，
上限不是预留；宿主 7.8 GiB、无 swap，仍余 7.2 GiB），容器内 `memory.max=5368709120`，
内核 `healthy`。注意**提高上限不等于提高并发**——并发仍由面板写的
`session_slots` / `slots_per_worker` 决定，容量只负责"不许超过物理可能"。

#### ③ 配置面盘点：只有两个旋钮真正影响内存

| 旋钮 | 作用 | 建议 |
| :--- | :--- | :--- |
| `slots_per_worker` | 常驻 CLI 进程上限 = **峰值内存 = N × ~280 MB** | 保留，唯一容量旋钮 |
| `session_idle_ttl_seconds` | 空闲 CLI 存活时长（默认 600 s，为 prompt cache 保留） | 保留，第二个内存杠杆 |
| `session_slots` | 与 `slots_per_worker` 面板侧已 `min()` 成相等 | 可合并，见下 |
| `tool_timeout_seconds` / `claude_bin` / `provider` / `cli_version` | 不涉及内存 | 保留 |

**结论：可以精简成一个容量旋钮。** 面板 `writeKernelConfig` 已经保证
`session_slots = min(requested, slots_per_worker)`，内核再读两个键属于重复；
保留 `min()` 兼容老配置即可，新配置只写 `slots_per_worker`。

#### ④ "用系统原生机制划分服务"能不能省内存？—— 不能，省的是爆炸半径

- 内存由官方 CLI 进程本身决定（上游实测 ~280 MB/会话，#1092），划分方式不改变它。
- 我们的内核**没有 prewarm**（不做预启动），空闲时容器只有 1 个 1.7 MB 的进程，
  这已经是最省的形态；真正的浪费来自"常驻不回收"，由 TTL 控制。
- 每会话一个 cgroup v2 子树（或 systemd transient scope）的收益是：
  OOM 只杀该会话、`pids.max` 按会话隔离、内存计量变真实。
  代价是多一层 cgroup 管理与代码。**只有出现级联 OOM 才值得做**；
  当前 `slots_per_worker=1`、容器 2 GiB、容量上限 5，没有这个必要。
- 反过来，"把内核拆成多进程/多容器"会增加常驻内存（每个进程一份运行时），不建议。

#### ⑤ 上游 issue 对照（我们是否需要跟）

| issue | 上游结论 | 我们的状态 |
| :--- | :--- | :--- |
| #1080 512m/256 pids 装不下 20 会话 | 按套餐配槽数/内存/pids | 已由 ② 的容量截断覆盖 |
| #1123 / #1179 `session_slots` 超容量 | 面板侧 `min()` + 内核拒绝启动 | 我们改为截断（更稳） |
| #1092 按主机内存压力准入 | 面板侧 `host-memory-pressure.mjs` | 面板已有，内核无需参与 |
| #1122 包信任缓存，避免每槽重校验 | 面板侧缓存 | 与我们内核无关 |
| #965 内存提升改异步 | 面板侧 | 我们沙盒的 `memory_diverged` 是宿主无 swap 限制，非此项 |
| #739 对话结束释放 session 槽 | 池化回收 | 我们 `TuiPool` LRU + TTL 已覆盖 |

### 16.10 程序级优化：transcript 轮询改成增量尾读（2026-11-17）

`answer_after()` 在等 TUI 回合结束时每 150 ms 轮询一次 transcript，原实现每次
`std::fs::read_to_string` 整份文件，再对**每一行**做 `serde_json::from_str`。
短会话看不出来，长上下文是灾难——1M token 的 transcript 有几十 MB。

实测（`tests/transcript_tail.rs::bench_incremental_scan`，30.0 MB / 264,347 行）：

| 实现 | 每轮轮询耗时 |
| :--- | :--- |
| 旧：整读 + 逐行全量解析 | **1,358,488 µs（≈1.36 s）** |
| 新：首次全扫（一次性） | 1,656,079 µs |
| 新：之后每轮（无新增字节） | **1 µs** |

后果不只是慢：单 worker Tokio 运行时上，每轮阻塞 1.36 s 会把**所有**其它任务
（MCP 工具回包、SSE keepalive）一起饿住——和之前 120 s 卡顿是同一类事故，
只是这次的触发条件是"上下文越长越严重"。

改法（`tui.rs::scan_transcript`）：

- 每份 transcript 记 `offset` / `carry`（未以换行结尾的残行）/ 两个计数，
  只 `seek` 到 `offset` 读新增字节，O(新增) 而非 O(文件大小)。
- **一次解析喂两个口径**：`count_text_answers` 与 `count_finished_assistant`
  原来是两遍独立的全量解析，现在共用同一次逐行解析。
- 便宜的前置过滤：整行不含 `assistant` 直接跳过，绝大多数行是 user / tool_result。
- 文件长度回退（CLI 换会话重写）时自动重置缓存，避免计数永久偏高。
- 对外 API 不变，调用点零改动。

回归测试 `tests/transcript_tail.rs`（4 项）：追加可见、残行不计入、截断重置、
重复轮询稳定。

### 16.11 取答案不再读文件：扫描时记住最后一条回答（2026-11-17）

`transcript_answer_file` 原本每轮结束整读一次 transcript 再做**反向逐行**扫描。
一个自然的想法是"只从尾部反向读固定窗口"，**这是错的**，不能用：

- JSONL 一行 = 一条消息，单行可达几十 KB 到 MB 级，固定窗口可能切成半行；
- 合格回答离文件尾可能隔着几百轮工具调用，尾部往往是 `tool_result`；
- 极端情况下窗口里连一条完整候选记录都没有 → **漏信息**。

正确做法是**根本不读文件**：增量扫描（§16.10）既然已经逐行解析，就顺手记住
最后一条合格回答（`TailScan::last_answer`），取答案变成 O(1) 查表。
首次调用仍会把已有内容整体解析一遍（一次性代价），之后只读新增字节。

顺带把口径统一成一份 [`answer_message`]：`stop_reason` 已定、不是 `tool_use`、
`content` 里没有 `tool_use` 块、且含 `text`。原实现里计数用一套（宽松）、
取答案用另一套（严格），会出现"计数涨了但取到的是上一轮答案"的潜在错配。

内存边界：缓存每个 transcript 只留一条回答，并且有条目上限（64）与空闲清理
（1 小时）；会话被摘除时可调 `forget_transcript()` 立即释放。

回归测试（`tests/transcript_tail.rs`，共 6 项）：

- `answer_far_from_tail_is_still_found`：回答之后堆 200 轮工具调用 + 一条 1 MB
  的 `tool_result`，仍必须取到那条回答（专门证伪"尾部窗口反读"）；
- `no_answer_in_file_returns_none`：只有工具轮次时不能凭空返回；
- 追加可见 / 残行不计入 / 截断重置 / 重复轮询稳定。

**剩余的同类热点**（尚未处理）：

| 位置 | 现象 | 建议 |
| :--- | :--- | :--- |
| `gateway.rs:999` | 失败路径整读 `screen.log` | 只读尾部 N KB（同样是日志，非 JSONL） |
| `emit_transcript_message` | 会把整个 message `Value` 克隆一次 | 按需借用/取子字段 |

### 16.12 禁止静默降级（2026-11-17）

真机验证时暴露：**通路会悄无声息地变成另一种**，行为变了却没有任何报错。三处一并修掉。

**① 键名写错 → 静默回退 `direct`**

`upstream_mode` 是唯一决定 hop 的键。写成 `hop_mode` / `transport` / `hop` 时，
内核拿不到值就默认 `direct`（自己拼请求），只有一行日志容易漏看。

现在 `KernelConfig::validate()` 在启动时硬校验：

```
[crag] config: 配置里有 "hop_mode"，但内核只认 "upstream_mode"（native / tui / direct）；拒绝启动，避免静默回退到 direct
退出码 = 1
```

`upstream_mode` 取值也校验（拼错同样报错）。启动日志额外打印来源：
`hop mode = native（来自 provider=local_cli）` / `…（未配置，使用默认值）`。

**② 面板写 `provider: "local_cli"` 被完全忽略**

面板表达"让槽内官方 CLI 发包"用的是 `provider: "local_cli"`（并附 `claude_bin`）。
早期实现只看 `upstream_mode`，于是这类槽位**静默跑成 direct**——内核自己发请求，
而面板指定的官方 CLI 从未启动过。这不仅违背"内核不构建请求"的既定决策，
也让出站形态与官方不一致。

现在 `effective_mode()`：显式 `upstream_mode` 优先，否则 `provider == local_cli`
归一为 `native`。并新增矛盾校验：`upstream_mode=direct` + `provider=local_cli` 直接报错。

**③ `claude_bin` 被解析但从不使用**

`cli_bin()` 只看 `cli_bin` / `$CRAG_CLI_BIN` / `claude`（PATH）。面板写的绝对路径
`claude_bin` 被忽略，而容器里通常没有 `claude` 在 PATH 上 → native 通路一 spawn 就失败。
现在按文档语义排序：`claude_bin` → `cli_bin` → `$CRAG_CLI_BIN` → `claude`。

**沙盒实测（1.4.136 面板 + 内核 `a9a1b90a`）**

```
[crag] hop mode = native（来自 provider=local_cli）
[crag] hop mode: native cli -> /home/kincli/.kin/crag-v2/claude-code-2.1.321/claude
[crag] 2.1.321 listening on /run/kin/kernel.sock (dataplane=crag)
health: hop_mode="native"  ← 修复前这里是 "direct"
```

单测覆盖：键名笔误报错、`upstream_mode` 拼错报错、`provider=local_cli` 归一为 native、
`direct` 与 `local_cli` 矛盾报错、`claude_bin` 优先于 `cli_bin`（共 160 项通过）。

### 16.13 实测：1M 上下文与压缩的真实内存开销（2026-11-17）

用中转（`https://cf.api.fan`）+ 官方 CLI `2.1.321` 直连，模型 `claude-haiku-5-5`，
同一会话逐轮追加 150 KB 填充（`a` 重复串 ≈ 1 token/字符），观测上下文与内存。

| 轮次 | 总上下文 (tokens) | 新增 | 命中缓存 | 容器内存峰值 |
| :--- | ---: | ---: | ---: | ---: |
| t1 | 167,169 | 167,167 | 0 | 126 MB |
| t2 | 267,348 | 100,179 | 167,167 | 103 MB |
| r1 | 417,456 | 150,110 | 267,346 | 129 MB |
| r2 | 567,582 | 150,126 | 417,456 | 105 MB |
| r3 | 717,664 | 150,082 | 567,582 | 105 MB |
| r4 | 867,763 | 150,099 | 717,664 | 110 MB |
| **r5** | **167,926** | 154,295 | 13,631 | **124 MB** ← **压缩发生** |
| r6 | 318,102 | 150,176 | 167,926 | 104 MB |
| r7 | 468,233 | 150,131 | 318,102 | 145 MB |

transcript 里出现 `"isCompactSummary":true` 与 `compact_boundary` 各 1 次（145 行 / 3.1 MB）。

**结论一：压缩在 ~1.0M token 窗口处触发。** 第 4 轮 867 K，再加 150 K 必然超过 100 万，
CLI 选择压缩而不是报错——上下文从 **867 K 塌回 168 K**（摘要 13.6 K + 新消息）。

**结论二：压缩几乎不额外吃内存。** 压缩轮峰值 124 MB，与普通轮次（103–145 MB）同一区间。

**结论三：上下文长度本身不是内存来源。** 上下文从 167 K 涨到 867 K（5 倍），
峰值内存 126 → 110 MB（反降）。原因：`-p` 模式每轮是新进程，历史存在磁盘 transcript 里
（3.1 MB / 145 行），请求体拼完即释放，不常驻 JS 堆。

> 因此先前"1M 上下文 ⇒ 0.6–2 GB"的估算不成立，按实测撤回。
> 真正需要单独量的是**长驻进程**场景（TUI / stream-json 常驻会话），
> 那是历史留在进程内存里的形态；本文的 one-shot 数据不能外推过去。

**附带发现**（与内核相关）：内核对同一 `x-claude-code-session-id` 的两次请求
**不会累积历史**（第 2 轮模型答"这段对话里没有上一轮的内容"）。
`native.rs::last_user_content` 的注释写"会话由 CLI 自己维护"，但实测 CLI 并未维护，
所以 native 通路目前是"每轮独立"。这也是 `provider: local_cli` 暂不自动切换为
native 的原因（见 §16.12），已改为启动时显式告警。

### 16.14 直连形态：内核对外暴露 TCP + 标准认证头（2026-11-17）

临时形态（中转供货）需要**本地 Claude Code 直连槽位**，而内核原本只监听 UDS，
且认证只认 `x-kin-internal-token` —— 标准 Anthropic 客户端两样都满足不了。

改动两处：

1. **认证头别名**：`authorized()` 除 `x-kin-internal-token` / `x-internal-token` 外，
   也接受 `x-api-key` 与 `Authorization: Bearer <token>`，
   这样 `ANTHROPIC_API_KEY` 直接填内核 token 即可（单测 `accepts_standard_anthropic_auth_headers`）。
2. **可选 TCP 监听**（配置 `tcp_listen: "0.0.0.0:18787"`，默认关闭）：
   TCP 连接**字节级桥接**到内核自己的 UDS（`copy_bidirectional`）。
   没有让 TCP 复用 handler 的原因是 `Stream` 在 Unix 下就是 `UnixStream`，
   handler 全链路按它写死；桥接不动任何请求逻辑，也不需要条件编译。

链路（临时形态）：

```
本地 Claude Code → http://<宿主>:18787 → (DNAT) → 容器 bridge IP:18787
   → 字节桥接 → /run/kin/kernel.sock → 内核(native) → 官方 CLI → 中转
```

实测：

```
宿主 → 容器 IP:18787（x-api-key=内核 token）→ message_start，model=claude-haiku-5-5 ✔
另一容器 → 192.168.1.x:18787/internal/health → 401（DNAT 生效，缺 token）✔
```

**已知限制（临时形态可接受，转为真实账号后应重新评估）**：

- native 通路不续传历史（§16.13），多轮对话会丢上下文；
- 绕过面板的配额/统计/多槽调度，仅适合单槽自用；
- 容器 `bridge` 网卡是手工附加的，面板重建容器会丢失；
- `tcp_listen` 写在内核配置里，DNAT 规则在 iptables 里，两者都不随面板迁移。

### 16.15 修复：native 通路多轮失忆（移植 vendor 的 renderInitialPrompt）（2026-11-17）

**根因**（三处叠加，缺一不成立）：

1. `native::last_user_content()` 只取最后一条 user 消息；
2. spawn 参数带 `--no-session-persistence`，CLI 既不读也不写会话；
3. 于是客户端发来的 `messages`（完整历史）被整段丢弃，模型每轮只看到一句话。

**上游怎么做的**（`.tmp/cragv2/legacy/share/crag-v2/gateway/v2-runtime.mjs`）：

```js
function renderInitialPrompt(body, prompt) {
  const lastUser = [...messages].reverse().find(m => m?.role === "user");
  const history  = messages.slice(0, messages.lastIndexOf(lastUser));
  const renderedHistory = `<conversation_history>…</conversation_history>`;
  return `${instructions}${renderedHistory}<current_turn>${current}</current_turn>`;
}
```

即：**把历史渲染进 prompt**，每轮发一条自包含的完整 prompt。
正因如此，`--no-session-persistence` 在上游是合理的——历史不依赖 CLI 保存。
另有分支：请求里带 `tool_result` 时按 `continuationFingerprint` 匹配挂起的工具调用，
只回填结果、不重发历史。这一分支我们已由 MCP park/resolve 覆盖。

**移植**（`native::render_initial_prompt` + `render_message`/`render_content`/`render_block`）：

- 历史 → `<conversation_history>`，每条按 `[role]` 前缀；
- `tool_use` → `[tool call <name>]` + input JSON；
- `tool_result` → `[tool result <id>]` + 内容；
- 未知块 → `[unsupported content block: <type>]`（与上游同形）；
- 最后一条 user 包进 `<current_turn>`。
- **TUI 路径同样切换**（此前只拼最后一条的 text 块，同样会失忆）。

**验证**（经 TCP 端点、模型 `claude-haiku-5-5`）：

```
请求 messages = [user: 请记住暗号 ORANGE-4271, assistant: OK, user: 暗号是什么]
回答 = ORANGE-4271   ✔
```

修复前同样的两轮形状会答"这段对话里没有上一轮的内容"。

单测：`render_initial_prompt_carries_history`（历史包含且本轮不重复）、
`..._without_history_is_just_current_turn`、`..._renders_tool_blocks`（共 163 项通过）。

### 16.16 对照实测：内核路径下历史带来的内存增量（2026-11-17）

修好历史渲染（§16.15）后必须回答一个问题：把 400K tokens 历史塞进单条 prompt，
内存到底涨多少？同一槽位、native 通路、模型 `claude-haiku-5-5`，两轮对照：

| 轮次 | 上下文 tokens | 内核 RSS 峰值 | CLI RSS 峰值 | 容器峰值 |
| :--- | ---: | ---: | ---: | ---: |
| baseline（无历史） | 14,658 | **5 MB** | 174 MB | 103 MB |
| history400k | 417,196 | **7 MB** | 181 MB | 118 MB |
| 增量 | +402K | **+2 MB** | **+7 MB** | +15 MB |

即 **每 100 万 tokens 历史 ≈ 内核 +5 MB、CLI +18 MB、容器 +37 MB**。

推论：

- 之前"1M 上下文 ≈ 50–100 MB 在途开销"的估算**偏高**：单条长字符串的
  `serde_json::Value` 开销并不大（大字符串是连续缓冲，不是 10× 的对象树）。
  真实会话里块结构更多，可按 2–3 倍保守估计，仍是几十 MB 而非 GB 级。
- **内存几乎与上下文长度无关，而与并发会话数线性相关**：每个 CLI 进程
  固定 ~174 MB（system prompt + tools + 运行时），这才是容量的主项。
- 因此容量规划：`并发上限 ≈ 容器内存 / 200 MB`，上下文长度只影响个位数百分比；
  长上下文真正昂贵的是**上游 token 计费**，不是本地内存。

> 注意口径：本表是"单条大字符串"的填充历史；真实 transcript 含大量
> `tool_use` / `tool_result` 块，`Value` 树开销会更大，故给出 2–3 倍余量。

### 16.17 工具执行位置：容器内建工具 vs 回传客户端（2026-11-17）

现象：本地 Claude Code 通过 native 通路问"分析我的仓库"，模型却在容器里 `ls`，
看到 `/home/kincli`，完全读不到用户磁盘。

**实测确认原因**：native 分支没有禁用槽位 CLI 的**内建工具**。客户端带来的 `Bash/Read`
被映射成 MCP 工具，但模型调用 `Bash` 时 CLI 解析到自己的内建 Bash，**在容器里执行**。
证据（带 `Bash` 工具定义请求一条）：

```
修复前： 事件含 tool_use，最终文本 = "/home/kincli"   ← 容器内执行
```

上游的处理见 `v2-runtime.mjs` TUI 分支：`--permission-mode default --tools ""`
（清空内建工具，只留 MCP）。我们此前因"空工具表触发中转 403"而整个去掉了该开关。

**修复**：仅当客户端确实带了工具时传 `--tools ""`（空表场景不加，避免 403），
只保留 MCP 工具。修复后同一条请求：

```
修复后： 无 "/home/kincli"，stop_reason = "tool_use"   ← 不再在容器内执行
```

**但仍有缺口**：此时响应只含 `thinking` / `text` 块，**没有 `tool_use` 块**，
客户端拿不到可执行的工具调用。也就是说"容器内执行"被止住了，但"回传客户端执行"
这条链还没接完——需要修 MCP park → tool_use SSE 的产出。

对比：`cli-node` 数据面是纯转发（客户端自己的 CLI 执行工具），所以它天然没有这个问题；
crag v2 必须由内核把客户端的工具转成 MCP 再回传，这条回路不完整就会表现为"工具消失"。

### 16.18 工具回传：三轮实测与当前卡点（2026-11-17）

目标：native 通路下，客户端（本地 Claude Code）带的工具必须**回传客户端执行**，
不能落到容器的内建 Bash/Read 上。

| 尝试 | 结果 | 结论 |
| :--- | :--- | :--- |
| 原样（不禁内建） | 文本 `/home/kincli` | 内建 Bash 在容器里执行 ❌ |
| `--tools ""`（vendor TUI 写法） | 无容器路径，但 `stop_reason=tool_use` 且**无 tool_use 块** | `--tools ""` 把 MCP 工具也清掉了，park 永不发生 ❌ |
| `--disallowedTools <客户端工具名>` + 系统提示说明 `mcp__crag__*` | `end_turn` 纯文本，模型未调用任何工具 | 模型没有把裸名映射到 MCP 工具 ❌ |

已验证正常的部分：

- MCP 配置写出正确：`mcpServers.crag.command = crag-v2 mcp-bridge --config …bridge.json`
- 桥二进制在容器内可独立运行：`[crag-mcp] 1 tools -> http://127.0.0.1:…/_crag-v2/mcp/<session>`
- 内核侧 park → `tool_use_sse` 合成分支存在（TUI 路径已用），native 路径也补了结尾 `pending_calls` 兜底

### 最终定位：四个独立缺陷叠在一起

| # | 缺陷 | 证据 | 修法 |
| :-- | :--- | :--- | :--- |
| ① | MCP 配置缺 `"type":"stdio"` | 加 type 后 CLI 工具表才出现 `mcp__crag__Bash` | `mcp_configs()` 补 `type`，加单测断言 |
| ② | `--tools ""` 被当成**工具规格** | 实测工具表变成乱码 `mcp__g__3615150`，且 MCP 服务器不加载 | 永不使用；改 `--disallowedTools <客户端工具名>` |
| ③ | MCP 工具在 print 模式**未授权** | 模型原话"返回了权限错误，提示尚未授权" | 加 `--allowedTools mcp__crag` |
| ④ | park 随 CLI 退出而消失 | 续跳 409 `wrong slot` / 410 `unknown tool_result` | 续跳失败**退回带完整历史的新跳**，不再报错 |

另外：print worker 的 system 必须**替换**（`--system-prompt`）+ 自己的 persona，
在 persona 里声明"工具以 `mcp__crag__<Name>` 提供"，否则模型按客户端 system 的裸名 `Bash`
去调内建工具，又回到容器里执行。

### 端到端验证（.67 槽位）

```
hop1  → {"type":"tool_use","id":"crag_tool_30310bf5_...","name":"Bash"}   容器路径泄漏：0
hop2  → 最终答案 = /Users/lemon/project（客户端返回的工具结果）            容器路径泄漏：0
```

流程：模型调 `mcp__crag__Bash` → 内核合成 `tool_use` 回投客户端 → 客户端本地执行 →
回传 `tool_result` → 内核续跳（park 活着就复用，否则重开一跳）→ 最终答案。

### 16.19 ESC 打断后无法继续对话（客户端中断的会话复用）

**现象**：CC 里按 ESC 打断，之后新消息发不出去（客户端一直转圈）。

**根因**：会话池用「`live.turn` 里有没有 sender」表示是否空闲。ESC 只断开了**客户端的连接**，
CLI 进程仍在跑上一轮；`pool.turn()` 看到会话存在就直接复用，把新的 sender 覆盖上去。
后果是：旧轮的 `result` 帧被送进**新请求**的接收端（串味），而 CLI 还在忙旧轮，
新消息排在后面永远等不到 → 表现为卡死。

**修法**：`turn()` 在复用前检查该会话是否还有一轮没收尾；有就**杀掉换新进程**。
我们每一跳都渲染完整历史，换进程不改变语义，所以这是安全的。
同时覆盖了断连、重复提交、park 被遗弃这几种"上一轮没收尾"的情形。

**实测**（同一 session id：先 2 秒强杀模拟 ESC，立刻重发）：

```
改前：新请求挂到 HOP_TIMEOUT(180s) 才失败
改后：200 + "ok"，49s（其中约 23s 是新 CLI 冷启动；页缓存热了之后新会话只要 3s）
```

**遗留**：ESC 只是让下一条消息变慢（要重开 CLI），并没有把"打断"这件事更早地传播到内核——
内核是在**下一条请求到达时**才发现上一轮烂尾的。若要更快，需要在内核侧探测到客户端断连
（写 SSE 返回 Broken pipe）时就地取消会话。

### 16.20 会话复用与 prompt cache 的实测（纠正"token 会重新计一遍"）

**结论先行**：不必须复用 CLI 会话；缓存是**服务端按前缀**命中，换进程不丢。
之前说"ESC 后 token 会重新计一遍"是错的，实测如下。

同一 session id 连打三跳（每跳重渲染全量历史）：

| 跳 | cache_creation | cache_read | 耗时 |
| :-- | --: | --: | --: |
| turn1 | 17167 | 0 | 23s（CLI 冷启动） |
| turn2 | 3339 | **13921** | 1s |
| turn3 | 147 | **17235** | 2s |

全新 session id（新进程）但**消息体相同**：`cache_creation=17215, cache_read=0`
→ 缓存不是纯内容键，还带会话分区（`metadata.user_id`）。

真实 ESC 场景（同 session id：A 建缓存 → B 2 秒强杀 → C 立刻续，触发换进程）：

```
A  creation=17177 read=0
C  creation=265   read=17252   2s     ← 缓存完整命中，只新增 265 token
```

所以 ESC 的代价只有"重开进程的启动时间"（热态 2s、容器刚起时冷启 23s），
**没有**重复计费：重复的输入按 cache read 计（约 1/10 价）。

**因此不复用 CLI 会话**：上游 print worker 也是每轮一个新 `--print` + `renderInitialPrompt` 渲染全量历史，
会话状态留在内核侧。复用有状态进程反而会让 CLI 自己再累加一份历史（重复上下文），
还会把上一轮烂尾的输出串进新请求（§16.19 的 bug）。

**缓存会被打破的情形**（写死在这里，避免以后踩）：
- 换 `metadata.user_id.session_id`（客户端换会话 → 冷缓存，符合预期）
- prompt 前缀里塞了易变内容（时间戳、随机 id、遥测 token）——persona 与历史渲染必须保持稳定

### 16.21 中转 403「疑似蒸馏」的成因与纪律（自我检讨）

**现象**：中转返回 `403 您的请求疑似不合理，已触发我们的反滥用机制，这意味着您的请求被我们判定为蒸馏请求`。
过了一会儿普通请求恢复正常（实测 200），属于**告警式冷却**，不是封号。

**触发的流量长什么样**（都是本次调试我自己打的）：

- 同一个 prompt（"只回复 ok 两个字母"）在几分钟内重复几十次
- 每次都换新的 `metadata.user_id.session_id`（→ 每次 `cache_creation≈17k`、`cache_read=0`）
- `max_tokens` 压到 16/32/64，与 17k 的输入形成"大进小出"
- 密集连发（同一秒几十条），中间夹着 2 秒强杀的中断请求

这四条合起来正好是**蒸馏采样**的典型特征：同一输入反复采样、极小输出、批量新会话。

**纪律（以后必须遵守）**：

1. **行为类测试一律打本地桩**（`native-slot/.tmp/lab/stub-upstream.mjs`），不打真实中转。
   真实中转只用于最终确认，一次一条。
2. 测缓存/会话/淘汰这类需要"换 session id"的实验，**只对本地桩做**；
   真实中转上换会话 = 冷缓存 + 蒸馏特征，双输。
3. 真实请求用**真实内容**（正常长度的提问与回答），不要"只回复 ok"这类占位 prompt。
4. 不要在短时间内连发；需要多次验证时穿插真实对话，或隔开时间。
5. 一次只打一条，且只在最后确认阶段打（与项目记忆里"真实请求只走 vm-02、一次一条"一致，
   这次是我在 .67 上违反了自己的规矩）。

**代价**：中转方若再判定一次，可能升级为账号级限制；这个账号是用户的付费通道，不该被我的探针消耗。

### 16.22 跟进上游 1.4.142（沙盒 .67）

**结论**：仅生成 1.4.139 的健康判定契约要补一个字段；其余无需动内核。

| 项 | 变化 |
| :--- | :--- |
| 版本 | `main` 1.4.136 → **1.4.142**（ff-only，7 个 tag） |
| 载荷 | `payload-2026.11.18-crag-3.1.5`（CRAG 3.1.4 → 3.1.5） |
| CLI | 仍是 `claude-code-2.1.321` → **出站身份不变**，无需改 UA/客户端版本 |
| `/internal/*` | 无新增/变更 |
| 面板侧 | `convert.mjs` / `handle-protocol.mjs` / `go-worker-client.mjs` 等大改，属请求组装，内核不做请求 → 不处理 |
| 健康判定 | `rust-kernel-supervisor.mjs`：`cli_pid > 0 \|\| health.execution_mode === 'v2_process_pool'` |

**唯一内核改动**：`/internal/health` 增报 `"execution_mode": "v2_process_pool"`（native 模式）。
原生模式空闲时本就没有 CLI 进程（`cli_pid: null`），不报这个字段面板会认为内核没起来、反复重启槽位。

**补丁锚点**：`crag-license.mjs` / `crag-subscription.mjs` / `docker-slot-memory.mjs` 三个锚点全部命中，
补丁内容与 1.4.136 完全一致（`git diff patches/` 为空，行号未变）。顺手修了
`tools/panel-patches.mjs` 里 0003 的 `to` 字段——之前 heredoc 把 `\n` 吃成了真换行，工具本身语法错误跑不起来。

**部署（.67 特有）**：docker daemon 连不上 GHCR（EOF）→ 本机 `docker pull` 后
`docker save | gzip | ssh 'gunzip | docker load'`（1.65GB，41 秒）。升级面板后
厂商载荷会覆盖 `share/crag/kernels/v2/amd64/crag-v2`，需重新投放我们的二进制 + 两个 manifest。

**验证（本地，不打真实推理）**：

```
面板 VERSION           1.4.142            ✔
面板 /                 200                ✔
槽位 vm-crag-01        running            ✔
env 覆盖               CRAG_ACTIVATION_URL / CRAG_SUBSCRIPTION_ORIGIN → 127.0.0.1:8099  ✔
内核两侧哈希          448c85fe（源树 = 槽位）                                    ✔
/internal/health       healthy:true, execution_mode:v2_process_pool, cli_pid:null ✔
```

**未解决的：宿主席位（available_seats=0）**

面板的宿主身份走 `/run/crag-host-machine-id`，且要求该挂载的 **statfs 类型** 在
`SHARED_HOST_ID_FILESYSTEMS`（NFS/FUSE 等共享 fs）白名单里；`.67` 根分区是 ext4，
bind mount 会被 `readOnlySharedHostId()` 直接拒掉 → 身份不可用 → 席位恒为 0，
订阅状态停在 `unredeemed`（不影响已有设备授权的槽位，有效期到 2027-11）。

试过用 `mint-host-entitlement.mjs` 以宿主 machine-id 直接落盘，结果订阅变成
`state:"unavailable"`（面板自算的 host_id 与我们的不一致，校验抛异常）。已回滚到
`unredeemed` 基线。**要恢复 10 席位，得让面板自己能算出 host_id**（给它挂共享 fs 上的
machine-id），而不是从外面塞文件。

### 16.23 中转 403「疑似蒸馏」二次出现 → 自行恢复（含抓包开关）

**经过**：§16.21 之后又一次出现，用户侧表现为 **100% 被拦**（客户端里直接看到那段中文），
链路是同一条（CC → 内核 :18787 → cf.api.fan），模型 haiku-5-5。约半小时后**自行恢复**。

**排除掉的**：

| 怀疑 | 证据 |
| :--- | :--- |
| 我们自己的 vm2api 面板拦的 | 面板确有 `src/lib/core/distill-detect.mjs`，但那段中文在整个仓库搜不到；vm2api 用 `distill_blocked` 另一套措辞 |
| 链路/账号级封禁 | 同链路同模型，我并发期间的 curl 请求全部 200（haiku 4s / 多轮+工具 4s / sonnet 3s） |
| cf.api.fan 是我们自己的面板 | 根路径与 `/api/panel/*`、`/VERSION` 全 404，Cloudflare 前置，是第三方中转 |

**结论**：是**中转侧的时间窗口式判定**，不是账号封禁也不是我们的实现问题——被判到之后一段时间内
一律 403，窗口过去自动恢复。

**留下了诊断开关**（默认关闭，不产生任何行为）：

```
存在 /tmp/crag-dump-on  或  环境变量 CRAG_DUMP=1
→ 把每个 /v1/messages 的原始 body 与请求头写到 /tmp/crag-req-<ms>.json 与 /tmp/crag-hdr-<ms>.json
```

复发时用它抓一份真实请求，与"能通过的等价请求"逐项比对：
system 内容/体积、tools 数量与 schema 体积、渲染后 prompt 体积、`metadata.user_id` 形态、
请求头（anthropic-beta / x-app / UA）、`max_tokens` 与 thinking 配置、总体积。
**抓完立刻 `rm -f /tmp/crag-dump-on`**（请求体含用户内容）。

**纪律补充**（接 §16.21）：出现 403 时不要"再试一条看看"，那本身就在加重判定；
应当停下来等窗口过去，并用本地桩（`stub-upstream.mjs`）继续验证行为。

### 16.24 中转 403 追查：把 system 改回 append（对齐上游），以及一次被自己污染的实验

**上游怎么做的**（`src/lib/protocol/crag-print-prompt.mjs`）：

```js
const mode = preset === 'zero' ? 'replace' : 'append'   // 只有 zero 预设才 replace
delete out.system                                        // 客户端 system 不原样透传
out.crag_prompt = { mode, text: tail }                    // 交给内核以 append 注入
```

也就是说**默认一律 append**，只有 `zero` 预设才 replace。我们此前在"带工具"分支里
把 system 整个替换成自家 persona（"You are the CRAG v2 print worker inside a Linux
container…"），与上游相反 → 已改为 append，并在末尾附一小段工具路由说明
（`mcp__crag__<Name>`）。

**实验记录（含教训）**：用抓到的真实请求做二分时得到过"带工具就 403、去掉工具就通过"的结论
（reqG 带 Bash → 403；reqH 同内容去掉 tools → 200，16 秒正常回答）。但继续二分十几条之后
**连无工具的请求也开始 403**——说明二分过程本身把判定推到了账号/特征级，之前的"工具相关性"
是**在阈值爬升过程中测到的，不可信**。

结论：这条链路上**不能靠连续打真实请求做二分**。要判定形态问题，只能：

1. 用本地桩（`native-slot/.tmp/lab/stub-upstream.mjs`）验证**出站请求的结构**
   （system 是 append 还是 replace、tools 是否带、prompt 渲染形态），完全不消耗真实中转；
2. 真实中转只在"改完之后确认一次"时打一条，且等判定窗口完全过去。

**当前状态**：append 版本已部署（`6014775f`），但**未经真实链路验证**（部署后立刻遇到全局 403）。

### 16.25 用本地桩看出站形态（结论：append 生效；MCP 工具是"延迟加载"）

**方法**：桩跑在宿主网络（`--network host`，端口 18080），槽位 `ANTHROPIC_BASE_URL` 指过去，
从内核打请求 → 桩记录 CLI 真正发出的 body。全程零真实中转消耗。
（注意 `kin-eg-px-local` 是 `enable_icc=false`，容器之间不通，所以桩不能用同一网桥。）

**看到的事实**：

1. **system 是 append**：出站 system 是官方三块（billing header / "You are Claude Code…" /
   8416 字节 agent prompt），我们追加的工具路由说明**在里面**。替换形态已彻底去掉 ✔
2. `max_tokens 128000`、`stream true`、billing header `cc_version=2.1.321.f4d` —— 都是官方形态
3. **`mcp__crag__*` 不在 tools 数组里**，但这不是 bug：这个 CLI 构建用**延迟工具加载**，
   tools 里有 `ToolSearch`（"Fetches full schema definitions for deferred tools…"）
   和 `DeferredToolPlaceholder`（`defer_loading: true`）。MCP 工具只以**名字**出现在
   `<system-reminder>` 里，模型要先 `ToolSearch select:<tool>` 取 schema 才能调用。
4. **真 bug**：同一会话先来无工具请求、后来才带工具时，会**复用第一次 spawn 的进程**，
   `--mcp-config` 永远不在参数里（实测第二条明明带 tools，进程里没有）。CLI 参数只在
   spawn 生效，会话键必须带上"进程形态"。

**已修**：`spawn_variant(body)` = 工具集 + model 的 FNV；会话键变成 `<session>#<variant>`，
形态一变就换新进程。桩上复验：同会话先无工具后有工具 → 第二条进程带上了 `--mcp-config` ✔
（提交 `47a4b957`）

**副产品**：`CLAUDE_CODE_MAX_RETRIES=0` 已写进槽位 settings，403 时不再 4 连发（实测从 4 条降到 1 条）。

### 16.26 ToolSearch / 延迟工具：上游怎么处理，我们怎么对齐

这个 CLI 构建用**延迟工具加载**：MCP 工具不随请求下发 schema，只在 `<system-reminder>` 里给名字，
模型必须先调 `ToolSearch`（`select:<tool>`）取 schema。上游在三个地方处理它：

| 位置 | 上游做法 | 我们 |
| :--- | :--- | :--- |
| `claude-code-betas.mjs` | tools 里出现 `defer_loading: true` 或 `type` 以 `tool_search_tool_` 开头 → 加 `BETA_ADVANCED_TOOL_USE` 头 | 不涉及：beta 头由 CLI 自己按它的工具集生成（我们不构建请求） |
| `anthropic-policy.mjs` | `tool_search_tool_result.tool_references[].tool_name` 与 `tool_result` 内嵌的 `tool_reference.tool_name` 都要过 `restoreToolReferenceName()` 做**名字还原** | 不需要：我们的 MCP 工具名不做改写（`mcp__crag__<Name>` 由 CLI 加前缀），回传时桥报的是裸名，往返一致 |
| `crag-print-prompt.mjs` | "仅结果"块不能进 native 历史：`tool_reference` → 文本 `[tool_reference <tool_name>]`；`tool_result` 的标签带 ` (error)` | 已对齐（本提交）：`render_block` 新增 `tool_reference` 分支与 `is_error` 标签，并加单测 |

**含义**：`--disallowedTools <客户端工具名>` 只是把**内建同名工具**关掉，`ToolSearch` 本身是内建工具、
不在客户端工具表里，所以不会被禁；延迟加载机制照常工作。模型要拿到 `mcp__crag__Bash` 的 schema，
仍会走 `ToolSearch`。

**验证**：165 个 lib 测试通过；渲染层单测断言 `[tool_reference mcp__crag__Bash]` 与
`[tool result t1 (error)]`。

### 16.27 契约面审计：面板发给内核的 7 个内部字段，我们原来一个都没读

**触发点**：连续几次"照着上游做就好"的教训之后，反过来把上游对内核的契约整份抽出来对了一遍。

上游 `kernel-request.mjs` 定义的内部字段：

```js
const INTERNAL_FIELDS = ['gateway_policy', 'request_context', 'kin_outbound_shape', 'request_id', 'delivery_mode']
```

加上协议层另外两个：`crag_prompt`、`crag_options`（还有只在内核消费的 `crag_model`）。

**审计结果（改前）**：`crag_options` / `crag_model` / `gateway_policy` / `request_context` /
`kin_outbound_shape` / `delivery_mode` / `crag_prompt` —— **一个都没读**，只有 `cache_ttl` 读了。

其中三条是实质性影响：

| 字段 | 上游语义 | 我们原来的行为 |
| :--- | :--- | :--- |
| `crag_prompt: {mode, text}` | 面板把 `body.system` **删掉**，改用它下发调用方 system（mode = append/replace） | 完全不读 → 面板发来的请求**没有调用方 system** |
| `gateway_policy.first_byte_timeout_ms` / `stream_idle_timeout_ms` | 首字节与流空闲的超时 | 一律用写死的 `HOP_TIMEOUT = 180s` |
| `gateway_policy.session_idle_ttl_seconds` | 会话空闲上限 | 用 kernel.json 里的值，面板改了不生效 |
| `gateway_policy.queue_wait_ms` | 排队等槽位的上限 | `pool.turn()` 无限等 |
| `delivery_mode` | realtime / verified（决定能否提前发头） | 忽略，永远按 realtime |

**另外两个能力位**（`rust-kernel-client.mjs` 按它们决定是否走对应流程）：

- `crag_telemetry_apply_v1`：不报 → 面板**永远不会**调 `/internal/v1/telemetry/apply`（我们其实实现了）
- `gateway_policy_v1`：不报 → 每次路由变更面板都**重启内核**（`routing-runtime.mjs:435`），
  而不是走热更新。这正是之前观察到的"面板动不动重启槽位"的来源之一。

**本次修复**（`ab204a06`）：

1. 读 `crag_prompt`：`text` 作为 system 文本，`mode === 'replace'` 才替换，否则 append
2. 读 `gateway_policy`：首字节超时、流空闲超时、`session_idle_ttl_seconds`（`pool.set_idle`）、
   `queue_wait_ms`（`pool.turn` 外面套 timeout）
3. health 增报 `crag_telemetry_apply_v1: true`、`gateway_policy_v1: true`、`source: "rust-kernel"`

**验证**：165 个测试通过；health 五个字段齐；带 `gateway_policy` 的真实请求 200（10s，无 403）。

**仍忽略**（已知、且上游有语义的）：`request_context`、`kin_outbound_shape`、`delivery_mode`、
`crag_options`、`crag_model`。前者是日志/追踪上下文，后两者属于"面板侧请求组装"，我们不在请求链路上。

### 16.28 契约对齐第二轮：delivery_mode / request_context / capabilities 数组

§16.27 之后继续按上游补齐，并做了**第二次全量检查**。

**新增对齐**（`3bdd2257`）：

| 字段 | 上游语义 | 我们的实现 |
| :--- | :--- | :--- |
| `delivery_mode: "verified"` | 只允许 realtime 提前发头；verified 必须"全部产出后再回" | `streaming` 强制为 false，走聚合后一次性 JSON |
| `request_context.purpose === "auto_mode_classifier"` | 面板的分类器探针，**不能**并入用户会话（`native-handoff.mjs` 就是按这个 purpose 排除的） | 会话键加 `#classifier` 后缀 |
| `health.capabilities`（数组） | 面板十几处 `capabilities.includes(...)` 决定行为 | 报出我们**确实实现**的 5 项：`official_full / zero / cancel / telemetry / unix_socket_envelope`（与厂商 manifest 声明集一致） |

**第二次检查结果**（逐个字段/能力对源码打勾）：

```
字段           gateway_policy READ  request_context READ  delivery_mode READ  crag_prompt READ
               crag_options IGNORED   crag_model IGNORED   kin_outbound_shape IGNORED
能力           official_full/zero/cancel/telemetry/unix_socket_envelope  ADVERTISED
未声明          native_handoff_v1  provider_result_v2  provider_managed_tools_v1
               system_text_cache_v3  generation_controls_v3  linux_tui_native_queue
               message_threads_beta  caller_cwd
```

**为什么这三项仍然忽略**（不是为了省事，是确实不适用）：

- `kin_outbound_shape`：只在**内核自己构建请求**（direct 模式）时生效，用于校验收敛的出站字段顺序；
  native/TUI 通路的出站由官方 CLI 构建，内核无从施加。
- `crag_options`：上游把 `prompt` 摘掉后，剩下的键**没有任何消费方**（全仓搜不到 `crag_options.`），
  保留即等价。
- `crag_model`：面板只在 `health.capabilities` 含 `model_directive` / `linux_tui_pty` 时才下发；
  我们不声明，所以面板不会发。

**未声明的 8 个能力位**都是"声明了就要承担对应行为"的东西（例如 `provider_managed_tools_v1` 会让面板
改写 provider 工具、`generation_controls_v3` 会改生成参数下发方式）。**宁可不声明**，也不假装支持——
静默半支持比缺能力更糟。
