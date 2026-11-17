#!/bin/sh
# 静态 musl 构建。必须用独立 CARGO_TARGET_DIR：
# 宿主(glibc)与容器(musl)共用 target/ 会混入不兼容对象，
# 产物能链接但一启动就 SIGSEGV（实测 --version 直接崩）。
set -eu
here=$(cd "$(dirname "$0")/.." && pwd)
docker run --rm -v "$here:/src" -w /src -e CARGO_TARGET_DIR=/src/target-musl rust:1-alpine \
  sh -c 'apk add -q musl-dev gcc && cargo build --release && ls -la /src/target-musl/release/crag-v2'
