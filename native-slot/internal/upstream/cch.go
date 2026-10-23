package upstream

import (
	"encoding/binary"
	"fmt"
	"math/bits"
	"regexp"
	"strings"

	"vm2api/native-slot/internal/ojson"
)

const (
	cchSeed uint64 = 0x4d659218e32a3268
	p1      uint64 = 0x9e3779b185ebca87
	p2      uint64 = 0xc2b2ae3d27d4eb4f
	p3      uint64 = 0x165667b19e3779f9
	p4      uint64 = 0x85ebca77c2b2ae63
	p5      uint64 = 0x27d4eb2f165667c5
)

func xxRound(acc, input uint64) uint64 {
	acc += input * p2
	return bits.RotateLeft64(acc, 31) * p1
}

func xxMerge(acc, val uint64) uint64 { return (acc^xxRound(0, val))*p1 + p4 }

// xxh64 是标准 XXH64。
func xxh64(data []byte, seed uint64) uint64 {
	n := len(data)
	i := 0
	var h uint64
	if n >= 32 {
		v1 := seed + p1 + p2
		v2 := seed + p2
		v3 := seed
		v4 := seed - p1
		for ; i <= n-32; i += 32 {
			v1 = xxRound(v1, binary.LittleEndian.Uint64(data[i:]))
			v2 = xxRound(v2, binary.LittleEndian.Uint64(data[i+8:]))
			v3 = xxRound(v3, binary.LittleEndian.Uint64(data[i+16:]))
			v4 = xxRound(v4, binary.LittleEndian.Uint64(data[i+24:]))
		}
		h = bits.RotateLeft64(v1, 1) + bits.RotateLeft64(v2, 7) + bits.RotateLeft64(v3, 12) + bits.RotateLeft64(v4, 18)
		h = xxMerge(h, v1)
		h = xxMerge(h, v2)
		h = xxMerge(h, v3)
		h = xxMerge(h, v4)
	} else {
		h = seed + p5
	}
	h += uint64(n)
	for ; i+8 <= n; i += 8 {
		h = bits.RotateLeft64(h^xxRound(0, binary.LittleEndian.Uint64(data[i:])), 27)*p1 + p4
	}
	if i+4 <= n {
		h = bits.RotateLeft64(h^uint64(binary.LittleEndian.Uint32(data[i:]))*p1, 23)*p2 + p3
		i += 4
	}
	for ; i < n; i++ {
		h = bits.RotateLeft64(h^uint64(data[i])*p5, 11) * p1
	}
	h ^= h >> 33
	h *= p2
	h ^= h >> 29
	h *= p3
	h ^= h >> 32
	return h
}

// cut 删除 [start,end) 并吞掉一侧的逗号。
func cut(s string, start, end int) string {
	if end < len(s) && s[end] == ',' {
		end++
	} else if start > 0 && s[start-1] == ',' {
		start--
	}
	return s[:start] + s[end:]
}

func blankStringModels(s string) string {
	const needle = `"model":"`
	var out strings.Builder
	i := 0
	for {
		j := strings.Index(s[i:], needle)
		if j < 0 {
			out.WriteString(s[i:])
			break
		}
		j += i
		k := j + len(needle)
		for k < len(s) {
			if s[k] == '\\' && k+1 < len(s) {
				k += 2
				continue
			}
			if s[k] == '"' {
				break
			}
			k++
		}
		out.WriteString(s[i : j+len(needle)])
		i = k
		if i > len(s) {
			i = len(s)
		}
	}
	return out.String()
}

func skipFallbacks(s string) string {
	const needle = `"fallbacks":[`
	j := strings.Index(s, needle)
	if j < 0 {
		return s
	}
	depth, inStr, esc := 0, false, false
	for i := j + len(needle) - 1; i < len(s); i++ {
		c := s[i]
		switch {
		case inStr:
			if esc {
				esc = false
			} else if c == '\\' {
				esc = true
			} else if c == '"' {
				inStr = false
			}
		case c == '"':
			inStr = true
		case c == '[':
			depth++
		case c == ']':
			depth--
			if depth == 0 {
				return cut(s, j, i+1)
			}
		}
	}
	return s
}

