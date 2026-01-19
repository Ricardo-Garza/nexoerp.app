import type { Timestamp } from "firebase/firestore"

// Base interface for all documents
export interface BaseDocument {
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
  estado?: string
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
  deliveryDate?: Timestamp | string
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

  // Cancel/Return fields
  cancelReturnType?: "cancellation" | "return"
  cancelReturnReason?: string
  cancelReturnAt?: Timestamp | string
  cancelReturnBy?: string

  notes?: string
}

export interface SalesOrderItem {
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
  estado?: string
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
  fechaPago?: Timestamp | string
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
  status: "active" | "inactive"
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
