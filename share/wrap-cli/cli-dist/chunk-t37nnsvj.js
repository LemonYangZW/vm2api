// @bun
import {
  getCwd,
  init_cwd
} from "./chunk-ew28k9dk.js";
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
import {
  execa,
  execaSync,
  init_execa
} from "./chunk-c1yc761e.js";
import {
  init_slowOperations,
  slowLogging
} from "./chunk-82pkdrt0.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/execFileNoThrowPortable.ts
function execSyncWithDefaults_DEPRECATED(command, optionsOrAbortSignal, timeout = 10 * SECONDS_IN_MINUTE * MS_IN_SECOND) {
  let options;
  if (optionsOrAbortSignal === undefined) {
    options = {};
  } else if (optionsOrAbortSignal instanceof AbortSignal) {
    options = {
      abortSignal: optionsOrAbortSignal,
      timeout
    };
  } else {
    options = optionsOrAbortSignal;
  }
  const {
    abortSignal,
    timeout: finalTimeout = 10 * SECONDS_IN_MINUTE * MS_IN_SECOND,
    input,
    stdio = ["ignore", "pipe", "pipe"]
  } = options;
  abortSignal?.throwIfAborted();
  using _ = slowLogging`exec: ${command.slice(0, 200)}`;
  try {
    const result = execaSync(command, {
      env: process.env,
      maxBuffer: 1e6,
      timeout: finalTimeout,
      cwd: getCwd(),
      stdio,
      shell: true,
      reject: false,
      input
    });
    if (!result.stdout) {
      return null;
    }
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}
var MS_IN_SECOND = 1000, SECONDS_IN_MINUTE = 60;
var init_execFileNoThrowPortable = __esm(() => {
  init_execa();
  init_cwd();
  init_slowOperations();
});

// src/utils/execFileNoThrow.ts
function execFileNoThrow(file, args, options = {
  timeout: 10 * SECONDS_IN_MINUTE2 * MS_IN_SECOND2,
  preserveOutputOnError: true,
  useCwd: true
}) {
  return execFileNoThrowWithCwd(file, args, {
    abortSignal: options.abortSignal,
    timeout: options.timeout,
    preserveOutputOnError: options.preserveOutputOnError,
    cwd: options.useCwd ? getCwd() : undefined,
    env: options.env,
    stdin: options.stdin,
    input: options.input
  });
}
function getErrorMessage(result, errorCode) {
  if (result.shortMessage) {
    return result.shortMessage;
  }
  if (typeof result.signal === "string") {
    return result.signal;
  }
  return String(errorCode);
}
function execFileNoThrowWithCwd(file, args, {
  abortSignal,
  timeout: finalTimeout = 10 * SECONDS_IN_MINUTE2 * MS_IN_SECOND2,
  preserveOutputOnError: finalPreserveOutput = true,
  cwd: finalCwd,
  env: finalEnv,
  maxBuffer,
  shell,
  stdin: finalStdin,
  input: finalInput
} = {
  timeout: 10 * SECONDS_IN_MINUTE2 * MS_IN_SECOND2,
  preserveOutputOnError: true,
  maxBuffer: 1e6
}) {
  return new Promise((resolve) => {
    execa(file, args, {
      maxBuffer,
      cancelSignal: abortSignal,
      timeout: finalTimeout,
      cwd: finalCwd,
      env: finalEnv,
      shell,
      stdin: finalStdin,
      input: finalInput,
      reject: false
    }).then((result) => {
      if (result.failed) {
        if (finalPreserveOutput) {
          const errorCode = result.exitCode ?? 1;
          resolve({
            stdout: result.stdout || "",
            stderr: result.stderr || "",
            code: errorCode,
            error: getErrorMessage(result, errorCode)
          });
        } else {
          resolve({ stdout: "", stderr: "", code: result.exitCode ?? 1 });
        }
      } else {
        resolve({
          stdout: result.stdout,
          stderr: result.stderr,
          code: 0
        });
      }
    }).catch((error) => {
      logError(error);
      resolve({ stdout: "", stderr: "", code: 1 });
    });
  });
}
var MS_IN_SECOND2 = 1000, SECONDS_IN_MINUTE2 = 60;
var init_execFileNoThrow = __esm(() => {
  init_execa();
  init_cwd();
  init_log();
  init_execFileNoThrowPortable();
});

export { execSyncWithDefaults_DEPRECATED, init_execFileNoThrowPortable, execFileNoThrow, execFileNoThrowWithCwd, init_execFileNoThrow };

//# debugId=8D4260DA6D3F221464756E2164756E21
//# sourceMappingURL=chunk-t37nnsvj.js.map
