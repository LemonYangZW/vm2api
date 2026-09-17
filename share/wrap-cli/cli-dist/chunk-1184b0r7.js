// @bun
import {
  fetchReferralRedemptions,
  formatCreditAmount,
  getCachedOrFetchPassesEligibility,
  getCachedRemainingPasses,
  init_referral
} from "./chunk-v1ej8e8g.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-n1j46ncq.js";
import {
  init_useKeybinding
} from "./chunk-2m7k0qdy.js";
import"./chunk-ynb9erf2.js";
import {
  TEARDROP_ASTERISK,
  getGlobalConfig,
  init_config1 as init_config,
  init_figures,
  saveGlobalConfig
} from "./chunk-necthexa.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-k48mx8nn.js";
import {
  count,
  init_array
} from "./chunk-epvbnq43.js";
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
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-326zehp8.js";
import"./chunk-40t1d75v.js";
import"./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import {
  Link,
  Pane,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  setClipboard,
  useKeybinding,
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
import"./chunk-wdyw5x2b.js";
import"./chunk-3yga13e5.js";
import"./chunk-ye35qwfx.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-t37nnsvj.js";
import"./chunk-ew28k9dk.js";
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
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
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/Passes/Passes.tsx
function Passes({ onDone }) {
  const [loading, setLoading] = import_react.useState(true);
  const [passStatuses, setPassStatuses] = import_react.useState([]);
  const [isAvailable, setIsAvailable] = import_react.useState(false);
  const [referralLink, setReferralLink] = import_react.useState(null);
  const [referrerReward, setReferrerReward] = import_react.useState(undefined);
  const exitState = useExitOnCtrlCDWithKeybindings(() => onDone("Guest passes dialog dismissed", { display: "system" }));
  const handleCancel = import_react.useCallback(() => {
    onDone("Guest passes dialog dismissed", { display: "system" });
  }, [onDone]);
  useKeybinding("confirm:no", handleCancel, { context: "Confirmation" });
  use_input_default((_input, key) => {
    if (key.return && referralLink) {
      setClipboard(referralLink).then((raw) => {
        if (raw)
          process.stdout.write(raw);
        logEvent("tengu_guest_passes_link_copied", {});
        onDone(`Referral link copied to clipboard!`);
      });
    }
  });
  import_react.useEffect(() => {
    async function loadPassesData() {
      try {
        const eligibilityData = await getCachedOrFetchPassesEligibility();
        if (!eligibilityData || !eligibilityData.eligible) {
          setIsAvailable(false);
          setLoading(false);
          return;
        }
        setIsAvailable(true);
        if (eligibilityData.referral_code_details?.referral_link) {
          setReferralLink(eligibilityData.referral_code_details.referral_link);
        }
        setReferrerReward(eligibilityData.referrer_reward);
        const campaign = eligibilityData.referral_code_details?.campaign ?? "claude_code_guest_pass";
        let redemptionsData;
        try {
          redemptionsData = await fetchReferralRedemptions(campaign);
        } catch (err) {
          logError(err);
          setIsAvailable(false);
          setLoading(false);
          return;
        }
        const redemptions = redemptionsData.redemptions || [];
        const maxRedemptions = redemptionsData.limit || 3;
        const statuses = [];
        for (let i = 0;i < maxRedemptions; i++) {
          const redemption = redemptions[i];
          statuses.push({
            passNumber: i + 1,
            isAvailable: !redemption
          });
        }
        setPassStatuses(statuses);
        setLoading(false);
      } catch (err) {
        logError(err);
        setIsAvailable(false);
        setLoading(false);
      }
    }
    loadPassesData();
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsx_runtime.jsx(Pane, {
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "Loading guest pass information\u2026"
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            italic: true,
            children: exitState.pending ? /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
              children: [
                "Press ",
                exitState.keyName,
                " again to exit"
              ]
            }) : /* @__PURE__ */ jsx_runtime.jsx(jsx_runtime.Fragment, {
              children: "Esc to cancel"
            })
          })
        ]
      })
    });
  }
  if (!isAvailable) {
    return /* @__PURE__ */ jsx_runtime.jsx(Pane, {
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "Guest passes are not currently available."
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            italic: true,
            children: exitState.pending ? /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
              children: [
                "Press ",
                exitState.keyName,
                " again to exit"
              ]
            }) : /* @__PURE__ */ jsx_runtime.jsx(jsx_runtime.Fragment, {
              children: "Esc to cancel"
            })
          })
        ]
      })
    });
  }
  const availableCount = count(passStatuses, (p) => p.isAvailable);
  const sortedPasses = [...passStatuses].sort((a, b) => +b.isAvailable - +a.isAvailable);
  const renderTicket = (pass) => {
    const isRedeemed = !pass.isAvailable;
    if (isRedeemed) {
      return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        marginRight: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2571"
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: ` ) CC ${TEARDROP_ASTERISK} \u250A\u2571`
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2571"
          })
        ]
      }, pass.passNumber);
    }
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      marginRight: 1,
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            " ) CC ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "claude",
              children: TEARDROP_ASTERISK
            }),
            " \u250A ( "
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518"
        })
      ]
    }, pass.passNumber);
  };
  return /* @__PURE__ */ jsx_runtime.jsx(Pane, {
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          color: "permission",
          children: [
            "Guest passes \xB7 ",
            availableCount,
            " left"
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          flexDirection: "row",
          marginLeft: 2,
          children: sortedPasses.slice(0, 3).map((pass) => renderTicket(pass))
        }),
        referralLink && /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginLeft: 2,
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: referralLink
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          flexDirection: "column",
          marginLeft: 2,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            dimColor: true,
            children: [
              referrerReward ? `Share a free week of Claude Code with friends. If they love it and subscribe, you'll get ${formatCreditAmount(referrerReward)} of extra usage to keep building. ` : "Share a free week of Claude Code with friends. ",
              /* @__PURE__ */ jsx_runtime.jsx(Link, {
                url: referrerReward ? "https://support.claude.com/en/articles/13456702-claude-code-guest-passes" : "https://support.claude.com/en/articles/12875061-claude-code-guest-passes",
                children: "Terms apply."
              })
            ]
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            italic: true,
            children: exitState.pending ? /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
              children: [
                "Press ",
                exitState.keyName,
                " again to exit"
              ]
            }) : /* @__PURE__ */ jsx_runtime.jsx(jsx_runtime.Fragment, {
              children: "Enter to copy link \xB7 Esc to cancel"
            })
          })
        })
      ]
    })
  });
}
var import_react, jsx_runtime;
var init_Passes = __esm(() => {
  init_figures();
  init_useExitOnCtrlCDWithKeybindings();
  init_src();
  init_src();
  init_useKeybinding();
  init_analytics();
  init_referral();
  init_array();
  init_log();
  init_src();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/passes/passes.tsx
async function call(onDone) {
  const config = getGlobalConfig();
  const isFirstVisit = !config.hasVisitedPasses;
  if (isFirstVisit) {
    const remaining = getCachedRemainingPasses();
    saveGlobalConfig((current) => ({
      ...current,
      hasVisitedPasses: true,
      passesLastSeenRemaining: remaining ?? current.passesLastSeenRemaining
    }));
  }
  logEvent("tengu_guest_passes_visited", { is_first_visit: isFirstVisit });
  return /* @__PURE__ */ jsx_runtime2.jsx(Passes, {
    onDone
  });
}
var jsx_runtime2;
var init_passes = __esm(() => {
  init_Passes();
  init_analytics();
  init_referral();
  init_config();
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
});
init_passes();

export {
  call
};

//# debugId=E5A817E942C8DA1B64756E2164756E21
//# sourceMappingURL=chunk-1184b0r7.js.map
