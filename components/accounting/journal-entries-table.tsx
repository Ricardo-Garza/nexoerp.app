"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import type { JournalEntry } from "@/lib/types"

interface JournalEntriesTableProps {
  journalEntries: JournalEntry[]
  loading: boolean
  formatCurrency: (value: number) => string
  onNuevaPoliza: () => void
  polizasDelMes: number
  polizasPendientes: number
}

const ESTADO_LABELS: Record<JournalEntry["estado"], string> = {
  borrador: "Borrador",
  autorizada: "Autorizada",
  cancelada: "Cancelada",
}

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

export function JournalEntriesTable({
  journalEntries,
  loading,
  formatCurrency,
  onNuevaPoliza,
  polizasDelMes,
  polizasPendientes,
}: JournalEntriesTableProps) {
  const columns = useMemo<ProColumn<JournalEntry>[]>(
    () => [
      {
        key: "folio",
        header: "Folio",
        accessor: (entry) => entry.folio,
        cell: (entry) => <span className="font-mono font-medium">{entry.folio}</span>,
        hideable: false,
      },
      {
        key: "fecha",
        header: "Fecha",
        accessor: (entry) => toIsoDate(entry.fecha),
        filterType: "date",
      },
      {
        key: "tipo",
        header: "Tipo",
        accessor: (entry) => entry.tipo,
        cell: (entry) => <Badge variant="outline">{entry.tipo}</Badge>,
        filterType: "select",
        filterOptions: ["Diario", "Ingresos", "Egresos", "Ajuste"].map((tipo) => ({ label: tipo, value: tipo })),
      },
      {
        key: "concepto",
        header: "Descripción",
        accessor: (entry) => entry.concepto ?? "",
        cell: (entry) => <span className="block max-w-xs truncate">{entry.concepto}</span>,
      },
      {
        key: "estado",
        header: "Estado",
        accessor: (entry) => ESTADO_LABELS[entry.estado] ?? entry.estado,
        cell: (entry) => (
          <Badge
            variant={entry.estado === "autorizada" ? "default" : entry.estado === "cancelada" ? "destructive" : "secondary"}
          >
            {ESTADO_LABELS[entry.estado] ?? entry.estado}
          </Badge>
        ),
        filterType: "select",
        filterOptions: Object.values(ESTADO_LABELS).map((label) => ({ label, value: label })),
      },
      {
        key: "totalCargos",
        header: "Debe",
        accessor: (entry) => entry.totalCargos ?? 0,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
        cell: (entry) => <span className="font-semibold">{formatCurrency(entry.totalCargos || 0)}</span>,
      },
      {
        key: "totalAbonos",
        header: "Haber",
        accessor: (entry) => entry.totalAbonos ?? 0,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
        cell: (entry) => <span className="font-semibold">{formatCurrency(entry.totalAbonos || 0)}</span>,
      },
      {
        key: "diferencia",
        header: "Diferencia",
        accessor: (entry) => entry.diferencia ?? 0,
        numeric: true,
        currency: true,
        align: "right",
        defaultVisible: false,
      },
    ],
    [formatCurrency],
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pólizas del Mes</p>
            <p className="text-2xl font-bold mt-1">{polizasDelMes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendientes de Autorizar</p>
            <p className="text-2xl font-bold mt-1">{polizasPendientes}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando pólizas...</div>
      ) : (
        <DataTablePro
          tableId="accounting-journal"
          testId="accounting-journal-table"
          columns={columns}
          rows={journalEntries || []}
          getRowId={(entry) => entry.id}
          moduleName="Pólizas"
          importHref="/dashboard/import"
          quickFilters={[
            { label: "Borradores", predicate: (entry) => entry.estado === "borrador" },
            { label: "Autorizadas", predicate: (entry) => entry.estado === "autorizada" },
            { label: "Descuadradas", predicate: (entry) => Math.abs(entry.diferencia ?? 0) > 0.005 },
          ]}
          helpItems={[
            "Registra una póliza con el botón Nueva Póliza; el debe y el haber deben cuadrar.",
            "Para cargar pólizas desde Excel usa Importar: descarga la plantilla y valida antes de guardar.",
            "Usa Filtros para combinar periodo, tipo, estado y monto.",
            "El botón Totales suma debe y haber de las pólizas visibles.",
            "El filtro rápido Descuadradas muestra pólizas cuya diferencia no es cero.",
          ]}
          emptyMessage="Aún no hay pólizas registradas."
          emptyHint="Importa pólizas desde Excel o registra la primera póliza contable."
          toolbarActions={
            <Button size="sm" onClick={onNuevaPoliza}>
              <FileText className="w-4 h-4 mr-1" />
              Nueva Póliza
            </Button>
          }
        />
      )}
    </div>
  )
}
