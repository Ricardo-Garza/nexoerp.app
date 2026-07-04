import { dec, type DecimalString } from "../shared/decimal"
import { err, ok, type Result } from "../shared/result"
import type { Sku } from "../catalog/types"
import type { CommercialConfig, PriceChannel, PriceEntry, PriceList } from "./types"

export interface ResolvedPrice {
  skuId: string
  channel: PriceChannel
  priceListId: string
  priceListCode: string
  unitPrice: DecimalString
  casePrice: DecimalString
  casePriceIsOverride: boolean
  currency: string
  /** Explicación de qué regla aplicó (docs/08: "explicable") */
  explanation: string[]
  /** true si la lista es histórica y no debe presentarse como vigente */
  requiresValidation: boolean
}

function listCoversDate(list: PriceList, onDate: string): boolean {
  if (list.validFrom > onDate) return false
  if (list.validUntil && list.validUntil < onDate) return false
  return true
}

/**
 * Resuelve el precio de un SKU para un canal y fecha:
 * 1. Filtra listas del canal vigentes a la fecha (aprobadas o históricas marcadas).
 * 2. Toma la lista con validFrom más reciente.
 * 3. Deriva precio de caja de piezas por caja, salvo override explícito.
 */
export function resolvePrice(params: {
  sku: Sku
  channel: PriceChannel
  onDate: string
  lists: PriceList[]
  entries: PriceEntry[]
}): Result<ResolvedPrice> {
  const { sku, channel, onDate, lists, entries } = params
  const explanation: string[] = []

  const candidates = lists
    .filter((l) => l.organizationId === sku.organizationId)
    .filter((l) => l.channel === channel)
    .filter((l) => l.status === "approved" || l.status === "historical_requires_validation")
    .filter((l) => listCoversDate(l, onDate))
    .sort((a, b) => (a.validFrom < b.validFrom ? 1 : -1))

  if (candidates.length === 0) {
    return err("not_found", `No hay lista de precios ${channel} vigente al ${onDate} para este SKU`)
  }

  for (const list of candidates) {
    const entry = entries.find((e) => e.priceListId === list.id && e.skuId === sku.id)
    if (!entry) continue

    explanation.push(`Lista aplicada: ${list.name} (${list.code}), vigente desde ${list.validFrom}`)
    if (list.status === "historical_requires_validation") {
      explanation.push("⚠ Lista HISTÓRICA (2025): requiere validación comercial antes de usarse como vigente")
    }

    let casePrice: DecimalString
    let casePriceIsOverride = false
    if (entry.casePriceOverride !== null) {
      casePrice = entry.casePriceOverride
      casePriceIsOverride = true
      explanation.push(`Precio de caja por override explícito de la lista`)
    } else {
      casePrice = dec.mul(entry.unitPrice, sku.unitsPerCase)
      explanation.push(`Precio de caja derivado: ${entry.unitPrice} × ${sku.unitsPerCase} piezas por caja`)
    }

    return ok({
      skuId: sku.id,
      channel,
      priceListId: list.id,
      priceListCode: list.code,
      unitPrice: dec.normalize(entry.unitPrice),
      casePrice,
      casePriceIsOverride,
      currency: list.currency,
      explanation,
      requiresValidation: list.status === "historical_requires_validation",
    })
  }

  return err("not_found", `El SKU ${sku.sku} no tiene precio en ninguna lista ${channel} vigente al ${onDate}`)
}

/**
 * Regla mayorista configurable: el canal Mayoreo aplica solo si el importe de la
 * orden alcanza el mínimo configurado (histórico: MXN 40,000 en una exhibición).
 */
export function qualifiesForWholesale(orderTotalMxn: DecimalString | number, config: CommercialConfig): boolean {
  return dec.cmp(orderTotalMxn, config.wholesaleMinimumOrderMxn) >= 0
}

export function resolveChannelForOrder(
  orderTotalMxn: DecimalString | number,
  config: CommercialConfig,
): { channel: PriceChannel; explanation: string } {
  if (qualifiesForWholesale(orderTotalMxn, config)) {
    return {
      channel: "wholesale",
      explanation: `Importe ${dec.formatMoney(orderTotalMxn)} ≥ mínimo mayoreo ${dec.formatMoney(config.wholesaleMinimumOrderMxn)} (${config.wholesaleRuleStatus === "historical_requires_validation" ? "regla histórica, requiere validación" : "regla aprobada"})`,
    }
  }
  return {
    channel: "retail",
    explanation: `Importe ${dec.formatMoney(orderTotalMxn)} < mínimo mayoreo ${dec.formatMoney(config.wholesaleMinimumOrderMxn)}; aplica Menudeo`,
  }
}

/** Margen (visible solo con permiso price.margin.view; el enforcement vive en la capa server). */
export function computeMarginPct(unitPrice: DecimalString, unitCost: DecimalString): DecimalString | null {
  if (dec.isZero(unitPrice)) return null
  return dec.mul(dec.div(dec.sub(unitPrice, unitCost), unitPrice), 100)
}
