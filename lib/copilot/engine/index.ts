import { computeStock, type StockRow } from "../analytics/inventory"
import type { DataView } from "../analytics/view"
import { formatDateEs } from "../dates"
import { fmtMxn } from "../format"
import { getClassifier, type Classification } from "../nlu/classifier"
import { extractEntities, type Entities } from "../nlu/entities"
import { normalizeText } from "../nlu/normalize"
import type { IntentId } from "../nlu/training"
import type { ChartSpec, CopilotResponse, CopilotResult, TableSpec } from "../result"
import { EMPTY_MEMORY, analyticalQuerySchema, memorySchema, type AnalyticalQuery, type SessionMemory } from "../schema"
import { REFUSALS, checkGuardrails, safeEcho } from "./guardrails"
import { hByFamily, hByWarehouse, hAging, hAvailability, hConversion, hCustomerBalance, hInactive, hLowStock, hNoMovement, hOpportunities, hOverdue, hOverduePct, hPipeline, hProductList, hPurchaseHistory, hQuotes, hReceivables, hRotation } from "./handlers-ops"
import { hBestPeriod, hConcentration, hForecast, hGrossMargin, hNoSales, hProductGrowth, hRankByDimension, hSalesByCategory, hSalesComparison, hSalesGrowth, hSalesTotal, hSalesTrend, hTicket } from "./handlers-sales"
import { emptyResult, noData, type HandlerCtx } from "./kit"
import { INTENT_EXAMPLE, adjustIntent, planQuery } from "./planner"

/** Umbrales de confianza; se calibran con `npm run copilot:eval` (ver docs/COPILOT_EVALUATION.md). */
export const CONFIDENCE = { low: 0.3, ambiguousMargin: 0.03, ambiguousCeil: 0.5 }

export interface RunOptions {
  question: string
  memory?: SessionMemory
  view: DataView
  /** Descripción del adaptador de datos activo (se muestra como fuente de cada cifra). */
  source: string
}

const stockCache = new WeakMap<DataView, StockRow[]>()
function stockOf(view: DataView): StockRow[] {
  let s = stockCache.get(view)
  if (!s) {
    s = computeStock(view)
    stockCache.set(view, s)
  }
  return s
}

function sanitizeMemory(raw: SessionMemory | undefined, view: DataView): SessionMemory {
  const parsed = memorySchema.safeParse(raw ?? EMPTY_MEMORY)
  if (!parsed.success) return { ...EMPTY_MEMORY }
  const m = parsed.data
  const knownFamilies = new Set(view.data.products.map((p) => p.family))
  // Nada que venga del cliente se acepta sin verificar contra el tenant: IDs desconocidos se descartan
  const customerOk = (id?: string) => !id || view.customerById.has(id)
  const f = m.lastQuery?.filters
  const queryOk = m.lastQuery && customerOk(f?.customerId) && (f?.customerIds ?? []).every(customerOk) && (f?.skus ?? []).every((s) => view.productBySku.has(s)) && (!f?.sku || view.productBySku.has(f.sku)) && (f?.families ?? []).every((x) => knownFamilies.has(x)) && (!f?.warehouseId || view.data.warehouses.some((w) => w.id === f.warehouseId))
  return { ...m, lastQuery: queryOk ? m.lastQuery : null, customerId: m.customerId && view.customerById.has(m.customerId) ? m.customerId : null, families: m.families.filter((x) => knownFamilies.has(x)) }
}

function reply(base: Partial<CopilotResult> & Pick<CopilotResult, "status" | "title" | "summary">, extra: Partial<CopilotResult> = {}): CopilotResult {
  return { intent: "system", kpis: [], assumptions: [], caveats: [], followUps: [], confidence: 1, demo: true, ...base, ...extra }
}

