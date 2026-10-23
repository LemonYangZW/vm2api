# 3. 上游调用行为规范

本文规定 CLI 宿主调用上游 Messages 服务时的请求构造、流式转发与
错误处理。目标是让上游收到的请求在客户端看来与标准 Claude 客户端一致。

2026-10-21 同步上游 1.3.205：文本块数组透传、缓存 TTL 补全条件和配置路径以本版为准。
三层实测补充：出站 Accept、毫秒 timeout、每请求 prompt ID 和 API Key 元数据门控见下文。

## 3.1 端点与认证

| 项 | 值 |
| --- | --- |
| 默认端点 | `https://api.anthropic.com/v1/messages` |
| OAuth 端点 | `https://platform.claude.com/v1/oauth/token` |
| 凭据文件 | `/home/kincli/.claude/credentials.json` |
| 传输 | HTTPS，SSE 流式响应 |
| HTTP 版本 | HTTP/2（可用时） |

凭据文件支持两种形式：

```json
{"anthropicApiKey": {"apiKey": "..."}}
{"claudeAiOauth": {"accessToken": "...", "refreshToken": "..."}}
```

OAuth 令牌过期时按凭据文件中的刷新信息换取新令牌。

## 3.2 请求头

### 3.2.1 固定头

每次请求携带：

```text
user-agent: claude-cli/<version> (external, <entrypoint>)
x-app: <cli | cli-bg>
anthropic-version: 2023-06-01
content-type: application/json
accept: application/json
```

`user-agent` 由三部分组成：

```text
claude-cli/           固定前缀
<version>             CLAUDE_CODE_VERSION，生产为 2.1.296
(external, <entrypoint>)
```

`entrypoint` 取 `CLAUDE_CODE_ENTRYPOINT`，槽位模式固定为 `sdk-cli`。
SDK 场景会在括号内追加 `, agent-sdk/<ver>`、`, client-app/<name>`、
`, workload/<name>`，槽位模式不追加。

`x-app` 取值：

| 条件 | 值 |
| --- | --- |
| `CLAUDE_CODE_SESSION_KIND=bg` | `cli-bg` |
| 其他 | `cli` |

请求类别头 `x-claude-code-request-class` 按请求来源推导：

| 来源 | 值 |
| --- | --- |
| `compact` | `compaction` |
| `side_reply` | `side_reply` |
| `repl_main_thread*` 或 `sdk` | `main` |
| `agent:*` 或 `hook_agent` | `subagent`（满足工作流条件时为 `workflow`） |
| 其他（含 `native_messages`） | `auxiliary` |

来源为空时不发这个头。槽位模式下：

```text
native_messages → x-claude-code-request-class: auxiliary
agent:kin       → x-claude-code-request-class: subagent
```

### 3.2.2 Stainless 兼容头

```text
x-stainless-lang: js
x-stainless-os: Linux
x-stainless-arch: x64
x-stainless-runtime: node
x-stainless-runtime-version: v26.3.0
x-stainless-package-version: 0.128.0
x-stainless-retry-count: 0
x-stainless-timeout: 600000
```

这是 SDK 已写入的毫秒值（默认 600000，随 `API_TIMEOUT_MS` 配置变化）；
指纹覆盖函数的缺省兜底值 600 不代表实际出站请求。

覆盖规则：

- 六个身份头（`lang` / `os` / `arch` / `runtime` / `runtime-version` /
  `package-version`）**强制覆盖**，无论调用方是否已设置；
- `retry-count` 与 `timeout` 只在缺失时写入；
- `user-agent` 只在缺失或包含 `Bun/`、`axios/` 时覆盖；
- `x-app` 只在缺失时写入。

> `x-stainless-arch` 固定 `x64`，与部署架构无关。这是上游侧的平台指纹，
> ARM64 重写也必须保持 `x64`。

### 3.2.3 连接方式

无代理时上游走 HTTP/2（undici `Agent({allowH2: true})`）；
检测到 `HTTPS_PROXY`、`HTTP_PROXY` 或 `ANTHROPIC_UNIX_SOCKET` 时改用
普通 fetch，即 HTTP/1.1。

### 3.2.4 Beta 头

Beta 不是一个固定列表，而是四步计算：

