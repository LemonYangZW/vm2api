// @bun
import {
  computeNextCronRun,
  init_cron,
  parseCronExpression
} from "./chunk-q4dg9ftz.js";
import {
  AGENT_TOOL_NAME,
  TASK_OUTPUT_TOOL_NAME,
  TASK_STOP_TOOL_NAME,
  getFeatureValue_CACHED_MAY_BE_STALE,
  getFeatureValue_CACHED_WITH_REFRESH,
  getMainLoopModel,
  init_constants1 as init_constants,
  init_constants2,
  init_growthbook,
  init_model,
  init_prompt
} from "./chunk-ghhmj79c.js";
import {
  init_json,
  safeParseJSON
} from "./chunk-73g8bk52.js";
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import {
  getPlatform,
  init_platform
} from "./chunk-psygyacq.js";
import {
  require_ajv
} from "./chunk-hjmatcgt.js";
import {
  init_v4
} from "./chunk-6mdh70q0.js";
import {
  exports_external
} from "./chunk-ch92ycde.js";
import {
  TICK_TAG,
  init_log,
  init_xml,
  logError
} from "./chunk-mhjmeh6r.js";
import {
  TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  getFsImplementation,
  init_debug,
  init_errors,
  init_fsOperations,
  init_slowOperations,
  isFsInaccessible,
  jsonStringify,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import {
  addSessionCronTask,
  getProjectRoot,
  getSessionCronTasks,
  init_state,
  removeSessionCronTasks
} from "./chunk-v4e7ch76.js";
import {
  init_envUtils,
  isEnvDefinedFalsy,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  __esm,
  __export,
  __toESM
} from "./chunk-hhsxm2yr.js";

// packages/builtin-tools/src/tools/ExitPlanModeTool/constants.ts
var EXIT_PLAN_MODE_TOOL_NAME = "ExitPlanMode", EXIT_PLAN_MODE_V2_TOOL_NAME = "ExitPlanMode";
var init_constants3 = () => {};

// packages/builtin-tools/src/tools/EnterPlanModeTool/constants.ts
var ENTER_PLAN_MODE_TOOL_NAME = "EnterPlanMode";
var init_constants4 = () => {};

// packages/builtin-tools/src/tools/AskUserQuestionTool/prompt.ts
var ASK_USER_QUESTION_TOOL_NAME = "AskUserQuestion", ASK_USER_QUESTION_TOOL_CHIP_WIDTH = 12, DESCRIPTION = "Asks the user multiple choice questions to gather information, clarify ambiguity, understand preferences, make decisions or offer them choices.", PREVIEW_FEATURE_PROMPT, ASK_USER_QUESTION_TOOL_PROMPT;
var init_prompt2 = __esm(() => {
  init_constants3();
  PREVIEW_FEATURE_PROMPT = {
    markdown: `
Preview feature:
Use the optional \`preview\` field on options when presenting concrete artifacts that users need to visually compare:
- ASCII mockups of UI layouts or components
- Code snippets showing different implementations
- Diagram variations
- Configuration examples

Preview content is rendered as markdown in a monospace box. Multi-line text with newlines is supported. When any option has a preview, the UI switches to a side-by-side layout with a vertical option list on the left and preview on the right. Do not use previews for simple preference questions where labels and descriptions suffice. Note: previews are only supported for single-select questions (not multiSelect).
`,
    html: `
Preview feature:
Use the optional \`preview\` field on options when presenting concrete artifacts that users need to visually compare:
- HTML mockups of UI layouts or components
- Formatted code snippets showing different implementations
- Visual comparisons or diagrams

Preview content must be a self-contained HTML fragment (no <html>/<body> wrapper, no <script> or <style> tags \u2014 use inline style attributes instead). Do not use previews for simple preference questions where labels and descriptions suffice. Note: previews are only supported for single-select questions (not multiSelect).
`
  };
  ASK_USER_QUESTION_TOOL_PROMPT = `Use this tool when you need to ask the user questions during execution. This allows you to:
1. Gather user preferences or requirements
2. Clarify ambiguous instructions
3. Get decisions on implementation choices as you work
4. Offer choices to the user about what direction to take.

Usage notes:
- Users will always be able to select "Other" to provide custom text input
- Use multiSelect: true to allow multiple answers to be selected for a question
- If you recommend a specific option, make that the first option in the list and add "(Recommended)" at the end of the label

Plan mode note: In plan mode, use this tool to clarify requirements or choose between approaches BEFORE finalizing your plan. Do NOT use this tool to ask "Is my plan ready?" or "Should I proceed?" - use ${EXIT_PLAN_MODE_TOOL_NAME} for plan approval. IMPORTANT: Do not reference "the plan" in your questions (e.g., "Do you have feedback about the plan?", "Does the plan look good?") because the user cannot see the plan in the UI until you call ${EXIT_PLAN_MODE_TOOL_NAME}. If you need plan approval, use ${EXIT_PLAN_MODE_TOOL_NAME} instead.
`;
});

// src/utils/pdfUtils.ts
function parsePDFPageRange(pages) {
  const trimmed = pages.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.endsWith("-")) {
    const first2 = parseInt(trimmed.slice(0, -1), 10);
    if (isNaN(first2) || first2 < 1) {
      return null;
    }
    return { firstPage: first2, lastPage: Infinity };
  }
  const dashIndex = trimmed.indexOf("-");
  if (dashIndex === -1) {
    const page = parseInt(trimmed, 10);
    if (isNaN(page) || page < 1) {
      return null;
    }
    return { firstPage: page, lastPage: page };
  }
  const first = parseInt(trimmed.slice(0, dashIndex), 10);
  const last = parseInt(trimmed.slice(dashIndex + 1), 10);
  if (isNaN(first) || isNaN(last) || first < 1 || last < 1 || last < first) {
    return null;
  }
  return { firstPage: first, lastPage: last };
}
function isPDFSupported() {
  return !getMainLoopModel().toLowerCase().includes("claude-3-haiku");
}
function isPDFExtension(ext) {
  const normalized = ext.startsWith(".") ? ext.slice(1) : ext;
  return DOCUMENT_EXTENSIONS.has(normalized.toLowerCase());
}
var DOCUMENT_EXTENSIONS;
var init_pdfUtils = __esm(() => {
  init_model();
  DOCUMENT_EXTENSIONS = new Set(["pdf"]);
});

// packages/builtin-tools/src/tools/BashTool/toolName.ts
var BASH_TOOL_NAME = "Bash";
var init_toolName = () => {};

// packages/builtin-tools/src/tools/FileReadTool/prompt.ts
function renderPromptTemplate(lineFormat, maxSizeInstruction, offsetInstruction) {
  return `Reads a file from the local filesystem. You can access any file directly by using this tool.
Assume this tool is able to read all files on the machine. If the User provides a path to a file assume that path is valid. It is okay to read a file that does not exist; an error will be returned.

Usage:
- The file_path parameter must be an absolute path, not a relative path
- By default, it reads up to ${MAX_LINES_TO_READ} lines starting from the beginning of the file${maxSizeInstruction}
${offsetInstruction}
${lineFormat}
- This tool allows Claude Code to read images (eg PNG, JPG, etc). When reading an image file the contents are presented visually as Claude Code is a multimodal LLM.${isPDFSupported() ? `
- This tool can read PDF files (.pdf). For large PDFs (more than 10 pages), you MUST provide the pages parameter to read specific page ranges (e.g., pages: "1-5"). Reading a large PDF without the pages parameter will fail. Maximum 20 pages per request.` : ""}
- This tool can read Jupyter notebooks (.ipynb files) and returns all cells with their outputs, combining code, text, and visualizations.
- This tool can only read files, not directories. To read a directory, use an ls command via the ${BASH_TOOL_NAME} tool.
- You will regularly be asked to read screenshots. If the user provides a path to a screenshot, ALWAYS use this tool to view the file at the path. This tool will work with all temporary file paths.
- If you read a file that exists but has empty contents you will receive a system reminder warning in place of file contents.`;
}
var FILE_READ_TOOL_NAME = "Read", FILE_UNCHANGED_STUB = "File unchanged since last read. The content from the earlier Read tool_result in this conversation is still current \u2014 refer to that instead of re-reading.", MAX_LINES_TO_READ = 2000, DESCRIPTION2 = "Read a file from the local filesystem.", LINE_FORMAT_INSTRUCTION = "- Results are returned using cat -n format, with line numbers starting at 1", OFFSET_INSTRUCTION_DEFAULT = "- You can optionally specify a line offset and limit (especially handy for long files), but it's recommended to read the whole file by not providing these parameters", OFFSET_INSTRUCTION_TARGETED = "- When you already know which part of the file you need, only read that part. This can be important for larger files.";
var init_prompt3 = __esm(() => {
  init_pdfUtils();
  init_toolName();
});

