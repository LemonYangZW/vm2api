import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Socks5Pane() {
  return (
    <div className='space-y-3'>
      <p className='text-sm text-muted-foreground'>
        名单、绑定、导入在「代理池」。这里只写网关合同。每槽必须绑一条；一条默认最多
        5 台。
      </p>
      <Card>
        <CardHeader>
          <CardTitle>一条 SOCKS5 = 一台网关</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>
            kin-egress 是虚拟机的默认路由。槽内只推理，不 Dial SOCKS、不设
            HTTPS_PROXY。
          </p>
          <p>
            住宅 NAT 大约 15 分钟掐空闲 TCP。网关 7 分钟无字节拆两边，并开 15s
            keepalive。空闲后下一条会新握手，不要为此重启 wrap / 虚拟机。
          </p>
          <p>
            探测：TCP 连上即活。greeting 被掐或 0xff 不算代理死。egress
            进程挂了只摘槽，不把代理标死。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
