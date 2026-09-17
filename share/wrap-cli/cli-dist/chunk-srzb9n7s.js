// @bun
import {
  getPlatform,
  init_platform
} from "./chunk-psygyacq.js";
import {
  init_memoize as init_memoize2,
  memoizeWithLRU
} from "./chunk-ye35qwfx.js";
import {
  getCwd,
  init_cwd
} from "./chunk-ew28k9dk.js";
import {
  execSync_DEPRECATED,
  init_execSyncWrapper
} from "./chunk-w8n8j7aw.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/windowsPaths.ts
import { existsSync } from "fs";
import * as pathWin32 from "path/win32";
function setShellIfWindows() {
  if (getPlatform() === "windows") {
    const gitBashPath = findGitBashPath();
    process.env.SHELL = gitBashPath;
    process.env.CLAUDE_CODE_GIT_BASH_PATH = gitBashPath;
    logForDebugging(`Using bash path: "${gitBashPath}"`);
  }
}
function searchDefaultBashLocations(checkExists, userProfile) {
  const candidates = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\usr\\bin\\bash.exe"
  ];
  if (userProfile) {
    candidates.push(`${userProfile}\\scoop\\apps\\git\\current\\usr\\bin\\bash.exe`);
  }
  for (const candidate of candidates) {
    if (checkExists(candidate)) {
      return candidate;
    }
  }
  return null;
}
function findExecutableWithDeps(executable, deps) {
  if (executable === "git") {
    const defaultLocations = [
      "C:\\Program Files\\Git\\cmd\\git.exe",
      "C:\\Program Files (x86)\\Git\\cmd\\git.exe"
    ];
    for (const location of defaultLocations) {
      if (deps.checkExists(location)) {
        return location;
      }
    }
  }
  try {
    const result = deps.execCommand(`where.exe ${executable}`);
    const paths = result.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
    const cwd = pathWin32.resolve(deps.cwdFn()).toLowerCase();
    for (const candidatePath of paths) {
      const normalizedPath = pathWin32.resolve(candidatePath).toLowerCase();
      const pathDir = pathWin32.dirname(normalizedPath).toLowerCase();
      const relativePathDir = pathWin32.relative(cwd, pathDir);
      if (relativePathDir === "" || !relativePathDir.startsWith("..") && !pathWin32.isAbsolute(relativePathDir)) {
        logForDebugging(`Skipping potentially malicious executable in current directory: ${candidatePath}`);
        continue;
      }
      if (executable === "bash" && /(?:system32|windowsapps)\\bash\.exe$/.test(normalizedPath)) {
        logForDebugging(`Skipping WSL bash launcher (not Git Bash): ${candidatePath}`);
        continue;
      }
      return candidatePath;
    }
    return null;
  } catch {
    return null;
  }
}
function findGitBashPathOrNullWithDeps(deps = DEFAULT_DEPS) {
  const envOverride = deps.envOverride ?? process.env.CLAUDE_CODE_GIT_BASH_PATH;
  if (envOverride) {
    return deps.checkExists(envOverride) ? envOverride : null;
  }
  const fromPath = findExecutableWithDeps("bash", deps);
  if (fromPath && deps.checkExists(fromPath)) {
    return fromPath;
  }
  const gitPath = findExecutableWithDeps("git", deps);
  if (gitPath) {
    const candidates = [
      pathWin32.join(gitPath, "..", "..", "bin", "bash.exe"),
      pathWin32.join(gitPath, "..", "..", "usr", "bin", "bash.exe"),
      pathWin32.join(gitPath, "..", "bash.exe")
    ];
    for (const candidate of candidates) {
      if (deps.checkExists(candidate)) {
        return candidate;
      }
    }
  }
  return searchDefaultBashLocations(deps.checkExists, deps.userProfile);
}
function findGitBashPath() {
  const result = findGitBashPathOrNull();
  if (result !== null) {
    return result;
  }
  const envOverride = process.env.CLAUDE_CODE_GIT_BASH_PATH;
  if (envOverride) {
    console.error(`Claude Code was unable to find CLAUDE_CODE_GIT_BASH_PATH path "${envOverride}"`);
  } else {
    console.error("Claude Code on Windows requires git-bash (https://git-scm.com/downloads/win). If installed but not in PATH, set environment variable pointing to your bash.exe, similar to: CLAUDE_CODE_GIT_BASH_PATH=C:\\Program Files\\Git\\bin\\bash.exe");
  }
  process.exit(1);
}
var DEFAULT_DEPS, findGitBashPathOrNull, windowsPathToPosixPath, posixPathToWindowsPath;
var init_windowsPaths = __esm(() => {
  init_memoize();
  init_cwd();
  init_debug();
  init_execSyncWrapper();
  init_memoize2();
  init_platform();
  DEFAULT_DEPS = {
    checkExists: existsSync,
    execCommand: (cmd) => execSync_DEPRECATED(cmd, { stdio: "pipe", encoding: "utf8" }).trim(),
    cwdFn: getCwd,
    userProfile: process.env.USERPROFILE,
    envOverride: undefined
  };
  findGitBashPathOrNull = memoize_default(() => findGitBashPathOrNullWithDeps());
  windowsPathToPosixPath = memoizeWithLRU((windowsPath) => {
    if (windowsPath.startsWith("\\\\")) {
      return windowsPath.replace(/\\/g, "/");
    }
    const match = windowsPath.match(/^([A-Za-z]):[/\\]/);
    if (match) {
      const driveLetter = match[1].toLowerCase();
      return "/" + driveLetter + windowsPath.slice(2).replace(/\\/g, "/");
    }
    return windowsPath.replace(/\\/g, "/");
  }, (p) => p, 500);
  posixPathToWindowsPath = memoizeWithLRU((posixPath) => {
    if (posixPath.startsWith("//")) {
      return posixPath.replace(/\//g, "\\");
    }
    const cygdriveMatch = posixPath.match(/^\/cygdrive\/([A-Za-z])(\/|$)/);
    if (cygdriveMatch) {
      const driveLetter = cygdriveMatch[1].toUpperCase();
      const rest = posixPath.slice(("/cygdrive/" + cygdriveMatch[1]).length);
      return driveLetter + ":" + (rest || "\\").replace(/\//g, "\\");
    }
    const driveMatch = posixPath.match(/^\/([A-Za-z])(\/|$)/);
    if (driveMatch) {
      const driveLetter = driveMatch[1].toUpperCase();
      const rest = posixPath.slice(2);
      return driveLetter + ":" + (rest || "\\").replace(/\//g, "\\");
    }
    return posixPath.replace(/\//g, "\\");
  }, (p) => p, 500);
});

export { setShellIfWindows, findGitBashPathOrNullWithDeps, findGitBashPathOrNull, findGitBashPath, windowsPathToPosixPath, posixPathToWindowsPath, init_windowsPaths };

//# debugId=6062D2F4C2FF06C364756E2164756E21
//# sourceMappingURL=chunk-srzb9n7s.js.map