const SUGGESTED = ["¿Cuánto vendimos este mes?", "Muéstrame mis 10 mejores clientes", "¿Qué productos tienen mayor margen?", "¿Qué clientes tienen facturas vencidas?", "¿Qué productos tienen inventario crítico?", "Compara ventas de los últimos seis meses", "Genera una gráfica de ventas por categoría", "¿Qué oportunidades comerciales tenemos abiertas?"]

function capabilities(): CopilotResult {
  return reply({
    status: "ok",
    intent: "system.capabilities",
    title: "Qué puedo hacer",
    summary: "Soy Nexo Intelligence, un copiloto de consulta en español sobre los datos de Soleil Wire (DEMO). Calculo directamente desde registros: ventas, márgenes, clientes, productos, inventario, cobranza, CRM y pronóstico simple. Puedo comparar periodos, graficar, exportar a CSV y recordar el contexto de la conversación. Soy de solo lectura: no creo ni modifico registros.",
    followUps: SUGGESTED.slice(0, 6),
  })
}

function greeting(): CopilotResult {
  return reply({ status: "ok", intent: "system.greeting", title: "Hola", summary: "Hola, soy Nexo Intelligence. Pregúntame por ventas, clientes, inventario, cobranza o el pipeline de Soleil Wire (datos DEMO).", followUps: SUGGESTED.slice(0, 4) })
}

function help(): CopilotResult {
  return reply({
    status: "ok",
    intent: "system.help",
    title: "Ejemplos de preguntas",
    summary: "Puedes escribir como hablas, incluso con faltas de ortografía. Después de una respuesta puedes seguir la conversación («¿y en septiembre?», «compáralos», «ahora solo medio voltaje», «muéstramelo en una gráfica», «exporta a CSV»). Escribe «¿de dónde sale esa cifra?» para ver el cálculo y los registros.",
    followUps: SUGGESTED,
  })
}

function refusal(kind: keyof typeof REFUSALS, memory: SessionMemory): CopilotResponse {
  const r = REFUSALS[kind]
  return { result: reply({ status: "refused", intent: "system.refused", title: r.title, summary: r.message, followUps: SUGGESTED.slice(0, 3) }), memory: { ...memory, turns: memory.turns + 1 } }
}

/** Convierte una tabla en gráfica cuando el usuario la pide y el handler no la generó. */
function chartFromTable(t: TableSpec, title: string, kind: ChartSpec["kind"]): ChartSpec | undefined {
  const textCol = t.columns.find((c) => c.format === "text" || c.format === "date")
  const numCol = t.columns.find((c) => (c.format === "currency" || c.format === "number") && c.key !== "pos")
  if (!textCol || !numCol || t.rows.length < 2) return undefined
  return { kind, title, xKey: textCol.key, series: [{ key: numCol.key, label: numCol.label }], data: t.rows.slice(0, 15).map((r) => ({ [textCol.key]: String(r[textCol.key] ?? ""), [numCol.key]: (r[numCol.key] as number) ?? 0 })), format: numCol.format === "currency" ? "currency" : "number" }
}

function finalizeViz(r: CopilotResult, plan: AnalyticalQuery): CopilotResult {
  const v = plan.visualization
  if (v === "table" || v === "kpi" || v === "none") return { ...r, chart: undefined }
  const kind = (v === "bar" || v === "line" || v === "area" || v === "donut" ? v : r.chart?.kind ?? "bar") as ChartSpec["kind"]
  if (v === "auto") return r
  if (r.chart) {
    if (v === "chart") return r
    const multi = r.chart.series.length > 1 || r.chart.kind === "comparison"
    if (kind === "donut" && multi) return r
    return { ...r, chart: { ...r.chart, kind: r.chart.kind === "comparison" ? "comparison" : kind } }
  }
  if (r.table) {
    const c = chartFromTable(r.table, r.title, kind === "donut" || kind === "line" || kind === "area" ? kind : "bar")
    if (c) return { ...r, chart: c }
  }
  return r
}