```text
1. 基础集合 = 模型能力决定的 beta（见 3.2.5）
2. kin 模式重排（见 3.2.6）
3. 追加调用方 betas
4. 按请求体字段动态追加协议 beta（见 3.2.7）
5. 再重排一次
```

最终以单行逗号分隔发送，无换行。

#### 3.2.5 基础集合

按模型顺时针判断，命中即加入：

| 条件 | beta |
| --- | --- |
| 非 legacy haiku | `claude-code-20250219` |
| Claude 订阅账号 | `oauth-2025-04-20` |
| 模型名含 `[1m]` | `context-1m-2025-08-07` |
| 支持交错思考 | `interleaved-thinking-2025-05-14` |
| 第一方且非 haiku | `thinking-token-count-2026-05-13` |
| 第一方、支持交错思考、交互会话且未开启思考摘要 | `redact-thinking-2026-02-12` |
| 支持上下文管理 | `context-management-2025-06-27` |
| 支持结构化输出且严格工具开启 | `structured-outputs-2025-12-15` |

legacy haiku 指模型名含 `haiku` 但不含 `haiku-5`。
第一方指 `provider` 为 `firstParty` 或 `foundry`，且未设置
`CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`。

槽位模式是非交互会话，因此 `redact-thinking-2026-02-12` 不会出现。

#### 3.2.6 kin 模式重排

`native_messages` 与 `agent:kin` 两种来源会调用重排：

```text
前置：OFFICIAL_MESSAGE_BETAS 中命中的项按该表顺序排在前面
后置：其余 beta 保持原有顺序追加
补充：OFFICIAL_EXTRA_BETAS 若缺失则先补入
```

`OFFICIAL_MESSAGE_BETAS`（顺序即排序键）：

```text
claude-code-20250219
oauth-2025-04-20
interleaved-thinking-2025-05-14
thinking-token-count-2026-05-13
context-management-2025-06-27
prompt-caching-scope-2026-01-05
mid-conversation-system-2026-04-07
per-turn-control-2026-07-01
mid-conversation-tool-changes-2026-07-01
effort-2025-11-24
```

`OFFICIAL_EXTRA_BETAS`：

```text
thinking-token-count-2026-05-13
mid-conversation-system-2026-04-07
```

#### 3.2.7 协议 beta

按请求体字段动态追加，重复不追加：

| 条件 | beta |
| --- | --- |
| 模型属于 per-turn 集合 | `per-turn-control-2026-07-01` |
| 模型属于工具变更集合 | `mid-conversation-tool-changes-2026-07-01` |
| `output_config.effort` 存在 | `effort-2025-11-24` |
| `thinking.display = "updates"` | `thinking-display-updates-2026-08-18` |
| `safeguards` 含 `dangerous_tool_use` | `dangerous-tool-use-2026-09-03` |
| `output_config.format` 存在 | `structured-outputs-2025-12-15` |
| `output_config.task_budget` 存在 | `task-budgets-2026-03-13` |
| `context_management` 存在 | `context-management-2025-06-27` |
| `speed = "fast"` 且模型支持 | `fast-mode-2026-02-01` |
| 工具 `strict = true` | `structured-outputs-2025-12-15` |
| 工具 `defer_loading` 或 `tool_search_tool_*` | `advanced-tool-use-2025-11-20` |
| `thinking.block_binding` 存在 | `thinking-binding-controls-2026-08-01` |
| `thread` 存在 | `message-threads-2026-08-12` |
| `thread` 存在且模型属于 mid-output-config 集合 | `mid-conversation-output-config-2026-07-01` |
| `diagnostics` 存在 | `cache-diagnosis-2026-04-07` |
| `fallbacks = "default"` | `server-side-fallback-2026-07-01` |
| `fallbacks` 为非空数组 | `server-side-fallback-2026-06-01` |
| `fallback_credit_token` 长度 1–2048 | `fallback-credit-2026-06-01` |
| `cache_control.evict_on_complete` | `prompt-caching-evict-2026-05-12` |
| 任一处使用 `ttl=1h` | `extended-cache-ttl-2025-04-11` |
| `messages` 含 `role=system` | `mid-conversation-system-2026-04-07` |
| `messages` 含 `clear_at` | `mid-conversation-system-clear-at-2026-08-21` |
| `messages` 含 `output_config` | `mid-conversation-output-config-2026-07-01` |
| `messages` 含 `output_config.effort` | `effort-2025-11-24` |
| `messages` 含 `output_config.format` | `structured-outputs-2025-12-15` |
| `messages` 含 `output_config.task_budget` | `task-budgets-2026-03-13` |

