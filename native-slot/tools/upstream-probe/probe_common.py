#!/usr/bin/env python3
"""三层差分共用的隔离进程、HTTP 解码和证据记录。仅使用测试配置。"""
import copy
import http.client
import json
import os
from pathlib import Path
import re
import signal
import socket
import subprocess
import time


def save_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


class TrailerResponse(http.client.HTTPResponse):
    def _read_and_discard_trailer(self):
        self.captured_trailers = []
        while True:
            line = self.fp.readline(http.client._MAXLINE + 1)
            if len(line) > http.client._MAXLINE:
                raise ValueError("trailer 过长")
            if line in (b"\r\n", b"\n"):
                return
            if not line:
                raise ValueError("chunked 响应缺少 trailer 结束符")
            key, sep, value = line.decode("iso-8859-1").partition(":")
            if not sep:
                raise ValueError("非法 trailer")
            self.captured_trailers.append([key.lower(), value.strip()])


class UnixConnection(http.client.HTTPConnection):
    response_class = TrailerResponse

    def __init__(self, path, timeout=30):
        super().__init__("localhost", timeout=timeout)
        self.path = str(path)

    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(self.path)


def read_response(connection, started, timeout=30, on_event=None):
    response = connection.getresponse()
    header_at = time.monotonic() - started
    chunks, events, pending = [], [], b""
    total = 0
    while True:
        left = timeout - (time.monotonic() - started)
        if left <= 0:
            raise TimeoutError("HTTP 请求超过总时间限制")
        active_socket = connection.sock
        if active_socket is None and response.fp is not None:
            # Connection: close 时 HTTPConnection 已放弃 socket，但响应仍在读取。
            active_socket = getattr(getattr(response.fp, "raw", None), "_sock", None)
        if active_socket is not None:
            active_socket.settimeout(left)
        chunk = response.read1(65536)
        if not chunk:
            break
        total += len(chunk)
        if total > 8 * 1024 * 1024:
            raise ValueError("差分响应超过 8 MiB")
        chunks.append(chunk)
        pending += chunk
        if response.getheader("Content-Type", "").startswith("text/event-stream"):
            pending = pending.replace(b"\r\n", b"\n")
            while b"\n\n" in pending:
                event, pending = pending.split(b"\n\n", 1)
                fields = event.decode("utf-8").split("\n")
                name = next((s[6:].strip() for s in fields if s.startswith("event:")), "message")
                data = "\n".join(s[5:].lstrip(" ") for s in fields if s.startswith("data:"))
                events.append({"event": name, "data": data, "at": time.monotonic() - started})
                if on_event is not None:
                    # 解析完单个事件即通知，不能等整条 HTTP 响应结束才调用。
                    on_event(dict(events[-1]))
    body = b"".join(chunks)
    length = response.getheader("Content-Length")
    if length is not None and int(length) != len(body):
        raise ValueError("Content-Length 与正文长度不符")
    return {"status": response.status,
            "headers": [[k.lower(), v] for k, v in response.getheaders()],
            "body": body.decode("utf-8"),
            "trailers": getattr(response, "captured_trailers", []),
            "events": events, "header_at": header_at, "total": time.monotonic() - started}


def unix_request(path, method, route, body=None, headers=None, timeout=30, on_event=None):
    connection = UnixConnection(path, timeout)
    if body is not None and not isinstance(body, (str, bytes)):
        body = json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode()
    h = {"Connection": "close", "Content-Type": "application/json", "TE": "trailers"}
    h.update(headers or {})
    started = time.monotonic()
    try:
        connection.request(method, route, body=body, headers=h)
        return read_response(connection, started, timeout, on_event=on_event)
    finally:
        connection.close()


def clean_env(extra=None):
    # 不继承宿主上的模型凭据、代理或内核调参。
    keep = ("PATH", "LANG", "LC_ALL", "LD_LIBRARY_PATH", "QEMU_LD_PREFIX")
    env = {key: os.environ[key] for key in keep if key in os.environ}
    env.update({"LANG": "C.UTF-8", "NO_PROXY": "127.0.0.1,localhost", "PYTHONUNBUFFERED": "1"})
    env.update(extra or {})
    return env


def stop_process(process):
    if process is None:
        return
    # 只发送给本工具创建的进程组，不按进程名/pkill 搜索。
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        process.wait(timeout=3)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        process.wait(timeout=3)


