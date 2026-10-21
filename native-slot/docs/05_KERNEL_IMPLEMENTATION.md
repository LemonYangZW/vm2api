# 5. 内核实现规格

本文定义 `kin-kernel` 的 ARM64 实现所需的行为规格，覆盖进程模型、
HTTP 接口、上游选择、槽位调度、生命周期、超时与错误处理。

状态标记：

| 标记 | 含义 |
| --- | --- |
| ✅ | 已确认 |
| ◐ | 主体已确认，细节待定 |
| ○ | 尚未确认，实现前需补齐 |

## 5.1 进程模型

一个槽位容器内运行两类进程：

```text
kin-kernel（主进程）
  ├─ HTTP 服务：0.0.0.0:8080（默认）
  └─ 调度器：worker / slot / session
        │
        │ Unix socket
        ▼
kin-kernel --gateway-worker
  ├─ 监听：<socket_path>
  └─ 拉起 ──> cli-host（NDJSON）
```

| 进程 | 监听 | 职责 |
| --- | --- | --- |
| 主进程 | TCP `0.0.0.0:8080` | 对外 Messages API、调度、会话目录 |
| gateway-worker | Unix `<socket_path>` | 内部 Messages 转发、槽位运行时 |
| cli-host | stdin/stdout | 上游调用与流事件 |

启动日志：

```text
kernel listening
kernel gateway-worker listening
```

两个进程由部署脚本分别启动，通过 Unix socket 通信；worker 退出后
由部署层按重启策略拉起。主进程不直接管理 worker 进程生命周期。

当前生产部署的运行形态：

| 项 | 观察值 |
| --- | --- |
| 运行模式 | 只运行 `--gateway-worker` |
| 监听 | `/run/kin/kernel.sock` |
| 槽位数 | 20 |
| CLI 启动到 `native host ready` | 约 24–28 秒 |
| 宿主重启触发 | `native cli stdout closed` |
| 重启间隔 | 约 8–11 小时 |

主 API 路由属于同一程序的另一种运行模式。当前生产部署主要使用
worker 模式，但主 API 模式仍是同一份规格的一部分，重写版必须实现，
以便在 `provider=anthropic_api` 下直接提供 Messages 与 OpenAI 兼容接口。


## 5.2 主 API

### 5.2.1 路由表

| 方法 | 路径 | 处理 | 说明 |
| --- | --- | --- | --- |
| GET | `/healthz` | `api::health` | 存活检查 |
| GET | `/readyz` | `api::ready` | 就绪检查 |
| GET | `/status` | `api::health` | 状态 |
| POST | `/v1/messages` | `api::messages` | Anthropic Messages |
| POST | `/v1/chat/completions` | `api::chat_completions` | OpenAI 兼容 |
| GET | `/internal/v1/slots` | `api::slots` | 槽位视图 |
| GET/PUT | `/internal/v1/envelope` | `api::envelope_get` / `envelope_put` | 信封配置 |

未注册的路径返回 404。

路由整体只挂载 `DefaultBodyLimit` 一层，**没有任何鉴权中间件**。
鉴权只出现在 gateway-worker 的内部接口（见 5.4.3）。

### 5.2.2 请求头

| 头 | 说明 |
| --- | --- |
| `x-request-id` | 请求标识；缺省时内核生成 |
| `x-tenant-id` | 租户标识；缺省用 `DEFAULT_TENANT` |
| `x-slot` | 指定槽位；`EXPOSE_SLOT_HEADER` 控制是否对外暴露 |
| `x-generation` | 宿主代次，用于识别重启边界 |
| `x-continuation` | 续接标识 |
| `x-session-id` | 会话标识 |
| `x-claude-code-session-id` | 会话标识（CLI 宿主侧命名） |
| `x-conversation-id` | 会话标识（会话上下文） |

会话上下文按以下顺序解析，取到第一个非空值后停止：

```text
1. request.metadata.user_id 内层 JSON 的 session_id
2. x-claude-code-session-id
3. x-session-id
4. x-conversation-id
```

每个候选值先 `trim`，空串视为未提供。`metadata` 的优先级高于所有
请求头：只要内层 JSON 能解析出非空 `session_id`，就不再读头。

`metadata.user_id` 内层无法解析时，退化为直接按字符串 `trim` 作为
会话标识；仍为空则继续看请求头。

### 5.2.3 请求校验

Messages 请求的校验规则：

| 规则 | 错误消息 |
| --- | --- |
| `messages` 非空 | `messages must not be empty` |
| `messages` 条数 ≤ 1024 | `messages must contain at most 1024 entries` |
| `max_tokens` > 0 | `max_tokens must be positive` |
| `tools` 条数 ≤ 128 | `tools must contain at most 128 entries` |
| 工具名非空且唯一 | `tool names must be non-empty and unique` |
| `model` 长度 1–128 | `model must contain 1 to 128 characters` |

校验失败返回 `invalid_request`。

### 5.2.4 响应头

