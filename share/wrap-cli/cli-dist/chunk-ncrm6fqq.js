// @bun
import {
  adaptResponsesStreamToAnthropic,
  addToTotalSessionCost,
  buildResponsesRequest,
  convertMessagesToLangfuse,
  convertOutputToLangfuse,
  convertToolsToLangfuse,
  createAssistantAPIErrorMessage,
  createChatGPTResponsesStream,
  createUserMessage,
  formatOpenAIPromptCacheKey,
  getOfficialOpenAIPromptCacheKey,
  getOpenAIClient,
  init_api,
  init_chatgptAuth,
  init_client1 as init_client,
  init_convert,
  init_cost_tracker,
  init_messages1 as init_messages,
  init_openaiShared,
  init_responsesAdapter,
  init_searchExtraTools,
  init_tracing,
  isChatGPTAuthEnabled,
  isDeferredToolsDeltaEnabled,
  isSearchExtraToolsEnabled,
  normalizeContentFromAPI,
  normalizeMessagesForAPI,
  recordLLMObservation,
  toolToAPISchema,
  updateOpenAIUsage
} from "./chunk-mxbn7v69.js";
import"./chunk-14p6wvsq.js";
import"./chunk-jpxfbbxv.js";
import"./chunk-5w7gsjdj.js";
import"./chunk-28jd8qjx.js";
import"./chunk-ptxteaeh.js";
import"./chunk-avnfe78q.js";
import"./chunk-xyfbkxqc.js";
import"./chunk-w9t7xj87.js";
import {
  adaptOpenAIStreamToAnthropic,
  anthropicMessagesToOpenAI,
  anthropicToolChoiceToOpenAI,
  anthropicToolsToOpenAI,
  init_src,
  resolveOpenAIModel
} from "./chunk-9hz76phm.js";
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
import {
  SEARCH_EXTRA_TOOLS_TOOL_NAME,
  formatDeferredToolLine,
  getEmptyToolPermissionContext,
  init_Tool,
  init_prompt10 as init_prompt,
  isDeferredTool,
  toolMatchesName
} from "./chunk-r5mwhna8.js";
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
import {
  calculateUSDCost,
  getModelMaxOutputTokens,
  init_context,
  init_modelCost
} from "./chunk-mhtd3kea.js";
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
import {
  getSessionId,
  init_state
} from "./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import {
  init_envUtils,
  isEnvDefinedFalsy,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/api/openai/requestBody.ts
function isOpenAIThinkingEnabled(model) {
  if (isEnvDefinedFalsy(process.env.OPENAI_ENABLE_THINKING))
    return false;
  if (isEnvTruthy(process.env.OPENAI_ENABLE_THINKING))
    return true;
  const modelLower = model.toLowerCase();
  return modelLower.includes("deepseek") || modelLower.includes("mimo");
}
function resolveOpenAIMaxTokens(upperLimit, maxOutputTokensOverride) {
  return maxOutputTokensOverride ?? (process.env.OPENAI_MAX_TOKENS ? parseInt(process.env.OPENAI_MAX_TOKENS, 10) || undefined : undefined) ?? (process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS ? parseInt(process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS, 10) || undefined : undefined) ?? upperLimit;
}
function buildOpenAIRequestBody(params) {
  const {
    model,
    messages,
    tools,
    toolChoice,
    enableThinking,
    maxTokens,
    temperatureOverride,
    promptCacheKey
  } = params;
  return {
    model,
    messages,
    max_tokens: maxTokens,
    ...promptCacheKey && { prompt_cache_key: promptCacheKey },
    ...tools.length > 0 && {
      tools,
      ...toolChoice && { tool_choice: toolChoice }
    },
    stream: true,
    stream_options: { include_usage: true },
    ...enableThinking && {
      thinking: { type: "enabled" },
      enable_thinking: true,
      chat_template_kwargs: { thinking: true, enable_thinking: true }
    },
    ...!enableThinking && temperatureOverride !== undefined && {
      temperature: temperatureOverride
    }
  };
}
var init_requestBody = __esm(() => {
  init_envUtils();
});

