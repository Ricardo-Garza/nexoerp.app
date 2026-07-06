"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import { listAudit, listTenants } from "@/lib/platform/tenant-store"
import type { AuditRecord, Tenant } from "@/lib/platform/types"

export default function GlobalAuditPage() {
  const [events, setEvents] = useState<AuditRecord[]>([])
  const [tenants, setTenants] = useState<Record<string, Tenant>>({})

  useEffect(() => {
    async function load() {
      const ts = await listTenants()
      setTenants(Object.fromEntries(ts.map((t) => [t.id, t])))
      // Auditoría agregada de todos los tenants
      const all: AuditRecord[] = []
      for (const t of ts) all.push(...(await listAudit(t.id, 100)))
      // En demo listAudit(null) ya trae todo; en firebase agregamos por tenant
      const globalDemo = await listAudit(null, 300)
      const merged = [...all, ...globalDemo]
      const dedup = Array.from(new Map(merged.map((e) => [e.id, e])).values())
      setEvents(dedup.sort((a, b) => (a.at < b.at ? 1 : -1)))
    }
    load()
  }, [])

  const columns: ProColumn<AuditRecord>[] = [
    { key: "at", header: "Fecha", accessor: (e) => e.at, cell: (e) => new Date(e.at).toLocaleString("es-MX") },
    {
      key: "tenant",
      header: "Empresa",
      accessor: (e) => tenants[e.tenantId]?.name ?? e.tenantId,
    },
    { key: "action", header: "Acción", accessor: (e) => e.action, cell: (e) => <Badge variant="outline">{e.action}</Badge> },
    { key: "summary", header: "Detalle", accessor: (e) => e.summary },
    { key: "actor", header: "Actor", accessor: (e) => e.actorEmail },
    { key: "source", header: "Origen", accessor: (e) => e.source },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Auditoría global</h1>
        <p className="text-muted-foreground mt-1">Trazabilidad de cambios administrativos en todos los universos.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Eventos ({events.length})</CardTitle>
          <CardDescription>Filtra, ordena y exporta. Cada evento es inmutable.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablePro
            tableId="admin-audit"
            columns={columns}
            rows={events}
            getRowId={(e) => e.id}
            emptyMessage="Sin eventos de auditoría todavía. Crea o edita una empresa para generarlos."
          />
        </CardContent>
      </Card>
    </div>
  )
}
