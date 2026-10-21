#!/usr/bin/env python3
"""展示 probe.py 的诊断 JSON；保留时序，禁止用两份相等代替用例断言。"""
import json
import sys
from probe_common import canonical_response

if __name__ == "__main__":
    record = json.load(sys.stdin)
    response = record.get("response", record)
    normalized = canonical_response(response)
    normalized["event_arrival_seconds"] = [e["at"] for e in response["events"]]
    normalized["header_at"] = response["header_at"]
    normalized["total"] = response["total"]
    print(json.dumps(normalized, ensure_ascii=False, indent=2))
