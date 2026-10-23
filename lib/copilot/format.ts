const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
const mxnDec = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 })
const int = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 })
const dec = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 })

export const fmtMxn = (n: number) => `${mxn.format(n)} MXN`
export const fmtMxnExact = (n: number) => `${mxnDec.format(n)} MXN`
export const fmtInt = (n: number) => int.format(n)
export const fmtNum = (n: number) => dec.format(n)
export const fmtPct = (n: number | null, digits = 1) => (n === null ? "n/d" : `${n.toFixed(digits)}%`)

/** Importe compacto para tarjetas KPI: $1.23 M MXN. */
export function fmtMxnCompact(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)} M`
  if (abs >= 10_000) return `${sign}$${(abs / 1_000).toFixed(1)} mil`
  return `${sign}$${int.format(abs)}`
}

export const fmtDelta = (pct: number | null) => (pct === null ? "n/d" : `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}%`)

const UNIT_LABEL: Record<string, string> = { m: "m", rollo: "rollos", pza: "pzas" }
/** Cantidades por unidad: nunca suma metros con piezas. */
export function fmtUnits(units: Partial<Record<string, number>>): string {
  const parts = Object.entries(units)
    .filter(([, q]) => q)
    .map(([u, q]) => `${fmtInt(q ?? 0)} ${UNIT_LABEL[u] ?? u}`)
  return parts.length ? parts.join(" + ") : "0"
}
