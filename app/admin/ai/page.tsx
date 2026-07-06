"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Sparkles, ShieldCheck, Save } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { listTenants, saveTenant, appendAudit } from "@/lib/platform/tenant-store"
import type { Tenant } from "@/lib/platform/types"

export default function AiConfigPage() {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listTenants().then((ts) => {
      setTenants(ts)
      if (ts[0]) setSelectedId(ts[0].id)
    })
  }, [])

  const tenant = tenants.find((t) => t.id === selectedId)

  function patchAi(update: Partial<Tenant["ai"]>) {
    setTenants((prev) => prev.map((t) => (t.id === selectedId ? { ...t, ai: { ...t.ai, ...update } } : t)))
  }

  async function save() {
    if (!tenant) return
    setSaving(true)
    await saveTenant(tenant)
    await appendAudit({
      tenantId: tenant.id,
      actorEmail: user?.email ?? "operaciones@nexo.com",
      actorRole: "platform_admin",
      action: "tenant.ai.update",
      entityType: "Tenant",
      entityId: tenant.id,
      summary: `IA ${tenant.ai.enabled ? "activada" : "desactivada"} (${tenant.ai.provider})`,
      source: "ui",
    })
    setSaving(false)
    toast.success("Configuración de IA guardada")
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" /> IA por cliente (BYOK)
        </h1>
        <p className="text-muted-foreground mt-1">
          Cada empresa trae su propia API key. Las claves se guardan server-side con máscara y auditoría, nunca en el
          frontend ni en el repositorio.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="shrink-0">Empresa</Label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Selecciona empresa" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tenant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Configuración de IA — {tenant.name}</span>
              <Badge variant={tenant.ai.enabled ? "default" : "outline"}>{tenant.ai.enabled ? "Activa" : "Inactiva"}</Badge>
            </CardTitle>
            <CardDescription>Kill switch, proveedor, modelo y presupuesto mensual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Habilitar IA</p>
                <p className="text-xs text-muted-foreground">Kill switch por empresa</p>
              </div>
              <Switch checked={tenant.ai.enabled} onCheckedChange={(v) => patchAi({ enabled: v })} aria-label="Habilitar IA" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Select value={tenant.ai.provider} onValueChange={(v) => patchAi({ provider: v as Tenant["ai"]["provider"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modelo permitido</Label>
                <Input
                  value={tenant.ai.model}
                  onChange={(e) => patchAi({ model: e.target.value })}
                  placeholder="claude-sonnet-5 / gpt-4o"
                />
              </div>
              <div className="space-y-2">
                <Label>Presupuesto mensual (USD)</Label>
                <Input
                  type="number"
                  value={tenant.ai.monthlyBudgetUsd}
                  onChange={(e) => patchAi({ monthlyBudgetUsd: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>API key (server-side)</Label>
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  {tenant.ai.hasServerKey ? "•••• configurada en secret manager" : "No configurada"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Se configura por variable de entorno / secret manager, fuera del repositorio.
                </p>
              </div>
            </div>

            <Button onClick={save} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> Guardar configuración de IA
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
