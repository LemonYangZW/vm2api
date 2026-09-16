# 文档

面向自建与接入。文案结构对齐常见开源网关说明：先路线，再落地，再契约。

## 产品

- **[技术路线](技术路线.md)** — Console API、六站链路、虚拟机、遥测（主路线，以图为准）

## 落地

- **[DEPLOY.md](DEPLOY.md)** — Docker Compose（推荐）、环境变量、占位槽、systemd、nginx
- **[BUILD.md](BUILD.md)** — `v*` Release、本机构建、`VERSION`、升级
- 抄本：[deploy/env.example](deploy/env.example) · [deploy/vm2api.service](deploy/vm2api.service)

## 契约

- [API.md](API.md) — `/v1` 客户端契约
- [PROTOCOL.md](PROTOCOL.md) — 协议行为
- [INFERENCE.md](INFERENCE.md) — 当前进程挂载（服从技术路线）
- [PANEL_API.md](PANEL_API.md) — 管理台 API
- [OAUTH.md](OAUTH.md) — 导入与换票（主凭证是 Setup Token → Console API）

仓库总览与 FAQ 在 [README](../README.md)。版本记录：[CHANGELOG.md](../CHANGELOG.md)

---

## 交流与支持

Telegram 群组：[t.me/VM2API](https://t.me/VM2API)（`@VM2API`）

<img src="images/tg-vm2api.jpg" alt="Telegram @VM2API" width="220" />
<img src="images/support-wechat.png" alt="支持收款码" width="220" />
