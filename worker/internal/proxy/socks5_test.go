package proxy

import (
	"bytes"
	"context"
	"encoding/binary"
	"io"
	"net"
	"net/url"
	"testing"
	"time"
)

func TestDialerUsesRemoteHostnameAndAuthentication(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	targets := make(chan string, 1)
	go func() {
		conn, acceptErr := listener.Accept()
		if acceptErr != nil {
			return
		}
		defer conn.Close()
		greeting := make([]byte, 4)
		if _, readErr := io.ReadFull(conn, greeting); readErr != nil {
			return
		}
		_, _ = conn.Write([]byte{0x05, 0x02})
		authHead := make([]byte, 2)
		if _, readErr := io.ReadFull(conn, authHead); readErr != nil {
			return
		}
		user := make([]byte, int(authHead[1]))
		_, _ = io.ReadFull(conn, user)
		passLen := make([]byte, 1)
		_, _ = io.ReadFull(conn, passLen)
		pass := make([]byte, int(passLen[0]))
		_, _ = io.ReadFull(conn, pass)
		if string(user) != "user" || string(pass) != "pass" {
			return
		}
		_, _ = conn.Write([]byte{0x01, 0x00})
		header := make([]byte, 5)
		if _, readErr := io.ReadFull(conn, header); readErr != nil {
			return
		}
		host := make([]byte, int(header[4]))
		_, _ = io.ReadFull(conn, host)
		portBytes := make([]byte, 2)
		_, _ = io.ReadFull(conn, portBytes)
		targets <- net.JoinHostPort(string(host), formatPort(binary.BigEndian.Uint16(portBytes)))
		_, _ = conn.Write([]byte{0x05, 0x00, 0x00, 0x01, 127, 0, 0, 1, 0, 1})
		<-time.After(50 * time.Millisecond)
	}()
	proxyURL := (&url.URL{
		Scheme: "socks5h",
		Host:   listener.Addr().String(),
		User:   url.UserPassword("user", "pass"),
	}).String()
	dialer, err := New(proxyURL, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	conn, err := dialer.DialContext(context.Background(), "tcp", "api.anthropic.com:443")
	if err != nil {
		t.Fatal(err)
	}
	_ = conn.Close()
	select {
	case target := <-targets:
		if target != "api.anthropic.com:443" {
			t.Fatalf("SOCKS target = %q", target)
		}
	case <-time.After(time.Second):
		t.Fatal("SOCKS server did not observe target")
	}
}

func formatPort(port uint16) string {
	var digits [5]byte
	index := len(digits)
	value := int(port)
	for {
		index--
		digits[index] = byte('0' + value%10)
		value /= 10
		if value == 0 {
			break
		}
	}
	return string(digits[index:])
}

func TestDialerRejectsProxyAddressAsTarget(t *testing.T) {
	proxyURL := "socks5://user:pass@127.0.0.1:6067"
	dialer, err := New(proxyURL, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	_, err = dialer.DialContext(context.Background(), "tcp", "127.0.0.1:6067")
	if err == nil {
		t.Fatal("expected error when CONNECT target is the proxy itself")
	}
	if got := err.Error(); !contains(got, "refusing SOCKS CONNECT") {
		t.Fatalf("error = %q", got)
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || search(s, sub))
}

func search(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

// socks5:// 语义：本地把域名解析成 IPv4，代理只建 IPv4 上游连接。
func TestConnectRequestLocalResolveUsesIPv4(t *testing.T) {
	lookup := func(_ context.Context, network, host string) ([]net.IP, error) {
		if network != "ip4" {
			t.Fatalf("lookup network = %q, want ip4", network)
		}
		if host != "api.anthropic.com" {
			t.Fatalf("lookup host = %q", host)
		}
		return []net.IP{net.ParseIP("160.79.104.10")}, nil
	}
	request, err := connectRequestWith("api.anthropic.com:443", true, lookup)
	if err != nil {
		t.Fatal(err)
	}
	want := []byte{0x05, 0x01, 0x00, 0x01, 160, 79, 104, 10, 0x01, 0xbb}
	if !bytes.Equal(request, want) {
		t.Fatalf("connect request = %v, want %v", request, want)
	}
}

// socks5h:// 语义：域名原样下发，由代理解析。
func TestConnectRequestRemoteResolveSendsHostname(t *testing.T) {
	request, err := connectRequestWith("api.anthropic.com:443", false, nil)
	if err != nil {
		t.Fatal(err)
	}
	want := append([]byte{0x05, 0x01, 0x00, 0x03, byte(len("api.anthropic.com"))}, []byte("api.anthropic.com")...)
	want = append(want, 0x01, 0xbb)
	if !bytes.Equal(request, want) {
		t.Fatalf("connect request = %v, want %v", request, want)
	}
}

// 显式 IPv6 目标必须被拒绝：出口只能经过代理的 IPv4 地址。
func TestConnectRequestRejectsIPv6Target(t *testing.T) {
	for _, target := range []string{"[2607:6bc0::10]:443", "[::1]:443"} {
		if _, err := connectRequest(target, true); err == nil {
			t.Fatalf("expected IPv6 target %s to be rejected", target)
		} else if !contains(err.Error(), "refusing IPv6 target") {
			t.Fatalf("error = %q", err)
		}
	}
}

// 没有 A 记录时明确报错，不静默回落到 IPv6。
func TestConnectRequestNoIPv4Record(t *testing.T) {
	lookup := func(context.Context, string, string) ([]net.IP, error) {
		return []net.IP{net.ParseIP("2607:6bc0::10")}, nil
	}
	if _, err := connectRequestWith("api.anthropic.com:443", true, lookup); err == nil {
		t.Fatal("expected error when only AAAA records exist")
	}
}
