# 上游内核更新时的同步手册

`native-slot/` 是现网闭源 `kin-kernel` / `cli-node` 的纯 Go 复刻。上游一旦更新
kernel、cli-node 或 payload，原生实现就可能与现网行为分叉。这份手册记录
2026-10-20 首次接入与后续同步流程。2026-10-21 起，三层离线差分按需手动执行，
用于原生内核升级验收；日常控制面更新只自动执行 ARM64 构建与冒烟验证。
旧 18 项只是一组内核响应回归，不能单独证明 ARM64 与上游功能一致。

最近本机验收：[2026-10-21 / v1.3.205 三层比对](PARITY_20261021.md)，71 项契约检查通过，
其中 1 项为明确原生扩展，严格相等标记为 false；范围与未验收项见报告。

## 资料地图（先看这里）

ARM64 原生实现不是从零猜出来的：现网 x86-64 二进制的行为先被逆向成规格，
再按规格重写，最后用差分探针验证。更新的顺序也要按这个链条走。

| 资料 | 位置 | 作用 |
| --- | --- | --- |
| 行为规格 | `reverse/kin-kernel/docs/` | `02` CLI 帧协议、`03` 上游行为、`05` 内核实现与调度、`06` 配置凭据、`07` cli-node 范围、`04` 验收矩阵 |
| 静态分析产物 | `reverse/kin-kernel/work/` | `all-strings.txt`、`ghidra-out/` 反编译、`cli-node.unpacked`、`disas.sh` / `collect-targets.py` 等脚本 |
| 差分探针 | `native-slot/tools/upstream-probe/` | 内核、CLI、真实控制面整链路三层对照 |
| 原生实现 | `native-slot/internal/`、`cmd/` | 按规格重写的 Go 版本 |

> `reverse/` 是**本机工作区，不入库**：公开 fork 不能提交闭源二进制的逆向内容
> （`.gitignore` 之外，提交前也请确认没有把它带进去）。入口是
> `reverse/kin-kernel/README.md`。

`docs/` 是行为层规格，通常跨版本仍适用；`work/` 里的地址、偏移和反编译产物
只对某个具体内核版本有效，上游换新二进制后要在新 payload 上重跑提取脚本。

## 0. 什么算「上游更新」

任意一条成立就要走一遍本流程：

- `deploy/payload.json` 的 `release`、`size`、`sha256` 变了；
- `node scripts/fetch-payload.mjs --check` 失败；
- 上游 release notes / commit 涉及 `payload`、`kernel`、`cli-node`、协议形状；
- 生产上出现原生槽独有的 400/形状差异；
- 差分结果与 `reverse/kin-kernel/docs/` 的规格描述不符。

先确认资产真的可下载、哈希与 pin 一致：

```sh
gh release view <release> --repo dofastted/vm2api --json assets \
  --jq '.assets[] | "\(.name) \(.size) \(.digest)"'
node scripts/fetch-payload.mjs --check
```

> 2026-10-20 遇到过：payload release 的同名资产被替换，pin 校验失败、release
> workflow 直接失败。这时先让上游重新 pin；临时构建可以在 fork 上放一份逐字节
> 一致的副本，并把 `deploy/payload.json` 的 `repo` 指向 fork（只在构建分支，
> 不要带进功能分支）。

## 上游换版时怎么逆向（增量，不必重头）

第一次迁移是「完整逆向 → 写规格 → 重写」。之后的上游更新是**增量**：

1. **先黑盒定位变化面**。用 `tools/upstream-probe` 和新版内核/CLI 跑三层差分，
   `DIFF` 是已覆盖输入下的变化证据；没有 DIFF 只表示现有用例未发现差异。
   仍需核对 CLI 模块文本变化、环境变量和控制面调用点，新增行为必须补用例。
2. **cli-node 优先做文本差分**。它是 UPX 打包的 Node 程序，解包后是普通 JS：
   - 用 `work/` 里的方式解包，提取 `src/kin/` 模块；
   - 和上一版逐文件 diff，改动通常很小（请求构造、缓存标记、环境变量）；
   - 直接读 diff 就能判断原生 `internal/upstream/` 要不要跟。
3. **kernel 只做定向分析**。上游 kernel 更新少，地址/偏移每次都会变，但结构不变：
   - 先用 `strings` 对比新旧二进制：新增的环境变量名、错误消息、日志 `target`
     往往直接暴露改动点（例如 `SUBMIT_WAIT_MS`、`MAX_PENDING`）；
   - 对新二进制重跑 `work/` 里的提取脚本（`collect-targets.py`、`disas.sh`），
     只反编译与变化点相关的函数，不要重看全部；
   - Ghidra 工程按版本另存，旧版本的反编译结果不要覆盖。
4. **更新规格**。行为层结论写回 `reverse/kin-kernel/docs/`（`03` 上游行为、
   `05` 内核实现），并注明适用版本。`docs/` 是跨版本复用的资产，`work/` 是
   版本相关的中间产物。
