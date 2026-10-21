# 实验性 Linux ARM64 控制平面部署

此方案在 ARM64 主机上原生运行 vm2api 控制平面，并通过 QEMU 运行现有
`linux/amd64` slot。可以直接使用发布的 ARM64 镜像，也可以从当前源码
checkout 本机构建。

## 本 fork 的 Oracle 发布流程

- 更新合并后推送 `main`，自动运行 `release`：ARM64 镜像只构建一次，验证通过后发布 `ghcr.io/lemonyangzw/vm2api:edge-arm64`。PR 只构建和验证，不发布镜像。
- 保留 ARM64 部署脚本回归、QEMU 准备与回滚检查、Compose 校验，以及原生内核/CLI、入口刷新、`health` 和 `console` 的隔离冒烟验证。
- 构建使用独立的 ARM64 层缓存；新提交取消同分支的旧发布任务。仅修改文档不会触发构建。
- 同时发布 `sha-<完整 commit>-arm64`，镜像标签记录源码和版本；部署仍应保存实际 digest。`vX.Y.Z` 标签发布对应的 `vX.Y.Z-arm64`。
- 不再构建 amd64 发布镜像、独立 Release 二进制附件或多架构 manifest。镜像内部仍保留 Oracle 所需的 amd64 兼容 payload，不改变运行能力。
- 完整 `ci`、`native-slot-parity` 三层差分、`guest-images` 均在 Actions 页面手动运行；三层差分也会随手动完整 `ci` 执行。原生内核升级仍须单独验收。
- 镜像发布不会自动切换 Oracle 服务。更新时继续先合并上游并检查内核变化；内核变化就停止并提示重新发布 ARM 内核，只更新控制面时保留既有槽位。

## 上游发布物与命名

| 发布物 | amd64 | arm64 |
| --- | --- | --- |
| 控制面镜像（单架构） | `ghcr.io/dofastted/vm2api:vX.Y.Z-amd64` | `ghcr.io/dofastted/vm2api:vX.Y.Z-arm64` |
| 控制面镜像（多架构） | `vX.Y.Z` / `latest`，按拉取平台选择 | 同左 |
| Release 附件 | 无后缀：`kin-kernel`、`cli-node`、`kin-worker` 等 | `kin-worker-linux-arm64`、`kin-egress-linux-arm64` |

无后缀附件保持 linux amd64，已部署的面板按原名下载 kernel / CLI。ARM64
控制面镜像另外从 `native-slot/` 源码编译原生 `kin-kernel` 与 `cli-node`，见
下文「原生槽位 kernel / CLI」。cc-node、crag kernel、Codex kernel、OAuth 和
控制面造机服务 `kin-computer` 仍只有 amd64，ARM64 主机经 QEMU 运行它们。

## 原生槽位 kernel / CLI

ARM64 镜像把静态链接的 aarch64 `kin-kernel.bin` 与 `cli-node` 放在
`/opt/vm2api/image-wrap-cli/linux-arm64/`，entrypoint 每次启动刷新到
`share/wrap-cli/linux-arm64/`。控制面在宿主为 ARM64 时，物化本机 Docker 槽
的 `.kin` 目录改用这一对文件，包装脚本 `kin-kernel` 不再经过 x86 glibc
loader；数据面热路径（kernel 调度与 CLI 上游请求）因此不再经 QEMU。

| 槽位 | kernel / cli-node |
| --- | --- |
| 本机 Docker 槽（wrap、cc 数据面） | 原生 ARM64；cc 数据面的 cc-node 仍为 amd64 |
| crag 数据面 | 不变：crag kernel + cc-node，均为 amd64 |
| KVM 槽 | amd64（客体是 x86 虚拟机） |
| 集群节点槽 | amd64（烤进节点镜像，见 `cluster/slot-image.mjs`） |

槽位容器本身仍是 `linux/amd64` 客体镜像，`DOCKER_DEFAULT_PLATFORM` 不变；
原生二进制是静态 ELF，只依赖客体内的 CA 证书。

- 回退：控制容器设置 `KIN_NATIVE_SLOTS=0` 后重新同步槽位（面板“同步 wrap”
  或重启槽），槽回到 amd64 + QEMU。
- 更新：面板上传 kernel / cli-node 时，aarch64 ELF 写入 `linux-arm64/`，
  x86-64 ELF 照旧写入 amd64 模板；GitHub Release 一键更新只更新 amd64 模板。
  镜像重启会用镜像内版本覆盖 `linux-arm64/`，与 amd64 文件的行为一致。
