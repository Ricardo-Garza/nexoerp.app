import { normalizeQuery } from "./normalize"
import { refineIntent } from "./refine"
import { INTENT_IDS, TRAINING, type IntentId } from "./training"

/**
 * Clasificador de intenciones LOCAL (sin LLM, sin red):
 *  1. TF-IDF sobre tokens canónicos + bigramas + trigramas de caracteres (tolera typos),
 *     puntuado como mezcla de similitud coseno con el mejor ejemplo y con el centroide.
 *  2. Baseline de reglas (palabras clave ponderadas).
 *  3. Híbrido: combinación lineal, con peso elegido por validación cruzada leave-one-out
 *     sobre el set de ENTRENAMIENTO (nunca sobre el banco de evaluación).
 */

type Vec = Map<string, number>

const CHAR_WEIGHT = 0.35

const MONTH_TOKEN = /^(ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)$/

/** Los nombres de mes se abstraen a un solo rasgo para que «septiembre» no incline la intención. */
function featureWords(raw: string): string[] {
  const q = normalizeQuery(raw)
  return q.canonical.map((t, i) => (MONTH_TOKEN.test(q.tokens[i]) ? "mesnombre" : t)).filter((t) => !/^\d+$/.test(t))
}

function features(raw: string): string[] {
  const words = featureWords(raw)
  const feats: string[] = []
  for (const w of words) feats.push(`w:${w}`)
  for (let i = 0; i < words.length - 1; i++) feats.push(`b:${words[i]}_${words[i + 1]}`)
  const joined = ` ${words.join(" ")} `
  for (let i = 0; i < joined.length - 2; i++) feats.push(`c:${joined.slice(i, i + 3)}`)
  return feats
}

interface Example {
  intent: IntentId
  text: string
  tf: Map<string, number>
  vec: Vec
}

function termFreq(feats: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const f of feats) tf.set(f, (tf.get(f) ?? 0) + (f.startsWith("c:") ? CHAR_WEIGHT : 1))
  return tf
}

function normalizeVec(v: Vec): Vec {
  let n = 0
  for (const x of v.values()) n += x * x
  n = Math.sqrt(n) || 1
  const out: Vec = new Map()
  for (const [k, x] of v) out.set(k, x / n)
  return out
}

function dot(a: Vec, b: Vec): number {
  const [s, l] = a.size < b.size ? [a, b] : [b, a]
  let r = 0
  for (const [k, x] of s) {
    const y = l.get(k)
    if (y !== undefined) r += x * y
  }
  return r
}

