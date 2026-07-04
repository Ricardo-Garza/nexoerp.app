import { InventoryLots, type LotRowView } from "@/components/delar/inventory-lots"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthMode } from "@/lib/config/auth-mode"
import { hasPermission } from "@/lib/domain/rbac/roles"
import { getDashboardKpis, getInventoryLotRows } from "@/lib/server/queries"
import { getSessionUser } from "@/lib/server/session"
import { getStore } from "@/lib/server/store"

export const dynamic = "force-dynamic"

export default async function InventarioLotesPage() {
  const rows = getInventoryLotRows()
  const kpis = getDashboardKpis()
  const store = getStore()
  const user = await getSessionUser()
  const mutationsEnabled = getAuthMode() === "demo" && user !== null

  const lotRows: LotRowView[] = rows.map((r) => ({
    lotId: r.lot.id,
    lotCode: r.lot.lotCode,
    skuCode: r.skuCode,
    skuName: r.skuName,
    warehouseName: r.warehouse?.name ?? "—",
    locationName: r.location ? `${r.location.code} · ${r.location.name}` : "—",
    expiryDate: r.lot.expiryDate,
    expiresInDays: r.expiresInDays,
    qualityStatus: r.lot.qualityStatus,
    available: r.available,
    usable: r.usable,
  }))

  const skuOptions = [...store.skus.values()]
    .filter((s) => s.active)
    .sort((a, b) => (a.sku < b.sku ? -1 : 1))
    .map((s) => ({ sku: s.sku, name: s.name, expiryRequired: s.expiryRequired }))

  const locationOptions = [...store.locations.values()].map((l) => {
    const wh = store.warehouses.get(l.warehouseId)
    return { id: l.id, label: `${wh?.code ?? ""} / ${l.code} — ${l.name}` }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Inventario por Lote</h1>
        <p className="text-muted-foreground mt-2">
          Existencias derivadas del ledger de movimientos (append-only). FEFO sugiere el lote con caducidad más
          próxima; lotes vencidos, en cuarentena, rechazados o bloqueados no son asignables.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Piezas liberadas disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{Number(kpis.releasedPieces)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lotes en cuarentena/pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{kpis.quarantineLots}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lotes por vencer (≤60 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{kpis.expiringSoonLots}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lotes vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{kpis.expiredLots}</p>
          </CardContent>
        </Card>
      </div>

      <InventoryLots
        rows={lotRows}
        skuOptions={skuOptions}
        locationOptions={locationOptions}
        canReceive={user ? hasPermission(user.role, "inventory.receive") : false}
        canQuality={user ? hasPermission(user.role, "lot.release") : false}
        mutationsEnabled={mutationsEnabled}
      />
    </div>
  )
}
