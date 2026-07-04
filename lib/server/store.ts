import "server-only"
import type { Brand, ProductFamily, Sku } from "@/lib/domain/catalog/types"
import type { CommercialConfig, PriceEntry, PriceList } from "@/lib/domain/pricing/types"
import type { InventoryMovement, Lot, StockLocation, Warehouse } from "@/lib/domain/inventory/types"
import type { AuditEvent } from "@/lib/domain/shared/audit"
import { buildAuditEvent } from "@/lib/domain/shared/audit"
import {
  canTransitionLotQuality,
  projectStock,
  validateMovement,
  type PostMovementInput,
} from "@/lib/domain/inventory/ledger"
import { err, ok, type Result } from "@/lib/domain/shared/result"
import { buildDemoLots, buildSeedEntities, type DataQualityIssue } from "@/lib/domain/seed/seed"

/**
 * Puerto de persistencia del dominio DELAR.
 * Adaptador actual: in-memory sembrado idempotentemente (ADR 0002).
 * El adaptador Supabase/Firestore implementará esta misma interfaz.
 */
export interface DomainStore {
  brands: Map<string, Brand>
  families: Map<string, ProductFamily>
  skus: Map<string, Sku>
  priceLists: Map<string, PriceList>
  priceEntries: Map<string, PriceEntry>
  commercialConfig: CommercialConfig
  warehouses: Map<string, Warehouse>
  locations: Map<string, StockLocation>
  lots: Map<string, Lot>
  /** Ledger append-only; clave = idempotencyKey (unicidad garantizada) */
  movements: Map<string, InventoryMovement>
  auditEvents: AuditEvent[]
  dataQualityIssues: DataQualityIssue[]
}

declare global {
  // eslint-disable-next-line no-var
  var __delarStore: DomainStore | undefined
}

function upsert<T extends { id: string }>(map: Map<string, T>, items: T[]) {
  for (const item of items) map.set(item.id, item)
}

/** Seed idempotente: correr N veces deja el mismo estado (upsert por ID natural). */
export function seedStore(store: DomainStore): DomainStore {
  const seed = buildSeedEntities()
  upsert(store.brands, seed.brands)
  upsert(store.families, seed.families)
  upsert(store.skus, seed.skus)
  upsert(store.priceLists, seed.priceLists)
  upsert(store.priceEntries, seed.priceEntries)
  store.commercialConfig = seed.commercialConfig
  upsert(store.warehouses, seed.warehouses)
  upsert(store.locations, seed.locations)
  store.dataQualityIssues = seed.dataQualityIssues

  // Lotes demo + movimientos de recepción con idempotency keys deterministas:
  // re-ejecutar el seed no duplica stock (criterio de aceptación 19).
  for (const { lot, locationId, quantity } of buildDemoLots([...store.skus.values()])) {
    if (!store.lots.has(lot.id)) store.lots.set(lot.id, lot)
    const key = `seed-receipt-${lot.lotCode.toLowerCase()}`
    if (!store.movements.has(key)) {
      store.movements.set(key, {
        id: `mov-${key}`,
        organizationId: lot.organizationId,
        type: "receipt",
        skuId: lot.skuId,
        lotId: lot.id,
        locationId,
        quantity,
        idempotencyKey: key,
        reason: "Seed de demostración (lote sintético)",
        actorId: "system-seed",
        correlationId: `seed-${lot.lotCode.toLowerCase()}`,
        occurredAt: new Date().toISOString(),
        reversesMovementId: null,
      })
    }
  }
  return store
}

export function getStore(): DomainStore {
  if (!globalThis.__delarStore) {
    globalThis.__delarStore = seedStore({
      brands: new Map(),
      families: new Map(),
      skus: new Map(),
      priceLists: new Map(),
      priceEntries: new Map(),
      commercialConfig: undefined as unknown as CommercialConfig,
      warehouses: new Map(),
      locations: new Map(),
      lots: new Map(),
      movements: new Map(),
      auditEvents: [],
      dataQualityIssues: [],
    })
  }
  return globalThis.__delarStore
}

/** Publica un movimiento en el ledger con idempotencia y validación de dominio. */
export function postMovement(
  store: DomainStore,
  input: PostMovementInput,
): Result<{ movement: InventoryMovement; duplicated: boolean }> {
  const existing = store.movements.get(input.idempotencyKey)
  const lot = input.lotId ? (store.lots.get(input.lotId) ?? null) : null
  const stock = projectStock([...store.movements.values()])
  const row = stock.find(
    (r) => r.skuId === input.skuId && r.lotId === input.lotId && r.locationId === input.locationId,
  )
  const validated = validateMovement(input, existing, lot, row?.available ?? "0")
  if (!validated.ok) return { ok: false, error: validated.error }
  if (validated.value === "duplicate") {
    return ok({ movement: existing!, duplicated: true })
  }
  store.movements.set(input.idempotencyKey, validated.value)
  return ok({ movement: validated.value, duplicated: false })
}

/** Cambia el estado de calidad de un lote validando la transición y auditando. */
export function changeLotQuality(
  store: DomainStore,
  params: {
    organizationId: string
    lotId: string
    to: Lot["qualityStatus"]
    actorId: string
    actorRole: string
    reason: string
  },
): Result<Lot> {
  const lot = store.lots.get(params.lotId)
  if (!lot || lot.organizationId !== params.organizationId) {
    return err("not_found", "Lote no encontrado")
  }
  if (!canTransitionLotQuality(lot.qualityStatus, params.to)) {
    return err("state_transition", `Transición de calidad inválida: ${lot.qualityStatus} → ${params.to}`)
  }
  const before = lot.qualityStatus
  const updated: Lot = { ...lot, qualityStatus: params.to }
  store.lots.set(lot.id, updated)
  store.auditEvents.push(
    buildAuditEvent({
      organizationId: params.organizationId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: "lot.quality.change",
      entityType: "Lot",
      entityId: lot.id,
      reason: params.reason,
      changes: { qualityStatus: { before, after: params.to } },
    }),
  )
  return ok(updated)
}

export function appendAudit(store: DomainStore, event: AuditEvent) {
  store.auditEvents.push(event)
}
