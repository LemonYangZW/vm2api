# 7. CLI 进程的功能范围

本文说明 CLI 宿主（`cli-node`）在不同模式下承担的功能，
用于确定 ARM64 重写版必须覆盖的最小范围。

帧协议与握手见 `02_CLI_INTERFACE_SPEC.md`，
上游请求形态见 `03_UPSTREAM_BEHAVIOR.md`。

## 7.1 两种模式

`CLAUDE_CODE_NATIVE_SLOTS` 是唯一开关：

| 取值 | 模式 | 行为 |
| --- | --- | --- |
| 已设置 | 槽位模式 | 进入 native 帧循环，不启动交互界面 |
| 未设置 | 普通模式 | 官方命令行、交互界面、登录命令与非交互执行 |

槽位模式下进程只做三件事：读 stdin 帧、调用上游、写 stdout 帧。
不读终端、不渲染界面、不处理斜杠命令。

普通模式下才提供登录、帮助、交互会话等能力。

## 7.2 槽位模式

槽位模式的完整契约见 `02`。摘要：

```text
启动 → 写 host_ready → 每个槽位写 slot_ready → 循环读帧
```

支持的帧类型：

| 方向 | 类型 |
| --- | --- |
| 内核 → CLI | `job_start`、`cancel`、`ping` |
| CLI → 内核 | `stream_event`、`job_done`、`job_error`、`cancel_ack`、`pong` |

未识别的帧静默丢弃，不报错、不退出。

## 7.3 普通模式的命令

入口参数分派顺序：

```text
--version | -v | -V          打印版本后退出
NATIVE_SLOTS 已设置           进入槽位模式
auth login                   槽终端登录
setup-token                  一年期令牌
-p | --print                 非交互执行（hello / usage）
--single-process-subagents   单进程子代理模式
--claude-in-chrome-mcp       浏览器 MCP 服务
--chrome-native-host         浏览器原生宿主
--tmux + worktree            工作树会话
--update | --upgrade         转为 update 子命令
--bare                       精简模式
--safe-mode                  安全模式
--restricted                 受限模式
其他                         官方主命令解析
```

`-p` 与 `--print` 都进入非交互模式，区别只在于提示词的传入方式：
`-p <prompt>` 把提示词作为下一个参数，`--print` 从参数列表读取。
两者的输出格式都由 `--output-format` 决定，见 7.5。

### 7.3.1 `--version`

```text
<version> (Claude Code)
```

只接受单个参数；带其他参数时不走这条分支。

### 7.3.2 运行标志

| 参数 | 影响的环境变量 |
| --- | --- |
| `--bare` | `CLAUDE_CODE_SIMPLE=1` |
| `--safe-mode` | `CLAUDE_CODE_SAFE_MODE=1`、`CLAUDE_CODE_DISABLE_CLAUDE_MDS=1` |
| `--restricted` | `CLAUDE_CODE_RESTRICTED=1` |

这些标志只设置环境变量，后续行为由主命令读取。

## 7.4 登录与令牌

`cli-node` 在普通模式下提供两个一次性登录命令，
由宿主机在槽内 PTY 中启动。

### 7.4.0 两种登录的共同契约

CLI 自己完成 PKCE、生成授权链接、换取令牌；宿主机只做三件事：
提取链接、把用户粘贴的授权码送入终端、读取 CLI 写出的凭据。

#### 授权链接

```text
https://claude.com/cai/oauth/authorize
  ?code=true
  &client_id=9d1c250a-e61b-44d9-88ed-5944d1962f5e
  &response_type=code
  &redirect_uri=https://platform.claude.com/oauth/code/callback
  &scope=<见下表>
  &code_challenge=<S256(verifier)>
  &code_challenge_method=S256
  &state=<state>
```

参数按上表顺序追加，scope 内的空格编码为 `%20`。

