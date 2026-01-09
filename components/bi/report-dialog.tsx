"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BIReport } from "@/lib/types"

interface ReportDialogProps {
  report: BIReport | null
  onClose: () => void
  onSave: (data: Partial<BIReport>) => Promise<void>
}

export function ReportDialog({ report, onClose, onSave }: ReportDialogProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: report?.name || "",
    queryId: report?.queryId || "",
    format: report?.format || "pdf",
    frequency: report?.schedule.frequency || "daily",
    recipients: report?.recipients.join(", ") || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      await onSave({
        name: formData.name.trim(),
        queryId: formData.queryId || "default-query",
        format: formData.format as "pdf" | "excel" | "csv",
        schedule: {
          frequency: formData.frequency as "daily" | "weekly" | "monthly",
          nextRun: null,
        },
        recipients: formData.recipients
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle>{report ? "Editar Reporte" : "Nuevo Reporte Programado"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Reporte *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Reporte de Ventas Mensual"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frecuencia *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Formato *</Label>
              <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipients">Destinatarios (emails separados por comas) *</Label>
            <Input
              id="recipients"
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              placeholder="usuario@empresa.com, admin@empresa.com"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || saving}>
              {saving ? "Guardando..." : report ? "Actualizar" : "Crear Reporte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
