//go:build !linux

package worker

func rssBytes() int64 { return 0 }
