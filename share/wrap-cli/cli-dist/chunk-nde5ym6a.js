// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/skillLearning/featureCheck.ts
function isSkillLearningCompiledIn() {
  if (false)
    ;
  return false;
}
function isSkillLearningEnabled() {
  if (process.env.SKILL_LEARNING_ENABLED === "1")
    return true;
  if (process.env.FEATURE_SKILL_LEARNING === "1")
    return true;
  return false;
}
var init_featureCheck = () => {};

export { isSkillLearningCompiledIn, isSkillLearningEnabled, init_featureCheck };

//# debugId=75390CE74710737664756E2164756E21
//# sourceMappingURL=chunk-nde5ym6a.js.map
