import seedData from "./seed-data.json"
import { companyConfig } from "@/lib/config/company"
import type { Brand, ProductFamily, Sku, DataStatus, ProductKind } from "../catalog/types"
import type { CommercialConfig, PriceEntry, PriceList, PriceListStatus } from "../pricing/types"
import type { Lot, StockLocation, Warehouse } from "../inventory/types"
import { dec } from "../shared/decimal"

export interface DataQualityIssue {
  id: string
  domain: string
  entity: string
  issue: string
  requiredAction: string
  severity: "high" | "medium" | "low"
}

export interface SeedResult {
  brands: Brand[]
  families: ProductFamily[]
  skus: Sku[]
  priceLists: PriceList[]
  priceEntries: PriceEntry[]
  commercialConfig: CommercialConfig
  warehouses: Warehouse[]
  locations: StockLocation[]
  dataQualityIssues: DataQualityIssue[]
}

const ORG = companyConfig.organizationId

/**
 * Construye las entidades semilla con IDs deterministas (clave natural),
 * de modo que ejecutar el seed dos veces produce exactamente el mismo
 * resultado sin duplicados (criterio de aceptación 19 del contexto).
 */
export function buildSeedEntities(): SeedResult {
  const brands: Brand[] = seedData.brands.map((b) => ({
    id: `brand-${b.code.toLowerCase()}`,
    organizationId: ORG,
    code: b.code,
    name: b.name,
    brandType: b.brandType as Brand["brandType"],
    active: true,
  }))
  const brandByCode = new Map(brands.map((b) => [b.code, b]))

  const familyKey = (brandCode: string, family: string) =>
    `fam-${brandCode.toLowerCase()}-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

  const familiesMap = new Map<string, ProductFamily>()
  for (const s of seedData.skus) {
    const id = familyKey(s.brandCode, s.family)
    if (!familiesMap.has(id)) {
      familiesMap.set(id, {
        id,
        organizationId: ORG,
        name: s.family,
        brandId: brandByCode.get(s.brandCode)?.id ?? "brand-delar",
        category: s.category,
      })
    }
  }

  const skus: Sku[] = seedData.skus.map((s) => ({
    id: `sku-${s.sku.toLowerCase()}`,
    organizationId: ORG,
    sku: s.sku,
    familyId: familyKey(s.brandCode, s.family),
    brandId: brandByCode.get(s.brandCode)?.id ?? "brand-delar",
    name: s.name,
    category: s.category,
    kind: "resale" as ProductKind, // estrategia de abastecimiento por validar; default seguro
    presentationType: s.presentationType,
    // No se inventan datos faltantes: contenido neto vacío queda null (por validar)
    netContent: s.netContent.trim() ? dec.normalize(s.netContent) : null,
    netUnit: s.netUnit,
    unitsPerCase: s.unitsPerCase,
    ean: s.ean,
    dun: s.dun,
    trackLot: s.trackLot,
    expiryRequired: s.expiryRequired,
    dataStatus: s.dataStatus as DataStatus,
    source: s.source,
    active: true,
  }))
  const skuByCode = new Map(skus.map((s) => [s.sku, s]))

  const priceLists: PriceList[] = seedData.priceLists.map((l) => ({
    id: `pl-${l.code.toLowerCase()}`,
    organizationId: ORG,
    code: l.code,
    name: l.name,
    channel: l.channel as PriceList["channel"],
    currency: l.currency,
    validFrom: l.validFrom,
    validUntil: null,
    status: l.status as PriceListStatus,
    sourceNote: l.sourceNote,
  }))
  const listByCode = new Map(priceLists.map((l) => [l.code, l]))

  const priceEntries: PriceEntry[] = seedData.priceEntries
    .filter((e) => skuByCode.has(e.sku) && listByCode.has(e.priceListCode))
    .map((e) => ({
      id: `pe-${e.priceListCode.toLowerCase()}-${e.sku.toLowerCase()}`,
      organizationId: ORG,
      priceListId: listByCode.get(e.priceListCode)!.id,
      skuId: skuByCode.get(e.sku)!.id,
      unitPrice: dec.normalize(e.unitPrice),
      casePriceOverride: null,
    }))

  const cr = seedData.commercialRules
  const commercialConfig: CommercialConfig = {
    organizationId: ORG,
    wholesaleMinimumOrderMxn: dec.normalize(cr.wholesale_reference.minimum_order_amount_mxn),
    wholesaleRuleStatus: cr.wholesale_reference.status as CommercialConfig["wholesaleRuleStatus"],
    freeLocalDeliveryMinimumMxn: dec.normalize(cr.local_delivery.free_delivery_minimum_mxn),
    deliveryZones: cr.local_delivery.zones,
    deliveryWindow: { start: cr.local_delivery.start, end: cr.local_delivery.end },
    businessDays: cr.business_hours.days,
    pickupAddress: cr.pickup.address,
    pickupHours: { open: cr.business_hours.open, close: cr.business_hours.close },
    advanceBusinessDays: cr.local_delivery.advance_business_days,
    timezone: cr.timezone,
    baseCurrency: cr.base_currency,
  }

  const warehouses: Warehouse[] = [
    {
      id: "wh-moderna",
      organizationId: ORG,
      code: "MODERNA",
      name: "Almacén Clavel (Col. Moderna)",
      address: cr.pickup.address,
      active: true,
    },
  ]

  const locations: StockLocation[] = [
    { id: "loc-moderna-recv", organizationId: ORG, warehouseId: "wh-moderna", code: "RECV", name: "Recepción", kind: "receiving" },
    { id: "loc-moderna-a1", organizationId: ORG, warehouseId: "wh-moderna", code: "A-01", name: "Rack A-01", kind: "storage" },
    { id: "loc-moderna-a2", organizationId: ORG, warehouseId: "wh-moderna", code: "A-02", name: "Rack A-02", kind: "storage" },
    { id: "loc-moderna-qa", organizationId: ORG, warehouseId: "wh-moderna", code: "QA", name: "Cuarentena", kind: "quarantine" },
  ]

  return {
    brands,
    families: [...familiesMap.values()],
    skus,
    priceLists,
    priceEntries,
    commercialConfig,
    warehouses,
    locations,
    dataQualityIssues: seedData.dataQualityIssues as DataQualityIssue[],
  }
}

/**
 * Lotes de demostración (datos sintéticos LOT-TEST-*, nunca de producción):
 * caducidades escalonadas para exhibir FEFO, un lote en cuarentena y uno vencido
 * para exhibir bloqueo de asignación.
 */
export function buildDemoLots(skus: Sku[], today = new Date()): { lot: Lot; locationId: string; quantity: string }[] {
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const plus = (days: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + days)
    return iso(d)
  }
  const pick = (code: string) => skus.find((s) => s.sku === code)

  const specs: { sku: string; lotCode: string; expiry: string | null; status: Lot["qualityStatus"]; locationId: string; qty: string }[] = [
    { sku: "CC-RANCH-20KG", lotCode: "LOT-TEST-R1", expiry: plus(45), status: "released", locationId: "loc-moderna-a1", qty: "12" },
    { sku: "CC-RANCH-20KG", lotCode: "LOT-TEST-R2", expiry: plus(180), status: "released", locationId: "loc-moderna-a2", qty: "20" },
    { sku: "CC-RANCH-20KG", lotCode: "LOT-TEST-R3", expiry: plus(10), status: "quarantine", locationId: "loc-moderna-qa", qty: "6" },
    { sku: "CC-BBQ-20KG", lotCode: "LOT-TEST-B1", expiry: plus(-5), status: "released", locationId: "loc-moderna-a1", qty: "4" },
    { sku: "CC-BBQ-20KG", lotCode: "LOT-TEST-B2", expiry: plus(120), status: "released", locationId: "loc-moderna-a1", qty: "18" },
    { sku: "CC-MH-20KG", lotCode: "LOT-TEST-M1", expiry: plus(60), status: "pending", locationId: "loc-moderna-recv", qty: "10" },
    { sku: "CC-ALITAS-20KG", lotCode: "LOT-TEST-A1", expiry: plus(90), status: "released", locationId: "loc-moderna-a2", qty: "15" },
  ]

  const out: { lot: Lot; locationId: string; quantity: string }[] = []
  for (const spec of specs) {
    const sku = pick(spec.sku)
    if (!sku) continue
    out.push({
      lot: {
        id: `lot-${spec.lotCode.toLowerCase()}`,
        organizationId: ORG,
        skuId: sku.id,
        lotCode: spec.lotCode,
        vendorLotCode: null,
        receivedAt: iso(today),
        expiryDate: spec.expiry,
        qualityStatus: spec.status,
      },
      locationId: spec.locationId,
      quantity: spec.qty,
    })
  }
  return out
}
