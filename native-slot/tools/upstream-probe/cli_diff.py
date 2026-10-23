#!/usr/bin/env python3
"""CLI 层离线差分：真实宿主、虚拟凭据、本地 HTTP/SSE 上游。

必须由调用者放在禁止外网的 Linux 容器/网络命名空间执行；不读取宿主凭据。
URL、应用请求头、请求体字节及每个 job 的输出帧分别比较。网络传输头单独留档。
"""

import argparse
import copy
import difflib
import hashlib
import http.server
import json
import os
from pathlib import Path
import queue
import re
import subprocess
import threading
import time

from cli_cch import normalize_verified, strip_json_whitespace, verify as verify_cch


TOKEN = "offline-cli-probe-token-not-a-real-credential"
SESSION = "11111111-2222-4333-8444-555555555555"
UUID_RE = re.compile(r"(?i)\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b")
TRANSPORT_HEADERS = {"host", "connection", "content-length", "accept-encoding", "transfer-encoding"}


def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def request(label="text"):
    return {
        "model": "claude-sonnet-5-5", "max_tokens": 8192, "stream": True,
        "system": ["离线差分测试，请按输入处理。"],
        "messages": [{"role": "user", "content": "offline-probe:" + label}],
        "metadata": {"user_id": encode({"session_id": SESSION})}, "wireMessages": True,
    }


def cases():
    base = request()
    tool = request("tools-thinking")
    tool.update({
        "tools": [{"name": "weather", "description": "查询天气", "strict": True,
                   "input_schema": {"type": "object", "properties": {"city": {"type": "string"}},
                                    "required": ["city"], "additionalProperties": False}}],
        "tool_choice": {"type": "auto"}, "thinking": {"type": "enabled", "budget_tokens": 1024},
    })
    cache = request("cache-system-beta")
    cache.update({
        "system": [{"type": "text", "text": "带缓存的 system", "cache_control": {"type": "ephemeral", "ttl": "1h"}}],
        "messages": [{"role": "user", "content": [{"type": "text", "text": "first", "cache_control": {"type": "ephemeral"}}]},
                     {"role": "system", "content": "中途系统指令"},
                     {"role": "user", "content": "offline-probe:cache-system-beta"}],
        "betas": ["mid-conversation-system-2026-04-07"],
        "output_config": {"effort": "medium"},
    })
    # messages 里先出现计费示例、system 用字符串形态：只认首个 canonical system 头。
    history = request("cch-history")
    history["system"] = "cch=00000; prompt_version=<offline>;"
    history["tools"] = [{"name": "Echo", "description": "回显",
                         "input_schema": {"type": "object", "properties": {"text": {"type": "string"}}}}]
    history["messages"] = [
        {"role": "user", "content": "offline-probe:cch-history"},
        {"role": "assistant", "content": [
            {"type": "text", "text": "先调用工具。"},
            {"type": "tool_use", "id": "toolu_01", "name": "Echo", "input": {"text": "hi"}}]},
        {"role": "user", "content": [{"type": "tool_result", "tool_use_id": "toolu_01",
                                      "content": "文档示例：cch=00000; 不应被改写"}]},
    ]
    # thread 只在 MID_OUTPUT_CONFIG_MODELS 上拉 mid-conversation-output-config。
    thread = request("thread-output-config")
    thread["thread"] = {"id": "thread-offline"}
    thread_legacy = request("thread-legacy-model")
    thread_legacy["model"] = "claude-opus-4-8"
    thread_legacy["thread"] = {"id": "thread-offline"}
    return [
        {"name": "text", "request": base},
        {"name": "cch_history", "request": history},
        {"name": "thread_mid_output_config", "request": thread},
        {"name": "thread_legacy_model", "request": thread_legacy},
        # 面板打开 cached_microcompact_enabled：这个 CLI 构建没有 cache-editing 实现，
        # 两侧都必须以 cached_microcompact_unavailable / 400 结束。
        {"name": "cached_microcompact", "request": request("cached-mc"),
         "kernel": {"cached_microcompact_enabled": True}},
        {"name": "tools_thinking", "request": tool, "response": "tools"},
        {"name": "cache_system_beta", "request": cache},
        {"name": "inference_scope", "request": request("inference"), "credential": "inference"},
        {"name": "api_key", "request": request("api-key"), "credential": "apikey"},
        *[{"name": "http_" + str(status), "request": request("http-" + str(status)), "status": status}
          for status in (401, 429, 500, 529)],
        {"name": "malformed_sse", "request": request("malformed"), "response": "malformed"},
        {"name": "empty_sse", "request": request("empty"), "response": "empty"},
        {"name": "cancel", "request": request("cancel"), "response": "hang"},
        {"name": "concurrent", "request": request("concurrent"), "concurrent": True},
    ]


