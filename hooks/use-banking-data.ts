"use client"

import { useMemo } from "react"
import { useFirestore } from "./use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import type {
  BankAccount,
  BankTransaction,
  Check,
  BankTransfer,
  BankStatement,
  CashFlowPeriod,
  Order,
  Expense,
} from "@/lib/types"
import { orderBy } from "firebase/firestore"

export function useBankingData() {
  const { items: accounts, loading: loadingAccounts } = useFirestore<BankAccount>(COLLECTIONS.bankAccounts, [], true)
  const { items: transactions, loading: loadingTransactions } = useFirestore<BankTransaction>(
    COLLECTIONS.bankTransactions,
    [orderBy("fecha", "desc")],
    true,
  )
  const { items: checks } = useFirestore<Check>(COLLECTIONS.checks, [orderBy("fechaEmision", "desc")], true)
  const { items: transfers } = useFirestore<BankTransfer>(
    COLLECTIONS.bankTransfers,
    [orderBy("fechaProgramada", "desc")],
    true,
  )
  const { items: statements } = useFirestore<BankStatement>(
    COLLECTIONS.bankStatements,
    [orderBy("fechaInicio", "desc")],
    true,
  )

  // Get orders and expenses for income/expense calculations
  const { items: orders } = useFirestore<Order>(COLLECTIONS.orders, [], true)
  const { items: expenses } = useFirestore<Expense>(COLLECTIONS.expenses, [], true)

  const loading = loadingAccounts || loadingTransactions

  // Calculate total balance across all accounts
  const totalBalance = useMemo(() => {
    if (!accounts || accounts.length === 0) return 0
    return accounts.reduce((sum, account) => {
      if (account.estado !== "activa") return sum
      const balance = account.saldoActual || 0
      // Convert to MXN if needed (simplified conversion)
      if (account.moneda === "USD") return sum + balance * 17.5
      if (account.moneda === "EUR") return sum + balance * 19.0
      return sum + balance
    }, 0)
  }, [accounts])

  // Calculate monthly income and expenses
  const monthlyStats = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const monthTransactions = (transactions || []).filter((t) => {
      const date = t.fecha instanceof Date ? t.fecha : new Date(t.fecha as string)
      return date >= startOfMonth && date <= endOfMonth
    })

    const ingresos = monthTransactions.filter((t) => t.tipo === "ingreso").reduce((sum, t) => sum + (t.monto || 0), 0)

    const egresos = monthTransactions
      .filter((t) => t.tipo === "egreso")
      .reduce((sum, t) => sum + Math.abs(t.monto || 0), 0)

    return { ingresos, egresos }
  }, [transactions])

  // Generate cash flow projection
  const cashFlowData = useMemo((): CashFlowPeriod[] => {
    const now = new Date()
    const weeks: CashFlowPeriod[] = []

    // Generate 4 weeks of data
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const weekTransactions = (transactions || []).filter((t) => {
        const date = t.fecha instanceof Date ? t.fecha : new Date(t.fecha as string)
        return date >= weekStart && date <= weekEnd
      })

      const ingresosReales = weekTransactions
        .filter((t) => t.tipo === "ingreso")
        .reduce((sum, t) => sum + (t.monto || 0), 0)

      const egresosReales = weekTransactions
        .filter((t) => t.tipo === "egreso")
        .reduce((sum, t) => sum + Math.abs(t.monto || 0), 0)

      weeks.push({
        periodo: `Semana ${i + 1}`,
        fechaInicio: weekStart,
        fechaFin: weekEnd,
        ingresosReales,
        ingresosProyectados: ingresosReales * 1.1, // Simple projection: 10% growth
        egresosReales,
        egresosProyectados: egresosReales * 1.05, // Simple projection: 5% growth
        saldoInicial: 0, // Would need historical data
        saldoFinal: ingresosReales - egresosReales,
        saldoProyectado: ingresosReales * 1.1 - egresosReales * 1.05,
      })
    }

    return weeks
  }, [transactions])

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return (transactions || []).slice(0, 10)
  }, [transactions])

  return {
    accounts: accounts || [],
    transactions: transactions || [],
    checks: checks || [],
    transfers: transfers || [],
    statements: statements || [],
    recentTransactions,
    totalBalance,
    monthlyIncome: monthlyStats.ingresos,
    monthlyExpenses: monthlyStats.egresos,
    cashFlowData,
    loading,
    activeAccountsCount: (accounts || []).filter((a) => a.estado === "activa").length,
  }
}
