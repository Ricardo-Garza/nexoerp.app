import { describe, expect, it } from "vitest"
import { openOpportunities, opportunityWinRate, pipelineByStage, quoteConversion } from "@/lib/copilot/analytics/crm"
import { AGING_BUCKETS, openInvoices, summarizeReceivables } from "@/lib/copilot/analytics/finance"
import { linearForecast } from "@/lib/copilot/analytics/forecast"
import { computeStock } from "@/lib/copilot/analytics/inventory"
import { aggregateSales, pctChange, rank, salesSeries, selectRows, totalForFilter } from "@/lib/copilot/analytics/sales"
import { buildDataView } from "@/lib/copilot/analytics/view"
import { getSoleilDemoDataset } from "@/lib/copilot/data/dataset"
import { makeOracle } from "@/lib/copilot/eval/oracle"

const ds = getSoleilDemoDataset()
const view = buildDataView(ds)
const oracle = makeOracle(ds)
const REF = ds.meta.referenceDate

describe("Analytics — ventas contra el oráculo independiente", () => {
  const windows: [string, string][] = [
    ["2026-10-01", REF],
    ["2026-09-01", "2026-09-30"],
    ["2026-01-01", REF],
    ["2025-04-01", REF],
    ["2026-07-01", "2026-09-30"],
  ]
  it.each(windows)("venta neta, costo, margen y pedidos coinciden %s → %s", (from, to) => {
    const g = totalForFilter(view, { from, to })
    const o = oracle.sales(from, to)
    expect(g.netMxn).toBeCloseTo(o.net, 1)
    expect(g.cogsMxn).toBeCloseTo(o.cogs, 1)
    expect(g.marginMxn).toBeCloseTo(o.margin, 1)
    expect(g.marginPct).toBeCloseTo(o.marginPct!, 1)
    expect(g.orders).toBe(o.orders)
  })

  it("margen bruto = venta neta − costo de ventas; margen % = margen / venta neta × 100", () => {
    const g = totalForFilter(view, { from: "2026-01-01", to: REF })
    expect(g.marginMxn).toBeCloseTo(g.netMxn - g.cogsMxn, 1)
    expect(g.marginPct).toBeCloseTo((g.marginMxn / g.netMxn) * 100, 1)
  })

  it("filtros por familia y por cliente coinciden con el oráculo", () => {
    const fam = totalForFilter(view, { from: "2026-01-01", to: REF, families: ["Medio Voltaje"] })
    expect(fam.netMxn).toBeCloseTo(oracle.sales("2026-01-01", REF, { family: "Medio Voltaje" }).net, 1)
    const top = oracle.byCustomer("2026-01-01", REF)[0]
    const cust = totalForFilter(view, { from: "2026-01-01", to: REF, customerId: top[0] })
    expect(cust.netMxn).toBeCloseTo(top[1], 1)
  })

  it("pedidos cancelados no cuentan como venta y los pagos no son ventas nuevas", () => {
    const cancelled = ds.orders.filter((o) => o.status === "Cancelado")
    expect(cancelled.length).toBeGreaterThan(0)
    const docs = new Set(view.salesRows.filter((r) => r.kind === "venta").map((r) => r.docId))
    for (const o of cancelled) expect(docs.has(o.id)).toBe(false)
    expect(view.salesRows.every((r) => r.kind === "venta" || r.kind === "nc")).toBe(true)
  })

  it("USD se convierte con el tipo de cambio del documento", () => {
    const order = ds.orders.find((o) => o.currency === "USD" && o.status !== "Cancelado")!
    const rows = view.salesRows.filter((r) => r.kind === "venta" && r.orderId === order.id)
    expect(rows.reduce((s, r) => s + r.netMxn, 0)).toBeCloseTo(order.subtotal * order.fx, 0)
  })

  it("la cantidad nunca suma metros con piezas: se reporta por unidad", () => {
    const g = totalForFilter(view, { from: "2026-01-01", to: REF })
    expect(Object.keys(g.unitsByUnit).sort()).toEqual(["m", "pza", "rollo"].filter((u) => g.unitsByUnit[u as "m"] !== undefined).sort())
    const pzaRows = view.salesRows.filter((r) => r.unit === "pza")
    expect(pzaRows.length).toBeGreaterThan(0)
    for (const r of pzaRows) expect(r.meters).toBe(0)
  })

  it("agrupaciones: la suma de los grupos iguala el total y las series rellenan huecos", () => {
    const rows = selectRows(view, { from: "2026-01-01", to: REF })
    const total = totalForFilter(view, { from: "2026-01-01", to: REF }).netMxn
    for (const dim of ["customer", "product", "family", "warehouse", "industry", "month", "quarter", "week"] as const) {
      expect(aggregateSales(view, rows, dim).reduce((s, g) => s + g.netMxn, 0), dim).toBeCloseTo(total, 0)
    }
    const monthly = salesSeries(view, { from: "2025-04-01", to: REF }, "month")
    expect(monthly.length).toBe(19)
    expect(salesSeries(view, { from: "2026-10-01", to: "2026-10-07" }, "day")).toHaveLength(7)
  })

  it("rankings ordenan y limitan; crecimiento porcentual maneja base cero", () => {
    const groups = aggregateSales(view, selectRows(view, { from: "2026-01-01", to: REF }), "customer")
    const top = rank(groups, "netMxn", "desc", 5)
    expect(top).toHaveLength(5)
    for (let i = 1; i < top.length; i++) expect(top[i - 1].netMxn).toBeGreaterThanOrEqual(top[i].netMxn)
    expect(pctChange(110, 100)).toBe(10)
    expect(pctChange(50, 0)).toBeNull()
  })
})

