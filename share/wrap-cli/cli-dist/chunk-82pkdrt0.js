// @bun
import {
  init_process,
  writeToStderr
} from "./chunk-kb3758f7.js";
import {
  _Stack_default,
  _Uint8Array_default,
  _arrayLikeKeys_default,
  _arrayPush_default,
  _baseGetAllKeys_default,
  _baseUnary_default,
  _getAllKeys_default,
  _getSymbols_default,
  _getTag_default,
  _isPrototype_default,
  _nodeUtil_default,
  _overArg_default,
  getSessionId,
  init__Stack,
  init__Uint8Array,
  init__arrayLikeKeys,
  init__arrayPush,
  init__baseGetAllKeys,
  init__baseUnary,
  init__getAllKeys,
  init__getSymbols,
  init__getTag,
  init__isPrototype,
  init__nodeUtil,
  init__overArg,
  init_isArray,
  init_isArrayLike,
  init_isBuffer,
  init_keys,
  init_state,
  init_stubArray,
  isArrayLike_default,
  isArray_default,
  isBuffer_default,
  keys_default,
  stubArray_default
} from "./chunk-v4e7ch76.js";
import {
  init_isObjectLike,
  isObjectLike_default
} from "./chunk-tj0dzck2.js";
import {
  init_sdk
} from "./chunk-ns1htxgd.js";
import {
  APIUserAbortError
} from "./chunk-ztqzmfx1.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  _getNative_default,
  eq_default,
  init__getNative,
  init_eq,
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  _Symbol_default,
  _root_default,
  init__Symbol,
  init__root,
  init_isObject,
  isObject_default
} from "./chunk-yes1my80.js";
import {
  __esm,
  __export
} from "./chunk-hhsxm2yr.js";

// src/utils/bufferedWriter.ts
function createBufferedWriter({
  writeFn,
  flushIntervalMs = 1000,
  maxBufferSize = 100,
  maxBufferBytes = Infinity,
  immediateMode = false
}) {
  let buffer = [];
  let bufferBytes = 0;
  let flushTimer = null;
  let pendingOverflow = null;
  function clearTimer() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  }
  function flush() {
    if (pendingOverflow) {
      writeFn(pendingOverflow.join(""));
      pendingOverflow = null;
    }
    if (buffer.length === 0)
      return;
    writeFn(buffer.join(""));
    buffer = [];
    bufferBytes = 0;
    clearTimer();
  }
  function scheduleFlush() {
    if (!flushTimer) {
      flushTimer = setTimeout(flush, flushIntervalMs);
    }
  }
  function flushDeferred() {
    if (pendingOverflow) {
      pendingOverflow.push(...buffer);
      buffer = [];
      bufferBytes = 0;
      clearTimer();
      return;
    }
    const detached = buffer;
    buffer = [];
    bufferBytes = 0;
    clearTimer();
    pendingOverflow = detached;
    setImmediate(() => {
      const toWrite = pendingOverflow;
      pendingOverflow = null;
      if (toWrite)
        writeFn(toWrite.join(""));
    });
  }
  return {
    write(content) {
      if (immediateMode) {
        writeFn(content);
        return;
      }
      buffer.push(content);
      bufferBytes += content.length;
      scheduleFlush();
      if (buffer.length >= maxBufferSize || bufferBytes >= maxBufferBytes) {
        flushDeferred();
      }
    },
    flush,
    dispose() {
      flush();
    }
  };
}
var init_bufferedWriter = () => {};

// src/utils/cleanupRegistry.ts
function registerCleanup(cleanupFn) {
  cleanupFunctions.add(cleanupFn);
  return () => cleanupFunctions.delete(cleanupFn);
}
async function runCleanupFunctions() {
  await Promise.all(Array.from(cleanupFunctions).map((fn) => fn()));
}
var cleanupFunctions;
var init_cleanupRegistry = __esm(() => {
  cleanupFunctions = new Set;
});

// src/utils/debugFilter.ts
function extractDebugCategories(message) {
  const categories = [];
  const mcpMatch = message.match(/^MCP server ["']([^"']+)["']/);
  if (mcpMatch && mcpMatch[1]) {
    categories.push("mcp");
    categories.push(mcpMatch[1].toLowerCase());
  } else {
    const prefixMatch = message.match(/^([^:[]+):/);
    if (prefixMatch && prefixMatch[1]) {
      categories.push(prefixMatch[1].trim().toLowerCase());
    }
  }
  const bracketMatch = message.match(/^\[([^\]]+)]/);
  if (bracketMatch && bracketMatch[1]) {
    categories.push(bracketMatch[1].trim().toLowerCase());
  }
  if (message.toLowerCase().includes("1p event:")) {
    categories.push("1p");
  }
  const secondaryMatch = message.match(/:\s*([^:]+?)(?:\s+(?:type|mode|status|event))?:/);
  if (secondaryMatch && secondaryMatch[1]) {
    const secondary = secondaryMatch[1].trim().toLowerCase();
    if (secondary.length < 30 && !secondary.includes(" ")) {
      categories.push(secondary);
    }
  }
  return Array.from(new Set(categories));
}
function shouldShowDebugCategories(categories, filter) {
  if (!filter) {
    return true;
  }
  if (categories.length === 0) {
    return false;
  }
  if (filter.isExclusive) {
    return !categories.some((cat) => filter.exclude.includes(cat));
  } else {
    return categories.some((cat) => filter.include.includes(cat));
  }
}
function shouldShowDebugMessage(message, filter) {
  if (!filter) {
    return true;
  }
  const categories = extractDebugCategories(message);
  return shouldShowDebugCategories(categories, filter);
}
var parseDebugFilter;
var init_debugFilter = __esm(() => {
  init_memoize();
  parseDebugFilter = memoize_default((filterString) => {
    if (!filterString || filterString.trim() === "") {
      return null;
    }
    const filters = filterString.split(",").map((f) => f.trim()).filter(Boolean);
    if (filters.length === 0) {
      return null;
    }
    const hasExclusive = filters.some((f) => f.startsWith("!"));
    const hasInclusive = filters.some((f) => !f.startsWith("!"));
    if (hasExclusive && hasInclusive) {
      return null;
    }
    const cleanFilters = filters.map((f) => f.replace(/^!/, "").toLowerCase());
    return {
      include: hasExclusive ? [] : cleanFilters,
      exclude: hasExclusive ? cleanFilters : [],
      isExclusive: hasExclusive
    };
  });
});

