# CRAG v2 契约矩阵（CONTRACT_MATRIX）

> 基线：2026-11-18，`feat/cragv2-rs-main`，面板 1.4.142，上游 CRAG 3.1.6。
> 目标：在 `--gateway-worker` 形态下，面板不改代码即可把我们的 `crag-v2` 当作上游 crag 使用。
> 原则：只把**面板真实调用**算作契约；自建扩展单列，不混入验收。

状态图例：✅ 已对齐；⚠️ 部分对齐或需补证；❌ 缺口；❓ 待证；🚫 非契约/不适用。

状态基于当前源码与已有实测记录；本轮没有重新跑生产、真实账号或端到端推理。

---

## 0. 目标边界

### 0.1 两个不同目标

| 目标 | 范围 | 验收面 |
| :--- | :--- | :--- |
| **A. 替代 crag 内核**（当前目标） | 推理中转、health、cancel、telemetry、CLI/工具回环 | 面板实际调用的 5 条 HTTP + 1 个 exec + 推理协议 |
| **B. 替代厂商 `kin-worker`**（独立目标） | `oauth refresh/models/usage/profile/count-tokens/reset-*` | 7 个 exec op + 面板 `WORKER_BIN` 改指/文件替换 |

目标 A 不包含 `identity/models/usage` 三个 HTTP 端点；目标 B 才涉及 `oauth` 子命令。两者不能混为一张验收表。

### 0.2 三个端点的处置

| 端点 | 面板真实路径 | 上游 crag | 目标 A | 目标 B |
| :--- | :--- | :--- | :--- | :--- |
| `/internal/identity` | 槽内 shell 采集（`guest-identity-reader.mjs:189`） | 未发现 HTTP 路径 | 不作验收；保留/删除均不影响面板 | 不需要（identity 不是 worker op） |
| `/internal/v1/models` | `/v1/models` 本地 `model-policy`（`server.mjs:1343-1351`） | 未发现 HTTP 路径 | 不实现 | 需 `oauth models`，但面板仍不会调用，必须改 `WORKER_BIN` |
| `/internal/oauth/usage` | `callWorkerGet` 短路成 exec `kin-worker oauth usage`（`go-worker-client.mjs:2010`） | 未发现 HTTP 路径 | 不实现；保留也无调用方 | 需 `oauth usage/profile`，并改 `WORKER_BIN` |

证据边界：

- `share/crag/kin-kernel` 与 `.tmp/v315/crag-v2-3.1.5` 的可见字符串均无上述三条 HTTP 路径。
- `CONTRACT_AUDIT` 实测的 `/home/kincli/.kin/crag-v2/crag-v2 oauth models` 是**我们的二进制**，不能证明上游 crag 支持 `oauth` 子命令。
- `.tmp/v315/crag-v2-3.1.5` 只有 `Usage: crag-v2 [--gateway-worker --config FILE] [options]`，可见字符串无 `oauth`；`oauth` 是否在加密 payload 内仍待只读实测。

---

## 1. HTTP 契约

| ID | 端点 | 面板调用点 | 上游证据 | 我方实现 | 离线验证 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| H1 | `GET /internal/health` | `rust-kernel-client.mjs:143` | `05_KERNEL_IMPLEMENTATION.md:620` | `gateway.rs:519`；字段 `:210-275` | `curl --unix-socket` 对照字段 | ⚠️ 缺 `effective_config`/`license_valid`/`active_requests` 等 |
| H2 | `POST /internal/v1/messages` | `kernel-router.mjs:347` ← `handle-protocol.mjs:184` | `05:552` | `gateway.rs:536` | 假 CLI 跑流式/非流式差分 | ⚠️ 头/trailer 未齐 |
| H3 | `POST /internal/v1/cancel` | `go-worker-client.mjs:320` | `05:574` | `gateway.rs:549` | 取消在飞请求 | ✅ |
| H4 | `POST /internal/v1/telemetry/events` | `rust-kernel-client.mjs:97` | crag v2 扩展，旧 `05` 未列 | `gateway.rs:671` | 返回 `{"ok":true}` | ✅ |
| H5 | `POST /internal/v1/telemetry/apply` | `rust-kernel-client.mjs:111-113` | crag v2 扩展，旧 `05` 未列 | `gateway.rs:674`、`:802-819` | 五字段形状 + 409 分支 | ✅ |
| H6 | `GET /internal/identity` | 无调用方；面板走 shell | 未发现 HTTP 路径 | `gateway.rs:565` | 无面板用例 | 🚫 非契约 |
| H7 | `GET /internal/oauth/usage` | `crs-usage-probe.mjs:404` → `go-worker-client.mjs:2010` 短路 | 未发现 HTTP 路径 | `gateway.rs:582` | 无面板用例 | 🚫 非契约 |
| H8 | `GET /internal/v1/models` | 无调用方；`/v1/models` 本地生成 | 未发现 HTTP 路径 | 无路由 | 无面板用例 | 🚫 非契约 |
| H9 | `POST /internal/forward` | 仅 `api-kernel-client.mjs` | api 内核形态 | `gateway.rs:649` | 无 | 🚫 不适用 |
| H10 | `POST /internal/v1/codex/*` | 仅 `codex-kernel-client.mjs` | Codex 槽位 | `gateway.rs:660` 回 404 | 无 | 🚫 已排除 |
| H11 | `GET /internal/v1/slots` | 未发现面板调用 | 主 API `05:658` | 无路由 | 无 | ❓ 非 worker 契约 |
| H12 | `GET/PUT /internal/v1/envelope` | 未发现面板调用 | 主 API `05:74` | 无路由 | 无 | ❓ 非 worker 契约 |

