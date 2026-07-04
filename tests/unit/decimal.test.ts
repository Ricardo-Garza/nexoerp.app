import { describe, expect, it } from "vitest"
import { dec } from "@/lib/domain/shared/decimal"

describe("decimal fixed-point", () => {
  it("suma y resta exactas (sin errores de float)", () => {
    expect(dec.add("0.1", "0.2")).toBe("0.3") // 0.1+0.2 !== 0.30000000000000004
    expect(dec.sub("1233.74", "1201.56")).toBe("32.18")
  })

  it("multiplica precio por piezas por caja", () => {
    expect(dec.mul("319.09", 4)).toBe("1276.36")
    expect(dec.mul("530.29", 4)).toBe("2121.16")
  })

  it("divide con redondeo half-up a 6 decimales", () => {
    expect(dec.div("10", "3")).toBe("3.333333")
    expect(dec.div("20", "8")).toBe("2.5")
  })

  it("compara correctamente", () => {
    expect(dec.cmp("40000", "39999.99")).toBe(1)
    expect(dec.cmp("40000", "40000.00")).toBe(0)
    expect(dec.cmp("800", "40000")).toBe(-1)
  })

  it("rechaza entradas inválidas", () => {
    expect(() => dec.add("abc", "1")).toThrow()
    expect(() => dec.div("1", "0")).toThrow()
  })

  it("formatea moneda MXN", () => {
    expect(dec.formatMoney("1233.74")).toContain("1,233.74")
  })
})
