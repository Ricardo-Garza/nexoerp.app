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
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import type { ProductAttribute, ProductCategory, AttributeValue } from "@/lib/types"

interface AttributeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: ProductAttribute | null
  categories: ProductCategory[]
  onSave: (data: Partial<ProductAttribute>) => Promise<void>
}

export function AttributeFormDialog({ open, onOpenChange, attribute, categories, onSave }: AttributeFormDialogProps) {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<ProductAttribute["tipo"]>("seleccion")
  const [descripcion, setDescripcion] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [valores, setValores] = useState<AttributeValue[]>([])
  const [newValue, setNewValue] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (attribute) {
      setNombre(attribute.nombre || "")
      setTipo(attribute.tipo || "seleccion")
      setDescripcion(attribute.descripcion || "")
      setCategoriaId(attribute.categoriaId || "")
      setValores(attribute.valores || [])
    } else {
      setNombre("")
      setTipo("seleccion")
      setDescripcion("")
      setCategoriaId("")
      setValores([])
    }
  }, [attribute, open])

  const addValue = () => {
    if (!newValue.trim()) return
    const value: AttributeValue = {
      id: Date.now().toString(),
      valor: newValue.trim(),
      orden: valores.length,
      activo: true,
    }
    setValores([...valores, value])
    setNewValue("")
  }

  const removeValue = (id: string) => {
    setValores(valores.filter((v) => v.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      alert("El nombre del atributo es requerido")
      return
    }

    setSaving(true)
    try {
      const categoria = categories.find((c) => c.id === categoriaId)
      await onSave({
        nombre: nombre.trim(),
        tipo,
        descripcion: descripcion.trim(),
        categoriaId: categoriaId || undefined,
        categoriaNombre: categoria?.nombre,
        valores: tipo === "seleccion" ? valores : [],
        activo: attribute?.activo ?? true,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving attribute:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{attribute ? "Editar Atributo" : "Nuevo Atributo"}</DialogTitle>
          <DialogDescription>
            {attribute
              ? "Modifique los datos del atributo existente"
              : "Configure un nuevo atributo para crear variantes de productos"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Atributo *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Color, Talla, Material"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as ProductAttribute["tipo"])}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="seleccion">Selección</option>
                <option value="numerico">Numérico</option>
                <option value="texto">Texto</option>
                <option value="booleano">Booleano</option>
                <option value="color">Color</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría (Opcional)</Label>
            <select
              id="categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del atributo"
            />
          </div>

          {tipo === "seleccion" && (
            <div className="space-y-2">
              <Label>Valores del Atributo</Label>
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addValue())}
                  placeholder="Agregar valor..."
                />
                <Button type="button" onClick={addValue} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {valores.map((value) => (
                  <Badge key={value.id} variant="secondary" className="pl-2 pr-1">
                    {value.valor}
                    <button
                      type="button"
                      onClick={() => removeValue(value.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : attribute ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
