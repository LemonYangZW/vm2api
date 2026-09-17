// @bun
import {
  JSONRPCMessageSchema,
  init_types
} from "./chunk-ym6j0wv1.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// node_modules/.bun/@modelcontextprotocol+sdk@1.29.0/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/stdio.js
class ReadBuffer {
  append(chunk) {
    this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
  }
  readMessage() {
    if (!this._buffer) {
      return null;
    }
    const index = this._buffer.indexOf(`
`);
    if (index === -1) {
      return null;
    }
    const line = this._buffer.toString("utf8", 0, index).replace(/\r$/, "");
    this._buffer = this._buffer.subarray(index + 1);
    return deserializeMessage(line);
  }
  clear() {
    this._buffer = undefined;
  }
}
function deserializeMessage(line) {
  return JSONRPCMessageSchema.parse(JSON.parse(line));
}
function serializeMessage(message) {
  return JSON.stringify(message) + `
`;
}
var init_stdio = __esm(() => {
  init_types();
});

export { ReadBuffer, serializeMessage, init_stdio };

//# debugId=FCA5769CABD793EB64756E2164756E21
//# sourceMappingURL=chunk-w5hnghah.js.map
