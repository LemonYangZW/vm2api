import {
  type CacheBreakpoints,
  type MessagesBreakpointMode,
  MESSAGES_BREAKPOINT_OPTIONS,
  cacheBreakpointsFromCompat,
  detectProxiedOfficialCcFromCompat,
  messagesModeExplain,
} from '@/lib/cache-breakpoints'
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

type Compat = Record<string, unknown>

export function CacheBreakpointsPane({
  compat,
  onChange,
}: {
  compat: Compat
  onChange: (next: Compat) => void
}) {
  const cfg = cacheBreakpointsFromCompat(compat)
  const proxied = detectProxiedOfficialCcFromCompat(compat)
  const off = !cfg.enabled

  const patch = (next: Partial<CacheBreakpoints>) =>
    onChange({ ...compat, cache_breakpoints: { ...cfg, ...next } })

  return (
    <>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>缓存断点</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            上游只缓存到断点为止的前缀，所以一个不带 <code>cache_control</code>{' '}
            的请求无论 TTL 写什么都是全价。「缓存
            TTL」只给已有断点重新定时，断点本身由这里造。默认打 5m；入站自己要
            1h（缓存 TTL 请求头或 <code>cache_control</code>
            ）时跟着升到 1h。上游一次最多 4 个断点，超了按 tools → messages →
            system 的顺序舍弃。官方 Claude Code 原生请求整包跳过。
          </p>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            system 末块有两道闸。人设模板自己带了断点（官方四块里的 agent
            槽位）时不再补第二个 —— 官方就是把边界压在那一块上，末块的调用方{' '}
            <code>--system</code>{' '}
            原文不打，多打一个既会把可变内容圈进前缀又白占一个配额。前缀（tools
            + system）估算不到该模型的最小可缓存长度（512～4096
            token，随模型不同）时也不打 ——
            那种断点上游静默忽略，只留下一个与官方客户端不同的标记。
          </p>
          <div className='divide-y'>
            <SettingRow
              label='启用'
              desc='关掉则一个断点都不造，第三方请求回到全价'
            >
              <Switch
                checked={cfg.enabled}
                onCheckedChange={(on) => patch({ enabled: on })}
                aria-label='启用缓存断点'
              />
            </SettingRow>
            <SettingRow
              label='system 末块'
              desc='仅在 system 自己没有断点、且前缀长到上游真会缓存时补一个'
            >
              <Switch
                checked={cfg.system_tail}
                disabled={off}
                onCheckedChange={(on) => patch({ system_tail: on })}
                aria-label='system 末块断点'
              />
            </SettingRow>
            <SettingRow
              label='tools 末块'
              desc='在最后一个可缓存工具上打断点；上游内置工具与 deferred 工具跳过'
            >
              <Switch
                checked={cfg.tools_tail}
                disabled={off}
                onCheckedChange={(on) => patch({ tools_tail: on })}
                aria-label='tools 末块断点'
              />
            </SettingRow>
            <SettingRow
              label='保留调用方 system 断点'
              desc='人设重写会丢掉调用方原来的 system 断点，这里按它选的 TTL 补回同一位置'
            >
              <Switch
                checked={cfg.preserve_client}
                disabled={off}
                onCheckedChange={(on) => patch({ preserve_client: on })}
                aria-label='保留调用方 system 断点'
              />
            </SettingRow>
            <SettingRow label='messages'>
              <Select
                value={cfg.messages}
                disabled={off}
                onValueChange={(v) =>
                  patch({ messages: v as MessagesBreakpointMode })
                }
              >
                <SelectTrigger className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGES_BREAKPOINT_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </div>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {messagesModeExplain(cfg.messages)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>被中转的官方流量</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <SettingRow
            label='识别中转来的官方 Claude Code'
            desc='UA 已经被中转方换成 Go-http-client，但 body 仍带官方计费块和合法 metadata.user_id'
          >
            <Switch
              checked={proxied}
              onCheckedChange={(on) =>
                onChange({ ...compat, detect_proxied_official_cc: on })
              }
              aria-label='识别被中转的官方 Claude Code'
            />
          </SettingRow>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            命中的请求整包按官方处理：不重写
            system、不注入断点、不遮罩用量，保留它自己带的缓存断点。关掉则这些请求按第三方走人设重写，缓存前缀每轮都变。只有身份句没有计费块的请求不算命中
            —— 那是第三方仿写，仍按第三方处理。
          </p>
        </CardContent>
      </Card>
    </>
  )
}
