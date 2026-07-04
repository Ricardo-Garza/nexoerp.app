import type { Timestamp } from "firebase/firestore"

// Base interface for all documents
export interface BaseDocument {
  /** Usuario que creó/posee el documento (auditoría; opcional en legacy) */
  userId?: string
  id: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
  companyId?: string
}

// Orders
export interface Order extends BaseDocument {
  customer: string
  customerEmail?: string
  product: string
  quantity: number
  total: number
  status: "pending" | "processing" | "completed" | "cancelled"
  date: Timestamp | string
  deliveryDate?: Timestamp | string
  items?: OrderItem[]
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

// Products
export interface Product extends BaseDocument {
  /** Stock plano legacy (la fuente de verdad moderna es el módulo de inventario) */
  stock?: number
  sku: string
  name: string
  description?: string
  category?: string
  tipoProducto?: "producto" | "servicio"
  claveSat?: string
  unidadSat?: string
  impuestosAplicables?: string[]

  // Unit configuration
  baseUnit: string // e.g., "KG", "PZA", "LT"
  purchaseUnit?: string // e.g., "CAJA", "LOTE", "TARIMA"
  unitsPerPackage: number // How many base units per purchase unit (e.g., 1 caja = 4 bidones de 20kg = 80kg)

  // Pricing (in base units)
  price: number
  cost: number
  currency: "MXN" | "USD" | "EUR"

  // Inventory control
  trackInventory: boolean
  trackingType: "ninguno" | "lote" | "serie"
  requiresExpiry: boolean // If true, must capture expiry date (not calculate from days)

  // No stock field - inventory is ledger-based
  minStock?: number
  maxStock?: number
  reorderPoint?: number

  // Status
  active: boolean

  // Metadata
  barcode?: string
  weight?: number
  dimensions?: string
  imageUrl?: string
  tags?: string[]
  notes?: string
}

// Product Attributes and Variants System
export interface ProductAttribute extends BaseDocument {
  nombre: string
  tipo: "seleccion" | "numerico" | "texto" | "booleano" | "color"
  descripcion?: string
  valores: AttributeValue[] // For selection type
  activo: boolean
  orden?: number
  categoriaId?: string
  categoriaNombre?: string
  productosConAtributo?: number // Calculated
}

export interface AttributeValue {
  id: string
  valor: string
  hexColor?: string // For color type
  orden?: number
  activo: boolean
}

// Category for organizing attributes
export interface ProductCategory extends BaseDocument {
  nombre: string
  descripcion?: string
  imagen?: string
  orden?: number
  activo: boolean
  atributoIds?: string[] // Attributes linked to this category
}

// Mapping: Products → Attributes
export interface ProductAttributeAssignment extends BaseDocument {
  productoId: string
  productoNombre: string
  atributoId: string
  atributoNombre: string
  atributoTipo: string
  valoresSeleccionados: string[] // Selected values for this product
  generarVariantes: boolean // Whether to auto-generate variants
}

// Product Variants (SKU combinations)
export interface ProductVariant extends BaseDocument {
  productoId: string
  productoNombre: string
  sku: string
  nombre: string // e.g., "Playera Roja M"
  combinacionAtributos: Record<string, string> // e.g., {color: "Rojo", talla: "M"}
  precio: number
  costo: number
  stock: number
  imagenes?: string[]
  activo: boolean
  codigoBarras?: string
}

// Customers
export interface Customer extends BaseDocument {
  nombre: string
  rfc?: string
  email: string
  telefono: string
  direccion?: string
  ciudad?: string
  entidadFederativa?: string
  codigoPostal?: string
  limiteCredito: number
  saldo: number // Calculated from accountsReceivable
  diasCredito: number
  estado: "activo" | "inactivo" | "suspendido"
  tipoCliente: "minorista" | "mayorista" | "distribuidor" | "vip"
  descuentoDefault?: number
  vendedorAsignado?: string
  fechaRegistro: Timestamp | string
  ultimaCompra?: Timestamp | string
  totalCompras?: number
  notas?: string
}

// Purchases / Production Costs
export interface Purchase extends BaseDocument {
  supplierId?: string
  supplierName: string
  description: string
  amount: number
  date: Timestamp | string
  category: "raw_materials" | "supplies" | "production" | "other"
  status: "pending" | "completed" | "cancelled"
  invoiceNumber?: string
}

// Operating Expenses
export interface Expense extends BaseDocument {
  description: string
  amount: number
  date: Timestamp | string
  category: "rent" | "utilities" | "salaries" | "marketing" | "maintenance" | "other"
  status: "pending" | "paid"
  paymentMethod?: string
  invoiceNumber?: string
}

// Inventory Snapshots
export interface InventorySnapshot extends BaseDocument {
  period: string // Format: "YYYY-MM" for monthly snapshots
  periodStart: Timestamp | string
  periodEnd: Timestamp | string
  openingValue: number // Total inventory value at start of period
  closingValue: number // Total inventory value at end of period
  method: "fifo" | "lifo" | "average" // Costing method
  status: "draft" | "closed"
  notes?: string
}

// Financial Period Data (calculated)
export interface FinancialPeriod {
  periodStart: Date
  periodEnd: Date
  totalRevenue: number
  cogs: number
  grossProfit: number
  opex: number
  operatingProfit: number
  operatingMargin: number
}

// Accounting-specific types for ledger accounts and journal entries
// Accounting - Ledger Accounts (Chart of Accounts / Catálogo de Cuentas)
export interface LedgerAccount extends BaseDocument {
  codigo: string // Account code (e.g., "1000", "1100")
  nombre: string // Account name
  tipo: "Activo" | "Pasivo" | "Capital" | "Ingresos" | "Egresos" | "Costos"
  nivel: number // Hierarchy level (1, 2, 3)
  cuentaPadre?: string // Parent account ID for hierarchy
  saldo: number // Current balance
  naturaleza: "deudora" | "acreedora" // Normal balance type
  acumulaSaldo: boolean // Whether it accumulates balance or is just a header
  activa: boolean // Is account active
  movimientos: number // Number of transactions
}

// Journal Entries (Pólizas)
export interface JournalEntry extends BaseDocument {
  folio: string // Entry number
  tipo: "Diario" | "Ingresos" | "Egresos" | "Ajuste"
  fecha: Timestamp | string
  concepto: string // Description
  referencia?: string // External reference (invoice, document, etc.)
  estado: "borrador" | "autorizada" | "cancelada"
  autorizadoPor?: string
  fechaAutorizacion?: Timestamp | string
  movimientos: JournalMovement[] // Individual debit/credit movements
  totalCargos: number // Total debits
  totalAbonos: number // Total credits
  diferencia: number // Should be 0 for balanced entry
  notas?: string

  // Source tracking for automatic posting
  sourceType?:
    | "salesOrder"
    | "salesInvoice"
    | "delivery"
    | "purchaseOrder"
    | "goodsReceipt"
    | "accountPayable"
    | "bankTransaction"
    | "serviceTicket"
    | "workOrder"
    | "fieldServiceOrder"
    | "manual"
  sourceId?: string // ID of the originating document
  sourceFolio?: string // Folio of the originating document
  autoPosted: boolean // Was this entry automatically generated?
}

export interface JournalMovement {
  cuentaId: string
  cuentaCodigo: string
  cuentaNombre: string
  tipo: "cargo" | "abono" // debit or credit
  monto: number
  referencia?: string
  notas?: string
}

// Budget (Presupuestos)
export interface Budget extends BaseDocument {
  nombre: string
  año: number
  estado: "activo" | "cerrado" | "borrador"
  cuentas: BudgetLine[]
  totalPresupuestado: number
}

export interface BudgetLine {
  cuentaId: string
  cuentaCodigo: string
  cuentaNombre: string
  enero: number
  febrero: number
  marzo: number
  abril: number
  mayo: number
  junio: number
  julio: number
  agosto: number
  septiembre: number
  octubre: number
  noviembre: number
  diciembre: number
  total: number
}

// Comprehensive Sales Order Types
export interface SalesOrderLine {
  id: string
  type: "product" | "section" | "note"
  productId?: string
  productName?: string
  description: string
  quantity?: number
  unit?: string
  unitPrice?: number
  tax?: number // Percentage (e.g., 16 for 16% IVA)
  taxAmount?: number // Calculated tax amount
  discount?: number // Percentage or fixed amount
  discountAmount?: number
  subtotal?: number // quantity * unitPrice
  total?: number // subtotal + tax - discount
  order: number // Sort order
}

export interface SalesOrder extends BaseDocument {
  /** Alias es-MX de status usado por hooks legacy */
  estado?: string
  // Order identification
  type: "quotation" | "order"
  folio: string

  // Customer
  customerId: string
  customerName: string

