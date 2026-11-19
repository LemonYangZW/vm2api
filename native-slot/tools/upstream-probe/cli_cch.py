"""独立复算计费头摘要；不依赖可选 JS 参考或第三方哈希包。"""

import re

MASK = (1 << 64) - 1
P1, P2, P3, P4, P5 = (0x9E3779B185EBCA87, 0xC2B2AE3D27D4EB4F, 0x165667B19E3779F9,
                       0x85EBCA77C2B2AE63, 0x27D4EB2F165667C5)
SEED = 0x4D659218E32A3268
CCH_RE = re.compile(r'(x-anthropic-billing-header:[^"]*?\bcch=)([0-9a-f]{5})(;)', re.I)


def strip_json_whitespace(body):
    """仅删除字符串外的 JSON 空白，保留键序、数字字面量与转义形式。"""
    result, in_string, escaped = [], False, False
    for char in body:
        if in_string:
            result.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
        elif char == '"':
            result.append(char)
            in_string = True
        elif char not in " \r\n\t":
            result.append(char)
    return "".join(result)


def rol(value, count):
    value &= MASK
    return ((value << count) | (value >> (64 - count))) & MASK


def round64(accumulator, value):
    return (rol(accumulator + value * P2, 31) * P1) & MASK


def merge(accumulator, value):
    return ((accumulator ^ round64(0, value)) * P1 + P4) & MASK


def xxh64(data, seed=SEED):
    size, index = len(data), 0
    def number(start, length):
        return int.from_bytes(data[start:start + length], "little")
    if size >= 32:
        values = [(seed + P1 + P2) & MASK, (seed + P2) & MASK, seed & MASK, (seed - P1) & MASK]
        while index <= size - 32:
            values = [round64(value, number(index + offset * 8, 8)) for offset, value in enumerate(values)]
            index += 32
        digest = sum(rol(value, shift) for value, shift in zip(values, (1, 7, 12, 18))) & MASK
        for value in values:
            digest = merge(digest, value)
    else:
        digest = (seed + P5) & MASK
    digest = (digest + size) & MASK
    while index + 8 <= size:
        digest = (rol(digest ^ round64(0, number(index, 8)), 27) * P1 + P4) & MASK
        index += 8
    if index + 4 <= size:
        digest = (rol(digest ^ ((number(index, 4) * P1) & MASK), 23) * P2 + P3) & MASK
        index += 4
    while index < size:
        digest = (rol(digest ^ ((data[index] * P5) & MASK), 11) * P1) & MASK
        index += 1
    digest ^= digest >> 33
    digest = (digest * P2) & MASK
    digest ^= digest >> 29
    digest = (digest * P3) & MASK
    digest ^= digest >> 32
    return digest & MASK


def cut(text, start, end):
    if end < len(text) and text[end] == ",":
        end += 1
    elif start > 0 and text[start - 1] == ",":
        start -= 1
    return text[:start] + text[end:]


def project(body):
    body = CCH_RE.sub(lambda match: match[1] + "00000;", body, count=1)
    body = re.sub(r'("model":")(?:\\.|[^"\\])*"', r'\1"', body)
    start = body.find('"fallbacks":[')
    if start >= 0:
        depth, in_string, escaped = 0, False, False
        for index in range(start + len('"fallbacks":'), len(body)):
            char = body[index]
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
            elif char == '"':
                in_string = True
            elif char == "[":
                depth += 1
            elif char == "]":
                depth -= 1
                if depth == 0:
                    body = cut(body, start, index + 1)
                    break
    credit = re.search(r'"fallback_credit_token":"(?:\\.|[^"\\])*"', body)
    if credit:
        body = cut(body, credit.start(), credit.end())
    max_tokens = re.search(r'"max_tokens":[0-9]+', body)
    if max_tokens:
        body = cut(body, max_tokens.start(), max_tokens.end())
    return body


def verify(body):
    match = CCH_RE.search(body)
    if match is None:
        if "x-anthropic-billing-header:" in body:
            return {"present": True, "valid": False, "actual": "missing-or-malformed", "expected": "five hexadecimal digits"}
        return {"present": False, "valid": True}
    expected = format(xxh64(project(body).encode("utf-8")) & 0xFFFFF, "05x")
    return {"present": True, "valid": match[2].lower() == expected,
            "actual": match[2].lower(), "expected": expected}


def normalize_verified(body, original):
    evidence = verify(original)
    if evidence["present"] and evidence["valid"]:
        # 原始正文已独立复算通过；这里只消除动态 prompt UUID 对摘要的合法影响。
        return CCH_RE.sub(lambda match: match[1] + "<VERIFIED_CCH>;", body, count=1)
    return body
