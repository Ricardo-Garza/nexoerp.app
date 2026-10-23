import { diffDays, formatDateEs } from "../dates"
import { OPEN_STAGES, openOpportunities, opportunityWinRate, pipelineByStage, quoteConversion } from "../analytics/crm"
import { AGING_BUCKETS, openInvoices, receivablesByCustomer, summarizeReceivables, type InvoiceBalance } from "../analytics/finance"
import { computeStock, noMovement, type StockRow } from "../analytics/inventory"
import { aggregateSales, selectRows, totalForFilter } from "../analytics/sales"
import { fmtInt, fmtMxn, fmtNum, fmtPct } from "../format"
import type { CopilotResult, EvidenceRecord } from "../result"
import { col, emptyResult, kpi, MAX_TABLE_ROWS, noData, periodNote, salesEvidence, salesFilter, scopeText, type HandlerCtx } from "./kit"

const r2 = (n: number) => Math.round(n * 100) / 100

// ---------- clientes ----------
export function hInactive(c: HandlerCtx): CopilotResult {
  const days = c.plan.inactiveDays ?? 90
  const asOf = c.view.asOf
  const last = new Map<string, string>()
  const count = new Map<string, number>()
  for (const o of c.view.data.orders) {
    if (o.status === "Cancelado") continue
    count.set(o.customerId, (count.get(o.customerId) ?? 0) + 1)
    if (!last.has(o.customerId) || o.date > last.get(o.customerId)!) last.set(o.customerId, o.date)
  }
  const net = new Map(aggregateSales(c.view, selectRows(c.view, {}), "customer").map((g) => [g.key, g.netMxn]))
  const rows = [...last.entries()]
    .filter(([, d]) => diffDays(asOf, d) > days)
    .map(([id, d]) => ({ id, d, days: diffDays(asOf, d) }))
    .sort((a, b) => (net.get(b.id) ?? 0) - (net.get(a.id) ?? 0))
  if (!rows.length) return noData(c, "Clientes inactivos", `Todos los clientes con historial compraron en los últimos ${days} días.`)
  const lost = rows.reduce((s, x) => s + (net.get(x.id) ?? 0), 0)
  const r = emptyResult(c, "Clientes inactivos")
  r.kpis = [kpi("Clientes inactivos", fmtInt(rows.length), { raw: rows.length, tone: "warn", detail: `sin compras en ${days}+ días` }), kpi("Venta histórica de estos clientes", fmtMxn(lost)), kpi("Mayor", c.view.customerById.get(rows[0].id)!.name, { detail: `${rows[0].days} días sin comprar` })]
  r.summary = `${fmtInt(rows.length)} clientes con historial de compra no han comprado en más de ${days} días (corte ${formatDateEs(asOf)}). Entre todos representaron ${fmtMxn(lost)} de venta neta histórica; el de mayor valor es ${c.view.customerById.get(rows[0].id)!.name}.`
  r.table = { columns: [col("pos", "#", "number"), col("cliente", "Cliente"), col("industria", "Industria"), col("ultima", "Última compra", "date"), col("dias", "Días sin comprar", "number"), col("venta", "Venta histórica", "currency")], rows: rows.slice(0, MAX_TABLE_ROWS).map((x, i) => ({ pos: i + 1, cliente: c.view.customerById.get(x.id)!.name, industria: c.view.customerById.get(x.id)!.industry, ultima: last.get(x.id)!, dias: x.days, venta: net.get(x.id) ?? 0 })), totalRows: rows.length }
  r.chart = { kind: "bar", title: "Clientes inactivos con mayor venta histórica", xKey: "nombre", series: [{ key: "valor", label: "Venta neta histórica (MXN)" }], data: rows.slice(0, 10).map((x) => ({ nombre: c.view.customerById.get(x.id)!.name, valor: net.get(x.id) ?? 0 })), format: "currency" }
  r.evidence = { calc: `Clientes con al menos un pedido no cancelado cuya última compra es anterior a ${days} días del corte.`, source: c.source, records: rows.slice(0, 15).map((x) => ({ kind: "cliente" as const, id: x.id, date: x.d, who: c.view.customerById.get(x.id)!.name, amountMxn: net.get(x.id) ?? 0, detail: `${x.days} días sin comprar` })), totalRecords: rows.length }
  r.assumptions.push(`Umbral de inactividad: ${days} días sin pedidos.`)
  r.followUps = ["¿Qué clientes tienen saldo vencido?", "Muéstrame mis 10 mejores clientes"]
  return r
}

export function hPurchaseHistory(c: HandlerCtx): CopilotResult {
  const id = c.plan.filters.customerId
  const cust = id ? c.view.customerById.get(id) : undefined
  if (!cust) return noData(c, "Historial de compras", "Necesito saber de qué cliente. Dime el nombre (por ejemplo «historial de compras de Minera Aurora»).")
  const orders = c.view.data.orders.filter((o) => o.customerId === cust.id && o.status !== "Cancelado").sort((a, b) => (a.date < b.date ? 1 : -1))
  if (!orders.length) return noData(c, "Historial de compras", `${cust.name} no tiene pedidos registrados.`)
  const g = totalForFilter(c.view, { customerId: cust.id })
  const lastOrder = orders[0]
  const r = emptyResult(c, "Historial de compras")
  r.kpis = [kpi("Última compra", formatDateEs(lastOrder.date), { detail: `${diffDays(c.view.asOf, lastOrder.date)} días atrás` }), kpi("Pedidos", fmtInt(orders.length)), kpi("Venta neta histórica", fmtMxn(g.netMxn)), kpi("Margen bruto", fmtPct(g.marginPct))]
  const topProducts = aggregateSales(c.view, selectRows(c.view, { customerId: cust.id }), "product").sort((a, b) => b.netMxn - a.netMxn).slice(0, 3)
  r.summary = `${cust.name} (${cust.industry}, ${cust.city}): su última compra fue el ${formatDateEs(lastOrder.date)} por ${fmtMxn(lastOrder.subtotal * lastOrder.fx)} (pedido ${lastOrder.id}). Ha realizado ${fmtInt(orders.length)} pedidos por ${fmtMxn(g.netMxn)} netos. Compra sobre todo: ${topProducts.map((x) => x.label).join("; ")}.`
  r.table = { columns: [col("pedido", "Pedido"), col("fecha", "Fecha", "date"), col("estatus", "Estatus"), col("lineas", "Líneas", "number"), col("monto", "Importe (MXN)", "currency")], rows: orders.slice(0, 12).map((o) => ({ pedido: o.id, fecha: o.date, estatus: o.status, lineas: o.lines.length, monto: r2(o.subtotal * o.fx) })), totalRows: orders.length }
  r.evidence = { calc: "Pedidos no cancelados del cliente, del más reciente al más antiguo; importe sin IVA convertido a MXN.", source: c.source, records: orders.slice(0, 15).map((o) => ({ kind: "pedido" as const, id: o.id, date: o.date, who: cust.name, amountMxn: r2(o.subtotal * o.fx) })), totalRecords: orders.length }
  r.followUps = ["¿Cuánto nos debe este cliente?", "Muéstrame mis 10 mejores clientes"]
  return r
}

