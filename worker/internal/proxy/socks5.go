package proxy

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type Dialer struct {
	Address  string
	Username string
	Password string
	Timeout  time.Duration
	// LocalResolve 为 true 时（socks5:// 语义）在本地把域名解析成 IPv4 再发给代理，
	// 保证代理只建立 IPv4 上游连接；socks5h:// 保持「代理解析」的语义。
	LocalResolve bool
}

func New(rawURL string, timeout time.Duration) (*Dialer, error) {
	u, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil {
		return nil, fmt.Errorf("parse SOCKS5 URL: %w", err)
	}
	if u.Scheme != "socks5" && u.Scheme != "socks5h" {
		return nil, fmt.Errorf("unsupported SOCKS5 scheme %q", u.Scheme)
	}
	host := u.Hostname()
	port := u.Port()
	if host == "" || port == "" {
		return nil, errors.New("SOCKS5 URL requires host and port")
	}
	username := ""
	password := ""
	if u.User != nil {
		username = u.User.Username()
		password, _ = u.User.Password()
	}
	if len(username) > 255 || len(password) > 255 {
		return nil, errors.New("SOCKS5 username/password exceeds 255 bytes")
	}
	if timeout <= 0 {
		timeout = 15 * time.Second
	}
	return &Dialer{
		Address:      net.JoinHostPort(host, port),
		Username:     username,
		Password:     password,
		Timeout:      timeout,
		LocalResolve: u.Scheme == "socks5",
	}, nil
}

func (d *Dialer) DialContext(ctx context.Context, network, address string) (net.Conn, error) {
	if d == nil {
		return nil, errors.New("SOCKS5 dialer is nil")
	}
	if network != "tcp" && network != "tcp4" && network != "tcp6" {
		return nil, fmt.Errorf("SOCKS5 only supports TCP, got %q", network)
	}
	if sameHostPort(address, d.Address) {
		return nil, fmt.Errorf("refusing SOCKS CONNECT to the proxy address %s; DialContext must receive the upstream host", d.Address)
	}
	base := &net.Dialer{Timeout: d.Timeout}
	conn, err := base.DialContext(ctx, "tcp", d.Address)
	if err != nil {
		return nil, fmt.Errorf("connect SOCKS5 proxy: %w", err)
	}
	ok := false
	defer func() {
		if !ok {
			_ = conn.Close()
		}
	}()
	stopCancel := make(chan struct{})
	go func() {
		select {
		case <-ctx.Done():
			_ = conn.SetDeadline(time.Now())
		case <-stopCancel:
		}
	}()
	defer close(stopCancel)
	if deadline, has := ctx.Deadline(); has {
		_ = conn.SetDeadline(deadline)
	} else if d.Timeout > 0 {
		_ = conn.SetDeadline(time.Now().Add(d.Timeout))
	}
	if err = d.negotiateConn(conn, address); err != nil {
		return nil, err
	}
	if err = ctx.Err(); err != nil {
		return nil, err
	}
	_ = conn.SetDeadline(time.Time{})
	ApplyTCPKeepAlive(conn)
	ok = true
	return conn, nil
}

func (d *Dialer) negotiateConn(conn net.Conn, target string) error {
	return d.negotiate(conn, target, d.LocalResolve)
}

func (d *Dialer) negotiate(conn net.Conn, target string, localResolve bool) error {
	methods := []byte{0x00}
	if d.Username != "" || d.Password != "" {
		methods = append(methods, 0x02)
	}
	greeting := append([]byte{0x05, byte(len(methods))}, methods...)
	if _, err := conn.Write(greeting); err != nil {
		return fmt.Errorf("write SOCKS5 greeting: %w", err)
	}
	reply := make([]byte, 2)
	if _, err := io.ReadFull(conn, reply); err != nil {
		return fmt.Errorf("read SOCKS5 greeting: %w", err)
	}
	if reply[0] != 0x05 {
		return fmt.Errorf("unexpected SOCKS version %d", reply[0])
	}
	switch reply[1] {
	case 0x00:
	case 0x02:
		if err := d.authenticate(conn); err != nil {
			return err
		}
	case 0xff:
		return errors.New("SOCKS5 proxy rejected all authentication methods")
	default:
		return fmt.Errorf("unsupported SOCKS5 authentication method %d", reply[1])
	}
	request, err := connectRequest(target, localResolve)
	if err != nil {
		return err
	}
	if _, err = conn.Write(request); err != nil {
		return fmt.Errorf("write SOCKS5 connect: %w", err)
	}
	header := make([]byte, 4)
	if _, err = io.ReadFull(conn, header); err != nil {
		return fmt.Errorf("read SOCKS5 connect header: %w", err)
	}
	if header[0] != 0x05 {
		return fmt.Errorf("unexpected SOCKS version %d", header[0])
	}
	if header[1] != 0x00 {
		return fmt.Errorf("SOCKS5 connect failed: %s", replyMessage(header[1]))
	}
	if err = discardAddress(conn, header[3]); err != nil {
		return fmt.Errorf("read SOCKS5 bound address: %w", err)
	}
	return nil
}

