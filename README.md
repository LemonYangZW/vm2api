# vm2api

用虚拟机槽位做拟真转发的订阅转 API 网关。公开仓是干净提取，不含编辑器 / 代理工具链、不含单页 HTML 应急面板、不含内部复盘文档。

控制面仍叫 KIN（`src/`、`sk-kin-…`、`/api/panel`），避免改协议。对外项目名是 **vm2api**。

## 仓库里有什么

```text
web/                  Vite + React 管理台
src/                  Node 控制面（鉴权、协议、调度、面板）
crates/kin-kernel/    Claude Rust 内核（cli-hop）
crates/codex-kernel/  GPT / Codex Rust 内核
worker/               Go 槽位数据面（HTTP 转发 + refresh）
api-kernel/           Go API 内核
docs/                 对外契约
```

```text
浏览器 ──► web（Vite）──► Node :8787
                           ├─ rust  Claude：kin-kernel → 自备 Claude Code（不随仓分发）
                           ├─ rust  GPT：kin-codex-kernel → ChatGPT
                           └─ go：kin-worker 经槽 SOCKS5 POST Anthropic
```

Node **不**直连 `api.anthropic.com`。自建默认走 **Go HTTP worker** 即可跑通。

`engine=rust` 的 Claude 路径是 cli-hop，需要运维自备 Claude Code。本仓**不包含** patched CLI / wrap-cli 母样本。

## 构建

需要 Node 22、Go 1.25、Rust stable、pnpm（前端）。

```bash
npm ci
npm test                 # unit + Go worker + api-kernel
npm run build:worker
npm run build:egress
npm run build:api-kernel
npm run build:kernel     # crates/kin-kernel → bin/kin-kernel
npm run build:codex-kernel
pnpm -C web install
pnpm -C web test
pnpm -C web build        # → web/dist
```

Linux amd64 二进制由 GitHub Release 提供：`kin-kernel`、`kin-codex-kernel`、`kin-worker`、`kin-api-kernel`。不要把 ELF 提交进 git。

## 运行

```bash
export KIN_API_KEY=...
export KIN_ADMIN_USER=admin
export KIN_ADMIN_PASSWORD=...   # 必填
export KIN_DB_SECRET=...        # 凭证列 AES-256-GCM
node src/server.mjs             # :8787
```

管理台：先 `pnpm -C web build`，然后打开 `GET /console`（Node 提供 `web/dist`）。开发时：

```bash
KIN_API_PROXY=http://127.0.0.1:8787 pnpm -C web dev
```

协议口：`POST /v1/messages`、`/v1/chat/completions`、`/v1/responses`。鉴权 `Authorization: Bearer` 或 `x-api-key`。

## 文档

| 文档 | 内容 |
|------|------|
| [docs/API.md](docs/API.md) | `/v1` 鉴权与四协议 |
| [docs/PROTOCOL.md](docs/PROTOCOL.md) | 官方判定、人设、thinking、beta |
| [docs/INFERENCE.md](docs/INFERENCE.md) | rust cli-hop vs Go HTTP |
| [docs/PANEL_API.md](docs/PANEL_API.md) | `/api/panel` |
| [docs/OAUTH.md](docs/OAUTH.md) | 导入、refresh、初装 |

## 安全

不要提交 OAuth、sessionKey、SOCKS 账密、`credentials.json`、含密钥的 JSON。`KIN_ADMIN_PASSWORD` 未设置则拒绝启动。