// src/constants/common.ts
function getLocalISODate() {
  if (process.env.CLAUDE_CODE_OVERRIDE_DATE) {
    return process.env.CLAUDE_CODE_OVERRIDE_DATE;
  }
  const now = new Date;
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getLocalMonthYear() {
  const date = process.env.CLAUDE_CODE_OVERRIDE_DATE ? new Date(process.env.CLAUDE_CODE_OVERRIDE_DATE) : new Date;
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}
var getSessionStartDate;
var init_common = __esm(() => {
  init_memoize();
  getSessionStartDate = memoize_default(getLocalISODate);
});

// packages/builtin-tools/src/tools/WebSearchTool/prompt.ts
function getWebSearchPrompt() {
  const currentMonthYear = getLocalMonthYear();
  return `
- Allows Claude to search the web and use the results to inform responses
- Provides up-to-date information for current events and recent data
- Returns search result information formatted as search result blocks, including links as markdown hyperlinks
- Use this tool for accessing information beyond Claude's knowledge cutoff
- Searches are performed automatically within a single API call

CRITICAL REQUIREMENT - You MUST follow this:
  - After answering the user's question, you MUST include a "Sources:" section at the end of your response
  - In the Sources section, list all relevant URLs from the search results as markdown hyperlinks: [Title](URL)
  - This is MANDATORY - never skip including sources in your response
  - Example format:

    [Your answer here]

    Sources:
    - [Source Title 1](https://example.com/1)
    - [Source Title 2](https://example.com/2)

Usage notes:
  - Domain filtering is supported to include or block specific websites
  - Web search is only available in the US

IMPORTANT - Use the correct year in search queries:
  - The current month is ${currentMonthYear}. You MUST use this year when searching for recent information, documentation, or current events.
  - Example: If the user asks for "latest React docs", search for "React documentation" with the current year, NOT last year
`;
}
var WEB_SEARCH_TOOL_NAME = "WebSearch";
var init_prompt4 = __esm(() => {
  init_common();
});

// packages/builtin-tools/src/tools/TodoWriteTool/constants.ts
var TODO_WRITE_TOOL_NAME = "TodoWrite";
var init_constants5 = () => {};

// packages/builtin-tools/src/tools/GrepTool/prompt.ts
function getDescription() {
  return `A powerful search tool built on ripgrep

  Usage:
  - ALWAYS use ${GREP_TOOL_NAME} for search tasks. NEVER invoke \`grep\` or \`rg\` as a ${BASH_TOOL_NAME} command. The ${GREP_TOOL_NAME} tool has been optimized for correct permissions and access.
  - Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+")
  - Filter files with glob parameter (e.g., "*.js", "**/*.tsx") or type parameter (e.g., "js", "py", "rust")
  - Output modes: "content" shows matching lines, "files_with_matches" shows only file paths (default), "count" shows match counts
  - Use ${AGENT_TOOL_NAME} tool for open-ended searches requiring multiple rounds
  - Pattern syntax: Uses ripgrep (not grep) - literal braces need escaping (use \`interface\\{\\}\` to find \`interface{}\` in Go code)
  - Multiline matching: By default patterns match within single lines only. For cross-line patterns like \`struct \\{[\\s\\S]*?field\`, use \`multiline: true\`
`;
}
var GREP_TOOL_NAME = "Grep";
var init_prompt5 = __esm(() => {
  init_constants();
  init_toolName();
});

// packages/builtin-tools/src/tools/WebFetchTool/prompt.ts
function makeSecondaryModelPrompt(markdownContent, prompt, isPreapprovedDomain) {
  const guidelines = isPreapprovedDomain ? `Provide a concise response based on the content above. Include relevant details, code examples, and documentation excerpts as needed.` : `Provide a concise response based only on the content above. In your response:
 - Enforce a strict 125-character maximum for quotes from any source document. Open Source Software is ok as long as we respect the license.
 - Use quotation marks for exact language from articles; any language outside of the quotation should never be word-for-word the same.
 - You are not a lawyer and never comment on the legality of your own prompts and responses.
 - Never produce or reproduce exact song lyrics.`;
  return `
Web page content:
---
${markdownContent}
---

${prompt}

${guidelines}
`;
}
var WEB_FETCH_TOOL_NAME = "WebFetch", DESCRIPTION3 = `
- Fetches content from a specified URL and processes it using an AI model
- Takes a URL and a prompt as input
- Fetches the URL content, converts HTML to markdown
- Processes the content with the prompt using a small, fast model
- Returns the model's response about the content
- Use this tool when you need to retrieve and analyze web content

Usage notes:
  - IMPORTANT: If an MCP-provided web fetch tool is available, prefer using that tool instead of this one, as it may have fewer restrictions.
  - The URL must be a fully-formed valid URL
  - HTTP URLs will be automatically upgraded to HTTPS
  - The prompt should describe what information you want to extract from the page
  - This tool is read-only and does not modify any files
  - Results may be summarized if the content is very large
  - Includes a self-cleaning 15-minute cache for faster responses when repeatedly accessing the same URL
  - When a URL redirects to a different host, the tool will inform you and provide the redirect URL in a special format. You should then make a new WebFetch request with the redirect URL to fetch the content.
  - For GitHub URLs, prefer using the gh CLI via Bash instead (e.g., gh pr view, gh issue view, gh api).
`;
var init_prompt6 = () => {};

// packages/builtin-tools/src/tools/GlobTool/prompt.ts
var GLOB_TOOL_NAME = "Glob", DESCRIPTION4 = `- Fast file pattern matching tool that works with any codebase size
- Supports glob patterns like "**/*.js" or "src/**/*.ts"
- Returns matching file paths sorted by modification time
- Use this tool when you need to find files by name patterns
- When you are doing an open ended search that may require multiple rounds of globbing and grepping, use the Agent tool instead`;
var init_prompt7 = () => {};

// packages/builtin-tools/src/tools/PowerShellTool/toolName.ts
var POWERSHELL_TOOL_NAME = "PowerShell";
var init_toolName2 = () => {};

// src/utils/shell/shellToolUtils.ts
function isPowerShellToolEnabled() {
  if (getPlatform() !== "windows")
    return false;
  return !isEnvDefinedFalsy(process.env.CLAUDE_CODE_USE_POWERSHELL_TOOL);
}
var SHELL_TOOL_NAMES;
var init_shellToolUtils = __esm(() => {
  init_toolName();
  init_toolName2();
  init_envUtils();
  init_platform();
  SHELL_TOOL_NAMES = [BASH_TOOL_NAME, POWERSHELL_TOOL_NAME];
});

// packages/builtin-tools/src/tools/FileEditTool/constants.ts
var FILE_EDIT_TOOL_NAME = "Edit", CLAUDE_FOLDER_PERMISSION_PATTERN = "/.claude/**", GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN = "~/.claude/**", FILE_UNEXPECTEDLY_MODIFIED_ERROR = "File has been unexpectedly modified. Read it again before attempting to write it.";
var init_constants6 = () => {};

// packages/builtin-tools/src/tools/FileWriteTool/prompt.ts
function getPreReadInstruction() {
  return `
- If this is an existing file, you MUST use the ${FILE_READ_TOOL_NAME} tool first to read the file's contents. This tool will fail if you did not read the file first.`;
}
function getWriteToolDescription() {
  return `Writes a file to the local filesystem.

Usage:
- This tool will overwrite the existing file if there is one at the provided path.${getPreReadInstruction()}
- Prefer the Edit tool for modifying existing files \u2014 it only sends the diff. Only use this tool to create new files or for complete rewrites.
- NEVER create documentation files (*.md) or README files unless explicitly requested by the User.
- Only use emojis if the user explicitly requests it. Avoid writing emojis to files unless asked.
- The file_path must be a distinct file path, not a directory path. If the path resolves to an existing directory, the tool will reject it with a clear error message. Use a path that includes a filename with an appropriate extension (e.g., \`my-docs/analysis/api/report.md\`).`;
}
var FILE_WRITE_TOOL_NAME = "Write";
var init_prompt8 = __esm(() => {
  init_prompt3();
});

// packages/builtin-tools/src/tools/NotebookEditTool/constants.ts
var NOTEBOOK_EDIT_TOOL_NAME = "NotebookEdit";
var init_constants7 = () => {};

// packages/builtin-tools/src/tools/SkillTool/constants.ts
var SKILL_TOOL_NAME = "Skill";
var init_constants8 = () => {};

// packages/builtin-tools/src/tools/SendMessageTool/constants.ts
var SEND_MESSAGE_TOOL_NAME = "SendMessage";
var init_constants9 = () => {};

// packages/builtin-tools/src/tools/TaskCreateTool/constants.ts
var TASK_CREATE_TOOL_NAME = "TaskCreate";
var init_constants10 = () => {};

// packages/builtin-tools/src/tools/TaskGetTool/constants.ts
var TASK_GET_TOOL_NAME = "TaskGet";
var init_constants11 = () => {};

// packages/builtin-tools/src/tools/TaskListTool/constants.ts
var TASK_LIST_TOOL_NAME = "TaskList";
var init_constants12 = () => {};

// packages/builtin-tools/src/tools/TaskUpdateTool/constants.ts
var TASK_UPDATE_TOOL_NAME = "TaskUpdate";
var init_constants13 = () => {};

// packages/builtin-tools/src/tools/SearchExtraToolsTool/constants.ts
var SEARCH_EXTRA_TOOLS_TOOL_NAME = "SearchExtraTools";
var init_constants14 = () => {};

// src/Tool.ts
function filterToolProgressMessages(progressMessagesForMessage) {
  return progressMessagesForMessage.filter((msg) => msg.data != null && msg.data.type !== "hook_progress");
}
function toolMatchesName(tool, name) {
  return tool.name === name || (tool.aliases?.includes(name) ?? false);
}
function findToolByName(tools, name) {
  return tools.find((t) => toolMatchesName(t, name));
}
function buildTool(def) {
  return {
    ...TOOL_DEFAULTS,
    userFacingName: () => def.name,
    ...def
  };
}
var getEmptyToolPermissionContext = () => ({
  mode: "default",
  additionalWorkingDirectories: new Map,
  alwaysAllowRules: {},
  alwaysDenyRules: {},
  alwaysAskRules: {},
  isBypassPermissionsModeAvailable: true
}), TOOL_DEFAULTS;
var init_Tool = __esm(() => {
  TOOL_DEFAULTS = {
    isEnabled: () => true,
    isConcurrencySafe: (_input) => false,
    isReadOnly: (_input) => false,
    isDestructive: (_input) => false,
    checkPermissions: (input, _ctx) => Promise.resolve({ behavior: "allow", updatedInput: input }),
    toAutoClassifierInput: (_input) => "",
    userFacingName: (_input) => ""
  };
});

// packages/builtin-tools/src/tools/SyntheticOutputTool/SyntheticOutputTool.ts
function isSyntheticOutputToolEnabled(opts) {
  return opts.isNonInteractiveSession;
}
function createSyntheticOutputTool(jsonSchema) {
  const cached = toolCache.get(jsonSchema);
  if (cached)
    return cached;
  const result = buildSyntheticOutputTool(jsonSchema);
  toolCache.set(jsonSchema, result);
  return result;
}
function buildSyntheticOutputTool(jsonSchema) {
  try {
    const ajv = new import_ajv.Ajv({ allErrors: true });
    const isValidSchema = ajv.validateSchema(jsonSchema);
    if (!isValidSchema) {
      return { error: ajv.errorsText(ajv.errors) };
    }
    const validateSchema = ajv.compile(jsonSchema);
    return {
      tool: {
        ...SyntheticOutputTool,
        inputJSONSchema: jsonSchema,
        async call(input) {
          const isValid = validateSchema(input);
          if (!isValid) {
            const errors = validateSchema.errors?.map((e) => `${e.instancePath || "root"}: ${e.message}`).join(", ");
            throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(`Output does not match required schema: ${errors}`, `StructuredOutput schema mismatch: ${(errors ?? "").slice(0, 150)}`);
          }
          return {
            data: "Structured output provided successfully",
            structured_output: input
          };
        }
      }
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
var import_ajv, inputSchema, outputSchema, SYNTHETIC_OUTPUT_TOOL_NAME = "StructuredOutput", SyntheticOutputTool, toolCache;
var init_SyntheticOutputTool = __esm(() => {
  init_v4();
  init_Tool();
  init_errors();
  init_lazySchema();
  init_slowOperations();
  import_ajv = __toESM(require_ajv(), 1);
  inputSchema = lazySchema(() => exports_external.object({}).passthrough());
  outputSchema = lazySchema(() => exports_external.string().describe("Structured output tool result"));
  SyntheticOutputTool = buildTool({
    isMcp: false,
    isEnabled() {
      return true;
    },
    isConcurrencySafe() {
      return true;
    },
    isReadOnly() {
      return true;
    },
    isOpenWorld() {
      return false;
    },
    name: SYNTHETIC_OUTPUT_TOOL_NAME,
    searchHint: "return the final response as structured JSON",
    maxResultSizeChars: 1e5,
    async description() {
      return "Return structured output in the requested format";
    },
    async prompt() {
      return `Use this tool to return your final response in the requested structured format. You MUST call this tool exactly once at the end of your response to provide the structured output.`;
    },
    get inputSchema() {
      return inputSchema();
    },
    get outputSchema() {
      return outputSchema();
    },
    async call(input) {
      return {
        data: "Structured output provided successfully",
        structured_output: input
      };
    },
    async checkPermissions(input) {
      return {
        behavior: "allow",
        updatedInput: input
      };
    },
    renderToolUseMessage(input) {
      const keys = Object.keys(input);
      if (keys.length === 0)
        return null;
      if (keys.length <= 3) {
        return keys.map((k) => `${k}: ${jsonStringify(input[k])}`).join(", ");
      }
      return `${keys.length} fields: ${keys.slice(0, 3).join(", ")}\u2026`;
    },
    renderToolUseRejectedMessage() {
      return "Structured output rejected";
    },
    renderToolUseErrorMessage() {
      return "Structured output error";
    },
    renderToolUseProgressMessage() {
      return null;
    },
    renderToolResultMessage(output) {
      return output;
    },
    mapToolResultToToolResultBlockParam(content, toolUseID) {
      return {
        tool_use_id: toolUseID,
        type: "tool_result",
        content
      };
    }
  });
  toolCache = new WeakMap;
});

// packages/builtin-tools/src/tools/SleepTool/prompt.ts
var SLEEP_TOOL_NAME = "Sleep", DESCRIPTION5 = "Wait for a specified duration", SLEEP_TOOL_PROMPT;
var init_prompt9 = __esm(() => {
  init_xml();
  SLEEP_TOOL_PROMPT = `Wait for a specified duration. The user can interrupt the sleep at any time.

Use this when the user tells you to sleep or rest, when you have nothing to do, or when you're waiting for something.

You may receive <${TICK_TAG}> prompts \u2014 these are periodic check-ins. Look for useful work to do before sleeping.

You can call this concurrently with other tools \u2014 it won't interfere with them.

Prefer this over \`Bash(sleep ...)\` \u2014 it doesn't hold a shell process.

Each wake-up costs an API call, but the prompt cache expires after 5 minutes of inactivity \u2014 balance accordingly.`;
});

// packages/builtin-tools/src/tools/LSPTool/prompt.ts
var LSP_TOOL_NAME = "LSP", DESCRIPTION6 = `Interact with Language Server Protocol (LSP) servers to get code intelligence features.

Supported operations:
- goToDefinition: Find where a symbol is defined
- findReferences: Find all references to a symbol
- hover: Get hover information (documentation, type info) for a symbol
- documentSymbol: Get all symbols (functions, classes, variables) in a document
- workspaceSymbol: Search for symbols across the entire workspace
- goToImplementation: Find implementations of an interface or abstract method
- prepareCallHierarchy: Get call hierarchy item at a position (functions/methods)
- incomingCalls: Find all functions/methods that call the function at a position
- outgoingCalls: Find all functions/methods called by the function at a position

All operations require:
- filePath: The file to operate on
- line: The line number (1-based, as shown in editors)
- character: The character offset (1-based, as shown in editors)

Note: LSP servers must be configured for the file type. If no server is available, an error will be returned.`;
var init_prompt10 = () => {};

// packages/builtin-tools/src/tools/VerifyPlanExecutionTool/constants.ts
var exports_constants = {};
__export(exports_constants, {
  VERIFY_PLAN_EXECUTION_TOOL_NAME: () => VERIFY_PLAN_EXECUTION_TOOL_NAME
});
var VERIFY_PLAN_EXECUTION_TOOL_NAME = "VerifyPlanExecution";
var init_constants15 = () => {};

// packages/builtin-tools/src/tools/ExecuteTool/constants.ts
var EXECUTE_TOOL_NAME = "ExecuteExtraTool";
var init_constants16 = () => {};

// packages/builtin-tools/src/tools/EnterWorktreeTool/constants.ts
var ENTER_WORKTREE_TOOL_NAME = "EnterWorktree";
var init_constants17 = () => {};

// packages/builtin-tools/src/tools/ExitWorktreeTool/constants.ts
var EXIT_WORKTREE_TOOL_NAME = "ExitWorktree";
var init_constants18 = () => {};

// packages/workflow-engine/src/types.ts
var init_types = () => {};

// packages/workflow-engine/src/constants.ts
var WORKFLOW_TOOL_NAME = "Workflow", WORKFLOW_DIR_NAME = ".claude/workflows", WORKFLOW_RUNS_DIR = ".claude/workflow-runs", WORKFLOW_SCRIPT_EXTENSIONS, DEFAULT_MAX_CONCURRENCY = 3, MAX_CONCURRENCY_CAP = 16, MAX_TOTAL_AGENTS = 1000, MAX_ITEMS_PER_CALL = 4096;
var init_constants19 = __esm(() => {
  WORKFLOW_SCRIPT_EXTENSIONS = [".ts", ".js", ".mjs"];
});

// packages/workflow-engine/src/ports.ts
function createHostHandle(bundle) {
  return { [HOST_HANDLE]: bundle };
}
function isHostHandle(value) {
  return typeof value === "object" && value !== null && HOST_HANDLE in value;
}
function unwrapHostHandle(handle) {
  return handle[HOST_HANDLE];
}
var HOST_HANDLE;
var init_ports = __esm(() => {
  HOST_HANDLE = Symbol("workflow.hostHandle");
});

// packages/workflow-engine/src/agentAdapter.ts
class AgentAdapterRegistry {
  adapters = new Map;
  rules = [];
  defaultId = null;
  register(adapter) {
    this.adapters.set(adapter.id, adapter);
    return this;
  }
  default(adapterId) {
    this.defaultId = adapterId;
    return this;
  }
  route(rule) {
    this.rules.push(rule);
    return this;
  }
  has(id) {
    return this.adapters.has(id);
  }
  get(id) {
    return this.adapters.get(id);
  }
  resolve(params) {
    for (const rule of this.rules) {
      if (matchRule(rule, params)) {
        const hit = this.adapters.get(rule.adapter);
        if (hit)
          return hit;
      }
    }
    if (this.defaultId) {
      const fallback = this.adapters.get(this.defaultId);
      if (fallback)
        return fallback;
    }
    throw new AdapterNotFoundError(`No adapter matched (rules=${this.rules.length}, default=${this.defaultId ?? "none"})`);
  }
  async initializeAll() {
    for (const a of this.adapters.values()) {
      await a.initialize?.();
    }
  }
  async disposeAll() {
    for (const a of this.adapters.values()) {
      await a.dispose?.();
    }
  }
}
function matchRule(rule, params) {
  if (rule.kind === "agentType")
    return params.agentType === rule.agentType;
  if (rule.kind === "model") {
    return typeof params.model === "string" && params.model.startsWith(rule.pattern);
  }
  return rule.match(params);
}
var AdapterNotFoundError;
var init_agentAdapter = __esm(() => {
  AdapterNotFoundError = class AdapterNotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = "AdapterNotFoundError";
    }
  };
});

// packages/workflow-engine/src/engine/concurrency.ts
class Semaphore {
  available;
  waiters = [];
  constructor(permits) {
    this.available = Math.max(1, Math.floor(permits));
  }
  async acquire(signal) {
    if (signal?.aborted) {
      throw new Error("Semaphore.acquire aborted (signal already aborted)");
    }
    if (this.available > 0) {
      this.available -= 1;
      return () => this.release();
    }
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        const idx = this.waiters.indexOf(entry);
        if (idx >= 0)
          this.waiters.splice(idx, 1);
        reject(new Error("Semaphore.acquire aborted"));
      };
      const wake = () => {
        signal?.removeEventListener("abort", onAbort);
        resolve(() => this.release());
      };
      const entry = {
        wake,
        cleanup: () => signal?.removeEventListener("abort", onAbort)
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      this.waiters.push(entry);
    });
  }
  release() {
    const next = this.waiters.shift();
    if (next) {
      next.wake();
    } else {
      this.available += 1;
    }
  }
}
function maxConcurrency() {
  return DEFAULT_MAX_CONCURRENCY;
}
function clampMaxConcurrency(n) {
  if (n === undefined || Number.isNaN(n))
    return DEFAULT_MAX_CONCURRENCY;
  return Math.max(1, Math.min(Math.trunc(n), MAX_CONCURRENCY_CAP));
}
var init_concurrency = __esm(() => {
  init_constants19();
});