5. **把新行为固化**：在 `tools/upstream-probe/` 对应层补用例，内核假宿主场景同步修改
   `fake-cli.py`，再补 Go 单测 / e2e。下一次换版时这些用例就是现成的回归网。

一句话：**规格复用、差分定位、只逆向变化的那一小块**。

## 1. 同步上游 main

```sh
git fetch origin
git merge origin/main
```

- `deploy/payload.json` 冲突：**跟随上游的 pin**；只有在资产确实被替换且上游尚未
  修复时，才临时改 `repo`。
- `CHANGELOG.md`：保留上游条目，把 ARM64 条目并进去。
- 上游自己的 CI 可能是红的（2026-10-20 就有格式和模板断言没跟上）。先看上游
  main 的 ci 结果：如果是上游问题，同步时顺手修掉，别让 fork 一直是红的。

## 2. 三层离线差分（原生升级时手动验收）

在本机执行，不使用服务器的进程、配置、凭据或 socket：

```sh
python3 native-slot/tools/upstream-probe/run-local.py --upstream-ref v$(cat VERSION)
```

Windows / PowerShell 直接省略版本参数，工具默认读取本地 `VERSION`：

```powershell
python3 native-slot/tools/upstream-probe/run-local.py
```

工具解析 tag 到 commit，下载对应源码，核对双方 payload manifest 与依赖锁，
逐个校验 payload 大小和 SHA-256，构建真正的 Linux ARM64 ELF。
本机 amd64 上通过显式 QEMU wrapper 执行 ARM64，禁止以原生 amd64 构建冒充 ARM64 验收。
测试容器 `--network none --read-only`，源码只读；唯一写入挂载是本次证据目录，
不挂 Docker socket、真实 HOME 或凭据。准备阶段下载公共资产和构建依赖，测试阶段仅连接本地 mock。

三层必须全部运行、全部通过：

1. **内核层**：官方 kernel / 原生 kernel 驱动相同假 CLI；比较双向帧、请求构造、
   解块后的 HTTP 正文、状态码、头与 trailer，并验证交付时序及取消/容量/恢复。
2. **CLI 层**：官方 CLI / 原生 CLI 接收相同输入帧，访问同一本地 mock；
   比较 URL、方法、应用请求头、JSON 正文、返回帧和错误路径；JSON 仅去字符串外空白。
3. **整链路层**：指定版本上游控制面 / 当前 fork 控制面，分别串起各自真实 kernel、
   CLI 和本地 mock，经过公共 `/v1/messages`、鉴权、断连取消与面板凭据导入。

每例既要与对方一致，也必须满足独立的预期断言。双边 401、双边空输出、
缺参考、异常、超时、缺必测层都失败，不能算 `SAME`。生成 ID 使用双射保留引用关系；
动态 prompt ID 影响的 cch 必须逐侧按原始正文复算校验后才能归一化。
每个 job 的 prompt ID 应独立，头与正文保持关联，不能归一化掉错误复用。
HTTP 切块只属于传输；JSON 字段顺序、转义、数字、错误和 trailer 值不能抹掉。
出站 JSON 的格式空白不参与比较，原始字节仍必须留档。
流式时序单独设阈值，不能通过删除时间戳来宣称逐条 flush。
快速报错边界按已证实的终态抢占范围验证：仅对应快错用例的指定单个块起始或响应头事件可尚未交付，
存在时内容必须精确一致，最终错误、头与 trailer 均保留。原始差异和严格相等标记
不能删除；另跑稳定分时用例严格比较全部事件，不能泛化为忽略尾事件。
需有必要前缀时，由 HTTP 读取端确认收到后再让假 CLI 触发快速错误，避免夹具自身缺同步。

证据保存在 `.tmp/parity-*/run-*/`：`provenance.json`、总报告、各层报告、
每例捕获与 diff。必须保留上游 commit、payload 哈希、原生产物架构/哈希、
运行时镜像 ID 与工具源码哈希。原始逆向资料仍只保留私库/本机。
总报告使用 `profile=shared_contract`；原生新增 `/internal/v1/slots` 只允许精确的
官方 404 / 原生 200 扩展差异，并保留 `strict_equivalence=false`，不宣称严格全等。

出现差异后先对照规格与实际捕获，区分测试夹具、上游变化和原生缺陷。
任何无法解释的差异均阻止原生内核发布；既有扩展行为也必须单独列明，不能归一化成相等。
详细接口与覆盖边界见 `native-slot/tools/upstream-probe/README.md`。

## 3. 真实请求对照（需要用户确认）

离线差分验证已覆盖输入下的请求、响应和状态行为；真实模型的字段演进、缓存计费、
网络代理及线上 OAuth 仍需最终真机确认。用原生的 `slot-host` 做 `claude_bin`（名字别叫 `cli-node`，guard
会杀），真实凭据，`max_tokens >= 8192`。

