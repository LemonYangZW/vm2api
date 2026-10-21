#!/usr/bin/python3
"""Fake CLI with one slot that holds each job for HOLD_SECS.

Used to measure what a full slot does to the next request (queueing vs 503).
No network, no credentials.

Env: HOLD_SECS (default 60)
"""
import json
import os
import sys
import threading
import time

HOLD = float(os.environ.get("HOLD_SECS", "60"))
lock = threading.Lock()
cancelled = set()


def emit(obj):
    with lock:
        sys.stdout.write(json.dumps(obj, separators=(",", ":")) + "\n")
        sys.stdout.flush()


def run(job, slot):
    end = time.time() + HOLD
    while time.time() < end:
        if job in cancelled:
            return
        time.sleep(0.05)
    ev = lambda event: emit({"type": "stream_event", "job_id": job, "slot_id": slot, "event": event})
    ev({"type": "message_start", "message": {"id": "msg_p", "type": "message", "role": "assistant",
        "model": "claude-haiku-5-5", "content": [], "stop_reason": None, "stop_sequence": None,
        "usage": {"input_tokens": 1, "output_tokens": 0}}})
    ev({"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}})
    ev({"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "ok"}})
    ev({"type": "content_block_stop", "index": 0})
    ev({"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence": None},
        "usage": {"output_tokens": 1}})
    ev({"type": "message_stop"})
    emit({"type": "job_done", "job_id": job, "slot_id": slot, "stop_reason": "end_turn",
          "usage": {"input_tokens": 1, "output_tokens": 1}})
    emit({"type": "slot_ready", "slot_id": slot})


emit({"type": "host_ready", "protocol_version": 2, "slots": 1, "system_layout": "zero",
      "timezone": "Asia/Taipei",
      "capabilities": ["multi_slot", "native_sse", "stateless", "ping", "classifier_request_context"]})
emit({"type": "slot_ready", "slot_id": "s00"})

for line in sys.stdin:
    try:
        msg = json.loads(line)
    except Exception:
        continue
    kind = msg.get("type")
    if kind == "ping":
        emit({"type": "pong", "nonce": msg.get("nonce")})
    elif kind == "cancel":
        cancelled.add(msg.get("job_id"))
        emit({"type": "cancel_ack", "job_id": msg.get("job_id"), "slot_id": msg.get("slot_id")})
        emit({"type": "slot_ready", "slot_id": msg.get("slot_id")})
    elif kind == "job_start":
        threading.Thread(target=run, args=(msg.get("job_id"), msg.get("slot_id")), daemon=True).start()
