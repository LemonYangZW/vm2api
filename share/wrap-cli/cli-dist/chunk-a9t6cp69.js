// @bun
import"./chunk-hhsxm2yr.js";

// packages/url-handler-napi/src/index.ts
var MAX_URL_LENGTH = 2048;
async function waitForUrlEvent(timeoutMs) {
  return findUrlEvent();
}
function findUrlEvent() {
  for (const key of [
    "CLAUDE_CODE_URL_EVENT",
    "CLAUDE_CODE_DEEP_LINK_URL",
    "CLAUDE_CODE_URL"
  ]) {
    const value = process.env[key];
    if (isClaudeUrl(value)) {
      return value;
    }
  }
  const arg = process.argv.find(isClaudeUrl);
  return arg ?? null;
}
function isClaudeUrl(value) {
  return typeof value === "string" && value.length <= MAX_URL_LENGTH && (value.startsWith("claude-cli://") || value.startsWith("claude://"));
}
export {
  waitForUrlEvent
};

//# debugId=EAB3A815DD183C5764756E2164756E21
//# sourceMappingURL=chunk-a9t6cp69.js.map
