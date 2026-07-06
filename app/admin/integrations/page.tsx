"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plug, Database, MessageSquare, CreditCard, Sparkles } from "lucide-react"
import { listTenants } from "@/lib/platform/tenant-store"
import type { Tenant } from "@/lib/platform/types"

export default function IntegrationsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  useEffect(() => {
    listTenants().then(setTenants)
  }, [])

  const crmEnabled = tenants.filter((t) => t.crm.enabled).length

  const integrations = [
    {
      name: "Firebase / Firestore",
      icon: Database,
      status: "Conectado",
      variant: "default" as const,
      detail: "Proyecto nexoerp-88c6e · Auth + Firestore + Storage. Persistencia real por tenant.",
    },
    {
      name: "CRM Momentum",
      icon: MessageSquare,
      status: `${crmEnabled}/${tenants.length} tenants`,
      variant: "secondary" as const,
      detail: "Integración por tenant en modo sandbox. Adaptador contra auto-crm. Config en cada empresa.",
    },
    {
      name: "PAC / Timbrado CFDI",
      icon: CreditCard,
      status: "Mock",
      variant: "outline" as const,
      detail: "MockPacAdapter activo. Pendiente contratar PAC para timbrado real (§14).",
    },
    {
      name: "IA (BYOK)",
      icon: Sparkles,
      status: "Opcional",
      variant: "outline" as const,
      detail: "Claude/OpenAI por tenant con API key server-side. Kill switch y presupuesto. Ver /admin/ai.",
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Plug className="w-7 h-7 text-primary" /> Integraciones
        </h1>
        <p className="text-muted-foreground mt-1">Servicios vinculados a la plataforma y su estado real.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((i) => (
          <Card key={i.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <i.icon className="w-5 h-5 text-primary" /> {i.name}
                </CardTitle>
                <Badge variant={i.variant}>{i.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{i.detail}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
