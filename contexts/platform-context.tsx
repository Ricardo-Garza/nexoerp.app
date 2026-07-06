"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { resolvePlatformRole, canAccessControlPlane } from "@/lib/platform/platform-admin"
import { ensureTenantsSeeded } from "@/lib/platform/tenant-store"
import type { PlatformRole } from "@/lib/platform/types"

const ACTIVE_TENANT_KEY = "nexo_active_tenant"
const DEFAULT_TENANT = "org-delar"

interface PlatformContextType {
  platformRole: PlatformRole
  isPlatformAdmin: boolean
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
  activeTenantId: DEFAULT_TENANT,
  setActiveTenant: () => {},
  impersonating: false,
  clearImpersonation: () => {},
})

export function PlatformProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activeTenantId, setActiveTenantId] = useState<string>(DEFAULT_TENANT)
  const [impersonating, setImpersonating] = useState(false)

  const platformRole = resolvePlatformRole(user?.email, (user as { platformRole?: string } | null)?.platformRole)
  const isPlatformAdmin = canAccessControlPlane(platformRole)

  // Restaura el tenant activo (o el del perfil del usuario)
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(ACTIVE_TENANT_KEY)
    const fromProfile = (user as { companyId?: string } | null)?.companyId
    setActiveTenantId(stored || fromProfile || DEFAULT_TENANT)
    setImpersonating(Boolean(stored) && stored !== (fromProfile || DEFAULT_TENANT))
  }, [user])

  // Siembra idempotente de tenants al entrar (una sola vez por sesión de navegador)
  useEffect(() => {
    if (!user) return
    ensureTenantsSeeded().catch(() => {
      /* en producción sin permisos aún; el seed dedicado lo cubre */
    })
  }, [user])

  const setActiveTenant = useCallback(
    (tenantId: string) => {
      setActiveTenantId(tenantId)
      const fromProfile = (user as { companyId?: string } | null)?.companyId || DEFAULT_TENANT
      setImpersonating(isPlatformAdmin && tenantId !== fromProfile)
      if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_TENANT_KEY, tenantId)
    },
    [user, isPlatformAdmin],
  )

  const clearImpersonation = useCallback(() => {
    const fromProfile = (user as { companyId?: string } | null)?.companyId || DEFAULT_TENANT
    setActiveTenant(fromProfile)
  }, [user, setActiveTenant])

  return (
    <PlatformContext.Provider
      value={{ platformRole, isPlatformAdmin, activeTenantId, setActiveTenant, impersonating, clearImpersonation }}
    >
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform() {
  return useContext(PlatformContext)
}
