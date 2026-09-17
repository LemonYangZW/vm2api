// @bun
import {
  callTui,
  init_tui
} from "./chunk-ffq9eh6d.js";
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

// src/commands/tui/panel.tsx
async function runTuiAction(subcommand, onDone) {
  const result = await callTui(subcommand);
  if (result.type === "text") {
    onDone(result.value, { display: "system" });
  }
}
function TuiPanel({ onDone }) {
  const [selectedIndex, setSelectedIndex] = import_react.useState(0);
  const actions = import_react.useMemo(() => [
    {
      label: "Status",
      description: "Show marker and environment override state",
      run: () => void runTuiAction("status", onDone)
    },
    {
      label: "Toggle",
      description: "Flip persisted TUI mode for the next session",
      run: () => void runTuiAction("toggle", onDone)
    },
    {
      label: "On",
      description: "Enable flicker-free alternate-screen mode",
      run: () => void runTuiAction("on", onDone)
    },
    {
      label: "Off",
      description: "Disable flicker-free alternate-screen mode",
      run: () => void runTuiAction("off", onDone)
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
    title: "TUI Mode",
    subtitle: `${actions.length} actions`,
    onCancel: () => onDone("TUI mode panel dismissed", { display: "system" }),
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
    await runTuiAction(trimmed, onDone);
    return null;
  }
  return /* @__PURE__ */ jsx_runtime.jsx(TuiPanel, {
    onDone
  });
}
var import_react, jsx_runtime, ACTION_LABEL_COLUMN_WIDTH = 24;
var init_panel = __esm(() => {
  init_src();
  init_tui();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});
init_panel();

export {
  call
};

//# debugId=F7D7F72840DE82E564756E2164756E21
//# sourceMappingURL=chunk-17qfvz4c.js.map
