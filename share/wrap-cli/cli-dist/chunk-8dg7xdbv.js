// @bun
import {
  Messages,
  init_Messages
} from "./chunk-haegcf1t.js";
import {
  init_staticRender,
  renderToAnsiString
} from "./chunk-mvq2dtxj.js";
import {
  AppStateProvider,
  init_AppState,
  init_KeybindingContext,
  init_loadUserBindings,
  loadKeybindingsSyncWithWarnings
} from "./chunk-drtrgzzb.js";
import {
  KeybindingProvider,
  init_strip_ansi,
  require_react,
  stripAnsi
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/utils/exportRenderer.tsx
function StaticKeybindingProvider({ children }) {
  const { bindings } = loadKeybindingsSyncWithWarnings();
  const pendingChordRef = import_react.useRef(null);
  const handlerRegistryRef = import_react.useRef(new Map);
  const activeContexts = import_react.useRef(new Set).current;
  return /* @__PURE__ */ jsx_runtime.jsx(KeybindingProvider, {
    bindings,
    pendingChordRef,
    pendingChord: null,
    setPendingChord: () => {},
    activeContexts,
    registerActiveContext: () => {},
    unregisterActiveContext: () => {},
    handlerRegistryRef,
    children
  });
}
function normalizedUpperBound(m) {
  if (!("message" in m))
    return 1;
  const c = m.message.content;
  return Array.isArray(c) ? c.length : 1;
}
async function streamRenderedMessages(messages, tools, sink, {
  columns,
  verbose = false,
  chunkSize = 40,
  onProgress
} = {}) {
  const renderChunk = (range) => renderToAnsiString(/* @__PURE__ */ jsx_runtime.jsx(AppStateProvider, {
    children: /* @__PURE__ */ jsx_runtime.jsx(StaticKeybindingProvider, {
      children: /* @__PURE__ */ jsx_runtime.jsx(Messages, {
        messages,
        tools,
        commands: [],
        verbose,
        toolJSX: null,
        toolUseConfirmQueue: [],
        inProgressToolUseIDs: new Set,
        isMessageSelectorVisible: false,
        conversationId: "export",
        screen: "prompt",
        streamingToolUses: [],
        showAllInTranscript: true,
        isLoading: false,
        renderRange: range
      })
    })
  }), columns);
  let ceiling = chunkSize;
  for (const m of messages)
    ceiling += normalizedUpperBound(m);
  for (let offset = 0;offset < ceiling; offset += chunkSize) {
    const ansi = await renderChunk([offset, offset + chunkSize]);
    if (stripAnsi(ansi).trim() === "")
      break;
    await sink(ansi);
    onProgress?.(offset + chunkSize);
  }
}
async function renderMessagesToPlainText(messages, tools = [], columns) {
  const parts = [];
  await streamRenderedMessages(messages, tools, (chunk) => void parts.push(stripAnsi(chunk)), { columns });
  return parts.join("");
}
var import_react, jsx_runtime;
var init_exportRenderer = __esm(() => {
  init_strip_ansi();
  init_Messages();
  init_KeybindingContext();
  init_loadUserBindings();
  init_AppState();
  init_staticRender();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { renderMessagesToPlainText, init_exportRenderer };

//# debugId=C6F61F17AB9A0C0764756E2164756E21
//# sourceMappingURL=chunk-8dg7xdbv.js.map
