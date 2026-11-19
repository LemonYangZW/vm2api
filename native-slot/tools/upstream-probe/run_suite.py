#!/usr/bin/env python3
"""固定 payload 与原生 ELF 后执行三层离线差分；任一失败均非零退出。"""
import argparse
import hashlib
import importlib
import json
import os
from pathlib import Path
import platform
import shlex
import struct
import subprocess
import sys
import time
import traceback
import unittest

from probe_common import save_json


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def wrapper(path, command):
    path.write_text("#!/bin/sh\nexec " + " ".join(shlex.quote(str(s)) for s in command) + ' "$@"\n', encoding="utf-8")
    path.chmod(0o755)
    return str(path)


def prepare(args, output):
    manifest_path = Path(args.manifest).resolve()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    payload = Path(args.payload_root).resolve()
    native = Path(args.native_root).resolve()
    upstream_repo, native_repo = Path(args.upstream_repo).resolve(), Path(args.native_repo).resolve()
    if digest(upstream_repo / "deploy/payload.json") != digest(manifest_path):
        raise ValueError("实际上游源码中的 payload manifest 与执行基准不一致")
    if digest(upstream_repo / "package-lock.json") != digest(native_repo / "package-lock.json"):
        raise ValueError("双方依赖锁不同，不能共用测试运行时")
    files = []
    for entry in manifest["files"]:
        path = payload / entry["path"]
        if not path.is_file() or path.stat().st_size != entry["size"] or digest(path) != entry["sha256"]:
            raise ValueError("payload 未通过固定大小/SHA-256 校验: " + entry["path"])
        files.append({**entry, "verified": True})
    native_files = []
    expected_machine = {"arm64": 183, "amd64": 62}[args.native_arch]
    for name in ("kin-kernel", "cli-node"):
        path = native / name
        data = path.read_bytes()
        if data[:6] != b"\x7fELF\x02\x01" or struct.unpack_from("<H", data, 18)[0] != expected_machine:
            raise ValueError("原生产物 ELF 架构不符: " + str(path))
        native_files.append({"path": str(path), "sha256": digest(path), "architecture": args.native_arch})
    launcher = output / "launchers"
    launcher.mkdir()
    glibc = payload / "share/wrap-cli/glibc239"
    binaries = {"upstream_kernel": wrapper(launcher / "upstream-kernel",
                   [glibc / "ld-linux-x86-64.so.2", "--library-path", glibc, payload / "bin/kin-kernel"]),
                "upstream_cli": str(payload / "share/wrap-cli/cli-node")}
    for key, name in (("native_kernel", "kin-kernel"), ("native_cli", "cli-node")):
        command = [native / name]
        if args.native_arch == "arm64" and platform.machine() not in ("aarch64", "arm64"):
            import shutil
            qemu = shutil.which("qemu-aarch64-static")
            if not qemu:
                raise ValueError("执行 ARM64 ELF 所需 qemu-aarch64-static 不存在")
            command.insert(0, qemu)
        binaries[key] = wrapper(launcher / key.replace("_", "-"), command)
    provenance = {"upstream_ref": args.upstream_ref, "upstream_commit": args.upstream_commit,
                  "candidate_commit": args.candidate_commit, "candidate_worktree": "包含未提交的原生修复和差分工具；实际源码哈希见下列字段",
                  "manifest_sha256": digest(manifest_path), "manifest": manifest, "payload": files,
                  "native": native_files, "runtime_image": args.runtime_image,
                  "execution_host": platform.platform(), "native_execution": "qemu-user" if len(command) > 1 else "native",
                  "network": "必须由调用方使用 --network none 隔离；仅本地 mock",
                  "source_files": {p.name: digest(p) for p in Path(__file__).parent.glob("*.py")}}
    provenance["api_kernels"] = {}
    for side, path in (("upstream", args.upstream_api_kernel), ("native", args.native_api_kernel)):
        header = Path(path).read_bytes()[:64]
        if header[:6] != b"\x7fELF\x02\x01" or struct.unpack_from("<H", header, 18)[0] != 62:
            raise ValueError("控制面 API kernel 必须为测试运行时的 amd64 ELF: " + path)
        provenance["api_kernels"][side] = {"path": path, "sha256": digest(path), "architecture": "amd64"}
    provenance["control_plane_execution"] = "双方控制面 Node/API kernel 运行于 amd64；槽位原生 kernel/CLI 为 ARM64"
    provenance["sources"] = {}
    for side, source in (("upstream", upstream_repo), ("native", native_repo)):
        provenance["sources"][side] = {"root": str(source), "version": (source / "VERSION").read_text().strip(),
                    "server_sha256": digest(source / "src/server.mjs"),
                    "package_lock_sha256": digest(source / "package-lock.json")}
    provenance["native_go_sources"] = {str(p.relative_to(native_repo)): digest(p)
                   for base in ("native-slot/cmd", "native-slot/internal") for p in (native_repo / base).rglob("*.go")}
    save_json(output / "provenance.json", provenance)
    return binaries, provenance


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("payload-root", "native-root", "output-dir", "manifest", "upstream-ref",
                 "upstream-commit", "candidate-commit", "runtime-image", "upstream-repo", "native-repo"):
        parser.add_argument("--" + name, required=True)
    parser.add_argument("--upstream-api-kernel", required=True)
    parser.add_argument("--native-api-kernel", required=True)
    parser.add_argument("--native-arch", choices=("arm64", "amd64"), default="arm64")
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--layers", default="kernel,cli,integration")
    args = parser.parse_args()
    output = Path(args.output_dir).resolve()
    output.mkdir(parents=True, exist_ok=False)
    report = {"status": "FAIL", "layers": {}, "started_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
              "coverage_limitations": ["不含真实模型上游与生产服务验收。", "ARM64 在 QEMU 下运行时不代表 ARM64 硬件压力验收。"]}
    try:
        if not 0 < args.timeout <= 45:
            raise ValueError("每例超时必须在 0～45 秒之间")
        layers = args.layers.split(",")
        if len(layers) != 3 or set(layers) != {"kernel", "cli", "integration"}:
            raise ValueError("正式门禁必须包含 kernel、cli、integration 各一次；单层诊断请使用对应脚本")
        suite = unittest.defaultTestLoader.discover(str(Path(__file__).parent), pattern="test_*.py")
        checked = unittest.TextTestRunner(verbosity=1).run(suite)
        report["harness_tests"] = {"run": checked.testsRun, "failures": len(checked.failures),
                                   "errors": len(checked.errors), "skipped": len(checked.skipped)}
        if not checked.testsRun or not checked.wasSuccessful() or checked.skipped:
            raise ValueError("差分工具自身检查未完整通过")
        binaries, provenance = prepare(args, output)
        report["provenance"] = provenance
        for layer in layers:
            print("开始 " + layer + " 层", flush=True)
            started = time.monotonic()
            try:
                module = importlib.import_module(layer + "_diff")
                dest = output / layer
                if layer == "cli":
                    result = module.run_cli_layer(binaries["upstream_cli"], binaries["native_cli"], dest, args.timeout)
                    ok = result.get("status") == "PASS"
                elif layer == "kernel":
                    result = module.run_kernel_layer(binaries["upstream_kernel"], binaries["native_kernel"], dest, args.timeout)
                    ok = result.get("status") == "PASS" or result.get("ok") is True
                elif layer == "integration":
                    result = module.run_integration_layer(**binaries, output_dir=dest, timeout=args.timeout,
                                upstream_repo=args.upstream_repo, native_repo=args.native_repo,
                                upstream_api_kernel=args.upstream_api_kernel, native_api_kernel=args.native_api_kernel)
                    ok = result.get("ok") is True or result.get("status") == "PASS"
                else:
                    raise ValueError("未知层: " + layer)
                report["layers"][layer] = {"ok": ok, "elapsed": round(time.monotonic() - started, 3), "report": result}
            except Exception as error:
                report["layers"][layer] = {"ok": False, "error": str(error), "traceback": traceback.format_exc()}
            save_json(output / "report.json", report)
            print(layer + ": " + ("PASS" if report["layers"][layer]["ok"] else "FAIL/DIFF"), flush=True)
        required = {"kernel", "cli", "integration"}
        report["status"] = "PASS" if set(report["layers"]) == required and all(v["ok"] for v in report["layers"].values()) else "FAIL"
        current_tools = {p.name: digest(p) for p in Path(__file__).parent.glob("*.py")}
        report["tool_sources_unchanged"] = current_tools == provenance["source_files"]
        current_go = {str(p.relative_to(Path(args.native_repo))): digest(p)
                      for base in ("native-slot/cmd", "native-slot/internal")
                      for p in (Path(args.native_repo) / base).rglob("*.go")}
        report["native_sources_unchanged"] = current_go == provenance["native_go_sources"]
        if not report["tool_sources_unchanged"] or not report["native_sources_unchanged"]:
            report.update(status="FAIL", error="执行期间工具或原生源码发生变化，必须用固定源码重新比对")
        report["profile"] = "shared_contract"
        report["strict_equivalence"] = report["status"] == "PASS" and all(
            layer["report"].get("strict_equivalence", True) for layer in report["layers"].values())
    except Exception as error:
        report.update(status="FAIL", error=str(error), traceback=traceback.format_exc())
    report["finished_at_utc"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    save_json(output / "report.json", report)
    print("三层差分: " + report["status"] + "，证据 " + str(output / "report.json"), flush=True)
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
