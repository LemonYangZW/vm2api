// @bun
import {
  assertWorkspaceHost,
  init_hostGuard
} from "./chunk-p3a84etr.js";
import {
  init_api,
  prepareWorkspaceApiRequest
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
import {
  getClaudeConfigHomeDir,
  init_envUtils
} from "./chunk-6k1rsk85.js";
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

// src/commands/skill-store/skillsApi.ts
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function buildHeaders() {
  let apiKey;
  try {
    const prepared = await prepareWorkspaceApiRequest();
    apiKey = prepared.apiKey;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new SkillsApiError(msg, 501);
  }
  assertWorkspaceHost(skillsBaseUrl());
  return {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  };
}
function skillsBaseUrl() {
  return `${getOauthConfig().BASE_API_URL}/v1/skills?beta=true`;
}
function skillUrl(id) {
  return `${getOauthConfig().BASE_API_URL}/v1/skills/${id}?beta=true`;
}
function skillVersionsUrl(id) {
  return `${getOauthConfig().BASE_API_URL}/v1/skills/${id}/versions?beta=true`;
}
function skillVersionUrl(id, version) {
  return `${getOauthConfig().BASE_API_URL}/v1/skills/${id}/versions/${version}?beta=true`;
}
function classifyError(err) {
  if (axios_default.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    if (status === 401) {
      return new SkillsApiError("Authentication failed. Please run /login to re-authenticate.", 401);
    }
    if (status === 403) {
      return new SkillsApiError("Subscription required. Skill store requires a Claude Pro/Max/Team subscription.", 403);
    }
    if (status === 404) {
      return new SkillsApiError("Skill or version not found.", 404);
    }
    if (status === 429) {
      const retryAfter = err.response?.headers?.["retry-after"] ?? "";
      const detail = retryAfter ? ` Retry after ${retryAfter}s.` : "";
      return new SkillsApiError(`Rate limit exceeded.${detail}`, 429);
    }
    const msg = err.response?.data?.error?.message ?? err.message;
    return new SkillsApiError(msg, status);
  }
  if (err instanceof SkillsApiError)
    return err;
  return new SkillsApiError(err instanceof Error ? err.message : String(err), 0);
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
  throw lastErr ?? new SkillsApiError("Request failed after retries", 0);
}
async function listSkills() {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(skillsBaseUrl(), {
      headers
    });
    return response.data.data ?? [];
  });
}
async function getSkill(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(skillUrl(id), { headers });
    return response.data;
  });
}
async function getSkillVersions(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(skillVersionsUrl(id), { headers });
    return response.data.data ?? [];
  });
}
async function getSkillVersion(id, version) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(skillVersionUrl(id, version), { headers });
    return response.data;
  });
}
async function createSkill(name, body) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const requestBody = { name, body };
    const response = await axios_default.post(skillsBaseUrl(), requestBody, {
      headers
    });
    return response.data;
  });
}
async function deleteSkill(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    await axios_default.delete(skillUrl(id), { headers });
  });
}
var MAX_RETRIES = 3, SkillsApiError;
var init_skillsApi = __esm(() => {
  init_axios();
  init_oauth();
  init_hostGuard();
  init_api();
  SkillsApiError = class SkillsApiError extends Error {
    statusCode;
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.name = "SkillsApiError";
    }
  };
});

