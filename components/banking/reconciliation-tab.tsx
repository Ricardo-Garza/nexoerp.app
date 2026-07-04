"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileCheck, AlertCircle } from "lucide-react"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import type { BankAccount, BankStatement, BankTransaction, ReconciliationItem } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export function ReconciliationTab() {
  const { items: accounts } = useFirestore<BankAccount>(COLLECTIONS.bankAccounts, [], true)
  const { items: statements, create: createStatement } = useFirestore<BankStatement>(
    COLLECTIONS.bankStatements,
    [],
    true,
  )
  const { items: transactions } = useFirestore<BankTransaction>(COLLECTIONS.bankTransactions, [], true)
  const { create: createReconciliationItem } = useFirestore<ReconciliationItem>(
    COLLECTIONS.reconciliationItems,
    [],
    true,
  )
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [reconciling, setReconciling] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedAccount) {
      toast({
        title: "Error",
        description: "Selecciona una cuenta y un archivo CSV",
        variant: "destructive",
      })
      return
    }

    setReconciling(true)

    try {
      // Read CSV file
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("El archivo CSV está vacío o no tiene datos")
      }

      // Parse CSV (simple parser - assumes: Fecha,Concepto,Monto,Referencia)
      const bankTransactions: Array<{ fecha: string; concepto: string; monto: number; referencia: string }> = []

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",")
        if (parts.length >= 3) {
          bankTransactions.push({
            fecha: parts[0]?.trim() || "",
            concepto: parts[1]?.trim() || "",
            monto: Number.parseFloat(parts[2]?.trim() || "0"),
            referencia: parts[3]?.trim() || "",
          })
        }
      }

      // Calculate totals
      const totalIngresos = bankTransactions.filter((t) => t.monto > 0).reduce((sum, t) => sum + t.monto, 0)
      const totalEgresos = bankTransactions.filter((t) => t.monto < 0).reduce((sum, t) => sum + Math.abs(t.monto), 0)

      // Create bank statement
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const statement: Partial<BankStatement> = {
        cuentaId: selectedAccount,
        periodo: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        fechaInicio: startOfMonth.toISOString(),
        fechaFin: endOfMonth.toISOString(),
        archivoNombre: file.name,
        saldoInicial: 0,
        saldoFinal: totalIngresos - totalEgresos,
        totalIngresos,
        totalEgresos,
        estado: "procesando",
        transaccionesConciliadas: 0,
        transaccionesPendientes: bankTransactions.length,
        diferencia: 0,
      }

      const createdStatement = await createStatement(statement)

      // Reconcile transactions
      let conciliadas = 0
      let pendientes = 0

      for (const bankTrx of bankTransactions) {
        // Try to match with system transactions
        const matchingTransaction = transactions.find((sysTrx) => {
          const sysDate = sysTrx.fecha instanceof Date ? sysTrx.fecha : new Date(sysTrx.fecha as string)
          const bankDate = new Date(bankTrx.fecha)

          // Match by date (same day) and amount
          return (
            sysTrx.cuentaId === selectedAccount &&
            sysDate.toDateString() === bankDate.toDateString() &&
            Math.abs(sysTrx.monto) === Math.abs(bankTrx.monto)
          )
        })

        const reconciliationItem: Partial<ReconciliationItem> = {
          estadoCuentaId: createdStatement.id,
          transaccionSistemaId: matchingTransaction?.id,
          fecha: bankTrx.fecha,
          concepto: bankTrx.concepto,
          montoSistema: matchingTransaction?.monto || 0,
          montoBanco: bankTrx.monto,
          diferencia: matchingTransaction ? 0 : bankTrx.monto,
          estado: matchingTransaction ? "conciliado" : "pendiente",
        }

        await createReconciliationItem(reconciliationItem)

        if (matchingTransaction) {
          conciliadas++
        } else {
          pendientes++
        }
      }

      toast({
        title: "Conciliación Completada",
        description: `${conciliadas} transacciones conciliadas, ${pendientes} pendientes`,
      })
    } catch (error) {
      console.error("[Reconciliation] Error:", error)
      toast({
        title: "Error al procesar archivo",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setReconciling(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar Estado de Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Seleccionar Cuenta</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">-- Selecciona una cuenta --</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.alias || account.banco} - {account.numeroEnmascarado}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Archivo CSV</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={!selectedAccount || reconciling}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedAccount || reconciling}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {reconciling ? "Procesando..." : "Seleccionar Archivo CSV"}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Formato del Archivo CSV
            </h4>
            <p className="text-sm text-muted-foreground">
              El archivo debe tener las siguientes columnas: Fecha, Concepto, Monto, Referencia
            </p>
            <p className="text-xs text-muted-foreground mt-2">Ejemplo: 2025-01-15,Pago Proveedor,-12500.00,REF-001</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estados de Cuenta Procesados</CardTitle>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay estados de cuenta procesados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {statements.map((statement) => {
                const account = accounts.find((a) => a.id === statement.cuentaId)
                return (
                  <Card key={statement.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {account?.alias || account?.banco} - {statement.periodo}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{statement.archivoNombre}</p>
                          <div className="flex gap-6 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Conciliadas</p>
                              <p className="text-lg font-bold text-green-500">{statement.transaccionesConciliadas}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Pendientes</p>
                              <p className="text-lg font-bold text-orange-500">{statement.transaccionesPendientes}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Diferencia</p>
                              <p className="text-lg font-bold text-red-500">
                                $
                                {Math.abs(statement.diferencia || 0).toLocaleString("es-MX", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={statement.estado === "conciliado" ? "outline" : "default"}
                          className="capitalize"
                        >
                          {statement.estado}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
