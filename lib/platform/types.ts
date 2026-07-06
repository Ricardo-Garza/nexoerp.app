/**
 * Modelo de datos del Nexo Control Plane (multi-tenant real).
 *
 * Cada empresa es su propio universo aislado: un documento `tenants/{tenantId}`
 * con su branding, módulos activos, integraciones, fiscal y auditoría propia.
 * Ver docs/FIREBASE_DATA_MODEL.md y docs/NEXO_CONTROL_PLANE.md.
 */

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
}

export type TenantStatus = "active" | "trial" | "suspended" | "prospect"

export interface TenantBranding {
  logoText: string
  primaryColor: string
  theme: "light" | "dark" | "system"
}

export interface TenantFiscal {
  legalName: string
  rfc: string
  regime: string
  address: string
  /** Adaptador de timbrado: mock hasta contratar PAC (§14) */
  pac: "mock" | "configured"
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

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  version: string
  branding: TenantBranding
  /** Módulos activos por tenant; el menú del tenant respeta esto */
  modules: ModuleId[]
  fiscal: TenantFiscal
  crm: TenantCrmConfig
  ai: TenantAiConfig
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
