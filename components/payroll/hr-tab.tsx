"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, UserPlus } from "lucide-react"
import type { Candidate } from "@/lib/types"
import { CandidateDialog } from "./candidate-dialog"
import { useToast } from "@/hooks/use-toast"

interface HRTabProps {
  candidates: Candidate[]
  loading: boolean
  onAddCandidate: (candidate: Omit<Candidate, "id">) => Promise<any>
}

export function HRTab({ candidates, loading, onAddCandidate }: HRTabProps) {
  const [isCandidateDialogOpen, setIsCandidateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const filteredCandidates = candidates.filter(
    (cand) =>
      cand.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand.puesto.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSaveCandidate = async (candidateData: any) => {
    try {
      console.log("[Payroll] Creating candidate", candidateData)
      await onAddCandidate(candidateData)
      toast({
        title: "Candidato agregado",
        description: "El candidato ha sido registrado exitosamente.",
      })
      setIsCandidateDialogOpen(false)
    } catch (error) {
      console.error("[Payroll] Error creating candidate", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el candidato",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Cargando candidatos...</p>
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
            placeholder="Buscar candidatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsCandidateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Candidato
        </Button>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No hay candidatos registrados</p>
          <Button onClick={() => setIsCandidateDialogOpen(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Primer Candidato
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{candidate.nombre}</p>
                      <Badge variant={candidate.estatus === "activo" ? "default" : "secondary"}>
                        {candidate.estatus}
                      </Badge>
                      <Badge variant="outline">{candidate.etapa}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{candidate.puesto}</p>
                    <p className="text-xs text-muted-foreground">{candidate.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${candidate.salarioDeseado?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">Salario deseado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CandidateDialog
        open={isCandidateDialogOpen}
        onOpenChange={setIsCandidateDialogOpen}
        candidate={null}
        onSave={handleSaveCandidate}
      />
    </div>
  )
}
