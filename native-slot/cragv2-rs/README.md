# cragv2-rs — CRAG v2 原生内核（Rust）

按 `reverse/kin-kernel/docs/11_CRAG_V2_SPEC.md` §5/§6/§9.3 复刻的 **CRAG V2 数据面内核**。
目标形态就是上游那个加密包里的 Rust 内核：**自控 HTTP/TLS wire、CCH 在 wire 层打戳、
对外复用 `kin-kernel` 的 `--gateway-worker --config` + Unix socket 契约**。

> 参考真值只有两份：`11_CRAG_V2_SPEC.md`（§5 运行时分层 / §5.2 native adapter 12 API /
> §5.4 NDJSON 帧 / §6 指纹与 CCH / §9.3 模块划分）与控制面现网实现
> `src/lib/transport/{rust-kernel-client,go-worker-client}.mjs`（socket 与信封契约）。
> legacy Node 版 `share/crag-v2` **不是**本实现的目标形态，只在需要核对常量时取数，
> 不照抄它的 gateway/worker 架构。

## 当前进度（M1）

| 模块 | 状态 | 说明 |
| --- | :---: | --- |
| `main.rs` | ✅ | `--gateway-worker --config <kernel.json>`、`--socket`、`--fake-cli`、信号收尾 |
| `config.rs` | ✅ | `kernel.json` 解析（dataplane / slots_per_worker / cli_bin / cli_args / upstream_base），未知字段保留；`crag_cli_args()` = `--single-process-subagents --max-procs <n> --continuous-tool-loop` |
| `gateway.rs` | ✅ | `/internal/health`、`/internal/v1/messages`、`/internal/v1/cancel`、`/internal/v1/telemetry/events`、`/v1/models`、`/healthz`；token 认证（`x-kin-internal-token` / `x-internal-token`）；SSE 与**非流式聚合**双路；16 MiB 帧/体上限 |
| `ndjson.rs` | ✅ | `StdinFrame` / `StdoutFrame` 帧、16 MiB 上限、背压写入、出站脱敏 |
| `slot.rs` | ✅ | 单进程多槽宿主：按 `session_id` 帧路由、`ready_slots`、`waiting`（tool loop 停放）、取消释放、关闭回收 |
| `protocol/cch.rs` | ✅ | `xxh64` + `project_for_cch`（compact → billing 重置 → model 清空 → 裁 fallbacks/credit/max_tokens）+ `compute_cch` + `stamp_cch_body`；**与现网 JS 向量逐字节对齐** |
| `protocol/identity.rs` | ✅ | `claude-cli/2.1.303 (external, cli)`、`x-app`、UUIDv4、`metadata.user_id`；`x-stainless-package-version` 保留真实 **0.74.0**（§6.3 硬约束） |
| `protocol/beta.rs` | ✅ | 主表顺序即出站排序键、EXTRA 追加、`KIN_ENV_BETA_SKIP` + 现网 `ENV_BETA_SKIP` 关闭、`header_for(name)` 查注册表 |
| `protocol/billing.rs` | ✅ | `billing_indexes_from_messages` + billing 头模板；`cc_gateway` / `cc_project` 只从可信上下文发出，**不造值** |
| `protocol/system.rs` | ✅ | system 布局（stock/identity/zero）、`withCchPlaceholder(InPlace)`、`finalizeZeroBilling`、`wireSystemBlocks`、`leftoverFromSystemPrompt`；与现网 JS **逐字节差分**通过 |
| `protocol/preflight.rs` | ✅ | 上游前最后一道闸：缓存标记规则（1h 必须在 5m 前 / 上限 4 / thinking 不可标）、messages 形状、role 校验、按合并 turn 判 tool_use↔tool_result 配对与 id 唯一；命中 400 且**请求不出网** |
| `protocol/cache.rs` | ✅ | marker 上限 4（tools→system→messages 逆序先删）、thinking 块不缓存、单 message marker、TTL 补齐（仅当调用方显式声明过）、preserve 段豁免；与现网 JS **逐字节差分**通过 |
| `protocol/tables.rs` | ✅ | **自动生成**：22 模型（含 capabilities/输出上限/知识截止）、alias 与 per-provider 映射、LATEST_PER_FAMILY、39 条 BETA_REGISTRY、ENV_BETA_SKIP、effort/thinking/permission/request-class 枚举 |
| `protocol/models.rs` | ✅ | 查询语义：alias（含 provider 分流）、家族推断、thinking、输出上限、目录 |
| `credential.rs` | ✅ | `credentials.json` 读写（对齐 `worker/internal/credential/store.go`）：camel/snake 双写兼容、`expiresAt` 毫秒、`kinGeneration` 单调递增、原子写 `0600`、unix `flock` |
| `oauth.rs` | ✅ | OAuth 刷新 + `ensure(force)`：进程内单飞、缺 refresh token 判致命、429/5xx 重试、失败后比对磁盘 generation 兜底；官方 payload + `user-agent: axios/1.13.6` |
| 凭据接线 | ✅ | `UpstreamClient.auth_header()` 每 hop 先 `ensure(false)`：过期才刷新，`oauth → authorization: Bearer`，`apikey → x-api-key`；凭据不可用则**不发请求**（fail closed） |
| `http/one.rs` | ✅ | 通用 HTTP/1.1 客户端（MCP 回调与 OAuth 端点共用）：http/https、自定义 CA、`content-length`/`chunked`、1 MiB 上限 |
| `protocol/attribution.rs` | ✅ | attribution 计费头（`getAttributionHeader`）：env 门控、`cc_version=<cli>.<fp>`、订阅者字段形状校验、索引钳制；与 oracle 差分通过 |
| `protocol/classifier.rs` | ✅ | 分类器请求：`classifierSystemBlocks`（剔除 billing 块、可选前置 attribution）与 `validClassifierContext`（tool/xml 分支） |
| `probe.rs` | ✅ | 真机前自检 `crag-v2 probe`：配置 → 凭据（脱敏 + 剩余时长）→ 代理隧道 → TLS(ALPN h2) → `GET /v1/models`（信息项）；退出码 0/1/2/3/4，凭据不可用**不建链** |
| `restricted.rs` | ✅ | `--restricted` 路径守卫（§6.3）：词法规整 `..`、canonicalize 防符号链接逃逸、最近存在祖先兜底、cwd + add-dir 白名单；MCP 桥越界时**不回调**、直接报工具错误 |
| `mcp.rs` | ✅ | stdio JSON-RPC 工具桥（`crag-v2 mcp-bridge --config`）：initialize / tools/list / tools/call / ping / notifications；`tools/call` 回调控制面（含 chunked 解码），serverInfo `crag-v2` / `2.1.88-v2` |
| `http/wire.rs` | ✅ | 出站头集合（顺序稳定）+ body 一次成型（CCH 打戳点）+ `content-length` 自洽 |
| `http/tls.rs` | ✅ | rustls(ring) + ALPN 只谈 `h2` + 系统根证书/自定义 CA（企业代理、私有网关） |
| `http/client.rs` | ✅ | 手写 h2 客户端（`h2::client`）、**连接复用**（复用失败自动重建重试一次）、SSE 增量解码（跨 chunk 半行/半事件）、流控释放 |
| `http/proxy.rs` | ✅ | 出口：`socks5://` / `socks5h://`（用户名密码 + ATYP 域名/IP）与 `http://` CONNECT（Basic 认证）；`proxy_required` 且空 URL 时**拒绝启动**，不静默直连 |
| 直连 hop | ✅ | `upstream_mode=direct`：入站 → 补齐 billing 头 → 重排 beta → wire 打戳 → h2 → SSE/JSON 回投；**不起 CLI** |

