import { addDays, addMonths, diffDays, endOfMonth, formatDateEs, monthKey, monthLabel, startOfMonth } from "../dates"
import { aggregateSales, pctChange, rank, salesSeries, selectRows, totalForFilter, type SalesGroup } from "../analytics/sales"
import { linearForecast } from "../analytics/forecast"
import { fmtDelta, fmtInt, fmtMxn, fmtMxnCompact, fmtPct, fmtUnits } from "../format"
import { likeForLikePrevious, previousPeriod, type PeriodSpec } from "../nlu/entities"
import type { ChartSpec, CopilotResult } from "../result"
import { col, coverageCaveat, emptyResult, kpi, MAX_TABLE_ROWS, noData, periodNote, salesEvidence, salesFilter, scopeText, type HandlerCtx } from "./kit"

const asSpec = (p: NonNullable<HandlerCtx["plan"]["period"]>): PeriodSpec => p

function trendDim(p: { from: string; to: string }): "day" | "week" | "month" {
  const days = diffDays(p.to, p.from) + 1
  return days <= 14 ? "day" : days <= 120 ? "week" : "month"
}

function seriesChart(title: string, groups: SalesGroup[], withMargin = false): ChartSpec {
  return {
    kind: groups.length > 40 ? "area" : "line",
    title,
    xKey: "periodo",
    series: [{ key: "venta", label: "Venta neta (MXN)" }, ...(withMargin ? [{ key: "margen", label: "Margen bruto (MXN)" }] : [])],
    data: groups.map((g) => ({ periodo: g.label, venta: g.netMxn, ...(withMargin ? { margen: g.marginMxn } : {}) })),
    format: "currency",
  }
}

function rankChart(title: string, groups: SalesGroup[], key: "netMxn" | "marginMxn" = "netMxn", kind: ChartSpec["kind"] = "bar"): ChartSpec {
  return {
    kind,
    title,
    xKey: "nombre",
    series: [{ key: "valor", label: key === "netMxn" ? "Venta neta (MXN)" : "Margen bruto (MXN)" }],
    data: groups.map((g) => ({ nombre: g.label, valor: g[key] })),
    format: "currency",
  }
}

/** Periodo previo comparable: mismos días transcurridos si el actual está incompleto. */
export function comparablePrevious(c: HandlerCtx, p: PeriodSpec): { spec: PeriodSpec; note: string | null } {
  const ref = c.view.asOf
  const llp = likeForLikePrevious(p, ref)
  if (llp) return { spec: llp, note: `${p.label} está incompleto; se compara contra los mismos días de ${previousPeriod(p, ref).label}.` }
  return { spec: previousPeriod(p, ref), note: null }
}

export function hSalesTotal(c: HandlerCtx): CopilotResult {
  const p = c.plan.period!
  const f = salesFilter(c.plan)
  const g = totalForFilter(c.view, f)
  const title = "Ventas netas"
  if (!g.orders && !g.netMxn) return noData(c, title, `No encontré ventas en ${periodNote(p)}${scopeText(c)}.`)
  const r = emptyResult(c, title)
  const cmp = comparablePrevious(c, asSpec(p))
  const prevOk = p.kind !== "day" && cmp.spec.from >= c.view.data.meta.rangeStart
  const prev = prevOk ? totalForFilter(c.view, salesFilter(c.plan, cmp.spec)) : null
  const delta = prev && prev.netMxn ? pctChange(g.netMxn, prev.netMxn) : null
  const ticket = g.orders ? g.netMxn / g.orders : 0
  r.kpis = [
    kpi("Venta neta", fmtMxn(g.netMxn), { raw: g.netMxn, detail: prev ? `${fmtDelta(delta)} vs ${cmp.spec.label}` : undefined, tone: delta === null ? "neutral" : delta >= 0 ? "good" : "bad" }),
    kpi("Pedidos", fmtInt(g.orders), { raw: g.orders }),
    kpi("Ticket promedio", fmtMxn(ticket), { raw: ticket }),
    kpi("Margen bruto", fmtPct(g.marginPct), { detail: fmtMxn(g.marginMxn), raw: g.marginPct ?? 0 }),
  ]
  r.summary = `En ${p.label} la venta neta fue ${fmtMxn(g.netMxn)}${scopeText(c)}, con ${fmtInt(g.orders)} pedidos y un ticket promedio de ${fmtMxn(ticket)}. Cantidad vendida: ${fmtUnits(g.unitsByUnit)}.${prev ? ` Contra ${cmp.spec.label} (${fmtMxn(prev.netMxn)}): ${fmtDelta(delta)}.` : ""}`
  if (cmp.note) r.caveats.push(cmp.note)
  if (!prevOk && p.kind !== "day") r.caveats.push(`No hay registros del periodo comparable (${cmp.spec.label}): el dataset inicia el ${formatDateEs(c.view.data.meta.rangeStart)}, por eso no se muestra variación.`)
  const cov = coverageCaveat(c, p)
  if (cov) r.caveats.push(cov)
  const days = diffDays(p.to, p.from) + 1
  if (days >= 28 || (c.plan.visualization !== "auto" && days >= 3)) {
    const dim = trendDim(p)
    r.chart = seriesChart(`Venta neta por ${dim === "month" ? "mes" : dim === "week" ? "semana" : "día"}`, salesSeries(c.view, f, dim))
  }
  r.evidence = salesEvidence(c, selectRows(c.view, f), "Venta neta = Σ(cantidad × precio − descuento) de pedidos no cancelados, convertida a MXN con el tipo de cambio del documento, menos notas de crédito del periodo.")
  r.followUps = ["Compara con el mes pasado", "Muéstramelo en una gráfica", "¿Quiénes son mis 10 mejores clientes?"]
  return r
}

