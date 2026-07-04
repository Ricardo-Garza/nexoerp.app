"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Upload, Plus, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StockMovement } from "@/lib/types"

interface GoodsReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: string
  productName?: string
  warehouses: Array<{ id: string; nombre: string }>
  onSave: (receipt: Partial<StockMovement>) => Promise<void>
}

export function GoodsReceiptDialog({
  open,
  onOpenChange,
  productId,
  productName,
  warehouses,
  onSave,
}: GoodsReceiptDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<StockMovement>>({
    tipo: "recepcion_compra",
    cantidad: 0,
    motivo: "",
    lote: "",
    serie: "",
    numeroLote: "",
    ubicacion: "",
    pasillo: "",
    rack: "",
    nivel: "",
    responsableRecepcion: "",
    responsableVerificacion: "",
    paisOrigen: "",
    proveedorOrigen: "",
    documentoOrigen: "",
    certificaciones: [],
    inspeccionado: false,
    estadoInspeccion: "pendiente",
    notasInspeccion: "",
    notas: "",
    documentosAdjuntos: [],
    almacenId: "",
    almacenNombre: "",
  })

  const [fechaCaducidad, setFechaCaducidad] = useState<Date | undefined>()
  const [fechaFabricacion, setFechaFabricacion] = useState<Date | undefined>()
  const [newCertification, setNewCertification] = useState("")
  const [newDocument, setNewDocument] = useState({ nombre: "", url: "", tipo: "" })

  useEffect(() => {
    if (!formData.almacenId && warehouses.length > 0) {
      setFormData((prev) => ({
        ...prev,
        almacenId: warehouses[0].id,
        almacenNombre: warehouses[0].nombre,
      }))
    }
  }, [formData.almacenId, warehouses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.almacenId) {
      console.error("Warehouse required")
      return
    }
    setLoading(true)
    try {
      const receiptData: Partial<StockMovement> = {
        ...formData,
        productoId: productId,
        productoNombre: productName,
        fechaCaducidad: fechaCaducidad ? fechaCaducidad.toISOString() : null,
        fechaFabricacion: fechaFabricacion ? fechaFabricacion.toISOString() : null,
        fecha: new Date().toISOString(),
      }
      await onSave(receiptData)
      onOpenChange(false)
      // Reset form
      setFormData({
        tipo: "entrada",
        cantidad: 0,
        motivo: "",
        lote: "",
        serie: "",
        numeroLote: "",
        ubicacion: "",
        inspeccionado: false,
        certificaciones: [],
        documentosAdjuntos: [],
      })
      setFechaCaducidad(undefined)
      setFechaFabricacion(undefined)
    } catch (error) {
      console.error("Error saving receipt:", error)
    } finally {
      setLoading(false)
    }
  }

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData({
        ...formData,
        certificaciones: [...(formData.certificaciones || []), newCertification],
      })
      setNewCertification("")
    }
  }

  const removeCertification = (index: number) => {
    const updated = [...(formData.certificaciones || [])]
    updated.splice(index, 1)
    setFormData({ ...formData, certificaciones: updated })
  }

  const addDocument = () => {
    if (newDocument.nombre && newDocument.url) {
      setFormData({
        ...formData,
        documentosAdjuntos: [...(formData.documentosAdjuntos || []), newDocument],
      })
      setNewDocument({ nombre: "", url: "", tipo: "" })
    }
  }

  const removeDocument = (index: number) => {
    const updated = [...(formData.documentosAdjuntos || [])]
    updated.splice(index, 1)
    setFormData({ ...formData, documentosAdjuntos: updated })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recepcion de Inventario - Trazabilidad Avanzada</DialogTitle>
          {productName && <p className="text-sm text-muted-foreground mt-2">Producto: {productName}</p>}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basico</TabsTrigger>
              <TabsTrigger value="batch">Lote/Serie</TabsTrigger>
              <TabsTrigger value="location">Ubicacion</TabsTrigger>
              <TabsTrigger value="quality">Calidad</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Almacen</Label>
                  <Select
                    value={formData.almacenId || ""}
                    onValueChange={(value) => {
                      const selected = warehouses.find((warehouse) => warehouse.id === value)
                      setFormData({
                        ...formData,
                        almacenId: value,
                        almacenNombre: selected?.nombre || "",
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar almacen" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad Recibida *</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={formData.cantidad || 0}
                    onChange={(e) => setFormData({ ...formData, cantidad: Number.parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costo">Costo Unitario</Label>
                  <Input
                    id="costo"
                    type="number"
                    step="0.01"
                    value={formData.costo || 0}
                    onChange={(e) => setFormData({ ...formData, costo: Number.parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proveedorOrigen">Proveedor</Label>
                  <Input
                    id="proveedorOrigen"
                    value={formData.proveedorOrigen || ""}
                    onChange={(e) => setFormData({ ...formData, proveedorOrigen: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentoOrigen">Documento de Origen (Factura, OC, etc.)</Label>
                  <Input
                    id="documentoOrigen"
                    value={formData.documentoOrigen || ""}
                    onChange={(e) => setFormData({ ...formData, documentoOrigen: e.target.value })}
                    placeholder="FAC-123, OC-456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paisOrigen">Pais de Origen</Label>
                  <Input
                    id="paisOrigen"
                    value={formData.paisOrigen || ""}
                    onChange={(e) => setFormData({ ...formData, paisOrigen: e.target.value })}
                    placeholder="Mexico, China, USA, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsableRecepcion">Responsable de Recepcion</Label>
                  <Input
                    id="responsableRecepcion"
                    value={formData.responsableRecepcion || ""}
                    onChange={(e) => setFormData({ ...formData, responsableRecepcion: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo/Referencia *</Label>
                <Input
                  id="motivo"
                  value={formData.motivo || ""}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Compra, Devolucion, Ajuste, etc."
                  required
                />
              </div>
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Trazabilidad FIFO/FEFO</p>
                  <p>Complete esta informacion para garantizar trazabilidad completa del producto.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lote">Lote</Label>
                  <Input
                    id="lote"
                    value={formData.lote || ""}
                    onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                    placeholder="Lote del producto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroLote">Numero de Lote</Label>
                  <Input
                    id="numeroLote"
                    value={formData.numeroLote || ""}
                    onChange={(e) => setFormData({ ...formData, numeroLote: e.target.value })}
                    placeholder="Numero interno de lote"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serie">Serie</Label>
                  <Input
                    id="serie"
                    value={formData.serie || ""}
                    onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                    placeholder="Numero de serie (opcional)"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fecha de Fabricacion</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !fechaFabricacion && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaFabricacion ? format(fechaFabricacion, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={fechaFabricacion} onSelect={setFechaFabricacion} locale={es} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Caducidad</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !fechaCaducidad && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaCaducidad ? format(fechaCaducidad, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={fechaCaducidad} onSelect={setFechaCaducidad} locale={es} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certificaciones</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="ISO 9001, FDA, HACCP, etc."
                  />
                  <Button type="button" onClick={addCertification}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.certificaciones && formData.certificaciones.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.certificaciones.map((cert: any, index: any) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {cert}
                        <button type="button" onClick={() => removeCertification(index)} className="ml-1">
                          x
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicacion General</Label>
                  <Input
                    id="ubicacion"
                    value={formData.ubicacion || ""}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Ej: Almacen Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pasillo">Pasillo</Label>
                  <Input
                    id="pasillo"
                    value={formData.pasillo || ""}
                    onChange={(e) => setFormData({ ...formData, pasillo: e.target.value })}
                    placeholder="A, B, C..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rack">Rack</Label>
                  <Input
                    id="rack"
                    value={formData.rack || ""}
                    onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                    placeholder="01, 02, 03..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nivel">Nivel</Label>
                  <Input
                    id="nivel"
                    value={formData.nivel || ""}
                    onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ejemplo de ubicacion completa: Almacen Principal - Pasillo A - Rack 01 - Nivel 2
              </p>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    id="inspeccionado"
                    checked={formData.inspeccionado || false}
                    onChange={(e) => setFormData({ ...formData, inspeccionado: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="inspeccionado" className="cursor-pointer">
                    Producto inspeccionado
                  </Label>
                </div>

                {formData.inspeccionado && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="estadoInspeccion">Estado de Inspeccion</Label>
                      <Select
                        value={formData.estadoInspeccion || "pendiente"}
                        onValueChange={(value: "aprobado" | "rechazado" | "pendiente") =>
                          setFormData({ ...formData, estadoInspeccion: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="aprobado">Aprobado</SelectItem>
                          <SelectItem value="rechazado">Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responsableVerificacion">Responsable de Verificacion</Label>
                      <Input
                        id="responsableVerificacion"
                        value={formData.responsableVerificacion || ""}
                        onChange={(e) => setFormData({ ...formData, responsableVerificacion: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notasInspeccion">Notas de Inspeccion</Label>
                      <Textarea
                        id="notasInspeccion"
                        value={formData.notasInspeccion || ""}
                        onChange={(e) => setFormData({ ...formData, notasInspeccion: e.target.value })}
                        rows={4}
                        placeholder="Detalles de la inspeccion, observaciones, defectos encontrados, etc."
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Adjuntar Documento
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="docNombre">Nombre</Label>
                    <Input
                      id="docNombre"
                      value={newDocument.nombre}
                      onChange={(e) => setNewDocument({ ...newDocument, nombre: e.target.value })}
                      placeholder="Factura, Remision, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="docTipo">Tipo</Label>
                    <Input
                      id="docTipo"
                      value={newDocument.tipo}
                      onChange={(e) => setNewDocument({ ...newDocument, tipo: e.target.value })}
                      placeholder="PDF, IMG, XML"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="docUrl">URL</Label>
                    <Input
                      id="docUrl"
                      value={newDocument.url}
                      onChange={(e) => setNewDocument({ ...newDocument, url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <Button type="button" onClick={addDocument} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Documento
                </Button>
              </div>

              {formData.documentosAdjuntos && formData.documentosAdjuntos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Documentos Adjuntos</h3>
                  {formData.documentosAdjuntos.map((doc: any, index: any) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notas">Notas Adicionales</Label>
                <Textarea
                  id="notas"
                  value={formData.notas || ""}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={4}
                  placeholder="Observaciones generales sobre la recepcion..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Registrar Recepcion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
