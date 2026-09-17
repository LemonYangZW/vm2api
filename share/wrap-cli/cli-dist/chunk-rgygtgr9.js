// @bun
import {
  StdioServerTransport,
  init_stdio
} from "./chunk-k3q6hzy6.js";
import {
  init_sink,
  initializeAnalyticsSink
} from "./chunk-fs1yn235.js";
import {
  getComputerUseHostAdapter,
  init_hostAdapter
} from "./chunk-xjrkp6kv.js";
import {
  getChicagoCoordinateMode,
  init_gates
} from "./chunk-br64j20p.js";
import"./chunk-w5hnghah.js";
import {
  init_datadog,
  shutdownDatadog
} from "./chunk-g6ppvq16.js";
import"./chunk-msarpzkm.js";
import {
  buildComputerUseTools,
  createComputerUseMcpServer,
  init_src
} from "./chunk-s76nvx50.js";
import"./chunk-gb0km2ev.js";
import {
  enableConfigs,
  init_config1 as init_config,
  init_firstPartyEventLogger,
  shutdown1PEventLogging
} from "./chunk-necthexa.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-k48mx8nn.js";
import"./chunk-epvbnq43.js";
import"./chunk-h7cy00tf.js";
import"./chunk-srzb9n7s.js";
import"./chunk-6tzyv21c.js";
import"./chunk-8kf8h7xf.js";
import"./chunk-bgan4cpf.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-psygyacq.js";
import"./chunk-e2d0hkcr.js";
import"./chunk-g2931ep0.js";
import"./chunk-vwenx8ke.js";
import"./chunk-kkpmm4b2.js";
import"./chunk-etzpfazg.js";
import"./chunk-v4ypszbb.js";
import"./chunk-bk6ck5c2.js";
import {
  ListToolsRequestSchema,
  init_types
} from "./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-326zehp8.js";
import"./chunk-40t1d75v.js";
import"./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-1ekct4sm.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-3yga13e5.js";
import"./chunk-ye35qwfx.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-t37nnsvj.js";
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

