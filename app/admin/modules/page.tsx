"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import { MODULE_CATALOG } from "@/lib/platform/modules"
import type { ModuleDefinition } from "@/lib/platform/types"

const maturityVariant: Record<string, "default" | "secondary" | "outline"> = {
  stable: "default",
  beta: "secondary",
  planned: "outline",
}

export default function ModulesPage() {
  const columns: ProColumn<ModuleDefinition>[] = [
    { key: "name", header: "Módulo", accessor: (m) => m.name, cell: (m) => <span className="font-medium">{m.name}</span> },
    { key: "description", header: "Descripción", accessor: (m) => m.description },
    { key: "group", header: "Grupo", accessor: (m) => m.group },
    {
      key: "maturity",
      header: "Madurez",
      accessor: (m) => m.maturity,
      cell: (m) => <Badge variant={maturityVariant[m.maturity]}>{m.maturity}</Badge>,
    },
    { key: "href", header: "Ruta", accessor: (m) => m.href },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Catálogo de módulos</h1>
        <p className="text-muted-foreground mt-1">
          Módulos disponibles en la plataforma. Se activan por empresa desde el detalle de cada tenant.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Módulos ({MODULE_CATALOG.length})</CardTitle>
          <CardDescription>
            "stable" opera end-to-end; "beta" funciona con alcance limitado; "planned" se muestra deshabilitado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablePro tableId="admin-modules" columns={columns} rows={MODULE_CATALOG} getRowId={(m) => m.id} />
        </CardContent>
      </Card>
    </div>
  )
}
