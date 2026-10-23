/**
 * Nexo Intelligence — tipos de dominio del dataset DEMO de Soleil Wire.
 *
 * Todo lo que vive en `DemoDataset` es SIMULADO (clientes, ventas, costos, stock).
 * Solo el catálogo base (familias y nombres de producto) proviene de datos
 * públicos de soleilwire.net, vía `lib/domain/soleilwire/soleil-seed.json`.
 *
 * Convenciones de dinero: los importes de documentos están en `currency`;
 * `fx` es MXN por 1 unidad de esa moneda (1 para MXN). Los costos siempre en MXN.
 */

export type Currency = "MXN" | "USD"
export type UnitCode = "m" | "rollo" | "pza"
export type IsoDate = string // YYYY-MM-DD

export type CustomerArchetype = "estrategico" | "recurrente" | "creciente" | "ocasional" | "nuevo" | "inactivo"
export type PayerProfile = "puntual" | "lento" | "moroso"

export interface DemoCustomer {
  id: string
  name: string
  industry: string
  city: string
  state: string
  region: "norte" | "centro" | "occidente"
  segment: "A" | "B" | "C"
  currency: Currency
  creditDays: number
  creditLimit: number // MXN
  createdAt: IsoDate
  archetype: CustomerArchetype
  payer: PayerProfile
}

export interface DemoSupplier {
  id: string
  name: string
  country: string
  leadDays: number
}

export interface DemoWarehouse {
  id: string
  name: string
  city: string
}

export interface DemoProduct {
  sku: string
  baseSku: string
  family: string
  name: string
  gauge: string | null
  unit: UnitCode
  /** Metros que representa una unidad de venta (rollo = 100 m; pza = 0, no es longitud). */
  metersPerUnit: number
  listPrice: number // MXN por unidad de venta
  costMxn: number // MXN por unidad de venta
  minStock: number
  supplierId: string
  active: boolean
}

export interface DemoOrderLine {
  sku: string
  qty: number
  unit: UnitCode
  unitPrice: number // en moneda del documento
  discount: number // importe de descuento en moneda del documento
  lineTotal: number // qty × unitPrice − discount (moneda del documento, sin IVA)
  unitCostMxn: number
}

export type OrderStatus = "Confirmado" | "Surtido" | "Facturado" | "Cancelado"

export interface DemoOrder {
  id: string
  customerId: string
  date: IsoDate
  status: OrderStatus
  currency: Currency
  fx: number
  warehouseId: string
  quoteId: string | null
  lines: DemoOrderLine[]
  subtotal: number // suma de lineTotal
}

export type QuoteStatus = "Ganada" | "Perdida" | "Vigente" | "Vencida"

export interface DemoQuote {
  id: string
  customerId: string
  opportunityId: string | null
  date: IsoDate
  status: QuoteStatus
  currency: Currency
  fx: number
  total: number // sin IVA, moneda del documento
  orderId: string | null
}

export type OpportunityStage = "Prospecto" | "Calificada" | "Cotizada" | "Negociación" | "Ganada" | "Perdida"

export interface DemoOpportunity {
  id: string
  customerId: string
  name: string
  family: string
  stage: OpportunityStage
  amountMxn: number
  probability: number // 0-100
  createdAt: IsoDate
  expectedClose: IsoDate
  owner: string
  lostReason: string | null
}

export interface DemoInvoice {
  id: string
  orderId: string
  customerId: string
  date: IsoDate
  dueDate: IsoDate
  currency: Currency
  fx: number
  subtotal: number
  tax: number
  total: number
}

export interface DemoPayment {
  id: string
  invoiceId: string
  customerId: string
  date: IsoDate
  amount: number // moneda de la factura
  currency: Currency
  fx: number
  method: "transferencia" | "cheque" | "compensacion"
}

export interface DemoCreditNote {
  id: string
  invoiceId: string
  customerId: string
  date: IsoDate
  reason: "devolucion" | "ajuste_precio" | "descuento_posterior"
  currency: Currency
  fx: number
  subtotal: number
  tax: number
  total: number
  /** Costo de ventas que se revierte (solo devoluciones físicas), en MXN. */
  costReversalMxn: number
  returnLines: { sku: string; qty: number; warehouseId: string }[]
}

export type MovementType =
  | "apertura"
  | "entrada_compra"
  | "salida_venta"
  | "devolucion_cliente"
  | "ajuste"
  | "traspaso_salida"
  | "traspaso_entrada"

export interface DemoMovement {
  id: string
  date: IsoDate
  sku: string
  warehouseId: string
  type: MovementType
  qty: number // con signo, en la unidad de venta del SKU
  unitCostMxn: number
  refType: "apertura" | "orden_compra" | "orden_venta" | "nota_credito" | "ajuste" | "traspaso"
  refId: string
}

export interface DemoPurchaseLine {
  sku: string
  qty: number
  unitCostMxn: number
}

export interface DemoPurchaseOrder {
  id: string
  supplierId: string
  warehouseId: string
  date: IsoDate
  expectedDate: IsoDate
  receivedDate: IsoDate | null
  status: "Recibida" | "En tránsito"
  lines: DemoPurchaseLine[]
}

export interface DemoDatasetMeta {
  tenantId: string
  isDemo: true
  seed: string
  schemaVersion: number
  referenceDate: IsoDate
  rangeStart: IsoDate
  disclaimer: string
}

export interface DemoDataset {
  meta: DemoDatasetMeta
  customers: DemoCustomer[]
  suppliers: DemoSupplier[]
  warehouses: DemoWarehouse[]
  products: DemoProduct[]
  quotes: DemoQuote[]
  opportunities: DemoOpportunity[]
  orders: DemoOrder[]
  invoices: DemoInvoice[]
  payments: DemoPayment[]
  creditNotes: DemoCreditNote[]
  purchaseOrders: DemoPurchaseOrder[]
  movements: DemoMovement[]
}

export interface CatalogInput {
  sku: string
  familia: string
  producto: string
}
