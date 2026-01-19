"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSalesData } from "@/hooks/use-sales-data"
import { useAuth } from "@/hooks/use-auth"
import type { SalesOrder } from "@/lib/types"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Package } from "lucide-react"
import { normalizeOrderStatus } from "@/lib/utils"

interface ProductSales {
  name: string
  sales: number
  revenue: number
  trend: "up" | "down"
}

export function TopProducts() {
  const { user } = useAuth()
  const { salesOrders, loading } = useSalesData(user?.companyId || "", user?.uid)
  const [topProducts, setTopProducts] = useState<ProductSales[]>([])

  useEffect(() => {
    if (!salesOrders || salesOrders.length === 0) {
      setTopProducts([])
      return
    }

    const productMap: Record<string, { sales: number; revenue: number }> = {}

    salesOrders.forEach((order: SalesOrder) => {
      try {
        const statusValue = normalizeOrderStatus(order?.status)
        if (order && ["confirmed", "in_progress", "delivered", "invoiced", "invoiced_partial"].includes(statusValue)) {
          const items = order.items || order.lines || []
          items.forEach((item) => {
            const productName = item.nombre || item.productName || "Producto Desconocido"

            if (!productMap[productName]) {
              productMap[productName] = { sales: 0, revenue: 0 }
            }

            productMap[productName].sales += item.cantidad || item.quantity || 0
            productMap[productName].revenue += item.subtotal || item.total || 0
          })
        }
      } catch (err) {
        console.error("[v0] Error processing order in top products:", err)
      }
    })

    const productsArray = Object.entries(productMap).map(([name, data]) => ({
      name,
      sales: data.sales || 0,
      revenue: data.revenue || 0,
      trend: "up" as const,
    }))

    productsArray.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))

    setTopProducts(productsArray.slice(0, 5))
  }, [salesOrders])

  return (
    <Card className="border-white/10 bg-white/10 text-white shadow-[0_20px_45px_rgba(15,23,42,0.35)]">
      <CardHeader className="border-b border-white/10 pb-4">
        <CardTitle className="text-white">Productos Mas Vendidos</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-white/70" />
            </div>
            <p className="text-sm text-white/70">Aun no hay ventas registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-cyan-200">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-white">{product.name}</p>
                  <p className="text-xs text-white/70">{product.sales} unidades vendidas</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-white">
                    ${(product.revenue || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </p>
                  <Badge variant="outline" className="mt-1 border-white/20 text-white/80">
                    {product.trend === "up" ? "?" : "?"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
