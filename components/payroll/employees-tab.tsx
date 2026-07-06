"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, UserPlus } from "lucide-react"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import type { Employee } from "@/lib/types"

interface EmployeesTabProps {
  employees: Employee[]
  onAddEmployee: () => void
  onEditEmployee: (employee: Employee) => void
  loading: boolean
}

const ESTADO_LABELS: Record<Employee["estado"], string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  suspendido: "Suspendido",
  baja: "Baja",
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

export function EmployeesTab({ employees, onAddEmployee, onEditEmployee, loading }: EmployeesTabProps) {
  const columns = useMemo<ProColumn<Employee>[]>(
    () => [
      {
        key: "numeroEmpleado",
        header: "Número",
        accessor: (emp) => emp.numeroEmpleado,
        hideable: false,
      },
      {
        key: "nombre",
        header: "Nombre",
        accessor: (emp) => `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno ?? ""}`.trim(),
        cell: (emp) => (
          <span className="font-medium">
            {emp.nombre} {emp.apellidoPaterno} {emp.apellidoMaterno}
          </span>
        ),
        hideable: false,
      },
      {
        key: "puesto",
        header: "Puesto",
        accessor: (emp) => emp.puesto,
      },
      {
        key: "departamento",
        header: "Departamento",
        accessor: (emp) => emp.departamento,
      },
      {
        key: "estado",
        header: "Estado",
        accessor: (emp) => ESTADO_LABELS[emp.estado] ?? emp.estado,
        cell: (emp) => (
          <Badge variant={emp.estado === "activo" ? "default" : "secondary"}>
            {ESTADO_LABELS[emp.estado] ?? emp.estado}
          </Badge>
        ),
        filterType: "select",
        filterOptions: Object.values(ESTADO_LABELS).map((label) => ({ label, value: label })),
      },
      {
        key: "fechaIngreso",
        header: "Fecha de ingreso",
        accessor: (emp) => toIsoDate(emp.fechaIngreso),
        filterType: "date",
      },
      {
        key: "tipoContrato",
        header: "Contrato",
        accessor: (emp) => emp.tipoContrato,
        defaultVisible: false,
      },
      {
        key: "salarioMensual",
        header: "Salario mensual",
        accessor: (emp) => emp.salarioMensual ?? 0,
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Cargando empleados...</p>
        </div>
      </div>
    )
  }

  return (
    <DataTablePro
      tableId="payroll-employees"
      testId="payroll-employees-table"
      columns={columns}
      rows={employees}
      getRowId={(emp) => emp.id}
      onRowClick={onEditEmployee}
      moduleName="Nómina"
      importHref="/dashboard/import"
      quickFilters={[
        { label: "Activos", predicate: (emp) => emp.estado === "activo" },
        { label: "Inactivos", predicate: (emp) => emp.estado !== "activo" },
      ]}
      helpItems={[
        "Crea un empleado con el botón Nuevo Empleado.",
        "Haz clic en una fila para abrir y editar el expediente.",
        "Usa Filtros para combinar departamento, estado y fecha de ingreso.",
        "El botón Totales muestra la suma y promedio del salario de lo visible.",
        "Importar permite cargar empleados desde Excel o CSV con plantilla.",
      ]}
      emptyMessage="No hay empleados registrados."
      emptyHint="Importa datos o agrega el primer empleado."
      toolbarActions={
        <Button size="sm" onClick={onAddEmployee}>
          <UserPlus className="w-4 h-4 mr-1" />
          Nuevo Empleado
        </Button>
      }
      rowActions={(emp) => (
        <Button
          size="sm"
          variant="ghost"
          title="Editar expediente del empleado"
          onClick={() => onEditEmployee(emp)}
        >
          <Pencil className="w-4 h-4 mr-1" />
          Editar
        </Button>
      )}
    />
  )
}
