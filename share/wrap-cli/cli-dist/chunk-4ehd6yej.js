// @bun
import {
  $toString,
  init_server
} from "./chunk-xrw80zgd.js";
import {
  init_useKeybinding
} from "./chunk-2m7k0qdy.js";
import {
  Pane,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  useKeybinding
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-c5g9shkw.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-yes1my80.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/mobile/mobile.tsx
function MobileQRCode({ onDone }) {
  const [platform, setPlatform] = import_react.useState("ios");
  const [qrCodes, setQrCodes] = import_react.useState({
    ios: "",
    android: ""
  });
  const { url } = PLATFORMS[platform];
  const qrCode = qrCodes[platform];
  import_react.useEffect(() => {
    async function generateQRCodes() {
      const [ios, android] = await Promise.all([
        $toString(PLATFORMS.ios.url, {
          type: "utf8",
          errorCorrectionLevel: "L"
        }),
        $toString(PLATFORMS.android.url, {
          type: "utf8",
          errorCorrectionLevel: "L"
        })
      ]);
      setQrCodes({ ios, android });
    }
    generateQRCodes().catch(() => {});
  }, []);
  const handleClose = import_react.useCallback(() => {
    onDone();
  }, [onDone]);
  useKeybinding("confirm:no", handleClose, { context: "Confirmation" });
  function handleKeyDown(e) {
    if (e.key === "q" || e.ctrl && e.key === "c") {
      e.preventDefault();
      onDone();
      return;
    }
    if (e.key === "tab" || e.key === "left" || e.key === "right") {
      e.preventDefault();
      setPlatform((prev) => prev === "ios" ? "android" : "ios");
    }
  }
  const lines = qrCode.split(`
`).filter((line) => line.length > 0);
  return /* @__PURE__ */ jsx_runtime.jsx(Pane, {
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: " "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: " "
        }),
        lines.map((line, i) => /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: line
        }, i)),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: " "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: " "
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          flexDirection: "row",
          gap: 2,
          children: [
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  bold: platform === "ios",
                  underline: platform === "ios",
                  children: "iOS"
                }),
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  dimColor: true,
                  children: " / "
                }),
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  bold: platform === "android",
                  underline: platform === "android",
                  children: "Android"
                })
              ]
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: "(tab to switch, esc to close)"
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: url
        })
      ]
    })
  });
}
async function call(onDone) {
  return /* @__PURE__ */ jsx_runtime.jsx(MobileQRCode, {
    onDone
  });
}
var import_react, jsx_runtime, PLATFORMS;
var init_mobile = __esm(() => {
  init_server();
  init_src();
  init_src();
  init_useKeybinding();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  PLATFORMS = {
    ios: {
      url: "https://apps.apple.com/app/claude-by-anthropic/id6473753684"
    },
    android: {
      url: "https://play.google.com/store/apps/details?id=com.anthropic.claude"
    }
  };
});
init_mobile();

export {
  call
};

//# debugId=678A01CDDAA77E1B64756E2164756E21
//# sourceMappingURL=chunk-4ehd6yej.js.map
