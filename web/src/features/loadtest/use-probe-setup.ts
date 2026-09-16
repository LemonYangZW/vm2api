import { useState } from 'react'
import {
  PROBE_CASES,
  PROBE_FORMS,
  PROBE_MODELS,
  PROBE_SAMPLE_MAX,
} from '@/features/loadtest/options'

/**
 * 探针（能力/答题共用）的参数状态，镜像 index.html 里挂在全局 `state` 上的
 * `probeModels`/`probeCases`/`probeForms`/`probeSample`/`probeCapSample`/
 * `probeMaxTokens`/`probeConcurrency`/`probeRandom`。不落 localStorage —— index.html
 * 也只在内存里存这份，刷新页面即重置。
 *
 * `models`/`cases`/`forms` 初始为 `undefined`（对应 index.html 的「未设置」），
 * 展示用默认值与提交用默认值并不相同（模型展示默认只有 sonnet-5，
 * 提交默认是全部模型——这是 index.html 本身的行为，这里原样保留）。
 */
export function useProbeSetup() {
  const [models, setModels] = useState<string[] | undefined>(undefined)
  const [cases, setCases] = useState<string[] | undefined>(undefined)
  const [forms, setForms] = useState<string[] | undefined>(undefined)
  const [sample, setSampleState] = useState(4)
  const [capSample, setCapSampleState] = useState(1)
  const [maxTokens, setMaxTokensState] = useState(32000)
  const [concurrency, setConcurrencyState] = useState(1)
  const [random, setRandom] = useState(true)

  function toggle(
    cur: string[] | undefined,
    setFn: (v: string[]) => void,
    id: string,
    all: { id: string }[]
  ) {
    const base = cur ?? all.map((x) => x.id)
    const set = new Set(base)
    if (set.has(id) && set.size === 1) return
    if (set.has(id)) set.delete(id)
    else set.add(id)
    setFn(all.map((x) => x.id).filter((x) => set.has(x)))
  }

  function setMaxTokens(v: number) {
    const n = Number(v)
    setMaxTokensState(
      !Number.isFinite(n) || n <= 0
        ? 32000
        : Math.min(128000, Math.max(1, Math.floor(n)))
    )
  }
  function setConcurrency(v: number) {
    setConcurrencyState(Math.max(1, Math.min(4, Number(v) || 1)))
  }
  function setSample(v: number) {
    setSampleState(Math.max(1, Math.min(PROBE_SAMPLE_MAX, Number(v) || 4)))
  }
  function setCapSample(v: number) {
    setCapSampleState(Math.max(1, Math.min(PROBE_CASES.length, Number(v) || 1)))
  }

  return {
    displayModels: models ?? ['claude-sonnet-5'],
    submitModels: models ?? PROBE_MODELS.map((m) => m.id),
    displayCases: cases ?? PROBE_CASES.map((c) => c.id),
    displayForms: forms ?? PROBE_FORMS.map((f) => f.id),
    sample,
    capSample,
    maxTokens,
    concurrency,
    random,
    toggleModel: (id: string) => toggle(models, setModels, id, PROBE_MODELS),
    toggleCase: (id: string) => toggle(cases, setCases, id, PROBE_CASES),
    toggleForm: (id: string) => toggle(forms, setForms, id, PROBE_FORMS),
    setSample,
    setCapSample,
    setMaxTokens,
    setConcurrency,
    toggleRandom: () => setRandom((r) => !r),
  }
}

export type ProbeSetup = ReturnType<typeof useProbeSetup>