class MockUpstream:
    def __init__(self, case):
        self.case = case
        self.records = []
        self.lock = threading.Lock()
        self.release = threading.Event()
        self.concurrent_arrived = threading.Event()
        self.errors = []
        owner = self

        class Handler(http.server.BaseHTTPRequestHandler):
            protocol_version = "HTTP/1.1"

            def log_message(self, *_):
                pass

            def handle(self):
                try:
                    super().handle()
                except (BrokenPipeError, ConnectionResetError):
                    # 用例收尾或取消时，宿主主动关闭 keep-alive 连接是正常行为。
                    pass

            def do_POST(self):
                try:
                    self.handle_post()
                except (BrokenPipeError, ConnectionResetError):
                    pass
                except Exception as exc:
                    owner.errors.append(str(exc))

            def handle_post(self):
                raw = self.rfile.read(int(self.headers.get("content-length", "0"))).decode("utf-8")
                record = {"method": "POST", "url": "http://127.0.0.1:<MOCK_PORT>" + self.path,
                          "headers": sorted((k.lower(), v) for k, v in self.headers.items()),
                          "body": raw, "arrived": time.monotonic()}
                with owner.lock:
                    owner.records.append(record)
                    if len(owner.records) >= 2:
                        owner.concurrent_arrived.set()
                if owner.case.get("concurrent") and not owner.concurrent_arrived.wait(5):
                    owner.errors.append("两个槽位没有同时进入 mock")
                status = owner.case.get("status", 200)
                response = owner.case.get("response", "text")
                self.send_response(status)
                self.send_header("request-id", "req_offline_" + owner.case["name"])
                self.send_header("anthropic-ratelimit-requests-remaining", "99")
                if status != 200:
                    typ = {401: "authentication_error", 429: "rate_limit_error", 529: "overloaded_error"}.get(status, "api_error")
                    data = encode({"type": "error", "error": {"type": typ, "message": "offline " + str(status)}}).encode()
                    self.send_header("content-type", "application/json")
                    self.send_header("retry-after", "0")
                    self.send_header("content-length", str(len(data)))
                    self.end_headers()
                    self.wfile.write(data)
                    self.wfile.flush()
                    return
                self.send_header("content-type", "text/event-stream")
                self.send_header("connection", "close")
                self.end_headers()
                self.close_connection = True
                if response == "empty":
                    return
                if response == "malformed":
                    self.wfile.write(b'event: content_block_delta\ndata: {broken-json}\n\n')
                    self.wfile.flush()
                    return
                model = json.loads(raw).get("model", "claude-sonnet-5-5")
                def event(value):
                    self.wfile.write(("event: " + value["type"] + "\ndata: " + encode(value) + "\n\n").encode())
                    self.wfile.flush()
                event({"type": "message_start", "message": {"id": "msg_offline_fixed", "type": "message",
                       "role": "assistant", "model": model, "content": [], "stop_reason": None,
                       "stop_sequence": None, "usage": {"input_tokens": 10, "output_tokens": 1}}})
                if response == "hang":
                    owner.release.wait(35)
                    return
                if response == "tools":
                    event({"type": "content_block_start", "index": 0, "content_block": {"type": "thinking", "thinking": ""}})
                    event({"type": "content_block_delta", "index": 0, "delta": {"type": "thinking_delta", "thinking": "离线推理"}})
                    event({"type": "content_block_delta", "index": 0, "delta": {"type": "signature_delta", "signature": "offline-signature"}})
                    event({"type": "content_block_stop", "index": 0})
                    for index, tool_id in ((1, "toolu_offline_a"), (2, "toolu_offline_b")):
                        event({"type": "content_block_start", "index": index, "content_block": {"type": "tool_use", "id": tool_id, "name": "weather", "input": {}}})
                        event({"type": "content_block_delta", "index": index, "delta": {"type": "input_json_delta", "partial_json": '{"city":"Taipei"}'}})
                        event({"type": "content_block_stop", "index": index})
                else:
                    event({"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}})
                    event({"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "离线 hello \"quoted\"\n"}})
                    event({"type": "content_block_stop", "index": 0})
                event({"type": "message_delta", "delta": {"stop_reason": "tool_use" if response == "tools" else "end_turn", "stop_sequence": None}, "usage": {"output_tokens": 5}})
                event({"type": "message_stop"})

        self.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.server.daemon_threads = True
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = "http://127.0.0.1:" + str(self.server.server_port)

    def close(self):
        self.release.set()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(2)


def make_environment(home, mock_url, case):
    home.mkdir(parents=True, exist_ok=True)
    config = home / "config"
    config.mkdir(exist_ok=True)
    credential = ({"anthropicApiKey": {"apiKey": TOKEN}} if case.get("credential") == "apikey" else
                  {"type": "oauth", "claudeAiOauth": {"accessToken": TOKEN, "refreshToken": "offline-unused",
                   "expiresAt": 4102444800000, "scopes": ["user:inference"] + ([] if case.get("credential") == "inference" else ["user:profile"])}})
    for name in ("credentials.json", ".credentials.json"):
        write_json(config / name, credential)
        os.chmod(config / name, 0o600)
    global_config = {"userID": "a" * 64, "oauthAccount": {"accountUuid": "offline-account"},
                     "hasCompletedOnboarding": True, "theme": "dark"}
    write_json(config / ".claude.json", global_config)
    write_json(home / ".claude.json", global_config)
    kernel = home / "kernel.json"
    kernel_doc = {"credential_path": str(config / "credentials.json"), "provider": "local_cli",
                  "timezone": "Asia/Taipei", "persona_preset": "zero", "default_cache_ttl": "1h",
                  "cch_enabled": True}
    kernel_doc.update(case.get("kernel") or {})
    write_json(kernel, kernel_doc)
    # 使用白名单继承，避免把开发机的 token、代理或其他 Claude 设置带进子进程。
    env = {k: v for k, v in os.environ.items() if k in ("PATH", "LD_LIBRARY_PATH", "LANG", "LC_ALL", "SYSTEMROOT", "WINDIR", "QEMU_LD_PREFIX")}
    env.update({"HOME": str(home), "USERPROFILE": str(home), "TMPDIR": str(home),
                "CLAUDE_CONFIG_DIR": str(config), "KIN_CREDENTIAL_FILE": str(config / "credentials.json"),
                "KERNEL_CONFIG": str(kernel), "ANTHROPIC_BASE_URL": mock_url,
                "CLAUDE_CODE_NATIVE_SLOTS": "2", "CLAUDE_CODE_KIN_NATIVE_SLOTS": "2",
                "CLAUDE_CODE_SYSTEM_LAYOUT": "zero", "CLAUDE_CODE_ENVELOPE": "zero", "SYSTEM_MODE": "zero",
                "CLAUDE_CODE_TIMEZONE": "Asia/Taipei", "TZ": "Asia/Taipei", "CLAUDE_CODE_VERSION": "2.1.296",
                "CLAUDE_CODE_HOST_REFRESH": "1", "CLAUDE_CODE_DISABLE_TELEMETRY": "1",
                "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1", "DISABLE_AUTOUPDATER": "1",
                "CLAUDE_CODE_GATEWAY_HINT_HEADERS": "1", "CLAUDE_CODE_CONFIG_HASH": "offline-cli-probe",
                "HTTP_PROXY": "http://127.0.0.1:1", "HTTPS_PROXY": "http://127.0.0.1:1",
                "http_proxy": "http://127.0.0.1:1", "https_proxy": "http://127.0.0.1:1",
                "NO_PROXY": "127.0.0.1,localhost", "no_proxy": "127.0.0.1,localhost"})
    if case.get("credential") == "apikey":
        # 官方 SDK 从显式环境读取 API Key；文件与环境均仅使用同一虚拟值。
        env["ANTHROPIC_API_KEY"] = TOKEN
    return env


class Host:
    def __init__(self, binary, env, directory):
        self.frames = []
        self.queue = queue.Queue()
        self.stderr = open(directory / "stderr.log", "w", encoding="utf-8")
        self.process = subprocess.Popen([str(binary)], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=self.stderr, text=True, encoding="utf-8", env=env, cwd=directory,
                                        start_new_session=(os.name != "nt"))
        self.reader = threading.Thread(target=self.read, daemon=True)
        self.reader.start()

    def read(self):
        for line in self.process.stdout:
            try:
                frame = json.loads(line)
            except ValueError:
                frame = {"_invalid_stdout": line.rstrip("\n")}
            item = {"at": time.monotonic(), "frame": frame, "raw": line.rstrip("\n")}
            self.frames.append(item)
            self.queue.put(item)
        self.queue.put(None)

    def send(self, value):
        self.process.stdin.write(encode(value) + "\n")
        self.process.stdin.flush()

    def until(self, predicate, deadline):
        while True:
            if predicate([x["frame"] for x in self.frames]):
                return
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError("CLI 用例超时")
            try:
                item = self.queue.get(timeout=remaining)
            except queue.Empty:
                raise TimeoutError("CLI 用例超时") from None
            if item is None:
                raise RuntimeError("CLI 提前退出，exit=" + str(self.process.poll()))

    def close(self):
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=2)
        self.reader.join(2)
        self.process.stdin.close()
        self.process.stdout.close()
        self.stderr.close()