PTY 场景没有本地回调端口，必须使用 manual 重定向：
`redirect_uri` 固定为 `https://platform.claude.com/oauth/code/callback`。

#### PKCE 与 state

| 值 | 生成方式 |
| --- | --- |
| `code_verifier` | 32 字节随机数 → base64url（无 `=` 填充），43 字符 |
| `code_challenge` | `SHA-256(code_verifier)` 的原始字节 → base64url |
| `state` | 32 字节随机数 → base64url（无填充） |

base64url 指标准 base64 后将 `+` 换成 `-`、`/` 换成 `_`、去掉 `=`。

#### 换取令牌

```http
POST https://platform.claude.com/v1/oauth/token
Content-Type: application/json
```

```json
{
  "grant_type": "authorization_code",
  "code": "<粘贴的授权码>",
  "redirect_uri": "https://platform.claude.com/oauth/code/callback",
  "client_id": "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
  "code_verifier": "<verifier>",
  "state": "<state>"
}
```

超时 15 秒。

| 响应 | CLI 行为 |
| --- | --- |
| `200` | 使用返回的 `access_token` / `refresh_token` / `expires_in` / `scope` |
| `401` | 报 `Authentication failed: Invalid authorization code` |
| 其他 | 报 `Token exchange failed (<status>): <statusText>` |

`expiresAt = 当前毫秒时间 + expires_in × 1000`。

#### 刷新令牌

```json
{
  "grant_type": "refresh_token",
  "refresh_token": "<refreshToken>",
  "client_id": "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
  "scope": "user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload"
}
```

返回中没有新的 `refresh_token` 时，沿用旧的。

#### 登录后的账号信息

换票成功后立即请求一次账号资料：

```http
GET https://api.anthropic.com/api/oauth/profile
Authorization: Bearer <access_token>
Content-Type: application/json
```

超时 10 秒。用于填充凭据里的：

| 字段 | 来源 |
| --- | --- |
| `subscriptionType` | `profile.subscriptionType` |
| `rateLimitTier` | `profile.rateLimitTier` |
| `tokenAccount.uuid` | `profile.account.uuid` |
| `tokenAccount.emailAddress` | `profile.account.email_address` |
| `tokenAccount.organizationUuid` | `profile.organization.uuid` |

请求失败不阻断登录，对应字段留空。

### 7.4.1 `auth login`

授权参数：

| 项 | 值 |
| --- | --- |
| `client_id` | `9d1c250a-e61b-44d9-88ed-5944d1962f5e` |
| 授权端点 | `https://claude.com/cai/oauth/authorize` |
| scope | `org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload` |
| `expires_in` | 不发送 |
| 登录方式 | 可选 Claude 订阅或 Console；未指定时由交互选择 |

scope 顺序固定：先是 `org:create_api_key`，再是其余五项。

#### 命令形式与选项

```text
cli-node auth login [--email <email>] [--sso] [--console] [--claudeai]
```

| 选项 | 作用 |
| --- | --- |
| `--email <email>` | 填入授权链接的 `login_hint` |
| `--sso` | 授权链接带 `login_method=sso` |
| `--console` | 走 Console 授权端点，用于 API 计费账号 |
| `--claudeai` | 走 Claude 订阅；这是默认值 |

`--console` 与 `--claudeai` 互斥，同时给出时立即以退出码 1 结束，
stderr 输出：

```text
Error: --console and --claudeai cannot be used together.
```

登录方式的判定顺序：

```text
settings.forceLoginMethod 已设置 → 用该设置
否则 --console                  → Console
否则                            → Claude 订阅
```

两种登录方式的授权端点不同，scope 相同：

| 项 | Claude 订阅 | Console |
| --- | --- | --- |
| 授权端点 | `https://claude.com/cai/oauth/authorize` | `https://platform.claude.com/oauth/authorize` |
| scope | 六项全量 | 六项全量 |
| 成功页 | `https://platform.claude.com/oauth/code/success?app=claude-code` | `https://platform.claude.com/buy_credits?...` |

