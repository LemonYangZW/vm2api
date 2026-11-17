#!/bin/sh
# 真机验收（在目标机本地跑，不经过控制面）：
#   1) 从 sing-box 配置取 vm2api 的 mixed 代理凭据（127.0.0.1:20884），生成 0600 的 kernel.json
#   2) 从指定槽位容器复制凭据到 tmpfs（用完即删）
#   3) 起我们的内核（direct 模式，unix socket）
#   4) 用 live-cc-request.py 发**一条**真实 CC 形态请求
#   5) 无论成败都清理：杀内核、删 socket / 凭据 / 含密码配置
#
# 用法：
#   sh tools/live-verify.sh --bin /path/crag-v2 --creds-from kin-03 [--client tools/live-cc-request.py]
set -eu

BIN=""
CREDS_FROM=""
CLIENT="$(dirname "$0")/live-cc-request.py"
EXTRA=""   # 其余参数透传给客户端（如 --dump / --model / --max-tokens）
SKIP_PROBE=0
while [ $# -gt 0 ]; do
    case "$1" in
        --bin) BIN="$2"; shift 2 ;;
        --creds-from) CREDS_FROM="$2"; shift 2 ;;
        --client) CLIENT="$2"; shift 2 ;;
        --skip-probe) SKIP_PROBE=1; shift ;;
        *) EXTRA="$EXTRA $1"; shift ;;
    esac
done
[ -n "$BIN" ] && [ -x "$BIN" ] || { echo "需要 --bin <可执行 crag-v2>"; exit 2; }
[ -n "$CREDS_FROM" ] || { echo "需要 --creds-from <槽位容器名>"; exit 2; }

D=/tmp/cragv2-probe
SOCK="$D/kernel.sock"
CREDS=/dev/shm/cragv2-creds.json

cleanup() {
    [ -n "${KPID:-}" ] && kill "$KPID" 2>/dev/null || true
    rm -f "$CREDS" "$D/kernel.json" "$SOCK"
    echo "[cleanup] 已删除凭据 / 含密码配置 / socket"
}
trap cleanup EXIT INT TERM

umask 077
mkdir -p "$D"
rm -f "$SOCK"

python3 - "$D/kernel.json" <<'PY'
import json, sys, urllib.parse
path = sys.argv[1]
cfg_src = "/etc/sing-box/30-vm2api.json"
inbound = [x for x in json.load(open(cfg_src))["inbounds"] if x.get("listen_port") == 20884][0]
user = inbound["users"][0]
cfg = {
    "dataplane": "crag",
    "slots_per_worker": 2,
    "upstream_mode": "direct",
    "upstream_base": "https://api.anthropic.com",
    "credential_path": "/dev/shm/cragv2-creds.json",
    "oauth_token_url": "https://platform.claude.com/v1/oauth/token",
    "proxy_url": "socks5h://%s:%s@127.0.0.1:20884"
    % (urllib.parse.quote(user["username"], safe=""), urllib.parse.quote(user["password"], safe="")),
    "proxy_required": True,
}
json.dump(cfg, open(path, "w"))
PY
chmod 600 "$D/kernel.json"

docker cp "$CREDS_FROM:/home/kincli/.claude/credentials.json" "$CREDS"
chmod 600 "$CREDS"

if [ "$SKIP_PROBE" = "0" ]; then
    echo "== probe（凭据/代理/TLS/非推理端点）=="
    "$BIN" probe --config "$D/kernel.json" || echo "(probe 未全绿，继续主请求)"
else
    echo "== 跳过 probe（避免多余的 /v1/models 调用）=="
fi

echo "== 启动内核 =="
"$BIN" --config "$D/kernel.json" --socket "$SOCK" 2>"$D/kernel.err" &
KPID=$!
for _ in $(seq 1 60); do [ -S "$SOCK" ] && break; sleep 0.2; done
[ -S "$SOCK" ] || { echo "FAIL: socket 未建立"; cat "$D/kernel.err"; exit 1; }
head -2 "$D/kernel.err"

echo "== 真实 CC 形态请求（stream=true，max_tokens=128000，带 tools/system/thinking）=="
# shellcheck disable=SC2086
python3 "$CLIENT" --socket "$SOCK" $EXTRA
