import { addDays } from "../dates"
import type { DataView } from "../analytics/view"
import { likeForLikePrevious, lastCompleteMonths, lastMonthsToDate, monthToDate, previousPeriod, yearToDate, type Entities, type PeriodSpec } from "../nlu/entities"
import type { IntentId } from "../nlu/training"
import type { AnalyticalQuery, SessionMemory } from "../schema"

export const INTENT_EXAMPLE: Record<IntentId, string> = {
  "sales.total": "¿Cuánto vendimos este mes?",
  "sales.trend": "Grafica las ventas mensuales",
  "sales.comparison": "Compara octubre con septiembre",
  "sales.by_customer": "Ventas por cliente este año",
  "sales.by_product": "Ventas por producto este año",
  "sales.by_category": "Muéstrame las ventas por categoría",
  "sales.best_period": "¿Qué mes fue el mejor?",
  "sales.ticket": "¿Cuál fue el ticket promedio?",
  "sales.growth": "¿Cuánto crecieron las ventas?",
  "customers.top": "Muéstrame mis 10 mejores clientes",
  "customers.inactive": "¿Qué clientes dejaron de comprar?",
  "customers.balance": "¿Qué clientes tienen saldo vencido?",
  "customers.purchase_history": "Historial de compras de un cliente",
  "customers.concentration": "¿Qué tres clientes concentran más ingresos?",
  "products.search": "¿Qué cables de aluminio tenemos?",
  "products.price": "Precio del cable THHN",
  "products.top_selling": "¿Cuáles son los cables más vendidos?",
  "products.least_selling": "¿Cuál es el producto menos vendido?",
  "products.no_sales": "¿Qué productos no se han vendido?",
  "products.profitability": "¿Qué producto deja mayor margen?",
  "products.growing": "¿Qué productos aumentaron sus ventas?",
  "inventory.availability": "¿Cuánto stock hay de cable de aluminio?",
  "inventory.low_stock": "¿Qué productos tienen inventario crítico?",
  "inventory.rotation": "¿Qué SKU tiene mayor rotación?",
  "inventory.by_warehouse": "¿Cuánto stock hay por almacén?",
  "inventory.by_family": "¿Qué familia concentra más inventario?",
  "inventory.no_movement": "¿Qué productos no tienen movimiento?",
  "finance.receivables": "¿Cuánto nos deben los clientes?",
  "finance.overdue": "¿Qué facturas están vencidas?",
  "finance.overdue_pct": "¿Qué porcentaje de facturas está vencido?",
  "finance.aging": "¿Cuánto tenemos por cobrar a más de 60 días?",
  "finance.gross_margin": "¿Cuál es nuestro margen bruto?",
  "crm.pipeline": "¿Cuál es el valor del pipeline?",
  "crm.opportunities": "¿Cuántas oportunidades tenemos abiertas?",
  "crm.conversion": "Tasa de conversión comercial",
  "crm.quotes": "¿Cuántas cotizaciones fueron ganadas?",
  "forecast.sales": "Pronóstico de ventas",
  "analytics.visualization": "Muéstrame una gráfica de ventas",
  "analytics.export": "Exporta esto a CSV",
  "system.help": "¿Qué puedo preguntarte?",
  "system.navigation": "Llévame a facturación",
  "system.capabilities": "¿Qué puedes hacer?",
  "system.greeting": "Hola",
}

/** Intenciones que aceptan filtros de cliente / familia / periodo. */
const TAKES_PERIOD = new Set<IntentId>(["sales.total", "sales.trend", "sales.comparison", "sales.by_customer", "sales.by_product", "sales.by_category", "sales.best_period", "sales.ticket", "sales.growth", "customers.top", "customers.concentration", "products.top_selling", "products.least_selling", "products.no_sales", "products.profitability", "products.growing", "finance.gross_margin"])
const TAKES_CUSTOMER = new Set<IntentId>(["sales.total", "sales.trend", "sales.comparison", "sales.by_product", "sales.by_category", "sales.best_period", "sales.ticket", "sales.growth", "customers.purchase_history", "customers.balance", "products.top_selling", "products.least_selling", "products.profitability", "finance.receivables", "finance.overdue", "finance.overdue_pct", "finance.aging", "finance.gross_margin"])
const TAKES_FAMILY = new Set<IntentId>(["sales.total", "sales.trend", "sales.comparison", "sales.by_customer", "sales.by_product", "sales.best_period", "sales.ticket", "sales.growth", "customers.top", "customers.concentration", "products.search", "products.top_selling", "products.least_selling", "products.no_sales", "products.profitability", "products.growing", "inventory.availability", "inventory.low_stock", "inventory.rotation", "inventory.no_movement", "finance.gross_margin", "crm.pipeline", "crm.opportunities", "forecast.sales"])
const TAKES_INDUSTRY = new Set<IntentId>(["sales.total", "sales.trend", "sales.comparison", "sales.by_customer", "customers.top", "customers.concentration", "sales.by_category", "finance.gross_margin"])

