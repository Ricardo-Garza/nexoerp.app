"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import * as XLSX from "xlsx"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bookmark,
  Check,
  ChevronDown,
  Download,
  EyeOff,
  Filter,
  HelpCircle,
  History,
  Printer,
  RefreshCw,
  RotateCcw,
  Rows3,
  Search,
  Sigma,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { downloadBlob } from "@/lib/import/engine"
import { readErpPreferences } from "@/lib/platform/user-preferences-storage"
import {
  buildExportFilename,
  computeNumberStats,
  removeSavedView,
  upsertSavedView,
  type ColumnStats,
  type SavedTableView,
} from "@/lib/table/enterprise-table"
import { cn } from "@/lib/utils"

type SortDir = "asc" | "desc" | null
type FilterType = "text" | "number" | "date" | "select"

export interface ProColumn<T> {
  key: string
  header: string
  accessor: (row: T) => string | number | null | undefined
  cell?: (row: T) => ReactNode
  numeric?: boolean
  /** Formatea totales y estadísticas como moneda MXN y suma con aritmética decimal segura. */
  currency?: boolean
  align?: "left" | "right" | "center"
  hideable?: boolean
  defaultVisible?: boolean
  filterable?: boolean
  filterType?: FilterType
  filterOptions?: { label: string; value: string }[]
}

export interface BulkAction<T> {
  label: string
  icon?: ReactNode
  onClick: (selected: T[]) => void
  variant?: "default" | "destructive" | "outline" | "secondary"
}

export interface RecentChange {
  id: string
  title: string
  description?: string
  actor?: string
  at?: string
  href?: string
}

interface DataTableProProps<T> {
  tableId: string
  columns: ProColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  getRowTestId?: (row: T) => string
  quickFilters?: { label: string; predicate: (row: T) => boolean }[]
  bulkActions?: BulkAction<T>[]
  rowActions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  emptyMessage?: string
  emptyHint?: string
  moduleName?: string
  tenantName?: string
  toolbarActions?: ReactNode
  recentChanges?: RecentChange[]
  /** Pasos breves que explican cómo usar el módulo; activan el botón Ayuda. */
  helpItems?: string[]
  /** Ruta del Centro de Importación; activa el botón Importar. */
  importHref?: string
  /** Alternativa a importHref para abrir un flujo de importación propio. */
  onImport?: () => void
  onRefresh?: () => void
  testId?: string
}

interface Density {
  py: string
  text: string
}

const DENSITIES: Record<string, Density> = {
  compact: { py: "py-1", text: "text-xs" },
  medium: { py: "py-2", text: "text-sm" },
  comfortable: { py: "py-3", text: "text-sm" },
}

const DATE_FILTERS = new Set(["today", "thisweek", "thismonth", "last30"])

const DATE_PRESETS: { value: string; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "thisweek", label: "Esta semana" },
  { value: "thismonth", label: "Este mes" },
  { value: "last30", label: "Últimos 30 días" },
]

