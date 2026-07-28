"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import { Upload } from "lucide-react"
import { listImportRuns, listTenants } from "@/lib/platform/tenant-store"
import type { ImportRun, Tenant } from "@/lib/platform/types"

export default function AdminImportsPage() {
  const [runs, setRuns] = useState<ImportRun[]>([])
  const [tenants, setTenants] = useState<Record<string, Tenant>>({})

  useEffect(() => {
    async function load() {
      const ts = await listTenants()
      setTenants(Object.fromEntries(ts.map((t) => [t.id, t])))
      const all: ImportRun[] = []
      for (const t of ts) all.push(...(await listImportRuns(t.id, 100)))
      const globalDemo = await listImportRuns(null, 200)
      const merged = Array.from(new Map([...all, ...globalDemo].map((r) => [r.id, r])).values())
      setRuns(merged.sort((a, b) => (a.at < b.at ? 1 : -1)))
    }
    load()
  }, [])

  const columns: ProColumn<ImportRun>[] = [
    { key: "at", header: "Fecha", accessor: (r) => r.at, cell: (r) => new Date(r.at).toLocaleString("es-MX") },
    { key: "tenant", header: "Empresa", accessor: (r) => tenants[r.tenantId]?.name ?? r.tenantId },
    { key: "entity", header: "Entidad", accessor: (r) => r.entity },
    { key: "file", header: "Archivo", accessor: (r) => r.fileName },
    { key: "total", header: "Filas", accessor: (r) => r.totalRows, numeric: true, align: "right" },
    { key: "created", header: "Creadas", accessor: (r) => r.createdRows, numeric: true, align: "right" },
    { key: "errors", header: "Errores", accessor: (r) => r.errorRows, numeric: true, align: "right" },
    {
      key: "status",
      header: "Estado",
      accessor: (r) => r.status,
      cell: (r) => (
        <Badge variant={r.status === "committed" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>
          {r.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Importaciones</h1>
          <p className="text-muted-foreground mt-1">Historial de cargas masivas de todas las empresas.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/import">
            <Upload className="w-4 h-4 mr-1" /> Abrir Centro de Importación
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Corridas ({runs.length})</CardTitle>
          <CardDescription>Cada corrida (prueba previa o confirmada) queda registrada con su resultado.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablePro
            tableId="admin-imports"
            columns={columns}
            rows={runs}
            getRowId={(r) => r.id}
            emptyMessage="Sin importaciones todavía. Usa el Centro de Importación para cargar datos."
          />
        </CardContent>
      </Card>
    </div>
  )
}
