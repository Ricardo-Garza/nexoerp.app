"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
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
import { Plus, MapPin, Pencil, Trash2 } from "lucide-react"
import type { Warehouse } from "@/lib/types"

export function WarehousesTab({ warehouseData }: { warehouseData: any }) {
  const { warehouses, almacenesEstadisticas, createWarehouse, updateWarehouse, removeWarehouse, loading } =
    warehouseData
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

  const rows = useMemo<any[]>(() => almacenesEstadisticas || [], [almacenesEstadisticas])

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

  const columns = useMemo<ProColumn<any>[]>(
    () => [
      {
        key: "codigo",
        header: "Código",
        accessor: (w) => w.codigo ?? "",
        cell: (w) => <span className="font-medium">{w.codigo}</span>,
        filterType: "text",
      },
      { key: "nombre", header: "Nombre", accessor: (w) => w.nombre ?? "", filterType: "text" },
      {
        key: "ubicacion",
        header: "Ubicación",
        accessor: (w) => w.ubicacion ?? "",
        cell: (w) => (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            {w.ubicacion}
          </div>
        ),
        filterType: "text",
      },
      {
        key: "tipo",
        header: "Tipo",
        accessor: (w) => w.tipo ?? "",
        cell: (w) => <span className="capitalize">{w.tipo}</span>,
        filterType: "select",
        filterOptions: [
          { label: "Principal", value: "principal" },
          { label: "Sucursal", value: "sucursal" },
          { label: "Consignación", value: "consignacion" },
          { label: "Tránsito", value: "transito" },
        ],
      },
      {
        key: "productosCantidad",
        header: "Productos",
        accessor: (w) => w.productosCantidad || 0,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "valorInventario",
        header: "Valor Inventario",
        accessor: (w) => w.valorInventario || 0,
        cell: (w) => <span>${(w.valorInventario || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "estado",
        header: "Estado",
        accessor: (w) => w.estado ?? "",
        cell: (w) => <Badge variant={w.estado === "activo" ? "default" : "secondary"}>{w.estado}</Badge>,
        filterType: "select",
        filterOptions: [
          { label: "Activo", value: "activo" },
          { label: "Inactivo", value: "inactivo" },
        ],
      },
    ],
    [],
  )

  return (
    <Card>
      <CardContent className="pt-6">
        {loading && warehouses.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Cargando almacenes...</p>
            </div>
          </div>
        ) : (
          <DataTablePro
            tableId="warehouse-warehouses"
            columns={columns}
            rows={rows}
            getRowId={(w) => String(w.id ?? w.codigo)}
            moduleName="Inventario y Almacén · Almacenes"
            quickFilters={[
              { label: "Activos", predicate: (w) => w.estado === "activo" },
              { label: "Con productos", predicate: (w) => (w.productosCantidad || 0) > 0 },
            ]}
            rowActions={(w) => (
              <div className="flex items-center gap-1 justify-end">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(w)} title="Editar almacén">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(w.id)} title="Eliminar almacén">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            )}
            toolbarActions={
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-1" /> Nuevo almacén
              </Button>
            }
            helpItems={[
              "Busca por código, nombre o ubicación con la barra de búsqueda.",
              "Filtra por tipo o estado, ordena por valor de inventario y exporta la vista.",
              "Usa Totales para sumar productos y valor de inventario de lo que estás viendo.",
              "Crea o edita almacenes con el botón Nuevo almacén y el lápiz de cada fila.",
            ]}
            emptyMessage="No hay almacenes registrados."
            emptyHint="Crea el primer almacén con el botón Nuevo almacén."
            testId="warehouses-table"
          />
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Editar almacén" : "Nuevo almacén"}</DialogTitle>
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
                placeholder="Almacén principal"
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
