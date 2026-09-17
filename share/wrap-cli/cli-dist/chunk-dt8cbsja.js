// @bun
import {
  init_claudemd,
  init_withRetry
} from "./chunk-92frfsdm.js";
import {
  init_auth,
  init_config1 as init_config,
  init_growthbook,
  init_internalWrites,
  init_providers,
  init_settings1 as init_settings,
  init_userAgent
} from "./chunk-ghhmj79c.js";
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import {
  init_sleep
} from "./chunk-jmv7k0jn.js";
import {
  init_oauth
} from "./chunk-bk6ck5c2.js";
import {
  init_v4
} from "./chunk-6mdh70q0.js";
import {
  exports_external
} from "./chunk-ch92ycde.js";
import {
  init_analytics
} from "./chunk-j1mep9ck.js";
import {
  init_diagLogs,
  init_git
} from "./chunk-3yga13e5.js";
import {
  init_errors
} from "./chunk-82pkdrt0.js";
import {
  init_settingsCache,
  init_state
} from "./chunk-v4e7ch76.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/settingsSync/types.ts
var UserSyncContentSchema, UserSyncDataSchema;
var init_types = __esm(() => {
  init_v4();
  init_lazySchema();
  UserSyncContentSchema = lazySchema(() => exports_external.object({
    entries: exports_external.record(exports_external.string(), exports_external.string())
  }));
  UserSyncDataSchema = lazySchema(() => exports_external.object({
    userId: exports_external.string(),
    version: exports_external.number(),
    lastModified: exports_external.string(),
    checksum: exports_external.string(),
    content: UserSyncContentSchema()
  }));
});

// src/services/settingsSync/index.ts
var MAX_FILE_SIZE_BYTES;
var init_settingsSync = __esm(() => {
  init_state();
  init_oauth();
  init_auth();
  init_claudemd();
  init_config();
  init_diagLogs();
  init_errors();
  init_git();
  init_providers();
  init_internalWrites();
  init_settings();
  init_settingsCache();
  init_sleep();
  init_userAgent();
  init_growthbook();
  init_analytics();
  init_withRetry();
  init_types();
  MAX_FILE_SIZE_BYTES = 500 * 1024;
});

export { init_settingsSync };

//# debugId=5DCC885E21639DA864756E2164756E21
//# sourceMappingURL=chunk-dt8cbsja.js.map