func skipCredit(s string) string {
	const needle = `"fallback_credit_token":"`
	j := strings.Index(s, needle)
	if j < 0 {
		return s
	}
	for k := j + len(needle); k < len(s); k++ {
		if s[k] == '\\' && k+1 < len(s) {
			k++
			continue
		}
		if s[k] == '"' {
			return cut(s, j, k+1)
		}
	}
	return s
}

func skipMaxTokens(s string) string {
	const needle = `"max_tokens":`
	j := strings.Index(s, needle)
	if j < 0 {
		return s
	}
	k := j + len(needle)
	if k >= len(s) || s[k] < '0' || s[k] > '9' {
		return s
	}
	for k < len(s) && s[k] >= '0' && s[k] <= '9' {
		k++
	}
	return cut(s, j, k)
}

// canonicalCchRe 只匹配 system 计费头块文本开头的 cch 值：锚定块起始、限制在
// 同一行（[^\r\n]）、且必须是 5 位十六进制后紧跟分号。与现网 cli-node
// src/utils/cch.ts 的 setSystemCch 一致，messages 与后续 system 示例不再命中。
var canonicalCchRe = regexp.MustCompile(`(?i)^\s*x-anthropic-billing-header:[^\r\n]*?\bcch=[0-9a-f]{5};`)

// setSystemCch 就地替换 body.system（字符串或 [{text}]）里第一个 canonical
// 计费头的 cch 值，返回是否命中。
func setSystemCch(body *ojson.Object, value string) bool {
	if body == nil {
		return false
	}
	switch sys := body.Get("system").(type) {
	case string:
		out, ok := replaceCanonicalCch(sys, value)
		if !ok {
			return false
		}
		body.Set("system", out)
		return true
	case []any:
		for _, item := range sys {
			block := ojson.Obj(item)
			if block == nil {
				continue
			}
			text, ok := block.Get("text").(string)
			if !ok {
				continue
			}
			out, ok := replaceCanonicalCch(text, value)
			if !ok {
				continue
			}
			block.Set("text", out)
			return true
		}
	}
	return false
}

func replaceCanonicalCch(text, value string) (string, bool) {
	loc := canonicalCchRe.FindStringIndex(text)
	if loc == nil {
		return text, false
	}
	end := loc[1] - 1 // 分号位置
	start := end - 5  // cch 值的 5 位十六进制
	return text[:start] + value + text[end:], true
}

// projectForCch：把 canonical system 计费头的 cch 归零后取紧凑 JSON，再裁掉
// max_tokens、fallbacks、fallback_credit_token 与所有 model 值。
func projectForCch(body string) string {
	if v, err := ojson.ParseObject([]byte(body)); err == nil {
		setSystemCch(v, "00000")
		body = string(ojson.Marshal(v))
	}
	return skipMaxTokens(skipCredit(skipFallbacks(blankStringModels(body))))
}

func computeCch(body string) string {
	d := xxh64([]byte(projectForCch(body)), cchSeed)
	return fmt.Sprintf("%05x", d&0xfffff)
}

// StampCch 用「canonical system 计费头所在请求体」的摘要填充 cch。找不到该头
// 时原样返回 body：messages、工具结果与后续 system 里的计费示例属于历史内容，
// 改写它们会让上轮的 prompt-cache 前缀失效。body 必须已是紧凑 JSON。
func StampCch(body string, enabled bool) string {
	if !enabled {
		return body
	}
	v, err := ojson.ParseObject([]byte(body))
	if err != nil || !setSystemCch(v, "00000") {
		return body
	}
	compact := string(ojson.Marshal(v))
	setSystemCch(v, computeCch(compact))
	return string(ojson.Marshal(v))
}
