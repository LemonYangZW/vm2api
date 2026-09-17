// @bun
import {
  getRecentActivity,
  init_logoV2Utils
} from "./chunk-kja1nnnq.js";
import"./chunk-31s8k5ha.js";
import"./chunk-drtrgzzb.js";
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
import {
  createTask,
  getTask,
  getTasksDir,
  init_tasks,
  listTasks,
  updateTask
} from "./chunk-dz2qs9xd.js";
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
import"./chunk-ynb9erf2.js";
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
import {
  __require
} from "./chunk-hhsxm2yr.js";

// src/cli/handlers/ant.ts
init_tasks();
init_logoV2Utils();
var DEFAULT_LIST = "default";
async function taskCreateHandler(subject, opts) {
  const listId = opts.list || DEFAULT_LIST;
  const id = await createTask(listId, {
    subject,
    description: opts.description || "",
    status: "pending",
    blocks: [],
    blockedBy: []
  });
  console.log(`Created task ${id}: ${subject}`);
}
async function taskListHandler(opts) {
  const listId = opts.list || DEFAULT_LIST;
  let tasks = await listTasks(listId);
  if (opts.pending) {
    tasks = tasks.filter((t) => t.status === "pending");
  }
  if (opts.json) {
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }
  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }
  for (const t of tasks) {
    console.log(`  [${t.status}] ${t.id}: ${t.subject}`);
    if (t.description)
      console.log(`    ${t.description}`);
    if (t.owner)
      console.log(`    owner: ${t.owner}`);
  }
}
async function taskGetHandler(id, opts) {
  const listId = opts.list || DEFAULT_LIST;
  const task = await getTask(listId, id);
  if (!task) {
    console.error(`Task not found: ${id}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(task, null, 2));
}
async function taskUpdateHandler(id, opts) {
  const listId = opts.list || DEFAULT_LIST;
  const updates = {};
  if (opts.status)
    updates.status = opts.status;
  if (opts.subject)
    updates.subject = opts.subject;
  if (opts.description)
    updates.description = opts.description;
  if (opts.owner)
    updates.owner = opts.owner;
  if (opts.clearOwner)
    updates.owner = undefined;
  const task = await updateTask(listId, id, updates);
  if (!task) {
    console.error(`Task not found: ${id}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Updated task ${id}: [${task.status}] ${task.subject}`);
}
async function taskDirHandler(opts) {
  const listId = opts.list || DEFAULT_LIST;
  console.log(getTasksDir(listId));
}
async function logHandler(logId) {
  const logs = await getRecentActivity();
  if (logId === undefined) {
    if (logs.length === 0) {
      console.log("No recent sessions.");
      return;
    }
    for (let i = 0;i < Math.min(logs.length, 20); i++) {
      const log2 = logs[i];
      const date = log2.modified ? new Date(log2.modified).toLocaleString() : "unknown";
      const title = log2.title || log2.sessionId || "untitled";
      console.log(`  ${i}: ${title}  (${date})`);
    }
    return;
  }
  const idx = typeof logId === "string" ? parseInt(logId, 10) : logId;
  const log = Number.isFinite(idx) && idx >= 0 && idx < logs.length ? logs[idx] : logs.find((l) => l.sessionId === String(logId));
  if (!log) {
    console.error(`Session not found: ${logId}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(log, null, 2));
}
async function errorHandler(num) {
  const logs = await getRecentActivity();
  const count = num ?? 5;
  console.log(`Last ${count} sessions:`);
  for (let i = 0;i < Math.min(count, logs.length); i++) {
    const log = logs[i];
    const date = log.modified ? new Date(log.modified).toLocaleString() : "unknown";
    console.log(`  ${i}: ${log.sessionId}  (${date})`);
  }
}
async function exportHandler(source, outputFile) {
  const { writeFile, readFile } = await import("fs/promises");
  const logs = await getRecentActivity();
  const idx = parseInt(source, 10);
  let log;
  if (Number.isFinite(idx) && idx >= 0 && idx < logs.length) {
    log = logs[idx];
  } else {
    log = logs.find((l) => l.sessionId === source);
  }
  if (!log) {
    try {
      const content = await readFile(source, "utf-8");
      await writeFile(outputFile, content, "utf-8");
      console.log(`Exported ${source} \u2192 ${outputFile}`);
      return;
    } catch {
      console.error(`Source not found: ${source}`);
      process.exitCode = 1;
      return;
    }
  }
  await writeFile(outputFile, JSON.stringify(log, null, 2), "utf-8");
  console.log(`Exported session ${log.sessionId} \u2192 ${outputFile}`);
}
async function completionHandler(shell, opts, _program) {
  const { regenerateCompletionCache } = await import("./chunk-s3m3wrah.js");
  if (opts.output) {
    await regenerateCompletionCache();
    console.log(`Completion cache regenerated for ${shell}.`);
  } else {
    await regenerateCompletionCache();
    console.log(`Completion cache regenerated for ${shell}.`);
  }
}
export {
  taskUpdateHandler,
  taskListHandler,
  taskGetHandler,
  taskDirHandler,
  taskCreateHandler,
  logHandler,
  exportHandler,
  errorHandler,
  completionHandler
};

//# debugId=A1D896CE74ED1DF464756E2164756E21
//# sourceMappingURL=chunk-nebdssjx.js.map