export function DataTablePro<T>({
  tableId,
  columns,
  rows,
  getRowId,
  getRowTestId,
  quickFilters = [],
  bulkActions = [],
  rowActions,
  onRowClick,
  emptyMessage = "No hay registros todavía.",
  emptyHint,
  moduleName,
  tenantName = "empresa",
  toolbarActions,
  recentChanges = [],
  helpItems = [],
  importHref,
  onImport,
  onRefresh,
  testId,
}: DataTableProProps<T>) {
  const defaultHidden = useMemo(
    () => new Set(columns.filter((column) => column.defaultVisible === false).map((column) => column.key)),
    [columns],
  )

  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [density, setDensity] = useState<keyof typeof DENSITIES>("medium")
  const [hidden, setHidden] = useState<Set<string>>(defaultHidden)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeQuick, setActiveQuick] = useState<number | null>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [savedViews, setSavedViews] = useState<SavedTableView[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(`nexo_table_${tableId}`)
      const globalDensity = readErpPreferences().tableDensity
      if (raw) {
        const view = JSON.parse(raw) as Partial<SavedTableView> & { density?: keyof typeof DENSITIES }
        if (view.hidden) setHidden(new Set(view.hidden))
        if (view.density && DENSITIES[view.density]) setDensity(view.density)
        else if (DENSITIES[globalDensity]) setDensity(globalDensity)
        if (view.columnFilters) setColumnFilters(view.columnFilters)
        if (view.sortKey !== undefined) setSortKey(view.sortKey)
        if (view.sortDir !== undefined) setSortDir(view.sortDir)
      } else if (DENSITIES[globalDensity]) {
        setDensity(globalDensity)
      }
      const rawViews = window.localStorage.getItem(`nexo_table_views_${tableId}`)
      if (rawViews) setSavedViews(JSON.parse(rawViews) as SavedTableView[])
    } catch {
      // La vista se puede reconstruir si el navegador guardó un dato inválido.
    }
  }, [tableId])

  function persist(next: {
    hidden?: Set<string>
    density?: keyof typeof DENSITIES
    columnFilters?: Record<string, string>
    sortKey?: string | null
    sortDir?: SortDir
  } = {}) {
    if (typeof window === "undefined") return
    window.localStorage.setItem(
      `nexo_table_${tableId}`,
      JSON.stringify({
        hidden: [...(next.hidden ?? hidden)],
        density: next.density ?? density,
        columnFilters: next.columnFilters ?? columnFilters,
        sortKey: next.sortKey === undefined ? sortKey : next.sortKey,
        sortDir: next.sortDir === undefined ? sortDir : next.sortDir,
      }),
    )
  }

  function persistViews(views: SavedTableView[]) {
    setSavedViews(views)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`nexo_table_views_${tableId}`, JSON.stringify(views))
    }
  }

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hidden.has(column.key)),
    [columns, hidden],
  )

  const filterableColumns = useMemo(
    () => columns.filter((column) => column.filterable !== false),
    [columns],
  )

  const filtered = useMemo(() => {
    let data = rows

    if (activeQuick !== null && quickFilters[activeQuick]) {
      data = data.filter(quickFilters[activeQuick].predicate)
    }

    if (search.trim()) {
      const query = normalizeText(search)
      data = data.filter((row) =>
        columns.some((column) => normalizeText(String(column.accessor(row) ?? "")).includes(query)),
      )
    }

    for (const [key, value] of Object.entries(columnFilters)) {
      const trimmed = value.trim()
      if (!trimmed) continue
      const column = columns.find((candidate) => candidate.key === key)
      if (!column) continue
      data = data.filter((row) => matchesColumnFilter(column.accessor(row), trimmed, column.filterType ?? "text"))
    }

    if (sortKey && sortDir) {
      const column = columns.find((candidate) => candidate.key === sortKey)
      if (column) {
        data = [...data].sort((a, b) => compareValues(column.accessor(a), column.accessor(b), sortDir))
      }
    }

    return data
  }, [activeQuick, columnFilters, columns, quickFilters, rows, search, sortDir, sortKey])

  const numericColumns = useMemo(() => visibleColumns.filter((column) => column.numeric), [visibleColumns])
  const selectedRows = filtered.filter((row) => selected.has(getRowId(row)))

  const statsFor = (scopeRows: T[]) => {
    const next: Record<string, ColumnStats> = {}
    for (const column of numericColumns) {
      next[column.key] = computeNumberStats(
        scopeRows.map((row) => column.accessor(row)),
        { money: column.currency },
      )
    }
    return next
  }

  const allColumnStats = useMemo(() => statsFor(rows), [rows, numericColumns])
  const filteredColumnStats = useMemo(() => statsFor(filtered), [filtered, numericColumns])
  const selectedColumnStats = useMemo(() => statsFor(selectedRows), [selectedRows, numericColumns])

  const activeFilterLabels = useMemo(() => {
    const labels: { key: string; label: string }[] = []
    if (search.trim()) labels.push({ key: "search", label: `Buscar: ${search.trim()}` })
    if (activeQuick !== null && quickFilters[activeQuick]) {
      labels.push({ key: "quick", label: quickFilters[activeQuick].label })
    }
    for (const [key, value] of Object.entries(columnFilters)) {
      const column = columns.find((candidate) => candidate.key === key)
      if (column && value.trim()) labels.push({ key, label: `${column.header}: ${prettyFilter(value)}` })
    }
    return labels
  }, [activeQuick, columnFilters, columns, quickFilters, search])

  const d = DENSITIES[density]
  const nf = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 })
  const mf = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })

  const formatCell = (column: ProColumn<T>, value: number) => (column.currency ? mf.format(value) : nf.format(value))

  function toggleSort(key: string) {
    let nextKey: string | null = key
    let nextDir: SortDir = "asc"
    if (sortKey === key && sortDir === "asc") nextDir = "desc"
    else if (sortKey === key && sortDir === "desc") {
      nextKey = null
      nextDir = null
    }
    setSortKey(nextKey)
    setSortDir(nextDir)
    persist({ sortKey: nextKey, sortDir: nextDir })
  }

  function setSort(key: string, dir: SortDir) {
    setSortKey(dir ? key : null)
    setSortDir(dir)
    persist({ sortKey: dir ? key : null, sortDir: dir })
  }

  function toggleColumn(key: string) {
    const next = new Set(hidden)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setHidden(next)
    persist({ hidden: next })
  }

  function changeDensity(nextDensity: keyof typeof DENSITIES) {
    setDensity(nextDensity)
    persist({ density: nextDensity })
  }

  function setFilter(key: string, value: string) {
    const next = { ...columnFilters }
    if (value.trim()) next[key] = value
    else delete next[key]
    setColumnFilters(next)
    persist({ columnFilters: next })
  }

  function clearFilters() {
    setSearch("")
    setActiveQuick(null)
    setColumnFilters({})
    persist({ columnFilters: {} })
  }

  function currentView(name: string): SavedTableView {
    return {
      name,
      hidden: [...hidden],
      density,
      columnFilters,
      sortKey,
      sortDir,
      quickFilter: activeQuick,
    }
  }

  function applyView(view: SavedTableView) {
    const nextHidden = new Set(view.hidden)
    const nextDensity = (DENSITIES[view.density] ? view.density : "medium") as keyof typeof DENSITIES
    setHidden(nextHidden)
    setDensity(nextDensity)
    setColumnFilters(view.columnFilters)
    setSortKey(view.sortKey)
    setSortDir(view.sortDir)
    setActiveQuick(view.quickFilter)
    persist({
      hidden: nextHidden,
      density: nextDensity,
      columnFilters: view.columnFilters,
      sortKey: view.sortKey,
      sortDir: view.sortDir,
    })
  }

  function restoreDefaultView() {
    applyView({
      name: "",
      hidden: [...defaultHidden],
      density: "medium",
      columnFilters: {},
      sortKey: null,
      sortDir: null,
      quickFilter: null,
    })
    setSearch("")
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
    const headers = visibleColumns.map((column) => column.header)
    const data = filtered.map((row) => visibleColumns.map((column) => column.accessor(row) ?? ""))
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const filename = buildExportFilename(moduleName ?? tableId, tenantName, new Date(), type)

    if (type === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws)
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename)
      return
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Datos")
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    downloadBlob(
      new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      filename,
    )
  }

  function printTable() {
    if (typeof window === "undefined") return
    const win = window.open("", "_blank", "width=1000,height=700")
    if (!win) return
    const title = moduleName ?? "Nexo ERP"
    const filterNote = activeFilterLabels.map((item) => item.label).join(" · ")
    const head = visibleColumns
      .map((column) => `<th style="text-align:${column.align ?? "left"}">${escapeHtml(column.header)}</th>`)
      .join("")
    const body = filtered
      .map(
        (row) =>
          `<tr>${visibleColumns
            .map((column) => {
              const value = column.accessor(row)
              const text =
                column.numeric && typeof value === "number" ? formatCell(column, value) : String(value ?? "")
              return `<td style="text-align:${column.align ?? "left"}">${escapeHtml(text)}</td>`
            })
            .join("")}</tr>`,
      )
      .join("")
    win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; color: #111; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { font-size: 12px; color: #555; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; }
  th { background: #f1f5f9; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(tenantName)} · ${new Date().toLocaleDateString("es-MX")} · ${filtered.length} registros${filterNote ? ` · Filtros: ${escapeHtml(filterNote)}` : ""}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  const importAction = onImport ?? (importHref ? () => window.location.assign(importHref) : undefined)

  return (
    <TooltipProvider>
      <div className="space-y-3" data-testid={testId}>
        <div className="rounded-xl border bg-card/95 p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar en la tabla"
                className="h-10 pl-9"
                data-testid="table-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar en registros visibles"
                value={search}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {quickFilters.map((filter, index) => (
                <TooltipButton
                  key={filter.label}
                  tooltip={`Aplicar filtro: ${filter.label}`}
                  size="sm"
                  variant={activeQuick === index ? "default" : "outline"}
                  onClick={() => setActiveQuick(activeQuick === index ? null : index)}
                >
                  {filter.label}
                </TooltipButton>
              ))}

              <ColumnFilters
                columns={filterableColumns}
                filters={columnFilters}
                onChange={setFilter}
                activeCount={activeFilterLabels.length}
              />

              {activeFilterLabels.length > 0 && (
                <TooltipButton tooltip="Quitar búsqueda y filtros activos" size="sm" variant="outline" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Limpiar
                </TooltipButton>
              )}

              <TotalsMenu
                columns={numericColumns}
                allStats={allColumnStats}
                filteredStats={filteredColumnStats}
                selectedStats={selectedColumnStats}
                rowCounts={{ all: rows.length, filtered: filtered.length, selected: selectedRows.length }}
                format={formatCell}
              />
              <ColumnsMenu columns={columns} hidden={hidden} onToggle={toggleColumn} />
              <ViewsMenu
                views={savedViews}
                onSave={(name) => persistViews(upsertSavedView(savedViews, currentView(name)))}
                onApply={applyView}
                onDelete={(name) => persistViews(removeSavedView(savedViews, name))}
                onRestore={restoreDefaultView}
              />
              <DensityMenu density={density} onChange={changeDensity} />
              <ExportMenu onExport={exportData} />

              {importAction && (
                <TooltipButton
                  tooltip="Carga masiva con plantilla, validación y vista previa"
                  size="sm"
                  variant="outline"
                  onClick={importAction}
                  data-testid="table-import"
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Importar
                </TooltipButton>
              )}

              <TooltipButton
                tooltip="Imprimir la vista actual con filtros y columnas visibles"
                size="sm"
                variant="outline"
                onClick={printTable}
                data-testid="table-print"
              >
                <Printer className="mr-1 h-4 w-4" />
                Imprimir
              </TooltipButton>

              {onRefresh && (
                <TooltipButton tooltip="Recargar información de la tabla" size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Recargar
                </TooltipButton>
              )}

              <RecentChangesMenu changes={recentChanges} />
              {helpItems.length > 0 && <HelpMenu moduleName={moduleName} items={helpItems} />}
              {toolbarActions}
            </div>
          </div>

          {activeFilterLabels.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2" data-testid="table-active-filters">
              {activeFilterLabels.map((item) => (
                <Badge key={`${item.key}-${item.label}`} variant="secondary" className="gap-1 rounded-full">
                  {item.label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" data-testid="table-metrics">
          <Metric label="Registros" value={`${filtered.length} de ${rows.length}`} />
          {selectedRows.length > 0 && <Metric label="Seleccionados" value={selectedRows.length.toString()} />}
          {numericColumns.slice(0, selectedRows.length > 0 ? 2 : 3).map((column) => (
            <Metric
              key={column.key}
              label={`Total ${column.header}`}
              value={formatCell(column, filteredColumnStats[column.key]?.sum ?? 0)}
            />
          ))}
        </div>

        {selectedRows.length > 0 && bulkActions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2" data-testid="bulk-bar">
            <Badge variant="secondary">{selectedRows.length} seleccionados</Badge>
            {bulkActions.map((action) => (
              <TooltipButton
                key={action.label}
                tooltip={`Aplicar a registros seleccionados: ${action.label}`}
                size="sm"
                variant={action.variant ?? "outline"}
                onClick={() => {
                  action.onClick(selectedRows)
                  setSelected(new Set())
                }}
              >
                {action.icon}
                {action.label}
              </TooltipButton>
            ))}
            <TooltipButton tooltip="Cancelar selección" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              <X className="h-4 w-4" />
            </TooltipButton>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className={cn("w-full", d.text)}>
            <thead className="sticky top-0 border-b bg-muted/70">
              <tr>
                {bulkActions.length > 0 && (
                  <th className="w-10 px-3">
                    <Checkbox
                      aria-label="Seleccionar todo"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                )}
                {visibleColumns.map((column) => (
                  <th
                    className={cn(
                      "px-3 font-semibold text-muted-foreground whitespace-nowrap select-none",
                      d.py,
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                    )}
                    key={column.key}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort(column.key)}
                        title={`Ordenar por ${column.header}`}
                        type="button"
                      >
                        {column.header}
                        {sortKey === column.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                      <ColumnHeaderMenu
                        column={column}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={setSort}
                        onHide={column.hideable !== false ? () => toggleColumn(column.key) : undefined}
                        onFilter={(value) => setFilter(column.key, value)}
                      />
                    </span>
                  </th>
                ))}
                {rowActions && <th className="w-10 px-3" />}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-10 text-center text-muted-foreground"
                    colSpan={visibleColumns.length + (bulkActions.length ? 1 : 0) + (rowActions ? 1 : 0)}
                  >
                    <p>{emptyMessage}</p>
                    {emptyHint && <p className="mt-1 text-xs">{emptyHint}</p>}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const id = getRowId(row)
                  return (
                    <tr
                      className={cn("border-b last:border-0 hover:bg-muted/45", onRowClick && "cursor-pointer")}
                      data-testid={getRowTestId ? getRowTestId(row) : `row-${id}`}
                      key={id}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {bulkActions.length > 0 && (
                        <td className="px-3" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            aria-label={`Seleccionar ${id}`}
                            checked={selected.has(id)}
                            onCheckedChange={() => toggleRow(id)}
                          />
                        </td>
                      )}
                      {visibleColumns.map((column) => (
                        <td
                          className={cn(
                            "px-3 whitespace-nowrap",
                            d.py,
                            column.align === "right" && "text-right tabular-nums",
                            column.align === "center" && "text-center",
                          )}
                          key={column.key}
                        >
                          {column.cell
                            ? column.cell(row)
                            : column.numeric && column.currency && typeof column.accessor(row) === "number"
                              ? mf.format(column.accessor(row) as number)
                              : (column.accessor(row) ?? "-")}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-3 text-right" onClick={(event) => event.stopPropagation()}>
                          {rowActions(row)}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
            {numericColumns.length > 0 && filtered.length > 0 && (
              <tfoot className="border-t bg-muted/60 font-semibold">
                <tr>
                  {bulkActions.length > 0 && <td className="px-3" />}
                  {visibleColumns.map((column, index) => (
                    <td
                      className={cn("px-3", d.py, column.align === "right" && "text-right tabular-nums")}
                      key={column.key}
                    >
                      {index === 0 && !column.numeric
                        ? `${filtered.length} filas`
                        : column.numeric
                          ? formatCell(column, filteredColumnStats[column.key]?.sum ?? 0)
                          : ""}
                    </td>
                  ))}
                  {rowActions && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} de {rows.length} registros visibles.
        </p>
      </div>
    </TooltipProvider>
  )
}

function ColumnFilters<T>({
  columns,
  filters,
  onChange,
  activeCount,
}: {
  columns: ProColumn<T>[]
  filters: Record<string, string>
  onChange: (key: string, value: string) => void
  activeCount: number
}) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button data-testid="table-filters" size="sm" variant="outline">
              <Filter className="mr-1 h-4 w-4" />
              Filtros
              {activeCount > 0 && (
                <Badge className="ml-1 h-5 min-w-5 rounded-full px-1 text-[10px]" variant="secondary">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Filtro por columna, combinable</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="max-h-[420px] w-80 overflow-y-auto">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Filtro por columna</p>
            <p className="text-xs text-muted-foreground">
              Combina campos para ver solo la información que necesitas.
            </p>
          </div>
          {columns.map((column) => (
            <div className="space-y-1.5" key={column.key}>
              <label className="text-xs font-medium text-muted-foreground" htmlFor={`filter-${column.key}`}>
                {column.header}
              </label>
              {column.filterType === "select" && column.filterOptions?.length ? (
                <Select value={filters[column.key] ?? "__all"} onValueChange={(value) => onChange(column.key, value === "__all" ? "" : value)}>
                  <SelectTrigger id={`filter-${column.key}`}>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos</SelectItem>
                    {column.filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : column.filterType === "date" ? (
                <DateFilterControl
                  id={`filter-${column.key}`}
                  value={filters[column.key] ?? ""}
                  onChange={(value) => onChange(column.key, value)}
                />
              ) : (
                <Input
                  id={`filter-${column.key}`}
                  onChange={(event) => onChange(column.key, event.target.value)}
                  placeholder={filterPlaceholder(column.filterType ?? "text")}
                  value={filters[column.key] ?? ""}
                />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DateFilterControl({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  const isPreset = DATE_FILTERS.has(normalizeText(value))
  const isCustom = value.includes("..")
  const [from = "", to = ""] = isCustom ? value.split("..") : ["", ""]
  const selectValue = isPreset ? normalizeText(value) : isCustom ? "__custom" : "__all"

  return (
    <div className="space-y-1.5">
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (next === "__all") onChange("")
          else if (next === "__custom") onChange("..")
          else onChange(next)
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder="Todas las fechas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">Todas las fechas</SelectItem>
          {DATE_PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="__custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>
      {isCustom && (
        <div className="flex items-center gap-1.5">
          <Input
            aria-label="Desde"
            type="date"
            value={from}
            onChange={(event) => onChange(`${event.target.value}..${to}`)}
          />
          <span className="text-xs text-muted-foreground">a</span>
          <Input
            aria-label="Hasta"
            type="date"
            value={to}
            onChange={(event) => onChange(`${from}..${event.target.value}`)}
          />
        </div>
      )}
    </div>
  )
}

function ColumnHeaderMenu<T>({
  column,
  sortKey,
  sortDir,
  onSort,
  onHide,
  onFilter,
}: {
  column: ProColumn<T>
  sortKey: string | null
  sortDir: SortDir
  onSort: (key: string, dir: SortDir) => void
  onHide?: () => void
  onFilter: (value: string) => void
}) {
  const ascLabel = column.numeric
    ? "Menor a mayor"
    : column.filterType === "date"
      ? "Más antiguo primero"
      : "Ordenar A-Z"
  const descLabel = column.numeric
    ? "Mayor a menor"
    : column.filterType === "date"
      ? "Más reciente primero"
      : "Ordenar Z-A"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title={`Opciones de columna ${column.header}`}
          className="rounded p-0.5 opacity-40 hover:bg-muted hover:opacity-100"
          type="button"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem onClick={() => onSort(column.key, "asc")}>
          <ArrowUp className="mr-2 h-4 w-4" />
          {ascLabel}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort(column.key, "desc")}>
          <ArrowDown className="mr-2 h-4 w-4" />
          {descLabel}
        </DropdownMenuItem>
        {sortKey === column.key && sortDir && (
          <DropdownMenuItem onClick={() => onSort(column.key, null)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Quitar orden
          </DropdownMenuItem>
        )}
        {column.filterType === "select" && column.filterOptions?.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Filtrar por valor</DropdownMenuLabel>
            {column.filterOptions.slice(0, 8).map((option) => (
              <DropdownMenuItem key={option.value} onClick={() => onFilter(option.value)}>
                <Filter className="mr-2 h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
        {onHide && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onHide}>
              <EyeOff className="mr-2 h-4 w-4" />
              Ocultar columna
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TotalsMenu<T>({
  columns,
  allStats,
  filteredStats,
  selectedStats,
  rowCounts,
  format,
}: {
  columns: ProColumn<T>[]
  allStats: Record<string, ColumnStats>
  filteredStats: Record<string, ColumnStats>
  selectedStats: Record<string, ColumnStats>
  rowCounts: { all: number; filtered: number; selected: number }
  format: (column: ProColumn<T>, value: number) => string
}) {
  const [scope, setScope] = useState<"filtered" | "selected" | "all">("filtered")
  if (columns.length === 0) return null
  const stats = scope === "all" ? allStats : scope === "selected" ? selectedStats : filteredStats
  const rowCount = rowCounts[scope]
  const scopeLabel = scope === "all" ? "toda la tabla" : scope === "selected" ? "filas seleccionadas" : "filas filtradas"
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button data-testid="table-totals" size="sm" variant="outline">
              <Sigma className="mr-1 h-4 w-4" />
              Totales
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Suma, promedio, mínimo y máximo de lo visible</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-96">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Totales de la vista</p>
            <p className="text-xs text-muted-foreground">
              Calculados sobre {rowCount} registros de {scopeLabel}.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant={scope === "filtered" ? "default" : "outline"}
              onClick={() => setScope("filtered")}
            >
              Filtradas
            </Button>
            <Button
              size="sm"
              variant={scope === "selected" ? "default" : "outline"}
              onClick={() => setScope("selected")}
              disabled={rowCounts.selected === 0}
            >
              Seleccionadas
            </Button>
            <Button size="sm" variant={scope === "all" ? "default" : "outline"} onClick={() => setScope("all")}>
              Toda la tabla
            </Button>
          </div>
          {columns.map((column) => {
            const stat = stats[column.key]
            if (!stat) return null
            return (
              <div className="rounded-lg border bg-muted/30 p-3" key={column.key}>
                <p className="text-sm font-medium">{column.header}</p>
                <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <StatRow label="Suma" value={format(column, stat.sum)} />
                  <StatRow label="Promedio" value={format(column, stat.avg)} />
                  <StatRow label="Mínimo" value={format(column, stat.min)} />
                  <StatRow label="Máximo" value={format(column, stat.max)} />
                  <StatRow label="Con valor" value={String(stat.count)} />
                </dl>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function ViewsMenu({
  views,
  onSave,
  onApply,
  onDelete,
  onRestore,
}: {
  views: SavedTableView[]
  onSave: (name: string) => void
  onApply: (view: SavedTableView) => void
  onDelete: (name: string) => void
  onRestore: () => void
}) {
  const [name, setName] = useState("")
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button data-testid="table-views" size="sm" variant="outline">
              <Bookmark className="mr-1 h-4 w-4" />
              Vista
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Guardar o cambiar tu vista de columnas y filtros</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Vistas guardadas</p>
            <p className="text-xs text-muted-foreground">
              Una vista guarda columnas, filtros, orden y densidad.
            </p>
          </div>
          {views.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              Todavía no guardas vistas. Ajusta la tabla a tu gusto y guárdala con un nombre.
            </p>
          ) : (
            <div className="space-y-1.5">
              {views.map((view) => (
                <div className="flex items-center gap-1" key={view.name}>
                  <Button
                    className="h-8 flex-1 justify-start"
                    size="sm"
                    variant="ghost"
                    onClick={() => onApply(view)}
                    data-testid={`table-view-${view.name}`}
                  >
                    <Bookmark className="mr-2 h-3.5 w-3.5" />
                    {view.name}
                  </Button>
                  <Button
                    aria-label={`Eliminar vista ${view.name}`}
                    className="h-8 w-8"
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(view.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              className="h-9"
              placeholder="Nombre de la vista"
              value={name}
              onChange={(event) => setName(event.target.value)}
              data-testid="table-view-name"
            />
            <Button
              className="h-9 shrink-0"
              size="sm"
              disabled={!name.trim()}
              onClick={() => {
                onSave(name.trim())
                setName("")
              }}
              data-testid="table-view-save"
            >
              Guardar
            </Button>
          </div>
          <Button className="w-full" size="sm" variant="outline" onClick={onRestore} data-testid="table-view-restore">
            <RotateCcw className="mr-1 h-4 w-4" />
            Restaurar vista predeterminada
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ColumnsMenu<T>({
  columns,
  hidden,
  onToggle,
}: {
  columns: ProColumn<T>[]
  hidden: Set<string>
  onToggle: (key: string) => void
}) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button data-testid="table-columns" size="sm" variant="outline">
              <SlidersHorizontal className="mr-1 h-4 w-4" />
              Columnas
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Mostrar u ocultar columnas de la vista</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns
          .filter((column) => column.hideable !== false)
          .map((column) => (
            <DropdownMenuCheckboxItem
              checked={!hidden.has(column.key)}
              key={column.key}
              onCheckedChange={() => onToggle(column.key)}
            >
              {column.header}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DensityMenu({
  density,
  onChange,
}: {
  density: keyof typeof DENSITIES
  onChange: (density: keyof typeof DENSITIES) => void
}) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Rows3 className="mr-1 h-4 w-4" />
              Densidad
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Cambiar espacio entre filas</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {(Object.keys(DENSITIES) as (keyof typeof DENSITIES)[]).map((key) => (
          <DropdownMenuItem key={key} onClick={() => onChange(key)}>
            {density === key ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 w-4" />}
            {key === "compact" ? "Compacta" : key === "medium" ? "Normal" : "Cómoda"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ExportMenu({ onExport }: { onExport: (type: "csv" | "xlsx") => void }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button data-testid="table-export" size="sm" variant="outline">
              <Download className="mr-1 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Exporta la vista actual con filtros y columnas visibles</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport("xlsx")}>Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("csv")}>CSV (.csv)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RecentChangesMenu({ changes }: { changes: RecentChange[] }) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button data-testid="table-recent-changes" size="sm" variant="outline">
              <History className="mr-1 h-4 w-4" />
              Últimos cambios
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Ver cambios recientes de este módulo</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-96">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Últimos cambios</p>
            <p className="text-xs text-muted-foreground">Actividad reciente visible para este módulo.</p>
          </div>
          {changes.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              No hay cambios registrados todavía.
            </p>
          ) : (
            <div className="space-y-2">
              {changes.slice(0, 8).map((change) => (
                <div className="rounded-lg border bg-muted/30 p-3" key={change.id}>
                  <p className="text-sm font-medium">{change.title}</p>
                  {change.description && <p className="text-xs text-muted-foreground">{change.description}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {[change.actor, change.at].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function HelpMenu({ moduleName, items }: { moduleName?: string; items: string[] }) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button data-testid="table-help" size="sm" variant="outline">
              <HelpCircle className="mr-1 h-4 w-4" />
              Ayuda
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Cómo usar este módulo</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-2">
          <p className="text-sm font-semibold">{moduleName ? `Ayuda de ${moduleName}` : "Ayuda"}</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {items.map((item) => (
              <li className="flex gap-2" key={item}>
                <span className="text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TooltipButton({
  tooltip,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/80 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function matchesColumnFilter(value: string | number | null | undefined, filter: string, type: FilterType): boolean {
  if (type === "number") return matchesNumberFilter(toNumber(value), filter)
  if (type === "date") return matchesDateFilter(value, filter)
  if (type === "select") return normalizeText(String(value ?? "")) === normalizeText(filter)
  return normalizeText(String(value ?? "")).includes(normalizeText(filter))
}

function matchesNumberFilter(value: number, filter: string): boolean {
  if (filter.includes("..")) {
    const [min, max] = filter.split("..").map((part) => Number(part.trim()))
    return (Number.isFinite(min) ? value >= min : true) && (Number.isFinite(max) ? value <= max : true)
  }
  if (filter.startsWith(">")) return value > Number(filter.slice(1).trim())
  if (filter.startsWith("<")) return value < Number(filter.slice(1).trim())
  return String(value).includes(filter)
}

function matchesDateFilter(value: string | number | null | undefined, filter: string): boolean {
  const time = new Date(String(value ?? "")).getTime()
  if (!Number.isFinite(time)) return false
  const normalized = normalizeText(filter)
  if (DATE_FILTERS.has(normalized)) return isRelativeDate(time, normalized)
  if (normalized.includes("..")) {
    const [from, to] = normalized.split("..").map((part) => part.trim())
    if (!from && !to) return true
    const fromTime = from ? new Date(from).getTime() : Number.NEGATIVE_INFINITY
    const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY
    return time >= fromTime && time <= toTime
  }
  return String(value ?? "").includes(filter)
}

function isRelativeDate(time: number, filter: string): boolean {
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  if (filter === "today") return time >= today.getTime()
  if (filter === "last30") {
    const start = new Date(today)
    start.setDate(start.getDate() - 30)
    return time >= start.getTime()
  }
  if (filter === "thismonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return time >= start.getTime()
  }
  if (filter === "thisweek") {
    const start = new Date(today)
    start.setDate(start.getDate() - start.getDay())
    return time >= start.getTime()
  }
  return true
}

function compareValues(a: string | number | null | undefined, b: string | number | null | undefined, direction: "asc" | "desc") {
  const multiplier = direction === "asc" ? 1 : -1
  if (typeof a === "number" || typeof b === "number") return (toNumber(a) - toNumber(b)) * multiplier
  const at = Date.parse(String(a ?? ""))
  const bt = Date.parse(String(b ?? ""))
  if (Number.isFinite(at) && Number.isFinite(bt)) return (at - bt) * multiplier
  return String(a ?? "").localeCompare(String(b ?? ""), "es", { numeric: true }) * multiplier
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function prettyFilter(value: string): string {
  const normalized = normalizeText(value)
  if (normalized === "today") return "Hoy"
  if (normalized === "thisweek") return "Esta semana"
  if (normalized === "thismonth") return "Este mes"
  if (normalized === "last30") return "Últimos 30 días"
  return value.replace("..", " a ")
}

function filterPlaceholder(type: FilterType): string {
  if (type === "number") return "Ej. >100, <50 o 10..200"
  return "Contiene..."
}
