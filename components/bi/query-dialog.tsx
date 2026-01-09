"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { BIQuery } from "@/lib/types"

interface QueryDialogProps {
  query: BIQuery | null
  onClose: () => void
  onSave: (data: Partial<BIQuery>) => Promise<void>
}

const dataSources = [
  { value: "salesOrders", label: "Órdenes de Venta" },
  { value: "salesInvoices", label: "Facturas de Venta" },
  { value: "purchaseOrders", label: "Órdenes de Compra" },
  { value: "inventoryStock", label: "Inventario" },
  { value: "stockMovements", label: "Movimientos de Stock" },
  { value: "bankTransactions", label: "Transacciones Bancarias" },
  { value: "journalEntries", label: "Asientos Contables" },
  { value: "serviceTickets", label: "Tickets de Servicio" },
  { value: "workOrders", label: "Órdenes de Trabajo" },
]

export function QueryDialog({ query, onClose, onSave }: QueryDialogProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: query?.name || "",
    description: query?.description || "",
    dataSource: query?.dataSource || "salesOrders",
    fields: query?.fields.join(", ") || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim(),
        dataSource: formData.dataSource,
        fields: formData.fields
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
        filters: query?.filters || {},
        aggregations: query?.aggregations || [],
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle>{query ? "Editar Consulta" : "Nueva Consulta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Ventas del último trimestre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el propósito de esta consulta"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataSource">Origen de Datos *</Label>
            <Select
              value={formData.dataSource}
              onValueChange={(value) => setFormData({ ...formData, dataSource: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dataSources.map((ds) => (
                  <SelectItem key={ds.value} value={ds.value}>
                    {ds.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fields">Campos (separados por comas)</Label>
            <Input
              id="fields"
              value={formData.fields}
              onChange={(e) => setFormData({ ...formData, fields: e.target.value })}
              placeholder="Ej: customerName, total, status"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || saving}>
              {saving ? "Guardando..." : query ? "Actualizar" : "Crear Consulta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
