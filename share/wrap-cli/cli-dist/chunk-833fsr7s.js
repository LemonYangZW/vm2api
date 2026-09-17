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

// src/commands/break-cache/index.ts
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync
} from "fs";
import { join } from "path";
function getBreakCacheMarkerPath() {
  return join(getClaudeConfigHomeDir(), ".next-request-no-cache");
}
function getBreakCacheAlwaysPath() {
  return join(getClaudeConfigHomeDir(), ".break-cache-always");
}
function getBreakCacheStatsPath() {
  return join(getClaudeConfigHomeDir(), "break-cache-events.jsonl");
}
function readStats() {
  try {
    const raw = readFileSync(getBreakCacheStatsPath(), "utf8");
    const events = raw.trim().split(`
`).filter(Boolean).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter((e) => e !== null);
    const onceBreaks = events.filter((e) => e.kind === "once");
    const lastEvent = events[events.length - 1];
    const alwaysEvents = events.filter((e) => e.kind === "always_on" || e.kind === "always_off");
    const lastAlways = alwaysEvents[alwaysEvents.length - 1];
    return {
      totalBreaks: onceBreaks.length,
      lastBreakAt: lastEvent?.at ?? null,
      alwaysModeEnabled: lastAlways?.kind === "always_on"
    };
  } catch {
    return { totalBreaks: 0, lastBreakAt: null, alwaysModeEnabled: false };
  }
}
function appendBreakEvent(kind) {
  const statsPath = getBreakCacheStatsPath();
  mkdirSync(getClaudeConfigHomeDir(), { recursive: true });
  const event = { at: new Date().toISOString(), kind };
  appendFileSync(statsPath, JSON.stringify(event) + `
`, "utf8");
}
function incrementBreakCount() {
  appendBreakEvent("once");
}
async function callBreakCache(args) {
  const scope = args.trim().toLowerCase();
  const markerPath = getBreakCacheMarkerPath();
  const alwaysPath = getBreakCacheAlwaysPath();
  if (scope === "status") {
    const stats = readStats();
    const onceActive = existsSync(markerPath);
    const alwaysActive = existsSync(alwaysPath);
    return {
      type: "text",
      value: [
        "## Break-Cache Status",
        "",
        `  Once marker:    ${onceActive ? "ACTIVE (next call will bust cache)" : "not set"}`,
        `  Always mode:    ${alwaysActive ? "ON (every call busts cache)" : "off"}`,
        "",
        "## Stats",
        `  total_breaks:   ${stats.totalBreaks}`,
        `  last_break_at:  ${stats.lastBreakAt ?? "never"}`
      ].join(`
`)
    };
  }
  if (scope === "off") {
    let cleared = false;
    if (existsSync(markerPath)) {
      unlinkSync(markerPath);
      cleared = true;
    }
    if (existsSync(alwaysPath)) {
      unlinkSync(alwaysPath);
      cleared = true;
    }
    appendBreakEvent("always_off");
    return {
      type: "text",
      value: cleared ? "Break-cache disabled. Removed once marker and/or always flag." : "Break-cache was not active."
    };
  }
  if (scope === "--clear") {
    if (existsSync(markerPath)) {
      unlinkSync(markerPath);
      return {
        type: "text",
        value: `Cache-break marker cleared.
  \`${markerPath}\``
      };
    }
    return {
      type: "text",
      value: "No cache-break marker was set."
    };
  }
  if (scope === "always") {
    writeFileSync(alwaysPath, new Date().toISOString(), "utf8");
    appendBreakEvent("always_on");
    return {
      type: "text",
      value: [
        "## Always-on cache break enabled",
        "",
        `Flag written: \`${alwaysPath}\``,
        "",
        "Every API call will now append a random nonce to the system prompt,",
        "permanently preventing prompt-cache hits for this session.",
        "",
        "To disable: `/break-cache off`"
      ].join(`
`)
    };
  }
  if (scope === "" || scope === "once") {
    const timestamp = new Date().toISOString();
    writeFileSync(markerPath, timestamp, "utf8");
    incrementBreakCount();
    const stats = readStats();
    return {
      type: "text",
      value: [
        "## Cache break scheduled",
        "",
        `Marker written: \`${markerPath}\``,
        `Timestamp: ${timestamp}`,
        "",
        "The next API call will append a random nonce to the system prompt,",
        "causing a cache miss. The marker is removed automatically after use.",
        "",
        "To cancel before the next call: `/break-cache --clear`",
        "For every call:               `/break-cache always`",
        "",
        `Total breaks this session: ${stats.totalBreaks}`,
        "",
        "_How it works: Anthropic prompt cache keys on the system-prompt prefix hash._",
        "_A unique nonce invalidates the hash, forcing a fresh compute._"
      ].join(`
`)
    };
  }
  return {
    type: "text",
    value: [`Unknown scope: "${scope}"`, "", USAGE_TEXT].join(`
`)
  };
}
var USAGE_TEXT, breakCache, breakCacheNonInteractive, break_cache_default;
var init_break_cache = __esm(() => {
  init_state();
  init_envUtils();
  USAGE_TEXT = [
    "Usage: /break-cache [scope]",
    "",
    "  (no args)        Schedule a one-time cache break for the next API call",
    "  once             Same as no args",
    "  always           Enable persistent cache-break mode (every request)",
    "  off              Disable always mode and clear any pending marker",
    "  --clear          Clear the pending once marker (cancel before next call)",
    "  status           Show current break-cache status and stats",
    "",
    "How it works:",
    "  The Anthropic prompt cache keys on the system-prompt prefix hash.",
    "  A unique nonce invalidates the hash, forcing a fresh compute.",
    "  This is useful when you want to ensure a clean context window."
  ].join(`
`);
  breakCache = {
    type: "local-jsx",
    name: "break-cache",
    description: "Manage prompt-cache breaking. Open actions or run: once, status, always, off",
    isHidden: false,
    isEnabled: () => !getIsNonInteractiveSession(),
    argumentHint: "[once|status|always|off|--clear]",
    bridgeSafe: true,
    getBridgeInvocationError: (args) => args.trim() ? undefined : "Use /break-cache once/status/always/off over Remote Control.",
    load: () => import("./chunk-g3n908ft.js")
  };
  breakCacheNonInteractive = {
    type: "local",
    name: "break-cache",
    description: "Force the next (or all) API call(s) to miss prompt cache. Scopes: once, status, always, off",
    isHidden: false,
    isEnabled: () => getIsNonInteractiveSession(),
    supportsNonInteractive: true,
    bridgeSafe: true,
    load: async () => ({
      call: callBreakCache
    })
  };
  break_cache_default = breakCache;
});

export { getBreakCacheMarkerPath, getBreakCacheAlwaysPath, callBreakCache, breakCacheNonInteractive, break_cache_default, init_break_cache };

//# debugId=4D65D61B3066BC6E64756E2164756E21
//# sourceMappingURL=chunk-833fsr7s.js.map
