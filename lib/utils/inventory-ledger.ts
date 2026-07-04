import type { StockMovement, InventoryStock } from "@/lib/types"
import { asDate } from "@/lib/utils/dates"
import { Timestamp } from "firebase/firestore"

/**
 * Calculate current inventory balance from movement ledger
 * Groups by almacenId + productoId + lote
 */
export function calculateInventoryFromLedger(
  movements: StockMovement[],
  almacenId?: string,
  productoId?: string,
  lote?: string | null,
): InventoryStock[] {
  // Group movements by almacen + producto + lote
  const groups = new Map<string, StockMovement[]>()

  movements.forEach((movement) => {
    // Filter if criteria provided
    if (almacenId && movement.almacenId !== almacenId) return
    if (productoId && movement.productoId !== productoId) return
    if (lote !== undefined && movement.lote !== lote) return

    const key = `${movement.almacenId}|${movement.productoId}|${movement.lote || "NO_LOTE"}`

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(movement)
  })

  // Calculate balance for each group
  const stocks: InventoryStock[] = []

  groups.forEach((movs, key) => {
    const [almacenId, productoId, loteKey] = key.split("|")
    const lote = loteKey === "NO_LOTE" ? null : loteKey

    // Sort by date
    const sorted = [...movs].sort((a, b) => {
      const dateA = a.fecha instanceof Timestamp ? a.fecha.toDate() : new Date(a.fecha as string)
      const dateB = b.fecha instanceof Timestamp ? b.fecha.toDate() : new Date(b.fecha as string)
      return dateA.getTime() - dateB.getTime()
    })

    // Calculate final quantity and weighted average cost
    let cantidadActual = 0
    let costoTotalAcumulado = 0

    sorted.forEach((mov) => {
      if (
        mov.tipo === "entrada" ||
        mov.tipo === "recepcion_compra" ||
        mov.tipo === "transferencia_entrada" ||
        mov.tipo === "devolucion_venta" ||
        mov.tipo === "produccion_salida"
      ) {
        cantidadActual += mov.cantidad
        costoTotalAcumulado += mov.costoTotal || mov.cantidad * mov.costoUnitario
      } else if (
        mov.tipo === "salida" ||
        mov.tipo === "venta" ||
        mov.tipo === "transferencia_salida" ||
        mov.tipo === "devolucion_compra" ||
        mov.tipo === "produccion_consumo"
      ) {
        cantidadActual -= mov.cantidad
      } else if (mov.tipo === "ajuste") {
        // Adjustment sets absolute quantity
        const diff = mov.cantidad - cantidadActual
        cantidadActual = mov.cantidad
        if (diff > 0) {
          costoTotalAcumulado += diff * mov.costoUnitario
        }
      }
    })

    const costoPromedio = cantidadActual > 0 ? costoTotalAcumulado / cantidadActual : 0
    const lastMov = sorted[sorted.length - 1]

    stocks.push({
      id: key,
      almacenId,
      almacenNombre: lastMov.almacenNombre,
      productoId,
      productoNombre: lastMov.productoNombre,
      sku: lastMov.sku,
      unidadBase: lastMov.unidadBase,
      lote: lote,
      serie: lastMov.serie || null,
      fechaCaducidad: lastMov.fechaCaducidad || null,
      cantidadActual,
      cantidadDisponible: cantidadActual, // TODO: Subtract reserved from sales orders
      cantidadReservada: 0,
      cantidadEnTransito: 0,
      costoPromedio,
      metodoValuacion: "promedio",
      valorTotal: cantidadActual * costoPromedio,
      ultimaActualizacion: lastMov.fecha,
      companyId: lastMov.companyId,
      userId: lastMov.userId,
      createdAt: sorted[0].createdAt,
      updatedAt: lastMov.updatedAt,
    } as InventoryStock)
  })

  return stocks.filter((s) => s.cantidadActual > 0) // Only return positive balances
}

/**
 * FIFO lot selection for sales fulfillment
 * Returns lots to pick from oldest to newest
 */
export function selectLotsFIFO(
  movements: StockMovement[],
  almacenId: string,
  productoId: string,
  cantidadRequerida: number,
): Array<{ lote: string | null; cantidad: number; costoUnitario: number; fechaCaducidad?: string }> {
  // Get all stock for this product in this warehouse
  const stocks = calculateInventoryFromLedger(movements, almacenId, productoId)

  // Sort by expiry date (FEFO - First Expired First Out) or entry date
  const sorted = stocks.sort((a, b) => {
    if (a.fechaCaducidad && b.fechaCaducidad) {
      const dateA =
        a.fechaCaducidad instanceof Timestamp ? a.fechaCaducidad.toDate() : new Date(a.fechaCaducidad as string)
      const dateB =
        b.fechaCaducidad instanceof Timestamp ? b.fechaCaducidad.toDate() : new Date(b.fechaCaducidad as string)
      return dateA.getTime() - dateB.getTime()
    }
    // No expiry, sort by creation date (FIFO)
    const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : asDate(a.createdAt)
    const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : asDate(b.createdAt)
    return dateA.getTime() - dateB.getTime()
  })

  // Pick lots until we have enough quantity
  const selected: Array<{ lote: string | null; cantidad: number; costoUnitario: number; fechaCaducidad?: string }> = []
  let remaining = cantidadRequerida

  for (const stock of sorted) {
    if (remaining <= 0) break

    const toTake = Math.min(stock.cantidadDisponible, remaining)
    selected.push({
      lote: stock.lote ?? null,
      cantidad: toTake,
      costoUnitario: stock.costoPromedio,
      fechaCaducidad: stock.fechaCaducidad
        ? stock.fechaCaducidad instanceof Timestamp
          ? stock.fechaCaducidad.toDate().toISOString()
          : (stock.fechaCaducidad as string)
        : undefined,
    })

    remaining -= toTake
  }

  if (remaining > 0) {
    throw new Error(`Inventario insuficiente. Faltante: ${remaining} unidades`)
  }

  return selected
}

/**
 * Convert purchase units to base units
 */
export function convertToBaseUnits(cantidadCompra: number, unidadesPorEmpaque: number): number {
  return cantidadCompra * unidadesPorEmpaque
}

/**
 * Convert base units to purchase units
 */
export function convertToPurchaseUnits(cantidadBase: number, unidadesPorEmpaque: number): number {
  return cantidadBase / unidadesPorEmpaque
}

/**
 * Calculate cost per base unit from purchase price
 */
export function calculateCostPerBaseUnit(
  precioCompraTotal: number,
  cantidadCompra: number,
  unidadesPorEmpaque: number,
): number {
  const cantidadBase = convertToBaseUnits(cantidadCompra, unidadesPorEmpaque)
  return precioCompraTotal / cantidadBase
}
