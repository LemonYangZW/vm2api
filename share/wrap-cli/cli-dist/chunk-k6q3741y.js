// @bun
import {
  buildCliLaunch,
  init_cliLaunch,
  spawnCli
} from "./chunk-2y7yqf01.js";
import"./chunk-xp6v07f0.js";
import"./chunk-v4ypszbb.js";
import"./chunk-mhjmeh6r.js";
import"./chunk-m28vg9w4.js";
import"./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/cli/bg/tail.ts
import {
  openSync,
  readSync,
  closeSync,
  statSync,
  watchFile,
  unwatchFile,
  createReadStream
} from "fs";
import { createInterface } from "readline";
async function tailLog(logPath) {
  let position = 0;
  try {
    const stat = statSync(logPath);
    position = stat.size;
    if (position > 0) {
      const stream = createReadStream(logPath, { start: 0, end: position - 1 });
      const rl = createInterface({ input: stream });
      for await (const line of rl) {
        process.stdout.write(line + `
`);
      }
    }
  } catch {}
  console.log(`
[tail] Watching for new output... (Ctrl+C to detach)
`);
  return new Promise((resolve) => {
    const onSignal = () => {
      unwatchFile(logPath);
      process.removeListener("SIGINT", onSignal);
      console.log(`
[tail] Detached from session.`);
      resolve();
    };
    process.on("SIGINT", onSignal);
    watchFile(logPath, { interval: 300 }, () => {
      try {
        const stat = statSync(logPath);
        if (stat.size <= position)
          return;
        const fd = openSync(logPath, "r");
        try {
          const buf = Buffer.alloc(stat.size - position);
          readSync(fd, buf, 0, buf.length, position);
          process.stdout.write(buf);
          position = stat.size;
        } finally {
          closeSync(fd);
        }
      } catch {}
    });
  });
}
var init_tail = () => {};

// src/cli/bg/engines/detached.ts
import { closeSync as closeSync2, mkdirSync, openSync as openSync2 } from "fs";
import { dirname } from "path";

class DetachedEngine {
  name = "detached";
  supportsInteractiveInput = false;
  async available() {
    return true;
  }
  async start(opts) {
    mkdirSync(dirname(opts.logPath), { recursive: true });
    const logFd = openSync2(opts.logPath, "a");
    const launch = buildCliLaunch(opts.args, {
      env: {
        ...opts.env,
        CLAUDE_CODE_SESSION_KIND: "bg",
        CLAUDE_CODE_SESSION_NAME: opts.sessionName,
        CLAUDE_CODE_SESSION_LOG: opts.logPath
      }
    });
    const child = spawnCli(launch, {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      cwd: opts.cwd
    });
    child.unref();
    closeSync2(logFd);
    const pid = child.pid ?? 0;
    return {
      pid,
      sessionName: opts.sessionName,
      logPath: opts.logPath,
      engineUsed: "detached"
    };
  }
  async attach(session) {
    if (!session.logPath) {
      throw new Error(`Session ${session.sessionId} has no log path.`);
    }
    await tailLog(session.logPath);
  }
}
var init_detached = __esm(() => {
  init_cliLaunch();
  init_tail();
});
init_detached();

export {
  DetachedEngine
};

//# debugId=F0584AA6C66A4D4D64756E2164756E21
//# sourceMappingURL=chunk-k6q3741y.js.map
