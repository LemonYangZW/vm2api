// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/autoModeDenials.ts
function recordAutoModeDenial(denial) {
  if (false)
    ;
  DENIALS = [denial, ...DENIALS.slice(0, MAX_DENIALS - 1)];
}
function getAutoModeDenials() {
  return DENIALS;
}
var DENIALS, MAX_DENIALS = 20;
var init_autoModeDenials = __esm(() => {
  DENIALS = [];
});

export { recordAutoModeDenial, getAutoModeDenials, init_autoModeDenials };

//# debugId=410A089868BD810564756E2164756E21
//# sourceMappingURL=chunk-xwet3awb.js.map
