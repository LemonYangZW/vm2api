// @bun
import {
  require_react
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/context/fpsMetrics.tsx
var import_react = __toESM(require_react(), 1);
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
var FpsMetricsContext = import_react.createContext(undefined);
function FpsMetricsProvider({ getFpsMetrics, children }) {
  return /* @__PURE__ */ jsx_runtime.jsx(FpsMetricsContext.Provider, {
    value: getFpsMetrics,
    children
  });
}
function useFpsMetrics() {
  return import_react.useContext(FpsMetricsContext);
}

export { FpsMetricsProvider, useFpsMetrics };

//# debugId=E9E38583C2CFACAF64756E2164756E21
//# sourceMappingURL=chunk-8c9t33z4.js.map