def canonicalize(value, mapping):
    # 逐个 ID 分配符号，重复引用仍指向同一符号，两个不同 ID 不会合并。
    if isinstance(value, str):
        def replace(match):
            token = match.group(0)
            # 输入给两边的固定会话 ID 必须原样保留，防止错误改写会话被归一化掩盖。
            if token == SESSION:
                return token
            if token not in mapping:
                mapping[token] = "<UUID:" + str(len(mapping) + 1) + ">"
            return mapping[token]
        return UUID_RE.sub(replace, value)
    if isinstance(value, (list, tuple)):
        return [canonicalize(x, mapping) for x in value]
    if isinstance(value, dict):
        return {k: canonicalize(v, mapping) for k, v in value.items()}
    return value


def normalized(result):
    mapping = {}
    outgoing = []
    for record in sorted(result["requests"], key=lambda x: x["body"]):
        # JSON 原文保留键序、数字字面量、转义；只对动态 UUID 做双射替换。
        headers = [(k, v) for k, v in record["headers"] if k not in TRANSPORT_HEADERS]
        normalized_request = canonicalize({"method": record["method"], "url": record["url"],
                                          "headers": headers, "body": record["body"]}, mapping)
        normalized_request["body"] = strip_json_whitespace(normalize_verified(normalized_request["body"], record["body"]))
        normalized_request["cch_valid"] = verify_cch(record["body"])["valid"]
        outgoing.append(normalized_request)
    frames = [x["frame"] for x in result["frames"]]
    startup = []
    jobs = {}
    for frame in frames:
        frame = copy.deepcopy(frame)
        if frame.get("type") == "host_ready":
            frame["capabilities"] = sorted(frame.get("capabilities", []))
        job_id = frame.get("job_id")
        if job_id:
            jobs.setdefault(job_id, []).append(frame)
        else:
            startup.append(frame)
    # 并发槽位之间无规定输出顺序；每个 job 内的顺序必须相同。
    return {"requests": outgoing, "startup": canonicalize(startup, mapping),
            "jobs": canonicalize({k: jobs[k] for k in sorted(jobs)}, mapping)}


