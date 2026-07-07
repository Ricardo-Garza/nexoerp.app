"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { DataTablePro, type ProColumn } from "@/components/ui/data-table-pro"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, LogIn, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { usePlatform } from "@/contexts/platform-context"
import { listTenants, saveTenant, makeTenantId, appendAudit } from "@/lib/platform/tenant-store"
import { DEFAULT_TENANT_MODULES, DISTRIBUTION_TENANT_MODULES } from "@/lib/platform/modules"
import { DEFAULT_ERP_PREFERENCES } from "@/lib/platform/preferences"
import { LATEST_STABLE_VERSION } from "@/lib/platform/versions"
import type { Tenant, TenantTemplate } from "@/lib/platform/types"

/** Plantillas de giro disponibles al crear una empresa. */
const TENANT_TEMPLATES: { value: TenantTemplate; label: string; description: string }[] = [
  { value: "general", label: "General", description: "Módulos estándar: ventas, clientes, inventario, catálogo" },
  {
    value: "distribucion-cables",
    label: "Comercial / Distribución",
    description: "Productos y Precios e Inventario y Existencias unificados; sin producción ni nómina",
  },
  { value: "demo", label: "Demo / Prototipo", description: "Empresa de demostración con módulos estándar" },
]

const statusLabel: Record<Tenant["status"], string> = {
  active: "Activa",
  trial: "Prueba",
  suspended: "Suspendida",
  prospect: "Prospecto",
}

export default function TenantsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { setActiveTenant } = usePlatform()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [rfc, setRfc] = useState("")
  const [template, setTemplate] = useState<TenantTemplate>("general")
  const [creating, setCreating] = useState(false)

  async function refresh() {
    setTenants(await listTenants())
  }
  useEffect(() => {
    listTenants().then(setTenants)
  }, [])

  async function createTenant() {
    if (!name.trim()) return
    setCreating(true)
    const id = makeTenantId(name)
    const nowIso = new Date().toISOString()
    const trimmedName = name.trim()
    const modules = template === "distribucion-cables" ? DISTRIBUTION_TENANT_MODULES : DEFAULT_TENANT_MODULES
    const tenant: Tenant = {
      id,
      name: trimmedName,
      slug: id.replace(/^org-/, ""),
      status: template === "demo" ? "trial" : "active",
      version: LATEST_STABLE_VERSION,
      versionHistory: [
        {
          version: LATEST_STABLE_VERSION,
          previousVersion: null,
          at: nowIso,
          actorEmail: user?.email ?? "operaciones@nexo.com",
          note: "Alta de la empresa con la última versión estable",
        },
      ],
      template,
      branding: {
        logoText: trimmedName,
        logoUrl: "/Logo Nexo ERP.svg",
        compactLogoUrl: "/nexo-icon.svg",
        primaryColor: "#06b6d4",
        theme: "dark",
      },
      modules,
      fiscal: { legalName: trimmedName, rfc: rfc.trim() || "XAXX010101000", regime: "601", address: "", pac: "mock" },
      crm: { enabled: false, baseUrl: "https://crm-momentum.vercel.app", mode: "sandbox", masterSource: "nexo", modules: [] },
      ai: { enabled: false, provider: "none", model: "", monthlyBudgetUsd: 0, hasServerKey: false },
      ui: {
        preferences: DEFAULT_ERP_PREFERENCES,
        visibleModules: modules,
        menuMode: DEFAULT_ERP_PREFERENCES.menuMode,
        tableDensity: DEFAULT_ERP_PREFERENCES.tableDensity,
        moduleColumns: {},
        sharedViewVariants: {},
      },
      documents: {
        logoUrl: "/Logo Nexo ERP.svg",
        accentColor: "#06b6d4",
        footerText: "Documento generado por Nexo ERP",
        showFiscalAddress: true,
        defaultExportFormat: "csv",
        printFormat: DEFAULT_ERP_PREFERENCES.printFormat,
      },
      seededAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    await saveTenant(tenant)
    await appendAudit({
      tenantId: id,
      actorEmail: user?.email ?? "operaciones@nexo.com",
      actorRole: "Administrador Nexo",
      action: "tenant.create",
      entityType: "Empresa",
      entityId: id,
      summary: `Empresa "${tenant.name}" creada`,
      after: { name: tenant.name, rfc: tenant.fiscal.rfc },
      source: "ui",
    })
    setName("")
    setRfc("")
    setOpen(false)
    setCreating(false)
    await refresh()
  }

  function enterTenant(t: Tenant) {
    setActiveTenant(t.id)
    router.push("/dashboard")
  }

  const columns: ProColumn<Tenant>[] = [
    {
      key: "name",
      header: "Empresa",
      accessor: (t) => t.name,
      cell: (t) => (
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: t.branding.primaryColor }}
          >
            {t.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-medium">{t.name}</span>
        </div>
      ),
    },
    { key: "rfc", header: "RFC", accessor: (t) => t.fiscal.rfc },
    { key: "modules", header: "Módulos", accessor: (t) => t.modules.length, numeric: true, align: "right" },
    { key: "version", header: "Versión", accessor: (t) => t.version },
    {
      key: "status",
      header: "Estado",
      accessor: (t) => statusLabel[t.status],
      cell: (t) => (
        <Badge variant={t.status === "active" ? "default" : t.status === "suspended" ? "destructive" : "secondary"}>
          {statusLabel[t.status]}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" /> Empresas
          </h1>
          <p className="text-muted-foreground mt-1">
            Cada empresa está aislada, con su propia marca, módulos, datos y auditoría.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-tenant">
              <Plus className="w-4 h-4 mr-1" /> Nueva empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva empresa</DialogTitle>
              <DialogDescription>
                Se crea aislada, con módulos por defecto. Después podrás configurar diseño, fiscal, CRM, documentos e IA.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="t-name">Nombre / Razón social</Label>
                <Input
                  id="t-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nueva Empresa SA de CV"
                  data-testid="tenant-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-rfc">RFC (opcional)</Label>
                <Input id="t-rfc" value={rfc} onChange={(e) => setRfc(e.target.value)} placeholder="XAXX010101000" />
              </div>
              <div className="space-y-2">
                <Label>Plantilla / giro</Label>
                <Select value={template} onValueChange={(v) => setTemplate(v as TenantTemplate)}>
                  <SelectTrigger data-testid="tenant-template-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TENANT_TEMPLATES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {TENANT_TEMPLATES.find((t) => t.value === template)?.description}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createTenant} disabled={!name.trim() || creating} data-testid="tenant-create-confirm">
                {creating ? "Creando..." : "Crear empresa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las empresas</CardTitle>
          <CardDescription>Entra a cualquier empresa como soporte y regresa al panel cuando quieras.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablePro
            tableId="admin-tenants"
            testId="tenants-table"
            columns={columns}
            rows={tenants}
            getRowId={(t) => t.id}
            rowActions={(t) => (
              <div className="flex items-center gap-1 justify-end">
                <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/tenants/${t.id}`)}>
                  Configurar
                </Button>
                <Button size="sm" variant="outline" onClick={() => enterTenant(t)} data-testid={`enter-${t.id}`}>
                  <LogIn className="w-4 h-4 mr-1" /> Entrar
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