export function hSalesTrend(c: HandlerCtx): CopilotResult {
  const p = c.plan.period!
  const f = salesFilter(c.plan)
  const dim = (c.plan.dimension && ["day", "week", "month", "quarter"].includes(c.plan.dimension) ? c.plan.dimension : trendDim(p)) as "day" | "week" | "month" | "quarter"
  const groups = salesSeries(c.view, f, dim)
  const total = groups.reduce((s, g) => s + g.netMxn, 0)
  if (!total) return noData(c, "Tendencia de ventas", `No encontré ventas en ${periodNote(p)}${scopeText(c)}.`)
  const r = emptyResult(c, "Tendencia de ventas")
  const best = rank(groups, "netMxn", "desc", 1)[0]
  const dimLabel = { day: "día", week: "semana", month: "mes", quarter: "trimestre" }[dim]
  r.kpis = [kpi("Venta neta del periodo", fmtMxn(total), { raw: total }), kpi(`Mejor ${dimLabel}`, best.label, { detail: fmtMxn(best.netMxn) }), kpi("Promedio", fmtMxn(total / groups.length), { detail: `por ${dimLabel}` })]
  r.summary = `Entre ${periodNote(p)} la venta neta acumulada fue ${fmtMxn(total)}${scopeText(c)}. El mejor ${dimLabel} fue ${best.label} con ${fmtMxn(best.netMxn)}.`
  r.chart = seriesChart(`Venta neta por ${dimLabel}`, groups, true)
  r.table = { columns: [col("periodo", dimLabel[0].toUpperCase() + dimLabel.slice(1)), col("venta", "Venta neta", "currency"), col("pedidos", "Pedidos", "number"), col("margen", "Margen %", "percent")], rows: groups.slice(-MAX_TABLE_ROWS).map((g) => ({ periodo: g.label, venta: g.netMxn, pedidos: g.orders, margen: g.marginPct })), totalRows: groups.length }
  if (groups.some((g) => g.key === monthKey(c.view.asOf)) && dim === "month") r.caveats.push(`${monthLabel(monthKey(c.view.asOf))} está incompleto (al ${formatDateEs(c.view.asOf)}).`)
  const cov = coverageCaveat(c, p)
  if (cov) r.caveats.push(cov)
  r.evidence = salesEvidence(c, selectRows(c.view, f), "Serie = venta neta agrupada por periodo calendario; los periodos sin ventas aparecen en cero.")
  r.followUps = ["¿Qué mes fue el mejor?", "Pronóstico de ventas", "Ventas por categoría"]
  return r
}

