"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { TopProducts } from "@/components/dashboard/top-products"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { TenantIndicatorsBoard } from "@/components/dashboard/tenant-indicators"
import { Button } from "@/components/ui/button"
import { usePlatform } from "@/contexts/platform-context"
import { getTenant } from "@/lib/platform/tenant-store"
import type { Tenant } from "@/lib/platform/types"

const DELAR_TENANT_ID = "org-delar"

export default function DashboardPage() {
  const { activeTenantId } = usePlatform()
  const [tenant, setTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    let alive = true
    getTenant(activeTenantId)
      .then((t) => {
        if (alive) setTenant(t)
      })
      .catch(() => {
        if (alive) setTenant(null)
      })
    return () => {
      alive = false
    }
  }, [activeTenantId])

  const isDelar = activeTenantId === DELAR_TENANT_ID
  const hasIndicators = (tenant?.ui?.dashboardIndicators?.length ?? 0) > 0

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.45)] sm:p-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 18% 12%, rgba(56,189,248,0.25), transparent 45%), radial-gradient(circle at 80% 20%, rgba(14,165,233,0.2), transparent 45%), radial-gradient(circle at 50% 90%, rgba(16,185,129,0.12), transparent 55%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(7,10,23,0.94))",
      }}
    >
      <div className="absolute -left-24 -top-20 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="absolute -right-10 top-24 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute bottom-6 left-1/3 h-56 w-56 rounded-full bg-indigo-400/10 blur-[120px]" />

      <div className="relative space-y-6">
        {isDelar ? (
          <>
            <DashboardStats />

            <div className="grid gap-6 lg:grid-cols-2">
              <SalesChart />
              <TopProducts />
            </div>

            <RecentOrders />
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold">{tenant?.name ?? "Dashboard"}</h1>
              <p className="text-sm text-white/70 mt-1">
                {tenant?.contact?.businessLine ?? "Panel de indicadores de la empresa"}
              </p>
            </div>
            {hasIndicators ? (
              <TenantIndicatorsBoard tenant={tenant} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-3">
                <p className="text-sm text-white/80">
                  Esta empresa aún no tiene indicadores configurados en su dashboard.
                </p>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dashboard/configuracion">Configurar indicadores</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
