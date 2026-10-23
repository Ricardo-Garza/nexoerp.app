import type { IsoDate } from "./types"

const DAY_MS = 86_400_000

export const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
export const MONTHS_SHORT_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

export const toMs = (d: IsoDate) => Date.parse(`${d}T00:00:00Z`)
export const fromMs = (ms: number): IsoDate => new Date(ms).toISOString().slice(0, 10)
export const addDays = (d: IsoDate, n: number): IsoDate => fromMs(toMs(d) + n * DAY_MS)
export const diffDays = (a: IsoDate, b: IsoDate) => Math.round((toMs(a) - toMs(b)) / DAY_MS)
export const isIsoDate = (s: unknown): s is IsoDate => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))

export const yearOf = (d: IsoDate) => Number(d.slice(0, 4))
export const monthOf = (d: IsoDate) => Number(d.slice(5, 7))
export const monthKey = (d: IsoDate) => d.slice(0, 7)
export const quarterOf = (d: IsoDate) => Math.floor((monthOf(d) - 1) / 3) + 1
export const quarterKey = (d: IsoDate) => `${yearOf(d)}-T${quarterOf(d)}`

export function startOfMonth(d: IsoDate): IsoDate {
  return `${d.slice(0, 7)}-01`
}
export function endOfMonth(d: IsoDate): IsoDate {
  const y = yearOf(d)
  const m = monthOf(d)
  return fromMs(Date.UTC(y, m, 0))
}
export function addMonths(d: IsoDate, n: number): IsoDate {
  const y = yearOf(d)
  const m = monthOf(d) - 1 + n
  return fromMs(Date.UTC(y + Math.floor(m / 12), ((m % 12) + 12) % 12, 1))
}
export function startOfQuarter(d: IsoDate): IsoDate {
  const q = quarterOf(d)
  return `${yearOf(d)}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01`
}
export function endOfQuarter(d: IsoDate): IsoDate {
  return endOfMonth(addMonths(startOfQuarter(d), 2))
}
/** Lunes de la semana ISO que contiene `d`. */
export function startOfWeek(d: IsoDate): IsoDate {
  const dow = new Date(toMs(d)).getUTCDay() // 0=domingo
  return addDays(d, -((dow + 6) % 7))
}
export function weekKey(d: IsoDate) {
  return startOfWeek(d)
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-")
  return `${MONTHS_SHORT_ES[Number(m) - 1]} ${y.slice(2)}`
}

export function formatDateEs(d: IsoDate): string {
  return `${Number(d.slice(8, 10))} ${MONTHS_SHORT_ES[monthOf(d) - 1]} ${yearOf(d)}`
}

/** Meses completos o parciales entre dos fechas, en formato YYYY-MM. */
export function monthsBetween(from: IsoDate, to: IsoDate): string[] {
  const out: string[] = []
  let cur = startOfMonth(from)
  while (cur <= to) {
    out.push(monthKey(cur))
    cur = addMonths(cur, 1)
  }
  return out
}
