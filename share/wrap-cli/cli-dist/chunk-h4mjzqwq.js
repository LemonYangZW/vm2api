// @bun
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __esm,
  __require,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/diff/diff.tsx
var jsx_runtime, call = async (onDone, context) => {
  const { DiffDialog } = await import("./chunk-6wvqy94a.js");
  return /* @__PURE__ */ jsx_runtime.jsx(DiffDialog, {
    messages: context.messages,
    onDone
  });
};
var init_diff = __esm(() => {
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});
init_diff();

export {
  call
};

//# debugId=D2A4BC1FD6EEB0B964756E2164756E21
//# sourceMappingURL=chunk-h4mjzqwq.js.map
