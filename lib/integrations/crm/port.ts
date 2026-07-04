import type { MomentumActivity, MomentumContact, MomentumDeal } from "./types"

/**
 * Puerto de sincronización CRM (arquitectura de puertos/adaptadores).
 * Adaptadores: MockMomentumAdapter (sandbox, default) y HttpMomentumAdapter
 * (endpoints reales de auto-crm; requiere MOMENTUM_BASE_URL configurada).
 * El núcleo del ERP no conoce al proveedor.
 */
export interface CrmSyncPort {
  readonly name: string
  /** Sondeo de salud del CRM remoto (no destructivo) */
  health(): Promise<{ ok: boolean; detail: string }>
  listContacts(params?: { search?: string }): Promise<MomentumContact[]>
  createContact(contact: Omit<MomentumContact, "id" | "createdAt" | "updatedAt">): Promise<MomentumContact>
  updateContact(id: string, patch: Partial<MomentumContact>): Promise<MomentumContact>
  listDeals(): Promise<MomentumDeal[]>
  recordActivity(activity: Omit<MomentumActivity, "id">): Promise<MomentumActivity>
}