// ---------- baseline de reglas ----------
const RULES: Record<IntentId, Record<string, number>> = {
  "sales.total": { venta: 3, total: 1.5, neta: 1, hoy: 0.6, ayer: 0.6, mes: 0.5, ano: 0.5, negocio: 1.5, vamos: 0.8 },
  "sales.trend": { tendencia: 3, venta: 1.2, mes: 0.8, semana: 1, dia: 0.5, grafica: 0.5 },
  "sales.comparison": { comparar: 3, venta: 1, contra: 1.5, anterior: 1, diferencia: 1.5 },
  "sales.by_customer": { venta: 1.8, cliente: 2.2, desglosad: 1, agrupad: 1, cada: 0.8 },
  "sales.by_product": { venta: 1.8, producto: 2.2, sku: 1, cada: 0.8 },
  "sales.by_category": { venta: 1.5, familia: 3, categoria: 2, participacion: 1 },
  "sales.best_period": { mejor: 2.5, mes: 1.5, trimestre: 1.5, menos: 1, peor: 2, venta: 0.8 },
  "sales.ticket": { promedio: 3, pedido: 2, orden: 1.5, compra: 0.6 },
  "sales.growth": { crecer: 3, caer: 2, venta: 1, porcentaje: 1.5, variacion: 2, crecimiento: 3 },
  "customers.top": { cliente: 2.2, mejor: 2.5, ranking: 2, venta: 0.4, compra: 1.2 },
  "customers.inactive": { cliente: 1.5, inactivo: 3, compra: 0.8, perdid: 2, dormid: 2 },
  "customers.balance": { cliente: 1.2, cobrar: 2.5, vencido: 2.5, moroso: 2 },
  "customers.purchase_history": { cliente: 1, compra: 1.5, ultima: 2, historial: 3, ultim: 2, pedido: 1 },
  "customers.concentration": { participacion: 3, cliente: 1, concentr: 3, depend: 2, ingreso: 1 },
  "products.search": { producto: 2, tenemos: 1, catalogo: 2, busca: 2, lista: 1, disponible: 1 },
  "products.price": { precio: 3, producto: 1, metro: 1, cuesta: 2 },
  "products.top_selling": { producto: 2, mejor: 2.5, venta: 1.2, ranking: 2 },
  "products.least_selling": { producto: 2, menos: 3, venta: 1.2 },
  "products.no_sales": { producto: 1.5, inactivo: 1, venta: 1.2, nunca: 1, ningun: 1.5, sin: 1 },
  "products.profitability": { margen: 3, producto: 1.2, rentab: 2, deja: 1.5 },
  "products.growing": { producto: 1.2, crecer: 3, caer: 2, venta: 0.8, alza: 2 },
  "inventory.availability": { inventario: 2, disponible: 2, existenc: 2, hay: 1, producto: 0.8 },
  "inventory.low_stock": { agotar: 3, inventario: 1.5, minimo: 2, reabast: 3, critic: 2, resurt: 2 },
  "inventory.rotation": { rotacion: 3.5, inventario: 1, producto: 0.5, dia: 0.5 },
  "inventory.by_warehouse": { inventario: 2, almacen: 2.5, bodega: 2, monterrey: 1, guadalajara: 1, cdmx: 1 },
  "inventory.by_family": { inventario: 2, familia: 3, concentra: 1, categoria: 2 },
  "inventory.no_movement": { inventario: 1.2, movimiento: 3, estancad: 3, obsolet: 3, parad: 2, sin: 1 },
  "finance.receivables": { cobrar: 3, cartera: 2, deb: 1.5, pendiente: 1 },
  "finance.overdue": { vencido: 3, factura: 1.5, cobrar: 1 },
  "finance.overdue_pct": { vencido: 2.5, porcentaje: 3, factura: 1, morosidad: 3, proporcion: 2 },
  "finance.aging": { antiguedad: 3, dia: 1.5, vencido: 1, cobrar: 1.2, aging: 3 },
  "finance.gross_margin": { margen: 3, bruto: 2, utilidad: 1.5, costo: 1.2, venta: 0.4 },
  "crm.pipeline": { oportunidad: 1.8, pipeline: 3, valor: 1.5, embudo: 3 },
  "crm.opportunities": { oportunidad: 3, abierta: 1.5, negociacion: 1.5 },
  "crm.conversion": { conversion: 3, oportunidad: 1.2, ganad: 2, perdid: 1.5, porcentaje: 1 },
  "crm.quotes": { cotizacion: 3.5, ganad: 1.5, vigente: 1.5 },
  "forecast.sales": { pronostico: 3.5, venta: 1, proximo: 1.5, esperamos: 1.5 },
  "analytics.visualization": { grafica: 3.5, barra: 1, linea: 1, pastel: 1 },
  "analytics.export": { exportar: 4 },
  "system.help": { ayuda: 3, ejemplo: 2, pregunt: 1.5, funcion: 1.5, significa: 2, sale: 1.5 },
  "system.navigation": { navegar: 3, modulo: 2, abre: 2, ir: 1 },
  "system.capabilities": { puedes: 1.5, capacidad: 3, sabes: 1.5, sirves: 2, ayuda: 1.5 },
  "system.greeting": { hola: 3, buenos: 2, buenas: 2, tal: 1, hey: 2 },
}

export interface IntentScore {
  intent: IntentId
  score: number
  tfidf: number
  rules: number
}

export interface Classification {
  intent: IntentId
  confidence: number
  margin: number
  ranked: IntentScore[]
  /** Regla léxica de refinamiento que ajustó la intención (si actuó). */
  rule?: string
}

export class IntentClassifier {
  private examples: Example[] = []
  private idf = new Map<string, number>()
  private centroids = new Map<IntentId, Vec>()
  /** Peso del TF-IDF en el híbrido (el resto es reglas). */
  hybridWeight = 0.65

  constructor(training: Record<IntentId, string[]> = TRAINING) {
    const raw: { intent: IntentId; text: string; tf: Map<string, number> }[] = []
    for (const id of Object.keys(training) as IntentId[]) for (const text of training[id]) raw.push({ intent: id, text, tf: termFreq(features(text)) })
    const df = new Map<string, number>()
    for (const e of raw) for (const k of e.tf.keys()) df.set(k, (df.get(k) ?? 0) + 1)
    const N = raw.length
    for (const [k, c] of df) this.idf.set(k, Math.log((N + 1) / (c + 1)) + 1)
    this.examples = raw.map((e) => ({ ...e, vec: this.vectorize(e.tf) }))
    for (const id of Object.keys(training) as IntentId[]) this.centroids.set(id, this.centroidOf(id))
  }