// src/utils/errors.ts
function isAbortError(e) {
  return e instanceof AbortError || e instanceof APIUserAbortError || e instanceof Error && e.name === "AbortError";
}
function hasExactErrorMessage(error, message) {
  return error instanceof Error && error.message === message;
}
function toError(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function errorMessage(e) {
  return e instanceof Error ? e.message : String(e);
}
function getErrnoCode(e) {
  if (e && typeof e === "object" && "code" in e && typeof e.code === "string") {
    return e.code;
  }
  return;
}
function isENOENT(e) {
  return getErrnoCode(e) === "ENOENT";
}
function getErrnoPath(e) {
  if (e && typeof e === "object" && "path" in e && typeof e.path === "string") {
    return e.path;
  }
  return;
}
function shortErrorStack(e, maxFrames = 5) {
  if (!(e instanceof Error))
    return String(e);
  if (!e.stack)
    return e.message;
  const lines = e.stack.split(`
`);
  const header = lines[0] ?? e.message;
  const frames = lines.slice(1).filter((l) => l.trim().startsWith("at "));
  if (frames.length <= maxFrames)
    return e.stack;
  return [header, ...frames.slice(0, maxFrames)].join(`
`);
}
function isFsInaccessible(e) {
  const code = getErrnoCode(e);
  return code === "ENOENT" || code === "EACCES" || code === "EPERM" || code === "ENOTDIR" || code === "ELOOP";
}
function classifyAxiosError(e) {
  const message = errorMessage(e);
  if (!e || typeof e !== "object" || !("isAxiosError" in e) || !e.isAxiosError) {
    return { kind: "other", message };
  }
  const err = e;
  const status = err.response?.status;
  if (status === 401 || status === 403)
    return { kind: "auth", status, message };
  if (err.code === "ECONNABORTED")
    return { kind: "timeout", status, message };
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return { kind: "network", status, message };
  }
  return { kind: "http", status, message };
}
var ClaudeError, MalformedCommandError, AbortError, ConfigParseError, ShellError, TeleportOperationError, TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS;
var init_errors = __esm(() => {
  init_sdk();
  ClaudeError = class ClaudeError extends Error {
    constructor(message) {
      super(message);
      this.name = this.constructor.name;
    }
  };
  MalformedCommandError = class MalformedCommandError extends Error {
  };
  AbortError = class AbortError extends Error {
    constructor(message) {
      super(message);
      this.name = "AbortError";
    }
  };
  ConfigParseError = class ConfigParseError extends Error {
    filePath;
    defaultConfig;
    constructor(message, filePath, defaultConfig) {
      super(message);
      this.name = "ConfigParseError";
      this.filePath = filePath;
      this.defaultConfig = defaultConfig;
    }
  };
  ShellError = class ShellError extends Error {
    stdout;
    stderr;
    code;
    interrupted;
    constructor(stdout, stderr, code, interrupted) {
      super("Shell command failed");
      this.stdout = stdout;
      this.stderr = stderr;
      this.code = code;
      this.interrupted = interrupted;
      this.name = "ShellError";
    }
  };
  TeleportOperationError = class TeleportOperationError extends Error {
    formattedMessage;
    constructor(message, formattedMessage) {
      super(message);
      this.formattedMessage = formattedMessage;
      this.name = "TeleportOperationError";
    }
  };
  TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS = class TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS extends Error {
    telemetryMessage;
    constructor(message, telemetryMessage) {
      super(message);
      this.name = "TelemetrySafeError";
      this.telemetryMessage = telemetryMessage ?? message;
    }
  };
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_arrayEach.js
function arrayEach(array, iteratee) {
  var index = -1, length = array == null ? 0 : array.length;
  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}
var _arrayEach_default;
var init__arrayEach = __esm(() => {
  _arrayEach_default = arrayEach;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_defineProperty.js
var defineProperty, _defineProperty_default;
var init__defineProperty = __esm(() => {
  init__getNative();
  defineProperty = function() {
    try {
      var func = _getNative_default(Object, "defineProperty");
      func({}, "", {});
      return func;
    } catch (e) {}
  }();
  _defineProperty_default = defineProperty;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseAssignValue.js
function baseAssignValue(object, key, value) {
  if (key == "__proto__" && _defineProperty_default) {
    _defineProperty_default(object, key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true
    });
  } else {
    object[key] = value;
  }
}
var _baseAssignValue_default;
var init__baseAssignValue = __esm(() => {
  init__defineProperty();
  _baseAssignValue_default = baseAssignValue;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_assignValue.js
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq_default(objValue, value)) || value === undefined && !(key in object)) {
    _baseAssignValue_default(object, key, value);
  }
}
var objectProto, hasOwnProperty, _assignValue_default;
var init__assignValue = __esm(() => {
  init__baseAssignValue();
  init_eq();
  objectProto = Object.prototype;
  hasOwnProperty = objectProto.hasOwnProperty;
  _assignValue_default = assignValue;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_copyObject.js
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});
  var index = -1, length = props.length;
  while (++index < length) {
    var key = props[index];
    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined;
    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      _baseAssignValue_default(object, key, newValue);
    } else {
      _assignValue_default(object, key, newValue);
    }
  }
  return object;
}
var _copyObject_default;
var init__copyObject = __esm(() => {
  init__assignValue();
  init__baseAssignValue();
  _copyObject_default = copyObject;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseAssign.js
function baseAssign(object, source) {
  return object && _copyObject_default(source, keys_default(source), object);
}
var _baseAssign_default;
var init__baseAssign = __esm(() => {
  init__copyObject();
  init_keys();
  _baseAssign_default = baseAssign;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_nativeKeysIn.js
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}
var _nativeKeysIn_default;
var init__nativeKeysIn = __esm(() => {
  _nativeKeysIn_default = nativeKeysIn;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseKeysIn.js
function baseKeysIn(object) {
  if (!isObject_default(object)) {
    return _nativeKeysIn_default(object);
  }
  var isProto = _isPrototype_default(object), result = [];
  for (var key in object) {
    if (!(key == "constructor" && (isProto || !hasOwnProperty2.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}
var objectProto2, hasOwnProperty2, _baseKeysIn_default;
var init__baseKeysIn = __esm(() => {
  init_isObject();
  init__isPrototype();
  init__nativeKeysIn();
  objectProto2 = Object.prototype;
  hasOwnProperty2 = objectProto2.hasOwnProperty;
  _baseKeysIn_default = baseKeysIn;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/keysIn.js
function keysIn(object) {
  return isArrayLike_default(object) ? _arrayLikeKeys_default(object, true) : _baseKeysIn_default(object);
}
var keysIn_default;
var init_keysIn = __esm(() => {
  init__arrayLikeKeys();
  init__baseKeysIn();
  init_isArrayLike();
  keysIn_default = keysIn;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseAssignIn.js
function baseAssignIn(object, source) {
  return object && _copyObject_default(source, keysIn_default(source), object);
}
var _baseAssignIn_default;
var init__baseAssignIn = __esm(() => {
  init__copyObject();
  init_keysIn();
  _baseAssignIn_default = baseAssignIn;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_cloneBuffer.js
var exports__cloneBuffer = {};
__export(exports__cloneBuffer, {
  default: () => _cloneBuffer_default
});
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
  buffer.copy(result);
  return result;
}
var freeExports, freeModule, moduleExports, Buffer2, allocUnsafe, _cloneBuffer_default;
var init__cloneBuffer = __esm(() => {
  init__root();
  freeExports = typeof exports__cloneBuffer == "object" && exports__cloneBuffer && !exports__cloneBuffer.nodeType && exports__cloneBuffer;
  freeModule = freeExports && typeof module__cloneBuffer == "object" && module__cloneBuffer && !module__cloneBuffer.nodeType && module__cloneBuffer;
  moduleExports = freeModule && freeModule.exports === freeExports;
  Buffer2 = moduleExports ? _root_default.Buffer : undefined;
  allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : undefined;
  _cloneBuffer_default = cloneBuffer;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_copyArray.js
function copyArray(source, array) {
  var index = -1, length = source.length;
  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}
var _copyArray_default;
var init__copyArray = __esm(() => {
  _copyArray_default = copyArray;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_copySymbols.js
function copySymbols(source, object) {
  return _copyObject_default(source, _getSymbols_default(source), object);
}
var _copySymbols_default;
var init__copySymbols = __esm(() => {
  init__copyObject();
  init__getSymbols();
  _copySymbols_default = copySymbols;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_getPrototype.js
var getPrototype, _getPrototype_default;
var init__getPrototype = __esm(() => {
  init__overArg();
  getPrototype = _overArg_default(Object.getPrototypeOf, Object);
  _getPrototype_default = getPrototype;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_getSymbolsIn.js
var nativeGetSymbols, getSymbolsIn, _getSymbolsIn_default;
var init__getSymbolsIn = __esm(() => {
  init__arrayPush();
  init__getPrototype();
  init__getSymbols();
  init_stubArray();
  nativeGetSymbols = Object.getOwnPropertySymbols;
  getSymbolsIn = !nativeGetSymbols ? stubArray_default : function(object) {
    var result = [];
    while (object) {
      _arrayPush_default(result, _getSymbols_default(object));
      object = _getPrototype_default(object);
    }
    return result;
  };
  _getSymbolsIn_default = getSymbolsIn;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_copySymbolsIn.js
function copySymbolsIn(source, object) {
  return _copyObject_default(source, _getSymbolsIn_default(source), object);
}
var _copySymbolsIn_default;
var init__copySymbolsIn = __esm(() => {
  init__copyObject();
  init__getSymbolsIn();
  _copySymbolsIn_default = copySymbolsIn;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_getAllKeysIn.js
function getAllKeysIn(object) {
  return _baseGetAllKeys_default(object, keysIn_default, _getSymbolsIn_default);
}
var _getAllKeysIn_default;
var init__getAllKeysIn = __esm(() => {
  init__baseGetAllKeys();
  init__getSymbolsIn();
  init_keysIn();
  _getAllKeysIn_default = getAllKeysIn;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_initCloneArray.js
function initCloneArray(array) {
  var length = array.length, result = new array.constructor(length);
  if (length && typeof array[0] == "string" && hasOwnProperty3.call(array, "index")) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}
var objectProto3, hasOwnProperty3, _initCloneArray_default;
var init__initCloneArray = __esm(() => {
  objectProto3 = Object.prototype;
  hasOwnProperty3 = objectProto3.hasOwnProperty;
  _initCloneArray_default = initCloneArray;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_cloneArrayBuffer.js
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new _Uint8Array_default(result).set(new _Uint8Array_default(arrayBuffer));
  return result;
}
var _cloneArrayBuffer_default;
var init__cloneArrayBuffer = __esm(() => {
  init__Uint8Array();
  _cloneArrayBuffer_default = cloneArrayBuffer;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_cloneDataView.js
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? _cloneArrayBuffer_default(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}
var _cloneDataView_default;
var init__cloneDataView = __esm(() => {
  init__cloneArrayBuffer();
  _cloneDataView_default = cloneDataView;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_cloneRegExp.js
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}
var reFlags, _cloneRegExp_default;
var init__cloneRegExp = __esm(() => {
  reFlags = /\w*$/;
  _cloneRegExp_default = cloneRegExp;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_cloneSymbol.js
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}
var symbolProto, symbolValueOf, _cloneSymbol_default;
var init__cloneSymbol = __esm(() => {
  init__Symbol();
  symbolProto = _Symbol_default ? _Symbol_default.prototype : undefined;
  symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;
  _cloneSymbol_default = cloneSymbol;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_cloneTypedArray.js
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? _cloneArrayBuffer_default(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}
var _cloneTypedArray_default;
var init__cloneTypedArray = __esm(() => {
  init__cloneArrayBuffer();
  _cloneTypedArray_default = cloneTypedArray;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_initCloneByTag.js
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return _cloneArrayBuffer_default(object);
    case boolTag:
    case dateTag:
      return new Ctor(+object);
    case dataViewTag:
      return _cloneDataView_default(object, isDeep);
    case float32Tag:
    case float64Tag:
    case int8Tag:
    case int16Tag:
    case int32Tag:
    case uint8Tag:
    case uint8ClampedTag:
    case uint16Tag:
    case uint32Tag:
      return _cloneTypedArray_default(object, isDeep);
    case mapTag:
      return new Ctor;
    case numberTag:
    case stringTag:
      return new Ctor(object);
    case regexpTag:
      return _cloneRegExp_default(object);
    case setTag:
      return new Ctor;
    case symbolTag:
      return _cloneSymbol_default(object);
  }
}
var boolTag = "[object Boolean]", dateTag = "[object Date]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]", arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]", _initCloneByTag_default;
var init__initCloneByTag = __esm(() => {
  init__cloneArrayBuffer();
  init__cloneDataView();
  init__cloneRegExp();
  init__cloneSymbol();
  init__cloneTypedArray();
  _initCloneByTag_default = initCloneByTag;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseCreate.js
var objectCreate, baseCreate, _baseCreate_default;
var init__baseCreate = __esm(() => {
  init_isObject();
  objectCreate = Object.create;
  baseCreate = function() {
    function object() {}
    return function(proto) {
      if (!isObject_default(proto)) {
        return {};
      }
      if (objectCreate) {
        return objectCreate(proto);
      }
      object.prototype = proto;
      var result = new object;
      object.prototype = undefined;
      return result;
    };
  }();
  _baseCreate_default = baseCreate;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_initCloneObject.js
function initCloneObject(object) {
  return typeof object.constructor == "function" && !_isPrototype_default(object) ? _baseCreate_default(_getPrototype_default(object)) : {};
}
var _initCloneObject_default;
var init__initCloneObject = __esm(() => {
  init__baseCreate();
  init__getPrototype();
  init__isPrototype();
  _initCloneObject_default = initCloneObject;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseIsMap.js
function baseIsMap(value) {
  return isObjectLike_default(value) && _getTag_default(value) == mapTag2;
}
var mapTag2 = "[object Map]", _baseIsMap_default;
var init__baseIsMap = __esm(() => {
  init__getTag();
  init_isObjectLike();
  _baseIsMap_default = baseIsMap;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/isMap.js
var nodeIsMap, isMap, isMap_default;
var init_isMap = __esm(() => {
  init__baseIsMap();
  init__baseUnary();
  init__nodeUtil();
  nodeIsMap = _nodeUtil_default && _nodeUtil_default.isMap;
  isMap = nodeIsMap ? _baseUnary_default(nodeIsMap) : _baseIsMap_default;
  isMap_default = isMap;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseIsSet.js
function baseIsSet(value) {
  return isObjectLike_default(value) && _getTag_default(value) == setTag2;
}
var setTag2 = "[object Set]", _baseIsSet_default;
var init__baseIsSet = __esm(() => {
  init__getTag();
  init_isObjectLike();
  _baseIsSet_default = baseIsSet;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/isSet.js
var nodeIsSet, isSet, isSet_default;
var init_isSet = __esm(() => {
  init__baseIsSet();
  init__baseUnary();
  init__nodeUtil();
  nodeIsSet = _nodeUtil_default && _nodeUtil_default.isSet;
  isSet = nodeIsSet ? _baseUnary_default(nodeIsSet) : _baseIsSet_default;
  isSet_default = isSet;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseClone.js
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject_default(value)) {
    return value;
  }
  var isArr = isArray_default(value);
  if (isArr) {
    result = _initCloneArray_default(value);
    if (!isDeep) {
      return _copyArray_default(value, result);
    }
  } else {
    var tag = _getTag_default(value), isFunc = tag == funcTag || tag == genTag;
    if (isBuffer_default(value)) {
      return _cloneBuffer_default(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || isFunc && !object) {
      result = isFlat || isFunc ? {} : _initCloneObject_default(value);
      if (!isDeep) {
        return isFlat ? _copySymbolsIn_default(value, _baseAssignIn_default(result, value)) : _copySymbols_default(value, _baseAssign_default(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = _initCloneByTag_default(value, tag, isDeep);
    }
  }
  stack || (stack = new _Stack_default);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);
  if (isSet_default(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });
  } else if (isMap_default(value)) {
    value.forEach(function(subValue, key2) {
      result.set(key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
    });
  }
  var keysFunc = isFull ? isFlat ? _getAllKeysIn_default : _getAllKeys_default : isFlat ? keysIn_default : keys_default;
  var props = isArr ? undefined : keysFunc(value);
  _arrayEach_default(props || value, function(subValue, key2) {
    if (props) {
      key2 = subValue;
      subValue = value[key2];
    }
    _assignValue_default(result, key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
  });
  return result;
}
var CLONE_DEEP_FLAG = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG = 4, argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag2 = "[object Boolean]", dateTag2 = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag3 = "[object Map]", numberTag2 = "[object Number]", objectTag = "[object Object]", regexpTag2 = "[object RegExp]", setTag3 = "[object Set]", stringTag2 = "[object String]", symbolTag2 = "[object Symbol]", weakMapTag = "[object WeakMap]", arrayBufferTag2 = "[object ArrayBuffer]", dataViewTag2 = "[object DataView]", float32Tag2 = "[object Float32Array]", float64Tag2 = "[object Float64Array]", int8Tag2 = "[object Int8Array]", int16Tag2 = "[object Int16Array]", int32Tag2 = "[object Int32Array]", uint8Tag2 = "[object Uint8Array]", uint8ClampedTag2 = "[object Uint8ClampedArray]", uint16Tag2 = "[object Uint16Array]", uint32Tag2 = "[object Uint32Array]", cloneableTags, _baseClone_default;
var init__baseClone = __esm(() => {
  init__Stack();
  init__arrayEach();
  init__assignValue();
  init__baseAssign();
  init__baseAssignIn();
  init__cloneBuffer();
  init__copyArray();
  init__copySymbols();
  init__copySymbolsIn();
  init__getAllKeys();
  init__getAllKeysIn();
  init__getTag();
  init__initCloneArray();
  init__initCloneByTag();
  init__initCloneObject();
  init_isArray();
  init_isBuffer();
  init_isMap();
  init_isObject();
  init_isSet();
  init_keys();
  init_keysIn();
  cloneableTags = {};
  cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag2] = cloneableTags[dataViewTag2] = cloneableTags[boolTag2] = cloneableTags[dateTag2] = cloneableTags[float32Tag2] = cloneableTags[float64Tag2] = cloneableTags[int8Tag2] = cloneableTags[int16Tag2] = cloneableTags[int32Tag2] = cloneableTags[mapTag3] = cloneableTags[numberTag2] = cloneableTags[objectTag] = cloneableTags[regexpTag2] = cloneableTags[setTag3] = cloneableTags[stringTag2] = cloneableTags[symbolTag2] = cloneableTags[uint8Tag2] = cloneableTags[uint8ClampedTag2] = cloneableTags[uint16Tag2] = cloneableTags[uint32Tag2] = true;
  cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
  _baseClone_default = baseClone;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/cloneDeep.js
function cloneDeep(value) {
  return _baseClone_default(value, CLONE_DEEP_FLAG2 | CLONE_SYMBOLS_FLAG2);
}
var CLONE_DEEP_FLAG2 = 1, CLONE_SYMBOLS_FLAG2 = 4, cloneDeep_default;
var init_cloneDeep = __esm(() => {
  init__baseClone();
  cloneDeep_default = cloneDeep;
});

// src/utils/slowOperations.ts
import {
  closeSync,
  writeFileSync as fsWriteFileSync,
  fsyncSync,
  openSync
} from "fs";
function slowLoggingExternal() {
  return NOOP_LOGGER;
}
function jsonStringify(value, replacer, space) {
  using _ = slowLogging`JSON.stringify(${value})`;
  return JSON.stringify(value, replacer, space);
}
function clone(value, options) {
  using _ = slowLogging`structuredClone(${value})`;
  return structuredClone(value, options);
}
function writeFileSync_DEPRECATED(filePath, data, options) {
  using _ = slowLogging`fs.writeFileSync(${filePath}, ${data})`;
  const needsFlush = options !== null && typeof options === "object" && "flush" in options && options.flush === true;
  if (needsFlush) {
    const encoding = typeof options === "object" && "encoding" in options ? options.encoding : undefined;
    const mode = typeof options === "object" && "mode" in options ? options.mode : undefined;
    let fd;
    try {
      fd = openSync(filePath, "w", mode);
      fsWriteFileSync(fd, data, { encoding: encoding ?? undefined });
      fsyncSync(fd);
    } finally {
      if (fd !== undefined) {
        closeSync(fd);
      }
    }
  } else {
    fsWriteFileSync(filePath, data, options);
  }
}
var SLOW_OPERATION_THRESHOLD_MS, NOOP_LOGGER, slowLogging, jsonParse = (text, reviver) => {
  using _ = slowLogging`JSON.parse(${text})`;
  return typeof reviver === "undefined" ? JSON.parse(text) : JSON.parse(text, reviver);
};
var init_slowOperations = __esm(() => {
  init_state();
  init_debug();
  SLOW_OPERATION_THRESHOLD_MS = (() => {
    const envValue = process.env.CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS;
    if (envValue !== undefined) {
      const parsed = Number(envValue);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    if (false) {}
    if (process.env.USER_TYPE === "ant") {
      return 300;
    }
    return Infinity;
  })();
  NOOP_LOGGER = { [Symbol.dispose]() {} };
  slowLogging = slowLoggingExternal;
});

// src/utils/fsOperations.ts
import * as fs from "fs";
import {
  mkdir as mkdirPromise,
  open,
  readdir as readdirPromise,
  readFile as readFilePromise,
  rename as renamePromise,
  rmdir as rmdirPromise,
  rm as rmPromise,
  stat as statPromise,
  unlink as unlinkPromise
} from "fs/promises";
import { homedir } from "os";
import * as nodePath from "path";
function safeResolvePath(fs2, filePath) {
  if (filePath.startsWith("//") || filePath.startsWith("\\\\")) {
    return { resolvedPath: filePath, isSymlink: false, isCanonical: false };
  }
  try {
    const stats = fs2.lstatSync(filePath);
    if (stats.isFIFO() || stats.isSocket() || stats.isCharacterDevice() || stats.isBlockDevice()) {
      return { resolvedPath: filePath, isSymlink: false, isCanonical: false };
    }
    const resolvedPath = fs2.realpathSync(filePath);
    return {
      resolvedPath,
      isSymlink: resolvedPath !== filePath,
      isCanonical: true
    };
  } catch (_error) {
    return { resolvedPath: filePath, isSymlink: false, isCanonical: false };
  }
}
function isDuplicatePath(fs2, filePath, loadedPaths) {
  const { resolvedPath } = safeResolvePath(fs2, filePath);
  if (loadedPaths.has(resolvedPath)) {
    return true;
  }
  loadedPaths.add(resolvedPath);
  return false;
}
function resolveDeepestExistingAncestorSync(fs2, absolutePath) {
  let dir = absolutePath;
  const segments = [];
  while (dir !== nodePath.dirname(dir)) {
    let st;
    try {
      st = fs2.lstatSync(dir);
    } catch {
      segments.unshift(nodePath.basename(dir));
      dir = nodePath.dirname(dir);
      continue;
    }
    if (st.isSymbolicLink()) {
      try {
        const resolved = fs2.realpathSync(dir);
        return segments.length === 0 ? resolved : nodePath.join(resolved, ...segments);
      } catch {
        const target = fs2.readlinkSync(dir);
        const absTarget = nodePath.isAbsolute(target) ? target : nodePath.resolve(nodePath.dirname(dir), target);
        return segments.length === 0 ? absTarget : nodePath.join(absTarget, ...segments);
      }
    }
    try {
      const resolved = fs2.realpathSync(dir);
      if (resolved !== dir) {
        return segments.length === 0 ? resolved : nodePath.join(resolved, ...segments);
      }
    } catch {}
    return;
  }
  return;
}
function getPathsForPermissionCheck(inputPath) {
  let path = inputPath;
  if (path === "~") {
    path = homedir().normalize("NFC");
  } else if (path.startsWith("~/")) {
    path = nodePath.join(homedir().normalize("NFC"), path.slice(2));
  }
  const pathSet = new Set;
  const fsImpl = getFsImplementation();
  pathSet.add(path);
  if (path.startsWith("//") || path.startsWith("\\\\")) {
    return Array.from(pathSet);
  }
  try {
    let currentPath = path;
    const visited = new Set;
    const maxDepth = 40;
    for (let depth = 0;depth < maxDepth; depth++) {
      if (visited.has(currentPath)) {
        break;
      }
      visited.add(currentPath);
      if (!fsImpl.existsSync(currentPath)) {
        if (currentPath === path) {
          const resolved = resolveDeepestExistingAncestorSync(fsImpl, path);
          if (resolved !== undefined) {
            pathSet.add(resolved);
          }
        }
        break;
      }
      const stats = fsImpl.lstatSync(currentPath);
      if (stats.isFIFO() || stats.isSocket() || stats.isCharacterDevice() || stats.isBlockDevice()) {
        break;
      }
      if (!stats.isSymbolicLink()) {
        break;
      }
      const target = fsImpl.readlinkSync(currentPath);
      const absoluteTarget = nodePath.isAbsolute(target) ? target : nodePath.resolve(nodePath.dirname(currentPath), target);
      pathSet.add(absoluteTarget);
      currentPath = absoluteTarget;
    }
  } catch {}
  const { resolvedPath, isSymlink } = safeResolvePath(fsImpl, path);
  if (isSymlink && resolvedPath !== path) {
    pathSet.add(resolvedPath);
  }
  return Array.from(pathSet);
}
function getFsImplementation() {
  return activeFs;
}
async function readFileRange(path, offset, maxBytes) {
  await using fh = await open(path, "r");
  const size = (await fh.stat()).size;
  if (size <= offset) {
    return null;
  }
  const bytesToRead = Math.min(size - offset, maxBytes);
  const buffer = Buffer.allocUnsafe(bytesToRead);
  let totalRead = 0;
  while (totalRead < bytesToRead) {
    const { bytesRead } = await fh.read(buffer, totalRead, bytesToRead - totalRead, offset + totalRead);
    if (bytesRead === 0) {
      break;
    }
    totalRead += bytesRead;
  }
  return {
    content: buffer.toString("utf8", 0, totalRead),
    bytesRead: totalRead,
    bytesTotal: size
  };
}
async function tailFile(path, maxBytes) {
  await using fh = await open(path, "r");
  const size = (await fh.stat()).size;
  if (size === 0) {
    return { content: "", bytesRead: 0, bytesTotal: 0 };
  }
  const offset = Math.max(0, size - maxBytes);
  const bytesToRead = size - offset;
  const buffer = Buffer.allocUnsafe(bytesToRead);
  let totalRead = 0;
  while (totalRead < bytesToRead) {
    const { bytesRead } = await fh.read(buffer, totalRead, bytesToRead - totalRead, offset + totalRead);
    if (bytesRead === 0) {
      break;
    }
    totalRead += bytesRead;
  }
  return {
    content: buffer.toString("utf8", 0, totalRead),
    bytesRead: totalRead,
    bytesTotal: size
  };
}
async function* readLinesReverse(path) {
  const CHUNK_SIZE = 1024 * 4;
  const fileHandle = await open(path, "r");
  try {
    const stats = await fileHandle.stat();
    let position = stats.size;
    let remainder = Buffer.alloc(0);
    const buffer = Buffer.alloc(CHUNK_SIZE);
    while (position > 0) {
      const currentChunkSize = Math.min(CHUNK_SIZE, position);
      position -= currentChunkSize;
      await fileHandle.read(buffer, 0, currentChunkSize, position);
      const combined = Buffer.concat([
        buffer.subarray(0, currentChunkSize),
        remainder
      ]);
      const firstNewline = combined.indexOf(10);
      if (firstNewline === -1) {
        remainder = combined;
        continue;
      }
      remainder = Buffer.from(combined.subarray(0, firstNewline));
      const lines = combined.toString("utf8", firstNewline + 1).split(`
`);
      for (let i = lines.length - 1;i >= 0; i--) {
        const line = lines[i];
        if (line) {
          yield line;
        }
      }
    }
    if (remainder.length > 0) {
      yield remainder.toString("utf8");
    }
  } finally {
    await fileHandle.close();
  }
}
var NodeFsOperations, activeFs;
var init_fsOperations = __esm(() => {
  init_errors();
  init_slowOperations();
  NodeFsOperations = {
    cwd() {
      return process.cwd();
    },
    existsSync(fsPath) {
      using _ = slowLogging`fs.existsSync(${fsPath})`;
      return fs.existsSync(fsPath);
    },
    async stat(fsPath) {
      return statPromise(fsPath);
    },
    async readdir(fsPath) {
      return readdirPromise(fsPath, { withFileTypes: true });
    },
    async unlink(fsPath) {
      return unlinkPromise(fsPath);
    },
    async rmdir(fsPath) {
      return rmdirPromise(fsPath);
    },
    async rm(fsPath, options) {
      return rmPromise(fsPath, options);
    },
    async mkdir(dirPath, options) {
      try {
        await mkdirPromise(dirPath, { recursive: true, ...options });
      } catch (e) {
        if (getErrnoCode(e) !== "EEXIST")
          throw e;
      }
    },
    async readFile(fsPath, options) {
      return readFilePromise(fsPath, { encoding: options.encoding });
    },
    async rename(oldPath, newPath) {
      return renamePromise(oldPath, newPath);
    },
    statSync(fsPath) {
      using _ = slowLogging`fs.statSync(${fsPath})`;
      return fs.statSync(fsPath);
    },
    lstatSync(fsPath) {
      using _ = slowLogging`fs.lstatSync(${fsPath})`;
      return fs.lstatSync(fsPath);
    },
    readFileSync(fsPath, options) {
      using _ = slowLogging`fs.readFileSync(${fsPath})`;
      return fs.readFileSync(fsPath, { encoding: options.encoding });
    },
    readFileBytesSync(fsPath) {
      using _ = slowLogging`fs.readFileBytesSync(${fsPath})`;
      return fs.readFileSync(fsPath);
    },
    readSync(fsPath, options) {
      using _ = slowLogging`fs.readSync(${fsPath}, ${options.length} bytes)`;
      let fd;
      try {
        fd = fs.openSync(fsPath, "r");
        const buffer = Buffer.alloc(options.length);
        const bytesRead = fs.readSync(fd, buffer, 0, options.length, 0);
        return { buffer, bytesRead };
      } finally {
        if (fd)
          fs.closeSync(fd);
      }
    },
    appendFileSync(path, data, options) {
      using _ = slowLogging`fs.appendFileSync(${path}, ${data.length} chars)`;
      if (options?.mode !== undefined) {
        try {
          const fd = fs.openSync(path, "ax", options.mode);
          try {
            fs.appendFileSync(fd, data);
          } finally {
            fs.closeSync(fd);
          }
          return;
        } catch (e) {
          if (getErrnoCode(e) !== "EEXIST")
            throw e;
        }
      }
      fs.appendFileSync(path, data);
    },
    copyFileSync(src, dest) {
      using _ = slowLogging`fs.copyFileSync(${src} \u2192 ${dest})`;
      fs.copyFileSync(src, dest);
    },
    unlinkSync(path) {
      using _ = slowLogging`fs.unlinkSync(${path})`;
      fs.unlinkSync(path);
    },
    renameSync(oldPath, newPath) {
      using _ = slowLogging`fs.renameSync(${oldPath} \u2192 ${newPath})`;
      fs.renameSync(oldPath, newPath);
    },
    linkSync(target, path) {
      using _ = slowLogging`fs.linkSync(${target} \u2192 ${path})`;
      fs.linkSync(target, path);
    },
    symlinkSync(target, path, type) {
      using _ = slowLogging`fs.symlinkSync(${target} \u2192 ${path})`;
      fs.symlinkSync(target, path, type);
    },
    readlinkSync(path) {
      using _ = slowLogging`fs.readlinkSync(${path})`;
      return fs.readlinkSync(path);
    },
    realpathSync(path) {
      using _ = slowLogging`fs.realpathSync(${path})`;
      return fs.realpathSync(path).normalize("NFC");
    },
    mkdirSync(dirPath, options) {
      using _ = slowLogging`fs.mkdirSync(${dirPath})`;
      const mkdirOptions = {
        recursive: true
      };
      if (options?.mode !== undefined) {
        mkdirOptions.mode = options.mode;
      }
      try {
        fs.mkdirSync(dirPath, mkdirOptions);
      } catch (e) {
        if (getErrnoCode(e) !== "EEXIST")
          throw e;
      }
    },
    readdirSync(dirPath) {
      using _ = slowLogging`fs.readdirSync(${dirPath})`;
      return fs.readdirSync(dirPath, { withFileTypes: true });
    },
    readdirStringSync(dirPath) {
      using _ = slowLogging`fs.readdirStringSync(${dirPath})`;
      return fs.readdirSync(dirPath);
    },
    isDirEmptySync(dirPath) {
      using _ = slowLogging`fs.isDirEmptySync(${dirPath})`;
      const files = this.readdirSync(dirPath);
      return files.length === 0;
    },
    rmdirSync(dirPath) {
      using _ = slowLogging`fs.rmdirSync(${dirPath})`;
      fs.rmdirSync(dirPath);
    },
    rmSync(path, options) {
      using _ = slowLogging`fs.rmSync(${path})`;
      fs.rmSync(path, options);
    },
    createWriteStream(path) {
      return fs.createWriteStream(path);
    },
    async readFileBytes(fsPath, maxBytes) {
      if (maxBytes === undefined) {
        return readFilePromise(fsPath);
      }
      const handle = await open(fsPath, "r");
      try {
        const { size } = await handle.stat();
        const readSize = Math.min(size, maxBytes);
        const buffer = Buffer.allocUnsafe(readSize);
        let offset = 0;
        while (offset < readSize) {
          const { bytesRead } = await handle.read(buffer, offset, readSize - offset, offset);
          if (bytesRead === 0)
            break;
          offset += bytesRead;
        }
        return offset < readSize ? buffer.subarray(0, offset) : buffer;
      } finally {
        await handle.close();
      }
    }
  };
  activeFs = NodeFsOperations;
});

// src/utils/debug.ts
var exports_debug = {};
__export(exports_debug, {
  setHasFormattedOutput: () => setHasFormattedOutput,
  logForDebugging: () => logForDebugging,
  logAntError: () => logAntError,
  isDebugToStdErr: () => isDebugToStdErr,
  isDebugMode: () => isDebugMode,
  getMinDebugLogLevel: () => getMinDebugLogLevel,
  getHasFormattedOutput: () => getHasFormattedOutput,
  getDebugLogPath: () => getDebugLogPath,
  getDebugFilter: () => getDebugFilter,
  getDebugFilePath: () => getDebugFilePath,
  flushDebugLogs: () => flushDebugLogs,
  enableDebugLogging: () => enableDebugLogging
});
import { appendFile, mkdir, symlink, unlink } from "fs/promises";
import { dirname as dirname2, join as join2, resolve as resolve2 } from "path";
function enableDebugLogging() {
  const wasActive = isDebugMode() || process.env.USER_TYPE === "ant";
  runtimeDebugEnabled = true;
  isDebugMode.cache.clear?.();
  return wasActive;
}
function shouldLogDebugMessage(message) {
  if (false) {}
  if (process.env.USER_TYPE !== "ant" && !isDebugMode()) {
    return false;
  }
  if (typeof process === "undefined" || typeof process.versions === "undefined" || typeof process.versions.node === "undefined") {
    return false;
  }
  const filter = getDebugFilter();
  return shouldShowDebugMessage(message, filter);
}
function setHasFormattedOutput(value) {
  hasFormattedOutput = value;
}
function getHasFormattedOutput() {
  return hasFormattedOutput;
}
async function appendAsync(needMkdir, dir, path, content) {
  if (needMkdir) {
    await mkdir(dir, { recursive: true }).catch(() => {});
  }
  await appendFile(path, content);
  updateLatestDebugLogSymlink();
}
function noop() {}
function getDebugWriter() {
  if (!debugWriter) {
    let ensuredDir = null;
    debugWriter = createBufferedWriter({
      writeFn: (content) => {
        const path = getDebugLogPath();
        const dir = dirname2(path);
        const needMkdir = ensuredDir !== dir;
        ensuredDir = dir;
        if (isDebugMode()) {
          if (needMkdir) {
            try {
              getFsImplementation().mkdirSync(dir);
            } catch {}
          }
          try {
            getFsImplementation().appendFileSync(path, content);
          } catch (e) {
            try {
              getFsImplementation().mkdirSync(dir);
              getFsImplementation().appendFileSync(path, content);
            } catch {}
          }
          updateLatestDebugLogSymlink();
          return;
        }
        pendingWrite = pendingWrite.then(appendAsync.bind(null, needMkdir, dir, path, content)).catch(noop);
      },
      flushIntervalMs: 1000,
      maxBufferSize: 100,
      immediateMode: isDebugMode()
    });
    registerCleanup(async () => {
      debugWriter?.dispose();
      await pendingWrite;
    });
  }
  return debugWriter;
}
async function flushDebugLogs() {
  debugWriter?.flush();
  await pendingWrite;
}
function logForDebugging(message, { level } = {
  level: "debug"
}) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[getMinDebugLogLevel()]) {
    return;
  }
  if (!shouldLogDebugMessage(message)) {
    return;
  }
  if (hasFormattedOutput && message.includes(`
`)) {
    message = jsonStringify(message);
  }
  const timestamp = new Date().toISOString();
  const output = `${timestamp} [${level.toUpperCase()}] ${message.trim()}
`;
  if (isDebugToStdErr()) {
    writeToStderr(output);
    return;
  }
  getDebugWriter().write(output);
}
function getDebugLogPath() {
  return getDebugFilePath() ?? (process.env.CLAUDE_CODE_DEBUG_LOGS_DIR ? resolve2(process.env.CLAUDE_CODE_DEBUG_LOGS_DIR) : null) ?? join2(getClaudeConfigHomeDir(), "debug", `${getSessionId()}.txt`);
}
function logAntError(context, error) {
  if (process.env.USER_TYPE !== "ant") {
    return;
  }
  if (error instanceof Error && error.stack) {
    logForDebugging(`[ANT-ONLY] ${context} stack trace:
${error.stack}`, {
      level: "error"
    });
  }
}
var LEVEL_ORDER, getMinDebugLogLevel, runtimeDebugEnabled = false, isDebugMode, getDebugFilter, isDebugToStdErr, getDebugFilePath, hasFormattedOutput = false, debugWriter = null, pendingWrite, updateLatestDebugLogSymlink;
var init_debug = __esm(() => {
  init_memoize();
  init_state();
  init_bufferedWriter();
  init_cleanupRegistry();
  init_debugFilter();
  init_envUtils();
  init_fsOperations();
  init_process();
  init_slowOperations();
  LEVEL_ORDER = {
    verbose: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4
  };
  getMinDebugLogLevel = memoize_default(() => {
    const raw = process.env.CLAUDE_CODE_DEBUG_LOG_LEVEL?.toLowerCase().trim();
    if (raw && Object.hasOwn(LEVEL_ORDER, raw)) {
      return raw;
    }
    return "debug";
  });
  isDebugMode = memoize_default(() => {
    return runtimeDebugEnabled || isEnvTruthy(process.env.DEBUG) || isEnvTruthy(process.env.DEBUG_SDK) || process.argv.includes("--debug") || process.argv.includes("-d") || isDebugToStdErr() || process.argv.some((arg) => arg.startsWith("--debug=")) || getDebugFilePath() !== null;
  });
  getDebugFilter = memoize_default(() => {
    const debugArg = process.argv.find((arg) => arg.startsWith("--debug="));
    if (!debugArg) {
      return null;
    }
    const filterPattern = debugArg.substring("--debug=".length);
    return parseDebugFilter(filterPattern);
  });
  isDebugToStdErr = memoize_default(() => {
    return process.argv.includes("--debug-to-stderr");
  });
  getDebugFilePath = memoize_default(() => {
    for (let i = 0;i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (arg.startsWith("--debug-file=")) {
        return resolve2(arg.substring("--debug-file=".length));
      }
      if (arg === "--debug-file" && i + 1 < process.argv.length) {
        return resolve2(process.argv[i + 1]);
      }
    }
    return null;
  });
  pendingWrite = Promise.resolve();
  updateLatestDebugLogSymlink = memoize_default(async () => {
    try {
      const debugLogPath = getDebugLogPath();
      const debugLogsDir = dirname2(debugLogPath);
      const latestSymlinkPath = join2(debugLogsDir, "latest");
      await unlink(latestSymlinkPath).catch(() => {});
      await symlink(debugLogPath, latestSymlinkPath);
    } catch {}
  });
});

export { createBufferedWriter, init_bufferedWriter, registerCleanup, runCleanupFunctions, init_cleanupRegistry, ClaudeError, MalformedCommandError, AbortError, isAbortError, ConfigParseError, ShellError, TeleportOperationError, TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, hasExactErrorMessage, toError, errorMessage, getErrnoCode, isENOENT, getErrnoPath, shortErrorStack, isFsInaccessible, classifyAxiosError, init_errors, _defineProperty_default, init__defineProperty, _baseAssignValue_default, init__baseAssignValue, _assignValue_default, init__assignValue, _copyObject_default, init__copyObject, keysIn_default, init_keysIn, _cloneBuffer_default, init__cloneBuffer, _copyArray_default, init__copyArray, _getPrototype_default, init__getPrototype, _getAllKeysIn_default, init__getAllKeysIn, _cloneTypedArray_default, init__cloneTypedArray, _initCloneObject_default, init__initCloneObject, _baseClone_default, init__baseClone, cloneDeep_default, init_cloneDeep, slowLogging, jsonStringify, jsonParse, clone, writeFileSync_DEPRECATED, init_slowOperations, safeResolvePath, isDuplicatePath, getPathsForPermissionCheck, getFsImplementation, readFileRange, tailFile, readLinesReverse, init_fsOperations, getMinDebugLogLevel, isDebugMode, enableDebugLogging, getDebugFilter, isDebugToStdErr, getDebugFilePath, setHasFormattedOutput, getHasFormattedOutput, flushDebugLogs, logForDebugging, getDebugLogPath, logAntError, exports_debug, init_debug };

//# debugId=D24524B561FEBD5C64756E2164756E21
//# sourceMappingURL=chunk-82pkdrt0.js.map