换票成功后按返回的 scope 是否包含 `user:inference` 判定账号类型，
不依赖用户选择的端点。

#### 用 refresh token 免交互登录

设置以下两个环境变量时跳过浏览器流程：

```text
CLAUDE_CODE_OAUTH_REFRESH_TOKEN=<refresh token>
CLAUDE_CODE_OAUTH_SCOPES=<空格分隔的 scope>
```

两个都必须设置，缺 `CLAUDE_CODE_OAUTH_SCOPES` 时退出码 1 并提示。

#### 输出契约

| 流 | 内容 |
| --- | --- |
| stdout | `Opening browser to sign in…`、`If the browser didn't open, visit: <url>`、`Login successful.` |
| stderr | `Login failed: <原因>`，SSL 错误时追加提示 |

退出码：成功 `0`，失败 `1`。授权链接出现在 `visit:` 之后，
宿主机按 `https://claude.com/cai/oauth/authorize\?...` 提取。


输出契约：

| 阶段 | 输出 |
| --- | --- |
| 生成链接 | `https://claude.com/cai/oauth/authorize?...`（纯文本或 OSC 8 超链接） |
| 等待输入 | `Paste code here` |
| 成功 | `Login successful` |
| 失败 | `OAuth error: <原因>` 或 `Login failed: <原因>` |
| 授权码无效 | `Invalid code` |
| 重试 | `Press Enter to retry` |

宿主机侧的超时：

```text
生成链接      45 秒
换取令牌      90 秒
整个登录会话  30 分钟
```

终端使用括号粘贴模式（`\x1b[200~` … `\x1b[201~`），
以便一次粘贴完整授权码。

### 7.4.2 `setup-token`

```text
cli-node setup-token
```

无选项。同样的 PTY 流程，产出一年期令牌，形如 `sk-ant-oat01-…`。

与 `auth login` 的差异只在这三处：

| 项 | `auth login` | `setup-token` |
| --- | --- | --- |
| `scope` | 六项全量 | 只有 `user:inference` |
| `expires_in` | 不发送 | `31536000`（365 天） |
| 登录方式 | 可交互选择订阅 / Console | 固定 Claude 订阅 |

换票请求体在 `setup-token` 中额外带：

```json
{"expires_in": 31536000}
```

令牌前缀因此不同：

| 来源 | 类型 | 前缀 | 刷新 |
| --- | --- | --- | --- |
| `auth login` | `oauth` | `sk-ant-ort01-` | 有 refresh token |
| `setup-token` | `official-setup-token` | `sk-ant-oat01-` | 无 refresh，一年后重新生成 |

`setup-token` 成功后不进入确认页，直接结束；`auth login` 成功后等待
一次确认。

### 7.4.3 写出的文件

登录成功后写入凭据文件（权限 `0600`）：

```json
{
  "claudeAiOauth": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresAt": 1760000000000,
    "scopes": ["user:profile", "user:inference"],
    "subscriptionType": "...",
    "rateLimitTier": "...",
    "tokenAccount": {
      "uuid": "...",
      "emailAddress": "...",
      "organizationUuid": "..."
    }
  }
}
```

字段来源：

| 字段 | 来源 |
| --- | --- |
| `accessToken` | 换票响应的 `access_token` |
| `refreshToken` | 换票响应的 `refresh_token` |
| `expiresAt` | 当前毫秒时间 + `expires_in` × 1000 |
| `scopes` | 换票响应的 `scope` 按空格切分 |
| `subscriptionType` / `rateLimitTier` | `GET /api/oauth/profile` |
| `tokenAccount` | 换票响应的 `account` / `organization`，缺失时省略 |

`setup-token` 的凭据没有 `refreshToken`；其余字段相同。

宿主机另写一份会话状态文件，记录链接、状态与时间戳。

### 7.4.4 配套的两个命令

