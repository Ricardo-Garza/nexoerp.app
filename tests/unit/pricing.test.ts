import { describe, expect, it } from "vitest"
import type { Sku } from "@/lib/domain/catalog/types"
import {
  computeMarginPct,
  qualifiesForWholesale,
  resolveChannelForOrder,
  resolvePrice,
} from "@/lib/domain/pricing/resolve"
import type { CommercialConfig, PriceEntry, PriceList } from "@/lib/domain/pricing/types"

const sku: Sku = {
  id: "sku-test",
  organizationId: "org-delar",
  sku: "CC-RANCHHAB-3.4KG",
  familyId: "fam",
  brandId: "brand",
  name: "Aderezo Ranch Habanero 3.4 kg",
  category: "Aderezos",
  kind: "resale",
  presentationType: "Galón",
  netContent: "3.4",
  netUnit: "KG",
  unitsPerCase: 4,
  ean: null,
  dun: null,
  trackLot: true,
  expiryRequired: true,
  dataStatus: "historical_requires_validation",
  source: "test",
  active: true,
}

const lists: PriceList[] = [
  {
    id: "pl-retail",
    organizationId: "org-delar",
    code: "RETAIL-2025-01-27",
    name: "Menudeo histórico",
    channel: "retail",
    currency: "MXN",
    validFrom: "2025-01-27",
    validUntil: null,
    status: "historical_requires_validation",
    sourceNote: "test",
  },
  {
    id: "pl-old",
    organizationId: "org-delar",
    code: "RETAIL-2024",
    name: "Menudeo 2024",
    channel: "retail",
    currency: "MXN",
    validFrom: "2024-01-01",
    validUntil: "2025-01-26",
    status: "approved",
    sourceNote: "test",
  },
]

const entries: PriceEntry[] = [
  { id: "pe1", organizationId: "org-delar", priceListId: "pl-retail", skuId: "sku-test", unitPrice: "319.09", casePriceOverride: null },
  { id: "pe2", organizationId: "org-delar", priceListId: "pl-old", skuId: "sku-test", unitPrice: "290", casePriceOverride: "1100" },
]

const config: CommercialConfig = {
  organizationId: "org-delar",
  wholesaleMinimumOrderMxn: "40000",
  wholesaleRuleStatus: "historical_requires_validation",
  freeLocalDeliveryMinimumMxn: "800",
  deliveryZones: ["Monterrey"],
  deliveryWindow: { start: "10:00", end: "16:00" },
  businessDays: ["MO"],
  pickupAddress: "Clavel 2499",
  pickupHours: { open: "09:00", close: "17:00" },
  advanceBusinessDays: 1,
  timezone: "America/Monterrey",
  baseCurrency: "MXN",
}

describe("resolución de precios", () => {
  it("aplica la lista vigente más reciente y deriva precio de caja", () => {
    const r = resolvePrice({ sku, channel: "retail", onDate: "2025-06-01", lists, entries })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.priceListCode).toBe("RETAIL-2025-01-27")
      expect(r.value.unitPrice).toBe("319.09")
      expect(r.value.casePrice).toBe("1276.36") // 319.09 × 4
      expect(r.value.casePriceIsOverride).toBe(false)
      expect(r.value.requiresValidation).toBe(true)
      expect(r.value.explanation.join(" ")).toContain("piezas por caja")
    }
  })

  it("respeta vigencias: fecha anterior usa la lista 2024 con override de caja", () => {
    const r = resolvePrice({ sku, channel: "retail", onDate: "2024-06-15", lists, entries })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.priceListCode).toBe("RETAIL-2024")
      expect(r.value.casePrice).toBe("1100")
      expect(r.value.casePriceIsOverride).toBe(true)
    }
  })

  it("falla explícitamente sin lista vigente", () => {
    const r = resolvePrice({ sku, channel: "retail", onDate: "2023-01-01", lists, entries })
    expect(r.ok).toBe(false)
  })

  it("falla para canal sin lista", () => {
    const r = resolvePrice({ sku, channel: "wholesale", onDate: "2025-06-01", lists, entries })
    expect(r.ok).toBe(false)
  })
})

describe("regla mayorista configurable (MXN 40,000 histórica)", () => {
  it("califica exactamente en el umbral", () => {
    expect(qualifiesForWholesale("40000", config)).toBe(true)
    expect(qualifiesForWholesale("39999.99", config)).toBe(false)
  })

  it("resuelve canal con explicación", () => {
    const w = resolveChannelForOrder("52000", config)
    expect(w.channel).toBe("wholesale")
    expect(w.explanation).toContain("regla histórica")
    const r = resolveChannelForOrder("1500", config)
    expect(r.channel).toBe("retail")
  })

  it("el umbral es configuración, no constante", () => {
    const custom = { ...config, wholesaleMinimumOrderMxn: "25000" }
    expect(qualifiesForWholesale("30000", custom)).toBe(true)
  })
})

describe("margen", () => {
  it("calcula margen porcentual", () => {
    expect(computeMarginPct("100", "60")).toBe("40")
  })
  it("devuelve null con precio cero", () => {
    expect(computeMarginPct("0", "60")).toBeNull()
  })
})
