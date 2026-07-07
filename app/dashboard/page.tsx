"use client"

import { useEffect, useState } from "react"
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard"
import { usePlatform } from "@/contexts/platform-context"
import { getTenant } from "@/lib/platform/tenant-store"
import type { Tenant } from "@/lib/platform/types"

export default function DashboardPage() {
  const { activeTenantId } = usePlatform()
  const [tenant, setTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    let alive = true
    getTenant(activeTenantId)
      .then((record) => {
        if (alive) setTenant(record)
      })
      .catch(() => {
        if (alive) setTenant(null)
      })
    return () => {
      alive = false
    }
  }, [activeTenantId])

  return <CustomizableDashboard tenant={tenant} />
}
