# Changelog

## Unreleased

- 控制面可用 Docker Compose 部署（`network_mode: host` + `docker.sock`；槽位仍在宿主机引擎）
- 同步源仓运行时补丁：换票后回收 wrap、官方凭证软链、未确认 401 不再当吊销

## 1.0.0 — 2026-09-16

首个公开版本。

- Setup Token → Console API，产品面 0 提示词注入
- 推理只走 Rust 内核 + Claude Code 原生 subagent（最大 20）
- 删除 Go HTTP hop；`kin-worker` 只保留 telemetry
- 代理池支持远程 SOCKS5 与本地出口（宿主机 NAT）
- Vite 管理台（`GET /console`），环境变量 admin，无用户管理
- 协议口 `/v1/messages` 及 OpenAI 兼容入口
- GitHub Actions：测试 + `v*` linux amd64 Release
- 文档：技术路线图、部署说明、版本构建

交流：[t.me/VM2API](https://t.me/VM2API)
