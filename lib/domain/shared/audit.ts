/** Evento de auditoría append-only (docs/10_SECURITY_AUDIT.md del contexto). */
export interface AuditEvent {
  id: string
  organizationId: string
  actorId: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  /** Razón operativa cuando la acción la exige (overrides, ajustes) */
  reason?: string
  correlationId: string
  /** Diff redactado: solo campos no sensibles */
  changes?: Record<string, { before: string | null; after: string | null }>
  occurredAt: string // ISO UTC
}

let counter = 0

export function newCorrelationId(prefix = "corr"): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function buildAuditEvent(
  input: Omit<AuditEvent, "id" | "occurredAt" | "correlationId"> & { correlationId?: string },
): AuditEvent {
  return {
    ...input,
    id: newCorrelationId("audit"),
    correlationId: input.correlationId ?? newCorrelationId(),
    occurredAt: new Date().toISOString(),
  }
}
