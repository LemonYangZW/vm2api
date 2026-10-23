#!/usr/bin/env python3
"""build-arm64-node.py: 为 ARM64 Linux 环境构建原生 cc-node / cli-node 单文件二进制。

该工具从已提取的 JS bundle（包含官方 Claude Code 与 src/kin 补丁）中剥离 bunfs 头，
并使用本机已安装的 bun 编译器直接交叉编译为 Linux aarch64 (ARM64) ELF 执行程序。
产出的二进制同时支持：
1. Crag 模式：--single-process-subagents --max-procs N --continuous-tool-loop
2. Wrap 模式：CLAUDE_CODE_NATIVE_SLOTS 环境变量驱动的 20 slot native_messages 循环。
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC_JS = ROOT / "reverse" / "kin-kernel" / "work" / "cli-node.js"
OUT_DIR = ROOT / "dist" / "linux-arm64"


def main():
    if not shutil.which("bun"):
        print("错误: 本机未安装 bun (https://bun.sh)，无法执行编译", file=sys.stderr)
        sys.exit(1)

    if not SRC_JS.exists():
        print(f"错误: 找不到补丁 JS 源码: {SRC_JS}", file=sys.stderr)
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    temp_clean_js = OUT_DIR / ".clean-bundle.js"
    out_bin = OUT_DIR / "cc-node"

    print(f"[*] 读取 JS bundle: {SRC_JS}")
    with open(SRC_JS, "rb") as f:
        data = f.read()

    idx = data.find(b"// @bun")
    if idx == -1:
        idx = data.find(b"var __create")
    if idx == -1:
        print("错误: 无法定位 JS 有效代码起始点", file=sys.stderr)
        sys.exit(1)

    clean_js = data[idx:]
    print(f"[*] 剥离 Bunfs 文件头，提取纯净 JS (长度: {len(clean_js)} 字节)")
    with open(temp_clean_js, "wb") as f:
        f.write(clean_js)

    print(f"[*] 使用 bun 交叉编译为 Linux ARM64 (AArch64) ELF: {out_bin}")
    cmd = [
        "bun",
        "build",
        str(temp_clean_js),
        "--compile",
        "--target=bun-linux-arm64",
        f"--outfile={out_bin}",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"编译失败:\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}", file=sys.stderr)
        sys.exit(res.returncode)

    if temp_clean_js.exists():
        temp_clean_js.unlink()

    print(f"[+] 编译成功！产物位置: {out_bin} (大小: {out_bin.stat().st_size} 字节)")


if __name__ == "__main__":
    main()
