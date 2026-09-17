// @bun
import {
  Select,
  getCurrentModeSlug,
  init_select,
  init_store2 as init_store,
  listModes,
  setCurrentMode
} from "./chunk-drtrgzzb.js";
import"./chunk-14p6wvsq.js";
import"./chunk-2gpdtsfv.js";
import"./chunk-5w7gsjdj.js";
import"./chunk-28jd8qjx.js";
import"./chunk-ptxteaeh.js";
import"./chunk-jj6fzyeq.js";
import"./chunk-8t5hwwr1.js";
import"./chunk-w9t7xj87.js";
import"./chunk-hy7vb8en.js";
import"./chunk-rwsm1v0m.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-dz2qs9xd.js";
import"./chunk-wgwq4gvd.js";
import"./chunk-djt39ze3.js";
import"./chunk-27zrv1td.js";
import"./chunk-71sdcaq6.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-jrex6npe.js";
import"./chunk-f2rhkq3t.js";
import"./chunk-5cf3czgf.js";
import"./chunk-trv3gp9b.js";
import"./chunk-xp6v07f0.js";
import"./chunk-ffq9eh6d.js";
import"./chunk-v1ej8e8g.js";
import"./chunk-24kv69g3.js";
import"./chunk-2vk6e88k.js";
import"./chunk-n1j46ncq.js";
import"./chunk-17757k6c.js";
import"./chunk-jt482g7x.js";
import"./chunk-4spgkgr3.js";
import"./chunk-8wzca1dh.js";
import"./chunk-833fsr7s.js";
import"./chunk-2m7k0qdy.js";
import"./chunk-60fkafk2.js";
import"./chunk-mt660rpv.js";
import"./chunk-rmz7z6sx.js";
import"./chunk-q4dg9ftz.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-nde5ym6a.js";
import"./chunk-nmpjbggy.js";
import"./chunk-jh7kfpr9.js";
import"./chunk-wwwx7z5v.js";
import"./chunk-gt54jcxr.js";
import"./chunk-ynb9erf2.js";
import"./chunk-1qgb1568.js";
import"./chunk-0jw2cfy8.js";
import"./chunk-935nrvdb.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-4b2vvevq.js";
import"./chunk-hqxp6b72.js";
import"./chunk-xjrkp6kv.js";
import"./chunk-br64j20p.js";
import"./chunk-w5hnghah.js";
import"./chunk-g6ppvq16.js";
import"./chunk-msarpzkm.js";
import"./chunk-s76nvx50.js";
import"./chunk-gb0km2ev.js";
import"./chunk-necthexa.js";
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
import {
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
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

// src/commands/mode/mode.tsx
function ModePicker({ onDone }) {
  const modes = listModes();
  const currentSlug = getCurrentModeSlug();
  const options = import_react.useMemo(() => modes.map((m) => ({
    label: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
      children: [
        m.icon,
        " ",
        m.name,
        " ",
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "(",
            m.slug,
            ") \u2014 ",
            m.description
          ]
        })
      ]
    }),
    value: m.slug
  })), [modes]);
  function handleSelect(slug) {
    setCurrentMode(slug);
    const target = modes.find((m) => m.slug === slug);
    onDone(`${target?.icon} Mode switched to: ${target?.name} (${target?.slug}) \u2014 ${target?.description}`, {
      display: "system"
    });
  }
  function handleCancel() {
    onDone("Mode selection cancelled.", { display: "system" });
  }
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        marginBottom: 1,
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            color: "remember",
            bold: true,
            children: "Select mode"
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "Arrow keys to navigate, Enter to select, Esc to cancel."
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsx(Select, {
        defaultValue: currentSlug,
        options,
        onChange: handleSelect,
        onCancel: handleCancel,
        visibleOptionCount: modes.length
      })
    ]
  });
}
var import_react, jsx_runtime, call = async (onDone, _context, args) => {
  const slug = args?.trim().toLowerCase();
  if (slug) {
    const modes = listModes();
    const target = modes.find((m) => m.slug === slug);
    if (!target) {
      const available = modes.map((m) => `${m.icon} ${m.slug} \u2014 ${m.description}`).join(`
`);
      onDone(`Unknown mode: "${slug}"

Available modes:
${available}`, {
        display: "system"
      });
      return;
    }
    setCurrentMode(slug);
    onDone(`${target.icon} Mode switched to: ${target.name} (${target.slug}) \u2014 ${target.description}`, {
      display: "system"
    });
    return;
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ModePicker, {
    onDone
  });
};
var init_mode = __esm(() => {
  init_src();
  init_select();
  init_store();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});
init_mode();

export {
  call
};

//# debugId=23E6988FA2BFA93964756E2164756E21
//# sourceMappingURL=chunk-g8yqwste.js.map
