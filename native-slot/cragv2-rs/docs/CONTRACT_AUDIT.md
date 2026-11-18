# CRAG v2 契约面核对报告（面板 ↔ 内核）

> 审计对象：`192.168.253.67` 的 `vm-crag-01` 槽位
> 面板版本 1.4.142 / 内核二进制 `773769f9…` / 容器 `kin-crag-01` / 内核 6.12.48+deb13-amd64
> 方式：只读核对（源码行号 + 容器内实测 + 面板 API 实测），审计期间不改动仓库与部署

---

## 0. 结论摘要

1. **面板真正触达我们内核的通道只有 5 条**：`/internal/health`、`/internal/v1/messages`、
   `/internal/v1/cancel`、`/internal/v1/telemetry/events`、`/internal/v1/telemetry/apply`，
   外加 exec `--license-capabilities`。
2. **三个端点我们实现了但没有任何面板代码路径调用**：`/internal/identity`（面板改用槽内 shell 采集）、
   `/internal/v1/models` 与 `/internal/oauth/usage`（由厂商 `/usr/local/bin/kin-worker` 承接）。
3. **一个硬缺口**：速率/重试响应头（`anthropic-ratelimit-unified-*`、`retry-after`）不发，
   会让 429 被判为 `crag_opaque_429 → stop`，窗口 failover 与会话窗口状态全部失效。
4. **推理通道当前未启用**：面板 `account: null`，`POST /v1/messages` 返回 503 `pool_unavailable`。
   此前所有"端到端验证"都是直连内核 TCP `18787`，不是面板路由。
5. 配置层：`kernel.json` 41 键 = **24 键消费 / 4 键解析未消费 / 13 键未读**；
   `worker.json` 18 键我们完全不读；环境变量面板注入 7 个，我们直接读 3 个。

---

## 1. 方法与证据标准

契约面有三层，只数一层必然漏（本项目实际教训）：

| 层 | 载体 | 判定方法 |
| :--- | :--- | :--- |
| HTTP | `/internal/*` 端点 | 找面板调用点 → 确认 transport（`worker.sock` 还是 `kernel.sock`）→ 实测 |
| exec | `oauth <op>`、`--license-capabilities` 等 | 找 `slotExecArgv` 调用点 → 确认目标二进制（我们 / 厂商 / 槽内脚本） |
| 配置与环境 | `kernel.json`、`worker.json`、`-e` 注入 | 逐键在全部 `src/**/*.rs` 找消费点（不是找同名字符串） |

**证据标准**：每条结论必须能给出 `文件:行号` 或实测输出。
**反例警告**：早期审计用"源码里有没有这个字符串"判断配置键是否被读，
serde 自动映射的字段（`proxy_url`、`socket_path`…）根本没带引号，导致误判。
正确做法是逐键 grep 标识符，再确认是否真有消费点（解析 ≠ 消费）。

---

## 2. 通道总图

| 端点 | 面板调用点 | 通道 | 实测是否触达我们 |
| :--- | :--- | :--- | :--- |
| `/internal/health` | `rust-kernel-client.mjs:143 rustKernelHealth` → `withRustKernelExec` | kernel.sock | ✅ 面板 `rust_health`: `reachable:true, healthy:true, ready_slots:5` |
| `/internal/v1/messages` | `kernel-router.mjs:347` ← `handle-protocol.mjs:184`；`sendRustInference` 内 remap（`rust-kernel-client.mjs:79-83`） | kernel.sock | ⚠️ 设计指向我们，当前未启用（503） |
| `/internal/v1/cancel` | `go-worker-client.mjs:320 cancelOnAbort`（remap 后的 exec） | kernel.sock | ⚠️ 同上 |
| `/internal/v1/telemetry/events` | `rust-kernel-client.mjs:97` / `slot-oauth.mjs:177` | kernel.sock | ✅ 路径存在，回 `{"ok":true}` |
| `/internal/v1/telemetry/apply` | `rust-kernel-client.mjs:111` ← `fleet-update.mjs:76,109` | kernel.sock | 仅面板切换遥测策略时 |
| `/internal/identity` | **无调用方**（`guest-identity.mjs:151` 默认 `callGet=readGuestIdentity` → `guest-identity-reader.mjs:189` 槽内 shell） | — | ❌ 死端点 |
| `/internal/v1/models` | `slot-oauth.mjs:131` exec | `/usr/local/bin/kin-worker` | ❌ 不是我们 |
| `/internal/oauth/usage` | 同上 | 同上 | ❌ 不是我们 |
| `/internal/forward` | `api-kernel-client.mjs:146` | api 内核形态 | 不适用 |
| `/internal/v1/codex/responses` | `codex-kernel-client.mjs:51,62` | 仅 `isCodexVm` 槽位 | 已排除（我们对该前缀回 404 `codex_unsupported`，`gateway.rs:660`） |
| exec `--license-capabilities` | `vm-runtime.mjs:403` | 主机 → 容器 exec | ✅ 输出 `{"host_subscription":0,"host_subscription_reclaim":0}` |

