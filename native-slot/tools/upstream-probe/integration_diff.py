#!/usr/bin/env python3
"""隔离整链路差分：当前控制面 → 真实 kernel → 真实 CLI → 本地 mock。

Linux 上运行；必须由 --network none 的容器等外层措施禁止外网。
只物化临时槽位，不创建 Docker 槽位；Docker 生命周期明确不在覆盖范围内。
"""

import argparse
import concurrent.futures
import contextlib
import copy
import http.client
import http.server
import json
import os
from pathlib import Path
import re
import signal
import shutil
import socket
import subprocess
import tempfile
import uuid
import threading
import time
import traceback

from probe_common import KernelProcess, TrailerResponse, canonical_response
from cli_cch import normalize_verified, strip_json_whitespace, verify


TIMEOUT = 30
MODEL = "claude-sonnet-5-5"
API_KEY = "sk-probe-integration-fake"


def check(value, message):
    if not value:
        raise AssertionError(message)


@contextlib.contextmanager
def case_deadline():
    """每项硬性截止，包含轮询、取消与恢复，不只限制单次 HTTP。"""
    def expired(_signum, _frame):
        raise TimeoutError("整链路用例超过 45 秒限制")
    previous = signal.signal(signal.SIGALRM, expired)
    signal.setitimer(signal.ITIMER_REAL, 45)
    try:
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, previous)


def json_body(response):
    return json.loads(response["body"])


def header(response, key):
    return dict(response["headers"] + response.get("trailers", [])).get(key.lower())


def message(scenario="text", stream=False):
    return {"model": MODEL, "max_tokens": 8192, "stream": stream,
            "messages": [{"role": "user", "content": "#probe:" + scenario + " 请处理离线测试请求"}],
            "metadata": {"user_id": json.dumps({"device_id": "probe-device", "account_uuid": "probe-account",
                                                 "session_id": "00000000-0000-4000-8000-000000000000"})}}


def envelope(scenario="text", stream=False, request_id=None, **extra):
    return {"body": message(scenario, stream), "stream": stream,
            "request_id": request_id or "probe-" + scenario, **extra}


def scenario_of(body):
    raw = json.dumps(body.get("messages", []), ensure_ascii=False)
    for name in ("hang", "tool", "rate", "cache", "text"):
        if "#probe:" + name in raw:
            return name
    return "text"


