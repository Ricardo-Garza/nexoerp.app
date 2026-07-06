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

const priorityLabel: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
}

const statusLabel: Record<string, string> = {
  open: "Abierto",
  in_progress: "En seguimiento",
  resolved: "Resuelto",
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [tenants, setTenants] = useState<Record<string, Tenant>>({})

  useEffect(() => {
    listSupportTickets(100).then(setTickets)
    listTenants().then((loadedTenants) => setTenants(Object.fromEntries(loadedTenants.map((tenant) => [tenant.id, tenant]))))
  }, [])

  const columns: ProColumn<SupportTicket>[] = [
    { key: "at", header: "Fecha", accessor: (ticket) => ticket.at, cell: (ticket) => new Date(ticket.at).toLocaleString("es-MX") },
    { key: "tenant", header: "Empresa", accessor: (ticket) => tenants[ticket.tenantId]?.name ?? ticket.tenantId },
    { key: "subject", header: "Asunto", accessor: (ticket) => ticket.subject },
    { key: "module", header: "Módulo", accessor: (ticket) => ticket.module },
    {
      key: "priority",
      header: "Prioridad",
      accessor: (ticket) => priorityLabel[ticket.priority] ?? ticket.priority,
      cell: (ticket) => <Badge variant={priorityVariant[ticket.priority]}>{priorityLabel[ticket.priority] ?? ticket.priority}</Badge>,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (ticket) => statusLabel[ticket.status] ?? ticket.status,
      cell: (ticket) => <Badge variant={ticket.status === "resolved" ? "default" : "secondary"}>{statusLabel[ticket.status] ?? ticket.status}</Badge>,
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Soporte</h1>
        <p className="text-muted-foreground mt-1">
          Tickets levantados por las empresas hacia Nexo desde el módulo Servicio / Soporte.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({tickets.length})</CardTitle>
          <CardDescription>Las empresas crean estos tickets desde su ERP; aquí les das seguimiento.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablePro
            tableId="admin-support"
            columns={columns}
            rows={tickets}
            getRowId={(ticket) => ticket.id}
            emptyMessage="Sin tickets. Las empresas los crean desde su módulo de Servicio / Soporte."
          />
        </CardContent>
      </Card>
    </div>
  )
}