// ---------- productos ----------
export function hProductList(c: HandlerCtx, stock: StockRow[], mode: "search" | "price"): CopilotResult {
  const f = c.plan.filters
  const skus = f.skus ?? (f.sku ? [f.sku] : [])
  const bySku = new Map(stock.map((s) => [s.product.sku, s]))
  // Familia O mención en el nombre: «cables de aluminio» incluye también armados de aluminio
  const byFamily = f.families?.length ? c.view.data.products.filter((p) => f.families!.includes(p.family)) : []
  const byName = skus.length ? c.view.data.products.filter((p) => skus.includes(p.sku)) : []
  let list = byFamily.length || byName.length ? c.view.data.products.filter((p) => byFamily.includes(p) || byName.includes(p)) : c.view.data.products
  if (!list.length) return noData(c, mode === "price" ? "Precio de producto" : "Búsqueda de productos", "No encontré productos que coincidan. Prueba con el nombre de la familia, un SKU (SW-...) o un calibre (por ejemplo «12 AWG»).")
  const total = list.length
  list = list.slice(0, MAX_TABLE_ROWS)
  const r = emptyResult(c, mode === "price" ? "Precio de lista (DEMO)" : "Productos del catálogo")
  const famText = f.families?.length ? ` de ${f.families.join(", ")}` : ""
  r.kpis = [kpi("Productos encontrados", fmtInt(total)), ...(list.length === 1 ? [kpi("Precio de lista", fmtMxn(list[0].listPrice), { detail: `por ${list[0].unit}` })] : [])]
  r.summary = mode === "price" && list.length === 1 ? `${list[0].name} (${list[0].sku}): precio de lista ${fmtMxn(list[0].listPrice)} por ${list[0].unit}, costo ${fmtMxn(list[0].costMxn)}. Precios SIMULADOS para el demo.` : `Encontré ${fmtInt(total)} productos${famText}${total > list.length ? `; muestro los primeros ${list.length}` : ""}. Precios y existencias son SIMULADOS.`
  r.table = { columns: [col("sku", "SKU"), col("nombre", "Producto"), col("familia", "Familia"), col("unidad", "Unidad"), col("precio", "Precio lista (MXN)", "currency"), col("stock", "Existencia", "number")], rows: list.map((p) => ({ sku: p.sku, nombre: p.name, familia: p.family, unidad: p.unit, precio: p.listPrice, stock: bySku.get(p.sku)?.totalQty ?? 0 })), totalRows: total }
  r.evidence = { calc: "Consulta de catálogo (familia/SKU/calibre) sobre el maestro de productos.", source: c.source, records: list.slice(0, 15).map((p) => ({ kind: "producto" as const, id: p.sku, date: null, who: p.name, amountMxn: p.listPrice })), totalRecords: total }
  r.followUps = ["¿Cuánto stock hay de estos productos?", "¿Qué producto deja mayor margen?"]
  return r
}

// ---------- inventario ----------
const rowsFor = (c: HandlerCtx, stock: StockRow[]) => {
  const f = c.plan.filters
  const skus = new Set([...(f.skus ?? []), ...(f.sku ? [f.sku] : [])])
  const fams = f.families ?? []
  if (!skus.size && !fams.length) return stock
  // Familia O mención en el nombre del producto (misma definición que la búsqueda de catálogo)
  return stock.filter((s) => fams.includes(s.product.family) || skus.has(s.product.sku))
}

function unitLabel(row: StockRow) {
  return row.product.unit === "m" ? "m" : row.product.unit === "rollo" ? "rollos" : "pzas"
}

export function hAvailability(c: HandlerCtx, stock: StockRow[]): CopilotResult {
  const rows = rowsFor(c, stock)
  const hasSku = !!(c.plan.filters.sku || c.plan.filters.skus?.length)
  if (!hasSku && !c.plan.filters.families?.length) return noData(c, "Disponibilidad de inventario", "¿De qué producto o familia quieres saber la existencia? Por ejemplo «stock del cable THHN» o «inventario de aluminio».")
  if (!rows.length) return noData(c, "Disponibilidad de inventario", "No encontré ese producto en el catálogo.")
  const r = emptyResult(c, "Disponibilidad de inventario")
  const value = rows.reduce((s, x) => s + x.valueMxn, 0)
  const below = rows.filter((x) => x.belowMin).length
  r.kpis = [kpi("SKUs", fmtInt(rows.length)), kpi("Valor a costo", fmtMxn(value)), kpi("Bajo mínimo", fmtInt(below), { tone: below ? "warn" : "good" })]
  r.summary = rows.length === 1 ? `${rows[0].product.name}: ${fmtNum(rows[0].totalQty)} ${unitLabel(rows[0])} en total (mínimo ${fmtNum(rows[0].minStock)}). ${rows[0].belowMin ? "Está por debajo del mínimo." : "Está sobre el mínimo."} ${c.view.data.warehouses.map((w) => `${w.city}: ${fmtNum(rows[0].byWarehouse[w.id] ?? 0)}`).join(" · ")}.` : `${rows.length} SKUs con valor a costo de ${fmtMxn(value)}; ${below} bajo su mínimo.`
  r.table = { columns: [col("sku", "SKU"), col("nombre", "Producto"), ...c.view.data.warehouses.map((w) => col(w.id, w.city, "number")), col("total", "Total", "number"), col("min", "Mínimo", "number")], rows: rows.slice(0, MAX_TABLE_ROWS).map((x) => ({ sku: x.product.sku, nombre: x.product.name, ...Object.fromEntries(c.view.data.warehouses.map((w) => [w.id, x.byWarehouse[w.id] ?? 0])), total: x.totalQty, min: x.minStock })), totalRows: rows.length }
  r.evidence = { calc: "Existencia = Σ movimientos de inventario por SKU y almacén al corte (entradas, salidas, devoluciones, traspasos y ajustes).", source: c.source, records: rows.slice(0, 15).map((x) => ({ kind: "producto" as const, id: x.product.sku, date: x.lastMovementDate, who: x.product.name, amountMxn: x.valueMxn })), totalRecords: rows.length }
  r.followUps = ["¿Qué productos tienen inventario crítico?", "¿Cuánto stock hay por almacén?"]
  return r
}

