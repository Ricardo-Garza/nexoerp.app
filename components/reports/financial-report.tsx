"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Ene", ingresos: 12400, gastos: 8200 },
  { month: "Feb", ingresos: 15800, gastos: 9100 },
  { month: "Mar", ingresos: 18200, gastos: 10200 },
  { month: "Abr", ingresos: 22100, gastos: 11500 },
  { month: "May", ingresos: 28500, gastos: 12800 },
  { month: "Jun", ingresos: 32800, gastos: 14200 },
]

export function FinancialReport() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reporte Financiero</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-600" />
              <span className="text-muted-foreground">Gastos</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            ingresos: {
              label: "Ingresos",
              color: "hsl(var(--primary))",
            },
            gastos: {
              label: "Gastos",
              color: "hsl(27 87% 67%)",
            },
          }}
          className="h-[300px]"
        >
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="gastos" fill="var(--color-gastos)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 rounded-lg bg-primary/5">
            <p className="text-sm text-muted-foreground">Ingresos Totales</p>
            <p className="text-2xl font-bold text-primary mt-1">$129,800</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange-600/5">
            <p className="text-sm text-muted-foreground">Gastos Totales</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">$66,000</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-600/5">
            <p className="text-sm text-muted-foreground">Utilidad Neta</p>
            <p className="text-2xl font-bold text-green-600 mt-1">$63,800</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
