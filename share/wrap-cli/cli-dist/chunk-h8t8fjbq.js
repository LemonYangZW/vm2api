// @bun
import {
  init_tokenEstimation,
  roughTokenCountEstimation
} from "./chunk-92frfsdm.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/statusNoticeHelpers.ts
function getAgentDescriptionsTotalTokens(agentDefinitions) {
  if (!agentDefinitions)
    return 0;
  return agentDefinitions.activeAgents.filter((a) => a.source !== "built-in").reduce((total, agent) => {
    const description = `${agent.agentType}: ${agent.whenToUse}`;
    return total + roughTokenCountEstimation(description);
  }, 0);
}
var AGENT_DESCRIPTIONS_THRESHOLD = 15000;
var init_statusNoticeHelpers = __esm(() => {
  init_tokenEstimation();
});

export { AGENT_DESCRIPTIONS_THRESHOLD, getAgentDescriptionsTotalTokens, init_statusNoticeHelpers };

//# debugId=7007F81692AAA34C64756E2164756E21
//# sourceMappingURL=chunk-h8t8fjbq.js.map
