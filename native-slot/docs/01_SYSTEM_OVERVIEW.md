# 1. 系统概述

## 1.1 定位

本系统为多租户虚拟机集群提供 **Claude Messages 推理槽位**。
每个虚拟机运行一个槽位容器，容器内由一个常驻内核进程调度若干并发槽位，
每个槽位通过统一的 CLI 宿主把客户端请求转发到上游 Messages 服务。

## 1.2 组件

```text
客户端
  │  HTTP (Unix socket 或本机端口)
  ▼
┌──────────────────────────────────────────────┐
│ kin-kernel（网关内核，ARM64 目标）           │
│  ├─ HTTP 接口：/internal/v1/messages         │
│  ├─ 槽位调度：最多 20 个并发槽                │
│  ├─ 超时与健康检查                            │
│  └─ NDJSON 子进程接口                         │
└──────────────────────┬───────────────────────┘
                       │ stdin / stdout，每行一个 JSON
                       ▼
┌──────────────────────────────────────────────┐
│ cli-host（CLI 宿主）                          │
│  ├─ 启动握手                                  │
│  ├─ 多槽位 job 生命周期                       │
│  ├─ 上游 Messages 请求                        │
│  └─ SSE 事件转发                              │
└──────────────────────┬───────────────────────┘
                       │ HTTPS + SSE
                       ▼
              上游 Messages 服务
```

| 组件 | 职责 | 本次交付 |
| --- | --- | --- |
| `kin-kernel` | HTTP 接入、槽位调度、超时、取消 | **新增 ARM64 构建** |
| `cli-host` | 帧协议、上游调用、流式转发 | **新增 ARM64 构建** |
| 上游服务 | 模型推理 | 外部依赖 |

> 现有发行包只覆盖当前主机架构。切换到 ARM64 需要两侧都提供
> 原生实现，详见 `05_KERNEL_IMPLEMENTATION.md`。

## 1.3 部署形态

- 每个虚拟机一个槽位容器；
- 容器内启动一个内核进程，由它拉起一个 CLI 宿主；
- 槽位数量由 `slots_per_worker` 配置，范围 1–20；
- 内核与 CLI 宿主通过子进程的 stdin/stdout 通信，不经过网络。

## 1.4 数据流

1. 客户端向内核的 `/internal/v1/messages` 发送 Anthropic Messages 请求；
2. 内核选择一个空闲槽位，把请求包装成 `job_start` 帧写入 CLI 宿主 stdin；
3. CLI 宿主调用上游服务，将返回的 SSE 事件逐条包装成 `stream_event` 帧；
4. 内核把 `stream_event` 转换成对客户端的 SSE 响应；
5. 流结束后 CLI 宿主发送 `job_done`，槽位回到空闲；
6. 出错时发送 `job_error`，客户端收到对应 HTTP 错误；
7. 取消由内核发送 `cancel`，CLI 宿主结束任务并回 `cancel_ack`。

## 1.5 槽位模型

```text
idle ──job_start──> running ──job_done / job_error──> idle
                      │
                      └──cancel──> cancelling ──任务结束──> idle
```

- 同一槽位同一时刻只处理一个 job；
- 不同槽位并行；
- 槽位已满时，内核直接返回 `503 no_capacity`，不排队。

## 1.6 运行环境

| 项 | 要求 |
| --- | --- |
| 操作系统 | Linux |
| 架构 | arm64（aarch64） |
| 进程模型 | 常驻，随容器生命周期运行 |
| 凭据 | `/home/kincli/.claude/credentials.json` |
| 配置 | `/run/kin/kernel.json`（内核读取） |
| 子进程环境 | 由内核设置，详见 `02_CLI_INTERFACE_SPEC.md` |

## 1.7 术语

| 术语 | 含义 |
| --- | --- |
| 槽位（slot） | CLI 宿主内的一个并发执行单元，编号 `s00`、`s01`… |
| job | 一次完整的 Messages 请求 |
| 内核 | `kin-kernel`，负责调度与超时 |
| CLI 宿主 | 本系统的消息转发进程 |
| 帧 | 一行 JSON，以 `\n` 结尾 |
| 上游 | Anthropic Messages 服务 |

## 1.8 兼容基线

CLI 宿主需与内核约定的协议版本 `2` 保持一致，并保持对
Claude Agent SDK 消息语义的兼容（基线版本 `2.1.296`）。