export function hLowStock(c: HandlerCtx, stock: StockRow[]): CopilotResult {
  const below = rowsFor(c, stock).filter((x) => x.belowMin && (x.sold12m > 0 || x.minStock > 0)).sort((a, b) => a.totalQty / Math.max(1, a.minStock) - b.totalQty / Math.max(1, b.minStock))
  const all = rowsFor(c, stock)
  if (!below.length) return noData(c, "Inventario crítico", "Ningún SKU está por debajo de su stock mínimo al corte.")
  const zero = below.filter((x) => x.totalQty <= 0).length
  const r = emptyResult(c, "Inventario crítico")
  r.kpis = [kpi("SKUs bajo mínimo", fmtInt(below.length), { raw: below.length, tone: "bad", detail: `de ${fmtInt(all.length)} en el catálogo` }), kpi("Agotados", fmtInt(zero), { tone: zero ? "bad" : "neutral" }), kpi("Reposición sugerida", fmtMxn(below.reduce((s, x) => s + x.shortfall * x.product.costMxn, 0)), { detail: "a costo, para llegar al mínimo" })]
  const worst = below[0]
  r.summary = `${fmtInt(below.length)} SKUs están por debajo de su stock mínimo (${fmtInt(zero)} agotados). El más crítico es ${worst.product.name}: ${fmtNum(worst.totalQty)} ${unitLabel(worst)} contra un mínimo de ${fmtNum(worst.minStock)}. Criterio: existencia total (todos los almacenes) < stock mínimo del SKU.`
  r.table = { columns: [col("sku", "SKU"), col("nombre", "Producto"), col("familia", "Familia"), col("stock", "Existencia", "number"), col("min", "Mínimo", "number"), col("falta", "Faltante", "number"), col("cobertura", "Cobertura (días)", "number"), col("nivel", "Nivel")], rows: below.slice(0, MAX_TABLE_ROWS).map((x) => ({ sku: x.product.sku, nombre: x.product.name, familia: x.product.family, stock: x.totalQty, min: x.minStock, falta: x.shortfall, cobertura: x.daysOfCover, nivel: x.totalQty <= 0 ? "Agotado" : x.totalQty < x.minStock * 0.5 ? "Crítico" : "Bajo" })), totalRows: below.length }
  r.chart = { kind: "bar", title: "Faltante vs mínimo (primeros 10 SKUs críticos)", xKey: "nombre", series: [{ key: "stock", label: "Existencia" }, { key: "min", label: "Mínimo" }], data: below.slice(0, 10).map((x) => ({ nombre: x.product.sku.replace(/^SW-/, ""), stock: x.totalQty, min: x.minStock })), format: "number" }
  r.evidence = { calc: "Un SKU es crítico cuando Σ existencia de todos los almacenes < stock mínimo del producto. Cobertura = existencia ÷ venta diaria promedio de los últimos 90 días.", source: c.source, records: below.slice(0, 15).map((x) => ({ kind: "producto" as const, id: x.product.sku, date: x.lastSaleDate, who: x.product.name, amountMxn: r2(x.shortfall * x.product.costMxn), detail: `${fmtNum(x.totalQty)} / mín. ${fmtNum(x.minStock)}` })), totalRecords: below.length }
  r.followUps = ["¿Cuánto stock hay por almacén?", "¿Qué SKU tiene mayor rotación?"]
  return r
}

export function hRotation(c: HandlerCtx, stock: StockRow[]): CopilotResult {
  const rows = rowsFor(c, stock).filter((x) => x.turnover12m !== null)
  if (!rows.length) return noData(c, "Rotación de inventario", "No tengo ventas suficientes en los últimos 12 meses para calcular rotación.")
  const sorted = [...rows].sort((a, b) => (c.plan.sort === "asc" ? a.turnover12m! - b.turnover12m! : b.turnover12m! - a.turnover12m!)).slice(0, c.plan.limit)
  const lead = sorted[0]
  const r = emptyResult(c, c.plan.sort === "asc" ? "Menor rotación" : "Mayor rotación")
  r.kpis = [kpi(c.plan.sort === "asc" ? "Menor rotación" : "Mayor rotación", lead.product.name, { detail: `${lead.turnover12m} vueltas/año` }), kpi("SKUs evaluados", fmtInt(rows.length))]
  r.summary = `${lead.product.name} es el SKU con ${c.plan.sort === "asc" ? "menor" : "mayor"} rotación: ${lead.turnover12m} vueltas en 12 meses (vendió ${fmtNum(lead.sold12m)} ${unitLabel(lead)} con un inventario promedio de ${fmtNum(lead.avgStock12m)}).`
  r.chart = { kind: "bar", title: "Rotación anualizada (vueltas)", xKey: "nombre", series: [{ key: "valor", label: "Vueltas / año" }], data: sorted.map((x) => ({ nombre: x.product.sku.replace(/^SW-/, ""), valor: x.turnover12m })), format: "number" }
  r.table = { columns: [col("sku", "SKU"), col("nombre", "Producto"), col("vueltas", "Vueltas/año", "number"), col("vendido", "Vendido 12m", "number"), col("prom", "Inventario prom.", "number"), col("dias", "Cobertura (días)", "number")], rows: sorted.map((x) => ({ sku: x.product.sku, nombre: x.product.name, vueltas: x.turnover12m, vendido: x.sold12m, prom: x.avgStock12m, dias: x.daysOfCover })), totalRows: rows.length }
  r.evidence = { calc: "Rotación = unidades vendidas en 12 meses ÷ inventario promedio de 12 cortes (cada ~30 días). Solo SKUs con ventas.", source: c.source, records: sorted.slice(0, 15).map((x) => ({ kind: "producto" as const, id: x.product.sku, date: x.lastSaleDate, who: x.product.name, amountMxn: x.valueMxn })), totalRecords: rows.length }
  r.followUps = ["¿Qué productos no tienen movimiento?", "¿Qué productos tienen inventario crítico?"]
  return r
}

