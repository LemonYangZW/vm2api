// @bun
import {
  init_registry,
  registerWindowsTerminalBackend
} from "./chunk-92frfsdm.js";
import"./chunk-14p6wvsq.js";
import"./chunk-sndpqnmg.js";
import"./chunk-5w7gsjdj.js";
import"./chunk-28jd8qjx.js";
import"./chunk-ptxteaeh.js";
import"./chunk-hkv7c3s6.js";
import"./chunk-f40jvwgw.js";
import"./chunk-w9t7xj87.js";
import"./chunk-xah6e91t.js";
import"./chunk-qvq9z8k4.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-0rhrpnpv.js";
import"./chunk-wgwq4gvd.js";
import"./chunk-djt39ze3.js";
import"./chunk-4x9pek6a.js";
import"./chunk-71sdcaq6.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-4rer68y0.js";
import"./chunk-f2rhkq3t.js";
import"./chunk-5cf3czgf.js";
import"./chunk-bhgvey4s.js";
import"./chunk-xp6v07f0.js";
import"./chunk-ffq9eh6d.js";
import"./chunk-kbkxsgv3.js";
import"./chunk-24kv69g3.js";
import"./chunk-2vk6e88k.js";
import"./chunk-n1j46ncq.js";
import"./chunk-hdtp7tn1.js";
import"./chunk-jt482g7x.js";
import"./chunk-4spgkgr3.js";
import"./chunk-8wzca1dh.js";
import"./chunk-833fsr7s.js";
import"./chunk-2m7k0qdy.js";
import"./chunk-60fkafk2.js";
import"./chunk-mt660rpv.js";
import"./chunk-7b68gcqs.js";
import"./chunk-q4dg9ftz.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-nde5ym6a.js";
import"./chunk-a4q88q6t.js";
import"./chunk-1d7prqr7.js";
import"./chunk-nfc2mwg3.js";
import"./chunk-c40ryser.js";
import"./chunk-qw03ehq0.js";
import"./chunk-1qgb1568.js";
import {
  init_detection,
  isInWindowsTerminal
} from "./chunk-0jw2cfy8.js";
import"./chunk-935nrvdb.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-w6cgk6nk.js";
import"./chunk-hqxp6b72.js";
import"./chunk-2ehn4hjt.js";
import"./chunk-zymr6ztr.js";
import"./chunk-w5hnghah.js";
import"./chunk-vdz79ezt.js";
import"./chunk-msarpzkm.js";
import"./chunk-s76nvx50.js";
import"./chunk-gb0km2ev.js";
import"./chunk-ghhmj79c.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-rwny7j7h.js";
import"./chunk-epvbnq43.js";
import"./chunk-h7cy00tf.js";
import"./chunk-srzb9n7s.js";
import"./chunk-6tzyv21c.js";
import"./chunk-8kf8h7xf.js";
import"./chunk-bgan4cpf.js";
import"./chunk-jmv7k0jn.js";
import {
  getPlatform,
  init_platform
} from "./chunk-psygyacq.js";
import"./chunk-e2d0hkcr.js";
import"./chunk-g2931ep0.js";
import"./chunk-vwenx8ke.js";
import"./chunk-kkpmm4b2.js";
import"./chunk-etzpfazg.js";
import"./chunk-v4ypszbb.js";
import"./chunk-bk6ck5c2.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-e4dsy4g1.js";
import"./chunk-326zehp8.js";
import"./chunk-kc67kt75.js";
import"./chunk-40t1d75v.js";
import"./chunk-1k7v4v6f.js";
import"./chunk-e3abfxpy.js";
import"./chunk-q44zc68f.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-1ekct4sm.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-wdyw5x2b.js";
import"./chunk-3yga13e5.js";
import"./chunk-ye35qwfx.js";
import"./chunk-e3j7m7k2.js";
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-t37nnsvj.js";
import"./chunk-ew28k9dk.js";
import"./chunk-mhjmeh6r.js";
import"./chunk-m28vg9w4.js";
import"./chunk-m4zp6cf9.js";
import"./chunk-w8n8j7aw.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/swarm/backends/WindowsTerminalBackend.ts
import { randomUUID } from "crypto";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
function quotePowerShellString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
function wrapPowerShellCommand(command, pidFile) {
  const quotedPidFile = quotePowerShellString(pidFile);
  return [
    "$ErrorActionPreference = 'Stop'",
    `Set-Content -LiteralPath ${quotedPidFile} -Value $PID`,
    [
      `try { ${command}; if ($LASTEXITCODE -is [int]) { exit $LASTEXITCODE } }`,
      `catch { Write-Error $_; exit 1 }`,
      `finally { Remove-Item -LiteralPath ${quotedPidFile} -Force -ErrorAction SilentlyContinue }`
    ].join(`
`)
  ].join("; ");
}
function getWtPaneTimeoutMs() {
  const raw = process.env.CLAUDE_WT_PANE_TIMEOUT_MS;
  if (!raw)
    return WT_PANE_TIMEOUT_DEFAULT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : WT_PANE_TIMEOUT_DEFAULT_MS;
}
async function waitForPidFile(pidFile, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const content = (await readFile(pidFile, "utf-8")).trim();
      if (!/^\d+$/.test(content)) {
        lastErr = new Error(`pidFile content not a valid pid: ${JSON.stringify(content)}`);
      } else {
        const pid = Number.parseInt(content, 10);
        if (Number.isFinite(pid) && pid > 0)
          return pid;
        lastErr = new Error(`pidFile content parsed to invalid pid: ${pid}`);
      }
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, WT_PANE_POLL_INTERVAL_MS));
  }
  throw lastErr ?? new Error("pidFile never appeared");
}