模型名在判断前会去掉 `[1m]` 后缀、`-YYYYMMDD` 日期后缀与 `provider/`
前缀。

`mid-output-config` 的模型集合（`MID_OUTPUT_CONFIG_MODELS`）只有：
`claude-haiku-5-5`、`claude-sonnet-5-5`、`claude-opus-5`、`claude-opus-5-5`、
`claude-fable-5-1`、`claude-mythos-5-1`。不在集合里时带 `thread` 只加
`message-threads`，不会拉出 `mid-conversation-output-config`。

#### 3.2.8 只有 inference scope 时

凭据 scope 不含 `user:profile`（典型来源是 `setup-token`）时，
整个 beta 头被替换为：

```text
oauth-2025-04-20,interleaved-thinking-2025-05-14,context-management-2025-06-27
```

legacy haiku 模型则为：

```text
oauth-2025-04-20,interleaved-thinking-2025-05-14
```

这种情况下**不发送** `claude-code-20250219`，也不做 kin 重排。
调用方 betas 仍会追加。

#### 3.2.9 生产典型值

订阅凭据、`claude-sonnet-5-5`、普通 Messages 请求：

```text
anthropic-beta: claude-code-20250219,oauth-2025-04-20,
interleaved-thinking-2025-05-14,thinking-token-count-2026-05-13,
context-management-2025-06-27
```

其余项是否出现取决于请求体字段与 feature gate，不能写死。

## 3.3 请求体

CLI 宿主**原样透传** `job_start.request` 的内容，不做消息重组。
两个例外是 `system` 与 `cache_control`：两者由宿主在发送前按
3.3.1 与 3.4 的规则加工，其余字段逐字节透传。

需要移除的仅限内核内部字段（如有）：

```text
wireMessages
wireBody
auto_compact_window
```

其余字段直接传给上游：

```text
model, messages, system, tools, tool_choice, thinking,
max_tokens, temperature, top_p, top_k, stop_sequences,
output_config, context_management, metadata, stream
```

### 3.3.1 系统提示

**内核不生成 system 文本。** `job_start.request.system` 是调用方的
原始值，可能缺失、可能是字符串、也可能是块数组。内核只透传，
不做拼接、不插入身份句、不改 `cache_control`。

本节描述 `local_cli` 模式。`anthropic_api` 模式没有 CLI 宿主，
调用方的 `system` 原样发给上游，不做任何布局加工。

最终发给上游的 system 由 CLI 宿主按下列优先级决定：

```text
1. 非分类器请求的 system 是非空数组，且每一项都是 text 为字符串的对象
   → 使用整个数组，仅对其中计费头块重置 cch=00000
2. 带 request_context（分类器场景）
   → classifierSystemBlocks(...)
3. SYSTEM_MODE / CLAUDE_CODE_SYSTEM_LAYOUT 不是 stock
   → 按布局生成（见下）
4. 其他
   → 官方默认布局
```

生产环境中内核总是设置 `SYSTEM_MODE`，因此第 3 条覆盖绝大多数请求。

#### 布局生成规则

布局只有两种，由 `SYSTEM_MODE` 决定（`CLAUDE_CODE_SYSTEM_LAYOUT`
优先，取值 `zero` / `identity` / `stock`）：

| 布局 | 生成的块序列 |
| --- | --- |
| `zero` | `[billing, environment]` |
| `identity` | `[billing?, IDENTITY, environment]` |

其中：

- `billing` 是计费头块。调用方已提供时沿用其内容并重写 `cch`；
  未提供时由 CLI 生成；
- `IDENTITY` 固定为 `You are a Claude agent, built on Anthropic's
  Claude Agent SDK.`；
- `environment` 固定为 `# Environment\n - Timezone: <时区>`，
  时区取 `CLAUDE_CODE_TIMEZONE` → `SLOT_TZ` → `TZ` → 默认值；
- `zero` 布局下，`IDENTITY` 不再单独成块，而是写进计费头的
  `prompt_version=<...>` 字段；
- 调用方 system 中不属于以上三类的其余块，过滤掉默认 agent 字段后
  按空行合并，追加在最后。

计费头在 `zero` 布局下的重写规则：

