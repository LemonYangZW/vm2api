// @bun
import {
  init_systemTheme,
  resolveThemeSetting
} from "./chunk-d2an0138.js";
import {
  init_AppState,
  useAppState,
  useSetAppState
} from "./chunk-mxbn7v69.js";
import {
  init_useKeybinding
} from "./chunk-2m7k0qdy.js";
import {
  FAST_MODE_MODEL_DISPLAY,
  LIGHTNING_BOLT,
  clearFastModeCooldown,
  formatModelPricing,
  getFastModeModel,
  getFastModeRuntimeState,
  getFastModeUnavailableReason,
  getGlobalConfig,
  getOpus46CostTier,
  init_config1 as init_config,
  init_fastMode,
  init_figures,
  init_modelCost,
  init_settings1 as init_settings,
  isFastModeEnabled,
  isFastModeSupportedByModel,
  prefetchFastModeStatus,
  updateSettingsForSource
} from "./chunk-mhtd3kea.js";
import {
  formatDuration,
  init_format
} from "./chunk-v5yhfnx0.js";
import {
  Dialog,
  Link,
  ThemedBox_default,
  ThemedText,
  color,
  init_source,
  init_src,
  require_react,
  source_default,
  useKeybindings
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/FastIcon.tsx
function FastIcon({ cooldown }) {
  if (cooldown) {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
      color: "promptBorder",
      dimColor: true,
      children: LIGHTNING_BOLT
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
    color: "fastMode",
    children: LIGHTNING_BOLT
  });
}
function getFastIconString(applyColor = true, cooldown = false) {
  if (!applyColor) {
    return LIGHTNING_BOLT;
  }
  const themeName = resolveThemeSetting(getGlobalConfig().theme);
  if (cooldown) {
    return source_default.dim(color("promptBorder", themeName)(LIGHTNING_BOLT));
  }
  return color("fastMode", themeName)(LIGHTNING_BOLT);
}
var jsx_runtime;
var init_FastIcon = __esm(() => {
  init_source();
  init_figures();
  init_src();
  init_config();
  init_systemTheme();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/fast/fast.tsx
function applyFastMode(enable, setAppState) {
  clearFastModeCooldown();
  updateSettingsForSource("userSettings", {
    fastMode: enable ? true : undefined
  });
  if (enable) {
    setAppState((prev) => {
      const needsModelSwitch = !isFastModeSupportedByModel(prev.mainLoopModel);
      return {
        ...prev,
        ...needsModelSwitch ? { mainLoopModel: getFastModeModel(), mainLoopModelForSession: null } : {},
        fastMode: true
      };
    });
  } else {
    setAppState((prev) => ({ ...prev, fastMode: false }));
  }
}
function FastModePicker({
  onDone,
  unavailableReason
}) {
  const model = useAppState((s) => s.mainLoopModel);
  const initialFastMode = useAppState((s) => s.fastMode);
  const setAppState = useSetAppState();
  const [enableFastMode, setEnableFastMode] = import_react.useState(initialFastMode ?? false);
  const runtimeState = getFastModeRuntimeState();
  const isCooldown = runtimeState.status === "cooldown";
  const isUnavailable = unavailableReason !== null;
  const pricing = formatModelPricing(getOpus46CostTier(true));
  function handleConfirm() {
    if (isUnavailable)
      return;
    applyFastMode(enableFastMode, setAppState);
    logEvent("tengu_fast_mode_toggled", {
      enabled: enableFastMode,
      source: "picker"
    });
    if (enableFastMode) {
      const fastIcon = getFastIconString(enableFastMode);
      const modelUpdated = !isFastModeSupportedByModel(model) ? ` \xB7 model set to ${FAST_MODE_MODEL_DISPLAY}` : "";
      onDone(`${fastIcon} Fast mode ON${modelUpdated} \xB7 ${pricing}`);
    } else {
      setAppState((prev) => ({ ...prev, fastMode: false }));
      onDone(`Fast mode OFF`);
    }
  }
  function handleCancel() {
    if (isUnavailable) {
      if (initialFastMode) {
        applyFastMode(false, setAppState);
      }
      onDone("Fast mode OFF", { display: "system" });
      return;
    }
    const message = initialFastMode ? `${getFastIconString()} Kept Fast mode ON` : `Kept Fast mode OFF`;
    onDone(message, { display: "system" });
  }
  function handleToggle() {
    if (isUnavailable)
      return;
    setEnableFastMode((prev) => !prev);
  }
  useKeybindings({
    "confirm:yes": handleConfirm,
    "confirm:nextField": handleToggle,
    "confirm:next": handleToggle,
    "confirm:previous": handleToggle,
    "confirm:cycleMode": handleToggle,
    "confirm:toggle": handleToggle
  }, { context: "Confirmation" });
  const title = /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
    children: [
      /* @__PURE__ */ jsx_runtime2.jsx(FastIcon, {
        cooldown: isCooldown
      }),
      " Fast mode (research preview)"
    ]
  });
  return /* @__PURE__ */ jsx_runtime2.jsxs(Dialog, {
    title,
    subtitle: `High-speed mode for ${FAST_MODE_MODEL_DISPLAY}. Billed as extra usage at a premium rate. Separate rate limits apply.`,
    onCancel: handleCancel,
    color: "fastMode",
    inputGuide: (exitState) => exitState.pending ? /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }) : isUnavailable ? /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
      children: "Esc to cancel"
    }) : /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
      children: "Tab to toggle \xB7 Enter to confirm \xB7 Esc to cancel"
    }),
    children: [
      unavailableReason ? /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
        marginLeft: 2,
        children: /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
          color: "error",
          children: unavailableReason
        })
      }) : /* @__PURE__ */ jsx_runtime2.jsxs(jsx_runtime2.Fragment, {
        children: [
          /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
            flexDirection: "column",
            gap: 0,
            marginLeft: 2,
            children: /* @__PURE__ */ jsx_runtime2.jsxs(ThemedBox_default, {
              flexDirection: "row",
              gap: 2,
              children: [
                /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
                  bold: true,
                  children: "Fast mode"
                }),
                /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
                  color: enableFastMode ? "fastMode" : undefined,
                  bold: enableFastMode,
                  children: enableFastMode ? "ON " : "OFF"
                }),
                /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
                  dimColor: true,
                  children: pricing
                })
              ]
            })
          }),
          isCooldown && runtimeState.status === "cooldown" && /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
            marginLeft: 2,
            children: /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
              color: "warning",
              children: [
                runtimeState.reason === "overloaded" ? "Fast mode overloaded and is temporarily unavailable" : "You've hit your fast limit",
                " \xB7 resets in ",
                formatDuration(runtimeState.resetAt - Date.now(), {
                  hideTrailingZeros: true
                })
              ]
            })
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Learn more:",
          " ",
          /* @__PURE__ */ jsx_runtime2.jsx(Link, {
            url: "https://code.claude.com/docs/en/fast-mode",
            children: "https://code.claude.com/docs/en/fast-mode"
          })
        ]
      })
    ]
  });
}
async function handleFastModeShortcut(enable, getAppState, setAppState) {
  const unavailableReason = getFastModeUnavailableReason();
  if (unavailableReason) {
    return `Fast mode unavailable: ${unavailableReason}`;
  }
  const { mainLoopModel } = getAppState();
  applyFastMode(enable, setAppState);
  logEvent("tengu_fast_mode_toggled", {
    enabled: enable,
    source: "shortcut"
  });
  if (enable) {
    const fastIcon = getFastIconString(true);
    const modelUpdated = !isFastModeSupportedByModel(mainLoopModel) ? ` \xB7 model set to ${FAST_MODE_MODEL_DISPLAY}` : "";
    const pricing = formatModelPricing(getOpus46CostTier(true));
    return `${fastIcon} Fast mode ON${modelUpdated} \xB7 ${pricing}`;
  } else {
    return `Fast mode OFF`;
  }
}
async function call(onDone, context, args) {
  if (!isFastModeEnabled()) {
    return null;
  }
  await prefetchFastModeStatus();
  const arg = args?.trim().toLowerCase();
  if (arg === "on" || arg === "off") {
    const result = await handleFastModeShortcut(arg === "on", context.getAppState, context.setAppState);
    onDone(result);
    return null;
  }
  const unavailableReason = getFastModeUnavailableReason();
  logEvent("tengu_fast_mode_picker_shown", {
    unavailable_reason: unavailableReason ?? ""
  });
  return /* @__PURE__ */ jsx_runtime2.jsx(FastModePicker, {
    onDone,
    unavailableReason
  });
}
var import_react, jsx_runtime2;
var init_fast = __esm(() => {
  init_src();
  init_FastIcon();
  init_src();
  init_useKeybinding();
  init_analytics();
  init_AppState();
  init_fastMode();
  init_format();
  init_modelCost();
  init_settings();
  import_react = __toESM(require_react(), 1);
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
});

export { getFastIconString, init_FastIcon, FastModePicker, call, init_fast };

//# debugId=0C558489A708701A64756E2164756E21
//# sourceMappingURL=chunk-k4pca9xr.js.map