function executeHandler(c: HandlerCtx): CopilotResult {
  const stock = () => stockOf(c.view)
  switch (c.plan.intent as IntentId) {
    case "sales.total": return hSalesTotal(c)
    case "sales.trend": return hSalesTrend(c)
    case "sales.comparison": return hSalesComparison(c)
    case "sales.growth": return hSalesGrowth(c)
    case "sales.by_customer":
    case "customers.top": return hRankByDimension(c, "customer", { title: c.plan.intent === "customers.top" ? "Mejores clientes" : "Ventas por cliente", label: "Cliente líder" })
    case "sales.by_product":
    case "products.top_selling": return hRankByDimension(c, "product", { title: c.plan.intent === "products.top_selling" ? "Productos más vendidos" : "Ventas por producto", label: "Producto líder" })
    case "products.least_selling": return hRankByDimension({ ...c, plan: { ...c.plan, sort: "asc" } }, "product", { title: "Productos menos vendidos", label: "Producto con menor venta" })
    case "products.profitability": {
      const low = c.plan.sort === "asc"
      return hRankByDimension(c, "product", { by: low ? "marginPct" : "marginMxn", minNet: low ? 50_000 : 0, title: low ? "Productos con menor margen" : "Productos con mayor margen", label: low ? "Menor margen %" : "Mayor margen" })
    }
    case "sales.by_category": return hSalesByCategory(c)
    case "sales.best_period": return hBestPeriod(c)
    case "sales.ticket": return hTicket(c)
    case "customers.concentration": return hConcentration(c)
    case "customers.inactive": return hInactive(c)
    case "customers.purchase_history": return hPurchaseHistory(c)
    case "customers.balance": return hCustomerBalance(c)
    case "products.search": return hProductList(c, stock(), "search")
    case "products.price": return hProductList(c, stock(), "price")
    case "products.no_sales": return hNoSales(c, new Map(stock().map((s) => [s.product.sku, s.totalQty])))
    case "products.growing": return hProductGrowth(c)
    case "inventory.availability": return hAvailability(c, stock())
    case "inventory.low_stock": return hLowStock(c, stock())
    case "inventory.rotation": return hRotation(c, stock())
    case "inventory.by_warehouse": return hByWarehouse(c, stock())
    case "inventory.by_family": return hByFamily(c, stock())
    case "inventory.no_movement": return hNoMovement(c, stock())
    case "finance.receivables": return hReceivables(c)
    case "finance.overdue": return hOverdue(c)
    case "finance.overdue_pct": return hOverduePct(c)
    case "finance.aging": return hAging(c)
    case "finance.gross_margin": return hGrossMargin(c)
    case "crm.pipeline": return hPipeline(c)
    case "crm.opportunities": return hOpportunities(c)
    case "crm.conversion": return hConversion(c)
    case "crm.quotes": return hQuotes(c)
    case "forecast.sales": return hForecast(c)
    default: return noData(c, "Sin resultado", "No pude resolver esa consulta.")
  }
}

const DATA_INTENTS = new Set<string>(Object.keys(INTENT_EXAMPLE).filter((k) => !k.startsWith("system.") && !k.startsWith("analytics.")))
const FOLLOWUP_START = /^(y|ahora|solo|pero|tambien|entonces|ademas|que tal|y si|mejor)\b/

function isFragment(text: string, cls: Classification, ent: Entities, hasMemory: boolean): boolean {
  if (!hasMemory) return false
  const entityHit = ent.periods.length > 0 || ent.families.length > 0 || ent.customerMatches.length > 0 || !!ent.chart || ent.referencesPrevious || !!ent.industry
  if (FOLLOWUP_START.test(text) && entityHit) return true
  if (cls.confidence < 0.42 && entityHit) return true
  return false
}

