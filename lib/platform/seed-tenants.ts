import type { Tenant } from "./types"
import { ALL_MODULE_IDS, DEFAULT_TENANT_MODULES } from "./modules"

const now = "2026-07-06T00:00:00.000Z"

/**
 * Tenants fundacionales sembrados de forma idempotente (mismo id → upsert).
 * DELAR Foods es el universo real; "Prototipo Demo" es un universo aislado para
 * ventas/demostraciones. Cada uno es su propio universo: no se mezclan datos.
 */
export const SEED_TENANTS: Tenant[] = [
  {
    id: "org-delar",
    name: "DELAR Foods",
    slug: "delar",
    status: "active",
    version: "1.0.0",
    branding: { logoText: "DELAR Foods", primaryColor: "#e11d2a", theme: "dark" },
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
    branding: { logoText: "Demo", primaryColor: "#2563eb", theme: "system" },
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
    seededAt: now,
    createdAt: now,
    updatedAt: now,
  },
]

export function findSeedTenant(id: string): Tenant | undefined {
  return SEED_TENANTS.find((t) => t.id === id)
}
