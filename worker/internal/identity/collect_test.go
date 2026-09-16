package identity

import "testing"

func TestParseOSRelease(t *testing.T) {
	id, pretty := ParseOSRelease(`
NAME="Ubuntu"
PRETTY_NAME="Ubuntu 24.04.3 LTS"
ID=ubuntu
VERSION_ID="24.04"
`)
	if id != "ubuntu" {
		t.Fatalf("id=%q", id)
	}
	if pretty != "Ubuntu 24.04.3 LTS" {
		t.Fatalf("pretty=%q", pretty)
	}
}

func TestCollectDefaults(t *testing.T) {
	got := Collect("", "test-ver")
	if got.SchemaVersion != SchemaVersion {
		t.Fatalf("schema=%q", got.SchemaVersion)
	}
	if got.RuntimeKind != "docker" {
		t.Fatalf("kind=%q", got.RuntimeKind)
	}
	if got.WorkerVersion != "test-ver" {
		t.Fatalf("version=%q", got.WorkerVersion)
	}
	if got.Arch == "" || got.GOOS == "" {
		t.Fatalf("arch/goos empty: %+v", got)
	}
}
