import { z } from "zod"
import { CopilotDataError, type DataSourceAdapter, type Page, type PageRequest, type ReadRepository, type TenantContext } from "./types"

/**
 * Esqueleto de adaptador para la API REST de un cliente. NO está conectado a nada:
 * no define endpoints, no tiene URL por omisión y falla de forma explícita si falta
 * configuración. Cada ruta y cada esquema de respuesta los aporta la integración real.
 *
 * Requisitos que impone el esqueleto (ver docs/CLIENT_API_INTEGRATION_GUIDE.md):
 *  - Autenticación y autorización del lado servidor (`getAccessToken`), nunca desde el navegador.
 *  - Solo GET (política read-only).
 *  - Timeout por petición y tope de páginas/filas.
 *  - La respuesta se valida con zod ANTES de llegar al motor analítico.
 */
export interface RestAdapterConfig {
  baseUrl: string
  tenantId: string
  getAccessToken: (ctx: TenantContext) => Promise<string>
  timeoutMs?: number
  /** Ruta relativa y esquema de cada colección; sin ruta, la colección no está disponible. */
  collections: Partial<Record<CollectionName, { path: string; schema: z.ZodType<unknown> }>>
}

export type CollectionName = "customers" | "products" | "orders" | "quotes" | "opportunities" | "invoices" | "payments" | "creditNotes" | "warehouses" | "movements" | "suppliers" | "purchaseOrders"

const pageEnvelope = z.object({ items: z.array(z.unknown()), nextCursor: z.string().nullable() })

export function createRestAdapter(config: RestAdapterConfig): DataSourceAdapter {
  if (!config.baseUrl.startsWith("https://")) throw new CopilotDataError("not_configured", "La API del cliente debe usar HTTPS")

  const repo = <T,>(name: CollectionName): ReadRepository<T> => ({
    async list(ctx: TenantContext, req: PageRequest): Promise<Page<T>> {
      if (ctx.tenantId !== config.tenantId) throw new CopilotDataError("forbidden", "Tenant no autorizado para este origen de datos")
      const spec = config.collections[name]
      if (!spec) throw new CopilotDataError("not_configured", `La colección «${name}» no está configurada en el adaptador REST`)
      const url = new URL(spec.path, config.baseUrl)
      if (req.cursor) url.searchParams.set("cursor", req.cursor)
      if (req.limit) url.searchParams.set("limit", String(Math.min(req.limit, 1000)))
      if (req.from) url.searchParams.set("from", req.from)
      if (req.to) url.searchParams.set("to", req.to)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 8000)
      try {
        const res = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${await config.getAccessToken(ctx)}`, Accept: "application/json" }, signal: controller.signal })
        if (res.status === 401 || res.status === 403) throw new CopilotDataError("forbidden", "La API del cliente rechazó la autorización")
        if (!res.ok) throw new CopilotDataError("upstream", `La API del cliente respondió ${res.status}`)
        const env = pageEnvelope.parse(await res.json())
        const items = z.array(spec.schema).parse(env.items) as T[]
        return { items, nextCursor: env.nextCursor }
      } catch (e) {
        if (e instanceof CopilotDataError) throw e
        if (e instanceof Error && e.name === "AbortError") throw new CopilotDataError("timeout", "La API del cliente excedió el tiempo límite")
        throw new CopilotDataError("upstream", "Respuesta inválida o error de red de la API del cliente")
      } finally {
        clearTimeout(timer)
      }
    },
  })

  return {
    id: "rest-client-api",
    kind: "rest",
    readOnly: true,
    tenantId: config.tenantId,
    customers: repo("customers"),
    products: repo("products"),
    sales: { orders: repo("orders"), quotes: repo("quotes"), opportunities: repo("opportunities") },
    receivables: { invoices: repo("invoices"), payments: repo("payments"), creditNotes: repo("creditNotes") },
    inventory: { warehouses: repo("warehouses"), movements: repo("movements") },
    purchases: { suppliers: repo("suppliers"), purchaseOrders: repo("purchaseOrders") },
    async meta() {
      throw new CopilotDataError("not_configured", "meta() debe implementarse con el endpoint de metadatos del cliente")
    },
    describe: () => "API REST del cliente (solo lectura)",
  }
}
