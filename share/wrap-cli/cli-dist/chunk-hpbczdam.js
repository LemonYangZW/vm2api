// @bun
import {
  init_modalContext,
  useIsInsideModal
} from "./chunk-64vp61x2.js";
import {
  init_useTerminalSize
} from "./chunk-2vk6e88k.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-n1j46ncq.js";
import"./chunk-2m7k0qdy.js";
import {
  getSettings_DEPRECATED,
  init_settings1 as init_settings,
  updateSettingsForSource
} from "./chunk-mhtd3kea.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-64er5ppc.js";
import"./chunk-epvbnq43.js";
import"./chunk-h7cy00tf.js";
import"./chunk-srzb9n7s.js";
import"./chunk-6tzyv21c.js";
import"./chunk-8kf8h7xf.js";
import"./chunk-bgan4cpf.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-psygyacq.js";
import"./chunk-e2d0hkcr.js";
import"./chunk-g2931ep0.js";
import"./chunk-vwenx8ke.js";
import"./chunk-kkpmm4b2.js";
import"./chunk-etzpfazg.js";
import"./chunk-v4ypszbb.js";
import"./chunk-bk6ck5c2.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-326zehp8.js";
import"./chunk-40t1d75v.js";
import"./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import {
  Tab,
  Tabs,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  useTerminalSize,
  use_input_default
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-3yga13e5.js";
import"./chunk-ye35qwfx.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-t37nnsvj.js";
import"./chunk-ew28k9dk.js";
import"./chunk-mhjmeh6r.js";
import"./chunk-m28vg9w4.js";
import"./chunk-m4zp6cf9.js";
import"./chunk-w8n8j7aw.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import"./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/web-tools/web-tools.tsx
function MainView({
  tab,
  adapters,
  current,
  fieldLabel,
  onConfigure,
  onSwitchTab,
  onSelectAdapter,
  onClose,
  contentHeight
}) {
  const [cursor, setCursor] = import_react.useState(Math.max(0, adapters.findIndex((a) => a.key === current)));
  use_input_default((input, key) => {
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.downArrow) {
      setCursor((c) => Math.min(c + 1, adapters.length - 1));
    } else if (key.tab && tab === "search") {
      onSwitchTab("fetch");
      setCursor(0);
    } else if (key.tab && tab === "fetch") {
      onSwitchTab("search");
      setCursor(0);
    } else if (key.escape) {
      onClose();
    } else if (key.return) {
      const adapter = adapters[cursor];
      if (adapter) {
        onConfigure(adapter);
      }
    } else if (input === " ") {
      const adapter = adapters[cursor];
      if (adapter) {
        onSelectAdapter(adapter.key);
      }
    }
  });
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    padding: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        bold: true,
        children: fieldLabel
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        flexDirection: "column",
        marginTop: 1,
        children: adapters.map((adapter, idx) => {
          const isSelected = adapter.key === current;
          const isCursor = idx === cursor;
          const highlight = isCursor || isSelected;
          return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "row",
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                color: isSelected ? "success" : undefined,
                children: [
                  isCursor ? "\u203A" : " ",
                  /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                    color: isSelected ? "success" : undefined,
                    children: [
                      " ",
                      isSelected ? "\u25CF" : "\u25CB",
                      " "
                    ]
                  })
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                bold: isSelected,
                backgroundColor: highlight ? "suggestion" : undefined,
                color: highlight ? "inverseText" : undefined,
                children: adapter.label
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: " "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: !isSelected,
                children: adapter.description
              })
            ]
          }, adapter.key);
        })
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        marginTop: 1,
        flexDirection: "row",
        gap: 2,
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            dimColor: true,
            children: [
              "\u2191\u2193",
              " navigate \xB7 Space select \xB7 Enter config \xB7 Esc close"
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "Tab switch tab"
          })
        ]
      })
    ]
  });
}
function getConfigFields(adapter) {
  const fields = [];
  switch (adapter.key) {
    case "tavily":
      fields.push({
        key: "tavilyEndpointUrl",
        label: "Endpoint URL",
        placeholder: "https://tavily.claude-code-best.win",
        maskInput: false,
        getValue: (s) => s.tavilyEndpointUrl ?? "https://tavily.claude-code-best.win",
        setValue: (s, v) => ({ ...s, tavilyEndpointUrl: v || undefined })
      });
      break;
    case "brave":
      fields.push({
        key: "braveApiKey",
        label: "API Key",
        placeholder: "BSA...",
        maskInput: true,
        getValue: (s) => s.braveApiKey ?? "",
        setValue: (s, v) => ({ ...s, braveApiKey: v || undefined })
      });
      break;
    case "exa":
      fields.push({
        key: "exaApiKey",
        label: "API Key",
        placeholder: "exa-...",
        maskInput: true,
        getValue: (s) => s.exaApiKey ?? "",
        setValue: (s, v) => ({ ...s, exaApiKey: v || undefined })
      });
      fields.push({
        key: "exaEndpointUrl",
        label: "Endpoint URL",
        placeholder: "https://mcp.exa.ai/mcp",
        maskInput: false,
        getValue: (s) => s.exaEndpointUrl ?? "https://mcp.exa.ai/mcp",
        setValue: (s, v) => ({ ...s, exaEndpointUrl: v || undefined })
      });
      break;
    case "http":
      fields.push({
        key: "webFetchHttpTimeoutMs",
        label: "Timeout (ms)",
        placeholder: "60000",
        maskInput: false,
        getValue: (s) => String(s.webFetchHttpTimeoutMs ?? 60000),
        setValue: (s, v) => ({ ...s, webFetchHttpTimeoutMs: v ? Number(v) || undefined : undefined })
      });
      break;
    default:
      break;
  }
  return fields;
}
function ConfigView({
  adapter,
  onBack,
  onSave,
  onSelect
}) {
  const fields = getConfigFields(adapter);
  const settings = getSettings_DEPRECATED();
  if (fields.length === 0) {
    return /* @__PURE__ */ jsx_runtime.jsx(NoConfigView, {
      adapter,
      onBack,
      onSelect
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ConfigFieldsEditor, {
    fields,
    adapter,
    onBack,
    onSave,
    settings
  });
}
function NoConfigView({
  adapter,
  onBack,
  onSelect
}) {
  const [cursor, setCursor] = import_react.useState(0);
  use_input_default((input, key) => {
    if (key.upArrow || key.downArrow) {
      setCursor((c) => c === 0 ? 1 : 0);
    } else if (key.escape) {
      onBack();
    } else if (key.return) {
      if (cursor === 0) {
        onSelect(`Selected ${adapter.label}.`);
      } else {
        onBack();
      }
    }
  });
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    padding: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        bold: true,
        children: adapter.label
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        marginTop: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: adapter.description
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: "No additional configuration needed."
            })
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        marginTop: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                children: [
                  cursor === 0 ? "\u203A" : " ",
                  " "
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                backgroundColor: cursor === 0 ? "suggestion" : undefined,
                color: cursor === 0 ? "inverseText" : undefined,
                bold: true,
                children: "[ Select & Close ]"
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                children: [
                  cursor === 1 ? "\u203A" : " ",
                  " "
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                backgroundColor: cursor === 1 ? "suggestion" : undefined,
                color: cursor === 1 ? "inverseText" : undefined,
                children: "[ Back ]"
              })
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "\u2191\u2193",
            " navigate \xB7 Enter confirm \xB7 Esc back"
          ]
        })
      })
    ]
  });
}
function ConfigFieldsEditor({
  fields,
  adapter,
  onBack,
  onSave,
  settings
}) {
  const [cursor, setCursor] = import_react.useState(0);
  const [editing, setEditing] = import_react.useState(false);
  const [editValue, setEditValue] = import_react.useState("");
  const [editCursor, setEditCursor] = import_react.useState(0);
  const resetEdit = import_react.useCallback(() => {
    setEditing(false);
    setEditValue("");
    setEditCursor(0);
  }, []);
  const fieldRowStart = 0;
  const fieldRowEnd = fields.length - 1;
  const saveRow = fields.length;
  const backRow = fields.length + 1;
  const handleSave = import_react.useCallback(() => {
    let updated = { ...settings };
    for (const f of fields) {
      const currentVal = f.getValue(settings);
      updated = f.setValue(updated, currentVal);
    }
    updateSettingsForSource("userSettings", updated);
    onSave(`Configuration saved for ${adapter.label}.`);
  }, [fields, settings, adapter.label, onSave]);
  const handleFieldEdit = import_react.useCallback(() => {
    const field = fields[cursor];
    if (!field)
      return;
    const currentVal = field.getValue(settings);
    setEditValue(currentVal);
    setEditCursor(currentVal.length);
    setEditing(true);
  }, [cursor, fields, settings]);
  const handleEditSubmit = import_react.useCallback(() => {
    const field = fields[cursor];
    if (!field)
      return;
    const updated = field.setValue({ ...settings }, editValue);
    Object.assign(settings, updated);
    setEditing(false);
  }, [cursor, fields, settings, editValue]);
  use_input_default((input, key) => {
    if (editing) {
      if (key.escape) {
        resetEdit();
      } else if (key.return) {
        handleEditSubmit();
      } else if (key.backspace || key.delete) {
        setEditValue((v) => {
          const pos = editCursor;
          if (pos > 0) {
            setEditCursor(pos - 1);
            return v.slice(0, pos - 1) + v.slice(pos);
          }
          return v;
        });
      } else if (key.leftArrow) {
        setEditCursor((c) => Math.max(0, c - 1));
      } else if (key.rightArrow) {
        setEditCursor((c) => Math.min(editValue.length, c + 1));
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setEditValue((v) => {
          const pos = editCursor;
          setEditCursor(pos + 1);
          return v.slice(0, pos) + input + v.slice(pos);
        });
      }
    } else {
      if (key.upArrow) {
        setCursor((c) => Math.max(0, c - 1));
      } else if (key.downArrow) {
        setCursor((c) => Math.min(backRow, c + 1));
      } else if (key.escape) {
        onBack();
      } else if (key.return) {
        if (cursor === saveRow) {
          handleSave();
        } else if (cursor === backRow) {
          onBack();
        } else {
          handleFieldEdit();
        }
      }
    }
  });
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    padding: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        bold: true,
        children: [
          adapter.label,
          " Configuration"
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        marginTop: 1,
        children: [
          fields.map((field, idx) => {
            const isCursor = idx === cursor && !editing;
            const val = field.getValue(settings);
            const displayVal = editing && idx === cursor ? field.maskInput ? "\u2022".repeat(editValue.length) : editValue : field.maskInput && val ? "\u2022".repeat(Math.min(val.length, 16)) : val;
            return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
              flexDirection: "row",
              children: [
                /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                  children: [
                    isCursor ? "\u203A" : " ",
                    " "
                  ]
                }),
                /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                  dimColor: true,
                  children: [
                    field.label,
                    ": "
                  ]
                }),
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  backgroundColor: isCursor ? "suggestion" : undefined,
                  color: editing && idx === cursor ? "success" : isCursor ? "inverseText" : undefined,
                  children: displayVal || /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    dimColor: true,
                    children: "(empty)"
                  })
                }),
                editing && idx === cursor && /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                  dimColor: true,
                  children: [
                    " |",
                    " pos ",
                    editCursor,
                    "/",
                    editValue.length
                  ]
                })
              ]
            }, field.key);
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            marginTop: 1,
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                children: [
                  cursor === saveRow ? "\u203A" : " ",
                  " "
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                backgroundColor: cursor === saveRow ? "suggestion" : undefined,
                color: cursor === saveRow ? "inverseText" : undefined,
                bold: true,
                children: "[ Save ]"
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                children: [
                  cursor === backRow ? "\u203A" : " ",
                  " "
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                backgroundColor: cursor === backRow ? "suggestion" : undefined,
                color: cursor === backRow ? "inverseText" : undefined,
                children: "[ Back ]"
              })
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: editing ? "\u2190\u2192 move cursor \xB7 Type to edit \xB7 Enter confirm \xB7 Esc cancel edit" : "\u2191\u2193 navigate \xB7 Enter edit field \xB7 Esc go back"
        })
      })
    ]
  });
}
function WebToolsPanel({
  onClose,
  _context: __context
}) {
  const [currentTab, setCurrentTab] = import_react.useState("search");
  const [view, setView] = import_react.useState({ kind: "main" });
  const settings = getSettings_DEPRECATED();
  const currentSearch = settings.webSearchAdapter ?? "tavily";
  const currentFetch = settings.webFetchAdapter ?? "tavily";
  const insideModal = useIsInsideModal();
  const { rows } = useTerminalSize();
  const contentHeight = insideModal ? rows + 1 : Math.max(14, Math.min(Math.floor(rows * 0.7), 24));
  useExitOnCtrlCDWithKeybindings();
  const handleSelectAdapter = import_react.useCallback((key) => {
    const t = currentTab;
    const field = t === "search" ? "webSearchAdapter" : "webFetchAdapter";
    updateSettingsForSource("userSettings", { [field]: key });
    const adapters2 = t === "search" ? SEARCH_ADAPTERS : FETCH_ADAPTERS;
    const label = adapters2.find((a) => a.key === key)?.label ?? key;
    onClose(`${t === "search" ? "Web search" : "Web fetch"} backend set to ${label}.`);
  }, [currentTab, onClose]);
  const handleConfigure = import_react.useCallback((adapter) => {
    setView({ kind: "config", adapter });
  }, []);
  const handleBackFromConfig = import_react.useCallback(() => {
    setView({ kind: "main" });
  }, []);
  const handleSaveConfig = import_react.useCallback((msg) => {
    onClose(msg);
  }, [onClose]);
  const handleSelectFromConfig = import_react.useCallback((msg) => {
    const adapter = view.adapter;
    const tab = view.kind === "config" ? SEARCH_ADAPTERS.some((a) => a.key === adapter.key) ? "search" : "fetch" : currentTab;
    const field = tab === "search" ? "webSearchAdapter" : "webFetchAdapter";
    updateSettingsForSource("userSettings", { [field]: adapter.key });
    onClose(msg);
  }, [onClose, view, currentTab]);
  if (view.kind === "config") {
    return /* @__PURE__ */ jsx_runtime.jsx(ConfigView, {
      adapter: view.adapter,
      onBack: handleBackFromConfig,
      onSave: handleSaveConfig,
      onSelect: handleSelectFromConfig
    });
  }
  const adapters = currentTab === "search" ? SEARCH_ADAPTERS : FETCH_ADAPTERS;
  const current = currentTab === "search" ? currentSearch : currentFetch;
  return /* @__PURE__ */ jsx_runtime.jsxs(Tabs, {
    title: "Web Tools",
    contentHeight,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(Tab, {
        title: "Search",
        children: /* @__PURE__ */ jsx_runtime.jsx(MainView, {
          tab: currentTab,
          adapters: SEARCH_ADAPTERS,
          current: currentSearch,
          fieldLabel: "Choose a web search backend:",
          onConfigure: handleConfigure,
          onSwitchTab: setCurrentTab,
          onSelectAdapter: handleSelectAdapter,
          onClose: () => onClose("Web tools panel dismissed"),
          contentHeight
        })
      }, "search"),
      /* @__PURE__ */ jsx_runtime.jsx(Tab, {
        title: "Fetch",
        children: /* @__PURE__ */ jsx_runtime.jsx(MainView, {
          tab: currentTab,
          adapters: FETCH_ADAPTERS,
          current: currentFetch,
          fieldLabel: "Choose a web fetch backend:",
          onConfigure: handleConfigure,
          onSwitchTab: setCurrentTab,
          onSelectAdapter: handleSelectAdapter,
          onClose: () => onClose("Web tools panel dismissed"),
          contentHeight
        })
      }, "fetch")
    ]
  });
}
var import_react, jsx_runtime, SEARCH_ADAPTERS, FETCH_ADAPTERS, call = async (onDone, context) => {
  return /* @__PURE__ */ jsx_runtime.jsx(WebToolsPanel, {
    onClose: onDone,
    _context: context
  });
};
var init_web_tools = __esm(() => {
  init_src();
  init_useExitOnCtrlCDWithKeybindings();
  init_useTerminalSize();
  init_modalContext();
  init_settings();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  SEARCH_ADAPTERS = [
    { key: "tavily", label: "Tavily", description: "Tavily Search API (default)", hasConfig: true },
    { key: "api", label: "Anthropic API", description: "Anthropic server-side web search", hasConfig: false },
    { key: "bing", label: "Bing", description: "Scrape Bing HTML results", hasConfig: false },
    { key: "brave", label: "Brave", description: "Brave Search API (needs API key)", hasConfig: true },
    { key: "exa", label: "Exa", description: "Exa AI search (MCP endpoint)", hasConfig: true }
  ];
  FETCH_ADAPTERS = [
    { key: "tavily", label: "Tavily Extract", description: "Use Tavily /extract (default)", hasConfig: true },
    { key: "http", label: "HTTP Direct", description: "Fetch URL directly via HTTP", hasConfig: true }
  ];
});
init_web_tools();

export {
  call
};

//# debugId=EA3B181A4144868A64756E2164756E21
//# sourceMappingURL=chunk-hpbczdam.js.map
