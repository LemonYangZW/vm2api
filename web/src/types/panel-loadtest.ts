/* ── 压测 loadtest（POST /concurrent-test、POST /probe-test） ─────────── */

export type LoadtestStock = { ticker: string; name?: string }

/** `publicSession()` 单条会话里的单轮记录，`GET .../{id}?text=1` 才带 `text`。 */
export type LoadtestTurn = {
  n: number
  ok?: boolean
  status?: number
  duration_ms?: number
  ttft_ms?: number | null
  chars?: number
  stop_reason?: string | null
  usage?: { input_tokens?: number; output_tokens?: number } | null
  preview?: string
  error?: string | null
  saved_path?: string | null
  finished?: boolean
  text?: string
}

/** `publicSession()`：`sessions[]` 里的一条并发会话。 */
export type LoadtestSession = {
  id?: string
  index: number
  ticker: string
  name?: string
  model: string
  status: string
  turn?: number
  turns_done?: number
  turns_planned?: number
  duration_ms?: number
  error?: string | null
  turns: LoadtestTurn[]
}

export type LoadtestSummary = {
  total?: number
  finished?: number
  ok?: number
  error?: number
  cancelled?: number
  running?: number
  success_rate?: number
  duration_ms?: {
    p50?: number | null
    p95?: number | null
    max?: number | null
  }
  ttft_ms?: { p50?: number | null; p95?: number | null }
  tokens?: { input?: number; output?: number }
  by_model?: Record<string, { total: number; ok: number; error: number }>
  by_ticker?: Record<string, { total: number; ok: number; error: number }>
}

/** `publicRun()` in `concurrent-test.mjs`. */
export type LoadtestRun = {
  id: string
  status: string
  started_at?: string
  finished_at?: string | null
  duration_ms?: number
  concurrency: number
  start_stagger_ms?: number
  turns: number
  models: string[]
  stocks: LoadtestStock[]
  max_tokens?: number
  report_day?: string | null
  reports_dir?: string | null
  stream?: boolean
  error?: string | null
  summary?: LoadtestSummary
  report_markdown?: string | null
  sessions: LoadtestSession[]
}

export type LoadtestReportItem = {
  day: string
  name: string
  bytes?: number
  mtime?: string
  path?: string
}

/** `listSavedReports()` response. */
export type LoadtestReportsPayload = {
  root?: string
  days?: string[]
  day?: string | null
  items?: LoadtestReportItem[]
}

/** `readSavedReport()` response. */
export type LoadtestReportText = {
  day: string
  name: string
  path?: string
  text: string
}

/** 探针结果条目的流式进度快照（`item.stream`）。 */
export type ProbeStream = {
  phase?: string
  max_tokens?: number
  tokens_out?: number
  chars?: number
  thinking_chars?: number
  turn?: number
}

/** `publicItem()` in `probe-test.mjs`。 */
export type ProbeItem = {
  id?: string
  suite?: string
  model: string
  case_id?: string | null
  label?: string | null
  form?: string | null
  question_id?: string | null
  status: string
  http?: number | null
  exact?: boolean
  reasoned?: boolean
  ok?: boolean
  anomalies?: string[]
  stop_reason?: string | null
  duration_ms?: number | null
  usage?: { input_tokens?: number; output_tokens?: number } | null
  preview?: string
  error?: string | null
  answer?: string | null
  stream?: ProbeStream | null
  thinking_chars?: number
  raw_summary?: {
    status?: number
    error?: string | null
    request_model?: string | null
    response_error?: unknown
  }
  text?: string
  thinking?: string
  raw?: unknown
}

export type ProbeSummary = {
  total?: number
  finished?: number
  exact?: number
  mismatch?: number
  empty?: number
  truncated?: number
  refusal?: number
  thinking_only?: number
  running?: number
  pending?: number
  progress?: number
  accuracy?: number
  anomalies?: Record<string, number>
  by_model?: Record<string, { total: number; exact: number; anomaly: number }>
}

/** `publicRun()` in `probe-test.mjs`。 */
export type ProbeRun = {
  kind?: 'probe'
  id: string
  suite: string
  status: string
  started_at?: string
  finished_at?: string | null
  duration_ms?: number
  models: string[]
  forms?: string[]
  questions?: string[]
  sample?: number | null
  seed?: number | null
  random?: boolean | null
  bank?: number
  cases?: string[]
  max_tokens?: number
  concurrency?: number
  error?: string | null
  summary?: ProbeSummary
  items: ProbeItem[]
}
