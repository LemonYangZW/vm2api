# CRAG 上游功能还原（Git 考古 · 3.1.6）

> 基线：2026-11-18，上游 `payload-2026.11.18-crag-3.1.6`；本地 `feat/cragv2-rs-main`。
> 方法：只用 git 分支/tag/提交、面板源码与单测、公开 release 资产、本地隔离二进制探针；不碰生产账号、不发推理请求。
> 说明：3.1.6 的 `unpack-note.md` 是版权/反逆向声明，没有技术契约内容，本文不据此推断内部实现。

---

## 0. 结论

1. **3.1.6 = 3.1.5 + 原生遥测内容**。manifest 的能力集与 3.1.5 相同；新增的是 `SOURCES.json` 的 `crag_telemetry_content_v1` 和实际原生 CC 遥测发送。
2. **当前最大的遗漏不是 `identity/models/usage`，而是能力位与 health 证明字段**。面板能用能力位决定是否下发 `crag_prompt`、`crag_model`、`caller_cwd`、V3 provider 字段；我们目前只声明 5 个 manifest 能力，导致这些字段被面板主动剥掉。
3. **`crag_prompt` 还有语义 bug**：我们的 `replace` 只在“有客户端工具”分支生效，无工具请求会退化成 append。
4. **上游 `--license-capabilities` 是 `1/1`，我们是 `0/0`**。这会让面板的宿主订阅准入判定失败；是否保留自建授权路径需要明确目标。
5. **`oauth` 不是上游 crag 的功能**。3.1.6 `--help` 没有 `oauth`，实测 `oauth models` 也不被识别；`identity/models/usage` 三条 HTTP 路径同样不存在。

---

## 1. 3.1.6 事实

### 1.1 Release 与哈希

| 项 | 值 |
| :--- | :--- |
| Release | `payload-2026.11.18-crag-3.1.6` |
| 版本字符串 | `3.1.6-native-v3 (CRAG native V3)` |
| 私有源码 | `dofastted/crag`，`source_commit=2ea0cd4e3c441bc71caf9417e7246746410cb911` |
| `crag-v2` | `fa6ba81a2da59832855bbbc8a133e8226df7da4558ebdc6c3187fb43b1e1257d` |
| `crag-v2.payload.enc` | `55988b9b6221437cce2a96e962574a4021e9fd6108432c9577dfdba46dc83c72` |
| manifest | `f1e687b7d256afee53438a4ce35c75b08851c57460065fbf20995cda36fe5aac` |
| archive | `6846f67eb52c12d35514ec7d51a77b4ab9526368a2d4f1c701ca2517374ace92` |
| 官方 Claude | `2.1.321`，`426c33815ca6645a772f722fbff10dbf2cbdb124a8aeab733c1365dbf8bbf61f` |
| 未变文件 | `kin-kernel`、`kin-kernel-crag`、`kin-worker`、`cli-node`、`kernel.json.example` |

3.1.6 Release 说明只有一句实质变化：

> 原生 Claude Code 遥测事件及字段白名单，成功交接后的有界刷尾。

### 1.2 manifest 能力集

3.1.5 与 3.1.6 的 manifest `capabilities` 相同：

```text
official_full, zero, cancel, telemetry, unix_socket_envelope,
per_vm_license, encrypted_payload, native_handoff_v1,
provider_result_v2, native_history_v3, generation_controls_v3
```

3.1.6 `SOURCES.json` 新增：

```json
"health_capabilities": {
  "crag_telemetry_apply_v1": true,
  "crag_telemetry_content_v1": true
}
```

### 1.3 直接实测

本地用 glibc239 loader 在 `--network none` 容器内运行 3.1.6：

```text
crag-v2 --version
→ 3.1.6-native-v3 (CRAG native V3)

crag-v2 --license-capabilities
→ {"host_subscription":1,"host_subscription_reclaim":1}

crag-v2 oauth models --config /tmp/nope.json
→ crag-v2: cannot read kernel config
```

`--help` 只列出 `--license-machine-code`、`--license-activate-file`、`--license-status`、`--license-public-key`、`--gateway-worker`、`--v2-transport tui` 等；没有 `oauth` 子命令。面板只调用 `--license-capabilities`（`vm-runtime.mjs:403`），其余 license CLI 不是面板契约。

### 1.4 默认 pin 仍是 3.1.5

