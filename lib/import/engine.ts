"use client"

import * as XLSX from "xlsx"
import { type EntityTemplate, type FieldDef, normalizeHeader } from "./templates"

/**
 * Motor de importación masiva: parseo (CSV/XLSX), auto-mapeo de columnas,
 * validación por tipo/nivel, detección de duplicados y dry-run. No escribe nada
 * por sí mismo; devuelve un plan que la UI confirma antes de ejecutar.
 */

export interface ParsedFile {
  headers: string[]
  rows: Record<string, string>[]
}

export interface RowError {
  row: number // 1-based (fila de datos, sin contar encabezado)
  field: string
  value: string
  message: string
}

export interface ValidationResult {
  mapping: Record<string, string> // fieldKey -> header
  validRows: Record<string, unknown>[]
  errors: RowError[]
  duplicates: { row: number; key: string }[]
  totalRows: number
}

/** Lee un archivo (CSV o XLSX) a { headers, rows }. */
export async function parseFile(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: "array" })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return { headers: [], rows: [] }
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, defval: "" })
  if (matrix.length === 0) return { headers: [], rows: [] }
  const headers = (matrix[0] as unknown[]).map((h) => String(h ?? "").trim())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < matrix.length; i++) {
    const arr = matrix[i] as unknown[]
    if (!arr || arr.every((c) => String(c ?? "").trim() === "")) continue
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = String(arr[idx] ?? "").trim()
    })
    rows.push(obj)
  }
  return { headers, rows }
}

/** Auto-mapea encabezados del archivo a los campos de la plantilla por nombre/alias. */
export function autoMap(template: EntityTemplate, headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const normHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }))
  for (const field of template.fields) {
    const candidates = [field.key, field.label, ...(field.aliases ?? [])].map(normalizeHeader)
    const hit = normHeaders.find((h) => candidates.includes(h.norm))
    if (hit) mapping[field.key] = hit.raw
  }
  return mapping
}

function coerce(value: string, field: FieldDef): { ok: boolean; value?: unknown; message?: string } {
  const v = (value ?? "").trim()
  if (v === "") {
    if (field.level === "required") return { ok: false, message: "Campo obligatorio vacío" }
    return { ok: true, value: undefined }
  }
  switch (field.type) {
    case "number": {
      const n = Number(v.replace(/,/g, ""))
      if (Number.isNaN(n)) return { ok: false, message: `"${v}" no es un número válido` }
      return { ok: true, value: n }
    }
    case "email": {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { ok: false, message: `"${v}" no es un correo válido` }
      return { ok: true, value: v.toLowerCase() }
    }
    case "date": {
      const iso = /^\d{4}-\d{2}-\d{2}$/
      if (iso.test(v)) return { ok: true, value: v }
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return { ok: false, message: `"${v}" no es una fecha válida (usa AAAA-MM-DD)` }
      return { ok: true, value: d.toISOString().slice(0, 10) }
    }
    case "boolean": {
      const t = ["1", "true", "si", "sí", "verdadero", "x"].includes(v.toLowerCase())
      const f = ["0", "false", "no", "falso", ""].includes(v.toLowerCase())
      if (!t && !f) return { ok: false, message: `"${v}" no es booleano` }
      return { ok: true, value: t }
    }
    case "enum": {
      const allowed = field.enumValues ?? []
      const match = allowed.find((a) => a.toLowerCase() === v.toLowerCase())
      if (!match) return { ok: false, message: `"${v}" no está en [${allowed.join(", ")}]` }
      return { ok: true, value: match }
    }
    default:
      return { ok: true, value: v }
  }
}

/** Valida las filas contra la plantilla y el mapeo dado. */
export function validate(
  template: EntityTemplate,
  rows: Record<string, string>[],
  mapping: Record<string, string>,
  existingKeys: Set<string> = new Set(),
): ValidationResult {
  const errors: RowError[] = []
  const duplicates: { row: number; key: string }[] = []
  const validRows: Record<string, unknown>[] = []
  const uniqueFields = template.fields.filter((f) => f.unique)
  const seen = new Set<string>(existingKeys)

  rows.forEach((raw, i) => {
    const rowNum = i + 1
    const record: Record<string, unknown> = {}
    let rowOk = true

    for (const field of template.fields) {
      const header = mapping[field.key]
      const rawVal = header ? (raw[header] ?? "") : ""
      const res = coerce(rawVal, field)
      if (!res.ok) {
        errors.push({ row: rowNum, field: field.key, value: rawVal, message: res.message ?? "Inválido" })
        rowOk = false
      } else if (res.value !== undefined) {
        record[field.key] = res.value
      }
    }

    // Duplicados por clave natural (dentro del archivo + existentes)
    if (rowOk && uniqueFields.length > 0) {
      const key = uniqueFields
        .map((f) => String(record[f.key] ?? "").toLowerCase())
        .filter(Boolean)
        .join("|")
      if (key) {
        if (seen.has(key)) {
          duplicates.push({ row: rowNum, key })
          rowOk = false
        } else {
          seen.add(key)
        }
      }
    }

    if (rowOk) validRows.push(record)
  })

  return { mapping, validRows, errors, duplicates, totalRows: rows.length }
}

/** Genera un archivo de plantilla XLSX (con fila de ejemplo) para descargar. */
export function buildTemplateWorkbook(template: EntityTemplate): Blob {
  const headers = template.fields.map((f) => f.label)
  const example = template.fields.map((f) => f.example)
  const levels = template.fields.map((f) =>
    f.level === "required" ? "OBLIGATORIA" : f.level === "recommended" ? "recomendada" : "opcional",
  )
  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  const guide = XLSX.utils.aoa_to_sheet([
    ["Columna", "Nivel", "Tipo", "Ejemplo", "Ayuda"],
    ...template.fields.map((f, i) => [f.label, levels[i], f.type, f.example, f.help ?? ""]),
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Datos")
  XLSX.utils.book_append_sheet(wb, guide, "Guía de columnas")
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

/** Serializa los errores a CSV descargable. */
export function errorsToCsv(errors: RowError[]): Blob {
  const header = "fila,columna,valor,error"
  const lines = errors.map((e) => {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`
    return [e.row, esc(e.field), esc(e.value), esc(e.message)].join(",")
  })
  return new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
