"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Incident, Employee } from "@/lib/types"

interface IncidentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (incident: Omit<Incident, "id">) => Promise<void>
  incident?: Incident | null
  employees: Employee[]
}

export function IncidentDialog({ open, onOpenChange, onSave, incident, employees }: IncidentDialogProps) {
  const [formData, setFormData] = useState({
    empleadoId: "",
    tipo: "falta" as "falta" | "retardo" | "permiso" | "incapacidad" | "vacaciones" | "suspension",
    fechaInicio: "",
    fechaFin: "",
    motivo: "",
    afectaNomina: true,
  })

  useEffect(() => {
    if (incident) {
      setFormData({
        empleadoId: incident.empleadoId,
        tipo: incident.tipo,
        fechaInicio: typeof incident.fechaInicio === "string" ? incident.fechaInicio : "",
        fechaFin: typeof incident.fechaFin === "string" ? incident.fechaFin : "",
        motivo: incident.motivo || "",
        afectaNomina: incident.afectaNomina !== undefined ? incident.afectaNomina : true,
      })
    } else {
      setFormData({
        empleadoId: "",
        tipo: "falta",
        fechaInicio: "",
        fechaFin: "",
        motivo: "",
        afectaNomina: true,
      })
    }
  }, [incident, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      ...formData,
      fechaSolicitud: new Date().toISOString(),
      estado: "pendiente",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{incident ? "Editar Incidencia" : "Nueva Incidencia"}</DialogTitle>
          <DialogDescription>Registra una incidencia de asistencia o permiso.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="empleadoId">Empleado</Label>
            <Select
              value={formData.empleadoId}
              onValueChange={(value) => setFormData({ ...formData, empleadoId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un empleado" />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter((e) => e.estado === "activo")
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellidoPaterno} - {emp.numeroEmpleado}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Incidencia</Label>
            <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="falta">Falta</SelectItem>
                <SelectItem value="retardo">Retardo</SelectItem>
                <SelectItem value="permiso">Permiso</SelectItem>
                <SelectItem value="incapacidad">Incapacidad</SelectItem>
                <SelectItem value="vacaciones">Vacaciones</SelectItem>
                <SelectItem value="suspension">Suspensión</SelectItem>
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
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Describe el motivo de la incidencia"
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
