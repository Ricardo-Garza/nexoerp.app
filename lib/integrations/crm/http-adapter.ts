import type { CrmSyncPort } from "./port"
import type { MomentumActivity, MomentumContact, MomentumDeal } from "./types"

/**
 * Adaptador HTTP contra los endpoints REALES de auto-crm (verificados en el
 * repositorio Hainrixz/auto-crm): GET/POST /api/contacts, PATCH /api/contacts/[id],
 * GET /api/deals, POST /api/activities.
 *
 * Solo se activa con MOMENTUM_BASE_URL configurada (server-side). No se usa
 * contra datos reales sin configuración aprobada del propietario.
 */
export class HttpMomentumAdapter implements CrmSyncPort {
  readonly name = "momentum-http"

  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    })
    if (!res.ok) {
      throw new Error(`Momentum ${path} respondió ${res.status}`)
    }
    return (await res.json()) as T
  }

  async health() {
    try {
      await this.request<MomentumContact[]>("/api/contacts?search=__health__")
      return { ok: true, detail: `conectado a ${this.baseUrl}` }
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? error.message : "error desconocido" }
    }
  }

  async listContacts(params?: { search?: string }) {
    const qs = params?.search ? `?search=${encodeURIComponent(params.search)}` : ""
    return this.request<MomentumContact[]>(`/api/contacts${qs}`)
  }

  async createContact(contact: Omit<MomentumContact, "id" | "createdAt" | "updatedAt">) {
    return this.request<MomentumContact>("/api/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    })
  }

  async updateContact(id: string, patch: Partial<MomentumContact>) {
    return this.request<MomentumContact>(`/api/contacts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    })
  }

  async listDeals() {
    return this.request<MomentumDeal[]>("/api/deals")
  }

  async recordActivity(activity: Omit<MomentumActivity, "id">) {
    return this.request<MomentumActivity>("/api/activities", {
      method: "POST",
      body: JSON.stringify(activity),
    })
  }
}

/** Selección de adaptador: HTTP solo si hay URL configurada; sandbox por defecto. */
export function resolveCrmAdapter(): { adapter: "http" | "mock"; baseUrl: string | null } {
  const baseUrl = process.env.MOMENTUM_BASE_URL ?? null
  return baseUrl ? { adapter: "http", baseUrl } : { adapter: "mock", baseUrl: null }
}
