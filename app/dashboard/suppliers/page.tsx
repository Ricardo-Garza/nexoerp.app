"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ShoppingCart, FileCheck, DollarSign, Truck } from "lucide-react"
import { useSuppliersData } from "@/hooks/use-suppliers-data"
import { SuppliersTab } from "@/components/suppliers/suppliers-tab"
import { DocumentsTab } from "@/components/suppliers/documents-tab"
import { PayablesTab } from "@/components/suppliers/payables-tab"
import { StatisticsTab } from "@/components/suppliers/statistics-tab"
import { ProductsTab } from "@/components/suppliers/products-tab"
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog"

export default function SuppliersPage() {
  const {
    comprasDelMes,
    porcentajeIncrementoCompras,
    ordenesCompraActivas,
    ordenesPendientes,
    cuentasPorPagarTotal,
    cuentasPorVencer,
    proveedoresActivos,
    loading,
  } = useSuppliersData()

  const [showSupplierDialog, setShowSupplierDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => setShowSupplierDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <Badge variant={porcentajeIncrementoCompras >= 0 ? "default" : "destructive"}>
                {porcentajeIncrementoCompras >= 0 ? "+" : ""}
                {porcentajeIncrementoCompras.toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Compras del Mes</p>
              <p className="text-2xl font-bold mt-1">
                ${comprasDelMes.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="outline">{ordenesPendientes} pendientes</Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Ordenes de Compra</p>
              <p className="text-2xl font-bold mt-1">{ordenesCompraActivas}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="secondary">
                Por vencer: $
                {cuentasPorVencer.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Cuentas por Pagar</p>
              <p className="text-2xl font-bold mt-1">
                ${cuentasPorPagarTotal.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="default">En tiempo</Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Proveedores Activos</p>
              <p className="text-2xl font-bold mt-1">{proveedoresActivos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="payables">Cuentas por Pagar</TabsTrigger>
          <TabsTrigger value="statistics">Estadisticas</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          <SuppliersTab />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab />
        </TabsContent>

        <TabsContent value="payables">
          <PayablesTab />
        </TabsContent>

        <TabsContent value="statistics">
          <StatisticsTab />
        </TabsContent>
      </Tabs>

      <SupplierFormDialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog} supplier={null} />
    </div>
  )
}