对应面板 API 实测：

```text
GET /api/panel/vms/vm-crag-01 → kernel.rust_health.reachable = true, healthy = true, ready_slots = 5
GET /api/panel/vms/vm-crag-01 → account = null
POST /v1/messages (面板边缘)  → 503 {"error":{"code":"pool_unavailable","message":"号池当前没有可用账号"}}
```

---

## 3. HTTP 端点逐个

### 3.1 触达我们的

| 端点 | 我们返回 | 面板读取字段 | 结论 |
| :--- | :--- | :--- | :--- |
| `GET /internal/health` | `healthy / ready_slots / execution_mode / capabilities[5] / gateway_policy_v1 / crag_telemetry_apply_v1 / source / vm_id` | `rust-kernel-supervisor` 判活；`go-worker-client` 判 `capabilities.includes(...)` | ✅ 对齐 |
| `POST /internal/v1/messages` | 由 CLI 的 stream-json 翻译成 SSE | assembler 自组 message；`sawMessageStop` 判完整 | ✅ 见 §6.3 |
| `POST /internal/v1/cancel` | `{"ok":true}` | 只 `.resume()` 排空，不读 body | ✅ |
| `POST /internal/v1/telemetry/events` | `{"ok":true}` | `postTelemetry` 只看 `ok` | ✅ |
| `POST /internal/v1/telemetry/apply` | `{ok, applied, enabled, scope, upload_confirmed}` | 同一组字段（`rust-kernel-client.mjs:100-133`） | ✅ |

### 3.2 死端点（实现了但没人调）

| 端点 | 为什么没人调 | 处置 |
| :--- | :--- | :--- |
| `/internal/identity` | 面板用槽内 shell 采集客户机事实（`guest-identity-reader.mjs:189` 的 `READ_IDENTITY` 脚本） | 保留（信息本身正确；若面板改回 HTTP 即可用） |
| `/internal/v1/models` | 面板 exec 厂商 `kin-worker oauth models` | 保留作 `KIN_WORKER_BIN` 改指时的兜底 |
| `/internal/oauth/usage` | 同上（`oauth usage`） | 同上 |

实测对照（同一命令、两个二进制）：

```text
/usr/local/bin/kin-worker     oauth models --config /run/kin/worker.json
  → {"ok":false,"status":0,"body":{"error":{"code":"credential_required"}}}
/home/kincli/.kin/crag-v2/crag-v2 oauth models --config /run/kin/worker.json
  → {"ok":true,"status":200,"body":{"object":"list","data":[…3 models…]}}
```

---

## 4. exec 全量盘点

