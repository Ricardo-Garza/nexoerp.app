"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ImportWizard } from "@/components/import/import-wizard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload } from "lucide-react"
import { usePlatform } from "@/contexts/platform-context"
import { listImportRuns } from "@/lib/platform/tenant-store"
import { getTemplate } from "@/lib/import/templates"
import type { ImportRun } from "@/lib/platform/types"

export default function ImportCenterPage() {
  return (
    <Suspense fallback={null}>
      <ImportCenterContent />
    </Suspense>
  )
}

function ImportCenterContent() {
  const { activeTenantId } = usePlatform()
  const searchParams = useSearchParams()
  const [recent, setRecent] = useState<ImportRun[]>([])

  // Deep link desde los módulos: /dashboard/import?entity=productos
  const requestedEntity = searchParams.get("entity") ?? undefined
  const initialEntity = requestedEntity && getTemplate(requestedEntity) ? requestedEntity : undefined

  useEffect(() => {
    listImportRuns(activeTenantId, 5).then(setRecent)
  }, [activeTenantId])

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="w-7 h-7 text-primary" /> Centro de Importación
        </h1>
        <p className="text-muted-foreground mt-1">
          Carga masiva de datos con plantillas, mapeo automático, validación, prueba previa y auditoría. Pensado para usarse
          sin conocimientos técnicos.
        </p>
      </div>

      <ImportWizard key={initialEntity ?? "libre"} initialEntity={initialEntity} />

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Importaciones recientes</CardTitle>
            <CardDescription>Últimas cargas de esta empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium capitalize">{r.entity}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.at).toLocaleString("es-MX")} · {r.fileName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.createdRows} creados</Badge>
                  {r.errorRows > 0 && <Badge variant="destructive">{r.errorRows} errores</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
