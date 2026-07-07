import type { ReleaseNote } from "./types"

/**
 * Catálogo de versiones de la plataforma. Cada empresa tiene asignada una
 * versión (`tenant.version`) y puede migrar de forma independiente: DELAR
 * Foods puede quedarse en una versión anterior mientras otra empresa usa la
 * última estable. El historial por empresa vive en `tenant.versionHistory`.
 */
export const PLATFORM_RELEASES: ReleaseNote[] = [
  {
    version: "0.4.0",
    date: "2026-07-07",
    title: "Empresa Soleil Wire, módulos combinados e indicadores configurables",
    environment: "production",
    highlights: [
      "Empresa Soleil Wire (cables especiales) con universo propio y datos aislados",
      "Menú por empresa: módulos activos, combinados y etiquetas configurables",
      "Productos y Precios unificado (catálogo + listas) con vistas tabla/tarjetas/lista",
      "Inventario y Existencias unificado por bobina/rollo/serie con movimientos y trazabilidad",
      "Indicadores del dashboard configurables por empresa",
      "Centro de Importación con oportunidades CRM, movimientos bancarios y catálogo contable",
      "Versión del sistema y su historial administrables por empresa",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-07-06",
    title: "Administración Nexo, Firebase real y CRM integrado",
    environment: "production",
    highlights: [
      "Administración Nexo para operaciones@nexo.com",
      "Persistencia real en Firestore con aislamiento por empresa",
      "Centro de Importación masiva con plantillas, validación y prueba previa",
      "Tablas empresariales con filtros, sumas, columnas, exportación y acciones masivas",
      "CRM Momentum integrado por empresa: abrir, regresar y sincronizar en modo de prueba",
      "Asistente flotante y auditoría visible por registro",
      "Reglas de Firestore con aislamiento por empresa",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-07-03",
    title: "Dominio DELAR, tema oscuro y CRM en modo de prueba",
    environment: "production",
    highlights: ["Dominio food-service", "0 errores TypeScript", "44 unitarias + 14 E2E"],
  },
]

/** Última versión estable publicada (la que reciben las empresas nuevas). */
export const LATEST_STABLE_VERSION = PLATFORM_RELEASES[0].version

/** Versiones asignables a una empresa desde Administración Nexo. */
export const ASSIGNABLE_VERSIONS: string[] = PLATFORM_RELEASES.map((r) => r.version)

export function getRelease(version: string): ReleaseNote | undefined {
  return PLATFORM_RELEASES.find((r) => r.version === version)
}

export function isKnownVersion(version: string): boolean {
  return ASSIGNABLE_VERSIONS.includes(version)
}
