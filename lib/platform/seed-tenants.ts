import type { Tenant } from "./types"
import { ALL_MODULE_IDS, DEFAULT_TENANT_MODULES, DISTRIBUTION_TENANT_MODULES } from "./modules"
import { DEFAULT_ERP_PREFERENCES } from "./preferences"
import { LATEST_STABLE_VERSION } from "./versions"

const now = "2026-07-06T00:00:00.000Z"
const soleilSeededAt = "2026-07-07T00:00:00.000Z"

/**
 * Tenants fundacionales sembrados de forma idempotente (mismo id → upsert).
 * DELAR Foods es el universo real; "Prototipo Demo" es un universo aislado para
 * ventas/demostraciones; Soleil Wire es la empresa de cables especiales con la
 * última versión estable. Cada uno es su propio universo: no se mezclan datos.
 */
export const SEED_TENANTS: Tenant[] = [
  {
    id: "org-delar",
    name: "DELAR Foods",
    slug: "delar",
    status: "active",
    version: "1.0.0",
    branding: {
      logoText: "DELAR Foods",
      logoUrl: "/Logo Nexo ERP.svg",
      compactLogoUrl: "/favicon.ico",
      primaryColor: "#e11d2a",
      theme: "dark",
    },
    modules: ALL_MODULE_IDS,
    fiscal: {
      legalName: "DELAR Foods S.A. de C.V.",
      rfc: "DFO850101XY0",
      regime: "601 - General de Ley Personas Morales",
      address: "Monterrey, Nuevo León, México",
      pac: "mock",
    },
    crm: {
      enabled: true,
      baseUrl: "https://crm-momentum.vercel.app",
      mode: "sandbox",
      masterSource: "nexo",
      modules: ["clientes", "contactos", "prospectos", "oportunidades", "actividades"],
    },
    ai: { enabled: false, provider: "none", model: "", monthlyBudgetUsd: 0, hasServerKey: false },
    ui: {
      preferences: { ...DEFAULT_ERP_PREFERENCES, theme: "dark", tableDensity: "compact" },
      visibleModules: ALL_MODULE_IDS,
      menuMode: "standard",
      tableDensity: "compact",
      moduleColumns: {},
      sharedViewVariants: {},
    },
    documents: {
      logoUrl: "/Logo Nexo ERP.svg",
      accentColor: "#e11d2a",
      footerText: "Documento generado por Nexo ERP",
      showFiscalAddress: true,
      defaultExportFormat: "xlsx",
      printFormat: "letter",
    },
    seededAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "org-demo",
    name: "Prototipo Demo",
    slug: "demo",
    status: "trial",
    version: "0.1.0",
    branding: {
      logoText: "Demo",
      logoUrl: "/Logo Nexo ERP.svg",
      compactLogoUrl: "/favicon.ico",
      primaryColor: "#2563eb",
      theme: "system",
    },
    modules: DEFAULT_TENANT_MODULES,
    fiscal: {
      legalName: "Empresa Demostración",
      rfc: "XAXX010101000",
      regime: "601 - General de Ley Personas Morales",
      address: "México",
      pac: "mock",
    },
    crm: {
      enabled: false,
      baseUrl: "https://crm-momentum.vercel.app",
      mode: "sandbox",
      masterSource: "nexo",
      modules: ["clientes", "contactos"],
    },
    ai: { enabled: false, provider: "none", model: "", monthlyBudgetUsd: 0, hasServerKey: false },
    ui: {
      preferences: { ...DEFAULT_ERP_PREFERENCES, theme: "system", tableDensity: "medium" },
      visibleModules: DEFAULT_TENANT_MODULES,
      menuMode: "standard",
      tableDensity: "medium",
      moduleColumns: {},
      sharedViewVariants: {},
    },
    documents: {
      logoUrl: "/Logo Nexo ERP.svg",
      accentColor: "#2563eb",
      footerText: "Documento demo generado por Nexo ERP",
      showFiscalAddress: true,
      defaultExportFormat: "xlsx",
      printFormat: "letter",
    },
    seededAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "org-soleilwire",
    name: "Soleil Wire",
    slug: "soleilwire",
    status: "active",
    version: LATEST_STABLE_VERSION,
    versionHistory: [
      {
        version: LATEST_STABLE_VERSION,
        previousVersion: null,
        at: soleilSeededAt,
        actorEmail: "operaciones@nexo.com",
        note: "Alta de la empresa con la última versión estable",
      },
    ],
    template: "distribucion-cables",
    branding: {
      logoText: "Soleil Wire",
      logoUrl: "/Logo Nexo ERP.svg",
      compactLogoUrl: "/favicon.ico",
      primaryColor: "#f59e0b",
      theme: "dark",
    },
    modules: DISTRIBUTION_TENANT_MODULES,
    contact: {
      email: "ventas@soleilwire.com",
      phone: "81 1600 9380",
      country: "México",
      state: "Nuevo León",
      businessLine: "Distribución de cables especiales",
      operationType: "Comercial / distribución",
    },
    fiscal: {
      legalName: "Soleil Wire",
      // RFC genérico nacional como marcador editable; no se inventan datos fiscales reales.
      rfc: "XAXX010101000",
      regime: "Por definir con el cliente",
      address: "Nuevo León, México",
      pac: "mock",
    },
    crm: {
      enabled: true,
      baseUrl: "https://crm-momentum.vercel.app",
      mode: "sandbox",
      masterSource: "nexo",
      modules: [
        "clientes",
        "contactos",
        "prospectos",
        "oportunidades",
        "actividades",
        "cotizaciones",
        "pedidos",
      ],
    },
    ai: { enabled: false, provider: "none", model: "", monthlyBudgetUsd: 0, hasServerKey: false },
    ui: {
      preferences: { ...DEFAULT_ERP_PREFERENCES, theme: "dark", language: "es", currency: "MXN", tableDensity: "medium" },
      visibleModules: DISTRIBUTION_TENANT_MODULES,
      menuMode: "standard",
      tableDensity: "medium",
      moduleColumns: {},
      sharedViewVariants: {},
      moduleLabels: {
        invoicing: "Facturación y Remisiones",
        suppliers: "Proveedores / Compras",
        bi: "Reportes / BI",
        service: "Soporte",
      },
      dashboardIndicators: [
        "ventasMes",
        "cotizacionesAbiertas",
        "oportunidadesCrm",
        "productosSinPrecio",
        "stockBajo",
        "inventarioDisponible",
        "facturasPendientes",
        "actividadComercial",
      ],
    },
    documents: {
      logoUrl: "/Logo Nexo ERP.svg",
      accentColor: "#f59e0b",
      footerText: "Documento generado por Nexo ERP para Soleil Wire",
      showFiscalAddress: true,
      defaultExportFormat: "xlsx",
      printFormat: "letter",
    },
    seededAt: soleilSeededAt,
    createdAt: soleilSeededAt,
    updatedAt: soleilSeededAt,
  },
]

export function findSeedTenant(id: string): Tenant | undefined {
  return SEED_TENANTS.find((t) => t.id === id)
}
