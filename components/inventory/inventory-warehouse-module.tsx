"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Boxes, ClipboardList, DollarSign, Package, Warehouse } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryTab } from "@/components/warehouse/inventory-tab"
import { MovementsTab } from "@/components/warehouse/movements-tab"
import { PhysicalCountTab } from "@/components/warehouse/physical-count-tab"
import { ReportsTab } from "@/components/warehouse/reports-tab"
import { TransfersTab } from "@/components/warehouse/transfers-tab"
import { WarehousesTab } from "@/components/warehouse/warehouses-tab"
import { InventoryStockView } from "@/components/soleil/inventory-stock-view"
import { useWarehouseData } from "@/hooks/use-warehouse-data"
import { usePlatform } from "@/contexts/platform-context"
import { getTenant } from "@/lib/platform/tenant-store"
import { SOLEIL_TENANT_ID } from "@/lib/domain/soleilwire"

function money(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
}

export function InventoryWarehouseModule() {
  const [activeTab, setActiveTab] = useState("stock")
  const { activeTenantId } = usePlatform()
  const [tenantName, setTenantName] = useState("")
  const warehouseData = useWarehouseData()
  const isSoleil = activeTenantId === SOLEIL_TENANT_ID

  useEffect(() => {
    let alive = true
    getTenant(activeTenantId)
      .then((tenant) => {
        if (alive) setTenantName(tenant?.name ?? "")
      })
      .catch(() => {
        if (alive) setTenantName("")
      })
    return () => {
      alive = false
    }
  }, [activeTenantId])

  const metrics = useMemo(() => {
    const stockRows = warehouseData.inventoryStock || []
    const products = warehouseData.products || []
    const stockTotal = stockRows.reduce((sum: number, row: any) => sum + (row.cantidadActual || 0), 0)
    const disponible = stockRows.reduce(
      (sum: number, row: any) =>
        sum + (typeof row.cantidadDisponible === "number" ? row.cantidadDisponible : row.cantidadActual || 0),
      0,
    )
    const sinCosto = stockRows.filter((row: any) => (row.costoPromedio || row.costoUnitario || 0) <= 0).length
    const sinPrecio = products.filter((product: any) => {
      const price = product.price ?? product.precio ?? product.precioBase ?? product.precioMayoreo
      return price === null || price === undefined || Number(price) <= 0
    }).length

    return {
      stockTotal,
      disponible,
      sinCosto,
      sinPrecio,
      stockBajo: warehouseData.bajoPuntoReorden || 0,
      valor: warehouseData.valorTotalInventario || 0,
      almacenes: warehouseData.almacenesActivos || 0,
      movimientos: warehouseData.movimientosRecientes?.length || 0,
    }
  }, [warehouseData])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario y Almacén</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Existencias, almacenes, movimientos, transferencias, conteos físicos y reportes en un solo lugar.
            {tenantName ? ` Configurado para ${tenantName}.` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Package} label="Stock total" value={metrics.stockTotal.toLocaleString("es-MX")} />
        <MetricCard icon={Boxes} label="Disponible total" value={metrics.disponible.toLocaleString("es-MX")} />
        <MetricCard icon={DollarSign} label="Valor inventario" value={money(metrics.valor)} />
        <MetricCard icon={AlertTriangle} label="Bajo mínimo" value={String(metrics.stockBajo)} tone="warning" />
        <MetricCard icon={Warehouse} label="Almacenes activos" value={String(metrics.almacenes)} />
        <MetricCard icon={ClipboardList} label="Movimientos recientes" value={String(metrics.movimientos)} />
        <MetricCard icon={AlertTriangle} label="Productos sin costo" value={String(metrics.sinCosto)} />
        <MetricCard icon={AlertTriangle} label="Productos sin precio" value={String(metrics.sinPrecio)} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-6">
          <TabsTrigger value="stock">Existencias</TabsTrigger>
          <TabsTrigger value="warehouses">Almacenes</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
          <TabsTrigger value="physical">Inventario físico</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {isSoleil ? <InventoryStockView tenantName={tenantName} embedded /> : <InventoryTab warehouseData={warehouseData} />}
        </TabsContent>
        <TabsContent value="warehouses" className="space-y-4">
          <WarehousesTab warehouseData={warehouseData} />
        </TabsContent>
        <TabsContent value="movements" className="space-y-4">
          <MovementsTab warehouseData={warehouseData} />
        </TabsContent>
        <TabsContent value="transfers" className="space-y-4">
          <TransfersTab warehouseData={warehouseData} />
        </TabsContent>
        <TabsContent value="physical" className="space-y-4">
          <PhysicalCountTab warehouseData={warehouseData} />
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <ReportsTab warehouseData={warehouseData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Package
  label: string
  value: string
  tone?: "warning"
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={tone === "warning" ? "text-amber-600" : "text-primary"}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
