import { addDays, diffDays, monthKey } from "../dates"
import type { DemoProduct, IsoDate } from "../types"
import type { DataView } from "./view"

export interface StockRow {
  product: DemoProduct
  totalQty: number
  byWarehouse: Record<string, number>
  valueMxn: number
  minStock: number
  belowMin: boolean
  shortfall: number
  lastSaleDate: IsoDate | null
  lastMovementDate: IsoDate | null // ignora la apertura
  sold90d: number
  sold12m: number
  avgStock12m: number
  turnover12m: number | null
  daysOfCover: number | null
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function computeStock(view: DataView, asOf: IsoDate = view.asOf): StockRow[] {
  const qty = new Map<string, Record<string, number>>()
  const lastSale = new Map<string, IsoDate>()
  const lastMove = new Map<string, IsoDate>()
  const sold90 = new Map<string, number>()
  const sold12 = new Map<string, number>()
  const cut90 = addDays(asOf, -90)
  const cut12 = addDays(asOf, -365)

  // saldos de fin de mes de los últimos 12 meses para el stock promedio
  const monthEnds: IsoDate[] = []
  for (let i = 11; i >= 0; i--) {
    const d = addDays(asOf, -30 * i)
    monthEnds.push(d)
  }
  const monthEndBal = new Map<string, number[]>()
  const running = new Map<string, number>()

  const moves = [...view.data.movements].filter((m) => m.date <= asOf).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  let mi = 0
  const snap = (upTo: IsoDate, slot: number) => {
    while (mi < moves.length && moves[mi].date <= upTo) {
      const m = moves[mi++]
      running.set(m.sku, (running.get(m.sku) ?? 0) + m.qty)
      const byWh = qty.get(m.sku) ?? {}
      byWh[m.warehouseId] = (byWh[m.warehouseId] ?? 0) + m.qty
      qty.set(m.sku, byWh)
      if (m.type !== "apertura") lastMove.set(m.sku, m.date)
      if (m.type === "salida_venta") {
        lastSale.set(m.sku, m.date)
        if (m.date > cut90) sold90.set(m.sku, (sold90.get(m.sku) ?? 0) - m.qty)
        if (m.date > cut12) sold12.set(m.sku, (sold12.get(m.sku) ?? 0) - m.qty)
      }
    }
    for (const [sku, bal] of running) {
      const arr = monthEndBal.get(sku) ?? new Array(monthEnds.length).fill(0)
      if (slot >= 0) arr[slot] = bal
      monthEndBal.set(sku, arr)
    }
  }
  monthEnds.forEach((d, slot) => snap(d, slot))
  snap(asOf, -1)
  void monthKey

  return view.data.products.map((product) => {
    const byWarehouse = qty.get(product.sku) ?? {}
    const totalQty = Object.values(byWarehouse).reduce((s, n) => s + n, 0)
    const bal = monthEndBal.get(product.sku) ?? []
    const avgStock12m = bal.length ? bal.reduce((s, n) => s + n, 0) / bal.length : 0
    const s12 = sold12.get(product.sku) ?? 0
    const s90 = sold90.get(product.sku) ?? 0
    return {
      product,
      totalQty,
      byWarehouse,
      valueMxn: r2(totalQty * product.costMxn),
      minStock: product.minStock,
      belowMin: totalQty < product.minStock,
      shortfall: Math.max(0, product.minStock - totalQty),
      lastSaleDate: lastSale.get(product.sku) ?? null,
      lastMovementDate: lastMove.get(product.sku) ?? null,
      sold90d: s90,
      sold12m: s12,
      avgStock12m: r2(avgStock12m),
      turnover12m: avgStock12m > 0 && s12 > 0 ? Math.round((s12 / avgStock12m) * 100) / 100 : null,
      daysOfCover: s90 > 0 ? Math.round(totalQty / (s90 / 90)) : null,
    }
  })
}

/** SKUs con existencia y sin movimientos (distintos de la apertura) en los últimos `days` días. */
export function noMovement(rows: StockRow[], asOf: IsoDate, days: number): StockRow[] {
  return rows.filter((r) => r.totalQty > 0 && (r.lastMovementDate === null || diffDays(asOf, r.lastMovementDate) > days))
}
