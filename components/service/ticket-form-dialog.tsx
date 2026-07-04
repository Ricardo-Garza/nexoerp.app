"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ServiceTicket, Customer } from "@/lib/types"
import { Timestamp } from "firebase/firestore"

interface TicketFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (ticket: Omit<ServiceTicket, "id">) => Promise<void>
  customers: Customer[]
  nextTicketNumber: string
}

export function TicketFormDialog({ open, onOpenChange, onSubmit, customers, nextTicketNumber }: TicketFormDialogProps) {
  const [formData, setFormData] = useState<any>({
    clienteId: "",
    clienteNombre: "",
    canal: "email" as const,
    asunto: "",
    descripcion: "",
    categoria: "soporte_tecnico",
    prioridad: "media" as const,
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const now = new Date()
      const ticket: Omit<ServiceTicket, "id"> = {
        numero: nextTicketNumber,
        clienteId: formData.clienteId || undefined,
        clienteNombre: formData.clienteNombre,
        canal: formData.canal,
        asunto: formData.asunto,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        prioridad: formData.prioridad,
        estado: "abierto",
        slaObjetivo:
          formData.prioridad === "critica"
            ? 2
            : formData.prioridad === "alta"
              ? 4
              : formData.prioridad === "media"
                ? 8
                : 24,
        fechaCreacion: Timestamp.fromDate(now),
        fechaUltimaActualizacion: Timestamp.fromDate(now),
        etiquetas: [],
        adjuntos: [],
        notasInternas: [],
        historial: [
          {
            id: crypto.randomUUID(),
            fecha: Timestamp.fromDate(now),
            usuario: "Sistema",
            tipo: "creacion",
            descripcion: "Ticket creado",
          },
        ],
        slaViolado: false,
        ordenVentaId: null,
        ordenVentaFolio: null,
        remisionId: null,
        remisionFolio: null,
        facturaId: null,
        facturaFolio: null,
        lineasDevolucion: [],
        almacenDevolucionId: null,
        almacenDevolucionNombre: null,
        estadoDevolucion: null,
        movimientosInventarioIds: [],
      }

      await onSubmit(ticket)

      // Reset form
      setFormData({
        clienteId: "",
        clienteNombre: "",
        canal: "email",
        asunto: "",
        descripcion: "",
        categoria: "soporte_tecnico",
        prioridad: "media",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating ticket:", error)
      alert("Error al crear el ticket")
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerChange = (value: string) => {
    const customer = customers.find((c) => c.id === value)
    if (customer) {
      setFormData({
        ...formData,
        clienteId: customer.id,
        clienteNombre: customer.nombre,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Ticket - {nextTicketNumber}</DialogTitle>
          <DialogDescription>
            Crea un nuevo ticket de servicio al cliente. Completa la información del cliente y describe el problema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
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
              <Label htmlFor="clientName">Nombre Cliente (Manual)</Label>
              <Input
                id="clientName"
                value={formData.clienteNombre}
                onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })}
                placeholder="O escribir nombre manualmente"
                required={!formData.clienteId}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="canal">Canal</Label>
              <Select value={formData.canal} onValueChange={(value: any) => setFormData({ ...formData, canal: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="telefono">Teléfono</SelectItem>
                  <SelectItem value="portal">Portal</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={formData.prioridad}
                onValueChange={(value: any) => setFormData({ ...formData, prioridad: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soporte_tecnico">Soporte Técnico</SelectItem>
                  <SelectItem value="facturacion">Facturación</SelectItem>
                  <SelectItem value="producto_danado">Producto Dañado</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="reclamo">Reclamo</SelectItem>
                  <SelectItem value="devolucion">Devolución</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              value={formData.asunto}
              onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
              placeholder="Breve descripción del problema"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe el problema en detalle..."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
