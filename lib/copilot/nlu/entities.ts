import { MONTHS_ES, addDays, addMonths, endOfMonth, endOfQuarter, formatDateEs, monthOf, quarterOf, startOfMonth, startOfQuarter, startOfWeek, yearOf } from "../dates"
import type { DemoCustomer, DemoProduct, IsoDate } from "../types"
import { fuzzyEq, isStopword, normalizeText, tokenize } from "./normalize"
import { TRAINING } from "./training"

export interface PeriodSpec {
  from: IsoDate
  to: IsoDate
  label: string
  kind: "day" | "week" | "month" | "quarter" | "year" | "ytd" | "rolling"
  /** El periodo aún no termina a la fecha de referencia. */
  partial: boolean
}

export type ChartKind = "auto" | "bar" | "line" | "area" | "donut"

export interface CustomerMatch {
  customer: DemoCustomer
  score: number
}

export interface Entities {
  periods: PeriodSpec[]
  comparisonRequested: boolean
  wantsPrevious: boolean // "el anterior", "contra el pasado"
  topN?: number
  families: string[]
  industry?: string
  customerMatches: CustomerMatch[]
  customerAmbiguous: boolean
  unknownCustomerName?: string
  referencesPrevious: boolean
  /** Texto normalizado con el nombre del cliente sustituido por «empresax» (para clasificar sin sesgo por nombres). */
  maskedText: string
  products: DemoProduct[]
  warehouseId?: string
  minDaysOverdue?: number
  chart?: ChartKind
  currency?: "USD" | "MXN"
  sortDir?: "asc" | "desc"
  horizonMonths?: number
  rollingMonths?: number
  inactiveDays?: number
}

export interface EntityContext {
  ref: IsoDate
  customers: DemoCustomer[]
  products: DemoProduct[]
}

const NUMBER_WORDS: Record<string, number> = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, treinta: 30 }
const num = (s: string): number | null => (/^\d+$/.test(s) ? Number(s) : NUMBER_WORDS[s] ?? null)

const MONTH_ALIASES: [RegExp, number][] = [
  [/^(enero|ene)$/, 1], [/^(febrero|feb)$/, 2], [/^(marzo|mar)$/, 3], [/^(abril|abr)$/, 4], [/^(mayo|may)$/, 5], [/^(junio|jun)$/, 6],
  [/^(julio|jul)$/, 7], [/^(agosto|ago)$/, 8], [/^(septiembre|setiembre|sep|sept)$/, 9], [/^(octubre|oct)$/, 10], [/^(noviembre|nov)$/, 11], [/^(diciembre|dic)$/, 12],
]

const FAMILY_PATTERNS: [RegExp, string][] = [
  [/medio voltaje|media tension|alto voltaje|\bmv\b|\b(5|15|35) ?kv\b/, "Medio Voltaje"],
  [/mineri|minero|minera\b|\bmina\b/, "Minería"],
  [/armad/, "Armados"],
  [/control|potencia/, "Control/Potencia"],
  [/renovable|solar|fotovoltaic|eolic/, "Renovable"],
  [/monopolar/, "Monopolares"],
  [/alta temperatura|alta temp/, "Alta Temperatura"],
  [/\biec\b|norma iec/, "Norma IEC"],
  [/aluminio|\bal\b/, "Aluminio"],
  [/\bplano/, "Planos"],
  [/instrumentacion/, "Instrumentación"],
  [/flexible/, "Flexibles"],
  [/industrial/, "Industriales"],
]

const INDUSTRY_PATTERNS: [RegExp, string][] = [
  [/mineri|minero/, "Minería"],
  [/construccion|infraestructura/, "Construcción e infraestructura"],
  [/renovable|solar|eolic/, "Energía renovable"],
  [/manufactur/, "Manufactura"],
  [/petroleo|gas\b/, "Petróleo y gas"],
  [/distribucion electrica|electrica\b/, "Distribución eléctrica"],
  [/agroindustri|bombeo|riego/, "Agroindustria y bombeo"],
  [/automotriz|autopartes/, "Automotriz y autopartes"],
]

