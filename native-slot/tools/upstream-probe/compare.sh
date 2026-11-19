#!/bin/sh
# 兼容旧入口；正式验收使用 run-local.py 的三层门禁。
set -eu
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
: "${PROD_KERNEL:?请显式指定已校验哈希的上游 kernel，禁止默认使用生产文件}"
: "${NATIVE_KERNEL:?请指定本次构建的原生 kernel}"
: "${PROBE_DIR:?请指定隔离证据目录}"
exec python3 "$HERE/kernel_diff.py" --upstream-kernel "$PROD_KERNEL" \
  --native-kernel "$NATIVE_KERNEL" --output-dir "$PROBE_DIR" --timeout "${PROBE_TIMEOUT:-30}"
