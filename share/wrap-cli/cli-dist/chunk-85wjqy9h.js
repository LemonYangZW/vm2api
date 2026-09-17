// @bun
import {
  ValidationErrorsList,
  init_ValidationErrorsList
} from "./chunk-z5wxkqq2.js";
import {
  init_useSettingsErrors,
  useSettingsErrors
} from "./chunk-t2kzns2n.js";
import {
  PressEnterToContinue,
  init_PressEnterToContinue
} from "./chunk-72zkn6ng.js";
import {
  detectUnreachableRules,
  init_shadowedRuleDetection
} from "./chunk-rgq7z943.js";
import {
  AGENT_DESCRIPTIONS_THRESHOLD,
  getAgentDescriptionsTotalTokens,
  init_statusNoticeHelpers
} from "./chunk-h8t8fjbq.js";
import {
  McpParsingWarnings,
  init_McpParsingWarnings
} from "./chunk-dse5trk0.js";
import {
  BASH_MAX_OUTPUT_DEFAULT,
  BASH_MAX_OUTPUT_UPPER_LIMIT,
  MAX_MEMORY_CHARACTER_COUNT,
  SandboxManager,
  TASK_MAX_OUTPUT_DEFAULT,
  TASK_MAX_OUTPUT_UPPER_LIMIT,
  cleanupStaleLocks,
  countMcpToolTokens,
  getAllLockInfo,
  getCachedKeybindingWarnings,
  getDoctorDiagnostic,
  getGcsDistTags,
  getKeybindingsPath,
  getLargeMemoryFiles,
  getMemoryFiles,
  getNpmDistTags,
  getPluginErrorMessage,
  init_AppState,
  init_analyzeContext,
  init_autoUpdater,
  init_claudemd,
  init_doctorDiagnostic,
  init_envValidation,
  init_loadUserBindings,
  init_outputFormatting,
  init_outputLimits,
  init_pidLock,
  init_plugin,
  init_sandbox_adapter,
  init_tokenEstimation,
  isKeybindingCustomizationEnabled,
  isPidBasedLockingEnabled,
  roughTokenCountEstimation,
  useAppState,
  validateBoundedIntEnvVar
} from "./chunk-92frfsdm.js";
import {
  getXDGStateHome,
  init_xdg
} from "./chunk-14p6wvsq.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-n1j46ncq.js";
import {
  init_useKeybinding
} from "./chunk-2m7k0qdy.js";
import {
  getInitialSettings,
  getMainLoopModel,
  getModelMaxOutputTokens,
  init_context,
  init_file,
  init_model,
  init_permissionRuleParser,
  init_settings1 as init_settings,
  pathExists,
  permissionRuleValueToString
} from "./chunk-ghhmj79c.js";
import {
  init_stringUtils,
  plural
} from "./chunk-h7cy00tf.js";
import {
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
  figures_default,
  init_figures
} from "./chunk-c5g9shkw.js";
import {
  getOriginalCwd,
  init_state
} from "./chunk-v4e7ch76.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils
} from "./chunk-6k1rsk85.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/KeybindingWarnings.tsx
function KeybindingWarnings() {
  if (!isKeybindingCustomizationEnabled()) {
    return null;
  }
  const warnings = getCachedKeybindingWarnings();
  if (warnings.length === 0) {
    return null;
  }
  const errors = warnings.filter((w) => w.severity === "error");
  const warns = warnings.filter((w) => w.severity === "warning");
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginTop: 1,
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        bold: true,
        color: errors.length > 0 ? "error" : "warning",
        children: "Keybinding Configuration Issues"
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "Location: "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: getKeybindingsPath()
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        marginLeft: 1,
        flexDirection: "column",
        marginTop: 1,
        children: [
          errors.map((error, i) => /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
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
                      error.message
                    ]
                  })
                ]
              }),
              error.suggestion && /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
                marginLeft: 3,
                children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                  dimColor: true,
                  children: [
                    "\u2192 ",
                    error.suggestion
                  ]
                })
              })
            ]
          }, `error-${i}`)),
          warns.map((warning, i) => /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
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
                      warning.message
                    ]
                  })
                ]
              }),
              warning.suggestion && /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
                marginLeft: 3,
                children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                  dimColor: true,
                  children: [
                    "\u2192 ",
                    warning.suggestion
                  ]
                })
              })
            ]
          }, `warning-${i}`))
        ]
      })
    ]
  });
}
var jsx_runtime;
var init_KeybindingWarnings = __esm(() => {
  init_src();
  init_loadUserBindings();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/components/sandbox/SandboxDoctorSection.tsx
function SandboxDoctorSection() {
  if (!SandboxManager.isSupportedPlatform()) {
    return null;
  }
  if (!SandboxManager.isSandboxEnabledInSettings()) {
    return null;
  }
  const depCheck = SandboxManager.checkDependencies();
  const hasErrors = depCheck.errors.length > 0;
  const hasWarnings = depCheck.warnings.length > 0;
  if (!hasErrors && !hasWarnings) {
    return null;
  }
  const statusColor = hasErrors ? "error" : "warning";
  const statusText = hasErrors ? "Missing dependencies" : "Available (with warnings)";
  return /* @__PURE__ */ jsx_runtime2.jsxs(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
        bold: true,
        children: "Sandbox"
      }),
      /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
        children: [
          "\u2514 Status: ",
          /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
            color: statusColor,
            children: statusText
          })
        ]
      }),
      depCheck.errors.map((e, i) => /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
        color: "error",
        children: [
          "\u2514 ",
          e
        ]
      }, i)),
      depCheck.warnings.map((w, i) => /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
        color: "warning",
        children: [
          "\u2514 ",
          w
        ]
      }, i)),
      hasErrors && /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
        dimColor: true,
        children: "\u2514 Run /sandbox for install instructions"
      })
    ]
  });
}
var jsx_runtime2;
var init_SandboxDoctorSection = __esm(() => {
  init_src();
  init_sandbox_adapter();
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
});

