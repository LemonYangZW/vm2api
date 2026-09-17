// @bun
import {
  ConfigurableShortcutHint,
  Select,
  capitalize_default,
  convertEffortValueToLevel,
  getDefaultEffortForModel,
  getDisplayedEffortLevel,
  getModelOptions,
  init_AppState,
  init_ConfigurableShortcutHint,
  init_CustomSelect,
  init_capitalize,
  init_effort,
  init_modelOptions,
  modelSupportsEffort,
  modelSupportsMaxEffort,
  modelSupportsXhighEffort,
  resolvePickerEffortPersistence,
  toPersistableEffort,
  useAppState,
  useSetAppState
} from "./chunk-mxbn7v69.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-n1j46ncq.js";
import {
  init_useKeybinding
} from "./chunk-2m7k0qdy.js";
import {
  EFFORT_HIGH,
  EFFORT_LOW,
  EFFORT_MAX,
  EFFORT_MEDIUM,
  EFFORT_XHIGH,
  FAST_MODE_MODEL_DISPLAY,
  getDefaultMainLoopModel,
  getSettingsForSource,
  has1mContext,
  init_auth,
  init_context,
  init_fastMode,
  init_figures,
  init_model,
  init_settings1 as init_settings,
  isClaudeAISubscriber,
  isFastModeAvailable,
  isFastModeCooldown,
  isFastModeEnabled,
  modelDisplayString,
  parseUserSpecifiedModel,
  updateSettingsForSource
} from "./chunk-mhtd3kea.js";
import {
  Byline,
  KeyboardShortcutHint,
  Pane,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
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

// src/components/EffortIndicator.ts
function getEffortNotificationText(effortValue, model) {
  if (!modelSupportsEffort(model))
    return;
  const level = getDisplayedEffortLevel(model, effortValue);
  return `${effortLevelToSymbol(level)} ${level} \xB7 /effort`;
}
function effortLevelToSymbol(level) {
  switch (level) {
    case "low":
      return EFFORT_LOW;
    case "medium":
      return EFFORT_MEDIUM;
    case "high":
      return EFFORT_HIGH;
    case "xhigh":
      return EFFORT_XHIGH;
    case "max":
      return EFFORT_MAX;
    default:
      return EFFORT_HIGH;
  }
}
var init_EffortIndicator = __esm(() => {
  init_figures();
  init_effort();
});

// src/components/ModelPicker.tsx
function ModelPicker({
  initial,
  sessionModel,
  onSelect,
  onCancel,
  isStandaloneCommand,
  showFastModeNotice,
  headerText,
  skipSettingsWrite
}) {
  const setAppState = useSetAppState();
  const exitState = useExitOnCtrlCDWithKeybindings();
  const maxVisible = 10;
  const initialValue = initial === null ? NO_PREFERENCE : initial;
  const [focusedValue, setFocusedValue] = import_react.useState(initialValue);
  const isFastMode = useAppState((s) => isFastModeEnabled() ? s.fastMode : false);
  const [marked1MValues, setMarked1MValues] = import_react.useState(() => new Set(has1mContext(initialValue) ? [initialValue.replace(/\[1m\]/i, "")] : []));
  const handleToggle1M = import_react.useCallback(() => {
    if (!focusedValue || focusedValue === NO_PREFERENCE)
      return;
    const baseKey = focusedValue.replace(/\[1m\]/i, "");
    setMarked1MValues((prev) => {
      const next = new Set(prev);
      if (next.has(baseKey)) {
        next.delete(baseKey);
      } else {
        next.add(baseKey);
      }
      return next;
    });
  }, [focusedValue]);
  const [hasToggledEffort, setHasToggledEffort] = import_react.useState(false);
  const effortValue = useAppState((s) => s.effortValue);
  const [effort, setEffort] = import_react.useState(effortValue !== undefined ? convertEffortValueToLevel(effortValue) : undefined);
  const modelOptions = import_react.useMemo(() => getModelOptions(isFastMode ?? false), [isFastMode]);
  const optionsWithInitial = import_react.useMemo(() => {
    if (initial !== null && !modelOptions.some((opt) => opt.value === initial)) {
      return [
        ...modelOptions,
        {
          value: initial,
          label: modelDisplayString(initial),
          description: "Current model"
        }
      ];
    }
    return modelOptions;
  }, [modelOptions, initial]);
  const selectOptions = import_react.useMemo(() => optionsWithInitial.map((opt) => ({
    ...opt,
    value: opt.value === null ? NO_PREFERENCE : opt.value
  })), [optionsWithInitial]);
  const initialFocusValue = import_react.useMemo(() => selectOptions.some((_) => _.value === initialValue) ? initialValue : selectOptions[0]?.value ?? undefined, [selectOptions, initialValue]);
  const visibleCount = Math.min(maxVisible, selectOptions.length);
  const hiddenCount = Math.max(0, selectOptions.length - visibleCount);
  const focusedModelName = selectOptions.find((opt) => opt.value === focusedValue)?.label;
  const focusedModel = resolveOptionModel(focusedValue);
  const is1MMarked = focusedValue !== undefined && focusedValue !== NO_PREFERENCE && marked1MValues.has(focusedValue.replace(/\[1m\]/i, ""));
  const focusedSupportsEffort = focusedModel ? modelSupportsEffort(focusedModel) : false;
  const focusedSupportsXhigh = focusedModel ? modelSupportsXhighEffort(focusedModel) : false;
  const focusedSupportsMax = focusedModel ? modelSupportsMaxEffort(focusedModel) : false;
  const focusedDefaultEffort = getDefaultEffortLevelForOption(focusedValue);
  const displayEffort = effort === "max" && !focusedSupportsMax ? focusedSupportsXhigh ? "xhigh" : "high" : effort === "xhigh" && !focusedSupportsXhigh ? "high" : effort;
  const handleFocus = import_react.useCallback((value) => {
    setFocusedValue(value);
    if (!hasToggledEffort && effortValue === undefined) {
      setEffort(getDefaultEffortLevelForOption(value));
    }
  }, [hasToggledEffort, effortValue]);
  const handleCycleEffort = import_react.useCallback((direction) => {
    if (!focusedSupportsEffort)
      return;
    setEffort((prev) => cycleEffortLevel(prev ?? focusedDefaultEffort, direction, focusedSupportsXhigh, focusedSupportsMax));
    setHasToggledEffort(true);
  }, [focusedSupportsEffort, focusedSupportsXhigh, focusedSupportsMax, focusedDefaultEffort]);
  useKeybindings({
    "modelPicker:decreaseEffort": () => handleCycleEffort("left"),
    "modelPicker:increaseEffort": () => handleCycleEffort("right"),
    "modelPicker:toggle1M": () => handleToggle1M()
  }, { context: "ModelPicker" });
  function handleSelect(value) {
    logEvent("tengu_model_command_menu_effort", {
      effort
    });
    if (!skipSettingsWrite) {
      const effortLevel = resolvePickerEffortPersistence(effort, getDefaultEffortLevelForOption(value), getSettingsForSource("userSettings")?.effortLevel, hasToggledEffort);
      const persistable = toPersistableEffort(effortLevel);
      if (persistable !== undefined) {
        updateSettingsForSource("userSettings", { effortLevel: persistable });
      }
      setAppState((prev) => ({ ...prev, effortValue: effortLevel }));
    }
    const selectedModel = resolveOptionModel(value);
    const selectedEffort = hasToggledEffort && selectedModel && modelSupportsEffort(selectedModel) ? effort : undefined;
    if (value === NO_PREFERENCE) {
      onSelect(null, selectedEffort);
      return;
    }
    const baseValue = value.replace(/\[1m\]/i, "");
    const wants1M = marked1MValues.has(baseValue);
    const finalValue = wants1M ? `${baseValue}[1m]` : baseValue;
    onSelect(finalValue, selectedEffort);
  }
  const content = /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            marginBottom: 1,
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                color: "remember",
                bold: true,
                children: "Select model"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: headerText ?? "Choose a model for this and future sessions. Use \u2190 \u2192 to adjust effort, Space to toggle 1M context."
              }),
              sessionModel && /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  "Currently using ",
                  modelDisplayString(sessionModel),
                  " for this session (set by plan mode). Selecting a model will undo this."
                ]
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
                flexDirection: "column",
                children: /* @__PURE__ */ jsx_runtime.jsx(Select, {
                  defaultValue: initialValue,
                  defaultFocusValue: initialFocusValue,
                  options: selectOptions,
                  onChange: handleSelect,
                  onFocus: handleFocus,
                  onCancel: onCancel ?? (() => {}),
                  visibleOptionCount: visibleCount
                })
              }),
              hiddenCount > 0 && /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
                paddingLeft: 3,
                children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                  dimColor: true,
                  children: [
                    "and ",
                    hiddenCount,
                    " more\u2026"
                  ]
                })
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            marginBottom: 1,
            flexDirection: "column",
            children: [
              focusedSupportsEffort ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsx_runtime.jsx(EffortLevelIndicator, {
                    effort: displayEffort
                  }),
                  " ",
                  capitalize_default(displayEffort),
                  " effort",
                  displayEffort === focusedDefaultEffort ? ` (default)` : ``,
                  " ",
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    color: "subtle",
                    children: "\u2190 \u2192 to adjust"
                  })
                ]
              }) : /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                color: "subtle",
                children: [
                  /* @__PURE__ */ jsx_runtime.jsx(EffortLevelIndicator, {
                    effort: undefined
                  }),
                  " Effort not supported",
                  focusedModelName ? ` for ${focusedModelName}` : ""
                ]
              }),
              is1MMarked ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsx_runtime.jsx(EffortLevelIndicator, {
                    effort: "high"
                  }),
                  " 1M context on",
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    color: "subtle",
                    children: " \xB7 Space to toggle"
                  })
                ]
              }) : /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                color: "subtle",
                children: [
                  /* @__PURE__ */ jsx_runtime.jsx(EffortLevelIndicator, {
                    effort: undefined
                  }),
                  " 1M context off",
                  focusedModelName ? ` for ${focusedModelName}` : "",
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    color: "subtle",
                    children: " \xB7 Space to toggle"
                  })
                ]
              })
            ]
          }),
          isFastModeEnabled() ? showFastModeNotice ? /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            marginBottom: 1,
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor: true,
              children: [
                "Fast mode is ",
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  bold: true,
                  children: "ON"
                }),
                " and available with ",
                FAST_MODE_MODEL_DISPLAY,
                " only (/fast). Switching to other models turn off fast mode."
              ]
            })
          }) : isFastModeAvailable() && !isFastModeCooldown() ? /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            marginBottom: 1,
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor: true,
              children: [
                "Use ",
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  bold: true,
                  children: "/fast"
                }),
                " to turn on Fast mode (",
                FAST_MODE_MODEL_DISPLAY,
                " only)."
              ]
            })
          }) : null : null
        ]
      }),
      isStandaloneCommand && /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        dimColor: true,
        italic: true,
        children: exitState.pending ? /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
          children: [
            "Press ",
            exitState.keyName,
            " again to exit"
          ]
        }) : /* @__PURE__ */ jsx_runtime.jsxs(Byline, {
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(KeyboardShortcutHint, {
              shortcut: "Enter",
              action: "confirm"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ConfigurableShortcutHint, {
              action: "select:cancel",
              context: "Select",
              fallback: "Esc",
              description: "exit"
            })
          ]
        })
      })
    ]
  });
  if (!isStandaloneCommand) {
    return content;
  }
  return /* @__PURE__ */ jsx_runtime.jsx(Pane, {
    color: "permission",
    children: content
  });
}
function resolveOptionModel(value) {
  if (!value)
    return;
  return value === NO_PREFERENCE ? getDefaultMainLoopModel() : parseUserSpecifiedModel(value);
}
function EffortLevelIndicator({ effort }) {
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
    color: effort ? "claude" : "subtle",
    children: effortLevelToSymbol(effort ?? "low")
  });
}
function cycleEffortLevel(current, direction, includeXhigh, includeMax) {
  const levels = [
    "low",
    "medium",
    "high",
    ...includeXhigh ? ["xhigh"] : [],
    ...includeMax ? ["max"] : []
  ];
  const idx = levels.indexOf(current);
  const currentIndex = idx !== -1 ? idx : levels.indexOf("high");
  if (direction === "right") {
    return levels[(currentIndex + 1) % levels.length];
  } else {
    return levels[(currentIndex - 1 + levels.length) % levels.length];
  }
}
function getDefaultEffortLevelForOption(value) {
  const resolved = resolveOptionModel(value) ?? getDefaultMainLoopModel();
  const defaultValue = getDefaultEffortForModel(resolved);
  return defaultValue !== undefined ? convertEffortValueToLevel(defaultValue) : "high";
}
var import_react, jsx_runtime, NO_PREFERENCE = "__NO_PREFERENCE__";
var init_ModelPicker = __esm(() => {
  init_capitalize();
  init_context();
  init_useExitOnCtrlCDWithKeybindings();
  init_analytics();
  init_fastMode();
  init_src();
  init_useKeybinding();
  init_AppState();
  init_effort();
  init_model();
  init_modelOptions();
  init_settings();
  init_ConfigurableShortcutHint();
  init_CustomSelect();
  init_src();
  init_EffortIndicator();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/utils/extraUsage.ts
function isBilledAsExtraUsage(model, isFastMode, isOpus1mMerged) {
  if (!isClaudeAISubscriber())
    return false;
  if (isFastMode)
    return true;
  if (model === null || !has1mContext(model))
    return false;
  const m = model.toLowerCase().replace(/\[1m\]$/, "").trim();
  const isOpus46 = m === "opus" || m.includes("opus-4-6") || m.includes("opus-4-7");
  const isSonnet46 = m === "sonnet" || m.includes("sonnet-4-6");
  if (isOpus46 && isOpus1mMerged)
    return false;
  return isOpus46 || isSonnet46;
}
var init_extraUsage = __esm(() => {
  init_auth();
  init_context();
});

export { getEffortNotificationText, effortLevelToSymbol, init_EffortIndicator, ModelPicker, init_ModelPicker, isBilledAsExtraUsage, init_extraUsage };

//# debugId=FD40F146944F696164756E2164756E21
//# sourceMappingURL=chunk-frz996fy.js.map
