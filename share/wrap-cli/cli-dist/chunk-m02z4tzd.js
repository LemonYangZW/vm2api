// @bun
import {
  require_react
} from "./chunk-1ekct4sm.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/_shared/launchCommand.ts
function launchCommand(opts) {
  return async (onDone, context, args) => {
    const parsed = opts.parseArgs(args ?? "");
    if (isInvalid(parsed)) {
      onDone(`Invalid args: ${parsed.reason}`, { display: "system" });
      return opts.errorView(parsed.reason);
    }
    try {
      const viewProps = await opts.dispatch(parsed, onDone, context);
      if (viewProps === null)
        return null;
      return import_react.default.createElement(opts.View, viewProps);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      opts.onDispatchError?.(err);
      onDone(`${opts.commandName} failed: ${msg}`, { display: "system" });
      return opts.errorView(msg);
    }
  };
}
function isInvalid(parsed) {
  return typeof parsed === "object" && parsed !== null && "action" in parsed && parsed.action === "invalid";
}
var import_react;
var init_launchCommand = __esm(() => {
  import_react = __toESM(require_react(), 1);
});

export { launchCommand, init_launchCommand };

//# debugId=C75078BB602EF8A664756E2164756E21
//# sourceMappingURL=chunk-m02z4tzd.js.map
