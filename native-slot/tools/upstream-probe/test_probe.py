#!/usr/bin/env python3
"""验证差分工具不会合并不同 ID、丢掉 trailer 或误判传输切块。"""
import http.client
import json
import socket
import threading
import time
import unittest

from probe_common import IDMap, TrailerResponse, canonical_response, read_response
from cli_cch import strip_json_whitespace, verify, xxh64
from kernel_diff import (header_error_assertions, header_error_contract, header_error_middle,
                         partial_error_assertions, partial_error_contract, partial_error_middle)


def receive(raw_parts):
    listener = socket.socket()
    listener.bind(("127.0.0.1", 0))
    listener.listen(1)
    port = listener.getsockname()[1]
    def server():
        try:
            conn, _ = listener.accept()
            with conn:
                conn.recv(65536)
                for delay, chunk in raw_parts:
                    time.sleep(delay)
                    conn.sendall(chunk)
        finally:
            listener.close()
    worker = threading.Thread(target=server)
    worker.start()
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
    connection.response_class = TrailerResponse
    started = time.monotonic()
    try:
        connection.request("GET", "/")
        return read_response(connection, started, 2)
    finally:
        connection.close()
        worker.join(timeout=2)


class ProbeTests(unittest.TestCase):
    def test_on_event_runs_before_response_finishes(self):
        listener = socket.socket()
        listener.bind(("127.0.0.1", 0))
        listener.listen(1)
        observed = threading.Event()
        released, errors, callbacks = [], [], []
        def chunk(event):
            data = ("event: " + event + "\ndata: {}\n\n").encode()
            return format(len(data), "x").encode() + b"\r\n" + data + b"\r\n"
        def server():
            try:
                conn, _ = listener.accept()
                with conn:
                    conn.recv(65536)
                    conn.sendall(b"HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nTransfer-Encoding: chunked\r\n\r\n" + chunk("message_start"))
                    if not observed.wait(1.5):
                        errors.append("回调未在响应结束前确认起始事件")
                        return
                    released.append(True)
                    conn.sendall(chunk("error") + b"0\r\n\r\n")
            except Exception as exc:
                errors.append(str(exc))
            finally:
                listener.close()
        worker = threading.Thread(target=server)
        worker.start()
        connection = http.client.HTTPConnection("127.0.0.1", listener.getsockname()[1], timeout=2)
        connection.response_class = TrailerResponse
        def callback(event):
            callbacks.append(event["event"])
            if event["event"] == "message_start":
                observed.set()
        try:
            connection.request("GET", "/")
            response = read_response(connection, time.monotonic(), 2, on_event=callback)
        finally:
            connection.close()
            worker.join(timeout=2)
        self.assertEqual(errors, [])
        self.assertEqual(released, [True])
        self.assertEqual(callbacks, ["message_start", "error"])
        self.assertEqual([event["event"] for event in response["events"]], callbacks)

    def test_fast_header_error_policy_rejects_header_changes(self):
        header = {"event": "response_headers", "data": header_error_middle().split("data: ", 1)[1][:-2], "at": 0}
        last = {"event": "error", "data": "{}", "at": 0}
        def response(events):
            return {"events": events, "body": "".join("event: " + e["event"] + "\ndata: " + e["data"] + "\n\n" for e in events)}
        present, absent = response([header, last]), response([last])
        self.assertFalse(header_error_assertions(present, True))
        self.assertFalse(header_error_assertions(absent, False))
        self.assertTrue(header_error_assertions(absent, True))
        self.assertEqual(header_error_contract({"responses": {"main": present}})["responses"]["main"]["body"], absent["body"])
        for source, replacement in (("req_fake", "req_changed"), ('"7"', '"8"'), ("retry-after", "other-header")):
            changed = {**header, "data": header["data"].replace(source, replacement)}
            mutated = response([changed, last])
            self.assertTrue(header_error_assertions(mutated, False))
            self.assertEqual(header_error_contract({"responses": {"main": mutated}})["responses"]["main"]["body"], mutated["body"])
        self.assertTrue(header_error_assertions(response([header, header, last]), False))

    def test_fast_error_policy_only_allows_exact_fixture_middle(self):
        first = {"event": "message_start", "data": "{}", "at": 0}
        middle = {"event": "content_block_start", "data": partial_error_middle().split("data: ", 1)[1][:-2], "at": 0}
        last = {"event": "error", "data": "{}", "at": 0}
        def response(events):
            return {"events": events, "body": "".join("event: " + e["event"] + "\ndata: " + e["data"] + "\n\n" for e in events)}
        with_middle = response([first, middle, last])
        without = response([first, last])
        self.assertFalse(partial_error_assertions(with_middle, False))
        self.assertFalse(partial_error_assertions(without, False))
        self.assertTrue(partial_error_assertions(without, True))
        self.assertEqual(partial_error_contract({"responses": {"main": with_middle}})["responses"]["main"]["body"], without["body"])
        changed = {**middle, "data": middle["data"].replace("<a&b>", "changed")}
        self.assertTrue(partial_error_assertions(response([first, changed, last]), False))
        self.assertTrue(partial_error_assertions(response([first, middle, middle, last]), False))

    def test_json_whitespace_preserves_wire_values_and_key_order(self):
        raw = ' { "z" : 1.00, "a" : "a b\\t\\u0020\\\"c", "n" : 1e+02 }\n'
        expected = '{"z":1.00,"a":"a b\\t\\u0020\\\"c","n":1e+02}'
        self.assertEqual(strip_json_whitespace(raw), expected)
        self.assertNotEqual(strip_json_whitespace(raw), json.dumps(json.loads(raw), separators=(",", ":")))

    def test_xxh64_public_vectors(self):
        self.assertEqual(xxh64(b"", 0), 0xEF46DB3751D8E999)
        self.assertEqual(xxh64(b"hello", 0), 0x26C7827D889F6DA3)

    def test_billing_header_without_cch_fails(self):
        self.assertFalse(verify('{"system":[{"text":"x-anthropic-billing-header: cc_version=1;"}]}')["valid"])

    def test_chunk_boundaries_are_transport(self):
        header = b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n"
        a = receive([(0, header + b"4\r\ntest\r\n0\r\nX-Terminal-State: verified\r\n\r\n")])
        b = receive([(0, header + b"2\r\nte\r\n2\r\nst\r\n0\r\nx-terminal-state: verified\r\n\r\n")])
        self.assertEqual(canonical_response(a), canonical_response(b))
        self.assertEqual(a["trailers"], [["x-terminal-state", "verified"]])

    def test_distinct_ids_and_references_remain_distinct(self):
        a = IDMap().text('{"id":"toolu_A","next":{"id":"toolu_B","tool_use_id":"toolu_A"}}')
        b = IDMap().text('{"id":"toolu_A","next":{"id":"toolu_A","tool_use_id":"toolu_A"}}')
        self.assertNotEqual(a, b)
        parsed = json.loads(a)
        self.assertEqual(parsed["id"], parsed["next"]["tool_use_id"])

    def test_id_like_user_text_is_untouched(self):
        value = '{"text":"toolu_A msg_123"}'
        self.assertEqual(IDMap().text(value), value)

    def test_status_and_trailer_must_differ(self):
        base = {"status": 200, "headers": [], "body": "{}", "trailers": [["x-terminal-state", "verified"]]}
        other = {**base, "status": 401}
        self.assertNotEqual(canonical_response(base), canonical_response(other))
        other = {**base, "trailers": [["x-terminal-state", "incomplete"]]}
        self.assertNotEqual(canonical_response(base), canonical_response(other))

    def test_stream_arrival_times_are_kept(self):
        event = b"event: message_start\ndata: {}\n\n"
        chunk = format(len(event), "x").encode() + b"\r\n" + event + b"\r\n"
        response = receive([(0, b"HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nTransfer-Encoding: chunked\r\n\r\n" + chunk),
                            (0.15, chunk + b"0\r\n\r\n")])
        self.assertEqual(len(response["events"]), 2)
        self.assertGreater(response["events"][1]["at"] - response["events"][0]["at"], 0.1)

    def test_truncated_content_length_is_failure(self):
        with self.assertRaises(ValueError):
            receive([(0, b"HTTP/1.1 200 OK\r\nContent-Length: 9\r\n\r\n{}")])


if __name__ == "__main__":
    unittest.main()