// src/commands/skill-store/SkillStoreView.tsx
function SkillRow({ skill }) {
  const createdAt = skill.created_at ? new Date(skill.created_at).toLocaleString() : "\u2014";
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: skill.skill_id
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: " \xB7 "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: skill.name
          }),
          skill.deprecated ? /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: " \xB7 "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                color: "warning",
                children: "deprecated"
              })
            ]
          }) : null
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Owner: ",
          skill.owner,
          skill.owner_symbol ? ` (${skill.owner_symbol})` : ""
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Created: ",
          createdAt
        ]
      })
    ]
  });
}
function SkillStoreView(props) {
  if (props.mode === "list") {
    if (props.skills.length === 0) {
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "No skills found. Use /skill-store create <name> <markdown> to publish one."
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
              "Skills (",
              props.skills.length,
              ")"
            ]
          })
        }),
        props.skills.map((skill) => /* @__PURE__ */ jsx_runtime.jsx(SkillRow, {
          skill
        }, skill.skill_id))
      ]
    });
  }
  if (props.mode === "detail") {
    const { skill } = props;
    const createdAt = skill.created_at ? new Date(skill.created_at).toLocaleString() : "\u2014";
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Skill: ",
              skill.skill_id
            ]
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Name: ",
            skill.name
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Owner: ",
            skill.owner,
            skill.owner_symbol ? ` (${skill.owner_symbol})` : ""
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Status:",
            " ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: skill.deprecated ? "warning" : "success",
              children: skill.deprecated ? "deprecated" : "active"
            })
          ]
        }),
        skill.allowed_tools && skill.allowed_tools.length > 0 ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Allowed tools: ",
            skill.allowed_tools.join(", ")
          ]
        }) : null,
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Created: ",
            createdAt
          ]
        })
      ]
    });
  }
  if (props.mode === "versions") {
    const { id, versions } = props;
    if (versions.length === 0) {
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "No versions found for skill ",
            id,
            "."
          ]
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
              "Versions for ",
              id,
              " (",
              versions.length,
              ")"
            ]
          })
        }),
        versions.map((ver) => {
          const createdAt = ver.created_at ? new Date(ver.created_at).toLocaleString() : "\u2014";
          return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                bold: true,
                children: ver.version
              }),
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  "Created: ",
                  createdAt
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: ver.body.length > 80 ? `${ver.body.slice(0, 80)}\u2026` : ver.body
              })
            ]
          }, ver.version);
        })
      ]
    });
  }
  if (props.mode === "version-detail") {
    const { version } = props;
    const createdAt = version.created_at ? new Date(version.created_at).toLocaleString() : "\u2014";
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Version: ",
              version.version,
              " (skill: ",
              version.skill_id,
              ")"
            ]
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Created: ",
            createdAt
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: version.body
          })
        })
      ]
    });
  }
  if (props.mode === "created") {
    const { skill } = props;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Skill created"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            skill.skill_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Name: ",
            skill.name
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
          "Skill ",
          props.id,
          " deleted."
        ]
      })
    });
  }
  if (props.mode === "installed") {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Skill installed"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Name: ",
            props.skillName
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Path: ",
            props.path
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Load with: /skills (bundled skills are not auto-loaded; place in ",
            props.path,
            ")"
          ]
        })
      ]
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
var init_SkillStoreView = __esm(() => {
  init_src();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/skill-store/parseArgs.ts
function parseSkillStoreArgs(args) {
  const trimmed = args.trim();
  if (trimmed === "" || trimmed === "list") {
    return { action: "list" };
  }
  const spaceIdx = trimmed.indexOf(" ");
  const subCmd = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
  if (subCmd === "get") {
    if (!rest) {
      return { action: "invalid", reason: "get requires a skill id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "get requires a skill id" };
    }
    return { action: "get", id };
  }
  if (subCmd === "versions") {
    if (!rest) {
      return { action: "invalid", reason: "versions requires a skill id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "versions requires a skill id" };
    }
    return { action: "versions", id };
  }
  if (subCmd === "version") {
    const parts = rest.split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return {
        action: "invalid",
        reason: "version requires a skill id and version, e.g. version sk_123 v1"
      };
    }
    return { action: "version", id: parts[0], version: parts[1] };
  }
  if (subCmd === "create") {
    const spaceInRest = rest.indexOf(" ");
    if (!rest || spaceInRest === -1) {
      return {
        action: "invalid",
        reason: 'create requires a skill name and markdown body, e.g. create my-skill "# My Skill\\nContent"'
      };
    }
    const name = rest.slice(0, spaceInRest).trim();
    const markdown = rest.slice(spaceInRest + 1).trim();
    if (!name) {
      return {
        action: "invalid",
        reason: "create requires a non-empty skill name"
      };
    }
    if (!markdown) {
      return {
        action: "invalid",
        reason: "create requires a non-empty markdown body"
      };
    }
    return { action: "create", name, markdown };
  }
  if (subCmd === "delete") {
    if (!rest) {
      return { action: "invalid", reason: "delete requires a skill id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "delete requires a skill id" };
    }
    return { action: "delete", id };
  }
  if (subCmd === "install") {
    if (!rest) {
      return {
        action: "invalid",
        reason: "install requires a skill id (optionally with @version), e.g. install sk_123 or install sk_123@v2"
      };
    }
    const token = rest.split(/\s+/)[0];
    if (!token) {
      return { action: "invalid", reason: "install requires a skill id" };
    }
    const atIdx = token.indexOf("@");
    if (atIdx === -1) {
      return { action: "install", id: token, version: undefined };
    }
    const id = token.slice(0, atIdx);
    const version = token.slice(atIdx + 1);
    if (!id) {
      return {
        action: "invalid",
        reason: "install requires a non-empty skill id before @"
      };
    }
    if (!version) {
      return {
        action: "invalid",
        reason: "install requires a non-empty version after @"
      };
    }
    return { action: "install", id, version };
  }
  return {
    action: "invalid",
    reason: `Unknown sub-command "${subCmd}". ${USAGE}`
  };
}
var USAGE = "Usage: /skill-store list | get ID | versions ID | version ID VER | create NAME MARKDOWN | delete ID | install ID[@VERSION]";
var init_parseArgs = () => {};

// src/commands/skill-store/launchSkillStore.tsx
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
var import_react, USAGE2 = "Usage: /skill-store list | get ID | versions ID | version ID VER | create NAME MARKDOWN | delete ID | install ID[@VERSION]", callSkillStore = async (onDone, _context, args) => {
  logEvent("tengu_skill_store_started", {
    args: args ?? ""
  });
  const parsed = parseSkillStoreArgs(args ?? "");
  if (parsed.action === "invalid") {
    logEvent("tengu_skill_store_failed", {
      reason: parsed.reason
    });
    onDone(`${USAGE2}
${parsed.reason}`, { display: "system" });
    return null;
  }
  if (parsed.action === "list") {
    logEvent("tengu_skill_store_list", {});
    try {
      const skills = await listSkills();
      onDone(skills.length === 0 ? "No skills found in the marketplace." : `${skills.length} skill(s) available.`, {
        display: "system"
      });
      return import_react.default.createElement(SkillStoreView, { mode: "list", skills });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_skill_store_failed", {
        reason: msg
      });
      onDone(`Failed to list skills: ${msg}`, { display: "system" });
      return import_react.default.createElement(SkillStoreView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "get") {
    const { id: id2 } = parsed;
    logEvent("tengu_skill_store_get", {
      id: id2
    });
    try {
      const skill = await getSkill(id2);
      onDone(`Skill ${id2} fetched.`, { display: "system" });
      return import_react.default.createElement(SkillStoreView, { mode: "detail", skill });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_skill_store_failed", {
        reason: msg
      });
      onDone(`Failed to get skill ${id2}: ${msg}`, { display: "system" });
      return import_react.default.createElement(SkillStoreView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "versions") {
    const { id: id2 } = parsed;
    logEvent("tengu_skill_store_versions", {
      id: id2
    });
    try {
      const versions = await getSkillVersions(id2);
      onDone(versions.length === 0 ? `No versions found for skill ${id2}.` : `${versions.length} version(s) for skill ${id2}.`, { display: "system" });
      return import_react.default.createElement(SkillStoreView, {
        mode: "versions",
        id: id2,
        versions
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_skill_store_failed", {
        reason: msg
      });
      onDone(`Failed to list versions for skill ${id2}: ${msg}`, {
        display: "system"
      });
      return import_react.default.createElement(SkillStoreView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "version") {
    const { id: id2, version: version2 } = parsed;
    logEvent("tengu_skill_store_version", {
      id: id2
    });
    try {
      const ver = await getSkillVersion(id2, version2);
      onDone(`Skill ${id2}@${version2} fetched.`, { display: "system" });
      return import_react.default.createElement(SkillStoreView, {
        mode: "version-detail",
        version: ver
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_skill_store_failed", {
        reason: msg
      });
      onDone(`Failed to get version ${version2} for skill ${id2}: ${msg}`, {
        display: "system"
      });
      return import_react.default.createElement(SkillStoreView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "create") {
    const { name, markdown } = parsed;
    logEvent("tengu_skill_store_create", {
      name
    });
    try {
      const skill = await createSkill(name, markdown);
      onDone(`Skill created: ${skill.skill_id}`, { display: "system" });
      return import_react.default.createElement(SkillStoreView, { mode: "created", skill });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_skill_store_failed", {
        reason: msg
      });
      onDone(`Failed to create skill: ${msg}`, { display: "system" });
      return import_react.default.createElement(SkillStoreView, { mode: "error", message: msg });
    }
  }
  if (parsed.action === "delete") {
    const { id: id2 } = parsed;
    logEvent("tengu_skill_store_delete", {
      id: id2
    });
    try {
      await deleteSkill(id2);
      onDone(`Skill ${id2} deleted.`, { display: "system" });
      return import_react.default.createElement(SkillStoreView, { mode: "deleted", id: id2 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_skill_store_failed", {
        reason: msg
      });
      onDone(`Failed to delete skill ${id2}: ${msg}`, { display: "system" });
      return import_react.default.createElement(SkillStoreView, { mode: "error", message: msg });
    }
  }
  const { id, version } = parsed;
  logEvent("tengu_skill_store_install", {
    id
  });
  try {
    let skillName;
    let body;
    if (version !== undefined) {
      const ver = await getSkillVersion(id, version);
      body = ver.body;
      skillName = ver.skill_id;
    } else {
      const skill = await getSkill(id);
      const versions = await getSkillVersions(id);
      if (versions.length === 0) {
        onDone(`Skill ${id} has no published versions to install.`, {
          display: "system"
        });
        return import_react.default.createElement(SkillStoreView, {
          mode: "error",
          message: `Skill ${id} has no published versions to install.`
        });
      }
      const sorted = [...versions].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      const latest = sorted[0];
      if (!latest) {
        onDone(`Skill ${id} has no published versions to install.`, {
          display: "system"
        });
        return import_react.default.createElement(SkillStoreView, {
          mode: "error",
          message: `Skill ${id} has no published versions to install.`
        });
      }
      body = latest.body;
      skillName = skill.name;
    }
    const safeName = skillName.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || id;
    const skillDir = join(getClaudeConfigHomeDir(), "skills", safeName);
    const skillPath = join(skillDir, "SKILL.md");
    await mkdir(skillDir, { recursive: true });
    await writeFile(skillPath, body, "utf-8");
    onDone(`Skill installed to ${skillPath}`, { display: "system" });
    return import_react.default.createElement(SkillStoreView, {
      mode: "installed",
      skillName: safeName,
      path: skillPath
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent("tengu_skill_store_failed", {
      reason: msg
    });
    onDone(`Failed to install skill ${id}: ${msg}`, { display: "system" });
    return import_react.default.createElement(SkillStoreView, { mode: "error", message: msg });
  }
};
var init_launchSkillStore = __esm(() => {
  init_analytics();
  init_envUtils();
  init_skillsApi();
  init_SkillStoreView();
  init_parseArgs();
  import_react = __toESM(require_react(), 1);
});
init_launchSkillStore();

export {
  callSkillStore
};

//# debugId=AF7BB77FD89869D364756E2164756E21
//# sourceMappingURL=chunk-z0fqsw9y.js.map
