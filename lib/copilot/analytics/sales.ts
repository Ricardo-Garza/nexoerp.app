import { addDays, endOfMonth, monthKey, monthLabel, quarterKey, startOfWeek, startOfMonth, addMonths, weekKey, yearOf, formatDateEs } from "../dates"
import type { IsoDate, UnitCode } from "../types"
import type { DataView, SalesRow } from "./view"

export interface SalesFilter {
  from?: IsoDate
  to?: IsoDate
  customerId?: string
  customerIds?: string[]
  family?: string
  families?: string[]
  sku?: string
  warehouseId?: string
  industry?: string
  currency?: "MXN" | "USD"
}

export type GroupDim = "day" | "week" | "month" | "quarter" | "year" | "customer" | "product" | "family" | "warehouse" | "industry" | "none"

export interface SalesGroup {
  key: string
  label: string
  netMxn: number
  grossMxn: number
  discountMxn: number
  cogsMxn: number
  marginMxn: number
  marginPct: number | null
  orders: number
  unitsByUnit: Partial<Record<UnitCode, number>>
  meters: number
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function selectRows(view: DataView, f: SalesFilter = {}): SalesRow[] {
  const customers = f.customerIds ? new Set(f.customerIds) : null
  const families = f.families ? new Set(f.families) : null
  return view.salesRows.filter((r) => {
    if (f.from && r.date < f.from) return false
    if (f.to && r.date > f.to) return false
    if (f.customerId && r.customerId !== f.customerId) return false
    if (customers && !customers.has(r.customerId)) return false
    if (f.family && r.family !== f.family) return false
    if (families && !families.has(r.family)) return false
    if (f.sku && r.sku !== f.sku) return false
    if (f.warehouseId && r.warehouseId !== f.warehouseId) return false
    if (f.industry && r.industry !== f.industry) return false
    if (f.currency && r.currency !== f.currency) return false
    return true
  })
}

function keyFor(view: DataView, r: SalesRow, dim: GroupDim): { key: string; label: string } {
  switch (dim) {
    case "day":
      return { key: r.date, label: formatDateEs(r.date) }
    case "week": {
      const k = weekKey(r.date)
      return { key: k, label: `Sem. ${formatDateEs(k)}` }
    }
    case "month": {
      const k = monthKey(r.date)
      return { key: k, label: monthLabel(k) }
    }
    case "quarter": {
      const k = quarterKey(r.date)
      return { key: k, label: k.replace("-", " ") }
    }
    case "year":
      return { key: String(yearOf(r.date)), label: String(yearOf(r.date)) }
    case "customer":
      return { key: r.customerId, label: view.customerById.get(r.customerId)?.name ?? r.customerId }
    case "product":
      return { key: r.sku, label: view.productBySku.get(r.sku)?.name ?? r.sku }
    case "family":
      return { key: r.family, label: r.family }
    case "warehouse":
      return { key: r.warehouseId, label: view.data.warehouses.find((w) => w.id === r.warehouseId)?.name ?? r.warehouseId }
    case "industry":
      return { key: r.industry, label: r.industry }
    default:
      return { key: "all", label: "Total" }
  }
}

export function aggregateSales(view: DataView, rows: SalesRow[], dim: GroupDim = "none"): SalesGroup[] {
  const acc = new Map<string, SalesGroup & { _orders: Set<string> }>()
  for (const r of rows) {
    const { key, label } = keyFor(view, r, dim)
    let g = acc.get(key)
    if (!g) {
      g = { key, label, netMxn: 0, grossMxn: 0, discountMxn: 0, cogsMxn: 0, marginMxn: 0, marginPct: null, orders: 0, unitsByUnit: {}, meters: 0, _orders: new Set() }
      acc.set(key, g)
    }
    g.netMxn += r.netMxn
    g.grossMxn += r.grossMxn
    g.discountMxn += r.discountMxn
    g.cogsMxn += r.costMxn
    g.meters += r.meters
    g.unitsByUnit[r.unit] = (g.unitsByUnit[r.unit] ?? 0) + r.qty
    if (r.kind === "venta") g._orders.add(r.orderId)
  }
  return [...acc.values()].map((g) => {
    const { _orders, ...rest } = g
    const net = r2(rest.netMxn)
    const cogs = r2(rest.cogsMxn)
    const margin = r2(net - cogs)
    return { ...rest, netMxn: net, grossMxn: r2(rest.grossMxn), discountMxn: r2(rest.discountMxn), cogsMxn: cogs, marginMxn: margin, marginPct: net > 0 ? Math.round((margin / net) * 10000) / 100 : null, orders: _orders.size, meters: Math.round(rest.meters) }
  })
}

/** Serie temporal continua (rellena periodos sin ventas con ceros). */
export function salesSeries(view: DataView, f: SalesFilter, dim: "day" | "week" | "month" | "quarter" | "year"): SalesGroup[] {
  const rows = selectRows(view, f)
  const groups = new Map(aggregateSales(view, rows, dim).map((g) => [g.key, g]))
  const from = f.from ?? rows.reduce((m, r) => (r.date < m ? r.date : m), view.asOf)
  const to = f.to ?? view.asOf
  const empty = (key: string, label: string): SalesGroup => ({ key, label, netMxn: 0, grossMxn: 0, discountMxn: 0, cogsMxn: 0, marginMxn: 0, marginPct: null, orders: 0, unitsByUnit: {}, meters: 0 })
  const out: SalesGroup[] = []
  if (dim === "month") {
    for (let cur = startOfMonth(from); cur <= to; cur = addMonths(cur, 1)) {
      const k = monthKey(cur)
      out.push(groups.get(k) ?? empty(k, monthLabel(k)))
    }
  } else if (dim === "week") {
    for (let cur = startOfWeek(from); cur <= to; cur = addDays(cur, 7)) out.push(groups.get(cur) ?? empty(cur, `Sem. ${formatDateEs(cur)}`))
  } else if (dim === "day") {
    for (let cur = from; cur <= to; cur = addDays(cur, 1)) out.push(groups.get(cur) ?? empty(cur, formatDateEs(cur)))
  } else {
    out.push(...[...groups.values()].sort((a, b) => (a.key < b.key ? -1 : 1)))
  }
  return out
}

export function totalOf(groups: SalesGroup[]): SalesGroup {
  const t = groups.reduce(
    (a, g) => ({
      netMxn: a.netMxn + g.netMxn,
      grossMxn: a.grossMxn + g.grossMxn,
      discountMxn: a.discountMxn + g.discountMxn,
      cogsMxn: a.cogsMxn + g.cogsMxn,
      orders: a.orders + g.orders,
      meters: a.meters + g.meters,
    }),
    { netMxn: 0, grossMxn: 0, discountMxn: 0, cogsMxn: 0, orders: 0, meters: 0 },
  )
  const unitsByUnit: Partial<Record<UnitCode, number>> = {}
  for (const g of groups) for (const [u, q] of Object.entries(g.unitsByUnit)) unitsByUnit[u as UnitCode] = (unitsByUnit[u as UnitCode] ?? 0) + (q ?? 0)
  const net = r2(t.netMxn)
  const cogs = r2(t.cogsMxn)
  return { key: "total", label: "Total", ...t, netMxn: net, grossMxn: r2(t.grossMxn), discountMxn: r2(t.discountMxn), cogsMxn: cogs, marginMxn: r2(net - cogs), marginPct: net > 0 ? Math.round(((net - cogs) / net) * 10000) / 100 : null, unitsByUnit }
}

/** Total del periodo en una sola pasada (no suma órdenes duplicadas entre grupos). */
export function totalForFilter(view: DataView, f: SalesFilter): SalesGroup {
  return aggregateSales(view, selectRows(view, f), "none")[0] ?? totalOf([])
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null
  return Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100
}

/** Último día con datos en el rango (para mes en curso parcial). */
export function lastMonthDay(d: IsoDate) {
  return endOfMonth(d)
}

/** Ordena y recorta un ranking. */
export function rank(groups: SalesGroup[], by: "netMxn" | "marginMxn" | "marginPct" | "orders" | "meters" | "grossMxn", dir: "asc" | "desc" = "desc", limit = 10): SalesGroup[] {
  const val = (g: SalesGroup) => (by === "marginPct" ? g.marginPct ?? -Infinity : (g[by] as number))
  return [...groups].sort((a, b) => (dir === "desc" ? val(b) - val(a) : val(a) - val(b)) || (a.label < b.label ? -1 : 1)).slice(0, limit)
}