class WindowsTerminalBackend {
  type = "windows-terminal";
  displayName = "Windows Terminal";
  supportsHideShow = false;
  panes = new Map;
  runCommand;
  getPlatformValue;
  pidFileDir;
  constructor(runCommandOrOptions, getPlatformValue) {
    if (typeof runCommandOrOptions === "function" || runCommandOrOptions === undefined) {
      this.runCommand = runCommandOrOptions ?? execFileNoThrow;
      this.getPlatformValue = getPlatformValue ?? getPlatform;
      this.pidFileDir = tmpdir();
    } else {
      this.runCommand = runCommandOrOptions.runCommand ?? execFileNoThrow;
      this.getPlatformValue = runCommandOrOptions.getPlatform ?? getPlatform;
      this.pidFileDir = runCommandOrOptions.pidFileDir ?? tmpdir();
    }
  }
  makePidFile(paneId) {
    return join(this.pidFileDir, `${paneId.replace(/[^a-zA-Z0-9_-]/g, "-")}.pid`);
  }
  async isAvailable() {
    if (this.getPlatformValue() !== "windows") {
      return false;
    }
    if (process.env.WT_SESSION) {
      return true;
    }
    const result = await this.runCommand("where.exe", ["wt.exe"]);
    return result.code === 0;
  }
  async isRunningInside() {
    return this.getPlatformValue() === "windows" && isInWindowsTerminal();
  }
  async createTeammatePaneInSwarmView(name, _color) {
    const paneId = `wt-${randomUUID()}`;
    const isFirstTeammate = this.panes.size === 0;
    this.panes.set(paneId, {
      title: name,
      mode: "pane",
      pidFile: this.makePidFile(paneId),
      status: "registered"
    });
    return { paneId, isFirstTeammate };
  }
  async createTeammateWindowInSwarmView(name, _color) {
    const paneId = `wt-${randomUUID()}`;
    const windowName = `teammate-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
    this.panes.set(paneId, {
      title: name,
      mode: "window",
      pidFile: this.makePidFile(paneId),
      status: "registered"
    });
    return { paneId, isFirstTeammate: false, windowName };
  }
  async sendCommandToPane(paneId, command, _useExternalSession) {
    const pane = this.panes.get(paneId);
    if (!pane) {
      throw new Error(`Unknown Windows Terminal pane id: ${paneId}`);
    }
    if (pane.status === "ready" || pane.status === "killing") {
      throw new Error(`Pane ${paneId} already spawned (status=${pane.status}); create a new pane to re-launch`);
    }
    if (pane.status === "spawning") {
      throw new Error(`Pane ${paneId} is currently spawning; wait for the in-flight launch to complete`);
    }
    if (pane.status === "dead") {
      throw new Error(`Pane ${paneId} is dead; create a new pane`);
    }
    let resolveSpawn;
    let rejectSpawn;
    const spawnPromise = new Promise((res, rej) => {
      resolveSpawn = res;
      rejectSpawn = rej;
    });
    spawnPromise.catch(() => {});
    pane.status = "spawning";
    pane.spawnPromise = spawnPromise;
    try {
      const launcher = wrapPowerShellCommand(command, pane.pidFile);
      const encoded = Buffer.from(launcher, "utf16le").toString("base64");
      const args = pane.mode === "window" ? ["-w", "-1", "new-tab", "--title", pane.title] : ["-w", "0", "split-pane", "--vertical", "--title", pane.title];
      await unlink(pane.pidFile).catch(() => {});
      const result = await this.runCommand("wt.exe", [
        ...args,
        "powershell.exe",
        "-NoLogo",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        encoded
      ]);
      if (result.code !== 0) {
        throw new Error(`Failed to launch Windows Terminal teammate ${paneId}: ${result.stderr}`);
      }
      const timeoutMs = getWtPaneTimeoutMs();
      let pid;
      try {
        pid = await waitForPidFile(pane.pidFile, timeoutMs);
      } catch (err) {
        throw new Error(`Windows Terminal pane failed to launch within ${timeoutMs}ms
` + `  paneId: ${paneId}
` + `  pidFile: ${pane.pidFile}
` + `  wt.exe stdout: ${result.stdout || "(empty)"}
` + `  wt.exe stderr: ${result.stderr || "(empty)"}
` + `  underlying: ${err instanceof Error ? err.message : String(err)}
` + `  override timeout via env CLAUDE_WT_PANE_TIMEOUT_MS`);
      }
      pane.pid = pid;
      pane.status = "ready";
      resolveSpawn();
    } catch (err) {
      pane.status = "dead";
      pane.pid = undefined;
      rejectSpawn(err);
      throw err;
    } finally {
      pane.spawnPromise = undefined;
    }
  }
  async setPaneBorderColor(_paneId, _color, _useExternalSession) {}
  async setPaneTitle(_paneId, _name, _color, _useExternalSession) {}
  async enablePaneBorderStatus(_windowTarget, _useExternalSession) {}
  async rebalancePanes(_windowTarget, _hasLeader) {}
  async killPane(paneId, _useExternalSession) {
    const pane = this.panes.get(paneId);
    if (!pane) {
      return false;
    }
    if (pane.status === "spawning" && pane.spawnPromise) {
      await pane.spawnPromise.catch(() => {});
    }
    if (pane.status === "dead") {
      this.panes.delete(paneId);
      return false;
    }
    if (pane.status !== "ready") {
      return false;
    }
    pane.status = "killing";
    let pid = pane.pid;
    if (pid === undefined) {
      let pidContent = null;
      for (let attempt = 0;attempt < 3; attempt++) {
        try {
          pidContent = (await readFile(pane.pidFile, "utf-8")).trim();
          break;
        } catch {
          if (attempt === 2) {
            pane.status = "dead";
            this.panes.delete(paneId);
            return false;
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      if (!pidContent || !/^\d+$/.test(pidContent)) {
        pane.status = "dead";
        this.panes.delete(paneId);
        return false;
      }
      const parsed = Number.parseInt(pidContent, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        pane.status = "dead";
        this.panes.delete(paneId);
        return false;
      }
      pid = parsed;
    }
    const result = await this.runCommand("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-Command",
      `Stop-Process -Id ${pid} -Force -ErrorAction Stop`
    ]);
    pane.pid = undefined;
    pane.status = "dead";
    this.panes.delete(paneId);
    logForDebugging(`[WindowsTerminalBackend] killPane ${paneId} pid=${pid} code=${result.code}`);
    return result.code === 0;
  }
  async hidePane(_paneId, _useExternalSession) {
    return false;
  }
  async showPane(_paneId, _targetWindowOrPane, _useExternalSession) {
    return false;
  }
}
var WT_PANE_TIMEOUT_DEFAULT_MS = 8000, WT_PANE_POLL_INTERVAL_MS = 200;
var init_WindowsTerminalBackend = __esm(() => {
  init_debug();
  init_execFileNoThrow();
  init_platform();
  init_detection();
  init_registry();
  registerWindowsTerminalBackend(WindowsTerminalBackend);
});
init_WindowsTerminalBackend();

export {
  WindowsTerminalBackend
};

//# debugId=4CCFBEAAEBB11DFB64756E2164756E21
//# sourceMappingURL=chunk-6kmb5910.js.map
