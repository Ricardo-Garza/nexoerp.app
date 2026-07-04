"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FieldServiceOrder, Customer, FieldTechnician } from "@/lib/types"

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: FieldServiceOrder | null
  customers: Customer[]
  technicians: FieldTechnician[]
  generateServiceNumber: string
  onSubmit: (data: Partial<FieldServiceOrder>) => Promise<void>
}

export default function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  customers,
  technicians,
  generateServiceNumber,
  onSubmit,
}: ServiceFormDialogProps) {
  const [formData, setFormData] = useState<Partial<FieldServiceOrder>>({
    folio: generateServiceNumber,
    clienteId: "",
    clienteNombre: "",
    contacto: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    entidadFederativa: "",
    codigoPostal: "",
    latitud: 0,
    longitud: 0,
    tipo: "mantenimiento",
    categoria: "",
    descripcion: "",
    prioridad: "media",
    estado: "nuevo",
    slaHoras: 24,
    fechaProgramada: new Date().toISOString(),
    ventanaInicio: "08:00",
    ventanaFin: "18:00",
    tecnicoId: "",
    tecnicoNombre: "",
    evidencias: [],
    checklist: [],
    refacciones: [],
    costoServicio: 0,
    costoRefacciones: 0,
    costoTotal: 0,
    notas: "",
    bitacora: [],
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (service) {
      setFormData(service)
    } else {
      setFormData({
        folio: generateServiceNumber,
        clienteId: "",
        clienteNombre: "",
        contacto: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        entidadFederativa: "",
        codigoPostal: "",
        latitud: 0,
        longitud: 0,
        tipo: "mantenimiento",
        categoria: "",
        descripcion: "",
        prioridad: "media",
        estado: "nuevo",
        slaHoras: 24,
        fechaProgramada: new Date().toISOString(),
        ventanaInicio: "08:00",
        ventanaFin: "18:00",
        tecnicoId: "",
        tecnicoNombre: "",
        evidencias: [],
        checklist: [],
        refacciones: [],
        costoServicio: 0,
        costoRefacciones: 0,
        costoTotal: 0,
        notas: "",
        bitacora: [],
      })
    }
  }, [service, generateServiceNumber, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting service:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setFormData({
        ...formData,
        clienteId: customer.id,
        clienteNombre: customer.nombre,
        telefono: customer.telefono,
        direccion: customer.direccion || "",
        ciudad: customer.ciudad || "",
        entidadFederativa: customer.entidadFederativa || "",
        codigoPostal: customer.codigoPostal || "",
      })
    }
  }

  const handleTechnicianChange = (technicianId: string) => {
    const technician = technicians.find((t) => t.id === technicianId)
    if (technician) {
      setFormData({
        ...formData,
        tecnicoId: technician.id,
        tecnicoNombre: technician.nombre,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
          <DialogDescription>
            {service
              ? "Actualiza los detalles del servicio de campo existente."
              : "Crea una nueva orden de servicio para asignar a un técnico."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="folio">Folio</Label>
              <Input id="folio" value={formData.folio} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Servicio</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="reparacion">Reparación</SelectItem>
                  <SelectItem value="instalacion">Instalación</SelectItem>
                  <SelectItem value="inspeccion">Inspección</SelectItem>
                  <SelectItem value="emergencia">Emergencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select value={formData.clienteId} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contacto">Contacto</Label>
              <Input
                id="contacto"
                value={formData.contacto}
                onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.entidadFederativa}
                onChange={(e) => setFormData({ ...formData, entidadFederativa: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigoPostal">Código Postal</Label>
              <Input
                id="codigoPostal"
                value={formData.codigoPostal}
                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción del Servicio</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select
                value={formData.prioridad}
                onValueChange={(value) => setFormData({ ...formData, prioridad: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tecnico">Técnico Asignado</Label>
              <Select value={formData.tecnicoId} onValueChange={handleTechnicianChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Asignar técnico" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.nombre} - {tech.zona}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaProgramada">Fecha Programada</Label>
              <Input
                id="fechaProgramada"
                type="datetime-local"
                value={
                  formData.fechaProgramada
                    ? new Date(formData.fechaProgramada as string).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fechaProgramada: new Date(e.target.value).toISOString(),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slaHoras">SLA (Horas)</Label>
              <Input
                id="slaHoras"
                type="number"
                value={formData.slaHoras}
                onChange={(e) => setFormData({ ...formData, slaHoras: Number.parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : service ? "Actualizar" : "Crear Servicio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
