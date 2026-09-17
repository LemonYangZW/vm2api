// @bun
import {
  init_registry,
  registerITermBackend
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
import {
  IT2_COMMAND,
  init_detection,
  isInITerm2,
  isIt2CliAvailable
} from "./chunk-0jw2cfy8.js";
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
import"./chunk-rwny7j7h.js";
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
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-t37nnsvj.js";
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

// src/utils/swarm/backends/ITermBackend.ts
function acquirePaneCreationLock() {
  let release;
  const newLock = new Promise((resolve) => {
    release = resolve;
  });
  const previousLock = paneCreationLock;
  paneCreationLock = newLock;
  return previousLock.then(() => release);
}
function runIt2(args) {
  return execFileNoThrow(IT2_COMMAND, args);
}
function parseSplitOutput(output) {
  const match = output.match(/Created new pane:\s*(.+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return "";
}
function getLeaderSessionId() {
  const itermSessionId = process.env.ITERM_SESSION_ID;
  if (!itermSessionId) {
    return null;
  }
  const colonIndex = itermSessionId.indexOf(":");
  if (colonIndex === -1) {
    return null;
  }
  return itermSessionId.slice(colonIndex + 1);
}

class ITermBackend {
  type = "iterm2";
  displayName = "iTerm2";
  supportsHideShow = false;
  async isAvailable() {
    const inITerm2 = isInITerm2();
    logForDebugging(`[ITermBackend] isAvailable check: inITerm2=${inITerm2}`);
    if (!inITerm2) {
      logForDebugging("[ITermBackend] isAvailable: false (not in iTerm2)");
      return false;
    }
    const it2Available = await isIt2CliAvailable();
    logForDebugging(`[ITermBackend] isAvailable: ${it2Available} (it2 CLI ${it2Available ? "found" : "not found"})`);
    return it2Available;
  }
  async isRunningInside() {
    const result = isInITerm2();
    logForDebugging(`[ITermBackend] isRunningInside: ${result}`);
    return result;
  }
  async createTeammatePaneInSwarmView(name, color) {
    logForDebugging(`[ITermBackend] createTeammatePaneInSwarmView called for ${name} with color ${color}`);
    const releaseLock = await acquirePaneCreationLock();
    try {
      while (true) {
        const isFirstTeammate = !firstPaneUsed;
        logForDebugging(`[ITermBackend] Creating pane: isFirstTeammate=${isFirstTeammate}, existingPanes=${teammateSessionIds.length}`);
        let splitArgs;
        let targetedTeammateId;
        if (isFirstTeammate) {
          const leaderSessionId = getLeaderSessionId();
          if (leaderSessionId) {
            splitArgs = ["session", "split", "-v", "-s", leaderSessionId];
            logForDebugging(`[ITermBackend] First split from leader session: ${leaderSessionId}`);
          } else {
            splitArgs = ["session", "split", "-v"];
            logForDebugging("[ITermBackend] First split from active session (no leader ID)");
          }
        } else {
          targetedTeammateId = teammateSessionIds[teammateSessionIds.length - 1];
          if (targetedTeammateId) {
            splitArgs = ["session", "split", "-s", targetedTeammateId];
            logForDebugging(`[ITermBackend] Subsequent split from teammate session: ${targetedTeammateId}`);
          } else {
            splitArgs = ["session", "split"];
            logForDebugging("[ITermBackend] Subsequent split from active session (no teammate ID)");
          }
        }
        const splitResult = await runIt2(splitArgs);
        if (splitResult.code !== 0) {
          if (targetedTeammateId) {
            const listResult = await runIt2(["session", "list"]);
            if (listResult.code === 0 && !listResult.stdout.includes(targetedTeammateId)) {
              logForDebugging(`[ITermBackend] Split failed targeting dead session ${targetedTeammateId}, pruning and retrying: ${splitResult.stderr}`);
              const idx = teammateSessionIds.indexOf(targetedTeammateId);
              if (idx !== -1) {
                teammateSessionIds.splice(idx, 1);
              }
              if (teammateSessionIds.length === 0) {
                firstPaneUsed = false;
              }
              continue;
            }
          }
          throw new Error(`Failed to create iTerm2 split pane: ${splitResult.stderr}`);
        }
        if (isFirstTeammate) {
          firstPaneUsed = true;
        }
        const paneId = parseSplitOutput(splitResult.stdout);
        if (!paneId) {
          throw new Error(`Failed to parse session ID from split output: ${splitResult.stdout}`);
        }
        logForDebugging(`[ITermBackend] Created teammate pane for ${name}: ${paneId}`);
        teammateSessionIds.push(paneId);
        return { paneId, isFirstTeammate };
      }
    } finally {
      releaseLock();
    }
  }
  async sendCommandToPane(paneId, command, _useExternalSession) {
    const args = paneId ? ["session", "run", "-s", paneId, command] : ["session", "run", command];
    const result = await runIt2(args);
    if (result.code !== 0) {
      throw new Error(`Failed to send command to iTerm2 pane ${paneId}: ${result.stderr}`);
    }
  }
  async setPaneBorderColor(_paneId, _color, _useExternalSession) {}
  async setPaneTitle(_paneId, _name, _color, _useExternalSession) {}
  async enablePaneBorderStatus(_windowTarget, _useExternalSession) {}
  async rebalancePanes(_windowTarget, _hasLeader) {
    logForDebugging("[ITermBackend] Pane rebalancing not implemented for iTerm2");
  }
  async killPane(paneId, _useExternalSession) {
    const result = await runIt2(["session", "close", "-f", "-s", paneId]);
    const idx = teammateSessionIds.indexOf(paneId);
    if (idx !== -1) {
      teammateSessionIds.splice(idx, 1);
    }
    if (teammateSessionIds.length === 0) {
      firstPaneUsed = false;
    }
    return result.code === 0;
  }
  async hidePane(_paneId, _useExternalSession) {
    logForDebugging("[ITermBackend] hidePane not supported in iTerm2");
    return false;
  }
  async showPane(_paneId, _targetWindowOrPane, _useExternalSession) {
    logForDebugging("[ITermBackend] showPane not supported in iTerm2");
    return false;
  }
}
var teammateSessionIds, firstPaneUsed = false, paneCreationLock;
var init_ITermBackend = __esm(() => {
  init_debug();
  init_execFileNoThrow();
  init_detection();
  init_registry();
  teammateSessionIds = [];
  paneCreationLock = Promise.resolve();
  registerITermBackend(ITermBackend);
});
init_ITermBackend();

export {
  ITermBackend
};

//# debugId=3B292556E66D492E64756E2164756E21
//# sourceMappingURL=chunk-mzzshjs4.js.map
