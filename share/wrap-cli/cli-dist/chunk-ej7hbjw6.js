// @bun
import {
  init_datadog,
  trackDatadogEvent
} from "./chunk-804wr763.js";
import {
  checkStatsigFeatureGate_CACHED_MAY_BE_STALE,
  init_firstPartyEventLogger,
  init_growthbook,
  init_sinkKillswitch,
  isSinkKilled,
  logEventTo1P,
  shouldSampleEvent
} from "./chunk-mhtd3kea.js";
import {
  attachAnalyticsSink,
  init_analytics,
  stripProtoFields
} from "./chunk-j1mep9ck.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/analytics/sink.ts
function shouldTrackDatadog() {
  if (isSinkKilled("datadog")) {
    return false;
  }
  if (isDatadogGateEnabled !== undefined) {
    return isDatadogGateEnabled;
  }
  try {
    return checkStatsigFeatureGate_CACHED_MAY_BE_STALE(DATADOG_GATE_NAME);
  } catch {
    return false;
  }
}
function logEventImpl(eventName, metadata) {
  const sampleResult = shouldSampleEvent(eventName);
  if (sampleResult === 0) {
    return;
  }
  const metadataWithSampleRate = sampleResult !== null ? { ...metadata, sample_rate: sampleResult } : metadata;
  if (shouldTrackDatadog()) {
    trackDatadogEvent(eventName, stripProtoFields(metadataWithSampleRate));
  }
  logEventTo1P(eventName, metadataWithSampleRate);
}
function logEventAsyncImpl(eventName, metadata) {
  logEventImpl(eventName, metadata);
  return Promise.resolve();
}
function initializeAnalyticsGates() {
  isDatadogGateEnabled = checkStatsigFeatureGate_CACHED_MAY_BE_STALE(DATADOG_GATE_NAME);
}
function initializeAnalyticsSink() {
  attachAnalyticsSink({
    logEvent: logEventImpl,
    logEventAsync: logEventAsyncImpl
  });
}
var DATADOG_GATE_NAME = "tengu_log_datadog_events", isDatadogGateEnabled;
var init_sink = __esm(() => {
  init_datadog();
  init_firstPartyEventLogger();
  init_growthbook();
  init_analytics();
  init_sinkKillswitch();
});

export { initializeAnalyticsGates, initializeAnalyticsSink, init_sink };

//# debugId=C559A266E7583AE164756E2164756E21
//# sourceMappingURL=chunk-ej7hbjw6.js.map
