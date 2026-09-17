// @bun
import {
  checkAndDisableAutoModeIfNeeded,
  init_bypassPermissionsKillswitch,
  resetAutoModeGateCheck
} from "./chunk-erf2s8kf.js";
import {
  init_useMainLoopModel,
  useMainLoopModel
} from "./chunk-q3qbcy5x.js";
import {
  ConfigurableShortcutHint,
  ConsoleOAuthFlow,
  init_ConfigurableShortcutHint,
  init_ConsoleOAuthFlow,
  init_messages1 as init_messages,
  init_policyLimits,
  init_remoteManagedSettings,
  refreshPolicyLimits,
  refreshRemoteManagedSettings,
  stripSignatureBlocks
} from "./chunk-drtrgzzb.js";
import {
  clearTrustedDeviceToken,
  enrollTrustedDevice,
  init_trustedDevice
} from "./chunk-rwsm1v0m.js";
import {
  getClaudeAIOAuthTokens,
  getGlobalConfig,
  init_auth,
  init_config1 as init_config,
  init_growthbook,
  init_user,
  refreshGrowthBookAfterAuthChange,
  resetUserCache,
  saveGlobalConfig
} from "./chunk-necthexa.js";
import {
  getGlobalClaudeFile,
  init_env
} from "./chunk-kkpmm4b2.js";
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
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
import {
  init_state,
  resetCostState
} from "./chunk-v4e7ch76.js";
import {
  __esm,
  __export,
  __toCommonJS,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/login/AuthPlaneSummary.tsx
function SubscriptionRow({ subscription }) {
  const icon = subscription.active ? "\u2611" : "\u2610";
  const planLabel = subscription.active && subscription.plan ? ` ${subscription.plan} plan` : "";
  const statusText = subscription.active ? `logged in${planLabel}` : "not logged in";
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        color: subscription.active ? "success" : undefined,
        children: [
          icon,
          " Subscription (claude.ai)",
          "  "
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        dimColor: !subscription.active,
        children: statusText
      })
    ]
  });
}
function WorkspaceKeyRow({ workspaceKey }) {
  if (!workspaceKey.set) {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "\u2610 Workspace API key                "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "not set"
        })
      ]
    });
  }
  if (!workspaceKey.prefixValid) {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color: "warning",
          children: "\u26A0 Workspace API key                "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: workspaceKey.keyPreview
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color: "warning",
          children: "  (sk-ant-api03-* required)"
        })
      ]
    });
  }
  const sourceLabel = workspaceKey.source === "settings" ? "  (saved to settings)" : workspaceKey.source === "env" ? "  (from ANTHROPIC_API_KEY env)" : "";
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        color: "success",
        children: "\u2611 Workspace API key                "
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        children: workspaceKey.keyPreview
      }),
      sourceLabel ? /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        dimColor: true,
        children: sourceLabel
      }) : null
    ]
  });
}
function WorkspaceKeyInstructions({
  subscription,
  workspaceKey
}) {
  if (!workspaceKey.set && subscription.active) {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      marginLeft: 5,
      marginTop: 0,
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "To enable /vault /agents-platform /memory-stores:"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "Press W to set now (saves to settings.json, no restart needed)"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "  \u2014 or \u2014"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "1. Open https://console.anthropic.com/settings/keys"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "2. Create a key (sk-ant-api03-*)"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "3. Set ANTHROPIC_API_KEY=<key> and restart"
        })
      ]
    });
  }
  return null;
}
function AuthPlaneSummary({ status }) {
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        marginBottom: 0,
        children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          bold: true,
          children: "Anthropic auth status:"
        })
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        marginLeft: 2,
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(SubscriptionRow, {
            subscription: status.subscription
          }),
          /* @__PURE__ */ jsx_runtime.jsx(WorkspaceKeyRow, {
            workspaceKey: status.workspaceKey
          }),
          /* @__PURE__ */ jsx_runtime.jsx(WorkspaceKeyInstructions, {
            subscription: status.subscription,
            workspaceKey: status.workspaceKey
          })
        ]
      })
    ]
  });
}
var jsx_runtime;
var init_AuthPlaneSummary = __esm(() => {
  init_src();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/login/getAuthStatus.ts
var exports_getAuthStatus = {};
__export(exports_getAuthStatus, {
  getAuthStatus: () => getAuthStatus
});
function maskApiKey(key) {
  const len = key.length;
  if (len < 20)
    return `[redacted] (${len} chars)`;
  const first4 = key.slice(0, 4);
  const last2 = key.slice(-2);
  return `${first4}...${last2} (${len} chars)`;
}
function getAuthStatus() {
  const oauthTokens = getClaudeAIOAuthTokens();
  const subscriptionActive = oauthTokens !== null && Boolean(oauthTokens.accessToken);
  let plan = null;
  if (subscriptionActive && oauthTokens) {
    const raw = oauthTokens.subscriptionType;
    if (raw === "free" || raw === "pro" || raw === "max" || raw === "team" || raw === "enterprise") {
      plan = raw;
    } else if (raw !== null && raw !== undefined) {
      plan = "unknown";
    } else {
      plan = null;
    }
  }
  const envKey = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  const settingsKey = getGlobalConfig().workspaceApiKey?.trim() ?? "";
  let rawKey;
  let keySource;
  if (envKey.length > 0) {
    rawKey = envKey;
    keySource = "env";
  } else if (settingsKey.length > 0) {
    rawKey = settingsKey;
    keySource = "settings";
  } else {
    rawKey = "";
    keySource = null;
  }
  const keySet = rawKey.length > 0;
  const prefixValid = rawKey.startsWith(WORKSPACE_KEY_PREFIX);
  const keyPreview = keySet ? maskApiKey(rawKey) : null;
  return {
    subscription: {
      active: subscriptionActive,
      plan,
      accountEmail: null
    },
    workspaceKey: {
      set: keySet,
      prefixValid,
      keyPreview,
      source: keySource
    }
  };
}
var WORKSPACE_KEY_PREFIX = "sk-ant-api03-";
var init_getAuthStatus = __esm(() => {
  init_auth();
  init_config();
});

// src/services/auth/saveWorkspaceKey.ts
import { promises as fs } from "fs";
async function saveWorkspaceKey(key) {
  if (!key || key.trim().length === 0) {
    throw new Error("Workspace API key must not be empty.");
  }
  const trimmed = key.trim();
  if (trimmed.length < MIN_KEY_LENGTH) {
    throw new Error(`Workspace API key is too short (${trimmed.length} chars). ` + `Expected at least ${MIN_KEY_LENGTH} chars starting with "${WORKSPACE_KEY_PREFIX2}".`);
  }
  if (trimmed.length > MAX_KEY_LENGTH) {
    throw new Error(`Workspace API key is too long (${trimmed.length} chars). ` + `Maximum allowed length is ${MAX_KEY_LENGTH} chars.`);
  }
  if (!trimmed.startsWith(WORKSPACE_KEY_PREFIX2)) {
    const prefix4 = trimmed.slice(0, 4);
    throw new Error(`Workspace API key must start with "${WORKSPACE_KEY_PREFIX2}" (workspace key). ` + `Got prefix "${prefix4}...". ` + "Obtain a workspace API key from https://console.anthropic.com/settings/keys.");
  }
  try {
    saveGlobalConfig((current) => ({
      ...current,
      workspaceApiKey: trimmed
    }));
  } catch (err) {
    throw new Error(`Failed to save workspace API key to config: ${sanitizeErrorMessage(err)}`);
  }
  await tryChmod600();
}
async function removeWorkspaceKey() {
  try {
    saveGlobalConfig((current) => {
      const next = { ...current };
      delete next.workspaceApiKey;
      return next;
    });
  } catch (err) {
    throw new Error(`Failed to remove workspace API key: ${sanitizeErrorMessage(err)}`);
  }
}
function sanitizeErrorMessage(err) {
  if (err instanceof Error) {
    return err.message.replace(/sk-ant-api03-\S*/g, "[REDACTED]");
  }
  return "unknown error";
}
async function tryChmod600() {
  const configPath = getGlobalClaudeFile();
  if (process.platform === "win32") {
    logError(new Error("[saveWorkspaceKey] Windows: chmod 600 is not supported. " + "To protect your API key, restrict access to " + `${configPath} via icacls or Windows ACL settings.`));
    return;
  }
  try {
    await fs.chmod(configPath, 384);
  } catch (err) {
    logError(new Error(`[saveWorkspaceKey] Could not set chmod 600 on ${configPath}: ${sanitizeErrorMessage(err)}`));
  }
}
var WORKSPACE_KEY_PREFIX2 = "sk-ant-api03-", MIN_KEY_LENGTH = 20, MAX_KEY_LENGTH = 256;
var init_saveWorkspaceKey = __esm(() => {
  init_env();
  init_config();
  init_log();
});

// src/commands/login/WorkspaceKeyInput.tsx
function maskKeyInput(value) {
  if (value.length === 0)
    return "";
  if (!value.startsWith(PREFIX)) {
    return value.slice(0, 4) + (value.length > 4 ? "..." : "");
  }
  const suffix = value.slice(PREFIX.length);
  if (suffix.length === 0)
    return PREFIX;
  const stars = "****";
  return `${PREFIX}${stars}...${suffix.slice(-Math.min(4, suffix.length)).replace(/./g, "*")}`;
}
function validateKey(value) {
  if (value.length === 0)
    return null;
  if (!value.startsWith(PREFIX)) {
    return `Key must start with "${PREFIX}"`;
  }
  if (value.length < MIN_KEY_LENGTH2) {
    return `Key too short (${value.length}/${MIN_KEY_LENGTH2} chars minimum)`;
  }
  if (value.length > MAX_KEY_LENGTH2) {
    return `Key too long (${value.length}/${MAX_KEY_LENGTH2} chars maximum)`;
  }
  return null;
}
function WorkspaceKeyInput({
  onSave,
  onCancel,
  saving = false,
  saveError = null
}) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState(null);
  const inlineError = validateKey(value);
  const canSubmit = !saving && value.length >= MIN_KEY_LENGTH2 && inlineError === null;
  use_input_default((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      if (!canSubmit)
        return;
      setError(null);
      onSave(value);
      return;
    }
    if (key.backspace || key.delete) {
      setValue((prev) => prev.slice(0, -1));
      return;
    }
    if (input && input.length > 0) {
      const char = input;
      if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
        setValue((prev) => {
          const next = prev + char;
          return next.length <= MAX_KEY_LENGTH2 ? next : prev;
        });
      }
    }
  }, { isActive: !saving });
  const masked = maskKeyInput(value);
  const displayError = error ?? saveError ?? inlineError;
  return /* @__PURE__ */ jsx_runtime2.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginTop: 1,
    children: [
      /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
        marginBottom: 0,
        children: /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
          bold: true,
          children: "Enter workspace API key (sk-ant-api03-*):"
        })
      }),
      /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
        marginTop: 0,
        marginBottom: 0,
        children: /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
          dimColor: true,
          children: "  Obtain from: https://console.anthropic.com/settings/keys"
        })
      }),
      /* @__PURE__ */ jsx_runtime2.jsxs(ThemedBox_default, {
        marginTop: 1,
        marginBottom: 0,
        children: [
          /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
            children: "  > "
          }),
          value.length > 0 ? /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
            children: masked
          }) : /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
            dimColor: true,
            children: "[paste key here]"
          })
        ]
      }),
      displayError !== null && /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
        marginTop: 0,
        children: /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
          color: "warning",
          children: [
            "  \u2717 ",
            displayError
          ]
        })
      }),
      saving && /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
        marginTop: 0,
        children: /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
          dimColor: true,
          children: "  Saving..."
        })
      }),
      /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
          dimColor: true,
          children: canSubmit ? "Press Enter to save \xB7 Esc to cancel" : "Esc to cancel" + (value.length === 0 ? " \xB7 start typing your key" : "")
        })
      })
    ]
  });
}
function WorkspaceKeyInputContainer({ onSaved, onCancel }) {
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const handleSave = React.useCallback(async (key) => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveWorkspaceKey(key);
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save key \u2014 unknown error";
      setSaveError(msg);
      setSaving(false);
    }
  }, [onSaved]);
  return /* @__PURE__ */ jsx_runtime2.jsx(WorkspaceKeyInput, {
    onSave: (key) => {
      handleSave(key);
    },
    onCancel,
    saving,
    saveError
  });
}
var React, jsx_runtime2, PREFIX = "sk-ant-api03-", MIN_KEY_LENGTH2 = 20, MAX_KEY_LENGTH2 = 256;
var init_WorkspaceKeyInput = __esm(() => {
  init_src();
  init_saveWorkspaceKey();
  React = __toESM(require_react(), 1);
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
});

