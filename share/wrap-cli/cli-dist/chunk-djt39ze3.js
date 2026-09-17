// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/distRoot.ts
import { fileURLToPath } from "url";
import * as path from "path";
var __filename2, __dirname2, distRoot;
var init_distRoot = __esm(() => {
  __filename2 = fileURLToPath(import.meta.url);
  __dirname2 = path.dirname(__filename2);
  distRoot = (() => {
    const parts = __dirname2.split(path.sep);
    const distIdx = parts.lastIndexOf("dist");
    if (distIdx !== -1) {
      return parts.slice(0, distIdx + 1).join(path.sep);
    }
    const srcIdx = parts.lastIndexOf("src");
    if (srcIdx !== -1) {
      return parts.slice(0, srcIdx).join(path.sep);
    }
    return __dirname2;
  })();
});

export { distRoot, init_distRoot };

//# debugId=C8E1045E0626AB0564756E2164756E21
//# sourceMappingURL=chunk-djt39ze3.js.map
