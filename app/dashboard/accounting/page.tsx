"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  FileText,
  PieChart,
  BookOpen,
  Download,
  Upload,
  BarChart3,
} from "lucide-react"
import { useAccountingData } from "@/hooks/use-accounting-data"
import { NuevaPolizaDialog } from "@/components/accounting/nueva-poliza-dialog"
import { NuevaCuentaDialog } from "@/components/accounting/nueva-cuenta-dialog"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { AccountsTable } from "@/components/accounting/accounts-table"
import { JournalEntriesTable } from "@/components/accounting/journal-entries-table"
import { FinancialStatements } from "@/components/accounting/financial-statements"
import { TaxReports } from "@/components/accounting/tax-reports"

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState("catalog")
  const [searchQuery, setSearchQuery] = useState("")
  const [nuevaPolizaOpen, setNuevaPolizaOpen] = useState(false)
  const [nuevaCuentaOpen, setNuevaCuentaOpen] = useState(false)

  const {
    ledgerAccounts,
    journalEntries,
    balanceGeneral,
    ingresosDelMes,
    egresosDelMes,
    polizasDelMes,
    polizasPendientes,
    loading,
    addEntry,
    addAccount,
  } = useAccountingData()

  const router = useRouter()

  const tabs = [
    { id: "catalog", label: "Catálogo de Cuentas", icon: BookOpen },
    { id: "entries", label: "Pólizas", icon: FileText },
    { id: "financial", label: "Estados Financieros", icon: BarChart3 },
    { id: "ratios", label: "Razones Financieras", icon: PieChart },
    { id: "taxes", label: "Impuestos", icon: Calculator },
    { id: "sat", label: "Contabilidad Electrónica", icon: Upload },
  ]

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "$0.00"
    }
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function handleExportToExcel() {
    if (!ledgerAccounts || ledgerAccounts.length === 0) {
      alert("No hay cuentas para exportar")
      return
    }

    const data = ledgerAccounts.map((acc) => ({
      Código: acc.codigo,
      Nombre: acc.nombre,
      Tipo: acc.tipo,
      Nivel: acc.nivel,
      Saldo: acc.saldo,
      Movimientos: acc.movimientos,
      Estado: acc.activa ? "Activa" : "Inactiva",
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Catálogo de Cuentas")
    XLSX.writeFile(wb, `catalogo-cuentas-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
<div className="flex gap-2">
          <Button variant="outline" onClick={handleExportToExcel} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Exportar a Excel
          </Button>
          <Button onClick={() => setNuevaPolizaOpen(true)} disabled={loading}>
            <FileText className="w-4 h-4 mr-2" />
            Nueva Póliza
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Balance General</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(balanceGeneral)}</p>
                {loading && <p className="text-xs text-muted-foreground mt-1">Calculando...</p>}
              </div>
              <Calculator className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(ingresosDelMes)}</p>
                {loading && <p className="text-xs text-muted-foreground mt-1">Calculando...</p>}
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Egresos del Mes</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(egresosDelMes)}</p>
                {loading && <p className="text-xs text-muted-foreground mt-1">Calculando...</p>}
              </div>
              <TrendingDown className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "catalog" && (
        <AccountsTable
          ledgerAccounts={ledgerAccounts}
          loading={loading}
          formatCurrency={formatCurrency}
          onNuevaCuenta={() => setNuevaCuentaOpen(true)}
        />
      )}
      {activeTab === "entries" && (
        <JournalEntriesTable
          journalEntries={journalEntries}
          loading={loading}
          polizasDelMes={polizasDelMes}
          polizasPendientes={polizasPendientes}
          formatCurrency={formatCurrency}
          onNuevaPoliza={() => setNuevaPolizaOpen(true)}
        />
      )}
      {activeTab === "financial" && (
        <FinancialStatements ledgerAccounts={ledgerAccounts} loading={loading} formatCurrency={formatCurrency} />
      )}
      {activeTab === "ratios" && <RatiosTab ledgerAccounts={ledgerAccounts} loading={loading} />}
      {activeTab === "taxes" && <TaxReports formatCurrency={formatCurrency} />}
      {activeTab === "sat" && <SATTab />}

      {/* Dialogs */}
      <NuevaPolizaDialog
        open={nuevaPolizaOpen}
        onOpenChange={setNuevaPolizaOpen}
        onSave={async (entry) => {
          await addEntry(entry)
        }}
        ledgerAccounts={ledgerAccounts.filter((acc) => acc.acumulaSaldo)}
      />

      <NuevaCuentaDialog open={nuevaCuentaOpen} onOpenChange={setNuevaCuentaOpen} onSave={async (account) => {
          await addAccount(account)
        }}
      />
    </div>
  )
}

function RatiosTab({ ledgerAccounts, loading }: { ledgerAccounts: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Calculando razones financieras...</p>
      </div>
    )
  }

  if (ledgerAccounts.length === 0) {
    return (
      <div className="text-center py-12">
        <PieChart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-lg mb-2">No hay datos para calcular razones</h3>
        <p className="text-muted-foreground">Configura tu catálogo de cuentas para ver las razones financieras</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Razones Financieras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Cálculo automático de razones financieras en desarrollo...</p>
            <p className="text-sm mt-2">Se calcularán automáticamente con base en los datos del catálogo de cuentas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SATTab() {
  return (
    <div className="space-y-4">
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Upload className="w-8 h-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Contabilidad Electrónica</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Genera fácilmente todos los archivos XML requeridos por el SAT para cumplir con la obligación de
                contabilidad electrónica. Los archivos se generan automáticamente desde los movimientos contables del
                sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archivos XML para el SAT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Generación de archivos XML para SAT en desarrollo...</p>
            <p className="text-sm mt-2">Se generarán automáticamente desde el catálogo de cuentas y pólizas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
