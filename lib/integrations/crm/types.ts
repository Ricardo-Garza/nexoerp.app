/**
 * Tipos del CRM Momentum (auto-crm) — derivados del esquema REAL del repositorio
 * https://github.com/Hainrixz/auto-crm (src/db/schema.ts, analizado 2026-07-03).
 * No se inventan campos ni endpoints.
 */

export interface MomentumContact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  source: string
  temperature: "cold" | "warm" | "hot" | string
  score: number
  notes: string | null
  createdAt: number | string
  updatedAt: number | string
}

export interface MomentumDeal {
  id: string
  title: string
  value: number
  stageId: string
  contactId: string
  expectedClose: number | string | null
  probability: number
  notes: string | null
}

export interface MomentumActivity {
  id: string
  type: string
  description: string
  contactId: string
  dealId: string | null
  scheduledAt: number | string | null
  completedAt: number | string | null
}

/** Mapeo de identidad externa ↔ interna (nunca se comparten PKs entre sistemas). */
export interface ExternalIdMapping {
  organizationId: string
  system: "momentum"
  externalId: string
  entityType: "customer" | "deal" | "activity"
  internalId: string
  lastSyncedAt: string
}

export type OutboxStatus = "pending" | "sent" | "failed" | "dead_letter"

/** Evento de sincronización saliente con reintentos y dead-letter. */
export interface CrmOutboxEvent {
  id: string
  organizationId: string
  idempotencyKey: string
  operation: "push_customer" | "push_order_status" | "record_activity"
  payload: Record<string, unknown>
  status: OutboxStatus
  attempts: number
  maxAttempts: number
  lastError: string | null
  correlationId: string
  createdAt: string
}

export interface SyncSummary {
  pulled: number
  created: number
  updated: number
  deduplicated: number
  skipped: number
}
