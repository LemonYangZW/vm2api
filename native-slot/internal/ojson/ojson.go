// Package ojson 提供保持键顺序的 JSON 值，序列化结果与 JavaScript 的
// JSON.stringify 逐字节一致（cch 摘要依赖这一点）。
package ojson

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"sort"
	"strconv"
	"strings"
	"unicode/utf8"
)

// Object 是保持插入顺序的 JSON 对象。重复键保留首次位置、采用最后的值，
// 与 JSON.parse 的行为一致。
type Object struct {
	keys []string
	vals map[string]any
}

func NewObject() *Object { return &Object{vals: map[string]any{}} }

func (o *Object) Len() int {
	if o == nil {
		return 0
	}
	return len(o.keys)
}

func (o *Object) Keys() []string {
	if o == nil {
		return nil
	}
	return append([]string(nil), o.keys...)
}

func (o *Object) Has(k string) bool {
	if o == nil {
		return false
	}
	_, ok := o.vals[k]
	return ok
}

func (o *Object) Get(k string) any {
	if o == nil {
		return nil
	}
	return o.vals[k]
}

// Set 对已存在的键原位赋值，新键追加到末尾。
func (o *Object) Set(k string, v any) {
	if _, ok := o.vals[k]; !ok {
		o.keys = append(o.keys, k)
	}
	o.vals[k] = v
}

func (o *Object) Delete(k string) {
	if _, ok := o.vals[k]; !ok {
		return
	}
	delete(o.vals, k)
	for i, key := range o.keys {
		if key == k {
			o.keys = append(o.keys[:i], o.keys[i+1:]...)
			break
		}
	}
}

// Clone 深拷贝。
func (o *Object) Clone() *Object {
	if o == nil {
		return nil
	}
	c := &Object{keys: append([]string(nil), o.keys...), vals: make(map[string]any, len(o.vals))}
	for k, v := range o.vals {
		c.vals[k] = CloneValue(v)
	}
	return c
}

func CloneValue(v any) any {
	switch x := v.(type) {
	case *Object:
		return x.Clone()
	case []any:
		out := make([]any, len(x))
		for i := range x {
			out[i] = CloneValue(x[i])
		}
		return out
	default:
		return v
	}
}

func (o *Object) MarshalJSON() ([]byte, error) { return Marshal(o), nil }

func (o *Object) UnmarshalJSON(b []byte) error {
	v, err := Parse(b)
	if err != nil {
		return err
	}
	obj, ok := v.(*Object)
	if !ok {
		return errors.New("json value is not an object")
	}
	*o = *obj
	return nil
}

// Parse 解析任意 JSON 值：对象为 *Object，数组为 []any，数字为 json.Number。
func Parse(b []byte) (any, error) {
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.UseNumber()
	v, err := parseValue(dec)
	if err != nil {
		return nil, err
	}
	if _, err := dec.Token(); err != io.EOF {
		return nil, errors.New("trailing data after JSON value")
	}
	return v, nil
}

// ParseObject 解析并要求顶层为对象。
func ParseObject(b []byte) (*Object, error) {
	v, err := Parse(b)
	if err != nil {
		return nil, err
	}
	o, ok := v.(*Object)
	if !ok {
		return nil, errors.New("json value is not an object")
	}
	return o, nil
}

func parseValue(dec *json.Decoder) (any, error) {
	tok, err := dec.Token()
	if err != nil {
		return nil, err
	}
	return fromToken(dec, tok)
}

func fromToken(dec *json.Decoder, tok json.Token) (any, error) {
	switch t := tok.(type) {
	case json.Delim:
		switch t {
		case '{':
			o := NewObject()
			for dec.More() {
				kt, err := dec.Token()
				if err != nil {
					return nil, err
				}
				k, ok := kt.(string)
				if !ok {
					return nil, errors.New("invalid object key")
				}
				v, err := parseValue(dec)
				if err != nil {
					return nil, err
				}
				o.Set(k, v)
			}
			if _, err := dec.Token(); err != nil {
				return nil, err
			}
			return o, nil
		case '[':
			arr := []any{}
			for dec.More() {
				v, err := parseValue(dec)
				if err != nil {
					return nil, err
				}
				arr = append(arr, v)
			}
			if _, err := dec.Token(); err != nil {
				return nil, err
			}
			return arr, nil
		}
		return nil, fmt.Errorf("unexpected delimiter %v", t)
	default:
		return t, nil
	}
}

// Marshal 按 JSON.stringify 的规则输出紧凑 JSON。
func Marshal(v any) []byte {
	var b bytes.Buffer
	write(&b, v)
	return b.Bytes()
}

