// Package login 实现 cli-node 的 auth login / setup-token / auth status / auth logout（07 7.4）。
// CLI 自己完成 PKCE、生成授权链接并换票；宿主机只负责提取链接、粘贴授权码与读取凭据。
package login

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"vm2api/native-slot/internal/credential"
	"vm2api/native-slot/internal/ojson"
	"vm2api/native-slot/internal/upstream"
)

const (
	ClientID         = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
	ClaudeAuthorize  = "https://claude.com/cai/oauth/authorize"
	ConsoleAuthorize = "https://platform.claude.com/oauth/authorize"
	ManualRedirect   = "https://platform.claude.com/oauth/code/callback"
	FullScope        = "org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload"
	RefreshScope     = "user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload"
	InferenceScope   = "user:inference"
	SetupExpiresIn   = 31536000
)

func tokenURL() string {
	if v := os.Getenv("CLAUDE_CODE_OAUTH_TOKEN_URL"); v != "" {
		return v
	}
	return "https://platform.claude.com/v1/oauth/token"
}

func profileURL() string { return upstream.BaseURL() + "/api/oauth/profile" }

func b64url(b []byte) string { return base64.RawURLEncoding.EncodeToString(b) }

func randomB64(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return b64url(b)
}

// PKCE 生成 verifier / challenge / state。
type PKCE struct{ Verifier, Challenge, State string }

func NewPKCE() PKCE {
	v := randomB64(32)
	sum := sha256.Sum256([]byte(v))
	return PKCE{Verifier: v, Challenge: b64url(sum[:]), State: randomB64(32)}
}

// AuthorizeURL 按固定参数顺序拼接授权链接。
func AuthorizeURL(endpoint, scope string, p PKCE, email string, sso bool) string {
	enc := func(s string) string { return strings.ReplaceAll(url.QueryEscape(s), "+", "%20") }
	var b strings.Builder
	b.WriteString(endpoint)
	b.WriteString("?code=true")
	b.WriteString("&client_id=" + enc(ClientID))
	b.WriteString("&response_type=code")
	b.WriteString("&redirect_uri=" + enc(ManualRedirect))
	b.WriteString("&scope=" + enc(scope))
	b.WriteString("&code_challenge=" + enc(p.Challenge))
	b.WriteString("&code_challenge_method=S256")
	b.WriteString("&state=" + enc(p.State))
	if email != "" {
		b.WriteString("&login_hint=" + enc(email))
	}
	if sso {
		b.WriteString("&login_method=sso")
	}
	return b.String()
}

// Tokens 是换票结果。
type Tokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	Scope        string `json:"scope"`
	Account      *struct {
		UUID         string `json:"uuid"`
		EmailAddress string `json:"email_address"`
	} `json:"account"`
	Organization *struct {
		UUID string `json:"uuid"`
		Name string `json:"name"`
	} `json:"organization"`
}

// ErrInvalidCode 表示授权码无效（401）。
var ErrInvalidCode = errors.New("Authentication failed: Invalid authorization code")

func httpClient(timeout time.Duration) *http.Client { return &http.Client{Timeout: timeout} }

// Exchange 用授权码换取令牌。
func Exchange(ctx context.Context, code string, p PKCE, expiresIn int64) (*Tokens, error) {
	body := map[string]any{"grant_type": "authorization_code", "code": code, "redirect_uri": ManualRedirect,
		"client_id": ClientID, "code_verifier": p.Verifier, "state": p.State}
	if expiresIn > 0 {
		body["expires_in"] = expiresIn
	}
	return postToken(ctx, body)
}

// Refresh 用 refresh token 换取新令牌（免交互登录用）。
func Refresh(ctx context.Context, refresh, scope string) (*Tokens, error) {
	if scope == "" {
		scope = RefreshScope
	}
	t, err := postToken(ctx, map[string]any{"grant_type": "refresh_token", "refresh_token": refresh,
		"client_id": ClientID, "scope": scope})
	if err == nil && t.RefreshToken == "" {
		t.RefreshToken = refresh
	}
	return t, err
}

func postToken(ctx context.Context, body map[string]any) (*Tokens, error) {
	raw, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL(), bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := httpClient(15 * time.Second).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode == 401 {
		return nil, ErrInvalidCode
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Token exchange failed (%d): %s", resp.StatusCode, http.StatusText(resp.StatusCode))
	}
	var t Tokens
	if err := json.Unmarshal(data, &t); err != nil || t.AccessToken == "" {
		return nil, errors.New("Token exchange failed: malformed token response")
	}
	return &t, nil
}

