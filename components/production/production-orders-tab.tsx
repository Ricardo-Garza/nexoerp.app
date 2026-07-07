"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Edit, Trash2, Play, CheckCircle } from "lucide-react"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import type { ProductionOrder, Product, ProductFormula, Warehouse } from "@/lib/types"
import { ProductionOrderDialog } from "./production-order-dialog"

interface ProductionOrdersTabProps {
  orders: ProductionOrder[]
  products: Product[]
  formulas: ProductFormula[]
  warehouses: Warehouse[]
  searchQuery: string
  statusFilter: string
  priorityFilter: string
  onCreate: (order: Omit<ProductionOrder, "id">) => Promise<ProductionOrder>
  onUpdate: (id: string, updates: Partial<ProductionOrder>) => Promise<ProductionOrder | null>
  onDelete: (id: string) => Promise<boolean>
  onReserveMaterials: (orderId: string) => Promise<any>
  onCompleteProduction: (orderId: string, produced: number, secondQuality: number, waste: number) => Promise<any>
}

export function ProductionOrdersTab({
  orders,
  products,
  formulas,
  warehouses,
  searchQuery,
  statusFilter,
  priorityFilter,
  onCreate,
  onUpdate,
  onDelete,
  onReserveMaterials,
  onCompleteProduction,
}: ProductionOrdersTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.folio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = !statusFilter || statusFilter === "Todos" || order.status === statusFilter
      const matchesPriority = !priorityFilter || priorityFilter === "Todas" || order.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [orders, searchQuery, statusFilter, priorityFilter])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "outline"
      case "in_process":
        return "default"
      case "on_hold":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "in_process":
        return "En Proceso"
      case "completed":
        return "Completado"
      case "on_hold":
        return "Pausado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const columns = useMemo<ProColumn<ProductionOrder>[]>(
    () => [
      {
        key: "folio",
        header: "Orden",
        accessor: (order) => order.folio,
        cell: (order) => <span className="font-medium">{order.folio}</span>,
        hideable: false,
      },
      {
        key: "productName",
        header: "Producto",
        accessor: (order) => order.productName,
        hideable: false,
      },
      {
        key: "quantity",
        header: "Planeado",
        accessor: (order) => order.quantity ?? 0,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "completed",
        header: "Producido",
        accessor: (order) => order.completed ?? 0,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "progress",
        header: "Progreso",
        accessor: (order) => (order.quantity ? Math.round(((order.completed ?? 0) / order.quantity) * 100) : 0),
        cell: (order) => {
          const percentage = order.quantity ? ((order.completed ?? 0) / order.quantity) * 100 : 0
          return (
            <div className="flex items-center gap-2">
              <Progress value={percentage} className="h-2 w-24" />
              <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
            </div>
          )
        },
      },
      {
        key: "status",
        header: "Estado",
        accessor: (order) => getStatusLabel(order.status),
        cell: (order) => <Badge variant={getStatusVariant(order.status)}>{getStatusLabel(order.status)}</Badge>,
        filterType: "select",
        filterOptions: ["Pendiente", "En Proceso", "Completado", "Pausado", "Cancelado"].map((label) => ({
          label,
          value: label,
        })),
      },
      {
        key: "warehouses",
        header: "Almacenes",
        accessor: (order) => `${order.almacenOrigenNombre ?? ""} → ${order.almacenDestinoNombre ?? ""}`,
        cell: (order) => (
          <div className="text-xs text-muted-foreground">
            <div>Origen: {order.almacenOrigenNombre}</div>
            <div>Destino: {order.almacenDestinoNombre}</div>
          </div>
        ),
        defaultVisible: false,
      },
    ],
    [],
  )

  const handleCreate = () => {
    setSelectedOrder(null)
    setDialogOpen(true)
  }

  const handleEdit = (order: ProductionOrder) => {
    setSelectedOrder(order)
    setDialogOpen(true)
  }

  const handleSave = async (data: Omit<ProductionOrder, "id">) => {
    if (selectedOrder) {
      await onUpdate(selectedOrder.id, data)
    } else {
      await onCreate(data)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro de eliminar esta orden?")) {
      await onDelete(id)
    }
  }

  const handleReserve = async (order: ProductionOrder) => {
    if (confirm(`¿Reservar materiales para ${order.folio}?`)) {
      try {
        await onReserveMaterials(order.id)
        alert("Materiales reservados exitosamente")
      } catch (error: any) {
        alert(error.message || "Error al reservar materiales")
      }
    }
  }

  const handleComplete = async (order: ProductionOrder) => {
    const produced = prompt(`Cantidad producida (planeado: ${order.quantity}):`)
    if (!produced) return

    const secondQuality = prompt("Cantidad de segunda calidad:", "0")
    const waste = prompt("Cantidad de merma/desperdicio:", "0")

    try {
      await onCompleteProduction(
        order.id,
        Number.parseFloat(produced),
        Number.parseFloat(secondQuality || "0"),
        Number.parseFloat(waste || "0"),
      )
      alert("Producción completada exitosamente")
    } catch (error: any) {
      alert(error.message || "Error al completar producción")
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Programación de Órdenes de Producción</CardTitle>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTablePro
            tableId="production-orders"
            testId="production-orders-table"
            columns={columns}
            rows={filteredOrders}
            getRowId={(order) => order.id}
            moduleName="Producción"
            importHref="/dashboard/import"
            quickFilters={[
              { label: "Pendientes", predicate: (order) => order.status === "pending" },
              { label: "En proceso", predicate: (order) => order.status === "in_process" },
              { label: "Completadas", predicate: (order) => order.status === "completed" },
            ]}
            helpItems={[
              "Crea una orden de producción con el botón Nueva Orden.",
              "Reserva materiales con el botón de reproducir cuando la orden está pendiente.",
              "Registra la producción terminada con el botón de palomita.",
              "Usa Filtros para combinar producto, estado y cantidades.",
              "Exportar descarga el programa de producción con los filtros aplicados.",
            ]}
            emptyMessage="No hay órdenes de producción."
            emptyHint="Crea la primera orden para programar la producción."
            rowActions={(order) => (
              <div className="flex items-center justify-end gap-1">
                {!order.materialsReserved && order.status === "pending" && (
                  <Button variant="ghost" size="sm" onClick={() => handleReserve(order)} title="Reservar materiales">
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                {order.materialsReserved && !order.materialsConsumed && order.status === "in_process" && (
                  <Button variant="ghost" size="sm" onClick={() => handleComplete(order)} title="Completar producción">
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleEdit(order)} title="Editar orden">
                  <Edit className="w-4 h-4" />
                </Button>
                {order.status === "pending" && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(order.id)} title="Eliminar orden">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <ProductionOrderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        order={selectedOrder}
        products={products}
        formulas={formulas}
        warehouses={warehouses}
      />
    </>
  )
}
