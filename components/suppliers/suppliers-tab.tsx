"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Star, Trash2 } from "lucide-react"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import { useSuppliersData } from "@/hooks/use-suppliers-data"
import type { Supplier } from "@/lib/types"
import { SupplierFormDialog } from "./supplier-form-dialog"

export function SuppliersTab() {
  const { suppliers, loading, removeSupplier } = useSuppliersData()
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este proveedor?")) {
      try {
        await removeSupplier(id)
      } catch (error) {
        console.error("Error deleting supplier:", error)
        alert("Error al eliminar el proveedor")
      }
    }
  }

  const handleDialogClose = () => {
    setShowDialog(false)
    setEditingSupplier(null)
  }

  const columns = useMemo<ProColumn<Supplier>[]>(
    () => [
      {
        key: "nombre",
        header: "Proveedor",
        accessor: (supplier) => supplier.nombre ?? "",
        cell: (supplier) => (
          <div>
            <p className="font-medium">{supplier.nombre}</p>
            {supplier.razonSocial && <p className="text-xs text-muted-foreground">{supplier.razonSocial}</p>}
          </div>
        ),
        hideable: false,
      },
      {
        key: "rfc",
        header: "RFC",
        accessor: (supplier) => supplier.rfc ?? "",
      },
      {
        key: "contacto",
        header: "Contacto",
        accessor: (supplier) =>
          [supplier.contactoPrincipal, supplier.email, supplier.telefono].filter(Boolean).join(" · "),
        cell: (supplier) => (
          <div className="text-sm">
            {supplier.contactoPrincipal && <p>{supplier.contactoPrincipal}</p>}
            <p className="text-xs text-muted-foreground">
              {[supplier.email, supplier.telefono].filter(Boolean).join(" · ")}
            </p>
          </div>
        ),
      },
      {
        key: "estado",
        header: "Estado",
        accessor: (supplier) => (supplier.estadoProveedor === "activo" ? "Activo" : "Inactivo"),
        cell: (supplier) => (
          <Badge variant={supplier.estadoProveedor === "activo" ? "default" : "secondary"}>
            {supplier.estadoProveedor === "activo" ? "Activo" : "Inactivo"}
          </Badge>
        ),
        filterType: "select",
        filterOptions: [
          { label: "Activo", value: "Activo" },
          { label: "Inactivo", value: "Inactivo" },
        ],
      },
      {
        key: "rating",
        header: "Calificación",
        accessor: (supplier) => supplier.rating ?? 0,
        numeric: true,
        align: "center",
        cell: (supplier) => (
          <span className="inline-flex items-center gap-1">
            {(supplier.rating ?? 0).toFixed(1)}
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          </span>
        ),
        defaultVisible: false,
      },
      {
        key: "diasCredito",
        header: "Días de crédito",
        accessor: (supplier) => supplier.diasCredito ?? 0,
        numeric: true,
        align: "right",
        defaultVisible: false,
      },
      {
        key: "comprasTotales",
        header: "Compras totales",
        accessor: (supplier) => supplier.comprasTotales ?? 0,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "saldoPorPagar",
        header: "Por pagar",
        accessor: (supplier) => supplier.saldoPorPagar ?? 0,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
    ],
    [],
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando proveedores...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <DataTablePro
        tableId="suppliers"
        testId="suppliers-table"
        columns={columns}
        rows={suppliers || []}
        getRowId={(supplier) => supplier.id}
        onRowClick={handleEdit}
        moduleName="Proveedores"
        importHref="/dashboard/import"
        quickFilters={[
          { label: "Activos", predicate: (supplier) => supplier.estadoProveedor === "activo" },
          { label: "Con saldo por pagar", predicate: (supplier) => (supplier.saldoPorPagar ?? 0) > 0 },
        ]}
        helpItems={[
          "Crea un proveedor con el botón Nuevo Proveedor.",
          "Haz clic en una fila para editar los datos del proveedor.",
          "Usa Filtros para combinar estado, compras y saldo por pagar.",
          "El botón Totales muestra la suma de compras y saldos de lo visible.",
          "Importar permite cargar proveedores desde Excel o CSV con plantilla.",
        ]}
        emptyMessage="No hay proveedores registrados."
        emptyHint="Importa datos o crea el primer proveedor."
        rowActions={(supplier) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" title="Editar proveedor" onClick={() => handleEdit(supplier)}>
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Eliminar proveedor"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(supplier.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      />

      <SupplierFormDialog open={showDialog} onOpenChange={handleDialogClose} supplier={editingSupplier} />
    </>
  )
}