`origin/main` 的 `deploy/payload.json` 仍写：

```text
release = payload-2026.11.18-crag-3.1.5
crag_release = payload-2026.11.18-crag-3.1.5
```

3.1.6 目前是 GitHub Release/tag 可选包；是否成为默认出厂 pin 取决于后续 payload bump 提交。

---

## 2. Git 线索地图

### 2.1 分支与 tag

| 线索 | 用途 |
| :--- | :--- |
| `origin/main` v1.4.142 | 面板最新契约；本地 HEAD 已包含该提交，另有 41 个自研提交 |
| `origin/feat/crag-series` | 早期 CRAG print/persona/v2 接入；已并入主线 |
| `origin/feat/crag-main-integration` | 订阅、shop、runtime inventory、KVM 集成；已并入主线 |
| `origin/feat/crag-runtime-slots` | 并发槽位准入、runtime inventory；已并入主线 |
| `origin/feat/crag-native-telemetry-apply` / `-panel` | telemetry apply/health 契约；已并入主线 |
| `origin/feat/crag-v3-validated-20261114` | V3 载荷验证；已并入主线 |
| `origin/release/crag-3.1.4` / `3.1.5` | 载荷 pin 分支；3.1.6 目前只有 release tag |
| `origin/isolate/crag-v2-20261104` | 18 个未合并提交；主线已有 rebase 对应提交，不能直接把它当新功能 |

### 2.2 关键主线提交

| 提交 | 内容 | 对内核的含义 |
| :--- | :--- | :--- |
| `3ab273bf` | CRAG print 与 cli-node persona 分离 | `crag_prompt` 是独立请求契约 |
| `786c9dab` | 按 VM 运行的内核切换 print | capability/健康决定是否走 crag |
| `6a887e03` | 按 live worker capabilities 门禁 CRAG 字段 | 没有能力位，面板会剥掉 `crag_prompt`/`crag_model` |
| `3a0cdcd6` | 只有 worker 消费 `crag_model` 才发送 | `model_directive` 能力位 |
| `80be195b` | CRAG V3 provider facts / request contracts | `generation_controls_v3`、V3 响应/错误契约 |
| `0f5d0ec3` | 保留 V3 system text 缓存标记 | `system_text_cache_v3` |
| `0f4d4439` | 按运行时能力组装托管工具请求 | `provider_managed_tools_v1` |
| `a9504d7b` | 分内核规范化推理请求 | 非法输入前置 400，不能到上游 |
| `a1823bc9` | 复用入站结构、移除冗余头 | 入站/出站字节稳定性 |
| `60cec605` | 宿主订阅与实际运行槽限制 | `license_valid`/`active_requests`/`ready_slots` |
| `9a1ff3d4` | thinking-only `max_tokens` 返回 200 | 空内容不再 502 |
| `7ff5d3c0` | 确定 thinking 后清洗采样参数 | 400 防护 |
| `664e6996` | 原生遥测开关与状态检测 | `crag_telemetry_apply_v1` |
| `d5f488c4` / `a9f9e6f1` | 3.1.5 payload pin | 当前默认基线 |

### 2.3 文件与测试

- 请求契约：`src/lib/protocol/kernel-request.mjs`、`crag-print-prompt.mjs`、`go-worker-client.mjs`。
- health/运行时：`src/lib/vm/crag-runtime-inventory.mjs`、`rust-kernel-supervisor.mjs`、`kernel-install.mjs`。
- 能力位测试：`test/unit/kernel-router.test.mjs:234`、`test/unit/crag-print-prompt.test.mjs:60`、`test/unit/go-worker-client.test.mjs:193`、`test/unit/outbound-log-envelope.test.mjs:413`。
- 遥测：`docs/TELEMETRY.md`、`test/unit/fleet-update.test.mjs`、`src/lib/vm/slot-seed.mjs`。

### 2.4 本地二进制线索

- `share/wrap-cli/kin-kernel` 是 shim：`exec kin-kernel.bin` 或 `kin-kernel.real`。
- `share/crag/kin-kernel` 是内层 `kin-kernel crag public HTTP`，实测 health `version=0.2.0`、`execution_mode=crag_slots`；它不是 3.1.6 外层 `crag-v2`，不能拿它的极简 health 当最终契约。
- `crag-v2` 3.1.6 是 license/payload bootstrap；没有有效授权时 gateway 启动失败，但 `--help`/`--license-capabilities`/`--license-status` 可离线跑。
- 私有仓库 `dofastted/crag` 不可读：`git ls-remote` 返回 `Repository not found`。只能靠 release 资产、公开 manifest 与面板测试还原。

