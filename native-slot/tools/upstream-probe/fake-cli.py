#!/usr/bin/python3
"""离线假 CLI：只通过 stdin/stdout 帧通信，绝不访问网络。

MODE 选择响应形状；FRAME_LOG 可记录双向帧；hold 等待取消，exit_once
通过 EXIT_MARKER 在第一次任务时退出，后续宿主用同一路径恢复正常响应。
"""
import json
import os
import sys
import threading
import time

MODE = os.environ.get("MODE", "ok")
PRE = float(os.environ.get("PRE", "0"))
GAP = float(os.environ.get("GAP", "1"))
SLOTS = int(os.environ.get("SLOTS", "2"))
MODEL = "claude-haiku-5-5"

# JSON.stringify leaves these raw; the kernel re-serializes whatever it parsed.
ESCAPES = "<a&b>\u2028\u00e9\u0001\"/"

lock = threading.Lock()
log_lock = threading.Lock()
jobs_lock = threading.Lock()
jobs = {}


def record(direction, frame):
    path = os.environ.get("FRAME_LOG")
    if path:
        with log_lock:
            with open(path, "a", encoding="utf-8") as output:
                output.write(json.dumps({"direction": direction, "at": time.monotonic(),
                                         "frame": frame}, ensure_ascii=False, separators=(",", ":")) + "\n")


def emit(obj):
    with lock:
        record("cli_to_kernel", obj)
        sys.stdout.write(json.dumps(obj, separators=(",", ":")) + "\n")
        sys.stdout.flush()


def message_start():
    return {"type": "message_start", "message": {
        "id": "msg_p", "type": "message", "role": "assistant", "model": MODEL,
        "content": [], "stop_reason": None, "stop_sequence": None,
        "usage": {"input_tokens": 1, "output_tokens": 0}}}


def text_delta(text, **extra):
    delta = {"type": "text_delta", "text": text}
    delta.update(extra)
    return {"type": "content_block_delta", "index": 0, "delta": delta}