| 头 | 来源 | 说明 |
| --- | --- | --- |
| `x-request-id` | 请求或生成 | 回显 |
| `x-tenant-id` | 请求或默认 | 回显 |
| `x-session-id` | 会话解析 | 会话标识 |
| `x-slot` | 调度结果 | 实际槽位 |
| `x-native-slot` | 原生槽位 | native 模式下的槽位 |
| `x-pid` | 宿主进程 | 进程号 |
| `x-generation` | 宿主代次 | 重启后递增 |
| `x-continuation` | 续接 | 续接标识 |
| `x-event-count` | 事件计数 | 流结束时的 trailer |
| `x-usage` | 用量 | 流结束时的 trailer |
| `x-model` | 模型 | 流结束时的 trailer |
| `x-stop-reason` | 停止原因 | 流结束时的 trailer |
| `x-terminal-state` | 终态 | 流结束时的 trailer |
| `x-error-code` | 错误码 | 流结束时的 trailer |

主 API 响应头的写入顺序与条件：

| 顺序 | 头 | 条件 |
| --- | --- | --- |
| 1 | `x-session-id` | 无条件 |
| 2 | `x-continuation` | 有续接标识 |
| 3 | `x-slot` | `EXPOSE_SLOT_HEADER` 为真 |
| 4 | `x-pid` | 宿主进程号已知 |
| 5 | `x-native-slot` | native 模式且槽位已知 |
| 6 | `x-generation` | 无条件 |

`x-generation` 的值来自宿主的代次计数，经过十进制格式化后写入，
不存在「代次未知则不写」的分支。

> 上表为主 API 模式的响应头。当前部署的 `gateway-worker` 模式实际只返回
> `content-type`、`trailer` 与流内事件，不返回 `x-slot`、`x-generation`
> 等头；这些字段由上层服务或主 API 模式生成。

流式响应的 trailer 声明：

```text
Trailer: X-Terminal-State, X-Error-Code, X-Event-Count, X-Usage, X-Model, X-Stop-Reason
```

### 5.2.5 流式响应

| 项 | 值 |
| --- | --- |
| Content-Type | `text/event-stream` |
| Cache-Control | `no-cache, no-transform` |
| X-Accel-Buffering | `no` |
| Connection | `keep-alive` |

事件格式与 Anthropic Messages 一致：

```text
event: <type>
data: <json>

```

正常结束发送 `message_stop`。流中断且未完成时，错误码为
`upstream_stream_incomplete`，错误消息为
`Anthropic message response is incomplete`。

#### 投递模式差异

| 项 | `realtime` | `verified` |
| --- | --- | --- |
| 传输 | `transfer-encoding: chunked` | `content-length` |
| 传输方式 | 边生成边下发 | 完整生成后一次下发 |
| 元数据位置 | `trailer` 头 | 普通响应头 |
| 元数据字段 | `X-Terminal-State`、`X-Error-Code`、`X-Event-Count`、`X-Usage`、`X-Model`、`X-Stop-Reason` | `x-terminal-state`、`x-event-count`、`x-model` |
| 事件序列 | 相同 | 相同 |

`verified` 模式下 `x-terminal-state` 的值为 `verified`；事件仍按标准
SSE 序列输出，只是不再分块传输。

#### OpenAI 兼容层的事件映射

`/v1/chat/completions` 把 Anthropic 事件转换成 OpenAI chunk，
按事件类型分派：

| Anthropic 事件 | OpenAI 输出 |
| --- | --- |
| `message_start` | 起始 chunk，标记流开始 |
| `message_delta` | 读取 `delta.stop_reason` 后生成结束 chunk |
| `content_block_delta` / `text_delta` | 文本内容 chunk |
| `content_block_delta` / `thinking_delta` | 思考内容 chunk |
| 其他事件 | 不产生 chunk |

每个 chunk 的 JSON 结构：

```json
{
  "id": "<job id>",
  "object": "chat.completion.chunk",
  "model": "<model>",
  "choices": [
    {
      "index": 0,
      "delta": { "content": "..." },
      "finish_reason": null
    }
  ]
}
```

`delta` 与 `finish_reason` 的内容由对应 Anthropic 事件决定；
`message_start` 产生不带内容的起始 chunk。

`finish_reason` 的映射只有三条：

| Anthropic `stop_reason` | OpenAI `finish_reason` |
| --- | --- |
| `max_tokens` | `length` |
| `tool_use` | `tool_calls` |
| 其余（含 `end_turn`、`stop_sequence`、`pause_turn`、`refusal`、缺失） | `stop` |

非流式请求汇总为完整对象，`object` 为 `"chat.completion"`（不带 `.chunk`）：

```json
{
  "id": "<job id>",
  "object": "chat.completion",
  "model": "<model>",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "..." },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

`usage` 的三个计数由 Anthropic 的 `input_tokens` / `output_tokens`
映射而来，`total_tokens` 为两者之和。

### 5.2.6 错误响应

统一结构：

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "..."
  }
}
```

内部错误码：

| 错误码 | 含义 |
| --- | --- |
| `kernel_error` | 内核内部错误 |
| `api_error` | 上游 API 错误 |
| `kernel_unavailable` | 宿主不可用 |
| `invalid_request` | 请求校验失败 |
| `invalid_request_context` | 分类器上下文非法 |
| `no_capacity` | 无可用槽位 |
| `upstream_transport` | 上游传输失败 |
| `upstream_auth_error` | 认证失败 |
| `upstream_stream_incomplete` | 流不完整 |
| `job stream overflow` | 事件流超出上限 |
| `client read timed out` | 客户端读取超时 |
| `client disconnected` | 客户端断开 |
| `job already completed` | 重复完成 |

