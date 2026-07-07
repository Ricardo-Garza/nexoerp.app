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

export function MovementsTab({ warehouseData }: { warehouseData: any }) {
  const { stockMovements, warehouses, products, createMovement } = warehouseData
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    almacenId: "",
    productoId: "",
    tipo: "entrada" as "entrada" | "salida" | "ajuste",
    cantidad: 0,
    motivo: "",
    referencia: "",
    notas: "",
  })

  const rows = useMemo(() => stockMovements || [], [stockMovements])

  const handleOpenDialog = () => {
    setFormData({
      almacenId: "",
      productoId: "",
      tipo: "entrada",
      cantidad: 0,
      motivo: "",
      referencia: "",
      notas: "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const almacen = (warehouses || []).find((w: any) => w.id === formData.almacenId)
    const producto = (products || []).find((p: any) => p.id === formData.productoId)

    await createMovement({
      ...formData,
      almacenNombre: almacen?.nombre || "",
      productoNombre: producto?.name || producto?.producto || "",
      sku: producto?.sku || "",
      fecha: new Date().toISOString(),
      usuarioId: "current-user",
      usuarioNombre: "Usuario actual",
    })
    setIsDialogOpen(false)
  }

  const typeLabel = (type: string) =>
    type === "transferencia_salida"
      ? "Transferencia salida"
      : type === "transferencia_entrada"
        ? "Transferencia entrada"
        : type.charAt(0).toUpperCase() + type.slice(1)

  const columns = useMemo<ProColumn<any>[]>(
    () => [
      {
        key: "fecha",
        header: "Fecha",
        accessor: (m) => (m.fecha ? format(new Date(m.fecha), "yyyy-MM-dd HH:mm") : ""),
        cell: (m) => <span className="text-xs">{m.fecha ? format(new Date(m.fecha), "dd/MM/yyyy HH:mm") : "-"}</span>,
        filterType: "date",
      },
      {
        key: "tipo",
        header: "Tipo",
        accessor: (m) => typeLabel(m.tipo ?? ""),
        cell: (m) => <Badge variant={m.tipo === "salida" ? "outline" : "secondary"}>{typeLabel(m.tipo ?? "")}</Badge>,
        filterType: "select",
        filterOptions: [
          { label: "Entrada", value: "Entrada" },
          { label: "Salida", value: "Salida" },
          { label: "Ajuste", value: "Ajuste" },
          { label: "Transferencia salida", value: "Transferencia salida" },
          { label: "Transferencia entrada", value: "Transferencia entrada" },
        ],
      },
      { key: "sku", header: "SKU", accessor: (m) => m.sku ?? "", cell: (m) => <span className="font-mono text-xs">{m.sku || "-"}</span>, filterType: "text" },
      { key: "productoNombre", header: "Producto", accessor: (m) => m.productoNombre ?? "", filterType: "text" },
      { key: "almacenNombre", header: "Almacén", accessor: (m) => m.almacenNombre ?? "", filterType: "text" },
      {
        key: "cantidad",
        header: "Cantidad",
        accessor: (m) => m.cantidad ?? 0,
        cell: (m) => (
          <span className="font-mono text-sm">
            {m.tipo === "salida" || m.tipo === "transferencia_salida" ? "-" : "+"}
            {m.cantidad || 0}
          </span>
        ),
        numeric: true,
        align: "right",
        filterType: "number",
      },
      { key: "motivo", header: "Motivo", accessor: (m) => m.motivo ?? "", filterType: "text" },
      { key: "referencia", header: "Referencia", accessor: (m) => m.referencia ?? "", filterType: "text" },
      { key: "usuarioNombre", header: "Usuario", accessor: (m) => m.usuarioNombre ?? "", filterType: "text" },
    ],
    [],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos</CardTitle>
        <p className="text-sm text-muted-foreground">Entradas, salidas, ajustes y transferencias con usuario y fecha.</p>
      </CardHeader>
      <CardContent>
        <DataTablePro
          tableId="warehouse-movements"
          columns={columns}
          rows={rows}
          getRowId={(m) => String(m.id ?? `${m.productoId}-${m.fecha}`)}
          moduleName="Inventario y Almacén · Movimientos"
          quickFilters={[
            { label: "Entradas", predicate: (m) => m.tipo === "entrada" },
            { label: "Salidas", predicate: (m) => m.tipo === "salida" },
            { label: "Ajustes", predicate: (m) => m.tipo === "ajuste" },
            { label: "Últimos 30 días", predicate: (m) => Date.now() - new Date(m.fecha).getTime() <= 30 * 86400000 },
          ]}
          toolbarActions={
            <Button size="sm" onClick={handleOpenDialog}>
              <Plus className="mr-1 h-4 w-4" />
              Registrar movimiento
            </Button>
          }
          helpItems={[
            "Filtra por fecha, tipo, almacén, SKU o usuario.",
            "Cada movimiento conserva fecha, usuario, motivo y referencia.",
            "Exporta la vista actual para conciliación o revisión.",
          ]}
          importHref="/dashboard/import?entity=movimientos-inventario"
          emptyMessage="No hay movimientos registrados."
          emptyHint="Registra una entrada, salida o ajuste desde el botón superior."
          testId="warehouse-movements-table"
        />
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>Registra una entrada, salida o ajuste de inventario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de movimiento</Label>
              <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label>Producto</Label>
              <Select value={formData.productoId} onValueChange={(value) => setFormData({ ...formData, productoId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {(products || []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || p.producto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Referencia</Label>
                <Input value={formData.referencia} onChange={(e) => setFormData({ ...formData, referencia: e.target.value })} placeholder="Orden, factura..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} placeholder="Compra, venta, corrección..." />
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
            <Button onClick={handleSave}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
