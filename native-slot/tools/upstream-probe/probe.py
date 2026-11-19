#!/usr/bin/env python3
"""单请求诊断：HTTP 解块后保留事件到达时间和 trailer，不负责判定 PASS。"""
import json
import os
import sys
from probe_common import message_envelope, unix_request

socket_path, token, label = sys.argv[1:4]
body = message_envelope(os.environ.get("ST", "1") != "0", os.environ.get("DM"))
body["body"]["max_tokens"] = int(os.environ.get("MT", "8192"))
result = unix_request(socket_path, "POST", "/internal/v1/messages", body,
                      {"X-Internal-Token": os.environ.get("TOK", token),
                       "X-Kin-Internal-Token": os.environ.get("TOK", token)}, timeout=30)
print(json.dumps({"label": label, "response": result}, ensure_ascii=False, indent=2))