export function hSalesComparison(c: HandlerCtx): CopilotResult {
  const cur = c.plan.period!
  const prevSpec = c.plan.comparison
  if (!prevSpec) return noData(c, "Comparación de ventas", "Necesito dos periodos para comparar. Por ejemplo: «compara octubre con septiembre».")
  if (prevSpec.from < c.view.data.meta.rangeStart && prevSpec.to < c.view.data.meta.rangeStart) {
    return noData(c, "Comparación de ventas", `No tengo registros suficientes para ${prevSpec.label}: el dataset inicia el ${formatDateEs(c.view.data.meta.rangeStart)}.`)
  }
  const r = emptyResult(c, "Comparación de ventas")
  const f1 = salesFilter(c.plan, cur)
  const f0 = salesFilter(c.plan, prevSpec)
  const g1 = totalForFilter(c.view, f1)
  const g0 = totalForFilter(c.view, f0)
  const delta = pctChange(g1.netMxn, g0.netMxn)
  const dMargin = g1.marginPct !== null && g0.marginPct !== null ? Math.round((g1.marginPct - g0.marginPct) * 100) / 100 : null
  r.kpis = [
    kpi(cur.label, fmtMxn(g1.netMxn), { raw: g1.netMxn, detail: `${fmtInt(g1.orders)} pedidos` }),
    kpi(prevSpec.label, fmtMxn(g0.netMxn), { raw: g0.netMxn, detail: `${fmtInt(g0.orders)} pedidos` }),
    kpi("Variación", fmtDelta(delta), { tone: delta === null ? "neutral" : delta >= 0 ? "good" : "bad", detail: fmtMxn(g1.netMxn - g0.netMxn) }),
    kpi("Margen bruto", `${fmtPct(g1.marginPct)} vs ${fmtPct(g0.marginPct)}`, { detail: dMargin === null ? undefined : `${dMargin >= 0 ? "+" : ""}${dMargin} pts` }),
  ]
  r.summary = `${cur.label}: ${fmtMxn(g1.netMxn)}${scopeText(c)} frente a ${prevSpec.label}: ${fmtMxn(g0.netMxn)}. Variación ${fmtDelta(delta)} (${fmtMxn(g1.netMxn - g0.netMxn)}).`
  if (cur.partial && diffDays(cur.to, cur.from) < diffDays(prevSpec.to, prevSpec.from)) r.caveats.push(`${cur.label} tiene menos días que ${prevSpec.label}; la variación en bruto subestima el desempeño. Pide «compara con los mismos días» para una comparación equivalente.`)
  const cov = coverageCaveat(c, prevSpec)
  if (cov) r.caveats.push(cov)
  // Desglose por familia (o por producto si ya hay familia filtrada)
  const dim = c.plan.filters.families?.length ? "product" : "family"
  const a1 = new Map(aggregateSales(c.view, selectRows(c.view, f1), dim).map((g) => [g.key, g]))
  const a0 = new Map(aggregateSales(c.view, selectRows(c.view, f0), dim).map((g) => [g.key, g]))
  const keys = [...new Set([...a1.keys(), ...a0.keys()])]
  const rows = keys
    .map((k) => {
      const x1 = a1.get(k)
      const x0 = a0.get(k)
      return { nombre: (x1 ?? x0)!.label, actual: x1?.netMxn ?? 0, previo: x0?.netMxn ?? 0 }
    })
    .sort((a, b) => b.actual + b.previo - (a.actual + a.previo))
    .slice(0, dim === "family" ? 13 : 10)
  r.chart = { kind: "comparison", title: `Venta neta por ${dim === "family" ? "familia" : "producto"}: ${cur.label} vs ${prevSpec.label}`, xKey: "nombre", series: [{ key: "actual", label: cur.label }, { key: "previo", label: prevSpec.label }], data: rows, format: "currency" }
  r.table = { columns: [col("nombre", dim === "family" ? "Familia" : "Producto"), col("actual", cur.label.slice(0, 22), "currency"), col("previo", prevSpec.label.slice(0, 22), "currency"), col("var", "Variación", "percent")], rows: rows.map((x) => ({ ...x, var: pctChange(x.actual, x.previo) })), totalRows: keys.length }
  r.evidence = salesEvidence(c, selectRows(c.view, f1), `Variación % = (venta neta de ${cur.label} − venta neta de ${prevSpec.label}) ÷ venta neta de ${prevSpec.label}.`)
  r.followUps = ["Muéstramelo en una gráfica", "Ahora solo cables de medio voltaje", "¿Qué productos aumentaron sus ventas?"]
  return r
}

export function hSalesGrowth(c: HandlerCtx): CopilotResult {
  const r = hSalesComparison(c)
  if (r.status === "ok") {
    r.title = "Crecimiento de ventas"
    r.intent = c.plan.intent
  }
  return r
}

