// @bun
import {
  getIsNonInteractiveSession,
  init_state
} from "./chunk-v4e7ch76.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils
} from "./chunk-6k1rsk85.js";
import {
  __esm,
  __require
} from "./chunk-hhsxm2yr.js";

// src/commands/tui/index.ts
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
function getTuiMarkerPath() {
  return join(getClaudeConfigHomeDir(), ".tui-mode");
}
function isTuiModeEnabled() {
  return existsSync(getTuiMarkerPath());
}
function enableTui() {
  const markerPath = getTuiMarkerPath();
  mkdirSync(getClaudeConfigHomeDir(), { recursive: true });
  writeFileSync(markerPath, new Date().toISOString(), "utf8");
  return {
    type: "text",
    value: [
      "## TUI mode enabled",
      "",
      `Marker written: \`${markerPath}\``,
      "",
      "Flicker-free alternate-screen rendering will be active on the next",
      "session start.  Add this to your shell profile to make it permanent:",
      "",
      '  [ -f "$HOME/.claude/.tui-mode" ] && export CLAUDE_CODE_NO_FLICKER=1',
      "",
      "To disable: `/tui off`"
    ].join(`
`)
  };
}
function disableTui() {
  const markerPath = getTuiMarkerPath();
  if (!existsSync(markerPath)) {
    return {
      type: "text",
      value: "TUI mode was not active."
    };
  }
  unlinkSync(markerPath);
  return {
    type: "text",
    value: [
      "## TUI mode disabled",
      "",
      `Marker removed: \`${markerPath}\``,
      "",
      "Standard (non-alternate-screen) rendering will be used on the next",
      "session start.",
      "",
      "To re-enable: `/tui on`"
    ].join(`
`)
  };
}
async function callTui(args) {
  const sub = args.trim().toLowerCase();
  if (sub === "status") {
    const enabled = isTuiModeEnabled();
    const markerPath = getTuiMarkerPath();
    const envVal = process.env.CLAUDE_CODE_NO_FLICKER;
    let envLine;
    if (envVal === "1" || envVal === "true") {
      envLine = "CLAUDE_CODE_NO_FLICKER=1 (forced on via env var)";
    } else if (envVal === "0" || envVal === "false") {
      envLine = "CLAUDE_CODE_NO_FLICKER=0 (forced off via env var)";
    } else {
      envLine = "CLAUDE_CODE_NO_FLICKER not set";
    }
    return {
      type: "text",
      value: [
        "## TUI Mode Status",
        "",
        `  Marker file:  ${enabled ? "present" : "absent"} (\`${markerPath}\`)`,
        `  Mode:         ${enabled ? "enabled" : "disabled"}`,
        `  Env var:      ${envLine}`,
        "",
        "Note: changes take effect on the next session start."
      ].join(`
`)
    };
  }
  if (sub === "on") {
    return enableTui();
  }
  if (sub === "off") {
    return disableTui();
  }
  if (sub === "" || sub === "toggle") {
    return isTuiModeEnabled() ? disableTui() : enableTui();
  }
  return {
    type: "text",
    value: [`Unknown subcommand: "${sub}"`, "", USAGE_TEXT].join(`
`)
  };
}
var USAGE_TEXT, tuiCommand, tuiNonInteractive, tui_default;
var init_tui = __esm(() => {
  init_state();
  init_envUtils();
  USAGE_TEXT = [
    "Usage: /tui [subcommand]",
    "",
    "  (no args)   Toggle flicker-free TUI mode (alternate screen buffer)",
    "  on          Enable TUI mode",
    "  off         Disable TUI mode",
    "  status      Show current TUI mode state",
    "",
    "TUI mode uses the ANSI alternate screen buffer (\\x1b[?1049h) so the",
    "Claude Code UI occupies a clean full-screen area with no scroll-back",
    "flicker.  The setting is stored in ~/.claude/.tui-mode and takes effect",
    "on the next session start.",
    "",
    "Shell-profile integration (auto-enable on every start):",
    '  [ -f "$HOME/.claude/.tui-mode" ] && export CLAUDE_CODE_NO_FLICKER=1',
    "",
    "Environment override:",
    "  CLAUDE_CODE_NO_FLICKER=1   force on (overrides marker)",
    "  CLAUDE_CODE_NO_FLICKER=0   force off (overrides marker)"
  ].join(`
`);
  tuiCommand = {
    type: "local-jsx",
    name: "tui",
    description: "Manage flicker-free TUI mode. Open actions or run: status, on, off, toggle",
    isHidden: false,
    isEnabled: () => !getIsNonInteractiveSession(),
    argumentHint: "[status|on|off|toggle]",
    bridgeSafe: true,
    getBridgeInvocationError: (args) => args.trim() ? undefined : "Use /tui status/on/off/toggle over Remote Control.",
    load: () => import("./chunk-17qfvz4c.js")
  };
  tuiNonInteractive = {
    type: "local",
    name: "tui",
    description: "Toggle flicker-free TUI mode (alternate screen buffer). Subcommands: on, off, status",
    isHidden: false,
    isEnabled: () => getIsNonInteractiveSession(),
    supportsNonInteractive: true,
    bridgeSafe: true,
    load: async () => ({
      call: callTui
    })
  };
  tui_default = tuiCommand;
});

export { callTui, tuiNonInteractive, tui_default, init_tui };

//# debugId=CAB3806A0868A6B464756E2164756E21
//# sourceMappingURL=chunk-ffq9eh6d.js.map