| # | exec 目标 | 面板位置 | 归属 | 实测 |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `kin-worker oauth refresh` | `go-worker-client.mjs:1727` | 厂商 | 未单独触发 |
| 2 | `kin-worker oauth models` | `:2008` | 厂商 | `credential_required` |
| 3 | `kin-worker oauth usage` | `:2011` | 厂商 | `credential_required` |
| 4 | `kin-worker oauth count-tokens` | `:2041` | 厂商 | 未触发 |
| 5 | `kin-worker oauth profile` | `crs-usage-probe.mjs:405` | 厂商 | `credential_required` |
| 6 | `kin-worker oauth reset-status` | `claude-reset-credits.mjs:368`（op 透传） | 厂商 | 未触发 |
| 7 | `kin-worker oauth reset-redeem` | 同上 | 厂商 | 未触发 |
| 8 | `/home/kincli/.kin/kin-kernel`（Entrypoint，shim `exec …/crag-v2/crag-v2 "$@"`） | `docker inspect .Path` | **我们** | 进程树为 `…/crag-v2 --gateway-worker --config /run/kin/kernel.json` |
| 9 | `crag-v2 --license-capabilities` | `vm-runtime.mjs:403` | **我们** | `{"host_subscription":0,"host_subscription_reclaim":0}` |
| 10 | `sh -c <READ_IDENTITY>` | `guest-identity-reader.mjs:189` | 槽内脚本 | collect-identity 返回 hostname/os |
| 11 | `sh -c <RETIRE_LEGACY_TELEMETRY>` | `slot-process-status.mjs:47` | 槽内脚本 | 未触发 |
| 12 | `sh -lc pkill -f …setup-token` | `claude-setup-token.mjs:191` | 槽内脚本 | 未触发 |
| 13 | `python3 -c <guestScript>` | `kvm-crag-license.mjs:56`、`kvm-crag-subscription.mjs:117` | KVM 形态专用 | docker 槽不适用 |
| 14 | `kin-oauth-auth` | 主机 `bin/`（`cookie-auth.mjs:21`）+ 镜像（`slot-image.mjs:133`） | 面板 OAuth 授权流程 | 非内核契约 |

`kin-worker` 与我们的二进制是不同文件：`md5(kin-worker)=7aad2362…`，`md5(crag-v2)=33e152f9…`。

---

## 5. 配置键与环境变量

### 5.1 `kernel.json`（41 键，经 `--config /run/kin/kernel.json` 传给我们）

**A. 解析并实际消费（24 键）**

`claude_bin`(config.rs:152) `cli_version`(:295) `credential_path`(:158) `dataplane`(main.rs:456)
`first_byte_timeout_seconds`(gateway.rs:1441) `idle_timeout_seconds`(:1447) `internal_token`(main.rs:459)
`max_request_bytes`(gateway.rs:996) `model_effort`(:1531) `persona_preset`(:1355) `provider`(config.rs:192)
`proxy_required`(:194) `proxy_url`(:189) `refresh_skew_seconds`(main.rs:387) `runtime_kind`(gateway.rs:1762)
`session_idle_ttl_seconds`(native.rs) `session_slots`(main.rs:454) `slots_per_worker`(config.rs:138)
`socket_path`(main.rs:258) `tcp_listen`(main.rs) `thinking_display`(native.rs) `upstream_mode`(config.rs)
`vm_id`(gateway.rs:249) `work_dir`(gateway.rs:1313)

**B. 解析但无消费点（4 键）**：`cch_enabled`、`crag_kernel_version`、`default_cache_ttl`、`request_timeout_seconds`
（`grep "\.<key>"` 无命中；面板调这些不会生效）

**C. 未读（13 键）**

| 键 | 判定依据 | 不读是否有行为差异 |
| :--- | :--- | :--- |
| `delivery_mode` | `gateway.rs:1331` 读的是**请求体**同名字段 | 无（body 有同值）；若面板只写配置不发 body 会失效 |
| `cc_entrypoint` | 仅 `gateway.rs:900` 注释提及 | 无（出站由官方 CLI 构造） |
| `runtime_variant` | 仅 `gateway.rs:220` 硬编码回 `"crag-v2"` | 无 |
| `telemetry`（对象） | 仅端点/注释 | 无（我们不主动上传） |
| `timezone` | 面板写 `Asia/Shanghai`；我们 identity 读 `/etc/timezone`=`Etc/UTC` | **有（轻微）**：指纹时区与配置不一致 |
| `system_layout` | 无消费点 | 无（人设走 `persona_preset`/`crag_prompt`） |
| `max_event_bytes` / `max_response_bytes` | 无标识符 | **有**：面板设 64MB，我们不截断 |
| `license_dir` | 无标识符 | 无（授权由面板 + 自建 authority 负责） |
| `prewarm_enabled` | 无标识符 | 当前 `false`，无 |
| `asset_dir` / `auto_compact_window` / `test_endpoints` | 无标识符 | 无（厂商解包 / 自动压缩 / codex 测试开关） |

