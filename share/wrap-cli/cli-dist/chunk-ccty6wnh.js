// @bun
import {
  init_setup,
  isChromeExtensionInstalled
} from "./chunk-0ma4d6kf.js";
import"./chunk-rmn1bnbd.js";
import"./chunk-28jd8qjx.js";
import"./chunk-djt39ze3.js";
import"./chunk-5cf3czgf.js";
import {
  init_config1 as init_config,
  saveGlobalConfig
} from "./chunk-necthexa.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-k48mx8nn.js";
import"./chunk-epvbnq43.js";
import"./chunk-h7cy00tf.js";
import"./chunk-srzb9n7s.js";
import"./chunk-6tzyv21c.js";
import"./chunk-8kf8h7xf.js";
import"./chunk-bgan4cpf.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-psygyacq.js";
import"./chunk-e2d0hkcr.js";
import"./chunk-g2931ep0.js";
import"./chunk-vwenx8ke.js";
import"./chunk-kkpmm4b2.js";
import"./chunk-etzpfazg.js";
import"./chunk-v4ypszbb.js";
import"./chunk-bk6ck5c2.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-326zehp8.js";
import"./chunk-40t1d75v.js";
import"./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import {
  Dialog,
  Link,
  Newline,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  use_input_default
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-3yga13e5.js";
import"./chunk-ye35qwfx.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-t37nnsvj.js";
import"./chunk-ew28k9dk.js";
import"./chunk-mhjmeh6r.js";
import"./chunk-m28vg9w4.js";
import"./chunk-m4zp6cf9.js";
import"./chunk-w8n8j7aw.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import"./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/ClaudeInChromeOnboarding.tsx
init_analytics();
init_src();
init_setup();
init_config();
var import_react = __toESM(require_react(), 1);
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
var CHROME_EXTENSION_URL = "https://claude.ai/chrome";
var CHROME_PERMISSIONS_URL = "https://clau.de/chrome/permissions";
function ClaudeInChromeOnboarding({ onDone }) {
  const [isExtensionInstalled, setIsExtensionInstalled] = import_react.default.useState(false);
  import_react.default.useEffect(() => {
    logEvent("tengu_claude_in_chrome_onboarding_shown", {});
    isChromeExtensionInstalled().then(setIsExtensionInstalled);
    saveGlobalConfig((current) => {
      return { ...current, hasCompletedClaudeInChromeOnboarding: true };
    });
  }, []);
  use_input_default((_input, key) => {
    if (key.return) {
      onDone();
    }
  });
  return /* @__PURE__ */ jsx_runtime.jsx(Dialog, {
    title: "Claude in Chrome (Beta)",
    onCancel: onDone,
    color: "chromeYellow",
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Claude in Chrome works with the Chrome extension to let you control your browser directly from Claude Code. You can navigate websites, fill forms, capture screenshots, record GIFs, and debug with console logs and network requests.",
            !isExtensionInstalled && /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(Newline, {}),
                /* @__PURE__ */ jsx_runtime.jsx(Newline, {}),
                "Requires the Chrome extension. Get started at ",
                /* @__PURE__ */ jsx_runtime.jsx(Link, {
                  url: CHROME_EXTENSION_URL
                })
              ]
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on",
            isExtensionInstalled && /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
              children: [
                " ",
                "(",
                /* @__PURE__ */ jsx_runtime.jsx(Link, {
                  url: CHROME_PERMISSIONS_URL
                }),
                ")"
              ]
            }),
            "."
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "For more info, use",
            " ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              bold: true,
              color: "chromeYellow",
              children: "/chrome"
            }),
            " ",
            "or visit ",
            /* @__PURE__ */ jsx_runtime.jsx(Link, {
              url: "https://code.claude.com/docs/en/chrome"
            })
          ]
        })
      ]
    })
  });
}
export {
  ClaudeInChromeOnboarding
};

//# debugId=9D3F9505E9FD4C6264756E2164756E21
//# sourceMappingURL=chunk-ccty6wnh.js.map