// src/utils/computerUse/appNames.ts
function isUserFacingPath(path, homeDir) {
  if (PATH_ALLOWLIST.some((root) => path.startsWith(root)))
    return true;
  if (homeDir) {
    const userApps = homeDir.endsWith("/") ? `${homeDir}Applications/` : `${homeDir}/Applications/`;
    if (path.startsWith(userApps))
      return true;
  }
  return false;
}
function isNoisyName(name) {
  return NAME_PATTERN_BLOCKLIST.some((re) => re.test(name));
}
function sanitizeCore(raw, applyCharFilter) {
  const seen = new Set;
  return raw.map((name) => name.trim()).filter((trimmed) => {
    if (!trimmed)
      return false;
    if (trimmed.length > APP_NAME_MAX_LEN)
      return false;
    if (applyCharFilter && !APP_NAME_ALLOWED.test(trimmed))
      return false;
    if (seen.has(trimmed))
      return false;
    seen.add(trimmed);
    return true;
  }).sort((a, b) => a.localeCompare(b));
}
function sanitizeAppNames(raw) {
  const filtered = sanitizeCore(raw, true);
  if (filtered.length <= APP_NAME_MAX_COUNT)
    return filtered;
  return [
    ...filtered.slice(0, APP_NAME_MAX_COUNT),
    `\u2026 and ${filtered.length - APP_NAME_MAX_COUNT} more`
  ];
}
function sanitizeTrustedNames(raw) {
  return sanitizeCore(raw, false);
}
function filterAppsForDescription(installed, homeDir) {
  const { alwaysKept, rest } = installed.reduce((acc, app) => {
    if (ALWAYS_KEEP_BUNDLE_IDS.has(app.bundleId)) {
      acc.alwaysKept.push(app.displayName);
    } else if (isUserFacingPath(app.path, homeDir) && !isNoisyName(app.displayName)) {
      acc.rest.push(app.displayName);
    }
    return acc;
  }, { alwaysKept: [], rest: [] });
  const sanitizedAlways = sanitizeTrustedNames(alwaysKept);
  const alwaysSet = new Set(sanitizedAlways);
  return [
    ...sanitizedAlways,
    ...sanitizeAppNames(rest).filter((n) => !alwaysSet.has(n))
  ];
}
var PATH_ALLOWLIST, NAME_PATTERN_BLOCKLIST, ALWAYS_KEEP_BUNDLE_IDS, APP_NAME_ALLOWED, APP_NAME_MAX_LEN = 40, APP_NAME_MAX_COUNT = 50;
var init_appNames = __esm(() => {
  PATH_ALLOWLIST = [
    "/Applications/",
    "/System/Applications/"
  ];
  NAME_PATTERN_BLOCKLIST = [
    /Helper(?:$|\s\()/,
    /Agent(?:$|\s\()/,
    /Service(?:$|\s\()/,
    /Uninstaller(?:$|\s\()/,
    /Updater(?:$|\s\()/,
    /^\./
  ];
  ALWAYS_KEEP_BUNDLE_IDS = new Set([
    "com.apple.Safari",
    "com.google.Chrome",
    "com.microsoft.edgemac",
    "org.mozilla.firefox",
    "company.thebrowser.Browser",
    "com.tinyspeck.slackmacgap",
    "us.zoom.xos",
    "com.microsoft.teams2",
    "com.microsoft.teams",
    "com.apple.MobileSMS",
    "com.apple.mail",
    "com.microsoft.Word",
    "com.microsoft.Excel",
    "com.microsoft.Powerpoint",
    "com.microsoft.Outlook",
    "com.apple.iWork.Pages",
    "com.apple.iWork.Numbers",
    "com.apple.iWork.Keynote",
    "com.google.GoogleDocs",
    "notion.id",
    "com.apple.Notes",
    "md.obsidian",
    "com.linear",
    "com.figma.Desktop",
    "com.microsoft.VSCode",
    "com.apple.Terminal",
    "com.googlecode.iterm2",
    "com.github.GitHubDesktop",
    "com.apple.finder",
    "com.apple.iCal",
    "com.apple.systempreferences"
  ]);
  APP_NAME_ALLOWED = /^[\p{L}\p{M}\p{N}_ .&'()+-]+$/u;
});

// src/utils/computerUse/mcpServer.ts
import { homedir } from "os";
async function tryGetInstalledAppNames() {
  const adapter = getComputerUseHostAdapter();
  const enumP = adapter.executor.listInstalledApps();
  let timer;
  const timeoutP = new Promise((resolve) => {
    timer = setTimeout(resolve, APP_ENUM_TIMEOUT_MS, undefined);
  });
  const installed = await Promise.race([enumP, timeoutP]).catch(() => {
    return;
  }).finally(() => clearTimeout(timer));
  if (!installed) {
    enumP.catch(() => {});
    logForDebugging(`[Computer Use MCP] app enumeration exceeded ${APP_ENUM_TIMEOUT_MS}ms or failed; tool description omits list`);
    return;
  }
  return filterAppsForDescription(installed, homedir());
}
async function createComputerUseMcpServerForCli() {
  const adapter = getComputerUseHostAdapter();
  const coordinateMode = getChicagoCoordinateMode();
  const server = createComputerUseMcpServer(adapter, coordinateMode);
  const installedAppNames = await tryGetInstalledAppNames();
  const tools = buildComputerUseTools(adapter.executor.capabilities, coordinateMode, installedAppNames);
  server.setRequestHandler(ListToolsRequestSchema, async () => adapter.isDisabled() ? { tools: [] } : { tools });
  return server;
}
async function runComputerUseMcpServer() {
  enableConfigs();
  initializeAnalyticsSink();
  const server = await createComputerUseMcpServerForCli();
  const transport = new StdioServerTransport;
  let exiting = false;
  const shutdownAndExit = async () => {
    if (exiting)
      return;
    exiting = true;
    await Promise.all([shutdown1PEventLogging(), shutdownDatadog()]);
    process.exit(0);
  };
  process.stdin.on("end", () => void shutdownAndExit());
  process.stdin.on("error", () => void shutdownAndExit());
  logForDebugging("[Computer Use MCP] Starting MCP server");
  await server.connect(transport);
  logForDebugging("[Computer Use MCP] MCP server started");
}
var APP_ENUM_TIMEOUT_MS = 1000;
var init_mcpServer = __esm(() => {
  init_src();
  init_sink();
  init_stdio();
  init_types();
  init_datadog();
  init_firstPartyEventLogger();
  init_config();
  init_debug();
  init_appNames();
  init_gates();
  init_hostAdapter();
});
init_mcpServer();

export {
  runComputerUseMcpServer,
  createComputerUseMcpServerForCli
};

//# debugId=B7707DCC5088AF2E64756E2164756E21
//# sourceMappingURL=chunk-rgygtgr9.js.map