// src/commands/login/login.tsx
async function call(onDone, context) {
  const authStatus = getAuthStatus();
  return /* @__PURE__ */ jsx_runtime3.jsx(Login, {
    authStatus,
    onDone: async (success) => {
      context.onChangeAPIKey();
      context.setMessages(stripSignatureBlocks);
      if (success) {
        resetCostState();
        refreshRemoteManagedSettings();
        refreshPolicyLimits();
        resetUserCache();
        refreshGrowthBookAfterAuthChange();
        clearTrustedDeviceToken();
        enrollTrustedDevice();
        resetAutoModeGateCheck();
        const appState = context.getAppState();
        checkAndDisableAutoModeIfNeeded(appState.toolPermissionContext, context.setAppState, appState.fastMode);
        context.setAppState((prev) => ({
          ...prev,
          authVersion: prev.authVersion + 1
        }));
      }
      onDone(success ? "Login successful" : "Login interrupted");
    }
  });
}
function Login(props) {
  const mainLoopModel = useMainLoopModel();
  const [showWorkspaceKeyInput, setShowWorkspaceKeyInput] = React2.useState(false);
  const [removeState, setRemoveState] = React2.useState({ phase: "idle" });
  const [liveAuthStatus, setLiveAuthStatus] = React2.useState(props.authStatus);
  const workspaceKeySet = liveAuthStatus !== undefined && liveAuthStatus.workspaceKey.set;
  const workspaceKeyFromSettings = workspaceKeySet && liveAuthStatus.workspaceKey.source === "settings";
  const refreshLiveStatus = React2.useCallback(() => {
    const { getAuthStatus: getAuthStatus2 } = (init_getAuthStatus(), __toCommonJS(exports_getAuthStatus));
    setLiveAuthStatus(getAuthStatus2());
  }, []);
  use_input_default((input) => {
    if (showWorkspaceKeyInput)
      return;
    if (removeState.phase === "confirm-remove") {
      if (input === "y" || input === "Y") {
        setRemoveState({ phase: "removing" });
        (async () => {
          try {
            await removeWorkspaceKey();
            refreshLiveStatus();
            setRemoveState({ phase: "idle" });
          } catch (err) {
            setRemoveState({
              phase: "error",
              message: err instanceof Error ? err.message : "Failed to remove workspace API key"
            });
          }
        })();
        return;
      }
      if (input === "n" || input === "N") {
        setRemoveState({ phase: "idle" });
        return;
      }
      return;
    }
    if (input === "w" || input === "W") {
      setShowWorkspaceKeyInput(true);
      return;
    }
    if ((input === "d" || input === "D") && workspaceKeyFromSettings) {
      setRemoveState({ phase: "confirm-remove" });
    }
  }, { isActive: !showWorkspaceKeyInput });
  const handleWorkspaceKeySaved = React2.useCallback(() => {
    refreshLiveStatus();
    setShowWorkspaceKeyInput(false);
  }, [refreshLiveStatus]);
  const handleWorkspaceKeyCancel = React2.useCallback(() => {
    setShowWorkspaceKeyInput(false);
  }, []);
  return /* @__PURE__ */ jsx_runtime3.jsx(Dialog, {
    title: "Login",
    onCancel: () => props.onDone(false, mainLoopModel),
    color: "permission",
    inputGuide: (exitState) => exitState.pending ? /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }) : /* @__PURE__ */ jsx_runtime3.jsx(ConfigurableShortcutHint, {
      action: "confirm:no",
      context: "Confirmation",
      fallback: "Esc",
      description: "cancel"
    }),
    children: /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        liveAuthStatus !== undefined && /* @__PURE__ */ jsx_runtime3.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime3.jsx(AuthPlaneSummary, {
            status: liveAuthStatus
          })
        }),
        showWorkspaceKeyInput ? /* @__PURE__ */ jsx_runtime3.jsx(WorkspaceKeyInputContainer, {
          onSaved: handleWorkspaceKeySaved,
          onCancel: handleWorkspaceKeyCancel
        }) : removeState.phase === "confirm-remove" || removeState.phase === "removing" ? /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
          flexDirection: "column",
          marginBottom: 1,
          children: [
            /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
              children: [
                "Remove the saved workspace API key? ",
                /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                  dimColor: true,
                  children: "(settings.json only \u2014 env var is unaffected)"
                })
              ]
            }),
            /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
              dimColor: true,
              children: removeState.phase === "removing" ? "Removing\u2026" : "Press Y to confirm, N to cancel"
            })
          ]
        }) : /* @__PURE__ */ jsx_runtime3.jsxs(jsx_runtime3.Fragment, {
          children: [
            /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
              flexDirection: "column",
              marginBottom: 1,
              children: [
                !workspaceKeySet ? /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                  dimColor: true,
                  children: "Press W to enter workspace API key (saves to settings, no restart needed)"
                }) : workspaceKeyFromSettings ? /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                  dimColor: true,
                  children: "Press W to replace workspace API key \xB7 Press D to remove it"
                }) : /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                  dimColor: true,
                  children: "Workspace API key from ANTHROPIC_API_KEY env. Press W to override with a settings-saved key."
                }),
                removeState.phase === "error" && /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                  color: "error",
                  children: removeState.message
                })
              ]
            }),
            /* @__PURE__ */ jsx_runtime3.jsx(ConsoleOAuthFlow, {
              onDone: () => props.onDone(true, mainLoopModel),
              startingMessage: props.startingMessage
            })
          ]
        })
      ]
    })
  });
}
var React2, jsx_runtime3;
var init_login = __esm(() => {
  init_state();
  init_trustedDevice();
  init_ConfigurableShortcutHint();
  init_ConsoleOAuthFlow();
  init_src();
  init_useMainLoopModel();
  init_src();
  init_growthbook();
  init_policyLimits();
  init_remoteManagedSettings();
  init_messages();
  init_bypassPermissionsKillswitch();
  init_user();
  init_AuthPlaneSummary();
  init_getAuthStatus();
  init_WorkspaceKeyInput();
  init_saveWorkspaceKey();
  React2 = __toESM(require_react(), 1);
  jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
});

export { call, Login, init_login };

//# debugId=F341B4C7D0FE20B064756E2164756E21
//# sourceMappingURL=chunk-hcttfjhg.js.map
