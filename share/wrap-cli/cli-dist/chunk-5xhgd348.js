// @bun
import {
  getClaudeAIOAuthTokens,
  getFeatureValue_CACHED_MAY_BE_STALE,
  init_auth,
  init_growthbook,
  isAnthropicAuthEnabled
} from "./chunk-mhtd3kea.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/voice/voiceModeEnabled.ts
function isVoiceGrowthBookEnabled() {
  return !getFeatureValue_CACHED_MAY_BE_STALE("tengu_amber_quartz_disabled", false);
}
function hasVoiceAuth() {
  if (!isAnthropicAuthEnabled()) {
    return false;
  }
  const tokens = getClaudeAIOAuthTokens();
  return Boolean(tokens?.accessToken);
}
function isVoiceModeEnabled() {
  return hasVoiceAuth() && isVoiceGrowthBookEnabled();
}
function isVoiceAvailable() {
  return isVoiceGrowthBookEnabled();
}
var init_voiceModeEnabled = __esm(() => {
  init_growthbook();
  init_auth();
});

export { isVoiceGrowthBookEnabled, hasVoiceAuth, isVoiceModeEnabled, isVoiceAvailable, init_voiceModeEnabled };

//# debugId=19B097ED65271EC564756E2164756E21
//# sourceMappingURL=chunk-5xhgd348.js.map
