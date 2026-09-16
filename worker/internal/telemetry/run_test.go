package telemetry

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"github.com/dofastted/kin-gateway/worker/internal/config"
	"github.com/dofastted/kin-gateway/worker/internal/credential"
)

func saveCred(t *testing.T, dir string, cred credential.Credential) *credential.Store {
	t.Helper()
	store := credential.NewStore(filepath.Join(dir, "credentials.json"))
	if _, err := store.Save(cred, nil); err != nil {
		t.Fatal(err)
	}
	return store
}

func TestRunDisabledDoesNotPost(t *testing.T) {
	var hits atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()
	base, _ := url.Parse(server.URL)
	store := saveCred(t, t.TempDir(), credential.Credential{
		AccessToken: "tok",
		ExpiresAt:   time.Now().Add(time.Hour).UnixMilli(),
	})
	err := Run(context.Background(), config.Config{}, Deps{
		HTTP:  &Client{HTTP: server.Client(), AnthropicBase: base, Timeout: time.Second},
		Store: store,
		Now:   time.Now,
	})
	if err != nil {
		t.Fatal(err)
	}
	if hits.Load() != 0 {
		t.Fatalf("disabled sidecar posted %d times", hits.Load())
	}
}

func TestRunExpiredTokenSkipsPost(t *testing.T) {
	var hits atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()
	base, _ := url.Parse(server.URL)
	store := saveCred(t, t.TempDir(), credential.Credential{
		AccessToken: "tok",
		ExpiresAt:   time.Now().Add(-time.Hour).UnixMilli(),
	})
	err := Run(context.Background(), config.Config{Telemetry: config.TelemetryConfig{Enabled: true}}, Deps{
		HTTP:  &Client{HTTP: server.Client(), AnthropicBase: base, Timeout: time.Second},
		Store: store,
		Now:   time.Now,
		Sleep: func(context.Context, time.Duration) bool { return false },
	})
	if err != nil {
		t.Fatal(err)
	}
	if hits.Load() != 0 {
		t.Fatalf("expired token posted %d times", hits.Load())
	}
}

func TestRun4xxDoesNotSurface(t *testing.T) {
	var hits atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		if r.URL.Path != batchPath {
			t.Fatalf("path=%q", r.URL.Path)
		}
		w.WriteHeader(http.StatusForbidden)
	}))
	defer server.Close()
	base, _ := url.Parse(server.URL)
	store := saveCred(t, t.TempDir(), credential.Credential{
		AccessToken: "tok",
		ExpiresAt:   time.Now().Add(time.Hour).UnixMilli(),
	})
	err := Run(context.Background(), config.Config{
		Telemetry: config.TelemetryConfig{Enabled: true, Identity: Identity{DeviceID: "d"}},
	}, Deps{
		HTTP:  &Client{HTTP: server.Client(), AnthropicBase: base, Timeout: time.Second},
		Store: store,
		Now:   time.Now,
		Sleep: func(context.Context, time.Duration) bool { return false },
	})
	if err != nil {
		t.Fatal(err)
	}
	if hits.Load() != 1 {
		t.Fatalf("hits=%d", hits.Load())
	}
}

func TestRunPostsInitSuccessAndEval(t *testing.T) {
	var hits atomic.Int32
	var batches, evals atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		switch r.URL.Path {
		case batchPath:
			batches.Add(1)
		case evalPath:
			evals.Add(1)
		default:
			t.Fatalf("path=%q", r.URL.Path)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()
	base, _ := url.Parse(server.URL)
	store := saveCred(t, t.TempDir(), credential.Credential{
		AccessToken: "tok",
		ExpiresAt:   time.Now().Add(time.Hour).UnixMilli(),
		Email:       "slot@example.com",
	})
	err := Run(context.Background(), config.Config{
		Telemetry: config.TelemetryConfig{Enabled: true, Identity: Identity{DeviceID: "d", Platform: "linux"}},
	}, Deps{
		HTTP:  &Client{HTTP: server.Client(), AnthropicBase: base, Timeout: time.Second},
		Store: store,
		Now:   time.Now,
		Sleep: func(context.Context, time.Duration) bool { return false },
	})
	if err != nil {
		t.Fatal(err)
	}
	if batches.Load() < 2 || evals.Load() != 1 {
		t.Fatalf("hits=%d batches=%d evals=%d", hits.Load(), batches.Load(), evals.Load())
	}
}
