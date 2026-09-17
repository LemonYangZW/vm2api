// @bun
import {
  describeMcpConfigFilePath,
  getMcpConfigsByScope,
  getScopeLabel,
  init_config,
  init_utils
} from "./chunk-drtrgzzb.js";
import {
  Link,
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

// src/components/mcp/McpParsingWarnings.tsx
function McpConfigErrorSection({
  scope,
  parsingErrors,
  warnings
}) {
  const hasErrors = parsingErrors.length > 0;
  const hasWarnings = warnings.length > 0;
  if (!hasErrors && !hasWarnings) {
    return null;
  }
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginTop: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          (hasErrors || hasWarnings) && /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            color: hasErrors ? "error" : "warning",
            children: [
              "[",
              hasErrors ? "Failed to parse" : "Contains warnings",
              "] "
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: getScopeLabel(scope)
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "Location: "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: describeMcpConfigFilePath(scope)
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        marginLeft: 1,
        flexDirection: "column",
        children: [
          parsingErrors.map((error, i) => {
            const serverName = error.mcpErrorMetadata?.serverName;
            return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
              children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                children: [
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    dimColor: true,
                    children: "\u2514 "
                  }),
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    color: "error",
                    children: "[Error]"
                  }),
                  /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                    dimColor: true,
                    children: [
                      " ",
                      serverName && `[${serverName}] `,
                      error.path && error.path !== "" ? `${error.path}: ` : "",
                      error.message
                    ]
                  })
                ]
              })
            }, `error-${i}`);
          }),
          warnings.map((warning, i) => {
            const serverName = warning.mcpErrorMetadata?.serverName;
            return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
              children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                children: [
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    dimColor: true,
                    children: "\u2514 "
                  }),
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    color: "warning",
                    children: "[Warning]"
                  }),
                  /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                    dimColor: true,
                    children: [
                      " ",
                      serverName && `[${serverName}] `,
                      warning.path && warning.path !== "" ? `${warning.path}: ` : "",
                      warning.message
                    ]
                  })
                ]
              })
            }, `warning-${i}`);
          })
        ]
      })
    ]
  });
}
function McpParsingWarnings() {
  const scopes = import_react.useMemo(() => [
    { scope: "user", config: getMcpConfigsByScope("user") },
    { scope: "project", config: getMcpConfigsByScope("project") },
    { scope: "local", config: getMcpConfigsByScope("local") },
    { scope: "enterprise", config: getMcpConfigsByScope("enterprise") }
  ], []);
  const hasParsingErrors = scopes.some(({ config }) => filterErrors(config.errors, "fatal").length > 0);
  const hasWarnings = scopes.some(({ config }) => filterErrors(config.errors, "warning").length > 0);
  if (!hasParsingErrors && !hasWarnings) {
    return null;
  }
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginTop: 1,
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        bold: true,
        children: "MCP Config Diagnostics"
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "For help configuring MCP servers, see:",
            " ",
            /* @__PURE__ */ jsx_runtime.jsx(Link, {
              url: "https://code.claude.com/docs/en/mcp",
              children: "https://code.claude.com/docs/en/mcp"
            })
          ]
        })
      }),
      scopes.map(({ scope, config }) => /* @__PURE__ */ jsx_runtime.jsx(McpConfigErrorSection, {
        scope,
        parsingErrors: filterErrors(config.errors, "fatal"),
        warnings: filterErrors(config.errors, "warning")
      }, scope))
    ]
  });
}
function filterErrors(errors, severity) {
  return errors.filter((e) => e.mcpErrorMetadata?.severity === severity);
}
var import_react, jsx_runtime;
var init_McpParsingWarnings = __esm(() => {
  init_config();
  init_utils();
  init_src();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { McpParsingWarnings, init_McpParsingWarnings };

//# debugId=DB07899B1AC9C18464756E2164756E21
//# sourceMappingURL=chunk-d69h0wer.js.map
