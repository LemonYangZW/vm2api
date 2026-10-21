#!/usr/bin/env python3
"""内核层离线差分：同一假 CLI、独立配置/Unix socket、双向帧与 HTTP 证据。"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import copy
import difflib
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import tempfile
import time
import traceback

from probe_common import KernelProcess, UnixConnection, canonical_response, message_envelope, save_json


FIXED_SESSION = "00000000-0000-4000-8000-000000000000"


def cases():
    # 前 18 项保留旧 compare.sh 的覆盖与命名。
    result = [{"name": name, "mode": name} for name in
              ("ok", "slow", "slow_err", "esc", "bare_err", "full_err", "empty", "nostop", "nostop_delta")]
    result += [{"name": mode + "-json", "mode": mode, "stream": False} for mode in
               ("ok", "bare_err", "full_err", "empty", "nostop", "nostop_delta")]
    result += [{"name": "ok-verified", "mode": "ok", "delivery": "verified"},
               {"name": "err-verified", "mode": "full_err", "delivery": "verified"},
               {"name": "empty-verified", "mode": "empty", "delivery": "verified"}]
    result += [{"name": mode, "mode": mode} for mode in ("err", "hdr_err", "hdr_ok", "partial_err")]
    for mode in ("tool", "thinking", "cache"):
        result += [{"name": mode, "mode": mode}, {"name": mode + "-json", "mode": mode, "stream": False}]
    result += [{"name": "tool-done-override-json", "mode": "tool", "stream": False, "done_override": True},
               {"name": "cache-done-override-json", "mode": "cache", "stream": False, "done_override": True},
               {"name": "thinking-initial-signature-json", "mode": "thinking", "stream": False, "initial_signature": "start-signature"},
               {"name": "partial-error-separated", "mode": "partial_err", "error_gap": 0.1},
               {"name": "hdr-error-separated", "mode": "hdr_err", "header_gap": 0.25}]
    result += [{"name": "bad-auth", "mode": "ok", "operation": "bad_auth"},
               {"name": "bad-envelope", "mode": "ok", "operation": "bad_envelope"},
               {"name": "cancel", "mode": "hold", "operation": "cancel", "slots": 1},
               {"name": "capacity", "mode": "hold", "operation": "capacity", "slots": 1},
               {"name": "concurrent", "mode": "slow", "operation": "concurrent"},
               {"name": "client-disconnect", "mode": "hold", "operation": "disconnect", "slots": 1},
               {"name": "host-exit-recovery", "mode": "exit_once", "operation": "restart", "slots": 1}]
    return result


def read_frames(path):
    if not path.exists():
        return []
    # JSON 字符串允许 U+2028；splitlines 会误把它当 NDJSON 分隔符。
    lines = path.read_text(encoding="utf-8").split("\n")
    frames = []
    for line in lines:
        if not line:
            continue
        try:
            frames.append(json.loads(line))
        except ValueError:
            # 日志正在追加的末行，在下一次轮询时再读。
            if line != lines[-1]:
                raise
    return frames


def wait_frames(path, predicate, deadline):
    while time.monotonic() < deadline:
        frames = read_frames(path)
        if predicate(frames):
            return frames
        time.sleep(0.02)
    raise TimeoutError("等待假 CLI 帧超时")


def settled_frames(path, predicate, deadline):
    wait_frames(path, predicate, deadline)
    last, stable = None, time.monotonic()
    while time.monotonic() < deadline:
        frames = read_frames(path)
        signature = json.dumps(frames, ensure_ascii=False)
        if signature != last:
            last, stable = signature, time.monotonic()
        elif time.monotonic() - stable >= 0.2:
            return frames
        time.sleep(0.02)
    raise TimeoutError("CLI 帧日志没有在截止前稳定")


def frame_count(frames, direction, kind):
    return sum(x["direction"] == direction and x["frame"].get("type") == kind for x in frames)


def envelope(case, request_id="parity-request", recover=False):
    result = message_envelope(case.get("stream", True), case.get("delivery"), request_id)
    result["body"]["messages"][0]["content"] = "parity local " + ("recover" if recover else request_id)
    if case["mode"] == "tool":
        result["body"]["tools"] = [{"name": "weather", "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}}}]
    if case["mode"] == "thinking":
        result["body"]["thinking"] = {"type": "enabled", "budget_tokens": 1024}
    if case["mode"] == "cache":
        result["body"]["system"] = [{"type": "text", "text": "cache system", "cache_control": {"type": "ephemeral", "ttl": "1h"}}]
        result["body"]["messages"].insert(0, {"role": "system", "content": "mid conversation"})
        result["body"]["betas"] = ["mid-conversation-system-2026-04-07"]
    return result


class FrameIDs:
    def __init__(self):
        self.ids = {}

    def token(self, value):
        if value == FIXED_SESSION:
            return value
        if value not in self.ids:
            self.ids[value] = "<ID:" + str(len(self.ids) + 1) + ">"
        return self.ids[value]

    def normalize(self, value):
        if isinstance(value, str):
            return re.sub(r"(?:job_|ping_)[0-9a-f]{16,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
                          lambda match: self.token(match.group(0)), value)
        if isinstance(value, list):
            return [self.normalize(x) for x in value]
        if isinstance(value, dict):
            return {k: self.normalize(v) for k, v in value.items()}
        return value


def normalize_frames(frames):
    mapper = FrameIDs()
    groups, others = {}, []
    for item in frames:
        frame = item["frame"]
        if frame.get("job_id"):
            record = {"direction": item["direction"], "frame": frame}
            if frame.get("type") == "job_start":
                record["request_wire"] = json.dumps(frame.get("request"), ensure_ascii=False, separators=(",", ":"))
            groups.setdefault(frame["job_id"], []).append(record)
        else:
            others.append({"direction": item["direction"], "frame": frame})
    # 并发任务按固定输入内容排序，不把操作系统调度先后当成功能差异。
    ordered = sorted(groups.values(), key=lambda group: json.dumps(next(
        (x["frame"].get("request", {}) for x in group if x["frame"].get("type") == "job_start"), {}),
        sort_keys=True, ensure_ascii=False))
    for group in ordered:
        for item in group:
            job_id = item["frame"].get("job_id")
            if job_id:
                mapper.token(job_id)
                break
    return {"jobs": mapper.normalize(ordered),
            "host_frames": mapper.normalize(sorted(others, key=lambda x: json.dumps(x, sort_keys=True)))}


def normalize_result(result):
    return {"responses": {name: canonical_response(resp) for name, resp in sorted(result["responses"].items())},
            "frames": normalize_frames(result["frames"]), "observations": result.get("observations", {})}


def response_assertions(response, case, expect_error=None):
    problems = []
    stream = case.get("stream", True)
    verified = case.get("delivery") == "verified"
    mode = case["mode"]
    error = expect_error if expect_error is not None else mode in ("bare_err", "full_err", "err", "hdr_err", "partial_err", "slow_err")
    expected_code = {"bare_err": "upstream_invalid_request", "full_err": "upstream_rate_limit", "err": "upstream_rate_limit",
                     "hdr_err": "upstream_rate_limit", "partial_err": "upstream_stream_interrupted", "slow_err": "upstream_stream_interrupted"}.get(mode)
    if error and (not stream or verified):
        expected_status = 400 if mode == "bare_err" else 429
    else:
        expected_status = 200
    if response["status"] != expected_status:
        problems.append(f"HTTP 应为 {expected_status}，实际 {response['status']}")
    if not response["body"]:
        problems.append("HTTP 正文为空")
    headers, trailers = dict(response["headers"]), dict(response["trailers"])
    events = response["events"]
    if stream and not (error and verified):
        if not headers.get("content-type", "").startswith("text/event-stream"):
            problems.append("流式响应不是 text/event-stream")
        expected_last = "error" if error else "message_stop"
        if not events or events[-1]["event"] != expected_last:
            problems.append("SSE 未以 " + expected_last + " 结束")
        terminal = headers.get("x-terminal-state") if verified else trailers.get("x-terminal-state")
        if terminal != ("incomplete" if error else "verified"):
            problems.append("终结状态 header/trailer 不符")
        if error and not verified and trailers.get("x-error-code") != expected_code:
            problems.append("错误 trailer code 不符")
        if mode in ("slow", "slow_err"):
            arrival = [x["at"] for x in events]
            separated = [arrival[0]] if arrival else []
            for at in arrival[1:]:
                if at - separated[-1] >= 0.12:
                    separated.append(at)
            if len(separated) < 3:
                problems.append("slow 没有至少 3 次分时交付，疑似攒包")
            if arrival and arrival[-1] - arrival[0] < 0.4:
                problems.append("slow 事件总间隔不足 0.4 秒")
    elif not error:
        try:
            body = json.loads(response["body"])
            if body.get("type") != "message" or body.get("role") != "assistant" or not isinstance(body.get("content"), list):
                problems.append("非流式正文不是合法 message")
            if headers.get("x-terminal-state") != "verified":
                problems.append("非流式缺少 verified 状态")
        except ValueError:
            problems.append("非流式正文不是 JSON")
    if error and expected_code and expected_code not in response["body"]:
        problems.append("错误正文缺少预期 code " + expected_code)
    if mode == "tool" and not error:
        if not all(tool_id in response["body"] for tool_id in ("toolu_fake_a", "toolu_fake_b")):
            problems.append("两个不同工具 ID 未完整保留")
    if mode == "thinking" and not error:
        if stream and "offline-signature" not in response["body"]:
            problems.append("流式 thinking signature_delta 未保留")
        elif not stream:
            blocks = json.loads(response["body"])["content"]
            signature = blocks[0].get("signature") if blocks else None
            if not blocks or blocks[0].get("thinking") != "offline thought" or signature != case.get("initial_signature"):
                problems.append("JSON thinking 必须保留思考文本和起始 signature，不能合并 signature_delta")
    if mode == "cache" and not error and not case.get("done_override") and not all(key in response["body"] for key in ("ephemeral_1h_input_tokens", "cache_read_input_tokens")):
        problems.append("空 done 的缓存 usage 未保留")
    if case.get("done_override") and not stream and not error:
        body = json.loads(response["body"])
        if body.get("stop_reason") != "end_turn" or body.get("usage") != {"input_tokens": 1, "output_tokens": 1}:
            problems.append("显式 done 必须整体覆盖流 stop_reason/usage")
    if mode == "partial_err":
        problems.extend(partial_error_assertions(response, bool(case.get("error_gap"))))
    if mode == "hdr_err":
        problems.extend(header_error_assertions(response, bool(case.get("header_gap"))))
    return problems


def partial_error_middle():
    event = {"type": "content_block_start", "index": 0, "content_block": {
        "type": "text", "text": "<a&b>\u2028\u00e9\u0001", "n": 1.5}}
    return "event: content_block_start\ndata: " + json.dumps(event, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n\n"


def partial_error_assertions(response, separated):
    events = response["events"]
    names = [event["event"] for event in events]
    allowed = [["message_start", "content_block_start", "error"]]
    if not separated:
        allowed.append(["message_start", "error"])
    if names not in allowed:
        return ["partial error 只允许起始、夹具唯一完整内容块、最终 error；分时 case 内容块必需"]
    rebuilt = "".join("event: " + event["event"] + "\ndata: " + event["data"] + "\n\n" for event in events)
    if rebuilt != response["body"]:
        return ["partial error SSE 含额外字节或未识别事件"]
    if len(events) == 3 and "event: content_block_start\ndata: " + events[1]["data"] + "\n\n" != partial_error_middle():
        return ["partial error 中间内容块与夹具原始字节不符"]
    return []


def partial_error_contract(result):
    result = copy.deepcopy(result)
    response = result["responses"].get("main")
    if response and not partial_error_assertions(response, False):
        response["body"] = response["body"].replace(partial_error_middle(), "", 1)
    return result


def header_error_middle():
    # 只允许这个夹具的两个头及其原值，不能吞掉任意 response_headers。
    return 'event: response_headers\ndata: {"headers":{"request-id":"req_fake","retry-after":"7"},"type":"response_headers"}\n\n'


def header_error_assertions(response, separated):
    events = response["events"]
    names = [event["event"] for event in events]
    allowed = [["response_headers", "error"]]
    if not separated:
        allowed.append(["error"])
    if names not in allowed:
        return ["header error 只允许夹具唯一完整头事件和最终 error；分时 case 头事件必需"]
    rebuilt = "".join("event: " + event["event"] + "\ndata: " + event["data"] + "\n\n" for event in events)
    if rebuilt != response["body"]:
        return ["header error SSE 含额外字节或未识别事件"]
    if len(events) == 2 and "event: response_headers\ndata: " + events[0]["data"] + "\n\n" != header_error_middle():
        return ["header error 的头名称、原值或事件字节与夹具不符"]
    return []


def header_error_contract(result):
    result = copy.deepcopy(result)
    response = result["responses"].get("main")
    if response and not header_error_assertions(response, False):
        response["body"] = response["body"].replace(header_error_middle(), "", 1)
    return result


def run_one(binary, case, directory, fake_cli, timeout):
    directory.mkdir(parents=True, exist_ok=True)
    # 快速追加日志放 Linux 本地文件系统，避免 Docker Desktop 挂载盘瞬态 I/O。
    frame_dir = tempfile.TemporaryDirectory(prefix="parity-frames-", dir="/tmp")
    frame_log = Path(frame_dir.name) / "frames.jsonl"
    result = {"responses": {}, "frames": [], "assertions": [], "observations": {}}
    env = {"MODE": case["mode"], "GAP": "0.25", "PRE": "0", "FRAME_LOG": str(frame_log),
           "EXIT_MARKER": str(directory / "host-exited.marker"), "SUBMIT_WAIT_MS": "250"}
    start_ack = Path(frame_dir.name) / "message-start.ack" if case["name"] == "partial_err" else None
    if start_ack is not None:
        env["MESSAGE_START_ACK"] = str(start_ack)
    if case.get("done_override"):
        env["DONE_OVERRIDE"] = "1"
    if "initial_signature" in case:
        env["INITIAL_SIGNATURE"] = case["initial_signature"]
    if case.get("error_gap"):
        env["ERROR_GAP"] = str(case["error_gap"])
    if case.get("header_gap"):
        # fake-cli 的 PRE 位于 response_headers 之后、job_error 之前。
        env["PRE"] = str(case["header_gap"])
    # 所有操作共享截止时间；子请求不允许各自重新获得完整 timeout。
    deadline = time.monotonic() + timeout
    def left():
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError("内核用例超过总时间限制")
        return remaining
    try:
        with KernelProcess(binary, fake_cli, directory, slots=case.get("slots", 2), env=env) as kernel:
            wait_frames(frame_log, lambda fs: frame_count(fs, "cli_to_kernel", "slot_ready") >= case.get("slots", 2), deadline)
            def on_event(event):
                if start_ack is not None and event["event"] == "message_start":
                    start_ack.write_text("delivered\n", encoding="utf-8")
            def send(req, headers=None):
                return kernel.request("POST", "/internal/v1/messages", req, headers=headers, timeout=left(), on_event=on_event)
            operation = case.get("operation", "simple")
            if operation == "bad_auth":
                result["responses"]["main"] = send(envelope(case), {"X-Internal-Token": "wrong-offline-token", "X-Kin-Internal-Token": "wrong-offline-token"})
                if result["responses"]["main"]["status"] != 401:
                    result["assertions"].append("错误内部 token 未被 401 拒绝")
            elif operation == "bad_envelope":
                result["responses"]["main"] = send({"body": None, "stream": True})
                if result["responses"]["main"]["status"] != 400:
                    result["assertions"].append("非法 envelope 未被 400 拒绝")
            elif operation == "concurrent":
                with ThreadPoolExecutor(max_workers=2) as pool:
                    futures = [pool.submit(send, envelope(case, "concurrent-0"))]
                    wait_frames(frame_log, lambda fs: frame_count(fs, "kernel_to_cli", "job_start") >= 1, deadline)
                    futures.append(pool.submit(send, envelope(case, "concurrent-1")))
                    frames = wait_frames(frame_log, lambda fs: frame_count(fs, "kernel_to_cli", "job_start") >= 2, deadline)
                    starts = [x["at"] for x in frames if x["direction"] == "kernel_to_cli" and x["frame"].get("type") == "job_start"]
                    if max(starts) - min(starts) >= 1:
                        result["assertions"].append("两个槽位没有在 1 秒内并发启动")
                    if len({x["frame"].get("slot_id") for x in frames if x["direction"] == "kernel_to_cli" and x["frame"].get("type") == "job_start"}) != 2:
                        result["assertions"].append("并发任务没有分配到两个不同槽位")
                    for index, future in enumerate(futures):
                        result["responses"][str(index)] = future.result(timeout=left())
                        result["assertions"] += response_assertions(result["responses"][str(index)], case)
            elif operation in ("cancel", "capacity"):
                with ThreadPoolExecutor(max_workers=1) as pool:
                    first = pool.submit(send, envelope(case, "held-request"))
                    wait_frames(frame_log, lambda fs: frame_count(fs, "kernel_to_cli", "job_start") >= 1, deadline)
                    if operation == "capacity":
                        result["responses"]["capacity"] = send(envelope(case, "capacity-request"))
                        if result["responses"]["capacity"]["status"] != 503 or "no_capacity" not in result["responses"]["capacity"]["body"]:
                            result["assertions"].append("单槽占满后请求未返回 503 no_capacity")
                    result["responses"]["cancel"] = kernel.request("POST", "/internal/v1/cancel", {"request_id": "held-request"}, timeout=left())
                    cancel_body = json.loads(result["responses"]["cancel"]["body"])
                    if result["responses"]["cancel"]["status"] != 200 or cancel_body.get("cancelled") is not True:
                        result["assertions"].append("显式取消未命中运行中任务")
                    result["responses"]["held"] = first.result(timeout=left())
                    wait_frames(frame_log, lambda fs: frame_count(fs, "cli_to_kernel", "cancel_ack") >= 1, deadline)
                result["responses"]["recovery"] = send(envelope({**case, "mode": "ok"}, "recovery-request", recover=True))
                result["assertions"] += response_assertions(result["responses"]["recovery"], {"mode": "ok"})
            elif operation == "disconnect":
                connection = UnixConnection(kernel.socket, left())
                response = None
                try:
                    raw = json.dumps(envelope(case, "disconnect-request")).encode()
                    connection.request("POST", "/internal/v1/messages", body=raw,
                                       headers={"X-Internal-Token": kernel.token, "Content-Type": "application/json"})
                    response = connection.getresponse()
                    if response.status != 200:
                        result["assertions"].append("客户端断开前没有建立 200 流")
                    wait_frames(frame_log, lambda fs: frame_count(fs, "kernel_to_cli", "job_start") >= 1, deadline)
                finally:
                    if response is not None:
                        response.close()
                    connection.close()
                wait_frames(frame_log, lambda fs: frame_count(fs, "cli_to_kernel", "cancel_ack") >= 1, deadline)
                result["responses"]["recovery"] = send(envelope({**case, "mode": "ok"}, "recovery-request", recover=True))
                result["assertions"] += response_assertions(result["responses"]["recovery"], {"mode": "ok"})
            elif operation == "restart":
                result["responses"]["exited"] = send(envelope(case, "exit-request"))
                if "error" not in result["responses"]["exited"]["body"]:
                    result["assertions"].append("宿主退出没有向当前请求报告错误")
                wait_frames(frame_log, lambda fs: frame_count(fs, "cli_to_kernel", "host_ready") >= 2 and frame_count(fs, "cli_to_kernel", "slot_ready") >= 2, deadline)
                result["responses"]["recovery"] = send(envelope({**case, "mode": "ok"}, "recovery-request", recover=True))
                result["assertions"] += response_assertions(result["responses"]["recovery"], {"mode": "ok"})
                result["observations"]["host_restarted"] = True
            else:
                result["responses"]["main"] = send(envelope(case))
                result["assertions"] += response_assertions(result["responses"]["main"], case)
            if start_ack is not None:
                result["observations"]["message_start_delivered_before_error_burst"] = start_ack.is_file()
                if not start_ack.is_file():
                    result["assertions"].append("快速 partial error 缺少客户端可观测的 message_start 交付屏障")
            initial_ready = case.get("slots", 2)
            ready_count = initial_ready + (0 if operation in ("bad_auth", "bad_envelope") else
                                           2 if operation in ("concurrent", "cancel", "capacity", "disconnect") else
                                           initial_ready + 1 if operation == "restart" else 1)
            result["frames"] = settled_frames(frame_log, lambda fs: frame_count(fs, "cli_to_kernel", "slot_ready") >= ready_count, deadline)
            starts = frame_count(result["frames"], "kernel_to_cli", "job_start")
            expected_starts = 0 if operation in ("bad_auth", "bad_envelope") else (2 if operation in ("concurrent", "cancel", "capacity", "disconnect", "restart") else 1)
            if starts != expected_starts:
                result["assertions"].append(f"job_start 数量应为 {expected_starts}，实际 {starts}")
            if operation in ("cancel", "capacity", "disconnect") and not frame_count(result["frames"], "kernel_to_cli", "cancel"):
                result["assertions"].append("内核未向假 CLI 发送 cancel")
    except Exception as exc:
        result["assertions"].append(type(exc).__name__ + ": " + str(exc))
        result["traceback"] = traceback.format_exc()
        result["frames"] = read_frames(frame_log)
    finally:
        if frame_log.exists():
            (directory / "frames.jsonl").write_text(frame_log.read_text(encoding="utf-8"), encoding="utf-8")
        frame_dir.cleanup()
    save_json(directory / "capture.json", result)
    save_json(directory / "normalized.json", normalize_result(result))
    return result


def run_kernel_layer(upstream_kernel, native_kernel=None, output_dir=None, timeout=30):
    if native_kernel is None and not isinstance(upstream_kernel, (str, Path)):
        args = upstream_kernel
        upstream_kernel, native_kernel, output_dir = args.upstream_kernel, args.native_kernel, args.output_dir
        timeout = getattr(args, "timeout", timeout)
    output = Path(output_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)
    fake_cli = Path(__file__).with_name("fake-cli.py").resolve()
    report = {"layer": "kernel", "status": "PASS", "strict_equivalence": True, "cases": [], "binaries": {},
              "comparison": {"http": "decoded body bytes, status, headers, trailers",
                             "frames": "both directions, job-local order; bijective dynamic IDs",
                             "slow": "at least three deliveries separated by 0.12s and total span >=0.4s"}}
    if os.name == "nt" or not 0 < timeout <= 45:
        report.update(status="BLOCKED", error="需要 Linux Unix socket，且每例 timeout 必须在 (0,45] 秒内")
    for name, binary in (("upstream", upstream_kernel), ("native", native_kernel), ("fake_cli", fake_cli)):
        path = Path(binary).resolve() if binary else None
        if path is None or not path.is_file() or not os.access(path, os.X_OK):
            report.update(status="BLOCKED", error=name + " 缺失或不可执行")
        else:
            report["binaries"][name] = {"path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
    if report["status"] != "BLOCKED":
        for case in cases():
            left = run_one(Path(upstream_kernel).resolve(), case, output / case["name"] / "upstream", fake_cli, timeout)
            right = run_one(Path(native_kernel).resolve(), case, output / case["name"] / "native", fake_cli, timeout)
            lhs, rhs = normalize_result(left), normalize_result(right)
            diff = list(difflib.unified_diff(json.dumps(lhs, ensure_ascii=False, indent=2, sort_keys=True).split("\n"),
                                           json.dumps(rhs, ensure_ascii=False, indent=2, sort_keys=True).split("\n"),
                                           fromfile="upstream", tofile="native", lineterm=""))
            diff_path = output / case["name"] / "diff.txt"
            diff_path.write_text("\n".join(diff) + ("\n" if diff else ""), encoding="utf-8")
            contract_equal = not diff
            scheduling = None
            if case["name"] == "partial_err":
                contract_equal = normalize_result(partial_error_contract(left)) == normalize_result(partial_error_contract(right))
                scheduling = {"policy": "终态抢占仅允许夹具唯一完整 content_block_start 存在或缺席；其他字节严格比较",
                              "upstream_middle": len(left["responses"].get("main", {}).get("events", [])) == 3,
                              "native_middle": len(right["responses"].get("main", {}).get("events", [])) == 3}
            elif case["name"] == "hdr_err":
                contract_equal = normalize_result(header_error_contract(left)) == normalize_result(header_error_contract(right))
                scheduling = {"policy": "终态抢占仅允许夹具原值 response_headers 存在或缺席；error/status/headers/trailers严格比较",
                              "upstream_header_event": len(left["responses"].get("main", {}).get("events", [])) == 2,
                              "native_header_event": len(right["responses"].get("main", {}).get("events", [])) == 2}
            status = "FAIL" if left["assertions"] or right["assertions"] else ("PASS" if contract_equal else "DIFF")
            report["cases"].append({"name": case["name"], "status": status, "upstream_assertions": left["assertions"],
                                    "native_assertions": right["assertions"], "different": bool(diff), "strict_equal": not diff,
                                    "comparison_equal": contract_equal, "scheduling": scheduling, "diff": str(diff_path)})
            if diff:
                report["strict_equivalence"] = False
            if status == "FAIL" or (status == "DIFF" and report["status"] == "PASS"):
                report["status"] = status
    save_json(output / "kernel-report.json", report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream-kernel", required=True)
    parser.add_argument("--native-kernel", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--timeout", type=float, default=30)
    args = parser.parse_args()
    report = run_kernel_layer(args)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