class MockUpstream:
    """只接受本地 Messages；记录实际 CLI 出站，固定虚拟凭据不外发。"""

    def __init__(self):
        self.requests = []
        self.lock = threading.Lock()
        self.release = threading.Event()
        self.active_hangs = 0
        outer = self

        class Handler(http.server.BaseHTTPRequestHandler):
            protocol_version = "HTTP/1.1"

            def log_message(self, *_args):
                pass

            def do_POST(self):
                try:
                    raw_body = self.rfile.read(int(self.headers.get("Content-Length", "0"))).decode("utf-8")
                    body = json.loads(raw_body)
                    scenario = scenario_of(body)
                    with outer.lock:
                        outer.requests.append({"path": self.path, "body": body, "raw_body": raw_body,
                                               "uses_imported_test_token": self.headers.get("authorization") == "Bearer probe-imported-access",
                                               "headers": {k.lower(): v for k, v in self.headers.items()
                                                           if k.lower() not in ("authorization", "x-api-key")}})
                    if not self.path.startswith("/v1/messages"):
                        self.send_error(404)
                        return
                    if scenario == "rate":
                        raw = b'{"type":"error","error":{"type":"rate_limit_error","message":"offline probe limit"}}'
                        self.send_response(429)
                        self.send_header("content-type", "application/json")
                        self.send_header("retry-after", "7")
                        self.send_header("request-id", "req_probe_limit")
                        self.send_header("content-length", str(len(raw)))
                        self.end_headers()
                        self.wfile.write(raw)
                        return
                    self.send_response(200)
                    self.send_header("content-type", "text/event-stream")
                    self.send_header("request-id", "req_probe_ok")
                    self.send_header("connection", "close")
                    self.end_headers()

                    def emit(event):
                        raw = json.dumps(event, ensure_ascii=False, separators=(",", ":"))
                        self.wfile.write(("event: " + event["type"] + "\ndata: " + raw + "\n\n").encode())
                        self.wfile.flush()

                    usage = {"input_tokens": 10, "output_tokens": 1,
                             "cache_creation_input_tokens": 4, "cache_read_input_tokens": 2}
                    emit({"type": "message_start", "message": {"id": "msg_probe_1", "type": "message",
                          "role": "assistant", "model": body.get("model", MODEL), "content": [],
                          "stop_reason": None, "stop_sequence": None, "usage": usage}})
                    if scenario == "hang":
                        emit({"type": "content_block_start", "index": 0,
                              "content_block": {"type": "text", "text": ""}})
                        emit({"type": "content_block_delta", "index": 0,
                              "delta": {"type": "text_delta", "text": "pending probe"}})
                        with outer.lock:
                            outer.active_hangs += 1
                        try:
                            while not outer.release.wait(0.05):
                                emit({"type": "ping"})
                        finally:
                            with outer.lock:
                                outer.active_hangs -= 1
                        return
                    time.sleep(0.12)
                    if scenario == "tool":
                        emit({"type": "content_block_start", "index": 0, "content_block": {
                            "type": "tool_use", "id": "toolu_probe_1", "name": "get", "input": {}}})
                        for part in ('{"a":', '1}'):
                            emit({"type": "content_block_delta", "index": 0,
                                  "delta": {"type": "input_json_delta", "partial_json": part}})
                        stop, count = "tool_use", 5
                    else:
                        emit({"type": "content_block_start", "index": 0,
                              "content_block": {"type": "text", "text": ""}})
                        emit({"type": "content_block_delta", "index": 0,
                              "delta": {"type": "text_delta", "text": "离线 probe hello"}})
                        stop, count = "end_turn", 3
                    emit({"type": "content_block_stop", "index": 0})
                    emit({"type": "message_delta", "delta": {"stop_reason": stop, "stop_sequence": None},
                          "usage": {"output_tokens": count}})
                    emit({"type": "message_stop"})
                except (BrokenPipeError, ConnectionResetError):
                    pass
                finally:
                    self.close_connection = True

        self.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.server.daemon_threads = True
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)

    def __enter__(self):
        self.thread.start()
        return self

    @property
    def url(self):
        return "http://127.0.0.1:" + str(self.server.server_port)

    def __exit__(self, *_args):
        self.release.set()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(2)


class UnixConnection(http.client.HTTPConnection):
    def __init__(self, path, timeout=TIMEOUT):
        super().__init__("localhost", timeout=timeout)
        self.path = str(path)

    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(self.path)


def open_worker(kernel, payload):
    connection = UnixConnection(kernel.socket)
    connection.request("POST", "/internal/v1/messages", json.dumps(payload),
                       {"content-type": "application/json", "x-kin-internal-token": kernel.token,
                        "x-internal-token": kernel.token})
    return connection, connection.getresponse()


def wait_ready(kernel, expected=2, seconds=8):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        health = json_body(kernel.request("GET", "/internal/health", timeout=2))
        if health.get("ready_slots") == expected and health.get("closed_slots") == 0:
            response = kernel.request("GET", "/internal/v1/slots", timeout=2)
            (kernel.root / "slots-endpoint.json").write_text(json.dumps(response, ensure_ascii=False, indent=2), encoding="utf-8")
            if response["status"] == 200:
                slots = json_body(response)
                check(slots.get("ok") is True, "slots 接口未成功")
                check(len(slots.get("slots", [])) == expected, "槽位数量不一致")
                check(not any(slot.get("active") for slot in slots["slots"]), "存在泄漏的 active 槽位")
            else:
                check(response["status"] == 404, "slots 接口返回非成功/非缺失状态: " + str(response))
            return {"ready_slots": health["ready_slots"], "closed_slots": health["closed_slots"],
                    "active": 0, "healthy": health.get("healthy", True)}
        time.sleep(0.05)
    raise AssertionError("槽位未恢复，最后健康状态: " + json.dumps(health, ensure_ascii=False))


def wait_no_hangs(mock):
    end = time.monotonic() + 3
    while time.monotonic() < end:
        with mock.lock:
            if mock.active_hangs == 0:
                return
        time.sleep(0.05)
    raise AssertionError("取消后 mock 上游连接仍占用")


