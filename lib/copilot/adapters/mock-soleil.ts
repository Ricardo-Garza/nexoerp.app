import { getSoleilDemoDataset } from "../data/dataset"
import type { DemoDataset } from "../types"
import { CopilotDataError, type DataSourceAdapter, type Page, type PageRequest, type ReadRepository, type TenantContext } from "./types"

const MAX_PAGE = 2000

/** Repositorio en memoria con paginación por cursor (mismo comportamiento que una API real). */
function memoryRepo<T>(adapterTenant: string, rows: () => T[], dateOf?: (row: T) => string): ReadRepository<T> {
  return {
    async list(ctx: TenantContext, req: PageRequest): Promise<Page<T>> {
      if (ctx.tenantId !== adapterTenant) throw new CopilotDataError("forbidden", "Tenant no autorizado para este origen de datos")
      let all = rows()
      if (dateOf && (req.from || req.to)) all = all.filter((r) => (!req.from || dateOf(r) >= req.from) && (!req.to || dateOf(r) <= req.to))
      const start = req.cursor ? Number(req.cursor) : 0
      if (!Number.isInteger(start) || start < 0) throw new CopilotDataError("upstream", "Cursor inválido")
      const size = Math.min(req.limit ?? MAX_PAGE, MAX_PAGE)
      const items = all.slice(start, start + size)
      return { items, nextCursor: start + size < all.length ? String(start + size) : null }
    },
  }
}

/** Adaptador DEMO: sirve el dataset simulado de Soleil Wire. Aislado de cualquier base real. */
export function createMockSoleilAdapter(dataset: DemoDataset = getSoleilDemoDataset()): DataSourceAdapter {
  const t = dataset.meta.tenantId
  return {
    id: "mock-soleil-demo",
    kind: "mock",
    readOnly: true,
    tenantId: t,
    customers: memoryRepo(t, () => dataset.customers),
    products: memoryRepo(t, () => dataset.products),
    sales: {
      orders: memoryRepo(t, () => dataset.orders, (o) => o.date),
      quotes: memoryRepo(t, () => dataset.quotes, (q) => q.date),
      opportunities: memoryRepo(t, () => dataset.opportunities),
    },
    receivables: {
      invoices: memoryRepo(t, () => dataset.invoices, (i) => i.date),
      payments: memoryRepo(t, () => dataset.payments, (p) => p.date),
      creditNotes: memoryRepo(t, () => dataset.creditNotes, (n) => n.date),
    },
    inventory: {
      warehouses: memoryRepo(t, () => dataset.warehouses),
      movements: memoryRepo(t, () => dataset.movements, (m) => m.date),
    },
    purchases: {
      suppliers: memoryRepo(t, () => dataset.suppliers),
      purchaseOrders: memoryRepo(t, () => dataset.purchaseOrders, (p) => p.date),
    },
    async meta(ctx) {
      if (ctx.tenantId !== t) throw new CopilotDataError("forbidden", "Tenant no autorizado para este origen de datos")
      return dataset.meta
    },
    describe: () => "Dataset DEMO simulado de Soleil Wire (adaptador mock, solo lectura)",
  }
}
