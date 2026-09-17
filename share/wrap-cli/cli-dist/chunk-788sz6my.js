// @bun
import {
  getWorkflowService,
  init_service
} from "./chunk-92frfsdm.js";
import"./chunk-14p6wvsq.js";
import"./chunk-sndpqnmg.js";
import"./chunk-5w7gsjdj.js";
import"./chunk-28jd8qjx.js";
import"./chunk-ptxteaeh.js";
import"./chunk-hkv7c3s6.js";
import"./chunk-f40jvwgw.js";
import {
  SentryErrorBoundary,
  init_SentryErrorBoundary
} from "./chunk-w9t7xj87.js";
import"./chunk-xah6e91t.js";
import"./chunk-qvq9z8k4.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-0rhrpnpv.js";
import"./chunk-wgwq4gvd.js";
import"./chunk-djt39ze3.js";
import"./chunk-4x9pek6a.js";
import"./chunk-71sdcaq6.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-4rer68y0.js";
import"./chunk-f2rhkq3t.js";
import"./chunk-5cf3czgf.js";
import"./chunk-bhgvey4s.js";
import"./chunk-xp6v07f0.js";
import"./chunk-ffq9eh6d.js";
import"./chunk-kbkxsgv3.js";
import"./chunk-24kv69g3.js";
import"./chunk-2vk6e88k.js";
import"./chunk-n1j46ncq.js";
import"./chunk-hdtp7tn1.js";
import"./chunk-jt482g7x.js";
import"./chunk-4spgkgr3.js";
import"./chunk-8wzca1dh.js";
import"./chunk-833fsr7s.js";
import"./chunk-2m7k0qdy.js";
import"./chunk-60fkafk2.js";
import"./chunk-mt660rpv.js";
import"./chunk-7b68gcqs.js";
import"./chunk-q4dg9ftz.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-nde5ym6a.js";
import"./chunk-a4q88q6t.js";
import"./chunk-1d7prqr7.js";
import"./chunk-nfc2mwg3.js";
import"./chunk-c40ryser.js";
import"./chunk-qw03ehq0.js";
import"./chunk-1qgb1568.js";
import"./chunk-0jw2cfy8.js";
import"./chunk-935nrvdb.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-w6cgk6nk.js";
import"./chunk-hqxp6b72.js";
import"./chunk-2ehn4hjt.js";
import"./chunk-zymr6ztr.js";
import"./chunk-w5hnghah.js";
import"./chunk-vdz79ezt.js";
import"./chunk-msarpzkm.js";
import"./chunk-s76nvx50.js";
import"./chunk-gb0km2ev.js";
import"./chunk-ghhmj79c.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-rwny7j7h.js";
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
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-e4dsy4g1.js";
import"./chunk-326zehp8.js";
import"./chunk-kc67kt75.js";
import"./chunk-40t1d75v.js";
import"./chunk-1k7v4v6f.js";
import"./chunk-e3abfxpy.js";
import"./chunk-q44zc68f.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import {
  Dialog,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  useAnimationFrame,
  use_input_default
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-wdyw5x2b.js";
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

