"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, CheckCircle2 } from "lucide-react"
import type { ReleaseNote } from "@/lib/platform/types"

/**
 * Releases visibles para operaciones. Se declaran aquí de forma honesta:
 * lo que quedó realmente disponible en cada versión (no promesas).
 */
const RELEASES: ReleaseNote[] = [
  {
    version: "0.3.0",
    date: "2026-07-06",
    title: "Rescate: Control Plane, Firebase real y CRM integrado",
    environment: "production",
    highlights: [
      "Nexo Control Plane (/admin) para operaciones@nexo.com",
      "Persistencia multi-tenant real en Firestore por empresa",
      "Centro de Importación masiva con plantillas, validación y dry-run",
      "Tablas estilo SAP: filtros, sumas, columnas, exportar, acciones masivas",
      "CRM Momentum integrado por tenant (abrir + regresar + sync sandbox)",
      "Asistente flotante y auditoría visible por registro",
      "firestore.rules con aislamiento por tenant",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-07-03",
    title: "Dominio DELAR, tema oscuro, CRM sandbox",
    environment: "production",
    highlights: ["Dominio food-service", "0 errores TypeScript", "44 unitarias + 14 E2E"],
  },
]

export default function ReleasesPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Rocket className="w-7 h-7 text-primary" /> Releases
        </h1>
        <p className="text-muted-foreground mt-1">Versiones desplegadas y lo que quedó realmente disponible.</p>
      </div>
      {RELEASES.map((r) => (
        <Card key={r.version}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                v{r.version} — {r.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={r.environment === "production" ? "default" : "secondary"}>{r.environment}</Badge>
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
            </div>
            <CardDescription>Registro honesto de entregables (§19).</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {r.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