### M1 验证

```sh
cd native-slot/cragv2-rs
cargo test            # 150 项（Windows）/ 151 项（Linux 容器 / oracle arm64），全绿（槽位 4 / h2 3 / 直连 4 / 代理隧道 3 / 数据表 2 / system 差分 2 / cache 差分 1 / 其它）
cargo build --release # 产物 target/release/crag-v2(.exe)
```

离线手动跑：

```sh
target/release/crag-v2 --config testdata/kernel.json --fake-cli --socket /tmp/crag.sock
curl --unix-socket /tmp/crag.sock http://crag/internal/health
curl --unix-socket /tmp/crag.sock -sS http://crag/internal/v1/messages \
  -H 'content-type: application/json' \
  -d '{"request_id":"r1","stream":true,"body":{"model":"claude-opus-5-5","max_tokens":8,"messages":[{"role":"user","content":"ping"}]}}'
```

Windows 上无 unix socket，`serve` 自动退回本机 TCP（`KIN_KERNEL_TCP=127.0.0.1:PORT`，默认随机端口），
启动时打印实际地址，端到端测试走这条路。

### 协议数据表（生成，不手抄）

```sh
node tools/gen-protocol-tables.mjs          # 重新生成 src/protocol/tables.rs
node tools/gen-protocol-tables.mjs --check  # 只比对（CI 用）
node tools/gen-protocol-tables.mjs --source <new-protocol303.mjs>
```

