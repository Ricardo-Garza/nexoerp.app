import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dec } from "@/lib/domain/shared/decimal"
import { getSkuDetail } from "@/lib/server/queries"
import { LotQualityBadge } from "@/components/delar/lot-quality-badge"

export const dynamic = "force-dynamic"

const KIND_LABELS: Record<string, string> = {
  resale: "Reventa",
  manufactured: "Fabricado",
  repacked: "Reempacado",
  tolled: "Maquilado",
  kit: "Kit",
  service: "Servicio",
}

export default async function SkuDetailPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku: skuCode } = await params
  const detail = getSkuDetail(decodeURIComponent(skuCode))
  if (!detail) notFound()

  const { sku } = detail

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/catalogo"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Volver al catálogo
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-balance">{sku.name}</h1>
          <Badge variant="secondary" className="font-mono">
            {sku.sku}
          </Badge>
          {sku.dataStatus !== "validated" && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300">
              Datos históricos: requieren validación
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-2">
          {detail.brandName} · Familia {detail.familyName} · {sku.category} · {KIND_LABELS[sku.kind] ?? sku.kind}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presentación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {sku.presentationType} {sku.netContent ? `${sku.netContent} ${sku.netUnit}` : "(contenido por validar)"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{sku.unitsPerCase} pieza(s) por caja</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Códigos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              EAN pieza: <span className="font-mono">{sku.ean ?? "pendiente de validación"}</span>
            </p>
            <p>
              DUN caja: <span className="font-mono">{sku.dun ?? "pendiente de validación"}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Menudeo (histórico 2025)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {detail.retail ? dec.formatMoney(detail.retail.unitPrice) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Caja: {detail.retail ? dec.formatMoney(detail.retail.casePrice) : "—"}
              {detail.retail?.casePriceIsOverride ? " (override)" : " (derivado)"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mayoreo (histórico 2025)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {detail.wholesale ? dec.formatMoney(detail.wholesale.unitPrice) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Caja: {detail.wholesale ? dec.formatMoney(detail.wholesale.casePrice) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {detail.retail && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Explicación del precio aplicado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {detail.retail.explanation.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lotes y trazabilidad {sku.trackLot ? "" : "(SKU sin lote obligatorio)"}</CardTitle>
          {detail.fefoOrder.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Orden FEFO sugerido: <span className="font-mono">{detail.fefoOrder.join(" → ")}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Caducidad</TableHead>
                <TableHead>Estado de calidad</TableHead>
                <TableHead className="text-right">Disponible (pzas)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.lots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Sin lotes registrados. Recibe inventario desde “Inventario por Lote”.
                  </TableCell>
                </TableRow>
              )}
              {detail.lots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-mono text-sm">{lot.lotCode}</TableCell>
                  <TableCell>{lot.expiryDate ?? "N/A"}</TableCell>
                  <TableCell>
                    <LotQualityBadge status={lot.qualityStatus} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {lot.stock.reduce((acc, r) => acc + dec.toNumber(r.available), 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
