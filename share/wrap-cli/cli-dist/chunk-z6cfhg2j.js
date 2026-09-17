// @bun
import {
  Select,
  StructuredDiff,
  getColorModuleUnavailableReason,
  getSyntaxTheme,
  gracefulShutdown,
  init_AppState,
  init_CustomSelect,
  init_KeybindingContext,
  init_StructuredDiff,
  init_colorDiff,
  init_gracefulShutdown,
  init_useShortcutDisplay,
  useAppState,
  useSetAppState,
  useShortcutDisplay
} from "./chunk-mxbn7v69.js";
import {
  init_useTerminalSize
} from "./chunk-2vk6e88k.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-n1j46ncq.js";
import {
  init_useKeybinding
} from "./chunk-2m7k0qdy.js";
import {
  init_settings1 as init_settings,
  updateSettingsForSource
} from "./chunk-mhtd3kea.js";
import {
  Byline,
  KeyboardShortcutHint,
  ThemedBox_default,
  ThemedText,
  init_src,
  useKeybinding,
  usePreviewTheme,
  useRegisterKeybindingContext,
  useTerminalSize,
  useTheme,
  useThemeSetting
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/ThemePicker.tsx
function ThemePicker({
  onThemeSelect,
  showIntroText = false,
  helpText = "",
  showHelpTextBelow = false,
  hideEscToCancel = false,
  skipExitHandling = false,
  onCancel: onCancelProp
}) {
  const [theme] = useTheme();
  const themeSetting = useThemeSetting();
  const { columns } = useTerminalSize();
  const colorModuleUnavailableReason = getColorModuleUnavailableReason();
  const syntaxTheme = colorModuleUnavailableReason === null ? getSyntaxTheme(theme) : null;
  const { setPreviewTheme, savePreview, cancelPreview } = usePreviewTheme();
  const syntaxHighlightingDisabled = useAppState((s) => s.settings.syntaxHighlightingDisabled) ?? false;
  const setAppState = useSetAppState();
  useRegisterKeybindingContext("ThemePicker");
  const syntaxToggleShortcut = useShortcutDisplay("theme:toggleSyntaxHighlighting", "ThemePicker", "ctrl+t");
  useKeybinding("theme:toggleSyntaxHighlighting", () => {
    if (colorModuleUnavailableReason === null) {
      const newValue = !syntaxHighlightingDisabled;
      updateSettingsForSource("userSettings", {
        syntaxHighlightingDisabled: newValue
      });
      setAppState((prev) => ({
        ...prev,
        settings: { ...prev.settings, syntaxHighlightingDisabled: newValue }
      }));
    }
  }, { context: "ThemePicker" });
  const exitState = useExitOnCtrlCDWithKeybindings(skipExitHandling ? () => {} : undefined);
  const themeOptions = [
    ...[],
    { label: "Dark mode", value: "dark" },
    { label: "Light mode", value: "light" },
    {
      label: "Dark mode (colorblind-friendly)",
      value: "dark-daltonized"
    },
    {
      label: "Light mode (colorblind-friendly)",
      value: "light-daltonized"
    },
    {
      label: "Dark mode (ANSI colors only)",
      value: "dark-ansi"
    },
    {
      label: "Light mode (ANSI colors only)",
      value: "light-ansi"
    }
  ];
  const content = /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    gap: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          showIntroText ? /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "Let's get started."
          }) : /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "permission",
            children: "Theme"
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                bold: true,
                children: "Choose the text style that looks best with your terminal"
              }),
              helpText && !showHelpTextBelow && /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: helpText
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(Select, {
            options: themeOptions,
            onFocus: (setting) => {
              setPreviewTheme(setting);
            },
            onChange: (setting) => {
              savePreview();
              onThemeSelect(setting);
            },
            onCancel: skipExitHandling ? () => {
              cancelPreview();
              onCancelProp?.();
            } : async () => {
              cancelPreview();
              await gracefulShutdown(0);
            },
            visibleOptionCount: themeOptions.length,
            defaultValue: themeSetting,
            defaultFocusValue: themeSetting
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        width: "100%",
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            flexDirection: "column",
            borderTop: true,
            borderBottom: true,
            borderLeft: false,
            borderRight: false,
            borderStyle: "dashed",
            borderColor: "subtle",
            children: /* @__PURE__ */ jsx_runtime.jsx(StructuredDiff, {
              patch: {
                oldStart: 1,
                newStart: 1,
                oldLines: 3,
                newLines: 3,
                lines: [
                  " function greet() {",
                  '-  console.log("Hello, World!");',
                  '+  console.log("Hello, Claude!");',
                  " }"
                ]
              },
              dim: false,
              filePath: "demo.js",
              firstLine: null,
              width: columns
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            dimColor: true,
            children: [
              " ",
              colorModuleUnavailableReason === "env" ? `Syntax highlighting disabled (via CLAUDE_CODE_SYNTAX_HIGHLIGHT=${process.env.CLAUDE_CODE_SYNTAX_HIGHLIGHT})` : syntaxHighlightingDisabled ? `Syntax highlighting disabled (${syntaxToggleShortcut} to enable)` : syntaxTheme ? `Syntax theme: ${syntaxTheme.theme}${syntaxTheme.source ? ` (from ${syntaxTheme.source})` : ""} (${syntaxToggleShortcut} to disable)` : `Syntax highlighting enabled (${syntaxToggleShortcut} to disable)`
            ]
          })
        ]
      })
    ]
  });
  if (!showIntroText) {
    return /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          flexDirection: "column",
          children: content
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          marginTop: 1,
          children: [
            showHelpTextBelow && helpText && /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
              marginLeft: 3,
              children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: helpText
              })
            }),
            !hideEscToCancel && /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
              children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
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
                      action: "select"
                    }),
                    /* @__PURE__ */ jsx_runtime.jsx(KeyboardShortcutHint, {
                      shortcut: "Esc",
                      action: "cancel"
                    })
                  ]
                })
              })
            })
          ]
        })
      ]
    });
  }
  return content;
}
var jsx_runtime;
var init_ThemePicker = __esm(() => {
  init_useExitOnCtrlCDWithKeybindings();
  init_useTerminalSize();
  init_src();
  init_KeybindingContext();
  init_useKeybinding();
  init_useShortcutDisplay();
  init_AppState();
  init_gracefulShutdown();
  init_settings();
  init_CustomSelect();
  init_src();
  init_colorDiff();
  init_StructuredDiff();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { ThemePicker, init_ThemePicker };

//# debugId=85D272D3E8E9240964756E2164756E21
//# sourceMappingURL=chunk-z6cfhg2j.js.map
