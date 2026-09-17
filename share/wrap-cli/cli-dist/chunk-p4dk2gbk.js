// @bun
import {
  assertSubscriptionBaseUrl,
  init_hostGuard
} from "./chunk-p3a84etr.js";
import {
  cronToHuman,
  init_cron,
  parseCronExpression
} from "./chunk-q4dg9ftz.js";
import {
  getOAuthHeaders,
  init_api,
  prepareApiRequest
} from "./chunk-qw03ehq0.js";
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
import {
  getOauthConfig,
  init_oauth
} from "./chunk-bk6ck5c2.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-326zehp8.js";
import"./chunk-40t1d75v.js";
import"./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
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
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
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
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/schedule/triggersApi.ts
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function buildHeaders() {
  let accessToken;
  let orgUUID;
  try {
    const prepared = await prepareApiRequest();
    accessToken = prepared.accessToken;
    orgUUID = prepared.orgUUID;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new TriggersApiError(`Not authenticated: ${msg}. Run /login to re-authenticate.`, 401);
  }
  assertSubscriptionBaseUrl(triggersBaseUrl());
  return {
    ...getOAuthHeaders(accessToken),
    "anthropic-beta": TRIGGERS_BETA_HEADER,
    "x-organization-uuid": orgUUID
  };
}
function triggersBaseUrl() {
  return `${getOauthConfig().BASE_API_URL}/v1/code/triggers`;
}
function classifyError(err) {
  if (axios_default.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    if (status === 401) {
      return new TriggersApiError("Authentication failed. Please run /login to re-authenticate.", 401);
    }
    if (status === 403) {
      return new TriggersApiError("Subscription required. Scheduled triggers require a Claude Pro/Max/Team subscription.", 403);
    }
    if (status === 404) {
      return new TriggersApiError("Trigger not found.", 404);
    }
    if (status === 429) {
      const retryAfter = err.response?.headers?.["retry-after"] ?? "";
      const detail = retryAfter ? ` Retry after ${retryAfter}s.` : "";
      return new TriggersApiError(`Rate limit exceeded.${detail}`, 429);
    }
    const msg = err.response?.data?.error?.message ?? err.message;
    return new TriggersApiError(msg, status);
  }
  if (err instanceof TriggersApiError)
    return err;
  return new TriggersApiError(err instanceof Error ? err.message : String(err), 0);
}
function parseRetryAfterMs(header) {
  if (!header)
    return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds >= 0)
    return seconds * 1000;
  const date = Date.parse(header);
  if (!Number.isNaN(date))
    return Math.max(0, date - Date.now());
  return null;
}
async function withRetry(fn) {
  let lastErr;
  for (let attempt = 0;attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const classified = classifyError(err);
      if (classified.statusCode >= 500) {
        lastErr = classified;
        if (attempt < MAX_RETRIES - 1) {
          const retryAfterHeader = axios_default.isAxiosError(err) ? err.response?.headers?.["retry-after"] : undefined;
          const waitMs = parseRetryAfterMs(retryAfterHeader) ?? 500 * 2 ** attempt;
          await sleep(waitMs);
        }
        continue;
      }
      throw classified;
    }
  }
  throw lastErr ?? new TriggersApiError("Request failed after retries", 0);
}
async function listTriggers() {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(triggersBaseUrl(), {
      headers
    });
    return response.data.data ?? [];
  });
}
async function getTrigger(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(`${triggersBaseUrl()}/${id}`, {
      headers
    });
    return response.data;
  });
}
async function createTrigger(body) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.post(triggersBaseUrl(), body, {
      headers
    });
    return response.data;
  });
}
async function updateTrigger(id, body) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.post(`${triggersBaseUrl()}/${id}`, body, { headers });
    return response.data;
  });
}
async function deleteTrigger(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    await axios_default.delete(`${triggersBaseUrl()}/${id}`, { headers });
  });
}
async function runTrigger(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.post(`${triggersBaseUrl()}/${id}/run`, {}, { headers });
    return response.data;
  });
}
var TRIGGERS_BETA_HEADER = "ccr-triggers-2026-01-30", MAX_RETRIES = 3, TriggersApiError;
var init_triggersApi = __esm(() => {
  init_axios();
  init_oauth();
  init_hostGuard();
  init_api();
  TriggersApiError = class TriggersApiError extends Error {
    statusCode;
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.name = "TriggersApiError";
    }
  };
});

