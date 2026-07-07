"use client"

import type { ReactNode } from "react"
import { usePlatform } from "@/contexts/platform-context"

/**
 * Muestra su contenido solo cuando la empresa activa coincide. Evita que
 * secciones con datos de una empresa (p. ej. reglas comerciales de DELAR) se
 * filtren al universo de otra.
 */
export function TenantScope({ tenantId, children }: { tenantId: string; children: ReactNode }) {
  const { activeTenantId } = usePlatform()
  if (activeTenantId !== tenantId) return null
  return <>{children}</>
}
