// @bun
import {
  __esm,
  __require
} from "./chunk-hhsxm2yr.js";

// src/utils/hash.ts
function djb2Hash(str) {
  let hash = 0;
  for (let i = 0;i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i) | 0;
  }
  return hash;
}
function hashContent(content) {
  if (typeof Bun !== "undefined") {
    return Bun.hash(content).toString();
  }
  const crypto = __require("crypto");
  return crypto.createHash("sha256").update(content).digest("hex");
}
function hashPair(a, b) {
  if (typeof Bun !== "undefined") {
    return Bun.hash(b, Bun.hash(a)).toString();
  }
  const crypto = __require("crypto");
  return crypto.createHash("sha256").update(a).update("\x00").update(b).digest("hex");
}
var init_hash = () => {};

export { djb2Hash, hashContent, hashPair, init_hash };

//# debugId=3390578B61F508F864756E2164756E21
//# sourceMappingURL=chunk-m28vg9w4.js.map