def success(response, stream=False, tool=False, terminal=True):
    check(response["status"] == 200, "响应状态错误: " + str(response))
    if stream:
        check("message_stop" in response["body"], "SSE 缺 message_stop: " + response["body"])
        check('"type":"error"' not in response["body"].replace(" ", ""), "SSE 含错误")
    else:
        body = json_body(response)
        check(body.get("type") == "message", "响应不是 message")
        check(body.get("stop_reason") == ("tool_use" if tool else "end_turn"), "stop_reason 不符")
        check(body.get("usage", {}).get("output_tokens", 0) > 0, "usage 缺失")
        if tool:
            blocks = [x for x in body.get("content", []) if x.get("type") == "tool_use"]
            check(len(blocks) == 1 and blocks[0].get("name") == "get" and blocks[0].get("input") == {"a": 1}, "工具名称或参数未重建")
        else:
            check(any("probe hello" in x.get("text", "") for x in body.get("content", [])), "预期文本缺失")
    if terminal:
        check(header(response, "x-terminal-state") == "verified", "缺 verified 终态")


def captured_request(mock, offset):
    with mock.lock:
        requests = copy.deepcopy(mock.requests[offset:])
    check(len(requests) == 1, "预期一次 CLI 上游请求，实际 " + str(len(requests)))
    request = requests[0]
    check(request["path"].startswith("/v1/messages"), "CLI 未调用 Messages")
    check(request["body"].get("stream") is True, "CLI 未使用真实上游 SSE")
    raw = request["raw_body"]
    evidence = verify(raw)
    check(evidence["valid"], "CLI 出站 CCH 摘要校验失败: " + str(evidence))
    billing = re.search(r"cc_prompt_id=([^;]+);", raw)
    if billing:
        check(request["headers"].get("x-claude-code-prompt-id") == billing[1], "出站 prompt_id 头与正文不一致")
    metadata = json.loads(request["body"]["metadata"]["user_id"])
    check(request["headers"].get("x-claude-code-session-id") == metadata["session_id"], "出站 session_id 头与正文不一致")
    check(request["headers"].get("x-claude-code-prompt-id") != metadata["session_id"], "每次请求的 prompt_id 被错误复用为 session_id")
    # 同一次出站中的动态 UUID 使用双射；固定输入 session_id 保持原值。
    ids = {}
    def dynamic_id(match):
        value = match[0]
        if value == "00000000-0000-4000-8000-000000000000":
            return value
        return ids.setdefault(value, "UUID_D" + str(len(ids) + 1))
    normalized = re.sub(r"[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}", dynamic_id, raw)
    normalized = normalize_verified(normalized, raw)
    # 仅移除字符串外空白；保留字段顺序、转义和数字字面量。
    return strip_json_whitespace(normalized)