---

## 2.5 3.1.7 载荷事实（2026-11-19，读包实测）

`payload-2026.11.19-crag-3.1.7` 的 `manifest.json`（sha256 `2bd7ce44…`）直接读出：

| 项 | 3.1.7 | 3.1.6 |
| :--- | :--- | :--- |
| `payload.key_id` | **`835451e2…33a`** | `6f4e3119…` |
| `payload.plaintext_sha256` | `363b4902…9db` | — |
| `payload.ciphertext_sha256` | `596e75c0…58c` | — |
| manifest 能力位 | 11 项，**仍无 `prompt_*`** | 11 项 |

两条结论：

1. **载荷密钥换代即轮换** —— 1.4.151 changelog 的「授权与产品密钥不变」指的是授权方案与产品密钥，
   不是载荷密钥。3.1.6 的许可在 3.1.7 上必然 `license_payload_key_mismatch`。
2. `prompt_append` / `prompt_replace` 不在 manifest 能力集里，只在 **health.capabilities**，
   所以补这两个位不需要改包，只需要内核健康体声明（见 §4.1）。

## 2.6 免授权可得面（实测）

三份公开资产，都不需要许可：

| 资产 | 形态 | 能读出什么 |
| :--- | :--- | :--- |
| `kin-kernel-crag`（v1.4.155 release，9.7 MB） | ELF x86-64 **not stripped**，Rust，含 `src/gateway.rs` 路径 | 旧代 worker 协议：`/internal/v1/messages`、SSE 帧、错误码枚举、`x-kin-*` 头集合、health、CLI spawn/env |
| `kin-kernel`（13.3 MB） | 同 release，主数据面 | 同上（非 crag 变体） |
| `crag-v2`（bootstrap，894 KB，包内） | ELF **stripped**，但 .rodata 明文 | 载荷 framing：`CRAGV2E1`、`CRAG-V2-PAYLOAD-V1`、`CRAG-PAYLOAD-V1`、`CRAG-LICENSE-KEYWRAP-V1`、`CRAG-MASTER-KEYWRAP-V1`、`CRAG_V2_PACKAGE_DIR`、CLI `--vm-id/--license-dir/--license-activate-file`；官方 `claude` 2.1.321 本身也是免费资产（341 MB 明文） |

两条可直接落地的结论：

1. **速率头不需要实现。** `kin-kernel-crag` 全二进制里 `anthropic-ratelimit` 命中 **0** 次，
   只有 Rust 字段名 `retry_after`。即上游 crag 家族也不发 `anthropic-ratelimit-*`
   —— `CONTRACT_MATRIX` 的 R7/R8/R10 应从「❌/❓ 面板硬依赖」改为「上游同形缺口，不实现」。
2. **V3 面不在免费二进制里。** `generation_controls_v3`、`provider_managed_tools_v1`、
   `native_history_v3`、`native_handoff_v1`、`provider_result_v2`、`crag_prompt`、
   `crag_model`、`caller_cwd` 在 `kin-kernel-crag` 里**全部 0 命中** —— 它是 V3 之前的旧代。
   3.1.7 的 V3 精确语义只能靠许可化黑盒（或解密载荷），无免费来源。

## 3. 还原出的功能面

### 3.1 License / 启动

- `--license-capabilities` 返回 `1/1`。
- 面板 `vm-runtime.mjs:403-409` 只有 `host_subscription === 1` 且（需要回收时）`host_subscription_reclaim === 1` 才认为支持宿主订阅。
- 其余 license CLI（machine-code/status/public-key/activate）当前面板不调用；属于 crag 自身授权闭环，不是 v2api 面板契约。

### 3.2 Health

面板对 CRAG health 的硬要求：

