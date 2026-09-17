// @bun
import {
  extractErrorDetail,
  init_debugUtils,
  init_sessionIdCompat,
  toCompatSessionId
} from "./chunk-8wzca1dh.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import {
  __esm,
  __require
} from "./chunk-hhsxm2yr.js";

// src/bridge/createSession.ts
async function createBridgeSession({
  environmentId,
  title,
  events,
  gitRepoUrl,
  branch,
  signal,
  baseUrl: baseUrlOverride,
  getAccessToken,
  permissionMode
}) {
  const { getClaudeAIOAuthTokens } = await import("./chunk-kjhzpxhq.js");
  const { getOrganizationUUID } = await import("./chunk-2wznzqry.js");
  const { getOauthConfig } = await import("./chunk-hgjqr0x2.js");
  const { getOAuthHeaders } = await import("./chunk-35m5jkrg.js");
  const { parseGitHubRepository } = await import("./chunk-g0gc770r.js");
  const { getDefaultBranch } = await import("./chunk-1cjn800a.js");
  const { getMainLoopModel } = await import("./chunk-rsg1ben6.js");
  const { default: axios } = await import("./chunk-v3x8tcc0.js");
  const { isSelfHostedBridge } = await import("./chunk-szxe0t88.js");
  const accessToken = getAccessToken?.() ?? getClaudeAIOAuthTokens()?.accessToken;
  if (!accessToken) {
    logForDebugging("[bridge] No access token for session creation");
    return null;
  }
  const orgUUID = isSelfHostedBridge() ? "self-hosted" : await getOrganizationUUID();
  if (!orgUUID) {
    logForDebugging("[bridge] No org UUID for session creation");
    return null;
  }
  let gitSource = null;
  let gitOutcome = null;
  if (gitRepoUrl) {
    const { parseGitRemote } = await import("./chunk-g0gc770r.js");
    const parsed = parseGitRemote(gitRepoUrl);
    if (parsed) {
      const { host, owner, name } = parsed;
      const revision = branch || await getDefaultBranch() || undefined;
      gitSource = {
        type: "git_repository",
        url: `https://${host}/${owner}/${name}`,
        revision
      };
      gitOutcome = {
        type: "git_repository",
        git_info: {
          type: "github",
          repo: `${owner}/${name}`,
          branches: [`claude/${branch || "task"}`]
        }
      };
    } else {
      const ownerRepo = parseGitHubRepository(gitRepoUrl);
      if (ownerRepo) {
        const [owner, name] = ownerRepo.split("/");
        if (owner && name) {
          const revision = branch || await getDefaultBranch() || undefined;
          gitSource = {
            type: "git_repository",
            url: `https://github.com/${owner}/${name}`,
            revision
          };
          gitOutcome = {
            type: "git_repository",
            git_info: {
              type: "github",
              repo: `${owner}/${name}`,
              branches: [`claude/${branch || "task"}`]
            }
          };
        }
      }
    }
  }
  const requestBody = {
    ...title !== undefined && { title },
    events,
    session_context: {
      sources: gitSource ? [gitSource] : [],
      outcomes: gitOutcome ? [gitOutcome] : [],
      model: getMainLoopModel()
    },
    environment_id: environmentId,
    source: "remote-control",
    ...permissionMode && { permission_mode: permissionMode }
  };
  const headers = {
    ...getOAuthHeaders(accessToken),
    "anthropic-beta": "ccr-byoc-2025-07-29",
    "x-organization-uuid": orgUUID
  };
  const url = `${baseUrlOverride ?? getOauthConfig().BASE_API_URL}/v1/sessions`;
  let response;
  try {
    response = await axios.post(url, requestBody, {
      headers,
      signal,
      validateStatus: (s) => s < 500
    });
  } catch (err) {
    logForDebugging(`[bridge] Session creation request failed: ${errorMessage(err)}`);
    return null;
  }
  const isSuccess = response.status === 200 || response.status === 201;
  if (!isSuccess) {
    const detail = extractErrorDetail(response.data);
    logForDebugging(`[bridge] Session creation failed with status ${response.status}${detail ? `: ${detail}` : ""}`);
    return null;
  }
  const sessionData = response.data;
  if (!sessionData || typeof sessionData !== "object" || !("id" in sessionData) || typeof sessionData.id !== "string") {
    logForDebugging("[bridge] No session ID in response");
    return null;
  }
  return sessionData.id;
}
async function getBridgeSession(sessionId, opts) {
  const { getClaudeAIOAuthTokens } = await import("./chunk-kjhzpxhq.js");
  const { getOrganizationUUID } = await import("./chunk-2wznzqry.js");
  const { getOauthConfig } = await import("./chunk-hgjqr0x2.js");
  const { getOAuthHeaders } = await import("./chunk-35m5jkrg.js");
  const { default: axios } = await import("./chunk-v3x8tcc0.js");
  const { isSelfHostedBridge } = await import("./chunk-szxe0t88.js");
  const accessToken = opts?.getAccessToken?.() ?? getClaudeAIOAuthTokens()?.accessToken;
  if (!accessToken) {
    logForDebugging("[bridge] No access token for session fetch");
    return null;
  }
  const orgUUID = isSelfHostedBridge() ? "self-hosted" : await getOrganizationUUID();
  if (!orgUUID) {
    logForDebugging("[bridge] No org UUID for session fetch");
    return null;
  }
  const headers = {
    ...getOAuthHeaders(accessToken),
    "anthropic-beta": "ccr-byoc-2025-07-29",
    "x-organization-uuid": orgUUID
  };
  const url = `${opts?.baseUrl ?? getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}`;
  logForDebugging(`[bridge] Fetching session ${sessionId}`);
  let response;
  try {
    response = await axios.get(url, { headers, timeout: 1e4, validateStatus: (s) => s < 500 });
  } catch (err) {
    logForDebugging(`[bridge] Session fetch request failed: ${errorMessage(err)}`);
    return null;
  }
  if (response.status !== 200) {
    const detail = extractErrorDetail(response.data);
    logForDebugging(`[bridge] Session fetch failed with status ${response.status}${detail ? `: ${detail}` : ""}`);
    return null;
  }
  return response.data;
}
async function archiveBridgeSession(sessionId, opts) {
  const { getClaudeAIOAuthTokens } = await import("./chunk-kjhzpxhq.js");
  const { getOrganizationUUID } = await import("./chunk-2wznzqry.js");
  const { getOauthConfig } = await import("./chunk-hgjqr0x2.js");
  const { getOAuthHeaders } = await import("./chunk-35m5jkrg.js");
  const { default: axios } = await import("./chunk-v3x8tcc0.js");
  const { isSelfHostedBridge } = await import("./chunk-szxe0t88.js");
  const accessToken = opts?.getAccessToken?.() ?? getClaudeAIOAuthTokens()?.accessToken;
  if (!accessToken) {
    logForDebugging("[bridge] No access token for session archive");
    return;
  }
  const orgUUID = isSelfHostedBridge() ? "self-hosted" : await getOrganizationUUID();
  if (!orgUUID) {
    logForDebugging("[bridge] No org UUID for session archive");
    return;
  }
  const headers = {
    ...getOAuthHeaders(accessToken),
    "anthropic-beta": "ccr-byoc-2025-07-29",
    "x-organization-uuid": orgUUID
  };
  const url = `${opts?.baseUrl ?? getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}/archive`;
  logForDebugging(`[bridge] Archiving session ${sessionId}`);
  const response = await axios.post(url, {}, {
    headers,
    timeout: opts?.timeoutMs ?? 1e4,
    validateStatus: (s) => s < 500
  });
  if (response.status === 200) {
    logForDebugging(`[bridge] Session ${sessionId} archived successfully`);
  } else {
    const detail = extractErrorDetail(response.data);
    logForDebugging(`[bridge] Session archive failed with status ${response.status}${detail ? `: ${detail}` : ""}`);
  }
}
async function updateBridgeSessionTitle(sessionId, title, opts) {
  const { getClaudeAIOAuthTokens } = await import("./chunk-kjhzpxhq.js");
  const { getOrganizationUUID } = await import("./chunk-2wznzqry.js");
  const { getOauthConfig } = await import("./chunk-hgjqr0x2.js");
  const { getOAuthHeaders } = await import("./chunk-35m5jkrg.js");
  const { default: axios } = await import("./chunk-v3x8tcc0.js");
  const { isSelfHostedBridge } = await import("./chunk-szxe0t88.js");
  const accessToken = opts?.getAccessToken?.() ?? getClaudeAIOAuthTokens()?.accessToken;
  if (!accessToken) {
    logForDebugging("[bridge] No access token for session title update");
    return;
  }
  const orgUUID = isSelfHostedBridge() ? "self-hosted" : await getOrganizationUUID();
  if (!orgUUID) {
    logForDebugging("[bridge] No org UUID for session title update");
    return;
  }
  const headers = {
    ...getOAuthHeaders(accessToken),
    "anthropic-beta": "ccr-byoc-2025-07-29",
    "x-organization-uuid": orgUUID
  };
  const compatId = toCompatSessionId(sessionId);
  const url = `${opts?.baseUrl ?? getOauthConfig().BASE_API_URL}/v1/sessions/${compatId}`;
  logForDebugging(`[bridge] Updating session title: ${compatId} \u2192 ${title}`);
  try {
    const response = await axios.patch(url, { title }, { headers, timeout: 1e4, validateStatus: (s) => s < 500 });
    if (response.status === 200) {
      logForDebugging(`[bridge] Session title updated successfully`);
    } else {
      const detail = extractErrorDetail(response.data);
      logForDebugging(`[bridge] Session title update failed with status ${response.status}${detail ? `: ${detail}` : ""}`);
    }
  } catch (err) {
    logForDebugging(`[bridge] Session title update request failed: ${errorMessage(err)}`);
  }
}
var init_createSession = __esm(() => {
  init_debug();
  init_errors();
  init_debugUtils();
  init_sessionIdCompat();
});

export { createBridgeSession, getBridgeSession, archiveBridgeSession, updateBridgeSessionTitle, init_createSession };

//# debugId=0FF4EB297069BFDD64756E2164756E21
//# sourceMappingURL=chunk-jd4df0hk.js.map
