#!/usr/bin/env python3
"""在本机 Docker 中固定版本执行三层差分；不连接服务器或真实模型上游。"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tarfile
import urllib.request


ROOT = Path(__file__).resolve().parents[3]


def run(command, **kwargs):
    print("执行: " + " ".join(map(str, command)), flush=True)
    return subprocess.run(list(map(str, command)), check=True, cwd=kwargs.pop("cwd", ROOT), **kwargs)


def output(command):
    return subprocess.check_output(command, cwd=ROOT, text=True, encoding="utf-8").strip()


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream-ref", help="默认取当前 VERSION 对应的 tag，不追随可变 edge/main")
    parser.add_argument("--work-dir", type=Path, help="本次专用临时目录；已有下载和构建会保留")
    args = parser.parse_args()
    ref = args.upstream_ref or "v" + (ROOT / "VERSION").read_text().strip()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    work = (args.work_dir or ROOT / ".tmp" / ("parity-" + stamp)).resolve()
    work.mkdir(parents=True, exist_ok=True)
    commit = output(["gh", "api", "repos/dofastted/vm2api/commits/" + ref, "--jq", ".sha"])
    candidate = output(["git", "rev-parse", "HEAD"])
    archive = work / ("upstream-" + commit + ".tar.gz")
    if not archive.exists():
        request = urllib.request.Request("https://api.github.com/repos/dofastted/vm2api/tarball/" + commit,
                                         headers={"User-Agent": "vm2api-local-parity"})
        with urllib.request.urlopen(request, timeout=45) as response, archive.open("wb") as dest:
            while chunk := response.read(1024 * 1024):
                dest.write(chunk)
    with tarfile.open(archive) as source:
        prefix = source.getnames()[0].split("/")[0]
        upstream = work / "source" / prefix
        if not upstream.exists():
            source.extractall(work / "source", filter="data")
    if sha(upstream / "deploy/payload.json") != sha(ROOT / "deploy/payload.json"):
        raise ValueError("本地 payload pin 与上游指定版本不同；先明确同步范围，不自动改 pin")
    if sha(upstream / "package-lock.json") != sha(ROOT / "package-lock.json"):
        raise ValueError("双方依赖锁不一致，需要分别准备运行时，禁止共用依赖冒充同版")
    run(["node", "scripts/fetch-payload.mjs", "--dest", work / "payload"])
    run(["node", "scripts/fetch-payload.mjs", "--dest", work / "payload", "--check"])
    env = {**os.environ, "GOOS": "linux", "GOARCH": "arm64", "CGO_ENABLED": "0"}
    (work / "native-arm64").mkdir(exist_ok=True)
    run(["go", "build", "-trimpath", "-o", work / "native-arm64", "./cmd/..."],
        cwd=ROOT / "native-slot", env=env, timeout=60)
    api_env = {**os.environ, "GOOS": "linux", "GOARCH": "amd64", "CGO_ENABLED": "0"}
    for side, source in (("upstream", upstream), ("native", ROOT)):
        target = work / (side + "-api")
        target.mkdir(exist_ok=True)
        run(["go", "build", "-trimpath", "-o", target / "kin-api-kernel", "./cmd/kin-api-kernel"],
            cwd=source / "api-kernel", env=api_env, timeout=60)
    run(["docker", "build", "--platform", "linux/amd64", "-t", "vm2api-parity:local", "-f",
         "native-slot/tools/upstream-probe/Dockerfile", "."])
    image = output(["docker", "image", "inspect", "vm2api-parity:local", "--format", "{{.Id}}"])
    name = "vm2api-parity-" + stamp.lower()
    report_dir = "run-" + stamp
    command = ["docker", "run", "--rm", "--name", name, "--network", "none", "--read-only",
               "--tmpfs", "/tmp:rw,exec,size=512m", "--tmpfs", "/repo/node_modules:rw,size=16m",
               "--mount", f"type=bind,src={ROOT},dst=/repo,readonly",
               "--mount", f"type=bind,src={work},dst=/out",
               "--mount", f"type=bind,src={upstream},dst=/upstream,readonly", image,
               "/repo/native-slot/tools/upstream-probe/run_suite.py", "--payload-root", "/out/payload",
               "--native-root", "/out/native-arm64", "--output-dir", "/out/" + report_dir,
               "--manifest", "/repo/deploy/payload.json", "--upstream-ref", ref, "--upstream-commit", commit,
               "--candidate-commit", candidate, "--runtime-image", image,
               "--upstream-api-kernel", "/out/upstream-api/kin-api-kernel",
               "--native-api-kernel", "/out/native-api/kin-api-kernel",
               "--upstream-repo", "/upstream", "--native-repo", "/repo"]
    try:
        result = subprocess.run(command, cwd=ROOT)
    except KeyboardInterrupt:
        subprocess.run(["docker", "stop", "--time", "5", name], cwd=ROOT, check=False)
        raise
    print("证据: " + str(work / report_dir / "report.json"), flush=True)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
