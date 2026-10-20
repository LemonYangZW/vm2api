# 2. CLI 宿主接口规格

本文定义 `kin-kernel` 与 `cli-host` 之间的子进程接口。
CLI 宿主必须严格实现本文的帧格式与校验规则。

内核侧的调度与生命周期见 `05_KERNEL_IMPLEMENTATION.md`；
配置与凭据见 `06_CONFIG_AND_CREDENTIALS.md`。

## 2.1 传输

| 项 | 规格 |
| --- | --- |
| 方向 | 内核 → CLI：stdin；CLI → 内核：stdout |
| 编码 | UTF-8 JSON |
| 分帧 | 每行一个 JSON 对象，以 `\n` 结尾（NDJSON） |
| 标签 | 两种帧都以 `"type"` 字段区分变体 |
| 日志 | stderr，不影响协议 |

约束：

- 每行必须是**完整**的一个 JSON 对象，不得跨行；
- 写入 stdout 时必须串行，避免多槽位并发写导致行交错；
- 未识别的 `type` 由接收方静默丢弃；
- CLI 宿主的 stdin 必须保持打开：stdin 提前 EOF 会让宿主在输出握手前退出。

## 2.2 启动

### 2.2.1 激活条件

内核通过环境变量 `CLAUDE_CODE_NATIVE_SLOTS` 指定槽位数量：

```text
1 <= n <= 20
```

值为空、非数字或小于 1 时，CLI 宿主不进入槽位模式。
进入槽位模式后，应先设置以下进程环境：

```text
CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK = "1"
CLAUDE_CODE_ENTRYPOINT = "sdk-cli"
USER_TYPE               = USER_TYPE || "external"
CLAUDE_CODE_VERSION     = CLAUDE_CODE_VERSION || "2.1.296"
```

### 2.2.2 `host_ready`

CLI 启动后**必须首先**输出：

```json
{
  "type": "host_ready",
  "protocol_version": 2,
  "slots": 2,
  "system_layout": "zero",
  "timezone": "Asia/Taipei",
  "capabilities": ["multi_slot", "native_sse", "stateless",
                   "ping", "classifier_request_context"],
  "config_hash": "optional"
}
```

字段说明：

| 字段 | 类型 | 要求 |
| --- | --- | --- |
| `protocol_version` | 整数 | 必须为 `2` |
| `slots` | 整数 | 槽位数量，1–20 |
| `system_layout` | 字符串 | 必须为 `"zero"` |
| `timezone` | 字符串 | 必须回显内核传入的 `CLAUDE_CODE_TIMEZONE` |
| `capabilities` | 字符串数组 | 至少包含三项必需能力 |
| `config_hash` | 字符串，可选 | 内核不校验，可省略 |

### 2.2.3 握手校验规则

内核按以下顺序校验，任一项失败即拒绝注册槽位、不监听 socket：

| 校验项 | 规则 |
| --- | --- |
| 协议版本 | 精确等于 `2` |
| 系统布局 | 精确等于 `"zero"` |
| 必需能力 | 包含 `multi_slot`、`native_sse`、`stateless` |
| 可选能力 | `ping`、`classifier_request_context` 可省略 |
| 能力顺序 | 不敏感 |
| 时区 | 与内核期望值完全一致 |
| 配置哈希 | 不校验 |

失败时内核记录：

```text
native host ready validation failed, refusing to register slots
```

时区期望值的来源优先级：

```text
kernel.json 的 timezone
  → 容器环境 TZ
  → 容器环境 SLOT_TZ
  → 内核兜底 America/New_York
```

最后一档是内核程序内的固定值，无法通过配置关闭。部署时必须
显式提供 `timezone` 或 `TZ`，否则内核会按 `America/New_York`
向宿主下发 `CLAUDE_CODE_TIMEZONE`，与国内部署要求不一致。

CLI 宿主应从 `CLAUDE_CODE_TIMEZONE` 读取并**原样回显**，
不要写死 `UTC` 或自行转换。

### 2.2.4 `slot_ready`

握手成功后，为每个槽位发送一次：

```json
{"type":"slot_ready","slot_id":"s00"}
{"type":"slot_ready","slot_id":"s01"}
```

槽位编号格式：`s` + 两位十进制补零（`s00` … `s19`）。

## 2.3 内核 → CLI 帧

### 2.3.1 `job_start`