def worker_case(kernel, mock, name):
    offset = len(mock.requests)
    if name == "slots_api":
        response = kernel.request("GET", "/internal/v1/slots")
        check(response["status"] in (200, 404), "slots 返回错误状态")
        # 索引/占用由其他场景断言；这里只显式比较双方是否提供该接口。
        return {"status": response["status"], "supported": response["status"] == 200}
    if name in ("json", "stream", "verified", "tool", "cache", "rate"):
        scenario = {"tool": "tool", "cache": "cache", "rate": "rate"}.get(name, "text")
        stream = name in ("stream", "verified")
        payload = envelope(scenario, stream)
        if name == "verified":
            payload["delivery_mode"] = "verified"
        if name == "tool":
            payload["body"]["tools"] = [{"name": "get", "description": "离线工具",
                                           "input_schema": {"type": "object", "properties": {"a": {"type": "integer"}}}}]
        if name == "cache":
            payload["preserve_cache_breakpoints"] = True
            payload["body"]["system"] = [{"type": "text", "text": "离线系统缓存",
                                            "cache_control": {"type": "ephemeral", "ttl": "1h"}}]
        response = kernel.request("POST", "/internal/v1/messages", payload, timeout=TIMEOUT)
        if name == "rate":
            check(response["status"] == 429 and json_body(response)["error"].get("code"), "429 未传播")
        else:
            success(response, stream=stream, tool=name == "tool")
        outbound = captured_request(mock, offset)
        if name == "cache":
            check('"cache_control"' in outbound, "缓存标记在出站中丢失")
        return {"response": canonical_response(response), "outbound": outbound, "idle": wait_ready(kernel)}
    if name == "auth":
        response = kernel.request("POST", "/internal/v1/messages", envelope(),
                                  headers={"X-Internal-Token": "wrong-fake-token", "x-kin-internal-token": "wrong-fake-token"}, timeout=TIMEOUT)
        check(response["status"] == 401, "错误 internal token 未拒绝")
        check(len(mock.requests) == offset, "鉴权失败仍访问上游")
        return {"response": canonical_response(response), "idle": wait_ready(kernel)}
    if name == "cancel_capacity":
        opened = []
        try:
            for index in range(2):
                opened.append(open_worker(kernel, envelope("hang", True, "probe-hang-" + str(index))))
                check(opened[-1][1].status == 200, "挂起请求未进入 stream")
            end = time.monotonic() + 4
            while len(mock.requests) < offset + 2 and time.monotonic() < end:
                time.sleep(0.02)
            health = json_body(kernel.request("GET", "/internal/health"))
            check(health.get("ready_slots") == 0 and health.get("closed_slots") == 0, "占用状态不符")
            busy_response = kernel.request("GET", "/internal/v1/slots")
            if busy_response["status"] == 200:
                busy_slots = json_body(busy_response)
                check(sum(bool(s.get("active")) for s in busy_slots["slots"]) == 2, "slots 未反映并发占用")
            overflow = kernel.request("POST", "/internal/v1/messages", envelope(), timeout=5)
            check(overflow["status"] == 503 and json_body(overflow)["error"].get("code") == "no_capacity",
                  "容量不足未返回 no_capacity")
            cancels = []
            for index in range(2):
                response = kernel.request("POST", "/internal/v1/cancel", {"request_id": "probe-hang-" + str(index)})
                check(response["status"] == 200 and json_body(response).get("cancelled") is True, "取消未命中真实 job")
                cancels.append(canonical_response(response))
            for _connection, response in opened:
                response.read()
            idle = wait_ready(kernel)
            wait_no_hangs(mock)
            recovery = kernel.request("POST", "/internal/v1/messages", envelope())
            success(recovery)
            wait_ready(kernel)
            return {"busy": {"ready_slots": 0, "closed_slots": 0, "active": 2},
                    "overflow": canonical_response(overflow), "cancel": cancels,
                    "recovery": canonical_response(recovery), "idle": idle}
        finally:
            for connection, _response in opened:
                connection.close()
    if name == "disconnect":
        connection, response = open_worker(kernel, envelope("hang", True, "probe-disconnect"))
        check(response.status == 200, "断连请求未进入 stream")
        response.readline()
        response.close()
        connection.close()
        idle = wait_ready(kernel)
        wait_no_hangs(mock)
        return {"idle": idle}
    if name == "concurrent":
        def run(index):
            response = kernel.request("POST", "/internal/v1/messages", envelope("text", True, "probe-concurrent-" + str(index)))
            success(response, stream=True)
            return canonical_response(response)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(run, range(2)))
        return {"responses": responses, "idle": wait_ready(kernel)}
    raise ValueError(name)


def tcp_request(port, path, body=None, authorization=True, timeout=TIMEOUT, method=None, extra_headers=None):
    started = time.monotonic()
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=timeout)
    connection.response_class = TrailerResponse
    headers = {"content-type": "application/json", "x-request-id": str(uuid.uuid4()), "te": "trailers"}
    if body is not None:
        headers["x-session-id"] = "00000000-2222-4000-8000-000000000000"
    if authorization:
        headers["authorization"] = "Bearer " + API_KEY
    headers.update(extra_headers or {})
    connection.request(method or ("POST" if body is not None else "GET"), path, None if body is None else json.dumps(body), headers)
    response = connection.getresponse()
    header_at = time.monotonic() - started
    raw = response.read().decode()
    result = {"status": response.status, "headers": [(k.lower(), v) for k, v in response.getheaders()],
              "trailers": getattr(response, "captured_trailers", []), "body": raw,
              "header_at": header_at, "total": time.monotonic() - started, "events": []}
    # 每次请求都使用唯一 ID 以满足真实请求日志唯一约束；核验回显后双射替换。
    echoed = dict(result["headers"]).get("x-request-id")
    if echoed is not None:
        check(echoed == headers["x-request-id"], "公共响应 request-id 未与入站关联")
        result["headers"] = [(key, "REQUEST_ID_D1" if key == "x-request-id" else value)
                             for key, value in result["headers"]]
    connection.close()
    return result


