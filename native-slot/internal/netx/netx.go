// Package netx 统一槽位出站的地址族选择。
//
// 生产槽位的出站由控制面配置的代理承担：宿主机上按槽位 UID 用 iptables
// （KEG<proxy> 链）把 TCP 全部 REDIRECT 到该代理的本地端口，代理监听在
// 127.0.0.1:<port>（IPv4 环回）。这套重定向**只覆盖 IPv4**：一旦进程去连 IPv6，
// 既不会经过代理，也没有可用路由（现场：dial tcp [2607:6bc0::10]:443:
// connect: network is unreachable）。
//
// 因此槽位侧所有出站连接统一用 IPv4，保证：
//  1. 一定落进控制面配置的代理（IPv4 监听）；
//  2. 不会出现绕过代理的 IPv6 直连。
//
// KIN_EGRESS_IPV4=0 仅供排障时放开，不作为生产配置。
package netx

import (
	"context"
	"net"
	"os"
	"strings"
	"time"
)

// IPv4Only 报告是否强制 IPv4 出站（默认 true）。
func IPv4Only() bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("KIN_EGRESS_IPV4"))) {
	case "0", "false", "no", "off":
		return false
	}
	return true
}

// Network 返回应使用的拨号网络名。
func Network() string {
	if IPv4Only() {
		return "tcp4"
	}
	return "tcp"
}

// DialContext 是带超时与 keepalive 的 DialContext，按策略选择地址族。
func DialContext(ctx context.Context, network, address string) (net.Conn, error) {
	d := &net.Dialer{Timeout: 30 * time.Second, KeepAlive: 30 * time.Second}
	return d.DialContext(ctx, For(network), address)
}

// For 只把 IP 网络改成 IPv4；unix 等其它网络保持原样。
func For(network string) string {
	if !IPv4Only() {
		return network
	}
	switch network {
	case "", "tcp", "tcp4", "tcp6":
		return "tcp4"
	}
	return network
}