### 5.2.7 请求加工链路

内核收到 Messages 请求后，按以下顺序加工再交给 Provider：

```text
原始请求
  → 结构校验（5.2.3）
  → 补会话与账号元数据
  → 注入 request_context（分类器场景）
  → 组装 job_start
```

内核**不修改** `system`、`messages`、`tools` 与任何 `cache_control`。
这些字段逐字节透传，最终形态由 CLI 宿主决定（见 `03` 3.3.1 与 3.4）。

#### 会话与账号元数据

1.3.205 实测：已有非空 `metadata.user_id` 字符串原样透传，并保留其他 metadata 字段；
缺少或为空时，内核构造 JSON 字符串：

```json
{"device_id":"","account_uuid":"","session_id":"<会话标识>"}
```

`device_id` 与 `account_uuid` 固定为空字符串，只有 `session_id`
携带真实值。会话标识的来源见 5.2.2。

#### 信封策略

运行时策略由信封（Envelope）提供，可通过
`GET/PUT /internal/v1/envelope` 热更新。与请求加工相关的字段：

| 字段 | 作用 |
| --- | --- |
| `system_layout` | system 块布局；原样传给 CLI 宿主 |
| `default_cache_ttl` | 缓存标记默认 TTL，经 `KERNEL_CONFIG` 文件交给 CLI 读取 |
| `preserve_cache_breakpoints` | 保留调用方缓存标记的开关，由 CLI 侧解释 |
| `request_context` | 分类器上下文覆盖 |
| `headers` | 附加到上游请求的头 |

信封里的 system 模式是二值的：

| 取值 | 含义 | 传给 CLI 的变量 |
| --- | --- | --- |
| `zero` | 不注入身份块，官方句子由计费侧 `prompt_version` 承担 | `SYSTEM_MODE=zero`、`CLAUDE_CODE_ENVELOPE=zero` |
| `identity` | 官方句子作为独立 system 块注入 | `SYSTEM_MODE=identity`、`CLAUDE_CODE_ENVELOPE=identity` |

**内核本身不拼接 system 文本**，只把模式和布局传给 CLI 宿主，
由宿主在发送上游请求时应用。

#### 分类器上下文

`request_context` 的校验规则见 2.3.1。内核按 `purpose` / `format` /
`stage` 三元组判定，并在请求体上做以下路径检查：

```text
/tool_choice        必须存在且与 format 匹配
/tool_choice/type
/tool_choice/name
/tools              必须包含同名工具
```

不匹配时返回 `invalid_request_context`。

#### OpenAI 兼容转换

`/v1/chat/completions` 在进入 Provider 前做以下转换：

- `tools[].type` 固定为 `"function"`；
- 缺少 `parameters` 时补 `{"type":"object","properties":{}}`；
- `tool_calls` 的 `function.arguments` 保留为字符串；
- 工具结果通过 `tool_call_id` 关联。

#### 续接请求

带 `x-continuation` 的请求在加工阶段额外校验：

| 条件 | 错误 |
| --- | --- |
| 会话未在等待工具结果 | `session is not waiting for a tool result` |
| `tool_result` id 与待处理调用不匹配 | `tool_result ids do not match the pending tool calls` |
| 出现重复 `tool_result` id | `duplicate tool_result ids are not allowed` |
| 续接令牌不匹配 | `continuation token does not match` |
| 续接已过期 | `continuation has expired` |
| 续接转录超过会话上限 | `continuation transcript exceeds the configured session limit` |

## 5.3 上游选择

`provider` 决定请求路径：

```text
provider = anthropic_api
  └─ 内核直连 Anthropic Messages

provider = local_cli
  └─ 内核 → gateway-worker → cli-host → Anthropic Messages
```

### 5.3.1 `anthropic_api`

进程内直连上游，不经过 CLI 宿主，也不经过 Unix socket。

#### 启动

读取 `ANTHROPIC_API_KEY`。缺失时启动失败：

```text
ANTHROPIC_API_KEY is required for PROVIDER=anthropic_api
```

HTTP 客户端在启动时构造一次，默认请求头：

| 头 | 值 |
| --- | --- |
| `x-api-key` | `ANTHROPIC_API_KEY` |
| `anthropic-version` | `2023-06-01` |
| `content-type` | `application/json` |
| `user-agent` | `kernel/0.1.0` |

重定向不跟随。

#### 请求

1. `MessageRequest` 序列化为 JSON 值；
2. 流式路径强制写入 `"stream": true`，覆盖调用方的值；
3. 发送：

```http
POST https://api.anthropic.com/v1/messages
Content-Type: application/json
```

地址是编译期常量。`anthropic_base_url` 只用于 `local_cli` 模式的
配置校验，不改变这条路径。

#### 凭据

每个请求重新读取凭据文件（见 `06` 6.4.4）：

