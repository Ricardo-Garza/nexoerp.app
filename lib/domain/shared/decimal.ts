/**
 * Aritmética decimal fixed-point sobre BigInt (escala 6).
 * Regla del contexto: dinero y cantidades nunca se manejan con float.
 * Los valores se almacenan como string canónico ("123.456789") en las entidades.
 */
const SCALE = 6
const FACTOR = 10n ** BigInt(SCALE)

export type DecimalString = string

function parseToBigInt(value: string | number): bigint {
  const str = typeof value === "number" ? value.toFixed(SCALE) : value.trim()
  if (!/^-?\d+(\.\d+)?$/.test(str)) {
    throw new Error(`Valor decimal inválido: "${value}"`)
  }
  const negative = str.startsWith("-")
  const abs = negative ? str.slice(1) : str
  const [intPart, fracPart = ""] = abs.split(".")
  const frac = (fracPart + "0".repeat(SCALE)).slice(0, SCALE)
  // redondeo half-up del dígito sobrante
  const nextDigit = fracPart.length > SCALE ? Number(fracPart[SCALE]) : 0
  let result = BigInt(intPart) * FACTOR + BigInt(frac)
  if (nextDigit >= 5) result += 1n
  return negative ? -result : result
}

function toDecimalString(raw: bigint): DecimalString {
  const negative = raw < 0n
  const abs = negative ? -raw : raw
  const intPart = abs / FACTOR
  const frac = (abs % FACTOR).toString().padStart(SCALE, "0").replace(/0+$/, "")
  return `${negative ? "-" : ""}${intPart}${frac ? "." + frac : ""}`
}

export const dec = {
  add(a: string | number, b: string | number): DecimalString {
    return toDecimalString(parseToBigInt(a) + parseToBigInt(b))
  },
  sub(a: string | number, b: string | number): DecimalString {
    return toDecimalString(parseToBigInt(a) - parseToBigInt(b))
  },
  mul(a: string | number, b: string | number): DecimalString {
    const product = parseToBigInt(a) * parseToBigInt(b)
    // reescalar con redondeo half-up
    const negative = product < 0n
    const abs = negative ? -product : product
    const scaled = (abs + FACTOR / 2n) / FACTOR
    return toDecimalString(negative ? -scaled : scaled)
  },
  div(a: string | number, b: string | number): DecimalString {
    const divisor = parseToBigInt(b)
    if (divisor === 0n) throw new Error("División entre cero")
    const dividend = parseToBigInt(a) * FACTOR
    const negative = dividend < 0n !== divisor < 0n
    const absDividend = dividend < 0n ? -dividend : dividend
    const absDivisor = divisor < 0n ? -divisor : divisor
    const quotient = (absDividend + absDivisor / 2n) / absDivisor
    return toDecimalString(negative ? -quotient : quotient)
  },
  cmp(a: string | number, b: string | number): -1 | 0 | 1 {
    const x = parseToBigInt(a)
    const y = parseToBigInt(b)
    return x < y ? -1 : x > y ? 1 : 0
  },
  isPositive(a: string | number): boolean {
    return parseToBigInt(a) > 0n
  },
  isNegative(a: string | number): boolean {
    return parseToBigInt(a) < 0n
  },
  isZero(a: string | number): boolean {
    return parseToBigInt(a) === 0n
  },
  normalize(a: string | number): DecimalString {
    return toDecimalString(parseToBigInt(a))
  },
  toNumber(a: string | number): number {
    // solo para presentación/gráficas, nunca para cálculo encadenado
    return Number(parseToBigInt(a)) / Number(FACTOR)
  },
  formatMoney(a: string | number, currency = "MXN", locale = "es-MX"): string {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(dec.toNumber(a))
  },
}
