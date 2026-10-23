import type {
  DemoCreditNote,
  DemoCustomer,
  DemoDatasetMeta,
  DemoInvoice,
  DemoMovement,
  DemoOpportunity,
  DemoOrder,
  DemoPayment,
  DemoProduct,
  DemoPurchaseOrder,
  DemoQuote,
  DemoSupplier,
  DemoWarehouse,
  IsoDate,
} from "../types"

/**
 * Contrato de acceso a datos del copiloto.
 *
 * El motor analítico NUNCA toca una base de datos: consume repositorios de SOLO LECTURA a
 * través de un `DataSourceAdapter`. Para conectar la API real de un cliente basta con
 * implementar este contrato (ver docs/CLIENT_API_INTEGRATION_GUIDE.md); el motor no cambia.
 */
export interface TenantContext {
  /** Empresa activa, ya autenticada y autorizada en el servidor. Nunca viene del cliente sin verificar. */
  tenantId: string
  userId: string
  role: string
}

export interface PageRequest {
  cursor?: string
  /** Tamaño de página solicitado (el adaptador puede acotarlo). */
  limit?: number
  from?: IsoDate
  to?: IsoDate
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

export interface ReadRepository<T> {
  list(ctx: TenantContext, req: PageRequest): Promise<Page<T>>
}

export interface CustomersRepository extends ReadRepository<DemoCustomer> {}
export interface ProductsRepository extends ReadRepository<DemoProduct> {}
export interface SalesRepository {
  orders: ReadRepository<DemoOrder>
  quotes: ReadRepository<DemoQuote>
  opportunities: ReadRepository<DemoOpportunity>
}
export interface ReceivablesRepository {
  invoices: ReadRepository<DemoInvoice>
  payments: ReadRepository<DemoPayment>
  creditNotes: ReadRepository<DemoCreditNote>
}
export interface InventoryRepository {
  warehouses: ReadRepository<DemoWarehouse>
  movements: ReadRepository<DemoMovement>
}
export interface PurchasesRepository {
  suppliers: ReadRepository<DemoSupplier>
  purchaseOrders: ReadRepository<DemoPurchaseOrder>
}

export interface DataSourceAdapter {
  readonly id: string
  readonly kind: "mock" | "rest"
  /** Política read-only: el contrato no define ninguna operación de escritura. */
  readonly readOnly: true
  readonly tenantId: string
  readonly customers: CustomersRepository
  readonly products: ProductsRepository
  readonly sales: SalesRepository
  readonly receivables: ReceivablesRepository
  readonly inventory: InventoryRepository
  readonly purchases: PurchasesRepository
  meta(ctx: TenantContext): Promise<DemoDatasetMeta>
  /** Texto corto que se muestra como «fuente» de cada cifra. */
  describe(): string
}

export class CopilotDataError extends Error {
  constructor(
    public readonly code: "forbidden" | "timeout" | "too_large" | "not_configured" | "upstream",
    message: string,
  ) {
    super(message)
    this.name = "CopilotDataError"
  }
}
