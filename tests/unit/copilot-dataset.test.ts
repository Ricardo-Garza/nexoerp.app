import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import manifest from "@/lib/copilot/data/dataset-manifest.json"
import { getSoleilDemoDataset, soleilCatalogInput } from "@/lib/copilot/data/dataset"
import { COPILOT_TENANT_ID as GENERATOR_TENANT, generateSoleilDemoDataset } from "@/lib/copilot/data/generator"
import { COPILOT_TENANT_ID } from "@/lib/copilot/constants"
import soleilSeed from "@/lib/domain/soleilwire/soleil-seed.json"

const ds = getSoleilDemoDataset()
const r2 = (n: number) => Math.round(n * 100) / 100

describe("Dataset DEMO de Soleil Wire — reproducibilidad", () => {
  it("es determinista: dos generaciones son idénticas y coinciden con el manifiesto versionado", () => {
    const again = generateSoleilDemoDataset(soleilCatalogInput())
    const hash = createHash("sha256").update(JSON.stringify(ds)).digest("hex")
    expect(createHash("sha256").update(JSON.stringify(again)).digest("hex")).toBe(hash)
    expect(hash).toBe(manifest.sha256)
    expect(manifest.counts.orders).toBe(ds.orders.length)
  })

  it("la constante de tenant del cliente y la del generador coinciden", () => {
    expect(COPILOT_TENANT_ID).toBe(GENERATOR_TENANT)
    expect(ds.meta.tenantId).toBe(COPILOT_TENANT_ID)
    expect(ds.meta.isDemo).toBe(true)
    expect(ds.meta.disclaimer).toMatch(/SIMULADOS/)
  })

  it("alcanza los volúmenes objetivo", () => {
    expect(ds.customers.length).toBeGreaterThanOrEqual(100)
    expect(ds.customers.length).toBeLessThanOrEqual(150)
    expect(ds.products.length).toBeGreaterThanOrEqual(150)
    expect(ds.products.length).toBeLessThanOrEqual(250)
    expect(ds.suppliers.length).toBeGreaterThanOrEqual(15)
    expect(ds.orders.length).toBeGreaterThanOrEqual(1000)
    expect(ds.orders.length).toBeLessThanOrEqual(1500)
    const lines = ds.orders.reduce((n, o) => n + o.lines.length, 0)
    expect(lines).toBeGreaterThanOrEqual(2500)
    expect(lines).toBeLessThanOrEqual(5000)
    expect(ds.invoices.length).toBeGreaterThanOrEqual(700)
    expect(ds.invoices.length).toBeLessThanOrEqual(1200)
    expect(ds.opportunities.length).toBeGreaterThanOrEqual(100)
    expect(ds.opportunities.length).toBeLessThanOrEqual(200)
    expect(ds.quotes.length).toBeGreaterThanOrEqual(200)
    expect(ds.quotes.length).toBeLessThanOrEqual(400)
    expect(ds.warehouses.length).toBeGreaterThanOrEqual(2)
  })

  it("cubre al menos 18 meses, incluido 2026, hasta la fecha de referencia", () => {
    const dates = ds.orders.map((o) => o.date).sort()
    expect(dates[0] <= "2025-04-30").toBe(true)
    expect(dates[dates.length - 1] <= ds.meta.referenceDate).toBe(true)
    expect(dates[dates.length - 1] >= "2026-10-15").toBe(true)
    expect(new Set(dates.map((d) => d.slice(0, 7))).size).toBeGreaterThanOrEqual(18)
  })

  it("todos los registros se identifican como DEMO y el catálogo base es el público", () => {
    for (const id of [...ds.customers, ...ds.orders, ...ds.invoices, ...ds.payments, ...ds.quotes, ...ds.opportunities].map((x) => x.id)) expect(id).toMatch(/^DEMO-/)
    const publicSkus = new Set((soleilSeed.productos as { sku: string }[]).map((p) => p.sku))
    for (const p of ds.products) expect(publicSkus.has(p.baseSku)).toBe(true)
    expect(new Set(ds.products.map((p) => p.sku)).size).toBe(ds.products.length)
  })
})

