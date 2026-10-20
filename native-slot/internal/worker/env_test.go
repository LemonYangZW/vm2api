package worker

import (
	"path/filepath"
	"strings"
	"testing"
	"time"

	"vm2api/native-slot/internal/config"
)

func envMap(kv []string) map[string]string {
	m := map[string]string{}
	for _, s := range kv {
		k, v, _ := strings.Cut(s, "=")
		m[k] = v
	}
	return m
}

// 现网 kernel 不覆盖容器给的 CLAUDE_CONFIG_DIR（/home/kincli/.claude），
// 只在缺失时补默认值；device id 依赖这个目录。
func TestHostEnvMatchesProduction(t *testing.T) {
	cred := filepath.Join("home", "kincli", ".claude", "credentials.json")
	r := &Runtime{cfg: &config.Resolved{Config: config.Config{
		Path: filepath.Join("run", "kin", "kernel.json"), CredentialPath: cred}, TZ: "Asia/Taipei"}}

	t.Setenv("CLAUDE_CONFIG_DIR", "")
	t.Setenv("USER_TYPE", "")
	t.Setenv("ENVELOPE_PATH", "")
	env := envMap(r.hostEnv())
	if env["CLAUDE_CONFIG_DIR"] != filepath.Dir(cred) {
		t.Errorf("fallback CLAUDE_CONFIG_DIR = %q", env["CLAUDE_CONFIG_DIR"])
	}
	if env["USER_TYPE"] != "external" || env["ENVELOPE_PATH"] != "/tmp/cli/envelope.json" || env["SLOT_TZ"] != "Asia/Taipei" {
		t.Errorf("defaults: %v %v %v", env["USER_TYPE"], env["ENVELOPE_PATH"], env["SLOT_TZ"])
	}

	t.Setenv("CLAUDE_CONFIG_DIR", "/home/kincli/.claude")
	t.Setenv("USER_TYPE", "ant")
	env = envMap(r.hostEnv())
	if env["CLAUDE_CONFIG_DIR"] != "/home/kincli/.claude" || env["USER_TYPE"] != "ant" {
		t.Errorf("inherited values overridden: %v %v", env["CLAUDE_CONFIG_DIR"], env["USER_TYPE"])
	}
}

// 解析规则取自现网 MultiplexCliProvider::from_env，并在 oracle kin-03 隔离实例上实测。
func TestSubmitWaitParsing(t *testing.T) {
	for in, want := range map[string]time.Duration{
		"": 2 * time.Second, "abc": 2 * time.Second, "+": 2 * time.Second, "-5": 2 * time.Second,
		"++5": 2 * time.Second, "99999999999999999999": 2 * time.Second, "1.5": 2 * time.Second,
		"0": 0, "1500": 1500 * time.Millisecond, "+5000": 5 * time.Second, "30000": 30 * time.Second,
	} {
		if got := submitWait(in); got != want {
			t.Errorf("submitWait(%q) = %v, want %v", in, got, want)
		}
	}
}

func TestSubmitWaitFollowsControlPlane(t *testing.T) {
	t.Setenv("SUBMIT_WAIT_MS", "5000")
	if got := submitWait(submitWaitEnv()); got != 5*time.Second {
		t.Errorf("SUBMIT_WAIT_MS only: %v", got)
	}
	t.Setenv("KIN_SUBMIT_WAIT_MS", "30000")
	if got := submitWait(submitWaitEnv()); got != 30*time.Second {
		t.Errorf("KIN_SUBMIT_WAIT_MS wins: %v", got)
	}
}
