# 6. 配置与凭据规范

本文定义 `kin-kernel` 的配置来源、字段约束、环境变量、凭据文件与
代理规则。ARM64 实现必须与本文一致。

状态标记：

| 标记 | 含义 |
| --- | --- |
| ✅ | 已确认（多来源一致） |
| ◐ | 已确认主体，个别默认值待定 |
| ○ | 尚未确认，实现前需补齐 |

## 6.1 配置来源

| 来源 | 说明 |
| --- | --- |
| 命令行 `--config <path>` | 主进程显式指定配置文件 |
| 环境变量 `KERNEL_CONFIG` | 未指定 `--config` 时的配置文件路径 |
| 默认路径 | `/run/guest/kernel.json` |

优先级：`--config` > `KERNEL_CONFIG` > 默认路径。

配置文件为 JSON。启动时读取一次；运行期热更新行为见 6.6。

## 6.2 配置字段

`WorkerConfig` 共 27 个字段。以下按已确认的声明顺序列出。

字段顺序与名称已完整确认；类型与默认值按可验证程度标注。

| # | 字段 | 类型 | 约束 / 默认 | 状态 |
| --- | --- | --- | --- | --- |
| 0 | `vm_id` | string | 必填，空值报 `vm_id is required` | ✅ |
| 1 | `socket_path` | string | 默认 `/run/guest/worker.sock`；必须是绝对路径 | ✅ |
| 2 | `credential_path` | string | 默认 `/home/guest/.claude/credentials.json`；绝对路径 | ✅ |
| 3 | `proxy_url` | string | SOCKS5 地址；`socks5://` / `socks5h://` | ✅ |
| 4 | `proxy_required` | bool | 为 `true` 时 `proxy_url` 不能为空 | ✅ |
| 5 | `anthropic_base_url` | string | 默认 `https://api.anthropic.com`；必须 HTTPS。仅用于 worker 配置校验；`anthropic_api` 模式的上游地址是编译期常量，不受此字段影响 | ✅ |
| 6 | `oauth_token_url` | string | 默认 `https://platform.claude.com/v1/oauth/token` | ✅ |
| 7 | `internal_token` | string | 必填；空值报 `internal_token is required` | ✅ |
| 8 | `refresh_skew_seconds` | integer | 凭据刷新提前量，非负 | ✅ |
| 9 | `request_timeout_seconds` | integer | 上游整体请求超时；**0 表示不限制** | ✅ |
| 10 | `first_byte_timeout_seconds` | integer | 首字节超时，默认 600 | ✅ |
| 11 | `idle_timeout_seconds` | integer | job 空闲超时，默认 180 | ✅ |
| 12 | `max_request_bytes` | integer | 请求体上限，正数 | ✅ |
| 13 | `max_response_bytes` | integer | 响应体上限，正数 | ✅ |
| 14 | `max_event_bytes` | integer | 单个 SSE 事件上限，正数 | ✅ |
| 15 | `delivery_mode` | string | `realtime` 或 `verified` | ✅ |
| 16 | `test_endpoints` | bool | 反序列化后无消费点；保留原值即可 | ✅ |
| 17 | `runtime_kind` | string | 运行时类型标签，自由字符串，不作取值校验 | ✅ |
| 18 | `provider` | string | `anthropic_api` 或 `local_cli` | ✅ |
| 19 | `claude_bin` | string | CLI 可执行文件路径 | ✅ |
| 20 | `slots_per_worker` | integer | 1–20 | ✅ |
| 21 | `https_proxy` | string | HTTP CONNECT 代理；`http://` / `https://`，回环 | ✅ |
| 22 | `system_layout` | string | 固定 `zero`（写入环境变量） | ✅ |
| 23 | `timezone` | string | 例如 `Asia/Taipei` | ✅ |
| 24 | `cli_version` | string | CLI 版本，默认 `2.1.296` | ✅ |
| 25 | `default_cache_ttl` | string | 仅 `5m` / `1h`；默认 `1h` | ✅ |
| 26 | `session_idle_ttl_seconds` | integer | 1–86400；缺省 600 | ✅ |

### 6.2.1 校验消息对照

