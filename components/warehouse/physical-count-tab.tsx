"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { format } from "date-fns"

export function PhysicalCountTab({ warehouseData }: { warehouseData: any }) {
  const { physicalCounts, warehouses, createPhysicalCount, updatePhysicalCount } = warehouseData
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    almacenId: "",
    tipo: "ciclico" as "ciclico" | "anual" | "sorpresa",
    fechaConteo: new Date().toISOString().split("T")[0],
    notas: "",
  })

  const rows = useMemo(() => physicalCounts || [], [physicalCounts])

  const handleOpenDialog = () => {
    setFormData({
      almacenId: "",
      tipo: "ciclico",
      fechaConteo: new Date().toISOString().split("T")[0],
      notas: "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const almacen = (warehouses || []).find((w: any) => w.id === formData.almacenId)
    await createPhysicalCount({
      ...formData,
      almacenNombre: almacen?.nombre || "",
      folioConteo: `CNT-${Date.now()}`,
      estado: "en_progreso",
      iniciadoPor: "Usuario actual",
      conteos: [],
    })
    setIsDialogOpen(false)
  }

  const handleFinalize = async (countId: string) => {
    await updatePhysicalCount(countId, {
      estado: "finalizado",
      fechaFinalizacion: new Date().toISOString(),
      finalizadoPor: "Usuario actual",
    })
  }

  const statusLabel = (status: string) =>
    status === "en_progreso" ? "En progreso" : status.charAt(0).toUpperCase() + status.slice(1)

  const columns = useMemo<ProColumn<any>[]>(
    () => [
      {
        key: "folioConteo",
        header: "Folio",
        accessor: (c) => c.folioConteo ?? "",
        cell: (c) => <span className="font-medium">{c.folioConteo}</span>,
        filterType: "text",
      },
      { key: "almacenNombre", header: "Almacén", accessor: (c) => c.almacenNombre ?? "", filterType: "text" },
      {
        key: "tipo",
        header: "Tipo",
        accessor: (c) => c.tipo ?? "",
        cell: (c) => <span className="capitalize">{c.tipo}</span>,
        filterType: "select",
        filterOptions: [
          { label: "Cíclico", value: "ciclico" },
          { label: "Anual", value: "anual" },
          { label: "Sorpresa", value: "sorpresa" },
        ],
      },
      {
        key: "fechaConteo",
        header: "Fecha",
        accessor: (c) => (c.fechaConteo ? format(new Date(c.fechaConteo), "yyyy-MM-dd") : ""),
        cell: (c) => <span>{c.fechaConteo ? format(new Date(c.fechaConteo), "dd/MM/yyyy") : "-"}</span>,
        filterType: "date",
      },
      {
        key: "estado",
        header: "Estado",
        accessor: (c) => statusLabel(c.estado ?? ""),
        cell: (c) => <Badge variant={c.estado === "cancelado" ? "destructive" : "secondary"}>{statusLabel(c.estado ?? "")}</Badge>,
        filterType: "select",
        filterOptions: [
          { label: "En progreso", value: "En progreso" },
          { label: "Finalizado", value: "Finalizado" },
          { label: "Cancelado", value: "Cancelado" },
        ],
      },
      { key: "iniciadoPor", header: "Usuario", accessor: (c) => c.iniciadoPor ?? "", filterType: "text" },
      {
        key: "partidas",
        header: "Partidas",
        accessor: (c) => c.conteos?.length ?? 0,
        numeric: true,
        align: "right",
        filterType: "number",
      },
    ],
    [],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventario físico</CardTitle>
        <p className="text-sm text-muted-foreground">Conteos por almacén con responsable, fecha y estado.</p>
      </CardHeader>
      <CardContent>
        <DataTablePro
          tableId="warehouse-physical-counts"
          columns={columns}
          rows={rows}
          getRowId={(c) => String(c.id ?? c.folioConteo)}
          moduleName="Inventario y Almacén · Inventario físico"
          quickFilters={[
            { label: "En progreso", predicate: (c) => c.estado === "en_progreso" },
            { label: "Finalizados", predicate: (c) => c.estado === "finalizado" },
            { label: "Este mes", predicate: (c) => new Date(c.fechaConteo).getMonth() === new Date().getMonth() },
          ]}
          rowActions={(count) => (
            <div className="flex justify-end">
              {count.estado === "en_progreso" && (
                <Button size="sm" variant="outline" onClick={() => handleFinalize(count.id)}>
                  Finalizar
                </Button>
              )}
            </div>
          )}
          toolbarActions={
            <Button size="sm" onClick={handleOpenDialog}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo conteo
            </Button>
          }
          helpItems={[
            "Crea conteos por almacén y dales seguimiento hasta finalizarlos.",
            "Filtra por estado, fecha o usuario para revisar avances.",
            "Exporta conteos para revisión física o auditoría.",
          ]}
          emptyMessage="No hay conteos físicos registrados."
          emptyHint="Inicia un conteo con el botón Nuevo conteo."
          testId="physical-counts-table"
        />
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo conteo físico</DialogTitle>
            <DialogDescription>Inicia un conteo físico de inventario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Almacén</Label>
              <Select value={formData.almacenId} onValueChange={(value) => setFormData({ ...formData, almacenId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar almacén" />
                </SelectTrigger>
                <SelectContent>
                  {(warehouses || []).map((w: any) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de conteo</Label>
              <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ciclico">Cíclico</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="sorpresa">Sorpresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de conteo</Label>
              <Input type="date" value={formData.fechaConteo} onChange={(e) => setFormData({ ...formData, fechaConteo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} placeholder="Notas adicionales" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Iniciar conteo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
