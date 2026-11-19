#!/usr/bin/python3
"""One real streaming request: latency, CPU time and RSS for a kernel + CLI pair.

  bench.py <socket> <internal-token> <pid[,pid...]>

The pids are the kernel and its claude-node child (for a QEMU slot that is the
qemu process for each). CPU is reported both raw and net of a 10s idle sample,
so a busy host does not inflate the number. Output token counts come from the
upstream usage, which differs run to run; compare cpu_ms_per_output_token.

Real upstream calls: keep max_tokens >= 8192.
"""
import json
import os
import socket
import sys
import time
import uuid

SOCK, TOKEN = sys.argv[1], sys.argv[2]
PIDS = [int(p) for p in sys.argv[3].split(",")]
HZ = os.sysconf("SC_CLK_TCK")


def ticks():
    total = 0
    for pid in PIDS:
        fields = open("/proc/%d/stat" % pid).read().rsplit(")", 1)[1].split()
        total += int(fields[11]) + int(fields[12])
    return total


def rss_mb():
    out = {}
    for pid in PIDS:
        for line in open("/proc/%d/status" % pid):
            if line.startswith("VmRSS"):
                out[pid] = int(line.split()[1]) // 1024
    return out


before = ticks()
time.sleep(10)
idle = (ticks() - before) / HZ / 10

prompt = ("Write a detailed ~700-word explanation of how TCP congestion control works "
          "(slow start, congestion avoidance, fast retransmit, fast recovery). Plain prose.")
body = {
    "body": {"model": "claude-haiku-5-5", "max_tokens": 8192, "stream": True,
             "messages": [{"role": "user", "content": prompt}],
             "metadata": {"user_id": json.dumps({
                 "device_id": "", "account_uuid": "", "session_id": str(uuid.uuid4())})}},
    "stream": True, "request_id": "bench-" + uuid.uuid4().hex[:8],
}
raw = json.dumps(body).encode()

cpu0 = ticks()
s = socket.socket(socket.AF_UNIX)
s.connect(SOCK)
start = time.time()
s.sendall(b"POST /internal/v1/messages HTTP/1.1\r\nHost: localhost\r\n"
          + b"X-Internal-Token: " + TOKEN.encode() + b"\r\n"
          + b"Content-Type: application/json\r\nTE: trailers\r\nConnection: close\r\n"
          + b"Content-Length: " + str(len(raw)).encode() + b"\r\n\r\n" + raw)
buf = b""
headers_at = first_text_at = None
while True:
    chunk = s.recv(65536)
    if not chunk:
        break
    now = time.time() - start
    headers_at = headers_at if headers_at is not None else now
    buf += chunk
    if first_text_at is None and b"text_delta" in buf:
        first_text_at = now
total = time.time() - start
cpu = (ticks() - cpu0) / HZ
text = buf.decode(errors="replace")

status = text.split("\r\n", 1)[0]
events = [line[7:] for line in text.split("\n") if line.startswith("event: ")]
output_tokens = None
for line in text.split("\n"):
    if line.startswith("data: ") and '"message_delta"' in line:
        output_tokens = json.loads(line[6:]).get("usage", {}).get("output_tokens")
trailer = [line.strip() for line in text.split("\r\n")
           if line.lower().startswith(("x-terminal-state", "x-error-code"))]

print(json.dumps({
    "status": status,
    "headers_s": round(headers_at or -1, 3),
    "first_text_s": round(first_text_at or -1, 3),
    "total_s": round(total, 2),
    "events": len(events),
    "output_tokens": output_tokens,
    "trailer": trailer,
    "cpu_s_raw": round(cpu, 2),
    "idle_cpu_per_s": round(idle, 3),
    "cpu_s_net": round(cpu - idle * total, 2),
    "cpu_ms_per_output_token": round((cpu - idle * total) * 1000 / output_tokens, 2)
    if output_tokens else None,
    "rss_mb": rss_mb(),
}))
