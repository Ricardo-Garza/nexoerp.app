import type { DemoDataset, IsoDate } from "../types"

/**
 * Oráculo de evaluación: recalcula las cifras clave con bucles simples sobre los datos crudos,
 * SIN usar `analytics/*`. Implementa las reglas de negocio documentadas
 * (docs/MOCK_DATA_DICTIONARY.md) de forma independiente para detectar errores del motor.
 */
const r2 = (n: number) => Math.round(n * 100) / 100
const days = (a: IsoDate, b: IsoDate) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000)

export interface SalesOpts {
  family?: string
  customerId?: string
}

export function makeOracle(ds: DemoDataset) {
  const family = new Map(ds.products.map((p) => [p.sku, p.family]))
  const invoice = new Map(ds.invoices.map((i) => [i.id, i]))
  const order = new Map(ds.orders.map((o) => [o.id, o]))
  const ref = ds.meta.referenceDate

  function sales(from: IsoDate, to: IsoDate, o: SalesOpts = {}) {
    let net = 0
    let lineNet = 0
    let cogs = 0
    const orderIds = new Set<string>()
    for (const ord of ds.orders) {
      if (ord.status === "Cancelado" || ord.date < from || ord.date > to) continue
      if (o.customerId && ord.customerId !== o.customerId) continue
      for (const l of ord.lines) {
        if (o.family && family.get(l.sku) !== o.family) continue
        net += r2(l.lineTotal * ord.fx)
        lineNet += r2(l.lineTotal * ord.fx)
        cogs += r2(l.qty * l.unitCostMxn)
        orderIds.add(ord.id)
      }
    }
    for (const n of ds.creditNotes) {
      if (n.date < from || n.date > to) continue
      if (o.customerId && n.customerId !== o.customerId) continue
      const amount = r2(n.subtotal * n.fx)
      if (n.returnLines.length) {
        const rl = n.returnLines[0]
        if (o.family && family.get(rl.sku) !== o.family) continue
        net -= amount
        cogs -= n.costReversalMxn
      } else {
        const ord = order.get(invoice.get(n.invoiceId)!.orderId)!
        const base = ord.lines.reduce((s, l) => s + l.lineTotal, 0)
        for (const l of ord.lines) {
          if (o.family && family.get(l.sku) !== o.family) continue
          net -= r2(amount * (l.lineTotal / base))
        }
      }
    }
    return { net: r2(net), lineNet: r2(lineNet), cogs: r2(cogs), margin: r2(net - cogs), marginPct: net > 0 ? Math.round(((net - cogs) / net) * 10000) / 100 : null, orders: orderIds.size }
  }

  function byCustomer(from: IsoDate, to: IsoDate, o: SalesOpts = {}) {
    const m = new Map<string, number>()
    for (const c of ds.customers) {
      const s = sales(from, to, { ...o, customerId: c.id }).net
      if (s > 0) m.set(c.id, s)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }

  function bySku(from: IsoDate, to: IsoDate) {
    const m = new Map<string, { net: number; cogs: number }>()
    for (const ord of ds.orders) {
      if (ord.status === "Cancelado" || ord.date < from || ord.date > to) continue
      for (const l of ord.lines) {
        const cur = m.get(l.sku) ?? { net: 0, cogs: 0 }
        cur.net += r2(l.lineTotal * ord.fx)
        cur.cogs += r2(l.qty * l.unitCostMxn)
        m.set(l.sku, cur)
      }
    }
    for (const n of ds.creditNotes) {
      if (n.date < from || n.date > to) continue
      const amount = r2(n.subtotal * n.fx)
      if (n.returnLines.length) {
        const cur = m.get(n.returnLines[0].sku) ?? { net: 0, cogs: 0 }
        cur.net -= amount
        cur.cogs -= n.costReversalMxn
        m.set(n.returnLines[0].sku, cur)
      } else {
        const ord = order.get(invoice.get(n.invoiceId)!.orderId)!
        const base = ord.lines.reduce((s, l) => s + l.lineTotal, 0)
        for (const l of ord.lines) {
          const cur = m.get(l.sku) ?? { net: 0, cogs: 0 }
          cur.net -= r2(amount * (l.lineTotal / base))
          m.set(l.sku, cur)
        }
      }
    }
    return m
  }

  function byFamily(from: IsoDate, to: IsoDate) {
    const fams = [...new Set(ds.products.map((p) => p.family))]
    return fams.map((f) => [f, sales(from, to, { family: f }).net] as const).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  }

  function receivables(asOf: IsoDate = ref) {
    let total = 0
    let overdue = 0
    let open = 0
    let overdueCount = 0
    let over60 = 0
    const perCustomer = new Map<string, number>()
    for (const inv of ds.invoices) {
      if (inv.date > asOf) continue
      const paid = ds.payments.filter((p) => p.invoiceId === inv.id && p.date <= asOf).reduce((s, p) => s + p.amount, 0)
      const credited = ds.creditNotes.filter((n) => n.invoiceId === inv.id && n.date <= asOf).reduce((s, n) => s + n.total, 0)
      const bal = r2(inv.total - paid - credited)
      if (bal <= 0.01) continue
      const mxn = r2(bal * inv.fx)
      total += mxn
      open++
      perCustomer.set(inv.customerId, (perCustomer.get(inv.customerId) ?? 0) + mxn)
      const late = days(asOf, inv.dueDate)
      if (late > 0) {
        overdue += mxn
        overdueCount++
      }
      if (late > 60) over60 += mxn
    }
    return { total: r2(total), overdue: r2(overdue), open, overdueCount, over60: r2(over60), topDebtor: [...perCustomer.entries()].sort((a, b) => b[1] - a[1])[0] }
  }

  function stock() {
    const bySku = new Map<string, number>()
    for (const m of ds.movements) bySku.set(m.sku, (bySku.get(m.sku) ?? 0) + m.qty)
    const below = ds.products.filter((p) => (bySku.get(p.sku) ?? 0) < p.minStock)
    let value = 0
    for (const p of ds.products) value += (bySku.get(p.sku) ?? 0) * p.costMxn
    return { bySku, below: below.length, value: r2(value) }
  }

  function crm() {
    const open = ds.opportunities.filter((o) => ["Prospecto", "Calificada", "Cotizada", "Negociación"].includes(o.stage))
    const won = ds.quotes.filter((q) => q.status === "Ganada").length
    const closed = ds.quotes.filter((q) => ["Ganada", "Perdida", "Vencida"].includes(q.status)).length
    const oppWon = ds.opportunities.filter((o) => o.stage === "Ganada").length
    const oppLost = ds.opportunities.filter((o) => o.stage === "Perdida").length
    return {
      openCount: open.length,
      pipeline: r2(open.reduce((s, o) => s + o.amountMxn, 0)),
      weighted: r2(open.reduce((s, o) => s + (o.amountMxn * o.probability) / 100, 0)),
      quotesTotal: ds.quotes.length,
      quotesWon: won,
      quoteRate: closed ? Math.round((won / closed) * 10000) / 100 : null,
      oppRate: oppWon + oppLost ? Math.round((oppWon / (oppWon + oppLost)) * 10000) / 100 : null,
    }
  }

  function inactiveCustomers(daysWithout: number) {
    const last = new Map<string, IsoDate>()
    for (const o of ds.orders) if (o.status !== "Cancelado" && (!last.has(o.customerId) || o.date > last.get(o.customerId)!)) last.set(o.customerId, o.date)
    return [...last.values()].filter((d) => days(ref, d) > daysWithout).length
  }

  return { sales, bySku, byCustomer, byFamily, receivables, stock, crm, inactiveCustomers, ref }
}

export type Oracle = ReturnType<typeof makeOracle>
