// @bun
import {
  Select,
  Spinner,
  cleanupWorktree,
  exports_sessionStorage,
  getCurrentWorktreeSession,
  getPlansDirectory,
  gracefulShutdown,
  init_Shell,
  init_Spinner,
  init_gracefulShutdown,
  init_plans,
  init_sample,
  init_select,
  init_sessionStorage,
  init_worktree,
  keepWorktree,
  killTmuxSession,
  sample_default,
  setCwd
} from "./chunk-drtrgzzb.js";
import {
  Dialog,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-t37nnsvj.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import {
  __esm,
  __toCommonJS,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/WorktreeExitDialog.tsx
function recordWorktreeExit() {
  (init_sessionStorage(), __toCommonJS(exports_sessionStorage)).saveWorktreeState(null);
}
function WorktreeExitDialog({ onDone, onCancel }) {
  const [status, setStatus] = import_react.useState("loading");
  const [changes, setChanges] = import_react.useState([]);
  const [commitCount, setCommitCount] = import_react.useState(0);
  const [resultMessage, setResultMessage] = import_react.useState();
  const worktreeSession = getCurrentWorktreeSession();
  import_react.useEffect(() => {
    async function loadChanges() {
      let changeLines = [];
      const gitStatus = await execFileNoThrow("git", ["status", "--porcelain"]);
      if (gitStatus.stdout) {
        changeLines = gitStatus.stdout.split(`
`).filter((_) => _.trim() !== "");
        setChanges(changeLines);
      }
      if (worktreeSession) {
        const { stdout: commitsStr } = await execFileNoThrow("git", [
          "rev-list",
          "--count",
          `${worktreeSession.originalHeadCommit}..HEAD`
        ]);
        const count = parseInt(commitsStr.trim(), 10) || 0;
        setCommitCount(count);
        if (changeLines.length === 0 && count === 0) {
          setStatus("removing");
          cleanupWorktree().then(() => {
            process.chdir(worktreeSession.originalCwd);
            setCwd(worktreeSession.originalCwd);
            recordWorktreeExit();
            getPlansDirectory.cache.clear?.();
            setResultMessage("Worktree removed (no changes)");
          }).catch((error) => {
            logForDebugging(`Failed to clean up worktree: ${error}`, {
              level: "error"
            });
            setResultMessage("Worktree cleanup failed, exiting anyway");
          }).then(() => {
            setStatus("done");
          });
          return;
        } else {
          setStatus("asking");
        }
      }
    }
    loadChanges();
  }, [worktreeSession]);
  import_react.useEffect(() => {
    if (status === "done") {
      onDone(resultMessage);
    }
  }, [status, onDone, resultMessage]);
  if (!worktreeSession) {
    onDone("No active worktree session found", { display: "system" });
    return null;
  }
  if (status === "loading" || status === "done") {
    return null;
  }
  async function handleSelect(value) {
    if (!worktreeSession)
      return;
    const hasTmux = Boolean(worktreeSession.tmuxSessionName);
    if (value === "keep" || value === "keep-with-tmux") {
      setStatus("keeping");
      logEvent("tengu_worktree_kept", {
        commits: commitCount,
        changed_files: changes.length
      });
      await keepWorktree();
      process.chdir(worktreeSession.originalCwd);
      setCwd(worktreeSession.originalCwd);
      recordWorktreeExit();
      getPlansDirectory.cache.clear?.();
      if (hasTmux) {
        setResultMessage(`Worktree kept. Your work is saved at ${worktreeSession.worktreePath} on branch ${worktreeSession.worktreeBranch}. Reattach to tmux session with: tmux attach -t ${worktreeSession.tmuxSessionName}`);
      } else {
        setResultMessage(`Worktree kept. Your work is saved at ${worktreeSession.worktreePath} on branch ${worktreeSession.worktreeBranch}`);
      }
      setStatus("done");
    } else if (value === "keep-kill-tmux") {
      setStatus("keeping");
      logEvent("tengu_worktree_kept", {
        commits: commitCount,
        changed_files: changes.length
      });
      if (worktreeSession.tmuxSessionName) {
        await killTmuxSession(worktreeSession.tmuxSessionName);
      }
      await keepWorktree();
      process.chdir(worktreeSession.originalCwd);
      setCwd(worktreeSession.originalCwd);
      recordWorktreeExit();
      getPlansDirectory.cache.clear?.();
      setResultMessage(`Worktree kept at ${worktreeSession.worktreePath} on branch ${worktreeSession.worktreeBranch}. Tmux session terminated.`);
      setStatus("done");
    } else if (value === "remove" || value === "remove-with-tmux") {
      setStatus("removing");
      logEvent("tengu_worktree_removed", {
        commits: commitCount,
        changed_files: changes.length
      });
      if (worktreeSession.tmuxSessionName) {
        await killTmuxSession(worktreeSession.tmuxSessionName);
      }
      try {
        await cleanupWorktree();
        process.chdir(worktreeSession.originalCwd);
        setCwd(worktreeSession.originalCwd);
        recordWorktreeExit();
        getPlansDirectory.cache.clear?.();
      } catch (error) {
        logForDebugging(`Failed to clean up worktree: ${error}`, {
          level: "error"
        });
        setResultMessage("Worktree cleanup failed, exiting anyway");
        setStatus("done");
        return;
      }
      const tmuxNote = hasTmux ? " Tmux session terminated." : "";
      if (commitCount > 0 && changes.length > 0) {
        setResultMessage(`Worktree removed. ${commitCount} ${commitCount === 1 ? "commit" : "commits"} and uncommitted changes were discarded.${tmuxNote}`);
      } else if (commitCount > 0) {
        setResultMessage(`Worktree removed. ${commitCount} ${commitCount === 1 ? "commit" : "commits"} on ${worktreeSession.worktreeBranch} ${commitCount === 1 ? "was" : "were"} discarded.${tmuxNote}`);
      } else if (changes.length > 0) {
        setResultMessage(`Worktree removed. Uncommitted changes were discarded.${tmuxNote}`);
      } else {
        setResultMessage(`Worktree removed.${tmuxNote}`);
      }
      setStatus("done");
    }
  }
  if (status === "keeping") {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "row",
      marginY: 1,
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(Spinner, {}),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "Keeping worktree\u2026"
        })
      ]
    });
  }
  if (status === "removing") {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "row",
      marginY: 1,
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(Spinner, {}),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "Removing worktree\u2026"
        })
      ]
    });
  }
  const branchName = worktreeSession.worktreeBranch;
  const hasUncommitted = changes.length > 0;
  const hasCommits = commitCount > 0;
  let subtitle = "";
  if (hasUncommitted && hasCommits) {
    subtitle = `You have ${changes.length} uncommitted ${changes.length === 1 ? "file" : "files"} and ${commitCount} ${commitCount === 1 ? "commit" : "commits"} on ${branchName}. All will be lost if you remove.`;
  } else if (hasUncommitted) {
    subtitle = `You have ${changes.length} uncommitted ${changes.length === 1 ? "file" : "files"}. These will be lost if you remove the worktree.`;
  } else if (hasCommits) {
    subtitle = `You have ${commitCount} ${commitCount === 1 ? "commit" : "commits"} on ${branchName}. The branch will be deleted if you remove the worktree.`;
  } else {
    subtitle = "You are working in a worktree. Keep it to continue working there, or remove it to clean up.";
  }
  function handleCancel() {
    if (onCancel) {
      onCancel();
      return;
    }
    handleSelect("keep");
  }
  const removeDescription = hasUncommitted || hasCommits ? "All changes and commits will be lost." : "Clean up the worktree directory.";
  const hasTmuxSession = Boolean(worktreeSession.tmuxSessionName);
  const options = hasTmuxSession ? [
    {
      label: "Keep worktree and tmux session",
      value: "keep-with-tmux",
      description: `Stays at ${worktreeSession.worktreePath}. Reattach with: tmux attach -t ${worktreeSession.tmuxSessionName}`
    },
    {
      label: "Keep worktree, kill tmux session",
      value: "keep-kill-tmux",
      description: `Keeps worktree at ${worktreeSession.worktreePath}, terminates tmux session.`
    },
    {
      label: "Remove worktree and tmux session",
      value: "remove-with-tmux",
      description: removeDescription
    }
  ] : [
    {
      label: "Keep worktree",
      value: "keep",
      description: `Stays at ${worktreeSession.worktreePath}`
    },
    {
      label: "Remove worktree",
      value: "remove",
      description: removeDescription
    }
  ];
  const defaultValue = hasTmuxSession ? "keep-with-tmux" : "keep";
  return /* @__PURE__ */ jsx_runtime.jsx(Dialog, {
    title: "Exiting worktree session",
    subtitle,
    onCancel: handleCancel,
    children: /* @__PURE__ */ jsx_runtime.jsx(Select, {
      defaultFocusValue: defaultValue,
      options,
      onChange: handleSelect
    })
  });
}
var import_react, jsx_runtime;
var init_WorktreeExitDialog = __esm(() => {
  init_analytics();
  init_debug();
  init_src();
  init_execFileNoThrow();
  init_plans();
  init_Shell();
  init_worktree();
  init_select();
  init_Spinner();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/components/ExitFlow.tsx
function getRandomGoodbyeMessage() {
  return sample_default(GOODBYE_MESSAGES) ?? "Goodbye!";
}
function ExitFlow({ showWorktree, onDone, onCancel }) {
  async function onExit(resultMessage) {
    onDone(resultMessage ?? getRandomGoodbyeMessage());
    await gracefulShutdown(0, "prompt_input_exit");
  }
  if (showWorktree) {
    return /* @__PURE__ */ jsx_runtime2.jsx(WorktreeExitDialog, {
      onDone: onExit,
      onCancel
    });
  }
  return null;
}
var jsx_runtime2, GOODBYE_MESSAGES;
var init_ExitFlow = __esm(() => {
  init_sample();
  init_gracefulShutdown();
  init_WorktreeExitDialog();
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
  GOODBYE_MESSAGES = ["Goodbye!", "See ya!", "Bye!", "Catch you later!"];
});

export { ExitFlow, init_ExitFlow };

//# debugId=4972ABBCE2FE6D9764756E2164756E21
//# sourceMappingURL=chunk-6zdvhh8g.js.map
