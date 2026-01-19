"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { subscribeToDocument } from "@/lib/firestore"
import { COLLECTIONS } from "@/lib/firestore"
import type { SalesOrder } from "@/lib/types"
import { normalizeOrderStatus } from "@/lib/utils"
import { Timestamp } from "firebase/firestore"
import { Package, Calendar, DollarSign, User, FileText, CreditCard, MapPin } from "lucide-react"

interface OrderDetailDrawerProps {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusConfig = {
  draft: { label: "Borrador", variant: "secondary" as const },
  quotation: { label: "Cotización", variant: "secondary" as const },
  confirmed: { label: "Confirmada", variant: "default" as const },
  in_progress: { label: "En Proceso", variant: "default" as const },
  delivered: { label: "Entregada", variant: "outline" as const },
  invoiced: { label: "Facturada", variant: "outline" as const },
  invoiced_partial: { label: "Facturada parcial", variant: "outline" as const },
  cancelled: { label: "Cancelada", variant: "destructive" as const },
}

export function OrderDetailDrawer({ orderId, open, onOpenChange }: OrderDetailDrawerProps) {
  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orderId || !open) {
      setOrder(null)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToDocument<SalesOrder>(COLLECTIONS.salesOrders, orderId, (data) => {
      setOrder(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [orderId, open])

  const formatDate = (date: Timestamp | string | undefined) => {
    if (!date) return "-"
    try {
      const d = date instanceof Timestamp ? date.toDate() : new Date(date)
      if (isNaN(d.getTime())) return "-"
      return d.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "-"
    }
  }

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== "number" || isNaN(value)) return "$0.00"
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Detalle de Orden</SheetTitle>
          <SheetDescription>Información completa de la orden seleccionada</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <div className="space-y-6 pb-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : !order ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No se encontró la orden</p>
                <p className="text-xs text-muted-foreground mt-1">La orden puede haber sido eliminada</p>
              </div>
            ) : (
              <>
                {/* Order Header with Folio and Status */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Folio</p>
                      <p className="text-lg font-bold break-all">{order.orderNumber || "-"}</p>
                    </div>
                    <Badge
                      variant={statusConfig[normalizeOrderStatus(order.status)]?.variant || "secondary"}
                      className="shrink-0 text-xs px-3 py-1"
                    >
                      {statusConfig[normalizeOrderStatus(order.status)]?.label || "Desconocido"}
                    </Badge>
                  </div>
                  {order.type && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Tipo:{" "}
                        <span className="font-medium text-foreground">
                          {order.type === "quotation" ? "Cotización" : "Orden de Venta"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    Información del Cliente
                  </h3>
                  <div className="space-y-3 pl-10">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Nombre</p>
                      <p className="text-sm font-medium">{order.customerName || "-"}</p>
                    </div>
                    {order.billingAddress && (
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Dirección de Facturación
                          </p>
                          <p className="text-sm break-words">{order.billingAddress}</p>
                        </div>
                      </div>
                    )}
                    {order.shippingAddress && order.shippingAddress !== order.billingAddress && (
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Dirección de Envío
                          </p>
                          <p className="text-sm break-words">{order.shippingAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Product Lines */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    Productos
                  </h3>
                  <div className="space-y-3">
                    {order.lines && order.lines.length > 0 ? (
                      order.lines.map((line, index) => (
                        <div
                          key={index}
                          className="bg-muted/30 rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold break-words">{line.productName || "-"}</p>
                              {line.description && (
                                <p className="text-xs text-muted-foreground mt-1 break-words">{line.description}</p>
                              )}
                            </div>
                            <p className="text-sm font-bold shrink-0">{formatCurrency(line.subtotal)}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                            <span>
                              {line.quantity || 0} × {formatCurrency(line.unitPrice)}
                            </span>
                            {line.discount > 0 && (
                              <span className="text-destructive">-{formatCurrency(line.discount)}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No hay productos en esta orden</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Financial Summary */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    Resumen Financiero
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.discountTotal > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Descuento</span>
                        <span className="font-medium text-destructive">-{formatCurrency(order.discountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">IVA (16%)</span>
                      <span className="font-medium">{formatCurrency(order.taxTotal)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-base">Total</span>
                      <span className="font-bold text-xl">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Information */}
                {(order.paymentTerms || order.paymentMethod) && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-primary" />
                        </div>
                        Condiciones de Pago
                      </h3>
                      <div className="space-y-3 pl-10">
                        {order.paymentTerms && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Plazo de Pago</p>
                            <p className="text-sm font-medium">{order.paymentTerms}</p>
                          </div>
                        )}
                        {order.paymentMethod && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Método de Pago
                            </p>
                            <p className="text-sm font-medium">{order.paymentMethod}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Dates */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    Fechas Importantes
                  </h3>
                  <div className="space-y-3 pl-10">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fecha de Orden</p>
                      <p className="text-sm font-medium">{formatDate(order.orderDate)}</p>
                    </div>
                    {order.deliveryDate && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fecha de Entrega</p>
                        <p className="text-sm font-medium">{formatDate(order.deliveryDate)}</p>
                      </div>
                    )}
                    {order.expirationDate && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Fecha de Vencimiento
                        </p>
                        <p className="text-sm font-medium">{formatDate(order.expirationDate)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        Notas
                      </h3>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm whitespace-pre-wrap break-words">{order.notes}</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
