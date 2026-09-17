// @bun
import {
  require_execAsync
} from "./chunk-c17f0h2s.js";
import {
  require_src
} from "./chunk-e3abfxpy.js";
import {
  __commonJS
} from "./chunk-hhsxm2yr.js";

// node_modules/.bun/@opentelemetry+resources@2.7.0+e40b0dfdd726a224/node_modules/@opentelemetry/resources/build/src/detectors/platform/node/machine-id/getMachineId-darwin.js
var require_getMachineId_darwin = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getMachineId = undefined;
  var execAsync_1 = require_execAsync();
  var api_1 = require_src();
  async function getMachineId() {
    try {
      const result = await (0, execAsync_1.execAsync)('ioreg -rd1 -c "IOPlatformExpertDevice"');
      const idLine = result.stdout.split(`
`).find((line) => line.includes("IOPlatformUUID"));
      if (!idLine) {
        return;
      }
      const parts = idLine.split('" = "');
      if (parts.length === 2) {
        return parts[1].slice(0, -1);
      }
    } catch (e) {
      api_1.diag.debug(`error reading machine id: ${e}`);
    }
    return;
  }
  exports.getMachineId = getMachineId;
});
export default require_getMachineId_darwin();

//# debugId=E5267D2C1B3A9A0664756E2164756E21
//# sourceMappingURL=chunk-ybk37qp9.js.map