```text
1. 为空时置为 "x-anthropic-billing-header:"
2. 不以该前缀开头时补上前缀
3. 删除已有的 prompt_version=... 与 cch=...
4. 去掉行尾空白；不以分号结尾则补分号
5. 缺少 cc_prompt_id= 时追加 " cc_prompt_id=<当前请求独立 UUID>;"
6. 末尾追加 " cch=00000; prompt_version=<IDENTITY>"
```

`identity` 布局下计费头只做第 3 步的 `cch` 重置（写成
`cch=00000`），不改 `prompt_version`。

#### 完整样例

**输入请求**（调用方不传 system）：

```json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "stream": true,
  "messages": [{"role": "user", "content": "hi"}]
}
```

**内核 → CLI 的 `job_start`**：

```json
{
  "type": "job_start",
  "job_id": "job_a4bcc046bf4c48fe971c1ae45ee82a64",
  "slot_id": "s00",
  "request": {
    "model": "claude-sonnet-5-5",
    "max_tokens": 1024,
    "stream": true,
    "messages": [{"role": "user", "content": "hi"}],
    "metadata": {
      "user_id": "{\"device_id\":\"\",\"account_uuid\":\"\",\"session_id\":\"6f1c...\"}"
    }
  }
}
```

注意 `request` 中没有 `system` 字段，内核没有补。

**`SYSTEM_MODE=zero` 时上游收到的 system**（计费头字段为示例值，
实际内容由调用方或 CLI 的指纹生成逻辑决定）：

```json
[
  {"type": "text", "text": "x-anthropic-billing-header: cc_version=2.1.296; cc_entrypoint=sdk-cli; cc_prompt_id=<id>; cch=00000; prompt_version=<You are a Claude agent, built on Anthropic's Claude Agent SDK.>"},
  {"type": "text", "text": "# Environment\n - Timezone: Asia/Taipei"}
]
```

**`SYSTEM_MODE=identity` 时上游收到的 system**：

```json
[
  {"type": "text", "text": "<调用方提供的计费头>; cch=00000;"},
  {"type": "text", "text": "You are a Claude agent, built on Anthropic's Claude Agent SDK."},
  {"type": "text", "text": "# Environment\n - Timezone: Asia/Taipei"}
]
```

**调用方自带计费头时**（`request.system` 原样出现在 `job_start`）：

```json
{"system": [
  {"type": "text", "text": "x-anthropic-billing-header: cc_version=9.9.9; cch=abcde;"},
  {"type": "text", "text": "自定义系统提示"}
]}
```

上游收到：

```json
[
  {"type": "text", "text": "x-anthropic-billing-header: cc_version=9.9.9;  cch=00000;"},
  {"type": "text", "text": "自定义系统提示"}
]
```

此时不会追加 `IDENTITY` 与环境块。新版只要求非空文本块数组，不再要求包含计费头；
每项输出 `type: text`、原始 `text`，并保留对象形式的 `cache_control`，其余属性丢弃。
空数组、字符串及含非字符串 text 的数组仍走布局生成分支；分类器上下文单独处理。

### 3.3.2 消息

`messages` 保持客户端原始结构，包括：

- `role`：`user` / `assistant` / `system`（对应 beta）
- `content`：字符串或内容块数组
- 内容块上的 `cache_control`
- `tool_use` / `tool_result` 块

不做合并、不重排、不丢弃。

### 3.3.3 元数据

`metadata.user_id` 是 JSON 字符串，内层结构：

```json
{
  "device_id": "",
  "account_uuid": "",
  "session_id": "<会话标识>"
}
```

内核缺少调用方元数据时先生成上述空账号形态；已有非空 `metadata.user_id` 字符串原样透传。
CLI 发往上游前按本地身份重建：`device_id` 来自设备身份，OAuth 模式可带 `account_uuid`；
API Key 模式不读取本地 OAuth 账户信息，除非存在远程模式的明确账号覆盖。
`session_id` 保留调用方会话；订阅者的 `cc_prompt_id` 由 CLI 每次请求单独生成，
头与正文一致。

例外（控制面路径）：控制面的 `crs-persona.stampBillingPromptId` 会把计费头里的
`cc_prompt_id` 改写成**出站会话 id**（`billingPromptId(sessionId, …)` 对 UUID 直接
返回会话本身），目的是让 `system[0]` 跨轮不变、保住缓存前缀。因此经 `/v1/messages`
进入的请求满足：