func write(b *bytes.Buffer, v any) {
	switch x := v.(type) {
	case nil:
		b.WriteString("null")
	case *Object:
		if x == nil {
			b.WriteString("null")
			return
		}
		b.WriteByte('{')
		for i, k := range x.keys {
			if i > 0 {
				b.WriteByte(',')
			}
			writeString(b, k)
			b.WriteByte(':')
			write(b, x.vals[k])
		}
		b.WriteByte('}')
	case []any:
		b.WriteByte('[')
		for i, e := range x {
			if i > 0 {
				b.WriteByte(',')
			}
			write(b, e)
		}
		b.WriteByte(']')
	case string:
		writeString(b, x)
	case bool:
		if x {
			b.WriteString("true")
		} else {
			b.WriteString("false")
		}
	case json.Number:
		f, err := strconv.ParseFloat(string(x), 64)
		if err != nil {
			b.WriteString("null")
			return
		}
		b.WriteString(FormatNumber(f))
	case float64:
		b.WriteString(FormatNumber(x))
	case int:
		b.WriteString(strconv.Itoa(x))
	case int64:
		b.WriteString(strconv.FormatInt(x, 10))
	case map[string]any:
		// 仅用于程序内构造的小对象，按键序输出不保证稳定，调用方应使用 *Object。
		o := NewObject()
		for k, e := range x {
			o.Set(k, e)
		}
		write(b, o)
	case []string:
		arr := make([]any, len(x))
		for i := range x {
			arr[i] = x[i]
		}
		write(b, arr)
	case json.RawMessage:
		if pv, err := Parse(x); err == nil {
			write(b, pv)
		} else {
			b.WriteString("null")
		}
	default:
		raw, err := json.Marshal(x)
		if err != nil {
			b.WriteString("null")
			return
		}
		pv, err := Parse(raw)
		if err != nil {
			b.WriteString("null")
			return
		}
		write(b, pv)
	}
}

// FormatNumber 复刻 ECMAScript Number::toString。
func FormatNumber(f float64) string {
	if math.IsNaN(f) || math.IsInf(f, 0) {
		return "null"
	}
	if f == 0 {
		return "0"
	}
	abs := math.Abs(f)
	if abs >= 1e-6 && abs < 1e21 {
		return strconv.FormatFloat(f, 'f', -1, 64)
	}
	s := strconv.FormatFloat(f, 'e', -1, 64)
	mant, exp, _ := strings.Cut(s, "e")
	sign := exp[0]
	digits := strings.TrimLeft(exp[1:], "0")
	if digits == "" {
		digits = "0"
	}
	return mant + "e" + string(sign) + digits
}

const hexDigits = "0123456789abcdef"

func writeString(b *bytes.Buffer, s string) {
	b.WriteByte('"')
	for i := 0; i < len(s); {
		c := s[i]
		if c < utf8.RuneSelf {
			switch c {
			case '"':
				b.WriteString(`\"`)
			case '\\':
				b.WriteString(`\\`)
			case '\b':
				b.WriteString(`\b`)
			case '\f':
				b.WriteString(`\f`)
			case '\n':
				b.WriteString(`\n`)
			case '\r':
				b.WriteString(`\r`)
			case '\t':
				b.WriteString(`\t`)
			default:
				if c < 0x20 {
					b.WriteString(`\u00`)
					b.WriteByte(hexDigits[c>>4])
					b.WriteByte(hexDigits[c&0xf])
				} else {
					b.WriteByte(c)
				}
			}
			i++
			continue
		}
		r, size := utf8.DecodeRuneInString(s[i:])
		if r == utf8.RuneError && size == 1 {
			// Go 字符串里的非法 UTF-8 只可能来自解码后的孤立代理项，按 JS 规则转义。
			b.WriteString(`�`)
			i++
			continue
		}
		b.WriteString(s[i : i+size])
		i += size
	}
	b.WriteByte('"')
}

// 便捷访问器。

func Str(v any) string { s, _ := v.(string); return s }

func Obj(v any) *Object { o, _ := v.(*Object); return o }

func Arr(v any) []any { a, _ := v.([]any); return a }

// Num 返回数字值；非数字时 ok 为 false。
func Num(v any) (float64, bool) {
	switch x := v.(type) {
	case json.Number:
		f, err := x.Float64()
		return f, err == nil
	case float64:
		return x, true
	case int:
		return float64(x), true
	case int64:
		return float64(x), true
	}
	return 0, false
}

// Truthy 复刻 JS 的真值判定（用于 `if (body.x)` 一类条件）。
func Truthy(v any) bool {
	switch x := v.(type) {
	case nil:
		return false
	case bool:
		return x
	case string:
		return x != ""
	case json.Number, float64, int, int64:
		f, _ := Num(x)
		return f != 0 && !math.IsNaN(f)
	default:
		return true
	}
}

// MarshalSorted 按现网 kernel 转发事件的形状输出：对象键递归按字节序排序，数字
// 字面量原样保留，字符串转义规则同 Marshal（不转义 HTML 与 U+2028/2029）。
func MarshalSorted(v any) []byte {
	var b bytes.Buffer
	writeSorted(&b, v)
	return b.Bytes()
}

func writeSorted(b *bytes.Buffer, v any) {
	switch x := v.(type) {
	case *Object:
		if x == nil {
			b.WriteString("null")
			return
		}
		keys := append([]string(nil), x.keys...)
		sort.Strings(keys)
		b.WriteByte('{')
		for i, k := range keys {
			if i > 0 {
				b.WriteByte(',')
			}
			writeString(b, k)
			b.WriteByte(':')
			writeSorted(b, x.vals[k])
		}
		b.WriteByte('}')
	case []any:
		b.WriteByte('[')
		for i, e := range x {
			if i > 0 {
				b.WriteByte(',')
			}
			writeSorted(b, e)
		}
		b.WriteByte(']')
	case json.Number:
		b.WriteString(string(x))
	default:
		write(b, v)
	}
}