// Profile 是 /api/oauth/profile 中用到的字段。
type Profile struct {
	Account struct {
		UUID         string `json:"uuid"`
		EmailAddress string `json:"email_address"`
	} `json:"account"`
	Organization struct {
		UUID             string `json:"uuid"`
		Name             string `json:"name"`
		OrganizationType string `json:"organization_type"`
		RateLimitTier    string `json:"rate_limit_tier"`
	} `json:"organization"`
	SubscriptionType string `json:"subscriptionType"`
	RateLimitTier    string `json:"rateLimitTier"`
}

// FetchProfile 失败不阻断登录，返回 nil。
func FetchProfile(ctx context.Context, token string) *Profile {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, profileURL(), nil)
	if err != nil {
		return nil
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := httpClient(10 * time.Second).Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil
	}
	var p Profile
	if json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&p) != nil {
		return nil
	}
	if p.SubscriptionType == "" {
		switch p.Organization.OrganizationType {
		case "claude_max":
			p.SubscriptionType = "max"
		case "claude_pro":
			p.SubscriptionType = "pro"
		case "claude_team":
			p.SubscriptionType = "team"
		case "claude_enterprise":
			p.SubscriptionType = "enterprise"
		}
	}
	if p.RateLimitTier == "" {
		p.RateLimitTier = p.Organization.RateLimitTier
	}
	return &p
}

// CredentialsPath 是 CLI 写出凭据的位置。
func CredentialsPath() string {
	if v := os.Getenv("KIN_CREDENTIAL_FILE"); v != "" {
		return v
	}
	return filepath.Join(upstream.ConfigDir(), ".credentials.json")
}

// Save 把令牌合并写入凭据文件（0600）。
func Save(t *Tokens, prof *Profile, withRefresh bool) error {
	path := CredentialsPath()
	root := ojson.NewObject()
	if b, err := os.ReadFile(path); err == nil {
		if o, err := ojson.ParseObject(b); err == nil {
			root = o
		}
	}
	oauth := ojson.NewObject()
	oauth.Set("accessToken", t.AccessToken)
	if withRefresh && t.RefreshToken != "" {
		oauth.Set("refreshToken", t.RefreshToken)
	}
	oauth.Set("expiresAt", time.Now().UnixMilli()+t.ExpiresIn*1000)
	scopes := []any{}
	for _, s := range strings.Fields(t.Scope) {
		scopes = append(scopes, s)
	}
	oauth.Set("scopes", scopes)
	if prof != nil {
		oauth.Set("subscriptionType", nullIfEmpty(prof.SubscriptionType))
		oauth.Set("rateLimitTier", nullIfEmpty(prof.RateLimitTier))
	} else {
		oauth.Set("subscriptionType", nil)
		oauth.Set("rateLimitTier", nil)
	}
	acct := ojson.NewObject()
	switch {
	case t.Account != nil:
		acct.Set("uuid", t.Account.UUID)
		acct.Set("emailAddress", t.Account.EmailAddress)
	case prof != nil && prof.Account.UUID != "":
		acct.Set("uuid", prof.Account.UUID)
		acct.Set("emailAddress", prof.Account.EmailAddress)
	}
	if t.Organization != nil {
		acct.Set("organizationUuid", t.Organization.UUID)
	} else if prof != nil && prof.Organization.UUID != "" {
		acct.Set("organizationUuid", prof.Organization.UUID)
	}
	if acct.Len() > 0 {
		oauth.Set("tokenAccount", acct)
	}
	root.Set("claudeAiOauth", oauth)
	var buf bytes.Buffer
	if json.Indent(&buf, ojson.Marshal(root), "", "  ") != nil {
		buf.Reset()
		buf.Write(ojson.Marshal(root))
	}
	buf.WriteByte('\n')
	return credential.WriteFileAtomic(path, buf.Bytes())
}

func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// ---- 交互流程 ----

// Terminal 抽象 PTY 输入输出，便于测试。
type Terminal struct {
	In     *bufio.Reader
	Out    io.Writer
	Err    io.Writer
	Prompt time.Duration // 等待粘贴的上限
}

var pasteMarkers = strings.NewReplacer("\x1b[200~", "", "\x1b[201~", "")

