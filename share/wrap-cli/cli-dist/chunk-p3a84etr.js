// @bun
import {
  init_log
} from "./chunk-mhjmeh6r.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/auth/hostGuard.ts
function assertWorkspaceHost(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error(`assertWorkspaceHost: invalid URL "${url}". Workspace API key requests must target ${WORKSPACE_API_HOST}.`);
  }
  if (hostname !== WORKSPACE_API_HOST) {
    throw new Error(`assertWorkspaceHost: refusing to send workspace API key to non-Anthropic host "${hostname}". ` + `Workspace API key requests must target ${WORKSPACE_API_HOST}. ` + `If you are using a custom base URL, workspace endpoints are only available on the Anthropic API.`);
  }
}
function assertSubscriptionBaseUrl(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error(`assertSubscriptionBaseUrl: invalid URL "${url}". Subscription OAuth requests must target ${WORKSPACE_API_HOST}.`);
  }
  if (hostname !== WORKSPACE_API_HOST) {
    throw new Error(`assertSubscriptionBaseUrl: refusing subscription OAuth request to non-Anthropic host "${hostname}". ` + `Subscription OAuth requests must target ${WORKSPACE_API_HOST}.`);
  }
}
var WORKSPACE_API_HOST = "api.anthropic.com";
var init_hostGuard = __esm(() => {
  init_log();
});

export { assertWorkspaceHost, assertSubscriptionBaseUrl, init_hostGuard };

//# debugId=54EF5548D68814E964756E2164756E21
//# sourceMappingURL=chunk-p3a84etr.js.map
