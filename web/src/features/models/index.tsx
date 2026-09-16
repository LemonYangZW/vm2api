import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBlocker } from '@tanstack/react-router'
import { VIEW_TITLES } from '@/config/nav'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { CardGridSkeleton, TableSkeleton } from '@/components/page-skeletons'
import { QueryGate } from '@/components/query-gate'
import { modelPolicyQueryOptions } from '@/features/models/queries'
import { ModelAdvanced } from './model-advanced'
import { ModelRow } from './model-row'
import {
  type BetaFilter,
  type CatalogMode,
  type ModelEntry,
  type ModelParams,
  type ModelPolicy,
  type Pass1mMode,
  type PolicyDefaults,
  type PolicyPayload,
  applyPassContext1m,
  cloneJson,
  familyOptions,
  filterModels,
  hydratePolicy,
  listModelEntries,
  policyStats,
} from './policy'

const BETA_FILTERS: [BetaFilter, string][] = [
  ['all', '全部'],
  ['pass', '透传 1M'],
  ['strip', '剥离'],
  ['inherit', '跟随通配'],
]

export function ModelsPage() {
  const qc = useQueryClient()
  const [catalogPlatform, setCatalogPlatform] = useState<
    'anthropic' | 'openai'
  >('anthropic')
  const q = useQuery(modelPolicyQueryOptions(catalogPlatform))
  const [draft, setDraft] = useState<ModelPolicy>(() => hydratePolicy(null))
  const [savedSnap, setSavedSnap] = useState('')
  const [qtext, setQtext] = useState('')
  const [family, setFamily] = useState('all')
  const [beta, setBeta] = useState<BetaFilter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!q.data) return
    const pol = hydratePolicy(q.data.policy)
    setDraft(pol)
    setSavedSnap(JSON.stringify(pol))
  }, [q.data])

  const all = useMemo(() => listModelEntries(draft), [draft])
  const effectiveIds = useMemo(() => {
    const ids = new Set<string>()
    for (const row of q.data?.effective || []) {
      if (row.id) ids.add(row.id)
    }
    return ids
  }, [q.data?.effective])
  const visible = useMemo(
    () => filterModels(all, draft, qtext, family, beta),
    [all, draft, qtext, family, beta]
  )
  const families = useMemo(() => familyOptions(all), [all])
  const stats = policyStats(all, draft, effectiveIds)
  const dirty = JSON.stringify(draft) !== savedSnap

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [dirty])

  // beforeunload only covers tab close/reload — client-side route changes
  // (sidebar nav, browser back) go through the router and never fire it.
  useBlocker({
    shouldBlockFn: () => {
      if (!dirty) return false
      return !window.confirm(
        '有未保存更改。离开模型页会丢弃这些改动，确认离开？'
      )
    },
    enableBeforeUnload: false,
  })

  const save = useMutation({
    mutationFn: () =>
      api('/api/panel/model-policy', {
        method: 'PUT',
        body: JSON.stringify({ policy: draft, platform: catalogPlatform }),
      }),
    onSuccess: async () => {
      toast.success('模型策略已保存')
      await qc.invalidateQueries({
        queryKey: modelPolicyQueryOptions(catalogPlatform).queryKey,
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const reset = useMutation({
    mutationFn: () =>
      api('/api/panel/model-policy/reset', {
        method: 'POST',
        body: JSON.stringify({ platform: catalogPlatform }),
      }),
    onSuccess: async () => {
      toast.success('已恢复默认')
      await qc.invalidateQueries({
        queryKey: modelPolicyQueryOptions(catalogPlatform).queryKey,
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const sync = useMutation({
    mutationFn: () =>
      api<PolicyPayload>('/api/panel/model-policy/sync-worker', {
        method: 'POST',
        body: '{}',
      }),
    onSuccess: async (data) => {
      toast.success(`已同步 Worker 目录 (${data.synced || 0})`)
      await qc.invalidateQueries({
        queryKey: modelPolicyQueryOptions('anthropic').queryKey,
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const syncGpt = useMutation({
    mutationFn: () =>
      api<PolicyPayload>('/api/panel/model-policy/sync-codex', {
        method: 'POST',
        body: '{}',
      }),
    onSuccess: async (data) => {
      toast.success(`已同步 GPT 目录 (${data.synced || 0})`)
      await qc.invalidateQueries({
        queryKey: modelPolicyQueryOptions('openai').queryKey,
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function patchModel(id: string, fn: (rec: Omit<ModelEntry, 'id'>) => void) {
    setDraft((prev) => {
      const next = cloneJson(prev)
      const rec = next.models?.[id]
      if (!rec) return prev
      fn(rec)
      return next
    })
  }

  function setParam(
    id: string,
    key: keyof ModelParams,
    value: string | number
  ) {
    patchModel(id, (rec) => {
      rec.params = rec.params || {}
      if (key === 'on_enabled') {
        rec.params.on_enabled =
          value === 'convert_to_adaptive' ? 'passthrough' : String(value)
        return
      }
      if (key === 'on_adaptive') {
        rec.params.on_adaptive = String(value)
        return
      }
      rec.params[key] = Number(value) || 0
    })
  }

  function batch(action: 'enable' | 'disable' | 'invert') {
    setDraft((prev) => {
      const next = cloneJson(prev)
      for (const rec of Object.values(next.models || {})) {
        if (action === 'enable') rec.enabled = true
        else if (action === 'disable') rec.enabled = false
        else rec.enabled = rec.enabled === false
      }
      return next
    })
  }

  function requestExpand(id: string) {
    if (expanded && expanded !== id && dirty) {
      const ok = window.confirm(
        '有未保存更改。切换模型不会丢草稿，离开页面前请先保存。仍要切换？'
      )
      if (!ok) return
    }
    setExpanded((cur) => (cur === id ? null : id))
  }

  function setPass1m(id: string, mode: Pass1mMode) {
    patchModel(id, (rec) => applyPassContext1m(rec, mode))
  }

  function patchDefaults(patch: Partial<PolicyDefaults>) {
    setDraft((prev) => {
      const next = cloneJson(prev)
      next.defaults = { ...(next.defaults || {}), ...patch }
      return next
    })
  }

  function setCatalog(mode: CatalogMode) {
    setDraft((prev) => {
      const next = cloneJson(prev)
      next.catalog_mode = mode
      return next
    })
  }

  return (
    <PageHeader
      title={VIEW_TITLES.models}
      extra={
        <div className='flex flex-wrap gap-2'>
          <Button
            variant={catalogPlatform === 'anthropic' ? 'default' : 'outline'}
            onClick={() => setCatalogPlatform('anthropic')}
          >
            Claude
          </Button>
          <Button
            variant={catalogPlatform === 'openai' ? 'default' : 'outline'}
            onClick={() => setCatalogPlatform('openai')}
          >
            GPT
          </Button>
          <Button
            variant='outline'
            onClick={() => sync.mutate()}
            disabled={
              sync.isPending ||
              syncGpt.isPending ||
              catalogPlatform !== 'anthropic'
            }
          >
            {sync.isPending ? '同步中…' : '同步 Worker'}
          </Button>
          <Button
            variant='outline'
            onClick={() => syncGpt.mutate()}
            disabled={
              sync.isPending ||
              syncGpt.isPending ||
              catalogPlatform !== 'openai'
            }
          >
            {syncGpt.isPending ? '同步中…' : '同步 GPT'}
          </Button>
          <Button
            variant='outline'
            onClick={() => {
              if (
                dirty &&
                !window.confirm(
                  '恢复官方默认模型矩阵？自定义开关与参数将丢失。'
                )
              ) {
                return
              }
              reset.mutate()
            }}
            disabled={reset.isPending}
          >
            恢复默认
          </Button>
          <Button
            variant={dirty ? 'default' : 'outline'}
            onClick={() => save.mutate()}
            disabled={save.isPending || !dirty}
          >
            {dirty ? '保存更改' : '已保存'}
          </Button>
        </div>
      }
    >
      <QueryGate
        loading={q.isLoading}
        error={q.error}
        skeleton={
          <div className='space-y-3'>
            <div className='flex flex-wrap gap-3'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className='h-5 w-20 rounded-md bg-muted' />
              ))}
            </div>
            <CardGridSkeleton cards={1} className='grid-cols-1' />
            <TableSkeleton rows={8} columns={7} />
            <div className='h-10 rounded-lg bg-muted' />
          </div>
        }
      >
        <p className='mb-3 text-sm text-muted-foreground'>
          本页只服务 oauth 分类。绑 API 的 sk-kin 走「API」页 catalog。
        </p>
        {dirty ? (
          <p className='mb-3 text-sm text-[color:var(--status-caution)]'>
            有未保存更改。离开页面或切换模型前请先保存。
          </p>
        ) : null}
        <div className='mb-3 flex flex-wrap gap-4 text-sm'>
          <span>
            配置 <b>{stats.configured}</b>
          </span>
          <span>
            启用 <b>{stats.enabled}</b>
          </span>
          <span>
            对外 <b>{stats.live}</b>
          </span>
          <span>
            1M beta <b>{stats.pass1m}</b>
          </span>
        </div>
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <Input
            className='w-56'
            type='search'
            placeholder='搜索模型 / 别名…'
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
          />
          {families.map((f) => (
            <Button
              key={f}
              size='sm'
              variant={family === f ? 'default' : 'outline'}
              onClick={() => setFamily(f)}
            >
              {f === 'all' ? '全部' : f}
            </Button>
          ))}
        </div>
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          {BETA_FILTERS.map(([id, lab]) => (
            <Button
              key={id}
              size='sm'
              variant={beta === id ? 'default' : 'outline'}
              onClick={() => setBeta(id)}
            >
              {lab}
            </Button>
          ))}
          <div className='ms-auto flex flex-wrap gap-2'>
            <Button size='sm' variant='ghost' onClick={() => batch('enable')}>
              全开
            </Button>
            <Button size='sm' variant='ghost' onClick={() => batch('disable')}>
              全关
            </Button>
            <Button size='sm' variant='ghost' onClick={() => batch('invert')}>
              反选
            </Button>
          </div>
        </div>
        {visible.length === 0 ? (
          <EmptyState
            reason={
              qtext || family !== 'all' || beta !== 'all'
                ? '无匹配模型。改搜索或筛选条件。'
                : '暂无模型配置。可先同步 Worker 目录。'
            }
          />
        ) : (
          <div className='overflow-x-auto rounded-lg border border-border/60'>
            <div className='min-w-[920px]'>
              <div className='flex h-8 items-center border-b bg-muted/30 text-[11px] font-medium tracking-wide text-muted-foreground/80'>
                <div className='w-14 shrink-0 pl-3'>启用</div>
                <div className='min-w-[180px] flex-[1.6] px-1.5'>模型</div>
                <div className='min-w-[70px] flex-[0.6] px-1.5'>窗口</div>
                <div className='min-w-[140px] flex-[0.9] px-1.5'>
                  官方 1M beta
                </div>
                <div className='min-w-[110px] flex-[0.9] px-1.5'>Thinking</div>
                <div className='min-w-[70px] flex-[0.6] px-1.5'>目录</div>
                <div className='w-10 shrink-0 pr-2' />
              </div>
              {visible.map((m) => (
                <ModelRow
                  key={m.id}
                  model={m}
                  live={effectiveIds.has(m.id)}
                  pol={draft}
                  open={expanded === m.id}
                  onToggleOpen={() => requestExpand(m.id)}
                  onToggleEnabled={(on) =>
                    patchModel(m.id, (rec) => {
                      rec.enabled = on
                    })
                  }
                  onParam={(key, value) => setParam(m.id, key, value)}
                  onPass1m={(mode) => setPass1m(m.id, mode)}
                />
              ))}
            </div>
          </div>
        )}
        <ModelAdvanced
          pol={draft}
          onCatalogMode={setCatalog}
          onDefaults={patchDefaults}
        />
      </QueryGate>
    </PageHeader>
  )
}
