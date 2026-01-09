"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Play } from "lucide-react"
import type { PayrollPeriod, Employee } from "@/lib/types"
import { PayrollPeriodDialog } from "./payroll-period-dialog"
import { useToast } from "@/hooks/use-toast"

interface PayrollTabProps {
  periods: PayrollPeriod[]
  employees: Employee[]
  loading: boolean
  onAddPeriod: (period: Omit<PayrollPeriod, "id">) => Promise<any>
  onProcessPayroll: (periodId: string, generateJournalEntry: boolean) => Promise<any>
}

export function PayrollTab({ periods, employees, loading, onAddPeriod, onProcessPayroll }: PayrollTabProps) {
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null)
  const { toast } = useToast()

  const handleSavePeriod = async (periodData: any) => {
    try {
      console.log("[Payroll] Creating payroll period", periodData)
      await onAddPeriod(periodData)
      toast({
        title: "Periodo creado",
        description: "El periodo de nómina ha sido creado exitosamente.",
      })
      setIsPeriodDialogOpen(false)
      setEditingPeriod(null)
    } catch (error) {
      console.error("[Payroll] Error creating period", error)
      toast({
        title: "Error",
        description: "No se pudo crear el periodo de nómina",
        variant: "destructive",
      })
    }
  }

  const handleProcessPayroll = async (periodId: string) => {
    try {
      console.log("[Payroll] Processing payroll for period", periodId)
      await onProcessPayroll(periodId, true)
      toast({
        title: "Nómina procesada",
        description: "La nómina ha sido calculada y los recibos generados.",
      })
    } catch (error) {
      console.error("[Payroll] Error processing payroll", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo procesar la nómina",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Cargando periodos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Periodos de Nómina</h3>
          <p className="text-sm text-muted-foreground">Gestiona los periodos de pago</p>
        </div>
        <Button onClick={() => setIsPeriodDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Periodo
        </Button>
      </div>

      {periods.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No hay periodos de nómina</p>
          <Button onClick={() => setIsPeriodDialogOpen(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Periodo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <Card key={period.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{period.periodo}</p>
                      <Badge variant={period.estado === "pagada" ? "default" : "secondary"}>{period.estado}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(period.fechaInicio).toLocaleDateString()} -{" "}
                      {new Date(period.fechaFin).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fecha de pago: {new Date(period.fechaPago).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${period.totalNomina?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">{period.totalEmpleados || 0} empleados</p>
                    {period.estado === "borrador" && (
                      <Button size="sm" className="mt-2" onClick={() => handleProcessPayroll(period.id)}>
                        <Play className="w-3 h-3 mr-1" />
                        Procesar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PayrollPeriodDialog
        open={isPeriodDialogOpen}
        onOpenChange={setIsPeriodDialogOpen}
        period={editingPeriod}
        onSave={handleSavePeriod}
        employeeCount={employees.filter((e) => e.estado === "activo").length}
      />
    </div>
  )
}
