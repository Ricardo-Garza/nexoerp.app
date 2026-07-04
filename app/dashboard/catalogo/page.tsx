import { CatalogTable, type CatalogTableRow } from "@/components/delar/catalog-table"
import { getCatalogFacets, getCatalogRows } from "@/lib/server/queries"

export const dynamic = "force-dynamic"

export default async function CatalogoPage() {
  const rows = getCatalogRows()
  const facets = getCatalogFacets()

  const tableRows: CatalogTableRow[] = rows.map((r) => ({
    sku: r.sku.sku,
    name: r.sku.name,
    brandName: r.brandName,
    familyName: r.familyName,
    category: r.sku.category,
    presentationType: r.sku.presentationType,
    netContent: r.sku.netContent,
    netUnit: r.sku.netUnit,
    unitsPerCase: r.sku.unitsPerCase,
    ean: r.sku.ean,
    dun: r.sku.dun,
    retailUnit: r.retail?.unitPrice ?? null,
    wholesaleUnit: r.wholesale?.unitPrice ?? null,
    requiresValidation: r.retail?.requiresValidation ?? r.sku.dataStatus !== "validated",
    availablePieces: r.availablePieces,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Catálogo</h1>
        <p className="text-muted-foreground mt-2">
          {tableRows.length} presentaciones normalizadas por marca, familia y empaque. Precios 2025 marcados como
          históricos hasta validación comercial.
        </p>
      </div>
      <CatalogTable
        rows={tableRows}
        categories={facets.categories}
        brands={facets.brands.map((b) => b.name).sort()}
      />
    </div>
  )
}
