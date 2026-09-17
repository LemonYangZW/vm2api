// @bun
import {
  getChicagoEnabled,
  getChicagoSubGates,
  init_gates
} from "./chunk-4fmczbfx.js";
import {
  createCliExecutor,
  init_executor
} from "./chunk-msarpzkm.js";
import {
  init_swiftLoader,
  requireComputerUseSwift
} from "./chunk-gb0km2ev.js";
import {
  COMPUTER_USE_MCP_SERVER_NAME,
  init_common
} from "./chunk-g2931ep0.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/computerUse/hostAdapter.ts
import { format } from "util";

class DebugLogger {
  silly(message, detail) {
    logForDebugging(format(message, detail ?? ""), { level: "debug" });
  }
  debug(message, detail) {
    logForDebugging(format(message, detail ?? ""), { level: "debug" });
  }
  info(message, detail) {
    logForDebugging(format(message, detail ?? ""), { level: "info" });
  }
  warn(message, detail) {
    logForDebugging(format(message, detail ?? ""), { level: "warn" });
  }
  error(message, detail) {
    logForDebugging(format(message, detail ?? ""), { level: "error" });
  }
}
function checkAccessibilityJXA() {
  try {
    const result = Bun.spawnSync({
      cmd: [
        "osascript",
        "-e",
        'tell application "System Events" to get name of every process whose background only is false'
      ],
      stdout: "pipe",
      stderr: "pipe"
    });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}
function checkScreenRecordingJXA() {
  try {
    const result = Bun.spawnSync({
      cmd: ["screencapture", "-x", "-R", "0,0,1,1", "/dev/null"],
      stdout: "pipe",
      stderr: "pipe"
    });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}
function getComputerUseHostAdapter() {
  if (cached)
    return cached;
  cached = {
    serverName: COMPUTER_USE_MCP_SERVER_NAME,
    logger: new DebugLogger,
    executor: createCliExecutor({
      getMouseAnimationEnabled: () => getChicagoSubGates().mouseAnimation,
      getHideBeforeActionEnabled: () => getChicagoSubGates().hideBeforeAction
    }),
    ensureOsPermissions: async () => {
      if (process.platform !== "darwin")
        return { granted: true };
      const cu = requireComputerUseSwift();
      const tcc = cu.tcc;
      if (tcc) {
        const accessibility2 = tcc.checkAccessibility();
        const screenRecording2 = tcc.checkScreenRecording();
        return accessibility2 && screenRecording2 ? { granted: true } : { granted: false, accessibility: accessibility2, screenRecording: screenRecording2 };
      }
      const accessibility = checkAccessibilityJXA();
      const screenRecording = checkScreenRecordingJXA();
      return accessibility && screenRecording ? { granted: true } : { granted: false, accessibility, screenRecording };
    },
    isDisabled: () => !getChicagoEnabled(),
    getSubGates: getChicagoSubGates,
    getAutoUnhideEnabled: () => true,
    cropRawPatch: () => null
  };
  return cached;
}
var cached;
var init_hostAdapter = __esm(() => {
  init_debug();
  init_common();
  init_executor();
  init_gates();
  init_swiftLoader();
});

export { getComputerUseHostAdapter, init_hostAdapter };

//# debugId=64CB9570CB2BD13C64756E2164756E21
//# sourceMappingURL=chunk-1233rcpq.js.map
