"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Star, Plus, Trash2, Package } from "lucide-react"
import type { ServiceTicket, Customer, ReturnLine, SalesOrder, Warehouse, Product } from "@/lib/types"
import { Timestamp } from "firebase/firestore"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS, addItem } from "@/lib/firestore"
import { orderBy } from "firebase/firestore"
import type { StockMovement } from "@/lib/types"

interface TicketDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: ServiceTicket
  onUpdate: (id: string, updates: Partial<ServiceTicket>) => Promise<void>
  customers: Customer[]
}

export function TicketDetailDialog({ open, onOpenChange, ticket, onUpdate }: TicketDetailDialogProps) {
  const [estado, setEstado] = useState(ticket.estado)
  const [nota, setNota] = useState("")
  const [calificacion, setCalificacion] = useState(ticket.calificacion || 0)
  const [comentario, setComentario] = useState(ticket.comentarioCliente || "")
  const [loading, setLoading] = useState(false)

  const [showReturnSection, setShowReturnSection] = useState(false)
  const [ordenVentaId, setOrdenVentaId] = useState(ticket.ordenVentaId || "")
  const [almacenId, setAlmacenId] = useState(ticket.almacenDevolucionId || "")
  const [returnLines, setReturnLines] = useState<ReturnLine[]>(ticket.lineasDevolucion || [])

  const { items: salesOrders } = useFirestore<SalesOrder>(COLLECTIONS.salesOrders, [orderBy("folio", "desc")], true)
  const { items: warehouses } = useFirestore<Warehouse>(COLLECTIONS.warehouses, [orderBy("nombre", "asc")], true)
  const { items: products } = useFirestore<Product>(COLLECTIONS.products, [orderBy("name", "asc")], true)

  useEffect(() => {
    if (ticket.categoria === "devolucion" || ticket.categoria === "producto_danado") {
      setShowReturnSection(true)
    }
  }, [ticket.categoria])

  const handleUpdateEstado = async () => {
    setLoading(true)
    try {
      const updates: Partial<ServiceTicket> = {
        estado,
        fechaUltimaActualizacion: Timestamp.fromDate(new Date()),
      }

      if (estado === "resuelto" || estado === "cerrado") {
        const now = new Date()
        const createdAt =
          ticket.fechaCreacion instanceof Date ? ticket.fechaCreacion : (ticket.fechaCreacion as any).toDate()
        const minutesToResolve = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))

        updates.fechaResolucion = Timestamp.fromDate(now)
        updates.tiempoResolucion = minutesToResolve
      }

      if (nota) {
        const newNote = {
          id: crypto.randomUUID(),
          fecha: Timestamp.fromDate(new Date()),
          autor: "Usuario",
          contenido: nota,
          interno: true,
        }
        updates.notasInternas = [...(ticket.notasInternas || []), newNote]
      }

      await onUpdate(ticket.id, updates)
      setNota("")
      alert("Ticket actualizado correctamente")
    } catch (error) {
      console.error("Error updating ticket:", error)
      alert("Error al actualizar el ticket")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRating = async () => {
    if (calificacion === 0) {
      alert("Por favor selecciona una calificación")
      return
    }

    setLoading(true)
    try {
      await onUpdate(ticket.id, {
        calificacion,
        comentarioCliente: comentario,
        fechaUltimaActualizacion: Timestamp.fromDate(new Date()),
      })
      alert("Calificación registrada correctamente")
    } catch (error) {
      console.error("Error saving rating:", error)
      alert("Error al guardar la calificación")
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReturn = async () => {
    if (!ordenVentaId || !almacenId || returnLines.length === 0) {
      alert("Debes seleccionar una orden de venta, almacén y al menos una línea de devolución")
      return
    }

    setLoading(true)
    try {
      const selectedOrder = salesOrders?.find((o) => o.id === ordenVentaId)
      const selectedWarehouse = warehouses?.find((w) => w.id === almacenId)

      if (!selectedOrder || !selectedWarehouse) {
        throw new Error("Orden de venta o almacén no encontrado")
      }

      const movementIds: string[] = []

      for (const line of returnLines) {
        const movement: Omit<StockMovement, "id"> = {
          folio: `DEV-${ticket.numero}`,
          almacenId: selectedWarehouse.id,
          almacenNombre: selectedWarehouse.nombre,
          productoId: line.productoId,
          productoNombre: line.productoNombre,
          sku: line.sku,
          tipo: "devolucion_venta",
          unidadBase: products?.find((p) => p.id === line.productoId)?.baseUnit || "PZA",
          cantidad: line.cantidad,
          cantidadAnterior: 0, // Will be calculated from ledger
          cantidadNueva: line.cantidad,
          costoUnitario: 0, // Use average cost from inventory
          costoTotal: 0,
          fecha: Timestamp.now(),
          referencia: `Devolución de venta ${selectedOrder.folio} - Ticket ${ticket.numero}`,
          clienteId: ticket.clienteId || null,
          clienteNombre: ticket.clienteNombre,
          ordenVentaId: selectedOrder.id,
          ordenVentaFolio: selectedOrder.folio,
          remisionId: ticket.remisionId || null,
          remisionFolio: ticket.remisionFolio || null,
          facturaId: ticket.facturaId || null,
          facturaFolio: ticket.facturaFolio || null,
          lote: line.lote || null,
          serie: line.serie || null,
          fechaCaducidad: null,
          usuarioId: "sistema",
          usuarioNombre: "Sistema",
          motivo: `Devolución: ${line.motivo} - Disposición: ${line.estadoDisposicion}`,
          notas: line.notas || undefined,
          companyId: ticket.companyId,
          userId: ticket.userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }

        const createdMovement = await addItem(COLLECTIONS.stockMovements, movement)
        movementIds.push(createdMovement.id)
      }

      await onUpdate(ticket.id, {
        ordenVentaId: selectedOrder.id,
        ordenVentaFolio: selectedOrder.folio,
        lineasDevolucion: returnLines,
        almacenDevolucionId: selectedWarehouse.id,
        almacenDevolucionNombre: selectedWarehouse.nombre,
        estadoDevolucion: "procesada",
        movimientosInventarioIds: movementIds,
        fechaUltimaActualizacion: Timestamp.now(),
      })

      alert("Devolución aprobada y procesada correctamente")
      onOpenChange(false)
    } catch (error) {
      console.error("Error processing return:", error)
      alert("Error al procesar la devolución")
    } finally {
      setLoading(false)
    }
  }

  const addReturnLine = () => {
    setReturnLines([
      ...returnLines,
      {
        id: crypto.randomUUID(),
        productoId: "",
        productoNombre: "",
        sku: "",
        cantidad: 1,
        lote: null,
        serie: null,
        motivo: "",
        estadoDisposicion: "reingreso_stock",
        evidenciaUrl: undefined,
        notas: undefined,
      },
    ])
  }

  const updateReturnLine = (id: string, field: string, value: any) => {
    setReturnLines(
      returnLines.map((line) => {
        if (line.id === id) {
          if (field === "productoId") {
            const product = products?.find((p) => p.id === value)
            if (product) {
              return {
                ...line,
                productoId: product.id,
                productoNombre: product.name,
                sku: product.sku,
              }
            }
          }
          return { ...line, [field]: value }
        }
        return line
      }),
    )
  }

  const removeReturnLine = (id: string) => {
    setReturnLines(returnLines.filter((line) => line.id !== id))
  }

  const formatDate = (date: any) => {
    if (!date) return "-"
    const d = date instanceof Date ? date : date.toDate()
    return d.toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Ticket - {ticket.numero}</DialogTitle>
          <DialogDescription>
            Gestiona el estado del ticket, agrega notas internas y procesa devoluciones si aplica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Cliente</Label>
              <p className="font-medium">{ticket.clienteNombre}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Canal</Label>
              <p className="font-medium capitalize">{ticket.canal}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Categoría</Label>
              <p className="font-medium">{ticket.categoria.replace("_", " ")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Prioridad</Label>
              <Badge>{ticket.prioridad}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Fecha Creación</Label>
              <p className="text-sm">{formatDate(ticket.fechaCreacion)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Última Actualización</Label>
              <p className="text-sm">{formatDate(ticket.fechaUltimaActualizacion)}</p>
            </div>
          </div>

          {/* Subject and Description */}
          <div>
            <Label className="text-muted-foreground">Asunto</Label>
            <p className="font-medium">{ticket.asunto}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Descripción</Label>
            <p className="text-sm whitespace-pre-wrap">{ticket.descripcion}</p>
          </div>

          {showReturnSection && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Gestión de Devolución</h3>
                {ticket.estadoDevolucion && (
                  <Badge variant={ticket.estadoDevolucion === "procesada" ? "outline" : "default"}>
                    {ticket.estadoDevolucion}
                  </Badge>
                )}
              </div>

              {ticket.estadoDevolucion !== "procesada" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salesOrder">Orden de Venta</Label>
                      <Select value={ordenVentaId} onValueChange={setOrdenVentaId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar orden" />
                        </SelectTrigger>
                        <SelectContent>
                          {salesOrders?.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.folio} - {order.customerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warehouse">Almacén de Devolución</Label>
                      <Select value={almacenId} onValueChange={setAlmacenId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar almacén" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses?.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Líneas de Devolución</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addReturnLine}>
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar Línea
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {returnLines.map((line) => (
                        <div key={line.id} className="border rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-2">
                              <Label className="text-xs">Producto</Label>
                              <Select
                                value={line.productoId}
                                onValueChange={(value) => updateReturnLine(line.id, "productoId", value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products?.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.sku} - {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Cantidad</Label>
                              <Input
                                type="number"
                                value={line.cantidad}
                                onChange={(e) => updateReturnLine(line.id, "cantidad", Number(e.target.value))}
                                className="h-8"
                                min="1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Disposición</Label>
                              <Select
                                value={line.estadoDisposicion}
                                onValueChange={(value) => updateReturnLine(line.id, "estadoDisposicion", value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="reingreso_stock">Reingreso a Stock</SelectItem>
                                  <SelectItem value="cuarentena">Cuarentena</SelectItem>
                                  <SelectItem value="scrap">Scrap/Baja</SelectItem>
                                  <SelectItem value="reparacion">Reparación</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Lote (opcional)</Label>
                              <Input
                                value={line.lote || ""}
                                onChange={(e) => updateReturnLine(line.id, "lote", e.target.value || null)}
                                className="h-8"
                                placeholder="Lote"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Motivo</Label>
                              <Input
                                value={line.motivo}
                                onChange={(e) => updateReturnLine(line.id, "motivo", e.target.value)}
                                className="h-8"
                                placeholder="Motivo de la devolución"
                              />
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeReturnLine(line.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleApproveReturn} disabled={loading || !ordenVentaId || !almacenId}>
                    {loading ? "Procesando..." : "Aprobar y Procesar Devolución"}
                  </Button>
                </>
              )}

              {ticket.estadoDevolucion === "procesada" && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <strong>Orden de Venta:</strong> {ticket.ordenVentaFolio}
                  </p>
                  <p className="text-sm">
                    <strong>Almacén:</strong> {ticket.almacenDevolucionNombre}
                  </p>
                  <p className="text-sm">
                    <strong>Líneas devueltas:</strong> {ticket.lineasDevolucion?.length || 0}
                  </p>
                  <p className="text-sm">
                    <strong>Movimientos de inventario:</strong> {ticket.movimientosInventarioIds?.length || 0}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* State Management */}
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado del Ticket</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v as typeof estado)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abierto">Abierto</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="en_espera">En Espera</SelectItem>
                    <SelectItem value="resuelto">Resuelto</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nota">Agregar Nota Interna</Label>
              <Textarea
                id="nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Escribe una nota interna sobre el ticket..."
                rows={3}
              />
            </div>

            <Button onClick={handleUpdateEstado} disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar Ticket"}
            </Button>
          </div>

          {/* Rating Section */}
          {(ticket.estado === "resuelto" || ticket.estado === "cerrado") && (
            <div className="border-t pt-4 space-y-4">
              <Label>Calificación del Cliente</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setCalificacion(rating)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating <= calificacion ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comentario">Comentario del Cliente</Label>
                <Textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentario opcional del cliente..."
                  rows={2}
                />
              </div>
              <Button onClick={handleSubmitRating} disabled={loading || calificacion === 0}>
                {loading ? "Guardando..." : "Guardar Calificación"}
              </Button>
            </div>
          )}

          {/* Internal Notes History */}
          {ticket.notasInternas && ticket.notasInternas.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground mb-2 block">Notas Internas</Label>
              <div className="space-y-2">
                {ticket.notasInternas.map((note) => (
                  <div key={note.id} className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium">{note.autor}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(note.fecha)}</span>
                    </div>
                    <p className="text-sm">{note.contenido}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