| 条件 | 消息 |
| --- | --- |
| `vm_id` 为空 | `vm_id is required` |
| `internal_token` 为空 | `internal_token is required` |
| `proxy_required=true` 且 `proxy_url` 为空 | `proxy_required but proxy_url is empty` |
| `proxy_url` 协议错误 | `proxy_url scheme must be socks5 or socks5h, got "<value>"` |
| `https_proxy` 协议错误 | `https_proxy scheme must be http or https, got "<value>"` |
| `https_proxy` 非回环 | `https_proxy host must be loopback` |
| `provider` 取值错误 | `provider must be anthropic_api or local_cli, got "<value>"` |
| `PROVIDER` 环境变量错误 | `unsupported PROVIDER: <value>` |
| `delivery_mode` 取值错误 | `delivery_mode must be realtime or verified, got "<value>"` |
| `default_cache_ttl` 取值错误 | `default_cache_ttl must be 5m or 1h, got "<value>"` |
| `slots_per_worker` 越界 | `slots_per_worker must be 1..=20` |
| `slots_per_worker` 超上限 | `Claude official subagent cap is 20; SLOTS_PER_WORKER must be <= 20` |
| `slots_per_worker` 非正 | `slots_per_worker must be positive` |
| `worker_count` 非正 | `worker_count must be positive` |
| `session_idle_ttl_seconds` 越界 | `session_idle_ttl_seconds must be 1..=86400` |
| 路径非绝对 | `<field> must be absolute` |
| 数值字段为零 | `<field> cannot be set to 0`（不适用于 `request_timeout_seconds`） |
| 数值字段为负 | `<field> must be positive` |
| 端点协议错误 | `endpoint must use https` |
| Anthropic 基址错误 | `invalid Anthropic base URL` |

启动失败时进程退出，不监听端口。

### 6.2.2 生产配置实例

当前部署的 `/run/kin/kernel.json` 关键取值：

| 字段 | 值 |
| --- | --- |
| `delivery_mode` | `realtime` |
| `provider` | `local_cli` |
| `runtime_kind` | `docker` |
| `slots_per_worker` | 20 |
| `session_idle_ttl_seconds` | 600 |
| `refresh_skew_seconds` | 300 |
| `request_timeout_seconds` | 0（不限制） |
| `first_byte_timeout_seconds` | 600 |
| `idle_timeout_seconds` | 180 |
| `max_request_bytes` | 33554432（32 MiB） |
| `max_response_bytes` | 67108864（64 MiB） |
| `max_event_bytes` | 33554432（32 MiB） |
| `cli_version` | `2.1.296` |

这些值是配置加载后的有效默认值，ARM64 实现应提供同样的填充行为。

必填字段只有两个：

| 字段 | 缺失时 |
| --- | --- |
| `vm_id` | 报错 `vm_id is required` |
| `internal_token` | 报错 `internal_token is required` |

其余字段缺失时按上表填充。数值字段还会做范围校验：

```text
slots_per_worker          1–20
session_idle_ttl_seconds  1–86400
system_layout             zero / identity
```

超出范围时启动失败，不降级为默认值。

## 6.3 环境变量

### 6.3.1 内核自身

| 变量 | 作用 |
| --- | --- |
| `PROVIDER` | `anthropic_api` / `local_cli` |
| `SLOTS_PER_WORKER` | 每 worker 槽位数，1–20 |
| `ANTHROPIC_API_KEY` | `PROVIDER=anthropic_api` 时必填 |
| `KERNEL_CONFIG` | 配置文件路径 |
| `CLAUDE_BIN` | CLI 可执行文件路径 |
| `CLI_MODEL` | 默认模型 |
| `MULTIPLEX_SIMULATE` | 仿真模式开关 |
| `SIMULATE_LATENCY_MS` | 仿真延迟 |
| `SUBMIT_WAIT_MS` | 提交等待时间 |
| `SESSION_IDLE_TTL_SECS` | 会话空闲回收时间 |
| `JOB_IDLE_SECS` | job 空闲超时，默认 180 |
| `CANCEL_ACK_SECS` | 取消确认超时，默认 30 |
| `CLIENT_STALL_SECS` | 客户端停顿超时，默认 30 |
| `MEM_SOFT_BYTES` | 内存软上限 |
| `MEM_DRAIN_BYTES` | 内存回收阈值 |
| `MAX_INFLIGHT_PAYLOAD` | 在途负载上限 |
| `MAX_PENDING` | 待处理队列上限 |
| `DEFAULT_TENANT` | 缺省租户标识（仅主 API 模式） |
| `EXPOSE_SLOT_HEADER` | 是否在响应中暴露槽位头（仅主 API 模式） |
| `DESIRED_CONFIG_HASH` | 控制面下发的配置哈希 |
| `HTTP_BRIDGE_ADDR` | HTTP → SOCKS 桥监听地址 |
| `HTTP_TO_SOCKS` | 桥接脚本路径 |
| `ENVELOPE_PATH` | 信封持久化文件路径 |
| `TZ` / `SLOT_TZ` | 时区来源，`TZ` 优先 |