### 5.2 `worker.json`（18 键）三方归属

键：`cli_version` `credential_path` `delivery_mode` `egress_mode` `first_byte_timeout_seconds`
`idle_timeout_seconds` `internal_token` `max_event_bytes` `max_request_bytes` `max_response_bytes`
`proxy_required` `proxy_url` `refresh_skew_seconds` `request_timeout_seconds` `runtime_kind`
`socket_path`(=`/run/kin/worker.sock`) `test_endpoints` `vm_id`

| 读取方 | 键 | 位置 |
| :--- | :--- | :--- |
| 我方内核 | **不读**（只收 `--config /run/kin/kernel.json`） | `docker inspect .Args` |
| 厂商 `kin-worker` | 全部 18 键（oauth 一次性调用） | `slot-oauth.mjs:9,131` |
| 面板自己回读 | `egress_mode`、`proxy_url` | `vm-runtime.mjs:643-650 readWorkerEgressMode`、`:652-660 readWorkerProxyEndpoint` → `isSlotProxyDesynced` 代理漂移判定 |

注：`worker.sock` 在槽内**不存在**（`ls /run/kin/` 只有 `kernel.sock`），对一次性 oauth 调用无影响。

### 5.3 环境变量（面板注入 7 个 + 镜像自带 3 个）

注入点 `vm-runtime.mjs:1552-1563`。

| 变量 | 实测值 | 我们读 | 差异 |
| :--- | :--- | :--- | :--- |
| `HOME` | `/home/kincli` | 间接（`protocol/identity.rs:96`、`tui.rs:170,205`） | 无 |
| `CLAUDE_CONFIG_DIR` | `/home/kincli/.claude` | 否（子进程继承） | 无（`settings.json` 生效） |
| `TZ` | `Asia/Shanghai` | 否 | **有（轻微）**：identity 报 `/etc/timezone`=`Etc/UTC` |
| `LANG` | `en_US.UTF-8` | 是（`gateway.rs:774`） | 无 |
| `KIN_VM_ID` | `vm-crag-01` | 否 | 无（`vm_id` 来自 kernel.json） |
| `KIN_VM_NAME` | `crag-01` | 否 | 无 |
| `KIN_VM_OS` | `ubuntu-24.04` | 否 | 无 |
| `PATH` / `HOSTNAME` / `DEBIAN_FRONTEND` | — | — | 镜像/daemon 自带，非面板契约 |

---

## 6. 响应头与流式

### 6.1 逐个响应头

| 头 / 事件 | 面板读取点 | 我们发 | 缺失后果 |
| :--- | :--- | :--- | :--- |
| `x-usage` | `go-worker-client.mjs:394-399 streamMetaFromHeaders` → `:1491` | ❌ | `meta.usage=null`；用量仍由 assembler 从 `message_delta.usage` 取 |
| `x-model` | 同上 `:402` | ❌ | 回退 `sseModel`（`:1335`，来自 `message_start.message.model`） |
| `x-stop-reason` | 同上 `:403` | ❌ | 回退 `sseStop`（`:1336`）/`assembled.stop_reason`（`:1493`） |
| `anthropic-ratelimit-*` | 见 §6.2 | ❌ | **硬缺口**（配额/窗口/failover） |
| `retry-after` | `core/errors.mjs:655,665,688 retryAfterSeconds` | ❌ | 429/529 退化为默认 1s 重试 |
| `request-id` | `mergeRateLimitHeaders`（`:380`）白名单 | ❌ | 面板日志无 request-id |
| `x-terminal-state` | **非流式** `:1004 headers['x-terminal-state'] \|\| null`；**流式不读**，终态由 `:1496 complete?'verified':'incomplete'` 计算；流式错误分支 `:1263` 用 `\|\| 'error'` | ✅ 非流式成功发 `verified`（`gateway.rs:1255,1309,1784,2013,2162`），错误发 `error`（14 处） | 无（流式路径不读该头） |
| SSE `response_headers` 事件 | `:1368` 收集速率头 | ❌ | 与 ratelimit 同因 |

### 6.2 速率头的真实消费者（这是硬缺口，不是"仅显示"）