export function hByWarehouse(c: HandlerCtx, stock: StockRow[]): CopilotResult {
  const rows = rowsFor(c, stock)
  const whs = c.view.data.warehouses.filter((w) => !c.plan.filters.warehouseId || w.id === c.plan.filters.warehouseId)
  const agg = whs.map((w) => {
    const sel = rows.filter((x) => (x.byWarehouse[w.id] ?? 0) !== 0)
    const value = sel.reduce((s, x) => s + (x.byWarehouse[w.id] ?? 0) * x.product.costMxn, 0)
    const meters = sel.reduce((s, x) => s + (x.byWarehouse[w.id] ?? 0) * x.product.metersPerUnit, 0)
    return { w, skus: sel.length, value: r2(value), meters: Math.round(meters) }
  })
  const r = emptyResult(c, "Inventario por almacén")
  const total = agg.reduce((s, x) => s + x.value, 0)
  const lead = [...agg].sort((a, b) => b.value - a.value)[0]
  r.kpis = [kpi("Valor total a costo", fmtMxn(total), { raw: total }), kpi("Almacén con más valor", lead.w.name, { detail: fmtMxn(lead.value) }), kpi("Metros equivalentes", fmtInt(agg.reduce((s, x) => s + x.meters, 0)), { detail: "excluye piezas" })]
  r.summary = `El inventario suma ${fmtMxn(total)} a costo. ${lead.w.name} concentra ${fmtPct(total ? (lead.value / total) * 100 : null)} (${fmtMxn(lead.value)}). Los metros equivalentes incluyen rollos de 100 m y excluyen piezas.`
  r.chart = { kind: "bar", title: "Valor de inventario por almacén (a costo)", xKey: "nombre", series: [{ key: "valor", label: "Valor (MXN)" }], data: agg.map((x) => ({ nombre: x.w.name, valor: x.value })), format: "currency" }
  r.table = { columns: [col("almacen", "Almacén"), col("skus", "SKUs con existencia", "number"), col("metros", "Metros equiv.", "number"), col("valor", "Valor a costo", "currency")], rows: agg.map((x) => ({ almacen: x.w.name, skus: x.skus, metros: x.meters, valor: x.value })), totalRows: agg.length }
  r.evidence = { calc: "Existencia por almacén = Σ movimientos; valor = existencia × costo unitario del producto.", source: c.source, records: agg.map((x) => ({ kind: "producto" as const, id: x.w.id, date: null, who: x.w.name, amountMxn: x.value })), totalRecords: agg.length }
  r.followUps = ["¿Qué familia concentra más inventario?", "¿Qué productos tienen inventario crítico?"]
  return r
}

export function hByFamily(c: HandlerCtx, stock: StockRow[]): CopilotResult {
  const fams = new Map<string, { value: number; skus: number; meters: number }>()
  for (const x of stock) {
    if (x.totalQty <= 0) continue
    const cur = fams.get(x.product.family) ?? { value: 0, skus: 0, meters: 0 }
    cur.value += x.valueMxn
    cur.skus++
    cur.meters += x.totalQty * x.product.metersPerUnit
    fams.set(x.product.family, cur)
  }
  const list = [...fams.entries()].map(([family, v]) => ({ family, ...v, value: r2(v.value) })).sort((a, b) => b.value - a.value)
  const total = list.reduce((s, x) => s + x.value, 0)
  const r = emptyResult(c, "Inventario por familia")
  r.kpis = [kpi("Valor total a costo", fmtMxn(total)), kpi("Familia líder", list[0].family, { detail: `${fmtMxn(list[0].value)} · ${fmtPct((list[0].value / total) * 100)}` })]
  r.summary = `${list[0].family} concentra la mayor parte del inventario: ${fmtMxn(list[0].value)} (${fmtPct((list[0].value / total) * 100)} de ${fmtMxn(total)} a costo).`
  r.chart = { kind: "donut", title: "Inventario por familia (a costo)", xKey: "nombre", series: [{ key: "valor", label: "Valor (MXN)" }], data: list.map((x) => ({ nombre: x.family, valor: x.value })), format: "currency" }
  r.table = { columns: [col("familia", "Familia"), col("skus", "SKUs", "number"), col("metros", "Metros equiv.", "number"), col("valor", "Valor a costo", "currency"), col("part", "% del total", "percent")], rows: list.map((x) => ({ familia: x.family, skus: x.skus, metros: Math.round(x.meters), valor: x.value, part: r2((x.value / total) * 100) })), totalRows: list.length }
  r.evidence = { calc: "Valor = Σ(existencia × costo unitario) por familia, solo SKUs con existencia positiva.", source: c.source, records: list.map((x) => ({ kind: "producto" as const, id: x.family, date: null, who: x.family, amountMxn: x.value })), totalRecords: list.length }
  r.followUps = ["¿Cuánto stock hay por almacén?", "¿Qué productos no tienen movimiento?"]
  return r
}

