// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/stringUtils.ts
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function plural(n, word, pluralWord = word + "s") {
  return n === 1 ? word : pluralWord;
}
function firstLineOf(s) {
  const nl = s.indexOf(`
`);
  return nl === -1 ? s : s.slice(0, nl);
}
function countCharInString(str, char, start = 0) {
  let count = 0;
  let i = str.indexOf(char, start);
  while (i !== -1) {
    count++;
    i = str.indexOf(char, i + 1);
  }
  return count;
}
function normalizeFullWidthDigits(input) {
  return input.replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 65248));
}
function normalizeFullWidthSpace(input) {
  return input.replace(/\u3000/g, " ");
}
function safeJoinLines(lines, delimiter = ",", maxSize = MAX_STRING_LENGTH) {
  const truncationMarker = "...[truncated]";
  let result = "";
  for (const line of lines) {
    const delimiterToAdd = result ? delimiter : "";
    const fullAddition = delimiterToAdd + line;
    if (result.length + fullAddition.length <= maxSize) {
      result += fullAddition;
    } else {
      const remainingSpace = maxSize - result.length - delimiterToAdd.length - truncationMarker.length;
      if (remainingSpace > 0) {
        result += delimiterToAdd + line.slice(0, remainingSpace) + truncationMarker;
      } else {
        result += truncationMarker;
      }
      return result;
    }
  }
  return result;
}

class EndTruncatingAccumulator {
  maxSize;
  content = "";
  isTruncated = false;
  totalBytesReceived = 0;
  constructor(maxSize = MAX_STRING_LENGTH) {
    this.maxSize = maxSize;
  }
  append(data) {
    const str = typeof data === "string" ? data : data.toString();
    this.totalBytesReceived += str.length;
    if (this.isTruncated && this.content.length >= this.maxSize) {
      return;
    }
    if (this.content.length + str.length > this.maxSize) {
      const remainingSpace = this.maxSize - this.content.length;
      if (remainingSpace > 0) {
        this.content += str.slice(0, remainingSpace);
      }
      this.isTruncated = true;
    } else {
      this.content += str;
    }
  }
  toString() {
    if (!this.isTruncated) {
      return this.content;
    }
    const truncatedBytes = this.totalBytesReceived - this.maxSize;
    const truncatedKB = Math.round(truncatedBytes / 1024);
    return this.content + `
... [output truncated - ${truncatedKB}KB removed]`;
  }
  clear() {
    this.content = "";
    this.isTruncated = false;
    this.totalBytesReceived = 0;
  }
  get length() {
    return this.content.length;
  }
  get truncated() {
    return this.isTruncated;
  }
  get totalBytes() {
    return this.totalBytesReceived;
  }
}
function truncateToLines(text, maxLines) {
  const lines = text.split(`
`);
  if (lines.length <= maxLines) {
    return text;
  }
  return lines.slice(0, maxLines).join(`
`) + "\u2026";
}
var MAX_STRING_LENGTH;
var init_stringUtils = __esm(() => {
  MAX_STRING_LENGTH = 2 ** 21;
});

export { escapeRegExp, capitalize, plural, firstLineOf, countCharInString, normalizeFullWidthDigits, normalizeFullWidthSpace, safeJoinLines, EndTruncatingAccumulator, truncateToLines, init_stringUtils };

//# debugId=24BFACCDFB0AA50564756E2164756E21
//# sourceMappingURL=chunk-h7cy00tf.js.map
