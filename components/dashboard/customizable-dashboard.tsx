"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowDown, ArrowUp, BarChart3, Eye, EyeOff, LineChart as LineChartIcon, PieChart as PieChartIcon, RotateCcw, Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DASHBOARD_INDICATOR_CATALOG, getIndicatorDefinition } from "@/lib/platform/indicators"
import type { DashboardIndicatorId, Tenant } from "@/lib/platform/types"
import { useIndicatorValues } from "@/components/dashboard/tenant-indicators"
import { useAuth } from "@/hooks/use-auth"
import { appendAudit } from "@/lib/platform/tenant-store"

type WidgetSize = "small" | "medium" | "large"
type WidgetKind = "kpi" | "chart"
type ChartKind = "bar" | "line" | "donut"
type WidgetMetric = "auto" | "suma" | "promedio" | "minimo" | "maximo" | "conteo" | "porcentaje"
type WidgetPeriod = "auto" | "hoy" | "7dias" | "30dias" | "mesActual" | "anioActual" | "personalizado"

interface DashboardWidgetConfig {
  id: string
  kind: WidgetKind
  indicatorId?: DashboardIndicatorId
  chartKind?: ChartKind
  title: string
  description: string
  size: WidgetSize
  visible: boolean
  metric?: WidgetMetric
  period?: WidgetPeriod
}

const MAX_VISIBLE_WIDGETS = 12
const COLORS = ["#0f766e", "#2563eb", "#ca8a04", "#dc2626", "#7c3aed"]

const METRIC_LABELS: Record<WidgetMetric, string> = {
  auto: "Automático",
  suma: "Suma",
  promedio: "Promedio",
  minimo: "Mínimo",
  maximo: "Máximo",
  conteo: "Conteo",
  porcentaje: "Porcentaje",
}

const PERIOD_LABELS: Record<WidgetPeriod, string> = {
  auto: "Automático",
  hoy: "Hoy",
  "7dias": "7 días",
  "30dias": "30 días",
  mesActual: "Mes actual",
  anioActual: "Año actual",
  personalizado: "Rango personalizado",
}

const CHART_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: "chart-commercial",
    kind: "chart",
    chartKind: "bar",
    title: "Actividad comercial",
    description: "Comparativo rápido de oportunidades, cotizaciones y facturas.",
    size: "large",
    visible: true,
  },
  {
    id: "chart-inventory",
    kind: "chart",
    chartKind: "donut",
    title: "Estado de inventario",
    description: "Relación entre inventario disponible, stock bajo y productos sin precio.",
    size: "medium",
    visible: true,
  },
  {
    id: "chart-trend",
    kind: "chart",
    chartKind: "line",
    title: "Tendencia del mes",
    description: "Vista de tendencia para seguimiento semanal.",
    size: "large",
    visible: false,
  },
]

function defaultWidgets(tenant: Tenant | null): DashboardWidgetConfig[] {
  const indicators = tenant?.ui?.dashboardIndicators?.length
    ? tenant.ui.dashboardIndicators
    : (["ventasMes", "cotizacionesAbiertas", "oportunidadesCrm", "productosSinPrecio", "stockBajo", "inventarioDisponible", "facturasPendientes", "actividadComercial"] as DashboardIndicatorId[])

  return [
    ...indicators.slice(0, 8).map((id) => {
      const def = getIndicatorDefinition(id)
      return {
        id: `kpi-${id}`,
        kind: "kpi" as const,
        indicatorId: id,
        title: def?.name ?? id,
        description: def?.description ?? "Indicador del panel de control",
        size: "small" as const,
        visible: true,
        metric: "auto" as const,
        period: "auto" as const,
      }
    }),
    ...CHART_WIDGETS,
  ]
}

function storageKey(tenant: Tenant | null, userId?: string) {
  return `nexo_dashboard_layout_${tenant?.id ?? "demo"}_${userId ?? "usuario"}`
}