export function hNoMovement(c: HandlerCtx, stock: StockRow[]): CopilotResult {
  const days = c.plan.inactiveDays ?? 180
  const rows = noMovement(rowsFor(c, stock), c.view.asOf, days).sort((a, b) => b.valueMxn - a.valueMxn)
  if (!rows.length) return noData(c, "Inventario sin movimiento", `Todos los SKUs con existencia tuvieron algún movimiento en los últimos ${days} días.`)
  const value = rows.reduce((s, x) => s + x.valueMxn, 0)
  const r = emptyResult(c, "Inventario sin movimiento")
  r.kpis = [kpi("SKUs sin movimiento", fmtInt(rows.length), { raw: rows.length, tone: "warn", detail: `${days}+ días` }), kpi("Capital inmovilizado", fmtMxn(value), { detail: "a costo" })]
  r.summary = `${fmtInt(rows.length)} SKUs con existencia no tienen movimientos (ventas, compras, devoluciones o traspasos) en los últimos ${days} días; inmovilizan ${fmtMxn(value)} a costo. El mayor es ${rows[0].product.name} (${fmtMxn(rows[0].valueMxn)}).`
  r.table = { columns: [col("sku", "SKU"), col("nombre", "Producto"), col("familia", "Familia"), col("stock", "Existencia", "number"), col("valor", "Valor a costo", "currency"), col("ultimo", "Último movimiento", "date")], rows: rows.slice(0, MAX_TABLE_ROWS).map((x) => ({ sku: x.product.sku, nombre: x.product.name, familia: x.product.family, stock: x.totalQty, valor: x.valueMxn, ultimo: x.lastMovementDate })), totalRows: rows.length }
  r.chart = { kind: "bar", title: "Capital inmovilizado por SKU (primeros 10)", xKey: "nombre", series: [{ key: "valor", label: "Valor a costo (MXN)" }], data: rows.slice(0, 10).map((x) => ({ nombre: x.product.sku.replace(/^SW-/, ""), valor: x.valueMxn })), format: "currency" }
  r.evidence = { calc: `Existencia > 0 y sin movimientos distintos de la apertura en los últimos ${days} días.`, source: c.source, records: rows.slice(0, 15).map((x) => ({ kind: "producto" as const, id: x.product.sku, date: x.lastMovementDate, who: x.product.name, amountMxn: x.valueMxn })), totalRecords: rows.length }
  r.assumptions.push(`Umbral: ${days} días sin movimientos.`)
  r.followUps = ["¿Qué productos no se han vendido?", "¿Qué familia concentra más inventario?"]
  return r
}

// ---------- finanzas ----------
function arRows(c: HandlerCtx): InvoiceBalance[] {
  return openInvoices(c.view, c.view.asOf, c.plan.filters.customerId)
}
const invEvidence = (c: HandlerCtx, rows: InvoiceBalance[], calc: string) => ({
  calc,
  source: c.source,
  records: [...rows].sort((a, b) => b.balanceMxn - a.balanceMxn).slice(0, 15).map((x): EvidenceRecord => ({ kind: "factura", id: x.invoice.id, date: x.invoice.date, who: x.customer.name, amountMxn: x.balanceMxn, detail: x.daysOverdue > 0 ? `${x.daysOverdue} días vencida` : "por vencer" })),
  totalRecords: rows.length,
})
const BALANCE_CALC = "Saldo de factura = total con IVA − pagos − notas de crédito aplicadas (moneda del documento), convertido a MXN con el tipo de cambio de la factura. Vencida = fecha de corte > fecha de vencimiento."

export function hReceivables(c: HandlerCtx): CopilotResult {
  const rows = arRows(c)
  if (!rows.length) return noData(c, "Cuentas por cobrar", "No hay facturas con saldo pendiente.")
  const s = summarizeReceivables(rows)
  const byC = receivablesByCustomer(rows).sort((a, b) => b.balanceMxn - a.balanceMxn)
  const r = emptyResult(c, "Cuentas por cobrar")
  r.kpis = [kpi("Por cobrar", fmtMxn(s.totalMxn), { raw: s.totalMxn, detail: `${fmtInt(s.openCount)} facturas abiertas` }), kpi("Vencido", fmtMxn(s.overdueMxn), { raw: s.overdueMxn, tone: s.overdueMxn ? "bad" : "good", detail: fmtPct(s.overdueAmountPct) + " del saldo" }), kpi("Clientes con saldo", fmtInt(byC.length))]
  r.summary = `Los clientes nos deben ${fmtMxn(s.totalMxn)} en ${fmtInt(s.openCount)} facturas abiertas${c.plan.filters.customerId ? ` (${c.view.customerById.get(c.plan.filters.customerId)?.name})` : ""}; ${fmtMxn(s.overdueMxn)} (${fmtPct(s.overdueAmountPct)}) está vencido. El mayor deudor es ${byC[0].customer.name} con ${fmtMxn(byC[0].balanceMxn)}.`
  r.chart = { kind: "bar", title: "Saldo por cobrar — top 10 clientes", xKey: "nombre", series: [{ key: "saldo", label: "Saldo (MXN)" }, { key: "vencido", label: "Vencido (MXN)" }], data: byC.slice(0, 10).map((x) => ({ nombre: x.customer.name, saldo: x.balanceMxn, vencido: x.overdueMxn })), format: "currency" }
  r.table = { columns: [col("pos", "#", "number"), col("cliente", "Cliente"), col("saldo", "Saldo", "currency"), col("vencido", "Vencido", "currency"), col("facturas", "Facturas abiertas", "number"), col("dias", "Máx. días vencida", "number")], rows: byC.slice(0, MAX_TABLE_ROWS).map((x, i) => ({ pos: i + 1, cliente: x.customer.name, saldo: x.balanceMxn, vencido: x.overdueMxn, facturas: x.openInvoices, dias: x.maxDaysOverdue })), totalRows: byC.length }
  r.evidence = invEvidence(c, rows, BALANCE_CALC)
  r.caveats.push("Los saldos en USD se convierten a MXN con el tipo de cambio de la factura, no con el del día de corte.")
  r.followUps = ["¿Qué facturas están vencidas?", "Antigüedad de saldos", "¿Qué porcentaje de facturas está vencido?"]
  return r
}

