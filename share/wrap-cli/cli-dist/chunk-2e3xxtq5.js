// @bun
import {
  Login,
  init_login
} from "./chunk-hcttfjhg.js";
import {
  init_extra_usage_core,
  runExtraUsage
} from "./chunk-4nyt0597.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/extra-usage/extra-usage.tsx
async function call(onDone, context) {
  const result = await runExtraUsage();
  if (result.type === "message") {
    onDone(result.value);
    return null;
  }
  return /* @__PURE__ */ jsx_runtime.jsx(Login, {
    startingMessage: "Starting new login following /extra-usage. Exit with Ctrl-C to use existing account.",
    onDone: (success) => {
      context.onChangeAPIKey();
      onDone(success ? "Login successful" : "Login interrupted");
    }
  });
}
var jsx_runtime;
var init_extra_usage = __esm(() => {
  init_login();
  init_extra_usage_core();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { call, init_extra_usage };

//# debugId=EDF22FB442F6FA8764756E2164756E21
//# sourceMappingURL=chunk-2e3xxtq5.js.map
