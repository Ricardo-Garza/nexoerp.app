"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Shield, Building2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePlatform } from "@/contexts/platform-context"
import { getTenant, listTenants } from "@/lib/platform/tenant-store"
import type { Tenant } from "@/lib/platform/types"

/**
 * Indicador de empresa activa y acceso a Administración Nexo para usuarios internos.
 */
export function TenantIndicator() {
  const { isPlatformAdmin, activeTenantId, setActiveTenant, impersonating } = usePlatform()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    // Solo plataforma lista todas las empresas; el resto consulta únicamente la suya (las reglas lo exigen)
    const load = isPlatformAdmin ? listTenants() : getTenant(activeTenantId).then((t) => (t ? [t] : []))
    load
      .then((list) => {
        if (cancelled) return
        setTenants(list)
        if (isPlatformAdmin && list.length > 0 && !list.some((tenant) => tenant.id === activeTenantId)) {
          setActiveTenant(list[0].id)
        }
      })
      .catch(() => {
        if (cancelled) return
        setTenants([])
        setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isPlatformAdmin, activeTenantId, setActiveTenant])

  const active = tenants.find((tenant) => tenant.id === activeTenantId)

  if (!isPlatformAdmin) {
    return active ? (
      <Badge variant="outline" className="gap-1.5">
        <Building2 className="w-3.5 h-3.5" />
        {active.name}
      </Badge>
    ) : null
  }

  return (
    <div className="flex items-center gap-2">
      {impersonating && (
        <Badge variant="secondary" className="gap-1 hidden sm:flex" data-testid="impersonation-badge">
          Soporte
        </Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5" data-testid="tenant-switcher" aria-label="Empresa activa">
            <Building2 className="w-4 h-4" />
            <span className="max-w-[160px] truncate">
              {active?.name ?? (loading ? "Cargando empresas…" : "Selecciona empresa")}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Administración Nexo
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/admin">Ir al panel de administración</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar de empresa</DropdownMenuLabel>
          {loadError && <DropdownMenuItem disabled>No fue posible cargar las empresas</DropdownMenuItem>}
          {!loading && !loadError && tenants.length === 0 && (
            <DropdownMenuItem disabled>No hay empresas registradas</DropdownMenuItem>
          )}
          {tenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => setActiveTenant(tenant.id)}
              data-testid={`switch-${tenant.id}`}
              className="gap-2"
            >
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ background: tenant.branding.primaryColor }}
              >
                {tenant.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate">{tenant.name}</span>
              {tenant.id === activeTenantId && <span className="ml-auto text-xs text-primary">activo</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
