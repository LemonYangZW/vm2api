// @bun
import {
  __commonJS,
  __esm,
  __export
} from "./chunk-hhsxm2yr.js";

// node_modules/.bun/react@19.2.5/node_modules/react/cjs/react-jsx-runtime.production.js
var exports_react_jsx_runtime_production = {};
__export(exports_react_jsx_runtime_production, {
  jsxs: () => $jsxs,
  jsx: () => $jsx,
  Fragment: () => $Fragment
});
function jsxProd(type, config, maybeKey) {
  var key = null;
  maybeKey !== undefined && (key = "" + maybeKey);
  config.key !== undefined && (key = "" + config.key);
  if ("key" in config) {
    maybeKey = {};
    for (var propName in config)
      propName !== "key" && (maybeKey[propName] = config[propName]);
  } else
    maybeKey = config;
  config = maybeKey.ref;
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref: config !== undefined ? config : null,
    props: maybeKey
  };
}
var REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE, $Fragment, $jsx, $jsxs;
var init_react_jsx_runtime_production = __esm(() => {
  REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
  $Fragment = REACT_FRAGMENT_TYPE;
  $jsx = jsxProd;
  $jsxs = jsxProd;
});

// node_modules/.bun/react@19.2.5/node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS((exports, module) => {
  init_react_jsx_runtime_production();
  if (true) {
    module.exports = exports_react_jsx_runtime_production;
  }
});

export { require_jsx_runtime };

//# debugId=39B91B185EB3761764756E2164756E21
//# sourceMappingURL=chunk-x9xf2qa8.js.map