export function hOverdue(c: HandlerCtx): CopilotResult {
  const all = arRows(c)
  const min = c.plan.minDaysOverdue ?? 0
  const rows = all.filter((x) => x.daysOverdue > min)
  if (!rows.length) return noData(c, "Facturas vencidas", min ? `No hay facturas con más de ${min} días de vencimiento.` : "No hay facturas vencidas al corte.")
  const total = rows.reduce((s, x) => s + x.balanceMxn, 0)
  const custs = new Set(rows.map((x) => x.customer.id))
  const sorted = [...rows].sort((a, b) => b.balanceMxn - a.balanceMxn)
  const r = emptyResult(c, min ? `Facturas vencidas a más de ${min} días` : "Facturas vencidas")
  r.kpis = [kpi("Saldo vencido", fmtMxn(total), { tone: "bad", raw: total }), kpi("Facturas", fmtInt(rows.length), { raw: rows.length }), kpi("Clientes", fmtInt(custs.size))]
  r.summary = `Hay ${fmtInt(rows.length)} facturas ${min ? `con más de ${min} días de vencimiento` : "vencidas"} por ${fmtMxn(total)} de ${fmtInt(custs.size)} clientes${c.plan.filters.customerId ? ` (${c.view.customerById.get(c.plan.filters.customerId)?.name})` : ""}. La mayor es ${sorted[0].invoice.id} de ${sorted[0].customer.name}: ${fmtMxn(sorted[0].balanceMxn)}, ${sorted[0].daysOverdue} días vencida.`
  const s = summarizeReceivables(rows)
  r.chart = { kind: "bar", title: "Saldo vencido por antigüedad", xKey: "rango", series: [{ key: "monto", label: "Saldo (MXN)" }], data: s.byBucket.filter((b) => b.bucket !== "Por vencer").map((b) => ({ rango: b.bucket, monto: b.amountMxn })), format: "currency" }
  r.table = { columns: [col("factura", "Factura"), col("cliente", "Cliente"), col("vence", "Vencimiento", "date"), col("dias", "Días vencida", "number"), col("saldo", "Saldo (MXN)", "currency"), col("rango", "Antigüedad")], rows: sorted.slice(0, MAX_TABLE_ROWS).map((x) => ({ factura: x.invoice.id, cliente: x.customer.name, vence: x.invoice.dueDate, dias: x.daysOverdue, saldo: x.balanceMxn, rango: x.bucket })), totalRows: rows.length }
  r.evidence = invEvidence(c, rows, BALANCE_CALC)
  r.followUps = ["¿Quién nos debe más?", "Antigüedad de saldos", "¿Qué clientes tienen saldo vencido?"]
  return r
}

export function hCustomerBalance(c: HandlerCtx): CopilotResult {
  const rows = arRows(c)
  const byC = receivablesByCustomer(rows).filter((x) => x.overdueMxn > 0).sort((a, b) => b.overdueMxn - a.overdueMxn)
  if (!byC.length) return noData(c, "Saldo vencido por cliente", "Ningún cliente tiene saldo vencido al corte.")
  const total = byC.reduce((s, x) => s + x.overdueMxn, 0)
  const r = emptyResult(c, "Clientes con saldo vencido")
  r.kpis = [kpi("Clientes con vencido", fmtInt(byC.length), { tone: "bad" }), kpi("Saldo vencido", fmtMxn(total)), kpi("Mayor deudor", byC[0].customer.name, { detail: fmtMxn(byC[0].overdueMxn) })]
  r.summary = `${fmtInt(byC.length)} clientes tienen saldo vencido, en total ${fmtMxn(total)}. El mayor es ${byC[0].customer.name} con ${fmtMxn(byC[0].overdueMxn)} vencidos (hasta ${byC[0].maxDaysOverdue} días).`
  r.chart = { kind: "bar", title: "Saldo vencido por cliente (top 10)", xKey: "nombre", series: [{ key: "vencido", label: "Vencido (MXN)" }], data: byC.slice(0, 10).map((x) => ({ nombre: x.customer.name, vencido: x.overdueMxn })), format: "currency" }
  r.table = { columns: [col("pos", "#", "number"), col("cliente", "Cliente"), col("vencido", "Vencido", "currency"), col("saldo", "Saldo total", "currency"), col("facturas", "Facturas vencidas", "number"), col("dias", "Máx. días", "number"), col("limite", "Límite de crédito", "currency")], rows: byC.slice(0, MAX_TABLE_ROWS).map((x, i) => ({ pos: i + 1, cliente: x.customer.name, vencido: x.overdueMxn, saldo: x.balanceMxn, facturas: x.overdueInvoices, dias: x.maxDaysOverdue, limite: x.customer.creditLimit })), totalRows: byC.length }
  r.evidence = invEvidence(c, rows.filter((x) => x.daysOverdue > 0), BALANCE_CALC)
  r.followUps = ["¿Qué facturas están vencidas?", "Antigüedad de saldos"]
  return r
}

export function hOverduePct(c: HandlerCtx): CopilotResult {
  const rows = arRows(c)
  if (!rows.length) return noData(c, "Cartera vencida", "No hay facturas con saldo pendiente.")
  const s = summarizeReceivables(rows)
  const r = emptyResult(c, "Porcentaje de cartera vencida")
  r.kpis = [kpi("Facturas vencidas", fmtPct(s.overdueCountPct), { raw: s.overdueCountPct ?? 0, tone: "bad", detail: `${fmtInt(s.overdueCount)} de ${fmtInt(s.openCount)} abiertas` }), kpi("Saldo vencido", fmtPct(s.overdueAmountPct), { tone: "bad", detail: `${fmtMxn(s.overdueMxn)} de ${fmtMxn(s.totalMxn)}` })]
  r.summary = `${fmtInt(s.overdueCount)} de ${fmtInt(s.openCount)} facturas con saldo están vencidas (${fmtPct(s.overdueCountPct)} por número de facturas); en monto representan ${fmtPct(s.overdueAmountPct)} de la cartera (${fmtMxn(s.overdueMxn)} de ${fmtMxn(s.totalMxn)}).`
  r.chart = { kind: "donut", title: "Cartera por antigüedad", xKey: "rango", series: [{ key: "monto", label: "Saldo (MXN)" }], data: s.byBucket.filter((b) => b.amountMxn > 0).map((b) => ({ rango: b.bucket, monto: b.amountMxn })), format: "currency" }
  r.evidence = invEvidence(c, rows.filter((x) => x.daysOverdue > 0), BALANCE_CALC)
  r.assumptions.push("Porcentaje sobre facturas con saldo abierto (no sobre todas las facturas emitidas).")
  r.followUps = ["Antigüedad de saldos", "¿Qué clientes tienen saldo vencido?"]
  return r
}