  // Status workflow: draft -> confirmed -> in_progress -> delivered -> invoiced
  status: "draft" | "quotation" | "confirmed" | "in_progress" | "delivered" | "invoiced" | "invoiced_partial" | "cancelled" | "returned"

  // Document type after confirmation
  documentType?: "remision" | "invoice"

  // Items
  items: SalesOrderItem[]

  // Pricing
  currency: "MXN" | "USD" | "EUR"
  subtotal: number
  tax: number
  discount: number
  shipping: number
  total: number

  // Fulfillment
  almacenId?: string // Warehouse to fulfill from
  almacenNombre?: string
  metodoValuacion: "PEPS" | "promedio" // How to pick inventory lots

  // Delivery
  deliveryAddress?: string
  deliveryDate?: Timestamp | string | null
  deliveryNotes?: string

  // References
  remisionId?: string | null // Delivery note
  remisionFolio?: string | null
  facturaId?: string | null // Invoice
  facturaFolio?: string | null

  // Timestamps
  orderDate: Timestamp | string
  confirmedDate?: Timestamp | string
  deliveredDate?: Timestamp | string
  invoicedDate?: Timestamp | string

  // Users
  createdBy: string
  confirmedBy?: string

  // Alias inglés del almacén usado por la generación anterior del formulario
  warehouseId?: string
  warehouseName?: string
  // Campos opcionales de la generación anterior del módulo de ventas
  // (sales-order-form, order-detail-drawer, generate-*-dialog los consumen;
  // los documentos Firestore históricos pueden traer esta forma)
  orderNumber?: string
  lines?: SalesOrderLine[]
  billingAddress?: string
  shippingAddress?: string
  expirationDate?: Timestamp | string | null
  paymentTerms?: string
  paymentMethod?: string
  cfdiUse?: string
  priceList?: string
  exchangeRate?: number
  taxTotal?: number
  discountTotal?: number
  internalNotes?: string
  termsAndConditions?: string
  customerSignature?: string
  signatureDate?: Timestamp | string
  signedBy?: string
  deliveryIds?: string[]
  invoiceIds?: string[]
  salesPerson?: string
  source?: string
  confirmedAt?: Timestamp | string
  cancelledAt?: Timestamp | string
  cancellationReason?: string

  // Cancel/Return fields
  cancelReturnType?: "cancellation" | "return"
  cancelReturnReason?: string
  cancelReturnAt?: Timestamp | string
  cancelReturnBy?: string

  notes?: string
}

export interface SalesOrderItem {
  productName?: string
  quantity?: number
  total?: number
  // Campos de la generación anterior (documentos históricos)
  productId?: string
  variantId?: string
  productoId: string
  sku: string
  nombre: string
  descripcion?: string

  // Quantity
  cantidad: number
  unidad: string

  // Pricing
  precioUnitario: number
  descuento: number
  subtotal: number

  // Fulfillment tracking
  cantidadEntregada: number
  cantidadPendiente: number

  // Lot assignments (for FIFO/traceability)
  lotesAsignados?: Array<{
    lote: string
    almacenId: string
    cantidad: number
    costoUnitario: number
    fechaCaducidad?: Timestamp | string
  }>
}

export interface Delivery extends BaseDocument {
  [key: string]: any
  // Campos de la generación anterior
  deliveryNumber?: string
  salesOrderId?: string
  customerId?: string
  deliveryDate?: Timestamp | string
  status?: string
  salesOrderNumber?: string
  customerName?: string
  shippingAddress?: string
  inventoryProcessed?: boolean
  inventoryProcessedAt?: Timestamp | string
  notes?: string
  lines?: SalesOrderLine[]
  folio: string

  // References
  ordenVentaId: string
  ordenVentaFolio: string
  clienteId: string
  clienteNombre: string

  // Status
  estado: "preparando" | "lista" | "en_transito" | "entregada" | "cancelada"

  // Items with lot details
  items: DeliveryItem[]

  // Delivery details
  direccionEntrega: string
  fechaEntrega: Timestamp | string
  fechaEntregaReal?: Timestamp | string
  transportista?: string
  guiaRastreo?: string

  // Warehouse
  almacenId: string
  almacenNombre: string

  // Users
  preparadoPor?: string
  entregadoPor?: string
  recibidoPor?: string

  notas?: string
}

export interface DeliveryItem {
  productoId: string
  sku: string
  nombre: string
  cantidad: number
  unidad: string

  // Lot traceability
  lote?: string
  serie?: string
  fechaCaducidad?: Timestamp | string

  // Which stock movement this relates to
  movimientoId?: string
}

export interface Invoice extends BaseDocument {
  [key: string]: any
  amountPaid?: number
  // Campos de la generación anterior
  paymentStatus?: string
  invoiceNumber?: string
  folio: string
  serie?: string

  // References
  ordenVentaId?: string
  ordenVentaFolio?: string
  remisionId?: string
  remisionFolio?: string
  clienteId: string
  clienteNombre: string
  clienteRFC?: string

  // Items
  items: InvoiceItem[]

  // Amounts
  subtotal: number
  iva: number
  descuento: number
  total: number
  moneda: "MXN" | "USD" | "EUR"

  // Payment
  formaPago: string
  metodoPago: string
  condicionesPago?: string
  diasCredito?: number
  fechaVencimiento?: Timestamp | string

  // Payment status
  estadoPago: "pendiente" | "parcial" | "pagada" | "vencida"
  montoPagado: number
  saldo: number

  // CFDI (Mexico)
  usoCFDI?: string
  uuid?: string // After "timbrado"
  fechaTimbrado?: Timestamp | string
  xmlUrl?: string
  pdfUrl?: string

  // Status
  estado: "borrador" | "timbrada" | "enviada" | "pagada" | "cancelada"

  // Dates
  fecha: Timestamp | string
  fechaEmision: Timestamp | string

  notas?: string
}

export interface InvoiceItem {
  productoId?: string
  claveProdServ?: string
  claveUnidad?: string
  sku: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento: number
  subtotal: number
  iva: number
  total: number
}

export interface SalesOrderActivity {
  id: string
  salesOrderId: string
  timestamp: Timestamp | string
  userId?: string
  userName?: string
  action:
    | "created"
    | "updated"
    | "confirmed"
    | "cancelled"
    | "delivered"
    | "invoiced"
    | "invoiced_partial"
    | "email_sent"
    | "printed"
  description: string
  metadata?: Record<string, any>
}

export interface ProductBatch extends BaseDocument {
  productoId: string
  productoNombre: string
  sku: string
  lote: string
  serie?: string
  numeroLote: string

  // Stock by warehouse
  almacenes: {
    almacenId: string
    almacenNombre: string
    cantidad: number
    ubicacion?: string
  }[]

  // Dates
  fechaFabricacion?: Timestamp | string
  fechaCaducidad?: Timestamp | string
  fechaRecepcion: Timestamp | string

  // Origin
  proveedorId?: string
  proveedorNombre?: string
  paisOrigen?: string
  documentoOrigen?: string

  // Traceability
  certificaciones?: string[]
  trazabilidad?: {
    evento: string
    fecha: Timestamp | string
    usuario: string
    notas?: string
  }[]

  // Status
  estado: "disponible" | "reservado" | "vencido" | "cuarentena"
  estrategia: "FIFO" | "FEFO" | "LIFO"

  // Quality
  inspeccionado: boolean
  estadoInspeccion?: "aprobado" | "rechazado" | "pendiente"
  notasCalidad?: string

  // Documents
  documentosAdjuntos?: {
    nombre: string
    url: string
    tipo: string
  }[]
}

export interface ExchangeRate extends BaseDocument {
  fecha: Timestamp | string
  tasas: {
    USD: number // 1 USD = X MXN
    EUR: number // 1 EUR = X MXN
  }
  fuente?: string // e.g., "Banco de México", "Manual"
  activo: boolean
}

// Maintenance Module - ERP 2026-2027
// Equipment (Catálogo de Equipos)
export interface Equipment extends BaseDocument {
  // Identificación
  codigo: string // Código único del equipo
  nombre: string // Nombre descriptivo
  categoria: string // Tipo: "Maquinaria", "Vehículo", "Herramienta", "Infraestructura"
  subcategoria?: string

  // Ubicación
  planta: string // Planta donde se encuentra
  area: string // Área específica (producción, almacén, etc.)
  ubicacionDetalle?: string

  // Especificaciones técnicas
  marca?: string
  modelo?: string
  numeroSerie?: string
  añoFabricacion?: number

  // Gestión
  criticidad: "baja" | "media" | "alta" | "critica" // Importancia operativa
  responsableId?: string // Usuario responsable
  responsableNombre?: string
  estado: "operativo" | "mantenimiento" | "fuera_servicio" | "baja"

