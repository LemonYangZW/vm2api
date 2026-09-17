// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/bundledMode.ts
function isRunningWithBun() {
  return process.versions.bun !== undefined;
}
function isInBundledMode() {
  return typeof Bun !== "undefined" && Array.isArray(Bun.embeddedFiles) && Bun.embeddedFiles.length > 0;
}
var init_bundledMode = () => {};

export { isRunningWithBun, isInBundledMode, init_bundledMode };

//# debugId=1A03BAEA297F6BCA64756E2164756E21
//# sourceMappingURL=chunk-v4ypszbb.js.map