| 字段 | 消费点 | 作用 |
| :--- | :--- | :--- |
| `effective_config`（对象） | `go-worker-client.mjs:1621-1633` | 只有返回对象，`workerHealth` 才置 `internalTokenAuthenticated=true` |
| `license_valid === true` | `crag-runtime-inventory.mjs:51` | runtime inventory 判 reachable |
| `active_requests`（整数） | `crag-runtime-inventory.mjs:53`；`rust-kernel-supervisor.mjs:669` | 运行中请求数/容量 |
| `active` / `waiting` / `queued` / `cleaning` | `rust-kernel-supervisor.mjs:669-671` | 忙闲与排空判定 |
| `prewarm_enabled`（布尔） | 同上 | 决定是否走精确整数分支 |
| `ready_slots` | `crag-runtime-inventory.mjs:52` | 可运行槽位 |
| `capacity` | `rust-kernel-supervisor.mjs` 的 `kernelSlotsDiffer` | 槽位数收敛 |
| `vm_telemetry` / `telemetry_ready` / `telemetry` | `rust-kernel-client.mjs:275-276` | 原生遥测状态 |
| `crag_telemetry_apply_v1` | `rust-kernel-client.mjs:101` | 是否调用 apply |
| `crag_telemetry_content_v1` | 3.1.6 SOURCES | 原生遥测内容能力 |

我们当前 `gateway.rs:210-275` 已报 `active/waiting/queued/pids/session_slots/ready_slots`，但缺：

```text
effective_config
license_valid
active_requests
cleaning
prewarm_enabled
capacity
crag_telemetry_content_v1
```

且 `telemetry_ready:false`、`vm_telemetry:null`（`:273-275`）。

### 3.3 请求能力位

面板测试给出的核心集合：

```js
// test/unit/kernel-router.test.mjs:234
['prompt_append', 'prompt_replace', 'model_directive', 'caller_cwd']
```

完整能力面（按源码门禁）：

| 能力位 | 面板门禁 | 效果 | 我方 |
| :--- | :--- | :--- | :--- |
| `prompt_append` / `prompt_replace` | `crag-print-prompt.mjs:463`；`gateCragBody` | 保留 `crag_prompt` | 读 `crag_prompt`，但未声明，会被剥掉 |
| `model_directive` | `crag-print-prompt.mjs:53`；`go-worker-client.mjs:566` | 发送 `crag_model` | 未读 `crag_model` |
| `caller_cwd` | `go-worker-client.mjs:650,715` | envelope 顶层 `caller_cwd` | 未读 |
| `generation_controls_v3` | `kernel-request.mjs:50`；`go-worker-client.mjs:617`；`handle-protocol.mjs:1847` | V3 native 请求/beta/工具契约 | 未声明 |
| `provider_managed_tools_v1` | `kernel-request.mjs:51` | web_search/web_fetch/code_execution/tool_search 托管工具 | 未实现 |
| `system_text_cache_v3` | `crag-print-prompt.mjs:465` | `crag_prompt.blocks` 缓存标记 | 未实现 |
| `linux_tui_native_queue` | `go-worker-client.mjs:618` | native 自己拥有队列/头 | 未实现 |
| `message_threads_beta` | `kernel-request.mjs:65` | thread beta | 未实现 |

manifest 另有 `native_handoff_v1` / `provider_result_v2` / `native_history_v3`；它们影响面板的 handoff/完整性判定，当前我们未声明，面板会退回 `sawMessageStop` 分支。

### 3.4 `crag_prompt` 语义

上游规则（`crag-print-prompt.mjs`）：

- `zero` → `mode=replace`；`official_full` → `mode=append`。
- `replace` 大于 64 KiB 直接 400 `crag_prompt_too_large`。
- 只有能力位 `prompt_replace`/`prompt_append` 才保留 `crag_prompt`。

我们的 `gateway.rs:1478-1503`：

```rust
let mut replace_system = false;
if has_client_tools {
    replace_system = directive.mode == "replace" || persona == "zero";
    ...
}
```

无客户端工具时 `replace_system` 永远 false，`--system-prompt` 变成 `--append-system-prompt`。这是 P0 语义缺口。

### 3.5 `crag_model`

`model-policy.mjs:778` 的 `modelDirectiveForCrag()` 产出：

```json
{
  "id": "<model>",
  "capabilities": { "thinking_mode": "...", "supports_adaptive": true, ... },
  "params": { "max_tokens_default": 0, "max_tokens_cap": 0, ... }
}
```

面板只在 `model_directive`/`linux_tui_pty` 能力位下发送；内核必须自己消费，不能把它透传给 Anthropic。我们当前没有读取。

