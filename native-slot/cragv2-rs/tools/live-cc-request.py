#!/usr/bin/env python3
"""真机验收客户端：向本地内核的 unix socket 发一条**真实 CC 形态**的请求。

真实 CC 请求的形态（本脚本刻意对齐）：
  - `stream: true`（CC 一律流式）
  - `max_tokens` = 该模型输出上限（不是为省 token 的 64）
  - 带 `tools`（Read/Bash/Glob 的核心 schema）
  - 带 `system`（billing 头 + IDENTITY + environment 三块）
  - `thinking: {"type": "adaptive"}`
  - `anthropic-beta` 走真实集合

用法：
  python3 tools/live-cc-request.py --socket /tmp/x/kernel.sock [--model claude-haiku-5-5]
                                   [--prompt "reply with the single word: ok"] [--max-tokens 128000]
退出码：0 = 200 且收到 message_stop；其它 = 失败。
"""
import argparse
import json
import socket
import sys

TOOLS = [
    {
        "name": "Read",
        "description": "Reads a file from the local filesystem.",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string"},
                "offset": {"type": "number"},
                "limit": {"type": "number"},
            },
            "required": ["file_path"],
        },
    },
    {
        "name": "Bash",
        "description": "Executes a given bash command in a persistent shell session.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string"},
                "description": {"type": "string"},
                "timeout": {"type": "number"},
            },
            "required": ["command"],
        },
    },
    {
        "name": "Glob",
        "description": "Fast file pattern matching tool.",
        "input_schema": {
            "type": "object",
            "properties": {"pattern": {"type": "string"}, "path": {"type": "string"}},
            "required": ["pattern"],
        },
    },
]

BETAS = ",".join(
    [
        "claude-code-20250219",
        "oauth-2025-04-20",
        "interleaved-thinking-2025-05-14",
        "context-management-2025-06-27",
        "prompt-caching-scope-2026-01-05",
        "effort-2025-11-24",
    ]
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--socket", required=True)
    ap.add_argument("--model", default="claude-haiku-5-5")
    ap.add_argument("--prompt", default="reply with the single word: ok")
    ap.add_argument("--max-tokens", type=int, default=128000)
    ap.add_argument("--timeout", type=int, default=120)
    ap.add_argument("--dump", action="store_true", help="打印原始响应（诊断用）")
    args = ap.parse_args()

    body = {
        "model": args.model,
        "max_tokens": args.max_tokens,
        "stream": True,
        "thinking": {"type": "adaptive"},
        "system": [
            {"type": "text", "text": "x-anthropic-billing-header: cc_version=2.1.303; cc_entrypoint=cli; cch=00000;"},
            {"type": "text", "text": "You are a Claude agent, built on Anthropic's Claude Agent SDK."},
            {"type": "text", "text": "# Environment\n - Timezone: Asia/Shanghai"},
        ],
        "tools": TOOLS,
        "messages": [{"role": "user", "content": args.prompt}],
    }
    envelope = {
        "request_id": "live-cc-1",
        "stream": True,
        "preserve_cache_breakpoints": True,
        "cache_ttl": "1h",
        "headers": {"anthropic-beta": BETAS},
        "body": body,
    }
    payload = json.dumps(envelope).encode()

    sock = socket.socket(socket.AF_UNIX)
    sock.settimeout(args.timeout)
    sock.connect(args.socket)
    sock.sendall(
        b"POST /internal/v1/messages HTTP/1.1\r\nhost: crag\r\ncontent-type: application/json\r\n"
        b"content-length: " + str(len(payload)).encode() + b"\r\n\r\n" + payload
    )

    buf = bytearray()
    while True:
        chunk = sock.recv(65536)
        if not chunk:
            break
        buf.extend(chunk)
    text = buf.decode("utf-8", "replace")
    head, _, rest = text.partition("\r\n\r\n")
    status = head.split("\r\n")[0] if head else "(no status line)"
    print(f"STATUS: {status}")

    events = []
    for block in rest.split("\n\n"):
        name = ""
        data = ""
        for line in block.split("\n"):
            if line.startswith("event: "):
                name = line[7:].strip()
            elif line.startswith("data: "):
                data = line[6:]
        if name:
            events.append((name, data))
    print(f"SSE events: {len(events)}")
    print("事件序列:", ", ".join(name for name, _ in events[:14]))

    out_text = []
    for name, data in events:
        if name == "content_block_delta" and '"text_delta"' in data:
            try:
                out_text.append(json.loads(data)["delta"]["text"])
            except Exception:
                pass
    if out_text:
        print("assistant text:", "".join(out_text).strip()[:200])
    usage = ""
    for name, data in events:
        if name == "message_delta" and '"usage"' in data:
            usage = data
    if usage:
        print("message_delta:", usage[:200])

    ok = status.startswith("HTTP/1.1 200") and any(n == "message_stop" for n, _ in events)
    print("RESULT:", "OK" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
