"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Users, Calendar } from "lucide-react"
import type { Employee, PayrollPeriod, Incident } from "@/lib/types"

interface ReportsTabProps {
  employees: Employee[]
  periods: PayrollPeriod[]
  incidents: Incident[]
  loading: boolean
}

export function ReportsTab({ employees, periods, incidents, loading }: ReportsTabProps) {
  const activeEmployees = employees.filter((e) => e.estado === "activo")
  const totalPayroll = activeEmployees.reduce((sum, emp) => sum + (emp.salarioMensual || 0), 0)
  const pendingIncidents = incidents.filter((i) => i.estado === "pendiente")
  const lastPeriod = periods[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Reportes de Nómina</h3>
          <p className="text-sm text-muted-foreground">Análisis y estadísticas</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar Reporte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
            <p className="text-xs text-muted-foreground">Empleados activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nómina Total</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Mensual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingIncidents.length}</div>
            <p className="text-xs text-muted-foreground">Pendientes de aprobar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Último Periodo Procesado</CardTitle>
        </CardHeader>
        <CardContent>
          {lastPeriod ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Periodo:</span>
                <span className="text-sm font-medium">{lastPeriod.periodo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fecha de pago:</span>
                <span className="text-sm font-medium">{new Date(lastPeriod.fechaPago).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total nómina:</span>
                <span className="text-sm font-medium">${lastPeriod.totalNomina?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Empleados:</span>
                <span className="text-sm font-medium">{lastPeriod.totalEmpleados || 0}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay periodos procesados aún</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análisis por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from(new Set(activeEmployees.map((e) => e.departamento))).map((dept) => {
              const deptEmployees = activeEmployees.filter((e) => e.departamento === dept)
              const deptPayroll = deptEmployees.reduce((sum, emp) => sum + (emp.salarioMensual || 0), 0)
              return (
                <div key={dept} className="flex justify-between items-center">
                  <span className="text-sm">{dept}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium">${deptPayroll.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">({deptEmployees.length} empleados)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