// ---------- periodos ----------
function monthSpec(y: number, m: number, ref: IsoDate): PeriodSpec {
  const from = `${y}-${String(m).padStart(2, "0")}-01` as IsoDate
  const full = endOfMonth(from)
  const partial = full > ref
  const to = partial ? ref : full
  const base = `${MONTHS_ES[m - 1]} ${y}`
  return { from, to, label: partial ? `${base} (al ${formatDateEs(ref)})` : base, kind: "month", partial }
}

function quarterSpec(y: number, q: number, ref: IsoDate): PeriodSpec {
  const from = `${y}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01` as IsoDate
  const full = endOfQuarter(from)
  const partial = full > ref
  return { from, to: partial ? ref : full, label: partial ? `T${q} ${y} (al ${formatDateEs(ref)})` : `T${q} ${y}`, kind: "quarter", partial }
}

function yearSpec(y: number, ref: IsoDate): PeriodSpec {
  const full = `${y}-12-31` as IsoDate
  const partial = full > ref
  return { from: `${y}-01-01` as IsoDate, to: partial ? ref : full, label: partial ? `${y} (acumulado al ${formatDateEs(ref)})` : String(y), kind: partial ? "ytd" : "year", partial }
}

export function previousPeriod(p: PeriodSpec, ref: IsoDate): PeriodSpec {
  switch (p.kind) {
    case "month": {
      const prev = addMonths(startOfMonth(p.from), -1)
      return monthSpec(yearOf(prev), monthOf(prev), ref)
    }
    case "quarter": {
      const prev = addMonths(startOfQuarter(p.from), -3)
      return quarterSpec(yearOf(prev), quarterOf(prev), ref)
    }
    case "year":
    case "ytd":
      return yearSpec(yearOf(p.from) - 1, ref)
    case "day": {
      const d = addDays(p.from, -1)
      return { from: d, to: d, label: formatDateEs(d), kind: "day", partial: false }
    }
    case "week": {
      const from = addDays(p.from, -7)
      return { from, to: addDays(from, 6), label: `semana del ${formatDateEs(from)}`, kind: "week", partial: false }
    }
    default: {
      // Rango de meses completos: se desplaza por meses, no por días
      if (p.from.endsWith("-01") && endOfMonth(p.to) === p.to) {
        const n = (yearOf(p.to) - yearOf(p.from)) * 12 + monthOf(p.to) - monthOf(p.from) + 1
        const from = addMonths(p.from, -n)
        const to = endOfMonth(addMonths(p.from, -1))
        return { from, to, label: `${formatDateEs(from)} – ${formatDateEs(to)}`, kind: "rolling", partial: false }
      }
      const span = Math.round((Date.parse(p.to) - Date.parse(p.from)) / 86_400_000) + 1
      const to = addDays(p.from, -1)
      const from = addDays(to, -(span - 1))
      return { from, to, label: `${formatDateEs(from)} – ${formatDateEs(to)}`, kind: "rolling", partial: false }
    }
  }
}

/** Mismo número de días transcurridos del periodo previo (para comparar mes en curso parcial). */
export function likeForLikePrevious(p: PeriodSpec, ref: IsoDate): PeriodSpec | null {
  if (!p.partial) return null
  const prev = previousPeriod({ ...p, partial: false }, ref)
  const elapsed = Math.round((Date.parse(p.to) - Date.parse(p.from)) / 86_400_000)
  const to = addDays(prev.from, elapsed)
  return { ...prev, to: to > prev.to ? prev.to : to, label: `${prev.label} (mismos ${elapsed + 1} días)`, partial: false }
}

/** Atajos de periodos para los valores por omisión del planificador. */
export const monthToDate = (ref: IsoDate): PeriodSpec => monthSpec(yearOf(ref), monthOf(ref), ref)
export const yearToDate = (ref: IsoDate): PeriodSpec => yearSpec(yearOf(ref), ref)
export function lastMonthsToDate(n: number, ref: IsoDate): PeriodSpec {
  return { from: startOfMonth(addMonths(ref, -(n - 1))), to: ref, label: `últimos ${n} meses (a la fecha)`, kind: "rolling", partial: true }
}
/** N meses COMPLETOS que terminan en el último mes cerrado. */
export function lastCompleteMonths(n: number, ref: IsoDate): PeriodSpec {
  const to = addDays(startOfMonth(ref), -1)
  const from = startOfMonth(addMonths(to, -(n - 1)))
  return { from, to, label: `últimos ${n} meses completos`, kind: "rolling", partial: false }
}

