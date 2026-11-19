#!/bin/sh
# 单请求诊断配置：不读取 /run/kin、生产凭据或生产 socket。
set -eu
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
: "${1:?用法: setup.sh <新的隔离目录>}"
python3 - "$1" "$HERE" <<'PY'
import json
from pathlib import Path
import sys
root = Path(sys.argv[1]).resolve()
root.mkdir(parents=True, exist_ok=False)
config = {"vm_id": "offline-probe", "socket_path": str(root / "k.sock"),
          "internal_token": "probe-token", "claude_bin": str(Path(sys.argv[2]) / "fake-cli.py"),
          "credential_path": str(root / "credentials.json"), "slots_per_worker": 2,
          "provider": "local_cli", "system_layout": "zero", "timezone": "Asia/Taipei",
          "test_endpoints": True, "anthropic_base_url": "http://127.0.0.1:9",
          "oauth_token_url": "http://127.0.0.1:9/oauth/token"}
for name, value in (("kernel.json", config), ("credentials.json", {"claudeAiOauth": {
        "accessToken": "offline-dummy", "expiresAt": 4102444800000, "scopes": ["user:inference"]}})):
    path = root / name
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    path.chmod(0o600)
print(root / "kernel.json")
PY
