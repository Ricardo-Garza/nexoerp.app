"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, TrendingDown } from "lucide-react"

const data = [
  { month: "Ene", ventas: 12400, clientes: 85, promedio: 146 },
  { month: "Feb", ventas: 15800, clientes: 102, promedio: 155 },
  { month: "Mar", ventas: 18200, clientes: 118, promedio: 154 },
  { month: "Abr", ventas: 22100, clientes: 135, promedio: 164 },
  { month: "May", ventas: 28500, clientes: 165, promedio: 173 },
  { month: "Jun", ventas: 32800, clientes: 189, promedio: 174 },
]

const kpis = [
  { name: "Tasa de Conversión", value: "68%", change: "+5.2%", trend: "up" },
  { name: "Clientes Recurrentes", value: "45%", change: "+12.8%", trend: "up" },
  { name: "Satisfacción Cliente", value: "4.8/5", change: "+0.3", trend: "up" },
  { name: "Tiempo de Entrega", value: "2.4 días", change: "-0.5", trend: "down" },
]

export function PerformanceReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte de Rendimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <ChartContainer
            config={{
              ventas: {
                label: "Ventas ($)",
                color: "hsl(var(--primary))",
              },
              clientes: {
                label: "Clientes",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="ventas" stroke="var(--color-ventas)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clientes" stroke="var(--color-clientes)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.name} className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">{kpi.name}</p>
                <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                <div
                  className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                    kpi.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {kpi.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {kpi.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
