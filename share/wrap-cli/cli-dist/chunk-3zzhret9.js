// @bun
import {
  getLastSessionLog,
  init_sessionStorage,
  init_teleport,
  teleportResumeCodeSession,
  validateGitState
} from "./chunk-drtrgzzb.js";
import"./chunk-14p6wvsq.js";
import"./chunk-2gpdtsfv.js";
import"./chunk-5w7gsjdj.js";
import"./chunk-28jd8qjx.js";
import"./chunk-ptxteaeh.js";
import"./chunk-jj6fzyeq.js";
import"./chunk-8t5hwwr1.js";
import"./chunk-w9t7xj87.js";
import"./chunk-hy7vb8en.js";
import"./chunk-rwsm1v0m.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-dz2qs9xd.js";
import"./chunk-wgwq4gvd.js";
import"./chunk-djt39ze3.js";
import"./chunk-27zrv1td.js";
import"./chunk-71sdcaq6.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-jrex6npe.js";
import"./chunk-f2rhkq3t.js";
import"./chunk-5cf3czgf.js";
import"./chunk-trv3gp9b.js";
import"./chunk-xp6v07f0.js";
import"./chunk-ffq9eh6d.js";
import"./chunk-v1ej8e8g.js";
import"./chunk-24kv69g3.js";
import"./chunk-2vk6e88k.js";
import"./chunk-n1j46ncq.js";
import"./chunk-17757k6c.js";
import"./chunk-jt482g7x.js";
import"./chunk-4spgkgr3.js";
import"./chunk-8wzca1dh.js";
import"./chunk-833fsr7s.js";
import"./chunk-2m7k0qdy.js";
import"./chunk-60fkafk2.js";
import"./chunk-mt660rpv.js";
import"./chunk-rmz7z6sx.js";
import"./chunk-q4dg9ftz.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-nde5ym6a.js";
import"./chunk-nmpjbggy.js";
import"./chunk-jh7kfpr9.js";
import"./chunk-wwwx7z5v.js";
import"./chunk-gt54jcxr.js";
import {
  fetchCodeSessionsFromSessionsAPI,
  init_api
} from "./chunk-ynb9erf2.js";
import"./chunk-1qgb1568.js";
import"./chunk-0jw2cfy8.js";
import"./chunk-935nrvdb.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-4b2vvevq.js";
import"./chunk-hqxp6b72.js";
import"./chunk-xjrkp6kv.js";
import"./chunk-br64j20p.js";
import"./chunk-w5hnghah.js";
import"./chunk-g6ppvq16.js";
import"./chunk-msarpzkm.js";
import"./chunk-s76nvx50.js";
import"./chunk-gb0km2ev.js";
import"./chunk-necthexa.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-k48mx8nn.js";
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
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
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
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/commands/teleport/launchTeleport.ts
function meta(s) {
  return s;
}
function formatSessionsPicker(sessions) {
  const rows = sessions.slice(0, PICKER_PAGE_CAP).map((s, i) => {
    const idx = String(i + 1).padStart(2);
    const title = s.title.slice(0, 50).padEnd(50);
    const status = s.status.padEnd(14);
    const created = s.created_at.slice(0, 10);
    return `  ${idx}. ${title}  ${status}  ${created}  id=${s.id}`;
  });
  return [
    "## Available sessions (most recent first)",
    "",
    ...rows,
    "",
    "Run `/teleport <session-id>` to resume a session."
  ].join(`
`);
}
var SESSION_ID_MIN_LENGTH = 8, PICKER_PAGE_CAP = 20, callTeleport = async (onDone, context, args) => {
  const rawArgs = args.trim();
  const isPrintMode = rawArgs === "--print" || rawArgs.startsWith("--print ");
  const sessionId = isPrintMode ? rawArgs.replace(/^--print\s*/, "").trim() : rawArgs;
  logEvent("tengu_teleport_started", {
    has_session_id: meta(sessionId ? "true" : "false")
  });
  if (!sessionId) {
    logEvent("tengu_teleport_source_decision", {
      source: meta("sessions_api")
    });
    let sessions;
    try {
      const raw = await fetchCodeSessionsFromSessionsAPI();
      sessions = raw.map((s) => ({
        id: s.id,
        title: s.title ?? "Untitled",
        status: s.status ?? "unknown",
        created_at: s.created_at ?? ""
      }));
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      if (/forbidden|401|403/i.test(msg)) {
        logEvent("tengu_teleport_events_fetch_forbidden", {
          error: meta(msg.slice(0, 200))
        });
        onDone("Teleport: permission denied fetching sessions. Check your OAuth token (`claude auth status`).", { display: "system" });
        return null;
      }
      if (/not found|404/i.test(msg)) {
        logEvent("tengu_teleport_events_fetch_not_found", {
          error: meta(msg.slice(0, 200))
        });
        onDone("Teleport: sessions endpoint returned 404. The Sessions API may not be available for your account.", { display: "system" });
        return null;
      }
      if (/token|unauthorized/i.test(msg)) {
        logEvent("tengu_teleport_error_bad_token", {
          error: meta(msg.slice(0, 200))
        });
        onDone(`Teleport: authentication error \u2014 ${msg}. Try \`claude auth login\`.`, { display: "system" });
        return null;
      }
      logEvent("tengu_teleport_events_fetch_fail", {
        error: meta(msg.slice(0, 200))
      });
      onDone(`Teleport: failed to fetch sessions \u2014 ${msg}.
Usage: /teleport SESSION_ID`, { display: "system" });
      return null;
    }
    if (sessions.length === 0) {
      logEvent("tengu_teleport_null", {});
      onDone(`No active sessions found on claude.ai/code.
Start a new session at https://claude.ai/code`, { display: "system" });
      return null;
    }
    if (sessions.length >= PICKER_PAGE_CAP) {
      logEvent("tengu_teleport_page_cap", {
        count: meta(String(sessions.length))
      });
    }
    const pickerText = formatSessionsPicker(sessions);
    if (isPrintMode) {
      onDone(pickerText, { display: "system" });
      return null;
    }
    onDone(pickerText, { display: "system" });
    return null;
  }
  if (sessionId.length < SESSION_ID_MIN_LENGTH || !/^[0-9a-f-]{8,}$/i.test(sessionId)) {
    logEvent("tengu_teleport_error_bad_status", {
      error: meta(`invalid_session_id: ${sessionId.slice(0, 40)}`)
    });
    onDone(`Invalid session id "${sessionId}". Expected a UUID-like string (e.g. 12345678-abcd-...).`, { display: "system" });
    return null;
  }
  logEvent("tengu_teleport_source_decision", { source: meta("explicit_id") });
  const steps = [];
  const recordStep = (step) => {
    steps.push(step);
  };
  recordStep("validate");
  try {
    await validateGitState();
  } catch (gErr) {
    const msg = gErr instanceof Error ? gErr.message : String(gErr);
    logEvent("tengu_teleport_errors_detected", {
      error: meta(msg.slice(0, 200))
    });
    onDone(`Cannot teleport: ${msg}`, { display: "system" });
    return null;
  }
  recordStep("resume");
  try {
    let lastProgress = "";
    await teleportResumeCodeSession(sessionId, (stage) => {
      lastProgress = String(stage);
    });
    logEvent("tengu_teleport_resume_session", {
      stage: meta(lastProgress)
    });
    recordStep("ready");
    if (!context.resume) {
      logEvent("tengu_teleport_null", {});
      if (isPrintMode) {
        onDone(`Session ${sessionId} fetched successfully.`, {
          display: "system"
        });
        return null;
      }
      onDone(`Teleport resume succeeded for ${sessionId}, but the REPL did not provide a resume callback.`, { display: "system" });
      return null;
    }
    recordStep("fetch");
    const log = await getLastSessionLog(sessionId);
    if (!log) {
      logEvent("tengu_teleport_errors_detected", {
        error: meta("log_not_found_after_resume")
      });
      onDone(`Teleport fetched session ${sessionId} but the local log was not found. Try /resume ${sessionId} manually.`, { display: "system" });
      return null;
    }
    logEvent("tengu_teleport_errors_resolved", {});
    await context.resume(sessionId, log, "slash_command_session_id");
    logEvent("tengu_teleport_first_message_success", {});
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    let evt = "tengu_teleport_failed";
    if (/not found/i.test(msg)) {
      evt = "tengu_teleport_error_session_not_found_";
    } else if (/repo.*mismatch/i.test(msg)) {
      evt = "tengu_teleport_error_repo_mismatch_sessions_api";
    } else if (/not in.*git|git.*dir/i.test(msg)) {
      evt = "tengu_teleport_error_repo_not_in_git_dir_sessions_api";
    } else if (/cancelled|aborted/i.test(msg)) {
      evt = "tengu_teleport_cancelled";
    } else if (/token|unauthorized|401/i.test(msg)) {
      evt = "tengu_teleport_error_bad_token";
    } else if (/status|4\d\d|5\d\d/i.test(msg)) {
      evt = "tengu_teleport_error_bad_status";
    }
    logEvent(evt, { error: meta(msg.slice(0, 200)) });
    logEvent("tengu_teleport_first_message_error", {
      error: meta(msg.slice(0, 200))
    });
    onDone(`Teleport failed: ${msg}`, { display: "system" });
    return null;
  }
};
var init_launchTeleport = __esm(() => {
  init_analytics();
  init_sessionStorage();
  init_teleport();
  init_api();
});
init_launchTeleport();

export {
  callTeleport
};

//# debugId=1C45245B3D4A112D64756E2164756E21
//# sourceMappingURL=chunk-3zzhret9.js.map