interface Hit {
  index: number
  spec: PeriodSpec
}

export function extractPeriods(text: string, ref: IsoDate): { periods: PeriodSpec[]; rollingMonths?: number } {
  let work = ` ${text} `
  const hits: Hit[] = []
  let rollingMonths: number | undefined
  const take = (re: RegExp, build: (m: RegExpExecArray) => PeriodSpec | null) => {
    let m: RegExpExecArray | null
    const g = new RegExp(re.source, "g")
    while ((m = g.exec(work))) {
      const spec = build(m)
      if (!spec) continue
      hits.push({ index: m.index, spec })
      work = work.slice(0, m.index) + " ".repeat(m[0].length) + work.slice(m.index + m[0].length)
      g.lastIndex = m.index + m[0].length
    }
  }
  // últimos N meses / días / semanas
  take(/\bultim[oa]s?\s+(\d+|[a-z]+)\s+(mes(?:es)?|dias?|semanas?|anos?|trimestres?)\b/, (m) => {
    const n = num(m[1])
    if (!n) return null
    const unit = m[2]
    if (unit.startsWith("mes")) {
      rollingMonths = n
      const from = startOfMonth(addMonths(ref, -(n - 1)))
      return { from, to: ref, label: `últimos ${n} meses (a la fecha, incluye el mes en curso)`, kind: "rolling", partial: true }
    }
    if (unit.startsWith("dia")) return { from: addDays(ref, -(n - 1)), to: ref, label: `últimos ${n} días`, kind: "rolling", partial: false }
    if (unit.startsWith("semana")) return { from: addDays(ref, -(n * 7 - 1)), to: ref, label: `últimas ${n} semanas`, kind: "rolling", partial: false }
    if (unit.startsWith("trimestre")) {
      rollingMonths = n * 3
      return { from: startOfMonth(addMonths(ref, -(n * 3 - 1))), to: ref, label: `últimos ${n} trimestres`, kind: "rolling", partial: true }
    }
    return { from: addDays(ref, -(n * 365 - 1)), to: ref, label: `últimos ${n} años`, kind: "rolling", partial: false }
  })
  take(/\b(?:la\s+)?ultima semana\b/, () => ({ from: addDays(ref, -6), to: ref, label: "últimos 7 días", kind: "rolling", partial: false }))
  take(/\bano pasado\b|\bano anterior\b|\bel ano previo\b/, () => yearSpec(yearOf(ref) - 1, ref))
  take(/\b(primer|segundo|tercer|cuarto|1er|2do|3er|4to)\s+trimestre(?:\s+(?:de\s+)?(20\d\d))?\b/, (m) => {
    const q = { primer: 1, "1er": 1, segundo: 2, "2do": 2, tercer: 3, "3er": 3, cuarto: 4, "4to": 4 }[m[1]] ?? 1
    return quarterSpec(m[2] ? Number(m[2]) : yearOf(ref), q, ref)
  })
  take(/\bt([1-4])(?:\s+(20\d\d))?\b/, (m) => quarterSpec(m[2] ? Number(m[2]) : yearOf(ref), Number(m[1]), ref))
  take(/\btrimestre\s+(?:pasado|anterior|previo)\b|\bel\s+trimestre\s+anterior\b/, () => previousPeriod(quarterSpec(yearOf(ref), quarterOf(ref), ref), ref))
  take(/\b(?:este|actual|presente|en curso)\s+trimestre\b|\btrimestre\s+(?:actual|en curso)\b/, () => quarterSpec(yearOf(ref), quarterOf(ref), ref))
  take(/\bmes\s+(?:pasado|anterior|previo)\b|\bel\s+mes\s+anterior\b/, () => previousPeriod(monthSpec(yearOf(ref), monthOf(ref), ref), ref))
  take(/\b(?:este|actual|presente|en curso)\s+mes\b|\bmes\s+(?:actual|en curso)\b|\bdel\s+mes\b/, () => monthSpec(yearOf(ref), monthOf(ref), ref))
  take(/\bsemana\s+(?:pasada|anterior)\b/, () => {
    const cur = startOfWeek(ref)
    const from = addDays(cur, -7)
    return { from, to: addDays(from, 6), label: `semana del ${formatDateEs(from)}`, kind: "week", partial: false }
  })
  take(/\b(?:esta|la)\s+semana\b(?!\s+pasada)/, () => ({ from: startOfWeek(ref), to: ref, label: "esta semana", kind: "week", partial: true }))
  take(/\banteayer\b/, () => ({ from: addDays(ref, -2), to: addDays(ref, -2), label: `anteayer (${formatDateEs(addDays(ref, -2))})`, kind: "day", partial: false }))
  take(/\bayer\b/, () => ({ from: addDays(ref, -1), to: addDays(ref, -1), label: `ayer (${formatDateEs(addDays(ref, -1))})`, kind: "day", partial: false }))
  take(/\bhoy\b/, () => ({ from: ref, to: ref, label: `hoy (${formatDateEs(ref)})`, kind: "day", partial: true }))
  take(/\b(?:este|en el|del|durante el|lo que va del|en lo que va del)\s+ano\b|\bano\s+(?:actual|en curso)\b|\bacumulado\b|\bytd\b/, () => yearSpec(yearOf(ref), ref))
  // meses por nombre, con año opcional
  const monthRe = /\b(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|setiembre|sept|sep|octubre|oct|noviembre|nov|diciembre|dic)\b(?:\s+(?:de(?:l)?\s+)?(20\d\d))?/
  take(monthRe, (m) => {
    const month = MONTH_ALIASES.find(([re]) => re.test(m[1]))?.[1]
    if (!month) return null
    if (m[2]) return monthSpec(Number(m[2]), month, ref)
    let y = yearOf(ref)
    if (`${y}-${String(month).padStart(2, "0")}-01` > ref) y -= 1
    return monthSpec(y, month, ref)
  })
  take(/\b(2025|2026)\b/, (m) => (Number(m[1]) > yearOf(ref) ? null : yearSpec(Number(m[1]), ref)))
  hits.sort((a, b) => a.index - b.index)
  return { periods: hits.map((h) => h.spec), rollingMonths }
}