`DEFAULT_TENANT` 与 `EXPOSE_SLOT_HEADER` 属于主 API 模式的
`Config::from_env`，`--gateway-worker` 形态不读取。
当前生产部署没有设置这两个变量，worker 模式也不依赖它们的取值。

缺省值：

| 变量 | 缺省 |
| --- | --- |
| `DEFAULT_TENANT` | 空字符串 |
| `EXPOSE_SLOT_HEADER` | `true` |
| `ENVELOPE_PATH` | `/tmp/cli/envelope.json` |
| `TZ` | 未设置时依次回退 `SLOT_TZ`，再回退 `America/New_York` |

`ENVELOPE_PATH` 与 `TZ` 的兜底值都是程序内固定常量，
无法通过配置文件覆盖，只能通过环境变量替换。

指向的文件是一个两字段 JSON：

```json
{
  "system_layout": "zero",
  "timezone": "Asia/Taipei"
}
```

| 字段 | 取值 | 缺失或非法时 |
| --- | --- | --- |
| `system_layout` | `zero` / `identity` | 按 `zero` 处理 |
| `timezone` | IANA 时区名 | 回退 `TZ` → `SLOT_TZ` → `America/New_York` |

加载顺序：

```text
读 ENVELOPE_PATH
  → 文件不存在或 JSON 非法 → 全部用默认值
  → 字段逐个校验，非法的字段单独回退，不影响另一个字段
```

该文件与 `/internal/v1/messages` 请求体里的 `Envelope` **不是同一个
结构**：前者是运行时配置，只有两个字段；后者是单请求信封，共八个
字段（见 `05` 5.4.1）。

### 6.3.2 传给 CLI 宿主

内核启动 CLI 宿主时设置：

```text
CLAUDE_CODE_DISABLE_TELEMETRY=1
CLAUDE_CODE_ENTRYPOINT=sdk-cli
CLAUDE_CODE_ENVELOPE=zero
CLAUDE_CODE_GATEWAY_HINT_HEADERS=1
CLAUDE_CODE_HOST_REFRESH=1
CLAUDE_CODE_NATIVE_SLOTS=<slots_per_worker>
CLAUDE_CODE_SYSTEM_LAYOUT=zero
CLAUDE_CODE_TIMEZONE=<timezone>
CLAUDE_CODE_VERSION=<cli_version>
CLAUDE_CONFIG_DIR=<配置文件所在目录>
JOB_IDLE_SECS=<idle_timeout_seconds>
KERNEL_CONFIG=<配置文件路径>
SYSTEM_MODE=zero
```

### 6.3.3 代理

| 变量 | 说明 |
| --- | --- |
| `HTTPS_PROXY` / `HTTP_PROXY` | HTTP CONNECT 代理 |
| `NO_PROXY` | 默认 `127.0.0.1,localhost` |
| `BRIDGE_HTTPS_PROXY` | 当出口为 SOCKS5 时使用 |
| `proxy_url`（配置） | SOCKS5 出口 |

规则：

