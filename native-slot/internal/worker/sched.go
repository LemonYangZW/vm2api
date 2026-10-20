package worker

import (
	"time"
)

// stickyPin 是会话到槽位的粘滞记录。
type stickyPin struct {
	slot     string
	lastUsed time.Time
}

// slotScheduler 实现 05 5.5.3：就绪队列 + LRU 选择 + 会话粘滞。调用方持锁。
type slotScheduler struct {
	ready     []string
	lastUsed  map[string]time.Time
	sticky    map[string]stickyPin
	stickyTTL time.Duration
	isReady   func(id string) bool
}

func newSlotScheduler(stickyTTL time.Duration, isReady func(string) bool) *slotScheduler {
	return &slotScheduler{lastUsed: map[string]time.Time{}, sticky: map[string]stickyPin{},
		stickyTTL: stickyTTL, isReady: isReady}
}

func (s *slotScheduler) pruneExpired(now time.Time) {
	for k, pin := range s.sticky {
		if now.Sub(pin.lastUsed) >= s.stickyTTL {
			delete(s.sticky, k)
		}
	}
}

// enqueueReady 去重后入队。
func (s *slotScheduler) enqueueReady(id string) {
	for _, v := range s.ready {
		if v == id {
			return
		}
	}
	s.ready = append(s.ready, id)
}

func (s *slotScheduler) remove(id string) {
	for i, v := range s.ready {
		if v == id {
			s.ready = append(s.ready[:i], s.ready[i+1:]...)
			return
		}
	}
}

func (s *slotScheduler) reset() { s.ready = nil }

// forgetSession 清理指向该槽位的粘滞记录。
func (s *slotScheduler) forgetSlot(id string) {
	for k, pin := range s.sticky {
		if pin.slot == id {
			delete(s.sticky, k)
		}
	}
}

// pick 选择槽位：指定槽位 → 粘滞槽位 → (从未使用优先, 最久未用, 队列下标) 最小者。
func (s *slotScheduler) pick(preferred, key string, now time.Time) string {
	s.pruneExpired(now)
	usable := func(id string) bool {
		for _, v := range s.ready {
			if v == id {
				return s.isReady(id)
			}
		}
		return false
	}
	chosen := ""
	if preferred != "" && usable(preferred) {
		chosen = preferred
	}
	if chosen == "" && key != "" {
		if pin, ok := s.sticky[key]; ok && usable(pin.slot) {
			chosen = pin.slot
		}
	}
	if chosen == "" {
		bestIdx := -1
		var bestTime time.Time
		bestUsed := false
		for i, id := range s.ready {
			if !s.isReady(id) {
				continue
			}
			t, used := s.lastUsed[id]
			better := false
			switch {
			case bestIdx < 0:
				better = true
			case !used && bestUsed:
				better = true
			case used && bestUsed && t.Before(bestTime):
				better = true
			}
			if better {
				bestIdx, bestTime, bestUsed = i, t, used
			}
		}
		if bestIdx < 0 {
			return ""
		}
		chosen = s.ready[bestIdx]
	}
	s.remove(chosen)
	s.lastUsed[chosen] = now
	if key != "" {
		s.sticky[key] = stickyPin{slot: chosen, lastUsed: now}
	}
	return chosen
}
