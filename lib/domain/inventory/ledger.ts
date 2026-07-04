import { dec, type DecimalString } from "../shared/decimal"
import { err, ok, type Result } from "../shared/result"
import type {
  FefoSuggestion,
  InventoryMovement,
  Lot,
  MovementType,
  StockProjectionRow,
} from "./types"

/** Tipos de movimiento que consumen stock (cantidad debe ser negativa) */
const OUTBOUND: MovementType[] = ["shipment", "transfer_out", "production_issue"]
const INBOUND: MovementType[] = ["receipt", "transfer_in", "production_output"]

export interface PostMovementInput {
  organizationId: string
  type: MovementType
  skuId: string
  lotId: string | null
  locationId: string
  quantity: DecimalString | number
  idempotencyKey: string
  reason?: string | null
  actorId: string
  correlationId: string
  reversesMovementId?: string | null
}

/**
 * Valida y construye un movimiento del ledger. La unicidad de idempotencyKey
 * la garantiza el store (unique constraint); aquí se validan las reglas puras.
 */
export function validateMovement(
  input: PostMovementInput,
  existingWithSameKey: InventoryMovement | undefined,
  lot: Lot | null,
  currentAvailable: DecimalString,
  options?: { allowNegativeStock?: boolean },
): Result<InventoryMovement | "duplicate"> {
  if (existingWithSameKey) {
    // Operación ya aplicada: idempotencia → éxito sin duplicar efecto
    return ok("duplicate")
  }
  const qty = dec.normalize(input.quantity)
  if (dec.isZero(qty)) return err("validation", "La cantidad del movimiento no puede ser cero")

  if (INBOUND.includes(input.type) && !dec.isPositive(qty)) {
    return err("validation", `Un movimiento de tipo ${input.type} debe tener cantidad positiva`)
  }
  if (OUTBOUND.includes(input.type) && dec.isPositive(qty)) {
    return err("validation", `Un movimiento de tipo ${input.type} debe tener cantidad negativa`)
  }

  // Salidas: no permitir stock negativo salvo política explícita
  if (dec.isNegative(qty) && !options?.allowNegativeStock) {
    const resulting = dec.add(currentAvailable, qty)
    if (dec.isNegative(resulting)) {
      return err("insufficient_stock", "Stock disponible insuficiente para el movimiento", {
        available: currentAvailable,
        requested: qty,
      })
    }
  }

  // Salidas de venta/producción: el lote debe ser utilizable
  if ((input.type === "shipment" || input.type === "production_issue" || input.type === "reservation") && lot) {
    const sellable = isLotUsable(lot, new Date().toISOString().slice(0, 10))
    if (!sellable.ok) return { ok: false, error: sellable.error }
  }

  return ok({
    id: `mov-${input.idempotencyKey}`,
    organizationId: input.organizationId,
    type: input.type,
    skuId: input.skuId,
    lotId: input.lotId,
    locationId: input.locationId,
    quantity: qty,
    idempotencyKey: input.idempotencyKey,
    reason: input.reason ?? null,
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: new Date().toISOString(),
    reversesMovementId: input.reversesMovementId ?? null,
  })
}

/** Un lote es utilizable para venta/consumo solo si está liberado y no vencido. */
export function isLotUsable(lot: Lot, onDate: string): Result<true> {
  if (lot.qualityStatus !== "released") {
    const labels: Record<string, string> = {
      pending: "pendiente de inspección",
      quarantine: "en cuarentena",
      rejected: "rechazado por calidad",
      blocked: "bloqueado",
    }
    return err("lot_not_sellable", `El lote ${lot.lotCode} está ${labels[lot.qualityStatus] ?? lot.qualityStatus} y no puede asignarse`)
  }
  if (lot.expiryDate && lot.expiryDate < onDate) {
    return err("lot_not_sellable", `El lote ${lot.lotCode} venció el ${lot.expiryDate}`)
  }
  return ok(true)
}

/** Reconstruye la proyección de stock desde el ledger (fuente de verdad). */
export function projectStock(movements: InventoryMovement[]): StockProjectionRow[] {
  const rows = new Map<string, StockProjectionRow>()
  for (const m of movements) {
    const key = `${m.organizationId}|${m.skuId}|${m.lotId ?? "-"}|${m.locationId}`
    let row = rows.get(key)
    if (!row) {
      row = {
        organizationId: m.organizationId,
        skuId: m.skuId,
        lotId: m.lotId,
        locationId: m.locationId,
        onHand: "0",
        reserved: "0",
        available: "0",
      }
      rows.set(key, row)
    }
    if (m.type === "reservation") {
      row.reserved = dec.add(row.reserved, dec.mul(m.quantity, -1)) // reserva llega negativa
    } else if (m.type === "reservation_release") {
      row.reserved = dec.sub(row.reserved, m.quantity)
    } else {
      row.onHand = dec.add(row.onHand, m.quantity)
    }
    row.available = dec.sub(row.onHand, row.reserved)
  }
  return [...rows.values()]
}

/**
 * FEFO: sugiere lotes por caducidad más próxima, excluyendo lotes no utilizables
 * (vencidos, cuarentena, rechazados, bloqueados, pendientes).
 */
export function suggestFefoAllocation(params: {
  skuId: string
  quantity: DecimalString | number
  onDate: string
  lots: Lot[]
  stock: StockProjectionRow[]
}): Result<FefoSuggestion[]> {
  const { skuId, quantity, onDate, lots, stock } = params
  const needed = dec.normalize(quantity)
  if (!dec.isPositive(needed)) return err("validation", "La cantidad a asignar debe ser positiva")

  const usableLots = lots
    .filter((l) => l.skuId === skuId)
    .filter((l) => isLotUsable(l, onDate).ok)
    .sort((a, b) => {
      // FEFO: caducidad más próxima primero; sin caducidad al final
      if (a.expiryDate === b.expiryDate) return a.lotCode < b.lotCode ? -1 : 1
      if (a.expiryDate === null) return 1
      if (b.expiryDate === null) return -1
      return a.expiryDate < b.expiryDate ? -1 : 1
    })

  const suggestions: FefoSuggestion[] = []
  let remaining = needed
  for (const lot of usableLots) {
    if (!dec.isPositive(remaining)) break
    for (const row of stock.filter((s) => s.lotId === lot.id && dec.isPositive(s.available))) {
      if (!dec.isPositive(remaining)) break
      const take = dec.cmp(row.available, remaining) >= 0 ? remaining : row.available
      suggestions.push({
        lotId: lot.id,
        lotCode: lot.lotCode,
        expiryDate: lot.expiryDate,
        locationId: row.locationId,
        quantity: take,
      })
      remaining = dec.sub(remaining, take)
    }
  }

  if (dec.isPositive(remaining)) {
    return err("insufficient_stock", "Stock utilizable insuficiente para cubrir la cantidad solicitada", {
      requested: needed,
      missing: remaining,
    })
  }
  return ok(suggestions)
}

/** Transiciones válidas del estado de calidad de un lote. */
const QUALITY_TRANSITIONS: Record<string, string[]> = {
  pending: ["quarantine", "released", "rejected", "blocked"],
  quarantine: ["released", "rejected", "blocked"],
  released: ["blocked", "quarantine"],
  blocked: ["quarantine", "released", "rejected"],
  rejected: [],
}

export function canTransitionLotQuality(from: string, to: string): boolean {
  return QUALITY_TRANSITIONS[from]?.includes(to) ?? false
}
