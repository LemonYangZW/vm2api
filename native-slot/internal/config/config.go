// Package config 加载并校验内核配置（06_CONFIG_AND_CREDENTIALS）。
package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const (
	DefaultPath       = "/run/guest/kernel.json"
	DefaultCLIVersion = "2.1.296"
	FallbackTimezone  = "America/New_York"
	MaxSlots          = 20
)

// Config 对应 WorkerConfig 的 27 个字段，另带控制面写入的附加字段。
type Config struct {
	VMID                    string `json:"vm_id"`
	SocketPath              string `json:"socket_path"`
	CredentialPath          string `json:"credential_path"`
	ProxyURL                string `json:"proxy_url"`
	ProxyRequired           bool   `json:"proxy_required"`
	AnthropicBaseURL        string `json:"anthropic_base_url"`
	OAuthTokenURL           string `json:"oauth_token_url"`
	InternalToken           string `json:"internal_token"`
	RefreshSkewSeconds      *int64 `json:"refresh_skew_seconds"`
	RequestTimeoutSeconds   *int64 `json:"request_timeout_seconds"`
	FirstByteTimeoutSeconds *int64 `json:"first_byte_timeout_seconds"`
	IdleTimeoutSeconds      *int64 `json:"idle_timeout_seconds"`
	MaxRequestBytes         *int64 `json:"max_request_bytes"`
	MaxResponseBytes        *int64 `json:"max_response_bytes"`
	MaxEventBytes           *int64 `json:"max_event_bytes"`
	DeliveryMode            string `json:"delivery_mode"`
	TestEndpoints           bool   `json:"test_endpoints"`
	RuntimeKind             string `json:"runtime_kind"`
	Provider                string `json:"provider"`
	ClaudeBin               string `json:"claude_bin"`
	SlotsPerWorker          *int64 `json:"slots_per_worker"`
	HTTPSProxy              string `json:"https_proxy"`
	SystemLayout            string `json:"system_layout"`
	Timezone                string `json:"timezone"`
	CLIVersion              string `json:"cli_version"`
	DefaultCacheTTL         string `json:"default_cache_ttl"`
	SessionIdleTTLSeconds   *int64 `json:"session_idle_ttl_seconds"`
	Dataplane               string `json:"dataplane"`

	// 附加字段：控制面会写，内核只透传或忽略。
	WorkerCount *int64 `json:"worker_count,omitempty"`
	CchEnabled  *bool  `json:"cch_enabled,omitempty"`

	// 以下由 Load 计算，不参与反序列化。
	Path string `json:"-"`
}

// Resolved 是校验并填充默认值后的只读视图。
type Resolved struct {
	Config
	RefreshSkew      time.Duration
	RequestTimeout   time.Duration // 0 表示不限制
	FirstByteTimeout time.Duration
	IdleTimeout      time.Duration
	MaxRequest       int64
	MaxResponse      int64
	MaxEvent         int64
	Slots            int
	SessionIdleTTL   time.Duration
	TZ               string // 期望时区（下发给宿主并用于握手校验）
}

// PathFromArgs 按 --config > KERNEL_CONFIG > 默认路径选择配置文件。
func PathFromArgs(flagValue string) string {
	if flagValue != "" {
		return flagValue
	}
	if v := os.Getenv("KERNEL_CONFIG"); v != "" {
		return v
	}
	return DefaultPath
}

// Load 读取并校验配置。
func Load(path string) (*Resolved, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}
	var c Config
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, fmt.Errorf("decode config: %w", err)
	}
	abs, err := filepath.Abs(path)
	if err == nil {
		path = abs
	}
	c.Path = path
	return Resolve(c)
}

func positive(name string, v *int64, def int64) (int64, error) {
	if v == nil {
		return def, nil
	}
	if *v == 0 {
		return 0, fmt.Errorf("%s cannot be set to 0", name)
	}
	if *v < 0 {
		return 0, fmt.Errorf("%s must be positive", name)
	}
	return *v, nil
}

