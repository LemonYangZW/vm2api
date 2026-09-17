// @bun
import {
  TMUX_COMMAND,
  init_constants
} from "./chunk-935nrvdb.js";
import {
  env,
  init_env
} from "./chunk-kkpmm4b2.js";
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-t37nnsvj.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/swarm/backends/detection.ts
function isInsideTmuxSync() {
  return !!ORIGINAL_USER_TMUX;
}
async function isInsideTmux() {
  if (isInsideTmuxCached !== null) {
    return isInsideTmuxCached;
  }
  isInsideTmuxCached = !!ORIGINAL_USER_TMUX;
  return isInsideTmuxCached;
}
function getLeaderPaneId() {
  return ORIGINAL_TMUX_PANE || null;
}
async function isTmuxAvailable() {
  const result = await execFileNoThrow(TMUX_COMMAND, ["-V"]);
  return result.code === 0;
}
async function isWindowsTerminalAvailable() {
  if (process.env.WT_SESSION) {
    return true;
  }
  const result = await execFileNoThrow("where.exe", ["wt.exe"]);
  return result.code === 0;
}
function isInITerm2() {
  if (isInITerm2Cached !== null) {
    return isInITerm2Cached;
  }
  const termProgram = process.env.TERM_PROGRAM;
  const hasItermSessionId = !!process.env.ITERM_SESSION_ID;
  const terminalIsITerm = env.terminal === "iTerm.app";
  isInITerm2Cached = termProgram === "iTerm.app" || hasItermSessionId || terminalIsITerm;
  return isInITerm2Cached;
}
function isInWindowsTerminal() {
  if (isInWindowsTerminalCached !== null) {
    return isInWindowsTerminalCached;
  }
  isInWindowsTerminalCached = !!process.env.WT_SESSION;
  return isInWindowsTerminalCached;
}
async function isIt2CliAvailable() {
  const result = await execFileNoThrow(IT2_COMMAND, ["session", "list"]);
  return result.code === 0;
}
function resetDetectionCache() {
  isInsideTmuxCached = null;
  isInITerm2Cached = null;
  isInWindowsTerminalCached = null;
}
var ORIGINAL_USER_TMUX, ORIGINAL_TMUX_PANE, isInsideTmuxCached = null, isInITerm2Cached = null, isInWindowsTerminalCached = null, IT2_COMMAND = "it2";
var init_detection = __esm(() => {
  init_env();
  init_execFileNoThrow();
  init_constants();
  ORIGINAL_USER_TMUX = process.env.TMUX;
  ORIGINAL_TMUX_PANE = process.env.TMUX_PANE;
});

export { isInsideTmuxSync, isInsideTmux, getLeaderPaneId, isTmuxAvailable, isWindowsTerminalAvailable, isInITerm2, isInWindowsTerminal, IT2_COMMAND, isIt2CliAvailable, resetDetectionCache, init_detection };

//# debugId=007740BF1944C93D64756E2164756E21
//# sourceMappingURL=chunk-0jw2cfy8.js.map
