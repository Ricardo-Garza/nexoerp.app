"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Play, Pause } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportDialog } from "./report-dialog"
import { Badge } from "@/components/ui/badge"
import type { BIReport } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ScheduledTabProps {
  reports: BIReport[]
  loading: boolean
  onAddReport: (report: Omit<BIReport, "id" | "createdAt" | "updatedAt">) => Promise<void>
  onUpdateReport: (id: string, report: Partial<BIReport>) => Promise<void>
  onDeleteReport: (id: string) => Promise<void>
}

export function ScheduledTab({ reports, loading, onAddReport, onUpdateReport, onDeleteReport }: ScheduledTabProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingReport, setEditingReport] = useState<BIReport | null>(null)

  const handleAdd = () => {
    setEditingReport(null)
    setShowDialog(true)
  }

  const handleEdit = (report: BIReport) => {
    setEditingReport(report)
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este reporte programado?")) {
      await onDeleteReport(id)
    }
  }

  const toggleStatus = async (report: BIReport) => {
    await onUpdateReport(report.id, {
      status: report.status === "active" ? "paused" : "active",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configura reportes automáticos que se generarán y enviarán según el calendario establecido
        </p>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Reporte
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando reportes...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay reportes programados. Crea tu primer reporte automático.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Destinatarios</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Próxima Ejecución</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell className="capitalize">{report.schedule.frequency}</TableCell>
                  <TableCell className="uppercase">{report.format}</TableCell>
                  <TableCell>{report.recipients.length} destinatarios</TableCell>
                  <TableCell>
                    <Badge variant={report.status === "active" ? "default" : "secondary"}>
                      {report.status === "active" ? "Activo" : "Pausado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.schedule.nextRun
                      ? format(report.schedule.nextRun.toDate(), "dd MMM yyyy HH:mm", { locale: es })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(report)}>
                        {report.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(report)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(report.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showDialog && (
        <ReportDialog
          report={editingReport}
          onClose={() => setShowDialog(false)}
          onSave={async (data) => {
            if (editingReport) {
              await onUpdateReport(editingReport.id, data)
            } else {
              await onAddReport(data as any)
            }
            setShowDialog(false)
          }}
        />
      )}
    </div>
  )
}