export function hRankByDimension(c: HandlerCtx, dim: "customer" | "product" | "family", opts: { by?: "netMxn" | "marginMxn" | "marginPct" | "orders"; minNet?: number; title: string; label: string } = { title: "", label: "" }): CopilotResult {
  const p = c.plan.period!
  const f = salesFilter(c.plan)
  const rows = selectRows(c.view, f)
  const groups = aggregateSales(c.view, rows, dim).filter((g) => g.netMxn > 0 && g.netMxn >= (opts.minNet ?? 0))
  const total = totalForFilter(c.view, f)
  if (!groups.length) return noData(c, opts.title, `No encontré ventas en ${periodNote(p)}${scopeText(c)}.`)
  const by = opts.by ?? "netMxn"
  const top = rank(groups, by, c.plan.sort, c.plan.limit)
  const r = emptyResult(c, opts.title)
  const lead = top[0]
  const share = total.netMxn ? (lead.netMxn / total.netMxn) * 100 : 0
  r.kpis = [kpi(opts.label + (c.plan.sort === "asc" ? " (menor)" : ""), lead.label, { detail: by === "marginPct" ? fmtPct(lead.marginPct) : fmtMxn(by === "marginMxn" ? lead.marginMxn : lead.netMxn) }), kpi("Venta neta total", fmtMxn(total.netMxn), { detail: periodNote(p) }), kpi(`Participación del #1`, fmtPct(share), { raw: share })]
  const topSum = top.reduce((s, g) => s + g.netMxn, 0)
  r.summary = `${opts.label} en ${p.label}${scopeText(c)}: ${lead.label}, con ${fmtMxn(by === "marginMxn" ? lead.marginMxn : lead.netMxn)}${by === "marginPct" ? ` (margen ${fmtPct(lead.marginPct)})` : ""}. Los ${top.length} listados suman ${fmtMxn(topSum)} (${fmtPct(total.netMxn ? (topSum / total.netMxn) * 100 : null)} de la venta neta total de ${fmtMxn(total.netMxn)}).`
  r.chart = rankChart(`${opts.title} — ${p.label}`, top, by === "marginMxn" ? "marginMxn" : "netMxn")
  const topFamilyOf = (key: string) => {
    if (dim !== "customer") return null
    const fam = aggregateSales(c.view, rows.filter((x) => x.customerId === key), "family")
    return rank(fam, "netMxn", "desc", 1)[0]?.label ?? null
  }
  r.table = {
    columns: [col("pos", "#", "number"), col("nombre", dim === "customer" ? "Cliente" : dim === "product" ? "Producto" : "Familia"), col("venta", "Venta neta", "currency"), col("margen", "Margen %", "percent"), col("pedidos", "Pedidos", "number"), col("part", "% del total", "percent"), ...(dim === "customer" ? [col("familia", "Familia principal")] : [col("cantidad", "Cantidad")])],
    rows: top.map((g, i) => ({ pos: i + 1, nombre: g.label, venta: g.netMxn, margen: g.marginPct, pedidos: g.orders, part: total.netMxn ? Math.round((g.netMxn / total.netMxn) * 1000) / 10 : null, ...(dim === "customer" ? { familia: topFamilyOf(g.key) } : { cantidad: fmtUnits(g.unitsByUnit) }) })),
    totalRows: groups.length,
  }
  r.evidence = salesEvidence(c, rows.filter((x) => top.some((g) => g.key === (dim === "customer" ? x.customerId : dim === "product" ? x.sku : x.family))), `Ranking por ${by === "marginMxn" ? "margen bruto" : "venta neta"} (${c.plan.sort === "asc" ? "ascendente" : "descendente"}), agrupado por ${dim === "customer" ? "cliente" : dim === "product" ? "producto" : "familia"}; se excluyen elementos sin venta en el periodo.`)
  if (opts.minNet) r.assumptions.push(`Solo se consideran productos con venta neta ≥ ${fmtMxn(opts.minNet)} para evitar márgenes de muestras mínimas.`)
  const cov = coverageCaveat(c, p)
  if (cov) r.caveats.push(cov)
  r.followUps = dim === "customer" ? ["¿Qué tres clientes concentran más ingresos?", "Muéstramelo en una gráfica", "Ahora solo cables de minería"] : ["¿Qué productos tienen mayor margen?", "Ventas por categoría", "Compara con el mes pasado"]
  return r
}

export function hSalesByCategory(c: HandlerCtx): CopilotResult {
  const r = hRankByDimension({ ...c, plan: { ...c.plan, limit: 13 } }, "family", { title: "Ventas por categoría", label: "Categoría líder" })
  if (r.status !== "ok") return r
  const total = r.table!.rows.reduce((s, x) => s + (x.venta as number), 0)
  r.chart = { kind: "donut", title: `Participación por familia — ${c.plan.period!.label}`, xKey: "nombre", series: [{ key: "valor", label: "Venta neta (MXN)" }], data: r.table!.rows.map((x) => ({ nombre: x.nombre as string, valor: x.venta as number })), format: "currency" }
  r.summary = `Por categoría en ${c.plan.period!.label}${scopeText(c)}, la que más ingresos aporta es ${r.table!.rows[0].nombre} (${fmtMxn(r.table!.rows[0].venta as number)}, ${fmtPct(r.table!.rows[0].part as number)}). Total de las ${r.table!.rows.length} familias con venta: ${fmtMxn(total)}.`
  r.followUps = ["Compara el trimestre actual con el anterior", "Ventas por categoría mes a mes", "¿Qué familia deja más margen?"]
  return r
}

