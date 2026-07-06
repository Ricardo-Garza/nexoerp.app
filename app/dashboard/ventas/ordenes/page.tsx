"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useSalesData } from "@/hooks/use-sales-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, FileText, TrendingUp, Clock, Package, X, RotateCcw, XCircle, BarChart3, Eye } from "lucide-react"
import { DataTablePro, type ProColumn, type RecentChange } from "@/components/ui/data-table-pro"
import { formatCurrency } from "@/lib/utils/sales-calculations"
import { normalizeOrderStatus } from "@/lib/utils"
import type { SalesOrder } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CancelacionesDevolucionesTab } from "@/components/sales/cancelaciones-devoluciones-tab"
import { ReportesTab } from "@/components/sales/reportes-tab"

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  quotation: { label: "Cotización", variant: "outline" },
  confirmed: { label: "Confirmada", variant: "default" },
  in_progress: { label: "En proceso", variant: "secondary" },
  delivered: { label: "Entregada", variant: "default" },
  invoiced: { label: "Facturada", variant: "default" },
  invoiced_partial: { label: "Facturada parcial", variant: "outline" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  returned: { label: "Devuelta", variant: "destructive" },
}

function statusInfo(status: SalesOrder["status"]) {
  return STATUS_LABELS[normalizeOrderStatus(status)] ?? STATUS_LABELS.draft
}

function toIsoDate(date: unknown): string {
  if (!date) return ""
  try {
    const d = typeof date === "object" && date !== null && "toDate" in date ? (date as { toDate: () => Date }).toDate() : new Date(date as string)
    return Number.isFinite(d.getTime()) ? d.toISOString() : ""
  } catch {
    return ""
  }
}

function formatDate(iso: string): string {
  if (!iso) return "-"
  try {
    return format(new Date(iso), "dd MMM yyyy", { locale: es })
  } catch {
    return "-"
  }
}