def stream_ok(ev, text="ok", extra=None):
    ev(message_start())
    ev({"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}})
    ev(text_delta(text, **(extra or {})))
    ev({"type": "content_block_stop", "index": 0})
    ev({"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence": None},
        "usage": {"output_tokens": 1}})
    ev({"type": "message_stop"})


def job_done(job, slot):
    emit({"type": "job_done", "job_id": job, "slot_id": slot,
          "stop_reason": "end_turn", "usage": {"input_tokens": 1, "output_tokens": 1}})


def error(job, slot, code="upstream_rate_limit", status=429, etype="rate_limit_error",
          message="slow down", **extra):
    frame = {"type": "job_error", "job_id": job, "slot_id": slot, "error": message,
             "code": code, "status": status, "error_type": etype}
    frame.update(extra)
    emit(frame)


def run(job, slot, request, cancelled):
    def ev(event):
        if not cancelled.is_set():
            emit({"type": "stream_event", "job_id": job, "slot_id": slot, "event": event})

    mode = MODE
    if MODE == "hold" and "recover" in json.dumps(request.get("messages", [])):
        mode = "ok"
    if mode == "exit_once":
        marker = os.environ.get("EXIT_MARKER", "")
        if not marker:
            raise RuntimeError("exit_once 必须配置 EXIT_MARKER")
        try:
            with open(marker, "x", encoding="utf-8") as output:
                output.write("exited\n")
        except FileExistsError:
            mode = "ok"
        else:
            os._exit(23)

    if mode in ("hdr_err", "hdr_ok"):
        ev({"type": "response_headers", "headers": {"request-id": "req_fake", "retry-after": "7"}})
    time.sleep(PRE)

    if mode == "hold":
        ev(message_start())
        cancelled.wait(40)
        return
    elif mode in ("tool", "thinking", "cache"):
        start = message_start()
        if mode == "cache":
            start["message"]["usage"].update({"cache_read_input_tokens": 9,
                "cache_creation_input_tokens": 6, "cache_creation": {
                "ephemeral_5m_input_tokens": 2, "ephemeral_1h_input_tokens": 4}})
        ev(start)
        if mode == "tool":
            for index, tool_id in ((0, "toolu_fake_a"), (1, "toolu_fake_b")):
                ev({"type": "content_block_start", "index": index,
                    "content_block": {"type": "tool_use", "id": tool_id, "name": "weather", "input": {}}})
                ev({"type": "content_block_delta", "index": index,
                    "delta": {"type": "input_json_delta", "partial_json": '{"city":"Taipei","n":1}'}})
                ev({"type": "content_block_stop", "index": index})
        elif mode == "thinking":
            block = {"type": "thinking", "thinking": ""}
            if "INITIAL_SIGNATURE" in os.environ:
                block["signature"] = os.environ["INITIAL_SIGNATURE"]
            ev({"type": "content_block_start", "index": 0, "content_block": block})
            ev({"type": "content_block_delta", "index": 0, "delta": {"type": "thinking_delta", "thinking": "offline thought"}})
            ev({"type": "content_block_delta", "index": 0, "delta": {"type": "signature_delta", "signature": "offline-signature"}})
            ev({"type": "content_block_stop", "index": 0})
        else:
            ev({"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}})
            ev(text_delta("cached"))
            ev({"type": "content_block_stop", "index": 0})
        ev({"type": "message_delta", "delta": {"stop_reason": "tool_use" if mode == "tool" else "end_turn", "stop_sequence": None}, "usage": {"output_tokens": 2}})
        ev({"type": "message_stop"})
        if os.environ.get("DONE_OVERRIDE") == "1":
            job_done(job, slot)
        else:
            # 真实 v1.3.205 runner 使用空终结字段，内核回退到流累计。
            emit({"type": "job_done", "job_id": job, "slot_id": slot, "stop_reason": "", "usage": {}})
    elif mode == "full_err":
        error(job, slot, retry_after="7", upstream_code="up_x", request_id="req_fake")
    elif mode == "bare_err":
        error(job, slot, code="upstream_invalid_request", status=400,
              etype="invalid_request_error", message="bad")
    elif mode == "err":
        error(job, slot, retry_after="7", request_id="req_fake")
    elif mode == "hdr_err":
        error(job, slot)
    elif mode == "empty":
        emit({"type": "job_done", "job_id": job, "slot_id": slot, "stop_reason": "", "usage": {}})
    elif mode == "nostop":
        ev(message_start())
        emit({"type": "job_done", "job_id": job, "slot_id": slot, "stop_reason": "", "usage": {}})
    elif mode == "nostop_delta":
        start = message_start()
        start["message"]["usage"] = {"input_tokens": 1, "output_tokens": 0,
                                     "cache_creation": {"ephemeral_5m_input_tokens": 0}}
        ev(start)
        ev({"type": "message_delta", "delta": {"stop_reason": "max_tokens", "stop_sequence": None},
            "usage": {"output_tokens": 3}})
        emit({"type": "job_done", "job_id": job, "slot_id": slot, "stop_reason": "", "usage": {}})
    elif mode == "partial_err":
        ev(message_start())
        ack_path = os.environ.get("MESSAGE_START_ACK")
        if ack_path:
            # HTTP 客户端确认实际解析了前缀后，才制造紧邻终态的排队事件。
            deadline = time.monotonic() + 10
            while not os.path.isfile(ack_path):
                if cancelled.is_set():
                    return
                if time.monotonic() >= deadline:
                    raise TimeoutError("未收到 HTTP message_start 交付确认")
                time.sleep(0.005)
        ev({"type": "content_block_start", "index": 0,
            "content_block": {"type": "text", "text": "<a&b>\u2028\u00e9\u0001", "n": 1.50}})
        time.sleep(float(os.environ.get("ERROR_GAP", "0")))
        error(job, slot, code="upstream_stream_interrupted", status=502,
              etype="api_error", message="conn reset")
    elif mode == "slow_err":
        ev(message_start())
        time.sleep(GAP)
        ev({"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}})
        time.sleep(GAP)
        ev(text_delta("hi"))
        time.sleep(GAP)
        error(job, slot, code="upstream_stream_interrupted", status=502,
              etype="api_error", message="conn reset")
    elif mode == "slow":
        ev(message_start())
        time.sleep(GAP)
        ev({"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}})
        time.sleep(GAP)
        ev(text_delta("hi", x=1.50, y=1e21))
        time.sleep(GAP)
        ev(text_delta("!"))
        time.sleep(GAP)
        ev({"type": "content_block_stop", "index": 0})
        time.sleep(GAP)
        ev({"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence": None},
            "usage": {"output_tokens": 2}})
        ev({"type": "message_stop"})
        emit({"type": "job_done", "job_id": job, "slot_id": slot,
              "stop_reason": "end_turn", "usage": {"input_tokens": 1, "output_tokens": 2}})
    elif mode == "esc":
        stream_ok(ev, text=ESCAPES, extra={"x": 1.50, "y": 1e21})
        job_done(job, slot)
    else:  # ok / hdr_ok
        stream_ok(ev)
        job_done(job, slot)
    if not cancelled.is_set():
        emit({"type": "slot_ready", "slot_id": slot})
    with jobs_lock:
        jobs.pop(job, None)


emit({"type": "host_ready", "protocol_version": 2, "slots": SLOTS, "system_layout": "zero",
      "timezone": "Asia/Taipei",
      "capabilities": ["multi_slot", "native_sse", "stateless", "ping",
                       "classifier_request_context"]})
for i in range(SLOTS):
    emit({"type": "slot_ready", "slot_id": "s%02d" % i})

for line in sys.stdin:
    try:
        msg = json.loads(line)
    except Exception:
        continue
    kind = msg.get("type")
    record("kernel_to_cli", msg)
    if kind == "ping":
        emit({"type": "pong", "nonce": msg.get("nonce")})
    elif kind == "cancel":
        with jobs_lock:
            cancelled = jobs.get(msg.get("job_id"))
            if cancelled:
                cancelled.set()
        emit({"type": "cancel_ack", "job_id": msg.get("job_id"), "slot_id": msg.get("slot_id")})
        emit({"type": "slot_ready", "slot_id": msg.get("slot_id")})
    elif kind == "job_start":
        cancelled = threading.Event()
        with jobs_lock:
            jobs[msg.get("job_id")] = cancelled
        threading.Thread(target=run, args=(msg.get("job_id"), msg.get("slot_id"), msg.get("request", {}), cancelled), daemon=True).start()
