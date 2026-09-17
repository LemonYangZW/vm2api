// @bun
import {
  init_src,
  init_strip_ansi,
  require_react,
  root_default,
  stripAnsi,
  use_app_default
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/utils/staticRender.tsx
import { PassThrough } from "stream";
function RenderOnceAndExit({ children }) {
  const { exit } = use_app_default();
  import_react.useLayoutEffect(() => {
    const timer = setTimeout(exit, 0);
    return () => clearTimeout(timer);
  }, [exit]);
  return /* @__PURE__ */ jsx_runtime.jsx(jsx_runtime.Fragment, {
    children
  });
}
function extractFirstFrame(output) {
  const startIndex = output.indexOf(SYNC_START);
  if (startIndex === -1)
    return output;
  const contentStart = startIndex + SYNC_START.length;
  const endIndex = output.indexOf(SYNC_END, contentStart);
  if (endIndex === -1)
    return output;
  return output.slice(contentStart, endIndex);
}
async function renderToAnsiString(node, columns) {
  let output = "";
  const stream = new PassThrough;
  if (columns !== undefined) {
    stream.columns = columns;
  }
  stream.on("data", (chunk) => {
    output += chunk.toString();
  });
  const instance = await root_default(/* @__PURE__ */ jsx_runtime.jsx(RenderOnceAndExit, {
    children: node
  }), {
    stdout: stream,
    patchConsole: false
  });
  await instance.waitUntilExit();
  return extractFirstFrame(output);
}
async function renderToString(node, columns) {
  const output = await renderToAnsiString(node, columns);
  return stripAnsi(output);
}
var import_react, jsx_runtime, SYNC_START = "\x1B[?2026h", SYNC_END = "\x1B[?2026l";
var init_staticRender = __esm(() => {
  init_strip_ansi();
  init_src();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { renderToAnsiString, renderToString, init_staticRender };

//# debugId=D2D5990C382352DC64756E2164756E21
//# sourceMappingURL=chunk-mvq2dtxj.js.map
