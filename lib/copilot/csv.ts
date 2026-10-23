import type { CopilotResult } from "./result"

const FORMULA_START = /^[=+\-@\t\r]/

/** Escapa una celda CSV y neutraliza inyección de fórmulas en Excel (=, +, -, @). */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  let s = typeof value === "number" ? String(value) : value
  if (typeof value === "string" && FORMULA_START.test(s)) s = `'${s}`
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

/**
 * CSV del resultado visible (tabla o, en su defecto, los datos de la gráfica). Exporta exactamente
 * lo que se ve en pantalla —nunca registros adicionales— y cierra con la leyenda DEMO.
 */
export function resultToCsv(result: CopilotResult, today: string): { filename: string; content: string } | null {
  let header: string[]
  let rows: (string | number | null)[][]
  if (result.table && result.table.rows.length) {
    header = result.table.columns.map((c) => c.label)
    rows = result.table.rows.map((r) => result.table!.columns.map((c) => r[c.key] ?? null))
  } else if (result.chart && result.chart.data.length) {
    const keys = [result.chart.xKey, ...result.chart.series.map((s) => s.key)]
    header = [result.chart.xKey, ...result.chart.series.map((s) => s.label)]
    rows = result.chart.data.map((r) => keys.map((k) => r[k] ?? null))
  } else {
    return null
  }
  const lines = [header, ...rows].map((r) => r.map(csvCell).join(","))
  lines.push("", csvCell("DATOS SIMULADOS (DEMO) · Nexo Intelligence · Soleil Wire"))
  return { filename: `nexo-intelligence-${slug(result.title) || "resultado"}-${today}.csv`, content: lines.join("\r\n") }
}
