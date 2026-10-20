# 4. 验收测试

本文定义 ARM64 CLI 宿主的验收标准。所有测试应在隔离环境中完成，
不连接生产流量。

## 4.1 测试环境

| 组件 | 说明 |
| --- | --- |
| 被测对象 | ARM64 CLI 宿主 |
| 内核 | 测试实例，独立 socket 路径 |
| 上游 | 本地 mock，返回固定 SSE 序列 |
| 客户端 | `curl --unix-socket` 或等价工具 |

要求：

- 测试实例使用独立配置与独立 Unix socket；
- 不读写生产配置目录；
- 不向生产进程发送信号；
- `/tmp` 若为 `noexec`，脚本放在可执行目录。

## 4.2 测试矩阵

### A. 启动与握手

| # | 输入 | 期望 |
| --- | --- | --- |
| A1 | `CLAUDE_CODE_NATIVE_SLOTS=1` | 首行 `host_ready`，随后 1 条 `slot_ready` |
| A2 | `CLAUDE_CODE_NATIVE_SLOTS=20` | `slots=20`，20 条 `slot_ready` |
| A3 | `CLAUDE_CODE_NATIVE_SLOTS=0` | 不进入槽位模式 |
| A4 | `system_layout="identity"` | 内核拒绝注册 |
| A5 | `protocol_version=1` | 内核拒绝注册 |
| A6 | 缺少 `stateless` 能力 | 内核拒绝注册 |
| A7 | 缺少 `ping` 能力 | 接受 |
| A8 | 时区与内核期望不一致 | 内核拒绝注册 |
| A9 | `config_hash` 缺失或任意值 | 接受 |
| A10 | 完全不发 `host_ready` | 内核不监听 socket |
| A11 | `metadata.user_id` 与三个会话头同时给出不同值 | 以 `metadata` 的 `session_id` 为准 |
| A12 | 无 `metadata`，同时带 `x-claude-code-session-id` 与 `x-session-id` | 以 `x-claude-code-session-id` 为准 |

### B. 帧字段

| # | 输入 | 期望 |
| --- | --- | --- |
| B1 | `job_done{usage:{}, stop_reason:""}` | 请求成功返回 |
| B2 | `job_done{usage:null, stop_reason:"end_turn"}` | 请求成功返回 |
| B3 | `job_done` 省略 `usage` | 请求成功返回 |
| B4 | `job_done{stop_reason:null}` | 整帧被丢弃 |
| B5 | `job_error{error:"boom"}` | 客户端收到 400 |
| B6 | `job_error{error:{...}}` | 整帧被丢弃 |
| B7 | 未识别的 `type` | 静默丢弃，不影响其他帧 |

### C. 流式转发

| # | 输入 | 期望 |
| --- | --- | --- |
| C1 | 标准 SSE 事件序列 | 客户端收到等价 SSE |
| C2 | `content_block_delta` + `input_json_delta` | 工具参数正确拼接 |
| C3 | `message_delta` 带 `usage` | 最终响应包含 usage |
| C4 | 响应头含 `anthropic-ratelimit-*` | 内核收到 `response_headers` 事件 |
| C5 | 流中途断开 | `job_error{code:"upstream_stream_interrupted"}` |

### D. 健康检查

| # | 场景 | 期望 |
| --- | --- | --- |
| D1 | job 运行中超时无输出 | 收到 `ping`，回 `pong` 后停止重复 |
| D2 | 收到 `cancel` | 30 秒内回 `cancel_ack` |
| D3 | 不回 `cancel_ack` | 内核重启宿主（失败路径验证） |
| D4 | 纯空闲 90 秒 | 不产生 `ping` |

### E. 并发与容量

| # | 场景 | 期望 |
| --- | --- | --- |
| E1 | 两个槽位同时请求 | 互不阻塞，各自完成 |
| E2 | 槽位已满再请求 | 内核返回 `503 no_capacity` |
| E3 | 同一槽位重复 `job_start` | 第二个请求收到 `job_error`（busy） |
| E4 | 取消其中一个 job | 另一个不受影响 |

### F. 请求构造

| # | 检查项 | 期望 |
| --- | --- | --- |
| F1 | 上游请求体 | 与客户端请求一致（去掉内核内部字段） |
| F2 | `system` 块顺序 | 与输入一致 |
| F3 | `cache_control` | 补全 TTL，最多 4 个 marker |
| F4 | `thinking` 块 | 不携带 `cache_control` |
| F5 | 请求头 | 包含 UA、Stainless、Beta |
| F6 | `metadata.user_id` | 能解析出 `session_id` |

### G. 内核接口

