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
      detail: "Proyecto nexoerp-88c6e. Auth, Firestore y Storage con persistencia real por empresa.",
    },
    {
      name: "CRM Momentum",
      icon: MessageSquare,
      status: `${crmEnabled}/${tenants.length} empresas`,
      variant: "secondary" as const,
      detail: "Integración por empresa en modo de prueba. Adaptador contra auto-crm y configuración por empresa.",
    },
    {
      name: "PAC / Timbrado CFDI",
      icon: CreditCard,
      status: "Simulado",
      variant: "outline" as const,
      detail: "Adaptador simulado activo. Pendiente contratar y configurar PAC para timbrado real.",
    },
    {
      name: "IA con clave del cliente",
      icon: Sparkles,
      status: "Opcional",
      variant: "outline" as const,
      detail: "Claude u OpenAI por empresa con clave protegida en servidor, apagado de emergencia y presupuesto mensual.",
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
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <integration.icon className="w-5 h-5 text-primary" /> {integration.name}
                </CardTitle>
                <Badge variant={integration.variant}>{integration.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{integration.detail}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