```json
{
  "type": "job_start",
  "job_id": "job_a4bcc046bf4c48fe971c1ae45ee82a64",
  "slot_id": "s00",
  "request": {
    "model": "claude-sonnet-5-5",
    "max_tokens": 8192,
    "stream": true,
    "system": ["..."],
    "messages": [{"role": "user", "content": "hi"}],
    "metadata": {
      "user_id": "{\"account_uuid\":\"\",\"device_id\":\"\",\"session_id\":\"...\"}"
    },
    "wireMessages": true
  },
  "request_context": {
    "purpose": "auto_mode_classifier",
    "format": "xml",
    "stage": "xml_s1"
  }
}
```

字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `job_id` | 是 | `job_` + 32 位小写十六进制 |
| `slot_id` | 是 | 目标槽位 |
| `request` | 是 | Anthropic Messages 请求体 |
| `request_context` | 否 | 分类器上下文，为 `null` 时整个字段省略 |

`request.metadata.user_id` 是**JSON 字符串**，内部包含
`account_uuid`、`device_id`、`session_id`。CLI 宿主应从中解析
`session_id` 并用于会话隔离；解析失败则按无会话处理。

`request_context` 的合法取值：

| 条件 | 要求 |
| --- | --- |
| `purpose` | 必须为 `"auto_mode_classifier"` |
| `format` | `"tool"` 或 `"xml"` |
| `format="tool"` | `tool_choice.name = "classify_result"`，且 `tools` 中存在同名工具 |
| `format="xml"` | `stage` 为 `xml_s1` / `xml_s2` / `fast` 或省略，`tool_choice` 省略，`messages` 含 `<transcript>` |

非法时回 `job_error`：

```json
{"type":"job_error","job_id":"...","slot_id":"s00",
 "error":"Invalid classifier request context",
 "code":"invalid_request_context","status":400,
 "error_type":"invalid_request_error"}
```

### 2.3.2 `cancel`

```json
{"type":"cancel","job_id":"job_a4bc...","slot_id":"s00"}
```

CLI 宿主应：

1. 中止该槽位上匹配的 job（关闭上游连接）；
2. 等待任务清理完成；
3. 返回 `cancel_ack`。

无论是否匹配到任务，都**必须**返回 `cancel_ack`。

### 2.3.3 `ping`

```json
{"type":"ping","nonce":"ping_8241f37289bc4772bb247b0b86da0efc"}
```

- `nonce` 为字符串：`ping_` + 32 位小写十六进制；
- CLI 宿主必须原样回 `pong`。

## 2.4 CLI → 内核帧

### 2.4.1 `stream_event`

```json
{"type":"stream_event","job_id":"job_...","slot_id":"s00",
 "event":{"type":"content_block_delta","index":0,
          "delta":{"type":"text_delta","text":"hello"}}}
```

`event` 为上游 SSE 的原始事件对象。内核按 Anthropic Messages 事件
语义消费，并转换成客户端 SSE。

需要支持的事件：

| `event.type` | 关键字段 |
| --- | --- |
| `message_start` | `message` |
| `content_block_start` | `index`、`content_block` |
| `content_block_delta` | `index`、`delta`（`text_delta` / `input_json_delta`） |
| `content_block_stop` | `index` |
| `message_delta` | `delta.stop_reason`、`usage` |
| `message_stop` | — |

此外在流结束后发送一条自定义事件，用于传递限流信息：

```json
{"type":"stream_event","job_id":"...","slot_id":"s00",
 "event":{"type":"response_headers",
          "headers":{"anthropic-ratelimit-requests-remaining":"99",
                     "retry-after":"0","request-id":"req_..."}}}
```

只传递以下响应头：

```text
anthropic-ratelimit-*
retry-after
request-id
```

### 2.4.2 `job_done`

```json
{"type":"job_done","job_id":"job_...","slot_id":"s00",
 "stop_reason":"","usage":{}}
```

| 字段 | 规则 |
| --- | --- |
| `usage` | 可为 `null` 或省略 |
| `stop_reason` | **必填字符串**，不可为 `null` |

内核从 `stream_event` 汇总真实的 `usage` 与 `stop_reason`，
本帧中的值不会被直接采用；但 `stop_reason` 的类型必须合法，
否则整帧会被判为未识别并丢弃。

### 2.4.3 `job_error`

```json
{
  "type": "job_error",
  "job_id": "job_...",
  "slot_id": "s00",
  "error": "upstream overloaded",
  "code": "upstream_overloaded",
  "status": 529,
  "error_type": "overloaded_error",
  "retry_after": "5",
  "upstream_code": "overloaded",
  "request_id": "req_..."
}
```

