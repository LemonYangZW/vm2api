//go:build linux

package worker

import (
	"os"
	"strconv"
	"strings"
)

// rssBytes 读取进程常驻内存（/proc/self/statm 第二列 × 页大小）。
func rssBytes() int64 {
	b, err := os.ReadFile("/proc/self/statm")
	if err != nil {
		return 0
	}
	f := strings.Fields(string(b))
	if len(f) < 2 {
		return 0
	}
	pages, err := strconv.ParseInt(f[1], 10, 64)
	if err != nil {
		return 0
	}
	return pages * int64(os.Getpagesize())
}