源默认是 `git show origin/fix/sqlite-off-event-loop:share/crag-v2/runtime/protocol303.mjs`
（上游最后随分支发布的明文形态），生成文件头部写入源 sha256；`tests/tables_source.rs`
会在源与常量不一致时失败。换上游版本只需换 `--source` 并重跑。

### 出站 system 布局

直连 hop 会先补齐 billing 头（占位 `cch=00000`），再按现网语义把 `[{text}]` 形状的
system 规范化（`wire_system_blocks`：只保留 `type/text/cache_control`，billing 行重置占位）。
非标准 system（字符串或异形块）保持原样，不猜结构。
`CLAUDE_CODE_SYSTEM_LAYOUT=zero` 时走 zero 布局（单条 billing 块 + environment 块）。

缓存 marker 由信封的 `preserve_cache_breakpoints` / `cache_ttl` 驱动：
preserve 为真时完全不动调用方 marker；为假时按现网规则接管（上限 4、
thinking 块不缓存、只给显式声明过 TTL 的请求补 ttl）。

### 与上游 oracle 的批量差分（441 条）

```sh
node tools/gen-oracle-vectors.mjs   # 重新生成 testdata/oracle-vectors.json
cargo test --test oracle_diff       # 逐条比对
```

`tools/gen-oracle-vectors.mjs` 用**固定种子的确定性随机**造 354 条用例，交给现网 JS
实现算期望值（批量的走 `testdata/jsref/ref.cjs`；`layout`/`resolveTtl`/`boundedIndex`/
`apiGates` 直接调 `modules.cjs` 导出，避免为了跑测试去改 oracle 脚本），Rust 侧逐条比对：

| op | 条数 | 说明 |
| --- | :---: | --- |
| `cch` | 60 | 45 条强制带 billing 头（覆盖真实打戳路径） |
| `cchPlaceholder` / `InPlace` | 20 / 20 | 含多 cch、大小写、无 entrypoint 等边界 |
| `wire` | 30 | 标准 `[{text}]` 与异形 system（期望 `null`） |
| `leftover` | 20 | billing / IDENTITY / environment / 默认 agent 字段的剔除 |
| `zero` | 10 | `prompt_version` 剥离与 `cc_prompt_id` 注入（UUID 归一后比对） |
| `explicitTtl` | 15 | `5m` 优先、嵌套 content |
| `cache` | 40 | marker 超标裁剪顺序、thinking、scope、preserve 组合 |
| `betas` | 50 | `withRequestProtocolBetas` 全部 20 余条分支 |
| `merge` | 12 | EXTRA 注入 + 主表顺序 |
| `setupBetas` | 10 | legacy haiku 分流 |
| `layout` | 24 | `layoutSystemBlocks`（stock/identity/zero × 时区 × attribution × leftover） |
| `resolveTtl` | 15 | `resolveKinCacheTtl`（显式 → 面板 → `1h`） |
| `boundedIndex` | 20 | `boundedBillingIndex`（整数/越界/非整数两侧） |
| `apiGates` | 8 | `attributionGates`（4 provider × 订阅者） |
| `attribution` | 30 | `getAttributionHeader`：开关门控、`cc_version=<cli>.<fp>`、订阅者字段、req/uuid/origin 形状校验、索引钳制 |
| `classifierSystem` | 20 | `classifierSystemBlocks`（billing 块剔除 + attribution 前置） |
| `classifierValid` | 24 | `validClassifierContext`（tool / xml 两条分支的合法与非法） |
| `apiProvider` / `cliVersion` | 13 | `getAPIProvider` 优先级、`officialCliVersion` 解析 |

