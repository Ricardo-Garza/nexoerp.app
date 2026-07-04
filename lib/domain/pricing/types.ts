import type { DecimalString } from "../shared/decimal"

export type PriceChannel = "retail" | "wholesale"
export type PriceListStatus = "draft" | "approved" | "historical_requires_validation" | "expired"

export interface PriceList {
  id: string
  organizationId: string
  code: string
  name: string
  channel: PriceChannel
  currency: string
  validFrom: string // ISO date
  validUntil: string | null
  status: PriceListStatus
  sourceNote: string
}

export interface PriceEntry {
  id: string
  organizationId: string
  priceListId: string
  skuId: string
  /** Precio unitario por pieza */
  unitPrice: DecimalString
  /**
   * Override explícito de precio por caja. Si es null, el precio de caja se
   * deriva de unitPrice × piezas por caja (regla funcional obligatoria §4).
   */
  casePriceOverride: DecimalString | null
}

/** Configuración comercial parametrizable (nunca hardcode disperso). */
export interface CommercialConfig {
  organizationId: string
  /** Regla histórica: compra mínima en una sola exhibición para acceso a Mayoreo */
  wholesaleMinimumOrderMxn: DecimalString
  wholesaleRuleStatus: "historical_requires_validation" | "approved"
  freeLocalDeliveryMinimumMxn: DecimalString
  deliveryZones: string[]
  deliveryWindow: { start: string; end: string }
  businessDays: string[]
  pickupAddress: string
  pickupHours: { open: string; close: string }
  advanceBusinessDays: number
  timezone: string
  baseCurrency: string
}