`go-worker-client.mjs:1037,1569` 把 `headers` 塞进结果 → `handle-protocol.mjs:2336-2349` 分发：

| 消费者 | 行号 | 读什么 | 缺失后果 |
| :--- | :--- | :--- | :--- |
| `pool/account-quota.mjs` | `:206-248 ingestHeaders` | `anthropic-ratelimit-unified-{5h,7d}-{utilization,reset,status}` | 配额只能退回 `logBag.usage`（有回退） |
| `pool/rate-limit-service.mjs` | `:161-205` | unified-5h reset/status、7d status | **会话窗口状态/reset/提前解锁失效，无回退** |
| `pool/quota-window.mjs` | `:118-124 hasRejectedUnifiedWindow` | unified-{5h,7d}-status ∈ {rejected,rate_limited} | 窗口被拒判不出来 → 不提前切换 |
| `pool/upstream-error-policy.mjs` | `:409 resetFromHeaders`；`:687-692` | `anthropic-ratelimit-*`、`retry-after` | **一圈速率头都没有时，429 判 `crag_opaque_429 → action:'stop'`** |
| `pool/failover-runner.mjs` | `:435-449` | 结果头 | 失败转移依据缺失 |
| `core/errors.mjs` | `:655,665,688` | `retry-after` | 重试时序退化 |

### 6.3 SSE 序列与完整性判定

我方发出：`message_start`(5 处) / `content_block_start`(10) / `content_block_delta`(15) /
`content_block_stop`(11) / `message_delta`(7) / `message_stop`(15) / `ping`(1)。

面板：`createClaudeMessageAssembler`（`protocol/convert.mjs:1154`）组出 message；
完整性判定 `core/errors.mjs:414-417` —— `nativeHandoff` 分支要求 `capabilities` 含
`native_handoff_v1`/`provider_result_v2`（`protocol/native-handoff.mjs:40,49`），
我们不声明（`go-worker-client.mjs:275-276` 才下发 `gateway_policy.native_handoff_v1`），
因此 `handoff=null`，落到 `if (result?.sawMessageStop) return true` ✅。

---

## 7. manifest 层

### 7.1 `verifyCragV2Tree` 十条规则 × 实盘复核

校验器 `src/lib/vm/wrap-cli-runtime.mjs:205`，面板对**已安装实盘**跑它
（`kernel-catalog.mjs:209 verifiedPackage → 318`）。实测树
`/opt/docker/vm2api/share/crag/kernels/v2/amd64`：

| 规则（行号） | 实测 |
| :--- | :--- |
| 非软链、是目录（`:207-213`） | ✅ |
| `family==='crag' && version==='v2'`（`:226`） | ✅ |
| `arch ∈ {amd64,arm64}` 且匹配（`:229`） | ✅ `amd64` |
| `encrypted===true && runtime==='native' && entrypoint==='crag-v2'`（`:236`） | ✅ |
| `capabilities ⊇ CRAG_V2_CAPS`（`:243`，集合见 `:70`） | ✅ 5/5 |
| `sha256` 含 `crag-v2`/`claude-code-2.1.321/claude`/`crag-license-public.pem`/`crag-v2.payload.enc`（`:252`） | ✅ 4/4 |
| 每个 listed 文件存在且哈希匹配（`:288-292`） | ✅ 4/4 |
| 不允许未列出的额外文件（`:284`） | ✅ 实际 4 = 清单 4 |
| 禁止明文供应商材料（`:274-283`） | ✅ 无 |
| 只允许 `crag-v2` 与 `claude` 两个 ELF（`:294-300`） | ✅ 无第三 ELF |

### 7.2 字段逐项

| 字段 | 面板用途 | 部署值 |
| :--- | :--- | :--- |
| `family` / `version` / `arch` | 校验 | `crag` / `v2` / `amd64` |
| `encrypted` / `runtime` / `entrypoint` | 校验 | `true` / `native` / `crag-v2` |
| `capabilities[5]` | 校验必须齐全 | `official_full, zero, cancel, telemetry, unix_socket_envelope` |
| `sha256{crag-v2}` | **被改写为我们的二进制哈希** | `773769f95b44382b6f9e4cc652106b2826324be769a4e82d7ddb8c99c543c17b`（与 `sha256sum crag-v2` 一致，两棵树都是） |
| `sha256{claude}` / `{pem}` / `{payload.enc}` | 校验 | 厂商原值，文件未动 |
| `authorization.{scheme,product,public_key,public_key_id}` | 仅安装路径比对发行身份（`kernel-catalog.mjs:684`） | 厂商 `ed25519-x25519-v1` / `4997f00f…`，未动 |
| `payload.{format,algorithm,key_id,plaintext_sha256,ciphertext_sha256,signature}` | 同上 | 厂商 `CRAGV2E1` / `aes-256-gcm` / `6f4e3119…`，未动 |

