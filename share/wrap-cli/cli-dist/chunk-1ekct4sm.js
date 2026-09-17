// @bun
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  require_semver
} from "./chunk-6x35ffpx.js";
import {
  figures_default,
  init_figures
} from "./chunk-c5g9shkw.js";
import {
  init_isSymbol,
  isSymbol_default
} from "./chunk-tj0dzck2.js";
import {
  init_mjs,
  onExit
} from "./chunk-aeysytks.js";
import {
  _root_default,
  init__root,
  init_isObject,
  isObject_default
} from "./chunk-yes1my80.js";
import {
  createSupportsColor,
  init_supports_color
} from "./chunk-3nk9q8dr.js";
import {
  __commonJS,
  __esm,
  __export,
  __require,
  __toESM
} from "./chunk-hhsxm2yr.js";

// node_modules/.bun/auto-bind@5.0.1/node_modules/auto-bind/index.js
function autoBind(self2, { include, exclude } = {}) {
  const filter = (key) => {
    const match = (pattern) => typeof pattern === "string" ? key === pattern : pattern.test(key);
    if (include) {
      return include.some(match);
    }
    if (exclude) {
      return !exclude.some(match);
    }
    return true;
  };
  for (const [object, key] of getAllProperties(self2.constructor.prototype)) {
    if (key === "constructor" || !filter(key)) {
      continue;
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
    if (descriptor && typeof descriptor.value === "function") {
      self2[key] = self2[key].bind(self2);
    }
  }
  return self2;
}
var getAllProperties = (object) => {
  const properties = new Set;
  do {
    for (const key of Reflect.ownKeys(object)) {
      properties.add([object, key]);
    }
  } while ((object = Reflect.getPrototypeOf(object)) && object !== Object.prototype);
  return properties;
};
var init_auto_bind = () => {};

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/noop.js
function noop() {}
var noop_default;
var init_noop = __esm(() => {
  noop_default = noop;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/now.js
var now = function() {
  return _root_default.Date.now();
}, now_default;
var init_now = __esm(() => {
  init__root();
  now_default = now;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_trimmedEndIndex.js
function trimmedEndIndex(string) {
  var index = string.length;
  while (index-- && reWhitespace.test(string.charAt(index))) {}
  return index;
}
var reWhitespace, _trimmedEndIndex_default;
var init__trimmedEndIndex = __esm(() => {
  reWhitespace = /\s/;
  _trimmedEndIndex_default = trimmedEndIndex;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseTrim.js
function baseTrim(string) {
  return string ? string.slice(0, _trimmedEndIndex_default(string) + 1).replace(reTrimStart, "") : string;
}
var reTrimStart, _baseTrim_default;
var init__baseTrim = __esm(() => {
  init__trimmedEndIndex();
  reTrimStart = /^\s+/;
  _baseTrim_default = baseTrim;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/toNumber.js
function toNumber(value) {
  if (typeof value == "number") {
    return value;
  }
  if (isSymbol_default(value)) {
    return NAN;
  }
  if (isObject_default(value)) {
    var other = typeof value.valueOf == "function" ? value.valueOf() : value;
    value = isObject_default(other) ? other + "" : other;
  }
  if (typeof value != "string") {
    return value === 0 ? value : +value;
  }
  value = _baseTrim_default(value);
  var isBinary = reIsBinary.test(value);
  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
var NAN, reIsBadHex, reIsBinary, reIsOctal, freeParseInt, toNumber_default;
var init_toNumber = __esm(() => {
  init__baseTrim();
  init_isObject();
  init_isSymbol();
  NAN = 0 / 0;
  reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
  reIsBinary = /^0b[01]+$/i;
  reIsOctal = /^0o[0-7]+$/i;
  freeParseInt = parseInt;
  toNumber_default = toNumber;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/debounce.js
function debounce(func, wait, options) {
  var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
  if (typeof func != "function") {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber_default(wait) || 0;
  if (isObject_default(options)) {
    leading = !!options.leading;
    maxing = "maxWait" in options;
    maxWait = maxing ? nativeMax(toNumber_default(options.maxWait) || 0, wait) : maxWait;
    trailing = "trailing" in options ? !!options.trailing : trailing;
  }
  function invokeFunc(time) {
    var args = lastArgs, thisArg = lastThis;
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }
  function leadingEdge(time) {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }
  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
    return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  }
  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
    return lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
  }
  function timerExpired() {
    var time = now_default();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = setTimeout(timerExpired, remainingWait(time));
  }
  function trailingEdge(time) {
    timerId = undefined;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }
  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }
  function flush() {
    return timerId === undefined ? result : trailingEdge(now_default());
  }
  function debounced() {
    var time = now_default(), isInvoking = shouldInvoke(time);
    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}
var FUNC_ERROR_TEXT = "Expected a function", nativeMax, nativeMin, debounce_default;
var init_debounce = __esm(() => {
  init_isObject();
  init_now();
  init_toNumber();
  nativeMax = Math.max;
  nativeMin = Math.min;
  debounce_default = debounce;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/throttle.js
function throttle(func, wait, options) {
  var leading = true, trailing = true;
  if (typeof func != "function") {
    throw new TypeError(FUNC_ERROR_TEXT2);
  }
  if (isObject_default(options)) {
    leading = "leading" in options ? !!options.leading : leading;
    trailing = "trailing" in options ? !!options.trailing : trailing;
  }
  return debounce_default(func, wait, {
    leading,
    maxWait: wait,
    trailing
  });
}
var FUNC_ERROR_TEXT2 = "Expected a function", throttle_default;
var init_throttle = __esm(() => {
  init_debounce();
  init_isObject();
  throttle_default = throttle;
});

// node_modules/.bun/react-reconciler@0.33.0+3f10a4be4e334a9b/node_modules/react-reconciler/cjs/react-reconciler-constants.production.js
var require_react_reconciler_constants_production = __commonJS((exports) => {
  exports.ConcurrentRoot = 1;
  exports.ContinuousEventPriority = 8;
  exports.DefaultEventPriority = 32;
  exports.DiscreteEventPriority = 2;
  exports.IdleEventPriority = 268435456;
  exports.LegacyRoot = 0;
  exports.NoEventPriority = 0;
});

// node_modules/.bun/react-reconciler@0.33.0+3f10a4be4e334a9b/node_modules/react-reconciler/constants.js
var require_constants = __commonJS((exports, module) => {
  if (true) {
    module.exports = require_react_reconciler_constants_production();
  }
});

// packages/@ant/ink/src/core/yoga-layout/enums.ts
var Align, Direction, Display, Edge, Errata, FlexDirection, Gutter, Justify, MeasureMode, Overflow, PositionType, Unit, Wrap;
var init_enums = __esm(() => {
  Align = {
    Auto: 0,
    FlexStart: 1,
    Center: 2,
    FlexEnd: 3,
    Stretch: 4,
    Baseline: 5,
    SpaceBetween: 6,
    SpaceAround: 7,
    SpaceEvenly: 8
  };
  Direction = {
    Inherit: 0,
    LTR: 1,
    RTL: 2
  };
  Display = {
    Flex: 0,
    None: 1,
    Contents: 2
  };
  Edge = {
    Left: 0,
    Top: 1,
    Right: 2,
    Bottom: 3,
    Start: 4,
    End: 5,
    Horizontal: 6,
    Vertical: 7,
    All: 8
  };
  Errata = {
    None: 0,
    StretchFlexBasis: 1,
    AbsolutePositionWithoutInsetsExcludesPadding: 2,
    AbsolutePercentAgainstInnerSize: 4,
    All: 2147483647,
    Classic: 2147483646
  };
  FlexDirection = {
    Column: 0,
    ColumnReverse: 1,
    Row: 2,
    RowReverse: 3
  };
  Gutter = {
    Column: 0,
    Row: 1,
    All: 2
  };
  Justify = {
    FlexStart: 0,
    Center: 1,
    FlexEnd: 2,
    SpaceBetween: 3,
    SpaceAround: 4,
    SpaceEvenly: 5
  };
  MeasureMode = {
    Undefined: 0,
    Exactly: 1,
    AtMost: 2
  };
  Overflow = {
    Visible: 0,
    Hidden: 1,
    Scroll: 2
  };
  PositionType = {
    Static: 0,
    Relative: 1,
    Absolute: 2
  };
  Unit = {
    Undefined: 0,
    Point: 1,
    Percent: 2,
    Auto: 3
  };
  Wrap = {
    NoWrap: 0,
    Wrap: 1,
    WrapReverse: 2
  };
});

// packages/@ant/ink/src/core/yoga-layout/index.ts
function pointValue(v) {
  return { unit: Unit.Point, value: v };
}
function percentValue(v) {
  return { unit: Unit.Percent, value: v };
}
function resolveValue(v, ownerSize) {
  switch (v.unit) {
    case Unit.Point:
      return v.value;
    case Unit.Percent:
      return isNaN(ownerSize) ? NaN : v.value * ownerSize / 100;
    default:
      return NaN;
  }
}
function isDefined(n) {
  return !isNaN(n);
}
function sameFloat(a, b) {
  return a === b || a !== a && b !== b;
}
function defaultStyle() {
  return {
    direction: Direction.Inherit,
    flexDirection: FlexDirection.Column,
    justifyContent: Justify.FlexStart,
    alignItems: Align.Stretch,
    alignSelf: Align.Auto,
    alignContent: Align.FlexStart,
    flexWrap: Wrap.NoWrap,
    overflow: Overflow.Visible,
    display: Display.Flex,
    positionType: PositionType.Relative,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: AUTO_VALUE,
    margin: new Array(9).fill(UNDEFINED_VALUE),
    padding: new Array(9).fill(UNDEFINED_VALUE),
    border: new Array(9).fill(UNDEFINED_VALUE),
    position: new Array(9).fill(UNDEFINED_VALUE),
    gap: new Array(3).fill(UNDEFINED_VALUE),
    width: AUTO_VALUE,
    height: AUTO_VALUE,
    minWidth: UNDEFINED_VALUE,
    minHeight: UNDEFINED_VALUE,
    maxWidth: UNDEFINED_VALUE,
    maxHeight: UNDEFINED_VALUE
  };
}
function resolveEdge(edges, physicalEdge, ownerSize, allowAuto = false) {
  let v = edges[physicalEdge];
  if (v.unit === Unit.Undefined) {
    if (physicalEdge === EDGE_LEFT || physicalEdge === EDGE_RIGHT) {
      v = edges[Edge.Horizontal];
    } else {
      v = edges[Edge.Vertical];
    }
  }
  if (v.unit === Unit.Undefined) {
    v = edges[Edge.All];
  }
  if (v.unit === Unit.Undefined) {
    if (physicalEdge === EDGE_LEFT)
      v = edges[Edge.Start];
    if (physicalEdge === EDGE_RIGHT)
      v = edges[Edge.End];
  }
  if (v.unit === Unit.Undefined)
    return 0;
  if (v.unit === Unit.Auto)
    return allowAuto ? NaN : 0;
  return resolveValue(v, ownerSize);
}
function resolveEdgeRaw(edges, physicalEdge) {
  let v = edges[physicalEdge];
  if (v.unit === Unit.Undefined) {
    if (physicalEdge === EDGE_LEFT || physicalEdge === EDGE_RIGHT) {
      v = edges[Edge.Horizontal];
    } else {
      v = edges[Edge.Vertical];
    }
  }
  if (v.unit === Unit.Undefined)
    v = edges[Edge.All];
  if (v.unit === Unit.Undefined) {
    if (physicalEdge === EDGE_LEFT)
      v = edges[Edge.Start];
    if (physicalEdge === EDGE_RIGHT)
      v = edges[Edge.End];
  }
  return v;
}
function isMarginAuto(edges, physicalEdge) {
  return resolveEdgeRaw(edges, physicalEdge).unit === Unit.Auto;
}
function hasAnyAutoEdge(edges) {
  for (let i = 0;i < 9; i++)
    if (edges[i].unit === 3)
      return true;
  return false;
}
function hasAnyDefinedEdge(edges) {
  for (let i = 0;i < 9; i++)
    if (edges[i].unit !== 0)
      return true;
  return false;
}
function resolveEdges4Into(edges, ownerSize, out) {
  const eH = edges[6];
  const eV = edges[7];
  const eA = edges[8];
  const eS = edges[4];
  const eE = edges[5];
  const pctDenom = isNaN(ownerSize) ? NaN : ownerSize / 100;
  let v = edges[0];
  if (v.unit === 0)
    v = eH;
  if (v.unit === 0)
    v = eA;
  if (v.unit === 0)
    v = eS;
  out[0] = v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDenom : 0;
  v = edges[1];
  if (v.unit === 0)
    v = eV;
  if (v.unit === 0)
    v = eA;
  out[1] = v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDenom : 0;
  v = edges[2];
  if (v.unit === 0)
    v = eH;
  if (v.unit === 0)
    v = eA;
  if (v.unit === 0)
    v = eE;
  out[2] = v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDenom : 0;
  v = edges[3];
  if (v.unit === 0)
    v = eV;
  if (v.unit === 0)
    v = eA;
  out[3] = v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDenom : 0;
}
function isRow(dir) {
  return dir === FlexDirection.Row || dir === FlexDirection.RowReverse;
}
function isReverse(dir) {
  return dir === FlexDirection.RowReverse || dir === FlexDirection.ColumnReverse;
}
function crossAxis(dir) {
  return isRow(dir) ? FlexDirection.Column : FlexDirection.Row;
}
function leadingEdge(dir) {
  switch (dir) {
    case FlexDirection.Row:
      return EDGE_LEFT;
    case FlexDirection.RowReverse:
      return EDGE_RIGHT;
    case FlexDirection.Column:
      return EDGE_TOP;
    case FlexDirection.ColumnReverse:
      return EDGE_BOTTOM;
  }
}
function trailingEdge(dir) {
  switch (dir) {
    case FlexDirection.Row:
      return EDGE_RIGHT;
    case FlexDirection.RowReverse:
      return EDGE_LEFT;
    case FlexDirection.Column:
      return EDGE_BOTTOM;
    case FlexDirection.ColumnReverse:
      return EDGE_TOP;
  }
}
function createConfig() {
  const config = {
    pointScaleFactor: 1,
    errata: Errata.None,
    useWebDefaults: false,
    free() {},
    isExperimentalFeatureEnabled() {
      return false;
    },
    setExperimentalFeatureEnabled() {},
    setPointScaleFactor(f) {
      config.pointScaleFactor = f;
    },
    getErrata() {
      return config.errata;
    },
    setErrata(e) {
      config.errata = e;
    },
    setUseWebDefaults(v) {
      config.useWebDefaults = v;
    }
  };
  return config;
}

class Node {
  style;
  layout;
  parent;
  children;
  measureFunc;
  config;
  isDirty_;
  isReferenceBaseline_;
  _flexBasis = 0;
  _mainSize = 0;
  _crossSize = 0;
  _lineIndex = 0;
  _hasAutoMargin = false;
  _hasPosition = false;
  _hasPadding = false;
  _hasBorder = false;
  _hasMargin = false;
  _lW = NaN;
  _lH = NaN;
  _lWM = 0;
  _lHM = 0;
  _lOW = NaN;
  _lOH = NaN;
  _lFW = false;
  _lFH = false;
  _lOutW = NaN;
  _lOutH = NaN;
  _hasL = false;
  _mW = NaN;
  _mH = NaN;
  _mWM = 0;
  _mHM = 0;
  _mOW = NaN;
  _mOH = NaN;
  _mOutW = NaN;
  _mOutH = NaN;
  _hasM = false;
  _fbBasis = NaN;
  _fbOwnerW = NaN;
  _fbOwnerH = NaN;
  _fbAvailMain = NaN;
  _fbAvailCross = NaN;
  _fbCrossMode = 0;
  _fbGen = -1;
  _cIn = null;
  _cOut = null;
  _cGen = -1;
  _cN = 0;
  _cWr = 0;
  constructor(config) {
    this.style = defaultStyle();
    this.layout = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      border: [0, 0, 0, 0],
      padding: [0, 0, 0, 0],
      margin: [0, 0, 0, 0]
    };
    this.parent = null;
    this.children = [];
    this.measureFunc = null;
    this.config = config ?? DEFAULT_CONFIG;
    this.isDirty_ = true;
    this.isReferenceBaseline_ = false;
    _yogaLiveNodes++;
  }
  insertChild(child, index) {
    child.parent = this;
    this.children.splice(index, 0, child);
    this.markDirty();
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parent = null;
      this.markDirty();
    }
  }
  getChild(index) {
    return this.children[index];
  }
  getChildCount() {
    return this.children.length;
  }
  getParent() {
    return this.parent;
  }
  free() {
    this.parent = null;
    this.children = [];
    this.measureFunc = null;
    this._cIn = null;
    this._cOut = null;
    _yogaLiveNodes--;
  }
  freeRecursive() {
    for (const c of this.children)
      c.freeRecursive();
    this.free();
  }
  reset() {
    this.style = defaultStyle();
    this.children = [];
    this.parent = null;
    this.measureFunc = null;
    this.isDirty_ = true;
    this._hasAutoMargin = false;
    this._hasPosition = false;
    this._hasPadding = false;
    this._hasBorder = false;
    this._hasMargin = false;
    this._hasL = false;
    this._hasM = false;
    this._cN = 0;
    this._cWr = 0;
    this._fbBasis = NaN;
  }
  markDirty() {
    this.isDirty_ = true;
    if (this.parent && !this.parent.isDirty_)
      this.parent.markDirty();
  }
  isDirty() {
    return this.isDirty_;
  }
  hasNewLayout() {
    return true;
  }
  markLayoutSeen() {}
  setMeasureFunc(fn) {
    this.measureFunc = fn;
    this.markDirty();
  }
  unsetMeasureFunc() {
    this.measureFunc = null;
    this.markDirty();
  }
  getComputedLeft() {
    return this.layout.left;
  }
  getComputedTop() {
    return this.layout.top;
  }
  getComputedWidth() {
    return this.layout.width;
  }
  getComputedHeight() {
    return this.layout.height;
  }
  getComputedRight() {
    const p = this.parent;
    return p ? p.layout.width - this.layout.left - this.layout.width : 0;
  }
  getComputedBottom() {
    const p = this.parent;
    return p ? p.layout.height - this.layout.top - this.layout.height : 0;
  }
  getComputedLayout() {
    return {
      left: this.layout.left,
      top: this.layout.top,
      right: this.getComputedRight(),
      bottom: this.getComputedBottom(),
      width: this.layout.width,
      height: this.layout.height
    };
  }
  getComputedBorder(edge) {
    return this.layout.border[physicalEdge(edge)];
  }
  getComputedPadding(edge) {
    return this.layout.padding[physicalEdge(edge)];
  }
  getComputedMargin(edge) {
    return this.layout.margin[physicalEdge(edge)];
  }
  setWidth(v) {
    this.style.width = parseDimension(v);
    this.markDirty();
  }
  setWidthPercent(v) {
    this.style.width = percentValue(v);
    this.markDirty();
  }
  setWidthAuto() {
    this.style.width = AUTO_VALUE;
    this.markDirty();
  }
  setHeight(v) {
    this.style.height = parseDimension(v);
    this.markDirty();
  }
  setHeightPercent(v) {
    this.style.height = percentValue(v);
    this.markDirty();
  }
  setHeightAuto() {
    this.style.height = AUTO_VALUE;
    this.markDirty();
  }
  setMinWidth(v) {
    this.style.minWidth = parseDimension(v);
    this.markDirty();
  }
  setMinWidthPercent(v) {
    this.style.minWidth = percentValue(v);
    this.markDirty();
  }
  setMinHeight(v) {
    this.style.minHeight = parseDimension(v);
    this.markDirty();
  }
  setMinHeightPercent(v) {
    this.style.minHeight = percentValue(v);
    this.markDirty();
  }
  setMaxWidth(v) {
    this.style.maxWidth = parseDimension(v);
    this.markDirty();
  }
  setMaxWidthPercent(v) {
    this.style.maxWidth = percentValue(v);
    this.markDirty();
  }
  setMaxHeight(v) {
    this.style.maxHeight = parseDimension(v);
    this.markDirty();
  }
  setMaxHeightPercent(v) {
    this.style.maxHeight = percentValue(v);
    this.markDirty();
  }
  setFlexDirection(dir) {
    this.style.flexDirection = dir;
    this.markDirty();
  }
  setFlexGrow(v) {
    this.style.flexGrow = v ?? 0;
    this.markDirty();
  }
  setFlexShrink(v) {
    this.style.flexShrink = v ?? 0;
    this.markDirty();
  }
  setFlex(v) {
    if (v === undefined || isNaN(v)) {
      this.style.flexGrow = 0;
      this.style.flexShrink = 0;
    } else if (v > 0) {
      this.style.flexGrow = v;
      this.style.flexShrink = 1;
      this.style.flexBasis = pointValue(0);
    } else if (v < 0) {
      this.style.flexGrow = 0;
      this.style.flexShrink = -v;
    } else {
      this.style.flexGrow = 0;
      this.style.flexShrink = 0;
    }
    this.markDirty();
  }
  setFlexBasis(v) {
    this.style.flexBasis = parseDimension(v);
    this.markDirty();
  }
  setFlexBasisPercent(v) {
    this.style.flexBasis = percentValue(v);
    this.markDirty();
  }
  setFlexBasisAuto() {
    this.style.flexBasis = AUTO_VALUE;
    this.markDirty();
  }
  setFlexWrap(wrap) {
    this.style.flexWrap = wrap;
    this.markDirty();
  }
  setAlignItems(a) {
    this.style.alignItems = a;
    this.markDirty();
  }
  setAlignSelf(a) {
    this.style.alignSelf = a;
    this.markDirty();
  }
  setAlignContent(a) {
    this.style.alignContent = a;
    this.markDirty();
  }
  setJustifyContent(j) {
    this.style.justifyContent = j;
    this.markDirty();
  }
  setDisplay(d) {
    this.style.display = d;
    this.markDirty();
  }
  getDisplay() {
    return this.style.display;
  }
  setPositionType(t) {
    this.style.positionType = t;
    this.markDirty();
  }
  setPosition(edge, v) {
    this.style.position[edge] = parseDimension(v);
    this._hasPosition = hasAnyDefinedEdge(this.style.position);
    this.markDirty();
  }
  setPositionPercent(edge, v) {
    this.style.position[edge] = percentValue(v);
    this._hasPosition = true;
    this.markDirty();
  }
  setPositionAuto(edge) {
    this.style.position[edge] = AUTO_VALUE;
    this._hasPosition = true;
    this.markDirty();
  }
  setOverflow(o) {
    this.style.overflow = o;
    this.markDirty();
  }
  setDirection(d) {
    this.style.direction = d;
    this.markDirty();
  }
  setBoxSizing(_) {}
  setMargin(edge, v) {
    const val = parseDimension(v);
    this.style.margin[edge] = val;
    if (val.unit === Unit.Auto)
      this._hasAutoMargin = true;
    else
      this._hasAutoMargin = hasAnyAutoEdge(this.style.margin);
    this._hasMargin = this._hasAutoMargin || hasAnyDefinedEdge(this.style.margin);
    this.markDirty();
  }
  setMarginPercent(edge, v) {
    this.style.margin[edge] = percentValue(v);
    this._hasAutoMargin = hasAnyAutoEdge(this.style.margin);
    this._hasMargin = true;
    this.markDirty();
  }
  setMarginAuto(edge) {
    this.style.margin[edge] = AUTO_VALUE;
    this._hasAutoMargin = true;
    this._hasMargin = true;
    this.markDirty();
  }
  setPadding(edge, v) {
    this.style.padding[edge] = parseDimension(v);
    this._hasPadding = hasAnyDefinedEdge(this.style.padding);
    this.markDirty();
  }
  setPaddingPercent(edge, v) {
    this.style.padding[edge] = percentValue(v);
    this._hasPadding = true;
    this.markDirty();
  }
  setBorder(edge, v) {
    this.style.border[edge] = v === undefined ? UNDEFINED_VALUE : pointValue(v);
    this._hasBorder = hasAnyDefinedEdge(this.style.border);
    this.markDirty();
  }
  setGap(gutter, v) {
    this.style.gap[gutter] = parseDimension(v);
    this.markDirty();
  }
  setGapPercent(gutter, v) {
    this.style.gap[gutter] = percentValue(v);
    this.markDirty();
  }
  getFlexDirection() {
    return this.style.flexDirection;
  }
  getJustifyContent() {
    return this.style.justifyContent;
  }
  getAlignItems() {
    return this.style.alignItems;
  }
  getAlignSelf() {
    return this.style.alignSelf;
  }
  getAlignContent() {
    return this.style.alignContent;
  }
  getFlexGrow() {
    return this.style.flexGrow;
  }
  getFlexShrink() {
    return this.style.flexShrink;
  }
  getFlexBasis() {
    return this.style.flexBasis;
  }
  getFlexWrap() {
    return this.style.flexWrap;
  }
  getWidth() {
    return this.style.width;
  }
  getHeight() {
    return this.style.height;
  }
  getOverflow() {
    return this.style.overflow;
  }
  getPositionType() {
    return this.style.positionType;
  }
  getDirection() {
    return this.style.direction;
  }
  copyStyle(_) {}
  setDirtiedFunc(_) {}
  unsetDirtiedFunc() {}
  setIsReferenceBaseline(v) {
    this.isReferenceBaseline_ = v;
    this.markDirty();
  }
  isReferenceBaseline() {
    return this.isReferenceBaseline_;
  }
  setAspectRatio(_) {}
  getAspectRatio() {
    return NaN;
  }
  setAlwaysFormsContainingBlock(_) {}
  calculateLayout(ownerWidth, ownerHeight, _direction) {
    _yogaNodesVisited = 0;
    _yogaMeasureCalls = 0;
    _yogaCacheHits = 0;
    _generation++;
    const w = ownerWidth === undefined ? NaN : ownerWidth;
    const h = ownerHeight === undefined ? NaN : ownerHeight;
    layoutNode(this, w, h, isDefined(w) ? MeasureMode.Exactly : MeasureMode.Undefined, isDefined(h) ? MeasureMode.Exactly : MeasureMode.Undefined, w, h, true);
    const mar = this.layout.margin;
    const posL = resolveValue(resolveEdgeRaw(this.style.position, EDGE_LEFT), isDefined(w) ? w : 0);
    const posT = resolveValue(resolveEdgeRaw(this.style.position, EDGE_TOP), isDefined(w) ? w : 0);
    this.layout.left = mar[EDGE_LEFT] + (isDefined(posL) ? posL : 0);
    this.layout.top = mar[EDGE_TOP] + (isDefined(posT) ? posT : 0);
    roundLayout(this, this.config.pointScaleFactor, 0, 0);
  }
}
function cacheWrite(node, aW, aH, wM, hM, oW, oH, fW, fH, wasDirty) {
  if (!node._cIn) {
    node._cIn = new Float64Array(CACHE_SLOTS * 8);
    node._cOut = new Float64Array(CACHE_SLOTS * 2);
  }
  if (wasDirty && node._cGen !== _generation) {
    node._cN = 0;
    node._cWr = 0;
  }
  const i = node._cWr++ % CACHE_SLOTS;
  if (node._cN < CACHE_SLOTS)
    node._cN = node._cWr;
  const o = i * 8;
  const cIn = node._cIn;
  cIn[o] = aW;
  cIn[o + 1] = aH;
  cIn[o + 2] = wM;
  cIn[o + 3] = hM;
  cIn[o + 4] = oW;
  cIn[o + 5] = oH;
  cIn[o + 6] = fW ? 1 : 0;
  cIn[o + 7] = fH ? 1 : 0;
  node._cOut[i * 2] = node.layout.width;
  node._cOut[i * 2 + 1] = node.layout.height;
  node._cGen = _generation;
}
function commitCacheOutputs(node, performLayout) {
  if (performLayout) {
    node._lOutW = node.layout.width;
    node._lOutH = node.layout.height;
  } else {
    node._mOutW = node.layout.width;
    node._mOutH = node.layout.height;
  }
}
function getYogaCounters() {
  return {
    visited: _yogaNodesVisited,
    measured: _yogaMeasureCalls,
    cacheHits: _yogaCacheHits,
    live: _yogaLiveNodes
  };
}
function layoutNode(node, availableWidth, availableHeight, widthMode, heightMode, ownerWidth, ownerHeight, performLayout, forceWidth = false, forceHeight = false) {
  _yogaNodesVisited++;
  const style = node.style;
  const layout = node.layout;
  const sameGen = node._cGen === _generation && !performLayout;
  if (!node.isDirty_ || sameGen) {
    if (!node.isDirty_ && node._hasL && node._lWM === widthMode && node._lHM === heightMode && node._lFW === forceWidth && node._lFH === forceHeight && sameFloat(node._lW, availableWidth) && sameFloat(node._lH, availableHeight) && sameFloat(node._lOW, ownerWidth) && sameFloat(node._lOH, ownerHeight)) {
      _yogaCacheHits++;
      layout.width = node._lOutW;
      layout.height = node._lOutH;
      return;
    }
    if (node._cN > 0 && (sameGen || !node.isDirty_)) {
      const cIn = node._cIn;
      for (let i = 0;i < node._cN; i++) {
        const o = i * 8;
        if (cIn[o + 2] === widthMode && cIn[o + 3] === heightMode && cIn[o + 6] === (forceWidth ? 1 : 0) && cIn[o + 7] === (forceHeight ? 1 : 0) && sameFloat(cIn[o], availableWidth) && sameFloat(cIn[o + 1], availableHeight) && sameFloat(cIn[o + 4], ownerWidth) && sameFloat(cIn[o + 5], ownerHeight)) {
          layout.width = node._cOut[i * 2];
          layout.height = node._cOut[i * 2 + 1];
          _yogaCacheHits++;
          return;
        }
      }
    }
    if (!node.isDirty_ && !performLayout && node._hasM && node._mWM === widthMode && node._mHM === heightMode && sameFloat(node._mW, availableWidth) && sameFloat(node._mH, availableHeight) && sameFloat(node._mOW, ownerWidth) && sameFloat(node._mOH, ownerHeight)) {
      layout.width = node._mOutW;
      layout.height = node._mOutH;
      _yogaCacheHits++;
      return;
    }
  }
  const wasDirty = node.isDirty_;
  if (performLayout) {
    node._lW = availableWidth;
    node._lH = availableHeight;
    node._lWM = widthMode;
    node._lHM = heightMode;
    node._lOW = ownerWidth;
    node._lOH = ownerHeight;
    node._lFW = forceWidth;
    node._lFH = forceHeight;
    node._hasL = true;
    node.isDirty_ = false;
    if (wasDirty)
      node._hasM = false;
  } else {
    node._mW = availableWidth;
    node._mH = availableHeight;
    node._mWM = widthMode;
    node._mHM = heightMode;
    node._mOW = ownerWidth;
    node._mOH = ownerHeight;
    node._hasM = true;
    if (wasDirty)
      node._hasL = false;
  }
  const pad = layout.padding;
  const bor = layout.border;
  const mar = layout.margin;
  if (node._hasPadding)
    resolveEdges4Into(style.padding, ownerWidth, pad);
  else
    pad[0] = pad[1] = pad[2] = pad[3] = 0;
  if (node._hasBorder)
    resolveEdges4Into(style.border, ownerWidth, bor);
  else
    bor[0] = bor[1] = bor[2] = bor[3] = 0;
  if (node._hasMargin)
    resolveEdges4Into(style.margin, ownerWidth, mar);
  else
    mar[0] = mar[1] = mar[2] = mar[3] = 0;
  const paddingBorderWidth = pad[0] + pad[2] + bor[0] + bor[2];
  const paddingBorderHeight = pad[1] + pad[3] + bor[1] + bor[3];
  const styleWidth = forceWidth ? NaN : resolveValue(style.width, ownerWidth);
  const styleHeight = forceHeight ? NaN : resolveValue(style.height, ownerHeight);
  let width = availableWidth;
  let height = availableHeight;
  let wMode = widthMode;
  let hMode = heightMode;
  if (isDefined(styleWidth)) {
    width = styleWidth;
    wMode = MeasureMode.Exactly;
  }
  if (isDefined(styleHeight)) {
    height = styleHeight;
    hMode = MeasureMode.Exactly;
  }
  width = boundAxis(style, true, width, ownerWidth, ownerHeight);
  height = boundAxis(style, false, height, ownerWidth, ownerHeight);
  if (node.measureFunc && node.children.length === 0) {
    const innerW = wMode === MeasureMode.Undefined ? NaN : Math.max(0, width - paddingBorderWidth);
    const innerH = hMode === MeasureMode.Undefined ? NaN : Math.max(0, height - paddingBorderHeight);
    _yogaMeasureCalls++;
    const measured = node.measureFunc(innerW, wMode, innerH, hMode);
    node.layout.width = wMode === MeasureMode.Exactly ? width : boundAxis(style, true, (measured.width ?? 0) + paddingBorderWidth, ownerWidth, ownerHeight);
    node.layout.height = hMode === MeasureMode.Exactly ? height : boundAxis(style, false, (measured.height ?? 0) + paddingBorderHeight, ownerWidth, ownerHeight);
    commitCacheOutputs(node, performLayout);
    cacheWrite(node, availableWidth, availableHeight, widthMode, heightMode, ownerWidth, ownerHeight, forceWidth, forceHeight, wasDirty);
    return;
  }
  if (node.children.length === 0) {
    node.layout.width = wMode === MeasureMode.Exactly ? width : boundAxis(style, true, paddingBorderWidth, ownerWidth, ownerHeight);
    node.layout.height = hMode === MeasureMode.Exactly ? height : boundAxis(style, false, paddingBorderHeight, ownerWidth, ownerHeight);
    commitCacheOutputs(node, performLayout);
    cacheWrite(node, availableWidth, availableHeight, widthMode, heightMode, ownerWidth, ownerHeight, forceWidth, forceHeight, wasDirty);
    return;
  }
  const mainAxis = style.flexDirection;
  const crossAx = crossAxis(mainAxis);
  const isMainRow = isRow(mainAxis);
  const mainSize = isMainRow ? width : height;
  const crossSize = isMainRow ? height : width;
  const mainMode = isMainRow ? wMode : hMode;
  const crossMode = isMainRow ? hMode : wMode;
  const mainPadBorder = isMainRow ? paddingBorderWidth : paddingBorderHeight;
  const crossPadBorder = isMainRow ? paddingBorderHeight : paddingBorderWidth;
  const innerMainSize = isDefined(mainSize) ? Math.max(0, mainSize - mainPadBorder) : NaN;
  const innerCrossSize = isDefined(crossSize) ? Math.max(0, crossSize - crossPadBorder) : NaN;
  const gapMain = resolveGap(style, isMainRow ? Gutter.Column : Gutter.Row, innerMainSize);
  const flowChildren = [];
  const absChildren = [];
  collectLayoutChildren(node, flowChildren, absChildren);
  const ownerW = isDefined(width) ? width : NaN;
  const ownerH = isDefined(height) ? height : NaN;
  const isWrap = style.flexWrap !== Wrap.NoWrap;
  const gapCross = resolveGap(style, isMainRow ? Gutter.Row : Gutter.Column, innerCrossSize);
  for (const c of flowChildren) {
    c._flexBasis = computeFlexBasis(c, mainAxis, innerMainSize, innerCrossSize, crossMode, ownerW, ownerH);
  }
  const lines = [];
  if (!isWrap || !isDefined(innerMainSize) || flowChildren.length === 0) {
    for (const c of flowChildren)
      c._lineIndex = 0;
    lines.push(flowChildren);
  } else {
    let lineStart = 0;
    let lineLen = 0;
    for (let i = 0;i < flowChildren.length; i++) {
      const c = flowChildren[i];
      const hypo = boundAxis(c.style, isMainRow, c._flexBasis, ownerW, ownerH);
      const outer = Math.max(0, hypo) + childMarginForAxis(c, mainAxis, ownerW);
      const withGap = i > lineStart ? gapMain : 0;
      if (i > lineStart && lineLen + withGap + outer > innerMainSize) {
        lines.push(flowChildren.slice(lineStart, i));
        lineStart = i;
        lineLen = outer;
      } else {
        lineLen += withGap + outer;
      }
      c._lineIndex = lines.length;
    }
    lines.push(flowChildren.slice(lineStart));
  }
  const lineCount = lines.length;
  const isBaseline = isBaselineLayout(node, flowChildren);
  const lineConsumedMain = new Array(lineCount);
  const lineCrossSizes = new Array(lineCount);
  const lineMaxAscent = isBaseline ? new Array(lineCount).fill(0) : [];
  let maxLineMain = 0;
  let totalLinesCross = 0;
  for (let li = 0;li < lineCount; li++) {
    const line = lines[li];
    const lineGap = line.length > 1 ? gapMain * (line.length - 1) : 0;
    let lineBasis = lineGap;
    for (const c of line) {
      lineBasis += c._flexBasis + childMarginForAxis(c, mainAxis, ownerW);
    }
    let availMain = innerMainSize;
    if (!isDefined(availMain)) {
      const mainOwner = isMainRow ? ownerWidth : ownerHeight;
      const minM = resolveValue(isMainRow ? style.minWidth : style.minHeight, mainOwner);
      const maxM = resolveValue(isMainRow ? style.maxWidth : style.maxHeight, mainOwner);
      if (isDefined(maxM) && lineBasis > maxM - mainPadBorder) {
        availMain = Math.max(0, maxM - mainPadBorder);
      } else if (isDefined(minM) && lineBasis < minM - mainPadBorder) {
        availMain = Math.max(0, minM - mainPadBorder);
      }
    }
    resolveFlexibleLengths(line, availMain, lineBasis, isMainRow, ownerW, ownerH);
    let lineCross = 0;
    for (const c of line) {
      const cStyle = c.style;
      const childAlign = cStyle.alignSelf === Align.Auto ? style.alignItems : cStyle.alignSelf;
      const cMarginCross = childMarginForAxis(c, crossAx, ownerW);
      let childCrossSize = NaN;
      let childCrossMode = MeasureMode.Undefined;
      const resolvedCrossStyle = resolveValue(isMainRow ? cStyle.height : cStyle.width, isMainRow ? ownerH : ownerW);
      const crossLeadE = isMainRow ? EDGE_TOP : EDGE_LEFT;
      const crossTrailE = isMainRow ? EDGE_BOTTOM : EDGE_RIGHT;
      const hasCrossAutoMargin = c._hasAutoMargin && (isMarginAuto(cStyle.margin, crossLeadE) || isMarginAuto(cStyle.margin, crossTrailE));
      if (isDefined(resolvedCrossStyle)) {
        childCrossSize = resolvedCrossStyle;
        childCrossMode = MeasureMode.Exactly;
      } else if (childAlign === Align.Stretch && !hasCrossAutoMargin && !isWrap && isDefined(innerCrossSize) && crossMode === MeasureMode.Exactly) {
        childCrossSize = Math.max(0, innerCrossSize - cMarginCross);
        childCrossMode = MeasureMode.Exactly;
      } else if (!isWrap && isDefined(innerCrossSize)) {
        childCrossSize = Math.max(0, innerCrossSize - cMarginCross);
        childCrossMode = MeasureMode.AtMost;
      }
      const cw = isMainRow ? c._mainSize : childCrossSize;
      const ch = isMainRow ? childCrossSize : c._mainSize;
      layoutNode(c, cw, ch, isMainRow ? MeasureMode.Exactly : childCrossMode, isMainRow ? childCrossMode : MeasureMode.Exactly, ownerW, ownerH, performLayout, isMainRow, !isMainRow);
      c._crossSize = isMainRow ? c.layout.height : c.layout.width;
      lineCross = Math.max(lineCross, c._crossSize + cMarginCross);
    }
    if (isBaseline) {
      let maxAscent = 0;
      let maxDescent = 0;
      for (const c of line) {
        if (resolveChildAlign(node, c) !== Align.Baseline)
          continue;
        const mTop = resolveEdge(c.style.margin, EDGE_TOP, ownerW);
        const mBot = resolveEdge(c.style.margin, EDGE_BOTTOM, ownerW);
        const ascent = calculateBaseline(c) + mTop;
        const descent = c.layout.height + mTop + mBot - ascent;
        if (ascent > maxAscent)
          maxAscent = ascent;
        if (descent > maxDescent)
          maxDescent = descent;
      }
      lineMaxAscent[li] = maxAscent;
      if (maxAscent + maxDescent > lineCross) {
        lineCross = maxAscent + maxDescent;
      }
    }
    const mainLead = leadingEdge(mainAxis);
    const mainTrail = trailingEdge(mainAxis);
    let consumed = lineGap;
    for (const c of line) {
      const cm = c.layout.margin;
      consumed += c._mainSize + cm[mainLead] + cm[mainTrail];
    }
    lineConsumedMain[li] = consumed;
    lineCrossSizes[li] = lineCross;
    maxLineMain = Math.max(maxLineMain, consumed);
    totalLinesCross += lineCross;
  }
  const totalCrossGap = lineCount > 1 ? gapCross * (lineCount - 1) : 0;
  totalLinesCross += totalCrossGap;
  const isScroll = style.overflow === Overflow.Scroll;
  const contentMain = maxLineMain + mainPadBorder;
  const finalMainSize = mainMode === MeasureMode.Exactly ? mainSize : mainMode === MeasureMode.AtMost && isScroll ? Math.max(Math.min(mainSize, contentMain), mainPadBorder) : isWrap && lineCount > 1 && mainMode === MeasureMode.AtMost ? mainSize : contentMain;
  const contentCross = totalLinesCross + crossPadBorder;
  const finalCrossSize = crossMode === MeasureMode.Exactly ? crossSize : crossMode === MeasureMode.AtMost && isScroll ? Math.max(Math.min(crossSize, contentCross), crossPadBorder) : contentCross;
  node.layout.width = boundAxis(style, true, isMainRow ? finalMainSize : finalCrossSize, ownerWidth, ownerHeight);
  node.layout.height = boundAxis(style, false, isMainRow ? finalCrossSize : finalMainSize, ownerWidth, ownerHeight);
  commitCacheOutputs(node, performLayout);
  cacheWrite(node, availableWidth, availableHeight, widthMode, heightMode, ownerWidth, ownerHeight, forceWidth, forceHeight, wasDirty);
  if (!performLayout)
    return;
  const actualInnerMain = (isMainRow ? node.layout.width : node.layout.height) - mainPadBorder;
  const actualInnerCross = (isMainRow ? node.layout.height : node.layout.width) - crossPadBorder;
  const mainLeadEdgePhys = leadingEdge(mainAxis);
  const mainTrailEdgePhys = trailingEdge(mainAxis);
  const crossLeadEdgePhys = isMainRow ? EDGE_TOP : EDGE_LEFT;
  const crossTrailEdgePhys = isMainRow ? EDGE_BOTTOM : EDGE_RIGHT;
  const reversed = isReverse(mainAxis);
  const mainContainerSize = isMainRow ? node.layout.width : node.layout.height;
  const crossLead = pad[crossLeadEdgePhys] + bor[crossLeadEdgePhys];
  let lineCrossOffset = crossLead;
  let betweenLines = gapCross;
  const freeCross = actualInnerCross - totalLinesCross;
  if (lineCount === 1 && !isWrap && !isBaseline) {
    lineCrossSizes[0] = actualInnerCross;
  } else {
    const remCross = Math.max(0, freeCross);
    switch (style.alignContent) {
      case Align.FlexStart:
        break;
      case Align.Center:
        lineCrossOffset += freeCross / 2;
        break;
      case Align.FlexEnd:
        lineCrossOffset += freeCross;
        break;
      case Align.Stretch:
        if (lineCount > 0 && remCross > 0) {
          const add = remCross / lineCount;
          for (let i = 0;i < lineCount; i++)
            lineCrossSizes[i] += add;
        }
        break;
      case Align.SpaceBetween:
        if (lineCount > 1)
          betweenLines += remCross / (lineCount - 1);
        break;
      case Align.SpaceAround:
        if (lineCount > 0) {
          betweenLines += remCross / lineCount;
          lineCrossOffset += remCross / lineCount / 2;
        }
        break;
      case Align.SpaceEvenly:
        if (lineCount > 0) {
          betweenLines += remCross / (lineCount + 1);
          lineCrossOffset += remCross / (lineCount + 1);
        }
        break;
      default:
        break;
    }
  }
  const wrapReverse = style.flexWrap === Wrap.WrapReverse;
  const crossContainerSize = isMainRow ? node.layout.height : node.layout.width;
  let lineCrossPos = lineCrossOffset;
  for (let li = 0;li < lineCount; li++) {
    const line = lines[li];
    const lineCross = lineCrossSizes[li];
    const consumedMain = lineConsumedMain[li];
    const n = line.length;
    if (isWrap || crossMode !== MeasureMode.Exactly) {
      for (const c of line) {
        const cStyle = c.style;
        const childAlign = cStyle.alignSelf === Align.Auto ? style.alignItems : cStyle.alignSelf;
        const crossStyleDef = isDefined(resolveValue(isMainRow ? cStyle.height : cStyle.width, isMainRow ? ownerH : ownerW));
        const hasCrossAutoMargin = c._hasAutoMargin && (isMarginAuto(cStyle.margin, crossLeadEdgePhys) || isMarginAuto(cStyle.margin, crossTrailEdgePhys));
        if (childAlign === Align.Stretch && !crossStyleDef && !hasCrossAutoMargin) {
          const cMarginCross = childMarginForAxis(c, crossAx, ownerW);
          const target = Math.max(0, lineCross - cMarginCross);
          if (c._crossSize !== target) {
            const cw = isMainRow ? c._mainSize : target;
            const ch = isMainRow ? target : c._mainSize;
            layoutNode(c, cw, ch, MeasureMode.Exactly, MeasureMode.Exactly, ownerW, ownerH, performLayout, isMainRow, !isMainRow);
            c._crossSize = target;
          }
        }
      }
    }
    let mainOffset = pad[mainLeadEdgePhys] + bor[mainLeadEdgePhys];
    let betweenMain = gapMain;
    let numAutoMarginsMain = 0;
    for (const c of line) {
      if (!c._hasAutoMargin)
        continue;
      if (isMarginAuto(c.style.margin, mainLeadEdgePhys))
        numAutoMarginsMain++;
      if (isMarginAuto(c.style.margin, mainTrailEdgePhys))
        numAutoMarginsMain++;
    }
    const freeMain = actualInnerMain - consumedMain;
    const remainingMain = Math.max(0, freeMain);
    const autoMarginMainSize = numAutoMarginsMain > 0 && remainingMain > 0 ? remainingMain / numAutoMarginsMain : 0;
    if (numAutoMarginsMain === 0) {
      switch (style.justifyContent) {
        case Justify.FlexStart:
          break;
        case Justify.Center:
          mainOffset += freeMain / 2;
          break;
        case Justify.FlexEnd:
          mainOffset += freeMain;
          break;
        case Justify.SpaceBetween:
          if (n > 1)
            betweenMain += remainingMain / (n - 1);
          break;
        case Justify.SpaceAround:
          if (n > 0) {
            betweenMain += remainingMain / n;
            mainOffset += remainingMain / n / 2;
          }
          break;
        case Justify.SpaceEvenly:
          if (n > 0) {
            betweenMain += remainingMain / (n + 1);
            mainOffset += remainingMain / (n + 1);
          }
          break;
      }
    }
    const effectiveLineCrossPos = wrapReverse ? crossContainerSize - lineCrossPos - lineCross : lineCrossPos;
    let pos = mainOffset;
    for (const c of line) {
      const cMargin = c.style.margin;
      const cLayoutMargin = c.layout.margin;
      let autoMainLead = false;
      let autoMainTrail = false;
      let autoCrossLead = false;
      let autoCrossTrail = false;
      let mMainLead;
      let mMainTrail;
      let mCrossLead;
      let mCrossTrail;
      if (c._hasAutoMargin) {
        autoMainLead = isMarginAuto(cMargin, mainLeadEdgePhys);
        autoMainTrail = isMarginAuto(cMargin, mainTrailEdgePhys);
        autoCrossLead = isMarginAuto(cMargin, crossLeadEdgePhys);
        autoCrossTrail = isMarginAuto(cMargin, crossTrailEdgePhys);
        mMainLead = autoMainLead ? autoMarginMainSize : cLayoutMargin[mainLeadEdgePhys];
        mMainTrail = autoMainTrail ? autoMarginMainSize : cLayoutMargin[mainTrailEdgePhys];
        mCrossLead = autoCrossLead ? 0 : cLayoutMargin[crossLeadEdgePhys];
        mCrossTrail = autoCrossTrail ? 0 : cLayoutMargin[crossTrailEdgePhys];
      } else {
        mMainLead = cLayoutMargin[mainLeadEdgePhys];
        mMainTrail = cLayoutMargin[mainTrailEdgePhys];
        mCrossLead = cLayoutMargin[crossLeadEdgePhys];
        mCrossTrail = cLayoutMargin[crossTrailEdgePhys];
      }
      const mainPos = reversed ? mainContainerSize - (pos + mMainLead) - c._mainSize : pos + mMainLead;
      const childAlign = c.style.alignSelf === Align.Auto ? style.alignItems : c.style.alignSelf;
      let crossPos = effectiveLineCrossPos + mCrossLead;
      const crossFree = lineCross - c._crossSize - mCrossLead - mCrossTrail;
      if (autoCrossLead && autoCrossTrail) {
        crossPos += Math.max(0, crossFree) / 2;
      } else if (autoCrossLead) {
        crossPos += Math.max(0, crossFree);
      } else if (autoCrossTrail) {} else {
        switch (childAlign) {
          case Align.FlexStart:
          case Align.Stretch:
            if (wrapReverse)
              crossPos += crossFree;
            break;
          case Align.Center:
            crossPos += crossFree / 2;
            break;
          case Align.FlexEnd:
            if (!wrapReverse)
              crossPos += crossFree;
            break;
          case Align.Baseline:
            if (isBaseline) {
              crossPos = effectiveLineCrossPos + lineMaxAscent[li] - calculateBaseline(c);
            }
            break;
          default:
            break;
        }
      }
      let relX = 0;
      let relY = 0;
      if (c._hasPosition) {
        const relLeft = resolveValue(resolveEdgeRaw(c.style.position, EDGE_LEFT), ownerW);
        const relRight = resolveValue(resolveEdgeRaw(c.style.position, EDGE_RIGHT), ownerW);
        const relTop = resolveValue(resolveEdgeRaw(c.style.position, EDGE_TOP), ownerW);
        const relBottom = resolveValue(resolveEdgeRaw(c.style.position, EDGE_BOTTOM), ownerW);
        relX = isDefined(relLeft) ? relLeft : isDefined(relRight) ? -relRight : 0;
        relY = isDefined(relTop) ? relTop : isDefined(relBottom) ? -relBottom : 0;
      }
      if (isMainRow) {
        c.layout.left = mainPos + relX;
        c.layout.top = crossPos + relY;
      } else {
        c.layout.left = crossPos + relX;
        c.layout.top = mainPos + relY;
      }
      pos += c._mainSize + mMainLead + mMainTrail + betweenMain;
    }
    lineCrossPos += lineCross + betweenLines;
  }
  for (const c of absChildren) {
    layoutAbsoluteChild(node, c, node.layout.width, node.layout.height, pad, bor);
  }
}
function layoutAbsoluteChild(parent, child, parentWidth, parentHeight, pad, bor) {
  const cs = child.style;
  const posLeft = resolveEdgeRaw(cs.position, EDGE_LEFT);
  const posRight = resolveEdgeRaw(cs.position, EDGE_RIGHT);
  const posTop = resolveEdgeRaw(cs.position, EDGE_TOP);
  const posBottom = resolveEdgeRaw(cs.position, EDGE_BOTTOM);
  const rLeft = resolveValue(posLeft, parentWidth);
  const rRight = resolveValue(posRight, parentWidth);
  const rTop = resolveValue(posTop, parentHeight);
  const rBottom = resolveValue(posBottom, parentHeight);
  const paddingBoxW = parentWidth - bor[0] - bor[2];
  const paddingBoxH = parentHeight - bor[1] - bor[3];
  let cw = resolveValue(cs.width, paddingBoxW);
  let ch = resolveValue(cs.height, paddingBoxH);
  if (!isDefined(cw) && isDefined(rLeft) && isDefined(rRight)) {
    cw = paddingBoxW - rLeft - rRight;
  }
  if (!isDefined(ch) && isDefined(rTop) && isDefined(rBottom)) {
    ch = paddingBoxH - rTop - rBottom;
  }
  layoutNode(child, cw, ch, isDefined(cw) ? MeasureMode.Exactly : MeasureMode.Undefined, isDefined(ch) ? MeasureMode.Exactly : MeasureMode.Undefined, paddingBoxW, paddingBoxH, true);
  const mL = resolveEdge(cs.margin, EDGE_LEFT, parentWidth);
  const mT = resolveEdge(cs.margin, EDGE_TOP, parentWidth);
  const mR = resolveEdge(cs.margin, EDGE_RIGHT, parentWidth);
  const mB = resolveEdge(cs.margin, EDGE_BOTTOM, parentWidth);
  const mainAxis = parent.style.flexDirection;
  const reversed = isReverse(mainAxis);
  const mainRow = isRow(mainAxis);
  const wrapReverse = parent.style.flexWrap === Wrap.WrapReverse;
  const alignment = cs.alignSelf === Align.Auto ? parent.style.alignItems : cs.alignSelf;
  let left;
  if (isDefined(rLeft)) {
    left = bor[0] + rLeft + mL;
  } else if (isDefined(rRight)) {
    left = parentWidth - bor[2] - rRight - child.layout.width - mR;
  } else if (mainRow) {
    const lead = pad[0] + bor[0];
    const trail = parentWidth - pad[2] - bor[2];
    left = reversed ? trail - child.layout.width - mR : justifyAbsolute(parent.style.justifyContent, lead, trail, child.layout.width) + mL;
  } else {
    left = alignAbsolute(alignment, pad[0] + bor[0], parentWidth - pad[2] - bor[2], child.layout.width, wrapReverse) + mL;
  }
  let top;
  if (isDefined(rTop)) {
    top = bor[1] + rTop + mT;
  } else if (isDefined(rBottom)) {
    top = parentHeight - bor[3] - rBottom - child.layout.height - mB;
  } else if (mainRow) {
    top = alignAbsolute(alignment, pad[1] + bor[1], parentHeight - pad[3] - bor[3], child.layout.height, wrapReverse) + mT;
  } else {
    const lead = pad[1] + bor[1];
    const trail = parentHeight - pad[3] - bor[3];
    top = reversed ? trail - child.layout.height - mB : justifyAbsolute(parent.style.justifyContent, lead, trail, child.layout.height) + mT;
  }
  child.layout.left = left;
  child.layout.top = top;
}
function justifyAbsolute(justify, leadEdge, trailEdge, childSize) {
  switch (justify) {
    case Justify.Center:
      return leadEdge + (trailEdge - leadEdge - childSize) / 2;
    case Justify.FlexEnd:
      return trailEdge - childSize;
    default:
      return leadEdge;
  }
}
function alignAbsolute(align, leadEdge, trailEdge, childSize, wrapReverse) {
  switch (align) {
    case Align.Center:
      return leadEdge + (trailEdge - leadEdge - childSize) / 2;
    case Align.FlexEnd:
      return wrapReverse ? leadEdge : trailEdge - childSize;
    default:
      return wrapReverse ? trailEdge - childSize : leadEdge;
  }
}
function computeFlexBasis(child, mainAxis, availableMain, availableCross, crossMode, ownerWidth, ownerHeight) {
  const sameGen = child._fbGen === _generation;
  if ((sameGen || !child.isDirty_) && child._fbCrossMode === crossMode && sameFloat(child._fbOwnerW, ownerWidth) && sameFloat(child._fbOwnerH, ownerHeight) && sameFloat(child._fbAvailMain, availableMain) && sameFloat(child._fbAvailCross, availableCross)) {
    return child._fbBasis;
  }
  const cs = child.style;
  const isMainRow = isRow(mainAxis);
  const basis = resolveValue(cs.flexBasis, availableMain);
  if (isDefined(basis)) {
    const b2 = Math.max(0, basis);
    child._fbBasis = b2;
    child._fbOwnerW = ownerWidth;
    child._fbOwnerH = ownerHeight;
    child._fbAvailMain = availableMain;
    child._fbAvailCross = availableCross;
    child._fbCrossMode = crossMode;
    child._fbGen = _generation;
    return b2;
  }
  const mainStyleDim = isMainRow ? cs.width : cs.height;
  const mainOwner = isMainRow ? ownerWidth : ownerHeight;
  const resolved = resolveValue(mainStyleDim, mainOwner);
  if (isDefined(resolved)) {
    const b2 = Math.max(0, resolved);
    child._fbBasis = b2;
    child._fbOwnerW = ownerWidth;
    child._fbOwnerH = ownerHeight;
    child._fbAvailMain = availableMain;
    child._fbAvailCross = availableCross;
    child._fbCrossMode = crossMode;
    child._fbGen = _generation;
    return b2;
  }
  const crossStyleDim = isMainRow ? cs.height : cs.width;
  const crossOwner = isMainRow ? ownerHeight : ownerWidth;
  let crossConstraint = resolveValue(crossStyleDim, crossOwner);
  let crossConstraintMode = isDefined(crossConstraint) ? MeasureMode.Exactly : MeasureMode.Undefined;
  if (!isDefined(crossConstraint) && isDefined(availableCross)) {
    crossConstraint = availableCross;
    crossConstraintMode = crossMode === MeasureMode.Exactly && isStretchAlign(child) ? MeasureMode.Exactly : MeasureMode.AtMost;
  }
  let mainConstraint = NaN;
  let mainConstraintMode = MeasureMode.Undefined;
  if (isMainRow && isDefined(availableMain) && hasMeasureFuncInSubtree(child)) {
    mainConstraint = availableMain;
    mainConstraintMode = MeasureMode.AtMost;
  }
  const mw = isMainRow ? mainConstraint : crossConstraint;
  const mh = isMainRow ? crossConstraint : mainConstraint;
  const mwMode = isMainRow ? mainConstraintMode : crossConstraintMode;
  const mhMode = isMainRow ? crossConstraintMode : mainConstraintMode;
  layoutNode(child, mw, mh, mwMode, mhMode, ownerWidth, ownerHeight, false);
  const b = isMainRow ? child.layout.width : child.layout.height;
  child._fbBasis = b;
  child._fbOwnerW = ownerWidth;
  child._fbOwnerH = ownerHeight;
  child._fbAvailMain = availableMain;
  child._fbAvailCross = availableCross;
  child._fbCrossMode = crossMode;
  child._fbGen = _generation;
  return b;
}
function hasMeasureFuncInSubtree(node) {
  if (node.measureFunc)
    return true;
  for (const c of node.children) {
    if (hasMeasureFuncInSubtree(c))
      return true;
  }
  return false;
}
function resolveFlexibleLengths(children, availableInnerMain, totalFlexBasis, isMainRow, ownerW, ownerH) {
  const n = children.length;
  const frozen = new Array(n).fill(false);
  const initialFree = isDefined(availableInnerMain) ? availableInnerMain - totalFlexBasis : 0;
  for (let i = 0;i < n; i++) {
    const c = children[i];
    const clamped = boundAxis(c.style, isMainRow, c._flexBasis, ownerW, ownerH);
    const inflexible = !isDefined(availableInnerMain) || (initialFree >= 0 ? c.style.flexGrow === 0 : c.style.flexShrink === 0);
    if (inflexible) {
      c._mainSize = Math.max(0, clamped);
      frozen[i] = true;
    } else {
      c._mainSize = c._flexBasis;
    }
  }
  const unclamped = new Array(n);
  for (let iter = 0;iter <= n; iter++) {
    let frozenDelta = 0;
    let totalGrow = 0;
    let totalShrinkScaled = 0;
    let unfrozenCount = 0;
    for (let i = 0;i < n; i++) {
      const c = children[i];
      if (frozen[i]) {
        frozenDelta += c._mainSize - c._flexBasis;
      } else {
        totalGrow += c.style.flexGrow;
        totalShrinkScaled += c.style.flexShrink * c._flexBasis;
        unfrozenCount++;
      }
    }
    if (unfrozenCount === 0)
      break;
    let remaining = initialFree - frozenDelta;
    if (remaining > 0 && totalGrow > 0 && totalGrow < 1) {
      const scaled = initialFree * totalGrow;
      if (scaled < remaining)
        remaining = scaled;
    } else if (remaining < 0 && totalShrinkScaled > 0) {
      let totalShrink = 0;
      for (let i = 0;i < n; i++) {
        if (!frozen[i])
          totalShrink += children[i].style.flexShrink;
      }
      if (totalShrink < 1) {
        const scaled = initialFree * totalShrink;
        if (scaled > remaining)
          remaining = scaled;
      }
    }
    let totalViolation = 0;
    for (let i = 0;i < n; i++) {
      if (frozen[i])
        continue;
      const c = children[i];
      let t = c._flexBasis;
      if (remaining > 0 && totalGrow > 0) {
        t += remaining * c.style.flexGrow / totalGrow;
      } else if (remaining < 0 && totalShrinkScaled > 0) {
        t += remaining * (c.style.flexShrink * c._flexBasis) / totalShrinkScaled;
      }
      unclamped[i] = t;
      const clamped = Math.max(0, boundAxis(c.style, isMainRow, t, ownerW, ownerH));
      c._mainSize = clamped;
      totalViolation += clamped - t;
    }
    if (totalViolation === 0)
      break;
    let anyFrozen = false;
    for (let i = 0;i < n; i++) {
      if (frozen[i])
        continue;
      const v = children[i]._mainSize - unclamped[i];
      if (totalViolation > 0 && v > 0 || totalViolation < 0 && v < 0) {
        frozen[i] = true;
        anyFrozen = true;
      }
    }
    if (!anyFrozen)
      break;
  }
}
function isStretchAlign(child) {
  const p = child.parent;
  if (!p)
    return false;
  const align = child.style.alignSelf === Align.Auto ? p.style.alignItems : child.style.alignSelf;
  return align === Align.Stretch;
}
function resolveChildAlign(parent, child) {
  return child.style.alignSelf === Align.Auto ? parent.style.alignItems : child.style.alignSelf;
}
function calculateBaseline(node) {
  let baselineChild = null;
  for (const c of node.children) {
    if (c._lineIndex > 0)
      break;
    if (c.style.positionType === PositionType.Absolute)
      continue;
    if (c.style.display === Display.None)
      continue;
    if (resolveChildAlign(node, c) === Align.Baseline || c.isReferenceBaseline_) {
      baselineChild = c;
      break;
    }
    if (baselineChild === null)
      baselineChild = c;
  }
  if (baselineChild === null)
    return node.layout.height;
  return calculateBaseline(baselineChild) + baselineChild.layout.top;
}
function isBaselineLayout(node, flowChildren) {
  if (!isRow(node.style.flexDirection))
    return false;
  if (node.style.alignItems === Align.Baseline)
    return true;
  for (const c of flowChildren) {
    if (c.style.alignSelf === Align.Baseline)
      return true;
  }
  return false;
}
function childMarginForAxis(child, axis, ownerWidth) {
  if (!child._hasMargin)
    return 0;
  const lead = resolveEdge(child.style.margin, leadingEdge(axis), ownerWidth);
  const trail = resolveEdge(child.style.margin, trailingEdge(axis), ownerWidth);
  return lead + trail;
}
function resolveGap(style, gutter, ownerSize) {
  let v = style.gap[gutter];
  if (v.unit === Unit.Undefined)
    v = style.gap[Gutter.All];
  const r = resolveValue(v, ownerSize);
  return isDefined(r) ? Math.max(0, r) : 0;
}
function boundAxis(style, isWidth, value, ownerWidth, ownerHeight) {
  const minV = isWidth ? style.minWidth : style.minHeight;
  const maxV = isWidth ? style.maxWidth : style.maxHeight;
  const minU = minV.unit;
  const maxU = maxV.unit;
  if (minU === 0 && maxU === 0)
    return value;
  const owner = isWidth ? ownerWidth : ownerHeight;
  let v = value;
  if (maxU === 1) {
    if (v > maxV.value)
      v = maxV.value;
  } else if (maxU === 2) {
    const m = maxV.value * owner / 100;
    if (m === m && v > m)
      v = m;
  }
  if (minU === 1) {
    if (v < minV.value)
      v = minV.value;
  } else if (minU === 2) {
    const m = minV.value * owner / 100;
    if (m === m && v < m)
      v = m;
  }
  return v;
}
function zeroLayoutRecursive(node) {
  for (const c of node.children) {
    c.layout.left = 0;
    c.layout.top = 0;
    c.layout.width = 0;
    c.layout.height = 0;
    c.isDirty_ = true;
    c._hasL = false;
    c._hasM = false;
    zeroLayoutRecursive(c);
  }
}
function collectLayoutChildren(node, flow, abs) {
  for (const c of node.children) {
    const disp = c.style.display;
    if (disp === Display.None) {
      c.layout.left = 0;
      c.layout.top = 0;
      c.layout.width = 0;
      c.layout.height = 0;
      zeroLayoutRecursive(c);
    } else if (disp === Display.Contents) {
      c.layout.left = 0;
      c.layout.top = 0;
      c.layout.width = 0;
      c.layout.height = 0;
      collectLayoutChildren(c, flow, abs);
    } else if (c.style.positionType === PositionType.Absolute) {
      abs.push(c);
    } else {
      flow.push(c);
    }
  }
}
function roundLayout(node, scale, absLeft, absTop) {
  if (scale === 0)
    return;
  const l = node.layout;
  const nodeLeft = l.left;
  const nodeTop = l.top;
  const nodeWidth = l.width;
  const nodeHeight = l.height;
  const absNodeLeft = absLeft + nodeLeft;
  const absNodeTop = absTop + nodeTop;
  const isText = node.measureFunc !== null;
  l.left = roundValue(nodeLeft, scale, false, isText);
  l.top = roundValue(nodeTop, scale, false, isText);
  const absRight = absNodeLeft + nodeWidth;
  const absBottom = absNodeTop + nodeHeight;
  const hasFracW = !isWholeNumber(nodeWidth * scale);
  const hasFracH = !isWholeNumber(nodeHeight * scale);
  l.width = roundValue(absRight, scale, isText && hasFracW, isText && !hasFracW) - roundValue(absNodeLeft, scale, false, isText);
  l.height = roundValue(absBottom, scale, isText && hasFracH, isText && !hasFracH) - roundValue(absNodeTop, scale, false, isText);
  for (const c of node.children) {
    roundLayout(c, scale, absNodeLeft, absNodeTop);
  }
}
function isWholeNumber(v) {
  const frac = v - Math.floor(v);
  return frac < 0.0001 || frac > 0.9999;
}
function roundValue(v, scale, forceCeil, forceFloor) {
  let scaled = v * scale;
  let frac = scaled - Math.floor(scaled);
  if (frac < 0)
    frac += 1;
  if (frac < 0.0001) {
    scaled = Math.floor(scaled);
  } else if (frac > 0.9999) {
    scaled = Math.ceil(scaled);
  } else if (forceCeil) {
    scaled = Math.ceil(scaled);
  } else if (forceFloor) {
    scaled = Math.floor(scaled);
  } else {
    scaled = Math.floor(scaled) + (frac >= 0.4999 ? 1 : 0);
  }
  return scaled / scale;
}
function parseDimension(v) {
  if (v === undefined)
    return UNDEFINED_VALUE;
  if (v === "auto")
    return AUTO_VALUE;
  if (typeof v === "number") {
    return Number.isFinite(v) ? pointValue(v) : UNDEFINED_VALUE;
  }
  if (typeof v === "string" && v.endsWith("%")) {
    return percentValue(parseFloat(v));
  }
  const n = parseFloat(v);
  return isNaN(n) ? UNDEFINED_VALUE : pointValue(n);
}
function physicalEdge(edge) {
  switch (edge) {
    case Edge.Left:
    case Edge.Start:
      return EDGE_LEFT;
    case Edge.Top:
      return EDGE_TOP;
    case Edge.Right:
    case Edge.End:
      return EDGE_RIGHT;
    case Edge.Bottom:
      return EDGE_BOTTOM;
    default:
      return EDGE_LEFT;
  }
}
var UNDEFINED_VALUE, AUTO_VALUE, EDGE_LEFT = 0, EDGE_TOP = 1, EDGE_RIGHT = 2, EDGE_BOTTOM = 3, DEFAULT_CONFIG, CACHE_SLOTS = 4, _generation = 0, _yogaNodesVisited = 0, _yogaMeasureCalls = 0, _yogaCacheHits = 0, _yogaLiveNodes = 0, YOGA_INSTANCE, yoga_layout_default;
var init_yoga_layout = __esm(() => {
  init_enums();
  UNDEFINED_VALUE = { unit: Unit.Undefined, value: NaN };
  AUTO_VALUE = { unit: Unit.Auto, value: NaN };
  DEFAULT_CONFIG = createConfig();
  YOGA_INSTANCE = {
    Config: {
      create: createConfig,
      destroy() {}
    },
    Node: {
      create: (config) => new Node(config),
      createDefault: () => new Node,
      createWithConfig: (config) => new Node(config),
      destroy() {}
    }
  };
  yoga_layout_default = YOGA_INSTANCE;
});

// node_modules/.bun/chalk@5.6.2/node_modules/chalk/source/vendor/ansi-styles/index.js
function assembleStyles() {
  const codes = new Map;
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ANSI_BACKGROUND_OFFSET = 10, wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`, wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`, wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`, styles, modifierNames, foregroundColorNames, backgroundColorNames, colorNames, ansiStyles, ansi_styles_default;
var init_ansi_styles = __esm(() => {
  styles = {
    modifier: {
      reset: [0, 0],
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      overline: [53, 55],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29]
    },
    color: {
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      blackBright: [90, 39],
      gray: [90, 39],
      grey: [90, 39],
      redBright: [91, 39],
      greenBright: [92, 39],
      yellowBright: [93, 39],
      blueBright: [94, 39],
      magentaBright: [95, 39],
      cyanBright: [96, 39],
      whiteBright: [97, 39]
    },
    bgColor: {
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      bgBlackBright: [100, 49],
      bgGray: [100, 49],
      bgGrey: [100, 49],
      bgRedBright: [101, 49],
      bgGreenBright: [102, 49],
      bgYellowBright: [103, 49],
      bgBlueBright: [104, 49],
      bgMagentaBright: [105, 49],
      bgCyanBright: [106, 49],
      bgWhiteBright: [107, 49]
    }
  };
  modifierNames = Object.keys(styles.modifier);
  foregroundColorNames = Object.keys(styles.color);
  backgroundColorNames = Object.keys(styles.bgColor);
  colorNames = [...foregroundColorNames, ...backgroundColorNames];
  ansiStyles = assembleStyles();
  ansi_styles_default = ansiStyles;
});

// node_modules/.bun/chalk@5.6.2/node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "process";
import os from "os";
import tty from "tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => (key in env))) {
      return 3;
    }
    if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => (sign in env)) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if (env.TERM === "xterm-ghostty") {
    return 3;
  }
  if (env.TERM === "wezterm") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor2(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var env, flagForceColor, supportsColor, supports_color_default;
var init_supports_color2 = __esm(() => {
  ({ env } = process2);
  if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
    flagForceColor = 0;
  } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
    flagForceColor = 1;
  }
  supportsColor = {
    stdout: createSupportsColor2({ isTTY: tty.isatty(1) }),
    stderr: createSupportsColor2({ isTTY: tty.isatty(2) })
  };
  supports_color_default = supportsColor;
});

// node_modules/.bun/chalk@5.6.2/node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? `\r
` : `
`) + postfix;
    endIndex = index + 1;
    index = string.indexOf(`
`, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
var init_utilities = () => {};

// node_modules/.bun/chalk@5.6.2/node_modules/chalk/source/index.js
class Chalk {
  constructor(options) {
    return chalkFactory(options);
  }
}
function createChalk(options) {
  return chalkFactory(options);
}
var stdoutColor, stderrColor, GENERATOR, STYLER, IS_EMPTY, levelMapping, styles2, applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === undefined ? colorLevel : options.level;
}, chalkFactory = (options) => {
  const chalk = (...strings) => strings.join(" ");
  applyOptions(chalk, options);
  Object.setPrototypeOf(chalk, createChalk.prototype);
  return chalk;
}, getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
}, usedModels, proto, createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === undefined) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
}, createBuilder = (self2, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self2;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
}, applyStyle = (self2, string) => {
  if (self2.level <= 0 || !string) {
    return self2[IS_EMPTY] ? "" : string;
  }
  let styler = self2[STYLER];
  if (styler === undefined) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf(`
`);
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
}, chalk, chalkStderr, source_default;
var init_source = __esm(() => {
  init_ansi_styles();
  init_supports_color2();
  init_utilities();
  ({ stdout: stdoutColor, stderr: stderrColor } = supports_color_default);
  GENERATOR = Symbol("GENERATOR");
  STYLER = Symbol("STYLER");
  IS_EMPTY = Symbol("IS_EMPTY");
  levelMapping = [
    "ansi",
    "ansi",
    "ansi256",
    "ansi16m"
  ];
  styles2 = Object.create(null);
  Object.setPrototypeOf(createChalk.prototype, Function.prototype);
  for (const [styleName, style] of Object.entries(ansi_styles_default)) {
    styles2[styleName] = {
      get() {
        const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
        Object.defineProperty(this, styleName, { value: builder });
        return builder;
      }
    };
  }
  styles2.visible = {
    get() {
      const builder = createBuilder(this, this[STYLER], true);
      Object.defineProperty(this, "visible", { value: builder });
      return builder;
    }
  };
  usedModels = ["rgb", "hex", "ansi256"];
  for (const model of usedModels) {
    styles2[model] = {
      get() {
        const { level } = this;
        return function(...arguments_) {
          const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
          return createBuilder(this, styler, this[IS_EMPTY]);
        };
      }
    };
    const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
    styles2[bgModel] = {
      get() {
        const { level } = this;
        return function(...arguments_) {
          const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
          return createBuilder(this, styler, this[IS_EMPTY]);
        };
      }
    };
  }
  proto = Object.defineProperties(() => {}, {
    ...styles2,
    level: {
      enumerable: true,
      get() {
        return this[GENERATOR].level;
      },
      set(level) {
        this[GENERATOR].level = level;
      }
    }
  });
  Object.defineProperties(createChalk.prototype, styles2);
  chalk = createChalk();
  chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
  source_default = chalk;
});

// packages/@ant/ink/src/core/colorize.ts
function boostChalkLevelForXtermJs() {
  if (process.env.TERM_PROGRAM === "vscode" && source_default.level === 2) {
    source_default.level = 3;
    return true;
  }
  return false;
}
function clampChalkLevelForTmux() {
  if (process.env.CLAUDE_CODE_TMUX_TRUECOLOR)
    return false;
  if (process.env.TMUX && source_default.level > 2) {
    source_default.level = 2;
    return true;
  }
  return false;
}
function applyTextStyles(text, styles3) {
  let result = text;
  if (styles3.inverse) {
    result = source_default.inverse(result);
  }
  if (styles3.strikethrough) {
    result = source_default.strikethrough(result);
  }
  if (styles3.underline) {
    result = source_default.underline(result);
  }
  if (styles3.italic) {
    result = source_default.italic(result);
  }
  if (styles3.bold) {
    result = source_default.bold(result);
  }
  if (styles3.dim) {
    result = source_default.dim(result);
  }
  if (styles3.color) {
    result = colorize(result, styles3.color, "foreground");
  }
  if (styles3.backgroundColor) {
    result = colorize(result, styles3.backgroundColor, "background");
  }
  return result;
}
function applyColor(text, color) {
  if (!color) {
    return text;
  }
  return colorize(text, color, "foreground");
}
var CHALK_BOOSTED_FOR_XTERMJS, CHALK_CLAMPED_FOR_TMUX, RGB_REGEX, ANSI_REGEX, colorize = (str, color, type) => {
  if (!color) {
    return str;
  }
  if (color.startsWith("ansi:")) {
    const value = color.substring("ansi:".length);
    switch (value) {
      case "black":
        return type === "foreground" ? source_default.black(str) : source_default.bgBlack(str);
      case "red":
        return type === "foreground" ? source_default.red(str) : source_default.bgRed(str);
      case "green":
        return type === "foreground" ? source_default.green(str) : source_default.bgGreen(str);
      case "yellow":
        return type === "foreground" ? source_default.yellow(str) : source_default.bgYellow(str);
      case "blue":
        return type === "foreground" ? source_default.blue(str) : source_default.bgBlue(str);
      case "magenta":
        return type === "foreground" ? source_default.magenta(str) : source_default.bgMagenta(str);
      case "cyan":
        return type === "foreground" ? source_default.cyan(str) : source_default.bgCyan(str);
      case "white":
        return type === "foreground" ? source_default.white(str) : source_default.bgWhite(str);
      case "blackBright":
        return type === "foreground" ? source_default.blackBright(str) : source_default.bgBlackBright(str);
      case "redBright":
        return type === "foreground" ? source_default.redBright(str) : source_default.bgRedBright(str);
      case "greenBright":
        return type === "foreground" ? source_default.greenBright(str) : source_default.bgGreenBright(str);
      case "yellowBright":
        return type === "foreground" ? source_default.yellowBright(str) : source_default.bgYellowBright(str);
      case "blueBright":
        return type === "foreground" ? source_default.blueBright(str) : source_default.bgBlueBright(str);
      case "magentaBright":
        return type === "foreground" ? source_default.magentaBright(str) : source_default.bgMagentaBright(str);
      case "cyanBright":
        return type === "foreground" ? source_default.cyanBright(str) : source_default.bgCyanBright(str);
      case "whiteBright":
        return type === "foreground" ? source_default.whiteBright(str) : source_default.bgWhiteBright(str);
    }
  }
  if (color.startsWith("#")) {
    return type === "foreground" ? source_default.hex(color)(str) : source_default.bgHex(color)(str);
  }
  if (color.startsWith("ansi256")) {
    const matches = ANSI_REGEX.exec(color);
    if (!matches) {
      return str;
    }
    const value = Number(matches[1]);
    return type === "foreground" ? source_default.ansi256(value)(str) : source_default.bgAnsi256(value)(str);
  }
  if (color.startsWith("rgb")) {
    const matches = RGB_REGEX.exec(color);
    if (!matches) {
      return str;
    }
    const firstValue = Number(matches[1]);
    const secondValue = Number(matches[2]);
    const thirdValue = Number(matches[3]);
    return type === "foreground" ? source_default.rgb(firstValue, secondValue, thirdValue)(str) : source_default.bgRgb(firstValue, secondValue, thirdValue)(str);
  }
  return str;
};
var init_colorize = __esm(() => {
  init_source();
  CHALK_BOOSTED_FOR_XTERMJS = boostChalkLevelForXtermJs();
  CHALK_CLAMPED_FOR_TMUX = clampChalkLevelForTmux();
  RGB_REGEX = /^rgb\(\s?(\d+),\s?(\d+),\s?(\d+)\s?\)$/;
  ANSI_REGEX = /^ansi256\(\s?(\d+)\s?\)$/;
});

// node_modules/.bun/react@19.2.5/node_modules/react/cjs/react.production.js
var exports_react_production = {};
__export(exports_react_production, {
  version: () => $version,
  useTransition: () => $useTransition,
  useSyncExternalStore: () => $useSyncExternalStore,
  useState: () => $useState,
  useRef: () => $useRef,
  useReducer: () => $useReducer,
  useOptimistic: () => $useOptimistic,
  useMemo: () => $useMemo,
  useLayoutEffect: () => $useLayoutEffect,
  useInsertionEffect: () => $useInsertionEffect,
  useImperativeHandle: () => $useImperativeHandle,
  useId: () => $useId,
  useEffectEvent: () => $useEffectEvent,
  useEffect: () => $useEffect,
  useDeferredValue: () => $useDeferredValue,
  useDebugValue: () => $useDebugValue,
  useContext: () => $useContext,
  useCallback: () => $useCallback,
  useActionState: () => $useActionState,
  use: () => $use,
  unstable_useCacheRefresh: () => $unstable_useCacheRefresh,
  startTransition: () => $startTransition,
  memo: () => $memo,
  lazy: () => $lazy,
  isValidElement: () => $isValidElement,
  forwardRef: () => $forwardRef,
  createRef: () => $createRef,
  createElement: () => $createElement,
  createContext: () => $createContext,
  cloneElement: () => $cloneElement,
  cacheSignal: () => $cacheSignal,
  cache: () => $cache,
  __COMPILER_RUNTIME: () => $__COMPILER_RUNTIME,
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: () => $__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  Suspense: () => $Suspense,
  StrictMode: () => $StrictMode,
  PureComponent: () => $PureComponent,
  Profiler: () => $Profiler,
  Fragment: () => $Fragment,
  Component: () => $Component,
  Children: () => $Children,
  Activity: () => $Activity
});
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== "object")
    return null;
  maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
  return typeof maybeIterable === "function" ? maybeIterable : null;
}
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
function ComponentDummy() {}
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
function noop2() {}
function ReactElement(type, key, props) {
  var refProp = props.ref;
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref: refProp !== undefined ? refProp : null,
    props
  };
}
function cloneAndReplaceKey(oldElement, newKey) {
  return ReactElement(oldElement.type, newKey, oldElement.props);
}
function isValidElement(object) {
  return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}
function escape(key) {
  var escaperLookup = { "=": "=0", ":": "=2" };
  return "$" + key.replace(/[=:]/g, function(match) {
    return escaperLookup[match];
  });
}
function getElementKey(element, index) {
  return typeof element === "object" && element !== null && element.key != null ? escape("" + element.key) : index.toString(36);
}
function resolveThenable(thenable) {
  switch (thenable.status) {
    case "fulfilled":
      return thenable.value;
    case "rejected":
      throw thenable.reason;
    default:
      switch (typeof thenable.status === "string" ? thenable.then(noop2, noop2) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
        thenable.status === "pending" && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
      }, function(error) {
        thenable.status === "pending" && (thenable.status = "rejected", thenable.reason = error);
      })), thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
      }
  }
  throw thenable;
}
function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;
  if (type === "undefined" || type === "boolean")
    children = null;
  var invokeCallback = false;
  if (children === null)
    invokeCallback = true;
  else
    switch (type) {
      case "bigint":
      case "string":
      case "number":
        invokeCallback = true;
        break;
      case "object":
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
            break;
          case REACT_LAZY_TYPE:
            return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
        }
    }
  if (invokeCallback)
    return callback = callback(children), invokeCallback = nameSoFar === "" ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", invokeCallback != null && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
      return c;
    })) : callback != null && (isValidElement(callback) && (callback = cloneAndReplaceKey(callback, escapedPrefix + (callback.key == null || children && children.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + invokeCallback)), array.push(callback)), 1;
  invokeCallback = 0;
  var nextNamePrefix = nameSoFar === "" ? "." : nameSoFar + ":";
  if (isArrayImpl(children))
    for (var i = 0;i < children.length; i++)
      nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
  else if (i = getIteratorFn(children), typeof i === "function")
    for (children = i.call(children), i = 0;!(nameSoFar = children.next()).done; )
      nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
  else if (type === "object") {
    if (typeof children.then === "function")
      return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
    array = String(children);
    throw Error("Objects are not valid as a React child (found: " + (array === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
  }
  return invokeCallback;
}
function mapChildren(children, func, context) {
  if (children == null)
    return children;
  var result = [], count = 0;
  mapIntoArray(children, result, "", "", function(child) {
    return func.call(context, child, count++);
  });
  return result;
}
function lazyInitializer(payload) {
  if (payload._status === -1) {
    var ctor = payload._result;
    ctor = ctor();
    ctor.then(function(moduleObject) {
      if (payload._status === 0 || payload._status === -1)
        payload._status = 1, payload._result = moduleObject;
    }, function(error) {
      if (payload._status === 0 || payload._status === -1)
        payload._status = 2, payload._result = error;
    });
    payload._status === -1 && (payload._status = 0, payload._result = ctor);
  }
  if (payload._status === 1)
    return payload._result.default;
  throw payload._result;
}
var REACT_ELEMENT_TYPE, REACT_PORTAL_TYPE, REACT_FRAGMENT_TYPE, REACT_STRICT_MODE_TYPE, REACT_PROFILER_TYPE, REACT_CONSUMER_TYPE, REACT_CONTEXT_TYPE, REACT_FORWARD_REF_TYPE, REACT_SUSPENSE_TYPE, REACT_MEMO_TYPE, REACT_LAZY_TYPE, REACT_ACTIVITY_TYPE, MAYBE_ITERATOR_SYMBOL, ReactNoopUpdateQueue, assign, emptyObject, pureComponentPrototype, isArrayImpl, ReactSharedInternals, hasOwnProperty, userProvidedKeyEscapeRegex, reportGlobalError, Children, $Activity, $Children, $Component, $Fragment, $Profiler, $PureComponent, $StrictMode, $Suspense, $__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, $__COMPILER_RUNTIME, $cache = function(fn) {
  return function() {
    return fn.apply(null, arguments);
  };
}, $cacheSignal = function() {
  return null;
}, $cloneElement = function(element, config, children) {
  if (element === null || element === undefined)
    throw Error("The argument must be a React element, but you passed " + element + ".");
  var props = assign({}, element.props), key = element.key;
  if (config != null)
    for (propName in config.key !== undefined && (key = "" + config.key), config)
      !hasOwnProperty.call(config, propName) || propName === "key" || propName === "__self" || propName === "__source" || propName === "ref" && config.ref === undefined || (props[propName] = config[propName]);
  var propName = arguments.length - 2;
  if (propName === 1)
    props.children = children;
  else if (1 < propName) {
    for (var childArray = Array(propName), i = 0;i < propName; i++)
      childArray[i] = arguments[i + 2];
    props.children = childArray;
  }
  return ReactElement(element.type, key, props);
}, $createContext = function(defaultValue) {
  defaultValue = {
    $$typeof: REACT_CONTEXT_TYPE,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    Provider: null,
    Consumer: null
  };
  defaultValue.Provider = defaultValue;
  defaultValue.Consumer = {
    $$typeof: REACT_CONSUMER_TYPE,
    _context: defaultValue
  };
  return defaultValue;
}, $createElement = function(type, config, children) {
  var propName, props = {}, key = null;
  if (config != null)
    for (propName in config.key !== undefined && (key = "" + config.key), config)
      hasOwnProperty.call(config, propName) && propName !== "key" && propName !== "__self" && propName !== "__source" && (props[propName] = config[propName]);
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1)
    props.children = children;
  else if (1 < childrenLength) {
    for (var childArray = Array(childrenLength), i = 0;i < childrenLength; i++)
      childArray[i] = arguments[i + 2];
    props.children = childArray;
  }
  if (type && type.defaultProps)
    for (propName in childrenLength = type.defaultProps, childrenLength)
      props[propName] === undefined && (props[propName] = childrenLength[propName]);
  return ReactElement(type, key, props);
}, $createRef = function() {
  return { current: null };
}, $forwardRef = function(render) {
  return { $$typeof: REACT_FORWARD_REF_TYPE, render };
}, $isValidElement, $lazy = function(ctor) {
  return {
    $$typeof: REACT_LAZY_TYPE,
    _payload: { _status: -1, _result: ctor },
    _init: lazyInitializer
  };
}, $memo = function(type, compare) {
  return {
    $$typeof: REACT_MEMO_TYPE,
    type,
    compare: compare === undefined ? null : compare
  };
}, $startTransition = function(scope) {
  var prevTransition = ReactSharedInternals.T, currentTransition = {};
  ReactSharedInternals.T = currentTransition;
  try {
    var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
    onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue);
    typeof returnValue === "object" && returnValue !== null && typeof returnValue.then === "function" && returnValue.then(noop2, reportGlobalError);
  } catch (error) {
    reportGlobalError(error);
  } finally {
    prevTransition !== null && currentTransition.types !== null && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
  }
}, $unstable_useCacheRefresh = function() {
  return ReactSharedInternals.H.useCacheRefresh();
}, $use = function(usable) {
  return ReactSharedInternals.H.use(usable);
}, $useActionState = function(action, initialState, permalink) {
  return ReactSharedInternals.H.useActionState(action, initialState, permalink);
}, $useCallback = function(callback, deps) {
  return ReactSharedInternals.H.useCallback(callback, deps);
}, $useContext = function(Context) {
  return ReactSharedInternals.H.useContext(Context);
}, $useDebugValue = function() {}, $useDeferredValue = function(value, initialValue) {
  return ReactSharedInternals.H.useDeferredValue(value, initialValue);
}, $useEffect = function(create, deps) {
  return ReactSharedInternals.H.useEffect(create, deps);
}, $useEffectEvent = function(callback) {
  return ReactSharedInternals.H.useEffectEvent(callback);
}, $useId = function() {
  return ReactSharedInternals.H.useId();
}, $useImperativeHandle = function(ref, create, deps) {
  return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
}, $useInsertionEffect = function(create, deps) {
  return ReactSharedInternals.H.useInsertionEffect(create, deps);
}, $useLayoutEffect = function(create, deps) {
  return ReactSharedInternals.H.useLayoutEffect(create, deps);
}, $useMemo = function(create, deps) {
  return ReactSharedInternals.H.useMemo(create, deps);
}, $useOptimistic = function(passthrough, reducer) {
  return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
}, $useReducer = function(reducer, initialArg, init) {
  return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
}, $useRef = function(initialValue) {
  return ReactSharedInternals.H.useRef(initialValue);
}, $useState = function(initialState) {
  return ReactSharedInternals.H.useState(initialState);
}, $useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
  return ReactSharedInternals.H.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}, $useTransition = function() {
  return ReactSharedInternals.H.useTransition();
}, $version = "19.2.5";
var init_react_production = __esm(() => {
  REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
  REACT_PORTAL_TYPE = Symbol.for("react.portal");
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
  REACT_PROFILER_TYPE = Symbol.for("react.profiler");
  REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
  REACT_CONTEXT_TYPE = Symbol.for("react.context");
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
  REACT_MEMO_TYPE = Symbol.for("react.memo");
  REACT_LAZY_TYPE = Symbol.for("react.lazy");
  REACT_ACTIVITY_TYPE = Symbol.for("react.activity");
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
  ReactNoopUpdateQueue = {
    isMounted: function() {
      return false;
    },
    enqueueForceUpdate: function() {},
    enqueueReplaceState: function() {},
    enqueueSetState: function() {}
  };
  assign = Object.assign;
  emptyObject = {};
  Component.prototype.isReactComponent = {};
  Component.prototype.setState = function(partialState, callback) {
    if (typeof partialState !== "object" && typeof partialState !== "function" && partialState != null)
      throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, partialState, callback, "setState");
  };
  Component.prototype.forceUpdate = function(callback) {
    this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
  };
  ComponentDummy.prototype = Component.prototype;
  pureComponentPrototype = PureComponent.prototype = new ComponentDummy;
  pureComponentPrototype.constructor = PureComponent;
  assign(pureComponentPrototype, Component.prototype);
  pureComponentPrototype.isPureReactComponent = true;
  isArrayImpl = Array.isArray;
  ReactSharedInternals = { H: null, A: null, T: null, S: null };
  hasOwnProperty = Object.prototype.hasOwnProperty;
  userProvidedKeyEscapeRegex = /\/+/g;
  reportGlobalError = typeof reportError === "function" ? reportError : function(error) {
    if (typeof window === "object" && typeof window.ErrorEvent === "function") {
      var event = new window.ErrorEvent("error", {
        bubbles: true,
        cancelable: true,
        message: typeof error === "object" && error !== null && typeof error.message === "string" ? String(error.message) : String(error),
        error
      });
      if (!window.dispatchEvent(event))
        return;
    } else if (typeof process === "object" && typeof process.emit === "function") {
      process.emit("uncaughtException", error);
      return;
    }
    console.error(error);
  };
  Children = {
    map: mapChildren,
    forEach: function(children, forEachFunc, forEachContext) {
      mapChildren(children, function() {
        forEachFunc.apply(this, arguments);
      }, forEachContext);
    },
    count: function(children) {
      var n = 0;
      mapChildren(children, function() {
        n++;
      });
      return n;
    },
    toArray: function(children) {
      return mapChildren(children, function(child) {
        return child;
      }) || [];
    },
    only: function(children) {
      if (!isValidElement(children))
        throw Error("React.Children.only expected to receive a single React element child.");
      return children;
    }
  };
  $Activity = REACT_ACTIVITY_TYPE;
  $Children = Children;
  $Component = Component;
  $Fragment = REACT_FRAGMENT_TYPE;
  $Profiler = REACT_PROFILER_TYPE;
  $PureComponent = PureComponent;
  $StrictMode = REACT_STRICT_MODE_TYPE;
  $Suspense = REACT_SUSPENSE_TYPE;
  $__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
  $__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(size) {
      return ReactSharedInternals.H.useMemoCache(size);
    }
  };
  $isValidElement = isValidElement;
});

// node_modules/.bun/react@19.2.5/node_modules/react/index.js
var require_react = __commonJS((exports, module) => {
  init_react_production();
  if (true) {
    module.exports = exports_react_production;
  }
});

// packages/@ant/ink/src/core/events/event.ts
class Event {
  _didStopImmediatePropagation = false;
  didStopImmediatePropagation() {
    return this._didStopImmediatePropagation;
  }
  stopImmediatePropagation() {
    this._didStopImmediatePropagation = true;
  }
}
var init_event = () => {};

// packages/@ant/ink/src/core/events/emitter.ts
import { EventEmitter as NodeEventEmitter } from "events";
var EventEmitter;
var init_emitter = __esm(() => {
  init_event();
  EventEmitter = class EventEmitter extends NodeEventEmitter {
    constructor() {
      super();
      this.setMaxListeners(0);
    }
    emit(type, ...args) {
      if (type === "error") {
        return super.emit(type, ...args);
      }
      const listeners = this.rawListeners(type);
      if (listeners.length === 0) {
        return false;
      }
      const ccEvent = args[0] instanceof Event ? args[0] : null;
      for (const listener of listeners) {
        listener.apply(this, args);
        if (ccEvent?.didStopImmediatePropagation()) {
          break;
        }
      }
      return true;
    }
  };
});

// packages/@ant/ink/src/core/termio/ansi.ts
function isEscFinal(byte) {
  return byte >= 48 && byte <= 126;
}
var C0, ESC = "\x1B", BEL = "\x07", SEP = ";", ESC_TYPE;
var init_ansi = __esm(() => {
  C0 = {
    NUL: 0,
    SOH: 1,
    STX: 2,
    ETX: 3,
    EOT: 4,
    ENQ: 5,
    ACK: 6,
    BEL: 7,
    BS: 8,
    HT: 9,
    LF: 10,
    VT: 11,
    FF: 12,
    CR: 13,
    SO: 14,
    SI: 15,
    DLE: 16,
    DC1: 17,
    DC2: 18,
    DC3: 19,
    DC4: 20,
    NAK: 21,
    SYN: 22,
    ETB: 23,
    CAN: 24,
    EM: 25,
    SUB: 26,
    ESC: 27,
    FS: 28,
    GS: 29,
    RS: 30,
    US: 31,
    DEL: 127
  };
  ESC_TYPE = {
    CSI: 91,
    OSC: 93,
    DCS: 80,
    APC: 95,
    PM: 94,
    SOS: 88,
    ST: 92
  };
});

// packages/@ant/ink/src/core/termio/csi.ts
function isCSIParam(byte) {
  return byte >= CSI_RANGE.PARAM_START && byte <= CSI_RANGE.PARAM_END;
}
function isCSIIntermediate(byte) {
  return byte >= CSI_RANGE.INTERMEDIATE_START && byte <= CSI_RANGE.INTERMEDIATE_END;
}
function isCSIFinal(byte) {
  return byte >= CSI_RANGE.FINAL_START && byte <= CSI_RANGE.FINAL_END;
}
function csi(...args) {
  if (args.length === 0)
    return CSI_PREFIX;
  if (args.length === 1)
    return `${CSI_PREFIX}${args[0]}`;
  const params = args.slice(0, -1);
  const final = args[args.length - 1];
  return `${CSI_PREFIX}${params.join(SEP)}${final}`;
}
function cursorUp(n = 1) {
  return n === 0 ? "" : csi(n, "A");
}
function cursorDown(n = 1) {
  return n === 0 ? "" : csi(n, "B");
}
function cursorForward(n = 1) {
  return n === 0 ? "" : csi(n, "C");
}
function cursorBack(n = 1) {
  return n === 0 ? "" : csi(n, "D");
}
function cursorTo(col) {
  return csi(col, "G");
}
function cursorPosition(row, col) {
  return csi(row, col, "H");
}
function cursorMove(x, y) {
  let result = "";
  if (x < 0) {
    result += cursorBack(-x);
  } else if (x > 0) {
    result += cursorForward(x);
  }
  if (y < 0) {
    result += cursorUp(-y);
  } else if (y > 0) {
    result += cursorDown(y);
  }
  return result;
}
function eraseLines(n) {
  if (n <= 0)
    return "";
  let result = "";
  for (let i = 0;i < n; i++) {
    result += ERASE_LINE;
    if (i < n - 1) {
      result += cursorUp(1);
    }
  }
  result += CURSOR_LEFT;
  return result;
}
function scrollUp(n = 1) {
  return n === 0 ? "" : csi(n, "S");
}
function scrollDown(n = 1) {
  return n === 0 ? "" : csi(n, "T");
}
function setScrollRegion(top, bottom) {
  return csi(top, bottom, "r");
}
var CSI_PREFIX, CSI_RANGE, CSI, ERASE_DISPLAY, ERASE_LINE_REGION, CURSOR_STYLES, CURSOR_LEFT, CURSOR_HOME, CURSOR_SAVE, CURSOR_RESTORE, ERASE_LINE, ERASE_SCREEN, ERASE_SCROLLBACK, RESET_SCROLL_REGION, PASTE_START, PASTE_END, FOCUS_IN, FOCUS_OUT, ENABLE_KITTY_KEYBOARD, DISABLE_KITTY_KEYBOARD, ENABLE_MODIFY_OTHER_KEYS, DISABLE_MODIFY_OTHER_KEYS;
var init_csi = __esm(() => {
  init_ansi();
  CSI_PREFIX = ESC + String.fromCharCode(ESC_TYPE.CSI);
  CSI_RANGE = {
    PARAM_START: 48,
    PARAM_END: 63,
    INTERMEDIATE_START: 32,
    INTERMEDIATE_END: 47,
    FINAL_START: 64,
    FINAL_END: 126
  };
  CSI = {
    CUU: 65,
    CUD: 66,
    CUF: 67,
    CUB: 68,
    CNL: 69,
    CPL: 70,
    CHA: 71,
    CUP: 72,
    CHT: 73,
    VPA: 100,
    HVP: 102,
    ED: 74,
    EL: 75,
    ECH: 88,
    IL: 76,
    DL: 77,
    ICH: 64,
    DCH: 80,
    SU: 83,
    SD: 84,
    SM: 104,
    RM: 108,
    SGR: 109,
    DSR: 110,
    DECSCUSR: 113,
    DECSTBM: 114,
    SCOSC: 115,
    SCORC: 117,
    CBT: 90
  };
  ERASE_DISPLAY = ["toEnd", "toStart", "all", "scrollback"];
  ERASE_LINE_REGION = ["toEnd", "toStart", "all"];
  CURSOR_STYLES = [
    { style: "block", blinking: true },
    { style: "block", blinking: true },
    { style: "block", blinking: false },
    { style: "underline", blinking: true },
    { style: "underline", blinking: false },
    { style: "bar", blinking: true },
    { style: "bar", blinking: false }
  ];
  CURSOR_LEFT = csi("G");
  CURSOR_HOME = csi("H");
  CURSOR_SAVE = csi("s");
  CURSOR_RESTORE = csi("u");
  ERASE_LINE = csi(2, "K");
  ERASE_SCREEN = csi(2, "J");
  ERASE_SCROLLBACK = csi(3, "J");
  RESET_SCROLL_REGION = csi("r");
  PASTE_START = csi("200~");
  PASTE_END = csi("201~");
  FOCUS_IN = csi("I");
  FOCUS_OUT = csi("O");
  ENABLE_KITTY_KEYBOARD = csi(">1u");
  DISABLE_KITTY_KEYBOARD = csi("<u");
  ENABLE_MODIFY_OTHER_KEYS = csi(">4;2m");
  DISABLE_MODIFY_OTHER_KEYS = csi(">4m");
});

// packages/@ant/ink/src/core/termio/tokenize.ts
function createTokenizer(options) {
  let currentState = "ground";
  let currentBuffer = "";
  const x10Mouse = options?.x10Mouse ?? false;
  return {
    feed(input) {
      const result = tokenize(input, currentState, currentBuffer, false, x10Mouse);
      currentState = result.state.state;
      currentBuffer = result.state.buffer;
      return result.tokens;
    },
    flush() {
      const result = tokenize("", currentState, currentBuffer, true, x10Mouse);
      currentState = result.state.state;
      currentBuffer = result.state.buffer;
      return result.tokens;
    },
    reset() {
      currentState = "ground";
      currentBuffer = "";
    },
    buffer() {
      return currentBuffer;
    }
  };
}
function tokenize(input, initialState, initialBuffer, flush, x10Mouse) {
  const tokens = [];
  const result = {
    state: initialState,
    buffer: ""
  };
  const data = initialBuffer + input;
  let i = 0;
  let textStart = 0;
  let seqStart = 0;
  const flushText = () => {
    if (i > textStart) {
      const text = data.slice(textStart, i);
      if (text) {
        tokens.push({ type: "text", value: text });
      }
    }
    textStart = i;
  };
  const emitSequence = (seq) => {
    if (seq) {
      tokens.push({ type: "sequence", value: seq });
    }
    result.state = "ground";
    textStart = i;
  };
  while (i < data.length) {
    const code = data.charCodeAt(i);
    switch (result.state) {
      case "ground":
        if (code === C0.ESC) {
          flushText();
          seqStart = i;
          result.state = "escape";
          i++;
        } else {
          i++;
        }
        break;
      case "escape":
        if (code === ESC_TYPE.CSI) {
          result.state = "csi";
          i++;
        } else if (code === ESC_TYPE.OSC) {
          result.state = "osc";
          i++;
        } else if (code === ESC_TYPE.DCS) {
          result.state = "dcs";
          i++;
        } else if (code === ESC_TYPE.APC) {
          result.state = "apc";
          i++;
        } else if (code === 79) {
          result.state = "ss3";
          i++;
        } else if (isCSIIntermediate(code)) {
          result.state = "escapeIntermediate";
          i++;
        } else if (isEscFinal(code)) {
          i++;
          emitSequence(data.slice(seqStart, i));
        } else if (code === C0.ESC) {
          emitSequence(data.slice(seqStart, i));
          seqStart = i;
          result.state = "escape";
          i++;
        } else {
          result.state = "ground";
          textStart = seqStart;
        }
        break;
      case "escapeIntermediate":
        if (isCSIIntermediate(code)) {
          i++;
        } else if (isEscFinal(code)) {
          i++;
          emitSequence(data.slice(seqStart, i));
        } else {
          result.state = "ground";
          textStart = seqStart;
        }
        break;
      case "csi":
        if (x10Mouse && code === 77 && i - seqStart === 2 && (i + 1 >= data.length || data.charCodeAt(i + 1) >= 32) && (i + 2 >= data.length || data.charCodeAt(i + 2) >= 32) && (i + 3 >= data.length || data.charCodeAt(i + 3) >= 32)) {
          if (i + 4 <= data.length) {
            i += 4;
            emitSequence(data.slice(seqStart, i));
          } else {
            i = data.length;
          }
          break;
        }
        if (isCSIFinal(code)) {
          i++;
          emitSequence(data.slice(seqStart, i));
        } else if (isCSIParam(code) || isCSIIntermediate(code)) {
          i++;
        } else {
          result.state = "ground";
          textStart = seqStart;
        }
        break;
      case "ss3":
        if (code >= 64 && code <= 126) {
          i++;
          emitSequence(data.slice(seqStart, i));
        } else {
          result.state = "ground";
          textStart = seqStart;
        }
        break;
      case "osc":
        if (code === C0.BEL) {
          i++;
          emitSequence(data.slice(seqStart, i));
        } else if (code === C0.ESC && i + 1 < data.length && data.charCodeAt(i + 1) === ESC_TYPE.ST) {
          i += 2;
          emitSequence(data.slice(seqStart, i));
        } else {
          i++;
        }
        break;
      case "dcs":
      case "apc":
        if (code === C0.BEL) {
          i++;
          emitSequence(data.slice(seqStart, i));
        } else if (code === C0.ESC && i + 1 < data.length && data.charCodeAt(i + 1) === ESC_TYPE.ST) {
          i += 2;
          emitSequence(data.slice(seqStart, i));
        } else {
          i++;
        }
        break;
    }
  }
  if (result.state === "ground") {
    flushText();
  } else if (flush) {
    const remaining = data.slice(seqStart);
    if (remaining)
      tokens.push({ type: "sequence", value: remaining });
    result.state = "ground";
  } else {
    result.buffer = data.slice(seqStart);
  }
  return { tokens, state: result };
}
var init_tokenize = __esm(() => {
  init_ansi();
  init_csi();
});

// packages/@ant/ink/src/core/parse-keypress.ts
import { Buffer as Buffer2 } from "buffer";
function createPasteKey(content) {
  return {
    kind: "key",
    name: "",
    fn: false,
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
    super: false,
    sequence: content,
    raw: content,
    isPasted: true
  };
}
function parseTerminalResponse(s) {
  if (s.startsWith("\x1B[")) {
    let m;
    if (m = DECRPM_RE.exec(s)) {
      return {
        type: "decrpm",
        mode: parseInt(m[1], 10),
        status: parseInt(m[2], 10)
      };
    }
    if (m = DA1_RE.exec(s)) {
      return { type: "da1", params: splitNumericParams(m[1]) };
    }
    if (m = DA2_RE.exec(s)) {
      return { type: "da2", params: splitNumericParams(m[1]) };
    }
    if (m = KITTY_FLAGS_RE.exec(s)) {
      return { type: "kittyKeyboard", flags: parseInt(m[1], 10) };
    }
    if (m = CURSOR_POSITION_RE.exec(s)) {
      return {
        type: "cursorPosition",
        row: parseInt(m[1], 10),
        col: parseInt(m[2], 10)
      };
    }
    return null;
  }
  if (s.startsWith("\x1B]")) {
    const m = OSC_RESPONSE_RE.exec(s);
    if (m) {
      return { type: "osc", code: parseInt(m[1], 10), data: m[2] };
    }
  }
  if (s.startsWith("\x1BP")) {
    const m = XTVERSION_RE.exec(s);
    if (m) {
      return { type: "xtversion", name: m[1] };
    }
  }
  return null;
}
function splitNumericParams(params) {
  if (!params)
    return [];
  return params.split(";").map((p) => parseInt(p, 10));
}
function inputToString(input) {
  if (Buffer2.isBuffer(input)) {
    if (input[0] > 127 && input[1] === undefined) {
      input[0] -= 128;
      return "\x1B" + String(input);
    } else {
      return String(input);
    }
  } else if (input !== undefined && typeof input !== "string") {
    return String(input);
  } else if (!input) {
    return "";
  } else {
    return input;
  }
}
function parseMultipleKeypresses(prevState, input = "") {
  const isFlush = input === null;
  const inputString = isFlush ? "" : inputToString(input);
  const tokenizer = prevState._tokenizer ?? createTokenizer({ x10Mouse: true });
  const tokens = isFlush ? tokenizer.flush() : tokenizer.feed(inputString);
  const keys = [];
  let inPaste = prevState.mode === "IN_PASTE";
  let pasteBuffer = prevState.pasteBuffer;
  for (const token of tokens) {
    if (token.type === "sequence") {
      if (token.value === PASTE_START) {
        inPaste = true;
        pasteBuffer = "";
      } else if (token.value === PASTE_END) {
        keys.push(createPasteKey(pasteBuffer));
        inPaste = false;
        pasteBuffer = "";
      } else if (inPaste) {
        pasteBuffer += token.value;
      } else {
        const response = parseTerminalResponse(token.value);
        if (response) {
          keys.push({ kind: "response", sequence: token.value, response });
        } else {
          const mouse = parseMouseEvent(token.value);
          if (mouse) {
            keys.push(mouse);
          } else {
            keys.push(parseKeypress(token.value));
          }
        }
      }
    } else if (token.type === "text") {
      if (inPaste) {
        pasteBuffer += token.value;
      } else if (/^\[<\d+;\d+;\d+[Mm]$/.test(token.value) || /^\[M[\x60-\x7f][\x20-\uffff]{2}$/.test(token.value)) {
        const resynthesized = "\x1B" + token.value;
        const mouse = parseMouseEvent(resynthesized);
        keys.push(mouse ?? parseKeypress(resynthesized));
      } else {
        keys.push(parseKeypress(token.value));
      }
    }
  }
  if (isFlush && inPaste && pasteBuffer) {
    keys.push(createPasteKey(pasteBuffer));
    inPaste = false;
    pasteBuffer = "";
  }
  const newState = {
    mode: inPaste ? "IN_PASTE" : "NORMAL",
    incomplete: tokenizer.buffer(),
    pasteBuffer,
    _tokenizer: tokenizer
  };
  return [keys, newState];
}
function decodeModifier(modifier) {
  const m = modifier - 1;
  return {
    shift: !!(m & 1),
    meta: !!(m & 2),
    ctrl: !!(m & 4),
    super: !!(m & 8)
  };
}
function keycodeToName(keycode) {
  switch (keycode) {
    case 9:
      return "tab";
    case 13:
      return "return";
    case 27:
      return "escape";
    case 32:
      return "space";
    case 127:
      return "backspace";
    case 57399:
      return "0";
    case 57400:
      return "1";
    case 57401:
      return "2";
    case 57402:
      return "3";
    case 57403:
      return "4";
    case 57404:
      return "5";
    case 57405:
      return "6";
    case 57406:
      return "7";
    case 57407:
      return "8";
    case 57408:
      return "9";
    case 57409:
      return ".";
    case 57410:
      return "/";
    case 57411:
      return "*";
    case 57412:
      return "-";
    case 57413:
      return "+";
    case 57414:
      return "return";
    case 57415:
      return "=";
    default:
      if (keycode >= 32 && keycode <= 126) {
        return String.fromCharCode(keycode).toLowerCase();
      }
      return;
  }
}
function parseMouseEvent(s) {
  const match = SGR_MOUSE_RE.exec(s);
  if (!match)
    return null;
  const button = parseInt(match[1], 10);
  if ((button & 64) !== 0)
    return null;
  return {
    kind: "mouse",
    button,
    action: match[4] === "M" ? "press" : "release",
    col: parseInt(match[2], 10),
    row: parseInt(match[3], 10),
    sequence: s
  };
}
function parseKeypress(s = "") {
  let parts;
  const key = {
    kind: "key",
    name: "",
    fn: false,
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
    super: false,
    sequence: s,
    raw: s,
    isPasted: false
  };
  key.sequence = key.sequence || s || key.name;
  let match;
  if (match = CSI_U_RE.exec(s)) {
    const codepoint = parseInt(match[1], 10);
    const modifier = match[2] ? parseInt(match[2], 10) : 1;
    const mods = decodeModifier(modifier);
    const name = keycodeToName(codepoint);
    return {
      kind: "key",
      name,
      fn: false,
      ctrl: mods.ctrl,
      meta: mods.meta,
      shift: mods.shift,
      option: false,
      super: mods.super,
      sequence: s,
      raw: s,
      isPasted: false
    };
  }
  if (match = MODIFY_OTHER_KEYS_RE.exec(s)) {
    const mods = decodeModifier(parseInt(match[1], 10));
    const name = keycodeToName(parseInt(match[2], 10));
    return {
      kind: "key",
      name,
      fn: false,
      ctrl: mods.ctrl,
      meta: mods.meta,
      shift: mods.shift,
      option: false,
      super: mods.super,
      sequence: s,
      raw: s,
      isPasted: false
    };
  }
  if (match = SGR_MOUSE_RE.exec(s)) {
    const button = parseInt(match[1], 10);
    if ((button & 67) === 64)
      return createNavKey(s, "wheelup", false);
    if ((button & 67) === 65)
      return createNavKey(s, "wheeldown", false);
    return createNavKey(s, "mouse", false);
  }
  if (s.length === 6 && s.startsWith("\x1B[M")) {
    const button = s.charCodeAt(3) - 32;
    if ((button & 67) === 64)
      return createNavKey(s, "wheelup", false);
    if ((button & 67) === 65)
      return createNavKey(s, "wheeldown", false);
    return createNavKey(s, "mouse", false);
  }
  if (s === "\r") {
    key.raw = undefined;
    key.name = "return";
  } else if (s === `
`) {
    key.name = "enter";
  } else if (s === "\t") {
    key.name = "tab";
  } else if (s === "\b" || s === "\x1B\b") {
    key.name = "backspace";
    key.meta = s.charAt(0) === "\x1B";
  } else if (s === "\x7F" || s === "\x1B\x7F") {
    key.name = "backspace";
    key.meta = s.charAt(0) === "\x1B";
  } else if (s === "\x1B" || s === "\x1B\x1B") {
    key.name = "escape";
    key.meta = s.length === 2;
  } else if (s === " " || s === "\x1B ") {
    key.name = "space";
    key.meta = s.length === 2;
  } else if (s === "\x1F") {
    key.name = "_";
    key.ctrl = true;
  } else if (s <= "\x1A" && s.length === 1) {
    key.name = String.fromCharCode(s.charCodeAt(0) + 97 - 1);
    key.ctrl = true;
  } else if (s.length === 1 && s >= "0" && s <= "9") {
    key.name = "number";
  } else if (s.length === 1 && s >= "a" && s <= "z") {
    key.name = s;
  } else if (s.length === 1 && s >= "A" && s <= "Z") {
    key.name = s.toLowerCase();
    key.shift = true;
  } else if (parts = META_KEY_CODE_RE.exec(s)) {
    key.meta = true;
    key.shift = /^[A-Z]$/.test(parts[1]);
  } else if (parts = FN_KEY_RE.exec(s)) {
    const segs = [...s];
    if (segs[0] === "\x1B" && segs[1] === "\x1B") {
      key.option = true;
    }
    const code = [parts[1], parts[2], parts[4], parts[6]].filter(Boolean).join("");
    const modifier = (parts[3] || parts[5] || 1) - 1;
    key.ctrl = !!(modifier & 4);
    key.meta = !!(modifier & 2);
    key.super = !!(modifier & 8);
    key.shift = !!(modifier & 1);
    key.code = code;
    key.name = keyName[code];
    key.shift = isShiftKey(code) || key.shift;
    key.ctrl = isCtrlKey(code) || key.ctrl;
  }
  if (key.raw === "\x1Bb") {
    key.meta = true;
    key.name = "left";
  } else if (key.raw === "\x1Bf") {
    key.meta = true;
    key.name = "right";
  }
  switch (s) {
    case "\x1B[1~":
      return createNavKey(s, "home", false);
    case "\x1B[4~":
      return createNavKey(s, "end", false);
    case "\x1B[5~":
      return createNavKey(s, "pageup", false);
    case "\x1B[6~":
      return createNavKey(s, "pagedown", false);
    case "\x1B[1;5D":
      return createNavKey(s, "left", true);
    case "\x1B[1;5C":
      return createNavKey(s, "right", true);
  }
  return key;
}
function createNavKey(s, name, ctrl) {
  return {
    kind: "key",
    name,
    ctrl,
    meta: false,
    shift: false,
    option: false,
    super: false,
    fn: false,
    sequence: s,
    raw: s,
    isPasted: false
  };
}
var META_KEY_CODE_RE, FN_KEY_RE, CSI_U_RE, MODIFY_OTHER_KEYS_RE, DECRPM_RE, DA1_RE, DA2_RE, KITTY_FLAGS_RE, CURSOR_POSITION_RE, OSC_RESPONSE_RE, XTVERSION_RE, SGR_MOUSE_RE, INITIAL_STATE, keyName, nonAlphanumericKeys, isShiftKey = (code) => {
  return [
    "[a",
    "[b",
    "[c",
    "[d",
    "[e",
    "[2$",
    "[3$",
    "[5$",
    "[6$",
    "[7$",
    "[8$",
    "[Z"
  ].includes(code);
}, isCtrlKey = (code) => {
  return [
    "Oa",
    "Ob",
    "Oc",
    "Od",
    "Oe",
    "[2^",
    "[3^",
    "[5^",
    "[6^",
    "[7^",
    "[8^"
  ].includes(code);
};
var init_parse_keypress = __esm(() => {
  init_csi();
  init_tokenize();
  META_KEY_CODE_RE = /^(?:\x1b)([a-zA-Z0-9])$/;
  FN_KEY_RE = /^(?:\x1b+)(O|N|\[|\[\[)(?:(\d+)(?:;(\d+))?([~^$])|(?:1;)?(\d+)?([a-zA-Z]))/;
  CSI_U_RE = /^\x1b\[(\d+)(?:;(\d+))?u/;
  MODIFY_OTHER_KEYS_RE = /^\x1b\[27;(\d+);(\d+)~/;
  DECRPM_RE = /^\x1b\[\?(\d+);(\d+)\$y$/;
  DA1_RE = /^\x1b\[\?([\d;]*)c$/;
  DA2_RE = /^\x1b\[>([\d;]*)c$/;
  KITTY_FLAGS_RE = /^\x1b\[\?(\d+)u$/;
  CURSOR_POSITION_RE = /^\x1b\[\?(\d+);(\d+)R$/;
  OSC_RESPONSE_RE = /^\x1b\](\d+);(.*?)(?:\x07|\x1b\\)$/s;
  XTVERSION_RE = /^\x1bP>\|(.*?)(?:\x07|\x1b\\)$/s;
  SGR_MOUSE_RE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;
  INITIAL_STATE = {
    mode: "NORMAL",
    incomplete: "",
    pasteBuffer: ""
  };
  keyName = {
    OP: "f1",
    OQ: "f2",
    OR: "f3",
    OS: "f4",
    Op: "0",
    Oq: "1",
    Or: "2",
    Os: "3",
    Ot: "4",
    Ou: "5",
    Ov: "6",
    Ow: "7",
    Ox: "8",
    Oy: "9",
    Oj: "*",
    Ok: "+",
    Ol: ",",
    Om: "-",
    On: ".",
    Oo: "/",
    OM: "return",
    "[11~": "f1",
    "[12~": "f2",
    "[13~": "f3",
    "[14~": "f4",
    "[[A": "f1",
    "[[B": "f2",
    "[[C": "f3",
    "[[D": "f4",
    "[[E": "f5",
    "[15~": "f5",
    "[17~": "f6",
    "[18~": "f7",
    "[19~": "f8",
    "[20~": "f9",
    "[21~": "f10",
    "[23~": "f11",
    "[24~": "f12",
    "[A": "up",
    "[B": "down",
    "[C": "right",
    "[D": "left",
    "[E": "clear",
    "[F": "end",
    "[H": "home",
    OA: "up",
    OB: "down",
    OC: "right",
    OD: "left",
    OE: "clear",
    OF: "end",
    OH: "home",
    "[1~": "home",
    "[2~": "insert",
    "[3~": "delete",
    "[4~": "end",
    "[5~": "pageup",
    "[6~": "pagedown",
    "[[5~": "pageup",
    "[[6~": "pagedown",
    "[7~": "home",
    "[8~": "end",
    "[a": "up",
    "[b": "down",
    "[c": "right",
    "[d": "left",
    "[e": "clear",
    "[2$": "insert",
    "[3$": "delete",
    "[5$": "pageup",
    "[6$": "pagedown",
    "[7$": "home",
    "[8$": "end",
    Oa: "up",
    Ob: "down",
    Oc: "right",
    Od: "left",
    Oe: "clear",
    "[2^": "insert",
    "[3^": "delete",
    "[5^": "pageup",
    "[6^": "pagedown",
    "[7^": "home",
    "[8^": "end",
    "[Z": "tab"
  };
  nonAlphanumericKeys = [
    ...Object.values(keyName).filter((v) => v.length > 1),
    "escape",
    "backspace",
    "wheelup",
    "wheeldown",
    "mouse"
  ];
});

// packages/@ant/ink/src/core/events/input-event.ts
function parseKey(keypress) {
  const key = {
    upArrow: keypress.name === "up",
    downArrow: keypress.name === "down",
    leftArrow: keypress.name === "left",
    rightArrow: keypress.name === "right",
    pageDown: keypress.name === "pagedown",
    pageUp: keypress.name === "pageup",
    wheelUp: keypress.name === "wheelup",
    wheelDown: keypress.name === "wheeldown",
    home: keypress.name === "home",
    end: keypress.name === "end",
    return: keypress.name === "return",
    escape: keypress.name === "escape",
    fn: keypress.fn,
    ctrl: keypress.ctrl,
    shift: keypress.shift,
    tab: keypress.name === "tab",
    backspace: keypress.name === "backspace",
    delete: keypress.name === "delete",
    meta: keypress.meta || keypress.name === "escape" || keypress.option,
    super: keypress.super
  };
  let input = keypress.ctrl ? keypress.name : keypress.sequence;
  if (input === undefined) {
    input = "";
  }
  if (keypress.ctrl && input === "space") {
    input = " ";
  }
  if (keypress.code && !keypress.name) {
    input = "";
  }
  if (!keypress.name && /^\[<\d+;\d+;\d+[Mm]/.test(input)) {
    input = "";
  }
  if (input.startsWith("\x1B")) {
    input = input.slice(1);
  }
  let processedAsSpecialSequence = false;
  if (/^\[\d/.test(input) && input.endsWith("u")) {
    if (!keypress.name) {
      input = "";
    } else {
      input = keypress.name === "space" ? " " : keypress.name === "escape" ? "" : keypress.name;
    }
    processedAsSpecialSequence = true;
  }
  if (input.startsWith("[27;") && input.endsWith("~")) {
    if (!keypress.name) {
      input = "";
    } else {
      input = keypress.name === "space" ? " " : keypress.name === "escape" ? "" : keypress.name;
    }
    processedAsSpecialSequence = true;
  }
  if (input.startsWith("O") && input.length === 2 && keypress.name && keypress.name.length === 1) {
    input = keypress.name;
    processedAsSpecialSequence = true;
  }
  if (!processedAsSpecialSequence && keypress.name && nonAlphanumericKeys.includes(keypress.name)) {
    input = "";
  }
  if (input.length === 1 && typeof input[0] === "string" && input[0] >= "A" && input[0] <= "Z") {
    key.shift = true;
  }
  return [key, input];
}
var InputEvent;
var init_input_event = __esm(() => {
  init_parse_keypress();
  init_event();
  InputEvent = class InputEvent extends Event {
    keypress;
    key;
    input;
    constructor(keypress) {
      super();
      const [key, input] = parseKey(keypress);
      this.keypress = keypress;
      this.key = key;
      this.input = input;
    }
  };
});

// packages/@ant/ink/src/core/events/terminal-focus-event.ts
var TerminalFocusEvent;
var init_terminal_focus_event = __esm(() => {
  init_event();
  TerminalFocusEvent = class TerminalFocusEvent extends Event {
    type;
    constructor(type) {
      super();
      this.type = type;
    }
  };
});

// node_modules/.bun/scheduler@0.27.0/node_modules/scheduler/cjs/scheduler.production.js
var exports_scheduler_production = {};
__export(exports_scheduler_production, {
  unstable_wrapCallback: () => $unstable_wrapCallback,
  unstable_shouldYield: () => $unstable_shouldYield,
  unstable_scheduleCallback: () => $unstable_scheduleCallback,
  unstable_runWithPriority: () => $unstable_runWithPriority,
  unstable_requestPaint: () => $unstable_requestPaint,
  unstable_now: () => $unstable_now,
  unstable_next: () => $unstable_next,
  unstable_getCurrentPriorityLevel: () => $unstable_getCurrentPriorityLevel,
  unstable_forceFrameRate: () => $unstable_forceFrameRate,
  unstable_cancelCallback: () => $unstable_cancelCallback,
  unstable_UserBlockingPriority: () => $unstable_UserBlockingPriority,
  unstable_Profiling: () => $unstable_Profiling,
  unstable_NormalPriority: () => $unstable_NormalPriority,
  unstable_LowPriority: () => $unstable_LowPriority,
  unstable_ImmediatePriority: () => $unstable_ImmediatePriority,
  unstable_IdlePriority: () => $unstable_IdlePriority
});
function push(heap, node) {
  var index = heap.length;
  heap.push(node);
  a:
    for (;0 < index; ) {
      var parentIndex = index - 1 >>> 1, parent = heap[parentIndex];
      if (0 < compare(parent, node))
        heap[parentIndex] = node, heap[index] = parent, index = parentIndex;
      else
        break a;
    }
}
function peek(heap) {
  return heap.length === 0 ? null : heap[0];
}
function pop(heap) {
  if (heap.length === 0)
    return null;
  var first = heap[0], last = heap.pop();
  if (last !== first) {
    heap[0] = last;
    a:
      for (var index = 0, length = heap.length, halfLength = length >>> 1;index < halfLength; ) {
        var leftIndex = 2 * (index + 1) - 1, left = heap[leftIndex], rightIndex = leftIndex + 1, right = heap[rightIndex];
        if (0 > compare(left, last))
          rightIndex < length && 0 > compare(right, left) ? (heap[index] = right, heap[rightIndex] = last, index = rightIndex) : (heap[index] = left, heap[leftIndex] = last, index = leftIndex);
        else if (rightIndex < length && 0 > compare(right, last))
          heap[index] = right, heap[rightIndex] = last, index = rightIndex;
        else
          break a;
      }
  }
  return first;
}
function compare(a, b) {
  var diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
function advanceTimers(currentTime) {
  for (var timer = peek(timerQueue);timer !== null; ) {
    if (timer.callback === null)
      pop(timerQueue);
    else if (timer.startTime <= currentTime)
      pop(timerQueue), timer.sortIndex = timer.expirationTime, push(taskQueue, timer);
    else
      break;
    timer = peek(timerQueue);
  }
}
function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);
  if (!isHostCallbackScheduled)
    if (peek(taskQueue) !== null)
      isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline());
    else {
      var firstTimer = peek(timerQueue);
      firstTimer !== null && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
}
function shouldYieldToHost() {
  return needsPaint ? true : $unstable_now() - startTime < frameInterval ? false : true;
}
function performWorkUntilDeadline() {
  needsPaint = false;
  if (isMessageLoopRunning) {
    var currentTime = $unstable_now();
    startTime = currentTime;
    var hasMoreWork = true;
    try {
      a: {
        isHostCallbackScheduled = false;
        isHostTimeoutScheduled && (isHostTimeoutScheduled = false, localClearTimeout(taskTimeoutID), taskTimeoutID = -1);
        isPerformingWork = true;
        var previousPriorityLevel = currentPriorityLevel;
        try {
          b: {
            advanceTimers(currentTime);
            for (currentTask = peek(taskQueue);currentTask !== null && !(currentTask.expirationTime > currentTime && shouldYieldToHost()); ) {
              var callback = currentTask.callback;
              if (typeof callback === "function") {
                currentTask.callback = null;
                currentPriorityLevel = currentTask.priorityLevel;
                var continuationCallback = callback(currentTask.expirationTime <= currentTime);
                currentTime = $unstable_now();
                if (typeof continuationCallback === "function") {
                  currentTask.callback = continuationCallback;
                  advanceTimers(currentTime);
                  hasMoreWork = true;
                  break b;
                }
                currentTask === peek(taskQueue) && pop(taskQueue);
                advanceTimers(currentTime);
              } else
                pop(taskQueue);
              currentTask = peek(taskQueue);
            }
            if (currentTask !== null)
              hasMoreWork = true;
            else {
              var firstTimer = peek(timerQueue);
              firstTimer !== null && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
              hasMoreWork = false;
            }
          }
          break a;
        } finally {
          currentTask = null, currentPriorityLevel = previousPriorityLevel, isPerformingWork = false;
        }
        hasMoreWork = undefined;
      }
    } finally {
      hasMoreWork ? schedulePerformWorkUntilDeadline() : isMessageLoopRunning = false;
    }
  }
}
function requestHostTimeout(callback, ms) {
  taskTimeoutID = localSetTimeout(function() {
    callback($unstable_now());
  }, ms);
}
var $unstable_now = undefined, localPerformance, localDate, initialTime, taskQueue, timerQueue, taskIdCounter = 1, currentTask = null, currentPriorityLevel = 3, isPerformingWork = false, isHostCallbackScheduled = false, isHostTimeoutScheduled = false, needsPaint = false, localSetTimeout, localClearTimeout, localSetImmediate, isMessageLoopRunning = false, taskTimeoutID = -1, frameInterval = 5, startTime = -1, schedulePerformWorkUntilDeadline, channel, port, $unstable_IdlePriority = 5, $unstable_ImmediatePriority = 1, $unstable_LowPriority = 4, $unstable_NormalPriority = 3, $unstable_Profiling = null, $unstable_UserBlockingPriority = 2, $unstable_cancelCallback = function(task) {
  task.callback = null;
}, $unstable_forceFrameRate = function(fps) {
  0 > fps || 125 < fps ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : frameInterval = 0 < fps ? Math.floor(1000 / fps) : 5;
}, $unstable_getCurrentPriorityLevel = function() {
  return currentPriorityLevel;
}, $unstable_next = function(eventHandler) {
  switch (currentPriorityLevel) {
    case 1:
    case 2:
    case 3:
      var priorityLevel = 3;
      break;
    default:
      priorityLevel = currentPriorityLevel;
  }
  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;
  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}, $unstable_requestPaint = function() {
  needsPaint = true;
}, $unstable_runWithPriority = function(priorityLevel, eventHandler) {
  switch (priorityLevel) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      break;
    default:
      priorityLevel = 3;
  }
  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;
  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}, $unstable_scheduleCallback = function(priorityLevel, callback, options) {
  var currentTime = $unstable_now();
  typeof options === "object" && options !== null ? (options = options.delay, options = typeof options === "number" && 0 < options ? currentTime + options : currentTime) : options = currentTime;
  switch (priorityLevel) {
    case 1:
      var timeout = -1;
      break;
    case 2:
      timeout = 250;
      break;
    case 5:
      timeout = 1073741823;
      break;
    case 4:
      timeout = 1e4;
      break;
    default:
      timeout = 5000;
  }
  timeout = options + timeout;
  priorityLevel = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime: options,
    expirationTime: timeout,
    sortIndex: -1
  };
  options > currentTime ? (priorityLevel.sortIndex = options, push(timerQueue, priorityLevel), peek(taskQueue) === null && priorityLevel === peek(timerQueue) && (isHostTimeoutScheduled ? (localClearTimeout(taskTimeoutID), taskTimeoutID = -1) : isHostTimeoutScheduled = true, requestHostTimeout(handleTimeout, options - currentTime))) : (priorityLevel.sortIndex = timeout, push(taskQueue, priorityLevel), isHostCallbackScheduled || isPerformingWork || (isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline())));
  return priorityLevel;
}, $unstable_shouldYield, $unstable_wrapCallback = function(callback) {
  var parentPriorityLevel = currentPriorityLevel;
  return function() {
    var previousPriorityLevel = currentPriorityLevel;
    currentPriorityLevel = parentPriorityLevel;
    try {
      return callback.apply(this, arguments);
    } finally {
      currentPriorityLevel = previousPriorityLevel;
    }
  };
};
var init_scheduler_production = __esm(() => {
  if (typeof performance === "object" && typeof performance.now === "function") {
    localPerformance = performance;
    $unstable_now = function() {
      return localPerformance.now();
    };
  } else {
    localDate = Date, initialTime = localDate.now();
    $unstable_now = function() {
      return localDate.now() - initialTime;
    };
  }
  taskQueue = [];
  timerQueue = [];
  localSetTimeout = typeof setTimeout === "function" ? setTimeout : null;
  localClearTimeout = typeof clearTimeout === "function" ? clearTimeout : null;
  localSetImmediate = typeof setImmediate !== "undefined" ? setImmediate : null;
  if (typeof localSetImmediate === "function")
    schedulePerformWorkUntilDeadline = function() {
      localSetImmediate(performWorkUntilDeadline);
    };
  else if (typeof MessageChannel !== "undefined") {
    channel = new MessageChannel, port = channel.port2;
    channel.port1.onmessage = performWorkUntilDeadline;
    schedulePerformWorkUntilDeadline = function() {
      port.postMessage(null);
    };
  } else
    schedulePerformWorkUntilDeadline = function() {
      localSetTimeout(performWorkUntilDeadline, 0);
    };
  $unstable_shouldYield = shouldYieldToHost;
});

// node_modules/.bun/scheduler@0.27.0/node_modules/scheduler/index.js
var require_scheduler = __commonJS((exports, module) => {
  init_scheduler_production();
  if (true) {
    module.exports = exports_scheduler_production;
  }
});

// node_modules/.bun/react-reconciler@0.33.0+3f10a4be4e334a9b/node_modules/react-reconciler/cjs/react-reconciler.production.js
var require_react_reconciler_production = __commonJS((exports, module) => {
  var React = __toESM(require_react());
  var Scheduler = __toESM(require_scheduler());
  module.exports = function($$$config) {
    function createFiber(tag, pendingProps, key, mode) {
      return new FiberNode(tag, pendingProps, key, mode);
    }
    function noop3() {}
    function formatProdErrorMessage(code) {
      var url = "https://react.dev/errors/" + code;
      if (1 < arguments.length) {
        url += "?args[]=" + encodeURIComponent(arguments[1]);
        for (var i = 2;i < arguments.length; i++)
          url += "&args[]=" + encodeURIComponent(arguments[i]);
      }
      return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
    }
    function getNearestMountedFiber(fiber) {
      var node = fiber, nearestMounted = fiber;
      if (fiber.alternate)
        for (;node.return; )
          node = node.return;
      else {
        fiber = node;
        do
          node = fiber, (node.flags & 4098) !== 0 && (nearestMounted = node.return), fiber = node.return;
        while (fiber);
      }
      return node.tag === 3 ? nearestMounted : null;
    }
    function assertIsMounted(fiber) {
      if (getNearestMountedFiber(fiber) !== fiber)
        throw Error(formatProdErrorMessage(188));
    }
    function findCurrentFiberUsingSlowPath(fiber) {
      var alternate = fiber.alternate;
      if (!alternate) {
        alternate = getNearestMountedFiber(fiber);
        if (alternate === null)
          throw Error(formatProdErrorMessage(188));
        return alternate !== fiber ? null : fiber;
      }
      for (var a = fiber, b = alternate;; ) {
        var parentA = a.return;
        if (parentA === null)
          break;
        var parentB = parentA.alternate;
        if (parentB === null) {
          b = parentA.return;
          if (b !== null) {
            a = b;
            continue;
          }
          break;
        }
        if (parentA.child === parentB.child) {
          for (parentB = parentA.child;parentB; ) {
            if (parentB === a)
              return assertIsMounted(parentA), fiber;
            if (parentB === b)
              return assertIsMounted(parentA), alternate;
            parentB = parentB.sibling;
          }
          throw Error(formatProdErrorMessage(188));
        }
        if (a.return !== b.return)
          a = parentA, b = parentB;
        else {
          for (var didFindChild = false, child$0 = parentA.child;child$0; ) {
            if (child$0 === a) {
              didFindChild = true;
              a = parentA;
              b = parentB;
              break;
            }
            if (child$0 === b) {
              didFindChild = true;
              b = parentA;
              a = parentB;
              break;
            }
            child$0 = child$0.sibling;
          }
          if (!didFindChild) {
            for (child$0 = parentB.child;child$0; ) {
              if (child$0 === a) {
                didFindChild = true;
                a = parentB;
                b = parentA;
                break;
              }
              if (child$0 === b) {
                didFindChild = true;
                b = parentB;
                a = parentA;
                break;
              }
              child$0 = child$0.sibling;
            }
            if (!didFindChild)
              throw Error(formatProdErrorMessage(189));
          }
        }
        if (a.alternate !== b)
          throw Error(formatProdErrorMessage(190));
      }
      if (a.tag !== 3)
        throw Error(formatProdErrorMessage(188));
      return a.stateNode.current === a ? fiber : alternate;
    }
    function findCurrentHostFiberImpl(node) {
      var tag = node.tag;
      if (tag === 5 || tag === 26 || tag === 27 || tag === 6)
        return node;
      for (node = node.child;node !== null; ) {
        tag = findCurrentHostFiberImpl(node);
        if (tag !== null)
          return tag;
        node = node.sibling;
      }
      return null;
    }
    function findCurrentHostFiberWithNoPortalsImpl(node) {
      var tag = node.tag;
      if (tag === 5 || tag === 26 || tag === 27 || tag === 6)
        return node;
      for (node = node.child;node !== null; ) {
        if (node.tag !== 4 && (tag = findCurrentHostFiberWithNoPortalsImpl(node), tag !== null))
          return tag;
        node = node.sibling;
      }
      return null;
    }
    function getIteratorFn2(maybeIterable) {
      if (maybeIterable === null || typeof maybeIterable !== "object")
        return null;
      maybeIterable = MAYBE_ITERATOR_SYMBOL2 && maybeIterable[MAYBE_ITERATOR_SYMBOL2] || maybeIterable["@@iterator"];
      return typeof maybeIterable === "function" ? maybeIterable : null;
    }
    function getComponentNameFromType(type) {
      if (type == null)
        return null;
      if (typeof type === "function")
        return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
      if (typeof type === "string")
        return type;
      switch (type) {
        case REACT_FRAGMENT_TYPE2:
          return "Fragment";
        case REACT_PROFILER_TYPE2:
          return "Profiler";
        case REACT_STRICT_MODE_TYPE2:
          return "StrictMode";
        case REACT_SUSPENSE_TYPE2:
          return "Suspense";
        case REACT_SUSPENSE_LIST_TYPE:
          return "SuspenseList";
        case REACT_ACTIVITY_TYPE2:
          return "Activity";
      }
      if (typeof type === "object")
        switch (type.$$typeof) {
          case REACT_PORTAL_TYPE2:
            return "Portal";
          case REACT_CONTEXT_TYPE2:
            return type.displayName || "Context";
          case REACT_CONSUMER_TYPE2:
            return (type._context.displayName || "Context") + ".Consumer";
          case REACT_FORWARD_REF_TYPE2:
            var innerType = type.render;
            type = type.displayName;
            type || (type = innerType.displayName || innerType.name || "", type = type !== "" ? "ForwardRef(" + type + ")" : "ForwardRef");
            return type;
          case REACT_MEMO_TYPE2:
            return innerType = type.displayName || null, innerType !== null ? innerType : getComponentNameFromType(type.type) || "Memo";
          case REACT_LAZY_TYPE2:
            innerType = type._payload;
            type = type._init;
            try {
              return getComponentNameFromType(type(innerType));
            } catch (x) {}
        }
      return null;
    }
    function createCursor(defaultValue) {
      return { current: defaultValue };
    }
    function pop2(cursor) {
      0 > index$jscomp$0 || (cursor.current = valueStack[index$jscomp$0], valueStack[index$jscomp$0] = null, index$jscomp$0--);
    }
    function push2(cursor, value) {
      index$jscomp$0++;
      valueStack[index$jscomp$0] = cursor.current;
      cursor.current = value;
    }
    function clz32Fallback(x) {
      x >>>= 0;
      return x === 0 ? 32 : 31 - (log$1(x) / LN2 | 0) | 0;
    }
    function getHighestPriorityLanes(lanes) {
      var pendingSyncLanes = lanes & 42;
      if (pendingSyncLanes !== 0)
        return pendingSyncLanes;
      switch (lanes & -lanes) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
          return 64;
        case 128:
          return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
          return lanes & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return lanes & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return lanes & 62914560;
        case 67108864:
          return 67108864;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 0;
        default:
          return lanes;
      }
    }
    function getNextLanes(root, wipLanes, rootHasPendingCommit) {
      var pendingLanes = root.pendingLanes;
      if (pendingLanes === 0)
        return 0;
      var nextLanes = 0, suspendedLanes = root.suspendedLanes, pingedLanes = root.pingedLanes;
      root = root.warmLanes;
      var nonIdlePendingLanes = pendingLanes & 134217727;
      nonIdlePendingLanes !== 0 ? (pendingLanes = nonIdlePendingLanes & ~suspendedLanes, pendingLanes !== 0 ? nextLanes = getHighestPriorityLanes(pendingLanes) : (pingedLanes &= nonIdlePendingLanes, pingedLanes !== 0 ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = nonIdlePendingLanes & ~root, rootHasPendingCommit !== 0 && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))))) : (nonIdlePendingLanes = pendingLanes & ~suspendedLanes, nonIdlePendingLanes !== 0 ? nextLanes = getHighestPriorityLanes(nonIdlePendingLanes) : pingedLanes !== 0 ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = pendingLanes & ~root, rootHasPendingCommit !== 0 && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))));
      return nextLanes === 0 ? 0 : wipLanes !== 0 && wipLanes !== nextLanes && (wipLanes & suspendedLanes) === 0 && (suspendedLanes = nextLanes & -nextLanes, rootHasPendingCommit = wipLanes & -wipLanes, suspendedLanes >= rootHasPendingCommit || suspendedLanes === 32 && (rootHasPendingCommit & 4194048) !== 0) ? wipLanes : nextLanes;
    }
    function checkIfRootIsPrerendering(root, renderLanes2) {
      return (root.pendingLanes & ~(root.suspendedLanes & ~root.pingedLanes) & renderLanes2) === 0;
    }
    function computeExpirationTime(lane, currentTime) {
      switch (lane) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
          return currentTime + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return currentTime + 5000;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function claimNextRetryLane() {
      var lane = nextRetryLane;
      nextRetryLane <<= 1;
      (nextRetryLane & 62914560) === 0 && (nextRetryLane = 4194304);
      return lane;
    }
    function createLaneMap(initial) {
      for (var laneMap = [], i = 0;31 > i; i++)
        laneMap.push(initial);
      return laneMap;
    }
    function markRootUpdated$1(root, updateLane) {
      root.pendingLanes |= updateLane;
      updateLane !== 268435456 && (root.suspendedLanes = 0, root.pingedLanes = 0, root.warmLanes = 0);
    }
    function markRootFinished(root, finishedLanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes) {
      var previouslyPendingLanes = root.pendingLanes;
      root.pendingLanes = remainingLanes;
      root.suspendedLanes = 0;
      root.pingedLanes = 0;
      root.warmLanes = 0;
      root.expiredLanes &= remainingLanes;
      root.entangledLanes &= remainingLanes;
      root.errorRecoveryDisabledLanes &= remainingLanes;
      root.shellSuspendCounter = 0;
      var { entanglements, expirationTimes, hiddenUpdates } = root;
      for (remainingLanes = previouslyPendingLanes & ~remainingLanes;0 < remainingLanes; ) {
        var index$5 = 31 - clz32(remainingLanes), lane = 1 << index$5;
        entanglements[index$5] = 0;
        expirationTimes[index$5] = -1;
        var hiddenUpdatesForLane = hiddenUpdates[index$5];
        if (hiddenUpdatesForLane !== null)
          for (hiddenUpdates[index$5] = null, index$5 = 0;index$5 < hiddenUpdatesForLane.length; index$5++) {
            var update = hiddenUpdatesForLane[index$5];
            update !== null && (update.lane &= -536870913);
          }
        remainingLanes &= ~lane;
      }
      spawnedLane !== 0 && markSpawnedDeferredLane(root, spawnedLane, 0);
      suspendedRetryLanes !== 0 && updatedLanes === 0 && root.tag !== 0 && (root.suspendedLanes |= suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
    }
    function markSpawnedDeferredLane(root, spawnedLane, entangledLanes) {
      root.pendingLanes |= spawnedLane;
      root.suspendedLanes &= ~spawnedLane;
      var spawnedLaneIndex = 31 - clz32(spawnedLane);
      root.entangledLanes |= spawnedLane;
      root.entanglements[spawnedLaneIndex] = root.entanglements[spawnedLaneIndex] | 1073741824 | entangledLanes & 261930;
    }
    function markRootEntangled(root, entangledLanes) {
      var rootEntangledLanes = root.entangledLanes |= entangledLanes;
      for (root = root.entanglements;rootEntangledLanes; ) {
        var index$6 = 31 - clz32(rootEntangledLanes), lane = 1 << index$6;
        lane & entangledLanes | root[index$6] & entangledLanes && (root[index$6] |= entangledLanes);
        rootEntangledLanes &= ~lane;
      }
    }
    function getBumpedLaneForHydration(root, renderLanes2) {
      var renderLane = renderLanes2 & -renderLanes2;
      renderLane = (renderLane & 42) !== 0 ? 1 : getBumpedLaneForHydrationByLane(renderLane);
      return (renderLane & (root.suspendedLanes | renderLanes2)) !== 0 ? 0 : renderLane;
    }
    function getBumpedLaneForHydrationByLane(lane) {
      switch (lane) {
        case 2:
          lane = 1;
          break;
        case 8:
          lane = 4;
          break;
        case 32:
          lane = 16;
          break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          lane = 128;
          break;
        case 268435456:
          lane = 134217728;
          break;
        default:
          lane = 0;
      }
      return lane;
    }
    function lanesToEventPriority(lanes) {
      lanes &= -lanes;
      return 2 < lanes ? 8 < lanes ? (lanes & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
    }
    function setIsStrictModeForDevtools(newIsStrictMode) {
      typeof log2 === "function" && unstable_setDisableYieldValue2(newIsStrictMode);
      if (injectedHook && typeof injectedHook.setStrictMode === "function")
        try {
          injectedHook.setStrictMode(rendererID, newIsStrictMode);
        } catch (err) {}
    }
    function is(x, y) {
      return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
    }
    function describeBuiltInComponentFrame(name) {
      if (prefix === undefined)
        try {
          throw Error();
        } catch (x) {
          var match = x.stack.trim().match(/\n( *(at )?)/);
          prefix = match && match[1] || "";
          suffix = -1 < x.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
        }
      return `
` + prefix + name + suffix;
    }
    function describeNativeComponentFrame(fn, construct) {
      if (!fn || reentry)
        return "";
      reentry = true;
      var previousPrepareStackTrace = Error.prepareStackTrace;
      Error.prepareStackTrace = undefined;
      try {
        var RunInRootFrame = {
          DetermineComponentFrameRoot: function() {
            try {
              if (construct) {
                var Fake = function() {
                  throw Error();
                };
                Object.defineProperty(Fake.prototype, "props", {
                  set: function() {
                    throw Error();
                  }
                });
                if (typeof Reflect === "object" && Reflect.construct) {
                  try {
                    Reflect.construct(Fake, []);
                  } catch (x) {
                    var control = x;
                  }
                  Reflect.construct(fn, [], Fake);
                } else {
                  try {
                    Fake.call();
                  } catch (x$8) {
                    control = x$8;
                  }
                  fn.call(Fake.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (x$9) {
                  control = x$9;
                }
                (Fake = fn()) && typeof Fake.catch === "function" && Fake.catch(function() {});
              }
            } catch (sample) {
              if (sample && control && typeof sample.stack === "string")
                return [sample.stack, control.stack];
            }
            return [null, null];
          }
        };
        RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
        var namePropDescriptor = Object.getOwnPropertyDescriptor(RunInRootFrame.DetermineComponentFrameRoot, "name");
        namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(RunInRootFrame.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
        var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
        if (sampleStack && controlStack) {
          var sampleLines = sampleStack.split(`
`), controlLines = controlStack.split(`
`);
          for (namePropDescriptor = RunInRootFrame = 0;RunInRootFrame < sampleLines.length && !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot"); )
            RunInRootFrame++;
          for (;namePropDescriptor < controlLines.length && !controlLines[namePropDescriptor].includes("DetermineComponentFrameRoot"); )
            namePropDescriptor++;
          if (RunInRootFrame === sampleLines.length || namePropDescriptor === controlLines.length)
            for (RunInRootFrame = sampleLines.length - 1, namePropDescriptor = controlLines.length - 1;1 <= RunInRootFrame && 0 <= namePropDescriptor && sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]; )
              namePropDescriptor--;
          for (;1 <= RunInRootFrame && 0 <= namePropDescriptor; RunInRootFrame--, namePropDescriptor--)
            if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
              if (RunInRootFrame !== 1 || namePropDescriptor !== 1) {
                do
                  if (RunInRootFrame--, namePropDescriptor--, 0 > namePropDescriptor || sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
                    var frame = `
` + sampleLines[RunInRootFrame].replace(" at new ", " at ");
                    fn.displayName && frame.includes("<anonymous>") && (frame = frame.replace("<anonymous>", fn.displayName));
                    return frame;
                  }
                while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
              }
              break;
            }
        }
      } finally {
        reentry = false, Error.prepareStackTrace = previousPrepareStackTrace;
      }
      return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(previousPrepareStackTrace) : "";
    }
    function describeFiber(fiber, childFiber) {
      switch (fiber.tag) {
        case 26:
        case 27:
        case 5:
          return describeBuiltInComponentFrame(fiber.type);
        case 16:
          return describeBuiltInComponentFrame("Lazy");
        case 13:
          return fiber.child !== childFiber && childFiber !== null ? describeBuiltInComponentFrame("Suspense Fallback") : describeBuiltInComponentFrame("Suspense");
        case 19:
          return describeBuiltInComponentFrame("SuspenseList");
        case 0:
        case 15:
          return describeNativeComponentFrame(fiber.type, false);
        case 11:
          return describeNativeComponentFrame(fiber.type.render, false);
        case 1:
          return describeNativeComponentFrame(fiber.type, true);
        case 31:
          return describeBuiltInComponentFrame("Activity");
        default:
          return "";
      }
    }
    function getStackByFiberInDevAndProd(workInProgress2) {
      try {
        var info = "", previous = null;
        do
          info += describeFiber(workInProgress2, previous), previous = workInProgress2, workInProgress2 = workInProgress2.return;
        while (workInProgress2);
        return info;
      } catch (x) {
        return `
Error generating stack: ` + x.message + `
` + x.stack;
      }
    }
    function createCapturedValueAtFiber(value, source) {
      if (typeof value === "object" && value !== null) {
        var existing = CapturedStacks.get(value);
        if (existing !== undefined)
          return existing;
        source = {
          value,
          source,
          stack: getStackByFiberInDevAndProd(source)
        };
        CapturedStacks.set(value, source);
        return source;
      }
      return {
        value,
        source,
        stack: getStackByFiberInDevAndProd(source)
      };
    }
    function pushTreeFork(workInProgress2, totalChildren) {
      forkStack[forkStackIndex++] = treeForkCount;
      forkStack[forkStackIndex++] = treeForkProvider;
      treeForkProvider = workInProgress2;
      treeForkCount = totalChildren;
    }
    function pushTreeId(workInProgress2, totalChildren, index) {
      idStack[idStackIndex++] = treeContextId;
      idStack[idStackIndex++] = treeContextOverflow;
      idStack[idStackIndex++] = treeContextProvider;
      treeContextProvider = workInProgress2;
      var baseIdWithLeadingBit = treeContextId;
      workInProgress2 = treeContextOverflow;
      var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
      baseIdWithLeadingBit &= ~(1 << baseLength);
      index += 1;
      var length = 32 - clz32(totalChildren) + baseLength;
      if (30 < length) {
        var numberOfOverflowBits = baseLength - baseLength % 5;
        length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32);
        baseIdWithLeadingBit >>= numberOfOverflowBits;
        baseLength -= numberOfOverflowBits;
        treeContextId = 1 << 32 - clz32(totalChildren) + baseLength | index << baseLength | baseIdWithLeadingBit;
        treeContextOverflow = length + workInProgress2;
      } else
        treeContextId = 1 << length | index << baseLength | baseIdWithLeadingBit, treeContextOverflow = workInProgress2;
    }
    function pushMaterializedTreeId(workInProgress2) {
      workInProgress2.return !== null && (pushTreeFork(workInProgress2, 1), pushTreeId(workInProgress2, 1, 0));
    }
    function popTreeContext(workInProgress2) {
      for (;workInProgress2 === treeForkProvider; )
        treeForkProvider = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null, treeForkCount = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null;
      for (;workInProgress2 === treeContextProvider; )
        treeContextProvider = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextOverflow = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextId = idStack[--idStackIndex], idStack[idStackIndex] = null;
    }
    function restoreSuspendedTreeContext(workInProgress2, suspendedContext) {
      idStack[idStackIndex++] = treeContextId;
      idStack[idStackIndex++] = treeContextOverflow;
      idStack[idStackIndex++] = treeContextProvider;
      treeContextId = suspendedContext.id;
      treeContextOverflow = suspendedContext.overflow;
      treeContextProvider = workInProgress2;
    }
    function pushHostContainer(fiber, nextRootInstance) {
      push2(rootInstanceStackCursor, nextRootInstance);
      push2(contextFiberStackCursor, fiber);
      push2(contextStackCursor, null);
      fiber = getRootHostContext(nextRootInstance);
      pop2(contextStackCursor);
      push2(contextStackCursor, fiber);
    }
    function popHostContainer() {
      pop2(contextStackCursor);
      pop2(contextFiberStackCursor);
      pop2(rootInstanceStackCursor);
    }
    function pushHostContext(fiber) {
      fiber.memoizedState !== null && push2(hostTransitionProviderCursor, fiber);
      var context = contextStackCursor.current, nextContext = getChildHostContext(context, fiber.type);
      context !== nextContext && (push2(contextFiberStackCursor, fiber), push2(contextStackCursor, nextContext));
    }
    function popHostContext(fiber) {
      contextFiberStackCursor.current === fiber && (pop2(contextStackCursor), pop2(contextFiberStackCursor));
      hostTransitionProviderCursor.current === fiber && (pop2(hostTransitionProviderCursor), isPrimaryRenderer ? HostTransitionContext._currentValue = NotPendingTransition : HostTransitionContext._currentValue2 = NotPendingTransition);
    }
    function throwOnHydrationMismatch(fiber) {
      var error = Error(formatProdErrorMessage(418, 1 < arguments.length && arguments[1] !== undefined && arguments[1] ? "text" : "HTML", ""));
      queueHydrationError(createCapturedValueAtFiber(error, fiber));
      throw HydrationMismatchException;
    }
    function prepareToHydrateHostInstance(fiber, hostContext) {
      if (!supportsHydration)
        throw Error(formatProdErrorMessage(175));
      hydrateInstance(fiber.stateNode, fiber.type, fiber.memoizedProps, hostContext, fiber) || throwOnHydrationMismatch(fiber, true);
    }
    function popToNextHostParent(fiber) {
      for (hydrationParentFiber = fiber.return;hydrationParentFiber; )
        switch (hydrationParentFiber.tag) {
          case 5:
          case 31:
          case 13:
            rootOrSingletonContext = false;
            return;
          case 27:
          case 3:
            rootOrSingletonContext = true;
            return;
          default:
            hydrationParentFiber = hydrationParentFiber.return;
        }
    }
    function popHydrationState(fiber) {
      if (!supportsHydration || fiber !== hydrationParentFiber)
        return false;
      if (!isHydrating)
        return popToNextHostParent(fiber), isHydrating = true, false;
      var tag = fiber.tag;
      supportsSingletons ? tag !== 3 && tag !== 27 && (tag !== 5 || shouldDeleteUnhydratedTailInstances(fiber.type) && !shouldSetTextContent(fiber.type, fiber.memoizedProps)) && nextHydratableInstance && throwOnHydrationMismatch(fiber) : tag !== 3 && (tag !== 5 || shouldDeleteUnhydratedTailInstances(fiber.type) && !shouldSetTextContent(fiber.type, fiber.memoizedProps)) && nextHydratableInstance && throwOnHydrationMismatch(fiber);
      popToNextHostParent(fiber);
      if (tag === 13) {
        if (!supportsHydration)
          throw Error(formatProdErrorMessage(316));
        fiber = fiber.memoizedState;
        fiber = fiber !== null ? fiber.dehydrated : null;
        if (!fiber)
          throw Error(formatProdErrorMessage(317));
        nextHydratableInstance = getNextHydratableInstanceAfterSuspenseInstance(fiber);
      } else if (tag === 31) {
        fiber = fiber.memoizedState;
        fiber = fiber !== null ? fiber.dehydrated : null;
        if (!fiber)
          throw Error(formatProdErrorMessage(317));
        nextHydratableInstance = getNextHydratableInstanceAfterActivityInstance(fiber);
      } else
        nextHydratableInstance = supportsSingletons && tag === 27 ? getNextHydratableSiblingAfterSingleton(fiber.type, nextHydratableInstance) : hydrationParentFiber ? getNextHydratableSibling(fiber.stateNode) : null;
      return true;
    }
    function resetHydrationState() {
      supportsHydration && (nextHydratableInstance = hydrationParentFiber = null, isHydrating = false);
    }
    function upgradeHydrationErrorsToRecoverable() {
      var queuedErrors = hydrationErrors;
      queuedErrors !== null && (workInProgressRootRecoverableErrors === null ? workInProgressRootRecoverableErrors = queuedErrors : workInProgressRootRecoverableErrors.push.apply(workInProgressRootRecoverableErrors, queuedErrors), hydrationErrors = null);
      return queuedErrors;
    }
    function queueHydrationError(error) {
      hydrationErrors === null ? hydrationErrors = [error] : hydrationErrors.push(error);
    }
    function pushProvider(providerFiber, context, nextValue) {
      isPrimaryRenderer ? (push2(valueCursor, context._currentValue), context._currentValue = nextValue) : (push2(valueCursor, context._currentValue2), context._currentValue2 = nextValue);
    }
    function popProvider(context) {
      var currentValue = valueCursor.current;
      isPrimaryRenderer ? context._currentValue = currentValue : context._currentValue2 = currentValue;
      pop2(valueCursor);
    }
    function scheduleContextWorkOnParentPath(parent, renderLanes2, propagationRoot) {
      for (;parent !== null; ) {
        var alternate = parent.alternate;
        (parent.childLanes & renderLanes2) !== renderLanes2 ? (parent.childLanes |= renderLanes2, alternate !== null && (alternate.childLanes |= renderLanes2)) : alternate !== null && (alternate.childLanes & renderLanes2) !== renderLanes2 && (alternate.childLanes |= renderLanes2);
        if (parent === propagationRoot)
          break;
        parent = parent.return;
      }
    }
    function propagateContextChanges(workInProgress2, contexts, renderLanes2, forcePropagateEntireTree) {
      var fiber = workInProgress2.child;
      fiber !== null && (fiber.return = workInProgress2);
      for (;fiber !== null; ) {
        var list = fiber.dependencies;
        if (list !== null) {
          var nextFiber = fiber.child;
          list = list.firstContext;
          a:
            for (;list !== null; ) {
              var dependency = list;
              list = fiber;
              for (var i = 0;i < contexts.length; i++)
                if (dependency.context === contexts[i]) {
                  list.lanes |= renderLanes2;
                  dependency = list.alternate;
                  dependency !== null && (dependency.lanes |= renderLanes2);
                  scheduleContextWorkOnParentPath(list.return, renderLanes2, workInProgress2);
                  forcePropagateEntireTree || (nextFiber = null);
                  break a;
                }
              list = dependency.next;
            }
        } else if (fiber.tag === 18) {
          nextFiber = fiber.return;
          if (nextFiber === null)
            throw Error(formatProdErrorMessage(341));
          nextFiber.lanes |= renderLanes2;
          list = nextFiber.alternate;
          list !== null && (list.lanes |= renderLanes2);
          scheduleContextWorkOnParentPath(nextFiber, renderLanes2, workInProgress2);
          nextFiber = null;
        } else
          nextFiber = fiber.child;
        if (nextFiber !== null)
          nextFiber.return = fiber;
        else
          for (nextFiber = fiber;nextFiber !== null; ) {
            if (nextFiber === workInProgress2) {
              nextFiber = null;
              break;
            }
            fiber = nextFiber.sibling;
            if (fiber !== null) {
              fiber.return = nextFiber.return;
              nextFiber = fiber;
              break;
            }
            nextFiber = nextFiber.return;
          }
        fiber = nextFiber;
      }
    }
    function propagateParentContextChanges(current, workInProgress2, renderLanes2, forcePropagateEntireTree) {
      current = null;
      for (var parent = workInProgress2, isInsidePropagationBailout = false;parent !== null; ) {
        if (!isInsidePropagationBailout) {
          if ((parent.flags & 524288) !== 0)
            isInsidePropagationBailout = true;
          else if ((parent.flags & 262144) !== 0)
            break;
        }
        if (parent.tag === 10) {
          var currentParent = parent.alternate;
          if (currentParent === null)
            throw Error(formatProdErrorMessage(387));
          currentParent = currentParent.memoizedProps;
          if (currentParent !== null) {
            var context = parent.type;
            objectIs(parent.pendingProps.value, currentParent.value) || (current !== null ? current.push(context) : current = [context]);
          }
        } else if (parent === hostTransitionProviderCursor.current) {
          currentParent = parent.alternate;
          if (currentParent === null)
            throw Error(formatProdErrorMessage(387));
          currentParent.memoizedState.memoizedState !== parent.memoizedState.memoizedState && (current !== null ? current.push(HostTransitionContext) : current = [HostTransitionContext]);
        }
        parent = parent.return;
      }
      current !== null && propagateContextChanges(workInProgress2, current, renderLanes2, forcePropagateEntireTree);
      workInProgress2.flags |= 262144;
    }
    function checkIfContextChanged(currentDependencies) {
      for (currentDependencies = currentDependencies.firstContext;currentDependencies !== null; ) {
        var context = currentDependencies.context;
        if (!objectIs(isPrimaryRenderer ? context._currentValue : context._currentValue2, currentDependencies.memoizedValue))
          return true;
        currentDependencies = currentDependencies.next;
      }
      return false;
    }
    function prepareToReadContext(workInProgress2) {
      currentlyRenderingFiber$1 = workInProgress2;
      lastContextDependency = null;
      workInProgress2 = workInProgress2.dependencies;
      workInProgress2 !== null && (workInProgress2.firstContext = null);
    }
    function readContext(context) {
      return readContextForConsumer(currentlyRenderingFiber$1, context);
    }
    function readContextDuringReconciliation(consumer, context) {
      currentlyRenderingFiber$1 === null && prepareToReadContext(consumer);
      return readContextForConsumer(consumer, context);
    }
    function readContextForConsumer(consumer, context) {
      var value = isPrimaryRenderer ? context._currentValue : context._currentValue2;
      context = { context, memoizedValue: value, next: null };
      if (lastContextDependency === null) {
        if (consumer === null)
          throw Error(formatProdErrorMessage(308));
        lastContextDependency = context;
        consumer.dependencies = { lanes: 0, firstContext: context };
        consumer.flags |= 524288;
      } else
        lastContextDependency = lastContextDependency.next = context;
      return value;
    }
    function createCache() {
      return {
        controller: new AbortControllerLocal,
        data: new Map,
        refCount: 0
      };
    }
    function releaseCache(cache) {
      cache.refCount--;
      cache.refCount === 0 && scheduleCallback$2(NormalPriority, function() {
        cache.controller.abort();
      });
    }
    function noop$1() {}
    function ensureRootIsScheduled(root) {
      root !== lastScheduledRoot && root.next === null && (lastScheduledRoot === null ? firstScheduledRoot = lastScheduledRoot = root : lastScheduledRoot = lastScheduledRoot.next = root);
      mightHavePendingSyncWork = true;
      didScheduleMicrotask || (didScheduleMicrotask = true, scheduleImmediateRootScheduleTask());
    }
    function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
      if (!isFlushingWork && mightHavePendingSyncWork) {
        isFlushingWork = true;
        do {
          var didPerformSomeWork = false;
          for (var root = firstScheduledRoot;root !== null; ) {
            if (!onlyLegacy)
              if (syncTransitionLanes !== 0) {
                var pendingLanes = root.pendingLanes;
                if (pendingLanes === 0)
                  var JSCompiler_inline_result = 0;
                else {
                  var { suspendedLanes, pingedLanes } = root;
                  JSCompiler_inline_result = (1 << 31 - clz32(42 | syncTransitionLanes) + 1) - 1;
                  JSCompiler_inline_result &= pendingLanes & ~(suspendedLanes & ~pingedLanes);
                  JSCompiler_inline_result = JSCompiler_inline_result & 201326741 ? JSCompiler_inline_result & 201326741 | 1 : JSCompiler_inline_result ? JSCompiler_inline_result | 2 : 0;
                }
                JSCompiler_inline_result !== 0 && (didPerformSomeWork = true, performSyncWorkOnRoot(root, JSCompiler_inline_result));
              } else
                JSCompiler_inline_result = workInProgressRootRenderLanes, JSCompiler_inline_result = getNextLanes(root, root === workInProgressRoot ? JSCompiler_inline_result : 0, root.cancelPendingCommit !== null || root.timeoutHandle !== noTimeout), (JSCompiler_inline_result & 3) === 0 || checkIfRootIsPrerendering(root, JSCompiler_inline_result) || (didPerformSomeWork = true, performSyncWorkOnRoot(root, JSCompiler_inline_result));
            root = root.next;
          }
        } while (didPerformSomeWork);
        isFlushingWork = false;
      }
    }
    function processRootScheduleInImmediateTask() {
      processRootScheduleInMicrotask();
    }
    function processRootScheduleInMicrotask() {
      mightHavePendingSyncWork = didScheduleMicrotask = false;
      var syncTransitionLanes = 0;
      currentEventTransitionLane !== 0 && shouldAttemptEagerTransition() && (syncTransitionLanes = currentEventTransitionLane);
      for (var currentTime = now2(), prev = null, root = firstScheduledRoot;root !== null; ) {
        var next = root.next, nextLanes = scheduleTaskForRootDuringMicrotask(root, currentTime);
        if (nextLanes === 0)
          root.next = null, prev === null ? firstScheduledRoot = next : prev.next = next, next === null && (lastScheduledRoot = prev);
        else if (prev = root, syncTransitionLanes !== 0 || (nextLanes & 3) !== 0)
          mightHavePendingSyncWork = true;
        root = next;
      }
      pendingEffectsStatus !== 0 && pendingEffectsStatus !== 5 || flushSyncWorkAcrossRoots_impl(syncTransitionLanes, false);
      currentEventTransitionLane !== 0 && (currentEventTransitionLane = 0);
    }
    function scheduleTaskForRootDuringMicrotask(root, currentTime) {
      for (var { suspendedLanes, pingedLanes, expirationTimes } = root, lanes = root.pendingLanes & -62914561;0 < lanes; ) {
        var index$3 = 31 - clz32(lanes), lane = 1 << index$3, expirationTime = expirationTimes[index$3];
        if (expirationTime === -1) {
          if ((lane & suspendedLanes) === 0 || (lane & pingedLanes) !== 0)
            expirationTimes[index$3] = computeExpirationTime(lane, currentTime);
        } else
          expirationTime <= currentTime && (root.expiredLanes |= lane);
        lanes &= ~lane;
      }
      currentTime = workInProgressRoot;
      suspendedLanes = workInProgressRootRenderLanes;
      suspendedLanes = getNextLanes(root, root === currentTime ? suspendedLanes : 0, root.cancelPendingCommit !== null || root.timeoutHandle !== noTimeout);
      pingedLanes = root.callbackNode;
      if (suspendedLanes === 0 || root === currentTime && (workInProgressSuspendedReason === 2 || workInProgressSuspendedReason === 9) || root.cancelPendingCommit !== null)
        return pingedLanes !== null && pingedLanes !== null && cancelCallback$1(pingedLanes), root.callbackNode = null, root.callbackPriority = 0;
      if ((suspendedLanes & 3) === 0 || checkIfRootIsPrerendering(root, suspendedLanes)) {
        currentTime = suspendedLanes & -suspendedLanes;
        if (currentTime === root.callbackPriority)
          return currentTime;
        pingedLanes !== null && cancelCallback$1(pingedLanes);
        switch (lanesToEventPriority(suspendedLanes)) {
          case 2:
          case 8:
            suspendedLanes = UserBlockingPriority;
            break;
          case 32:
            suspendedLanes = NormalPriority$1;
            break;
          case 268435456:
            suspendedLanes = IdlePriority;
            break;
          default:
            suspendedLanes = NormalPriority$1;
        }
        pingedLanes = performWorkOnRootViaSchedulerTask.bind(null, root);
        suspendedLanes = scheduleCallback$3(suspendedLanes, pingedLanes);
        root.callbackPriority = currentTime;
        root.callbackNode = suspendedLanes;
        return currentTime;
      }
      pingedLanes !== null && pingedLanes !== null && cancelCallback$1(pingedLanes);
      root.callbackPriority = 2;
      root.callbackNode = null;
      return 2;
    }
    function performWorkOnRootViaSchedulerTask(root, didTimeout) {
      if (pendingEffectsStatus !== 0 && pendingEffectsStatus !== 5)
        return root.callbackNode = null, root.callbackPriority = 0, null;
      var originalCallbackNode = root.callbackNode;
      if (flushPendingEffects() && root.callbackNode !== originalCallbackNode)
        return null;
      var workInProgressRootRenderLanes$jscomp$0 = workInProgressRootRenderLanes;
      workInProgressRootRenderLanes$jscomp$0 = getNextLanes(root, root === workInProgressRoot ? workInProgressRootRenderLanes$jscomp$0 : 0, root.cancelPendingCommit !== null || root.timeoutHandle !== noTimeout);
      if (workInProgressRootRenderLanes$jscomp$0 === 0)
        return null;
      performWorkOnRoot(root, workInProgressRootRenderLanes$jscomp$0, didTimeout);
      scheduleTaskForRootDuringMicrotask(root, now2());
      return root.callbackNode != null && root.callbackNode === originalCallbackNode ? performWorkOnRootViaSchedulerTask.bind(null, root) : null;
    }
    function performSyncWorkOnRoot(root, lanes) {
      if (flushPendingEffects())
        return null;
      performWorkOnRoot(root, lanes, true);
    }
    function scheduleImmediateRootScheduleTask() {
      supportsMicrotasks ? scheduleMicrotask(function() {
        (executionContext & 6) !== 0 ? scheduleCallback$3(ImmediatePriority, processRootScheduleInImmediateTask) : processRootScheduleInMicrotask();
      }) : scheduleCallback$3(ImmediatePriority, processRootScheduleInImmediateTask);
    }
    function requestTransitionLane() {
      if (currentEventTransitionLane === 0) {
        var actionScopeLane = currentEntangledLane;
        actionScopeLane === 0 && (actionScopeLane = nextTransitionUpdateLane, nextTransitionUpdateLane <<= 1, (nextTransitionUpdateLane & 261888) === 0 && (nextTransitionUpdateLane = 256));
        currentEventTransitionLane = actionScopeLane;
      }
      return currentEventTransitionLane;
    }
    function entangleAsyncAction(transition, thenable) {
      if (currentEntangledListeners === null) {
        var entangledListeners = currentEntangledListeners = [];
        currentEntangledPendingCount = 0;
        currentEntangledLane = requestTransitionLane();
        currentEntangledActionThenable = {
          status: "pending",
          value: undefined,
          then: function(resolve) {
            entangledListeners.push(resolve);
          }
        };
      }
      currentEntangledPendingCount++;
      thenable.then(pingEngtangledActionScope, pingEngtangledActionScope);
      return thenable;
    }
    function pingEngtangledActionScope() {
      if (--currentEntangledPendingCount === 0 && currentEntangledListeners !== null) {
        currentEntangledActionThenable !== null && (currentEntangledActionThenable.status = "fulfilled");
        var listeners = currentEntangledListeners;
        currentEntangledListeners = null;
        currentEntangledLane = 0;
        currentEntangledActionThenable = null;
        for (var i = 0;i < listeners.length; i++)
          (0, listeners[i])();
      }
    }
    function chainThenableValue(thenable, result) {
      var listeners = [], thenableWithOverride = {
        status: "pending",
        value: null,
        reason: null,
        then: function(resolve) {
          listeners.push(resolve);
        }
      };
      thenable.then(function() {
        thenableWithOverride.status = "fulfilled";
        thenableWithOverride.value = result;
        for (var i = 0;i < listeners.length; i++)
          (0, listeners[i])(result);
      }, function(error) {
        thenableWithOverride.status = "rejected";
        thenableWithOverride.reason = error;
        for (error = 0;error < listeners.length; error++)
          (0, listeners[error])(undefined);
      });
      return thenableWithOverride;
    }
    function peekCacheFromPool() {
      var cacheResumedFromPreviousRender = resumedCache.current;
      return cacheResumedFromPreviousRender !== null ? cacheResumedFromPreviousRender : workInProgressRoot.pooledCache;
    }
    function pushTransition(offscreenWorkInProgress, prevCachePool) {
      prevCachePool === null ? push2(resumedCache, resumedCache.current) : push2(resumedCache, prevCachePool.pool);
    }
    function getSuspendedCache() {
      var cacheFromPool = peekCacheFromPool();
      return cacheFromPool === null ? null : {
        parent: isPrimaryRenderer ? CacheContext._currentValue : CacheContext._currentValue2,
        pool: cacheFromPool
      };
    }
    function shallowEqual(objA, objB) {
      if (objectIs(objA, objB))
        return true;
      if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null)
        return false;
      var keysA = Object.keys(objA), keysB = Object.keys(objB);
      if (keysA.length !== keysB.length)
        return false;
      for (keysB = 0;keysB < keysA.length; keysB++) {
        var currentKey = keysA[keysB];
        if (!hasOwnProperty2.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey]))
          return false;
      }
      return true;
    }
    function isThenableResolved(thenable) {
      thenable = thenable.status;
      return thenable === "fulfilled" || thenable === "rejected";
    }
    function trackUsedThenable(thenableState2, thenable, index) {
      index = thenableState2[index];
      index === undefined ? thenableState2.push(thenable) : index !== thenable && (thenable.then(noop$1, noop$1), thenable = index);
      switch (thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2;
        default:
          if (typeof thenable.status === "string")
            thenable.then(noop$1, noop$1);
          else {
            thenableState2 = workInProgressRoot;
            if (thenableState2 !== null && 100 < thenableState2.shellSuspendCounter)
              throw Error(formatProdErrorMessage(482));
            thenableState2 = thenable;
            thenableState2.status = "pending";
            thenableState2.then(function(fulfilledValue) {
              if (thenable.status === "pending") {
                var fulfilledThenable = thenable;
                fulfilledThenable.status = "fulfilled";
                fulfilledThenable.value = fulfilledValue;
              }
            }, function(error) {
              if (thenable.status === "pending") {
                var rejectedThenable = thenable;
                rejectedThenable.status = "rejected";
                rejectedThenable.reason = error;
              }
            });
          }
          switch (thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2;
          }
          suspendedThenable = thenable;
          throw SuspenseException;
      }
    }
    function resolveLazy(lazyType) {
      try {
        var init = lazyType._init;
        return init(lazyType._payload);
      } catch (x) {
        if (x !== null && typeof x === "object" && typeof x.then === "function")
          throw suspendedThenable = x, SuspenseException;
        throw x;
      }
    }
    function getSuspendedThenable() {
      if (suspendedThenable === null)
        throw Error(formatProdErrorMessage(459));
      var thenable = suspendedThenable;
      suspendedThenable = null;
      return thenable;
    }
    function checkIfUseWrappedInAsyncCatch(rejectedReason) {
      if (rejectedReason === SuspenseException || rejectedReason === SuspenseActionException)
        throw Error(formatProdErrorMessage(483));
    }
    function unwrapThenable(thenable) {
      var index = thenableIndexCounter$1;
      thenableIndexCounter$1 += 1;
      thenableState$1 === null && (thenableState$1 = []);
      return trackUsedThenable(thenableState$1, thenable, index);
    }
    function coerceRef(workInProgress2, element) {
      element = element.props.ref;
      workInProgress2.ref = element !== undefined ? element : null;
    }
    function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
      if (newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE)
        throw Error(formatProdErrorMessage(525));
      returnFiber = Object.prototype.toString.call(newChild);
      throw Error(formatProdErrorMessage(31, returnFiber === "[object Object]" ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : returnFiber));
    }
    function createChildReconciler(shouldTrackSideEffects) {
      function deleteChild(returnFiber, childToDelete) {
        if (shouldTrackSideEffects) {
          var deletions = returnFiber.deletions;
          deletions === null ? (returnFiber.deletions = [childToDelete], returnFiber.flags |= 16) : deletions.push(childToDelete);
        }
      }
      function deleteRemainingChildren(returnFiber, currentFirstChild) {
        if (!shouldTrackSideEffects)
          return null;
        for (;currentFirstChild !== null; )
          deleteChild(returnFiber, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
        return null;
      }
      function mapRemainingChildren(currentFirstChild) {
        for (var existingChildren = new Map;currentFirstChild !== null; )
          currentFirstChild.key !== null ? existingChildren.set(currentFirstChild.key, currentFirstChild) : existingChildren.set(currentFirstChild.index, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
        return existingChildren;
      }
      function useFiber(fiber, pendingProps) {
        fiber = createWorkInProgress(fiber, pendingProps);
        fiber.index = 0;
        fiber.sibling = null;
        return fiber;
      }
      function placeChild(newFiber, lastPlacedIndex, newIndex) {
        newFiber.index = newIndex;
        if (!shouldTrackSideEffects)
          return newFiber.flags |= 1048576, lastPlacedIndex;
        newIndex = newFiber.alternate;
        if (newIndex !== null)
          return newIndex = newIndex.index, newIndex < lastPlacedIndex ? (newFiber.flags |= 67108866, lastPlacedIndex) : newIndex;
        newFiber.flags |= 67108866;
        return lastPlacedIndex;
      }
      function placeSingleChild(newFiber) {
        shouldTrackSideEffects && newFiber.alternate === null && (newFiber.flags |= 67108866);
        return newFiber;
      }
      function updateTextNode(returnFiber, current, textContent, lanes) {
        if (current === null || current.tag !== 6)
          return current = createFiberFromText(textContent, returnFiber.mode, lanes), current.return = returnFiber, current;
        current = useFiber(current, textContent);
        current.return = returnFiber;
        return current;
      }
      function updateElement(returnFiber, current, element, lanes) {
        var elementType = element.type;
        if (elementType === REACT_FRAGMENT_TYPE2)
          return updateFragment(returnFiber, current, element.props.children, lanes, element.key);
        if (current !== null && (current.elementType === elementType || typeof elementType === "object" && elementType !== null && elementType.$$typeof === REACT_LAZY_TYPE2 && resolveLazy(elementType) === current.type))
          return current = useFiber(current, element.props), coerceRef(current, element), current.return = returnFiber, current;
        current = createFiberFromTypeAndProps(element.type, element.key, element.props, null, returnFiber.mode, lanes);
        coerceRef(current, element);
        current.return = returnFiber;
        return current;
      }
      function updatePortal(returnFiber, current, portal, lanes) {
        if (current === null || current.tag !== 4 || current.stateNode.containerInfo !== portal.containerInfo || current.stateNode.implementation !== portal.implementation)
          return current = createFiberFromPortal(portal, returnFiber.mode, lanes), current.return = returnFiber, current;
        current = useFiber(current, portal.children || []);
        current.return = returnFiber;
        return current;
      }
      function updateFragment(returnFiber, current, fragment, lanes, key) {
        if (current === null || current.tag !== 7)
          return current = createFiberFromFragment(fragment, returnFiber.mode, lanes, key), current.return = returnFiber, current;
        current = useFiber(current, fragment);
        current.return = returnFiber;
        return current;
      }
      function createChild(returnFiber, newChild, lanes) {
        if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number" || typeof newChild === "bigint")
          return newChild = createFiberFromText("" + newChild, returnFiber.mode, lanes), newChild.return = returnFiber, newChild;
        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE2:
              return lanes = createFiberFromTypeAndProps(newChild.type, newChild.key, newChild.props, null, returnFiber.mode, lanes), coerceRef(lanes, newChild), lanes.return = returnFiber, lanes;
            case REACT_PORTAL_TYPE2:
              return newChild = createFiberFromPortal(newChild, returnFiber.mode, lanes), newChild.return = returnFiber, newChild;
            case REACT_LAZY_TYPE2:
              return newChild = resolveLazy(newChild), createChild(returnFiber, newChild, lanes);
          }
          if (isArrayImpl2(newChild) || getIteratorFn2(newChild))
            return newChild = createFiberFromFragment(newChild, returnFiber.mode, lanes, null), newChild.return = returnFiber, newChild;
          if (typeof newChild.then === "function")
            return createChild(returnFiber, unwrapThenable(newChild), lanes);
          if (newChild.$$typeof === REACT_CONTEXT_TYPE2)
            return createChild(returnFiber, readContextDuringReconciliation(returnFiber, newChild), lanes);
          throwOnInvalidObjectTypeImpl(returnFiber, newChild);
        }
        return null;
      }
      function updateSlot(returnFiber, oldFiber, newChild, lanes) {
        var key = oldFiber !== null ? oldFiber.key : null;
        if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number" || typeof newChild === "bigint")
          return key !== null ? null : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE2:
              return newChild.key === key ? updateElement(returnFiber, oldFiber, newChild, lanes) : null;
            case REACT_PORTAL_TYPE2:
              return newChild.key === key ? updatePortal(returnFiber, oldFiber, newChild, lanes) : null;
            case REACT_LAZY_TYPE2:
              return newChild = resolveLazy(newChild), updateSlot(returnFiber, oldFiber, newChild, lanes);
          }
          if (isArrayImpl2(newChild) || getIteratorFn2(newChild))
            return key !== null ? null : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
          if (typeof newChild.then === "function")
            return updateSlot(returnFiber, oldFiber, unwrapThenable(newChild), lanes);
          if (newChild.$$typeof === REACT_CONTEXT_TYPE2)
            return updateSlot(returnFiber, oldFiber, readContextDuringReconciliation(returnFiber, newChild), lanes);
          throwOnInvalidObjectTypeImpl(returnFiber, newChild);
        }
        return null;
      }
      function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
        if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number" || typeof newChild === "bigint")
          return existingChildren = existingChildren.get(newIdx) || null, updateTextNode(returnFiber, existingChildren, "" + newChild, lanes);
        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE2:
              return existingChildren = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null, updateElement(returnFiber, existingChildren, newChild, lanes);
            case REACT_PORTAL_TYPE2:
              return existingChildren = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null, updatePortal(returnFiber, existingChildren, newChild, lanes);
            case REACT_LAZY_TYPE2:
              return newChild = resolveLazy(newChild), updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes);
          }
          if (isArrayImpl2(newChild) || getIteratorFn2(newChild))
            return existingChildren = existingChildren.get(newIdx) || null, updateFragment(returnFiber, existingChildren, newChild, lanes, null);
          if (typeof newChild.then === "function")
            return updateFromMap(existingChildren, returnFiber, newIdx, unwrapThenable(newChild), lanes);
          if (newChild.$$typeof === REACT_CONTEXT_TYPE2)
            return updateFromMap(existingChildren, returnFiber, newIdx, readContextDuringReconciliation(returnFiber, newChild), lanes);
          throwOnInvalidObjectTypeImpl(returnFiber, newChild);
        }
        return null;
      }
      function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
        for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null;oldFiber !== null && newIdx < newChildren.length; newIdx++) {
          oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
          var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], lanes);
          if (newFiber === null) {
            oldFiber === null && (oldFiber = nextOldFiber);
            break;
          }
          shouldTrackSideEffects && oldFiber && newFiber.alternate === null && deleteChild(returnFiber, oldFiber);
          currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
          previousNewFiber === null ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
          previousNewFiber = newFiber;
          oldFiber = nextOldFiber;
        }
        if (newIdx === newChildren.length)
          return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
        if (oldFiber === null) {
          for (;newIdx < newChildren.length; newIdx++)
            oldFiber = createChild(returnFiber, newChildren[newIdx], lanes), oldFiber !== null && (currentFirstChild = placeChild(oldFiber, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = oldFiber : previousNewFiber.sibling = oldFiber, previousNewFiber = oldFiber);
          isHydrating && pushTreeFork(returnFiber, newIdx);
          return resultingFirstChild;
        }
        for (oldFiber = mapRemainingChildren(oldFiber);newIdx < newChildren.length; newIdx++)
          nextOldFiber = updateFromMap(oldFiber, returnFiber, newIdx, newChildren[newIdx], lanes), nextOldFiber !== null && (shouldTrackSideEffects && nextOldFiber.alternate !== null && oldFiber.delete(nextOldFiber.key === null ? newIdx : nextOldFiber.key), currentFirstChild = placeChild(nextOldFiber, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = nextOldFiber : previousNewFiber.sibling = nextOldFiber, previousNewFiber = nextOldFiber);
        shouldTrackSideEffects && oldFiber.forEach(function(child) {
          return deleteChild(returnFiber, child);
        });
        isHydrating && pushTreeFork(returnFiber, newIdx);
        return resultingFirstChild;
      }
      function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildren, lanes) {
        if (newChildren == null)
          throw Error(formatProdErrorMessage(151));
        for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null, step = newChildren.next();oldFiber !== null && !step.done; newIdx++, step = newChildren.next()) {
          oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
          var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
          if (newFiber === null) {
            oldFiber === null && (oldFiber = nextOldFiber);
            break;
          }
          shouldTrackSideEffects && oldFiber && newFiber.alternate === null && deleteChild(returnFiber, oldFiber);
          currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
          previousNewFiber === null ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
          previousNewFiber = newFiber;
          oldFiber = nextOldFiber;
        }
        if (step.done)
          return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
        if (oldFiber === null) {
          for (;!step.done; newIdx++, step = newChildren.next())
            step = createChild(returnFiber, step.value, lanes), step !== null && (currentFirstChild = placeChild(step, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
          isHydrating && pushTreeFork(returnFiber, newIdx);
          return resultingFirstChild;
        }
        for (oldFiber = mapRemainingChildren(oldFiber);!step.done; newIdx++, step = newChildren.next())
          step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes), step !== null && (shouldTrackSideEffects && step.alternate !== null && oldFiber.delete(step.key === null ? newIdx : step.key), currentFirstChild = placeChild(step, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
        shouldTrackSideEffects && oldFiber.forEach(function(child) {
          return deleteChild(returnFiber, child);
        });
        isHydrating && pushTreeFork(returnFiber, newIdx);
        return resultingFirstChild;
      }
      function reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes) {
        typeof newChild === "object" && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE2 && newChild.key === null && (newChild = newChild.props.children);
        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE2:
              a: {
                for (var key = newChild.key;currentFirstChild !== null; ) {
                  if (currentFirstChild.key === key) {
                    key = newChild.type;
                    if (key === REACT_FRAGMENT_TYPE2) {
                      if (currentFirstChild.tag === 7) {
                        deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
                        lanes = useFiber(currentFirstChild, newChild.props.children);
                        lanes.return = returnFiber;
                        returnFiber = lanes;
                        break a;
                      }
                    } else if (currentFirstChild.elementType === key || typeof key === "object" && key !== null && key.$$typeof === REACT_LAZY_TYPE2 && resolveLazy(key) === currentFirstChild.type) {
                      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
                      lanes = useFiber(currentFirstChild, newChild.props);
                      coerceRef(lanes, newChild);
                      lanes.return = returnFiber;
                      returnFiber = lanes;
                      break a;
                    }
                    deleteRemainingChildren(returnFiber, currentFirstChild);
                    break;
                  } else
                    deleteChild(returnFiber, currentFirstChild);
                  currentFirstChild = currentFirstChild.sibling;
                }
                newChild.type === REACT_FRAGMENT_TYPE2 ? (lanes = createFiberFromFragment(newChild.props.children, returnFiber.mode, lanes, newChild.key), lanes.return = returnFiber, returnFiber = lanes) : (lanes = createFiberFromTypeAndProps(newChild.type, newChild.key, newChild.props, null, returnFiber.mode, lanes), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes);
              }
              return placeSingleChild(returnFiber);
            case REACT_PORTAL_TYPE2:
              a: {
                for (key = newChild.key;currentFirstChild !== null; ) {
                  if (currentFirstChild.key === key)
                    if (currentFirstChild.tag === 4 && currentFirstChild.stateNode.containerInfo === newChild.containerInfo && currentFirstChild.stateNode.implementation === newChild.implementation) {
                      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
                      lanes = useFiber(currentFirstChild, newChild.children || []);
                      lanes.return = returnFiber;
                      returnFiber = lanes;
                      break a;
                    } else {
                      deleteRemainingChildren(returnFiber, currentFirstChild);
                      break;
                    }
                  else
                    deleteChild(returnFiber, currentFirstChild);
                  currentFirstChild = currentFirstChild.sibling;
                }
                lanes = createFiberFromPortal(newChild, returnFiber.mode, lanes);
                lanes.return = returnFiber;
                returnFiber = lanes;
              }
              return placeSingleChild(returnFiber);
            case REACT_LAZY_TYPE2:
              return newChild = resolveLazy(newChild), reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes);
          }
          if (isArrayImpl2(newChild))
            return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes);
          if (getIteratorFn2(newChild)) {
            key = getIteratorFn2(newChild);
            if (typeof key !== "function")
              throw Error(formatProdErrorMessage(150));
            newChild = key.call(newChild);
            return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, lanes);
          }
          if (typeof newChild.then === "function")
            return reconcileChildFibersImpl(returnFiber, currentFirstChild, unwrapThenable(newChild), lanes);
          if (newChild.$$typeof === REACT_CONTEXT_TYPE2)
            return reconcileChildFibersImpl(returnFiber, currentFirstChild, readContextDuringReconciliation(returnFiber, newChild), lanes);
          throwOnInvalidObjectTypeImpl(returnFiber, newChild);
        }
        return typeof newChild === "string" && newChild !== "" || typeof newChild === "number" || typeof newChild === "bigint" ? (newChild = "" + newChild, currentFirstChild !== null && currentFirstChild.tag === 6 ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling), lanes = useFiber(currentFirstChild, newChild), lanes.return = returnFiber, returnFiber = lanes) : (deleteRemainingChildren(returnFiber, currentFirstChild), lanes = createFiberFromText(newChild, returnFiber.mode, lanes), lanes.return = returnFiber, returnFiber = lanes), placeSingleChild(returnFiber)) : deleteRemainingChildren(returnFiber, currentFirstChild);
      }
      return function(returnFiber, currentFirstChild, newChild, lanes) {
        try {
          thenableIndexCounter$1 = 0;
          var firstChildFiber = reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes);
          thenableState$1 = null;
          return firstChildFiber;
        } catch (x) {
          if (x === SuspenseException || x === SuspenseActionException)
            throw x;
          var fiber = createFiber(29, x, null, returnFiber.mode);
          fiber.lanes = lanes;
          fiber.return = returnFiber;
          return fiber;
        } finally {}
      };
    }
    function finishQueueingConcurrentUpdates() {
      for (var endIndex = concurrentQueuesIndex, i = concurrentlyUpdatedLanes = concurrentQueuesIndex = 0;i < endIndex; ) {
        var fiber = concurrentQueues[i];
        concurrentQueues[i++] = null;
        var queue = concurrentQueues[i];
        concurrentQueues[i++] = null;
        var update = concurrentQueues[i];
        concurrentQueues[i++] = null;
        var lane = concurrentQueues[i];
        concurrentQueues[i++] = null;
        if (queue !== null && update !== null) {
          var pending = queue.pending;
          pending === null ? update.next = update : (update.next = pending.next, pending.next = update);
          queue.pending = update;
        }
        lane !== 0 && markUpdateLaneFromFiberToRoot(fiber, update, lane);
      }
    }
    function enqueueUpdate$1(fiber, queue, update, lane) {
      concurrentQueues[concurrentQueuesIndex++] = fiber;
      concurrentQueues[concurrentQueuesIndex++] = queue;
      concurrentQueues[concurrentQueuesIndex++] = update;
      concurrentQueues[concurrentQueuesIndex++] = lane;
      concurrentlyUpdatedLanes |= lane;
      fiber.lanes |= lane;
      fiber = fiber.alternate;
      fiber !== null && (fiber.lanes |= lane);
    }
    function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
      enqueueUpdate$1(fiber, queue, update, lane);
      return getRootForUpdatedFiber(fiber);
    }
    function enqueueConcurrentRenderForLane(fiber, lane) {
      enqueueUpdate$1(fiber, null, null, lane);
      return getRootForUpdatedFiber(fiber);
    }
    function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
      sourceFiber.lanes |= lane;
      var alternate = sourceFiber.alternate;
      alternate !== null && (alternate.lanes |= lane);
      for (var isHidden = false, parent = sourceFiber.return;parent !== null; )
        parent.childLanes |= lane, alternate = parent.alternate, alternate !== null && (alternate.childLanes |= lane), parent.tag === 22 && (sourceFiber = parent.stateNode, sourceFiber === null || sourceFiber._visibility & 1 || (isHidden = true)), sourceFiber = parent, parent = parent.return;
      return sourceFiber.tag === 3 ? (parent = sourceFiber.stateNode, isHidden && update !== null && (isHidden = 31 - clz32(lane), sourceFiber = parent.hiddenUpdates, alternate = sourceFiber[isHidden], alternate === null ? sourceFiber[isHidden] = [update] : alternate.push(update), update.lane = lane | 536870912), parent) : null;
    }
    function getRootForUpdatedFiber(sourceFiber) {
      if (50 < nestedUpdateCount)
        throw nestedUpdateCount = 0, rootWithNestedUpdates = null, Error(formatProdErrorMessage(185));
      for (var parent = sourceFiber.return;parent !== null; )
        sourceFiber = parent, parent = sourceFiber.return;
      return sourceFiber.tag === 3 ? sourceFiber.stateNode : null;
    }
    function initializeUpdateQueue(fiber) {
      fiber.updateQueue = {
        baseState: fiber.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, lanes: 0, hiddenCallbacks: null },
        callbacks: null
      };
    }
    function cloneUpdateQueue(current, workInProgress2) {
      current = current.updateQueue;
      workInProgress2.updateQueue === current && (workInProgress2.updateQueue = {
        baseState: current.baseState,
        firstBaseUpdate: current.firstBaseUpdate,
        lastBaseUpdate: current.lastBaseUpdate,
        shared: current.shared,
        callbacks: null
      });
    }
    function createUpdate(lane) {
      return { lane, tag: 0, payload: null, callback: null, next: null };
    }
    function enqueueUpdate(fiber, update, lane) {
      var updateQueue = fiber.updateQueue;
      if (updateQueue === null)
        return null;
      updateQueue = updateQueue.shared;
      if ((executionContext & 2) !== 0) {
        var pending = updateQueue.pending;
        pending === null ? update.next = update : (update.next = pending.next, pending.next = update);
        updateQueue.pending = update;
        update = getRootForUpdatedFiber(fiber);
        markUpdateLaneFromFiberToRoot(fiber, null, lane);
        return update;
      }
      enqueueUpdate$1(fiber, updateQueue, update, lane);
      return getRootForUpdatedFiber(fiber);
    }
    function entangleTransitions(root, fiber, lane) {
      fiber = fiber.updateQueue;
      if (fiber !== null && (fiber = fiber.shared, (lane & 4194048) !== 0)) {
        var queueLanes = fiber.lanes;
        queueLanes &= root.pendingLanes;
        lane |= queueLanes;
        fiber.lanes = lane;
        markRootEntangled(root, lane);
      }
    }
    function enqueueCapturedUpdate(workInProgress2, capturedUpdate) {
      var { updateQueue: queue, alternate: current } = workInProgress2;
      if (current !== null && (current = current.updateQueue, queue === current)) {
        var newFirst = null, newLast = null;
        queue = queue.firstBaseUpdate;
        if (queue !== null) {
          do {
            var clone = {
              lane: queue.lane,
              tag: queue.tag,
              payload: queue.payload,
              callback: null,
              next: null
            };
            newLast === null ? newFirst = newLast = clone : newLast = newLast.next = clone;
            queue = queue.next;
          } while (queue !== null);
          newLast === null ? newFirst = newLast = capturedUpdate : newLast = newLast.next = capturedUpdate;
        } else
          newFirst = newLast = capturedUpdate;
        queue = {
          baseState: current.baseState,
          firstBaseUpdate: newFirst,
          lastBaseUpdate: newLast,
          shared: current.shared,
          callbacks: current.callbacks
        };
        workInProgress2.updateQueue = queue;
        return;
      }
      workInProgress2 = queue.lastBaseUpdate;
      workInProgress2 === null ? queue.firstBaseUpdate = capturedUpdate : workInProgress2.next = capturedUpdate;
      queue.lastBaseUpdate = capturedUpdate;
    }
    function suspendIfUpdateReadFromEntangledAsyncAction() {
      if (didReadFromEntangledAsyncAction) {
        var entangledActionThenable = currentEntangledActionThenable;
        if (entangledActionThenable !== null)
          throw entangledActionThenable;
      }
    }
    function processUpdateQueue(workInProgress$jscomp$0, props, instance$jscomp$0, renderLanes2) {
      didReadFromEntangledAsyncAction = false;
      var queue = workInProgress$jscomp$0.updateQueue;
      hasForceUpdate = false;
      var { firstBaseUpdate, lastBaseUpdate } = queue, pendingQueue = queue.shared.pending;
      if (pendingQueue !== null) {
        queue.shared.pending = null;
        var lastPendingUpdate = pendingQueue, firstPendingUpdate = lastPendingUpdate.next;
        lastPendingUpdate.next = null;
        lastBaseUpdate === null ? firstBaseUpdate = firstPendingUpdate : lastBaseUpdate.next = firstPendingUpdate;
        lastBaseUpdate = lastPendingUpdate;
        var current = workInProgress$jscomp$0.alternate;
        current !== null && (current = current.updateQueue, pendingQueue = current.lastBaseUpdate, pendingQueue !== lastBaseUpdate && (pendingQueue === null ? current.firstBaseUpdate = firstPendingUpdate : pendingQueue.next = firstPendingUpdate, current.lastBaseUpdate = lastPendingUpdate));
      }
      if (firstBaseUpdate !== null) {
        var newState = queue.baseState;
        lastBaseUpdate = 0;
        current = firstPendingUpdate = lastPendingUpdate = null;
        pendingQueue = firstBaseUpdate;
        do {
          var updateLane = pendingQueue.lane & -536870913, isHiddenUpdate = updateLane !== pendingQueue.lane;
          if (isHiddenUpdate ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes2 & updateLane) === updateLane) {
            updateLane !== 0 && updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction = true);
            current !== null && (current = current.next = {
              lane: 0,
              tag: pendingQueue.tag,
              payload: pendingQueue.payload,
              callback: null,
              next: null
            });
            a: {
              var workInProgress2 = workInProgress$jscomp$0, update = pendingQueue;
              updateLane = props;
              var instance = instance$jscomp$0;
              switch (update.tag) {
                case 1:
                  workInProgress2 = update.payload;
                  if (typeof workInProgress2 === "function") {
                    newState = workInProgress2.call(instance, newState, updateLane);
                    break a;
                  }
                  newState = workInProgress2;
                  break a;
                case 3:
                  workInProgress2.flags = workInProgress2.flags & -65537 | 128;
                case 0:
                  workInProgress2 = update.payload;
                  updateLane = typeof workInProgress2 === "function" ? workInProgress2.call(instance, newState, updateLane) : workInProgress2;
                  if (updateLane === null || updateLane === undefined)
                    break a;
                  newState = assign2({}, newState, updateLane);
                  break a;
                case 2:
                  hasForceUpdate = true;
              }
            }
            updateLane = pendingQueue.callback;
            updateLane !== null && (workInProgress$jscomp$0.flags |= 64, isHiddenUpdate && (workInProgress$jscomp$0.flags |= 8192), isHiddenUpdate = queue.callbacks, isHiddenUpdate === null ? queue.callbacks = [updateLane] : isHiddenUpdate.push(updateLane));
          } else
            isHiddenUpdate = {
              lane: updateLane,
              tag: pendingQueue.tag,
              payload: pendingQueue.payload,
              callback: pendingQueue.callback,
              next: null
            }, current === null ? (firstPendingUpdate = current = isHiddenUpdate, lastPendingUpdate = newState) : current = current.next = isHiddenUpdate, lastBaseUpdate |= updateLane;
          pendingQueue = pendingQueue.next;
          if (pendingQueue === null)
            if (pendingQueue = queue.shared.pending, pendingQueue === null)
              break;
            else
              isHiddenUpdate = pendingQueue, pendingQueue = isHiddenUpdate.next, isHiddenUpdate.next = null, queue.lastBaseUpdate = isHiddenUpdate, queue.shared.pending = null;
        } while (1);
        current === null && (lastPendingUpdate = newState);
        queue.baseState = lastPendingUpdate;
        queue.firstBaseUpdate = firstPendingUpdate;
        queue.lastBaseUpdate = current;
        firstBaseUpdate === null && (queue.shared.lanes = 0);
        workInProgressRootSkippedLanes |= lastBaseUpdate;
        workInProgress$jscomp$0.lanes = lastBaseUpdate;
        workInProgress$jscomp$0.memoizedState = newState;
      }
    }
    function callCallback(callback, context) {
      if (typeof callback !== "function")
        throw Error(formatProdErrorMessage(191, callback));
      callback.call(context);
    }
    function commitCallbacks(updateQueue, context) {
      var callbacks = updateQueue.callbacks;
      if (callbacks !== null)
        for (updateQueue.callbacks = null, updateQueue = 0;updateQueue < callbacks.length; updateQueue++)
          callCallback(callbacks[updateQueue], context);
    }
    function pushHiddenContext(fiber, context) {
      fiber = entangledRenderLanes;
      push2(prevEntangledRenderLanesCursor, fiber);
      push2(currentTreeHiddenStackCursor, context);
      entangledRenderLanes = fiber | context.baseLanes;
    }
    function reuseHiddenContextOnStack() {
      push2(prevEntangledRenderLanesCursor, entangledRenderLanes);
      push2(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
    }
    function popHiddenContext() {
      entangledRenderLanes = prevEntangledRenderLanesCursor.current;
      pop2(currentTreeHiddenStackCursor);
      pop2(prevEntangledRenderLanesCursor);
    }
    function pushPrimaryTreeSuspenseHandler(handler) {
      var current = handler.alternate;
      push2(suspenseStackCursor, suspenseStackCursor.current & 1);
      push2(suspenseHandlerStackCursor, handler);
      shellBoundary === null && (current === null || currentTreeHiddenStackCursor.current !== null ? shellBoundary = handler : current.memoizedState !== null && (shellBoundary = handler));
    }
    function pushDehydratedActivitySuspenseHandler(fiber) {
      push2(suspenseStackCursor, suspenseStackCursor.current);
      push2(suspenseHandlerStackCursor, fiber);
      shellBoundary === null && (shellBoundary = fiber);
    }
    function pushOffscreenSuspenseHandler(fiber) {
      fiber.tag === 22 ? (push2(suspenseStackCursor, suspenseStackCursor.current), push2(suspenseHandlerStackCursor, fiber), shellBoundary === null && (shellBoundary = fiber)) : reuseSuspenseHandlerOnStack(fiber);
    }
    function reuseSuspenseHandlerOnStack() {
      push2(suspenseStackCursor, suspenseStackCursor.current);
      push2(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
    }
    function popSuspenseHandler(fiber) {
      pop2(suspenseHandlerStackCursor);
      shellBoundary === fiber && (shellBoundary = null);
      pop2(suspenseStackCursor);
    }
    function findFirstSuspended(row) {
      for (var node = row;node !== null; ) {
        if (node.tag === 13) {
          var state = node.memoizedState;
          if (state !== null && (state = state.dehydrated, state === null || isSuspenseInstancePending(state) || isSuspenseInstanceFallback(state)))
            return node;
        } else if (node.tag === 19 && (node.memoizedProps.revealOrder === "forwards" || node.memoizedProps.revealOrder === "backwards" || node.memoizedProps.revealOrder === "unstable_legacy-backwards" || node.memoizedProps.revealOrder === "together")) {
          if ((node.flags & 128) !== 0)
            return node;
        } else if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }
        if (node === row)
          break;
        for (;node.sibling === null; ) {
          if (node.return === null || node.return === row)
            return null;
          node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
      }
      return null;
    }
    function throwInvalidHookError() {
      throw Error(formatProdErrorMessage(321));
    }
    function areHookInputsEqual(nextDeps, prevDeps) {
      if (prevDeps === null)
        return false;
      for (var i = 0;i < prevDeps.length && i < nextDeps.length; i++)
        if (!objectIs(nextDeps[i], prevDeps[i]))
          return false;
      return true;
    }
    function renderWithHooks(current, workInProgress2, Component2, props, secondArg, nextRenderLanes) {
      renderLanes = nextRenderLanes;
      currentlyRenderingFiber = workInProgress2;
      workInProgress2.memoizedState = null;
      workInProgress2.updateQueue = null;
      workInProgress2.lanes = 0;
      ReactSharedInternals2.H = current === null || current.memoizedState === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;
      shouldDoubleInvokeUserFnsInHooksDEV = false;
      nextRenderLanes = Component2(props, secondArg);
      shouldDoubleInvokeUserFnsInHooksDEV = false;
      didScheduleRenderPhaseUpdateDuringThisPass && (nextRenderLanes = renderWithHooksAgain(workInProgress2, Component2, props, secondArg));
      finishRenderingHooks(current);
      return nextRenderLanes;
    }
    function finishRenderingHooks(current) {
      ReactSharedInternals2.H = ContextOnlyDispatcher;
      var didRenderTooFewHooks = currentHook !== null && currentHook.next !== null;
      renderLanes = 0;
      workInProgressHook = currentHook = currentlyRenderingFiber = null;
      didScheduleRenderPhaseUpdate = false;
      thenableIndexCounter = 0;
      thenableState = null;
      if (didRenderTooFewHooks)
        throw Error(formatProdErrorMessage(300));
      current === null || didReceiveUpdate || (current = current.dependencies, current !== null && checkIfContextChanged(current) && (didReceiveUpdate = true));
    }
    function renderWithHooksAgain(workInProgress2, Component2, props, secondArg) {
      currentlyRenderingFiber = workInProgress2;
      var numberOfReRenders = 0;
      do {
        didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null);
        thenableIndexCounter = 0;
        didScheduleRenderPhaseUpdateDuringThisPass = false;
        if (25 <= numberOfReRenders)
          throw Error(formatProdErrorMessage(301));
        numberOfReRenders += 1;
        workInProgressHook = currentHook = null;
        if (workInProgress2.updateQueue != null) {
          var children = workInProgress2.updateQueue;
          children.lastEffect = null;
          children.events = null;
          children.stores = null;
          children.memoCache != null && (children.memoCache.index = 0);
        }
        ReactSharedInternals2.H = HooksDispatcherOnRerender;
        children = Component2(props, secondArg);
      } while (didScheduleRenderPhaseUpdateDuringThisPass);
      return children;
    }
    function TransitionAwareHostComponent() {
      var dispatcher = ReactSharedInternals2.H, maybeThenable = dispatcher.useState()[0];
      maybeThenable = typeof maybeThenable.then === "function" ? useThenable(maybeThenable) : maybeThenable;
      dispatcher = dispatcher.useState()[0];
      (currentHook !== null ? currentHook.memoizedState : null) !== dispatcher && (currentlyRenderingFiber.flags |= 1024);
      return maybeThenable;
    }
    function checkDidRenderIdHook() {
      var didRenderIdHook = localIdCounter !== 0;
      localIdCounter = 0;
      return didRenderIdHook;
    }
    function bailoutHooks(current, workInProgress2, lanes) {
      workInProgress2.updateQueue = current.updateQueue;
      workInProgress2.flags &= -2053;
      current.lanes &= ~lanes;
    }
    function resetHooksOnUnwind(workInProgress2) {
      if (didScheduleRenderPhaseUpdate) {
        for (workInProgress2 = workInProgress2.memoizedState;workInProgress2 !== null; ) {
          var queue = workInProgress2.queue;
          queue !== null && (queue.pending = null);
          workInProgress2 = workInProgress2.next;
        }
        didScheduleRenderPhaseUpdate = false;
      }
      renderLanes = 0;
      workInProgressHook = currentHook = currentlyRenderingFiber = null;
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      thenableIndexCounter = localIdCounter = 0;
      thenableState = null;
    }
    function mountWorkInProgressHook() {
      var hook = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
      };
      workInProgressHook === null ? currentlyRenderingFiber.memoizedState = workInProgressHook = hook : workInProgressHook = workInProgressHook.next = hook;
      return workInProgressHook;
    }
    function updateWorkInProgressHook() {
      if (currentHook === null) {
        var nextCurrentHook = currentlyRenderingFiber.alternate;
        nextCurrentHook = nextCurrentHook !== null ? nextCurrentHook.memoizedState : null;
      } else
        nextCurrentHook = currentHook.next;
      var nextWorkInProgressHook = workInProgressHook === null ? currentlyRenderingFiber.memoizedState : workInProgressHook.next;
      if (nextWorkInProgressHook !== null)
        workInProgressHook = nextWorkInProgressHook, currentHook = nextCurrentHook;
      else {
        if (nextCurrentHook === null) {
          if (currentlyRenderingFiber.alternate === null)
            throw Error(formatProdErrorMessage(467));
          throw Error(formatProdErrorMessage(310));
        }
        currentHook = nextCurrentHook;
        nextCurrentHook = {
          memoizedState: currentHook.memoizedState,
          baseState: currentHook.baseState,
          baseQueue: currentHook.baseQueue,
          queue: currentHook.queue,
          next: null
        };
        workInProgressHook === null ? currentlyRenderingFiber.memoizedState = workInProgressHook = nextCurrentHook : workInProgressHook = workInProgressHook.next = nextCurrentHook;
      }
      return workInProgressHook;
    }
    function createFunctionComponentUpdateQueue() {
      return { lastEffect: null, events: null, stores: null, memoCache: null };
    }
    function useThenable(thenable) {
      var index = thenableIndexCounter;
      thenableIndexCounter += 1;
      thenableState === null && (thenableState = []);
      thenable = trackUsedThenable(thenableState, thenable, index);
      index = currentlyRenderingFiber;
      (workInProgressHook === null ? index.memoizedState : workInProgressHook.next) === null && (index = index.alternate, ReactSharedInternals2.H = index === null || index.memoizedState === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate);
      return thenable;
    }
    function use(usable) {
      if (usable !== null && typeof usable === "object") {
        if (typeof usable.then === "function")
          return useThenable(usable);
        if (usable.$$typeof === REACT_CONTEXT_TYPE2)
          return readContext(usable);
      }
      throw Error(formatProdErrorMessage(438, String(usable)));
    }
    function useMemoCache(size) {
      var memoCache = null, updateQueue = currentlyRenderingFiber.updateQueue;
      updateQueue !== null && (memoCache = updateQueue.memoCache);
      if (memoCache == null) {
        var current = currentlyRenderingFiber.alternate;
        current !== null && (current = current.updateQueue, current !== null && (current = current.memoCache, current != null && (memoCache = {
          data: current.data.map(function(array) {
            return array.slice();
          }),
          index: 0
        })));
      }
      memoCache == null && (memoCache = { data: [], index: 0 });
      updateQueue === null && (updateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = updateQueue);
      updateQueue.memoCache = memoCache;
      updateQueue = memoCache.data[memoCache.index];
      if (updateQueue === undefined)
        for (updateQueue = memoCache.data[memoCache.index] = Array(size), current = 0;current < size; current++)
          updateQueue[current] = REACT_MEMO_CACHE_SENTINEL;
      memoCache.index++;
      return updateQueue;
    }
    function basicStateReducer(state, action) {
      return typeof action === "function" ? action(state) : action;
    }
    function updateReducer(reducer) {
      var hook = updateWorkInProgressHook();
      return updateReducerImpl(hook, currentHook, reducer);
    }
    function updateReducerImpl(hook, current, reducer) {
      var queue = hook.queue;
      if (queue === null)
        throw Error(formatProdErrorMessage(311));
      queue.lastRenderedReducer = reducer;
      var baseQueue = hook.baseQueue, pendingQueue = queue.pending;
      if (pendingQueue !== null) {
        if (baseQueue !== null) {
          var baseFirst = baseQueue.next;
          baseQueue.next = pendingQueue.next;
          pendingQueue.next = baseFirst;
        }
        current.baseQueue = baseQueue = pendingQueue;
        queue.pending = null;
      }
      pendingQueue = hook.baseState;
      if (baseQueue === null)
        hook.memoizedState = pendingQueue;
      else {
        current = baseQueue.next;
        var newBaseQueueFirst = baseFirst = null, newBaseQueueLast = null, update = current, didReadFromEntangledAsyncAction$51 = false;
        do {
          var updateLane = update.lane & -536870913;
          if (updateLane !== update.lane ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes & updateLane) === updateLane) {
            var revertLane = update.revertLane;
            if (revertLane === 0)
              newBaseQueueLast !== null && (newBaseQueueLast = newBaseQueueLast.next = {
                lane: 0,
                revertLane: 0,
                gesture: null,
                action: update.action,
                hasEagerState: update.hasEagerState,
                eagerState: update.eagerState,
                next: null
              }), updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction$51 = true);
            else if ((renderLanes & revertLane) === revertLane) {
              update = update.next;
              revertLane === currentEntangledLane && (didReadFromEntangledAsyncAction$51 = true);
              continue;
            } else
              updateLane = {
                lane: 0,
                revertLane: update.revertLane,
                gesture: null,
                action: update.action,
                hasEagerState: update.hasEagerState,
                eagerState: update.eagerState,
                next: null
              }, newBaseQueueLast === null ? (newBaseQueueFirst = newBaseQueueLast = updateLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = updateLane, currentlyRenderingFiber.lanes |= revertLane, workInProgressRootSkippedLanes |= revertLane;
            updateLane = update.action;
            shouldDoubleInvokeUserFnsInHooksDEV && reducer(pendingQueue, updateLane);
            pendingQueue = update.hasEagerState ? update.eagerState : reducer(pendingQueue, updateLane);
          } else
            revertLane = {
              lane: updateLane,
              revertLane: update.revertLane,
              gesture: update.gesture,
              action: update.action,
              hasEagerState: update.hasEagerState,
              eagerState: update.eagerState,
              next: null
            }, newBaseQueueLast === null ? (newBaseQueueFirst = newBaseQueueLast = revertLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = revertLane, currentlyRenderingFiber.lanes |= updateLane, workInProgressRootSkippedLanes |= updateLane;
          update = update.next;
        } while (update !== null && update !== current);
        newBaseQueueLast === null ? baseFirst = pendingQueue : newBaseQueueLast.next = newBaseQueueFirst;
        if (!objectIs(pendingQueue, hook.memoizedState) && (didReceiveUpdate = true, didReadFromEntangledAsyncAction$51 && (reducer = currentEntangledActionThenable, reducer !== null)))
          throw reducer;
        hook.memoizedState = pendingQueue;
        hook.baseState = baseFirst;
        hook.baseQueue = newBaseQueueLast;
        queue.lastRenderedState = pendingQueue;
      }
      baseQueue === null && (queue.lanes = 0);
      return [hook.memoizedState, queue.dispatch];
    }
    function rerenderReducer(reducer) {
      var hook = updateWorkInProgressHook(), queue = hook.queue;
      if (queue === null)
        throw Error(formatProdErrorMessage(311));
      queue.lastRenderedReducer = reducer;
      var { dispatch, pending: lastRenderPhaseUpdate } = queue, newState = hook.memoizedState;
      if (lastRenderPhaseUpdate !== null) {
        queue.pending = null;
        var update = lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
        do
          newState = reducer(newState, update.action), update = update.next;
        while (update !== lastRenderPhaseUpdate);
        objectIs(newState, hook.memoizedState) || (didReceiveUpdate = true);
        hook.memoizedState = newState;
        hook.baseQueue === null && (hook.baseState = newState);
        queue.lastRenderedState = newState;
      }
      return [newState, dispatch];
    }
    function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
      var fiber = currentlyRenderingFiber, hook = updateWorkInProgressHook(), isHydrating$jscomp$0 = isHydrating;
      if (isHydrating$jscomp$0) {
        if (getServerSnapshot === undefined)
          throw Error(formatProdErrorMessage(407));
        getServerSnapshot = getServerSnapshot();
      } else
        getServerSnapshot = getSnapshot();
      var snapshotChanged = !objectIs((currentHook || hook).memoizedState, getServerSnapshot);
      snapshotChanged && (hook.memoizedState = getServerSnapshot, didReceiveUpdate = true);
      hook = hook.queue;
      updateEffect(subscribeToStore.bind(null, fiber, hook, subscribe), [
        subscribe
      ]);
      if (hook.getSnapshot !== getSnapshot || snapshotChanged || workInProgressHook !== null && workInProgressHook.memoizedState.tag & 1) {
        fiber.flags |= 2048;
        pushSimpleEffect(9, { destroy: undefined }, updateStoreInstance.bind(null, fiber, hook, getServerSnapshot, getSnapshot), null);
        if (workInProgressRoot === null)
          throw Error(formatProdErrorMessage(349));
        isHydrating$jscomp$0 || (renderLanes & 127) !== 0 || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
      }
      return getServerSnapshot;
    }
    function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
      fiber.flags |= 16384;
      fiber = { getSnapshot, value: renderedSnapshot };
      getSnapshot = currentlyRenderingFiber.updateQueue;
      getSnapshot === null ? (getSnapshot = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = getSnapshot, getSnapshot.stores = [fiber]) : (renderedSnapshot = getSnapshot.stores, renderedSnapshot === null ? getSnapshot.stores = [fiber] : renderedSnapshot.push(fiber));
    }
    function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
      inst.value = nextSnapshot;
      inst.getSnapshot = getSnapshot;
      checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
    }
    function subscribeToStore(fiber, inst, subscribe) {
      return subscribe(function() {
        checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
      });
    }
    function checkIfSnapshotChanged(inst) {
      var latestGetSnapshot = inst.getSnapshot;
      inst = inst.value;
      try {
        var nextValue = latestGetSnapshot();
        return !objectIs(inst, nextValue);
      } catch (error) {
        return true;
      }
    }
    function forceStoreRerender(fiber) {
      var root = enqueueConcurrentRenderForLane(fiber, 2);
      root !== null && scheduleUpdateOnFiber(root, fiber, 2);
    }
    function mountStateImpl(initialState) {
      var hook = mountWorkInProgressHook();
      if (typeof initialState === "function") {
        var initialStateInitializer = initialState;
        initialState = initialStateInitializer();
        if (shouldDoubleInvokeUserFnsInHooksDEV) {
          setIsStrictModeForDevtools(true);
          try {
            initialStateInitializer();
          } finally {
            setIsStrictModeForDevtools(false);
          }
        }
      }
      hook.memoizedState = hook.baseState = initialState;
      hook.queue = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: initialState
      };
      return hook;
    }
    function updateOptimisticImpl(hook, current, passthrough, reducer) {
      hook.baseState = passthrough;
      return updateReducerImpl(hook, currentHook, typeof reducer === "function" ? reducer : basicStateReducer);
    }
    function dispatchActionState(fiber, actionQueue, setPendingState, setState, payload) {
      if (isRenderPhaseUpdate(fiber))
        throw Error(formatProdErrorMessage(485));
      fiber = actionQueue.action;
      if (fiber !== null) {
        var actionNode = {
          payload,
          action: fiber,
          next: null,
          isTransition: true,
          status: "pending",
          value: null,
          reason: null,
          listeners: [],
          then: function(listener) {
            actionNode.listeners.push(listener);
          }
        };
        ReactSharedInternals2.T !== null ? setPendingState(true) : actionNode.isTransition = false;
        setState(actionNode);
        setPendingState = actionQueue.pending;
        setPendingState === null ? (actionNode.next = actionQueue.pending = actionNode, runActionStateAction(actionQueue, actionNode)) : (actionNode.next = setPendingState.next, actionQueue.pending = setPendingState.next = actionNode);
      }
    }
    function runActionStateAction(actionQueue, node) {
      var { action, payload } = node, prevState = actionQueue.state;
      if (node.isTransition) {
        var prevTransition = ReactSharedInternals2.T, currentTransition = {};
        ReactSharedInternals2.T = currentTransition;
        try {
          var returnValue = action(prevState, payload), onStartTransitionFinish = ReactSharedInternals2.S;
          onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue);
          handleActionReturnValue(actionQueue, node, returnValue);
        } catch (error) {
          onActionError(actionQueue, node, error);
        } finally {
          prevTransition !== null && currentTransition.types !== null && (prevTransition.types = currentTransition.types), ReactSharedInternals2.T = prevTransition;
        }
      } else
        try {
          prevTransition = action(prevState, payload), handleActionReturnValue(actionQueue, node, prevTransition);
        } catch (error$55) {
          onActionError(actionQueue, node, error$55);
        }
    }
    function handleActionReturnValue(actionQueue, node, returnValue) {
      returnValue !== null && typeof returnValue === "object" && typeof returnValue.then === "function" ? returnValue.then(function(nextState) {
        onActionSuccess(actionQueue, node, nextState);
      }, function(error) {
        return onActionError(actionQueue, node, error);
      }) : onActionSuccess(actionQueue, node, returnValue);
    }
    function onActionSuccess(actionQueue, actionNode, nextState) {
      actionNode.status = "fulfilled";
      actionNode.value = nextState;
      notifyActionListeners(actionNode);
      actionQueue.state = nextState;
      actionNode = actionQueue.pending;
      actionNode !== null && (nextState = actionNode.next, nextState === actionNode ? actionQueue.pending = null : (nextState = nextState.next, actionNode.next = nextState, runActionStateAction(actionQueue, nextState)));
    }
    function onActionError(actionQueue, actionNode, error) {
      var last = actionQueue.pending;
      actionQueue.pending = null;
      if (last !== null) {
        last = last.next;
        do
          actionNode.status = "rejected", actionNode.reason = error, notifyActionListeners(actionNode), actionNode = actionNode.next;
        while (actionNode !== last);
      }
      actionQueue.action = null;
    }
    function notifyActionListeners(actionNode) {
      actionNode = actionNode.listeners;
      for (var i = 0;i < actionNode.length; i++)
        (0, actionNode[i])();
    }
    function actionStateReducer(oldState, newState) {
      return newState;
    }
    function mountActionState(action, initialStateProp) {
      if (isHydrating) {
        var ssrFormState = workInProgressRoot.formState;
        if (ssrFormState !== null) {
          a: {
            var JSCompiler_inline_result = currentlyRenderingFiber;
            if (isHydrating) {
              if (nextHydratableInstance) {
                var markerInstance = canHydrateFormStateMarker(nextHydratableInstance, rootOrSingletonContext);
                if (markerInstance) {
                  nextHydratableInstance = getNextHydratableSibling(markerInstance);
                  JSCompiler_inline_result = isFormStateMarkerMatching(markerInstance);
                  break a;
                }
              }
              throwOnHydrationMismatch(JSCompiler_inline_result);
            }
            JSCompiler_inline_result = false;
          }
          JSCompiler_inline_result && (initialStateProp = ssrFormState[0]);
        }
      }
      ssrFormState = mountWorkInProgressHook();
      ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp;
      JSCompiler_inline_result = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: actionStateReducer,
        lastRenderedState: initialStateProp
      };
      ssrFormState.queue = JSCompiler_inline_result;
      ssrFormState = dispatchSetState.bind(null, currentlyRenderingFiber, JSCompiler_inline_result);
      JSCompiler_inline_result.dispatch = ssrFormState;
      JSCompiler_inline_result = mountStateImpl(false);
      var setPendingState = dispatchOptimisticSetState.bind(null, currentlyRenderingFiber, false, JSCompiler_inline_result.queue);
      JSCompiler_inline_result = mountWorkInProgressHook();
      markerInstance = {
        state: initialStateProp,
        dispatch: null,
        action,
        pending: null
      };
      JSCompiler_inline_result.queue = markerInstance;
      ssrFormState = dispatchActionState.bind(null, currentlyRenderingFiber, markerInstance, setPendingState, ssrFormState);
      markerInstance.dispatch = ssrFormState;
      JSCompiler_inline_result.memoizedState = action;
      return [initialStateProp, ssrFormState, false];
    }
    function updateActionState(action) {
      var stateHook = updateWorkInProgressHook();
      return updateActionStateImpl(stateHook, currentHook, action);
    }
    function updateActionStateImpl(stateHook, currentStateHook, action) {
      currentStateHook = updateReducerImpl(stateHook, currentStateHook, actionStateReducer)[0];
      stateHook = updateReducer(basicStateReducer)[0];
      if (typeof currentStateHook === "object" && currentStateHook !== null && typeof currentStateHook.then === "function")
        try {
          var state = useThenable(currentStateHook);
        } catch (x) {
          if (x === SuspenseException)
            throw SuspenseActionException;
          throw x;
        }
      else
        state = currentStateHook;
      currentStateHook = updateWorkInProgressHook();
      var actionQueue = currentStateHook.queue, dispatch = actionQueue.dispatch;
      action !== currentStateHook.memoizedState && (currentlyRenderingFiber.flags |= 2048, pushSimpleEffect(9, { destroy: undefined }, actionStateActionEffect.bind(null, actionQueue, action), null));
      return [state, dispatch, stateHook];
    }
    function actionStateActionEffect(actionQueue, action) {
      actionQueue.action = action;
    }
    function rerenderActionState(action) {
      var stateHook = updateWorkInProgressHook(), currentStateHook = currentHook;
      if (currentStateHook !== null)
        return updateActionStateImpl(stateHook, currentStateHook, action);
      updateWorkInProgressHook();
      stateHook = stateHook.memoizedState;
      currentStateHook = updateWorkInProgressHook();
      var dispatch = currentStateHook.queue.dispatch;
      currentStateHook.memoizedState = action;
      return [stateHook, dispatch, false];
    }
    function pushSimpleEffect(tag, inst, create, deps) {
      tag = { tag, create, deps, inst, next: null };
      inst = currentlyRenderingFiber.updateQueue;
      inst === null && (inst = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = inst);
      create = inst.lastEffect;
      create === null ? inst.lastEffect = tag.next = tag : (deps = create.next, create.next = tag, tag.next = deps, inst.lastEffect = tag);
      return tag;
    }
    function updateRef() {
      return updateWorkInProgressHook().memoizedState;
    }
    function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
      var hook = mountWorkInProgressHook();
      currentlyRenderingFiber.flags |= fiberFlags;
      hook.memoizedState = pushSimpleEffect(1 | hookFlags, { destroy: undefined }, create, deps === undefined ? null : deps);
    }
    function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
      var hook = updateWorkInProgressHook();
      deps = deps === undefined ? null : deps;
      var inst = hook.memoizedState.inst;
      currentHook !== null && deps !== null && areHookInputsEqual(deps, currentHook.memoizedState.deps) ? hook.memoizedState = pushSimpleEffect(hookFlags, inst, create, deps) : (currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(1 | hookFlags, inst, create, deps));
    }
    function mountEffect(create, deps) {
      mountEffectImpl(8390656, 8, create, deps);
    }
    function updateEffect(create, deps) {
      updateEffectImpl(2048, 8, create, deps);
    }
    function useEffectEventImpl(payload) {
      currentlyRenderingFiber.flags |= 4;
      var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
      if (componentUpdateQueue === null)
        componentUpdateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = componentUpdateQueue, componentUpdateQueue.events = [payload];
      else {
        var events = componentUpdateQueue.events;
        events === null ? componentUpdateQueue.events = [payload] : events.push(payload);
      }
    }
    function updateEvent(callback) {
      var ref = updateWorkInProgressHook().memoizedState;
      useEffectEventImpl({ ref, nextImpl: callback });
      return function() {
        if ((executionContext & 2) !== 0)
          throw Error(formatProdErrorMessage(440));
        return ref.impl.apply(undefined, arguments);
      };
    }
    function updateInsertionEffect(create, deps) {
      return updateEffectImpl(4, 2, create, deps);
    }
    function updateLayoutEffect(create, deps) {
      return updateEffectImpl(4, 4, create, deps);
    }
    function imperativeHandleEffect(create, ref) {
      if (typeof ref === "function") {
        create = create();
        var refCleanup = ref(create);
        return function() {
          typeof refCleanup === "function" ? refCleanup() : ref(null);
        };
      }
      if (ref !== null && ref !== undefined)
        return create = create(), ref.current = create, function() {
          ref.current = null;
        };
    }
    function updateImperativeHandle(ref, create, deps) {
      deps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
      updateEffectImpl(4, 4, imperativeHandleEffect.bind(null, create, ref), deps);
    }
    function mountDebugValue() {}
    function updateCallback(callback, deps) {
      var hook = updateWorkInProgressHook();
      deps = deps === undefined ? null : deps;
      var prevState = hook.memoizedState;
      if (deps !== null && areHookInputsEqual(deps, prevState[1]))
        return prevState[0];
      hook.memoizedState = [callback, deps];
      return callback;
    }
    function updateMemo(nextCreate, deps) {
      var hook = updateWorkInProgressHook();
      deps = deps === undefined ? null : deps;
      var prevState = hook.memoizedState;
      if (deps !== null && areHookInputsEqual(deps, prevState[1]))
        return prevState[0];
      prevState = nextCreate();
      if (shouldDoubleInvokeUserFnsInHooksDEV) {
        setIsStrictModeForDevtools(true);
        try {
          nextCreate();
        } finally {
          setIsStrictModeForDevtools(false);
        }
      }
      hook.memoizedState = [prevState, deps];
      return prevState;
    }
    function mountDeferredValueImpl(hook, value, initialValue) {
      if (initialValue === undefined || (renderLanes & 1073741824) !== 0 && (workInProgressRootRenderLanes & 261930) === 0)
        return hook.memoizedState = value;
      hook.memoizedState = initialValue;
      hook = requestDeferredLane();
      currentlyRenderingFiber.lanes |= hook;
      workInProgressRootSkippedLanes |= hook;
      return initialValue;
    }
    function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
      if (objectIs(value, prevValue))
        return value;
      if (currentTreeHiddenStackCursor.current !== null)
        return hook = mountDeferredValueImpl(hook, value, initialValue), objectIs(hook, prevValue) || (didReceiveUpdate = true), hook;
      if ((renderLanes & 42) === 0 || (renderLanes & 1073741824) !== 0 && (workInProgressRootRenderLanes & 261930) === 0)
        return didReceiveUpdate = true, hook.memoizedState = value;
      hook = requestDeferredLane();
      currentlyRenderingFiber.lanes |= hook;
      workInProgressRootSkippedLanes |= hook;
      return prevValue;
    }
    function startTransition(fiber, queue, pendingState, finishedState, callback) {
      var previousPriority = getCurrentUpdatePriority();
      setCurrentUpdatePriority(previousPriority !== 0 && 8 > previousPriority ? previousPriority : 8);
      var prevTransition = ReactSharedInternals2.T, currentTransition = {};
      ReactSharedInternals2.T = currentTransition;
      dispatchOptimisticSetState(fiber, false, queue, pendingState);
      try {
        var returnValue = callback(), onStartTransitionFinish = ReactSharedInternals2.S;
        onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue);
        if (returnValue !== null && typeof returnValue === "object" && typeof returnValue.then === "function") {
          var thenableForFinishedState = chainThenableValue(returnValue, finishedState);
          dispatchSetStateInternal(fiber, queue, thenableForFinishedState, requestUpdateLane(fiber));
        } else
          dispatchSetStateInternal(fiber, queue, finishedState, requestUpdateLane(fiber));
      } catch (error) {
        dispatchSetStateInternal(fiber, queue, { then: function() {}, status: "rejected", reason: error }, requestUpdateLane());
      } finally {
        setCurrentUpdatePriority(previousPriority), prevTransition !== null && currentTransition.types !== null && (prevTransition.types = currentTransition.types), ReactSharedInternals2.T = prevTransition;
      }
    }
    function ensureFormComponentIsStateful(formFiber) {
      var existingStateHook = formFiber.memoizedState;
      if (existingStateHook !== null)
        return existingStateHook;
      existingStateHook = {
        memoizedState: NotPendingTransition,
        baseState: NotPendingTransition,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: basicStateReducer,
          lastRenderedState: NotPendingTransition
        },
        next: null
      };
      var initialResetState = {};
      existingStateHook.next = {
        memoizedState: initialResetState,
        baseState: initialResetState,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: basicStateReducer,
          lastRenderedState: initialResetState
        },
        next: null
      };
      formFiber.memoizedState = existingStateHook;
      formFiber = formFiber.alternate;
      formFiber !== null && (formFiber.memoizedState = existingStateHook);
      return existingStateHook;
    }
    function useHostTransitionStatus() {
      return readContext(HostTransitionContext);
    }
    function updateId() {
      return updateWorkInProgressHook().memoizedState;
    }
    function updateRefresh() {
      return updateWorkInProgressHook().memoizedState;
    }
    function refreshCache(fiber) {
      for (var provider = fiber.return;provider !== null; ) {
        switch (provider.tag) {
          case 24:
          case 3:
            var lane = requestUpdateLane();
            fiber = createUpdate(lane);
            var root = enqueueUpdate(provider, fiber, lane);
            root !== null && (scheduleUpdateOnFiber(root, provider, lane), entangleTransitions(root, provider, lane));
            provider = { cache: createCache() };
            fiber.payload = provider;
            return;
        }
        provider = provider.return;
      }
    }
    function dispatchReducerAction(fiber, queue, action) {
      var lane = requestUpdateLane();
      action = {
        lane,
        revertLane: 0,
        gesture: null,
        action,
        hasEagerState: false,
        eagerState: null,
        next: null
      };
      isRenderPhaseUpdate(fiber) ? enqueueRenderPhaseUpdate(queue, action) : (action = enqueueConcurrentHookUpdate(fiber, queue, action, lane), action !== null && (scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane)));
    }
    function dispatchSetState(fiber, queue, action) {
      var lane = requestUpdateLane();
      dispatchSetStateInternal(fiber, queue, action, lane);
    }
    function dispatchSetStateInternal(fiber, queue, action, lane) {
      var update = {
        lane,
        revertLane: 0,
        gesture: null,
        action,
        hasEagerState: false,
        eagerState: null,
        next: null
      };
      if (isRenderPhaseUpdate(fiber))
        enqueueRenderPhaseUpdate(queue, update);
      else {
        var alternate = fiber.alternate;
        if (fiber.lanes === 0 && (alternate === null || alternate.lanes === 0) && (alternate = queue.lastRenderedReducer, alternate !== null))
          try {
            var currentState = queue.lastRenderedState, eagerState = alternate(currentState, action);
            update.hasEagerState = true;
            update.eagerState = eagerState;
            if (objectIs(eagerState, currentState))
              return enqueueUpdate$1(fiber, queue, update, 0), workInProgressRoot === null && finishQueueingConcurrentUpdates(), false;
          } catch (error) {} finally {}
        action = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
        if (action !== null)
          return scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane), true;
      }
      return false;
    }
    function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
      action = {
        lane: 2,
        revertLane: requestTransitionLane(),
        gesture: null,
        action,
        hasEagerState: false,
        eagerState: null,
        next: null
      };
      if (isRenderPhaseUpdate(fiber)) {
        if (throwIfDuringRender)
          throw Error(formatProdErrorMessage(479));
      } else
        throwIfDuringRender = enqueueConcurrentHookUpdate(fiber, queue, action, 2), throwIfDuringRender !== null && scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2);
    }
    function isRenderPhaseUpdate(fiber) {
      var alternate = fiber.alternate;
      return fiber === currentlyRenderingFiber || alternate !== null && alternate === currentlyRenderingFiber;
    }
    function enqueueRenderPhaseUpdate(queue, update) {
      didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
      var pending = queue.pending;
      pending === null ? update.next = update : (update.next = pending.next, pending.next = update);
      queue.pending = update;
    }
    function entangleTransitionUpdate(root, queue, lane) {
      if ((lane & 4194048) !== 0) {
        var queueLanes = queue.lanes;
        queueLanes &= root.pendingLanes;
        lane |= queueLanes;
        queue.lanes = lane;
        markRootEntangled(root, lane);
      }
    }
    function applyDerivedStateFromProps(workInProgress2, ctor, getDerivedStateFromProps, nextProps) {
      ctor = workInProgress2.memoizedState;
      getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor);
      getDerivedStateFromProps = getDerivedStateFromProps === null || getDerivedStateFromProps === undefined ? ctor : assign2({}, ctor, getDerivedStateFromProps);
      workInProgress2.memoizedState = getDerivedStateFromProps;
      workInProgress2.lanes === 0 && (workInProgress2.updateQueue.baseState = getDerivedStateFromProps);
    }
    function checkShouldComponentUpdate(workInProgress2, ctor, oldProps, newProps, oldState, newState, nextContext) {
      workInProgress2 = workInProgress2.stateNode;
      return typeof workInProgress2.shouldComponentUpdate === "function" ? workInProgress2.shouldComponentUpdate(newProps, newState, nextContext) : ctor.prototype && ctor.prototype.isPureReactComponent ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState) : true;
    }
    function callComponentWillReceiveProps(workInProgress2, instance, newProps, nextContext) {
      workInProgress2 = instance.state;
      typeof instance.componentWillReceiveProps === "function" && instance.componentWillReceiveProps(newProps, nextContext);
      typeof instance.UNSAFE_componentWillReceiveProps === "function" && instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
      instance.state !== workInProgress2 && classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
    }
    function resolveClassComponentProps(Component2, baseProps) {
      var newProps = baseProps;
      if ("ref" in baseProps) {
        newProps = {};
        for (var propName in baseProps)
          propName !== "ref" && (newProps[propName] = baseProps[propName]);
      }
      if (Component2 = Component2.defaultProps) {
        newProps === baseProps && (newProps = assign2({}, newProps));
        for (var propName$57 in Component2)
          newProps[propName$57] === undefined && (newProps[propName$57] = Component2[propName$57]);
      }
      return newProps;
    }
    function logUncaughtError(root, errorInfo) {
      try {
        var onUncaughtError = root.onUncaughtError;
        onUncaughtError(errorInfo.value, { componentStack: errorInfo.stack });
      } catch (e) {
        setTimeout(function() {
          throw e;
        });
      }
    }
    function logCaughtError(root, boundary, errorInfo) {
      try {
        var onCaughtError = root.onCaughtError;
        onCaughtError(errorInfo.value, {
          componentStack: errorInfo.stack,
          errorBoundary: boundary.tag === 1 ? boundary.stateNode : null
        });
      } catch (e) {
        setTimeout(function() {
          throw e;
        });
      }
    }
    function createRootErrorUpdate(root, errorInfo, lane) {
      lane = createUpdate(lane);
      lane.tag = 3;
      lane.payload = { element: null };
      lane.callback = function() {
        logUncaughtError(root, errorInfo);
      };
      return lane;
    }
    function createClassErrorUpdate(lane) {
      lane = createUpdate(lane);
      lane.tag = 3;
      return lane;
    }
    function initializeClassErrorUpdate(update, root, fiber, errorInfo) {
      var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
      if (typeof getDerivedStateFromError === "function") {
        var error = errorInfo.value;
        update.payload = function() {
          return getDerivedStateFromError(error);
        };
        update.callback = function() {
          logCaughtError(root, fiber, errorInfo);
        };
      }
      var inst = fiber.stateNode;
      inst !== null && typeof inst.componentDidCatch === "function" && (update.callback = function() {
        logCaughtError(root, fiber, errorInfo);
        typeof getDerivedStateFromError !== "function" && (legacyErrorBoundariesThatAlreadyFailed === null ? legacyErrorBoundariesThatAlreadyFailed = new Set([this]) : legacyErrorBoundariesThatAlreadyFailed.add(this));
        var stack = errorInfo.stack;
        this.componentDidCatch(errorInfo.value, {
          componentStack: stack !== null ? stack : ""
        });
      });
    }
    function throwException(root, returnFiber, sourceFiber, value, rootRenderLanes) {
      sourceFiber.flags |= 32768;
      if (value !== null && typeof value === "object" && typeof value.then === "function") {
        returnFiber = sourceFiber.alternate;
        returnFiber !== null && propagateParentContextChanges(returnFiber, sourceFiber, rootRenderLanes, true);
        sourceFiber = suspenseHandlerStackCursor.current;
        if (sourceFiber !== null) {
          switch (sourceFiber.tag) {
            case 31:
            case 13:
              return shellBoundary === null ? renderDidSuspendDelayIfPossible() : sourceFiber.alternate === null && workInProgressRootExitStatus === 0 && (workInProgressRootExitStatus = 3), sourceFiber.flags &= -257, sourceFiber.flags |= 65536, sourceFiber.lanes = rootRenderLanes, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, returnFiber === null ? sourceFiber.updateQueue = new Set([value]) : returnFiber.add(value), attachPingListener(root, value, rootRenderLanes)), false;
            case 22:
              return sourceFiber.flags |= 65536, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, returnFiber === null ? (returnFiber = {
                transitions: null,
                markerInstances: null,
                retryQueue: new Set([value])
              }, sourceFiber.updateQueue = returnFiber) : (sourceFiber = returnFiber.retryQueue, sourceFiber === null ? returnFiber.retryQueue = new Set([value]) : sourceFiber.add(value)), attachPingListener(root, value, rootRenderLanes)), false;
          }
          throw Error(formatProdErrorMessage(435, sourceFiber.tag));
        }
        attachPingListener(root, value, rootRenderLanes);
        renderDidSuspendDelayIfPossible();
        return false;
      }
      if (isHydrating)
        return returnFiber = suspenseHandlerStackCursor.current, returnFiber !== null ? ((returnFiber.flags & 65536) === 0 && (returnFiber.flags |= 256), returnFiber.flags |= 65536, returnFiber.lanes = rootRenderLanes, value !== HydrationMismatchException && (root = Error(formatProdErrorMessage(422), { cause: value }), queueHydrationError(createCapturedValueAtFiber(root, sourceFiber)))) : (value !== HydrationMismatchException && (returnFiber = Error(formatProdErrorMessage(423), {
          cause: value
        }), queueHydrationError(createCapturedValueAtFiber(returnFiber, sourceFiber))), root = root.current.alternate, root.flags |= 65536, rootRenderLanes &= -rootRenderLanes, root.lanes |= rootRenderLanes, value = createCapturedValueAtFiber(value, sourceFiber), rootRenderLanes = createRootErrorUpdate(root.stateNode, value, rootRenderLanes), enqueueCapturedUpdate(root, rootRenderLanes), workInProgressRootExitStatus !== 4 && (workInProgressRootExitStatus = 2)), false;
      var wrapperError = Error(formatProdErrorMessage(520), { cause: value });
      wrapperError = createCapturedValueAtFiber(wrapperError, sourceFiber);
      workInProgressRootConcurrentErrors === null ? workInProgressRootConcurrentErrors = [wrapperError] : workInProgressRootConcurrentErrors.push(wrapperError);
      workInProgressRootExitStatus !== 4 && (workInProgressRootExitStatus = 2);
      if (returnFiber === null)
        return true;
      value = createCapturedValueAtFiber(value, sourceFiber);
      sourceFiber = returnFiber;
      do {
        switch (sourceFiber.tag) {
          case 3:
            return sourceFiber.flags |= 65536, root = rootRenderLanes & -rootRenderLanes, sourceFiber.lanes |= root, root = createRootErrorUpdate(sourceFiber.stateNode, value, root), enqueueCapturedUpdate(sourceFiber, root), false;
          case 1:
            if (returnFiber = sourceFiber.type, wrapperError = sourceFiber.stateNode, (sourceFiber.flags & 128) === 0 && (typeof returnFiber.getDerivedStateFromError === "function" || wrapperError !== null && typeof wrapperError.componentDidCatch === "function" && (legacyErrorBoundariesThatAlreadyFailed === null || !legacyErrorBoundariesThatAlreadyFailed.has(wrapperError))))
              return sourceFiber.flags |= 65536, rootRenderLanes &= -rootRenderLanes, sourceFiber.lanes |= rootRenderLanes, rootRenderLanes = createClassErrorUpdate(rootRenderLanes), initializeClassErrorUpdate(rootRenderLanes, root, sourceFiber, value), enqueueCapturedUpdate(sourceFiber, rootRenderLanes), false;
        }
        sourceFiber = sourceFiber.return;
      } while (sourceFiber !== null);
      return false;
    }
    function reconcileChildren(current, workInProgress2, nextChildren, renderLanes2) {
      workInProgress2.child = current === null ? mountChildFibers(workInProgress2, null, nextChildren, renderLanes2) : reconcileChildFibers(workInProgress2, current.child, nextChildren, renderLanes2);
    }
    function updateForwardRef(current, workInProgress2, Component2, nextProps, renderLanes2) {
      Component2 = Component2.render;
      var ref = workInProgress2.ref;
      if ("ref" in nextProps) {
        var propsWithoutRef = {};
        for (var key in nextProps)
          key !== "ref" && (propsWithoutRef[key] = nextProps[key]);
      } else
        propsWithoutRef = nextProps;
      prepareToReadContext(workInProgress2);
      nextProps = renderWithHooks(current, workInProgress2, Component2, propsWithoutRef, ref, renderLanes2);
      key = checkDidRenderIdHook();
      if (current !== null && !didReceiveUpdate)
        return bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
      isHydrating && key && pushMaterializedTreeId(workInProgress2);
      workInProgress2.flags |= 1;
      reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
      return workInProgress2.child;
    }
    function updateMemoComponent(current, workInProgress2, Component2, nextProps, renderLanes2) {
      if (current === null) {
        var type = Component2.type;
        if (typeof type === "function" && !shouldConstruct(type) && type.defaultProps === undefined && Component2.compare === null)
          return workInProgress2.tag = 15, workInProgress2.type = type, updateSimpleMemoComponent(current, workInProgress2, type, nextProps, renderLanes2);
        current = createFiberFromTypeAndProps(Component2.type, null, nextProps, workInProgress2, workInProgress2.mode, renderLanes2);
        current.ref = workInProgress2.ref;
        current.return = workInProgress2;
        return workInProgress2.child = current;
      }
      type = current.child;
      if (!checkScheduledUpdateOrContext(current, renderLanes2)) {
        var prevProps = type.memoizedProps;
        Component2 = Component2.compare;
        Component2 = Component2 !== null ? Component2 : shallowEqual;
        if (Component2(prevProps, nextProps) && current.ref === workInProgress2.ref)
          return bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
      }
      workInProgress2.flags |= 1;
      current = createWorkInProgress(type, nextProps);
      current.ref = workInProgress2.ref;
      current.return = workInProgress2;
      return workInProgress2.child = current;
    }
    function updateSimpleMemoComponent(current, workInProgress2, Component2, nextProps, renderLanes2) {
      if (current !== null) {
        var prevProps = current.memoizedProps;
        if (shallowEqual(prevProps, nextProps) && current.ref === workInProgress2.ref)
          if (didReceiveUpdate = false, workInProgress2.pendingProps = nextProps = prevProps, checkScheduledUpdateOrContext(current, renderLanes2))
            (current.flags & 131072) !== 0 && (didReceiveUpdate = true);
          else
            return workInProgress2.lanes = current.lanes, bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
      }
      return updateFunctionComponent(current, workInProgress2, Component2, nextProps, renderLanes2);
    }
    function updateOffscreenComponent(current, workInProgress2, renderLanes2, nextProps) {
      var nextChildren = nextProps.children, prevState = current !== null ? current.memoizedState : null;
      current === null && workInProgress2.stateNode === null && (workInProgress2.stateNode = {
        _visibility: 1,
        _pendingMarkers: null,
        _retryCache: null,
        _transitions: null
      });
      if (nextProps.mode === "hidden") {
        if ((workInProgress2.flags & 128) !== 0) {
          prevState = prevState !== null ? prevState.baseLanes | renderLanes2 : renderLanes2;
          if (current !== null) {
            nextProps = workInProgress2.child = current.child;
            for (nextChildren = 0;nextProps !== null; )
              nextChildren = nextChildren | nextProps.lanes | nextProps.childLanes, nextProps = nextProps.sibling;
            nextProps = nextChildren & ~prevState;
          } else
            nextProps = 0, workInProgress2.child = null;
          return deferHiddenOffscreenComponent(current, workInProgress2, prevState, renderLanes2, nextProps);
        }
        if ((renderLanes2 & 536870912) !== 0)
          workInProgress2.memoizedState = { baseLanes: 0, cachePool: null }, current !== null && pushTransition(workInProgress2, prevState !== null ? prevState.cachePool : null), prevState !== null ? pushHiddenContext(workInProgress2, prevState) : reuseHiddenContextOnStack(), pushOffscreenSuspenseHandler(workInProgress2);
        else
          return nextProps = workInProgress2.lanes = 536870912, deferHiddenOffscreenComponent(current, workInProgress2, prevState !== null ? prevState.baseLanes | renderLanes2 : renderLanes2, renderLanes2, nextProps);
      } else
        prevState !== null ? (pushTransition(workInProgress2, prevState.cachePool), pushHiddenContext(workInProgress2, prevState), reuseSuspenseHandlerOnStack(workInProgress2), workInProgress2.memoizedState = null) : (current !== null && pushTransition(workInProgress2, null), reuseHiddenContextOnStack(), reuseSuspenseHandlerOnStack(workInProgress2));
      reconcileChildren(current, workInProgress2, nextChildren, renderLanes2);
      return workInProgress2.child;
    }
    function bailoutOffscreenComponent(current, workInProgress2) {
      current !== null && current.tag === 22 || workInProgress2.stateNode !== null || (workInProgress2.stateNode = {
        _visibility: 1,
        _pendingMarkers: null,
        _retryCache: null,
        _transitions: null
      });
      return workInProgress2.sibling;
    }
    function deferHiddenOffscreenComponent(current, workInProgress2, nextBaseLanes, renderLanes2, remainingChildLanes) {
      var JSCompiler_inline_result = peekCacheFromPool();
      JSCompiler_inline_result = JSCompiler_inline_result === null ? null : {
        parent: isPrimaryRenderer ? CacheContext._currentValue : CacheContext._currentValue2,
        pool: JSCompiler_inline_result
      };
      workInProgress2.memoizedState = {
        baseLanes: nextBaseLanes,
        cachePool: JSCompiler_inline_result
      };
      current !== null && pushTransition(workInProgress2, null);
      reuseHiddenContextOnStack();
      pushOffscreenSuspenseHandler(workInProgress2);
      current !== null && propagateParentContextChanges(current, workInProgress2, renderLanes2, true);
      workInProgress2.childLanes = remainingChildLanes;
      return null;
    }
    function mountActivityChildren(workInProgress2, nextProps) {
      nextProps = mountWorkInProgressOffscreenFiber({ mode: nextProps.mode, children: nextProps.children }, workInProgress2.mode);
      nextProps.ref = workInProgress2.ref;
      workInProgress2.child = nextProps;
      nextProps.return = workInProgress2;
      return nextProps;
    }
    function retryActivityComponentWithoutHydrating(current, workInProgress2, renderLanes2) {
      reconcileChildFibers(workInProgress2, current.child, null, renderLanes2);
      current = mountActivityChildren(workInProgress2, workInProgress2.pendingProps);
      current.flags |= 2;
      popSuspenseHandler(workInProgress2);
      workInProgress2.memoizedState = null;
      return current;
    }
    function updateActivityComponent(current, workInProgress2, renderLanes2) {
      var nextProps = workInProgress2.pendingProps, didSuspend = (workInProgress2.flags & 128) !== 0;
      workInProgress2.flags &= -129;
      if (current === null) {
        if (isHydrating) {
          if (nextProps.mode === "hidden")
            return current = mountActivityChildren(workInProgress2, nextProps), workInProgress2.lanes = 536870912, bailoutOffscreenComponent(null, current);
          pushDehydratedActivitySuspenseHandler(workInProgress2);
          (current = nextHydratableInstance) ? (current = canHydrateActivityInstance(current, rootOrSingletonContext), current !== null && (workInProgress2.memoizedState = {
            dehydrated: current,
            treeContext: treeContextProvider !== null ? { id: treeContextId, overflow: treeContextOverflow } : null,
            retryLane: 536870912,
            hydrationErrors: null
          }, renderLanes2 = createFiberFromDehydratedFragment(current), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current = null;
          if (current === null)
            throw throwOnHydrationMismatch(workInProgress2);
          workInProgress2.lanes = 536870912;
          return null;
        }
        return mountActivityChildren(workInProgress2, nextProps);
      }
      var prevState = current.memoizedState;
      if (prevState !== null) {
        var dehydrated = prevState.dehydrated;
        pushDehydratedActivitySuspenseHandler(workInProgress2);
        if (didSuspend)
          if (workInProgress2.flags & 256)
            workInProgress2.flags &= -257, workInProgress2 = retryActivityComponentWithoutHydrating(current, workInProgress2, renderLanes2);
          else if (workInProgress2.memoizedState !== null)
            workInProgress2.child = current.child, workInProgress2.flags |= 128, workInProgress2 = null;
          else
            throw Error(formatProdErrorMessage(558));
        else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress2, renderLanes2, false), didSuspend = (renderLanes2 & current.childLanes) !== 0, didReceiveUpdate || didSuspend) {
          nextProps = workInProgressRoot;
          if (nextProps !== null && (dehydrated = getBumpedLaneForHydration(nextProps, renderLanes2), dehydrated !== 0 && dehydrated !== prevState.retryLane))
            throw prevState.retryLane = dehydrated, enqueueConcurrentRenderForLane(current, dehydrated), scheduleUpdateOnFiber(nextProps, current, dehydrated), SelectiveHydrationException;
          renderDidSuspendDelayIfPossible();
          workInProgress2 = retryActivityComponentWithoutHydrating(current, workInProgress2, renderLanes2);
        } else
          current = prevState.treeContext, supportsHydration && (nextHydratableInstance = getFirstHydratableChildWithinActivityInstance(dehydrated), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, rootOrSingletonContext = false, current !== null && restoreSuspendedTreeContext(workInProgress2, current)), workInProgress2 = mountActivityChildren(workInProgress2, nextProps), workInProgress2.flags |= 4096;
        return workInProgress2;
      }
      current = createWorkInProgress(current.child, {
        mode: nextProps.mode,
        children: nextProps.children
      });
      current.ref = workInProgress2.ref;
      workInProgress2.child = current;
      current.return = workInProgress2;
      return current;
    }
    function markRef(current, workInProgress2) {
      var ref = workInProgress2.ref;
      if (ref === null)
        current !== null && current.ref !== null && (workInProgress2.flags |= 4194816);
      else {
        if (typeof ref !== "function" && typeof ref !== "object")
          throw Error(formatProdErrorMessage(284));
        if (current === null || current.ref !== ref)
          workInProgress2.flags |= 4194816;
      }
    }
    function updateFunctionComponent(current, workInProgress2, Component2, nextProps, renderLanes2) {
      prepareToReadContext(workInProgress2);
      Component2 = renderWithHooks(current, workInProgress2, Component2, nextProps, undefined, renderLanes2);
      nextProps = checkDidRenderIdHook();
      if (current !== null && !didReceiveUpdate)
        return bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
      isHydrating && nextProps && pushMaterializedTreeId(workInProgress2);
      workInProgress2.flags |= 1;
      reconcileChildren(current, workInProgress2, Component2, renderLanes2);
      return workInProgress2.child;
    }
    function replayFunctionComponent(current, workInProgress2, nextProps, Component2, secondArg, renderLanes2) {
      prepareToReadContext(workInProgress2);
      workInProgress2.updateQueue = null;
      nextProps = renderWithHooksAgain(workInProgress2, Component2, nextProps, secondArg);
      finishRenderingHooks(current);
      Component2 = checkDidRenderIdHook();
      if (current !== null && !didReceiveUpdate)
        return bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
      isHydrating && Component2 && pushMaterializedTreeId(workInProgress2);
      workInProgress2.flags |= 1;
      reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
      return workInProgress2.child;
    }
    function updateClassComponent(current, workInProgress2, Component2, nextProps, renderLanes2) {
      prepareToReadContext(workInProgress2);
      if (workInProgress2.stateNode === null) {
        var context = emptyContextObject, contextType = Component2.contextType;
        typeof contextType === "object" && contextType !== null && (context = readContext(contextType));
        context = new Component2(nextProps, context);
        workInProgress2.memoizedState = context.state !== null && context.state !== undefined ? context.state : null;
        context.updater = classComponentUpdater;
        workInProgress2.stateNode = context;
        context._reactInternals = workInProgress2;
        context = workInProgress2.stateNode;
        context.props = nextProps;
        context.state = workInProgress2.memoizedState;
        context.refs = {};
        initializeUpdateQueue(workInProgress2);
        contextType = Component2.contextType;
        context.context = typeof contextType === "object" && contextType !== null ? readContext(contextType) : emptyContextObject;
        context.state = workInProgress2.memoizedState;
        contextType = Component2.getDerivedStateFromProps;
        typeof contextType === "function" && (applyDerivedStateFromProps(workInProgress2, Component2, contextType, nextProps), context.state = workInProgress2.memoizedState);
        typeof Component2.getDerivedStateFromProps === "function" || typeof context.getSnapshotBeforeUpdate === "function" || typeof context.UNSAFE_componentWillMount !== "function" && typeof context.componentWillMount !== "function" || (contextType = context.state, typeof context.componentWillMount === "function" && context.componentWillMount(), typeof context.UNSAFE_componentWillMount === "function" && context.UNSAFE_componentWillMount(), contextType !== context.state && classComponentUpdater.enqueueReplaceState(context, context.state, null), processUpdateQueue(workInProgress2, nextProps, context, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction(), context.state = workInProgress2.memoizedState);
        typeof context.componentDidMount === "function" && (workInProgress2.flags |= 4194308);
        nextProps = true;
      } else if (current === null) {
        context = workInProgress2.stateNode;
        var unresolvedOldProps = workInProgress2.memoizedProps, oldProps = resolveClassComponentProps(Component2, unresolvedOldProps);
        context.props = oldProps;
        var oldContext = context.context, contextType$jscomp$0 = Component2.contextType;
        contextType = emptyContextObject;
        typeof contextType$jscomp$0 === "object" && contextType$jscomp$0 !== null && (contextType = readContext(contextType$jscomp$0));
        var getDerivedStateFromProps = Component2.getDerivedStateFromProps;
        contextType$jscomp$0 = typeof getDerivedStateFromProps === "function" || typeof context.getSnapshotBeforeUpdate === "function";
        unresolvedOldProps = workInProgress2.pendingProps !== unresolvedOldProps;
        contextType$jscomp$0 || typeof context.UNSAFE_componentWillReceiveProps !== "function" && typeof context.componentWillReceiveProps !== "function" || (unresolvedOldProps || oldContext !== contextType) && callComponentWillReceiveProps(workInProgress2, context, nextProps, contextType);
        hasForceUpdate = false;
        var oldState = workInProgress2.memoizedState;
        context.state = oldState;
        processUpdateQueue(workInProgress2, nextProps, context, renderLanes2);
        suspendIfUpdateReadFromEntangledAsyncAction();
        oldContext = workInProgress2.memoizedState;
        unresolvedOldProps || oldState !== oldContext || hasForceUpdate ? (typeof getDerivedStateFromProps === "function" && (applyDerivedStateFromProps(workInProgress2, Component2, getDerivedStateFromProps, nextProps), oldContext = workInProgress2.memoizedState), (oldProps = hasForceUpdate || checkShouldComponentUpdate(workInProgress2, Component2, oldProps, nextProps, oldState, oldContext, contextType)) ? (contextType$jscomp$0 || typeof context.UNSAFE_componentWillMount !== "function" && typeof context.componentWillMount !== "function" || (typeof context.componentWillMount === "function" && context.componentWillMount(), typeof context.UNSAFE_componentWillMount === "function" && context.UNSAFE_componentWillMount()), typeof context.componentDidMount === "function" && (workInProgress2.flags |= 4194308)) : (typeof context.componentDidMount === "function" && (workInProgress2.flags |= 4194308), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = oldContext), context.props = nextProps, context.state = oldContext, context.context = contextType, nextProps = oldProps) : (typeof context.componentDidMount === "function" && (workInProgress2.flags |= 4194308), nextProps = false);
      } else {
        context = workInProgress2.stateNode;
        cloneUpdateQueue(current, workInProgress2);
        contextType = workInProgress2.memoizedProps;
        contextType$jscomp$0 = resolveClassComponentProps(Component2, contextType);
        context.props = contextType$jscomp$0;
        getDerivedStateFromProps = workInProgress2.pendingProps;
        oldState = context.context;
        oldContext = Component2.contextType;
        oldProps = emptyContextObject;
        typeof oldContext === "object" && oldContext !== null && (oldProps = readContext(oldContext));
        unresolvedOldProps = Component2.getDerivedStateFromProps;
        (oldContext = typeof unresolvedOldProps === "function" || typeof context.getSnapshotBeforeUpdate === "function") || typeof context.UNSAFE_componentWillReceiveProps !== "function" && typeof context.componentWillReceiveProps !== "function" || (contextType !== getDerivedStateFromProps || oldState !== oldProps) && callComponentWillReceiveProps(workInProgress2, context, nextProps, oldProps);
        hasForceUpdate = false;
        oldState = workInProgress2.memoizedState;
        context.state = oldState;
        processUpdateQueue(workInProgress2, nextProps, context, renderLanes2);
        suspendIfUpdateReadFromEntangledAsyncAction();
        var newState = workInProgress2.memoizedState;
        contextType !== getDerivedStateFromProps || oldState !== newState || hasForceUpdate || current !== null && current.dependencies !== null && checkIfContextChanged(current.dependencies) ? (typeof unresolvedOldProps === "function" && (applyDerivedStateFromProps(workInProgress2, Component2, unresolvedOldProps, nextProps), newState = workInProgress2.memoizedState), (contextType$jscomp$0 = hasForceUpdate || checkShouldComponentUpdate(workInProgress2, Component2, contextType$jscomp$0, nextProps, oldState, newState, oldProps) || current !== null && current.dependencies !== null && checkIfContextChanged(current.dependencies)) ? (oldContext || typeof context.UNSAFE_componentWillUpdate !== "function" && typeof context.componentWillUpdate !== "function" || (typeof context.componentWillUpdate === "function" && context.componentWillUpdate(nextProps, newState, oldProps), typeof context.UNSAFE_componentWillUpdate === "function" && context.UNSAFE_componentWillUpdate(nextProps, newState, oldProps)), typeof context.componentDidUpdate === "function" && (workInProgress2.flags |= 4), typeof context.getSnapshotBeforeUpdate === "function" && (workInProgress2.flags |= 1024)) : (typeof context.componentDidUpdate !== "function" || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 4), typeof context.getSnapshotBeforeUpdate !== "function" || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 1024), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = newState), context.props = nextProps, context.state = newState, context.context = oldProps, nextProps = contextType$jscomp$0) : (typeof context.componentDidUpdate !== "function" || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 4), typeof context.getSnapshotBeforeUpdate !== "function" || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 1024), nextProps = false);
      }
      context = nextProps;
      markRef(current, workInProgress2);
      nextProps = (workInProgress2.flags & 128) !== 0;
      context || nextProps ? (context = workInProgress2.stateNode, Component2 = nextProps && typeof Component2.getDerivedStateFromError !== "function" ? null : context.render(), workInProgress2.flags |= 1, current !== null && nextProps ? (workInProgress2.child = reconcileChildFibers(workInProgress2, current.child, null, renderLanes2), workInProgress2.child = reconcileChildFibers(workInProgress2, null, Component2, renderLanes2)) : reconcileChildren(current, workInProgress2, Component2, renderLanes2), workInProgress2.memoizedState = context.state, current = workInProgress2.child) : current = bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
      return current;
    }
    function mountHostRootWithoutHydrating(current, workInProgress2, nextChildren, renderLanes2) {
      resetHydrationState();
      workInProgress2.flags |= 256;
      reconcileChildren(current, workInProgress2, nextChildren, renderLanes2);
      return workInProgress2.child;
    }
    function mountSuspenseOffscreenState(renderLanes2) {
      return { baseLanes: renderLanes2, cachePool: getSuspendedCache() };
    }
    function getRemainingWorkInPrimaryTree(current, primaryTreeDidDefer, renderLanes2) {
      current = current !== null ? current.childLanes & ~renderLanes2 : 0;
      primaryTreeDidDefer && (current |= workInProgressDeferredLane);
      return current;
    }
    function updateSuspenseComponent(current, workInProgress2, renderLanes2) {
      var nextProps = workInProgress2.pendingProps, showFallback = false, didSuspend = (workInProgress2.flags & 128) !== 0, JSCompiler_temp;
      (JSCompiler_temp = didSuspend) || (JSCompiler_temp = current !== null && current.memoizedState === null ? false : (suspenseStackCursor.current & 2) !== 0);
      JSCompiler_temp && (showFallback = true, workInProgress2.flags &= -129);
      JSCompiler_temp = (workInProgress2.flags & 32) !== 0;
      workInProgress2.flags &= -33;
      if (current === null) {
        if (isHydrating) {
          showFallback ? pushPrimaryTreeSuspenseHandler(workInProgress2) : reuseSuspenseHandlerOnStack(workInProgress2);
          (current = nextHydratableInstance) ? (current = canHydrateSuspenseInstance(current, rootOrSingletonContext), current !== null && (workInProgress2.memoizedState = {
            dehydrated: current,
            treeContext: treeContextProvider !== null ? { id: treeContextId, overflow: treeContextOverflow } : null,
            retryLane: 536870912,
            hydrationErrors: null
          }, renderLanes2 = createFiberFromDehydratedFragment(current), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current = null;
          if (current === null)
            throw throwOnHydrationMismatch(workInProgress2);
          isSuspenseInstanceFallback(current) ? workInProgress2.lanes = 32 : workInProgress2.lanes = 536870912;
          return null;
        }
        var nextPrimaryChildren = nextProps.children;
        nextProps = nextProps.fallback;
        if (showFallback)
          return reuseSuspenseHandlerOnStack(workInProgress2), showFallback = workInProgress2.mode, nextPrimaryChildren = mountWorkInProgressOffscreenFiber({ mode: "hidden", children: nextPrimaryChildren }, showFallback), nextProps = createFiberFromFragment(nextProps, showFallback, renderLanes2, null), nextPrimaryChildren.return = workInProgress2, nextProps.return = workInProgress2, nextPrimaryChildren.sibling = nextProps, workInProgress2.child = nextPrimaryChildren, nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(current, JSCompiler_temp, renderLanes2), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps);
        pushPrimaryTreeSuspenseHandler(workInProgress2);
        return mountSuspensePrimaryChildren(workInProgress2, nextPrimaryChildren);
      }
      var prevState = current.memoizedState;
      if (prevState !== null && (nextPrimaryChildren = prevState.dehydrated, nextPrimaryChildren !== null)) {
        if (didSuspend)
          workInProgress2.flags & 256 ? (pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags &= -257, workInProgress2 = retrySuspenseComponentWithoutHydrating(current, workInProgress2, renderLanes2)) : workInProgress2.memoizedState !== null ? (reuseSuspenseHandlerOnStack(workInProgress2), workInProgress2.child = current.child, workInProgress2.flags |= 128, workInProgress2 = null) : (reuseSuspenseHandlerOnStack(workInProgress2), nextPrimaryChildren = nextProps.fallback, showFallback = workInProgress2.mode, nextProps = mountWorkInProgressOffscreenFiber({ mode: "visible", children: nextProps.children }, showFallback), nextPrimaryChildren = createFiberFromFragment(nextPrimaryChildren, showFallback, renderLanes2, null), nextPrimaryChildren.flags |= 2, nextProps.return = workInProgress2, nextPrimaryChildren.return = workInProgress2, nextProps.sibling = nextPrimaryChildren, workInProgress2.child = nextProps, reconcileChildFibers(workInProgress2, current.child, null, renderLanes2), nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(current, JSCompiler_temp, renderLanes2), workInProgress2.memoizedState = SUSPENDED_MARKER, workInProgress2 = bailoutOffscreenComponent(null, nextProps));
        else if (pushPrimaryTreeSuspenseHandler(workInProgress2), isSuspenseInstanceFallback(nextPrimaryChildren))
          JSCompiler_temp = getSuspenseInstanceFallbackErrorDetails(nextPrimaryChildren).digest, nextProps = Error(formatProdErrorMessage(419)), nextProps.stack = "", nextProps.digest = JSCompiler_temp, queueHydrationError({ value: nextProps, source: null, stack: null }), workInProgress2 = retrySuspenseComponentWithoutHydrating(current, workInProgress2, renderLanes2);
        else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress2, renderLanes2, false), JSCompiler_temp = (renderLanes2 & current.childLanes) !== 0, didReceiveUpdate || JSCompiler_temp) {
          JSCompiler_temp = workInProgressRoot;
          if (JSCompiler_temp !== null && (nextProps = getBumpedLaneForHydration(JSCompiler_temp, renderLanes2), nextProps !== 0 && nextProps !== prevState.retryLane))
            throw prevState.retryLane = nextProps, enqueueConcurrentRenderForLane(current, nextProps), scheduleUpdateOnFiber(JSCompiler_temp, current, nextProps), SelectiveHydrationException;
          isSuspenseInstancePending(nextPrimaryChildren) || renderDidSuspendDelayIfPossible();
          workInProgress2 = retrySuspenseComponentWithoutHydrating(current, workInProgress2, renderLanes2);
        } else
          isSuspenseInstancePending(nextPrimaryChildren) ? (workInProgress2.flags |= 192, workInProgress2.child = current.child, workInProgress2 = null) : (current = prevState.treeContext, supportsHydration && (nextHydratableInstance = getFirstHydratableChildWithinSuspenseInstance(nextPrimaryChildren), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, rootOrSingletonContext = false, current !== null && restoreSuspendedTreeContext(workInProgress2, current)), workInProgress2 = mountSuspensePrimaryChildren(workInProgress2, nextProps.children), workInProgress2.flags |= 4096);
        return workInProgress2;
      }
      if (showFallback)
        return reuseSuspenseHandlerOnStack(workInProgress2), nextPrimaryChildren = nextProps.fallback, showFallback = workInProgress2.mode, prevState = current.child, didSuspend = prevState.sibling, nextProps = createWorkInProgress(prevState, {
          mode: "hidden",
          children: nextProps.children
        }), nextProps.subtreeFlags = prevState.subtreeFlags & 65011712, didSuspend !== null ? nextPrimaryChildren = createWorkInProgress(didSuspend, nextPrimaryChildren) : (nextPrimaryChildren = createFiberFromFragment(nextPrimaryChildren, showFallback, renderLanes2, null), nextPrimaryChildren.flags |= 2), nextPrimaryChildren.return = workInProgress2, nextProps.return = workInProgress2, nextProps.sibling = nextPrimaryChildren, workInProgress2.child = nextProps, bailoutOffscreenComponent(null, nextProps), nextProps = workInProgress2.child, nextPrimaryChildren = current.child.memoizedState, nextPrimaryChildren === null ? nextPrimaryChildren = mountSuspenseOffscreenState(renderLanes2) : (showFallback = nextPrimaryChildren.cachePool, showFallback !== null ? (prevState = isPrimaryRenderer ? CacheContext._currentValue : CacheContext._currentValue2, showFallback = showFallback.parent !== prevState ? { parent: prevState, pool: prevState } : showFallback) : showFallback = getSuspendedCache(), nextPrimaryChildren = {
          baseLanes: nextPrimaryChildren.baseLanes | renderLanes2,
          cachePool: showFallback
        }), nextProps.memoizedState = nextPrimaryChildren, nextProps.childLanes = getRemainingWorkInPrimaryTree(current, JSCompiler_temp, renderLanes2), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(current.child, nextProps);
      pushPrimaryTreeSuspenseHandler(workInProgress2);
      renderLanes2 = current.child;
      current = renderLanes2.sibling;
      renderLanes2 = createWorkInProgress(renderLanes2, {
        mode: "visible",
        children: nextProps.children
      });
      renderLanes2.return = workInProgress2;
      renderLanes2.sibling = null;
      current !== null && (JSCompiler_temp = workInProgress2.deletions, JSCompiler_temp === null ? (workInProgress2.deletions = [current], workInProgress2.flags |= 16) : JSCompiler_temp.push(current));
      workInProgress2.child = renderLanes2;
      workInProgress2.memoizedState = null;
      return renderLanes2;
    }
    function mountSuspensePrimaryChildren(workInProgress2, primaryChildren) {
      primaryChildren = mountWorkInProgressOffscreenFiber({ mode: "visible", children: primaryChildren }, workInProgress2.mode);
      primaryChildren.return = workInProgress2;
      return workInProgress2.child = primaryChildren;
    }
    function mountWorkInProgressOffscreenFiber(offscreenProps, mode) {
      offscreenProps = createFiber(22, offscreenProps, null, mode);
      offscreenProps.lanes = 0;
      return offscreenProps;
    }
    function retrySuspenseComponentWithoutHydrating(current, workInProgress2, renderLanes2) {
      reconcileChildFibers(workInProgress2, current.child, null, renderLanes2);
      current = mountSuspensePrimaryChildren(workInProgress2, workInProgress2.pendingProps.children);
      current.flags |= 2;
      workInProgress2.memoizedState = null;
      return current;
    }
    function scheduleSuspenseWorkOnFiber(fiber, renderLanes2, propagationRoot) {
      fiber.lanes |= renderLanes2;
      var alternate = fiber.alternate;
      alternate !== null && (alternate.lanes |= renderLanes2);
      scheduleContextWorkOnParentPath(fiber.return, renderLanes2, propagationRoot);
    }
    function initSuspenseListRenderState(workInProgress2, isBackwards, tail, lastContentRow, tailMode, treeForkCount2) {
      var renderState = workInProgress2.memoizedState;
      renderState === null ? workInProgress2.memoizedState = {
        isBackwards,
        rendering: null,
        renderingStartTime: 0,
        last: lastContentRow,
        tail,
        tailMode,
        treeForkCount: treeForkCount2
      } : (renderState.isBackwards = isBackwards, renderState.rendering = null, renderState.renderingStartTime = 0, renderState.last = lastContentRow, renderState.tail = tail, renderState.tailMode = tailMode, renderState.treeForkCount = treeForkCount2);
    }
    function updateSuspenseListComponent(current, workInProgress2, renderLanes2) {
      var nextProps = workInProgress2.pendingProps, revealOrder = nextProps.revealOrder, tailMode = nextProps.tail;
      nextProps = nextProps.children;
      var suspenseContext = suspenseStackCursor.current, shouldForceFallback = (suspenseContext & 2) !== 0;
      shouldForceFallback ? (suspenseContext = suspenseContext & 1 | 2, workInProgress2.flags |= 128) : suspenseContext &= 1;
      push2(suspenseStackCursor, suspenseContext);
      reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
      nextProps = isHydrating ? treeForkCount : 0;
      if (!shouldForceFallback && current !== null && (current.flags & 128) !== 0)
        a:
          for (current = workInProgress2.child;current !== null; ) {
            if (current.tag === 13)
              current.memoizedState !== null && scheduleSuspenseWorkOnFiber(current, renderLanes2, workInProgress2);
            else if (current.tag === 19)
              scheduleSuspenseWorkOnFiber(current, renderLanes2, workInProgress2);
            else if (current.child !== null) {
              current.child.return = current;
              current = current.child;
              continue;
            }
            if (current === workInProgress2)
              break a;
            for (;current.sibling === null; ) {
              if (current.return === null || current.return === workInProgress2)
                break a;
              current = current.return;
            }
            current.sibling.return = current.return;
            current = current.sibling;
          }
      switch (revealOrder) {
        case "forwards":
          renderLanes2 = workInProgress2.child;
          for (revealOrder = null;renderLanes2 !== null; )
            current = renderLanes2.alternate, current !== null && findFirstSuspended(current) === null && (revealOrder = renderLanes2), renderLanes2 = renderLanes2.sibling;
          renderLanes2 = revealOrder;
          renderLanes2 === null ? (revealOrder = workInProgress2.child, workInProgress2.child = null) : (revealOrder = renderLanes2.sibling, renderLanes2.sibling = null);
          initSuspenseListRenderState(workInProgress2, false, revealOrder, renderLanes2, tailMode, nextProps);
          break;
        case "backwards":
        case "unstable_legacy-backwards":
          renderLanes2 = null;
          revealOrder = workInProgress2.child;
          for (workInProgress2.child = null;revealOrder !== null; ) {
            current = revealOrder.alternate;
            if (current !== null && findFirstSuspended(current) === null) {
              workInProgress2.child = revealOrder;
              break;
            }
            current = revealOrder.sibling;
            revealOrder.sibling = renderLanes2;
            renderLanes2 = revealOrder;
            revealOrder = current;
          }
          initSuspenseListRenderState(workInProgress2, true, renderLanes2, null, tailMode, nextProps);
          break;
        case "together":
          initSuspenseListRenderState(workInProgress2, false, null, null, undefined, nextProps);
          break;
        default:
          workInProgress2.memoizedState = null;
      }
      return workInProgress2.child;
    }
    function bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2) {
      current !== null && (workInProgress2.dependencies = current.dependencies);
      workInProgressRootSkippedLanes |= workInProgress2.lanes;
      if ((renderLanes2 & workInProgress2.childLanes) === 0)
        if (current !== null) {
          if (propagateParentContextChanges(current, workInProgress2, renderLanes2, false), (renderLanes2 & workInProgress2.childLanes) === 0)
            return null;
        } else
          return null;
      if (current !== null && workInProgress2.child !== current.child)
        throw Error(formatProdErrorMessage(153));
      if (workInProgress2.child !== null) {
        current = workInProgress2.child;
        renderLanes2 = createWorkInProgress(current, current.pendingProps);
        workInProgress2.child = renderLanes2;
        for (renderLanes2.return = workInProgress2;current.sibling !== null; )
          current = current.sibling, renderLanes2 = renderLanes2.sibling = createWorkInProgress(current, current.pendingProps), renderLanes2.return = workInProgress2;
        renderLanes2.sibling = null;
      }
      return workInProgress2.child;
    }
    function checkScheduledUpdateOrContext(current, renderLanes2) {
      if ((current.lanes & renderLanes2) !== 0)
        return true;
      current = current.dependencies;
      return current !== null && checkIfContextChanged(current) ? true : false;
    }
    function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress2, renderLanes2) {
      switch (workInProgress2.tag) {
        case 3:
          pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo);
          pushProvider(workInProgress2, CacheContext, current.memoizedState.cache);
          resetHydrationState();
          break;
        case 27:
        case 5:
          pushHostContext(workInProgress2);
          break;
        case 4:
          pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo);
          break;
        case 10:
          pushProvider(workInProgress2, workInProgress2.type, workInProgress2.memoizedProps.value);
          break;
        case 31:
          if (workInProgress2.memoizedState !== null)
            return workInProgress2.flags |= 128, pushDehydratedActivitySuspenseHandler(workInProgress2), null;
          break;
        case 13:
          var state$82 = workInProgress2.memoizedState;
          if (state$82 !== null) {
            if (state$82.dehydrated !== null)
              return pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags |= 128, null;
            if ((renderLanes2 & workInProgress2.child.childLanes) !== 0)
              return updateSuspenseComponent(current, workInProgress2, renderLanes2);
            pushPrimaryTreeSuspenseHandler(workInProgress2);
            current = bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
            return current !== null ? current.sibling : null;
          }
          pushPrimaryTreeSuspenseHandler(workInProgress2);
          break;
        case 19:
          var didSuspendBefore = (current.flags & 128) !== 0;
          state$82 = (renderLanes2 & workInProgress2.childLanes) !== 0;
          state$82 || (propagateParentContextChanges(current, workInProgress2, renderLanes2, false), state$82 = (renderLanes2 & workInProgress2.childLanes) !== 0);
          if (didSuspendBefore) {
            if (state$82)
              return updateSuspenseListComponent(current, workInProgress2, renderLanes2);
            workInProgress2.flags |= 128;
          }
          didSuspendBefore = workInProgress2.memoizedState;
          didSuspendBefore !== null && (didSuspendBefore.rendering = null, didSuspendBefore.tail = null, didSuspendBefore.lastEffect = null);
          push2(suspenseStackCursor, suspenseStackCursor.current);
          if (state$82)
            break;
          else
            return null;
        case 22:
          return workInProgress2.lanes = 0, updateOffscreenComponent(current, workInProgress2, renderLanes2, workInProgress2.pendingProps);
        case 24:
          pushProvider(workInProgress2, CacheContext, current.memoizedState.cache);
      }
      return bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
    }
    function beginWork(current, workInProgress2, renderLanes2) {
      if (current !== null)
        if (current.memoizedProps !== workInProgress2.pendingProps)
          didReceiveUpdate = true;
        else {
          if (!checkScheduledUpdateOrContext(current, renderLanes2) && (workInProgress2.flags & 128) === 0)
            return didReceiveUpdate = false, attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress2, renderLanes2);
          didReceiveUpdate = (current.flags & 131072) !== 0 ? true : false;
        }
      else
        didReceiveUpdate = false, isHydrating && (workInProgress2.flags & 1048576) !== 0 && pushTreeId(workInProgress2, treeForkCount, workInProgress2.index);
      workInProgress2.lanes = 0;
      switch (workInProgress2.tag) {
        case 16:
          a: {
            var props = workInProgress2.pendingProps;
            current = resolveLazy(workInProgress2.elementType);
            workInProgress2.type = current;
            if (typeof current === "function")
              shouldConstruct(current) ? (props = resolveClassComponentProps(current, props), workInProgress2.tag = 1, workInProgress2 = updateClassComponent(null, workInProgress2, current, props, renderLanes2)) : (workInProgress2.tag = 0, workInProgress2 = updateFunctionComponent(null, workInProgress2, current, props, renderLanes2));
            else {
              if (current !== undefined && current !== null) {
                var $$typeof = current.$$typeof;
                if ($$typeof === REACT_FORWARD_REF_TYPE2) {
                  workInProgress2.tag = 11;
                  workInProgress2 = updateForwardRef(null, workInProgress2, current, props, renderLanes2);
                  break a;
                } else if ($$typeof === REACT_MEMO_TYPE2) {
                  workInProgress2.tag = 14;
                  workInProgress2 = updateMemoComponent(null, workInProgress2, current, props, renderLanes2);
                  break a;
                }
              }
              workInProgress2 = getComponentNameFromType(current) || current;
              throw Error(formatProdErrorMessage(306, workInProgress2, ""));
            }
          }
          return workInProgress2;
        case 0:
          return updateFunctionComponent(current, workInProgress2, workInProgress2.type, workInProgress2.pendingProps, renderLanes2);
        case 1:
          return props = workInProgress2.type, $$typeof = resolveClassComponentProps(props, workInProgress2.pendingProps), updateClassComponent(current, workInProgress2, props, $$typeof, renderLanes2);
        case 3:
          a: {
            pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo);
            if (current === null)
              throw Error(formatProdErrorMessage(387));
            var nextProps = workInProgress2.pendingProps;
            $$typeof = workInProgress2.memoizedState;
            props = $$typeof.element;
            cloneUpdateQueue(current, workInProgress2);
            processUpdateQueue(workInProgress2, nextProps, null, renderLanes2);
            var nextState = workInProgress2.memoizedState;
            nextProps = nextState.cache;
            pushProvider(workInProgress2, CacheContext, nextProps);
            nextProps !== $$typeof.cache && propagateContextChanges(workInProgress2, [CacheContext], renderLanes2, true);
            suspendIfUpdateReadFromEntangledAsyncAction();
            nextProps = nextState.element;
            if (supportsHydration && $$typeof.isDehydrated)
              if ($$typeof = {
                element: nextProps,
                isDehydrated: false,
                cache: nextState.cache
              }, workInProgress2.updateQueue.baseState = $$typeof, workInProgress2.memoizedState = $$typeof, workInProgress2.flags & 256) {
                workInProgress2 = mountHostRootWithoutHydrating(current, workInProgress2, nextProps, renderLanes2);
                break a;
              } else if (nextProps !== props) {
                props = createCapturedValueAtFiber(Error(formatProdErrorMessage(424)), workInProgress2);
                queueHydrationError(props);
                workInProgress2 = mountHostRootWithoutHydrating(current, workInProgress2, nextProps, renderLanes2);
                break a;
              } else
                for (supportsHydration && (nextHydratableInstance = getFirstHydratableChildWithinContainer(workInProgress2.stateNode.containerInfo), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, rootOrSingletonContext = true), renderLanes2 = mountChildFibers(workInProgress2, null, nextProps, renderLanes2), workInProgress2.child = renderLanes2;renderLanes2; )
                  renderLanes2.flags = renderLanes2.flags & -3 | 4096, renderLanes2 = renderLanes2.sibling;
            else {
              resetHydrationState();
              if (nextProps === props) {
                workInProgress2 = bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
                break a;
              }
              reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
            }
            workInProgress2 = workInProgress2.child;
          }
          return workInProgress2;
        case 26:
          if (supportsResources)
            return markRef(current, workInProgress2), current === null ? (renderLanes2 = getResource(workInProgress2.type, null, workInProgress2.pendingProps, null)) ? workInProgress2.memoizedState = renderLanes2 : isHydrating || (workInProgress2.stateNode = createHoistableInstance(workInProgress2.type, workInProgress2.pendingProps, rootInstanceStackCursor.current, workInProgress2)) : workInProgress2.memoizedState = getResource(workInProgress2.type, current.memoizedProps, workInProgress2.pendingProps, current.memoizedState), null;
        case 27:
          if (supportsSingletons)
            return pushHostContext(workInProgress2), current === null && supportsSingletons && isHydrating && (props = workInProgress2.stateNode = resolveSingletonInstance(workInProgress2.type, workInProgress2.pendingProps, rootInstanceStackCursor.current, contextStackCursor.current, false), hydrationParentFiber = workInProgress2, rootOrSingletonContext = true, nextHydratableInstance = getFirstHydratableChildWithinSingleton(workInProgress2.type, props, nextHydratableInstance)), reconcileChildren(current, workInProgress2, workInProgress2.pendingProps.children, renderLanes2), markRef(current, workInProgress2), current === null && (workInProgress2.flags |= 4194304), workInProgress2.child;
        case 5:
          if (current === null && isHydrating) {
            validateHydratableInstance(workInProgress2.type, workInProgress2.pendingProps, contextStackCursor.current);
            if ($$typeof = props = nextHydratableInstance)
              props = canHydrateInstance(props, workInProgress2.type, workInProgress2.pendingProps, rootOrSingletonContext), props !== null ? (workInProgress2.stateNode = props, hydrationParentFiber = workInProgress2, nextHydratableInstance = getFirstHydratableChild(props), rootOrSingletonContext = false, $$typeof = true) : $$typeof = false;
            $$typeof || throwOnHydrationMismatch(workInProgress2);
          }
          pushHostContext(workInProgress2);
          $$typeof = workInProgress2.type;
          nextProps = workInProgress2.pendingProps;
          nextState = current !== null ? current.memoizedProps : null;
          props = nextProps.children;
          shouldSetTextContent($$typeof, nextProps) ? props = null : nextState !== null && shouldSetTextContent($$typeof, nextState) && (workInProgress2.flags |= 32);
          workInProgress2.memoizedState !== null && ($$typeof = renderWithHooks(current, workInProgress2, TransitionAwareHostComponent, null, null, renderLanes2), isPrimaryRenderer ? HostTransitionContext._currentValue = $$typeof : HostTransitionContext._currentValue2 = $$typeof);
          markRef(current, workInProgress2);
          reconcileChildren(current, workInProgress2, props, renderLanes2);
          return workInProgress2.child;
        case 6:
          if (current === null && isHydrating) {
            validateHydratableTextInstance(workInProgress2.pendingProps, contextStackCursor.current);
            if (current = renderLanes2 = nextHydratableInstance)
              renderLanes2 = canHydrateTextInstance(renderLanes2, workInProgress2.pendingProps, rootOrSingletonContext), renderLanes2 !== null ? (workInProgress2.stateNode = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null, current = true) : current = false;
            current || throwOnHydrationMismatch(workInProgress2);
          }
          return null;
        case 13:
          return updateSuspenseComponent(current, workInProgress2, renderLanes2);
        case 4:
          return pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo), props = workInProgress2.pendingProps, current === null ? workInProgress2.child = reconcileChildFibers(workInProgress2, null, props, renderLanes2) : reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
        case 11:
          return updateForwardRef(current, workInProgress2, workInProgress2.type, workInProgress2.pendingProps, renderLanes2);
        case 7:
          return reconcileChildren(current, workInProgress2, workInProgress2.pendingProps, renderLanes2), workInProgress2.child;
        case 8:
          return reconcileChildren(current, workInProgress2, workInProgress2.pendingProps.children, renderLanes2), workInProgress2.child;
        case 12:
          return reconcileChildren(current, workInProgress2, workInProgress2.pendingProps.children, renderLanes2), workInProgress2.child;
        case 10:
          return props = workInProgress2.pendingProps, pushProvider(workInProgress2, workInProgress2.type, props.value), reconcileChildren(current, workInProgress2, props.children, renderLanes2), workInProgress2.child;
        case 9:
          return $$typeof = workInProgress2.type._context, props = workInProgress2.pendingProps.children, prepareToReadContext(workInProgress2), $$typeof = readContext($$typeof), props = props($$typeof), workInProgress2.flags |= 1, reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
        case 14:
          return updateMemoComponent(current, workInProgress2, workInProgress2.type, workInProgress2.pendingProps, renderLanes2);
        case 15:
          return updateSimpleMemoComponent(current, workInProgress2, workInProgress2.type, workInProgress2.pendingProps, renderLanes2);
        case 19:
          return updateSuspenseListComponent(current, workInProgress2, renderLanes2);
        case 31:
          return updateActivityComponent(current, workInProgress2, renderLanes2);
        case 22:
          return updateOffscreenComponent(current, workInProgress2, renderLanes2, workInProgress2.pendingProps);
        case 24:
          return prepareToReadContext(workInProgress2), props = readContext(CacheContext), current === null ? ($$typeof = peekCacheFromPool(), $$typeof === null && ($$typeof = workInProgressRoot, nextProps = createCache(), $$typeof.pooledCache = nextProps, nextProps.refCount++, nextProps !== null && ($$typeof.pooledCacheLanes |= renderLanes2), $$typeof = nextProps), workInProgress2.memoizedState = {
            parent: props,
            cache: $$typeof
          }, initializeUpdateQueue(workInProgress2), pushProvider(workInProgress2, CacheContext, $$typeof)) : ((current.lanes & renderLanes2) !== 0 && (cloneUpdateQueue(current, workInProgress2), processUpdateQueue(workInProgress2, null, null, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction()), $$typeof = current.memoizedState, nextProps = workInProgress2.memoizedState, $$typeof.parent !== props ? ($$typeof = { parent: props, cache: props }, workInProgress2.memoizedState = $$typeof, workInProgress2.lanes === 0 && (workInProgress2.memoizedState = workInProgress2.updateQueue.baseState = $$typeof), pushProvider(workInProgress2, CacheContext, props)) : (props = nextProps.cache, pushProvider(workInProgress2, CacheContext, props), props !== $$typeof.cache && propagateContextChanges(workInProgress2, [CacheContext], renderLanes2, true))), reconcileChildren(current, workInProgress2, workInProgress2.pendingProps.children, renderLanes2), workInProgress2.child;
        case 29:
          throw workInProgress2.pendingProps;
      }
      throw Error(formatProdErrorMessage(156, workInProgress2.tag));
    }
    function markUpdate(workInProgress2) {
      workInProgress2.flags |= 4;
    }
    function markCloned(workInProgress2) {
      supportsPersistence && (workInProgress2.flags |= 8);
    }
    function doesRequireClone(current, completedWork) {
      if (current !== null && current.child === completedWork.child)
        return false;
      if ((completedWork.flags & 16) !== 0)
        return true;
      for (current = completedWork.child;current !== null; ) {
        if ((current.flags & 8218) !== 0 || (current.subtreeFlags & 8218) !== 0)
          return true;
        current = current.sibling;
      }
      return false;
    }
    function appendAllChildren(parent, workInProgress2, needsVisibilityToggle, isHidden) {
      if (supportsMutation)
        for (needsVisibilityToggle = workInProgress2.child;needsVisibilityToggle !== null; ) {
          if (needsVisibilityToggle.tag === 5 || needsVisibilityToggle.tag === 6)
            appendInitialChild(parent, needsVisibilityToggle.stateNode);
          else if (!(needsVisibilityToggle.tag === 4 || supportsSingletons && needsVisibilityToggle.tag === 27) && needsVisibilityToggle.child !== null) {
            needsVisibilityToggle.child.return = needsVisibilityToggle;
            needsVisibilityToggle = needsVisibilityToggle.child;
            continue;
          }
          if (needsVisibilityToggle === workInProgress2)
            break;
          for (;needsVisibilityToggle.sibling === null; ) {
            if (needsVisibilityToggle.return === null || needsVisibilityToggle.return === workInProgress2)
              return;
            needsVisibilityToggle = needsVisibilityToggle.return;
          }
          needsVisibilityToggle.sibling.return = needsVisibilityToggle.return;
          needsVisibilityToggle = needsVisibilityToggle.sibling;
        }
      else if (supportsPersistence)
        for (var node$85 = workInProgress2.child;node$85 !== null; ) {
          if (node$85.tag === 5) {
            var instance = node$85.stateNode;
            needsVisibilityToggle && isHidden && (instance = cloneHiddenInstance(instance, node$85.type, node$85.memoizedProps));
            appendInitialChild(parent, instance);
          } else if (node$85.tag === 6)
            instance = node$85.stateNode, needsVisibilityToggle && isHidden && (instance = cloneHiddenTextInstance(instance, node$85.memoizedProps)), appendInitialChild(parent, instance);
          else if (node$85.tag !== 4) {
            if (node$85.tag === 22 && node$85.memoizedState !== null)
              instance = node$85.child, instance !== null && (instance.return = node$85), appendAllChildren(parent, node$85, true, true);
            else if (node$85.child !== null) {
              node$85.child.return = node$85;
              node$85 = node$85.child;
              continue;
            }
          }
          if (node$85 === workInProgress2)
            break;
          for (;node$85.sibling === null; ) {
            if (node$85.return === null || node$85.return === workInProgress2)
              return;
            node$85 = node$85.return;
          }
          node$85.sibling.return = node$85.return;
          node$85 = node$85.sibling;
        }
    }
    function appendAllChildrenToContainer(containerChildSet, workInProgress2, needsVisibilityToggle, isHidden) {
      var hasOffscreenComponentChild = false;
      if (supportsPersistence)
        for (var node = workInProgress2.child;node !== null; ) {
          if (node.tag === 5) {
            var instance = node.stateNode;
            needsVisibilityToggle && isHidden && (instance = cloneHiddenInstance(instance, node.type, node.memoizedProps));
            appendChildToContainerChildSet(containerChildSet, instance);
          } else if (node.tag === 6)
            instance = node.stateNode, needsVisibilityToggle && isHidden && (instance = cloneHiddenTextInstance(instance, node.memoizedProps)), appendChildToContainerChildSet(containerChildSet, instance);
          else if (node.tag !== 4) {
            if (node.tag === 22 && node.memoizedState !== null)
              hasOffscreenComponentChild = node.child, hasOffscreenComponentChild !== null && (hasOffscreenComponentChild.return = node), appendAllChildrenToContainer(containerChildSet, node, true, true), hasOffscreenComponentChild = true;
            else if (node.child !== null) {
              node.child.return = node;
              node = node.child;
              continue;
            }
          }
          if (node === workInProgress2)
            break;
          for (;node.sibling === null; ) {
            if (node.return === null || node.return === workInProgress2)
              return hasOffscreenComponentChild;
            node = node.return;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
      return hasOffscreenComponentChild;
    }
    function updateHostContainer(current, workInProgress2) {
      if (supportsPersistence && doesRequireClone(current, workInProgress2)) {
        current = workInProgress2.stateNode;
        var container = current.containerInfo, newChildSet = createContainerChildSet();
        appendAllChildrenToContainer(newChildSet, workInProgress2, false, false);
        current.pendingChildren = newChildSet;
        markUpdate(workInProgress2);
        finalizeContainerChildren(container, newChildSet);
      }
    }
    function updateHostComponent(current, workInProgress2, type, newProps) {
      if (supportsMutation)
        current.memoizedProps !== newProps && markUpdate(workInProgress2);
      else if (supportsPersistence) {
        var { stateNode: currentInstance, memoizedProps: oldProps$88 } = current;
        if ((current = doesRequireClone(current, workInProgress2)) || oldProps$88 !== newProps) {
          var currentHostContext = contextStackCursor.current;
          oldProps$88 = cloneInstance(currentInstance, type, oldProps$88, newProps, !current, null);
          oldProps$88 === currentInstance ? workInProgress2.stateNode = currentInstance : (markCloned(workInProgress2), finalizeInitialChildren(oldProps$88, type, newProps, currentHostContext) && markUpdate(workInProgress2), workInProgress2.stateNode = oldProps$88, current && appendAllChildren(oldProps$88, workInProgress2, false, false));
        } else
          workInProgress2.stateNode = currentInstance;
      }
    }
    function preloadInstanceAndSuspendIfNeeded(workInProgress2, type, oldProps, newProps, renderLanes2) {
      if ((workInProgress2.mode & 32) !== 0 && (oldProps === null ? maySuspendCommit(type, newProps) : maySuspendCommitOnUpdate(type, oldProps, newProps))) {
        if (workInProgress2.flags |= 16777216, (renderLanes2 & 335544128) === renderLanes2 || maySuspendCommitInSyncRender(type, newProps))
          if (preloadInstance(workInProgress2.stateNode, type, newProps))
            workInProgress2.flags |= 8192;
          else if (shouldRemainOnPreviousScreen())
            workInProgress2.flags |= 8192;
          else
            throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
      } else
        workInProgress2.flags &= -16777217;
    }
    function preloadResourceAndSuspendIfNeeded(workInProgress2, resource) {
      if (mayResourceSuspendCommit(resource)) {
        if (workInProgress2.flags |= 16777216, !preloadResource(resource))
          if (shouldRemainOnPreviousScreen())
            workInProgress2.flags |= 8192;
          else
            throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
      } else
        workInProgress2.flags &= -16777217;
    }
    function scheduleRetryEffect(workInProgress2, retryQueue) {
      retryQueue !== null && (workInProgress2.flags |= 4);
      workInProgress2.flags & 16384 && (retryQueue = workInProgress2.tag !== 22 ? claimNextRetryLane() : 536870912, workInProgress2.lanes |= retryQueue, workInProgressSuspendedRetryLanes |= retryQueue);
    }
    function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
      if (!isHydrating)
        switch (renderState.tailMode) {
          case "hidden":
            hasRenderedATailFallback = renderState.tail;
            for (var lastTailNode = null;hasRenderedATailFallback !== null; )
              hasRenderedATailFallback.alternate !== null && (lastTailNode = hasRenderedATailFallback), hasRenderedATailFallback = hasRenderedATailFallback.sibling;
            lastTailNode === null ? renderState.tail = null : lastTailNode.sibling = null;
            break;
          case "collapsed":
            lastTailNode = renderState.tail;
            for (var lastTailNode$90 = null;lastTailNode !== null; )
              lastTailNode.alternate !== null && (lastTailNode$90 = lastTailNode), lastTailNode = lastTailNode.sibling;
            lastTailNode$90 === null ? hasRenderedATailFallback || renderState.tail === null ? renderState.tail = null : renderState.tail.sibling = null : lastTailNode$90.sibling = null;
        }
    }
    function bubbleProperties(completedWork) {
      var didBailout = completedWork.alternate !== null && completedWork.alternate.child === completedWork.child, newChildLanes = 0, subtreeFlags = 0;
      if (didBailout)
        for (var child$91 = completedWork.child;child$91 !== null; )
          newChildLanes |= child$91.lanes | child$91.childLanes, subtreeFlags |= child$91.subtreeFlags & 65011712, subtreeFlags |= child$91.flags & 65011712, child$91.return = completedWork, child$91 = child$91.sibling;
      else
        for (child$91 = completedWork.child;child$91 !== null; )
          newChildLanes |= child$91.lanes | child$91.childLanes, subtreeFlags |= child$91.subtreeFlags, subtreeFlags |= child$91.flags, child$91.return = completedWork, child$91 = child$91.sibling;
      completedWork.subtreeFlags |= subtreeFlags;
      completedWork.childLanes = newChildLanes;
      return didBailout;
    }
    function completeWork(current, workInProgress2, renderLanes2) {
      var newProps = workInProgress2.pendingProps;
      popTreeContext(workInProgress2);
      switch (workInProgress2.tag) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          return bubbleProperties(workInProgress2), null;
        case 1:
          return bubbleProperties(workInProgress2), null;
        case 3:
          renderLanes2 = workInProgress2.stateNode;
          newProps = null;
          current !== null && (newProps = current.memoizedState.cache);
          workInProgress2.memoizedState.cache !== newProps && (workInProgress2.flags |= 2048);
          popProvider(CacheContext);
          popHostContainer();
          renderLanes2.pendingContext && (renderLanes2.context = renderLanes2.pendingContext, renderLanes2.pendingContext = null);
          if (current === null || current.child === null)
            popHydrationState(workInProgress2) ? markUpdate(workInProgress2) : current === null || current.memoizedState.isDehydrated && (workInProgress2.flags & 256) === 0 || (workInProgress2.flags |= 1024, upgradeHydrationErrorsToRecoverable());
          updateHostContainer(current, workInProgress2);
          bubbleProperties(workInProgress2);
          return null;
        case 26:
          if (supportsResources) {
            var { type, memoizedState: nextResource } = workInProgress2;
            current === null ? (markUpdate(workInProgress2), nextResource !== null ? (bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(workInProgress2, type, null, newProps, renderLanes2))) : nextResource ? nextResource !== current.memoizedState ? (markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), workInProgress2.flags &= -16777217) : (nextResource = current.memoizedProps, supportsMutation ? nextResource !== newProps && markUpdate(workInProgress2) : updateHostComponent(current, workInProgress2, type, newProps), bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(workInProgress2, type, nextResource, newProps, renderLanes2));
            return null;
          }
        case 27:
          if (supportsSingletons) {
            popHostContext(workInProgress2);
            renderLanes2 = rootInstanceStackCursor.current;
            type = workInProgress2.type;
            if (current !== null && workInProgress2.stateNode != null)
              supportsMutation ? current.memoizedProps !== newProps && markUpdate(workInProgress2) : updateHostComponent(current, workInProgress2, type, newProps);
            else {
              if (!newProps) {
                if (workInProgress2.stateNode === null)
                  throw Error(formatProdErrorMessage(166));
                bubbleProperties(workInProgress2);
                return null;
              }
              current = contextStackCursor.current;
              popHydrationState(workInProgress2) ? prepareToHydrateHostInstance(workInProgress2, current) : (current = resolveSingletonInstance(type, newProps, renderLanes2, current, true), workInProgress2.stateNode = current, markUpdate(workInProgress2));
            }
            bubbleProperties(workInProgress2);
            return null;
          }
        case 5:
          popHostContext(workInProgress2);
          type = workInProgress2.type;
          if (current !== null && workInProgress2.stateNode != null)
            updateHostComponent(current, workInProgress2, type, newProps);
          else {
            if (!newProps) {
              if (workInProgress2.stateNode === null)
                throw Error(formatProdErrorMessage(166));
              bubbleProperties(workInProgress2);
              return null;
            }
            nextResource = contextStackCursor.current;
            if (popHydrationState(workInProgress2))
              prepareToHydrateHostInstance(workInProgress2, nextResource), finalizeHydratedChildren(workInProgress2.stateNode, type, newProps, nextResource) && (workInProgress2.flags |= 64);
            else {
              var instance$101 = createInstance(type, newProps, rootInstanceStackCursor.current, nextResource, workInProgress2);
              markCloned(workInProgress2);
              appendAllChildren(instance$101, workInProgress2, false, false);
              workInProgress2.stateNode = instance$101;
              finalizeInitialChildren(instance$101, type, newProps, nextResource) && markUpdate(workInProgress2);
            }
          }
          bubbleProperties(workInProgress2);
          preloadInstanceAndSuspendIfNeeded(workInProgress2, workInProgress2.type, current === null ? null : current.memoizedProps, workInProgress2.pendingProps, renderLanes2);
          return null;
        case 6:
          if (current && workInProgress2.stateNode != null)
            renderLanes2 = current.memoizedProps, supportsMutation ? renderLanes2 !== newProps && markUpdate(workInProgress2) : supportsPersistence && (renderLanes2 !== newProps ? (current = rootInstanceStackCursor.current, renderLanes2 = contextStackCursor.current, markCloned(workInProgress2), workInProgress2.stateNode = createTextInstance(newProps, current, renderLanes2, workInProgress2)) : workInProgress2.stateNode = current.stateNode);
          else {
            if (typeof newProps !== "string" && workInProgress2.stateNode === null)
              throw Error(formatProdErrorMessage(166));
            current = rootInstanceStackCursor.current;
            renderLanes2 = contextStackCursor.current;
            if (popHydrationState(workInProgress2)) {
              if (!supportsHydration)
                throw Error(formatProdErrorMessage(176));
              current = workInProgress2.stateNode;
              renderLanes2 = workInProgress2.memoizedProps;
              newProps = null;
              type = hydrationParentFiber;
              if (type !== null)
                switch (type.tag) {
                  case 27:
                  case 5:
                    newProps = type.memoizedProps;
                }
              hydrateTextInstance(current, renderLanes2, workInProgress2, newProps) || throwOnHydrationMismatch(workInProgress2, true);
            } else
              markCloned(workInProgress2), workInProgress2.stateNode = createTextInstance(newProps, current, renderLanes2, workInProgress2);
          }
          bubbleProperties(workInProgress2);
          return null;
        case 31:
          renderLanes2 = workInProgress2.memoizedState;
          if (current === null || current.memoizedState !== null) {
            newProps = popHydrationState(workInProgress2);
            if (renderLanes2 !== null) {
              if (current === null) {
                if (!newProps)
                  throw Error(formatProdErrorMessage(318));
                if (!supportsHydration)
                  throw Error(formatProdErrorMessage(556));
                current = workInProgress2.memoizedState;
                current = current !== null ? current.dehydrated : null;
                if (!current)
                  throw Error(formatProdErrorMessage(557));
                hydrateActivityInstance(current, workInProgress2);
              } else
                resetHydrationState(), (workInProgress2.flags & 128) === 0 && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
              bubbleProperties(workInProgress2);
              current = false;
            } else
              renderLanes2 = upgradeHydrationErrorsToRecoverable(), current !== null && current.memoizedState !== null && (current.memoizedState.hydrationErrors = renderLanes2), current = true;
            if (!current) {
              if (workInProgress2.flags & 256)
                return popSuspenseHandler(workInProgress2), workInProgress2;
              popSuspenseHandler(workInProgress2);
              return null;
            }
            if ((workInProgress2.flags & 128) !== 0)
              throw Error(formatProdErrorMessage(558));
          }
          bubbleProperties(workInProgress2);
          return null;
        case 13:
          newProps = workInProgress2.memoizedState;
          if (current === null || current.memoizedState !== null && current.memoizedState.dehydrated !== null) {
            type = popHydrationState(workInProgress2);
            if (newProps !== null && newProps.dehydrated !== null) {
              if (current === null) {
                if (!type)
                  throw Error(formatProdErrorMessage(318));
                if (!supportsHydration)
                  throw Error(formatProdErrorMessage(344));
                type = workInProgress2.memoizedState;
                type = type !== null ? type.dehydrated : null;
                if (!type)
                  throw Error(formatProdErrorMessage(317));
                hydrateSuspenseInstance(type, workInProgress2);
              } else
                resetHydrationState(), (workInProgress2.flags & 128) === 0 && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
              bubbleProperties(workInProgress2);
              type = false;
            } else
              type = upgradeHydrationErrorsToRecoverable(), current !== null && current.memoizedState !== null && (current.memoizedState.hydrationErrors = type), type = true;
            if (!type) {
              if (workInProgress2.flags & 256)
                return popSuspenseHandler(workInProgress2), workInProgress2;
              popSuspenseHandler(workInProgress2);
              return null;
            }
          }
          popSuspenseHandler(workInProgress2);
          if ((workInProgress2.flags & 128) !== 0)
            return workInProgress2.lanes = renderLanes2, workInProgress2;
          renderLanes2 = newProps !== null;
          current = current !== null && current.memoizedState !== null;
          renderLanes2 && (newProps = workInProgress2.child, type = null, newProps.alternate !== null && newProps.alternate.memoizedState !== null && newProps.alternate.memoizedState.cachePool !== null && (type = newProps.alternate.memoizedState.cachePool.pool), nextResource = null, newProps.memoizedState !== null && newProps.memoizedState.cachePool !== null && (nextResource = newProps.memoizedState.cachePool.pool), nextResource !== type && (newProps.flags |= 2048));
          renderLanes2 !== current && renderLanes2 && (workInProgress2.child.flags |= 8192);
          scheduleRetryEffect(workInProgress2, workInProgress2.updateQueue);
          bubbleProperties(workInProgress2);
          return null;
        case 4:
          return popHostContainer(), updateHostContainer(current, workInProgress2), current === null && preparePortalMount(workInProgress2.stateNode.containerInfo), bubbleProperties(workInProgress2), null;
        case 10:
          return popProvider(workInProgress2.type), bubbleProperties(workInProgress2), null;
        case 19:
          pop2(suspenseStackCursor);
          newProps = workInProgress2.memoizedState;
          if (newProps === null)
            return bubbleProperties(workInProgress2), null;
          type = (workInProgress2.flags & 128) !== 0;
          nextResource = newProps.rendering;
          if (nextResource === null)
            if (type)
              cutOffTailIfNeeded(newProps, false);
            else {
              if (workInProgressRootExitStatus !== 0 || current !== null && (current.flags & 128) !== 0)
                for (current = workInProgress2.child;current !== null; ) {
                  nextResource = findFirstSuspended(current);
                  if (nextResource !== null) {
                    workInProgress2.flags |= 128;
                    cutOffTailIfNeeded(newProps, false);
                    current = nextResource.updateQueue;
                    workInProgress2.updateQueue = current;
                    scheduleRetryEffect(workInProgress2, current);
                    workInProgress2.subtreeFlags = 0;
                    current = renderLanes2;
                    for (renderLanes2 = workInProgress2.child;renderLanes2 !== null; )
                      resetWorkInProgress(renderLanes2, current), renderLanes2 = renderLanes2.sibling;
                    push2(suspenseStackCursor, suspenseStackCursor.current & 1 | 2);
                    isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount);
                    return workInProgress2.child;
                  }
                  current = current.sibling;
                }
              newProps.tail !== null && now2() > workInProgressRootRenderTargetTime && (workInProgress2.flags |= 128, type = true, cutOffTailIfNeeded(newProps, false), workInProgress2.lanes = 4194304);
            }
          else {
            if (!type)
              if (current = findFirstSuspended(nextResource), current !== null) {
                if (workInProgress2.flags |= 128, type = true, current = current.updateQueue, workInProgress2.updateQueue = current, scheduleRetryEffect(workInProgress2, current), cutOffTailIfNeeded(newProps, true), newProps.tail === null && newProps.tailMode === "hidden" && !nextResource.alternate && !isHydrating)
                  return bubbleProperties(workInProgress2), null;
              } else
                2 * now2() - newProps.renderingStartTime > workInProgressRootRenderTargetTime && renderLanes2 !== 536870912 && (workInProgress2.flags |= 128, type = true, cutOffTailIfNeeded(newProps, false), workInProgress2.lanes = 4194304);
            newProps.isBackwards ? (nextResource.sibling = workInProgress2.child, workInProgress2.child = nextResource) : (current = newProps.last, current !== null ? current.sibling = nextResource : workInProgress2.child = nextResource, newProps.last = nextResource);
          }
          if (newProps.tail !== null)
            return current = newProps.tail, newProps.rendering = current, newProps.tail = current.sibling, newProps.renderingStartTime = now2(), current.sibling = null, renderLanes2 = suspenseStackCursor.current, push2(suspenseStackCursor, type ? renderLanes2 & 1 | 2 : renderLanes2 & 1), isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount), current;
          bubbleProperties(workInProgress2);
          return null;
        case 22:
        case 23:
          return popSuspenseHandler(workInProgress2), popHiddenContext(), newProps = workInProgress2.memoizedState !== null, current !== null ? current.memoizedState !== null !== newProps && (workInProgress2.flags |= 8192) : newProps && (workInProgress2.flags |= 8192), newProps ? (renderLanes2 & 536870912) !== 0 && (workInProgress2.flags & 128) === 0 && (bubbleProperties(workInProgress2), workInProgress2.subtreeFlags & 6 && (workInProgress2.flags |= 8192)) : bubbleProperties(workInProgress2), renderLanes2 = workInProgress2.updateQueue, renderLanes2 !== null && scheduleRetryEffect(workInProgress2, renderLanes2.retryQueue), renderLanes2 = null, current !== null && current.memoizedState !== null && current.memoizedState.cachePool !== null && (renderLanes2 = current.memoizedState.cachePool.pool), newProps = null, workInProgress2.memoizedState !== null && workInProgress2.memoizedState.cachePool !== null && (newProps = workInProgress2.memoizedState.cachePool.pool), newProps !== renderLanes2 && (workInProgress2.flags |= 2048), current !== null && pop2(resumedCache), null;
        case 24:
          return renderLanes2 = null, current !== null && (renderLanes2 = current.memoizedState.cache), workInProgress2.memoizedState.cache !== renderLanes2 && (workInProgress2.flags |= 2048), popProvider(CacheContext), bubbleProperties(workInProgress2), null;
        case 25:
          return null;
        case 30:
          return null;
      }
      throw Error(formatProdErrorMessage(156, workInProgress2.tag));
    }
    function unwindWork(current, workInProgress2) {
      popTreeContext(workInProgress2);
      switch (workInProgress2.tag) {
        case 1:
          return current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
        case 3:
          return popProvider(CacheContext), popHostContainer(), current = workInProgress2.flags, (current & 65536) !== 0 && (current & 128) === 0 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
        case 26:
        case 27:
        case 5:
          return popHostContext(workInProgress2), null;
        case 31:
          if (workInProgress2.memoizedState !== null) {
            popSuspenseHandler(workInProgress2);
            if (workInProgress2.alternate === null)
              throw Error(formatProdErrorMessage(340));
            resetHydrationState();
          }
          current = workInProgress2.flags;
          return current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
        case 13:
          popSuspenseHandler(workInProgress2);
          current = workInProgress2.memoizedState;
          if (current !== null && current.dehydrated !== null) {
            if (workInProgress2.alternate === null)
              throw Error(formatProdErrorMessage(340));
            resetHydrationState();
          }
          current = workInProgress2.flags;
          return current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
        case 19:
          return pop2(suspenseStackCursor), null;
        case 4:
          return popHostContainer(), null;
        case 10:
          return popProvider(workInProgress2.type), null;
        case 22:
        case 23:
          return popSuspenseHandler(workInProgress2), popHiddenContext(), current !== null && pop2(resumedCache), current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
        case 24:
          return popProvider(CacheContext), null;
        case 25:
          return null;
        default:
          return null;
      }
    }
    function unwindInterruptedWork(current, interruptedWork) {
      popTreeContext(interruptedWork);
      switch (interruptedWork.tag) {
        case 3:
          popProvider(CacheContext);
          popHostContainer();
          break;
        case 26:
        case 27:
        case 5:
          popHostContext(interruptedWork);
          break;
        case 4:
          popHostContainer();
          break;
        case 31:
          interruptedWork.memoizedState !== null && popSuspenseHandler(interruptedWork);
          break;
        case 13:
          popSuspenseHandler(interruptedWork);
          break;
        case 19:
          pop2(suspenseStackCursor);
          break;
        case 10:
          popProvider(interruptedWork.type);
          break;
        case 22:
        case 23:
          popSuspenseHandler(interruptedWork);
          popHiddenContext();
          current !== null && pop2(resumedCache);
          break;
        case 24:
          popProvider(CacheContext);
      }
    }
    function commitHookEffectListMount(flags, finishedWork) {
      try {
        var updateQueue = finishedWork.updateQueue, lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
        if (lastEffect !== null) {
          var firstEffect = lastEffect.next;
          updateQueue = firstEffect;
          do {
            if ((updateQueue.tag & flags) === flags) {
              lastEffect = undefined;
              var { create, inst } = updateQueue;
              lastEffect = create();
              inst.destroy = lastEffect;
            }
            updateQueue = updateQueue.next;
          } while (updateQueue !== firstEffect);
        }
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor$jscomp$0) {
      try {
        var updateQueue = finishedWork.updateQueue, lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
        if (lastEffect !== null) {
          var firstEffect = lastEffect.next;
          updateQueue = firstEffect;
          do {
            if ((updateQueue.tag & flags) === flags) {
              var inst = updateQueue.inst, destroy = inst.destroy;
              if (destroy !== undefined) {
                inst.destroy = undefined;
                lastEffect = finishedWork;
                var nearestMountedAncestor = nearestMountedAncestor$jscomp$0, destroy_ = destroy;
                try {
                  destroy_();
                } catch (error) {
                  captureCommitPhaseError(lastEffect, nearestMountedAncestor, error);
                }
              }
            }
            updateQueue = updateQueue.next;
          } while (updateQueue !== firstEffect);
        }
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function commitClassCallbacks(finishedWork) {
      var updateQueue = finishedWork.updateQueue;
      if (updateQueue !== null) {
        var instance = finishedWork.stateNode;
        try {
          commitCallbacks(updateQueue, instance);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
    }
    function safelyCallComponentWillUnmount(current, nearestMountedAncestor, instance) {
      instance.props = resolveClassComponentProps(current.type, current.memoizedProps);
      instance.state = current.memoizedState;
      try {
        instance.componentWillUnmount();
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    }
    function safelyAttachRef(current, nearestMountedAncestor) {
      try {
        var ref = current.ref;
        if (ref !== null) {
          switch (current.tag) {
            case 26:
            case 27:
            case 5:
              var instanceToUse = getPublicInstance(current.stateNode);
              break;
            case 30:
              instanceToUse = current.stateNode;
              break;
            default:
              instanceToUse = current.stateNode;
          }
          typeof ref === "function" ? current.refCleanup = ref(instanceToUse) : ref.current = instanceToUse;
        }
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    }
    function safelyDetachRef(current, nearestMountedAncestor) {
      var { ref, refCleanup } = current;
      if (ref !== null)
        if (typeof refCleanup === "function")
          try {
            refCleanup();
          } catch (error) {
            captureCommitPhaseError(current, nearestMountedAncestor, error);
          } finally {
            current.refCleanup = null, current = current.alternate, current != null && (current.refCleanup = null);
          }
        else if (typeof ref === "function")
          try {
            ref(null);
          } catch (error$124) {
            captureCommitPhaseError(current, nearestMountedAncestor, error$124);
          }
        else
          ref.current = null;
    }
    function commitHostMount(finishedWork) {
      var { type, memoizedProps: props, stateNode: instance } = finishedWork;
      try {
        commitMount(instance, type, props, finishedWork);
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function commitHostUpdate(finishedWork, newProps, oldProps) {
      try {
        commitUpdate(finishedWork.stateNode, finishedWork.type, oldProps, newProps, finishedWork);
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function isHostParent(fiber) {
      return fiber.tag === 5 || fiber.tag === 3 || (supportsResources ? fiber.tag === 26 : false) || (supportsSingletons ? fiber.tag === 27 && isSingletonScope(fiber.type) : false) || fiber.tag === 4;
    }
    function getHostSibling(fiber) {
      a:
        for (;; ) {
          for (;fiber.sibling === null; ) {
            if (fiber.return === null || isHostParent(fiber.return))
              return null;
            fiber = fiber.return;
          }
          fiber.sibling.return = fiber.return;
          for (fiber = fiber.sibling;fiber.tag !== 5 && fiber.tag !== 6 && fiber.tag !== 18; ) {
            if (supportsSingletons && fiber.tag === 27 && isSingletonScope(fiber.type))
              continue a;
            if (fiber.flags & 2)
              continue a;
            if (fiber.child === null || fiber.tag === 4)
              continue a;
            else
              fiber.child.return = fiber, fiber = fiber.child;
          }
          if (!(fiber.flags & 2))
            return fiber.stateNode;
        }
    }
    function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
      var tag = node.tag;
      if (tag === 5 || tag === 6)
        node = node.stateNode, before ? insertInContainerBefore(parent, node, before) : appendChildToContainer(parent, node);
      else if (tag !== 4 && (supportsSingletons && tag === 27 && isSingletonScope(node.type) && (parent = node.stateNode, before = null), node = node.child, node !== null))
        for (insertOrAppendPlacementNodeIntoContainer(node, before, parent), node = node.sibling;node !== null; )
          insertOrAppendPlacementNodeIntoContainer(node, before, parent), node = node.sibling;
    }
    function insertOrAppendPlacementNode(node, before, parent) {
      var tag = node.tag;
      if (tag === 5 || tag === 6)
        node = node.stateNode, before ? insertBefore(parent, node, before) : appendChild(parent, node);
      else if (tag !== 4 && (supportsSingletons && tag === 27 && isSingletonScope(node.type) && (parent = node.stateNode), node = node.child, node !== null))
        for (insertOrAppendPlacementNode(node, before, parent), node = node.sibling;node !== null; )
          insertOrAppendPlacementNode(node, before, parent), node = node.sibling;
    }
    function commitHostPortalContainerChildren(portal, finishedWork, pendingChildren) {
      portal = portal.containerInfo;
      try {
        replaceContainerChildren(portal, pendingChildren);
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function commitHostSingletonAcquisition(finishedWork) {
      var { stateNode: singleton, memoizedProps: props } = finishedWork;
      try {
        acquireSingletonInstance(finishedWork.type, props, singleton, finishedWork);
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
    function commitBeforeMutationEffects(root, firstChild) {
      prepareForCommit(root.containerInfo);
      for (nextEffect = firstChild;nextEffect !== null; )
        if (root = nextEffect, firstChild = root.child, (root.subtreeFlags & 1028) !== 0 && firstChild !== null)
          firstChild.return = root, nextEffect = firstChild;
        else
          for (;nextEffect !== null; ) {
            root = nextEffect;
            var current = root.alternate;
            firstChild = root.flags;
            switch (root.tag) {
              case 0:
                if ((firstChild & 4) !== 0 && (firstChild = root.updateQueue, firstChild = firstChild !== null ? firstChild.events : null, firstChild !== null))
                  for (var ii = 0;ii < firstChild.length; ii++) {
                    var _eventPayloads$ii = firstChild[ii];
                    _eventPayloads$ii.ref.impl = _eventPayloads$ii.nextImpl;
                  }
                break;
              case 11:
              case 15:
                break;
              case 1:
                if ((firstChild & 1024) !== 0 && current !== null) {
                  firstChild = undefined;
                  ii = root;
                  _eventPayloads$ii = current.memoizedProps;
                  current = current.memoizedState;
                  var instance = ii.stateNode;
                  try {
                    var resolvedPrevProps = resolveClassComponentProps(ii.type, _eventPayloads$ii);
                    firstChild = instance.getSnapshotBeforeUpdate(resolvedPrevProps, current);
                    instance.__reactInternalSnapshotBeforeUpdate = firstChild;
                  } catch (error) {
                    captureCommitPhaseError(ii, ii.return, error);
                  }
                }
                break;
              case 3:
                (firstChild & 1024) !== 0 && supportsMutation && clearContainer(root.stateNode.containerInfo);
                break;
              case 5:
              case 26:
              case 27:
              case 6:
              case 4:
              case 17:
                break;
              default:
                if ((firstChild & 1024) !== 0)
                  throw Error(formatProdErrorMessage(163));
            }
            firstChild = root.sibling;
            if (firstChild !== null) {
              firstChild.return = root.return;
              nextEffect = firstChild;
              break;
            }
            nextEffect = root.return;
          }
    }
    function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
      var flags = finishedWork.flags;
      switch (finishedWork.tag) {
        case 0:
        case 11:
        case 15:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          flags & 4 && commitHookEffectListMount(5, finishedWork);
          break;
        case 1:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          if (flags & 4)
            if (finishedRoot = finishedWork.stateNode, current === null)
              try {
                finishedRoot.componentDidMount();
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            else {
              var prevProps = resolveClassComponentProps(finishedWork.type, current.memoizedProps);
              current = current.memoizedState;
              try {
                finishedRoot.componentDidUpdate(prevProps, current, finishedRoot.__reactInternalSnapshotBeforeUpdate);
              } catch (error$123) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error$123);
              }
            }
          flags & 64 && commitClassCallbacks(finishedWork);
          flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
          break;
        case 3:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          if (flags & 64 && (flags = finishedWork.updateQueue, flags !== null)) {
            finishedRoot = null;
            if (finishedWork.child !== null)
              switch (finishedWork.child.tag) {
                case 27:
                case 5:
                  finishedRoot = getPublicInstance(finishedWork.child.stateNode);
                  break;
                case 1:
                  finishedRoot = finishedWork.child.stateNode;
              }
            try {
              commitCallbacks(flags, finishedRoot);
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
          break;
        case 27:
          supportsSingletons && current === null && flags & 4 && commitHostSingletonAcquisition(finishedWork);
        case 26:
        case 5:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          if (current === null) {
            if (flags & 4)
              commitHostMount(finishedWork);
            else if (flags & 64) {
              finishedRoot = finishedWork.type;
              current = finishedWork.memoizedProps;
              prevProps = finishedWork.stateNode;
              try {
                commitHydratedInstance(prevProps, finishedRoot, current, finishedWork);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
          }
          flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
          break;
        case 12:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          break;
        case 31:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
          break;
        case 13:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
          flags & 64 && (flags = finishedWork.memoizedState, flags !== null && (flags = flags.dehydrated, flags !== null && (finishedWork = retryDehydratedSuspenseBoundary.bind(null, finishedWork), registerSuspenseInstanceRetry(flags, finishedWork))));
          break;
        case 22:
          flags = finishedWork.memoizedState !== null || offscreenSubtreeIsHidden;
          if (!flags) {
            current = current !== null && current.memoizedState !== null || offscreenSubtreeWasHidden;
            prevProps = offscreenSubtreeIsHidden;
            var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
            offscreenSubtreeIsHidden = flags;
            (offscreenSubtreeWasHidden = current) && !prevOffscreenSubtreeWasHidden ? recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, (finishedWork.subtreeFlags & 8772) !== 0) : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            offscreenSubtreeIsHidden = prevProps;
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
          }
          break;
        case 30:
          break;
        default:
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      }
    }
    function detachFiberAfterEffects(fiber) {
      var alternate = fiber.alternate;
      alternate !== null && (fiber.alternate = null, detachFiberAfterEffects(alternate));
      fiber.child = null;
      fiber.deletions = null;
      fiber.sibling = null;
      fiber.tag === 5 && (alternate = fiber.stateNode, alternate !== null && detachDeletedInstance(alternate));
      fiber.stateNode = null;
      fiber.return = null;
      fiber.dependencies = null;
      fiber.memoizedProps = null;
      fiber.memoizedState = null;
      fiber.pendingProps = null;
      fiber.stateNode = null;
      fiber.updateQueue = null;
    }
    function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
      for (parent = parent.child;parent !== null; )
        commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent), parent = parent.sibling;
    }
    function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
      if (injectedHook && typeof injectedHook.onCommitFiberUnmount === "function")
        try {
          injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
        } catch (err) {}
      switch (deletedFiber.tag) {
        case 26:
          if (supportsResources) {
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            deletedFiber.memoizedState ? releaseResource(deletedFiber.memoizedState) : deletedFiber.stateNode && unmountHoistable(deletedFiber.stateNode);
            break;
          }
        case 27:
          if (supportsSingletons) {
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
            var prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer;
            isSingletonScope(deletedFiber.type) && (hostParent = deletedFiber.stateNode, hostParentIsContainer = false);
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            releaseSingletonInstance(deletedFiber.stateNode);
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            break;
          }
        case 5:
          offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
        case 6:
          if (supportsMutation) {
            if (prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer, hostParent = null, recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer, hostParent !== null)
              if (hostParentIsContainer)
                try {
                  removeChildFromContainer(hostParent, deletedFiber.stateNode);
                } catch (error) {
                  captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
                }
              else
                try {
                  removeChild(hostParent, deletedFiber.stateNode);
                } catch (error) {
                  captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
                }
          } else
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
          break;
        case 18:
          supportsMutation && hostParent !== null && (hostParentIsContainer ? clearSuspenseBoundaryFromContainer(hostParent, deletedFiber.stateNode) : clearSuspenseBoundary(hostParent, deletedFiber.stateNode));
          break;
        case 4:
          supportsMutation ? (prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer, hostParent = deletedFiber.stateNode.containerInfo, hostParentIsContainer = true, recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer) : (supportsPersistence && commitHostPortalContainerChildren(deletedFiber.stateNode, deletedFiber, createContainerChildSet()), recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber));
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          commitHookEffectListUnmount(2, deletedFiber, nearestMountedAncestor);
          offscreenSubtreeWasHidden || commitHookEffectListUnmount(4, deletedFiber, nearestMountedAncestor);
          recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
          break;
        case 1:
          offscreenSubtreeWasHidden || (safelyDetachRef(deletedFiber, nearestMountedAncestor), prevHostParent = deletedFiber.stateNode, typeof prevHostParent.componentWillUnmount === "function" && safelyCallComponentWillUnmount(deletedFiber, nearestMountedAncestor, prevHostParent));
          recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
          break;
        case 21:
          recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
          break;
        case 22:
          offscreenSubtreeWasHidden = (prevHostParent = offscreenSubtreeWasHidden) || deletedFiber.memoizedState !== null;
          recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
          offscreenSubtreeWasHidden = prevHostParent;
          break;
        default:
          recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
      }
    }
    function commitActivityHydrationCallbacks(finishedRoot, finishedWork) {
      if (supportsHydration && finishedWork.memoizedState === null && (finishedRoot = finishedWork.alternate, finishedRoot !== null && (finishedRoot = finishedRoot.memoizedState, finishedRoot !== null))) {
        finishedRoot = finishedRoot.dehydrated;
        try {
          commitHydratedActivityInstance(finishedRoot);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
    }
    function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
      if (supportsHydration && finishedWork.memoizedState === null && (finishedRoot = finishedWork.alternate, finishedRoot !== null && (finishedRoot = finishedRoot.memoizedState, finishedRoot !== null && (finishedRoot = finishedRoot.dehydrated, finishedRoot !== null))))
        try {
          commitHydratedSuspenseInstance(finishedRoot);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
    }
    function getRetryCache(finishedWork) {
      switch (finishedWork.tag) {
        case 31:
        case 13:
        case 19:
          var retryCache = finishedWork.stateNode;
          retryCache === null && (retryCache = finishedWork.stateNode = new PossiblyWeakSet);
          return retryCache;
        case 22:
          return finishedWork = finishedWork.stateNode, retryCache = finishedWork._retryCache, retryCache === null && (retryCache = finishedWork._retryCache = new PossiblyWeakSet), retryCache;
        default:
          throw Error(formatProdErrorMessage(435, finishedWork.tag));
      }
    }
    function attachSuspenseRetryListeners(finishedWork, wakeables) {
      var retryCache = getRetryCache(finishedWork);
      wakeables.forEach(function(wakeable) {
        if (!retryCache.has(wakeable)) {
          retryCache.add(wakeable);
          var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
          wakeable.then(retry, retry);
        }
      });
    }
    function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber) {
      var deletions = parentFiber.deletions;
      if (deletions !== null)
        for (var i = 0;i < deletions.length; i++) {
          var childToDelete = deletions[i], root = root$jscomp$0, returnFiber = parentFiber;
          if (supportsMutation) {
            var parent = returnFiber;
            a:
              for (;parent !== null; ) {
                switch (parent.tag) {
                  case 27:
                    if (supportsSingletons) {
                      if (isSingletonScope(parent.type)) {
                        hostParent = parent.stateNode;
                        hostParentIsContainer = false;
                        break a;
                      }
                      break;
                    }
                  case 5:
                    hostParent = parent.stateNode;
                    hostParentIsContainer = false;
                    break a;
                  case 3:
                  case 4:
                    hostParent = parent.stateNode.containerInfo;
                    hostParentIsContainer = true;
                    break a;
                }
                parent = parent.return;
              }
            if (hostParent === null)
              throw Error(formatProdErrorMessage(160));
            commitDeletionEffectsOnFiber(root, returnFiber, childToDelete);
            hostParent = null;
            hostParentIsContainer = false;
          } else
            commitDeletionEffectsOnFiber(root, returnFiber, childToDelete);
          root = childToDelete.alternate;
          root !== null && (root.return = null);
          childToDelete.return = null;
        }
      if (parentFiber.subtreeFlags & 13886)
        for (parentFiber = parentFiber.child;parentFiber !== null; )
          commitMutationEffectsOnFiber(parentFiber, root$jscomp$0), parentFiber = parentFiber.sibling;
    }
    function commitMutationEffectsOnFiber(finishedWork, root) {
      var { alternate: current, flags } = finishedWork;
      switch (finishedWork.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          flags & 4 && (commitHookEffectListUnmount(3, finishedWork, finishedWork.return), commitHookEffectListMount(3, finishedWork), commitHookEffectListUnmount(5, finishedWork, finishedWork.return));
          break;
        case 1:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return));
          flags & 64 && offscreenSubtreeIsHidden && (finishedWork = finishedWork.updateQueue, finishedWork !== null && (flags = finishedWork.callbacks, flags !== null && (current = finishedWork.shared.hiddenCallbacks, finishedWork.shared.hiddenCallbacks = current === null ? flags : current.concat(flags))));
          break;
        case 26:
          if (supportsResources) {
            var hoistableRoot = currentHoistableRoot;
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return));
            if (flags & 4) {
              flags = current !== null ? current.memoizedState : null;
              var newResource = finishedWork.memoizedState;
              current === null ? newResource === null ? finishedWork.stateNode === null ? finishedWork.stateNode = hydrateHoistable(hoistableRoot, finishedWork.type, finishedWork.memoizedProps, finishedWork) : mountHoistable(hoistableRoot, finishedWork.type, finishedWork.stateNode) : finishedWork.stateNode = acquireResource(hoistableRoot, newResource, finishedWork.memoizedProps) : flags !== newResource ? (flags === null ? current.stateNode !== null && unmountHoistable(current.stateNode) : releaseResource(flags), newResource === null ? mountHoistable(hoistableRoot, finishedWork.type, finishedWork.stateNode) : acquireResource(hoistableRoot, newResource, finishedWork.memoizedProps)) : newResource === null && finishedWork.stateNode !== null && commitHostUpdate(finishedWork, finishedWork.memoizedProps, current.memoizedProps);
            }
            break;
          }
        case 27:
          if (supportsSingletons) {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return));
            current !== null && flags & 4 && commitHostUpdate(finishedWork, finishedWork.memoizedProps, current.memoizedProps);
            break;
          }
        case 5:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return));
          if (supportsMutation) {
            if (finishedWork.flags & 32) {
              hoistableRoot = finishedWork.stateNode;
              try {
                resetTextContent(hoistableRoot);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            flags & 4 && finishedWork.stateNode != null && (hoistableRoot = finishedWork.memoizedProps, commitHostUpdate(finishedWork, hoistableRoot, current !== null ? current.memoizedProps : hoistableRoot));
            flags & 1024 && (needsFormReset = true);
          } else
            supportsPersistence && finishedWork.alternate !== null && (finishedWork.alternate.stateNode = finishedWork.stateNode);
          break;
        case 6:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          if (flags & 4 && supportsMutation) {
            if (finishedWork.stateNode === null)
              throw Error(formatProdErrorMessage(162));
            flags = finishedWork.memoizedProps;
            current = current !== null ? current.memoizedProps : flags;
            hoistableRoot = finishedWork.stateNode;
            try {
              commitTextUpdate(hoistableRoot, current, flags);
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
          break;
        case 3:
          supportsResources ? (prepareToCommitHoistables(), hoistableRoot = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(root.containerInfo), recursivelyTraverseMutationEffects(root, finishedWork), currentHoistableRoot = hoistableRoot) : recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          if (flags & 4) {
            if (supportsMutation && supportsHydration && current !== null && current.memoizedState.isDehydrated)
              try {
                commitHydratedContainer(root.containerInfo);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            if (supportsPersistence) {
              flags = root.containerInfo;
              current = root.pendingChildren;
              try {
                replaceContainerChildren(flags, current);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
          }
          needsFormReset && (needsFormReset = false, recursivelyResetForms(finishedWork));
          break;
        case 4:
          supportsResources ? (current = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(finishedWork.stateNode.containerInfo), recursivelyTraverseMutationEffects(root, finishedWork), commitReconciliationEffects(finishedWork), currentHoistableRoot = current) : (recursivelyTraverseMutationEffects(root, finishedWork), commitReconciliationEffects(finishedWork));
          flags & 4 && supportsPersistence && commitHostPortalContainerChildren(finishedWork.stateNode, finishedWork, finishedWork.stateNode.pendingChildren);
          break;
        case 12:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          break;
        case 31:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          flags & 4 && (flags = finishedWork.updateQueue, flags !== null && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
          break;
        case 13:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          finishedWork.child.flags & 8192 && finishedWork.memoizedState !== null !== (current !== null && current.memoizedState !== null) && (globalMostRecentFallbackTime = now2());
          flags & 4 && (flags = finishedWork.updateQueue, flags !== null && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
          break;
        case 22:
          hoistableRoot = finishedWork.memoizedState !== null;
          var wasHidden = current !== null && current.memoizedState !== null, prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden, prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
          offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || hoistableRoot;
          offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || wasHidden;
          recursivelyTraverseMutationEffects(root, finishedWork);
          offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
          offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
          commitReconciliationEffects(finishedWork);
          if (flags & 8192 && (root = finishedWork.stateNode, root._visibility = hoistableRoot ? root._visibility & -2 : root._visibility | 1, hoistableRoot && (current === null || wasHidden || offscreenSubtreeIsHidden || offscreenSubtreeWasHidden || recursivelyTraverseDisappearLayoutEffects(finishedWork)), supportsMutation)) {
            a:
              if (current = null, supportsMutation)
                for (root = finishedWork;; ) {
                  if (root.tag === 5 || supportsResources && root.tag === 26) {
                    if (current === null) {
                      wasHidden = current = root;
                      try {
                        newResource = wasHidden.stateNode, hoistableRoot ? hideInstance(newResource) : unhideInstance(wasHidden.stateNode, wasHidden.memoizedProps);
                      } catch (error) {
                        captureCommitPhaseError(wasHidden, wasHidden.return, error);
                      }
                    }
                  } else if (root.tag === 6) {
                    if (current === null) {
                      wasHidden = root;
                      try {
                        var instance = wasHidden.stateNode;
                        hoistableRoot ? hideTextInstance(instance) : unhideTextInstance(instance, wasHidden.memoizedProps);
                      } catch (error) {
                        captureCommitPhaseError(wasHidden, wasHidden.return, error);
                      }
                    }
                  } else if (root.tag === 18) {
                    if (current === null) {
                      wasHidden = root;
                      try {
                        var instance$jscomp$0 = wasHidden.stateNode;
                        hoistableRoot ? hideDehydratedBoundary(instance$jscomp$0) : unhideDehydratedBoundary(wasHidden.stateNode);
                      } catch (error) {
                        captureCommitPhaseError(wasHidden, wasHidden.return, error);
                      }
                    }
                  } else if ((root.tag !== 22 && root.tag !== 23 || root.memoizedState === null || root === finishedWork) && root.child !== null) {
                    root.child.return = root;
                    root = root.child;
                    continue;
                  }
                  if (root === finishedWork)
                    break a;
                  for (;root.sibling === null; ) {
                    if (root.return === null || root.return === finishedWork)
                      break a;
                    current === root && (current = null);
                    root = root.return;
                  }
                  current === root && (current = null);
                  root.sibling.return = root.return;
                  root = root.sibling;
                }
          }
          flags & 4 && (flags = finishedWork.updateQueue, flags !== null && (current = flags.retryQueue, current !== null && (flags.retryQueue = null, attachSuspenseRetryListeners(finishedWork, current))));
          break;
        case 19:
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          flags & 4 && (flags = finishedWork.updateQueue, flags !== null && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
          break;
        case 30:
          break;
        case 21:
          break;
        default:
          recursivelyTraverseMutationEffects(root, finishedWork), commitReconciliationEffects(finishedWork);
      }
    }
    function commitReconciliationEffects(finishedWork) {
      var flags = finishedWork.flags;
      if (flags & 2) {
        try {
          for (var hostParentFiber, parentFiber = finishedWork.return;parentFiber !== null; ) {
            if (isHostParent(parentFiber)) {
              hostParentFiber = parentFiber;
              break;
            }
            parentFiber = parentFiber.return;
          }
          if (supportsMutation) {
            if (hostParentFiber == null)
              throw Error(formatProdErrorMessage(160));
            switch (hostParentFiber.tag) {
              case 27:
                if (supportsSingletons) {
                  var parent = hostParentFiber.stateNode, before = getHostSibling(finishedWork);
                  insertOrAppendPlacementNode(finishedWork, before, parent);
                  break;
                }
              case 5:
                var parent$125 = hostParentFiber.stateNode;
                hostParentFiber.flags & 32 && (resetTextContent(parent$125), hostParentFiber.flags &= -33);
                var before$126 = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(finishedWork, before$126, parent$125);
                break;
              case 3:
              case 4:
                var parent$127 = hostParentFiber.stateNode.containerInfo, before$128 = getHostSibling(finishedWork);
                insertOrAppendPlacementNodeIntoContainer(finishedWork, before$128, parent$127);
                break;
              default:
                throw Error(formatProdErrorMessage(161));
            }
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
        finishedWork.flags &= -3;
      }
      flags & 4096 && (finishedWork.flags &= -4097);
    }
    function recursivelyResetForms(parentFiber) {
      if (parentFiber.subtreeFlags & 1024)
        for (parentFiber = parentFiber.child;parentFiber !== null; ) {
          var fiber = parentFiber;
          recursivelyResetForms(fiber);
          fiber.tag === 5 && fiber.flags & 1024 && resetFormInstance(fiber.stateNode);
          parentFiber = parentFiber.sibling;
        }
    }
    function recursivelyTraverseLayoutEffects(root, parentFiber) {
      if (parentFiber.subtreeFlags & 8772)
        for (parentFiber = parentFiber.child;parentFiber !== null; )
          commitLayoutEffectOnFiber(root, parentFiber.alternate, parentFiber), parentFiber = parentFiber.sibling;
    }
    function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
      for (parentFiber = parentFiber.child;parentFiber !== null; ) {
        var finishedWork = parentFiber;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            commitHookEffectListUnmount(4, finishedWork, finishedWork.return);
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
          case 1:
            safelyDetachRef(finishedWork, finishedWork.return);
            var instance = finishedWork.stateNode;
            typeof instance.componentWillUnmount === "function" && safelyCallComponentWillUnmount(finishedWork, finishedWork.return, instance);
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
          case 27:
            supportsSingletons && releaseSingletonInstance(finishedWork.stateNode);
          case 26:
          case 5:
            safelyDetachRef(finishedWork, finishedWork.return);
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
          case 22:
            finishedWork.memoizedState === null && recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
          case 30:
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
          default:
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
        }
        parentFiber = parentFiber.sibling;
      }
    }
    function recursivelyTraverseReappearLayoutEffects(finishedRoot$jscomp$0, parentFiber, includeWorkInProgressEffects) {
      includeWorkInProgressEffects = includeWorkInProgressEffects && (parentFiber.subtreeFlags & 8772) !== 0;
      for (parentFiber = parentFiber.child;parentFiber !== null; ) {
        var current = parentFiber.alternate, finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            commitHookEffectListMount(4, finishedWork);
            break;
          case 1:
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            current = finishedWork;
            finishedRoot = current.stateNode;
            if (typeof finishedRoot.componentDidMount === "function")
              try {
                finishedRoot.componentDidMount();
              } catch (error) {
                captureCommitPhaseError(current, current.return, error);
              }
            current = finishedWork;
            finishedRoot = current.updateQueue;
            if (finishedRoot !== null) {
              var instance = current.stateNode;
              try {
                var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
                if (hiddenCallbacks !== null)
                  for (finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0;finishedRoot < hiddenCallbacks.length; finishedRoot++)
                    callCallback(hiddenCallbacks[finishedRoot], instance);
              } catch (error) {
                captureCommitPhaseError(current, current.return, error);
              }
            }
            includeWorkInProgressEffects && flags & 64 && commitClassCallbacks(finishedWork);
            safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 27:
            supportsSingletons && commitHostSingletonAcquisition(finishedWork);
          case 26:
          case 5:
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            includeWorkInProgressEffects && current === null && flags & 4 && commitHostMount(finishedWork);
            safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 12:
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            break;
          case 31:
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            includeWorkInProgressEffects && flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
            break;
          case 13:
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            includeWorkInProgressEffects && flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
            break;
          case 22:
            finishedWork.memoizedState === null && recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 30:
            break;
          default:
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
        }
        parentFiber = parentFiber.sibling;
      }
    }
    function commitOffscreenPassiveMountEffects(current, finishedWork) {
      var previousCache = null;
      current !== null && current.memoizedState !== null && current.memoizedState.cachePool !== null && (previousCache = current.memoizedState.cachePool.pool);
      current = null;
      finishedWork.memoizedState !== null && finishedWork.memoizedState.cachePool !== null && (current = finishedWork.memoizedState.cachePool.pool);
      current !== previousCache && (current != null && current.refCount++, previousCache != null && releaseCache(previousCache));
    }
    function commitCachePassiveMountEffect(current, finishedWork) {
      current = null;
      finishedWork.alternate !== null && (current = finishedWork.alternate.memoizedState.cache);
      finishedWork = finishedWork.memoizedState.cache;
      finishedWork !== current && (finishedWork.refCount++, current != null && releaseCache(current));
    }
    function recursivelyTraversePassiveMountEffects(root, parentFiber, committedLanes, committedTransitions) {
      if (parentFiber.subtreeFlags & 10256)
        for (parentFiber = parentFiber.child;parentFiber !== null; )
          commitPassiveMountOnFiber(root, parentFiber, committedLanes, committedTransitions), parentFiber = parentFiber.sibling;
    }
    function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions) {
      var flags = finishedWork.flags;
      switch (finishedWork.tag) {
        case 0:
        case 11:
        case 15:
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
          flags & 2048 && commitHookEffectListMount(9, finishedWork);
          break;
        case 1:
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
          break;
        case 3:
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
          flags & 2048 && (finishedRoot = null, finishedWork.alternate !== null && (finishedRoot = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== finishedRoot && (finishedWork.refCount++, finishedRoot != null && releaseCache(finishedRoot)));
          break;
        case 12:
          if (flags & 2048) {
            recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
            finishedRoot = finishedWork.stateNode;
            try {
              var _finishedWork$memoize2 = finishedWork.memoizedProps, id = _finishedWork$memoize2.id, onPostCommit = _finishedWork$memoize2.onPostCommit;
              typeof onPostCommit === "function" && onPostCommit(id, finishedWork.alternate === null ? "mount" : "update", finishedRoot.passiveEffectDuration, -0);
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          } else
            recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
          break;
        case 31:
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
          break;
        case 13:
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
          break;
        case 23:
          break;
        case 22:
          _finishedWork$memoize2 = finishedWork.stateNode;
          id = finishedWork.alternate;
          finishedWork.memoizedState !== null ? _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions) : recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork) : _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions) : (_finishedWork$memoize2._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, (finishedWork.subtreeFlags & 10256) !== 0 || false));
          flags & 2048 && commitOffscreenPassiveMountEffects(id, finishedWork);
          break;
        case 24:
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
          flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
          break;
        default:
          recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
      }
    }
    function recursivelyTraverseReconnectPassiveEffects(finishedRoot$jscomp$0, parentFiber, committedLanes$jscomp$0, committedTransitions$jscomp$0, includeWorkInProgressEffects) {
      includeWorkInProgressEffects = includeWorkInProgressEffects && ((parentFiber.subtreeFlags & 10256) !== 0 || false);
      for (parentFiber = parentFiber.child;parentFiber !== null; ) {
        var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, committedLanes = committedLanes$jscomp$0, committedTransitions = committedTransitions$jscomp$0, flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
            commitHookEffectListMount(8, finishedWork);
            break;
          case 23:
            break;
          case 22:
            var instance = finishedWork.stateNode;
            finishedWork.memoizedState !== null ? instance._visibility & 2 ? recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects) : recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork) : (instance._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects));
            includeWorkInProgressEffects && flags & 2048 && commitOffscreenPassiveMountEffects(finishedWork.alternate, finishedWork);
            break;
          case 24:
            recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
            includeWorkInProgressEffects && flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
            break;
          default:
            recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
        }
        parentFiber = parentFiber.sibling;
      }
    }
    function recursivelyTraverseAtomicPassiveEffects(finishedRoot$jscomp$0, parentFiber) {
      if (parentFiber.subtreeFlags & 10256)
        for (parentFiber = parentFiber.child;parentFiber !== null; ) {
          var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 22:
              recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
              flags & 2048 && commitOffscreenPassiveMountEffects(finishedWork.alternate, finishedWork);
              break;
            case 24:
              recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
              flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
              break;
            default:
              recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
          }
          parentFiber = parentFiber.sibling;
        }
    }
    function recursivelyAccumulateSuspenseyCommit(parentFiber, committedLanes, suspendedState) {
      if (parentFiber.subtreeFlags & suspenseyCommitFlag)
        for (parentFiber = parentFiber.child;parentFiber !== null; )
          accumulateSuspenseyCommitOnFiber(parentFiber, committedLanes, suspendedState), parentFiber = parentFiber.sibling;
    }
    function accumulateSuspenseyCommitOnFiber(fiber, committedLanes, suspendedState) {
      switch (fiber.tag) {
        case 26:
          recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
          if (fiber.flags & suspenseyCommitFlag)
            if (fiber.memoizedState !== null)
              suspendResource(suspendedState, currentHoistableRoot, fiber.memoizedState, fiber.memoizedProps);
            else {
              var { stateNode: instance, type } = fiber;
              fiber = fiber.memoizedProps;
              ((committedLanes & 335544128) === committedLanes || maySuspendCommitInSyncRender(type, fiber)) && suspendInstance(suspendedState, instance, type, fiber);
            }
          break;
        case 5:
          recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
          fiber.flags & suspenseyCommitFlag && (instance = fiber.stateNode, type = fiber.type, fiber = fiber.memoizedProps, ((committedLanes & 335544128) === committedLanes || maySuspendCommitInSyncRender(type, fiber)) && suspendInstance(suspendedState, instance, type, fiber));
          break;
        case 3:
        case 4:
          supportsResources ? (instance = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(fiber.stateNode.containerInfo), recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState), currentHoistableRoot = instance) : recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
          break;
        case 22:
          fiber.memoizedState === null && (instance = fiber.alternate, instance !== null && instance.memoizedState !== null ? (instance = suspenseyCommitFlag, suspenseyCommitFlag = 16777216, recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState), suspenseyCommitFlag = instance) : recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState));
          break;
        default:
          recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
      }
    }
    function detachAlternateSiblings(parentFiber) {
      var previousFiber = parentFiber.alternate;
      if (previousFiber !== null && (parentFiber = previousFiber.child, parentFiber !== null)) {
        previousFiber.child = null;
        do
          previousFiber = parentFiber.sibling, parentFiber.sibling = null, parentFiber = previousFiber;
        while (parentFiber !== null);
      }
    }
    function recursivelyTraversePassiveUnmountEffects(parentFiber) {
      var deletions = parentFiber.deletions;
      if ((parentFiber.flags & 16) !== 0) {
        if (deletions !== null)
          for (var i = 0;i < deletions.length; i++) {
            var childToDelete = deletions[i];
            nextEffect = childToDelete;
            commitPassiveUnmountEffectsInsideOfDeletedTree_begin(childToDelete, parentFiber);
          }
        detachAlternateSiblings(parentFiber);
      }
      if (parentFiber.subtreeFlags & 10256)
        for (parentFiber = parentFiber.child;parentFiber !== null; )
          commitPassiveUnmountOnFiber(parentFiber), parentFiber = parentFiber.sibling;
    }
    function commitPassiveUnmountOnFiber(finishedWork) {
      switch (finishedWork.tag) {
        case 0:
        case 11:
        case 15:
          recursivelyTraversePassiveUnmountEffects(finishedWork);
          finishedWork.flags & 2048 && commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
          break;
        case 3:
          recursivelyTraversePassiveUnmountEffects(finishedWork);
          break;
        case 12:
          recursivelyTraversePassiveUnmountEffects(finishedWork);
          break;
        case 22:
          var instance = finishedWork.stateNode;
          finishedWork.memoizedState !== null && instance._visibility & 2 && (finishedWork.return === null || finishedWork.return.tag !== 13) ? (instance._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(finishedWork)) : recursivelyTraversePassiveUnmountEffects(finishedWork);
          break;
        default:
          recursivelyTraversePassiveUnmountEffects(finishedWork);
      }
    }
    function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
      var deletions = parentFiber.deletions;
      if ((parentFiber.flags & 16) !== 0) {
        if (deletions !== null)
          for (var i = 0;i < deletions.length; i++) {
            var childToDelete = deletions[i];
            nextEffect = childToDelete;
            commitPassiveUnmountEffectsInsideOfDeletedTree_begin(childToDelete, parentFiber);
          }
        detachAlternateSiblings(parentFiber);
      }
      for (parentFiber = parentFiber.child;parentFiber !== null; ) {
        deletions = parentFiber;
        switch (deletions.tag) {
          case 0:
          case 11:
          case 15:
            commitHookEffectListUnmount(8, deletions, deletions.return);
            recursivelyTraverseDisconnectPassiveEffects(deletions);
            break;
          case 22:
            i = deletions.stateNode;
            i._visibility & 2 && (i._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(deletions));
            break;
          default:
            recursivelyTraverseDisconnectPassiveEffects(deletions);
        }
        parentFiber = parentFiber.sibling;
      }
    }
    function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
      for (;nextEffect !== null; ) {
        var fiber = nextEffect;
        switch (fiber.tag) {
          case 0:
          case 11:
          case 15:
            commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
            break;
          case 23:
          case 22:
            if (fiber.memoizedState !== null && fiber.memoizedState.cachePool !== null) {
              var cache = fiber.memoizedState.cachePool.pool;
              cache != null && cache.refCount++;
            }
            break;
          case 24:
            releaseCache(fiber.memoizedState.cache);
        }
        cache = fiber.child;
        if (cache !== null)
          cache.return = fiber, nextEffect = cache;
        else
          a:
            for (fiber = deletedSubtreeRoot;nextEffect !== null; ) {
              cache = nextEffect;
              var { sibling, return: returnFiber } = cache;
              detachFiberAfterEffects(cache);
              if (cache === fiber) {
                nextEffect = null;
                break a;
              }
              if (sibling !== null) {
                sibling.return = returnFiber;
                nextEffect = sibling;
                break a;
              }
              nextEffect = returnFiber;
            }
      }
    }
    function findFiberRootForHostRoot(hostRoot) {
      var maybeFiber = getInstanceFromNode(hostRoot);
      if (maybeFiber != null) {
        if (typeof maybeFiber.memoizedProps["data-testname"] !== "string")
          throw Error(formatProdErrorMessage(364));
        return maybeFiber;
      }
      hostRoot = findFiberRoot(hostRoot);
      if (hostRoot === null)
        throw Error(formatProdErrorMessage(362));
      return hostRoot.stateNode.current;
    }
    function matchSelector(fiber$jscomp$0, selector) {
      var tag = fiber$jscomp$0.tag;
      switch (selector.$$typeof) {
        case COMPONENT_TYPE:
          if (fiber$jscomp$0.type === selector.value)
            return true;
          break;
        case HAS_PSEUDO_CLASS_TYPE:
          a: {
            selector = selector.value;
            fiber$jscomp$0 = [fiber$jscomp$0, 0];
            for (tag = 0;tag < fiber$jscomp$0.length; ) {
              var fiber = fiber$jscomp$0[tag++], tag$jscomp$0 = fiber.tag, selectorIndex = fiber$jscomp$0[tag++], selector$jscomp$0 = selector[selectorIndex];
              if (tag$jscomp$0 !== 5 && tag$jscomp$0 !== 26 && tag$jscomp$0 !== 27 || !isHiddenSubtree(fiber)) {
                for (;selector$jscomp$0 != null && matchSelector(fiber, selector$jscomp$0); )
                  selectorIndex++, selector$jscomp$0 = selector[selectorIndex];
                if (selectorIndex === selector.length) {
                  selector = true;
                  break a;
                } else
                  for (fiber = fiber.child;fiber !== null; )
                    fiber$jscomp$0.push(fiber, selectorIndex), fiber = fiber.sibling;
              }
            }
            selector = false;
          }
          return selector;
        case ROLE_TYPE:
          if ((tag === 5 || tag === 26 || tag === 27) && matchAccessibilityRole(fiber$jscomp$0.stateNode, selector.value))
            return true;
          break;
        case TEXT_TYPE:
          if (tag === 5 || tag === 6 || tag === 26 || tag === 27) {
            if (fiber$jscomp$0 = getTextContent(fiber$jscomp$0), fiber$jscomp$0 !== null && 0 <= fiber$jscomp$0.indexOf(selector.value))
              return true;
          }
          break;
        case TEST_NAME_TYPE:
          if (tag === 5 || tag === 26 || tag === 27) {
            if (fiber$jscomp$0 = fiber$jscomp$0.memoizedProps["data-testname"], typeof fiber$jscomp$0 === "string" && fiber$jscomp$0.toLowerCase() === selector.value.toLowerCase())
              return true;
          }
          break;
        default:
          throw Error(formatProdErrorMessage(365));
      }
      return false;
    }
    function selectorToString(selector) {
      switch (selector.$$typeof) {
        case COMPONENT_TYPE:
          return "<" + (getComponentNameFromType(selector.value) || "Unknown") + ">";
        case HAS_PSEUDO_CLASS_TYPE:
          return ":has(" + (selectorToString(selector) || "") + ")";
        case ROLE_TYPE:
          return '[role="' + selector.value + '"]';
        case TEXT_TYPE:
          return '"' + selector.value + '"';
        case TEST_NAME_TYPE:
          return '[data-testname="' + selector.value + '"]';
        default:
          throw Error(formatProdErrorMessage(365));
      }
    }
    function findPaths(root, selectors) {
      var matchingFibers = [];
      root = [root, 0];
      for (var index = 0;index < root.length; ) {
        var fiber = root[index++], tag = fiber.tag, selectorIndex = root[index++], selector = selectors[selectorIndex];
        if (tag !== 5 && tag !== 26 && tag !== 27 || !isHiddenSubtree(fiber)) {
          for (;selector != null && matchSelector(fiber, selector); )
            selectorIndex++, selector = selectors[selectorIndex];
          if (selectorIndex === selectors.length)
            matchingFibers.push(fiber);
          else
            for (fiber = fiber.child;fiber !== null; )
              root.push(fiber, selectorIndex), fiber = fiber.sibling;
        }
      }
      return matchingFibers;
    }
    function findAllNodes(hostRoot, selectors) {
      if (!supportsTestSelectors)
        throw Error(formatProdErrorMessage(363));
      hostRoot = findFiberRootForHostRoot(hostRoot);
      hostRoot = findPaths(hostRoot, selectors);
      selectors = [];
      hostRoot = Array.from(hostRoot);
      for (var index = 0;index < hostRoot.length; ) {
        var node = hostRoot[index++], tag = node.tag;
        if (tag === 5 || tag === 26 || tag === 27)
          isHiddenSubtree(node) || selectors.push(node.stateNode);
        else
          for (node = node.child;node !== null; )
            hostRoot.push(node), node = node.sibling;
      }
      return selectors;
    }
    function requestUpdateLane() {
      return (executionContext & 2) !== 0 && workInProgressRootRenderLanes !== 0 ? workInProgressRootRenderLanes & -workInProgressRootRenderLanes : ReactSharedInternals2.T !== null ? requestTransitionLane() : resolveUpdatePriority();
    }
    function requestDeferredLane() {
      if (workInProgressDeferredLane === 0)
        if ((workInProgressRootRenderLanes & 536870912) === 0 || isHydrating) {
          var lane = nextTransitionDeferredLane;
          nextTransitionDeferredLane <<= 1;
          (nextTransitionDeferredLane & 3932160) === 0 && (nextTransitionDeferredLane = 262144);
          workInProgressDeferredLane = lane;
        } else
          workInProgressDeferredLane = 536870912;
      lane = suspenseHandlerStackCursor.current;
      lane !== null && (lane.flags |= 32);
      return workInProgressDeferredLane;
    }
    function scheduleUpdateOnFiber(root, fiber, lane) {
      if (root === workInProgressRoot && (workInProgressSuspendedReason === 2 || workInProgressSuspendedReason === 9) || root.cancelPendingCommit !== null)
        prepareFreshStack(root, 0), markRootSuspended(root, workInProgressRootRenderLanes, workInProgressDeferredLane, false);
      markRootUpdated$1(root, lane);
      if ((executionContext & 2) === 0 || root !== workInProgressRoot)
        root === workInProgressRoot && ((executionContext & 2) === 0 && (workInProgressRootInterleavedUpdatedLanes |= lane), workInProgressRootExitStatus === 4 && markRootSuspended(root, workInProgressRootRenderLanes, workInProgressDeferredLane, false)), ensureRootIsScheduled(root);
    }
    function performWorkOnRoot(root$jscomp$0, lanes, forceSync) {
      if ((executionContext & 6) !== 0)
        throw Error(formatProdErrorMessage(327));
      var shouldTimeSlice = !forceSync && (lanes & 127) === 0 && (lanes & root$jscomp$0.expiredLanes) === 0 || checkIfRootIsPrerendering(root$jscomp$0, lanes), exitStatus = shouldTimeSlice ? renderRootConcurrent(root$jscomp$0, lanes) : renderRootSync(root$jscomp$0, lanes, true), renderWasConcurrent = shouldTimeSlice;
      do {
        if (exitStatus === 0) {
          workInProgressRootIsPrerendering && !shouldTimeSlice && markRootSuspended(root$jscomp$0, lanes, 0, false);
          break;
        } else {
          forceSync = root$jscomp$0.current.alternate;
          if (renderWasConcurrent && !isRenderConsistentWithExternalStores(forceSync)) {
            exitStatus = renderRootSync(root$jscomp$0, lanes, false);
            renderWasConcurrent = false;
            continue;
          }
          if (exitStatus === 2) {
            renderWasConcurrent = lanes;
            if (root$jscomp$0.errorRecoveryDisabledLanes & renderWasConcurrent)
              var JSCompiler_inline_result = 0;
            else
              JSCompiler_inline_result = root$jscomp$0.pendingLanes & -536870913, JSCompiler_inline_result = JSCompiler_inline_result !== 0 ? JSCompiler_inline_result : JSCompiler_inline_result & 536870912 ? 536870912 : 0;
            if (JSCompiler_inline_result !== 0) {
              lanes = JSCompiler_inline_result;
              a: {
                var root = root$jscomp$0;
                exitStatus = workInProgressRootConcurrentErrors;
                var wasRootDehydrated = supportsHydration && root.current.memoizedState.isDehydrated;
                wasRootDehydrated && (prepareFreshStack(root, JSCompiler_inline_result).flags |= 256);
                JSCompiler_inline_result = renderRootSync(root, JSCompiler_inline_result, false);
                if (JSCompiler_inline_result !== 2) {
                  if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
                    root.errorRecoveryDisabledLanes |= renderWasConcurrent;
                    workInProgressRootInterleavedUpdatedLanes |= renderWasConcurrent;
                    exitStatus = 4;
                    break a;
                  }
                  renderWasConcurrent = workInProgressRootRecoverableErrors;
                  workInProgressRootRecoverableErrors = exitStatus;
                  renderWasConcurrent !== null && (workInProgressRootRecoverableErrors === null ? workInProgressRootRecoverableErrors = renderWasConcurrent : workInProgressRootRecoverableErrors.push.apply(workInProgressRootRecoverableErrors, renderWasConcurrent));
                }
                exitStatus = JSCompiler_inline_result;
              }
              renderWasConcurrent = false;
              if (exitStatus !== 2)
                continue;
            }
          }
          if (exitStatus === 1) {
            prepareFreshStack(root$jscomp$0, 0);
            markRootSuspended(root$jscomp$0, lanes, 0, true);
            break;
          }
          a: {
            shouldTimeSlice = root$jscomp$0;
            renderWasConcurrent = exitStatus;
            switch (renderWasConcurrent) {
              case 0:
              case 1:
                throw Error(formatProdErrorMessage(345));
              case 4:
                if ((lanes & 4194048) !== lanes)
                  break;
              case 6:
                markRootSuspended(shouldTimeSlice, lanes, workInProgressDeferredLane, !workInProgressRootDidSkipSuspendedSiblings);
                break a;
              case 2:
                workInProgressRootRecoverableErrors = null;
                break;
              case 3:
              case 5:
                break;
              default:
                throw Error(formatProdErrorMessage(329));
            }
            if ((lanes & 62914560) === lanes && (exitStatus = globalMostRecentFallbackTime + 300 - now2(), 10 < exitStatus)) {
              markRootSuspended(shouldTimeSlice, lanes, workInProgressDeferredLane, !workInProgressRootDidSkipSuspendedSiblings);
              if (getNextLanes(shouldTimeSlice, 0, true) !== 0)
                break a;
              pendingEffectsLanes = lanes;
              shouldTimeSlice.timeoutHandle = scheduleTimeout(commitRootWhenReady.bind(null, shouldTimeSlice, forceSync, workInProgressRootRecoverableErrors, workInProgressTransitions, workInProgressRootDidIncludeRecursiveRenderUpdate, lanes, workInProgressDeferredLane, workInProgressRootInterleavedUpdatedLanes, workInProgressSuspendedRetryLanes, workInProgressRootDidSkipSuspendedSiblings, renderWasConcurrent, "Throttled", -0, 0), exitStatus);
              break a;
            }
            commitRootWhenReady(shouldTimeSlice, forceSync, workInProgressRootRecoverableErrors, workInProgressTransitions, workInProgressRootDidIncludeRecursiveRenderUpdate, lanes, workInProgressDeferredLane, workInProgressRootInterleavedUpdatedLanes, workInProgressSuspendedRetryLanes, workInProgressRootDidSkipSuspendedSiblings, renderWasConcurrent, null, -0, 0);
          }
        }
        break;
      } while (1);
      ensureRootIsScheduled(root$jscomp$0);
    }
    function commitRootWhenReady(root, finishedWork, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedCommitReason, completedRenderStartTime, completedRenderEndTime) {
      root.timeoutHandle = noTimeout;
      suspendedCommitReason = finishedWork.subtreeFlags;
      if (suspendedCommitReason & 8192 || (suspendedCommitReason & 16785408) === 16785408) {
        suspendedCommitReason = startSuspendingCommit();
        accumulateSuspenseyCommitOnFiber(finishedWork, lanes, suspendedCommitReason);
        var timeoutOffset = (lanes & 62914560) === lanes ? globalMostRecentFallbackTime - now2() : (lanes & 4194048) === lanes ? globalMostRecentTransitionTime - now2() : 0;
        timeoutOffset = waitForCommitToBeReady(suspendedCommitReason, timeoutOffset);
        if (timeoutOffset !== null) {
          pendingEffectsLanes = lanes;
          root.cancelPendingCommit = timeoutOffset(commitRoot.bind(null, root, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes, exitStatus, suspendedCommitReason, null, completedRenderStartTime, completedRenderEndTime));
          markRootSuspended(root, lanes, spawnedLane, !didSkipSuspendedSiblings);
          return;
        }
      }
      commitRoot(root, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes);
    }
    function isRenderConsistentWithExternalStores(finishedWork) {
      for (var node = finishedWork;; ) {
        var tag = node.tag;
        if ((tag === 0 || tag === 11 || tag === 15) && node.flags & 16384 && (tag = node.updateQueue, tag !== null && (tag = tag.stores, tag !== null)))
          for (var i = 0;i < tag.length; i++) {
            var check = tag[i], getSnapshot = check.getSnapshot;
            check = check.value;
            try {
              if (!objectIs(getSnapshot(), check))
                return false;
            } catch (error) {
              return false;
            }
          }
        tag = node.child;
        if (node.subtreeFlags & 16384 && tag !== null)
          tag.return = node, node = tag;
        else {
          if (node === finishedWork)
            break;
          for (;node.sibling === null; ) {
            if (node.return === null || node.return === finishedWork)
              return true;
            node = node.return;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
      }
      return true;
    }
    function markRootSuspended(root, suspendedLanes, spawnedLane, didAttemptEntireTree) {
      suspendedLanes &= ~workInProgressRootPingedLanes;
      suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
      root.suspendedLanes |= suspendedLanes;
      root.pingedLanes &= ~suspendedLanes;
      didAttemptEntireTree && (root.warmLanes |= suspendedLanes);
      didAttemptEntireTree = root.expirationTimes;
      for (var lanes = suspendedLanes;0 < lanes; ) {
        var index$4 = 31 - clz32(lanes), lane = 1 << index$4;
        didAttemptEntireTree[index$4] = -1;
        lanes &= ~lane;
      }
      spawnedLane !== 0 && markSpawnedDeferredLane(root, spawnedLane, suspendedLanes);
    }
    function flushSyncWork() {
      return (executionContext & 6) === 0 ? (flushSyncWorkAcrossRoots_impl(0, false), false) : true;
    }
    function resetWorkInProgressStack() {
      if (workInProgress !== null) {
        if (workInProgressSuspendedReason === 0)
          var interruptedWork = workInProgress.return;
        else
          interruptedWork = workInProgress, lastContextDependency = currentlyRenderingFiber$1 = null, resetHooksOnUnwind(interruptedWork), thenableState$1 = null, thenableIndexCounter$1 = 0, interruptedWork = workInProgress;
        for (;interruptedWork !== null; )
          unwindInterruptedWork(interruptedWork.alternate, interruptedWork), interruptedWork = interruptedWork.return;
        workInProgress = null;
      }
    }
    function prepareFreshStack(root, lanes) {
      var timeoutHandle = root.timeoutHandle;
      timeoutHandle !== noTimeout && (root.timeoutHandle = noTimeout, cancelTimeout(timeoutHandle));
      timeoutHandle = root.cancelPendingCommit;
      timeoutHandle !== null && (root.cancelPendingCommit = null, timeoutHandle());
      pendingEffectsLanes = 0;
      resetWorkInProgressStack();
      workInProgressRoot = root;
      workInProgress = timeoutHandle = createWorkInProgress(root.current, null);
      workInProgressRootRenderLanes = lanes;
      workInProgressSuspendedReason = 0;
      workInProgressThrownValue = null;
      workInProgressRootDidSkipSuspendedSiblings = false;
      workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root, lanes);
      workInProgressRootDidAttachPingListener = false;
      workInProgressSuspendedRetryLanes = workInProgressDeferredLane = workInProgressRootPingedLanes = workInProgressRootInterleavedUpdatedLanes = workInProgressRootSkippedLanes = workInProgressRootExitStatus = 0;
      workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors = null;
      workInProgressRootDidIncludeRecursiveRenderUpdate = false;
      (lanes & 8) !== 0 && (lanes |= lanes & 32);
      var allEntangledLanes = root.entangledLanes;
      if (allEntangledLanes !== 0)
        for (root = root.entanglements, allEntangledLanes &= lanes;0 < allEntangledLanes; ) {
          var index$2 = 31 - clz32(allEntangledLanes), lane = 1 << index$2;
          lanes |= root[index$2];
          allEntangledLanes &= ~lane;
        }
      entangledRenderLanes = lanes;
      finishQueueingConcurrentUpdates();
      return timeoutHandle;
    }
    function handleThrow(root, thrownValue) {
      currentlyRenderingFiber = null;
      ReactSharedInternals2.H = ContextOnlyDispatcher;
      thrownValue === SuspenseException || thrownValue === SuspenseActionException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 3) : thrownValue === SuspenseyCommitException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 4) : workInProgressSuspendedReason = thrownValue === SelectiveHydrationException ? 8 : thrownValue !== null && typeof thrownValue === "object" && typeof thrownValue.then === "function" ? 6 : 1;
      workInProgressThrownValue = thrownValue;
      workInProgress === null && (workInProgressRootExitStatus = 1, logUncaughtError(root, createCapturedValueAtFiber(thrownValue, root.current)));
    }
    function shouldRemainOnPreviousScreen() {
      var handler = suspenseHandlerStackCursor.current;
      return handler === null ? true : (workInProgressRootRenderLanes & 4194048) === workInProgressRootRenderLanes ? shellBoundary === null ? true : false : (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes || (workInProgressRootRenderLanes & 536870912) !== 0 ? handler === shellBoundary : false;
    }
    function pushDispatcher() {
      var prevDispatcher = ReactSharedInternals2.H;
      ReactSharedInternals2.H = ContextOnlyDispatcher;
      return prevDispatcher === null ? ContextOnlyDispatcher : prevDispatcher;
    }
    function pushAsyncDispatcher() {
      var prevAsyncDispatcher = ReactSharedInternals2.A;
      ReactSharedInternals2.A = DefaultAsyncDispatcher;
      return prevAsyncDispatcher;
    }
    function renderDidSuspendDelayIfPossible() {
      workInProgressRootExitStatus = 4;
      workInProgressRootDidSkipSuspendedSiblings || (workInProgressRootRenderLanes & 4194048) !== workInProgressRootRenderLanes && suspenseHandlerStackCursor.current !== null || (workInProgressRootIsPrerendering = true);
      (workInProgressRootSkippedLanes & 134217727) === 0 && (workInProgressRootInterleavedUpdatedLanes & 134217727) === 0 || workInProgressRoot === null || markRootSuspended(workInProgressRoot, workInProgressRootRenderLanes, workInProgressDeferredLane, false);
    }
    function renderRootSync(root, lanes, shouldYieldForPrerendering) {
      var prevExecutionContext = executionContext;
      executionContext |= 2;
      var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
      if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes)
        workInProgressTransitions = null, prepareFreshStack(root, lanes);
      lanes = false;
      var exitStatus = workInProgressRootExitStatus;
      a:
        do
          try {
            if (workInProgressSuspendedReason !== 0 && workInProgress !== null) {
              var unitOfWork = workInProgress, thrownValue = workInProgressThrownValue;
              switch (workInProgressSuspendedReason) {
                case 8:
                  resetWorkInProgressStack();
                  exitStatus = 6;
                  break a;
                case 3:
                case 2:
                case 9:
                case 6:
                  suspenseHandlerStackCursor.current === null && (lanes = true);
                  var reason = workInProgressSuspendedReason;
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, reason);
                  if (shouldYieldForPrerendering && workInProgressRootIsPrerendering) {
                    exitStatus = 0;
                    break a;
                  }
                  break;
                default:
                  reason = workInProgressSuspendedReason, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, reason);
              }
            }
            workLoopSync();
            exitStatus = workInProgressRootExitStatus;
            break;
          } catch (thrownValue$152) {
            handleThrow(root, thrownValue$152);
          }
        while (1);
      lanes && root.shellSuspendCounter++;
      lastContextDependency = currentlyRenderingFiber$1 = null;
      executionContext = prevExecutionContext;
      ReactSharedInternals2.H = prevDispatcher;
      ReactSharedInternals2.A = prevAsyncDispatcher;
      workInProgress === null && (workInProgressRoot = null, workInProgressRootRenderLanes = 0, finishQueueingConcurrentUpdates());
      return exitStatus;
    }
    function workLoopSync() {
      for (;workInProgress !== null; )
        performUnitOfWork(workInProgress);
    }
    function renderRootConcurrent(root, lanes) {
      var prevExecutionContext = executionContext;
      executionContext |= 2;
      var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
      workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes ? (workInProgressTransitions = null, workInProgressRootRenderTargetTime = now2() + 500, prepareFreshStack(root, lanes)) : workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root, lanes);
      a:
        do
          try {
            if (workInProgressSuspendedReason !== 0 && workInProgress !== null) {
              lanes = workInProgress;
              var thrownValue = workInProgressThrownValue;
              b:
                switch (workInProgressSuspendedReason) {
                  case 1:
                    workInProgressSuspendedReason = 0;
                    workInProgressThrownValue = null;
                    throwAndUnwindWorkLoop(root, lanes, thrownValue, 1);
                    break;
                  case 2:
                  case 9:
                    if (isThenableResolved(thrownValue)) {
                      workInProgressSuspendedReason = 0;
                      workInProgressThrownValue = null;
                      replaySuspendedUnitOfWork(lanes);
                      break;
                    }
                    lanes = function() {
                      workInProgressSuspendedReason !== 2 && workInProgressSuspendedReason !== 9 || workInProgressRoot !== root || (workInProgressSuspendedReason = 7);
                      ensureRootIsScheduled(root);
                    };
                    thrownValue.then(lanes, lanes);
                    break a;
                  case 3:
                    workInProgressSuspendedReason = 7;
                    break a;
                  case 4:
                    workInProgressSuspendedReason = 5;
                    break a;
                  case 7:
                    isThenableResolved(thrownValue) ? (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, replaySuspendedUnitOfWork(lanes)) : (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root, lanes, thrownValue, 7));
                    break;
                  case 5:
                    var resource = null;
                    switch (workInProgress.tag) {
                      case 26:
                        resource = workInProgress.memoizedState;
                      case 5:
                      case 27:
                        var hostFiber = workInProgress, type = hostFiber.type, props = hostFiber.pendingProps;
                        if (resource ? preloadResource(resource) : preloadInstance(hostFiber.stateNode, type, props)) {
                          workInProgressSuspendedReason = 0;
                          workInProgressThrownValue = null;
                          var sibling = hostFiber.sibling;
                          if (sibling !== null)
                            workInProgress = sibling;
                          else {
                            var returnFiber = hostFiber.return;
                            returnFiber !== null ? (workInProgress = returnFiber, completeUnitOfWork(returnFiber)) : workInProgress = null;
                          }
                          break b;
                        }
                    }
                    workInProgressSuspendedReason = 0;
                    workInProgressThrownValue = null;
                    throwAndUnwindWorkLoop(root, lanes, thrownValue, 5);
                    break;
                  case 6:
                    workInProgressSuspendedReason = 0;
                    workInProgressThrownValue = null;
                    throwAndUnwindWorkLoop(root, lanes, thrownValue, 6);
                    break;
                  case 8:
                    resetWorkInProgressStack();
                    workInProgressRootExitStatus = 6;
                    break a;
                  default:
                    throw Error(formatProdErrorMessage(462));
                }
            }
            workLoopConcurrentByScheduler();
            break;
          } catch (thrownValue$154) {
            handleThrow(root, thrownValue$154);
          }
        while (1);
      lastContextDependency = currentlyRenderingFiber$1 = null;
      ReactSharedInternals2.H = prevDispatcher;
      ReactSharedInternals2.A = prevAsyncDispatcher;
      executionContext = prevExecutionContext;
      if (workInProgress !== null)
        return 0;
      workInProgressRoot = null;
      workInProgressRootRenderLanes = 0;
      finishQueueingConcurrentUpdates();
      return workInProgressRootExitStatus;
    }
    function workLoopConcurrentByScheduler() {
      for (;workInProgress !== null && !shouldYield(); )
        performUnitOfWork(workInProgress);
    }
    function performUnitOfWork(unitOfWork) {
      var next = beginWork(unitOfWork.alternate, unitOfWork, entangledRenderLanes);
      unitOfWork.memoizedProps = unitOfWork.pendingProps;
      next === null ? completeUnitOfWork(unitOfWork) : workInProgress = next;
    }
    function replaySuspendedUnitOfWork(unitOfWork) {
      var next = unitOfWork;
      var current = next.alternate;
      switch (next.tag) {
        case 15:
        case 0:
          next = replayFunctionComponent(current, next, next.pendingProps, next.type, undefined, workInProgressRootRenderLanes);
          break;
        case 11:
          next = replayFunctionComponent(current, next, next.pendingProps, next.type.render, next.ref, workInProgressRootRenderLanes);
          break;
        case 5:
          resetHooksOnUnwind(next);
        default:
          unwindInterruptedWork(current, next), next = workInProgress = resetWorkInProgress(next, entangledRenderLanes), next = beginWork(current, next, entangledRenderLanes);
      }
      unitOfWork.memoizedProps = unitOfWork.pendingProps;
      next === null ? completeUnitOfWork(unitOfWork) : workInProgress = next;
    }
    function throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, suspendedReason) {
      lastContextDependency = currentlyRenderingFiber$1 = null;
      resetHooksOnUnwind(unitOfWork);
      thenableState$1 = null;
      thenableIndexCounter$1 = 0;
      var returnFiber = unitOfWork.return;
      try {
        if (throwException(root, returnFiber, unitOfWork, thrownValue, workInProgressRootRenderLanes)) {
          workInProgressRootExitStatus = 1;
          logUncaughtError(root, createCapturedValueAtFiber(thrownValue, root.current));
          workInProgress = null;
          return;
        }
      } catch (error) {
        if (returnFiber !== null)
          throw workInProgress = returnFiber, error;
        workInProgressRootExitStatus = 1;
        logUncaughtError(root, createCapturedValueAtFiber(thrownValue, root.current));
        workInProgress = null;
        return;
      }
      if (unitOfWork.flags & 32768) {
        if (isHydrating || suspendedReason === 1)
          root = true;
        else if (workInProgressRootIsPrerendering || (workInProgressRootRenderLanes & 536870912) !== 0)
          root = false;
        else if (workInProgressRootDidSkipSuspendedSiblings = root = true, suspendedReason === 2 || suspendedReason === 9 || suspendedReason === 3 || suspendedReason === 6)
          suspendedReason = suspenseHandlerStackCursor.current, suspendedReason !== null && suspendedReason.tag === 13 && (suspendedReason.flags |= 16384);
        unwindUnitOfWork(unitOfWork, root);
      } else
        completeUnitOfWork(unitOfWork);
    }
    function completeUnitOfWork(unitOfWork) {
      var completedWork = unitOfWork;
      do {
        if ((completedWork.flags & 32768) !== 0) {
          unwindUnitOfWork(completedWork, workInProgressRootDidSkipSuspendedSiblings);
          return;
        }
        unitOfWork = completedWork.return;
        var next = completeWork(completedWork.alternate, completedWork, entangledRenderLanes);
        if (next !== null) {
          workInProgress = next;
          return;
        }
        completedWork = completedWork.sibling;
        if (completedWork !== null) {
          workInProgress = completedWork;
          return;
        }
        workInProgress = completedWork = unitOfWork;
      } while (completedWork !== null);
      workInProgressRootExitStatus === 0 && (workInProgressRootExitStatus = 5);
    }
    function unwindUnitOfWork(unitOfWork, skipSiblings) {
      do {
        var next = unwindWork(unitOfWork.alternate, unitOfWork);
        if (next !== null) {
          next.flags &= 32767;
          workInProgress = next;
          return;
        }
        next = unitOfWork.return;
        next !== null && (next.flags |= 32768, next.subtreeFlags = 0, next.deletions = null);
        if (!skipSiblings && (unitOfWork = unitOfWork.sibling, unitOfWork !== null)) {
          workInProgress = unitOfWork;
          return;
        }
        workInProgress = unitOfWork = next;
      } while (unitOfWork !== null);
      workInProgressRootExitStatus = 6;
      workInProgress = null;
    }
    function commitRoot(root, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes) {
      root.cancelPendingCommit = null;
      do
        flushPendingEffects();
      while (pendingEffectsStatus !== 0);
      if ((executionContext & 6) !== 0)
        throw Error(formatProdErrorMessage(327));
      if (finishedWork !== null) {
        if (finishedWork === root.current)
          throw Error(formatProdErrorMessage(177));
        didIncludeRenderPhaseUpdate = finishedWork.lanes | finishedWork.childLanes;
        didIncludeRenderPhaseUpdate |= concurrentlyUpdatedLanes;
        markRootFinished(root, lanes, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes);
        root === workInProgressRoot && (workInProgress = workInProgressRoot = null, workInProgressRootRenderLanes = 0);
        pendingFinishedWork = finishedWork;
        pendingEffectsRoot = root;
        pendingEffectsLanes = lanes;
        pendingEffectsRemainingLanes = didIncludeRenderPhaseUpdate;
        pendingPassiveTransitions = transitions;
        pendingRecoverableErrors = recoverableErrors;
        (finishedWork.subtreeFlags & 10256) !== 0 || (finishedWork.flags & 10256) !== 0 ? (root.callbackNode = null, root.callbackPriority = 0, scheduleCallback(NormalPriority$1, function() {
          flushPassiveEffects();
          return null;
        })) : (root.callbackNode = null, root.callbackPriority = 0);
        recoverableErrors = (finishedWork.flags & 13878) !== 0;
        if ((finishedWork.subtreeFlags & 13878) !== 0 || recoverableErrors) {
          recoverableErrors = ReactSharedInternals2.T;
          ReactSharedInternals2.T = null;
          transitions = getCurrentUpdatePriority();
          setCurrentUpdatePriority(2);
          spawnedLane = executionContext;
          executionContext |= 4;
          try {
            commitBeforeMutationEffects(root, finishedWork, lanes);
          } finally {
            executionContext = spawnedLane, setCurrentUpdatePriority(transitions), ReactSharedInternals2.T = recoverableErrors;
          }
        }
        pendingEffectsStatus = 1;
        flushMutationEffects();
        flushLayoutEffects();
        flushSpawnedWork();
      }
    }
    function flushMutationEffects() {
      if (pendingEffectsStatus === 1) {
        pendingEffectsStatus = 0;
        var root = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootMutationHasEffect = (finishedWork.flags & 13878) !== 0;
        if ((finishedWork.subtreeFlags & 13878) !== 0 || rootMutationHasEffect) {
          rootMutationHasEffect = ReactSharedInternals2.T;
          ReactSharedInternals2.T = null;
          var previousPriority = getCurrentUpdatePriority();
          setCurrentUpdatePriority(2);
          var prevExecutionContext = executionContext;
          executionContext |= 4;
          try {
            commitMutationEffectsOnFiber(finishedWork, root), resetAfterCommit(root.containerInfo);
          } finally {
            executionContext = prevExecutionContext, setCurrentUpdatePriority(previousPriority), ReactSharedInternals2.T = rootMutationHasEffect;
          }
        }
        root.current = finishedWork;
        pendingEffectsStatus = 2;
      }
    }
    function flushLayoutEffects() {
      if (pendingEffectsStatus === 2) {
        pendingEffectsStatus = 0;
        var root = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootHasLayoutEffect = (finishedWork.flags & 8772) !== 0;
        if ((finishedWork.subtreeFlags & 8772) !== 0 || rootHasLayoutEffect) {
          rootHasLayoutEffect = ReactSharedInternals2.T;
          ReactSharedInternals2.T = null;
          var previousPriority = getCurrentUpdatePriority();
          setCurrentUpdatePriority(2);
          var prevExecutionContext = executionContext;
          executionContext |= 4;
          try {
            commitLayoutEffectOnFiber(root, finishedWork.alternate, finishedWork);
          } finally {
            executionContext = prevExecutionContext, setCurrentUpdatePriority(previousPriority), ReactSharedInternals2.T = rootHasLayoutEffect;
          }
        }
        pendingEffectsStatus = 3;
      }
    }
    function flushSpawnedWork() {
      if (pendingEffectsStatus === 4 || pendingEffectsStatus === 3) {
        pendingEffectsStatus = 0;
        requestPaint();
        var root = pendingEffectsRoot, finishedWork = pendingFinishedWork, lanes = pendingEffectsLanes, recoverableErrors = pendingRecoverableErrors;
        (finishedWork.subtreeFlags & 10256) !== 0 || (finishedWork.flags & 10256) !== 0 ? pendingEffectsStatus = 5 : (pendingEffectsStatus = 0, pendingFinishedWork = pendingEffectsRoot = null, releaseRootPooledCache(root, root.pendingLanes));
        var remainingLanes = root.pendingLanes;
        remainingLanes === 0 && (legacyErrorBoundariesThatAlreadyFailed = null);
        lanesToEventPriority(lanes);
        finishedWork = finishedWork.stateNode;
        if (injectedHook && typeof injectedHook.onCommitFiberRoot === "function")
          try {
            injectedHook.onCommitFiberRoot(rendererID, finishedWork, undefined, (finishedWork.current.flags & 128) === 128);
          } catch (err) {}
        if (recoverableErrors !== null) {
          finishedWork = ReactSharedInternals2.T;
          remainingLanes = getCurrentUpdatePriority();
          setCurrentUpdatePriority(2);
          ReactSharedInternals2.T = null;
          try {
            for (var onRecoverableError = root.onRecoverableError, i = 0;i < recoverableErrors.length; i++) {
              var recoverableError = recoverableErrors[i];
              onRecoverableError(recoverableError.value, {
                componentStack: recoverableError.stack
              });
            }
          } finally {
            ReactSharedInternals2.T = finishedWork, setCurrentUpdatePriority(remainingLanes);
          }
        }
        (pendingEffectsLanes & 3) !== 0 && flushPendingEffects();
        ensureRootIsScheduled(root);
        remainingLanes = root.pendingLanes;
        (lanes & 261930) !== 0 && (remainingLanes & 42) !== 0 ? root === rootWithNestedUpdates ? nestedUpdateCount++ : (nestedUpdateCount = 0, rootWithNestedUpdates = root) : nestedUpdateCount = 0;
        supportsHydration && flushHydrationEvents();
        flushSyncWorkAcrossRoots_impl(0, false);
      }
    }
    function releaseRootPooledCache(root, remainingLanes) {
      (root.pooledCacheLanes &= remainingLanes) === 0 && (remainingLanes = root.pooledCache, remainingLanes != null && (root.pooledCache = null, releaseCache(remainingLanes)));
    }
    function flushPendingEffects() {
      flushMutationEffects();
      flushLayoutEffects();
      flushSpawnedWork();
      return flushPassiveEffects();
    }
    function flushPassiveEffects() {
      if (pendingEffectsStatus !== 5)
        return false;
      var root = pendingEffectsRoot, remainingLanes = pendingEffectsRemainingLanes;
      pendingEffectsRemainingLanes = 0;
      var renderPriority = lanesToEventPriority(pendingEffectsLanes), priority = 32 > renderPriority ? 32 : renderPriority;
      renderPriority = ReactSharedInternals2.T;
      var previousPriority = getCurrentUpdatePriority();
      try {
        setCurrentUpdatePriority(priority);
        ReactSharedInternals2.T = null;
        priority = pendingPassiveTransitions;
        pendingPassiveTransitions = null;
        var root$jscomp$0 = pendingEffectsRoot, lanes = pendingEffectsLanes;
        pendingEffectsStatus = 0;
        pendingFinishedWork = pendingEffectsRoot = null;
        pendingEffectsLanes = 0;
        if ((executionContext & 6) !== 0)
          throw Error(formatProdErrorMessage(331));
        var prevExecutionContext = executionContext;
        executionContext |= 4;
        commitPassiveUnmountOnFiber(root$jscomp$0.current);
        commitPassiveMountOnFiber(root$jscomp$0, root$jscomp$0.current, lanes, priority);
        executionContext = prevExecutionContext;
        flushSyncWorkAcrossRoots_impl(0, false);
        if (injectedHook && typeof injectedHook.onPostCommitFiberRoot === "function")
          try {
            injectedHook.onPostCommitFiberRoot(rendererID, root$jscomp$0);
          } catch (err) {}
        return true;
      } finally {
        setCurrentUpdatePriority(previousPriority), ReactSharedInternals2.T = renderPriority, releaseRootPooledCache(root, remainingLanes);
      }
    }
    function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
      sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
      sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2);
      rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2);
      rootFiber !== null && (markRootUpdated$1(rootFiber, 2), ensureRootIsScheduled(rootFiber));
    }
    function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
      if (sourceFiber.tag === 3)
        captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
      else
        for (;nearestMountedAncestor !== null; ) {
          if (nearestMountedAncestor.tag === 3) {
            captureCommitPhaseErrorOnRoot(nearestMountedAncestor, sourceFiber, error);
            break;
          } else if (nearestMountedAncestor.tag === 1) {
            var instance = nearestMountedAncestor.stateNode;
            if (typeof nearestMountedAncestor.type.getDerivedStateFromError === "function" || typeof instance.componentDidCatch === "function" && (legacyErrorBoundariesThatAlreadyFailed === null || !legacyErrorBoundariesThatAlreadyFailed.has(instance))) {
              sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
              error = createClassErrorUpdate(2);
              instance = enqueueUpdate(nearestMountedAncestor, error, 2);
              instance !== null && (initializeClassErrorUpdate(error, instance, nearestMountedAncestor, sourceFiber), markRootUpdated$1(instance, 2), ensureRootIsScheduled(instance));
              break;
            }
          }
          nearestMountedAncestor = nearestMountedAncestor.return;
        }
    }
    function attachPingListener(root, wakeable, lanes) {
      var pingCache = root.pingCache;
      if (pingCache === null) {
        pingCache = root.pingCache = new PossiblyWeakMap;
        var threadIDs = new Set;
        pingCache.set(wakeable, threadIDs);
      } else
        threadIDs = pingCache.get(wakeable), threadIDs === undefined && (threadIDs = new Set, pingCache.set(wakeable, threadIDs));
      threadIDs.has(lanes) || (workInProgressRootDidAttachPingListener = true, threadIDs.add(lanes), root = pingSuspendedRoot.bind(null, root, wakeable, lanes), wakeable.then(root, root));
    }
    function pingSuspendedRoot(root, wakeable, pingedLanes) {
      var pingCache = root.pingCache;
      pingCache !== null && pingCache.delete(wakeable);
      root.pingedLanes |= root.suspendedLanes & pingedLanes;
      root.warmLanes &= ~pingedLanes;
      workInProgressRoot === root && (workInProgressRootRenderLanes & pingedLanes) === pingedLanes && (workInProgressRootExitStatus === 4 || workInProgressRootExitStatus === 3 && (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes && 300 > now2() - globalMostRecentFallbackTime ? (executionContext & 2) === 0 && prepareFreshStack(root, 0) : workInProgressRootPingedLanes |= pingedLanes, workInProgressSuspendedRetryLanes === workInProgressRootRenderLanes && (workInProgressSuspendedRetryLanes = 0));
      ensureRootIsScheduled(root);
    }
    function retryTimedOutBoundary(boundaryFiber, retryLane) {
      retryLane === 0 && (retryLane = claimNextRetryLane());
      boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
      boundaryFiber !== null && (markRootUpdated$1(boundaryFiber, retryLane), ensureRootIsScheduled(boundaryFiber));
    }
    function retryDehydratedSuspenseBoundary(boundaryFiber) {
      var suspenseState = boundaryFiber.memoizedState, retryLane = 0;
      suspenseState !== null && (retryLane = suspenseState.retryLane);
      retryTimedOutBoundary(boundaryFiber, retryLane);
    }
    function resolveRetryWakeable(boundaryFiber, wakeable) {
      var retryLane = 0;
      switch (boundaryFiber.tag) {
        case 31:
        case 13:
          var retryCache = boundaryFiber.stateNode;
          var suspenseState = boundaryFiber.memoizedState;
          suspenseState !== null && (retryLane = suspenseState.retryLane);
          break;
        case 19:
          retryCache = boundaryFiber.stateNode;
          break;
        case 22:
          retryCache = boundaryFiber.stateNode._retryCache;
          break;
        default:
          throw Error(formatProdErrorMessage(314));
      }
      retryCache !== null && retryCache.delete(wakeable);
      retryTimedOutBoundary(boundaryFiber, retryLane);
    }
    function scheduleCallback(priorityLevel, callback) {
      return scheduleCallback$3(priorityLevel, callback);
    }
    function FiberNode(tag, pendingProps, key, mode) {
      this.tag = tag;
      this.key = key;
      this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
      this.index = 0;
      this.refCleanup = this.ref = null;
      this.pendingProps = pendingProps;
      this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
      this.mode = mode;
      this.subtreeFlags = this.flags = 0;
      this.deletions = null;
      this.childLanes = this.lanes = 0;
      this.alternate = null;
    }
    function shouldConstruct(Component2) {
      Component2 = Component2.prototype;
      return !(!Component2 || !Component2.isReactComponent);
    }
    function createWorkInProgress(current, pendingProps) {
      var workInProgress2 = current.alternate;
      workInProgress2 === null ? (workInProgress2 = createFiber(current.tag, pendingProps, current.key, current.mode), workInProgress2.elementType = current.elementType, workInProgress2.type = current.type, workInProgress2.stateNode = current.stateNode, workInProgress2.alternate = current, current.alternate = workInProgress2) : (workInProgress2.pendingProps = pendingProps, workInProgress2.type = current.type, workInProgress2.flags = 0, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null);
      workInProgress2.flags = current.flags & 65011712;
      workInProgress2.childLanes = current.childLanes;
      workInProgress2.lanes = current.lanes;
      workInProgress2.child = current.child;
      workInProgress2.memoizedProps = current.memoizedProps;
      workInProgress2.memoizedState = current.memoizedState;
      workInProgress2.updateQueue = current.updateQueue;
      pendingProps = current.dependencies;
      workInProgress2.dependencies = pendingProps === null ? null : {
        lanes: pendingProps.lanes,
        firstContext: pendingProps.firstContext
      };
      workInProgress2.sibling = current.sibling;
      workInProgress2.index = current.index;
      workInProgress2.ref = current.ref;
      workInProgress2.refCleanup = current.refCleanup;
      return workInProgress2;
    }
    function resetWorkInProgress(workInProgress2, renderLanes2) {
      workInProgress2.flags &= 65011714;
      var current = workInProgress2.alternate;
      current === null ? (workInProgress2.childLanes = 0, workInProgress2.lanes = renderLanes2, workInProgress2.child = null, workInProgress2.subtreeFlags = 0, workInProgress2.memoizedProps = null, workInProgress2.memoizedState = null, workInProgress2.updateQueue = null, workInProgress2.dependencies = null, workInProgress2.stateNode = null) : (workInProgress2.childLanes = current.childLanes, workInProgress2.lanes = current.lanes, workInProgress2.child = current.child, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null, workInProgress2.memoizedProps = current.memoizedProps, workInProgress2.memoizedState = current.memoizedState, workInProgress2.updateQueue = current.updateQueue, workInProgress2.type = current.type, renderLanes2 = current.dependencies, workInProgress2.dependencies = renderLanes2 === null ? null : {
        lanes: renderLanes2.lanes,
        firstContext: renderLanes2.firstContext
      });
      return workInProgress2;
    }
    function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
      var fiberTag = 0;
      owner = type;
      if (typeof type === "function")
        shouldConstruct(type) && (fiberTag = 1);
      else if (typeof type === "string")
        fiberTag = supportsResources && supportsSingletons ? isHostHoistableType(type, pendingProps, contextStackCursor.current) ? 26 : isHostSingletonType(type) ? 27 : 5 : supportsResources ? isHostHoistableType(type, pendingProps, contextStackCursor.current) ? 26 : 5 : supportsSingletons ? isHostSingletonType(type) ? 27 : 5 : 5;
      else
        a:
          switch (type) {
            case REACT_ACTIVITY_TYPE2:
              return type = createFiber(31, pendingProps, key, mode), type.elementType = REACT_ACTIVITY_TYPE2, type.lanes = lanes, type;
            case REACT_FRAGMENT_TYPE2:
              return createFiberFromFragment(pendingProps.children, mode, lanes, key);
            case REACT_STRICT_MODE_TYPE2:
              fiberTag = 8;
              mode |= 24;
              break;
            case REACT_PROFILER_TYPE2:
              return type = createFiber(12, pendingProps, key, mode | 2), type.elementType = REACT_PROFILER_TYPE2, type.lanes = lanes, type;
            case REACT_SUSPENSE_TYPE2:
              return type = createFiber(13, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_TYPE2, type.lanes = lanes, type;
            case REACT_SUSPENSE_LIST_TYPE:
              return type = createFiber(19, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_LIST_TYPE, type.lanes = lanes, type;
            default:
              if (typeof type === "object" && type !== null)
                switch (type.$$typeof) {
                  case REACT_CONTEXT_TYPE2:
                    fiberTag = 10;
                    break a;
                  case REACT_CONSUMER_TYPE2:
                    fiberTag = 9;
                    break a;
                  case REACT_FORWARD_REF_TYPE2:
                    fiberTag = 11;
                    break a;
                  case REACT_MEMO_TYPE2:
                    fiberTag = 14;
                    break a;
                  case REACT_LAZY_TYPE2:
                    fiberTag = 16;
                    owner = null;
                    break a;
                }
              fiberTag = 29;
              pendingProps = Error(formatProdErrorMessage(130, type === null ? "null" : typeof type, ""));
              owner = null;
          }
      key = createFiber(fiberTag, pendingProps, key, mode);
      key.elementType = type;
      key.type = owner;
      key.lanes = lanes;
      return key;
    }
    function createFiberFromFragment(elements, mode, lanes, key) {
      elements = createFiber(7, elements, key, mode);
      elements.lanes = lanes;
      return elements;
    }
    function createFiberFromText(content, mode, lanes) {
      content = createFiber(6, content, null, mode);
      content.lanes = lanes;
      return content;
    }
    function createFiberFromDehydratedFragment(dehydratedNode) {
      var fiber = createFiber(18, null, null, 0);
      fiber.stateNode = dehydratedNode;
      return fiber;
    }
    function createFiberFromPortal(portal, mode, lanes) {
      mode = createFiber(4, portal.children !== null ? portal.children : [], portal.key, mode);
      mode.lanes = lanes;
      mode.stateNode = {
        containerInfo: portal.containerInfo,
        pendingChildren: null,
        implementation: portal.implementation
      };
      return mode;
    }
    function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState) {
      this.tag = 1;
      this.containerInfo = containerInfo;
      this.pingCache = this.current = this.pendingChildren = null;
      this.timeoutHandle = noTimeout;
      this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null;
      this.callbackPriority = 0;
      this.expirationTimes = createLaneMap(-1);
      this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
      this.entanglements = createLaneMap(0);
      this.hiddenUpdates = createLaneMap(null);
      this.identifierPrefix = identifierPrefix;
      this.onUncaughtError = onUncaughtError;
      this.onCaughtError = onCaughtError;
      this.onRecoverableError = onRecoverableError;
      this.pooledCache = null;
      this.pooledCacheLanes = 0;
      this.formState = formState;
      this.incompleteTransitions = new Map;
    }
    function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, identifierPrefix, formState, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
      containerInfo = new FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState);
      tag = 1;
      isStrictMode === true && (tag |= 24);
      isStrictMode = createFiber(3, null, null, tag);
      containerInfo.current = isStrictMode;
      isStrictMode.stateNode = containerInfo;
      tag = createCache();
      tag.refCount++;
      containerInfo.pooledCache = tag;
      tag.refCount++;
      isStrictMode.memoizedState = {
        element: initialChildren,
        isDehydrated: hydrate,
        cache: tag
      };
      initializeUpdateQueue(isStrictMode);
      return containerInfo;
    }
    function getContextForSubtree(parentComponent) {
      if (!parentComponent)
        return emptyContextObject;
      parentComponent = emptyContextObject;
      return parentComponent;
    }
    function findHostInstance(component) {
      var fiber = component._reactInternals;
      if (fiber === undefined) {
        if (typeof component.render === "function")
          throw Error(formatProdErrorMessage(188));
        component = Object.keys(component).join(",");
        throw Error(formatProdErrorMessage(268, component));
      }
      component = findCurrentFiberUsingSlowPath(fiber);
      component = component !== null ? findCurrentHostFiberImpl(component) : null;
      return component === null ? null : getPublicInstance(component.stateNode);
    }
    function updateContainerImpl(rootFiber, lane, element, container, parentComponent, callback) {
      parentComponent = getContextForSubtree(parentComponent);
      container.context === null ? container.context = parentComponent : container.pendingContext = parentComponent;
      container = createUpdate(lane);
      container.payload = { element };
      callback = callback === undefined ? null : callback;
      callback !== null && (container.callback = callback);
      element = enqueueUpdate(rootFiber, container, lane);
      element !== null && (scheduleUpdateOnFiber(element, rootFiber, lane), entangleTransitions(element, rootFiber, lane));
    }
    function markRetryLaneImpl(fiber, retryLane) {
      fiber = fiber.memoizedState;
      if (fiber !== null && fiber.dehydrated !== null) {
        var a = fiber.retryLane;
        fiber.retryLane = a !== 0 && a < retryLane ? a : retryLane;
      }
    }
    function markRetryLaneIfNotHydrated(fiber, retryLane) {
      markRetryLaneImpl(fiber, retryLane);
      (fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
    }
    var exports2 = {};
    var assign2 = Object.assign, REACT_LEGACY_ELEMENT_TYPE = Symbol.for("react.element"), REACT_ELEMENT_TYPE2 = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE2 = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE2 = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE2 = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE2 = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE2 = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE2 = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE2 = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE2 = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE2 = Symbol.for("react.memo"), REACT_LAZY_TYPE2 = Symbol.for("react.lazy");
    Symbol.for("react.scope");
    var REACT_ACTIVITY_TYPE2 = Symbol.for("react.activity");
    Symbol.for("react.legacy_hidden");
    Symbol.for("react.tracing_marker");
    var REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel");
    Symbol.for("react.view_transition");
    var MAYBE_ITERATOR_SYMBOL2 = Symbol.iterator, REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), isArrayImpl2 = Array.isArray, ReactSharedInternals2 = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, rendererVersion = $$$config.rendererVersion, rendererPackageName = $$$config.rendererPackageName, extraDevToolsConfig = $$$config.extraDevToolsConfig, getPublicInstance = $$$config.getPublicInstance, getRootHostContext = $$$config.getRootHostContext, getChildHostContext = $$$config.getChildHostContext, prepareForCommit = $$$config.prepareForCommit, resetAfterCommit = $$$config.resetAfterCommit, createInstance = $$$config.createInstance;
    $$$config.cloneMutableInstance;
    var { appendInitialChild, finalizeInitialChildren, shouldSetTextContent, createTextInstance } = $$$config;
    $$$config.cloneMutableTextInstance;
    var { scheduleTimeout, cancelTimeout, noTimeout, isPrimaryRenderer } = $$$config;
    $$$config.warnsIfNotActing;
    var { supportsMutation, supportsPersistence, supportsHydration, getInstanceFromNode } = $$$config;
    $$$config.beforeActiveInstanceBlur;
    var preparePortalMount = $$$config.preparePortalMount;
    $$$config.prepareScopeUpdate;
    $$$config.getInstanceFromScope;
    var { setCurrentUpdatePriority, getCurrentUpdatePriority, resolveUpdatePriority } = $$$config;
    $$$config.trackSchedulerEvent;
    $$$config.resolveEventType;
    $$$config.resolveEventTimeStamp;
    var { shouldAttemptEagerTransition, detachDeletedInstance } = $$$config;
    $$$config.requestPostPaintCallback;
    var { maySuspendCommit, maySuspendCommitOnUpdate, maySuspendCommitInSyncRender, preloadInstance, startSuspendingCommit, suspendInstance } = $$$config;
    $$$config.suspendOnActiveViewTransition;
    var waitForCommitToBeReady = $$$config.waitForCommitToBeReady;
    $$$config.getSuspendedCommitReason;
    var { NotPendingTransition, HostTransitionContext, resetFormInstance } = $$$config;
    $$$config.bindToConsole;
    var { supportsMicrotasks, scheduleMicrotask, supportsTestSelectors, findFiberRoot, getBoundingRect, getTextContent, isHiddenSubtree, matchAccessibilityRole, setFocusIfFocusable, setupIntersectionObserver, appendChild, appendChildToContainer, commitTextUpdate, commitMount, commitUpdate, insertBefore, insertInContainerBefore, removeChild, removeChildFromContainer, resetTextContent, hideInstance, hideTextInstance, unhideInstance, unhideTextInstance } = $$$config;
    $$$config.cancelViewTransitionName;
    $$$config.cancelRootViewTransitionName;
    $$$config.restoreRootViewTransitionName;
    $$$config.cloneRootViewTransitionContainer;
    $$$config.removeRootViewTransitionClone;
    $$$config.measureClonedInstance;
    $$$config.hasInstanceChanged;
    $$$config.hasInstanceAffectedParent;
    $$$config.startViewTransition;
    $$$config.startGestureTransition;
    $$$config.stopViewTransition;
    $$$config.getCurrentGestureOffset;
    $$$config.createViewTransitionInstance;
    var clearContainer = $$$config.clearContainer;
    $$$config.createFragmentInstance;
    $$$config.updateFragmentInstanceFiber;
    $$$config.commitNewChildToFragmentInstance;
    $$$config.deleteChildFromFragmentInstance;
    var { cloneInstance, createContainerChildSet, appendChildToContainerChildSet, finalizeContainerChildren, replaceContainerChildren, cloneHiddenInstance, cloneHiddenTextInstance, isSuspenseInstancePending, isSuspenseInstanceFallback, getSuspenseInstanceFallbackErrorDetails, registerSuspenseInstanceRetry, canHydrateFormStateMarker, isFormStateMarkerMatching, getNextHydratableSibling, getNextHydratableSiblingAfterSingleton, getFirstHydratableChild, getFirstHydratableChildWithinContainer, getFirstHydratableChildWithinActivityInstance, getFirstHydratableChildWithinSuspenseInstance, getFirstHydratableChildWithinSingleton, canHydrateInstance, canHydrateTextInstance, canHydrateActivityInstance, canHydrateSuspenseInstance, hydrateInstance, hydrateTextInstance, hydrateActivityInstance, hydrateSuspenseInstance, getNextHydratableInstanceAfterActivityInstance, getNextHydratableInstanceAfterSuspenseInstance, commitHydratedInstance, commitHydratedContainer, commitHydratedActivityInstance, commitHydratedSuspenseInstance, finalizeHydratedChildren, flushHydrationEvents } = $$$config;
    $$$config.clearActivityBoundary;
    var clearSuspenseBoundary = $$$config.clearSuspenseBoundary;
    $$$config.clearActivityBoundaryFromContainer;
    var { clearSuspenseBoundaryFromContainer, hideDehydratedBoundary, unhideDehydratedBoundary, shouldDeleteUnhydratedTailInstances } = $$$config;
    $$$config.diffHydratedPropsForDevWarnings;
    $$$config.diffHydratedTextForDevWarnings;
    $$$config.describeHydratableInstanceForDevWarnings;
    var { validateHydratableInstance, validateHydratableTextInstance, supportsResources, isHostHoistableType, getHoistableRoot, getResource, acquireResource, releaseResource, hydrateHoistable, mountHoistable, unmountHoistable, createHoistableInstance, prepareToCommitHoistables, mayResourceSuspendCommit, preloadResource, suspendResource, supportsSingletons, resolveSingletonInstance, acquireSingletonInstance, releaseSingletonInstance, isHostSingletonType, isSingletonScope } = $$$config, valueStack = [], index$jscomp$0 = -1, emptyContextObject = {}, clz32 = Math.clz32 ? Math.clz32 : clz32Fallback, log$1 = Math.log, LN2 = Math.LN2, nextTransitionUpdateLane = 256, nextTransitionDeferredLane = 262144, nextRetryLane = 4194304, scheduleCallback$3 = Scheduler.unstable_scheduleCallback, cancelCallback$1 = Scheduler.unstable_cancelCallback, shouldYield = Scheduler.unstable_shouldYield, requestPaint = Scheduler.unstable_requestPaint, now2 = Scheduler.unstable_now, ImmediatePriority = Scheduler.unstable_ImmediatePriority, UserBlockingPriority = Scheduler.unstable_UserBlockingPriority, NormalPriority$1 = Scheduler.unstable_NormalPriority, IdlePriority = Scheduler.unstable_IdlePriority, log2 = Scheduler.log, unstable_setDisableYieldValue2 = Scheduler.unstable_setDisableYieldValue, rendererID = null, injectedHook = null, objectIs = typeof Object.is === "function" ? Object.is : is, reportGlobalError2 = typeof reportError === "function" ? reportError : function(error) {
      if (typeof window === "object" && typeof window.ErrorEvent === "function") {
        var event = new window.ErrorEvent("error", {
          bubbles: true,
          cancelable: true,
          message: typeof error === "object" && error !== null && typeof error.message === "string" ? String(error.message) : String(error),
          error
        });
        if (!window.dispatchEvent(event))
          return;
      } else if (typeof process === "object" && typeof process.emit === "function") {
        process.emit("uncaughtException", error);
        return;
      }
      console.error(error);
    }, hasOwnProperty2 = Object.prototype.hasOwnProperty, prefix, suffix, reentry = false, CapturedStacks = new WeakMap, forkStack = [], forkStackIndex = 0, treeForkProvider = null, treeForkCount = 0, idStack = [], idStackIndex = 0, treeContextProvider = null, treeContextId = 1, treeContextOverflow = "", contextStackCursor = createCursor(null), contextFiberStackCursor = createCursor(null), rootInstanceStackCursor = createCursor(null), hostTransitionProviderCursor = createCursor(null), hydrationParentFiber = null, nextHydratableInstance = null, isHydrating = false, hydrationErrors = null, rootOrSingletonContext = false, HydrationMismatchException = Error(formatProdErrorMessage(519)), valueCursor = createCursor(null), currentlyRenderingFiber$1 = null, lastContextDependency = null, AbortControllerLocal = typeof AbortController !== "undefined" ? AbortController : function() {
      var listeners = [], signal = this.signal = {
        aborted: false,
        addEventListener: function(type, listener) {
          listeners.push(listener);
        }
      };
      this.abort = function() {
        signal.aborted = true;
        listeners.forEach(function(listener) {
          return listener();
        });
      };
    }, scheduleCallback$2 = Scheduler.unstable_scheduleCallback, NormalPriority = Scheduler.unstable_NormalPriority, CacheContext = {
      $$typeof: REACT_CONTEXT_TYPE2,
      Consumer: null,
      Provider: null,
      _currentValue: null,
      _currentValue2: null,
      _threadCount: 0
    }, firstScheduledRoot = null, lastScheduledRoot = null, didScheduleMicrotask = false, mightHavePendingSyncWork = false, isFlushingWork = false, currentEventTransitionLane = 0, currentEntangledListeners = null, currentEntangledPendingCount = 0, currentEntangledLane = 0, currentEntangledActionThenable = null, prevOnStartTransitionFinish = ReactSharedInternals2.S;
    ReactSharedInternals2.S = function(transition, returnValue) {
      globalMostRecentTransitionTime = now2();
      typeof returnValue === "object" && returnValue !== null && typeof returnValue.then === "function" && entangleAsyncAction(transition, returnValue);
      prevOnStartTransitionFinish !== null && prevOnStartTransitionFinish(transition, returnValue);
    };
    var resumedCache = createCursor(null), SuspenseException = Error(formatProdErrorMessage(460)), SuspenseyCommitException = Error(formatProdErrorMessage(474)), SuspenseActionException = Error(formatProdErrorMessage(542)), noopSuspenseyCommitThenable = { then: function() {} }, suspendedThenable = null, thenableState$1 = null, thenableIndexCounter$1 = 0, reconcileChildFibers = createChildReconciler(true), mountChildFibers = createChildReconciler(false), concurrentQueues = [], concurrentQueuesIndex = 0, concurrentlyUpdatedLanes = 0, hasForceUpdate = false, didReadFromEntangledAsyncAction = false, currentTreeHiddenStackCursor = createCursor(null), prevEntangledRenderLanesCursor = createCursor(0), suspenseHandlerStackCursor = createCursor(null), shellBoundary = null, suspenseStackCursor = createCursor(0), renderLanes = 0, currentlyRenderingFiber = null, currentHook = null, workInProgressHook = null, didScheduleRenderPhaseUpdate = false, didScheduleRenderPhaseUpdateDuringThisPass = false, shouldDoubleInvokeUserFnsInHooksDEV = false, localIdCounter = 0, thenableIndexCounter = 0, thenableState = null, globalClientIdCounter = 0, ContextOnlyDispatcher = {
      readContext,
      use,
      useCallback: throwInvalidHookError,
      useContext: throwInvalidHookError,
      useEffect: throwInvalidHookError,
      useImperativeHandle: throwInvalidHookError,
      useLayoutEffect: throwInvalidHookError,
      useInsertionEffect: throwInvalidHookError,
      useMemo: throwInvalidHookError,
      useReducer: throwInvalidHookError,
      useRef: throwInvalidHookError,
      useState: throwInvalidHookError,
      useDebugValue: throwInvalidHookError,
      useDeferredValue: throwInvalidHookError,
      useTransition: throwInvalidHookError,
      useSyncExternalStore: throwInvalidHookError,
      useId: throwInvalidHookError,
      useHostTransitionStatus: throwInvalidHookError,
      useFormState: throwInvalidHookError,
      useActionState: throwInvalidHookError,
      useOptimistic: throwInvalidHookError,
      useMemoCache: throwInvalidHookError,
      useCacheRefresh: throwInvalidHookError
    };
    ContextOnlyDispatcher.useEffectEvent = throwInvalidHookError;
    var HooksDispatcherOnMount = {
      readContext,
      use,
      useCallback: function(callback, deps) {
        mountWorkInProgressHook().memoizedState = [
          callback,
          deps === undefined ? null : deps
        ];
        return callback;
      },
      useContext: readContext,
      useEffect: mountEffect,
      useImperativeHandle: function(ref, create, deps) {
        deps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
        mountEffectImpl(4194308, 4, imperativeHandleEffect.bind(null, create, ref), deps);
      },
      useLayoutEffect: function(create, deps) {
        return mountEffectImpl(4194308, 4, create, deps);
      },
      useInsertionEffect: function(create, deps) {
        mountEffectImpl(4, 2, create, deps);
      },
      useMemo: function(nextCreate, deps) {
        var hook = mountWorkInProgressHook();
        deps = deps === undefined ? null : deps;
        var nextValue = nextCreate();
        if (shouldDoubleInvokeUserFnsInHooksDEV) {
          setIsStrictModeForDevtools(true);
          try {
            nextCreate();
          } finally {
            setIsStrictModeForDevtools(false);
          }
        }
        hook.memoizedState = [nextValue, deps];
        return nextValue;
      },
      useReducer: function(reducer, initialArg, init) {
        var hook = mountWorkInProgressHook();
        if (init !== undefined) {
          var initialState = init(initialArg);
          if (shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(true);
            try {
              init(initialArg);
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }
        } else
          initialState = initialArg;
        hook.memoizedState = hook.baseState = initialState;
        reducer = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: reducer,
          lastRenderedState: initialState
        };
        hook.queue = reducer;
        reducer = reducer.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, reducer);
        return [hook.memoizedState, reducer];
      },
      useRef: function(initialValue) {
        var hook = mountWorkInProgressHook();
        initialValue = { current: initialValue };
        return hook.memoizedState = initialValue;
      },
      useState: function(initialState) {
        initialState = mountStateImpl(initialState);
        var queue = initialState.queue, dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
        queue.dispatch = dispatch;
        return [initialState.memoizedState, dispatch];
      },
      useDebugValue: mountDebugValue,
      useDeferredValue: function(value, initialValue) {
        var hook = mountWorkInProgressHook();
        return mountDeferredValueImpl(hook, value, initialValue);
      },
      useTransition: function() {
        var stateHook = mountStateImpl(false);
        stateHook = startTransition.bind(null, currentlyRenderingFiber, stateHook.queue, true, false);
        mountWorkInProgressHook().memoizedState = stateHook;
        return [false, stateHook];
      },
      useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
        var fiber = currentlyRenderingFiber, hook = mountWorkInProgressHook();
        if (isHydrating) {
          if (getServerSnapshot === undefined)
            throw Error(formatProdErrorMessage(407));
          getServerSnapshot = getServerSnapshot();
        } else {
          getServerSnapshot = getSnapshot();
          if (workInProgressRoot === null)
            throw Error(formatProdErrorMessage(349));
          (workInProgressRootRenderLanes & 127) !== 0 || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
        }
        hook.memoizedState = getServerSnapshot;
        var inst = { value: getServerSnapshot, getSnapshot };
        hook.queue = inst;
        mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
          subscribe
        ]);
        fiber.flags |= 2048;
        pushSimpleEffect(9, { destroy: undefined }, updateStoreInstance.bind(null, fiber, inst, getServerSnapshot, getSnapshot), null);
        return getServerSnapshot;
      },
      useId: function() {
        var hook = mountWorkInProgressHook(), identifierPrefix = workInProgressRoot.identifierPrefix;
        if (isHydrating) {
          var JSCompiler_inline_result = treeContextOverflow;
          var idWithLeadingBit = treeContextId;
          JSCompiler_inline_result = (idWithLeadingBit & ~(1 << 32 - clz32(idWithLeadingBit) - 1)).toString(32) + JSCompiler_inline_result;
          identifierPrefix = "_" + identifierPrefix + "R_" + JSCompiler_inline_result;
          JSCompiler_inline_result = localIdCounter++;
          0 < JSCompiler_inline_result && (identifierPrefix += "H" + JSCompiler_inline_result.toString(32));
          identifierPrefix += "_";
        } else
          JSCompiler_inline_result = globalClientIdCounter++, identifierPrefix = "_" + identifierPrefix + "r_" + JSCompiler_inline_result.toString(32) + "_";
        return hook.memoizedState = identifierPrefix;
      },
      useHostTransitionStatus,
      useFormState: mountActionState,
      useActionState: mountActionState,
      useOptimistic: function(passthrough) {
        var hook = mountWorkInProgressHook();
        hook.memoizedState = hook.baseState = passthrough;
        var queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: null,
          lastRenderedState: null
        };
        hook.queue = queue;
        hook = dispatchOptimisticSetState.bind(null, currentlyRenderingFiber, true, queue);
        queue.dispatch = hook;
        return [passthrough, hook];
      },
      useMemoCache,
      useCacheRefresh: function() {
        return mountWorkInProgressHook().memoizedState = refreshCache.bind(null, currentlyRenderingFiber);
      },
      useEffectEvent: function(callback) {
        var hook = mountWorkInProgressHook(), ref = { impl: callback };
        hook.memoizedState = ref;
        return function() {
          if ((executionContext & 2) !== 0)
            throw Error(formatProdErrorMessage(440));
          return ref.impl.apply(undefined, arguments);
        };
      }
    }, HooksDispatcherOnUpdate = {
      readContext,
      use,
      useCallback: updateCallback,
      useContext: readContext,
      useEffect: updateEffect,
      useImperativeHandle: updateImperativeHandle,
      useInsertionEffect: updateInsertionEffect,
      useLayoutEffect: updateLayoutEffect,
      useMemo: updateMemo,
      useReducer: updateReducer,
      useRef: updateRef,
      useState: function() {
        return updateReducer(basicStateReducer);
      },
      useDebugValue: mountDebugValue,
      useDeferredValue: function(value, initialValue) {
        var hook = updateWorkInProgressHook();
        return updateDeferredValueImpl(hook, currentHook.memoizedState, value, initialValue);
      },
      useTransition: function() {
        var booleanOrThenable = updateReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
        return [
          typeof booleanOrThenable === "boolean" ? booleanOrThenable : useThenable(booleanOrThenable),
          start
        ];
      },
      useSyncExternalStore: updateSyncExternalStore,
      useId: updateId,
      useHostTransitionStatus,
      useFormState: updateActionState,
      useActionState: updateActionState,
      useOptimistic: function(passthrough, reducer) {
        var hook = updateWorkInProgressHook();
        return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
      },
      useMemoCache,
      useCacheRefresh: updateRefresh
    };
    HooksDispatcherOnUpdate.useEffectEvent = updateEvent;
    var HooksDispatcherOnRerender = {
      readContext,
      use,
      useCallback: updateCallback,
      useContext: readContext,
      useEffect: updateEffect,
      useImperativeHandle: updateImperativeHandle,
      useInsertionEffect: updateInsertionEffect,
      useLayoutEffect: updateLayoutEffect,
      useMemo: updateMemo,
      useReducer: rerenderReducer,
      useRef: updateRef,
      useState: function() {
        return rerenderReducer(basicStateReducer);
      },
      useDebugValue: mountDebugValue,
      useDeferredValue: function(value, initialValue) {
        var hook = updateWorkInProgressHook();
        return currentHook === null ? mountDeferredValueImpl(hook, value, initialValue) : updateDeferredValueImpl(hook, currentHook.memoizedState, value, initialValue);
      },
      useTransition: function() {
        var booleanOrThenable = rerenderReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
        return [
          typeof booleanOrThenable === "boolean" ? booleanOrThenable : useThenable(booleanOrThenable),
          start
        ];
      },
      useSyncExternalStore: updateSyncExternalStore,
      useId: updateId,
      useHostTransitionStatus,
      useFormState: rerenderActionState,
      useActionState: rerenderActionState,
      useOptimistic: function(passthrough, reducer) {
        var hook = updateWorkInProgressHook();
        if (currentHook !== null)
          return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
        hook.baseState = passthrough;
        return [passthrough, hook.queue.dispatch];
      },
      useMemoCache,
      useCacheRefresh: updateRefresh
    };
    HooksDispatcherOnRerender.useEffectEvent = updateEvent;
    var classComponentUpdater = {
      enqueueSetState: function(inst, payload, callback) {
        inst = inst._reactInternals;
        var lane = requestUpdateLane(), update = createUpdate(lane);
        update.payload = payload;
        callback !== undefined && callback !== null && (update.callback = callback);
        payload = enqueueUpdate(inst, update, lane);
        payload !== null && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
      },
      enqueueReplaceState: function(inst, payload, callback) {
        inst = inst._reactInternals;
        var lane = requestUpdateLane(), update = createUpdate(lane);
        update.tag = 1;
        update.payload = payload;
        callback !== undefined && callback !== null && (update.callback = callback);
        payload = enqueueUpdate(inst, update, lane);
        payload !== null && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
      },
      enqueueForceUpdate: function(inst, callback) {
        inst = inst._reactInternals;
        var lane = requestUpdateLane(), update = createUpdate(lane);
        update.tag = 2;
        callback !== undefined && callback !== null && (update.callback = callback);
        callback = enqueueUpdate(inst, update, lane);
        callback !== null && (scheduleUpdateOnFiber(callback, inst, lane), entangleTransitions(callback, inst, lane));
      }
    }, SelectiveHydrationException = Error(formatProdErrorMessage(461)), didReceiveUpdate = false, SUSPENDED_MARKER = {
      dehydrated: null,
      treeContext: null,
      retryLane: 0,
      hydrationErrors: null
    }, offscreenSubtreeIsHidden = false, offscreenSubtreeWasHidden = false, needsFormReset = false, PossiblyWeakSet = typeof WeakSet === "function" ? WeakSet : Set, nextEffect = null, hostParent = null, hostParentIsContainer = false, currentHoistableRoot = null, suspenseyCommitFlag = 8192, DefaultAsyncDispatcher = {
      getCacheForType: function(resourceType) {
        var cache = readContext(CacheContext), cacheForType = cache.data.get(resourceType);
        cacheForType === undefined && (cacheForType = resourceType(), cache.data.set(resourceType, cacheForType));
        return cacheForType;
      },
      cacheSignal: function() {
        return readContext(CacheContext).controller.signal;
      }
    }, COMPONENT_TYPE = 0, HAS_PSEUDO_CLASS_TYPE = 1, ROLE_TYPE = 2, TEST_NAME_TYPE = 3, TEXT_TYPE = 4;
    if (typeof Symbol === "function" && Symbol.for) {
      var symbolFor = Symbol.for;
      COMPONENT_TYPE = symbolFor("selector.component");
      HAS_PSEUDO_CLASS_TYPE = symbolFor("selector.has_pseudo_class");
      ROLE_TYPE = symbolFor("selector.role");
      TEST_NAME_TYPE = symbolFor("selector.test_id");
      TEXT_TYPE = symbolFor("selector.text");
    }
    var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map, executionContext = 0, workInProgressRoot = null, workInProgress = null, workInProgressRootRenderLanes = 0, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, workInProgressRootDidSkipSuspendedSiblings = false, workInProgressRootIsPrerendering = false, workInProgressRootDidAttachPingListener = false, entangledRenderLanes = 0, workInProgressRootExitStatus = 0, workInProgressRootSkippedLanes = 0, workInProgressRootInterleavedUpdatedLanes = 0, workInProgressRootPingedLanes = 0, workInProgressDeferredLane = 0, workInProgressSuspendedRetryLanes = 0, workInProgressRootConcurrentErrors = null, workInProgressRootRecoverableErrors = null, workInProgressRootDidIncludeRecursiveRenderUpdate = false, globalMostRecentFallbackTime = 0, globalMostRecentTransitionTime = 0, workInProgressRootRenderTargetTime = Infinity, workInProgressTransitions = null, legacyErrorBoundariesThatAlreadyFailed = null, pendingEffectsStatus = 0, pendingEffectsRoot = null, pendingFinishedWork = null, pendingEffectsLanes = 0, pendingEffectsRemainingLanes = 0, pendingPassiveTransitions = null, pendingRecoverableErrors = null, nestedUpdateCount = 0, rootWithNestedUpdates = null;
    exports2.attemptContinuousHydration = function(fiber) {
      if (fiber.tag === 13 || fiber.tag === 31) {
        var root = enqueueConcurrentRenderForLane(fiber, 67108864);
        root !== null && scheduleUpdateOnFiber(root, fiber, 67108864);
        markRetryLaneIfNotHydrated(fiber, 67108864);
      }
    };
    exports2.attemptHydrationAtCurrentPriority = function(fiber) {
      if (fiber.tag === 13 || fiber.tag === 31) {
        var lane = requestUpdateLane();
        lane = getBumpedLaneForHydrationByLane(lane);
        var root = enqueueConcurrentRenderForLane(fiber, lane);
        root !== null && scheduleUpdateOnFiber(root, fiber, lane);
        markRetryLaneIfNotHydrated(fiber, lane);
      }
    };
    exports2.attemptSynchronousHydration = function(fiber) {
      switch (fiber.tag) {
        case 3:
          fiber = fiber.stateNode;
          if (fiber.current.memoizedState.isDehydrated) {
            var lanes = getHighestPriorityLanes(fiber.pendingLanes);
            if (lanes !== 0) {
              fiber.pendingLanes |= 2;
              for (fiber.entangledLanes |= 2;lanes; ) {
                var lane = 1 << 31 - clz32(lanes);
                fiber.entanglements[1] |= lane;
                lanes &= ~lane;
              }
              ensureRootIsScheduled(fiber);
              (executionContext & 6) === 0 && (workInProgressRootRenderTargetTime = now2() + 500, flushSyncWorkAcrossRoots_impl(0, false));
            }
          }
          break;
        case 31:
        case 13:
          lanes = enqueueConcurrentRenderForLane(fiber, 2), lanes !== null && scheduleUpdateOnFiber(lanes, fiber, 2), flushSyncWork(), markRetryLaneIfNotHydrated(fiber, 2);
      }
    };
    exports2.batchedUpdates = function(fn, a) {
      return fn(a);
    };
    exports2.createComponentSelector = function(component) {
      return { $$typeof: COMPONENT_TYPE, value: component };
    };
    exports2.createContainer = function(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
      return createFiberRoot(containerInfo, tag, false, null, hydrationCallbacks, isStrictMode, identifierPrefix, null, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator);
    };
    exports2.createHasPseudoClassSelector = function(selectors) {
      return { $$typeof: HAS_PSEUDO_CLASS_TYPE, value: selectors };
    };
    exports2.createHydrationContainer = function(initialChildren, callback, containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, transitionCallbacks, formState) {
      initialChildren = createFiberRoot(containerInfo, tag, true, initialChildren, hydrationCallbacks, isStrictMode, identifierPrefix, formState, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator);
      initialChildren.context = getContextForSubtree(null);
      containerInfo = initialChildren.current;
      tag = requestUpdateLane();
      tag = getBumpedLaneForHydrationByLane(tag);
      hydrationCallbacks = createUpdate(tag);
      hydrationCallbacks.callback = callback !== undefined && callback !== null ? callback : null;
      enqueueUpdate(containerInfo, hydrationCallbacks, tag);
      callback = tag;
      initialChildren.current.lanes = callback;
      markRootUpdated$1(initialChildren, callback);
      ensureRootIsScheduled(initialChildren);
      return initialChildren;
    };
    exports2.createPortal = function(children, containerInfo, implementation) {
      var key = 3 < arguments.length && arguments[3] !== undefined ? arguments[3] : null;
      return {
        $$typeof: REACT_PORTAL_TYPE2,
        key: key == null ? null : "" + key,
        children,
        containerInfo,
        implementation
      };
    };
    exports2.createRoleSelector = function(role) {
      return { $$typeof: ROLE_TYPE, value: role };
    };
    exports2.createTestNameSelector = function(id) {
      return { $$typeof: TEST_NAME_TYPE, value: id };
    };
    exports2.createTextSelector = function(text) {
      return { $$typeof: TEXT_TYPE, value: text };
    };
    exports2.defaultOnCaughtError = function(error) {
      console.error(error);
    };
    exports2.defaultOnRecoverableError = function(error) {
      reportGlobalError2(error);
    };
    exports2.defaultOnUncaughtError = function(error) {
      reportGlobalError2(error);
    };
    exports2.deferredUpdates = function(fn) {
      var prevTransition = ReactSharedInternals2.T, previousPriority = getCurrentUpdatePriority();
      try {
        return setCurrentUpdatePriority(32), ReactSharedInternals2.T = null, fn();
      } finally {
        setCurrentUpdatePriority(previousPriority), ReactSharedInternals2.T = prevTransition;
      }
    };
    exports2.discreteUpdates = function(fn, a, b, c, d) {
      var prevTransition = ReactSharedInternals2.T, previousPriority = getCurrentUpdatePriority();
      try {
        return setCurrentUpdatePriority(2), ReactSharedInternals2.T = null, fn(a, b, c, d);
      } finally {
        setCurrentUpdatePriority(previousPriority), ReactSharedInternals2.T = prevTransition, executionContext === 0 && (workInProgressRootRenderTargetTime = now2() + 500);
      }
    };
    exports2.findAllNodes = findAllNodes;
    exports2.findBoundingRects = function(hostRoot, selectors) {
      if (!supportsTestSelectors)
        throw Error(formatProdErrorMessage(363));
      selectors = findAllNodes(hostRoot, selectors);
      hostRoot = [];
      for (var i = 0;i < selectors.length; i++)
        hostRoot.push(getBoundingRect(selectors[i]));
      for (selectors = hostRoot.length - 1;0 < selectors; selectors--) {
        i = hostRoot[selectors];
        for (var targetLeft = i.x, targetRight = targetLeft + i.width, targetTop = i.y, targetBottom = targetTop + i.height, j = selectors - 1;0 <= j; j--)
          if (selectors !== j) {
            var otherRect = hostRoot[j], otherLeft = otherRect.x, otherRight = otherLeft + otherRect.width, otherTop = otherRect.y, otherBottom = otherTop + otherRect.height;
            if (targetLeft >= otherLeft && targetTop >= otherTop && targetRight <= otherRight && targetBottom <= otherBottom) {
              hostRoot.splice(selectors, 1);
              break;
            } else if (!(targetLeft !== otherLeft || i.width !== otherRect.width || otherBottom < targetTop || otherTop > targetBottom)) {
              otherTop > targetTop && (otherRect.height += otherTop - targetTop, otherRect.y = targetTop);
              otherBottom < targetBottom && (otherRect.height = targetBottom - otherTop);
              hostRoot.splice(selectors, 1);
              break;
            } else if (!(targetTop !== otherTop || i.height !== otherRect.height || otherRight < targetLeft || otherLeft > targetRight)) {
              otherLeft > targetLeft && (otherRect.width += otherLeft - targetLeft, otherRect.x = targetLeft);
              otherRight < targetRight && (otherRect.width = targetRight - otherLeft);
              hostRoot.splice(selectors, 1);
              break;
            }
          }
      }
      return hostRoot;
    };
    exports2.findHostInstance = findHostInstance;
    exports2.findHostInstanceWithNoPortals = function(fiber) {
      fiber = findCurrentFiberUsingSlowPath(fiber);
      fiber = fiber !== null ? findCurrentHostFiberWithNoPortalsImpl(fiber) : null;
      return fiber === null ? null : getPublicInstance(fiber.stateNode);
    };
    exports2.findHostInstanceWithWarning = function(component) {
      return findHostInstance(component);
    };
    exports2.flushPassiveEffects = flushPendingEffects;
    exports2.flushSyncFromReconciler = function(fn) {
      var prevExecutionContext = executionContext;
      executionContext |= 1;
      var prevTransition = ReactSharedInternals2.T, previousPriority = getCurrentUpdatePriority();
      try {
        if (setCurrentUpdatePriority(2), ReactSharedInternals2.T = null, fn)
          return fn();
      } finally {
        setCurrentUpdatePriority(previousPriority), ReactSharedInternals2.T = prevTransition, executionContext = prevExecutionContext, (executionContext & 6) === 0 && flushSyncWorkAcrossRoots_impl(0, false);
      }
    };
    exports2.flushSyncWork = flushSyncWork;
    exports2.focusWithin = function(hostRoot, selectors) {
      if (!supportsTestSelectors)
        throw Error(formatProdErrorMessage(363));
      hostRoot = findFiberRootForHostRoot(hostRoot);
      selectors = findPaths(hostRoot, selectors);
      selectors = Array.from(selectors);
      for (hostRoot = 0;hostRoot < selectors.length; ) {
        var fiber = selectors[hostRoot++], tag = fiber.tag;
        if (!isHiddenSubtree(fiber)) {
          if ((tag === 5 || tag === 26 || tag === 27) && setFocusIfFocusable(fiber.stateNode))
            return true;
          for (fiber = fiber.child;fiber !== null; )
            selectors.push(fiber), fiber = fiber.sibling;
        }
      }
      return false;
    };
    exports2.getFindAllNodesFailureDescription = function(hostRoot, selectors) {
      if (!supportsTestSelectors)
        throw Error(formatProdErrorMessage(363));
      var maxSelectorIndex = 0, matchedNames = [];
      hostRoot = [findFiberRootForHostRoot(hostRoot), 0];
      for (var index = 0;index < hostRoot.length; ) {
        var fiber = hostRoot[index++], tag = fiber.tag, selectorIndex = hostRoot[index++], selector = selectors[selectorIndex];
        if (tag !== 5 && tag !== 26 && tag !== 27 || !isHiddenSubtree(fiber)) {
          if (matchSelector(fiber, selector) && (matchedNames.push(selectorToString(selector)), selectorIndex++, selectorIndex > maxSelectorIndex && (maxSelectorIndex = selectorIndex)), selectorIndex < selectors.length)
            for (fiber = fiber.child;fiber !== null; )
              hostRoot.push(fiber, selectorIndex), fiber = fiber.sibling;
        }
      }
      if (maxSelectorIndex < selectors.length) {
        for (hostRoot = [];maxSelectorIndex < selectors.length; maxSelectorIndex++)
          hostRoot.push(selectorToString(selectors[maxSelectorIndex]));
        return `findAllNodes was able to match part of the selector:
  ` + (matchedNames.join(" > ") + `

No matching component was found for:
  `) + hostRoot.join(" > ");
      }
      return null;
    };
    exports2.getPublicRootInstance = function(container) {
      container = container.current;
      if (!container.child)
        return null;
      switch (container.child.tag) {
        case 27:
        case 5:
          return getPublicInstance(container.child.stateNode);
        default:
          return container.child.stateNode;
      }
    };
    exports2.injectIntoDevTools = function() {
      var internals = {
        bundleType: 0,
        version: rendererVersion,
        rendererPackageName,
        currentDispatcherRef: ReactSharedInternals2,
        reconcilerVersion: "19.2.0"
      };
      extraDevToolsConfig !== null && (internals.rendererConfig = extraDevToolsConfig);
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined")
        internals = false;
      else {
        var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook.isDisabled || !hook.supportsFiber)
          internals = true;
        else {
          try {
            rendererID = hook.inject(internals), injectedHook = hook;
          } catch (err) {}
          internals = hook.checkDCE ? true : false;
        }
      }
      return internals;
    };
    exports2.isAlreadyRendering = function() {
      return (executionContext & 6) !== 0;
    };
    exports2.observeVisibleRects = function(hostRoot, selectors, callback, options) {
      if (!supportsTestSelectors)
        throw Error(formatProdErrorMessage(363));
      hostRoot = findAllNodes(hostRoot, selectors);
      var disconnect = setupIntersectionObserver(hostRoot, callback, options).disconnect;
      return {
        disconnect: function() {
          disconnect();
        }
      };
    };
    exports2.shouldError = function() {
      return null;
    };
    exports2.shouldSuspend = function() {
      return false;
    };
    exports2.startHostTransition = function(formFiber, pendingState, action, formData) {
      if (formFiber.tag !== 5)
        throw Error(formatProdErrorMessage(476));
      var queue = ensureFormComponentIsStateful(formFiber).queue;
      startTransition(formFiber, queue, pendingState, NotPendingTransition, action === null ? noop3 : function() {
        var stateHook = ensureFormComponentIsStateful(formFiber);
        stateHook.next === null && (stateHook = formFiber.alternate.memoizedState);
        dispatchSetStateInternal(formFiber, stateHook.next.queue, {}, requestUpdateLane());
        return action(formData);
      });
    };
    exports2.updateContainer = function(element, container, parentComponent, callback) {
      var current = container.current, lane = requestUpdateLane();
      updateContainerImpl(current, lane, element, container, parentComponent, callback);
      return lane;
    };
    exports2.updateContainerSync = function(element, container, parentComponent, callback) {
      updateContainerImpl(container.current, 2, element, container, parentComponent, callback);
      return 2;
    };
    return exports2;
  };
  module.exports.default = module.exports;
  Object.defineProperty(module.exports, "__esModule", { value: true });
});

// node_modules/.bun/react-reconciler@0.33.0+3f10a4be4e334a9b/node_modules/react-reconciler/index.js
var require_react_reconciler = __commonJS((exports, module) => {
  if (true) {
    module.exports = require_react_reconciler_production();
  }
});

// packages/@ant/ink/src/core/layout/node.ts
var LayoutEdge, LayoutGutter, LayoutDisplay, LayoutFlexDirection, LayoutAlign, LayoutJustify, LayoutWrap, LayoutPositionType, LayoutOverflow, LayoutMeasureMode;
var init_node = __esm(() => {
  LayoutEdge = {
    All: "all",
    Horizontal: "horizontal",
    Vertical: "vertical",
    Left: "left",
    Right: "right",
    Top: "top",
    Bottom: "bottom",
    Start: "start",
    End: "end"
  };
  LayoutGutter = {
    All: "all",
    Column: "column",
    Row: "row"
  };
  LayoutDisplay = {
    Flex: "flex",
    None: "none"
  };
  LayoutFlexDirection = {
    Row: "row",
    RowReverse: "row-reverse",
    Column: "column",
    ColumnReverse: "column-reverse"
  };
  LayoutAlign = {
    Auto: "auto",
    Stretch: "stretch",
    FlexStart: "flex-start",
    Center: "center",
    FlexEnd: "flex-end"
  };
  LayoutJustify = {
    FlexStart: "flex-start",
    Center: "center",
    FlexEnd: "flex-end",
    SpaceBetween: "space-between",
    SpaceAround: "space-around",
    SpaceEvenly: "space-evenly"
  };
  LayoutWrap = {
    NoWrap: "nowrap",
    Wrap: "wrap",
    WrapReverse: "wrap-reverse"
  };
  LayoutPositionType = {
    Relative: "relative",
    Absolute: "absolute"
  };
  LayoutOverflow = {
    Visible: "visible",
    Hidden: "hidden",
    Scroll: "scroll"
  };
  LayoutMeasureMode = {
    Undefined: "undefined",
    Exactly: "exactly",
    AtMost: "at-most"
  };
});

// packages/@ant/ink/src/core/layout/yoga.ts
class YogaLayoutNode {
  yoga;
  constructor(yoga) {
    this.yoga = yoga;
  }
  insertChild(child, index) {
    this.yoga.insertChild(child.yoga, index);
  }
  removeChild(child) {
    this.yoga.removeChild(child.yoga);
  }
  getChildCount() {
    return this.yoga.getChildCount();
  }
  getParent() {
    const p = this.yoga.getParent();
    return p ? new YogaLayoutNode(p) : null;
  }
  calculateLayout(width, _height) {
    this.yoga.calculateLayout(width, undefined, Direction.LTR);
  }
  setMeasureFunc(fn) {
    this.yoga.setMeasureFunc((w, wMode) => {
      const mode = wMode === MeasureMode.Exactly ? LayoutMeasureMode.Exactly : wMode === MeasureMode.AtMost ? LayoutMeasureMode.AtMost : LayoutMeasureMode.Undefined;
      return fn(w, mode);
    });
  }
  unsetMeasureFunc() {
    this.yoga.unsetMeasureFunc();
  }
  markDirty() {
    this.yoga.markDirty();
  }
  getComputedLeft() {
    return this.yoga.getComputedLeft();
  }
  getComputedTop() {
    return this.yoga.getComputedTop();
  }
  getComputedWidth() {
    return this.yoga.getComputedWidth();
  }
  getComputedHeight() {
    return this.yoga.getComputedHeight();
  }
  getComputedBorder(edge) {
    return this.yoga.getComputedBorder(EDGE_MAP[edge]);
  }
  getComputedPadding(edge) {
    return this.yoga.getComputedPadding(EDGE_MAP[edge]);
  }
  setWidth(value) {
    this.yoga.setWidth(value);
  }
  setWidthPercent(value) {
    this.yoga.setWidthPercent(value);
  }
  setWidthAuto() {
    this.yoga.setWidthAuto();
  }
  setHeight(value) {
    this.yoga.setHeight(value);
  }
  setHeightPercent(value) {
    this.yoga.setHeightPercent(value);
  }
  setHeightAuto() {
    this.yoga.setHeightAuto();
  }
  setMinWidth(value) {
    this.yoga.setMinWidth(value);
  }
  setMinWidthPercent(value) {
    this.yoga.setMinWidthPercent(value);
  }
  setMinHeight(value) {
    this.yoga.setMinHeight(value);
  }
  setMinHeightPercent(value) {
    this.yoga.setMinHeightPercent(value);
  }
  setMaxWidth(value) {
    this.yoga.setMaxWidth(value);
  }
  setMaxWidthPercent(value) {
    this.yoga.setMaxWidthPercent(value);
  }
  setMaxHeight(value) {
    this.yoga.setMaxHeight(value);
  }
  setMaxHeightPercent(value) {
    this.yoga.setMaxHeightPercent(value);
  }
  setFlexDirection(dir) {
    const map = {
      row: FlexDirection.Row,
      "row-reverse": FlexDirection.RowReverse,
      column: FlexDirection.Column,
      "column-reverse": FlexDirection.ColumnReverse
    };
    this.yoga.setFlexDirection(map[dir]);
  }
  setFlexGrow(value) {
    this.yoga.setFlexGrow(value);
  }
  setFlexShrink(value) {
    this.yoga.setFlexShrink(value);
  }
  setFlexBasis(value) {
    this.yoga.setFlexBasis(value);
  }
  setFlexBasisPercent(value) {
    this.yoga.setFlexBasisPercent(value);
  }
  setFlexWrap(wrap) {
    const map = {
      nowrap: Wrap.NoWrap,
      wrap: Wrap.Wrap,
      "wrap-reverse": Wrap.WrapReverse
    };
    this.yoga.setFlexWrap(map[wrap]);
  }
  setAlignItems(align) {
    const map = {
      auto: Align.Auto,
      stretch: Align.Stretch,
      "flex-start": Align.FlexStart,
      center: Align.Center,
      "flex-end": Align.FlexEnd
    };
    this.yoga.setAlignItems(map[align]);
  }
  setAlignSelf(align) {
    const map = {
      auto: Align.Auto,
      stretch: Align.Stretch,
      "flex-start": Align.FlexStart,
      center: Align.Center,
      "flex-end": Align.FlexEnd
    };
    this.yoga.setAlignSelf(map[align]);
  }
  setJustifyContent(justify) {
    const map = {
      "flex-start": Justify.FlexStart,
      center: Justify.Center,
      "flex-end": Justify.FlexEnd,
      "space-between": Justify.SpaceBetween,
      "space-around": Justify.SpaceAround,
      "space-evenly": Justify.SpaceEvenly
    };
    this.yoga.setJustifyContent(map[justify]);
  }
  setDisplay(display) {
    this.yoga.setDisplay(display === "flex" ? Display.Flex : Display.None);
  }
  getDisplay() {
    return this.yoga.getDisplay() === Display.None ? LayoutDisplay.None : LayoutDisplay.Flex;
  }
  setPositionType(type) {
    this.yoga.setPositionType(type === "absolute" ? PositionType.Absolute : PositionType.Relative);
  }
  setPosition(edge, value) {
    this.yoga.setPosition(EDGE_MAP[edge], value);
  }
  setPositionPercent(edge, value) {
    this.yoga.setPositionPercent(EDGE_MAP[edge], value);
  }
  setOverflow(overflow) {
    const map = {
      visible: Overflow.Visible,
      hidden: Overflow.Hidden,
      scroll: Overflow.Scroll
    };
    this.yoga.setOverflow(map[overflow]);
  }
  setMargin(edge, value) {
    this.yoga.setMargin(EDGE_MAP[edge], value);
  }
  setPadding(edge, value) {
    this.yoga.setPadding(EDGE_MAP[edge], value);
  }
  setBorder(edge, value) {
    this.yoga.setBorder(EDGE_MAP[edge], value);
  }
  setGap(gutter, value) {
    this.yoga.setGap(GUTTER_MAP[gutter], value);
  }
  free() {
    this.yoga.free();
  }
  freeRecursive() {
    this.yoga.freeRecursive();
  }
}
function createYogaLayoutNode() {
  return new YogaLayoutNode(yoga_layout_default.Node.create());
}
var EDGE_MAP, GUTTER_MAP;
var init_yoga = __esm(() => {
  init_yoga_layout();
  init_node();
  EDGE_MAP = {
    all: Edge.All,
    horizontal: Edge.Horizontal,
    vertical: Edge.Vertical,
    left: Edge.Left,
    right: Edge.Right,
    top: Edge.Top,
    bottom: Edge.Bottom,
    start: Edge.Start,
    end: Edge.End
  };
  GUTTER_MAP = {
    all: Gutter.All,
    column: Gutter.Column,
    row: Gutter.Row
  };
});

// packages/@ant/ink/src/core/layout/engine.ts
function createLayoutNode() {
  return createYogaLayoutNode();
}
var init_engine = __esm(() => {
  init_yoga();
});

// node_modules/.bun/emoji-regex@10.6.0/node_modules/emoji-regex/index.mjs
var emoji_regex_default = () => {
  return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};
var init_emoji_regex = () => {};

// node_modules/.bun/get-east-asian-width@1.5.0/node_modules/get-east-asian-width/lookup-data.js
var ambiguousRanges, fullwidthRanges, halfwidthRanges, narrowRanges, wideRanges;
var init_lookup_data = __esm(() => {
  ambiguousRanges = [161, 161, 164, 164, 167, 168, 170, 170, 173, 174, 176, 180, 182, 186, 188, 191, 198, 198, 208, 208, 215, 216, 222, 225, 230, 230, 232, 234, 236, 237, 240, 240, 242, 243, 247, 250, 252, 252, 254, 254, 257, 257, 273, 273, 275, 275, 283, 283, 294, 295, 299, 299, 305, 307, 312, 312, 319, 322, 324, 324, 328, 331, 333, 333, 338, 339, 358, 359, 363, 363, 462, 462, 464, 464, 466, 466, 468, 468, 470, 470, 472, 472, 474, 474, 476, 476, 593, 593, 609, 609, 708, 708, 711, 711, 713, 715, 717, 717, 720, 720, 728, 731, 733, 733, 735, 735, 768, 879, 913, 929, 931, 937, 945, 961, 963, 969, 1025, 1025, 1040, 1103, 1105, 1105, 8208, 8208, 8211, 8214, 8216, 8217, 8220, 8221, 8224, 8226, 8228, 8231, 8240, 8240, 8242, 8243, 8245, 8245, 8251, 8251, 8254, 8254, 8308, 8308, 8319, 8319, 8321, 8324, 8364, 8364, 8451, 8451, 8453, 8453, 8457, 8457, 8467, 8467, 8470, 8470, 8481, 8482, 8486, 8486, 8491, 8491, 8531, 8532, 8539, 8542, 8544, 8555, 8560, 8569, 8585, 8585, 8592, 8601, 8632, 8633, 8658, 8658, 8660, 8660, 8679, 8679, 8704, 8704, 8706, 8707, 8711, 8712, 8715, 8715, 8719, 8719, 8721, 8721, 8725, 8725, 8730, 8730, 8733, 8736, 8739, 8739, 8741, 8741, 8743, 8748, 8750, 8750, 8756, 8759, 8764, 8765, 8776, 8776, 8780, 8780, 8786, 8786, 8800, 8801, 8804, 8807, 8810, 8811, 8814, 8815, 8834, 8835, 8838, 8839, 8853, 8853, 8857, 8857, 8869, 8869, 8895, 8895, 8978, 8978, 9312, 9449, 9451, 9547, 9552, 9587, 9600, 9615, 9618, 9621, 9632, 9633, 9635, 9641, 9650, 9651, 9654, 9655, 9660, 9661, 9664, 9665, 9670, 9672, 9675, 9675, 9678, 9681, 9698, 9701, 9711, 9711, 9733, 9734, 9737, 9737, 9742, 9743, 9756, 9756, 9758, 9758, 9792, 9792, 9794, 9794, 9824, 9825, 9827, 9829, 9831, 9834, 9836, 9837, 9839, 9839, 9886, 9887, 9919, 9919, 9926, 9933, 9935, 9939, 9941, 9953, 9955, 9955, 9960, 9961, 9963, 9969, 9972, 9972, 9974, 9977, 9979, 9980, 9982, 9983, 10045, 10045, 10102, 10111, 11094, 11097, 12872, 12879, 57344, 63743, 65024, 65039, 65533, 65533, 127232, 127242, 127248, 127277, 127280, 127337, 127344, 127373, 127375, 127376, 127387, 127404, 917760, 917999, 983040, 1048573, 1048576, 1114109];
  fullwidthRanges = [12288, 12288, 65281, 65376, 65504, 65510];
  halfwidthRanges = [8361, 8361, 65377, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500, 65512, 65518];
  narrowRanges = [32, 126, 162, 163, 165, 166, 172, 172, 175, 175, 10214, 10221, 10629, 10630];
  wideRanges = [4352, 4447, 8986, 8987, 9001, 9002, 9193, 9196, 9200, 9200, 9203, 9203, 9725, 9726, 9748, 9749, 9776, 9783, 9800, 9811, 9855, 9855, 9866, 9871, 9875, 9875, 9889, 9889, 9898, 9899, 9917, 9918, 9924, 9925, 9934, 9934, 9940, 9940, 9962, 9962, 9970, 9971, 9973, 9973, 9978, 9978, 9981, 9981, 9989, 9989, 9994, 9995, 10024, 10024, 10060, 10060, 10062, 10062, 10067, 10069, 10071, 10071, 10133, 10135, 10160, 10160, 10175, 10175, 11035, 11036, 11088, 11088, 11093, 11093, 11904, 11929, 11931, 12019, 12032, 12245, 12272, 12287, 12289, 12350, 12353, 12438, 12441, 12543, 12549, 12591, 12593, 12686, 12688, 12773, 12783, 12830, 12832, 12871, 12880, 42124, 42128, 42182, 43360, 43388, 44032, 55203, 63744, 64255, 65040, 65049, 65072, 65106, 65108, 65126, 65128, 65131, 94176, 94180, 94192, 94198, 94208, 101589, 101631, 101662, 101760, 101874, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110882, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110951, 110960, 111355, 119552, 119638, 119648, 119670, 126980, 126980, 127183, 127183, 127374, 127374, 127377, 127386, 127488, 127490, 127504, 127547, 127552, 127560, 127568, 127569, 127584, 127589, 127744, 127776, 127789, 127797, 127799, 127868, 127870, 127891, 127904, 127946, 127951, 127955, 127968, 127984, 127988, 127988, 127992, 128062, 128064, 128064, 128066, 128252, 128255, 128317, 128331, 128334, 128336, 128359, 128378, 128378, 128405, 128406, 128420, 128420, 128507, 128591, 128640, 128709, 128716, 128716, 128720, 128722, 128725, 128728, 128732, 128735, 128747, 128748, 128756, 128764, 128992, 129003, 129008, 129008, 129292, 129338, 129340, 129349, 129351, 129535, 129648, 129660, 129664, 129674, 129678, 129734, 129736, 129736, 129741, 129756, 129759, 129770, 129775, 129784, 131072, 196605, 196608, 262141];
});

// node_modules/.bun/get-east-asian-width@1.5.0/node_modules/get-east-asian-width/utilities.js
var isInRange = (ranges, codePoint) => {
  let low = 0;
  let high = Math.floor(ranges.length / 2) - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const i = mid * 2;
    if (codePoint < ranges[i]) {
      high = mid - 1;
    } else if (codePoint > ranges[i + 1]) {
      low = mid + 1;
    } else {
      return true;
    }
  }
  return false;
};
var init_utilities2 = () => {};

// node_modules/.bun/get-east-asian-width@1.5.0/node_modules/get-east-asian-width/lookup.js
function findWideFastPathRange(ranges) {
  let fastPathStart = ranges[0];
  let fastPathEnd = ranges[1];
  for (let index = 0;index < ranges.length; index += 2) {
    const start = ranges[index];
    const end = ranges[index + 1];
    if (commonCjkCodePoint >= start && commonCjkCodePoint <= end) {
      return [start, end];
    }
    if (end - start > fastPathEnd - fastPathStart) {
      fastPathStart = start;
      fastPathEnd = end;
    }
  }
  return [fastPathStart, fastPathEnd];
}
var minimumAmbiguousCodePoint, maximumAmbiguousCodePoint, minimumFullWidthCodePoint, maximumFullWidthCodePoint, minimumHalfWidthCodePoint, maximumHalfWidthCodePoint, minimumNarrowCodePoint, maximumNarrowCodePoint, minimumWideCodePoint, maximumWideCodePoint, commonCjkCodePoint = 19968, wideFastPathStart, wideFastPathEnd, isAmbiguous = (codePoint) => {
  if (codePoint < minimumAmbiguousCodePoint || codePoint > maximumAmbiguousCodePoint) {
    return false;
  }
  return isInRange(ambiguousRanges, codePoint);
}, isFullWidth = (codePoint) => {
  if (codePoint < minimumFullWidthCodePoint || codePoint > maximumFullWidthCodePoint) {
    return false;
  }
  return isInRange(fullwidthRanges, codePoint);
}, isWide = (codePoint) => {
  if (codePoint >= wideFastPathStart && codePoint <= wideFastPathEnd) {
    return true;
  }
  if (codePoint < minimumWideCodePoint || codePoint > maximumWideCodePoint) {
    return false;
  }
  return isInRange(wideRanges, codePoint);
};
var init_lookup = __esm(() => {
  init_lookup_data();
  init_utilities2();
  minimumAmbiguousCodePoint = ambiguousRanges[0];
  maximumAmbiguousCodePoint = ambiguousRanges.at(-1);
  minimumFullWidthCodePoint = fullwidthRanges[0];
  maximumFullWidthCodePoint = fullwidthRanges.at(-1);
  minimumHalfWidthCodePoint = halfwidthRanges[0];
  maximumHalfWidthCodePoint = halfwidthRanges.at(-1);
  minimumNarrowCodePoint = narrowRanges[0];
  maximumNarrowCodePoint = narrowRanges.at(-1);
  minimumWideCodePoint = wideRanges[0];
  maximumWideCodePoint = wideRanges.at(-1);
  [wideFastPathStart, wideFastPathEnd] = findWideFastPathRange(wideRanges);
});

// node_modules/.bun/get-east-asian-width@1.5.0/node_modules/get-east-asian-width/index.js
function validate(codePoint) {
  if (!Number.isSafeInteger(codePoint)) {
    throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
  }
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
  validate(codePoint);
  if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) {
    return 2;
  }
  return 1;
}
var init_get_east_asian_width = __esm(() => {
  init_lookup();
  init_lookup();
});

// node_modules/.bun/ansi-regex@6.2.2/node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const osc = `(?:\\u001B\\][\\s\\S]*?${ST})`;
  const csi2 = "[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]";
  const pattern = `${osc}|${csi2}`;
  return new RegExp(pattern, onlyFirst ? undefined : "g");
}
var init_ansi_regex = () => {};

// node_modules/.bun/strip-ansi@7.2.0/node_modules/strip-ansi/index.js
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  if (!string.includes("\x1B") && !string.includes("\x9B")) {
    return string;
  }
  return string.replace(regex, "");
}
var regex;
var init_strip_ansi = __esm(() => {
  init_ansi_regex();
  regex = ansiRegex();
});

// packages/@ant/ink/src/core/utils/grapheme.ts
function getGraphemeSegmenter() {
  if (!graphemeSegmenter) {
    graphemeSegmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme"
    });
  }
  return graphemeSegmenter;
}
var graphemeSegmenter = null;
var init_grapheme = () => {};

// packages/@ant/ink/src/core/stringWidth.ts
function stringWidthJavaScript(str) {
  if (typeof str !== "string" || str.length === 0) {
    return 0;
  }
  let isPureAscii = true;
  for (let i = 0;i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 127 || code === 27) {
      isPureAscii = false;
      break;
    }
  }
  if (isPureAscii) {
    let width2 = 0;
    for (let i = 0;i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code > 31) {
        width2++;
      }
    }
    return width2;
  }
  if (str.includes("\x1B")) {
    str = stripAnsi(str);
    if (str.length === 0) {
      return 0;
    }
  }
  if (!needsSegmentation(str)) {
    let width2 = 0;
    for (const char of str) {
      const codePoint = char.codePointAt(0);
      if (!isZeroWidth(codePoint)) {
        width2 += eastAsianWidth(codePoint, { ambiguousAsWide: false });
      }
    }
    return width2;
  }
  let width = 0;
  for (const { segment: grapheme } of getGraphemeSegmenter().segment(str)) {
    EMOJI_REGEX.lastIndex = 0;
    if (EMOJI_REGEX.test(grapheme)) {
      width += getEmojiWidth(grapheme);
      continue;
    }
    for (const char of grapheme) {
      const codePoint = char.codePointAt(0);
      if (!isZeroWidth(codePoint)) {
        width += eastAsianWidth(codePoint, { ambiguousAsWide: false });
        break;
      }
    }
  }
  return width;
}
function needsSegmentation(str) {
  for (const char of str) {
    const cp = char.codePointAt(0);
    if (cp >= 127744 && cp <= 129791)
      return true;
    if (cp >= 9728 && cp <= 10175)
      return true;
    if (cp >= 127462 && cp <= 127487)
      return true;
    if (cp >= 65024 && cp <= 65039)
      return true;
    if (cp === 8205)
      return true;
  }
  return false;
}
function getEmojiWidth(grapheme) {
  const first = grapheme.codePointAt(0);
  if (first >= 127462 && first <= 127487) {
    let count = 0;
    for (const _ of grapheme)
      count++;
    return count === 1 ? 1 : 2;
  }
  if (grapheme.length === 2) {
    const second = grapheme.codePointAt(1);
    if (second === 65039 && (first >= 48 && first <= 57 || first === 35 || first === 42)) {
      return 1;
    }
  }
  return 2;
}
function isZeroWidth(codePoint) {
  if (codePoint >= 32 && codePoint < 127)
    return false;
  if (codePoint >= 160 && codePoint < 768)
    return codePoint === 173;
  if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159)
    return true;
  if (codePoint >= 8203 && codePoint <= 8205 || codePoint === 65279 || codePoint >= 8288 && codePoint <= 8292) {
    return true;
  }
  if (codePoint >= 65024 && codePoint <= 65039 || codePoint >= 917760 && codePoint <= 917999) {
    return true;
  }
  if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) {
    return true;
  }
  if (codePoint >= 2304 && codePoint <= 3407) {
    const offset = codePoint & 127;
    if (offset <= 3)
      return true;
    if (offset >= 58 && offset <= 79)
      return true;
    if (offset >= 81 && offset <= 87)
      return true;
    if (offset >= 98 && offset <= 99)
      return true;
  }
  if (codePoint === 3633 || codePoint >= 3636 && codePoint <= 3642 || codePoint >= 3655 && codePoint <= 3662 || codePoint === 3761 || codePoint >= 3764 && codePoint <= 3772 || codePoint >= 3784 && codePoint <= 3789) {
    return true;
  }
  if (codePoint >= 1536 && codePoint <= 1541 || codePoint === 1757 || codePoint === 1807 || codePoint === 2274) {
    return true;
  }
  if (codePoint >= 55296 && codePoint <= 57343)
    return true;
  if (codePoint >= 917504 && codePoint <= 917631)
    return true;
  return false;
}
var EMOJI_REGEX, bunStringWidth, BUN_STRING_WIDTH_OPTS, stringWidth;
var init_stringWidth = __esm(() => {
  init_emoji_regex();
  init_get_east_asian_width();
  init_strip_ansi();
  init_grapheme();
  EMOJI_REGEX = emoji_regex_default();
  bunStringWidth = typeof Bun !== "undefined" && typeof Bun.stringWidth === "function" ? Bun.stringWidth : null;
  BUN_STRING_WIDTH_OPTS = { ambiguousIsNarrow: true };
  stringWidth = bunStringWidth ? (str) => bunStringWidth(str, BUN_STRING_WIDTH_OPTS) : stringWidthJavaScript;
});

// packages/@ant/ink/src/core/line-width-cache.ts
function lineWidth(line) {
  const cached = cache.get(line);
  if (cached !== undefined)
    return cached;
  const width = stringWidth(line);
  if (cache.size >= MAX_CACHE_SIZE) {
    cache.clear();
  }
  cache.set(line, width);
  return width;
}
var cache, MAX_CACHE_SIZE = 4096;
var init_line_width_cache = __esm(() => {
  init_stringWidth();
  cache = new Map;
});

// packages/@ant/ink/src/core/measure-text.ts
function measureText(text, maxWidth) {
  if (text.length === 0) {
    return {
      width: 0,
      height: 0
    };
  }
  const noWrap = maxWidth <= 0 || !Number.isFinite(maxWidth);
  let height = 0;
  let width = 0;
  let start = 0;
  while (start <= text.length) {
    const end = text.indexOf(`
`, start);
    const line = end === -1 ? text.substring(start) : text.substring(start, end);
    const w = lineWidth(line);
    width = Math.max(width, w);
    if (noWrap) {
      height++;
    } else {
      height += w === 0 ? 1 : Math.ceil(w / maxWidth);
    }
    if (end === -1)
      break;
    start = end + 1;
  }
  return { width, height };
}
var measure_text_default;
var init_measure_text = __esm(() => {
  init_line_width_cache();
  measure_text_default = measureText;
});

// packages/@ant/ink/src/core/node-cache.ts
function addPendingClear(parent, rect, isAbsolute) {
  const existing = pendingClears.get(parent);
  if (existing) {
    existing.push(rect);
  } else {
    pendingClears.set(parent, [rect]);
  }
  if (isAbsolute) {
    absoluteNodeRemoved = true;
  }
}
function consumeAbsoluteRemovedFlag() {
  const had = absoluteNodeRemoved;
  absoluteNodeRemoved = false;
  return had;
}
var nodeCache, pendingClears, absoluteNodeRemoved = false;
var init_node_cache = __esm(() => {
  nodeCache = new WeakMap;
  pendingClears = new WeakMap;
});

// packages/@ant/ink/src/core/squash-text-nodes.ts
function squashTextNodesToSegments(node, inheritedStyles = {}, inheritedHyperlink, out = []) {
  const mergedStyles = node.textStyles ? { ...inheritedStyles, ...node.textStyles } : inheritedStyles;
  for (const childNode of node.childNodes) {
    if (childNode === undefined) {
      continue;
    }
    if (childNode.nodeName === "#text") {
      if (childNode.nodeValue.length > 0) {
        out.push({
          text: childNode.nodeValue,
          styles: mergedStyles,
          hyperlink: inheritedHyperlink
        });
      }
    } else if (childNode.nodeName === "ink-text" || childNode.nodeName === "ink-virtual-text") {
      squashTextNodesToSegments(childNode, mergedStyles, inheritedHyperlink, out);
    } else if (childNode.nodeName === "ink-link") {
      const href = childNode.attributes["href"];
      squashTextNodesToSegments(childNode, mergedStyles, href || inheritedHyperlink, out);
    }
  }
  return out;
}
function squashTextNodes(node) {
  let text = "";
  for (const childNode of node.childNodes) {
    if (childNode === undefined) {
      continue;
    }
    if (childNode.nodeName === "#text") {
      text += childNode.nodeValue;
    } else if (childNode.nodeName === "ink-text" || childNode.nodeName === "ink-virtual-text") {
      text += squashTextNodes(childNode);
    } else if (childNode.nodeName === "ink-link") {
      text += squashTextNodes(childNode);
    }
  }
  return text;
}
var squash_text_nodes_default;
var init_squash_text_nodes = __esm(() => {
  squash_text_nodes_default = squashTextNodes;
});

// packages/@ant/ink/src/core/tabstops.ts
function expandTabs(text, interval = DEFAULT_TAB_INTERVAL) {
  if (!text.includes("\t")) {
    return text;
  }
  const tokenizer = createTokenizer();
  const tokens = tokenizer.feed(text);
  tokens.push(...tokenizer.flush());
  let result = "";
  let column = 0;
  for (const token of tokens) {
    if (token.type === "sequence") {
      result += token.value;
    } else {
      const parts = token.value.split(/(\t|\n)/);
      for (const part of parts) {
        if (part === "\t") {
          const spaces = interval - column % interval;
          result += " ".repeat(spaces);
          column += spaces;
        } else if (part === `
`) {
          result += part;
          column = 0;
        } else {
          result += part;
          column += stringWidth(part);
        }
      }
    }
  }
  return result;
}
var DEFAULT_TAB_INTERVAL = 8;
var init_tabstops = __esm(() => {
  init_stringWidth();
  init_tokenize();
});

// node_modules/.bun/ansi-styles@6.2.3/node_modules/ansi-styles/index.js
function assembleStyles2() {
  const codes = new Map;
  for (const [groupName, group] of Object.entries(styles3)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles3[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles3[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles3, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles3, "codes", {
    value: codes,
    enumerable: false
  });
  styles3.color.close = "\x1B[39m";
  styles3.bgColor.close = "\x1B[49m";
  styles3.color.ansi = wrapAnsi162();
  styles3.color.ansi256 = wrapAnsi2562();
  styles3.color.ansi16m = wrapAnsi16m2();
  styles3.bgColor.ansi = wrapAnsi162(ANSI_BACKGROUND_OFFSET2);
  styles3.bgColor.ansi256 = wrapAnsi2562(ANSI_BACKGROUND_OFFSET2);
  styles3.bgColor.ansi16m = wrapAnsi16m2(ANSI_BACKGROUND_OFFSET2);
  Object.defineProperties(styles3, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles3.rgbToAnsi256(...styles3.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles3.ansi256ToAnsi(styles3.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles3.ansi256ToAnsi(styles3.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles3;
}
var ANSI_BACKGROUND_OFFSET2 = 10, wrapAnsi162 = (offset = 0) => (code) => `\x1B[${code + offset}m`, wrapAnsi2562 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`, wrapAnsi16m2 = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`, styles3, modifierNames2, foregroundColorNames2, backgroundColorNames2, colorNames2, ansiStyles2, ansi_styles_default2;
var init_ansi_styles2 = __esm(() => {
  styles3 = {
    modifier: {
      reset: [0, 0],
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      overline: [53, 55],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29]
    },
    color: {
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      blackBright: [90, 39],
      gray: [90, 39],
      grey: [90, 39],
      redBright: [91, 39],
      greenBright: [92, 39],
      yellowBright: [93, 39],
      blueBright: [94, 39],
      magentaBright: [95, 39],
      cyanBright: [96, 39],
      whiteBright: [97, 39]
    },
    bgColor: {
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      bgBlackBright: [100, 49],
      bgGray: [100, 49],
      bgGrey: [100, 49],
      bgRedBright: [101, 49],
      bgGreenBright: [102, 49],
      bgYellowBright: [103, 49],
      bgBlueBright: [104, 49],
      bgMagentaBright: [105, 49],
      bgCyanBright: [106, 49],
      bgWhiteBright: [107, 49]
    }
  };
  modifierNames2 = Object.keys(styles3.modifier);
  foregroundColorNames2 = Object.keys(styles3.color);
  backgroundColorNames2 = Object.keys(styles3.bgColor);
  colorNames2 = [...foregroundColorNames2, ...backgroundColorNames2];
  ansiStyles2 = assembleStyles2();
  ansi_styles_default2 = ansiStyles2;
});

// node_modules/.bun/@alcalzone+ansi-tokenize@0.3.0/node_modules/@alcalzone/ansi-tokenize/build/consts.js
var BEL2 = "\x07", ESC2 = "\x1B", BACKSLASH = "\\", CSI2 = "[", OSC = "]", C1_ST = "\x9C", CC_BEL, CC_ESC, CC_BACKSLASH, CC_CSI, CC_OSC, CC_C1_ST, CC_0 = 48, CC_9 = 57, CC_SEMI = 59, CC_M = 109, ESCAPES, linkCodePrefix, linkCodePrefixCharCodes, linkEndCode, linkEndCodeST, linkEndCodeC1ST;
var init_consts = __esm(() => {
  CC_BEL = BEL2.charCodeAt(0);
  CC_ESC = ESC2.charCodeAt(0);
  CC_BACKSLASH = BACKSLASH.charCodeAt(0);
  CC_CSI = CSI2.charCodeAt(0);
  CC_OSC = OSC.charCodeAt(0);
  CC_C1_ST = C1_ST.charCodeAt(0);
  ESCAPES = new Set([CC_ESC, 155]);
  linkCodePrefix = `${ESC2}${OSC}8;`;
  linkCodePrefixCharCodes = linkCodePrefix.split("").map((char) => char.charCodeAt(0));
  linkEndCode = `${ESC2}${OSC}8;;${BEL2}`;
  linkEndCodeST = `${ESC2}${OSC}8;;${ESC2}${BACKSLASH}`;
  linkEndCodeC1ST = `${ESC2}${OSC}8;;${C1_ST}`;
});

// node_modules/.bun/@alcalzone+ansi-tokenize@0.3.0/node_modules/@alcalzone/ansi-tokenize/build/ansiCodes.js
function getEndCode(code) {
  if (endCodesSet.has(code))
    return code;
  if (endCodesMap.has(code))
    return endCodesMap.get(code);
  if (code.startsWith(linkCodePrefix)) {
    if (code.endsWith("\x1B\\"))
      return linkEndCodeST;
    if (code.endsWith("\x9C"))
      return linkEndCodeC1ST;
    return linkEndCode;
  }
  code = code.slice(2);
  if (code.startsWith("38")) {
    return ansi_styles_default2.color.close;
  } else if (code.startsWith("48")) {
    return ansi_styles_default2.bgColor.close;
  }
  const ret = ansi_styles_default2.codes.get(parseInt(code, 10));
  if (ret) {
    return ansi_styles_default2.color.ansi(ret);
  } else {
    return ansi_styles_default2.reset.open;
  }
}
function ansiCodesToString(codes) {
  const deduplicated = new Set(codes.map((code) => code.code));
  return [...deduplicated].join("");
}
function isIntensityCode(code) {
  return code.code === ansi_styles_default2.bold.open || code.code === ansi_styles_default2.dim.open;
}
var endCodesSet, endCodesMap;
var init_ansiCodes = __esm(() => {
  init_ansi_styles2();
  init_consts();
  endCodesSet = new Set;
  endCodesMap = new Map;
  for (const [start, end] of ansi_styles_default2.codes) {
    endCodesSet.add(ansi_styles_default2.color.ansi(end));
    endCodesMap.set(ansi_styles_default2.color.ansi(start), ansi_styles_default2.color.ansi(end));
  }
});

// node_modules/.bun/@alcalzone+ansi-tokenize@0.3.0/node_modules/@alcalzone/ansi-tokenize/build/reduce.js
function reduceAnsiCodes(codes) {
  return reduceAnsiCodesIncremental([], codes);
}
function reduceAnsiCodesIncremental(codes, newCodes) {
  let ret = [...codes];
  for (const code of newCodes) {
    if (code.code === ansi_styles_default2.reset.open) {
      ret = [];
    } else if (endCodesSet.has(code.code)) {
      ret = ret.filter((retCode) => retCode.endCode !== code.code);
    } else {
      if (isIntensityCode(code)) {
        if (!ret.find((retCode) => retCode.code === code.code && retCode.endCode === code.endCode)) {
          ret.push(code);
        }
      } else {
        ret = ret.filter((retCode) => retCode.endCode !== code.endCode);
        ret.push(code);
      }
    }
  }
  return ret;
}
var init_reduce = __esm(() => {
  init_ansi_styles2();
  init_ansiCodes();
});

// node_modules/.bun/@alcalzone+ansi-tokenize@0.3.0/node_modules/@alcalzone/ansi-tokenize/build/undo.js
function undoAnsiCodes(codes) {
  return reduceAnsiCodes(codes).reverse().map((code) => ({
    ...code,
    code: code.endCode
  }));
}
var init_undo = __esm(() => {
  init_reduce();
});

// node_modules/.bun/@alcalzone+ansi-tokenize@0.3.0/node_modules/@alcalzone/ansi-tokenize/build/diff.js
function diffAnsiCodes(from, to) {
  const endCodesInTo = new Set(to.map((code) => code.endCode));
  const startCodesInTo = new Set(to.map((code) => code.code));
  const startCodesInFrom = new Set(from.map((code) => code.code));
  return [
    ...undoAnsiCodes(from.filter((code) => {
      if (isIntensityCode(code)) {
        return !startCodesInTo.has(code.code);
      }
      return !endCodesInTo.has(code.endCode);
    })),
    ...to.filter((code) => !startCodesInFrom.has(code.code))
  ];
}
var init_diff = __esm(() => {
  init_ansiCodes();
  init_undo();
});

// node_modules/.bun/@alcalzone+ansi-tokenize@0.3.0/node_modules/@alcalzone/ansi-tokenize/build/styledChars.js
function styledCharsFromTokens(tokens) {
  let codes = [];
  const ret = [];
  for (const token of tokens) {
    if (token.type === "ansi") {
      codes = reduceAnsiCodesIncremental(codes, [token]);
    } else if (token.type === "char") {
      ret.push({
        ...token,
        styles: [...codes]
      });
    }
  }
  return ret;
}
var init_styledChars = __esm(() => {
  init_ansiCodes();
  init_diff();
  init_reduce();
});

// node_modules/.bun/is-fullwidth-code-point@5.1.0/node_modules/is-fullwidth-code-point/index.js
function isFullwidthCodePoint(codePoint) {
  if (!Number.isInteger(codePoint)) {
    return false;
  }
  return isFullWidth(codePoint) || isWide(codePoint);
}
var init_is_fullwidth_code_point = __esm(() => {
  init_get_east_asian_width();
});

// node_modules/.bun/@alcalzone+ansi-tokenize@0.3.0/node_modules/@alcalzone/ansi-tokenize/build/tokenize.js
function isFullwidthGrapheme(grapheme, baseCodePoint) {
  if (isFullwidthCodePoint(baseCodePoint))
    return true;
  if (grapheme.includes("\uFE0F"))
    return true;
  if (baseCodePoint >= 127462 && baseCodePoint <= 127487)
    return true;
  return false;
}
function parseLinkCode(string, offset) {
  string = string.slice(offset);
  for (let index = 1;index < linkCodePrefixCharCodes.length; index++) {
    if (string.charCodeAt(index) !== linkCodePrefixCharCodes[index]) {
      return;
    }
  }
  const paramsEndIndex = string.indexOf(";", linkCodePrefix.length);
  if (paramsEndIndex === -1)
    return;
  const endIndex = findOSCTerminatorIndex(string, paramsEndIndex + 1);
  if (endIndex === -1)
    return;
  return string.slice(0, endIndex + 1);
}
function parseOSCSequence(string, offset) {
  string = string.slice(offset);
  const endIndex = findOSCTerminatorIndex(string, 2);
  if (endIndex === -1)
    return;
  return string.slice(0, endIndex + 1);
}
function findOSCTerminatorIndex(string, startIndex) {
  for (let i = startIndex;i < string.length; i++) {
    const ch = string.charCodeAt(i);
    if (ch === CC_BEL)
      return i;
    if (ch === CC_C1_ST)
      return i;
    if (ch === CC_ESC && i + 1 < string.length && string.charCodeAt(i + 1) === CC_BACKSLASH) {
      return i + 1;
    }
  }
  return -1;
}
function findSGRSequenceEndIndex(str) {
  for (let index = 2;index < str.length; index++) {
    const charCode = str.charCodeAt(index);
    if (charCode === CC_M)
      return index;
    if (charCode === CC_SEMI)
      continue;
    if (charCode >= CC_0 && charCode <= CC_9)
      continue;
    break;
  }
  return -1;
}
function parseSGRSequence(string, offset) {
  string = string.slice(offset);
  const endIndex = findSGRSequenceEndIndex(string);
  if (endIndex === -1)
    return;
  return string.slice(0, endIndex + 1);
}
function splitCompoundSGRSequences(code) {
  if (!code.includes(";")) {
    return [code];
  }
  const codeParts = code.slice(2, -1).split(";");
  const ret = [];
  for (let i = 0;i < codeParts.length; i++) {
    const rawCode = codeParts[i];
    if (rawCode === "38" || rawCode === "48") {
      if (i + 2 < codeParts.length && codeParts[i + 1] === "5") {
        ret.push(codeParts.slice(i, i + 3).join(";"));
        i += 2;
        continue;
      } else if (i + 4 < codeParts.length && codeParts[i + 1] === "2") {
        ret.push(codeParts.slice(i, i + 5).join(";"));
        i += 4;
        continue;
      }
    }
    ret.push(rawCode);
  }
  return ret.map((part) => `\x1B[${part}m`);
}
function tokenize2(str, endChar = Number.POSITIVE_INFINITY) {
  const ret = [];
  let visible = 0;
  let codeEndIndex = 0;
  for (const { segment, index } of segmenter.segment(str)) {
    if (index < codeEndIndex)
      continue;
    const codePoint = segment.codePointAt(0);
    if (ESCAPES.has(codePoint)) {
      let code;
      const nextCodePoint = str.codePointAt(index + 1);
      if (nextCodePoint === CC_OSC) {
        code = parseLinkCode(str, index);
        if (code) {
          ret.push({
            type: "ansi",
            code,
            endCode: getEndCode(code)
          });
        } else {
          code = parseOSCSequence(str, index);
          if (code) {
            ret.push({
              type: "control",
              code
            });
          }
        }
      } else if (nextCodePoint === CC_CSI) {
        code = parseSGRSequence(str, index);
        if (code) {
          const codes = splitCompoundSGRSequences(code);
          for (const individualCode of codes) {
            ret.push({
              type: "ansi",
              code: individualCode,
              endCode: getEndCode(individualCode)
            });
          }
        }
      }
      if (code) {
        codeEndIndex = index + code.length;
        continue;
      }
    }
    const fullWidth = isFullwidthGrapheme(segment, codePoint);
    ret.push({
      type: "char",
      value: segment,
      fullWidth
    });
    visible += fullWidth ? 2 : 1;
    if (visible >= endChar) {
      break;
    }
  }
  return ret;
}
var segmenter;
var init_tokenize2 = __esm(() => {
  init_is_fullwidth_code_point();
  init_ansiCodes();
  init_consts();
  segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
});

// node_modules/.bun/@alcalzone+ansi-tokenize@0.3.0/node_modules/@alcalzone/ansi-tokenize/build/index.js
var init_build = __esm(() => {
  init_ansiCodes();
  init_diff();
  init_reduce();
  init_undo();
  init_styledChars();
  init_tokenize2();
});

// packages/@ant/ink/src/core/utils/sliceAnsi.ts
function isEndCode(code) {
  return code.code === code.endCode;
}
function filterStartCodes(codes) {
  return codes.filter((c) => !isEndCode(c));
}
function sliceAnsi(str, start, end) {
  const tokens = tokenize2(str);
  let activeCodes = [];
  let position = 0;
  let result = "";
  let include = false;
  for (const token of tokens) {
    const width = token.type === "ansi" ? 0 : token.type === "char" ? token.fullWidth ? 2 : stringWidth(token.value) : 0;
    if (end !== undefined && position >= end) {
      if (token.type === "ansi" || width > 0 || !include)
        break;
    }
    if (token.type === "ansi") {
      activeCodes.push(token);
      if (include) {
        result += token.code;
      }
    } else {
      if (!include && position >= start) {
        if (start > 0 && width === 0)
          continue;
        include = true;
        activeCodes = filterStartCodes(reduceAnsiCodes(activeCodes));
        result = ansiCodesToString(activeCodes);
      }
      if (include) {
        result += token.value;
      }
      position += width;
    }
  }
  const activeStartCodes = filterStartCodes(reduceAnsiCodes(activeCodes));
  result += ansiCodesToString(undoAnsiCodes(activeStartCodes));
  return result;
}
var init_sliceAnsi = __esm(() => {
  init_build();
  init_stringWidth();
});

// node_modules/.bun/string-width@8.2.0/node_modules/string-width/index.js
function isDoubleWidthNonRgiEmojiSequence(segment) {
  if (segment.length > 50) {
    return false;
  }
  if (unqualifiedKeycapRegex.test(segment)) {
    return true;
  }
  if (segment.includes("\u200D")) {
    const pictographics = segment.match(extendedPictographicRegex);
    return pictographics !== null && pictographics.length >= 2;
  }
  return false;
}
function baseVisible(segment) {
  return segment.replace(leadingNonPrintingRegex, "");
}
function isZeroWidthCluster(segment) {
  return zeroWidthClusterRegex.test(segment);
}
function trailingHalfwidthWidth(segment, eastAsianWidthOptions) {
  let extra = 0;
  if (segment.length > 1) {
    for (const char of segment.slice(1)) {
      if (char >= "\uFF00" && char <= "\uFFEF") {
        extra += eastAsianWidth(char.codePointAt(0), eastAsianWidthOptions);
      }
    }
  }
  return extra;
}
function stringWidth2(input, options = {}) {
  if (typeof input !== "string" || input.length === 0) {
    return 0;
  }
  const {
    ambiguousIsNarrow = true,
    countAnsiEscapeCodes = false
  } = options;
  let string = input;
  if (!countAnsiEscapeCodes && (string.includes("\x1B") || string.includes("\x9B"))) {
    string = stripAnsi(string);
  }
  if (string.length === 0) {
    return 0;
  }
  if (/^[\u0020-\u007E]*$/.test(string)) {
    return string.length;
  }
  let width = 0;
  const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
  for (const { segment } of segmenter2.segment(string)) {
    if (isZeroWidthCluster(segment)) {
      continue;
    }
    if (rgiEmojiRegex.test(segment) || isDoubleWidthNonRgiEmojiSequence(segment)) {
      width += 2;
      continue;
    }
    const codePoint = baseVisible(segment).codePointAt(0);
    width += eastAsianWidth(codePoint, eastAsianWidthOptions);
    width += trailingHalfwidthWidth(segment, eastAsianWidthOptions);
  }
  return width;
}
var segmenter2, zeroWidthClusterRegex, leadingNonPrintingRegex, rgiEmojiRegex, unqualifiedKeycapRegex, extendedPictographicRegex;
var init_string_width = __esm(() => {
  init_strip_ansi();
  init_get_east_asian_width();
  segmenter2 = new Intl.Segmenter;
  zeroWidthClusterRegex = /^(?:\p{Default_Ignorable_Code_Point}|\p{Control}|\p{Format}|\p{Mark}|\p{Surrogate})+$/v;
  leadingNonPrintingRegex = /^[\p{Default_Ignorable_Code_Point}\p{Control}\p{Format}\p{Mark}\p{Surrogate}]+/v;
  rgiEmojiRegex = /^\p{RGI_Emoji}$/v;
  unqualifiedKeycapRegex = /^[\d#*]\u20E3$/;
  extendedPictographicRegex = /\p{Extended_Pictographic}/gu;
});

// node_modules/.bun/wrap-ansi@10.0.0/node_modules/wrap-ansi/index.js
function wrapAnsi(string, columns, options) {
  return String(string).normalize().replaceAll(`\r
`, `
`).split(`
`).map((line) => exec(expandTabs2(line), columns, options)).join(`
`);
}
var ANSI_ESCAPE = "\x1B", ANSI_ESCAPE_CSI = "\x9B", ESCAPES2, ANSI_ESCAPE_BELL = "\x07", ANSI_CSI = "[", ANSI_OSC = "]", ANSI_SGR_TERMINATOR = "m", ANSI_SGR_RESET = 0, ANSI_SGR_RESET_FOREGROUND = 39, ANSI_SGR_RESET_BACKGROUND = 49, ANSI_SGR_RESET_UNDERLINE_COLOR = 59, ANSI_SGR_FOREGROUND_EXTENDED = 38, ANSI_SGR_BACKGROUND_EXTENDED = 48, ANSI_SGR_UNDERLINE_COLOR_EXTENDED = 58, ANSI_SGR_COLOR_MODE_256 = 5, ANSI_SGR_COLOR_MODE_RGB = 2, ANSI_ESCAPE_LINK, ANSI_ESCAPE_REGEX, ANSI_ESCAPE_CSI_REGEX, ANSI_SGR_MODIFIER_CLOSE_CODES, segmenter3, getGraphemes = (string) => Array.from(segmenter3.segment(string), ({ segment }) => segment), TAB_SIZE = 8, wrapAnsiCode = (code) => `${ANSI_ESCAPE}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`, wrapAnsiHyperlink = (url) => `${ANSI_ESCAPE}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`, getSgrTokens = (sgrParameters) => {
  const codes = sgrParameters.split(";").map((sgrParameter) => sgrParameter === "" ? ANSI_SGR_RESET : Number.parseInt(sgrParameter, 10));
  const sgrTokens = [];
  for (let index = 0;index < codes.length; index++) {
    const code = codes[index];
    if (!Number.isFinite(code)) {
      continue;
    }
    if (code === ANSI_SGR_FOREGROUND_EXTENDED || code === ANSI_SGR_BACKGROUND_EXTENDED || code === ANSI_SGR_UNDERLINE_COLOR_EXTENDED) {
      if (index + 1 >= codes.length) {
        break;
      }
      const mode = codes[index + 1];
      if (mode === ANSI_SGR_COLOR_MODE_256 && Number.isFinite(codes[index + 2])) {
        sgrTokens.push([code, mode, codes[index + 2]]);
        index += 2;
        continue;
      }
      const red = codes[index + 2];
      const green = codes[index + 3];
      const blue = codes[index + 4];
      if (mode === ANSI_SGR_COLOR_MODE_RGB && Number.isFinite(red) && Number.isFinite(green) && Number.isFinite(blue)) {
        sgrTokens.push([code, mode, red, green, blue]);
        index += 4;
        continue;
      }
      break;
    }
    sgrTokens.push([code]);
  }
  return sgrTokens;
}, removeActiveStyle = (activeStyles, family) => {
  const activeStyleIndex = activeStyles.findIndex((activeStyle) => activeStyle.family === family);
  if (activeStyleIndex !== -1) {
    activeStyles.splice(activeStyleIndex, 1);
  }
}, upsertActiveStyle = (activeStyles, nextActiveStyle) => {
  removeActiveStyle(activeStyles, nextActiveStyle.family);
  activeStyles.push(nextActiveStyle);
}, removeModifierStylesByClose = (activeStyles, closeCode) => {
  for (let index = activeStyles.length - 1;index >= 0; index--) {
    const activeStyle = activeStyles[index];
    if (activeStyle.family.startsWith("modifier-") && activeStyle.close === closeCode) {
      activeStyles.splice(index, 1);
    }
  }
}, getColorStyle = (code, sgrToken) => {
  if (code >= 30 && code <= 37 || code >= 90 && code <= 97 || code === ANSI_SGR_FOREGROUND_EXTENDED && sgrToken.length > 1) {
    return {
      family: "foreground",
      open: sgrToken.join(";"),
      close: ANSI_SGR_RESET_FOREGROUND
    };
  }
  if (code >= 40 && code <= 47 || code >= 100 && code <= 107 || code === ANSI_SGR_BACKGROUND_EXTENDED && sgrToken.length > 1) {
    return {
      family: "background",
      open: sgrToken.join(";"),
      close: ANSI_SGR_RESET_BACKGROUND
    };
  }
  if (code === ANSI_SGR_UNDERLINE_COLOR_EXTENDED && sgrToken.length > 1) {
    return {
      family: "underlineColor",
      open: sgrToken.join(";"),
      close: ANSI_SGR_RESET_UNDERLINE_COLOR
    };
  }
}, applySgrResetCode = (code, activeStyles) => {
  if (code === ANSI_SGR_RESET) {
    activeStyles.length = 0;
    return true;
  }
  if (code === ANSI_SGR_RESET_FOREGROUND) {
    removeActiveStyle(activeStyles, "foreground");
    return true;
  }
  if (code === ANSI_SGR_RESET_BACKGROUND) {
    removeActiveStyle(activeStyles, "background");
    return true;
  }
  if (code === ANSI_SGR_RESET_UNDERLINE_COLOR) {
    removeActiveStyle(activeStyles, "underlineColor");
    return true;
  }
  if (ANSI_SGR_MODIFIER_CLOSE_CODES.has(code)) {
    removeModifierStylesByClose(activeStyles, code);
    return true;
  }
  return false;
}, applySgrToken = (sgrToken, activeStyles) => {
  const [code] = sgrToken;
  if (applySgrResetCode(code, activeStyles)) {
    return;
  }
  const colorStyle = getColorStyle(code, sgrToken);
  if (colorStyle) {
    upsertActiveStyle(activeStyles, colorStyle);
    return;
  }
  const close = ansi_styles_default2.codes.get(code);
  if (close !== undefined && close !== ANSI_SGR_RESET) {
    upsertActiveStyle(activeStyles, {
      family: `modifier-${code}`,
      open: sgrToken.join(";"),
      close
    });
  }
}, applySgrParameters = (sgrParameters, activeStyles) => {
  for (const sgrToken of getSgrTokens(sgrParameters)) {
    applySgrToken(sgrToken, activeStyles);
  }
}, applySgrResets = (sgrParameters, activeStyles) => {
  for (const sgrToken of getSgrTokens(sgrParameters)) {
    const [code] = sgrToken;
    applySgrResetCode(code, activeStyles);
  }
}, applyLeadingSgrResets = (string, activeStyles) => {
  let remainder = string;
  while (remainder.length > 0) {
    if (remainder.startsWith(ANSI_ESCAPE) && remainder[1] !== "\\") {
      const match = ANSI_ESCAPE_REGEX.exec(remainder);
      if (!match) {
        break;
      }
      if (match.groups.sgr !== undefined) {
        applySgrResets(match.groups.sgr, activeStyles);
      }
      remainder = remainder.slice(match[0].length);
      continue;
    }
    if (remainder.startsWith(ANSI_ESCAPE_CSI)) {
      const match = ANSI_ESCAPE_CSI_REGEX.exec(remainder);
      if (!match || match.groups.sgr === undefined) {
        break;
      }
      applySgrResets(match.groups.sgr, activeStyles);
      remainder = remainder.slice(match[0].length);
      continue;
    }
    break;
  }
}, getClosingSgrSequence = (activeStyles) => [...activeStyles].reverse().map((activeStyle) => wrapAnsiCode(activeStyle.close)).join(""), getOpeningSgrSequence = (activeStyles) => activeStyles.map((activeStyle) => wrapAnsiCode(activeStyle.open)).join(""), wordLengths = (string) => string.split(" ").map((word) => stringWidth2(word)), wrapWord = (rows, word, columns) => {
  const characters = getGraphemes(word);
  let isInsideEscape = false;
  let isInsideLinkEscape = false;
  let visible = stringWidth2(stripAnsi(rows.at(-1)));
  for (const [index, character] of characters.entries()) {
    const characterLength = stringWidth2(character);
    if (visible + characterLength <= columns) {
      rows[rows.length - 1] += character;
    } else {
      rows.push(character);
      visible = 0;
    }
    if (ESCAPES2.has(character) && !(isInsideLinkEscape && character === ANSI_ESCAPE && characters[index + 1] === "\\")) {
      isInsideEscape = true;
      const ansiEscapeLinkCandidate = characters.slice(index + 1, index + 1 + ANSI_ESCAPE_LINK.length).join("");
      isInsideLinkEscape = ansiEscapeLinkCandidate === ANSI_ESCAPE_LINK;
    }
    if (isInsideEscape) {
      if (isInsideLinkEscape) {
        if (character === ANSI_ESCAPE_BELL || character === "\\" && index > 0 && characters[index - 1] === ANSI_ESCAPE) {
          isInsideEscape = false;
          isInsideLinkEscape = false;
        }
      } else if (character === ANSI_SGR_TERMINATOR) {
        isInsideEscape = false;
      }
      continue;
    }
    visible += characterLength;
    if (visible === columns && index < characters.length - 1) {
      rows.push("");
      visible = 0;
    }
  }
  if (!visible && rows.at(-1).length > 0 && rows.length > 1) {
    rows[rows.length - 2] += rows.pop();
  }
}, stringVisibleTrimSpacesRight = (string) => {
  const words = string.split(" ");
  let last = words.length;
  while (last > 0) {
    if (stringWidth2(words[last - 1]) > 0) {
      break;
    }
    last--;
  }
  if (last === words.length) {
    return string;
  }
  return words.slice(0, last).join(" ") + words.slice(last).join("");
}, expandTabs2 = (line) => {
  if (!line.includes("\t")) {
    return line;
  }
  const segments = line.split("\t");
  let visible = 0;
  let expandedLine = "";
  for (const [index, segment] of segments.entries()) {
    expandedLine += segment;
    visible += stringWidth2(segment);
    if (index < segments.length - 1) {
      const spaces = TAB_SIZE - visible % TAB_SIZE;
      expandedLine += " ".repeat(spaces);
      visible += spaces;
    }
  }
  return expandedLine;
}, exec = (string, columns, options = {}) => {
  if (options.trim !== false && string.trim() === "") {
    return "";
  }
  let returnValue = "";
  let escapeUrl;
  const activeStyles = [];
  const lengths = wordLengths(string);
  let rows = [""];
  for (const [index, word] of string.split(" ").entries()) {
    if (options.trim !== false) {
      rows[rows.length - 1] = rows.at(-1).trimStart();
    }
    let rowLength = stringWidth2(rows.at(-1));
    if (index !== 0) {
      if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
        rows.push("");
        rowLength = 0;
      }
      if (rowLength > 0 || options.trim === false) {
        rows[rows.length - 1] += " ";
        rowLength++;
      }
    }
    if (options.hard && options.wordWrap !== false && lengths[index] > columns) {
      const remainingColumns = columns - rowLength;
      const breaksStartingThisLine = 1 + Math.floor((lengths[index] - remainingColumns - 1) / columns);
      const breaksStartingNextLine = Math.floor((lengths[index] - 1) / columns);
      if (breaksStartingNextLine < breaksStartingThisLine) {
        rows.push("");
      }
      wrapWord(rows, word, columns);
      continue;
    }
    if (rowLength + lengths[index] > columns && rowLength > 0 && lengths[index] > 0) {
      if (options.wordWrap === false && rowLength < columns) {
        wrapWord(rows, word, columns);
        continue;
      }
      rows.push("");
    }
    if (rowLength + lengths[index] > columns && options.wordWrap === false) {
      wrapWord(rows, word, columns);
      continue;
    }
    rows[rows.length - 1] += word;
  }
  if (options.trim !== false) {
    rows = rows.map((row) => stringVisibleTrimSpacesRight(row));
  }
  const preString = rows.join(`
`);
  const pre = getGraphemes(preString);
  let preStringIndex = 0;
  for (const [index, character] of pre.entries()) {
    returnValue += character;
    if (character === ANSI_ESCAPE && pre[index + 1] !== "\\") {
      const { groups } = ANSI_ESCAPE_REGEX.exec(preString.slice(preStringIndex)) || { groups: {} };
      if (groups.sgr !== undefined) {
        applySgrParameters(groups.sgr, activeStyles);
      } else if (groups.uri !== undefined) {
        escapeUrl = groups.uri.length === 0 ? undefined : groups.uri;
      }
    } else if (character === ANSI_ESCAPE_CSI) {
      const { groups } = ANSI_ESCAPE_CSI_REGEX.exec(preString.slice(preStringIndex)) || { groups: {} };
      if (groups.sgr !== undefined) {
        applySgrParameters(groups.sgr, activeStyles);
      }
    }
    if (pre[index + 1] === `
`) {
      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink("");
      }
      returnValue += getClosingSgrSequence(activeStyles);
    } else if (character === `
`) {
      const openingStyles = [...activeStyles];
      applyLeadingSgrResets(preString.slice(preStringIndex + 1), openingStyles);
      returnValue += getOpeningSgrSequence(openingStyles);
      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink(escapeUrl);
      }
    }
    preStringIndex += character.length;
  }
  return returnValue;
};
var init_wrap_ansi = __esm(() => {
  init_string_width();
  init_strip_ansi();
  init_ansi_styles2();
  ESCAPES2 = new Set([
    ANSI_ESCAPE,
    ANSI_ESCAPE_CSI
  ]);
  ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
  ANSI_ESCAPE_REGEX = new RegExp(`^\\u001B(?:\\${ANSI_CSI}(?<sgr>[0-9;]*)${ANSI_SGR_TERMINATOR}|${ANSI_ESCAPE_LINK}(?<uri>[^\\u0007\\u001B]*)(?:\\u0007|\\u001B\\\\))`);
  ANSI_ESCAPE_CSI_REGEX = new RegExp(`^\\u009B(?<sgr>[0-9;]*)${ANSI_SGR_TERMINATOR}`);
  ANSI_SGR_MODIFIER_CLOSE_CODES = new Set(ansi_styles_default2.codes.values());
  ANSI_SGR_MODIFIER_CLOSE_CODES.delete(ANSI_SGR_RESET);
  segmenter3 = new Intl.Segmenter;
});

// packages/@ant/ink/src/core/wrapAnsi.ts
var wrapAnsiBun, wrapAnsi2;
var init_wrapAnsi = __esm(() => {
  init_wrap_ansi();
  wrapAnsiBun = typeof Bun !== "undefined" && typeof Bun.wrapAnsi === "function" ? Bun.wrapAnsi : null;
  wrapAnsi2 = wrapAnsiBun ?? wrapAnsi;
});

// packages/@ant/ink/src/core/wrap-text.ts
function sliceFit(text, start, end) {
  const s = sliceAnsi(text, start, end);
  return stringWidth(s) > end - start ? sliceAnsi(text, start, end - 1) : s;
}
function truncate(text, columns, position) {
  if (columns < 1)
    return "";
  if (columns === 1)
    return ELLIPSIS;
  const length = stringWidth(text);
  if (length <= columns)
    return text;
  if (position === "start") {
    return ELLIPSIS + sliceFit(text, length - columns + 1, length);
  }
  if (position === "middle") {
    const half = Math.floor(columns / 2);
    return sliceFit(text, 0, half) + ELLIPSIS + sliceFit(text, length - (columns - half) + 1, length);
  }
  return sliceFit(text, 0, columns - 1) + ELLIPSIS;
}
function wrapText(text, maxWidth, wrapType) {
  if (wrapType === "wrap") {
    return wrapAnsi2(text, maxWidth, {
      trim: false,
      hard: true
    });
  }
  if (wrapType === "wrap-trim") {
    return wrapAnsi2(text, maxWidth, {
      trim: true,
      hard: true
    });
  }
  if (wrapType.startsWith("truncate")) {
    let position = "end";
    if (wrapType === "truncate-middle") {
      position = "middle";
    }
    if (wrapType === "truncate-start") {
      position = "start";
    }
    return truncate(text, maxWidth, position);
  }
  return text;
}
var ELLIPSIS = "\u2026";
var init_wrap_text = __esm(() => {
  init_sliceAnsi();
  init_stringWidth();
  init_wrapAnsi();
});

// packages/@ant/ink/src/core/dom.ts
function collectRemovedRects(parent, removed, underAbsolute = false) {
  if (removed.nodeName === "#text")
    return;
  const elem = removed;
  const isAbsolute = underAbsolute || elem.style.position === "absolute";
  const cached = nodeCache.get(elem);
  if (cached) {
    addPendingClear(parent, cached, isAbsolute);
    nodeCache.delete(elem);
  }
  for (const child of elem.childNodes) {
    collectRemovedRects(parent, child, isAbsolute);
  }
}
function stylesEqual(a, b) {
  return shallowEqual(a, b);
}
function shallowEqual(a, b) {
  if (a === b)
    return true;
  if (a === undefined || b === undefined)
    return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length)
    return false;
  for (const key of aKeys) {
    if (a[key] !== b[key])
      return false;
  }
  return true;
}
function isDOMElement(node) {
  return node.nodeName !== "#text";
}
function findOwnerChainAtRow(root, y) {
  let best = [];
  walk(root, 0);
  return best;
  function walk(node, offsetY) {
    const yoga = node.yogaNode;
    if (!yoga || yoga.getDisplay() === LayoutDisplay.None)
      return;
    const top = offsetY + yoga.getComputedTop();
    const height = yoga.getComputedHeight();
    if (y < top || y >= top + height)
      return;
    if (node.debugOwnerChain)
      best = node.debugOwnerChain;
    for (const child of node.childNodes) {
      if (isDOMElement(child))
        walk(child, top);
    }
  }
}
var createNode = (nodeName) => {
  const needsYogaNode = nodeName !== "ink-virtual-text" && nodeName !== "ink-link" && nodeName !== "ink-progress";
  const node = {
    nodeName,
    style: {},
    attributes: {},
    childNodes: [],
    parentNode: undefined,
    yogaNode: needsYogaNode ? createLayoutNode() : undefined,
    dirty: false
  };
  if (nodeName === "ink-text") {
    node.yogaNode?.setMeasureFunc(measureTextNode.bind(null, node));
  } else if (nodeName === "ink-raw-ansi") {
    node.yogaNode?.setMeasureFunc(measureRawAnsiNode.bind(null, node));
  }
  return node;
}, appendChildNode = (node, childNode) => {
  if (childNode.parentNode) {
    removeChildNode(childNode.parentNode, childNode);
  }
  childNode.parentNode = node;
  node.childNodes.push(childNode);
  if (childNode.yogaNode) {
    node.yogaNode?.insertChild(childNode.yogaNode, node.yogaNode.getChildCount());
  }
  markDirty(node);
}, insertBeforeNode = (node, newChildNode, beforeChildNode) => {
  if (newChildNode.parentNode) {
    removeChildNode(newChildNode.parentNode, newChildNode);
  }
  newChildNode.parentNode = node;
  const index = node.childNodes.indexOf(beforeChildNode);
  if (index >= 0) {
    let yogaIndex = 0;
    if (newChildNode.yogaNode && node.yogaNode) {
      for (let i = 0;i < index; i++) {
        if (node.childNodes[i]?.yogaNode) {
          yogaIndex++;
        }
      }
    }
    node.childNodes.splice(index, 0, newChildNode);
    if (newChildNode.yogaNode && node.yogaNode) {
      node.yogaNode.insertChild(newChildNode.yogaNode, yogaIndex);
    }
    markDirty(node);
    return;
  }
  node.childNodes.push(newChildNode);
  if (newChildNode.yogaNode) {
    node.yogaNode?.insertChild(newChildNode.yogaNode, node.yogaNode.getChildCount());
  }
  markDirty(node);
}, removeChildNode = (node, removeNode) => {
  if (removeNode.yogaNode) {
    removeNode.parentNode?.yogaNode?.removeChild(removeNode.yogaNode);
  }
  collectRemovedRects(node, removeNode);
  removeNode.parentNode = undefined;
  const index = node.childNodes.indexOf(removeNode);
  if (index >= 0) {
    node.childNodes.splice(index, 1);
  }
  markDirty(node);
}, setAttribute = (node, key, value) => {
  if (key === "children") {
    return;
  }
  if (node.attributes[key] === value) {
    return;
  }
  node.attributes[key] = value;
  markDirty(node);
}, setStyle = (node, style) => {
  if (stylesEqual(node.style, style)) {
    return;
  }
  node.style = style;
  markDirty(node);
}, setTextStyles = (node, textStyles) => {
  if (shallowEqual(node.textStyles, textStyles)) {
    return;
  }
  node.textStyles = textStyles;
  markDirty(node);
}, createTextNode = (text) => {
  const node = {
    nodeName: "#text",
    nodeValue: text,
    yogaNode: undefined,
    parentNode: undefined,
    style: {}
  };
  setTextNodeValue(node, text);
  return node;
}, measureTextNode = function(node, width, widthMode) {
  const rawText = node.nodeName === "#text" ? node.nodeValue : squash_text_nodes_default(node);
  const text = expandTabs(rawText);
  const dimensions = measure_text_default(text, width);
  if (dimensions.width <= width) {
    return dimensions;
  }
  if (dimensions.width >= 1 && width > 0 && width < 1) {
    return dimensions;
  }
  if (text.includes(`
`) && widthMode === LayoutMeasureMode.Undefined) {
    const effectiveWidth = Math.max(width, dimensions.width);
    return measure_text_default(text, effectiveWidth);
  }
  const textWrap = node.style?.textWrap ?? "wrap";
  const wrappedText = wrapText(text, width, textWrap);
  return measure_text_default(wrappedText, width);
}, measureRawAnsiNode = function(node) {
  return {
    width: node.attributes["rawWidth"],
    height: node.attributes["rawHeight"]
  };
}, markDirty = (node) => {
  let current = node;
  let markedYoga = false;
  while (current) {
    if (current.nodeName !== "#text") {
      current.dirty = true;
      if (!markedYoga && (current.nodeName === "ink-text" || current.nodeName === "ink-raw-ansi") && current.yogaNode) {
        current.yogaNode.markDirty();
        markedYoga = true;
      }
    }
    current = current.parentNode;
  }
}, scheduleRenderFrom = (node) => {
  let cur = node;
  while (cur?.parentNode)
    cur = cur.parentNode;
  if (cur && cur.nodeName !== "#text")
    cur.onRender?.();
}, setTextNodeValue = (node, text) => {
  if (typeof text !== "string") {
    text = String(text);
  }
  if (node.nodeValue === text) {
    return;
  }
  node.nodeValue = text;
  markDirty(node);
}, clearYogaNodeReferences = (node) => {
  if ("childNodes" in node) {
    for (const child of node.childNodes) {
      clearYogaNodeReferences(child);
    }
  }
  node.yogaNode = undefined;
};
var init_dom = __esm(() => {
  init_engine();
  init_node();
  init_measure_text();
  init_node_cache();
  init_squash_text_nodes();
  init_tabstops();
  init_wrap_text();
});

// packages/@ant/ink/src/core/events/event-handlers.ts
var HANDLER_FOR_EVENT, EVENT_HANDLER_PROPS;
var init_event_handlers = __esm(() => {
  HANDLER_FOR_EVENT = {
    keydown: { bubble: "onKeyDown", capture: "onKeyDownCapture" },
    focus: { bubble: "onFocus", capture: "onFocusCapture" },
    blur: { bubble: "onBlur", capture: "onBlurCapture" },
    paste: { bubble: "onPaste", capture: "onPasteCapture" },
    resize: { bubble: "onResize" },
    click: { bubble: "onClick" },
    mousedown: { bubble: "onMouseDown" },
    mouseup: { bubble: "onMouseUp" },
    mousedrag: { bubble: "onMouseDrag" }
  };
  EVENT_HANDLER_PROPS = new Set([
    "onKeyDown",
    "onKeyDownCapture",
    "onFocus",
    "onFocusCapture",
    "onBlur",
    "onBlurCapture",
    "onPaste",
    "onPasteCapture",
    "onResize",
    "onClick",
    "onMouseDown",
    "onMouseUp",
    "onMouseDrag",
    "onMouseEnter",
    "onMouseLeave"
  ]);
});

// packages/@ant/ink/src/core/events/dispatcher.ts
function getHandler(node, eventType, capture) {
  const handlers = node._eventHandlers;
  if (!handlers)
    return;
  const mapping = HANDLER_FOR_EVENT[eventType];
  if (!mapping)
    return;
  const propName = capture ? mapping.capture : mapping.bubble;
  if (!propName)
    return;
  return handlers[propName];
}
function collectListeners(target, event) {
  const listeners = [];
  let node = target;
  while (node) {
    const isTarget = node === target;
    const captureHandler = getHandler(node, event.type, true);
    const bubbleHandler = getHandler(node, event.type, false);
    if (captureHandler) {
      listeners.unshift({
        node,
        handler: captureHandler,
        phase: isTarget ? "at_target" : "capturing"
      });
    }
    if (bubbleHandler && (event.bubbles || isTarget)) {
      listeners.push({
        node,
        handler: bubbleHandler,
        phase: isTarget ? "at_target" : "bubbling"
      });
    }
    node = node.parentNode;
  }
  return listeners;
}
function processDispatchQueue(listeners, event) {
  let previousNode;
  for (const { node, handler, phase } of listeners) {
    if (event._isImmediatePropagationStopped()) {
      break;
    }
    if (event._isPropagationStopped() && node !== previousNode) {
      break;
    }
    event._setEventPhase(phase);
    event._setCurrentTarget(node);
    event._prepareForTarget(node);
    try {
      handler(event);
    } catch (error) {
      logError(error);
    }
    previousNode = node;
  }
}
function getEventPriority(eventType) {
  switch (eventType) {
    case "keydown":
    case "keyup":
    case "click":
    case "focus":
    case "blur":
    case "paste":
      return import_constants.DiscreteEventPriority;
    case "resize":
    case "scroll":
    case "mousemove":
      return import_constants.ContinuousEventPriority;
    default:
      return import_constants.DefaultEventPriority;
  }
}

class Dispatcher {
  currentEvent = null;
  currentUpdatePriority = import_constants.DefaultEventPriority;
  discreteUpdates = null;
  resolveEventPriority() {
    if (this.currentUpdatePriority !== import_constants.NoEventPriority) {
      return this.currentUpdatePriority;
    }
    if (this.currentEvent) {
      return getEventPriority(this.currentEvent.type);
    }
    return import_constants.DefaultEventPriority;
  }
  dispatch(target, event) {
    const previousEvent = this.currentEvent;
    this.currentEvent = event;
    try {
      event._setTarget(target);
      const listeners = collectListeners(target, event);
      processDispatchQueue(listeners, event);
      event._setEventPhase("none");
      event._setCurrentTarget(null);
      return !event.defaultPrevented;
    } finally {
      this.currentEvent = previousEvent;
    }
  }
  dispatchDiscrete(target, event) {
    if (!this.discreteUpdates) {
      return this.dispatch(target, event);
    }
    return this.discreteUpdates((t, e) => this.dispatch(t, e), target, event, undefined, undefined);
  }
  dispatchContinuous(target, event) {
    const previousPriority = this.currentUpdatePriority;
    try {
      this.currentUpdatePriority = import_constants.ContinuousEventPriority;
      return this.dispatch(target, event);
    } finally {
      this.currentUpdatePriority = previousPriority;
    }
  }
}
var import_constants, logError = (error) => {
  console.error(error);
};
var init_dispatcher = __esm(() => {
  init_event_handlers();
  import_constants = __toESM(require_constants(), 1);
});

// packages/@ant/ink/src/core/events/terminal-event.ts
var TerminalEvent;
var init_terminal_event = __esm(() => {
  init_event();
  TerminalEvent = class TerminalEvent extends Event {
    type;
    timeStamp;
    bubbles;
    cancelable;
    _target = null;
    _currentTarget = null;
    _eventPhase = "none";
    _propagationStopped = false;
    _defaultPrevented = false;
    constructor(type, init) {
      super();
      this.type = type;
      this.timeStamp = performance.now();
      this.bubbles = init?.bubbles ?? true;
      this.cancelable = init?.cancelable ?? true;
    }
    get target() {
      return this._target;
    }
    get currentTarget() {
      return this._currentTarget;
    }
    get eventPhase() {
      return this._eventPhase;
    }
    get defaultPrevented() {
      return this._defaultPrevented;
    }
    stopPropagation() {
      this._propagationStopped = true;
    }
    stopImmediatePropagation() {
      super.stopImmediatePropagation();
      this._propagationStopped = true;
    }
    preventDefault() {
      if (this.cancelable) {
        this._defaultPrevented = true;
      }
    }
    _setTarget(target) {
      this._target = target;
    }
    _setCurrentTarget(target) {
      this._currentTarget = target;
    }
    _setEventPhase(phase) {
      this._eventPhase = phase;
    }
    _isPropagationStopped() {
      return this._propagationStopped;
    }
    _isImmediatePropagationStopped() {
      return this.didStopImmediatePropagation();
    }
    _prepareForTarget(_target) {}
  };
});

// packages/@ant/ink/src/core/events/focus-event.ts
var FocusEvent;
var init_focus_event = __esm(() => {
  init_terminal_event();
  FocusEvent = class FocusEvent extends TerminalEvent {
    relatedTarget;
    constructor(type, relatedTarget = null) {
      super(type, { bubbles: true, cancelable: false });
      this.relatedTarget = relatedTarget;
    }
  };
});

// packages/@ant/ink/src/core/focus.ts
class FocusManager {
  activeElement = null;
  dispatchFocusEvent;
  enabled = true;
  focusStack = [];
  constructor(dispatchFocusEvent) {
    this.dispatchFocusEvent = dispatchFocusEvent;
  }
  focus(node) {
    if (node === this.activeElement)
      return;
    if (!this.enabled)
      return;
    const previous = this.activeElement;
    if (previous) {
      const idx = this.focusStack.indexOf(previous);
      if (idx !== -1)
        this.focusStack.splice(idx, 1);
      this.focusStack.push(previous);
      if (this.focusStack.length > MAX_FOCUS_STACK)
        this.focusStack.shift();
      this.dispatchFocusEvent(previous, new FocusEvent("blur", node));
    }
    this.activeElement = node;
    this.dispatchFocusEvent(node, new FocusEvent("focus", previous));
  }
  blur() {
    if (!this.activeElement)
      return;
    const previous = this.activeElement;
    this.activeElement = null;
    this.dispatchFocusEvent(previous, new FocusEvent("blur", null));
  }
  handleNodeRemoved(node, root) {
    this.focusStack = this.focusStack.filter((n) => n !== node && isInTree(n, root));
    if (!this.activeElement)
      return;
    if (this.activeElement !== node && isInTree(this.activeElement, root)) {
      return;
    }
    const removed = this.activeElement;
    this.activeElement = null;
    this.dispatchFocusEvent(removed, new FocusEvent("blur", null));
    while (this.focusStack.length > 0) {
      const candidate = this.focusStack.pop();
      if (isInTree(candidate, root)) {
        this.activeElement = candidate;
        this.dispatchFocusEvent(candidate, new FocusEvent("focus", removed));
        return;
      }
    }
  }
  handleAutoFocus(node) {
    this.focus(node);
  }
  handleClickFocus(node) {
    const tabIndex = node.attributes["tabIndex"];
    if (typeof tabIndex !== "number")
      return;
    this.focus(node);
  }
  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }
  focusNext(root) {
    this.moveFocus(1, root);
  }
  focusPrevious(root) {
    this.moveFocus(-1, root);
  }
  moveFocus(direction, root) {
    if (!this.enabled)
      return;
    const tabbable = collectTabbable(root);
    if (tabbable.length === 0)
      return;
    const currentIndex = this.activeElement ? tabbable.indexOf(this.activeElement) : -1;
    const nextIndex = currentIndex === -1 ? direction === 1 ? 0 : tabbable.length - 1 : (currentIndex + direction + tabbable.length) % tabbable.length;
    const next = tabbable[nextIndex];
    if (next) {
      this.focus(next);
    }
  }
}
function collectTabbable(root) {
  const result = [];
  walkTree(root, result);
  return result;
}
function walkTree(node, result) {
  const tabIndex = node.attributes["tabIndex"];
  if (typeof tabIndex === "number" && tabIndex >= 0) {
    result.push(node);
  }
  for (const child of node.childNodes) {
    if (child.nodeName !== "#text") {
      walkTree(child, result);
    }
  }
}
function isInTree(node, root) {
  let current = node;
  while (current) {
    if (current === root)
      return true;
    current = current.parentNode;
  }
  return false;
}
function getRootNode(node) {
  let current = node;
  while (current) {
    if (current.focusManager)
      return current;
    current = current.parentNode;
  }
  throw new Error("Node is not in a tree with a FocusManager");
}
function getFocusManager(node) {
  return getRootNode(node).focusManager;
}
var MAX_FOCUS_STACK = 32;
var init_focus = __esm(() => {
  init_focus_event();
});

// packages/@ant/ink/src/core/styles.ts
function applyPositionEdge(node, edge, v) {
  if (typeof v === "string") {
    node.setPositionPercent(edge, Number.parseInt(v, 10));
  } else if (typeof v === "number") {
    node.setPosition(edge, v);
  } else {
    node.setPosition(edge, Number.NaN);
  }
}
var applyPositionStyles = (node, style) => {
  if ("position" in style) {
    node.setPositionType(style.position === "absolute" ? LayoutPositionType.Absolute : LayoutPositionType.Relative);
  }
  if ("top" in style)
    applyPositionEdge(node, "top", style.top);
  if ("bottom" in style)
    applyPositionEdge(node, "bottom", style.bottom);
  if ("left" in style)
    applyPositionEdge(node, "left", style.left);
  if ("right" in style)
    applyPositionEdge(node, "right", style.right);
}, applyOverflowStyles = (node, style) => {
  const y = style.overflowY ?? style.overflow;
  const x = style.overflowX ?? style.overflow;
  if (y === "scroll" || x === "scroll") {
    node.setOverflow(LayoutOverflow.Scroll);
  } else if (y === "hidden" || x === "hidden") {
    node.setOverflow(LayoutOverflow.Hidden);
  } else if ("overflow" in style || "overflowX" in style || "overflowY" in style) {
    node.setOverflow(LayoutOverflow.Visible);
  }
}, applyMarginStyles = (node, style) => {
  if ("margin" in style) {
    node.setMargin(LayoutEdge.All, style.margin ?? 0);
  }
  if ("marginX" in style) {
    node.setMargin(LayoutEdge.Horizontal, style.marginX ?? 0);
  }
  if ("marginY" in style) {
    node.setMargin(LayoutEdge.Vertical, style.marginY ?? 0);
  }
  if ("marginLeft" in style) {
    node.setMargin(LayoutEdge.Start, style.marginLeft || 0);
  }
  if ("marginRight" in style) {
    node.setMargin(LayoutEdge.End, style.marginRight || 0);
  }
  if ("marginTop" in style) {
    node.setMargin(LayoutEdge.Top, style.marginTop || 0);
  }
  if ("marginBottom" in style) {
    node.setMargin(LayoutEdge.Bottom, style.marginBottom || 0);
  }
}, applyPaddingStyles = (node, style) => {
  if ("padding" in style) {
    node.setPadding(LayoutEdge.All, style.padding ?? 0);
  }
  if ("paddingX" in style) {
    node.setPadding(LayoutEdge.Horizontal, style.paddingX ?? 0);
  }
  if ("paddingY" in style) {
    node.setPadding(LayoutEdge.Vertical, style.paddingY ?? 0);
  }
  if ("paddingLeft" in style) {
    node.setPadding(LayoutEdge.Left, style.paddingLeft || 0);
  }
  if ("paddingRight" in style) {
    node.setPadding(LayoutEdge.Right, style.paddingRight || 0);
  }
  if ("paddingTop" in style) {
    node.setPadding(LayoutEdge.Top, style.paddingTop || 0);
  }
  if ("paddingBottom" in style) {
    node.setPadding(LayoutEdge.Bottom, style.paddingBottom || 0);
  }
}, applyFlexStyles = (node, style) => {
  if ("flexGrow" in style) {
    node.setFlexGrow(style.flexGrow ?? 0);
  }
  if ("flexShrink" in style) {
    node.setFlexShrink(typeof style.flexShrink === "number" ? style.flexShrink : 1);
  }
  if ("flexWrap" in style) {
    if (style.flexWrap === "nowrap") {
      node.setFlexWrap(LayoutWrap.NoWrap);
    }
    if (style.flexWrap === "wrap") {
      node.setFlexWrap(LayoutWrap.Wrap);
    }
    if (style.flexWrap === "wrap-reverse") {
      node.setFlexWrap(LayoutWrap.WrapReverse);
    }
  }
  if ("flexDirection" in style) {
    if (style.flexDirection === "row") {
      node.setFlexDirection(LayoutFlexDirection.Row);
    }
    if (style.flexDirection === "row-reverse") {
      node.setFlexDirection(LayoutFlexDirection.RowReverse);
    }
    if (style.flexDirection === "column") {
      node.setFlexDirection(LayoutFlexDirection.Column);
    }
    if (style.flexDirection === "column-reverse") {
      node.setFlexDirection(LayoutFlexDirection.ColumnReverse);
    }
  }
  if ("flexBasis" in style) {
    if (typeof style.flexBasis === "number") {
      node.setFlexBasis(style.flexBasis);
    } else if (typeof style.flexBasis === "string") {
      node.setFlexBasisPercent(Number.parseInt(style.flexBasis, 10));
    } else {
      node.setFlexBasis(Number.NaN);
    }
  }
  if ("alignItems" in style) {
    if (style.alignItems === "stretch" || !style.alignItems) {
      node.setAlignItems(LayoutAlign.Stretch);
    }
    if (style.alignItems === "flex-start") {
      node.setAlignItems(LayoutAlign.FlexStart);
    }
    if (style.alignItems === "center") {
      node.setAlignItems(LayoutAlign.Center);
    }
    if (style.alignItems === "flex-end") {
      node.setAlignItems(LayoutAlign.FlexEnd);
    }
  }
  if ("alignSelf" in style) {
    if (style.alignSelf === "auto" || !style.alignSelf) {
      node.setAlignSelf(LayoutAlign.Auto);
    }
    if (style.alignSelf === "flex-start") {
      node.setAlignSelf(LayoutAlign.FlexStart);
    }
    if (style.alignSelf === "center") {
      node.setAlignSelf(LayoutAlign.Center);
    }
    if (style.alignSelf === "flex-end") {
      node.setAlignSelf(LayoutAlign.FlexEnd);
    }
  }
  if ("justifyContent" in style) {
    if (style.justifyContent === "flex-start" || !style.justifyContent) {
      node.setJustifyContent(LayoutJustify.FlexStart);
    }
    if (style.justifyContent === "center") {
      node.setJustifyContent(LayoutJustify.Center);
    }
    if (style.justifyContent === "flex-end") {
      node.setJustifyContent(LayoutJustify.FlexEnd);
    }
    if (style.justifyContent === "space-between") {
      node.setJustifyContent(LayoutJustify.SpaceBetween);
    }
    if (style.justifyContent === "space-around") {
      node.setJustifyContent(LayoutJustify.SpaceAround);
    }
    if (style.justifyContent === "space-evenly") {
      node.setJustifyContent(LayoutJustify.SpaceEvenly);
    }
  }
}, applyDimensionStyles = (node, style) => {
  if ("width" in style) {
    if (typeof style.width === "number") {
      node.setWidth(style.width);
    } else if (typeof style.width === "string") {
      node.setWidthPercent(Number.parseInt(style.width, 10));
    } else {
      node.setWidthAuto();
    }
  }
  if ("height" in style) {
    if (typeof style.height === "number") {
      node.setHeight(style.height);
    } else if (typeof style.height === "string") {
      node.setHeightPercent(Number.parseInt(style.height, 10));
    } else {
      node.setHeightAuto();
    }
  }
  if ("minWidth" in style) {
    if (typeof style.minWidth === "string") {
      node.setMinWidthPercent(Number.parseInt(style.minWidth, 10));
    } else {
      node.setMinWidth(style.minWidth ?? 0);
    }
  }
  if ("minHeight" in style) {
    if (typeof style.minHeight === "string") {
      node.setMinHeightPercent(Number.parseInt(style.minHeight, 10));
    } else {
      node.setMinHeight(style.minHeight ?? 0);
    }
  }
  if ("maxWidth" in style) {
    if (typeof style.maxWidth === "string") {
      node.setMaxWidthPercent(Number.parseInt(style.maxWidth, 10));
    } else {
      node.setMaxWidth(style.maxWidth ?? 0);
    }
  }
  if ("maxHeight" in style) {
    if (typeof style.maxHeight === "string") {
      node.setMaxHeightPercent(Number.parseInt(style.maxHeight, 10));
    } else {
      node.setMaxHeight(style.maxHeight ?? 0);
    }
  }
}, applyDisplayStyles = (node, style) => {
  if ("display" in style) {
    node.setDisplay(style.display === "flex" ? LayoutDisplay.Flex : LayoutDisplay.None);
  }
}, applyBorderStyles = (node, style, resolvedStyle) => {
  const resolved = resolvedStyle ?? style;
  if ("borderStyle" in style) {
    const borderWidth = style.borderStyle ? 1 : 0;
    node.setBorder(LayoutEdge.Top, resolved.borderTop !== false ? borderWidth : 0);
    node.setBorder(LayoutEdge.Bottom, resolved.borderBottom !== false ? borderWidth : 0);
    node.setBorder(LayoutEdge.Left, resolved.borderLeft !== false ? borderWidth : 0);
    node.setBorder(LayoutEdge.Right, resolved.borderRight !== false ? borderWidth : 0);
  } else {
    if ("borderTop" in style && style.borderTop !== undefined) {
      node.setBorder(LayoutEdge.Top, style.borderTop === false ? 0 : 1);
    }
    if ("borderBottom" in style && style.borderBottom !== undefined) {
      node.setBorder(LayoutEdge.Bottom, style.borderBottom === false ? 0 : 1);
    }
    if ("borderLeft" in style && style.borderLeft !== undefined) {
      node.setBorder(LayoutEdge.Left, style.borderLeft === false ? 0 : 1);
    }
    if ("borderRight" in style && style.borderRight !== undefined) {
      node.setBorder(LayoutEdge.Right, style.borderRight === false ? 0 : 1);
    }
  }
}, applyGapStyles = (node, style) => {
  if ("gap" in style) {
    node.setGap(LayoutGutter.All, style.gap ?? 0);
  }
  if ("columnGap" in style) {
    node.setGap(LayoutGutter.Column, style.columnGap ?? 0);
  }
  if ("rowGap" in style) {
    node.setGap(LayoutGutter.Row, style.rowGap ?? 0);
  }
}, styles4 = (node, style = {}, resolvedStyle) => {
  applyPositionStyles(node, style);
  applyOverflowStyles(node, style);
  applyMarginStyles(node, style);
  applyPaddingStyles(node, style);
  applyFlexStyles(node, style);
  applyDimensionStyles(node, style);
  applyDisplayStyles(node, style);
  applyBorderStyles(node, style, resolvedStyle);
  applyGapStyles(node, style);
}, styles_default;
var init_styles = __esm(() => {
  init_node();
  styles_default = styles4;
});

// packages/@ant/ink/src/core/reconciler.ts
function setEventHandler(node, key, value) {
  if (!node._eventHandlers) {
    node._eventHandlers = {};
  }
  node._eventHandlers[key] = value;
}
function applyProp(node, key, value) {
  if (key === "children")
    return;
  if (key === "style") {
    setStyle(node, value);
    if (node.yogaNode) {
      styles_default(node.yogaNode, value);
    }
    return;
  }
  if (key === "textStyles") {
    node.textStyles = value;
    return;
  }
  if (EVENT_HANDLER_PROPS.has(key)) {
    setEventHandler(node, key, value);
    return;
  }
  setAttribute(node, key, value);
}
function getOwnerChain(fiber) {
  const chain = [];
  const seen = new Set;
  let cur = fiber;
  for (let i = 0;cur && i < 50; i++) {
    if (seen.has(cur))
      break;
    seen.add(cur);
    const t = cur.elementType;
    const name = typeof t === "function" ? t.displayName || t.name : typeof t === "string" ? undefined : t?.displayName || t?.name;
    if (name && name !== chain[chain.length - 1])
      chain.push(name);
    cur = cur._debugOwner ?? cur.return;
  }
  return chain;
}
function isDebugRepaintsEnabled() {
  if (debugRepaints === undefined) {
    debugRepaints = process.env.CLAUDE_CODE_DEBUG_REPAINTS === "1";
  }
  return debugRepaints;
}
function debugLog(message) {
  console.warn(`[ink-commit] ${message}`);
}
function recordYogaMs(ms) {
  _lastYogaMs = ms;
}
function getLastYogaMs() {
  return _lastYogaMs;
}
function markCommitStart() {
  _commitStart = performance.now();
}
function getLastCommitMs() {
  return _lastCommitMs;
}
function resetProfileCounters() {
  _lastYogaMs = 0;
  _lastCommitMs = 0;
  _commitStart = 0;
}
var import_react_reconciler, diff = (before, after) => {
  if (before === after) {
    return;
  }
  if (!before) {
    return after;
  }
  const changed = {};
  let isChanged = false;
  for (const key of Object.keys(before)) {
    const isDeleted = after ? !Object.hasOwn(after, key) : true;
    if (isDeleted) {
      changed[key] = undefined;
      isChanged = true;
    }
  }
  if (after) {
    for (const key of Object.keys(after)) {
      if (after[key] !== before[key]) {
        changed[key] = after[key];
        isChanged = true;
      }
    }
  }
  return isChanged ? changed : undefined;
}, cleanupYogaNode = (node) => {
  const yogaNode = node.yogaNode;
  if (yogaNode) {
    yogaNode.unsetMeasureFunc();
    clearYogaNodeReferences(node);
    yogaNode.freeRecursive();
  }
}, debugRepaints, dispatcher, COMMIT_LOG, _commits = 0, _lastLog = 0, _lastCommitAt = 0, _maxGapMs = 0, _createCount = 0, _prepareAt = 0, _lastYogaMs = 0, _lastCommitMs = 0, _commitStart = 0, reconciler, reconciler_default;
var init_reconciler = __esm(() => {
  init_yoga_layout();
  init_dom();
  init_dispatcher();
  init_event_handlers();
  init_focus();
  init_node();
  init_styles();
  import_react_reconciler = __toESM(require_react_reconciler(), 1);
  if (false) {}
  dispatcher = new Dispatcher;
  COMMIT_LOG = process.env.CLAUDE_CODE_COMMIT_LOG;
  reconciler = import_react_reconciler.default({
    getRootHostContext: () => ({ isInsideText: false }),
    prepareForCommit: () => {
      if (COMMIT_LOG)
        _prepareAt = performance.now();
      return null;
    },
    preparePortalMount: () => null,
    clearContainer: () => false,
    resetAfterCommit(rootNode) {
      _lastCommitMs = _commitStart > 0 ? performance.now() - _commitStart : 0;
      _commitStart = 0;
      if (COMMIT_LOG) {
        const now2 = performance.now();
        _commits++;
        const gap = _lastCommitAt > 0 ? now2 - _lastCommitAt : 0;
        if (gap > _maxGapMs)
          _maxGapMs = gap;
        _lastCommitAt = now2;
        const reconcileMs = _prepareAt > 0 ? now2 - _prepareAt : 0;
        if (gap > 30 || reconcileMs > 20 || _createCount > 50) {
          debugLog(`${now2.toFixed(1)} gap=${gap.toFixed(1)}ms reconcile=${reconcileMs.toFixed(1)}ms creates=${_createCount}`);
        }
        _createCount = 0;
        if (now2 - _lastLog > 1000) {
          debugLog(`${now2.toFixed(1)} commits=${_commits}/s maxGap=${_maxGapMs.toFixed(1)}ms`);
          _commits = 0;
          _maxGapMs = 0;
          _lastLog = now2;
        }
      }
      const _t0 = COMMIT_LOG ? performance.now() : 0;
      if (typeof rootNode.onComputeLayout === "function") {
        rootNode.onComputeLayout();
      }
      if (COMMIT_LOG) {
        const layoutMs = performance.now() - _t0;
        if (layoutMs > 20) {
          const c = getYogaCounters();
          debugLog(`${_t0.toFixed(1)} SLOW_YOGA ${layoutMs.toFixed(1)}ms visited=${c.visited} measured=${c.measured} hits=${c.cacheHits} live=${c.live}`);
        }
      }
      if (false) {}
      const _tr = COMMIT_LOG ? performance.now() : 0;
      rootNode.onRender?.();
      if (COMMIT_LOG) {
        const renderMs = performance.now() - _tr;
        if (renderMs > 10) {
          debugLog(`${_tr.toFixed(1)} SLOW_PAINT ${renderMs.toFixed(1)}ms`);
        }
      }
    },
    getChildHostContext(parentHostContext, type) {
      const previousIsInsideText = parentHostContext.isInsideText;
      const isInsideText = type === "ink-text" || type === "ink-virtual-text" || type === "ink-link";
      if (previousIsInsideText === isInsideText) {
        return parentHostContext;
      }
      return { isInsideText };
    },
    shouldSetTextContent: () => false,
    createInstance(originalType, newProps, _root, hostContext, internalHandle) {
      if (hostContext.isInsideText && originalType === "ink-box") {
        throw new Error(`<Box> can't be nested inside <Text> component`);
      }
      const type = originalType === "ink-text" && hostContext.isInsideText ? "ink-virtual-text" : originalType;
      const node = createNode(type);
      if (COMMIT_LOG)
        _createCount++;
      for (const [key, value] of Object.entries(newProps)) {
        applyProp(node, key, value);
      }
      if (isDebugRepaintsEnabled()) {
        node.debugOwnerChain = getOwnerChain(internalHandle);
      }
      return node;
    },
    createTextInstance(text, _root, hostContext) {
      if (!hostContext.isInsideText) {
        throw new Error(`Text string "${text}" must be rendered inside <Text> component`);
      }
      return createTextNode(text);
    },
    resetTextContent() {},
    hideTextInstance(node) {
      setTextNodeValue(node, "");
    },
    unhideTextInstance(node, text) {
      setTextNodeValue(node, text);
    },
    getPublicInstance: (instance) => instance,
    hideInstance(node) {
      node.isHidden = true;
      node.yogaNode?.setDisplay(LayoutDisplay.None);
      markDirty(node);
    },
    unhideInstance(node) {
      node.isHidden = false;
      node.yogaNode?.setDisplay(LayoutDisplay.Flex);
      markDirty(node);
    },
    appendInitialChild: appendChildNode,
    appendChild: appendChildNode,
    insertBefore: insertBeforeNode,
    finalizeInitialChildren(_node, _type, props) {
      return props["autoFocus"] === true;
    },
    commitMount(node) {
      getFocusManager(node).handleAutoFocus(node);
    },
    isPrimaryRenderer: true,
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,
    getCurrentUpdatePriority: () => dispatcher.currentUpdatePriority,
    beforeActiveInstanceBlur() {},
    afterActiveInstanceBlur() {},
    detachDeletedInstance() {},
    getInstanceFromNode: () => null,
    prepareScopeUpdate() {},
    getInstanceFromScope: () => null,
    appendChildToContainer: appendChildNode,
    insertInContainerBefore: insertBeforeNode,
    removeChildFromContainer(node, removeNode) {
      removeChildNode(node, removeNode);
      cleanupYogaNode(removeNode);
      getFocusManager(node).handleNodeRemoved(removeNode, node);
    },
    commitUpdate(node, _type, oldProps, newProps) {
      const props = diff(oldProps, newProps);
      const style = diff(oldProps["style"], newProps["style"]);
      if (props) {
        for (const [key, value] of Object.entries(props)) {
          if (key === "style") {
            setStyle(node, value);
            continue;
          }
          if (key === "textStyles") {
            setTextStyles(node, value);
            continue;
          }
          if (EVENT_HANDLER_PROPS.has(key)) {
            setEventHandler(node, key, value);
            continue;
          }
          setAttribute(node, key, value);
        }
      }
      if (style && node.yogaNode) {
        styles_default(node.yogaNode, style, newProps["style"]);
      }
    },
    commitTextUpdate(node, _oldText, newText) {
      setTextNodeValue(node, newText);
    },
    removeChild(node, removeNode) {
      removeChildNode(node, removeNode);
      cleanupYogaNode(removeNode);
      if (removeNode.nodeName !== "#text") {
        const root = getRootNode(node);
        root.focusManager.handleNodeRemoved(removeNode, root);
      }
    },
    maySuspendCommit() {
      return false;
    },
    preloadInstance() {
      return true;
    },
    startSuspendingCommit() {},
    suspendInstance() {},
    waitForCommitToBeReady() {
      return null;
    },
    NotPendingTransition: null,
    HostTransitionContext: {
      $$typeof: Symbol.for("react.context"),
      _currentValue: null
    },
    setCurrentUpdatePriority(newPriority) {
      dispatcher.currentUpdatePriority = newPriority;
    },
    resolveUpdatePriority() {
      return dispatcher.resolveEventPriority();
    },
    resetFormInstance() {},
    requestPostPaintCallback() {},
    shouldAttemptEagerTransition() {
      return false;
    },
    trackSchedulerEvent() {},
    resolveEventType() {
      return dispatcher.currentEvent?.type ?? null;
    },
    resolveEventTimeStamp() {
      return dispatcher.currentEvent?.timeStamp ?? -1.1;
    }
  });
  dispatcher.discreteUpdates = reconciler.discreteUpdates.bind(reconciler);
  reconciler_default = reconciler;
});

// packages/@ant/ink/src/core/layout/geometry.ts
function unionRect(a, b) {
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
function clamp(value, min, max) {
  if (min !== undefined && value < min)
    return min;
  if (max !== undefined && value > max)
    return max;
  return value;
}
var init_geometry = () => {};

// packages/@ant/ink/src/utils/debug.ts
function logForDebugging(..._args) {}
var init_debug = () => {};

// packages/@ant/ink/src/core/warn.ts
function ifNotInteger(value, name) {
  if (value === undefined)
    return;
  if (Number.isInteger(value))
    return;
  logForDebugging(`${name} should be an integer, got ${value}`, {
    level: "warn"
  });
}
var init_warn = __esm(() => {
  init_debug();
});

// packages/@ant/ink/src/core/screen.ts
class CharPool {
  strings = [" ", ""];
  stringMap = new Map([
    [" ", 0],
    ["", 1]
  ]);
  ascii = initCharAscii();
  intern(char) {
    if (char.length === 1) {
      const code = char.charCodeAt(0);
      if (code < 128) {
        const cached = this.ascii[code];
        if (cached !== -1)
          return cached;
        const index2 = this.strings.length;
        this.strings.push(char);
        this.ascii[code] = index2;
        return index2;
      }
    }
    const existing = this.stringMap.get(char);
    if (existing !== undefined)
      return existing;
    const index = this.strings.length;
    this.strings.push(char);
    this.stringMap.set(char, index);
    return index;
  }
  get(index) {
    return this.strings[index] ?? " ";
  }
}

class HyperlinkPool {
  strings = [""];
  stringMap = new Map;
  intern(hyperlink) {
    if (!hyperlink)
      return 0;
    let id = this.stringMap.get(hyperlink);
    if (id === undefined) {
      id = this.strings.length;
      this.strings.push(hyperlink);
      this.stringMap.set(hyperlink, id);
    }
    return id;
  }
  get(id) {
    return id === 0 ? undefined : this.strings[id];
  }
}

class StylePool {
  ids = new Map;
  styles = [];
  transitionCache = new Map;
  none;
  constructor() {
    this.none = this.intern([]);
  }
  static CACHE_MAX = 1000;
  evictCacheIfNeeded() {
    if (this.transitionCache.size > StylePool.CACHE_MAX) {
      const keys = this.transitionCache.keys();
      for (let i = 0;i < this.transitionCache.size - StylePool.CACHE_MAX; i++) {
        const k = keys.next().value;
        if (k !== undefined)
          this.transitionCache.delete(k);
      }
    }
    if (this.inverseCache.size > StylePool.CACHE_MAX) {
      const keys = this.inverseCache.keys();
      for (let i = 0;i < this.inverseCache.size - StylePool.CACHE_MAX; i++) {
        const k = keys.next().value;
        if (k !== undefined)
          this.inverseCache.delete(k);
      }
    }
    if (this.currentMatchCache.size > StylePool.CACHE_MAX) {
      const keys = this.currentMatchCache.keys();
      for (let i = 0;i < this.currentMatchCache.size - StylePool.CACHE_MAX; i++) {
        const k = keys.next().value;
        if (k !== undefined)
          this.currentMatchCache.delete(k);
      }
    }
  }
  intern(styles5) {
    const key = styles5.length === 0 ? "" : styles5.map((s) => s.code).join("\x00");
    let id = this.ids.get(key);
    if (id === undefined) {
      const rawId = this.styles.length;
      this.styles.push(styles5.length === 0 ? [] : styles5);
      id = rawId << 1 | (styles5.length > 0 && hasVisibleSpaceEffect(styles5) ? 1 : 0);
      this.ids.set(key, id);
      this.evictCacheIfNeeded();
    }
    return id;
  }
  get(id) {
    return this.styles[id >>> 1] ?? [];
  }
  transition(fromId, toId) {
    if (fromId === toId)
      return "";
    const key = fromId * 1048576 + toId;
    let str = this.transitionCache.get(key);
    if (str === undefined) {
      str = ansiCodesToString(diffAnsiCodes(this.get(fromId), this.get(toId)));
      this.transitionCache.set(key, str);
    }
    return str;
  }
  inverseCache = new Map;
  withInverse(baseId) {
    let id = this.inverseCache.get(baseId);
    if (id === undefined) {
      const baseCodes = this.get(baseId);
      const hasInverse = baseCodes.some((c) => c.endCode === "\x1B[27m");
      id = hasInverse ? baseId : this.intern([...baseCodes, INVERSE_CODE]);
      this.inverseCache.set(baseId, id);
    }
    return id;
  }
  currentMatchCache = new Map;
  withCurrentMatch(baseId) {
    let id = this.currentMatchCache.get(baseId);
    if (id === undefined) {
      const baseCodes = this.get(baseId);
      const codes = baseCodes.filter((c) => c.endCode !== "\x1B[39m" && c.endCode !== "\x1B[49m");
      codes.push(YELLOW_FG_CODE);
      if (!baseCodes.some((c) => c.endCode === "\x1B[27m"))
        codes.push(INVERSE_CODE);
      if (!baseCodes.some((c) => c.endCode === "\x1B[22m"))
        codes.push(BOLD_CODE);
      if (!baseCodes.some((c) => c.endCode === "\x1B[24m"))
        codes.push(UNDERLINE_CODE);
      id = this.intern(codes);
      this.currentMatchCache.set(baseId, id);
    }
    return id;
  }
  selectionBgCode = null;
  selectionBgCache = new Map;
  setSelectionBg(bg) {
    if (this.selectionBgCode?.code === bg?.code)
      return;
    this.selectionBgCode = bg;
    this.selectionBgCache.clear();
  }
  withSelectionBg(baseId) {
    const bg = this.selectionBgCode;
    if (bg === null)
      return this.withInverse(baseId);
    let id = this.selectionBgCache.get(baseId);
    if (id === undefined) {
      const kept = this.get(baseId).filter((c) => c.endCode !== "\x1B[49m" && c.endCode !== "\x1B[27m");
      kept.push(bg);
      id = this.intern(kept);
      this.selectionBgCache.set(baseId, id);
    }
    return id;
  }
}
function hasVisibleSpaceEffect(styles5) {
  for (const style of styles5) {
    if (VISIBLE_ON_SPACE.has(style.endCode))
      return true;
  }
  return false;
}
function initCharAscii() {
  const table = new Int32Array(128);
  table.fill(-1);
  table[32] = EMPTY_CHAR_INDEX;
  return table;
}
function packWord1(styleId, hyperlinkId, width) {
  return styleId << STYLE_SHIFT | hyperlinkId << HYPERLINK_SHIFT | width;
}
function isEmptyCellByIndex(screen, index) {
  const ci = index << 1;
  return screen.cells[ci] === 0 && screen.cells[ci | 1] === 0;
}
function isEmptyCellAt(screen, x, y) {
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height)
    return true;
  return isEmptyCellByIndex(screen, y * screen.width + x);
}
function internHyperlink(screen, hyperlink) {
  return screen.hyperlinkPool.intern(hyperlink);
}
function createScreen(width, height, styles5, charPool, hyperlinkPool) {
  ifNotInteger(width, "createScreen width");
  ifNotInteger(height, "createScreen height");
  if (!Number.isInteger(width) || width < 0) {
    width = Math.max(0, Math.floor(width) || 0);
  }
  if (!Number.isInteger(height) || height < 0) {
    height = Math.max(0, Math.floor(height) || 0);
  }
  const size = width * height;
  const buf = new ArrayBuffer(size << 3);
  const cells = new Int32Array(buf);
  const cells64 = new BigInt64Array(buf);
  return {
    width,
    height,
    cells,
    cells64,
    charPool,
    hyperlinkPool,
    emptyStyleId: styles5.none,
    damage: undefined,
    noSelect: new Uint8Array(size),
    softWrap: new Int32Array(height)
  };
}
function resetScreen(screen, width, height) {
  ifNotInteger(width, "resetScreen width");
  ifNotInteger(height, "resetScreen height");
  if (!Number.isInteger(width) || width < 0) {
    width = Math.max(0, Math.floor(width) || 0);
  }
  if (!Number.isInteger(height) || height < 0) {
    height = Math.max(0, Math.floor(height) || 0);
  }
  const size = width * height;
  if (screen.cells64.length < size) {
    const buf = new ArrayBuffer(size << 3);
    screen.cells = new Int32Array(buf);
    screen.cells64 = new BigInt64Array(buf);
    screen.noSelect = new Uint8Array(size);
  }
  if (screen.softWrap.length < height) {
    screen.softWrap = new Int32Array(height);
  }
  screen.cells64.fill(EMPTY_CELL_VALUE, 0, size);
  screen.noSelect.fill(0, 0, size);
  screen.softWrap.fill(0, 0, height);
  screen.width = width;
  screen.height = height;
  screen.damage = undefined;
}
function migrateScreenPools(screen, charPool, hyperlinkPool) {
  const oldCharPool = screen.charPool;
  const oldHyperlinkPool = screen.hyperlinkPool;
  if (oldCharPool === charPool && oldHyperlinkPool === hyperlinkPool)
    return;
  const size = screen.width * screen.height;
  const cells = screen.cells;
  for (let ci = 0;ci < size << 1; ci += 2) {
    const oldCharId = cells[ci];
    cells[ci] = charPool.intern(oldCharPool.get(oldCharId));
    const word1 = cells[ci + 1];
    const oldHyperlinkId = word1 >>> HYPERLINK_SHIFT & HYPERLINK_MASK;
    if (oldHyperlinkId !== 0) {
      const oldStr = oldHyperlinkPool.get(oldHyperlinkId);
      const newHyperlinkId = hyperlinkPool.intern(oldStr);
      const styleId = word1 >>> STYLE_SHIFT;
      const width = word1 & WIDTH_MASK;
      cells[ci + 1] = packWord1(styleId, newHyperlinkId, width);
    }
  }
  screen.charPool = charPool;
  screen.hyperlinkPool = hyperlinkPool;
}
function cellAt(screen, x, y) {
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height)
    return;
  return cellAtIndex(screen, y * screen.width + x);
}
function cellAtIndex(screen, index) {
  const ci = index << 1;
  const word1 = screen.cells[ci + 1];
  const hid = word1 >>> HYPERLINK_SHIFT & HYPERLINK_MASK;
  return {
    char: screen.charPool.get(screen.cells[ci]),
    styleId: word1 >>> STYLE_SHIFT,
    width: word1 & WIDTH_MASK,
    hyperlink: hid === 0 ? undefined : screen.hyperlinkPool.get(hid)
  };
}
function visibleCellAtIndex(cells, charPool, hyperlinkPool, index, lastRenderedStyleId) {
  const ci = index << 1;
  const charId = cells[ci];
  if (charId === 1)
    return;
  const word1 = cells[ci + 1];
  if (charId === 0 && (word1 & 262140) === 0) {
    const fgStyle = word1 >>> STYLE_SHIFT;
    if (fgStyle === 0 || fgStyle === lastRenderedStyleId)
      return;
  }
  const hid = word1 >>> HYPERLINK_SHIFT & HYPERLINK_MASK;
  return {
    char: charPool.get(charId),
    styleId: word1 >>> STYLE_SHIFT,
    width: word1 & WIDTH_MASK,
    hyperlink: hid === 0 ? undefined : hyperlinkPool.get(hid)
  };
}
function cellAtCI(screen, ci, out) {
  const w1 = ci | 1;
  const word1 = screen.cells[w1];
  out.char = screen.charPool.get(screen.cells[ci]);
  out.styleId = word1 >>> STYLE_SHIFT;
  out.width = word1 & WIDTH_MASK;
  const hid = word1 >>> HYPERLINK_SHIFT & HYPERLINK_MASK;
  out.hyperlink = hid === 0 ? undefined : screen.hyperlinkPool.get(hid);
}
function charInCellAt(screen, x, y) {
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height)
    return;
  const ci = y * screen.width + x << 1;
  return screen.charPool.get(screen.cells[ci]);
}
function setCellAt(screen, x, y, cell) {
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height)
    return;
  const ci = y * screen.width + x << 1;
  const cells = screen.cells;
  const prevWidth = cells[ci + 1] & WIDTH_MASK;
  if (prevWidth === 1 /* Wide */ && cell.width !== 1 /* Wide */) {
    const spacerX = x + 1;
    if (spacerX < screen.width) {
      const spacerCI = ci + 2;
      if ((cells[spacerCI + 1] & WIDTH_MASK) === 2 /* SpacerTail */) {
        cells[spacerCI] = EMPTY_CHAR_INDEX;
        cells[spacerCI + 1] = packWord1(screen.emptyStyleId, 0, 0 /* Narrow */);
      }
    }
  }
  let clearedWideX = -1;
  if (prevWidth === 2 /* SpacerTail */ && cell.width !== 2 /* SpacerTail */) {
    if (x > 0) {
      const wideCI = ci - 2;
      if ((cells[wideCI + 1] & WIDTH_MASK) === 1 /* Wide */) {
        cells[wideCI] = EMPTY_CHAR_INDEX;
        cells[wideCI + 1] = packWord1(screen.emptyStyleId, 0, 0 /* Narrow */);
        clearedWideX = x - 1;
      }
    }
  }
  cells[ci] = internCharString(screen, cell.char);
  cells[ci + 1] = packWord1(cell.styleId, internHyperlink(screen, cell.hyperlink), cell.width);
  const minX = clearedWideX >= 0 ? Math.min(x, clearedWideX) : x;
  const damage = screen.damage;
  if (damage) {
    const right = damage.x + damage.width;
    const bottom = damage.y + damage.height;
    if (minX < damage.x) {
      damage.width += damage.x - minX;
      damage.x = minX;
    } else if (x >= right) {
      damage.width = x - damage.x + 1;
    }
    if (y < damage.y) {
      damage.height += damage.y - y;
      damage.y = y;
    } else if (y >= bottom) {
      damage.height = y - damage.y + 1;
    }
  } else {
    screen.damage = { x: minX, y, width: x - minX + 1, height: 1 };
  }
  if (cell.width === 1 /* Wide */) {
    const spacerX = x + 1;
    if (spacerX < screen.width) {
      const spacerCI = ci + 2;
      if ((cells[spacerCI + 1] & WIDTH_MASK) === 1 /* Wide */) {
        const orphanCI = spacerCI + 2;
        if (spacerX + 1 < screen.width && (cells[orphanCI + 1] & WIDTH_MASK) === 2 /* SpacerTail */) {
          cells[orphanCI] = EMPTY_CHAR_INDEX;
          cells[orphanCI + 1] = packWord1(screen.emptyStyleId, 0, 0 /* Narrow */);
        }
      }
      cells[spacerCI] = SPACER_CHAR_INDEX;
      cells[spacerCI + 1] = packWord1(screen.emptyStyleId, 0, 2 /* SpacerTail */);
      const d = screen.damage;
      if (d && spacerX >= d.x + d.width) {
        d.width = spacerX - d.x + 1;
      }
    }
  }
}
function setCellStyleId(screen, x, y, styleId) {
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height)
    return;
  const ci = y * screen.width + x << 1;
  const cells = screen.cells;
  const word1 = cells[ci + 1];
  const width = word1 & WIDTH_MASK;
  if (width === 2 /* SpacerTail */ || width === 3 /* SpacerHead */)
    return;
  const hid = word1 >>> HYPERLINK_SHIFT & HYPERLINK_MASK;
  cells[ci + 1] = packWord1(styleId, hid, width);
  const d = screen.damage;
  if (d) {
    screen.damage = unionRect(d, { x, y, width: 1, height: 1 });
  } else {
    screen.damage = { x, y, width: 1, height: 1 };
  }
}
function internCharString(screen, char) {
  return screen.charPool.intern(char);
}
function blitRegion(dst, src, regionX, regionY, maxX, maxY) {
  regionX = Math.max(0, regionX);
  regionY = Math.max(0, regionY);
  if (regionX >= maxX || regionY >= maxY)
    return;
  const rowLen = maxX - regionX;
  const srcStride = src.width << 1;
  const dstStride = dst.width << 1;
  const rowBytes = rowLen << 1;
  const srcCells = src.cells;
  const dstCells = dst.cells;
  const srcNoSel = src.noSelect;
  const dstNoSel = dst.noSelect;
  dst.softWrap.set(src.softWrap.subarray(regionY, maxY), regionY);
  if (regionX === 0 && maxX === src.width && src.width === dst.width) {
    const srcStart = regionY * srcStride;
    const totalBytes = (maxY - regionY) * srcStride;
    dstCells.set(srcCells.subarray(srcStart, srcStart + totalBytes), srcStart);
    const nsStart = regionY * src.width;
    const nsLen = (maxY - regionY) * src.width;
    dstNoSel.set(srcNoSel.subarray(nsStart, nsStart + nsLen), nsStart);
  } else {
    let srcRowCI = regionY * srcStride + (regionX << 1);
    let dstRowCI = regionY * dstStride + (regionX << 1);
    let srcRowNS = regionY * src.width + regionX;
    let dstRowNS = regionY * dst.width + regionX;
    for (let y = regionY;y < maxY; y++) {
      dstCells.set(srcCells.subarray(srcRowCI, srcRowCI + rowBytes), dstRowCI);
      dstNoSel.set(srcNoSel.subarray(srcRowNS, srcRowNS + rowLen), dstRowNS);
      srcRowCI += srcStride;
      dstRowCI += dstStride;
      srcRowNS += src.width;
      dstRowNS += dst.width;
    }
  }
  const regionRect = {
    x: regionX,
    y: regionY,
    width: rowLen,
    height: maxY - regionY
  };
  if (dst.damage) {
    dst.damage = unionRect(dst.damage, regionRect);
  } else {
    dst.damage = regionRect;
  }
  if (maxX < dst.width) {
    let srcLastCI = regionY * src.width + (maxX - 1) << 1;
    let dstSpacerCI = regionY * dst.width + maxX << 1;
    let wroteSpacerOutsideRegion = false;
    for (let y = regionY;y < maxY; y++) {
      if ((srcCells[srcLastCI + 1] & WIDTH_MASK) === 1 /* Wide */) {
        dstCells[dstSpacerCI] = SPACER_CHAR_INDEX;
        dstCells[dstSpacerCI + 1] = packWord1(dst.emptyStyleId, 0, 2 /* SpacerTail */);
        wroteSpacerOutsideRegion = true;
      }
      srcLastCI += srcStride;
      dstSpacerCI += dstStride;
    }
    if (wroteSpacerOutsideRegion && dst.damage) {
      const rightEdge = dst.damage.x + dst.damage.width;
      if (rightEdge === maxX) {
        dst.damage = { ...dst.damage, width: dst.damage.width + 1 };
      }
    }
  }
}
function shiftRows(screen, top, bottom, n) {
  if (n === 0 || top < 0 || bottom >= screen.height || top > bottom)
    return;
  const w = screen.width;
  const cells64 = screen.cells64;
  const noSel = screen.noSelect;
  const sw = screen.softWrap;
  const absN = Math.abs(n);
  if (absN > bottom - top) {
    cells64.fill(EMPTY_CELL_VALUE, top * w, (bottom + 1) * w);
    noSel.fill(0, top * w, (bottom + 1) * w);
    sw.fill(0, top, bottom + 1);
    return;
  }
  if (n > 0) {
    cells64.copyWithin(top * w, (top + n) * w, (bottom + 1) * w);
    noSel.copyWithin(top * w, (top + n) * w, (bottom + 1) * w);
    sw.copyWithin(top, top + n, bottom + 1);
    cells64.fill(EMPTY_CELL_VALUE, (bottom - n + 1) * w, (bottom + 1) * w);
    noSel.fill(0, (bottom - n + 1) * w, (bottom + 1) * w);
    sw.fill(0, bottom - n + 1, bottom + 1);
  } else {
    cells64.copyWithin((top - n) * w, top * w, (bottom + n + 1) * w);
    noSel.copyWithin((top - n) * w, top * w, (bottom + n + 1) * w);
    sw.copyWithin(top - n, top, bottom + n + 1);
    cells64.fill(EMPTY_CELL_VALUE, top * w, (top - n) * w);
    noSel.fill(0, top * w, (top - n) * w);
    sw.fill(0, top, top - n);
  }
}
function extractHyperlinkFromStyles(styles5) {
  for (const style of styles5) {
    const code = style.code;
    if (code.length < 5 || !code.startsWith(OSC8_PREFIX))
      continue;
    const match = code.match(OSC8_REGEX);
    if (match) {
      return match[1] || null;
    }
  }
  return null;
}
function filterOutHyperlinkStyles(styles5) {
  return styles5.filter((style) => !style.code.startsWith(OSC8_PREFIX) || !OSC8_REGEX.test(style.code));
}
function diffEach(prev, next, cb) {
  const prevWidth = prev.width;
  const nextWidth = next.width;
  const prevHeight = prev.height;
  const nextHeight = next.height;
  let region;
  if (prevWidth === 0 && prevHeight === 0) {
    region = { x: 0, y: 0, width: nextWidth, height: nextHeight };
  } else if (next.damage) {
    region = next.damage;
    if (prev.damage) {
      region = unionRect(region, prev.damage);
    }
  } else if (prev.damage) {
    region = prev.damage;
  } else {
    region = { x: 0, y: 0, width: 0, height: 0 };
  }
  if (prevHeight > nextHeight) {
    region = unionRect(region, {
      x: 0,
      y: nextHeight,
      width: prevWidth,
      height: prevHeight - nextHeight
    });
  }
  if (prevWidth > nextWidth) {
    region = unionRect(region, {
      x: nextWidth,
      y: 0,
      width: prevWidth - nextWidth,
      height: prevHeight
    });
  }
  const maxHeight = Math.max(prevHeight, nextHeight);
  const maxWidth = Math.max(prevWidth, nextWidth);
  const endY = Math.min(region.y + region.height, maxHeight);
  const endX = Math.min(region.x + region.width, maxWidth);
  if (prevWidth === nextWidth) {
    return diffSameWidth(prev, next, region.x, endX, region.y, endY, cb);
  }
  return diffDifferentWidth(prev, next, region.x, endX, region.y, endY, cb);
}
function findNextDiff(a, b, w0, count) {
  for (let i = 0;i < count; i++, w0 += 2) {
    const w1 = w0 | 1;
    if (a[w0] !== b[w0] || a[w1] !== b[w1])
      return i;
  }
  return count;
}
function diffRowBoth(prevCells, nextCells, prev, next, ci, y, startX, endX, prevCell, nextCell, cb) {
  let x = startX;
  while (x < endX) {
    const skip = findNextDiff(prevCells, nextCells, ci, endX - x);
    x += skip;
    ci += skip << 1;
    if (x >= endX)
      break;
    cellAtCI(prev, ci, prevCell);
    cellAtCI(next, ci, nextCell);
    if (cb(x, y, prevCell, nextCell))
      return true;
    x++;
    ci += 2;
  }
  return false;
}
function diffRowRemoved(prev, ci, y, startX, endX, prevCell, cb) {
  for (let x = startX;x < endX; x++, ci += 2) {
    cellAtCI(prev, ci, prevCell);
    if (cb(x, y, prevCell, undefined))
      return true;
  }
  return false;
}
function diffRowAdded(nextCells, next, ci, y, startX, endX, nextCell, cb) {
  for (let x = startX;x < endX; x++, ci += 2) {
    if (nextCells[ci] === 0 && nextCells[ci | 1] === 0)
      continue;
    cellAtCI(next, ci, nextCell);
    if (cb(x, y, undefined, nextCell))
      return true;
  }
  return false;
}
function diffSameWidth(prev, next, startX, endX, startY, endY, cb) {
  const prevCells = prev.cells;
  const nextCells = next.cells;
  const width = prev.width;
  const prevHeight = prev.height;
  const nextHeight = next.height;
  const stride = width << 1;
  const prevCell = {
    char: " ",
    styleId: 0,
    width: 0 /* Narrow */,
    hyperlink: undefined
  };
  const nextCell = {
    char: " ",
    styleId: 0,
    width: 0 /* Narrow */,
    hyperlink: undefined
  };
  const rowEndX = Math.min(endX, width);
  let rowCI = startY * width + startX << 1;
  for (let y = startY;y < endY; y++) {
    const prevIn = y < prevHeight;
    const nextIn = y < nextHeight;
    if (prevIn && nextIn) {
      if (diffRowBoth(prevCells, nextCells, prev, next, rowCI, y, startX, rowEndX, prevCell, nextCell, cb))
        return true;
    } else if (prevIn) {
      if (diffRowRemoved(prev, rowCI, y, startX, rowEndX, prevCell, cb))
        return true;
    } else if (nextIn) {
      if (diffRowAdded(nextCells, next, rowCI, y, startX, rowEndX, nextCell, cb))
        return true;
    }
    rowCI += stride;
  }
  return false;
}
function diffDifferentWidth(prev, next, startX, endX, startY, endY, cb) {
  const prevWidth = prev.width;
  const nextWidth = next.width;
  const prevCells = prev.cells;
  const nextCells = next.cells;
  const prevCell = {
    char: " ",
    styleId: 0,
    width: 0 /* Narrow */,
    hyperlink: undefined
  };
  const nextCell = {
    char: " ",
    styleId: 0,
    width: 0 /* Narrow */,
    hyperlink: undefined
  };
  const prevStride = prevWidth << 1;
  const nextStride = nextWidth << 1;
  let prevRowCI = startY * prevWidth + startX << 1;
  let nextRowCI = startY * nextWidth + startX << 1;
  for (let y = startY;y < endY; y++) {
    const prevIn = y < prev.height;
    const nextIn = y < next.height;
    const prevEndX = prevIn ? Math.min(endX, prevWidth) : startX;
    const nextEndX = nextIn ? Math.min(endX, nextWidth) : startX;
    const bothEndX = Math.min(prevEndX, nextEndX);
    let prevCI = prevRowCI;
    let nextCI = nextRowCI;
    for (let x = startX;x < bothEndX; x++) {
      if (prevCells[prevCI] === nextCells[nextCI] && prevCells[prevCI + 1] === nextCells[nextCI + 1]) {
        prevCI += 2;
        nextCI += 2;
        continue;
      }
      cellAtCI(prev, prevCI, prevCell);
      cellAtCI(next, nextCI, nextCell);
      prevCI += 2;
      nextCI += 2;
      if (cb(x, y, prevCell, nextCell))
        return true;
    }
    if (prevEndX > bothEndX) {
      prevCI = prevRowCI + (bothEndX - startX << 1);
      for (let x = bothEndX;x < prevEndX; x++) {
        cellAtCI(prev, prevCI, prevCell);
        prevCI += 2;
        if (cb(x, y, prevCell, undefined))
          return true;
      }
    }
    if (nextEndX > bothEndX) {
      nextCI = nextRowCI + (bothEndX - startX << 1);
      for (let x = bothEndX;x < nextEndX; x++) {
        if (nextCells[nextCI] === 0 && nextCells[nextCI | 1] === 0) {
          nextCI += 2;
          continue;
        }
        cellAtCI(next, nextCI, nextCell);
        nextCI += 2;
        if (cb(x, y, undefined, nextCell))
          return true;
      }
    }
    prevRowCI += prevStride;
    nextRowCI += nextStride;
  }
  return false;
}
function markNoSelectRegion(screen, x, y, width, height) {
  const maxX = Math.min(x + width, screen.width);
  const maxY = Math.min(y + height, screen.height);
  const noSel = screen.noSelect;
  const stride = screen.width;
  for (let row = Math.max(0, y);row < maxY; row++) {
    const rowStart = row * stride;
    noSel.fill(1, rowStart + Math.max(0, x), rowStart + maxX);
  }
}
var INVERSE_CODE, BOLD_CODE, UNDERLINE_CODE, YELLOW_FG_CODE, VISIBLE_ON_SPACE, EMPTY_CHAR_INDEX = 0, SPACER_CHAR_INDEX = 1, STYLE_SHIFT = 17, HYPERLINK_SHIFT = 2, HYPERLINK_MASK = 32767, WIDTH_MASK = 3, EMPTY_CELL_VALUE = 0n, OSC8_REGEX, OSC8_PREFIX;
var init_screen = __esm(() => {
  init_build();
  init_geometry();
  init_ansi();
  init_warn();
  INVERSE_CODE = {
    type: "ansi",
    code: "\x1B[7m",
    endCode: "\x1B[27m"
  };
  BOLD_CODE = {
    type: "ansi",
    code: "\x1B[1m",
    endCode: "\x1B[22m"
  };
  UNDERLINE_CODE = {
    type: "ansi",
    code: "\x1B[4m",
    endCode: "\x1B[24m"
  };
  YELLOW_FG_CODE = {
    type: "ansi",
    code: "\x1B[33m",
    endCode: "\x1B[39m"
  };
  VISIBLE_ON_SPACE = new Set([
    "\x1B[49m",
    "\x1B[27m",
    "\x1B[24m",
    "\x1B[29m",
    "\x1B[55m"
  ]);
  OSC8_REGEX = new RegExp(`^${ESC}\\]8${SEP}${SEP}([^${BEL}]*)${BEL}$`);
  OSC8_PREFIX = `${ESC}]8${SEP}`;
});

// packages/@ant/ink/src/core/selection.ts
function createSelectionState() {
  return {
    anchor: null,
    focus: null,
    isDragging: false,
    anchorSpan: null,
    scrolledOffAbove: [],
    scrolledOffBelow: [],
    scrolledOffAboveSW: [],
    scrolledOffBelowSW: [],
    lastPressHadAlt: false
  };
}
function startSelection(s, col, row) {
  s.anchor = { col, row };
  s.focus = null;
  s.isDragging = true;
  s.anchorSpan = null;
  s.scrolledOffAbove = [];
  s.scrolledOffBelow = [];
  s.scrolledOffAboveSW = [];
  s.scrolledOffBelowSW = [];
  s.virtualAnchorRow = undefined;
  s.virtualFocusRow = undefined;
  s.lastPressHadAlt = false;
}
function updateSelection(s, col, row) {
  if (!s.isDragging)
    return;
  if (!s.focus && s.anchor && s.anchor.col === col && s.anchor.row === row)
    return;
  s.focus = { col, row };
}
function finishSelection(s) {
  s.isDragging = false;
}
function clearSelection(s) {
  s.anchor = null;
  s.focus = null;
  s.isDragging = false;
  s.anchorSpan = null;
  s.scrolledOffAbove = [];
  s.scrolledOffBelow = [];
  s.scrolledOffAboveSW = [];
  s.scrolledOffBelowSW = [];
  s.virtualAnchorRow = undefined;
  s.virtualFocusRow = undefined;
  s.lastPressHadAlt = false;
}
function charClass(c) {
  if (c === " " || c === "")
    return 0;
  if (WORD_CHAR.test(c))
    return 1;
  return 2;
}
function wordBoundsAt(screen, col, row) {
  if (row < 0 || row >= screen.height)
    return null;
  const width = screen.width;
  const noSelect = screen.noSelect;
  const rowOff = row * width;
  let c = col;
  if (c > 0) {
    const cell = cellAt(screen, c, row);
    if (cell && cell.width === 2 /* SpacerTail */)
      c -= 1;
  }
  if (c < 0 || c >= width || noSelect[rowOff + c] === 1)
    return null;
  const startCell = cellAt(screen, c, row);
  if (!startCell)
    return null;
  const cls = charClass(startCell.char);
  let lo = c;
  while (lo > 0) {
    const prev = lo - 1;
    if (noSelect[rowOff + prev] === 1)
      break;
    const pc = cellAt(screen, prev, row);
    if (!pc)
      break;
    if (pc.width === 2 /* SpacerTail */) {
      if (prev === 0 || noSelect[rowOff + prev - 1] === 1)
        break;
      const head = cellAt(screen, prev - 1, row);
      if (!head || charClass(head.char) !== cls)
        break;
      lo = prev - 1;
      continue;
    }
    if (charClass(pc.char) !== cls)
      break;
    lo = prev;
  }
  let hi = c;
  while (hi < width - 1) {
    const next = hi + 1;
    if (noSelect[rowOff + next] === 1)
      break;
    const nc = cellAt(screen, next, row);
    if (!nc)
      break;
    if (nc.width === 2 /* SpacerTail */) {
      hi = next;
      continue;
    }
    if (charClass(nc.char) !== cls)
      break;
    hi = next;
  }
  return { lo, hi };
}
function comparePoints(a, b) {
  if (a.row !== b.row)
    return a.row < b.row ? -1 : 1;
  if (a.col !== b.col)
    return a.col < b.col ? -1 : 1;
  return 0;
}
function selectWordAt(s, screen, col, row) {
  const b = wordBoundsAt(screen, col, row);
  if (!b)
    return;
  const lo = { col: b.lo, row };
  const hi = { col: b.hi, row };
  s.anchor = lo;
  s.focus = hi;
  s.isDragging = true;
  s.anchorSpan = { lo, hi, kind: "word" };
}
function isUrlChar(c) {
  if (c.length !== 1)
    return false;
  const code = c.charCodeAt(0);
  return code >= 33 && code <= 126 && !URL_BOUNDARY.has(c);
}
function findPlainTextUrlAt(screen, col, row) {
  if (row < 0 || row >= screen.height)
    return;
  const width = screen.width;
  const noSelect = screen.noSelect;
  const rowOff = row * width;
  let c = col;
  if (c > 0) {
    const cell = cellAt(screen, c, row);
    if (cell && cell.width === 2 /* SpacerTail */)
      c -= 1;
  }
  if (c < 0 || c >= width || noSelect[rowOff + c] === 1)
    return;
  const startCell = cellAt(screen, c, row);
  if (!startCell || !isUrlChar(startCell.char))
    return;
  let lo = c;
  while (lo > 0) {
    const prev = lo - 1;
    if (noSelect[rowOff + prev] === 1)
      break;
    const pc = cellAt(screen, prev, row);
    if (!pc || pc.width !== 0 /* Narrow */ || !isUrlChar(pc.char))
      break;
    lo = prev;
  }
  let hi = c;
  while (hi < width - 1) {
    const next = hi + 1;
    if (noSelect[rowOff + next] === 1)
      break;
    const nc = cellAt(screen, next, row);
    if (!nc || nc.width !== 0 /* Narrow */ || !isUrlChar(nc.char))
      break;
    hi = next;
  }
  let token = "";
  for (let i = lo;i <= hi; i++)
    token += cellAt(screen, i, row).char;
  const clickIdx = c - lo;
  const schemeRe = /(?:https?|file):\/\//g;
  let urlStart = -1;
  let urlEnd = token.length;
  for (let m;m = schemeRe.exec(token); ) {
    if (m.index > clickIdx) {
      urlEnd = m.index;
      break;
    }
    urlStart = m.index;
  }
  if (urlStart < 0)
    return;
  let url = token.slice(urlStart, urlEnd);
  const OPENER = { ")": "(", "]": "[", "}": "{" };
  while (url.length > 0) {
    const last = url.at(-1);
    if (".,;:!?".includes(last)) {
      url = url.slice(0, -1);
      continue;
    }
    const opener = OPENER[last];
    if (!opener)
      break;
    let opens = 0;
    let closes = 0;
    for (let i = 0;i < url.length; i++) {
      const ch = url.charAt(i);
      if (ch === opener)
        opens++;
      else if (ch === last)
        closes++;
    }
    if (closes > opens)
      url = url.slice(0, -1);
    else
      break;
  }
  if (clickIdx >= urlStart + url.length)
    return;
  return url;
}
function selectLineAt(s, screen, row) {
  if (row < 0 || row >= screen.height)
    return;
  const lo = { col: 0, row };
  const hi = { col: screen.width - 1, row };
  s.anchor = lo;
  s.focus = hi;
  s.isDragging = true;
  s.anchorSpan = { lo, hi, kind: "line" };
}
function extendSelection(s, screen, col, row) {
  if (!s.isDragging || !s.anchorSpan)
    return;
  const span = s.anchorSpan;
  let mLo;
  let mHi;
  if (span.kind === "word") {
    const b = wordBoundsAt(screen, col, row);
    mLo = { col: b ? b.lo : col, row };
    mHi = { col: b ? b.hi : col, row };
  } else {
    const r = clamp(row, 0, screen.height - 1);
    mLo = { col: 0, row: r };
    mHi = { col: screen.width - 1, row: r };
  }
  if (comparePoints(mHi, span.lo) < 0) {
    s.anchor = span.hi;
    s.focus = mLo;
  } else if (comparePoints(mLo, span.hi) > 0) {
    s.anchor = span.lo;
    s.focus = mHi;
  } else {
    s.anchor = span.lo;
    s.focus = span.hi;
  }
}
function moveFocus(s, col, row) {
  if (!s.focus)
    return;
  s.anchorSpan = null;
  s.focus = { col, row };
  s.virtualFocusRow = undefined;
}
function shiftSelection(s, dRow, minRow, maxRow, width) {
  if (!s.anchor || !s.focus)
    return;
  const vAnchor = (s.virtualAnchorRow ?? s.anchor.row) + dRow;
  const vFocus = (s.virtualFocusRow ?? s.focus.row) + dRow;
  if (vAnchor < minRow && vFocus < minRow || vAnchor > maxRow && vFocus > maxRow) {
    clearSelection(s);
    return;
  }
  const oldMin = Math.min(s.virtualAnchorRow ?? s.anchor.row, s.virtualFocusRow ?? s.focus.row);
  const oldMax = Math.max(s.virtualAnchorRow ?? s.anchor.row, s.virtualFocusRow ?? s.focus.row);
  const oldAboveDebt = Math.max(0, minRow - oldMin);
  const oldBelowDebt = Math.max(0, oldMax - maxRow);
  const newAboveDebt = Math.max(0, minRow - Math.min(vAnchor, vFocus));
  const newBelowDebt = Math.max(0, Math.max(vAnchor, vFocus) - maxRow);
  if (newAboveDebt < oldAboveDebt) {
    const drop = oldAboveDebt - newAboveDebt;
    s.scrolledOffAbove.length -= drop;
    s.scrolledOffAboveSW.length = s.scrolledOffAbove.length;
  }
  if (newBelowDebt < oldBelowDebt) {
    const drop = oldBelowDebt - newBelowDebt;
    s.scrolledOffBelow.splice(0, drop);
    s.scrolledOffBelowSW.splice(0, drop);
  }
  if (s.scrolledOffAbove.length > newAboveDebt) {
    s.scrolledOffAbove = newAboveDebt > 0 ? s.scrolledOffAbove.slice(-newAboveDebt) : [];
    s.scrolledOffAboveSW = newAboveDebt > 0 ? s.scrolledOffAboveSW.slice(-newAboveDebt) : [];
  }
  if (s.scrolledOffBelow.length > newBelowDebt) {
    s.scrolledOffBelow = s.scrolledOffBelow.slice(0, newBelowDebt);
    s.scrolledOffBelowSW = s.scrolledOffBelowSW.slice(0, newBelowDebt);
  }
  const shift = (p, vRow) => {
    if (vRow < minRow)
      return { col: 0, row: minRow };
    if (vRow > maxRow)
      return { col: width - 1, row: maxRow };
    return { col: p.col, row: vRow };
  };
  s.anchor = shift(s.anchor, vAnchor);
  s.focus = shift(s.focus, vFocus);
  s.virtualAnchorRow = vAnchor < minRow || vAnchor > maxRow ? vAnchor : undefined;
  s.virtualFocusRow = vFocus < minRow || vFocus > maxRow ? vFocus : undefined;
  if (s.anchorSpan) {
    const sp = (p) => {
      const r = p.row + dRow;
      if (r < minRow)
        return { col: 0, row: minRow };
      if (r > maxRow)
        return { col: width - 1, row: maxRow };
      return { col: p.col, row: r };
    };
    s.anchorSpan = {
      lo: sp(s.anchorSpan.lo),
      hi: sp(s.anchorSpan.hi),
      kind: s.anchorSpan.kind
    };
  }
}
function shiftAnchor(s, dRow, minRow, maxRow) {
  if (!s.anchor)
    return;
  const raw = (s.virtualAnchorRow ?? s.anchor.row) + dRow;
  s.anchor = { col: s.anchor.col, row: clamp(raw, minRow, maxRow) };
  s.virtualAnchorRow = raw < minRow || raw > maxRow ? raw : undefined;
  if (s.anchorSpan) {
    const shift = (p) => ({
      col: p.col,
      row: clamp(p.row + dRow, minRow, maxRow)
    });
    s.anchorSpan = {
      lo: shift(s.anchorSpan.lo),
      hi: shift(s.anchorSpan.hi),
      kind: s.anchorSpan.kind
    };
  }
}
function shiftSelectionForFollow(s, dRow, minRow, maxRow) {
  if (!s.anchor)
    return false;
  const rawAnchor = (s.virtualAnchorRow ?? s.anchor.row) + dRow;
  const rawFocus = s.focus ? (s.virtualFocusRow ?? s.focus.row) + dRow : undefined;
  if (rawAnchor < minRow && rawFocus !== undefined && rawFocus < minRow) {
    clearSelection(s);
    return true;
  }
  s.anchor = { col: s.anchor.col, row: clamp(rawAnchor, minRow, maxRow) };
  if (s.focus && rawFocus !== undefined) {
    s.focus = { col: s.focus.col, row: clamp(rawFocus, minRow, maxRow) };
  }
  s.virtualAnchorRow = rawAnchor < minRow || rawAnchor > maxRow ? rawAnchor : undefined;
  s.virtualFocusRow = rawFocus !== undefined && (rawFocus < minRow || rawFocus > maxRow) ? rawFocus : undefined;
  if (s.anchorSpan) {
    const shift = (p) => ({
      col: p.col,
      row: clamp(p.row + dRow, minRow, maxRow)
    });
    s.anchorSpan = {
      lo: shift(s.anchorSpan.lo),
      hi: shift(s.anchorSpan.hi),
      kind: s.anchorSpan.kind
    };
  }
  return false;
}
function hasSelection(s) {
  return s.anchor !== null && s.focus !== null;
}
function selectionBounds(s) {
  if (!s.anchor || !s.focus)
    return null;
  return comparePoints(s.anchor, s.focus) <= 0 ? { start: s.anchor, end: s.focus } : { start: s.focus, end: s.anchor };
}
function extractRowText(screen, row, colStart, colEnd) {
  const noSelect = screen.noSelect;
  const rowOff = row * screen.width;
  const contentEnd = row + 1 < screen.height ? screen.softWrap[row + 1] : 0;
  const lastCol = contentEnd > 0 ? Math.min(colEnd, contentEnd - 1) : colEnd;
  let line = "";
  for (let col = colStart;col <= lastCol; col++) {
    if (noSelect[rowOff + col] === 1)
      continue;
    const cell = cellAt(screen, col, row);
    if (!cell)
      continue;
    if (cell.width === 2 /* SpacerTail */ || cell.width === 3 /* SpacerHead */) {
      continue;
    }
    line += cell.char;
  }
  return contentEnd > 0 ? line : line.replace(/\s+$/, "");
}
function joinRows(lines, text, sw) {
  if (sw && lines.length > 0) {
    lines[lines.length - 1] += text;
  } else {
    lines.push(text);
  }
}
function getSelectedText(s, screen) {
  const b = selectionBounds(s);
  if (!b)
    return "";
  const { start, end } = b;
  const sw = screen.softWrap;
  const lines = [];
  for (let i = 0;i < s.scrolledOffAbove.length; i++) {
    joinRows(lines, s.scrolledOffAbove[i], s.scrolledOffAboveSW[i]);
  }
  for (let row = start.row;row <= end.row; row++) {
    const rowStart = row === start.row ? start.col : 0;
    const rowEnd = row === end.row ? end.col : screen.width - 1;
    joinRows(lines, extractRowText(screen, row, rowStart, rowEnd), sw[row] > 0);
  }
  for (let i = 0;i < s.scrolledOffBelow.length; i++) {
    joinRows(lines, s.scrolledOffBelow[i], s.scrolledOffBelowSW[i]);
  }
  return lines.join(`
`);
}
function captureScrolledRows(s, screen, firstRow, lastRow, side) {
  const b = selectionBounds(s);
  if (!b || firstRow > lastRow)
    return;
  const { start, end } = b;
  const lo = Math.max(firstRow, start.row);
  const hi = Math.min(lastRow, end.row);
  if (lo > hi)
    return;
  const width = screen.width;
  const sw = screen.softWrap;
  const captured = [];
  const capturedSW = [];
  for (let row = lo;row <= hi; row++) {
    const colStart = row === start.row ? start.col : 0;
    const colEnd = row === end.row ? end.col : width - 1;
    captured.push(extractRowText(screen, row, colStart, colEnd));
    capturedSW.push(sw[row] > 0);
  }
  if (side === "above") {
    s.scrolledOffAbove.push(...captured);
    s.scrolledOffAboveSW.push(...capturedSW);
    if (s.anchor && s.anchor.row === start.row && lo === start.row) {
      s.anchor = { col: 0, row: s.anchor.row };
      if (s.anchorSpan) {
        s.anchorSpan = {
          kind: s.anchorSpan.kind,
          lo: { col: 0, row: s.anchorSpan.lo.row },
          hi: { col: width - 1, row: s.anchorSpan.hi.row }
        };
      }
    }
  } else {
    s.scrolledOffBelow.unshift(...captured);
    s.scrolledOffBelowSW.unshift(...capturedSW);
    if (s.anchor && s.anchor.row === end.row && hi === end.row) {
      s.anchor = { col: width - 1, row: s.anchor.row };
      if (s.anchorSpan) {
        s.anchorSpan = {
          kind: s.anchorSpan.kind,
          lo: { col: 0, row: s.anchorSpan.lo.row },
          hi: { col: width - 1, row: s.anchorSpan.hi.row }
        };
      }
    }
  }
}
function applySelectionOverlay(screen, selection, stylePool) {
  const b = selectionBounds(selection);
  if (!b)
    return;
  const { start, end } = b;
  const width = screen.width;
  const noSelect = screen.noSelect;
  for (let row = start.row;row <= end.row && row < screen.height; row++) {
    const colStart = row === start.row ? start.col : 0;
    const colEnd = row === end.row ? Math.min(end.col, width - 1) : width - 1;
    const rowOff = row * width;
    for (let col = colStart;col <= colEnd; col++) {
      const idx = rowOff + col;
      if (noSelect[idx] === 1)
        continue;
      const cell = cellAtIndex(screen, idx);
      setCellStyleId(screen, col, row, stylePool.withSelectionBg(cell.styleId));
    }
  }
}
var WORD_CHAR, URL_BOUNDARY;
var init_selection = __esm(() => {
  init_geometry();
  init_screen();
  WORD_CHAR = /[\p{L}\p{N}_/.\-+~\\]/u;
  URL_BOUNDARY = new Set([..."<>\"'` "]);
});

// packages/@ant/ink/src/core/clearTerminal.ts
function isWindowsTerminal() {
  return process.platform === "win32" && !!process.env.WT_SESSION;
}
function isMintty() {
  if (process.env.TERM_PROGRAM === "mintty") {
    return true;
  }
  if (process.platform === "win32" && process.env.MSYSTEM) {
    return true;
  }
  return false;
}
function isModernWindowsTerminal() {
  if (isWindowsTerminal()) {
    return true;
  }
  if (process.platform === "win32" && process.env.TERM_PROGRAM === "vscode" && process.env.TERM_PROGRAM_VERSION) {
    return true;
  }
  if (isMintty()) {
    return true;
  }
  return false;
}
function getClearTerminalSequence() {
  if (process.platform === "win32") {
    if (isModernWindowsTerminal()) {
      return ERASE_SCREEN + ERASE_SCROLLBACK + CURSOR_HOME;
    } else {
      return ERASE_SCREEN + CURSOR_HOME_WINDOWS;
    }
  }
  return ERASE_SCREEN + ERASE_SCROLLBACK + CURSOR_HOME;
}
var CURSOR_HOME_WINDOWS, clearTerminal;
var init_clearTerminal = __esm(() => {
  init_csi();
  CURSOR_HOME_WINDOWS = csi(0, "f");
  clearTerminal = getClearTerminalSequence();
});

// packages/@ant/ink/src/core/termio/dec.ts
function decset(mode) {
  return csi(`?${mode}h`);
}
function decreset(mode) {
  return csi(`?${mode}l`);
}
var DEC, BSU, ESU, EBP, DBP, EFE, DFE, SHOW_CURSOR, HIDE_CURSOR, ENTER_ALT_SCREEN, EXIT_ALT_SCREEN, ENABLE_MOUSE_TRACKING, DISABLE_MOUSE_TRACKING;
var init_dec = __esm(() => {
  init_csi();
  DEC = {
    CURSOR_VISIBLE: 25,
    ALT_SCREEN: 47,
    ALT_SCREEN_CLEAR: 1049,
    MOUSE_NORMAL: 1000,
    MOUSE_BUTTON: 1002,
    MOUSE_ANY: 1003,
    MOUSE_SGR: 1006,
    FOCUS_EVENTS: 1004,
    BRACKETED_PASTE: 2004,
    SYNCHRONIZED_UPDATE: 2026
  };
  BSU = decset(DEC.SYNCHRONIZED_UPDATE);
  ESU = decreset(DEC.SYNCHRONIZED_UPDATE);
  EBP = decset(DEC.BRACKETED_PASTE);
  DBP = decreset(DEC.BRACKETED_PASTE);
  EFE = decset(DEC.FOCUS_EVENTS);
  DFE = decreset(DEC.FOCUS_EVENTS);
  SHOW_CURSOR = decset(DEC.CURSOR_VISIBLE);
  HIDE_CURSOR = decreset(DEC.CURSOR_VISIBLE);
  ENTER_ALT_SCREEN = decset(DEC.ALT_SCREEN_CLEAR);
  EXIT_ALT_SCREEN = decreset(DEC.ALT_SCREEN_CLEAR);
  ENABLE_MOUSE_TRACKING = decset(DEC.MOUSE_NORMAL) + decset(DEC.MOUSE_BUTTON) + decset(DEC.MOUSE_ANY) + decset(DEC.MOUSE_SGR);
  DISABLE_MOUSE_TRACKING = decreset(DEC.MOUSE_SGR) + decreset(DEC.MOUSE_ANY) + decreset(DEC.MOUSE_BUTTON) + decreset(DEC.MOUSE_NORMAL);
});

// packages/@ant/ink/src/core/termio/osc.ts
import { Buffer as Buffer3 } from "buffer";
import { execFile as nodeExecFile } from "child_process";
function execFileNoThrow(command, args, options = {}) {
  return new Promise((resolve) => {
    const { input, timeout } = options;
    const proc = nodeExecFile(command, args, { timeout }, (error, stdout, stderr) => {
      resolve({
        code: error ? 1 : 0,
        stdout: stdout ?? "",
        stderr: stderr ?? ""
      });
    });
    if (input && proc.stdin) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
  });
}
function osc(...parts) {
  const terminator = process.env.TERM_PROGRAM === "kitty" ? ST : BEL;
  return `${OSC_PREFIX}${parts.join(SEP)}${terminator}`;
}
function wrapForMultiplexer(sequence) {
  if (process.env["TMUX"]) {
    const escaped = sequence.replaceAll("\x1B", "\x1B\x1B");
    return `\x1BPtmux;${escaped}\x1B\\`;
  }
  if (process.env["STY"]) {
    return `\x1BP${sequence}\x1B\\`;
  }
  return sequence;
}
function getClipboardPath() {
  const nativeAvailable = process.platform === "darwin" && !process.env["SSH_CONNECTION"];
  if (nativeAvailable)
    return "native";
  if (process.env["TMUX"])
    return "tmux-buffer";
  return "osc52";
}
function tmuxPassthrough(payload) {
  return `${ESC}Ptmux;${payload.replaceAll(ESC, ESC + ESC)}${ST}`;
}
async function tmuxLoadBuffer(text) {
  if (!process.env["TMUX"])
    return false;
  const args = process.env["LC_TERMINAL"] === "iTerm2" ? ["load-buffer", "-"] : ["load-buffer", "-w", "-"];
  const { code } = await execFileNoThrow("tmux", args, {
    input: text,
    useCwd: false,
    timeout: 2000
  });
  return code === 0;
}
async function setClipboard(text) {
  const b64 = Buffer3.from(text, "utf8").toString("base64");
  const raw = osc(OSC2.CLIPBOARD, "c", b64);
  if (!process.env["SSH_CONNECTION"])
    copyNative(text);
  const tmuxBufferLoaded = await tmuxLoadBuffer(text);
  if (tmuxBufferLoaded)
    return tmuxPassthrough(`${ESC}]52;c;${b64}${BEL}`);
  return raw;
}
function copyNative(text) {
  const opts = { input: text, useCwd: false, timeout: 2000 };
  switch (process.platform) {
    case "darwin":
      execFileNoThrow("pbcopy", [], opts);
      return;
    case "linux": {
      if (linuxCopy === null)
        return;
      if (linuxCopy === "wl-copy") {
        execFileNoThrow("wl-copy", [], opts);
        return;
      }
      if (linuxCopy === "xclip") {
        execFileNoThrow("xclip", ["-selection", "clipboard"], opts);
        return;
      }
      if (linuxCopy === "xsel") {
        execFileNoThrow("xsel", ["--clipboard", "--input"], opts);
        return;
      }
      execFileNoThrow("wl-copy", [], opts).then((r) => {
        if (r.code === 0) {
          linuxCopy = "wl-copy";
          return;
        }
        execFileNoThrow("xclip", ["-selection", "clipboard"], opts).then((r2) => {
          if (r2.code === 0) {
            linuxCopy = "xclip";
            return;
          }
          execFileNoThrow("xsel", ["--clipboard", "--input"], opts).then((r3) => {
            linuxCopy = r3.code === 0 ? "xsel" : null;
          });
        });
      });
      return;
    }
    case "win32":
      execFileNoThrow("clip", [], opts);
      return;
  }
}
function parseOSC(content) {
  const semicolonIdx = content.indexOf(";");
  const command = semicolonIdx >= 0 ? content.slice(0, semicolonIdx) : content;
  const data = semicolonIdx >= 0 ? content.slice(semicolonIdx + 1) : "";
  const commandNum = parseInt(command, 10);
  if (commandNum === OSC2.SET_TITLE_AND_ICON) {
    return { type: "title", action: { type: "both", title: data } };
  }
  if (commandNum === OSC2.SET_ICON) {
    return { type: "title", action: { type: "iconName", name: data } };
  }
  if (commandNum === OSC2.SET_TITLE) {
    return { type: "title", action: { type: "windowTitle", title: data } };
  }
  if (commandNum === OSC2.HYPERLINK) {
    const parts = data.split(";");
    const paramsStr = parts[0] ?? "";
    const url = parts.slice(1).join(";");
    if (url === "") {
      return { type: "link", action: { type: "end" } };
    }
    const params = {};
    if (paramsStr) {
      for (const pair of paramsStr.split(":")) {
        const eqIdx = pair.indexOf("=");
        if (eqIdx >= 0) {
          params[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
        }
      }
    }
    return {
      type: "link",
      action: {
        type: "start",
        url,
        params: Object.keys(params).length > 0 ? params : undefined
      }
    };
  }
  if (commandNum === OSC2.TAB_STATUS) {
    return { type: "tabStatus", action: parseTabStatus(data) };
  }
  return { type: "unknown", sequence: `\x1B]${content}` };
}
function parseOscColor(spec) {
  const hex = spec.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) {
    return {
      type: "rgb",
      r: parseInt(hex[1], 16),
      g: parseInt(hex[2], 16),
      b: parseInt(hex[3], 16)
    };
  }
  const rgb = spec.match(/^rgb:([0-9a-f]{1,4})\/([0-9a-f]{1,4})\/([0-9a-f]{1,4})$/i);
  if (rgb) {
    const scale = (s) => Math.round(parseInt(s, 16) / (16 ** s.length - 1) * 255);
    return {
      type: "rgb",
      r: scale(rgb[1]),
      g: scale(rgb[2]),
      b: scale(rgb[3])
    };
  }
  return null;
}
function parseTabStatus(data) {
  const action = {};
  for (const [key, value] of splitTabStatusPairs(data)) {
    switch (key) {
      case "indicator":
        action.indicator = value === "" ? null : parseOscColor(value);
        break;
      case "status":
        action.status = value === "" ? null : value;
        break;
      case "status-color":
        action.statusColor = value === "" ? null : parseOscColor(value);
        break;
    }
  }
  return action;
}
function* splitTabStatusPairs(data) {
  let key = "";
  let val = "";
  let inVal = false;
  let esc = false;
  for (const c of data) {
    if (esc) {
      if (inVal)
        val += c;
      else
        key += c;
      esc = false;
    } else if (c === "\\") {
      esc = true;
    } else if (c === ";") {
      yield [key, val];
      key = "";
      val = "";
      inVal = false;
    } else if (c === "=" && !inVal) {
      inVal = true;
    } else if (inVal) {
      val += c;
    } else {
      key += c;
    }
  }
  if (key || inVal)
    yield [key, val];
}
function link(url, params) {
  if (!url)
    return LINK_END;
  const p = { id: osc8Id(url), ...params };
  const paramStr = Object.entries(p).map(([k, v]) => `${k}=${v}`).join(":");
  return osc(OSC2.HYPERLINK, paramStr, url);
}
function osc8Id(url) {
  let h = 0;
  for (let i = 0;i < url.length; i++)
    h = (h << 5) - h + url.charCodeAt(i) | 0;
  return (h >>> 0).toString(36);
}
function supportsTabStatus() {
  return process.env.USER_TYPE === "ant";
}
function tabStatus(fields) {
  const parts = [];
  const rgb = (c) => c.type === "rgb" ? `#${[c.r, c.g, c.b].map((n) => n.toString(16).padStart(2, "0")).join("")}` : "";
  if ("indicator" in fields)
    parts.push(`indicator=${fields.indicator ? rgb(fields.indicator) : ""}`);
  if ("status" in fields)
    parts.push(`status=${fields.status?.replaceAll("\\", "\\\\").replaceAll(";", "\\;") ?? ""}`);
  if ("statusColor" in fields)
    parts.push(`status-color=${fields.statusColor ? rgb(fields.statusColor) : ""}`);
  return osc(OSC2.TAB_STATUS, parts.join(";"));
}
var OSC_PREFIX, ST, linuxCopy, OSC2, LINK_END, ITERM2, PROGRESS, CLEAR_ITERM2_PROGRESS, CLEAR_TERMINAL_TITLE, CLEAR_TAB_STATUS;
var init_osc = __esm(() => {
  init_ansi();
  OSC_PREFIX = ESC + String.fromCharCode(ESC_TYPE.OSC);
  ST = ESC + "\\";
  OSC2 = {
    SET_TITLE_AND_ICON: 0,
    SET_ICON: 1,
    SET_TITLE: 2,
    SET_COLOR: 4,
    SET_CWD: 7,
    HYPERLINK: 8,
    ITERM2: 9,
    SET_FG_COLOR: 10,
    SET_BG_COLOR: 11,
    SET_CURSOR_COLOR: 12,
    CLIPBOARD: 52,
    KITTY: 99,
    RESET_COLOR: 104,
    RESET_FG_COLOR: 110,
    RESET_BG_COLOR: 111,
    RESET_CURSOR_COLOR: 112,
    SEMANTIC_PROMPT: 133,
    GHOSTTY: 777,
    TAB_STATUS: 21337
  };
  LINK_END = osc(OSC2.HYPERLINK, "", "");
  ITERM2 = {
    NOTIFY: 0,
    BADGE: 2,
    PROGRESS: 4
  };
  PROGRESS = {
    CLEAR: 0,
    SET: 1,
    ERROR: 2,
    INDETERMINATE: 3
  };
  CLEAR_ITERM2_PROGRESS = `${OSC_PREFIX}${OSC2.ITERM2};${ITERM2.PROGRESS};${PROGRESS.CLEAR};${BEL}`;
  CLEAR_TERMINAL_TITLE = `${OSC_PREFIX}${OSC2.SET_TITLE_AND_ICON};${BEL}`;
  CLEAR_TAB_STATUS = osc(OSC2.TAB_STATUS, "indicator=;status=;status-color=");
});

// packages/@ant/ink/src/core/terminal.ts
function isProgressReportingAvailable() {
  if (!process.stdout.isTTY) {
    return false;
  }
  if (process.env.WT_SESSION) {
    return false;
  }
  if (process.env.ConEmuANSI || process.env.ConEmuPID || process.env.ConEmuTask) {
    return true;
  }
  const version = import_semver.coerce(process.env.TERM_PROGRAM_VERSION);
  if (!version) {
    return false;
  }
  if (process.env.TERM_PROGRAM === "ghostty") {
    return import_semver.gte(version.version, "1.2.0");
  }
  if (process.env.TERM_PROGRAM === "iTerm.app") {
    return import_semver.gte(version.version, "3.6.6");
  }
  return false;
}
function isSynchronizedOutputSupported() {
  if (process.env.TMUX)
    return false;
  const termProgram = process.env.TERM_PROGRAM;
  const term = process.env.TERM;
  if (termProgram === "iTerm.app" || termProgram === "WezTerm" || termProgram === "WarpTerminal" || termProgram === "ghostty" || termProgram === "contour" || termProgram === "vscode" || termProgram === "alacritty") {
    return true;
  }
  if (term?.includes("kitty") || process.env.KITTY_WINDOW_ID)
    return true;
  if (term === "xterm-ghostty")
    return true;
  if (term?.startsWith("foot"))
    return true;
  if (term?.includes("alacritty"))
    return true;
  if (process.env.ZED_TERM)
    return true;
  if (process.env.WT_SESSION)
    return true;
  const vteVersion = process.env.VTE_VERSION;
  if (vteVersion) {
    const version = parseInt(vteVersion, 10);
    if (version >= 6800)
      return true;
  }
  return false;
}
function setXtversionName(name) {
  if (xtversionName === undefined)
    xtversionName = name;
}
function isXtermJs() {
  if (process.env.TERM_PROGRAM === "vscode")
    return true;
  return xtversionName?.startsWith("xterm.js") ?? false;
}
function supportsExtendedKeys() {
  return EXTENDED_KEYS_TERMINALS.includes(process.env.TERM_PROGRAM ?? "");
}
function hasCursorUpViewportYankBug() {
  return process.platform === "win32" || !!process.env.WT_SESSION;
}
function writeDiffToTerminal(terminal, diff2, skipSyncMarkers = false) {
  if (diff2.length === 0) {
    return;
  }
  const useSync = !skipSyncMarkers;
  let buffer = useSync ? BSU : "";
  for (const patch of diff2) {
    switch (patch.type) {
      case "stdout":
        buffer += patch.content;
        break;
      case "clear":
        if (patch.count > 0) {
          buffer += eraseLines(patch.count);
        }
        break;
      case "clearTerminal":
        buffer += getClearTerminalSequence();
        break;
      case "cursorHide":
        buffer += HIDE_CURSOR;
        break;
      case "cursorShow":
        buffer += SHOW_CURSOR;
        break;
      case "cursorMove":
        buffer += cursorMove(patch.x, patch.y);
        break;
      case "cursorTo":
        buffer += cursorTo(patch.col);
        break;
      case "carriageReturn":
        buffer += "\r";
        break;
      case "hyperlink":
        buffer += link(patch.uri);
        break;
      case "styleStr":
        buffer += patch.str;
        break;
    }
  }
  if (useSync)
    buffer += ESU;
  terminal.stdout.write(buffer);
}
var import_semver, xtversionName, EXTENDED_KEYS_TERMINALS, SYNC_OUTPUT_SUPPORTED;
var init_terminal = __esm(() => {
  init_clearTerminal();
  init_csi();
  init_dec();
  init_osc();
  import_semver = __toESM(require_semver(), 1);
  EXTENDED_KEYS_TERMINALS = [
    "iTerm.app",
    "kitty",
    "WezTerm",
    "ghostty",
    "tmux",
    "windows-terminal"
  ];
  SYNC_OUTPUT_SUPPORTED = isSynchronizedOutputSupported();
});

// packages/@ant/ink/src/core/terminal-focus-state.ts
function setTerminalFocused(v) {
  focusState = v ? "focused" : "blurred";
  for (const cb of subscribers) {
    cb();
  }
  if (!v) {
    for (const resolve of resolvers) {
      resolve();
    }
    resolvers.clear();
  }
}
function getTerminalFocused() {
  return focusState !== "blurred";
}
function getTerminalFocusState() {
  return focusState;
}
function subscribeTerminalFocus(cb) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}
var focusState = "unknown", resolvers, subscribers;
var init_terminal_focus_state = __esm(() => {
  resolvers = new Set;
  subscribers = new Set;
});

// packages/@ant/ink/src/core/terminal-querier.ts
function xtversion() {
  return {
    request: csi(">0q"),
    match: (r) => r.type === "xtversion"
  };
}

class TerminalQuerier {
  stdout;
  queue = [];
  constructor(stdout) {
    this.stdout = stdout;
  }
  send(query) {
    return new Promise((resolve) => {
      this.queue.push({
        kind: "query",
        match: query.match,
        resolve: (r) => resolve(r)
      });
      this.stdout.write(query.request);
    });
  }
  flush() {
    return new Promise((resolve) => {
      this.queue.push({ kind: "sentinel", resolve });
      this.stdout.write(SENTINEL);
    });
  }
  onResponse(r) {
    const idx = this.queue.findIndex((p) => p.kind === "query" && p.match(r));
    if (idx !== -1) {
      const [q] = this.queue.splice(idx, 1);
      if (q?.kind === "query")
        q.resolve(r);
      return;
    }
    if (r.type === "da1") {
      const s = this.queue.findIndex((p) => p.kind === "sentinel");
      if (s === -1)
        return;
      for (const p of this.queue.splice(0, s + 1)) {
        if (p.kind === "query")
          p.resolve(undefined);
        else
          p.resolve();
      }
    }
  }
}
var SENTINEL;
var init_terminal_querier = __esm(() => {
  init_csi();
  init_osc();
  SENTINEL = csi("c");
});

// packages/@ant/ink/src/components/AppContext.ts
var import_react, AppContext, AppContext_default;
var init_AppContext = __esm(() => {
  import_react = __toESM(require_react(), 1);
  AppContext = import_react.createContext({
    exit() {}
  });
  AppContext.displayName = "InternalAppContext";
  AppContext_default = AppContext;
});

// packages/@ant/ink/src/core/constants.ts
var FRAME_INTERVAL_MS = 16;
var init_constants = () => {};

// packages/@ant/ink/src/components/TerminalFocusContext.tsx
function TerminalFocusProvider({ children }) {
  const isTerminalFocused = import_react2.useSyncExternalStore(subscribeTerminalFocus, getTerminalFocused);
  const terminalFocusState = import_react2.useSyncExternalStore(subscribeTerminalFocus, getTerminalFocusState);
  const value = import_react2.useMemo(() => ({ isTerminalFocused, terminalFocusState }), [isTerminalFocused, terminalFocusState]);
  return /* @__PURE__ */ jsx_runtime.jsx(TerminalFocusContext.Provider, {
    value,
    children
  });
}
var import_react2, jsx_runtime, TerminalFocusContext, TerminalFocusContext_default;
var init_TerminalFocusContext = __esm(() => {
  init_terminal_focus_state();
  import_react2 = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  TerminalFocusContext = import_react2.createContext({
    isTerminalFocused: true,
    terminalFocusState: "unknown"
  });
  TerminalFocusContext.displayName = "TerminalFocusContext";
  TerminalFocusContext_default = TerminalFocusContext;
});

// packages/@ant/ink/src/hooks/use-terminal-focus.ts
function useTerminalFocus() {
  const { isTerminalFocused } = import_react3.useContext(TerminalFocusContext_default);
  return isTerminalFocused;
}
var import_react3;
var init_use_terminal_focus = __esm(() => {
  init_TerminalFocusContext();
  import_react3 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/components/ClockContext.tsx
function createClock(tickIntervalMs) {
  const subscribers2 = new Map;
  let interval = null;
  let currentTickIntervalMs = tickIntervalMs;
  let startTime2 = 0;
  let tickTime = 0;
  function tick() {
    tickTime = Date.now() - startTime2;
    for (const onChange of subscribers2.keys()) {
      onChange();
    }
  }
  function updateInterval() {
    const anyKeepAlive = [...subscribers2.values()].some(Boolean);
    if (anyKeepAlive) {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      if (startTime2 === 0) {
        startTime2 = Date.now();
      }
      interval = setInterval(tick, currentTickIntervalMs);
    } else if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }
  return {
    subscribe(onChange, keepAlive) {
      subscribers2.set(onChange, keepAlive);
      updateInterval();
      return () => {
        subscribers2.delete(onChange);
        updateInterval();
      };
    },
    now() {
      if (startTime2 === 0) {
        startTime2 = Date.now();
      }
      if (interval && tickTime) {
        return tickTime;
      }
      return Date.now() - startTime2;
    },
    setTickInterval(ms) {
      if (ms === currentTickIntervalMs)
        return;
      currentTickIntervalMs = ms;
      updateInterval();
    }
  };
}
function ClockProvider({ children }) {
  const [clock] = import_react4.useState(() => createClock(FRAME_INTERVAL_MS));
  const focused = useTerminalFocus();
  import_react4.useEffect(() => {
    clock.setTickInterval(focused ? FRAME_INTERVAL_MS : BLURRED_TICK_INTERVAL_MS);
  }, [clock, focused]);
  return /* @__PURE__ */ jsx_runtime2.jsx(ClockContext.Provider, {
    value: clock,
    children
  });
}
var import_react4, jsx_runtime2, ClockContext, BLURRED_TICK_INTERVAL_MS;
var init_ClockContext = __esm(() => {
  init_constants();
  init_use_terminal_focus();
  import_react4 = __toESM(require_react(), 1);
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
  ClockContext = import_react4.createContext(null);
  BLURRED_TICK_INTERVAL_MS = FRAME_INTERVAL_MS * 2;
});

// packages/@ant/ink/src/components/CursorDeclarationContext.ts
var import_react5, CursorDeclarationContext, CursorDeclarationContext_default;
var init_CursorDeclarationContext = __esm(() => {
  import_react5 = __toESM(require_react(), 1);
  CursorDeclarationContext = import_react5.createContext(() => {});
  CursorDeclarationContext_default = CursorDeclarationContext;
});

// node_modules/.bun/convert-to-spaces@2.0.1/node_modules/convert-to-spaces/dist/index.js
var convertToSpaces = (input, spaces = 2) => {
  return input.replace(/^\t+/gm, ($1) => " ".repeat($1.length * spaces));
}, dist_default;
var init_dist = __esm(() => {
  dist_default = convertToSpaces;
});

// node_modules/.bun/code-excerpt@4.0.0/node_modules/code-excerpt/dist/index.js
var generateLineNumbers = (line, around) => {
  const lineNumbers = [];
  const min = line - around;
  const max = line + around;
  for (let lineNumber = min;lineNumber <= max; lineNumber++) {
    lineNumbers.push(lineNumber);
  }
  return lineNumbers;
}, codeExcerpt = (source, line, options = {}) => {
  var _a;
  if (typeof source !== "string") {
    throw new TypeError("Source code is missing.");
  }
  if (!line || line < 1) {
    throw new TypeError("Line number must start from `1`.");
  }
  const lines = dist_default(source).split(/\r?\n/);
  if (line > lines.length) {
    return;
  }
  return generateLineNumbers(line, (_a = options.around) !== null && _a !== undefined ? _a : 3).filter((line2) => lines[line2 - 1] !== undefined).map((line2) => ({ line: line2, value: lines[line2 - 1] }));
}, dist_default2;
var init_dist2 = __esm(() => {
  init_dist();
  dist_default2 = codeExcerpt;
});

// node_modules/.bun/escape-string-regexp@2.0.0/node_modules/escape-string-regexp/index.js
var require_escape_string_regexp = __commonJS((exports, module) => {
  var matchOperatorsRegex = /[|\\{}()[\]^$+*?.-]/g;
  module.exports = (string) => {
    if (typeof string !== "string") {
      throw new TypeError("Expected a string");
    }
    return string.replace(matchOperatorsRegex, "\\$&");
  };
});

// node_modules/.bun/stack-utils@2.0.6/node_modules/stack-utils/index.js
var require_stack_utils = __commonJS((exports, module) => {
  var escapeStringRegexp = require_escape_string_regexp();
  var cwd = typeof process === "object" && process && typeof process.cwd === "function" ? process.cwd() : ".";
  var natives = [].concat(__require("module").builtinModules, "bootstrap_node", "node").map((n) => new RegExp(`(?:\\((?:node:)?${n}(?:\\.js)?:\\d+:\\d+\\)$|^\\s*at (?:node:)?${n}(?:\\.js)?:\\d+:\\d+$)`));
  natives.push(/\((?:node:)?internal\/[^:]+:\d+:\d+\)$/, /\s*at (?:node:)?internal\/[^:]+:\d+:\d+$/, /\/\.node-spawn-wrap-\w+-\w+\/node:\d+:\d+\)?$/);

  class StackUtils {
    constructor(opts) {
      opts = {
        ignoredPackages: [],
        ...opts
      };
      if ("internals" in opts === false) {
        opts.internals = StackUtils.nodeInternals();
      }
      if ("cwd" in opts === false) {
        opts.cwd = cwd;
      }
      this._cwd = opts.cwd.replace(/\\/g, "/");
      this._internals = [].concat(opts.internals, ignoredPackagesRegExp(opts.ignoredPackages));
      this._wrapCallSite = opts.wrapCallSite || false;
    }
    static nodeInternals() {
      return [...natives];
    }
    clean(stack, indent = 0) {
      indent = " ".repeat(indent);
      if (!Array.isArray(stack)) {
        stack = stack.split(`
`);
      }
      if (!/^\s*at /.test(stack[0]) && /^\s*at /.test(stack[1])) {
        stack = stack.slice(1);
      }
      let outdent = false;
      let lastNonAtLine = null;
      const result = [];
      stack.forEach((st) => {
        st = st.replace(/\\/g, "/");
        if (this._internals.some((internal) => internal.test(st))) {
          return;
        }
        const isAtLine = /^\s*at /.test(st);
        if (outdent) {
          st = st.trimEnd().replace(/^(\s+)at /, "$1");
        } else {
          st = st.trim();
          if (isAtLine) {
            st = st.slice(3);
          }
        }
        st = st.replace(`${this._cwd}/`, "");
        if (st) {
          if (isAtLine) {
            if (lastNonAtLine) {
              result.push(lastNonAtLine);
              lastNonAtLine = null;
            }
            result.push(st);
          } else {
            outdent = true;
            lastNonAtLine = st;
          }
        }
      });
      return result.map((line) => `${indent}${line}
`).join("");
    }
    captureString(limit, fn = this.captureString) {
      if (typeof limit === "function") {
        fn = limit;
        limit = Infinity;
      }
      const { stackTraceLimit } = Error;
      if (limit) {
        Error.stackTraceLimit = limit;
      }
      const obj = {};
      Error.captureStackTrace(obj, fn);
      const { stack } = obj;
      Error.stackTraceLimit = stackTraceLimit;
      return this.clean(stack);
    }
    capture(limit, fn = this.capture) {
      if (typeof limit === "function") {
        fn = limit;
        limit = Infinity;
      }
      const { prepareStackTrace, stackTraceLimit } = Error;
      Error.prepareStackTrace = (obj2, site) => {
        if (this._wrapCallSite) {
          return site.map(this._wrapCallSite);
        }
        return site;
      };
      if (limit) {
        Error.stackTraceLimit = limit;
      }
      const obj = {};
      Error.captureStackTrace(obj, fn);
      const { stack } = obj;
      Object.assign(Error, { prepareStackTrace, stackTraceLimit });
      return stack;
    }
    at(fn = this.at) {
      const [site] = this.capture(1, fn);
      if (!site) {
        return {};
      }
      const res = {
        line: site.getLineNumber(),
        column: site.getColumnNumber()
      };
      setFile(res, site.getFileName(), this._cwd);
      if (site.isConstructor()) {
        Object.defineProperty(res, "constructor", {
          value: true,
          configurable: true
        });
      }
      if (site.isEval()) {
        res.evalOrigin = site.getEvalOrigin();
      }
      if (site.isNative()) {
        res.native = true;
      }
      let typename;
      try {
        typename = site.getTypeName();
      } catch (_) {}
      if (typename && typename !== "Object" && typename !== "[object Object]") {
        res.type = typename;
      }
      const fname = site.getFunctionName();
      if (fname) {
        res.function = fname;
      }
      const meth = site.getMethodName();
      if (meth && fname !== meth) {
        res.method = meth;
      }
      return res;
    }
    parseLine(line) {
      const match = line && line.match(re);
      if (!match) {
        return null;
      }
      const ctor = match[1] === "new";
      let fname = match[2];
      const evalOrigin = match[3];
      const evalFile = match[4];
      const evalLine = Number(match[5]);
      const evalCol = Number(match[6]);
      let file = match[7];
      const lnum = match[8];
      const col = match[9];
      const native = match[10] === "native";
      const closeParen = match[11] === ")";
      let method;
      const res = {};
      if (lnum) {
        res.line = Number(lnum);
      }
      if (col) {
        res.column = Number(col);
      }
      if (closeParen && file) {
        let closes = 0;
        for (let i = file.length - 1;i > 0; i--) {
          if (file.charAt(i) === ")") {
            closes++;
          } else if (file.charAt(i) === "(" && file.charAt(i - 1) === " ") {
            closes--;
            if (closes === -1 && file.charAt(i - 1) === " ") {
              const before = file.slice(0, i - 1);
              const after = file.slice(i + 1);
              file = after;
              fname += ` (${before}`;
              break;
            }
          }
        }
      }
      if (fname) {
        const methodMatch = fname.match(methodRe);
        if (methodMatch) {
          fname = methodMatch[1];
          method = methodMatch[2];
        }
      }
      setFile(res, file, this._cwd);
      if (ctor) {
        Object.defineProperty(res, "constructor", {
          value: true,
          configurable: true
        });
      }
      if (evalOrigin) {
        res.evalOrigin = evalOrigin;
        res.evalLine = evalLine;
        res.evalColumn = evalCol;
        res.evalFile = evalFile && evalFile.replace(/\\/g, "/");
      }
      if (native) {
        res.native = true;
      }
      if (fname) {
        res.function = fname;
      }
      if (method && fname !== method) {
        res.method = method;
      }
      return res;
    }
  }
  function setFile(result, filename, cwd2) {
    if (filename) {
      filename = filename.replace(/\\/g, "/");
      if (filename.startsWith(`${cwd2}/`)) {
        filename = filename.slice(cwd2.length + 1);
      }
      result.file = filename;
    }
  }
  function ignoredPackagesRegExp(ignoredPackages) {
    if (ignoredPackages.length === 0) {
      return [];
    }
    const packages = ignoredPackages.map((mod) => escapeStringRegexp(mod));
    return new RegExp(`[/\\\\]node_modules[/\\\\](?:${packages.join("|")})[/\\\\][^:]+:\\d+:\\d+`);
  }
  var re = new RegExp("^" + "(?:\\s*at )?" + "(?:(new) )?" + "(?:(.*?) \\()?" + "(?:eval at ([^ ]+) \\((.+?):(\\d+):(\\d+)\\), )?" + "(?:(.+?):(\\d+):(\\d+)|(native))" + "(\\)?)$");
  var methodRe = /^(.*?) \[as (.*?)\]$/;
  module.exports = StackUtils;
});

// packages/@ant/ink/src/components/Box.tsx
function Box({
  children,
  flexWrap = "nowrap",
  flexDirection = "row",
  flexGrow = 0,
  flexShrink = 1,
  ref,
  tabIndex,
  autoFocus,
  onClick,
  onFocus,
  onFocusCapture,
  onBlur,
  onBlurCapture,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
  onKeyDownCapture,
  ...style
}) {
  ifNotInteger(style.margin, "margin");
  ifNotInteger(style.marginX, "marginX");
  ifNotInteger(style.marginY, "marginY");
  ifNotInteger(style.marginTop, "marginTop");
  ifNotInteger(style.marginBottom, "marginBottom");
  ifNotInteger(style.marginLeft, "marginLeft");
  ifNotInteger(style.marginRight, "marginRight");
  ifNotInteger(style.padding, "padding");
  ifNotInteger(style.paddingX, "paddingX");
  ifNotInteger(style.paddingY, "paddingY");
  ifNotInteger(style.paddingTop, "paddingTop");
  ifNotInteger(style.paddingBottom, "paddingBottom");
  ifNotInteger(style.paddingLeft, "paddingLeft");
  ifNotInteger(style.paddingRight, "paddingRight");
  ifNotInteger(style.gap, "gap");
  ifNotInteger(style.columnGap, "columnGap");
  ifNotInteger(style.rowGap, "rowGap");
  return /* @__PURE__ */ jsx_runtime3.jsx("ink-box", {
    ref,
    tabIndex,
    autoFocus,
    onClick,
    onFocus,
    onFocusCapture,
    onBlur,
    onBlurCapture,
    onMouseEnter,
    onMouseLeave,
    onKeyDown,
    onKeyDownCapture,
    style: {
      flexWrap,
      flexDirection,
      flexGrow,
      flexShrink,
      ...style,
      overflowX: style.overflowX ?? style.overflow ?? "visible",
      overflowY: style.overflowY ?? style.overflow ?? "visible"
    },
    children
  });
}
var jsx_runtime3, Box_default;
var init_Box = __esm(() => {
  init_warn();
  jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
  Box_default = Box;
});

// packages/@ant/ink/src/components/Text.tsx
function Text({
  color,
  backgroundColor,
  bold,
  dim,
  italic = false,
  underline = false,
  strikethrough = false,
  inverse = false,
  wrap = "wrap",
  children
}) {
  if (children === undefined || children === null) {
    return null;
  }
  const textStyles = {
    ...color && { color },
    ...backgroundColor && { backgroundColor },
    ...dim && { dim },
    ...bold && { bold },
    ...italic && { italic },
    ...underline && { underline },
    ...strikethrough && { strikethrough },
    ...inverse && { inverse }
  };
  return /* @__PURE__ */ jsx_runtime4.jsx("ink-text", {
    style: memoizedStylesForWrap[wrap],
    textStyles,
    children
  });
}
var jsx_runtime4, memoizedStylesForWrap;
var init_Text = __esm(() => {
  jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
  memoizedStylesForWrap = {
    wrap: {
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: "row",
      textWrap: "wrap"
    },
    "wrap-trim": {
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: "row",
      textWrap: "wrap-trim"
    },
    end: {
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: "row",
      textWrap: "end"
    },
    middle: {
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: "row",
      textWrap: "middle"
    },
    "truncate-end": {
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: "row",
      textWrap: "truncate-end"
    },
    truncate: {
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: "row",
      textWrap: "truncate"
    },
    "truncate-middle": {
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: "row",
      textWrap: "truncate-middle"
    },
    "truncate-start": {
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: "row",
      textWrap: "truncate-start"
    }
  };
});

// packages/@ant/ink/src/components/ErrorOverview.tsx
import { readFileSync } from "fs";
function getStackUtils() {
  return stackUtils ??= new import_stack_utils.default({
    cwd: process.cwd(),
    internals: import_stack_utils.default.nodeInternals()
  });
}
function ErrorOverview({ error }) {
  const stack = error.stack ? error.stack.split(`
`).slice(1) : undefined;
  const origin = stack ? getStackUtils().parseLine(stack[0]) : undefined;
  const filePath = cleanupPath(origin?.file);
  let excerpt;
  let lineWidth2 = 0;
  if (filePath && origin?.line) {
    try {
      const sourceCode = readFileSync(filePath, "utf8");
      excerpt = dist_default2(sourceCode, origin.line);
      if (excerpt) {
        for (const { line } of excerpt) {
          lineWidth2 = Math.max(lineWidth2, String(line).length);
        }
      }
    } catch {}
  }
  return /* @__PURE__ */ jsx_runtime5.jsxs(Box_default, {
    flexDirection: "column",
    padding: 1,
    children: [
      /* @__PURE__ */ jsx_runtime5.jsxs(Box_default, {
        children: [
          /* @__PURE__ */ jsx_runtime5.jsxs(Text, {
            backgroundColor: "ansi:red",
            color: "ansi:white",
            children: [
              " ",
              "ERROR",
              " "
            ]
          }),
          /* @__PURE__ */ jsx_runtime5.jsxs(Text, {
            children: [
              " ",
              error.message
            ]
          })
        ]
      }),
      origin && filePath && /* @__PURE__ */ jsx_runtime5.jsx(Box_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_runtime5.jsxs(Text, {
          dim: true,
          children: [
            filePath,
            ":",
            origin.line,
            ":",
            origin.column
          ]
        })
      }),
      origin && excerpt && /* @__PURE__ */ jsx_runtime5.jsx(Box_default, {
        marginTop: 1,
        flexDirection: "column",
        children: excerpt.map(({ line, value }) => /* @__PURE__ */ jsx_runtime5.jsxs(Box_default, {
          children: [
            /* @__PURE__ */ jsx_runtime5.jsx(Box_default, {
              width: lineWidth2 + 1,
              children: /* @__PURE__ */ jsx_runtime5.jsxs(Text, {
                dim: line !== origin.line,
                backgroundColor: line === origin.line ? "ansi:red" : undefined,
                color: line === origin.line ? "ansi:white" : undefined,
                children: [
                  String(line).padStart(lineWidth2, " "),
                  ":"
                ]
              })
            }),
            /* @__PURE__ */ jsx_runtime5.jsx(Text, {
              backgroundColor: line === origin.line ? "ansi:red" : undefined,
              color: line === origin.line ? "ansi:white" : undefined,
              children: " " + value
            }, line)
          ]
        }, line))
      }),
      error.stack && /* @__PURE__ */ jsx_runtime5.jsx(Box_default, {
        marginTop: 1,
        flexDirection: "column",
        children: error.stack.split(`
`).slice(1).map((line) => {
          const parsedLine = getStackUtils().parseLine(line);
          if (!parsedLine) {
            return /* @__PURE__ */ jsx_runtime5.jsxs(Box_default, {
              children: [
                /* @__PURE__ */ jsx_runtime5.jsx(Text, {
                  dim: true,
                  children: "- "
                }),
                /* @__PURE__ */ jsx_runtime5.jsx(Text, {
                  bold: true,
                  children: line
                })
              ]
            }, line);
          }
          return /* @__PURE__ */ jsx_runtime5.jsxs(Box_default, {
            children: [
              /* @__PURE__ */ jsx_runtime5.jsx(Text, {
                dim: true,
                children: "- "
              }),
              /* @__PURE__ */ jsx_runtime5.jsx(Text, {
                bold: true,
                children: parsedLine.function
              }),
              /* @__PURE__ */ jsx_runtime5.jsxs(Text, {
                dim: true,
                children: [
                  " ",
                  "(",
                  cleanupPath(parsedLine.file) ?? "",
                  ":",
                  parsedLine.line,
                  ":",
                  parsedLine.column,
                  ")"
                ]
              })
            ]
          }, line);
        })
      })
    ]
  });
}
var import_stack_utils, jsx_runtime5, cleanupPath = (path) => {
  return path?.replace(`file://${process.cwd()}/`, "");
}, stackUtils;
var init_ErrorOverview = __esm(() => {
  init_dist2();
  init_Box();
  init_Text();
  import_stack_utils = __toESM(require_stack_utils(), 1);
  jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/components/StdinContext.ts
var import_react6, StdinContext, StdinContext_default;
var init_StdinContext = __esm(() => {
  init_emitter();
  import_react6 = __toESM(require_react(), 1);
  StdinContext = import_react6.createContext({
    stdin: process.stdin,
    internal_eventEmitter: new EventEmitter,
    setRawMode() {},
    isRawModeSupported: false,
    internal_exitOnCtrlC: true,
    internal_querier: null
  });
  StdinContext.displayName = "InternalStdinContext";
  StdinContext_default = StdinContext;
});

// packages/@ant/ink/src/components/TerminalSizeContext.tsx
var import_react7, TerminalSizeContext;
var init_TerminalSizeContext = __esm(() => {
  import_react7 = __toESM(require_react(), 1);
  TerminalSizeContext = import_react7.createContext(null);
});

// packages/@ant/ink/src/components/App.tsx
function isEnvTruthy(value) {
  return value === "1" || value === "true";
}
function processKeysInBatch(app, items, _unused1, _unused2) {
  if (items.some((i) => i.kind === "key" || i.kind === "mouse" && !((i.button & 32) !== 0 && (i.button & 3) === 3))) {
    defaultCallbacks.updateLastInteractionTime();
  }
  for (const item of items) {
    if (item.kind === "response") {
      app.querier.onResponse(item.response);
      continue;
    }
    if (item.kind === "mouse") {
      handleMouseEvent(app, item);
      continue;
    }
    const sequence = item.sequence;
    if (sequence === FOCUS_IN) {
      app.handleTerminalFocus(true);
      const event2 = new TerminalFocusEvent("terminalfocus");
      app.internal_eventEmitter.emit("terminalfocus", event2);
      continue;
    }
    if (sequence === FOCUS_OUT) {
      app.handleTerminalFocus(false);
      if (app.props.selection.isDragging) {
        finishSelection(app.props.selection);
        app.props.onSelectionChange();
      }
      const event2 = new TerminalFocusEvent("terminalblur");
      app.internal_eventEmitter.emit("terminalblur", event2);
      continue;
    }
    if (!getTerminalFocused()) {
      setTerminalFocused(true);
    }
    if (item.name === "z" && item.ctrl && SUPPORTS_SUSPEND) {
      app.handleSuspend();
      continue;
    }
    app.handleInput(sequence);
    const event = new InputEvent(item);
    app.internal_eventEmitter.emit("input", event);
    app.props.dispatchKeyboardEvent(item);
  }
}
function handleMouseEvent(app, m) {
  if (defaultCallbacks.isMouseClicksDisabled())
    return;
  const sel = app.props.selection;
  const col = m.col - 1;
  const row = m.row - 1;
  const baseButton = m.button & 3;
  if (m.action === "press") {
    if ((m.button & 32) !== 0 && baseButton === 3) {
      if (sel.isDragging) {
        finishSelection(sel);
        app.props.onSelectionChange();
      }
      if (col === app.lastHoverCol && row === app.lastHoverRow)
        return;
      app.lastHoverCol = col;
      app.lastHoverRow = row;
      app.props.onHoverAt(col, row);
      return;
    }
    if (baseButton !== 0) {
      app.clickCount = 0;
      return;
    }
    if ((m.button & 32) !== 0) {
      app.props.onSelectionDrag(col, row);
      return;
    }
    if (sel.isDragging) {
      finishSelection(sel);
      app.props.onSelectionChange();
    }
    const now2 = Date.now();
    const nearLast = now2 - app.lastClickTime < MULTI_CLICK_TIMEOUT_MS && Math.abs(col - app.lastClickCol) <= MULTI_CLICK_DISTANCE && Math.abs(row - app.lastClickRow) <= MULTI_CLICK_DISTANCE;
    app.clickCount = nearLast ? app.clickCount + 1 : 1;
    app.lastClickTime = now2;
    app.lastClickCol = col;
    app.lastClickRow = row;
    if (app.clickCount >= 2) {
      if (app.pendingHyperlinkTimer) {
        clearTimeout(app.pendingHyperlinkTimer);
        app.pendingHyperlinkTimer = null;
      }
      const count = app.clickCount === 2 ? 2 : 3;
      app.props.onMultiClick(col, row, count);
      return;
    }
    startSelection(sel, col, row);
    sel.lastPressHadAlt = (m.button & 8) !== 0;
    app.props.onSelectionChange();
    return;
  }
  if (baseButton !== 0) {
    if (!sel.isDragging)
      return;
    finishSelection(sel);
    app.props.onSelectionChange();
    return;
  }
  finishSelection(sel);
  if (!hasSelection(sel) && sel.anchor) {
    if (!app.props.onClickAt(col, row)) {
      const url = app.props.getHyperlinkAt(col, row);
      if (url && process.env.TERM_PROGRAM !== "vscode" && !isXtermJs()) {
        if (app.pendingHyperlinkTimer) {
          clearTimeout(app.pendingHyperlinkTimer);
        }
        app.pendingHyperlinkTimer = setTimeout((app2, url2) => {
          app2.pendingHyperlinkTimer = null;
          app2.props.onOpenHyperlink(url2);
        }, MULTI_CLICK_TIMEOUT_MS, app, url);
      }
    }
  }
  app.props.onSelectionChange();
}
var import_react8, jsx_runtime6, defaultCallbacks, SUPPORTS_SUSPEND, STDIN_RESUME_GAP_MS = 5000, MULTI_CLICK_TIMEOUT_MS = 500, MULTI_CLICK_DISTANCE = 1, App;
var init_App = __esm(() => {
  init_emitter();
  init_input_event();
  init_terminal_focus_event();
  init_parse_keypress();
  init_reconciler();
  init_selection();
  init_terminal();
  init_terminal_focus_state();
  init_terminal_querier();
  init_csi();
  init_dec();
  init_AppContext();
  init_ClockContext();
  init_CursorDeclarationContext();
  init_ErrorOverview();
  init_StdinContext();
  init_TerminalFocusContext();
  init_TerminalSizeContext();
  import_react8 = __toESM(require_react(), 1);
  jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
  defaultCallbacks = {
    updateLastInteractionTime: () => {},
    stopCapturingEarlyInput: () => {},
    isMouseClicksDisabled: () => false,
    logError: (error) => console.error(error),
    logForDebugging: (_message, _opts) => {}
  };
  SUPPORTS_SUSPEND = process.platform !== "win32";
  App = class App extends import_react8.PureComponent {
    static displayName = "InternalApp";
    static getDerivedStateFromError(error) {
      return { error: { message: error.message, stack: error.stack } };
    }
    state = {
      error: undefined
    };
    rawModeEnabledCount = 0;
    internal_eventEmitter = new EventEmitter;
    keyParseState = INITIAL_STATE;
    incompleteEscapeTimer = null;
    NORMAL_TIMEOUT = 50;
    PASTE_TIMEOUT = 500;
    querier = new TerminalQuerier(this.props.stdout);
    lastClickTime = 0;
    lastClickCol = -1;
    lastClickRow = -1;
    clickCount = 0;
    pendingHyperlinkTimer = null;
    lastHoverCol = -1;
    lastHoverRow = -1;
    lastStdinTime = Date.now();
    isRawModeSupported() {
      return this.props.stdin.isTTY;
    }
    render() {
      return /* @__PURE__ */ jsx_runtime6.jsx(TerminalSizeContext.Provider, {
        value: {
          columns: this.props.terminalColumns,
          rows: this.props.terminalRows
        },
        children: /* @__PURE__ */ jsx_runtime6.jsx(AppContext_default.Provider, {
          value: {
            exit: this.handleExit
          },
          children: /* @__PURE__ */ jsx_runtime6.jsx(StdinContext_default.Provider, {
            value: {
              stdin: this.props.stdin,
              setRawMode: this.handleSetRawMode,
              isRawModeSupported: this.isRawModeSupported(),
              internal_exitOnCtrlC: this.props.exitOnCtrlC,
              internal_eventEmitter: this.internal_eventEmitter,
              internal_querier: this.querier
            },
            children: /* @__PURE__ */ jsx_runtime6.jsx(TerminalFocusProvider, {
              children: /* @__PURE__ */ jsx_runtime6.jsx(ClockProvider, {
                children: /* @__PURE__ */ jsx_runtime6.jsx(CursorDeclarationContext_default.Provider, {
                  value: this.props.onCursorDeclaration ?? (() => {}),
                  children: this.state.error ? /* @__PURE__ */ jsx_runtime6.jsx(ErrorOverview, {
                    error: this.state.error
                  }) : this.props.children
                })
              })
            })
          })
        })
      });
    }
    componentDidMount() {
      if (this.props.stdout.isTTY && !isEnvTruthy(process.env.CLAUDE_CODE_ACCESSIBILITY)) {
        this.props.stdout.write(HIDE_CURSOR);
      }
    }
    componentWillUnmount() {
      if (this.props.stdout.isTTY) {
        this.props.stdout.write(SHOW_CURSOR);
      }
      if (this.incompleteEscapeTimer) {
        clearTimeout(this.incompleteEscapeTimer);
        this.incompleteEscapeTimer = null;
      }
      if (this.pendingHyperlinkTimer) {
        clearTimeout(this.pendingHyperlinkTimer);
        this.pendingHyperlinkTimer = null;
      }
      if (this.isRawModeSupported()) {
        this.handleSetRawMode(false);
      } else {
        try {
          this.props.stdin.unref();
        } catch {}
      }
    }
    componentDidCatch(error) {
      this.handleExit(error);
    }
    handleSetRawMode = (isEnabled) => {
      const { stdin } = this.props;
      if (!this.isRawModeSupported()) {
        if (stdin === process.stdin) {
          throw new Error(`Raw mode is not supported on the current process.stdin, which Ink uses as input stream by default.
Read about how to prevent this error on https://github.com/vadimdemedes/ink/#israwmodesupported`);
        } else {
          throw new Error(`Raw mode is not supported on the stdin provided to Ink.
Read about how to prevent this error on https://github.com/vadimdemedes/ink/#israwmodesupported`);
        }
      }
      stdin.setEncoding("utf8");
      if (isEnabled) {
        if (this.rawModeEnabledCount === 0) {
          defaultCallbacks.stopCapturingEarlyInput();
          const existingListeners = stdin.listeners("readable");
          for (const listener of existingListeners) {
            if (listener !== this.handleReadable) {
              stdin.removeListener("readable", listener);
            }
          }
          stdin.ref();
          stdin.setRawMode(true);
          stdin.addListener("readable", this.handleReadable);
          this.props.stdout.write(EBP);
          this.props.stdout.write(EFE);
          if (supportsExtendedKeys()) {
            this.props.stdout.write(ENABLE_KITTY_KEYBOARD);
            this.props.stdout.write(ENABLE_MODIFY_OTHER_KEYS);
          }
          setImmediate(() => {
            Promise.all([this.querier.send(xtversion()), this.querier.flush()]).then(([r]) => {
              if (r) {
                setXtversionName(r.name);
                defaultCallbacks.logForDebugging(`XTVERSION: terminal identified as "${r.name}"`);
              } else {
                defaultCallbacks.logForDebugging("XTVERSION: no reply (terminal ignored query)");
              }
            });
          });
        }
        this.rawModeEnabledCount++;
        return;
      }
      if (--this.rawModeEnabledCount === 0) {
        const activeListeners = this.internal_eventEmitter.listenerCount("input");
        if (activeListeners > 0) {
          this.rawModeEnabledCount = activeListeners;
          return;
        }
        this.props.stdout.write(DISABLE_MODIFY_OTHER_KEYS);
        this.props.stdout.write(DISABLE_KITTY_KEYBOARD);
        this.props.stdout.write(DFE);
        this.props.stdout.write(DBP);
        stdin.setRawMode(false);
        stdin.removeListener("readable", this.handleReadable);
        stdin.unref();
      }
    };
    flushIncomplete = () => {
      this.incompleteEscapeTimer = null;
      if (!this.keyParseState.incomplete)
        return;
      if (this.props.stdin.readableLength > 0) {
        this.incompleteEscapeTimer = setTimeout(this.flushIncomplete, this.NORMAL_TIMEOUT);
        return;
      }
      this.processInput(null);
    };
    processInput = (input) => {
      const [keys, newState] = parseMultipleKeypresses(this.keyParseState, input);
      this.keyParseState = newState;
      if (keys.length > 0) {
        reconciler_default.discreteUpdates(processKeysInBatch, this, keys, undefined, undefined);
      }
      if (this.keyParseState.incomplete) {
        if (this.incompleteEscapeTimer) {
          clearTimeout(this.incompleteEscapeTimer);
        }
        this.incompleteEscapeTimer = setTimeout(this.flushIncomplete, this.keyParseState.mode === "IN_PASTE" ? this.PASTE_TIMEOUT : this.NORMAL_TIMEOUT);
      }
    };
    handleReadable = () => {
      const now2 = Date.now();
      if (now2 - this.lastStdinTime > STDIN_RESUME_GAP_MS) {
        this.props.onStdinResume?.();
      }
      this.lastStdinTime = now2;
      try {
        let chunk;
        while ((chunk = this.props.stdin.read()) !== null) {
          this.processInput(chunk);
        }
      } catch (error) {
        defaultCallbacks.logError(error);
        const { stdin } = this.props;
        if (this.rawModeEnabledCount > 0 && !stdin.listeners("readable").includes(this.handleReadable)) {
          defaultCallbacks.logForDebugging("handleReadable: re-attaching stdin readable listener after error recovery", {
            level: "warn"
          });
          stdin.addListener("readable", this.handleReadable);
        }
      }
    };
    handleInput = (input) => {
      if (input === "\x03" && this.props.exitOnCtrlC) {
        this.handleExit();
      }
    };
    handleExit = (error) => {
      if (this.isRawModeSupported()) {
        this.handleSetRawMode(false);
      }
      this.props.onExit(error);
    };
    handleTerminalFocus = (isFocused) => {
      setTerminalFocused(isFocused);
    };
    handleSuspend = () => {
      if (!this.isRawModeSupported()) {
        return;
      }
      const rawModeCountBeforeSuspend = this.rawModeEnabledCount;
      while (this.rawModeEnabledCount > 0) {
        this.handleSetRawMode(false);
      }
      if (this.props.stdout.isTTY) {
        this.props.stdout.write(SHOW_CURSOR + DFE + DISABLE_MOUSE_TRACKING);
      }
      this.internal_eventEmitter.emit("suspend");
      const resumeHandler = () => {
        for (let i = 0;i < rawModeCountBeforeSuspend; i++) {
          if (this.isRawModeSupported()) {
            this.handleSetRawMode(true);
          }
        }
        if (this.props.stdout.isTTY) {
          if (!isEnvTruthy(process.env.CLAUDE_CODE_ACCESSIBILITY)) {
            this.props.stdout.write(HIDE_CURSOR);
          }
          this.props.stdout.write(EFE);
        }
        this.internal_eventEmitter.emit("resume");
        process.removeListener("SIGCONT", resumeHandler);
      };
      process.on("SIGCONT", resumeHandler);
      process.kill(process.pid, "SIGSTOP");
    };
  };
});

// packages/@ant/ink/src/core/events/keyboard-event.ts
function keyFromParsed(parsed) {
  const seq = parsed.sequence ?? "";
  const name = parsed.name ?? "";
  if (parsed.ctrl)
    return name;
  if (seq.length === 1) {
    const code = seq.charCodeAt(0);
    if (code >= 32 && code !== 127)
      return seq;
  }
  return name || seq;
}
var KeyboardEvent;
var init_keyboard_event = __esm(() => {
  init_terminal_event();
  KeyboardEvent = class KeyboardEvent extends TerminalEvent {
    key;
    ctrl;
    shift;
    meta;
    superKey;
    fn;
    constructor(parsedKey) {
      super("keydown", { bubbles: true, cancelable: true });
      this.key = keyFromParsed(parsedKey);
      this.ctrl = parsedKey.ctrl;
      this.shift = parsedKey.shift;
      this.meta = parsedKey.meta || parsedKey.option;
      this.superKey = parsedKey.super;
      this.fn = parsedKey.fn;
    }
  };
});

// packages/@ant/ink/src/core/frame.ts
function emptyFrame(rows, columns, stylePool, charPool, hyperlinkPool) {
  return {
    screen: createScreen(0, 0, stylePool, charPool, hyperlinkPool),
    viewport: { width: columns, height: rows },
    cursor: { x: 0, y: 0, visible: true }
  };
}
var init_frame = __esm(() => {
  init_screen();
});

// packages/@ant/ink/src/core/events/click-event.ts
var ClickEvent;
var init_click_event = __esm(() => {
  init_event();
  ClickEvent = class ClickEvent extends Event {
    col;
    row;
    localCol = 0;
    localRow = 0;
    cellIsBlank;
    constructor(col, row, cellIsBlank) {
      super();
      this.col = col;
      this.row = row;
      this.cellIsBlank = cellIsBlank;
    }
  };
});

// packages/@ant/ink/src/core/events/mouse-action-event.ts
var init_mouse_action_event = __esm(() => {
  init_event();
});

// packages/@ant/ink/src/core/hit-test.ts
function hitTest(node, col, row) {
  const rect = nodeCache.get(node);
  if (!rect)
    return null;
  if (col < rect.x || col >= rect.x + rect.width || row < rect.y || row >= rect.y + rect.height) {
    return null;
  }
  for (let i = node.childNodes.length - 1;i >= 0; i--) {
    const child = node.childNodes[i];
    if (child.nodeName === "#text")
      continue;
    const hit = hitTest(child, col, row);
    if (hit)
      return hit;
  }
  return node;
}
function dispatchClick(root, col, row, cellIsBlank = false) {
  let target = hitTest(root, col, row) ?? undefined;
  if (!target)
    return false;
  if (root.focusManager) {
    let focusTarget = target;
    while (focusTarget) {
      if (typeof focusTarget.attributes["tabIndex"] === "number") {
        root.focusManager.handleClickFocus(focusTarget);
        break;
      }
      focusTarget = focusTarget.parentNode;
    }
  }
  const event = new ClickEvent(col, row, cellIsBlank);
  let handled = false;
  while (target) {
    const handler = target._eventHandlers?.onClick;
    if (handler) {
      handled = true;
      const rect = nodeCache.get(target);
      if (rect) {
        event.localCol = col - rect.x;
        event.localRow = row - rect.y;
      }
      handler(event);
      if (event.didStopImmediatePropagation())
        return true;
    }
    target = target.parentNode;
  }
  return handled;
}
function dispatchHover(root, col, row, hovered) {
  const next = new Set;
  let node = hitTest(root, col, row) ?? undefined;
  while (node) {
    const h = node._eventHandlers;
    if (h?.onMouseEnter || h?.onMouseLeave)
      next.add(node);
    node = node.parentNode;
  }
  for (const old of hovered) {
    if (!next.has(old)) {
      hovered.delete(old);
      if (old.parentNode) {
        old._eventHandlers?.onMouseLeave?.();
      }
    }
  }
  for (const n of next) {
    if (!hovered.has(n)) {
      hovered.add(n);
      n._eventHandlers?.onMouseEnter?.();
    }
  }
}
var init_hit_test = __esm(() => {
  init_click_event();
  init_mouse_action_event();
  init_node_cache();
});

// packages/@ant/ink/src/core/instances.ts
var instances, instances_default;
var init_instances = __esm(() => {
  instances = new Map;
  instances_default = instances;
});

// packages/@ant/ink/src/core/legacyConsole.ts
import { release } from "os";
function isLegacyWindowsBuild(releaseString) {
  const build = Number(releaseString.split(".")[2]);
  return Number.isFinite(build) && build < 17763;
}
function parseLegacyConsoleMode(override, autoDetected) {
  if (override === "0")
    return "off";
  if (override === "2" || override === "always")
    return "always";
  if (override === "1")
    return "periodic";
  return autoDetected ? "periodic" : "off";
}
function parseLegacyConsoleResetMs(raw) {
  if (raw === undefined || raw.trim() === "")
    return 1000;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed))
    return 1000;
  return Math.min(1e4, Math.max(100, Math.floor(parsed)));
}
function legacyConsoleMode() {
  if (cachedMode === undefined) {
    cachedMode = parseLegacyConsoleMode(process.env.CLAUDE_CODE_LEGACY_CONSOLE, process.platform === "win32" && isLegacyWindowsBuild(release()));
  }
  return cachedMode;
}
function isLegacyWindowsConsole() {
  return legacyConsoleMode() !== "off";
}
function legacyConsoleResetMs() {
  if (cachedResetMs === undefined) {
    cachedResetMs = parseLegacyConsoleResetMs(process.env.CLAUDE_CODE_LEGACY_CONSOLE_RESET_MS);
  }
  return cachedResetMs;
}
function effectiveColumns(columns) {
  const cols = columns || 80;
  if (!isLegacyWindowsConsole())
    return cols;
  return Math.max(20, cols - 1);
}
var cachedMode, cachedResetMs;
var init_legacyConsole = () => {};

// packages/@ant/ink/src/core/log-update.ts
class LogUpdate {
  options;
  state;
  lastLegacyReset = 0;
  constructor(options) {
    this.options = options;
    this.state = {
      previousOutput: ""
    };
  }
  renderPreviousOutput_DEPRECATED(prevFrame) {
    if (!this.options.isTTY) {
      return [NEWLINE];
    }
    return this.getRenderOpsForDone(prevFrame);
  }
  reset() {
    this.state.previousOutput = "";
  }
  renderFullFrame(frame) {
    const { screen } = frame;
    const lines = [];
    let currentStyles = [];
    let currentHyperlink;
    for (let y = 0;y < screen.height; y++) {
      let line = "";
      for (let x = 0;x < screen.width; x++) {
        const cell = cellAt(screen, x, y);
        if (cell && cell.width !== 2 /* SpacerTail */) {
          if (cell.hyperlink !== currentHyperlink) {
            if (currentHyperlink !== undefined) {
              line += LINK_END;
            }
            if (cell.hyperlink !== undefined) {
              line += link(cell.hyperlink);
            }
            currentHyperlink = cell.hyperlink;
          }
          const cellStyles = this.options.stylePool.get(cell.styleId);
          const styleDiff = diffAnsiCodes(currentStyles, cellStyles);
          if (styleDiff.length > 0) {
            line += ansiCodesToString(styleDiff);
            currentStyles = cellStyles;
          }
          line += cell.char;
        }
      }
      if (currentHyperlink !== undefined) {
        line += LINK_END;
        currentHyperlink = undefined;
      }
      const resetCodes = diffAnsiCodes(currentStyles, []);
      if (resetCodes.length > 0) {
        line += ansiCodesToString(resetCodes);
        currentStyles = [];
      }
      lines.push(line.trimEnd());
    }
    if (lines.length === 0) {
      return [];
    }
    return [{ type: "stdout", content: lines.join(`
`) }];
  }
  getRenderOpsForDone(prev) {
    this.state.previousOutput = "";
    if (!prev.cursor.visible) {
      return [{ type: "cursorShow" }];
    }
    return [];
  }
  render(prev, next, altScreen = false, decstbmSafe = true) {
    if (!this.options.isTTY) {
      return this.renderFullFrame(next);
    }
    const startTime2 = performance.now();
    const stylePool = this.options.stylePool;
    if (next.viewport.height < prev.viewport.height || prev.viewport.width !== 0 && next.viewport.width !== prev.viewport.width) {
      return fullResetSequence_CAUSES_FLICKER(next, "resize", stylePool);
    }
    if (isLegacyWindowsConsole()) {
      if (legacyConsoleMode() === "always" || startTime2 - this.lastLegacyReset >= legacyConsoleResetMs()) {
        this.lastLegacyReset = startTime2;
        return fullResetSequence_CAUSES_FLICKER(next, "clear", stylePool);
      }
    }
    let scrollPatch = [];
    if (altScreen && next.scrollHint && decstbmSafe) {
      const { top, bottom, delta } = next.scrollHint;
      if (top >= 0 && bottom < prev.screen.height && bottom < next.screen.height) {
        shiftRows(prev.screen, top, bottom, delta);
        scrollPatch = [
          {
            type: "stdout",
            content: setScrollRegion(top + 1, bottom + 1) + (delta > 0 ? scrollUp(delta) : scrollDown(-delta)) + RESET_SCROLL_REGION + CURSOR_HOME
          }
        ];
      }
    }
    const cursorAtBottom = prev.cursor.y >= prev.screen.height;
    const isGrowing = next.screen.height > prev.screen.height;
    const prevHadScrollback = cursorAtBottom && prev.screen.height >= prev.viewport.height;
    const isShrinking = next.screen.height < prev.screen.height;
    const nextFitsViewport = next.screen.height <= prev.viewport.height;
    if (prevHadScrollback && nextFitsViewport && isShrinking) {
      logForDebugging2(`Full reset (shrink->below): prevHeight=${prev.screen.height}, nextHeight=${next.screen.height}, viewport=${prev.viewport.height}`);
      return fullResetSequence_CAUSES_FLICKER(next, "offscreen", stylePool);
    }
    if (prev.screen.height >= prev.viewport.height && prev.screen.height > 0 && cursorAtBottom && !isGrowing) {
      const viewportY2 = prev.screen.height - prev.viewport.height;
      const scrollbackRows = viewportY2 + 1;
      let scrollbackChangeY = -1;
      diffEach(prev.screen, next.screen, (_x, y) => {
        if (y < scrollbackRows) {
          scrollbackChangeY = y;
          return true;
        }
      });
      if (scrollbackChangeY >= 0) {
        const prevLine = readLine(prev.screen, scrollbackChangeY);
        const nextLine = readLine(next.screen, scrollbackChangeY);
        return fullResetSequence_CAUSES_FLICKER(next, "offscreen", stylePool, {
          triggerY: scrollbackChangeY,
          prevLine,
          nextLine
        });
      }
    }
    const screen = new VirtualScreen(prev.cursor, next.viewport.width);
    const heightDelta = Math.max(next.screen.height, 1) - Math.max(prev.screen.height, 1);
    const shrinking = heightDelta < 0;
    const growing = heightDelta > 0;
    if (shrinking) {
      const linesToClear = prev.screen.height - next.screen.height;
      if (linesToClear > prev.viewport.height) {
        return fullResetSequence_CAUSES_FLICKER(next, "offscreen", this.options.stylePool);
      }
      screen.txn((prev2) => [
        [
          { type: "clear", count: linesToClear },
          { type: "cursorMove", x: 0, y: -1 }
        ],
        { dx: -prev2.x, dy: -linesToClear }
      ]);
    }
    const cursorRestoreScroll = prevHadScrollback ? 1 : 0;
    const viewportY = growing ? Math.max(0, prev.screen.height - prev.viewport.height + cursorRestoreScroll) : Math.max(prev.screen.height, next.screen.height) - next.viewport.height + cursorRestoreScroll;
    let currentStyleId = stylePool.none;
    let currentHyperlink;
    let needsFullReset = false;
    let resetTriggerY = -1;
    diffEach(prev.screen, next.screen, (x, y, removed, added) => {
      if (growing && y >= prev.screen.height) {
        return;
      }
      if (added && (added.width === 2 /* SpacerTail */ || added.width === 3 /* SpacerHead */)) {
        return;
      }
      if (removed && (removed.width === 2 /* SpacerTail */ || removed.width === 3 /* SpacerHead */) && !added) {
        return;
      }
      if (added && isEmptyCellAt(next.screen, x, y) && !removed) {
        return;
      }
      if (y < viewportY) {
        needsFullReset = true;
        resetTriggerY = y;
        return true;
      }
      moveCursorTo(screen, x, y);
      if (added) {
        const targetHyperlink = added.hyperlink;
        currentHyperlink = transitionHyperlink(screen.diff, currentHyperlink, targetHyperlink);
        const styleStr = stylePool.transition(currentStyleId, added.styleId);
        if (writeCellWithStyleStr(screen, added, styleStr)) {
          currentStyleId = added.styleId;
        }
      } else if (removed) {
        const styleIdToReset = currentStyleId;
        const hyperlinkToReset = currentHyperlink;
        currentStyleId = stylePool.none;
        currentHyperlink = undefined;
        screen.txn(() => {
          const patches = [];
          transitionStyle(patches, stylePool, styleIdToReset, stylePool.none);
          transitionHyperlink(patches, hyperlinkToReset, undefined);
          patches.push({ type: "stdout", content: " " });
          return [patches, { dx: 1, dy: 0 }];
        });
      }
    });
    if (needsFullReset) {
      return fullResetSequence_CAUSES_FLICKER(next, "offscreen", stylePool, {
        triggerY: resetTriggerY,
        prevLine: readLine(prev.screen, resetTriggerY),
        nextLine: readLine(next.screen, resetTriggerY)
      });
    }
    currentStyleId = transitionStyle(screen.diff, stylePool, currentStyleId, stylePool.none);
    currentHyperlink = transitionHyperlink(screen.diff, currentHyperlink, undefined);
    if (growing) {
      renderFrameSlice(screen, next, prev.screen.height, next.screen.height, stylePool);
    }
    if (altScreen) {} else if (next.cursor.y >= next.screen.height) {
      screen.txn((prev2) => {
        const rowsToCreate = next.cursor.y - prev2.y;
        if (rowsToCreate > 0) {
          const patches = new Array(1 + rowsToCreate);
          patches[0] = CARRIAGE_RETURN;
          for (let i = 0;i < rowsToCreate; i++) {
            patches[1 + i] = NEWLINE;
          }
          return [patches, { dx: -prev2.x, dy: rowsToCreate }];
        }
        const dy = next.cursor.y - prev2.y;
        if (dy !== 0 || prev2.x !== next.cursor.x) {
          const patches = [CARRIAGE_RETURN];
          patches.push({ type: "cursorMove", x: next.cursor.x, y: dy });
          return [patches, { dx: next.cursor.x - prev2.x, dy }];
        }
        return [[], { dx: 0, dy: 0 }];
      });
    } else {
      moveCursorTo(screen, next.cursor.x, next.cursor.y);
    }
    const elapsed = performance.now() - startTime2;
    if (elapsed > 50) {
      const damage = next.screen.damage;
      const damageInfo = damage ? `${damage.width}x${damage.height} at (${damage.x},${damage.y})` : "none";
      logForDebugging2(`Slow render: ${elapsed.toFixed(1)}ms, screen: ${next.screen.height}x${next.screen.width}, damage: ${damageInfo}, changes: ${screen.diff.length}`);
    }
    return scrollPatch.length > 0 ? [...scrollPatch, ...screen.diff] : screen.diff;
  }
}
function transitionHyperlink(diff2, current, target) {
  if (current !== target) {
    diff2.push({ type: "hyperlink", uri: target ?? "" });
    return target;
  }
  return current;
}
function transitionStyle(diff2, stylePool, currentId, targetId) {
  const str = stylePool.transition(currentId, targetId);
  if (str.length > 0) {
    diff2.push({ type: "styleStr", str });
  }
  return targetId;
}
function readLine(screen, y) {
  let line = "";
  for (let x = 0;x < screen.width; x++) {
    line += charInCellAt(screen, x, y) ?? " ";
  }
  return line.trimEnd();
}
function fullResetSequence_CAUSES_FLICKER(frame, reason, stylePool, debug) {
  const screen = new VirtualScreen({ x: 0, y: 0 }, frame.viewport.width);
  renderFrame(screen, frame, stylePool);
  return [{ type: "clearTerminal", reason, debug }, ...screen.diff];
}
function renderFrame(screen, frame, stylePool) {
  renderFrameSlice(screen, frame, 0, frame.screen.height, stylePool);
}
function renderFrameSlice(screen, frame, startY, endY, stylePool) {
  let currentStyleId = stylePool.none;
  let currentHyperlink;
  let lastRenderedStyleId = -1;
  const { width: screenWidth, cells, charPool, hyperlinkPool } = frame.screen;
  let index = startY * screenWidth;
  for (let y = startY;y < endY; y += 1) {
    if (screen.cursor.y < y) {
      const rowsToAdvance = y - screen.cursor.y;
      screen.txn((prev) => {
        const patches = new Array(1 + rowsToAdvance);
        patches[0] = CARRIAGE_RETURN;
        for (let i = 0;i < rowsToAdvance; i++) {
          patches[1 + i] = NEWLINE;
        }
        return [patches, { dx: -prev.x, dy: rowsToAdvance }];
      });
    }
    lastRenderedStyleId = -1;
    for (let x = 0;x < screenWidth; x += 1, index += 1) {
      const cell = visibleCellAtIndex(cells, charPool, hyperlinkPool, index, lastRenderedStyleId);
      if (!cell) {
        continue;
      }
      moveCursorTo(screen, x, y);
      const targetHyperlink = cell.hyperlink;
      currentHyperlink = transitionHyperlink(screen.diff, currentHyperlink, targetHyperlink);
      const styleStr = stylePool.transition(currentStyleId, cell.styleId);
      if (writeCellWithStyleStr(screen, cell, styleStr)) {
        currentStyleId = cell.styleId;
        lastRenderedStyleId = cell.styleId;
      }
    }
    currentStyleId = transitionStyle(screen.diff, stylePool, currentStyleId, stylePool.none);
    currentHyperlink = transitionHyperlink(screen.diff, currentHyperlink, undefined);
    screen.txn((prev) => [[CARRIAGE_RETURN, NEWLINE], { dx: -prev.x, dy: 1 }]);
  }
  transitionStyle(screen.diff, stylePool, currentStyleId, stylePool.none);
  transitionHyperlink(screen.diff, currentHyperlink, undefined);
  return screen;
}
function writeCellWithStyleStr(screen, cell, styleStr) {
  const cellWidth = cell.width === 1 /* Wide */ ? 2 : 1;
  const px = screen.cursor.x;
  const vw = screen.viewportWidth;
  if (cellWidth === 2 && px < vw) {
    const threshold = cell.char.length > 2 ? vw : vw + 1;
    if (px + 2 >= threshold) {
      return false;
    }
  }
  const diff2 = screen.diff;
  if (styleStr.length > 0) {
    diff2.push({ type: "styleStr", str: styleStr });
  }
  const needsCompensation = cellWidth === 2 && needsWidthCompensation(cell.char);
  if (needsCompensation && px + 1 < vw) {
    diff2.push({ type: "cursorTo", col: px + 2 });
    diff2.push({ type: "stdout", content: " " });
    diff2.push({ type: "cursorTo", col: px + 1 });
  }
  diff2.push({ type: "stdout", content: cell.char });
  if (needsCompensation) {
    diff2.push({ type: "cursorTo", col: px + cellWidth + 1 });
  }
  if (px >= vw) {
    screen.cursor.x = cellWidth;
    screen.cursor.y++;
  } else {
    screen.cursor.x = px + cellWidth;
  }
  return true;
}
function moveCursorTo(screen, targetX, targetY) {
  screen.txn((prev) => {
    const dx = targetX - prev.x;
    const dy = targetY - prev.y;
    const inPendingWrap = prev.x >= screen.viewportWidth;
    if (inPendingWrap) {
      return [
        [CARRIAGE_RETURN, { type: "cursorMove", x: targetX, y: dy }],
        { dx, dy }
      ];
    }
    if (dy !== 0) {
      return [
        [CARRIAGE_RETURN, { type: "cursorMove", x: targetX, y: dy }],
        { dx, dy }
      ];
    }
    return [[{ type: "cursorMove", x: dx, y: dy }], { dx, dy }];
  });
}
function needsWidthCompensation(char) {
  const cp = char.codePointAt(0);
  if (cp === undefined)
    return false;
  if (cp >= 129648 && cp <= 129791 || cp >= 129792 && cp <= 130047) {
    return true;
  }
  if (char.length >= 2) {
    for (let i = 0;i < char.length; i++) {
      if (char.charCodeAt(i) === 65039)
        return true;
    }
  }
  return false;
}

class VirtualScreen {
  viewportWidth;
  cursor;
  diff = [];
  constructor(origin, viewportWidth) {
    this.viewportWidth = viewportWidth;
    this.cursor = { ...origin };
  }
  txn(fn) {
    const [patches, next] = fn(this.cursor);
    for (const patch of patches) {
      this.diff.push(patch);
    }
    this.cursor.x += next.dx;
    this.cursor.y += next.dy;
  }
}
var logForDebugging2 = (_message) => {}, CARRIAGE_RETURN, NEWLINE;
var init_log_update = __esm(() => {
  init_build();
  init_screen();
  init_csi();
  init_osc();
  init_legacyConsole();
  CARRIAGE_RETURN = { type: "carriageReturn" };
  NEWLINE = { type: "stdout", content: `
` };
});

// packages/@ant/ink/src/core/optimizer.ts
function optimize(diff2) {
  if (diff2.length <= 1) {
    return diff2;
  }
  const result = [];
  let len = 0;
  for (const patch of diff2) {
    const type = patch.type;
    if (type === "stdout") {
      if (patch.content === "")
        continue;
    } else if (type === "cursorMove") {
      if (patch.x === 0 && patch.y === 0)
        continue;
    } else if (type === "clear") {
      if (patch.count === 0)
        continue;
    }
    if (len > 0) {
      const lastIdx = len - 1;
      const last = result[lastIdx];
      const lastType = last.type;
      if (type === "cursorMove" && lastType === "cursorMove") {
        result[lastIdx] = {
          type: "cursorMove",
          x: last.x + patch.x,
          y: last.y + patch.y
        };
        continue;
      }
      if (type === "cursorTo" && lastType === "cursorTo") {
        result[lastIdx] = patch;
        continue;
      }
      if (type === "styleStr" && lastType === "styleStr") {
        result[lastIdx] = { type: "styleStr", str: last.str + patch.str };
        continue;
      }
      if (type === "hyperlink" && lastType === "hyperlink" && patch.uri === last.uri) {
        continue;
      }
      if (type === "cursorShow" && lastType === "cursorHide" || type === "cursorHide" && lastType === "cursorShow") {
        result.pop();
        len--;
        continue;
      }
    }
    result.push(patch);
    len++;
  }
  return result;
}
var init_optimizer = () => {};

// node_modules/.bun/bidi-js@1.0.3/node_modules/bidi-js/dist/bidi.mjs
function bidiFactory() {
  var bidi = function(exports) {
    var DATA = {
      R: "13k,1a,2,3,3,2+1j,ch+16,a+1,5+2,2+n,5,a,4,6+16,4+3,h+1b,4mo,179q,2+9,2+11,2i9+7y,2+68,4,3+4,5+13,4+3,2+4k,3+29,8+cf,1t+7z,w+17,3+3m,1t+3z,16o1+5r,8+30,8+mc,29+1r,29+4v,75+73",
      EN: "1c+9,3d+1,6,187+9,513,4+5,7+9,sf+j,175h+9,qw+q,161f+1d,4xt+a,25i+9",
      ES: "17,2,6dp+1,f+1,av,16vr,mx+1,4o,2",
      ET: "z+2,3h+3,b+1,ym,3e+1,2o,p4+1,8,6u,7c,g6,1wc,1n9+4,30+1b,2n,6d,qhx+1,h0m,a+1,49+2,63+1,4+1,6bb+3,12jj",
      AN: "16o+5,2j+9,2+1,35,ed,1ff2+9,87+u",
      CS: "18,2+1,b,2u,12k,55v,l,17v0,2,3,53,2+1,b",
      B: "a,3,f+2,2v,690",
      S: "9,2,k",
      WS: "c,k,4f4,1vk+a,u,1j,335",
      ON: "x+1,4+4,h+5,r+5,r+3,z,5+3,2+1,2+1,5,2+2,3+4,o,w,ci+1,8+d,3+d,6+8,2+g,39+1,9,6+1,2,33,b8,3+1,3c+1,7+1,5r,b,7h+3,sa+5,2,3i+6,jg+3,ur+9,2v,ij+1,9g+9,7+a,8m,4+1,49+x,14u,2+2,c+2,e+2,e+2,e+1,i+n,e+e,2+p,u+2,e+2,36+1,2+3,2+1,b,2+2,6+5,2,2,2,h+1,5+4,6+3,3+f,16+2,5+3l,3+81,1y+p,2+40,q+a,m+13,2r+ch,2+9e,75+hf,3+v,2+2w,6e+5,f+6,75+2a,1a+p,2+2g,d+5x,r+b,6+3,4+o,g,6+1,6+2,2k+1,4,2j,5h+z,1m+1,1e+f,t+2,1f+e,d+3,4o+3,2s+1,w,535+1r,h3l+1i,93+2,2s,b+1,3l+x,2v,4g+3,21+3,kz+1,g5v+1,5a,j+9,n+v,2,3,2+8,2+1,3+2,2,3,46+1,4+4,h+5,r+5,r+a,3h+2,4+6,b+4,78,1r+24,4+c,4,1hb,ey+6,103+j,16j+c,1ux+7,5+g,fsh,jdq+1t,4,57+2e,p1,1m,1m,1m,1m,4kt+1,7j+17,5+2r,d+e,3+e,2+e,2+10,m+4,w,1n+5,1q,4z+5,4b+rb,9+c,4+c,4+37,d+2g,8+b,l+b,5+1j,9+9,7+13,9+t,3+1,27+3c,2+29,2+3q,d+d,3+4,4+2,6+6,a+o,8+6,a+2,e+6,16+42,2+1i",
      BN: "0+8,6+d,2s+5,2+p,e,4m9,1kt+2,2b+5,5+5,17q9+v,7k,6p+8,6+1,119d+3,440+7,96s+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+75,6p+2rz,1ben+1,1ekf+1,1ekf+1",
      NSM: "lc+33,7o+6,7c+18,2,2+1,2+1,2,21+a,1d+k,h,2u+6,3+5,3+1,2+3,10,v+q,2k+a,1n+8,a,p+3,2+8,2+2,2+4,18+2,3c+e,2+v,1k,2,5+7,5,4+6,b+1,u,1n,5+3,9,l+1,r,3+1,1m,5+1,5+1,3+2,4,v+1,4,c+1,1m,5+4,2+1,5,l+1,n+5,2,1n,3,2+3,9,8+1,c+1,v,1q,d,1f,4,1m+2,6+2,2+3,8+1,c+1,u,1n,g+1,l+1,t+1,1m+1,5+3,9,l+1,u,21,8+2,2,2j,3+6,d+7,2r,3+8,c+5,23+1,s,2,2,1k+d,2+4,2+1,6+a,2+z,a,2v+3,2+5,2+1,3+1,q+1,5+2,h+3,e,3+1,7,g,jk+2,qb+2,u+2,u+1,v+1,1t+1,2+6,9,3+a,a,1a+2,3c+1,z,3b+2,5+1,a,7+2,64+1,3,1n,2+6,2,2,3+7,7+9,3,1d+g,1s+3,1d,2+4,2,6,15+8,d+1,x+3,3+1,2+2,1l,2+1,4,2+2,1n+7,3+1,49+2,2+c,2+6,5,7,4+1,5j+1l,2+4,k1+w,2db+2,3y,2p+v,ff+3,30+1,n9x+3,2+9,x+1,29+1,7l,4,5,q+1,6,48+1,r+h,e,13+7,q+a,1b+2,1d,3+3,3+1,14,1w+5,3+1,3+1,d,9,1c,1g,2+2,3+1,6+1,2,17+1,9,6n,3,5,fn5,ki+f,h+f,r2,6b,46+4,1af+2,2+1,6+3,15+2,5,4m+1,fy+3,as+1,4a+a,4x,1j+e,1l+2,1e+3,3+1,1y+2,11+4,2+7,1r,d+1,1h+8,b+3,3,2o+2,3,2+1,7,4h,4+7,m+1,1m+1,4,12+6,4+4,5g+7,3+2,2,o,2d+5,2,5+1,2+1,6n+3,7+1,2+1,s+1,2e+7,3,2+1,2z,2,3+5,2,2u+2,3+3,2+4,78+8,2+1,75+1,2,5,41+3,3+1,5,x+5,3+1,15+5,3+3,9,a+5,3+2,1b+c,2+1,bb+6,2+5,2d+l,3+6,2+1,2+1,3f+5,4,2+1,2+6,2,21+1,4,2,9o+1,f0c+4,1o+6,t5,1s+3,2a,f5l+1,43t+2,i+7,3+6,v+3,45+2,1j0+1i,5+1d,9,f,n+4,2+e,11t+6,2+g,3+6,2+1,2+4,7a+6,c6+3,15t+6,32+6,gzhy+6n",
      AL: "16w,3,2,e+1b,z+2,2+2s,g+1,8+1,b+m,2+t,s+2i,c+e,4h+f,1d+1e,1bwe+dp,3+3z,x+c,2+1,35+3y,2rm+z,5+7,b+5,dt+l,c+u,17nl+27,1t+27,4x+6n,3+d",
      LRO: "6ct",
      RLO: "6cu",
      LRE: "6cq",
      RLE: "6cr",
      PDF: "6cs",
      LRI: "6ee",
      RLI: "6ef",
      FSI: "6eg",
      PDI: "6eh"
    };
    var TYPES = {};
    var TYPES_TO_NAMES = {};
    TYPES.L = 1;
    TYPES_TO_NAMES[1] = "L";
    Object.keys(DATA).forEach(function(type, i) {
      TYPES[type] = 1 << i + 1;
      TYPES_TO_NAMES[TYPES[type]] = type;
    });
    Object.freeze(TYPES);
    var ISOLATE_INIT_TYPES = TYPES.LRI | TYPES.RLI | TYPES.FSI;
    var STRONG_TYPES = TYPES.L | TYPES.R | TYPES.AL;
    var NEUTRAL_ISOLATE_TYPES = TYPES.B | TYPES.S | TYPES.WS | TYPES.ON | TYPES.FSI | TYPES.LRI | TYPES.RLI | TYPES.PDI;
    var BN_LIKE_TYPES = TYPES.BN | TYPES.RLE | TYPES.LRE | TYPES.RLO | TYPES.LRO | TYPES.PDF;
    var TRAILING_TYPES = TYPES.S | TYPES.WS | TYPES.B | ISOLATE_INIT_TYPES | TYPES.PDI | BN_LIKE_TYPES;
    var map = null;
    function parseData() {
      if (!map) {
        map = new Map;
        var loop = function(type2) {
          if (DATA.hasOwnProperty(type2)) {
            var lastCode = 0;
            DATA[type2].split(",").forEach(function(range) {
              var ref = range.split("+");
              var skip = ref[0];
              var step = ref[1];
              skip = parseInt(skip, 36);
              step = step ? parseInt(step, 36) : 0;
              map.set(lastCode += skip, TYPES[type2]);
              for (var i = 0;i < step; i++) {
                map.set(++lastCode, TYPES[type2]);
              }
            });
          }
        };
        for (var type in DATA)
          loop(type);
      }
    }
    function getBidiCharType(char) {
      parseData();
      return map.get(char.codePointAt(0)) || TYPES.L;
    }
    function getBidiCharTypeName(char) {
      return TYPES_TO_NAMES[getBidiCharType(char)];
    }
    var data$1 = {
      pairs: "14>1,1e>2,u>2,2wt>1,1>1,1ge>1,1wp>1,1j>1,f>1,hm>1,1>1,u>1,u6>1,1>1,+5,28>1,w>1,1>1,+3,b8>1,1>1,+3,1>3,-1>-1,3>1,1>1,+2,1s>1,1>1,x>1,th>1,1>1,+2,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,4q>1,1e>2,u>2,2>1,+1",
      canonical: "6f1>-6dx,6dy>-6dx,6ec>-6ed,6ee>-6ed,6ww>2jj,-2ji>2jj,14r4>-1e7l,1e7m>-1e7l,1e7m>-1e5c,1e5d>-1e5b,1e5c>-14qx,14qy>-14qx,14vn>-1ecg,1ech>-1ecg,1edu>-1ecg,1eci>-1ecg,1eda>-1ecg,1eci>-1ecg,1eci>-168q,168r>-168q,168s>-14ye,14yf>-14ye"
    };
    function parseCharacterMap(encodedString, includeReverse) {
      var radix = 36;
      var lastCode = 0;
      var map2 = new Map;
      var reverseMap = includeReverse && new Map;
      var prevPair;
      encodedString.split(",").forEach(function visit(entry) {
        if (entry.indexOf("+") !== -1) {
          for (var i = +entry;i--; ) {
            visit(prevPair);
          }
        } else {
          prevPair = entry;
          var ref = entry.split(">");
          var a = ref[0];
          var b = ref[1];
          a = String.fromCodePoint(lastCode += parseInt(a, radix));
          b = String.fromCodePoint(lastCode += parseInt(b, radix));
          map2.set(a, b);
          includeReverse && reverseMap.set(b, a);
        }
      });
      return { map: map2, reverseMap };
    }
    var openToClose, closeToOpen, canonical;
    function parse$1() {
      if (!openToClose) {
        var ref = parseCharacterMap(data$1.pairs, true);
        var map2 = ref.map;
        var reverseMap = ref.reverseMap;
        openToClose = map2;
        closeToOpen = reverseMap;
        canonical = parseCharacterMap(data$1.canonical, false).map;
      }
    }
    function openingToClosingBracket(char) {
      parse$1();
      return openToClose.get(char) || null;
    }
    function closingToOpeningBracket(char) {
      parse$1();
      return closeToOpen.get(char) || null;
    }
    function getCanonicalBracket(char) {
      parse$1();
      return canonical.get(char) || null;
    }
    var TYPE_L = TYPES.L;
    var TYPE_R = TYPES.R;
    var TYPE_EN = TYPES.EN;
    var TYPE_ES = TYPES.ES;
    var TYPE_ET = TYPES.ET;
    var TYPE_AN = TYPES.AN;
    var TYPE_CS = TYPES.CS;
    var TYPE_B = TYPES.B;
    var TYPE_S = TYPES.S;
    var TYPE_ON = TYPES.ON;
    var TYPE_BN = TYPES.BN;
    var TYPE_NSM = TYPES.NSM;
    var TYPE_AL = TYPES.AL;
    var TYPE_LRO = TYPES.LRO;
    var TYPE_RLO = TYPES.RLO;
    var TYPE_LRE = TYPES.LRE;
    var TYPE_RLE = TYPES.RLE;
    var TYPE_PDF = TYPES.PDF;
    var TYPE_LRI = TYPES.LRI;
    var TYPE_RLI = TYPES.RLI;
    var TYPE_FSI = TYPES.FSI;
    var TYPE_PDI = TYPES.PDI;
    function getEmbeddingLevels(string, baseDirection) {
      var MAX_DEPTH = 125;
      var charTypes = new Uint32Array(string.length);
      for (var i = 0;i < string.length; i++) {
        charTypes[i] = getBidiCharType(string[i]);
      }
      var charTypeCounts = new Map;
      function changeCharType(i2, type2) {
        var oldType = charTypes[i2];
        charTypes[i2] = type2;
        charTypeCounts.set(oldType, charTypeCounts.get(oldType) - 1);
        if (oldType & NEUTRAL_ISOLATE_TYPES) {
          charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) - 1);
        }
        charTypeCounts.set(type2, (charTypeCounts.get(type2) || 0) + 1);
        if (type2 & NEUTRAL_ISOLATE_TYPES) {
          charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) || 0) + 1);
        }
      }
      var embedLevels = new Uint8Array(string.length);
      var isolationPairs = new Map;
      var paragraphs = [];
      var paragraph = null;
      for (var i$1 = 0;i$1 < string.length; i$1++) {
        if (!paragraph) {
          paragraphs.push(paragraph = {
            start: i$1,
            end: string.length - 1,
            level: baseDirection === "rtl" ? 1 : baseDirection === "ltr" ? 0 : determineAutoEmbedLevel(i$1, false)
          });
        }
        if (charTypes[i$1] & TYPE_B) {
          paragraph.end = i$1;
          paragraph = null;
        }
      }
      var FORMATTING_TYPES = TYPE_RLE | TYPE_LRE | TYPE_RLO | TYPE_LRO | ISOLATE_INIT_TYPES | TYPE_PDI | TYPE_PDF | TYPE_B;
      var nextEven = function(n) {
        return n + (n & 1 ? 1 : 2);
      };
      var nextOdd = function(n) {
        return n + (n & 1 ? 2 : 1);
      };
      for (var paraIdx = 0;paraIdx < paragraphs.length; paraIdx++) {
        paragraph = paragraphs[paraIdx];
        var statusStack = [{
          _level: paragraph.level,
          _override: 0,
          _isolate: 0
        }];
        var stackTop = undefined;
        var overflowIsolateCount = 0;
        var overflowEmbeddingCount = 0;
        var validIsolateCount = 0;
        charTypeCounts.clear();
        for (var i$2 = paragraph.start;i$2 <= paragraph.end; i$2++) {
          var charType = charTypes[i$2];
          stackTop = statusStack[statusStack.length - 1];
          charTypeCounts.set(charType, (charTypeCounts.get(charType) || 0) + 1);
          if (charType & NEUTRAL_ISOLATE_TYPES) {
            charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) || 0) + 1);
          }
          if (charType & FORMATTING_TYPES) {
            if (charType & (TYPE_RLE | TYPE_LRE)) {
              embedLevels[i$2] = stackTop._level;
              var level = (charType === TYPE_RLE ? nextOdd : nextEven)(stackTop._level);
              if (level <= MAX_DEPTH && !overflowIsolateCount && !overflowEmbeddingCount) {
                statusStack.push({
                  _level: level,
                  _override: 0,
                  _isolate: 0
                });
              } else if (!overflowIsolateCount) {
                overflowEmbeddingCount++;
              }
            } else if (charType & (TYPE_RLO | TYPE_LRO)) {
              embedLevels[i$2] = stackTop._level;
              var level$1 = (charType === TYPE_RLO ? nextOdd : nextEven)(stackTop._level);
              if (level$1 <= MAX_DEPTH && !overflowIsolateCount && !overflowEmbeddingCount) {
                statusStack.push({
                  _level: level$1,
                  _override: charType & TYPE_RLO ? TYPE_R : TYPE_L,
                  _isolate: 0
                });
              } else if (!overflowIsolateCount) {
                overflowEmbeddingCount++;
              }
            } else if (charType & ISOLATE_INIT_TYPES) {
              if (charType & TYPE_FSI) {
                charType = determineAutoEmbedLevel(i$2 + 1, true) === 1 ? TYPE_RLI : TYPE_LRI;
              }
              embedLevels[i$2] = stackTop._level;
              if (stackTop._override) {
                changeCharType(i$2, stackTop._override);
              }
              var level$2 = (charType === TYPE_RLI ? nextOdd : nextEven)(stackTop._level);
              if (level$2 <= MAX_DEPTH && overflowIsolateCount === 0 && overflowEmbeddingCount === 0) {
                validIsolateCount++;
                statusStack.push({
                  _level: level$2,
                  _override: 0,
                  _isolate: 1,
                  _isolInitIndex: i$2
                });
              } else {
                overflowIsolateCount++;
              }
            } else if (charType & TYPE_PDI) {
              if (overflowIsolateCount > 0) {
                overflowIsolateCount--;
              } else if (validIsolateCount > 0) {
                overflowEmbeddingCount = 0;
                while (!statusStack[statusStack.length - 1]._isolate) {
                  statusStack.pop();
                }
                var isolInitIndex = statusStack[statusStack.length - 1]._isolInitIndex;
                if (isolInitIndex != null) {
                  isolationPairs.set(isolInitIndex, i$2);
                  isolationPairs.set(i$2, isolInitIndex);
                }
                statusStack.pop();
                validIsolateCount--;
              }
              stackTop = statusStack[statusStack.length - 1];
              embedLevels[i$2] = stackTop._level;
              if (stackTop._override) {
                changeCharType(i$2, stackTop._override);
              }
            } else if (charType & TYPE_PDF) {
              if (overflowIsolateCount === 0) {
                if (overflowEmbeddingCount > 0) {
                  overflowEmbeddingCount--;
                } else if (!stackTop._isolate && statusStack.length > 1) {
                  statusStack.pop();
                  stackTop = statusStack[statusStack.length - 1];
                }
              }
              embedLevels[i$2] = stackTop._level;
            } else if (charType & TYPE_B) {
              embedLevels[i$2] = paragraph.level;
            }
          } else {
            embedLevels[i$2] = stackTop._level;
            if (stackTop._override && charType !== TYPE_BN) {
              changeCharType(i$2, stackTop._override);
            }
          }
        }
        var levelRuns = [];
        var currentRun = null;
        for (var i$3 = paragraph.start;i$3 <= paragraph.end; i$3++) {
          var charType$1 = charTypes[i$3];
          if (!(charType$1 & BN_LIKE_TYPES)) {
            var lvl = embedLevels[i$3];
            var isIsolInit = charType$1 & ISOLATE_INIT_TYPES;
            var isPDI = charType$1 === TYPE_PDI;
            if (currentRun && lvl === currentRun._level) {
              currentRun._end = i$3;
              currentRun._endsWithIsolInit = isIsolInit;
            } else {
              levelRuns.push(currentRun = {
                _start: i$3,
                _end: i$3,
                _level: lvl,
                _startsWithPDI: isPDI,
                _endsWithIsolInit: isIsolInit
              });
            }
          }
        }
        var isolatingRunSeqs = [];
        for (var runIdx = 0;runIdx < levelRuns.length; runIdx++) {
          var run = levelRuns[runIdx];
          if (!run._startsWithPDI || run._startsWithPDI && !isolationPairs.has(run._start)) {
            var seqRuns = [currentRun = run];
            for (var pdiIndex = undefined;currentRun && currentRun._endsWithIsolInit && (pdiIndex = isolationPairs.get(currentRun._end)) != null; ) {
              for (var i$4 = runIdx + 1;i$4 < levelRuns.length; i$4++) {
                if (levelRuns[i$4]._start === pdiIndex) {
                  seqRuns.push(currentRun = levelRuns[i$4]);
                  break;
                }
              }
            }
            var seqIndices = [];
            for (var i$5 = 0;i$5 < seqRuns.length; i$5++) {
              var run$1 = seqRuns[i$5];
              for (var j = run$1._start;j <= run$1._end; j++) {
                seqIndices.push(j);
              }
            }
            var firstLevel = embedLevels[seqIndices[0]];
            var prevLevel = paragraph.level;
            for (var i$6 = seqIndices[0] - 1;i$6 >= 0; i$6--) {
              if (!(charTypes[i$6] & BN_LIKE_TYPES)) {
                prevLevel = embedLevels[i$6];
                break;
              }
            }
            var lastIndex = seqIndices[seqIndices.length - 1];
            var lastLevel = embedLevels[lastIndex];
            var nextLevel = paragraph.level;
            if (!(charTypes[lastIndex] & ISOLATE_INIT_TYPES)) {
              for (var i$7 = lastIndex + 1;i$7 <= paragraph.end; i$7++) {
                if (!(charTypes[i$7] & BN_LIKE_TYPES)) {
                  nextLevel = embedLevels[i$7];
                  break;
                }
              }
            }
            isolatingRunSeqs.push({
              _seqIndices: seqIndices,
              _sosType: Math.max(prevLevel, firstLevel) % 2 ? TYPE_R : TYPE_L,
              _eosType: Math.max(nextLevel, lastLevel) % 2 ? TYPE_R : TYPE_L
            });
          }
        }
        for (var seqIdx = 0;seqIdx < isolatingRunSeqs.length; seqIdx++) {
          var ref = isolatingRunSeqs[seqIdx];
          var seqIndices$1 = ref._seqIndices;
          var sosType = ref._sosType;
          var eosType = ref._eosType;
          var embedDirection = embedLevels[seqIndices$1[0]] & 1 ? TYPE_R : TYPE_L;
          if (charTypeCounts.get(TYPE_NSM)) {
            for (var si = 0;si < seqIndices$1.length; si++) {
              var i$8 = seqIndices$1[si];
              if (charTypes[i$8] & TYPE_NSM) {
                var prevType = sosType;
                for (var sj = si - 1;sj >= 0; sj--) {
                  if (!(charTypes[seqIndices$1[sj]] & BN_LIKE_TYPES)) {
                    prevType = charTypes[seqIndices$1[sj]];
                    break;
                  }
                }
                changeCharType(i$8, prevType & (ISOLATE_INIT_TYPES | TYPE_PDI) ? TYPE_ON : prevType);
              }
            }
          }
          if (charTypeCounts.get(TYPE_EN)) {
            for (var si$1 = 0;si$1 < seqIndices$1.length; si$1++) {
              var i$9 = seqIndices$1[si$1];
              if (charTypes[i$9] & TYPE_EN) {
                for (var sj$1 = si$1 - 1;sj$1 >= -1; sj$1--) {
                  var prevCharType = sj$1 === -1 ? sosType : charTypes[seqIndices$1[sj$1]];
                  if (prevCharType & STRONG_TYPES) {
                    if (prevCharType === TYPE_AL) {
                      changeCharType(i$9, TYPE_AN);
                    }
                    break;
                  }
                }
              }
            }
          }
          if (charTypeCounts.get(TYPE_AL)) {
            for (var si$2 = 0;si$2 < seqIndices$1.length; si$2++) {
              var i$10 = seqIndices$1[si$2];
              if (charTypes[i$10] & TYPE_AL) {
                changeCharType(i$10, TYPE_R);
              }
            }
          }
          if (charTypeCounts.get(TYPE_ES) || charTypeCounts.get(TYPE_CS)) {
            for (var si$3 = 1;si$3 < seqIndices$1.length - 1; si$3++) {
              var i$11 = seqIndices$1[si$3];
              if (charTypes[i$11] & (TYPE_ES | TYPE_CS)) {
                var prevType$1 = 0, nextType = 0;
                for (var sj$2 = si$3 - 1;sj$2 >= 0; sj$2--) {
                  prevType$1 = charTypes[seqIndices$1[sj$2]];
                  if (!(prevType$1 & BN_LIKE_TYPES)) {
                    break;
                  }
                }
                for (var sj$3 = si$3 + 1;sj$3 < seqIndices$1.length; sj$3++) {
                  nextType = charTypes[seqIndices$1[sj$3]];
                  if (!(nextType & BN_LIKE_TYPES)) {
                    break;
                  }
                }
                if (prevType$1 === nextType && (charTypes[i$11] === TYPE_ES ? prevType$1 === TYPE_EN : prevType$1 & (TYPE_EN | TYPE_AN))) {
                  changeCharType(i$11, prevType$1);
                }
              }
            }
          }
          if (charTypeCounts.get(TYPE_EN)) {
            for (var si$4 = 0;si$4 < seqIndices$1.length; si$4++) {
              var i$12 = seqIndices$1[si$4];
              if (charTypes[i$12] & TYPE_EN) {
                for (var sj$4 = si$4 - 1;sj$4 >= 0 && charTypes[seqIndices$1[sj$4]] & (TYPE_ET | BN_LIKE_TYPES); sj$4--) {
                  changeCharType(seqIndices$1[sj$4], TYPE_EN);
                }
                for (si$4++;si$4 < seqIndices$1.length && charTypes[seqIndices$1[si$4]] & (TYPE_ET | BN_LIKE_TYPES | TYPE_EN); si$4++) {
                  if (charTypes[seqIndices$1[si$4]] !== TYPE_EN) {
                    changeCharType(seqIndices$1[si$4], TYPE_EN);
                  }
                }
              }
            }
          }
          if (charTypeCounts.get(TYPE_ET) || charTypeCounts.get(TYPE_ES) || charTypeCounts.get(TYPE_CS)) {
            for (var si$5 = 0;si$5 < seqIndices$1.length; si$5++) {
              var i$13 = seqIndices$1[si$5];
              if (charTypes[i$13] & (TYPE_ET | TYPE_ES | TYPE_CS)) {
                changeCharType(i$13, TYPE_ON);
                for (var sj$5 = si$5 - 1;sj$5 >= 0 && charTypes[seqIndices$1[sj$5]] & BN_LIKE_TYPES; sj$5--) {
                  changeCharType(seqIndices$1[sj$5], TYPE_ON);
                }
                for (var sj$6 = si$5 + 1;sj$6 < seqIndices$1.length && charTypes[seqIndices$1[sj$6]] & BN_LIKE_TYPES; sj$6++) {
                  changeCharType(seqIndices$1[sj$6], TYPE_ON);
                }
              }
            }
          }
          if (charTypeCounts.get(TYPE_EN)) {
            for (var si$6 = 0, prevStrongType = sosType;si$6 < seqIndices$1.length; si$6++) {
              var i$14 = seqIndices$1[si$6];
              var type = charTypes[i$14];
              if (type & TYPE_EN) {
                if (prevStrongType === TYPE_L) {
                  changeCharType(i$14, TYPE_L);
                }
              } else if (type & STRONG_TYPES) {
                prevStrongType = type;
              }
            }
          }
          if (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES)) {
            var R_TYPES_FOR_N_STEPS = TYPE_R | TYPE_EN | TYPE_AN;
            var STRONG_TYPES_FOR_N_STEPS = R_TYPES_FOR_N_STEPS | TYPE_L;
            var bracketPairs = [];
            {
              var openerStack = [];
              for (var si$7 = 0;si$7 < seqIndices$1.length; si$7++) {
                if (charTypes[seqIndices$1[si$7]] & NEUTRAL_ISOLATE_TYPES) {
                  var char = string[seqIndices$1[si$7]];
                  var oppositeBracket = undefined;
                  if (openingToClosingBracket(char) !== null) {
                    if (openerStack.length < 63) {
                      openerStack.push({ char, seqIndex: si$7 });
                    } else {
                      break;
                    }
                  } else if ((oppositeBracket = closingToOpeningBracket(char)) !== null) {
                    for (var stackIdx = openerStack.length - 1;stackIdx >= 0; stackIdx--) {
                      var stackChar = openerStack[stackIdx].char;
                      if (stackChar === oppositeBracket || stackChar === closingToOpeningBracket(getCanonicalBracket(char)) || openingToClosingBracket(getCanonicalBracket(stackChar)) === char) {
                        bracketPairs.push([openerStack[stackIdx].seqIndex, si$7]);
                        openerStack.length = stackIdx;
                        break;
                      }
                    }
                  }
                }
              }
              bracketPairs.sort(function(a, b) {
                return a[0] - b[0];
              });
            }
            for (var pairIdx = 0;pairIdx < bracketPairs.length; pairIdx++) {
              var ref$1 = bracketPairs[pairIdx];
              var openSeqIdx = ref$1[0];
              var closeSeqIdx = ref$1[1];
              var foundStrongType = false;
              var useStrongType = 0;
              for (var si$8 = openSeqIdx + 1;si$8 < closeSeqIdx; si$8++) {
                var i$15 = seqIndices$1[si$8];
                if (charTypes[i$15] & STRONG_TYPES_FOR_N_STEPS) {
                  foundStrongType = true;
                  var lr = charTypes[i$15] & R_TYPES_FOR_N_STEPS ? TYPE_R : TYPE_L;
                  if (lr === embedDirection) {
                    useStrongType = lr;
                    break;
                  }
                }
              }
              if (foundStrongType && !useStrongType) {
                useStrongType = sosType;
                for (var si$9 = openSeqIdx - 1;si$9 >= 0; si$9--) {
                  var i$16 = seqIndices$1[si$9];
                  if (charTypes[i$16] & STRONG_TYPES_FOR_N_STEPS) {
                    var lr$1 = charTypes[i$16] & R_TYPES_FOR_N_STEPS ? TYPE_R : TYPE_L;
                    if (lr$1 !== embedDirection) {
                      useStrongType = lr$1;
                    } else {
                      useStrongType = embedDirection;
                    }
                    break;
                  }
                }
              }
              if (useStrongType) {
                charTypes[seqIndices$1[openSeqIdx]] = charTypes[seqIndices$1[closeSeqIdx]] = useStrongType;
                if (useStrongType !== embedDirection) {
                  for (var si$10 = openSeqIdx + 1;si$10 < seqIndices$1.length; si$10++) {
                    if (!(charTypes[seqIndices$1[si$10]] & BN_LIKE_TYPES)) {
                      if (getBidiCharType(string[seqIndices$1[si$10]]) & TYPE_NSM) {
                        charTypes[seqIndices$1[si$10]] = useStrongType;
                      }
                      break;
                    }
                  }
                }
                if (useStrongType !== embedDirection) {
                  for (var si$11 = closeSeqIdx + 1;si$11 < seqIndices$1.length; si$11++) {
                    if (!(charTypes[seqIndices$1[si$11]] & BN_LIKE_TYPES)) {
                      if (getBidiCharType(string[seqIndices$1[si$11]]) & TYPE_NSM) {
                        charTypes[seqIndices$1[si$11]] = useStrongType;
                      }
                      break;
                    }
                  }
                }
              }
            }
            for (var si$12 = 0;si$12 < seqIndices$1.length; si$12++) {
              if (charTypes[seqIndices$1[si$12]] & NEUTRAL_ISOLATE_TYPES) {
                var niRunStart = si$12, niRunEnd = si$12;
                var prevType$2 = sosType;
                for (var si2 = si$12 - 1;si2 >= 0; si2--) {
                  if (charTypes[seqIndices$1[si2]] & BN_LIKE_TYPES) {
                    niRunStart = si2;
                  } else {
                    prevType$2 = charTypes[seqIndices$1[si2]] & R_TYPES_FOR_N_STEPS ? TYPE_R : TYPE_L;
                    break;
                  }
                }
                var nextType$1 = eosType;
                for (var si2$1 = si$12 + 1;si2$1 < seqIndices$1.length; si2$1++) {
                  if (charTypes[seqIndices$1[si2$1]] & (NEUTRAL_ISOLATE_TYPES | BN_LIKE_TYPES)) {
                    niRunEnd = si2$1;
                  } else {
                    nextType$1 = charTypes[seqIndices$1[si2$1]] & R_TYPES_FOR_N_STEPS ? TYPE_R : TYPE_L;
                    break;
                  }
                }
                for (var sj$7 = niRunStart;sj$7 <= niRunEnd; sj$7++) {
                  charTypes[seqIndices$1[sj$7]] = prevType$2 === nextType$1 ? prevType$2 : embedDirection;
                }
                si$12 = niRunEnd;
              }
            }
          }
        }
        for (var i$17 = paragraph.start;i$17 <= paragraph.end; i$17++) {
          var level$3 = embedLevels[i$17];
          var type$1 = charTypes[i$17];
          if (level$3 & 1) {
            if (type$1 & (TYPE_L | TYPE_EN | TYPE_AN)) {
              embedLevels[i$17]++;
            }
          } else {
            if (type$1 & TYPE_R) {
              embedLevels[i$17]++;
            } else if (type$1 & (TYPE_AN | TYPE_EN)) {
              embedLevels[i$17] += 2;
            }
          }
          if (type$1 & BN_LIKE_TYPES) {
            embedLevels[i$17] = i$17 === 0 ? paragraph.level : embedLevels[i$17 - 1];
          }
          if (i$17 === paragraph.end || getBidiCharType(string[i$17]) & (TYPE_S | TYPE_B)) {
            for (var j$1 = i$17;j$1 >= 0 && getBidiCharType(string[j$1]) & TRAILING_TYPES; j$1--) {
              embedLevels[j$1] = paragraph.level;
            }
          }
        }
      }
      return {
        levels: embedLevels,
        paragraphs
      };
      function determineAutoEmbedLevel(start, isFSI) {
        for (var i2 = start;i2 < string.length; i2++) {
          var charType2 = charTypes[i2];
          if (charType2 & (TYPE_R | TYPE_AL)) {
            return 1;
          }
          if (charType2 & (TYPE_B | TYPE_L) || isFSI && charType2 === TYPE_PDI) {
            return 0;
          }
          if (charType2 & ISOLATE_INIT_TYPES) {
            var pdi = indexOfMatchingPDI(i2);
            i2 = pdi === -1 ? string.length : pdi;
          }
        }
        return 0;
      }
      function indexOfMatchingPDI(isolateStart) {
        var isolationLevel = 1;
        for (var i2 = isolateStart + 1;i2 < string.length; i2++) {
          var charType2 = charTypes[i2];
          if (charType2 & TYPE_B) {
            break;
          }
          if (charType2 & TYPE_PDI) {
            if (--isolationLevel === 0) {
              return i2;
            }
          } else if (charType2 & ISOLATE_INIT_TYPES) {
            isolationLevel++;
          }
        }
        return -1;
      }
    }
    var data = "14>1,j>2,t>2,u>2,1a>g,2v3>1,1>1,1ge>1,1wd>1,b>1,1j>1,f>1,ai>3,-2>3,+1,8>1k0,-1jq>1y7,-1y6>1hf,-1he>1h6,-1h5>1ha,-1h8>1qi,-1pu>1,6>3u,-3s>7,6>1,1>1,f>1,1>1,+2,3>1,1>1,+13,4>1,1>1,6>1eo,-1ee>1,3>1mg,-1me>1mk,-1mj>1mi,-1mg>1mi,-1md>1,1>1,+2,1>10k,-103>1,1>1,4>1,5>1,1>1,+10,3>1,1>8,-7>8,+1,-6>7,+1,a>1,1>1,u>1,u6>1,1>1,+5,26>1,1>1,2>1,2>2,8>1,7>1,4>1,1>1,+5,b8>1,1>1,+3,1>3,-2>1,2>1,1>1,+2,c>1,3>1,1>1,+2,h>1,3>1,a>1,1>1,2>1,3>1,1>1,d>1,f>1,3>1,1a>1,1>1,6>1,7>1,13>1,k>1,1>1,+19,4>1,1>1,+2,2>1,1>1,+18,m>1,a>1,1>1,lk>1,1>1,4>1,2>1,f>1,3>1,1>1,+3,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,6>1,4j>1,j>2,t>2,u>2,2>1,+1";
    var mirrorMap;
    function parse() {
      if (!mirrorMap) {
        var ref = parseCharacterMap(data, true);
        var map2 = ref.map;
        var reverseMap = ref.reverseMap;
        reverseMap.forEach(function(value, key) {
          map2.set(key, value);
        });
        mirrorMap = map2;
      }
    }
    function getMirroredCharacter(char) {
      parse();
      return mirrorMap.get(char) || null;
    }
    function getMirroredCharactersMap(string, embeddingLevels, start, end) {
      var strLen = string.length;
      start = Math.max(0, start == null ? 0 : +start);
      end = Math.min(strLen - 1, end == null ? strLen - 1 : +end);
      var map2 = new Map;
      for (var i = start;i <= end; i++) {
        if (embeddingLevels[i] & 1) {
          var mirror = getMirroredCharacter(string[i]);
          if (mirror !== null) {
            map2.set(i, mirror);
          }
        }
      }
      return map2;
    }
    function getReorderSegments(string, embeddingLevelsResult, start, end) {
      var strLen = string.length;
      start = Math.max(0, start == null ? 0 : +start);
      end = Math.min(strLen - 1, end == null ? strLen - 1 : +end);
      var segments = [];
      embeddingLevelsResult.paragraphs.forEach(function(paragraph) {
        var lineStart = Math.max(start, paragraph.start);
        var lineEnd = Math.min(end, paragraph.end);
        if (lineStart < lineEnd) {
          var lineLevels = embeddingLevelsResult.levels.slice(lineStart, lineEnd + 1);
          for (var i = lineEnd;i >= lineStart && getBidiCharType(string[i]) & TRAILING_TYPES; i--) {
            lineLevels[i] = paragraph.level;
          }
          var maxLevel = paragraph.level;
          var minOddLevel = Infinity;
          for (var i$1 = 0;i$1 < lineLevels.length; i$1++) {
            var level = lineLevels[i$1];
            if (level > maxLevel) {
              maxLevel = level;
            }
            if (level < minOddLevel) {
              minOddLevel = level | 1;
            }
          }
          for (var lvl = maxLevel;lvl >= minOddLevel; lvl--) {
            for (var i$2 = 0;i$2 < lineLevels.length; i$2++) {
              if (lineLevels[i$2] >= lvl) {
                var segStart = i$2;
                while (i$2 + 1 < lineLevels.length && lineLevels[i$2 + 1] >= lvl) {
                  i$2++;
                }
                if (i$2 > segStart) {
                  segments.push([segStart + lineStart, i$2 + lineStart]);
                }
              }
            }
          }
        }
      });
      return segments;
    }
    function getReorderedString(string, embedLevelsResult, start, end) {
      var indices = getReorderedIndices(string, embedLevelsResult, start, end);
      var chars = [].concat(string);
      indices.forEach(function(charIndex, i) {
        chars[i] = (embedLevelsResult.levels[charIndex] & 1 ? getMirroredCharacter(string[charIndex]) : null) || string[charIndex];
      });
      return chars.join("");
    }
    function getReorderedIndices(string, embedLevelsResult, start, end) {
      var segments = getReorderSegments(string, embedLevelsResult, start, end);
      var indices = [];
      for (var i = 0;i < string.length; i++) {
        indices[i] = i;
      }
      segments.forEach(function(ref) {
        var start2 = ref[0];
        var end2 = ref[1];
        var slice = indices.slice(start2, end2 + 1);
        for (var i2 = slice.length;i2--; ) {
          indices[end2 - i2] = slice[i2];
        }
      });
      return indices;
    }
    exports.closingToOpeningBracket = closingToOpeningBracket;
    exports.getBidiCharType = getBidiCharType;
    exports.getBidiCharTypeName = getBidiCharTypeName;
    exports.getCanonicalBracket = getCanonicalBracket;
    exports.getEmbeddingLevels = getEmbeddingLevels;
    exports.getMirroredCharacter = getMirroredCharacter;
    exports.getMirroredCharactersMap = getMirroredCharactersMap;
    exports.getReorderSegments = getReorderSegments;
    exports.getReorderedIndices = getReorderedIndices;
    exports.getReorderedString = getReorderedString;
    exports.openingToClosingBracket = openingToClosingBracket;
    Object.defineProperty(exports, "__esModule", { value: true });
    return exports;
  }({});
  return bidi;
}
var bidi_default;
var init_bidi = __esm(() => {
  bidi_default = bidiFactory;
});

// packages/@ant/ink/src/core/bidi.ts
function needsBidi() {
  if (needsSoftwareBidi === undefined) {
    needsSoftwareBidi = process.platform === "win32" || typeof process.env["WT_SESSION"] === "string" || process.env["TERM_PROGRAM"] === "vscode";
  }
  return needsSoftwareBidi;
}
function getBidi() {
  if (!bidiInstance) {
    bidiInstance = bidi_default();
  }
  return bidiInstance;
}
function reorderBidi(characters) {
  if (!needsBidi() || characters.length === 0) {
    return characters;
  }
  const plainText = characters.map((c) => c.value).join("");
  if (!hasRTLCharacters(plainText)) {
    return characters;
  }
  const bidi = getBidi();
  const { levels } = bidi.getEmbeddingLevels(plainText, "auto");
  const charLevels = [];
  let offset = 0;
  for (let i = 0;i < characters.length; i++) {
    charLevels.push(levels[offset]);
    offset += characters[i].value.length;
  }
  const reordered = [...characters];
  const maxLevel = Math.max(...charLevels);
  for (let level = maxLevel;level >= 1; level--) {
    let i = 0;
    while (i < reordered.length) {
      if (charLevels[i] >= level) {
        let j = i + 1;
        while (j < reordered.length && charLevels[j] >= level) {
          j++;
        }
        reverseRange(reordered, i, j - 1);
        reverseRangeNumbers(charLevels, i, j - 1);
        i = j;
      } else {
        i++;
      }
    }
  }
  return reordered;
}
function reverseRange(arr, start, end) {
  while (start < end) {
    const temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;
    start++;
    end--;
  }
}
function reverseRangeNumbers(arr, start, end) {
  while (start < end) {
    const temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;
    start++;
    end--;
  }
}
function hasRTLCharacters(text) {
  return /[\u0590-\u05FF\uFB1D-\uFB4F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0780-\u07BF\u0700-\u074F]/u.test(text);
}
var bidiInstance, needsSoftwareBidi;
var init_bidi2 = __esm(() => {
  init_bidi();
});

// packages/@ant/ink/src/core/widest-line.ts
function widestLine(string) {
  let maxWidth = 0;
  let start = 0;
  while (start <= string.length) {
    const end = string.indexOf(`
`, start);
    const line = end === -1 ? string.substring(start) : string.substring(start, end);
    maxWidth = Math.max(maxWidth, lineWidth(line));
    if (end === -1)
      break;
    start = end + 1;
  }
  return maxWidth;
}
var init_widest_line = __esm(() => {
  init_line_width_cache();
});

// packages/@ant/ink/src/core/output.ts
function intersectClip(parent, child) {
  if (!parent)
    return child;
  return {
    x1: maxDefined(parent.x1, child.x1),
    x2: minDefined(parent.x2, child.x2),
    y1: maxDefined(parent.y1, child.y1),
    y2: minDefined(parent.y2, child.y2)
  };
}
function maxDefined(a, b) {
  if (a === undefined)
    return b;
  if (b === undefined)
    return a;
  return Math.max(a, b);
}
function minDefined(a, b) {
  if (a === undefined)
    return b;
  if (b === undefined)
    return a;
  return Math.min(a, b);
}

class Output {
  width;
  height;
  stylePool;
  screen;
  operations = [];
  charCache = new Map;
  constructor(options) {
    const { width, height, stylePool, screen } = options;
    this.width = width;
    this.height = height;
    this.stylePool = stylePool;
    this.screen = screen;
    resetScreen(screen, width, height);
  }
  reset(width, height, screen) {
    this.width = width;
    this.height = height;
    this.screen = screen;
    this.operations.length = 0;
    resetScreen(screen, width, height);
    if (this.charCache.size > 16384)
      this.charCache.clear();
  }
  blit(src, x, y, width, height) {
    this.operations.push({ type: "blit", src, x, y, width, height });
  }
  shift(top, bottom, n) {
    this.operations.push({ type: "shift", top, bottom, n });
  }
  clear(region, fromAbsolute) {
    this.operations.push({ type: "clear", region, fromAbsolute });
  }
  noSelect(region) {
    this.operations.push({ type: "noSelect", region });
  }
  write(x, y, text, softWrap) {
    if (!text) {
      return;
    }
    this.operations.push({
      type: "write",
      x,
      y,
      text,
      softWrap
    });
  }
  clip(clip) {
    this.operations.push({
      type: "clip",
      clip
    });
  }
  unclip() {
    this.operations.push({
      type: "unclip"
    });
  }
  get() {
    const screen = this.screen;
    const screenWidth = this.width;
    const screenHeight = this.height;
    let blitCells = 0;
    let writeCells = 0;
    const absoluteClears = [];
    for (const operation of this.operations) {
      if (operation.type !== "clear")
        continue;
      const { x, y, width, height } = operation.region;
      const startX = Math.max(0, x);
      const startY = Math.max(0, y);
      const maxX = Math.min(x + width, screenWidth);
      const maxY = Math.min(y + height, screenHeight);
      if (startX >= maxX || startY >= maxY)
        continue;
      const rect = {
        x: startX,
        y: startY,
        width: maxX - startX,
        height: maxY - startY
      };
      screen.damage = screen.damage ? unionRect(screen.damage, rect) : rect;
      if (operation.fromAbsolute)
        absoluteClears.push(rect);
    }
    const clips = [];
    for (const operation of this.operations) {
      switch (operation.type) {
        case "clear":
          continue;
        case "clip":
          clips.push(intersectClip(clips.at(-1), operation.clip));
          continue;
        case "unclip":
          clips.pop();
          continue;
        case "blit": {
          const {
            src,
            x: regionX,
            y: regionY,
            width: regionWidth,
            height: regionHeight
          } = operation;
          const clip = clips.at(-1);
          const startX = Math.max(regionX, clip?.x1 ?? 0);
          const startY = Math.max(regionY, clip?.y1 ?? 0);
          const maxY = Math.min(regionY + regionHeight, screenHeight, src.height, clip?.y2 ?? Infinity);
          const maxX = Math.min(regionX + regionWidth, screenWidth, src.width, clip?.x2 ?? Infinity);
          if (startX >= maxX || startY >= maxY)
            continue;
          if (absoluteClears.length === 0) {
            blitRegion(screen, src, startX, startY, maxX, maxY);
            blitCells += (maxY - startY) * (maxX - startX);
            continue;
          }
          let rowStart = startY;
          for (let row = startY;row <= maxY; row++) {
            const excluded = row < maxY && absoluteClears.some((r) => row >= r.y && row < r.y + r.height && startX >= r.x && maxX <= r.x + r.width);
            if (excluded || row === maxY) {
              if (row > rowStart) {
                blitRegion(screen, src, startX, rowStart, maxX, row);
                blitCells += (row - rowStart) * (maxX - startX);
              }
              rowStart = row + 1;
            }
          }
          continue;
        }
        case "shift": {
          shiftRows(screen, operation.top, operation.bottom, operation.n);
          continue;
        }
        case "write": {
          const { text, softWrap } = operation;
          let { x, y } = operation;
          let lines = text.split(`
`);
          let swFrom = 0;
          let prevContentEnd = 0;
          const clip = clips.at(-1);
          if (clip) {
            const clipHorizontally = typeof clip?.x1 === "number" && typeof clip?.x2 === "number";
            const clipVertically = typeof clip?.y1 === "number" && typeof clip?.y2 === "number";
            if (clipHorizontally) {
              const width = widestLine(text);
              if (x + width <= clip.x1 || x >= clip.x2) {
                continue;
              }
            }
            if (clipVertically) {
              const height = lines.length;
              if (y + height <= clip.y1 || y >= clip.y2) {
                continue;
              }
            }
            if (clipHorizontally) {
              lines = lines.map((line) => {
                const from = x < clip.x1 ? clip.x1 - x : 0;
                const width = stringWidth(line);
                const to = x + width > clip.x2 ? clip.x2 - x : width;
                let sliced = sliceAnsi(line, from, to);
                if (stringWidth(sliced) > to - from) {
                  sliced = sliceAnsi(line, from, to - 1);
                }
                return sliced;
              });
              if (x < clip.x1) {
                x = clip.x1;
              }
            }
            if (clipVertically) {
              const from = y < clip.y1 ? clip.y1 - y : 0;
              const height = lines.length;
              const to = y + height > clip.y2 ? clip.y2 - y : height;
              if (softWrap && from > 0 && softWrap[from] === true) {
                prevContentEnd = x + stringWidth(lines[from - 1]);
              }
              lines = lines.slice(from, to);
              swFrom = from;
              if (y < clip.y1) {
                y = clip.y1;
              }
            }
          }
          const swBits = screen.softWrap;
          let offsetY = 0;
          for (const line of lines) {
            const lineY = y + offsetY;
            if (lineY >= screenHeight) {
              break;
            }
            const contentEnd = writeLineToScreen(screen, line, x, lineY, screenWidth, this.stylePool, this.charCache);
            writeCells += contentEnd - x;
            if (softWrap) {
              const isSW = softWrap[swFrom + offsetY] === true;
              swBits[lineY] = isSW ? prevContentEnd : 0;
              prevContentEnd = contentEnd;
            }
            offsetY++;
          }
          continue;
        }
      }
    }
    for (const operation of this.operations) {
      if (operation.type === "noSelect") {
        const { x, y, width, height } = operation.region;
        markNoSelectRegion(screen, x, y, width, height);
      }
    }
    const totalCells = blitCells + writeCells;
    if (totalCells > 1000 && writeCells > blitCells) {
      logForDebugging3(`High write ratio: blit=${blitCells}, write=${writeCells} (${(writeCells / totalCells * 100).toFixed(1)}% writes), screen=${screenHeight}x${screenWidth}`);
    }
    return screen;
  }
}
function stylesEqual2(a, b) {
  if (a === b)
    return true;
  const len = a.length;
  if (len !== b.length)
    return false;
  if (len === 0)
    return true;
  for (let i = 0;i < len; i++) {
    if (a[i].code !== b[i].code)
      return false;
  }
  return true;
}
function styledCharsWithGraphemeClustering(chars, stylePool) {
  const charCount = chars.length;
  if (charCount === 0)
    return [];
  const result = [];
  const bufferChars = [];
  let bufferStyles = chars[0].styles;
  for (let i = 0;i < charCount; i++) {
    const char = chars[i];
    const styles5 = char.styles;
    if (bufferChars.length > 0 && !stylesEqual2(styles5, bufferStyles)) {
      flushBuffer(bufferChars.join(""), bufferStyles, stylePool, result);
      bufferChars.length = 0;
    }
    bufferChars.push(char.value);
    bufferStyles = styles5;
  }
  if (bufferChars.length > 0) {
    flushBuffer(bufferChars.join(""), bufferStyles, stylePool, result);
  }
  return result;
}
function flushBuffer(buffer, styles5, stylePool, out) {
  const hyperlink = extractHyperlinkFromStyles(styles5) ?? undefined;
  const hasOsc8Styles = hyperlink !== undefined || styles5.some((s) => s.code.length >= OSC8_PREFIX.length && s.code.startsWith(OSC8_PREFIX));
  const filteredStyles = hasOsc8Styles ? filterOutHyperlinkStyles(styles5) : styles5;
  const styleId = stylePool.intern(filteredStyles);
  for (const { segment: grapheme } of getGraphemeSegmenter().segment(buffer)) {
    out.push({
      value: grapheme,
      width: stringWidth(grapheme),
      styleId,
      hyperlink
    });
  }
}
function writeLineToScreen(screen, line, x, y, screenWidth, stylePool, charCache) {
  let characters = charCache.get(line);
  if (!characters) {
    characters = reorderBidi(styledCharsWithGraphemeClustering(styledCharsFromTokens(tokenize2(line)), stylePool));
    charCache.set(line, characters);
  }
  let offsetX = x;
  for (let charIdx = 0;charIdx < characters.length; charIdx++) {
    const character = characters[charIdx];
    const codePoint = character.value.codePointAt(0);
    if (codePoint !== undefined && codePoint <= 31) {
      if (codePoint === 9) {
        const tabWidth = 8;
        const spacesToNextStop = tabWidth - offsetX % tabWidth;
        for (let i = 0;i < spacesToNextStop && offsetX < screenWidth; i++) {
          setCellAt(screen, offsetX, y, {
            char: " ",
            styleId: stylePool.none,
            width: 0 /* Narrow */,
            hyperlink: undefined
          });
          offsetX++;
        }
      } else if (codePoint === 27) {
        const nextChar = characters[charIdx + 1]?.value;
        const nextCode = nextChar?.codePointAt(0);
        if (nextChar === "(" || nextChar === ")" || nextChar === "*" || nextChar === "+") {
          charIdx += 2;
        } else if (nextChar === "[") {
          charIdx++;
          while (charIdx < characters.length - 1) {
            charIdx++;
            const c = characters[charIdx]?.value.codePointAt(0);
            if (c !== undefined && c >= 64 && c <= 126) {
              break;
            }
          }
        } else if (nextChar === "]" || nextChar === "P" || nextChar === "_" || nextChar === "^" || nextChar === "X") {
          charIdx++;
          while (charIdx < characters.length - 1) {
            charIdx++;
            const c = characters[charIdx]?.value;
            if (c === "\x07") {
              break;
            }
            if (c === "\x1B") {
              const nextC = characters[charIdx + 1]?.value;
              if (nextC === "\\") {
                charIdx++;
                break;
              }
            }
          }
        } else if (nextCode !== undefined && nextCode >= 48 && nextCode <= 126) {
          charIdx++;
        }
      }
      continue;
    }
    const charWidth = character.width;
    if (charWidth === 0) {
      continue;
    }
    const isWideCharacter = charWidth >= 2;
    if (isWideCharacter && offsetX + 2 > screenWidth) {
      setCellAt(screen, offsetX, y, {
        char: " ",
        styleId: stylePool.none,
        width: 3 /* SpacerHead */,
        hyperlink: undefined
      });
      offsetX++;
      continue;
    }
    setCellAt(screen, offsetX, y, {
      char: character.value,
      styleId: character.styleId,
      width: isWideCharacter ? 1 /* Wide */ : 0 /* Narrow */,
      hyperlink: character.hyperlink
    });
    offsetX += isWideCharacter ? 2 : 1;
  }
  return offsetX;
}
var logForDebugging3 = (_message) => {};
var init_output = __esm(() => {
  init_build();
  init_grapheme();
  init_sliceAnsi();
  init_bidi2();
  init_geometry();
  init_screen();
  init_stringWidth();
  init_widest_line();
});

// node_modules/.bun/indent-string@5.0.0/node_modules/indent-string/index.js
function indentString(string, count = 1, options = {}) {
  const {
    indent = " ",
    includeEmptyLines = false
  } = options;
  if (typeof string !== "string") {
    throw new TypeError(`Expected \`input\` to be a \`string\`, got \`${typeof string}\``);
  }
  if (typeof count !== "number") {
    throw new TypeError(`Expected \`count\` to be a \`number\`, got \`${typeof count}\``);
  }
  if (count < 0) {
    throw new RangeError(`Expected \`count\` to be at least 0, got \`${count}\``);
  }
  if (typeof indent !== "string") {
    throw new TypeError(`Expected \`options.indent\` to be a \`string\`, got \`${typeof indent}\``);
  }
  if (count === 0) {
    return string;
  }
  const regex2 = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;
  return string.replace(regex2, indent.repeat(count));
}
var init_indent_string = () => {};

// packages/@ant/ink/src/core/get-max-width.ts
var getMaxWidth = (yogaNode) => {
  return yogaNode.getComputedWidth() - yogaNode.getComputedPadding(LayoutEdge.Left) - yogaNode.getComputedPadding(LayoutEdge.Right) - yogaNode.getComputedBorder(LayoutEdge.Left) - yogaNode.getComputedBorder(LayoutEdge.Right);
}, get_max_width_default;
var init_get_max_width = __esm(() => {
  init_node();
  get_max_width_default = getMaxWidth;
});

// node_modules/.bun/cli-boxes@4.0.1/node_modules/cli-boxes/boxes.json
var boxes_default;
var init_boxes = __esm(() => {
  boxes_default = {
    single: {
      topLeft: "\u250C",
      top: "\u2500",
      topRight: "\u2510",
      right: "\u2502",
      bottomRight: "\u2518",
      bottom: "\u2500",
      bottomLeft: "\u2514",
      left: "\u2502"
    },
    double: {
      topLeft: "\u2554",
      top: "\u2550",
      topRight: "\u2557",
      right: "\u2551",
      bottomRight: "\u255D",
      bottom: "\u2550",
      bottomLeft: "\u255A",
      left: "\u2551"
    },
    round: {
      topLeft: "\u256D",
      top: "\u2500",
      topRight: "\u256E",
      right: "\u2502",
      bottomRight: "\u256F",
      bottom: "\u2500",
      bottomLeft: "\u2570",
      left: "\u2502"
    },
    bold: {
      topLeft: "\u250F",
      top: "\u2501",
      topRight: "\u2513",
      right: "\u2503",
      bottomRight: "\u251B",
      bottom: "\u2501",
      bottomLeft: "\u2517",
      left: "\u2503"
    },
    singleDouble: {
      topLeft: "\u2553",
      top: "\u2500",
      topRight: "\u2556",
      right: "\u2551",
      bottomRight: "\u255C",
      bottom: "\u2500",
      bottomLeft: "\u2559",
      left: "\u2551"
    },
    doubleSingle: {
      topLeft: "\u2552",
      top: "\u2550",
      topRight: "\u2555",
      right: "\u2502",
      bottomRight: "\u255B",
      bottom: "\u2550",
      bottomLeft: "\u2558",
      left: "\u2502"
    },
    classic: {
      topLeft: "+",
      top: "-",
      topRight: "+",
      right: "|",
      bottomRight: "+",
      bottom: "-",
      bottomLeft: "+",
      left: "|"
    },
    arrow: {
      topLeft: "\u2198",
      top: "\u2193",
      topRight: "\u2199",
      right: "\u2190",
      bottomRight: "\u2196",
      bottom: "\u2191",
      bottomLeft: "\u2197",
      left: "\u2192"
    }
  };
});

// node_modules/.bun/cli-boxes@4.0.1/node_modules/cli-boxes/index.js
var cli_boxes_default;
var init_cli_boxes = __esm(() => {
  init_boxes();
  cli_boxes_default = boxes_default;
});

// packages/@ant/ink/src/core/render-border.ts
function embedTextInBorder(borderLine, text, align, offset = 0, borderChar) {
  const textLength = stringWidth(text);
  const borderLength = borderLine.length;
  if (textLength >= borderLength - 2) {
    return ["", text.substring(0, borderLength), ""];
  }
  let position;
  if (align === "center") {
    position = Math.floor((borderLength - textLength) / 2);
  } else if (align === "start") {
    position = offset + 1;
  } else {
    position = borderLength - textLength - offset - 1;
  }
  position = Math.max(1, Math.min(position, borderLength - textLength - 1));
  const before = borderLine.substring(0, 1) + borderChar.repeat(position - 1);
  const after = borderChar.repeat(borderLength - position - textLength - 1) + borderLine.substring(borderLength - 1);
  return [before, text, after];
}
function styleBorderLine(line, color, dim) {
  let styled = applyColor(line, color);
  if (dim) {
    styled = source_default.dim(styled);
  }
  return styled;
}
var CUSTOM_BORDER_STYLES, renderBorder = (x, y, node, output) => {
  if (node.style.borderStyle) {
    const width = Math.floor(node.yogaNode.getComputedWidth());
    const height = Math.floor(node.yogaNode.getComputedHeight());
    const box = typeof node.style.borderStyle === "string" ? CUSTOM_BORDER_STYLES[node.style.borderStyle] ?? cli_boxes_default[node.style.borderStyle] : node.style.borderStyle;
    const topBorderColor = node.style.borderTopColor ?? node.style.borderColor;
    const bottomBorderColor = node.style.borderBottomColor ?? node.style.borderColor;
    const leftBorderColor = node.style.borderLeftColor ?? node.style.borderColor;
    const rightBorderColor = node.style.borderRightColor ?? node.style.borderColor;
    const dimTopBorderColor = node.style.borderTopDimColor ?? node.style.borderDimColor;
    const dimBottomBorderColor = node.style.borderBottomDimColor ?? node.style.borderDimColor;
    const dimLeftBorderColor = node.style.borderLeftDimColor ?? node.style.borderDimColor;
    const dimRightBorderColor = node.style.borderRightDimColor ?? node.style.borderDimColor;
    const showTopBorder = node.style.borderTop !== false;
    const showBottomBorder = node.style.borderBottom !== false;
    const showLeftBorder = node.style.borderLeft !== false;
    const showRightBorder = node.style.borderRight !== false;
    const contentWidth = Math.max(0, width - (showLeftBorder ? 1 : 0) - (showRightBorder ? 1 : 0));
    const topBorderLine = showTopBorder ? (showLeftBorder ? box.topLeft : "") + box.top.repeat(contentWidth) + (showRightBorder ? box.topRight : "") : "";
    let topBorder;
    if (showTopBorder && node.style.borderText?.position === "top") {
      const [before, text, after] = embedTextInBorder(topBorderLine, node.style.borderText.content, node.style.borderText.align, node.style.borderText.offset, box.top);
      topBorder = styleBorderLine(before, topBorderColor, dimTopBorderColor) + text + styleBorderLine(after, topBorderColor, dimTopBorderColor);
    } else if (showTopBorder) {
      topBorder = styleBorderLine(topBorderLine, topBorderColor, dimTopBorderColor);
    }
    let verticalBorderHeight = height;
    if (showTopBorder) {
      verticalBorderHeight -= 1;
    }
    if (showBottomBorder) {
      verticalBorderHeight -= 1;
    }
    verticalBorderHeight = Math.max(0, verticalBorderHeight);
    let leftBorder = (applyColor(box.left, leftBorderColor) + `
`).repeat(verticalBorderHeight);
    if (dimLeftBorderColor) {
      leftBorder = source_default.dim(leftBorder);
    }
    let rightBorder = (applyColor(box.right, rightBorderColor) + `
`).repeat(verticalBorderHeight);
    if (dimRightBorderColor) {
      rightBorder = source_default.dim(rightBorder);
    }
    const bottomBorderLine = showBottomBorder ? (showLeftBorder ? box.bottomLeft : "") + box.bottom.repeat(contentWidth) + (showRightBorder ? box.bottomRight : "") : "";
    let bottomBorder;
    if (showBottomBorder && node.style.borderText?.position === "bottom") {
      const [before, text, after] = embedTextInBorder(bottomBorderLine, node.style.borderText.content, node.style.borderText.align, node.style.borderText.offset, box.bottom);
      bottomBorder = styleBorderLine(before, bottomBorderColor, dimBottomBorderColor) + text + styleBorderLine(after, bottomBorderColor, dimBottomBorderColor);
    } else if (showBottomBorder) {
      bottomBorder = styleBorderLine(bottomBorderLine, bottomBorderColor, dimBottomBorderColor);
    }
    const offsetY = showTopBorder ? 1 : 0;
    if (topBorder) {
      output.write(x, y, topBorder);
    }
    if (showLeftBorder) {
      output.write(x, y + offsetY, leftBorder);
    }
    if (showRightBorder) {
      output.write(x + width - 1, y + offsetY, rightBorder);
    }
    if (bottomBorder) {
      output.write(x, y + height - 1, bottomBorder);
    }
  }
}, render_border_default;
var init_render_border = __esm(() => {
  init_source();
  init_cli_boxes();
  init_colorize();
  init_stringWidth();
  CUSTOM_BORDER_STYLES = {
    dashed: {
      top: "\u254C",
      left: "\u254E",
      right: "\u254E",
      bottom: "\u254C",
      topLeft: " ",
      topRight: " ",
      bottomLeft: " ",
      bottomRight: " "
    }
  };
  render_border_default = renderBorder;
});

// packages/@ant/ink/src/core/render-node-to-output.ts
function isXtermJsHost() {
  return process.env.TERM_PROGRAM === "vscode" || isXtermJs();
}
function resetLayoutShifted() {
  layoutShifted = false;
}
function didLayoutShift() {
  return layoutShifted;
}
function resetScrollHint() {
  scrollHint = null;
  absoluteRectsPrev = absoluteRectsCur;
  absoluteRectsCur = [];
}
function getScrollHint() {
  return scrollHint;
}
function resetScrollDrainNode() {
  scrollDrainNode = null;
}
function getScrollDrainNode() {
  return scrollDrainNode;
}
function consumeFollowScroll() {
  const f = followScroll;
  followScroll = null;
  return f;
}
function drainAdaptive(node, pending, innerHeight) {
  const sign = pending > 0 ? 1 : -1;
  let abs = Math.abs(pending);
  let applied = 0;
  if (abs > SCROLL_MAX_PENDING) {
    applied += sign * (abs - SCROLL_MAX_PENDING);
    abs = SCROLL_MAX_PENDING;
  }
  const step = abs <= SCROLL_INSTANT_THRESHOLD ? abs : abs < SCROLL_HIGH_PENDING ? SCROLL_STEP_MED : SCROLL_STEP_HIGH;
  applied += sign * step;
  const rem = abs - step;
  const cap = Math.max(1, innerHeight - 1);
  const totalAbs = Math.abs(applied);
  if (totalAbs > cap) {
    const excess = totalAbs - cap;
    node.pendingScrollDelta = sign * (rem + excess);
    return sign * cap;
  }
  node.pendingScrollDelta = rem > 0 ? sign * rem : undefined;
  return applied;
}
function drainProportional(node, pending, innerHeight) {
  const abs = Math.abs(pending);
  const cap = Math.max(1, innerHeight - 1);
  const step = Math.min(cap, Math.max(SCROLL_MIN_PER_FRAME, abs * 3 >> 2));
  if (abs <= step) {
    node.pendingScrollDelta = undefined;
    return pending;
  }
  const applied = pending > 0 ? step : -step;
  node.pendingScrollDelta = pending - applied;
  return applied;
}
function wrapWithOsc8Link(text, url) {
  return `${OSC3}8;;${url}${BEL3}${text}${OSC3}8;;${BEL3}`;
}
function buildCharToSegmentMap(segments) {
  const map = [];
  for (let i = 0;i < segments.length; i++) {
    const len = segments[i].text.length;
    for (let j = 0;j < len; j++) {
      map.push(i);
    }
  }
  return map;
}
function applyStylesToWrappedText(wrappedPlain, segments, charToSegment, originalPlain, trimEnabled = false) {
  const lines = wrappedPlain.split(`
`);
  const resultLines = [];
  let charIndex = 0;
  for (let lineIdx = 0;lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (trimEnabled && line.length > 0) {
      const lineStartsWithWhitespace = /\s/.test(line[0]);
      const originalHasWhitespace = charIndex < originalPlain.length && /\s/.test(originalPlain[charIndex]);
      if (originalHasWhitespace && !lineStartsWithWhitespace) {
        while (charIndex < originalPlain.length && /\s/.test(originalPlain[charIndex])) {
          charIndex++;
        }
      }
    }
    let styledLine = "";
    let runStart = 0;
    let runSegmentIndex = charToSegment[charIndex] ?? 0;
    for (let i = 0;i < line.length; i++) {
      const currentSegmentIndex = charToSegment[charIndex] ?? runSegmentIndex;
      if (currentSegmentIndex !== runSegmentIndex) {
        const runText2 = line.slice(runStart, i);
        const segment2 = segments[runSegmentIndex];
        if (segment2) {
          let styled = applyTextStyles(runText2, segment2.styles);
          if (segment2.hyperlink) {
            styled = wrapWithOsc8Link(styled, segment2.hyperlink);
          }
          styledLine += styled;
        } else {
          styledLine += runText2;
        }
        runStart = i;
        runSegmentIndex = currentSegmentIndex;
      }
      charIndex++;
    }
    const runText = line.slice(runStart);
    const segment = segments[runSegmentIndex];
    if (segment) {
      let styled = applyTextStyles(runText, segment.styles);
      if (segment.hyperlink) {
        styled = wrapWithOsc8Link(styled, segment.hyperlink);
      }
      styledLine += styled;
    } else {
      styledLine += runText;
    }
    resultLines.push(styledLine);
    if (charIndex < originalPlain.length && originalPlain[charIndex] === `
`) {
      charIndex++;
    }
    if (trimEnabled && lineIdx < lines.length - 1) {
      const nextLine = lines[lineIdx + 1];
      const nextLineFirstChar = nextLine.length > 0 ? nextLine[0] : null;
      while (charIndex < originalPlain.length && /\s/.test(originalPlain[charIndex])) {
        if (nextLineFirstChar !== null && originalPlain[charIndex] === nextLineFirstChar) {
          break;
        }
        charIndex++;
      }
    }
  }
  return resultLines.join(`
`);
}
function wrapWithSoftWrap(plainText, maxWidth, textWrap) {
  if (textWrap !== "wrap" && textWrap !== "wrap-trim") {
    return {
      wrapped: wrapText(plainText, maxWidth, textWrap),
      softWrap: undefined
    };
  }
  const origLines = plainText.split(`
`);
  const outLines = [];
  const softWrap = [];
  for (const orig of origLines) {
    const pieces = wrapText(orig, maxWidth, textWrap).split(`
`);
    for (let i = 0;i < pieces.length; i++) {
      outLines.push(pieces[i]);
      softWrap.push(i > 0);
    }
  }
  return { wrapped: outLines.join(`
`), softWrap };
}
function applyPaddingToText(node, text, softWrap) {
  const yogaNode = node.childNodes[0]?.yogaNode;
  if (yogaNode) {
    const offsetX = yogaNode.getComputedLeft();
    const offsetY = yogaNode.getComputedTop();
    text = `
`.repeat(offsetY) + indentString(text, offsetX);
    if (softWrap && offsetY > 0) {
      softWrap.unshift(...Array(offsetY).fill(false));
    }
  }
  return text;
}
function renderNodeToOutput(node, output, {
  offsetX = 0,
  offsetY = 0,
  prevScreen,
  skipSelfBlit = false,
  inheritedBackgroundColor
}) {
  const { yogaNode } = node;
  if (yogaNode) {
    if (yogaNode.getDisplay() === LayoutDisplay.None) {
      if (node.dirty) {
        const cached2 = nodeCache.get(node);
        if (cached2) {
          output.clear({
            x: Math.floor(cached2.x),
            y: Math.floor(cached2.y),
            width: Math.floor(cached2.width),
            height: Math.floor(cached2.height)
          });
          dropSubtreeCache(node);
          layoutShifted = true;
        }
      }
      return;
    }
    const x = offsetX + yogaNode.getComputedLeft();
    const yogaTop = yogaNode.getComputedTop();
    let y = offsetY + yogaTop;
    const width = yogaNode.getComputedWidth();
    const height = yogaNode.getComputedHeight();
    if (y < 0 && node.style.position === "absolute") {
      y = 0;
    }
    const cached = nodeCache.get(node);
    if (!node.dirty && !skipSelfBlit && node.pendingScrollDelta === undefined && cached && cached.x === x && cached.y === y && cached.width === width && cached.height === height && prevScreen) {
      const fx = Math.floor(x);
      const fy = Math.floor(y);
      const fw = Math.floor(width);
      const fh = Math.floor(height);
      output.blit(prevScreen, fx, fy, fw, fh);
      if (node.style.position === "absolute") {
        absoluteRectsCur.push(cached);
      }
      blitEscapingAbsoluteDescendants(node, output, prevScreen, fx, fy, fw, fh);
      return;
    }
    const positionChanged = cached !== undefined && (cached.x !== x || cached.y !== y || cached.width !== width || cached.height !== height);
    if (positionChanged) {
      layoutShifted = true;
    }
    if (cached && (node.dirty || positionChanged)) {
      output.clear({
        x: Math.floor(cached.x),
        y: Math.floor(cached.y),
        width: Math.floor(cached.width),
        height: Math.floor(cached.height)
      }, node.style.position === "absolute");
    }
    const clears = pendingClears.get(node);
    const hasRemovedChild = clears !== undefined;
    if (hasRemovedChild) {
      layoutShifted = true;
      for (const rect2 of clears) {
        output.clear({
          x: Math.floor(rect2.x),
          y: Math.floor(rect2.y),
          width: Math.floor(rect2.width),
          height: Math.floor(rect2.height)
        });
      }
      pendingClears.delete(node);
    }
    if (height === 0 && siblingSharesY(node, yogaNode)) {
      nodeCache.set(node, { x, y, width, height, top: yogaTop });
      node.dirty = false;
      return;
    }
    if (node.nodeName === "ink-raw-ansi") {
      const text = node.attributes["rawText"];
      if (text) {
        output.write(x, y, text);
      }
    } else if (node.nodeName === "ink-text") {
      const segments = squashTextNodesToSegments(node, inheritedBackgroundColor ? { backgroundColor: inheritedBackgroundColor } : undefined);
      const plainText = segments.map((s) => s.text).join("");
      if (plainText.length > 0) {
        const maxWidth = Math.min(get_max_width_default(yogaNode), output.width - x);
        const textWrap = node.style.textWrap ?? "wrap";
        const needsWrapping = widestLine(plainText) > maxWidth;
        let text;
        let softWrap;
        if (needsWrapping && segments.length === 1) {
          const segment = segments[0];
          const w = wrapWithSoftWrap(plainText, maxWidth, textWrap);
          softWrap = w.softWrap;
          text = w.wrapped.split(`
`).map((line) => {
            let styled = applyTextStyles(line, segment.styles);
            if (segment.hyperlink) {
              styled = wrapWithOsc8Link(styled, segment.hyperlink);
            }
            return styled;
          }).join(`
`);
        } else if (needsWrapping) {
          const w = wrapWithSoftWrap(plainText, maxWidth, textWrap);
          softWrap = w.softWrap;
          const charToSegment = buildCharToSegmentMap(segments);
          text = applyStylesToWrappedText(w.wrapped, segments, charToSegment, plainText, textWrap === "wrap-trim");
        } else {
          text = segments.map((segment) => {
            let styledText = applyTextStyles(segment.text, segment.styles);
            if (segment.hyperlink) {
              styledText = wrapWithOsc8Link(styledText, segment.hyperlink);
            }
            return styledText;
          }).join("");
        }
        text = applyPaddingToText(node, text, softWrap);
        output.write(x, y, text, softWrap);
      }
    } else if (node.nodeName === "ink-box") {
      const boxBackgroundColor = node.style.backgroundColor ?? inheritedBackgroundColor;
      if (node.style.noSelect) {
        const boxX = Math.floor(x);
        const fromEdge = node.style.noSelect === "from-left-edge";
        output.noSelect({
          x: fromEdge ? 0 : boxX,
          y: Math.floor(y),
          width: fromEdge ? boxX + Math.floor(width) : Math.floor(width),
          height: Math.floor(height)
        });
      }
      const overflowX = node.style.overflowX ?? node.style.overflow;
      const overflowY = node.style.overflowY ?? node.style.overflow;
      const clipHorizontally = overflowX === "hidden" || overflowX === "scroll";
      const clipVertically = overflowY === "hidden" || overflowY === "scroll";
      const isScrollY = overflowY === "scroll";
      const needsClip = clipHorizontally || clipVertically;
      let y1;
      let y2;
      if (needsClip) {
        const x1 = clipHorizontally ? x + yogaNode.getComputedBorder(LayoutEdge.Left) : undefined;
        const x2 = clipHorizontally ? x + yogaNode.getComputedWidth() - yogaNode.getComputedBorder(LayoutEdge.Right) : undefined;
        y1 = clipVertically ? y + yogaNode.getComputedBorder(LayoutEdge.Top) : undefined;
        y2 = clipVertically ? y + yogaNode.getComputedHeight() - yogaNode.getComputedBorder(LayoutEdge.Bottom) : undefined;
        output.clip({ x1, x2, y1, y2 });
      }
      if (isScrollY) {
        const padTop = yogaNode.getComputedPadding(LayoutEdge.Top);
        const innerHeight = Math.max(0, (y2 ?? y + height) - (y1 ?? y) - padTop - yogaNode.getComputedPadding(LayoutEdge.Bottom));
        const content = node.childNodes.find((c) => c.yogaNode);
        const contentYoga = content?.yogaNode;
        const scrollHeight = contentYoga?.getComputedHeight() ?? 0;
        const prevScrollHeight = node.scrollHeight ?? scrollHeight;
        const prevInnerHeight = node.scrollViewportHeight ?? innerHeight;
        node.scrollHeight = scrollHeight;
        node.scrollViewportHeight = innerHeight;
        node.scrollViewportTop = (y1 ?? y) + padTop;
        const maxScroll = Math.max(0, scrollHeight - innerHeight);
        if (node.scrollAnchor) {
          const anchorTop = node.scrollAnchor.el.yogaNode?.getComputedTop();
          if (anchorTop != null) {
            node.scrollTop = anchorTop + node.scrollAnchor.offset;
            node.pendingScrollDelta = undefined;
          }
          node.scrollAnchor = undefined;
        }
        const scrollTopBeforeFollow = node.scrollTop ?? 0;
        const sticky = node.stickyScroll ?? Boolean(node.attributes["stickyScroll"]);
        const prevMaxScroll = Math.max(0, prevScrollHeight - prevInnerHeight);
        const grew = scrollHeight >= prevScrollHeight;
        const atBottom = sticky || grew && scrollTopBeforeFollow >= prevMaxScroll;
        if (atBottom && (node.pendingScrollDelta ?? 0) >= 0) {
          node.scrollTop = maxScroll;
          node.pendingScrollDelta = undefined;
          if (node.stickyScroll === false && scrollTopBeforeFollow >= prevMaxScroll) {
            node.stickyScroll = true;
          }
        }
        const followDelta = (node.scrollTop ?? 0) - scrollTopBeforeFollow;
        if (followDelta > 0) {
          const vpTop = node.scrollViewportTop ?? 0;
          followScroll = {
            delta: followDelta,
            viewportTop: vpTop,
            viewportBottom: vpTop + innerHeight - 1
          };
        }
        let cur = node.scrollTop ?? 0;
        const pending = node.pendingScrollDelta;
        const cMin = node.scrollClampMin;
        const cMax = node.scrollClampMax;
        const haveClamp = cMin !== undefined && cMax !== undefined;
        if (pending !== undefined && pending !== 0) {
          const pastClamp = haveClamp && (pending < 0 && cur < cMin || pending > 0 && cur > cMax);
          const eff = pastClamp ? Math.min(4, innerHeight >> 3) : innerHeight;
          cur += isXtermJsHost() ? drainAdaptive(node, pending, eff) : drainProportional(node, pending, eff);
        } else if (pending === 0) {
          node.pendingScrollDelta = undefined;
        }
        let scrollTop = Math.max(0, Math.min(cur, maxScroll));
        const clamped = haveClamp ? Math.max(cMin, Math.min(scrollTop, cMax)) : scrollTop;
        node.scrollTop = scrollTop;
        if (scrollTop !== cur)
          node.pendingScrollDelta = undefined;
        if (node.pendingScrollDelta !== undefined)
          scrollDrainNode = node;
        scrollTop = clamped;
        if (content && contentYoga) {
          const contentX = x + contentYoga.getComputedLeft();
          const contentY = y + contentYoga.getComputedTop() - scrollTop;
          const contentCached = nodeCache.get(content);
          let hint = null;
          if (contentCached && contentCached.y !== contentY) {
            const delta = contentCached.y - contentY;
            const regionTop = Math.floor(y + contentYoga.getComputedTop());
            const regionBottom = regionTop + innerHeight - 1;
            if (cached?.y === y && cached.height === height && innerHeight > 0 && Math.abs(delta) < innerHeight) {
              hint = { top: regionTop, bottom: regionBottom, delta };
              scrollHint = hint;
            } else {
              layoutShifted = true;
            }
          }
          const scrollHeight2 = contentYoga.getComputedHeight();
          const prevHeight = contentCached?.height ?? scrollHeight2;
          const heightDelta = scrollHeight2 - prevHeight;
          const safeForFastPath = !hint || heightDelta === 0 || hint.delta > 0 && heightDelta === hint.delta;
          if (!safeForFastPath)
            scrollHint = null;
          if (hint && prevScreen && safeForFastPath) {
            const { top, bottom, delta } = hint;
            const w = Math.floor(width);
            output.blit(prevScreen, Math.floor(x), top, w, bottom - top + 1);
            output.shift(top, bottom, delta);
            const edgeTop = delta > 0 ? bottom - delta + 1 : top;
            const edgeBottom = delta > 0 ? bottom : top - delta - 1;
            output.clear({
              x: Math.floor(x),
              y: edgeTop,
              width: w,
              height: edgeBottom - edgeTop + 1
            });
            output.clip({
              x1: undefined,
              x2: undefined,
              y1: edgeTop,
              y2: edgeBottom + 1
            });
            const dirtyChildren = content.dirty ? new Set(content.childNodes.filter((c) => c.dirty)) : null;
            renderScrolledChildren(content, output, contentX, contentY, hasRemovedChild, undefined, edgeTop - contentY, edgeBottom + 1 - contentY, boxBackgroundColor, true);
            output.unclip();
            if (dirtyChildren) {
              const edgeTopLocal = edgeTop - contentY;
              const edgeBottomLocal = edgeBottom + 1 - contentY;
              const spaces2 = " ".repeat(w);
              let cumHeightShift = 0;
              for (const childNode of content.childNodes) {
                const childElem = childNode;
                const isDirty = dirtyChildren.has(childNode);
                if (!isDirty && cumHeightShift === 0) {
                  if (nodeCache.has(childElem))
                    continue;
                }
                const cy = childElem.yogaNode;
                if (!cy)
                  continue;
                const childTop = cy.getComputedTop();
                const childH = cy.getComputedHeight();
                const childBottom = childTop + childH;
                if (isDirty) {
                  const prev = nodeCache.get(childElem);
                  cumHeightShift += childH - (prev ? prev.height : 0);
                }
                if (childBottom <= scrollTop || childTop >= scrollTop + innerHeight)
                  continue;
                if (childTop >= edgeTopLocal && childBottom <= edgeBottomLocal)
                  continue;
                const screenY = Math.floor(contentY + childTop);
                if (!isDirty) {
                  const childCached = nodeCache.get(childElem);
                  if (childCached && Math.floor(childCached.y) - delta === screenY) {
                    continue;
                  }
                }
                const screenBottom = Math.min(Math.floor(contentY + childBottom), Math.floor((y1 ?? y) + padTop + innerHeight));
                if (screenY < screenBottom) {
                  const fill = Array(screenBottom - screenY).fill(spaces2).join(`
`);
                  output.write(Math.floor(x), screenY, fill);
                  output.clip({
                    x1: undefined,
                    x2: undefined,
                    y1: screenY,
                    y2: screenBottom
                  });
                  renderNodeToOutput(childElem, output, {
                    offsetX: contentX,
                    offsetY: contentY,
                    prevScreen: undefined,
                    inheritedBackgroundColor: boxBackgroundColor
                  });
                  output.unclip();
                }
              }
            }
            const spaces = absoluteRectsPrev.length ? " ".repeat(w) : "";
            for (const r of absoluteRectsPrev) {
              if (r.y >= bottom + 1 || r.y + r.height <= top)
                continue;
              const shiftedTop = Math.max(top, Math.floor(r.y) - delta);
              const shiftedBottom = Math.min(bottom + 1, Math.floor(r.y + r.height) - delta);
              if (shiftedTop >= edgeTop && shiftedBottom <= edgeBottom + 1)
                continue;
              if (shiftedTop >= shiftedBottom)
                continue;
              const fill = Array(shiftedBottom - shiftedTop).fill(spaces).join(`
`);
              output.write(Math.floor(x), shiftedTop, fill);
              output.clip({
                x1: undefined,
                x2: undefined,
                y1: shiftedTop,
                y2: shiftedBottom
              });
              renderScrolledChildren(content, output, contentX, contentY, hasRemovedChild, undefined, shiftedTop - contentY, shiftedBottom - contentY, boxBackgroundColor, true);
              output.unclip();
            }
          } else {
            const scrolled = contentCached && contentCached.y !== contentY;
            if (scrolled && y1 !== undefined && y2 !== undefined) {
              output.clear({
                x: Math.floor(x),
                y: Math.floor(y1),
                width: Math.floor(width),
                height: Math.floor(y2 - y1)
              });
            }
            renderScrolledChildren(content, output, contentX, contentY, hasRemovedChild, scrolled || positionChanged ? undefined : prevScreen, scrollTop, scrollTop + innerHeight, boxBackgroundColor);
          }
          nodeCache.set(content, {
            x: contentX,
            y: contentY,
            width: contentYoga.getComputedWidth(),
            height: contentYoga.getComputedHeight()
          });
          content.dirty = false;
        }
      } else {
        const ownBackgroundColor = node.style.backgroundColor;
        if (ownBackgroundColor || node.style.opaque) {
          const borderLeft = yogaNode.getComputedBorder(LayoutEdge.Left);
          const borderRight = yogaNode.getComputedBorder(LayoutEdge.Right);
          const borderTop = yogaNode.getComputedBorder(LayoutEdge.Top);
          const borderBottom = yogaNode.getComputedBorder(LayoutEdge.Bottom);
          const innerWidth = Math.floor(width) - borderLeft - borderRight;
          const innerHeight = Math.floor(height) - borderTop - borderBottom;
          if (innerWidth > 0 && innerHeight > 0) {
            const spaces = " ".repeat(innerWidth);
            const fillLine = ownBackgroundColor ? applyTextStyles(spaces, { backgroundColor: ownBackgroundColor }) : spaces;
            const fill = Array(innerHeight).fill(fillLine).join(`
`);
            output.write(x + borderLeft, y + borderTop, fill);
          }
        }
        renderChildren(node, output, x, y, hasRemovedChild, ownBackgroundColor || node.style.opaque ? undefined : prevScreen, boxBackgroundColor);
      }
      if (needsClip) {
        output.unclip();
      }
      render_border_default(x, y, node, output);
    } else if (node.nodeName === "ink-root") {
      renderChildren(node, output, x, y, hasRemovedChild, prevScreen, inheritedBackgroundColor);
    }
    const rect = { x, y, width, height, top: yogaTop };
    nodeCache.set(node, rect);
    if (node.style.position === "absolute") {
      absoluteRectsCur.push(rect);
    }
    node.dirty = false;
  }
}
function renderChildren(node, output, offsetX, offsetY, hasRemovedChild, prevScreen, inheritedBackgroundColor) {
  let seenDirtyChild = false;
  let seenDirtyClipped = false;
  for (const childNode of node.childNodes) {
    const childElem = childNode;
    const wasDirty = childElem.dirty;
    const isAbsolute = childElem.style.position === "absolute";
    renderNodeToOutput(childElem, output, {
      offsetX,
      offsetY,
      prevScreen: hasRemovedChild || seenDirtyChild ? undefined : prevScreen,
      skipSelfBlit: seenDirtyClipped && isAbsolute && !childElem.style.opaque && childElem.style.backgroundColor === undefined,
      inheritedBackgroundColor
    });
    if (wasDirty && !seenDirtyChild) {
      if (!clipsBothAxes(childElem) || isAbsolute) {
        seenDirtyChild = true;
      } else {
        seenDirtyClipped = true;
      }
    }
  }
}
function clipsBothAxes(node) {
  const ox = node.style.overflowX ?? node.style.overflow;
  const oy = node.style.overflowY ?? node.style.overflow;
  return (ox === "hidden" || ox === "scroll") && (oy === "hidden" || oy === "scroll");
}
function siblingSharesY(node, yogaNode) {
  const parent = node.parentNode;
  if (!parent)
    return false;
  const myTop = yogaNode.getComputedTop();
  const siblings = parent.childNodes;
  const idx = siblings.indexOf(node);
  for (let i = idx + 1;i < siblings.length; i++) {
    const sib = siblings[i].yogaNode;
    if (!sib)
      continue;
    return sib.getComputedTop() === myTop;
  }
  for (let i = idx - 1;i >= 0; i--) {
    const sib = siblings[i].yogaNode;
    if (!sib)
      continue;
    return sib.getComputedTop() === myTop;
  }
  return false;
}
function blitEscapingAbsoluteDescendants(node, output, prevScreen, px, py, pw, ph) {
  const pr = px + pw;
  const pb = py + ph;
  for (const child of node.childNodes) {
    if (child.nodeName === "#text")
      continue;
    const elem = child;
    if (elem.style.position === "absolute") {
      const cached = nodeCache.get(elem);
      if (cached) {
        absoluteRectsCur.push(cached);
        const cx = Math.floor(cached.x);
        const cy = Math.floor(cached.y);
        const cw = Math.floor(cached.width);
        const ch = Math.floor(cached.height);
        if (cx < px || cy < py || cx + cw > pr || cy + ch > pb) {
          output.blit(prevScreen, cx, cy, cw, ch);
        }
      }
    }
    blitEscapingAbsoluteDescendants(elem, output, prevScreen, px, py, pw, ph);
  }
}
function renderScrolledChildren(node, output, offsetX, offsetY, hasRemovedChild, prevScreen, scrollTopY, scrollBottomY, inheritedBackgroundColor, preserveCulledCache = false) {
  let seenDirtyChild = false;
  let cumHeightShift = 0;
  for (const childNode of node.childNodes) {
    const childElem = childNode;
    const cy = childElem.yogaNode;
    if (cy) {
      const cached = nodeCache.get(childElem);
      let top;
      let height;
      if (cached?.top !== undefined && !childElem.dirty && cumHeightShift === 0) {
        top = cached.top;
        height = cached.height;
      } else {
        top = cy.getComputedTop();
        height = cy.getComputedHeight();
        if (childElem.dirty) {
          cumHeightShift += height - (cached ? cached.height : 0);
        }
        if (cached)
          cached.top = top;
      }
      const bottom = top + height;
      if (bottom <= scrollTopY || top >= scrollBottomY) {
        if (!preserveCulledCache)
          dropSubtreeCache(childElem);
        continue;
      }
    }
    const wasDirty = childElem.dirty;
    renderNodeToOutput(childElem, output, {
      offsetX,
      offsetY,
      prevScreen: hasRemovedChild || seenDirtyChild ? undefined : prevScreen,
      inheritedBackgroundColor
    });
    if (wasDirty) {
      seenDirtyChild = true;
    }
  }
}
function dropSubtreeCache(node) {
  nodeCache.delete(node);
  for (const child of node.childNodes) {
    if (child.nodeName !== "#text") {
      dropSubtreeCache(child);
    }
  }
}
var layoutShifted = false, scrollHint = null, absoluteRectsPrev, absoluteRectsCur, scrollDrainNode = null, followScroll = null, SCROLL_MIN_PER_FRAME = 4, SCROLL_INSTANT_THRESHOLD = 5, SCROLL_HIGH_PENDING = 12, SCROLL_STEP_MED = 2, SCROLL_STEP_HIGH = 3, SCROLL_MAX_PENDING = 30, OSC3 = "\x1B]", BEL3 = "\x07", render_node_to_output_default;
var init_render_node_to_output = __esm(() => {
  init_indent_string();
  init_colorize();
  init_get_max_width();
  init_node();
  init_node_cache();
  init_render_border();
  init_squash_text_nodes();
  init_terminal();
  init_widest_line();
  init_wrap_text();
  absoluteRectsPrev = [];
  absoluteRectsCur = [];
  render_node_to_output_default = renderNodeToOutput;
});

// packages/@ant/ink/src/core/render-to-screen.ts
function scanPositions(screen, query) {
  const lq = query.toLowerCase();
  if (!lq)
    return [];
  const qlen = lq.length;
  const w = screen.width;
  const h = screen.height;
  const noSelect = screen.noSelect;
  const positions = [];
  const t0 = performance.now();
  for (let row = 0;row < h; row++) {
    const rowOff = row * w;
    let text = "";
    const colOf = [];
    const codeUnitToCell = [];
    for (let col = 0;col < w; col++) {
      const idx = rowOff + col;
      const cell = cellAtIndex(screen, idx);
      if (cell.width === 2 /* SpacerTail */ || cell.width === 3 /* SpacerHead */ || noSelect[idx] === 1) {
        continue;
      }
      const lc = cell.char.toLowerCase();
      const cellIdx = colOf.length;
      for (let i = 0;i < lc.length; i++) {
        codeUnitToCell.push(cellIdx);
      }
      text += lc;
      colOf.push(col);
    }
    let pos = text.indexOf(lq);
    while (pos >= 0) {
      const startCi = codeUnitToCell[pos];
      const endCi = codeUnitToCell[pos + qlen - 1];
      const col = colOf[startCi];
      const endCol = colOf[endCi] + 1;
      positions.push({ row, col, len: endCol - col });
      pos = text.indexOf(lq, pos + qlen);
    }
  }
  timing.scan += performance.now() - t0;
  return positions;
}
function applyPositionedHighlight(screen, stylePool, positions, rowOffset, currentIdx) {
  if (currentIdx < 0 || currentIdx >= positions.length)
    return false;
  const p = positions[currentIdx];
  const row = p.row + rowOffset;
  if (row < 0 || row >= screen.height)
    return false;
  const transform = (id) => stylePool.withCurrentMatch(id);
  const rowOff = row * screen.width;
  for (let col = p.col;col < p.col + p.len; col++) {
    if (col < 0 || col >= screen.width)
      continue;
    const cell = cellAtIndex(screen, rowOff + col);
    setCellStyleId(screen, col, row, transform(cell.styleId));
  }
  return true;
}
var import_constants3, timing;
var init_render_to_screen = __esm(() => {
  init_dom();
  init_focus();
  init_output();
  init_reconciler();
  init_render_node_to_output();
  init_screen();
  import_constants3 = __toESM(require_constants(), 1);
  timing = { reconcile: 0, yoga: 0, paint: 0, scan: 0, calls: 0 };
});

// packages/@ant/ink/src/core/renderer.ts
function createRenderer(node, stylePool) {
  let output;
  return (options) => {
    const { frontFrame, backFrame, isTTY, terminalWidth, terminalRows } = options;
    const prevScreen = frontFrame.screen;
    const backScreen = backFrame.screen;
    const charPool = backScreen.charPool;
    const hyperlinkPool = backScreen.hyperlinkPool;
    const computedHeight = node.yogaNode?.getComputedHeight();
    const computedWidth = node.yogaNode?.getComputedWidth();
    const hasInvalidHeight = computedHeight === undefined || !Number.isFinite(computedHeight) || computedHeight < 0;
    const hasInvalidWidth = computedWidth === undefined || !Number.isFinite(computedWidth) || computedWidth < 0;
    if (!node.yogaNode || hasInvalidHeight || hasInvalidWidth) {
      if (node.yogaNode && (hasInvalidHeight || hasInvalidWidth)) {
        logForDebugging4(`Invalid yoga dimensions: width=${computedWidth}, height=${computedHeight}, ` + `childNodes=${node.childNodes.length}, terminalWidth=${terminalWidth}, terminalRows=${terminalRows}`);
      }
      return {
        screen: createScreen(terminalWidth, 0, stylePool, charPool, hyperlinkPool),
        viewport: { width: terminalWidth, height: terminalRows },
        cursor: { x: 0, y: 0, visible: true }
      };
    }
    const width = Math.floor(node.yogaNode.getComputedWidth());
    const yogaHeight = Math.floor(node.yogaNode.getComputedHeight());
    const height = options.altScreen ? terminalRows : yogaHeight;
    if (options.altScreen && yogaHeight > terminalRows) {
      logForDebugging4(`alt-screen: yoga height ${yogaHeight} > terminalRows ${terminalRows} \u2014 ` + `something is rendering outside <AlternateScreen>. Overflow clipped.`, { level: "warn" });
    }
    const screen = backScreen ?? createScreen(width, height, stylePool, charPool, hyperlinkPool);
    if (output) {
      output.reset(width, height, screen);
    } else {
      output = new Output({ width, height, stylePool, screen });
    }
    resetLayoutShifted();
    resetScrollHint();
    resetScrollDrainNode();
    const absoluteRemoved = consumeAbsoluteRemovedFlag();
    render_node_to_output_default(node, output, {
      prevScreen: absoluteRemoved || options.prevFrameContaminated ? undefined : prevScreen
    });
    const renderedScreen = output.get();
    const drainNode = getScrollDrainNode();
    if (drainNode)
      markDirty(drainNode);
    return {
      scrollHint: options.altScreen ? getScrollHint() : null,
      scrollDrainPending: drainNode !== null,
      screen: renderedScreen,
      viewport: {
        width: terminalWidth,
        height: options.altScreen ? terminalRows + 1 : terminalRows
      },
      cursor: {
        x: 0,
        y: options.altScreen ? Math.max(0, Math.min(screen.height, terminalRows) - 1) : screen.height,
        visible: !isTTY || screen.height === 0
      }
    };
  };
}
var logForDebugging4 = (_message, _opts) => {};
var init_renderer = __esm(() => {
  init_dom();
  init_node_cache();
  init_output();
  init_render_node_to_output();
  init_screen();
});

// packages/@ant/ink/src/core/searchHighlight.ts
function applySearchHighlight(screen, query, stylePool) {
  if (!query)
    return false;
  const lq = query.toLowerCase();
  const qlen = lq.length;
  const w = screen.width;
  const noSelect = screen.noSelect;
  const height = screen.height;
  let applied = false;
  for (let row = 0;row < height; row++) {
    const rowOff = row * w;
    let text = "";
    const colOf = [];
    const codeUnitToCell = [];
    for (let col = 0;col < w; col++) {
      const idx = rowOff + col;
      const cell = cellAtIndex(screen, idx);
      if (cell.width === 2 /* SpacerTail */ || cell.width === 3 /* SpacerHead */ || noSelect[idx] === 1) {
        continue;
      }
      const lc = cell.char.toLowerCase();
      const cellIdx = colOf.length;
      for (let i = 0;i < lc.length; i++) {
        codeUnitToCell.push(cellIdx);
      }
      text += lc;
      colOf.push(col);
    }
    let pos = text.indexOf(lq);
    while (pos >= 0) {
      applied = true;
      const startCi = codeUnitToCell[pos];
      const endCi = codeUnitToCell[pos + qlen - 1];
      for (let ci = startCi;ci <= endCi; ci++) {
        const col = colOf[ci];
        const cell = cellAtIndex(screen, rowOff + col);
        setCellStyleId(screen, col, row, stylePool.withInverse(cell.styleId));
      }
      pos = text.indexOf(lq, pos + qlen);
    }
  }
  return applied;
}
var init_searchHighlight = __esm(() => {
  init_screen();
});

// packages/@ant/ink/src/hooks/useTerminalNotification.ts
function useTerminalNotification() {
  const writeRaw = import_react9.useContext(TerminalWriteContext);
  if (!writeRaw) {
    throw new Error("useTerminalNotification must be used within TerminalWriteProvider");
  }
  const notifyITerm2 = import_react9.useCallback(({ message, title }) => {
    const displayString = title ? `${title}:
${message}` : message;
    writeRaw(wrapForMultiplexer(osc(OSC2.ITERM2, `

${displayString}`)));
  }, [writeRaw]);
  const notifyKitty = import_react9.useCallback(({
    message,
    title,
    id
  }) => {
    writeRaw(wrapForMultiplexer(osc(OSC2.KITTY, `i=${id}:d=0:p=title`, title)));
    writeRaw(wrapForMultiplexer(osc(OSC2.KITTY, `i=${id}:p=body`, message)));
    writeRaw(wrapForMultiplexer(osc(OSC2.KITTY, `i=${id}:d=1:a=focus`, "")));
  }, [writeRaw]);
  const notifyGhostty = import_react9.useCallback(({ message, title }) => {
    writeRaw(wrapForMultiplexer(osc(OSC2.GHOSTTY, "notify", title, message)));
  }, [writeRaw]);
  const notifyBell = import_react9.useCallback(() => {
    writeRaw(BEL);
  }, [writeRaw]);
  const progress = import_react9.useCallback((state, percentage) => {
    if (!isProgressReportingAvailable()) {
      return;
    }
    if (!state) {
      writeRaw(wrapForMultiplexer(osc(OSC2.ITERM2, ITERM2.PROGRESS, PROGRESS.CLEAR, "")));
      return;
    }
    const pct = Math.max(0, Math.min(100, Math.round(percentage ?? 0)));
    switch (state) {
      case "completed":
        writeRaw(wrapForMultiplexer(osc(OSC2.ITERM2, ITERM2.PROGRESS, PROGRESS.CLEAR, "")));
        break;
      case "error":
        writeRaw(wrapForMultiplexer(osc(OSC2.ITERM2, ITERM2.PROGRESS, PROGRESS.ERROR, pct)));
        break;
      case "indeterminate":
        writeRaw(wrapForMultiplexer(osc(OSC2.ITERM2, ITERM2.PROGRESS, PROGRESS.INDETERMINATE, "")));
        break;
      case "running":
        writeRaw(wrapForMultiplexer(osc(OSC2.ITERM2, ITERM2.PROGRESS, PROGRESS.SET, pct)));
        break;
      case null:
        break;
    }
  }, [writeRaw]);
  return import_react9.useMemo(() => ({ notifyITerm2, notifyKitty, notifyGhostty, notifyBell, progress }), [notifyITerm2, notifyKitty, notifyGhostty, notifyBell, progress]);
}
var import_react9, TerminalWriteContext, TerminalWriteProvider;
var init_useTerminalNotification = __esm(() => {
  init_terminal();
  init_ansi();
  init_osc();
  import_react9 = __toESM(require_react(), 1);
  TerminalWriteContext = import_react9.createContext(null);
  TerminalWriteProvider = TerminalWriteContext.Provider;
});

// packages/@ant/ink/src/core/ink.tsx
import { closeSync, constants as fsConstants, openSync, readSync, writeSync } from "fs";
import { format } from "util";
function makeAltScreenParkPatch(terminalRows) {
  return Object.freeze({
    type: "stdout",
    content: cursorPosition(terminalRows, 1)
  });
}

class Ink {
  options;
  log;
  terminal;
  scheduleRender;
  isUnmounted = false;
  isPaused = false;
  container;
  rootNode;
  focusManager;
  renderer;
  stylePool;
  charPool;
  hyperlinkPool;
  exitPromise;
  restoreConsole;
  restoreStderr;
  unsubscribeTTYHandlers;
  terminalColumns;
  terminalRows;
  currentNode = null;
  frontFrame;
  backFrame;
  lastPoolResetTime = performance.now();
  drainTimer = null;
  lastYogaCounters = { ms: 0, visited: 0, measured: 0, cacheHits: 0, live: 0 };
  altScreenParkPatch;
  selection = createSelectionState();
  searchHighlightQuery = "";
  searchPositions = null;
  selectionListeners = new Set;
  hoveredNodes = new Set;
  altScreenActive = false;
  altScreenMouseTracking = false;
  prevFrameContaminated = false;
  needsEraseBeforePaint = false;
  cursorDeclaration = null;
  displayCursor = null;
  logger;
  constructor(options) {
    this.options = options;
    autoBind(this);
    this.logger = options.logger ?? noopLogger;
    if (this.options.patchConsole) {
      this.restoreConsole = this.patchConsole();
      this.restoreStderr = this.patchStderr();
    }
    this.terminal = {
      stdout: options.stdout,
      stderr: options.stderr
    };
    this.terminalColumns = effectiveColumns(options.stdout.columns);
    this.terminalRows = options.stdout.rows || 24;
    this.altScreenParkPatch = makeAltScreenParkPatch(this.terminalRows);
    this.stylePool = new StylePool;
    this.charPool = new CharPool;
    this.hyperlinkPool = new HyperlinkPool;
    this.frontFrame = emptyFrame(this.terminalRows, this.terminalColumns, this.stylePool, this.charPool, this.hyperlinkPool);
    this.backFrame = emptyFrame(this.terminalRows, this.terminalColumns, this.stylePool, this.charPool, this.hyperlinkPool);
    this.log = new LogUpdate({
      isTTY: options.stdout.isTTY || false,
      stylePool: this.stylePool
    });
    const deferredRender = () => queueMicrotask(this.onRender);
    this.scheduleRender = throttle_default(deferredRender, FRAME_INTERVAL_MS, {
      leading: true,
      trailing: true
    });
    this.isUnmounted = false;
    this.unsubscribeExit = onExit(this.unmount, { alwaysLast: false });
    if (options.stdout.isTTY) {
      options.stdout.on("resize", this.handleResize);
      process.on("SIGCONT", this.handleResume);
      this.unsubscribeTTYHandlers = () => {
        options.stdout.off("resize", this.handleResize);
        process.off("SIGCONT", this.handleResume);
      };
    }
    this.rootNode = createNode("ink-root");
    this.focusManager = new FocusManager((target, event) => dispatcher.dispatchDiscrete(target, event));
    this.rootNode.focusManager = this.focusManager;
    this.renderer = createRenderer(this.rootNode, this.stylePool);
    this.rootNode.onRender = this.scheduleRender;
    this.rootNode.onImmediateRender = this.onRender;
    this.rootNode.onComputeLayout = () => {
      if (this.isUnmounted) {
        return;
      }
      if (this.rootNode.yogaNode) {
        const t0 = performance.now();
        this.rootNode.yogaNode.setWidth(this.terminalColumns);
        this.rootNode.yogaNode.calculateLayout(this.terminalColumns);
        const ms = performance.now() - t0;
        recordYogaMs(ms);
        const c = getYogaCounters();
        this.lastYogaCounters = { ms, ...c };
      }
    };
    this.container = reconciler_default.createContainer(this.rootNode, import_constants4.ConcurrentRoot, null, false, null, "id", noop_default, noop_default, noop_default, noop_default);
    if (false) {}
  }
  handleResume = () => {
    if (!this.options.stdout.isTTY) {
      return;
    }
    if (this.altScreenActive) {
      this.reenterAltScreen();
      return;
    }
    this.frontFrame = emptyFrame(this.frontFrame.viewport.height, this.frontFrame.viewport.width, this.stylePool, this.charPool, this.hyperlinkPool);
    this.backFrame = emptyFrame(this.backFrame.viewport.height, this.backFrame.viewport.width, this.stylePool, this.charPool, this.hyperlinkPool);
    this.log.reset();
    this.displayCursor = null;
  };
  handleResize = () => {
    const cols = effectiveColumns(this.options.stdout.columns);
    const rows = this.options.stdout.rows || 24;
    if (cols === this.terminalColumns && rows === this.terminalRows)
      return;
    this.terminalColumns = cols;
    this.terminalRows = rows;
    this.altScreenParkPatch = makeAltScreenParkPatch(this.terminalRows);
    if (this.altScreenActive && !this.isPaused && this.options.stdout.isTTY) {
      if (this.altScreenMouseTracking) {
        this.options.stdout.write(ENABLE_MOUSE_TRACKING);
      }
      this.resetFramesForAltScreen();
      this.needsEraseBeforePaint = true;
    }
    if (this.currentNode !== null) {
      this.render(this.currentNode);
    }
  };
  resolveExitPromise = () => {};
  rejectExitPromise = () => {};
  unsubscribeExit = () => {};
  enterAlternateScreen() {
    this.pause();
    this.suspendStdin();
    this.options.stdout.write(DISABLE_KITTY_KEYBOARD + DISABLE_MODIFY_OTHER_KEYS + (this.altScreenMouseTracking ? DISABLE_MOUSE_TRACKING : "") + (this.altScreenActive ? "" : "\x1B[?1049h") + "\x1B[?1004l" + "\x1B[0m" + "\x1B[?25h" + "\x1B[2J" + "\x1B[H");
  }
  exitAlternateScreen() {
    this.options.stdout.write((this.altScreenActive ? ENTER_ALT_SCREEN : "") + "\x1B[2J" + "\x1B[H" + (this.altScreenMouseTracking ? ENABLE_MOUSE_TRACKING : "") + (this.altScreenActive ? "" : "\x1B[?1049l") + "\x1B[?25l");
    this.resumeStdin();
    if (this.altScreenActive) {
      this.resetFramesForAltScreen();
    } else {
      this.repaint();
    }
    this.resume();
    this.options.stdout.write("\x1B[?1004h" + (supportsExtendedKeys() ? DISABLE_KITTY_KEYBOARD + ENABLE_KITTY_KEYBOARD + ENABLE_MODIFY_OTHER_KEYS : ""));
  }
  onRender() {
    if (this.isUnmounted || this.isPaused) {
      return;
    }
    if (this.drainTimer !== null) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }
    this.options.onBeforeRender?.();
    const renderStart = performance.now();
    const terminalWidth = effectiveColumns(this.options.stdout.columns);
    const terminalRows = this.options.stdout.rows || 24;
    const frame = this.renderer({
      frontFrame: this.frontFrame,
      backFrame: this.backFrame,
      isTTY: this.options.stdout.isTTY,
      terminalWidth,
      terminalRows,
      altScreen: this.altScreenActive,
      prevFrameContaminated: this.prevFrameContaminated
    });
    const rendererMs = performance.now() - renderStart;
    const follow = consumeFollowScroll();
    if (follow && this.selection.anchor && this.selection.anchor.row >= follow.viewportTop && this.selection.anchor.row <= follow.viewportBottom) {
      const { delta, viewportTop, viewportBottom } = follow;
      if (this.selection.isDragging) {
        if (hasSelection(this.selection)) {
          captureScrolledRows(this.selection, this.frontFrame.screen, viewportTop, viewportTop + delta - 1, "above");
        }
        shiftAnchor(this.selection, -delta, viewportTop, viewportBottom);
      } else if (!this.selection.focus || this.selection.focus.row >= viewportTop && this.selection.focus.row <= viewportBottom) {
        if (hasSelection(this.selection)) {
          captureScrolledRows(this.selection, this.frontFrame.screen, viewportTop, viewportTop + delta - 1, "above");
        }
        const cleared = shiftSelectionForFollow(this.selection, -delta, viewportTop, viewportBottom);
        if (cleared)
          for (const cb of this.selectionListeners)
            cb();
      }
    }
    let selActive = false;
    let hlActive = false;
    if (this.altScreenActive) {
      selActive = hasSelection(this.selection);
      if (selActive) {
        applySelectionOverlay(frame.screen, this.selection, this.stylePool);
      }
      hlActive = applySearchHighlight(frame.screen, this.searchHighlightQuery, this.stylePool);
      if (this.searchPositions) {
        const sp = this.searchPositions;
        const posApplied = applyPositionedHighlight(frame.screen, this.stylePool, sp.positions, sp.rowOffset, sp.currentIdx);
        hlActive = hlActive || posApplied;
      }
    }
    if (didLayoutShift() || selActive || hlActive || this.prevFrameContaminated) {
      frame.screen.damage = {
        x: 0,
        y: 0,
        width: frame.screen.width,
        height: frame.screen.height
      };
    }
    let prevFrame = this.frontFrame;
    if (this.altScreenActive) {
      prevFrame = { ...this.frontFrame, cursor: ALT_SCREEN_ANCHOR_CURSOR };
    }
    const tDiff = performance.now();
    const diff2 = this.log.render(prevFrame, frame, this.altScreenActive, SYNC_OUTPUT_SUPPORTED);
    const diffMs = performance.now() - tDiff;
    this.backFrame = this.frontFrame;
    this.frontFrame = frame;
    if (renderStart - this.lastPoolResetTime > 5 * 60 * 1000) {
      this.resetPools();
      this.lastPoolResetTime = renderStart;
    }
    const flickers = [];
    for (const patch of diff2) {
      if (patch.type === "clearTerminal") {
        flickers.push({
          desiredHeight: frame.screen.height,
          availableHeight: frame.viewport.height,
          reason: patch.reason
        });
        if (isDebugRepaintsEnabled() && patch.debug) {
          const chain = findOwnerChainAtRow(this.rootNode, patch.debug.triggerY);
          this.logger.debug(`[REPAINT] full reset \xB7 ${patch.reason} \xB7 row ${patch.debug.triggerY}
` + `  prev: "${patch.debug.prevLine}"
` + `  next: "${patch.debug.nextLine}"
` + `  culprit: ${chain.length ? chain.join(" < ") : "(no owner chain captured)"}`, { level: "warn" });
        }
      }
    }
    const tOptimize = performance.now();
    const optimized = optimize(diff2);
    const optimizeMs = performance.now() - tOptimize;
    const hasDiff = optimized.length > 0;
    if (this.altScreenActive && hasDiff) {
      if (this.needsEraseBeforePaint) {
        this.needsEraseBeforePaint = false;
        optimized.unshift(ERASE_THEN_HOME_PATCH);
      } else {
        optimized.unshift(CURSOR_HOME_PATCH);
      }
      optimized.push(this.altScreenParkPatch);
    }
    const decl = this.cursorDeclaration;
    const rect = decl !== null ? nodeCache.get(decl.node) : undefined;
    const target = decl !== null && rect !== undefined ? { x: rect.x + decl.relativeX, y: rect.y + decl.relativeY } : null;
    const parked = this.displayCursor;
    const targetMoved = target !== null && (parked === null || parked.x !== target.x || parked.y !== target.y);
    if (hasDiff || targetMoved || target === null && parked !== null) {
      if (parked !== null && !this.altScreenActive && hasDiff) {
        const pdx = prevFrame.cursor.x - parked.x;
        const pdy = prevFrame.cursor.y - parked.y;
        if (pdx !== 0 || pdy !== 0) {
          optimized.unshift({ type: "stdout", content: cursorMove(pdx, pdy) });
        }
      }
      if (target !== null) {
        if (this.altScreenActive) {
          const row = Math.min(Math.max(target.y + 1, 1), terminalRows);
          const col = Math.min(Math.max(target.x + 1, 1), terminalWidth);
          optimized.push({ type: "stdout", content: cursorPosition(row, col) });
        } else {
          const from = !hasDiff && parked !== null ? parked : { x: frame.cursor.x, y: frame.cursor.y };
          const dx = target.x - from.x;
          const dy = target.y - from.y;
          if (dx !== 0 || dy !== 0) {
            optimized.push({ type: "stdout", content: cursorMove(dx, dy) });
          }
        }
        this.displayCursor = target;
      } else {
        if (parked !== null && !this.altScreenActive && !hasDiff) {
          const rdx = frame.cursor.x - parked.x;
          const rdy = frame.cursor.y - parked.y;
          if (rdx !== 0 || rdy !== 0) {
            optimized.push({ type: "stdout", content: cursorMove(rdx, rdy) });
          }
        }
        this.displayCursor = null;
      }
    }
    const tWrite = performance.now();
    writeDiffToTerminal(this.terminal, optimized, this.altScreenActive && !SYNC_OUTPUT_SUPPORTED);
    const writeMs = performance.now() - tWrite;
    this.prevFrameContaminated = selActive || hlActive;
    if (frame.scrollDrainPending) {
      this.drainTimer = setTimeout(() => this.onRender(), FRAME_INTERVAL_MS >> 2);
    }
    const yogaMs = getLastYogaMs();
    const commitMs = getLastCommitMs();
    const yc = this.lastYogaCounters;
    resetProfileCounters();
    this.lastYogaCounters = {
      ms: 0,
      visited: 0,
      measured: 0,
      cacheHits: 0,
      live: 0
    };
    this.options.onFrame?.({
      durationMs: performance.now() - renderStart,
      phases: {
        renderer: rendererMs,
        diff: diffMs,
        optimize: optimizeMs,
        write: writeMs,
        patches: diff2.length,
        yoga: yogaMs,
        commit: commitMs,
        yogaVisited: yc.visited,
        yogaMeasured: yc.measured,
        yogaCacheHits: yc.cacheHits,
        yogaLive: yc.live
      },
      flickers
    });
  }
  pause() {
    reconciler_default.flushSyncFromReconciler();
    this.onRender();
    this.isPaused = true;
  }
  resume() {
    this.isPaused = false;
    this.onRender();
  }
  repaint() {
    this.frontFrame = emptyFrame(this.frontFrame.viewport.height, this.frontFrame.viewport.width, this.stylePool, this.charPool, this.hyperlinkPool);
    this.backFrame = emptyFrame(this.backFrame.viewport.height, this.backFrame.viewport.width, this.stylePool, this.charPool, this.hyperlinkPool);
    this.log.reset();
    this.displayCursor = null;
  }
  forceRedraw() {
    if (!this.options.stdout.isTTY || this.isUnmounted || this.isPaused)
      return;
    this.options.stdout.write(ERASE_SCREEN + CURSOR_HOME);
    if (this.altScreenActive) {
      this.resetFramesForAltScreen();
    } else {
      this.repaint();
      this.prevFrameContaminated = true;
    }
    this.onRender();
  }
  invalidatePrevFrame() {
    this.prevFrameContaminated = true;
  }
  setAltScreenActive(active, mouseTracking = false) {
    if (this.altScreenActive === active)
      return;
    this.altScreenActive = active;
    this.altScreenMouseTracking = active && mouseTracking;
    if (active) {
      this.resetFramesForAltScreen();
    } else {
      this.repaint();
    }
  }
  get isAltScreenActive() {
    return this.altScreenActive;
  }
  reassertTerminalModes = (includeAltScreen = false) => {
    if (!this.options.stdout.isTTY)
      return;
    if (this.isPaused)
      return;
    if (supportsExtendedKeys()) {
      this.options.stdout.write(DISABLE_KITTY_KEYBOARD + ENABLE_KITTY_KEYBOARD + ENABLE_MODIFY_OTHER_KEYS);
    }
    if (!this.altScreenActive)
      return;
    if (this.altScreenMouseTracking) {
      this.options.stdout.write(ENABLE_MOUSE_TRACKING);
    }
    if (includeAltScreen) {
      this.reenterAltScreen();
    }
  };
  detachForShutdown() {
    this.isUnmounted = true;
    this.scheduleRender.cancel?.();
    const stdin = this.options.stdin;
    this.drainStdin();
    if (stdin.isTTY && stdin.isRaw && stdin.setRawMode) {
      stdin.setRawMode(false);
    }
  }
  drainStdin() {
    drainStdin(this.options.stdin);
  }
  reenterAltScreen() {
    this.options.stdout.write(ENTER_ALT_SCREEN + ERASE_SCREEN + CURSOR_HOME + (this.altScreenMouseTracking ? ENABLE_MOUSE_TRACKING : ""));
    this.resetFramesForAltScreen();
  }
  resetFramesForAltScreen() {
    const rows = this.terminalRows;
    const cols = this.terminalColumns;
    const blank = () => ({
      screen: createScreen(cols, rows, this.stylePool, this.charPool, this.hyperlinkPool),
      viewport: { width: cols, height: rows + 1 },
      cursor: { x: 0, y: 0, visible: true }
    });
    this.frontFrame = blank();
    this.backFrame = blank();
    this.log.reset();
    this.displayCursor = null;
    this.prevFrameContaminated = true;
  }
  copySelectionNoClear() {
    if (!hasSelection(this.selection))
      return "";
    const text = getSelectedText(this.selection, this.frontFrame.screen);
    if (text) {
      setClipboard(text).then((raw) => {
        if (raw)
          this.options.stdout.write(raw);
      });
    }
    return text;
  }
  copySelection() {
    if (!hasSelection(this.selection))
      return "";
    const text = this.copySelectionNoClear();
    clearSelection(this.selection);
    this.notifySelectionChange();
    return text;
  }
  clearTextSelection() {
    if (!hasSelection(this.selection))
      return;
    clearSelection(this.selection);
    this.notifySelectionChange();
  }
  setSearchHighlight(query) {
    if (this.searchHighlightQuery === query)
      return;
    this.searchHighlightQuery = query;
    this.scheduleRender();
  }
  scanElementSubtree(el) {
    if (!this.searchHighlightQuery || !el.yogaNode)
      return [];
    const width = Math.ceil(el.yogaNode.getComputedWidth());
    const height = Math.ceil(el.yogaNode.getComputedHeight());
    if (width <= 0 || height <= 0)
      return [];
    const elLeft = el.yogaNode.getComputedLeft();
    const elTop = el.yogaNode.getComputedTop();
    const screen = createScreen(width, height, this.stylePool, this.charPool, this.hyperlinkPool);
    const output = new Output({
      width,
      height,
      stylePool: this.stylePool,
      screen
    });
    render_node_to_output_default(el, output, {
      offsetX: -elLeft,
      offsetY: -elTop,
      prevScreen: undefined
    });
    const rendered = output.get();
    markDirty(el);
    const positions = scanPositions(rendered, this.searchHighlightQuery);
    this.logger.debug(`scanElementSubtree: q='${this.searchHighlightQuery}' ` + `el=${width}x${height}@(${elLeft},${elTop}) n=${positions.length} ` + `[${positions.slice(0, 10).map((p) => `${p.row}:${p.col}`).join(",")}` + `${positions.length > 10 ? ",\u2026" : ""}]`);
    return positions;
  }
  setSearchPositions(state) {
    this.searchPositions = state;
    this.scheduleRender();
  }
  setSelectionBgColor(color) {
    const wrapped = colorize("\x00", color, "background");
    const nul = wrapped.indexOf("\x00");
    if (nul <= 0 || nul === wrapped.length - 1) {
      this.stylePool.setSelectionBg(null);
      return;
    }
    this.stylePool.setSelectionBg({
      type: "ansi",
      code: wrapped.slice(0, nul),
      endCode: wrapped.slice(nul + 1)
    });
  }
  captureScrolledRows(firstRow, lastRow, side) {
    captureScrolledRows(this.selection, this.frontFrame.screen, firstRow, lastRow, side);
  }
  shiftSelectionForScroll(dRow, minRow, maxRow) {
    const hadSel = hasSelection(this.selection);
    shiftSelection(this.selection, dRow, minRow, maxRow, this.frontFrame.screen.width);
    if (hadSel && !hasSelection(this.selection)) {
      this.notifySelectionChange();
    }
  }
  moveSelectionFocus(move) {
    if (!this.altScreenActive)
      return;
    const { focus } = this.selection;
    if (!focus)
      return;
    const { width, height } = this.frontFrame.screen;
    const maxCol = width - 1;
    const maxRow = height - 1;
    let { col, row } = focus;
    switch (move) {
      case "left":
        if (col > 0)
          col--;
        else if (row > 0) {
          col = maxCol;
          row--;
        }
        break;
      case "right":
        if (col < maxCol)
          col++;
        else if (row < maxRow) {
          col = 0;
          row++;
        }
        break;
      case "up":
        if (row > 0)
          row--;
        break;
      case "down":
        if (row < maxRow)
          row++;
        break;
      case "lineStart":
        col = 0;
        break;
      case "lineEnd":
        col = maxCol;
        break;
    }
    if (col === focus.col && row === focus.row)
      return;
    moveFocus(this.selection, col, row);
    this.notifySelectionChange();
  }
  hasTextSelection() {
    return hasSelection(this.selection);
  }
  subscribeToSelectionChange(cb) {
    this.selectionListeners.add(cb);
    return () => this.selectionListeners.delete(cb);
  }
  notifySelectionChange() {
    this.onRender();
    for (const cb of this.selectionListeners)
      cb();
  }
  dispatchClick(col, row) {
    if (!this.altScreenActive)
      return false;
    const blank = isEmptyCellAt(this.frontFrame.screen, col, row);
    return dispatchClick(this.rootNode, col, row, blank);
  }
  dispatchHover(col, row) {
    if (!this.altScreenActive)
      return;
    dispatchHover(this.rootNode, col, row, this.hoveredNodes);
  }
  dispatchKeyboardEvent(parsedKey) {
    const target = this.focusManager.activeElement ?? this.rootNode;
    const event = new KeyboardEvent(parsedKey);
    dispatcher.dispatchDiscrete(target, event);
    if (!event.defaultPrevented && parsedKey.name === "tab" && !parsedKey.ctrl && !parsedKey.meta) {
      if (parsedKey.shift) {
        this.focusManager.focusPrevious(this.rootNode);
      } else {
        this.focusManager.focusNext(this.rootNode);
      }
    }
  }
  getHyperlinkAt(col, row) {
    if (!this.altScreenActive)
      return;
    const screen = this.frontFrame.screen;
    const cell = cellAt(screen, col, row);
    let url = cell?.hyperlink;
    if (!url && cell?.width === 2 /* SpacerTail */ && col > 0) {
      url = cellAt(screen, col - 1, row)?.hyperlink;
    }
    return url ?? findPlainTextUrlAt(screen, col, row);
  }
  onHyperlinkClick;
  openHyperlink(url) {
    this.onHyperlinkClick?.(url);
  }
  handleMultiClick(col, row, count) {
    if (!this.altScreenActive)
      return;
    const screen = this.frontFrame.screen;
    startSelection(this.selection, col, row);
    if (count === 2)
      selectWordAt(this.selection, screen, col, row);
    else
      selectLineAt(this.selection, screen, row);
    if (!this.selection.focus)
      this.selection.focus = this.selection.anchor;
    this.notifySelectionChange();
  }
  handleSelectionDrag(col, row) {
    if (!this.altScreenActive)
      return;
    const sel = this.selection;
    if (sel.anchorSpan) {
      extendSelection(sel, this.frontFrame.screen, col, row);
    } else {
      updateSelection(sel, col, row);
    }
    this.notifySelectionChange();
  }
  stdinListeners = [];
  wasRawMode = false;
  suspendStdin() {
    const stdin = this.options.stdin;
    if (!stdin.isTTY) {
      return;
    }
    const readableListeners = stdin.listeners("readable");
    this.logger.debug(`[stdin] suspendStdin: removing ${readableListeners.length} readable listener(s), wasRawMode=${stdin.isRaw ?? false}`);
    readableListeners.forEach((listener) => {
      this.stdinListeners.push({
        event: "readable",
        listener
      });
      stdin.removeListener("readable", listener);
    });
    const stdinWithRaw = stdin;
    if (stdinWithRaw.isRaw && stdinWithRaw.setRawMode) {
      stdinWithRaw.setRawMode(false);
      this.wasRawMode = true;
    }
  }
  resumeStdin() {
    const stdin = this.options.stdin;
    if (!stdin.isTTY) {
      return;
    }
    if (this.stdinListeners.length === 0 && !this.wasRawMode) {
      this.logger.debug("[stdin] resumeStdin: called with no stored listeners and wasRawMode=false (possible desync)", {
        level: "warn"
      });
    }
    this.logger.debug(`[stdin] resumeStdin: re-attaching ${this.stdinListeners.length} listener(s), wasRawMode=${this.wasRawMode}`);
    this.stdinListeners.forEach(({ event, listener }) => {
      stdin.addListener(event, listener);
    });
    this.stdinListeners = [];
    if (this.wasRawMode) {
      const stdinWithRaw = stdin;
      if (stdinWithRaw.setRawMode) {
        stdinWithRaw.setRawMode(true);
      }
      this.wasRawMode = false;
    }
  }
  writeRaw(data) {
    this.options.stdout.write(data);
  }
  setCursorDeclaration = (decl, clearIfNode) => {
    if (decl === null && clearIfNode !== undefined && this.cursorDeclaration?.node !== clearIfNode) {
      return;
    }
    this.cursorDeclaration = decl;
  };
  render(node) {
    this.currentNode = node;
    const tree = /* @__PURE__ */ jsx_runtime7.jsx(App, {
      stdin: this.options.stdin,
      stdout: this.options.stdout,
      stderr: this.options.stderr,
      exitOnCtrlC: this.options.exitOnCtrlC,
      onExit: this.unmount,
      terminalColumns: this.terminalColumns,
      terminalRows: this.terminalRows,
      selection: this.selection,
      onSelectionChange: this.notifySelectionChange,
      onClickAt: this.dispatchClick,
      onHoverAt: this.dispatchHover,
      getHyperlinkAt: this.getHyperlinkAt,
      onOpenHyperlink: this.openHyperlink,
      onMultiClick: this.handleMultiClick,
      onSelectionDrag: this.handleSelectionDrag,
      onStdinResume: this.reassertTerminalModes,
      onCursorDeclaration: this.setCursorDeclaration,
      dispatchKeyboardEvent: this.dispatchKeyboardEvent,
      children: /* @__PURE__ */ jsx_runtime7.jsx(TerminalWriteProvider, {
        value: this.writeRaw,
        children: node
      })
    });
    reconciler_default.updateContainerSync(tree, this.container, null, noop_default);
    reconciler_default.flushSyncWork();
  }
  unmount(error) {
    if (this.isUnmounted) {
      return;
    }
    this.onRender();
    this.unsubscribeExit();
    if (typeof this.restoreConsole === "function") {
      this.restoreConsole();
    }
    this.restoreStderr?.();
    this.unsubscribeTTYHandlers?.();
    const diff2 = this.log.renderPreviousOutput_DEPRECATED(this.frontFrame);
    writeDiffToTerminal(this.terminal, optimize(diff2));
    if (this.options.stdout.isTTY) {
      if (this.altScreenActive) {
        writeSync(1, EXIT_ALT_SCREEN);
      }
      writeSync(1, DISABLE_MOUSE_TRACKING);
      this.drainStdin();
      writeSync(1, DISABLE_MODIFY_OTHER_KEYS);
      writeSync(1, DISABLE_KITTY_KEYBOARD);
      writeSync(1, DFE);
      writeSync(1, DBP);
      writeSync(1, SHOW_CURSOR);
      writeSync(1, CLEAR_ITERM2_PROGRESS);
      if (supportsTabStatus())
        writeSync(1, wrapForMultiplexer(CLEAR_TAB_STATUS));
    }
    this.isUnmounted = true;
    this.scheduleRender.cancel?.();
    if (this.drainTimer !== null) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }
    reconciler_default.updateContainerSync(null, this.container, null, noop_default);
    reconciler_default.flushSyncWork();
    instances_default.delete(this.options.stdout);
    this.rootNode.yogaNode?.free();
    this.rootNode.yogaNode = undefined;
    if (error instanceof Error) {
      this.rejectExitPromise(error);
    } else {
      this.resolveExitPromise();
    }
  }
  async waitUntilExit() {
    this.exitPromise ||= new Promise((resolve, reject) => {
      this.resolveExitPromise = resolve;
      this.rejectExitPromise = reject;
    });
    return this.exitPromise;
  }
  resetLineCount() {
    if (this.options.stdout.isTTY) {
      this.backFrame = this.frontFrame;
      this.frontFrame = emptyFrame(this.frontFrame.viewport.height, this.frontFrame.viewport.width, this.stylePool, this.charPool, this.hyperlinkPool);
      this.log.reset();
      this.displayCursor = null;
    }
  }
  resetPools() {
    this.charPool = new CharPool;
    this.hyperlinkPool = new HyperlinkPool;
    migrateScreenPools(this.frontFrame.screen, this.charPool, this.hyperlinkPool);
    this.backFrame.screen.charPool = this.charPool;
    this.backFrame.screen.hyperlinkPool = this.hyperlinkPool;
  }
  patchConsole() {
    const con = console;
    const originals = {};
    const toDebug = (...args) => this.logger.debug(`console.log: ${format(...args)}`);
    const toError = (...args) => this.logger.error(new Error(`console.error: ${format(...args)}`));
    for (const m of CONSOLE_STDOUT_METHODS) {
      originals[m] = con[m];
      con[m] = toDebug;
    }
    for (const m of CONSOLE_STDERR_METHODS) {
      originals[m] = con[m];
      con[m] = toError;
    }
    originals.assert = con.assert;
    con.assert = (condition, ...args) => {
      if (!condition)
        toError(...args);
    };
    return () => Object.assign(con, originals);
  }
  patchStderr() {
    const stderr = process.stderr;
    const originalWrite = stderr.write;
    let reentered = false;
    const intercept = (chunk, encodingOrCb, cb) => {
      const callback = typeof encodingOrCb === "function" ? encodingOrCb : cb;
      if (reentered) {
        const encoding = typeof encodingOrCb === "string" ? encodingOrCb : undefined;
        return originalWrite.call(stderr, chunk, encoding, callback);
      }
      reentered = true;
      try {
        const text = typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
        this.logger.debug(`[stderr] ${text}`, { level: "warn" });
        if (this.altScreenActive && !this.isUnmounted && !this.isPaused) {
          this.prevFrameContaminated = true;
          this.scheduleRender();
        }
      } finally {
        reentered = false;
        callback?.();
      }
      return true;
    };
    stderr.write = intercept;
    return () => {
      if (stderr.write === intercept) {
        stderr.write = originalWrite;
      }
    };
  }
}
function drainStdin(stdin = process.stdin) {
  if (!stdin.isTTY)
    return;
  try {
    while (stdin.read() !== null) {}
  } catch {}
  if (process.platform === "win32")
    return;
  const tty2 = stdin;
  const wasRaw = tty2.isRaw === true;
  let fd = -1;
  try {
    if (!wasRaw)
      tty2.setRawMode?.(true);
    fd = openSync("/dev/tty", fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
    const buf = Buffer.alloc(1024);
    for (let i = 0;i < 64; i++) {
      if (readSync(fd, buf, 0, buf.length, null) <= 0)
        break;
    }
  } catch {} finally {
    if (fd >= 0) {
      try {
        closeSync(fd);
      } catch {}
    }
    if (!wasRaw) {
      try {
        tty2.setRawMode?.(false);
      } catch {}
    }
  }
}
var import_constants4, jsx_runtime7, ALT_SCREEN_ANCHOR_CURSOR, CURSOR_HOME_PATCH, ERASE_THEN_HOME_PATCH, noopLogger, CONSOLE_STDOUT_METHODS, CONSOLE_STDERR_METHODS;
var init_ink = __esm(() => {
  init_auto_bind();
  init_noop();
  init_throttle();
  init_mjs();
  init_yoga_layout();
  init_colorize();
  init_App();
  init_constants();
  init_dom();
  init_keyboard_event();
  init_focus();
  init_frame();
  init_hit_test();
  init_instances();
  init_log_update();
  init_node_cache();
  init_optimizer();
  init_output();
  init_reconciler();
  init_render_node_to_output();
  init_render_to_screen();
  init_renderer();
  init_screen();
  init_searchHighlight();
  init_selection();
  init_terminal();
  init_csi();
  init_dec();
  init_osc();
  init_useTerminalNotification();
  init_legacyConsole();
  import_constants4 = __toESM(require_constants(), 1);
  jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
  ALT_SCREEN_ANCHOR_CURSOR = Object.freeze({ x: 0, y: 0, visible: false });
  CURSOR_HOME_PATCH = Object.freeze({
    type: "stdout",
    content: CURSOR_HOME
  });
  ERASE_THEN_HOME_PATCH = Object.freeze({
    type: "stdout",
    content: ERASE_SCREEN + CURSOR_HOME
  });
  noopLogger = {
    debug() {},
    error() {}
  };
  CONSOLE_STDOUT_METHODS = [
    "log",
    "info",
    "debug",
    "dir",
    "dirxml",
    "count",
    "countReset",
    "group",
    "groupCollapsed",
    "groupEnd",
    "table",
    "time",
    "timeEnd",
    "timeLog"
  ];
  CONSOLE_STDERR_METHODS = ["warn", "error", "trace"];
});

// packages/@ant/ink/src/core/root.ts
import { Stream } from "stream";
async function createRoot({
  stdout = process.stdout,
  stdin = process.stdin,
  stderr = process.stderr,
  exitOnCtrlC = true,
  patchConsole = true,
  onFrame
} = {}) {
  await Promise.resolve();
  const instance = new Ink({
    stdout,
    stdin,
    stderr,
    exitOnCtrlC,
    patchConsole,
    onFrame
  });
  instances_default.set(stdout, instance);
  return {
    render: (node) => instance.render(node),
    unmount: () => instance.unmount(),
    waitUntilExit: () => instance.waitUntilExit()
  };
}
var renderSync = (node, options) => {
  const opts = getOptions(options);
  const inkOptions = {
    stdout: process.stdout,
    stdin: process.stdin,
    stderr: process.stderr,
    exitOnCtrlC: true,
    patchConsole: true,
    ...opts
  };
  const instance = getInstance(inkOptions.stdout, () => new Ink(inkOptions));
  instance.render(node);
  return {
    rerender: instance.render,
    unmount() {
      instance.unmount();
    },
    waitUntilExit: instance.waitUntilExit,
    cleanup: () => instances_default.delete(inkOptions.stdout)
  };
}, wrappedRender = async (node, options) => {
  await Promise.resolve();
  const instance = renderSync(node, options);
  if (process.env.CLAUDE_CODE_DEBUG_REPAINTS === "1") {
    console.warn(`[render] first ink render: ${Math.round(process.uptime() * 1000)}ms since process start`);
  }
  return instance;
}, root_default, getOptions = (stdout = {}) => {
  if (stdout instanceof Stream) {
    return {
      stdout,
      stdin: process.stdin
    };
  }
  return stdout;
}, getInstance = (stdout, createInstance) => {
  let instance = instances_default.get(stdout);
  if (!instance) {
    instance = createInstance();
    instances_default.set(stdout, instance);
  }
  return instance;
};
var init_root = __esm(() => {
  init_ink();
  init_instances();
  root_default = wrappedRender;
});

// packages/@ant/ink/src/theme/theme-types.ts
function getTheme(themeName) {
  switch (themeName) {
    case "light":
      return lightTheme;
    case "light-ansi":
      return lightAnsiTheme;
    case "dark-ansi":
      return darkAnsiTheme;
    case "light-daltonized":
      return lightDaltonizedTheme;
    case "dark-daltonized":
      return darkDaltonizedTheme;
    default:
      return darkTheme;
  }
}
function themeColorToAnsi(themeColor) {
  const rgbMatch = themeColor.match(/rgb\(\s?(\d+),\s?(\d+),\s?(\d+)\s?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const colored = chalkForChart.rgb(r, g, b)("X");
    return colored.slice(0, colored.indexOf("X"));
  }
  return "\x1B[35m";
}
var THEME_NAMES, THEME_SETTINGS, lightTheme, lightAnsiTheme, darkAnsiTheme, lightDaltonizedTheme, darkTheme, darkDaltonizedTheme, chalkForChart;
var init_theme_types = __esm(() => {
  init_source();
  THEME_NAMES = [
    "dark",
    "light",
    "light-daltonized",
    "dark-daltonized",
    "light-ansi",
    "dark-ansi"
  ];
  THEME_SETTINGS = ["auto", ...THEME_NAMES];
  lightTheme = {
    autoAccept: "rgb(135,0,255)",
    bashBorder: "rgb(255,0,135)",
    claude: "rgb(215,119,87)",
    claudeShimmer: "rgb(245,149,117)",
    claudeBlue_FOR_SYSTEM_SPINNER: "rgb(87,105,247)",
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: "rgb(117,135,255)",
    permission: "rgb(87,105,247)",
    permissionShimmer: "rgb(137,155,255)",
    planMode: "rgb(0,102,102)",
    ide: "rgb(71,130,200)",
    promptBorder: "rgb(153,153,153)",
    promptBorderShimmer: "rgb(183,183,183)",
    text: "rgb(0,0,0)",
    inverseText: "rgb(255,255,255)",
    inactive: "rgb(102,102,102)",
    inactiveShimmer: "rgb(142,142,142)",
    subtle: "rgb(175,175,175)",
    suggestion: "rgb(87,105,247)",
    remember: "rgb(0,0,255)",
    background: "rgb(0,153,153)",
    success: "rgb(44,122,57)",
    error: "rgb(171,43,63)",
    warning: "rgb(150,108,30)",
    merged: "rgb(135,0,255)",
    warningShimmer: "rgb(200,158,80)",
    diffAdded: "rgb(105,219,124)",
    diffRemoved: "rgb(255,168,180)",
    diffAddedDimmed: "rgb(199,225,203)",
    diffRemovedDimmed: "rgb(253,210,216)",
    diffAddedWord: "rgb(47,157,68)",
    diffRemovedWord: "rgb(209,69,75)",
    red_FOR_SUBAGENTS_ONLY: "rgb(220,38,38)",
    blue_FOR_SUBAGENTS_ONLY: "rgb(37,99,235)",
    green_FOR_SUBAGENTS_ONLY: "rgb(22,163,74)",
    yellow_FOR_SUBAGENTS_ONLY: "rgb(202,138,4)",
    purple_FOR_SUBAGENTS_ONLY: "rgb(147,51,234)",
    orange_FOR_SUBAGENTS_ONLY: "rgb(234,88,12)",
    pink_FOR_SUBAGENTS_ONLY: "rgb(219,39,119)",
    cyan_FOR_SUBAGENTS_ONLY: "rgb(8,145,178)",
    professionalBlue: "rgb(106,155,204)",
    chromeYellow: "rgb(251,188,4)",
    clawd_body: "rgb(215,119,87)",
    clawd_background: "rgb(0,0,0)",
    userMessageBackground: "rgb(240, 240, 240)",
    userMessageBackgroundHover: "rgb(252, 252, 252)",
    messageActionsBackground: "rgb(232, 236, 244)",
    selectionBg: "rgb(180, 213, 255)",
    bashMessageBackgroundColor: "rgb(250, 245, 250)",
    memoryBackgroundColor: "rgb(230, 245, 250)",
    rate_limit_fill: "rgb(87,105,247)",
    rate_limit_empty: "rgb(39,47,111)",
    fastMode: "rgb(255,106,0)",
    fastModeShimmer: "rgb(255,150,50)",
    briefLabelYou: "rgb(37,99,235)",
    briefLabelClaude: "rgb(215,119,87)",
    rainbow_red: "rgb(235,95,87)",
    rainbow_orange: "rgb(245,139,87)",
    rainbow_yellow: "rgb(250,195,95)",
    rainbow_green: "rgb(145,200,130)",
    rainbow_blue: "rgb(130,170,220)",
    rainbow_indigo: "rgb(155,130,200)",
    rainbow_violet: "rgb(200,130,180)",
    rainbow_red_shimmer: "rgb(250,155,147)",
    rainbow_orange_shimmer: "rgb(255,185,137)",
    rainbow_yellow_shimmer: "rgb(255,225,155)",
    rainbow_green_shimmer: "rgb(185,230,180)",
    rainbow_blue_shimmer: "rgb(180,205,240)",
    rainbow_indigo_shimmer: "rgb(195,180,230)",
    rainbow_violet_shimmer: "rgb(230,180,210)"
  };
  lightAnsiTheme = {
    autoAccept: "ansi:magenta",
    bashBorder: "ansi:magenta",
    claude: "ansi:redBright",
    claudeShimmer: "ansi:yellowBright",
    claudeBlue_FOR_SYSTEM_SPINNER: "ansi:blue",
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: "ansi:blueBright",
    permission: "ansi:blue",
    permissionShimmer: "ansi:blueBright",
    planMode: "ansi:cyan",
    ide: "ansi:blueBright",
    promptBorder: "ansi:white",
    promptBorderShimmer: "ansi:whiteBright",
    text: "ansi:black",
    inverseText: "ansi:white",
    inactive: "ansi:blackBright",
    inactiveShimmer: "ansi:white",
    subtle: "ansi:blackBright",
    suggestion: "ansi:blue",
    remember: "ansi:blue",
    background: "ansi:cyan",
    success: "ansi:green",
    error: "ansi:red",
    warning: "ansi:yellow",
    merged: "ansi:magenta",
    warningShimmer: "ansi:yellowBright",
    diffAdded: "ansi:green",
    diffRemoved: "ansi:red",
    diffAddedDimmed: "ansi:green",
    diffRemovedDimmed: "ansi:red",
    diffAddedWord: "ansi:greenBright",
    diffRemovedWord: "ansi:redBright",
    red_FOR_SUBAGENTS_ONLY: "ansi:red",
    blue_FOR_SUBAGENTS_ONLY: "ansi:blue",
    green_FOR_SUBAGENTS_ONLY: "ansi:green",
    yellow_FOR_SUBAGENTS_ONLY: "ansi:yellow",
    purple_FOR_SUBAGENTS_ONLY: "ansi:magenta",
    orange_FOR_SUBAGENTS_ONLY: "ansi:redBright",
    pink_FOR_SUBAGENTS_ONLY: "ansi:magentaBright",
    cyan_FOR_SUBAGENTS_ONLY: "ansi:cyan",
    professionalBlue: "ansi:blueBright",
    chromeYellow: "ansi:yellow",
    clawd_body: "ansi:redBright",
    clawd_background: "ansi:black",
    userMessageBackground: "ansi:white",
    userMessageBackgroundHover: "ansi:whiteBright",
    messageActionsBackground: "ansi:white",
    selectionBg: "ansi:cyan",
    bashMessageBackgroundColor: "ansi:whiteBright",
    memoryBackgroundColor: "ansi:white",
    rate_limit_fill: "ansi:yellow",
    rate_limit_empty: "ansi:black",
    fastMode: "ansi:red",
    fastModeShimmer: "ansi:redBright",
    briefLabelYou: "ansi:blue",
    briefLabelClaude: "ansi:redBright",
    rainbow_red: "ansi:red",
    rainbow_orange: "ansi:redBright",
    rainbow_yellow: "ansi:yellow",
    rainbow_green: "ansi:green",
    rainbow_blue: "ansi:cyan",
    rainbow_indigo: "ansi:blue",
    rainbow_violet: "ansi:magenta",
    rainbow_red_shimmer: "ansi:redBright",
    rainbow_orange_shimmer: "ansi:yellow",
    rainbow_yellow_shimmer: "ansi:yellowBright",
    rainbow_green_shimmer: "ansi:greenBright",
    rainbow_blue_shimmer: "ansi:cyanBright",
    rainbow_indigo_shimmer: "ansi:blueBright",
    rainbow_violet_shimmer: "ansi:magentaBright"
  };
  darkAnsiTheme = {
    autoAccept: "ansi:magentaBright",
    bashBorder: "ansi:magentaBright",
    claude: "ansi:redBright",
    claudeShimmer: "ansi:yellowBright",
    claudeBlue_FOR_SYSTEM_SPINNER: "ansi:blueBright",
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: "ansi:blueBright",
    permission: "ansi:blueBright",
    permissionShimmer: "ansi:blueBright",
    planMode: "ansi:cyanBright",
    ide: "ansi:blue",
    promptBorder: "ansi:white",
    promptBorderShimmer: "ansi:whiteBright",
    text: "ansi:whiteBright",
    inverseText: "ansi:black",
    inactive: "ansi:white",
    inactiveShimmer: "ansi:whiteBright",
    subtle: "ansi:white",
    suggestion: "ansi:blueBright",
    remember: "ansi:blueBright",
    background: "ansi:cyanBright",
    success: "ansi:greenBright",
    error: "ansi:redBright",
    warning: "ansi:yellowBright",
    merged: "ansi:magentaBright",
    warningShimmer: "ansi:yellowBright",
    diffAdded: "ansi:green",
    diffRemoved: "ansi:red",
    diffAddedDimmed: "ansi:green",
    diffRemovedDimmed: "ansi:red",
    diffAddedWord: "ansi:greenBright",
    diffRemovedWord: "ansi:redBright",
    red_FOR_SUBAGENTS_ONLY: "ansi:redBright",
    blue_FOR_SUBAGENTS_ONLY: "ansi:blueBright",
    green_FOR_SUBAGENTS_ONLY: "ansi:greenBright",
    yellow_FOR_SUBAGENTS_ONLY: "ansi:yellowBright",
    purple_FOR_SUBAGENTS_ONLY: "ansi:magentaBright",
    orange_FOR_SUBAGENTS_ONLY: "ansi:redBright",
    pink_FOR_SUBAGENTS_ONLY: "ansi:magentaBright",
    cyan_FOR_SUBAGENTS_ONLY: "ansi:cyanBright",
    professionalBlue: "rgb(106,155,204)",
    chromeYellow: "ansi:yellowBright",
    clawd_body: "ansi:redBright",
    clawd_background: "ansi:black",
    userMessageBackground: "ansi:blackBright",
    userMessageBackgroundHover: "ansi:white",
    messageActionsBackground: "ansi:blackBright",
    selectionBg: "ansi:blue",
    bashMessageBackgroundColor: "ansi:black",
    memoryBackgroundColor: "ansi:blackBright",
    rate_limit_fill: "ansi:yellow",
    rate_limit_empty: "ansi:white",
    fastMode: "ansi:redBright",
    fastModeShimmer: "ansi:redBright",
    briefLabelYou: "ansi:blueBright",
    briefLabelClaude: "ansi:redBright",
    rainbow_red: "ansi:red",
    rainbow_orange: "ansi:redBright",
    rainbow_yellow: "ansi:yellow",
    rainbow_green: "ansi:green",
    rainbow_blue: "ansi:cyan",
    rainbow_indigo: "ansi:blue",
    rainbow_violet: "ansi:magenta",
    rainbow_red_shimmer: "ansi:redBright",
    rainbow_orange_shimmer: "ansi:yellow",
    rainbow_yellow_shimmer: "ansi:yellowBright",
    rainbow_green_shimmer: "ansi:greenBright",
    rainbow_blue_shimmer: "ansi:cyanBright",
    rainbow_indigo_shimmer: "ansi:blueBright",
    rainbow_violet_shimmer: "ansi:magentaBright"
  };
  lightDaltonizedTheme = {
    autoAccept: "rgb(135,0,255)",
    bashBorder: "rgb(0,102,204)",
    claude: "rgb(255,153,51)",
    claudeShimmer: "rgb(255,183,101)",
    claudeBlue_FOR_SYSTEM_SPINNER: "rgb(51,102,255)",
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: "rgb(101,152,255)",
    permission: "rgb(51,102,255)",
    permissionShimmer: "rgb(101,152,255)",
    planMode: "rgb(51,102,102)",
    ide: "rgb(71,130,200)",
    promptBorder: "rgb(153,153,153)",
    promptBorderShimmer: "rgb(183,183,183)",
    text: "rgb(0,0,0)",
    inverseText: "rgb(255,255,255)",
    inactive: "rgb(102,102,102)",
    inactiveShimmer: "rgb(142,142,142)",
    subtle: "rgb(175,175,175)",
    suggestion: "rgb(51,102,255)",
    remember: "rgb(51,102,255)",
    background: "rgb(0,153,153)",
    success: "rgb(0,102,153)",
    error: "rgb(204,0,0)",
    warning: "rgb(255,153,0)",
    merged: "rgb(135,0,255)",
    warningShimmer: "rgb(255,183,50)",
    diffAdded: "rgb(153,204,255)",
    diffRemoved: "rgb(255,204,204)",
    diffAddedDimmed: "rgb(209,231,253)",
    diffRemovedDimmed: "rgb(255,233,233)",
    diffAddedWord: "rgb(51,102,204)",
    diffRemovedWord: "rgb(153,51,51)",
    red_FOR_SUBAGENTS_ONLY: "rgb(204,0,0)",
    blue_FOR_SUBAGENTS_ONLY: "rgb(0,102,204)",
    green_FOR_SUBAGENTS_ONLY: "rgb(0,204,0)",
    yellow_FOR_SUBAGENTS_ONLY: "rgb(255,204,0)",
    purple_FOR_SUBAGENTS_ONLY: "rgb(128,0,128)",
    orange_FOR_SUBAGENTS_ONLY: "rgb(255,128,0)",
    pink_FOR_SUBAGENTS_ONLY: "rgb(255,102,178)",
    cyan_FOR_SUBAGENTS_ONLY: "rgb(0,178,178)",
    professionalBlue: "rgb(106,155,204)",
    chromeYellow: "rgb(251,188,4)",
    clawd_body: "rgb(215,119,87)",
    clawd_background: "rgb(0,0,0)",
    userMessageBackground: "rgb(220, 220, 220)",
    userMessageBackgroundHover: "rgb(232, 232, 232)",
    messageActionsBackground: "rgb(210, 216, 226)",
    selectionBg: "rgb(180, 213, 255)",
    bashMessageBackgroundColor: "rgb(250, 245, 250)",
    memoryBackgroundColor: "rgb(230, 245, 250)",
    rate_limit_fill: "rgb(51,102,255)",
    rate_limit_empty: "rgb(23,46,114)",
    fastMode: "rgb(255,106,0)",
    fastModeShimmer: "rgb(255,150,50)",
    briefLabelYou: "rgb(37,99,235)",
    briefLabelClaude: "rgb(255,153,51)",
    rainbow_red: "rgb(235,95,87)",
    rainbow_orange: "rgb(245,139,87)",
    rainbow_yellow: "rgb(250,195,95)",
    rainbow_green: "rgb(145,200,130)",
    rainbow_blue: "rgb(130,170,220)",
    rainbow_indigo: "rgb(155,130,200)",
    rainbow_violet: "rgb(200,130,180)",
    rainbow_red_shimmer: "rgb(250,155,147)",
    rainbow_orange_shimmer: "rgb(255,185,137)",
    rainbow_yellow_shimmer: "rgb(255,225,155)",
    rainbow_green_shimmer: "rgb(185,230,180)",
    rainbow_blue_shimmer: "rgb(180,205,240)",
    rainbow_indigo_shimmer: "rgb(195,180,230)",
    rainbow_violet_shimmer: "rgb(230,180,210)"
  };
  darkTheme = {
    autoAccept: "rgb(175,135,255)",
    bashBorder: "rgb(253,93,177)",
    claude: "rgb(215,119,87)",
    claudeShimmer: "rgb(235,159,127)",
    claudeBlue_FOR_SYSTEM_SPINNER: "rgb(147,165,255)",
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: "rgb(177,195,255)",
    permission: "rgb(177,185,249)",
    permissionShimmer: "rgb(207,215,255)",
    planMode: "rgb(72,150,140)",
    ide: "rgb(71,130,200)",
    promptBorder: "rgb(136,136,136)",
    promptBorderShimmer: "rgb(166,166,166)",
    text: "rgb(255,255,255)",
    inverseText: "rgb(0,0,0)",
    inactive: "rgb(153,153,153)",
    inactiveShimmer: "rgb(193,193,193)",
    subtle: "rgb(80,80,80)",
    suggestion: "rgb(177,185,249)",
    remember: "rgb(177,185,249)",
    background: "rgb(0,204,204)",
    success: "rgb(78,186,101)",
    error: "rgb(255,107,128)",
    warning: "rgb(255,193,7)",
    merged: "rgb(175,135,255)",
    warningShimmer: "rgb(255,223,57)",
    diffAdded: "rgb(34,92,43)",
    diffRemoved: "rgb(122,41,54)",
    diffAddedDimmed: "rgb(71,88,74)",
    diffRemovedDimmed: "rgb(105,72,77)",
    diffAddedWord: "rgb(56,166,96)",
    diffRemovedWord: "rgb(179,89,107)",
    red_FOR_SUBAGENTS_ONLY: "rgb(220,38,38)",
    blue_FOR_SUBAGENTS_ONLY: "rgb(37,99,235)",
    green_FOR_SUBAGENTS_ONLY: "rgb(22,163,74)",
    yellow_FOR_SUBAGENTS_ONLY: "rgb(202,138,4)",
    purple_FOR_SUBAGENTS_ONLY: "rgb(147,51,234)",
    orange_FOR_SUBAGENTS_ONLY: "rgb(234,88,12)",
    pink_FOR_SUBAGENTS_ONLY: "rgb(219,39,119)",
    cyan_FOR_SUBAGENTS_ONLY: "rgb(8,145,178)",
    professionalBlue: "rgb(106,155,204)",
    chromeYellow: "rgb(251,188,4)",
    clawd_body: "rgb(215,119,87)",
    clawd_background: "rgb(0,0,0)",
    userMessageBackground: "rgb(55, 55, 55)",
    userMessageBackgroundHover: "rgb(70, 70, 70)",
    messageActionsBackground: "rgb(44, 50, 62)",
    selectionBg: "rgb(38, 79, 120)",
    bashMessageBackgroundColor: "rgb(65, 60, 65)",
    memoryBackgroundColor: "rgb(55, 65, 70)",
    rate_limit_fill: "rgb(177,185,249)",
    rate_limit_empty: "rgb(80,83,112)",
    fastMode: "rgb(255,120,20)",
    fastModeShimmer: "rgb(255,165,70)",
    briefLabelYou: "rgb(122,180,232)",
    briefLabelClaude: "rgb(215,119,87)",
    rainbow_red: "rgb(235,95,87)",
    rainbow_orange: "rgb(245,139,87)",
    rainbow_yellow: "rgb(250,195,95)",
    rainbow_green: "rgb(145,200,130)",
    rainbow_blue: "rgb(130,170,220)",
    rainbow_indigo: "rgb(155,130,200)",
    rainbow_violet: "rgb(200,130,180)",
    rainbow_red_shimmer: "rgb(250,155,147)",
    rainbow_orange_shimmer: "rgb(255,185,137)",
    rainbow_yellow_shimmer: "rgb(255,225,155)",
    rainbow_green_shimmer: "rgb(185,230,180)",
    rainbow_blue_shimmer: "rgb(180,205,240)",
    rainbow_indigo_shimmer: "rgb(195,180,230)",
    rainbow_violet_shimmer: "rgb(230,180,210)"
  };
  darkDaltonizedTheme = {
    autoAccept: "rgb(175,135,255)",
    bashBorder: "rgb(51,153,255)",
    claude: "rgb(255,153,51)",
    claudeShimmer: "rgb(255,183,101)",
    claudeBlue_FOR_SYSTEM_SPINNER: "rgb(153,204,255)",
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: "rgb(183,224,255)",
    permission: "rgb(153,204,255)",
    permissionShimmer: "rgb(183,224,255)",
    planMode: "rgb(102,153,153)",
    ide: "rgb(71,130,200)",
    promptBorder: "rgb(136,136,136)",
    promptBorderShimmer: "rgb(166,166,166)",
    text: "rgb(255,255,255)",
    inverseText: "rgb(0,0,0)",
    inactive: "rgb(153,153,153)",
    inactiveShimmer: "rgb(193,193,193)",
    subtle: "rgb(80,80,80)",
    suggestion: "rgb(153,204,255)",
    remember: "rgb(153,204,255)",
    background: "rgb(0,204,204)",
    success: "rgb(51,153,255)",
    error: "rgb(255,102,102)",
    warning: "rgb(255,204,0)",
    merged: "rgb(175,135,255)",
    warningShimmer: "rgb(255,234,50)",
    diffAdded: "rgb(0,68,102)",
    diffRemoved: "rgb(102,0,0)",
    diffAddedDimmed: "rgb(62,81,91)",
    diffRemovedDimmed: "rgb(62,44,44)",
    diffAddedWord: "rgb(0,119,179)",
    diffRemovedWord: "rgb(179,0,0)",
    red_FOR_SUBAGENTS_ONLY: "rgb(255,102,102)",
    blue_FOR_SUBAGENTS_ONLY: "rgb(102,178,255)",
    green_FOR_SUBAGENTS_ONLY: "rgb(102,255,102)",
    yellow_FOR_SUBAGENTS_ONLY: "rgb(255,255,102)",
    purple_FOR_SUBAGENTS_ONLY: "rgb(178,102,255)",
    orange_FOR_SUBAGENTS_ONLY: "rgb(255,178,102)",
    pink_FOR_SUBAGENTS_ONLY: "rgb(255,153,204)",
    cyan_FOR_SUBAGENTS_ONLY: "rgb(102,204,204)",
    professionalBlue: "rgb(106,155,204)",
    chromeYellow: "rgb(251,188,4)",
    clawd_body: "rgb(215,119,87)",
    clawd_background: "rgb(0,0,0)",
    userMessageBackground: "rgb(55, 55, 55)",
    userMessageBackgroundHover: "rgb(70, 70, 70)",
    messageActionsBackground: "rgb(44, 50, 62)",
    selectionBg: "rgb(38, 79, 120)",
    bashMessageBackgroundColor: "rgb(65, 60, 65)",
    memoryBackgroundColor: "rgb(55, 65, 70)",
    rate_limit_fill: "rgb(153,204,255)",
    rate_limit_empty: "rgb(69,92,115)",
    fastMode: "rgb(255,120,20)",
    fastModeShimmer: "rgb(255,165,70)",
    briefLabelYou: "rgb(122,180,232)",
    briefLabelClaude: "rgb(255,153,51)",
    rainbow_red: "rgb(235,95,87)",
    rainbow_orange: "rgb(245,139,87)",
    rainbow_yellow: "rgb(250,195,95)",
    rainbow_green: "rgb(145,200,130)",
    rainbow_blue: "rgb(130,170,220)",
    rainbow_indigo: "rgb(155,130,200)",
    rainbow_violet: "rgb(200,130,180)",
    rainbow_red_shimmer: "rgb(250,155,147)",
    rainbow_orange_shimmer: "rgb(255,185,137)",
    rainbow_yellow_shimmer: "rgb(255,225,155)",
    rainbow_green_shimmer: "rgb(185,230,180)",
    rainbow_blue_shimmer: "rgb(180,205,240)",
    rainbow_indigo_shimmer: "rgb(195,180,230)",
    rainbow_violet_shimmer: "rgb(230,180,210)"
  };
  chalkForChart = process.env.TERM_PROGRAM === "Apple_Terminal" ? new Chalk({ level: 2 }) : source_default;
});

// node_modules/.bun/lodash.debounce@4.0.8/node_modules/lodash.debounce/index.js
var require_lodash = __commonJS((exports, module) => {
  var FUNC_ERROR_TEXT3 = "Expected a function";
  var NAN2 = 0 / 0;
  var symbolTag = "[object Symbol]";
  var reTrim = /^\s+|\s+$/g;
  var reIsBadHex2 = /^[-+]0x[0-9a-f]+$/i;
  var reIsBinary2 = /^0b[01]+$/i;
  var reIsOctal2 = /^0o[0-7]+$/i;
  var freeParseInt2 = parseInt;
  var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
  var freeSelf = typeof self == "object" && self && self.Object === Object && self;
  var root = freeGlobal || freeSelf || Function("return this")();
  var objectProto = Object.prototype;
  var objectToString = objectProto.toString;
  var nativeMax2 = Math.max;
  var nativeMin2 = Math.min;
  var now2 = function() {
    return root.Date.now();
  };
  function debounce2(func, wait, options) {
    var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
    if (typeof func != "function") {
      throw new TypeError(FUNC_ERROR_TEXT3);
    }
    wait = toNumber2(wait) || 0;
    if (isObject(options)) {
      leading = !!options.leading;
      maxing = "maxWait" in options;
      maxWait = maxing ? nativeMax2(toNumber2(options.maxWait) || 0, wait) : maxWait;
      trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    function invokeFunc(time) {
      var args = lastArgs, thisArg = lastThis;
      lastArgs = lastThis = undefined;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }
    function leadingEdge2(time) {
      lastInvokeTime = time;
      timerId = setTimeout(timerExpired, wait);
      return leading ? invokeFunc(time) : result;
    }
    function remainingWait(time) {
      var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, result2 = wait - timeSinceLastCall;
      return maxing ? nativeMin2(result2, maxWait - timeSinceLastInvoke) : result2;
    }
    function shouldInvoke(time) {
      var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
      return lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
    }
    function timerExpired() {
      var time = now2();
      if (shouldInvoke(time)) {
        return trailingEdge2(time);
      }
      timerId = setTimeout(timerExpired, remainingWait(time));
    }
    function trailingEdge2(time) {
      timerId = undefined;
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = undefined;
      return result;
    }
    function cancel() {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timerId = undefined;
    }
    function flush() {
      return timerId === undefined ? result : trailingEdge2(now2());
    }
    function debounced() {
      var time = now2(), isInvoking = shouldInvoke(time);
      lastArgs = arguments;
      lastThis = this;
      lastCallTime = time;
      if (isInvoking) {
        if (timerId === undefined) {
          return leadingEdge2(lastCallTime);
        }
        if (maxing) {
          timerId = setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timerId === undefined) {
        timerId = setTimeout(timerExpired, wait);
      }
      return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
  }
  function isObject(value) {
    var type = typeof value;
    return !!value && (type == "object" || type == "function");
  }
  function isObjectLike(value) {
    return !!value && typeof value == "object";
  }
  function isSymbol(value) {
    return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
  }
  function toNumber2(value) {
    if (typeof value == "number") {
      return value;
    }
    if (isSymbol(value)) {
      return NAN2;
    }
    if (isObject(value)) {
      var other = typeof value.valueOf == "function" ? value.valueOf() : value;
      value = isObject(other) ? other + "" : other;
    }
    if (typeof value != "string") {
      return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, "");
    var isBinary = reIsBinary2.test(value);
    return isBinary || reIsOctal2.test(value) ? freeParseInt2(value.slice(2), isBinary ? 2 : 8) : reIsBadHex2.test(value) ? NAN2 : +value;
  }
  module.exports = debounce2;
});

// node_modules/.bun/usehooks-ts@3.1.1+3f10a4be4e334a9b/node_modules/usehooks-ts/dist/index.js
function useInterval(callback, delay) {
  const savedCallback = import_react10.useRef(callback);
  useIsomorphicLayoutEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  import_react10.useEffect(() => {
    if (delay === null) {
      return;
    }
    const id = setInterval(() => {
      savedCallback.current();
    }, delay);
    return () => {
      clearInterval(id);
    };
  }, [delay]);
}
function useEventCallback(fn) {
  const ref = import_react10.useRef(() => {
    throw new Error("Cannot call an event handler while rendering.");
  });
  useIsomorphicLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);
  return import_react10.useCallback((...args) => {
    var _a;
    return (_a = ref.current) == null ? undefined : _a.call(ref, ...args);
  }, [ref]);
}
function useUnmount(func) {
  const funcRef = import_react10.useRef(func);
  funcRef.current = func;
  import_react10.useEffect(() => () => {
    funcRef.current();
  }, []);
}
function useDebounceCallback(func, delay = 500, options) {
  const debouncedFunc = import_react10.useRef();
  useUnmount(() => {
    if (debouncedFunc.current) {
      debouncedFunc.current.cancel();
    }
  });
  const debounced = import_react10.useMemo(() => {
    const debouncedFuncInstance = import_lodash.default(func, delay, options);
    const wrappedFunc = (...args) => {
      return debouncedFuncInstance(...args);
    };
    wrappedFunc.cancel = () => {
      debouncedFuncInstance.cancel();
    };
    wrappedFunc.isPending = () => {
      return !!debouncedFunc.current;
    };
    wrappedFunc.flush = () => {
      return debouncedFuncInstance.flush();
    };
    return wrappedFunc;
  }, [func, delay, options]);
  import_react10.useEffect(() => {
    debouncedFunc.current = import_lodash.default(func, delay, options);
  }, [func, delay, options]);
  return debounced;
}
var import_react10, import_lodash, useIsomorphicLayoutEffect;
var init_dist3 = __esm(() => {
  import_react10 = __toESM(require_react(), 1);
  import_lodash = __toESM(require_lodash(), 1);
  useIsomorphicLayoutEffect = typeof window !== "undefined" ? import_react10.useLayoutEffect : import_react10.useEffect;
});

// packages/@ant/ink/src/hooks/use-stdin.ts
var import_react11, useStdin = () => import_react11.useContext(StdinContext_default), use_stdin_default;
var init_use_stdin = __esm(() => {
  init_StdinContext();
  import_react11 = __toESM(require_react(), 1);
  use_stdin_default = useStdin;
});

// packages/@ant/ink/src/hooks/use-input.ts
var import_react12, useInput = (inputHandler, options = {}) => {
  const { setRawMode, internal_exitOnCtrlC, internal_eventEmitter } = use_stdin_default();
  import_react12.useLayoutEffect(() => {
    if (options.isActive === false) {
      return;
    }
    setRawMode(true);
    return () => {
      setRawMode(false);
    };
  }, [options.isActive, setRawMode]);
  const handleData = useEventCallback((event) => {
    if (options.isActive === false) {
      return;
    }
    const { input, key } = event;
    if (!(input === "c" && key.ctrl) || !internal_exitOnCtrlC) {
      inputHandler(input, key, event);
    }
  });
  import_react12.useEffect(() => {
    internal_eventEmitter?.on("input", handleData);
    return () => {
      internal_eventEmitter?.removeListener("input", handleData);
    };
  }, [internal_eventEmitter, handleData]);
}, use_input_default;
var init_use_input = __esm(() => {
  init_dist3();
  init_use_stdin();
  import_react12 = __toESM(require_react(), 1);
  use_input_default = useInput;
});

// packages/@ant/ink/src/keybindings/match.ts
function getInkModifiers(key) {
  return {
    ctrl: key.ctrl,
    shift: key.shift,
    meta: key.meta,
    super: key.super
  };
}
function getKeyName(input, key) {
  if (key.escape)
    return "escape";
  if (key.return)
    return "enter";
  if (key.tab)
    return "tab";
  if (key.backspace)
    return "backspace";
  if (key.delete)
    return "delete";
  if (key.upArrow)
    return "up";
  if (key.downArrow)
    return "down";
  if (key.leftArrow)
    return "left";
  if (key.rightArrow)
    return "right";
  if (key.pageUp)
    return "pageup";
  if (key.pageDown)
    return "pagedown";
  if (key.wheelUp)
    return "wheelup";
  if (key.wheelDown)
    return "wheeldown";
  if (key.home)
    return "home";
  if (key.end)
    return "end";
  if (input.length === 1)
    return input.toLowerCase();
  return null;
}
function modifiersMatch(inkMods, target) {
  if (inkMods.ctrl !== target.ctrl)
    return false;
  if (inkMods.shift !== target.shift)
    return false;
  const targetNeedsMeta = target.alt || target.meta;
  if (inkMods.meta !== targetNeedsMeta)
    return false;
  if (inkMods.super !== target.super)
    return false;
  return true;
}
function matchesKeystroke(input, key, target) {
  const keyName2 = getKeyName(input, key);
  if (keyName2 !== target.key)
    return false;
  const inkMods = getInkModifiers(key);
  if (key.escape) {
    return modifiersMatch({ ...inkMods, meta: false }, target);
  }
  return modifiersMatch(inkMods, target);
}
function matchesBinding(input, key, binding) {
  if (binding.chord.length !== 1)
    return false;
  const keystroke = binding.chord[0];
  if (!keystroke)
    return false;
  return matchesKeystroke(input, key, keystroke);
}
var init_match = () => {};

// packages/@ant/ink/src/keybindings/parser.ts
function parseKeystroke(input) {
  const parts = input.split("+");
  const keystroke = {
    key: "",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    super: false
  };
  for (const part of parts) {
    const lower = part.toLowerCase();
    switch (lower) {
      case "ctrl":
      case "control":
        keystroke.ctrl = true;
        break;
      case "alt":
      case "opt":
      case "option":
        keystroke.alt = true;
        break;
      case "shift":
        keystroke.shift = true;
        break;
      case "meta":
        keystroke.meta = true;
        break;
      case "cmd":
      case "command":
      case "super":
      case "win":
        keystroke.super = true;
        break;
      case "esc":
        keystroke.key = "escape";
        break;
      case "return":
        keystroke.key = "enter";
        break;
      case "space":
        keystroke.key = " ";
        break;
      case "\u2191":
        keystroke.key = "up";
        break;
      case "\u2193":
        keystroke.key = "down";
        break;
      case "\u2190":
        keystroke.key = "left";
        break;
      case "\u2192":
        keystroke.key = "right";
        break;
      default:
        keystroke.key = lower;
        break;
    }
  }
  return keystroke;
}
function parseChord(input) {
  if (input === " ")
    return [parseKeystroke("space")];
  return input.trim().split(/\s+/).map(parseKeystroke);
}
function keystrokeToString(ks) {
  const parts = [];
  if (ks.ctrl)
    parts.push("ctrl");
  if (ks.alt)
    parts.push("alt");
  if (ks.shift)
    parts.push("shift");
  if (ks.meta)
    parts.push("meta");
  if (ks.super)
    parts.push("cmd");
  const displayKey = keyToDisplayName(ks.key);
  parts.push(displayKey);
  return parts.join("+");
}
function keyToDisplayName(key) {
  switch (key) {
    case "escape":
      return "Esc";
    case " ":
      return "Space";
    case "tab":
      return "tab";
    case "enter":
      return "Enter";
    case "backspace":
      return "Backspace";
    case "delete":
      return "Delete";
    case "up":
      return "\u2191";
    case "down":
      return "\u2193";
    case "left":
      return "\u2190";
    case "right":
      return "\u2192";
    case "pageup":
      return "PageUp";
    case "pagedown":
      return "PageDown";
    case "home":
      return "Home";
    case "end":
      return "End";
    default:
      return key;
  }
}
function chordToString(chord) {
  return chord.map(keystrokeToString).join(" ");
}
function keystrokeToDisplayString(ks, platform = "linux") {
  const parts = [];
  if (ks.ctrl)
    parts.push("ctrl");
  if (ks.alt || ks.meta) {
    parts.push(platform === "macos" ? "opt" : "alt");
  }
  if (ks.shift)
    parts.push("shift");
  if (ks.super) {
    parts.push(platform === "macos" ? "cmd" : "super");
  }
  const displayKey = keyToDisplayName(ks.key);
  parts.push(displayKey);
  return parts.join("+");
}
function chordToDisplayString(chord, platform = "linux") {
  return chord.map((ks) => keystrokeToDisplayString(ks, platform)).join(" ");
}
function parseBindings(blocks) {
  const bindings = [];
  for (const block of blocks) {
    for (const [key, action] of Object.entries(block.bindings)) {
      bindings.push({
        chord: parseChord(key),
        action,
        context: block.context
      });
    }
  }
  return bindings;
}
var init_parser = () => {};

// packages/@ant/ink/src/keybindings/resolver.ts
function resolveKey(input, key, activeContexts, bindings) {
  let match;
  const ctxSet = new Set(activeContexts);
  for (const binding of bindings) {
    if (binding.chord.length !== 1)
      continue;
    if (!ctxSet.has(binding.context))
      continue;
    if (matchesBinding(input, key, binding)) {
      match = binding;
    }
  }
  if (!match) {
    return { type: "none" };
  }
  if (match.action === null) {
    return { type: "unbound" };
  }
  return { type: "match", action: match.action };
}
function getBindingDisplayText(action, context, bindings) {
  const binding = bindings.findLast((b) => b.action === action && b.context === context);
  return binding ? chordToString(binding.chord) : undefined;
}
function buildKeystroke(input, key) {
  const keyName2 = getKeyName(input, key);
  if (!keyName2)
    return null;
  const effectiveMeta = key.escape ? false : key.meta;
  return {
    key: keyName2,
    ctrl: key.ctrl,
    alt: effectiveMeta,
    shift: key.shift,
    meta: effectiveMeta,
    super: key.super
  };
}
function keystrokesEqual(a, b) {
  return a.key === b.key && a.ctrl === b.ctrl && a.shift === b.shift && (a.alt || a.meta) === (b.alt || b.meta) && a.super === b.super;
}
function chordPrefixMatches(prefix, binding) {
  if (prefix.length >= binding.chord.length)
    return false;
  for (let i = 0;i < prefix.length; i++) {
    const prefixKey = prefix[i];
    const bindingKey = binding.chord[i];
    if (!prefixKey || !bindingKey)
      return false;
    if (!keystrokesEqual(prefixKey, bindingKey))
      return false;
  }
  return true;
}
function chordExactlyMatches(chord, binding) {
  if (chord.length !== binding.chord.length)
    return false;
  for (let i = 0;i < chord.length; i++) {
    const chordKey = chord[i];
    const bindingKey = binding.chord[i];
    if (!chordKey || !bindingKey)
      return false;
    if (!keystrokesEqual(chordKey, bindingKey))
      return false;
  }
  return true;
}
function resolveKeyWithChordState(input, key, activeContexts, bindings, pending) {
  if (key.escape && pending !== null) {
    return { type: "chord_cancelled" };
  }
  const currentKeystroke = buildKeystroke(input, key);
  if (!currentKeystroke) {
    if (pending !== null) {
      return { type: "chord_cancelled" };
    }
    return { type: "none" };
  }
  const testChord = pending ? [...pending, currentKeystroke] : [currentKeystroke];
  const ctxSet = new Set(activeContexts);
  const contextBindings = bindings.filter((b) => ctxSet.has(b.context));
  const chordWinners = new Map;
  for (const binding of contextBindings) {
    if (binding.chord.length > testChord.length && chordPrefixMatches(testChord, binding)) {
      chordWinners.set(chordToString(binding.chord), binding.action);
    }
  }
  let hasLongerChords = false;
  for (const action of chordWinners.values()) {
    if (action !== null) {
      hasLongerChords = true;
      break;
    }
  }
  if (hasLongerChords) {
    return { type: "chord_started", pending: testChord };
  }
  let exactMatch;
  for (const binding of contextBindings) {
    if (chordExactlyMatches(testChord, binding)) {
      exactMatch = binding;
    }
  }
  if (exactMatch) {
    if (exactMatch.action === null) {
      return { type: "unbound" };
    }
    return { type: "match", action: exactMatch.action };
  }
  if (pending !== null) {
    return { type: "chord_cancelled" };
  }
  return { type: "none" };
}
var init_resolver = __esm(() => {
  init_match();
  init_parser();
});

// packages/@ant/ink/src/keybindings/KeybindingContext.tsx
function KeybindingProvider({
  bindings,
  pendingChordRef,
  pendingChord,
  setPendingChord,
  activeContexts,
  registerActiveContext,
  unregisterActiveContext,
  handlerRegistryRef,
  children
}) {
  const value = import_react13.useMemo(() => {
    const getDisplay = (action, context) => getBindingDisplayText(action, context, bindings);
    const registerHandler = (registration) => {
      const registry = handlerRegistryRef.current;
      if (!registry)
        return () => {};
      if (!registry.has(registration.action)) {
        registry.set(registration.action, new Set);
      }
      registry.get(registration.action).add(registration);
      return () => {
        const handlers = registry.get(registration.action);
        if (handlers) {
          handlers.delete(registration);
          if (handlers.size === 0) {
            registry.delete(registration.action);
          }
        }
      };
    };
    const invokeAction = (action) => {
      const registry = handlerRegistryRef.current;
      if (!registry)
        return false;
      const handlers = registry.get(action);
      if (!handlers || handlers.size === 0)
        return false;
      for (const registration of handlers) {
        if (activeContexts.has(registration.context)) {
          registration.handler();
          return true;
        }
      }
      return false;
    };
    return {
      resolve: (input, key, contexts) => resolveKeyWithChordState(input, key, contexts, bindings, pendingChordRef.current),
      setPendingChord,
      getDisplayText: getDisplay,
      bindings,
      pendingChord,
      activeContexts,
      registerActiveContext,
      unregisterActiveContext,
      registerHandler,
      invokeAction
    };
  }, [
    bindings,
    pendingChordRef,
    pendingChord,
    setPendingChord,
    activeContexts,
    registerActiveContext,
    unregisterActiveContext,
    handlerRegistryRef
  ]);
  return /* @__PURE__ */ jsx_runtime8.jsx(KeybindingContext.Provider, {
    value,
    children
  });
}
function useKeybindingContext() {
  const ctx = import_react13.useContext(KeybindingContext);
  if (!ctx) {
    throw new Error("useKeybindingContext must be used within KeybindingProvider");
  }
  return ctx;
}
function useOptionalKeybindingContext() {
  return import_react13.useContext(KeybindingContext);
}
function useRegisterKeybindingContext(context, isActive = true) {
  const keybindingContext = useOptionalKeybindingContext();
  import_react13.useLayoutEffect(() => {
    if (!keybindingContext || !isActive)
      return;
    keybindingContext.registerActiveContext(context);
    return () => {
      keybindingContext.unregisterActiveContext(context);
    };
  }, [context, keybindingContext, isActive]);
}
var import_react13, jsx_runtime8, KeybindingContext;
var init_KeybindingContext = __esm(() => {
  init_resolver();
  import_react13 = __toESM(require_react(), 1);
  jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
  KeybindingContext = import_react13.createContext(null);
});

// packages/@ant/ink/src/keybindings/useKeybinding.ts
function useKeybinding(action, handler, options = {}) {
  const { context = "Global", isActive = true } = options;
  const keybindingContext = useOptionalKeybindingContext();
  import_react14.useEffect(() => {
    if (!keybindingContext || !isActive)
      return;
    return keybindingContext.registerHandler({ action, context, handler });
  }, [action, context, handler, keybindingContext, isActive]);
  const handleInput = import_react14.useCallback((input, key, event) => {
    if (!keybindingContext)
      return;
    const contextsToCheck = [
      ...keybindingContext.activeContexts,
      context,
      "Global"
    ];
    const uniqueContexts = [...new Set(contextsToCheck)];
    const result = keybindingContext.resolve(input, key, uniqueContexts);
    switch (result.type) {
      case "match":
        keybindingContext.setPendingChord(null);
        if (result.action === action) {
          if (handler() !== false) {
            event.stopImmediatePropagation();
          }
        }
        break;
      case "chord_started":
        keybindingContext.setPendingChord(result.pending);
        event.stopImmediatePropagation();
        break;
      case "chord_cancelled":
        keybindingContext.setPendingChord(null);
        break;
      case "unbound":
        keybindingContext.setPendingChord(null);
        event.stopImmediatePropagation();
        break;
      case "none":
        break;
    }
  }, [action, context, handler, keybindingContext]);
  use_input_default(handleInput, { isActive });
}
function useKeybindings(handlers, options = {}) {
  const { context = "Global", isActive = true } = options;
  const keybindingContext = useOptionalKeybindingContext();
  import_react14.useEffect(() => {
    if (!keybindingContext || !isActive)
      return;
    const unregisterFns = [];
    for (const [action, handler] of Object.entries(handlers)) {
      unregisterFns.push(keybindingContext.registerHandler({ action, context, handler }));
    }
    return () => {
      for (const unregister of unregisterFns) {
        unregister();
      }
    };
  }, [context, handlers, keybindingContext, isActive]);
  const handleInput = import_react14.useCallback((input, key, event) => {
    if (!keybindingContext)
      return;
    const contextsToCheck = [
      ...keybindingContext.activeContexts,
      context,
      "Global"
    ];
    const uniqueContexts = [...new Set(contextsToCheck)];
    const result = keybindingContext.resolve(input, key, uniqueContexts);
    switch (result.type) {
      case "match":
        keybindingContext.setPendingChord(null);
        if (result.action in handlers) {
          const handler = handlers[result.action];
          if (handler && handler() !== false) {
            event.stopImmediatePropagation();
          }
        }
        break;
      case "chord_started":
        keybindingContext.setPendingChord(result.pending);
        event.stopImmediatePropagation();
        break;
      case "chord_cancelled":
        keybindingContext.setPendingChord(null);
        break;
      case "unbound":
        keybindingContext.setPendingChord(null);
        event.stopImmediatePropagation();
        break;
      case "none":
        break;
    }
  }, [context, handlers, keybindingContext]);
  use_input_default(handleInput, { isActive });
}
var import_react14;
var init_useKeybinding = __esm(() => {
  init_use_input();
  init_KeybindingContext();
  import_react14 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/keybindings/KeybindingSetup.tsx
function KeybindingSetup({
  children,
  loadBindings,
  subscribeToChanges,
  initWatcher,
  onWarnings,
  onDebugLog
}) {
  const [loadResult, setLoadResult] = import_react15.useState(() => {
    const result = loadBindings();
    onDebugLog?.(`[keybindings] KeybindingSetup initialized with ${result.bindings.length} bindings, ${result.warnings.length} warnings`);
    return result;
  });
  const { bindings, warnings } = loadResult;
  const [isReload, setIsReload] = import_react15.useState(false);
  import_react15.useEffect(() => {
    onWarnings?.(warnings, isReload);
  }, [warnings, isReload, onWarnings]);
  const pendingChordRef = import_react15.useRef(null);
  const [pendingChord, setPendingChordState] = import_react15.useState(null);
  const chordTimeoutRef = import_react15.useRef(null);
  const handlerRegistryRef = import_react15.useRef(new Map);
  const activeContextsRef = import_react15.useRef(new Set);
  const registerActiveContext = import_react15.useCallback((context) => {
    activeContextsRef.current.add(context);
  }, []);
  const unregisterActiveContext = import_react15.useCallback((context) => {
    activeContextsRef.current.delete(context);
  }, []);
  const clearChordTimeout = import_react15.useCallback(() => {
    if (chordTimeoutRef.current) {
      clearTimeout(chordTimeoutRef.current);
      chordTimeoutRef.current = null;
    }
  }, []);
  const setPendingChord = import_react15.useCallback((pending) => {
    clearChordTimeout();
    if (pending !== null) {
      chordTimeoutRef.current = setTimeout((pendingChordRef2, setPendingChordState2) => {
        onDebugLog?.("[keybindings] Chord timeout - cancelling");
        pendingChordRef2.current = null;
        setPendingChordState2(null);
      }, CHORD_TIMEOUT_MS, pendingChordRef, setPendingChordState);
    }
    pendingChordRef.current = pending;
    setPendingChordState(pending);
  }, [clearChordTimeout, onDebugLog]);
  import_react15.useEffect(() => {
    initWatcher?.();
    const unsubscribe = subscribeToChanges((result) => {
      setIsReload(true);
      setLoadResult(result);
      onDebugLog?.(`[keybindings] Reloaded: ${result.bindings.length} bindings, ${result.warnings.length} warnings`);
    });
    return () => {
      unsubscribe();
      clearChordTimeout();
    };
  }, [subscribeToChanges, initWatcher, clearChordTimeout, onDebugLog]);
  return /* @__PURE__ */ jsx_runtime9.jsxs(KeybindingProvider, {
    bindings,
    pendingChordRef,
    pendingChord,
    setPendingChord,
    activeContexts: activeContextsRef.current,
    registerActiveContext,
    unregisterActiveContext,
    handlerRegistryRef,
    children: [
      /* @__PURE__ */ jsx_runtime9.jsx(ChordInterceptor, {
        bindings,
        pendingChordRef,
        setPendingChord,
        activeContexts: activeContextsRef.current,
        handlerRegistryRef
      }),
      children
    ]
  });
}
function ChordInterceptor({
  bindings,
  pendingChordRef,
  setPendingChord,
  activeContexts,
  handlerRegistryRef
}) {
  const handleInput = import_react15.useCallback((input, key, event) => {
    if ((key.wheelUp || key.wheelDown) && pendingChordRef.current === null) {
      return;
    }
    const registry = handlerRegistryRef.current;
    const handlerContexts = new Set;
    if (registry) {
      for (const handlers of registry.values()) {
        for (const registration of handlers) {
          handlerContexts.add(registration.context);
        }
      }
    }
    const contexts = [...handlerContexts, ...activeContexts, "Global"];
    const wasInChord = pendingChordRef.current !== null;
    const result = resolveKeyWithChordState(input, key, contexts, bindings, pendingChordRef.current);
    switch (result.type) {
      case "chord_started":
        setPendingChord(result.pending);
        event.stopImmediatePropagation();
        break;
      case "match": {
        setPendingChord(null);
        if (wasInChord) {
          const contextsSet = new Set(contexts);
          if (registry) {
            const handlers = registry.get(result.action);
            if (handlers && handlers.size > 0) {
              for (const registration of handlers) {
                if (contextsSet.has(registration.context)) {
                  registration.handler();
                  event.stopImmediatePropagation();
                  break;
                }
              }
            }
          }
        }
        break;
      }
      case "chord_cancelled":
        setPendingChord(null);
        event.stopImmediatePropagation();
        break;
      case "unbound":
        setPendingChord(null);
        event.stopImmediatePropagation();
        break;
      case "none":
        break;
    }
  }, [bindings, pendingChordRef, setPendingChord, activeContexts, handlerRegistryRef]);
  use_input_default(handleInput);
  return null;
}
var import_react15, jsx_runtime9, CHORD_TIMEOUT_MS = 1000;
var init_KeybindingSetup = __esm(() => {
  init_use_input();
  init_KeybindingContext();
  init_resolver();
  import_react15 = __toESM(require_react(), 1);
  jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
});

// node_modules/.bun/has-flag@5.0.1/node_modules/has-flag/index.js
import process3 from "process";
function hasFlag2(flag, argv = process3.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var init_has_flag = () => {};

// node_modules/.bun/supports-hyperlinks@4.4.0/node_modules/supports-hyperlinks/index.js
import process4 from "process";
function parseVersion(versionString = "") {
  if (/^\d{3,4}$/.test(versionString)) {
    const match = /(\d{1,2})(\d{2})/.exec(versionString) ?? [];
    return {
      major: 0,
      minor: Number.parseInt(match[1], 10),
      patch: Number.parseInt(match[2], 10)
    };
  }
  const versions = (versionString ?? "").split(".").map((n) => Number.parseInt(n, 10));
  return {
    major: versions[0],
    minor: versions[1],
    patch: versions[2]
  };
}
function createSupportsHyperlinks(stream) {
  const {
    CI,
    CURSOR_TRACE_ID,
    FORCE_HYPERLINK,
    NETLIFY,
    TEAMCITY_VERSION,
    TERM_PROGRAM,
    TERM_PROGRAM_VERSION,
    VTE_VERSION,
    TERM
  } = process4.env;
  if (FORCE_HYPERLINK) {
    return !(FORCE_HYPERLINK.length > 0 && Number.parseInt(FORCE_HYPERLINK, 10) === 0);
  }
  if (hasFlag2("no-hyperlink") || hasFlag2("no-hyperlinks") || hasFlag2("hyperlink=false") || hasFlag2("hyperlink=never")) {
    return false;
  }
  if (hasFlag2("hyperlink=true") || hasFlag2("hyperlink=always")) {
    return true;
  }
  if (NETLIFY) {
    return true;
  }
  if (!createSupportsColor(stream)) {
    return false;
  }
  if (stream && !stream.isTTY) {
    return false;
  }
  if ("WT_SESSION" in process4.env) {
    return true;
  }
  if (process4.platform === "win32") {
    return false;
  }
  if (CI) {
    return false;
  }
  if (TEAMCITY_VERSION) {
    return false;
  }
  if (TERM_PROGRAM) {
    const version = parseVersion(TERM_PROGRAM_VERSION);
    switch (TERM_PROGRAM) {
      case "iTerm.app": {
        if (version.major === 3) {
          return version.minor >= 1;
        }
        return version.major > 3;
      }
      case "WezTerm": {
        if (/^0-unstable-\d{4}-\d{2}-\d{2}$/.test(TERM_PROGRAM_VERSION)) {
          const date = TERM_PROGRAM_VERSION.slice("0-unstable-".length);
          return date >= "2020-06-20";
        }
        return version.major >= 20200620;
      }
      case "vscode": {
        if (CURSOR_TRACE_ID) {
          return true;
        }
        return version.major > 1 || version.major === 1 && version.minor >= 72;
      }
      case "ghostty": {
        return true;
      }
      case "zed": {
        return true;
      }
    }
  }
  if (VTE_VERSION) {
    if (VTE_VERSION === "0.50.0") {
      return false;
    }
    const version = parseVersion(VTE_VERSION);
    return version.major > 0 || version.minor >= 50;
  }
  switch (TERM) {
    case "alacritty": {
      return true;
    }
    case "xterm-kitty": {
      return true;
    }
  }
  return false;
}
var supportsHyperlinks, supports_hyperlinks_default;
var init_supports_hyperlinks = __esm(() => {
  init_supports_color();
  init_has_flag();
  supportsHyperlinks = {
    stdout: createSupportsHyperlinks(process4.stdout),
    stderr: createSupportsHyperlinks(process4.stderr)
  };
  supports_hyperlinks_default = supportsHyperlinks;
});

// packages/@ant/ink/src/core/supports-hyperlinks.ts
function supportsHyperlinks2(options) {
  const stdoutSupported = options?.stdoutSupported ?? supports_hyperlinks_default.stdout;
  if (stdoutSupported) {
    return true;
  }
  const env2 = options?.env ?? process.env;
  const termProgram = env2["TERM_PROGRAM"];
  if (termProgram && ADDITIONAL_HYPERLINK_TERMINALS.includes(termProgram)) {
    return true;
  }
  const lcTerminal = env2["LC_TERMINAL"];
  if (lcTerminal && ADDITIONAL_HYPERLINK_TERMINALS.includes(lcTerminal)) {
    return true;
  }
  const term = env2["TERM"];
  if (term?.includes("kitty")) {
    return true;
  }
  return false;
}
var ADDITIONAL_HYPERLINK_TERMINALS;
var init_supports_hyperlinks2 = __esm(() => {
  init_supports_hyperlinks();
  ADDITIONAL_HYPERLINK_TERMINALS = [
    "ghostty",
    "Hyper",
    "kitty",
    "alacritty",
    "iTerm.app",
    "iTerm2"
  ];
});

// packages/@ant/ink/src/components/Link.tsx
function Link({ children, url, fallback }) {
  const content = children ?? url;
  if (supportsHyperlinks2()) {
    return /* @__PURE__ */ jsx_runtime10.jsx(Text, {
      children: /* @__PURE__ */ jsx_runtime10.jsx("ink-link", {
        href: url,
        children: content
      })
    });
  }
  return /* @__PURE__ */ jsx_runtime10.jsx(Text, {
    children: fallback ?? content
  });
}
var jsx_runtime10;
var init_Link = __esm(() => {
  init_supports_hyperlinks2();
  init_Text();
  jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/core/termio/esc.ts
function parseEsc(chars) {
  if (chars.length === 0)
    return null;
  const first = chars[0];
  if (first === "c") {
    return { type: "reset" };
  }
  if (first === "7") {
    return { type: "cursor", action: { type: "save" } };
  }
  if (first === "8") {
    return { type: "cursor", action: { type: "restore" } };
  }
  if (first === "D") {
    return {
      type: "cursor",
      action: { type: "move", direction: "down", count: 1 }
    };
  }
  if (first === "M") {
    return {
      type: "cursor",
      action: { type: "move", direction: "up", count: 1 }
    };
  }
  if (first === "E") {
    return { type: "cursor", action: { type: "nextLine", count: 1 } };
  }
  if (first === "H") {
    return null;
  }
  if ("()".includes(first) && chars.length >= 2) {
    return null;
  }
  return { type: "unknown", sequence: `\x1B${chars}` };
}
var init_esc = () => {};

// packages/@ant/ink/src/core/termio/types.ts
function defaultStyle2() {
  return {
    bold: false,
    dim: false,
    italic: false,
    underline: "none",
    blink: false,
    inverse: false,
    hidden: false,
    strikethrough: false,
    overline: false,
    fg: { type: "default" },
    bg: { type: "default" },
    underlineColor: { type: "default" }
  };
}
var init_types = () => {};

// packages/@ant/ink/src/core/termio/sgr.ts
function parseParams(str) {
  if (str === "")
    return [{ value: 0, subparams: [], colon: false }];
  const result = [];
  let current = { value: null, subparams: [], colon: false };
  let num = "";
  let inSub = false;
  for (let i = 0;i <= str.length; i++) {
    const c = str[i];
    if (c === ";" || c === undefined) {
      const n = num === "" ? null : parseInt(num, 10);
      if (inSub) {
        if (n !== null)
          current.subparams.push(n);
      } else {
        current.value = n;
      }
      result.push(current);
      current = { value: null, subparams: [], colon: false };
      num = "";
      inSub = false;
    } else if (c === ":") {
      const n = num === "" ? null : parseInt(num, 10);
      if (!inSub) {
        current.value = n;
        current.colon = true;
        inSub = true;
      } else {
        if (n !== null)
          current.subparams.push(n);
      }
      num = "";
    } else if (c >= "0" && c <= "9") {
      num += c;
    }
  }
  return result;
}
function parseExtendedColor(params, idx) {
  const p = params[idx];
  if (!p)
    return null;
  if (p.colon && p.subparams.length >= 1) {
    if (p.subparams[0] === 5 && p.subparams.length >= 2) {
      return { index: p.subparams[1] };
    }
    if (p.subparams[0] === 2 && p.subparams.length >= 4) {
      const off = p.subparams.length >= 5 ? 1 : 0;
      return {
        r: p.subparams[1 + off],
        g: p.subparams[2 + off],
        b: p.subparams[3 + off]
      };
    }
  }
  const next = params[idx + 1];
  if (!next)
    return null;
  if (next.value === 5 && params[idx + 2]?.value !== null && params[idx + 2]?.value !== undefined) {
    return { index: params[idx + 2].value };
  }
  if (next.value === 2) {
    const r = params[idx + 2]?.value;
    const g = params[idx + 3]?.value;
    const b = params[idx + 4]?.value;
    if (r !== null && r !== undefined && g !== null && g !== undefined && b !== null && b !== undefined) {
      return { r, g, b };
    }
  }
  return null;
}
function applySGR(paramStr, style) {
  const params = parseParams(paramStr);
  let s = { ...style };
  let i = 0;
  while (i < params.length) {
    const p = params[i];
    const code = p.value ?? 0;
    if (code === 0) {
      s = defaultStyle2();
      i++;
      continue;
    }
    if (code === 1) {
      s.bold = true;
      i++;
      continue;
    }
    if (code === 2) {
      s.dim = true;
      i++;
      continue;
    }
    if (code === 3) {
      s.italic = true;
      i++;
      continue;
    }
    if (code === 4) {
      s.underline = p.colon ? UNDERLINE_STYLES[p.subparams[0]] ?? "single" : "single";
      i++;
      continue;
    }
    if (code === 5 || code === 6) {
      s.blink = true;
      i++;
      continue;
    }
    if (code === 7) {
      s.inverse = true;
      i++;
      continue;
    }
    if (code === 8) {
      s.hidden = true;
      i++;
      continue;
    }
    if (code === 9) {
      s.strikethrough = true;
      i++;
      continue;
    }
    if (code === 21) {
      s.underline = "double";
      i++;
      continue;
    }
    if (code === 22) {
      s.bold = false;
      s.dim = false;
      i++;
      continue;
    }
    if (code === 23) {
      s.italic = false;
      i++;
      continue;
    }
    if (code === 24) {
      s.underline = "none";
      i++;
      continue;
    }
    if (code === 25) {
      s.blink = false;
      i++;
      continue;
    }
    if (code === 27) {
      s.inverse = false;
      i++;
      continue;
    }
    if (code === 28) {
      s.hidden = false;
      i++;
      continue;
    }
    if (code === 29) {
      s.strikethrough = false;
      i++;
      continue;
    }
    if (code === 53) {
      s.overline = true;
      i++;
      continue;
    }
    if (code === 55) {
      s.overline = false;
      i++;
      continue;
    }
    if (code >= 30 && code <= 37) {
      s.fg = { type: "named", name: NAMED_COLORS[code - 30] };
      i++;
      continue;
    }
    if (code === 39) {
      s.fg = { type: "default" };
      i++;
      continue;
    }
    if (code >= 40 && code <= 47) {
      s.bg = { type: "named", name: NAMED_COLORS[code - 40] };
      i++;
      continue;
    }
    if (code === 49) {
      s.bg = { type: "default" };
      i++;
      continue;
    }
    if (code >= 90 && code <= 97) {
      s.fg = { type: "named", name: NAMED_COLORS[code - 90 + 8] };
      i++;
      continue;
    }
    if (code >= 100 && code <= 107) {
      s.bg = { type: "named", name: NAMED_COLORS[code - 100 + 8] };
      i++;
      continue;
    }
    if (code === 38) {
      const c = parseExtendedColor(params, i);
      if (c) {
        s.fg = "index" in c ? { type: "indexed", index: c.index } : { type: "rgb", ...c };
        i += p.colon ? 1 : ("index" in c) ? 3 : 5;
        continue;
      }
    }
    if (code === 48) {
      const c = parseExtendedColor(params, i);
      if (c) {
        s.bg = "index" in c ? { type: "indexed", index: c.index } : { type: "rgb", ...c };
        i += p.colon ? 1 : ("index" in c) ? 3 : 5;
        continue;
      }
    }
    if (code === 58) {
      const c = parseExtendedColor(params, i);
      if (c) {
        s.underlineColor = "index" in c ? { type: "indexed", index: c.index } : { type: "rgb", ...c };
        i += p.colon ? 1 : ("index" in c) ? 3 : 5;
        continue;
      }
    }
    if (code === 59) {
      s.underlineColor = { type: "default" };
      i++;
      continue;
    }
    i++;
  }
  return s;
}
var NAMED_COLORS, UNDERLINE_STYLES;
var init_sgr = __esm(() => {
  init_types();
  NAMED_COLORS = [
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "brightBlack",
    "brightRed",
    "brightGreen",
    "brightYellow",
    "brightBlue",
    "brightMagenta",
    "brightCyan",
    "brightWhite"
  ];
  UNDERLINE_STYLES = [
    "none",
    "single",
    "double",
    "curly",
    "dotted",
    "dashed"
  ];
});

// packages/@ant/ink/src/core/termio/parser.ts
function isEmoji(codePoint) {
  return codePoint >= 9728 && codePoint <= 9983 || codePoint >= 9984 && codePoint <= 10175 || codePoint >= 127744 && codePoint <= 129535 || codePoint >= 129536 && codePoint <= 129791 || codePoint >= 127456 && codePoint <= 127487;
}
function isEastAsianWide(codePoint) {
  return codePoint >= 4352 && codePoint <= 4447 || codePoint >= 11904 && codePoint <= 40959 || codePoint >= 44032 && codePoint <= 55203 || codePoint >= 63744 && codePoint <= 64255 || codePoint >= 65040 && codePoint <= 65055 || codePoint >= 65072 && codePoint <= 65135 || codePoint >= 65280 && codePoint <= 65376 || codePoint >= 65504 && codePoint <= 65510 || codePoint >= 131072 && codePoint <= 196605 || codePoint >= 196608 && codePoint <= 262141;
}
function hasMultipleCodepoints(str) {
  let count = 0;
  for (const _ of str) {
    count++;
    if (count > 1)
      return true;
  }
  return false;
}
function graphemeWidth(grapheme) {
  if (hasMultipleCodepoints(grapheme))
    return 2;
  const codePoint = grapheme.codePointAt(0);
  if (codePoint === undefined)
    return 1;
  if (isEmoji(codePoint) || isEastAsianWide(codePoint))
    return 2;
  return 1;
}
function* segmentGraphemes(str) {
  for (const { segment } of getGraphemeSegmenter().segment(str)) {
    yield { value: segment, width: graphemeWidth(segment) };
  }
}
function parseCSIParams(paramStr) {
  if (paramStr === "")
    return [];
  return paramStr.split(/[;:]/).map((s) => s === "" ? 0 : parseInt(s, 10));
}
function parseCSI(rawSequence) {
  const inner = rawSequence.slice(2);
  if (inner.length === 0)
    return null;
  const finalByte = inner.charCodeAt(inner.length - 1);
  const beforeFinal = inner.slice(0, -1);
  let privateMode = "";
  let paramStr = beforeFinal;
  let intermediate = "";
  if (beforeFinal.length > 0 && "?>=".includes(beforeFinal[0])) {
    privateMode = beforeFinal[0];
    paramStr = beforeFinal.slice(1);
  }
  const intermediateMatch = paramStr.match(/([^0-9;:]+)$/);
  if (intermediateMatch) {
    intermediate = intermediateMatch[1];
    paramStr = paramStr.slice(0, -intermediate.length);
  }
  const params = parseCSIParams(paramStr);
  const p0 = params[0] ?? 1;
  const p1 = params[1] ?? 1;
  if (finalByte === CSI.SGR && privateMode === "") {
    return { type: "sgr", params: paramStr };
  }
  if (finalByte === CSI.CUU) {
    return {
      type: "cursor",
      action: { type: "move", direction: "up", count: p0 }
    };
  }
  if (finalByte === CSI.CUD) {
    return {
      type: "cursor",
      action: { type: "move", direction: "down", count: p0 }
    };
  }
  if (finalByte === CSI.CUF) {
    return {
      type: "cursor",
      action: { type: "move", direction: "forward", count: p0 }
    };
  }
  if (finalByte === CSI.CUB) {
    return {
      type: "cursor",
      action: { type: "move", direction: "back", count: p0 }
    };
  }
  if (finalByte === CSI.CNL) {
    return { type: "cursor", action: { type: "nextLine", count: p0 } };
  }
  if (finalByte === CSI.CPL) {
    return { type: "cursor", action: { type: "prevLine", count: p0 } };
  }
  if (finalByte === CSI.CHA) {
    return { type: "cursor", action: { type: "column", col: p0 } };
  }
  if (finalByte === CSI.CUP || finalByte === CSI.HVP) {
    return { type: "cursor", action: { type: "position", row: p0, col: p1 } };
  }
  if (finalByte === CSI.VPA) {
    return { type: "cursor", action: { type: "row", row: p0 } };
  }
  if (finalByte === CSI.ED) {
    const region = ERASE_DISPLAY[params[0] ?? 0] ?? "toEnd";
    return { type: "erase", action: { type: "display", region } };
  }
  if (finalByte === CSI.EL) {
    const region = ERASE_LINE_REGION[params[0] ?? 0] ?? "toEnd";
    return { type: "erase", action: { type: "line", region } };
  }
  if (finalByte === CSI.ECH) {
    return { type: "erase", action: { type: "chars", count: p0 } };
  }
  if (finalByte === CSI.SU) {
    return { type: "scroll", action: { type: "up", count: p0 } };
  }
  if (finalByte === CSI.SD) {
    return { type: "scroll", action: { type: "down", count: p0 } };
  }
  if (finalByte === CSI.DECSTBM) {
    return {
      type: "scroll",
      action: { type: "setRegion", top: p0, bottom: p1 }
    };
  }
  if (finalByte === CSI.SCOSC) {
    return { type: "cursor", action: { type: "save" } };
  }
  if (finalByte === CSI.SCORC) {
    return { type: "cursor", action: { type: "restore" } };
  }
  if (finalByte === CSI.DECSCUSR && intermediate === " ") {
    const styleInfo = CURSOR_STYLES[p0] ?? CURSOR_STYLES[0];
    return { type: "cursor", action: { type: "style", ...styleInfo } };
  }
  if (privateMode === "?" && (finalByte === CSI.SM || finalByte === CSI.RM)) {
    const enabled = finalByte === CSI.SM;
    if (p0 === DEC.CURSOR_VISIBLE) {
      return {
        type: "cursor",
        action: enabled ? { type: "show" } : { type: "hide" }
      };
    }
    if (p0 === DEC.ALT_SCREEN_CLEAR || p0 === DEC.ALT_SCREEN) {
      return { type: "mode", action: { type: "alternateScreen", enabled } };
    }
    if (p0 === DEC.BRACKETED_PASTE) {
      return { type: "mode", action: { type: "bracketedPaste", enabled } };
    }
    if (p0 === DEC.MOUSE_NORMAL) {
      return {
        type: "mode",
        action: { type: "mouseTracking", mode: enabled ? "normal" : "off" }
      };
    }
    if (p0 === DEC.MOUSE_BUTTON) {
      return {
        type: "mode",
        action: { type: "mouseTracking", mode: enabled ? "button" : "off" }
      };
    }
    if (p0 === DEC.MOUSE_ANY) {
      return {
        type: "mode",
        action: { type: "mouseTracking", mode: enabled ? "any" : "off" }
      };
    }
    if (p0 === DEC.FOCUS_EVENTS) {
      return { type: "mode", action: { type: "focusEvents", enabled } };
    }
  }
  return { type: "unknown", sequence: rawSequence };
}
function identifySequence(seq) {
  if (seq.length < 2)
    return "unknown";
  if (seq.charCodeAt(0) !== C0.ESC)
    return "unknown";
  const second = seq.charCodeAt(1);
  if (second === 91)
    return "csi";
  if (second === 93)
    return "osc";
  if (second === 79)
    return "ss3";
  return "esc";
}

class Parser {
  tokenizer = createTokenizer();
  style = defaultStyle2();
  inLink = false;
  linkUrl;
  reset() {
    this.tokenizer.reset();
    this.style = defaultStyle2();
    this.inLink = false;
    this.linkUrl = undefined;
  }
  feed(input) {
    const tokens = this.tokenizer.feed(input);
    const actions = [];
    for (const token of tokens) {
      const tokenActions = this.processToken(token);
      actions.push(...tokenActions);
    }
    return actions;
  }
  processToken(token) {
    switch (token.type) {
      case "text":
        return this.processText(token.value);
      case "sequence":
        return this.processSequence(token.value);
    }
  }
  processText(text) {
    const actions = [];
    let current = "";
    for (const char of text) {
      if (char.charCodeAt(0) === C0.BEL) {
        if (current) {
          const graphemes = [...segmentGraphemes(current)];
          if (graphemes.length > 0) {
            actions.push({ type: "text", graphemes, style: { ...this.style } });
          }
          current = "";
        }
        actions.push({ type: "bell" });
      } else {
        current += char;
      }
    }
    if (current) {
      const graphemes = [...segmentGraphemes(current)];
      if (graphemes.length > 0) {
        actions.push({ type: "text", graphemes, style: { ...this.style } });
      }
    }
    return actions;
  }
  processSequence(seq) {
    const seqType = identifySequence(seq);
    switch (seqType) {
      case "csi": {
        const action = parseCSI(seq);
        if (!action)
          return [];
        if (action.type === "sgr") {
          this.style = applySGR(action.params, this.style);
          return [];
        }
        return [action];
      }
      case "osc": {
        let content = seq.slice(2);
        if (content.endsWith("\x07")) {
          content = content.slice(0, -1);
        } else if (content.endsWith("\x1B\\")) {
          content = content.slice(0, -2);
        }
        const action = parseOSC(content);
        if (action) {
          if (action.type === "link") {
            if (action.action.type === "start") {
              this.inLink = true;
              this.linkUrl = action.action.url;
            } else {
              this.inLink = false;
              this.linkUrl = undefined;
            }
          }
          return [action];
        }
        return [];
      }
      case "esc": {
        const escContent = seq.slice(1);
        const action = parseEsc(escContent);
        return action ? [action] : [];
      }
      case "ss3":
        return [{ type: "unknown", sequence: seq }];
      default:
        return [{ type: "unknown", sequence: seq }];
    }
  }
}
var init_parser2 = __esm(() => {
  init_grapheme();
  init_ansi();
  init_csi();
  init_dec();
  init_esc();
  init_osc();
  init_sgr();
  init_tokenize();
  init_types();
});

// packages/@ant/ink/src/core/termio.ts
var init_termio = __esm(() => {
  init_parser2();
  init_types();
});

// packages/@ant/ink/src/core/Ansi.tsx
function parseToSpans(input) {
  const parser = new Parser;
  const actions = parser.feed(input);
  const spans = [];
  let currentHyperlink;
  for (const action of actions) {
    if (action.type === "link") {
      if (action.action.type === "start") {
        currentHyperlink = action.action.url;
      } else {
        currentHyperlink = undefined;
      }
      continue;
    }
    if (action.type === "text") {
      const text = action.graphemes.map((g) => g.value).join("");
      if (!text)
        continue;
      const props = textStyleToSpanProps(action.style);
      if (currentHyperlink) {
        props.hyperlink = currentHyperlink;
      }
      const lastSpan = spans[spans.length - 1];
      if (lastSpan && propsEqual(lastSpan.props, props)) {
        lastSpan.text += text;
      } else {
        spans.push({ text, props });
      }
    }
  }
  return spans;
}
function textStyleToSpanProps(style) {
  const props = {};
  if (style.bold)
    props.bold = true;
  if (style.dim)
    props.dim = true;
  if (style.italic)
    props.italic = true;
  if (style.underline !== "none")
    props.underline = true;
  if (style.strikethrough)
    props.strikethrough = true;
  if (style.inverse)
    props.inverse = true;
  const fgColor = colorToString(style.fg);
  if (fgColor)
    props.color = fgColor;
  const bgColor = colorToString(style.bg);
  if (bgColor)
    props.backgroundColor = bgColor;
  return props;
}
function colorToString(color) {
  switch (color.type) {
    case "named":
      return NAMED_COLOR_MAP[color.name];
    case "indexed":
      return `ansi256(${color.index})`;
    case "rgb":
      return `rgb(${color.r},${color.g},${color.b})`;
    case "default":
      return;
  }
}
function propsEqual(a, b) {
  return a.color === b.color && a.backgroundColor === b.backgroundColor && a.bold === b.bold && a.dim === b.dim && a.italic === b.italic && a.underline === b.underline && a.strikethrough === b.strikethrough && a.inverse === b.inverse && a.hyperlink === b.hyperlink;
}
function hasAnyProps(props) {
  return props.color !== undefined || props.backgroundColor !== undefined || props.dim === true || props.bold === true || props.italic === true || props.underline === true || props.strikethrough === true || props.inverse === true || props.hyperlink !== undefined;
}
function hasAnyTextProps(props) {
  return props.color !== undefined || props.backgroundColor !== undefined || props.dim === true || props.bold === true || props.italic === true || props.underline === true || props.strikethrough === true || props.inverse === true;
}
function StyledText({
  bold,
  dim,
  children,
  ...rest
}) {
  if (dim) {
    return /* @__PURE__ */ jsx_runtime11.jsx(Text, {
      ...rest,
      dim: true,
      children
    });
  }
  if (bold) {
    return /* @__PURE__ */ jsx_runtime11.jsx(Text, {
      ...rest,
      bold: true,
      children
    });
  }
  return /* @__PURE__ */ jsx_runtime11.jsx(Text, {
    ...rest,
    children
  });
}
var import_react16, jsx_runtime11, Ansi, NAMED_COLOR_MAP;
var init_Ansi = __esm(() => {
  init_Link();
  init_Text();
  init_termio();
  import_react16 = __toESM(require_react(), 1);
  jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
  Ansi = import_react16.default.memo(function Ansi2({ children, dimColor }) {
    if (typeof children !== "string") {
      return dimColor ? /* @__PURE__ */ jsx_runtime11.jsx(Text, {
        dim: true,
        children: String(children)
      }) : /* @__PURE__ */ jsx_runtime11.jsx(Text, {
        children: String(children)
      });
    }
    if (children === "") {
      return null;
    }
    const spans = parseToSpans(children);
    if (spans.length === 0) {
      return null;
    }
    if (spans.length === 1 && !hasAnyProps(spans[0].props)) {
      return dimColor ? /* @__PURE__ */ jsx_runtime11.jsx(Text, {
        dim: true,
        children: spans[0].text
      }) : /* @__PURE__ */ jsx_runtime11.jsx(Text, {
        children: spans[0].text
      });
    }
    const content = spans.map((span, i) => {
      const hyperlink = span.props.hyperlink;
      if (dimColor) {
        span.props.dim = true;
      }
      const hasTextProps = hasAnyTextProps(span.props);
      if (hyperlink) {
        return hasTextProps ? /* @__PURE__ */ jsx_runtime11.jsx(Link, {
          url: hyperlink,
          children: /* @__PURE__ */ jsx_runtime11.jsx(StyledText, {
            color: span.props.color,
            backgroundColor: span.props.backgroundColor,
            dim: span.props.dim,
            bold: span.props.bold,
            italic: span.props.italic,
            underline: span.props.underline,
            strikethrough: span.props.strikethrough,
            inverse: span.props.inverse,
            children: span.text
          })
        }, i) : /* @__PURE__ */ jsx_runtime11.jsx(Link, {
          url: hyperlink,
          children: span.text
        }, i);
      }
      return hasTextProps ? /* @__PURE__ */ jsx_runtime11.jsx(StyledText, {
        color: span.props.color,
        backgroundColor: span.props.backgroundColor,
        dim: span.props.dim,
        bold: span.props.bold,
        italic: span.props.italic,
        underline: span.props.underline,
        strikethrough: span.props.strikethrough,
        inverse: span.props.inverse,
        children: span.text
      }, i) : span.text;
    });
    return dimColor ? /* @__PURE__ */ jsx_runtime11.jsx(Text, {
      dim: true,
      children: content
    }) : /* @__PURE__ */ jsx_runtime11.jsx(Text, {
      children: content
    });
  });
  NAMED_COLOR_MAP = {
    black: "ansi:black",
    red: "ansi:red",
    green: "ansi:green",
    yellow: "ansi:yellow",
    blue: "ansi:blue",
    magenta: "ansi:magenta",
    cyan: "ansi:cyan",
    white: "ansi:white",
    brightBlack: "ansi:blackBright",
    brightRed: "ansi:redBright",
    brightGreen: "ansi:greenBright",
    brightYellow: "ansi:yellowBright",
    brightBlue: "ansi:blueBright",
    brightMagenta: "ansi:magentaBright",
    brightCyan: "ansi:cyanBright",
    brightWhite: "ansi:whiteBright"
  };
});

// packages/@ant/ink/src/core/measure-element.ts
var measureElement = (node) => ({
  width: node.yogaNode?.getComputedWidth() ?? 0,
  height: node.yogaNode?.getComputedHeight() ?? 0
}), measure_element_default;
var init_measure_element = __esm(() => {
  measure_element_default = measureElement;
});

// packages/@ant/ink/src/components/Button.tsx
function Button({ onAction, tabIndex = 0, autoFocus, children, ref, ...style }) {
  const [isFocused, setIsFocused] = import_react17.useState(false);
  const [isHovered, setIsHovered] = import_react17.useState(false);
  const [isActive, setIsActive] = import_react17.useState(false);
  const activeTimer = import_react17.useRef(null);
  import_react17.useEffect(() => {
    return () => {
      if (activeTimer.current)
        clearTimeout(activeTimer.current);
    };
  }, []);
  const handleKeyDown = import_react17.useCallback((e) => {
    if (e.key === "return" || e.key === " ") {
      e.preventDefault();
      setIsActive(true);
      onAction();
      if (activeTimer.current)
        clearTimeout(activeTimer.current);
      activeTimer.current = setTimeout((setter) => setter(false), 100, setIsActive);
    }
  }, [onAction]);
  const handleClick = import_react17.useCallback((_e) => {
    onAction();
  }, [onAction]);
  const handleFocus = import_react17.useCallback((_e) => setIsFocused(true), []);
  const handleBlur = import_react17.useCallback((_e) => setIsFocused(false), []);
  const handleMouseEnter = import_react17.useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = import_react17.useCallback(() => setIsHovered(false), []);
  const state = {
    focused: isFocused,
    hovered: isHovered,
    active: isActive
  };
  const content = typeof children === "function" ? children(state) : children;
  return /* @__PURE__ */ jsx_runtime12.jsx(Box_default, {
    ref,
    tabIndex,
    autoFocus,
    onKeyDown: handleKeyDown,
    onClick: handleClick,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    ...style,
    children: content
  });
}
var import_react17, jsx_runtime12, Button_default;
var init_Button = __esm(() => {
  init_Box();
  import_react17 = __toESM(require_react(), 1);
  jsx_runtime12 = __toESM(require_jsx_runtime(), 1);
  Button_default = Button;
});

// packages/@ant/ink/src/components/Newline.tsx
function Newline({ count = 1 }) {
  return /* @__PURE__ */ jsx_runtime13.jsx("ink-text", {
    children: `
`.repeat(count)
  });
}
var jsx_runtime13;
var init_Newline = __esm(() => {
  jsx_runtime13 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/components/Spacer.tsx
function Spacer() {
  return /* @__PURE__ */ jsx_runtime14.jsx(Box_default, {
    flexGrow: 1
  });
}
var jsx_runtime14;
var init_Spacer = __esm(() => {
  init_Box();
  jsx_runtime14 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/components/NoSelect.tsx
function NoSelect({ children, fromLeftEdge, ...boxProps }) {
  return /* @__PURE__ */ jsx_runtime15.jsx(Box_default, {
    ...boxProps,
    noSelect: fromLeftEdge ? "from-left-edge" : true,
    children
  });
}
var jsx_runtime15;
var init_NoSelect = __esm(() => {
  init_Box();
  jsx_runtime15 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/components/RawAnsi.tsx
function RawAnsi({ lines, width }) {
  if (lines.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsx_runtime16.jsx("ink-raw-ansi", {
    rawText: lines.join(`
`),
    rawWidth: width,
    rawHeight: lines.length
  });
}
var jsx_runtime16;
var init_RawAnsi = __esm(() => {
  jsx_runtime16 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/components/ScrollBox.tsx
function ScrollBox({ children, ref, stickyScroll, ...style }) {
  const domRef = import_react18.useRef(null);
  const [, forceRender] = import_react18.useState(0);
  const listenersRef = import_react18.useRef(new Set);
  const renderQueuedRef = import_react18.useRef(false);
  const notify = () => {
    for (const l of listenersRef.current)
      l();
  };
  function scrollMutated(el) {
    markDirty(el);
    markCommitStart();
    notify();
    if (renderQueuedRef.current)
      return;
    renderQueuedRef.current = true;
    queueMicrotask(() => {
      renderQueuedRef.current = false;
      scheduleRenderFrom(el);
    });
  }
  import_react18.useImperativeHandle(ref, () => ({
    scrollTo(y) {
      const el = domRef.current;
      if (!el)
        return;
      el.stickyScroll = false;
      el.pendingScrollDelta = undefined;
      el.scrollAnchor = undefined;
      el.scrollTop = Math.max(0, Math.floor(y));
      scrollMutated(el);
    },
    scrollToElement(el, offset = 0) {
      const box = domRef.current;
      if (!box)
        return;
      box.stickyScroll = false;
      box.pendingScrollDelta = undefined;
      box.scrollAnchor = { el, offset };
      scrollMutated(box);
    },
    scrollBy(dy) {
      const el = domRef.current;
      if (!el)
        return;
      el.stickyScroll = false;
      el.scrollAnchor = undefined;
      el.pendingScrollDelta = (el.pendingScrollDelta ?? 0) + Math.floor(dy);
      scrollMutated(el);
    },
    scrollToBottom() {
      const el = domRef.current;
      if (!el)
        return;
      el.pendingScrollDelta = undefined;
      el.stickyScroll = true;
      markDirty(el);
      notify();
      forceRender((n) => n + 1);
    },
    getScrollTop() {
      return domRef.current?.scrollTop ?? 0;
    },
    getPendingDelta() {
      return domRef.current?.pendingScrollDelta ?? 0;
    },
    getScrollHeight() {
      return domRef.current?.scrollHeight ?? 0;
    },
    getFreshScrollHeight() {
      const content = domRef.current?.childNodes[0];
      return content?.yogaNode?.getComputedHeight() ?? domRef.current?.scrollHeight ?? 0;
    },
    getViewportHeight() {
      return domRef.current?.scrollViewportHeight ?? 0;
    },
    getViewportTop() {
      return domRef.current?.scrollViewportTop ?? 0;
    },
    isSticky() {
      const el = domRef.current;
      if (!el)
        return false;
      return el.stickyScroll ?? Boolean(el.attributes["stickyScroll"]);
    },
    subscribe(listener) {
      listenersRef.current.add(listener);
      return () => listenersRef.current.delete(listener);
    },
    setClampBounds(min, max) {
      const el = domRef.current;
      if (!el)
        return;
      el.scrollClampMin = min;
      el.scrollClampMax = max;
    }
  }), []);
  return /* @__PURE__ */ jsx_runtime17.jsx("ink-box", {
    ref: (el) => {
      domRef.current = el;
      if (el)
        el.scrollTop ??= 0;
    },
    style: {
      flexWrap: "nowrap",
      flexDirection: style.flexDirection ?? "row",
      flexGrow: style.flexGrow ?? 0,
      flexShrink: style.flexShrink ?? 1,
      ...style,
      overflowX: "scroll",
      overflowY: "scroll"
    },
    ...stickyScroll ? { stickyScroll: true } : {},
    children: /* @__PURE__ */ jsx_runtime17.jsx(Box_default, {
      flexDirection: "column",
      flexGrow: 1,
      flexShrink: 0,
      width: "100%",
      children
    })
  });
}
var import_react18, jsx_runtime17, ScrollBox_default;
var init_ScrollBox = __esm(() => {
  init_dom();
  init_reconciler();
  init_Box();
  import_react18 = __toESM(require_react(), 1);
  jsx_runtime17 = __toESM(require_jsx_runtime(), 1);
  ScrollBox_default = ScrollBox;
});

// packages/@ant/ink/src/components/AlternateScreen.tsx
function AlternateScreen({ children, mouseTracking = true }) {
  const size = import_react19.useContext(TerminalSizeContext);
  const writeRaw = import_react19.useContext(TerminalWriteContext);
  import_react19.useInsertionEffect(() => {
    const ink = instances_default.get(process.stdout);
    if (!writeRaw)
      return;
    writeRaw(ENTER_ALT_SCREEN + "\x1B[2J\x1B[H" + (mouseTracking ? ENABLE_MOUSE_TRACKING : ""));
    ink?.setAltScreenActive(true, mouseTracking);
    return () => {
      ink?.setAltScreenActive(false);
      ink?.clearTextSelection();
      writeRaw((mouseTracking ? DISABLE_MOUSE_TRACKING : "") + EXIT_ALT_SCREEN);
    };
  }, [writeRaw, mouseTracking]);
  return /* @__PURE__ */ jsx_runtime18.jsx(Box_default, {
    flexDirection: "column",
    height: size?.rows ?? 24,
    width: "100%",
    flexShrink: 0,
    children
  });
}
var import_react19, jsx_runtime18;
var init_AlternateScreen = __esm(() => {
  init_instances();
  init_dec();
  init_useTerminalNotification();
  init_Box();
  init_TerminalSizeContext();
  import_react19 = __toESM(require_react(), 1);
  jsx_runtime18 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/hooks/use-app.ts
var import_react20, useApp = () => import_react20.useContext(AppContext_default), use_app_default;
var init_use_app = __esm(() => {
  init_AppContext();
  import_react20 = __toESM(require_react(), 1);
  use_app_default = useApp;
});

// packages/@ant/ink/src/hooks/use-terminal-viewport.ts
function useTerminalViewport() {
  const terminalSize = import_react21.useContext(TerminalSizeContext);
  const elementRef = import_react21.useRef(null);
  const entryRef = import_react21.useRef({ isVisible: true });
  const setElement = import_react21.useCallback((el) => {
    elementRef.current = el;
  }, []);
  import_react21.useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element?.yogaNode || !terminalSize) {
      return;
    }
    const height = element.yogaNode.getComputedHeight();
    const rows = terminalSize.rows;
    let absoluteTop = element.yogaNode.getComputedTop();
    let parent = element.parentNode;
    let root = element.yogaNode;
    while (parent) {
      if (parent.yogaNode) {
        absoluteTop += parent.yogaNode.getComputedTop();
        root = parent.yogaNode;
      }
      if (parent.scrollTop)
        absoluteTop -= parent.scrollTop;
      parent = parent.parentNode;
    }
    const screenHeight = root.getComputedHeight();
    const bottom = absoluteTop + height;
    const cursorRestoreScroll = screenHeight > rows ? 1 : 0;
    const viewportY = Math.max(0, screenHeight - rows) + cursorRestoreScroll;
    const viewportBottom = viewportY + rows;
    const visible = bottom > viewportY && absoluteTop < viewportBottom;
    if (visible !== entryRef.current.isVisible) {
      entryRef.current = { isVisible: visible };
    }
  });
  return [setElement, entryRef.current];
}
var import_react21;
var init_use_terminal_viewport = __esm(() => {
  init_TerminalSizeContext();
  import_react21 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/use-animation-frame.ts
function useAnimationFrame(intervalMs = 16) {
  const clock = import_react22.useContext(ClockContext);
  const [viewportRef, { isVisible }] = useTerminalViewport();
  const [time, setTime] = import_react22.useState(() => clock?.now() ?? 0);
  const active = isVisible && intervalMs !== null;
  import_react22.useEffect(() => {
    if (!clock || !active)
      return;
    let lastUpdate = clock.now();
    const onChange = () => {
      const now2 = clock.now();
      if (now2 - lastUpdate >= intervalMs) {
        lastUpdate = now2;
        setTime(now2);
      }
    };
    return clock.subscribe(onChange, true);
  }, [clock, intervalMs, active]);
  return [viewportRef, time];
}
var import_react22;
var init_use_animation_frame = __esm(() => {
  init_ClockContext();
  init_use_terminal_viewport();
  import_react22 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/use-interval.ts
function useAnimationTimer(intervalMs) {
  const clock = import_react23.useContext(ClockContext);
  const [time, setTime] = import_react23.useState(() => clock?.now() ?? 0);
  import_react23.useEffect(() => {
    if (!clock)
      return;
    let lastUpdate = clock.now();
    const onChange = () => {
      const now2 = clock.now();
      if (now2 - lastUpdate >= intervalMs) {
        lastUpdate = now2;
        setTime(now2);
      }
    };
    return clock.subscribe(onChange, false);
  }, [clock, intervalMs]);
  return time;
}
function useInterval2(callback, intervalMs) {
  const callbackRef = import_react23.useRef(callback);
  callbackRef.current = callback;
  const clock = import_react23.useContext(ClockContext);
  import_react23.useEffect(() => {
    if (!clock || intervalMs === null)
      return;
    let lastUpdate = clock.now();
    const onChange = () => {
      const now2 = clock.now();
      if (now2 - lastUpdate >= intervalMs) {
        lastUpdate = now2;
        callbackRef.current();
      }
    };
    return clock.subscribe(onChange, false);
  }, [clock, intervalMs]);
}
var import_react23;
var init_use_interval = __esm(() => {
  init_ClockContext();
  import_react23 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/use-selection.ts
function useSelection() {
  import_react24.useContext(StdinContext_default);
  const ink = instances_default.get(process.stdout);
  return import_react24.useMemo(() => {
    if (!ink) {
      return {
        copySelection: () => "",
        copySelectionNoClear: () => "",
        clearSelection: () => {},
        hasSelection: () => false,
        getState: () => null,
        subscribe: () => () => {},
        shiftAnchor: () => {},
        shiftSelection: () => {},
        moveFocus: () => {},
        captureScrolledRows: () => {},
        setSelectionBgColor: () => {}
      };
    }
    return {
      copySelection: () => ink.copySelection(),
      copySelectionNoClear: () => ink.copySelectionNoClear(),
      clearSelection: () => ink.clearTextSelection(),
      hasSelection: () => ink.hasTextSelection(),
      getState: () => ink.selection,
      subscribe: (cb) => ink.subscribeToSelectionChange(cb),
      shiftAnchor: (dRow, minRow, maxRow) => shiftAnchor(ink.selection, dRow, minRow, maxRow),
      shiftSelection: (dRow, minRow, maxRow) => ink.shiftSelectionForScroll(dRow, minRow, maxRow),
      moveFocus: (move) => ink.moveSelectionFocus(move),
      captureScrolledRows: (firstRow, lastRow, side) => ink.captureScrolledRows(firstRow, lastRow, side),
      setSelectionBgColor: (color) => ink.setSelectionBgColor(color)
    };
  }, [ink]);
}
function useHasSelection() {
  import_react24.useContext(StdinContext_default);
  const ink = instances_default.get(process.stdout);
  return import_react24.useSyncExternalStore(ink ? ink.subscribeToSelectionChange : NO_SUBSCRIBE, ink ? ink.hasTextSelection : ALWAYS_FALSE);
}
var import_react24, NO_SUBSCRIBE = () => () => {}, ALWAYS_FALSE = () => false;
var init_use_selection = __esm(() => {
  init_StdinContext();
  init_instances();
  init_selection();
  import_react24 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/useTerminalSize.ts
function useTerminalSize() {
  const size = import_react25.useContext(TerminalSizeContext);
  if (!size) {
    throw new Error("useTerminalSize must be used within an Ink App component");
  }
  return size;
}
var import_react25;
var init_useTerminalSize = __esm(() => {
  init_TerminalSizeContext();
  import_react25 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/useTimeout.ts
function useTimeout(delay, resetTrigger) {
  const [isElapsed, setIsElapsed] = import_react26.useState(false);
  import_react26.useEffect(() => {
    setIsElapsed(false);
    const timer = setTimeout(setIsElapsed, delay, true);
    return () => clearTimeout(timer);
  }, [delay, resetTrigger]);
  return isElapsed;
}
var import_react26;
var init_useTimeout = __esm(() => {
  import_react26 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/useMinDisplayTime.ts
function useMinDisplayTime(value, minMs) {
  const [displayed, setDisplayed] = import_react27.useState(value);
  const lastShownAtRef = import_react27.useRef(0);
  import_react27.useEffect(() => {
    const elapsed = Date.now() - lastShownAtRef.current;
    if (elapsed >= minMs) {
      lastShownAtRef.current = Date.now();
      setDisplayed(value);
      return;
    }
    const timer = setTimeout((shownAtRef, setFn, v) => {
      shownAtRef.current = Date.now();
      setFn(v);
    }, minMs - elapsed, lastShownAtRef, setDisplayed, value);
    return () => clearTimeout(timer);
  }, [value, minMs]);
  return displayed;
}
var import_react27;
var init_useMinDisplayTime = __esm(() => {
  import_react27 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/useDoublePress.ts
function useDoublePress(setPending, onDoublePress, onFirstPress) {
  const lastPressRef = import_react28.useRef(0);
  const timeoutRef = import_react28.useRef(undefined);
  const clearTimeoutSafe = import_react28.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);
  import_react28.useEffect(() => {
    return () => {
      clearTimeoutSafe();
    };
  }, [clearTimeoutSafe]);
  return import_react28.useCallback(() => {
    const now2 = Date.now();
    const timeSinceLastPress = now2 - lastPressRef.current;
    const isDoublePress = timeSinceLastPress <= DOUBLE_PRESS_TIMEOUT_MS && timeoutRef.current !== undefined;
    if (isDoublePress) {
      clearTimeoutSafe();
      setPending(false);
      onDoublePress();
    } else {
      onFirstPress?.();
      setPending(true);
      clearTimeoutSafe();
      timeoutRef.current = setTimeout((setPending2, timeoutRef2) => {
        setPending2(false);
        timeoutRef2.current = undefined;
      }, DOUBLE_PRESS_TIMEOUT_MS, setPending, timeoutRef);
    }
    lastPressRef.current = now2;
  }, [setPending, onDoublePress, onFirstPress, clearTimeoutSafe]);
}
var import_react28, DOUBLE_PRESS_TIMEOUT_MS = 800;
var init_useDoublePress = __esm(() => {
  import_react28 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/use-tab-status.ts
function useTabStatus(kind) {
  const writeRaw = import_react29.useContext(TerminalWriteContext);
  const prevKindRef = import_react29.useRef(null);
  import_react29.useEffect(() => {
    if (kind === null) {
      if (prevKindRef.current !== null && writeRaw && supportsTabStatus()) {
        writeRaw(wrapForMultiplexer(CLEAR_TAB_STATUS));
      }
      prevKindRef.current = null;
      return;
    }
    prevKindRef.current = kind;
    if (!writeRaw || !supportsTabStatus())
      return;
    writeRaw(wrapForMultiplexer(tabStatus(TAB_STATUS_PRESETS[kind])));
  }, [kind, writeRaw]);
}
var import_react29, rgb = (r, g, b) => ({
  type: "rgb",
  r,
  g,
  b
}), TAB_STATUS_PRESETS;
var init_use_tab_status = __esm(() => {
  init_osc();
  init_useTerminalNotification();
  import_react29 = __toESM(require_react(), 1);
  TAB_STATUS_PRESETS = {
    idle: {
      indicator: rgb(0, 215, 95),
      status: "Idle",
      statusColor: rgb(136, 136, 136)
    },
    busy: {
      indicator: rgb(255, 149, 0),
      status: "Working\u2026",
      statusColor: rgb(255, 149, 0)
    },
    waiting: {
      indicator: rgb(95, 135, 255),
      status: "Waiting",
      statusColor: rgb(95, 135, 255)
    }
  };
});

// packages/@ant/ink/src/hooks/use-terminal-title.ts
function useTerminalTitle(title) {
  const writeRaw = import_react30.useContext(TerminalWriteContext);
  import_react30.useEffect(() => {
    if (title === null || !writeRaw)
      return;
    const clean = stripAnsi(title);
    if (process.platform === "win32") {
      process.title = clean;
    } else {
      writeRaw(osc(OSC2.SET_TITLE_AND_ICON, clean));
    }
  }, [title, writeRaw]);
}
var import_react30;
var init_use_terminal_title = __esm(() => {
  init_strip_ansi();
  init_osc();
  init_useTerminalNotification();
  import_react30 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/use-search-highlight.ts
function useSearchHighlight() {
  import_react31.useContext(StdinContext_default);
  const ink = instances_default.get(process.stdout);
  return import_react31.useMemo(() => {
    if (!ink) {
      return {
        setQuery: () => {},
        scanElement: () => [],
        setPositions: () => {}
      };
    }
    return {
      setQuery: (query) => ink.setSearchHighlight(query),
      scanElement: (el) => ink.scanElementSubtree(el),
      setPositions: (state) => ink.setSearchPositions(state)
    };
  }, [ink]);
}
var import_react31;
var init_use_search_highlight = __esm(() => {
  init_StdinContext();
  init_instances();
  import_react31 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/hooks/use-declared-cursor.ts
function useDeclaredCursor({
  line,
  column,
  active
}) {
  const setCursorDeclaration = import_react32.useContext(CursorDeclarationContext_default);
  const nodeRef = import_react32.useRef(null);
  const setNode = import_react32.useCallback((node) => {
    nodeRef.current = node;
  }, []);
  import_react32.useLayoutEffect(() => {
    const node = nodeRef.current;
    if (active && node) {
      setCursorDeclaration({ relativeX: column, relativeY: line, node });
    } else {
      setCursorDeclaration(null, node);
    }
  });
  import_react32.useLayoutEffect(() => {
    return () => {
      setCursorDeclaration(null, nodeRef.current);
    };
  }, [setCursorDeclaration]);
  return setNode;
}
var import_react32;
var init_use_declared_cursor = __esm(() => {
  init_CursorDeclarationContext();
  import_react32 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/theme/systemTheme.ts
function detectFromColorFgBg() {
  const colorFgBg = process.env.COLORFGBG;
  if (!colorFgBg)
    return;
  const parts = colorFgBg.split(";");
  if (parts.length < 2)
    return;
  const bg = parseInt(parts[parts.length - 1], 10);
  if (isNaN(bg))
    return;
  return bg >= 8 ? "light" : "dark";
}
function getSystemThemeName() {
  if (cachedSystemTheme === undefined) {
    cachedSystemTheme = detectFromColorFgBg() ?? "dark";
  }
  return cachedSystemTheme;
}
var cachedSystemTheme;
var init_systemTheme = () => {};

// packages/@ant/ink/src/theme/ThemeProvider.tsx
function setThemeConfigCallbacks(opts) {
  _loadTheme = opts.loadTheme;
  _saveTheme = opts.saveTheme;
}
function defaultInitialTheme() {
  return _loadTheme();
}
function defaultSaveTheme(setting) {
  _saveTheme(setting);
}
function ThemeProvider({ children, initialState, onThemeSave = defaultSaveTheme }) {
  const [themeSetting, setThemeSetting] = import_react33.useState(initialState ?? defaultInitialTheme);
  const [previewTheme, setPreviewTheme] = import_react33.useState(null);
  const [systemTheme, setSystemTheme] = import_react33.useState(() => (initialState ?? themeSetting) === "auto" ? getSystemThemeName() : "dark");
  const activeSetting = previewTheme ?? themeSetting;
  const { internal_querier } = use_stdin_default();
  import_react33.useEffect(() => {
    if (false) {}
  }, [activeSetting, internal_querier]);
  const currentTheme = activeSetting === "auto" ? systemTheme : activeSetting;
  const value = import_react33.useMemo(() => ({
    themeSetting,
    setThemeSetting: (newSetting) => {
      setThemeSetting(newSetting);
      setPreviewTheme(null);
      if (newSetting === "auto") {
        setSystemTheme(getSystemThemeName());
      }
      onThemeSave?.(newSetting);
    },
    setPreviewTheme: (newSetting) => {
      setPreviewTheme(newSetting);
      if (newSetting === "auto") {
        setSystemTheme(getSystemThemeName());
      }
    },
    savePreview: () => {
      if (previewTheme !== null) {
        setThemeSetting(previewTheme);
        setPreviewTheme(null);
        onThemeSave?.(previewTheme);
      }
    },
    cancelPreview: () => {
      if (previewTheme !== null) {
        setPreviewTheme(null);
      }
    },
    currentTheme
  }), [themeSetting, previewTheme, currentTheme, onThemeSave]);
  return /* @__PURE__ */ jsx_runtime19.jsx(ThemeContext.Provider, {
    value,
    children
  });
}
function useTheme() {
  const { currentTheme, setThemeSetting } = import_react33.useContext(ThemeContext);
  return [currentTheme, setThemeSetting];
}
function useThemeSetting() {
  return import_react33.useContext(ThemeContext).themeSetting;
}
function usePreviewTheme() {
  const { setPreviewTheme, savePreview, cancelPreview } = import_react33.useContext(ThemeContext);
  return { setPreviewTheme, savePreview, cancelPreview };
}
var import_react33, jsx_runtime19, _loadTheme = () => "dark", _saveTheme = () => {}, DEFAULT_THEME = "dark", ThemeContext;
var init_ThemeProvider = __esm(() => {
  init_use_stdin();
  init_systemTheme();
  import_react33 = __toESM(require_react(), 1);
  jsx_runtime19 = __toESM(require_jsx_runtime(), 1);
  ThemeContext = import_react33.createContext({
    themeSetting: DEFAULT_THEME,
    setThemeSetting: () => {},
    setPreviewTheme: () => {},
    savePreview: () => {},
    cancelPreview: () => {},
    currentTheme: DEFAULT_THEME
  });
});

// packages/@ant/ink/src/theme/ThemedBox.tsx
function resolveColor(color, theme) {
  if (!color)
    return;
  if (color.startsWith("rgb(") || color.startsWith("#") || color.startsWith("ansi256(") || color.startsWith("ansi:")) {
    return color;
  }
  return theme[color];
}
function ThemedBox({
  borderColor,
  borderTopColor,
  borderBottomColor,
  borderLeftColor,
  borderRightColor,
  backgroundColor,
  children,
  ref,
  ...rest
}) {
  const [themeName] = useTheme();
  const theme = getTheme(themeName);
  const resolvedBorderColor = resolveColor(borderColor, theme);
  const resolvedBorderTopColor = resolveColor(borderTopColor, theme);
  const resolvedBorderBottomColor = resolveColor(borderBottomColor, theme);
  const resolvedBorderLeftColor = resolveColor(borderLeftColor, theme);
  const resolvedBorderRightColor = resolveColor(borderRightColor, theme);
  const resolvedBackgroundColor = resolveColor(backgroundColor, theme);
  return /* @__PURE__ */ jsx_runtime20.jsx(Box_default, {
    ref,
    borderColor: resolvedBorderColor,
    borderTopColor: resolvedBorderTopColor,
    borderBottomColor: resolvedBorderBottomColor,
    borderLeftColor: resolvedBorderLeftColor,
    borderRightColor: resolvedBorderRightColor,
    backgroundColor: resolvedBackgroundColor,
    ...rest,
    children
  });
}
var jsx_runtime20, ThemedBox_default;
var init_ThemedBox = __esm(() => {
  init_Box();
  init_theme_types();
  init_ThemeProvider();
  jsx_runtime20 = __toESM(require_jsx_runtime(), 1);
  ThemedBox_default = ThemedBox;
});

// packages/@ant/ink/src/theme/ThemedText.tsx
function resolveColor2(color, theme) {
  if (!color)
    return;
  if (color.startsWith("rgb(") || color.startsWith("#") || color.startsWith("ansi256(") || color.startsWith("ansi:")) {
    return color;
  }
  return theme[color];
}
function ThemedText({
  color,
  backgroundColor,
  dimColor = false,
  bold = false,
  italic = false,
  underline = false,
  strikethrough = false,
  inverse = false,
  wrap = "wrap",
  children
}) {
  const [themeName] = useTheme();
  const theme = getTheme(themeName);
  const hoverColor = import_react34.useContext(TextHoverColorContext);
  const resolvedColor = !color && hoverColor ? resolveColor2(hoverColor, theme) : dimColor ? theme.inactive : resolveColor2(color, theme);
  const resolvedBackgroundColor = backgroundColor ? theme[backgroundColor] : undefined;
  return /* @__PURE__ */ jsx_runtime21.jsx(Text, {
    color: resolvedColor,
    backgroundColor: resolvedBackgroundColor,
    bold,
    italic,
    underline,
    strikethrough,
    inverse,
    wrap,
    children
  });
}
var import_react34, jsx_runtime21, TextHoverColorContext;
var init_ThemedText = __esm(() => {
  init_Text();
  init_theme_types();
  init_ThemeProvider();
  import_react34 = __toESM(require_react(), 1);
  jsx_runtime21 = __toESM(require_jsx_runtime(), 1);
  TextHoverColorContext = import_react34.default.createContext(undefined);
});

// packages/@ant/ink/src/theme/color.ts
function color(c, theme, type = "foreground") {
  return (text) => {
    if (!c) {
      return text;
    }
    if (c.startsWith("rgb(") || c.startsWith("#") || c.startsWith("ansi256(") || c.startsWith("ansi:")) {
      return colorize(text, c, type);
    }
    return colorize(text, getTheme(theme)[c], type);
  };
}
var init_color = __esm(() => {
  init_colorize();
  init_theme_types();
});

// packages/@ant/ink/src/theme/SearchBox.tsx
function SearchBox({
  query,
  placeholder = "Search\u2026",
  isFocused,
  isTerminalFocused,
  prefix = "\u2315",
  width,
  cursorOffset,
  borderless = false
}) {
  const offset = cursorOffset ?? query.length;
  return /* @__PURE__ */ jsx_runtime22.jsx(ThemedBox_default, {
    flexShrink: 0,
    borderStyle: borderless ? undefined : "round",
    borderColor: isFocused ? "suggestion" : undefined,
    borderDimColor: !isFocused,
    paddingX: borderless ? 0 : 1,
    width,
    children: /* @__PURE__ */ jsx_runtime22.jsxs(ThemedText, {
      dimColor: !isFocused,
      children: [
        prefix,
        " ",
        isFocused ? /* @__PURE__ */ jsx_runtime22.jsx(jsx_runtime22.Fragment, {
          children: query ? isTerminalFocused ? /* @__PURE__ */ jsx_runtime22.jsxs(jsx_runtime22.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime22.jsx(ThemedText, {
                children: query.slice(0, offset)
              }),
              /* @__PURE__ */ jsx_runtime22.jsx(ThemedText, {
                inverse: true,
                children: offset < query.length ? query[offset] : " "
              }),
              offset < query.length && /* @__PURE__ */ jsx_runtime22.jsx(ThemedText, {
                children: query.slice(offset + 1)
              })
            ]
          }) : /* @__PURE__ */ jsx_runtime22.jsx(ThemedText, {
            children: query
          }) : isTerminalFocused ? /* @__PURE__ */ jsx_runtime22.jsxs(jsx_runtime22.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime22.jsx(ThemedText, {
                inverse: true,
                children: placeholder.charAt(0)
              }),
              /* @__PURE__ */ jsx_runtime22.jsx(ThemedText, {
                dimColor: true,
                children: placeholder.slice(1)
              })
            ]
          }) : /* @__PURE__ */ jsx_runtime22.jsx(ThemedText, {
            dimColor: true,
            children: placeholder
          })
        }) : query ? /* @__PURE__ */ jsx_runtime22.jsx(ThemedText, {
          children: query
        }) : /* @__PURE__ */ jsx_runtime22.jsx(ThemedText, {
          children: placeholder
        })
      ]
    })
  });
}
var jsx_runtime22;
var init_SearchBox = __esm(() => {
  init_src();
  jsx_runtime22 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/hooks/useExitOnCtrlCD.ts
function useDoublePress2(setPending, onDoublePress) {
  let lastPress = 0;
  let timeout;
  return () => {
    const now2 = Date.now();
    const timeSince = now2 - lastPress;
    const isDouble = timeSince <= DOUBLE_PRESS_TIMEOUT_MS2 && timeout !== undefined;
    if (isDouble) {
      clearTimeout(timeout);
      timeout = undefined;
      setPending(false);
      onDoublePress();
    } else {
      setPending(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setPending(false);
        timeout = undefined;
      }, DOUBLE_PRESS_TIMEOUT_MS2);
    }
    lastPress = now2;
  };
}
function useExitOnCtrlCDWithKeybindings(_onExit, _onInterrupt, isActive = true) {
  const [exitState, setExitState] = import_react35.useState({
    pending: false,
    keyName: null
  });
  const handleCtrlC = useDoublePress2((pending) => setExitState({ pending, keyName: pending ? "Ctrl-C" : null }), () => process.exit(0));
  const handleCtrlD = useDoublePress2((pending) => setExitState({ pending, keyName: pending ? "Ctrl-D" : null }), () => process.exit(0));
  const handleInput = import_react35.useCallback((_input, key) => {
    if (!isActive)
      return;
    if (key.ctrl && key.name === "c") {
      handleCtrlC();
    } else if (key.ctrl && key.name === "d") {
      handleCtrlD();
    }
  }, [isActive, handleCtrlC, handleCtrlD]);
  use_input_default(handleInput, { isActive });
  return exitState;
}
var import_react35, DOUBLE_PRESS_TIMEOUT_MS2 = 800;
var init_useExitOnCtrlCD = __esm(() => {
  init_use_input();
  import_react35 = __toESM(require_react(), 1);
});

// packages/@ant/ink/src/theme/KeyboardShortcutHint.tsx
function KeyboardShortcutHint({ shortcut, action, parens = false, bold = false }) {
  const shortcutText = bold ? /* @__PURE__ */ jsx_runtime23.jsx(Text, {
    bold: true,
    children: shortcut
  }) : shortcut;
  if (parens) {
    return /* @__PURE__ */ jsx_runtime23.jsxs(Text, {
      children: [
        "(",
        shortcutText,
        " to ",
        action,
        ")"
      ]
    });
  }
  return /* @__PURE__ */ jsx_runtime23.jsxs(Text, {
    children: [
      shortcutText,
      " to ",
      action
    ]
  });
}
var jsx_runtime23;
var init_KeyboardShortcutHint = __esm(() => {
  init_Text();
  jsx_runtime23 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/theme/ConfigurableShortcutHint.tsx
function ConfigurableShortcutHint({ fallback, description, parens, bold }) {
  return /* @__PURE__ */ jsx_runtime24.jsx(KeyboardShortcutHint, {
    shortcut: fallback,
    action: description,
    parens,
    bold
  });
}
var jsx_runtime24;
var init_ConfigurableShortcutHint = __esm(() => {
  init_KeyboardShortcutHint();
  jsx_runtime24 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/theme/Byline.tsx
function Byline({ children }) {
  const validChildren = import_react36.Children.toArray(children);
  if (validChildren.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsx_runtime25.jsx(jsx_runtime25.Fragment, {
    children: validChildren.map((child, index) => /* @__PURE__ */ jsx_runtime25.jsxs(import_react36.default.Fragment, {
      children: [
        index > 0 && /* @__PURE__ */ jsx_runtime25.jsx(ThemedText, {
          dimColor: true,
          children: " \xB7 "
        }),
        child
      ]
    }, import_react36.isValidElement(child) ? child.key ?? index : index))
  });
}
var import_react36, jsx_runtime25;
var init_Byline = __esm(() => {
  init_src();
  import_react36 = __toESM(require_react(), 1);
  jsx_runtime25 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/theme/modalContext.ts
function useIsInsideModal() {
  return import_react37.useContext(ModalContext) !== null;
}
function useModalScrollRef() {
  return import_react37.useContext(ModalContext)?.scrollRef ?? null;
}
var import_react37, ModalContext;
var init_modalContext = __esm(() => {
  import_react37 = __toESM(require_react(), 1);
  ModalContext = import_react37.createContext(null);
});

// packages/@ant/ink/src/theme/Divider.tsx
function Divider({ width, color: color2, char = "\u2500", padding = 0, title }) {
  const { columns: terminalWidth } = useTerminalSize();
  const effectiveWidth = Math.max(0, (width ?? terminalWidth) - padding);
  if (title) {
    const titleWidth = stringWidth(title) + 2;
    const sideWidth = Math.max(0, effectiveWidth - titleWidth);
    const leftWidth = Math.floor(sideWidth / 2);
    const rightWidth = sideWidth - leftWidth;
    return /* @__PURE__ */ jsx_runtime26.jsxs(ThemedText, {
      color: color2,
      dimColor: !color2,
      children: [
        char.repeat(leftWidth),
        " ",
        /* @__PURE__ */ jsx_runtime26.jsx(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_runtime26.jsx(Ansi, {
            children: title
          })
        }),
        " ",
        char.repeat(rightWidth)
      ]
    });
  }
  return /* @__PURE__ */ jsx_runtime26.jsx(ThemedText, {
    color: color2,
    dimColor: !color2,
    children: char.repeat(effectiveWidth)
  });
}
var jsx_runtime26;
var init_Divider = __esm(() => {
  init_useTerminalSize();
  init_stringWidth();
  init_src();
  jsx_runtime26 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/theme/Pane.tsx
function Pane({ children, color: color2 }) {
  if (useIsInsideModal()) {
    return /* @__PURE__ */ jsx_runtime27.jsx(ThemedBox_default, {
      flexDirection: "column",
      paddingX: 1,
      flexShrink: 0,
      children
    });
  }
  return /* @__PURE__ */ jsx_runtime27.jsxs(ThemedBox_default, {
    flexDirection: "column",
    paddingTop: 1,
    children: [
      /* @__PURE__ */ jsx_runtime27.jsx(Divider, {
        color: color2
      }),
      /* @__PURE__ */ jsx_runtime27.jsx(ThemedBox_default, {
        flexDirection: "column",
        paddingX: 2,
        children
      })
    ]
  });
}
var jsx_runtime27;
var init_Pane = __esm(() => {
  init_modalContext();
  init_src();
  init_Divider();
  jsx_runtime27 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/theme/Dialog.tsx
function Dialog({
  title,
  subtitle,
  children,
  onCancel,
  color: color2 = "permission",
  hideInputGuide,
  hideBorder,
  inputGuide,
  isCancelActive = true
}) {
  const exitState = useExitOnCtrlCDWithKeybindings(undefined, undefined, isCancelActive);
  useKeybinding("confirm:no", onCancel, {
    context: "Confirmation",
    isActive: isCancelActive
  });
  const defaultInputGuide = exitState.pending ? /* @__PURE__ */ jsx_runtime28.jsxs(ThemedText, {
    children: [
      "Press ",
      exitState.keyName,
      " again to exit"
    ]
  }) : /* @__PURE__ */ jsx_runtime28.jsxs(Byline, {
    children: [
      /* @__PURE__ */ jsx_runtime28.jsx(KeyboardShortcutHint, {
        shortcut: "Enter",
        action: "confirm"
      }),
      /* @__PURE__ */ jsx_runtime28.jsx(ConfigurableShortcutHint, {
        action: "confirm:no",
        context: "Confirmation",
        fallback: "Esc",
        description: "cancel"
      })
    ]
  });
  const content = /* @__PURE__ */ jsx_runtime28.jsxs(jsx_runtime28.Fragment, {
    children: [
      /* @__PURE__ */ jsx_runtime28.jsxs(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_runtime28.jsxs(ThemedBox_default, {
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_runtime28.jsx(ThemedText, {
                bold: true,
                color: color2,
                children: title
              }),
              subtitle && /* @__PURE__ */ jsx_runtime28.jsx(ThemedText, {
                dimColor: true,
                children: subtitle
              })
            ]
          }),
          children
        ]
      }),
      !hideInputGuide && /* @__PURE__ */ jsx_runtime28.jsx(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_runtime28.jsx(ThemedText, {
          dimColor: true,
          italic: true,
          children: inputGuide ? inputGuide(exitState) : defaultInputGuide
        })
      })
    ]
  });
  if (hideBorder) {
    return content;
  }
  return /* @__PURE__ */ jsx_runtime28.jsx(Pane, {
    color: color2,
    children: content
  });
}
var jsx_runtime28;
var init_Dialog = __esm(() => {
  init_useExitOnCtrlCD();
  init_src();
  init_useKeybinding();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_Pane();
  jsx_runtime28 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/hooks/useSearchInput.ts
function useSearchInput({
  isActive,
  onExit: onExit2,
  onCancel,
  onExitUp,
  columns,
  initialQuery = "",
  backspaceExitsOnEmpty = true
}) {
  const { columns: terminalColumns } = useTerminalSize();
  const _effectiveColumns = columns ?? terminalColumns;
  const [query, setQueryState] = import_react38.useState(initialQuery);
  const [cursorOffset, setCursorOffset] = import_react38.useState(initialQuery.length);
  const setQuery = import_react38.useCallback((q) => {
    setQueryState(q);
    setCursorOffset(q.length);
  }, []);
  const handleKeyDown = (e) => {
    if (!isActive)
      return;
    if (e.key === "return" || e.key === "down") {
      e.preventDefault();
      onExit2();
      return;
    }
    if (e.key === "up") {
      e.preventDefault();
      onExitUp?.();
      return;
    }
    if (e.key === "escape") {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      } else if (query.length > 0) {
        setQueryState("");
        setCursorOffset(0);
      } else {
        onExit2();
      }
      return;
    }
    if (e.key === "backspace") {
      e.preventDefault();
      if (query.length === 0) {
        if (backspaceExitsOnEmpty)
          (onCancel ?? onExit2)();
        return;
      }
      const newOffset = Math.max(0, cursorOffset - 1);
      setQueryState(query.slice(0, newOffset) + query.slice(cursorOffset));
      setCursorOffset(newOffset);
      return;
    }
    if (e.key === "delete") {
      e.preventDefault();
      if (cursorOffset < query.length) {
        setQueryState(query.slice(0, cursorOffset) + query.slice(cursorOffset + 1));
      }
      return;
    }
    if (e.key === "left") {
      e.preventDefault();
      setCursorOffset(Math.max(0, cursorOffset - 1));
      return;
    }
    if (e.key === "right") {
      e.preventDefault();
      setCursorOffset(Math.min(query.length, cursorOffset + 1));
      return;
    }
    if (e.key === "home") {
      e.preventDefault();
      setCursorOffset(0);
      return;
    }
    if (e.key === "end") {
      e.preventDefault();
      setCursorOffset(query.length);
      return;
    }
    if (e.ctrl) {
      switch (e.key.toLowerCase()) {
        case "a":
          e.preventDefault();
          setCursorOffset(0);
          return;
        case "e":
          e.preventDefault();
          setCursorOffset(query.length);
          return;
        case "b":
          e.preventDefault();
          setCursorOffset(Math.max(0, cursorOffset - 1));
          return;
        case "f":
          e.preventDefault();
          setCursorOffset(Math.min(query.length, cursorOffset + 1));
          return;
        case "d": {
          e.preventDefault();
          if (query.length === 0) {
            (onCancel ?? onExit2)();
            return;
          }
          if (cursorOffset < query.length) {
            setQueryState(query.slice(0, cursorOffset) + query.slice(cursorOffset + 1));
          }
          return;
        }
        case "h": {
          e.preventDefault();
          if (query.length === 0) {
            if (backspaceExitsOnEmpty)
              (onCancel ?? onExit2)();
            return;
          }
          const newOffset = Math.max(0, cursorOffset - 1);
          setQueryState(query.slice(0, newOffset) + query.slice(cursorOffset));
          setCursorOffset(newOffset);
          return;
        }
        case "c":
          e.preventDefault();
          onCancel?.();
          return;
        case "u":
          e.preventDefault();
          setQueryState(query.slice(cursorOffset));
          setCursorOffset(0);
          return;
        case "k":
          e.preventDefault();
          setQueryState(query.slice(0, cursorOffset));
          return;
        case "w": {
          e.preventDefault();
          const before = query.slice(0, cursorOffset);
          const after = query.slice(cursorOffset);
          const trimmed = before.replace(/\S+\s*$/, "");
          setQueryState(trimmed + after);
          setCursorOffset(trimmed.length);
          return;
        }
      }
      return;
    }
    if (e.key === "tab") {
      return;
    }
    if (e.key.length >= 1 && !UNHANDLED_SPECIAL_KEYS.has(e.key)) {
      e.preventDefault();
      setQueryState(query.slice(0, cursorOffset) + e.key + query.slice(cursorOffset));
      setCursorOffset(cursorOffset + 1);
    }
  };
  use_input_default((_input, _key, event) => {
    handleKeyDown(new KeyboardEvent(event.keypress));
  }, { isActive });
  return { query, setQuery, cursorOffset, handleKeyDown };
}
var import_react38, UNHANDLED_SPECIAL_KEYS;
var init_useSearchInput = __esm(() => {
  init_keyboard_event();
  init_use_input();
  init_useTerminalSize();
  import_react38 = __toESM(require_react(), 1);
  UNHANDLED_SPECIAL_KEYS = new Set([
    "pageup",
    "pagedown",
    "insert",
    "wheelup",
    "wheeldown",
    "mouse",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f6",
    "f7",
    "f8",
    "f9",
    "f10",
    "f11",
    "f12"
  ]);
});

// packages/@ant/ink/src/theme/ListItem.tsx
function ListItem({
  isFocused,
  isSelected = false,
  children,
  description,
  showScrollDown,
  showScrollUp,
  styled = true,
  disabled = false,
  declareCursor
}) {
  function renderIndicator() {
    if (disabled) {
      return /* @__PURE__ */ jsx_runtime29.jsx(ThemedText, {
        children: " "
      });
    }
    if (isFocused) {
      return /* @__PURE__ */ jsx_runtime29.jsx(ThemedText, {
        color: "suggestion",
        children: figures_default.pointer
      });
    }
    if (showScrollDown) {
      return /* @__PURE__ */ jsx_runtime29.jsx(ThemedText, {
        dimColor: true,
        children: figures_default.arrowDown
      });
    }
    if (showScrollUp) {
      return /* @__PURE__ */ jsx_runtime29.jsx(ThemedText, {
        dimColor: true,
        children: figures_default.arrowUp
      });
    }
    return /* @__PURE__ */ jsx_runtime29.jsx(ThemedText, {
      children: " "
    });
  }
  function getTextColor() {
    if (disabled) {
      return "inactive";
    }
    if (!styled) {
      return;
    }
    if (isSelected) {
      return "success";
    }
    if (isFocused) {
      return "suggestion";
    }
    return;
  }
  const textColor = getTextColor();
  const cursorRef = useDeclaredCursor({
    line: 0,
    column: 0,
    active: isFocused && !disabled && declareCursor !== false
  });
  return /* @__PURE__ */ jsx_runtime29.jsxs(ThemedBox_default, {
    ref: cursorRef,
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_runtime29.jsxs(ThemedBox_default, {
        flexDirection: "row",
        gap: 1,
        children: [
          renderIndicator(),
          styled ? /* @__PURE__ */ jsx_runtime29.jsx(ThemedText, {
            color: textColor,
            dimColor: disabled,
            children
          }) : children,
          isSelected && !disabled && /* @__PURE__ */ jsx_runtime29.jsx(ThemedText, {
            color: "success",
            children: figures_default.tick
          })
        ]
      }),
      description && /* @__PURE__ */ jsx_runtime29.jsx(ThemedBox_default, {
        paddingLeft: 2,
        children: /* @__PURE__ */ jsx_runtime29.jsx(ThemedText, {
          color: "inactive",
          children: description
        })
      })
    ]
  });
}
var jsx_runtime29;
var init_ListItem = __esm(() => {
  init_figures();
  init_use_declared_cursor();
  init_src();
  jsx_runtime29 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/theme/FuzzyPicker.tsx
function FuzzyPicker({
  title,
  placeholder = "Type to search\u2026",
  initialQuery,
  items,
  getKey,
  renderItem,
  renderPreview,
  previewPosition = "bottom",
  visibleCount: requestedVisible = DEFAULT_VISIBLE,
  direction = "down",
  onQueryChange,
  onSelect,
  onTab,
  onShiftTab,
  onFocus,
  onCancel,
  emptyMessage = "No results",
  matchLabel,
  selectAction = "select",
  extraHints
}) {
  const isTerminalFocused = useTerminalFocus();
  const { rows, columns } = useTerminalSize();
  const [focusedIndex, setFocusedIndex] = import_react39.useState(0);
  const visibleCount = Math.max(MIN_VISIBLE, Math.min(requestedVisible, rows - CHROME_ROWS - (matchLabel ? 1 : 0)));
  const compact = columns < 120;
  const step = (delta) => {
    setFocusedIndex((i) => clamp(i + delta, 0, items.length - 1));
  };
  const { query, cursorOffset } = useSearchInput({
    isActive: true,
    onExit: () => {},
    onCancel,
    initialQuery,
    backspaceExitsOnEmpty: false
  });
  const handleKeyDown = (e) => {
    if (e.key === "up" || e.ctrl && e.key === "p") {
      e.preventDefault();
      e.stopImmediatePropagation();
      step(direction === "up" ? 1 : -1);
      return;
    }
    if (e.key === "down" || e.ctrl && e.key === "n") {
      e.preventDefault();
      e.stopImmediatePropagation();
      step(direction === "up" ? -1 : 1);
      return;
    }
    if (e.key === "return") {
      e.preventDefault();
      e.stopImmediatePropagation();
      const selected = items[focusedIndex];
      if (selected)
        onSelect(selected);
      return;
    }
    if (e.key === "tab") {
      e.preventDefault();
      e.stopImmediatePropagation();
      const selected = items[focusedIndex];
      if (!selected)
        return;
      const tabAction = e.shift ? onShiftTab ?? onTab : onTab;
      if (tabAction) {
        tabAction.handler(selected);
      } else {
        onSelect(selected);
      }
    }
  };
  import_react39.useEffect(() => {
    onQueryChange(query);
    setFocusedIndex(0);
  }, [query]);
  import_react39.useEffect(() => {
    setFocusedIndex((i) => clamp(i, 0, items.length - 1));
  }, [items.length]);
  const focused = items[focusedIndex];
  import_react39.useEffect(() => {
    onFocus?.(focused);
  }, [focused]);
  const windowStart = clamp(focusedIndex - visibleCount + 1, 0, items.length - visibleCount);
  const visible = items.slice(windowStart, windowStart + visibleCount);
  const emptyText = typeof emptyMessage === "function" ? emptyMessage(query) : emptyMessage;
  const searchBox = /* @__PURE__ */ jsx_runtime30.jsx(SearchBox, {
    query,
    cursorOffset,
    placeholder,
    isFocused: true,
    isTerminalFocused
  });
  const listBlock = /* @__PURE__ */ jsx_runtime30.jsx(List, {
    visible,
    windowStart,
    visibleCount,
    total: items.length,
    focusedIndex,
    direction,
    getKey,
    renderItem,
    emptyText
  });
  const preview = renderPreview && focused ? /* @__PURE__ */ jsx_runtime30.jsx(ThemedBox_default, {
    flexDirection: "column",
    flexGrow: 1,
    children: renderPreview(focused)
  }) : null;
  const listGroup = renderPreview && previewPosition === "right" ? /* @__PURE__ */ jsx_runtime30.jsxs(ThemedBox_default, {
    flexDirection: "row",
    gap: 2,
    height: visibleCount + (matchLabel ? 1 : 0),
    children: [
      /* @__PURE__ */ jsx_runtime30.jsxs(ThemedBox_default, {
        flexDirection: "column",
        flexShrink: 0,
        children: [
          listBlock,
          matchLabel && /* @__PURE__ */ jsx_runtime30.jsx(ThemedText, {
            dimColor: true,
            children: matchLabel
          })
        ]
      }),
      preview ?? /* @__PURE__ */ jsx_runtime30.jsx(ThemedBox_default, {
        flexGrow: 1
      })
    ]
  }) : /* @__PURE__ */ jsx_runtime30.jsxs(ThemedBox_default, {
    flexDirection: "column",
    children: [
      listBlock,
      matchLabel && /* @__PURE__ */ jsx_runtime30.jsx(ThemedText, {
        dimColor: true,
        children: matchLabel
      }),
      preview
    ]
  });
  const inputAbove = direction !== "up";
  return /* @__PURE__ */ jsx_runtime30.jsx(Pane, {
    color: "permission",
    children: /* @__PURE__ */ jsx_runtime30.jsxs(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: [
        /* @__PURE__ */ jsx_runtime30.jsx(ThemedText, {
          bold: true,
          color: "permission",
          children: title
        }),
        inputAbove && searchBox,
        listGroup,
        !inputAbove && searchBox,
        /* @__PURE__ */ jsx_runtime30.jsx(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_runtime30.jsxs(Byline, {
            children: [
              /* @__PURE__ */ jsx_runtime30.jsx(KeyboardShortcutHint, {
                shortcut: "\u2191/\u2193",
                action: compact ? "nav" : "navigate"
              }),
              /* @__PURE__ */ jsx_runtime30.jsx(KeyboardShortcutHint, {
                shortcut: "Enter",
                action: compact ? firstWord(selectAction) : selectAction
              }),
              onTab && /* @__PURE__ */ jsx_runtime30.jsx(KeyboardShortcutHint, {
                shortcut: "Tab",
                action: onTab.action
              }),
              onShiftTab && !compact && /* @__PURE__ */ jsx_runtime30.jsx(KeyboardShortcutHint, {
                shortcut: "shift+tab",
                action: onShiftTab.action
              }),
              /* @__PURE__ */ jsx_runtime30.jsx(KeyboardShortcutHint, {
                shortcut: "Esc",
                action: "cancel"
              }),
              extraHints
            ]
          })
        })
      ]
    })
  });
}
function List({
  visible,
  windowStart,
  visibleCount,
  total,
  focusedIndex,
  direction,
  getKey,
  renderItem,
  emptyText
}) {
  if (visible.length === 0) {
    return /* @__PURE__ */ jsx_runtime30.jsx(ThemedBox_default, {
      height: visibleCount,
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_runtime30.jsx(ThemedText, {
        dimColor: true,
        children: emptyText
      })
    });
  }
  const rows = visible.map((item, i) => {
    const actualIndex = windowStart + i;
    const isFocused = actualIndex === focusedIndex;
    const atLowEdge = i === 0 && windowStart > 0;
    const atHighEdge = i === visible.length - 1 && windowStart + visibleCount < total;
    return /* @__PURE__ */ jsx_runtime30.jsx(ListItem, {
      isFocused,
      showScrollUp: direction === "up" ? atHighEdge : atLowEdge,
      showScrollDown: direction === "up" ? atLowEdge : atHighEdge,
      styled: false,
      children: renderItem(item, isFocused)
    }, getKey(item));
  });
  return /* @__PURE__ */ jsx_runtime30.jsx(ThemedBox_default, {
    height: visibleCount,
    flexShrink: 0,
    flexDirection: direction === "up" ? "column-reverse" : "column",
    children: rows
  });
}
function firstWord(s) {
  const i = s.indexOf(" ");
  return i === -1 ? s : s.slice(0, i);
}
var import_react39, jsx_runtime30, DEFAULT_VISIBLE = 8, CHROME_ROWS = 10, MIN_VISIBLE = 2;
var init_FuzzyPicker = __esm(() => {
  init_useSearchInput();
  init_useTerminalSize();
  init_geometry();
  init_src();
  init_SearchBox();
  init_Byline();
  init_KeyboardShortcutHint();
  init_ListItem();
  init_Pane();
  import_react39 = __toESM(require_react(), 1);
  jsx_runtime30 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/theme/Spinner.tsx
function Spinner() {
  const [frame, setFrame] = import_react40.useState(0);
  import_react40.useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);
  return /* @__PURE__ */ jsx_runtime31.jsx(ThemedText, {
    children: FRAMES[frame]
  });
}
var import_react40, jsx_runtime31, FRAMES;
var init_Spinner = __esm(() => {
  init_src();
  import_react40 = __toESM(require_react(), 1);
  jsx_runtime31 = __toESM(require_jsx_runtime(), 1);
  FRAMES = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
});

// packages/@ant/ink/src/theme/LoadingState.tsx
function LoadingState({
  message,
  bold = false,
  dimColor = false,
  subtitle
}) {
  return /* @__PURE__ */ jsx_runtime32.jsxs(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_runtime32.jsxs(ThemedBox_default, {
        flexDirection: "row",
        children: [
          /* @__PURE__ */ jsx_runtime32.jsx(Spinner, {}),
          /* @__PURE__ */ jsx_runtime32.jsxs(ThemedText, {
            bold,
            dimColor,
            children: [
              " ",
              message
            ]
          })
        ]
      }),
      subtitle && /* @__PURE__ */ jsx_runtime32.jsx(ThemedText, {
        dimColor: true,
        children: subtitle
      })
    ]
  });
}
var jsx_runtime32;
var init_LoadingState = __esm(() => {
  init_src();
  init_Spinner();
  jsx_runtime32 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/theme/ProgressBar.tsx
function ProgressBar({ ratio: inputRatio, width, fillColor, emptyColor }) {
  const ratio = Math.min(1, Math.max(0, inputRatio));
  const whole = Math.floor(ratio * width);
  const segments = [BLOCKS[BLOCKS.length - 1].repeat(whole)];
  if (whole < width) {
    const remainder = ratio * width - whole;
    const middle = Math.floor(remainder * BLOCKS.length);
    segments.push(BLOCKS[middle]);
    const empty = width - whole - 1;
    if (empty > 0) {
      segments.push(BLOCKS[0].repeat(empty));
    }
  }
  return /* @__PURE__ */ jsx_runtime33.jsx(ThemedText, {
    color: fillColor,
    backgroundColor: emptyColor,
    children: segments.join("")
  });
}
var jsx_runtime33, BLOCKS;
var init_ProgressBar = __esm(() => {
  init_src();
  jsx_runtime33 = __toESM(require_jsx_runtime(), 1);
  BLOCKS = [" ", "\u258F", "\u258E", "\u258D", "\u258C", "\u258B", "\u258A", "\u2589", "\u2588"];
});

// packages/@ant/ink/src/theme/Ratchet.tsx
function Ratchet({ children, lock = "always" }) {
  const [viewportRef, { isVisible }] = useTerminalViewport();
  const { rows } = useTerminalSize();
  const innerRef = import_react41.useRef(null);
  const maxHeight = import_react41.useRef(0);
  const [minHeight, setMinHeight] = import_react41.useState(0);
  const outerRef = import_react41.useCallback((el) => {
    viewportRef(el);
  }, [viewportRef]);
  const engaged = lock === "always" || !isVisible;
  import_react41.useLayoutEffect(() => {
    if (!innerRef.current) {
      return;
    }
    const { height } = measure_element_default(innerRef.current);
    if (height > maxHeight.current) {
      maxHeight.current = Math.min(height, rows);
      setMinHeight(maxHeight.current);
    }
  });
  return /* @__PURE__ */ jsx_runtime34.jsx(ThemedBox_default, {
    minHeight: engaged ? minHeight : undefined,
    ref: outerRef,
    children: /* @__PURE__ */ jsx_runtime34.jsx(ThemedBox_default, {
      ref: innerRef,
      flexDirection: "column",
      children
    })
  });
}
var import_react41, jsx_runtime34;
var init_Ratchet = __esm(() => {
  init_useTerminalSize();
  init_use_terminal_viewport();
  init_src();
  import_react41 = __toESM(require_react(), 1);
  jsx_runtime34 = __toESM(require_jsx_runtime(), 1);
});

// packages/@ant/ink/src/theme/StatusIcon.tsx
function StatusIcon({ status, withSpace = false }) {
  const config = STATUS_CONFIG[status];
  return /* @__PURE__ */ jsx_runtime35.jsxs(ThemedText, {
    color: config.color,
    dimColor: !config.color,
    children: [
      config.icon,
      withSpace && " "
    ]
  });
}
var jsx_runtime35, STATUS_CONFIG;
var init_StatusIcon = __esm(() => {
  init_figures();
  init_src();
  jsx_runtime35 = __toESM(require_jsx_runtime(), 1);
  STATUS_CONFIG = {
    success: { icon: figures_default.tick, color: "success" },
    error: { icon: figures_default.cross, color: "error" },
    warning: { icon: figures_default.warning, color: "warning" },
    info: { icon: figures_default.info, color: "suggestion" },
    pending: { icon: figures_default.circle, color: undefined },
    loading: { icon: "\u2026", color: undefined }
  };
});

// packages/@ant/ink/src/theme/Tabs.tsx
function Tabs({
  title,
  color: color2,
  defaultTab,
  children,
  hidden,
  useFullWidth,
  selectedTab: controlledSelectedTab,
  onTabChange,
  banner,
  disableNavigation,
  initialHeaderFocused = true,
  contentHeight,
  navFromContent = false
}) {
  const { columns: terminalWidth } = useTerminalSize();
  const tabs = children.map((child) => [child.props.id ?? child.props.title, child.props.title]);
  const defaultTabIndex = defaultTab ? tabs.findIndex((tab) => defaultTab === tab[0]) : 0;
  const isControlled = controlledSelectedTab !== undefined;
  const [internalSelectedTab, setInternalSelectedTab] = import_react42.useState(defaultTabIndex !== -1 ? defaultTabIndex : 0);
  const controlledTabIndex = isControlled ? tabs.findIndex((tab) => tab[0] === controlledSelectedTab) : -1;
  const selectedTabIndex = isControlled ? controlledTabIndex !== -1 ? controlledTabIndex : 0 : internalSelectedTab;
  const modalScrollRef = useModalScrollRef();
  const [headerFocused, setHeaderFocused] = import_react42.useState(initialHeaderFocused);
  const focusHeader = import_react42.useCallback(() => setHeaderFocused(true), []);
  const blurHeader = import_react42.useCallback(() => setHeaderFocused(false), []);
  const [optInCount, setOptInCount] = import_react42.useState(0);
  const registerOptIn = import_react42.useCallback(() => {
    setOptInCount((n) => n + 1);
    return () => setOptInCount((n) => n - 1);
  }, []);
  const optedIn = optInCount > 0;
  const handleTabChange = (offset) => {
    const newIndex = (selectedTabIndex + tabs.length + offset) % tabs.length;
    const newTabId = tabs[newIndex]?.[0];
    if (isControlled && onTabChange && newTabId) {
      onTabChange(newTabId);
    } else {
      setInternalSelectedTab(newIndex);
    }
    setHeaderFocused(true);
  };
  useKeybindings({
    "tabs:next": () => handleTabChange(1),
    "tabs:previous": () => handleTabChange(-1)
  }, {
    context: "Tabs",
    isActive: !hidden && !disableNavigation && headerFocused
  });
  const handleKeyDown = (e) => {
    if (!headerFocused || !optedIn || hidden)
      return;
    if (e.key === "down") {
      e.preventDefault();
      setHeaderFocused(false);
    }
  };
  useKeybindings({
    "tabs:next": () => {
      handleTabChange(1);
      setHeaderFocused(true);
    },
    "tabs:previous": () => {
      handleTabChange(-1);
      setHeaderFocused(true);
    }
  }, {
    context: "Tabs",
    isActive: navFromContent && !headerFocused && optedIn && !hidden && !disableNavigation
  });
  const titleWidth = title ? stringWidth(title) + 1 : 0;
  const tabsWidth = tabs.reduce((sum, [, tabTitle]) => sum + (tabTitle ? stringWidth(tabTitle) : 0) + 2 + 1, 0);
  const usedWidth = titleWidth + tabsWidth;
  const spacerWidth = useFullWidth ? Math.max(0, terminalWidth - usedWidth) : 0;
  const contentWidth = useFullWidth ? terminalWidth : undefined;
  return /* @__PURE__ */ jsx_runtime36.jsx(TabsContext.Provider, {
    value: {
      selectedTab: tabs[selectedTabIndex][0],
      width: contentWidth,
      headerFocused,
      focusHeader,
      blurHeader,
      registerOptIn
    },
    children: /* @__PURE__ */ jsx_runtime36.jsxs(ThemedBox_default, {
      flexDirection: "column",
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      flexShrink: modalScrollRef ? 0 : undefined,
      children: [
        !hidden && /* @__PURE__ */ jsx_runtime36.jsxs(ThemedBox_default, {
          flexDirection: "row",
          gap: 1,
          flexShrink: modalScrollRef ? 0 : undefined,
          children: [
            title !== undefined && /* @__PURE__ */ jsx_runtime36.jsx(ThemedText, {
              bold: true,
              color: color2,
              children: title
            }),
            tabs.map(([id, title2], i) => {
              const isCurrent = selectedTabIndex === i;
              const hasColorCursor = color2 && isCurrent && headerFocused;
              return /* @__PURE__ */ jsx_runtime36.jsxs(ThemedText, {
                backgroundColor: hasColorCursor ? color2 : undefined,
                color: hasColorCursor ? "inverseText" : undefined,
                inverse: isCurrent && !hasColorCursor,
                bold: isCurrent,
                children: [
                  " ",
                  title2,
                  " "
                ]
              }, id);
            }),
            spacerWidth > 0 && /* @__PURE__ */ jsx_runtime36.jsx(ThemedText, {
              children: " ".repeat(spacerWidth)
            })
          ]
        }),
        banner,
        modalScrollRef ? /* @__PURE__ */ jsx_runtime36.jsx(ThemedBox_default, {
          width: contentWidth,
          marginTop: hidden ? 0 : 1,
          flexShrink: 0,
          children: /* @__PURE__ */ jsx_runtime36.jsx(ScrollBox_default, {
            ref: modalScrollRef,
            flexDirection: "column",
            flexShrink: 0,
            children
          }, selectedTabIndex)
        }) : /* @__PURE__ */ jsx_runtime36.jsx(ThemedBox_default, {
          width: contentWidth,
          marginTop: hidden ? 0 : 1,
          height: contentHeight,
          overflowY: contentHeight !== undefined ? "hidden" : undefined,
          children
        })
      ]
    })
  });
}
function Tab({ title, id, children }) {
  const { selectedTab, width } = import_react42.useContext(TabsContext);
  const insideModal = useIsInsideModal();
  if (selectedTab !== (id ?? title)) {
    return null;
  }
  return /* @__PURE__ */ jsx_runtime36.jsx(ThemedBox_default, {
    width,
    flexShrink: insideModal ? 0 : undefined,
    children
  });
}
function useTabsWidth() {
  const { width } = import_react42.useContext(TabsContext);
  return width;
}
function useTabHeaderFocus() {
  const { headerFocused, focusHeader, blurHeader, registerOptIn } = import_react42.useContext(TabsContext);
  import_react42.useEffect(registerOptIn, [registerOptIn]);
  return { headerFocused, focusHeader, blurHeader };
}
var import_react42, jsx_runtime36, TabsContext;
var init_Tabs = __esm(() => {
  init_modalContext();
  init_useTerminalSize();
  init_ScrollBox();
  init_stringWidth();
  init_src();
  init_useKeybinding();
  import_react42 = __toESM(require_react(), 1);
  jsx_runtime36 = __toESM(require_jsx_runtime(), 1);
  TabsContext = import_react42.createContext({
    selectedTab: undefined,
    width: undefined,
    headerFocused: false,
    focusHeader: () => {},
    blurHeader: () => {},
    registerOptIn: () => () => {}
  });
});

// packages/@ant/ink/src/index.ts
var init_src = __esm(() => {
  init_root();
  init_ink();
  init_useKeybinding();
  init_KeybindingContext();
  init_resolver();
  init_parser();
  init_match();
  init_KeybindingSetup();
  init_click_event();
  init_emitter();
  init_event();
  init_input_event();
  init_terminal_focus_event();
  init_keyboard_event();
  init_focus_event();
  init_focus();
  init_Ansi();
  init_stringWidth();
  init_wrap_text();
  init_measure_element();
  init_osc();
  init_osc();
  init_csi();
  init_dec();
  init_instances();
  init_render_border();
  init_terminal();
  init_colorize();
  init_wrapAnsi();
  init_styles();
  init_geometry();
  init_terminal_focus_state();
  init_supports_hyperlinks2();
  init_Box();
  init_Text();
  init_Button();
  init_Link();
  init_Newline();
  init_Spacer();
  init_NoSelect();
  init_RawAnsi();
  init_ScrollBox();
  init_AlternateScreen();
  init_TerminalSizeContext();
  init_use_app();
  init_use_input();
  init_use_animation_frame();
  init_use_interval();
  init_use_selection();
  init_use_stdin();
  init_useTerminalSize();
  init_useTimeout();
  init_useMinDisplayTime();
  init_useDoublePress();
  init_use_tab_status();
  init_use_terminal_focus();
  init_use_terminal_title();
  init_use_terminal_viewport();
  init_use_search_highlight();
  init_use_declared_cursor();
  init_useTerminalNotification();
  init_ThemeProvider();
  init_ThemedBox();
  init_ThemedText();
  init_color();
  init_SearchBox();
  init_Dialog();
  init_Divider();
  init_FuzzyPicker();
  init_ListItem();
  init_LoadingState();
  init_Pane();
  init_ProgressBar();
  init_Ratchet();
  init_StatusIcon();
  init_Tabs();
  init_Byline();
  init_KeyboardShortcutHint();
  init_theme_types();
});

export { noop_default, init_noop, Chalk, source_default, init_source, colorize, applyTextStyles, applyColor, require_react, Event, EventEmitter, DISABLE_KITTY_KEYBOARD, DISABLE_MODIFY_OTHER_KEYS, InputEvent, TerminalFocusEvent, stripAnsi, init_strip_ansi, stringWidth, ansiCodesToString, reduceAnsiCodes, undoAnsiCodes, tokenize2 as tokenize, init_build, wrapAnsi2 as wrapAnsi, wrapText, FocusEvent, FocusManager, styles_default, clamp, DBP, DFE, SHOW_CURSOR, HIDE_CURSOR, ENTER_ALT_SCREEN, EXIT_ALT_SCREEN, ENABLE_MOUSE_TRACKING, DISABLE_MOUSE_TRACKING, wrapForMultiplexer, getClipboardPath, setClipboard, CLEAR_ITERM2_PROGRESS, CLEAR_TERMINAL_TITLE, CLEAR_TAB_STATUS, supportsTabStatus, isSynchronizedOutputSupported, isXtermJs, hasCursorUpViewportYankBug, writeDiffToTerminal, getTerminalFocused, getTerminalFocusState, subscribeTerminalFocus, useTerminalFocus, Box_default, Text, TerminalSizeContext, KeyboardEvent, ClickEvent, instances_default, render_border_default, TerminalWriteProvider, useTerminalNotification, Ink, renderSync, createRoot, root_default, THEME_NAMES, THEME_SETTINGS, getTheme, themeColorToAnsi, useInterval, useDebounceCallback, init_dist3 as init_dist, use_stdin_default, use_input_default, getKeyName, matchesKeystroke, matchesBinding, parseKeystroke, parseChord, keystrokeToString, chordToString, keystrokeToDisplayString, chordToDisplayString, parseBindings, resolveKey, getBindingDisplayText, keystrokesEqual, resolveKeyWithChordState, KeybindingProvider, useKeybindingContext, useOptionalKeybindingContext, useRegisterKeybindingContext, useKeybinding, useKeybindings, KeybindingSetup, supportsHyperlinks2 as supportsHyperlinks, Link, Ansi, measure_element_default, Button_default, Newline, Spacer, NoSelect, RawAnsi, ScrollBox_default, AlternateScreen, use_app_default, useTerminalViewport, useAnimationFrame, useAnimationTimer, useInterval2 as useInterval1, useSelection, useHasSelection, useTerminalSize, useTimeout, useMinDisplayTime, DOUBLE_PRESS_TIMEOUT_MS, useDoublePress, useTabStatus, useTerminalTitle, useSearchHighlight, useDeclaredCursor, setThemeConfigCallbacks, ThemeProvider, useTheme, useThemeSetting, usePreviewTheme, ThemedBox_default, TextHoverColorContext, ThemedText, color, SearchBox, KeyboardShortcutHint, Byline, Divider, Pane, Dialog, ListItem, FuzzyPicker, LoadingState, ProgressBar, Ratchet, StatusIcon, Tabs, Tab, useTabsWidth, useTabHeaderFocus, init_src };

//# debugId=BEA4FA29DA0ADEF864756E2164756E21
//# sourceMappingURL=chunk-1ekct4sm.js.map
