"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useSearchParams } from "next/navigation"
import { useFirestore } from "@/hooks/use-firestore"
import { useSalesData } from "@/hooks/use-sales-data"
import { useWarehouseData } from "@/hooks/use-warehouse-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Save, Send, Printer, CheckCircle2, Eye, X, Loader2, Truck, Receipt, AlertTriangle } from "lucide-react"
import { COLLECTIONS, addItem, getItem, updateItem } from "@/lib/firestore"
import type { SalesOrder, SalesOrderLine, Customer, Product } from "@/lib/types"
import { calculateOrderTotals, formatCurrency } from "@/lib/utils/sales-calculations"
import { getNextFolio } from "@/lib/utils/folio-generator"
import { SalesOrderLinesTab } from "./sales-order-lines-tab"
import { GenerateDeliveryDialog } from "./generate-delivery-dialog"
import { GenerateInvoiceDialog } from "./generate-invoice-dialog"
import { PostConfirmDialog } from "./post-confirm-dialog"
import { serverTimestamp, where } from "firebase/firestore"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SalesOrderFormProps {
  salesOrderId?: string
  onSuccess?: (orderId: string) => void
  onCancel?: () => void
}

export function SalesOrderForm({ salesOrderId, onSuccess, onCancel }: SalesOrderFormProps) {
  const { user } = useAuth()
  const companyId = user?.companyId || user?.uid || ""
  const searchParams = useSearchParams()

  // Load warehouse data for validation
  const { warehouses, inventoryStock, loading: loadingWarehouse } = useWarehouseData()

  // Load existing order if editing
  const [order, setOrder] = useState<Partial<SalesOrder>>({
    type: "quotation",
    status: "draft",
    currency: "MXN",
    lines: [],
    subtotal: 0,
    taxTotal: 0,
    discountTotal: 0,
    total: 0,
    paymentTerms: "30 dias",
    // Initialize warehouseId as required field
    warehouseId: "",
  })
  const [loading, setLoading] = useState(!!salesOrderId)
  const [saving, setSaving] = useState(false)
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showPostConfirmDialog, setShowPostConfirmDialog] = useState(false)
  // Add stock validation state
  const [stockWarnings, setStockWarnings] = useState<string[]>([])

  const { updateOrderStatus, sendOrderByEmail, printOrder, fulfillSalesOrder } = useSalesData(companyId, user?.uid)

  // Load customers and products
  const { items: customers } = useFirestore<Customer>(
    COLLECTIONS.customers,
    companyId ? [where("companyId", "==", companyId)] : [],
  )
  const { items: products } = useFirestore<Product>(COLLECTIONS.products, [], true)
  const { items: existingOrders } = useFirestore<SalesOrder>(COLLECTIONS.salesOrders, [], true)

  // Load existing order
  useEffect(() => {
    if (salesOrderId) {
      loadOrder()
    }
  }, [salesOrderId])

  useEffect(() => {
    if (salesOrderId) return
    const customerIdParam = searchParams.get("customerId")
    const typeParam = searchParams.get("type")

    if (customerIdParam && !order.customerId) {
      setOrder((prev) => ({ ...prev, customerId: customerIdParam }))
    }

    if (typeParam === "quotation" || typeParam === "order") {
      setOrder((prev) => (prev.type === typeParam ? prev : { ...prev, type: typeParam }))
    }
  }, [searchParams, salesOrderId, order.customerId, order.type])

  const loadOrder = async () => {
    if (!salesOrderId) return
    setLoading(true)
    try {
      const data = await getItem<SalesOrder>(COLLECTIONS.salesOrders, salesOrderId)
      if (data) {
        setOrder(data)
      }
    } catch (error) {
      console.error("[SalesOrderForm] Error loading order:", error)
      toast.error("Error al cargar la orden")
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals when lines change
  useEffect(() => {
    if (order.lines && order.lines.length > 0) {
      const totals = calculateOrderTotals(order.lines)
      setOrder((prev) => ({
        ...prev,
        ...totals,
      }))
    }
  }, [order.lines])

  // Validate stock availability when warehouse or lines change
  useEffect(() => {
    if (!order.warehouseId || !order.lines || order.lines.length === 0) {
      setStockWarnings([])
      return
    }

    const warnings: string[] = []
    const productLines = order.lines.filter((l) => l.type === "product" && l.productId)

    for (const line of productLines) {
      const stock = inventoryStock.find((s) => s.almacenId === order.warehouseId && s.productoId === line.productId)

      const disponible = stock?.cantidadDisponible || 0
      const requerido = line.quantity || 0

      if (disponible < requerido) {
        warnings.push(`${line.productName || line.description}: Disponible ${disponible}, Requerido ${requerido}`)
      }
    }

    setStockWarnings(warnings)
  }, [order.warehouseId, order.lines, inventoryStock])

  const handleLinesChange = (lines: SalesOrderLine[]) => {
    setOrder((prev) => ({ ...prev, lines }))
  }

  const handleSave = async (asDraft = true, documentType?: "remision" | "invoice") => {
    // Validate required fields including warehouse
    if (!order.customerId) {
      toast.error("Selecciona un cliente")
      return
    }

    if (!order.warehouseId) {
      toast.error("Selecciona un almacén para surtir la venta")
      return
    }

    if (!order.lines || order.lines.filter((l) => l.type === "product").length === 0) {
      toast.error("Agrega al menos un producto")
      return
    }
    const isQuotation = order.type === "quotation"

    // Validate stock if confirming order
    if (!asDraft && !isQuotation && stockWarnings.length > 0) {
      toast.error("Inventario insuficiente en el almacén seleccionado")
      return
    }

    if (!companyId) {
      toast.error("Error: No se pudo identificar la empresa o usuario")
      console.error("[v0] Missing companyId and userId in handleSave")
      return
    }

    setSaving(true)
    try {
      const customer = customers.find((c) => c.id === order.customerId)
      const warehouse = warehouses.find((w) => w.id === order.warehouseId)

      const isQuotationOrder = order.type === "quotation"
      const orderData: Partial<SalesOrder> = {
        orderNumber: order.orderNumber || "",
        type: order.type || "order",
        status: asDraft ? order.status || "draft" : isQuotationOrder ? "quotation" : "confirmed",
        customerId: order.customerId,
        customerName: customer?.nombre || "",
        // Always include warehouse info
        warehouseId: order.warehouseId,
        warehouseName: warehouse?.nombre || "",
        billingAddress: order.billingAddress || "",
        shippingAddress: order.shippingAddress || "",
        orderDate: order.orderDate || serverTimestamp(),
        expirationDate: order.expirationDate || null,
        deliveryDate: order.deliveryDate || null,
        paymentTerms: order.paymentTerms || "30 dias",
        paymentMethod: order.paymentMethod || "",
        cfdiUse: order.cfdiUse || "",
        priceList: order.priceList || "",
        currency: order.currency || "MXN",
        exchangeRate: order.exchangeRate || 1,
        lines: order.lines || [],
        subtotal: order.subtotal || 0,
        taxTotal: order.taxTotal || 0,
        discountTotal: order.discountTotal || 0,
        total: order.total || 0,
        notes: order.notes || "",
        internalNotes: order.internalNotes || "",
        termsAndConditions: order.termsAndConditions || "",
        deliveryIds: order.deliveryIds || [],
        invoiceIds: order.invoiceIds || [],
        ...(documentType && { documentType }),
        companyId,
        userId: user?.uid || "",
      }

      console.log("[v0] Saving order with warehouseId:", order.warehouseId)

      // Generate order number if new
      if (!salesOrderId) {
        const existingNumbers = existingOrders.map((o) => o.orderNumber)
        orderData.orderNumber = getNextFolio(existingNumbers, "ORD")
      }

      let orderId = salesOrderId
      if (salesOrderId) {
        await updateItem(COLLECTIONS.salesOrders, salesOrderId, orderData)
        toast.success("Orden actualizada correctamente")
      } else {
        const created = await addItem(COLLECTIONS.salesOrders, orderData)
        orderId = created.id
        toast.success("Orden creada correctamente")
        console.log("[v0] Order created with ID:", orderId)
      }

      // If confirming with remision, fulfill order and create inventory movements
      if (!asDraft && !isQuotationOrder && documentType === "remision" && orderId && order.warehouseId) {
        console.log("[v0] Confirming order with remision, creating inventory movements")
        await fulfillSalesOrder(orderId, order.warehouseId, warehouse?.nombre || "")
      }

      if (onSuccess && orderId) {
        onSuccess(orderId)
      }
    } catch (error) {
      console.error("[v0] Error saving order:", error)
      toast.error(error instanceof Error ? error.message : "Error al guardar la orden")
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async () => {
    // First save the order as confirmed (without document type yet)
    await handleSave(false)
    // Then show the post-confirm dialog
    setShowPostConfirmDialog(true)
  }

  const handleSend = async () => {
    if (!salesOrderId) {
      toast.error("Guarda la orden primero")
      return
    }
    await sendOrderByEmail(salesOrderId, user?.uid, user?.email || "")
  }

  const handlePrint = async () => {
    if (!salesOrderId) {
      toast.error("Guarda la orden primero")
      return
    }
    await printOrder(salesOrderId, user?.uid, user?.email || "")
    window.print()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  const handleSelectRemision = async () => {
    if (!salesOrderId) return

    setSaving(true)
    try {
      // Update order with document type and trigger fulfillment
      await handleSave(false, "remision")
      setShowPostConfirmDialog(false)
      toast.success("Remisión creada correctamente")
    } catch (error) {
      console.error("[v0] Error creating remision:", error)
      toast.error("Error al crear la remisión")
    } finally {
      setSaving(false)
    }
  }

  const handleSelectFacturacion = async () => {
    if (!salesOrderId) return

    setSaving(true)
    try {
      // Update order with document type
      await handleSave(false, "invoice")
      // Show invoice dialog
      setShowPostConfirmDialog(false)
      setShowInvoiceDialog(true)
    } catch (error) {
      console.error("[v0] Error setting invoice type:", error)
      toast.error("Error al configurar facturación")
    } finally {
      setSaving(false)
    }
  }

  const isQuotationStatus = order.type === "quotation"
  const canGenerateDelivery = !isQuotationStatus && (order.status === "confirmed" || order.status === "in_progress")
  const canGenerateInvoice = !isQuotationStatus && (order.status === "confirmed" || order.status === "delivered" || order.status === "invoiced_partial")

  if (loading || loadingWarehouse) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle>{salesOrderId ? order.orderNumber : "Nueva Orden"}</CardTitle>
                {order.status && (
                  <Badge className="mt-2" variant={order.status === "confirmed" ? "default" : "secondary"}>
                    {order.status === "draft" && "Borrador"}
                    {order.status === "quotation" && "Cotización"}
                    {order.status === "confirmed" && "Confirmada"}
                    {order.status === "in_progress" && "En Proceso"}
                    {order.status === "delivered" && "Entregada"}
                    {order.status === "invoiced" && "Facturada"}
                    {order.status === "invoiced_partial" && "Facturada parcial"}
                    {order.status === "cancelled" && "Cancelada"}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSend} disabled={!salesOrderId || saving}>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={!salesOrderId || saving}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              {order.status === "draft" || order.status === "quotation" ? (
                <Button size="sm" onClick={handleConfirm} disabled={saving || stockWarnings.length > 0}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Confirmar
                </Button>
              ) : null}
              {canGenerateDelivery && (
                <Button size="sm" variant="default" onClick={() => setShowDeliveryDialog(true)}>
                  <Truck className="w-4 h-4 mr-2" />
                  Generar Remisión
                </Button>
              )}
              {canGenerateInvoice && (
                <Button size="sm" variant="default" onClick={() => setShowInvoiceDialog(true)}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Generar Factura
                </Button>
              )}
              <Button variant="outline" size="sm" disabled>
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stock warnings alert */}
      {stockWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Inventario insuficiente en almacén seleccionado:</div>
            <ul className="list-disc list-inside space-y-1">
              {stockWarnings.map((warning, idx) => (
                <li key={idx} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="lines" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="lines">Líneas de la Orden</TabsTrigger>
                  <TabsTrigger value="info">Otra Información</TabsTrigger>
                  <TabsTrigger value="signature">Firma del Cliente</TabsTrigger>
                </TabsList>

                <TabsContent value="lines" className="space-y-4 mt-6">
                  <SalesOrderLinesTab
                    lines={order.lines || []}
                    products={products}
                    onChange={handleLinesChange}
                    readOnly={order.status === "cancelled"}
                    warehouseId={order.warehouseId}
                    inventoryStock={inventoryStock}
                  />
                </TabsContent>

                <TabsContent value="info" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Notas Internas</Label>
                      <Textarea
                        value={order.internalNotes || ""}
                        onChange={(e) => setOrder((prev) => ({ ...prev, internalNotes: e.target.value }))}
                        placeholder="Notas para uso interno..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notas para el Cliente</Label>
                      <Textarea
                        value={order.notes || ""}
                        onChange={(e) => setOrder((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Notas visibles para el cliente..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Términos y Condiciones</Label>
                    <Textarea
                      value={order.termsAndConditions || ""}
                      onChange={(e) => setOrder((prev) => ({ ...prev, termsAndConditions: e.target.value }))}
                      placeholder="Términos y condiciones de la venta..."
                      rows={6}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="signature" className="space-y-4 mt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Funcionalidad de firma electrónica disponible próximamente</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={order.customerId || ""}
                  onValueChange={(value) => setOrder((prev) => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add mandatory warehouse selector */}
              <div className="space-y-2">
                <Label>
                  Almacén * <span className="text-xs text-muted-foreground">(para surtir)</span>
                </Label>
                <Select
                  value={order.warehouseId || ""}
                  onValueChange={(value) => setOrder((prev) => ({ ...prev, warehouseId: value }))}
                  disabled={order.status === "delivered" || order.status === "cancelled"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter((w) => w.estado === "activo")
                      .map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.nombre} ({warehouse.codigo})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {order.warehouseId && (
                  <p className="text-xs text-muted-foreground">
                    La venta se surtirá desde este almacén. El inventario se validará y descontará automáticamente.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Dirección de Factura</Label>
                <Textarea
                  value={order.billingAddress || ""}
                  onChange={(e) => setOrder((prev) => ({ ...prev, billingAddress: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Dirección de Entrega</Label>
                <Textarea
                  value={order.shippingAddress || ""}
                  onChange={(e) => setOrder((prev) => ({ ...prev, shippingAddress: e.target.value }))}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Términos de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Términos de Pago</Label>
                <Select
                  value={order.paymentTerms || "30 dias"}
                  onValueChange={(value) => setOrder((prev) => ({ ...prev, paymentTerms: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contado">Contado</SelectItem>
                    <SelectItem value="15 dias">15 días</SelectItem>
                    <SelectItem value="21 dias">21 días</SelectItem>
                    <SelectItem value="30 dias">30 días</SelectItem>
                    <SelectItem value="45 dias">45 días</SelectItem>
                    <SelectItem value="60 dias">60 días</SelectItem>
                    <SelectItem value="90 dias">90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pago</Label>
                <Select
                  value={order.paymentMethod || ""}
                  onValueChange={(value) => setOrder((prev) => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Uso CFDI</Label>
                <Select
                  value={order.cfdiUse || ""}
                  onValueChange={(value) => setOrder((prev) => ({ ...prev, cfdiUse: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G01">G01 - Adquisición de mercancías</SelectItem>
                    <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                    <SelectItem value="P01">P01 - Por definir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={order.currency || "MXN"}
                  onValueChange={(value: "MXN" | "USD") => setOrder((prev) => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(order.subtotal || 0, order.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descuentos:</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(order.discountTotal || 0, order.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA:</span>
                <span className="font-medium">{formatCurrency(order.taxTotal || 0, order.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">{formatCurrency(order.total || 0, order.currency)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={() => handleSave(true)} disabled={saving} className="w-full" size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      {showDeliveryDialog && order.id && (
        <GenerateDeliveryDialog
          salesOrder={order as SalesOrder}
          open={showDeliveryDialog}
          onClose={() => setShowDeliveryDialog(false)}
          onSuccess={() => {
            setShowDeliveryDialog(false)
            loadOrder()
          }}
        />
      )}

      {showInvoiceDialog && order.id && (
        <GenerateInvoiceDialog
          salesOrder={order as SalesOrder}
          open={showInvoiceDialog}
          onClose={() => setShowInvoiceDialog(false)}
          onSuccess={() => {
            setShowInvoiceDialog(false)
            loadOrder()
          }}
        />
      )}

      <PostConfirmDialog
        open={showPostConfirmDialog}
        onClose={() => setShowPostConfirmDialog(false)}
        onSelectRemision={handleSelectRemision}
        onSelectFacturacion={handleSelectFacturacion}
        orderNumber={order.orderNumber || "N/A"}
        isProcessing={saving}
      />
    </div>
  )
}

