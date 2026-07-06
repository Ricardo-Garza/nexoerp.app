"use client"

import { useMemo, useState, useEffect, type ReactNode } from "react"
import * as XLSX from "xlsx"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  Download,
  Rows3,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { downloadBlob } from "@/lib/import/engine"

export interface ProColumn<T> {
  key: string
  header: string
  /** Extrae el valor para ordenar/exportar/sumar (crudo). */
  accessor: (row: T) => string | number | null | undefined
  /** Render enriquecido opcional (badges, links...). Por defecto muestra el accessor. */
  cell?: (row: T) => ReactNode
  /** Suma/promedia en el pie si es numérica */
  numeric?: boolean
  /** Alineación de celda */
  align?: "left" | "right" | "center"
  /** Puede ocultarse desde el selector de columnas (default true) */
  hideable?: boolean
  /** Visible por defecto (default true) */
  defaultVisible?: boolean
}

export interface BulkAction<T> {
  label: string
  icon?: ReactNode
  onClick: (selected: T[]) => void
  variant?: "default" | "destructive" | "outline" | "secondary"
}

interface DataTableProProps<T> {
  /** Id estable para persistir variantes/columnas por usuario */
  tableId: string
  columns: ProColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  /** Filtros rápidos (chips) opcionales */
  quickFilters?: { label: string; predicate: (row: T) => boolean }[]
  bulkActions?: BulkAction<T>[]
  /** Acciones por fila (menú al final) */
  rowActions?: (row: T) => ReactNode
  emptyMessage?: string
  /** testid para E2E */
  testId?: string
}

type SortDir = "asc" | "desc" | null

interface Density {
  py: string
  text: string
}
const DENSITIES: Record<string, Density> = {
  compact: { py: "py-1", text: "text-xs" },
  medium: { py: "py-2", text: "text-sm" },
  comfortable: { py: "py-3", text: "text-sm" },
}