// src/services/api/openai/index.ts
import { randomUUID } from "crypto";
function convertToResponsesReasoningEffort(effortValue) {
  if (effortValue === "low")
    return "low";
  if (effortValue === "medium")
    return "medium";
  if (effortValue === "high")
    return "high";
  if (effortValue === "xhigh")
    return "xhigh";
  if (effortValue === "max")
    return "max";
  if (typeof effortValue === "number")
    return "high";
  return;
}
function getChatGPTResponsesReasoningEffort(effortValue) {
  const envOverride = process.env.CLAUDE_CODE_EFFORT_LEVEL?.toLowerCase();
  if (envOverride === "auto" || envOverride === "unset")
    return;
  return convertToResponsesReasoningEffort(envOverride) ?? convertToResponsesReasoningEffort(effortValue) ?? "medium";
}
function prependDeferredToolListIfNeeded(messages, tools, deferredToolNames, useSearchExtraTools) {
  if (!useSearchExtraTools || isDeferredToolsDeltaEnabled())
    return messages;
  const deferredToolList = tools.filter((tool) => deferredToolNames.has(tool.name)).map(formatDeferredToolLine).sort().join(`
`);
  if (!deferredToolList)
    return messages;
  return [
    createUserMessage({
      content: `<available-deferred-tools>
${deferredToolList}
</available-deferred-tools>`,
      isMeta: true
    }),
    ...messages
  ];
}
function isOpenAIConvertibleMessage(msg) {
  return msg.type === "assistant" || msg.type === "user";
}
function assembleFinalAssistantOutputs(params) {
  const {
    partialMessage,
    contentBlocks,
    tools,
    agentId,
    usage,
    stopReason,
    maxTokens
  } = params;
  const outputs = [];
  const allBlocks = Object.keys(contentBlocks).sort((a, b) => Number(a) - Number(b)).map((k) => contentBlocks[Number(k)]).filter(Boolean);
  if (allBlocks.length > 0 && partialMessage) {
    outputs.push({
      message: {
        ...partialMessage,
        content: normalizeContentFromAPI(allBlocks, tools, agentId),
        usage,
        stop_reason: stopReason,
        stop_sequence: null
      },
      requestId: undefined,
      type: "assistant",
      uuid: randomUUID(),
      timestamp: new Date().toISOString()
    });
  }
  if (stopReason === "max_tokens") {
    outputs.push(createAssistantAPIErrorMessage({
      content: `Output truncated: response exceeded the ${maxTokens} token limit. ` + `Set OPENAI_MAX_TOKENS or CLAUDE_CODE_MAX_OUTPUT_TOKENS to override.`,
      apiError: "max_output_tokens",
      error: "max_output_tokens"
    }));
  }
  return outputs;
}
async function* queryModelOpenAI(messages, systemPrompt, tools, signal, options) {
  try {
    const openaiModel = resolveOpenAIModel(options.model);
    const messagesForAPI = normalizeMessagesForAPI(messages, tools);
    const useSearchExtraTools = await isSearchExtraToolsEnabled(options.model, tools, options.getToolPermissionContext || (async () => getEmptyToolPermissionContext()), options.agents || [], options.querySource);
    const deferredToolNames = new Set;
    if (useSearchExtraTools) {
      for (const t of tools) {
        if (isDeferredTool(t))
          deferredToolNames.add(t.name);
      }
    }
    let filteredTools = tools;
    if (useSearchExtraTools && deferredToolNames.size > 0) {
      filteredTools = tools.filter((tool) => {
        if (!deferredToolNames.has(tool.name))
          return true;
        if (toolMatchesName(tool, SEARCH_EXTRA_TOOLS_TOOL_NAME))
          return true;
        return false;
      });
    }
    const toolSchemas = await Promise.all(filteredTools.map((tool) => toolToAPISchema(tool, {
      getToolPermissionContext: options.getToolPermissionContext,
      tools,
      agents: options.agents,
      allowedAgentTypes: options.allowedAgentTypes,
      model: options.model,
      deferLoading: useSearchExtraTools && deferredToolNames.has(tool.name)
    })));
    const standardTools = toolSchemas.filter((t) => {
      const anyT = t;
      return anyT.type !== "advisor_20260301" && anyT.type !== "computer_20250124";
    });
    const enableThinking = isOpenAIThinkingEnabled(openaiModel);
    const openAIConvertibleMessages = messagesForAPI.filter(isOpenAIConvertibleMessage);
    const messagesWithDeferredToolList = prependDeferredToolListIfNeeded(openAIConvertibleMessages, tools, deferredToolNames, useSearchExtraTools);
    const openaiMessages = anthropicMessagesToOpenAI(messagesWithDeferredToolList, systemPrompt, { enableThinking });
    const openaiTools = anthropicToolsToOpenAI(standardTools);
    const openaiToolChoice = anthropicToolChoiceToOpenAI(options.toolChoice);
    const reasoningEffort = getChatGPTResponsesReasoningEffort(options.effortValue);
    if (useSearchExtraTools) {
      const includedDeferredTools = filteredTools.filter((t) => deferredToolNames.has(t.name)).length;
      logForDebugging(`[OpenAI] Tool search enabled: ${includedDeferredTools}/${deferredToolNames.size} deferred tools included, total tools=${openaiTools.length}`);
    } else {
      logForDebugging(`[OpenAI] Tool search disabled, total tools=${openaiTools.length}`);
    }
    const { upperLimit } = getModelMaxOutputTokens(openaiModel);
    const maxTokens = resolveOpenAIMaxTokens(upperLimit, options.maxOutputTokensOverride);
    const useChatGPTResponses = isChatGPTAuthEnabled();
    const sessionId = getSessionId();
    const sessionPromptCacheKey = formatOpenAIPromptCacheKey(sessionId);
    const promptCacheKey = useChatGPTResponses ? sessionPromptCacheKey : getOfficialOpenAIPromptCacheKey(process.env.OPENAI_BASE_URL, sessionId);
    const useOfficialOpenAICache = promptCacheKey !== undefined;
    logForDebugging(`[OpenAI] Calling model=${openaiModel}, messages=${openaiMessages.length}, tools=${openaiTools.length}, thinking=${enableThinking}${promptCacheKey ? `, prompt_cache_key=${promptCacheKey}` : ""}`);
    const adaptedStream = useChatGPTResponses ? adaptResponsesStreamToAnthropic(await createChatGPTResponsesStream({
      request: buildResponsesRequest({
        model: openaiModel,
        messages: openaiMessages,
        tools: openaiTools,
        toolChoice: openaiToolChoice,
        reasoningEffort,
        promptCacheKey: sessionPromptCacheKey
      }),
      signal,
      fetchOverride: options.fetchOverride
    }), openaiModel) : adaptOpenAIStreamToAnthropic(await getOpenAIClient({
      maxRetries: 0,
      fetchOverride: options.fetchOverride,
      source: options.querySource
    }).chat.completions.create(buildOpenAIRequestBody({
      model: openaiModel,
      messages: openaiMessages,
      tools: openaiTools,
      toolChoice: openaiToolChoice,
      enableThinking,
      maxTokens,
      temperatureOverride: options.temperatureOverride,
      promptCacheKey
    }), { signal }), openaiModel, { includeCacheWriteTokens: useOfficialOpenAICache });
    const contentBlocks = {};
    const collectedMessages = [];
    let partialMessage = null;
    let stopReason = null;
    let usage = {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0
    };
    let ttftMs = 0;
    const start = Date.now();
    for await (const event of adaptedStream) {
      switch (event.type) {
        case "message_start": {
          partialMessage = event.message;
          ttftMs = Date.now() - start;
          if (event.message.usage) {
            usage = {
              ...usage,
              ...event.message.usage
            };
          }
          break;
        }
        case "content_block_start": {
          const idx = event.index;
          const cb = event.content_block;
          if (cb.type === "tool_use") {
            contentBlocks[idx] = { ...cb, input: "" };
          } else if (cb.type === "text") {
            contentBlocks[idx] = { ...cb, text: "" };
          } else if (cb.type === "thinking") {
            contentBlocks[idx] = { ...cb, thinking: "", signature: "" };
          } else {
            contentBlocks[idx] = { ...cb };
          }
          break;
        }
        case "content_block_delta": {
          const idx = event.index;
          const delta = event.delta;
          const block = contentBlocks[idx];
          if (!block)
            break;
          if (delta.type === "text_delta") {
            block.text = (block.text || "") + delta.text;
          } else if (delta.type === "input_json_delta") {
            block.input = (block.input || "") + delta.partial_json;
          } else if (delta.type === "thinking_delta") {
            block.thinking = (block.thinking || "") + delta.thinking;
          } else if (delta.type === "signature_delta") {
            block.signature = delta.signature;
          }
          break;
        }
        case "content_block_stop": {
          break;
        }
        case "message_delta": {
          const deltaUsage = event.usage;
          if (deltaUsage) {
            usage = updateOpenAIUsage(usage, deltaUsage);
          }
          if (event.delta.stop_reason != null) {
            stopReason = event.delta.stop_reason;
          }
          break;
        }
        case "message_stop": {
          if (partialMessage) {
            for (const output of assembleFinalAssistantOutputs({
              partialMessage,
              contentBlocks,
              tools,
              agentId: options.agentId,
              usage,
              stopReason,
              maxTokens
            })) {
              if (output.type === "assistant") {
                collectedMessages.push(output);
              }
              yield output;
            }
            partialMessage = null;
          }
          if (usage.input_tokens + usage.output_tokens > 0) {
            const costUSD = calculateUSDCost(openaiModel, usage);
            addToTotalSessionCost(costUSD, usage, options.model);
          }
          break;
        }
      }
      yield {
        type: "stream_event",
        event,
        ...event.type === "message_start" ? { ttftMs } : undefined
      };
    }
    recordLLMObservation(options.langfuseTrace ?? null, {
      model: openaiModel,
      provider: "openai",
      input: convertMessagesToLangfuse(openaiMessages),
      output: convertOutputToLangfuse(collectedMessages),
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_creation_input_tokens: usage.cache_creation_input_tokens,
        cache_read_input_tokens: usage.cache_read_input_tokens
      },
      startTime: new Date(start),
      endTime: new Date,
      completionStartTime: ttftMs > 0 ? new Date(start + ttftMs) : undefined,
      tools: convertToolsToLangfuse(toolSchemas),
      ...enableThinking && { thinking: { type: "enabled" } }
    });
    if (partialMessage) {
      for (const output of assembleFinalAssistantOutputs({
        partialMessage,
        contentBlocks,
        tools,
        agentId: options.agentId,
        usage,
        stopReason,
        maxTokens
      })) {
        yield output;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logForDebugging(`[OpenAI] Error: ${errorMessage}`, { level: "error" });
    yield createAssistantAPIErrorMessage({
      content: `API Error: ${errorMessage}`,
      apiError: "api_error",
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
}
var init_openai = __esm(() => {
  init_state();
  init_client();
  init_openaiShared();
  init_src();
  init_chatgptAuth();
  init_responsesAdapter();
  init_messages();
  init_api();
  init_Tool();
  init_debug();
  init_cost_tracker();
  init_modelCost();
  init_requestBody();
  init_tracing();
  init_convert();
  init_context();
  init_messages();
  init_searchExtraTools();
  init_prompt();
});
init_openai();

export {
  resolveOpenAIMaxTokens,
  queryModelOpenAI,
  isOpenAIThinkingEnabled,
  buildOpenAIRequestBody
};

//# debugId=5AB5C86E54520B0A64756E2164756E21
//# sourceMappingURL=chunk-ncrm6fqq.js.map
