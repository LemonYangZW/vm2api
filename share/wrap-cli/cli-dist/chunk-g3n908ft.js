// @bun
import {
  callBreakCache,
  init_break_cache
} from "./chunk-833fsr7s.js";
import {
  Dialog,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  use_input_default
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-c5g9shkw.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/break-cache/panel.tsx
async function runBreakCacheAction(scope, onDone) {
  const result = await callBreakCache(scope);
  if (result.type === "text") {
    onDone(result.value, { display: "system" });
  }
}
function BreakCachePanel({ onDone }) {
  const [selectedIndex, setSelectedIndex] = import_react.useState(0);
  const actions = import_react.useMemo(() => [
    {
      label: "Status",
      description: "Show pending marker, always mode, and break count",
      run: () => void runBreakCacheAction("status", onDone)
    },
    {
      label: "Once",
      description: "Break prompt cache on the next API call only",
      run: () => void runBreakCacheAction("once", onDone)
    },
    {
      label: "Always",
      description: "Break prompt cache on every API call",
      run: () => void runBreakCacheAction("always", onDone)
    },
    {
      label: "Off",
      description: "Disable always mode and clear pending once marker",
      run: () => void runBreakCacheAction("off", onDone)
    },
    {
      label: "Clear Once",
      description: "Cancel the pending one-time cache break",
      run: () => void runBreakCacheAction("--clear", onDone)
    }
  ], [onDone]);
  const selectCurrent = () => {
    const action = actions[selectedIndex];
    if (!action)
      return;
    action.run();
  };
  use_input_default((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((index) => Math.max(0, index - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((index) => Math.min(actions.length - 1, index + 1));
      return;
    }
    if (key.return) {
      selectCurrent();
    }
  });
  return /* @__PURE__ */ jsx_runtime.jsx(Dialog, {
    title: "Break Cache",
    subtitle: `${actions.length} actions`,
    onCancel: () => onDone("Break-cache panel dismissed", { display: "system" }),
    color: "background",
    hideInputGuide: true,
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        actions.map((action, index) => /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          flexDirection: "row",
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: `${index === selectedIndex ? "\u203A" : " "} ${action.label}`.padEnd(ACTION_LABEL_COLUMN_WIDTH)
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: action.description
            })
          ]
        }, action.label)),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "\u2191/\u2193 select \xB7 Enter run \xB7 Esc close"
          })
        })
      ]
    })
  });
}
async function call(onDone, _context, args) {
  const trimmed = args?.trim() ?? "";
  if (trimmed) {
    await runBreakCacheAction(trimmed, onDone);
    return null;
  }
  return /* @__PURE__ */ jsx_runtime.jsx(BreakCachePanel, {
    onDone
  });
}
var import_react, jsx_runtime, ACTION_LABEL_COLUMN_WIDTH = 28;
var init_panel = __esm(() => {
  init_src();
  init_break_cache();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});
init_panel();

export {
  call
};

//# debugId=97481F8A56F4A9C364756E2164756E21
//# sourceMappingURL=chunk-g3n908ft.js.map
