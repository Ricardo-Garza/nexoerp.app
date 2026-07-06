"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, CheckCircle2 } from "lucide-react"
import type { ReleaseNote } from "@/lib/platform/types"

const RELEASES: ReleaseNote[] = [
  {
    version: "0.3.0",
    date: "2026-07-06",
    title: "Administración Nexo, Firebase real y CRM integrado",
    environment: "production",
    highlights: [
      "Administración Nexo para operaciones@nexo.com",
      "Persistencia real en Firestore con aislamiento por empresa",
      "Centro de Importación masiva con plantillas, validación y prueba previa",
      "Tablas empresariales con filtros, sumas, columnas, exportación y acciones masivas",
      "CRM Momentum integrado por empresa: abrir, regresar y sincronizar en modo de prueba",
      "Asistente flotante y auditoría visible por registro",
      "Reglas de Firestore con aislamiento por empresa",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-07-03",
    title: "Dominio DELAR, tema oscuro y CRM en modo de prueba",
    environment: "production",
    highlights: ["Dominio food-service", "0 errores TypeScript", "44 unitarias + 14 E2E"],
  },
]

export default function ReleasesPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Rocket className="w-7 h-7 text-primary" /> Versiones
        </h1>
        <p className="text-muted-foreground mt-1">Versiones desplegadas y lo que quedó realmente disponible.</p>
      </div>
      {RELEASES.map((release) => (
        <Card key={release.version}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                v{release.version} - {release.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={release.environment === "production" ? "default" : "secondary"}>
                  {release.environment === "production" ? "Producción" : "Vista previa"}
                </Badge>
                <span className="text-xs text-muted-foreground">{release.date}</span>
              </div>
            </div>
            <CardDescription>Registro honesto de entregables disponibles.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {release.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {highlight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
