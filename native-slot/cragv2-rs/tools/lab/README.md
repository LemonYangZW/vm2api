# 沙盒验证脚本（需要容器 + 官方 Claude Code）

这些脚本通过内核的 unix socket 直接驱动一跳/两跳，用来验证**内核侧**行为。
它们不打生产环境；真实上游凭据由调用方通过环境变量提供（`ANTHROPIC_BASE_URL` / `ANTHROPIC_AUTH_TOKEN`）。

| 脚本 | 验证什么 | 需要真实上游 |
| :--- | :--- | :--- |
| `parity-check.mjs` | `/internal/identity`、`oauth/usage` 501、`health` 字段、续跳形状指纹 400 | 否（除工具跳） |
| `session-guard.mjs` | 外来 `tool_use_id` → 409；未知 id → 410 | 一次 |
| `inflight-check.mjs` | `health.active` 随在途 hop 变化 | 一次 |
| `tool-loop.mjs` | 工具回环两跳（print/native 通路） | 两次 |
| `tool-loop-search.mjs` | 同两跳，但提示模型用 `ToolSearch` 发现 MCP 工具（TUI 通路用） | 两次 |

## 用法

```sh
# 1) 在槽内起内核（示例：TUI 通路 + 官方 CC）
docker run -d --name crag-native --user 0:0 -w /lab \
  -v /path/to/lab:/lab -v crag-sock:/run \
  -e HOME=/lab/tui-home -e TERM=xterm-256color \
  -e ANTHROPIC_AUTH_TOKEN=<key> \
  ghcr.io/dofastted/kin-os-ubuntu:24.04 \
  /lab/crag-v2-musl --gateway-worker --config /lab/kernel-tui.json --socket /run/crag.sock

# 2) 在另一个容器里跑驱动（同一 volume）
docker run --rm -v /path/to/lab:/lab -v crag-sock:/run node:22-alpine \
  node /lab/tool-loop-search.mjs /run/crag.sock
```

## 关键判据

- 工具跳：`hop1` 应只回投**一个** `crag_tool_<会话标签>_<uuid>`（不带 `mcp__crag__*`）；
  `hop2` 的文本里应包含 `hop1` 注入的工具结果字符串。
- 空跳：上游限流/重试时内核必须回 **`tui_no_output`**，不允许 200 + 空内容。
- 429：print 通路会把它标成 `rate_limited`（读 CC 的 `system/api_retry` 帧）。

## 注意

- 部分中转会拒绝「测试性质」的提示词（例如只发 "hi"/"say OK"），必须用真实任务描述。
- `--tools ""` **不要**加：实测会让中转判 403「客户端异常」。工具靠 CC 的 `ToolSearch` 延迟发现。

## 工具桩：离线验证工具回环

`stub-tool.mjs` 让"上游"直接返回一个 `tool_use`，因此**不需要真实模型**也能驱动
`CC 调工具 → 桥 POST → 内核 park → 合成 tool_use 回投 → tool_result 续跳` 全链路。

```sh
docker run -d --name crag-stub --network crablab -v /path/to/lab:/lab \
  node:22-alpine node /lab/stub-tool.mjs
# 内核 upstream_base / ANTHROPIC_BASE_URL 指向 http://crag-stub:18083
docker run --rm --network crablab -v /path/to/lab:/lab -v crag-sock:/run \
  node:22-alpine node /lab/tool-loop.mjs /run/crag.sock
```

判据：hop1 只回投一个 `crag_tool_*`；hop2 的文本包含桩注入的 `TIME=…`。

**已知坑**：
- 桩里的 `tool_use` 名称必须是**裸名**（`get_time`）；写成 `mcp__crag__get_time` 时
  CC 解析不到，不会去调桥。
- CC 会把整段上下文重发，桩按 `tool_result` 子串判断会误判；改用一次性 tool id 或
  `TIME=` 判断，并在跑之前清 `~/.claude/projects` 与 `history.jsonl`。
- 目前 hop2 会返回 **410 `unknown tool_result`**：疑似同一个 `claudecode/toolUseId`
  被 CC 调了两次（桥日志带该字段），早先那次 park 成了孤儿。定位方法：恢复
  park/resolve 的实例与计数日志，看一次运行里 park 到底发生几次。