// readLine 带超时读取一行，去掉括号粘贴标记。
func (t *Terminal) readLine(timeout time.Duration) (string, error) {
	type res struct {
		s   string
		err error
	}
	ch := make(chan res, 1)
	go func() {
		s, err := t.In.ReadString('\n')
		if err == io.EOF && s != "" {
			err = nil
		}
		ch <- res{s, err}
	}()
	select {
	case r := <-ch:
		return strings.TrimSpace(pasteMarkers.Replace(r.s)), r.err
	case <-time.After(timeout):
		return "", errors.New("timed out waiting for input")
	}
}

// splitCode 处理回调页给出的 code#state 形式。
func splitCode(input string, state string) (string, error) {
	code, st, has := strings.Cut(strings.TrimSpace(input), "#")
	if code == "" {
		return "", errors.New("empty code")
	}
	if has && st != "" && st != state {
		return "", errors.New("state mismatch")
	}
	return code, nil
}

// Flow 描述一次登录。
type Flow struct {
	Endpoint    string
	Scope       string
	ExpiresIn   int64
	Email       string
	SSO         bool
	SetupToken  bool
	SuccessPage string
}

// Run 执行完整 PTY 登录：输出链接 → 读取授权码 → 换票 → 写凭据。
func (t *Terminal) Run(ctx context.Context, f Flow) (*Tokens, error) {
	p := NewPKCE()
	link := AuthorizeURL(f.Endpoint, f.Scope, p, f.Email, f.SSO)
	fmt.Fprintln(t.Out, "Opening browser to sign in…")
	fmt.Fprintf(t.Out, "If the browser didn't open, visit: %s\n", link)
	for {
		fmt.Fprint(t.Out, "\nPaste code here if prompted > ")
		line, err := t.readLine(t.Prompt)
		if err != nil {
			return nil, err
		}
		if line == "" {
			continue
		}
		code, err := splitCode(line, p.State)
		if err != nil {
			// 格式不对时停留在输入框，宿主机会重新粘贴。
			fmt.Fprintln(t.Out, "\nInvalid code. Please make sure the full code was copied.")
			continue
		}
		tok, err := Exchange(ctx, code, p, f.ExpiresIn)
		if errors.Is(err, ErrInvalidCode) {
			fmt.Fprintln(t.Out, "\nOAuth error: Invalid code. Please make sure the full code was copied.")
			if !t.retry() {
				return nil, err
			}
			continue
		}
		if err != nil {
			return nil, err
		}
		return tok, nil
	}
}

// retry 提示按回车重试；超时视为放弃。
func (t *Terminal) retry() bool {
	fmt.Fprint(t.Out, "Press Enter to retry. ")
	_, err := t.readLine(30 * time.Second)
	return err == nil
}

// AuthLogin 是 `cli-node auth login`。
func AuthLogin(ctx context.Context, args []string, term *Terminal) int {
	var email string
	sso, console, claudeai := false, false, false
	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--email":
			if i+1 < len(args) {
				email = args[i+1]
				i++
			}
		case "--sso":
			sso = true
		case "--console":
			console = true
		case "--claudeai":
			claudeai = true
		default:
			if v, ok := strings.CutPrefix(args[i], "--email="); ok {
				email = v
			}
		}
	}
	if console && claudeai {
		fmt.Fprintln(term.Err, "Error: --console and --claudeai cannot be used together.")
		return 1
	}
	if rt := os.Getenv("CLAUDE_CODE_OAUTH_REFRESH_TOKEN"); rt != "" {
		scopes := os.Getenv("CLAUDE_CODE_OAUTH_SCOPES")
		if scopes == "" {
			fmt.Fprintln(term.Err, "CLAUDE_CODE_OAUTH_SCOPES is required when CLAUDE_CODE_OAUTH_REFRESH_TOKEN is set.")
			return 1
		}
		tok, err := Refresh(ctx, rt, scopes)
		if err != nil {
			fmt.Fprintf(term.Err, "Login failed: %v\n", err)
			return 1
		}
		if tok.Scope == "" {
			tok.Scope = scopes
		}
		return finish(ctx, term, tok, true)
	}
	endpoint := ClaudeAuthorize
	if forced := forcedLoginMethod(); forced == "console" || (forced == "" && console) {
		endpoint = ConsoleAuthorize
	}
	tok, err := term.Run(ctx, Flow{Endpoint: endpoint, Scope: FullScope, Email: email, SSO: sso})
	if err != nil {
		fmt.Fprintf(term.Err, "Login failed: %v\n", err)
		return 1
	}
	return finish(ctx, term, tok, true)
}