```text
Credential::load → needs_refresh ?
  是 → 401 needs_refresh / credential needs refresh
  否 → auth_is_bearer ?
         是 → Authorization: Bearer <token>
         否 → x-api-key: <token>
```

`auth_is_bearer` 为真的类型是 `oauth`、`official-setup-token`；
`apikey` 走 `x-api-key`。类型归一化规则见 `06` 6.4.4。

#### 响应头

从上游响应中提取：

| 头 | 用途 |
| --- | --- |
| `request-id` | 透传到错误与 trailer |
| `x-request-id` | 同上，`request-id` 缺失时使用 |
| `retry-after` | 限流时回填 |
| `anthropic-ratelimit-*` | 供 `response_headers` 事件使用 |

#### 流式解析

上游返回 SSE。内核按块解析：

1. 以 `\n` 切行，去掉行尾的 `\r`；
2. 只看以 `data:` 开头的行；同一事件的多行 `data` 用 `\n` 连接；
3. 跳过空块与 `[DONE]`；
4. 其余按 JSON 解析为值。

不解析 `event:` 行，事件类型以 JSON 内的 `type` 字段为准。

解析后由 `StreamAssembler` 累积状态：

| 事件 | 处理 |
| --- | --- |
| `message_start` | 记录 `model` 与初始 `usage` |
| `content_block_start` | 按 `index` 建立块 |
| `content_block_delta` | 按 `delta.type` 追加文本、思考或工具参数 |
| `content_block_stop` | 关闭块 |
| `message_delta` | 更新 `stop_reason` 与 `usage` |
| 其他 | 忽略 |

`usage` 字段逐项合并：`input_tokens`、`output_tokens`、
`cache_read_input_tokens`、`cache_creation_input_tokens`。

#### 非流式

非流式请求仍走同一条流式解析路径：内核消费完整事件流后调用
`StreamAssembler::finish` 组装 `MessageResponse`：

```json
{
  "type": "message",
  "role": "assistant",
  "model": "<model>",
  "content": [...],
  "stop_reason": "<stop_reason>",
  "usage": {...}
}
```

#### 错误

| 场景 | `code` |
| --- | --- |
| 上游响应不是合法 JSON | `upstream_response_invalid` |
| 传输层失败 | `upstream_transport` |
| 首字节超时 | `stream first-byte timeout` |
| 流空闲超时 | `stream idle timeout` |
| 单个 SSE 事件超限 | `SSE event exceeds limit` |
| 终态字段非法 | `upstream_terminal_invalid` |
| 流结束但没有结果 | `stream ended without a result` |
| 非流式响应超限 | `verified stream exceeds response limit` |
| 请求路径逃出 Anthropic 源 | `upstream path escaped Anthropic origin` |
| 基址非法 | `invalid Anthropic base URL` |

`upstream path escaped Anthropic origin` 与 `invalid Anthropic base URL`
只在配置了非默认基址时出现。

#### 与 `local_cli` 的差异

| 项 | `anthropic_api` | `local_cli` |
| --- | --- | --- |
| 请求来源 | 内核进程直接构造 | CLI 宿主构造 |
| 系统提示 | 内核不生成，直接转发 | CLI 按 `SYSTEM_MODE` 生成 |
| 缓存标记 | 不处理 | CLI 补全 |
| 凭据 | 每请求读文件 | 每次请求读文件，CLI 侧再次读取 |
| 槽位 | 无 | 有，最多 20 个 |
| 取消 | 关闭 HTTP 连接 | 帧协议 `cancel` |
| 错误码 | 上表 | `02` 2.7 的 CLI 分类 |

### 5.3.2 `local_cli`

- 通过 Unix socket 转发到 gateway-worker；
- 请求头使用 `X-Internal-Token` 认证；
- 由 worker 再转给 cli-host，帧协议见 `02_CLI_INTERFACE_SPEC.md`。

### 5.3.3 `mock`

仅用于测试：不访问网络，返回固定事件序列。

### 5.3.4 Provider 能力

| 能力 | 说明 |
| --- | --- |
| `multi_slot` | 支持多槽位并发 |
| `native_sse` | 原生流式转发 |
| `stateless` | 不依赖宿主会话状态 |

## 5.4 网关内部接口

gateway-worker 在 Unix socket 上提供：

### 5.4.1 `POST /internal/v1/messages`

| 项 | 值 |
| --- | --- |
| 认证 | `X-Internal-Token: <internal_token>` |
| 请求体 | `Envelope` |
| 成功 | SSE 或 JSON |
| 认证失败 | 401 `internal_auth_failed` |

`Envelope` 共 8 个字段：

| # | 字段 | 说明 |
| --- | --- | --- |
| 0 | `request_context` | 分类器上下文，可选 |
| 1 | `body` | Messages 请求体，必填 |
| 2 | `headers` | 透传头 |
| 3 | `stream` | 是否流式 |
| 4 | `delivery_mode` | 单请求覆盖投递模式 |
| 5 | `cache_ttl` | 单请求覆盖缓存 TTL |
| 6 | `preserve_cache_breakpoints` | 保留缓存标记 |
| 7 | `request_id` | 请求标识 |