测试自带**鉴别力自检**（非 null 比例 ≥70%、真正打戳样本 ≥30、`wire` 的 null 与数组
两侧都存在、`betas` 非空 ≥20、`layout` 都 ≥2 块、`apiGates` 覆盖 includeCch 真假、
`boundedIndex` 覆盖越界与合法、`classifierValid` 覆盖 true/false 两侧），避免
「全过」其实是「全空」。
变异验证记录：把 `CCH_SEED` 改一位 → 立刻 32 条不一致。

导出清单里能覆盖的已全部纳入（`projectForCch` / `computeCch` 由 `cch` 覆盖，
`getSystemLayout` / `getKinTimezone` 由 `layout` 覆盖）。仍未覆盖：`readPanelCliVersion`
与 `setJobCliVersion`（进程级面板/任务状态，非 wire 语义）、以及上游 Bun 层的真实
TLS/h2 帧字节（§6.3 承认的天花板）。

### 自签包与授权链（供自建槽位使用）

上游从未发布 `crag-v2-licensed-amd64.tar.gz`（100 个 Release 全查为 0），现网 `share/crag/kernels/v2`
也不存在。要在自家机器上跑，只能自签一套包 + 注册码（规格 §2/§3，信任锚是
`pinnedAuthority` 的 TOFU）：

```sh
# 1) 编出 Linux ELF（Windows 产物是 PE，需在容器/arm64 上编）
docker run --rm -v "$PWD/native-slot/cragv2-rs:/src" -w /src -e CARGO_TARGET_DIR=/tmp/t   <rust-image> sh -c 'cargo build --release --quiet && mkdir -p /src/dist-linux && cp /tmp/t/release/crag-v2 /src/dist-linux/crag-v2'

# 2) 生成包 + 注册码（包目录与附属文件分开：包内多一个未列文件就会被拒）
node tools/selfsign-package.mjs --bin dist-linux/crag-v2 --arch arm64 --out .tmp/pkg --term 1m

# 3) 用**上游校验器**验证（必须在 Linux 上跑：NTFS 没有可执行位）
node tools/verify-selfsigned.mjs --pkg .tmp/pkg --license .tmp/pkg-license   --upstream <1.4.048 导出目录>
```

产物：

| 路径 | 内容 |
| --- | --- |
| `<out>/manifest.json` | family/version/arch/capabilities/authorization/payload/sha256 全字段 |
| `<out>/crag-v2` | 我们的 Rust 内核（`ELF machine` 必须与 arch 一致） |
| `<out>/claude-code-2.1.317/claude` | 第二个合规 ELF（结构校验要求） |
| `<out>/crag-license-public.pem` | 自签发行公钥（TOFU 信任锚） |
| `<out>/crag-v2.payload.enc` | `CRAGV2E1`\|nonce\|tag\|AES-256-GCM(内核, K, AAD) |
| `<out>-license/device.json` | 模拟设备身份（x25519，0600） |
| `<out>-license/machine.code` | `CRAGM1.<b64url(binding+device_pub)>` |
| `<out>-license/registration.code` | `CRAGL1.<b64url(claims)>.<b64url(ed25519 sig)>` |

验证结果（amd64 与 arm64 各一次，均在本机/oracle 容器内跑上游 `verifyCragV2Tree` 与
`verifyCragRegistration`）：

```text
OK   verifyCragV2Tree: arch=arm64 key_id=… caps=5
OK   verifyCragRegistration: status=valid term=1m expires_at=…
OK   负向：篡改 payload 被拒（crag_v2_hash_mismatch）
OK   负向：换设备 → license_binding_mismatch
SELF-SIGNED VERIFY: ALL GREEN
```

要点：
- 包目录里只允许 `manifest.json` + 4 个文件；`device.json` 等**必须放包外**，否则
  `verifyCragV2Tree` 报 `has unlisted file`。
- `manifest.arch` 必须等于**目标机** arch；官方 amd64 包在 arm64（oracle）上会被
  `crag_v2_arch_mismatch` 拒掉，所以自建包反而更通用。
