// @bun
import {
  Select,
  calculateShouldShowGrove,
  getGroveNoticeConfig,
  getGroveSettings,
  init_CustomSelect,
  init_grove,
  markGroveNoticeViewed,
  updateGroveSettings
} from "./chunk-drtrgzzb.js";
import {
  Byline,
  Dialog,
  KeyboardShortcutHint,
  Link,
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
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/grove/Grove.tsx
function GracePeriodContentBody() {
  return /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "An update to our Consumer Terms and Privacy Policy will take effect on ",
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: "October 8, 2025"
          }),
          ". You can accept the updated terms today."
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "What's changing?"
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            paddingLeft: 1,
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  children: "\xB7 "
                }),
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  bold: true,
                  children: "You can help improve Claude "
                }),
                /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                  children: [
                    "\u2014 Allow the use of your chats and coding sessions to train and improve Anthropic AI models. Change anytime in your Privacy Settings (",
                    /* @__PURE__ */ jsx_runtime.jsx(Link, {
                      url: "https://claude.ai/settings/data-privacy-controls"
                    }),
                    ")."
                  ]
                })
              ]
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            paddingLeft: 1,
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  children: "\xB7 "
                }),
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  bold: true,
                  children: "Updates to data retention "
                }),
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  children: "\u2014 To help us improve our AI models and safety protections, we're extending data retention to 5 years."
                })
              ]
            })
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "Learn more (",
          /* @__PURE__ */ jsx_runtime.jsx(Link, {
            url: "https://www.anthropic.com/news/updates-to-our-consumer-terms"
          }),
          ") or read the updated Consumer Terms (",
          /* @__PURE__ */ jsx_runtime.jsx(Link, {
            url: "https://anthropic.com/legal/terms"
          }),
          ") and Privacy Policy (",
          /* @__PURE__ */ jsx_runtime.jsx(Link, {
            url: "https://anthropic.com/legal/privacy"
          }),
          ")"
        ]
      })
    ]
  });
}
function PostGracePeriodContentBody() {
  return /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        children: "We've updated our Consumer Terms and Privacy Policy."
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "What's changing?"
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                bold: true,
                children: "Help improve Claude"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: "Allow the use of your chats and coding sessions to train and improve Anthropic AI models. You can change this anytime in Privacy Settings"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(Link, {
                url: "https://claude.ai/settings/data-privacy-controls"
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                bold: true,
                children: "How this affects data retention"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: "Turning ON the improve Claude setting extends data retention from 30 days to 5 years. Turning it OFF keeps the default 30-day data retention. Delete data anytime."
              })
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "Learn more (",
          /* @__PURE__ */ jsx_runtime.jsx(Link, {
            url: "https://www.anthropic.com/news/updates-to-our-consumer-terms"
          }),
          ") or read the updated Consumer Terms (",
          /* @__PURE__ */ jsx_runtime.jsx(Link, {
            url: "https://anthropic.com/legal/terms"
          }),
          ") and Privacy Policy (",
          /* @__PURE__ */ jsx_runtime.jsx(Link, {
            url: "https://anthropic.com/legal/privacy"
          }),
          ")"
        ]
      })
    ]
  });
}
function GroveDialog({ showIfAlreadyViewed, location, onDone }) {
  const [shouldShowDialog, setShouldShowDialog] = import_react.useState(null);
  const [groveConfig, setGroveConfig] = import_react.useState(null);
  import_react.useEffect(() => {
    async function checkGroveSettings() {
      const [settingsResult, configResult] = await Promise.all([getGroveSettings(), getGroveNoticeConfig()]);
      const config = configResult.success ? configResult.data : null;
      setGroveConfig(config);
      const shouldShow = calculateShouldShowGrove(settingsResult, configResult, showIfAlreadyViewed);
      setShouldShowDialog(shouldShow);
      if (!shouldShow) {
        onDone("skip_rendering");
        return;
      }
      markGroveNoticeViewed();
      logEvent("tengu_grove_policy_viewed", {
        location,
        dismissable: config?.notice_is_grace_period
      });
    }
    checkGroveSettings();
  }, [showIfAlreadyViewed, location, onDone]);
  if (shouldShowDialog === null) {
    return null;
  }
  if (!shouldShowDialog) {
    return null;
  }
  async function onChange(value) {
    switch (value) {
      case "accept_opt_in": {
        await updateGroveSettings(true);
        logEvent("tengu_grove_policy_submitted", {
          state: true,
          dismissable: groveConfig?.notice_is_grace_period
        });
        break;
      }
      case "accept_opt_out": {
        await updateGroveSettings(false);
        logEvent("tengu_grove_policy_submitted", {
          state: false,
          dismissable: groveConfig?.notice_is_grace_period
        });
        break;
      }
      case "defer":
        logEvent("tengu_grove_policy_dismissed", {
          state: true
        });
        break;
      case "escape":
        logEvent("tengu_grove_policy_escaped", {});
        break;
    }
    onDone(value);
  }
  const acceptOptions = groveConfig?.domain_excluded ? [
    {
      label: "Accept terms \xB7 Help improve Claude: OFF (for emails with your domain)",
      value: "accept_opt_out"
    }
  ] : [
    {
      label: "Accept terms \xB7 Help improve Claude: ON",
      value: "accept_opt_in"
    },
    {
      label: "Accept terms \xB7 Help improve Claude: OFF",
      value: "accept_opt_out"
    }
  ];
  function handleCancel() {
    if (groveConfig?.notice_is_grace_period) {
      onChange("defer");
      return;
    }
    onChange("escape");
  }
  return /* @__PURE__ */ jsx_runtime.jsxs(Dialog, {
    title: "Updates to Consumer Terms and Policies",
    color: "professionalBlue",
    onCancel: handleCancel,
    inputGuide: (exitState) => exitState.pending ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
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
        /* @__PURE__ */ jsx_runtime.jsx(KeyboardShortcutHint, {
          shortcut: "Esc",
          action: "cancel"
        })
      ]
    }),
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "row",
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            flexDirection: "column",
            gap: 1,
            flexGrow: 1,
            children: groveConfig?.notice_is_grace_period ? /* @__PURE__ */ jsx_runtime.jsx(GracePeriodContentBody, {}) : /* @__PURE__ */ jsx_runtime.jsx(PostGracePeriodContentBody, {})
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            flexShrink: 0,
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "professionalBlue",
              children: NEW_TERMS_ASCII
            })
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                bold: true,
                children: "Please select how you'd like to continue"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: "Your choice takes effect immediately upon confirmation."
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(Select, {
            options: [
              ...acceptOptions,
              ...groveConfig?.notice_is_grace_period ? [{ label: "Not now", value: "defer" }] : []
            ],
            onChange: (value) => onChange(value),
            onCancel: handleCancel
          })
        ]
      })
    ]
  });
}
function PrivacySettingsDialog({
  settings,
  domainExcluded,
  onDone
}) {
  const [groveEnabled, setGroveEnabled] = import_react.useState(settings.grove_enabled);
  import_react.default.useEffect(() => {
    logEvent("tengu_grove_privacy_settings_viewed", {});
  }, []);
  use_input_default(async (input, key) => {
    if (!domainExcluded && (key.tab || key.return || input === " ")) {
      const newValue = !groveEnabled;
      setGroveEnabled(newValue);
      await updateGroveSettings(newValue);
    }
  });
  let valueComponent = /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
    color: "error",
    children: "false"
  });
  if (domainExcluded) {
    valueComponent = /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
      color: "error",
      children: "false (for emails with your domain)"
    });
  } else if (groveEnabled) {
    valueComponent = /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
      color: "success",
      children: "true"
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsxs(Dialog, {
    title: "Data Privacy",
    color: "professionalBlue",
    onCancel: onDone,
    inputGuide: (exitState) => exitState.pending ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }) : domainExcluded ? /* @__PURE__ */ jsx_runtime.jsx(KeyboardShortcutHint, {
      shortcut: "Esc",
      action: "cancel"
    }) : /* @__PURE__ */ jsx_runtime.jsxs(Byline, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(KeyboardShortcutHint, {
          shortcut: "Enter/Tab/Space",
          action: "toggle"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(KeyboardShortcutHint, {
          shortcut: "Esc",
          action: "cancel"
        })
      ]
    }),
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "Review and manage your privacy settings at",
          " ",
          /* @__PURE__ */ jsx_runtime.jsx(Link, {
            url: "https://claude.ai/settings/data-privacy-controls"
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            width: 44,
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              bold: true,
              children: "Help improve Claude"
            })
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            children: valueComponent
          })
        ]
      })
    ]
  });
}
var import_react, jsx_runtime, NEW_TERMS_ASCII = ` _____________
 |          \\  \\
 | NEW TERMS \\__\\
 |              |
 |  ----------  |
 |  ----------  |
 |  ----------  |
 |  ----------  |
 |  ----------  |
 |              |
 |______________|`;
var init_Grove = __esm(() => {
  init_analytics();
  init_src();
  init_grove();
  init_CustomSelect();
  init_src();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { GroveDialog, PrivacySettingsDialog, init_Grove };

//# debugId=1A47F2D4C58B73C064756E2164756E21
//# sourceMappingURL=chunk-03e25jce.js.map
