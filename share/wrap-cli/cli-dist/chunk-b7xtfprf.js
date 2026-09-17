// @bun
import {
  cacheKeys,
  init_fileStateCache
} from "./chunk-24kv69g3.js";
import"./chunk-e3j7m7k2.js";
import {
  getCwd,
  init_cwd
} from "./chunk-ew28k9dk.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/commands/files/files.ts
import { relative } from "path";
async function call(_args, context) {
  const files = context.readFileState ? cacheKeys(context.readFileState) : [];
  if (files.length === 0) {
    return { type: "text", value: "No files in context" };
  }
  const fileList = files.map((file) => relative(getCwd(), file)).join(`
`);
  return { type: "text", value: `Files in context:
${fileList}` };
}
var init_files = __esm(() => {
  init_cwd();
  init_fileStateCache();
});
init_files();

export {
  call
};

//# debugId=8DDDC93B317D6D2F64756E2164756E21
//# sourceMappingURL=chunk-b7xtfprf.js.map
