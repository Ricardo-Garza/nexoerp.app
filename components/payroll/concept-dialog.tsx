"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { BenefitDeduction } from "@/lib/types"

interface ConceptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (concept: Omit<BenefitDeduction, "id">) => Promise<void>
  concept?: BenefitDeduction | null
}

export function ConceptDialog({ open, onOpenChange, onSave, concept }: ConceptDialogProps) {
  const [formData, setFormData] = useState({
    clave: "",
    nombre: "",
    tipo: "percepcion" as "percepcion" | "deduccion",
    tipocalculo: "fijo" as "fijo" | "porcentaje",
    monto: 0,
    porcentaje: 0,
    activo: true,
    esObligatorio: false,
    orden: 0,
  })

  useEffect(() => {
    if (concept) {
      setFormData({
        clave: concept.clave,
        nombre: concept.nombre,
        tipo: concept.tipo,
        tipocalculo: concept.tipocalculo,
        monto: concept.monto || 0,
        porcentaje: concept.porcentaje || 0,
        activo: concept.activo !== undefined ? concept.activo : true,
        esObligatorio: concept.esObligatorio !== undefined ? concept.esObligatorio : false,
        orden: concept.orden || 0,
      })
    } else {
      setFormData({
        clave: "",
        nombre: "",
        tipo: "percepcion",
        tipocalculo: "fijo",
        monto: 0,
        porcentaje: 0,
        activo: true,
        esObligatorio: false,
        orden: 0,
      })
    }
  }, [concept, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      ...formData,
      esRecurrente: true,
      aplicaATodos: true,
      categoriaIMSS: false,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{concept ? "Editar Concepto" : "Nuevo Concepto"}</DialogTitle>
          <DialogDescription>Define un concepto de percepción o deducción para la nómina.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clave">Clave</Label>
              <Input
                id="clave"
                placeholder="Ej: P001"
                value={formData.clave}
                onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                type="number"
                value={formData.orden}
                onChange={(e) => setFormData({ ...formData, orden: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nombre">Nombre del Concepto</Label>
            <Input
              id="nombre"
              placeholder="Ej: Sueldo Base"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percepcion">Percepción</SelectItem>
                  <SelectItem value="deduccion">Deducción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipocalculo">Tipo de Cálculo</Label>
              <Select
                value={formData.tipocalculo}
                onValueChange={(value: any) => setFormData({ ...formData, tipocalculo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fijo">Monto Fijo</SelectItem>
                  <SelectItem value="porcentaje">Porcentaje</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.tipocalculo === "fijo" ? (
            <div>
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: Number.parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="porcentaje">Porcentaje (%)</Label>
              <Input
                id="porcentaje"
                type="number"
                step="0.01"
                value={formData.porcentaje}
                onChange={(e) => setFormData({ ...formData, porcentaje: Number.parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked as boolean })}
              />
              <Label htmlFor="activo" className="cursor-pointer">
                Activo
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="esObligatorio"
                checked={formData.esObligatorio}
                onCheckedChange={(checked) => setFormData({ ...formData, esObligatorio: checked as boolean })}
              />
              <Label htmlFor="esObligatorio" className="cursor-pointer">
                Obligatorio
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
