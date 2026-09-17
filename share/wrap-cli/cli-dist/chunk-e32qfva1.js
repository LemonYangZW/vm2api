// @bun
import {
  createUserMessage,
  getAssistantMessageText,
  getLastCacheSafeParams,
  init_cacheSafeParamsSlot,
  init_forkedAgent,
  init_messages1 as init_messages,
  runForkedAgent
} from "./chunk-mxbn7v69.js";
import"./chunk-14p6wvsq.js";
import"./chunk-jpxfbbxv.js";
import"./chunk-5w7gsjdj.js";
import"./chunk-28jd8qjx.js";
import"./chunk-ptxteaeh.js";
import"./chunk-avnfe78q.js";
import"./chunk-xyfbkxqc.js";
import"./chunk-w9t7xj87.js";
import"./chunk-9hz76phm.js";
import"./chunk-e2jjd6qt.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-2aascvnc.js";
import"./chunk-wgwq4gvd.js";
import"./chunk-djt39ze3.js";
import"./chunk-6xvnzvt1.js";
import"./chunk-71sdcaq6.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-x14x0mfb.js";
import"./chunk-f2rhkq3t.js";
import"./chunk-5cf3czgf.js";
import"./chunk-wzmdjz6w.js";
import"./chunk-xp6v07f0.js";
import"./chunk-ffq9eh6d.js";
import"./chunk-z0pvrpej.js";
import"./chunk-24kv69g3.js";
import"./chunk-2vk6e88k.js";
import"./chunk-n1j46ncq.js";
import"./chunk-0kjcxppf.js";
import"./chunk-jt482g7x.js";
import"./chunk-4spgkgr3.js";
import"./chunk-8wzca1dh.js";
import"./chunk-833fsr7s.js";
import"./chunk-2m7k0qdy.js";
import"./chunk-60fkafk2.js";
import"./chunk-mt660rpv.js";
import"./chunk-r5mwhna8.js";
import"./chunk-q4dg9ftz.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-nde5ym6a.js";
import"./chunk-vng1r6q1.js";
import"./chunk-md5kdn6v.js";
import"./chunk-5cgg9kdv.js";
import"./chunk-5xhgd348.js";
import"./chunk-260tj43w.js";
import"./chunk-1qgb1568.js";
import"./chunk-0jw2cfy8.js";
import"./chunk-935nrvdb.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-7y82drab.js";
import"./chunk-hqxp6b72.js";
import"./chunk-1233rcpq.js";
import"./chunk-4fmczbfx.js";
import"./chunk-w5hnghah.js";
import"./chunk-804wr763.js";
import"./chunk-msarpzkm.js";
import"./chunk-s76nvx50.js";
import"./chunk-gb0km2ev.js";
import"./chunk-mhtd3kea.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-64er5ppc.js";
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
import"./chunk-e4dsy4g1.js";
import"./chunk-326zehp8.js";
import"./chunk-kc67kt75.js";
import"./chunk-40t1d75v.js";
import"./chunk-1k7v4v6f.js";
import"./chunk-e3abfxpy.js";
import"./chunk-q44zc68f.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-1ekct4sm.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-wdyw5x2b.js";
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
import {
  init_debug,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import {
  init_sdk
} from "./chunk-ns1htxgd.js";
import {
  APIUserAbortError
} from "./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __require
} from "./chunk-hhsxm2yr.js";

// src/commands/recap/generateRecap.ts
async function getRecapPrompt() {
  try {
    const { getResolvedLanguage } = await import("./chunk-6mwfx87r.js");
    return getResolvedLanguage() === "zh" ? RECAP_PROMPT_ZH : RECAP_PROMPT_EN;
  } catch {
    return RECAP_PROMPT_EN;
  }
}
async function generateRecap(signal) {
  const cacheSafeParams = getLastCacheSafeParams();
  if (!cacheSafeParams) {
    logForDebugging("[recap] no CacheSafeParams saved, skipping");
    return { kind: "no-turn" };
  }
  const inner = new AbortController;
  signal.addEventListener("abort", () => inner.abort(), { once: true });
  try {
    const { messages } = await runForkedAgent({
      promptMessages: [createUserMessage({ content: await getRecapPrompt() })],
      cacheSafeParams,
      canUseTool: async () => ({
        behavior: "deny",
        message: "Recap cannot use tools",
        decisionReason: { type: "other", reason: "away_summary" }
      }),
      overrides: { abortController: inner },
      querySource: "away_summary",
      forkLabel: "away_summary",
      maxTurns: 1,
      skipCacheWrite: true,
      skipTranscript: true
    });
    if (signal.aborted) {
      return { kind: "aborted" };
    }
    const errorMsg = messages.find((m) => m.type === "assistant" && m.isApiErrorMessage);
    if (errorMsg) {
      return {
        kind: "api-error",
        text: getAssistantMessageText(errorMsg) ?? ""
      };
    }
    const assistantMsg = messages.filter((m) => m.type === "assistant" && !m.isApiErrorMessage).pop();
    if (!assistantMsg) {
      return { kind: "failed" };
    }
    const text = getAssistantMessageText(assistantMsg);
    if (!text || text.trim().length === 0) {
      return { kind: "failed" };
    }
    return { kind: "ok", text: text.trim() };
  } catch (err) {
    if (err instanceof APIUserAbortError || signal.aborted || inner.signal.aborted) {
      return { kind: "aborted" };
    }
    logForDebugging(`[recap] generation failed: ${err}`);
    return { kind: "failed" };
  }
}
var RECAP_PROMPT_EN = "The user stepped away and is coming back. Recap in under 40 words, 1-2 plain sentences, no markdown. Lead with the overall goal and current task, then the one next action. Skip root-cause narrative, fix internals, secondary to-dos, and em-dash tangents.", RECAP_PROMPT_ZH = "\u7528\u6237\u79BB\u5F00\u540E\u56DE\u6765\u4E86\u3002\u7528\u4E2D\u6587\u5199 1-2 \u53E5\u8BDD\uFF0C\u4E0D\u8D85\u8FC7 60 \u5B57\uFF0C\u65E0 markdown\u3002\u5148\u8BF4\u660E\u9AD8\u5C42\u76EE\u6807\u548C\u5F53\u524D\u4EFB\u52A1\uFF0C\u518D\u8BF4\u660E\u4E0B\u4E00\u6B65\u64CD\u4F5C\u3002\u8DF3\u8FC7\u6839\u56E0\u5206\u6790\u548C\u6B21\u8981\u5F85\u529E\u3002";
var init_generateRecap = __esm(() => {
  init_sdk();
  init_debug();
  init_cacheSafeParamsSlot();
  init_forkedAgent();
  init_messages();
});
init_generateRecap();

export {
  generateRecap
};

//# debugId=6EAE830FDF54FEE964756E2164756E21
//# sourceMappingURL=chunk-e32qfva1.js.map