export function hAging(c: HandlerCtx): CopilotResult {
  const rows = arRows(c)
  if (!rows.length) return noData(c, "Antigüedad de saldos", "No hay facturas con saldo pendiente.")
  const s = summarizeReceivables(rows)
  const min = c.plan.minDaysOverdue
  const over = min !== undefined ? rows.filter((x) => x.daysOverdue > min) : []
  const r = emptyResult(c, "Antigüedad de saldos")
  r.kpis = [...(min !== undefined ? [kpi(`Vencido a más de ${min} días`, fmtMxn(over.reduce((a, x) => a + x.balanceMxn, 0)), { raw: Math.round(over.reduce((a, x) => a + x.balanceMxn, 0) * 100) / 100, tone: "bad", detail: `${fmtInt(over.length)} facturas` })] : []), kpi("Total por cobrar", fmtMxn(s.totalMxn)), kpi("Total vencido", fmtMxn(s.overdueMxn), { tone: "bad" })]
  r.summary = `${min !== undefined ? `A más de ${min} días de vencimiento hay ${fmtMxn(over.reduce((a, x) => a + x.balanceMxn, 0))} en ${fmtInt(over.length)} facturas. ` : ""}Antigüedad de la cartera de ${fmtMxn(s.totalMxn)}: ${s.byBucket.map((b) => `${b.bucket} ${fmtMxn(b.amountMxn)}`).join(" · ")}.`
  r.chart = { kind: "bar", title: "Antigüedad de saldos", xKey: "rango", series: [{ key: "monto", label: "Saldo (MXN)" }], data: s.byBucket.map((b) => ({ rango: b.bucket, monto: b.amountMxn })), format: "currency" }
  r.table = { columns: [col("rango", "Rango"), col("facturas", "Facturas", "number"), col("monto", "Saldo (MXN)", "currency"), col("part", "% de la cartera", "percent")], rows: s.byBucket.map((b) => ({ rango: b.bucket, facturas: b.count, monto: b.amountMxn, part: s.totalMxn ? r2((b.amountMxn / s.totalMxn) * 100) : null })), totalRows: AGING_BUCKETS.length }
  r.evidence = invEvidence(c, min !== undefined ? over : rows, BALANCE_CALC)
  r.followUps = ["¿Qué facturas están vencidas?", "¿Quién nos debe más?"]
  return r
}

// ---------- CRM ----------
export function hPipeline(c: HandlerCtx): CopilotResult {
  const opps = openOpportunities(c.view).filter((o) => !c.plan.filters.families?.length || c.plan.filters.families.includes(o.family))
  if (!opps.length) return noData(c, "Pipeline comercial", "No hay oportunidades abiertas.")
  const st = pipelineByStage(opps)
  const total = st.reduce((s, x) => s + x.amountMxn, 0)
  const weighted = st.reduce((s, x) => s + x.weightedMxn, 0)
  const r = emptyResult(c, "Pipeline comercial")
  r.kpis = [kpi("Pipeline abierto", fmtMxn(total), { raw: total, detail: `${fmtInt(opps.length)} oportunidades` }), kpi("Valor ponderado", fmtMxn(weighted), { raw: weighted, detail: "monto × probabilidad" }), kpi("Probabilidad media", fmtPct(total ? (weighted / total) * 100 : null))]
  r.summary = `El pipeline abierto es de ${fmtMxn(total)} en ${fmtInt(opps.length)} oportunidades; ponderado por probabilidad de etapa vale ${fmtMxn(weighted)}.`
  r.chart = { kind: "bar", title: "Pipeline por etapa", xKey: "etapa", series: [{ key: "monto", label: "Monto (MXN)" }, { key: "ponderado", label: "Ponderado (MXN)" }], data: st.map((x) => ({ etapa: x.stage, monto: x.amountMxn, ponderado: x.weightedMxn })), format: "currency" }
  r.table = { columns: [col("etapa", "Etapa"), col("n", "Oportunidades", "number"), col("monto", "Monto", "currency"), col("pond", "Ponderado", "currency")], rows: st.map((x) => ({ etapa: x.stage, n: x.count, monto: x.amountMxn, pond: x.weightedMxn })), totalRows: OPEN_STAGES.length }
  r.evidence = { calc: "Pipeline = Σ monto estimado de oportunidades no ganadas ni perdidas; ponderado = Σ monto × probabilidad de la etapa.", source: c.source, records: [...opps].sort((a, b) => b.amountMxn - a.amountMxn).slice(0, 15).map((o) => ({ kind: "oportunidad" as const, id: o.id, date: o.expectedClose, who: c.view.customerById.get(o.customerId)?.name ?? o.customerId, amountMxn: o.amountMxn, detail: `${o.stage} · ${o.probability}%` })), totalRecords: opps.length }
  r.followUps = ["¿Qué oportunidades tienen mayor valor?", "Tasa de conversión comercial"]
  return r
}

