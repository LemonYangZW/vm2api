// @bun
import {
  init_windowsPaths,
  posixPathToWindowsPath
} from "./chunk-srzb9n7s.js";
import {
  init_sessionStoragePortable
} from "./chunk-6tzyv21c.js";
import {
  getPlatform,
  init_platform
} from "./chunk-psygyacq.js";
import {
  getCwd,
  init_cwd
} from "./chunk-ew28k9dk.js";
import {
  getFsImplementation,
  init_fsOperations
} from "./chunk-82pkdrt0.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/path.ts
import { homedir } from "os";
import {
  dirname,
  isAbsolute,
  join,
  normalize,
  posix,
  relative,
  resolve
} from "path";
function expandPath(path, baseDir) {
  const actualBaseDir = baseDir ?? getCwd() ?? getFsImplementation().cwd();
  if (typeof path !== "string") {
    throw new TypeError(`Path must be a string, received ${typeof path}`);
  }
  if (typeof actualBaseDir !== "string") {
    throw new TypeError(`Base directory must be a string, received ${typeof actualBaseDir}`);
  }
  if (path.includes("\x00") || actualBaseDir.includes("\x00")) {
    throw new Error("Path contains null bytes");
  }
  const isSyntheticPosixPath = (value) => value.includes("/") && !value.includes("\\") && !/^[A-Za-z]:/.test(value);
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    if (getPlatform() === "windows" && isSyntheticPosixPath(actualBaseDir)) {
      return posix.normalize(actualBaseDir).normalize("NFC");
    }
    return normalize(actualBaseDir).normalize("NFC");
  }
  if (trimmedPath === "~") {
    return homedir().normalize("NFC");
  }
  if (trimmedPath.startsWith("~/")) {
    return join(homedir(), trimmedPath.slice(2)).normalize("NFC");
  }
  let processedPath = trimmedPath;
  if (getPlatform() === "windows" && trimmedPath.match(/^\/[a-z]\//i)) {
    try {
      processedPath = posixPathToWindowsPath(trimmedPath);
    } catch {
      processedPath = trimmedPath;
    }
  }
  if (isAbsolute(processedPath)) {
    if (getPlatform() === "windows" && isSyntheticPosixPath(processedPath)) {
      return posix.normalize(processedPath).normalize("NFC");
    }
    return normalize(processedPath).normalize("NFC");
  }
  if (getPlatform() === "windows" && isSyntheticPosixPath(actualBaseDir) && !/^[A-Za-z]:/.test(processedPath) && !processedPath.startsWith("\\\\")) {
    return posix.resolve(actualBaseDir, processedPath).normalize("NFC");
  }
  return resolve(actualBaseDir, processedPath).normalize("NFC");
}
function toRelativePath(absolutePath) {
  const relativePath = relative(getCwd(), absolutePath);
  return relativePath.startsWith("..") ? absolutePath : relativePath;
}
function getDirectoryForPath(path) {
  const absolutePath = expandPath(path);
  if (absolutePath.startsWith("\\\\") || absolutePath.startsWith("//")) {
    return dirname(absolutePath);
  }
  try {
    const stats = getFsImplementation().statSync(absolutePath);
    if (stats.isDirectory()) {
      return absolutePath;
    }
  } catch {}
  return dirname(absolutePath);
}
function containsPathTraversal(path) {
  return /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(path);
}
function normalizePathForConfigKey(path) {
  const normalized = normalize(path);
  return normalized.replace(/\\/g, "/");
}
var init_path = __esm(() => {
  init_cwd();
  init_fsOperations();
  init_platform();
  init_windowsPaths();
  init_sessionStoragePortable();
});

export { expandPath, toRelativePath, getDirectoryForPath, containsPathTraversal, normalizePathForConfigKey, init_path };

//# debugId=35502684F636D65C64756E2164756E21
//# sourceMappingURL=chunk-khh8a09c.js.map
