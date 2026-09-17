// @bun
import {
  clearBetaHeaderLatches,
  clearSystemPromptSectionState,
  getSystemPromptSectionCache,
  init_state,
  setSystemPromptSectionCacheEntry
} from "./chunk-v4e7ch76.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/constants/systemPromptSections.ts
function systemPromptSection(name, compute) {
  return { name, compute, cacheBreak: false };
}
function DANGEROUS_uncachedSystemPromptSection(name, compute, _reason) {
  return { name, compute, cacheBreak: true };
}
async function resolveSystemPromptSections(sections) {
  const cache = getSystemPromptSectionCache();
  return Promise.all(sections.map(async (s) => {
    if (!s.cacheBreak && cache.has(s.name)) {
      return cache.get(s.name) ?? null;
    }
    const value = await s.compute();
    setSystemPromptSectionCacheEntry(s.name, value);
    return value;
  }));
}
function clearSystemPromptSections() {
  clearSystemPromptSectionState();
  clearBetaHeaderLatches();
}
var init_systemPromptSections = __esm(() => {
  init_state();
});

export { systemPromptSection, DANGEROUS_uncachedSystemPromptSection, resolveSystemPromptSections, clearSystemPromptSections, init_systemPromptSections };

//# debugId=44F4C55208B7F78864756E2164756E21
//# sourceMappingURL=chunk-5w7gsjdj.js.map
