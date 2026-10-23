package netx

import "testing"

// 默认强制 IPv4：槽位出站必须落进控制面配置的代理（IPv4 监听）。
func TestDefaultIsIPv4Only(t *testing.T) {
	t.Setenv("KIN_EGRESS_IPV4", "")
	if !IPv4Only() {
		t.Fatal("default must be IPv4-only")
	}
	for _, network := range []string{"", "tcp", "tcp4", "tcp6"} {
		if got := For(network); got != "tcp4" {
			t.Fatalf("For(%q) = %q, want tcp4", network, got)
		}
	}
	if got := For("unix"); got != "unix" {
		t.Fatalf("unix must stay untouched, got %q", got)
	}
	if Network() != "tcp4" {
		t.Fatalf("Network() = %q", Network())
	}
}

// KIN_EGRESS_IPV4=0 放开双栈（仅排障）。
func TestOptOutAllowsDualStack(t *testing.T) {
	for _, value := range []string{"0", "false", "no", "off", " OFF "} {
		t.Setenv("KIN_EGRESS_IPV4", value)
		if IPv4Only() {
			t.Fatalf("%q must disable IPv4-only", value)
		}
		if got := For("tcp"); got != "tcp" {
			t.Fatalf("For(tcp) = %q with opt-out", got)
		}
	}
}