### 1.1 health 字段核对

`gateway.rs:210-275` 已报：`ok`、`healthy`、`ready_slots`、`closed_slots`、`session_slots`、`slots_per_worker`、`cli_pid`、`recovering`、`provider`、`active`、`waiting`、`queued`、`pids`、`cli_restarts`、`capabilities[5]`、`crag_telemetry_apply_v1`、`gateway_policy_v1`、`execution_mode`、`source`、`vm_id`。

仍为固定值：

- `telemetry_ready: false`（`:273`）
- `telemetry: null`（`:274`）
- `vm_telemetry: null`（`:275`）

这三项是否阻塞面板的槽内 native OAuth 路径，需用面板沙盒验证；不能仅凭字段存在判定 ✅。

---

## 2. exec 契约

| ID | exec | 面板调用点 | 上游证据 | 我方实现 | 离线验证 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| E1 | `crag-v2 --license-capabilities` | `vm-runtime.mjs:403` | 3.1.6 实测 `1/1` | `main.rs:226-227`、`:333-338` | 输出一行 JSON | ⚠️ 我方 `0/0` |
| E2 | `oauth models` | `slot-oauth.mjs:131`（`WORKER_BIN`） | 未证实上游支持 | `main.rs:148-167` | 假 `kernel.json` 跑最后一行信封 | ❓ 目标 B |
| E3 | `oauth usage` | `crs-usage-probe.mjs:404` → `:2010` → `slot-oauth.mjs:131` | 未证实上游支持 | `main.rs:168-198` | 有/无 OAuth 两种输入 | ❓ 目标 B |
| E4 | `oauth profile` | `crs-usage-probe.mjs:405`、`usage-probe.mjs:24` | 未证实上游支持 | `main.rs:199-211` | 信封形状 | ❓ 目标 B |
| E5 | `oauth refresh/count-tokens/reset-status/reset-redeem` | `slot-oauth.mjs:11` 的 OPS | 厂商 `kin-worker` | 未分派（`main.rs:213-215` 回 400） | 无 | ❌ 目标 B 缺口 |

关键事实：`slot-oauth.mjs:10` 的 `WORKER_BIN` 是硬编码 `/usr/local/bin/kin-worker`，不是 `KIN_WORKER_BIN`，也不是 `kin-kernel` shim。`KIN_WORKER_BIN` 只在 `vm-runtime.mjs:68` 的另一条 worker 路径生效。因此：

- 目标 A 下，E2-E5 都不应算作 crag 内核缺口。
- 目标 B 下，必须改面板 `WORKER_BIN` 或把二进制装到 `/usr/local/bin/kin-worker`，否则 E2-E5 永远是死代码。

---

## 3. 响应头 / trailer / SSE

