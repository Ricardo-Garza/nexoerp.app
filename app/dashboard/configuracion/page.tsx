import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dec } from "@/lib/domain/shared/decimal"
import { getCommercialConfig, getDataQualityIssues } from "@/lib/server/queries"
import { UserPreferencesCard } from "@/components/erp/user-preferences-card"
import { IndicatorSettingsCard } from "@/components/dashboard/indicator-settings-card"
import { TenantScope } from "@/components/erp/tenant-scope"
import {
  CompanyConfigurationSummary,
  ConfigurationHeading,
  ConfigurationShortcutGrid,
} from "@/components/erp/configuration-copy"

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
      <ConfigurationHeading />

      <UserPreferencesCard />

      <CompanyConfigurationSummary />

      <IndicatorSettingsCard />

      <ConfigurationShortcutGrid />

      <TenantScope tenantId="org-delar">
        <Card>
          <CardHeader>
            <CardTitle>Matriz de discrepancias ({issues.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Dominio</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Problema</TableHead>
                  <TableHead>Accion requerida</TableHead>
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
            <CardTitle>Reglas comerciales y logisticas parametrizadas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Valores de referencia del negocio, configurables por empresa y sin reglas escondidas en el codigo.
            </p>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium">Minimo mayoreo (una exhibicion)</dt>
                <dd className="text-muted-foreground">
                  {dec.formatMoney(config.wholesaleMinimumOrderMxn)} -{" "}
                  {config.wholesaleRuleStatus === "historical_requires_validation" ? "historico, por validar" : "aprobado"}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Entrega local sin costo desde</dt>
                <dd className="text-muted-foreground">{dec.formatMoney(config.freeLocalDeliveryMinimumMxn)}</dd>
              </div>
              <div>
                <dt className="font-medium">Ventana de entrega</dt>
                <dd className="text-muted-foreground">
                  {config.deliveryWindow.start}-{config.deliveryWindow.end}, dias habiles, {config.advanceBusinessDays} dia(s)
                  habil(es) de anticipacion
                </dd>
              </div>
              <div>
                <dt className="font-medium">Zonas de entrega</dt>
                <dd className="text-muted-foreground">{config.deliveryZones.join(", ")}</dd>
              </div>
              <div>
                <dt className="font-medium">Recoleccion</dt>
                <dd className="text-muted-foreground">
                  {config.pickupAddress} - {config.pickupHours.open}-{config.pickupHours.close}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Zona horaria / moneda</dt>
                <dd className="text-muted-foreground">
                  {config.timezone} - {config.baseCurrency}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </TenantScope>
    </div>
  )
}
