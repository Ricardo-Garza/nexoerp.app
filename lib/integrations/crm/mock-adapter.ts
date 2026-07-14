import type { CrmSyncPort } from "./port"
import type { MomentumActivity, MomentumContact, MomentumDeal } from "./types"

/**
 * Adaptador sandbox del CRM Momentum: mismo contrato que el adaptador HTTP,
 * datos en memoria claramente sintéticos. Es el default mientras no existan
 * credenciales/URL del CRM real (docs/CRM_MOMENTUM_INTEGRATION.md).
 */
export class MockMomentumAdapter implements CrmSyncPort {
  readonly name = "momentum-mock"
  private contacts: MomentumContact[] = []
  private deals: MomentumDeal[] = []
  private activities: MomentumActivity[] = []
  private seq = 0

  constructor(seedContacts: Partial<MomentumContact>[] = []) {
    for (const seed of seedContacts) {
      this.contacts.push({
        id: `mock-contact-${++this.seq}`,
        name: seed.name ?? `Contacto demo ${this.seq}`,
        email: seed.email ?? null,
        phone: seed.phone ?? null,
        company: seed.company ?? null,
        source: seed.source ?? "otro",
        temperature: seed.temperature ?? "cold",
        score: seed.score ?? 0,
        notes: seed.notes ?? null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  }

  async health() {
    return { ok: true, detail: "Datos de prueba — preparado para conexión real" }
  }

  async listContacts(params?: { search?: string }) {
    const q = params?.search?.toLowerCase()
    if (!q) return [...this.contacts]
    return this.contacts.filter((c) =>
      `${c.name} ${c.email ?? ""} ${c.company ?? ""}`.toLowerCase().includes(q),
    )
  }

  async createContact(contact: Omit<MomentumContact, "id" | "createdAt" | "updatedAt">) {
    const created: MomentumContact = {
      ...contact,
      id: `mock-contact-${++this.seq}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.contacts.push(created)
    return created
  }

  async updateContact(id: string, patch: Partial<MomentumContact>) {
    const existing = this.contacts.find((c) => c.id === id)
    if (!existing) throw new Error(`Contacto ${id} no existe en el CRM mock`)
    Object.assign(existing, patch, { updatedAt: Date.now() })
    return existing
  }

  async listDeals() {
    return [...this.deals]
  }

  async recordActivity(activity: Omit<MomentumActivity, "id">) {
    const created: MomentumActivity = { ...activity, id: `mock-act-${++this.seq}` }
    this.activities.push(created)
    return created
  }
}