| ID | 项 | 面板读取点 | 上游证据 | 我方实现 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| R1 | `x-terminal-state` | 非流式 `go-worker-client.mjs:1004`；流式不读 | `05:161-165` | `gateway.rs` 多处 `verified`/`error` | ✅ |
| R2 | `x-usage` | `go-worker-client.mjs:394-405` | trailer `05:161-165` | 未发 | ⚠️ 面板有 SSE 回退 |
| R3 | `x-model` | 同上 | trailer `05:161-165` | 未发 | ⚠️ 回退 `sseModel` |
| R4 | `x-stop-reason` | 同上 | trailer `05:161-165` | 未发 | ⚠️ 回退 `sseStop` |
| R5 | `x-event-count` | 无明确消费点 | trailer `05:161-165` | 未发 | ⚠️ 上游同形缺口 |
| R6 | `x-error-code` | 无明确消费点 | trailer `05:161-165` | 未发 | ⚠️ 上游同形缺口 |
| R7 | `anthropic-ratelimit-*` | `account-quota`/`rate-limit-service`/`quota-window`/`upstream-error-policy` | 未证实上游 worker 是否发 | 未发 | ❌/❓ 面板硬依赖 |
| R8 | `retry-after` | `core/errors.mjs:655,665,688` | 字符串有 header 常量，未证实 worker 发出 | 未发 | ❌/❓ |
| R9 | `request-id` | `mergeRateLimitHeaders` 白名单 | 未证实 | 未发 | ⚠️ 仅日志关联 |
| R10 | SSE `response_headers` | `go-worker-client.mjs:1368` | 未证实 | 未发 | ❌/❓ 与 R7 同因 |
| S1 | SSE 事件序列 | `protocol/convert.mjs:1154` 的 assembler | `09_CRAG_KERNEL_SPEC.md:59-94` | `message_start`/`content_block_*`/`message_delta`/`message_stop` | ✅ |
| S2 | 完整性判定 | `core/errors.mjs:414-417` | `sawMessageStop` | 发 `message_stop` | ✅ |
| S3 | `tool_use` 块 | 面板 assembler | 官方 SDK 事件 | 部分实现，GAP §16.18 仍有卡点 | ⚠️ |
| S4 | 流中断错误 | `upstream_stream_incomplete` | `05:184-186` | 需用假 CLI 截断流验证 | ⚠️ |

### 3.1 速率头的证据边界

- `CONTRACT_AUDIT.md:288` 把速率头列为**唯一必须动手**的硬缺口，依据是面板六处消费者。
- 但上游 `share/crag/kin-kernel` 可见字符串没有 `anthropic-ratelimit-*`，`05_KERNEL_IMPLEMENTATION.md` 也没有列出这些头。
- 因此“面板需要”是事实，“上游 crag 会发”尚未证实。目标 A 要求“与上游一样”，就不能先假定必须发；必须先做只读对照或假 CLI 差分。

---

## 4. 配置 / 环境

| ID | 项 | 面板来源 | 我方状态 | 验证 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| C1 | `kernel.json` 41 键 | `--config /run/kin/kernel.json` | 24 消费 / 4 解析未消费 / 13 未读（`CONTRACT_AUDIT §5.1`） | 逐键消费点单测 | ⚠️ |
| C2 | `worker.json` 18 键 | 厂商 `kin-worker` exec | 我们不读 | 无 | 🚫 非契约 |
| C3 | 面板注入 7 个 env | `vm-runtime.mjs:1552-1563` | 读 `HOME`（间接）、`LANG`、`TZ`；其余无行为差异 | env 矩阵单测 | ✅/⚠️ |
| C4 | `session_slots` | 面板 supervisor 核对 | `gateway.rs:212-213` | health 对照 | ✅ |
| C5 | `delivery_mode` 配置层 | 面板写配置 | 只读请求体同名字段（`gateway.rs:1331`） | 无 body 场景测试 | ⚠️ 边界差异 |
| C6 | `max_event_bytes` / `max_response_bytes` | 面板 64MB | 未实施 | 超长输出测试 | ⚠️ 可选 |
| C7 | `request_timeout_seconds` / `default_cache_ttl` / `cch_enabled` / `crag_kernel_version` | 面板写配置 | 解析未消费 | 配置生效测试 | ⚠️ 可选 |

---

## 5. 推理功能

| ID | 项 | 上游规格 | 我方状态 | 验证 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I1 | CLI stdin/stdout 帧 | `02_CLI_INTERFACE_SPEC.md`、`09:39-94` | native/tui 已实现 | 假 CLI 帧差分 | ⚠️ |
| I2 | 工具回环 | `07_CLI_NODE_SCOPE.md`、GAP §16.18 | 部分实现，仍有卡点 | 客户端 tools + tool_result | ⚠️ |
| I3 | 会话复用 / prompt cache | GAP §16.20 | 已实测部分 | 多轮会话 | ⚠️ |
| I4 | 出站身份 | GAP §14.3 | `cc_version` 第四段、`accept-encoding`、`cch`、`request-class` 未对齐 | 假上游抓头 | ⚠️ |
| I5 | 429/failover | 面板 pool 策略 | 依赖 R7/R8 | 注入 429/529 | ❌/❓ |
| I6 | 推理 admission | `rust-kernel-client.mjs:29-36` | 代码存在，未触发 | 沙盒假账号 | ❓ |

