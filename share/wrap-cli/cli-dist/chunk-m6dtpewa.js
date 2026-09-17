// @bun
import {
  PermissionDialog,
  init_PermissionDialog
} from "./chunk-222mpwbv.js";
import {
  Select,
  init_select
} from "./chunk-mxbn7v69.js";
import {
  init_bridgeEnabled,
  isBridgeEnabled
} from "./chunk-6xvnzvt1.js";
import {
  getClaudeAIOAuthTokens,
  getGlobalConfig,
  init_auth,
  init_config1 as init_config,
  saveGlobalConfig
} from "./chunk-mhtd3kea.js";
import {
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/RemoteCallout.tsx
function RemoteCallout({ onDone }) {
  const onDoneRef = import_react.useRef(onDone);
  onDoneRef.current = onDone;
  const handleCancel = import_react.useCallback(() => {
    onDoneRef.current("dismiss");
  }, []);
  import_react.useEffect(() => {
    saveGlobalConfig((current) => {
      if (current.remoteDialogSeen)
        return current;
      return { ...current, remoteDialogSeen: true };
    });
  }, []);
  const handleSelect = import_react.useCallback((value) => {
    onDoneRef.current(value);
  }, []);
  const options = [
    {
      label: "Enable Remote Control for this session",
      description: "Opens a secure connection to claude.ai.",
      value: "enable"
    },
    {
      label: "Never mind",
      description: "You can always enable it later with /remote-control.",
      value: "dismiss"
    }
  ];
  return /* @__PURE__ */ jsx_runtime.jsx(PermissionDialog, {
    title: "Remote Control",
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      paddingX: 2,
      paddingY: 1,
      children: [
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          marginBottom: 1,
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "Remote Control lets you access this CLI session from the web (claude.ai/code) or the Claude app, so you can pick up where you left off on any device."
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: " "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "You can disconnect remote access anytime by running /remote-control again."
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(Select, {
            options,
            onChange: handleSelect,
            onCancel: handleCancel
          })
        })
      ]
    })
  });
}
function shouldShowRemoteCallout() {
  const config = getGlobalConfig();
  if (config.remoteDialogSeen)
    return false;
  if (!isBridgeEnabled())
    return false;
  const tokens = getClaudeAIOAuthTokens();
  if (!tokens?.accessToken)
    return false;
  return true;
}
var import_react, jsx_runtime;
var init_RemoteCallout = __esm(() => {
  init_bridgeEnabled();
  init_src();
  init_auth();
  init_config();
  init_select();
  init_PermissionDialog();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { RemoteCallout, shouldShowRemoteCallout, init_RemoteCallout };

//# debugId=4C96F9A61F2D5D7E64756E2164756E21
//# sourceMappingURL=chunk-m6dtpewa.js.map
