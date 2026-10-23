import { normalizeText } from "./normalize"
import type { IntentId } from "./training"

/**
 * Refinador léxico de intenciones vecinas. TF-IDF distingue bien temas (ventas vs inventario) pero
 * confunde intenciones casi sinónimas (cartera vencida / porcentaje vencido / saldo por cliente).
 * Estas reglas se apoyan en pistas inequívocas del español de negocios y solo actúan dentro del
 * mismo grupo de intenciones (o cuando la confianza es baja); no sustituyen al clasificador.
 */
const isFinance = (i: IntentId) => i.startsWith("finance.") || i === "customers.balance"
const isCrm = (i: IntentId) => i.startsWith("crm.")
const isSalesish = (i: IntentId) => i.startsWith("sales.") || i.startsWith("forecast") || i.startsWith("products.")
const isInventoryish = (i: IntentId) => i.startsWith("inventory.") || i === "products.no_sales" || i === "products.search"

interface Rule {
  name: string
  test: (t: string) => boolean
  to: IntentId | ((t: string) => IntentId)
  when: (current: IntentId, weak: boolean) => boolean
}

const has = (re: RegExp) => (t: string) => re.test(t)

const RULES: Rule[] = [
  { name: "forecast", test: has(/\b(vamos a vender|venderemos|esperamos vender|proximo (mes|trimestre|ano)|siguiente (mes|trimestre)|cerraremos|pronostic|proyecc|forecast|prediccion)/), to: "forecast.sales", when: (i, weak) => (isSalesish(i) && !i.startsWith("products.search")) || weak },
  { name: "trend", test: has(/\b(ventas?|vendimos|vendemos|vendido)\b.*\b(por|cada|a)\s+(semana|mes|trimestre|dia)\b|\bventas\s+(semanal|mensual|trimestral|diaria)|\b(semana|mes)\s+a\s+(semana|mes)\b/), to: "sales.trend", when: (i, weak) => isSalesish(i) || weak },
  { name: "overdue_pct", test: has(/\b(porcentaje|proporcion|tasa|indice)\b.*\b(vencid|moros|atras)|\bmorosidad\b/), to: "finance.overdue_pct", when: (i, weak) => isFinance(i) || weak },
  { name: "aging", test: has(/\b(antiguedad|aging|rangos?)\b|\b(mas de|mayor(es)? a)\s*\d+\s*dias\b/), to: "finance.aging", when: (i) => isFinance(i) },
  {
    name: "finance-split",
    test: has(/\b(vencid|atrasad|moros|pasad[ao]s? de fecha|ya vencieron|deben?|debo|adeud|cobrar|cartera|deuda|saldos?)\b/),
    to: (t) => (/vencid|atrasad|moros|pasad[ao]s? de fecha|ya vencieron/.test(t) ? (/\bclientes?\b/.test(t) ? "customers.balance" : "finance.overdue") : "finance.receivables"),
    when: (i) => isFinance(i),
  },
  { name: "best-period", test: has(/\b(mejor|peor|mayor|menor|mas|menos)\b.*\b(mes|trimestre|semana|dia)\b.*\b(ventas?|vendimos|vendio)\b|\b(mes|trimestre|semana|dia)\s+con\s+(mas|menos|mayores|menores|las mayores|las menores)\b|\b(trimestre|mes|semana)\b.*\bcon (mas|menos) ventas\b/), to: "sales.best_period", when: (i, weak) => isSalesish(i) || weak },
  { name: "order-count", test: has(/\b(cuantos pedidos|cuantas ordenes|numero de pedidos|numero de ordenes|total de pedidos|cantidad de pedidos)\b/), to: "sales.ticket", when: (i, weak) => isSalesish(i) || weak },
  { name: "buyers", test: (t) => /\b(empresas?|clientes?|compradores)\b/.test(t) && /\b(compra|compran|compraron|compro|compraran)\b/.test(t) && !/\b(historial|ultima|ultimo|cuando)\b/.test(t), to: "customers.top", when: (i) => i === "products.search" || i === "products.top_selling" || i === "sales.by_customer" || i === "sales.total" || i === "sales.by_product" },
  { name: "low-stock", test: has(/\b(falta de|faltantes?|agotad|agotarse|se agot|resurtir|reabastec|bajo el minimo|debajo del minimo|stock minimo|poco stock|escasez|sin existencias)/), to: "inventory.low_stock", when: (i, weak) => isInventoryish(i) || weak },
  { name: "no-movement", test: has(/\b(sin movimientos?|estancad|obsolet|parad[oa]s?|no se mueve|no se mueven|sin moverse|no se han movido|no se ha movido|sin salidas?|stock muerto|no tienen movimiento|mercancia muerta)/), to: "inventory.no_movement", when: (i, weak) => isInventoryish(i) || isSalesish(i) || weak },
  { name: "no-sales", test: has(/\b(sin (una sola |ninguna |alguna )?ventas?|cero ventas|nunca se (han )?vendido|no se han vendido|no han tenido ventas?|no tuvieron ventas?)\b/), to: "products.no_sales", when: (i, weak) => isInventoryish(i) || isSalesish(i) || weak },
  { name: "pipeline", test: has(/\b(embudo|pipeline|funnel)\b/), to: "crm.pipeline", when: (i, weak) => isCrm(i) || weak },
  { name: "conversion", test: has(/\b(motivos? de perdida|por que perdemos|perdimos|win rate|conversion|efectividad de cierre)\b/), to: "crm.conversion", when: (i, weak) => isCrm(i) || weak },
  {
    name: "search-vs-availability",
    test: has(/\b(stock|existenc|inventario|disponib|cuantos metros|cuanto hay|queda|tenemos|manejamos|catalogo|busca|buscame|lista de|que cables|cuales cables|hay cables)/),
    to: (t) => (/\b(stock|existenc|inventario|disponib|cuantos metros|cuanto hay|queda)/.test(t) ? "inventory.availability" : "products.search"),
    when: (i) => i === "inventory.availability" || i === "products.search",
  },
  { name: "search-verb", test: has(/^(busca|buscame|encuentra|ensename|muestrame los cables)\b/), to: "products.search", when: (_i, weak) => weak },
]

/** Devuelve la intención refinada (o la misma) y la regla que actuó. */
export function refineIntent(raw: string, intent: IntentId, confidence: number): { intent: IntentId; rule: string | null } {
  const t = normalizeText(raw)
  const weak = confidence < 0.5
  for (const r of RULES) {
    if (!r.when(intent, weak) || !r.test(t)) continue
    const to = typeof r.to === "function" ? r.to(t) : r.to
    // Si la regla coincide con la intención actual, la confirma (eleva la confianza)
    return { intent: to, rule: r.name }
  }
  return { intent, rule: null }
}
