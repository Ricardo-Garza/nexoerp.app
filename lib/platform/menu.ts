import type { ModuleDefinition, ModuleId, Tenant } from "./types"
import { ALL_MODULE_IDS, getModule } from "./modules"

/**
 * Menú lateral por empresa. Se construye desde los módulos activos del tenant
 * (en el orden configurado), aplicando dos reglas:
 *
 *  1. Un módulo combinado (p. ej. "Productos y Precios") sustituye en el menú
 *     a los módulos que cubre; los módulos base siguen existiendo a nivel
 *     sistema y otras empresas pueden usarlos por separado.
 *  2. La empresa puede renombrar módulos con `ui.moduleLabels`
 *     (p. ej. "Proveedores / Compras") sin tocar el catálogo global.
 */

export interface TenantMenuItem {
  moduleId: ModuleId
  name: string
  href: string
  maturity: ModuleDefinition["maturity"]
}

export interface TenantMenuSection {
  title: string
  items: TenantMenuItem[]
}

const GROUP_TITLES: Record<ModuleDefinition["group"], string> = {
  principal: "MODULOS PRINCIPALES",
  operaciones: "OPERACIONES",
  administracion: "ADMINISTRACION",
  analitica: "ANALITICA",
  expansion: "EXPANSION",
}

const GROUP_ORDER: ModuleDefinition["group"][] = [
  "principal",
  "operaciones",
  "administracion",
  "analitica",
  "expansion",
]

/** Módulos efectivos del tenant: los activos menos los cubiertos por combinados. */
export function resolveTenantModules(tenant: Pick<Tenant, "modules"> | null): ModuleId[] {
  const active = tenant?.modules?.length ? tenant.modules : ALL_MODULE_IDS
  const covered = new Set<ModuleId>()
  for (const id of active) {
    const def = getModule(id)
    for (const coveredId of def?.combines ?? []) covered.add(coveredId)
  }
  return active.filter((id) => !covered.has(id) && getModule(id))
}

export function moduleLabel(tenant: Pick<Tenant, "ui"> | null, def: ModuleDefinition): string {
  return tenant?.ui?.moduleLabels?.[def.id] ?? def.name
}

export function buildTenantMenu(tenant: Tenant | null): TenantMenuSection[] {
  const effective = resolveTenantModules(tenant)
  const sections = new Map<ModuleDefinition["group"], TenantMenuItem[]>()

  for (const id of effective) {
    const def = getModule(id)
    if (!def) continue
    const items = sections.get(def.group) ?? []
    items.push({
      moduleId: def.id,
      name: moduleLabel(tenant, def),
      href: def.href,
      maturity: def.maturity,
    })
    sections.set(def.group, items)
  }

  return GROUP_ORDER.filter((group) => sections.get(group)?.length).map((group) => ({
    title: GROUP_TITLES[group],
    items: sections.get(group) ?? [],
  }))
}
