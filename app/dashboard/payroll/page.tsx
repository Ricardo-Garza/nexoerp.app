"use client"

import { useState } from "react"
import { usePayrollData } from "@/hooks/use-payroll-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, Calendar, FileText, Upload, UserPlus, Briefcase, TrendingUp } from "lucide-react"
import { EmployeesTab } from "@/components/payroll/employees-tab"
import { EmployeeFormDialog } from "@/components/payroll/employee-form-dialog"
import { PayrollTab } from "@/components/payroll/payroll-tab"
import { IncidentsTab } from "@/components/payroll/incidents-tab"
import { ConceptsTab } from "@/components/payroll/concepts-tab"
import { HRTab } from "@/components/payroll/hr-tab"
import { ReportsTab } from "@/components/payroll/reports-tab"
import { useToast } from "@/hooks/use-toast"

const tabs = [
  { id: "employees", name: "Empleados", icon: Users },
  { id: "payroll", name: "Nómina", icon: DollarSign },
  { id: "incidents", name: "Incidencias", icon: Calendar },
  { id: "concepts", name: "Conceptos", icon: FileText },
  { id: "hr", name: "Recursos Humanos", icon: Briefcase },
  { id: "reports", name: "Reportes", icon: TrendingUp },
]

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("employees")
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)
  const { toast } = useToast()

  const {
    employees,
    payrollPeriods,
    incidents,
    payrollConcepts,
    candidates,
    loading,
    empleadosActivos,
    nominaMensual,
    incidenciasPendientes,
    candidatosActivos,
    addEmployee,
    updateEmployee,
    addPayrollPeriod,
    processPayrollRun,
    addIncident,
    approveIncident,
    addBenefitDeduction,
    addCandidate,
    addTimeEntry,
  } = usePayrollData()

  const safeEmployees = Array.isArray(employees) ? employees : []
  const safePayrollPeriods = Array.isArray(payrollPeriods) ? payrollPeriods : []
  const safeIncidents = Array.isArray(incidents) ? incidents : []
  const safePayrollConcepts = Array.isArray(payrollConcepts) ? payrollConcepts : []
  const safeCandidates = Array.isArray(candidates) ? candidates : []

  const handleAddEmployee = () => {
    console.log("[Payroll] Opening employee dialog for new employee")
    setEditingEmployee(null)
    setIsEmployeeDialogOpen(true)
  }

  const handleEditEmployee = (employee: any) => {
    console.log("[Payroll] Opening employee dialog for editing", employee.id)
    setEditingEmployee(employee)
    setIsEmployeeDialogOpen(true)
  }

  const handleSaveEmployee = async (employeeData: any) => {
    try {
      if (editingEmployee) {
        console.log("[Payroll] Updating employee", editingEmployee.id, employeeData)
        await updateEmployee(editingEmployee.id, employeeData)
        toast({
          title: "Empleado actualizado",
          description: "Los datos del empleado se han actualizado correctamente.",
        })
      } else {
        console.log("[Payroll] Creating new employee", employeeData)
        await addEmployee(employeeData)
        toast({
          title: "Empleado creado",
          description: "El empleado ha sido agregado exitosamente.",
        })
      }
      setIsEmployeeDialogOpen(false)
      setEditingEmployee(null)
    } catch (error) {
      console.error("[Payroll] Error saving employee", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el empleado",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Nómina y Recursos Humanos</h1>
          <p className="text-muted-foreground mt-2">Gestión integral de empleados, nómina e incidencias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button onClick={handleAddEmployee}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Empleado
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Empleados Activos</p>
              <p className="text-2xl font-bold mt-1">{loading ? "..." : empleadosActivos}</p>
              <p className="text-xs text-muted-foreground mt-1">En nómina</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Nómina Mensual</p>
              <p className="text-2xl font-bold mt-1">{loading ? "..." : `$${nominaMensual.toLocaleString()}`}</p>
              <p className="text-xs text-muted-foreground mt-1">Total mensual</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Incidencias Pendientes</p>
              <p className="text-2xl font-bold mt-1">{loading ? "..." : incidenciasPendientes}</p>
              <p className="text-xs text-orange-600 mt-1">Por autorizar</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Candidatos Activos</p>
              <p className="text-2xl font-bold mt-1">{loading ? "..." : candidatosActivos}</p>
              <p className="text-xs text-muted-foreground mt-1">En proceso</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "employees" && (
            <EmployeesTab
              employees={safeEmployees}
              loading={loading}
              onAddEmployee={handleAddEmployee}
              onEditEmployee={handleEditEmployee}
            />
          )}

          {activeTab === "payroll" && (
            <PayrollTab
              periods={safePayrollPeriods}
              employees={safeEmployees}
              loading={loading}
              onAddPeriod={addPayrollPeriod}
              onProcessPayroll={processPayrollRun}
            />
          )}

          {activeTab === "incidents" && (
            <IncidentsTab
              incidents={safeIncidents}
              employees={safeEmployees}
              loading={loading}
              onAddIncident={addIncident}
              onApproveIncident={approveIncident}
            />
          )}

          {activeTab === "concepts" && (
            <ConceptsTab concepts={safePayrollConcepts} loading={loading} onAddConcept={addBenefitDeduction} />
          )}

          {activeTab === "hr" && <HRTab candidates={safeCandidates} loading={loading} onAddCandidate={addCandidate} />}

          {activeTab === "reports" && (
            <ReportsTab
              employees={safeEmployees}
              periods={safePayrollPeriods}
              incidents={safeIncidents}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={isEmployeeDialogOpen}
        onOpenChange={setIsEmployeeDialogOpen}
        employee={editingEmployee}
        onSave={handleSaveEmployee}
      />
    </div>
  )
}