// src/utils/doctorContextWarnings.ts
async function checkClaudeMdFiles() {
  const largeFiles = getLargeMemoryFiles(await getMemoryFiles());
  if (largeFiles.length === 0) {
    return null;
  }
  const details = largeFiles.sort((a, b) => b.content.length - a.content.length).map((file) => `${file.path}: ${file.content.length.toLocaleString()} chars`);
  const message = largeFiles.length === 1 ? `Large CLAUDE.md file detected (${largeFiles[0].content.length.toLocaleString()} chars > ${MAX_MEMORY_CHARACTER_COUNT.toLocaleString()})` : `${largeFiles.length} large CLAUDE.md files detected (each > ${MAX_MEMORY_CHARACTER_COUNT.toLocaleString()} chars)`;
  return {
    type: "claudemd_files",
    severity: "warning",
    message,
    details,
    currentValue: largeFiles.length,
    threshold: MAX_MEMORY_CHARACTER_COUNT
  };
}
async function checkAgentDescriptions(agentInfo) {
  if (!agentInfo) {
    return null;
  }
  const totalTokens = getAgentDescriptionsTotalTokens(agentInfo);
  if (totalTokens <= AGENT_DESCRIPTIONS_THRESHOLD) {
    return null;
  }
  const agentTokens = agentInfo.activeAgents.filter((a) => a.source !== "built-in").map((agent) => {
    const description = `${agent.agentType}: ${agent.whenToUse}`;
    return {
      name: agent.agentType,
      tokens: roughTokenCountEstimation(description)
    };
  }).sort((a, b) => b.tokens - a.tokens);
  const details = agentTokens.slice(0, 5).map((agent) => `${agent.name}: ~${agent.tokens.toLocaleString()} tokens`);
  if (agentTokens.length > 5) {
    details.push(`(${agentTokens.length - 5} more custom agents)`);
  }
  return {
    type: "agent_descriptions",
    severity: "warning",
    message: `Large agent descriptions (~${totalTokens.toLocaleString()} tokens > ${AGENT_DESCRIPTIONS_THRESHOLD.toLocaleString()})`,
    details,
    currentValue: totalTokens,
    threshold: AGENT_DESCRIPTIONS_THRESHOLD
  };
}
async function checkMcpTools(tools, getToolPermissionContext, agentInfo) {
  const mcpTools = tools.filter((tool) => tool.isMcp);
  if (mcpTools.length === 0) {
    return null;
  }
  try {
    const model = getMainLoopModel();
    const { mcpToolTokens, mcpToolDetails } = await countMcpToolTokens(tools, getToolPermissionContext, agentInfo, model);
    if (mcpToolTokens <= MCP_TOOLS_THRESHOLD) {
      return null;
    }
    const toolsByServer = new Map;
    for (const tool of mcpToolDetails) {
      const parts = tool.name.split("__");
      const serverName = parts[1] || "unknown";
      const current = toolsByServer.get(serverName) || { count: 0, tokens: 0 };
      toolsByServer.set(serverName, {
        count: current.count + 1,
        tokens: current.tokens + tool.tokens
      });
    }
    const sortedServers = Array.from(toolsByServer.entries()).sort((a, b) => b[1].tokens - a[1].tokens);
    const details = sortedServers.slice(0, 5).map(([name, info]) => `${name}: ${info.count} tools (~${info.tokens.toLocaleString()} tokens)`);
    if (sortedServers.length > 5) {
      details.push(`(${sortedServers.length - 5} more servers)`);
    }
    return {
      type: "mcp_tools",
      severity: "warning",
      message: `Large MCP tools context (~${mcpToolTokens.toLocaleString()} tokens > ${MCP_TOOLS_THRESHOLD.toLocaleString()})`,
      details,
      currentValue: mcpToolTokens,
      threshold: MCP_TOOLS_THRESHOLD
    };
  } catch (_error) {
    const estimatedTokens = mcpTools.reduce((total, tool) => {
      const chars = (tool.name?.length || 0) + tool.description.length;
      return total + roughTokenCountEstimation(chars.toString());
    }, 0);
    if (estimatedTokens <= MCP_TOOLS_THRESHOLD) {
      return null;
    }
    return {
      type: "mcp_tools",
      severity: "warning",
      message: `Large MCP tools context (~${estimatedTokens.toLocaleString()} tokens estimated > ${MCP_TOOLS_THRESHOLD.toLocaleString()})`,
      details: [
        `${mcpTools.length} MCP tools detected (token count estimated)`
      ],
      currentValue: estimatedTokens,
      threshold: MCP_TOOLS_THRESHOLD
    };
  }
}
async function checkUnreachableRules(getToolPermissionContext) {
  const context = await getToolPermissionContext();
  const sandboxAutoAllowEnabled = SandboxManager.isSandboxingEnabled() && SandboxManager.isAutoAllowBashIfSandboxedEnabled();
  const unreachable = detectUnreachableRules(context, {
    sandboxAutoAllowEnabled
  });
  if (unreachable.length === 0) {
    return null;
  }
  const details = unreachable.flatMap((r) => [
    `${permissionRuleValueToString(r.rule.ruleValue)}: ${r.reason}`,
    `  Fix: ${r.fix}`
  ]);
  return {
    type: "unreachable_rules",
    severity: "warning",
    message: `${unreachable.length} ${plural(unreachable.length, "unreachable permission rule")} detected`,
    details,
    currentValue: unreachable.length,
    threshold: 0
  };
}
async function checkContextWarnings(tools, agentInfo, getToolPermissionContext) {
  const [claudeMdWarning, agentWarning, mcpWarning, unreachableRulesWarning] = await Promise.all([
    checkClaudeMdFiles(),
    checkAgentDescriptions(agentInfo),
    checkMcpTools(tools, getToolPermissionContext, agentInfo),
    checkUnreachableRules(getToolPermissionContext)
  ]);
  return {
    claudeMdWarning,
    agentWarning,
    mcpWarning,
    unreachableRulesWarning
  };
}
var MCP_TOOLS_THRESHOLD = 25000;
var init_doctorContextWarnings = __esm(() => {
  init_tokenEstimation();
  init_analyzeContext();
  init_claudemd();
  init_model();
  init_permissionRuleParser();
  init_shadowedRuleDetection();
  init_sandbox_adapter();
  init_statusNoticeHelpers();
  init_stringUtils();
});