def check_result(result, case):
    problems = []
    if result.get("error"):
        problems.append(result["error"])
    frames = [x["frame"] for x in result["frames"]]
    ready = [x for x in frames if x.get("type") == "host_ready"]
    if len(ready) != 1 or ready[0].get("protocol_version") != 2 or ready[0].get("slots") != 2 or ready[0].get("system_layout") != "zero" or ready[0].get("timezone") != "Asia/Taipei":
        problems.append("host_ready 握手与隔离配置不符")
    elif not {"multi_slot", "native_sse", "stateless"}.issubset(ready[0].get("capabilities", [])):
        problems.append("host_ready 缺少必需能力")
    if {x.get("slot_id") for x in frames if x.get("type") == "slot_ready"} != {"s00", "s01"}:
        problems.append("未注册两个槽位")
    if any("_invalid_stdout" in x for x in frames):
        problems.append("stdout 包含非 JSON 帧")
    gated = (case.get("kernel") or {}).get("cached_microcompact_enabled") is True
    expected = 0 if gated else (2 if case.get("concurrent") else 1)
    if len(result["requests"]) != expected:
        problems.append("mock 出站请求数应为 " + str(expected) + "，实际 " + str(len(result["requests"])))
    for rec in result["requests"]:
        headers = dict(rec["headers"])
        actual_auth = headers.get("x-api-key") if case.get("credential") == "apikey" else headers.get("authorization", "")
        expected_auth = TOKEN if case.get("credential") == "apikey" else "Bearer " + TOKEN
        if actual_auth != expected_auth:
            problems.append("mock 未收到指定虚拟凭据")
        if rec["method"] != "POST" or not rec["url"].endswith("/v1/messages?beta=true"):
            problems.append("Messages 方法或路径不符")
        cch = verify_cch(rec["body"])
        rec["cch_validation"] = cch
        if not cch["valid"]:
            problems.append("计费摘要 cch 不符：actual=" + cch["actual"] + " expected=" + cch["expected"])
        prompt = re.search(r"cc_prompt_id=([0-9a-f-]{36});", rec["body"])
        if prompt and (UUID_RE.fullmatch(prompt[1]) is None or prompt[1] == SESSION or headers.get("x-claude-code-prompt-id") != prompt[1]):
            problems.append("prompt UUID 必须独立于调用方 session，且正文与 header 一致")
        try:
            body = json.loads(rec["body"])
            if body.get("stream") is not True or body.get("max_tokens") != 8192:
                problems.append("出站 stream/max_tokens 不符")
        except ValueError:
            problems.append("出站请求体不是有效 JSON")
    jobs = {x.get("job_id"): [] for x in frames if x.get("job_id")}
    for frame in frames:
        if frame.get("job_id") in jobs:
            jobs[frame["job_id"]].append(frame)
    for i in range(2 if case.get("concurrent") else 1):
        job = jobs.get("job_" + str(i + 1).zfill(32), [])
        terminals = [x for x in job if x.get("type") in ("job_done", "job_error", "cancel_ack")]
        if len(terminals) != 1:
            problems.append("job 终结帧数量不为 1")
            continue
        terminal = terminals[0]
        if gated:
            # 本构建没有 cache-editing 实现：面板开关打开后每条 messages 请求都以
            # cached_microcompact_unavailable / 400 结束，且不发往上游。
            if terminal.get("type") != "job_error" or terminal.get("code") != "cached_microcompact_unavailable"                     or terminal.get("status") != 400 or terminal.get("error_type") != "invalid_request_error":
                problems.append("面板 cached_microcompact 开关未按 cached_microcompact_unavailable/400 拒绝")
        elif case.get("response") == "hang":
            if terminal.get("type") != "cancel_ack":
                problems.append("取消任务没有收到 cancel_ack")
        elif case.get("status", 200) != 200:
            if terminal.get("type") != "job_error" or terminal.get("status") != case["status"]:
                problems.append("HTTP 错误未按状态码转为 job_error")
        elif case.get("response") in ("malformed", "empty"):
            if terminal.get("type") != "job_error":
                problems.append("无效 SSE 未被拒绝")
        elif terminal.get("type") != "job_done" or not any(x.get("event", {}).get("type") == "message_stop" for x in job):
            problems.append("成功任务缺少 message_stop/job_done")
    problems.extend(result.get("mock_errors", []))
    return problems


