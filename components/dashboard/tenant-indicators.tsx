"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePlatform } from "@/contexts/platform-context"
import { DASHBOARD_INDICATOR_CATALOG, getIndicatorDefinition } from "@/lib/platform/indicators"
import type { DashboardIndicatorId, Tenant } from "@/lib/platform/types"
import {
  buildStockPositions,
  loadSoleilInventory,
  loadSoleilMovements,
  loadSoleilPriceEntries,
  loadSoleilProducts,
} from "@/lib/domain/soleilwire/client-data"
import { SOLEIL_TENANT_ID, getSoleilOpportunities } from "@/lib/domain/soleilwire"
import { readImportedData } from "@/lib/platform/tenant-store"

/**
 * Tablero de indicadores configurables por empresa. Muestra solo los
 * indicadores elegidos en la configuración del tenant, en su orden. Los
 * valores salen de datos reales capturados/importados; si aún no hay datos,
 * el indicador lo dice tal cual (no se inventan cifras).
 */

export interface IndicatorValue {
  id: DashboardIndicatorId
  value: string
  detail: string
  href?: string
  pending?: boolean
}

export function useIndicatorValues(tenant: Tenant | null): IndicatorValue[] {
  const { activeTenantId } = usePlatform()
  const [values, setValues] = useState<IndicatorValue[]>([])

  const configured = useMemo(
    () => tenant?.ui?.dashboardIndicators ?? [],
    [tenant],
  )

  useEffect(() => {
    if (!tenant || configured.length === 0) {
      setValues([])
      return
    }
    const isSoleil = activeTenantId === SOLEIL_TENANT_ID

    const products = loadSoleilProducts(activeTenantId)
    const prices = loadSoleilPriceEntries(activeTenantId)
    const inventory = loadSoleilInventory(activeTenantId)
    const movements = loadSoleilMovements(activeTenantId)
    const positions = buildStockPositions(inventory, movements)
    const opportunities = isSoleil ? getSoleilOpportunities() : []
    const importedOpps = readImportedData(activeTenantId, "opportunities")
    const bankMovs = readImportedData(activeTenantId, "bankMovements")
    const customers = readImportedData(activeTenantId, "customers")
    const prospects = readImportedData(activeTenantId, "prospects")

    const priceBySku = new Map(prices.map((p) => [p.sku, p]))
    const sinPrecio = products.filter(
      (p) => p.activo && p.precioBase === null && (priceBySku.get(p.sku)?.precioUnitario ?? null) === null,
    ).length
    const minBySku = new Map(products.map((p) => [p.sku, p.stockMinimo]))
    const disponibleTotal = positions.reduce((acc, pos) => acc + pos.disponible, 0)
    const capturado = positions.some((pos) => pos.capturado)
    let stockBajo = 0
    for (const pos of positions) {
      const min = minBySku.get(pos.sku)
      if (pos.capturado && min !== null && min !== undefined && pos.disponible < min) stockBajo++
    }
    const oppCount = opportunities.length + importedOpps.length

    const compute = (id: DashboardIndicatorId): IndicatorValue => {
      switch (id) {
        case "productosSinPrecio":
          return {
            id,
            value: String(sinPrecio),
            detail: sinPrecio > 0 ? "SKUs activos pendientes de precio" : "Catálogo con precios completos",
            href: "/dashboard/productos-precios",
          }
        case "stockBajo":
          return {
            id,
            value: capturado ? String(stockBajo) : "—",
            detail: capturado ? "SKUs debajo de su mínimo" : "Sin existencias capturadas aún",
            href: "/dashboard/inventory",
            pending: !capturado,
          }
        case "inventarioDisponible":
          return {
            id,
            value: capturado ? disponibleTotal.toLocaleString("es-MX") : "—",
            detail: capturado ? "Unidades disponibles (todas las unidades)" : "Importa o captura el inventario inicial",
            href: "/dashboard/inventory",
            pending: !capturado,
          }
        case "oportunidadesCrm":
          return {
            id,
            value: String(oppCount),
            detail: oppCount > 0 ? "Oportunidades en el embudo" : "Sin oportunidades registradas",
            href: "/dashboard/crm",
          }
        case "actividadComercial": {
          const total = customers.length + prospects.length
          return {
            id,
            value: String(total),
            detail: total > 0 ? "Clientes y prospectos registrados" : "Importa tu cartera para empezar",
            href: "/dashboard/clients",
          }
        }
        case "movimientosBancarios":
          return {
            id,
            value: String(bankMovs.length),
            detail: bankMovs.length > 0 ? "Movimientos importados" : "Importa tu estado de cuenta",
            href: "/dashboard/banking",
          }
        default: {
          const def = getIndicatorDefinition(id)
          return {
            id,
            value: "—",
            detail: `Se activa al operar ${def?.source ?? "el módulo"}`,
            pending: true,
          }
        }
      }
    }

    setValues(configured.map(compute))
  }, [tenant, configured, activeTenantId])

  return values
}

export function TenantIndicatorsBoard({ tenant }: { tenant: Tenant | null }) {
  const values = useIndicatorValues(tenant)

  if (!tenant || values.length === 0) return null

  return (
    <div data-testid="tenant-indicators">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Indicadores de {tenant.name}</h2>
        <Link href="/dashboard/configuracion" className="text-xs text-muted-foreground hover:text-foreground">
          Configurar indicadores
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => {
          const def = getIndicatorDefinition(v.id)
          const card = (
            <Card key={v.id} className="h-full transition-colors hover:border-primary/40">
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">{def?.name ?? v.id}</p>
                  {v.pending && (
                    <Badge variant="outline" className="text-[10px]">
                      Por conectar
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">{v.value}</p>
                <p className="text-xs text-muted-foreground">{v.detail}</p>
              </CardContent>
            </Card>
          )
          return v.href ? (
            <Link key={v.id} href={v.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={v.id}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}

export { DASHBOARD_INDICATOR_CATALOG }