`auth` 子命令还有两个与运维相关的分支，重写版可以实现最小版本：

| 命令 | 输出 | 退出码 |
| --- | --- | --- |
| `cli-node auth status [--json\|--text]` | 默认 JSON：`loggedIn`、`authMethod`、`apiProvider`，订阅账号追加 `email` / `orgId` / `orgName` / `subscriptionType` | 已登录 `0`，未登录 `1` |
| `cli-node auth logout` | `Successfully logged out from your Anthropic account.` | 成功 `0`，失败 `1` |

`authMethod` 取值：`none`、`third_party`、`claude.ai`、`api_key_helper`、
`oauth_token`、`api_key`。

这两个命令不参与槽位推理链路，未实现时只需返回非零退出码。

## 7.5 非交互调用（控制面）

控制面初始化槽位时会直接调用 `cli-node`，不经过槽位帧协议。
以下两个调用必须在重写版中保留。

### 7.5.1 hello

```text
cli-node -p hello --permission-mode bypassPermissions --output-format json
```

`hello` 是提示词本身，不是子命令。`-p <prompt>` 与后面的标志是独立参数。

进程环境（除系统变量外）：

```text
HOME=/home/kincli
TMPDIR=/home/kincli/.cache/tmp
TZ=<VM 时区>
LANG=<locale>
LC_ALL=<locale>
PATH=/home/kincli/.local/bin:/usr/bin:/bin
CLAUDE_CODE_HOST_REFRESH=1
CLAUDE_CODE_VERSION=2.1.296
USER_TYPE=external
CLAUDE_CODE_USE_BEDROCK=0
CLAUDE_CODE_USE_VERTEX=0
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=0
DISABLE_TELEMETRY=1
DO_NOT_TRACK=1
ANTHROPIC_BASE_URL=
ANTHROPIC_API_KEY=
ANTHROPIC_AUTH_TOKEN=
```

工作目录 `/home/kincli`。

输出约定：

| 项 | 要求 |
| --- | --- |
| stdout | 单个 JSON 对象，不混入其他文本 |
| 成功判定 | 退出码 0、未超时、stdout 非空、`is_error` 不为真、无 `error` 字段 |
| 失败 | 以上任一不满足 |

宿主把 stdout 写入 `~/.claude/kin-official-hello.json`，
stderr 写入 `~/.claude/kin-official-hello.err`，权限 `0600`。

### 7.5.2 `/usage`

```text
cli-node /usage --print --permission-mode bypassPermissions \
  --output-format stream-json --verbose
```

以 `/` 开头的提示词走这条分支，第一个参数直接是命令本身，
不需要 `-p`。

输出约定：

| 项 | 要求 |
| --- | --- |
| stdout | 每行一个独立 JSON 事件（NDJSON） |
| 成功判定 | 至少一行能解析为 JSON，且退出码 0 |
| 失败 | 无任何可解析行 |

宿主写入 `~/.claude/kin-official-usage.json`（`0600`），
stderr 写入 `~/.claude/kin-official-usage.err`。

需要能被宿主识别的两种事件：

```json
{"type":"assistant","usage_report":{"rate_limits":{"limits":[...]}}}
{"type":"result","result":"<文本>"}
```

旧版 CLI 把服务端 `limits[]` 放在合成的 `usage_report` 事件上；
新版放在 `result` 事件的文本或结构化字段里。宿主两种都要支持，
因此重写版至少要输出其中一个。

`limits[]` 每行的结构：

```json
{"kind":"session","percent":21,"resets_at":"...",
 "scope":{"model":{"display_name":"Fable"}}}
```

`kind` 取值包括 `session`、`weekly_all`、`weekly_scoped`。

文本兜底格式（`result` 字段或纯文本输出）必须保持以下形态：

```text
Current session: 21% used
Current week (all models): 43% used
Current week (Fable): 21% used
```

