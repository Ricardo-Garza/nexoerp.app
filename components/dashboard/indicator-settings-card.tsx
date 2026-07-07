"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { usePlatform } from "@/contexts/platform-context"
import { appendAudit, getTenant, saveTenant } from "@/lib/platform/tenant-store"
import { DASHBOARD_INDICATOR_CATALOG } from "@/lib/platform/indicators"
import type { DashboardIndicatorId, Tenant } from "@/lib/platform/types"
import { ArrowDown, ArrowUp, Gauge } from "lucide-react"

/**
 * Configuración de indicadores del dashboard por empresa: activar/desactivar,
 * reordenar y guardar. El cambio queda auditado y aplica de inmediato para
 * todos los usuarios de la empresa.
 */
export function IndicatorSettingsCard() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { activeTenantId } = usePlatform()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [selection, setSelection] = useState<DashboardIndicatorId[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    getTenant(activeTenantId)
      .then((t) => {
        if (!alive) return
        setTenant(t)
        setSelection(t?.ui?.dashboardIndicators ?? [])
      })
      .catch(() => {
        if (alive) setTenant(null)
      })
    return () => {
      alive = false
    }
  }, [activeTenantId])

  const toggle = (id: DashboardIndicatorId) => {
    setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const move = (id: DashboardIndicatorId, dir: -1 | 1) => {
    setSelection((prev) => {
      const idx = prev.indexOf(id)
      if (idx < 0) return prev
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const copy = [...prev]
      copy.splice(idx, 1)
      copy.splice(next, 0, id)
      return copy
    })
  }

  const save = async () => {
    if (!tenant) return
    setSaving(true)
    try {
      const before = tenant.ui?.dashboardIndicators ?? []
      const ui = {
        preferences: tenant.ui?.preferences ?? {
          language: "es" as const,
          theme: "dark" as const,
          tableDensity: "medium" as const,
          currency: "MXN" as const,
          dateFormat: "dd/MM/yyyy" as const,
          timeZone: "America/Mexico_City",
          menuMode: "standard" as const,
          printFormat: "letter" as const,
        },
        visibleModules: tenant.ui?.visibleModules ?? tenant.modules,
        menuMode: tenant.ui?.menuMode ?? "standard",
        tableDensity: tenant.ui?.tableDensity ?? "medium",
        moduleColumns: tenant.ui?.moduleColumns ?? {},
        sharedViewVariants: tenant.ui?.sharedViewVariants ?? {},
        moduleLabels: tenant.ui?.moduleLabels,
        dashboardIndicators: selection,
      }
      const updated = await saveTenant({ ...tenant, ui })
      setTenant(updated)
      await appendAudit({
        tenantId: activeTenantId,
        actorEmail: user?.email ?? "usuario@empresa",
        actorRole: "admin",
        action: "configuracion.indicadores",
        entityType: "configuracion",
        entityId: "dashboard-indicadores",
        summary: `Indicadores del dashboard actualizados (${selection.length} activos)`,
        before: { indicadores: before },
        after: { indicadores: selection },
        source: "ui",
      })
      toast({ title: "Indicadores guardados", description: "El dashboard se actualizará para toda la empresa." })
    } catch {
      toast({ title: "No se pudo guardar", description: "Intenta de nuevo.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const ordered = [
    ...selection
      .map((id) => DASHBOARD_INDICATOR_CATALOG.find((d) => d.id === id))
      .filter((d): d is (typeof DASHBOARD_INDICATOR_CATALOG)[number] => Boolean(d)),
    ...DASHBOARD_INDICATOR_CATALOG.filter((d) => !selection.includes(d.id)),
  ]

  return (
    <Card data-testid="indicator-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" /> Indicadores del dashboard
        </CardTitle>
        <CardDescription>
          Elige qué indicadores ve tu empresa y en qué orden. Los que están apagados no aparecen en el dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {ordered.map((def) => {
          const active = selection.includes(def.id)
          const position = selection.indexOf(def.id)
          return (
            <div
              key={def.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Switch
                  checked={active}
                  onCheckedChange={() => toggle(def.id)}
                  aria-label={`Activar ${def.name}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{def.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {def.description} · Fuente: {def.source}
                  </p>
                </div>
              </div>
              {active && (
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {position + 1}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => move(def.id, -1)} title="Subir" disabled={position === 0}>
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(def.id, 1)}
                    title="Bajar"
                    disabled={position === selection.length - 1}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving || !tenant} data-testid="save-indicators">
            {saving ? "Guardando…" : "Guardar indicadores"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
