// @bun
import {
  init_debug,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __require
} from "./chunk-hhsxm2yr.js";

// src/assistant/sessionDiscovery.ts
init_debug();
async function discoverAssistantSessions() {
  const { fetchCodeSessionsFromSessionsAPI } = await import("./chunk-pkjtv9y3.js");
  let allSessions;
  try {
    allSessions = await fetchCodeSessionsFromSessionsAPI();
  } catch (err) {
    logForDebugging(`[assistant:discovery] fetchCodeSessionsFromSessionsAPI failed: ${err}`);
    throw err;
  }
  return allSessions.filter((s) => s.status === "idle" || s.status === "working" || s.status === "waiting").map((s) => ({
    id: s.id,
    title: s.title || "Untitled",
    status: s.status,
    created_at: s.created_at ?? ""
  }));
}
export {
  discoverAssistantSessions
};

//# debugId=95DE6CD054638F5F64756E2164756E21
//# sourceMappingURL=chunk-g3x8zj8a.js.map