- 注册码签名用**发行私钥**，验证用包内 pem 的发行公钥；设备公钥只参与 `wrapped_key` 解封
  （第一次实现传错公钥，被上游校验器当场拒）。

### 与 cli-node 真实出站快照的对照（2026-11-06 实测）

真值来自现网 `kin.db` 的 `request_log_debug.outbound_headers`（`via: rust-kernel-stream`，
官方 303 形态）。逐项判定后补齐/明确不补：

| 头 | 真实值 | 本实现 | 依据 |
| --- | --- | --- | --- |
| `anthropic-dangerous-direct-browser-access` | `true` | ✅ 已补 | Go `ApplyOfficialHeaders` 显式设置 |
| `x-claude-code-session-id` | uuid | ✅ 已补（= 本次 hop 的 session） | Go 内核显式设置 |
| `accept` | `application/json, text/event-stream` | ✅ 流式/非流式区分 | 流式为 cli-node 形态 |
| `x-claude-code-request-class` | `subagent` | ✅ `main` | 直连等价 `RequestClass("sdk")` |
| `x-stainless-package-version` | `0.128.0` | `0.74.0` | 产品线差异：crag v2 是 2.1.88 基线（§6.3 硬约束） |
| `x-stainless-timeout` | `600` | 不发 | Go 注释：2026-10-24 起 SDK 不再写；现网那条来自 cli-node |
| `accept-encoding: gzip, br` | 有 | 不发 | 我们不解压，发了会拿到压缩体 |
| `x-claude-code-prompt-id` | 有 | 不发 | Go 仅在 `CLAUDE_CODE_GATEWAY_HINT_HEADERS` 时从 body 提取 |

### 真机前自检（不发推理请求）

```sh
# 槽位容器内
sh tools/preflight-live.sh /etc/kin/kernel.json
# 或直接
crag-v2 probe --config /run/kin/kernel.json
```

输出逐项 `[OK]/[FAIL]/[WARN]`，末行 `PROBE_JSON {...}` 方便脚本解析：

| 项 | 内容 | 失败退出码 |
| --- | --- | :---: |
| `config` | `upstream_mode` / `upstream_base` 可解析 | — |
| `credential` | 凭据可读、`kind`/`scheme`、脱敏 token、剩余时长 | 1 |
| `proxy` | 按 `proxy_url` 真建隧道到上游（只握手） | 2 |
| `tls_h2` | TLS 谈成 `h2` 并完成 h2 握手 | 3 |
| `endpoint` | `GET /v1/models`（401/403 记为信息项，不影响 messages） | 4（仅 `PROBE_REQUIRE_ENDPOINT=1`） |

凭据不可用时**直接返回，不建任何连接**（fail closed，与 hop 路径一致）。

### 容器内验收（覆盖 Windows 上跑不到的 unix socket 分支）

```sh
docker run --rm -v "$PWD/native-slot/cragv2-rs:/src" -w /src   -e CARGO_TARGET_DIR=/tmp/target <rust-image> sh -c   'tr -d "
" < tools/verify-docker.sh > /tmp/v.sh && sh /tmp/v.sh'
```

`tools/verify-docker.sh` 跑四步：

1. `cargo test`：容器内 node 相关差分（`tests/jsref_*.rs`、数据表漂移）
   会因缺 node / 缺 `testdata/jsref` 自动 skip，其余全跑；
2. `cargo build --release`；
3. **slot 模式进程冒烟**：真 unix socket 上 `--config testdata/kernel-slot.json`
   + `/bin/sh testdata/fake-cli.sh` 假槽位，断言 health（`engine=rust` /
   `hop_mode=slot` / `ready_slots`）、`/v1/models`、SSE（`content_block_delta` +
   `message_stop`）、非流式（`text=pong` / `stop_reason=end_turn`）；
4. 错误路径：未知路由 404、`/internal/v1/cancel` 200、方法不匹配 405；
5. `probe` 自检：无凭据时退出码必须是 1 且不建链。

direct 模式没有 node 也能验：`gateway_direct` / `credential_wiring` /
`upstream_h2` / `proxy_tunnel` 四个集成测试自带 Rust mock（h2 / HTTP-1.1 / SOCKS5），
容器内跑的是真 unix socket 分支。

