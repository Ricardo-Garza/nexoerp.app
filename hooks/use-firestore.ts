"use client"

import { useState, useEffect, useCallback } from "react"
import type { QueryConstraint } from "firebase/firestore"
import { where } from "firebase/firestore"
import {
  getItems as firestoreGetItems,
  addItem as firestoreAddItem,
  updateItem as firestoreUpdateItem,
  deleteItem as firestoreDeleteItem,
  subscribeToCollection,
  type CollectionName,
} from "@/lib/firestore"
import { getAuthMode } from "@/lib/config/auth-mode"
import { getAuth } from "@/lib/firebase"

export function useFirestore<T extends { id: string }>(
  collectionName: CollectionName,
  constraints: QueryConstraint[] = [],
  realtime = true,
  userScoped = true,
) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Modo demo: no hay Firebase configurado. Los módulos legacy basados en
    // Firestore muestran estado vacío; el dominio DELAR usa el store en memoria.
    if (getAuthMode() === "demo") {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      setLoading(false)
      setError("Usuario no autenticado")
      return
    }

    const userConstraints = userScoped ? [where("userId", "==", currentUser.uid), ...constraints] : constraints

    if (realtime) {
      const unsubscribe = subscribeToCollection<T>(
        collectionName,
        (newItems) => {
          const sanitized = Array.isArray(newItems) ? newItems.filter((item) => item && typeof item === "object") : []
          setItems(sanitized)
          setLoading(false)
          setError(null)
        },
        userConstraints,
      )

      return () => {
        unsubscribe()
      }
    } else {
      loadItems(userConstraints)
    }
  }, [collectionName, realtime])

  const loadItems = useCallback(
    async (userConstraints?: QueryConstraint[]) => {
      if (getAuthMode() === "demo") {
        setItems([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const auth = getAuth()
        const currentUser = auth.currentUser

        if (!currentUser) {
          throw new Error("Usuario no autenticado")
        }

        const finalConstraints = userConstraints || (userScoped ? [where("userId", "==", currentUser.uid), ...constraints] : constraints)
        const data = await firestoreGetItems<T>(collectionName, finalConstraints)
        const sanitized = Array.isArray(data) ? data.filter((item) => item && typeof item === "object") : []
        setItems(sanitized)
        setError(null)
      } catch (err) {
        console.error(`[useFirestore] Error loading ${collectionName}:`, err)
        setError(err instanceof Error ? err.message : "Error al cargar datos")
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [collectionName, constraints],
  )

  const create = useCallback(
    async (item: Omit<T, "id">) => {
      try {
        const auth = getAuth()
        const currentUser = auth.currentUser

        if (!currentUser) {
          throw new Error("No se puede crear: usuario no autenticado")
        }

        const newItem = await firestoreAddItem<T>(collectionName, item)

        if (!realtime) {
          await loadItems()
        }

        return newItem
      } catch (err) {
        console.error(`[useFirestore] Error creating item in ${collectionName}:`, err)
        throw err
      }
    },
    [collectionName, realtime, loadItems],
  )

  const update = useCallback(
    async (id: string, updates: Partial<T>) => {
      try {
        const updated = await firestoreUpdateItem<T>(collectionName, id, updates)
        if (!realtime) {
          await loadItems()
        }
        return updated
      } catch (err) {
        console.error(`[useFirestore] Error updating item ${id} in ${collectionName}:`, err)
        throw err
      }
    },
    [collectionName, realtime, loadItems],
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        const success = await firestoreDeleteItem(collectionName, id)
        if (!realtime) {
          await loadItems()
        }
        return success
      } catch (err) {
        console.error(`[useFirestore] Error deleting item ${id} from ${collectionName}:`, err)
        throw err
      }
    },
    [collectionName, realtime, loadItems],
  )

  return {
    items,
    loading,
    error,
    create,
    update,
    remove,
    refresh: loadItems,
    // Alias legacy: hooks/páginas v0 consumen estos nombres
    addItem: create,
    updateItem: update,
    deleteItem: remove,
  }
}
