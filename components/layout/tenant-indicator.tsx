"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Shield, Building2, ChevronDown, LogOut } from "lucide-react"
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
import { listTenants } from "@/lib/platform/tenant-store"
import type { Tenant } from "@/lib/platform/types"

/**
 * Indicador de universo activo + acceso al Control Plane, visible en el header.
 * Para admins de plataforma permite cambiar de empresa (impersonación de soporte)
 * y regresar rápido al panel Nexo.
 */
export function TenantIndicator() {
  const { isPlatformAdmin, activeTenantId, setActiveTenant, impersonating } = usePlatform()
  const [tenants, setTenants] = useState<Tenant[]>([])

  useEffect(() => {
    listTenants().then(setTenants)
  }, [])

  const active = tenants.find((t) => t.id === activeTenantId)

  if (!isPlatformAdmin) {
    // Usuario normal: solo muestra su empresa
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
          <Button variant="outline" size="sm" className="gap-1.5" data-testid="tenant-switcher">
            <Building2 className="w-4 h-4" />
            <span className="max-w-[140px] truncate">{active?.name ?? "Selecciona empresa"}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Nexo Control Plane
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/admin">Ir al panel de administración</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar de universo</DropdownMenuLabel>
          {tenants.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setActiveTenant(t.id)}
              data-testid={`switch-${t.id}`}
              className="gap-2"
            >
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ background: t.branding.primaryColor }}
              >
                {t.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate">{t.name}</span>
              {t.id === activeTenantId && <span className="ml-auto text-xs text-primary">activo</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
