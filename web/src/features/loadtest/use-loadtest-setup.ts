import { useEffect, useState } from 'react'
import type { LoadtestStock } from '@/types/panel-loadtest'
import { LT_MODELS, LT_STOCKS } from '@/features/loadtest/options'

/**
 * 研报 tab 的本地设置持久化，镜像 index.html 的 `ltSaveSetup`/`ltLoadSetup`
 * （`localStorage` key `kin_lt_setup`）。刷新页面后标的/模型/轮次/思考预算
 * 不会被重置回默认值。
 */
const LS_KEY = 'kin_lt_setup'

type StoredSetup = {
  stocks?: Array<{ ticker?: string; name?: string } | string>
  models?: string[]
  concurrency?: number
  turns?: number
  maxTokens?: number
}

function readStored(): StoredSetup | null {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null') as unknown
    if (!raw || typeof raw !== 'object') return null
    return raw as StoredSetup
  } catch {
    return null
  }
}

function writeStored(patch: StoredSetup) {
  try {
    const prev = readStored() || {}
    localStorage.setItem(LS_KEY, JSON.stringify({ ...prev, ...patch }))
  } catch {
    /* localStorage 不可用时静默降级为纯内存 */
  }
}

function normalizeStocks(raw: StoredSetup['stocks']): LoadtestStock[] | null {
  if (!Array.isArray(raw) || !raw.length) return null
  const out: LoadtestStock[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      const ticker = item.trim().toUpperCase()
      if (ticker) out.push({ ticker, name: ticker })
      continue
    }
    const ticker = String(item?.ticker || '')
      .trim()
      .toUpperCase()
    if (!ticker) continue
    out.push({ ticker, name: String(item?.name || ticker) })
  }
  return out.length ? out : null
}

export type LoadtestSetup = {
  stocks: LoadtestStock[]
  models: string[]
  concurrency: number
  turns: number
  maxTokens: number
  toggleModel: (id: string) => void
  addStock: (ticker: string, name?: string) => { ok: boolean; message: string }
  removeStock: (ticker: string) => { ok: boolean; message: string }
  resetStocks: () => void
  setConcurrency: (value: number) => void
  setTurns: (value: number) => void
  setMaxTokens: (value: number) => void
}

export function useLoadtestSetup(): LoadtestSetup {
  const [stocks, setStocksState] = useState<LoadtestStock[]>(() => {
    const stored = normalizeStocks(readStored()?.stocks)
    return stored || LT_STOCKS.map((s) => ({ ...s }))
  })
  const [models, setModelsState] = useState<string[]>(() => {
    const stored = readStored()?.models
    return Array.isArray(stored) && stored.length
      ? stored
      : LT_MODELS.map((m) => m.id)
  })
  const [concurrency, setConcurrencyState] = useState<number>(() =>
    Math.max(1, Math.min(20, Number(readStored()?.concurrency) || 10))
  )
  const [turns, setTurnsState] = useState<number>(() =>
    Math.max(1, Math.min(3, Number(readStored()?.turns) || 2))
  )
  const [maxTokens, setMaxTokensState] = useState<number>(() => {
    const n = Number(readStored()?.maxTokens)
    return Number.isFinite(n) && n > 0 ? Math.min(128000, n) : 32000
  })

  useEffect(() => {
    writeStored({ stocks, models, concurrency, turns, maxTokens })
  }, [stocks, models, concurrency, turns, maxTokens])

  function toggleModel(id: string) {
    setModelsState((cur) => {
      const set = new Set(cur)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      const next = LT_MODELS.map((m) => m.id).filter((x) => set.has(x))
      return next.length ? next : [id]
    })
  }

  function addStock(ticker: string, name?: string) {
    const code = ticker
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9.]/g, '')
    if (!code || code.length > 10)
      return { ok: false, message: '代码 1–10 位字母数字' }
    if (stocks.some((s) => s.ticker === code)) {
      return { ok: false, message: `${code} 已在列表中` }
    }
    const preset = LT_STOCKS.find((s) => s.ticker === code)
    setStocksState((cur) => [
      ...cur,
      { ticker: code, name: (name || preset?.name || code).trim() || code },
    ])
    return { ok: true, message: '' }
  }

  function removeStock(ticker: string) {
    if (stocks.length <= 1) return { ok: false, message: '至少保留一只标的' }
    setStocksState((cur) => cur.filter((s) => s.ticker !== ticker))
    return { ok: true, message: '' }
  }

  function resetStocks() {
    setStocksState(LT_STOCKS.map((s) => ({ ...s })))
  }

  function setConcurrency(v: number) {
    setConcurrencyState(Math.max(1, Math.min(20, Number(v) || 10)))
  }

  function setTurns(v: number) {
    setTurnsState(Math.max(1, Math.min(3, Number(v) || 2)))
  }

  function setMaxTokens(v: number) {
    const n = Number(v)
    setMaxTokensState(
      !Number.isFinite(n) || n <= 0
        ? 32000
        : Math.min(128000, Math.max(1, Math.floor(n)))
    )
  }

  return {
    stocks,
    models,
    concurrency,
    turns,
    maxTokens,
    toggleModel,
    addStock,
    removeStock,
    resetStocks,
    setConcurrency,
    setTurns,
    setMaxTokens,
  }
}
