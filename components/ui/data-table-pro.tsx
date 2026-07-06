"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import * as XLSX from "xlsx"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Download,
  Filter,
  History,
  RefreshCw,
  Rows3,
  Search,
  SlidersHorizontal,
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
import { buildExportFilename } from "@/lib/table/enterprise-table"
import { cn } from "@/lib/utils"

type SortDir = "asc" | "desc" | null
type FilterType = "text" | "number" | "date" | "select"

export interface ProColumn<T> {
  key: string
  header: string
  accessor: (row: T) => string | number | null | undefined
  cell?: (row: T) => ReactNode
  numeric?: boolean
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
  emptyMessage?: string
  moduleName?: string
  tenantName?: string
  toolbarActions?: ReactNode
  recentChanges?: RecentChange[]
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

export function DataTablePro<T>({
  tableId,
  columns,
  rows,
  getRowId,
  getRowTestId,
  quickFilters = [],
  bulkActions = [],
  rowActions,
  emptyMessage = "Sin registros",
  moduleName,
  tenantName = "empresa",
  toolbarActions,
  recentChanges = [],
  onRefresh,
  testId,
}: DataTableProProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [density, setDensity] = useState<keyof typeof DENSITIES>("medium")
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeQuick, setActiveQuick] = useState<number | null>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(`nexo_table_${tableId}`)
      if (!raw) return
      const view = JSON.parse(raw) as {
        hidden?: string[]
        density?: keyof typeof DENSITIES
        columnFilters?: Record<string, string>
      }
      if (view.hidden) setHidden(new Set(view.hidden))
      if (view.density) setDensity(view.density)
      if (view.columnFilters) setColumnFilters(view.columnFilters)
    } catch {
      // La vista se puede reconstruir si el navegador guardó un dato inválido.
    }
  }, [tableId])

  function persist(nextHidden = hidden, nextDensity = density, nextColumnFilters = columnFilters) {
    if (typeof window === "undefined") return
    window.localStorage.setItem(
      `nexo_table_${tableId}`,
      JSON.stringify({
        hidden: [...nextHidden],
        density: nextDensity,
        columnFilters: nextColumnFilters,
      }),
    )
  }

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hidden.has(column.key) && column.defaultVisible !== false),
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

  const totals = useMemo(() => {
    const next: Record<string, number> = {}
    for (const column of visibleColumns) {
      if (!column.numeric) continue
      next[column.key] = filtered.reduce((sum, row) => sum + toNumber(column.accessor(row)), 0)
    }
    return next
  }, [filtered, visibleColumns])

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

  const selectedRows = filtered.filter((row) => selected.has(getRowId(row)))
  const d = DENSITIES[density]
  const nf = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 })

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
      return
    }
    if (sortDir === "asc") {
      setSortDir("desc")
      return
    }
    setSortKey(null)
    setSortDir(null)
  }

  function toggleColumn(key: string) {
    const next = new Set(hidden)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setHidden(next)
    persist(next)
  }

  function changeDensity(nextDensity: keyof typeof DENSITIES) {
    setDensity(nextDensity)
    persist(hidden, nextDensity)
  }

  function setFilter(key: string, value: string) {
    const next = { ...columnFilters }
    if (value.trim()) next[key] = value
    else delete next[key]
    setColumnFilters(next)
    persist(hidden, density, next)
  }

  function clearFilters() {
    setSearch("")
    setActiveQuick(null)
    setColumnFilters({})
    persist(hidden, density, {})
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
              />

              <TooltipButton tooltip="Quitar búsqueda y filtros activos" size="sm" variant="outline" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Limpiar
              </TooltipButton>

              <ColumnsMenu columns={columns} hidden={hidden} onToggle={toggleColumn} />
              <DensityMenu density={density} onChange={changeDensity} />
              <ExportMenu onExport={exportData} />

              {onRefresh && (
                <TooltipButton tooltip="Recargar información de la tabla" size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Recargar
                </TooltipButton>
              )}

              {recentChanges.length > 0 && <RecentChangesMenu changes={recentChanges} />}
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
          {visibleColumns
            .filter((column) => column.numeric)
            .slice(0, selectedRows.length > 0 ? 2 : 3)
            .map((column) => (
              <Metric key={column.key} label={`Total ${column.header}`} value={nf.format(totals[column.key] ?? 0)} />
            ))}
        </div>

        {selectedRows.length > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2" data-testid="bulk-bar">
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
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const id = getRowId(row)
                  return (
                    <tr
                      className="border-b last:border-0 hover:bg-muted/45"
                      data-testid={getRowTestId ? getRowTestId(row) : `row-${id}`}
                      key={id}
                    >
                      {bulkActions.length > 0 && (
                        <td className="px-3">
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
                          {column.cell ? column.cell(row) : (column.accessor(row) ?? "-")}
                        </td>
                      ))}
                      {rowActions && <td className="px-3 text-right">{rowActions(row)}</td>}
                    </tr>
                  )
                })
              )}
            </tbody>
            {Object.keys(totals).length > 0 && filtered.length > 0 && (
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
                          ? nf.format(totals[column.key] ?? 0)
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
}: {
  columns: ProColumn<T>[]
  filters: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button data-testid="table-filters" size="sm" variant="outline">
              <Filter className="mr-1 h-4 w-4" />
              Filtros
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Filtro por columna</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80">
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
        <TooltipContent>Exportar respetando filtros y columnas visibles</TooltipContent>
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
    const fromTime = from ? new Date(from).getTime() : Number.NEGATIVE_INFINITY
    const toTime = to ? new Date(to).getTime() : Number.POSITIVE_INFINITY
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
  if (type === "date") return "Ej. today, thisMonth o 2026-07-01..2026-07-31"
  return "Contiene..."
}
