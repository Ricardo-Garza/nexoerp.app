"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useSalesData } from "@/hooks/use-sales-data"
import { useAuth } from "@/hooks/use-auth"
import type { SalesOrder } from "@/lib/types"
import { Timestamp } from "firebase/firestore"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { normalizeOrderStatus } from "@/lib/utils"

interface MonthlyData {
  month: string
  ventas: number
}

const DEFAULT_CHART_DATA: MonthlyData[] = [
  { month: "Ene", ventas: 0 },
  { month: "Feb", ventas: 0 },
  { month: "Mar", ventas: 0 },
  { month: "Abr", ventas: 0 },
  { month: "May", ventas: 0 },
  { month: "Jun", ventas: 0 },
  { month: "Jul", ventas: 0 },
  { month: "Ago", ventas: 0 },
  { month: "Sep", ventas: 0 },
  { month: "Oct", ventas: 0 },
  { month: "Nov", ventas: 0 },
  { month: "Dic", ventas: 0 },
]

export function SalesChart() {
  const { user } = useAuth()
  const { salesOrders, loading } = useSalesData(user?.companyId || "", user?.uid)
  const [chartData, setChartData] = useState<MonthlyData[]>(DEFAULT_CHART_DATA)

  useEffect(() => {
    if (!salesOrders || salesOrders.length === 0) {
      setChartData(DEFAULT_CHART_DATA)
      return
    }

    const monthlyTotals: Record<number, number> = {}
    const currentYear = new Date().getFullYear()
    let targetYear = currentYear
    let latestOrderDate: Date | null = null

    salesOrders.forEach((order: SalesOrder) => {
      try {
        const statusValue = normalizeOrderStatus(order?.status)
        if (order && ["confirmed", "in_progress", "delivered", "invoiced", "invoiced_partial"].includes(statusValue)) {
          const orderDate = order.orderDate instanceof Timestamp ? order.orderDate.toDate() : new Date(order.orderDate)
          if (!latestOrderDate || orderDate > latestOrderDate) {
            latestOrderDate = orderDate
          }
          if (orderDate && orderDate.getFullYear() === currentYear) {
            const monthKey = orderDate.getMonth()
            monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (order.total || 0)
          }
        }
      } catch (err) {
        console.error("[v0] Error processing order in chart:", err)
      }
    })

    if (Object.keys(monthlyTotals).length === 0 && latestOrderDate) {
      targetYear = latestOrderDate.getFullYear()
      salesOrders.forEach((order: SalesOrder) => {
        try {
          const statusValue = normalizeOrderStatus(order?.status)
          if (order && ["confirmed", "in_progress", "delivered", "invoiced", "invoiced_partial"].includes(statusValue)) {
            const orderDate =
              order.orderDate instanceof Timestamp ? order.orderDate.toDate() : new Date(order.orderDate)
            if (orderDate && orderDate.getFullYear() === targetYear) {
              const monthKey = orderDate.getMonth()
              monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (order.total || 0)
            }
          }
        } catch (err) {
          console.error("[v0] Error processing order in chart:", err)
        }
      })
    }

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    const data = months.map((month, index) => ({
      month,
      ventas: monthlyTotals[index] || 0,
    }))

    setChartData(data)
  }, [salesOrders])

  return (
    <Card className="border-white/10 bg-white/10 text-white shadow-[0_20px_45px_rgba(15,23,42,0.35)]">
      <CardHeader className="border-b border-white/10 pb-4">
        <CardTitle className="text-white">Ventas Anuales</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer
            config={{
              ventas: {
                label: "Ventas",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[300px]"
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="ventas" stroke="var(--color-ventas)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
