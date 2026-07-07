"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import { useBankingData } from "@/hooks/use-banking-data"
import type { BankTransaction } from "@/lib/types"

function toIsoDate(date: unknown): string {
  if (!date) return ""
  try {
    const d =
      typeof date === "object" && date !== null && "toDate" in date
        ? (date as { toDate: () => Date }).toDate()
        : new Date(date as string)
    return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : ""
  } catch {
    return ""
  }
}

const TIPO_LABELS: Record<string, string> = {
  ingreso: "Ingreso",
  egreso: "Egreso",
  transferencia: "Transferencia",
}

export function MovementsTab() {
  const { accounts, transactions, loading } = useBankingData()

  const accountName = useMemo(() => {
    const byId = new Map(accounts.map((account) => [account.id, account.alias || account.banco || account.id]))
    return (id: string) => byId.get(id) ?? id
  }, [accounts])

  const columns = useMemo<ProColumn<BankTransaction>[]>(
    () => [
      {
        key: "fecha",
        header: "Fecha",
        accessor: (trx) => toIsoDate(trx.fecha),
        filterType: "date",
        hideable: false,
      },
      {
        key: "concepto",
        header: "Concepto",
        accessor: (trx) => trx.concepto ?? "",
        hideable: false,
      },
      {
        key: "referencia",
        header: "Referencia",
        accessor: (trx) => trx.referencia ?? "",
        defaultVisible: false,
      },
      {
        key: "cuenta",
        header: "Cuenta",
        accessor: (trx) => accountName(trx.cuentaId),
      },
      {
        key: "categoria",
        header: "Categoría",
        accessor: (trx) => trx.categoria ?? "",
        defaultVisible: false,
      },
      {
        key: "tipo",
        header: "Tipo",
        accessor: (trx) => TIPO_LABELS[trx.tipo] ?? trx.tipo,
        cell: (trx) => (
          <Badge variant={trx.tipo === "ingreso" ? "default" : trx.tipo === "egreso" ? "destructive" : "secondary"}>
            {TIPO_LABELS[trx.tipo] ?? trx.tipo}
          </Badge>
        ),
        filterType: "select",
        filterOptions: Object.values(TIPO_LABELS).map((label) => ({ label, value: label })),
      },
      {
        key: "conciliado",
        header: "Conciliado",
        accessor: (trx) => (trx.conciliado ? "Sí" : "No"),
        cell: (trx) => (
          <Badge variant={trx.conciliado ? "outline" : "secondary"}>{trx.conciliado ? "Conciliado" : "Pendiente"}</Badge>
        ),
        filterType: "select",
        filterOptions: [
          { label: "Conciliado", value: "Sí" },
          { label: "Pendiente", value: "No" },
        ],
      },
      {
        key: "ingreso",
        header: "Ingresos",
        accessor: (trx) => (trx.tipo === "ingreso" ? Math.abs(trx.monto || 0) : 0),
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "egreso",
        header: "Egresos",
        accessor: (trx) => (trx.tipo === "egreso" ? Math.abs(trx.monto || 0) : 0),
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
    ],
    [accountName],
  )

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando movimientos...</div>
  }

  return (
    <DataTablePro
      tableId="banking-movements"
      testId="banking-movements-table"
      columns={columns}
      rows={transactions}
      getRowId={(trx) => trx.id}
      moduleName="Bancos"
      importHref="/dashboard/import"
      quickFilters={[
        { label: "Ingresos", predicate: (trx) => trx.tipo === "ingreso" },
        { label: "Egresos", predicate: (trx) => trx.tipo === "egreso" },
        { label: "Sin conciliar", predicate: (trx) => !trx.conciliado },
      ]}
      helpItems={[
        "Cada movimiento muestra su cuenta, tipo y estado de conciliación.",
        "Usa Filtros para combinar cuenta, fecha, tipo y monto.",
        "El botón Totales muestra la suma de ingresos y egresos de lo visible.",
        "Importar permite cargar movimientos bancarios desde Excel o CSV.",
        "Exportar descarga el estado de cuenta con los filtros aplicados.",
      ]}
      emptyMessage="No hay movimientos registrados."
      emptyHint="Importa movimientos bancarios o regístralos desde Cuentas."
    />
  )
}
