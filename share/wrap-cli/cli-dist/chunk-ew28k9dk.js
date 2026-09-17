// @bun
import {
  getCwdState,
  getOriginalCwd,
  init_state
} from "./chunk-v4e7ch76.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/cwd.ts
import { AsyncLocalStorage } from "async_hooks";
function runWithCwdOverride(cwd, fn) {
  return cwdOverrideStorage.run(cwd, fn);
}
function pwd() {
  return cwdOverrideStorage.getStore() ?? getCwdState();
}
function getCwd() {
  try {
    return pwd();
  } catch {
    return getOriginalCwd();
  }
}
var cwdOverrideStorage;
var init_cwd = __esm(() => {
  init_state();
  cwdOverrideStorage = new AsyncLocalStorage;
});

export { runWithCwdOverride, pwd, getCwd, init_cwd };

//# debugId=C5BFAC879F5E7C1E64756E2164756E21
//# sourceMappingURL=chunk-ew28k9dk.js.map
