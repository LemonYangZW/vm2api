// @bun
import {
  Select,
  init_CustomSelect
} from "./chunk-92frfsdm.js";
import {
  init_config1 as init_config,
  saveGlobalConfig
} from "./chunk-ghhmj79c.js";
import {
  Dialog,
  ThemedText,
  init_src
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/ApproveApiKey.tsx
init_src();
init_config();
init_CustomSelect();
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
function ApproveApiKey({ customApiKeyTruncated, onDone }) {
  function onChange(value) {
    switch (value) {
      case "yes": {
        saveGlobalConfig((current) => ({
          ...current,
          customApiKeyResponses: {
            ...current.customApiKeyResponses,
            approved: [...current.customApiKeyResponses?.approved ?? [], customApiKeyTruncated]
          }
        }));
        onDone(true);
        break;
      }
      case "no": {
        saveGlobalConfig((current) => ({
          ...current,
          customApiKeyResponses: {
            ...current.customApiKeyResponses,
            rejected: [...current.customApiKeyResponses?.rejected ?? [], customApiKeyTruncated]
          }
        }));
        onDone(false);
        break;
      }
    }
  }
  return /* @__PURE__ */ jsx_runtime.jsxs(Dialog, {
    title: "Detected a custom API key in your environment",
    color: "warning",
    onCancel: () => onChange("no"),
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: "ANTHROPIC_API_KEY"
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              ": sk-ant-...",
              customApiKeyTruncated
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        children: "Do you want to use this API key?"
      }),
      /* @__PURE__ */ jsx_runtime.jsx(Select, {
        defaultValue: "no",
        defaultFocusValue: "no",
        options: [
          { label: "Yes", value: "yes" },
          {
            label: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              children: [
                "No (",
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  bold: true,
                  children: "recommended"
                }),
                ")"
              ]
            }),
            value: "no"
          }
        ],
        onChange: (value) => onChange(value),
        onCancel: () => onChange("no")
      })
    ]
  });
}

export { ApproveApiKey };

//# debugId=1894F6A727532BE764756E2164756E21
//# sourceMappingURL=chunk-hkn5sq4r.js.map
