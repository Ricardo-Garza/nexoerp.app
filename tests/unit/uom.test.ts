import { describe, expect, it } from "vitest"
import { casesToPieces, convertQuantity, piecesToCases } from "@/lib/domain/uom/uom"

describe("conversiones UOM", () => {
  it("convierte dentro de la misma dimensión", () => {
    const kgToG = convertQuantity("3.4", "KG", "G")
    expect(kgToG.ok && kgToG.value).toBe("3400")
    const galToL = convertQuantity("1", "GAL", "L")
    expect(galToL.ok && galToL.value).toBe("3.785412")
  })

  it("rechaza conversión entre dimensiones sin factor de SKU", () => {
    const r = convertQuantity("1", "L", "KG")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe("validation")
  })

  it("rechaza unidades desconocidas", () => {
    expect(convertQuantity("1", "XX", "KG").ok).toBe(false)
  })

  it("convierte piezas ↔ cajas por empaque", () => {
    const cases = piecesToCases("12", 4)
    expect(cases.ok && cases.value).toBe("3")
    const pieces = casesToPieces("3", 4)
    expect(pieces.ok && pieces.value).toBe("12")
  })

  it("rechaza empaques inválidos", () => {
    expect(piecesToCases("12", 0).ok).toBe(false)
    expect(casesToPieces("3", -1).ok).toBe(false)
  })
})
