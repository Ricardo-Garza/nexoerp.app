import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DismissibleNotice } from "@/components/ui/dismissible-notice"
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
        <p className="text-muted-foreground mt-2">
          Listas con vigencia y canal. El precio de caja se deriva de piezas por caja salvo override auditado.
        </p>
      </div>

      <DismissibleNotice id="precios-historicos" tone="amber" testId="historical-warning">
        <span className="font-medium text-foreground">Listas del 27-ene-2025 marcadas como históricas.</span> Requieren
        validación comercial antes de activarse. Regla de Mayoreo: mínimo{" "}
        {dec.formatMoney(config.wholesaleMinimumOrderMxn)} en una sola exhibición. Puedes cerrar este aviso; la gestión
        vive en Configuración → Datos maestros.
      </DismissibleNotice>

      {views.map(({ list, rows }) => (
        <Card key={list.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle>{list.name}</CardTitle>
              <Badge variant="secondary" className="font-mono">
                {list.code}
              </Badge>
              <Badge variant="outline">{list.channel === "wholesale" ? "Mayoreo" : "Menudeo"}</Badge>
              <Badge variant="outline">
                Vigencia: {list.validFrom} → {list.validUntil ?? "abierta"}
              </Badge>
              {list.status === "historical_requires_validation" && (
                <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300">
                  Histórica — requiere validación
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{list.sourceNote}</p>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio pieza</TableHead>
                  <TableHead className="text-right">Pzas/Caja</TableHead>
                  <TableHead className="text-right">Precio caja (derivado)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.skuCode}>
                    <TableCell className="font-mono text-sm">{r.skuCode}</TableCell>
                    <TableCell className="max-w-72">
                      <span className="block truncate" title={r.skuName}>
                        {r.skuName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{dec.formatMoney(r.unitPrice, list.currency)}</TableCell>
                    <TableCell className="text-right">{r.unitsPerCase}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{dec.formatMoney(r.casePrice, list.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
