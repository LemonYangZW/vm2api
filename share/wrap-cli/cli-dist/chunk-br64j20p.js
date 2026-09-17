// @bun
import {
  getDynamicConfig_CACHED_MAY_BE_STALE,
  init_growthbook
} from "./chunk-necthexa.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/computerUse/gates.ts
function readConfig() {
  return {
    ...DEFAULTS,
    ...getDynamicConfig_CACHED_MAY_BE_STALE("tengu_malort_pedway", DEFAULTS)
  };
}
function hasRequiredSubscription() {
  return true;
}
function getChicagoEnabled() {
  if (process.env.USER_TYPE === "ant" && process.env.MONOREPO_ROOT_DIR && !isEnvTruthy(process.env.ALLOW_ANT_COMPUTER_USE_MCP)) {
    return false;
  }
  return hasRequiredSubscription() && readConfig().enabled;
}
function getChicagoSubGates() {
  const { enabled: _e, coordinateMode: _c, ...subGates } = readConfig();
  return subGates;
}
function getChicagoCoordinateMode() {
  frozenCoordinateMode ??= readConfig().coordinateMode;
  return frozenCoordinateMode;
}
var DEFAULTS, frozenCoordinateMode;
var init_gates = __esm(() => {
  init_growthbook();
  init_envUtils();
  DEFAULTS = {
    enabled: true,
    pixelValidation: false,
    clipboardPasteMultiline: true,
    mouseAnimation: true,
    hideBeforeAction: true,
    autoTargetDisplay: true,
    clipboardGuard: true,
    coordinateMode: "pixels"
  };
});

export { getChicagoEnabled, getChicagoSubGates, getChicagoCoordinateMode, init_gates };

//# debugId=6BABF98E0705DD4C64756E2164756E21
//# sourceMappingURL=chunk-br64j20p.js.map
