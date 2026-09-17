// @bun
import {
  getClaudeAIOAuthTokens,
  init_auth
} from "./chunk-ghhmj79c.js";
import {
  getOauthConfig,
  init_oauth
} from "./chunk-bk6ck5c2.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/bridge/bridgeConfig.ts
function getBridgeTokenOverride() {
  return process.env.CLAUDE_BRIDGE_OAUTH_TOKEN || undefined;
}
function getBridgeBaseUrlOverride() {
  return process.env.CLAUDE_BRIDGE_BASE_URL || undefined;
}
function getBridgeAccessToken() {
  return getBridgeTokenOverride() ?? getClaudeAIOAuthTokens()?.accessToken;
}
function getBridgeBaseUrl() {
  return getBridgeBaseUrlOverride() ?? getOauthConfig().BASE_API_URL;
}
function isSelfHostedBridge() {
  return !!getBridgeBaseUrlOverride();
}
var init_bridgeConfig = __esm(() => {
  init_oauth();
  init_auth();
});

export { getBridgeTokenOverride, getBridgeBaseUrlOverride, getBridgeAccessToken, getBridgeBaseUrl, isSelfHostedBridge, init_bridgeConfig };

//# debugId=79BCFC084FABA03564756E2164756E21
//# sourceMappingURL=chunk-nfc2mwg3.js.map
