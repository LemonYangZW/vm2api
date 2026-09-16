package telemetry

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/dofastted/kin-gateway/worker/internal/config"
	"github.com/dofastted/kin-gateway/worker/internal/credential"
)

const (
	sessionTTL         = 10 * time.Minute
	eventBatchInterval = 10 * time.Second
	growthbookInterval = 6 * time.Hour
	tickInterval       = time.Second
	touchName          = "telemetry.touch"
)

type Deps struct {
	HTTP      *Client
	Store     *credential.Store
	Now       func() time.Time
	Sleep     func(ctx context.Context, d time.Duration) bool
	RetryWait time.Duration
	TouchPath string
}

func defaultSleep(ctx context.Context, d time.Duration) bool {
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

func TouchPath(cfg config.Config) string {
	if strings.TrimSpace(cfg.ConfigPath) == "" {
		return ""
	}
	return filepath.Join(filepath.Dir(cfg.ConfigPath), touchName)
}

func WriteTouch(path string) error {
	if strings.TrimSpace(path) == "" {
		return nil
	}
	return os.WriteFile(path, []byte(time.Now().UTC().Format(time.RFC3339Nano)+"\n"), 0o600)
}

func lastActivity(path string, fallback time.Time) time.Time {
	if strings.TrimSpace(path) == "" {
		return fallback
	}
	info, err := os.Stat(path)
	if err != nil {
		return fallback
	}
	return info.ModTime()
}

// Run mirrors cc-bridge telemetry_loop:
// /v1 (or worker start) activates a 10-minute session.
// Every 10s: event_logging/batch tengu_api_success.
// Every 6h (first immediate): GrowthBook /api/eval.
func Run(ctx context.Context, cfg config.Config, deps Deps) error {
	if !cfg.Telemetry.Enabled {
		return nil
	}
	if deps.Now == nil {
		deps.Now = time.Now
	}
	if deps.Sleep == nil {
		deps.Sleep = defaultSleep
	}
	if deps.TouchPath == "" {
		deps.TouchPath = TouchPath(cfg)
	}
	started := deps.Now()
	var lastBatch time.Time
	var lastGrowthbook time.Time
	sentInit := false
	batchOK := true
	evalOK := true

	for {
		if ctx.Err() != nil {
			return nil
		}
		now := deps.Now()
		activity := lastActivity(deps.TouchPath, started)
		if now.Sub(activity) > sessionTTL {
			if !deps.Sleep(ctx, tickInterval) {
				return nil
			}
			continue
		}
		identity := overlayIdentity(cfg.Telemetry.Identity, credOrEmpty(deps))
		token := accessToken(deps)
		if token == "" {
			if !deps.Sleep(ctx, tickInterval) {
				return nil
			}
			continue
		}

		if !sentInit {
			ev := InitEvent(identity, now)
			if err := postBatch(ctx, deps, cfg, token, ev); err != nil {
				if stopOn4xx(err) {
					return nil
				}
			} else {
				sentInit = true
			}
		}

		if batchOK && (lastBatch.IsZero() || now.Sub(lastBatch) >= eventBatchInterval) {
			uptime := now.Sub(started).Seconds()
			ev := SuccessEvent(identity, now, uptime, "")
			if err := postBatch(ctx, deps, cfg, token, ev); err != nil {
				if stopOn4xx(err) {
					batchOK = false
				}
			} else {
				lastBatch = now
			}
		}

		if evalOK && (lastGrowthbook.IsZero() || now.Sub(lastGrowthbook) >= growthbookInterval) {
			if err := postEval(ctx, deps, cfg, token, GrowthbookEval(identity)); err != nil {
				if stopOn4xx(err) {
					evalOK = false
				}
			} else {
				lastGrowthbook = now
			}
		}

		if !deps.Sleep(ctx, tickInterval) {
			return nil
		}
	}
}

func credOrEmpty(deps Deps) credential.Credential {
	if deps.Store == nil {
		return credential.Credential{}
	}
	cred, err := deps.Store.Status()
	if err != nil {
		return credential.Credential{}
	}
	return cred
}

func accessToken(deps Deps) string {
	if deps.Store == nil {
		return ""
	}
	cred, err := deps.Store.Status()
	if err != nil || !cred.Valid() || cred.IsAPIKey() || cred.NeedsRefresh(deps.Now(), time.Minute) {
		return ""
	}
	return cred.AccessToken
}

func postBatch(ctx context.Context, deps Deps, cfg config.Config, token string, ev Event) error {
	if deps.HTTP == nil {
		return nil
	}
	err := deps.HTTP.PostBatch(ctx, token, cfg.Telemetry.Headers, []Event{ev})
	if err != nil {
		class, status := ClassifyBatchErr(err)
		log.Printf("telemetry sidecar: batch failed class=%s status=%d", class, status)
	}
	return err
}

func postEval(ctx context.Context, deps Deps, cfg config.Config, token string, body map[string]any) error {
	if deps.HTTP == nil {
		return nil
	}
	err := deps.HTTP.PostEval(ctx, token, cfg.Telemetry.Headers, body)
	if err != nil {
		class, status := ClassifyBatchErr(err)
		log.Printf("telemetry sidecar: eval failed class=%s status=%d", class, status)
	}
	return err
}

func stopOn4xx(err error) bool {
	class, status := ClassifyBatchErr(err)
	return class == "status" && status >= 400 && status < 500
}

func overlayIdentity(id config.TelemetryIdentity, cred credential.Credential) config.TelemetryIdentity {
	if strings.TrimSpace(cred.Email) != "" {
		id.Email = cred.Email
	}
	if strings.TrimSpace(cred.AccountUUID) != "" {
		id.AccountUUID = cred.AccountUUID
	}
	if strings.TrimSpace(cred.OrgUUID) != "" {
		id.OrgUUID = cred.OrgUUID
	}
	if strings.TrimSpace(id.Platform) == "" {
		id.Platform = defaultPlatform
	}
	if strings.TrimSpace(id.Entrypoint) == "" {
		id.Entrypoint = "cli"
	}
	return id
}
