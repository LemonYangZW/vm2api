// @bun
import {
  init_loadUserBindings,
  init_useShortcutDisplay,
  isKeybindingCustomizationEnabled,
  useShortcutDisplay
} from "./chunk-mxbn7v69.js";
import {
  hasUsedBackslashReturn,
  init_terminalSetup,
  isShiftEnterKeyBindingInstalled
} from "./chunk-0kjcxppf.js";
import {
  getGlobalConfig,
  init_config1 as init_config,
  init_fastMode,
  init_growthbook,
  isFastModeAvailable,
  isFastModeEnabled
} from "./chunk-mhtd3kea.js";
import {
  getPlatform,
  init_platform
} from "./chunk-psygyacq.js";
import {
  env,
  init_env
} from "./chunk-kkpmm4b2.js";
import {
  ThemedBox_default,
  ThemedText,
  init_src
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/PromptInput/utils.ts
function isVimModeEnabled() {
  const config = getGlobalConfig();
  return config.editorMode === "vim";
}
function getNewlineInstructions() {
  if (env.terminal === "Apple_Terminal" && process.platform === "darwin") {
    return "shift + \u23CE for newline";
  }
  if (isShiftEnterKeyBindingInstalled()) {
    return "shift + \u23CE for newline";
  }
  return hasUsedBackslashReturn() ? "\\\u23CE for newline" : "backslash (\\) + return (\u23CE) for newline";
}
function isNonSpacePrintable(input, key) {
  if (key.ctrl || key.meta || key.escape || key.return || key.tab || key.backspace || key.delete || key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.pageUp || key.pageDown || key.home || key.end) {
    return false;
  }
  return input.length > 0 && !/^\s/.test(input) && !input.startsWith("\x1B");
}
var init_utils = __esm(() => {
  init_terminalSetup();
  init_config();
  init_env();
});

// src/components/PromptInput/PromptInputHelpMenu.tsx
function formatShortcut(shortcut) {
  return shortcut.replace(/\+/g, " + ");
}
function PromptInputHelpMenu(props) {
  const { dimColor, fixedWidth, gap, paddingX } = props;
  const transcriptShortcut = formatShortcut(useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o"));
  const todosShortcut = formatShortcut(useShortcutDisplay("app:toggleTodos", "Global", "ctrl+t"));
  const undoShortcut = formatShortcut(useShortcutDisplay("chat:undo", "Chat", "ctrl+_"));
  const stashShortcut = formatShortcut(useShortcutDisplay("chat:stash", "Chat", "ctrl+s"));
  const cycleModeShortcut = formatShortcut(useShortcutDisplay("chat:cycleMode", "Chat", "shift+tab"));
  const modelPickerShortcut = formatShortcut(useShortcutDisplay("chat:modelPicker", "Chat", "alt+p"));
  const fastModeShortcut = formatShortcut(useShortcutDisplay("chat:fastMode", "Chat", "alt+o"));
  const externalEditorShortcut = formatShortcut(useShortcutDisplay("chat:externalEditor", "Chat", "ctrl+g"));
  const terminalShortcut = formatShortcut(useShortcutDisplay("app:toggleTerminal", "Global", "meta+j"));
  const imagePasteShortcut = formatShortcut(useShortcutDisplay("chat:imagePaste", "Chat", "ctrl+v"));
  const terminalShortcutElement = null;
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    paddingX,
    flexDirection: "row",
    gap,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        width: fixedWidth ? 24 : undefined,
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor,
              children: "! for bash mode"
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor,
              children: "/ for commands"
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor,
              children: "@ for file paths"
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor,
              children: "& for background"
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor,
              children: "/btw for side question"
            })
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        width: fixedWidth ? 35 : undefined,
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor,
              children: "double tap esc to clear input"
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor,
              children: [
                cycleModeShortcut,
                " ",
                process.env.USER_TYPE === "ant" ? "to cycle modes" : "to auto-accept edits"
              ]
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor,
              children: [
                transcriptShortcut,
                " for verbose output"
              ]
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor,
              children: [
                todosShortcut,
                " to toggle tasks"
              ]
            })
          }),
          terminalShortcutElement,
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor,
              children: getNewlineInstructions()
            })
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor,
              children: [
                undoShortcut,
                " to undo"
              ]
            })
          }),
          getPlatform() !== "windows" && /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor,
              children: "ctrl + z to suspend"
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor,
              children: [
                imagePasteShortcut,
                " to paste images"
              ]
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor,
              children: [
                modelPickerShortcut,
                " to switch model"
              ]
            })
          }),
          isFastModeEnabled() && isFastModeAvailable() && /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor,
              children: [
                fastModeShortcut,
                " to toggle fast mode"
              ]
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor,
              children: [
                stashShortcut,
                " to stash prompt"
              ]
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor,
              children: [
                externalEditorShortcut,
                " to edit in $EDITOR"
              ]
            })
          }),
          isKeybindingCustomizationEnabled() && /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor,
              children: "/keybindings to customize"
            })
          })
        ]
      })
    ]
  });
}
var jsx_runtime;
var init_PromptInputHelpMenu = __esm(() => {
  init_src();
  init_platform();
  init_loadUserBindings();
  init_useShortcutDisplay();
  init_growthbook();
  init_fastMode();
  init_utils();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { isVimModeEnabled, isNonSpacePrintable, init_utils, PromptInputHelpMenu, init_PromptInputHelpMenu };

//# debugId=99B412CD3EB478C264756E2164756E21
//# sourceMappingURL=chunk-b8v01nyz.js.map
