/**
 * Modelo de datos del Nexo Control Plane (multi-tenant real).
 *
 * Cada empresa es su propio universo aislado: un documento `tenants/{tenantId}`
 * con su branding, módulos activos, integraciones, fiscal y auditoría propia.
 * Ver docs/FIREBASE_DATA_MODEL.md y docs/NEXO_CONTROL_PLANE.md.
 */

import type { ErpPreferences, ErpTableDensity } from "./preferences"

/** Identificador de cada módulo del ERP que puede activarse por tenant. */
export type ModuleId =
  | "dashboard"
  | "clients"
  | "sales"
  | "invoicing"
  | "suppliers"
  | "inventory"
  | "catalog"
  | "priceLists"
  | "productsPricing"
  | "inventoryStock"
  | "lots"
  | "warehouse"
  | "pos"
  | "banking"
  | "production"
  | "maintenance"
  | "service"
  | "accounting"
  | "payroll"
  | "bi"
  | "crm"
  | "imports"
  | "webMobile"
  | "ecommerce"

export interface ModuleDefinition {
  id: ModuleId
  name: string
  description: string
  /** Ruta base dentro de /dashboard */
  href: string
  /** Grupo del menú lateral */
  group: "principal" | "operaciones" | "administracion" | "analitica" | "expansion"
  /** Estado de madurez para no vender humo (§6 del prompt de rescate) */
  maturity: "stable" | "beta" | "planned"
  /**
   * Módulos base que este módulo combinado reemplaza en el menú (p. ej.
   * "Productos y Precios" cubre catálogo + listas de precios). Un tenant con
   * el combinado activo no muestra los módulos cubiertos por separado.
   */
  combines?: ModuleId[]
}

/** Indicadores del dashboard que cada empresa puede activar y ordenar. */
export type DashboardIndicatorId =
  | "ventasMes"
  | "ventasPorCobrar"
  | "cotizacionesAbiertas"
  | "oportunidadesCrm"
  | "margenBruto"
  | "productosSinPrecio"
  | "stockBajo"
  | "inventarioDisponible"
  | "pedidosPendientes"
  | "facturasPendientes"
  | "cobranzaVencida"
  | "movimientosBancarios"
  | "topProductos"
  | "topClientes"
  | "actividadComercial"
  | "alertas"

export type TenantStatus = "active" | "trial" | "suspended" | "prospect"

export interface TenantBranding {
  logoText: string
  logoUrl?: string
  compactLogoUrl?: string
  primaryColor: string
  theme: "light" | "dark" | "system"
}

export interface TenantDocumentAppearance {
  logoUrl?: string
  accentColor: string
  footerText: string
  showFiscalAddress: boolean
  defaultExportFormat: "csv" | "xlsx"
  printFormat: "letter" | "a4" | "ticket"
}

export interface TenantUiConfig {
  preferences: ErpPreferences
  visibleModules: ModuleId[]
  menuMode: "standard" | "compact"
  tableDensity: ErpTableDensity
  moduleColumns: Record<string, string[]>
  sharedViewVariants: Record<string, string[]>
  /** Etiquetas de menú propias de la empresa (p. ej. "Proveedores / Compras"). */
  moduleLabels?: Partial<Record<ModuleId, string>>
  /** Indicadores del dashboard activos, en el orden elegido por la empresa. */
  dashboardIndicators?: DashboardIndicatorId[]
}

export interface TenantFiscal {
  legalName: string
  rfc: string
  regime: string
  address: string
  /** Adaptador de timbrado: mock hasta contratar PAC (§14) */
  pac: "mock" | "configured"
}

/** Datos de contacto comercial de la empresa (editables). */
export interface TenantContact {
  email: string
  phone: string
  country: string
  state: string
  /** Giro / actividad principal, en lenguaje del cliente. */
  businessLine: string
  /** Tipo de operación: comercial, distribución, manufactura, servicios… */
  operationType: string
}

export interface TenantCrmConfig {
  enabled: boolean
  baseUrl: string
  /** sandbox mientras no haya credenciales productivas (§11) */
  mode: "sandbox" | "production"
  masterSource: "nexo" | "crm"
  modules: string[]
}

export interface TenantAiConfig {
  enabled: boolean
  provider: "none" | "anthropic" | "openai"
  /** El modelo permitido; la API key NUNCA se guarda aquí (§13, secret manager) */
  model: string
  monthlyBudgetUsd: number
  hasServerKey: boolean
}

/** Cambio de versión aplicado a una empresa (historial y rollback lógico). */
export interface TenantVersionChange {
  version: string
  previousVersion: string | null
  at: string
  actorEmail: string
  note: string
}

/** Plantilla/giro usado al crear la empresa (define módulos y menú inicial). */
export type TenantTemplate = "general" | "alimentos" | "distribucion-cables" | "demo"

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  version: string
  /** Historial de cambios de versión (el último es el vigente). */
  versionHistory?: TenantVersionChange[]
  /** Plantilla/giro con el que se creó la empresa. */
  template?: TenantTemplate
  branding: TenantBranding
  /** Módulos activos por tenant; el menú del tenant respeta esto */
  modules: ModuleId[]
  contact?: TenantContact
  fiscal: TenantFiscal
  crm: TenantCrmConfig
  ai: TenantAiConfig
  ui?: TenantUiConfig
  documents?: TenantDocumentAppearance
  /** Metadatos operativos */
  seededAt: string | null
  createdAt: string
  updatedAt: string
}

/** Rol a nivel plataforma (por encima de cualquier tenant). */
export type PlatformRole = "platform_admin" | "platform_support" | "none"

export interface PlatformUser {
  uid: string
  email: string
  name: string
  platformRole: PlatformRole
  /** Tenants a los que pertenece y su rol dentro de cada uno */
  memberships: { tenantId: string; role: string }[]
}

export interface AuditRecord {
  id: string
  tenantId: string
  at: string
  actorEmail: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  summary: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  source: "ui" | "import" | "seed" | "integration" | "system"
}

export interface ImportRun {
  id: string
  tenantId: string
  entity: string
  fileName: string
  at: string
  actorEmail: string
  status: "dry-run" | "committed" | "failed"
  totalRows: number
  validRows: number
  errorRows: number
  duplicateRows: number
  createdRows: number
}

export interface SupportTicket {
  id: string
  tenantId: string
  at: string
  subject: string
  module: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in_progress" | "resolved"
  description: string
  reporterEmail: string
}

export interface ReleaseNote {
  version: string
  date: string
  title: string
  highlights: string[]
  environment: "production" | "preview"
}
