// @bun
import {
  init_partition,
  partition_default
} from "./chunk-mj88srq2.js";
import {
  exports_coordinatorMode,
  init_coordinatorMode,
  init_uniqBy,
  init_utils,
  isMcpTool,
  uniqBy_default
} from "./chunk-92frfsdm.js";
import {
  COORDINATOR_MODE_ALLOWED_TOOLS,
  init_tools
} from "./chunk-7b68gcqs.js";
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
//# sourceMappingURL=chunk-77rwxg36.js.map