// ---------- clientes ----------
const GENERIC_NAME_TOKENS = new Set(["sa", "de", "cv", "del", "la", "los", "las", "s", "a", "c", "v"])
const CUSTOMER_STOP = new Set(["cobre", "mesa", "norte", "central", "global", "integral", "valle"])
/**
 * Palabras corporativas/giro comunes que NO identifican a un cliente por sí solas
 * («Minera», «Constructora», «Industrias»…). Es un léxico configurable por cliente.
 */
const GENERIC_COMPANY_WORDS = new Set(["minera", "minero", "operadora", "metales", "constructora", "ingenieria", "obras", "solar", "energias", "energia", "parque", "eolico", "industrias", "industrial", "industriales", "manufacturas", "servicios", "petroleros", "energeticos", "electrica", "distribuidora", "agroindustrias", "bombeo", "riego", "autopartes", "ensambles", "mexicana", "occidente", "bajio", "peninsular", "andina", "grupo", "empresa", "comercial"])
let vocab: Set<string> | null = null
function knownVocabulary(): Set<string> {
  if (vocab) return vocab
  vocab = new Set<string>()
  for (const list of Object.values(TRAINING)) for (const ex of list) for (const t of tokenize(normalizeText(ex))) vocab.add(t)
  for (const m of MONTHS_ES) vocab.add(m)
  return vocab
}

const customerIndexCache = new WeakMap<DemoCustomer[], { tokensById: Map<string, string[]>; df: Map<string, number> }>()
function customerIndex(customers: DemoCustomer[]) {
  let idx = customerIndexCache.get(customers)
  if (idx) return idx
  const tokensById = new Map<string, string[]>()
  const df = new Map<string, number>()
  for (const c of customers) {
    const toks = [...new Set(tokenize(normalizeText(c.name)).filter((t) => !GENERIC_NAME_TOKENS.has(t) && t.length >= 3))]
    tokensById.set(c.id, toks)
    for (const t of toks) df.set(t, (df.get(t) ?? 0) + 1)
  }
  idx = { tokensById, df }
  customerIndexCache.set(customers, idx)
  return idx
}