### 与现网真值的对齐点

- **CCH**：真值向量取自 `native-slot/testdata/jsref/modules.cjs`（现网 JS 模块拼接），
  `compute_cch` 与本机 `node` 输出一致（`fb9f5` / `4ff07` 两组已锁进单测）；
- **数组/键顺序**：`serde_json` 开 `preserve_order`，投影后仍是调用方键序；
- **数字形态**：投影阶段全部走**字符串级**裁切（不清洗数字），避免 `serde_json` 与
  `JSON.stringify` 的 `1.0` ↔ `1` 差异污染哈希（§9.3 已预警）；
- **版本三分**：对外 `2.1.303`、运行时基线 `2.1.88`、SDK 头 `0.74.0`，三者不得混用；
- **system 布局**：`tests/jsref_system.rs` 把 Rust 输出与现网 JS 逐字节比对
  （wire / cchPlaceholder / cchPlaceholderInPlace / leftover / zero）。

## 硬约束：不要在无法强制出口隔离的环境里让槽位 CLI 发请求

2026-11-06 事故记录（必须避免重犯）：

- slot 模式下**官方 bundle 自己发上游请求**，内核只能通过 `HTTPS_PROXY`/`ALL_PROXY`
  环境变量影响它。**环境变量不保证被遵守**（Bun 是否使用未经验证）。
- 在 oracle 上（出口只能经 `127.0.0.1:20884` 的 sing-box）做了一次 slot 模式请求，
  bundle 返回 `error`；**无法事后排除发生了直连**。直连会绕过控制面的出口策略，
  属于不可接受的风险。
- 同时那次把含密码的代理 URL 打进了日志（已 shred 销毁，代码已改为 `redact_url`）。

因此：

1. 任何会触发上游请求的验证，必须**先在网络层强制代理**（容器/网络命名空间级别），
   或在没有生产出口要求的隔离环境做；
2. 只依赖环境变量的代理**不得**用于生产槽位；
3. 日志/诊断输出必须过 `proxy::redact_url`（有单测）。

oracle 上只做零网络验证：拉起 bundle、确认 `single_process slots=N continuous=1`、
帧协议握手。

## 架构决策：slot 模式为主，direct 模式封存（2026-11-06）

**依据：上游 crag v2 不自己组装出站请求。** 它的分层是
`bootstrap ELF → 槽位 worker → native adapter → 官方 Claude Code runtime`，
包里就带着 `claude-code-2.1.317/claude`（官方 ELF）。头、betas、CCH 全部由官方
runtime 发出，内核只负责授权、解密、帧转发。

对照第一批实现（direct 模式：内核自己拼 HTTP）：

| | slot 模式（主） | direct 模式（封存） |
| --- | --- | --- |
| 出站头 / betas / CCH | 官方 bundle 保证 | 需逐个对照 cli-node，永远差几条 |
| 补丁数量 | M1 后再没动过 | 连续 5 个提交都在补 |
| 依赖 | 官方 bundle（arm64 bun + cli.js） | 无 |
| 状态 | **主路径**，oracle 上已验证能拉起 bundle | **实验/备用**，真机成功 1 次但存在已知头差异 |

实测（oracle，零网络）：内核以 slot 模式拉起官方 bundle，bundle 自报
`[crag] single_process slots=2 continuous=1`，socket 就绪。

```jsonc
// testdata/kernel-official.json
{ "dataplane": "crag", "upstream_mode": "slot",
  "cli_bin": "/opt/crag/claude.sh" }   // exec ld-linux-aarch64 + bun + cli.js
```

direct 模式保留原因：没有官方 bundle 的机器上仍能跑（自控 wire，已通过 441 条 oracle
差分），但**不要**再往里加"逐头对齐"的补丁；它的差异台账见
`testdata/real-cc-headers.json`。

## 端到端形态

```text
控制面 (Node)
   │  unix socket: /internal/v1/messages  信封 {body,headers,stream,request_id}
   ▼
crag-v2 (本 crate)
   │  protocol 层：models / beta / billing / cch / identity  → wire 字节
   │  NDJSON: {type:"user",session_id,model,message,tools,system}
   ▼
槽位 CLI（`--single-process-subagents --max-procs N --continuous-tool-loop`）
   │  NDJSON: {type:"stream_event"|"result",session_id,event,…}
   ▼
网关把 stream_event 直转 SSE，result 收尾（成功 `x-terminal-state: verified`）
```