### 5.4.2 `POST /internal/v1/cancel`

请求：

```json
{"request_id": "<string>"}
```

响应：

```json
{"cancelled": false, "ok": true}
```

规则：

- `request_id` 必须是字符串；
- 未知字段忽略；
- 即使没有匹配到 job，也会向 CLI 转发 `cancel`；
- 非法 JSON 返回 400 `invalid_request`。

### 5.4.3 鉴权

`/internal/v1/*` 由中间件 `require_token` 保护：

```text
1. 读取请求头 X-Internal-Token
2. 去除首尾空白
3. 与配置 internal_token 精确比较
4. 不匹配返回 401
```

头缺失与内容不符走同一拒绝路径。比较是常量时间以下的普通字节比较，
不区分大小写头部名由 HTTP 层处理。

### 5.4.4 容量

槽位已满时直接返回：

```text
503 no_capacity
no compatible capacity is currently available
```

不排队。

### 5.4.5 `GET /internal/health`

worker 健康视图，供上层控制面轮询：

```json
{
  "vm_id": "<string>",
  "ready_slots": 3,
  "closed_slots": 1,
  "cli_restarts": 0,
  "recovering": false,
  "healthy": true,
  "unhealthy_reason": null
}
```

| 字段 | 说明 |
| --- | --- |
| `vm_id` | 本 worker 的虚拟主机标识 |
| `ready_slots` | 已就绪槽位数 |
| `closed_slots` | 已关闭槽位数 |
| `cli_restarts` | CLI 宿主重启累计次数 |
| `recovering` | 是否处于恢复中 |
| `healthy` | 综合健康判定 |
| `unhealthy_reason` | 不健康原因，健康时为 null |

`healthy` 为假时，`unhealthy_reason` 取值包括：

```text
native cli host unavailable
native cli restart budget spent; reporting unhealthy
stream ended without a result
```

重启失败且预算耗尽后不再自动重启，只上报不健康状态。

#### 槽位视图

`GET /internal/v1/slots` 返回每个槽位的状态：

| 字段 | 说明 |
| --- | --- |
| `index` | 槽位下标 |
| `id` | 槽位标识 |
| `generation` | 宿主代次 |
| `active` | 是否在处理任务 |
| `waiting_tool` | 是否等待工具结果 |
| `healthy` | 槽位健康 |
| `score` | 调度评分 |

## 5.5 槽位调度

### 5.5.1 组件

| 组件 | 职责 |
| --- | --- |
| `Scheduler` | worker 级调度：评分、获取、恢复 |
| `SlotScheduler` | 槽位级调度：选槽、入队、清理 |
| `SessionDirectory` | 会话到 worker 的粘滞映射 |

### 5.5.2 worker 调度

可用性：

```text
available =
    enabled
    && !draining
    && (active + waiting) < capacity
```

评分：

```text
load  = (active + waiting) × 1,000,000 / capacity
score = load × 35
      + (min(load_a, 1,000,000) + min(load_b, 1,000,000)) × 15
```

- `load_a` / `load_b` 位于 `Worker +0x50` / `+0x58`，构造时均为 0，
  评分时各自截断到 1,000,000 后相加再乘 15；
- 选择时按轮转起点遍历，取 **score 最小**的可用 worker；
- 轮转起点由原子计数对 worker 数量取模得到，避免固定偏向。

`Counters` 内联在 `Worker` 的互斥锁中，四个字段依次为
`active(+0x40)`、`waiting(+0x48)`、`load_a(+0x50)`、`load_b(+0x58)`。

本版本中 `load_a` / `load_b` **只有构造初值 0，没有任何写入点**：
`Worker` 与 `Counters` 都没有方法，`Scheduler` 的五个方法
（`score` / `try_acquire` / `is_available` / `resume` / `acquire`）
均不写这两个字段。

因此评分第二项恒为 0，实际生效的是：

```text
score = (active + waiting) × 1,000,000 / capacity × 35
```

实现时可以保留这两个占位字段并恒置 0，也可直接省略；
二者对选择结果等价。

租约状态迁移：

```text
try_acquire  ──> active += 1          成功则持有租约
acquire      ──> 遍历并等待可用
park_waiting ──> active -= 1, waiting += 1
resume       ──> waiting -= 1, active += 1   （需代次匹配）
drop         ──> active -= 1
```

`resume` 要求调用方持有的代次与 worker 当前代次一致，否则视为失效；
`waiting` 为 0 时不会发生 `waiting -= 1`。

### 5.5.3 槽位调度

```text
pick()           选择空闲槽位
enqueue_ready()  标记槽位就绪
forget_session() 清理会话占位
```

规则：

- 同一槽位同时只处理一个 job；
- 指定 `x-slot` 时优先使用该槽位；
- 无可用槽位时返回 `503 no_capacity`。

#### pick 的精确选择算法

`pick` 对**就绪槽位列表**（`VecDeque<String>`）做一次遍历选择：

```text
scheduler.sticky.retain(|_, pin| pin.last_used.elapsed() < sticky_ttl)

candidate = ready.iter()
    .enumerate()
    .filter(|(_, slot)| slot 满足就绪条件)
    .min_by_key(|(index, slot)| (last_used.get(slot).copied(), *index))
```