- `https_proxy` 只接受 `http` / `https`，且主机必须是回环地址；
- `proxy_url` 只接受 `socks5` / `socks5h`；
- CLI 宿主不能直接把 SOCKS5 当作 `HTTPS_PROXY`；必须由桥接进程
  转换（错误消息：`Claude CLI cannot use SOCKS5 as HTTPS_PROXY;
  set BRIDGE_HTTPS_PROXY to an HTTP CONNECT bridge`）。

### 6.3.4 出口必须经过控制面配置的代理（IPv4）

宿主机按槽位 UID 用 iptables（`KEG<proxy_id>` 链）把 TCP 全部 REDIRECT 到该槽位
代理的**本地 IPv4 监听**（`127.0.0.1:<port>`，由控制面写在 `vms/<id>.json` 的
`proxy` 里），DNS 也走同一链。这套重定向只覆盖 IPv4。

因此：

| 组件 | 规则 |
| --- | --- |
| 原生 CLI / 原生内核（Go 出站） | 统一 `tcp4`：`native-slot/internal/netx` 强制 IPv4（`KIN_EGRESS_IPV4=0` 仅供排障放开）。每个出站连接都会落进 `KEG*` 链，不会出现绕过代理的 IPv6 直连 |
| kin-egress（出口代理本体） | 到上游一律 `tcp4`；SOCKS 目标是域名且 scheme 为 `socks5://` 时**本地解析 A 记录**后按 IPv4 下发，`socks5h://` 保持代理解析语义；显式 IPv6 目标直接拒绝 |
| 后果 | 若上游只有 AAAA 记录，请求会明确失败而不是偷偷直连（现场：`dial tcp [2607:6bc0::10]:443: connect: network is unreachable`） |

排查顺序：先看 `iptables -t nat -S | grep KEG` 有没有该槽位的链，再看
`ss -lntp | grep <port>` 代理是否在 IPv4 环回上监听，最后才看 CLI 侧。

## 6.4 凭据

### 6.4.1 文件

默认路径：`/home/guest/.claude/credentials.json`。

支持两种结构：

```json
{"anthropicApiKey": {"apiKey": "sk-ant-..."}}
```

```json
{
  "claudeAiOauth": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresAt": 1760000000000
  }
}
```

字段解析按「找到第一个可用字符串」处理，类型名做归一化。

类型名归一化的白名单（比较前先 `trim`）：

| 规范值 | 含义 |
| --- | --- |
| `apikey` | API Key |
| `api-key` | API Key 的连字符写法 |
| `console` | 控制台登录令牌 |
| `inference` | 推理专用令牌 |
| `setup-token` | 初始化令牌 |

归一化只做 `trim`，**不改写**字符串：`api-key` 保持为 `api-key`。

认证方式只由归一化后的字面量决定：

| 归一化结果 | 请求头 |
| --- | --- |
| `apikey` | `x-api-key: <token>` |
| 其他任意值（含 `api-key`、`console`、`inference`、`setup-token`、未知值） | `Authorization: Bearer <token>` |

白名单仅表示「已知类型」，未知值不会被拒绝，同样走 Bearer 分支。

### 6.4.2 判定

| 判定 | 规则 |
| --- | --- |
| 是否 Bearer | OAuth 访问令牌使用 `Authorization: Bearer`；API Key 使用 `x-api-key` |
| 是否需刷新 | 距 `expiresAt` 小于 `refresh_skew_seconds` 时视为需要刷新 |
| 刷新端点 | `oauth_token_url`，默认 platform 的 OAuth token 端点 |
| 刷新失败 | 按认证错误上报，不重试无限循环 |

请求头设置：

- API Key：`x-api-key: <key>`，附 `anthropic-version: 2023-06-01`；
- OAuth：`Authorization: Bearer <token>`。

### 6.4.3 凭据缺失

- `PROVIDER=anthropic_api` 且无 `ANTHROPIC_API_KEY`：
  启动报 `ANTHROPIC_API_KEY is required for PROVIDER=anthropic_api`；
- `local_cli` 模式：由 CLI 宿主自行读取同一凭据文件。

### 6.4.4 刷新责任

刷新有唯一管理者：**worker 的 `Refresher.Ensure`**（Go 侧）。
推理路径与面板刷新都调用它，内核与 CLI 宿主都不发起刷新请求。