export function hBestPeriod(c: HandlerCtx): CopilotResult {
  const p = c.plan.period!
  const f = salesFilter(c.plan)
  const dim = (c.plan.dimension && ["week", "month", "quarter", "day"].includes(c.plan.dimension) ? c.plan.dimension : "month") as "day" | "week" | "month" | "quarter"
  let groups = salesSeries(c.view, f, dim).filter((g) => g.netMxn !== 0)
  // El periodo en curso está incompleto: no compite por «mejor»
  const completeOnly = groups.filter((g) => (dim === "month" ? g.key < monthKey(c.view.asOf) : dim === "day" ? true : g.key < c.view.asOf))
  const incompleteExcluded = completeOnly.length !== groups.length
  groups = completeOnly
  if (!groups.length) return noData(c, "Mejor periodo", `No encontré ventas en ${periodNote(p)}${scopeText(c)}.`)
  const ordered = rank(groups, "netMxn", c.plan.sort, groups.length)
  const lead = ordered[0]
  const r = emptyResult(c, c.plan.sort === "asc" ? "Periodo con menores ventas" : "Mejor periodo de ventas")
  const unit = { day: "día", week: "semana", month: "mes", quarter: "trimestre" }[dim]
  r.kpis = [kpi(`${c.plan.sort === "asc" ? "Menor" : "Mejor"} ${unit}`, lead.label, { detail: fmtMxn(lead.netMxn) }), kpi("Pedidos", fmtInt(lead.orders)), kpi("Margen bruto", fmtPct(lead.marginPct))]
  r.summary = `${c.plan.sort === "asc" ? `El ${unit} de menores ventas` : `El mejor ${unit}`} entre ${periodNote(p)}${scopeText(c)} fue ${lead.label} con ${fmtMxn(lead.netMxn)} (${fmtInt(lead.orders)} pedidos).`
  r.chart = { kind: "bar", title: `Venta neta por ${unit}`, xKey: "periodo", series: [{ key: "venta", label: "Venta neta (MXN)" }], data: [...groups].sort((a, b) => (a.key < b.key ? -1 : 1)).map((g) => ({ periodo: g.label, venta: g.netMxn })), format: "currency" }
  r.table = { columns: [col("pos", "#", "number"), col("periodo", unit[0].toUpperCase() + unit.slice(1)), col("venta", "Venta neta", "currency"), col("pedidos", "Pedidos", "number")], rows: ordered.slice(0, 10).map((g, i) => ({ pos: i + 1, periodo: g.label, venta: g.netMxn, pedidos: g.orders })), totalRows: ordered.length }
  if (incompleteExcluded) r.caveats.push(`Se excluye el periodo en curso (${formatDateEs(c.view.asOf)}) por estar incompleto.`)
  r.evidence = salesEvidence(c, selectRows(c.view, { ...f, to: lead.key.length === 7 ? endOfMonth(`${lead.key}-01`) : f.to, from: lead.key.length === 7 ? `${lead.key}-01` : f.from }), `Se agrupa la venta neta por ${unit} calendario y se ordena; evidencia = pedidos del ${unit} ganador.`)
  r.followUps = ["Compara octubre con septiembre", "Tendencia de ventas", "Pronóstico de ventas"]
  return r
}

export function hTicket(c: HandlerCtx): CopilotResult {
  const p = c.plan.period!
  const f = salesFilter(c.plan)
  const g = totalForFilter(c.view, f)
  if (!g.orders) return noData(c, "Ticket promedio", `No encontré pedidos en ${periodNote(p)}${scopeText(c)}.`)
  const rowsV = selectRows(c.view, f).filter((x) => x.kind === "venta")
  const grossNet = rowsV.reduce((s, x) => s + x.netMxn, 0)
  const ticket = grossNet / g.orders
  const r = emptyResult(c, "Ticket promedio")
  r.kpis = [kpi("Ticket promedio", fmtMxn(ticket), { raw: ticket }), kpi("Pedidos", fmtInt(g.orders), { raw: g.orders }), kpi("Venta de pedidos", fmtMxn(grossNet), { raw: Math.round(grossNet * 100) / 100 })]
  r.summary = `El ticket promedio en ${p.label}${scopeText(c)} fue ${fmtMxn(ticket)} sobre ${fmtInt(g.orders)} pedidos (venta de pedidos ${fmtMxn(grossNet)}, antes de notas de crédito).`
  if (diffDays(p.to, p.from) >= 56) {
    const m = salesSeries(c.view, f, "month").filter((x) => x.orders)
    r.chart = { kind: "bar", title: "Ticket promedio por mes", xKey: "periodo", series: [{ key: "ticket", label: "Ticket (MXN)" }], data: m.map((x) => ({ periodo: x.label, ticket: Math.round((selectRows(c.view, { ...f, from: `${x.key}-01`, to: endOfMonth(`${x.key}-01`) }).filter((y) => y.kind === "venta").reduce((s, y) => s + y.netMxn, 0) / x.orders) * 100) / 100 })), format: "currency" }
  }
  r.evidence = salesEvidence(c, rowsV, "Ticket = venta neta de pedidos no cancelados ÷ número de pedidos distintos (sin notas de crédito).")
  r.followUps = ["Compara con el mes pasado", "¿Cuántos pedidos tuvimos?", "Tendencia de ventas"]
  return r
}