export function matchCustomers(text: string, customers: DemoCustomer[]): { matches: CustomerMatch[]; ambiguous: boolean; mention: boolean; matchedTokens: string[] } {
  const { tokensById, df } = customerIndex(customers)
  const q = tokenize(text).filter((t) => !isStopword(t) && t.length >= 3)
  const cue = /\b(cliente|clientes|empresa|cuenta de|saldo de|historial|ultima compra|ha comprado|compro|debe)\b/.test(text)
  const distinctive = (t: string) => (df.get(t) ?? 0) <= 10 && !CUSTOMER_STOP.has(t) && !GENERIC_COMPANY_WORDS.has(t)
  const scores = new Map<string, number>()
  const matchedTokens = new Set<string>()
  let accepted = false
  for (const c of customers) {
    let s = 0
    let dHit = 0
    let gHit = 0
    let total = 0
    const hits: string[] = []
    const nameTokens = tokensById.get(c.id)!
    for (const t of nameTokens) {
      const hit = q.find((w) => fuzzyEq(w, t))
      if (!hit) continue
      total++
      hits.push(hit)
      if (distinctive(t)) {
        s += 1 + 1 / Math.max(1, df.get(t) ?? 1)
        dHit++
      } else if (!CUSTOMER_STOP.has(t)) {
        s += 0.25
        gHit++
      } else {
        s += 0.1
      }
    }
    // Nombre completo escrito: identifica al cliente aunque ninguna palabra sea «distintiva» por sí sola
    const full = nameTokens.length >= 2 && total === nameTokens.length
    // Un nombre propio basta con una pista de cliente; sin ella se exige otra palabra del nombre
    if (full || (dHit > 0 && (cue || dHit + gHit >= 2)) || (cue && total >= 3)) {
      scores.set(c.id, s + (full ? 10 : 0))
      accepted = true
      hits.forEach((h) => matchedTokens.add(h))
    }
  }
  if (!accepted) return { matches: [], ambiguous: false, mention: false, matchedTokens: [] }
  const byId = new Map(customers.map((c) => [c.id, c]))
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])
  const top = ranked[0][1]
  const winners = ranked.filter(([, s]) => top - s < 0.01)
  const matches = winners.map(([id, score]) => ({ customer: byId.get(id)!, score }))
  // También se enmascaran las palabras corporativas contiguas («minera», «industrias») del nombre
  for (const w of q) if (GENERIC_COMPANY_WORDS.has(w)) matchedTokens.add(w)
  return { matches, ambiguous: matches.length > 1, mention: true, matchedTokens: [...matchedTokens] }
}

function extractUnknownCustomer(text: string): string | undefined {
  const v = knownVocabulary()
  const fromCue = /\b(?:cliente|empresa)\s+(?:llamad[oa]\s+)?([a-z0-9][a-z0-9 ]{2,40}?)(?:\s+(?:en|durante|de|del|este|esta|el|la)\b|$)/.exec(text)
  if (fromCue) {
    const words = tokenize(fromCue[1]).filter((w) => !isStopword(w))
    if (words.length && !words.every((w) => v.has(w))) return words.join(" ")
  }
  // «Constructora Zafiro»: palabra corporativa seguida de nombres que no son vocabulario del dominio
  const toks = tokenize(text)
  const idx = toks.findIndex((w) => GENERIC_COMPANY_WORDS.has(w))
  if (idx >= 0) {
    const next = toks.slice(idx + 1, idx + 3).filter((w) => !isStopword(w) && !v.has(w) && !/^\d+$/.test(w))
    if (next.length) return [toks[idx], ...next].join(" ")
  }
  return undefined
}

