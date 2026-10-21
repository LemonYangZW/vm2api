package upstream

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestParityAPIKeyMetadataOmitsOAuthAccount(t *testing.T) {
	config := t.TempDir()
	t.Setenv("CLAUDE_CONFIG_DIR", config)
	t.Setenv("CLAUDE_CODE_REMOTE", "")
	if err := os.WriteFile(filepath.Join(config, ".claude.json"), []byte(`{"userID":"probe-device","oauthAccount":{"accountUuid":"probe-account"}}`), 0600); err != nil {
		t.Fatal(err)
	}
	id := NewIdentity()
	for _, tc := range []struct {
		oauth   bool
		account string
	}{{true, "probe-account"}, {false, ""}} {
		var metadata map[string]string
		if err := json.Unmarshal([]byte(id.UserID("caller-session", tc.oauth)), &metadata); err != nil {
			t.Fatal(err)
		}
		if metadata["account_uuid"] != tc.account || metadata["device_id"] != "probe-device" || metadata["session_id"] != "caller-session" {
			t.Fatalf("oauth=%v: metadata=%v", tc.oauth, metadata)
		}
	}
	t.Setenv("CLAUDE_CODE_REMOTE", "1")
	t.Setenv("CLAUDE_CODE_ACCOUNT_UUID", "remote-account")
	var metadata map[string]string
	if err := json.Unmarshal([]byte(id.UserID("caller-session", false)), &metadata); err != nil {
		t.Fatal(err)
	}
	if metadata["account_uuid"] != "remote-account" {
		t.Fatalf("remote override lost: %v", metadata)
	}
}
