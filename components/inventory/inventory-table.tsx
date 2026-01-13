"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Search, Settings2, Download, PackagePlus } from "lucide-react"
import { useFirestore } from "@/hooks/use-firestore"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { useInventoryCalculations } from "@/hooks/use-inventory-calculations"
import { COLLECTIONS } from "@/lib/firestore"
import { ColumnConfigModal } from "./column-config-modal"
import { DemandPeriodSelector } from "./demand-period-selector"
import { GoodsReceiptDialog } from "./goods-receipt-dialog"
import { ProductFormDialog } from "./product-form-dialog"
import type { StockMovement } from "@/lib/types"

interface Product {
  id: string
  sku?: string
  name: string
  category: string
  stock: number
  minStock: number
  price: number
  supplier?: string
  leadTime?: number
  companyId?: string
}

function getProductStatus(stock: number, minStock: number): "available" | "low" | "out" {
  if (stock === 0) return "out"
  if (stock <= minStock) return "low"
  return "available"
}

const statusConfig = {
  available: { label: "Disponible", variant: "outline" as const, color: "text-green-600" },
  low: { label: "Stock Bajo", variant: "secondary" as const, color: "text-orange-600" },
  out: { label: "Agotado", variant: "destructive" as const, color: "text-red-600" },
}