class KernelProcess:
    def __init__(self, binary, cli, root, slots=2, env=None, config_overrides=None):
        self.binary, self.cli = str(Path(binary).resolve()), str(Path(cli).resolve())
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        # Linux Unix socket 路径最多约 108 字节，数据证据目录与 socket 分开。
        import tempfile
        self.socket_dir = Path(tempfile.mkdtemp(prefix="parity-", dir="/tmp"))
        self.socket = self.socket_dir / "k.sock"
        self.config_path = self.root / "kernel.json"
        self.token = "parity-local-internal-token"
        self.process, self.log = None, None
        cred = self.root / "credentials.json"
        save_json(cred, {"claudeAiOauth": {"accessToken": "parity-dummy-oauth", "expiresAt": 4102444800000,
                   "scopes": ["user:inference", "user:profile"]}})
        cred.chmod(0o600)
        self.config = {"vm_id": "parity-vm", "socket_path": str(self.socket),
                       "credential_path": str(cred), "internal_token": self.token,
                       "claude_bin": self.cli, "slots_per_worker": slots, "provider": "local_cli",
                       "system_layout": "zero", "timezone": "Asia/Taipei", "cli_version": "2.1.296",
                       "test_endpoints": True, "anthropic_base_url": "http://127.0.0.1:9",
                       "oauth_token_url": "http://127.0.0.1:9/oauth/token", "proxy_required": False,
                       "idle_timeout_seconds": 180, "request_timeout_seconds": 30,
                       "first_byte_timeout_seconds": 10, "delivery_mode": "realtime"}
        self.config.update(config_overrides or {})
        save_json(self.config_path, self.config)
        self.config_path.chmod(0o600)
        self.env = clean_env({"HOME": str(self.root), "SLOTS": str(slots), **(env or {})})

    def __enter__(self):
        self.log = (self.root / "kernel.log").open("w", encoding="utf-8")
        self.process = subprocess.Popen([self.binary, "--gateway-worker", "--config", str(self.config_path)],
                                        env=self.env, stdout=self.log, stderr=self.log, start_new_session=True)
        end = time.monotonic() + 15
        while time.monotonic() < end:
            if self.process.poll() is not None:
                self.__exit__(None, None, None)
                raise RuntimeError(f"内核退出，检查 {self.root / 'kernel.log'}")
            if self.socket.exists():
                return self
            time.sleep(0.05)
        self.__exit__(None, None, None)
        raise TimeoutError(f"内核未就绪，检查 {self.root / 'kernel.log'}")

    def request(self, method, path, body=None, headers=None, timeout=30, on_event=None):
        return unix_request(self.socket, method, path, body,
                            {"X-Internal-Token": self.token, "X-Kin-Internal-Token": self.token,
                             **(headers or {})}, timeout, on_event=on_event)

    def __exit__(self, *_):
        stop_process(self.process)
        if self.log:
            self.log.close()
        # 仅本实例创建的 socket，其他证据保留。
        self.socket.unlink(missing_ok=True)
        self.socket_dir.rmdir()


class IDMap:
    """按首次出现编号；不同 ID 不会合并，同一个 ID 的引用保持一致。"""
    def __init__(self):
        self.ids = {}

    def text(self, text):
        def substitute(match):
            prefix, value, suffix = match.groups()
            family = value.split("_", 1)[0]
            key = (family, value)
            if key not in self.ids:
                self.ids[key] = f"{family}_D{len(self.ids) + 1}"
            return prefix + self.ids[key] + suffix
        return re.sub(r'("(?:id|tool_use_id)"\s*:\s*")((?:msg_[0-9]+|toolu_[A-Za-z0-9_-]+))(")', substitute, text)


def canonical_response(response, mapper=None):
    mapper = mapper or IDMap()
    # Content-Length 已在解码时独立核验，不比较 HTTP 传输切块与大小写。
    ignored = {"date", "connection", "transfer-encoding", "content-length"}
    return {"status": response["status"],
            "headers": sorted([k.lower(), v] for k, v in response["headers"] if k.lower() not in ignored),
            "body": mapper.text(response["body"]),
            "trailers": sorted(response["trailers"])}


def message_envelope(stream=True, delivery=None, request_id="parity-request"):
    result = {"body": {"model": "claude-haiku-5-5", "max_tokens": 8192, "stream": stream,
                       "messages": [{"role": "user", "content": "parity local mock"}],
                       "metadata": {"user_id": json.dumps({"device_id": "", "account_uuid": "",
                                     "session_id": "00000000-0000-4000-8000-000000000000"})}},
              "stream": stream, "request_id": request_id}
    if delivery:
        result["delivery_mode"] = delivery
    return copy.deepcopy(result)
