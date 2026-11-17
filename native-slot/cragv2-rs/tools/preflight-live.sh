#!/bin/sh
# 真机前自检（在槽位容器内跑）：凭据可读 → 代理隧道 → TLS(ALPN h2) → 非推理端点。
# 不发任何推理请求；退出码 0/1/2/3/4 对应 通过/凭据/代理/TLS/端点。
#
# 用法：
#   sh tools/preflight-live.sh /etc/kin/kernel.json
#   KIN_KERNEL_CONFIG=/run/kin/kernel.json sh tools/preflight-live.sh
set -eu
cd "${SRC_DIR:-/src}"
BIN="${CARGO_TARGET_DIR:-target}/release/crag-v2"
CFG="${1:-${KIN_KERNEL_CONFIG:-/etc/kin/kernel.json}}"

if [ ! -x "$BIN" ]; then
    echo "[preflight] 未找到 $BIN，尝试构建"
    cargo build --release --quiet
fi

echo "[preflight] config=$CFG（probe 只做握手与非推理 GET，不发推理请求）"
"$BIN" probe --config "$CFG"