// src/workflow/panel/status.ts
function agentVisual(a) {
  if (a.status === "running")
    return { mark: "\u25CF", color: "warning" };
  if (a.resultKind === "dead")
    return { mark: "\u2717", color: "error" };
  return { mark: "\u2713", color: "success" };
}
function formatTokenCount(n) {
  if (!n)
    return "0";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function agentMetaText(a) {
  const parts = [];
  if (a.model)
    parts.push(a.model);
  parts.push(`${formatTokenCount(a.tokenCount)} tok`);
  parts.push(`${a.toolCount ?? 0} tool`);
  return parts.join(" \xB7 ");
}
var STATUS_DOT, RUN_STATUS_COLOR, RUN_STATUS_TEXT, PHASE_MARK, PHASE_COLOR;
var init_status = __esm(() => {
  STATUS_DOT = {
    running: "\u25CF",
    completed: "\u2713",
    failed: "\u2717",
    killed: "\u25A0"
  };
  RUN_STATUS_COLOR = {
    running: "warning",
    completed: "success",
    failed: "error",
    killed: "subtle"
  };
  RUN_STATUS_TEXT = {
    running: "running",
    completed: "done",
    failed: "failed",
    killed: "killed"
  };
  PHASE_MARK = {
    running: "\u25CF",
    done: "\u2713",
    pending: "\u25CB"
  };
  PHASE_COLOR = {
    running: "warning",
    done: "success",
    pending: "subtle"
  };
});

// src/workflow/panel/AgentList.tsx
function truncateLabel(raw, max) {
  if (raw.length <= max)
    return raw;
  const m = raw.match(/#\d+$/);
  if (!m)
    return raw.slice(0, max);
  const suffix = m[0];
  const prefix = raw.slice(0, raw.length - suffix.length);
  const available = max - suffix.length - 1;
  return `${prefix.slice(0, available)}\u2026${suffix}`;
}
function AgentList({
  agents,
  selectedIndex,
  focused
}) {
  const [ref, time] = useAnimationFrame(FRAME_MS);
  const frame = SPINNER_FRAMES[Math.floor(time / FRAME_MS) % SPINNER_FRAMES.length];
  if (agents.length === 0) {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
      color: "subtle",
      children: "(no agents in this phase)"
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
    ref,
    flexDirection: "column",
    children: agents.map((a, i) => {
      const v = agentVisual(a);
      const selected = i === selectedIndex;
      const highlighted = selected && focused;
      const running = a.status === "running";
      const mark = running ? frame : v.mark;
      const label = truncateLabel(a.label ?? `agent-${a.id}`, LABEL_MAX);
      return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        backgroundColor: highlighted ? "selectionBg" : undefined,
        justifyContent: "space-between",
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                color: v.color,
                children: mark
              }),
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                children: [
                  " ",
                  label
                ]
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            color: "subtle",
            children: agentMetaText(a)
          })
        ]
      }, a.id);
    })
  });
}
var jsx_runtime, SPINNER_FRAMES, FRAME_MS = 120, LABEL_MAX = 18;
var init_AgentList = __esm(() => {
  init_src();
  init_status();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  SPINNER_FRAMES = ["\xB7", "\u2722", "\u2731", "\u2736", "\u273B", "\u273D"];
});

// src/workflow/panel/selectors.ts
function derivePhaseStatus(actual, inPhase) {
  if (actual?.status === "done")
    return "done";
  if (inPhase.length > 0) {
    return inPhase.every((a) => a.status === "done") ? "done" : "running";
  }
  return actual?.status === "running" ? "running" : "pending";
}
function mergePhases(run) {
  const actualByTitle = new Map(run.phases.map((p) => [p.title, p]));
  const seen = new Set;
  const out = [];
  const push = (title) => {
    if (seen.has(title))
      return;
    seen.add(title);
    const actual = actualByTitle.get(title);
    const inPhase = run.agents.filter((a) => a.phase === title);
    out.push({
      title,
      status: derivePhaseStatus(actual, inPhase),
      done: inPhase.filter((a) => a.status === "done").length,
      total: inPhase.length
    });
  };
  for (const t of run.declaredPhases)
    push(t);
  for (const p of run.phases)
    push(p.title);
  for (const a of run.agents) {
    if (a.phase)
      push(a.phase);
  }
  return out;
}
function filterAgentsByPhase(agents, selectedPhase) {
  if (selectedPhase === undefined || selectedPhase === ALL_PHASE)
    return agents;
  return agents.filter((a) => a.phase === selectedPhase);
}
function filterActiveRuns(runs) {
  return runs.filter((r) => r.status === "running");
}
function capTabsForDisplay(runs, maxTabs) {
  const cap = Math.max(0, Math.trunc(maxTabs));
  const visible = runs.slice(0, cap);
  return { runs: visible, overflow: Math.max(0, runs.length - visible.length) };
}
function tabLabel(workflowName, runId) {
  return `${workflowName}#${runId.slice(-4)}`;
}
function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60)
    return `${s}s`;
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m < 60)
    return `${m}m${String(ss).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h${String(m % 60).padStart(2, "0")}m`;
}
var ALL_PHASE = "All";
var init_selectors = () => {};

