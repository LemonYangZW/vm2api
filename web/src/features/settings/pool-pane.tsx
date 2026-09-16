import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingRow } from '@/components/setting-row'

type PoolPaneProps = {
  pool: Record<string, unknown>
  failover: Record<string, unknown>
  onPoolChange: (next: Record<string, unknown>) => void
  onFailoverChange: (next: Record<string, unknown>) => void
}

export function PoolPane(props: PoolPaneProps) {
  const { pool, failover, onPoolChange, onFailoverChange } = props
  return (
    <Card>
      <CardHeader>
        <CardTitle>账号池</CardTitle>
      </CardHeader>
      <CardContent className='divide-y'>
        <SettingRow label='策略'>
          <Select
            value={String(pool.strategy || 'weighted-round-robin')}
            onValueChange={(strategy) => onPoolChange({ ...pool, strategy })}
          >
            <SelectTrigger className='w-56'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='weighted-round-robin'>平滑 WRR</SelectItem>
              <SelectItem value='round-robin'>轮询</SelectItem>
              <SelectItem value='lru'>LRU</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label='切号上限' desc='单次请求失败转移时最多切换的账号数'>
          <Input
            className='w-24'
            type='number'
            value={Number(failover.max_account_switches ?? 10)}
            onChange={(event) =>
              onFailoverChange({
                ...failover,
                max_account_switches: Number(event.target.value),
              })
            }
          />
        </SettingRow>
        <SettingRow label='总尝试' desc='含重试在内的总尝试上限'>
          <Input
            className='w-24'
            type='number'
            value={Number(failover.max_total_attempts ?? 12)}
            onChange={(event) =>
              onFailoverChange({
                ...failover,
                max_total_attempts: Number(event.target.value),
              })
            }
          />
        </SettingRow>
        <SettingRow label='401 冷却' desc='OAuth 401 后该账号退出调度的时长'>
          <Select
            value={String(failover.oauth_401_cooldown_ms ?? 120000)}
            onValueChange={(cooldownMs) =>
              onFailoverChange({
                ...failover,
                oauth_401_cooldown_ms: Number(cooldownMs),
              })
            }
          >
            <SelectTrigger className='w-56'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='30000'>30 秒</SelectItem>
              <SelectItem value='120000'>2 分钟</SelectItem>
              <SelectItem value='300000'>5 分钟</SelectItem>
              <SelectItem value='600000'>10 分钟</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label='流式交付'>
          <Select
            value={String(failover.delivery_mode || 'realtime')}
            onValueChange={(deliveryMode) =>
              onFailoverChange({
                ...failover,
                delivery_mode: deliveryMode,
              })
            }
          >
            <SelectTrigger className='w-56'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='realtime'>realtime</SelectItem>
              <SelectItem value='verified'>verified</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </CardContent>
    </Card>
  )
}
