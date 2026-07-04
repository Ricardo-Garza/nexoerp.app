"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, MapPin, Building2, Pencil, Trash2 } from "lucide-react"
import type { Warehouse } from "@/lib/types"

export function WarehousesTab({ warehouseData }: { warehouseData: any }) {
  const { warehouses, almacenesEstadisticas, createWarehouse, updateWarehouse, removeWarehouse, loading } =
    warehouseData
  const [searchTerm, setSearchTerm] = useState<any>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)

  const [formData, setFormData] = useState<any>({
    codigo: "",
    nombre: "",
    ubicacion: "",
    tipo: "principal" as "principal" | "sucursal" | "consignacion" | "transito",
    estado: "activo" as "activo" | "inactivo",
    capacidadMaxima: 0,
    direccion: "",
    responsable: "",
    telefono: "",
    email: "",
  })

  const filteredWarehouses = (almacenesEstadisticas || []).filter(
    (w: any) =>
      w.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse)
      setFormData({
        codigo: warehouse.codigo || "",
        nombre: warehouse.nombre || "",
        ubicacion: warehouse.ubicacion || "",
        tipo: warehouse.tipo || "principal",
        estado: warehouse.estado || "activo",
        capacidadMaxima: warehouse.capacidadMaxima || 0,
        direccion: warehouse.direccion || "",
        responsable: warehouse.responsable || "",
        telefono: warehouse.telefono || "",
        email: warehouse.email || "",
      })
    } else {
      setEditingWarehouse(null)
      setFormData({
        codigo: "",
        nombre: "",
        ubicacion: "",
        tipo: "principal",
        estado: "activo",
        capacidadMaxima: 0,
        direccion: "",
        responsable: "",
        telefono: "",
        email: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.nombre || formData.nombre.trim() === "") {
        alert("El nombre del almacen es obligatorio")
        return
      }
      if (!formData.codigo || formData.codigo.trim() === "") {
        alert("El codigo del almacen es obligatorio")
        return
      }
      if (!formData.ubicacion || formData.ubicacion.trim() === "") {
        alert("La ubicacion del almacen es obligatoria")
        return
      }

      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, formData)
      } else {
        await createWarehouse({
          ...formData,
          fechaCreacion: new Date().toISOString(),
        })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving warehouse:", error)
      alert(error instanceof Error ? error.message : "Error al guardar el almacen")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Estas seguro de eliminar este almacen?")) {
      try {
        await removeWarehouse(id)
      } catch (error) {
        console.error("Error deleting warehouse:", error)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Catalogo de Almacenes</CardTitle>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Almacen
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar almacenes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && warehouses.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Cargando almacenes...</p>
            </div>
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {warehouses.length === 0 ? "No hay almacenes registrados" : "No se encontraron almacenes"}
            </p>
            {warehouses.length === 0 && (
              <Button onClick={() => handleOpenDialog()} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear primer almacen
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Ubicacion</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Valor Inventario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWarehouses.map((warehouse: any) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">{warehouse.codigo}</TableCell>
                  <TableCell>{warehouse.nombre}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {warehouse.ubicacion}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{warehouse.tipo}</TableCell>
                  <TableCell>{warehouse.productosCantidad || 0}</TableCell>
                  <TableCell>
                    ${(warehouse.valorInventario || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={warehouse.estado === "activo" ? "default" : "secondary"}>{warehouse.estado}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(warehouse)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(warehouse.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Editar Almacen" : "Nuevo Almacen"}</DialogTitle>
            <DialogDescription>
              {editingWarehouse ? "Actualiza la informacion del almacen" : "Registra un nuevo almacen"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Codigo *</Label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="ALM-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Almacen Principal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ubicacion *</Label>
              <Input
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="CDMX"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="sucursal">Sucursal</SelectItem>
                  <SelectItem value="consignacion">Consignacion</SelectItem>
                  <SelectItem value="transito">Transito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
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
            <div className="space-y-2">
              <Label>Capacidad Maxima</Label>
              <Input
                type="number"
                value={formData.capacidadMaxima}
                onChange={(e) => setFormData({ ...formData, capacidadMaxima: Number(e.target.value) })}
                placeholder="10000"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Direccion</Label>
              <Input
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle Principal #123"
              />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder="Juan Perez"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="555-1234"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="almacen@empresa.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