export function runCopilot(opts: RunOptions): CopilotResponse {
  const { view, source } = opts
  const memory = sanitizeMemory(opts.memory, view)
  const question = opts.question.trim().slice(0, 400)
  const text = normalizeText(question)

  // 1) seguridad: el texto es dato, nunca instrucción
  const guard = checkGuardrails(question)
  if (guard) return refusal(guard, memory)

  // 2) comandos de conversación
  if (/\b(limpia|borra|reinicia|resetea|olvida)\b.*\b(conversacion|chat|historial|filtros?|contexto)\b|\b(nueva consulta|empezar de nuevo|cambiar de tema|quita(r)? (los )?filtros|sin filtros)\b/.test(text)) {
    return { result: reply({ status: "ok", intent: "system.reset", title: "Contexto restablecido", summary: "Listo: borré filtros, periodos y cliente recordados. Empezamos desde cero.", followUps: SUGGESTED.slice(0, 4) }), memory: { ...EMPTY_MEMORY, turns: memory.turns + 1 } }
  }
  if (/\bde donde (sale|salio|viene|vino|sacaste|obtuviste)\b|\bcomo (se )?(calculo|calculaste|obtuviste|sacaste)\b|\b(fuente|origen) de (la|esa|esta) cifra\b|\bexplica(me)? (la|esa|esta) cifra\b/.test(text)) {
    const ev = memory.lastEvidence
    const r = ev
      ? reply({ status: "ok", intent: "system.explain", title: "De dónde sale la cifra", summary: `${ev.calc}\n\nFuente: ${ev.source}.`, assumptions: ev.assumptions, followUps: ["Muéstramelo en una gráfica", "Exporta esto a CSV"] })
      : reply({ status: "no_data", title: "Sin cifra previa", summary: "Aún no he calculado ninguna cifra en esta conversación. Haz una pregunta (por ejemplo «¿cuánto vendimos este mes?») y te explico de dónde sale.", followUps: SUGGESTED.slice(0, 3) })
    return { result: r, memory: { ...memory, turns: memory.turns + 1 } }
  }

  // 3) NLU: intención + entidades
  const entities = extractEntities(question, { ref: view.asOf, customers: view.data.customers, products: view.data.products })
  const cls = getClassifier().classify(entities.maskedText)
  const hasMemory = !!memory.lastQuery
  let intent = cls.intent as IntentId
  const fragment = isFragment(text, cls, entities, hasMemory)
  const interpretationBits: string[] = []

  // 4) intenciones de sistema
  if (!fragment) {
    if (intent === "system.greeting" && cls.confidence >= 0.4) return { result: greeting(), memory: { ...memory, turns: memory.turns + 1 } }
    if (intent === "system.capabilities" && cls.confidence >= CONFIDENCE.low) return { result: capabilities(), memory: { ...memory, turns: memory.turns + 1 } }
    if (intent === "system.help" && cls.confidence >= CONFIDENCE.low) return { result: help(), memory: { ...memory, turns: memory.turns + 1 } }
    if (intent === "system.navigation" && cls.confidence >= CONFIDENCE.low) {
      return { result: reply({ status: "delegate", intent: "system.navigation", title: "Navegación", summary: "" }), memory }
    }
  }

  // 5) fragmentos y referencias a la conversación
  let base: AnalyticalQuery | undefined
  if ((intent === "analytics.visualization" || intent === "analytics.export") && hasMemory) {
    const parsed = analyticalQuerySchema.safeParse(memory.lastQuery)
    if (parsed.success) {
      base = parsed.data
      const plan: AnalyticalQuery = intent === "analytics.visualization" ? { ...base, visualization: entities.chart && entities.chart !== "auto" ? entities.chart : "chart" } : base
      const res = finalizeViz(executeHandler({ view, plan, source, confidence: cls.confidence }), plan)
      res.assumptions = [...res.assumptions, ...(intent === "analytics.visualization" ? ["Reutilicé la consulta anterior con los mismos filtros y periodo."] : [])]
      if (intent === "analytics.export") {
        res.exportRequested = true
        res.summary = `Preparé la exportación a CSV de «${res.title}». Si no se descargó automáticamente, usa el botón «Exportar CSV». ${res.summary}`
      }
      return { result: res, memory: updateMemory(memory, plan, res) }
    }
  }
  if (intent === "analytics.visualization" && !hasMemory) {
    const wantsSales = /venta|vendi|ingreso|factur/.test(text)
    if (!wantsSales) {
      return { result: reply({ status: "clarify", intent: "analytics.visualization", title: "¿Qué quieres graficar?", summary: "Dime qué indicador graficar. Por ejemplo:", options: ["Grafica las ventas mensuales", "Muéstrame las ventas por categoría", "Gráfica de los 10 mejores clientes"].map((q) => ({ label: q, query: q })) }), memory: { ...memory, turns: memory.turns + 1 } }
    }
    intent = entities.families.length || /categoria|familia/.test(text) ? "sales.by_category" : /cliente/.test(text) ? "customers.top" : /producto|cable/.test(text) ? "products.top_selling" : "sales.trend"
  }
  if (intent === "analytics.export" && !hasMemory) {
    return { result: reply({ status: "clarify", intent: "analytics.export", title: "Nada que exportar todavía", summary: "Primero haz una consulta con tabla o gráfica y luego pídeme exportarla a CSV.", options: SUGGESTED.slice(0, 3).map((q) => ({ label: q, query: q })) }), memory: { ...memory, turns: memory.turns + 1 } }
  }

  if (fragment && memory.lastQuery) {
    const parsed = analyticalQuerySchema.safeParse(memory.lastQuery)
    if (parsed.success) {
      base = parsed.data
      // La intención nueva solo manda si es una consulta de datos clara; si no, se hereda la anterior
      // Con aperturas tipo «ahora solo…» / «y…» se hereda la consulta previa salvo que la nueva sea inequívoca
      const strong = FOLLOWUP_START.test(text) ? 0.72 : 0.5
      intent = DATA_INTENTS.has(cls.intent) && cls.confidence >= strong ? (cls.intent as IntentId) : (base.intent as IntentId)
      if (entities.comparisonRequested && entities.periods.length >= 1 && intent !== "sales.growth") intent = "sales.comparison"
      interpretationBits.push("seguimiento de la conversación")
    }
  }
  // «compáralos» / «compara» sin periodos: usa la memoria
  if (!fragment && hasMemory && intent === "sales.comparison" && entities.periods.length === 0 && memory.lastQuery) {
    const parsed = analyticalQuerySchema.safeParse(memory.lastQuery)
    if (parsed.success) base = parsed.data
  }

  // 6) ambigüedad de intención (solo si no es seguimiento)
  if (!fragment && !base && !DATA_INTENTS.has(intent)) {
    return unclear(cls, memory)
  }
  if (!fragment && !base) {
    const [a, b] = cls.ranked
    if (cls.confidence < CONFIDENCE.low) return unclear(cls, memory)
    if (cls.confidence < CONFIDENCE.ambiguousCeil && a.score - b.score < CONFIDENCE.ambiguousMargin && DATA_INTENTS.has(a.intent) && DATA_INTENTS.has(b.intent)) {
      return {
        result: reply({ status: "clarify", intent: "clarify", title: "¿A cuál te refieres?", summary: "Tu pregunta puede interpretarse de dos formas. Elige una:", options: [a.intent, b.intent].map((i) => ({ label: INTENT_EXAMPLE[i], query: INTENT_EXAMPLE[i] })), confidence: cls.confidence }),
        memory: { ...memory, turns: memory.turns + 1 },
      }
    }
  }

  intent = adjustIntent(intent, entities, text)
  const outcome = planQuery(intent, entities, memory, view, text, base)
  if (outcome.clarify) {
    return { result: reply({ status: "clarify", intent, title: "Aclaración necesaria", summary: outcome.clarify.message, options: outcome.clarify.options, confidence: cls.confidence }), memory: { ...memory, turns: memory.turns + 1 } }
  }
  if (outcome.unknownCustomer) {
    return { result: reply({ status: "no_data", intent, title: "Cliente no encontrado", summary: `No encontré ningún cliente que se parezca a «${safeEcho(outcome.unknownCustomer)}» en la empresa activa. Revisa el nombre o pide «mis 10 mejores clientes» para ver los nombres exactos.`, followUps: ["Muéstrame mis 10 mejores clientes"], confidence: cls.confidence }), memory: { ...memory, turns: memory.turns + 1 } }
  }

  const parsedPlan = analyticalQuerySchema.safeParse(outcome.plan)
  if (!parsedPlan.success) {
    return { result: reply({ status: "error", title: "Consulta inválida", summary: "No pude construir una consulta válida a partir de tu pregunta. Reformúlala indicando métrica y periodo." }), memory: { ...memory, turns: memory.turns + 1 } }
  }
  const plan = parsedPlan.data
  const raw = executeHandler({ view, plan, source, confidence: cls.confidence })
  const res = finalizeViz(raw, plan)
  res.assumptions = [...outcome.assumptions, ...res.assumptions]
  res.interpretation = interpret(plan, view, interpretationBits)
  return { result: res, memory: updateMemory(memory, plan, res) }
}

