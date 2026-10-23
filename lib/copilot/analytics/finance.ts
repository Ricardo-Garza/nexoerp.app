import { diffDays } from "../dates"
import type { DemoCustomer, DemoInvoice, IsoDate } from "../types"
import type { DataView } from "./view"

export const AGING_BUCKETS = ["Por vencer", "1-30 días", "31-60 días", "61-90 días", "Más de 90 días"] as const
export type AgingBucket = (typeof AGING_BUCKETS)[number]

export interface InvoiceBalance {
  invoice: DemoInvoice
  customer: DemoCustomer
  paid: number // moneda de la factura
  credited: number // notas de crédito aplicadas
  balance: number // moneda de la factura (con IVA)
  balanceMxn: number
  daysOverdue: number // > 0 = vencida
  bucket: AgingBucket
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function bucketFor(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return "Por vencer"
  if (daysOverdue <= 30) return "1-30 días"
  if (daysOverdue <= 60) return "31-60 días"
  if (daysOverdue <= 90) return "61-90 días"
  return "Más de 90 días"
}

/** Facturas con saldo > 0 a la fecha `asOf`. Saldo = total − pagos − notas de crédito. */
export function openInvoices(view: DataView, asOf: IsoDate = view.asOf, customerId?: string): InvoiceBalance[] {
  const paid = new Map<string, number>()
  for (const p of view.data.payments) if (p.date <= asOf) paid.set(p.invoiceId, (paid.get(p.invoiceId) ?? 0) + p.amount)
  const credited = new Map<string, number>()
  for (const n of view.data.creditNotes) if (n.date <= asOf) credited.set(n.invoiceId, (credited.get(n.invoiceId) ?? 0) + n.total)
  const out: InvoiceBalance[] = []
  for (const inv of view.data.invoices) {
    if (inv.date > asOf) continue
    if (customerId && inv.customerId !== customerId) continue
    const pd = r2(paid.get(inv.id) ?? 0)
    const cr = r2(credited.get(inv.id) ?? 0)
    const balance = r2(inv.total - pd - cr)
    if (balance <= 0.01) continue
    const daysOverdue = diffDays(asOf, inv.dueDate)
    out.push({ invoice: inv, customer: view.customerById.get(inv.customerId)!, paid: pd, credited: cr, balance, balanceMxn: r2(balance * inv.fx), daysOverdue, bucket: bucketFor(daysOverdue) })
  }
  return out
}

export interface ReceivablesSummary {
  totalMxn: number
  overdueMxn: number
  openCount: number
  overdueCount: number
  overdueAmountPct: number | null
  overdueCountPct: number | null
  byBucket: { bucket: AgingBucket; amountMxn: number; count: number }[]
}

export function summarizeReceivables(rows: InvoiceBalance[]): ReceivablesSummary {
  const byBucket = AGING_BUCKETS.map((bucket) => {
    const sel = rows.filter((r) => r.bucket === bucket)
    return { bucket, amountMxn: r2(sel.reduce((s, r) => s + r.balanceMxn, 0)), count: sel.length }
  })
  const totalMxn = r2(rows.reduce((s, r) => s + r.balanceMxn, 0))
  const overdue = rows.filter((r) => r.daysOverdue > 0)
  const overdueMxn = r2(overdue.reduce((s, r) => s + r.balanceMxn, 0))
  return {
    totalMxn,
    overdueMxn,
    openCount: rows.length,
    overdueCount: overdue.length,
    overdueAmountPct: totalMxn > 0 ? Math.round((overdueMxn / totalMxn) * 10000) / 100 : null,
    overdueCountPct: rows.length ? Math.round((overdue.length / rows.length) * 10000) / 100 : null,
    byBucket,
  }
}

export interface CustomerReceivable {
  customer: DemoCustomer
  balanceMxn: number
  overdueMxn: number
  openInvoices: number
  overdueInvoices: number
  maxDaysOverdue: number
}

export function receivablesByCustomer(rows: InvoiceBalance[]): CustomerReceivable[] {
  const acc = new Map<string, CustomerReceivable>()
  for (const r of rows) {
    let c = acc.get(r.customer.id)
    if (!c) {
      c = { customer: r.customer, balanceMxn: 0, overdueMxn: 0, openInvoices: 0, overdueInvoices: 0, maxDaysOverdue: 0 }
      acc.set(r.customer.id, c)
    }
    c.balanceMxn = r2(c.balanceMxn + r.balanceMxn)
    c.openInvoices++
    if (r.daysOverdue > 0) {
      c.overdueMxn = r2(c.overdueMxn + r.balanceMxn)
      c.overdueInvoices++
      c.maxDaysOverdue = Math.max(c.maxDaysOverdue, r.daysOverdue)
    }
  }
  return [...acc.values()]
}
