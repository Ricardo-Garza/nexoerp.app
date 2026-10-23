"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  resolvePlatformRole,
  canAccessControlPlane as roleCanAccessControlPlane,
  hasPlatformAdminClaim,
} from "@/lib/platform/platform-admin"
import type { PlatformRole } from "@/lib/platform/types"

const ACTIVE_TENANT_KEY = "nexo_active_tenant"
const DEFAULT_TENANT = "org-delar"

interface PlatformContextType {
  platformRole: PlatformRole
  isPlatformAdmin: boolean
  canAccessControlPlane: boolean
  /** Tenant/universo actualmente seleccionado (impersonación de soporte incluida) */
  activeTenantId: string
  setActiveTenant: (tenantId: string) => void
  /** true cuando un admin de plataforma entró a un tenant como soporte */
  impersonating: boolean
  clearImpersonation: () => void
}

const PlatformContext = createContext<PlatformContextType>({
  platformRole: "none",
  isPlatformAdmin: false,
  canAccessControlPlane: false,
  activeTenantId: DEFAULT_TENANT,
  setActiveTenant: () => {},
  impersonating: false,
  clearImpersonation: () => {},
})

export function PlatformProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [activeTenantId, setActiveTenantId] = useState<string>(DEFAULT_TENANT)
  const [impersonating, setImpersonating] = useState(false)

  // Rol de plataforma VERIFICADO (claims del ID token o usuario demo aislado); nunca el correo ni localStorage
  const platformRole = resolvePlatformRole((user as { platformRole?: string } | null)?.platformRole)
  const isPlatformAdmin = hasPlatformAdminClaim(platformRole)
  const canAccessControlPlane = roleCanAccessControlPlane(platformRole)

  const ownTenant = (() => {
    const own = (user as { companyId?: string } | null)?.companyId
    // El respaldo «uid como companyId» no es una empresa real para un administrador de plataforma
    return own && own !== user?.uid ? own : isPlatformAdmin ? undefined : own
  })()

  // Restaura el tenant activo. Solo un administrador de plataforma puede operar una empresa distinta a la suya:
  // para el resto, el valor guardado en localStorage se ignora y se elimina.
  useEffect(() => {
    if (typeof window === "undefined" || loading) return // sin sesión resuelta no se decide ni se purga nada
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(ACTIVE_TENANT_KEY)
      if (!isPlatformAdmin && stored) {
        window.localStorage.removeItem(ACTIVE_TENANT_KEY)
        stored = null
      }
    } catch {
      stored = null
    }
    const next = isPlatformAdmin ? stored || ownTenant || DEFAULT_TENANT : ownTenant || DEFAULT_TENANT
    setActiveTenantId(next)
    setImpersonating(isPlatformAdmin && next !== (ownTenant || DEFAULT_TENANT))
  }, [user, loading, isPlatformAdmin, ownTenant])

  const setActiveTenant = useCallback(
    (tenantId: string) => {
      if (!isPlatformAdmin) return // el frontend no autoriza cambios de empresa
      setActiveTenantId(tenantId)
      setImpersonating(tenantId !== (ownTenant || DEFAULT_TENANT))
      try {
        window.localStorage.setItem(ACTIVE_TENANT_KEY, tenantId)
      } catch {
        /* almacenamiento bloqueado: el cambio vive solo en memoria */
      }
    },
    [isPlatformAdmin, ownTenant],
  )

  const clearImpersonation = useCallback(() => {
    setActiveTenant(ownTenant || DEFAULT_TENANT)
  }, [ownTenant, setActiveTenant])

  return (
    <PlatformContext.Provider
      value={{ platformRole, isPlatformAdmin, canAccessControlPlane, activeTenantId, setActiveTenant, impersonating, clearImpersonation }}
    >
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform() {
  return useContext(PlatformContext)
}
