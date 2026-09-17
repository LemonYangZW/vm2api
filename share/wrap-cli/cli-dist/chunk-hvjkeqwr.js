// @bun
import {
  createAssistantMessage,
  createUserMessage,
  getKinTimezone,
  getSystemLayout,
  init_claude,
  init_messages1 as init_messages,
  init_systemLayout,
  queryKinMessagesWithStreaming
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
import {
  WRAP_OFFICIAL_CLI_VERSION,
  init_cliVersion
} from "./chunk-rwny7j7h.js";
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
import"./chunk-hhsxm2yr.js";

// src/kin/nativeMessagesRunner.ts
init_claude();
init_messages();
init_systemLayout();
import { createInterface } from "readline";

// src/kin/stdioProtocol.ts
var KIN_PROTOCOL_VERSION = 2;
var KIN_CAPABILITIES = [
  "multi_slot",
  "native_sse",
  "stateless"
];
function parseStdinLine(line) {
  const trimmed = line.trim();
  if (!trimmed)
    return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed.type !== "string")
      return null;
    if (!parsed.type.startsWith("kin_"))
      return null;
    return parsed;
  } catch {
    return null;
  }
}
var writeChain = Promise.resolve();
function writeStdout(frame) {
  const line = JSON.stringify(frame) + `
`;
  const next = writeChain.then(() => writeLine(line), () => writeLine(line));
  writeChain = next.then(() => {
    return;
  }, () => {
    return;
  });
  return next;
}
function writeLine(line) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err) => {
      if (settled)
        return;
      settled = true;
      if (err)
        reject(err);
      else
        resolve();
    };
    const ok = process.stdout.write(line, (err) => done(err));
    if (!ok)
      process.stdout.once("drain", () => done());
  });
}
function slotId(index) {
  return `s${String(index).padStart(2, "0")}`;
}

