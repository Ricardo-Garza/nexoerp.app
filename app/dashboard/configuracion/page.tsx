import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dec } from "@/lib/domain/shared/decimal"
import { getCommercialConfig, getDataQualityIssues } from "@/lib/server/queries"
import { UserPreferencesCard } from "@/components/erp/user-preferences-card"

export const dynamic = "force-dynamic"

const SEVERITY: Record<string, string> = {
  high: "text-red-700 border-red-300 dark:text-red-300",
  medium: "text-amber-700 border-amber-300 dark:text-amber-300",
  low: "text-slate-600 border-slate-300 dark:text-slate-300",
}

export default async function ConfiguracionPage() {
  const issues = getDataQualityIssues()
  const config = getCommercialConfig()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Reglas comerciales parametrizadas, control interno de calidad de datos y módulos auxiliares de la empresa.
        </p>
      </div>

      <UserPreferencesCard />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/attributes" className="rounded-lg border p-4 hover:bg-accent transition-colors">
          <p className="font-medium">Atributos de producto</p>
          <p className="text-sm text-muted-foreground mt-1">Atributos y variantes viven dentro de Configuración</p>
        </Link>
        <Link href="/dashboard/field-services" className="rounded-lg border p-4 hover:bg-accent transition-colors">
          <p className="font-medium">Servicio en campo</p>
          <p className="text-sm text-muted-foreground mt-1">Módulo auxiliar fuera del menú principal</p>
        </Link>
        <Link href="/dashboard/eprocurement" className="rounded-lg border p-4 hover:bg-accent transition-colors">
          <p className="font-medium">Compras digitales</p>
          <p className="text-sm text-muted-foreground mt-1">Módulo auxiliar fuera del menú principal</p>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de discrepancias ({issues.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Dominio</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Problema</TableHead>
                <TableHead>Acción requerida</TableHead>
                <TableHead>Severidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-mono text-sm">{issue.id}</TableCell>
                  <TableCell>{issue.domain}</TableCell>
                  <TableCell>{issue.entity}</TableCell>
                  <TableCell className="max-w-80 text-sm">{issue.issue}</TableCell>
                  <TableCell className="max-w-80 text-sm text-muted-foreground">{issue.requiredAction}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={SEVERITY[issue.severity]}>
                      {issue.severity === "high" ? "Alta" : issue.severity === "medium" ? "Media" : "Baja"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reglas comerciales y logísticas parametrizadas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Valores de referencia del negocio, configurables por organización y sin reglas escondidas en el código.
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="font-medium">Mínimo Mayoreo (una exhibición)</dt>
              <dd className="text-muted-foreground">
                {dec.formatMoney(config.wholesaleMinimumOrderMxn)} -{" "}
                {config.wholesaleRuleStatus === "historical_requires_validation" ? "histórico, por validar" : "aprobado"}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Entrega local sin costo desde</dt>
              <dd className="text-muted-foreground">{dec.formatMoney(config.freeLocalDeliveryMinimumMxn)}</dd>
            </div>
            <div>
              <dt className="font-medium">Ventana de entrega</dt>
              <dd className="text-muted-foreground">
                {config.deliveryWindow.start}-{config.deliveryWindow.end}, días hábiles, {config.advanceBusinessDays} día(s)
                hábil(es) de anticipación
              </dd>
            </div>
            <div>
              <dt className="font-medium">Zonas de entrega</dt>
              <dd className="text-muted-foreground">{config.deliveryZones.join(", ")}</dd>
            </div>
            <div>
              <dt className="font-medium">Recolección</dt>
              <dd className="text-muted-foreground">
                {config.pickupAddress} · {config.pickupHours.open}-{config.pickupHours.close}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Zona horaria / moneda</dt>
              <dd className="text-muted-foreground">
                {config.timezone} · {config.baseCurrency}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
