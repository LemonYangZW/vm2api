// @bun
import {
  getClaudeAIOAuthTokens,
  getGlobalConfig,
  getOrganizationUUID,
  init_auth,
  init_client,
  init_config1 as init_config
} from "./chunk-necthexa.js";
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import {
  init_sleep,
  sleep
} from "./chunk-jmv7k0jn.js";
import {
  getOauthConfig,
  init_oauth
} from "./chunk-bk6ck5c2.js";
import {
  init_v4,
  v4_default
} from "./chunk-6mdh70q0.js";
import {
  init_detectRepository,
  parseGitHubRepository
} from "./chunk-wdyw5x2b.js";
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  init_slowOperations,
  jsonStringify,
  logForDebugging,
  toError
} from "./chunk-82pkdrt0.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/teleport/api.ts
import { randomUUID } from "crypto";
function isTransientNetworkError(error) {
  if (!axios_default.isAxiosError(error)) {
    return false;
  }
  if (!error.response) {
    return true;
  }
  if (error.response.status >= 500) {
    return true;
  }
  return false;
}
async function axiosGetWithRetry(url, config) {
  let lastError;
  for (let attempt = 0;attempt <= MAX_TELEPORT_RETRIES; attempt++) {
    try {
      return await axios_default.get(url, config);
    } catch (error) {
      lastError = error;
      if (!isTransientNetworkError(error)) {
        throw error;
      }
      if (attempt >= MAX_TELEPORT_RETRIES) {
        logForDebugging(`Teleport request failed after ${attempt + 1} attempts: ${errorMessage(error)}`);
        throw error;
      }
      const delay = TELEPORT_RETRY_DELAYS[attempt] ?? 2000;
      logForDebugging(`Teleport request failed (attempt ${attempt + 1}/${MAX_TELEPORT_RETRIES + 1}), retrying in ${delay}ms: ${errorMessage(error)}`);
      await sleep(delay);
    }
  }
  throw lastError;
}
function isWorkspaceKeyCleared(rawValue) {
  return rawValue === null || typeof rawValue === "string" && rawValue.trim() === "";
}
async function prepareWorkspaceApiRequest() {
  const config = getGlobalConfig();
  const apiKey = process.env["ANTHROPIC_API_KEY"]?.trim() || config.workspaceApiKey?.trim();
  if (!apiKey) {
    const rawValue = config.workspaceApiKey;
    const wasCleared = isWorkspaceKeyCleared(rawValue);
    const preface = wasCleared ? "Your workspace API key was cleared. " : "A workspace API key (sk-ant-api03-*) is required to use workspace endpoints " + "(/v1/agents, /v1/vaults, /v1/memory_stores, /v1/skills). ";
    throw new Error(preface + "Press W in /login to save your key directly (no restart needed), or " + "set ANTHROPIC_API_KEY=<key> and restart. " + "Obtain a key from https://console.anthropic.com/settings/keys. " + "Subscription OAuth (claude.ai login) cannot reach these endpoints.");
  }
  if (!apiKey.startsWith("sk-ant-api03-")) {
    throw new Error(`Workspace API key must start with sk-ant-api03-, got prefix "${apiKey.slice(0, 4)}...". ` + "Obtain a workspace API key from https://console.anthropic.com/settings/keys. " + "Press W in /login to save your key, or set ANTHROPIC_API_KEY.");
  }
  return { apiKey };
}
async function prepareApiRequest() {
  const accessToken = getClaudeAIOAuthTokens()?.accessToken;
  if (accessToken === undefined) {
    throw new Error("Claude Code web sessions require authentication with a Claude.ai account. API key authentication is not sufficient. Please run /login to authenticate, or check your authentication status with /status.");
  }
  const orgUUID = await getOrganizationUUID();
  if (!orgUUID) {
    throw new Error("Unable to get organization UUID");
  }
  return { accessToken, orgUUID };
}
async function fetchCodeSessionsFromSessionsAPI() {
  const { accessToken, orgUUID } = await prepareApiRequest();
  const url = `${getOauthConfig().BASE_API_URL}/v1/sessions`;
  try {
    const headers = {
      ...getOAuthHeaders(accessToken),
      "anthropic-beta": "ccr-byoc-2025-07-29",
      "x-organization-uuid": orgUUID
    };
    const response = await axiosGetWithRetry(url, {
      headers
    });
    if (response.status !== 200) {
      throw new Error(`Failed to fetch code sessions: ${response.statusText}`);
    }
    const sessions = response.data.data.map((session) => {
      const gitSource = session.session_context.sources.find((source) => source.type === "git_repository");
      let repo = null;
      if (gitSource?.url) {
        const repoPath = parseGitHubRepository(gitSource.url);
        if (repoPath) {
          const [owner, name] = repoPath.split("/");
          if (owner && name) {
            repo = {
              name,
              owner: {
                login: owner
              },
              default_branch: gitSource.revision || undefined
            };
          }
        }
      }
      return {
        id: session.id,
        title: session.title || "Untitled",
        description: "",
        status: session.session_status,
        repo,
        turns: [],
        created_at: session.created_at,
        updated_at: session.updated_at
      };
    });
    return sessions;
  } catch (error) {
    const err = toError(error);
    logError(err);
    throw error;
  }
}
function getOAuthHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01"
  };
}
async function fetchSession(sessionId) {
  const { accessToken, orgUUID } = await prepareApiRequest();
  const url = `${getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}`;
  const headers = {
    ...getOAuthHeaders(accessToken),
    "anthropic-beta": "ccr-byoc-2025-07-29",
    "x-organization-uuid": orgUUID
  };
  const response = await axios_default.get(url, {
    headers,
    timeout: 15000,
    validateStatus: (status) => status < 500
  });
  if (response.status !== 200) {
    const errorData = response.data;
    const apiMessage = errorData?.error?.message;
    if (response.status === 404) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    if (response.status === 401) {
      throw new Error("Session expired. Please run /login to sign in again.");
    }
    throw new Error(apiMessage || `Failed to fetch session: ${response.status} ${response.statusText}`);
  }
  return response.data;
}
function getBranchFromSession(session) {
  const gitOutcome = session.session_context.outcomes?.find((outcome) => outcome.type === "git_repository");
  return gitOutcome?.git_info?.branches[0];
}
async function sendEventToRemoteSession(sessionId, messageContent, opts) {
  try {
    const { accessToken, orgUUID } = await prepareApiRequest();
    const url = `${getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}/events`;
    const headers = {
      ...getOAuthHeaders(accessToken),
      "anthropic-beta": "ccr-byoc-2025-07-29",
      "x-organization-uuid": orgUUID
    };
    const userEvent = {
      uuid: opts?.uuid ?? randomUUID(),
      session_id: sessionId,
      type: "user",
      parent_tool_use_id: null,
      message: {
        role: "user",
        content: messageContent
      }
    };
    const requestBody = {
      events: [userEvent]
    };
    logForDebugging(`[sendEventToRemoteSession] Sending event to session ${sessionId}`);
    const response = await axios_default.post(url, requestBody, {
      headers,
      validateStatus: (status) => status < 500,
      timeout: 30000
    });
    if (response.status === 200 || response.status === 201) {
      logForDebugging(`[sendEventToRemoteSession] Successfully sent event to session ${sessionId}`);
      return true;
    }
    logForDebugging(`[sendEventToRemoteSession] Failed with status ${response.status}: ${jsonStringify(response.data)}`);
    return false;
  } catch (error) {
    logForDebugging(`[sendEventToRemoteSession] Error: ${errorMessage(error)}`);
    return false;
  }
}
async function updateSessionTitle(sessionId, title) {
  try {
    const { accessToken, orgUUID } = await prepareApiRequest();
    const url = `${getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}`;
    const headers = {
      ...getOAuthHeaders(accessToken),
      "anthropic-beta": "ccr-byoc-2025-07-29",
      "x-organization-uuid": orgUUID
    };
    logForDebugging(`[updateSessionTitle] Updating title for session ${sessionId}: "${title}"`);
    const response = await axios_default.patch(url, { title }, {
      headers,
      validateStatus: (status) => status < 500
    });
    if (response.status === 200) {
      logForDebugging(`[updateSessionTitle] Successfully updated title for session ${sessionId}`);
      return true;
    }
    logForDebugging(`[updateSessionTitle] Failed with status ${response.status}: ${jsonStringify(response.data)}`);
    return false;
  } catch (error) {
    logForDebugging(`[updateSessionTitle] Error: ${errorMessage(error)}`);
    return false;
  }
}
var TELEPORT_RETRY_DELAYS, MAX_TELEPORT_RETRIES, CCR_BYOC_BETA = "ccr-byoc-2025-07-29", CodeSessionSchema;
var init_api = __esm(() => {
  init_axios();
  init_oauth();
  init_client();
  init_v4();
  init_auth();
  init_config();
  init_debug();
  init_detectRepository();
  init_errors();
  init_lazySchema();
  init_log();
  init_sleep();
  init_slowOperations();
  TELEPORT_RETRY_DELAYS = [2000, 4000, 8000, 16000];
  MAX_TELEPORT_RETRIES = TELEPORT_RETRY_DELAYS.length;
  CodeSessionSchema = lazySchema(() => v4_default.object({
    id: v4_default.string(),
    title: v4_default.string(),
    description: v4_default.string(),
    status: v4_default.enum([
      "idle",
      "working",
      "waiting",
      "completed",
      "archived",
      "cancelled",
      "rejected"
    ]),
    repo: v4_default.object({
      name: v4_default.string(),
      owner: v4_default.object({
        login: v4_default.string()
      }),
      default_branch: v4_default.string().optional()
    }).nullable(),
    turns: v4_default.array(v4_default.string()),
    created_at: v4_default.string(),
    updated_at: v4_default.string()
  }));
});

export { CCR_BYOC_BETA, isTransientNetworkError, axiosGetWithRetry, CodeSessionSchema, isWorkspaceKeyCleared, prepareWorkspaceApiRequest, prepareApiRequest, fetchCodeSessionsFromSessionsAPI, getOAuthHeaders, fetchSession, getBranchFromSession, sendEventToRemoteSession, updateSessionTitle, init_api };

//# debugId=9D105494FEED745B64756E2164756E21
//# sourceMappingURL=chunk-ynb9erf2.js.map
