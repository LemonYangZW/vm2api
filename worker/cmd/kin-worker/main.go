package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/dofastted/kin-gateway/worker/internal/config"
	"github.com/dofastted/kin-gateway/worker/internal/credential"
	kinoauth "github.com/dofastted/kin-gateway/worker/internal/oauth"
	kinserver "github.com/dofastted/kin-gateway/worker/internal/server"
	"github.com/dofastted/kin-gateway/worker/internal/telemetry"
	"github.com/dofastted/kin-gateway/worker/internal/upstream"
)

func main() {
	if len(os.Args) >= 2 && os.Args[1] == "telemetry" {
		os.Exit(runTelemetry(os.Args[2:]))
	}
	configPath := flag.String("config", "", "path to worker JSON config")
	flag.Parse()

	var cfg config.Config
	var err error
	if *configPath != "" {
		cfg, err = config.Load(*configPath)
	} else {
		cfg, err = config.FromEnv()
	}
	if err != nil {
		log.Fatalf("load worker config: %v", err)
	}
	var httpClient *http.Client
	var oauthClient *http.Client
	if cfg.EgressMode == "transparent" {
		httpClient, err = upstream.NewTransparentHTTPClient(cfg.RequestTimeout)
		if err != nil {
			log.Fatalf("create slot HTTP client: %v", err)
		}
		oauthClient, err = upstream.NewTransparentOAuthHTTPClient(time.Minute)
		if err != nil {
			log.Fatalf("create slot OAuth client: %v", err)
		}
	} else {
		httpClient, err = upstream.NewHTTPClient(cfg.ProxyURL, cfg.ProxyRequired, cfg.RequestTimeout)
		if err != nil {
			log.Fatalf("create slot HTTP client: %v", err)
		}
		oauthClient, err = upstream.NewOAuthHTTPClient(cfg.ProxyURL, cfg.ProxyRequired, time.Minute)
		if err != nil {
			log.Fatalf("create slot OAuth client: %v", err)
		}
	}
	baseURL, err := url.Parse(cfg.AnthropicBaseURL)
	if err != nil {
		log.Fatalf("parse Anthropic base URL: %v", err)
	}
	store := credential.NewStore(cfg.CredentialPath)
	refresher := &kinoauth.Refresher{
		Store:    store,
		Client:   oauthClient,
		TokenURL: cfg.OAuthTokenURL,
		ClientID: kinoauth.DefaultClientID,
		Skew:     cfg.RefreshSkew,
		MaxTries: 3,
	}
	upstreamClient := &upstream.Client{
		HTTP:           httpClient,
		Store:          store,
		Refresher:      refresher,
		AnthropicBase:  baseURL,
		RequestTimeout: cfg.RequestTimeout,
	}
	worker := &kinserver.Server{
		Config:    cfg,
		Store:     store,
		Refresher: refresher,
		Upstream:  upstreamClient,
	}

	if err = os.MkdirAll(filepath.Dir(cfg.SocketPath), 0o770); err != nil {
		log.Fatalf("create worker socket directory: %v", err)
	}
	_ = os.Remove(cfg.SocketPath)
	listener, err := net.Listen("unix", cfg.SocketPath)
	if err != nil {
		log.Fatalf("listen on worker socket: %v", err)
	}
	defer listener.Close()
	defer os.Remove(cfg.SocketPath)
	if err = os.Chmod(cfg.SocketPath, 0o660); err != nil {
		log.Fatalf("chmod worker socket: %v", err)
	}

	rootCtx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	telemetry.StartIfEnabled(rootCtx, cfg)

	server := &http.Server{
		Handler:           worker.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       2 * time.Minute,
		MaxHeaderBytes:    64 << 10,
	}
	errs := make(chan error, 1)
	go func() {
		errs <- server.Serve(listener)
	}()
	log.Printf("kin-worker ready vm=%s socket=%s proxy=configured", cfg.VMID, cfg.SocketPath)

	select {
	case <-rootCtx.Done():
	case serveErr := <-errs:
		if serveErr != nil && serveErr != http.ErrServerClosed {
			log.Fatalf("serve worker: %v", serveErr)
		}
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err = server.Shutdown(shutdownCtx); err != nil {
		fmt.Fprintf(os.Stderr, "worker shutdown: %v\n", err)
	}
}

func runTelemetry(args []string) int {
	fs := flag.NewFlagSet("telemetry", flag.ContinueOnError)
	configPath := fs.String("config", "", "path to worker JSON config")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Printf("telemetry: load config failed")
		return 1
	}
	if !cfg.Telemetry.Enabled {
		return 0
	}
	var httpClient *http.Client
	if cfg.EgressMode == "transparent" {
		httpClient, err = upstream.NewTransparentHTTPClient(20 * time.Second)
	} else {
		httpClient, err = upstream.NewHTTPClient(cfg.ProxyURL, cfg.ProxyRequired, 20*time.Second)
	}
	if err != nil {
		log.Printf("telemetry: http client failed")
		return 1
	}
	baseURL, err := url.Parse(cfg.AnthropicBaseURL)
	if err != nil {
		log.Printf("telemetry: base url failed")
		return 1
	}
	rootCtx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if err = telemetry.Run(rootCtx, cfg, telemetry.Deps{
		HTTP: &telemetry.Client{
			HTTP:          httpClient,
			AnthropicBase: baseURL,
			Timeout:       15 * time.Second,
		},
		Store: credential.NewStore(cfg.CredentialPath),
	}); err != nil {
		log.Printf("telemetry: run failed")
		return 1
	}
	return 0
}
