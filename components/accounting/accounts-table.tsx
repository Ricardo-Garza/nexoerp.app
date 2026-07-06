"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import type { LedgerAccount } from "@/lib/types"

interface AccountsTableProps {
  ledgerAccounts: LedgerAccount[]
  loading: boolean
  formatCurrency: (value: number) => string
  onNuevaCuenta: () => void
}

export function AccountsTable({ ledgerAccounts, loading, formatCurrency, onNuevaCuenta }: AccountsTableProps) {
  const columns = useMemo<ProColumn<LedgerAccount>[]>(
    () => [
      {
        key: "codigo",
        header: "Código",
        accessor: (account) => account.codigo,
        cell: (account) => <span className="font-mono font-medium">{account.codigo}</span>,
        hideable: false,
      },
      {
        key: "nombre",
        header: "Nombre",
        accessor: (account) => account.nombre,
        cell: (account) => (
          <span
            className={(account.nivel || 1) === 1 ? "font-bold" : (account.nivel || 1) === 2 ? "font-semibold" : ""}
            style={{ paddingLeft: `${((account.nivel || 1) - 1) * 12}px` }}
          >
            {account.nombre}
          </span>
        ),
        hideable: false,
      },
      {
        key: "tipo",
        header: "Tipo",
        accessor: (account) => account.tipo,
        cell: (account) => <Badge variant="outline">{account.tipo}</Badge>,
        filterType: "select",
        filterOptions: ["Activo", "Pasivo", "Capital", "Ingresos", "Egresos", "Costos"].map((tipo) => ({
          label: tipo,
          value: tipo,
        })),
      },
      {
        key: "naturaleza",
        header: "Naturaleza",
        accessor: (account) => (account.naturaleza === "deudora" ? "Deudora" : "Acreedora"),
        filterType: "select",
        filterOptions: [
          { label: "Deudora", value: "Deudora" },
          { label: "Acreedora", value: "Acreedora" },
        ],
        defaultVisible: false,
      },
      {
        key: "saldo",
        header: "Saldo",
        accessor: (account) => account.saldo ?? 0,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
        cell: (account) => <span className="font-semibold">{formatCurrency(account.saldo || 0)}</span>,
      },
      {
        key: "movimientos",
        header: "Movimientos",
        accessor: (account) => account.movimientos ?? 0,
        numeric: true,
        align: "center",
      },
    ],
    [formatCurrency],
  )

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Cargando cuentas...</div>
  }

  return (
    <DataTablePro
      tableId="accounting-accounts"
      testId="accounting-accounts-table"
      columns={columns}
      rows={ledgerAccounts || []}
      getRowId={(account) => account.id}
      moduleName="Contabilidad"
      importHref="/dashboard/import"
      quickFilters={[
        { label: "Activo", predicate: (account) => account.tipo === "Activo" },
        { label: "Pasivo", predicate: (account) => account.tipo === "Pasivo" },
        { label: "Resultados", predicate: (account) => ["Ingresos", "Egresos", "Costos"].includes(account.tipo) },
        { label: "Con movimientos", predicate: (account) => (account.movimientos ?? 0) > 0 },
      ]}
      helpItems={[
        "Crea cuentas con el botón Nueva Cuenta siguiendo tu catálogo contable.",
        "Para cargar el catálogo completo usa Importar: descarga la plantilla, llénala con código, nombre y tipo, y súbela.",
        "Usa Filtros para ver solo un tipo de cuenta o cuentas con saldo.",
        "El botón Totales suma el saldo de las cuentas visibles.",
        "Exportar descarga el catálogo con los filtros aplicados.",
      ]}
      emptyMessage="Aún no hay cuentas registradas."
      emptyHint="Importa tu catálogo de cuentas o crea la primera cuenta contable."
      toolbarActions={
        <Button size="sm" onClick={onNuevaCuenta}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva Cuenta
        </Button>
      }
    />
  )
}
