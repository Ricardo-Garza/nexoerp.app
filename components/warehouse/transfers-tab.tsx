"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { format } from "date-fns"

export function TransfersTab({ warehouseData }: { warehouseData: any }) {
  const { transfers, warehouses, products, createTransfer, updateTransfer } = warehouseData
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    almacenOrigenId: "",
    almacenDestinoId: "",
    productoId: "",
    cantidad: 0,
    motivo: "",
    notas: "",
  })

  const rows = useMemo<any[]>(() => transfers || [], [transfers])

  const handleOpenDialog = () => {
    setFormData({
      almacenOrigenId: "",
      almacenDestinoId: "",
      productoId: "",
      cantidad: 0,
      motivo: "",
      notas: "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const origenWarehouse = (warehouses || []).find((w: any) => w.id === formData.almacenOrigenId)
      const destinoWarehouse = (warehouses || []).find((w: any) => w.id === formData.almacenDestinoId)
      const producto = (products || []).find((p: any) => p.id === formData.productoId)

      await createTransfer({
        ...formData,
        almacenOrigenNombre: origenWarehouse?.nombre || "",
        almacenDestinoNombre: destinoWarehouse?.nombre || "",
        productoNombre: producto?.name || "",
        estado: "solicitada",
        folioTransferencia: `TRF-${Date.now()}`,
        fechaSolicitud: new Date().toISOString(),
        solicitadoPor: "Usuario Actual",
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating transfer:", error)
    }
  }

  const handleStatusChange = async (transferId: string, newStatus: string) => {
    try {
      const updateData: any = { estado: newStatus }
      if (newStatus === "aprobada") {
        updateData.fechaAprobacion = new Date().toISOString()
        updateData.aprobadoPor = "Usuario Actual"
      } else if (newStatus === "en_transito") {
        updateData.fechaEnvio = new Date().toISOString()
        updateData.enviadoPor = "Usuario Actual"
      } else if (newStatus === "completada") {
        updateData.fechaRecepcion = new Date().toISOString()
        updateData.recibidoPor = "Usuario Actual"
      }
      await updateTransfer(transferId, updateData)
    } catch (error) {
      console.error("Error updating transfer:", error)
    }
  }

  const statusLabel = (status: string) =>
    status === "en_transito" ? "En Tránsito" : status.charAt(0).toUpperCase() + status.slice(1)

  const getStatusBadge = (status: string) => {
    const variants: any = {
      solicitada: "secondary",
      aprobada: "default",
      en_transito: "default",
      completada: "default",
      cancelada: "destructive",
    }
    return <Badge variant={variants[status] || "secondary"}>{statusLabel(status)}</Badge>
  }

  const columns = useMemo<ProColumn<any>[]>(
    () => [
      {
        key: "folioTransferencia",
        header: "Folio",
        accessor: (t) => t.folioTransferencia ?? "",
        cell: (t) => <span className="font-medium">{t.folioTransferencia}</span>,
        filterType: "text",
      },
      { key: "almacenOrigenNombre", header: "Origen", accessor: (t) => t.almacenOrigenNombre ?? "", filterType: "text" },
      { key: "almacenDestinoNombre", header: "Destino", accessor: (t) => t.almacenDestinoNombre ?? "", filterType: "text" },
      { key: "productoNombre", header: "Producto", accessor: (t) => t.productoNombre ?? "", filterType: "text" },
      {
        key: "cantidad",
        header: "Cantidad",
        accessor: (t) => t.cantidad ?? 0,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "fechaSolicitud",
        header: "Fecha Solicitud",
        accessor: (t) => (t.fechaSolicitud ? format(new Date(t.fechaSolicitud), "yyyy-MM-dd") : ""),
        cell: (t) => <span>{t.fechaSolicitud ? format(new Date(t.fechaSolicitud), "dd/MM/yyyy") : "-"}</span>,
        filterType: "date",
      },
      {
        key: "estado",
        header: "Estado",
        accessor: (t) => statusLabel(t.estado ?? ""),
        cell: (t) => getStatusBadge(t.estado),
        filterType: "select",
        filterOptions: [
          { label: "Solicitada", value: "Solicitada" },
          { label: "Aprobada", value: "Aprobada" },
          { label: "En Tránsito", value: "En Tránsito" },
          { label: "Completada", value: "Completada" },
          { label: "Cancelada", value: "Cancelada" },
        ],
      },
    ],
    [],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transferencias entre Almacenes</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Pendientes: {warehouseData.transferenciasPendientes || 0} · En tránsito:{" "}
          {warehouseData.transferenciasEnTransito || 0}
        </p>
      </CardHeader>
      <CardContent>
        <DataTablePro
          tableId="warehouse-transfers"
          columns={columns}
          rows={rows}
          getRowId={(t) => String(t.id ?? t.folioTransferencia)}
          moduleName="Inventario y Almacén · Transferencias"
          quickFilters={[
            { label: "Solicitadas", predicate: (t) => t.estado === "solicitada" },
            { label: "En tránsito", predicate: (t) => t.estado === "en_transito" },
            { label: "Completadas", predicate: (t) => t.estado === "completada" },
          ]}
          rowActions={(transfer) => (
            <div className="flex justify-end">
              {transfer.estado === "solicitada" && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(transfer.id, "aprobada")}>
                  Aprobar
                </Button>
              )}
              {transfer.estado === "aprobada" && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(transfer.id, "en_transito")}>
                  Enviar
                </Button>
              )}
              {transfer.estado === "en_transito" && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(transfer.id, "completada")}>
                  Recibir
                </Button>
              )}
            </div>
          )}
          toolbarActions={
            <Button size="sm" onClick={handleOpenDialog}>
              <Plus className="w-4 h-4 mr-1" /> Nueva transferencia
            </Button>
          }
          helpItems={[
            "Busca por folio, almacén origen o destino.",
            "Filtra por estado y ordena por fecha o cantidad.",
            "Aprueba, envía o recibe transferencias desde las acciones de cada fila.",
            "Exporta la vista actual respetando filtros y columnas.",
          ]}
          emptyMessage="No hay transferencias registradas."
          emptyHint="Crea una con el botón Nueva transferencia."
          testId="transfers-table"
        />
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Transferencia</DialogTitle>
            <DialogDescription>Solicita una transferencia entre almacenes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Almacén Origen</Label>
              <Select
                value={formData.almacenOrigenId}
                onValueChange={(value) => setFormData({ ...formData, almacenOrigenId: value })}
              >
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
              <Label>Almacén Destino</Label>
              <Select
                value={formData.almacenDestinoId}
                onValueChange={(value) => setFormData({ ...formData, almacenDestinoId: value })}
              >
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
              <Select
                value={formData.productoId}
                onValueChange={(value) => setFormData({ ...formData, productoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {(products || []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Reabastecimiento"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Crear Transferencia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