// src/workflow/panel/PhaseSidebar.tsx
function PhaseSidebar({
  phases,
  agents,
  selectedIndex,
  focused
}) {
  const [ref, time] = useAnimationFrame(FRAME_MS2);
  const frame = SPINNER_FRAMES2[Math.floor(time / FRAME_MS2) % SPINNER_FRAMES2.length];
  const totalAgents = agents.length;
  const doneAgents = agents.filter((a) => a.status === "done").length;
  const rows = [{ title: ALL_PHASE, done: doneAgents, total: totalAgents }, ...phases];
  return /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
    ref,
    flexDirection: "column",
    children: rows.map((row, i) => {
      const selected = i === selectedIndex;
      const highlighted = selected && focused;
      const running = row.status === "running";
      const mark = running ? frame : row.status ? PHASE_MARK[row.status] : " ";
      const color = row.status ? PHASE_COLOR[row.status] : "subtle";
      return /* @__PURE__ */ jsx_runtime2.jsxs(ThemedBox_default, {
        backgroundColor: highlighted ? "selectionBg" : undefined,
        justifyContent: "space-between",
        children: [
          /* @__PURE__ */ jsx_runtime2.jsxs(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
                color: selected ? "claude" : undefined,
                children: highlighted ? ">" : " "
              }),
              /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
                children: " "
              }),
              /* @__PURE__ */ jsx_runtime2.jsx(ThemedText, {
                color,
                children: mark
              }),
              /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
                children: [
                  " ",
                  row.title
                ]
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime2.jsxs(ThemedText, {
            color: "subtle",
            children: [
              row.done,
              "/",
              row.total
            ]
          })
        ]
      }, row.title);
    })
  });
}
var jsx_runtime2, SPINNER_FRAMES2, FRAME_MS2 = 120;
var init_PhaseSidebar = __esm(() => {
  init_src();
  init_status();
  init_selectors();
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
  SPINNER_FRAMES2 = ["\xB7", "\u2722", "\u2731", "\u2736", "\u273B", "\u273D"];
});

// src/workflow/panel/TabsBar.tsx
function TabsBar({ runs, activeRunId }) {
  if (runs.length === 0) {
    return /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
      color: "subtle",
      children: "(no runs)"
    });
  }
  const { runs: visible, overflow } = capTabsForDisplay(runs, MAX_TABS);
  return /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
    children: [
      visible.map((r) => {
        const active = r.runId === activeRunId;
        const label = truncateLabel(tabLabel(r.workflowName, r.runId), TAB_LABEL_MAX);
        const underline = "\u2550".repeat(label.length + 2);
        return /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
          flexDirection: "column",
          marginRight: 2,
          children: [
            /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
              children: [
                /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                  color: RUN_STATUS_COLOR[r.status],
                  children: STATUS_DOT[r.status]
                }),
                /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                  children: " "
                }),
                /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
                  color: active ? "claude" : undefined,
                  bold: active,
                  children: label
                })
              ]
            }),
            /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
              color: active ? "claude" : undefined,
              children: active ? underline : ""
            })
          ]
        }, r.runId);
      }),
      overflow > 0 ? /* @__PURE__ */ jsx_runtime3.jsxs(ThemedBox_default, {
        flexDirection: "column",
        marginRight: 2,
        children: [
          /* @__PURE__ */ jsx_runtime3.jsxs(ThemedText, {
            color: "subtle",
            children: [
              "+",
              overflow
            ]
          }),
          /* @__PURE__ */ jsx_runtime3.jsx(ThemedText, {
            children: " "
          })
        ]
      }) : null
    ]
  });
}
var jsx_runtime3, TAB_LABEL_MAX = 18, MAX_TABS = 6;
var init_TabsBar = __esm(() => {
  init_src();
  init_status();
  init_selectors();
  init_AgentList();
  jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
});

