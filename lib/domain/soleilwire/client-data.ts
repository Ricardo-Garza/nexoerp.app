"use client"

import { readImportedData } from "@/lib/platform/tenant-store"
import {
  SOLEIL_TENANT_ID,
  getSoleilInventory,
  getSoleilPriceEntries,
  getSoleilProducts,
  type SoleilInventoryRow,
  type SoleilPriceEntry,
  type SoleilProduct,
} from "./index"

/**
 * Datos vivos del módulo combinado en el navegador: seed determinista (solo
 * para la empresa Soleil Wire; otras empresas parten vacías) + filas del
 * Centro de Importación + capturas manuales. El seed nunca se muta; lo
 * importado/capturado gana por clave natural (SKU, SKU+lista, SKU+almacén+serie).
 */

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return null
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

/** Fila importada por la plantilla "productos" → producto Soleil. */
function importedRowToProduct(row: Record<string, unknown>): SoleilProduct | null {
  const sku = asString(row.sku)
  if (!sku) return null
  return {
    sku,
    familia: asString(row.categoria) ?? asString(row.familia) ?? "Sin familia",
    subfamilia: asString(row.subfamilia),
    producto: asString(row.nombre) ?? asString(row.producto) ?? sku,
    descripcion: asString(row.descripcion),
    voltaje: asString(row.voltaje),
    conductores: asNumber(row.conductores),
    material: asString(row.material),
    aislamiento: asString(row.aislamiento),
    chaquetaArmadura: asString(row.chaquetaArmadura),
    norma: asString(row.norma),
    usoAplicacion: asString(row.usoAplicacion) ?? asString(row.aplicacion),
    unidadVenta: asString(row.unidad) ?? asString(row.unidadVenta) ?? "m",
    moneda: asString(row.moneda) ?? "MXN",
    precioBase: asNumber(row.precio) ?? asNumber(row.precioBase),
    precioMayoreo: asNumber(row.precioMayoreo),
    costoEstimado: asNumber(row.costo) ?? asNumber(row.costoEstimado),
    stockInicial: asNumber(row.stockInicial),
    stockMinimo: asNumber(row.stockMinimo),
    tiempoEntregaDias: asNumber(row.tiempoEntregaDias),
    proveedor: asString(row.proveedor),
    imagenId: asString(row.imagenId),
    activo: row.activo === false || row.activo === "inactivo" ? false : true,
    notas: asString(row.notas),
  }
}

/** Fila importada por la plantilla "precios" → entrada de lista Soleil. */
function importedRowToPriceEntry(row: Record<string, unknown>): SoleilPriceEntry | null {
  const sku = asString(row.sku)
  if (!sku) return null
  return {
    sku,
    lista: asString(row.lista) ?? "SOLEIL-BASE-2027",
    canal: asString(row.canal) ?? "General",
    moneda: asString(row.moneda) ?? "MXN",
    precioUnitario: asNumber(row.precioUnitario) ?? asNumber(row.precio),
    unidad: asString(row.unidad) ?? "m",
    precioMayoreo: asNumber(row.precioMayoreo),
    cantidadMinMayoreo: asNumber(row.cantidadMinMayoreo),
    vigenciaInicio: asString(row.vigenciaDesde) ?? asString(row.vigenciaInicio),
    vigenciaFin: asString(row.vigenciaFin),
    activo: row.activo === false ? false : true,
    notas: asString(row.notas),
  }
}

/** Fila importada por la plantilla "inventario-inicial" → existencia Soleil. */
function importedRowToInventory(row: Record<string, unknown>): SoleilInventoryRow | null {
  const sku = asString(row.sku)
  if (!sku) return null
  return {
    sku,
    almacen: asString(row.almacen) ?? "Principal",
    ubicacion: asString(row.ubicacion),
    loteSerie: asString(row.lote) ?? asString(row.loteSerie) ?? asString(row.bobina),
    cantidadDisponible: asNumber(row.cantidad) ?? asNumber(row.cantidadDisponible),
    unidad: asString(row.unidad) ?? "m",
    estado: asString(row.estado) ?? "Disponible",
    fechaEntrada: asString(row.fechaEntrada),
    fechaCaducidad: asString(row.caducidad) ?? asString(row.fechaCaducidad),
    proveedor: asString(row.proveedor),
    costoUnitario: asNumber(row.costoUnitario),
    notas: asString(row.notas),
  }
}

export function loadSoleilProducts(tenantId: string): SoleilProduct[] {
  const seedProducts = tenantId === SOLEIL_TENANT_ID ? getSoleilProducts() : []
  const bySku = new Map(seedProducts.map((p) => [p.sku, p]))
  for (const raw of readImportedData(tenantId, "products")) {
    const product = importedRowToProduct(raw)
    if (!product) continue
    const existing = bySku.get(product.sku)
    bySku.set(product.sku, existing ? { ...existing, ...withoutNulls(product) } : product)
  }
  return [...bySku.values()]
}

export function loadSoleilPriceEntries(tenantId: string): SoleilPriceEntry[] {
  const seedEntries = tenantId === SOLEIL_TENANT_ID ? getSoleilPriceEntries() : []
  const byKey = new Map(seedEntries.map((e) => [`${e.sku}::${e.lista}`, e]))
  for (const raw of readImportedData(tenantId, "priceEntries")) {
    const entry = importedRowToPriceEntry(raw)
    if (!entry) continue
    const key = `${entry.sku}::${entry.lista}`
    const existing = byKey.get(key)
    byKey.set(key, existing ? { ...existing, ...withoutNulls(entry) } : entry)
  }
  return [...byKey.values()]
}