function unclear(cls: Classification, memory: SessionMemory): CopilotResponse {
  const options = cls.ranked.filter((r) => DATA_INTENTS.has(r.intent)).slice(0, 3).map((r) => ({ label: INTENT_EXAMPLE[r.intent], query: INTENT_EXAMPLE[r.intent] }))
  return {
    result: reply({ status: "clarify", intent: "unclear", title: "No estoy seguro de haber entendido", summary: "No tengo suficiente certeza sobre lo que pides y prefiero no inventar una cifra. ¿Quizá quisiste preguntar alguna de estas?", options, confidence: cls.confidence, followUps: SUGGESTED.slice(0, 3) }),
    memory: { ...memory, turns: memory.turns + 1 },
  }
}

function interpret(plan: AnalyticalQuery, view: DataView, bits: string[]): string {
  const parts: string[] = [`Intención: ${plan.intent}`]
  if (plan.period) parts.push(`Periodo: ${plan.period.label} (${formatDateEs(plan.period.from)} – ${formatDateEs(plan.period.to)})`)
  if (plan.comparison) parts.push(`Contra: ${plan.comparison.label}`)
  const f = plan.filters
  if (f.customerId) parts.push(`Cliente: ${view.customerById.get(f.customerId)?.name}`)
  if (f.families?.length) parts.push(`Familia: ${f.families.join(", ")}`)
  if (f.industry) parts.push(`Industria: ${f.industry}`)
  parts.push(`Moneda: MXN`)
  return [...parts, ...bits].join(" · ")
}

function updateMemory(memory: SessionMemory, plan: AnalyticalQuery, res: CopilotResult): SessionMemory {
  if (res.status !== "ok") return { ...memory, turns: memory.turns + 1 }
  const periods = [...memory.periods]
  for (const p of [plan.comparison, plan.period]) if (p && !periods.some((x) => x.from === p.from && x.to === p.to)) periods.push(p)
  return {
    lastQuery: plan,
    periods: periods.slice(-4),
    customerId: plan.filters.customerId ?? memory.customerId,
    families: plan.filters.families ?? [],
    turns: memory.turns + 1,
    lastEvidence: res.evidence ? { calc: res.evidence.calc.slice(0, 1400), source: res.evidence.source.slice(0, 280), assumptions: [...res.assumptions, ...res.caveats].slice(0, 6).map((s) => s.slice(0, 280)) } : memory.lastEvidence,
  }
}

export { fmtMxn, emptyResult }