export function CustomizableDashboard({ tenant }: { tenant: Tenant | null }) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const values = useIndicatorValues(tenant)
  const [open, setOpen] = useState(() => searchParams.get("configurar") === "1")
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => defaultWidgets(tenant))
  const key = storageKey(tenant, user?.uid)

  useEffect(() => {
    if (typeof window === "undefined") return
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(key)
        setWidgets(saved ? mergeWidgets(JSON.parse(saved), defaultWidgets(tenant)) : defaultWidgets(tenant))
      } catch {
        setWidgets(defaultWidgets(tenant))
      }
    })
  }, [key, tenant])

  const valueById = useMemo(() => new Map(values.map((value) => [value.id, value])), [values])
  const visible = widgets.filter((widget) => widget.visible).slice(0, MAX_VISIBLE_WIDGETS)
  const hiddenCount = Math.max(0, widgets.filter((widget) => widget.visible).length - MAX_VISIBLE_WIDGETS)

  function save(next: DashboardWidgetConfig[]) {
    const before = widgets.filter((w) => w.visible).map((w) => ({ id: w.id, size: w.size }))
    const after = next.filter((w) => w.visible).map((w) => ({ id: w.id, size: w.size }))
    setWidgets(next)
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(next))
    setOpen(false)
    void appendAudit({
      tenantId: tenant?.id ?? "demo",
      actorEmail: user?.email ?? "usuario@empresa",
      actorRole: "usuario",
      action: "panel.configuracion.actualizada",
      entityType: "panel",
      entityId: key,
      summary: `Configuración del panel actualizada: ${after.length} bloques visibles`,
      before: { widgets: before },
      after: { widgets: after },
      source: "ui",
    })
  }

  return (
    <div className="space-y-5" data-testid="custom-dashboard">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tenant?.name ?? "Panel de control"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenant?.contact?.businessLine ?? "Indicadores principales de la empresa"}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="configure-dashboard">
          <Settings2 className="mr-2 h-4 w-4" />
          Configurar panel
        </Button>
      </div>

      {hiddenCount > 0 && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Se muestran {MAX_VISIBLE_WIDGETS} bloques para mantener el tablero ordenado. Oculta alguno o cambia el orden para ver otros.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visible.map((widget) =>
          widget.kind === "kpi" ? (
            <KpiWidget key={widget.id} widget={widget} value={widget.indicatorId ? valueById.get(widget.indicatorId) : undefined} />
          ) : (
            <ChartWidget key={widget.id} widget={widget} values={values} />
          ),
        )}
      </div>

      {open && (
        <DashboardEditor
          open={open}
          savedWidgets={widgets}
          defaults={defaultWidgets(tenant)}
          values={values}
          onOpenChange={setOpen}
          onSave={save}
        />
      )}
    </div>
  )
}

