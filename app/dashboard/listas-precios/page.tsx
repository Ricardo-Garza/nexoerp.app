import { DismissibleNotice } from "@/components/ui/dismissible-notice"
import { PriceListTable } from "@/components/pricing/price-list-table"
import { dec } from "@/lib/domain/shared/decimal"
import { getCommercialConfig, getPriceListViews } from "@/lib/server/queries"

export const dynamic = "force-dynamic"

export default async function ListasPreciosPage() {
  const views = getPriceListViews()
  const config = getCommercialConfig()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Listas de Precios</h1>
        <p className="mt-2 text-muted-foreground">
          Listas con vigencia, canal y precios derivados por presentación.
        </p>
      </div>

      <DismissibleNotice id="precios-historicos" tone="amber" testId="historical-warning">
        <span className="font-medium text-foreground">Hay listas históricas pendientes de validar.</span> Antes de
        activarlas confirma precios y vigencia comercial. Regla de mayoreo: mínimo{" "}
        {dec.formatMoney(config.wholesaleMinimumOrderMxn)} en una sola exhibición.
      </DismissibleNotice>

      {views.map(({ list, rows }) => (
        <PriceListTable key={list.id} list={list} rows={rows} />
      ))}
    </div>
  )
}