// packages/workflow-engine/src/engine/script.ts
function extractMeta(source) {
  const match = META_RE.exec(source);
  if (!match)
    return { meta: null, body: source };
  let i = match.index + match[0].length;
  while (i < source.length && /\s/.test(source[i]))
    i++;
  if (source[i] !== "{") {
    throw new ScriptError("meta must be an object literal `{ ... }`");
  }
  let depth = 0;
  const start = i;
  let inStr = null;
  for (;i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inStr)
        inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "{")
      depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  if (depth !== 0)
    throw new ScriptError("meta literal braces are not closed");
  const literal = source.slice(start, i);
  let metaObj;
  try {
    metaObj = new Function(`return (${literal})`)();
  } catch (e) {
    throw new ScriptError(`meta must be a plain literal (no variable/function calls/interpolation): ${e.message}`);
  }
  const meta = validateMeta(metaObj);
  const body = source.slice(0, match.index) + source.slice(i).replace(/^[ \t]*;[ \t]*\n/, `
`);
  return { meta, body };
}
function validateMeta(v) {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    throw new ScriptError("meta must be an object");
  }
  const o = v;
  if (typeof o.name !== "string" || typeof o.description !== "string") {
    throw new ScriptError("meta must include string name and description");
  }
  return o;
}
function sandboxDate() {
  const fn = function(...args) {
    if (args.length === 0)
      throw new NonDeterministicError("Date.now()/new Date()");
    return new Date(...args);
  };
  fn.now = () => {
    throw new NonDeterministicError("Date.now()");
  };
  fn.parse = Date.parse;
  fn.UTC = Date.UTC;
  return fn;
}
function sandboxMath() {
  return new Proxy(Math, {
    get(target, prop, receiver) {
      if (prop === "random") {
        return () => {
          throw new NonDeterministicError("Math.random()");
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}
function assertScriptBody(body) {
  if (/^\s*import\b/m.test(body)) {
    throw new ScriptError("workflow scripts are the body of new AsyncFunction (not ESM modules); import is not supported. " + "agent / parallel / pipeline / phase / log / workflow / args / budget are injected as parameters \u2014 use them directly.");
  }
  if (/\bimport\s*\(/m.test(body)) {
    throw new ScriptError("dynamic import(...) is forbidden in workflow scripts: it bypasses the Date/Math sandbox and breaks resume determinism. " + "The sandbox does not guarantee security (same trust level as the LLM), but explicit escapes are prohibited. Inject external dependencies via args.");
  }
  if (/^\s*export\b/m.test(body)) {
    throw new ScriptError("workflow scripts allow only one export const meta = {...} (already extracted by the engine). " + "Remove other export / export default statements; use top-level return for the result.");
  }
}
function parseScript(source) {
  const { meta, body } = extractMeta(source);
  assertScriptBody(body);
  let fn;
  try {
    fn = new AsyncFunction("agent", "parallel", "pipeline", "phase", "log", "workflow", "args", "budget", "Date", "Math", body);
  } catch (e) {
    throw new ScriptError(`Script syntax error: ${e.message}`);
  }
  const sandboxedDate = sandboxDate();
  const sandboxedMath = sandboxMath();
  return {
    meta,
    async execute(hooks, args, budget) {
      return fn(hooks.agent, hooks.parallel, hooks.pipeline, hooks.phase, hooks.log, hooks.workflow, args, budget, sandboxedDate, sandboxedMath);
    }
  };
}
var ScriptError, META_RE, NonDeterministicError, AsyncFunction;
var init_script = __esm(() => {
  ScriptError = class ScriptError extends Error {
    constructor(message) {
      super(message);
      this.name = "ScriptError";
    }
  };
  META_RE = /export\s+const\s+meta\s*=\s*/;
  NonDeterministicError = class NonDeterministicError extends Error {
    constructor(fn) {
      super(`${fn} is not available in workflow scripts (would break resume determinism). Pass timestamps/random seeds via args.`);
      this.name = "NonDeterministicError";
    }
  };
  AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
});

// packages/workflow-engine/src/engine/journal.ts
import { createHash } from "crypto";
import { appendFile, mkdir, readFile, rm } from "fs/promises";
import { join } from "path";
function canonicalParams(params) {
  const { label: _label, phase: _phase, ...rest } = params;
  const keys = Object.keys(rest).sort();
  const sorted = {};
  for (const k of keys)
    sorted[k] = rest[k];
  return JSON.stringify(sorted);
}
function agentCallKey(prompt, params) {
  return createHash("sha256").update(prompt + `
` + canonicalParams(params)).digest("hex");
}
function createFileJournalStore(runsDir) {
  const pathOf = (runId) => join(runsDir, runId, "journal.jsonl");
  return {
    async read(runId) {
      try {
        const raw = await readFile(pathOf(runId), "utf-8");
        const entries = raw.split(`
`).filter((line) => line.trim().length > 0).map((line) => JSON.parse(line));
        return entries.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
      } catch {
        return [];
      }
    },
    async append(runId, entry) {
      await mkdir(join(runsDir, runId), { recursive: true });
      await appendFile(pathOf(runId), JSON.stringify(entry) + `
`, "utf-8");
    },
    async truncate(runId) {
      await rm(join(runsDir, runId), { recursive: true, force: true });
    }
  };
}
var init_journal = () => {};

// packages/workflow-engine/src/engine/budget.ts
class Budget {
  total;
  spentTokens = 0;
  constructor(total) {
    this.total = total;
  }
  spent() {
    return this.spentTokens;
  }
  remaining() {
    return this.total == null ? Infinity : Math.max(0, this.total - this.spentTokens);
  }
  addOutputTokens(n) {
    if (n > 0)
      this.spentTokens += n;
  }
  assertCanSpend() {
    if (this.total != null && this.spentTokens >= this.total) {
      throw new BudgetExhaustedError;
    }
  }
}
var BudgetExhaustedError;
var init_budget = __esm(() => {
  BudgetExhaustedError = class BudgetExhaustedError extends Error {
    constructor() {
      super("workflow token budget exhausted (budget.total reached the cap)");
      this.name = "BudgetExhaustedError";
    }
  };
});

// packages/workflow-engine/src/engine/structuredOutput.ts
function getValidator(schema) {
  const cached = cache.get(schema);
  if (cached)
    return cached;
  const ajv = new import_ajv2.Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (validate.$async) {
    throw new Error("Async JSON schemas are not supported");
  }
  cache.set(schema, validate);
  return validate;
}
function assertValidJsonSchema(schema) {
  getValidator(schema);
}
function validateAgainstSchema(value, schema) {
  const validate = getValidator(schema);
  const valid = validate(value);
  return {
    valid,
    errors: valid ? [] : (validate.errors ?? []).map((e) => {
      const message = e.message ?? "validation error";
      return e.instancePath ? `${e.instancePath} ${message}` : message;
    })
  };
}
var import_ajv2, cache;
var init_structuredOutput = __esm(() => {
  import_ajv2 = __toESM(require_ajv(), 1);
  cache = new WeakMap;
});

// packages/workflow-engine/src/engine/paths.ts
import { resolve, sep } from "path";
function containsPath(base, target) {
  const resolvedBase = resolve(base);
  const resolvedTarget = resolve(resolvedBase, target);
  if (resolvedTarget === resolvedBase)
    return true;
  return resolvedTarget.startsWith(resolvedBase + sep);
}
function sanitizeWorkflowName(name) {
  if (typeof name !== "string" || name.length === 0)
    return null;
  if (name.includes("/") || name.includes("\\"))
    return null;
  if (name.includes("\x00"))
    return null;
  if (name === "." || name === "..")
    return null;
  return name;
}
var init_paths = () => {};

// packages/workflow-engine/src/engine/namedWorkflows.ts
import { readFile as readFile2, readdir } from "fs/promises";
import { parse, resolve as resolve2 } from "path";
function isScriptExt(ext) {
  return WORKFLOW_SCRIPT_EXTENSIONS.includes(ext.toLowerCase());
}
async function resolveNamedWorkflow(workflowDir, name) {
  for (const ext of WORKFLOW_SCRIPT_EXTENSIONS) {
    const p = resolve2(workflowDir, name + ext);
    if (!containsPath(workflowDir, p))
      return null;
    try {
      return { path: p, content: await readFile2(p, "utf-8") };
    } catch {}
  }
  return null;
}
async function listNamedWorkflows(workflowDir) {
  let files;
  try {
    files = await readdir(workflowDir);
  } catch {
    return [];
  }
  return files.filter((f) => isScriptExt(parse(f).ext)).map((f) => parse(f).name).sort();
}
var init_namedWorkflows = __esm(() => {
  init_constants19();
  init_paths();
});

// packages/workflow-engine/src/engine/errors.ts
var WorkflowError, WorkflowAbortedError;
var init_errors2 = __esm(() => {
  WorkflowError = class WorkflowError extends Error {
    constructor(message) {
      super(message);
      this.name = "WorkflowError";
    }
  };
  WorkflowAbortedError = class WorkflowAbortedError extends Error {
    constructor() {
      super("workflow has been aborted");
      this.name = "WorkflowAbortedError";
    }
  };
});

// packages/workflow-engine/src/engine/context.ts
function createSharedResources(budgetTotal, maxConcurrency2) {
  return {
    semaphore: new Semaphore(clampMaxConcurrency(maxConcurrency2)),
    budget: new Budget(budgetTotal),
    agentCountBox: { value: 0 },
    agentIdSeq: { value: 0 },
    depth: 0
  };
}
function createEngineContext(opts) {
  const resources = createSharedResources(opts.budgetTotal, opts.maxConcurrency);
  return {
    ports: opts.ports,
    host: opts.host,
    signal: opts.signal,
    runId: opts.runId,
    workflowName: opts.workflowName,
    cwd: opts.cwd,
    resources,
    journal: opts.journal ? [...opts.journal] : [],
    journalIndex: 0,
    journalInvalidated: false,
    currentPhase: null
  };
}
var init_context = __esm(() => {
  init_budget();
  init_concurrency();
});

// packages/workflow-engine/src/engine/hooks.ts
function makeHooks(ctx, runSubWorkflow) {
  const emit = (init) => {
    ctx.ports.progressEmitter.emit({
      runId: ctx.runId,
      ...init
    });
  };
  const agent = async (prompt, opts = {}) => {
    const r = ctx.resources;
    if (r.agentCountBox.value >= MAX_TOTAL_AGENTS) {
      throw new WorkflowError(`workflow exceeds total agent cap (${MAX_TOTAL_AGENTS})`);
    }
    const agentId = r.agentIdSeq.value++;
    const params = { prompt, ...opts };
    if (params.schema)
      assertValidJsonSchema(params.schema);
    const key = agentCallKey(prompt, params);
    const label = opts.label;
    const phase2 = opts.phase ?? ctx.currentPhase ?? undefined;
    const invalidateJournal = async () => {
      ctx.journalInvalidated = true;
      ctx.journal = ctx.journal.slice(0, ctx.journalIndex);
      await ctx.ports.journalStore.truncate(ctx.runId);
    };
    if (!ctx.journalInvalidated && ctx.journalIndex < ctx.journal.length) {
      const entry = ctx.journal[ctx.journalIndex];
      if (entry.key === key) {
        const cachedResult = validateStructuredResult(entry.result, params.schema);
        if (entry.result.kind === "ok" && cachedResult.kind === "dead") {
          ctx.ports.logger.warn?.(`cached agent result for "${label ?? `#${agentId}`}" does not match its structured output schema; rerunning`);
          await invalidateJournal();
        } else {
          ctx.journalIndex++;
          emit({
            type: "agent_done",
            agentId,
            label,
            phase: phase2,
            result: entry.result
          });
          return resultToOutput(entry.result);
        }
      } else {
        await invalidateJournal();
      }
    }
    let release;
    try {
      release = await ctx.resources.semaphore.acquire(ctx.signal);
    } catch {
      throw new WorkflowAbortedError;
    }
    try {
      if (ctx.signal.aborted)
        throw new WorkflowAbortedError;
      r.budget.assertCanSpend();
      const pending = ctx.ports.taskRegistrar.pendingAction(ctx.runId);
      if (pending?.kind === "skip") {
        const result2 = { kind: "skipped" };
        emit({ type: "agent_done", agentId, label, phase: phase2, result: result2 });
        return null;
      }
      ctx.resources.agentCountBox.value++;
      emit({ type: "agent_started", agentId, label, phase: phase2 });
      const registry = ctx.ports.agentAdapterRegistry;
      const onProgress = (update) => {
        emit({ type: "agent_progress", agentId, label, phase: phase2, ...update });
      };
      const adapterCtx = registry ? {
        host: ctx.host,
        signal: ctx.signal,
        runId: ctx.runId,
        agentId,
        onProgress,
        ...ctx.ports.taskRegistrar.registerAgentAbort ? {
          registerAgentAbort: (id, ac) => {
            ctx.ports.taskRegistrar.registerAgentAbort?.(ctx.runId, id, ac);
          }
        } : {},
        ...ctx.ports.taskRegistrar.unregisterAgentAbort ? {
          unregisterAgentAbort: (id) => {
            ctx.ports.taskRegistrar.unregisterAgentAbort?.(ctx.runId, id);
          }
        } : {}
      } : null;
      const adapter = registry ? registry.resolve(params) : null;
      const invokeBackend = async () => {
        const rawResult = adapter ? adapter.run(params, adapterCtx) : ctx.ports.agentRunner.runAgentToResult(params, ctx.host);
        return validateStructuredResult(await rawResult, params.schema);
      };
      const attemptBackend = async () => {
        try {
          return { kind: "result", value: await invokeBackend() };
        } catch (error) {
          if (error instanceof WorkflowAbortedError)
            throw error;
          return { kind: "error", error };
        }
      };
      const first = await attemptBackend();
      let result;
      if (first.kind === "result" && first.value.kind !== "dead") {
        result = first.value;
      } else {
        if (first.kind === "error") {
          const errorMessage = first.error instanceof Error ? first.error.message : String(first.error);
          ctx.ports.logger.warn?.(`agent "${label ?? `#${agentId}`}" threw (${errorMessage}); retrying once`);
        } else if (first.value.kind === "dead") {
          const detail = typeof first.value.detail === "string" ? first.value.detail : "";
          ctx.ports.logger.warn?.(`agent "${label ?? `#${agentId}`}" returned dead` + (first.value.reason ? ` (${first.value.reason})` : "") + (detail ? `: ${detail.slice(0, 150)}` : "") + "; retrying once");
        }
        const retry = await attemptBackend();
        result = retry.kind === "result" ? retry.value : {
          kind: "dead",
          reason: "runagent-threw",
          detail: retry.error instanceof Error ? retry.error.message : String(retry.error)
        };
      }
      if (result.kind === "ok") {
        ctx.resources.budget.addOutputTokens(result.usage.outputTokens);
      }
      emit({ type: "agent_done", agentId, label, phase: phase2, result });
      const entry = { key, seq: agentId, result };
      ctx.journal.push(entry);
      ctx.journalIndex++;
      await ctx.ports.journalStore.append(ctx.runId, entry);
      return resultToOutput(result);
    } finally {
      release();
    }
  };
  const parallel = async (thunks) => {
    if (thunks.length > MAX_ITEMS_PER_CALL) {
      throw new WorkflowError(`parallel exceeds the per-call items cap (${MAX_ITEMS_PER_CALL})`);
    }
    return Promise.all(thunks.map(async (t, i) => {
      try {
        return await t();
      } catch (e) {
        if (e instanceof WorkflowAbortedError)
          throw e;
        ctx.ports.logger.warn?.(`parallel thunk #${i} failed: ${e.message}`);
        return null;
      }
    }));
  };
  const pipeline = async (items, ...stages) => {
    if (items.length > MAX_ITEMS_PER_CALL) {
      throw new WorkflowError(`pipeline exceeds the per-call items cap (${MAX_ITEMS_PER_CALL})`);
    }
    return Promise.all(items.map(async (item, index) => {
      try {
        let prev = item;
        for (const stage of stages) {
          prev = await stage(prev, item, index);
        }
        return prev;
      } catch (e) {
        if (e instanceof WorkflowAbortedError)
          throw e;
        ctx.ports.logger.warn?.(`pipeline item #${index} failed: ${e.message}`);
        return null;
      }
    }));
  };
  const phase = (title) => {
    if (ctx.currentPhase) {
      emit({ type: "phase_done", phase: ctx.currentPhase });
    }
    ctx.currentPhase = title;
    emit({ type: "phase_started", phase: title });
  };
  const log = (message) => {
    emit({ type: "log", message });
  };
  const workflow = async (nameOrRef, args) => {
    if (ctx.resources.depth >= 1) {
      throw new WorkflowError("workflow() nesting allows only one level");
    }
    const sub = typeof nameOrRef === "string" ? { name: nameOrRef } : { scriptPath: nameOrRef.scriptPath };
    return runSubWorkflow({ ...sub, args });
  };
  return { agent, parallel, pipeline, phase, log, workflow };
}
function resultToOutput(result) {
  return result.kind === "ok" ? result.output : null;
}
function validateStructuredResult(result, schema) {
  if (!schema || result.kind !== "ok")
    return result;
  const { valid, errors } = validateAgainstSchema(result.output, schema);
  if (valid)
    return result;
  return {
    kind: "dead",
    reason: "invalid-structured-output",
    detail: errors.length > 0 ? errors.join("; ") : "structured output does not match schema"
  };
}
var init_hooks = __esm(() => {
  init_constants19();
  init_errors2();
  init_journal();
  init_structuredOutput();
});

// packages/workflow-engine/src/engine/runWorkflow.ts
import { readFile as readFile3 } from "fs/promises";
import { join as join3 } from "path";
async function runWorkflow(opts) {
  const { ports } = opts;
  let parsed;
  try {
    parsed = parseScript(opts.script);
  } catch (e) {
    const error = e.message;
    ports.progressEmitter.emit({
      type: "run_done",
      runId: opts.runId,
      status: "failed",
      error
    });
    return { status: "failed", error };
  }
  const workflowName = opts.workflowName ?? parsed.meta?.name ?? "workflow";
  let journal = [];
  let journalInvalidated = false;
  if (opts.resume && !opts.scriptChanged) {
    journal = await ports.journalStore.read(opts.runId);
  } else if (opts.scriptChanged) {
    await ports.journalStore.truncate(opts.runId);
    journalInvalidated = true;
  }
  const ctx = createEngineContext({
    ports,
    host: opts.host,
    signal: opts.signal,
    runId: opts.runId,
    workflowName,
    cwd: opts.cwd,
    budgetTotal: opts.budgetTotal,
    maxConcurrency: opts.maxConcurrency,
    journal
  });
  if (journalInvalidated)
    ctx.journalInvalidated = true;
  ports.progressEmitter.emit({
    type: "run_started",
    runId: opts.runId,
    workflowName,
    meta: parsed.meta
  });
  const runSubWorkflow = async (sub) => {
    const script = await resolveSubScript(sub, opts.cwd);
    let subParsed;
    try {
      subParsed = parseScript(script);
    } catch (e) {
      throw new WorkflowError(`Sub-workflow script error: ${e.message}`);
    }
    const prevDepth = ctx.resources.depth;
    ctx.resources.depth += 1;
    try {
      const subHooks = makeHooks(ctx, runSubWorkflow);
      return await subParsed.execute(subHooks, sub.args, ctx.resources.budget);
    } finally {
      ctx.resources.depth = prevDepth;
    }
  };
  const hooks = makeHooks(ctx, runSubWorkflow);
  const emitTerminalPhaseDone = () => {
    if (!ctx.currentPhase)
      return;
    ports.progressEmitter.emit({
      type: "phase_done",
      runId: opts.runId,
      phase: ctx.currentPhase
    });
  };
  let result;
  try {
    const returnValue = await parsed.execute(hooks, opts.args, ctx.resources.budget);
    result = { status: "completed", returnValue };
  } catch (e) {
    if (e instanceof WorkflowAbortedError) {
      result = { status: "killed" };
    } else {
      result = { status: "failed", error: e.message };
    }
  }
  emitTerminalPhaseDone();
  ports.progressEmitter.emit({
    type: "run_done",
    runId: opts.runId,
    ...result
  });
  return result;
}
async function resolveSubScript(sub, cwd) {
  if (sub.script)
    return sub.script;
  if (sub.scriptPath)
    return await readFile3(sub.scriptPath, "utf-8");
  if (sub.name) {
    const found = await resolveNamedWorkflow(join3(cwd, WORKFLOW_DIR_NAME), sub.name);
    if (!found)
      throw new WorkflowError(`Sub-workflow "${sub.name}" not found`);
    return found.content;
  }
  throw new WorkflowError("workflow() requires name or scriptPath");
}
var init_runWorkflow = __esm(() => {
  init_constants19();
  init_context();
  init_errors2();
  init_hooks();
  init_namedWorkflows();
  init_script();
});

// packages/workflow-engine/src/progress/events.ts
function createProgressEmitter(onEvent) {
  return { emit: onEvent };
}
function createBufferingEmitter() {
  const events = [];
  return { emitter: { emit: (e) => void events.push(e) }, events };
}
var init_events = () => {};

// packages/workflow-engine/src/tool/schema.ts
var workflowInputSchema;
var init_schema = __esm(() => {
  init_v4();
  workflowInputSchema = exports_external.object({
    script: exports_external.string().optional().describe("Self-contained workflow script source (inline)"),
    name: exports_external.string().optional().describe("Named workflow, resolved to .claude/workflows/<name>.ts|js|mjs"),
    scriptPath: exports_external.string().optional().describe("Absolute path to an existing script file"),
    args: exports_external.unknown().optional().describe("The args global variable passed through to the script. Pass a real JSON value (object/array/string), not a JSON string."),
    resumeFromRunId: exports_external.string().optional().describe("Resume the specified run, replaying the journal"),
    description: exports_external.string().optional().describe("A short description of this invocation (3-5 words)"),
    title: exports_external.string().optional().describe("Progress viewer title"),
    maxConcurrency: exports_external.number().int().min(1).max(16).optional().describe("Concurrency cap for agent(). Defaults to 3 (max 16). When the workflow contains heavy parallel/pipeline fan-out, you may confirm the desired concurrency with the user via AskUserQuestion before launching.")
  });
});

// packages/workflow-engine/src/tool/persistInline.ts
import { mkdir as mkdir2, writeFile } from "fs/promises";
import { join as join4 } from "path";
async function persistInlineScript(script, runId, cwd) {
  const dir = join4(cwd, WORKFLOW_RUNS_DIR, runId);
  await mkdir2(dir, { recursive: true });
  const filePath = join4(dir, "script.js");
  await writeFile(filePath, script, "utf-8");
  return filePath;
}
var init_persistInline = __esm(() => {
  init_constants19();
});

// packages/workflow-engine/src/tool/WorkflowTool.ts
import { readFile as readFile4 } from "fs/promises";
import { join as join5, resolve as resolve3 } from "path";
function createWorkflowTool(ports) {
  return {
    name: WORKFLOW_TOOL_NAME,
    inputSchema: workflowInputSchema,
    isEnabled: () => true,
    isReadOnly: () => false,
    async description() {
      return "Execute a workflow script that orchestrates multiple subagents to complete a task";
    },
    async prompt() {
      return WORKFLOW_TOOL_PROMPT;
    },
    renderToolUseMessage(input) {
      if (input.resumeFromRunId)
        return `Workflow resume: ${input.resumeFromRunId}`;
      const id = input.name ?? input.scriptPath ?? (input.script ? "inline" : "unknown");
      return `Workflow: ${id}`;
    },
    async call(input, context, canUseTool, parentMessage) {
      const host = ports.hostFactory({ context, canUseTool, parentMessage });
      let script;
      let workflowFile;
      try {
        const resolved = await resolveScriptSource(input, host.cwd);
        script = resolved.script;
        workflowFile = resolved.workflowFile;
      } catch (e) {
        return { data: { output: `Error: ${e.message}` } };
      }
      try {
        parseScript(script);
      } catch (e) {
        return {
          data: {
            output: `Error: script validation failed: ${e.message}`
          }
        };
      }
      const workflowName = input.name ?? input.title ?? "workflow";
      const { runId, signal } = ports.taskRegistrar.register({
        workflowName,
        ...workflowFile ? { workflowFile } : {},
        ...input.description ? { summary: input.description } : {},
        ...host.toolUseId ? { toolUseId: host.toolUseId } : {},
        ...input.resumeFromRunId ? { runId: input.resumeFromRunId } : {}
      }, host.handle);
      if (!workflowFile && input.script) {
        try {
          workflowFile = await persistInlineScript(input.script, runId, host.cwd);
        } catch (e) {
          ports.logger.warn?.(`inline script persist failed: ${e.message}`);
        }
      }
      runWorkflow({
        script,
        ...input.args !== undefined ? { args: normalizeArgs(input.args) } : {},
        runId,
        workflowName,
        ports,
        host: host.handle,
        signal,
        cwd: host.cwd,
        budgetTotal: host.budgetTotal,
        ...input.maxConcurrency !== undefined ? { maxConcurrency: input.maxConcurrency } : {},
        ...input.resumeFromRunId ? { resume: true } : {}
      }).then((result) => onFinish(ports, result, runId)).catch((e) => ports.taskRegistrar.fail(runId, e.message));
      const scriptPath = workflowFile ?? `<inline run ${runId}>`;
      return {
        data: {
          output: [
            "Workflow started (running in the background).",
            `run_id: ${runId}`,
            `workflow: ${workflowName}`,
            `script: ${scriptPath}`,
            "",
            "You will be notified on completion. Use /workflows to view live progress."
          ].join(`
`)
        }
      };
    },
    mapToolResultToToolResultBlockParam(data, toolUseId) {
      return {
        tool_use_id: toolUseId,
        type: "tool_result",
        content: [{ type: "text", text: data.output }]
      };
    }
  };
}
function onFinish(ports, result, runId) {
  if (result.status === "completed") {
    const summary = result.returnValue == null ? "(no return value)" : formatValue(result.returnValue);
    ports.taskRegistrar.complete(runId, summary);
  } else if (result.status === "failed") {
    ports.taskRegistrar.fail(runId, result.error ?? "workflow failed");
  } else {
    ports.taskRegistrar.kill(runId);
  }
}
function formatValue(v) {
  if (typeof v === "string")
    return v.slice(0, 500);
  try {
    return JSON.stringify(v).slice(0, 500);
  } catch {
    return String(v);
  }
}
function normalizeArgs(raw) {
  if (typeof raw !== "string")
    return raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null)
      return parsed;
    return raw;
  } catch {
    return raw;
  }
}
async function resolveScriptSource(input, cwd) {
  if (input.script)
    return { script: input.script };
  if (input.scriptPath) {
    const resolved = resolve3(cwd, input.scriptPath);
    if (!containsPath(cwd, resolved)) {
      throw new Error(`scriptPath "${input.scriptPath}" is out of bounds (after resolve, ${resolved} is not within cwd ${cwd})`);
    }
    return {
      script: await readFile4(resolved, "utf-8"),
      workflowFile: resolved
    };
  }
  if (input.name) {
    if (sanitizeWorkflowName(input.name) === null) {
      throw new Error(`Named workflow name "${input.name}" is invalid (contains path separators or is . / ..)`);
    }
    const found = await resolveNamedWorkflow(join5(cwd, WORKFLOW_DIR_NAME), input.name);
    if (!found) {
      throw new Error(`Named workflow "${input.name}" not found (looked in ${WORKFLOW_DIR_NAME}/)`);
    }
    return { script: found.content, workflowFile: found.path };
  }
  throw new Error("One of script, name, or scriptPath must be provided");
}
var WORKFLOW_TOOL_PROMPT = `Use the Workflow tool to execute a workflow script that orchestrates multiple subagents deterministically. The script runs in the background; you receive a run_id immediately and are notified on completion.

Provide the script inline via "script", or reference a named workflow via "name" (resolved from .claude/workflows/), or an existing file via "scriptPath". Pass "args" as a real JSON value (object/array/string), not a stringified string.

Use "resumeFromRunId" to resume a prior run \u2014 completed agent() calls replay from the journal instantly.

Concurrency: default is 3 (hard ceiling 16). OMIT maxConcurrency to use 3. To set maxConcurrency to ANY value other than 3, you MUST first ask the user via AskUserQuestion \u2014 propose 3 / 6 / 9 (or other tiers matching the fan-out width) with 3 marked "(Recommended)". The ONLY exception: the user has ALREADY specified a concurrency number in this session ("use 6", "maxConcurrency 9") \u2014 then honor it without re-asking. Never silently raise concurrency above 3 just because the workflow fans out; 3 is the recommended default.

Script execution model (common pitfalls \u2014 getting these wrong is the #1 cause of script errors): the script is the body of \`new AsyncFunction\` \u2014 NOT an ESM module, and TypeScript is NOT transpiled. Therefore:
- Do NOT use \`import\` \u2014 \`agent\`, \`parallel\`, \`pipeline\`, \`phase\`, \`log\`, \`workflow\`, \`args\`, and \`budget\` are injected as parameters; reference them directly.
- Do NOT use TS type annotations, \`interface\`, \`enum\`, \`as\`, or generics \u2014 the engine does not transpile, so even a .ts file with type syntax fails to parse.
- Keep EXACTLY ONE \`export const meta = {...}\` (plain literal) and remove every other \`export\` / \`export default\`.
- Return the result with a top-level \`return\`.
Prefer .js / .mjs. See /ultracode for the full playbook and quality patterns.`;
var init_WorkflowTool = __esm(() => {
  init_constants19();
  init_namedWorkflows();
  init_runWorkflow();
  init_script();
  init_paths();
  init_schema();
  init_persistInline();
});

// packages/workflow-engine/src/index.ts
var exports_src = {};
__export(exports_src, {
  workflowInputSchema: () => workflowInputSchema,
  validateAgainstSchema: () => validateAgainstSchema,
  unwrapHostHandle: () => unwrapHostHandle,
  runWorkflow: () => runWorkflow,
  resolveNamedWorkflow: () => resolveNamedWorkflow,
  persistInlineScript: () => persistInlineScript,
  parseScript: () => parseScript,
  maxConcurrency: () => maxConcurrency,
  makeHooks: () => makeHooks,
  listNamedWorkflows: () => listNamedWorkflows,
  isHostHandle: () => isHostHandle,
  extractMeta: () => extractMeta,
  createWorkflowTool: () => createWorkflowTool,
  createSharedResources: () => createSharedResources,
  createProgressEmitter: () => createProgressEmitter,
  createHostHandle: () => createHostHandle,
  createFileJournalStore: () => createFileJournalStore,
  createEngineContext: () => createEngineContext,
  createBufferingEmitter: () => createBufferingEmitter,
  clampMaxConcurrency: () => clampMaxConcurrency,
  agentCallKey: () => agentCallKey,
  WorkflowError: () => WorkflowError,
  WorkflowAbortedError: () => WorkflowAbortedError,
  WORKFLOW_TOOL_NAME: () => WORKFLOW_TOOL_NAME,
  WORKFLOW_SCRIPT_EXTENSIONS: () => WORKFLOW_SCRIPT_EXTENSIONS,
  WORKFLOW_RUNS_DIR: () => WORKFLOW_RUNS_DIR,
  WORKFLOW_DIR_NAME: () => WORKFLOW_DIR_NAME,
  Semaphore: () => Semaphore,
  ScriptError: () => ScriptError,
  MAX_TOTAL_AGENTS: () => MAX_TOTAL_AGENTS,
  MAX_ITEMS_PER_CALL: () => MAX_ITEMS_PER_CALL,
  MAX_CONCURRENCY_CAP: () => MAX_CONCURRENCY_CAP,
  DEFAULT_MAX_CONCURRENCY: () => DEFAULT_MAX_CONCURRENCY,
  BudgetExhaustedError: () => BudgetExhaustedError,
  Budget: () => Budget,
  AgentAdapterRegistry: () => AgentAdapterRegistry,
  AdapterNotFoundError: () => AdapterNotFoundError
});
var init_src = __esm(() => {
  init_structuredOutput();
  init_WorkflowTool();
  init_schema();
  init_persistInline();
  init_types();
  init_constants19();
  init_ports();
  init_agentAdapter();
  init_concurrency();
  init_script();
  init_journal();
  init_budget();
  init_namedWorkflows();
  init_errors2();
  init_context();
  init_hooks();
  init_runWorkflow();
  init_events();
});

// src/utils/cronTasks.ts
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { mkdir as mkdir3, writeFile as writeFile2 } from "fs/promises";
import { join as join6 } from "path";
function getCronFilePath(dir) {
  return join6(dir ?? getProjectRoot(), CRON_FILE_REL);
}
async function readCronTasks(dir) {
  const fs = getFsImplementation();
  let raw;
  try {
    raw = await fs.readFile(getCronFilePath(dir), { encoding: "utf-8" });
  } catch (e) {
    if (isFsInaccessible(e))
      return [];
    logError(e);
    return [];
  }
  const parsed = safeParseJSON(raw, false);
  if (!parsed || typeof parsed !== "object")
    return [];
  const file = parsed;
  if (!Array.isArray(file.tasks))
    return [];
  const out = [];
  for (const t of file.tasks) {
    if (!t || typeof t.id !== "string" || typeof t.cron !== "string" || typeof t.prompt !== "string" || typeof t.createdAt !== "number") {
      logForDebugging(`[ScheduledTasks] skipping malformed task: ${jsonStringify(t)}`);
      continue;
    }
    if (!parseCronExpression(t.cron)) {
      logForDebugging(`[ScheduledTasks] skipping task ${t.id} with invalid cron '${t.cron}'`);
      continue;
    }
    out.push({
      id: t.id,
      cron: t.cron,
      prompt: t.prompt,
      createdAt: t.createdAt,
      ...typeof t.lastFiredAt === "number" ? { lastFiredAt: t.lastFiredAt } : {},
      ...t.recurring ? { recurring: true } : {},
      ...t.permanent ? { permanent: true } : {}
    });
  }
  return out;
}
function hasCronTasksSync(dir) {
  let raw;
  try {
    raw = readFileSync(getCronFilePath(dir), "utf-8");
  } catch {
    return false;
  }
  const parsed = safeParseJSON(raw, false);
  if (!parsed || typeof parsed !== "object")
    return false;
  const tasks = parsed.tasks;
  return Array.isArray(tasks) && tasks.length > 0;
}
async function writeCronTasks(tasks, dir) {
  const root = dir ?? getProjectRoot();
  await mkdir3(join6(root, ".claude"), { recursive: true });
  const body = {
    tasks: tasks.map(({ durable: _durable, ...rest }) => rest)
  };
  await writeFile2(getCronFilePath(root), jsonStringify(body, null, 2) + `
`, "utf-8");
}
async function addCronTask(cron, prompt, recurring, durable, agentId) {
  const id = randomUUID().slice(0, 8);
  const task = {
    id,
    cron,
    prompt,
    createdAt: Date.now(),
    ...recurring ? { recurring: true } : {}
  };
  if (!durable) {
    addSessionCronTask({ ...task, ...agentId ? { agentId } : {} });
    return id;
  }
  const tasks = await readCronTasks();
  tasks.push(task);
  await writeCronTasks(tasks);
  return id;
}
async function removeCronTasks(ids, dir) {
  if (ids.length === 0)
    return;
  if (dir === undefined && removeSessionCronTasks(ids) === ids.length) {
    return;
  }
  const idSet = new Set(ids);
  const tasks = await readCronTasks(dir);
  const remaining = tasks.filter((t) => !idSet.has(t.id));
  if (remaining.length === tasks.length)
    return;
  await writeCronTasks(remaining, dir);
}
async function markCronTasksFired(ids, firedAt, dir) {
  if (ids.length === 0)
    return;
  const idSet = new Set(ids);
  const tasks = await readCronTasks(dir);
  let changed = false;
  for (const t of tasks) {
    if (idSet.has(t.id)) {
      t.lastFiredAt = firedAt;
      changed = true;
    }
  }
  if (!changed)
    return;
  await writeCronTasks(tasks, dir);
}
async function listAllCronTasks(dir) {
  const fileTasks = await readCronTasks(dir);
  if (dir !== undefined)
    return fileTasks;
  const sessionTasks = getSessionCronTasks().map((t) => ({
    ...t,
    durable: false
  }));
  return [...fileTasks, ...sessionTasks];
}
function nextCronRunMs(cron, fromMs) {
  const fields = parseCronExpression(cron);
  if (!fields)
    return null;
  const next = computeNextCronRun(fields, new Date(fromMs));
  return next ? next.getTime() : null;
}
function jitterFrac(taskId) {
  const frac = parseInt(taskId.slice(0, 8), 16) / 4294967296;
  return Number.isFinite(frac) ? frac : 0;
}
function jitteredNextCronRunMs(cron, fromMs, taskId, cfg = DEFAULT_CRON_JITTER_CONFIG) {
  const t1 = nextCronRunMs(cron, fromMs);
  if (t1 === null)
    return null;
  const t2 = nextCronRunMs(cron, t1);
  if (t2 === null)
    return t1;
  const jitter = Math.min(jitterFrac(taskId) * cfg.recurringFrac * (t2 - t1), cfg.recurringCapMs);
  return t1 + jitter;
}
function oneShotJitteredNextCronRunMs(cron, fromMs, taskId, cfg = DEFAULT_CRON_JITTER_CONFIG) {
  const t1 = nextCronRunMs(cron, fromMs);
  if (t1 === null)
    return null;
  if (new Date(t1).getMinutes() % cfg.oneShotMinuteMod !== 0)
    return t1;
  const lead = cfg.oneShotFloorMs + jitterFrac(taskId) * (cfg.oneShotMaxMs - cfg.oneShotFloorMs);
  return Math.max(t1 - lead, fromMs);
}
function findMissedTasks(tasks, nowMs) {
  return tasks.filter((t) => {
    const next = nextCronRunMs(t.cron, t.createdAt);
    return next !== null && next < nowMs;
  });
}
var CRON_FILE_REL, DEFAULT_CRON_JITTER_CONFIG;
var init_cronTasks = __esm(() => {
  init_state();
  init_cron();
  init_debug();
  init_errors();
  init_fsOperations();
  init_json();
  init_log();
  init_slowOperations();
  CRON_FILE_REL = join6(".claude", "scheduled_tasks.json");
  DEFAULT_CRON_JITTER_CONFIG = {
    recurringFrac: 0.1,
    recurringCapMs: 15 * 60 * 1000,
    oneShotMaxMs: 90 * 1000,
    oneShotFloorMs: 0,
    oneShotMinuteMod: 30,
    recurringMaxAgeMs: 7 * 24 * 60 * 60 * 1000
  };
});

// packages/builtin-tools/src/tools/ScheduleCronTool/prompt.ts
var exports_prompt = {};
__export(exports_prompt, {
  isKairosCronEnabled: () => isKairosCronEnabled,
  isDurableCronEnabled: () => isDurableCronEnabled,
  buildCronListPrompt: () => buildCronListPrompt,
  buildCronDeletePrompt: () => buildCronDeletePrompt,
  buildCronCreatePrompt: () => buildCronCreatePrompt,
  buildCronCreateDescription: () => buildCronCreateDescription,
  DEFAULT_MAX_AGE_DAYS: () => DEFAULT_MAX_AGE_DAYS,
  CRON_LIST_TOOL_NAME: () => CRON_LIST_TOOL_NAME,
  CRON_LIST_DESCRIPTION: () => CRON_LIST_DESCRIPTION,
  CRON_DELETE_TOOL_NAME: () => CRON_DELETE_TOOL_NAME,
  CRON_DELETE_DESCRIPTION: () => CRON_DELETE_DESCRIPTION,
  CRON_CREATE_TOOL_NAME: () => CRON_CREATE_TOOL_NAME
});
function isKairosCronEnabled() {
  return !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_CRON);
}
function isDurableCronEnabled() {
  return getFeatureValue_CACHED_WITH_REFRESH("tengu_kairos_cron_durable", true, KAIROS_CRON_REFRESH_MS);
}
function buildCronCreateDescription(durableEnabled) {
  return durableEnabled ? "Schedule a prompt to run at a future time \u2014 either recurring on a cron schedule, or once at a specific time. Pass durable: true to persist to .claude/scheduled_tasks.json; otherwise session-only." : "Schedule a prompt to run at a future time within this Claude session \u2014 either recurring on a cron schedule, or once at a specific time.";
}
function buildCronCreatePrompt(durableEnabled) {
  const durabilitySection = durableEnabled ? `## Durability

By default (durable: false) the job lives only in this Claude session \u2014 nothing is written to disk, and the job is gone when Claude exits. Pass durable: true to write to .claude/scheduled_tasks.json so the job survives restarts. Only use durable: true when the user explicitly asks for the task to persist ("keep doing this every day", "set this up permanently"). Most "remind me in 5 minutes" / "check back in an hour" requests should stay session-only.` : `## Session-only

Jobs live only in this Claude session \u2014 nothing is written to disk, and the job is gone when Claude exits.`;
  const durableRuntimeNote = durableEnabled ? "Durable jobs persist to .claude/scheduled_tasks.json and survive session restarts \u2014 on next launch they resume automatically. One-shot durable tasks that were missed while the REPL was closed are surfaced for catch-up. Session-only jobs die with the process. " : "";
  return `Schedule a prompt to be enqueued at a future time. Use for both recurring schedules and one-shot reminders.

Uses standard 5-field cron in the user's local timezone: minute hour day-of-month month day-of-week. "0 9 * * *" means 9am local \u2014 no timezone conversion needed.

## One-shot tasks (recurring: false)

For "remind me at X" or "at <time>, do Y" requests \u2014 fire once then auto-delete.
Pin minute/hour/day-of-month/month to specific values:
  "remind me at 2:30pm today to check the deploy" \u2192 cron: "30 14 <today_dom> <today_month> *", recurring: false
  "tomorrow morning, run the smoke test" \u2192 cron: "57 8 <tomorrow_dom> <tomorrow_month> *", recurring: false

## Recurring jobs (recurring: true, the default)

For "every N minutes" / "every hour" / "weekdays at 9am" requests:
  "*/5 * * * *" (every 5 min), "0 * * * *" (hourly), "0 9 * * 1-5" (weekdays at 9am local)

## Avoid the :00 and :30 minute marks when the task allows it

Every user who asks for "9am" gets \`0 9\`, and every user who asks for "hourly" gets \`0 *\` \u2014 which means requests from across the planet land on the API at the same instant. When the user's request is approximate, pick a minute that is NOT 0 or 30:
  "every morning around 9" \u2192 "57 8 * * *" or "3 9 * * *" (not "0 9 * * *")
  "hourly" \u2192 "7 * * * *" (not "0 * * * *")
  "in an hour or so, remind me to..." \u2192 pick whatever minute you land on, don't round

Only use minute 0 or 30 when the user names that exact time and clearly means it ("at 9:00 sharp", "at half past", coordinating with a meeting). When in doubt, nudge a few minutes early or late \u2014 the user will not notice, and the fleet will.

${durabilitySection}

## Runtime behavior

Jobs only fire while the REPL is idle (not mid-query). ${durableRuntimeNote}The scheduler adds a small deterministic jitter on top of whatever you pick: recurring tasks fire up to 10% of their period late (max 15 min); one-shot tasks landing on :00 or :30 fire up to 90 s early. Picking an off-minute is still the bigger lever.

Recurring tasks auto-expire after ${DEFAULT_MAX_AGE_DAYS} days \u2014 they fire one final time, then are deleted. This bounds session lifetime. Tell the user about the ${DEFAULT_MAX_AGE_DAYS}-day limit when scheduling recurring jobs.

Returns a job ID you can pass to ${CRON_DELETE_TOOL_NAME}.`;
}
function buildCronDeletePrompt(durableEnabled) {
  return durableEnabled ? `Cancel a cron job previously scheduled with ${CRON_CREATE_TOOL_NAME}. Removes it from .claude/scheduled_tasks.json (durable jobs) or the in-memory session store (session-only jobs).` : `Cancel a cron job previously scheduled with ${CRON_CREATE_TOOL_NAME}. Removes it from the in-memory session store.`;
}
function buildCronListPrompt(durableEnabled) {
  return durableEnabled ? `List all cron jobs scheduled via ${CRON_CREATE_TOOL_NAME}, both durable (.claude/scheduled_tasks.json) and session-only.` : `List all cron jobs scheduled via ${CRON_CREATE_TOOL_NAME} in this session.`;
}
var KAIROS_CRON_REFRESH_MS, DEFAULT_MAX_AGE_DAYS, CRON_CREATE_TOOL_NAME = "CronCreate", CRON_DELETE_TOOL_NAME = "CronDelete", CRON_LIST_TOOL_NAME = "CronList", CRON_DELETE_DESCRIPTION = "Cancel a scheduled cron job by ID", CRON_LIST_DESCRIPTION = "List scheduled cron jobs";
var init_prompt11 = __esm(() => {
  init_growthbook();
  init_cronTasks();
  init_envUtils();
  KAIROS_CRON_REFRESH_MS = 5 * 60 * 1000;
  DEFAULT_MAX_AGE_DAYS = DEFAULT_CRON_JITTER_CONFIG.recurringMaxAgeMs / (24 * 60 * 60 * 1000);
});

// packages/builtin-tools/src/tools/LocalMemoryRecallTool/constants.ts
var LOCAL_MEMORY_RECALL_TOOL_NAME = "LocalMemoryRecall", PER_TURN_FETCH_BUDGET_BYTES, PREVIEW_CAP_BYTES, FETCH_CAP_BYTES, LIST_STORES_CAP_BYTES, LIST_ENTRIES_CAP_BYTES;
var init_constants20 = __esm(() => {
  PER_TURN_FETCH_BUDGET_BYTES = 100 * 1024;
  PREVIEW_CAP_BYTES = 2 * 1024;
  FETCH_CAP_BYTES = 50 * 1024;
  LIST_STORES_CAP_BYTES = 4 * 1024;
  LIST_ENTRIES_CAP_BYTES = 8 * 1024;
});

// packages/builtin-tools/src/tools/VaultHttpFetchTool/constants.ts
var VAULT_HTTP_FETCH_TOOL_NAME = "VaultHttpFetch", RESPONSE_BODY_CAP_BYTES = 1048576, REQUEST_TIMEOUT_MS = 30000;
var init_constants21 = () => {};

// src/constants/tools.ts
var ALL_AGENT_DISALLOWED_TOOLS, CUSTOM_AGENT_DISALLOWED_TOOLS, ASYNC_AGENT_ALLOWED_TOOLS, IN_PROCESS_TEAMMATE_ALLOWED_TOOLS, COORDINATOR_MODE_ALLOWED_TOOLS, CORE_TOOLS;
var init_tools = __esm(() => {
  init_constants2();
  init_constants3();
  init_constants4();
  init_constants();
  init_prompt2();
  init_prompt();
  init_prompt3();
  init_prompt4();
  init_constants5();
  init_prompt5();
  init_prompt6();
  init_prompt7();
  init_shellToolUtils();
  init_constants6();
  init_prompt8();
  init_constants7();
  init_constants8();
  init_constants9();
  init_constants10();
  init_constants11();
  init_constants12();
  init_constants13();
  init_constants14();
  init_SyntheticOutputTool();
  init_prompt9();
  init_prompt10();
  init_constants15();
  init_constants16();
  init_constants17();
  init_constants18();
  init_src();
  init_prompt11();
  init_constants20();
  init_constants21();
  ALL_AGENT_DISALLOWED_TOOLS = new Set([
    TASK_OUTPUT_TOOL_NAME,
    EXIT_PLAN_MODE_V2_TOOL_NAME,
    ENTER_PLAN_MODE_TOOL_NAME,
    ...process.env.USER_TYPE === "ant" ? [] : [AGENT_TOOL_NAME],
    ASK_USER_QUESTION_TOOL_NAME,
    TASK_STOP_TOOL_NAME,
    ...[WORKFLOW_TOOL_NAME],
    LOCAL_MEMORY_RECALL_TOOL_NAME,
    VAULT_HTTP_FETCH_TOOL_NAME
  ]);
  CUSTOM_AGENT_DISALLOWED_TOOLS = new Set([
    ...ALL_AGENT_DISALLOWED_TOOLS
  ]);
  ASYNC_AGENT_ALLOWED_TOOLS = new Set([
    FILE_READ_TOOL_NAME,
    WEB_SEARCH_TOOL_NAME,
    TODO_WRITE_TOOL_NAME,
    GREP_TOOL_NAME,
    WEB_FETCH_TOOL_NAME,
    GLOB_TOOL_NAME,
    ...SHELL_TOOL_NAMES,
    FILE_EDIT_TOOL_NAME,
    FILE_WRITE_TOOL_NAME,
    NOTEBOOK_EDIT_TOOL_NAME,
    SKILL_TOOL_NAME,
    SYNTHETIC_OUTPUT_TOOL_NAME,
    SEARCH_EXTRA_TOOLS_TOOL_NAME,
    EXECUTE_TOOL_NAME,
    ENTER_WORKTREE_TOOL_NAME,
    EXIT_WORKTREE_TOOL_NAME
  ]);
  IN_PROCESS_TEAMMATE_ALLOWED_TOOLS = new Set([
    TASK_CREATE_TOOL_NAME,
    TASK_GET_TOOL_NAME,
    TASK_LIST_TOOL_NAME,
    TASK_UPDATE_TOOL_NAME,
    SEND_MESSAGE_TOOL_NAME,
    CRON_CREATE_TOOL_NAME,
    CRON_DELETE_TOOL_NAME,
    CRON_LIST_TOOL_NAME
  ]);
  COORDINATOR_MODE_ALLOWED_TOOLS = new Set([
    AGENT_TOOL_NAME,
    TASK_STOP_TOOL_NAME,
    SEND_MESSAGE_TOOL_NAME,
    SYNTHETIC_OUTPUT_TOOL_NAME
  ]);
  CORE_TOOLS = new Set([
    ...SHELL_TOOL_NAMES,
    FILE_READ_TOOL_NAME,
    FILE_EDIT_TOOL_NAME,
    FILE_WRITE_TOOL_NAME,
    GLOB_TOOL_NAME,
    GREP_TOOL_NAME,
    NOTEBOOK_EDIT_TOOL_NAME,
    AGENT_TOOL_NAME,
    ASK_USER_QUESTION_TOOL_NAME,
    TASK_OUTPUT_TOOL_NAME,
    TASK_STOP_TOOL_NAME,
    TASK_CREATE_TOOL_NAME,
    TASK_GET_TOOL_NAME,
    TASK_LIST_TOOL_NAME,
    TASK_UPDATE_TOOL_NAME,
    TODO_WRITE_TOOL_NAME,
    ENTER_PLAN_MODE_TOOL_NAME,
    EXIT_PLAN_MODE_V2_TOOL_NAME,
    VERIFY_PLAN_EXECUTION_TOOL_NAME,
    WEB_FETCH_TOOL_NAME,
    WEB_SEARCH_TOOL_NAME,
    LSP_TOOL_NAME,
    SKILL_TOOL_NAME,
    WORKFLOW_TOOL_NAME,
    SLEEP_TOOL_NAME,
    SEARCH_EXTRA_TOOLS_TOOL_NAME,
    EXECUTE_TOOL_NAME,
    SYNTHETIC_OUTPUT_TOOL_NAME
  ]);
});

// packages/builtin-tools/src/tools/SearchExtraToolsTool/prompt.ts
function getToolLocationHint() {
  const deltaEnabled = process.env.USER_TYPE === "ant" || getFeatureValue_CACHED_MAY_BE_STALE("tengu_glacier_2xr", false);
  return deltaEnabled ? "Deferred tools appear by name in <system-reminder> messages." : "Deferred tools appear by name in <available-deferred-tools> messages.";
}
function isDeferredTool(tool) {
  if (tool.alwaysLoad === true)
    return false;
  if (CORE_TOOLS.has(tool.name))
    return false;
  return true;
}
function formatDeferredToolLine(tool) {
  return tool.name;
}
function getPrompt() {
  return PROMPT_HEAD + getToolLocationHint() + PROMPT_TAIL;
}
var PROMPT_HEAD = `Search for deferred tools by name or keyword. LOW PRIORITY \u2014 only use this tool when no core tool can accomplish the task. Core tools (Read, Edit, Write, Bash, Glob, Grep, Agent, WebFetch, WebSearch, Skill) are always available and should be used directly. This tool is for discovering additional capabilities like MCP tools, cron scheduling, worktree management, agent teams (TeamCreate, TeamDelete, SendMessage), etc.

`, PROMPT_TAIL = ` Returns matching tool names.

## Two-step workflow (MUST follow exactly)

Deferred tools CANNOT be called directly. You MUST use this two-step pattern:

Step 1 \u2014 Search: Call this tool (SearchExtraTools) to discover the target tool.
  Input: {"query": "select:CronCreate"}
  Response: "Found 1 deferred tool(s): CronCreate. Use ExecuteExtraTool with {"tool_name": "<name>", "params": {...}} to invoke."

Step 2 \u2014 Execute: Call ExecuteExtraTool to run the discovered tool.
  Input: {"tool_name": "CronCreate", "params": {"schedule": "*/5 * * * *", "prompt": "check the deploy"}}
  Response: the actual tool result.

## Example: user asks "schedule a cron to check deploy every 5 minutes"

1. SearchExtraTools({"query": "select:CronCreate"})
   \u2192 Response: Found deferred tool CronCreate
2. ExecuteExtraTool({"tool_name": "CronCreate", "params": {"schedule": "*/5 * * * *", "prompt": "check the deploy"}})
   \u2192 Response: Cron job created successfully

If you don't know the exact tool name, use keyword search first:
1. SearchExtraTools({"query": "cron schedule"})
   \u2192 Response: Found deferred tool(s): CronCreate
2. ExecuteExtraTool({"tool_name": "CronCreate", "params": {...}})

## Query forms
- "select:CronCreate" \u2014 exact tool name (fastest, preferred when you know the name from <available-deferred-tools>)
- "select:CronCreate,CronList" \u2014 comma-separated multi-select
- "discover:schedule cron job" \u2014 returns tool name + description + schema without loading. Use to understand a tool before calling it.
- "notebook jupyter" \u2014 keyword search, up to max_results best matches
- "+slack send" \u2014 require "slack" in the name, rank by remaining terms

## Failure policy
If ExecuteExtraTool fails, do NOT re-search for the same tool \u2014 it will loop. Stop and tell the user what failed.`;
var init_prompt12 = __esm(() => {
  init_growthbook();
  init_tools();
  init_constants14();
});

export { getEmptyToolPermissionContext, filterToolProgressMessages, toolMatchesName, findToolByName, buildTool, init_Tool, BASH_TOOL_NAME, init_toolName, GREP_TOOL_NAME, getDescription, init_prompt5 as init_prompt, FILE_EDIT_TOOL_NAME, CLAUDE_FOLDER_PERMISSION_PATTERN, GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN, FILE_UNEXPECTEDLY_MODIFIED_ERROR, init_constants6 as init_constants, parsePDFPageRange, isPDFSupported, isPDFExtension, init_pdfUtils, FILE_READ_TOOL_NAME, FILE_UNCHANGED_STUB, MAX_LINES_TO_READ, DESCRIPTION2 as DESCRIPTION, LINE_FORMAT_INSTRUCTION, OFFSET_INSTRUCTION_DEFAULT, OFFSET_INSTRUCTION_TARGETED, renderPromptTemplate, init_prompt3 as init_prompt1, FILE_WRITE_TOOL_NAME, getWriteToolDescription, init_prompt8 as init_prompt2, GLOB_TOOL_NAME, DESCRIPTION4 as DESCRIPTION1, init_prompt7 as init_prompt3, NOTEBOOK_EDIT_TOOL_NAME, init_constants7 as init_constants1, WEB_FETCH_TOOL_NAME, DESCRIPTION3 as DESCRIPTION2, makeSecondaryModelPrompt, init_prompt6 as init_prompt4, SEND_MESSAGE_TOOL_NAME, init_constants9 as init_constants2, getLocalISODate, getSessionStartDate, init_common, WEB_SEARCH_TOOL_NAME, getWebSearchPrompt, init_prompt4 as init_prompt5, EXIT_PLAN_MODE_TOOL_NAME, EXIT_PLAN_MODE_V2_TOOL_NAME, init_constants3, ENTER_PLAN_MODE_TOOL_NAME, init_constants4, ASK_USER_QUESTION_TOOL_NAME, ASK_USER_QUESTION_TOOL_CHIP_WIDTH, DESCRIPTION as DESCRIPTION3, PREVIEW_FEATURE_PROMPT, ASK_USER_QUESTION_TOOL_PROMPT, init_prompt2 as init_prompt6, TODO_WRITE_TOOL_NAME, init_constants5, POWERSHELL_TOOL_NAME, init_toolName2 as init_toolName1, SHELL_TOOL_NAMES, isPowerShellToolEnabled, init_shellToolUtils, SKILL_TOOL_NAME, init_constants8 as init_constants6, TASK_CREATE_TOOL_NAME, init_constants10 as init_constants7, TASK_GET_TOOL_NAME, init_constants11 as init_constants8, TASK_LIST_TOOL_NAME, init_constants12 as init_constants9, TASK_UPDATE_TOOL_NAME, init_constants13 as init_constants10, SEARCH_EXTRA_TOOLS_TOOL_NAME, SYNTHETIC_OUTPUT_TOOL_NAME, isSyntheticOutputToolEnabled, SyntheticOutputTool, createSyntheticOutputTool, init_SyntheticOutputTool, SLEEP_TOOL_NAME, DESCRIPTION5 as DESCRIPTION4, SLEEP_TOOL_PROMPT, init_prompt9 as init_prompt7, LSP_TOOL_NAME, DESCRIPTION6 as DESCRIPTION5, init_prompt10 as init_prompt8, VERIFY_PLAN_EXECUTION_TOOL_NAME, exports_constants, init_constants15 as init_constants11, EXECUTE_TOOL_NAME, init_constants16 as init_constants12, ENTER_WORKTREE_TOOL_NAME, init_constants17 as init_constants13, EXIT_WORKTREE_TOOL_NAME, init_constants18 as init_constants14, WORKFLOW_TOOL_NAME, WORKFLOW_DIR_NAME, createHostHandle, unwrapHostHandle, AgentAdapterRegistry, parseScript, createFileJournalStore, resolveNamedWorkflow, listNamedWorkflows, WorkflowAbortedError, runWorkflow, workflowInputSchema, persistInlineScript, createWorkflowTool, exports_src, init_src, getCronFilePath, readCronTasks, hasCronTasksSync, addCronTask, removeCronTasks, markCronTasksFired, listAllCronTasks, nextCronRunMs, DEFAULT_CRON_JITTER_CONFIG, jitteredNextCronRunMs, oneShotJitteredNextCronRunMs, findMissedTasks, init_cronTasks, DEFAULT_MAX_AGE_DAYS, isKairosCronEnabled, isDurableCronEnabled, CRON_CREATE_TOOL_NAME, CRON_DELETE_TOOL_NAME, CRON_LIST_TOOL_NAME, buildCronCreateDescription, buildCronCreatePrompt, CRON_DELETE_DESCRIPTION, buildCronDeletePrompt, CRON_LIST_DESCRIPTION, buildCronListPrompt, exports_prompt, init_prompt11 as init_prompt9, LOCAL_MEMORY_RECALL_TOOL_NAME, PER_TURN_FETCH_BUDGET_BYTES, PREVIEW_CAP_BYTES, FETCH_CAP_BYTES, LIST_STORES_CAP_BYTES, LIST_ENTRIES_CAP_BYTES, init_constants20 as init_constants15, VAULT_HTTP_FETCH_TOOL_NAME, RESPONSE_BODY_CAP_BYTES, REQUEST_TIMEOUT_MS, init_constants21 as init_constants16, ALL_AGENT_DISALLOWED_TOOLS, CUSTOM_AGENT_DISALLOWED_TOOLS, ASYNC_AGENT_ALLOWED_TOOLS, IN_PROCESS_TEAMMATE_ALLOWED_TOOLS, COORDINATOR_MODE_ALLOWED_TOOLS, init_tools, isDeferredTool, formatDeferredToolLine, getPrompt, init_prompt12 as init_prompt10 };

//# debugId=4DC53A20C75F725164756E2164756E21
//# sourceMappingURL=chunk-7b68gcqs.js.map