// src/kin/nativeMessagesRunner.ts
init_cliVersion();
function nativeSlotCount() {
  const raw = process.env.CLAUDE_CODE_KIN_NATIVE_SLOTS;
  const n = raw ? Number(raw) : 0;
  if (!Number.isFinite(n) || n <= 0)
    return 0;
  return Math.min(20, Math.max(1, Math.floor(n)));
}
async function runNativeMessagesLoop(_ctx) {
  const n = nativeSlotCount();
  if (n <= 0)
    return;
  process.env.CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK = "1";
  process.env.CLAUDE_CODE_ENTRYPOINT = "sdk-cli";
  process.env.USER_TYPE = process.env.USER_TYPE || "external";
  process.env.CLAUDE_CODE_VERSION = process.env.CLAUDE_CODE_VERSION || WRAP_OFFICIAL_CLI_VERSION;
  process.stderr.write(`[kin] native_messages loop n=${n} protocol=${KIN_PROTOCOL_VERSION}
`);
  const slots = new Map;
  for (let i = 0;i < n; i++) {
    const id = slotId(i);
    slots.set(id, { id, phase: "idle" });
  }
  const configHash = process.env.CLAUDE_CODE_KIN_CONFIG_HASH;
  await writeStdout({
    type: "kin_host_ready",
    protocol_version: KIN_PROTOCOL_VERSION,
    slots: n,
    system_layout: getSystemLayout(),
    timezone: getKinTimezone(),
    capabilities: [...KIN_CAPABILITIES],
    ...configHash ? { config_hash: configHash } : {}
  });
  for (const id of slots.keys()) {
    await writeStdout({ type: "kin_slot_ready", slot_id: id });
  }
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    const msg = parseStdinLine(line);
    if (!msg)
      continue;
    switch (msg.type) {
      case "kin_job_start":
        startJob(slots, msg.slot_id, msg.job_id, msg.request, _ctx.options);
        break;
      case "kin_cancel":
        await cancelJob(slots, msg.slot_id, msg.job_id);
        break;
    }
  }
}
function startJob(slots, slotIdArg, jobId, request, hostOptions) {
  const slot = slots.get(slotIdArg);
  if (!slot) {
    writeStdout({
      type: "kin_job_error",
      job_id: jobId,
      slot_id: slotIdArg,
      error: `unknown slot ${slotIdArg}`
    });
    return;
  }
  if (slot.phase !== "idle") {
    writeStdout({
      type: "kin_job_error",
      job_id: jobId,
      slot_id: slot.id,
      error: `slot ${slot.id} busy phase=${slot.phase}`
    });
    return;
  }
  const abort = new AbortController;
  slot.phase = "running";
  slot.jobId = jobId;
  slot.abort = abort;
  slot.task = runJob(slot, jobId, request, hostOptions, abort).finally(() => {
    if (slot.jobId === jobId) {
      slot.phase = "idle";
      slot.jobId = undefined;
      slot.abort = undefined;
      slot.task = undefined;
    }
  });
}
async function cancelJob(slots, slotIdArg, jobId) {
  const slot = slotIdArg ? slots.get(slotIdArg) : undefined;
  if (!slot || slot.jobId !== jobId)
    return;
  if (slot.phase !== "running")
    return;
  slot.phase = "cancelling";
  slot.abort?.abort();
  await slot.task;
  slot.phase = "idle";
  slot.jobId = undefined;
  slot.abort = undefined;
  slot.task = undefined;
  await writeStdout({ type: "kin_cancel_ack", job_id: jobId, slot_id: slot.id });
}
async function runJob(slot, jobId, request, hostOptions, abort) {
  const model = typeof request.model === "string" && request.model ? request.model : hostOptions.userSpecifiedModel || "";
  const messages = messagesFromRequest(request);
  const system = systemFromRequest(request);
  const toolSchemas = Array.isArray(request.tools) ? request.tools : [];
  const toolChoice = request.tool_choice;
  const thinking = thinkingFromRequest(request);
  const maxTokens = typeof request.max_tokens === "number" ? request.max_tokens : undefined;
  const temperature = typeof request.temperature === "number" ? request.temperature : undefined;
  const topP = typeof request.top_p === "number" ? request.top_p : undefined;
  const topK = typeof request.top_k === "number" ? request.top_k : undefined;
  const stopSequences = Array.isArray(request.stop_sequences) ? request.stop_sequences : undefined;
  let rateLimitHeaders = {};
  const emitRateLimitHeaders = async () => {
    if (!Object.keys(rateLimitHeaders).length)
      return;
    await writeStdout({
      type: "kin_stream_event",
      job_id: jobId,
      slot_id: slot.id,
      event: { type: "kin_response_headers", headers: rateLimitHeaders }
    });
  };
  try {
    const outputConfig = request.output_config && typeof request.output_config === "object" ? request.output_config : undefined;
    const stream = queryKinMessagesWithStreaming({
      messages,
      system,
      toolSchemas,
      toolChoice,
      thinking,
      maxTokens,
      temperature,
      topP,
      topK,
      stopSequences,
      model,
      signal: abort.signal,
      wireMessages: Array.isArray(request.messages) ? request.messages : undefined,
      outputConfig,
      contextManagement: request.context_management,
      onResponseHeaders: (headers) => {
        rateLimitHeaders = pickRateLimitHeaders(headers);
      }
    });
    for await (const ev of stream) {
      if (ev.type === "stream_event") {
        const rec = ev;
        await writeStdout({
          type: "kin_stream_event",
          job_id: jobId,
          slot_id: slot.id,
          event: rec.event
        });
        continue;
      }
      if (ev.type === "assistant") {
        const rec = ev;
        if (rec.isApiErrorMessage) {
          await emitRateLimitHeaders();
          await writeStdout({
            type: "kin_job_error",
            job_id: jobId,
            slot_id: slot.id,
            error: extractErrorText(ev)
          });
          return;
        }
        continue;
      }
      if (ev.type === "system") {
        const text = extractErrorText(ev);
        await emitRateLimitHeaders();
        await writeStdout({
          type: "kin_job_error",
          job_id: jobId,
          slot_id: slot.id,
          error: text
        });
        return;
      }
    }
  } catch (err) {
    if (err && typeof err === "object" && "headers" in err && err.headers && typeof err.headers === "object") {
      rateLimitHeaders = {
        ...rateLimitHeaders,
        ...pickRateLimitHeaders(err.headers)
      };
    }
    if (!abort.signal.aborted) {
      await emitRateLimitHeaders();
      await writeStdout({
        type: "kin_job_error",
        job_id: jobId,
        slot_id: slot.id,
        error: err instanceof Error ? err.message : String(err)
      });
    }
    return;
  }
  if (abort.signal.aborted)
    return;
  await emitRateLimitHeaders();
  await writeStdout({
    type: "kin_job_done",
    job_id: jobId,
    slot_id: slot.id,
    stop_reason: "",
    usage: {},
    ...Object.keys(rateLimitHeaders).length ? { headers: rateLimitHeaders } : {}
  });
}
function extractErrorText(ev) {
  const message = ev.message;
  const content = message?.content;
  if (typeof content === "string")
    return content;
  if (Array.isArray(content)) {
    const first = content[0];
    if (first && typeof first.text === "string")
      return first.text;
  }
  return "system error";
}
function systemFromRequest(request) {
  const system = request.system;
  if (typeof system === "string")
    return [system];
  if (!Array.isArray(system))
    return [];
  return system.map((block) => {
    if (typeof block === "string")
      return block;
    if (block && typeof block === "object" && "text" in block) {
      return String(block.text || "");
    }
    return "";
  });
}
function messagesFromRequest(request) {
  const messages = Array.isArray(request.messages) ? request.messages : [];
  return messages.map(toEngineMessage).filter((m) => m !== null);
}
function toEngineMessage(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const msg = raw;
  const content = msg.content;
  const asContent = typeof content === "string" || Array.isArray(content) ? content : "";
  if (msg.role === "assistant") {
    return createAssistantMessage({ content: asContent });
  }
  if (msg.role === "user" || msg.role === "tool") {
    return createUserMessage({ content: asContent });
  }
  return null;
}
function pickRateLimitHeaders(headers) {
  const out = {};
  if (!headers)
    return out;
  const entries = typeof headers.entries === "function" ? [...headers.entries()] : Object.entries(headers);
  for (const [key, value] of entries) {
    if (value == null || value === "")
      continue;
    const lower = key.toLowerCase();
    if (lower.startsWith("anthropic-ratelimit-") || lower === "retry-after" || lower === "request-id") {
      out[lower] = String(value);
    }
  }
  return out;
}
function thinkingFromRequest(request, _fallback) {
  const raw = request.thinking;
  if (raw && typeof raw === "object") {
    const rec = raw;
    if (rec.type === "enabled") {
      return {
        type: "enabled",
        budgetTokens: Number(rec.budget_tokens ?? rec.budgetTokens ?? 0)
      };
    }
    if (rec.type === "adaptive") {
      const display = String(rec.display || "").trim();
      return display ? { type: "adaptive", display } : { type: "adaptive" };
    }
    if (rec.type === "disabled" || rec.type === "none")
      return { type: "disabled" };
  }
  return { type: "disabled" };
}
export {
  thinkingFromRequest,
  runNativeMessagesLoop,
  pickRateLimitHeaders,
  nativeSlotCount
};

//# debugId=A9744F70D826E2EF64756E2164756E21
//# sourceMappingURL=chunk-hvjkeqwr.js.map
