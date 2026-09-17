// @bun
import {
  ThemedBox_default,
  ThemedText,
  init_src
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/permissions/PermissionRequestTitle.tsx
function PermissionRequestTitle({ title, subtitle, color = "permission", workerBadge }) {
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "row",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color,
            children: title
          }),
          workerBadge && /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            dimColor: true,
            children: [
              "\xB7 ",
              "@",
              workerBadge.name
            ]
          })
        ]
      }),
      subtitle != null && (typeof subtitle === "string" ? /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        dimColor: true,
        wrap: "truncate-start",
        children: subtitle
      }) : subtitle)
    ]
  });
}
var jsx_runtime;
var init_PermissionRequestTitle = __esm(() => {
  init_src();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/components/permissions/PermissionDialog.tsx
function PermissionDialog({
  title,
  subtitle,
  color = "permission",
  titleColor,
  innerPaddingX = 1,
  workerBadge,
  titleRight,
  children
}) {
  return /* @__PURE__ */ jsx_runtime2.jsxs(ThemedBox_default, {
    flexDirection: "column",
    borderStyle: "round",
    borderColor: color,
    borderLeft: false,
    borderRight: false,
    borderBottom: false,
    marginTop: 1,
    children: [
      /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
        paddingX: 1,
        flexDirection: "column",
        children: /* @__PURE__ */ jsx_runtime2.jsxs(ThemedBox_default, {
          justifyContent: "space-between",
          children: [
            /* @__PURE__ */ jsx_runtime2.jsx(PermissionRequestTitle, {
              title,
              subtitle,
              color: titleColor,
              workerBadge
            }),
            titleRight
          ]
        })
      }),
      /* @__PURE__ */ jsx_runtime2.jsx(ThemedBox_default, {
        flexDirection: "column",
        paddingX: innerPaddingX,
        children
      })
    ]
  });
}
var jsx_runtime2;
var init_PermissionDialog = __esm(() => {
  init_src();
  init_PermissionRequestTitle();
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
});

export { PermissionRequestTitle, init_PermissionRequestTitle, PermissionDialog, init_PermissionDialog };

//# debugId=3720D429E6DEC6C264756E2164756E21
//# sourceMappingURL=chunk-222mpwbv.js.map
