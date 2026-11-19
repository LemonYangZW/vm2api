#!/usr/bin/python3
"""Measure what happens to a second request when every slot is busy.

Start an isolated kernel whose claude_bin is hold-cli.py with one slot, then:

  wait-probe.py <socket> <internal-token>

Prints, for the immediate request and the one sent 0.5s later:
  status, time to response headers, time to body end, status/code.
Expected (2026-10-20, both kernels): the second waits SUBMIT_WAIT_MS, then
continues if a slot frees up or returns 503 no_capacity.
"""
import http.client
import json
import socket
import sys
import threading
import time
import uuid

SOCK, TOKEN = sys.argv[1], sys.argv[2]
START = time.time()


class Conn(http.client.HTTPConnection):
    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX)
        self.sock.connect(SOCK)


def envelope():
    return {
        "body": {"model": "claude-haiku-5-5", "max_tokens": 8192, "stream": True,
                 "messages": [{"role": "user", "content": "x"}],
                 "metadata": {"user_id": json.dumps({
                     "device_id": "", "account_uuid": "", "session_id": str(uuid.uuid4())})}},
        "stream": True,
        "request_id": "wait-" + uuid.uuid4().hex[:8],
    }


def post(tag):
    conn = Conn("localhost", timeout=120)
    sent = time.time()
    conn.request("POST", "/internal/v1/messages", json.dumps(envelope()),
                 {"X-Internal-Token": TOKEN, "Content-Type": "application/json"})
    resp = conn.getresponse()
    headers = time.time() - sent
    body = resp.read()
    total = time.time() - sent
    code = ""
    try:
        code = json.loads(body).get("error", {}).get("code", "")
    except Exception:
        code = "sse" if b"message_stop" in body else body[:60].decode(errors="replace")
    print("%s status=%s headers_at=%.2fs done_at=%.2fs start=+%.2fs code=%s"
          % (tag, resp.status, headers, total, sent - START, code), flush=True)


first = threading.Thread(target=post, args=("first ",))
first.start()
time.sleep(0.5)
post("second")
first.join()
