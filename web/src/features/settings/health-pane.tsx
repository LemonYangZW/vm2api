import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { RawConfigFields } from '@/features/settings/raw-config-fields'

type HealthPaneProps = {
  title: string
  failover: Record<string, unknown>
  healthProbe: Record<string, unknown> | undefined
  onFailoverChange: (next: Record<string, unknown>) => void
}

export function HealthPane(props: HealthPaneProps) {
  const { title, failover, healthProbe, onFailoverChange } = props
  return (
    <>
      <SignatureRepairCard failover={failover} onChange={onFailoverChange} />
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>
            当前配置随「保存」写入 GET/PUT /api/panel/routing（含 official_cc /
            health_probe / compatibility）。
          </p>
          <RawConfigFields value={healthProbe} />
        </CardContent>
      </Card>
    </>
  )
}
function SignatureRepairCard({
  failover,
  onChange,
}: {
  failover: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  // 默认值在 gateway HEAD 与工作区之间相反（!== false vs === true），
  // 所以不硬编码默认态，严格按 GET /routing 的实际值回显。
  const enabled = failover.signature_repair === true
  return (
    <Card>
      <CardHeader>
        <CardTitle>签名修复</CardTitle>
      </CardHeader>
      <CardContent className='flex items-start justify-between gap-4'>
        <div className='space-y-1 text-sm text-muted-foreground'>
          <p>
            上游因思考签名返回 400 时，剥掉思考历史后重试一次，客户端最终看到
            200。
          </p>
          <p>
            关闭则把 400 原样透传 ——
            探测伪造签名时需要这个真实结果。其它修复（搜索 / 预填 / 工具配对 /
            schema / 自适应）不受此开关影响。
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) =>
            onChange({ ...failover, signature_repair: checked })
          }
          aria-label='签名修复'
        />
      </CardContent>
    </Card>
  )
}