每次只发 1～2 个合法请求，现网与原生各一次，对照：

- 非流式 body 的字节数与字段顺序、usage 顺序；
- tool_use 的 input 参数顺序；
- 缓存计数与 `cache_creation` 的 ttl 分布；
- 流式事件序列、首字节/首 token 时间。

按 `probe-max-tokens` 记忆：打真实上游的探针 `max_tokens` 不得低于 8192。

## 4. 修改原生实现与测试

改动前先对照规格：`reverse/kin-kernel/docs/03_UPSTREAM_BEHAVIOR.md`（请求/流式/错误）
和 `05_KERNEL_IMPLEMENTATION.md`（调度、生命周期、背压）。如果需要确认某个字段的
来源，用 `work/all-strings.txt`、`work/ghidra-out/` 和 `work/cli-node.unpacked`
里的实现细节，再决定改原生代码还是改规格。

- `go test ./...`、`go vet ./...`、`gofmt -l` 必须干净；
- `CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build ./cmd/...` 交叉编译通过；
- 差分参考实现 `testdata/jsref` 不入库，本地有就跑，没有跳过；
- JS 模块级差分是额外诊断；其跳过不能替代第 2 节必跑的真实二进制 CLI 对照；
- 新增行为优先补 e2e（`internal/worker/e2e_test.go`）和形状单测
  （`internal/sse`、`internal/ojson`、`internal/upstream`）。

## 5. Preflight 规则复核（最容易翻车的一步）

`upstream.Preflight` 只允许拦截「上游必定拒绝」的形状。每次上游更新都要重新
核对，宁可不拦，也不要误伤。

2026-10-20 的教训：闸门把 `messages[].role` 写死成 `user` / `assistant`，而控制面
在 `mid-conversation-system` beta 下会合法插入 `role: "system"`，导致生产直接
400（`messages.1.role Input should be ...`）。

复核清单：

- role：`user` / `assistant` / `system`（beta）合法；`tool`、`developer` 不合法；
- system 消息在工具配对中**透明**，不打断 `tool_use → tool_result`；
- 缓存标记规则必须与控制面 `validateCacheBreakpoints` 保持一致；
- 新字段、新块类型只做「结构上必错」的检查，不要把白名单当校验；
- 闸门改动先在隔离环境用真实流量形状验证，再上线。

## 6. 构建、发布与部署

- 合并运行代码到 fork main 会触发 `release.yml`（`push: branches: [main]`），产出
  `ghcr.io/<owner>/vm2api:edge-arm64`；
- 日常只构建一次 ARM64 镜像，冒烟验证通过后发布；不构建 amd64 发布镜像或多架构 manifest；
- `native-parity.yml` 按需手动执行，也可由手动完整 `ci` 调用；日常 release 不再自动运行三层差分；
- 修改测试工具或验证本身不需要部署。没有部署授权时，到本机报告与代码检查为止；
- 部署与槽位热更新步骤见项目记忆 `vm2api-slot-hot-update`：
  compose 重建控制面 → 面板登录 → `POST /api/panel/wrap-cli/sync` → **手动
  `docker restart` 槽位**（kernel 是 PID 1，sync 对原生槽不会自动重启）。

## 7. 已知坑

- `SUBMIT_WAIT_MS` 是现网实现真正读取的名字；控制面传的是
  `KIN_SUBMIT_WAIT_MS`，现网 amd64 kernel 忽略它。原生按控制面意图优先读后者。
- 现网 realtime 在**拿到槽位时**就提交 200，之后的错误以 SSE `error` 事件结束；
  非流式/verified 才用 HTTP 状态码。
- Go 的 header 顺序与 hyper 不同，比较时必须归一化；语义差异不能归一化。
- `cli-node-guard` 每 15s 杀掉命令行含 `cli-node` 的多余进程，探针二进制要改名。
- 容器内 `/tmp` noexec；槽位 home 归属 uid 10001/10002/10003。
- 上游 payload 资产可能被原地替换，永远以 `payload.json` 的 pin 为准。

## 验收清单

- [ ] `fetch-payload --check` 通过，pin 与资产一致
- [ ] 行为变更已对照 `reverse/kin-kernel/docs/` 的规格，必要时同步更新规格
- [ ] 指定版本源码、payload pin、实际执行文件与 ARM64 架构证据齐全
- [ ] 内核、CLI、整链路三层全部通过，无跳过/双错通过/未解释差异
- [ ] 时序、ID 对应关系、cch 校验、取消与容量回收均有独立断言
- [ ] 真实请求形状/usage/缓存与现网一致（若执行）
- [ ] `go test ./...`、`go vet`、`gofmt`、arm64 交叉编译通过
- [ ] Preflight 复核过，没有新增误伤
- [ ] ARM64 自动发布流程通过；涉及原生升级时另附手动三层差分验收报告
- [ ] 部署后观察控制面日志，没有新的 `upstream_invalid_request`
