"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

export interface InventoryTablePreferences {
  visibleColumns: {
    sku: boolean
    name: boolean
    category: boolean
    lot: boolean
    expiry: boolean
    trace: boolean
    stock: boolean
    minStock: boolean
    price: boolean
    supplier: boolean
    avgDemand: boolean
    suggestedOrder: boolean
    status: boolean
  }
  demandPeriodDays: number
}

const DEFAULT_PREFERENCES: InventoryTablePreferences = {
  visibleColumns: {
    sku: true,
    name: true,
    category: true,
    lot: false,
    expiry: false,
    trace: false,
    stock: true,
    minStock: true,
    price: true,
    supplier: false,
    avgDemand: true,
    suggestedOrder: true,
    status: true,
  },
  demandPeriodDays: 30,
}

export function useUserPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<InventoryTablePreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setPreferences(DEFAULT_PREFERENCES)
      setLoading(false)
      return
    }

    loadPreferences()
  }, [user?.uid])

  const loadPreferences = async () => {
    if (!user?.uid) return

    try {
      const db = getFirebaseDb()
      const prefsPath = `users/${user.uid}/preferences/inventoryTable`
      if (process.env.NODE_ENV !== "production") {
        console.info("[Preferences] Loading preferences from:", prefsPath)
      }
      const prefsRef = doc(db, prefsPath)
      const prefsSnap = await getDoc(prefsRef)

      if (prefsSnap.exists()) {
        const data = prefsSnap.data() as InventoryTablePreferences
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...data,
          visibleColumns: {
            ...DEFAULT_PREFERENCES.visibleColumns,
            ...(data?.visibleColumns || {}),
          },
        })
      } else {
        setPreferences(DEFAULT_PREFERENCES)
        try {
          await setDoc(prefsRef, DEFAULT_PREFERENCES, { merge: true })
        } catch (error) {
          if ((error as { code?: string }).code === "permission-denied") {
            console.warn("[Preferences] Missing permissions to create defaults; using local defaults.")
          } else {
            console.error("[Preferences] Error creating default preferences:", error)
          }
        }
      }
    } catch (error) {
      if ((error as { code?: string }).code === "permission-denied") {
        console.warn("[Preferences] Missing permissions; using local defaults.")
      } else {
        console.error("[Preferences] Error loading preferences:", error)
      }
      setPreferences(DEFAULT_PREFERENCES)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async (newPreferences: InventoryTablePreferences) => {
    if (!user?.uid) return

    try {
      const db = getFirebaseDb()
      const prefsRef = doc(db, `users/${user.uid}/preferences/inventoryTable`)
      await setDoc(prefsRef, newPreferences, { merge: true })
      setPreferences(newPreferences)
    } catch (error) {
      console.error("[Preferences] Error saving preferences:", error)
      throw error
    }
  }

  return {
    preferences,
    loading,
    savePreferences,
  }
}