// src/screens/Doctor.tsx
import { join } from "path";
function DistTagsDisplay({ promise }) {
  const distTags = import_react.use(promise);
  if (!distTags.latest) {
    return /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
      dimColor: true,
      children: "\u2514 Failed to fetch versions"
    });
  }
  return /* @__PURE__ */ jsx_runtime3.jsxs(jsx_runtime3.Fragment, {
    children: [
      distTags.stable && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
        children: [
          "\u2514 Stable version: ",
          distTags.stable
        ]
      }),
      /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
        children: [
          "\u2514 Latest version: ",
          distTags.latest
        ]
      })
    ]
  });
}
function Doctor({ onDone }) {
  const agentDefinitions = useAppState((s) => s.agentDefinitions);
  const mcpTools = useAppState((s) => s.mcp.tools);
  const toolPermissionContext = useAppState((s) => s.toolPermissionContext);
  const pluginsErrors = useAppState((s) => s.plugins.errors);
  useExitOnCtrlCDWithKeybindings();
  const tools = import_react.useMemo(() => {
    return mcpTools || [];
  }, [mcpTools]);
  const [diagnostic, setDiagnostic] = import_react.useState(null);
  const [agentInfo, setAgentInfo] = import_react.useState(null);
  const [contextWarnings, setContextWarnings] = import_react.useState(null);
  const [versionLockInfo, setVersionLockInfo] = import_react.useState(null);
  const validationErrors = useSettingsErrors();
  const distTagsPromise = import_react.useMemo(() => getDoctorDiagnostic().then((diag) => {
    const fetchDistTags = diag.installationType === "native" ? getGcsDistTags : getNpmDistTags;
    return fetchDistTags().catch(() => ({ latest: null, stable: null }));
  }), []);
  const autoUpdatesChannel = getInitialSettings()?.autoUpdatesChannel ?? "latest";
  const errorsExcludingMcp = validationErrors.filter((error) => error.mcpErrorMetadata === undefined);
  const envValidationErrors = import_react.useMemo(() => {
    const envVars = [
      {
        name: "BASH_MAX_OUTPUT_LENGTH",
        default: BASH_MAX_OUTPUT_DEFAULT,
        upperLimit: BASH_MAX_OUTPUT_UPPER_LIMIT
      },
      {
        name: "TASK_MAX_OUTPUT_LENGTH",
        default: TASK_MAX_OUTPUT_DEFAULT,
        upperLimit: TASK_MAX_OUTPUT_UPPER_LIMIT
      },
      {
        name: "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
        ...getModelMaxOutputTokens("claude-opus-4-7")
      }
    ];
    return envVars.map((v) => {
      const value = process.env[v.name];
      const result = validateBoundedIntEnvVar(v.name, value, v.default, v.upperLimit);
      return { name: v.name, ...result };
    }).filter((v) => v.status !== "valid");
  }, []);
  import_react.useEffect(() => {
    getDoctorDiagnostic().then(setDiagnostic);
    (async () => {
      const userAgentsDir = join(getClaudeConfigHomeDir(), "agents");
      const projectAgentsDir = join(getOriginalCwd(), ".claude", "agents");
      const { activeAgents, allAgents, failedFiles } = agentDefinitions;
      const [userDirExists, projectDirExists] = await Promise.all([
        pathExists(userAgentsDir),
        pathExists(projectAgentsDir)
      ]);
      const agentInfoData = {
        activeAgents: activeAgents.map((a) => ({
          agentType: a.agentType,
          source: a.source
        })),
        userAgentsDir,
        projectAgentsDir,
        userDirExists,
        projectDirExists,
        failedFiles
      };
      setAgentInfo(agentInfoData);
      const warnings = await checkContextWarnings(tools, {
        activeAgents,
        allAgents,
        failedFiles
      }, async () => toolPermissionContext);
      setContextWarnings(warnings);
      if (isPidBasedLockingEnabled()) {
        const locksDir = join(getXDGStateHome(), "claude", "locks");
        const staleLocksCleaned = cleanupStaleLocks(locksDir);
        const locks = getAllLockInfo(locksDir);
        setVersionLockInfo({
          enabled: true,
          locks,
          locksDir,
          staleLocksCleaned
        });
      } else {
        setVersionLockInfo({
          enabled: false,
          locks: [],
          locksDir: "",
          staleLocksCleaned: 0
        });
      }
    })();
  }, [toolPermissionContext, tools, agentDefinitions]);
  const handleDismiss = import_react.useCallback(() => {
    onDone("Claude Code diagnostics dismissed", { display: "system" });
  }, [onDone]);
  useKeybindings({
    "confirm:yes": handleDismiss,
    "confirm:no": handleDismiss
  }, { context: "Confirmation" });
  if (!diagnostic) {
    return /* @__PURE__ */ jsx_runtime3.jsx(Pane, {
      children: /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
        dimColor: true,
        children: "Checking installation status\u2026"
      })
    });
  }
  return /* @__PURE__ */ jsx_runtime3.jsxs(Pane, {
    children: [
      /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            bold: true,
            children: "Diagnostics"
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 Currently running: ",
              diagnostic.installationType,
              " (",
              diagnostic.version,
              ")"
            ]
          }),
          diagnostic.packageManager && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 Package manager: ",
              diagnostic.packageManager
            ]
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 Path: ",
              diagnostic.installationPath
            ]
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 Invoked: ",
              diagnostic.invokedBinary
            ]
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 Config install method: ",
              diagnostic.configInstallMethod
            ]
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 Search: ",
              diagnostic.ripgrepStatus.working ? "OK" : "Not working",
              " (",
              diagnostic.ripgrepStatus.mode === "embedded" ? "bundled" : diagnostic.ripgrepStatus.mode === "builtin" ? "vendor" : diagnostic.ripgrepStatus.systemPath || "system",
              ")"
            ]
          }),
          diagnostic.ripgrepStatus.note && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            color: "warning",
            children: [
              "\u2514 Note: ",
              diagnostic.ripgrepStatus.note
            ]
          }),
          diagnostic.recommendation && /* @__PURE__ */ jsx_runtime3.jsxs(jsx_runtime3.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {}),
              /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                color: "warning",
                children: [
                  "Recommendation: ",
                  diagnostic.recommendation.split(`
`)[0]
                ]
              }),
              /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                dimColor: true,
                children: diagnostic.recommendation.split(`
`)[1]
              })
            ]
          }),
          diagnostic.multipleInstallations.length > 1 && /* @__PURE__ */ jsx_runtime3.jsxs(jsx_runtime3.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {}),
              /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                color: "warning",
                children: "Warning: Multiple installations found"
              }),
              diagnostic.multipleInstallations.map((install, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                children: [
                  "\u2514 ",
                  install.type,
                  " at ",
                  install.path
                ]
              }, i))
            ]
          }),
          diagnostic.warnings.length > 0 && /* @__PURE__ */ jsx_runtime3.jsxs(jsx_runtime3.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {}),
              diagnostic.warnings.map((warning, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
                flexDirection: "column",
                children: [
                  /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                    color: "warning",
                    children: [
                      "Warning: ",
                      warning.issue
                    ]
                  }),
                  /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                    children: [
                      "Fix: ",
                      warning.fix
                    ]
                  })
                ]
              }, i))
            ]
          }),
          errorsExcludingMcp.length > 0 && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
            flexDirection: "column",
            marginTop: 1,
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                bold: true,
                children: "Invalid Settings"
              }),
              /* @__PURE__ */ jsx_runtime3.jsx(ValidationErrorsList, {
                errors: errorsExcludingMcp
              })
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            bold: true,
            children: "Updates"
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 Auto-updates: ",
              diagnostic.packageManager ? "Managed by package manager" : diagnostic.autoUpdates
            ]
          }),
          diagnostic.hasUpdatePermissions !== null && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 Update permissions: ",
              diagnostic.hasUpdatePermissions ? "Yes" : "No (requires sudo)"
            ]
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 Auto-update channel: ",
              autoUpdatesChannel
            ]
          }),
          /* @__PURE__ */ jsx_runtime3.jsx(import_react.Suspense, {
            fallback: null,
            children: /* @__PURE__ */ jsx_runtime3.jsx(DistTagsDisplay, {
              promise: distTagsPromise
            })
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime3.jsx(SandboxDoctorSection, {}),
      /* @__PURE__ */ jsx_runtime3.jsx(McpParsingWarnings, {}),
      /* @__PURE__ */ jsx_runtime3.jsx(KeybindingWarnings, {}),
      envValidationErrors.length > 0 && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            bold: true,
            children: "Environment Variables"
          }),
          envValidationErrors.map((validation, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 ",
              validation.name,
              ":",
              " ",
              /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                color: validation.status === "capped" ? "warning" : "error",
                children: validation.message
              })
            ]
          }, i))
        ]
      }),
      versionLockInfo?.enabled && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            bold: true,
            children: "Version Locks"
          }),
          versionLockInfo.staleLocksCleaned > 0 && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            dimColor: true,
            children: [
              "\u2514 Cleaned ",
              versionLockInfo.staleLocksCleaned,
              " stale lock(s)"
            ]
          }),
          versionLockInfo.locks.length === 0 ? /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            dimColor: true,
            children: "\u2514 No active version locks"
          }) : versionLockInfo.locks.map((lock, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514 ",
              lock.version,
              ": PID ",
              lock.pid,
              " ",
              lock.isProcessRunning ? /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                children: "(running)"
              }) : /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                color: "warning",
                children: "(stale)"
              })
            ]
          }, i))
        ]
      }),
      agentInfo?.failedFiles && agentInfo.failedFiles.length > 0 && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            bold: true,
            color: "error",
            children: "Agent Parse Errors"
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            color: "error",
            children: [
              "\u2514 Failed to parse ",
              agentInfo.failedFiles.length,
              " agent file(s):"
            ]
          }),
          agentInfo.failedFiles.map((file, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            dimColor: true,
            children: [
              "  ",
              "\u2514 ",
              file.path,
              ": ",
              file.error
            ]
          }, i))
        ]
      }),
      pluginsErrors.length > 0 && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            bold: true,
            color: "error",
            children: "Plugin Errors"
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            color: "error",
            children: [
              "\u2514 ",
              pluginsErrors.length,
              " plugin error(s) detected:"
            ]
          }),
          pluginsErrors.map((error, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            dimColor: true,
            children: [
              "  ",
              "\u2514 ",
              error.source || "unknown",
              "plugin" in error && error.plugin ? ` [${error.plugin}]` : "",
              ": ",
              getPluginErrorMessage(error)
            ]
          }, i))
        ]
      }),
      contextWarnings?.unreachableRulesWarning && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            bold: true,
            color: "warning",
            children: "Unreachable Permission Rules"
          }),
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            children: [
              "\u2514",
              " ",
              /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                color: "warning",
                children: [
                  figures_default.warning,
                  " ",
                  contextWarnings.unreachableRulesWarning.message
                ]
              })
            ]
          }),
          contextWarnings.unreachableRulesWarning.details.map((detail, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            dimColor: true,
            children: [
              "  ",
              "\u2514 ",
              detail
            ]
          }, i))
        ]
      }),
      contextWarnings && (contextWarnings.claudeMdWarning || contextWarnings.agentWarning || contextWarnings.mcpWarning) && /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            bold: true,
            children: "Context Usage Warnings"
          }),
          contextWarnings.claudeMdWarning && /* @__PURE__ */ jsx_runtime3.jsxs(jsx_runtime3.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                children: [
                  "\u2514",
                  " ",
                  /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                    color: "warning",
                    children: [
                      figures_default.warning,
                      " ",
                      contextWarnings.claudeMdWarning.message
                    ]
                  })
                ]
              }),
              /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                children: [
                  "  ",
                  "\u2514 Files:"
                ]
              }),
              contextWarnings.claudeMdWarning.details.map((detail, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  "    ",
                  "\u2514 ",
                  detail
                ]
              }, i))
            ]
          }),
          contextWarnings.agentWarning && /* @__PURE__ */ jsx_runtime3.jsxs(jsx_runtime3.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                children: [
                  "\u2514",
                  " ",
                  /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                    color: "warning",
                    children: [
                      figures_default.warning,
                      " ",
                      contextWarnings.agentWarning.message
                    ]
                  })
                ]
              }),
              /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                children: [
                  "  ",
                  "\u2514 Top contributors:"
                ]
              }),
              contextWarnings.agentWarning.details.map((detail, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  "    ",
                  "\u2514 ",
                  detail
                ]
              }, i))
            ]
          }),
          contextWarnings.mcpWarning && /* @__PURE__ */ jsx_runtime3.jsxs(jsx_runtime3.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                children: [
                  "\u2514",
                  " ",
                  /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                    color: "warning",
                    children: [
                      figures_default.warning,
                      " ",
                      contextWarnings.mcpWarning.message
                    ]
                  })
                ]
              }),
              /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                children: [
                  "  ",
                  "\u2514 MCP servers:"
                ]
              }),
              contextWarnings.mcpWarning.details.map((detail, i) => /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  "    ",
                  "\u2514 ",
                  detail
                ]
              }, i))
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime3.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime3.jsx(PressEnterToContinue, {})
      })
    ]
  });
}
var import_react, jsx_runtime3;
var init_Doctor = __esm(() => {
  init_figures();
  init_KeybindingWarnings();
  init_McpParsingWarnings();
  init_context();
  init_envUtils();
  init_state();
  init_src();
  init_PressEnterToContinue();
  init_SandboxDoctorSection();
  init_ValidationErrorsList();
  init_useSettingsErrors();
  init_useExitOnCtrlCDWithKeybindings();
  init_src();
  init_useKeybinding();
  init_AppState();
  init_plugin();
  init_autoUpdater();
  init_doctorContextWarnings();
  init_doctorDiagnostic();
  init_envValidation();
  init_file();
  init_pidLock();
  init_settings();
  init_outputLimits();
  init_outputFormatting();
  init_xdg();
  import_react = __toESM(require_react(), 1);
  jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
});

export { Doctor, init_Doctor };

//# debugId=39C4370ACF3E911364756E2164756E21
//# sourceMappingURL=chunk-85wjqy9h.js.map
