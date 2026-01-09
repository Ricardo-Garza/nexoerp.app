"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Candidate } from "@/lib/types"

interface CandidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (candidate: Omit<Candidate, "id">) => Promise<void>
  candidate?: Candidate | null
}

export function CandidateDialog({ open, onOpenChange, onSave, candidate }: CandidateDialogProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    puesto: "",
    salarioDeseado: 0,
    etapa: "nuevo" as "nuevo" | "entrevista" | "prueba_tecnica" | "oferta" | "contratado" | "rechazado",
    estatus: "activo" as "activo" | "inactivo",
  })

  useEffect(() => {
    if (candidate) {
      setFormData({
        nombre: candidate.nombre,
        email: candidate.email,
        telefono: candidate.telefono || "",
        puesto: candidate.puesto,
        salarioDeseado: candidate.salarioDeseado || 0,
        etapa: candidate.etapa,
        estatus: candidate.estatus,
      })
    } else {
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        puesto: "",
        salarioDeseado: 0,
        etapa: "nuevo",
        estatus: "activo",
      })
    }
  }, [candidate, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      ...formData,
      fechaAplicacion: new Date().toISOString(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{candidate ? "Editar Candidato" : "Nuevo Candidato"}</DialogTitle>
          <DialogDescription>Registra un nuevo candidato en el proceso de reclutamiento.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="puesto">Puesto Solicitado</Label>
            <Input
              id="puesto"
              value={formData.puesto}
              onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="salarioDeseado">Salario Deseado</Label>
            <Input
              id="salarioDeseado"
              type="number"
              step="0.01"
              value={formData.salarioDeseado}
              onChange={(e) => setFormData({ ...formData, salarioDeseado: Number.parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="etapa">Etapa</Label>
              <Select value={formData.etapa} onValueChange={(value: any) => setFormData({ ...formData, etapa: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="entrevista">Entrevista</SelectItem>
                  <SelectItem value="prueba_tecnica">Prueba Técnica</SelectItem>
                  <SelectItem value="oferta">Oferta</SelectItem>
                  <SelectItem value="contratado">Contratado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estatus">Estatus</Label>
              <Select
                value={formData.estatus}
                onValueChange={(value: any) => setFormData({ ...formData, estatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
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
