// @bun
import {
  McpStdioServerConfigSchema,
  init_json,
  init_types,
  safeParseJSON
} from "./chunk-73g8bk52.js";
import"./chunk-bgan4cpf.js";
import {
  SUPPORTED_PLATFORMS,
  getPlatform,
  init_platform
} from "./chunk-psygyacq.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-ye35qwfx.js";
import"./chunk-e3j7m7k2.js";
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
import"./chunk-m28vg9w4.js";
import {
  getErrnoCode,
  init_errors
} from "./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-hhsxm2yr.js";

// src/utils/claudeDesktop.ts
init_types();
init_errors();
init_json();
init_log();
init_platform();
import { readdir, readFile, stat } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
async function getClaudeDesktopConfigPath() {
  const platform = getPlatform();
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    throw new Error(`Unsupported platform: ${platform} - Claude Desktop integration only works on macOS and WSL.`);
  }
  if (platform === "macos") {
    return join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  const windowsHome = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : null;
  if (windowsHome) {
    const wslPath = windowsHome.replace(/^[A-Z]:/, "");
    const configPath = `/mnt/c${wslPath}/AppData/Roaming/Claude/claude_desktop_config.json`;
    try {
      await stat(configPath);
      return configPath;
    } catch {}
  }
  try {
    const usersDir = "/mnt/c/Users";
    try {
      const userDirs = await readdir(usersDir, { withFileTypes: true });
      for (const user of userDirs) {
        if (user.name === "Public" || user.name === "Default" || user.name === "Default User" || user.name === "All Users") {
          continue;
        }
        const potentialConfigPath = join(usersDir, user.name, "AppData", "Roaming", "Claude", "claude_desktop_config.json");
        try {
          await stat(potentialConfigPath);
          return potentialConfigPath;
        } catch {}
      }
    } catch {}
  } catch (dirError) {
    logError(dirError);
  }
  throw new Error("Could not find Claude Desktop config file in Windows. Make sure Claude Desktop is installed on Windows.");
}
async function readClaudeDesktopMcpServers() {
  if (!SUPPORTED_PLATFORMS.includes(getPlatform())) {
    throw new Error("Unsupported platform - Claude Desktop integration only works on macOS and WSL.");
  }
  try {
    const configPath = await getClaudeDesktopConfigPath();
    let configContent;
    try {
      configContent = await readFile(configPath, { encoding: "utf8" });
    } catch (e) {
      const code = getErrnoCode(e);
      if (code === "ENOENT") {
        return {};
      }
      throw e;
    }
    const config = safeParseJSON(configContent);
    if (!config || typeof config !== "object") {
      return {};
    }
    const mcpServers = config.mcpServers;
    if (!mcpServers || typeof mcpServers !== "object") {
      return {};
    }
    const servers = {};
    for (const [name, serverConfig] of Object.entries(mcpServers)) {
      if (!serverConfig || typeof serverConfig !== "object") {
        continue;
      }
      const result = McpStdioServerConfigSchema().safeParse(serverConfig);
      if (result.success) {
        servers[name] = result.data;
      }
    }
    return servers;
  } catch (error) {
    logError(error);
    return {};
  }
}
export {
  readClaudeDesktopMcpServers,
  getClaudeDesktopConfigPath
};

//# debugId=01CFC6201760943864756E2164756E21
//# sourceMappingURL=chunk-w9pb0ewq.js.map
