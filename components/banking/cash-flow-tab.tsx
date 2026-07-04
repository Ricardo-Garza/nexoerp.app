"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBankingData } from "@/hooks/use-banking-data"
import { BarChart3 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function CashFlowTab() {
  const { cashFlowData, loading } = useBankingData()

  const chartData = cashFlowData.map((period) => ({
    name: period.periodo,
    Ingresos: period.ingresosReales,
    Egresos: period.egresosReales,
    Saldo: period.saldoFinal,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Efectivo Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando datos...</div>
          ) : cashFlowData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay datos de flujo de efectivo</p>
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="Egresos" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="Saldo" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por Periodo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : cashFlowData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Periodo</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Ingresos</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Egresos</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowData.map((period, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 text-sm font-medium">{period.periodo}</td>
                      <td className="py-3 px-2 text-sm text-right text-green-600">
                        ${period.ingresosReales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-red-600">
                        ${period.egresosReales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-sm text-right font-bold">
                        ${period.saldoFinal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