// src/workflow/panel/useWorkflowKeyboard.ts
function routeWorkflowKey(input, key, mode = "normal") {
  if (mode === "confirm") {
    if (input === "y" || input === "Y" || key.return)
      return "confirmYes";
    if (input === "n" || input === "N" || key.escape || input === "q") {
      return "confirmNo";
    }
    return null;
  }
  if (key.tab || input === "\t")
    return key.shift ? "prevTab" : "nextTab";
  if (key.escape || input === "q")
    return "quit";
  if (input === "K")
    return "killWorkflow";
  if (input === "x")
    return "killAgent";
  if (input === "r")
    return "resume";
  if (input === "n")
    return "newRun";
  if (key.leftArrow)
    return "focusLeft";
  if (key.rightArrow)
    return "focusRight";
  if (key.upArrow)
    return "moveUp";
  if (key.downArrow)
    return "moveDown";
  return null;
}
function useWorkflowKeyboard(h, mode = "normal") {
  use_input_default((input, key) => {
    const action = routeWorkflowKey(input, key, mode);
    if (action === null)
      return;
    switch (action) {
      case "nextTab":
        h.nextTab();
        break;
      case "prevTab":
        h.prevTab();
        break;
      case "focusLeft":
        h.focusLeft();
        break;
      case "focusRight":
        h.focusRight();
        break;
      case "moveUp":
        h.moveUp();
        break;
      case "moveDown":
        h.moveDown();
        break;
      case "killAgent":
        h.killAgent();
        break;
      case "killWorkflow":
        h.killWorkflow();
        break;
      case "resume":
        h.resumeFocused();
        break;
      case "newRun":
        h.newRun();
        break;
      case "quit":
        h.quit();
        break;
      case "confirmYes":
        h.confirmYes();
        break;
      case "confirmNo":
        h.confirmNo();
        break;
    }
  });
}
var init_useWorkflowKeyboard = __esm(() => {
  init_src();
});