func isLoopbackHost(host string) bool {
	if strings.EqualFold(host, "localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

// Resolve 应用环境变量覆盖、默认值与范围校验。
func Resolve(c Config) (*Resolved, error) {
	if p := os.Getenv("PROVIDER"); p != "" {
		if p != "anthropic_api" && p != "local_cli" && p != "mock" {
			return nil, fmt.Errorf("unsupported PROVIDER: %s", p)
		}
		c.Provider = p
	}
	if s := os.Getenv("SLOTS_PER_WORKER"); s != "" {
		n, err := strconv.ParseInt(s, 10, 64)
		if err != nil {
			return nil, errors.New("slots_per_worker must be positive")
		}
		if n > MaxSlots {
			return nil, errors.New("Claude official subagent cap is 20; SLOTS_PER_WORKER must be <= 20")
		}
		c.SlotsPerWorker = &n
	}
	if v := os.Getenv("CLAUDE_BIN"); v != "" && c.ClaudeBin == "" {
		c.ClaudeBin = v
	}
	if strings.TrimSpace(c.VMID) == "" {
		return nil, errors.New("vm_id is required")
	}
	if strings.TrimSpace(c.InternalToken) == "" {
		return nil, errors.New("internal_token is required")
	}
	if c.SocketPath == "" {
		c.SocketPath = "/run/guest/worker.sock"
	}
	if !filepath.IsAbs(c.SocketPath) && !strings.HasPrefix(c.SocketPath, "/") {
		return nil, errors.New("socket_path must be absolute")
	}
	if c.CredentialPath == "" {
		c.CredentialPath = "/home/guest/.claude/credentials.json"
	}
	if !strings.HasPrefix(c.CredentialPath, "/") && !filepath.IsAbs(c.CredentialPath) {
		return nil, errors.New("credential_path must be absolute")
	}
	if c.ProxyRequired && c.ProxyURL == "" {
		return nil, errors.New("proxy_required but proxy_url is empty")
	}
	if c.ProxyURL != "" {
		u, err := url.Parse(c.ProxyURL)
		if err != nil || (u.Scheme != "socks5" && u.Scheme != "socks5h") {
			return nil, fmt.Errorf("proxy_url scheme must be socks5 or socks5h, got %q", c.ProxyURL)
		}
	}
	if c.HTTPSProxy != "" {
		u, err := url.Parse(c.HTTPSProxy)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
			return nil, fmt.Errorf("https_proxy scheme must be http or https, got %q", c.HTTPSProxy)
		}
		if !isLoopbackHost(u.Hostname()) {
			return nil, errors.New("https_proxy host must be loopback")
		}
	}
	if c.AnthropicBaseURL == "" {
		c.AnthropicBaseURL = "https://api.anthropic.com"
	}
	if err := checkEndpoint(c.AnthropicBaseURL, true); err != nil {
		return nil, err
	}
	if c.OAuthTokenURL == "" {
		c.OAuthTokenURL = "https://platform.claude.com/v1/oauth/token"
	}
	if err := checkEndpoint(c.OAuthTokenURL, false); err != nil {
		return nil, err
	}
	if c.Provider == "" {
		c.Provider = "local_cli"
	}
	if c.Provider != "anthropic_api" && c.Provider != "local_cli" && c.Provider != "mock" {
		return nil, fmt.Errorf("provider must be anthropic_api or local_cli, got %q", c.Provider)
	}
	if c.DeliveryMode == "" {
		c.DeliveryMode = "realtime"
	}
	if c.DeliveryMode != "realtime" && c.DeliveryMode != "verified" {
		return nil, fmt.Errorf("delivery_mode must be realtime or verified, got %q", c.DeliveryMode)
	}
	if c.DefaultCacheTTL == "" {
		c.DefaultCacheTTL = "1h"
	}
	if c.DefaultCacheTTL != "5m" && c.DefaultCacheTTL != "1h" {
		return nil, fmt.Errorf("default_cache_ttl must be 5m or 1h, got %q", c.DefaultCacheTTL)
	}
	if c.SystemLayout == "" {
		c.SystemLayout = "zero"
	}
	if c.SystemLayout != "zero" && c.SystemLayout != "identity" {
		return nil, fmt.Errorf("system_layout must be zero or identity, got %q", c.SystemLayout)
	}
	if c.CLIVersion == "" {
		c.CLIVersion = DefaultCLIVersion
	}
	if c.WorkerCount != nil && *c.WorkerCount <= 0 {
		return nil, errors.New("worker_count must be positive")
	}
	if c.Dataplane == "" {
		if v := os.Getenv("KIN_DATAPLANE"); v != "" {
			c.Dataplane = v
		}
	}
	c.Dataplane = strings.ToLower(strings.TrimSpace(c.Dataplane))
	r := &Resolved{Config: c}
	var err error
	slots := int64(MaxSlots)
	if c.SlotsPerWorker != nil {
		if *c.SlotsPerWorker <= 0 {
			return nil, errors.New("slots_per_worker must be positive")
		}
		if *c.SlotsPerWorker > MaxSlots {
			return nil, errors.New("slots_per_worker must be 1..=20")
		}
		slots = *c.SlotsPerWorker
	}
	r.Slots = int(slots)
	ttl := int64(600)
	if c.SessionIdleTTLSeconds != nil {
		ttl = *c.SessionIdleTTLSeconds
		if ttl < 1 || ttl > 86400 {
			return nil, errors.New("session_idle_ttl_seconds must be 1..=86400")
		}
	}
	if v := os.Getenv("SESSION_IDLE_TTL_SECS"); v != "" {
		if n, e := strconv.ParseInt(v, 10, 64); e == nil && n >= 1 && n <= 86400 {
			ttl = n
		}
	}
	r.SessionIdleTTL = time.Duration(ttl) * time.Second
	skew := int64(300)
	if c.RefreshSkewSeconds != nil {
		if *c.RefreshSkewSeconds < 0 {
			return nil, errors.New("refresh_skew_seconds must be positive")
		}
		skew = *c.RefreshSkewSeconds
	}
	r.RefreshSkew = time.Duration(skew) * time.Second
	if c.RequestTimeoutSeconds != nil {
		if *c.RequestTimeoutSeconds < 0 {
			return nil, errors.New("request_timeout_seconds must be positive")
		}
		r.RequestTimeout = time.Duration(*c.RequestTimeoutSeconds) * time.Second
	}
	var n int64
	if n, err = positive("first_byte_timeout_seconds", c.FirstByteTimeoutSeconds, 600); err != nil {
		return nil, err
	}
	r.FirstByteTimeout = time.Duration(n) * time.Second
	if n, err = positive("idle_timeout_seconds", c.IdleTimeoutSeconds, 180); err != nil {
		return nil, err
	}
	r.IdleTimeout = time.Duration(n) * time.Second
	if r.MaxRequest, err = positive("max_request_bytes", c.MaxRequestBytes, 32<<20); err != nil {
		return nil, err
	}
	if r.MaxResponse, err = positive("max_response_bytes", c.MaxResponseBytes, 64<<20); err != nil {
		return nil, err
	}
	if r.MaxEvent, err = positive("max_event_bytes", c.MaxEventBytes, 32<<20); err != nil {
		return nil, err
	}
	r.TZ = ExpectedTimezone(c.Timezone)
	return r, nil
}

// checkEndpoint 要求 HTTPS；回环地址允许 HTTP，便于接本地 mock 上游。
func checkEndpoint(raw string, base bool) error {
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" {
		if base {
			return errors.New("invalid Anthropic base URL")
		}
		return errors.New("endpoint must use https")
	}
	if u.Scheme == "https" || (u.Scheme == "http" && isLoopbackHost(u.Hostname())) {
		return nil
	}
	if base && u.Scheme != "http" {
		return errors.New("invalid Anthropic base URL")
	}
	return errors.New("endpoint must use https")
}

