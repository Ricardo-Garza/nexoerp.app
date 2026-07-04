import { dec, type DecimalString } from "../shared/decimal"
import { err, ok, type Result } from "../shared/result"

/** Unidades de medida controladas (docs/04_DOMAIN_MODEL.md). */
export type UomDimension = "count" | "mass" | "volume"

export interface Uom {
  code: string
  name: string
  dimension: UomDimension
  /** Factor exacto hacia la unidad base de su dimensión (EA, KG, L) */
  factorToBase: DecimalString
}

export const BASE_UOMS: Record<UomDimension, string> = {
  count: "EA",
  mass: "KG",
  volume: "L",
}

export const STANDARD_UOMS: Uom[] = [
  { code: "EA", name: "Pieza", dimension: "count", factorToBase: "1" },
  { code: "CASE", name: "Caja", dimension: "count", factorToBase: "1" }, // piezas por caja viven en el empaque del SKU
  { code: "SACHET", name: "Sobre", dimension: "count", factorToBase: "1" },
  { code: "KG", name: "Kilogramo", dimension: "mass", factorToBase: "1" },
  { code: "G", name: "Gramo", dimension: "mass", factorToBase: "0.001" },
  { code: "L", name: "Litro", dimension: "volume", factorToBase: "1" },
  { code: "ML", name: "Mililitro", dimension: "volume", factorToBase: "0.001" },
  { code: "GAL", name: "Galón (US)", dimension: "volume", factorToBase: "3.785412" },
]

const uomIndex = new Map(STANDARD_UOMS.map((u) => [u.code, u]))

export function getUom(code: string): Uom | undefined {
  return uomIndex.get(code)
}

/**
 * Convierte cantidades dentro de la misma dimensión con factores exactos.
 * Conversión entre dimensiones (p. ej. L→KG) requiere densidad por SKU y
 * NO está permitida aquí (invariante 1 del modelo de dominio).
 */
export function convertQuantity(
  quantity: DecimalString | number,
  fromCode: string,
  toCode: string,
): Result<DecimalString> {
  const from = uomIndex.get(fromCode)
  const to = uomIndex.get(toCode)
  if (!from) return err("validation", `Unidad desconocida: ${fromCode}`)
  if (!to) return err("validation", `Unidad desconocida: ${toCode}`)
  if (from.dimension !== to.dimension) {
    return err(
      "validation",
      `No se puede convertir ${fromCode} (${from.dimension}) a ${toCode} (${to.dimension}) sin factor específico del SKU`,
    )
  }
  const inBase = dec.mul(quantity, from.factorToBase)
  return ok(dec.div(inBase, to.factorToBase))
}

/** Piezas ↔ cajas según empaque del SKU. */
export function piecesToCases(pieces: DecimalString | number, unitsPerCase: number): Result<DecimalString> {
  if (!Number.isInteger(unitsPerCase) || unitsPerCase <= 0) {
    return err("validation", `Piezas por caja inválido: ${unitsPerCase}`)
  }
  return ok(dec.div(pieces, unitsPerCase))
}

export function casesToPieces(cases: DecimalString | number, unitsPerCase: number): Result<DecimalString> {
  if (!Number.isInteger(unitsPerCase) || unitsPerCase <= 0) {
    return err("validation", `Piezas por caja inválido: ${unitsPerCase}`)
  }
  return ok(dec.mul(cases, unitsPerCase))
}