## 直连模式（M2 起默认）

```jsonc
{ "dataplane": "crag", "slots_per_worker": 4,
  "upstream_mode": "direct",                       // direct（自控 wire）| slot（交 CLI）
  "upstream_base": "https://api.anthropic.com" }
```

链路：`/internal/v1/messages` 信封 → 补齐 billing 头（无则注入，占位 `cch=00000`）
→ beta 重排 → `wire::build_messages_request`（**唯一打戳点**）→ 自控 h2/TLS
→ `event:`/`data:` 原样回投 + 末尾 `message_stop`；非流式回传上游 JSON 原文并带
`x-terminal-state: verified`。直连模式下不启动槽位 CLI（health 里 `hop_mode=direct`、`cli_pid=null`）。

### 出口与连接

```jsonc
{ "proxy_url": "socks5h://10.0.0.2:1080",   // socks5 / socks5h / http
  "proxy_required": true }                   // 真且 URL 空 → 拒绝启动
```

- `socks5h` 把**域名**交给代理（ATYP=0x03），`socks5` 本地解析后发 IP；
- 支持 `user:pass@`（SOCKS5 RFC1929 / HTTP Basic）；
- 出口选择在 `client::connect`：代理拨号 → 在隧道上做 TLS → h2，全程裸字节通道；
- TLS 只对 `https` 上游启用，`http` 上游（离线 mock）直接明文 h2；
- 连接复用：同一 `UpstreamClient` 内共享一条 h2 连接，复用失败自动重建重试一次。

## MCP 工具桥

```sh
crag-v2 mcp-bridge --config <mcp.json>
# {"crag":{"callbackUrl":"http://127.0.0.1:PORT/callback","tools":[...]}}
```

处理 `initialize`（回显/缺省 `2024-11-05`）、`tools/list`、`tools/call`（POST 回调后
把响应映射成 MCP `content` 块与 `isError`）、`ping`；`notifications/*` 不回包，
未知方法 `-32601`，异常 `-32603`。回调响应支持 `content-length` 与 `chunked`。

`"restricted": true`（配 `cwd` / `addDirs`）时，路径类参数（`path` / `file_path` /
`notebook_path` / `dir` / `cwd` …）必须落在白名单内：越界返回 `isError` 且**不触发回调**；
restricted 初始化失败时拒绝执行而不是退化成不校验。

## 凭据

```jsonc
{ "credential_path": "/home/kincli/.claude/credentials.json",
  "oauth_token_url": "https://platform.claude.com/v1/oauth/token",
  "refresh_skew_seconds": 300 }
```

- 每 hop 先 `ensure(false)`：未过期直接用文件里的 token，过期（或 `skew` 内）才打 token 端点；
- 刷新成功后 `accessToken`/`refreshToken`/`expiresAt` 落回原文档，`kinGeneration` 单调递增；
- 并发 hop 单飞，只刷一次；刷新失败时若磁盘 generation 已变且新凭据可用，直接采用磁盘值；
- `invalid_grant` / `invalid_refresh_token` / 400 → 不重试；429 / 5xx / 传输失败 → 重试；
- 凭据读不到或为空时**直接失败**，不带空 token 出网。

## 未做（明确边界）

- `https://` 代理与 PAC：现网 `worker/internal/config` 的 scheme 白名单只有
  `socks5` / `socks5h`，因此本实现同样不接 https 代理（会明确报错，不静默直连）；
- 控制面下发的凭据轮换通知（现网由控制面写文件 + generation 变化驱动，本实现按
  `ensure` 时的磁盘状态感知，没有额外的推送通道）；
- native adapter 12 API 的完整面（`applyAssistantPrefill` / `setSessionCallbacks` 等）；
- MCP 工具桥（`mcp.rs`）、`--restricted` 路径守卫（§6.3 `restrictedFileConfine`）；
- 授权链（包加密 / 注册码 / 设备绑定）**不在本 crate 范围**，按需求方口径跳过。
