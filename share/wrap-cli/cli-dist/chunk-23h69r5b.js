// @bun
import {
  require_src
} from "./chunk-e3abfxpy.js";
import {
  __commonJS,
  __require
} from "./chunk-hhsxm2yr.js";

// node_modules/.bun/@opentelemetry+resources@2.7.0+e40b0dfdd726a224/node_modules/@opentelemetry/resources/build/src/detectors/platform/node/machine-id/getMachineId-linux.js
var require_getMachineId_linux = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getMachineId = undefined;
  var fs_1 = __require("fs");
  var api_1 = require_src();
  async function getMachineId() {
    const paths = ["/etc/machine-id", "/var/lib/dbus/machine-id"];
    for (const path of paths) {
      try {
        const result = await fs_1.promises.readFile(path, { encoding: "utf8" });
        return result.trim();
      } catch (e) {
        api_1.diag.debug(`error reading machine id: ${e}`);
      }
    }
    return;
  }
  exports.getMachineId = getMachineId;
});
export default require_getMachineId_linux();

//# debugId=5A2D10E059D1AF6A64756E2164756E21
//# sourceMappingURL=chunk-23h69r5b.js.map
