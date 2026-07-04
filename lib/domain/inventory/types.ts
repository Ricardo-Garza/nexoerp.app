import type { DecimalString } from "../shared/decimal"

export interface Warehouse {
  id: string
  organizationId: string
  code: string
  name: string
  address: string | null
  active: boolean
}

export interface StockLocation {
  id: string
  organizationId: string
  warehouseId: string
  code: string
  name: string
  kind: "storage" | "receiving" | "quarantine" | "shipping"
}

/** Estados de calidad del lote (docs/04). Solo "released" es vendible. */
export type LotQualityStatus = "pending" | "quarantine" | "released" | "rejected" | "blocked"

export interface Lot {
  id: string
  organizationId: string
  skuId: string
  lotCode: string
  vendorLotCode: string | null
  receivedAt: string // ISO date
  expiryDate: string | null // ISO date; obligatorio si el SKU exige caducidad
  qualityStatus: LotQualityStatus
}

export type MovementType =
  | "receipt"
  | "shipment"
  | "transfer_in"
  | "transfer_out"
  | "adjustment"
  | "reservation"
  | "reservation_release"
  | "production_issue"
  | "production_output"

/**
 * Movimiento del ledger. INMUTABLE: nunca se edita ni borra; una reversa es
 * otro movimiento compensatorio (invariante 2 del modelo de dominio).
 */
export interface InventoryMovement {
  id: string
  organizationId: string
  type: MovementType
  skuId: string
  lotId: string | null
  locationId: string
  /** Cantidad en UOM base del SKU; positiva entra, negativa sale */
  quantity: DecimalString
  /** Clave de idempotencia única por operación de negocio */
  idempotencyKey: string
  reason: string | null
  actorId: string
  correlationId: string
  occurredAt: string // ISO UTC
  /** Movimiento que compensa (para reversas) */
  reversesMovementId: string | null
}

/** Proyección reconstruible del ledger; nunca se edita a mano. */
export interface StockProjectionRow {
  organizationId: string
  skuId: string
  lotId: string | null
  locationId: string
  onHand: DecimalString
  reserved: DecimalString
  available: DecimalString
}

export interface FefoSuggestion {
  lotId: string
  lotCode: string
  expiryDate: string | null
  locationId: string
  quantity: DecimalString
}