func (d *Dialer) authenticate(conn net.Conn) error {
	user := []byte(d.Username)
	pass := []byte(d.Password)
	request := make([]byte, 0, 3+len(user)+len(pass))
	request = append(request, 0x01, byte(len(user)))
	request = append(request, user...)
	request = append(request, byte(len(pass)))
	request = append(request, pass...)
	if _, err := conn.Write(request); err != nil {
		return fmt.Errorf("write SOCKS5 authentication: %w", err)
	}
	reply := make([]byte, 2)
	if _, err := io.ReadFull(conn, reply); err != nil {
		return fmt.Errorf("read SOCKS5 authentication: %w", err)
	}
	if reply[1] != 0x00 {
		return errors.New("SOCKS5 authentication failed")
	}
	return nil
}

// connectRequest 组装 SOCKS5 CONNECT 请求。localResolve 为 true（socks5://）时，
// 域名目标**在本地解析出 A 记录**后按 IPv4 发出，让代理只建 IPv4 上游连接
// （控制面配置的出口代理只有 IPv4 监听与 IPv4 路由；交给代理解析会拿到 AAAA
// 而连不通：dial tcp [2607:6bc0::10]:443: connect: network is unreachable）。
// 显式 IPv6 目标一律拒绝（出口必须经过代理的 IPv4 地址）；
// localResolve 为 false（socks5h://）时保持「域名下发、代理解析」的语义。
func connectRequest(target string, localResolve bool) ([]byte, error) {
	return connectRequestWith(target, localResolve, nil)
}

func connectRequestWith(target string, localResolve bool,
	lookup func(context.Context, string, string) ([]net.IP, error)) ([]byte, error) {
	host, portRaw, err := net.SplitHostPort(target)
	if err != nil {
		return nil, fmt.Errorf("split target address: %w", err)
	}
	port, err := strconv.Atoi(portRaw)
	if err != nil || port < 1 || port > 65535 {
		return nil, fmt.Errorf("invalid target port %q", portRaw)
	}
	ip := net.ParseIP(host)
	if ip != nil && ip.To4() == nil {
		return nil, fmt.Errorf("refusing IPv6 target %s: egress must go through the configured IPv4 proxy", host)
	}
	if ip == nil {
		if len(host) == 0 || len(host) > 255 {
			return nil, errors.New("target hostname must contain 1-255 bytes")
		}
		if !localResolve {
			request := []byte{0x05, 0x01, 0x00, 0x03, byte(len(host))}
			request = append(request, host...)
			return appendPort(request, port), nil
		}
		if lookup == nil {
			lookup = net.DefaultResolver.LookupIP
		}
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		ips, err := lookup(ctx, "ip4", host)
		cancel()
		if err != nil {
			return nil, fmt.Errorf("resolve %s over IPv4: %w", host, err)
		}
		for _, candidate := range ips {
			if v4 := candidate.To4(); v4 != nil {
				ip = v4
				break
			}
		}
		if ip == nil {
			return nil, fmt.Errorf("no IPv4 address for %s", host)
		}
	}
	v4 := ip.To4()
	if v4 == nil {
		return nil, fmt.Errorf("refusing IPv6 target %s: egress must go through the configured IPv4 proxy", host)
	}
	request := []byte{0x05, 0x01, 0x00, 0x01}
	request = append(request, v4...)
	return appendPort(request, port), nil
}

func appendPort(request []byte, port int) []byte {
	portBytes := make([]byte, 2)
	binary.BigEndian.PutUint16(portBytes, uint16(port))
	return append(request, portBytes...)
}

func discardAddress(reader io.Reader, addressType byte) error {
	var length int
	switch addressType {
	case 0x01:
		length = 4
	case 0x04:
		length = 16
	case 0x03:
		size := make([]byte, 1)
		if _, err := io.ReadFull(reader, size); err != nil {
			return err
		}
		length = int(size[0])
	default:
		return fmt.Errorf("unknown SOCKS5 address type %d", addressType)
	}
	_, err := io.CopyN(io.Discard, reader, int64(length+2))
	return err
}

func replyMessage(code byte) string {
	switch code {
	case 0x01:
		return "general failure"
	case 0x02:
		return "connection not allowed"
	case 0x03:
		return "network unreachable"
	case 0x04:
		return "host unreachable"
	case 0x05:
		return "connection refused"
	case 0x06:
		return "TTL expired"
	case 0x07:
		return "command not supported"
	case 0x08:
		return "address type not supported"
	default:
		return fmt.Sprintf("error code %d", code)
	}
}

func sameHostPort(left, right string) bool {
	hostA, portA, errA := net.SplitHostPort(left)
	hostB, portB, errB := net.SplitHostPort(right)
	if errA != nil || errB != nil {
		return left == right
	}
	return hostA == hostB && portA == portB
}
