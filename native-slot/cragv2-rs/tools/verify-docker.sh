#!/bin/sh
# 容器内验收：cargo test + 进程级冒烟（slot 模式，真 unix socket）。
#
# 用途：Windows 开发机上跑不到 unix socket 分支，这个脚本在 Linux 容器里补齐。
# 运行方式（宿主机）：
#   docker run --rm -v "$PWD/native-slot/cragv2-rs:/src" -w /src \
#     -e CARGO_TARGET_DIR=/tmp/target <rust-image> \
#     sh -c 'tr -d "\r" < tools/verify-docker.sh > /tmp/v.sh && sh /tmp/v.sh'
set -eu

cd "${SRC_DIR:-/src}"

BIN="${CARGO_TARGET_DIR:-target}/release/crag-v2"

if [ "${SKIP_TEST:-0}" = "1" ]; then
    echo "== 1/5 cargo test（跳过 SKIP_TEST=1）=="
else
    echo "== 1/5 cargo test =="
    cargo test 2>&1 | tail -22
fi

echo "== 2/5 release build =="
cargo build --release --quiet

echo "== 3/5 进程冒烟：slot 模式 + unix socket =="
SOCK=/tmp/crag.sock
rm -f "$SOCK"
"$BIN" --config testdata/kernel-slot.json --socket "$SOCK" 2>/tmp/crag.err &
PID=$!
for _ in $(seq 1 50); do
    [ -S "$SOCK" ] && break
    sleep 0.1
done
if [ ! -S "$SOCK" ]; then
    echo "FAIL: socket 未建立"; cat /tmp/crag.err; kill "$PID" 2>/dev/null || true; exit 1
fi

health=$(curl -s --unix-socket "$SOCK" http://crag/internal/health)
echo "health: $health"
echo "$health" | grep -q '"engine":"rust"' || { echo "FAIL: engine"; kill "$PID"; exit 1; }
echo "$health" | grep -q '"hop_mode":"slot"' || { echo "FAIL: hop_mode"; kill "$PID"; exit 1; }
echo "$health" | grep -q '"ready_slots":2' || { echo "FAIL: ready_slots"; kill "$PID"; exit 1; }

models=$(curl -s --unix-socket "$SOCK" http://crag/v1/models)
echo "$models" | grep -q '"claude-opus-5-5"' || { echo "FAIL: models"; kill "$PID"; exit 1; }

stream=$(curl -s --unix-socket "$SOCK" -H 'content-type: application/json' \
    -d '{"request_id":"smoke-stream","stream":true,"body":{"model":"claude-opus-5-5","max_tokens":8,"messages":[{"role":"user","content":"ping"}]}}' \
    http://crag/internal/v1/messages)
echo "$stream" | head -4
echo "$stream" | grep -q 'event: content_block_delta' || { echo "FAIL: sse delta"; kill "$PID"; exit 1; }
echo "$stream" | grep -q 'event: message_stop' || { echo "FAIL: sse stop"; kill "$PID"; exit 1; }

nonstream=$(curl -s --unix-socket "$SOCK" -H 'content-type: application/json' \
    -d '{"request_id":"smoke-json","stream":false,"body":{"model":"claude-opus-5-5","max_tokens":8,"messages":[{"role":"user","content":"ping"}]}}' \
    http://crag/internal/v1/messages)
echo "nonstream: $nonstream"
echo "$nonstream" | grep -q '"text":"pong"' || { echo "FAIL: nonstream body"; kill "$PID"; exit 1; }
echo "$nonstream" | grep -q '"stop_reason":"end_turn"' || { echo "FAIL: stop_reason"; kill "$PID"; exit 1; }

echo "== 4/5 错误路径（slot 模式） =="
# 未知路由 → 404
code=$(curl -s -o /dev/null -w '%{http_code}' --unix-socket "$SOCK" http://crag/nope)
echo "unknown route -> $code"
[ "$code" = "404" ] || { echo "FAIL: 未知路由应 404"; kill "$PID"; exit 1; }

# 取消接口 → 200（直连模式无槽位，也必须是空操作成功）
code=$(curl -s -o /dev/null -w '%{http_code}' --unix-socket "$SOCK"     -X POST -H 'content-type: application/json' -d '{"request_id":"nope"}'     http://crag/internal/v1/cancel)
echo "cancel -> $code"
[ "$code" = "200" ] || { echo "FAIL: cancel 应 200"; kill "$PID"; exit 1; }

# 方法不匹配 → 405
code=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE --unix-socket "$SOCK" http://crag/internal/v1/messages)
echo "delete messages -> $code"
[ "$code" = "405" ] || { echo "FAIL: 方法不匹配应 405"; kill "$PID"; exit 1; }

# 预检只在 direct 分支生效，由 `cargo test --test gateway_direct` 覆盖。
kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true

echo "== 5/5 probe 自检（无凭据必须 fail-closed） =="
cat > /tmp/probe.json <<'JSON'
{"dataplane":"crag","upstream_mode":"direct","upstream_base":"http://127.0.0.1:1",
 "credential_path":"/tmp/definitely-missing-credentials.json"}
JSON
probe_code=0
"$BIN" probe --config /tmp/probe.json > /tmp/probe.out 2>&1 || probe_code=$?
cat /tmp/probe.out
[ "$probe_code" = "1" ] || { echo "FAIL: probe 退出码 $probe_code（期望 1）"; exit 1; }
grep -q 'FAIL. *credential' /tmp/probe.out || { echo "FAIL: 未报 credential"; exit 1; }

echo "== ALL GREEN =="
