// @bun
import {
  init_which,
  whichSync
} from "./chunk-m4zp6cf9.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/findExecutable.ts
function findExecutable(exe, args) {
  const resolved = whichSync(exe);
  return { cmd: resolved ?? exe, args };
}
var init_findExecutable = __esm(() => {
  init_which();
});

export { findExecutable, init_findExecutable };

//# debugId=A41B12BC3B6B107764756E2164756E21
//# sourceMappingURL=chunk-etzpfazg.js.map
