"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import { DemandPeriodSelector } from "@/components/inventory/demand-period-selector"
import { useAuth } from "@/hooks/use-auth"
import { useInventoryCalculations } from "@/hooks/use-inventory-calculations"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { PackagePlus } from "lucide-react"

export function InventoryTab({ warehouseData }: { warehouseData: any }) {
  const { user } = useAuth()
  const companyId = (user as any)?.companyId || user?.uid || ""
  const { preferences, savePreferences, loading: prefsLoading } = useUserPreferences()
  const [refreshKey, setRefreshKey] = useState(0)

  const productsWithStock = useMemo(() => {
    const stockByProduct = new Map<string, number>()
    ;(warehouseData.inventoryStock || []).forEach((stock: any) => {
      const available =
        typeof stock.cantidadDisponible === "number" ? stock.cantidadDisponible : stock.cantidadActual || 0
      stockByProduct.set(stock.productoId, (stockByProduct.get(stock.productoId) || 0) + available)
    })

    return (warehouseData.products || []).map((product: any) => ({
      ...product,
      stock: stockByProduct.get(product.id) || 0,
    }))
  }, [warehouseData.inventoryStock, warehouseData.products, refreshKey])

  const { demandData, loading: demandLoading } = useInventoryCalculations(
    productsWithStock,
    preferences.demandPeriodDays,
    companyId,
  )

  const rows = useMemo(
    () =>
      (warehouseData.inventoryStock || []).map((stock: any) => {
        const demand = demandData[stock.productoId]
        const stockActual = stock.cantidadActual || 0
        const disponible =
          typeof stock.cantidadDisponible === "number" ? stock.cantidadDisponible : stock.cantidadActual || 0
        const minimo = stock.minimoStock || stock.puntoReorden || 0
        const costo = stock.costoPromedio || stock.costoUnitario || 0
        const sugerido = Math.max(0, demand?.suggestedOrder || (stock.maximoStock || 0) - stockActual)
        return {
          ...stock,
          stockActual,
          disponible,
          minimo,
          costo,
          valorTotal: stock.valorTotal || stockActual * costo,
          demandaPromedio: demand?.avgDemand30Days || 0,
          sugerido,
          estado: stockActual <= minimo ? "Bajo mínimo" : "Disponible",
          sinCosto: costo <= 0,
        }
      }),
    [warehouseData.inventoryStock, demandData],
  )

  const columns = useMemo<ProColumn<any>[]>(
    () => [
      {
        key: "sku",
        header: "SKU",
        accessor: (r) => r.sku ?? "",
        cell: (r) => <span className="font-mono text-xs">{r.sku || "-"}</span>,
        filterType: "text",
      },
      { key: "productoNombre", header: "Producto", accessor: (r) => r.productoNombre ?? "", filterType: "text" },
      { key: "almacenNombre", header: "Almacén", accessor: (r) => r.almacenNombre ?? "", filterType: "text" },
      {
        key: "loteSerie",
        header: "Lote / Serie",
        accessor: (r) => r.lote || r.serie || "",
        cell: (r) => (r.lote || r.serie ? <span className="font-mono text-xs">{r.lote || r.serie}</span> : "-"),
        filterType: "text",
      },
      {
        key: "stockActual",
        header: "Stock total",
        accessor: (r) => r.stockActual,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "disponible",
        header: "Disponible",
        accessor: (r) => r.disponible,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "minimo",
        header: "Mínimo",
        accessor: (r) => r.minimo,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "costo",
        header: "Costo",
        accessor: (r) => r.costo,
        cell: (r) => (r.costo > 0 ? `$${r.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "Sin costo"),
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "valorTotal",
        header: "Valor inventario",
        accessor: (r) => r.valorTotal,
        cell: (r) => `$${r.valorTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "demandaPromedio",
        header: `Demanda ${preferences.demandPeriodDays}d`,
        accessor: (r) => r.demandaPromedio,
        numeric: true,
        align: "right",
        filterType: "number",
        defaultVisible: false,
      },
      {
        key: "sugerido",
        header: "Sugerencia reorden",
        accessor: (r) => r.sugerido,
        cell: (r) =>
          r.sugerido > 0 ? (
            <Badge variant="outline" className="border-amber-400/60 text-amber-700">
              {r.sugerido} unidades
            </Badge>
          ) : (
            <Badge variant="secondary">OK</Badge>
          ),
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "estado",
        header: "Estado",
        accessor: (r) => (r.sinCosto ? "Sin costo" : r.estado),
        cell: (r) =>
          r.sinCosto ? (
            <Badge variant="outline">Sin costo</Badge>
          ) : r.estado === "Bajo mínimo" ? (
            <Badge variant="destructive">Bajo mínimo</Badge>
          ) : (
            <Badge variant="secondary">Disponible</Badge>
          ),
        filterType: "select",
        filterOptions: [
          { label: "Disponible", value: "Disponible" },
          { label: "Bajo mínimo", value: "Bajo mínimo" },
          { label: "Sin costo", value: "Sin costo" },
        ],
      },
    ],
    [preferences.demandPeriodDays],
  )

  const handlePeriodChange = async (newPeriod: number) => {
    await savePreferences({ ...preferences, demandPeriodDays: newPeriod })
  }

  const isLoading = warehouseData.loading || prefsLoading || demandLoading

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Existencias</h2>
            <p className="text-sm text-muted-foreground">
              Stock por producto, almacén, lote o serie con valor y sugerencia de reorden.
            </p>
          </div>
          <DemandPeriodSelector value={preferences.demandPeriodDays} onChange={handlePeriodChange} disabled={isLoading} />
        </div>

        <DataTablePro
          tableId="warehouse-inventory"
          columns={columns}
          rows={rows}
          getRowId={(r) => String(r.id ?? `${r.productoId}-${r.almacenId}-${r.lote ?? r.serie ?? "stock"}`)}
          moduleName="Inventario y Almacén · Existencias"
          quickFilters={[
            { label: "Stock bajo", predicate: (r) => r.estado === "Bajo mínimo" },
            { label: "Sin costo", predicate: (r) => r.sinCosto },
            { label: "Con existencia", predicate: (r) => r.stockActual > 0 },
            { label: "Sugerencia de reorden", predicate: (r) => r.sugerido > 0 },
          ]}
          toolbarActions={
            <Button size="sm" variant="outline" onClick={() => setRefreshKey((key) => key + 1)}>
              <PackagePlus className="mr-1 h-4 w-4" />
              Recalcular
            </Button>
          }
          importHref="/dashboard/import?entity=inventario-inicial"
          onRefresh={() => setRefreshKey((key) => key + 1)}
          helpItems={[
            "Usa búsqueda, filtros por columna y orden para encontrar SKUs o almacenes.",
            "Exporta a Excel o CSV respetando filtros, columnas y orden actuales.",
            "El botón Totales calcula stock, disponible, costos y valor de toda la tabla, filtradas o seleccionadas.",
            "La sugerencia de reorden usa mínimos, máximos y demanda cuando hay datos suficientes.",
          ]}
          emptyMessage={isLoading ? "Cargando inventario..." : "No hay inventario registrado."}
          emptyHint="Importa inventario inicial o registra movimientos desde la pestaña Movimientos."
          testId="warehouse-inventory-table"
        />
      </CardContent>
    </Card>
  )
}