### 3.6 `caller_cwd`

面板把调用方 cwd 从 system 中剥离，放在 envelope 顶层 `caller_cwd`，且只在 `caller_cwd` 能力位下发送。内核应把它作为 CLI 工作目录；我们当前没有读取，`sanitize` 也会把它从 body 中删掉。

### 3.7 V3 provider facts

`generation_controls_v3` + `provider_managed_tools_v1` + `message_threads_beta` + `system_text_cache_v3` 是一组 V3 契约。面板会：

- 拒绝不支持的 provider tool 类型（`kernel-request.mjs:49-81`）。
- 决定是否把托管工具/历史交给内核。
- 在 V3 下保留 system text 缓存标记、thread beta、native 队列头。

3.1.6 manifest 声明了 `generation_controls_v3` 和 `native_history_v3`，说明 V3 是 3.1.x 的正式面。我们不能只按旧 crag v2 的 5 个 manifest 能力实现。

### 3.8 3.1.6 遥测内容

面板侧 apply 契约已经对齐：

```json
请求: {"enabled": true}
成功: {"ok":true,"applied":true,"enabled":true,"scope":"native_claude_launch","upload_confirmed":false}
409: {"error":{"type":"telemetry_restart_required"}}
```

3.1.6 新增的是内核侧内容：

- 原生 Claude Code 遥测事件；
- 字段白名单；
- 成功 handoff 后的有界刷尾；
- health `crag_telemetry_content_v1: true`；
- `vm_telemetry` / `telemetry_ready` / `telemetry` 安全状态。

`docs/TELEMETRY.md` 明确：CRAG 使用独立 Unix-socket 控制路由，不走 queue/ACK；`upload_confirmed:false` 只表示策略已应用，不代表已上传。我们目前只有 apply 形状，没有内容发送与 health 状态。

### 3.9 非契约端点

- `/internal/identity`：面板 shell 采集；上游 crag 无 HTTP 路径。
- `/internal/v1/models`：面板本地 `model-policy`；无调用方。
- `/internal/oauth/usage`：`callWorkerGet` 短路到厂商 `kin-worker`；上游 crag 无 HTTP 路径。
- `oauth models/usage/profile`：3.1.6 `--help` 没有 `oauth`；实测也不识别。属于我们自建扩展，不是上游契约。

### 3.10 速率头

仍未有上游直接证据。面板确实依赖 `anthropic-ratelimit-*` / `retry-after`；但 `share/crag/kin-kernel` 与 3.1.6 可见字符串都未证明 worker 会发。继续列为 P2 待证，不与 3.1.6 原生遥测混在一起。

---

## 4. 还原优先级

### P0（不做就无法“像上游”）

1. **health 证明字段**：`effective_config`、`license_valid`、`active_requests`、`cleaning`、`prewarm_enabled`、`capacity`。
2. **能力位**：至少 `prompt_append`、`prompt_replace`；否则 `crag_prompt` 永远被面板剥掉。
3. **修 `crag_prompt.replace`**：把 `replace_system` 判断移出 `has_client_tools`。

### P1（请求面完整）

4. `model_directive` + `crag_model` 消费。
5. `caller_cwd`。
6. `generation_controls_v3` + `system_text_cache_v3`。
7. `provider_managed_tools_v1`。
8. `message_threads_beta` / `linux_tui_native_queue`（按是否支持 V3 决定）。

### P2（部署/兼容）

9. 3.1.6 原生遥测内容发送与 health 状态。
10. `--license-capabilities` 从 `0/0` 改为 `1/1`（或明确保留自建授权路径）。
11. 速率头/retry-after/response_headers。
12. 3.1.6 默认 payload pin（当前 `origin/main` 仍是 3.1.5）。

---

### 4.1 P0 落地状态（2026-11-18 本轮）

| P0 项 | 状态 | 落点 |
| :--- | :--- | :--- |
| health 证明字段（`effective_config` / `license_valid` / `active_requests` / `cleaning` / `prewarm_enabled` / `capacity`） | ✅ 已报 | `gateway.rs::health`（`effective_config` 只放非敏感项） |
| 能力位 `prompt_append` / `prompt_replace` | ✅ 已声明 | `gateway.rs` health.capabilities |
| `crag_prompt.replace` 无工具分支 | ✅ 已修 | `gateway.rs::system_replace_mode`（判定移出 `has_client_tools`） |

