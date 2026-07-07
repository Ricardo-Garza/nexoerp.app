import soleilSeed from "./soleil-seed.json"

/**
 * Dominio de Soleil Wire (distribución de cables especiales).
 *
 * El seed se genera de forma determinista desde
 * `project-context/soleilwire/data` (script en scripts/, mismo CSV → mismo
 * JSON). Regla dura: no se inventan precios ni clientes reales; los campos sin
 * dato vienen `null` y la UI los muestra como pendientes de captura.
 */

export const SOLEIL_TENANT_ID = "org-soleilwire"

export interface SoleilProduct {
  sku: string
  familia: string
  subfamilia: string | null
  producto: string
  descripcion: string | null
  voltaje: string | null
  conductores: number | null
  material: string | null
  aislamiento: string | null
  chaquetaArmadura: string | null
  norma: string | null
  usoAplicacion: string | null
  unidadVenta: string
  moneda: string
  precioBase: number | null
  precioMayoreo: number | null
  costoEstimado: number | null
  stockInicial: number | null
  stockMinimo: number | null
  tiempoEntregaDias: number | null
  proveedor: string | null
  imagenId: string | null
  activo: boolean
  notas: string | null
}

export interface SoleilPriceEntry {
  sku: string
  lista: string
  canal: string | null
  moneda: string
  precioUnitario: number | null
  unidad: string
  precioMayoreo: number | null
  cantidadMinMayoreo: number | null
  vigenciaInicio: string | null
  vigenciaFin: string | null
  activo: boolean
  notas: string | null
}

export interface SoleilClient {
  tipo: string | null
  razonSocial: string | null
  nombreComercial: string | null
  rfc: string | null
  contactoPrincipal: string | null
  correo: string | null
  telefono: string | null
  whatsapp: string | null
  ciudad: string | null
  estado: string | null
  industria: string | null
  estatus: string | null
  limiteCredito: number | null
  diasCredito: number | null
  origen: string | null
  notas: string | null
}

export interface SoleilOpportunity {
  oportunidad: string
  cliente: string | null
  contacto: string | null
  familiaInteres: string | null
  productoInteres: string | null
  cantidadEstimada: number | null
  unidad: string | null
  montoEstimado: number | null
  etapa: string | null
  probabilidad: number | null
  fechaCierreEstimada: string | null
  responsable: string | null
  origen: string | null
  notas: string | null
}

export interface SoleilInventoryRow {
  sku: string
  almacen: string
  ubicacion: string | null
  loteSerie: string | null
  cantidadDisponible: number | null
  unidad: string
  estado: string
  fechaEntrada: string | null
  fechaCaducidad: string | null
  proveedor: string | null
  costoUnitario: number | null
  notas: string | null
}

export interface SoleilFamily {
  nombre: string
  imagenId: string | null
  productos: number
}

export interface SoleilSeed {
  empresa: string
  listaPrecios: { id: string; nombre: string; moneda: string; estado: string }
  familias: SoleilFamily[]
  productos: SoleilProduct[]
  preciosEntradas: SoleilPriceEntry[]
  clientesDemo: SoleilClient[]
  oportunidadesDemo: SoleilOpportunity[]
  inventarioInicial: SoleilInventoryRow[]
  imagenesReferencia: { id: string; file: string; slug: string; descripcion: string | null }[]
}

const seed = soleilSeed as unknown as SoleilSeed

export function getSoleilSeed(): SoleilSeed {
  return seed
}

export function getSoleilProducts(): SoleilProduct[] {
  return seed.productos
}

export function getSoleilFamilies(): SoleilFamily[] {
  return seed.familias
}

export function getSoleilPriceEntries(): SoleilPriceEntry[] {
  return seed.preciosEntradas
}

export function getSoleilClients(): SoleilClient[] {
  return seed.clientesDemo
}

export function getSoleilOpportunities(): SoleilOpportunity[] {
  return seed.oportunidadesDemo
}

export function getSoleilInventory(): SoleilInventoryRow[] {
  return seed.inventarioInicial
}

/** Resumen honesto para indicadores: cuenta lo capturado, no inventa montos. */
export interface SoleilIndicatorSummary {
  productosActivos: number
  productosSinPrecio: number
  familias: number
  oportunidadesAbiertas: number
  clientesDemo: number
  skusConStockCapturado: number
  skusStockBajo: number
  metrosDisponibles: number
}

export function buildSoleilIndicatorSummary(
  products: SoleilProduct[] = seed.productos,
  priceEntries: SoleilPriceEntry[] = seed.preciosEntradas,
  inventory: SoleilInventoryRow[] = seed.inventarioInicial,
  opportunities: SoleilOpportunity[] = seed.oportunidadesDemo,
): SoleilIndicatorSummary {
  const priceBySku = new Map(priceEntries.map((p) => [p.sku, p]))
  const hasPrice = (p: SoleilProduct) =>
    p.precioBase !== null || (priceBySku.get(p.sku)?.precioUnitario ?? null) !== null
  const stockBySku = new Map<string, number>()
  for (const row of inventory) {
    if (row.cantidadDisponible === null) continue
    stockBySku.set(row.sku, (stockBySku.get(row.sku) ?? 0) + row.cantidadDisponible)
  }
  const minBySku = new Map(products.map((p) => [p.sku, p.stockMinimo]))
  let skusStockBajo = 0
  for (const [sku, qty] of stockBySku) {
    const min = minBySku.get(sku)
    if (min !== null && min !== undefined && qty < min) skusStockBajo++
  }
  return {
    productosActivos: products.filter((p) => p.activo).length,
    productosSinPrecio: products.filter((p) => p.activo && !hasPrice(p)).length,
    familias: new Set(products.map((p) => p.familia)).size,
    oportunidadesAbiertas: opportunities.filter((o) => (o.etapa ?? "").toLowerCase() !== "ganada" && (o.etapa ?? "").toLowerCase() !== "perdida").length,
    clientesDemo: seed.clientesDemo.length,
    skusConStockCapturado: stockBySku.size,
    skusStockBajo,
    metrosDisponibles: [...stockBySku.values()].reduce((a, b) => a + b, 0),
  }
}
