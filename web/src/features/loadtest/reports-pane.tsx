import { useState } from 'react'
import type { LoadtestRun } from '@/types/panel-loadtest'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusMark } from '@/components/status-mark'
import { loadtestStatusTone } from '@/features/loadtest/loadtest-status'
import { LT_MODELS, LT_STOCKS, LT_TURNS } from '@/features/loadtest/options'
import type { LoadtestSetup } from '@/features/loadtest/use-loadtest-setup'

/**
 * 「开始一轮」参数卡片，镜像 index.html `renderLoadtest()` 里的
 * 标的编辑器 + 轮次分段 + 并发/思考预算输入 + 模型多选 + 开始/取消。
 */
export function LoadtestReportsPane({
  setup,
  current,
  onStart,
  onCancel,
  starting,
  cancelling,
}: {
  setup: LoadtestSetup
  current: LoadtestRun | undefined
  onStart: () => void
  onCancel: (id: string) => void
  starting: boolean
  cancelling: boolean
}) {
  const [newTicker, setNewTicker] = useState('')
  const [newName, setNewName] = useState('')
  const running =
    current?.status === 'running' || current?.status === 'cancelling'
  const unusedPresets = LT_STOCKS.filter(
    (preset) => !setup.stocks.some((s) => s.ticker === preset.ticker)
  )

  function submitAdd() {
    if (!newTicker.trim()) return
    const res = setup.addStock(newTicker, newName)
    if (!res.ok) {
      window.alert(res.message)
      return
    }
    setNewTicker('')
    setNewName('')
  }

  function removeStock(ticker: string) {
    const res = setup.removeStock(ticker)
    if (!res.ok) window.alert(res.message)
  }

  const tone = current ? loadtestStatusTone(current.status) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>开始一轮</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label>模型</Label>
          <div className='flex flex-wrap gap-2'>
            {LT_MODELS.map((m) => (
              <Button
                key={m.id}
                type='button'
                size='sm'
                variant={setup.models.includes(m.id) ? 'default' : 'outline'}
                onClick={() => setup.toggleModel(m.id)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label>标的</Label>
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={setup.resetStocks}
            >
              重置为默认
            </Button>
          </div>
          <div className='flex flex-wrap gap-2'>
            {setup.stocks.map((s) => (
              <Badge
                key={s.ticker}
                variant='secondary'
                className='gap-1 py-1 pr-1 text-xs'
              >
                {s.ticker}
                {s.name ? (
                  <span className='text-muted-foreground'>{s.name}</span>
                ) : null}
                <button
                  type='button'
                  aria-label={`移除 ${s.ticker}`}
                  className='ms-1 rounded-full px-1 hover:bg-destructive/20'
                  onClick={() => removeStock(s.ticker)}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          {unusedPresets.length ? (
            <div className='flex flex-wrap gap-1.5'>
              {unusedPresets.map((preset) => (
                <button
                  key={preset.ticker}
                  type='button'
                  className='rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent'
                  onClick={() => setup.addStock(preset.ticker, preset.name)}
                >
                  + {preset.ticker}
                </button>
              ))}
            </div>
          ) : null}
          <div className='flex flex-wrap items-end gap-2'>
            <div className='space-y-1'>
              <Label className='text-xs'>代码</Label>
              <Input
                className='h-8 w-24'
                placeholder='NVDA'
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>名称（可选）</Label>
              <Input
                className='h-8 w-32'
                placeholder='NVIDIA'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
              />
            </div>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={submitAdd}
            >
              添加
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <Label>轮次</Label>
          <div className='flex flex-wrap gap-2'>
            {LT_TURNS.map((t) => (
              <Button
                key={t.n}
                type='button'
                size='sm'
                variant={setup.turns === t.n ? 'default' : 'outline'}
                onClick={() => setup.setTurns(t.n)}
              >
                {t.n} · {t.label}
              </Button>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1'>
            <Label>并发（1–20）</Label>
            <Input
              type='number'
              min={1}
              max={20}
              value={setup.concurrency}
              onChange={(e) => setup.setConcurrency(Number(e.target.value))}
            />
          </div>
          <div className='space-y-1'>
            <Label>思考预算（1–128000）</Label>
            <Input
              type='number'
              min={1}
              max={128000}
              value={setup.maxTokens}
              onChange={(e) => setup.setMaxTokens(Number(e.target.value))}
            />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            onClick={onStart}
            disabled={starting || running}
            loading={starting}
          >
            开跑
          </Button>
          {current?.id && running ? (
            <Button
              size='sm'
              variant='outline'
              onClick={() => onCancel(current.id)}
              disabled={cancelling}
              loading={cancelling}
            >
              取消
            </Button>
          ) : null}
          {current?.id && tone ? (
            <span className='inline-flex items-center gap-1.5 text-sm'>
              <StatusMark tone={tone} />
              <span className='font-mono text-xs text-muted-foreground'>
                {current.id}
              </span>
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