| 断言 | 值 |
| --- | --- |
| `x-claude-code-prompt-id` | == 计费头 `cc_prompt_id` |
| `x-claude-code-session-id` | == `metadata.user_id.session_id` == 计费头 `cc_prompt_id` |
| 出站会话 | 由控制面生成，**不得**等于调用方传入的 session |

只有绕过控制面、直接由内核驱动 CLI 的槽位内部路径才保持「prompt_id 另生成、
不等于 session」的形态。

CLI 宿主应从内层提取 `session_id`，用于把同一会话的请求归入
同一执行上下文（例如会话级资源复用）；解析失败时按无会话处理，
不得因此拒绝请求。

### 3.3.4 计费头的生成与 cch

计费头（`x-anthropic-billing-header: ...`）由 CLI 宿主生成，字段按顺序拼接：

```text
[ cch=00000;] [ <workload>] [ cc_is_subagent=true;] [ cc_prev_req=...;]
[ cc_prompt_id=...;] [ cc_turn_origin=...;] [ cc_prompt_index=0; cc_turn_index=1;]
```

每个字段是否写出由两道门控决定（`attributionGates`）：

| provider | `cch` | 订阅者字段 |
| --- | --- | --- |
| 第一方 + 订阅者 | 写 | 写 |
| 第一方 + 非订阅者（API Key / 无 `user:inference`） | 不写 | 不写 |
| vertex | 写 | 不写 |
| bedrock / foundry | 不写 | 不写 |

provider 只由 `CLAUDE_CODE_USE_BEDROCK` / `CLAUDE_CODE_USE_VERTEX` /
`CLAUDE_CODE_USE_FOUNDRY` 决定，与 `ANTHROPIC_BASE_URL` 无关。
「订阅者」按 `isClaudeAISubscriber` 判定：OAuth 且带 `user:inference`；
没有 `user:profile` 的 setup-token 仍算订阅者（只影响 beta 列表）。

订阅者字段的取值规则：

| 字段 | 条件 |
| --- | --- |
| `cc_is_subagent=true;` | 始终（kin 槽位是子代理路径） |
| `cc_prev_req=…;` | 匹配 `^req_[A-Za-z0-9_-]{1,36}$` |
| `cc_prompt_id=…;` | 每次请求新生成的 UUID |
| `cc_turn_origin=…;` | 匹配 `^[a-z][a-z_]{0,31}$`；`agent:kin` 不能匹配，回退到入口类型（`sdk-cli`/`sdk-ts`/`sdk-py` → `sdk`，`cli` → `cli`），仍取不到则省略 |
| `cc_prompt_index` / `cc_turn_index` | 请求里有真实用户提示时固定 `0` / `1` |

`CLAUDE_CODE_ATTRIBUTION_HEADER` 为 `0`/`false`/`no`/`off` 时整段计费头为空。

`` 只在官方 CLI 收到 `--workload <tag>`（或 SDK 的 workload 选项）时出现，
来源是 CLI 自己的 AsyncLocalStorage，**不是环境变量**；原生宿主没有 workload
选项，因此槽位路径永远不带该字段（早前实现读 `CLAUDE_CODE_WORKLOAD`，
上游从未读过这个变量，已删除）。

#### cch 的计算范围（重要）

`cch` 只投影**首个 canonical system 计费头块**：

1. 只扫描 `system`：字符串形态整段、或数组里各块的 `text`；
2. 只认「块文本开头 + 同一行内 + 5 位十六进制 + 分号」的 `cch=NNNNN;`；
3. 命中第一个即停，后续 system 块里的示例不改；
4. `messages`、工具结果、文档正文里的计费示例**永远不改**；
   改写它们会改变上轮的 prompt 前缀，丢掉 prompt cache；
5. 找不到 canonical 头时整个请求体原样返回，不写任何 cch。

摘要材料是「关闭 cch 占位后的紧凑 JSON」，再裁掉：
`max_tokens` 数值、`fallbacks` 数组、`fallback_credit_token`，
以及所有 `"model":"…"` 的值。取 XXH64（种子 `0x4d659218e32a3268`）
低 20 位，5 位小写十六进制。因此 `cch` 不是会话常量：请求变长就会变，
但已发出的历史消息字节不得改变。

