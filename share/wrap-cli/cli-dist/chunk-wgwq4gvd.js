// @bun
import {
  distRoot,
  init_distRoot
} from "./chunk-djt39ze3.js";
import {
  countCharInString,
  init_stringUtils
} from "./chunk-h7cy00tf.js";
import {
  getPlatform,
  init_platform
} from "./chunk-psygyacq.js";
import {
  findExecutable,
  init_findExecutable
} from "./chunk-etzpfazg.js";
import {
  init_bundledMode,
  isInBundledMode
} from "./chunk-v4ypszbb.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-t37nnsvj.js";
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-82pkdrt0.js";
import {
  init_envUtils,
  isEnvDefinedFalsy
} from "./chunk-6k1rsk85.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/ripgrep.ts
import { execFile, spawn } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";
import * as path from "path";
function resolveBuiltinWithFallback(builtinPath, systemRgPath, platform) {
  const p = platform ?? process.platform;
  if (existsSync(builtinPath)) {
    return { mode: "builtin", command: builtinPath, args: [] };
  }
  const resolvedSystem = systemRgPath === undefined ? findExecutable("rg", []).cmd : systemRgPath ?? "rg";
  if (resolvedSystem !== "rg") {
    return {
      mode: "system",
      command: "rg",
      args: [],
      note: `fallback: builtin rg unavailable on ${p}, using system rg`
    };
  }
  return {
    mode: "builtin",
    command: builtinPath,
    args: [],
    note: `no ripgrep available on ${p}; install ripgrep via apt/pkg/brew`
  };
}
function ripgrepCommand() {
  const config = getRipgrepConfig();
  return {
    rgPath: config.command,
    rgArgs: config.args,
    argv0: config.argv0
  };
}
function isEagainError(stderr) {
  return stderr.includes("os error 11") || stderr.includes("Resource temporarily unavailable");
}
function ripGrepRaw(args, target, abortSignal, callback, singleThread = false) {
  const { rgPath, rgArgs, argv0 } = ripgrepCommand();
  const threadArgs = singleThread ? ["-j", "1"] : [];
  const fullArgs = [...rgArgs, ...threadArgs, ...args, target];
  const defaultTimeout = getPlatform() === "wsl" ? 60000 : 20000;
  const parsedSeconds = parseInt(process.env.CLAUDE_CODE_GLOB_TIMEOUT_SECONDS || "", 10) || 0;
  const timeout = parsedSeconds > 0 ? parsedSeconds * 1000 : defaultTimeout;
  if (argv0) {
    const child = spawn(rgPath, fullArgs, {
      argv0,
      signal: abortSignal,
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    let stdoutTruncated = false;
    let stderrTruncated = false;
    child.stdout?.on("data", (data) => {
      if (!stdoutTruncated) {
        stdout += data.toString();
        if (stdout.length > MAX_BUFFER_SIZE) {
          stdout = stdout.slice(0, MAX_BUFFER_SIZE);
          stdoutTruncated = true;
        }
      }
    });
    child.stderr?.on("data", (data) => {
      if (!stderrTruncated) {
        stderr += data.toString();
        if (stderr.length > MAX_BUFFER_SIZE) {
          stderr = stderr.slice(0, MAX_BUFFER_SIZE);
          stderrTruncated = true;
        }
      }
    });
    let killTimeoutId;
    const timeoutId = setTimeout(() => {
      if (process.platform === "win32") {
        child.kill();
      } else {
        child.kill("SIGTERM");
        killTimeoutId = setTimeout((c) => c.kill("SIGKILL"), 5000, child);
      }
    }, timeout);
    let settled = false;
    child.on("close", (code, signal) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timeoutId);
      clearTimeout(killTimeoutId);
      if (code === 0 || code === 1) {
        callback(null, stdout, stderr);
      } else {
        const error = new Error(`ripgrep exited with code ${code}`);
        error.code = code ?? undefined;
        error.signal = signal ?? undefined;
        callback(error, stdout, stderr);
      }
    });
    child.on("error", (err) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timeoutId);
      clearTimeout(killTimeoutId);
      const error = err;
      callback(error, stdout, stderr);
    });
    return child;
  }
  return execFile(rgPath, fullArgs, {
    maxBuffer: MAX_BUFFER_SIZE,
    signal: abortSignal,
    timeout,
    killSignal: process.platform === "win32" ? undefined : "SIGKILL"
  }, callback);
}
async function ripGrepFileCount(args, target, abortSignal) {
  await codesignRipgrepIfNecessary();
  const { rgPath, rgArgs, argv0 } = ripgrepCommand();
  return new Promise((resolve2, reject) => {
    const child = spawn(rgPath, [...rgArgs, ...args, target], {
      argv0,
      signal: abortSignal,
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"]
    });
    let lines = 0;
    child.stdout?.on("data", (chunk) => {
      lines += countCharInString(chunk, `
`);
    });
    let settled = false;
    child.on("close", (code) => {
      if (settled)
        return;
      settled = true;
      if (code === 0 || code === 1)
        resolve2(lines);
      else
        reject(new Error(`rg --files exited ${code}`));
    });
    child.on("error", (err) => {
      if (settled)
        return;
      settled = true;
      reject(err);
    });
  });
}
async function ripGrepStream(args, target, abortSignal, onLines) {
  await codesignRipgrepIfNecessary();
  const { rgPath, rgArgs, argv0 } = ripgrepCommand();
  return new Promise((resolve2, reject) => {
    const child = spawn(rgPath, [...rgArgs, ...args, target], {
      argv0,
      signal: abortSignal,
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"]
    });
    const stripCR = (l) => l.endsWith("\r") ? l.slice(0, -1) : l;
    let remainder = "";
    child.stdout?.on("data", (chunk) => {
      const data = remainder + chunk.toString();
      const lines = data.split(`
`);
      remainder = lines.pop() ?? "";
      if (lines.length)
        onLines(lines.map(stripCR));
    });
    let settled = false;
    child.on("close", (code) => {
      if (settled)
        return;
      if (abortSignal.aborted)
        return;
      settled = true;
      if (code === 0 || code === 1) {
        if (remainder)
          onLines([stripCR(remainder)]);
        resolve2();
      } else {
        reject(new Error(`ripgrep exited with code ${code}`));
      }
    });
    child.on("error", (err) => {
      if (settled)
        return;
      settled = true;
      reject(err);
    });
  });
}
async function ripGrep(args, target, abortSignal) {
  await codesignRipgrepIfNecessary();
  testRipgrepOnFirstUse().catch((error) => {
    logError(error);
  });
  return new Promise((resolve2, reject) => {
    const handleResult = (error, stdout, stderr, isRetry) => {
      if (!error) {
        resolve2(stdout.trim().split(`
`).map((line) => line.replace(/\r$/, "")).filter(Boolean));
        return;
      }
      if (error.code === 1) {
        resolve2([]);
        return;
      }
      const CRITICAL_ERROR_CODES = ["ENOENT", "EACCES", "EPERM"];
      if (CRITICAL_ERROR_CODES.includes(error.code)) {
        reject(error);
        return;
      }
      if (!isRetry && isEagainError(stderr)) {
        logForDebugging(`rg EAGAIN error detected, retrying with single-threaded mode (-j 1)`);
        logEvent("tengu_ripgrep_eagain_retry", {});
        ripGrepRaw(args, target, abortSignal, (retryError, retryStdout, retryStderr) => {
          handleResult(retryError, retryStdout, retryStderr, true);
        }, true);
        return;
      }
      const hasOutput = stdout && stdout.trim().length > 0;
      const isTimeout = error.signal === "SIGTERM" || error.signal === "SIGKILL" || error.code === "ABORT_ERR";
      const isBufferOverflow = error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER";
      let lines = [];
      if (hasOutput) {
        lines = stdout.trim().split(`
`).map((line) => line.replace(/\r$/, "")).filter(Boolean);
        if (lines.length > 0 && (isTimeout || isBufferOverflow)) {
          lines = lines.slice(0, -1);
        }
      }
      logForDebugging(`rg error (signal=${error.signal}, code=${error.code}, stderr: ${stderr}), ${lines.length} results`);
      if (error.code !== 2 && error.code !== "ABORT_ERR") {
        logError(error);
      }
      if (isTimeout && lines.length === 0) {
        reject(new RipgrepTimeoutError(`Ripgrep search timed out after ${getPlatform() === "wsl" ? 60 : 20} seconds. The search may have matched files but did not complete in time. Try searching a more specific path or pattern.`, lines));
        return;
      }
      resolve2(lines);
    };
    ripGrepRaw(args, target, abortSignal, (error, stdout, stderr) => {
      handleResult(error, stdout, stderr, false);
    });
  });
}
function getRipgrepStatus() {
  const config = getRipgrepConfig();
  return {
    mode: config.mode,
    path: config.command,
    working: ripgrepStatus?.working ?? null,
    note: ripgrepStatus?.note ?? config.note
  };
}
async function codesignRipgrepIfNecessary() {
  if (process.platform !== "darwin" || alreadyDoneSignCheck) {
    return;
  }
  alreadyDoneSignCheck = true;
  const config = getRipgrepConfig();
  if (config.mode !== "builtin") {
    return;
  }
  const builtinPath = config.command;
  const lines = (await execFileNoThrow("codesign", ["-vv", "-d", builtinPath], {
    preserveOutputOnError: false
  })).stdout.split(`
`);
  const needsSigned = lines.find((line) => line.includes("linker-signed"));
  if (!needsSigned) {
    return;
  }
  try {
    const signResult = await execFileNoThrow("codesign", [
      "--sign",
      "-",
      "--force",
      "--preserve-metadata=entitlements,requirements,flags,runtime",
      builtinPath
    ]);
    if (signResult.code !== 0) {
      logError(new Error(`Failed to sign ripgrep: ${signResult.stdout} ${signResult.stderr}`));
    }
    const quarantineResult = await execFileNoThrow("xattr", [
      "-d",
      "com.apple.quarantine",
      builtinPath
    ]);
    if (quarantineResult.code !== 0) {
      logError(new Error(`Failed to remove quarantine: ${quarantineResult.stdout} ${quarantineResult.stderr}`));
    }
  } catch (e) {
    logError(e);
  }
}
var __dirname2, getRipgrepConfig, MAX_BUFFER_SIZE = 20000000, RipgrepTimeoutError, countFilesRoundedRg, ripgrepStatus = null, testRipgrepOnFirstUse, alreadyDoneSignCheck = false;
var init_ripgrep = __esm(() => {
  init_memoize();
  init_analytics();
  init_bundledMode();
  init_debug();
  init_distRoot();
  init_envUtils();
  init_execFileNoThrow();
  init_findExecutable();
  init_log();
  init_platform();
  init_stringUtils();
  __dirname2 = (() => {
    if (false)
      ;
    return distRoot;
  })();
  getRipgrepConfig = memoize_default(() => {
    const userWantsSystemRipgrep = isEnvDefinedFalsy(process.env.USE_BUILTIN_RIPGREP);
    if (userWantsSystemRipgrep) {
      const { cmd: systemPath } = findExecutable("rg", []);
      if (systemPath !== "rg") {
        return { mode: "system", command: "rg", args: [] };
      }
    }
    if (isInBundledMode()) {
      return {
        mode: "embedded",
        command: process.execPath,
        args: ["--no-config"],
        argv0: "rg"
      };
    }
    const rgRoot = path.resolve(__dirname2, "vendor", "ripgrep");
    const command = process.platform === "win32" ? path.resolve(rgRoot, `${process.arch}-win32`, "rg.exe") : path.resolve(rgRoot, `${process.arch}-${process.platform}`, "rg");
    return resolveBuiltinWithFallback(command);
  });
  RipgrepTimeoutError = class RipgrepTimeoutError extends Error {
    partialResults;
    constructor(message, partialResults) {
      super(message);
      this.partialResults = partialResults;
      this.name = "RipgrepTimeoutError";
    }
  };
  countFilesRoundedRg = memoize_default(async (dirPath, abortSignal, ignorePatterns = []) => {
    if (path.resolve(dirPath) === path.resolve(homedir())) {
      return;
    }
    try {
      const args = ["--files", "--hidden"];
      ignorePatterns.forEach((pattern) => {
        args.push("--glob", `!${pattern}`);
      });
      const count = await ripGrepFileCount(args, dirPath, abortSignal);
      if (count === 0)
        return 0;
      const magnitude = Math.floor(Math.log10(count));
      const power = 10 ** magnitude;
      return Math.round(count / power) * power;
    } catch (error) {
      if (error?.name !== "AbortError")
        logError(error);
    }
  }, (dirPath, _abortSignal, ignorePatterns = []) => `${dirPath}|${ignorePatterns.join(",")}`);
  testRipgrepOnFirstUse = memoize_default(async () => {
    if (ripgrepStatus !== null) {
      return;
    }
    const config = getRipgrepConfig();
    try {
      let test;
      if (config.argv0) {
        const proc = Bun.spawn([config.command, "--version"], {
          argv0: config.argv0,
          stderr: "ignore",
          stdout: "pipe"
        });
        const [stdout, code] = await Promise.all([
          proc.stdout.text(),
          proc.exited
        ]);
        test = {
          code,
          stdout
        };
      } else {
        test = await execFileNoThrow(config.command, [...config.args, "--version"], {
          timeout: 5000
        });
      }
      const working = test.code === 0 && !!test.stdout && test.stdout.startsWith("ripgrep ");
      ripgrepStatus = {
        working,
        lastTested: Date.now(),
        config,
        note: config.note
      };
      logForDebugging(`Ripgrep first use test: ${working ? "PASSED" : "FAILED"} (mode=${config.mode}, path=${config.command})`);
      logEvent("tengu_ripgrep_availability", {
        working: working ? 1 : 0,
        using_system: config.mode === "system" ? 1 : 0
      });
    } catch (error) {
      ripgrepStatus = {
        working: false,
        lastTested: Date.now(),
        config,
        note: config.note
      };
      logError(error);
    }
  });
});

export { getRipgrepConfig, resolveBuiltinWithFallback, ripgrepCommand, RipgrepTimeoutError, ripGrepStream, ripGrep, countFilesRoundedRg, getRipgrepStatus, init_ripgrep };

//# debugId=2767C5C908EB6BB464756E2164756E21
//# sourceMappingURL=chunk-wgwq4gvd.js.map