def run_one(binary, case, directory, timeout):
    directory.mkdir(parents=True, exist_ok=True)
    mock = MockUpstream(case)
    host = None
    result = {"frames": [], "requests": [], "error": None}
    started = time.monotonic()
    deadline = started + timeout
    try:
        host = Host(binary, make_environment(directory / "home", mock.url, case), directory)
        host.until(lambda fs: len([x for x in fs if x.get("type") == "slot_ready"]) == 2, deadline)
        count = 2 if case.get("concurrent") else 1
        for index in range(count):
            req = copy.deepcopy(case["request"])
            if count > 1:
                req["messages"][-1]["content"] += ":" + str(index)
            host.send({"type": "job_start", "job_id": "job_" + str(index + 1).zfill(32),
                       "slot_id": "s" + str(index).zfill(2), "request": req})
        if case.get("response") == "hang":
            host.until(lambda fs: any(x.get("event", {}).get("type") == "message_start" for x in fs), deadline)
            host.send({"type": "cancel", "job_id": "job_" + "1".zfill(32), "slot_id": "s00"})
            host.until(lambda fs: any(x.get("type") == "cancel_ack" for x in fs), deadline)
        else:
            host.until(lambda fs: len([x for x in fs if x.get("type") in ("job_done", "job_error")]) >= count, deadline)
    except Exception as exc:
        result["error"] = type(exc).__name__ + ": " + str(exc)
    finally:
        if host:
            host.close()
            result["frames"] = host.frames
        mock.close()
        result["requests"] = mock.records
        result["mock_errors"] = mock.errors
    result["duration_seconds"] = round(time.monotonic() - started, 3)
    result["assertions"] = check_result(result, case)
    write_json(directory / "capture.json", result)
    write_json(directory / "normalized.json", normalized(result))
    return result


