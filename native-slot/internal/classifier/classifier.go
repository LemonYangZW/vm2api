// Package classifier 校验 auto_mode_classifier 请求上下文（02 2.3.1）。
package classifier

import (
	"strings"

	"vm2api/native-slot/internal/ojson"
)

// Valid 复刻 classifierRequest.validClassifierContext。
func Valid(rc, request *ojson.Object) bool {
	if rc == nil {
		return false
	}
	for _, k := range rc.Keys() {
		if k != "purpose" && k != "format" && k != "stage" {
			return false
		}
	}
	if ojson.Str(rc.Get("purpose")) != "auto_mode_classifier" {
		return false
	}
	switch ojson.Str(rc.Get("format")) {
	case "tool":
		choice := ojson.Obj(request.Get("tool_choice"))
		if rc.Has("stage") || ojson.Str(choice.Get("type")) != "tool" || ojson.Str(choice.Get("name")) != "classify_result" {
			return false
		}
		for _, t := range ojson.Arr(request.Get("tools")) {
			if ojson.Str(ojson.Obj(t).Get("name")) == "classify_result" {
				return true
			}
		}
		return false
	case "xml":
		if rc.Has("stage") {
			switch st := rc.Get("stage").(type) {
			case string:
				if st != "xml_s1" && st != "xml_s2" && st != "fast" {
					return false
				}
			default:
				return false
			}
		}
		if request.Has("tool_choice") {
			return false
		}
		return strings.Contains(string(ojson.Marshal(request.Get("messages"))), "<transcript>")
	}
	return false
}