### 7.3 语义不自洽与后果

改写 `sha256{crag-v2}` 后，manifest 描述的 "bootloader + 签名载荷" 与实际文件不再对应同一发行。
`verifyCragV2Tree` **不做该交叉校验**，所以整棵树能过。唯一可观察差异：
`CRAG_PINNED_RELEASES` 没有我们改写后的 manifest sha（`kernel-catalog.mjs:322-327`），
面板 CRAG 卡片缺 `release.payload_tag`/`version`，只显示 `version:"v2"`、`ready:true`。

### 7.4 官方旁路（我们的替换并非"绕过"）

- `KIN_CRAG_V2_ROOT`（`wrap-cli-runtime.mjs:104`）：指定自定义包根
- `KIN_KERNEL_BIN` + `hasCustomKernelOverride`（`:635`）：指定自定义内核

两者当前都**未设置**（我们走官方根 + 改写 sha）。

---

## 8. 遗漏清单

| # | 项 | 分类 | 证据 | 需改 | 代价 | 风险 |
| :-: | :--- | :--- | :--- | :-: | :-: | :--- |
| 1 | `identity`/`models`/`usage` 三端点为死代码 | 冗余 | `guest-identity.mjs:151,155`；`slot-oauth.mjs:10,131`；实测 `credential_required` | 否 | 0 | 误导后续结论 |
| 2 | `max_event_bytes`/`max_response_bytes` 未实施 | 缺失 | src 无标识符；面板 64MB | 可选是 | 小 | 超长输出无截断 |
| 3 | `request_timeout_seconds`/`default_cache_ttl`/`cch_enabled`/`crag_kernel_version` 解析未消费 | 缺失 | `grep "\.<key>"` 无消费点 | 可选是 | 小 | 面板调超时/TTL 无效 |
| 4 | `delivery_mode`(配置层) 未读 | 差异 | `gateway.rs:1331` 读 body | 否 | 0 | body 缺字段时失效 |
| 5 | `runtime_variant`/`telemetry`/`system_layout`/`cc_entrypoint` 未读 | 无害 | 仅硬编码/注释 | 否 | 0 | — |
| 6 | `license_dir` 不读 | 有意不对齐 | 自签体系 vs 厂商 pem | 否 | — | 上游加强校验会暴露 |
| 7 | `prewarm_enabled`/`asset_dir`/`auto_compact_window`/`test_endpoints` 未读 | 不适用 | 当前 false / 厂商解包 / codex | 否 | — | — |
| 8 | 6 个速率/重试头 + SSE `response_headers` 不发 | **缺失（硬依赖）** | §6.2 六处消费者；`upstream-error-policy.mjs:687-692` 无头即 opaque stop | **是** | 中 | 429 无法按窗口 failover、会话窗口不更新、retry 时序退化 |
| 9 | manifest 语义不自洽（`authorization`/`payload` 已不对应实际文件） | 有意不对齐 | §7.3；校验器不交叉检查 | 否 | — | 卡片无 release_tag；上游加校验会失败 |
| 10 | 面板 `account: null` → 推理通道未启用 | 部署缺口 | 503 `pool_unavailable`；`account: null` | 是（若做端到端） | 小-中 | 真实消耗额度 |
| 11 | 推理 admission（`licenseCheck` + `cragV2KernelActive`，`rust-kernel-client.mjs:29-36`）能否通过 | 未验证 | 代码存在、未触发 | 待验 | — | 可能被 license 拦下 |
| 12 | `/internal/v1/codex/responses` 通道 | 已排除 | 仅 `isCodexVm` 槽位；我们回 404 `codex_unsupported` | — | — | — |
| 13 | `TZ=Asia/Shanghai` 未反映到 identity `timezone`（报 `Etc/UTC`） | 不一致（轻微） | 容器 env 实测 vs `gateway.rs:774` | 可选是 | 小 | 指纹字段不一致 |

