import { createMockSoleilAdapter } from "./adapters/mock-soleil"
import { CopilotDataError, type DataSourceAdapter, type ReadRepository, type TenantContext } from "./adapters/types"
import { buildDataView, type DataView } from "./analytics/view"
import { runCopilot } from "./engine"
import type { CopilotResponse } from "./result"
import type { SessionMemory } from "./schema"
import type { DemoDataset } from "./types"

/**
 * AnalyticsQueryService: orquesta adaptador → vista indexada → motor.
 * Aplica los límites de protección: filas máximas, tiempo máximo y caché corta por tenant.
 */
export interface QueryLimits {
  maxRowsPerCollection: number
  pageSize: number
  timeoutMs: number
  cacheTtlMs: number
}

export const DEFAULT_LIMITS: QueryLimits = { maxRowsPerCollection: 100_000, pageSize: 2000, timeoutMs: 8000, cacheTtlMs: 60_000 }

async function drain<T>(repo: ReadRepository<T>, ctx: TenantContext, limits: QueryLimits, deadline: number): Promise<T[]> {
  const out: T[] = []
  let cursor: string | undefined
  do {
    if (Date.now() > deadline) throw new CopilotDataError("timeout", "La consulta excedió el tiempo límite")
    const page = await repo.list(ctx, { cursor, limit: limits.pageSize })
    out.push(...page.items)
    if (out.length > limits.maxRowsPerCollection) throw new CopilotDataError("too_large", "La colección excede el límite de filas permitido para una consulta")
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return out
}

export class AnalyticsQueryService {
  private cache = new Map<string, { at: number; view: DataView }>()

  constructor(
    private readonly adapter: DataSourceAdapter,
    private readonly limits: QueryLimits = DEFAULT_LIMITS,
  ) {}

  private async loadView(ctx: TenantContext): Promise<DataView> {
    if (ctx.tenantId !== this.adapter.tenantId) throw new CopilotDataError("forbidden", "Tenant no autorizado para este origen de datos")
    const hit = this.cache.get(ctx.tenantId)
    if (hit && Date.now() - hit.at < this.limits.cacheTtlMs) return hit.view
    const deadline = Date.now() + this.limits.timeoutMs
    const a = this.adapter
    const [meta, customers, products, orders, quotes, opportunities, invoices, payments, creditNotes, warehouses, movements, suppliers, purchaseOrders] = await Promise.all([
      a.meta(ctx),
      drain(a.customers, ctx, this.limits, deadline),
      drain(a.products, ctx, this.limits, deadline),
      drain(a.sales.orders, ctx, this.limits, deadline),
      drain(a.sales.quotes, ctx, this.limits, deadline),
      drain(a.sales.opportunities, ctx, this.limits, deadline),
      drain(a.receivables.invoices, ctx, this.limits, deadline),
      drain(a.receivables.payments, ctx, this.limits, deadline),
      drain(a.receivables.creditNotes, ctx, this.limits, deadline),
      drain(a.inventory.warehouses, ctx, this.limits, deadline),
      drain(a.inventory.movements, ctx, this.limits, deadline),
      drain(a.purchases.suppliers, ctx, this.limits, deadline),
      drain(a.purchases.purchaseOrders, ctx, this.limits, deadline),
    ])
    const data: DemoDataset = { meta, customers, products, orders, quotes, opportunities, invoices, payments, creditNotes, warehouses, movements, suppliers, purchaseOrders }
    const view = buildDataView(data)
    this.cache.set(ctx.tenantId, { at: Date.now(), view })
    return view
  }

  async ask(ctx: TenantContext, question: string, memory?: SessionMemory): Promise<CopilotResponse> {
    const view = await this.loadView(ctx)
    return runCopilot({ question, memory, view, source: this.adapter.describe() })
  }

  /** Vista de solo lectura para pruebas y exportaciones controladas. */
  async view(ctx: TenantContext): Promise<DataView> {
    return this.loadView(ctx)
  }
}

let demoService: AnalyticsQueryService | null = null
/** Servicio DEMO (singleton por proceso) sobre el adaptador mock de Soleil Wire. */
export function getDemoService(): AnalyticsQueryService {
  if (!demoService) demoService = new AnalyticsQueryService(createMockSoleilAdapter())
  return demoService
}
