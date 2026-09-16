# 部署

本机或 Linux 主机自建一份 vm2api。推理走 **Rust 内核 + Claude Code**，不走 Go hop。

先看路线：[技术路线.md](技术路线.md)。打二进制：[BUILD.md](BUILD.md)。

## 机器要什么

| 项 | 建议 |
|---|---|
| OS | Ubuntu 24.04（glibc 够新，wrap / Claude kernel 才能起） |
| 运行时 | Node 22、Docker、iptables |
| 编译（本机构建时） | Rust stable、Go 1.25、pnpm 10 |
| 网 | 每槽一条出口：远程 SOCKS5，或代理池里的 **本地出口** |

Debian 12（glibc 2.36）上新 Claude kernel 常常起不来，优先 Ubuntu 24。

## 目录怎么摆

把仓库放到例如 `/opt/vm2api`。工作目录就是仓库根。

```text
/opt/vm2api/
  src/server.mjs      控制面
  web/dist/           管理台（先 build:web）
  bin/kin-kernel      Rust 内核
  bin/kin-egress      远程 SOCKS5 透明网关
  bin/kin-worker      只跑 telemetry，不是推理 hop
  vms/                槽位 JSON + 槽家目录
  data/               SQLite 等
  src/config/routing.json
```

环境变量 `KIN_PROJECT_ROOT` 默认就是仓库根。`KIN_DATA_DIR` 不设时落在 `src/data`；自建请显式设成仓库 `data/`。

## 环境变量

`VM2API_*` 优先，没有再读 `KIN_*`。

最少这三项，缺 `VM2API_API_KEY` 进程直接起不来：

```bash
export VM2API_API_KEY='换成很长的随机串'
export VM2API_ADMIN_PASSWORD='面板登录密码'
export VM2API_DB_SECRET='再换一串，加密库用'
```

常用可选：

| 变量 | 默认 | 做什么 |
|---|---|---|
| `PORT` / `HOST` | `8787` / `0.0.0.0` | 监听 |
| `PUBLIC_BASE_URL` | 按 host:port 拼 | 对外看到的根 |
| `KIN_KERNEL_BIN` | 空则按仓库 `bin/` 解析 | Rust 内核路径 |
| `KIN_EGRESS_BIN` | `/opt/kin-gateway/bin/kin-egress` | 远程 SOCKS 网关；自建请改成 `/opt/vm2api/bin/kin-egress` |
| `KIN_WORKER_BIN` | `/opt/kin-gateway/bin/kin-worker` | 只给 telemetry |
| `VM2API_ADMIN_USER` | `admin` | 面板用户名 |

完整抄本：[deploy/env.example](deploy/env.example)。

不要把这些值写进 git。

## 第一次落地

```bash
git clone https://github.com/dofastted/vm2api.git /opt/vm2api
cd /opt/vm2api
npm ci
pnpm -C web install --frozen-lockfile

# 本机构建，或从 Release 把 linux amd64 丢进 bin/
npm run build:kernel
npm run build:egress
npm run build:web
# 可选：npm run build:worker   # 只要 telemetry
```

启动前必须有一个占位槽，否则 `loadConfig()` 读不到 `vms/active.json` 会退出：

```bash
mkdir -p vms data bin
cat > vms/active.json <<'EOF'
{ "active_vm": "vm-01" }
EOF
cat > vms/vm-01.json <<'EOF'
{
  "id": "vm-01",
  "name": "vm-01",
  "status": "stopped",
  "schedulable": false,
  "policy": { "maxConcurrency": 2 }
}
EOF
```

然后：

```bash
set -a && source /etc/vm2api.env && set +a
node src/server.mjs
```

本机探活：

```bash
curl -sS http://127.0.0.1:8787/health
```

管理台：`GET /console`（要先有 `web/dist`）。面板账号是环境变量里的 admin，没有用户管理页。

## systemd

单元抄本：[deploy/vm2api.service](deploy/vm2api.service)。

```bash
install -m 600 docs/deploy/env.example /etc/vm2api.env   # 再改真实密钥
install -m 644 docs/deploy/vm2api.service /etc/systemd/system/vm2api.service
systemctl daemon-reload
systemctl enable --now vm2api
```

改热路径 `.mjs` 后：`node --check src/server.mjs`，再 `systemctl restart vm2api` **一次**。静态 `web/dist` 不用重启。

## 反代

Node 只绑 `:8787`。前面用 nginx 把 `/v1` `/api` `/console` `/health` 转过去即可。HTTPS 终结在 nginx。

```nginx
location / {
  proxy_pass http://127.0.0.1:8787;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header Authorization $http_authorization;
  proxy_set_header Connection "";
  proxy_buffering off;
  proxy_read_timeout 600s;
}
```

## 上线后点什么

1. 打开 `/console`，用 `VM2API_ADMIN_PASSWORD` 登录。
2. 代理池：导入远程 SOCKS5，或点 **添加本地出口**（宿主机 NAT，不启 kin-egress）。
3. 建 Claude 槽，绑出口，导入 Setup Token。
4. 换票后走官方初装（wipe → hello → `/stats`）。推理不跑官方常驻 CLI。
5. 用 `sk-vm-…` 或 master key 打 `POST /v1/messages`。

槽必须有出口。`proxy_required` 为真时没绑代理不会调度。

## 不要做的事

- 不要把 ELF 提交进 git。
- 不要让 Node 直连 Anthropic 当推理回落。
- 不要再启 Go HTTP hop。`kin-worker` 只接受 `telemetry`。
- 不要把 `VM2API_*` / OAuth / sessionKey 写进仓库或 Issue。

---

交流与支持见仓库 [README](../README.md#交流与支持)。
