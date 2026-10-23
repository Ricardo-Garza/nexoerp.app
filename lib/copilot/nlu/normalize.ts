/**
 * Normalización léxica para español informal de negocios (México).
 * Pasos: minúsculas → sin diacríticos → puntuación fuera → slang/abreviaturas →
 * canonicalización de raíces del dominio (vend*, client*, margen/lana…) → stemming ligero.
 */

export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ñ/g, "n")
}

/** Texto limpio pero conservando las palabras tal cual (para entidades y fechas). */
export function normalizeText(input: string): string {
  return stripDiacritics(input.toLowerCase())
    .replace(/[¿?¡!.,;:()"“”'`]/g, " ")
    .replace(/[^a-z0-9$%/\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const SLANG: Record<string, string> = {
  q: "que",
  k: "que",
  ke: "que",
  kual: "cual",
  cual: "cual",
  cuales: "cual",
  cuanto: "cuanto",
  cuantos: "cuanto",
  cuanta: "cuanto",
  cuantas: "cuanto",
  xq: "porque",
  pq: "porque",
  porq: "porque",
  tmb: "tambien",
  tb: "tambien",
  x: "por",
  d: "de",
  pa: "para",
  pal: "para el",
  mas: "mas",
  mjr: "mejor",
  vs: "contra",
  versus: "contra",
  comparame: "comparar",
  compara: "comparar",
  comparalos: "comparar",
  comparalas: "comparar",
  muestrame: "mostrar",
  muestra: "mostrar",
  muestre: "mostrar",
  enseñame: "mostrar",
  ensename: "mostrar",
  dame: "mostrar",
  dime: "mostrar",
  grafica: "grafica",
  graficame: "grafica",
  grafica_: "grafica",
  vendimos: "venta",
  facturamos: "venta",
  ocupo: "necesito",
  kiero: "quiero",
  qiero: "quiero",
  mes_: "mes",
  ayuda: "ayuda",
  xfa: "porfavor",
  plis: "porfavor",
  porfa: "porfavor",
}

/** Regex de prefijo → token canónico. Cubre sinónimos coloquiales del dominio. */
const CANON: [RegExp, string][] = [
  [/^(vend|venta|ingres|factur[a-z]*cion)/, "venta"],
  [/^(client|comprad)/, "cliente"],
  [/^(compr|adquir|pedid|orden)/, "compra"],
  [/^(product|articul|cable|sku|item|referenc|mercanci)/, "producto"],
  [/^(inventar|stock|existenc|almacen|bodega|surtid)/, "inventario"],
  [/^(margen|utilid|ganan|rentab|lana|rendim|ganancia)/, "margen"],
  [/^(deb|adeud|cobr|cartera|saldo|cxc|cuenta[s]?$)/, "cobrar"],
  [/^(vencid|moros|atrasad|retrasad)/, "vencido"],
  [/^(oportunid|pipeline|embudo|funnel|prospect|negociac)/, "oportunidad"],
  [/^(cotiz)/, "cotizacion"],
  [/^(grafic|grafi|diagram|visualiz|chart|barras|pastel|dona|donut)/, "grafica"],
  [/^(compar|contra|frente|respecto)/, "comparar"],
  [/^(tendenc|evoluc|historic|mensual|mes_por)/, "tendencia"],
  [/^(pronost|proyecc|predic|forecast|estimac|prevision)/, "pronostico"],
  [/^(exporta|descarg|csv|excel|xlsx)/, "exportar"],
  [/^(rotac|rota)/, "rotacion"],
  [/^(agot|escas|faltant|bajo$|bajos$|critic|reabast|surtir|resurt)/, "agotar"],
  [/^(mejor|top|principal|mayor|importante|grande|fuerte|lider|estrella|destacad|favorit)/, "mejor"],
  [/^(peor|menor|menos)/, "menos"],
  [/^(crec|aument|increment|subi|mejor[oó]|ascend)/, "crecer"],
  [/^(cay|baja|bajaron|bajar|disminu|decrec|descend)/, "caer"],
  [/^(inactiv|dejar|dejaron|dormid|sin$)/, "inactivo"],
  [/^(ayud|funcion|capacid|puedes|sabes|haces)/, "ayuda"],
  [/^(ir$|abre|abrir|navega|llevame|llevar|vamos)/, "navegar"],
  [/^(sector|industri|giro)/, "industria"],
  [/^(almac)/, "inventario"],
  [/^(mes$|meses$|mensu)/, "mes"],
  [/^(trimes)/, "trimestre"],
  [/^(semana|semanal)/, "semana"],
  [/^(dias?$|diari)/, "dia"],
  [/^(anual|ano|anos)$/, "ano"],
  [/^(ticket|promedio|media$)/, "promedio"],
  [/^(precio|costo|tarifa|cuesta|cuestan|valor)/, "precio"],
  [/^(concentr|dependen|participac|particip|porcentaj|proporc)/, "participacion"],
  [/^(categor|famil|linea[s]?$|tipo[s]?$)/, "familia"],
]

const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "a", "en", "y", "o", "u", "e", "que", "se", "su", "sus", "mi", "mis", "nos", "me", "te", "lo", "le", "les", "es", "son", "fue", "fueron", "ha", "han", "hay", "tiene", "tienen", "tenemos", "tengo", "para", "por", "con", "sin", "sobre", "entre", "esta", "este", "esto", "estos", "estas", "ese", "esa", "eso", "como", "cuando", "donde", "porfavor", "favor", "quiero", "necesito", "podrias", "puedes", "podria", "gracias", "hola", "oye", "ok", "ya", "pues", "tambien", "ser", "estan", "esta", "estamos", "he", "mas", "muy", "todo", "toda", "todos", "todas", "nuestro", "nuestra", "nuestros", "nuestras", "mostrar", "ver", "quien", "quienes", "cual", "cuanto", "porque",
])

/** Stemming mínimo para verbos y plurales frecuentes (no pretende ser lingüístico). */
function stem(tok: string): string {
  if (tok.length <= 5 || /\d/.test(tok)) return tok
  return tok.replace(/(amente|mente|aron|ieron|ando|iendo|amos|imos|ados|idos|adas|idas|ado|ido|ada|ida|ar|er|ir|es|s)$/, "")
}

export interface NormalizedQuery {
  raw: string
  text: string // limpio, con todas las palabras
  tokens: string[] // palabras limpias (sin stopwords) tras slang
  canonical: string[] // tokens canónicos + stems, base del clasificador
}

export function tokenize(text: string): string[] {
  return text.split(" ").filter(Boolean)
}

export function canonicalize(tok: string): string {
  for (const [re, canon] of CANON) if (re.test(tok)) return canon
  return stem(tok)
}

export function normalizeQuery(raw: string): NormalizedQuery {
  const text = normalizeText(raw)
  const expanded = tokenize(text).flatMap((t) => (SLANG[t] ? tokenize(SLANG[t]) : [t]))
  const tokens = expanded.filter((t) => !STOPWORDS.has(t))
  const canonical = tokens.map(canonicalize)
  return { raw, text, tokens, canonical }
}

export function isStopword(t: string) {
  return STOPWORDS.has(t)
}

/** Distancia de Levenshtein acotada (suficiente para typos de 1-2 letras). */
export function editDistance(a: string, b: string, max = 3): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      rowMin = Math.min(rowMin, cur[j])
    }
    if (rowMin > max) return max + 1
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
    cur = []
  }
  return prev[b.length]
}

/** ¿`token` coincide con `target` tolerando errores ortográficos proporcionales a la longitud? */
export function fuzzyEq(token: string, target: string): boolean {
  if (token === target) return true
  // Palabras cortas solo coinciden exactas; las demás toleran typos con la misma inicial
  if (token.length < 5 || target.length < 5 || token[0] !== target[0]) return false
  const max = target.length >= 9 ? 2 : 1
  return editDistance(token, target, max) <= max
}