// src/workflow/panel/WorkflowsPanel.tsx
function clampSelected(selected, len) {
  if (len === 0)
    return 0;
  const n = Math.trunc(selected);
  if (Number.isNaN(n) || n < 0)
    return 0;
  return Math.min(n, len - 1);
}
function isRunTerminatedTransition(prev, curr) {
  if (!prev || !curr)
    return false;
  if (prev.runId !== curr.runId)
    return false;
  if (prev.status !== "running")
    return false;
  return curr.status === "completed" || curr.status === "failed" || curr.status === "killed";
}
function WorkflowsPanel({
  onDone,
  context
}) {
  const svc = getWorkflowService();
  const runs = import_react.useSyncExternalStore(svc.subscribe, () => svc.listRuns(), () => []);
  const activeRuns = filterActiveRuns(runs);
  const [activeRunId, setActiveRunId] = import_react.useState(null);
  const [focusColumn, setFocusColumn] = import_react.useState("phases");
  const [selectedPhaseIndex, setSelectedPhaseIndex] = import_react.useState(0);
  const [selectedAgentIndex, setSelectedAgentIndex] = import_react.useState(0);
  const [confirmKill, setConfirmKill] = import_react.useState(null);
  import_react.useEffect(() => {
    svc.loadPersistedRuns();
  }, [svc]);
  import_react.useEffect(() => {
    if (activeRuns.length === 0) {
      if (activeRunId !== null)
        setActiveRunId(null);
      return;
    }
    if (!activeRuns.some((r) => r.runId === activeRunId)) {
      setActiveRunId(activeRuns[0].runId);
    }
  }, [activeRuns, activeRunId]);
  const focused = activeRuns.find((r) => r.runId === activeRunId);
  const phases = focused ? mergePhases(focused) : [];
  const phaseRowCount = phases.length + 1;
  const clampedPhase = clampSelected(selectedPhaseIndex, phaseRowCount);
  const prevFocusedRef = import_react.useRef(null);
  import_react.useEffect(() => {
    const curr = focused ? { runId: focused.runId, status: focused.status } : null;
    const prev = prevFocusedRef.current;
    prevFocusedRef.current = curr;
    if (!isRunTerminatedTransition(prev, curr))
      return;
    const timer = setTimeout(() => onDone(), 800);
    return () => {
      clearTimeout(timer);
    };
  }, [focused?.runId, focused?.status, onDone]);
  const selectedPhaseTitle = clampedPhase === 0 ? undefined : phases[clampedPhase - 1]?.title;
  const visibleAgents = focused ? filterAgentsByPhase(focused.agents, selectedPhaseTitle) : [];
  const clampedAgent = clampSelected(selectedAgentIndex, visibleAgents.length);
  const switchTab = (runId) => {
    setActiveRunId(runId);
    setFocusColumn("phases");
    setSelectedPhaseIndex(0);
    setSelectedAgentIndex(0);
  };
  const nextTab = () => {
    if (activeRuns.length === 0)
      return;
    const idx = activeRuns.findIndex((r) => r.runId === activeRunId);
    const next = activeRuns[(idx + 1) % activeRuns.length];
    switchTab(next.runId);
  };
  const prevTab = () => {
    if (activeRuns.length === 0)
      return;
    const idx = activeRuns.findIndex((r) => r.runId === activeRunId);
    const next = activeRuns[(idx - 1 + activeRuns.length) % activeRuns.length];
    switchTab(next.runId);
  };
  const handlers = {
    nextTab,
    prevTab,
    focusLeft: () => setFocusColumn("phases"),
    focusRight: () => setFocusColumn("agents"),
    moveUp: () => {
      if (focusColumn === "phases")
        setSelectedPhaseIndex((s) => clampSelected(s - 1, phaseRowCount));
      else
        setSelectedAgentIndex((s) => clampSelected(s - 1, visibleAgents.length));
    },
    moveDown: () => {
      if (focusColumn === "phases")
        setSelectedPhaseIndex((s) => clampSelected(s + 1, phaseRowCount));
      else
        setSelectedAgentIndex((s) => clampSelected(s + 1, visibleAgents.length));
    },
    killAgent: () => {
      if (focusColumn !== "agents" || !focused)
        return;
      const agent = visibleAgents[clampedAgent];
      if (!agent)
        return;
      setConfirmKill("agent");
    },
    killWorkflow: () => {
      if (!focused)
        return;
      setConfirmKill("workflow");
    },
    resumeFocused: () => {
      if (!focused)
        return;
      const canUseTool = context.canUseTool;
      if (!canUseTool) {
        onDone("resume needs canUseTool context; run /<name> resume from the main session.");
        return;
      }
      svc.launch({ resumeFromRunId: focused.runId, name: focused.workflowName }, context, canUseTool).catch((e) => onDone(`resume failed: ${e.message}`));
    },
    newRun: () => onDone("Tip: start a named workflow with /<name>, or pass name via the Workflow tool."),
    quit: () => {
      if (confirmKill !== null) {
        setConfirmKill(null);
        return;
      }
      onDone();
    },
    confirmYes: () => {
      if (confirmKill === "workflow" && focused) {
        svc.kill(focused.runId);
        setConfirmKill(null);
        onDone();
        return;
      } else if (confirmKill === "agent" && focused) {
        const agent = visibleAgents[clampedAgent];
        if (agent)
          svc.killAgent(focused.runId, agent.id);
      }
      setConfirmKill(null);
    },
    confirmNo: () => setConfirmKill(null)
  };
  useWorkflowKeyboard(handlers, confirmKill !== null ? "confirm" : "normal");
  const running = runs.filter((r) => r.status === "running").length;
  const done = runs.length - running;
  const phaseHeader = selectedPhaseTitle ?? ALL_PHASE;
  const agentDone = focused ? focused.agents.filter((a) => a.status === "done").length : 0;
  const [clockRef] = useAnimationFrame(1000);
  const elapsed = focused ? Date.now() - focused.startedAt : 0;
  return /* @__PURE__ */ jsx_runtime4.jsxs(ThemedBox_default, {
    ref: clockRef,
    flexDirection: "column",
    borderStyle: "round",
    borderColor: "claude",
    paddingX: 1,
    children: [
      /* @__PURE__ */ jsx_runtime4.jsxs(ThemedBox_default, {
        justifyContent: "space-between",
        children: [
          /* @__PURE__ */ jsx_runtime4.jsx(ThemedText, {
            bold: true,
            children: focused?.workflowName ?? "Workflows"
          }),
          focused ? /* @__PURE__ */ jsx_runtime4.jsxs(ThemedText, {
            color: "subtle",
            children: [
              agentDone,
              "/",
              focused.agentCount,
              " agents \xB7 ",
              formatDuration(elapsed),
              " \xB7",
              " ",
              /* @__PURE__ */ jsx_runtime4.jsx(ThemedText, {
                color: RUN_STATUS_COLOR[focused.status],
                children: RUN_STATUS_TEXT[focused.status]
              })
            ]
          }) : /* @__PURE__ */ jsx_runtime4.jsxs(ThemedText, {
            color: "subtle",
            children: [
              running,
              " running \xB7 ",
              done,
              " done"
            ]
          })
        ]
      }),
      focused?.description ? /* @__PURE__ */ jsx_runtime4.jsx(ThemedText, {
        color: "subtle",
        children: focused.description
      }) : null,
      activeRuns.length > 1 ? /* @__PURE__ */ jsx_runtime4.jsx(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_runtime4.jsx(TabsBar, {
          runs: activeRuns,
          activeRunId
        })
      }) : null,
      /* @__PURE__ */ jsx_runtime4.jsxs(ThemedBox_default, {
        flexDirection: "row",
        marginTop: 1,
        children: [
          /* @__PURE__ */ jsx_runtime4.jsxs(ThemedBox_default, {
            width: "25%",
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime4.jsx(ThemedText, {
                color: focusColumn === "phases" ? "claude" : "subtle",
                bold: true,
                children: "Phases"
              }),
              /* @__PURE__ */ jsx_runtime4.jsx(PhaseSidebar, {
                phases,
                agents: focused?.agents ?? [],
                selectedIndex: clampedPhase,
                focused: focusColumn === "phases"
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime4.jsx(ThemedText, {
            color: "subtle",
            children: "\u2502"
          }),
          /* @__PURE__ */ jsx_runtime4.jsxs(ThemedBox_default, {
            flexGrow: 1,
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime4.jsxs(ThemedText, {
                color: focusColumn === "agents" ? "claude" : "subtle",
                bold: true,
                children: [
                  phaseHeader,
                  " \xB7 ",
                  visibleAgents.length,
                  " agents"
                ]
              }),
              /* @__PURE__ */ jsx_runtime4.jsx(AgentList, {
                agents: visibleAgents,
                selectedIndex: clampedAgent,
                focused: focusColumn === "agents"
              })
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime4.jsx(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_runtime4.jsx(ThemedText, {
          color: "subtle",
          children: confirmKill !== null ? "Confirm: y kill \xB7 n/Esc cancel" : "Tab switch run \xB7 \u2190/\u2192 focus \xB7 \u2191/\u2193 move \xB7 x kill agent \xB7 K kill workflow \xB7 r resume \xB7 q quit"
        })
      }),
      confirmKill !== null ? /* @__PURE__ */ jsx_runtime4.jsx(Dialog, {
        title: confirmKill === "workflow" ? `Kill workflow "${focused?.workflowName ?? ""}"?` : `Kill agent "${visibleAgents[clampedAgent]?.label ?? ""}"?`,
        subtitle: confirmKill === "workflow" ? "All in-flight agents will be aborted. Resume will replay from journal." : "Only this agent aborts; other agents in the workflow keep running.",
        onCancel: () => setConfirmKill(null),
        color: "warning",
        children: /* @__PURE__ */ jsx_runtime4.jsx(ThemedText, {
          color: "subtle",
          children: "Press y to confirm, or n/Esc to cancel."
        })
      }) : null
    ]
  });
}
var import_react, jsx_runtime4;
var init_WorkflowsPanel = __esm(() => {
  init_src();
  init_service();
  init_AgentList();
  init_PhaseSidebar();
  init_TabsBar();
  init_status();
  init_useWorkflowKeyboard();
  init_selectors();
  import_react = __toESM(require_react(), 1);
  jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
});

// src/workflow/panel/panelCall.tsx
var jsx_runtime5, call = async (onDone, context, _args) => /* @__PURE__ */ jsx_runtime5.jsx(SentryErrorBoundary, {
  name: "WorkflowsPanel",
  children: /* @__PURE__ */ jsx_runtime5.jsx(WorkflowsPanel, {
    onDone,
    context
  })
});
var init_panelCall = __esm(() => {
  init_SentryErrorBoundary();
  init_WorkflowsPanel();
  jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
});
init_panelCall();

export {
  call
};

//# debugId=4056A70C711B3E3E64756E2164756E21
//# sourceMappingURL=chunk-788sz6my.js.map