@contextlib.contextmanager
def gateway(kernel, root, repository, api_kernel=None):
    """使用仓库真实 server.mjs；仅 Docker 物化边界替换为禁止操作的 CLI。"""
    project = kernel.control_project
    # server 会在 src/config 写公共快照；复制源码至临时运行目录保护只读仓库。
    runtime_source = project / "src"
    shutil.copytree(repository / "src", runtime_source)
    (project / "scripts").symlink_to(repository / "scripts", target_is_directory=True)
    if (repository / "package.json").exists():
        shutil.copy2(repository / "package.json", project / "package.json")
    vmid = "vm-probe"
    home = project / "vms" / vmid / "cli-home"
    run = project / "vms" / vmid / "run"
    (home / ".claude").mkdir(parents=True, exist_ok=True)
    run.mkdir(parents=True)
    credential = {"claudeAiOauth": {"accessToken": "probe-offline-access", "refreshToken": "probe-offline-refresh",
                                   "expiresAt": 4102444800000, "scopes": ["user:inference", "user:profile"]}}
    (home / ".claude" / "credentials.json").write_text(json.dumps(credential), encoding="utf-8")
    identity = json.dumps({"userID": "0" * 64, "oauthAccount": {"accountUuid": "probe-account", "emailAddress": "offline@probe.invalid"}})
    for identity_path in (home / ".claude.json", home / ".claude" / ".claude.json", run / ".claude.json", kernel.root / ".claude.json"):
        identity_path.write_text(identity, encoding="utf-8")
    (run / "internal.token").write_text(kernel.token, encoding="utf-8")
    (run / "kernel.sock").symlink_to(kernel.socket)
    cfg = json.loads(kernel.config_path.read_text())
    cfg["slots_per_worker"] = 20
    (run / "kernel.json").write_text(json.dumps(cfg), encoding="utf-8")
    vm = {"id": vmid, "name": "离线差分槽", "status": "running", "schedulable": True,
          "timezone": "Asia/Taipei", "locale": "en_US.UTF-8", "claude_code_version": "2.1.296",
          "policy": {"maxConcurrency": 20, "weight": 1}, "proxy_cli_enabled": True,
          "proxy": {"id": "local", "scheme": "local", "host": "local"},
          "fingerprint": {"device_id": "probe-device", "session_id": "probe-session", "machineID": "probe-machine"},
          "runtime": {"engine": "rust", "worker_run_dir": str(run), "kernel_socket": str(run / "kernel.sock"),
                      "worker_socket": str(run / "kernel.sock"), "worker_token_file": str(run / "internal.token")},
          "claude": {"access_token": "probe-offline-access", "refresh_token": "probe-offline-refresh",
                     "expires_at": 4102444800, "account_uuid": "probe-account", "email": "offline@probe.invalid",
                     "account_tier": "pro"}}
    (project / "vms" / (vmid + ".json")).write_text(json.dumps(vm), encoding="utf-8")
    (project / "vms" / "active.json").write_text(json.dumps({"active_vm": vmid}), encoding="utf-8")
    routing = json.loads((repository / "src/config/routing.json").read_text(encoding="utf-8"))
    for feature in ("kernel_watchdog", "usage_probe", "health_probe", "notify", "catalog_monitor"):
        routing.setdefault(feature, {})["enabled"] = False
    routing["official_cc"]["inference"] = "wrap"
    routing["official_cc"]["enabled"] = False
    routing["codex"]["enabled"] = False
    routing["compatibility"]["persona_preset"] = "zero"
    routing["compatibility"]["min_max_tokens"]["enabled"] = False
    routing["failover"].update(max_total_attempts=1, max_account_switches=0, max_same_account_retries=0,
                               total_retry_deadline_ms=5000)
    (project / "config").mkdir()
    routing_path = project / "config/routing.json"
    routing_path.write_text(json.dumps(routing), encoding="utf-8")
    # 该替身只接收进程内已有槽位的僵尸回收通知，其他调用全部拒绝并留证。
    docker = root / "docker-denied"
    docker_log = root / "docker-calls.log"
    docker.write_text("#!/usr/bin/env python3\nimport json,sys\nwith open(" + repr(str(docker_log)) +
                      ", 'a') as f: f.write(json.dumps(sys.argv[1:])+'\\n')\n"
                      "sys.exit(0 if sys.argv[-3:] == ['kill','-CHLD','1'] else 125)\n", encoding="utf-8")
    docker.chmod(0o755)
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    env = {key: value for key, value in os.environ.items()
           if not key.startswith(("KIN_", "ANTHROPIC_", "CLAUDE_")) and key not in
           ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy")}
    env.update(KIN_API_KEY=API_KEY, KIN_ADMIN_USER="probe", KIN_ADMIN_PASSWORD="offline-probe-password",
               PORT=str(port), HOST="127.0.0.1", PUBLIC_HOST="127.0.0.1", KIN_PROJECT_ROOT=str(project),
               KIN_DATA_DIR=str(project / "data"), KIN_CAPTURES_DIR=str(project / "captures"),
               KIN_ROUTING_FILE=str(routing_path), KIN_DOCKER_BIN=str(docker), KIN_UPSTREAM_TIMEOUT="15000",
               KIN_FAKE_SESSION_OAUTH="1", KIN_DIFF_CAPTURE="0", KIN_CRS_MOCK="0", KIN_KERNEL_BIN=str(kernel.binary))
    if api_kernel:
        env["KIN_API_KERNEL_BIN"] = str(Path(api_kernel).resolve())
    log = (root / "gateway.log").open("w", encoding="utf-8")
    process = subprocess.Popen(["node", str(runtime_source / "server.mjs")], env=env, cwd=project,
                               stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    try:
        end = time.monotonic() + 15
        while time.monotonic() < end:
            if process.poll() is not None:
                raise RuntimeError("真实控制面启动失败，见 " + str(root / "gateway.log"))
            try:
                if tcp_request(port, "/health", timeout=1)["status"] == 200:
                    break
            except (OSError, http.client.HTTPException):
                pass
            time.sleep(0.05)
        else:
            raise TimeoutError("真实控制面启动超时")
        yield port
    finally:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(3)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait(2)
        log.close()


def control_case(kernel, mock, port, name):
    offset = len(mock.requests)
    if name == "control_auth":
        response = tcp_request(port, "/v1/messages", message(), authorization=False)
        check(response["status"] == 401, "公共入口未执行 API key 鉴权")
        check(len(mock.requests) == offset, "公共鉴权失败仍访问真实 CLI")
        return {"response": canonical_response(response)}
    if name == "control_login_import":
        denied = tcp_request(port, "/api/panel/login", {"username": "probe", "password": "wrong"}, authorization=False)
        check(denied["status"] == 401, "错误面板密码未拒绝")
        login = tcp_request(port, "/api/panel/login", {"username": "probe", "password": "offline-probe-password"}, authorization=False)
        check(login["status"] == 200 and json_body(login).get("ok") is True, "真实面板登录失败: " + login["body"])
        token = json_body(login).get("token")
        check(token and json_body(login).get("role") == "admin", "面板会话缺失或角色不符")
        session = {"authorization": "Bearer " + token}
        me = tcp_request(port, "/api/panel/me", authorization=False, extra_headers=session)
        check(me["status"] == 200 and json_body(me).get("ok") is True, "面板会话未生效")
        imported = tcp_request(port, "/api/panel/vms/vm-probe/oauth/credential", {
            "access_token": "probe-imported-access", "refresh_token": "probe-imported-refresh",
            "expires_at": 4102444800, "email": "imported@probe.invalid", "account_uuid": "probe-account",
            "scopes": ["user:inference", "user:profile"]}, authorization=False, method="PUT", extra_headers=session)
        check(imported["status"] == 200 and json_body(imported).get("ok") is True,
              "真实凭据导入失败: " + imported["body"])
        credential_path = kernel.control_project / "vms/vm-probe/cli-home/.claude/credentials.json"
        check("probe-imported-access" in credential_path.read_text(), "导入未写入槽位凭据文件")
        response = tcp_request(port, "/v1/messages", message())
        success(response, terminal=False)
        captured_request(mock, offset)
        check(mock.requests[-1]["uses_imported_test_token"], "真实 CLI 未读取新导入凭据")
        return {"wrong_password_status": denied["status"], "login_status": login["status"], "role": "admin",
                "session_valid": True, "import_status": imported["status"], "credential_persisted": True,
                "cli_uses_imported_token": True, "response": canonical_response(response), "idle": wait_ready(kernel, 20)}
    if name == "control_abort":
        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
        connection.request("POST", "/v1/messages", json.dumps(message("hang", True)),
                           {"content-type": "application/json", "authorization": "Bearer " + API_KEY})
        response = connection.getresponse()
        check(response.status == 200, "公共流未进入真实 CLI")
        end = time.monotonic() + 8
        while len(mock.requests) == offset and time.monotonic() < end:
            time.sleep(0.02)
        check(len(mock.requests) > offset, "公共入口未到达真实 mock 上游")
        if connection.sock is not None:
            connection.sock.shutdown(socket.SHUT_RDWR)
            connection.sock.close()
        response.close()
        connection.close()
        idle = wait_ready(kernel, 20)
        wait_no_hangs(mock)
        return {"idle": idle, "upstream_requests": len(mock.requests) - offset}
    scenario = "tool" if name == "control_tool" else "cache" if name == "control_cache" else "text"
    stream = name == "control_stream"
    body = message(scenario, stream)
    if scenario == "tool":
        body["tools"] = [{"name": "get", "input_schema": {"type": "object", "properties": {"a": {"type": "integer"}}}}]
    if scenario == "cache":
        body["system"] = [{"type": "text", "text": "公共入口缓存", "cache_control": {"type": "ephemeral", "ttl": "1h"}}]
    response = tcp_request(port, "/v1/messages", body)
    success(response, stream=stream, tool=scenario == "tool", terminal=False)
    outbound = captured_request(mock, offset)
    if scenario == "cache":
        check('"cache_control"' in outbound, "公共缓存标记未到达真实上游")
    # 控制面公开响应的 request-id 可以随机，但仍保留实际出站消息和缓存形状。
    return {"response": canonical_response(response), "outbound": outbound, "idle": wait_ready(kernel, 20)}


def run_integration_layer(upstream_kernel, upstream_cli, native_kernel, native_cli, output_dir, timeout=30,
                          upstream_repo=None, native_repo=None, upstream_api_kernel=None, native_api_kernel=None):
    global TIMEOUT
    TIMEOUT = min(float(timeout), 45)
    root = Path(output_dir).resolve()
    root.mkdir(parents=True, exist_ok=True)
    repository = Path(__file__).resolve().parents[3]
    cases = {}
    worker_names = ["json", "stream", "verified", "tool", "cache", "rate", "auth", "cancel_capacity", "disconnect", "concurrent", "slots_api"]
    control_names = ["control_json", "control_stream", "control_tool", "control_cache", "control_auth", "control_abort", "control_login_import"]
    for side, kernel_binary, cli_binary in (("upstream", upstream_kernel, upstream_cli), ("native", native_kernel, native_cli)):
        for group, names, slots in (("worker", worker_names, 2), ("control", control_names, 20)):
            group_root = root / side / group
            group_root.mkdir(parents=True, exist_ok=True)
            try:
                with MockUpstream() as mock:
                    env = {"ANTHROPIC_BASE_URL": mock.url, "SUBMIT_WAIT_MS": "0", "KIN_SUBMIT_WAIT_MS": "0",
                           "CANCEL_ACK_SECS": "4", "JOB_IDLE_SECS": "20", "KIN_HOST_READY_SECS": "20"}
                    identity = group_root / "identity"
                    identity.mkdir(exist_ok=True)
                    (identity / ".claude.json").write_text(json.dumps({"userID": "0" * 64,
                        "oauthAccount": {"accountUuid": "probe-account", "emailAddress": "offline@probe.invalid"}}), encoding="utf-8")
                    env["CLAUDE_CONFIG_DIR"] = str(identity)
                    kernel_root = group_root / "kernel"
                    kernel_root.mkdir(exist_ok=True)
                    shutil.copy2(identity / ".claude.json", kernel_root / ".claude.json")
                    overrides = {"anthropic_base_url": mock.url, "oauth_token_url": mock.url + "/oauth/token"}
                    project = None
                    if group == "control":
                        project = Path(tempfile.mkdtemp(prefix="parity-control-"))
                        credentials = project / "vms/vm-probe/cli-home/.claude/credentials.json"
                        credentials.parent.mkdir(parents=True)
                        credentials.write_text(json.dumps({"claudeAiOauth": {"accessToken": "probe-offline-access",
                            "refreshToken": "probe-offline-refresh", "expiresAt": 4102444800000,
                            "scopes": ["user:inference", "user:profile"]}}), encoding="utf-8")
                        overrides["credential_path"] = str(credentials)
                        (group_root / "runtime-project.txt").write_text(str(project), encoding="utf-8")
                    with KernelProcess(str(kernel_binary), str(cli_binary), group_root / "kernel", slots=slots, env=env,
                                       config_overrides=overrides) as kernel:
                        kernel.control_project = project
                        wait_ready(kernel, slots)
                        with contextlib.ExitStack() as stack:
                            source = upstream_repo if side == "upstream" else native_repo
                            source = Path(source).resolve() if source else repository
                            api_kernel = upstream_api_kernel if side == "upstream" else native_api_kernel
                            api_kernel = api_kernel or os.environ.get("PARITY_" + side.upper() + "_API_KERNEL")
                            port = stack.enter_context(gateway(kernel, group_root, source, api_kernel)) if group == "control" else None
                            for name in names:
                                started = time.monotonic()
                                try:
                                    with case_deadline():
                                        observation = (control_case(kernel, mock, port, name) if port is not None
                                                       else worker_case(kernel, mock, name))
                                    check(time.monotonic() - started <= 45, "用例超过 45 秒限制")
                                    cases.setdefault(name, {})[side] = {"ok": True, "observation": observation,
                                                                      "elapsed": round(time.monotonic() - started, 3)}
                                    (group_root / (name + ".json")).write_text(json.dumps(cases[name][side], ensure_ascii=False, indent=2), encoding="utf-8")
                                except Exception as error:
                                    cases.setdefault(name, {})[side] = {"ok": False, "error": str(error),
                                                                      "traceback": traceback.format_exc()}
                                    (group_root / (name + ".json")).write_text(json.dumps(cases[name][side], ensure_ascii=False, indent=2), encoding="utf-8")
                                    # 失败后可能残留挂起任务；不让后续用例伪造通过。
                                    for remaining in names[names.index(name) + 1:]:
                                        cases.setdefault(remaining, {})[side] = {"ok": False, "error": "前置用例失败，隔离组中止"}
                                    break
                    (group_root / "mock-requests.json").write_text(json.dumps(mock.requests, ensure_ascii=False, indent=2), encoding="utf-8")
            except Exception as error:
                for name in names:
                    cases.setdefault(name, {}).setdefault(side, {"ok": False, "error": str(error), "traceback": traceback.format_exc()})
    for name, case in cases.items():
        both = all(case.get(side, {}).get("ok") for side in ("upstream", "native"))
        equal = both and case["upstream"]["observation"] == case["native"]["observation"]
        extension = both and name == "slots_api" and case["upstream"]["observation"]["status"] == 404 and case["native"]["observation"]["status"] == 200
        case["strict_equal"] = equal
        case["passed"] = equal or extension
        case["status"] = "KNOWN_EXTENSION" if extension else "PASS" if equal else "DIFF" if both else "FAIL"
    report = {"layer": "integration", "profile": "shared_contract", "strict_equivalence": all(c["strict_equal"] for c in cases.values()),
              "ok": len(cases) == len(worker_names + control_names) and all(c["passed"] for c in cases.values()),
              "cases": cases, "coverage": {"worker_binary_chain": True, "public_v1_messages": True,
              "public_auth": True, "public_cancel_on_disconnect": True, "docker_slot_lifecycle": False,
              "login_import": True, "control_repositories_distinct": bool(upstream_repo and native_repo), "real_model_upstream": False},
              "limitations": ([] if upstream_repo and native_repo else ["未提供双边控制面目录，双方控制面使用当前仓库，不覆盖 fork 控制面接入差异。"] ) + [
                              "本次控制面 Node/API kernel 为 Linux amd64；原生槽位 kernel/CLI 为 ARM64 二进制，由 QEMU 执行，不等同于 ARM64 硬件或完整镜像验收。",
                              "shared_contract 允许 native 新增 /internal/v1/slots 接口，保留 KNOWN_EXTENSION 与 strict_equivalence=false。",
                              "Docker 槽位创建/同步/重启被拒绝，仅临时物化已有槽位；kill -CHLD 1 为无操作替身。",
                              "登录导入覆盖面板会话与凭据文件导入后真实 CLI 读取；不包含浏览器 OAuth 登录授权、在线刷新、生产服务、真实模型请求。"]}
    (root / "integration-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for argument in ("upstream-kernel", "upstream-cli", "native-kernel", "native-cli", "output-dir"):
        parser.add_argument("--" + argument, required=True)
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--upstream-repo")
    parser.add_argument("--native-repo")
    parser.add_argument("--upstream-api-kernel")
    parser.add_argument("--native-api-kernel")
    args = parser.parse_args()
    report = run_integration_layer(args.upstream_kernel, args.upstream_cli, args.native_kernel,
                                   args.native_cli, args.output_dir, args.timeout, args.upstream_repo, args.native_repo,
                                   args.upstream_api_kernel, args.native_api_kernel)
    print(json.dumps({"layer": report["layer"], "ok": report["ok"],
                      "cases": {name: case["status"] for name, case in report["cases"].items()}}, ensure_ascii=False))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