export interface PlanOutcome {
  plan: AnalyticalQuery
  assumptions: string[]
  clarify?: { message: string; options: { label: string; query: string }[] }
  unknownCustomer?: string
}

const sameSpan = (a: PeriodSpec, b: PeriodSpec) => a.from === b.from && a.to === b.to

function rememberPeriods(memory: SessionMemory): PeriodSpec[] {
  const out: PeriodSpec[] = []
  for (const p of memory.periods) if (!out.some((x) => sameSpan(x, p))) out.push(p)
  return out
}

export function adjustIntent(intent: IntentId, ent: Entities, text: string): IntentId {
  // «Compara…» manda sobre cualquier otra consulta de ventas
  if (/\bcompar/.test(text) && intent.startsWith("sales.") && intent !== "sales.comparison" && intent !== "sales.growth") return "sales.comparison"
  // «cuánto vendimos en cables de minería» es un total con filtro, no un reparto por familia
  if (intent === "sales.by_category" && ent.families.length && !/categor|famil|linea/.test(text)) return "sales.total"
  if (intent === "sales.by_product" && ent.families.length && !/\b(cada|por (producto|sku|cable|articulo)|desglos|agrup)/.test(text)) return "sales.total"
  // Con un cliente concreto, «ventas por cliente» se vuelve el total de ese cliente
  if ((intent === "sales.by_customer" || intent === "customers.top") && ent.customerMatches.length === 1 && !ent.customerAmbiguous && !/mejor|top|ranking|principal/.test(text)) return "sales.total"
  if (intent === "products.top_selling" && ent.sortDir === "asc" && /\b(menos|peor|menor)\b/.test(text)) return "products.least_selling"
  return intent
}

