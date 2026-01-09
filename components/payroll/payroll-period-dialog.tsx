"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PayrollPeriod } from "@/lib/types"

interface PayrollPeriodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (period: Omit<PayrollPeriod, "id">) => Promise<void>
  period?: PayrollPeriod | null
  employeeCount: number
}

export function PayrollPeriodDialog({ open, onOpenChange, onSave, period, employeeCount }: PayrollPeriodDialogProps) {
  const [formData, setFormData] = useState({
    periodo: "",
    tipo: "quincenal" as "semanal" | "quincenal" | "mensual",
    fechaInicio: "",
    fechaFin: "",
    fechaPago: "",
    estado: "borrador" as "borrador" | "calculada" | "pagada" | "cancelada",
  })

  useEffect(() => {
    if (period) {
      setFormData({
        periodo: period.periodo,
        tipo: period.tipo,
        fechaInicio: typeof period.fechaInicio === "string" ? period.fechaInicio : "",
        fechaFin: typeof period.fechaFin === "string" ? period.fechaFin : "",
        fechaPago: typeof period.fechaPago === "string" ? period.fechaPago : "",
        estado: period.estado,
      })
    } else {
      setFormData({
        periodo: "",
        tipo: "quincenal",
        fechaInicio: "",
        fechaFin: "",
        fechaPago: "",
        estado: "borrador",
      })
    }
  }, [period, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      ...formData,
      totalNomina: 0,
      totalPercepciones: 0,
      totalDeducciones: 0,
      totalEmpleados: employeeCount,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{period ? "Editar Periodo" : "Nuevo Periodo de Nómina"}</DialogTitle>
          <DialogDescription>Define el periodo de nómina y las fechas correspondientes.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="periodo">Nombre del Periodo</Label>
            <Input
              id="periodo"
              placeholder="Ej: Quincena 01-2024"
              value={formData.periodo}
              onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Periodo</Label>
            <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="quincenal">Quincenal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="fechaPago">Fecha de Pago</Label>
            <Input
              id="fechaPago"
              type="date"
              value={formData.fechaPago}
              onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
              required
            />
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
