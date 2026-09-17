// @bun
import {
  init_browser,
  openBrowser
} from "./chunk-1qgb1568.js";
import {
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  setClipboard,
  use_input_default
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-t37nnsvj.js";
import"./chunk-ew28k9dk.js";
import"./chunk-mhjmeh6r.js";
import"./chunk-m28vg9w4.js";
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
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/artifacts/ArtifactsMenu.tsx
function ArtifactsMenu({ artifacts, onExit }) {
  const [selected, setSelected] = React.useState(0);
  use_input_default((input, key) => {
    if (input === "q" || key.escape) {
      onExit();
      return;
    }
    if (artifacts.length === 0)
      return;
    if (key.upArrow) {
      setSelected((s) => (s - 1 + artifacts.length) % artifacts.length);
      return;
    }
    if (key.downArrow) {
      setSelected((s) => (s + 1) % artifacts.length);
      return;
    }
    if (key.return) {
      const target = artifacts[selected];
      if (target.url) {
        openBrowser(target.url);
      }
      return;
    }
    if (input === "c") {
      const target = artifacts[selected];
      if (target.url) {
        setClipboard(target.url).then((raw) => {
          if (raw)
            process.stdout.write(raw);
        });
      }
    }
  });
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    paddingX: 1,
    paddingY: 0,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          bold: true,
          children: [
            "Artifacts (",
            artifacts.length,
            ")"
          ]
        })
      }),
      artifacts.length === 0 ? /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        color: "subtle",
        children: "No artifacts uploaded this session. Run /use-artifacts to learn how."
      }) : /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          artifacts.map((a, idx) => /* @__PURE__ */ jsx_runtime.jsx(ArtifactRow, {
            artifact: a,
            isSelected: idx === selected
          }, a.toolUseId)),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "subtle",
              children: "\u2191/\u2193 select \xB7 Enter open \xB7 c copy URL \xB7 Esc exit"
            })
          })
        ]
      })
    ]
  });
}
function ArtifactRow({ artifact, isSelected }) {
  const marker = isSelected ? "\u203A" : " ";
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            color: isSelected ? "suggestion" : undefined,
            children: [
              marker,
              " "
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: isSelected,
            color: artifact.isError ? "error" : undefined,
            children: artifact.basename
          }),
          artifact.hash ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            color: "subtle",
            children: [
              " (",
              artifact.hash,
              ")"
            ]
          }) : null
        ]
      }),
      artifact.url ? /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        marginLeft: 2,
        children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color: "background",
          children: artifact.url
        })
      }) : /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        marginLeft: 2,
        children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color: "error",
          children: artifact.rawContent
        })
      }),
      artifact.expiresAt ? /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        marginLeft: 2,
        children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          color: "subtle",
          children: [
            "expires: ",
            artifact.expiresAt
          ]
        })
      }) : null
    ]
  });
}
var React, jsx_runtime;
var init_ArtifactsMenu = __esm(() => {
  init_src();
  init_browser();
  React = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/artifacts/scanner.ts
import { basename } from "path";
function extractArtifacts(messages) {
  const results = [];
  let artifactUseCount = 0;
  let indexedResults = null;
  for (const message of messages) {
    if (message.type !== "assistant")
      continue;
    const content = message.message?.content;
    if (!Array.isArray(content))
      continue;
    for (const block of content) {
      if (typeof block !== "object" || block === null)
        continue;
      if (!("type" in block))
        continue;
      const b = block;
      if (b.type !== "tool_use")
        continue;
      if (b.name !== "artifact")
        continue;
      const toolUseId = b.id;
      const input = b.input;
      const filePath = input?.file_path ?? "<unknown>";
      artifactUseCount++;
      if (artifactUseCount === 2) {
        indexedResults = indexToolResults(messages);
      }
      const resultBlock = indexedResults ? indexedResults.get(toolUseId) ?? null : findToolResult(messages, toolUseId);
      if (!resultBlock)
        continue;
      const rawContent = typeof resultBlock.content === "string" ? resultBlock.content : Array.isArray(resultBlock.content) ? resultBlock.content.map((c) => typeof c === "string" ? c : ("text" in c) ? c.text : "").join("") : "";
      const isError = resultBlock.is_error === true;
      const urlMatch = rawContent.match(URL_REGEX);
      const idMatch = rawContent.match(ID_REGEX);
      const expiresMatch = rawContent.match(EXPIRES_REGEX);
      results.push({
        toolUseId,
        filePath,
        basename: basename(filePath),
        hash: idMatch?.[1],
        url: urlMatch?.[0],
        expiresAt: expiresMatch?.[1],
        rawContent,
        isError
      });
    }
  }
  return results.reverse();
}
function findToolResult(messages, toolUseId) {
  for (const message of messages) {
    if (message.type !== "user")
      continue;
    const content = message.message?.content;
    if (!Array.isArray(content))
      continue;
    for (const block of content) {
      if (typeof block !== "object" || block === null)
        continue;
      if (!("type" in block))
        continue;
      const b = block;
      if (b.type !== "tool_result")
        continue;
      if (b.tool_use_id !== toolUseId)
        continue;
      return { content: b.content, is_error: b.is_error };
    }
  }
  return null;
}
function indexToolResults(messages) {
  const results = new Map;
  for (const message of messages) {
    if (message.type !== "user")
      continue;
    const content = message.message?.content;
    if (!Array.isArray(content))
      continue;
    for (const block of content) {
      if (typeof block !== "object" || block === null)
        continue;
      if (!("type" in block))
        continue;
      const b = block;
      if (b.type !== "tool_result")
        continue;
      const toolUseId = b.tool_use_id;
      if (results.has(toolUseId))
        continue;
      results.set(toolUseId, {
        content: b.content,
        is_error: b.is_error
      });
    }
  }
  return results;
}
var URL_REGEX, ID_REGEX, EXPIRES_REGEX;
var init_scanner = __esm(() => {
  URL_REGEX = /https?:\/\/[^\s)"',]+\.html\b/;
  ID_REGEX = /\bid:\s*([A-Za-z0-9_-]+)/;
  EXPIRES_REGEX = /\bexpires:\s*([0-9T:.Z+-]+)/;
});

// src/commands/artifacts/artifacts.tsx
async function call(onDone, context) {
  const messages = context.messages ?? [];
  const artifacts = extractArtifacts(messages);
  return /* @__PURE__ */ jsx_runtime2.jsx(ArtifactsMenu, {
    artifacts,
    onExit: onDone
  });
}
var jsx_runtime2;
var init_artifacts = __esm(() => {
  init_ArtifactsMenu();
  init_scanner();
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
});
init_artifacts();

export {
  call
};

//# debugId=C83F2028406B7D0164756E2164756E21
//# sourceMappingURL=chunk-449aq9a5.js.map