// ExpectedTimezone：kernel.json timezone → TZ → SLOT_TZ → America/New_York。
func ExpectedTimezone(configured string) string {
	for _, v := range []string{configured, os.Getenv("TZ"), os.Getenv("SLOT_TZ")} {
		if v = strings.TrimSpace(v); v != "" {
			return v
		}
	}
	return FallbackTimezone
}

// CchEnabledFrom 读取 cch_enabled；缺省为 true，无法读取时沿用上次的值。
func (r *Resolved) CchEnabledValue() bool { return r.CchEnabled == nil || *r.CchEnabled }

// IsCrag 判断当前是否配置为 crag 官方数据面驱动。
func (r *Resolved) IsCrag() bool {
	dp := strings.ToLower(strings.TrimSpace(r.Dataplane))
	return dp == "crag" || dp == "official-cli" || dp == "official-cc" || dp == "claude-code"
}

// EnvSeconds 读取秒数环境变量，非法时用默认值。
func EnvSeconds(name string, def time.Duration) time.Duration {
	if v := os.Getenv(name); v != "" {
		if n, err := strconv.ParseFloat(v, 64); err == nil && n > 0 {
			return time.Duration(n * float64(time.Second))
		}
	}
	return def
}

// EnvInt 读取整数环境变量。
func EnvInt(name string, def int64) int64 {
	if v := os.Getenv(name); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			return n
		}
	}
	return def
}