注意：`zero` / `identity` 布局会无条件写出 `cch=00000` 占位，
所以这两种布局下 `cch` 字段的存在与 provider 门控无关；门控只影响
计费头里 `cch` 是否被写在 attribution 阶段。

## 3.4 缓存控制

缓存标记由 CLI 宿主补全，内核只透传调用方给出的 `cache_control`。

| 规则 | 说明 |
| --- | --- |
| TTL 取值 | 仅 `5m` / `1h` |
| 优先级 | 显式 `cache_control.ttl` → `KERNEL_CONFIG.default_cache_ttl` → `1h` |
| marker 上限 | 最多 4 个 |
| 超限删除顺序 | tools 逆序 → system 逆序 → messages 正序 |
| thinking 块 | `thinking` / `redacted_thinking` 上的 `cache_control` 必须删除 |

仅当 system/tools/messages 中出现显式合法 TTL 时才补全缺失或非法 TTL；整次请求
均省略 TTL 时保持省略。`type` 不是 `ephemeral` 的块不动，已有合法 TTL 的块也不动；
补全时保留 `scope` 的 `global` / `org`，其余 scope 不保留。三段统一参与补全与上限裁剪。

配置默认值来自 `KERNEL_CONFIG` 指向的 JSON（默认
`/run/kin/kernel.json`）中的 `default_cache_ttl`。

## 3.5 流式响应

上游返回 SSE，每行形如：

```text
event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{...}}
```

处理要求：

1. 解析 `data:` 行的 JSON；
2. 将整个事件对象作为 `stream_event.event` 转发给内核；
3. 忽略 `event:` 行、注释行与空行；
4. 事件顺序不得改变；
5. 收到 `message_stop` 后结束 job。

上游响应头中的限流字段在流结束后通过 `response_headers` 事件发送
（见 `02_CLI_INTERFACE_SPEC.md` 2.4.1）。观测到的事件顺序为
`message_stop` → `response_headers`。

## 3.6 超时与重试

| 项 | 建议 |
| --- | --- |
| 首字节超时 | 600 秒（由内核配置） |
| 空闲超时 | 由内核 `JOB_IDLE_SECS` 控制 |
| 连接重置 | native 模式下重建 HTTP/2 连接池 |
| 重试 | 默认不重试，错误原样上报 |

判定为陈旧连接并重建连接池的代码：

```text
ECONNRESET
EPIPE
UND_ERR_SOCKET
ERR_STREAM_DESTROYED
socket hang up
connection reset
other side closed
```

## 3.7 错误处理

错误分类与 `code` / `error_type` 映射见
`02_CLI_INTERFACE_SPEC.md` 2.7。

上报要求：

- `error` 必须是字符串，长度建议不超过 300 字符；
- 已开始输出流后出错，使用 `upstream_stream_interrupted`；
- 未输出任何事件即出错，使用 `upstream_network_error`；
- 上游返回结构化错误时，尽量保留 `request_id` 与 `retry_after`。

## 3.8 会话与并发

- 一个 CLI 宿主可以承载最多 20 个槽位；
- 每个槽位同一时刻只处理一个 job；
- 会话隔离基于 `session_id`，同一会话的先后请求应复用同一执行上下文；
- 上游连接池在宿主进程内共享；
- 取消一个 job 不得影响其他槽位的连接。

## 3.9 环境变量

CLI 宿主读取的环境变量：

| 变量 | 用途 |
| --- | --- |
| `CLAUDE_CODE_NATIVE_SLOTS` | 槽位数量，激活槽位模式 |
| `CLAUDE_CODE_TIMEZONE` | 时区，必须回显到 `host_ready` |
| `CLAUDE_CODE_SYSTEM_LAYOUT` | 布局策略，内核固定传 `zero` |
| `CLAUDE_CODE_CONFIG_HASH` | 可选，内核不校验 |
| `CLAUDE_CODE_VERSION` | 版本号，缺省 `2.1.296` |
| `CLAUDE_CODE_ENTRYPOINT` | 缺省 `sdk-cli` |
| `KERNEL_CONFIG` | 内核配置路径，默认 `/run/kin/kernel.json` |
| `TZ` / `SLOT_TZ` | 时区回退 |
| `HTTPS_PROXY` / `HTTP_PROXY` | 出口代理 |

配置字段、凭据文件与代理规则见 `06_CONFIG_AND_CREDENTIALS.md`。