  // Lecturas (para mantenimiento preventivo basado en uso)
  tipoLectura?: "horas" | "kilometros" | "ciclos" | "ninguno"
  lecturaActual: number // Lectura actual
  unidadLectura: string // "hrs", "km", "ciclos"

  // Mantenimiento
  frecuenciaMantenimiento?: number // Cada cuánto (en unidad de lectura o días)
  proximoMantenimiento?: Timestamp | string
  ultimoMantenimiento?: Timestamp | string

  // Costos estimados
  costoAdquisicion?: number
  costoMantenimientoAnual?: number

  // Relación con almacén (para refacciones)
  almacenRefaccionesId?: string // Almacén donde se guardan las refacciones de este equipo
  almacenRefaccionesNombre?: string

  // Documentación
  manuales?: string[] // URLs a manuales
  certificados?: string[] // URLs a certificados

  notas?: string
}

// Preventive Maintenance (Mantenimientos Preventivos)
export interface PreventiveMaintenance extends BaseDocument {
  // Identificación
  codigo: string
  nombre: string
  descripcion?: string

  // Equipo relacionado
  equipoId: string
  equipoNombre: string
  equipoCodigo: string

  // Tipo de preventivo
  tipo: "calendario" | "lectura" // Por fechas o por uso

  // Periodicidad por calendario
  periodicidadDias?: number // Cada cuántos días
  proximaFechaEjecucion?: Timestamp | string

  // Periodicidad por lectura
  periodicidadLectura?: number // Cada cuántas unidades de lectura
  lecturaBaseUltimaEjecucion?: number
  proximaLectura?: number

  // Última ejecución
  ultimaEjecucion?: Timestamp | string
  ultimaOrdenTrabajoId?: string

  // Actividades (checklist)
  actividades: {
    descripcion: string
    orden: number
    tiempoEstimado?: number // minutos
    requiereEvidencia: boolean
  }[]

  // Refacciones requeridas
  refacciones?: {
    productoId: string
    sku: string
    nombre: string
    cantidad: number
    unidad: string
  }[]

  // Recursos
  tecnicoAsignadoId?: string
  tecnicoAsignadoNombre?: string
  tiempoEstimadoTotal: number // minutos

  // Generación automática
  generacionAutomatica: boolean // Si se generan OTs automáticamente
  diasAnticipacion: number // Días de anticipación para generar OT

  estado: "activo" | "inactivo" | "suspendido"

  notas?: string
}

// Work Order (Órdenes de Trabajo)
export interface WorkOrder extends BaseDocument {
  // Identificación
  folio: string
  tipo: "preventivo" | "correctivo" | "predictivo" | "mejora"

  // Equipo
  equipoId: string
  equipoNombre: string
  equipoCodigo: string
  equipoPlanta: string

  // Si proviene de un preventivo
  preventivo?: {
    preventivoId: string
    preventivoCodigo: string
    preventivoNombre: string
    generadoAutomaticamente: boolean
  }

  // Estado y prioridad
  estado: "draft" | "programada" | "en_proceso" | "completada" | "cancelada"
  prioridad: "baja" | "media" | "alta" | "urgente"

  // Fechas
  fechaCreacion: Timestamp | string
  fechaProgramada: Timestamp | string
  fechaInicio?: Timestamp | string
  fechaFinalizacion?: Timestamp | string

  // Asignación
  tecnicoAsignadoId?: string
  tecnicoAsignadoNombre?: string
  tecnicoEjecutorId?: string // Puede ser diferente al asignado
  tecnicoEjecutorNombre?: string

  // Descripción del trabajo
  descripcionProblema?: string // Para correctivos
  actividades: WorkOrderActivity[] // Checklist con evidencias

  // Refacciones utilizadas
  refacciones?: WorkOrderSparePart[]

  // Tiempos
  tiempoEstimado?: number // minutos
  tiempoReal?: number // minutos
  tiempoParoEquipo?: number // minutos de paro operacional

  // Costos
  costoManoObra: number
  costoRefacciones: number
  costoParo: number // Costo del tiempo de paro
  costoTotal: number

  // Resultados y evidencias
  observaciones?: string
  evidencias?: {
    tipo: "foto" | "documento" | "video"
    url: string
    descripcion?: string
    timestamp: Timestamp | string
  }[]

  // Aprobación y firma
  requiereAprobacion: boolean
  aprobadoPor?: string
  fechaAprobacion?: Timestamp | string

  // Lectura del equipo al momento del mantenimiento
  lecturaEquipo?: number

  notas?: string
}

export interface WorkOrderActivity {
  descripcion: string
  orden: number
  completada: boolean
  evidenciaRequerida: boolean
  evidenciaUrl?: string
  observaciones?: string
  completadaPor?: string
  fechaCompletada?: Timestamp | string
}

export interface WorkOrderSparePart {
  productoId: string
  sku: string
  nombre: string
  cantidad: number
  unidad: string
  costoUnitario: number
  costoTotal: number
  almacenId?: string // De qué almacén se tomó
  almacenNombre?: string
  movimientoId?: string // ID del movimiento de inventario generado
  lote?: string
  serie?: string
}

// Equipment Reading (Lecturas de Equipos)
export interface EquipmentReading extends BaseDocument {
  // Equipo
  equipoId: string
  equipoNombre: string
  equipoCodigo: string

  // Lectura
  fecha: Timestamp | string
  lectura: number
  unidad: string // "hrs", "km", "ciclos"

  // Registro
  registradoPor: string
  registradoPorNombre: string

  // Observaciones
  estadoEquipo?: "operativo" | "alerta" | "falla"
  observaciones?: string

  // Imagen de evidencia (opcional)
  evidenciaUrl?: string
}

// Maintenance Technician (Técnicos de Mantenimiento)
export interface MaintenanceTechnician extends BaseDocument {
  // Datos personales
  nombre: string
  email?: string
  telefono?: string

  // Especialidades
  especialidades: string[] // "Mecánica", "Eléctrica", "Electrónica", "Neumática", etc.
  certificaciones?: string[]

  // Asignación
  plantas: string[] // En qué plantas puede trabajar
  disponible: boolean

  // Estadísticas
  otsCompletadas: number
  otsEnProceso: number
  promedioTiempoRespuesta?: number // minutos

  estado: "activo" | "inactivo" | "vacaciones"