export function hConcentration(c: HandlerCtx): CopilotResult {
  const n = c.plan.limit
  const p = c.plan.period!
  const f = salesFilter(c.plan)
  const groups = aggregateSales(c.view, selectRows(c.view, f), "customer").filter((g) => g.netMxn > 0)
  const total = groups.reduce((s, g) => s + g.netMxn, 0)
  if (!total) return noData(c, "Concentración de ventas", `No encontré ventas en ${periodNote(p)}${scopeText(c)}.`)
  const top = rank(groups, "netMxn", "desc", n)
  const topSum = top.reduce((s, g) => s + g.netMxn, 0)
  const pct = (topSum / total) * 100
  const r = emptyResult(c, "Concentración de ventas")
  r.kpis = [kpi(`Top ${top.length} clientes`, fmtPct(pct), { raw: pct, detail: fmtMxn(topSum), tone: pct > 50 ? "warn" : "neutral" }), kpi("Venta neta total", fmtMxn(total)), kpi("Clientes con venta", fmtInt(groups.length))]
  r.summary = `Los ${top.length} clientes con mayor venta concentran ${fmtPct(pct)} de los ingresos de ${p.label}${scopeText(c)} (${fmtMxn(topSum)} de ${fmtMxn(total)}). ${pct > 50 ? "Hay dependencia relevante de pocos clientes." : "La concentración es moderada."}`
  r.chart = { kind: "donut", title: `Concentración — ${p.label}`, xKey: "nombre", series: [{ key: "valor", label: "Venta neta (MXN)" }], data: [...top.map((g) => ({ nombre: g.label, valor: g.netMxn })), { nombre: "Resto de clientes", valor: Math.round((total - topSum) * 100) / 100 }], format: "currency" }
  r.table = { columns: [col("pos", "#", "number"), col("nombre", "Cliente"), col("venta", "Venta neta", "currency"), col("part", "% del total", "percent")], rows: top.map((g, i) => ({ pos: i + 1, nombre: g.label, venta: g.netMxn, part: Math.round((g.netMxn / total) * 1000) / 10 })), totalRows: top.length }
  r.evidence = salesEvidence(c, selectRows(c.view, { ...f, customerIds: top.map((g) => g.key) }), `Concentración = Σ venta neta de los ${top.length} clientes líderes ÷ venta neta total del periodo.`)
  r.followUps = ["Muéstrame mis 10 mejores clientes", "¿Qué clientes dejaron de comprar?"]
  return r
}

export function hGrossMargin(c: HandlerCtx): CopilotResult {
  const p = c.plan.period!
  const f = salesFilter(c.plan)
  const g = totalForFilter(c.view, f)
  if (!g.netMxn) return noData(c, "Margen bruto", `No encontré ventas en ${periodNote(p)}${scopeText(c)}.`)
  const r = emptyResult(c, "Margen bruto")
  r.kpis = [kpi("Margen bruto", fmtPct(g.marginPct), { raw: g.marginPct ?? 0, detail: fmtMxn(g.marginMxn) }), kpi("Venta neta", fmtMxn(g.netMxn)), kpi("Costo de ventas", fmtMxn(g.cogsMxn))]
  r.summary = `El margen bruto de ${p.label}${scopeText(c)} fue ${fmtPct(g.marginPct)}: ${fmtMxn(g.marginMxn)} sobre una venta neta de ${fmtMxn(g.netMxn)} y un costo de ventas de ${fmtMxn(g.cogsMxn)}.`
  const fam = aggregateSales(c.view, selectRows(c.view, f), "family").filter((x) => x.netMxn > 0)
  const ranked = rank(fam, "marginPct", "desc", 13)
  r.chart = { kind: "bar", title: `Margen bruto % por familia — ${p.label}`, xKey: "nombre", series: [{ key: "valor", label: "Margen bruto (%)" }], data: ranked.map((x) => ({ nombre: x.label, valor: x.marginPct })), format: "percent" }
  r.table = { columns: [col("nombre", "Familia"), col("venta", "Venta neta", "currency"), col("costo", "Costo de ventas", "currency"), col("margen", "Margen bruto", "currency"), col("pct", "Margen %", "percent")], rows: ranked.map((x) => ({ nombre: x.label, venta: x.netMxn, costo: x.cogsMxn, margen: x.marginMxn, pct: x.marginPct })), totalRows: ranked.length }
  r.evidence = salesEvidence(c, selectRows(c.view, f), "Margen bruto = venta neta − costo de ventas (cantidad × costo unitario en MXN; las devoluciones físicas revierten su costo). Margen % = margen ÷ venta neta.")
  r.followUps = ["¿Qué productos tienen mayor margen?", "Compara con el mes pasado", "Margen por familia"]
  return r
}

