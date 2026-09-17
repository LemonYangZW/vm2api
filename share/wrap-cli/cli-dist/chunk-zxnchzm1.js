// @bun
import {
  init_partition,
  partition_default
} from "./chunk-g9x8dcvc.js";
import {
  exports_coordinatorMode,
  init_coordinatorMode,
  init_uniqBy,
  init_utils,
  isMcpTool,
  uniqBy_default
} from "./chunk-mxbn7v69.js";
import {
  COORDINATOR_MODE_ALLOWED_TOOLS,
  init_tools
} from "./chunk-r5mwhna8.js";
import {
  __esm,
  __toCommonJS
} from "./chunk-hhsxm2yr.js";

// src/utils/toolPool.ts
function isPrActivitySubscriptionTool(name) {
  return PR_ACTIVITY_TOOL_SUFFIXES.some((suffix) => name.endsWith(suffix));
}
function applyCoordinatorToolFilter(tools) {
  return tools.filter((t) => COORDINATOR_MODE_ALLOWED_TOOLS.has(t.name) || isPrActivitySubscriptionTool(t.name));
}
function mergeAndFilterTools(initialTools, assembled, _mode) {
  const [mcp, builtIn] = partition_default(uniqBy_default([...initialTools, ...assembled], "name"), isMcpTool);
  const byName = (a, b) => a.name.localeCompare(b.name);
  const tools = [...builtIn.sort(byName), ...mcp.sort(byName)];
  if (coordinatorModeModule) {
    if (coordinatorModeModule.isCoordinatorMode()) {
      return applyCoordinatorToolFilter(tools);
    }
  }
  return tools;
}
var PR_ACTIVITY_TOOL_SUFFIXES, coordinatorModeModule;
var init_toolPool = __esm(() => {
  init_partition();
  init_uniqBy();
  init_tools();
  init_utils();
  PR_ACTIVITY_TOOL_SUFFIXES = [
    "subscribe_pr_activity",
    "unsubscribe_pr_activity"
  ];
  coordinatorModeModule = (init_coordinatorMode(), __toCommonJS(exports_coordinatorMode));
});

export { isPrActivitySubscriptionTool, applyCoordinatorToolFilter, mergeAndFilterTools, init_toolPool };

//# debugId=5A31C53F15D1842164756E2164756E21
//# sourceMappingURL=chunk-zxnchzm1.js.map