  private vectorize(tf: Map<string, number>): Vec {
    const v: Vec = new Map()
    for (const [k, c] of tf) {
      const idf = this.idf.get(k)
      if (idf !== undefined) v.set(k, c * idf)
    }
    return normalizeVec(v)
  }

  private centroidOf(intent: IntentId, exclude?: Example): Vec {
    const sum: Vec = new Map()
    for (const e of this.examples) {
      if (e.intent !== intent || e === exclude) continue
      for (const [k, x] of e.vec) sum.set(k, (sum.get(k) ?? 0) + x)
    }
    return normalizeVec(sum)
  }

  /** Puntaje por reglas ∈ [0,1]. */
  ruleScores(raw: string): Map<IntentId, number> {
    const toks = new Set(featureWords(raw))
    const stems = [...toks]
    const out = new Map<IntentId, number>()
    for (const id of INTENT_IDS) {
      const kw = RULES[id]
      const weights = Object.values(kw).sort((a, b) => b - a)
      const cap = (weights[0] ?? 1) + (weights[1] ?? 0) + (weights[2] ?? 0) * 0.5
      let s = 0
      for (const [k, w] of Object.entries(kw)) if (toks.has(k) || stems.some((t) => t.startsWith(k) && k.length >= 5)) s += w
      out.set(id, Math.min(1, s / cap))
    }
    return out
  }

  classify(raw: string, opts: { mode?: "hybrid" | "tfidf" | "rules"; leaveOut?: string; refine?: boolean } = {}): Classification {
    const mode = opts.mode ?? "hybrid"
    const qvec = this.vectorize(termFreq(features(raw)))
    const rules = this.ruleScores(raw)
    const bestByIntent = new Map<IntentId, number>()
    const exclude = opts.leaveOut ? this.examples.find((e) => e.text === opts.leaveOut) : undefined
    for (const e of this.examples) {
      if (e === exclude) continue
      const s = dot(qvec, e.vec)
      if (s > (bestByIntent.get(e.intent) ?? -1)) bestByIntent.set(e.intent, s)
    }
    const ranked: IntentScore[] = INTENT_IDS.map((intent) => {
      const centroid = exclude && exclude.intent === intent ? this.centroidOf(intent, exclude) : this.centroids.get(intent)!
      const tfidf = 0.6 * (bestByIntent.get(intent) ?? 0) + 0.4 * dot(qvec, centroid)
      const r = rules.get(intent) ?? 0
      const score = mode === "tfidf" ? tfidf : mode === "rules" ? r : this.hybridWeight * tfidf + (1 - this.hybridWeight) * r
      return { intent, score, tfidf, rules: r }
    }).sort((a, b) => b.score - a.score)
    if (mode === "hybrid" && opts.refine !== false) {
      const refined = refineIntent(raw, ranked[0].intent, ranked[0].score)
      if (refined.rule) {
        const idx = ranked.findIndex((r) => r.intent === refined.intent)
        const [hit] = ranked.splice(idx, 1)
        // Una regla léxica inequívoca eleva la intención con una confianza mínima razonable
        ranked.unshift({ ...hit, score: Math.max(hit.score, ranked[0].score * 0.9, 0.55) })
        return { intent: ranked[0].intent, confidence: ranked[0].score, margin: ranked[0].score - ranked[1].score, ranked, rule: refined.rule }
      }
    }
    return { intent: ranked[0].intent, confidence: ranked[0].score, margin: ranked[0].score - ranked[1].score, ranked }
  }

  /** Validación cruzada leave-one-out sobre el set de entrenamiento. */
  looAccuracy(mode: "hybrid" | "tfidf" | "rules"): number {
    let ok = 0
    for (const e of this.examples) if (this.classify(e.text, { mode, leaveOut: e.text }).intent === e.intent) ok++
    return ok / this.examples.length
  }

  get trainingSize() {
    return this.examples.length
  }
}

let shared: IntentClassifier | null = null
export function getClassifier(): IntentClassifier {
  if (!shared) shared = new IntentClassifier()
  return shared
}
