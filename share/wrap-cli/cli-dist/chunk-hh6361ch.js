// @bun
import {
  buildCliLaunch,
  init_cliLaunch,
  quoteCliLaunch
} from "./chunk-2y7yqf01.js";
import"./chunk-xp6v07f0.js";
import"./chunk-v4ypszbb.js";
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-t37nnsvj.js";
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
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/cli/bg/engines/tmux.ts
import { spawnSync } from "child_process";

class TmuxEngine {
  name = "tmux";
  supportsInteractiveInput = true;
  async available() {
    const { code } = await execFileNoThrow("tmux", ["-V"], { useCwd: false });
    return code === 0;
  }
  async start(opts) {
    const launch = buildCliLaunch(opts.args, {
      env: {
        ...opts.env,
        CLAUDE_CODE_SESSION_KIND: "bg",
        CLAUDE_CODE_SESSION_NAME: opts.sessionName,
        CLAUDE_CODE_SESSION_LOG: opts.logPath,
        CLAUDE_CODE_TMUX_SESSION: opts.sessionName
      }
    });
    const cmd = quoteCliLaunch(launch);
    const result = spawnSync("tmux", ["new-session", "-d", "-s", opts.sessionName, cmd], { stdio: "inherit", env: launch.env });
    if (result.status !== 0) {
      throw new Error("Failed to create tmux session.");
    }
    return {
      pid: 0,
      sessionName: opts.sessionName,
      logPath: opts.logPath,
      engineUsed: "tmux"
    };
  }
  async attach(session) {
    if (!session.tmuxSessionName) {
      throw new Error(`Session ${session.sessionId} has no tmux session name.`);
    }
    const result = spawnSync("tmux", ["attach-session", "-t", session.tmuxSessionName], { stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error(`Failed to attach to tmux session '${session.tmuxSessionName}'.`);
    }
  }
}
var init_tmux = __esm(() => {
  init_execFileNoThrow();
  init_cliLaunch();
});
init_tmux();

export {
  TmuxEngine
};

//# debugId=653C1901D68F3FAE64756E2164756E21
//# sourceMappingURL=chunk-hh6361ch.js.map