| 字段 | 规则 |
| --- | --- |
| `error` | **必须是字符串**；对象、`null` 或省略都会令整帧被丢弃 |
| `code` | 错误分类，建议使用下表取值 |
| `status` | HTTP 状态码 |
| `error_type` | Anthropic 错误类型 |
| `retry_after` | 可选，来自响应头 |
| `upstream_code` | 可选，上游错误码，建议截断 100 字符 |
| `request_id` | 可选，建议截断 200 字符 |

### 2.4.4 `cancel_ack`

```json
{"type":"cancel_ack","job_id":"job_...","slot_id":"s00"}
```

必须在收到 `cancel` 后 **30 秒内**返回，否则内核会重发取消并重启
CLI 宿主。

### 2.4.5 `pong`

```json
{"type":"pong","nonce":"ping_8241f37289bc4772bb247b0b86da0efc"}
```

`nonce` 与收到的 `ping` 完全一致。

## 2.5 槽位调度

```text
idle ──job_start──> running ──job_done / job_error──> idle
                      │
                      └──cancel──> cancelling ──任务结束──> idle
```

规则：

- 同一槽位同时只允许一个 job；
- 槽位忙时回：

```json
{"type":"job_error","job_id":"...","slot_id":"s00",
 "error":"slot s00 busy phase=running",
 "code":"cli_error","status":502,"error_type":"api_error"}
```

- 槽位不存在时回同样结构，`error` 为 `unknown slot sXX`；
- 不同槽位并行处理，互不阻塞。

## 2.6 超时与健康检查

| 名称 | 默认 | 触发 |
| --- | --- | --- |
| `JOB_IDLE_SECS` | 180 秒 | job 运行中超过该时长没有任何 CLI 帧 |
| `CANCEL_ACK_SECS` | 30 秒 | `cancel` 后未收到 `cancel_ack` |
| `CLIENT_STALL_SECS` | 30 秒 | 客户端停顿阈值 |

超时行为：

1. 触发 `JOB_IDLE_SECS` 时，内核发送 `ping` 与 `cancel`；
2. 在等待期间约每 10 秒重发一次 `ping`；
3. 收到 `pong` 后停止重复 `ping`，但不会撤销已排定的 `cancel`；
4. `CANCEL_ACK_SECS` 内未收到 `cancel_ack`，内核关闭槽位并重启 CLI 宿主。

CLI 宿主必须实现 `pong` 与 `cancel_ack`，否则会被判定为失联。

## 2.7 错误分类

本表用于 CLI 宿主上报的错误（`local_cli` 模式）。`anthropic_api`
模式的错误码见 `05` 5.3.1，两者不通用。

| 上游状态 | `code` | `error_type` |
| --- | --- | --- |
| 529 / `overloaded_error` | `upstream_overloaded` | `overloaded_error` |
| 429 | `upstream_rate_limit` | `rate_limit_error` |
| 401 | `upstream_auth_error` | `authentication_error` |
| 403 | `upstream_auth_error` | 上游类型或 `permission_error` |
| 408 / 504 | `upstream_timeout` | `timeout_error` |
| 其他 4xx | `upstream_invalid_request` | `invalid_request_error` |
| 其他 5xx | `upstream_error` | `api_error` |
| 空流 | `upstream_empty_stream` | `api_error` |
| 网络中断，已收到事件 | `upstream_stream_interrupted` | `api_error` |
| 网络中断，未收到事件 | `upstream_network_error` | `api_error` |
| 其他内部错误 | `cli_error` | `api_error` |

## 2.8 完整交互示例

```text
CLI → 内核   host_ready {protocol_version:2, slots:2, system_layout:"zero", ...}
CLI → 内核   slot_ready {slot_id:"s00"}
CLI → 内核   slot_ready {slot_id:"s01"}

内核 → CLI   job_start {job_id:"job_...", slot_id:"s00", request:{...}}
CLI → 内核   stream_event {message_start}
CLI → 内核   stream_event {content_block_start}
CLI → 内核   stream_event {content_block_delta}
CLI → 内核   stream_event {content_block_stop}
CLI → 内核   stream_event {message_delta}
CLI → 内核   stream_event {message_stop}
CLI → 内核   job_done {job_id:"job_...", slot_id:"s00", stop_reason:"", usage:{}}
```