export function loadSoleilInventory(tenantId: string): SoleilInventoryRow[] {
  const seedInventory = tenantId === SOLEIL_TENANT_ID ? getSoleilInventory() : []
  const byKey = new Map(
    seedInventory.map((r) => [`${r.sku}::${r.almacen}::${r.loteSerie ?? ""}`, r]),
  )
  for (const raw of readImportedData(tenantId, "inventoryStock")) {
    const row = importedRowToInventory(raw)
    if (!row) continue
    const key = `${row.sku}::${row.almacen}::${row.loteSerie ?? ""}`
    const existing = byKey.get(key)
    byKey.set(key, existing ? { ...existing, ...withoutNulls(row) } : row)
  }
  return [...byKey.values()]
}

/** Movimientos de inventario registrados en la app (entradas/salidas/ajustes…). */
export type SoleilMovementType =
  | "entrada"
  | "salida"
  | "transferencia"
  | "ajuste"
  | "apartado"
  | "liberacion"

export interface SoleilStockMovement {
  id?: string
  sku: string
  tipo: SoleilMovementType
  cantidad: number
  unidad: string
  almacen: string
  almacenDestino?: string | null
  loteSerie?: string | null
  motivo?: string | null
  actorEmail: string
  at: string
}

export function loadSoleilMovements(tenantId: string): SoleilStockMovement[] {
  const rows = readImportedData(tenantId, "stockMovements")
  const movements: SoleilStockMovement[] = []
  for (const raw of rows) {
    const sku = asString(raw.sku)
    const tipo = asString(raw.tipo) as SoleilMovementType | null
    const cantidad = asNumber(raw.cantidad)
    if (!sku || !tipo || cantidad === null) continue
    movements.push({
      id: asString(raw.id) ?? undefined,
      sku,
      tipo,
      cantidad,
      unidad: asString(raw.unidad) ?? "m",
      almacen: asString(raw.almacen) ?? "Principal",
      almacenDestino: asString(raw.almacenDestino),
      loteSerie: asString(raw.loteSerie),
      motivo: asString(raw.motivo),
      actorEmail: asString(raw.actorEmail) ?? "sistema",
      at: asString(raw.at) ?? asString(raw.createdAt) ?? new Date().toISOString(),
    })
  }
  return movements.sort((a, b) => (a.at < b.at ? 1 : -1))
}

/** Posición de existencias por SKU + almacén + bobina/serie tras aplicar movimientos. */
export interface SoleilStockPosition {
  key: string
  sku: string
  almacen: string
  ubicacion: string | null
  loteSerie: string | null
  unidad: string
  disponible: number
  apartado: number
  enTransito: number
  capturado: boolean
  ultimoMovimiento: SoleilStockMovement | null
}

export function buildStockPositions(
  inventory: SoleilInventoryRow[],
  movements: SoleilStockMovement[],
): SoleilStockPosition[] {
  const positions = new Map<string, SoleilStockPosition>()
  const ensure = (sku: string, almacen: string, loteSerie: string | null, unidad: string): SoleilStockPosition => {
    const key = `${sku}::${almacen}::${loteSerie ?? ""}`
    let pos = positions.get(key)
    if (!pos) {
      pos = {
        key,
        sku,
        almacen,
        ubicacion: null,
        loteSerie,
        unidad,
        disponible: 0,
        apartado: 0,
        enTransito: 0,
        capturado: false,
        ultimoMovimiento: null,
      }
      positions.set(key, pos)
    }
    return pos
  }

  for (const row of inventory) {
    const pos = ensure(row.sku, row.almacen, row.loteSerie, row.unidad)
    pos.ubicacion = row.ubicacion
    if (row.cantidadDisponible !== null) {
      pos.disponible += row.cantidadDisponible
      pos.capturado = true
    }
  }

  // Los movimientos vienen ordenados del más reciente al más antiguo; se
  // aplican en orden cronológico para que la posición final sea correcta.
  for (const mov of [...movements].reverse()) {
    const pos = ensure(mov.sku, mov.almacen, mov.loteSerie ?? null, mov.unidad)
    pos.capturado = true
    pos.ultimoMovimiento = mov
    switch (mov.tipo) {
      case "entrada":
        pos.disponible += mov.cantidad
        break
      case "salida":
        pos.disponible -= mov.cantidad
        break
      case "ajuste":
        pos.disponible += mov.cantidad
        break
      case "apartado":
        pos.disponible -= mov.cantidad
        pos.apartado += mov.cantidad
        break
      case "liberacion":
        pos.disponible += mov.cantidad
        pos.apartado -= mov.cantidad
        break
      case "transferencia": {
        pos.disponible -= mov.cantidad
        if (mov.almacenDestino) {
          const dest = ensure(mov.sku, mov.almacenDestino, mov.loteSerie ?? null, mov.unidad)
          dest.disponible += mov.cantidad
          dest.capturado = true
          dest.ultimoMovimiento = mov
        }
        break
      }
    }
  }

  return [...positions.values()]
}

function withoutNulls<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) (out as Record<string, unknown>)[k] = v
  }
  return out
}
