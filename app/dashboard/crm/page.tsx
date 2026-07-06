"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  MessageSquare,
  ExternalLink,
  RefreshCw,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  Settings,
} from "lucide-react"
import { usePlatform } from "@/contexts/platform-context"
import { getTenant } from "@/lib/platform/tenant-store"
import { MockMomentumAdapter } from "@/lib/integrations/crm/mock-adapter"
import { CRM_ENTITY_MAP } from "@/lib/integrations/crm/entity-mapping"
import type { Tenant } from "@/lib/platform/types"
import type { SyncSummary } from "@/lib/integrations/crm/types"

interface SyncLogEntry {
  at: string
  summary: SyncSummary
  status: "ok" | "error"
}

const modeLabel = {
  sandbox: "Modo de prueba",
  production: "Producción",
} as const

const directionLabel: Record<string, string> = {
  pull: "Importar desde CRM",
  push: "Enviar a CRM",
  bidirectional: "Ambas direcciones",
}

export default function CrmPage() {
  const router = useRouter()
  const { activeTenantId } = usePlatform()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [log, setLog] = useState<SyncLogEntry[]>([])
  const [health, setHealth] = useState<{ ok: boolean; detail: string } | null>(null)

  useEffect(() => {
    getTenant(activeTenantId).then(setTenant)
    Promise.resolve().then(() => {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(`nexo_crm_log_${activeTenantId}`) : null
      if (raw) setLog(JSON.parse(raw))
    })
    new MockMomentumAdapter().health().then(setHealth)
  }, [activeTenantId])

  async function runTestSync() {
    setSyncing(true)
    try {
      const adapter = new MockMomentumAdapter([
        { name: "Restaurante El Fogón", email: "compras@elfogon.mx", company: "El Fogón SA", temperature: "hot", score: 85 },
        { name: "Abarrotes La Moderna", email: "pedidos@lamoderna.mx", company: "La Moderna", temperature: "warm", score: 60 },
        { name: "Cocina Norteña", email: "info@nortena.mx", company: "Norteña", temperature: "cold", score: 30 },
      ])
      const contacts = await adapter.listContacts()
      const summary: SyncSummary = {
        pulled: contacts.length,
        created: contacts.length,
        updated: 0,
        deduplicated: 0,
        skipped: 0,
      }
      const entry: SyncLogEntry = { at: new Date().toISOString(), summary, status: "ok" }
      const next = [entry, ...log].slice(0, 10)
      setLog(next)
      if (typeof window !== "undefined")
        window.localStorage.setItem(`nexo_crm_log_${activeTenantId}`, JSON.stringify(next))
      toast.success(`Sincronización de prueba: ${summary.pulled} contactos`, {
        description: `${summary.created} creados, ${summary.deduplicated} duplicados`,
      })
    } catch {
      toast.error("Error en la sincronización de prueba")
    } finally {
      setSyncing(false)
    }
  }

  const crmUrl = tenant?.crm.baseUrl ?? "https://crm-momentum.vercel.app"
  const enabled = tenant?.crm.enabled ?? false
  const currentMode = tenant?.crm.mode ?? "sandbox"

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-primary" /> CRM Momentum
          </h1>
          <p className="text-muted-foreground mt-1">
            Integración del CRM por empresa. {enabled ? "Habilitado" : "Deshabilitado"} para esta empresa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/crm/embed")}>
            <ExternalLink className="w-4 h-4 mr-1" /> Abrir CRM en Nexo
          </Button>
          <Button asChild variant="outline">
            <a href={crmUrl} target="_blank" rel="noopener noreferrer">
              Abrir en pestaña nueva
            </a>
          </Button>
        </div>
      </div>

      {!enabled && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm">
              El CRM está deshabilitado para esta empresa. Actívalo desde Administración Nexo para operar la sincronización.
            </p>
            <Button size="sm" variant="outline" onClick={() => router.push(`/admin/tenants/${activeTenantId}`)}>
              <Settings className="w-4 h-4 mr-1" /> Configurar CRM
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.ok ? "bg-emerald-500" : "bg-muted"}`} />
              <span className="font-medium">{health?.ok ? "Conectado en modo de prueba" : "Verificando..."}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{health?.detail}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Modo</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={currentMode === "production" ? "default" : "secondary"}>{modeLabel[currentMode]}</Badge>
            <p className="text-xs text-muted-foreground mt-1">Fuente maestra: {tenant?.crm.masterSource === "crm" ? "CRM Momentum" : "Nexo ERP"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Sincronización</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="sm" onClick={runTestSync} disabled={syncing} data-testid="crm-sync">
              {syncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Sincronizar prueba
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" /> Mapeo de entidades
          </CardTitle>
          <CardDescription>Correspondencia entre Nexo ERP y CRM Momentum basada en el esquema real de auto-crm.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Nexo</th>
                  <th className="text-left px-3 py-2 font-semibold">CRM Momentum</th>
                  <th className="text-left px-3 py-2 font-semibold">Dirección</th>
                  <th className="text-left px-3 py-2 font-semibold">Claves</th>
                </tr>
              </thead>
              <tbody>
                {CRM_ENTITY_MAP.map((mapping) => (
                  <tr key={mapping.nexo} className="border-b last:border-0">
                    <td className="px-3 py-1.5 font-medium">{mapping.nexo}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{mapping.crm}</td>
                    <td className="px-3 py-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {directionLabel[mapping.direction] ?? mapping.direction}
                      </Badge>
                    </td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{mapping.keyFields.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de sincronización</CardTitle>
          <CardDescription>Últimas sincronizaciones de prueba de esta empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Sin sincronizaciones. Pulsa &quot;Sincronizar prueba&quot; para probar el flujo.
            </p>
          ) : (
            <div className="space-y-2">
              {log.map((entry, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{new Date(entry.at).toLocaleString("es-MX")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{entry.summary.pulled} recibidos</Badge>
                    <Badge variant="outline">{entry.summary.created} creados</Badge>
                    <Badge variant="outline">{entry.summary.deduplicated} duplicados</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
