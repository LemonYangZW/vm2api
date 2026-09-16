# 推理数据面（SSOT）

> `engine=rust` **就是** cli-hop。没有第三条「rust HTTP hop」推理路径。
> 开源仓不附带 wrap-cli / patched Claude Code。自建默认用 `inference.engine=go`。

Node 只做控制面（鉴权、协议、人设、调度、面板）。**不直连** `api.anthropic.com`。无直连回落。

## 两条推理路

| 开关 | 数据面 | 上游怎么走 | 内核/worker 干什么 |
|---|---|---|---|
| `inference.engine=rust` | wrap / cli-hop | patched Claude Code 自己打 Anthropic Messages | `kin-kernel` 只调度 native_messages：写 stdin、demux stdout。**不** HTTP hop Anthropic |
| `inference.engine=go` | Go HTTP 转发 | `kin-worker` 挂 Authorization，经槽 SOCKS5 `POST /v1/messages` | worker 是 hop。JSON 透传 |

```
client ──nginx──► Node :8787
                     │ fingerprint / persona / pool
                     │
                     ├─ rust（必须 cli-hop）
                     │     envelope → kin-kernel --gateway-worker
                     │     provider=local_cli → patched CLI native_messages（预开 20 slot）
                     │     CLI TLS → 本机 HTTP CONNECT → 槽 SOCKS5 → api.anthropic.com
                     │
                     └─ go（HTTP 转发）
                           envelope → kin-worker
                           worker 挂票 → 槽 SOCKS5 → api.anthropic.com
```

代码钉死：

- `resolveOfficialCcInference`：engine=rust 时 **强制** `cli-hop`。
- `writeKernelConfig`：engine=rust → `provider: local_cli`；否则 `anthropic_api`（仅非 rust 内核路径，现网推理不用）。
- `assertCliHopAllowed`：`official_cc.inference=cli-hop` 要求 `engine=rust`。

## 不要和这两件事搞混

| 名字 | 是不是推理 |
|---|---|
| 官方 Claude Code **初装**（`routing.official_cc`，wipe → hello → /stats） | **不是**。换票后跑一次官方 CLI。推理不跑官方 CLI。 |
| kernel `HopClient` / `provider=anthropic_api` | **退役的 rust HTTP hop**。08-30 任务把 rust 做成 Go worker 克隆；09-08 已切到 local_cli。不要再当现网。 |
| `fallback_to_go` | rust 起不来（缺二进制 / glibc / health 失败）时回落 **Go HTTP**。不是「rust 改走 HTTP」。 |

## 槽位约束

- 两条路都强制槽 SOCKS5（`proxy_required=true`）。
- wrap 预开 20 native slot；面板「并行」只改 Node inflight，不重启 kernel。
- wrap 需要 Ubuntu 24 / 足够新的 glibc。Debian 12（glibc 2.36）上新 `kin-kernel` 起不来，应保持 `engine=go` 或快速 fallback，不要空等 health。
- Extra 5h 以 Messages **headers** 为准。wrap 必须把 `anthropic-ratelimit-unified-5h-*` 从 CLI → kernel trailer → Node `ingestHeaders`。Go hop 本来就有这些头。

## 过期文档

| 文档 | 状态 |
|---|---|
| `.trellis/tasks/08-30-rust-kernel-adapter/` | **已归档**。rust 作为 HTTP hop / refresh owner 的终态，作废。 |
| `.trellis/tasks/09-08-gateway-cli-hop/` 的 C1「flag 默认关、未开走 HopClient」 | **已落地推翻**。现码 engine=rust 直接 local_cli。 |
| README「2026-09-01 vm-10 Rust Unix socket 公网 200」 | **作废**。那是 rust HTTP 克隆实测；vm-10 现为 Debian 12，跑不了 wrap kernel。 |
| 旧文档里 “never spawns a Claude CLI itself” / “Go worker is the sole forward” | 控制面仍不直连 Anthropic，但 **rust 槽推理会启动自备 Claude Code**。wrap-cli 母样本不随本仓分发。以本文为准。 |
