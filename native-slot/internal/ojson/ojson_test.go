package ojson

import "testing"

// 期望形状取自 oracle kin-03 现网 kernel 转发的事件（2026-10-20）：键名排序，
// <>&、U+2028、é 原样输出，控制字符 \u00xx，数字字面量（1e+21）不改写。
func TestMarshalSortedMatchesKernelForwarding(t *testing.T) {
	in := `{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"<a&b> é\u0001\"/","y":1e+21,"big":12345678901234567890}}`
	v, err := Parse([]byte(in))
	if err != nil {
		t.Fatal(err)
	}
	want := `{"delta":{"big":12345678901234567890,"text":"<a&b>` + " é" + `\u0001\"/","type":"text_delta","y":1e+21},"index":0,"type":"content_block_delta"}`
	if got := string(MarshalSorted(v)); got != want {
		t.Fatalf("got  %s\nwant %s", got, want)
	}
}
