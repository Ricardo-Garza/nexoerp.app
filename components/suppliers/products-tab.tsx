"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Package, DollarSign, Plus, Edit, Search, Truck } from "lucide-react"
import { useSuppliersData } from "@/hooks/use-suppliers-data"
import { SupplierProductDialog } from "./supplier-product-dialog"
import type { SupplierProduct } from "@/lib/types"

export function ProductsTab() {
  const { products, loading, createProduct, updateProduct } = useSuppliersData()
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | undefined>()
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string } | null>(null)

  const filteredProducts = products.filter(
    (product) =>
      product?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      product?.sku?.toLowerCase().includes(search.toLowerCase()) ||
      product?.proveedorNombre?.toLowerCase().includes(search.toLowerCase()) ||
      product?.codigoProveedor?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSaveProduct = async (productData: Partial<SupplierProduct>) => {
    if (selectedProduct) {
      await updateProduct(selectedProduct.id, productData)
    } else {
      await createProduct(productData)
    }
    setShowDialog(false)
    setSelectedProduct(undefined)
  }

  const handleAddProduct = () => {
    setSelectedProduct(undefined)
    setSelectedSupplier(null)
    setShowDialog(true)
  }

  const handleEditProduct = (product: SupplierProduct) => {
    setSelectedProduct(product)
    setSelectedSupplier({ id: product.proveedorId, name: product.proveedorNombre })
    setShowDialog(true)
  }

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD":
        return "$"
      case "EUR":
        return "€"
      case "MXN":
      default:
        return "$"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando productos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Productos Suministrados</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
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
                Nuevo Producto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredProducts || filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {search ? "No se encontraron productos" : "No hay productos registrados"}
              </p>
              {!search && (
                <Button onClick={handleAddProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Producto
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{product.nombre}</p>
                      <Badge variant={product.activo ? "default" : "secondary"}>
                        {product.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      {product.monedaPrincipal && <Badge variant="outline">{product.monedaPrincipal}</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        SKU: {product.sku}
                      </span>
                      {product.codigoProveedor && <span>Código Proveedor: {product.codigoProveedor}</span>}
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {getCurrencySymbol(product.monedaPrincipal)} {product.costoUltimo?.toFixed(2) || "0.00"}
                      </span>
                      {product.leadTime && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {product.leadTime}d
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{product.proveedorNombre}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSupplier && (
        <SupplierProductDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          product={selectedProduct}
          supplierId={selectedSupplier?.id}
          supplierName={selectedSupplier?.name}
          onSave={handleSaveProduct}
        />
      )}
      {!selectedSupplier && (
        <SupplierProductDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          product={selectedProduct}
          onSave={handleSaveProduct}
        />
      )}
    </>
  )
}