// ---------- productos ----------
const PRODUCT_GENERIC = new Set(["cable", "cables", "producto", "productos", "precio", "precios", "cuesta", "cuestan", "costo", "sku", "skus", "metro", "metros", "tenemos", "manejamos", "stock", "inventario", "existencia", "existencias", "disponible", "disponibles", "disponibilidad", "hay", "queda", "busca", "buscame", "lista", "catalogo", "ensename", "muestrame", "dime", "dame", "tipo", "awg", "kcmil", "cuanto", "cuantos", "sale"])
export function matchProducts(text: string, products: DemoProduct[]): DemoProduct[] {
  const skuHit = /\bsw-[a-z0-9-]+/.exec(text)
  if (skuHit) {
    const exact = products.filter((p) => p.sku.toLowerCase() === skuHit[0])
    if (exact.length) return exact
    return products.filter((p) => p.sku.toLowerCase().startsWith(skuHit[0])).slice(0, 8)
  }
  const gaugeHit = /(\d+\/\d+|\d+)\s*(awg|kcmil)/.exec(text)
  const gauge = gaugeHit ? `${gaugeHit[1]} ${gaugeHit[2].toUpperCase().replace("KCMIL", "kcmil")}` : null
  const q = tokenize(text).filter((t) => !isStopword(t) && !PRODUCT_GENERIC.has(t) && t.length >= 3 && !/^\d+$/.test(t))
  if (!q.length && !gauge) return []
  const scored: { p: DemoProduct; s: number }[] = []
  for (const p of products) {
    const ptoks = new Set(tokenize(normalizeText(`${p.name} ${p.family}`)))
    const hits = q.filter((t) => [...ptoks].some((pt) => fuzzyEq(t, pt))).length
    if (!hits && !gauge) continue
    if (gauge && p.gauge?.toLowerCase() !== gauge.toLowerCase()) continue
    if (q.length && hits < Math.min(q.length, 2)) continue
    scored.push({ p, s: hits + (gauge ? 1 : 0) })
  }
  return scored.sort((a, b) => b.s - a.s || (a.p.sku < b.p.sku ? -1 : 1)).slice(0, 60).map((x) => x.p)
}