const orderLevelConfig = {
  safe: { variant: "outline" as const, className: "bg-green-50 text-green-700 border-green-200" },
  warning: { variant: "secondary" as const, className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  critical: { variant: "destructive" as const, className: "bg-red-50 text-red-700 border-red-200" },
}

export function InventoryTable() {
  const [search, setSearch] = useState("")
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const { items: products, loading, remove, update } = useFirestore<Product>(COLLECTIONS.products, [], true)
  const { preferences, loading: prefsLoading, savePreferences } = useUserPreferences()
  const { demandData, loading: demandLoading } = useInventoryCalculations(products, preferences.demandPeriodDays)

  const { create: createStockMovement } = useFirestore<StockMovement>(COLLECTIONS.stockMovements, [], true)

  const filteredProducts = products.filter(
    (product) =>
      product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      product?.category?.toLowerCase().includes(search.toLowerCase()) ||
      product?.sku?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      await remove(id)
    }
  }

  const handlePeriodChange = async (newPeriod: number) => {
    await savePreferences({
      ...preferences,
      demandPeriodDays: newPeriod,
    })
  }

  const handleReceiveGoods = (product: Product) => {
    setSelectedProduct(product)
    setReceiptDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setEditDialogOpen(true)
  }

  const handleSaveProduct = async (data: Partial<Product>) => {
    if (!editingProduct) return
    try {
      await update(editingProduct.id, data)
    } catch (error) {
      console.error("[InventoryTable] Error updating product:", error)
      alert("Error al guardar el producto")
    } finally {
      setEditDialogOpen(false)
      setEditingProduct(null)
    }
  }

  const handleSaveReceipt = async (receiptData: Partial<StockMovement>) => {
    await createStockMovement(receiptData)
    setReceiptDialogOpen(false)
    setSelectedProduct(null)
  }

  const handleExport = () => {
    const csvContent = [
      [
        "SKU",
        "Producto",
        "Categoría",
        "Stock",
        "Stock Mín.",
        "Precio",
        "Proveedor",
        `Demanda Prom. (${preferences.demandPeriodDays}d)`,
        "Pedido Sugerido (unidades)",
        "Pedido Sugerido ($)",
        "Estado",
      ],
      ...filteredProducts.map((product) => {
        const status = getProductStatus(product.stock || 0, product.minStock || 0)
        const demand = demandData[product.id]
        const suggestedQty = demand?.suggestedOrder || 0
        const suggestedAmount = suggestedQty * (product.price || 0)

        return [
          product.sku || "-",
          product.name,
          product.category || "-",
          product.stock || 0,
          product.minStock || 0,
          (product.price || 0).toFixed(2),
          product.supplier || "-",
          demand ? demand.avgDemand30Days.toFixed(2) : "0.00",
          suggestedQty,
          suggestedAmount.toFixed(2),
          statusConfig[status].label,
        ]
      }),
    ]

    const csv = csvContent.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `inventario_${preferences.demandPeriodDays}d_${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const cols = preferences.visibleColumns
  const isLoading = loading || prefsLoading || demandLoading

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Lista de Productos</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                disabled={isLoading || filteredProducts.length === 0}
                title="Exportar a CSV"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setConfigModalOpen(true)}
                title="Configurar columnas"
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cols.avgDemand && (
            <div className="mb-4 flex items-center justify-end">
              <DemandPeriodSelector
                value={preferences.demandPeriodDays}
                onChange={handlePeriodChange}
                disabled={isLoading}
              />
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando productos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No se encontraron productos" : "No hay productos registrados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {cols.sku && <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">SKU</th>}
                    {cols.name && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Producto</th>
                    )}
                    {cols.category && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Categoría</th>
                    )}
                    {cols.stock && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Stock</th>
                    )}
                    {cols.minStock && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Stock Mín.</th>
                    )}
                    {cols.price && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Precio</th>
                    )}
                    {cols.supplier && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Proveedor</th>
                    )}
                    {cols.avgDemand && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Demanda Prom. ({preferences.demandPeriodDays}d)
                      </th>
                    )}
                    {cols.suggestedOrder && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Pedido Sugerido</th>
                    )}
                    {cols.status && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Estado</th>
                    )}
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const status = getProductStatus(product.stock || 0, product.minStock || 0)
                    const demand = demandData[product.id]
                    const suggestedQty = demand?.suggestedOrder || 0
                    const suggestedAmount = suggestedQty * (product.price || 0)

                    return (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50">
                        {cols.sku && <td className="py-3 px-2 text-sm font-medium">{product.sku || "-"}</td>}
                        {cols.name && <td className="py-3 px-2 text-sm font-medium">{product.name}</td>}
                        {cols.category && (
                          <td className="py-3 px-2 text-sm text-muted-foreground">{product.category || "-"}</td>
                        )}
                        {cols.stock && (
                          <td className="py-3 px-2">
                            <span
                              className={`text-sm font-medium ${
                                product.stock <= product.minStock ? "text-orange-600" : "text-foreground"
                              }`}
                            >
                              {product.stock || 0}
                            </span>
                          </td>
                        )}
                        {cols.minStock && (
                          <td className="py-3 px-2 text-sm text-muted-foreground">{product.minStock || 0}</td>
                        )}
                        {cols.price && (
                          <td className="py-3 px-2 text-sm font-medium">${(product.price || 0).toFixed(2)}</td>
                        )}
                        {cols.supplier && (
                          <td className="py-3 px-2 text-sm text-muted-foreground">{product.supplier || "-"}</td>
                        )}
                        {cols.avgDemand && (
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {demand ? demand.avgDemand30Days.toFixed(2) : "0.00"}
                          </td>
                        )}
                        {cols.suggestedOrder && (
                          <td className="py-3 px-2">
                            {suggestedQty > 0 ? (
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant={orderLevelConfig[demand?.suggestedOrderLevel || "safe"].variant}
                                  className={orderLevelConfig[demand?.suggestedOrderLevel || "safe"].className}
                                >
                                  {suggestedQty} unidades
                                </Badge>
                                <span className="text-xs text-muted-foreground">${suggestedAmount.toFixed(2)}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  OK
                                </Badge>
                                <span className="text-xs text-muted-foreground">$0.00</span>
                              </div>
                            )}
                          </td>
                        )}
                        {cols.status && (
                          <td className="py-3 px-2">
                            <Badge variant={statusConfig[status].variant}>{statusConfig[status].label}</Badge>
                          </td>
                        )}
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReceiveGoods(product)}
                              title="Recibir Mercancía"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                              title="Editar producto"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      <ColumnConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        preferences={preferences}
        onSave={savePreferences}
      />

      {selectedProduct && (
        <GoodsReceiptDialog
          open={receiptDialogOpen}
          onOpenChange={setReceiptDialogOpen}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onSave={handleSaveReceipt}
        />
      )}

      <ProductFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </>
  )
}
