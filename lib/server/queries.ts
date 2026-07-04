import "server-only"
import { companyConfig } from "@/lib/config/company"
import { matchesCatalogFilter, type CatalogFilter, type Sku } from "@/lib/domain/catalog/types"
import { projectStock } from "@/lib/domain/inventory/ledger"
import type { Lot, StockLocation, StockProjectionRow, Warehouse } from "@/lib/domain/inventory/types"
import { resolvePrice, type ResolvedPrice } from "@/lib/domain/pricing/resolve"
import type { CommercialConfig, PriceList } from "@/lib/domain/pricing/types"
import { dec } from "@/lib/domain/shared/decimal"
import type { DataQualityIssue } from "@/lib/domain/seed/seed"
import { getStore } from "./store"

const ORG = companyConfig.organizationId
const today = () => new Date().toISOString().slice(0, 10)

export interface CatalogRow {
  sku: Sku
  familyName: string
  brandName: string
  retail: ResolvedPrice | null
  wholesale: ResolvedPrice | null
  availablePieces: string
}

export function getCatalogRows(filter: CatalogFilter = {}): CatalogRow[] {
  const store = getStore()
  const lists = [...store.priceLists.values()]
  const entries = [...store.priceEntries.values()]
  const stock = projectStock([...store.movements.values()])
  const onDate = today()

  return [...store.skus.values()]
    .filter((s) => s.organizationId === ORG && s.active)
    .map((sku) => {
      const familyName = store.families.get(sku.familyId)?.name ?? ""
      const brandName = store.brands.get(sku.brandId)?.name ?? ""
      const retail = resolvePrice({ sku, channel: "retail", onDate, lists, entries })
      const wholesale = resolvePrice({ sku, channel: "wholesale", onDate, lists, entries })
      const available = stock
        .filter((r) => r.skuId === sku.id)
        .reduce((acc, r) => dec.add(acc, r.available), "0")
      return {
        sku,
        familyName,
        brandName,
        retail: retail.ok ? retail.value : null,
        wholesale: wholesale.ok ? wholesale.value : null,
        availablePieces: available,
      }
    })
    .filter((row) => matchesCatalogFilter(row.sku, row.familyName, row.brandName, filter))
    .sort((a, b) => (a.sku.sku < b.sku.sku ? -1 : 1))
}

export function getCatalogFacets() {
  const store = getStore()
  const brands = [...store.brands.values()].filter((b) => b.organizationId === ORG)
  const categories = [...new Set([...store.skus.values()].map((s) => s.category))].sort()
  return { brands, categories }
}

export interface SkuDetail extends CatalogRow {
  lots: (Lot & { stock: StockProjectionRow[] })[]
  fefoOrder: string[]
}

export function getSkuDetail(skuCode: string): SkuDetail | null {
  const store = getStore()
  const sku = [...store.skus.values()].find((s) => s.sku === skuCode && s.organizationId === ORG)
  if (!sku) return null
  const [row] = getCatalogRows({ search: sku.sku })
  if (!row) return null
  const stock = projectStock([...store.movements.values()])
  const lots = [...store.lots.values()]
    .filter((l) => l.skuId === sku.id)
    .map((l) => ({ ...l, stock: stock.filter((r) => r.lotId === l.id) }))
    .sort((a, b) => ((a.expiryDate ?? "9999") < (b.expiryDate ?? "9999") ? -1 : 1))
  const fefoOrder = lots
    .filter((l) => l.qualityStatus === "released" && (!l.expiryDate || l.expiryDate >= today()))
    .map((l) => l.lotCode)
  return { ...row, lots, fefoOrder }
}

export interface PriceListView {
  list: PriceList
  rows: { skuCode: string; skuName: string; unitsPerCase: number; unitPrice: string; casePrice: string }[]
}

export function getPriceListViews(): PriceListView[] {
  const store = getStore()
  return [...store.priceLists.values()]
    .filter((l) => l.organizationId === ORG)
    .map((list) => ({
      list,
      rows: [...store.priceEntries.values()]
        .filter((e) => e.priceListId === list.id)
        .map((e) => {
          const sku = store.skus.get(e.skuId)!
          return {
            skuCode: sku.sku,
            skuName: sku.name,
            unitsPerCase: sku.unitsPerCase,
            unitPrice: e.unitPrice,
            casePrice: e.casePriceOverride ?? dec.mul(e.unitPrice, sku.unitsPerCase),
          }
        })
        .sort((a, b) => (a.skuCode < b.skuCode ? -1 : 1)),
    }))
}

export interface InventoryLotRow {
  lot: Lot
  skuCode: string
  skuName: string
  location: StockLocation | null
  warehouse: Warehouse | null
  onHand: string
  available: string
  expiresInDays: number | null
  usable: boolean
}

export function getInventoryLotRows(): InventoryLotRow[] {
  const store = getStore()
  const stock = projectStock([...store.movements.values()])
  const onDate = today()
  const rows: InventoryLotRow[] = []
  for (const projection of stock) {
    if (projection.organizationId !== ORG || !projection.lotId) continue
    const lot = store.lots.get(projection.lotId)
    const sku = store.skus.get(projection.skuId)
    if (!lot || !sku) continue
    const location = store.locations.get(projection.locationId) ?? null
    const warehouse = location ? (store.warehouses.get(location.warehouseId) ?? null) : null
    const expiresInDays = lot.expiryDate
      ? Math.ceil((new Date(lot.expiryDate).getTime() - new Date(onDate).getTime()) / 86400000)
      : null
    rows.push({
      lot,
      skuCode: sku.sku,
      skuName: sku.name,
      location,
      warehouse,
      onHand: projection.onHand,
      available: projection.available,
      expiresInDays,
      usable: lot.qualityStatus === "released" && (!lot.expiryDate || lot.expiryDate >= onDate),
    })
  }
  return rows.sort((a, b) => ((a.lot.expiryDate ?? "9999") < (b.lot.expiryDate ?? "9999") ? -1 : 1))
}

export function getCommercialConfig(): CommercialConfig {
  return getStore().commercialConfig
}

export function getDataQualityIssues(): DataQualityIssue[] {
  return getStore().dataQualityIssues
}

export function getAuditTrail(limit = 50) {
  return [...getStore().auditEvents].reverse().slice(0, limit)
}

export function getDashboardKpis() {
  const store = getStore()
  const rows = getInventoryLotRows()
  const skuCount = [...store.skus.values()].filter((s) => s.organizationId === ORG && s.active).length
  const releasedPieces = rows.filter((r) => r.usable).reduce((acc, r) => dec.add(acc, r.available), "0")
  const quarantine = rows.filter((r) => r.lot.qualityStatus === "quarantine" || r.lot.qualityStatus === "pending")
  const expiringSoon = rows.filter((r) => r.usable && r.expiresInDays !== null && r.expiresInDays <= 60)
  const expired = rows.filter((r) => r.expiresInDays !== null && r.expiresInDays < 0)
  return {
    skuCount,
    releasedPieces,
    quarantineLots: new Set(quarantine.map((r) => r.lot.id)).size,
    expiringSoonLots: new Set(expiringSoon.map((r) => r.lot.id)).size,
    expiredLots: new Set(expired.map((r) => r.lot.id)).size,
    dataQualityHigh: store.dataQualityIssues.filter((i) => i.severity === "high").length,
  }
}
