// @bun
import {
  init_toolPool,
  mergeAndFilterTools
} from "./chunk-77rwxg36.js";
import {
  assembleToolPool,
  init_tools
} from "./chunk-92frfsdm.js";
import {
  require_react
} from "./chunk-1ekct4sm.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/hooks/useMergedTools.ts
function useMergedTools(initialTools, mcpTools, toolPermissionContext) {
  let replBridgeEnabled = false;
  let replBridgeOutboundOnly = false;
  return import_react.useMemo(() => {
    const assembled = assembleToolPool(toolPermissionContext, mcpTools);
    return mergeAndFilterTools(initialTools, assembled, toolPermissionContext.mode);
  }, [
    initialTools,
    mcpTools,
    toolPermissionContext,
    replBridgeEnabled,
    replBridgeOutboundOnly
  ]);
}
var import_react;
var init_useMergedTools = __esm(() => {
  init_tools();
  init_toolPool();
  import_react = __toESM(require_react(), 1);
});

export { useMergedTools, init_useMergedTools };

//# debugId=63D3DAF864EC47AF64756E2164756E21
//# sourceMappingURL=chunk-kxwc18nv.js.map
