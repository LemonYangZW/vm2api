package api

import (
	"encoding/json"
	"sync"
	"time"

	"vm2api/native-slot/internal/messages"
)

// pending 记录一次以 tool_use 结束、等待工具结果的会话。
type pending struct {
	token   string
	toolIDs map[string]bool
	expires time.Time
}

// continuations 实现 x-continuation 的续接校验（05 5.2.7）。
type continuations struct {
	mu   sync.Mutex
	ttl  time.Duration
	byID map[string]*pending
}

func newContinuations(ttl time.Duration) *continuations {
	return &continuations{ttl: ttl, byID: map[string]*pending{}}
}

// issue 为本次响应预先生成续接令牌。
func (c *continuations) issue() string { return "cont_" + messages.NewUUID() }

// record 在响应以 tool_use 结束时登记待处理调用；否则清除会话的等待状态。
func (c *continuations) record(session, token string, msg map[string]any) {
	c.mu.Lock()
	defer c.mu.Unlock()
	now := time.Now()
	for k, p := range c.byID {
		if now.After(p.expires.Add(c.ttl)) {
			delete(c.byID, k)
		}
	}
	if msg == nil || msg["stop_reason"] != "tool_use" {
		delete(c.byID, session)
		return
	}
	ids := map[string]bool{}
	blocks, _ := msg["content"].([]any)
	for _, b := range blocks {
		bm, _ := b.(map[string]any)
		if bm["type"] == "tool_use" {
			if id, _ := bm["id"].(string); id != "" {
				ids[id] = true
			}
		}
	}
	if len(ids) == 0 {
		delete(c.byID, session)
		return
	}
	c.byID[session] = &pending{token: token, toolIDs: ids, expires: now.Add(c.ttl)}
}

// check 校验续接请求：最后一条 user 消息的 tool_result 必须一一对应待处理调用。
func (c *continuations) check(session, token string, body map[string]any, limit int64) *Error {
	bad := func(msg string) *Error { return newErr(400, "invalid_request", "invalid_request_error", msg) }
	c.mu.Lock()
	p := c.byID[session]
	c.mu.Unlock()
	if p == nil {
		return bad("session is not waiting for a tool result")
	}
	if time.Now().After(p.expires) {
		c.mu.Lock()
		delete(c.byID, session)
		c.mu.Unlock()
		return bad("continuation has expired")
	}
	if p.token != token {
		return bad("continuation token does not match")
	}
	if raw, _ := json.Marshal(body["messages"]); int64(len(raw)) > limit {
		return bad("continuation transcript exceeds the configured session limit")
	}
	msgs, _ := body["messages"].([]any)
	var last map[string]any
	if len(msgs) > 0 {
		last, _ = msgs[len(msgs)-1].(map[string]any)
	}
	seen := map[string]bool{}
	blocks, _ := last["content"].([]any)
	for _, b := range blocks {
		bm, _ := b.(map[string]any)
		if bm["type"] != "tool_result" {
			continue
		}
		id, _ := bm["tool_use_id"].(string)
		if seen[id] {
			return bad("duplicate tool_result ids are not allowed")
		}
		seen[id] = true
	}
	if len(seen) == 0 {
		return bad("session is not waiting for a tool result")
	}
	if len(seen) != len(p.toolIDs) {
		return bad("tool_result ids do not match the pending tool calls")
	}
	for id := range seen {
		if !p.toolIDs[id] {
			return bad("tool_result ids do not match the pending tool calls")
		}
	}
	return nil
}
