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

var (
	cchResetRe = regexp.MustCompile(`(?i)(x-anthropic-billing-header:[^"]*?\bcch=)[0-9a-f]{5};`)
	cchSlotRe  = regexp.MustCompile(`(?i)(x-anthropic-billing-header:[^"]*?\bcch=)00000;`)
)

func projectForCch(body string) string {
	reset := replaceFirst(cchResetRe, body, "${1}00000;")
	return skipMaxTokens(skipCredit(skipFallbacks(blankStringModels(reset))))
}

func computeCch(body string) string {
	d := xxh64([]byte(projectForCch(body)), cchSeed)
	return fmt.Sprintf("%05x", d&0xfffff)
}

// StampCch 把计费头里的 cch=00000 占位替换为请求体摘要。body 必须已是
// JSON.stringify 形态的紧凑 JSON。
func StampCch(body string, enabled bool) string {
	if !enabled || !cchSlotRe.MatchString(body) {
		return body
	}
	if v, err := ojson.Parse([]byte(body)); err == nil {
		body = string(ojson.Marshal(v))
	}
	sum := computeCch(body)
	return replaceFirst(cchSlotRe, body, "${1}"+sum+";")
}

func replaceFirst(re *regexp.Regexp, s, repl string) string {
	loc := re.FindStringSubmatchIndex(s)
	if loc == nil {
		return s
	}
	var dst []byte
	dst = re.ExpandString(dst, repl, s, loc)
	return s[:loc[0]] + string(dst) + s[loc[1]:]
}
