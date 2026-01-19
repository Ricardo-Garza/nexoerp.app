"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { day: "Lun", ventas: 3200, transacciones: 12 },
  { day: "Mar", ventas: 4100, transacciones: 15 },
  { day: "Mié", ventas: 5400, transacciones: 18 },
  { day: "Jue", ventas: 4800, transacciones: 16 },
  { day: "Vie", ventas: 6200, transacciones: 22 },
  { day: "Sáb", ventas: 8500, transacciones: 28 },
  { day: "Dom", ventas: 7200, transacciones: 24 },
]

export function SalesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Semanales</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            ventas: {
              label: "Ventas ($)",
              color: "hsl(var(--primary))",
            },
          }}
          className="h-[350px]"
        >
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="day" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="ventas" fill="var(--color-ventas)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
