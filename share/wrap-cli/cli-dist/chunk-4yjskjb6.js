// @bun
import {
  __commonJS
} from "./chunk-hhsxm2yr.js";

// node_modules/.bun/@smithy+util-uri-escape@4.2.2/node_modules/@smithy/util-uri-escape/dist-cjs/index.js
var require_dist_cjs = __commonJS((exports) => {
  var escapeUri = (uri) => encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode);
  var hexEncode = (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`;
  var escapeUriPath = (uri) => uri.split("/").map(escapeUri).join("/");
  exports.escapeUri = escapeUri;
  exports.escapeUriPath = escapeUriPath;
});

// node_modules/.bun/@smithy+querystring-builder@4.2.14/node_modules/@smithy/querystring-builder/dist-cjs/index.js
var require_dist_cjs2 = __commonJS((exports) => {
  var utilUriEscape = require_dist_cjs();
  function buildQueryString(query) {
    const parts = [];
    for (let key of Object.keys(query).sort()) {
      const value = query[key];
      key = utilUriEscape.escapeUri(key);
      if (Array.isArray(value)) {
        for (let i = 0, iLen = value.length;i < iLen; i++) {
          parts.push(`${key}=${utilUriEscape.escapeUri(value[i])}`);
        }
      } else {
        let qsEntry = key;
        if (value || typeof value === "string") {
          qsEntry += `=${utilUriEscape.escapeUri(value)}`;
        }
        parts.push(qsEntry);
      }
    }
    return parts.join("&");
  }
  exports.buildQueryString = buildQueryString;
});

export { require_dist_cjs, require_dist_cjs2 as require_dist_cjs1 };

//# debugId=63683FA4315917B564756E2164756E21
//# sourceMappingURL=chunk-4yjskjb6.js.map
