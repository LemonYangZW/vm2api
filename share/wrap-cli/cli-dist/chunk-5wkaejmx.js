// @bun
import {
  AGENT_COLORS,
  getTranscriptPath,
  init_agentColorManager,
  init_sessionStorage,
  saveAgentColor
} from "./chunk-92frfsdm.js";
import"./chunk-14p6wvsq.js";
import"./chunk-sndpqnmg.js";
import"./chunk-5w7gsjdj.js";
import"./chunk-28jd8qjx.js";
import"./chunk-ptxteaeh.js";
import"./chunk-hkv7c3s6.js";
import"./chunk-f40jvwgw.js";
import"./chunk-w9t7xj87.js";
import"./chunk-xah6e91t.js";
import"./chunk-qvq9z8k4.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-0rhrpnpv.js";
import"./chunk-wgwq4gvd.js";
import"./chunk-djt39ze3.js";
import"./chunk-4x9pek6a.js";
import"./chunk-71sdcaq6.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-4rer68y0.js";
import"./chunk-f2rhkq3t.js";
import"./chunk-5cf3czgf.js";
import"./chunk-bhgvey4s.js";
import"./chunk-xp6v07f0.js";
import"./chunk-ffq9eh6d.js";
import"./chunk-kbkxsgv3.js";
import"./chunk-24kv69g3.js";
import"./chunk-2vk6e88k.js";
import"./chunk-n1j46ncq.js";
import"./chunk-hdtp7tn1.js";
import"./chunk-jt482g7x.js";
import"./chunk-4spgkgr3.js";
import"./chunk-8wzca1dh.js";
import"./chunk-833fsr7s.js";
import"./chunk-2m7k0qdy.js";
import"./chunk-60fkafk2.js";
import"./chunk-mt660rpv.js";
import"./chunk-7b68gcqs.js";
import"./chunk-q4dg9ftz.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-nde5ym6a.js";
import"./chunk-a4q88q6t.js";
import"./chunk-1d7prqr7.js";
import"./chunk-nfc2mwg3.js";
import"./chunk-c40ryser.js";
import"./chunk-qw03ehq0.js";
import"./chunk-1qgb1568.js";
import"./chunk-0jw2cfy8.js";
import"./chunk-935nrvdb.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-w6cgk6nk.js";
import"./chunk-hqxp6b72.js";
import"./chunk-2ehn4hjt.js";
import"./chunk-zymr6ztr.js";
import"./chunk-w5hnghah.js";
import"./chunk-vdz79ezt.js";
import"./chunk-msarpzkm.js";
import"./chunk-s76nvx50.js";
import"./chunk-gb0km2ev.js";
import"./chunk-ghhmj79c.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-rwny7j7h.js";
import {
  init_teammate,
  isTeammate
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
import"./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import {
  getSessionId,
  init_state
} from "./chunk-v4e7ch76.js";
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
  __esm
} from "./chunk-hhsxm2yr.js";

// src/commands/color/color.ts
async function call(onDone, context, args) {
  if (isTeammate()) {
    onDone("Cannot set color: This session is a swarm teammate. Teammate colors are assigned by the team leader.", { display: "system" });
    return null;
  }
  if (!args || args.trim() === "") {
    const colorList = AGENT_COLORS.join(", ");
    onDone(`Please provide a color. Available colors: ${colorList}, default`, {
      display: "system"
    });
    return null;
  }
  const colorArg = args.trim().toLowerCase();
  if (RESET_ALIASES.includes(colorArg)) {
    const sessionId2 = getSessionId();
    const fullPath2 = getTranscriptPath();
    await saveAgentColor(sessionId2, "default", fullPath2);
    context.setAppState((prev) => ({
      ...prev,
      standaloneAgentContext: {
        ...prev.standaloneAgentContext,
        name: prev.standaloneAgentContext?.name ?? "",
        color: undefined
      }
    }));
    onDone("Session color reset to default", { display: "system" });
    return null;
  }
  if (!AGENT_COLORS.includes(colorArg)) {
    const colorList = AGENT_COLORS.join(", ");
    onDone(`Invalid color "${colorArg}". Available colors: ${colorList}, default`, { display: "system" });
    return null;
  }
  const sessionId = getSessionId();
  const fullPath = getTranscriptPath();
  await saveAgentColor(sessionId, colorArg, fullPath);
  context.setAppState((prev) => ({
    ...prev,
    standaloneAgentContext: {
      ...prev.standaloneAgentContext,
      name: prev.standaloneAgentContext?.name ?? "",
      color: colorArg
    }
  }));
  onDone(`Session color set to: ${colorArg}`, { display: "system" });
  return null;
}
var RESET_ALIASES;
var init_color = __esm(() => {
  init_state();
  init_agentColorManager();
  init_sessionStorage();
  init_teammate();
  RESET_ALIASES = ["default", "reset", "none", "gray", "grey"];
});
init_color();

export {
  call
};

//# debugId=F1FD17210CBF3CD664756E2164756E21
//# sourceMappingURL=chunk-5wkaejmx.js.map
