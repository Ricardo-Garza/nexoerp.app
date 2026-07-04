import type { DecimalString } from "../shared/decimal"

/** Estrategia de abastecimiento por SKU — no se asume que todo se fabrica. */
export type ProductKind = "resale" | "manufactured" | "repacked" | "tolled" | "kit" | "service"

/** Estado de validación del dato fuente (data_quality_issues.csv). */
export type DataStatus = "validated" | "historical_requires_validation" | "pending_validation"

export interface Brand {
  id: string
  organizationId: string
  code: string
  name: string
  brandType: "own_or_distributor" | "manufacturer_brand"
  active: boolean
}

/** Familia comercial/sabor: "Ranch" agrupa Ranch 460 g, pouch 2 kg, galón 3.4 kg, porrón 20 kg. */
export interface ProductFamily {
  id: string
  organizationId: string
  name: string
  brandId: string
  category: string
}

/** SKU/presentación vendible concreta. */
export interface Sku {
  id: string
  organizationId: string
  sku: string
  familyId: string
  brandId: string
  name: string
  category: string
  kind: ProductKind
  presentationType: string // Porrón, Galón, Bolsa, Sobre, Cubeta, Saco, Frasco...
  /** Contenido neto; null cuando la fuente no lo especifica (pendiente de validación) */
  netContent: DecimalString | null
  netUnit: string // KG | G | L | ML | EA
  /** Empaque: piezas por caja; EAN pieza y DUN caja pueden faltar (pending_validation) */
  unitsPerCase: number
  ean: string | null
  dun: string | null
  trackLot: boolean
  expiryRequired: boolean
  dataStatus: DataStatus
  source: string
  active: boolean
}

export interface CatalogFilter {
  search?: string
  brandId?: string
  category?: string
  familyId?: string
}

export function matchesCatalogFilter(sku: Sku, familyName: string, brandName: string, f: CatalogFilter): boolean {
  if (f.brandId && sku.brandId !== f.brandId) return false
  if (f.category && sku.category !== f.category) return false
  if (f.familyId && sku.familyId !== f.familyId) return false
  if (f.search) {
    const q = f.search.trim().toLowerCase()
    const haystack = `${sku.sku} ${sku.name} ${familyName} ${brandName} ${sku.presentationType}`.toLowerCase()
    if (!haystack.includes(q)) return false
  }
  return true
}
