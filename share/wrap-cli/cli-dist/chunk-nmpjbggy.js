// @bun
import {
  getInitialSettings,
  init_settings1 as init_settings,
  updateSettingsForSource
} from "./chunk-necthexa.js";
import {
  __esm,
  __export
} from "./chunk-hhsxm2yr.js";

// src/commands/poor/poorMode.ts
var exports_poorMode = {};
__export(exports_poorMode, {
  setPoorMode: () => setPoorMode,
  isPoorModeActive: () => isPoorModeActive
});
function isPoorModeActive() {
  if (poorModeActive === null) {
    poorModeActive = getInitialSettings().poorMode === true;
  }
  return poorModeActive;
}
function setPoorMode(active) {
  poorModeActive = active;
  updateSettingsForSource("userSettings", {
    poorMode: active || undefined
  });
}
var poorModeActive = null;
var init_poorMode = __esm(() => {
  init_settings();
});

export { isPoorModeActive, setPoorMode, exports_poorMode, init_poorMode };

//# debugId=916E0A747032780564756E2164756E21
//# sourceMappingURL=chunk-nmpjbggy.js.map
