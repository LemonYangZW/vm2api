// @bun
import {
  extractTextContent,
  init_claude,
  init_messages1 as init_messages,
  init_systemPromptType,
  queryHaiku
} from "./chunk-drtrgzzb.js";
import {
  asSystemPrompt
} from "./chunk-hy7vb8en.js";
import {
  init_json,
  safeParseJSON
} from "./chunk-73g8bk52.js";
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import {
  init_v4
} from "./chunk-6mdh70q0.js";
import {
  exports_external
} from "./chunk-ch92ycde.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import {
  getIsNonInteractiveSession,
  init_state
} from "./chunk-v4e7ch76.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/sessionTitle.ts
function extractConversationText(messages) {
  const parts = [];
  for (const msg of messages) {
    if (msg.type !== "user" && msg.type !== "assistant")
      continue;
    if ("isMeta" in msg && msg.isMeta)
      continue;
    if ("origin" in msg && msg.origin && msg.origin.kind !== "human")
      continue;
    const content = msg.message.content;
    if (typeof content === "string") {
      parts.push(content);
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if ("type" in block && block.type === "text" && "text" in block) {
          parts.push(block.text);
        }
      }
    }
  }
  const text = parts.join(`
`);
  return text.length > MAX_CONVERSATION_TEXT ? text.slice(-MAX_CONVERSATION_TEXT) : text;
}
async function generateSessionTitle(description, signal) {
  const trimmed = description.trim();
  if (!trimmed)
    return null;
  try {
    const result = await queryHaiku({
      systemPrompt: asSystemPrompt([SESSION_TITLE_PROMPT]),
      userPrompt: trimmed,
      outputFormat: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            title: { type: "string" }
          },
          required: ["title"],
          additionalProperties: false
        }
      },
      signal,
      options: {
        querySource: "generate_session_title",
        agents: [],
        isNonInteractiveSession: getIsNonInteractiveSession(),
        hasAppendSystemPrompt: false,
        mcpTools: []
      }
    });
    const text = extractTextContent(result.message.content);
    const parsed = titleSchema().safeParse(safeParseJSON(text));
    const title = parsed.success ? parsed.data.title.trim() || null : null;
    logEvent("tengu_session_title_generated", { success: title !== null });
    return title;
  } catch (error) {
    logForDebugging(`generateSessionTitle failed: ${error}`, {
      level: "error"
    });
    logEvent("tengu_session_title_generated", { success: false });
    return null;
  }
}
var MAX_CONVERSATION_TEXT = 1000, SESSION_TITLE_PROMPT = `Generate a concise, sentence-case title (3-7 words) that captures the main topic or goal of this coding session. The title should be clear enough that the user recognizes the session in a list. Use sentence case: capitalize only the first word and proper nouns.

Return JSON with a single "title" field.

Good examples:
{"title": "Fix login button on mobile"}
{"title": "Add OAuth authentication"}
{"title": "Debug failing CI tests"}
{"title": "Refactor API client error handling"}

Bad (too vague): {"title": "Code changes"}
Bad (too long): {"title": "Investigate and fix the issue where the login button does not respond on mobile devices"}
Bad (wrong case): {"title": "Fix Login Button On Mobile"}`, titleSchema;
var init_sessionTitle = __esm(() => {
  init_v4();
  init_state();
  init_analytics();
  init_claude();
  init_debug();
  init_json();
  init_lazySchema();
  init_messages();
  init_systemPromptType();
  titleSchema = lazySchema(() => exports_external.object({ title: exports_external.string() }));
});

export { extractConversationText, generateSessionTitle, init_sessionTitle };

//# debugId=73B142A360495A1064756E2164756E21
//# sourceMappingURL=chunk-n8pfvcaz.js.map
