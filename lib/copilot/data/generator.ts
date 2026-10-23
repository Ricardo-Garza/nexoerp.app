/**
 * Generador determinista del dataset DEMO de Soleil Wire.
 *
 * Mismo seed + mismo catálogo → mismo dataset, byte a byte. Sin imports de
 * runtime (solo tipos) para poder ejecutarse también desde Node
 * (`npm run copilot:dataset`).
 *
 * Reglas de negocio que respeta (verificadas en tests/unit/copilot-dataset.test.ts):
 *  - lineTotal = qty × unitPrice − discount
 *  - Cliente → Cotización → Pedido → Factura → Pago (referencias íntegras)
 *  - Proveedor → Orden de compra → Recepción → Movimiento de inventario
 *  - El stock nunca queda negativo en ningún día
 *  - Pedidos cancelados no mueven inventario ni cuentan como venta
 */
import type {
  CatalogInput,
  Currency,
  CustomerArchetype,
  DemoCreditNote,
  DemoCustomer,
  DemoDataset,
  DemoInvoice,
  DemoMovement,
  DemoOpportunity,
  DemoOrder,
  DemoOrderLine,
  DemoPayment,
  DemoProduct,
  DemoPurchaseLine,
  DemoPurchaseOrder,
  DemoQuote,
  DemoSupplier,
  DemoWarehouse,
  IsoDate,
  OpportunityStage,
  OrderStatus,
  PayerProfile,
  QuoteStatus,
  UnitCode,
} from "../types"

export const COPILOT_TENANT_ID = "org-soleilwire"
export const COPILOT_SEED = "soleilwire-demo-v1"
export const COPILOT_REFERENCE_DATE: IsoDate = "2026-10-23"
export const COPILOT_RANGE_START: IsoDate = "2025-04-01"
const OPENING_DATE: IsoDate = "2025-03-31"
const TAX_RATE = 0.16

// ---------- utilidades (sin dependencias) ----------
const DAY_MS = 86_400_000
const toMs = (d: IsoDate) => Date.parse(`${d}T00:00:00Z`)
const fromMs = (ms: number): IsoDate => new Date(ms).toISOString().slice(0, 10)
const addDays = (d: IsoDate, n: number): IsoDate => fromMs(toMs(d) + n * DAY_MS)
const diffDays = (a: IsoDate, b: IsoDate) => Math.round((toMs(a) - toMs(b)) / DAY_MS)
const weekday = (d: IsoDate) => new Date(toMs(d)).getUTCDay() // 0 = domingo
const round2 = (n: number) => Math.round(n * 100) / 100
const pad = (n: number, w: number) => String(n).padStart(w, "0")
const monthIndex = (d: IsoDate) => {
  const [y, m] = d.split("-").map(Number)
  return (y - 2025) * 12 + (m - 1)
}