```text
worker/Refresher.Ensure   唯一刷新者：加锁 → 请求 token 端点 → 写回文件
内核                       只判定 needs_refresh，失败即 401
cli-node                   CLAUDE_CODE_HOST_REFRESH=1 时只重读磁盘
```

#### 各层判定规则

内核（`outbound_headers` 之前）：

```text
1. 归一化类型为 apikey      → 不需要刷新
2. expiresAt <= 0           → 不需要刷新
3. expiresAt - skew <= now  → 需要刷新
```

需要刷新或取不到 token 时直接返回：

```text
401 needs_refresh
credential needs refresh
```

本次请求立即失败，**不重试、不重读**。

worker 侧（`Credential.NeedsRefresh`）：

```text
1. IsAPIKey()                        → false
2. 凭据无效（Valid() 为假）          → true
3. official-setup-token 或无 refresh 的 setup-token
     expiresAt <= 0                  → false
     否则 expiresAt - skew <= now    → true
4. 其余（普通 oauth）
     expiresAt <= 0                  → true
     否则 expiresAt - skew <= now    → true
```

`refreshSkew` 默认 **5 分钟**。

**两边差异**：无 `expiresAt` 的普通 OAuth 凭据，
worker 认为需要刷新，内核认为不需要。这只会导致内核继续用旧 token，
不会阻塞 worker 的刷新。

#### CLI 宿主行为

由 `CLAUDE_CODE_HOST_REFRESH` 决定：

| 取值 | 行为 |
| --- | --- |
| 真值 | 清空内存缓存与钥匙串缓存，从磁盘重读；只有磁盘 token 已变且未过期才视为成功 |
| 未设置 | 宿主自行刷新：加文件锁，`ELOCKED` 时最多重试 5 次 |

宿主模式下重读一次失败即返回失败，不重试。

#### 常见误配

若实现成「内核或 CLI 自行刷新」，与现有分工不符：

```text
正确：Go worker 刷新 → 写回凭据文件
     内核只判定 → 401 needs_refresh
     cli-node 只重读（CLAUDE_CODE_HOST_REFRESH=1）
```

ARM64 重写必须保留这个分工。若重写版没有 Go worker，
需要自己实现等价的刷新循环，并保证写盘后内核能读到新 token。

#### 类型归一化的不一致

Go 侧 `NormalizeType` 把 `api-key`、`console` 归到 `apikey`，
把 `inference` 归到 `official-setup-token`；
内核只做 `trim`，仅字面量 `apikey` 走 `x-api-key`。

因此写盘时 `type` 应写成内核能识别的**字面量**，否则会出现
「worker 认为是 API Key、内核却按 Bearer 发送」的错配。

#### 读取时机

**内核每个 Messages 请求都会重新读取凭据文件**，不持有启动时的快照：

```text
POST /v1/messages
  → process_messages
      → Credential::load(credential_path)   ← 每次请求
```

`GET /internal/health` 也读取一次，用于计算凭据状态与 `unhealthy_reason`。

`credential_path` 缺省为 `/home/guest/.claude/credentials.json`。
读取失败与解析失败分别产生 `read credentials: ...` 与
`decode credentials: ...` 错误。

这意味着 worker 刷新并写回文件后，内核的下一次请求即可看到新 token，
不需要重启或额外通知。

## 6.5 启动参数

```text
kin-kernel [--config <path>]
kin-kernel --gateway-worker [--config <path>]
```

| 参数 | 作用 |
| --- | --- |
| `--config <path>` | 配置文件路径 |
| `--gateway-worker` | 以内部 worker 模式运行（不监听 TCP） |
| `--assertion <value>` | 断言相关参数（内部用途） |

未知参数报 `unknown argument: <value>` 并退出。

## 6.6 热更新边界

| 操作 | 是否生效 | 说明 |
| --- | --- | --- |
| 修改配置文件后重启进程 | ✅ | 全部字段重新加载 |
| 运行期修改 `timezone` | ❌ | 已启动的 CLI 宿主不重建 |
| 运行期修改 `slots_per_worker` | ❌ | 需重启 |
| 控制面下发 `DESIRED_CONFIG_HASH` | ✅ | 触发槽位就绪状态重算 |
| 面板手动修改时区 | ❌ | 只写配置文件，等待下次重启 |

