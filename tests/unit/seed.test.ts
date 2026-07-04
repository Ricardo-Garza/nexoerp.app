import { describe, expect, it } from "vitest"
import { projectStock } from "@/lib/domain/inventory/ledger"
import { buildSeedEntities } from "@/lib/domain/seed/seed"
import { getStore, seedStore } from "@/lib/server/store"

describe("seed idempotente (criterio de aceptación 19)", () => {
  it("carga el catálogo de 57 SKUs con marcas, familias y listas", () => {
    const seed = buildSeedEntities()
    expect(seed.skus).toHaveLength(57)
    expect(seed.brands.length).toBeGreaterThanOrEqual(7)
    expect(seed.priceLists).toHaveLength(2)
    expect(seed.priceEntries.length).toBeGreaterThan(100)
    // Ranch existe en múltiples presentaciones distintas (regla funcional §4)
    const ranch = seed.skus.filter((s) => seed.families.find((f) => f.id === s.familyId)?.name.includes("Ranch"))
    expect(new Set(ranch.map((r) => r.sku)).size).toBeGreaterThanOrEqual(2)
  })

  it("no inventa EAN/DUN faltantes: quedan null y marcados por validar", () => {
    const seed = buildSeedEntities()
    const missing = seed.skus.filter((s) => s.ean === null)
    expect(missing.length).toBeGreaterThan(0)
    for (const s of missing) {
      expect(s.dataStatus).not.toBe("validated")
    }
  })

  it("ejecutar el seed dos veces no duplica entidades ni stock", () => {
    const store = getStore()
    const skuCount = store.skus.size
    const movementCount = store.movements.size
    const stockBefore = JSON.stringify(projectStock([...store.movements.values()]).sort((a, b) => (a.lotId! < b.lotId! ? -1 : 1)))

    seedStore(store) // segunda ejecución
    expect(store.skus.size).toBe(skuCount)
    expect(store.movements.size).toBe(movementCount)
    const stockAfter = JSON.stringify(projectStock([...store.movements.values()]).sort((a, b) => (a.lotId! < b.lotId! ? -1 : 1)))
    expect(stockAfter).toBe(stockBefore)
  })

  it("los IDs son deterministas entre ejecuciones", () => {
    const a = buildSeedEntities()
    const b = buildSeedEntities()
    expect(a.skus.map((s) => s.id)).toEqual(b.skus.map((s) => s.id))
    expect(a.priceEntries.map((e) => e.id)).toEqual(b.priceEntries.map((e) => e.id))
  })
})
