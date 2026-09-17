// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/mcp/normalization.ts
function normalizeNameForMCP(name) {
  let normalized = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  if (name.startsWith(CLAUDEAI_SERVER_PREFIX)) {
    normalized = normalized.replace(/_+/g, "_").replace(/^_|_$/g, "");
  }
  return normalized;
}
var CLAUDEAI_SERVER_PREFIX = "claude.ai ";
var init_normalization = () => {};

export { normalizeNameForMCP, init_normalization };

//# debugId=823BE87C4536028864756E2164756E21
//# sourceMappingURL=chunk-vwenx8ke.js.map
