// @bun
import {
  formatGrantAmount,
  getCachedOverageCreditGrant,
  init_overageCreditGrant,
  refreshOverageCreditGrantCache
} from "./chunk-md7q9jgq.js";
import {
  getGlobalConfig,
  init_config1 as init_config,
  saveGlobalConfig
} from "./chunk-ghhmj79c.js";
import {
  init_format,
  truncate
} from "./chunk-v5yhfnx0.js";
import {
  ThemedText,
  init_src,
  require_react
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/LogoV2/OverageCreditUpsell.tsx
function isEligibleForOverageCreditGrant() {
  const info = getCachedOverageCreditGrant();
  if (!info || !info.available || info.granted)
    return false;
  return formatGrantAmount(info) !== null;
}
function shouldShowOverageCreditUpsell() {
  if (!isEligibleForOverageCreditGrant())
    return false;
  const config = getGlobalConfig();
  if (config.hasVisitedExtraUsage)
    return false;
  if ((config.overageCreditUpsellSeenCount ?? 0) >= MAX_IMPRESSIONS)
    return false;
  return true;
}
function maybeRefreshOverageCreditCache() {
  if (getCachedOverageCreditGrant() !== null)
    return;
  refreshOverageCreditGrantCache();
}
function useShowOverageCreditUpsell() {
  const [show] = import_react.useState(() => {
    maybeRefreshOverageCreditCache();
    return shouldShowOverageCreditUpsell();
  });
  return show;
}
function incrementOverageCreditUpsellSeenCount() {
  let newCount = 0;
  saveGlobalConfig((prev) => {
    newCount = (prev.overageCreditUpsellSeenCount ?? 0) + 1;
    return {
      ...prev,
      overageCreditUpsellSeenCount: newCount
    };
  });
  logEvent("tengu_overage_credit_upsell_shown", { seen_count: newCount });
}
function getUsageText(amount) {
  return `${amount} in extra usage for third-party apps \xB7 /extra-usage`;
}
function getFeedTitle(amount) {
  return `${amount} in extra usage`;
}
function OverageCreditUpsell({ maxWidth, twoLine }) {
  const info = getCachedOverageCreditGrant();
  if (!info)
    return null;
  const amount = formatGrantAmount(info);
  if (!amount)
    return null;
  if (twoLine) {
    const title = getFeedTitle(amount);
    return /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color: "claude",
          children: maxWidth ? truncate(title, maxWidth) : title
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: maxWidth ? truncate(FEED_SUBTITLE, maxWidth) : FEED_SUBTITLE
        })
      ]
    });
  }
  const text = getUsageText(amount);
  const display = maxWidth ? truncate(text, maxWidth) : text;
  const highlightLen = Math.min(getFeedTitle(amount).length, display.length);
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
    dimColor: true,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        color: "claude",
        children: display.slice(0, highlightLen)
      }),
      display.slice(highlightLen)
    ]
  });
}
function createOverageCreditFeed() {
  const info = getCachedOverageCreditGrant();
  const amount = info ? formatGrantAmount(info) : null;
  const title = amount ? getFeedTitle(amount) : "extra usage credit";
  return {
    title,
    lines: [],
    customContent: {
      content: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        dimColor: true,
        children: FEED_SUBTITLE
      }),
      width: Math.max(title.length, FEED_SUBTITLE.length)
    }
  };
}
var import_react, jsx_runtime, MAX_IMPRESSIONS = 3, FEED_SUBTITLE = "On us. Works on third-party apps \xB7 /extra-usage";
var init_OverageCreditUpsell = __esm(() => {
  init_src();
  init_analytics();
  init_overageCreditGrant();
  init_config();
  init_format();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { isEligibleForOverageCreditGrant, shouldShowOverageCreditUpsell, useShowOverageCreditUpsell, incrementOverageCreditUpsellSeenCount, OverageCreditUpsell, createOverageCreditFeed, init_OverageCreditUpsell };

//# debugId=FFA951B2264A7FFA64756E2164756E21
//# sourceMappingURL=chunk-k3y3807g.js.map
