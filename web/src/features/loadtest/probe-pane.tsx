import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PROBE_BANK,
  PROBE_CASES,
  PROBE_FORMS,
  PROBE_MODELS,
  PROBE_SAMPLE_MAX,
} from '@/features/loadtest/options'
import type { ProbeSetup } from '@/features/loadtest/use-probe-setup'

/**
 * 探针（能力/答题共用）的参数面板，镜像 index.html `renderProbePane(suite)`
 * 的头部说明 + 开始/取消按钮 + 模型/用例(或形态)选择 + 思考预算/并发/抽样参数。
 * 结果表格是独立组件 `ProbeResultsCard`，与这里同级摆放（对应 index.html
 * 把 `renderProbeResults(suite)` 拼在 `renderProbePane` 末尾）。
 */
export function ProbePane({
  suite,
  setup,
  running,
  onStart,
  onCancel,
}: {
  suite: 'capability' | 'forms'
  setup: ProbeSetup
  running: boolean
  onStart: () => void
  onCancel: () => void
}) {
  const capSample = Math.min(PROBE_CASES.length, setup.capSample)
  const count =
    suite === 'forms'
      ? setup.displayModels.length * setup.displayForms.length * setup.sample
      : setup.displayModels.length * capSample

  return (
    <Card>
      <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-3 space-y-0'>
        <div>
          <CardTitle>{suite === 'forms' ? '答题形态' : '能力探针'}</CardTitle>
          <p className='mt-1 text-xs text-muted-foreground'>
            {suite === 'forms'
              ? `题库 ${PROBE_BANK} 道有金标的题，每次随机抽 ${setup.sample} 道，再按只答 / 分步 / 先答后补各跑一遍。`
              : `5 个用例里${setup.random ? '随机' : '按序'}抽 ${capSample} 条。计算题预算 32000，避免只出思考没有正文。`}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button onClick={onStart} disabled={running} loading={running}>
            {running ? '进行中…' : `开始 · ${count} 条`}
          </Button>
          {running ? (
            <Button size='sm' variant='outline' onClick={onCancel}>
              取消
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label>模型</Label>
          <div className='flex flex-wrap gap-2'>
            {PROBE_MODELS.map((m) => (
              <Button
                key={m.id}
                type='button'
                size='sm'
                variant={
                  setup.displayModels.includes(m.id) ? 'default' : 'outline'
                }
                onClick={() => setup.toggleModel(m.id)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>

        {suite === 'capability' ? (
          <div className='space-y-2'>
            <Label>
              用例{' '}
              <span className='text-xs font-normal text-muted-foreground'>
                作为抽选池 · {setup.random ? '随机抽选' : '按序取前 N 条'}
              </span>
            </Label>
            <div className='flex flex-wrap gap-2'>
              {PROBE_CASES.map((c) => (
                <Button
                  key={c.id}
                  type='button'
                  size='sm'
                  variant={
                    setup.displayCases.includes(c.id) ? 'default' : 'outline'
                  }
                  onClick={() => setup.toggleCase(c.id)}
                >
                  {c.label}
                </Button>
              ))}
              <Button
                type='button'
                size='sm'
                variant={setup.random ? 'default' : 'outline'}
                onClick={setup.toggleRandom}
              >
                随机抽选
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className='space-y-2'>
              <Label>形态</Label>
              <div className='flex flex-wrap gap-2'>
                {PROBE_FORMS.map((f) => (
                  <Button
                    key={f.id}
                    type='button'
                    size='sm'
                    variant={
                      setup.displayForms.includes(f.id) ? 'default' : 'outline'
                    }
                    onClick={() => setup.toggleForm(f.id)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className='space-y-2'>
              <Label>
                题库{' '}
                <span className='text-xs font-normal text-muted-foreground'>
                  {PROBE_BANK} 道 ·{' '}
                  {setup.random ? '随机抽选' : '按库序取前 N 道'}
                </span>
              </Label>
              <Button
                type='button'
                size='sm'
                variant={setup.random ? 'default' : 'outline'}
                onClick={setup.toggleRandom}
              >
                随机抽选
              </Button>
            </div>
          </>
        )}

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <div className='space-y-1'>
            <Label>思考预算上限</Label>
            <Input
              type='number'
              min={2048}
              max={128000}
              step={1024}
              value={setup.maxTokens}
              onChange={(e) => setup.setMaxTokens(Number(e.target.value))}
            />
          </div>
          <div className='space-y-1'>
            <Label>并发</Label>
            <Input
              type='number'
              min={1}
              max={4}
              value={setup.concurrency}
              onChange={(e) => setup.setConcurrency(Number(e.target.value))}
            />
          </div>
          {suite === 'forms' ? (
            <div className='space-y-1'>
              <Label>抽题数</Label>
              <Input
                type='number'
                min={1}
                max={PROBE_SAMPLE_MAX}
                value={setup.sample}
                onChange={(e) => setup.setSample(Number(e.target.value))}
              />
            </div>
          ) : (
            <div className='space-y-1'>
              <Label>抽条数</Label>
              <Input
                type='number'
                min={1}
                max={PROBE_CASES.length}
                value={capSample}
                onChange={(e) => setup.setCapSample(Number(e.target.value))}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