export default function OrdenesVentaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const companyId = user?.companyId || ""
  const userId = user?.uid || ""
  const { salesOrders, stats, loading, error, updateOrderStatus } = useSalesData(companyId, userId)

  const [activeTab, setActiveTab] = useState("ordenes")

  // Cancel/Return dialog state
  const [showCancelReturnDialog, setShowCancelReturnDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [cancelReturnType, setCancelReturnType] = useState<"cancellation" | "return">("cancellation")
  const [cancelReturnReason, setCancelReturnReason] = useState("")
  const [processingCancelReturn, setProcessingCancelReturn] = useState(false)

  const activeOrders = useMemo(
    () =>
      salesOrders.filter((order) => {
        const statusValue = normalizeOrderStatus(order.status)
        return statusValue !== "cancelled" && statusValue !== "returned"
      }),
    [salesOrders],
  )

  const cancelledCount = salesOrders.length - activeOrders.length

  const recentChanges = useMemo<RecentChange[]>(() => {
    return [...salesOrders]
      .map((order) => ({
        order,
        at: toIsoDate(order.updatedAt ?? order.orderDate),
      }))
      .filter((entry) => entry.at)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8)
      .map(({ order, at }) => ({
        id: order.id ?? order.orderNumber ?? at,
        title: `${order.orderNumber ?? "Orden"} · ${statusInfo(order.status).label}`,
        description: `${order.customerName ?? "Cliente"} · ${formatCurrency(order.total, order.currency)}`,
        actor: order.cancelReturnBy,
        at: formatDate(at),
      }))
  }, [salesOrders])

  const columns = useMemo<ProColumn<SalesOrder>[]>(
    () => [
      {
        key: "orderNumber",
        header: "Número",
        accessor: (order) => order.orderNumber ?? order.folio,
        hideable: false,
      },
      {
        key: "customer",
        header: "Cliente",
        accessor: (order) => order.customerName,
      },
      {
        key: "date",
        header: "Fecha",
        accessor: (order) => toIsoDate(order.orderDate),
        cell: (order) => formatDate(toIsoDate(order.orderDate)),
        filterType: "date",
      },
      {
        key: "status",
        header: "Estado",
        accessor: (order) => statusInfo(order.status).label,
        cell: (order) => {
          const info = statusInfo(order.status)
          return <Badge variant={info.variant}>{info.label}</Badge>
        },
        filterType: "select",
        filterOptions: Object.values(STATUS_LABELS)
          .filter((entry) => entry.label !== "Cancelada" && entry.label !== "Devuelta")
          .map((entry) => ({ label: entry.label, value: entry.label })),
      },
      {
        key: "documentType",
        header: "Tipo",
        accessor: (order) =>
          order.documentType ? (order.documentType === "remision" ? "Remisión" : "Factura") : "",
        cell: (order) =>
          order.documentType ? (
            <Badge variant={order.documentType === "remision" ? "default" : "secondary"}>
              {order.documentType === "remision" ? "Remisión" : "Factura"}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
        filterType: "select",
        filterOptions: [
          { label: "Remisión", value: "Remisión" },
          { label: "Factura", value: "Factura" },
        ],
      },
      {
        key: "total",
        header: "Total",
        accessor: (order) => order.total ?? 0,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
    ],
    [],
  )

  const handleCancelReturn = (order: SalesOrder, type: "cancellation" | "return") => {
    setSelectedOrder(order)
    setCancelReturnType(type)
    setCancelReturnReason("")
    setShowCancelReturnDialog(true)
  }

  const handleConfirmCancelReturn = async () => {
    if (!selectedOrder || !cancelReturnReason.trim()) return

    setProcessingCancelReturn(true)
    try {
      const updateData = {
        status: cancelReturnType === "cancellation" ? "cancelled" : "returned",
        cancelReturnType,
        cancelReturnReason: cancelReturnReason.trim(),
        cancelReturnAt: new Date(),
        cancelReturnBy: user?.email || user?.displayName || "Usuario",
      }

      await updateOrderStatus(selectedOrder.id!, updateData as any)

      setShowCancelReturnDialog(false)
      setSelectedOrder(null)
      setCancelReturnReason("")

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 justify-center">
          <TabsTrigger value="ordenes" className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            {"Órdenes"}
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
          <DataTablePro
            tableId="ventas-ordenes"
            testId="sales-orders-table"
            columns={columns}
            rows={activeOrders}
            getRowId={(order) => order.id ?? order.orderNumber ?? order.folio}
            onRowClick={(order) => router.push(`/dashboard/ventas/ordenes/${order.id}`)}
            moduleName="Ventas"
            importHref="/dashboard/import"
            recentChanges={recentChanges}
            quickFilters={[
              { label: "Cotizaciones", predicate: (order) => normalizeOrderStatus(order.status) === "quotation" },
              { label: "Confirmadas", predicate: (order) => normalizeOrderStatus(order.status) === "confirmed" },
              { label: "Entregadas", predicate: (order) => normalizeOrderStatus(order.status) === "delivered" },
              {
                label: "Facturadas",
                predicate: (order) => ["invoiced", "invoiced_partial"].includes(normalizeOrderStatus(order.status)),
              },
            ]}
            helpItems={[
              "Crea una venta o cotización con el botón Nueva Orden.",
              "Haz clic en una fila para abrir el detalle completo de la orden.",
              "Usa Filtros para combinar cliente, fecha, estado y total.",
              "El botón Totales muestra la suma y promedio de lo que estás viendo.",
              "Exportar descarga la vista actual respetando tus filtros.",
            ]}
            emptyMessage={salesOrders.length === 0 ? "Aún no hay órdenes de venta." : "No se encontraron órdenes con estos filtros."}
            emptyHint={
              salesOrders.length === 0
                ? "Comienza creando tu primera orden de venta o cotización."
                : "Prueba con otros filtros o usa Limpiar."
            }
            rowActions={(order) => {
              const statusValue = normalizeOrderStatus(order.status)
              const canCancel = statusValue === "confirmed" || statusValue === "invoiced_partial"
              return (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Ver detalle de la orden"
                    onClick={() => router.push(`/dashboard/ventas/ordenes/${order.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  {canCancel && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Cancelar la orden con motivo"
                        onClick={() => handleCancelReturn(order, "cancellation")}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Registrar devolución con motivo"
                        onClick={() => handleCancelReturn(order, "return")}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Devolver
                      </Button>
                    </>
                  )}
                </div>
              )
            }}
          />
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