export function hOpportunities(c: HandlerCtx): CopilotResult {
  const opps = openOpportunities(c.view).filter((o) => !c.plan.filters.families?.length || c.plan.filters.families.includes(o.family)).sort((a, b) => b.amountMxn - a.amountMxn)
  if (!opps.length) return noData(c, "Oportunidades abiertas", "No hay oportunidades abiertas.")
  const top = opps.slice(0, Math.max(c.plan.limit, 10))
  const r = emptyResult(c, "Oportunidades abiertas")
  r.kpis = [kpi("Oportunidades abiertas", fmtInt(opps.length), { raw: opps.length }), kpi("Valor total", fmtMxn(opps.reduce((s, o) => s + o.amountMxn, 0))), kpi("Mayor", fmtMxn(opps[0].amountMxn), { detail: c.view.customerById.get(opps[0].customerId)?.name })]
  r.summary = `Hay ${fmtInt(opps.length)} oportunidades abiertas por ${fmtMxn(opps.reduce((s, o) => s + o.amountMxn, 0))}. La de mayor valor es «${opps[0].name}» (${fmtMxn(opps[0].amountMxn)}, ${opps[0].stage}, cierre estimado ${formatDateEs(opps[0].expectedClose)}).`
  r.table = { columns: [col("id", "Oportunidad"), col("cliente", "Cliente"), col("familia", "Familia"), col("etapa", "Etapa"), col("monto", "Monto", "currency"), col("prob", "Prob. %", "number"), col("cierre", "Cierre est.", "date"), col("resp", "Responsable")], rows: top.map((o) => ({ id: o.id, cliente: c.view.customerById.get(o.customerId)?.name ?? o.customerId, familia: o.family, etapa: o.stage, monto: o.amountMxn, prob: o.probability, cierre: o.expectedClose, resp: o.owner })), totalRows: opps.length }
  r.chart = { kind: "bar", title: "Oportunidades de mayor valor", xKey: "nombre", series: [{ key: "monto", label: "Monto (MXN)" }], data: top.slice(0, 10).map((o) => ({ nombre: c.view.customerById.get(o.customerId)?.name ?? o.id, monto: o.amountMxn })), format: "currency" }
  r.evidence = { calc: "Oportunidades en etapa Prospecto, Calificada, Cotizada o Negociación, ordenadas por monto estimado.", source: c.source, records: top.slice(0, 15).map((o) => ({ kind: "oportunidad" as const, id: o.id, date: o.expectedClose, who: c.view.customerById.get(o.customerId)?.name ?? o.customerId, amountMxn: o.amountMxn, detail: `${o.stage} · ${o.probability}%` })), totalRecords: opps.length }
  r.followUps = ["¿Cuál es el valor del pipeline?", "Tasa de conversión comercial"]
  return r
}

export function hConversion(c: HandlerCtx): CopilotResult {
  const win = opportunityWinRate(c.view)
  const q = quoteConversion(c.view)
  const lost = c.view.data.opportunities.filter((o) => o.stage === "Perdida" && o.lostReason)
  const reasons = new Map<string, number>()
  for (const o of lost) reasons.set(o.lostReason!, (reasons.get(o.lostReason!) ?? 0) + 1)
  const r = emptyResult(c, "Conversión comercial")
  r.kpis = [kpi("Oportunidades ganadas", fmtPct(win.ratePct), { detail: `${win.won} ganadas · ${win.lost} perdidas` }), kpi("Cotizaciones ganadas", fmtPct(q.ratePct), { detail: `${q.won} de ${q.closed} cerradas` })]
  r.summary = `De las oportunidades cerradas, ${win.won} se ganaron y ${win.lost} se perdieron (conversión ${fmtPct(win.ratePct)}). En cotizaciones cerradas (ganadas + perdidas + vencidas) la tasa de cierre es ${fmtPct(q.ratePct)}: ${q.won} de ${q.closed}.${reasons.size ? ` Principal motivo de pérdida: ${[...reasons.entries()].sort((a, b) => b[1] - a[1])[0][0]}.` : ""}`
  r.chart = { kind: "bar", title: "Motivos de pérdida de oportunidades", xKey: "motivo", series: [{ key: "n", label: "Oportunidades" }], data: [...reasons.entries()].sort((a, b) => b[1] - a[1]).map(([motivo, n]) => ({ motivo, n })), format: "number" }
  r.evidence = { calc: "Conversión de oportunidades = ganadas ÷ (ganadas + perdidas). Tasa de cotizaciones = ganadas ÷ (ganadas + perdidas + vencidas); las vigentes no cuentan como cerradas.", source: c.source, records: c.view.data.opportunities.filter((o) => o.stage === "Perdida").slice(0, 15).map((o) => ({ kind: "oportunidad" as const, id: o.id, date: o.expectedClose, who: c.view.customerById.get(o.customerId)?.name ?? o.customerId, amountMxn: o.amountMxn, detail: o.lostReason ?? "" })), totalRecords: win.lost }
  r.followUps = ["¿Cuántas cotizaciones fueron ganadas?", "¿Cuál es el valor del pipeline?"]
  return r
}

export function hQuotes(c: HandlerCtx): CopilotResult {
  const q = quoteConversion(c.view)
  const total = c.view.data.quotes.length
  const r = emptyResult(c, "Cotizaciones")
  r.kpis = [kpi("Cotizaciones", fmtInt(total)), kpi("Ganadas", fmtInt(q.won), { raw: q.won, tone: "good", detail: fmtMxn(q.wonAmountMxn) }), kpi("Tasa de cierre", fmtPct(q.ratePct))]
  r.summary = `Hay ${fmtInt(total)} cotizaciones: ${fmtInt(q.won)} ganadas (${fmtMxn(q.wonAmountMxn)}), ${fmtInt(q.lost)} perdidas, ${fmtInt(q.expired)} vencidas y ${fmtInt(q.open)} vigentes. Tasa de cierre: ${fmtPct(q.ratePct)}.`
  const rows = [{ estado: "Ganada", n: q.won }, { estado: "Perdida", n: q.lost }, { estado: "Vencida", n: q.expired }, { estado: "Vigente", n: q.open }]
  r.chart = { kind: "donut", title: "Cotizaciones por estado", xKey: "estado", series: [{ key: "n", label: "Cotizaciones" }], data: rows, format: "number" }
  r.table = { columns: [col("estado", "Estado"), col("n", "Cotizaciones", "number")], rows, totalRows: rows.length }
  r.evidence = { calc: "Conteo de cotizaciones por estado; monto ganado convertido a MXN con el tipo de cambio del documento.", source: c.source, records: c.view.data.quotes.filter((x) => x.status === "Ganada").slice(-15).map((x) => ({ kind: "cotizacion" as const, id: x.id, date: x.date, who: c.view.customerById.get(x.customerId)?.name ?? x.customerId, amountMxn: r2(x.total * x.fx), detail: x.orderId ?? "" })), totalRecords: q.won }
  r.followUps = ["Tasa de conversión comercial", "¿Cuál es el valor del pipeline?"]
  return r
}

export { computeStock }
