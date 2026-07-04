"use client"

import type React from "react"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCRMData } from "@/hooks/use-crm-data"
import type { Customer } from "@/lib/types"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Customer | null
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const { createCustomer, updateCustomer } = useCRMData()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    rfc: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    entidadFederativa: "",
    codigoPostal: "",
    limiteCredito: "0",
    diasCredito: "30",
    estado: "activo",
    tipoCliente: "minorista",
    descuentoDefault: "0",
    notas: "",
  })

  useEffect(() => {
    if (client) {
      setFormData({
        nombre: client.nombre || "",
        rfc: client.rfc || "",
        email: client.email || "",
        telefono: client.telefono || "",
        direccion: client.direccion || "",
        ciudad: client.ciudad || "",
        entidadFederativa: client.entidadFederativa || "",
        estado: client.estado || "activo",
        codigoPostal: client.codigoPostal || "",
        limiteCredito: String(client.limiteCredito || 0),
        diasCredito: String(client.diasCredito || 30),
        tipoCliente: client.tipoCliente || "minorista",
        descuentoDefault: String(client.descuentoDefault || 0),
        notas: client.notas || "",
      })
    } else {
      setFormData({
        nombre: "",
        rfc: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        entidadFederativa: "",
        estado: "activo",
        codigoPostal: "",
        limiteCredito: "0",
        diasCredito: "30",
        tipoCliente: "minorista",
        descuentoDefault: "0",
        notas: "",
      })
    }
  }, [client, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const customerData = {
        nombre: formData.nombre,
        rfc: formData.rfc,
        email: formData.email,
        telefono: formData.telefono,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
        estado: formData.estado as "activo" | "inactivo" | "suspendido",
        codigoPostal: formData.codigoPostal,
        limiteCredito: Number.parseFloat(formData.limiteCredito) || 0,
        saldo: client?.saldo || 0,
        diasCredito: Number.parseInt(formData.diasCredito) || 30,
        tipoCliente: formData.tipoCliente as "minorista" | "mayorista" | "distribuidor" | "vip",
        descuentoDefault: Number.parseFloat(formData.descuentoDefault) || 0,
        fechaRegistro: client?.fechaRegistro || new Date().toISOString(),
        notas: formData.notas,
      }

      if (client) {
        await updateCustomer(client.id, customerData)
      } else {
        await createCustomer(customerData)
      }

      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving customer:", error)
      alert("Error al guardar el cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Actualiza la información del cliente" : "Registra un nuevo cliente en el sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre / Razón Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
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
                <Label htmlFor="estadoDir">Estado</Label>
                <Input
                  id="estadoDir"
                  value={formData.entidadFederativa}
                  onChange={(e) => setFormData({ ...formData, entidadFederativa: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigoPostal">C.P.</Label>
                <Input
                  id="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
                <Select
                  value={formData.tipoCliente}
                  onValueChange={(value) => setFormData({ ...formData, tipoCliente: value })}
                >
                  <SelectTrigger id="tipoCliente">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minorista">Minorista</SelectItem>
                    <SelectItem value="mayorista">Mayorista</SelectItem>
                    <SelectItem value="distribuidor">Distribuidor</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoCliente">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                  <SelectTrigger id="estadoCliente">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="limiteCredito">Límite de Crédito</Label>
                <Input
                  id="limiteCredito"
                  type="number"
                  step="0.01"
                  value={formData.limiteCredito}
                  onChange={(e) => setFormData({ ...formData, limiteCredito: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diasCredito">Días de Crédito</Label>
                <Input
                  id="diasCredito"
                  type="number"
                  value={formData.diasCredito}
                  onChange={(e) => setFormData({ ...formData, diasCredito: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descuentoDefault">Descuento (%)</Label>
                <Input
                  id="descuentoDefault"
                  type="number"
                  step="0.01"
                  value={formData.descuentoDefault}
                  onChange={(e) => setFormData({ ...formData, descuentoDefault: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : client ? "Actualizar" : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
