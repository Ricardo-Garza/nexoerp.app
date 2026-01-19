import { useState, useMemo } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, XCircle, BarChart3, Plus, Search, File, TrendingUp, Clock, Package, X, RotateCcw } from "lucide-react"
import { formatCurrency } from "@/lib/utils/sales-calculations"
import { normalizeOrderStatus } from "@/lib/utils"
import type { SalesOrder } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CancelacionesDevolucionesTab } from "@/components/sales/cancelaciones-devoluciones-tab"
import { ReportesTab } from "@/components/sales/reportes-tab"
import { updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { COLLECTIONS, addItem } from "@/lib/firestore"
import { toast } from "sonner"

export default function VentasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const companyId = user?.companyId || ""
  const userId = user?.uid || ""
  const { salesOrders, stats, loading, error, updateOrderStatus } = useSalesData(companyId, userId)

  const [activeTab, setActiveTab] = useState("ordenes")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Cancel/Return dialog state
  const [showCancelReturnDialog, setShowCancelReturnDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [cancelReturnType, setCancelReturnType] = useState<"cancellation" | "return">("cancellation")
  const [cancelReturnReason, setCancelReturnReason] = useState("")
  const [processingCancelReturn, setProcessingCancelReturn] = useState(false)

  // Filter orders for active tab
  const activeOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      // Active orders: not cancelled or returned
      const statusValue = normalizeOrderStatus(order.status)
      const isActive = statusValue !== "cancelled" && statusValue !== "returned"

      const matchesSearch =
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || statusValue === statusFilter

      return isActive && matchesSearch && matchesStatus
    })
  }, [salesOrders, searchTerm, statusFilter])

  const cancelledCount = useMemo(() => {
    return salesOrders.filter((order) => {
      const statusValue = normalizeOrderStatus(order.status)
      return statusValue === "cancelled" || statusValue === "returned"
    }).length
  }, [salesOrders])

  const getStatusBadge = (status: SalesOrder["status"] | any) => {
    const statusValue = normalizeOrderStatus(status)
    
    const variants = {
      draft: { label: "Borrador", variant: "secondary" as const },
      quotation: { label: "Cotización", variant: "outline" as const },
      confirmed: { label: "Confirmada", variant: "default" as const },
      in_progress: { label: "En Proceso", variant: "secondary" as const },
      delivered: { label: "Entregada", variant: "default" as const },
      invoiced: { label: "Facturada", variant: "default" as const },
      invoiced_partial: { label: "Facturada parcial", variant: "outline" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
      returned: { label: "Devuelta", variant: "destructive" as const },
      unknown: { label: "Desconocido", variant: "outline" as const },
    }
    const config = variants[statusValue] || variants.unknown
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
      const db = getFirebaseDb()
      const orderRef = doc(db, COLLECTIONS.salesOrders, selectedOrder.id!)

      // Update order with cancel/return fields
      await updateDoc(orderRef, {
        status: cancelReturnType === "cancellation" ? "cancelled" : "returned",
        cancelReturnType,
        cancelReturnReason: cancelReturnReason.trim(),
        cancelReturnAt: serverTimestamp(),
        cancelReturnBy: user?.email || user?.displayName || "Usuario",
        updatedAt: serverTimestamp(),
      })

      // Add activity log
      await addItem(COLLECTIONS.salesOrderActivities, {
        salesOrderId: selectedOrder.id!,
        companyId: user?.companyId || "",
        timestamp: serverTimestamp(),
        userId: user?.uid || "",
        userName: user?.email || user?.displayName || "Usuario",
        action: cancelReturnType === "cancellation" ? "cancelled" : "returned",
        description: `${cancelReturnType === "cancellation" ? "Cancelación" : "Devolución"}: ${cancelReturnReason.trim()}`,
      })

      toast.success(`Orden ${cancelReturnType === "cancellation" ? "cancelada" : "devuelta"} correctamente`)

      setShowCancelReturnDialog(false)
      setSelectedOrder(null)
      setCancelReturnReason("")

      // Refresh will happen automatically via the hook
    } catch (error) {
      console.error("Error updating order:", error)
      toast.error("Error al actualizar la orden")
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">
            Gestiona órdenes de venta, cancelaciones, devoluciones y reportes
          </p>
        </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 justify-center">
          <TabsTrigger value="ordenes" className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            {"\u00D3rdenes"}
          </TabsTrigger>
          <TabsTrigger value="cancelaciones" className="flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4" />
            Cancelaciones / Devoluciones
            {cancelledCount > 0 && (
              <Badge className="ml-1 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                {cancelledCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Reportes Generados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{"\u00D3rdenes"}</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por folio o cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando órdenes...</p>
                  </div>
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No hay órdenes activas</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "No se encontraron órdenes con los filtros aplicados."
                      : "Crea tu primera orden de venta para comenzar."}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button onClick={() => router.push("/dashboard/ventas/ordenes/new")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Orden
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Folio</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-32">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{formatDate(order.orderDate)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.total)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/ventas/ordenes/${order.id}`)}
                              >
                                <File className="w-4 h-4" />
                              </Button>
                              {(normalizeOrderStatus(order.status) === "confirmed" ||
                                normalizeOrderStatus(order.status) === "in_progress") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelReturn(order)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
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
        </TabsContent>

        <TabsContent value="cancelaciones">
          <CancelacionesDevolucionesTab />
        </TabsContent>

        <TabsContent value="reportes">
          <ReportesTab />
        </TabsContent>
      </Tabs>

      {/* Cancel/Return Dialog */}
      <Dialog open={showCancelReturnDialog} onOpenChange={setShowCancelReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cancelReturnType === "cancellation" ? "Cancelar Orden" : "Devolver Orden"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de acción</Label>
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
            <div className="space-y-2">
              <Label>Razón *</Label>
              <Textarea
                value={cancelReturnReason}
                onChange={(e) => setCancelReturnReason(e.target.value)}
                placeholder="Especifica la razón de la cancelación o devolución..."
                rows={3}
              />
            </div>
            {selectedOrder && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Orden: {selectedOrder.orderNumber}</p>
                <p className="text-sm text-muted-foreground">Cliente: {selectedOrder.customerName}</p>
                <p className="text-sm text-muted-foreground">Total: {formatCurrency(selectedOrder.total)}</p>
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
              variant="destructive"
            >
              {processingCancelReturn ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  {cancelReturnType === "cancellation" ? "Cancelar Orden" : "Devolver Orden"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}