// ---------- extracción principal ----------
export function extractEntities(raw: string, ctx: EntityContext): Entities {
  const text = normalizeText(raw)
  const { periods, rollingMonths } = extractPeriods(text, ctx.ref)

  const cm = matchCustomers(text, ctx.customers)
  const unknownName = cm.mention ? undefined : extractUnknownCustomer(text)
  const maskWords = new Set([...cm.matchedTokens, ...(unknownName ? tokenize(unknownName) : [])])
  const maskedText = maskWords.size ? tokenize(text).map((w) => (maskWords.has(w) ? "empresax" : w)).join(" ").replace(/(empresax\s*)+/g, "empresax ").trim() : text
  // Familias, industria y productos se buscan en el texto SIN el nombre del cliente («Minera Aurora» no es la familia Minería)
  const ft = maskedText

  const families: string[] = []
  for (const [re, fam] of FAMILY_PATTERNS) if (re.test(ft) && !families.includes(fam)) families.push(fam)
  // "control" / "potencia" / "industrial" aparecen en frases genéricas: solo cuentan con "cable(s)" o "familia"
  const familyContext = /\bcables?\b|familia|categoria|linea/.test(ft)
  const strongFamilies = families.filter((f) => !["Control/Potencia", "Industriales", "Planos", "Armados"].includes(f) || familyContext)

  let industry: string | undefined
  if (/\bclientes?\b/.test(ft) && /\b(sector|industria|giro|del ramo)\b|clientes? de (mineri|construccion|manufactur|petroleo|automotriz|agroindustri)/.test(ft)) {
    industry = INDUSTRY_PATTERNS.find(([re]) => re.test(ft))?.[1]
  }
  const familiesForQuery = industry ? strongFamilies.filter((f) => !(f === "Minería" && industry === "Minería")) : strongFamilies

  let topN: number | undefined
  const topM = /\btop\s*(\d+)\b/.exec(text) ?? /\b(\d+)\s+(?:mejores|principales|clientes|productos|cables|skus|oportunidades|facturas|mas|que)\b/.exec(text) ?? /\b(?:mis|los|las|nuestros)\s+(\d+)\b/.exec(text)
  if (topM) topN = Number(topM[1])
  else {
    const w = /\b(?:los|las|mis|top|primeros)\s+(un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/.exec(text) ?? /\b(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:mejores|principales|clientes|productos|cables|skus|oportunidades)/.exec(text)
    if (w) topN = num(w[1]) ?? undefined
  }
  if (topN !== undefined && (topN < 1 || topN > 50)) topN = Math.min(50, Math.max(1, topN))

  let warehouseId: string | undefined
  if (/monterrey|\bmty\b/.test(text) && /almacen|bodega|inventario|stock|existencia/.test(text)) warehouseId = "ALM-MTY"
  else if (/guadalajara|\bgdl\b/.test(text) && /almacen|bodega|inventario|stock|existencia/.test(text)) warehouseId = "ALM-GDL"
  else if (/cdmx|ciudad de mexico/.test(text) && /almacen|bodega|inventario|stock|existencia/.test(text)) warehouseId = "ALM-CDMX"

  const daysM = /(?:mas de|mayor(?:es)? a|superior(?:es)? a|arriba de|\+)\s*(\d+)\s*dias/.exec(text)
  const inactiveM = /(?:sin|en los ultimos|en|ultimos|hace|desde hace|mas de|llevan)\s*(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\s*(dias|meses)/.exec(text)
  let inactiveDays: number | undefined
  if (/dejaron de comprar|inactiv|no han comprado|no nos han comprado|no nos compran|sin comprar|sin compras|sin pedidos|ya no nos compran|dormid|perdid|sin moverse|no se han movido|sin movimiento|no tienen movimiento/.test(text)) {
    if (inactiveM) inactiveDays = (num(inactiveM[1]) ?? 0) * (inactiveM[2] === "meses" ? 30 : 1) || undefined
    else if (rollingMonths) inactiveDays = rollingMonths * 30
  }

  let chart: ChartKind | undefined
  if (/grafic|diagrama|chart|visualiz|\bbarras?\b|pastel|dona|donut/.test(text)) {
    chart = /pastel|dona|donut|\bpie\b/.test(text) ? "donut" : /\bbarras?\b/.test(text) ? "bar" : /\barea\b/.test(text) ? "area" : /\blinea\b|tendencia/.test(text) ? "line" : "auto"
  }

  let horizonMonths: number | undefined
  if (/proximo mes|siguiente mes|mes que viene/.test(text)) horizonMonths = 1
  else if (/proximo trimestre|siguiente trimestre/.test(text)) horizonMonths = 3
  else {
    const hm = /(?:proximos?|siguientes?)\s+(\d+|[a-z]+)\s+meses/.exec(text)
    const n = hm ? num(hm[1]) : null
    if (n) horizonMonths = Math.min(6, n)
    else if (/cerrar|cerraremos|cierre del ano|fin de ano/.test(text)) horizonMonths = Math.max(1, 12 - monthOf(ctx.ref))
  }

  const comparisonRequested = /\bcompar|\bvs\b|\bversus\b|\bcontra\b|\bfrente a\b|\brespecto a\b|\bdiferencia entre\b|\bcomparado\b/.test(text)
  const wantsPrevious = /\b(anterior|previo|pasado)\b/.test(text)
  const sortDir = /\b(menos|peor|menor|menores|mas bajo|pocos?|casi no)\b/.test(text) ? "asc" : /\b(mas|mejor|mayor|top)\b/.test(text) ? "desc" : undefined
  const currency = /dolares|\busd\b/.test(text) ? "USD" : /\bpesos\b|\bmxn\b/.test(text) ? "MXN" : undefined

  const products = /precio|cuesta|cuestan|cuanto sale|stock|existencia|inventario|disponib|tenemos|hay|busca|buscame|\bsku\b|sw-/.test(text) || /\bsw-/.test(text) ? matchProducts(ft, ctx.products) : []

  return {
    periods,
    comparisonRequested,
    wantsPrevious,
    topN,
    families: familiesForQuery,
    industry,
    customerMatches: cm.matches,
    customerAmbiguous: cm.ambiguous,
    unknownCustomerName: unknownName,
    maskedText,
    referencesPrevious: /\b(ese|esa|dicho|el mismo|la misma|los mismos|las mismas)\s*(cliente|producto|mes|periodo|familia)?\b|\blos anteriores\b|\blo mismo\b|\bde ellos\b|\bsus\b/.test(text),
    products,
    warehouseId,
    minDaysOverdue: daysM ? Number(daysM[1]) : undefined,
    chart,
    currency,
    sortDir,
    horizonMonths,
    rollingMonths,
    inactiveDays,
  }
}