export function hProductGrowth(c: HandlerCtx): CopilotResult {
  const cur = c.plan.period!
  const prev = c.plan.comparison
  if (!prev) return noData(c, "Productos en crecimiento", "No pude determinar el periodo de comparación.")
  const f1 = salesFilter(c.plan, cur)
  const f0 = salesFilter(c.plan, prev)
  const a1 = new Map(aggregateSales(c.view, selectRows(c.view, f1), "product").map((g) => [g.key, g]))
  const a0 = new Map(aggregateSales(c.view, selectRows(c.view, f0), "product").map((g) => [g.key, g]))
  const rows = [...new Set([...a1.keys(), ...a0.keys()])]
    .map((k) => {
      const x1 = a1.get(k)
      const x0 = a0.get(k)
      return { sku: k, nombre: (x1 ?? x0)!.label, actual: x1?.netMxn ?? 0, previo: x0?.netMxn ?? 0 }
    })
    .filter((x) => Math.max(x.actual, x.previo) >= 20_000)
    .map((x) => ({ ...x, cambio: Math.round((x.actual - x.previo) * 100) / 100, pct: pctChange(x.actual, x.previo) }))
  const asc = c.plan.sort === "asc"
  const sorted = rows.sort((a, b) => (asc ? a.cambio - b.cambio : b.cambio - a.cambio)).filter((x) => (asc ? x.cambio < 0 : x.cambio > 0)).slice(0, c.plan.limit)
  if (!sorted.length) return noData(c, "Productos en crecimiento", `Ningún producto ${asc ? "bajó" : "creció"} de forma material entre ${prev.label} y ${cur.label}.`)
  const r = emptyResult(c, asc ? "Productos con ventas a la baja" : "Productos en crecimiento")
  r.kpis = [kpi(asc ? "Mayor caída" : "Mayor crecimiento", sorted[0].nombre, { detail: fmtMxn(sorted[0].cambio) }), kpi("Productos listados", fmtInt(sorted.length))]
  r.summary = `Comparando ${cur.label} contra ${prev.label}, el producto que más ${asc ? "cayó" : "creció"} es ${sorted[0].nombre} (${fmtMxn(sorted[0].cambio)}, ${fmtDelta(sorted[0].pct)}). Se consideran productos con al menos ${fmtMxn(20_000)} de venta en alguno de los dos periodos.`
  r.chart = { kind: "comparison", title: `${cur.label} vs ${prev.label}`, xKey: "nombre", series: [{ key: "actual", label: cur.label }, { key: "previo", label: prev.label }], data: sorted.map((x) => ({ nombre: x.nombre, actual: x.actual, previo: x.previo })), format: "currency" }
  r.table = { columns: [col("nombre", "Producto"), col("actual", "Periodo actual", "currency"), col("previo", "Periodo previo", "currency"), col("cambio", "Cambio", "currency"), col("pct", "Variación", "percent")], rows: sorted.map((x) => ({ nombre: x.nombre, actual: x.actual, previo: x.previo, cambio: x.cambio, pct: x.pct })), totalRows: sorted.length }
  r.evidence = salesEvidence(c, selectRows(c.view, { ...f1, sku: undefined }).filter((x) => sorted.some((s) => s.sku === x.sku)), "Cambio = venta neta del periodo actual − venta neta del periodo previo, por SKU.")
  r.followUps = ["¿Qué productos cayeron en ventas?", "Productos más vendidos", "Ventas por categoría"]
  return r
}

export function hNoSales(c: HandlerCtx, stockBySku: Map<string, number>): CopilotResult {
  const p = c.plan.period!
  const sold = new Set(selectRows(c.view, { ...salesFilter(c.plan), sku: undefined, customerId: undefined, customerIds: undefined }).filter((x) => x.kind === "venta").map((x) => x.sku))
  const fam = c.plan.filters.families
  const list = c.view.data.products.filter((x) => x.active && !sold.has(x.sku) && (!fam?.length || fam.includes(x.family)))
  const r = emptyResult(c, "Productos sin ventas")
  if (!list.length) return noData(c, "Productos sin ventas", `Todos los productos activos${fam?.length ? ` de ${fam.join(", ")}` : ""} tuvieron al menos una venta en ${periodNote(p)}.`)
  const value = list.reduce((s, x) => s + (stockBySku.get(x.sku) ?? 0) * x.costMxn, 0)
  r.kpis = [kpi("Productos sin ventas", fmtInt(list.length), { raw: list.length, tone: "warn" }), kpi("Inventario inmovilizado", fmtMxn(value), { detail: "a costo" }), kpi("Catálogo activo", fmtInt(c.view.data.products.filter((x) => x.active).length))]
  r.summary = `${fmtInt(list.length)} productos activos${fam?.length ? ` de ${fam.join(", ")}` : ""} no registraron ninguna venta en ${periodNote(p)}. Tienen ${fmtMxn(value)} en inventario a costo.`
  r.table = { columns: [col("sku", "SKU"), col("nombre", "Producto"), col("familia", "Familia"), col("stock", "Existencia", "number"), col("valor", "Valor a costo", "currency")], rows: list.slice(0, MAX_TABLE_ROWS).map((x) => ({ sku: x.sku, nombre: x.name, familia: x.family, stock: stockBySku.get(x.sku) ?? 0, valor: Math.round((stockBySku.get(x.sku) ?? 0) * x.costMxn * 100) / 100 })), totalRows: list.length }
  r.evidence = { calc: "Productos activos del catálogo cuyo SKU no aparece en ninguna línea de pedido no cancelado del periodo.", source: c.source, records: list.slice(0, 15).map((x) => ({ kind: "producto" as const, id: x.sku, date: null, who: x.name, amountMxn: Math.round((stockBySku.get(x.sku) ?? 0) * x.costMxn * 100) / 100 })), totalRecords: list.length }
  r.followUps = ["¿Qué productos no tienen movimiento?", "¿Qué familia concentra más inventario?"]
  return r
}

