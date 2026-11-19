#!/bin/sh
# 重压缩 wrap CLI 的发布门禁。
#
# 上游跟踪的主线是「换 payload pin → 重新重压缩」，所以每次出产物都必须证明它与同一 pin
# 的现网 cli-node 行为逐字节一致；只看 `--version` 不够 —— bun 1.4.x 那次就是
# `--version` 正常、槽位路径全挂（详见 native-slot/docs/ARM_WRAP_CLI_REPACK.md）。
#
# 用法（在能执行两侧二进制的机器上跑；另一种架构靠 binfmt/qemu）：
#   native-slot/tools/repack-gate.sh [上游 amd64 cli-node] [我们的 arm64 产物]
#
# 默认：上游 share/wrap-cli/cli-node（payload pin 的那份 amd64），
#       产物 dist/linux-arm64/cli-node-wrap
# 退出码：0 = 19 例全 PASS；1 = 有差异或环境不可跑。
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
upstream=${1:-$root/share/wrap-cli/cli-node}
native=${2:-$root/dist/linux-arm64/cli-node-wrap}
out=${OUT:-$root/.tmp/repack-gate}

for f in "$upstream" "$native"; do
  [ -f "$f" ] || { echo "缺少二进制: $f" >&2; exit 1; }
  [ -x "$f" ] || { echo "不可执行: $f" >&2; exit 1; }
done

printf '上游: %s\n' "$upstream"
printf '产物: %s\n' "$native"

# 版本串必须一致（官方 --version 与原生/重压缩实现都只依赖这一条早退分支）。
uv=$("$upstream" --version 2>&1 | head -1)
nv=$("$native" --version 2>&1 | head -1)
printf 'version: 上游=%s 产物=%s\n' "$uv" "$nv"
[ "$uv" = "$nv" ] || { echo "版本串不一致" >&2; exit 1; }

mkdir -p "$out"
python3 "$root/native-slot/tools/upstream-probe/cli_diff.py" \
  --upstream-cli "$upstream" \
  --native-cli "$native" \
  --output-dir "$out" > "$out/report.json"

python3 - "$out/report.json" <<'PY'
import json, sys
text = open(sys.argv[1], encoding="utf-8").read()
report = json.loads(text[text.index("{"):])
bad = [c["name"] for c in report["cases"] if c["status"] != "PASS"]
total = len(report["cases"])
print(f"cli_diff: {total - len(bad)}/{total} PASS")
if bad:
    print("失败用例: " + ", ".join(bad), file=sys.stderr)
    sys.exit(1)
print(f"证据: {sys.argv[1]}")
PY
