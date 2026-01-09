"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertCircle, Plus, Search, CheckCircle, XCircle } from "lucide-react"
import type { Incident, Employee } from "@/lib/types"
import { IncidentDialog } from "./incident-dialog"
import { useToast } from "@/hooks/use-toast"

interface IncidentsTabProps {
  incidents: Incident[]
  employees: Employee[]
  loading: boolean
  onAddIncident: (incident: Omit<Incident, "id">) => Promise<any>
  onApproveIncident: (id: string, approved: boolean, comments?: string) => Promise<any>
}

export function IncidentsTab({ incidents, employees, loading, onAddIncident, onApproveIncident }: IncidentsTabProps) {
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employees
        .find((e) => e.id === inc.empleadoId)
        ?.nombre.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  )

  const handleSaveIncident = async (incidentData: any) => {
    try {
      console.log("[Payroll] Creating incident", incidentData)
      await onAddIncident(incidentData)
      toast({
        title: "Incidencia creada",
        description: "La incidencia ha sido registrada exitosamente.",
      })
      setIsIncidentDialogOpen(false)
    } catch (error) {
      console.error("[Payroll] Error creating incident", error)
      toast({
        title: "Error",
        description: "No se pudo crear la incidencia",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (id: string) => {
    try {
      console.log("[Payroll] Approving incident", id)
      await onApproveIncident(id, true)
      toast({
        title: "Incidencia aprobada",
        description: "La incidencia ha sido aprobada.",
      })
    } catch (error) {
      console.error("[Payroll] Error approving incident", error)
      toast({
        title: "Error",
        description: "No se pudo aprobar la incidencia",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id: string) => {
    try {
      console.log("[Payroll] Rejecting incident", id)
      await onApproveIncident(id, false, "Rechazada")
      toast({
        title: "Incidencia rechazada",
        description: "La incidencia ha sido rechazada.",
      })
    } catch (error) {
      console.error("[Payroll] Error rejecting incident", error)
      toast({
        title: "Error",
        description: "No se pudo rechazar la incidencia",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Cargando incidencias...</p>
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
            placeholder="Buscar incidencias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsIncidentDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Incidencia
        </Button>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No hay incidencias registradas</p>
          <Button onClick={() => setIsIncidentDialogOpen(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Registrar Primera Incidencia
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => {
            const employee = employees.find((e) => e.id === incident.empleadoId)
            return (
              <Card key={incident.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {employee?.nombre} {employee?.apellidoPaterno}
                        </p>
                        <Badge
                          variant={
                            incident.estado === "aprobada"
                              ? "default"
                              : incident.estado === "rechazada"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {incident.estado}
                        </Badge>
                        <Badge variant="outline">{incident.tipo}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(incident.fechaInicio).toLocaleDateString()} -{" "}
                        {new Date(incident.fechaFin).toLocaleDateString()}
                      </p>
                      {incident.motivo && <p className="text-xs text-muted-foreground mt-1">{incident.motivo}</p>}
                    </div>
                    {incident.estado === "pendiente" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleApprove(incident.id)}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aprobar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(incident.id)}>
                          <XCircle className="w-3 h-3 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <IncidentDialog
        open={isIncidentDialogOpen}
        onOpenChange={setIsIncidentDialogOpen}
        incident={null}
        onSave={handleSaveIncident}
        employees={employees}
      />
    </div>
  )
}