describe("Analytics — cobranza, inventario, CRM y pronóstico", () => {
  it("cuentas por cobrar y antigüedad de saldos coinciden con el oráculo", () => {
    const rows = openInvoices(view)
    const s = summarizeReceivables(rows)
    const o = oracle.receivables()
    expect(s.totalMxn).toBeCloseTo(o.total, 1)
    expect(s.overdueMxn).toBeCloseTo(o.overdue, 1)
    expect(s.openCount).toBe(o.open)
    expect(s.overdueCount).toBe(o.overdueCount)
    expect(s.byBucket.map((b) => b.bucket)).toEqual([...AGING_BUCKETS])
    expect(s.byBucket.reduce((a, b) => a + b.amountMxn, 0)).toBeCloseTo(s.totalMxn, 1)
    const over60 = rows.filter((r) => r.daysOverdue > 60).reduce((a, r) => a + r.balanceMxn, 0)
    expect(over60).toBeCloseTo(o.over60, 1)
    expect(rows.every((r) => r.balance > 0)).toBe(true)
  })

  it("el saldo considera pagos parciales y notas de crédito", () => {
    const withCredit = ds.creditNotes[0]
    const inv = ds.invoices.find((i) => i.id === withCredit.invoiceId)!
    const bal = openInvoices(view).find((r) => r.invoice.id === inv.id)
    if (bal) expect(bal.credited).toBeCloseTo(withCredit.total, 1)
    const partial = ds.payments.find((p) => p.amount < (ds.invoices.find((i) => i.id === p.invoiceId)!.total - 1) && ds.payments.filter((q) => q.invoiceId === p.invoiceId).length === 1)
    if (partial) {
      const row = openInvoices(view).find((r) => r.invoice.id === partial.invoiceId)
      expect(row?.paid ?? partial.amount).toBeCloseTo(partial.amount, 1)
    }
  })

  it("inventario: existencias = Σ movimientos, stock bajo mínimo y valor a costo", () => {
    const stock = computeStock(view)
    const o = oracle.stock()
    expect(stock.filter((s) => s.belowMin).length).toBe(o.below)
    expect(stock.reduce((a, s) => a + s.valueMxn, 0)).toBeCloseTo(o.value, 0)
    for (const s of stock) expect(s.totalQty).toBe(o.bySku.get(s.product.sku) ?? 0)
    expect(stock.some((s) => s.turnover12m !== null)).toBe(true)
  })

  it("CRM: pipeline, ponderado y conversión coinciden con el oráculo", () => {
    const o = oracle.crm()
    const open = openOpportunities(view)
    expect(open.length).toBe(o.openCount)
    const st = pipelineByStage(open)
    expect(st.reduce((a, x) => a + x.amountMxn, 0)).toBeCloseTo(o.pipeline, 1)
    expect(st.reduce((a, x) => a + x.weightedMxn, 0)).toBeCloseTo(o.weighted, 1)
    expect(quoteConversion(view).won).toBe(o.quotesWon)
    expect(quoteConversion(view).ratePct).toBe(o.quoteRate)
    expect(opportunityWinRate(view).ratePct).toBe(o.oppRate)
  })

  it("pronóstico lineal recupera una serie exacta y exige historia suficiente", () => {
    const f = linearForecast([10, 12, 14, 16, 18, 20, 22, 24], 2)!
    expect(f.slope).toBeCloseTo(2, 6)
    expect(f.points[0].predicted).toBeCloseTo(26, 6)
    expect(f.r2).toBeCloseTo(1, 6)
    expect(linearForecast([1, 2, 3], 2)).toBeNull()
  })
})
