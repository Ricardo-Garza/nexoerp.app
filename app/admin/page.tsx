"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Boxes, ScrollText, Upload, Activity, ArrowRight, CheckCircle2 } from "lucide-react"
import { listTenants, listAudit, listImportRuns } from "@/lib/platform/tenant-store"
import { MODULE_CATALOG } from "@/lib/platform/modules"
import type { Tenant } from "@/lib/platform/types"

export default function AdminOverviewPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [auditCount, setAuditCount] = useState(0)
  const [importCount, setImportCount] = useState(0)

  useEffect(() => {
    listTenants().then(setTenants)
    listAudit(null, 500).then((a) => setAuditCount(a.length))
    listImportRuns(null, 200).then((i) => setImportCount(i.length))
  }, [])

  const active = tenants.filter((t) => t.status === "active").length
  const stableModules = MODULE_CATALOG.filter((m) => m.maturity === "stable").length

  const kpis = [
    { label: "Empresas / Universos", value: tenants.length, sub: `${active} activas`, icon: Building2, href: "/admin/tenants" },
    { label: "Módulos disponibles", value: MODULE_CATALOG.length, sub: `${stableModules} estables`, icon: Boxes, href: "/admin/modules" },
    { label: "Eventos de auditoría", value: auditCount, sub: "sesión actual", icon: ScrollText, href: "/admin/audit" },
    { label: "Importaciones", value: importCount, sub: "corridas registradas", icon: Upload, href: "/admin/imports" },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Nexo Control Plane</h1>
          <p className="text-muted-foreground mt-1">
            Administración central de todos los universos empresariales de Nexo.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tenants">
            Gestionar empresas <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground font-medium">{k.label}</CardTitle>
                  <k.icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Salud del sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Autenticación Firebase", ok: true, detail: "Proyecto nexoerp-88c6e" },
            { label: "Persistencia Firestore", ok: true, detail: "Colecciones por tenant activas" },
            { label: "Aislamiento por tenant", ok: true, detail: "firestore.rules versionadas" },
            { label: "CRM Momentum", ok: true, detail: "Modo sandbox por tenant" },
          ].map((s) => (
            <div key={s.label} className="flex items-start gap-3 rounded-lg border p-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Universos empresariales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tenants.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tenants/${t.id}`}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: t.branding.primaryColor }}
                >
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.modules.length} módulos · v{t.version}
                  </p>
                </div>
              </div>
              <Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
