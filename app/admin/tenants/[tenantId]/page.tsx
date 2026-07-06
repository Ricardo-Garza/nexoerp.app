"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, LogIn, Save, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { usePlatform } from "@/contexts/platform-context"
import { getTenant, saveTenant, appendAudit, listAudit } from "@/lib/platform/tenant-store"
import { MODULE_CATALOG } from "@/lib/platform/modules"
import { RecordAuditSheet } from "@/components/audit/record-audit-sheet"
import type { Tenant, ModuleId, AuditRecord } from "@/lib/platform/types"

export default function TenantDetailPage() {
  const params = useParams<{ tenantId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { setActiveTenant } = usePlatform()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [audit, setAudit] = useState<AuditRecord[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getTenant(params.tenantId).then(setTenant)
    listAudit(params.tenantId, 25).then(setAudit)
  }, [params.tenantId])

  if (!tenant) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando empresa...
      </div>
    )
  }

  function patch(update: Partial<Tenant>) {
    setTenant((prev) => (prev ? { ...prev, ...update } : prev))
  }

  async function persist(action: string, summary: string) {
    if (!tenant) return
    setSaving(true)
    await saveTenant(tenant)
    await appendAudit({
      tenantId: tenant.id,
      actorEmail: user?.email ?? "operaciones@nexo.com",
      actorRole: "platform_admin",
      action,
      entityType: "Tenant",
      entityId: tenant.id,
      summary,
      after: { name: tenant.name, modules: tenant.modules.length },
      source: "ui",
    })
    setAudit(await listAudit(tenant.id, 25))
    setSaving(false)
    toast.success("Cambios guardados", { description: summary })
  }

  function toggleModule(id: ModuleId) {
    if (!tenant) return
    const has = tenant.modules.includes(id)
    patch({ modules: has ? tenant.modules.filter((m) => m !== id) : [...tenant.modules, id] })
  }

  function enterTenant() {
    if (!tenant) return
    setActiveTenant(tenant.id)
    router.push("/dashboard")
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/tenants" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Empresas
          </Link>
          <h1 className="text-3xl font-bold mt-1 flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: tenant.branding.primaryColor }}
            >
              {tenant.name.slice(0, 2).toUpperCase()}
            </span>
            {tenant.name}
            <Badge variant={tenant.status === "active" ? "default" : "secondary"}>{tenant.status}</Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ID: <code className="text-xs">{tenant.id}</code> · v{tenant.version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RecordAuditSheet entityId={tenant.id} entityType="Tenant" />
          <Button onClick={enterTenant} data-testid="enter-tenant-detail">
            <LogIn className="w-4 h-4 mr-1" /> Entrar como soporte
          </Button>
        </div>
      </div>

      <Tabs defaultValue="modules">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="branding">Diseño</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>

        {/* MÓDULOS */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Módulos activos</CardTitle>
              <CardDescription>
                Activa o desactiva módulos por empresa. Los módulos "planned" aún no operan y se muestran deshabilitados
                en el ERP.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {MODULE_CATALOG.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      {m.maturity !== "stable" && (
                        <Badge variant="outline" className="text-[10px]">
                          {m.maturity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                  </div>
                  <Switch
                    checked={tenant.modules.includes(m.id)}
                    onCheckedChange={() => toggleModule(m.id)}
                    disabled={m.maturity === "planned"}
                    aria-label={`Módulo ${m.name}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <Button onClick={() => persist("tenant.modules.update", `Módulos actualizados (${tenant.modules.length})`)} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> Guardar módulos
          </Button>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diseño y marca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Texto del logo</Label>
                <Input
                  value={tenant.branding.logoText}
                  onChange={(e) => patch({ branding: { ...tenant.branding, logoText: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color primario</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={tenant.branding.primaryColor}
                    onChange={(e) => patch({ branding: { ...tenant.branding, primaryColor: e.target.value } })}
                    className="w-12 h-10 rounded border cursor-pointer"
                    aria-label="Color primario"
                  />
                  <Input
                    value={tenant.branding.primaryColor}
                    onChange={(e) => patch({ branding: { ...tenant.branding, primaryColor: e.target.value } })}
                    className="w-32"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select
                  value={tenant.branding.theme}
                  onValueChange={(v) => patch({ branding: { ...tenant.branding, theme: v as Tenant["branding"]["theme"] } })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => persist("tenant.branding.update", "Branding actualizado")} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> Guardar diseño
          </Button>
        </TabsContent>

        {/* FISCAL */}
        <TabsContent value="fiscal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos fiscales</CardTitle>
              <CardDescription>
                Timbrado en modo <Badge variant="outline">MockPacAdapter</Badge> hasta contratar un PAC. No se presenta
                timbrado real hasta configurarlo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Razón social</Label>
                  <Input
                    value={tenant.fiscal.legalName}
                    onChange={(e) => patch({ fiscal: { ...tenant.fiscal, legalName: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RFC</Label>
                  <Input value={tenant.fiscal.rfc} onChange={(e) => patch({ fiscal: { ...tenant.fiscal, rfc: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label>Régimen</Label>
                  <Input
                    value={tenant.fiscal.regime}
                    onChange={(e) => patch({ fiscal: { ...tenant.fiscal, regime: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Domicilio</Label>
                  <Input
                    value={tenant.fiscal.address}
                    onChange={(e) => patch({ fiscal: { ...tenant.fiscal, address: e.target.value } })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => persist("tenant.fiscal.update", "Datos fiscales actualizados")} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> Guardar fiscal
          </Button>
        </TabsContent>

        {/* CRM */}
        <TabsContent value="crm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CRM Momentum</CardTitle>
              <CardDescription>Integración por tenant. La sincronización real vive en el módulo CRM del ERP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">CRM habilitado</p>
                  <p className="text-xs text-muted-foreground">Muestra el módulo CRM en el menú del tenant</p>
                </div>
                <Switch
                  checked={tenant.crm.enabled}
                  onCheckedChange={(v) => patch({ crm: { ...tenant.crm, enabled: v } })}
                  aria-label="CRM habilitado"
                />
              </div>
              <div className="space-y-2">
                <Label>URL base del CRM</Label>
                <Input value={tenant.crm.baseUrl} onChange={(e) => patch({ crm: { ...tenant.crm, baseUrl: e.target.value } })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modo</Label>
                  <Select value={tenant.crm.mode} onValueChange={(v) => patch({ crm: { ...tenant.crm, mode: v as "sandbox" | "production" } })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Producción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuente maestra</Label>
                  <Select
                    value={tenant.crm.masterSource}
                    onValueChange={(v) => patch({ crm: { ...tenant.crm, masterSource: v as "nexo" | "crm" } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nexo">Nexo ERP</SelectItem>
                      <SelectItem value="crm">CRM Momentum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => persist("tenant.crm.update", "Configuración CRM actualizada")} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> Guardar CRM
          </Button>
        </TabsContent>

        {/* AUDITORÍA */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auditoría del tenant</CardTitle>
              <CardDescription>Últimos cambios administrativos sobre esta empresa.</CardDescription>
            </CardHeader>
            <CardContent>
              {audit.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin eventos todavía.</p>
              ) : (
                <div className="space-y-2">
                  {audit.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {a.action}
                      </Badge>
                      <div className="min-w-0">
                        <p>{a.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.at).toLocaleString("es-MX")} · {a.actorEmail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