| # | 输入 | 期望 |
| --- | --- | --- |
| G1 | `GET /healthz` | 200 |
| G2 | `GET /readyz` | 就绪 200，未就绪 503 |
| G3 | `GET /status` | 200 |
| G4 | `POST /v1/messages` 缺 `messages` | 400 `invalid_request` |
| G5 | `messages` 超过 1024 条 | 400 |
| G6 | `tools` 超过 128 条 | 400 |
| G7 | 工具名重复或为空 | 400 |
| G8 | `max_tokens=0` | 400 |
| G9 | `model` 超过 128 字符 | 400 |
| G10 | 槽位已满时请求 | 503 `no_capacity` |
| G11 | 请求头带 `x-slot` | 响应 `x-slot` 与之一致 |
| G12 | 流式请求 | 响应含 5 个 trailer 头 |
| G13 | 上游流中断 | `upstream_stream_incomplete` |
| G14 | worker 请求缺 `X-Internal-Token` | 401 `internal_auth_failed` |
| G15 | `/internal/v1/cancel` 的 `request_id` 为数字 | 400 |
| G16 | 未注册路径 | 404 |
| G17 | `provider=anthropic_api` 无凭据 | 启动失败并给出明确错误 |
| G18 | `slots_per_worker=21` | 启动失败 |
| G19 | `GET /internal/health` | 200，含 `vm_id`、`ready_slots`、`closed_slots`、`cli_restarts`、`healthy` |
| G20 | 单个 `tool_result` 超过 `MAX_TOOL_RESULT_BYTES` | 400 |
| G21 | 续接请求缺少 `tool_result` | 400，`session is not waiting for a tool result` |
| G22 | 续接令牌过期 | 400，`continuation has expired` |
| G23 | 凭据 `expiresAt` 已过 | 401 `needs_refresh` |
| G24 | 凭据类型为 `apikey` | 使用 `x-api-key`，不判定刷新 |
| G25 | `/v1/chat/completions` 非流式 | `object` 为 `chat.completion`，含 `usage` 三项计数 |
| G26 | `/v1/chat/completions` 流式遇到 `thinking_delta` | 产生对应 chunk，不丢弃 |
| G27 | 连续两次请求之间替换凭据文件 | 第二次请求使用新 token |
| G30 | `PROVIDER=anthropic_api` 且未设 `ANTHROPIC_API_KEY` | 启动失败，错误含 `ANTHROPIC_API_KEY is required` |
| G31 | `anthropic_api` 模式发起流式请求 | 上游收到 `stream:true`，请求头含 `anthropic-version: 2023-06-01` |
| G32 | 凭据类型为 `oauth` | 上游收到 `Authorization: Bearer`，不含 `x-api-key` |
| G33 | 上游返回非法 JSON 事件 | 客户端收到 `upstream_response_invalid` |
| G34 | 上游首字节超时 | 客户端收到 `stream first-byte timeout` |
| G35 | `anthropic_api` 非流式请求 | 返回一个完整 `message` 对象，含 `content` 与 `usage` |
| G36 | `anthropic_api` 模式下调用方不传 `system` | 上游收到的请求同样没有 `system`，内核不补 |
| G28 | 调用方不传 `system` | `job_start.request` 无 `system` 字段 |
| G29 | 调用方自带 `x-anthropic-billing-header:` 块 | 原样转发，CLI 只重置 `cch` |

### H. CLI 登录命令

| # | 场景 | 期望 |
| --- | --- | --- |
| H1 | `cli-node auth login` 启动 | 45 秒内输出 `https://claude.com/cai/oauth/authorize?...` |
| H2 | 粘贴有效授权码 | 输出 `Login successful`，写出 `0600` 凭据文件 |
| H3 | 粘贴无效授权码 | 输出 `Invalid code`，可重试 |
| H4 | 授权码无效且不重试 | 90 秒内以失败结束，不悬挂 |
| H5 | `cli-node setup-token` | 产出 `sk-ant-oat01-…`，凭据无 `refreshToken` |
| H6 | 槽位模式下收到 `/usage` 等交互命令输入 | 不进入交互界面，按普通帧处理 |
| H7 | `cli-node --version` | 输出 `<version> (Claude Code)` 后退出 |
| H8 | `cli-node -p hello --output-format json` | stdout 是单个 JSON 对象，无 `is_error` |
| H9 | `cli-node /usage --print --output-format stream-json --verbose` | stdout 每行是一个 JSON 事件，含 `usage_report` 或 `type:"result"` |
| H10 | `auth login` 授权链接 | 含 `code=true`、`client_id`、`S256`、`state`，`redirect_uri` 为 manual 回调 |
| H11 | `setup-token` 换票请求 | 带 `expires_in=31536000`，scope 只有 `user:inference` |

## 4.3 快速自检

新构建接入前的 5 分钟检查：

1. 以 `CLAUDE_CODE_NATIVE_SLOTS=1` 启动，确认 stdout 第一行是
   合法的 `host_ready`；
2. 用 mock 内核发 `ping`，确认 1 秒内收到 `pong`，`nonce` 一致；
3. 用 mock 内核发 `job_start`，确认收到完整的 `stream_event` 序列与
   `job_done`；
4. 用 mock 内核发 `cancel`，确认 1 秒内收到 `cancel_ack`；
5. 连续发 20 个 job，确认无帧交错、无槽位泄漏；
6. 启动内核，确认 `/healthz`、`/readyz` 可用；
7. 用 `curl` 发一条最小 Messages 请求，确认流式响应与 trailer 头完整。

## 4.4 判定标准

验收通过需同时满足：

- A、B、C、D、G 组全部通过；
- E 组无死锁、无跨槽位影响；
- F 组上游请求与客户端请求语义一致；
- 连续运行 24 小时无宿主重启、无连接泄漏；
- 错误路径均能在 30 秒内结束，不产生悬挂 job。

## 4.5 测试工具约定

建议提供三个独立工具：

| 工具 | 作用 |
| --- | --- |
| `mock-kernel` | 测试内核对 CLI 发帧，验证 CLI 侧行为 |
| `mock-upstream` | 返回固定 SSE，验证请求构造与转发 |
| `frame-logger` | 记录双向帧，用于断言时序 |

测试工具不得依赖生产凭据，不得向真实上游发送请求。
