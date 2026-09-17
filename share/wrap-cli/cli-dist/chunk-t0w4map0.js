// @bun
import {
  distRoot,
  init_distRoot
} from "./chunk-djt39ze3.js";
import {
  getChicagoCoordinateMode,
  init_gates
} from "./chunk-br64j20p.js";
import {
  buildComputerUseTools,
  init_src
} from "./chunk-s76nvx50.js";
import {
  buildMcpToolName,
  init_mcpStringUtils
} from "./chunk-necthexa.js";
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
import {
  CLI_CU_CAPABILITIES,
  COMPUTER_USE_MCP_SERVER_NAME,
  init_common
} from "./chunk-g2931ep0.js";
import"./chunk-vwenx8ke.js";
import"./chunk-kkpmm4b2.js";
import"./chunk-etzpfazg.js";
import {
  init_bundledMode,
  isInBundledMode
} from "./chunk-v4ypszbb.js";
import"./chunk-bk6ck5c2.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
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
import"./chunk-hhsxm2yr.js";

// src/utils/computerUse/setup.ts
init_src();
init_mcpStringUtils();
init_bundledMode();
init_distRoot();
init_common();
init_gates();
import { join } from "path";
function setupComputerUseMCP() {
  const allowedTools = buildComputerUseTools(CLI_CU_CAPABILITIES, getChicagoCoordinateMode()).map((t) => buildMcpToolName(COMPUTER_USE_MCP_SERVER_NAME, t.name));
  const args = isInBundledMode() ? ["--computer-use-mcp"] : [join(distRoot, "cli.js"), "--computer-use-mcp"];
  return {
    mcpConfig: {
      [COMPUTER_USE_MCP_SERVER_NAME]: {
        type: "stdio",
        command: process.execPath,
        args,
        scope: "dynamic"
      }
    },
    allowedTools
  };
}
export {
  setupComputerUseMCP
};

//# debugId=49160137D4A8341964756E2164756E21
//# sourceMappingURL=chunk-t0w4map0.js.map
