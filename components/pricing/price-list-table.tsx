"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTablePro, type ProColumn, type RecentChange } from "@/components/ui/data-table-pro"
import { dec } from "@/lib/domain/shared/decimal"

interface PriceListInfo {
  id: string
  name: string
  code: string
  channel: "retail" | "wholesale" | string
  currency: string
  validFrom: string
  validUntil: string | null
  status: string
}

interface PriceRow {
  skuCode: string
  skuName: string
  unitsPerCase: number
  unitPrice: string
  casePrice: string
}

interface PriceListTableProps {
  list: PriceListInfo
  rows: PriceRow[]
}

export function PriceListTable({ list, rows }: PriceListTableProps) {
  const columns = useMemo<ProColumn<PriceRow>[]>(
    () => [
      {
        key: "skuCode",
        header: "SKU",
        accessor: (row) => row.skuCode,
        cell: (row) => <span className="font-mono text-sm">{row.skuCode}</span>,
        filterType: "text",
      },
      {
        key: "skuName",
        header: "Producto",
        accessor: (row) => row.skuName,
        cell: (row) => (
          <span className="block max-w-80 truncate" title={row.skuName}>
            {row.skuName}
          </span>
        ),
        filterType: "text",
      },
      {
        key: "unitPrice",
        header: "Precio pieza",
        accessor: (row) => dec.toNumber(row.unitPrice),
        cell: (row) => <span className="font-mono text-sm">{dec.formatMoney(row.unitPrice, list.currency)}</span>,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "unitsPerCase",
        header: "Pzas/Caja",
        accessor: (row) => row.unitsPerCase,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "casePrice",
        header: "Precio caja",
        accessor: (row) => dec.toNumber(row.casePrice),
        cell: (row) => <span className="font-mono text-sm">{dec.formatMoney(row.casePrice, list.currency)}</span>,
        numeric: true,
        align: "right",
        filterType: "number",
      },
    ],
    [list.currency],
  )

  const recentChanges = useMemo<RecentChange[]>(
    () =>
      rows.slice(0, 6).map((row) => ({
        id: `${list.id}-${row.skuCode}`,
        title: `${row.skuCode} actualizado en ${list.name}`,
        description: `Precio pieza ${dec.formatMoney(row.unitPrice, list.currency)} · caja ${dec.formatMoney(row.casePrice, list.currency)}`,
        actor: "Configuración comercial",
        at: `Vigente desde ${list.validFrom}`,
      })),
    [list.currency, list.id, list.name, list.validFrom, rows],
  )

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>{list.name}</CardTitle>
          <Badge variant="secondary" className="font-mono">
            {list.code}
          </Badge>
          <Badge variant="outline">{list.channel === "wholesale" ? "Mayoreo" : "Menudeo"}</Badge>
          <Badge variant="outline">
            Vigencia: {list.validFrom} - {list.validUntil ?? "abierta"}
          </Badge>
          {list.status === "historical_requires_validation" && (
            <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
              Histórica, requiere validación
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Busca, filtra por producto o rango de precio, ordena y exporta la vista actual.
        </p>
      </CardHeader>
      <CardContent>
        <DataTablePro
          columns={columns}
          emptyMessage="Sin productos en esta lista."
          getRowId={(row) => row.skuCode}
          moduleName="Listas de precios"
          quickFilters={[
            { label: "Precio alto", predicate: (row) => dec.toNumber(row.unitPrice) >= 100 },
            { label: "Caja mayor a $500", predicate: (row) => dec.toNumber(row.casePrice) >= 500 },
          ]}
          recentChanges={recentChanges}
          rows={rows}
          tableId={`price-list-${list.id}`}
          testId={`price-list-${list.code}`}
        />
      </CardContent>
    </Card>
  )
}