实现建议：配置只在进程启动时解析一次，运行期变更通过显式重启
或控制面指令生效，避免出现半更新状态。

### 6.6.1 CLI 宿主从同一份 kernel.json 读取的面板键

`WorkerConfig` 的 27 个字段之外，CLI 宿主还会读下列键（内核不校验、只透传文件）。
它们每次请求都重读同一份文件（`KERNEL_CONFIG` 优先，默认
`/run/kin/kernel.json`），读失败时沿用上一次的值：

| 键 | 类型 | 缺省 / 语义 |
| --- | --- | --- |
| `default_cache_ttl` | string | `5m` / `1h`；仅当请求内已存在显式 TTL 时才用于补全 |
| `cch_enabled` | bool | 键缺失视为 `true`；控制计费头 cch 是否回填 |
| `cached_microcompact_enabled` | bool | 键缺失重置为 `false`；为 `true` 时本构建必错（见下） |
| `auto_compact_window` | integer | 100000–1000000；由官方 CLI 的自动压缩使用 |
| `credential_path` | string | 凭据文件候选路径之一 |

`cached_microcompact_enabled=true` 时，本 CLI 构建（官方 2.1.296 基线 +
kin 补丁）没有 cache-editing 实现（`cachedMicrocompactRuntime.implementation()`
恒返回 `null`），因此**每条** `messages` 请求都以
`cached_microcompact_unavailable` 结束：

```json
{"type":"job_error","code":"cached_microcompact_unavailable",
 "status":400,"error_type":"invalid_request_error",
 "error":"cached_microcompact_unavailable: enabled in kernel.json, but this CLI build has no cache-editing implementation"}
```

这条错误发生在建请求之前，不会发往上游；面板因此不得把它当性能开关默认打开。
`auto_compact_window` 只影响 CLI 自己的压缩阈值，不进上游请求体（请求里的
`auto_compact_window` 字段同样在出站前被删除）。

原生实现目前没有本地压缩，所以只做「删除字段」这一半；`auto_compact_window`
与 `cached_microcompact_enabled` 读取器已按上表语义实现。

## 6.7 配置样例

```json
{
  "vm_id": "kin-03",
  "socket_path": "/run/guest/worker.sock",
  "credential_path": "/home/guest/.claude/credentials.json",
  "internal_token": "<random>",
  "provider": "local_cli",
  "slots_per_worker": 4,
  "worker_count": 1,
  "timezone": "Asia/Taipei",
  "idle_timeout_seconds": 180,
  "first_byte_timeout_seconds": 600,
  "delivery_mode": "realtime",
  "system_layout": "zero",
  "cli_version": "2.1.296",
  "default_cache_ttl": "1h",
  "claude_bin": "/opt/claude/cli-node",
  "anthropic_base_url": "https://api.anthropic.com",
  "oauth_token_url": "https://platform.claude.com/v1/oauth/token"
}
```

## 6.8 缺省值说明

字段名称与顺序已全部确认，27 个字段的含义均已定位。

缺省行为分三类：

| 类别 | 字段 | 说明 |
| --- | --- | --- |
| 有明确缺省 | `session_idle_ttl_seconds` | 600 |
| 有明确缺省 | `first_byte_timeout_seconds` | 600 |
| 有明确缺省 | `idle_timeout_seconds` | 180 |
| 有明确缺省 | `cli_version` | `2.1.296` |
| 允许 0 | `request_timeout_seconds` | 0 表示不限制，生产即为此值 |
| 由配置显式给出 | 其余数值字段 | 生产实例见 6.2.2 |

已确认、无需再采集的项：

- `runtime_kind` 为自由字符串，代码不做取值匹配；
- `test_endpoints` 没有消费点，不控制路由、参数或日志；
- `delivery_mode` 的两种取值差异见 `05_KERNEL_IMPLEMENTATION.md` 5.2.5；
- `DEFAULT_TENANT` / `EXPOSE_SLOT_HEADER` 仅主 API 模式使用，
  worker 形态不读取；缺省分别为空字符串与 `true`。
