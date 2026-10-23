import type { AnalyticalQuery, SessionMemory } from "./schema"

export type ValueFormat = "currency" | "number" | "percent" | "date" | "text"

export interface Kpi {
  label: string
  value: string
  raw?: number
  detail?: string
  tone?: "neutral" | "good" | "bad" | "warn"
}

export interface ChartSeries {
  key: string
  label: string
}

export interface ChartSpec {
  kind: "bar" | "line" | "area" | "donut" | "comparison"
  title: string
  xKey: string
  series: ChartSeries[]
  data: Record<string, string | number | null>[]
  format: ValueFormat
  /** Índice desde el cual los datos son pronóstico (línea punteada). */
  forecastFrom?: number
}

export interface TableColumn {
  key: string
  label: string
  format?: ValueFormat
  align?: "left" | "right"
}

export interface TableSpec {
  columns: TableColumn[]
  rows: Record<string, string | number | null>[]
  totalRows: number
}

export interface EvidenceRecord {
  kind: "pedido" | "factura" | "nota_credito" | "oportunidad" | "cotizacion" | "producto" | "cliente" | "movimiento"
  id: string
  date: string | null
  who: string
  amountMxn: number | null
  detail?: string
}

export interface Evidence {
  /** Cómo se calculó la cifra, en una o dos líneas legibles. */
  calc: string
  /** De dónde salen los datos (siempre el adaptador activo). */
  source: string
  records: EvidenceRecord[]
  totalRecords: number
}

export type ResultStatus = "ok" | "clarify" | "no_data" | "refused" | "delegate" | "error"

export interface CopilotResult {
  status: ResultStatus
  intent: string
  title: string
  summary: string
  kpis: Kpi[]
  chart?: ChartSpec
  table?: TableSpec
  evidence?: Evidence
  assumptions: string[]
  caveats: string[]
  followUps: string[]
  /** Opciones para aclarar una consulta ambigua; `query` se reenvía tal cual al elegir. */
  options?: { label: string; query: string }[]
  confidence: number
  /** El usuario pidió exportar: la UI descarga el CSV del resultado. */
  exportRequested?: boolean
  interpretation?: string
  plan?: AnalyticalQuery
  demo: true
}

export interface CopilotResponse {
  result: CopilotResult
  memory: SessionMemory
}