function KpiWidget({ widget, value }: { widget: DashboardWidgetConfig; value?: ReturnType<typeof useIndicatorValues>[number] }) {
  const content = (
    <Card className={`h-full ${sizeClass(widget.size)}`}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{widget.title}</p>
          {value?.pending && (
            <Badge variant="outline" className="text-[10px]">
              Pendiente de datos
            </Badge>
          )}
        </div>
        <p className="text-2xl font-bold tabular-nums">{value?.value ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{value?.detail ?? widget.description}</p>
      </CardContent>
    </Card>
  )

  return value?.href ? (
    <Link href={value.href} className="block">
      {content}
    </Link>
  ) : (
    content
  )
}

function ChartWidget({ widget, values }: { widget: DashboardWidgetConfig; values: ReturnType<typeof useIndicatorValues> }) {
  const data = chartData(values)
  return (
    <Card className={`h-full ${sizeClass(widget.size)}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{widget.title}</CardTitle>
        <CardDescription>{widget.description}</CardDescription>
      </CardHeader>
      <CardContent className="h-56">
        {widget.chartKind === "donut" ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.slice(2, 5)} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                {data.slice(2, 5).map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip formatter={(value: number) => value.toLocaleString("es-MX")} />
            </PieChart>
          </ResponsiveContainer>
        ) : widget.chartKind === "line" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData(data)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <ChartTooltip formatter={(value: number) => [value.toLocaleString("es-MX"), "Valor"]} />
              <Line type="monotone" dataKey="value" name="Valor" stroke="#0f766e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <ChartTooltip formatter={(value: number) => [value.toLocaleString("es-MX"), "Valor"]} />
              <Bar dataKey="value" name="Valor" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

function buildCatalog(saved: DashboardWidgetConfig[]): DashboardWidgetConfig[] {
  return [
    ...saved,
    ...DASHBOARD_INDICATOR_CATALOG.filter((def) => !saved.some((widget) => widget.indicatorId === def.id)).map((def) => ({
      id: `kpi-${def.id}`,
      kind: "kpi" as const,
      indicatorId: def.id,
      title: def.name,
      description: def.description,
      size: "small" as const,
      visible: false,
      metric: "auto" as const,
      period: "auto" as const,
    })),
  ]
}

function DashboardEditor({
  open,
  savedWidgets,
  defaults,
  values,
  onOpenChange,
  onSave,
}: {
  open: boolean
  savedWidgets: DashboardWidgetConfig[]
  defaults: DashboardWidgetConfig[]
  values: ReturnType<typeof useIndicatorValues>
  onOpenChange: (open: boolean) => void
  onSave: (widgets: DashboardWidgetConfig[]) => void
}) {
  const initialDraft = useMemo(() => buildCatalog(savedWidgets), [savedWidgets])
  const [draft, setDraft] = useState<DashboardWidgetConfig[]>(() => initialDraft)
  const [focusedId, setFocusedId] = useState<string | null>(() => initialDraft.find((w) => w.visible)?.id ?? null)
  const [limitWarning, setLimitWarning] = useState(false)

  // último guardado. "Cancelar" simplemente cierra sin tocar savedWidgets:
  // nada se persiste hasta presionar "Guardar configuración".
  const valueById = useMemo(() => new Map(values.map((v) => [v.id, v])), [values])
  const active = draft.filter((w) => w.visible)
  const available = draft.filter((w) => !w.visible)
  const visibleCount = active.length
  const focused = draft.find((w) => w.id === focusedId) ?? active[0]

  function update(id: string, patch: Partial<DashboardWidgetConfig>) {
    setDraft((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)))
    setFocusedId(id)
  }

  function toggleVisible(id: string, checked: boolean) {
    if (checked && visibleCount >= MAX_VISIBLE_WIDGETS) {
      setLimitWarning(true)
      return
    }
    setLimitWarning(false)
    setDraft((prev) => prev.map((w) => (w.id === id ? { ...w, visible: checked } : w)))
    setFocusedId(id)
  }

  function move(id: string, dir: -1 | 1) {
    setDraft((prev) => {
      const activeIds = prev.filter((w) => w.visible).map((w) => w.id)
      const index = activeIds.indexOf(id)
      const nextIndex = index + dir
      if (index < 0 || nextIndex < 0 || nextIndex >= activeIds.length) return prev
      const reordered = [...activeIds]
      const [item] = reordered.splice(index, 1)
      reordered.splice(nextIndex, 0, item)
      const orderOf = new Map(reordered.map((wid, i) => [wid, i]))
      return [...prev].sort((a, b) => {
        const av = a.visible ? orderOf.get(a.id) ?? 0 : Number.MAX_SAFE_INTEGER
        const bv = b.visible ? orderOf.get(b.id) ?? 0 : Number.MAX_SAFE_INTEGER
        return av - bv
      })
    })
  }

  function handleReset() {
    const catalog = buildCatalog(defaults)
    setDraft(catalog)
    setFocusedId(catalog.find((w) => w.visible)?.id ?? null)
    setLimitWarning(false)
  }

  function handleSave() {
    if (visibleCount === 0) return
    onSave(draft)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] grid-rows-none flex-col gap-0 overflow-hidden p-0 sm:w-[min(1180px,calc(100vw-2rem))] sm:!max-w-[min(1180px,calc(100vw-2rem))] xl:!max-w-6xl"
        data-testid="dashboard-editor-dialog"
      >
        <DialogHeader className="border-b px-6 pb-4 pt-6 pr-12 sm:px-8">
          <DialogTitle>Personalizar panel de control</DialogTitle>
          <DialogDescription className="max-w-3xl">
            Elige los indicadores visibles, ordénalos y ajusta el tamaño de cada bloque. Los cambios se aplican
            hasta presionar Guardar configuración.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 sm:px-8">
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.9fr)]">
          <div className="min-w-0 space-y-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm" data-testid="dashboard-visible-count">
              <span><strong>{Math.min(visibleCount, MAX_VISIBLE_WIDGETS)}</strong> de {MAX_VISIBLE_WIDGETS} bloques visibles</span>
              <span className="text-xs text-muted-foreground">Máximo recomendado para mantener el panel claro.</span>
            </div>

            {limitWarning && (
              <div
                className="rounded-lg border border-amber-400/60 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                data-testid="dashboard-limit-warning"
              >
                Ya tienes {MAX_VISIBLE_WIDGETS} bloques visibles. Oculta uno para activar este.
              </div>
            )}

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Bloques activos</h3>
                <p className="text-xs text-muted-foreground">
                  Estos bloques aparecen en el inicio. Puedes cambiar su orden, tamaño y periodo.
                </p>
              </div>
              <div className="space-y-3">
                {active.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No tienes bloques activos. Agrega uno desde la sección de disponibles.
                  </p>
                )}
                {active.map((widget, index) => (
                  <WidgetRow
                    key={widget.id}
                    widget={widget}
                    index={index}
                    count={active.length}
                    focused={widget.id === focused?.id}
                    onUpdate={(patch) => update(widget.id, patch)}
                    onToggle={(checked) => toggleVisible(widget.id, checked)}
                    onMove={(dir) => move(widget.id, dir)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Disponibles para agregar</h3>
                <p className="text-xs text-muted-foreground">
                  Agrega indicadores o gráficos cuando aporten información real al panel.
                </p>
              </div>
              <div className="grid min-w-0 gap-2 md:grid-cols-2">
                {available.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ya activaste todos los indicadores disponibles.</p>
                )}
                {available.map((widget) => (
                  <div key={widget.id} className="flex min-w-0 items-start justify-between gap-3 overflow-hidden rounded-lg border px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug" title={widget.title}>{widget.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{widget.description}</p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => toggleVisible(widget.id, true)}>
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-4 rounded-lg border bg-muted/20 p-4 xl:sticky xl:top-0 xl:self-start">
            <div>
              <h3 className="text-sm font-semibold">Vista previa</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Selecciona un bloque activo para revisar cómo se verá antes de guardar.
              </p>
            </div>
            {focused ? (
              <div className="space-y-3">
                <div className="w-full min-w-0">
                  {focused.kind === "kpi" ? (
                    <KpiWidget widget={focused} value={focused.indicatorId ? valueById.get(focused.indicatorId) : undefined} />
                  ) : (
                    <ChartWidget widget={focused} values={values} />
                  )}
                </div>
                {focused.kind === "kpi" && (focused.metric ?? "auto") !== "auto" && (
                  <p className="rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
                    Pendiente de datos: el cálculo por métrica y periodo personalizado se calculará al registrar operaciones suficientes.
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed bg-background px-3 py-6 text-center text-sm text-muted-foreground">
                Activa un bloque para ver su vista previa.
              </p>
            )}
          </div>
          </div>
        </div>

        <DialogFooter className="border-t bg-background px-6 py-4 sm:justify-between sm:px-8">
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar predeterminado
            </Button>
          </div>
          <div className="flex flex-col gap-1 sm:items-end">
            <Button
              className="w-full sm:w-auto"
              onClick={handleSave}
              disabled={visibleCount === 0}
              title={visibleCount === 0 ? "Activa al menos un bloque para guardar" : undefined}
            >
              Guardar configuración
            </Button>
            {visibleCount === 0 && <span className="text-xs text-muted-foreground">Activa al menos un bloque para guardar.</span>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WidgetRow({
  widget,
  index,
  count,
  focused,
  onUpdate,
  onToggle,
  onMove,
}: {
  widget: DashboardWidgetConfig
  index: number
  count: number
  focused: boolean
  onUpdate: (patch: Partial<DashboardWidgetConfig>) => void
  onToggle: (checked: boolean) => void
  onMove: (dir: -1 | 1) => void
}) {
  const source = displaySource(widget.indicatorId ? getIndicatorDefinition(widget.indicatorId)?.source : "Panel")

  return (
    <div className={`min-w-0 overflow-hidden rounded-lg border bg-card p-4 transition-colors ${focused ? "border-primary/50 bg-primary/5" : ""}`}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {widget.kind === "chart" ? chartIcon(widget.chartKind) : <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <p className="min-w-0 break-words text-sm font-medium leading-snug" title={widget.title}>{widget.title}</p>
            <Badge variant="outline" className="shrink-0 text-[10px] font-normal text-muted-foreground">
              {source ?? "Panel"}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{widget.description}</p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1">
          <Switch checked={widget.visible} onCheckedChange={onToggle} aria-label={`Mostrar ${widget.title}`} />
          {widget.visible ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Mover arriba ${widget.title}`} title="Mover arriba">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Mover abajo ${widget.title}`} title="Mover abajo">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Tamaño del bloque</label>
          <Select value={widget.size} onValueChange={(value: WidgetSize) => onUpdate({ size: value })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeño</SelectItem>
              <SelectItem value="medium">Mediano</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {widget.kind === "chart" ? (
          <div className="min-w-0 space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Tipo de gráfica</label>
            <Select value={widget.chartKind} onValueChange={(value: ChartKind) => onUpdate({ chartKind: value })}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Barras</SelectItem>
                <SelectItem value="line">Línea</SelectItem>
                <SelectItem value="donut">Dona</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            <div className="min-w-0 space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Métrica</label>
              <Select value={widget.metric ?? "auto"} onValueChange={(value: WidgetMetric) => onUpdate({ metric: value })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(METRIC_LABELS) as WidgetMetric[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {METRIC_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Período</label>
              <Select value={widget.period ?? "auto"} onValueChange={(value: WidgetPeriod) => onUpdate({ period: value })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERIOD_LABELS) as WidgetPeriod[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERIOD_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function mergeWidgets(saved: DashboardWidgetConfig[], defaults: DashboardWidgetConfig[]) {
  const byId = new Map(defaults.map((widget) => [widget.id, widget]))
  const merged = saved.map((widget) => ({ ...(byId.get(widget.id) ?? widget), ...widget }))
  for (const widget of defaults) if (!merged.some((item) => item.id === widget.id)) merged.push(widget)
  return merged
}

function sizeClass(size: WidgetSize) {
  if (size === "large") return "md:col-span-2 xl:col-span-2"
  if (size === "medium") return "md:col-span-1 xl:col-span-2"
  return ""
}

function chartData(values: ReturnType<typeof useIndicatorValues>) {
  return values.map((value) => ({
    name: getIndicatorDefinition(value.id)?.name.split(" ")[0] ?? value.id,
    value: Number(String(value.value).replace(/[^\d.-]/g, "")) || 0,
  }))
}

function trendData(data: { name: string; value: number }[]) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return ["Sem 1", "Sem 2", "Sem 3", "Sem 4"].map((name, index) => ({
    name,
    value: Math.max(0, Math.round((total / 4) * (0.7 + index * 0.18))),
  }))
}

function chartIcon(kind?: ChartKind) {
  if (kind === "line") return <LineChartIcon className="h-4 w-4 text-muted-foreground" />
  if (kind === "donut") return <PieChartIcon className="h-4 w-4 text-muted-foreground" />
  return <BarChart3 className="h-4 w-4 text-muted-foreground" />
}

function displaySource(source?: string) {
  if (!source) return "Panel"
  if (source === "Clientes / CRM") return "CRM Momentum"
  if (source === "Sistema") return "Panel de control"
  return source
}