  notas?: string
}

// Declare missing interfaces
interface Attachment {
  id: string
  filename: string
  url: string
}

interface Note {
  id: string
  content: string
  timestamp: Timestamp | string
}

interface Activity {
  id: string
  description: string
  timestamp: Timestamp | string
  userId?: string
  userName?: string
}

export interface Employee extends BaseDocument {
  numeroEmpleado: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  rfc: string
  curp: string
  nss: string
  fechaNacimiento: Timestamp | string
  fechaIngreso: Timestamp | string
  fechaBaja?: Timestamp | string
  departamento: string
  puesto: string
  nivelPuesto: string
  tipoContrato: "planta" | "temporal" | "honorarios" | "outsourcing"
  salarioDiario: number
  salarioMensual: number
  moneda: "MXN" | "USD"
  bancoId?: string
  cuentaBancaria?: string
  clabe?: string
  email: string
  telefono: string
  direccion?: string
  ciudad?: string
  entidadFederativa?: string
  codigoPostal?: string
  contactoEmergencia?: string
  telefonoEmergencia?: string
  estado: "activo" | "inactivo" | "suspendido" | "baja"
  foto?: string
  notas?: string
}

export interface PayrollPeriod extends BaseDocument {
  periodo: string // e.g., "2026-01" or "2026-Q1-15"
  tipo: "quincenal" | "mensual" | "semanal"
  fechaInicio: Timestamp | string
  fechaFin: Timestamp | string
  fechaPago: Timestamp | string
  estado: "borrador" | "calculada" | "autorizada" | "pagada" | "cerrada"
  totalNomina: number
  totalPercepciones: number
  totalDeducciones: number
  totalEmpleados: number
  autorizadaPor?: string
  fechaAutorizacion?: Timestamp | string
  notas?: string
}

export interface PayrollReceipt extends BaseDocument {
  periodoId: string
  periodo: string
  empleadoId: string
  empleadoNombre: string
  numeroEmpleado: string
  fechaPago: Timestamp | string
  diasTrabajados: number
  salarioDiario: number
  percepciones: PayrollConcept[]
  deducciones: PayrollConcept[]
  totalPercepciones: number
  totalDeducciones: number
  netoAPagar: number
  estado: "borrador" | "calculado" | "pagado" | "cancelado"
  metodoPago: "transferencia" | "efectivo" | "cheque"
  cuentaBancariaId?: string
  referenciaPago?: string
  xmlUrl?: string
  pdfUrl?: string
  timbrado: boolean
  fechaTimbrado?: Timestamp | string
  uuid?: string
  notas?: string
}

export interface PayrollConcept {
  clave: string
  concepto: string
  tipo: "percepcion" | "deduccion"
  monto: number
  gravado: boolean
  base?: number
}

export interface AttendanceRecord extends BaseDocument {
  empleadoId: string
  empleadoNombre: string
  fecha: Timestamp | string
  horaEntrada?: Timestamp | string
  horaSalida?: Timestamp | string
  horasTrabajadas: number
  horasExtra: number
  tipo: "normal" | "falta" | "permiso" | "vacaciones" | "incapacidad"
  justificada: boolean
  notas?: string
}

export interface VacationRequest extends BaseDocument {
  empleadoId: string
  empleadoNombre: string
  fechaSolicitud: Timestamp | string
  fechaInicio: Timestamp | string
  fechaFin: Timestamp | string
  diasSolicitados: number
  diasDisponibles: number
  motivo?: string
  estado: "pendiente" | "aprobada" | "rechazada" | "cancelada"
  aprobadaPor?: string
  fechaAprobacion?: Timestamp | string
  comentarios?: string
}

export interface PerformanceReview extends BaseDocument {
  empleadoId: string
  empleadoNombre: string
  periodo: string
  fecha: Timestamp | string
  evaluadorId: string
  evaluadorNombre: string
  calificaciones: ReviewScore[]
  calificacionTotal: number
  fortalezas?: string
  areasDeOportunidad?: string
  objetivos?: string
  comentarios?: string
  estado: "borrador" | "completada" | "aprobada"
}

export interface ReviewScore {
  categoria: string
  calificacion: number // 1-5
  peso: number
  comentario?: string
}

export interface EcommerceProduct extends BaseDocument {
  status?: string
  productoId: string // Reference to main product
  sku: string
  nombre: string
  descripcion: string
  categoriaId?: string
  categoriaNombre?: string
  precio: number
  precioOriginal?: number // For showing discounts
  moneda: "MXN" | "USD"
  imagenes: string[]
  imagenPrincipal: string
  variantes: ProductVariant[] // Color, size, etc.
  atributos: Record<string, string>
  stock: number // From inventory
  almacenId: string // Source warehouse
  disponible: boolean
  publicado: boolean
  fechaPublicacion?: Timestamp | string
  destacado: boolean
  orden?: number
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  etiquetas: string[]
  calificacionPromedio: number
  numeroReviews: number
}

export interface EcommerceOrder extends BaseDocument {
  folio: string
  clienteId?: string // Registered customer
  clienteEmail: string
  clienteNombre: string
  clienteTelefono: string
  direccionEnvio: ShippingAddress
  direccionFacturacion?: BillingAddress
  items: EcommerceOrderItem[]
  subtotal: number
  iva: number
  envio: number
  descuento: number
  total: number
  moneda: "MXN" | "USD"
  estadoPedido: "pendiente" | "confirmado" | "preparando" | "enviado" | "entregado" | "cancelado"
  estadoPago: "pendiente" | "pagado" | "rechazado" | "reembolsado"
  metodoPago: "tarjeta" | "transferencia" | "paypal" | "stripe" | "mercadopago" | "contra_entrega"
  referenciaPago?: string
  fechaPedido: Timestamp | string
  fechaPago?: Timestamp | string
  fechaEnvio?: Timestamp | string
  fechaEntrega?: Timestamp | string
  rastreo?: string
  paqueteria?: string
  ordenVentaId?: string // Link to internal sales order
  remisionId?: string
  facturaId?: string
  requiereFactura: boolean
  datosFacturacion?: FacturaData
  notas?: string
}

export interface EcommerceOrderItem {
  productoId: string
  varianteId?: string
  sku: string
  nombre: string
  imagen: string
  precio: number
  subtotal: number
  atributos?: Record<string, string>
}

export interface ShippingAddress {
  nombre: string
  direccion: string
  colonia?: string
  ciudad: string
  estado: string
  codigoPostal: string
  pais: string
  telefono: string
  referencia?: string
}

export interface BillingAddress {
  razonSocial: string
  rfc: string
  direccion: string
  colonia?: string
  ciudad: string
  estado: string
  codigoPostal: string
  pais: string
  email: string
}

export interface FacturaData {
  razonSocial: string
  rfc: string
  usoCFDI: string
  direccion: string
  email: string
}

export interface EcommerceCustomer extends BaseDocument {
  email: string
  nombre: string
  apellidos: string
  telefono: string
  fechaRegistro: Timestamp | string
  ultimaCompra?: Timestamp | string
  totalCompras: number
  numeroOrdenes: number
  direcciones: ShippingAddress[]
  datosFacturacion?: BillingAddress
  preferencias?: {
    newsletter: boolean
    notificaciones: boolean
  }
  estado: "activo" | "inactivo"
}

export interface ShoppingCart extends BaseDocument {
  sessionId?: string // For guest users
  clienteId?: string // For registered users
  items: CartItem[]
  subtotal: number
  fechaCreacion: Timestamp | string
  fechaActualizacion: Timestamp | string
  expiraEn: Timestamp | string
}

export interface CartItem {
  productoId: string
  varianteId?: string
  sku: string
  nombre: string
  imagen: string
  precio: number
  cantidad: number
  subtotal: number
  disponible: boolean
}

export interface ProductReview extends BaseDocument {
  productoId: string
  clienteId?: string
  clienteNombre: string
  clienteEmail: string
  calificacion: number // 1-5
  titulo: string
  comentario: string
  verificado: boolean // Verified purchase
  util: number // Helpful votes
  fechaCompra?: Timestamp | string
  respuestaVendedor?: string
  fechaRespuesta?: Timestamp | string
  estado: "pendiente" | "aprobado" | "rechazado"
}

export interface Promotion extends BaseDocument {
  codigo: string
  nombre: string
  descripcion: string
  tipo: "porcentaje" | "monto_fijo" | "envio_gratis" | "2x1"
  valor: number
  moneda?: "MXN" | "USD"
  fechaInicio: Timestamp | string
  fechaFin: Timestamp | string
  usoMaximo?: number
  usoActual: number
  usoPorCliente?: number
  montoMinimo?: number
  productosAplicables?: string[]
  categoriasAplicables?: string[]
  estado: "activa" | "inactiva" | "expirada"
  publico: boolean
}

export interface SupplierCatalog extends BaseDocument {
  proveedorId: string
  proveedorNombre: string
  productoId?: string // Link to internal product if exists
  sku: string
  codigoProveedor: string
  nombre: string
  descripcion: string
  categoria: string
  unidad: string
  precio: number
  moneda: "MXN" | "USD" | "EUR"
  leadTime: number // Days
  cantidadMinima: number
  cantidadMaxima?: number
  disponible: boolean
  imagenUrl?: string
  especificaciones?: string
  certificaciones?: string[]
  ultimaActualizacion: Timestamp | string
}

export interface PurchaseRequisition extends BaseDocument {
  folio: string
  departamento: string
  solicitante: string
  solicitanteId: string
  fechaSolicitud: Timestamp | string
  fechaRequerida: Timestamp | string
  items: RequisitionItem[]
  justificacion: string
  presupuesto?: number
  estado: "borrador" | "enviada" | "aprobada" | "rechazada" | "procesada" | "cancelada"
  aprobadores: Approver[]
  ordenCompraId?: string
  prioridad: "baja" | "media" | "alta" | "urgente"
  proyecto?: string
  centroCostos?: string
  notas?: string
}

export interface RequisitionItem {
  productoId?: string
  sku?: string
  descripcion: string
  cantidad: number
  unidad: string
  precioEstimado: number
  total: number
  proveedorSugerido?: string
  especificaciones?: string
}

export interface Approver {
  usuarioId: string
  nombre: string
  rol: string
  nivel: number
  estado: "pendiente" | "aprobado" | "rechazado"
  fecha?: Timestamp | string
  comentarios?: string
}

export interface RFQ extends BaseDocument {
  folio: string
  titulo: string
  descripcion: string
  items: RFQItem[]
  requisicionId?: string
  proveedoresInvitados: string[]
  fechaEmision: Timestamp | string
  fechaCierre: Timestamp | string
  estado: "borrador" | "publicada" | "cerrada" | "adjudicada" | "cancelada"
  cotizacionesRecibidas: number
  criteriosEvaluacion: EvaluationCriteria[]
  adjudicadaA?: string
  notas?: string
}

export interface RFQItem {
  productoId?: string
  sku?: string
  descripcion: string
  cantidad: number
  unidad: string
  especificaciones?: string
  archivosAdjuntos?: string[]
}

export interface EvaluationCriteria {
  criterio: string
  peso: number // Percentage
}

export interface SupplierQuotation extends BaseDocument {
  rfqId: string
  rfqFolio: string
  proveedorId: string
  proveedorNombre: string
  fechaEnvio: Timestamp | string
  fechaValidez: Timestamp | string
  items: QuotationItem[]
  subtotal: number
  iva: number
  total: number
  moneda: "MXN" | "USD" | "EUR"
  terminosPago: string
  tiempoEntrega: number // Days
  garantia?: string
  validez: number // Days
  estado: "recibida" | "evaluando" | "aceptada" | "rechazada"
  evaluacion?: QuotationEvaluation
  archivoUrl?: string
  notas?: string
}

export interface QuotationItem {
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  subtotal: number
  especificaciones?: string
}

export interface QuotationEvaluation {
  puntuacionPrecio: number
  puntuacionCalidad: number
  puntuacionEntrega: number
  puntuacionTerminos: number
  puntuacionTotal: number
  comentarios?: string
  evaluadoPor: string
  fechaEvaluacion: Timestamp | string
}

export interface ContractAgreement extends BaseDocument {
  folio: string
  tipo: "suministro" | "servicio" | "marco" | "confidencialidad"
  proveedorId: string
  proveedorNombre: string
  titulo: string
  descripcion: string
  fechaInicio: Timestamp | string
  fechaFin: Timestamp | string
  monto: number
  moneda: "MXN" | "USD" | "EUR"
  terminosPago: string
  renovacionAutomatica: boolean
  productos: string[]
  clausulas?: string
  archivoUrl?: string
  estado: "borrador" | "vigente" | "por_vencer" | "vencido" | "cancelado"
  responsable: string
  alertaDias?: number
  notas?: string
}

export interface ReportTemplate extends BaseDocument {
  nombre: string
  descripcion: string
  categoria: "ventas" | "compras" | "inventario" | "financiero" | "produccion" | "rrhh" | "custom"
  tipo: "dashboard" | "reporte" | "grafica"
  configuracion: ReportConfig
  columnas?: ReportColumn[]
  filtros?: ReportFilter[]
  compartido: boolean
  publico: boolean
  creadoPor: string
  favoritoParaUsuarios: string[]
}

export interface ReportConfig {
  fuenteDatos: string[] // Collection names
  agrupacion?: string[]
  ordenamiento?: string[]
  limiteRegistros?: number
  actualizacionAutomatica: boolean
  intervaloActualizacion?: number // Minutes
}

export interface ReportColumn {
  campo: string
  etiqueta: string
  tipo: "texto" | "numero" | "moneda" | "fecha" | "porcentaje"
  agregacion?: "sum" | "avg" | "count" | "min" | "max"
  visible: boolean
  orden: number
}

export interface ReportFilter {
  campo: string
  operador: "igual" | "diferente" | "mayor" | "menor" | "contiene" | "entre"
  valor: any
  activo: boolean
}

export interface DashboardConfig extends BaseDocument {
  nombre: string
  descripcion: string
  widgets: DashboardWidget[]
  layout: LayoutConfig
  compartido: boolean
  publico: boolean
  creadoPor: string
  usuariosConAcceso: string[]
  predeterminado: boolean
}

export interface DashboardWidget {
  id: string
  tipo: "kpi" | "grafica" | "tabla" | "mapa" | "gauge"
  titulo: string
  reporteId?: string
  configuracion: any
  posicion: { x: number; y: number; w: number; h: number }
}

export interface LayoutConfig {
  columnas: number
  filas: number
  responsive: boolean
}

export interface PayrollRun extends BaseDocument {
  periodoId: string
  periodo: string
  fechaInicio: Timestamp | string
  fechaFin: Timestamp | string
  fechaPago: Timestamp | string
  estado: "borrador" | "calculando" | "calculada" | "autorizada" | "pagada" | "cerrada" | "cancelada"
  recibos: string[] // PayrollReceipt IDs
  totalNomina: number
  totalPercepciones: number
  totalDeducciones: number
  totalEmpleados: number
  totalISR: number
  totalIMSS: number
  autorizadoPor?: string
  fechaAutorizacion?: Timestamp | string
  pagadoPor?: string
  fechaPagoReal?: Timestamp | string
  metodoPago: "transferencia" | "efectivo" | "cheque"
  // Accounting integration
  polizaGenerada: boolean
  journalEntryId?: string
  notas?: string
}

export interface TimeEntry extends BaseDocument {
  empleadoId: string
  empleadoNombre: string
  numeroEmpleado: string
  fecha: Timestamp | string
  horaEntrada?: Timestamp | string | null
  horaSalida?: Timestamp | string | null
  horasTrabajadas: number
  horasExtra: number
  tipoRegistro: "normal" | "falta" | "retardo" | "permiso" | "vacaciones" | "incapacidad"
  autorizado: boolean
  autorizadoPor?: string
  notas?: string
}

export interface Incident extends BaseDocument {
  empleadoId: string
  empleadoNombre: string
  numeroEmpleado: string
  tipo: "falta" | "retardo" | "permiso" | "vacaciones" | "incapacidad" | "suspension" | "otro"
  fechaInicio: Timestamp | string
  fechaFin: Timestamp | string
  dias: number
  horas?: number
  motivo: string
  descripcion?: string
  documentoUrl?: string
  estado: "pendiente" | "aprobada" | "rechazada" | "cancelada"
  solicitadoPor: string
  fechaSolicitud: Timestamp | string
  aprobadoPor?: string
  fechaAprobacion?: Timestamp | string
  comentariosAprobador?: string
  afectaNomina: boolean
  notas?: string
}

export interface BenefitDeduction extends BaseDocument {
  // Campos legacy del diálogo de conceptos
  porcentaje?: number
  tipocalculo?: string
  monto?: number
  tipo: "prestacion" | "deduccion"
  clave: string
  nombre: string
  descripcion?: string
  categoriaISR: "gravado" | "exento" | "mixto"
  categoriaIMSS: boolean
  formula?: string // e.g., "salarioDiario * 0.1"
  esObligatorio: boolean
  esRecurrente: boolean
  aplicaATodos: boolean
  empleadosAplicables?: string[] // Employee IDs if not aplicaATodos
  montoFijo?: number
  porcentajeSalario?: number
  activo: boolean
  orden: number
}

export interface Candidate extends BaseDocument {
  /** Alias legacy de posición */
  puesto?: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  telefono: string
  puestoSolicitado: string
  departamento: string
  salarioDeseado?: number
  cvUrl?: string
  fotoUrl?: string
  etapa:
    | "nuevo"
    | "contacto_inicial"
    | "entrevista_rh"
    | "entrevista_tecnica"
    | "evaluacion"
    | "oferta"
    | "contratado"
    | "rechazado"
  fechaAplicacion: Timestamp | string
  fechaEntrevista?: Timestamp | string | null
  entrevistadoPor?: string
  calificacion?: number // 0-100
  fortalezas?: string
  debilidades?: string
  comentarios?: string
  estatus: "activo" | "contratado" | "rechazado" | "retirado"
  fechaContratacion?: Timestamp | string | null
  empleadoId?: string // If hired
  razonRechazo?: string
  notas?: string
}

export interface TrainingCourse extends BaseDocument {
  nombre: string
  descripcion?: string
  tipo: "obligatorio" | "opcional" | "certificacion"
  categoria: "seguridad" | "tecnico" | "soft_skills" | "cumplimiento" | "otro"
  instructor?: string
  duracionHoras: number
  fechaInicio: Timestamp | string
  fechaFin: Timestamp | string
  lugar: "presencial" | "virtual" | "hibrido"
  ubicacion?: string
  enlaceVirtual?: string
  cupoMaximo?: number
  empleadosInscritos: string[] // Employee IDs
  empleadosCompletados: string[] // Employee IDs
  costo?: number
  proveedor?: string
  materialUrl?: string
  certificadoUrl?: string
  estado: "planificado" | "inscripcion" | "en_curso" | "completado" | "cancelado"
  evaluacionRequerida: boolean
  calificacionMinima?: number
  notas?: string
}

// ============================================================================
// BUSINESS INTELLIGENCE MODULE
// ============================================================================

export interface BIQuery extends BaseDocument {
  // Alias inglés usados por componentes BI
  name?: string
  description?: string
  nombre: string
  descripcion?: string
  categoria: "ventas" | "inventario" | "compras" | "financiero" | "rrhh" | "produccion" | "custom"
  // Data source configuration
  dataSource: string // Collection name: "salesOrders", "stockMovements", etc.
  fields: string[] // Fields to include
  filters: BIFilter[]
  aggregations: BIAggregation[]
  sorting?: BISorting[]
  limit?: number
  // Execution
  ultimaEjecucion?: Timestamp | string | null
  resultados?: number
  tiempoEjecucion?: number // milliseconds
  estado: "activa" | "pausada" | "error"
  errorMessage?: string
  // Ownership
  creadoPor: string
  compartida: boolean
  favorita: boolean
  userId: string
  status: "active" | "inactive"
}

export interface BIFilter {
  campo: string
  operador: "igual" | "diferente" | "mayor" | "menor" | "mayor_igual" | "menor_igual" | "contiene" | "entre" | "en"
  valor: any
  valorFin?: any // For "entre"
  activo: boolean
}

export interface BIAggregation {
  campo: string
  funcion: "sum" | "avg" | "count" | "min" | "max" | "count_distinct"
  alias: string
}

export interface BISorting {
  campo: string
  direccion: "asc" | "desc"
}

export interface BIDashboard extends BaseDocument {
  nombre: string
  descripcion?: string
  categoria: "ventas" | "operaciones" | "financiero" | "ejecutivo" | "custom"
  widgets: BIWidget[]
  layout: "grid" | "flex"
  columnas: number
  // Refresh settings
  autoRefresh: boolean
  refreshInterval?: number // minutes
  ultimaActualizacion?: Timestamp | string | null
  // Ownership
  creadoPor: string
  compartido: boolean
  publico: boolean
  favorito: boolean
  predeterminado: boolean
  userId: string
  status: "active" | "inactive"
}

export interface BIWidget {
  id: string
  tipo: "kpi" | "chart" | "table" | "map"
  titulo: string
  subtitulo?: string
  // Data configuration
  queryId?: string // Reference to BIQuery
  dataSource?: string // Or inline data source
  filters?: BIFilter[]
  aggregations?: BIAggregation[]
  // Chart specific
  chartType?: "bar" | "line" | "pie" | "area" | "donut" | "scatter"
  xAxis?: string
  yAxis?: string
  groupBy?: string
  // KPI specific
  valor?: number
  meta?: number
  unidad?: string
  tendencia?: "up" | "down" | "neutral"
  porcentajeCambio?: number
  // Layout
  posicion: { x: number; y: number; w: number; h: number }
  color?: string
}

export interface BIReport extends BaseDocument {
  // Alias/campos usados por componentes BI
  name?: string
  format?: string
  schedule?: { frequency?: "daily" | "weekly" | "monthly"; nextRun?: string | null }
  recipients?: string[]
  nombre: string
  descripcion?: string
  categoria: "ventas" | "inventario" | "compras" | "financiero" | "rrhh" | "custom"
  tipo: "automatico" | "bajo_demanda"
  // Query configuration
  queryId?: string
  dashboardId?: string
  dataSource?: string
  filters?: BIFilter[]
  // Schedule (for automatic reports)
  programado: boolean
  frecuencia?: "diario" | "semanal" | "mensual" | "trimestral"
  diaSemana?: number // 0-6 for weekly
  diaMes?: number // 1-31 for monthly
  hora: string // "HH:MM"
  // Recipients
  destinatarios: string[] // Emails
  formato: "pdf" | "excel" | "csv"
  // Status
  ultimaEjecucion?: Timestamp | string | null
  proximaEjecucion?: Timestamp | string | null
  estado: "activo" | "pausado" | "error"
  errorMessage?: string
  // Ownership
  creadoPor: string
  userId: string
  status: "active" | "inactive" | "paused"
}

export interface BIExport extends BaseDocument {
  tipo: "query" | "dashboard" | "report"
  referenceId: string
  referenceName: string
  formato: "pdf" | "excel" | "csv"
  estado: "generando" | "completado" | "error"
  progreso: number // 0-100
  tamano?: number // bytes
  urlDescarga?: string
  fechaExpiracion?: Timestamp | string
  errorMessage?: string
  creadoPor: string
  userId: string
}

// Calendar Events
export interface CalendarEvent extends BaseDocument {
  title: string
  description?: string
  startDate: Timestamp | string
  endDate: Timestamp | string
  allDay: boolean
  eventType: "reunion" | "cita" | "tarea" | "recordatorio"
  location?: string
  attendees?: string[]
  invitedUserIds?: string[]
  invitedNames?: string[]
  invitedEmails?: string[]
  ownerId?: string
  clientId?: string
  clientName?: string
  leadId?: string
  leadName?: string
  status: "programado" | "completado" | "cancelado"
  color?: string
}


// ============================================================
// Tipos portados del repositorio donante (v0-flower-shop-erp-ricky)
// Los hooks/componentes del oficial ya los importaban pero no existían
// (ver docs/REPOSITORY_COMPARISON_AND_PORTING_PLAN.md)
// ============================================================

export interface AccountPayable extends BaseDocument {
  [key: string]: any
  proveedorId: string
  proveedorNombre: string
  facturaProveedor: string // Supplier invoice number
  ordenCompraId?: string
  recepcionId?: string
  fecha: Timestamp | string
  fechaVencimiento: Timestamp | string
  montoOriginal: number
  montoPagado: number
  saldo: number
  moneda: "MXN" | "USD" | "EUR"
  estado: "pendiente" | "parcial" | "pagada" | "vencida"
  autorizada: boolean
  autorizadoPor?: string
  pagos: SupplierPayment[]
  notas?: string
}

export interface AccountReceivable extends BaseDocument {
  [key: string]: any
  clienteId: string
  clienteNombre: string
  documentoId?: string // Reference to invoice or document
  documentoFolio?: string
  monto: number
  montoOriginal: number
  montoPagado: number
  saldo: number
  fechaEmision: Timestamp | string
  fechaVencimiento: Timestamp | string
  estado: "pendiente" | "parcial" | "pagada" | "vencida"
  pagos: Payment[]
  notas?: string
}

export interface BankAccount extends BaseDocument {
  [key: string]: any
  banco: string // Bank name
  alias: string // Friendly name for the account
  numeroEnmascarado: string // Masked number (e.g., "****1234")
  numeroCompleto?: string // Full account number (encrypted)
  tipo: "cheques" | "inversion" | "ahorro" | "nomina"
  moneda: "MXN" | "USD" | "EUR"
  saldoInicial: number
  saldoActual: number
  estado: "activa" | "inactiva" | "suspendida"
  clabe?: string
  sucursal?: string
  ejecutivo?: string
  notas?: string
}

export interface BankStatement extends BaseDocument {
  [key: string]: any
  cuentaId: string
  periodo: string // YYYY-MM format
  fechaInicio: Timestamp | string
  fechaFin: Timestamp | string
  archivoUrl?: string // Storage link to uploaded CSV/PDF
  archivoNombre?: string
  saldoInicial: number
  saldoFinal: number
  totalIngresos: number
  totalEgresos: number
  estado: "procesando" | "conciliado" | "parcial"
  transaccionesConciliadas: number
  transaccionesPendientes: number
  diferencia: number
}

export interface BankTransaction extends BaseDocument {
  [key: string]: any
  cuentaId: string // Reference to BankAccount
  tipo: "ingreso" | "egreso" | "transferencia"
  concepto: string
  monto: number
  fecha: Timestamp | string
  referencia?: string
  origen?: string // For transfers
  destino?: string // For transfers
  categoria?: string
  conciliado: boolean
  conciliadoFecha?: Timestamp | string
  notas?: string
}

export interface BankTransfer extends BaseDocument {
  [key: string]: any
  tipo: "interna" | "externa" | "spei" | "internacional"
  cuentaOrigenId: string
  cuentaDestinoId?: string // For internal transfers
  beneficiario: string
  clabe?: string
  banco?: string
  monto: number
  moneda: "MXN" | "USD" | "EUR"
  fechaProgramada: Timestamp | string
  fechaEjecutada?: Timestamp | string
  referencia?: string
  concepto: string
  estado: "programada" | "procesando" | "completada" | "fallida" | "cancelada"
  comision?: number
  layoutGenerado: boolean
  layoutUrl?: string // Link to generated file
  notas?: string
}

export interface CFDI extends BaseDocument {
  [key: string]: any
  clienteId: string
  clienteNombre: string
  clienteRFC: string
  folio: string
  uuid?: string // After "timbrado"
  serie?: string
  fecha: Timestamp | string
  subtotal: number
  iva: number
  total: number
  moneda: "MXN" | "USD"
  tipoCambio?: number
  formaPago: string
  metodoPago: string
  usoCFDI: string
  items: CFDIItem[]
  estado: "pendiente" | "timbrada" | "cancelada"
  xmlUrl?: string
  pdfUrl?: string
  fechaTimbrado?: Timestamp | string
  fechaCancelacion?: Timestamp | string
  motivoCancelacion?: string
}

export interface CashFlowPeriod {
  [key: string]: any
  periodo: string // Week/Month identifier
  fechaInicio: Date
  fechaFin: Date
  ingresosReales: number
  ingresosProyectados: number
  egresosReales: number
  egresosProyectados: number
  saldoInicial: number
  saldoFinal: number
  saldoProyectado: number
}

export interface Check extends BaseDocument {
  [key: string]: any
  numero: string
  cuentaId: string // Reference to BankAccount
  beneficiario: string
  monto: number
  fechaEmision: Timestamp | string
  fechaCobro?: Timestamp | string
  concepto: string
  estado: "emitido" | "entregado" | "cobrado" | "cancelado"
  notas?: string
}

export interface CustomerDocument extends BaseDocument {
  [key: string]: any
  clienteId: string
  clienteNombre: string
  tipo: "cotizacion" | "pedido" | "remision" | "factura" | "nota_credito"
  folio: string
  fecha: Timestamp | string
  monto: number
  estado: "borrador" | "enviada" | "aceptada" | "rechazada" | "cancelada"
  items: DocumentItem[]
  archivoUrl?: string
  notas?: string
}

export interface FieldServiceMetrics {
  [key: string]: any
  serviciosActivos: number
  tecnicosEnCampo: number
  serviciosDelMes: number
  tiempoPromedioHoras: number
  serviciosPorEstado: Record<string, number>
  serviciosPorPrioridad: Record<string, number>
  eficienciaTecnicos: number // Percentage
  cumplimientoSLA: number // Percentage
}

export interface FieldServiceOrder extends BaseDocument {
  [key: string]: any
  folio: string // SRV-001
  clienteId: string
  clienteNombre: string
  contacto: string
  telefono: string
  direccion: string
  ciudad?: string
  entidadFederativa?: string
  codigoPostal?: string
  latitud: number
  longitud: number
  tipo: "mantenimiento" | "reparacion" | "instalacion" | "inspeccion" | "emergencia"
  categoria: string
  descripcion: string
  prioridad: "baja" | "media" | "alta" | "urgente"
  estado: "nuevo" | "asignado" | "en_ruta" | "en_sitio" | "finalizado" | "cancelado" | "draft" | "completado"
  slaHoras: number
  fechaCreacion: Timestamp | string
  fechaProgramada: Timestamp | string
  ventanaInicio?: string // e.g., "08:00"
  ventanaFin?: string // e.g., "12:00"
  tecnicoId?: string
  tecnicoNombre?: string
  checkIn?: Timestamp | string
  checkOut?: Timestamp | string
  duracionMinutos?: number
  evidencias: ServiceEvidence[]
  firmaCliente?: string
  checklist: ChecklistItem[]
  refacciones: RefaccionUsada[]
  costoServicio: number
  costoRefacciones: number
  costoTotal: number
  notas: string
  bitacora: ServiceLogEntry[]
}

export interface FieldTechnician extends BaseDocument {
  [key: string]: any
  nombre: string
  email: string
  telefono: string
  especialidades: string[]
  zona: string
  disponibilidad: "disponible" | "en_servicio" | "no_disponible" | "descanso"
  rating: number // 0-5
  totalServicios: number
  serviciosCompletados: number
  unidad?: string // Vehicle info
  placas?: string
  latitudActual?: number
  longitudActual?: number
  ultimaActualizacion?: Timestamp | string
  certificaciones?: string[]
  nivelExperiencia: "junior" | "mid" | "senior"
}

export interface GoodsReceipt extends BaseDocument {
  [key: string]: any
  folio: string
  ordenCompraId: string
  ordenCompraFolio: string
  proveedorId: string
  proveedorNombre: string
  fecha: Timestamp | string
  items: GoodsReceiptItem[]
  estado: "completa" | "parcial" | "devolucion"
  facturaVinculada: boolean
  facturaId?: string
  notas?: string
}

export interface InventoryStock extends BaseDocument {
  [key: string]: any
  almacenId: string
  almacenNombre: string
  productoId: string
  productoNombre: string
  sku: string
  cantidadActual: number
  cantidadDisponible: number // Actual - Reserved
  cantidadReservada: number // For orders
  cantidadEnTransito: number // In transfer
  ubicacionFisica?: string // e.g., "A-01", "B-12"
  lote?: string
  fechaVencimiento?: Timestamp | string
  costoPromedio: number
  metodoValuacion: "promedio" | "PEPS" | "UEPS"
  minimoStock?: number
  maximoStock?: number
  puntoReorden?: number
  ultimaActualizacion: Timestamp | string
}

export interface Lead extends BaseDocument {
  [key: string]: any
  empresa: string
  contacto: string
  email: string
  telefono: string
  fuente: "web" | "referido" | "cold_call" | "evento" | "otro"
  etapa: "prospecto" | "contactado" | "calificado" | "propuesta" | "negociacion" | "cerrado" | "perdido"
  valorEstimado: number
  probabilidad: number // 0-100
  fechaCierre?: Timestamp | string
  notas?: string
  convertidoACliente: boolean
  clienteId?: string
}

export interface MaterialPlanning extends BaseDocument {
  [key: string]: any
  material: string
  materialId: string
  available: number
  required: number
  unit: string
  purchaseOrderId?: string
  status: "sufficient" | "pending" | "critical"
  lastUpdated: Timestamp | string
}

export interface PhysicalCount extends BaseDocument {
  [key: string]: any
  folio: string
  almacenId: string
  almacenNombre: string
  fechaConteo: Timestamp | string
  fechaCierre?: Timestamp | string
  estado: "en_progreso" | "completado" | "ajustado" | "finalizado"
  conteos: CountItem[]
  totalDiferencias: number
  valorDiferencias: number
  contadoPor: string
  supervisadoPor?: string
  notas?: string
}

export interface ProductFormula extends BaseDocument {
  [key: string]: any
  productId: string
  productName: string
  version: number
  components: FormulaComponent[]
  laborCost: number
  manufacturingCost: number
  totalCost: number
  isActive: boolean
  createdBy?: string
  approvedBy?: string
  approvedDate?: Timestamp | string
}

export interface ProductionOrder extends BaseDocument {
  [key: string]: any
  folio: string // PROD-001
  customerOrderId?: string // Link to sales order
  productId: string
  productName: string
  quantity: number
  completed: number
  status: "pending" | "in_process" | "completed" | "on_hold" | "cancelled"
  priority: "low" | "normal" | "high" | "urgent"
  startDate: Timestamp | string
  endDate: Timestamp | string
  scheduledStart?: Timestamp | string
  scheduledEnd?: Timestamp | string
  assignedTo?: string[] // Worker IDs
  formulaId?: string
  batchNumber?: string
  notes?: string
}

export interface ProductionResult extends BaseDocument {
  [key: string]: any
  productionOrderId: string
  orderNumber: string
  productName: string
  plannedQuantity: number
  producedQuantity: number
  secondQualityQuantity: number
  efficiency: number
  productionDate: Timestamp | string
  notes?: string
}

export interface PurchaseOrder extends BaseDocument {
  [key: string]: any
  folio: string
  proveedorId: string
  proveedorNombre: string
  fecha: Timestamp | string
  fechaEntrega: Timestamp | string
  subtotal: number
  iva: number
  total: number
  moneda: "MXN" | "USD" | "EUR"
  tolerancia: number // Percentage allowed variance
  estado: "borrador" | "autorizada" | "enviada" | "recibida_parcial" | "recibida_completa" | "cancelada"
  items: PurchaseOrderItem[]
  autorizadoPor?: string
  fechaAutorizacion?: Timestamp | string
  notas?: string
}

export interface QualityCertificate extends BaseDocument {
  [key: string]: any
  productId: string
  productName: string
  batchNumber: string
  productionOrderId: string
  inspectionDate: Timestamp | string
  inspector: string
  status: "approved" | "review" | "rejected"
  rating: number // 0-100
  defectsFound?: string[]
  notas?: string
}

export interface ReconciliationItem extends BaseDocument {
  [key: string]: any
  estadoCuentaId: string
  transaccionSistemaId?: string
  fecha: Timestamp | string
  concepto: string
  montoSistema: number
  montoBanco: number
  diferencia: number
  estado: "conciliado" | "pendiente" | "diferencia"
  notas?: string
}

export interface RefaccionUsada {
  [key: string]: any
  id: string
  productoId?: string
  descripcion: string
  cantidad: number
  costoUnitario: number
  costoTotal: number
}

export interface ReorderRule extends BaseDocument {
  [key: string]: any
  almacenId: string
  productoId: string
  productoNombre: string
  sku: string
  minimoStock: number
  maximoStock: number
  puntoReorden: number
  cantidadOrden: number
  proveedorId?: string
  proveedorNombre?: string
  leadTime: number // Days
  activo: boolean
}

export interface ServiceMetrics {
  [key: string]: any
  totalTickets: number
  ticketsAbiertos: number
  ticketsEnProceso: number
  ticketsResueltos: number
  tiempoPromedioRespuesta: number // Hours
  tiempoPromedioResolucion: number // Hours
  satisfaccionPromedio: number // 1-5
  cumplimientoSLA: number // Percentage
  distribucionCanales: Record<string, number>
  distribucionCategorias: Record<string, number>
  distribucionSatisfaccion: Record<number, number> // Rating count
}

export interface ServiceTicket extends BaseDocument {
  [key: string]: any
  numero: string // TKT-001
  clienteId?: string
  clienteNombre: string
  canal: "whatsapp" | "email" | "telefono" | "portal" | "presencial"
  asunto: string
  descripcion: string
  categoria: string
  subcategoria?: string
  prioridad: "baja" | "media" | "alta" | "critica"
  estado: "abierto" | "en_proceso" | "en_espera" | "resuelto" | "cerrado"
  slaObjetivo: number // Hours
  fechaCreacion: Timestamp | string
  fechaUltimaActualizacion: Timestamp | string
  fechaPrimeraRespuesta?: Timestamp | string
  fechaResolucion?: Timestamp | string
  fechaCierre?: Timestamp | string
  agenteAsignado?: string
  departamento?: string
  etiquetas: string[]
  adjuntos: TicketAttachment[]
  notasInternas: TicketNote[]
  historial: TicketActivity[]
  calificacion?: number // 1-5 stars (CSAT)
  comentarioCliente?: string
  tiempoPrimeraRespuesta?: number // Minutes
  tiempoResolucion?: number // Minutes
  slaViolado: boolean
}

export interface StockMovement extends BaseDocument {
  [key: string]: any
  folio: string
  almacenId: string
  almacenNombre: string
  productoId: string
  productoNombre: string
  sku: string
  tipo: string // uniones divergentes entre generaciones (entrada/salida/ajuste/compra/venta/recepcion_compra/...)
  cantidad: number
  cantidadAnterior: number
  cantidadNueva: number
  costo?: number
  costoTotal?: number
  fecha: Timestamp | string
  referencia?: string // e.g., "OC-123", "FAC-456"
  motivo: string
  origenReferencia?: string // For transfers/returns
  destinoReferencia?: string
  transferenciaId?: string // Link to transfer if applicable
  usuarioId?: string
  usuarioNombre?: string
  notas?: string
}

export interface Supplier extends BaseDocument {
  [key: string]: any
  nombre: string
  razonSocial: string
  rfc: string
  email: string
  telefono: string
  direccion?: string
  ciudad?: string
  entidadFederativa?: string
  codigoPostal?: string
  pais: string
  contactoPrincipal: string
  cuentaBancaria?: string
  clabe?: string
  banco?: string
  diasCredito: number
  limiteCredito: number
  saldoPorPagar: number // Calculated from accountsPayable
  moneda: "MXN" | "USD" | "EUR"
  rating: number // 0-5
  estadoProveedor: "activo" | "inactivo" | "suspendido"
  categorias: string[] // Tags for categorization
  productosSuministrados: string[]
  comprasTotales: number
  ultimaCompra?: Timestamp | string
  leadTime?: number // Days
  notas?: string
}

export interface SupplierDocument extends BaseDocument {
  [key: string]: any
  proveedorId: string
  proveedorNombre: string
  tipo: "factura" | "contrato" | "cotizacion" | "orden" | "recepcion" | "otro"
  folio: string
  fecha: Timestamp | string
  monto?: number
  moneda: "MXN" | "USD" | "EUR"
  archivoUrl?: string // Storage link
  archivoNombre?: string
  estado: "activo" | "archivado" | "cancelado"
  notas?: string
}

export interface SupplierProduct extends BaseDocument {
  [key: string]: any
  proveedorId: string
  proveedorNombre: string
  sku: string
  nombre: string
  descripcion?: string
  unidadMedida: string
  moneda: "MXN" | "USD" | "EUR"
  costoUltimo: number
  costoPromedio?: number
  leadTime?: number // Days
  cantidadMinima?: number
  activo: boolean
  ultimaActualizacion: Timestamp | string
  notas?: string
}

export interface TechnicianLocation extends BaseDocument {
  [key: string]: any
  tecnicoId: string
  tecnicoNombre: string
  latitud: number
  longitud: number
  precision?: number
  velocidad?: number
  rumbo?: number
  timestamp: Timestamp | string
  servicioActualId?: string
}

export interface Warehouse extends BaseDocument {
  [key: string]: any
  nombre: string
  codigo: string
  ubicacion: string
  ciudad?: string
  entidadFederativa?: string
  codigoPostal?: string
  responsable?: string
  telefono?: string
  email?: string
  tipo: "principal" | "sucursal" | "bodega" | "transito" | "consignacion"
  estado: "activo" | "inactivo" | "mantenimiento"
  capacidadM3?: number
  area?: number
  notas?: string
}

export interface WarehouseTransfer extends BaseDocument {
  [key: string]: any
  folio: string
  almacenOrigenId: string
  almacenOrigenNombre: string
  almacenDestinoId: string
  almacenDestinoNombre: string
  productos: TransferItem[]
  fechaSolicitud: Timestamp | string
  fechaEnvio?: Timestamp | string
  fechaRecepcion?: Timestamp | string
  estado: "solicitada" | "aprobada" | "en_transito" | "recibida" | "cancelada" | "completada"
  solicitadoPor: string
  aprobadoPor?: string
  recibidoPor?: string
  observaciones?: string
  motivoCancelacion?: string
}

export interface DocumentItem {
  [key: string]: any
  productoId?: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Payment {
  [key: string]: any
  id: string
  fecha: Timestamp | string
  monto: number
  metodoPago: "efectivo" | "transferencia" | "cheque" | "tarjeta"
  referencia?: string
  cuentaBancariaId?: string
  chequeId?: string
  notas?: string
}

export interface CFDIItem {
  [key: string]: any
  claveProdServ: string
  claveUnidad: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  importe: number
  objetoImp: string
}

export interface PurchaseOrderItem {
  [key: string]: any
  productoId?: string
  sku: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  cantidadRecibida: number
}

export interface GoodsReceiptItem {
  [key: string]: any
  productoId?: string
  sku: string
  descripcion: string
  cantidadOrdenada: number
  cantidadRecibida: number
  precioUnitario: number
}

export interface SupplierPayment {
  [key: string]: any
  id: string
  fecha: Timestamp | string
  monto: number
  metodoPago: "efectivo" | "transferencia" | "cheque" | "tarjeta"
  referencia?: string
  cuentaBancariaId?: string
  chequeId?: string
  notas?: string
}

export interface TransferItem {
  [key: string]: any
  productoId: string
  sku: string
  nombre: string
  cantidadSolicitada: number
  cantidadEnviada?: number
  cantidadRecibida?: number
  costo: number
}

export interface CountItem {
  [key: string]: any
  productoId: string
  sku: string
  nombre: string
  cantidadSistema: number
  cantidadFisica?: number
  diferencia: number
  costo: number
  valorDiferencia: number
  ubicacion?: string
  ajusteAplicado: boolean
}

export interface FormulaComponent {
  [key: string]: any
  materialId: string
  materialName: string
  quantity: number
  unit: string
  costPerUnit: number
}

export interface TicketAttachment {
  [key: string]: any
  id: string
  nombre: string
  url: string
  tipo: string
  tamanio: number
  fecha: Timestamp | string
  subidoPor: string
}

export interface TicketNote {
  [key: string]: any
  id: string
  fecha: Timestamp | string
  autor: string
  contenido: string
  interno: boolean
}

export interface TicketActivity {
  [key: string]: any
  id: string
  fecha: Timestamp | string
  usuario: string
  tipo: "creacion" | "actualizacion" | "comentario" | "asignacion" | "estado" | "resolucion" | "calificacion"
  descripcion: string
  campoModificado?: string
  valorAnterior?: string
  valorNuevo?: string
}

export interface ServiceEvidence {
  [key: string]: any
  id: string
  tipo: "foto_antes" | "foto_durante" | "foto_despues" | "documento"
  url: string
  descripcion?: string
  fecha: Timestamp | string
}

export interface ChecklistItem {
  [key: string]: any
  id: string
  descripcion: string
  completado: boolean
  observaciones?: string
}

export interface ServiceLogEntry {
  [key: string]: any
  id: string
  fecha: Timestamp | string
  usuario: string
  accion: string
  detalles?: string
}


// Tipos mínimos requeridos por hooks del oficial (no existían en ningún repo;
// forma abierta hasta validar el modelo con el módulo correspondiente)
export interface ProductoRetirado {
  [key: string]: any
  productId?: string
  cantidad?: number
}

export interface ReservedMaterial {
  [key: string]: any
  materialId?: string
  cantidad?: number
}

export interface ReturnLine {
  [key: string]: any
  productId?: string
  quantity?: number
}

export interface SalesInvoice {
  [key: string]: any
  id?: string
  folio?: string
  total?: number
}