function seedHash(s: string): number {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^= h >>> 16) >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- catálogos de apoyo (todo ficticio) ----------
const WORDS_A = ["Aurora", "Cumbre", "Delta", "Sierra", "Pacífico", "Norte", "Altiplano", "Horizonte", "Meridiano", "Cobre", "Granito", "Mesa", "Cañón", "Frontera", "Orión", "Vértice", "Zafiro", "Ámbar", "Bahía", "Cordillera", "Estrella", "Monolito", "Faro", "Ribera"]
const WORDS_B = ["del Norte", "Central", "Occidente", "Bajío", "Peninsular", "Andina", "del Valle", "Mexicana", "Integral", "Global"]
const INDUSTRIES: { name: string; prefixes: string[]; fam: Record<string, number> }[] = [
  { name: "Minería", prefixes: ["Minera", "Operadora Minera", "Metales"], fam: { Minería: 5, Armados: 4, "Medio Voltaje": 3, Flexibles: 2, "Control/Potencia": 1.5, "Alta Temperatura": 0.5 } },
  { name: "Construcción e infraestructura", prefixes: ["Constructora", "Ingeniería y Obras"], fam: { Monopolares: 4, "Control/Potencia": 3, Industriales: 3, Aluminio: 2.5, Flexibles: 1 } },
  { name: "Energía renovable", prefixes: ["Solar", "Energías", "Parque Eólico"], fam: { Renovable: 6, Aluminio: 3, "Medio Voltaje": 2, Monopolares: 1.5, Industriales: 1 } },
  { name: "Manufactura", prefixes: ["Industrias", "Manufacturas"], fam: { "Control/Potencia": 3, Flexibles: 3, Instrumentación: 2, Industriales: 2.5, "Norma IEC": 2, "Alta Temperatura": 1.5 } },
  { name: "Petróleo y gas", prefixes: ["Servicios Petroleros", "Energéticos"], fam: { Armados: 4, Instrumentación: 4, "Alta Temperatura": 2.5, "Control/Potencia": 2 } },
  { name: "Distribución eléctrica", prefixes: ["Eléctrica", "Distribuidora Eléctrica"], fam: { Monopolares: 4, Industriales: 4, Aluminio: 3, "Control/Potencia": 3, Flexibles: 2, "Norma IEC": 1 } },
  { name: "Agroindustria y bombeo", prefixes: ["Agroindustrias", "Bombeo y Riego"], fam: { Planos: 5, Flexibles: 3, Monopolares: 2, Industriales: 1.5 } },
  { name: "Automotriz y autopartes", prefixes: ["Autopartes", "Ensambles"], fam: { "Norma IEC": 4, Flexibles: 3, "Control/Potencia": 3, "Alta Temperatura": 2, Instrumentación: 1.5 } },
]
const CITIES: { city: string; state: string; region: "norte" | "centro" | "occidente" }[] = [
  { city: "Monterrey", state: "Nuevo León", region: "norte" },
  { city: "Saltillo", state: "Coahuila", region: "norte" },
  { city: "Chihuahua", state: "Chihuahua", region: "norte" },
  { city: "Hermosillo", state: "Sonora", region: "norte" },
  { city: "Tampico", state: "Tamaulipas", region: "norte" },
  { city: "Ciudad de México", state: "CDMX", region: "centro" },
  { city: "Querétaro", state: "Querétaro", region: "centro" },
  { city: "Puebla", state: "Puebla", region: "centro" },
  { city: "San Luis Potosí", state: "San Luis Potosí", region: "centro" },
  { city: "Guadalajara", state: "Jalisco", region: "occidente" },
  { city: "León", state: "Guanajuato", region: "occidente" },
  { city: "Aguascalientes", state: "Aguascalientes", region: "occidente" },
  { city: "Zacatecas", state: "Zacatecas", region: "occidente" },
]
const WAREHOUSES: DemoWarehouse[] = [
  { id: "ALM-MTY", name: "Almacén Monterrey", city: "Monterrey" },
  { id: "ALM-CDMX", name: "Almacén Ciudad de México", city: "Ciudad de México" },
  { id: "ALM-GDL", name: "Almacén Guadalajara", city: "Guadalajara" },
]
const REGION_WAREHOUSE = { norte: "ALM-MTY", centro: "ALM-CDMX", occidente: "ALM-GDL" } as const
const OWNERS = ["Ejecutivo Norte", "Ejecutivo Centro", "Ejecutivo Occidente", "Ejecutivo Minería", "Ejecutivo Renovables"]
const SUPPLIER_DEFS: { name: string; country: string; lead: number }[] = [
  { name: "Cobre y Polímeros del Norte", country: "México", lead: 14 },
  { name: "Conductores Aurea", country: "México", lead: 12 },
  { name: "Aislantes Técnicos Bajío", country: "México", lead: 15 },
  { name: "Alambres Pacific Rim", country: "Estados Unidos", lead: 25 },
  { name: "Heartland Cable Components", country: "Estados Unidos", lead: 28 },
  { name: "Great Lakes Wire Supply", country: "Estados Unidos", lead: 30 },
  { name: "Kabelwerk Rheinland", country: "Alemania", lead: 45 },
  { name: "Nordic Insulation Systems", country: "Alemania", lead: 42 },
  { name: "Shenghua Copper Industry", country: "China", lead: 55 },
  { name: "Jiangnan Cable Materials", country: "China", lead: 52 },
  { name: "Hindustan Conductors", country: "India", lead: 48 },
  { name: "Aluminio Industrial del Pacífico", country: "México", lead: 18 },
  { name: "Solar Cabling Partners", country: "España", lead: 38 },
  { name: "Termoplásticos Occidente", country: "México", lead: 10 },
  { name: "High-Temp Wire Corp", country: "Estados Unidos", lead: 32 },
  { name: "Instrumentos y Blindajes MX", country: "México", lead: 16 },
  { name: "Minería Cable Source", country: "Canadá", lead: 35 },
  { name: "Fibras y Cubiertas Monterrey", country: "México", lead: 9 },
  { name: "Euro Flex Components", country: "Italia", lead: 44 },
  { name: "Alloy & Armor Supply", country: "Estados Unidos", lead: 27 },
]
const FAMILY_BASE_PRICE: Record<string, number> = { Armados: 180, "Medio Voltaje": 260, Minería: 220, "Control/Potencia": 45, Renovable: 28, Monopolares: 38, "Alta Temperatura": 95, "Norma IEC": 30, Aluminio: 42, Planos: 160, Instrumentación: 55, Flexibles: 35, Industriales: 40 }
const FAMILY_MARGIN: Record<string, [number, number]> = { Armados: [0.24, 0.32], "Medio Voltaje": [0.2, 0.28], Minería: [0.22, 0.3], "Control/Potencia": [0.16, 0.24], Renovable: [0.12, 0.2], Monopolares: [0.14, 0.22], "Alta Temperatura": [0.28, 0.38], "Norma IEC": [0.18, 0.26], Aluminio: [0.12, 0.2], Planos: [0.22, 0.3], Instrumentación: [0.24, 0.32], Flexibles: [0.14, 0.22], Industriales: [0.12, 0.2] }
const GAUGES: { code: string; label: string; factor: number }[] = [
  { code: "14", label: "14 AWG", factor: 0.35 },
  { code: "12", label: "12 AWG", factor: 0.5 },
  { code: "10", label: "10 AWG", factor: 0.75 },
  { code: "8", label: "8 AWG", factor: 1.1 },
  { code: "6", label: "6 AWG", factor: 1.7 },
  { code: "4", label: "4 AWG", factor: 2.6 },
  { code: "2", label: "2 AWG", factor: 4.0 },
  { code: "1-0", label: "1/0 AWG", factor: 6.0 },
  { code: "4-0", label: "4/0 AWG", factor: 11 },
  { code: "350", label: "350 kcmil", factor: 17 },
]
const SEASONALITY = [0.85, 0.95, 1.05, 1.0, 1.1, 1.05, 0.9, 1.0, 1.15, 1.2, 1.1, 0.7] // ene..dic
const LOST_REASONS = ["Precio", "Tiempo de entrega", "Competidor con stock", "Proyecto cancelado", "Especificación no cubierta"]

