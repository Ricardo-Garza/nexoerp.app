"use client"

import { useEffect, useState } from "react"
import { InventoryStockView } from "@/components/soleil/inventory-stock-view"
import { usePlatform } from "@/contexts/platform-context"
import { getTenant } from "@/lib/platform/tenant-store"

export default function InventarioExistenciasPage() {
  const { activeTenantId } = usePlatform()
  const [tenantName, setTenantName] = useState("")

  useEffect(() => {
    let alive = true
    getTenant(activeTenantId)
      .then((t) => {
        if (alive) setTenantName(t?.name ?? "")
      })
      .catch(() => {
        if (alive) setTenantName("")
      })
    return () => {
      alive = false
    }
  }, [activeTenantId])

  return <InventoryStockView tenantName={tenantName} />
}