export function DataTablePro<T>({
  tableId,
  columns,
  rows,
  getRowId,
  quickFilters = [],
  bulkActions = [],
  rowActions,
  emptyMessage = "Sin registros",
  testId,
}: DataTableProProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [density, setDensity] = useState<keyof typeof DENSITIES>("medium")
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeQuick, setActiveQuick] = useState<number | null>(null)

  // Restaura variante guardada por usuario (columnas/densidad)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(`nexo_table_${tableId}`)
      if (raw) {
        const v = JSON.parse(raw) as { hidden?: string[]; density?: keyof typeof DENSITIES }
        if (v.hidden) setHidden(new Set(v.hidden))
        if (v.density) setDensity(v.density)
      }
    } catch {
      /* ignore */
    }
  }, [tableId])

  function persist(nextHidden: Set<string>, nextDensity: keyof typeof DENSITIES) {
    if (typeof window === "undefined") return
    window.localStorage.setItem(
      `nexo_table_${tableId}`,
      JSON.stringify({ hidden: [...nextHidden], density: nextDensity }),
    )
  }

  const visibleColumns = columns.filter((c) => !hidden.has(c.key))

  const filtered = useMemo(() => {
    let data = rows
    if (activeQuick !== null && quickFilters[activeQuick]) {
      data = data.filter(quickFilters[activeQuick].predicate)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter((row) =>
        columns.some((c) => {
          const v = c.accessor(row)
          return v != null && String(v).toLowerCase().includes(q)
        }),
      )
    }
    if (sortKey && sortDir) {
      const col = columns.find((c) => c.key === sortKey)
      if (col) {
        data = [...data].sort((a, b) => {
          const av = col.accessor(a)
          const bv = col.accessor(b)
          if (av == null) return 1
          if (bv == null) return -1
          if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av
          return sortDir === "asc"
            ? String(av).localeCompare(String(bv), "es")
            : String(bv).localeCompare(String(av), "es")
        })
      }
    }
    return data
  }, [rows, columns, search, sortKey, sortDir, activeQuick, quickFilters])

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
    } else if (sortDir === "asc") {
      setSortDir("desc")
    } else {
      setSortKey(null)
      setSortDir(null)
    }
  }

  function toggleColumn(key: string) {
    const next = new Set(hidden)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setHidden(next)
    persist(next, density)
  }

  function changeDensity(d: keyof typeof DENSITIES) {
    setDensity(d)
    persist(hidden, d)
  }

  function toggleRow(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(getRowId)))
  }

  function exportData(type: "csv" | "xlsx") {
    const headers = visibleColumns.map((c) => c.header)
    const data = filtered.map((row) => visibleColumns.map((c) => c.accessor(row) ?? ""))
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    if (type === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws)
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${tableId}.csv`)
    } else {
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Datos")
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      downloadBlob(
        new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `${tableId}.xlsx`,
      )
    }
  }

  const totals = useMemo(() => {
    const t: Record<string, number> = {}
    for (const col of visibleColumns) {
      if (!col.numeric) continue
      t[col.key] = filtered.reduce((acc, row) => {
        const v = col.accessor(row)
        return acc + (typeof v === "number" ? v : Number(v) || 0)
      }, 0)
    }
    return t
  }, [filtered, visibleColumns])

  const d = DENSITIES[density]
  const selectedRows = filtered.filter((r) => selected.has(getRowId(r)))
  const nf = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 })

  return (
    <div className="space-y-3" data-testid={testId}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            aria-label="Buscar en la tabla"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="table-search"
          />
        </div>

        {quickFilters.map((qf, i) => (
          <Button
            key={qf.label}
            size="sm"
            variant={activeQuick === i ? "default" : "outline"}
            onClick={() => setActiveQuick(activeQuick === i ? null : i)}
          >
            {qf.label}
          </Button>
        ))}

        {/* Selector de columnas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" data-testid="table-columns">
              <SlidersHorizontal className="w-4 h-4 mr-1" /> Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns
              .filter((c) => c.hideable !== false)
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={!hidden.has(c.key)}
                  onCheckedChange={() => toggleColumn(c.key)}
                >
                  {c.header}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Densidad */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Rows3 className="w-4 h-4 mr-1" /> Densidad
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(DENSITIES) as (keyof typeof DENSITIES)[]).map((k) => (
              <DropdownMenuItem key={k} onClick={() => changeDensity(k)}>
                {density === k ? <Check className="w-4 h-4 mr-2" /> : <span className="w-4 mr-2" />}
                {k === "compact" ? "Compacta" : k === "medium" ? "Media" : "Cómoda"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Exportar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" data-testid="table-export">
              <Download className="w-4 h-4 mr-1" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportData("xlsx")}>Excel (.xlsx)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportData("csv")}>CSV (.csv)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Barra de acciones masivas */}
      {selectedRows.length > 0 && bulkActions.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2" data-testid="bulk-bar">
          <Badge variant="secondary">{selectedRows.length} seleccionados</Badge>
          {bulkActions.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant={a.variant ?? "outline"}
              onClick={() => {
                a.onClick(selectedRows)
                setSelected(new Set())
              }}
            >
              {a.icon}
              {a.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-lg border overflow-x-auto">
        <table className={cn("w-full", d.text)}>
          <thead className="bg-muted/60 border-b sticky top-0">
            <tr>
              {bulkActions.length > 0 && (
                <th className="w-10 px-3">
                  <Checkbox
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onCheckedChange={toggleAll}
                    aria-label="Seleccionar todo"
                  />
                </th>
              )}
              {visibleColumns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 font-semibold text-muted-foreground whitespace-nowrap select-none",
                    d.py,
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                  )}
                >
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort(c.key)}
                  >
                    {c.header}
                    {sortKey === c.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </button>
                </th>
              ))}
              {rowActions && <th className="w-10 px-3" />}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (bulkActions.length ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const id = getRowId(row)
                return (
                  <tr key={id} className="border-b last:border-0 hover:bg-muted/40" data-testid={`row-${id}`}>
                    {bulkActions.length > 0 && (
                      <td className="px-3">
                        <Checkbox
                          checked={selected.has(id)}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label={`Seleccionar ${id}`}
                        />
                      </td>
                    )}
                    {visibleColumns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-3 whitespace-nowrap",
                          d.py,
                          c.align === "right" && "text-right tabular-nums",
                          c.align === "center" && "text-center",
                        )}
                      >
                        {c.cell ? c.cell(row) : (c.accessor(row) ?? "—")}
                      </td>
                    ))}
                    {rowActions && <td className="px-3 text-right">{rowActions(row)}</td>}
                  </tr>
                )
              })
            )}
          </tbody>
          {/* Pie con sumas/subtotales */}
          {Object.keys(totals).length > 0 && filtered.length > 0 && (
            <tfoot className="border-t bg-muted/60 font-semibold">
              <tr>
                {bulkActions.length > 0 && <td className="px-3" />}
                {visibleColumns.map((c, i) => (
                  <td
                    key={c.key}
                    className={cn("px-3", d.py, c.align === "right" && "text-right tabular-nums")}
                  >
                    {i === 0 && !c.numeric ? `Σ ${filtered.length} filas` : c.numeric ? nf.format(totals[c.key]) : ""}
                  </td>
                ))}
                {rowActions && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {rows.length} registros
        {search && ` · filtro "${search}"`}
      </p>
    </div>
  )
}
