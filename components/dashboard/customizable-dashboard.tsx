"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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

type WidgetSize = "small" | "medium" | "large"
type WidgetKind = "kpi" | "chart"
type ChartKind = "bar" | "line" | "donut"

interface DashboardWidgetConfig {
  id: string
  kind: WidgetKind
  indicatorId?: DashboardIndicatorId
  chartKind?: ChartKind
  title: string
  description: string
  size: WidgetSize
  visible: boolean
}

const MAX_VISIBLE_WIDGETS = 12
const COLORS = ["#0f766e", "#2563eb", "#ca8a04", "#dc2626", "#7c3aed"]

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
        description: def?.description ?? "Indicador del dashboard",
        size: "small" as const,
        visible: true,
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
  const values = useIndicatorValues(tenant)
  const [open, setOpen] = useState(false)
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

  function save(next = widgets) {
    setWidgets(next)
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(next))
    setOpen(false)
  }

  function reset() {
    const next = defaultWidgets(tenant)
    save(next)
  }

  return (
    <div className="space-y-5" data-testid="custom-dashboard">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tenant?.name ?? "Dashboard"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenant?.contact?.businessLine ?? "Indicadores principales de la empresa"}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="configure-dashboard">
          <Settings2 className="mr-2 h-4 w-4" />
          Configurar dashboard
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

      <DashboardEditor
        open={open}
        widgets={widgets}
        onOpenChange={setOpen}
        onCancel={() => setOpen(false)}
        onChange={setWidgets}
        onReset={reset}
        onSave={() => save()}
      />
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
              Por conectar
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
              <ChartTooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : widget.chartKind === "line" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData(data)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <ChartTooltip />
              <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <ChartTooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardEditor({
  open,
  widgets,
  onOpenChange,
  onCancel,
  onChange,
  onReset,
  onSave,
}: {
  open: boolean
  widgets: DashboardWidgetConfig[]
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onChange: (widgets: DashboardWidgetConfig[]) => void
  onReset: () => void
  onSave: () => void
}) {
  const visibleCount = widgets.filter((widget) => widget.visible).length
  const orderedCatalog = [
    ...widgets,
    ...DASHBOARD_INDICATOR_CATALOG.filter((def) => !widgets.some((widget) => widget.indicatorId === def.id)).map((def) => ({
      id: `kpi-${def.id}`,
      kind: "kpi" as const,
      indicatorId: def.id,
      title: def.name,
      description: def.description,
      size: "small" as const,
      visible: false,
    })),
  ]

  function update(id: string, patch: Partial<DashboardWidgetConfig>) {
    onChange(orderedCatalog.map((widget) => (widget.id === id ? { ...widget, ...patch } : widget)))
  }

  function move(id: string, dir: -1 | 1) {
    const index = widgets.findIndex((widget) => widget.id === id)
    const nextIndex = index + dir
    if (index < 0 || nextIndex < 0 || nextIndex >= widgets.length) return
    const next = [...widgets]
    const [item] = next.splice(index, 1)
    next.splice(nextIndex, 0, item)
    onChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizar dashboard</DialogTitle>
          <DialogDescription>
            Elige qué ver, cambia el orden y ajusta el tamaño. Máximo {MAX_VISIBLE_WIDGETS} bloques visibles.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            Visibles: <strong>{Math.min(visibleCount, MAX_VISIBLE_WIDGETS)}</strong> de {MAX_VISIBLE_WIDGETS}. Tamaños disponibles:
            pequeño, mediano y grande.
          </div>
          {orderedCatalog.map((widget, index) => (
            <div key={widget.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_160px_150px_96px] md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {widget.kind === "chart" ? chartIcon(widget.chartKind) : <Settings2 className="h-4 w-4 text-muted-foreground" />}
                  <p className="truncate text-sm font-medium">{widget.title}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{widget.description}</p>
              </div>
              <Select value={widget.size} onValueChange={(value: WidgetSize) => update(widget.id, { size: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeño</SelectItem>
                  <SelectItem value="medium">Mediano</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
              {widget.kind === "chart" ? (
                <Select value={widget.chartKind} onValueChange={(value: ChartKind) => update(widget.id, { chartKind: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="line">Línea</SelectItem>
                    <SelectItem value="donut">Dona</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="w-fit">
                  KPI
                </Badge>
              )}
              <div className="flex items-center justify-end gap-1">
                <Switch checked={widget.visible} onCheckedChange={(checked) => update(widget.id, { visible: checked })} aria-label={`Mostrar ${widget.title}`} />
                {widget.visible ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => move(widget.id, -1)} aria-label={`Subir ${widget.title}`}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" disabled={index === widgets.length - 1} onClick={() => move(widget.id, 1)} aria-label={`Bajar ${widget.title}`}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Volver al predeterminado
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={onSave}>Guardar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
