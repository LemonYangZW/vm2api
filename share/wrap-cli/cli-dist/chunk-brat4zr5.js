// @bun
import {
  getBridgeAccessToken,
  getBridgeBaseUrlOverride,
  init_bridgeConfig
} from "./chunk-nfc2mwg3.js";
import"./chunk-ghhmj79c.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-rwny7j7h.js";
import"./chunk-epvbnq43.js";
import"./chunk-h7cy00tf.js";
import"./chunk-srzb9n7s.js";
import"./chunk-6tzyv21c.js";
import"./chunk-8kf8h7xf.js";
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-psygyacq.js";
import"./chunk-e2d0hkcr.js";
import"./chunk-g2931ep0.js";
import"./chunk-vwenx8ke.js";
import"./chunk-kkpmm4b2.js";
import"./chunk-etzpfazg.js";
import"./chunk-v4ypszbb.js";
import {
  getOauthConfig,
  init_oauth
} from "./chunk-bk6ck5c2.js";
import {
  init_v4
} from "./chunk-6mdh70q0.js";
import {
  exports_external
} from "./chunk-ch92ycde.js";
import"./chunk-326zehp8.js";
import"./chunk-40t1d75v.js";
import"./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-1ekct4sm.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
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
  init_slowOperations,
  jsonStringify,
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
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// packages/builtin-tools/src/tools/BriefTool/upload.ts
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { basename, extname } from "path";
function guessMimeType(filename) {
  const ext = extname(filename).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
function debug(msg) {
  logForDebugging(`[brief:upload] ${msg}`);
}
function getBridgeBaseUrl() {
  return getBridgeBaseUrlOverride() ?? process.env.ANTHROPIC_BASE_URL ?? getOauthConfig().BASE_API_URL;
}
async function uploadBriefAttachment(fullPath, size, ctx) {
  if (true) {
    if (!ctx.replBridgeEnabled)
      return;
    if (size > MAX_UPLOAD_BYTES) {
      debug(`skip ${fullPath}: ${size} bytes exceeds ${MAX_UPLOAD_BYTES} limit`);
      return;
    }
    const token = getBridgeAccessToken();
    if (!token) {
      debug("skip: no oauth token");
      return;
    }
    let content;
    try {
      content = await readFile(fullPath);
    } catch (e) {
      debug(`read failed for ${fullPath}: ${e}`);
      return;
    }
    const baseUrl = getBridgeBaseUrl();
    const url = `${baseUrl}/api/oauth/file_upload`;
    const filename = basename(fullPath);
    const mimeType = guessMimeType(filename);
    const boundary = `----FormBoundary${randomUUID()}`;
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r
` + `Content-Disposition: form-data; name="file"; filename="${filename}"\r
` + `Content-Type: ${mimeType}\r
\r
`),
      content,
      Buffer.from(`\r
--${boundary}--\r
`)
    ]);
    try {
      const response = await axios_default.post(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length.toString()
        },
        timeout: UPLOAD_TIMEOUT_MS,
        signal: ctx.signal,
        validateStatus: () => true
      });
      if (response.status !== 201) {
        debug(`upload failed for ${fullPath}: status=${response.status} body=${jsonStringify(response.data).slice(0, 200)}`);
        return;
      }
      const parsed = uploadResponseSchema().safeParse(response.data);
      if (!parsed.success) {
        debug(`unexpected response shape for ${fullPath}: ${parsed.error.message}`);
        return;
      }
      debug(`uploaded ${fullPath} \u2192 ${parsed.data.file_uuid} (${size} bytes)`);
      return parsed.data.file_uuid;
    } catch (e) {
      debug(`upload threw for ${fullPath}: ${e}`);
      return;
    }
  }
  return;
}
var MAX_UPLOAD_BYTES, UPLOAD_TIMEOUT_MS = 30000, MIME_BY_EXT, uploadResponseSchema;
var init_upload = __esm(() => {
  init_axios();
  init_v4();
  init_bridgeConfig();
  init_oauth();
  init_debug();
  init_lazySchema();
  init_slowOperations();
  MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
  MIME_BY_EXT = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp"
  };
  uploadResponseSchema = lazySchema(() => exports_external.object({ file_uuid: exports_external.string() }));
});
init_upload();

export {
  uploadBriefAttachment
};

//# debugId=016FF8E4D9E490B564756E2164756E21
//# sourceMappingURL=chunk-brat4zr5.js.map
