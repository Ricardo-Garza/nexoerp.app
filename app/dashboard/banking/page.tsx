"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CreditCard, TrendingUp, DollarSign, Receipt, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBankingData } from "@/hooks/use-banking-data"
import { BankAccountsTab } from "@/components/banking/bank-accounts-tab"
import { ChecksTab } from "@/components/banking/checks-tab"
import { TransfersTab } from "@/components/banking/transfers-tab"
import { ReconciliationTab } from "@/components/banking/reconciliation-tab"
import { CashFlowTab } from "@/components/banking/cash-flow-tab"
import { MovementsTab } from "@/components/banking/movements-tab"
import { Badge } from "@/components/ui/badge"

export default function BankingPage() {
  const { accounts, recentTransactions, totalBalance, monthlyIncome, monthlyExpenses, loading, activeAccountsCount } =
    useBankingData()

  const [selectedTab, setSelectedTab] = useState("overview")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bancos</h1>
        <p className="text-muted-foreground mt-2">
          Gestión integral de cuentas bancarias, pagos, cobros y conciliación
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Building2 className="w-8 h-8 text-primary" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">Saldo Total</p>
            <p className="text-2xl font-bold mt-1">
              ${totalBalance.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">Cuentas Activas</p>
            <p className="text-2xl font-bold mt-1">{activeAccountsCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">Ingresos del Mes</p>
            <p className="text-2xl font-bold mt-1">
              ${monthlyIncome.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">Egresos del Mes</p>
            <p className="text-2xl font-bold mt-1">
              ${monthlyExpenses.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          <TabsTrigger value="checks">Cheques</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
          <TabsTrigger value="conciliation">Conciliación</TabsTrigger>
          <TabsTrigger value="cashflow">Flujo de Efectivo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bank Accounts Card */}
            <Card>
              <CardHeader>
                <CardTitle>Cuentas Bancarias</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No hay cuentas bancarias registradas</p>
                    <Button onClick={() => setSelectedTab("accounts")} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Cuenta
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{account.alias || account.banco}</p>
                            <p className="text-sm text-muted-foreground">{account.numeroEnmascarado}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(account.saldoActual || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}{" "}
                            {account.moneda}
                          </p>
                          <Badge
                            variant={account.estado === "activa" ? "outline" : "secondary"}
                            className="mt-1 capitalize"
                          >
                            {account.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transacciones Recientes</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedTab("accounts")}>
                  Ver Todas
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay transacciones registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((trx) => (
                      <div key={trx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{trx.concepto}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {trx.fecha instanceof Date
                              ? trx.fecha.toLocaleDateString("es-MX")
                              : new Date(trx.fecha as string).toLocaleDateString("es-MX")}{" "}
                            • {trx.referencia || "Sin referencia"}
                          </p>
                        </div>
                        <p className={`font-semibold ${trx.tipo === "ingreso" ? "text-green-500" : "text-red-500"}`}>
                          {trx.tipo === "ingreso" ? "+" : "-"}$
                          {Math.abs(trx.monto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movements">
          <MovementsTab />
        </TabsContent>

        <TabsContent value="accounts">
          <BankAccountsTab />
        </TabsContent>

        <TabsContent value="checks">
          <ChecksTab />
        </TabsContent>

        <TabsContent value="transfers">
          <TransfersTab />
        </TabsContent>

        <TabsContent value="conciliation">
          <ReconciliationTab />
        </TabsContent>

        <TabsContent value="cashflow">
          <CashFlowTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
