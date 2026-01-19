"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Search, Trash2, Eye, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils/sales-calculations"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { SalesOrder } from "@/lib/types"
import { toast } from "sonner"
import { where } from "firebase/firestore"

type CancelledOrder = SalesOrder & {
  cancelReturnType?: "cancellation" | "return"
  cancelReturnReason?: string
  cancelReturnAt?: any
  cancelReturnBy?: string
}

export function CancelacionesDevolucionesTab() {
  const { user } = useAuth()
  const companyId = user?.companyId || ""

  // Load cancelled/returned orders
  const { items: cancelledOrders, loading, remove } = useFirestore<CancelledOrder>(
    COLLECTIONS.salesOrders,
    companyId ? [where("companyId", "==", companyId)] : [],
    true,
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const getStatusValue = (status: unknown) => {
    if (typeof status === "string") return status
    if (status && typeof status === "object" && "status" in status) {
      const statusField = (status as { status?: unknown }).status
      return typeof statusField === "string" ? statusField : "unknown"
    }
    return "unknown"
  }

  const getCancelReturnMeta = (order: CancelledOrder) => {
    if (order.cancelReturnType || order.cancelReturnReason || order.cancelReturnAt || order.cancelReturnBy) {
      return {
        cancelReturnType: order.cancelReturnType,
        cancelReturnReason: order.cancelReturnReason,
        cancelReturnAt: order.cancelReturnAt,
        cancelReturnBy: order.cancelReturnBy,
      }
    }
    if (order.status && typeof order.status === "object") {
      const statusObj = order.status as any
      return {
        cancelReturnType: statusObj.cancelReturnType,
        cancelReturnReason: statusObj.cancelReturnReason,
        cancelReturnAt: statusObj.cancelReturnAt,
        cancelReturnBy: statusObj.cancelReturnBy,
      }
    }
    return {
      cancelReturnType: undefined,
      cancelReturnReason: undefined,
      cancelReturnAt: undefined,
      cancelReturnBy: undefined,
    }
  }

  const filteredOrders = useMemo(() => {
    return cancelledOrders.filter((order) => {
      const statusValue = getStatusValue(order.status)
      if (statusValue !== "cancelled" && statusValue !== "returned") {
        return false
      }
      const meta = getCancelReturnMeta(order)
      const matchesSearch =
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meta.cancelReturnReason?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === "all" || meta.cancelReturnType === typeFilter

      return matchesSearch && matchesType
    })
  }, [cancelledOrders, searchTerm, typeFilter])

  const handlePermanentDelete = async (orderId: string, orderNumber: string) => {
    try {
      await remove(orderId)
      toast.success(`Orden ${orderNumber} eliminada permanentemente`)
    } catch (error) {
      console.error("Error deleting order:", error)
      toast.error("Error al eliminar la orden")
    }
  }

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "cancellation":
        return <Badge variant="destructive">CancelaciÃ³n</Badge>
      case "return":
        return <Badge variant="secondary">DevoluciÃ³n</Badge>
      default:
        return <Badge variant="outline">Sin especificar</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>
      case "returned":
        return <Badge variant="secondary">Devuelta</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por folio, cliente o razÃ³n..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="cancellation">Cancelaciones</SelectItem>
                <SelectItem value="return">Devoluciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2">
            <Badge variant="outline">{filteredOrders.length} resultados</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ã“rdenes Canceladas/Devueltas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No hay Ã³rdenes canceladas o devueltas.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>RazÃ³n</TableHead>
                  <TableHead>Realizado por</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber || "Sin folio"}
                    </TableCell>
                    <TableCell>{order.customerName || "Cliente"}</TableCell>
                    <TableCell>
                      {(() => {
                        const meta = getCancelReturnMeta(order)
                        if (meta.cancelReturnAt?.seconds) {
                          return format(new Date(meta.cancelReturnAt.seconds * 1000), "dd/MM/yyyy", { locale: es })
                        }
                        return order.createdAt
                          ? format(new Date(order.createdAt.seconds * 1000), "dd/MM/yyyy", { locale: es })
                          : "N/A"
                      })()}
                    </TableCell>
                    <TableCell>{formatCurrency(order.total || 0)}</TableCell>
                    <TableCell>{getTypeBadge(getCancelReturnMeta(order).cancelReturnType)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {getCancelReturnMeta(order).cancelReturnReason || "Sin razÃ³n especificada"}
                    </TableCell>
                    <TableCell>{getCancelReturnMeta(order).cancelReturnBy || "Sistema"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                Eliminar Permanentemente
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acciÃ³n no se puede deshacer. Se eliminarÃ¡ permanentemente la orden{" "}
                                <strong>{order.orderNumber}</strong> de la base de datos.
                                <br /><br />
                                Â¿EstÃ¡ seguro de que desea continuar?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handlePermanentDelete(order.id!, order.orderNumber || "Sin folio")}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar Permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