// src/commands/schedule/ScheduleView.tsx
function TriggerRow({ trigger }) {
  const schedule = cronToHuman(trigger.cron_expression, { utc: true });
  const nextRun = trigger.next_run ? new Date(trigger.next_run).toLocaleString() : "\u2014";
  const enabledText = trigger.enabled ? "enabled" : "disabled";
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: trigger.trigger_id
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: " \xB7 "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            color: trigger.enabled ? "success" : "warning",
            children: enabledText
          }),
          trigger.agent_id ? /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: " \xB7 agent: "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: trigger.agent_id
              })
            ]
          }) : null
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "Schedule: ",
          schedule
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Prompt: ",
          trigger.prompt
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Next run: ",
          nextRun
        ]
      })
    ]
  });
}
function ScheduleView(props) {
  if (props.mode === "list") {
    if (props.triggers.length === 0) {
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "No scheduled triggers. Use /schedule create <cron> <prompt> to create one."
        })
      });
    }
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Scheduled Triggers (",
              props.triggers.length,
              ")"
            ]
          })
        }),
        props.triggers.map((trigger) => /* @__PURE__ */ jsx_runtime.jsx(TriggerRow, {
          trigger
        }, trigger.trigger_id))
      ]
    });
  }
  if (props.mode === "detail") {
    const { trigger } = props;
    const schedule = cronToHuman(trigger.cron_expression, { utc: true });
    const nextRun = trigger.next_run ? new Date(trigger.next_run).toLocaleString() : "\u2014";
    const lastRun = trigger.last_run ? new Date(trigger.last_run).toLocaleString() : "\u2014";
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Trigger: ",
              trigger.trigger_id
            ]
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Status:",
            " ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: trigger.enabled ? "success" : "warning",
              children: trigger.enabled ? "enabled" : "disabled"
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Schedule: ",
            schedule
          ]
        }),
        trigger.agent_id ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Agent: ",
            trigger.agent_id
          ]
        }) : null,
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Next run: ",
            nextRun
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Last run: ",
            lastRun
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Prompt: ",
            trigger.prompt
          ]
        }),
        trigger.created_at ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Created: ",
            new Date(trigger.created_at).toLocaleString()
          ]
        }) : null
      ]
    });
  }
  if (props.mode === "created") {
    const { trigger } = props;
    const schedule = cronToHuman(trigger.cron_expression, { utc: true });
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Trigger created"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            trigger.trigger_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Schedule: ",
            schedule
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Prompt: ",
            trigger.prompt
          ]
        }),
        trigger.agent_id ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Agent: ",
            trigger.agent_id
          ]
        }) : null,
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Status: ",
            trigger.enabled ? "enabled" : "disabled"
          ]
        })
      ]
    });
  }
  if (props.mode === "updated") {
    const { trigger } = props;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Trigger updated"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            trigger.trigger_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Status: ",
            trigger.enabled ? "enabled" : "disabled"
          ]
        })
      ]
    });
  }
  if (props.mode === "deleted") {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        color: "success",
        children: [
          "Trigger ",
          props.id,
          " deleted."
        ]
      })
    });
  }
  if (props.mode === "ran") {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            color: "success",
            children: [
              "Trigger ",
              props.id,
              " fired."
            ]
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Run ID: ",
            props.runId
          ]
        })
      ]
    });
  }
  if (props.mode === "enabled") {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        color: "success",
        children: [
          "Trigger ",
          props.id,
          " enabled."
        ]
      })
    });
  }
  if (props.mode === "disabled") {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        color: "warning",
        children: [
          "Trigger ",
          props.id,
          " disabled."
        ]
      })
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
    children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
      color: "error",
      children: props.message
    })
  });
}
var jsx_runtime;
var init_ScheduleView = __esm(() => {
  init_src();
  init_cron();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/schedule/parseArgs.ts
function splitCronAndPrompt(rest) {
  const tokens = rest.trim().split(/\s+/);
  if (tokens.length < 6)
    return null;
  const cron = tokens.slice(0, 5).join(" ");
  const prompt = tokens.slice(5).join(" ");
  return { cron, prompt };
}
function isValidCronExpression(cron) {
  const fields = cron.trim().split(/\s+/);
  return fields.length === 5;
}
function parseScheduleArgs(args) {
  const trimmed = args.trim();
  if (trimmed === "" || trimmed === "list") {
    return { action: "list" };
  }
  const spaceIdx = trimmed.indexOf(" ");
  const subCmd = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
  if (subCmd === "get") {
    if (!rest) {
      return { action: "invalid", reason: "get requires a trigger id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "get requires a trigger id" };
    }
    return { action: "get", id };
  }
  if (subCmd === "create") {
    if (!rest) {
      return {
        action: "invalid",
        reason: 'create requires a cron expression and prompt, e.g. create "0 9 * * 1" Run weekly standup'
      };
    }
    const parsed = splitCronAndPrompt(rest);
    if (!parsed) {
      return {
        action: "invalid",
        reason: 'create requires 5 cron fields followed by a prompt, e.g. create "0 9 * * 1" Run weekly standup'
      };
    }
    const { cron, prompt } = parsed;
    if (!isValidCronExpression(cron)) {
      return {
        action: "invalid",
        reason: `Invalid cron expression: "${cron}". Expected 5 fields (minute hour day month weekday).`
      };
    }
    if (!prompt.trim()) {
      return { action: "invalid", reason: "prompt cannot be empty" };
    }
    return { action: "create", cron, prompt: prompt.trim() };
  }
  if (subCmd === "update") {
    const parts = rest.split(/\s+/);
    if (parts.length < 3 || !parts[0]) {
      return {
        action: "invalid",
        reason: "update requires an id, field, and value, e.g. update trg_123 enabled false"
      };
    }
    const id = parts[0];
    const field = parts[1] ?? "";
    const value = parts.slice(2).join(" ");
    if (!field) {
      return { action: "invalid", reason: "update requires a field name" };
    }
    if (!value) {
      return { action: "invalid", reason: "update requires a value" };
    }
    return { action: "update", id, field, value };
  }
  if (subCmd === "delete") {
    if (!rest) {
      return { action: "invalid", reason: "delete requires a trigger id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "delete requires a trigger id" };
    }
    return { action: "delete", id };
  }
  if (subCmd === "run") {
    if (!rest) {
      return { action: "invalid", reason: "run requires a trigger id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "run requires a trigger id" };
    }
    return { action: "run", id };
  }
  if (subCmd === "enable" || subCmd === "disable") {
    if (!rest) {
      return {
        action: "invalid",
        reason: `${subCmd} requires a trigger id`
      };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return {
        action: "invalid",
        reason: `${subCmd} requires a trigger id`
      };
    }
    return { action: subCmd, id };
  }
  return {
    action: "invalid",
    reason: `Unknown sub-command "${subCmd}". ${USAGE}`
  };
}
var USAGE = "Usage: /schedule list | get ID | create CRON PROMPT | update ID FIELD VALUE | delete ID | run ID | enable ID | disable ID";
var init_parseArgs = () => {};

// src/commands/schedule/launchSchedule.tsx
var import_react, callSchedule = async (onDone, _context, args) => {
  logEvent("tengu_schedule_started", {
    args: args ?? ""
  });
  const parsed = parseScheduleArgs(args ?? "");
  if (parsed.action === "invalid") {
    logEvent("tengu_schedule_failed", {
      reason: parsed.reason
    });
    onDone(`Usage: /schedule list | get ID | create CRON PROMPT | update ID FIELD VALUE | delete ID | run ID | enable ID | disable ID
${parsed.reason}`, { display: "system" });
    return null;
  }
  if (parsed.action === "list") {
    logEvent("tengu_schedule_list", {});
    try {
      const triggers = await listTriggers();
      onDone(triggers.length === 0 ? "No scheduled triggers found." : `${triggers.length} scheduled trigger(s).`, {
        display: "system"
      });
      return import_react.default.createElement(ScheduleView, { mode: "list", triggers });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_schedule_failed", {
        reason: msg
      });
      onDone(`Failed to list triggers: ${msg}`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "get") {
    const { id: id2 } = parsed;
    logEvent("tengu_schedule_get", {
      id: id2
    });
    try {
      const trigger = await getTrigger(id2);
      onDone(`Trigger ${id2} fetched.`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "detail", trigger });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_schedule_failed", {
        reason: msg
      });
      onDone(`Failed to get trigger ${id2}: ${msg}`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "create") {
    const { cron, prompt } = parsed;
    const cronFields = parseCronExpression(cron);
    if (!cronFields) {
      const reason = `Invalid cron expression: "${cron}". Expected 5 fields (minute hour day month weekday).`;
      logEvent("tengu_schedule_failed", {
        reason
      });
      onDone(reason, { display: "system" });
      return null;
    }
    logEvent("tengu_schedule_create", {
      cron
    });
    try {
      const trigger = await createTrigger({ cron_expression: cron, prompt });
      onDone(`Trigger created: ${trigger.trigger_id}`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "created", trigger });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_schedule_failed", {
        reason: msg
      });
      onDone(`Failed to create trigger: ${msg}`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "update") {
    const { id: id2, field, value } = parsed;
    logEvent("tengu_schedule_update", {
      id: id2,
      field
    });
    let body = {};
    if (field === "enabled") {
      body = { enabled: value === "true" || value === "1" };
    } else if (field === "cron_expression" || field === "cron") {
      body = { cron_expression: value };
    } else if (field === "prompt") {
      body = { prompt: value };
    } else if (field === "agent_id") {
      body = { agent_id: value };
    } else {
      const reason = `Unknown field "${field}". Valid fields: enabled, cron_expression, prompt, agent_id`;
      logEvent("tengu_schedule_failed", {
        reason
      });
      onDone(reason, { display: "system" });
      return import_react.default.createElement(ScheduleView, {
        mode: "error",
        message: reason
      });
    }
    try {
      const trigger = await updateTrigger(id2, body);
      onDone(`Trigger ${id2} updated.`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "updated", trigger });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_schedule_failed", {
        reason: msg
      });
      onDone(`Failed to update trigger ${id2}: ${msg}`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "delete") {
    const { id: id2 } = parsed;
    logEvent("tengu_schedule_delete", {
      id: id2
    });
    try {
      await deleteTrigger(id2);
      onDone(`Trigger ${id2} deleted.`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "deleted", id: id2 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_schedule_failed", {
        reason: msg
      });
      onDone(`Failed to delete trigger ${id2}: ${msg}`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "run") {
    const { id: id2 } = parsed;
    logEvent("tengu_schedule_run", {
      id: id2
    });
    try {
      const result = await runTrigger(id2);
      onDone(`Trigger ${id2} fired. Run ID: ${result.run_id}`, {
        display: "system"
      });
      return import_react.default.createElement(ScheduleView, {
        mode: "ran",
        id: id2,
        runId: result.run_id
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_schedule_failed", {
        reason: msg
      });
      onDone(`Failed to run trigger ${id2}: ${msg}`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "enable") {
    const { id: id2 } = parsed;
    logEvent("tengu_schedule_enable", {
      id: id2
    });
    try {
      await updateTrigger(id2, { enabled: true });
      onDone(`Trigger ${id2} enabled.`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "enabled", id: id2 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_schedule_failed", {
        reason: msg
      });
      onDone(`Failed to enable trigger ${id2}: ${msg}`, { display: "system" });
      return import_react.default.createElement(ScheduleView, { mode: "error", message: msg });
    }
  }
  const { id } = parsed;
  logEvent("tengu_schedule_disable", {
    id
  });
  try {
    await updateTrigger(id, { enabled: false });
    onDone(`Trigger ${id} disabled.`, { display: "system" });
    return import_react.default.createElement(ScheduleView, { mode: "disabled", id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent("tengu_schedule_failed", {
      reason: msg
    });
    onDone(`Failed to disable trigger ${id}: ${msg}`, { display: "system" });
    return import_react.default.createElement(ScheduleView, { mode: "error", message: msg });
  }
};
var init_launchSchedule = __esm(() => {
  init_analytics();
  init_cron();
  init_triggersApi();
  init_ScheduleView();
  init_parseArgs();
  import_react = __toESM(require_react(), 1);
});
init_launchSchedule();

export {
  callSchedule
};

//# debugId=5FE75D44803A18F164756E2164756E21
//# sourceMappingURL=chunk-p4dk2gbk.js.map
