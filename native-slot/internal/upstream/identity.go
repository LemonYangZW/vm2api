package upstream

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"vm2api/native-slot/internal/credential"
	"vm2api/native-slot/internal/ojson"
)

// Identity 保存进程级标识：设备 ID 与进程会话 ID。
type Identity struct {
	ProcessSession string

	once        sync.Once
	deviceID    string
	accountUUID string
}

func NewIdentity() *Identity { return &Identity{ProcessSession: NewUUID()} }

// GlobalConfigPath 对应 CLI 的全局配置文件。
func GlobalConfigPath() string {
	if v := os.Getenv("CLAUDE_CONFIG_DIR"); v != "" {
		return filepath.Join(v, ".claude.json")
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".claude.json")
}

func (id *Identity) load() {
	path := GlobalConfigPath()
	b, err := os.ReadFile(path)
	var cfg *ojson.Object
	if err == nil {
		cfg, _ = ojson.ParseObject(b)
	}
	if cfg == nil {
		cfg = ojson.NewObject()
	}
	if s := ojson.Str(cfg.Get("userID")); s != "" {
		id.deviceID = s
	} else {
		var buf [32]byte
		_, _ = rand.Read(buf[:])
		id.deviceID = hex.EncodeToString(buf[:])
		cfg.Set("userID", id.deviceID)
		// 与官方一致：首次生成后写回全局配置，写失败不影响请求。
		_ = credential.WriteFileAtomic(path, append(indentJSON(cfg), '\n'))
	}
	id.accountUUID = ojson.Str(ojson.Obj(cfg.Get("oauthAccount")).Get("accountUuid"))
}

func indentJSON(o *ojson.Object) []byte {
	var buf bytes.Buffer
	if json.Indent(&buf, ojson.Marshal(o), "", "  ") != nil {
		return ojson.Marshal(o)
	}
	return buf.Bytes()
}

const metadataMaxEncoded = 512

var reservedMetadataKeys = map[string]bool{"ti": true, "os": true, "sb": true, "he": true, "uf": true, "ap": true, "tk": true}

// UserID 生成 metadata.user_id（JSON 字符串）。
func (id *Identity) UserID(session string) string {
	id.once.Do(id.load)
	account := id.accountUUID
	if envTruthy("CLAUDE_CODE_REMOTE") && os.Getenv("CLAUDE_CODE_ACCOUNT_UUID") != "" {
		account = os.Getenv("CLAUDE_CODE_ACCOUNT_UUID")
	}
	identity := ojson.NewObject()
	identity.Set("device_id", id.deviceID)
	identity.Set("account_uuid", account)
	identity.Set("session_id", session)
	extra := ojson.NewObject()
	if raw := os.Getenv("CLAUDE_CODE_EXTRA_METADATA"); raw != "" {
		if o, err := ojson.ParseObject([]byte(raw)); err == nil {
			for _, k := range o.Keys() {
				if reservedMetadataKeys[k] {
					continue
				}
				switch v := o.Get(k).(type) {
				case string, bool, json.Number:
					extra.Set(k, v)
				}
			}
		}
	}
	merged := ojson.NewObject()
	for _, k := range extra.Keys() {
		merged.Set(k, extra.Get(k))
	}
	for _, k := range identity.Keys() {
		merged.Set(k, identity.Get(k))
	}
	encoded := string(ojson.Marshal(merged))
	if len(encoded) > metadataMaxEncoded {
		encoded = string(ojson.Marshal(identity))
	}
	return encoded
}
