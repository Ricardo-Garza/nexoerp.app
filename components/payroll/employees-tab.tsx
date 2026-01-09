"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, UserPlus } from "lucide-react"
import type { Employee } from "@/lib/types"

interface EmployeesTabProps {
  employees: Employee[]
  onAddEmployee: () => void
  onEditEmployee: (employee: Employee) => void
  loading: boolean
}

export function EmployeesTab({ employees, onAddEmployee, onEditEmployee, loading }: EmployeesTabProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.numeroEmpleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.puesto.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Cargando empleados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empleados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button onClick={onAddEmployee}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay empleados registrados</p>
          <Button onClick={onAddEmployee} className="mt-4">
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar Primer Empleado
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4" onClick={() => onEditEmployee(employee)}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    {employee.nombre.charAt(0)}
                    {employee.apellidoPaterno.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {employee.nombre} {employee.apellidoPaterno} {employee.apellidoMaterno}
                      </p>
                      <Badge variant={employee.estado === "activo" ? "default" : "secondary"}>{employee.estado}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{employee.puesto}</p>
                    <p className="text-xs text-muted-foreground">{employee.numeroEmpleado}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${employee.salarioMensual.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{employee.departamento}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
