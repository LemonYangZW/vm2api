// Package slot 实现可独立构建的原生槽位协议，不依赖闭源 CLI。
package slot

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"
)

const Version = "arm64-slots-2026.10.20.1"

type Config struct {
	SocketPath              string `json:"socket_path"`
	CredentialPath          string `json:"credential_path"`
	InternalToken           string `json:"internal_token"`
	ClaudeBin               string `json:"claude_bin"`
	Slots                   int    `json:"slots_per_worker"`
	SystemLayout            string `json:"system_layout"`
	Timezone                string `json:"timezone"`
	Provider                string `json:"provider"`
	Dataplane               string `json:"dataplane"`
	RuntimeKind             string `json:"runtime_kind"`
	CLIVersion              string `json:"cli_version"`
	DefaultCacheTTL         string `json:"default_cache_ttl"`
	AnthropicBaseURL        string `json:"anthropic_base_url"`
	TestEndpoints           bool   `json:"test_endpoints"`
	ProxyURL                string `json:"proxy_url"`
	ProxyRequired           bool   `json:"proxy_required"`
	MaxRequestBytes         int64  `json:"max_request_bytes"`
	MaxResponseBytes        int64  `json:"max_response_bytes"`
	MaxEventBytes           int    `json:"max_event_bytes"`
	FirstByteTimeoutSeconds int    `json:"first_byte_timeout_seconds"`
	IdleTimeoutSeconds      int    `json:"idle_timeout_seconds"`
	RequestTimeoutSeconds   int    `json:"request_timeout_seconds"`
}

func LoadConfig(path string) (Config, error) {
	var c Config
	b, err := os.ReadFile(path)
	if err != nil {
		return c, err
	}
	if err = json.Unmarshal(b, &c); err != nil {
		return c, err
	}
	return c, c.Defaults()
}

func (c *Config) Defaults() error {
	if c.Slots == 0 {
		c.Slots = 20
	}
	if c.Slots < 1 || c.Slots > 20 {
		return errors.New("slots_per_worker must be 1..20")
	}
	if c.SystemLayout == "" {
		c.SystemLayout = "zero"
	}
	if c.SystemLayout != "zero" {
		return errors.New("native slot only supports system_layout=zero")
	}
	if c.Provider != "" && c.Provider != "local_cli" {
		return errors.New("native slot only supports provider=local_cli")
	}
	if c.Dataplane != "" && c.Dataplane != "wrap" {
		return errors.New("native slot only supports dataplane=wrap")
	}
	if c.RuntimeKind != "" && c.RuntimeKind != "docker" {
		return errors.New("native slot only supports runtime_kind=docker")
	}
	if c.CLIVersion == "" {
		c.CLIVersion = "2.1.296"
	}
	if c.DefaultCacheTTL == "" {
		c.DefaultCacheTTL = "1h"
	}
	if c.DefaultCacheTTL != "1h" && c.DefaultCacheTTL != "5m" {
		return errors.New("default_cache_ttl must be 5m or 1h")
	}
	if c.Timezone == "" {
		c.Timezone = os.Getenv("TZ")
	}
	if c.Timezone == "" {
		c.Timezone = os.Getenv("SLOT_TZ")
	}
	if c.CredentialPath == "" {
		c.CredentialPath = "/home/kincli/.claude/credentials.json"
	}
	if c.MaxRequestBytes <= 0 {
		c.MaxRequestBytes = 32 << 20
	}
	if c.MaxResponseBytes <= 0 {
		c.MaxResponseBytes = 64 << 20
	}
	if c.MaxEventBytes <= 0 {
		c.MaxEventBytes = 32 << 20
	}
	if c.MaxRequestBytes > 64<<20 || c.MaxResponseBytes > 256<<20 || c.MaxEventBytes > 64<<20 {
		return errors.New("configured size limit exceeds native slot hard limit")
	}
	if c.FirstByteTimeoutSeconds <= 0 {
		c.FirstByteTimeoutSeconds = 600
	}
	if c.IdleTimeoutSeconds <= 0 {
		c.IdleTimeoutSeconds = 180
	}
	if c.ProxyRequired && c.ProxyURL == "" {
		return errors.New("proxy_required needs proxy_url; transparent egress must use proxy_required=false")
	}
	if c.AnthropicBaseURL == "" {
		c.AnthropicBaseURL = "https://api.anthropic.com"
	}
	if !c.TestEndpoints && c.AnthropicBaseURL != "https://api.anthropic.com" {
		return errors.New("custom upstream requires test_endpoints=true")
	}
	return nil
}

func (c Config) idleTimeout() time.Duration { return time.Duration(c.IdleTimeoutSeconds) * time.Second }
func slotID(i int) string                   { return fmt.Sprintf("s%02d", i) }

type Frame struct {
	Type            string          `json:"type"`
	JobID           string          `json:"job_id,omitempty"`
	SlotID          string          `json:"slot_id,omitempty"`
	Nonce           json.RawMessage `json:"nonce,omitempty"`
	Request         map[string]any  `json:"request,omitempty"`
	RequestContext  map[string]any  `json:"request_context,omitempty"`
	Event           map[string]any  `json:"event,omitempty"`
	ProtocolVersion int             `json:"protocol_version,omitempty"`
	Slots           int             `json:"slots,omitempty"`
	SystemLayout    string          `json:"system_layout,omitempty"`
	Timezone        string          `json:"timezone"`
	Capabilities    []string        `json:"capabilities,omitempty"`
	StopReason      *string         `json:"stop_reason,omitempty"`
	Usage           map[string]any  `json:"usage,omitempty"`
	Error           *string         `json:"error,omitempty"`
	Status          int             `json:"status,omitempty"`
	ErrorType       string          `json:"error_type,omitempty"`
	Code            string          `json:"code,omitempty"`
	RetryAfter      string          `json:"retry_after,omitempty"`
	UpstreamCode    string          `json:"upstream_code,omitempty"`
	RequestID       string          `json:"request_id,omitempty"`
}

func strptr(s string) *string     { return &s }
func stringValue(v any) string    { s, _ := v.(string); return s }
func object(v any) map[string]any { m, _ := v.(map[string]any); return m }
func merge(dst, src map[string]any) {
	for k, v := range src {
		dst[k] = v
	}
}
