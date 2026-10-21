# 三层离线差分

正式入口：

```powershell
python3 native-slot/tools/upstream-probe/run-local.py
```

需要本机 Docker 引擎、Python 3.12+、Node、Go 1.25 和已登录的 gh。默认对照当前
`VERSION` 对应的上游 tag；也可显式传 `--upstream-ref v1.3.205`。
工具不会合并上游代码、推送、部署或连接服务器。

## 版本与隔离

准备阶段解析 tag 到固定 commit，下载公开源码/固定 payload，检查双方 manifest 和
依赖锁，核验 12 条 payload 路径的大小/SHA-256，编译 ARM64 槽位内核与 CLI。
上游镜像不可用时仍对照该版本真实闭源 payload，不用旧生产文件代替新版基准。

测试阶段运行 `--network none --read-only` 的一次性容器，仅本地 mock 上游。
源码只读，测试目录可写，不挂 Docker socket、用户 HOME、真实凭据或生产配置。
本机 amd64 上用显式 QEMU 执行真实 ARM64 ELF；控制面 Node/API kernel 运行于 amd64，
因此不代表完整 ARM64 镜像或 ARM64 硬件性能验收。

## 三层覆盖

- `kernel_diff.py`：同一假 CLI 驱动官方/原生内核；保留旧 18 项，增加工具、
  thinking、缓存、错误头、鉴权、双向请求帧、取消、容量、并发、断连和宿主恢复。
- `cli_diff.py`：真实官方/原生 CLI 接相同帧和本地 HTTP mock，比较出站 URL、
  方法、应用请求头、JSON 字节（仅去字符串外空白）、返回帧；覆盖 OAuth/API Key、缓存、工具/thinking、
  401/429/500/529、畸形/空 SSE、取消和并发。
  对照限定槽位帧模式；API Key 用例使用显式 `ANTHROPIC_API_KEY`。
- `integration_diff.py`：指定版本上游源码与本地 fork 各自真实
  `server.mjs → API kernel → 槽位 kernel → CLI → mock`；
  验证公共 `/v1/messages`、鉴权、断连取消、面板登录和凭据导入后再次调用。
  另查内部容量/并发/状态回收；单独记录原生新增接口的存在性差异。

Docker 槽位创建、同步、重启被测试替身拒绝，已有槽位用临时目录物化。
离线凭据导入不等于 OAuth 服务在线登录/刷新验收。真实网络代理、模型行为、
计费缓存、生产及长时间压力不在此入口的通过范围。

## 判定与证据

每例必须同时满足独立断言和双边对照；缺参考、空输出、双边错误、异常、超时、
缺必测层均不能通过。所有用例不得超过 45 秒。

HTTP 先解块，头名/排列和 Date 不参与应用比较；CLI 出站 JSON 仅去字符串外空白，
保留原始捕获；键序、转义、数字字面量、状态码、
错误、trailer 值均保留。内核慢流用例要求多次分时交付，时序独立断言，不删除时间戳冒充。
动态 UUID/工具 ID 按双射保留关系，固定输入 session 不归一化。
每侧 cch 按原始请求独立复算通过后，才允许忽略动态 prompt ID 带来的摘要变化。
每个 job 的 prompt ID 必须独立，且请求头与正文一致；不能与固定调用方 session 混用。

快速报错时，官方可能抢先消费终态，尚未交付的块起始事件存在调度差异。
对应快错用例只允许指定的单个 `content_block_start` 或 `response_headers` 存在或缺席，
存在时内容必须精确匹配；
起始消息、最终错误、头和 trailer 仍须一致，双方原文及 `strict_equal=false` 留档。
`partial_err` 由 HTTP 读取端确认起始消息已收到后，再触发快速错误，保证必要前缀已交付。
另有稳定分时中断用例严格比较全部事件，不放宽文本增量或未知事件差异。

报告保留 `profile=shared_contract` 与严格相等标记；已知新增接口只作明确记录，
不能通过宽泛的字段忽略、错误码忽略或整个用例跳过来放行未知差异。

`--work-dir` 指定专用目录；默认 `.tmp/parity-<UTC时间>/`。
下载、编译与各次证据保留，便于复核；每次 `run-*/` 都包含：

- `provenance.json`：commit、payload、ARM64 ELF、运行时、API kernel、工具/源码哈希。
- `report.json` 与各层 `*-report.json`：实际运行结果和覆盖边界。
- 每例 capture、normalized、diff、stderr 或内核/控制面日志；全部使用虚拟凭据。

CI 与 release 调用同一入口；发布构建依赖三层门禁成功。私有 JS 模块级差分仍可
额外执行，但不能替代这里的真实 CLI 对照。逆向产物不加入公开工作流。

## 单项诊断

`compare.sh` 仍提供仅内核入口，必须显式给出已校验基准和新证据目录：

```sh
PROD_KERNEL=/path/pinned-kernel NATIVE_KERNEL=/path/native-kernel \
  PROBE_DIR=/tmp/new-kernel-evidence sh native-slot/tools/upstream-probe/compare.sh
```

`setup.sh <新目录>` 只生成虚拟配置，不复制生产配置。`probe.py` 输出已解码
HTTP、trailer 和事件时间的诊断 JSON；`normalize.py` 仅展示，不负责判定通过。
旧的原始文本归一化格式已退出门禁。验证工具自身：

```sh
python3 -m unittest discover -s native-slot/tools/upstream-probe -p 'test_*.py' -v
```
