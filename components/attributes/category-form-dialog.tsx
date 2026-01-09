"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProductCategory } from "@/lib/types"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: ProductCategory | null
  onSave: (data: Partial<ProductCategory>) => Promise<void>
}

export function CategoryFormDialog({ open, onOpenChange, category, onSave }: CategoryFormDialogProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (category) {
      setNombre(category.nombre || "")
      setDescripcion(category.descripcion || "")
    } else {
      setNombre("")
      setDescripcion("")
    }
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      alert("El nombre de la categoría es requerido")
      return
    }

    setSaving(true)
    try {
      await onSave({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        activo: category?.activo ?? true,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving category:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Modifique los datos de la categoría existente"
              : "Cree una nueva categoría para organizar atributos"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Ropa, Electrónica, Hogar"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la categoría"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : category ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
