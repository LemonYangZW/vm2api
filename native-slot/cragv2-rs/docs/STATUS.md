# CRAG 内核现状与待办（快照 2026-11-19）

> 这份是"开工前读一页"的索引：现在到哪了、哪些结论已经翻案、下一步做什么、什么条件下才花钱。
> 深度证据仍在 `CRAG_RECON.md`（上游功能还原）、`CONTRACT_MATRIX.md`（契约矩阵）、
> `CONTRACT_AUDIT.md`（现网核对）、`GAP_IMPL_SPEC.md`（实现规格）。

## 0. 一句话

我们的 Rust 内核 `cragv2-rs` 已经能当 CRAG 内核用（5 条 HTTP + 1 个 exec + 推理协议），
**契约缺口从"猜"降到了清单化**；剩下的分两类：不需要花钱就能做的（P1 配置/请求面），
和**必须买 3.1.7 许可才能对照的**（V3 精确语义、遥测事件名、CCH wire）。后者按决策暂缓。

## 1. 基线

| 项 | 我们的值 | 上游最新 |
| :--- | :--- | :--- |
| 面板 | 1.4.142（+41 自研提交） | **v1.4.155** |
| CRAG 载荷 pin | **3.1.7**（本轮补） | `payload-2026.11.19-crag-3.1.7` |
| 官方 Claude CLI | 2.1.321 | 2.1.321（未变） |
| manifest 能力位 | — | 11 项（无 `prompt_*`） |

3.1.7 包校验值（`src/lib/admin/kernel-catalog.mjs`）：
archive `9a286647…` 171,009,876 B；manifest `2bd7ce44…`；`payload.key_id 835451e2…`。

## 2. 本轮已落地（内核侧）

| 改动 | 位置 | 为什么 |
| :--- | :--- | :--- |
| health 补 `effective_config` / `license_valid` / `active_requests` / `cleaning` / `prewarm_enabled` / `capacity` | `src/gateway.rs::health` | 缺 `effective_config` → 面板 `internalTokenAuthenticated` 永不为 true → 该槽在运行时盘点里恒为 unknown（容量不回收、忙闲失真） |
| health.capabilities 加 `prompt_append` / `prompt_replace` | 同上 | 面板 `prepareCragPrintBody` 无条件 `delete out.system`，再按 `prompt_<mode>` 决定放回 `crag_prompt`；不声明 = **调用方 system 整段丢失** |
| `crag_prompt.replace` 判定移出 `has_client_tools` | `system_replace_mode()` | 无工具的 replace 请求会退化成 `--append-system-prompt` |
| `serve_tcp` 加 `#[cfg(unix)]` | `src/gateway.rs` / `src/main.rs` | 原来唯 Windows 编译不过（E0433），测试根本跑不起来 |
| `cc_version` 断言改取 `cragv2::VERSION` | `tests/gateway_direct.rs` | 硬编码 2.1.303 与 `VERSION=2.1.321` 冲突 |

验证：`cargo test` → lib 164 项 + 集成各套件全绿（Windows）。仍红 2 条
`tests/jsref_system.rs`：`system::IDENTITY` 与本地 `../testdata/jsref/ref.cjs`（现网 cli-node 副本，未入库）漂移，**待定谁为准**，与上表改动无重叠。

## 3. 已翻案的结论（别再按旧文档做）

| 旧结论 | 实际 | 依据 |
| :--- | :--- | :--- |
| 速率头（`anthropic-ratelimit-*`/`retry-after`/SSE `response_headers`）是"唯一必须动手的硬缺口" | **上游同形缺口，不实现** | 免费的 `kin-kernel-crag`（v1.4.155，not stripped）全二进制 `anthropic-ratelimit` 命中 0 次 |
| 3.1.7 沿用 3.1.6 的载荷密钥（"授权与产品密钥不变"） | **载荷密钥换代即轮换**：3.1.7 `835451e2…` ≠ 3.1.6 `6f4e3119…` | 读 3.1.7 包内 `manifest.json` |
| `prompt_append` / `prompt_replace` 需要改包 | 只在 **health.capabilities**，manifest 不含，不用改包 | 同上 |
| 内核内部只能靠许可 | worker/slot/SSE/错误码/`x-kin-*` 头**免费可得**（`kin-kernel-crag` 未 strip） | `CRAG_RECON.md` §2.6 |

## 4. 待办

### P1（不花钱，可离线验证）

1. `model_directive` + 消费 `crag_model`（能力位与消费逻辑必须同时落地：只声明不实现，面板会把字段发进来）
2. `caller_cwd` → 进 CLI cwd，且不得残留在出站 body
3. 未消费的 `kernel.json` 键：`max_queue` / `queue_timeout_seconds` / `default_model`
4. `crag_prompt.replace` 的 64 KiB 上限（上游 400 `crag_prompt_too_large`）

### P2（需要面板沙盒）

5. `generation_controls_v3` / `system_text_cache_v3` / `provider_managed_tools_v1` / `message_threads_beta`
   —— **声明就切分支**：`generation_controls_v3` 会关掉面板"往 body 塞 betas"的路径，beta 选择权整体转到内核。
   没有上游对照前不要声明。

### 明确不做

- 破解/伪造许可、自签包替代校验（`crag-license.mjs` 的判定一行不改）
- 宣称与 3.1.7 "等价"；未对照的部分一律标"未与上游对照"

## 5. 许可决策（等到真需要上 CRAG 再买）

**触发条件**：要交付 V3 面 / 要逐字节对照外层 health 与响应头 / 要确认速率头实际行为时。

**买什么**：必须买**绑 3.1.7 载荷**的许可。3.1.6 的许可在 3.1.7 上必然
`license_payload_key_mismatch`（面板表现为 `crag_subscription_migration_required`）。
预期形态：一份许可 = 一台槽（绑 `vm_id` + `machine_id_hash` + `device_public_key`），
换代要重新签发；期限只在 bootstrap 判，解出来的 K 不受期限约束。

**买到之后的顺序**（不要跳步）：

1. 官方 3.1.6/3.1.7 外层跑在隔离槽 → `GET /internal/health` 取全字段真值，回填 `CONTRACT_MATRIX`
2. `native-slot/tools/upstream-probe`（三层差分，已恢复入库）跑假 CLI / 假上游对照
3. 只有仍无法回答的（V3 精确语义、遥测事件名、CCH wire）才考虑解封载荷：
   `node native-slot/tools/crag-unseal/unseal.mjs --package <3.1.7 包> --license-dir <槽内目录>`
   —— 工具只做"用你自己的合法许可还原 K 再解密"，不碰许可判定；`--check` 模式不需要许可

## 6. 免授权可得面（索引）

`CRAG_RECON.md` §2.6。要点：`kin-kernel-crag`/`kin-kernel`/官方 `claude` 2.1.321 都是公开免费资产；
bootstrap `crag-v2` 虽 stripped 但 .rodata 明文（payload framing 与 AAD 常量可读）。
覆盖不到的只有 3.1.x 的 V3 面与遥测内容。

## 7. 一份包能证明什么、不能证明什么

- 能：文件哈希、manifest 能力位、`payload.key_id`、载荷头结构、AAD 候选
- 不能：加密载荷内部实现、V3 精确语义、遥测事件名、TLS/h2 wire 字节