export function generateSoleilDemoDataset(catalog: CatalogInput[]): DemoDataset {
  const rnd = mulberry32(seedHash(COPILOT_SEED))
  const uniform = (a: number, b: number) => a + (b - a) * rnd()
  const int = (a: number, b: number) => Math.floor(uniform(a, b + 1))
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
  const chance = (p: number) => rnd() < p
  const normal = (mean: number, sd: number) => {
    const u = Math.max(rnd(), 1e-9)
    const v = rnd()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const poisson = (lambda: number) => {
    const L = Math.exp(-lambda)
    let k = 0
    let p = 1
    do {
      k++
      p *= rnd()
    } while (p > L && k < 50)
    return k - 1
  }
  const pickWeighted = <T,>(items: readonly T[], weights: readonly number[]): T => {
    let total = 0
    for (const w of weights) total += w
    let r = rnd() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }
  const shuffle = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  const END = COPILOT_REFERENCE_DATE
  const START = COPILOT_RANGE_START
  const fxOn = (d: IsoDate) => {
    const mi = monthIndex(d)
    const day = Number(d.slice(8, 10))
    return Math.round((17.2 + 0.9 * Math.sin(mi / 3) + 0.04 * Math.sin(day)) * 10000) / 10000
  }

  // ---------- proveedores ----------
  const suppliers: DemoSupplier[] = SUPPLIER_DEFS.map((s, i) => ({ id: `DEMO-PRV-${pad(i + 1, 3)}`, name: s.name, country: s.country, leadDays: s.lead }))
  const supplierByFamily = new Map<string, DemoSupplier[]>()
  const families = [...new Set(catalog.map((c) => c.familia))]
  families.forEach((f, i) => {
    supplierByFamily.set(f, [suppliers[(i * 2) % suppliers.length], suppliers[(i * 2 + 5) % suppliers.length], suppliers[(i * 3 + 1) % suppliers.length]])
  })

  // ---------- productos (variantes por calibre) ----------
  const products: DemoProduct[] = []
  catalog.forEach((base, bi) => {
    const isConnector = /conector/i.test(base.producto)
    const isRollo = base.familia === "Flexibles"
    const variants = isConnector ? 1 : 2 + ((bi * 7 + base.sku.length) % 3 === 0 ? 1 : 0)
    const step = 1 + (bi % 2)
    const startGauge = (bi * 3) % (GAUGES.length - (variants - 1) * step)
    for (let v = 0; v < variants; v++) {
      const gauge = isConnector ? null : GAUGES[startGauge + v * step]
      const unit: UnitCode = isConnector ? "pza" : isRollo ? "rollo" : "m"
      const metersPerUnit = unit === "rollo" ? 100 : unit === "m" ? 1 : 0
      const perMeter = FAMILY_BASE_PRICE[base.familia] * (gauge?.factor ?? 1) * uniform(0.92, 1.08)
      const listPrice = round2(isConnector ? 85 * uniform(0.95, 1.1) : unit === "rollo" ? perMeter * 100 * 0.95 : perMeter)
      const [mLo, mHi] = FAMILY_MARGIN[base.familia] ?? [0.15, 0.25]
      const lowMargin = !isConnector && chance(0.07)
      const margin = lowMargin ? uniform(0.03, 0.08) : uniform(mLo, mHi)
      const supplier = pick(supplierByFamily.get(base.familia)!)
      products.push({
        sku: isConnector ? base.sku : `${base.sku}-${gauge!.code}`,
        baseSku: base.sku,
        family: base.familia,
        name: gauge ? `${base.producto} ${gauge.label}` : base.producto,
        gauge: gauge?.label ?? null,
        unit,
        metersPerUnit,
        listPrice,
        costMxn: round2(listPrice * (1 - margin)),
        minStock: 0,
        supplierId: supplier.id,
        active: true,
      })
    }
  })

  // Roles de comportamiento por SKU
  const skuOrder = shuffle(products.map((p) => p.sku))
  const deadSkus = new Set(skuOrder.slice(0, Math.round(products.length * 0.07)))
  const growingSkus = new Set(skuOrder.slice(deadSkus.size, deadSkus.size + Math.round(products.length * 0.1)))
  const decliningSkus = new Set(skuOrder.slice(deadSkus.size + growingSkus.size, deadSkus.size + growingSkus.size + Math.round(products.length * 0.08)))
  const criticalSkus = new Set(skuOrder.slice(products.length - Math.round(products.length * 0.12)).filter((s) => !deadSkus.has(s)))
  const popularity = new Map<string, number>()
  shuffle([...products]).forEach((p, rank) => popularity.set(p.sku, 1 / Math.pow(rank + 4, 0.85)))
  const productBySku = new Map(products.map((p) => [p.sku, p]))
  const productsByFamily = new Map<string, DemoProduct[]>()
  for (const p of products) {
    if (!productsByFamily.has(p.family)) productsByFamily.set(p.family, [])
    productsByFamily.get(p.family)!.push(p)
  }

  // ---------- clientes ----------
  const archetypePlan: { a: CustomerArchetype; n: number }[] = [
    { a: "estrategico", n: 8 },
    { a: "recurrente", n: 40 },
    { a: "creciente", n: 14 },
    { a: "ocasional", n: 20 },
    { a: "nuevo", n: 16 },
    { a: "inactivo", n: 22 },
  ]
  const archetypes: CustomerArchetype[] = archetypePlan.flatMap((p) => Array(p.n).fill(p.a) as CustomerArchetype[])
  shuffle(archetypes)
  const usedNames = new Set<string>()
  const customers: DemoCustomer[] = []
  const activeWindow = new Map<string, { from: IsoDate; to: IsoDate; rate: number; ramp: boolean }>()
  archetypes.forEach((archetype, i) => {
    const ind = INDUSTRIES[i % INDUSTRIES.length]
    const loc = pick(CITIES)
    let name = ""
    for (let guard = 0; guard < 50; guard++) {
      name = `${pick(ind.prefixes)} ${pick(WORDS_A)} ${pick(WORDS_B)} S.A. de C.V.`
      if (!usedNames.has(name)) break
    }
    usedNames.add(name)
    const segment = archetype === "estrategico" ? "A" : pickWeighted(["A", "B", "C"] as const, archetype === "recurrente" ? [2, 4, 3] : [1, 3, 5])
    const payer: PayerProfile = archetype === "estrategico" ? pickWeighted(["puntual", "lento"] as const, [4, 1]) : pickWeighted(["puntual", "lento", "moroso"] as const, [60, 25, 15])
    const currency: Currency = chance(ind.name === "Minería" || ind.name === "Petróleo y gas" ? 0.3 : 0.1) ? "USD" : "MXN"
    let from = START
    let to = END
    let rate = 0.5
    let ramp = false
    if (archetype === "estrategico") rate = 1.6
    else if (archetype === "recurrente") rate = 0.55
    else if (archetype === "creciente") {
      rate = 1.1
      ramp = true
    } else if (archetype === "ocasional") rate = 0.2
    else if (archetype === "nuevo") {
      from = addDays(END, -int(25, 200))
      rate = 0.55
    } else {
      to = addDays(END, -int(150, 360))
      rate = 0.5
    }
    const creditDays = pick([30, 30, 45, 60])
    const id = `DEMO-CLI-${pad(i + 1, 3)}`
    customers.push({
      id,
      name,
      industry: ind.name,
      city: loc.city,
      state: loc.state,
      region: loc.region,
      segment,
      currency,
      creditDays,
      creditLimit: segment === "A" ? 4_000_000 : segment === "B" ? 1_500_000 : 500_000,
      createdAt: archetype === "nuevo" ? from : addDays(START, -int(30, 900)),
      archetype,
      payer,
    })
    activeWindow.set(id, { from, to, rate, ramp })
  })
  const customerById = new Map(customers.map((c) => [c.id, c]))
  const industryFam = new Map(INDUSTRIES.map((i) => [i.name, i.fam]))

  // ---------- selección de SKU con dinámica temporal ----------
  const endMi = monthIndex(END)
  const skuWeight = (p: DemoProduct, industry: string, date: IsoDate) => {
    if (deadSkus.has(p.sku)) return 0
    const famW = industryFam.get(industry)?.[p.family] ?? 0.25
    const t = Math.min(1, Math.max(0, monthIndex(date) / endMi))
    let dyn = 1
    if (growingSkus.has(p.sku)) dyn = 0.35 + 1.9 * t
    else if (decliningSkus.has(p.sku)) dyn = 1.8 - 1.5 * t
    return (popularity.get(p.sku) ?? 0.01) * famW * dyn
  }
  const buildLine = (p: DemoProduct, customer: DemoCustomer, date: IsoDate, fx: number): DemoOrderLine => {
    const segMul = customer.segment === "A" ? 2.5 : customer.segment === "B" ? 1 : 0.5
    const gaugeFactor = p.gauge ? Math.max(0.15, 1 / Math.sqrt(GAUGES.find((g) => g.label === p.gauge)!.factor)) : 1
    let qty: number
    if (p.unit === "m") qty = Math.max(25, Math.round((normal(450, 220) * segMul * gaugeFactor) / 25) * 25)
    else if (p.unit === "rollo") qty = Math.max(1, Math.round(normal(7, 4) * segMul * gaugeFactor))
    else qty = Math.max(20, Math.round((normal(180, 90) * segMul) / 10) * 10)
    const unitPriceMxn = p.listPrice * uniform(0.97, 1.03)
    const gross = qty * unitPriceMxn
    const discPct = gross >= 100_000 ? uniform(0.08, 0.12) : gross >= 40_000 ? uniform(0.04, 0.07) : chance(0.4) ? uniform(0.01, 0.03) : 0
    const unitPrice = round2(unitPriceMxn / fx)
    const grossDoc = round2(qty * unitPrice)
    const discount = round2(grossDoc * discPct)
    return { sku: p.sku, qty, unit: p.unit, unitPrice, discount, lineTotal: round2(grossDoc - discount), unitCostMxn: p.costMxn }
  }

  // ---------- pedidos ----------
  const orders: DemoOrder[] = []
  const orderIdFor = () => `DEMO-PED-${pad(orders.length + 1, 5)}`
  const businessDaysOfMonth = (y: number, m: number): IsoDate[] => {
    const days: IsoDate[] = []
    const first = `${y}-${pad(m, 2)}-01`
    for (let i = 0; i < 31; i++) {
      const d = addDays(first, i)
      if (Number(d.slice(5, 7)) !== m) break
      if (d >= START && d <= END && weekday(d) !== 0 && weekday(d) !== 6) days.push(d)
    }
    return days
  }
  const monthsList: { y: number; m: number }[] = []
  for (let y = 2025, m = 4; y < 2026 || (y === 2026 && m <= 10); m === 12 ? ((m = 1), y++) : m++) monthsList.push({ y, m })

  const pendingByDate: DemoOrder[] = []
  for (const { y, m } of monthsList) {
    const days = businessDaysOfMonth(y, m)
    if (!days.length) continue
    const mi = (y - 2025) * 12 + (m - 1)
    const season = SEASONALITY[m - 1]
    const trend = 1 + 0.015 * mi
    const partial = days.length / 22
    for (const c of customers) {
      const w = activeWindow.get(c.id)!
      if (w.from > days[days.length - 1] || w.to < days[0]) continue
      let rate = w.rate
      if (w.ramp) rate = 0.2 + 0.9 * (mi / endMi)
      const n = poisson(rate * season * trend * Math.min(1, partial + 0.15))
      for (let k = 0; k < n; k++) {
        const eligible = days.filter((d) => d >= w.from && d <= w.to)
        if (!eligible.length) break
        const date = pick(eligible)
        const fx = c.currency === "USD" ? fxOn(date) : 1
        const nLines = Math.min(8, 1 + poisson(2.1))
        const chosen = new Set<string>()
        const lines: DemoOrderLine[] = []
        const weights = products.map((p) => skuWeight(p, c.industry, date))
        for (let l = 0; l < nLines; l++) {
          const p = pickWeighted(products, weights)
          if (chosen.has(p.sku)) continue
          chosen.add(p.sku)
          lines.push(buildLine(p, c, date, fx))
        }
        const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0))
        pendingByDate.push({ id: "", customerId: c.id, date, status: "Facturado", currency: c.currency, fx, warehouseId: REGION_WAREHOUSE[c.region], quoteId: null, lines, subtotal })
      }
    }
  }
  pendingByDate.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.customerId < b.customerId ? -1 : 1))
  for (const o of pendingByDate) {
    o.id = orderIdFor()
    const age = diffDays(END, o.date)
    if (chance(0.06)) o.status = "Cancelado"
    else if (age <= 3) o.status = "Confirmado"
    else if (age <= 14) o.status = chance(0.5) ? "Surtido" : "Facturado"
    else o.status = chance(0.03) ? "Surtido" : "Facturado"
    orders.push(o)
  }
  const orderById = new Map(orders.map((o) => [o.id, o]))
  const live = (o: DemoOrder) => o.status !== "Cancelado"

  // ---------- facturas, pagos, notas de crédito ----------
  const invoices: DemoInvoice[] = []
  const payments: DemoPayment[] = []
  const creditNotes: DemoCreditNote[] = []
  for (const o of orders) {
    if (o.status !== "Facturado") continue
    const c = customerById.get(o.customerId)!
    const lag = addDays(o.date, int(0, 3))
    const date = lag > END ? END : lag
    const fx = c.currency === "USD" ? fxOn(date) : 1
    const tax = round2(o.subtotal * TAX_RATE)
    const inv: DemoInvoice = {
      id: `DEMO-FAC-${pad(invoices.length + 1, 5)}`,
      orderId: o.id,
      customerId: c.id,
      date,
      dueDate: addDays(date, c.creditDays),
      currency: o.currency,
      fx,
      subtotal: o.subtotal,
      tax,
      total: round2(o.subtotal + tax),
    }
    invoices.push(inv)
  }
  const invoiceById = new Map(invoices.map((i) => [i.id, i]))
  // Notas de crédito (≈4%): devoluciones físicas, ajustes y descuentos. Se emiten antes de los pagos
  // para que ninguna factura quede con saldo negativo.
  for (const inv of invoices) {
    if (!chance(0.04)) continue
    const order = orderById.get(inv.orderId)!
    const reason = pickWeighted(["devolucion", "ajuste_precio", "descuento_posterior"] as const, [5, 3, 2])
    const date = addDays(inv.date, int(5, 40))
    if (date > END) continue
    let subtotal: number
    let costReversalMxn = 0
    const returnLines: DemoCreditNote["returnLines"] = []
    if (reason === "devolucion") {
      const line = pick(order.lines)
      const qty = Math.max(1, Math.round(line.qty * uniform(0.1, 0.5)))
      const unitNet = line.lineTotal / line.qty
      subtotal = round2(unitNet * qty)
      costReversalMxn = round2(line.unitCostMxn * qty)
      returnLines.push({ sku: line.sku, qty, warehouseId: order.warehouseId })
    } else {
      subtotal = round2(inv.subtotal * uniform(0.02, 0.1))
    }
    const tax = round2(subtotal * TAX_RATE)
    const fx = inv.currency === "USD" ? fxOn(date) : 1
    creditNotes.push({ id: `DEMO-NC-${pad(creditNotes.length + 1, 4)}`, invoiceId: inv.id, customerId: inv.customerId, date, reason, currency: inv.currency, fx, subtotal, tax, total: round2(subtotal + tax), costReversalMxn, returnLines })
  }

  // Pagos (sobre el saldo después de notas de crédito)
  const creditByInvoice = new Map(creditNotes.map((n) => [n.invoiceId, n.total]))
  for (const inv of invoices) {
    const payable = round2(inv.total - (creditByInvoice.get(inv.id) ?? 0))
    const c = customerById.get(inv.customerId)!
    const unpaidProb = c.payer === "moroso" ? 0.28 : c.payer === "lento" ? 0.04 : 0.01
    if (chance(unpaidProb)) continue
    const delay = c.payer === "puntual" ? normal(-3, 5) : c.payer === "lento" ? normal(16, 10) : normal(80, 35)
    const payDate = addDays(inv.dueDate, Math.round(delay))
    const method = pickWeighted(["transferencia", "cheque", "compensacion"] as const, [8, 1, 1])
    const mkPayment = (date: IsoDate, amount: number) => {
      if (date > END || date < inv.date) return false
      payments.push({ id: `DEMO-PAG-${pad(payments.length + 1, 5)}`, invoiceId: inv.id, customerId: inv.customerId, date, amount: round2(amount), currency: inv.currency, fx: inv.currency === "USD" ? fxOn(date) : 1, method })
      return true
    }
    if (chance(0.1)) {
      const first = round2(payable * uniform(0.4, 0.7))
      const ok1 = mkPayment(payDate, first)
      if (ok1) mkPayment(addDays(payDate, int(15, 35)), round2(payable - first))
    } else {
      mkPayment(payDate, payable)
    }
  }
  // ---------- cotizaciones y oportunidades ----------
  const quotes: DemoQuote[] = []
  const opportunities: DemoOpportunity[] = []
  const quoteId = () => `DEMO-COT-${pad(quotes.length + 1, 4)}`
  const oppId = () => `DEMO-OPP-${pad(opportunities.length + 1, 4)}`
  const mxn = (amount: number, fx: number) => round2(amount * fx)
  const dominantFamily = (lines: { sku: string }[]) => productBySku.get(lines[0].sku)?.family ?? "Industriales"
  let wonOpps = 0
  for (const o of orders) {
    if (!live(o) || !chance(0.2)) continue
    const qid = quoteId()
    const qDate = addDays(o.date, -int(1, 14))
    const q: DemoQuote = { id: qid, customerId: o.customerId, opportunityId: null, date: qDate < START ? START : qDate, status: "Ganada", currency: o.currency, fx: o.fx, total: o.subtotal, orderId: o.id }
    if (wonOpps < 45 && chance(0.4)) {
      const oid = oppId()
      wonOpps++
      opportunities.push({ id: oid, customerId: o.customerId, name: `Proyecto ${dominantFamily(o.lines)} – ${customerById.get(o.customerId)!.name.split(" S.A.")[0]}`, family: dominantFamily(o.lines), stage: "Ganada", amountMxn: mxn(o.subtotal, o.fx), probability: 100, createdAt: addDays(q.date, -int(5, 30)), expectedClose: o.date, owner: pick(OWNERS), lostReason: null })
      q.opportunityId = oid
    }
    o.quoteId = qid
    quotes.push(q)
  }
  const randomQuoteBody = (c: DemoCustomer, date: IsoDate) => {
    const fx = c.currency === "USD" ? fxOn(date) : 1
    const lines = Array.from({ length: int(1, 4) }, () => buildLine(pickWeighted(products, products.map((p) => skuWeight(p, c.industry, date))), c, date, fx))
    return { fx, lines, total: round2(lines.reduce((s, l) => s + l.lineTotal, 0)) }
  }
  const activeCustomers = customers.filter((c) => c.archetype !== "inactivo")
  // Perdidas (30 con oportunidad perdida + algunas sueltas)
  for (let i = 0; i < 70; i++) {
    const c = pick(customers)
    const date = addDays(START, int(0, diffDays(END, START) - 15))
    const body = randomQuoteBody(c, date)
    const withOpp = i < 30
    const qid = quoteId()
    let oid: string | null = null
    if (withOpp) {
      oid = oppId()
      opportunities.push({ id: oid, customerId: c.id, name: `Proyecto ${dominantFamily(body.lines)} – ${c.name.split(" S.A.")[0]}`, family: dominantFamily(body.lines), stage: "Perdida", amountMxn: mxn(body.total, body.fx), probability: 0, createdAt: addDays(date, -int(5, 20)), expectedClose: addDays(date, int(10, 40)), owner: pick(OWNERS), lostReason: pick(LOST_REASONS) })
    }
    quotes.push({ id: qid, customerId: c.id, opportunityId: oid, date, status: chance(0.8) ? "Perdida" : "Vencida", currency: c.currency, fx: body.fx, total: body.total, orderId: null })
  }
  // Abiertas: 75 oportunidades con etapa y cotización vigente para las avanzadas
  const stages: { s: OpportunityStage; p: number; w: number }[] = [
    { s: "Prospecto", p: 10, w: 3 },
    { s: "Calificada", p: 25, w: 3 },
    { s: "Cotizada", p: 45, w: 2.5 },
    { s: "Negociación", p: 70, w: 2 },
  ]
  for (let i = 0; i < 75; i++) {
    const c = pick(activeCustomers)
    const st = pickWeighted(stages, stages.map((s) => s.w))
    const created = addDays(END, -int(3, 120))
    const amountMxn = Math.round(Math.exp(normal(Math.log(420_000), 0.75)) / 1000) * 1000
    const family = pickWeighted(families, families.map((f) => industryFam.get(c.industry)?.[f] ?? 0.4))
    const oid = oppId()
    opportunities.push({ id: oid, customerId: c.id, name: `Proyecto ${family} – ${c.name.split(" S.A.")[0]}`, family, stage: st.s, amountMxn, probability: st.p, createdAt: created, expectedClose: addDays(END, int(5, 150)), owner: pick(OWNERS), lostReason: null })
    if (st.s === "Cotizada" || st.s === "Negociación") {
      const fx = c.currency === "USD" ? fxOn(created) : 1
      quotes.push({ id: quoteId(), customerId: c.id, opportunityId: oid, date: addDays(created, int(1, 10)) > END ? END : addDays(created, int(1, 10)), status: "Vigente", currency: c.currency, fx, total: round2(amountMxn / fx), orderId: null })
    }
  }
  // Cotizaciones vigentes/vencidas sueltas
  for (let i = 0; i < 30; i++) {
    const c = pick(activeCustomers)
    const date = addDays(END, -int(2, 70))
    const body = randomQuoteBody(c, date)
    quotes.push({ id: quoteId(), customerId: c.id, opportunityId: null, date, status: diffDays(END, date) > 30 ? "Vencida" : "Vigente", currency: c.currency, fx: body.fx, total: body.total, orderId: null })
  }
  quotes.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  quotes.forEach((q, i) => {
    const old = q.id
    q.id = `DEMO-COT-${pad(i + 1, 4)}`
    if (old !== q.id) {
      const o = q.orderId ? orderById.get(q.orderId) : null
      if (o) o.quoteId = q.id
    }
  })
  opportunities.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
  const oppRename = new Map<string, string>()
  opportunities.forEach((o, i) => {
    const nid = `DEMO-OPP-${pad(i + 1, 4)}`
    oppRename.set(o.id, nid)
    o.id = nid
  })
  for (const q of quotes) if (q.opportunityId) q.opportunityId = oppRename.get(q.opportunityId) ?? null

  // ---------- inventario: simulación cronológica ----------
  type Key = string
  const keyOf = (sku: string, wh: string) => `${sku}|${wh}`
  const demand = new Map<Key, number>()
  const lineCount = new Map<Key, number>()
  type Event = { date: IsoDate; kind: "venta" | "devolucion"; sku: string; wh: string; qty: number; ref: string; seq: number }
  const events: Event[] = []
  let seq = 0
  for (const o of orders) {
    if (!live(o)) continue
    for (const l of o.lines) {
      demand.set(keyOf(l.sku, o.warehouseId), (demand.get(keyOf(l.sku, o.warehouseId)) ?? 0) + l.qty)
      lineCount.set(keyOf(l.sku, o.warehouseId), (lineCount.get(keyOf(l.sku, o.warehouseId)) ?? 0) + 1)
      events.push({ date: o.date, kind: "venta", sku: l.sku, wh: o.warehouseId, qty: l.qty, ref: o.id, seq: seq++ })
    }
  }
  for (const n of creditNotes) {
    for (const r of n.returnLines) events.push({ date: n.date, kind: "devolucion", sku: r.sku, wh: r.warehouseId, qty: r.qty, ref: n.id, seq: seq++ })
  }
  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq))
  const spanMonths = diffDays(END, START) / 30.4
  const movements: DemoMovement[] = []
  const moveId = () => `DEMO-MOV-${pad(movements.length + 1, 5)}`
  const supplierById = new Map(suppliers.map((s) => [s.id, s]))
  type Receipt = { sku: string; wh: string; poDate: IsoDate; arrive: IsoDate; qty: number }
  const receipts: Receipt[] = []
  type State = { stock: number; pending: Receipt[]; rate: number; rop: number; lot: number; lead: number; frozenFrom: IsoDate | null }
  const state = new Map<Key, State>()
  const freezeDate = addDays(END, -120)
  const getState = (sku: string, wh: string): State => {
    const key = keyOf(sku, wh)
    let s = state.get(key)
    if (s) return s
    const p = productBySku.get(sku)!
    const d = demand.get(key) ?? 0
    const rate = d / spanMonths
    const avgLine = d / Math.max(1, lineCount.get(key) ?? 1)
    const lead = supplierById.get(p.supplierId)!.leadDays
    const opening = Math.round(Math.max(rate * uniform(2, 4), avgLine * 3))
    s = { stock: opening, pending: [], rate, rop: rate * (lead / 30) * 1.2 + avgLine * 2, lot: Math.max(1, Math.ceil(Math.max(rate * 2, avgLine * 3))), lead, frozenFrom: criticalSkus.has(sku) ? freezeDate : null }
    state.set(key, s)
    if (opening > 0) movements.push({ id: "", date: OPENING_DATE, sku, warehouseId: wh, type: "apertura", qty: opening, unitCostMxn: p.costMxn, refType: "apertura", refId: "APERTURA-2025" })
    return s
  }
  const applyArrivals = (s: State, sku: string, wh: string, upTo: IsoDate) => {
    s.pending.sort((a, b) => (a.arrive < b.arrive ? -1 : 1))
    while (s.pending.length && s.pending[0].arrive <= upTo) {
      const r = s.pending.shift()!
      s.stock += r.qty
      receipts.push(r)
      movements.push({ id: "", date: r.arrive, sku, warehouseId: wh, type: "entrada_compra", qty: r.qty, unitCostMxn: productBySku.get(sku)!.costMxn, refType: "orden_compra", refId: "" })
    }
  }
  // Apertura de SKUs sin demanda (muertos o sin ventas): un solo almacén
  for (const e of events) getState(e.sku, e.wh)
  for (const p of products) {
    if (![...state.keys()].some((k) => k.startsWith(`${p.sku}|`))) {
      const wh = pick(WAREHOUSES).id
      const s: State = { stock: deadSkus.has(p.sku) ? int(300, 3000) : int(100, 1500), pending: [], rate: 0, rop: 0, lot: 0, lead: 30, frozenFrom: START }
      if (p.unit === "rollo") s.stock = Math.max(5, Math.round(s.stock / 60))
      state.set(keyOf(p.sku, wh), s)
      movements.push({ id: "", date: OPENING_DATE, sku: p.sku, warehouseId: wh, type: "apertura", qty: s.stock, unitCostMxn: p.costMxn, refType: "apertura", refId: "APERTURA-2025" })
    }
  }
  for (const e of events) {
    const s = getState(e.sku, e.wh)
    applyArrivals(s, e.sku, e.wh, e.date)
    const p = productBySku.get(e.sku)!
    if (e.kind === "devolucion") {
      s.stock += e.qty
      movements.push({ id: "", date: e.date, sku: e.sku, warehouseId: e.wh, type: "devolucion_cliente", qty: e.qty, unitCostMxn: p.costMxn, refType: "nota_credito", refId: e.ref })
      continue
    }
    if (s.stock < e.qty) {
      const need = e.qty - s.stock + Math.ceil(s.lot * 0.25)
      const spot: Receipt = { sku: e.sku, wh: e.wh, poDate: addDays(e.date, -2), arrive: e.date, qty: need }
      s.stock += need
      receipts.push(spot)
      movements.push({ id: "", date: e.date, sku: e.sku, warehouseId: e.wh, type: "entrada_compra", qty: need, unitCostMxn: p.costMxn, refType: "orden_compra", refId: "" })
    }
    s.stock -= e.qty
    movements.push({ id: "", date: e.date, sku: e.sku, warehouseId: e.wh, type: "salida_venta", qty: -e.qty, unitCostMxn: p.costMxn, refType: "orden_venta", refId: e.ref })
    const pendingQty = s.pending.reduce((a, r) => a + r.qty, 0)
    if ((s.frozenFrom === null || e.date < s.frozenFrom) && s.stock + pendingQty < s.rop) {
      // Las OC se emiten los lunes: agrupa reabastos de la misma semana por proveedor y almacén
      const poDate = addDays(e.date, (8 - weekday(e.date)) % 7 || 7)
      s.pending.push({ sku: e.sku, wh: e.wh, poDate, arrive: addDays(poDate, s.lead), qty: Math.max(1, Math.round(s.lot * uniform(0.9, 1.3))) })
    }
  }
  // Llegadas restantes hasta hoy; las posteriores quedan "En tránsito"
  const inTransit: Receipt[] = []
  for (const [key, s] of state) {
    const [sku, wh] = key.split("|")
    applyArrivals(s, sku, wh, END)
    inTransit.push(...s.pending)
  }
  // Traspasos entre almacenes (cada par suma cero)
  const transferCandidates = [...state.entries()].filter(([, s]) => s.stock > 400)
  let transfers = 0
  for (let attempt = 0; attempt < 80 && transfers < 25 && transferCandidates.length; attempt++) {
    const [key, s] = pick(transferCandidates)
    const [sku, wh] = key.split("|")
    const dest = pick(WAREHOUSES.filter((w) => w.id !== wh)).id
    const qty = Math.max(1, Math.round(s.stock * uniform(0.05, 0.15)))
    const date = addDays(END, -int(10, 200))
    // Solo se registra si el saldo del almacén origen sigue >= 0 en cada día posterior
    const keyMoves = movements.filter((m) => m.sku === sku && m.warehouseId === wh).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    let balance = 0
    let minAfter = Infinity
    let i = 0
    while (i < keyMoves.length) {
      const day = keyMoves[i].date
      while (i < keyMoves.length && keyMoves[i].date === day) balance += keyMoves[i++].qty
      if (day >= date) minAfter = Math.min(minAfter, balance)
    }
    if (!Number.isFinite(minAfter) || minAfter - qty < 0) continue
    transfers++
    const ref = `DEMO-TRS-${pad(transfers, 3)}`
    const unitCostMxn = productBySku.get(sku)!.costMxn
    movements.push({ id: "", date, sku, warehouseId: wh, type: "traspaso_salida", qty: -qty, unitCostMxn, refType: "traspaso", refId: ref })
    movements.push({ id: "", date, sku, warehouseId: dest, type: "traspaso_entrada", qty, unitCostMxn, refType: "traspaso", refId: ref })
    s.stock -= qty
  }

  // ---------- órdenes de compra (agrupa recepciones por proveedor/almacén/fecha) ----------
  const poGroups = new Map<string, { supplierId: string; wh: string; poDate: IsoDate; arrive: IsoDate; lines: DemoPurchaseLine[]; received: boolean }>()
  const addPoLine = (r: Receipt, received: boolean) => {
    const p = productBySku.get(r.sku)!
    const gKey = `${p.supplierId}|${r.wh}|${r.poDate}|${r.arrive}|${received}`
    if (!poGroups.has(gKey)) poGroups.set(gKey, { supplierId: p.supplierId, wh: r.wh, poDate: r.poDate, arrive: r.arrive, lines: [], received })
    const g = poGroups.get(gKey)!
    const ex = g.lines.find((l) => l.sku === r.sku)
    if (ex) ex.qty += r.qty
    else g.lines.push({ sku: r.sku, qty: r.qty, unitCostMxn: p.costMxn })
  }
  for (const r of receipts) addPoLine(r, true)
  for (const r of inTransit) addPoLine(r, false)
  const sortedGroups = [...poGroups.values()].sort((a, b) => (a.poDate < b.poDate ? -1 : a.poDate > b.poDate ? 1 : a.supplierId < b.supplierId ? -1 : a.supplierId > b.supplierId ? 1 : a.wh < b.wh ? -1 : 1))
  const purchaseOrders: DemoPurchaseOrder[] = sortedGroups.map((g, i) => ({
    id: `DEMO-OC-${pad(i + 1, 4)}`,
    supplierId: g.supplierId,
    warehouseId: g.wh,
    date: g.poDate < OPENING_DATE ? OPENING_DATE : g.poDate,
    expectedDate: g.arrive,
    receivedDate: g.received ? g.arrive : null,
    status: g.received ? "Recibida" : "En tránsito",
    lines: g.lines,
  }))
  // Enlaza cada movimiento de entrada con su OC
  const poIndex = new Map<string, string>()
  purchaseOrders.forEach((po) => {
    if (po.status !== "Recibida") return
    for (const l of po.lines) poIndex.set(`${l.sku}|${po.warehouseId}|${po.receivedDate}`, po.id)
  })
  for (const m of movements) if (m.type === "entrada_compra") m.refId = poIndex.get(`${m.sku}|${m.warehouseId}|${m.date}`) ?? "OC-SPOT"

  // ---------- mínimos de stock según el estado final ----------
  const finalStock = new Map<string, number>()
  for (const m of movements) finalStock.set(m.sku, (finalStock.get(m.sku) ?? 0) + m.qty)
  const demandBySku = new Map<string, number>()
  for (const [k, d] of demand) {
    const sku = k.split("|")[0]
    demandBySku.set(sku, (demandBySku.get(sku) ?? 0) + d)
  }
  for (const p of products) {
    const fin = finalStock.get(p.sku) ?? 0
    const monthly = (demandBySku.get(p.sku) ?? 0) / spanMonths
    if (criticalSkus.has(p.sku) && (demandBySku.get(p.sku) ?? 0) > 0) p.minStock = Math.max(Math.ceil(fin / uniform(0.4, 0.8)), Math.ceil(monthly * 0.8), p.unit === "rollo" ? 3 : 20)
    else if (deadSkus.has(p.sku)) p.minStock = Math.max(1, Math.floor(fin / uniform(2, 5)))
    else p.minStock = Math.max(1, Math.floor(Math.min(fin / uniform(1.3, 2.6), Math.max(monthly * 1.2, 1))))
  }

  // ---------- ajustes menores y normalización de movimientos ----------
  movements.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.sku < b.sku ? -1 : a.sku > b.sku ? 1 : 0))
  movements.forEach((m, i) => (m.id = `DEMO-MOV-${pad(i + 1, 5)}`))

  return {
    meta: {
      tenantId: COPILOT_TENANT_ID,
      isDemo: true,
      seed: COPILOT_SEED,
      schemaVersion: 1,
      referenceDate: COPILOT_REFERENCE_DATE,
      rangeStart: COPILOT_RANGE_START,
      disclaimer:
        "DATOS SIMULADOS para demostración. Solo familias y nombres base de producto provienen del catálogo público de soleilwire.net; clientes, precios, costos, ventas, stock y CRM son ficticios.",
    },
    customers,
    suppliers,
    warehouses: WAREHOUSES,
    products,
    quotes,
    opportunities,
    orders,
    invoices,
    payments,
    creditNotes,
    purchaseOrders,
    movements,
  }
}
