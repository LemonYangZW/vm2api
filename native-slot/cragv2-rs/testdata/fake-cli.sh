#!/bin/sh
# 槽位假 CLI：读 NDJSON `{"type":"user","session_id":…}` 帧，回 `stream_event` + `result`。
#
# 用途：容器内不装 Node 也能做进程级联调（`--fake-cli` 需要 node，这个不需要）。
# 用法（kernel.json）：
#   {"dataplane":"crag","upstream_mode":"slot",
#    "cli_bin":"/bin/sh","cli_args":["testdata/fake-cli.sh"]}
set -eu

while IFS= read -r line; do
    [ -z "$line" ] && continue
    sid=$(printf '%s' "$line" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
    [ -z "$sid" ] && continue
    case "$line" in
        *'"type":"user"'*) ;;
        *) continue ;;
    esac
    printf '{"type":"stream_event","session_id":"%s","event":{"type":"message_start","message":{"id":"msg_fake","type":"message","role":"assistant","model":"claude-opus-5-5","content":[]}}}\n' "$sid"
    printf '{"type":"stream_event","session_id":"%s","event":{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}}\n' "$sid"
    printf '{"type":"stream_event","session_id":"%s","event":{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"pong"}}}\n' "$sid"
    printf '{"type":"stream_event","session_id":"%s","event":{"type":"content_block_stop","index":0}}\n' "$sid"
    printf '{"type":"stream_event","session_id":"%s","event":{"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"input_tokens":3,"output_tokens":1}}}\n' "$sid"
    printf '{"type":"result","subtype":"success","is_error":false,"session_id":"%s","stop_reason":"end_turn","result":"pong","usage":{"input_tokens":3,"output_tokens":1}}\n' "$sid"
done
