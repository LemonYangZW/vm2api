import { personaRulesFromCompat, type PersonaRule } from '@/lib/persona-rules'
import {
  overlayDisabledByPersona,
  overlayPresetFromCompat,
  personaPresetFromCompat,
} from '@/lib/persona-template'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

type Compat = Record<string, unknown>

function RuleCard({
  rule,
  index,
  onChange,
  onRemove,
}: {
  rule: PersonaRule
  index: number
  onChange: (next: PersonaRule) => void
  onRemove: () => void
}) {
  return (
    <div className='space-y-2 rounded-md border p-3'>
      <div className='flex flex-wrap items-center gap-3'>
        <Input
          className='h-8 w-40'
          value={rule.id}
          placeholder='id'
          aria-label='规则 id'
          onChange={(e) => onChange({ ...rule, id: e.target.value })}
        />
        <div className='flex items-center gap-2'>
          <Switch
            id={`pr-on-${index}`}
            checked={rule.enabled}
            onCheckedChange={(v) => onChange({ ...rule, enabled: v })}
          />
          <Label htmlFor={`pr-on-${index}`} className='text-xs font-normal'>
            启用
          </Label>
        </div>
        <div className='flex items-center gap-2'>
          <Switch
            id={`pr-nt-${index}`}
            checked={rule.no_tools_only}
            onCheckedChange={(v) => onChange({ ...rule, no_tools_only: v })}
          />
          <Label htmlFor={`pr-nt-${index}`} className='text-xs font-normal'>
            仅无 tools
          </Label>
        </div>
        <Button
          size='sm'
          variant='ghost'
          className='ms-auto'
          onClick={onRemove}
        >
          删除
        </Button>
      </div>
      <div className='grid gap-2 sm:grid-cols-2'>
        <Textarea
          className='h-24 font-mono text-xs'
          aria-label='匹配'
          placeholder='匹配末轮 user · 一行一条正则'
          value={rule.match.join('\n')}
          onChange={(e) =>
            onChange({ ...rule, match: e.target.value.split('\n') })
          }
        />
        <Textarea
          className='h-24 text-xs'
          aria-label='覆写'
          placeholder='覆写 → overlay 的 {{rules}}'
          value={rule.append}
          onChange={(e) => onChange({ ...rule, append: e.target.value })}
        />
      </div>
    </div>
  )
}

export function PersonaRulesPane({
  compat,
  onChange,
}: {
  compat: Compat
  onChange: (next: Compat) => void
}) {
  // persona_leak_append 的值在这里已并入 prompt-leak 规则，保存时置空退役。
  const rules = personaRulesFromCompat(compat)
  const preset = personaPresetFromCompat(compat)
  const overlayOff =
    overlayDisabledByPersona(preset) ||
    overlayPresetFromCompat(compat) === 'off'

  const setRules = (next: PersonaRule[]) =>
    onChange({ ...compat, persona_rules: next })

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm'>覆写规则</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-xs leading-relaxed text-muted-foreground'>
          命中末轮 user 时把「覆写」文本并进 overlay 的{' '}
          <code>{'{{rules}}'}</code>。<code>prompt-leak</code>{' '}
          的覆写就是这里这一格，协议页不再另设入口。匹配为空或覆写为空的规则保存时会被丢弃。
        </p>
        {overlayOff ? (
          <p
            className='rounded-md border px-3 py-2 text-xs leading-relaxed'
            style={{
              color: 'var(--status-bad)',
              backgroundColor: 'var(--status-bad-bg)',
              borderColor: 'var(--status-bad)',
            }}
          >
            当前 overlay 已关闭，下面的规则<b>全部不生效</b>。规则只有 overlay
            一条注入通道，需要生效请到「协议」页把 overlay 打开。
          </p>
        ) : null}
        {rules.map((rule, i) => (
          <RuleCard
            key={i}
            rule={rule}
            index={i}
            onChange={(next) =>
              setRules(rules.map((r, j) => (j === i ? next : r)))
            }
            onRemove={() => setRules(rules.filter((_, j) => j !== i))}
          />
        ))}
        <Button
          size='sm'
          variant='outline'
          onClick={() =>
            setRules([
              ...rules,
              {
                id: `rule-${rules.length + 1}`,
                enabled: true,
                no_tools_only: false,
                match: [],
                append: '',
              },
            ])
          }
        >
          添加规则
        </Button>
      </CardContent>
    </Card>
  )
}
