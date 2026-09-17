// @bun
import {
  enablePluginOp,
  init_pluginOperations
} from "./chunk-1a4vs692.js";
import {
  init_pluginStartupCheck,
  installSelectedPlugins
} from "./chunk-xvq6qy3p.js";
import {
  OFFICIAL_MARKETPLACE_NAME,
  Select,
  Spinner,
  addMarketplaceSource,
  clearAllCaches,
  clearMarketplacesCache,
  init_Spinner,
  init_cacheUtils,
  init_installedPluginsManager,
  init_marketplaceManager,
  init_officialMarketplace,
  init_pluginLoader,
  init_select,
  isPluginInstalled,
  loadAllPlugins,
  loadKnownMarketplacesConfig,
  refreshMarketplace
} from "./chunk-mxbn7v69.js";
import {
  init_file,
  pathExists
} from "./chunk-mhtd3kea.js";
import {
  getPlatform,
  init_platform
} from "./chunk-psygyacq.js";
import {
  Dialog,
  ThemedBox_default,
  ThemedText,
  init_src,
  instances_default,
  require_react
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-t37nnsvj.js";
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
import {
  execa,
  init_execa
} from "./chunk-c1yc761e.js";
import {
  init_debug,
  init_errors,
  isENOENT,
  logForDebugging,
  toError
} from "./chunk-82pkdrt0.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/thinkback/thinkback.tsx
import { readFile } from "fs/promises";
import { join } from "path";
function getMarketplaceName() {
  return process.env.USER_TYPE === "ant" ? INTERNAL_MARKETPLACE_NAME : OFFICIAL_MARKETPLACE_NAME;
}
function getMarketplaceRepo() {
  return process.env.USER_TYPE === "ant" ? INTERNAL_MARKETPLACE_REPO : OFFICIAL_MARKETPLACE_REPO;
}
function getPluginId() {
  return `thinkback@${getMarketplaceName()}`;
}
async function getThinkbackSkillDir() {
  const { enabled } = await loadAllPlugins();
  const thinkbackPlugin = enabled.find((p) => p.name === "thinkback" || p.source && p.source.includes(getPluginId()));
  if (!thinkbackPlugin) {
    return null;
  }
  const skillDir = join(thinkbackPlugin.path, "skills", SKILL_NAME);
  if (await pathExists(skillDir)) {
    return skillDir;
  }
  return null;
}
async function playAnimation(skillDir) {
  const dataPath = join(skillDir, "year_in_review.js");
  const playerPath = join(skillDir, "player.js");
  try {
    await readFile(dataPath);
  } catch (e) {
    if (isENOENT(e)) {
      return {
        success: false,
        message: "No animation found. Run /think-back first to generate one."
      };
    }
    logError(e);
    return {
      success: false,
      message: `Could not access animation data: ${toError(e).message}`
    };
  }
  try {
    await readFile(playerPath);
  } catch (e) {
    if (isENOENT(e)) {
      return {
        success: false,
        message: "Player script not found. The player.js file is missing from the thinkback skill."
      };
    }
    logError(e);
    return {
      success: false,
      message: `Could not access player script: ${toError(e).message}`
    };
  }
  const inkInstance = instances_default.get(process.stdout);
  if (!inkInstance) {
    return { success: false, message: "Failed to access terminal instance" };
  }
  inkInstance.enterAlternateScreen();
  try {
    await execa("node", [playerPath], {
      stdio: "inherit",
      cwd: skillDir,
      reject: false
    });
  } catch {} finally {
    inkInstance.exitAlternateScreen();
  }
  const htmlPath = join(skillDir, "year_in_review.html");
  if (await pathExists(htmlPath)) {
    const platform = getPlatform();
    const openCmd = platform === "macos" ? "open" : platform === "windows" ? "start" : "xdg-open";
    execFileNoThrow(openCmd, [htmlPath]);
  }
  return { success: true, message: "Year in review animation complete!" };
}
function ThinkbackInstaller({
  onReady,
  onError
}) {
  const [state, setState] = import_react.useState({ phase: "checking" });
  const [progressMessage, setProgressMessage] = import_react.useState("");
  import_react.useEffect(() => {
    async function checkAndInstall() {
      try {
        const knownMarketplaces = await loadKnownMarketplacesConfig();
        const marketplaceName = getMarketplaceName();
        const marketplaceRepo = getMarketplaceRepo();
        const pluginId = getPluginId();
        const marketplaceInstalled = marketplaceName in knownMarketplaces;
        const pluginAlreadyInstalled = isPluginInstalled(pluginId);
        if (!marketplaceInstalled) {
          setState({ phase: "installing-marketplace" });
          logForDebugging(`Installing marketplace ${marketplaceRepo}`);
          await addMarketplaceSource({ source: "github", repo: marketplaceRepo }, (message) => {
            setProgressMessage(message);
          });
          clearAllCaches();
          logForDebugging(`Marketplace ${marketplaceName} installed`);
        } else if (!pluginAlreadyInstalled) {
          setState({ phase: "installing-marketplace" });
          setProgressMessage("Updating marketplace\u2026");
          logForDebugging(`Refreshing marketplace ${marketplaceName}`);
          await refreshMarketplace(marketplaceName, (message) => {
            setProgressMessage(message);
          });
          clearMarketplacesCache();
          clearAllCaches();
          logForDebugging(`Marketplace ${marketplaceName} refreshed`);
        }
        if (!pluginAlreadyInstalled) {
          setState({ phase: "installing-plugin" });
          logForDebugging(`Installing plugin ${pluginId}`);
          const result = await installSelectedPlugins([pluginId]);
          if (result.failed.length > 0) {
            const errorMsg = result.failed.map((f) => `${f.name}: ${f.error}`).join(", ");
            throw new Error(`Failed to install plugin: ${errorMsg}`);
          }
          clearAllCaches();
          logForDebugging(`Plugin ${pluginId} installed`);
        } else {
          const { disabled } = await loadAllPlugins();
          const isDisabled = disabled.some((p) => p.name === "thinkback" || p.source?.includes(pluginId));
          if (isDisabled) {
            setState({ phase: "enabling-plugin" });
            logForDebugging(`Enabling plugin ${pluginId}`);
            const enableResult = await enablePluginOp(pluginId);
            if (!enableResult.success) {
              throw new Error(`Failed to enable plugin: ${enableResult.message}`);
            }
            clearAllCaches();
            logForDebugging(`Plugin ${pluginId} enabled`);
          }
        }
        setState({ phase: "ready" });
        onReady();
      } catch (error) {
        const err = toError(error);
        logError(err);
        setState({ phase: "error", message: err.message });
        onError(err.message);
      }
    }
    checkAndInstall();
  }, [onReady, onError]);
  if (state.phase === "error") {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        color: "error",
        children: [
          "Error: ",
          state.message
        ]
      })
    });
  }
  if (state.phase === "ready") {
    return null;
  }
  const statusMessage = state.phase === "checking" ? "Checking thinkback installation\u2026" : state.phase === "installing-marketplace" ? "Installing marketplace\u2026" : state.phase === "enabling-plugin" ? "Enabling thinkback plugin\u2026" : "Installing thinkback plugin\u2026";
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
    flexDirection: "column",
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(Spinner, {}),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: progressMessage || statusMessage
        })
      ]
    })
  });
}
function ThinkbackMenu({
  onDone,
  onAction,
  skillDir,
  hasGenerated
}) {
  const [hasSelected, setHasSelected] = import_react.useState(false);
  const options = hasGenerated ? [
    {
      label: "Play animation",
      value: "play",
      description: "Watch your year in review"
    },
    {
      label: "Edit content",
      value: "edit",
      description: "Modify the animation"
    },
    {
      label: "Fix errors",
      value: "fix",
      description: "Fix validation or rendering issues"
    },
    {
      label: "Regenerate",
      value: "regenerate",
      description: "Create a new animation from scratch"
    }
  ] : [
    {
      label: "Let's go!",
      value: "regenerate",
      description: "Generate your personalized animation"
    }
  ];
  function handleSelect(value) {
    setHasSelected(true);
    if (value === "play") {
      playAnimation(skillDir).then(() => {
        onDone(undefined, { display: "skip" });
      });
    } else {
      onAction(value);
    }
  }
  function handleCancel() {
    onDone(undefined, { display: "skip" });
  }
  if (hasSelected) {
    return null;
  }
  return /* @__PURE__ */ jsx_runtime.jsx(Dialog, {
    title: "Think Back on 2025 with Claude Code",
    subtitle: "Generate your 2025 Claude Code Think Back (takes a few minutes to run)",
    onCancel: handleCancel,
    color: "claude",
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        !hasGenerated && /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "Relive your year of coding with Claude."
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: "We'll create a personalized ASCII animation celebrating your journey."
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(Select, {
          options,
          onChange: handleSelect,
          visibleOptionCount: 5
        })
      ]
    })
  });
}
function ThinkbackFlow({
  onDone
}) {
  const [installComplete, setInstallComplete] = import_react.useState(false);
  const [installError, setInstallError] = import_react.useState(null);
  const [skillDir, setSkillDir] = import_react.useState(null);
  const [hasGenerated, setHasGenerated] = import_react.useState(null);
  function handleReady() {
    setInstallComplete(true);
  }
  const handleError = import_react.useCallback((message) => {
    setInstallError(message);
    onDone(`Error with thinkback: ${message}. Try running /plugin to manually install the think-back plugin.`, {
      display: "system"
    });
  }, [onDone]);
  import_react.useEffect(() => {
    if (installComplete && !skillDir && !installError) {
      getThinkbackSkillDir().then((dir) => {
        if (dir) {
          logForDebugging(`Thinkback skill directory: ${dir}`);
          setSkillDir(dir);
        } else {
          handleError("Could not find thinkback skill directory");
        }
      });
    }
  }, [installComplete, skillDir, installError, handleError]);
  import_react.useEffect(() => {
    if (!skillDir) {
      return;
    }
    const dataPath = join(skillDir, "year_in_review.js");
    pathExists(dataPath).then((exists) => {
      logForDebugging(`Checking for ${dataPath}: ${exists ? "found" : "not found"}`);
      setHasGenerated(exists);
    });
  }, [skillDir]);
  function handleAction(action) {
    const prompts = {
      edit: EDIT_PROMPT,
      fix: FIX_PROMPT,
      regenerate: REGENERATE_PROMPT
    };
    onDone(prompts[action], { display: "user", shouldQuery: true });
  }
  if (installError) {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          color: "error",
          children: [
            "Error: ",
            installError
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "Try running /plugin to manually install the think-back plugin."
        })
      ]
    });
  }
  if (!installComplete) {
    return /* @__PURE__ */ jsx_runtime.jsx(ThinkbackInstaller, {
      onReady: handleReady,
      onError: handleError
    });
  }
  if (!skillDir || hasGenerated === null) {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(Spinner, {}),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "Loading thinkback skill\u2026"
        })
      ]
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ThinkbackMenu, {
    onDone,
    onAction: handleAction,
    skillDir,
    hasGenerated
  });
}
async function call(onDone) {
  return /* @__PURE__ */ jsx_runtime.jsx(ThinkbackFlow, {
    onDone
  });
}
var import_react, jsx_runtime, INTERNAL_MARKETPLACE_NAME = "claude-code-marketplace", INTERNAL_MARKETPLACE_REPO = "anthropics/claude-code-marketplace", OFFICIAL_MARKETPLACE_REPO = "anthropics/claude-plugins-official", SKILL_NAME = "thinkback", EDIT_PROMPT = 'Use the Skill tool to invoke the "thinkback" skill with mode=edit to modify my existing Claude Code year in review animation. Ask me what I want to change. When the animation is ready, tell the user to run /think-back again to play it.', FIX_PROMPT = 'Use the Skill tool to invoke the "thinkback" skill with mode=fix to fix validation or rendering errors in my existing Claude Code year in review animation. Run the validator, identify errors, and fix them. When the animation is ready, tell the user to run /think-back again to play it.', REGENERATE_PROMPT = 'Use the Skill tool to invoke the "thinkback" skill with mode=regenerate to create a completely new Claude Code year in review animation from scratch. Delete the existing animation and start fresh. When the animation is ready, tell the user to run /think-back again to play it.';
var init_thinkback = __esm(() => {
  init_execa();
  init_select();
  init_src();
  init_Spinner();
  init_src();
  init_pluginOperations();
  init_debug();
  init_errors();
  init_execFileNoThrow();
  init_file();
  init_log();
  init_platform();
  init_cacheUtils();
  init_installedPluginsManager();
  init_marketplaceManager();
  init_officialMarketplace();
  init_pluginLoader();
  init_pluginStartupCheck();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { playAnimation, call, init_thinkback };

//# debugId=22038DA47769304764756E2164756E21
//# sourceMappingURL=chunk-wkrg940q.js.map
