"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useSalesData } from "@/hooks/use-sales-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, FileText, TrendingUp, Clock, Package, X, RotateCcw } from "lucide-react"
import { formatCurrency } from "@/lib/utils/sales-calculations"
import type { SalesOrder } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function OrdenesVentaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const companyId = user?.companyId || ""
  const userId = user?.uid || ""
  const { salesOrders, stats, loading, error, updateOrderStatus } = useSalesData(companyId, userId)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Cancel/Return dialog state
  const [showCancelReturnDialog, setShowCancelReturnDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [cancelReturnType, setCancelReturnType] = useState<"cancellation" | "return">("cancellation")
  const [cancelReturnReason, setCancelReturnReason] = useState("")
  const [processingCancelReturn, setProcessingCancelReturn] = useState(false)

  useEffect(() => {
    console.log("[v0] OrdenesVentaPage - user:", user)
    console.log("[v0] OrdenesVentaPage - companyId:", companyId)
    console.log("[v0] OrdenesVentaPage - userId:", userId)
    console.log("[v0] OrdenesVentaPage - salesOrders count:", salesOrders.length)
    console.log("[v0] OrdenesVentaPage - loading:", loading)
    console.log("[v0] OrdenesVentaPage - error:", error)
  }, [user, companyId, userId, salesOrders, loading, error])

  const filteredOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      const matchesSearch =
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || order.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [salesOrders, searchTerm, statusFilter])

  const getStatusBadge = (status: SalesOrder["status"]) => {
    const variants = {
      draft: { label: "Borrador", variant: "secondary" as const },
      quotation: { label: "Cotización", variant: "outline" as const },
      confirmed: { label: "Confirmada", variant: "default" as const },
      in_progress: { label: "En Proceso", variant: "secondary" as const },
      delivered: { label: "Entregada", variant: "default" as const },
      invoiced: { label: "Facturada", variant: "default" as const },
      invoiced_partial: { label: "Facturada parcial", variant: "outline" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      const d = date.toDate ? date.toDate() : new Date(date)
      return format(d, "dd MMM yyyy", { locale: es })
    } catch {
      return "Invalid Date"
    }
  }

  const handleCancelReturn = (order: SalesOrder) => {
    setSelectedOrder(order)
    setCancelReturnType("cancellation")
    setCancelReturnReason("")
    setShowCancelReturnDialog(true)
  }

  const handleConfirmCancelReturn = async () => {
    if (!selectedOrder || !cancelReturnReason.trim()) return

    setProcessingCancelReturn(true)
    try {
      // Update order status and add cancel/return fields
      const updateData = {
        status: cancelReturnType === "cancellation" ? "cancelled" : "returned",
        cancelReturnType,
        cancelReturnReason: cancelReturnReason.trim(),
        cancelReturnAt: new Date(),
        cancelReturnBy: user?.email || user?.displayName || "Usuario"
      }

      // Use the sales data hook to update
      await updateOrderStatus(selectedOrder.id!, updateData)

      setShowCancelReturnDialog(false)
      setSelectedOrder(null)
      setCancelReturnReason("")

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setProcessingCancelReturn(false)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Error al cargar órdenes</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando órdenes de venta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
<Button onClick={() => router.push("/dashboard/ventas/ordenes/new")} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.confirmedOrders} confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quotations}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendientes de confirmar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Confirmados</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total de órdenes confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.unpaidAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.unpaidInvoices} facturas pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de orden o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="quotation">Cotización</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="in_progress">En Proceso</SelectItem>
                <SelectItem value="delivered">Entregada</SelectItem>
                <SelectItem value="invoiced">Facturada</SelectItem>
                <SelectItem value="invoiced_partial">Facturada parcial</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {salesOrders.length === 0 ? "Aún no hay órdenes de venta" : "No se encontraron órdenes"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {salesOrders.length === 0
                  ? "Comienza creando tu primera orden de venta o cotización"
                  : "Intenta con otros filtros de búsqueda"}
              </p>
              {salesOrders.length === 0 && (
                <Button onClick={() => router.push("/dashboard/ventas/ordenes/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Orden
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/ventas/ordenes/${order.id}`)}
                    >
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.documentType ? (
                          <Badge variant={order.documentType === "remision" ? "default" : "secondary"}>
                            {order.documentType === "remision" ? "Remisión" : "Factura"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(order.total, order.currency)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/ventas/ordenes/${order.id}`)
                            }}
                          >
                            Ver Detalle
                          </Button>
                          {(order.status === "confirmed" || order.status === "invoiced_partial") && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelReturn(order)
                                }}
                                className="text-orange-600 hover:text-orange-700"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCancelReturnType("return")
                                  handleCancelReturn(order)
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Devolver
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel/Return Dialog */}
      <Dialog open={showCancelReturnDialog} onOpenChange={setShowCancelReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cancelReturnType === "cancellation" ? "Cancelar Orden" : "Devolver Orden"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Tipo de acción</Label>
              <Select value={cancelReturnType} onValueChange={(value: "cancellation" | "return") => setCancelReturnType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cancellation">Cancelación</SelectItem>
                  <SelectItem value="return">Devolución</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Razón (requerida)</Label>
              <Textarea
                id="reason"
                placeholder="Especifique la razón de la cancelación o devolución..."
                value={cancelReturnReason}
                onChange={(e) => setCancelReturnReason(e.target.value)}
                rows={3}
              />
            </div>
            {selectedOrder && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Orden: {selectedOrder.orderNumber}</p>
                <p className="text-sm text-muted-foreground">Cliente: {selectedOrder.customerName}</p>
                <p className="text-sm text-muted-foreground">Total: {formatCurrency(selectedOrder.total, selectedOrder.currency)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelReturnDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCancelReturn}
              disabled={!cancelReturnReason.trim() || processingCancelReturn}
              variant={cancelReturnType === "cancellation" ? "destructive" : "default"}
            >
              {processingCancelReturn ? "Procesando..." : `Confirmar ${cancelReturnType === "cancellation" ? "Cancelación" : "Devolución"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
