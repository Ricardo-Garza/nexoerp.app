"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText } from "lucide-react"
import type { BenefitDeduction } from "@/lib/types"
import { ConceptDialog } from "./concept-dialog"
import { useToast } from "@/hooks/use-toast"

interface ConceptsTabProps {
  concepts: BenefitDeduction[]
  loading: boolean
  onAddConcept: (concept: Omit<BenefitDeduction, "id">) => Promise<any>
}

export function ConceptsTab({ concepts, loading, onAddConcept }: ConceptsTabProps) {
  const [isConceptDialogOpen, setIsConceptDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleSaveConcept = async (conceptData: any) => {
    try {
      console.log("[Payroll] Creating concept", conceptData)
      await onAddConcept(conceptData)
      toast({
        title: "Concepto creado",
        description: "El concepto de nómina ha sido creado exitosamente.",
      })
      setIsConceptDialogOpen(false)
    } catch (error) {
      console.error("[Payroll] Error creating concept", error)
      toast({
        title: "Error",
        description: "No se pudo crear el concepto",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Cargando conceptos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Conceptos de Nómina</h3>
          <p className="text-sm text-muted-foreground">Percepciones y deducciones</p>
        </div>
        <Button onClick={() => setIsConceptDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Concepto
        </Button>
      </div>

      {concepts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No hay conceptos de nómina</p>
          <Button onClick={() => setIsConceptDialogOpen(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Concepto
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {concepts.map((concept) => (
            <Card key={concept.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{concept.nombre}</p>
                      <Badge variant={concept.tipo === "percepcion" ? "default" : "secondary"}>{concept.tipo}</Badge>
                      {concept.activo && <Badge variant="outline">Activo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{concept.clave}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {concept.tipocalculo === "fijo" ? `$${concept.monto}` : `${concept.porcentaje}%`}
                    </p>
                    <p className="text-xs text-muted-foreground">{concept.tipocalculo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConceptDialog
        open={isConceptDialogOpen}
        onOpenChange={setIsConceptDialogOpen}
        concept={null}
        onSave={handleSaveConcept}
      />
    </div>
  )
}
