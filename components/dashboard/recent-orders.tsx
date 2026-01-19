"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, ShoppingCart } from "lucide-react"
import { useSalesData } from "@/hooks/use-sales-data"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Timestamp } from "firebase/firestore"
import { OrderDetailDrawer } from "./order-detail-drawer"

const statusConfig = {
  draft: { label: "Borrador", variant: "secondary" as const },
  quotation: { label: "Cotizacion", variant: "secondary" as const },
  confirmed: { label: "Confirmada", variant: "default" as const },
  in_progress: { label: "En Proceso", variant: "default" as const },
  delivered: { label: "Entregada", variant: "outline" as const },
  invoiced: { label: "Facturada", variant: "outline" as const },
  invoiced_partial: { label: "Facturada parcial", variant: "outline" as const },
  cancelled: { label: "Cancelada", variant: "destructive" as const },
  returned: { label: "Devuelta", variant: "destructive" as const },
  unknown: { label: "Desconocido", variant: "outline" as const },
}

export function RecentOrders() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { salesOrders, loading } = useSalesData(user?.companyId || "")
  const getStatusValue = (status: unknown) => {
    if (typeof status === "string") return status
    if (status && typeof status === "object" && "status" in status) {
      const statusField = (status as { status?: unknown }).status
      return typeof statusField === "string" ? statusField : "unknown"
    }
    return "unknown"
  }

  const recentOrders = [...(salesOrders || [])]
    .sort((a, b) => {
      try {
        const dateA = a.orderDate instanceof Timestamp ? a.orderDate.toDate() : new Date(a.orderDate)
        const dateB = b.orderDate instanceof Timestamp ? b.orderDate.toDate() : new Date(b.orderDate)
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0
        return dateB.getTime() - dateA.getTime()
      } catch {
        return 0
      }
    })
    .slice(0, 5)

  const formatDate = (date: Timestamp | string | undefined) => {
    if (!date) return "-"
    try {
      const d = date instanceof Timestamp ? date.toDate() : new Date(date)
      if (isNaN(d.getTime())) return "-"
      return d.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" })
    } catch {
      return "-"
    }
  }

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== "number" || isNaN(value)) return "$0.00"
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setDrawerOpen(true)
  }

  const handleViewAll = () => {
    router.push("/dashboard/ventas/ordenes")
  }

  return (
    <>
      <Card className="border-white/10 bg-white/10 text-white shadow-[0_20px_45px_rgba(15,23,42,0.35)]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
          <CardTitle className="text-white">Ordenes Recientes</CardTitle>
          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={handleViewAll}>
            Ver Todas
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-white/70" />
              </div>
              <p className="text-sm font-medium mb-1 text-white">Aun no hay ordenes registradas</p>
              <p className="text-xs text-white/70 mb-4">Las ordenes de venta apareceran aqui</p>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={() => router.push("/dashboard/ventas/ordenes/new")}>
                Nueva Orden
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-white/60">Folio</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-white/60">Cliente</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-white/60">Productos</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-white/60">Monto</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-white/60">Estado</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-white/60">Fecha</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-white/60">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const productCount = order.lines?.length || 0
                    const firstProduct = order.lines?.[0]?.productName || "-"
                    const productDisplay = productCount > 1 ? `${firstProduct} (+${productCount - 1})` : firstProduct

                    return (
                      <tr key={order.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-2 text-sm font-medium text-white">{order.orderNumber || "-"}</td>
                        <td className="py-3 px-2 text-sm text-white/80">{order.customerName || "-"}</td>
                        <td className="py-3 px-2 text-sm text-white/70">{productDisplay}</td>
                        <td className="py-3 px-2 text-sm font-semibold text-white">{formatCurrency(order.total)}</td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={statusConfig[getStatusValue(order.status) as keyof typeof statusConfig]?.variant || "outline"}
                            className="border-white/20 text-white/80"
                          >
                            {statusConfig[getStatusValue(order.status) as keyof typeof statusConfig]?.label || "Desconocido"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-white/70">{formatDate(order.orderDate)}</td>
                        <td className="py-3 px-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewOrder(order.id)}
                            className="hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailDrawer orderId={selectedOrderId} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