百分比与 `Current ...` 前缀都由宿主侧解析，不要改写。

宿主对 `/usage` 会重试：默认最多 1 次重试，且只有在拿不到
`limits[]` 时才重试。

## 7.6 交互命令

普通模式下可用 55 个斜杠命令，与登录和运维相关的包括：

| 命令 | 作用 |
| --- | --- |
| `/login` / `/logout` | 登录、登出 |
| `/usage` | 查看套餐用量 |
| `/cost` | 当前会话开销 |
| `/stats` | 使用统计 |
| `/status` | 版本、模型、账号、连通性 |
| `/config` | 配置面板 |
| `/help` | 帮助与命令列表 |

槽位模式下这些命令**不可用**，因为进程不进入交互界面。

## 7.7 环境变量

### 7.7.1 内核设置

| 变量 | 作用 |
| --- | --- |
| `CLAUDE_CODE_NATIVE_SLOTS` | 槽位数量，clamp 到 1–20 |
| `CLAUDE_CODE_SYSTEM_LAYOUT` | system 布局 |
| `SYSTEM_MODE` / `CLAUDE_CODE_ENVELOPE` | `zero` 或 `identity` |
| `CLAUDE_CODE_TIMEZONE` | 时区，必须原样回显 |
| `KERNEL_CONFIG` | 内核配置路径 |
| `CLAUDE_CODE_CONFIG_HASH` | 配置哈希，用于识别配置漂移 |
| `CLAUDE_CONFIG_DIR` | 凭据与配置目录 |
| `CLAUDE_CODE_VERSION` | 版本标识 |
| `CLAUDE_CODE_ENTRYPOINT` | 固定为 `sdk-cli` |
| `USER_TYPE` | 用户类型 |
| `CLAUDE_CODE_DISABLE_TELEMETRY` | 固定为 `1` |
| `CLAUDE_CODE_HOST_REFRESH` | 置真后只重读磁盘凭据，见 `06` 6.4.4 |

### 7.7.2 宿主机附加

| 变量 | 作用 |
| --- | --- |
| `CLAUDE_DEBUG_FILE` / `--debug-file` | 调试日志路径 |
| `KIN_SESSION_DIR` | 登录会话目录 |
| `KIN_CREDENTIAL_FILE` | 凭据文件路径 |

## 7.8 ARM64 重写的最小范围

生产部署使用槽位模式、两个登录命令和两个非交互调用，因此重写版
需要实现：

| 功能 | 必要性 | 说明 |
| --- | --- | --- |
| 帧协议与握手 | 必须 | `02` 的全部要求 |
| 上游请求与流处理 | 必须 | `03` 的请求形态与 SSE 处理 |
| `auth login` | 必须 | 槽终端登录的唯一入口 |
| `setup-token` | 必须 | 一年期令牌的唯一入口 |
| `-p <prompt> --output-format json` | 必须 | 控制面 hello 探测，见 7.5.1 |
| `/usage --print --output-format stream-json` | 必须 | 额度采集，见 7.5.2 |
| `--version` | 建议 | 控制面初始化时读取版本 |
| 交互界面与其余斜杠命令 | 不需要 | 槽位模式不进入 |
| 单进程子代理、浏览器 MCP | 不需要 | 本部署不使用 |

也就是说：重写版是一个**槽位循环 + 两个登录命令 + 一个精简的
print 模式（json / stream-json 两种输出）**的进程，不需要完整
交互界面。

print 模式只需支持 `hello` 与 `/usage` 两个输入：前者输出单个 JSON
对象，后者输出 NDJSON 事件。其余提示词可以拒绝或返回通用错误。

## 7.9 与现有实现的差异

- 现有 `cli-node` 是官方 CLI 的裁剪构建，保留了大量交互功能；
- 槽位模式下这些功能不会被执行，但会占用启动时间与内存；
- 重写版按 7.8 的范围实现即可，不需要逐一移植斜杠命令。
