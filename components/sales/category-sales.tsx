"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pie, PieChart, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Rosas", value: 35, color: "hsl(var(--chart-1))" },
  { name: "Lirios", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Tulipanes", value: 20, color: "hsl(var(--chart-3))" },
  { name: "Orquídeas", value: 15, color: "hsl(var(--chart-4))" },
  { name: "Otros", value: 5, color: "hsl(var(--chart-5))" },
]

export function CategorySales() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por Categoría</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ChartContainer
            config={{
              rosas: { label: "Rosas", color: "hsl(var(--chart-1))" },
              lirios: { label: "Lirios", color: "hsl(var(--chart-2))" },
              tulipanes: { label: "Tulipanes", color: "hsl(var(--chart-3))" },
              orquideas: { label: "Orquídeas", color: "hsl(var(--chart-4))" },
              otros: { label: "Otros", color: "hsl(var(--chart-5))" },
            }}
            className="h-[200px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