---

## 6. 非契约清单

以下项明确不进入目标 A 验收：

| 项 | 原因 |
| :--- | :--- |
| `/internal/identity` | 面板用 shell；上游无 HTTP 路径 |
| `/internal/v1/models` | 面板本地 `model-policy`；无调用方 |
| `/internal/oauth/usage` | 面板短路到厂商 `kin-worker`；上游无 HTTP 路径 |
| `worker.json` 18 键 | 厂商 `kin-worker` 读取 |
| `KIN_VM_ID` / `KIN_VM_NAME` / `KIN_VM_OS` | `vm_id` 来自 `kernel.json`；其余无行为差异 |
| manifest `authorization` / `payload` 语义 | 面板 `verifyCragV2Tree` 不交叉校验 |
| `license_dir` | 自建授权体系承载 |
| `prewarm_enabled` / `asset_dir` / `auto_compact_window` / `test_endpoints` | 当前 false / 厂商解包 / codex |
| `/internal/forward` | api 内核形态 |
| `/internal/v1/codex/*` | 仅 Codex 槽位；我们回 404 |

---

## 7. 离线验证顺序

1. **静态矩阵**：本文件。后续所有差异都回填到对应行，不再靠记忆。
2. **假 CLI 差分**：用 `native-slot/tools/upstream-probe` 的假 CLI，分别跑上游 crag 与我们的 crag；归一化比较 HTTP 状态、headers、body、SSE 帧、trailer。先覆盖 H1-H5，再扩 R1-R10。
3. **面板沙盒**：vm2api + 假 kernel + 假上游，注入模拟 429/529/速率头，验证 `account-quota`/`rate-limit-service`/`upstream-error-policy` 的消费路径；不绑生产账号。
4. **只读现网对照**：若仍有未替换的上游槽位，只打 health/identity/models/usage 这类非推理端点，记录真实响应；不发 `/v1/messages`。若三套槽位都已替换，跳过此步并标注“无法对照”。
5. **真实请求**：只在最后确认阶段对 vm-02 发一条，`max_tokens >= 8192`；不作为开发试错。

---

## 8. 当前结论

- **目标 A 的真实验收面比 `CONTRACT_AUDIT` 更窄**：5 条 HTTP + 1 个 exec + 推理协议；`identity/models/usage` 三条 HTTP 不在其中。
- **最可能的真实缺口**：R2-R10 的 trailer/速率头、C1/C5-C7 的配置消费、I4 的出站身份、I5 的 429/failover、I2 的工具回环。
- **必须先补证再动手**：上游是否发速率头、上游是否支持 `oauth` 子命令、`telemetry_ready`/`vm_telemetry` 是否阻塞 native OAuth。
- **目标 B 是独立工程**：要实现 7 个 `oauth` op，并改面板 `WORKER_BIN` 或替换 `/usr/local/bin/kin-worker`；不能靠当前 `KIN_WORKER_BIN` 自动生效。

---

## 9. 事实修正

| 旧说法 | 实际 |
| :--- | :--- |
| `CONTRACT_AUDIT` 说 `identity/models/usage` 三个端点都实现了 | Rust 路由表没有 `/internal/v1/models`；只有 `oauth models` 子命令（`gateway.rs:519-674`） |
| `CONTRACT_AUDIT` 用 `/home/kincli/.kin/crag-v2/crag-v2 oauth models` 证明上游支持 | 该二进制是我们的 `crag-v2`（`773769f9…`），不是上游原版 |
| `GAP_IMPL_SPEC §16.30` 说 `WORKER_BIN` 会落到我们的二进制 | `slot-oauth.mjs:10` 硬编码 `/usr/local/bin/kin-worker`；§16.32 已推翻 |
| `CONTRACT_AUDIT` 说可用 `KIN_WORKER_BIN` 改指兜底 | `KIN_WORKER_BIN` 不在 `slot-oauth.mjs`；只在 `vm-runtime.mjs:68` 的另一条路径生效 |

---

## 10. 3.1.6 能力位补充

完整 git 考古与逐项证据见 `CRAG_RECON.md`。3.1.6 的 manifest 能力集：

```text
official_full, zero, cancel, telemetry, unix_socket_envelope,
per_vm_license, encrypted_payload, native_handoff_v1,
provider_result_v2, native_history_v3, generation_controls_v3
```

3.1.6 新增 health 能力：

```text
crag_telemetry_apply_v1, crag_telemetry_content_v1
```

当前 P0：health 证明字段、`prompt_append`/`prompt_replace` 能力位、`crag_prompt.replace` 无工具分支。
