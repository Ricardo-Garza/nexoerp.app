import type { DemoCustomer, DemoDataset, DemoInvoice, DemoOrder, DemoProduct, IsoDate, UnitCode } from "../types"

/**
 * Vista indexada y normalizada del dataset. Todos los importes de `SalesRow`
 * están en MXN (los documentos en USD se convierten con el tipo de cambio del
 * propio documento). Los pedidos cancelados NO generan filas de venta.
 */
export interface SalesRow {
  kind: "venta" | "nc"
  docId: string
  orderId: string
  date: IsoDate
  customerId: string
  industry: string
  sku: string
  family: string
  warehouseId: string
  unit: UnitCode
  qty: number // negativo en devoluciones físicas
  meters: number // equivalente en metros (0 para piezas)
  grossMxn: number
  discountMxn: number
  netMxn: number // negativo en notas de crédito
  costMxn: number // negativo en reversos de costo
  currency: "MXN" | "USD"
}

export interface DataView {
  data: DemoDataset
  asOf: IsoDate
  customerById: Map<string, DemoCustomer>
  productBySku: Map<string, DemoProduct>
  orderById: Map<string, DemoOrder>
  invoiceById: Map<string, DemoInvoice>
  salesRows: SalesRow[]
  cancelledOrders: DemoOrder[]
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function buildDataView(data: DemoDataset): DataView {
  const customerById = new Map(data.customers.map((c) => [c.id, c]))
  const productBySku = new Map(data.products.map((p) => [p.sku, p]))
  const orderById = new Map(data.orders.map((o) => [o.id, o]))
  const invoiceById = new Map(data.invoices.map((i) => [i.id, i]))
  const salesRows: SalesRow[] = []
  const cancelledOrders: DemoOrder[] = []

  for (const o of data.orders) {
    if (o.status === "Cancelado") {
      cancelledOrders.push(o)
      continue
    }
    const c = customerById.get(o.customerId)!
    for (const l of o.lines) {
      const p = productBySku.get(l.sku)!
      salesRows.push({
        kind: "venta",
        docId: o.id,
        orderId: o.id,
        date: o.date,
        customerId: o.customerId,
        industry: c.industry,
        sku: l.sku,
        family: p.family,
        warehouseId: o.warehouseId,
        unit: l.unit,
        qty: l.qty,
        meters: l.qty * p.metersPerUnit,
        grossMxn: r2((l.lineTotal + l.discount) * o.fx),
        discountMxn: r2(l.discount * o.fx),
        netMxn: r2(l.lineTotal * o.fx),
        costMxn: r2(l.qty * l.unitCostMxn),
        currency: o.currency,
      })
    }
  }

  // Notas de crédito: restan venta neta (y costo si hubo devolución física)
  for (const n of data.creditNotes) {
    const inv = invoiceById.get(n.invoiceId)
    const order = inv ? orderById.get(inv.orderId) : undefined
    if (!order) continue
    const c = customerById.get(n.customerId)!
    const netMxn = r2(n.subtotal * n.fx)
    if (n.returnLines.length) {
      const rl = n.returnLines[0]
      const p = productBySku.get(rl.sku)!
      salesRows.push({
        kind: "nc",
        docId: n.id,
        orderId: order.id,
        date: n.date,
        customerId: n.customerId,
        industry: c.industry,
        sku: rl.sku,
        family: p.family,
        warehouseId: rl.warehouseId,
        unit: p.unit,
        qty: -rl.qty,
        meters: -rl.qty * p.metersPerUnit,
        grossMxn: -netMxn,
        discountMxn: 0,
        netMxn: -netMxn,
        costMxn: -n.costReversalMxn,
        currency: n.currency,
      })
    } else {
      // Ajustes de precio/descuento: se reparten entre las líneas del pedido en proporción a su importe
      const base = order.lines.reduce((s, l) => s + l.lineTotal, 0) || 1
      for (const l of order.lines) {
        const p = productBySku.get(l.sku)!
        const share = r2(netMxn * (l.lineTotal / base))
        salesRows.push({
          kind: "nc",
          docId: n.id,
          orderId: order.id,
          date: n.date,
          customerId: n.customerId,
          industry: c.industry,
          sku: l.sku,
          family: p.family,
          warehouseId: order.warehouseId,
          unit: l.unit,
          qty: 0,
          meters: 0,
          grossMxn: -share,
          discountMxn: 0,
          netMxn: -share,
          costMxn: 0,
          currency: n.currency,
        })
      }
    }
  }

  return { data, asOf: data.meta.referenceDate, customerById, productBySku, orderById, invoiceById, salesRows, cancelledOrders }
}