排序键为二元组 `(Option<Instant>, usize)`，按元组字典序比较：

| 优先级 | 键 | 规则 |
| --- | --- | --- |
| 1 | `Option<Instant>` | `None` **小于** `Some(_)`，即从未用过的槽位优先 |
| 2 | `Instant` | 同为 `Some` 时取时间**最早**者（最久未用，LRU） |
| 3 | `usize` | 时间相同时取列表下标**最小**者，保证结果稳定 |

等价表述：先按 LRU 选，未被使用过的槽位视为「最早」；
完全同分时按就绪队列顺序取第一个。

`min_by_key` 使用严格小于比较，因此并列候选保留先遍历到的那个。

要点：

- 每次 `pick` 开头都会先执行一次粘滞清理（`prune_expired`），
  过期项在同一次调用内即被移除；
- 就绪条件同时要求槽位存在、标识匹配且状态标志为就绪；
- `enqueue_ready` 在入队前做去重，同一槽位不会重复出现。

粘滞表的键由两个字符串拼接：

```text
key = format!("{}{}", vm_id, session_id)
```

`vm_id` 取配置字段，`session_id` 取自请求的
`body.metadata.user_id` 中的 `session_id`。

运行时观测到的参数顺序（记录见归档材料 11.11）：

```text
第一个参数  "probe"                                 (vm_id)
第二个参数  "fd3972cc-1940-4de0-8da6-dd4892fd0131"  (session_id)
```

**键中不含租户维度**：同一 `vm_id` 下，`session_id` 相同的请求
共享粘滞槽位；租户不同不影响粘滞。

请求未提供 `metadata.user_id` 时，内核自行生成 UUID 作为 `session_id`。

拼接是否带分隔符未最终确认，但它不影响行为等价。

观测结果（两路并发、相同会话标识、不同 `request_id`）：

```text
req1  HTTP 200  7 事件  1611 ms
req2  HTTP 200  7 事件  1781 ms
```

两路都正常完成，没有阻塞，也没有 `503 no_capacity`。
说明粘滞命中但槽位不可用时，`pick` 会回退到其他空闲槽位，不会让请求排队。

### 5.5.4 会话目录

| 操作 | 说明 |
| --- | --- |
| `sticky_worker(session)` | 返回会话绑定的 worker |
| `mark_ready(session)` | 标记会话就绪 |
| `mark_waiting(session)` | 标记会话等待 |
| `resume(session)` | 恢复会话绑定 |
| `sweep_expired()` | 清理过期会话 |

会话 TTL 由 `SESSION_IDLE_TTL_SECS` 控制，配置项
`session_idle_ttl_seconds` 范围 1–86400，缺省 **600 秒**。

槽位粘滞记录（`StickyPin`）另有独立 TTL，默认 **86400 秒（24 小时）**，
由 `SlotScheduler` 构造时设定；配置热更新时若新值无效，
保留此前的取值。

## 5.6 宿主生命周期

### 5.6.1 启动

```text
spawn_host()
  ├─ 设置环境变量（见 06_CONFIG_AND_CREDENTIALS.md 6.3.2）
  ├─ 拉起 cli-host
  ├─ 读取第一行 host_ready
  ├─ validate_host_ready()
  └─ register_native_ready()  → 建立槽位映射
```

`validate_host_ready` 的校验规则见 `02_CLI_INTERFACE_SPEC.md` 2.2.3。

### 5.6.2 帧处理

```text
cli-host stdout ──> handle_cli_frame()
cli-host stdin  <── write_cli_stdin()
内部事件        ──> handle_native_frame()
```

写入 stdin 必须串行化，避免多槽位帧交错。

### 5.6.3 任务流转

| 操作 | 说明 |
| --- | --- |
| `submit_fresh` | 提交新任务到空闲槽位 |
| `complete_job` | 正常结束，释放槽位 |
| `cancel_request` | 发送取消 |
| `abort_terminal_job` | 终止已进入终态的任务 |
| `emit` | 向客户端推送事件 |

### 5.6.4 退役与重启

| 操作 | 触发 |
| --- | --- |
| `retire_idle` | 槽位空闲超过 `session_idle_ttl_seconds`（缺省 600 秒） |
| `retire_slot` | 槽位异常退役 |
| `request_restart` | 宿主失联或握手失败 |
| `recover` / `recover_loop` | 重启后恢复槽位 |
| `host_lost` | 宿主进程消失 |
| `mark_host_unavailable` | 标记不可用 |

重启后槽位需要重新握手，未完成的任务按 `kernel_unavailable` 上报。

恢复没有固定轮询周期：宿主输出关闭后在同一毫秒内记录失败并请求重启，
恢复所需时间等于 CLI 冷启动时间。生产观测 25–39 秒。
重启之间的间隔不规律（数分钟到二十余小时），由 CLI 自身退出决定，
不是定时器行为。

## 5.7 超时与看门狗

