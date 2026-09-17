// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/bridge/types.ts
var DEFAULT_SESSION_TIMEOUT_MS, BRIDGE_LOGIN_INSTRUCTION = "Remote Control is only available with claude.ai subscriptions. Please use `/login` to sign in with your claude.ai account.", BRIDGE_LOGIN_ERROR, REMOTE_CONTROL_DISCONNECTED_MSG = "Remote Control disconnected.";
var init_types = __esm(() => {
  DEFAULT_SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;
  BRIDGE_LOGIN_ERROR = `Error: You must be logged in to use Remote Control.

` + BRIDGE_LOGIN_INSTRUCTION;
});

export { DEFAULT_SESSION_TIMEOUT_MS, BRIDGE_LOGIN_INSTRUCTION, BRIDGE_LOGIN_ERROR, REMOTE_CONTROL_DISCONNECTED_MSG, init_types };

//# debugId=37BE942F0A3C267164756E2164756E21
//# sourceMappingURL=chunk-71sdcaq6.js.map