证据补充：面板 `prepareCragPrintBody` 无条件 `delete out.system`，再由 `gateCragBody` 按
`prompt_<mode>` 决定是否放回 `crag_prompt`。所以此前**调用方的 system 是整段丢失**，不是样式差异。
`crag_telemetry_content_v1` 未实现，保持 `false`，不声明。

## 5. 离线验证

已执行、可复现：

```text
crag-v2 --version              → 3.1.6-native-v3 (CRAG native V3)
crag-v2 --license-capabilities → {"host_subscription":1,"host_subscription_reclaim":1}
crag-v2 oauth models ...       → cannot read kernel config（不识别 oauth）
share/crag/kin-kernel health   → version=0.2.0, execution_mode=crag_slots（内层内核，不是外层契约）
```

下一步应加的单测：

1. `health`：断言 `effective_config`、`license_valid`、`active_requests`、`cleaning`、`capacity`。
2. `crag_prompt`：无工具 + `mode=replace` 必须走 `--system-prompt`；`append` 必须走 `--append-system-prompt`。
3. `crag_model`：能力位开启时消费，关闭时必须剥掉。
4. `caller_cwd`：能力位开启时进入 CLI cwd，不得出现在上游 body。
5. `provider_managed_tools_v1`：支持/拒绝两类请求都前置 400，不落到 Anthropic。
6. telemetry apply：成功/409/health 状态；3.1.6 content 能力只声明真实支持。

全部用假 CLI、假 kernel.json、`--network none` 或面板沙盒；真实请求仍只留最后一条 vm-02。

---

## 6. 功能清单与置信度

置信度定义：

| 等级 | 含义 | 证据标准 |
| :--- | :--- | :--- |
| A | 已确认 | 直接二进制输出、公开 manifest/SOURCES、或当前主线源码 |
| B | 高置信 | 面板源码 + 单测明确门禁，但没有外层 3.1.6 运行态实测 |
| C | 中置信 | 仅 release note、提交说明或旧版规格推断 |
| D | 未知 | 加密 payload 内部，或无法离线观察 |

| 功能域 | 具体功能 | 证据 | 置信度 | 我方现状 |
| :--- | :--- | :--- | :---: | :--- |
| 版本/打包 | `3.1.6-native-v3`；manifest 11 项能力；官方 Claude 2.1.321；crag-v2/payload/license 文件 | 3.1.6 manifest、`--version`、SHA256SUMS | A | 自建包，版本/能力面不同 |
| 启动/CLI | `--gateway-worker`；`--v2-transport tui`；max-procs/session-slots/max-queue；三类超时；socket/host/port；proxy/direct/bare；allow-unauthenticated | 3.1.6 `--help` | A | 部分实现，参数面未逐项对齐 |
| License | machine-code/activate/status/public-key；`host_subscription=1`、`reclaim=1` | 3.1.6 CLI 实测；`vm-runtime.mjs:403-409` | A（CLI）/B（面板门禁） | `0/0`，与上游相反 |
| Health | `effective_config`、`license_valid`、`active_requests`、`cleaning`、`capacity`、`prewarm_enabled`、`ready_slots`、`telemetry*` | `go-worker-client.mjs:1621`；`crag-runtime-inventory.mjs:40-55`；`rust-kernel-supervisor.mjs:669`；单测 | B | 缺多数证明字段 |
| HTTP 控制面 | health、messages、cancel、telemetry events/apply | 面板调用点；旧 `05` 文档；内层 kin-kernel health 实测 | A（路径）/B（外层响应） | 已实现主要路径 |
| 请求整形 | `crag_prompt` append/replace/64KiB；`crag_model`；`caller_cwd`；system/cache | `crag-print-prompt.mjs`、`kernel-request.mjs`、`go-worker-client.mjs`、单测 | B | `crag_prompt` 未声明；replace 有 bug；另两项未读 |
| V3 契约 | `generation_controls_v3`、`native_history_v3`、`provider_result_v2`、`native_handoff_v1` | manifest；`kernel-request.mjs:49-81`；`handle-protocol.mjs:1847`；提交 `80be195b` | B（存在）/C（精确语义） | 未声明、未实现 |
| V3 托管工具 | web_search/web_fetch/code_execution/tool_search；provider history | `provider_managed_tools_v1` 门禁；单测 | C | 未实现 |
| 流式/错误 | SSE 组装；thinking-only `max_tokens` 200；工具续接；本地队列 529 | `9a1ff3d4`、`7ff5d3c0`、`a54cbc3a`、`8a433cbd` | B | SSE 主体已实现；错误细节待逐项对 |
| 3.1.6 遥测 | apply 契约；原生 CC 事件；字段白名单；成功交接后有界刷尾 | Release note；`SOURCES.health_capabilities`；`docs/TELEMETRY.md` | A（apply）/C（内容） | apply 已对齐；内容未实现 |
| 槽位/运行时 | `active_requests`、`capacity`、并发准入、宿主订阅名额 | `60cec605`、`0ea0477b`、`cbf3b644`；inventory/ supervisor 单测 | B | 部分字段缺失 |
| 非功能 | identity/models/usage 三条 HTTP；`oauth` 子命令 | 3.1.6 `--help` 无 oauth；面板 shell/model-policy/kin-worker 路径 | A | 自建扩展，非上游契约 |
| 速率头 | `anthropic-ratelimit-*`、`retry-after`、SSE `response_headers` | 面板六处消费者；上游可见字符串未证实 | A（面板依赖）/D（上游行为） | 未实现；先补证 |

