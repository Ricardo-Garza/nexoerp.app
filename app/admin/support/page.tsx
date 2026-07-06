"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import { listSupportTickets, listTenants } from "@/lib/platform/tenant-store"
import type { SupportTicket, Tenant } from "@/lib/platform/types"

const priorityVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [tenants, setTenants] = useState<Record<string, Tenant>>({})

  useEffect(() => {
    listSupportTickets(100).then(setTickets)
    listTenants().then((ts) => setTenants(Object.fromEntries(ts.map((t) => [t.id, t]))))
  }, [])

  const columns: ProColumn<SupportTicket>[] = [
    { key: "at", header: "Fecha", accessor: (t) => t.at, cell: (t) => new Date(t.at).toLocaleString("es-MX") },
    { key: "tenant", header: "Empresa", accessor: (t) => tenants[t.tenantId]?.name ?? t.tenantId },
    { key: "subject", header: "Asunto", accessor: (t) => t.subject },
    { key: "module", header: "Módulo", accessor: (t) => t.module },
    {
      key: "priority",
      header: "Prioridad",
      accessor: (t) => t.priority,
      cell: (t) => <Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge>,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (t) => t.status,
      cell: (t) => <Badge variant={t.status === "resolved" ? "default" : "secondary"}>{t.status}</Badge>,
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Soporte</h1>
        <p className="text-muted-foreground mt-1">
          Tickets levantados por las empresas hacia Nexo (desde el módulo Servicio / Soporte).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({tickets.length})</CardTitle>
          <CardDescription>Los tenants los crean desde su ERP; aquí les das seguimiento.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablePro
            tableId="admin-support"
            columns={columns}
            rows={tickets}
            getRowId={(t) => t.id}
            emptyMessage="Sin tickets. Las empresas los crean desde su módulo de Servicio / Soporte."
          />
        </CardContent>
      </Card>
    </div>
  )
}