| 名称 | 默认 | 行为 |
| --- | --- | --- |
| `JOB_IDLE_SECS` | 180 | job 无帧输出超时 → ping + cancel |
| `CANCEL_ACK_SECS` | 30 | cancel 未确认 → 重发并重启宿主 |
| `CLIENT_STALL_SECS` | 30 | 客户端停顿超时 |
| `first_byte_timeout_seconds` | 600 | 上游首字节超时 |
| `request_timeout_seconds` | 0（不限制） | 整体请求超时；0 表示不限制 |

看门狗流程：

```text
job_watchdog
  ├─ 每 10 秒发送 ping
  ├─ 收到 pong 后停止重复 ping
  ├─ 排定的 cancel 不因 pong 撤销
  └─ cancel_ack 超时 → request_restart
```

### 5.7.1 批量扫描与心跳

`watchdog_sweep` 按周期遍历 job 表：

```text
过期集 = jobs.iter()
             .filter(|(_, last_touch)| now - last_touch >= JOB_IDLE_SECS)
             .map(job_id)
             .collect::<Vec<_>>()
```

`touch_job` 在该 job 每次收到帧时更新 `last_touch`，
所以空闲判定基于「最后一次帧」而不是「创建时间」。

`finish_sent_job` 与 `submission_cancelled` 负责把 job 移出表，
避免被后续扫描重复处理。前者对应已发送任务的终态，
后者对应提交阶段就被取消的任务。

### 5.7.2 异常收尾

每个 job 的生命周期终点由「先到者胜」决定，之后到达的信号不再改变状态。

#### 取消与完成并发

```text
finish_sent_job / submission_cancelled  → 移出 job 表
后续事件                              → 丢弃，不报错
重复完成                              → job already completed
```

取消路径带来源标记：

```text
explicit cancel from control plane  控制面显式取消
client disconnected                 客户端断开
client read timed out               客户端读取超时
```

`cancel` 发出后等待 `cancel_ack`；超时则 `request_restart`，
重启宿主而不是继续等待。

#### 迟到事件

job 已移出表后收到的 `stream_event`、`job_done`、`job_error`
一律丢弃。此时槽位已归还，事件不能重新占用。

#### 客户端断开

客户端断开时不立即终止上游：

1. 标记 job 为取消来源 `client disconnected`；
2. 发送 `cancel`，按 `CANCEL_ACK_SECS` 等待确认；
3. 确认后释放槽位；未确认则重启宿主并释放。

#### 宿主退出

```text
native cli host failed; restarting it      → 有重启预算时重启
native cli host unavailable                → 重启失败，槽位标记不可用
native cli restart budget spent; reporting unhealthy
                                           → 预算耗尽，只上报不健康
```

宿主退出时，其上所有在途 job 以 `kernel_unavailable` 结束，
槽位按代次整体作废，不影响其他槽位。

#### 槽位释放时机

| 场景 | 释放时机 |
| --- | --- |
| 正常完成 | 收到 `job_done` 并写完响应后 |
| 显式取消 | 收到 `cancel_ack` 后 |
| 取消未确认 | 宿主重启完成后 |
| 宿主退出 | 槽位按代次作废 |
| 空闲回收 | `retire_idle` 扫描到期后 |

释放前槽位不可被 `pick` 选中，避免新任务落到正在退出的槽位。

#### 流相关的终止错误

| 条件 | 错误 |
| --- | --- |
| 上游流缺少终止事件 | `stream ended without a result` |
| 上游响应结构非法 | `upstream_response_invalid` |
| 终态字段非法 | `upstream_terminal_invalid` |
| 首字节超时 | `stream first-byte timeout` |
| 非流式响应超限 | `verified stream exceeds response limit` |

## 5.8 流事件汇总

内核从 `stream_event` 汇总：

| 数据 | 来源 |
| --- | --- |
| `usage` | `message_start.message.usage` 与 `message_delta.usage` |
| `stop_reason` | `message_delta.delta.stop_reason` |
| 事件计数 | 每条 `stream_event` |
| 终态 | `message_stop` 或错误 |

汇总结果写入响应 trailer（见 5.2.4）。`job_done` 中的 `usage` /
`stop_reason` 只做类型校验，不直接采用。

处理细节：

- 分帧同时识别 `\n\n` 与 `\r\n\r\n`；不完整的尾部保留到下一次读取；
- 每条事件原样累积到缓冲区，并递增事件计数；
- 单条事件超过 `max_event_bytes` 时按流溢出处理；
- 错误事件中的文本截断到 **300 字符**，空文本使用固定文案；
- 流结束但缺少终止事件时，错误码为 `upstream_stream_incomplete`。

`stop_reason` 的识别值：

```text
end_turn
max_tokens
stop_sequence
tool_use
pause_turn
refusal
```

其中 `pause_turn` 与 `refusal` 是较新的取值，需要显式支持；
其他未列出的字符串按「未知停止原因」处理，不中断流。

## 5.9 背压与资源限制

| 变量 | 缺省 | 作用 |
| --- | --- | --- |
| `MEM_SOFT_BYTES` | 3 GiB | 已记账字节的上限 |
| `MEM_DRAIN_BYTES` | 3 GiB | 当前 RSS 的阈值 |
| `MAX_INFLIGHT_PAYLOAD` | 256 MiB | 单个在途负载上限 |
| `MAX_PENDING` | 100 | 待处理队列长度上限 |
| `max_request_bytes` | 配置项 | 请求体上限 |
| `max_response_bytes` | 配置项 | 响应体上限 |
| `max_event_bytes` | 配置项 | 单事件上限 |

