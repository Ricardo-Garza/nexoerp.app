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
import { useSuppliersData } from "@/hooks/use-suppliers-data"
import type { Supplier } from "@/lib/types"

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}

export function SupplierFormDialog({ open, onOpenChange, supplier }: SupplierFormDialogProps) {
  const { createSupplier, updateSupplier } = useSuppliersData()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    razonSocial: "",
    rfc: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    estado: "",
    codigoPostal: "",
    pais: "México",
    contactoPrincipal: "",
    cuentaBancaria: "",
    clabe: "",
    banco: "",
    diasCredito: "30",
    limiteCredito: "0",
    moneda: "MXN",
    estadoProveedor: "activo",
    categorias: "",
    notas: "",
  })

  useEffect(() => {
    if (supplier) {
      setFormData({
        nombre: supplier.nombre || "",
        razonSocial: supplier.razonSocial || "",
        rfc: supplier.rfc || "",
        email: supplier.email || "",
        telefono: supplier.telefono || "",
        direccion: supplier.direccion || "",
        ciudad: supplier.ciudad || "",
        estado: supplier.estado || "",
        codigoPostal: supplier.codigoPostal || "",
        pais: supplier.pais || "México",
        contactoPrincipal: supplier.contactoPrincipal || "",
        cuentaBancaria: supplier.cuentaBancaria || "",
        clabe: supplier.clabe || "",
        banco: supplier.banco || "",
        diasCredito: String(supplier.diasCredito || 30),
        limiteCredito: String(supplier.limiteCredito || 0),
        moneda: supplier.moneda || "MXN",
        estadoProveedor: supplier.estadoProveedor || "activo",
        categorias: (supplier.categorias || []).join(", "),
        notas: supplier.notas || "",
      })
    } else {
      setFormData({
        nombre: "",
        razonSocial: "",
        rfc: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        estado: "",
        codigoPostal: "",
        pais: "México",
        contactoPrincipal: "",
        cuentaBancaria: "",
        clabe: "",
        banco: "",
        diasCredito: "30",
        limiteCredito: "0",
        moneda: "MXN",
        estadoProveedor: "activo",
        categorias: "",
        notas: "",
      })
    }
  }, [supplier, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supplierData = {
        nombre: formData.nombre,
        razonSocial: formData.razonSocial,
        rfc: formData.rfc,
        email: formData.email,
        telefono: formData.telefono,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
        estado: formData.estado,
        codigoPostal: formData.codigoPostal,
        pais: formData.pais,
        contactoPrincipal: formData.contactoPrincipal,
        cuentaBancaria: formData.cuentaBancaria || "",
        clabe: formData.clabe || "",
        banco: formData.banco || "",
        diasCredito: Number.parseInt(formData.diasCredito) || 30,
        limiteCredito: Number.parseFloat(formData.limiteCredito) || 0,
        saldoPorPagar: supplier?.saldoPorPagar || 0,
        moneda: formData.moneda as "MXN" | "USD" | "EUR",
        rating: supplier?.rating || 0,
        estadoProveedor: formData.estadoProveedor as "activo" | "inactivo" | "suspendido",
        categorias: formData.categorias
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        productosSuministrados: supplier?.productosSuministrados || [],
        comprasTotales: supplier?.comprasTotales || 0,
        ultimaCompra: supplier?.ultimaCompra || null, // Use null instead of undefined
        leadTime: supplier?.leadTime || null, // Use null instead of undefined
        notas: formData.notas || "",
      }

      if (supplier) {
        await updateSupplier(supplier.id, supplierData as any)
      } else {
        await createSupplier(supplierData)
      }

      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving supplier:", error)
      alert("Error al guardar el proveedor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
          <DialogDescription>
            {supplier ? "Actualiza la información del proveedor" : "Registra un nuevo proveedor en el sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre Comercial <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razonSocial">
                  Razón Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="razonSocial"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactoPrincipal">Contacto Principal</Label>
                <Input
                  id="contactoPrincipal"
                  value={formData.contactoPrincipal}
                  onChange={(e) => setFormData({ ...formData, contactoPrincipal: e.target.value })}
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
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuentaBancaria">Cuenta</Label>
                <Input
                  id="cuentaBancaria"
                  value={formData.cuentaBancaria}
                  onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clabe">CLABE</Label>
                <Input
                  id="clabe"
                  value={formData.clabe}
                  onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diasCredito">Días Crédito</Label>
                <Input
                  id="diasCredito"
                  type="number"
                  value={formData.diasCredito}
                  onChange={(e) => setFormData({ ...formData, diasCredito: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limiteCredito">Límite Crédito</Label>
                <Input
                  id="limiteCredito"
                  type="number"
                  step="0.01"
                  value={formData.limiteCredito}
                  onChange={(e) => setFormData({ ...formData, limiteCredito: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moneda">Moneda</Label>
                <Select value={formData.moneda} onValueChange={(value) => setFormData({ ...formData, moneda: value })}>
                  <SelectTrigger id="moneda">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoProveedor">Estado</Label>
                <Select
                  value={formData.estadoProveedor}
                  onValueChange={(value) => setFormData({ ...formData, estadoProveedor: value })}
                >
                  <SelectTrigger id="estadoProveedor">
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

            <div className="space-y-2">
              <Label htmlFor="categorias">Categorías (separadas por coma)</Label>
              <Input
                id="categorias"
                value={formData.categorias}
                onChange={(e) => setFormData({ ...formData, categorias: e.target.value })}
                placeholder="Flores, Plantas, Suministros"
              />
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
              {loading ? "Guardando..." : supplier ? "Actualizar" : "Crear Proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
