"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useSalesData } from "@/hooks/use-sales-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, TrendingUp, DollarSign, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils/sales-calculations"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import type { SalesOrder } from "@/lib/types"
import { normalizeOrderStatus } from "@/lib/utils"

type DateRange = {
  start: Date
  end: Date
  label: string
}

export function ReportesTab() {
  const { user } = useAuth()
  const companyId = user?.companyId || ""
  const userId = user?.uid || ""
  const { salesOrders, loading } = useSalesData(companyId, userId)

  const [selectedPeriod, setSelectedPeriod] = useState("this_month")

  // Define date ranges
  const dateRanges: Record<string, DateRange> = {
    today: {
      start: new Date(),
      end: new Date(),
      label: "Hoy"
    },
    this_week: {
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: endOfWeek(new Date(), { weekStartsOn: 1 }),
      label: "Esta semana"
    },
    this_month: {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
      label: "Este mes"
    },
    last_30_days: {
      start: subDays(new Date(), 29),
      end: new Date(),
      label: "Últimos 30 días"
    },
    last_week: {
      start: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
      end: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
      label: "Semana pasada"
    },
    last_month: {
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
      label: "Mes pasado"
    }
  }

  const currentRange = dateRanges[selectedPeriod]

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      if (!order.createdAt) return false
      const orderDate = new Date(order.createdAt.seconds * 1000)
      return orderDate >= currentRange.start && orderDate <= currentRange.end
    })
  }, [salesOrders, currentRange])

  // Calculate top products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number; orders: number }> = {}

    filteredOrders.forEach((order) => {
      if (order.lines && Array.isArray(order.lines)) {
        order.lines.forEach((line: any) => {
          const productId = line.productId || line.productoId || "unknown"
          const productName = line.productName || line.descripcion || line.description || "Producto sin nombre"
          const quantity = line.quantity || line.cantidad || 1
          const unitPrice = line.price || line.unitPrice || line.precio || 0
          const revenue = quantity * unitPrice

          if (!productSales[productId]) {
            productSales[productId] = {
              name: productName,
              quantity: 0,
              revenue: 0,
              orders: 0
            }
          }

          productSales[productId].quantity += quantity
          productSales[productId].revenue += revenue
          productSales[productId].orders += 1
        })
      }
    })

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filteredOrders])

  // Calculate sales summary
  const salesSummary = useMemo(() => {
    const totalOrders = filteredOrders.length
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Count by status
    const statusCounts = filteredOrders.reduce((acc, order) => {
      const statusValue = normalizeOrderStatus(order.status)
      acc[statusValue || "unknown"] = (acc[statusValue || "unknown"] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalOrders,
      totalRevenue,
      averageTicket,
      statusCounts
    }
  }, [filteredOrders])

  // Calculate COGS (simplified - using a fixed margin for demo)
  const cogsData = useMemo(() => {
    const dailyData: Record<string, { revenue: number; cogs: number; profit: number }> = {}

    filteredOrders.forEach((order) => {
      if (!order.createdAt) return

      const date = format(new Date(order.createdAt.seconds * 1000), "yyyy-MM-dd")
      const revenue = order.total || 0
      // Simplified COGS calculation (60% of revenue as cost)
      const cogs = revenue * 0.6
      const profit = revenue - cogs

      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, cogs: 0, profit: 0 }
      }

      dailyData[date].revenue += revenue
      dailyData[date].cogs += cogs
      dailyData[date].profit += profit
    })

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: format(new Date(date), "dd/MM/yyyy", { locale: es }),
        ...data
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredOrders])

  if (loading) {
    return <div className="p-6 text-center">Cargando reportes...</div>
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="this_week">Esta semana</SelectItem>
                <SelectItem value="this_month">Este mes</SelectItem>
                <SelectItem value="last_30_days">Últimos 30 días</SelectItem>
                <SelectItem value="last_week">Semana pasada</SelectItem>
                <SelectItem value="last_month">Mes pasado</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {currentRange.label}: {format(currentRange.start, "dd/MM/yyyy", { locale: es })} - {format(currentRange.end, "dd/MM/yyyy", { locale: es })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Órdenes</p>
                <p className="text-2xl font-bold">{salesSummary.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatCurrency(salesSummary.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(salesSummary.averageTicket)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Productos Más Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad Vendida</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Órdenes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{product.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                  <TableCell className="text-right">{product.orders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* COGS Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Costo de Bienes Vendidos (COGS)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Utilidad</TableHead>
                <TableHead className="text-right">Margen %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cogsData.map((day, index) => (
                <TableRow key={index}>
                  <TableCell>{day.date}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.cogs)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.profit)}</TableCell>
                  <TableCell className="text-right">
                    {day.revenue > 0 ? `${((day.profit / day.revenue) * 100).toFixed(1)}%` : "0%"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
