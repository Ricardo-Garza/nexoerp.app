"use client"

import { useMemo, useCallback } from "react"
import { asDate } from "@/lib/utils/dates"
import { useFirestore } from "./use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import type { LedgerAccount, JournalEntry, Budget } from "@/lib/types"
import { orderBy } from "firebase/firestore"

export function useAccountingData() {
  const {
    items: ledgerAccounts,
    loading: loadingAccounts,
    addItem: addAccount,
    updateItem: updateAccount,
    deleteItem: deleteAccount,
  } = useFirestore<LedgerAccount>(COLLECTIONS.ledgerAccounts, [orderBy("codigo", "asc")], true)

  const {
    items: journalEntries,
    loading: loadingEntries,
    addItem: addEntry,
    updateItem: updateEntry,
    deleteItem: deleteEntry,
  } = useFirestore<JournalEntry>(COLLECTIONS.journalEntries, [orderBy("fecha", "desc")], true)

  const {
    items: budgets,
    loading: loadingBudgets,
    addItem: addBudget,
    updateItem: updateBudget,
    deleteItem: deleteBudget,
  } = useFirestore<Budget>(COLLECTIONS.budgets, [orderBy("año", "desc")], true)

  const safeAccounts = Array.isArray(ledgerAccounts) ? ledgerAccounts : []
  const safeEntries = Array.isArray(journalEntries) ? journalEntries : []
  const safeBudgets = Array.isArray(budgets) ? budgets : []

  const balanceGeneral = useMemo(() => {
    if (safeAccounts.length === 0) return 0

    const activoCuentas = safeAccounts.filter((acc) => acc.tipo === "Activo" && acc.acumulaSaldo)
    const pasivoCuentas = safeAccounts.filter((acc) => acc.tipo === "Pasivo" && acc.acumulaSaldo)
    const capitalCuentas = safeAccounts.filter((acc) => acc.tipo === "Capital" && acc.acumulaSaldo)

    const totalActivo = activoCuentas.reduce((sum, acc) => sum + (acc.saldo || 0), 0)
    const totalPasivo = pasivoCuentas.reduce((sum, acc) => sum + (acc.saldo || 0), 0)
    const totalCapital = capitalCuentas.reduce((sum, acc) => sum + (acc.saldo || 0), 0)

    return totalActivo - totalPasivo - totalCapital
  }, [safeAccounts])

  const ingresosDelMes = useMemo(() => {
    if (safeEntries.length === 0) return 0

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    return safeEntries
      .filter((entry) => {
        if (entry.estado !== "autorizada") return false
        const entryDate = entry.fecha instanceof Date ? entry.fecha : asDate(entry.fecha)
        return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear
      })
      .filter((entry) => entry.tipo === "Ingresos")
      .reduce((sum, entry) => sum + (entry.totalAbonos || 0), 0)
  }, [safeEntries])

  const egresosDelMes = useMemo(() => {
    if (safeEntries.length === 0) return 0

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    return safeEntries
      .filter((entry) => {
        if (entry.estado !== "autorizada") return false
        const entryDate = entry.fecha instanceof Date ? entry.fecha : asDate(entry.fecha)
        return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear
      })
      .filter((entry) => entry.tipo === "Egresos")
      .reduce((sum, entry) => sum + (entry.totalCargos || 0), 0)
  }, [safeEntries])

  // Journal entry stats
  const polizasDelMes = useMemo(() => {
    if (safeEntries.length === 0) return 0

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    return safeEntries.filter((entry) => {
      const entryDate = entry.fecha instanceof Date ? entry.fecha : asDate(entry.fecha)
      return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear
    }).length
  }, [safeEntries])

  const polizasPendientes = useMemo(() => {
    if (safeEntries.length === 0) return 0
    return safeEntries.filter((entry) => entry.estado === "borrador").length
  }, [safeEntries])

  // Active budget
  const presupuestoActivo = useMemo(() => {
    if (safeBudgets.length === 0) return null
    return safeBudgets.find((b) => b.estado === "activo") || null
  }, [safeBudgets])

  const generateJournalEntry = useCallback(
    async (
      sourceType:
        | "salesOrder"
        | "salesInvoice"
        | "delivery"
        | "purchaseOrder"
        | "goodsReceipt"
        | "accountPayable"
        | "bankTransaction"
        | "serviceTicket"
        | "workOrder"
        | "fieldServiceOrder",
      sourceId: string,
      sourceFolio: string,
      movimientos: Array<{
        cuentaId: string
        cuentaCodigo: string
        cuentaNombre: string
        tipo: "cargo" | "abono"
        monto: number
      }>,
      concepto: string,
      fecha?: Date,
    ) => {
      const totalCargos = movimientos.filter((m) => m.tipo === "cargo").reduce((sum, m) => sum + m.monto, 0)
      const totalAbonos = movimientos.filter((m) => m.tipo === "abono").reduce((sum, m) => sum + m.monto, 0)
      const diferencia = totalCargos - totalAbonos

      if (Math.abs(diferencia) > 0.01) {
        console.error("[Accounting] Unbalanced entry, cannot post:", { totalCargos, totalAbonos, diferencia })
        return null
      }

      const now = new Date()
      const año = now.getFullYear()
      const mes = String(now.getMonth() + 1).padStart(2, "0")
      const folio = `POL-${año}${mes}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`

      const entryType =
        sourceType === "salesOrder" || sourceType === "salesInvoice" || sourceType === "delivery"
          ? "Ingresos"
          : sourceType === "purchaseOrder" || sourceType === "goodsReceipt" || sourceType === "accountPayable"
            ? "Egresos"
            : "Diario"

      try {
        await addEntry({
          folio,
          tipo: entryType,
          fecha: fecha || now.toISOString(),
          concepto,
          referencia: sourceFolio,
          estado: "autorizada",
          movimientos,
          totalCargos,
          totalAbonos,
          diferencia,
          sourceType,
          sourceId,
          sourceFolio,
          autoPosted: true,
        } as any)

        // Update ledger account balances
        for (const mov of movimientos) {
          const account = safeAccounts.find((a) => a.id === mov.cuentaId)
          if (account) {
            const newBalance =
              mov.tipo === "cargo" ? (account.saldo || 0) + mov.monto : (account.saldo || 0) - mov.monto

            await updateAccount(account.id, {
              saldo: newBalance,
              movimientos: (account.movimientos || 0) + 1,
            } as any)
          }
        }

        return folio
      } catch (error) {
        console.error("[Accounting] Error generating journal entry:", error)
        return null
      }
    },
    [addEntry, safeAccounts, updateAccount],
  )

  const loading = loadingAccounts || loadingEntries || loadingBudgets

  return {
    // Data with safe defaults
    ledgerAccounts: safeAccounts,
    journalEntries: safeEntries,
    budgets: safeBudgets,

    // KPIs
    balanceGeneral,
    ingresosDelMes,
    egresosDelMes,
    polizasDelMes,
    polizasPendientes,
    presupuestoActivo,

    // Loading state
    loading,

    // CRUD methods
    addAccount,
    updateAccount,
    deleteAccount,
    addEntry,
    updateEntry,
    deleteEntry,
    addBudget,
    updateBudget,
    deleteBudget,

    // Automatic posting
    generateJournalEntry,
  }
}