describe("Dataset DEMO — integridad referencial y reglas de negocio", () => {
  const customers = new Map(ds.customers.map((c) => [c.id, c]))
  const products = new Map(ds.products.map((p) => [p.sku, p]))
  const orders = new Map(ds.orders.map((o) => [o.id, o]))
  const invoices = new Map(ds.invoices.map((i) => [i.id, i]))
  const quotes = new Map(ds.quotes.map((q) => [q.id, q]))
  const opps = new Map(ds.opportunities.map((o) => [o.id, o]))
  const suppliers = new Map(ds.suppliers.map((s) => [s.id, s]))

  it("Cliente → Cotización → Pedido → Factura → Pago", () => {
    for (const q of ds.quotes) {
      expect(customers.has(q.customerId)).toBe(true)
      if (q.opportunityId) expect(opps.get(q.opportunityId)?.customerId).toBe(q.customerId)
      if (q.orderId) {
        expect(orders.get(q.orderId)?.quoteId).toBe(q.id)
        expect(q.status).toBe("Ganada")
      }
    }
    for (const o of ds.orders) {
      expect(customers.has(o.customerId)).toBe(true)
      if (o.quoteId) expect(quotes.get(o.quoteId)?.orderId).toBe(o.id)
    }
    for (const i of ds.invoices) {
      expect(orders.get(i.orderId)?.customerId).toBe(i.customerId)
      expect(orders.get(i.orderId)?.status).toBe("Facturado")
      expect(i.dueDate > i.date).toBe(true)
    }
    for (const p of ds.payments) expect(invoices.get(p.invoiceId)?.customerId).toBe(p.customerId)
    for (const n of ds.creditNotes) expect(invoices.get(n.invoiceId)?.customerId).toBe(n.customerId)
  })

  it("importeLinea = cantidad × precio − descuento y subtotal = Σ líneas", () => {
    for (const o of ds.orders) {
      let sum = 0
      for (const l of o.lines) {
        expect(l.lineTotal).toBeCloseTo(r2(l.qty * l.unitPrice - l.discount), 1)
        expect(products.has(l.sku)).toBe(true)
        expect(l.unit).toBe(products.get(l.sku)!.unit)
        sum += l.lineTotal
      }
      expect(o.subtotal).toBeCloseTo(sum, 1)
      expect(new Set(o.lines.map((l) => l.sku)).size).toBe(o.lines.length)
    }
    for (const i of ds.invoices) expect(i.total).toBeCloseTo(i.subtotal + i.tax, 1)
  })

  it("monedas explícitas: MXN con tipo de cambio 1 y USD con TC identificado", () => {
    const usd = ds.orders.filter((o) => o.currency === "USD")
    expect(usd.length).toBeGreaterThan(50)
    for (const o of ds.orders) {
      expect(["MXN", "USD"]).toContain(o.currency)
      if (o.currency === "MXN") expect(o.fx).toBe(1)
      else expect(o.fx).toBeGreaterThan(15)
      expect(o.fx).toBeLessThan(21)
    }
    expect(ds.invoices.some((i) => i.currency === "USD")).toBe(true)
  })

  it("unidades compatibles: metros, rollos de 100 m y piezas nunca se mezclan", () => {
    const units = new Set(ds.products.map((p) => p.unit))
    expect(units).toEqual(new Set(["m", "rollo", "pza"]))
    for (const p of ds.products) expect(p.metersPerUnit).toBe(p.unit === "m" ? 1 : p.unit === "rollo" ? 100 : 0)
  })

  it("los pagos nunca exceden el saldo de la factura (después de notas de crédito)", () => {
    const paid = new Map<string, number>()
    for (const p of ds.payments) paid.set(p.invoiceId, (paid.get(p.invoiceId) ?? 0) + p.amount)
    const credited = new Map<string, number>()
    for (const n of ds.creditNotes) credited.set(n.invoiceId, (credited.get(n.invoiceId) ?? 0) + n.total)
    for (const i of ds.invoices) expect((paid.get(i.id) ?? 0) + (credited.get(i.id) ?? 0)).toBeLessThanOrEqual(i.total + 0.02)
  })

  it("pedidos cancelados no mueven inventario y no se facturan", () => {
    const cancelled = new Set(ds.orders.filter((o) => o.status === "Cancelado").map((o) => o.id))
    expect(cancelled.size).toBeGreaterThan(20)
    for (const m of ds.movements) if (m.type === "salida_venta") expect(cancelled.has(m.refId)).toBe(false)
    for (const i of ds.invoices) expect(cancelled.has(i.orderId)).toBe(false)
  })

  it("Proveedor → Compra → Recepción → Movimiento, y el stock nunca es negativo", () => {
    for (const po of ds.purchaseOrders) {
      expect(suppliers.has(po.supplierId)).toBe(true)
      expect(po.status === "Recibida").toBe(po.receivedDate !== null)
      for (const l of po.lines) expect(products.has(l.sku)).toBe(true)
    }
    const received = new Set(ds.purchaseOrders.filter((p) => p.status === "Recibida").map((p) => p.id))
    for (const m of ds.movements) if (m.type === "entrada_compra") expect(received.has(m.refId)).toBe(true)
    const byKey = new Map<string, { date: string; qty: number }[]>()
    for (const m of ds.movements) {
      const k = `${m.sku}|${m.warehouseId}`
      if (!byKey.has(k)) byKey.set(k, [])
      byKey.get(k)!.push({ date: m.date, qty: m.qty })
    }
    for (const [key, list] of byKey) {
      list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      let bal = 0
      for (let i = 0; i < list.length; i++) {
        bal += list[i].qty
        if (i === list.length - 1 || list[i + 1].date !== list[i].date) expect(bal, `${key} ${list[i].date}`).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe("Dataset DEMO — casos de negocio presentes", () => {
  it("incluye todos los arquetipos y casos pedidos", () => {
    const arche = new Set(ds.customers.map((c) => c.archetype))
    for (const a of ["estrategico", "recurrente", "creciente", "ocasional", "nuevo", "inactivo"]) expect(arche.has(a as never)).toBe(true)
    expect(ds.creditNotes.length).toBeGreaterThanOrEqual(10)
    expect(ds.creditNotes.some((n) => n.reason === "devolucion")).toBe(true)
    expect(ds.opportunities.some((o) => o.stage === "Perdida")).toBe(true)
    expect(ds.opportunities.some((o) => o.stage === "Negociación")).toBe(true)
    expect(ds.quotes.some((q) => q.status === "Perdida")).toBe(true)
    expect(ds.products.filter((p) => p.listPrice > 0 && (p.listPrice - p.costMxn) / p.listPrice < 0.1).length).toBeGreaterThanOrEqual(3)
    expect(ds.purchaseOrders.some((p) => p.status === "En tránsito")).toBe(true)
    expect(ds.movements.some((m) => m.type === "traspaso_salida")).toBe(true)
  })

  it("hay inventario crítico, productos sin ventas y clientes con facturas vencidas", () => {
    const stock = new Map<string, number>()
    for (const m of ds.movements) stock.set(m.sku, (stock.get(m.sku) ?? 0) + m.qty)
    expect(ds.products.filter((p) => (stock.get(p.sku) ?? 0) < p.minStock).length).toBeGreaterThanOrEqual(5)
    const sold = new Set<string>()
    for (const o of ds.orders) if (o.status !== "Cancelado") for (const l of o.lines) sold.add(l.sku)
    expect(ds.products.filter((p) => !sold.has(p.sku)).length).toBeGreaterThanOrEqual(5)
    const paid = new Map<string, number>()
    for (const p of ds.payments) paid.set(p.invoiceId, (paid.get(p.invoiceId) ?? 0) + p.amount)
    const overdue = ds.invoices.filter((i) => i.dueDate < ds.meta.referenceDate && (paid.get(i.id) ?? 0) < i.total - 1)
    expect(new Set(overdue.map((i) => i.customerId)).size).toBeGreaterThanOrEqual(10)
  })
})
