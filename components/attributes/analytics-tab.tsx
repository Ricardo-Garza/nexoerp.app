"use client"

import { useMemo, useState } from "react"
import { useAttributesData } from "@/hooks/use-attributes-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, TrendingUp, Package, RotateCcw, ArrowUpDown, Calendar } from "lucide-react"
import { Timestamp } from "firebase/firestore"

export function AnalyticsTab() {
  const { analytics, loading, variants, products } = useAttributesData()
  const [selectedTab, setSelectedTab] = useState("expiring")

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    const d = date instanceof Timestamp ? date.toDate() : new Date(date)
    return d.toLocaleDateString("es-MX")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
  }

  // Enrich top sales with variant/attribute data
  const enrichedTopSales = useMemo(() => {
    return analytics.topSales.map((sale) => {
      const variant = sale.variantId ? variants.find((v) => v.id === sale.variantId) : null
      const product = products.find((p) => p.id === sale.productId)

      return {
        ...sale,
        attributes: variant?.combinacionAtributos || {},
        productDetails: product,
      }
    })
  }, [analytics.topSales, variants, products])

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Cargando analítica...</div>
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Próximos a Caducar</p>
              <p className="text-2xl font-bold mt-1">{analytics.expiringProducts.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Lotes en 30 días</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Top Ventas</p>
              <p className="text-2xl font-bold mt-1">{analytics.topSales.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Productos más vendidos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <ArrowUpDown className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Movimientos</p>
              <p className="text-2xl font-bold mt-1">
                {analytics.movementsSummary.entries + analytics.movementsSummary.exits}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ↑ {analytics.movementsSummary.entries} / ↓ {analytics.movementsSummary.exits}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Devoluciones</p>
              <p className="text-2xl font-bold mt-1">{analytics.returns.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Tickets activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expiring">Caducidad</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="returns">Devoluciones</TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Productos Próximos a Caducar (30 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.expiringProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay productos próximos a caducar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.expiringProducts.map((item, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.productName}</h4>
                            <Badge variant="destructive">Lote: {item.lote}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {item.productId}</p>
                          <p className="text-sm text-muted-foreground">Almacén: {item.warehouseId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Cantidad: {item.quantity}</p>
                          <p className="text-xs text-destructive mt-1">Caduca: {formatDate(item.fechaCaducidad)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Ventas por Producto/Variante
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrichedTopSales.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay datos de ventas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrichedTopSales.map((sale, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <h4 className="font-semibold">{sale.productName}</h4>
                            {sale.variantId && <Badge variant="outline">Variante</Badge>}
                          </div>
                          {Object.keys(sale.attributes).length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {Object.entries(sale.attributes).map(([key, value]) => (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground mt-2">ID: {sale.productId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{formatCurrency(sale.revenue)}</p>
                          <p className="text-sm text-muted-foreground mt-1">{sale.quantity} unidades</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5" />
                Resumen de Movimientos de Inventario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <ArrowUpDown className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entradas</p>
                      <p className="text-2xl font-bold">{analytics.movementsSummary.entries.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Compras, Producción, Devoluciones</p>
                </div>

                <div className="p-6 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <ArrowUpDown className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Salidas</p>
                      <p className="text-2xl font-bold">{analytics.movementsSummary.exits.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Ventas, Consumo, Ajustes</p>
                </div>
              </div>

              <div className="mt-6 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Balance Neto</span>
                  <span
                    className={`text-lg font-bold ${
                      analytics.movementsSummary.entries - analytics.movementsSummary.exits >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(analytics.movementsSummary.entries - analytics.movementsSummary.exits).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Basado en movimientos registrados en el ledger de inventario
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Devoluciones Registradas (Tickets de Servicio)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.returns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay devoluciones registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.returns.map((returnItem) => (
                    <div key={returnItem.ticketId} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">Ticket #{returnItem.ticketNumber}</h4>
                            <Badge
                              variant={
                                returnItem.status === "aprobada"
                                  ? "default"
                                  : returnItem.status === "rechazada"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {returnItem.status || "pendiente"}
                            </Badge>
                          </div>
                          {returnItem.salesOrderId && (
                            <p className="text-sm text-muted-foreground">Orden: {returnItem.salesOrderId}</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(returnItem.createdAt)}</p>
                      </div>

                      <div className="space-y-2">
                        {returnItem.items.map((item, idx) => (
                          <div key={idx} className="pl-4 border-l-2 border-orange-300">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{item.productoNombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  Motivo: {item.motivo || "No especificado"}
                                </p>
                              </div>
                              <p className="text-sm font-bold">{item.cantidad} uds</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Datos en Tiempo Real</p>
              <p className="text-sm text-blue-700 mt-1">
                La analítica se basa en datos existentes de Ventas, Inventario, Servicio y Mantenimiento. Toda la
                información está trazada por productId y variantId para mantener consistencia sin duplicar registros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
