"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { companyConfig } from "@/lib/config/company"
import type { Lot } from "@/lib/domain/inventory/types"
import { buildAuditEvent, newCorrelationId } from "@/lib/domain/shared/audit"
import type { DomainError } from "@/lib/domain/shared/result"
import { changeLotQuality, getStore, postMovement } from "./store"
import { requirePermission } from "./session"

export interface ActionResult<T = null> {
  ok: boolean
  value?: T
  error?: DomainError
}

const receiveLotSchema = z.object({
  skuCode: z.string().min(1),
  lotCode: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones"),
  quantity: z.string().regex(/^\d+(\.\d{1,6})?$/, "Cantidad inválida"),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  locationId: z.string().min(1),
  idempotencyKey: z.string().min(8),
})

/** Recepción de lote: crea el lote en cuarentena y publica la entrada en el ledger. */
export async function receiveLotAction(input: unknown): Promise<ActionResult<{ lotCode: string; duplicated: boolean }>> {
  const auth = await requirePermission("inventory.receive")
  if (!auth.ok) return { ok: false, error: auth.error }

  const parsed = receiveLotSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation", message: parsed.error.issues[0]?.message ?? "Datos inválidos" },
    }
  }
  const data = parsed.data
  const store = getStore()
  const sku = [...store.skus.values()].find(
    (s) => s.sku === data.skuCode && s.organizationId === companyConfig.organizationId,
  )
  if (!sku) return { ok: false, error: { code: "not_found", message: `SKU ${data.skuCode} no existe` } }
  if (sku.expiryRequired && !data.expiryDate) {
    return { ok: false, error: { code: "validation", message: "Este SKU exige fecha de caducidad" } }
  }
  if (!store.locations.has(data.locationId)) {
    return { ok: false, error: { code: "not_found", message: "Ubicación no existe" } }
  }

  const lotId = `lot-${data.lotCode.toLowerCase()}`
  const existingLot = store.lots.get(lotId)
  const lot: Lot = existingLot ?? {
    id: lotId,
    organizationId: companyConfig.organizationId,
    skuId: sku.id,
    lotCode: data.lotCode,
    vendorLotCode: null,
    receivedAt: new Date().toISOString().slice(0, 10),
    expiryDate: data.expiryDate,
    // Regla del contexto: lo recibido entra en cuarentena hasta liberación de calidad
    qualityStatus: "quarantine",
  }
  if (existingLot && existingLot.skuId !== sku.id) {
    return { ok: false, error: { code: "conflict", message: `El lote ${data.lotCode} ya existe para otro SKU` } }
  }

  const correlationId = newCorrelationId("recv")
  const result = postMovement(store, {
    organizationId: companyConfig.organizationId,
    type: "receipt",
    skuId: sku.id,
    lotId,
    locationId: data.locationId,
    quantity: data.quantity,
    idempotencyKey: data.idempotencyKey,
    reason: `Recepción de lote ${data.lotCode}`,
    actorId: auth.value.id,
    correlationId,
  })
  if (!result.ok) return { ok: false, error: result.error }

  if (!existingLot && !result.value.duplicated) {
    store.lots.set(lotId, lot)
    store.auditEvents.push(
      buildAuditEvent({
        organizationId: companyConfig.organizationId,
        actorId: auth.value.id,
        actorRole: auth.value.role,
        action: "inventory.receive",
        entityType: "Lot",
        entityId: lotId,
        reason: `Recepción ${data.quantity} pza(s) de ${sku.sku} en ${data.locationId}`,
        correlationId,
      }),
    )
  }
  revalidatePath("/dashboard/inventario-lotes")
  revalidatePath("/dashboard/catalogo")
  return { ok: true, value: { lotCode: data.lotCode, duplicated: result.value.duplicated } }
}

const qualitySchema = z.object({
  lotId: z.string().min(1),
  to: z.enum(["quarantine", "released", "rejected", "blocked"]),
  reason: z.string().min(5, "Indica el motivo (mínimo 5 caracteres)"),
})

/** Liberación/rechazo/bloqueo de lote — exige permiso de calidad y motivo auditado. */
export async function changeLotQualityAction(input: unknown): Promise<ActionResult<{ status: string }>> {
  const parsed = qualitySchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation", message: parsed.error.issues[0]?.message ?? "Datos inválidos" },
    }
  }
  const permission = parsed.data.to === "released" ? "lot.release" : "lot.reject"
  const auth = await requirePermission(permission)
  if (!auth.ok) return { ok: false, error: auth.error }

  const result = changeLotQuality(getStore(), {
    organizationId: companyConfig.organizationId,
    lotId: parsed.data.lotId,
    to: parsed.data.to,
    actorId: auth.value.id,
    actorRole: auth.value.role,
    reason: parsed.data.reason,
  })
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath("/dashboard/inventario-lotes")
  return { ok: true, value: { status: result.value.qualityStatus } }
}
