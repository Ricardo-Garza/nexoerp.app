"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ProductionOrder, Product, ProductFormula, Warehouse } from "@/lib/types"

interface ProductionOrderDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<ProductionOrder, "id">) => Promise<void>
  order?: ProductionOrder | null
  products: Product[]
  formulas: ProductFormula[]
  warehouses: Warehouse[]
}

export function ProductionOrderDialog({
  open,
  onClose,
  onSave,
  order,
  products,
  formulas,
  warehouses,
}: ProductionOrderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    folio: "",
    productId: "",
    quantity: 1,
    priority: "normal" as const,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    formulaId: "",
    almacenOrigenId: "",
    almacenDestinoId: "",
    notes: "",
  })

  useEffect(() => {
    if (order) {
      setFormData({
        folio: order.folio,
        productId: order.productId,
        quantity: order.quantity,
        priority: order.priority,
        startDate:
          typeof order.startDate === "string" ? order.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
        endDate:
          typeof order.endDate === "string" ? order.endDate.split("T")[0] : new Date().toISOString().split("T")[0],
        formulaId: order.formulaId || "",
        almacenOrigenId: order.almacenOrigenId,
        almacenDestinoId: order.almacenDestinoId,
        notes: order.notes || "",
      })
    } else {
      setFormData({
        folio: `PROD-${Date.now()}`,
        productId: "",
        quantity: 1,
        priority: "normal",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        formulaId: "",
        almacenOrigenId: "",
        almacenDestinoId: "",
        notes: "",
      })
    }
  }, [order, open])

  const selectedProduct = products.find((p) => p.id === formData.productId)
  const productFormulas = formulas.filter((f) => f.productId === formData.productId && f.isActive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const product = products.find((p) => p.id === formData.productId)
      const almacenOrigen = warehouses.find((w) => w.id === formData.almacenOrigenId)
      const almacenDestino = warehouses.find((w) => w.id === formData.almacenDestinoId)

      if (!product || !almacenOrigen || !almacenDestino) {
        alert("Debe seleccionar producto y almacenes")
        return
      }

      await onSave({
        ...formData,
        productName: product.name,
        almacenOrigenNombre: almacenOrigen.nombre,
        almacenDestinoNombre: almacenDestino.nombre,
        completed: order?.completed || 0,
        status: order?.status || "pending",
        materialsReserved: order?.materialsReserved || false,
        materialsConsumed: order?.materialsConsumed || false,
        finishedProductGenerated: order?.finishedProductGenerated || false,
        reservedMaterials: order?.reservedMaterials || [],
      } as any)

      onClose()
    } catch (error: any) {
      alert(error.message || "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Editar Orden" : "Nueva Orden de Producción"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Folio</Label>
              <Input value={formData.folio} onChange={(e) => setFormData({ ...formData, folio: e.target.value })} />
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Producto *</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => setFormData({ ...formData, productId: value, formulaId: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.productId && (
            <div>
              <Label>Fórmula / BOM *</Label>
              <Select
                value={formData.formulaId}
                onValueChange={(value) => setFormData({ ...formData, formulaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fórmula" />
                </SelectTrigger>
                <SelectContent>
                  {productFormulas.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      Versión {f.version} - ${f.totalCost.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Almacén Origen (Materias Primas) *</Label>
              <Select
                value={formData.almacenOrigenId}
                onValueChange={(value) => setFormData({ ...formData, almacenOrigenId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar almacén" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Almacén Destino (Producto Terminado) *</Label>
              <Select
                value={formData.almacenDestinoId}
                onValueChange={(value) => setFormData({ ...formData, almacenDestinoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar almacén" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.productId || !formData.almacenOrigenId || !formData.almacenDestinoId}
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
