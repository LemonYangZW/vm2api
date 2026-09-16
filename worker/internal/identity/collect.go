package identity

import (
	"os"
	"runtime"
	"strings"
	"time"
)

const SchemaVersion = "1"

type GuestIdentity struct {
	SchemaVersion string `json:"schema_version"`
	RuntimeKind   string `json:"runtime_kind"`
	Hostname      string `json:"hostname"`
	OSId          string `json:"os_id"`
	OSPretty      string `json:"os_pretty"`
	KernelRelease string `json:"kernel_release"`
	Arch          string `json:"arch"`
	GOOS          string `json:"goos"`
	MachineID     string `json:"machine_id"`
	Timezone      string `json:"timezone"`
	Locale        string `json:"locale"`
	CollectedAt   string `json:"collected_at"`
	WorkerVersion string `json:"worker_version"`
}

func Collect(runtimeKind, workerVersion string) GuestIdentity {
	kind := strings.TrimSpace(runtimeKind)
	if kind == "" {
		kind = "docker"
	}
	hostname, _ := os.Hostname()
	osID, osPretty := readOSRelease()
	return GuestIdentity{
		SchemaVersion: SchemaVersion,
		RuntimeKind:   kind,
		Hostname:      hostname,
		OSId:          osID,
		OSPretty:      osPretty,
		KernelRelease: readKernelRelease(),
		Arch:          runtime.GOARCH,
		GOOS:          runtime.GOOS,
		MachineID:     readFirstFile("/etc/machine-id", "/var/lib/dbus/machine-id"),
		Timezone:      firstEnv("TZ", "UTC"),
		Locale:        firstEnv("LC_ALL", firstEnv("LANG", "en_US.UTF-8")),
		CollectedAt:   time.Now().UTC().Format(time.RFC3339),
		WorkerVersion: workerVersion,
	}
}

func ParseOSRelease(raw string) (id, pretty string) {
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		value = strings.Trim(value, `"'`)
		switch key {
		case "ID":
			id = value
		case "PRETTY_NAME":
			pretty = value
		}
	}
	return id, pretty
}

func readOSRelease() (id, pretty string) {
	raw := readFirstFile("/etc/os-release", "/usr/lib/os-release")
	return ParseOSRelease(raw)
}

func readKernelRelease() string {
	if value := readFirstFile("/proc/sys/kernel/osrelease"); value != "" {
		return value
	}
	return runtime.GOOS
}

func readFirstFile(paths ...string) string {
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		text := strings.TrimSpace(string(data))
		if text != "" {
			return text
		}
	}
	return ""
}

func firstEnv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
