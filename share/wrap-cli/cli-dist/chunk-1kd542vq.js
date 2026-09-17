// @bun
import {
  __esm,
  __require
} from "./chunk-hhsxm2yr.js";

// src/commands/job/job.tsx
async function call(onDone, _context, args) {
  const parts = args ? args.trim().split(/\s+/) : [];
  const sub = parts[0] || "list";
  const lines = [];
  const origLog = console.log;
  const origError = console.error;
  console.log = (...a) => lines.push(a.map(String).join(" "));
  console.error = (...a) => lines.push(a.map(String).join(" "));
  try {
    const { templatesMain } = await import("./chunk-gwxsjwyp.js");
    await templatesMain([sub, ...parts.slice(1)]);
  } finally {
    console.log = origLog;
    console.error = origError;
  }
  onDone(lines.join(`
`) || "Done.", { display: "system" });
  return null;
}
var init_job = () => {};
init_job();

export {
  call
};

//# debugId=4FBE03521547563B64756E2164756E21
//# sourceMappingURL=chunk-1kd542vq.js.map
