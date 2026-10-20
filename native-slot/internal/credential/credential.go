// Package credential 读取凭据文件并给出认证头与刷新判定（06 6.4）。
// 本包只读不刷新：刷新由控制面 worker 唯一负责。
package credential

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Credential 是凭据文件中与推理相关的视图。
type Credential struct {
	Type         string // 只做 trim 的类型字面量
	Token        string
	RefreshToken string
	ExpiresAt    int64 // 毫秒；0 表示未知
	Scopes       []string
	HasScopes    bool
	AccountUUID  string
	Email        string
	OrgUUID      string
	Generation   int64
}

type oauthBlock struct {
	AccessToken  any      `json:"accessToken"`
	RefreshToken any      `json:"refreshToken"`
	ExpiresAt    any      `json:"expiresAt"`
	Scopes       []string `json:"scopes"`
	Type         any      `json:"type"`
	AccountUUID  any      `json:"accountUuid"`
	Email        any      `json:"email"`
	OrgUUID      any      `json:"orgUuid"`
	Generation   any      `json:"kinGeneration"`
	TokenAccount *struct {
		UUID             string `json:"uuid"`
		EmailAddress     string `json:"emailAddress"`
		OrganizationUUID string `json:"organizationUuid"`
	} `json:"tokenAccount"`
}

type file struct {
	Type            any         `json:"type"`
	ClaudeAiOauth   *oauthBlock `json:"claudeAiOauth"`
	AnthropicAPIKey *struct {
		APIKey any `json:"apiKey"`
	} `json:"anthropicApiKey"`
	AccessToken any `json:"accessToken"`
	APIKey      any `json:"apiKey"`
	Generation  any `json:"kinGeneration"`
}

func firstString(vals ...any) string {
	for _, v := range vals {
		if s, ok := v.(string); ok && strings.TrimSpace(s) != "" {
			return strings.TrimSpace(s)
		}
	}
	return ""
}

func number(v any) int64 {
	switch x := v.(type) {
	case float64:
		return int64(x)
	case string:
		var n int64
		_, _ = fmt.Sscan(x, &n)
		return n
	}
	return 0
}

// Load 每次调用都从磁盘重读。
func Load(path string) (*Credential, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read credentials: %w", err)
	}
	return Parse(b)
}

// Parse 解析凭据 JSON。
func Parse(b []byte) (*Credential, error) {
	var f file
	if err := json.Unmarshal(b, &f); err != nil {
		return nil, fmt.Errorf("decode credentials: %w", err)
	}
	c := &Credential{Generation: number(f.Generation)}
	if o := f.ClaudeAiOauth; o != nil {
		c.Token = firstString(o.AccessToken)
		c.RefreshToken = firstString(o.RefreshToken)
		c.ExpiresAt = number(o.ExpiresAt)
		c.Scopes = o.Scopes
		c.HasScopes = o.Scopes != nil
		c.AccountUUID = firstString(o.AccountUUID)
		c.Email = firstString(o.Email)
		c.OrgUUID = firstString(o.OrgUUID)
		if g := number(o.Generation); g != 0 {
			c.Generation = g
		}
		if o.TokenAccount != nil {
			c.AccountUUID = firstString(c.AccountUUID, o.TokenAccount.UUID)
			c.Email = firstString(c.Email, o.TokenAccount.EmailAddress)
			c.OrgUUID = firstString(c.OrgUUID, o.TokenAccount.OrganizationUUID)
		}
		c.Type = firstString(f.Type, o.Type)
		if c.Type == "" {
			c.Type = "oauth"
		}
	}
	if c.Token == "" && f.AnthropicAPIKey != nil {
		c.Token = firstString(f.AnthropicAPIKey.APIKey)
		c.Type = firstString(f.Type)
		if c.Type == "" {
			c.Type = "apikey"
		}
	}
	if c.Token == "" {
		c.Token = firstString(f.AccessToken, f.APIKey)
		c.Type = firstString(f.Type)
		if c.Type == "" {
			if firstString(f.APIKey) != "" {
				c.Type = "apikey"
			} else {
				c.Type = "oauth"
			}
		}
	}
	if c.Token == "" {
		return nil, errors.New("credential contains no access token")
	}
	return c, nil
}

// IsAPIKey 只认字面量 apikey（内核规则：归一化仅 trim）。
func (c *Credential) IsAPIKey() bool { return strings.TrimSpace(c.Type) == "apikey" }

// Bearer 为真时使用 Authorization: Bearer。
func (c *Credential) Bearer() bool { return !c.IsAPIKey() }

// NeedsRefresh 是内核侧判定：apikey 与无过期时间都不需要刷新。
func (c *Credential) NeedsRefresh(skew time.Duration, now time.Time) bool {
	if c.IsAPIKey() || c.ExpiresAt <= 0 {
		return false
	}
	return c.ExpiresAt-skew.Milliseconds() <= now.UnixMilli()
}

// HasScope 判断 scope 是否存在。
func (c *Credential) HasScope(s string) bool {
	for _, v := range c.Scopes {
		if v == s {
			return true
		}
	}
	return false
}

// Subscriber 对应 isClaudeAISubscriber：OAuth 且具有 user:inference。
func (c *Credential) Subscriber() bool { return c.Bearer() && c.HasScope("user:inference") }

// Apply 写入认证头。
func (c *Credential) Apply(set func(k, v string)) {
	if c.Bearer() {
		set("Authorization", "Bearer "+c.Token)
	} else {
		set("x-api-key", c.Token)
	}
}

// WriteFileAtomic 写入 0600 文件；目标是符号链接时写其指向的真实文件。
func WriteFileAtomic(path string, data []byte) error {
	if real, err := filepath.EvalSymlinks(path); err == nil {
		path = real
	}
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(dir, ".credentials-*.tmp")
	if err != nil {
		return err
	}
	name := tmp.Name()
	defer os.Remove(name)
	if _, err = tmp.Write(data); err == nil {
		err = tmp.Sync()
	}
	if cerr := tmp.Close(); err == nil {
		err = cerr
	}
	if err != nil {
		return err
	}
	if err = os.Chmod(name, 0o600); err != nil {
		return err
	}
	return os.Rename(name, path)
}
