// @bun
import {
  init_sink,
  initializeAnalyticsSink
} from "./chunk-fhs712ns.js";
import {
  captureException,
  init_sentry
} from "./chunk-f2rhkq3t.js";
import {
  CACHE_PATHS,
  attachErrorLogSink,
  dateToFilename,
  init_cachePaths,
  init_log
} from "./chunk-mhjmeh6r.js";
import {
  createBufferedWriter,
  getFsImplementation,
  init_bufferedWriter,
  init_cleanupRegistry,
  init_debug,
  init_fsOperations,
  init_slowOperations,
  jsonStringify,
  logForDebugging,
  registerCleanup
} from "./chunk-82pkdrt0.js";
import {
  getSessionId,
  init_state
} from "./chunk-v4e7ch76.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";

// src/utils/errorLogSink.ts
init_axios();
init_state();
init_bufferedWriter();
init_cachePaths();
init_cleanupRegistry();
init_debug();
init_fsOperations();
init_log();
init_slowOperations();
init_sentry();
import { dirname, join } from "path";
var DATE = dateToFilename(new Date);
function getErrorsPath() {
  return join(CACHE_PATHS.errors(), DATE + ".jsonl");
}
function getMCPLogsPath(serverName) {
  return join(CACHE_PATHS.mcpLogs(serverName), DATE + ".jsonl");
}
function createJsonlWriter(options) {
  const writer = createBufferedWriter(options);
  return {
    write(obj) {
      writer.write(jsonStringify(obj) + `
`);
    },
    flush: writer.flush,
    dispose: writer.dispose
  };
}
var logWriters = new Map;
function getLogWriter(path) {
  let writer = logWriters.get(path);
  if (!writer) {
    const dir = dirname(path);
    writer = createJsonlWriter({
      writeFn: (content) => {
        try {
          getFsImplementation().appendFileSync(path, content);
        } catch {
          getFsImplementation().mkdirSync(dir);
          getFsImplementation().appendFileSync(path, content);
        }
      },
      flushIntervalMs: 1000,
      maxBufferSize: 50
    });
    logWriters.set(path, writer);
    registerCleanup(async () => writer?.dispose());
  }
  return writer;
}
function appendToLog(path, message) {
  if (process.env.USER_TYPE !== "ant") {
    return;
  }
  const messageWithTimestamp = {
    timestamp: new Date().toISOString(),
    ...message,
    cwd: getFsImplementation().cwd(),
    userType: process.env.USER_TYPE,
    sessionId: getSessionId(),
    version: "2.8.4"
  };
  getLogWriter(path).write(messageWithTimestamp);
}
function extractServerMessage(data) {
  if (typeof data === "string") {
    return data;
  }
  if (data && typeof data === "object") {
    const obj = data;
    if (typeof obj.message === "string") {
      return obj.message;
    }
    if (typeof obj.error === "object" && obj.error && "message" in obj.error && typeof obj.error.message === "string") {
      return obj.error.message;
    }
  }
  return;
}
function logErrorImpl(error) {
  const errorStr = error.stack || error.message;
  let context = "";
  if (axios_default.isAxiosError(error) && error.config?.url) {
    const parts = [`url=${error.config.url}`];
    if (error.response?.status !== undefined) {
      parts.push(`status=${error.response.status}`);
    }
    const serverMessage = extractServerMessage(error.response?.data);
    if (serverMessage) {
      parts.push(`body=${serverMessage}`);
    }
    context = `[${parts.join(",")}] `;
  }
  logForDebugging(`${error.name}: ${context}${errorStr}`, { level: "error" });
  appendToLog(getErrorsPath(), {
    error: `${context}${errorStr}`
  });
  captureException(error);
}
function logMCPErrorImpl(serverName, error) {
  logForDebugging(`MCP server "${serverName}" ${error}`, { level: "error" });
  const logFile = getMCPLogsPath(serverName);
  const errorStr = error instanceof Error ? error.stack || error.message : String(error);
  const errorInfo = {
    error: errorStr,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    cwd: getFsImplementation().cwd()
  };
  getLogWriter(logFile).write(errorInfo);
}
function logMCPDebugImpl(serverName, message) {
  logForDebugging(`MCP server "${serverName}": ${message}`);
  const logFile = getMCPLogsPath(serverName);
  const debugInfo = {
    debug: message,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    cwd: getFsImplementation().cwd()
  };
  getLogWriter(logFile).write(debugInfo);
}
function initializeErrorLogSink() {
  attachErrorLogSink({
    logError: logErrorImpl,
    logMCPError: logMCPErrorImpl,
    logMCPDebug: logMCPDebugImpl,
    getErrorsPath,
    getMCPLogsPath
  });
  logForDebugging("Error log sink initialized");
}

// src/utils/sinks.ts
init_sink();
function initSinks() {
  initializeErrorLogSink();
  initializeAnalyticsSink();
}

export { initSinks };

//# debugId=25557A41308366FD64756E2164756E21
//# sourceMappingURL=chunk-s1662fvh.js.map
