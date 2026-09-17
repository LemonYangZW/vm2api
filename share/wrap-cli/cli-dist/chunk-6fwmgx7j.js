// @bun
import {
  addToTotalSessionCost,
  convertMessagesToLangfuse,
  convertOutputToLangfuse,
  convertToolsToLangfuse,
  createAssistantAPIErrorMessage,
  getGrokClient,
  init_api,
  init_client2 as init_client,
  init_convert,
  init_cost_tracker,
  init_messages1 as init_messages,
  init_openaiShared,
  init_tracing,
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
  resolveGrokModel
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
import {
  calculateUSDCost,
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
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/api/grok/index.ts
import { randomUUID } from "crypto";
async function* queryModelGrok(messages, systemPrompt, tools, signal, options) {
  try {
    const grokModel = resolveGrokModel(options.model);
    const messagesForAPI = normalizeMessagesForAPI(messages, tools);
    const toolSchemas = await Promise.all(tools.map((tool) => toolToAPISchema(tool, {
      getToolPermissionContext: options.getToolPermissionContext,
      tools,
      agents: options.agents,
      allowedAgentTypes: options.allowedAgentTypes,
      model: options.model
    })));
    const standardTools = toolSchemas.filter((t) => {
      const anyT = t;
      return anyT.type !== "advisor_20260301" && anyT.type !== "computer_20250124";
    });
    const openaiMessages = anthropicMessagesToOpenAI(messagesForAPI, systemPrompt);
    const openaiTools = anthropicToolsToOpenAI(standardTools);
    const openaiToolChoice = anthropicToolChoiceToOpenAI(options.toolChoice);
    const client = getGrokClient({
      maxRetries: 0,
      fetchOverride: options.fetchOverride,
      source: options.querySource
    });
    logForDebugging(`[Grok] Calling model=${grokModel}, messages=${openaiMessages.length}, tools=${openaiTools.length}`);
    const stream = await client.chat.completions.create({
      model: grokModel,
      messages: openaiMessages,
      ...openaiTools.length > 0 && {
        tools: openaiTools,
        ...openaiToolChoice && { tool_choice: openaiToolChoice }
      },
      stream: true,
      stream_options: { include_usage: true },
      ...options.temperatureOverride !== undefined && {
        temperature: options.temperatureOverride
      }
    }, {
      signal
    });
    const adaptedStream = adaptOpenAIStreamToAnthropic(stream, grokModel);
    const contentBlocks = {};
    const collectedMessages = [];
    let partialMessage = null;
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
            usage = updateOpenAIUsage(usage, event.message.usage);
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
          const idx = event.index;
          const block = contentBlocks[idx];
          if (!block || !partialMessage)
            break;
          const m = {
            message: {
              ...partialMessage,
              content: normalizeContentFromAPI([block], tools, options.agentId)
            },
            requestId: undefined,
            type: "assistant",
            uuid: randomUUID(),
            timestamp: new Date().toISOString()
          };
          collectedMessages.push(m);
          yield m;
          break;
        }
        case "message_delta": {
          const deltaUsage = event.usage;
          if (deltaUsage) {
            usage = updateOpenAIUsage(usage, deltaUsage);
          }
          break;
        }
        case "message_stop":
          break;
      }
      if (event.type === "message_stop" && usage.input_tokens + usage.output_tokens > 0) {
        const costUSD = calculateUSDCost(grokModel, usage);
        addToTotalSessionCost(costUSD, usage, options.model);
      }
      yield {
        type: "stream_event",
        event,
        ...event.type === "message_start" ? { ttftMs } : undefined
      };
    }
    recordLLMObservation(options.langfuseTrace ?? null, {
      model: grokModel,
      provider: "grok",
      input: convertMessagesToLangfuse(messagesForAPI, systemPrompt),
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
      tools: convertToolsToLangfuse(toolSchemas)
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logForDebugging(`[Grok] Error: ${errorMessage}`, { level: "error" });
    yield createAssistantAPIErrorMessage({
      content: `API Error: ${errorMessage}`,
      apiError: "api_error",
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
}
var init_grok = __esm(() => {
  init_client();
  init_openaiShared();
  init_src();
  init_messages();
  init_api();
  init_debug();
  init_cost_tracker();
  init_modelCost();
  init_tracing();
  init_convert();
  init_messages();
});
init_grok();

export {
  queryModelGrok
};

//# debugId=C002770AA62DCC8F64756E2164756E21
//# sourceMappingURL=chunk-6fwmgx7j.js.map