---

## 9. 无法离线验证

| 项 | 原因 |
| :--- | :--- |
| 厂商 `kin-worker` 内部读哪些 `worker.json` 键 | 闭源二进制，只能观察输出 |
| 绑定账号后 `kernel-router` 的真实路由与 admission 结果 | 需要真实账号与上游额度，会消耗额度 |
| 速率头缺失的业务后果 | 需要真实 429 复现（打上游） |
| 面板前端字段展示是否与 API 一致 | 需要浏览器登录态 |
| 加密 payload 内容 | AES-256-GCM + ed25519/x25519，无密钥 |

---

## 10. 勘误：本次审计过程中被推翻的结论

| 原结论 | 实际 | 影响 |
| :--- | :--- | :--- |
| "面板 exec 我们的二进制跑 `oauth models/usage/profile`"（spec §16.30） | `WORKER_BIN` 硬编码为 `/usr/local/bin/kin-worker`（`slot-oauth.mjs:10`），不是我们 | 我们补的 oauth 子命令对面板是死代码 |
| "面板靠 `/internal/identity` 取客户机指纹，我们原来只回内核自述"（spec §16.31） | 面板用槽内 shell（`guest-identity-reader.mjs:189`），`/internal/identity` 无调用方 | 该修复对面板无作用（代码本身仍正确） |
| "kernel.json 只有 7 键未读" | 实为 **13 键未读 + 4 键解析未消费** | 面板调 `request_timeout_seconds` 等无效 |
| "`x-terminal-state` 成功路径不发" | 非流式成功会发 `verified`；流式不读该头 | 该项不构成 gap |
| "速率头缺失只影响面板显示" | 影响配额/窗口状态/failover/429 处理 | 第 8 项从"否"改判"是" |
| manifest 哈希写成 `dd1fad83…` | 那是 08:00 构建的二进制哈希（已被替换）；当前两棵树均为 `773769f9…` | 证据值更正 |

---

## 11. 复算命令附录

```bash
# 1) 面板是否真在跟我们说话（health 走 kernel.sock）
curl -s -H "x-api-key: $TOKEN" http://172.25.0.2:18787/internal/health | python3 -m json.tool

# 2) 面板是否把推理路由到本槽（account 是否绑定）
python3 - <<'PY'
# 登录后 GET /api/panel/vms/vm-crag-01 → data.account
PY

# 3) exec 归属：kin-worker vs 我们
docker exec kin-crag-01 sh -c 'md5sum /usr/local/bin/kin-worker /home/kincli/.kin/crag-v2/crag-v2'

# 4) manifest 全量复核（十条规则 Python 复刻）
python3 - <<'PY'
import json,os,hashlib
root="/opt/docker/vm2api/share/crag/kernels/v2/amd64"
m=json.load(open(os.path.join(root,"manifest.json")))
sha=m["sha256"]
print("files:",sum(len(f) for _,_,f in os.walk(root))-1,"| sha keys:",len(sha))
for rel,want in sha.items():
    got=hashlib.sha256(open(os.path.join(root,rel),"rb").read()).hexdigest()
    print(("OK  " if got==want else "BAD ")+rel)
PY

# 5) 容器注入的 env（面板 7 个 + 镜像自带）
docker exec kin-crag-01 env | sort
```

---

## 12. 结论

- 面板 ↔ 内核的**真实契约面**比代码里实现的窄：5 条 HTTP + 1 个 exec + 3 个 env 继承。
- 三个端点属自建扩展（identity/models/usage），当前无面板调用方，保留作兜底。
- **唯一需要动手的功能缺口**是速率/重试响应头（第 8 项）：它决定 429 是"按窗口转移"还是
  "直接 stop"。其余缺口要么有意不对齐（license、manifest），要么不适用（codex、厂商解包），
  要么当前值为 false 因而无影响（prewarm）。
- 端到端推理仍未在面板侧验证（`account: null`）；要做就需要绑定账号并接受额度消耗。