export function hForecast(c: HandlerCtx): CopilotResult {
  const f = salesFilter(c.plan, undefined)
  const last = addDays(startOfMonth(c.view.asOf), -1)
  const first = startOfMonth(addMonths(last, -11))
  const rangeStart = c.view.data.meta.rangeStart
  const series = salesSeries(c.view, { ...f, from: first < rangeStart ? startOfMonth(rangeStart) : first, to: last }, "month")
  const horizon = c.plan.horizonMonths ?? 3
  const fc = linearForecast(series.map((g) => g.netMxn), horizon)
  if (!fc) return noData(c, "Pronóstico de ventas", "No tengo registros suficientes para proyectar: se necesitan al menos 6 meses completos de historia.")
  const r = emptyResult(c, "Pronóstico de ventas")
  const monthsAhead = fc.points.map((_, i) => monthKey(addMonths(startOfMonth(c.view.asOf), i)))
  const nextTotal = fc.points.reduce((s, x) => s + x.predicted, 0)
  r.kpis = [kpi(`Próximos ${horizon} ${horizon === 1 ? "mes" : "meses"}`, fmtMxn(nextTotal), { raw: nextTotal, detail: "estimado" }), kpi("Tendencia mensual", `${fc.slope >= 0 ? "+" : ""}${fmtMxnCompact(fc.slope)}`, { detail: "por mes (pendiente lineal)", tone: fc.slope >= 0 ? "good" : "bad" }), kpi("Ajuste R²", fc.r2.toFixed(2), { detail: "calidad del ajuste lineal" })]
  r.summary = `Con una tendencia lineal sobre los últimos ${series.length} meses completos, estimo ${fmtMxn(fc.points[0].predicted)} para ${monthLabel(monthsAhead[0])} (rango ~80%: ${fmtMxn(fc.points[0].low)} – ${fmtMxn(fc.points[0].high)}). Acumulado de los próximos ${horizon} ${horizon === 1 ? "mes" : "meses"}: ${fmtMxn(nextTotal)}.`
  const data = [
    ...series.map((g, i) => ({ periodo: g.label, real: g.netMxn, pronostico: i === series.length - 1 ? g.netMxn : null, minimo: null as number | null, maximo: null as number | null })),
    ...fc.points.map((pt, i) => ({ periodo: monthLabel(monthsAhead[i]), real: null as number | null, pronostico: Math.round(pt.predicted), minimo: Math.round(pt.low), maximo: Math.round(pt.high) })),
  ]
  r.chart = { kind: "line", title: "Venta neta real y pronóstico", xKey: "periodo", series: [{ key: "real", label: "Real" }, { key: "pronostico", label: "Pronóstico" }, { key: "minimo", label: "Mínimo ~80%" }, { key: "maximo", label: "Máximo ~80%" }], data, format: "currency", forecastFrom: series.length }
  r.table = { columns: [col("periodo", "Mes"), col("pronostico", "Pronóstico", "currency"), col("minimo", "Mínimo ~80%", "currency"), col("maximo", "Máximo ~80%", "currency")], rows: data.slice(series.length).map((x) => ({ periodo: x.periodo, pronostico: x.pronostico, minimo: x.minimo, maximo: x.maximo })), totalRows: fc.points.length }
  r.caveats.push("Pronóstico estadístico simple (regresión lineal), NO un modelo de machine learning ni incluye estacionalidad; úsalo como referencia direccional.")
  r.caveats.push(`El mes en curso (${monthLabel(monthKey(c.view.asOf))}) está incompleto y no se usa para ajustar la tendencia.`)
  r.evidence = salesEvidence(c, selectRows(c.view, { ...f, from: series[0] ? `${series[0].key}-01` : undefined, to: last }), "Mínimos cuadrados sobre la venta neta mensual de los últimos 12 meses completos; banda = ±1.28 desviaciones estándar de los residuos.")
  r.followUps = ["Tendencia de ventas", "Compara con el mes pasado"]
  return r
}

// reexport para el índice
export { fmtMxn }
