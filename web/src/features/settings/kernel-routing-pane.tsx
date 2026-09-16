import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { SettingRow } from '@/components/setting-row'
import { isFallbackToGo } from '@/features/vm/engine-contract'

export function KernelRoutingPane({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const engine = 'rust'
  const storedEngine = String(value.engine || '')
  const strict = value.strict === true
  const fallbackToGo = isFallbackToGo(value.fallback_to_go)
  const update = (patch: Record<string, unknown>) =>
    onChange({ ...value, ...patch })

  useEffect(() => {
    if (storedEngine === 'rust' && !fallbackToGo) return
    onChange({ ...value, engine: 'rust', fallback_to_go: false })
    // onChange 是父级 inline，不能进依赖。
  }, [storedEngine, fallbackToGo])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claude 内核路由</CardTitle>
      </CardHeader>
      <CardContent className='divide-y'>
        <SettingRow label='新建 Claude VM 默认引擎'>
          <Select
            value={engine}
            onValueChange={(next) => update({ engine: next })}
          >
            <SelectTrigger className='w-72'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='rust'>Rust · wrap cli-hop</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label='凭证归属'>
          <span className='text-sm'>
            宿主机写 credentials.json，槽 kernel/CLI 只读 AT
          </span>
        </SettingRow>
        <SettingRow label='失败回退 Go'>
          <Switch
            checked={fallbackToGo}
            disabled
            onCheckedChange={(checked) => update({ fallback_to_go: checked })}
          />
        </SettingRow>
        <SettingRow label='严格 Rust'>
          <Switch
            checked={strict}
            onCheckedChange={(checked) =>
              update({
                strict: checked,
                ...(checked ? { fallback_to_go: false } : {}),
              })
            }
          />
        </SettingRow>
        <p className='py-3 text-xs text-muted-foreground'>
          默认 rust · wrap cli-hop。Go HTTP 已废弃。保存后 Claude
          槽跟随本页。GPT 槽在设置 → GPT，不继承 rust/go。
        </p>
      </CardContent>
    </Card>
  )
}