### 6.1 置信度解释

- **A 类**只给直接可复现的事实：二进制输出、公开 manifest、当前主线源码。3.1.6 外层 gateway 因无有效授权无法启动，所以外层的完整 health/响应头仍不能算 A。
- **B 类**给面板源码与单测能证明的门禁：能力位存在、字段会被读取/剥离、health 字段会被消费。它不能证明加密 payload 内部的精确实现。
- **C 类**只给 release note、提交说明、旧版规格或测试间接推断：V3 托管工具语义、遥测事件名/白名单、部分错误映射。
- **D 类**是加密 payload 内部：CCH wire、TLS/HTTP2 字节、遥测具体 endpoint、外层 health 的完整字段。没有官方 golden 流量或有效授权，不能靠猜。

### 6.2 对“完全替代”的判断

按当前证据，**“能跑”与“与上游等价”是两件事**：

- 推理主链路、health/cancel/telemetry apply：已有较高置信度，可继续用假 CLI 做差分。
- 能力位/请求整形：面板源码与单测足够明确，可以开始实现。
- V3 provider 工具、3.1.6 遥测内容、外层 health 全字段、速率头：证据不足，先做契约测试或只读探针，不应直接照猜实现。

---

## 7. 实施决策

### 7.1 先做（A/B 类，离线可测）

1. **health 证明字段**：`effective_config`、`license_valid`、`active_requests`、`cleaning`、`prewarm_enabled`、`capacity`。
2. **能力位**：`prompt_append`、`prompt_replace`。
3. **修 `crag_prompt.replace`**：无客户端工具时也必须走 `--system-prompt`。
4. **契约测试**：用假 Unix socket + 假 CLI 断言 health 字段和 `--system-prompt`/`--append-system-prompt`。

### 7.2 再做（B 类，但需要面板沙盒）

5. `model_directive` + `crag_model`。
6. `caller_cwd`。
7. `generation_controls_v3` + `system_text_cache_v3`。
8. `provider_managed_tools_v1`。

每加一个能力位，必须同时实现对应消费逻辑；**不能先声明后实现**，否则面板会把不支持的字段发进来。

### 7.3 暂缓（C/D 类）

9. 3.1.6 原生遥测内容：等能观察外层 3.1.6 或拿到官方事件样本。
10. 速率头/retry-after：先用假 CLI/只读上游确认是否由 worker 发出。
11. `--license-capabilities` 的 `0/0 → 1/1`：这是产品/授权路径决策，不是纯代码对齐；改之前要确认自建订阅与面板宿主订阅是否二选一。

### 7.4 完成 P0 后的验收

- 面板沙盒：`internalTokenAuthenticated=true`、`license_valid=true`、`active_requests` 为整数。
- 带 `capabilities` 的请求：`crag_prompt` 不再被 `gateCragBody` 删除。
- 无工具 + `zero`：CLI 参数必须是 `--system-prompt`；`official_full` 必须是 `--append-system-prompt`。
- 以上全部不访问生产账号；真实请求仍只留最后一条 vm-02。
