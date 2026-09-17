// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/types/permissions.ts
var EXTERNAL_PERMISSION_MODES, INTERNAL_PERMISSION_MODES, PERMISSION_MODES;
var init_permissions = __esm(() => {
  EXTERNAL_PERMISSION_MODES = [
    "acceptEdits",
    "bypassPermissions",
    "default",
    "dontAsk",
    "plan"
  ];
  INTERNAL_PERMISSION_MODES = [
    ...EXTERNAL_PERMISSION_MODES,
    "auto"
  ];
  PERMISSION_MODES = INTERNAL_PERMISSION_MODES;
});

export { EXTERNAL_PERMISSION_MODES, INTERNAL_PERMISSION_MODES, PERMISSION_MODES, init_permissions };

//# debugId=70A556B1F0C769F964756E2164756E21
//# sourceMappingURL=chunk-8kf8h7xf.js.map
