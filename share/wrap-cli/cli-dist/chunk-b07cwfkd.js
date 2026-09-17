// @bun
import {
  init_useTerminalSize
} from "./chunk-2vk6e88k.js";
import {
  init_format,
  truncatePathMiddle,
  truncateToWidth
} from "./chunk-v5yhfnx0.js";
import {
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  stringWidth,
  useTerminalSize
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/PromptInput/PromptInputFooterSuggestions.tsx
function getIcon(itemId) {
  if (itemId.startsWith("file-"))
    return "+";
  if (itemId.startsWith("mcp-resource-"))
    return "\u25C7";
  if (itemId.startsWith("agent-"))
    return "*";
  return "+";
}
function isUnifiedSuggestion(itemId) {
  return itemId.startsWith("file-") || itemId.startsWith("mcp-resource-") || itemId.startsWith("agent-");
}
function PromptInputFooterSuggestions({
  suggestions,
  selectedSuggestion,
  maxColumnWidth: maxColumnWidthProp,
  overlay
}) {
  const { rows } = useTerminalSize();
  const maxVisibleItems = overlay ? OVERLAY_MAX_ITEMS : Math.min(6, Math.max(1, rows - 3));
  if (suggestions.length === 0) {
    return null;
  }
  const maxColumnWidth = maxColumnWidthProp ?? Math.max(...suggestions.map((item) => stringWidth(item.displayText))) + 5;
  const startIndex = Math.max(0, Math.min(selectedSuggestion - Math.floor(maxVisibleItems / 2), suggestions.length - maxVisibleItems));
  const endIndex = Math.min(startIndex + maxVisibleItems, suggestions.length);
  const visibleItems = suggestions.slice(startIndex, endIndex);
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
    flexDirection: "column",
    justifyContent: overlay ? undefined : "flex-end",
    children: visibleItems.map((item) => /* @__PURE__ */ jsx_runtime.jsx(SuggestionItemRow, {
      item,
      maxColumnWidth,
      isSelected: item.id === suggestions[selectedSuggestion]?.id
    }, item.id))
  });
}
var import_react, jsx_runtime, OVERLAY_MAX_ITEMS = 5, SuggestionItemRow, PromptInputFooterSuggestions_default;
var init_PromptInputFooterSuggestions = __esm(() => {
  init_useTerminalSize();
  init_src();
  init_format();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  SuggestionItemRow = import_react.memo(function SuggestionItemRow2({
    item,
    maxColumnWidth,
    isSelected
  }) {
    const columns = useTerminalSize().columns;
    const isUnified = isUnifiedSuggestion(item.id);
    if (isUnified) {
      const icon = getIcon(item.id);
      const textColor2 = isSelected ? "suggestion" : undefined;
      const dimColor = !isSelected;
      const isFile = item.id.startsWith("file-");
      const isMcpResource = item.id.startsWith("mcp-resource-");
      const iconWidth = 2;
      const paddingWidth = 4;
      const separatorWidth = item.description ? 3 : 0;
      let displayText2;
      if (isFile) {
        const descReserve = item.description ? Math.min(20, stringWidth(item.description)) : 0;
        const maxPathLength = columns - iconWidth - paddingWidth - separatorWidth - descReserve;
        displayText2 = truncatePathMiddle(item.displayText, maxPathLength);
      } else if (isMcpResource) {
        const maxDisplayTextLength = 30;
        displayText2 = truncateToWidth(item.displayText, maxDisplayTextLength);
      } else {
        displayText2 = item.displayText;
      }
      const availableWidth = columns - iconWidth - stringWidth(displayText2) - separatorWidth - paddingWidth;
      let lineContent;
      if (item.description) {
        const maxDescLength = Math.max(0, availableWidth);
        const truncatedDesc = truncateToWidth(item.description.replace(/\s+/g, " "), maxDescLength);
        lineContent = `${icon} ${displayText2} \u2013 ${truncatedDesc}`;
      } else {
        lineContent = `${icon} ${displayText2}`;
      }
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        color: textColor2,
        dimColor,
        wrap: "truncate",
        children: lineContent
      });
    }
    const maxNameWidth = Math.floor(columns * 0.4);
    const displayTextWidth = Math.min(maxColumnWidth ?? stringWidth(item.displayText) + 5, maxNameWidth);
    const textColor = item.color || (isSelected ? "suggestion" : undefined);
    const shouldDim = !isSelected;
    let displayText = item.displayText;
    if (stringWidth(displayText) > displayTextWidth - 2) {
      displayText = truncateToWidth(displayText, displayTextWidth - 2);
    }
    const paddedDisplayText = displayText + " ".repeat(Math.max(0, displayTextWidth - stringWidth(displayText)));
    const tagText = item.tag ? `[${item.tag}] ` : "";
    const tagWidth = stringWidth(tagText);
    const descriptionWidth = Math.max(0, columns - displayTextWidth - tagWidth - 4);
    const truncatedDescription = item.description ? truncateToWidth(item.description.replace(/\s+/g, " "), descriptionWidth) : "";
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
      wrap: "truncate",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color: textColor,
          dimColor: shouldDim,
          children: paddedDisplayText
        }),
        tagText ? /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color: item.tag === "local" ? "ansi:yellow" : undefined,
          dimColor: item.tag !== "local",
          children: tagText
        }) : null,
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color: isSelected ? "suggestion" : undefined,
          dimColor: !isSelected,
          children: truncatedDescription
        })
      ]
    });
  });
  PromptInputFooterSuggestions_default = import_react.memo(PromptInputFooterSuggestions);
});

export { PromptInputFooterSuggestions, PromptInputFooterSuggestions_default, init_PromptInputFooterSuggestions };

//# debugId=F05F6FD3992958F864756E2164756E21
//# sourceMappingURL=chunk-b07cwfkd.js.map