- 采样：原生槽的 `.kin` 不能作为 wrap 样本（拒绝码 `wrap_sample_native`），
  避免 ARM64 文件进入 amd64 模板。
- 面板 `describeWrapSample` 的 `native_arm64` 字段显示原生对是否就绪、是否启用。

版本参数可带架构后缀：`v1.2.3`、`v1.2.3-arm64`、`v1.2.3-aarch64` 都解析为
版本 `v1.2.3`；后缀只用于核对，与宿主架构不一致时一键脚本和面板都会拒绝。
一键脚本和面板在 ARM64 上写入 `VM2API_IMAGE_TAG=vX.Y.Z-arm64`，固定单架构
控制面镜像；一键脚本运行 Compose 时忽略宿主的 `DOCKER_DEFAULT_PLATFORM`
（槽位平台由控制面镜像自己设为 `linux/amd64`）。手动在设置了
`DOCKER_DEFAULT_PLATFORM=linux/amd64` 的 shell 里运行 Compose 会报平台不匹配，
不会改用 amd64 控制面。amd64 仍写不带后缀的多架构 tag，与已有安装一致。

## 支持范围与已验证情况

控制镜像中的 Node.js 22、Python、iptables、Docker 27 CLI，以及静态 Go
worker、egress 和原生槽位 kernel / cli-node 二进制均为 ARM64。其余 Rust
kernels、OAuth 和 cc-node 预编译资产仍为 amd64，由 QEMU 执行；slot 默认平台
也是 `linux/amd64`。
构建从固定的 Ubuntu 24.04 amd64 stage 提取 glibc 2.39 等 x86 库，Go builder
和最终控制平面 stage 使用 ARM64。

| 场景 | 验证状态 |
| --- | --- |
| Oracle Ampere、Ubuntu 24.04 主机上的 ARM64 控制平面 | 已在现有部署验证 |
| 该部署中的 Ubuntu amd64 Claude slot | 已在现有部署验证 |
| 原生 ARM64 槽位 kernel / cli-node | 单元与端到端测试通过（mock 上游），未做真机请求验证 |
| 原生 ARM64 远程节点 | 未验证 |
| Codex 模型真实请求、其他 guest 镜像 | 未验证 |
| 主机重启后的恢复、性能与容量 | 未验证 |

这些结果只覆盖上述环境，不构成其他 ARM 主机、镜像或负载的兼容性承诺。
**每个 Docker daemon 仅运行一个部署**：slot 使用 `kin-01` 等全局容器名称，
即使为控制容器指定不同名称，也无法隔离 slot。已有 x86 部署的主机不要直接
叠加此 override；迁移应先停止原控制器并保留其状态和密钥。

## 主机要求

- Linux `aarch64` 主机，启用 `systemd-binfmt`。
- 已安装 Git、Python 3、可用的 Docker Engine 和 Compose V2。
- 当前用户可访问 Docker daemon；准备脚本需要 root 或可用的 `sudo -n`。
- 可访问构建镜像来源，并具备运行 amd64 slot 所需的内存、磁盘和 CPU。