def run_cli_layer(upstream_cli, native_cli=None, output_dir=None, timeout=30):
    """运行全部用例，返回可序列化报告；支持路径参数或 argparse.Namespace。"""
    if native_cli is None and not isinstance(upstream_cli, (str, Path)):
        args = upstream_cli
        upstream_cli, native_cli, output_dir = args.upstream_cli, args.native_cli, args.output_dir
        timeout = getattr(args, "timeout", timeout)
    output = Path(output_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)
    report = {"layer": "cli", "status": "PASS", "cases": [], "network": "loopback mock only; caller must deny external network",
              "comparison": {"request_body": "JSON wire bytes excluding string-external whitespace; preserves key order, numbers and escaping; bijective UUID substitution; cch independently recomputed from raw body",
                             "frames": "JSON fields and order within each job; inter-job scheduling unordered",
                             "transport_headers_recorded_only": sorted(TRANSPORT_HEADERS)},
              "binaries": {}}
    if not 0 < timeout <= 45:
        report.update(status="BLOCKED", error="每例 timeout 必须大于 0 且不超过 45 秒")
    for name, binary in (("upstream", upstream_cli), ("native", native_cli)):
        path = Path(binary).resolve() if binary else None
        if path is None or not path.is_file() or not os.access(path, os.X_OK):
            report.update(status="BLOCKED", error=name + " CLI 缺失或不可执行")
        else:
            report["binaries"][name] = {"path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
    if report["status"] != "BLOCKED":
        for case in cases():
            left = run_one(Path(upstream_cli).resolve(), case, output / case["name"] / "upstream", timeout)
            right = run_one(Path(native_cli).resolve(), case, output / case["name"] / "native", timeout)
            lhs, rhs = normalized(left), normalized(right)
            diff = list(difflib.unified_diff(json.dumps(lhs, ensure_ascii=False, indent=2, sort_keys=True).splitlines(),
                                           json.dumps(rhs, ensure_ascii=False, indent=2, sort_keys=True).splitlines(),
                                           fromfile="upstream", tofile="native", lineterm=""))
            status = "FAIL" if left["assertions"] or right["assertions"] else ("DIFF" if diff else "PASS")
            diff_path = output / case["name"] / "diff.txt"
            diff_path.write_text("\n".join(diff) + ("\n" if diff else ""), encoding="utf-8")
            report["cases"].append({"name": case["name"], "status": status,
                                    "upstream_assertions": left["assertions"], "native_assertions": right["assertions"],
                                    "request_count": {"upstream": len(left["requests"]), "native": len(right["requests"])},
                                    "diff": str(diff_path), "different": bool(diff)})
            if status == "FAIL" or (status == "DIFF" and report["status"] == "PASS"):
                report["status"] = status
    write_json(output / "cli-report.json", report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream-cli", required=True)
    parser.add_argument("--native-cli", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--timeout", type=float, default=30)
    args = parser.parse_args()
    report = run_cli_layer(args)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
