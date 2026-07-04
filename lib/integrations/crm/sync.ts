import { newCorrelationId } from "@/lib/domain/shared/audit"
import type { CrmSyncPort } from "./port"
import type { CrmOutboxEvent, ExternalIdMapping, SyncSummary } from "./types"

/**
 * Motor de sincronización CRM → ERP con deduplicación e idempotencia.
 * Estado (mapeos/outbox) se pasa explícitamente: la persistencia la aporta
 * el DomainStore hoy y PostgreSQL cuando exista el adaptador durable.
 */

export interface ErpCustomerDraft {
  organizationId: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  crmExternalId: string
}

function normalizeKey(email: string | null, phone: string | null, name: string): string {
  if (email) return `email:${email.trim().toLowerCase()}`
  if (phone) return `phone:${phone.replace(/\D/g, "")}`
  return `name:${name.trim().toLowerCase()}`
}

/**
 * Trae contactos del CRM y los convierte en borradores de cliente ERP:
 * - dedupe por email → teléfono → nombre normalizado;
 * - idempotente: contactos ya mapeados (ExternalIdMapping) se actualizan, no se duplican;
 * - nunca borra: los conflictos quedan en `skipped` para revisión humana.
 */
export async function pullContactsToCustomers(params: {
  organizationId: string
  crm: CrmSyncPort
  existingMappings: ExternalIdMapping[]
  existingCustomerKeys: Set<string>
}): Promise<{ drafts: ErpCustomerDraft[]; mappings: ExternalIdMapping[]; summary: SyncSummary }> {
  const { organizationId, crm, existingMappings, existingCustomerKeys } = params
  const contacts = await crm.listContacts()
  const mappedIds = new Set(existingMappings.filter((m) => m.entityType === "customer").map((m) => m.externalId))
  const seenKeys = new Set<string>()

  const drafts: ErpCustomerDraft[] = []
  const newMappings: ExternalIdMapping[] = []
  const summary: SyncSummary = { pulled: contacts.length, created: 0, updated: 0, deduplicated: 0, skipped: 0 }

  for (const contact of contacts) {
    const key = normalizeKey(contact.email, contact.phone, contact.name)

    if (mappedIds.has(contact.id)) {
      summary.updated += 1
      seenKeys.add(key) // registra la clave para que duplicados posteriores se detecten
      continue // ya sincronizado antes: idempotencia por ID externo
    }
    if (seenKeys.has(key) || existingCustomerKeys.has(key)) {
      summary.deduplicated += 1
      continue // duplicado por email/teléfono/nombre: requiere revisión, no auto-merge
    }
    seenKeys.add(key)
    drafts.push({
      organizationId,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      crmExternalId: contact.id,
    })
    newMappings.push({
      organizationId,
      system: "momentum",
      externalId: contact.id,
      entityType: "customer",
      internalId: `cust-crm-${contact.id}`,
      lastSyncedAt: new Date().toISOString(),
    })
    summary.created += 1
  }

  return { drafts, mappings: newMappings, summary }
}

/** Crea un evento de outbox idempotente (clave única por operación de negocio). */
export function buildOutboxEvent(params: {
  organizationId: string
  operation: CrmOutboxEvent["operation"]
  idempotencyKey: string
  payload: Record<string, unknown>
  maxAttempts?: number
}): CrmOutboxEvent {
  return {
    id: newCorrelationId("crm-out"),
    organizationId: params.organizationId,
    idempotencyKey: params.idempotencyKey,
    operation: params.operation,
    payload: params.payload,
    status: "pending",
    attempts: 0,
    maxAttempts: params.maxAttempts ?? 5,
    lastError: null,
    correlationId: newCorrelationId(),
    createdAt: new Date().toISOString(),
  }
}

/**
 * Procesa el outbox contra el CRM con reintentos y dead-letter.
 * Un evento con la misma idempotencyKey ya `sent` no se re-envía.
 */
export async function processOutbox(
  events: CrmOutboxEvent[],
  crm: CrmSyncPort,
): Promise<{ sent: number; failed: number; deadLettered: number }> {
  let sent = 0
  let failed = 0
  let deadLettered = 0

  for (const event of events) {
    if (event.status === "sent" || event.status === "dead_letter") continue
    try {
      if (event.operation === "record_activity") {
        await crm.recordActivity(event.payload as Parameters<CrmSyncPort["recordActivity"]>[0])
      } else if (event.operation === "push_customer") {
        await crm.createContact(event.payload as Parameters<CrmSyncPort["createContact"]>[0])
      } else if (event.operation === "push_order_status") {
        await crm.recordActivity({
          type: "order_status",
          description: JSON.stringify(event.payload),
          contactId: String(event.payload.contactId ?? ""),
          dealId: null,
          scheduledAt: null,
          completedAt: Date.now(),
        })
      }
      event.status = "sent"
      event.attempts += 1
      sent += 1
    } catch (error) {
      event.attempts += 1
      event.lastError = error instanceof Error ? error.message : "error desconocido"
      if (event.attempts >= event.maxAttempts) {
        event.status = "dead_letter"
        deadLettered += 1
      } else {
        event.status = "failed" // elegible para retry con backoff en el job
        failed += 1
      }
    }
  }
  return { sent, failed, deadLettered }
}