Docker 的安装方式参见 [Docker Engine 安装文档](https://docs.docker.com/engine/install/)。
此 override 不强制设置 CPU 或内存上限；容量应按实际 slot 数量和负载规划。

## 一键安装（推荐）

与 x86 相同的命令，脚本按 `uname -m` 识别架构：

```sh
curl -sSL https://raw.githubusercontent.com/dofastted/vm2api/main/deploy/install.sh | sudo bash
curl -sSL https://raw.githubusercontent.com/dofastted/vm2api/main/deploy/install.sh | sudo bash -s -- upgrade
sudo bash /opt/vm2api/deploy/install.sh status
```

在 ARM64 上脚本额外下载 `deploy/prepare-arm64.py`，启动前准备 QEMU handler
（见下一节），然后拉取 `-arm64` 镜像。没有 ARM64 发布的旧版本会明确报错，
不会回退到 amd64 镜像。`status` 显示宿主架构和当前镜像 tag。

## 准备主机

一键脚本会自动执行；源码构建时在仓库根目录手动执行：

```sh
python3 deploy/prepare-arm64.py
python3 deploy/prepare-arm64.py --check
```

`--check` 只读取状态。安装使用固定的 `tonistiigi/binfmt` QEMU 10.2.3 资产，
只切换 `qemu-x86_64` handler。脚本检查受管理路径，遇到符号链接或不同内容
时拒绝覆盖。安装失败时恢复原内核 handler 描述及启用状态，
并只移除本次新安装的文件。发行版的 binfmt 数据库和其他架构 handler 不参与此事务。

QEMU 下 slot 进程的 `/proc/<pid>/exe` 指向模拟器，程序路径在 `argv[1]`。
控制面在终止 slot 数据面进程和判断 PID 1 拓扑时按此识别。

## 源码构建

为新部署创建 `.env`：

```sh
python3 deploy/init-arm64-env.py
```

默认端口为 `8787`，控制容器名为 `vm2api`，仅绑定 `127.0.0.1`。可用
`--port`、`--container-name`、`--bind-host` 调整这些值。若要绑定其他地址，
应先确认该地址的访问范围和主机网络配置；IPv6 绑定需要宿主机启用 IPv6。

初始化器以排他创建方式写入权限为 `0600` 的 `.env`，生成管理密码、API key
和数据库密钥，且不输出凭据。它同时写入
`COMPOSE_FILE=docker-compose.yml:docker-compose.arm64.yml` 与
`VM2API_HOST_ROOT=<仓库绝对路径>`：裸 `docker compose` 和面板一键更新都
因此使用 ARM64 override 与正确的宿主目录。已有 `.env` 会保留，缺这两项时
脚本提示需要补的值；面板更新发现 ARM64 源码安装缺 `COMPOSE_FILE` 会拒绝
执行，避免以基础服务启动到 `./vms`、`./data`。用本地编辑器查看
`VM2API_ADMIN_PASSWORD` 后登录；不要把 `.env`、凭据或会话信息放入 PR。

```sh
docker compose build vm2api
docker compose up -d vm2api
```

一键脚本 `--from-source` 在 ARM64 上同样写入这两项。

override 的默认本地镜像是 `vm2api-arm64-control:local`，可通过
`VM2API_ARM64_IMAGE` 改名。Compose 使用 `deploy/Dockerfile.arm64-control`
构建 `linux/arm64` 控制镜像；`DOCKER_DEFAULT_PLATFORM=linux/amd64` 用于
控制平面启动的 slot。amd64 集群资产置于 `/opt/vm2api/cluster-bin-amd64`。

源码构建的持久目录位于仓库下的 `.local/arm64/`（一键镜像安装与 x86 相同，
在安装目录的 `vms/`、`data/` 等）：

| 目录 | 用途 |
| --- | --- |
| `vms` | slot 相关持久状态 |
| `data` | 控制平面数据 |
| `bin` | 运行时二进制目录 |
| `share` | 共享文件 |
| `config` | 运行配置 |

仓库原有 `bin/` 中的 amd64 资产会保留。备份时同时保留 `.env` 和这些持久
目录，数据库密钥必须与原数据库对应。

## 检查状态

在安装目录或仓库根目录执行（`.env` 的 `COMPOSE_FILE` 已选好 Compose 文件）：

```sh
docker compose ps
docker compose logs --tail=100 vm2api
docker compose exec vm2api node -p process.arch
python3 deploy/prepare-arm64.py --check
```

Node.js 应返回 `arm64`。随后在本地浏览器打开 `http://127.0.0.1:8787`，
登录并检查账户、slot 和实际请求。使用自定义端口时替换地址中的端口。
容器启动或架构检查成功，不能代替真实模型请求验证。

## 更新源码与镜像

一键安装用 `install.sh upgrade` 或面板“一键更新”，二者都保留架构后缀。

源码构建先保存当前源码 revision，并备份 `.env` 和持久数据。更新应在干净的源码
checkout 中进行；有本地修改时先审查并保留这些修改。

```sh
git pull --ff-only
docker compose build vm2api
docker compose up -d --no-deps vm2api
```

更新保留原有挂载目录与密钥。完成后重复状态检查及之前成功的实际请求。
基础依赖的固定 digest 应单独审查和维护，不随应用 `VERSION` 自动刷新。

## 故障恢复与迁移

QEMU 准备失败时先阅读脚本错误，再运行 `--check` 核对恢复后的状态；不要
手动覆盖发行版的 binfmt 文件。应用故障可恢复已保存的源码 revision，重新
构建并用相同 Compose 参数启动；数据库发生格式变更时，按对应版本的迁移
要求恢复匹配的数据备份，避免旧代码直接读取不兼容数据库。

已有部署改用此方案时，先核对旧控制器的数据库、密钥、配置和各目录挂载，
备份后停止旧控制器，再制定与新挂载对应的迁移步骤。不要任意移动仍在使用
的数据库，也不要同时启动两个会管理相同 slot 的控制器。成功验证登录、
账户、slot 与实际请求后，再决定是否保留旧部署作为恢复入口。