export function planQuery(intent: IntentId, ent: Entities, memory: SessionMemory, view: DataView, text: string, base?: AnalyticalQuery): PlanOutcome {
  const ref = view.asOf
  const assumptions: string[] = []
  const filters: AnalyticalQuery["filters"] = { ...(base?.filters ?? {}) }
  let period: PeriodSpec | undefined = base?.period
  let comparison: PeriodSpec | undefined = base?.comparison

  // ---- filtros por entidades ----
  const refersBack = ent.referencesPrevious
  if (TAKES_CUSTOMER.has(intent) || intent === "sales.by_customer") {
    if (ent.customerMatches.length === 1 && !ent.customerAmbiguous) filters.customerId = ent.customerMatches[0].customer.id
    else if (refersBack && memory.customerId && !filters.customerId) filters.customerId = memory.customerId
  }
  if (ent.customerAmbiguous && (TAKES_CUSTOMER.has(intent) || intent === "sales.by_customer")) {
    const prefix = intent === "customers.purchase_history" ? "historial de compras de" : intent.startsWith("finance.") || intent === "customers.balance" ? "saldo y facturas vencidas de" : "ventas del cliente"
    return {
      plan: emptyPlan(intent),
      assumptions,
      clarify: {
        message: `Encontré ${ent.customerMatches.length} clientes con un nombre similar. ¿Cuál deseas consultar?`,
        options: ent.customerMatches.slice(0, 5).map((m) => ({ label: m.customer.name, query: `${prefix} ${m.customer.name}` })),
      },
    }
  }
  if (!filters.customerId && ent.unknownCustomerName && (TAKES_CUSTOMER.has(intent) || intent === "sales.by_customer" || intent === "customers.top")) {
    return { plan: emptyPlan(intent), assumptions, unknownCustomer: ent.unknownCustomerName }
  }
  if (TAKES_FAMILY.has(intent) && ent.families.length) {
    const additive = /^(y|tambien|ademas)\b/.test(text) && !!base?.filters.families
    filters.families = additive ? [...new Set([...(base?.filters.families ?? []), ...ent.families])] : ent.families
  } else if (TAKES_FAMILY.has(intent) && refersBack && memory.families.length && !filters.families) filters.families = memory.families
  if (TAKES_INDUSTRY.has(intent) && ent.industry) filters.industry = ent.industry
  if (ent.currency) filters.currency = ent.currency
  if (ent.warehouseId) filters.warehouseId = ent.warehouseId
  if (ent.products.length) {
    if (ent.products.length === 1) filters.sku = ent.products[0].sku
    else filters.skus = ent.products.slice(0, 60).map((p) => p.sku)
  }

  // ---- periodos ----
  const mem = rememberPeriods(memory)
  const periods = [...ent.periods]
  if (intent === "sales.comparison" || intent === "sales.growth") {
    if (periods.length >= 2) {
      const [a, b] = [periods[0], periods[1]].sort((x, y) => (x.from < y.from ? -1 : 1))
      comparison = a
      period = b
    } else if (periods.length === 1) {
      period = periods[0]
      const llp = likeForLikePrevious(period, ref)
      comparison = llp ?? previousPeriod(period, ref)
    } else if (mem.length >= 2) {
      const [a, b] = mem.slice(-2).sort((x, y) => (x.from < y.from ? -1 : 1))
      comparison = a
      period = b
      assumptions.push(`Comparé los dos últimos periodos de la conversación: ${a.label} y ${b.label}.`)
    } else {
      period = mem[0] ?? monthToDate(ref)
      comparison = likeForLikePrevious(period, ref) ?? previousPeriod(period, ref)
      assumptions.push(`No indicaste periodos: comparé ${period.label} contra ${comparison.label}.`)
    }
  } else if (TAKES_PERIOD.has(intent)) {
    if (periods.length >= 1) {
      period = periods.length >= 2 && ent.comparisonRequested ? periods[1] : periods[0]
      comparison = undefined
    } else if (!period || base?.intent !== intent) {
      period = base?.period && refersBack ? base.period : defaultPeriod(intent, ref, view)
      if (intent !== "products.growing") assumptions.push(`No indicaste periodo: usé ${period!.label}.`)
    }
    if (intent === "products.growing") {
      const cur = periods[0] ?? lastCompleteMonths(3, ref)
      period = cur
      comparison = previousPeriod(cur, ref)
      if (!periods.length) assumptions.push(`Comparé ${cur.label} contra los 3 meses previos.`)
    }
  }
  if (intent === "analytics.visualization" && !period) period = undefined

  // ---- orden, límite, visualización ----
  let sort: "asc" | "desc" = ent.sortDir ?? "desc"
  if (intent === "products.least_selling") sort = "asc"
  if (intent === "products.growing") sort = /\b(cayeron|bajando|bajaron|disminuyeron|decrecieron|menos)\b/.test(text) ? "asc" : "desc"
  if (intent === "sales.best_period") sort = /\b(peor|menos|menor|bajo)\b/.test(text) ? "asc" : "desc"
  if (intent === "inventory.rotation") sort = /\b(menos|menor|baja|lenta)\b/.test(text) ? "asc" : "desc"
  if (!["products.least_selling", "products.growing", "sales.best_period", "inventory.rotation"].includes(intent) && sort === "asc") sort = (intent === "products.profitability" ? /\b(menos|peor|menor|bajo|bajos|baja)\b/ : /\b(menos|peor|menor)\b/).test(text) ? "asc" : "desc"
  if (intent === "products.profitability" && /\b(bajo|bajos|baja|minimo|menos|menor|peor)\b/.test(text)) sort = "asc"
  const limit = ent.topN ?? (intent === "customers.concentration" ? 3 : intent === "crm.opportunities" ? 10 : 10)
  const visualization = ent.chart ? (ent.chart === "auto" ? "chart" : ent.chart) : "auto"

  const plan: AnalyticalQuery = {
    intent,
    filters,
    sort,
    limit,
    visualization,
    ...(period ? { period } : {}),
    ...(comparison ? { comparison } : {}),
    ...(ent.minDaysOverdue !== undefined ? { minDaysOverdue: ent.minDaysOverdue } : base?.minDaysOverdue !== undefined && base.intent === intent ? { minDaysOverdue: base.minDaysOverdue } : {}),
    ...(ent.inactiveDays !== undefined ? { inactiveDays: ent.inactiveDays } : {}),
    ...(ent.horizonMonths !== undefined ? { horizonMonths: ent.horizonMonths } : {}),
    ...(/\bpor semana\b|semanal/.test(text) ? { dimension: "week" as const } : /\bpor trimestre\b|trimestral/.test(text) ? { dimension: "quarter" as const } : /\bpor dia\b|diari/.test(text) ? { dimension: "day" as const } : {}),
  }
  return { plan, assumptions }
}

function emptyPlan(intent: IntentId): AnalyticalQuery {
  return { intent, filters: {}, sort: "desc", limit: 10, visualization: "auto" }
}

export function defaultPeriod(intent: IntentId, ref: string, view: DataView): PeriodSpec {
  switch (intent) {
    case "sales.total":
    case "sales.growth":
    case "sales.comparison":
      return monthToDate(ref)
    case "sales.trend":
      return lastMonthsToDate(12, ref)
    case "sales.best_period":
    case "products.no_sales":
      return { from: view.data.meta.rangeStart, to: ref, label: "todo el histórico disponible", kind: "rolling", partial: true }
    default:
      return yearToDate(ref)
  }
}

export { addDays }