### 5.9.1 内存准入

`MemoryGuard::admit(bytes)` 的判定顺序：

```text
1. 采集一次内存快照（RSS 与回收状态）
2. 若 当前 RSS >= RSS 阈值            → 拒绝
3. 计算 accounted + bytes（溢出饱和）
4. 若 该值 <= 记账上限                → 接受
5. 否则                               → 拒绝
```

`accounted` 由 `charge_job_bytes` 累加、job 结束时释放。
`rss_of` 读取进程常驻内存。

拒绝时返回带内存压力标记的错误，调用方按 `503 no_capacity` 处理。

### 5.9.2 超限行为

- 队列长度达到 `MAX_PENDING`：`503 no_capacity`；
- 单事件超过 `max_event_bytes`：`job stream overflow`；
- 内存超过软上限：暂停接收新任务，等待回收。

## 5.10 实现清单

按依赖顺序：

1. 配置加载与校验（`06`）；
2. HTTP 服务与路由（5.2.1）；
3. Provider 抽象（5.3）；
4. gateway-worker 与 Envelope（5.4）；
5. CLI 帧协议（`02`）；
6. 槽位运行时与宿主生命周期（5.6）；
7. 调度器与会话目录（5.5）；
8. 看门狗与错误映射（5.7、5.2.6）；
9. 背压与资源限制（5.9）。

## 5.11 已确认项清单

| 项 | 状态 | 说明 |
| --- | --- | --- |
| `x-generation` | ✅ 已确认 | 仅主 API 模式生成；当前部署的 worker 模式不返回 |
| `retire_idle` 阈值 | ✅ 已确认 | `session_idle_ttl_seconds`，缺省 600 秒，范围 1–86400 |
| `SlotScheduler::pick` 排序键 | ✅ 已确认 | `(Option<Instant>, usize)`，见 5.5.3 |
| 槽位粘滞 TTL | ✅ 已确认 | 默认 86400 秒，见 5.5.4 |
| `recover_loop` 重试间隔 | ✅ 已确认 | 无固定周期；失败后立即重启，恢复 25–39 秒 |
| 调度器两个负载计数 | ✅ 已确认 | 本版本无写入点，恒为 0；评分实际只取负载比项 |
| `runtime_kind` 取值 | ✅ 已确认 | 自由字符串，代码不做值匹配；当前部署为 `docker` |
| 主 API 鉴权策略 | ✅ 已确认 | 路由无鉴权中间件；仅 worker 内部接口校验 `X-Internal-Token` |
| `test_endpoints` 作用 | ✅ 已确认 | 仅为 serde 字段，无消费点；不控制路由、参数或日志 |
| 粘滞键的拼接字段 | ✅ 已确认 | `vm_id` + `session_id`，不含租户；分隔符未定但不影响等价 |
| system 注入模式 | ✅ 已确认 | 二值 `zero` / `identity`；内核不拼接文本，见 5.2.7 |
| `tool_result` 负载上限 | ✅ 已确认 | 默认 4 MiB，由 `MAX_TOOL_RESULT_BYTES` 控制 |
| `metadata.user_id` 结构 | ✅ 已确认 | `device_id` / `account_uuid` 为空串，只有 `session_id` 有值 |
| 时区兜底 | ✅ 已确认 | `TZ` > `SLOT_TZ` > `America/New_York` |
| 凭据刷新责任 | ✅ 已确认 | worker 唯一刷新；内核只判定，见 `06` 6.4.4 |
| 凭据读取时机 | ✅ 已确认 | 每个 Messages 请求重读一次，见 `06` 6.4.4 |
| 会话头优先级 | ✅ 已确认 | `metadata` > `x-claude-code-session-id` > `x-session-id` > `x-conversation-id`，见 5.2.2 |
| worker 健康接口 | ✅ 已确认 | `GET /internal/health`，见 5.4.5 |
| OpenAI `finish_reason` | ✅ 已确认 | 三值映射，见 5.2.5 |

以上条目均有静态或运行时证据，没有遗留未确认项。

实现时应：

- 按 5.5.3 的排序键实现槽位选择；
- 粘滞键使用 `vm_id + session_id`，不要引入租户维度；
- 把两个 TTL 做成配置项，缺省值分别为 600 秒与 86400 秒；
- 评分只实现负载比项，负载分量保留为 0；
- 主 API 不实现鉴权，worker 内部接口校验 `X-Internal-Token`；
- 不依赖 `x-generation` 等主 API 专属头；
- 凭据刷新放在 worker，不要让内核或 CLI 代劳。

### 5.11.1 结论来源与覆盖范围

粘滞键的字段语义以运行时参数顺序为准，不依赖生产环境。
记录见归档材料 11.11。

背压与看门狗的缺省值和判定顺序来自接口行为核对，
核对方法与覆盖范围见归档材料的覆盖报告与 11.12。

本说明书的证据与方法见归档材料 11.13。
