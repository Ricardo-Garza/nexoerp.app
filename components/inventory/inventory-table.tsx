"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Search, Settings2, Download, PackagePlus, Plus } from "lucide-react"
import { useFirestore } from "@/hooks/use-firestore"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { useInventoryCalculations } from "@/hooks/use-inventory-calculations"
import { useAuth } from "@/hooks/use-auth"
import { useWarehouseData } from "@/hooks/use-warehouse-data"
import { COLLECTIONS } from "@/lib/firestore"
import { ColumnConfigModal } from "./column-config-modal"
import { DemandPeriodSelector } from "./demand-period-selector"
import { GoodsReceiptDialog } from "./goods-receipt-dialog"
import { SupplierProductDialog } from "@/components/suppliers/supplier-product-dialog"
import type { StockMovement } from "@/lib/types"
import type { SupplierProduct } from "@/lib/types"
import { where } from "firebase/firestore"

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
  tipoProducto?: "producto" | "servicio"
  claveSat?: string
  unidadSat?: string
  impuestosAplicables?: string[]
  categorias?: string[]
  trackInventory?: boolean
  active?: boolean
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
  const [editingSupplierProduct, setEditingSupplierProduct] = useState<SupplierProduct | undefined>()

  const { user } = useAuth()
  const companyId = (user as any)?.companyId || user?.uid || ""
  const companyFilter = companyId ? [where("companyId", "==", companyId)] : []

  const { inventoryStock, warehouses, createMovement } = useWarehouseData()
  const { items: products, loading, remove, update, create } = useFirestore<Product>(
    COLLECTIONS.products,
    companyFilter,
    true,
    false,
  )
  const { preferences, loading: prefsLoading, savePreferences } = useUserPreferences()
  const stockByProduct = useMemo(() => {
    const map = new Map<string, number>()
    inventoryStock.forEach((stock: any) => {
      const available =
        typeof stock.cantidadDisponible === "number" ? stock.cantidadDisponible : stock.cantidadActual || 0
      map.set(stock.productoId, (map.get(stock.productoId) || 0) + available)
    })
    return map
  }, [inventoryStock])

  const productsWithStock = useMemo(() => {
    return (products || []).map((product) => ({
      ...product,
      stock: stockByProduct.get(product.id) || 0,
    }))
  }, [products, stockByProduct])

  const { demandData, loading: demandLoading } = useInventoryCalculations(
    productsWithStock,
    preferences.demandPeriodDays,
    companyId,
  )

  const filteredProducts = productsWithStock.filter(
    (product) =>
      product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      product?.category?.toLowerCase().includes(search.toLowerCase()) ||
      product?.sku?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (confirm("Estas seguro de eliminar este producto?")) {
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

  const mapProductToSupplierProduct = (product: Product): any => {
    return {
      id: product.id,
      proveedorId: (product as any).supplierId || "",
      proveedorNombre: product.supplier || "",
      productoId: product.id,
      sku: product.sku || "",
      nombre: product.name || "",
      descripcion: (product as any).description || "",
      imagenUrl: (product as any).imageUrl || "",
      tipoProducto: (product as any).tipoProducto || "producto",
      claveSat: (product as any).claveSat || "",
      unidadSat: (product as any).unidadSat || "",
      impuestosAplicables: (product as any).impuestosAplicables || [],
      categorias: (product as any).categorias || [],
      controlInventario: (product as any).trackInventory !== false,
      precioBase: product.price || 0,
      monedaPrincipal: (product as any).currency || "MXN",
      costoUltimo: (product as any).cost || 0,
      unidadMedida: (product as any).baseUnit || "PZA",
      unidadCompra: (product as any).purchaseUnit || (product as any).baseUnit || "PZA",
      unidadesPorPresentacion: (product as any).unitsPerPackage || 1,
      trackingType: (product as any).trackingType || "ninguno",
      requiresExpiry: (product as any).requiresExpiry || false,
      leadTimeMin: (product as any).leadTimeMin || product.leadTime || 0,
      leadTimeMax: (product as any).leadTimeMax || product.leadTime || 0,
      leadTimePromedio: (product as any).leadTimePromedio || product.leadTime || 0,
      cantidadMinima: product.minStock || 1,
      cantidadMaxima: (product as any).maxStock || 0,
      activo: (product as any).active !== false,
      notas: (product as any).notes || "",
      notasEntrega: (product as any).notasEntrega || "",
      precios: (product as any).precios,
    } as unknown as SupplierProduct
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setEditingSupplierProduct(mapProductToSupplierProduct(product))
    setEditDialogOpen(true)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setEditingSupplierProduct(undefined)
    setEditDialogOpen(true)
  }

  const handleSaveProduct = async (data: Partial<SupplierProduct>) => {
    const mapped: Partial<Product> & Record<string, any> = {
      name: data.nombre || editingProduct?.name || "",
      sku: data.sku || editingProduct?.sku || "",
      category:
        ((data as any).categorias && (data as any).categorias[0]) ||
        (data as any).categoria ||
        editingProduct?.category ||
        "",
      categorias: (data as any).categorias || (editingProduct as any)?.categorias || [],
      tipoProducto: (data as any).tipoProducto || (editingProduct as any)?.tipoProducto || "producto",
      claveSat: (data as any).claveSat || (editingProduct as any)?.claveSat || "",
      unidadSat: (data as any).unidadSat || (editingProduct as any)?.unidadSat || "",
      impuestosAplicables: (data as any).impuestosAplicables || (editingProduct as any)?.impuestosAplicables || [],
      price: data.precioBase ?? editingProduct?.price ?? 0,
      cost: data.costoUltimo ?? data.precioBase ?? (editingProduct as any)?.cost ?? 0,
      minStock: data.cantidadMinima ?? editingProduct?.minStock ?? 0,
      stock: editingProduct?.stock ?? 0,
      supplier: data.proveedorNombre || editingProduct?.supplier || "",
      imageUrl: (data as any).imagenUrl || (editingProduct as any)?.imageUrl || "",
      leadTime: data.leadTimePromedio ?? editingProduct?.leadTime ?? 0,
      baseUnit: data.unidadMedida || (editingProduct as any)?.baseUnit || "PZA",
      purchaseUnit: data.unidadCompra || (editingProduct as any)?.purchaseUnit || "PZA",
      unitsPerPackage: data.unidadesPorPresentacion || (editingProduct as any)?.unitsPerPackage || 1,
      trackingType: data.trackingType || (editingProduct as any)?.trackingType || "ninguno",
      requiresExpiry: data.requiresExpiry || false,
      trackInventory: (data as any).controlInventario !== false,
      active: data.activo !== false,
      notes: data.notas || (editingProduct as any)?.notes || "",
      notasEntrega: data.notasEntrega || (editingProduct as any)?.notasEntrega || "",
      currency: data.monedaPrincipal || (editingProduct as any)?.currency || "MXN",
      precios: data.precios,
      leadTimeMin: data.leadTimeMin,
      leadTimeMax: data.leadTimeMax,
      leadTimePromedio: data.leadTimePromedio,
      cantidadMaxima: data.cantidadMaxima,
      companyId: editingProduct?.companyId || companyId,
    }

    try {
      if (editingProduct?.id) {
        await update(editingProduct.id, mapped)
      } else if (typeof data.productoId === "string" && data.productoId) {
        await update(data.productoId, mapped)
      } else {
        await create(mapped as Omit<Product, "id">)
      }
    } catch (error) {
      console.error("[InventoryTable] Error updating product:", error)
      alert("Error al guardar el producto")
    } finally {
      setEditDialogOpen(false)
      setEditingProduct(null)
      setEditingSupplierProduct(undefined)
    }
  }

  const handleSaveReceipt = async (receiptData: Partial<StockMovement>) => {
    if (!selectedProduct) return
    if (!receiptData.almacenId || !receiptData.almacenNombre) {
      alert("Selecciona un almacen para registrar la recepcion.")
      return
    }

    await createMovement({
      folio: receiptData.folio || `REC-${Date.now()}`,
      almacenId: receiptData.almacenId,
      almacenNombre: receiptData.almacenNombre,
      productoId: selectedProduct.id,
      productoNombre: selectedProduct.name,
      sku: selectedProduct.sku || "",
      unidadBase: (selectedProduct as any).baseUnit || "PZA",
      tipo: receiptData.tipo || "recepcion_compra",
      cantidad: receiptData.cantidad || 0,
      costoUnitario: (receiptData as any).costo || 0,
      fecha: receiptData.fecha || new Date().toISOString(),
      motivo: receiptData.motivo || "Recepcion de inventario",
      referencia: receiptData.referencia || "",
      lote: receiptData.lote || null,
      serie: receiptData.serie || null,
      fechaCaducidad: receiptData.fechaCaducidad || null,
      proveedorId: (receiptData as any).proveedorId || null,
      proveedorNombre: (receiptData as any).proveedorOrigen || null,
      recepcionId: receiptData.recepcionId || null,
      recepcionFolio: receiptData.recepcionFolio || null,
      notas: receiptData.notas || "",
    })

    setReceiptDialogOpen(false)
    setSelectedProduct(null)
  }

  const handleExport = () => {
    const csvContent = [
      [
        "SKU",
        "Producto",
        "Categoria",
        "Stock",
        "Stock Min.",
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
              <Button onClick={handleAddProduct}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
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
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Categoria</th>
                    )}
                    {cols.stock && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Stock</th>
                    )}
                    {cols.minStock && (
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Stock Min.</th>
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
                              title="Recibir Mercancia"
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
          warehouses={warehouses}
          onSave={handleSaveReceipt}
        />
      )}

      <SupplierProductDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        product={editingSupplierProduct}
        onSave={handleSaveProduct}
      />
    </>
  )
}
