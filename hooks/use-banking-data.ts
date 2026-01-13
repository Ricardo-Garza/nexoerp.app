"use client"

import { useMemo, useEffect, useState } from "react"
import { useFirestore } from "./use-firestore"
import { COLLECTIONS, migrateDocumentsWithoutUserId } from "@/lib/firestore"
import type { BankAccount, Check, BankTransfer, BankTransaction, CashFlowPeriod } from "@/lib/types"
import { orderBy } from "firebase/firestore"

export function useBankingData() {
  const [migrationDone, setMigrationDone] = useState(false)

  useEffect(() => {
    const runMigration = async () => {
      if (!migrationDone) {
        try {
          const results = await Promise.all([
            migrateDocumentsWithoutUserId(COLLECTIONS.bankAccounts),
            migrateDocumentsWithoutUserId(COLLECTIONS.checks),
            migrateDocumentsWithoutUserId(COLLECTIONS.bankTransfers),
            migrateDocumentsWithoutUserId(COLLECTIONS.bankTransactions),
          ])
          setMigrationDone(true)
        } catch (error) {
          console.error("[useBankingData] Migration error:", error)
        }
      }
    }

    runMigration()
  }, [migrationDone])

  const {
    items: bankAccounts,
    loading: loadingAccounts,
    create: createBankAccount,
    update: updateBankAccount,
    remove: removeBankAccount,
  } = useFirestore<BankAccount>(COLLECTIONS.bankAccounts, [orderBy("alias", "asc")], true)

  const {
    items: checks,
    loading: loadingChecks,
    create: createCheck,
    update: updateCheck,
    remove: removeCheck,
  } = useFirestore<Check>(COLLECTIONS.checks, [orderBy("fechaEmision", "desc")], true)

  const {
    items: transfers,
    loading: loadingTransfers,
    create: createTransfer,
    update: updateTransfer,
    remove: removeTransfer,
  } = useFirestore<BankTransfer>(COLLECTIONS.bankTransfers, [orderBy("fechaProgramada", "desc")], true)

  const {
    items: transactions,
    loading: loadingTransactions,
    create: createTransaction,
    update: updateTransaction,
    remove: removeTransaction,
  } = useFirestore<BankTransaction>(COLLECTIONS.bankTransactions, [orderBy("fecha", "desc")], true)

  const loading = loadingAccounts || loadingChecks || loadingTransfers || loadingTransactions

  const totalBalance = useMemo(() => {
    return (bankAccounts || []).reduce((sum, account) => sum + (account.saldoActual || 0), 0)
  }, [bankAccounts])

  const activeAccountsCount = useMemo(() => {
    return (bankAccounts || []).filter((a) => a.estado === "activa").length
  }, [bankAccounts])

  const monthlyIncome = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return (transactions || [])
      .filter((t) => {
        const date = t.fecha instanceof Date ? t.fecha : new Date(t.fecha)
        return date >= startOfMonth && t.tipo === "ingreso"
      })
      .reduce((sum, t) => sum + (t.monto || 0), 0)
  }, [transactions])

  const monthlyExpenses = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return (transactions || [])
      .filter((t) => {
        const date = t.fecha instanceof Date ? t.fecha : new Date(t.fecha)
        return date >= startOfMonth && t.tipo === "egreso"
      })
      .reduce((sum, t) => sum + (t.monto || 0), 0)
  }, [transactions])

  const recentTransactions = useMemo(() => {
    return (transactions || []).slice(0, 10)
  }, [transactions])

  const cashFlowData = useMemo<CashFlowPeriod[]>(() => {
    const grouped = new Map<
      string,
      { periodStart: Date; periodEnd: Date; ingresosReales: number; egresosReales: number }
    >()

    ;(transactions || []).forEach((t) => {
      const date = t.fecha instanceof Date ? t.fecha : new Date(t.fecha)
      if (Number.isNaN(date.getTime())) return

      const periodStart = new Date(date)
      periodStart.setHours(0, 0, 0, 0)
      periodStart.setDate(periodStart.getDate() - periodStart.getDay())

      const periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 6)

      const key = periodStart.toISOString().slice(0, 10)
      const entry = grouped.get(key) || {
        periodStart,
        periodEnd,
        ingresosReales: 0,
        egresosReales: 0,
      }

      if (t.tipo === "ingreso") {
        entry.ingresosReales += t.monto || 0
      }
      if (t.tipo === "egreso") {
        entry.egresosReales += t.monto || 0
      }

      grouped.set(key, entry)
    })

    const periods = Array.from(grouped.values())
      .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime())
      .map((period) => ({
        periodo: `${period.periodStart.toLocaleDateString("es-MX")} - ${period.periodEnd.toLocaleDateString("es-MX")}`,
        fechaInicio: period.periodStart,
        fechaFin: period.periodEnd,
        ingresosReales: period.ingresosReales,
        egresosReales: period.egresosReales,
        ingresosProyectados: 0,
        egresosProyectados: 0,
        saldoInicial: 0,
        saldoFinal: period.ingresosReales - period.egresosReales,
        saldoProyectado: 0,
      }))

    let runningBalance = 0
    return periods.map((period) => {
      const saldoInicial = runningBalance
      runningBalance += period.ingresosReales - period.egresosReales
      return {
        ...period,
        saldoInicial,
        saldoFinal: runningBalance,
        saldoProyectado: runningBalance,
      }
    })
  }, [transactions])

  return {
    bankAccounts: bankAccounts || [],
    accounts: bankAccounts || [],
    checks: checks || [],
    transfers: transfers || [],
    transactions: transactions || [],

    createBankAccount,
    updateBankAccount,
    removeBankAccount,
    createAccount: createBankAccount,
    updateAccount: updateBankAccount,
    removeAccount: removeBankAccount,

    createCheck,
    updateCheck,
    removeCheck,
    createTransfer,
    updateTransfer,
    removeTransfer,
    createTransaction,
    updateTransaction,
    removeTransaction,

    totalBalance,
    activeAccountsCount,
    monthlyIncome,
    monthlyExpenses,
    recentTransactions,
    cashFlowData,

    loading,
  }
}
