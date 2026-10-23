"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, BarChart3, Boxes, CircleDollarSign, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/lib/auth"
import type { SoleilDashboardSummary } from "@/lib/copilot/dashboard-summary"

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
const number = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 })

function Metric({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export function SoleilDashboard() {
  const [summary, setSummary] = useState<SoleilDashboardSummary | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const token = await authService.getIdToken()
        const response = await fetch("/api/copilot/dashboard", { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" })
        if (!response.ok) throw new Error("dashboard_unavailable")
        const result = (await response.json()) as SoleilDashboardSummary
        if (active) setSummary(result)
      } catch {
        if (active) setError(true)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  if (!summary) {
    return (
      <div className="space-y-4" data-testid="soleil-dashboard">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Soleil Wire</h1>
          <Badge variant="outline" className="border-amber-500/50 text-amber-600">DEMO · datos simulados</Badge>
        </div>
        <Card><CardContent className="p-5 text-sm text-muted-foreground">{error ? "No fue posible cargar los indicadores analíticos autorizados." : "Calculando indicadores desde el dataset de Soleil Wire…"}</CardContent></Card>
      </div>
    )
  }

  const growth = summary.salesChangePct === null ? "Sin base comparable" : `${summary.salesChangePct >= 0 ? "+" : ""}${summary.salesChangePct.toFixed(1)}% vs. mes anterior`
  return (
    <div className="space-y-5" data-testid="soleil-dashboard">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">Soleil Wire</h1><Badge variant="outline" className="border-amber-500/50 text-amber-600">DEMO · datos simulados</Badge></div>
          <p className="mt-1 text-sm text-muted-foreground">Indicadores calculados por Nexo Intelligence al {summary.asOf}.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Ventas del mes" value={money.format(summary.salesMonth)} description={growth} />
        <Metric label="Ventas acumuladas" value={money.format(summary.salesYtd)} description="Ejercicio en curso" />
        <Metric label="Comparativo mensual" value={summary.salesChangePct === null ? "—" : `${summary.salesChangePct >= 0 ? "+" : ""}${summary.salesChangePct.toFixed(1)}%`} description="Contra el mismo corte del mes anterior" />
        <Metric label="Clientes activos" value={number.format(summary.activeCustomers)} description="Con compras en los últimos 90 días" />
        <Metric label="Margen bruto" value={money.format(summary.grossMarginMxn)} description={`${summary.grossMarginPct?.toFixed(1) ?? "—"}% sobre ventas acumuladas`} />
        <Metric label="Inventario disponible" value={number.format(summary.inventoryUnits)} description={`${money.format(summary.inventoryValueMxn)} a costo`} />
        <Metric label="Stock crítico" value={number.format(summary.criticalStock)} description="SKUs bajo su mínimo" />
        <Metric label="Cuentas por cobrar" value={money.format(summary.receivablesMxn)} description={`${number.format(summary.overdueInvoices)} facturas vencidas`} />
        <Metric label="Facturas vencidas" value={number.format(summary.overdueInvoices)} description={`${money.format(summary.overdueMxn)} con atraso`} />
        <Metric label="Oportunidades CRM" value={number.format(summary.openOpportunities)} description={`${money.format(summary.weightedPipelineMxn)} pipeline ponderado`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" />Ventas mensuales</CardTitle><CardDescription>Venta neta mensual en MXN.</CardDescription></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={summary.monthlySales}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><Tooltip formatter={(value: number) => money.format(value)} /><Line dataKey="value" name="Ventas" type="monotone" stroke="#f59e0b" strokeWidth={2.5} /></LineChart></ResponsiveContainer></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Top 10 clientes</CardTitle><CardDescription>Por venta neta acumulada.</CardDescription></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={summary.topCustomers} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><YAxis type="category" dataKey="label" width={145} tick={{ fontSize: 10 }} /><Tooltip formatter={(value: number) => money.format(value)} /><Bar dataKey="value" name="Ventas" fill="#f59e0b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankCard icon={<CircleDollarSign className="h-4 w-4" />} title="Productos más vendidos" rows={summary.topProducts} valueLabel="Ventas" />
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" />Cartera y alertas</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><strong>{money.format(summary.overdueMxn)}</strong> vencido dentro de cuentas por cobrar.</p><p><strong>{number.format(summary.criticalStock)}</strong> productos requieren reposición.</p><p><strong>{number.format(summary.openOpportunities)}</strong> oportunidades abiertas en el pipeline.</p><p className="rounded-md bg-muted p-3 text-xs text-muted-foreground"><Boxes className="mr-1 inline h-3.5 w-3.5" /> Todos los indicadores y gráficas usan el mismo motor de datos del copiloto.</p></CardContent></Card>
      </div>
    </div>
  )
}

function RankCard({ icon, title, rows, valueLabel }: { icon: ReactNode; title: string; rows: SoleilDashboardSummary["topProducts"]; valueLabel: string }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle><CardDescription>{valueLabel} acumuladas en MXN.</CardDescription></CardHeader><CardContent><ol className="space-y-2">{rows.map((row, index) => <li key={row.label} className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0"><span className="min-w-0 truncate"><span className="mr-2 text-muted-foreground">{index + 1}.</span>{row.label}</span><strong className="shrink-0 tabular-nums">{money.format(row.value)}</strong></li>)}</ol></CardContent></Card>
}
