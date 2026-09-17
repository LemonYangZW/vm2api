// @bun
import {
  extractDescriptionFromMarkdown,
  getProjectDirsUpToHome,
  init_frontmatterParser,
  init_markdownConfigLoader,
  parseFrontmatter
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
import {
  getClaudeConfigHomeDir,
  init_envUtils
} from "./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/jobs/templates.ts
import { readdirSync, readFileSync } from "fs";
import { join, basename } from "path";
function getTemplatesDirs() {
  const projectDirs = getProjectDirsUpToHome("templates", process.cwd());
  const userDir = join(getClaudeConfigHomeDir(), "templates");
  try {
    readdirSync(userDir);
    return [...projectDirs, userDir];
  } catch {
    return projectDirs;
  }
}
function listTemplates() {
  const templates = [];
  const seenNames = new Set;
  for (const dir of getTemplatesDirs()) {
    let files;
    try {
      files = readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith(".md"))
        continue;
      const name = basename(file, ".md");
      if (seenNames.has(name))
        continue;
      seenNames.add(name);
      const filePath = join(dir, file);
      try {
        const raw = readFileSync(filePath, "utf-8");
        const { frontmatter, content } = parseFrontmatter(raw, filePath);
        const description = (typeof frontmatter.description === "string" ? frontmatter.description : "") || extractDescriptionFromMarkdown(content, "No description");
        templates.push({ name, description, filePath, frontmatter, content });
      } catch {}
    }
  }
  return templates;
}
function loadTemplate(name) {
  const all = listTemplates();
  return all.find((t) => t.name === name) ?? null;
}
var init_templates = __esm(() => {
  init_frontmatterParser();
  init_envUtils();
  init_markdownConfigLoader();
});

// src/jobs/state.ts
import { appendFileSync, mkdirSync, readFileSync as readFileSync2, writeFileSync } from "fs";
import { join as join2 } from "path";
function getJobsDir() {
  return join2(getClaudeConfigHomeDir(), "jobs");
}
function getJobDir(jobId) {
  return join2(getJobsDir(), jobId);
}
function createJob(jobId, templateName, templateContent, inputText, args) {
  const dir = getJobDir(jobId);
  mkdirSync(dir, { recursive: true });
  const now = new Date().toISOString();
  const state = {
    jobId,
    templateName,
    createdAt: now,
    updatedAt: now,
    status: "created",
    args
  };
  writeFileSync(join2(dir, "state.json"), JSON.stringify(state, null, 2), "utf-8");
  writeFileSync(join2(dir, "template.md"), templateContent, "utf-8");
  writeFileSync(join2(dir, "input.txt"), inputText, "utf-8");
  return dir;
}
function readJobState(jobId) {
  try {
    const raw = readFileSync2(join2(getJobDir(jobId), "state.json"), "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null)
      return null;
    const obj = parsed;
    if (typeof obj.jobId !== "string" || typeof obj.status !== "string") {
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}
function appendJobReply(jobId, text) {
  const dir = getJobDir(jobId);
  const state = readJobState(jobId);
  if (!state)
    return false;
  const repliesPath = join2(dir, "replies.jsonl");
  const entry = JSON.stringify({
    text,
    timestamp: new Date().toISOString()
  });
  try {
    appendFileSync(repliesPath, entry + `
`, "utf-8");
  } catch {
    writeFileSync(repliesPath, entry + `
`, "utf-8");
  }
  const updated = { ...state, updatedAt: new Date().toISOString() };
  writeFileSync(join2(dir, "state.json"), JSON.stringify(updated, null, 2), "utf-8");
  return true;
}
var init_state = __esm(() => {
  init_envUtils();
});

// src/cli/handlers/templateJobs.ts
import { randomUUID } from "crypto";
async function templatesMain(args) {
  const subcommand = args[0];
  switch (subcommand) {
    case "list":
      handleList();
      break;
    case "new":
      handleNew(args.slice(1));
      break;
    case "reply":
      handleReply(args.slice(1));
      break;
    case "status":
      handleStatus(args.slice(1));
      break;
    default:
      console.error(`Unknown template command: ${subcommand}`);
      printUsage();
      process.exitCode = 1;
  }
}
function printUsage() {
  console.log(`
Template Job Commands:

  claude job list                    List available templates
  claude job new <template> [args]   Create a new job from a template
  claude job reply <job-id> <text>   Reply to an existing job
  claude job status <job-id>         Show job status
`);
}
function handleStatus(args) {
  const jobId = args[0];
  if (!jobId) {
    console.error("Usage: claude job status <job-id>");
    process.exitCode = 1;
    return;
  }
  const state = readJobState(jobId);
  if (!state) {
    console.error(`Job not found: ${jobId}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Job: ${state.jobId}`);
  console.log(`  Template: ${state.templateName}`);
  console.log(`  Status: ${state.status}`);
  console.log(`  Created: ${state.createdAt}`);
  console.log(`  Updated: ${state.updatedAt}`);
  console.log(`  Args: ${state.args.join(" ") || "(none)"}`);
}
function handleList() {
  const templates = listTemplates();
  if (templates.length === 0) {
    console.log("No templates found.");
    console.log("Place .md files in .claude/templates/ or ~/.claude/templates/");
    return;
  }
  console.log(`${templates.length} template${templates.length > 1 ? "s" : ""} found:
`);
  for (const t of templates) {
    console.log(`  ${t.name}`);
    console.log(`    ${t.description}`);
    console.log(`    Path: ${t.filePath}`);
    console.log();
  }
}
function handleNew(args) {
  const templateName = args[0];
  if (!templateName) {
    console.error("Usage: claude job new <template> [args...]");
    process.exitCode = 1;
    return;
  }
  const template = loadTemplate(templateName);
  if (!template) {
    console.error(`Template not found: ${templateName}`);
    console.log(`
Available templates:`);
    for (const t of listTemplates()) {
      console.log(`  ${t.name}`);
    }
    process.exitCode = 1;
    return;
  }
  const jobId = randomUUID().slice(0, 8);
  const inputText = args.slice(1).join(" ");
  const rawContent = `---
${Object.entries(template.frontmatter).map(([k, v]) => `${k}: ${v}`).join(`
`)}
---
${template.content}`;
  const dir = createJob(jobId, templateName, rawContent, inputText, args.slice(1));
  console.log(`Job created: ${jobId}`);
  console.log(`  Template: ${templateName}`);
  console.log(`  Directory: ${dir}`);
  if (inputText) {
    console.log(`  Input: ${inputText}`);
  }
}
function handleReply(args) {
  const jobId = args[0];
  const text = args.slice(1).join(" ");
  if (!jobId || !text) {
    console.error("Usage: claude job reply <job-id> <text>");
    process.exitCode = 1;
    return;
  }
  const state = readJobState(jobId);
  if (!state) {
    console.error(`Job not found: ${jobId}`);
    process.exitCode = 1;
    return;
  }
  const ok = appendJobReply(jobId, text);
  if (ok) {
    console.log(`Reply added to job ${jobId}`);
    console.log(`  Directory: ${getJobDir(jobId)}`);
  } else {
    console.error(`Failed to append reply to job ${jobId}`);
    process.exitCode = 1;
  }
}
var init_templateJobs = __esm(() => {
  init_templates();
  init_state();
});
init_templateJobs();

export {
  templatesMain
};

//# debugId=E16DAD1A93F5A7C564756E2164756E21
//# sourceMappingURL=chunk-gyhwrsg9.js.map
