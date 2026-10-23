import { formatDateEs } from "../dates"
import { fmtInt, fmtMxn, fmtPct } from "../format"
import type { CopilotResult, Evidence, EvidenceRecord, Kpi, TableColumn } from "../result"
import type { AnalyticalQuery } from "../schema"
import type { SalesFilter } from "../analytics/sales"
import type { SalesRow, DataView } from "../analytics/view"
import type { PeriodSpec } from "../nlu/entities"

export interface HandlerCtx {
  view: DataView
  plan: AnalyticalQuery
  source: string
  confidence: number
}

export const MAX_TABLE_ROWS = 25

export function emptyResult(c: HandlerCtx, title: string): CopilotResult {
  return {
    status: "ok",
    intent: c.plan.intent,
    title,
    summary: "",
    kpis: [],
    assumptions: [],
    caveats: [],
    followUps: [],
    confidence: c.confidence,
    plan: c.plan,
    demo: true,
  }
}

export function noData(c: HandlerCtx, title: string, message: string): CopilotResult {
  return { ...emptyResult(c, title), status: "no_data", summary: message }
}

export function kpi(label: string, value: string, extra: Partial<Kpi> = {}): Kpi {
  return { label, value, ...extra }
}

export function col(key: string, label: string, format: TableColumn["format"] = "text"): TableColumn {
  return { key, label, format, align: format === "text" || format === "date" ? "left" : "right" }
}

export function salesFilter(plan: AnalyticalQuery, period: PeriodSpec | { from: string; to: string } | undefined = plan.period): SalesFilter {
  const f = plan.filters
  return {
    from: period?.from,
    to: period?.to,
    customerId: f.customerId,
    customerIds: f.customerIds,
    families: f.families,
    sku: f.sku,
    warehouseId: f.warehouseId,
    industry: f.industry,
    currency: f.currency,
  }
}

export function describeFilters(c: HandlerCtx): string[] {
  const f = c.plan.filters
  const out: string[] = []
  if (f.customerId) out.push(`Cliente: ${c.view.customerById.get(f.customerId)?.name ?? f.customerId}`)
  if (f.families?.length) out.push(`Familia: ${f.families.join(", ")}`)
  if (f.sku) out.push(`SKU: ${f.sku}`)
  if (f.warehouseId) out.push(`Almacén: ${c.view.data.warehouses.find((w) => w.id === f.warehouseId)?.name ?? f.warehouseId}`)
  if (f.industry) out.push(`Industria del cliente: ${f.industry}`)
  if (f.currency) out.push(`Moneda del documento: ${f.currency}`)
  return out
}

export function scopeText(c: HandlerCtx): string {
  const parts = describeFilters(c)
  return parts.length ? ` (${parts.join(" · ")})` : ""
}

/** Pedidos que respaldan una cifra de ventas (los de mayor importe). */
export function salesEvidence(c: HandlerCtx, rows: SalesRow[], calc: string): Evidence {
  const byDoc = new Map<string, { row: SalesRow; net: number }>()
  for (const r of rows) {
    const key = `${r.kind}:${r.docId}`
    const cur = byDoc.get(key)
    if (cur) cur.net += r.netMxn
    else byDoc.set(key, { row: r, net: r.netMxn })
  }
  const docs = [...byDoc.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
  const records: EvidenceRecord[] = docs.slice(0, 15).map(({ row, net }) => ({
    kind: row.kind === "nc" ? "nota_credito" : "pedido",
    id: row.docId,
    date: row.date,
    who: c.view.customerById.get(row.customerId)?.name ?? row.customerId,
    amountMxn: Math.round(net * 100) / 100,
  }))
  return { calc, source: c.source, records, totalRecords: docs.length }
}

export function periodNote(p: PeriodSpec | { from: string; to: string; label: string; partial?: boolean }): string {
  return `${p.label} (${formatDateEs(p.from)} – ${formatDateEs(p.to)})`
}

export function coverageCaveat(c: HandlerCtx, p: { from: string }): string | null {
  const start = c.view.data.meta.rangeStart
  if (p.from < start) return `Solo hay datos desde ${formatDateEs(start)}; las cifras anteriores a esa fecha no existen en el dataset.`
  return null
}

export { fmtInt, fmtMxn, fmtPct }
