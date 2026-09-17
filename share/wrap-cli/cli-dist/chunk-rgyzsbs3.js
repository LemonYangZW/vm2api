// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/providerUsage/store.ts
function updateProviderBuckets(providerId, buckets) {
  current = {
    ...current,
    providerId,
    buckets
  };
  emit();
}
function setProviderBalance(providerId, balance) {
  current = {
    ...current,
    providerId,
    ...balance === null ? { balance: undefined } : { balance }
  };
  emit();
}
function emit() {
  for (const listener of listeners) {
    try {
      listener(current);
    } catch {}
  }
}
var current, listeners;
var init_store = __esm(() => {
  current = {
    providerId: "unknown",
    buckets: []
  };
  listeners = new Set;
});

export { updateProviderBuckets, setProviderBalance, init_store };

//# debugId=54588344A69BCEB164756E2164756E21
//# sourceMappingURL=chunk-rgyzsbs3.js.map