func finish(ctx context.Context, term *Terminal, tok *Tokens, refresh bool) int {
	prof := FetchProfile(ctx, tok.AccessToken)
	if err := Save(tok, prof, refresh); err != nil {
		fmt.Fprintf(term.Err, "Login failed: %v\n", err)
		return 1
	}
	fmt.Fprintln(term.Out, "Login successful.")
	return 0
}

// forcedLoginMethod 读取 settings.json 的 forceLoginMethod。
func forcedLoginMethod() string {
	b, err := os.ReadFile(filepath.Join(upstream.ConfigDir(), "settings.json"))
	if err != nil {
		return ""
	}
	var s struct {
		ForceLoginMethod string `json:"forceLoginMethod"`
	}
	if json.Unmarshal(b, &s) != nil {
		return ""
	}
	switch s.ForceLoginMethod {
	case "console":
		return "console"
	case "claudeai":
		return "claudeai"
	}
	return ""
}

// SetupToken 是 `cli-node setup-token`：一年期、仅 user:inference。
func SetupToken(ctx context.Context, term *Terminal) int {
	tok, err := term.Run(ctx, Flow{Endpoint: ClaudeAuthorize, Scope: InferenceScope, ExpiresIn: SetupExpiresIn, SetupToken: true})
	if err != nil {
		fmt.Fprintf(term.Err, "Login failed: %v\n", err)
		return 1
	}
	if tok.Scope == "" {
		tok.Scope = InferenceScope
	}
	prof := FetchProfile(ctx, tok.AccessToken)
	if err := Save(tok, prof, false); err != nil {
		fmt.Fprintf(term.Err, "Login failed: %v\n", err)
		return 1
	}
	fmt.Fprintln(term.Out, "\n✓ Long-lived authentication token created successfully!")
	fmt.Fprintf(term.Out, "\nYour OAuth token (valid for 1 year):\n\n%s\n\n", tok.AccessToken)
	fmt.Fprintln(term.Out, "Store this token securely. You won't be able to see it again.")
	fmt.Fprintln(term.Out, "\nUse this token by setting: export CLAUDE_CODE_OAUTH_TOKEN=<token>")
	return 0
}

// Status 是 `cli-node auth status`。
func Status(args []string, out io.Writer) int {
	text := false
	for _, a := range args {
		if a == "--text" {
			text = true
		}
	}
	report := map[string]any{"loggedIn": false, "authMethod": "none", "apiProvider": "firstParty"}
	path := CredentialsPath()
	if _, err := os.Stat(path); err != nil {
		path = filepath.Join(upstream.ConfigDir(), "credentials.json")
	}
	cred, err := credential.Load(path)
	if err == nil && cred.Token != "" {
		report["loggedIn"] = true
		if cred.IsAPIKey() {
			report["authMethod"] = "api_key"
		} else {
			report["authMethod"] = "claude.ai"
			if cred.Email != "" {
				report["email"] = cred.Email
			}
			if cred.OrgUUID != "" {
				report["orgId"] = cred.OrgUUID
			}
			if b, err := os.ReadFile(path); err == nil {
				var f struct {
					O struct {
						SubscriptionType string `json:"subscriptionType"`
					} `json:"claudeAiOauth"`
				}
				if json.Unmarshal(b, &f) == nil && f.O.SubscriptionType != "" {
					report["subscriptionType"] = f.O.SubscriptionType
				}
			}
		}
	}
	if text {
		if report["loggedIn"] == true {
			fmt.Fprintf(out, "Logged in (%s)\n", report["authMethod"])
		} else {
			fmt.Fprintln(out, "Not logged in")
		}
	} else {
		b, _ := json.MarshalIndent(report, "", "  ")
		fmt.Fprintln(out, string(b))
	}
	if report["loggedIn"] == true {
		return 0
	}
	return 1
}

// Logout 是 `cli-node auth logout`：移除 claudeAiOauth。
func Logout(out, errw io.Writer) int {
	path := CredentialsPath()
	b, err := os.ReadFile(path)
	if err == nil {
		if o, perr := ojson.ParseObject(b); perr == nil {
			o.Delete("claudeAiOauth")
			if werr := credential.WriteFileAtomic(path, append(ojson.Marshal(o), '\n')); werr != nil {
				fmt.Fprintf(errw, "Failed to log out: %v\n", werr)
				return 1
			}
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		fmt.Fprintf(errw, "Failed to log out: %v\n", err)
		return 1
	}
	fmt.Fprintln(out, "Successfully logged out from your Anthropic account.")
	return 0
}
